const mongoose = require("mongoose");
const BuddyRead = require("../models/BuddyRead");
const BookClub = require("../models/BookClub");
const User = require("../models/User");
const Book = require("../models/Book");
const Notification = require("../models/Notification");
const LibraryEntry = require("../models/LibraryEntry");
const { emitToUser, emitToBuddyRead } = require("../services/socketService");
const {
  notifyBuddyInvite,
  notifyBuddyMessage,
  notifyBuddyProgress,
  notifyMilestoneUnlocked,
  notifyNewFollower,
} = require("../services/emailService");

// ================= BUDDY READS =================
const createBuddyRead = async (req, res) => {
  try {
    const rawUserId = req.user ? (req.user._id || req.user.userId) : null;
    let userId = rawUserId;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      const existingUser = await User.findOne(req.user?.email ? { email: req.user.email.toLowerCase().trim() } : {});
      userId = existingUser ? existingUser._id : new mongoose.Types.ObjectId();
    }

    const { bookId, title, targetFinishDate, milestones = [], partnerId, bookData } = req.body;

    // Safely resolve book from MongoDB or by ISBN/title, or auto-upsert in MongoDB
    let book = null;
    if (bookId && mongoose.Types.ObjectId.isValid(bookId)) {
      book = await Book.findById(bookId);
    }
    if (!book && (bookId || bookData)) {
      const searchCrit = [];
      if (bookId) searchCrit.push({ isbn: bookId }, { title: bookId });
      if (bookData?.isbn) searchCrit.push({ isbn: bookData.isbn });
      if (bookData?.title) searchCrit.push({ title: bookData.title });
      if (searchCrit.length > 0) {
        book = await Book.findOne({ $or: searchCrit });
      }
    }
    if (!book && (bookData || bookId)) {
      try {
        const bd = bookData || {};
        book = await Book.create({
          title: bd.title || (typeof bookId === "string" && !mongoose.Types.ObjectId.isValid(bookId) ? bookId : title) || "Buddy Read Book",
          author: bd.author || "Curated Author",
          cover: bd.cover || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400",
          pages: bd.pages || 300,
          genre: bd.genre || "Fiction",
          isbn: bd.isbn || (typeof bookId === "string" ? bookId : `isbn_${Date.now()}`),
        });
      } catch (err) {
        console.warn("[Auto-create book in BuddyRead failed]:", err.message);
      }
    }
    if (!book) {
      book = await Book.findOne();
    }
    if (!book) {
      book = await Book.create({
        title: title || "Selected Reading",
        author: "Curated Author",
        cover: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400",
        pages: 300,
        genre: "Fiction",
        isbn: `readora_${Date.now()}`,
      });
    }

    const resolvedBookId = book._id;
    const totalPages = book.pages || 300;

    // Build 4-checkpoint reading milestones if not specified
    const defaultMilestones = [
      { name: "25% Quarter Checkpoint", targetPage: Math.max(1, Math.round(totalPages * 0.25)), completedBy: [] },
      { name: "50% Halfway Checkpoint", targetPage: Math.max(2, Math.round(totalPages * 0.5)), completedBy: [] },
      { name: "75% Three-Quarter Checkpoint", targetPage: Math.max(3, Math.round(totalPages * 0.75)), completedBy: [] },
      { name: "100% Reading Complete", targetPage: totalPages, completedBy: [] },
    ];

    // Safely resolve reading partner (mandatory for Buddy Reads)
    let partnerUser = null;
    if (partnerId) {
      if (mongoose.Types.ObjectId.isValid(partnerId)) {
        partnerUser = await User.findById(partnerId);
      } else if (typeof partnerId === "string" && partnerId.includes("@")) {
        partnerUser = await User.findOne({ email: partnerId.toLowerCase().trim() });
        if (!partnerUser) {
          partnerUser = await User.create({
            name: partnerId.split("@")[0],
            email: partnerId.toLowerCase().trim(),
            bio: "Invited reading companion",
          });
        }
      }
    }

    // If still no partner, pair with an active community reader
    if (!partnerUser) {
      partnerUser = await User.findOne({ _id: { $ne: userId } });
    }
    if (!partnerUser) {
      partnerUser = await User.create({
        name: "Fellow Reader",
        email: "fellow_reader@readora.com",
        bio: "Curated reading companion",
      });
    }

    const participants = [{ userId, currentPage: 0, percentage: 0 }];
    if (partnerUser && partnerUser._id.toString() !== userId.toString()) {
      participants.push({ userId: partnerUser._id, currentPage: 0, percentage: 0 });
    }

    const buddyRead = new BuddyRead({
      bookId: resolvedBookId,
      creatorId: userId,
      title: title || `${book.title} Buddy Read`,
      targetFinishDate,
      participants,
      milestones: milestones.length ? milestones : defaultMilestones,
    });

    await buddyRead.save();
    await buddyRead.populate("bookId", "title author cover pages genre");
    await buddyRead.populate("creatorId", "name avatar email");
    await buddyRead.populate("participants.userId", "name avatar email");

    // If a partner was invited, dispatch live websocket notification + registered email notification
    if (partnerUser && partnerUser._id.toString() !== userId.toString()) {
      const senderName = req.user?.name || "A fellow reader";
      const notif = await Notification.create({
        userId: partnerUser._id,
        senderId: userId,
        senderName: senderName,
        type: "buddy_read",
        title: "Buddy Read Invitation! ✦",
        message: `${senderName} invited you to read "${buddyRead.bookId?.title || buddyRead.title}" together!`,
        link: "/community",
      });

      const notifData = {
        _id: notif._id.toString(),
        userId: notif.userId.toString(),
        senderId: notif.senderId?.toString(),
        senderName: notif.senderName,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        link: notif.link,
        createdAt: notif.createdAt || new Date(),
      };

      // Emit to partner's user ID and partner's email room
      emitToUser(partnerUser._id, "notification:new", notifData);
      emitToUser(partnerUser._id, "buddyread:invite", buddyRead);
      if (partnerUser.email) {
        emitToUser(partnerUser.email, "notification:new", notifData);
        emitToUser(partnerUser.email, "buddyread:invite", buddyRead);
      }

      // Also notify creator with confirmation toast
      emitToUser(userId, "notification:new", {
        _id: new mongoose.Types.ObjectId().toString(),
        userId: userId.toString(),
        senderName: "Readora Fellowship",
        type: "buddy_read",
        title: "Invitation Dispatched! ✦",
        message: `Your Buddy Read invitation for "${buddyRead.bookId?.title || buddyRead.title}" was dispatched to ${partnerUser.name || partnerUser.email}!`,
        link: "/community",
        createdAt: new Date(),
      });

      // Dispatch invitation email to partner
      if (partnerUser.email) {
        notifyBuddyInvite({
          recipientEmail: partnerUser.email,
          recipientName: partnerUser.name || "Reader",
          senderName: senderName,
          buddyTitle: buddyRead.title,
          bookTitle: buddyRead.bookId?.title,
        }).catch((err) => console.warn("[Email dispatch error]:", err.message));
      }
    }

    res.status(201).json(buddyRead);
  } catch (error) {
    console.error("[createBuddyRead error]:", error);
    res.status(400).json({ message: error.message });
  }
};

