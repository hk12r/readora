const BuddyRead = require("../models/BuddyRead");
const BookClub = require("../models/BookClub");
const User = require("../models/User");
const Notification = require("../models/Notification");
const LibraryEntry = require("../models/LibraryEntry");
const { emitToUser, emitToBuddyRead } = require("../services/socketService");

// ================= BUDDY READS =================
const createBuddyRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { bookId, title, targetFinishDate, milestones = [] } = req.body;

    const buddyRead = new BuddyRead({
      bookId,
      creatorId: userId,
      title,
      targetFinishDate,
      participants: [{ userId, currentPage: 0, percentage: 0 }],
      milestones: milestones.length
        ? milestones
        : [
            { name: "First Quarter Checkpoint", targetPage: 75, completedBy: [] },
            { name: "Halfway Checkpoint", targetPage: 150, completedBy: [] },
            { name: "Final Stretch", targetPage: 250, completedBy: [] },
          ],
    });

    await buddyRead.save();
    await buddyRead.populate("bookId", "title author cover pages");
    await buddyRead.populate("creatorId", "name avatar");

    res.status(201).json(buddyRead);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getBuddyReads = async (req, res) => {
  try {
    const userId = req.user._id;
    const buddyReads = await BuddyRead.find({
      $or: [{ creatorId: userId }, { "participants.userId": userId }],
    })
      .populate("bookId", "title author cover pages")
      .populate("participants.userId", "name avatar")
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
        await Notification.create({
          userId: buddyRead.creatorId,
          senderId: userId,
          senderName: req.user.name,
          type: "buddy_read",
          title: "Buddy Read Joined",
          message: `${req.user.name} joined your buddy read of "${buddyRead.title}"!`,
        });
      }
    }

    await buddyRead.populate("bookId", "title author cover pages");
    await buddyRead.populate("participants.userId", "name avatar");
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

    const buddyRead = await BuddyRead.findById(req.params.id);
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

    // Notify other participants
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
      emitToUser(targetId, "notification:new", notif);
    }

    res.status(201).json(savedMsg);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ================= BOOK CLUBS =================
const createBookClub = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, description, genre = "General Fiction" } = req.body;

    const club = new BookClub({
      name,
      description,
      genre,
      creatorId: userId,
      members: [{ userId, role: "admin" }],
    });

    await club.save();
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

      emitToUser(targetUserId, "notification:new", notif);
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
      .select("name avatar bio level badges streak favoriteGenres")
      .limit(20);
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