const getBuddyReads = async (req, res) => {
  try {
    const rawUserId = req.user ? (req.user._id || req.user.userId) : null;
    let query = {};
    if (req.query.scope === "mine" && rawUserId) {
      let uid = rawUserId;
      if (mongoose.Types.ObjectId.isValid(uid)) {
        uid = new mongoose.Types.ObjectId(uid);
      }
      query = { $or: [{ creatorId: uid }, { "participants.userId": uid }] };
    }

    const buddyReads = await BuddyRead.find(query)
      .populate("bookId", "title author cover pages genre")
      .populate("participants.userId", "name avatar email")
      .populate("creatorId", "name avatar email")
      .sort({ updatedAt: -1 });

    res.json(buddyReads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getBuddyReadById = async (req, res) => {
  try {
    const buddyRead = await BuddyRead.findById(req.params.id)
      .populate("bookId", "title author cover pages")
      .populate("participants.userId", "name avatar");

    if (!buddyRead) return res.status(404).json({ message: "Buddy read not found" });
    res.json(buddyRead);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const joinBuddyRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const buddyRead = await BuddyRead.findById(req.params.id);
    if (!buddyRead) return res.status(404).json({ message: "Buddy read not found" });

    const exists = buddyRead.participants.some(
      (p) => p.userId?.toString() === userId.toString()
    );

    if (!exists) {
      buddyRead.participants.push({
        userId,
        currentPage: 0,
        percentage: 0,
      });
      await buddyRead.save();

      // Notify creator
      if (buddyRead.creatorId.toString() !== userId.toString()) {
        const notif = await Notification.create({
          userId: buddyRead.creatorId,
          senderId: userId,
          senderName: req.user.name || "Reader",
          type: "buddy_read",
          title: "Buddy Read Joined! ✦",
          message: `${req.user.name || "A reader"} joined your buddy read of "${buddyRead.title}"!`,
          link: "/community",
        });
        emitToUser(buddyRead.creatorId, "notification:new", notif);

        const creatorUser = await User.findById(buddyRead.creatorId);
        if (creatorUser && creatorUser.email) {
          notifyBuddyMessage({
            recipientEmail: creatorUser.email,
            recipientName: creatorUser.name,
            senderName: req.user.name || "A reader",
            buddyTitle: buddyRead.title,
            bookTitle: buddyRead.bookId?.title,
            messageText: `${req.user.name || "A reader"} joined your Buddy Read room and is ready to read together!`,
            page: 0,
          }).catch((err) => console.warn("[Email dispatch error]:", err.message));
        }
      }
    }

    await buddyRead.populate("bookId", "title author cover pages genre");
    await buddyRead.populate("participants.userId", "name avatar email");
    res.json(buddyRead);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateBuddyProgress = async (req, res) => {
  try {
    const userId = req.user._id;
    const { currentPage } = req.body;
    const buddyRead = await BuddyRead.findById(req.params.id).populate("bookId");
    if (!buddyRead) return res.status(404).json({ message: "Buddy read not found" });

    const participant = buddyRead.participants.find(
      (p) => p.userId?.toString() === userId.toString()
    );

    if (participant) {
      participant.currentPage = parseInt(currentPage);
      const total = buddyRead.bookId?.pages || 300;
      participant.percentage = Math.min(100, Math.round((participant.currentPage / total) * 100));

      // Check milestones
      const newlyCompletedMilestones = [];
      buddyRead.milestones.forEach((m) => {
        if (participant.currentPage >= m.targetPage && !m.completedBy.includes(userId)) {
          m.completedBy.push(userId);
          newlyCompletedMilestones.push(m);
        }
      });

      await buddyRead.save();

      // Emit real-time buddyread:progress event
      emitToBuddyRead(buddyRead._id, "buddyread:progress", {
        buddyReadId: buddyRead._id.toString(),
        userId: userId.toString(),
        userName: req.user.name,
        currentPage: participant.currentPage,
        percentage: participant.percentage,
        milestones: buddyRead.milestones,
      });

      // Notify other participants via Email and In-App
      const otherParticipantIds = [
        ...new Set(
          [buddyRead.creatorId, ...buddyRead.participants.map((p) => p.userId)]
            .filter((id) => id && id.toString() !== userId.toString())
            .map((id) => id.toString())
        ),
      ];

      for (const targetId of otherParticipantIds) {
        const targetUser = await User.findById(targetId);
        if (targetUser && targetUser.email) {
          notifyBuddyProgress({
            recipientEmail: targetUser.email,
            recipientName: targetUser.name,
            partnerName: req.user.name || "Your reading partner",
            buddyTitle: buddyRead.title,
            bookTitle: buddyRead.bookId?.title || buddyRead.title,
            currentPage: participant.currentPage,
            percentage: participant.percentage,
            totalPages: total,
          }).catch((err) => console.warn("[Email dispatch error]:", err.message));
        }
      }

      // Emit challenge:milestone and notification if milestones reached
      for (const m of newlyCompletedMilestones) {
        const milestoneData = {
          buddyReadId: buddyRead._id.toString(),
          milestoneId: m._id,
          name: m.name,
          targetPage: m.targetPage,
          userId: userId.toString(),
          userName: req.user.name,
          bookTitle: buddyRead.bookId?.title || buddyRead.title,
        };

        emitToBuddyRead(buddyRead._id, "challenge:milestone", milestoneData);
        emitToUser(userId, "challenge:milestone", milestoneData);

        const notif = await Notification.create({
          userId,
          senderId: userId,
          senderName: "Readora Milestones",
          type: "milestone",
          title: "Milestone Reached! ✦",
          message: `You reached the "${m.name}" milestone at page ${m.targetPage}!`,
          link: "/community",
        });
        emitToUser(userId, "notification:new", notif);

        // Send milestone email to registered user email
        if (req.user.email) {
          notifyMilestoneUnlocked({
            recipientEmail: req.user.email,
            recipientName: req.user.name,
            milestoneName: m.name,
            targetPage: m.targetPage,
            bookTitle: buddyRead.bookId?.title,
            buddyTitle: buddyRead.title,
          }).catch((err) => console.warn("[Email dispatch error]:", err.message));
        }
      }
    }

    res.json(buddyRead);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const postBuddyMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { text, page = 0, isSpoiler = false } = req.body;

    const buddyRead = await BuddyRead.findById(req.params.id).populate("bookId", "title");
    if (!buddyRead) return res.status(404).json({ message: "Buddy read not found" });

    const newMsg = {
      userId,
      userName: req.user.name || "Reader",
      userAvatar: req.user.avatar || "",
      text,
      page: parseInt(page),
      isSpoiler,
      createdAt: new Date(),
    };

    buddyRead.messages.push(newMsg);
    await buddyRead.save();

    const savedMsg = buddyRead.messages[buddyRead.messages.length - 1];

    // Emit real-time buddyread:message event
    emitToBuddyRead(buddyRead._id, "buddyread:message", {
      buddyReadId: buddyRead._id.toString(),
      message: savedMsg,
    });

    // Notify other participants via WebSocket and registered email
    const otherParticipantIds = [
      ...new Set(
        [buddyRead.creatorId, ...buddyRead.participants.map((p) => p.userId)]
          .filter((id) => id && id.toString() !== userId.toString())
          .map((id) => id.toString())
      ),
    ];

    for (const targetId of otherParticipantIds) {
      const notif = await Notification.create({
        userId: targetId,
        senderId: userId,
        senderName: req.user.name || "Reader",
        type: "buddy_read",
        title: "New Buddy Read Message",
        message: `${req.user.name || "A reader"} sent a message in "${buddyRead.title}"`,
        link: "/community",
      });
      emitToUser(targetId, "notification:new", {
        _id: notif._id.toString(),
        userId: notif.userId.toString(),
        senderId: notif.senderId?.toString(),
        senderName: notif.senderName,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        link: notif.link,
        createdAt: notif.createdAt || new Date(),
      });

      const targetUser = await User.findById(targetId);
      if (targetUser && targetUser.email) {
        notifyBuddyMessage({
          recipientEmail: targetUser.email,
          recipientName: targetUser.name,
          senderName: req.user.name || "A reader",
          buddyTitle: buddyRead.title,
          bookTitle: buddyRead.bookId?.title,
          messageText: text,
          page: parseInt(page) || 0,
        }).catch((err) => console.warn("[Email dispatch error]:", err.message));
      }
    }

    res.status(201).json(savedMsg);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ================= BOOK CLUBS =================
const createBookClub = async (req, res) => {
  try {
    const rawUserId = req.user ? (req.user._id || req.user.userId) : null;
    let userId = rawUserId;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      const existingUser = await User.findOne(req.user?.email ? { email: req.user.email.toLowerCase().trim() } : {});
      userId = existingUser ? existingUser._id : new mongoose.Types.ObjectId();
    }

    const { name, description, genre = "General Fiction" } = req.body;

    const club = new BookClub({
      name,
      description,
      genre,
      creatorId: userId,
      members: [{ userId, role: "admin" }],
    });

    await club.save();
    await club.populate("creatorId", "name avatar email");
    res.status(201).json(club);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getBookClubs = async (req, res) => {
  try {
    const clubs = await BookClub.find({})
      .populate("currentBook.bookId", "title author cover")
      .populate("creatorId", "name avatar")
      .populate("members.userId", "name avatar");

    res.json(clubs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const joinBookClub = async (req, res) => {
  try {
    const userId = req.user._id;
    const club = await BookClub.findById(req.params.id);
    if (!club) return res.status(404).json({ message: "Book club not found" });

    const isMember = club.members.some((m) => m.userId?.toString() === userId.toString());
    if (!isMember) {
      club.members.push({ userId, role: "member" });
      await club.save();
    }

    res.json(club);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const voteForClubBook = async (req, res) => {
  try {
    const userId = req.user._id;
    const { bookId } = req.body;
    const club = await BookClub.findById(req.params.id);
    if (!club) return res.status(404).json({ message: "Book club not found" });

    let nom = club.nominations.find((n) => n.bookId?.toString() === bookId);
    if (!nom) {
      nom = { bookId, nominatedBy: userId, votes: [userId] };
      club.nominations.push(nom);
    } else {
      const vIndex = nom.votes.indexOf(userId);
      if (vIndex === -1) nom.votes.push(userId);
      else nom.votes.splice(vIndex, 1);
    }

    await club.save();
    res.json(club.nominations);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ================= USER PROFILES & FOLLOW =================
const getUserProfile = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const user = await User.findById(targetUserId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const readBooksCount = await LibraryEntry.countDocuments({
      userId: targetUserId,
      shelf: "Read",
    });

    const recentReads = await LibraryEntry.find({
      userId: targetUserId,
      shelf: "Read",
    })
      .populate("bookId", "title author cover")
      .limit(6);

    res.json({
      user,
      readBooksCount,
      recentReads,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const toggleFollowUser = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const targetUserId = req.params.id;

    if (currentUserId.toString() === targetUserId.toString()) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) return res.status(404).json({ message: "Target user not found" });

    const isFollowing = currentUser.following.includes(targetUserId);

    if (isFollowing) {
      currentUser.following = currentUser.following.filter(
        (id) => id.toString() !== targetUserId.toString()
      );
      targetUser.followers = targetUser.followers.filter(
        (id) => id.toString() !== currentUserId.toString()
      );
    } else {
      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);

      // Notify target
      const notif = await Notification.create({
        userId: targetUserId,
        senderId: currentUserId,
        senderName: currentUser.name,
        type: "follow",
        title: "New Follower",
        message: `${currentUser.name} started following your reading universe!`,
      });

      // Real-time follow:new & notification:new events
      emitToUser(targetUserId, "follow:new", {
        followerId: currentUserId.toString(),
        followerName: currentUser.name,
        followerAvatar: currentUser.avatar || "",
        followersCount: targetUser.followers.length,
      });

      emitToUser(targetUserId, "notification:new", {
        _id: notif._id.toString(),
        userId: notif.userId.toString(),
        senderId: notif.senderId?.toString(),
        senderName: notif.senderName,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        link: notif.link,
        createdAt: notif.createdAt || new Date(),
      });

      // Send real-time follow email to target's registered email
      if (targetUser.email) {
        notifyNewFollower({
          recipientEmail: targetUser.email,
          recipientName: targetUser.name,
          followerName: currentUser.name,
        }).catch((err) => console.warn("[Email dispatch error]:", err.message));
      }
    }

    await currentUser.save();
    await targetUser.save();

    res.json({
      isFollowing: !isFollowing,
      followersCount: targetUser.followers.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCommunityReaders = async (req, res) => {
  try {
    const readers = await User.find({})
      .select("name email avatar bio level badges streak favoriteGenres")
      .limit(50);
    res.json(readers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createBuddyRead,
  getBuddyReads,
  getBuddyReadById,
  joinBuddyRead,
  updateBuddyProgress,
  postBuddyMessage,
  createBookClub,
  getBookClubs,
  joinBookClub,
  voteForClubBook,
  getUserProfile,
  toggleFollowUser,
  getCommunityReaders,
};
