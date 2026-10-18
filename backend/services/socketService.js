const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const BuddyRead = require("../models/BuddyRead");
const Notification = require("../models/Notification");

let io = null;

/**
 * Initializes Socket.IO with JWT authentication, validation, room authorization,
 * and event handling for Experiment 8.
 *
 * Required events:
 * 1. progress:updated
 * 2. buddyread:message
 * 3. buddyread:progress
 * 4. notification:new
 * 5. challenge:milestone
 * 6. follow:new
 */
function initSocketServer(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // JWT Authentication Middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      // Extract token from handshake auth or headers
      let token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace("Bearer ", "");

      if (!token) {
        return next(new Error("Authentication error: Token required"));
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "readora_magical_secret_key_2026"
      );

      const userId = decoded.userId || decoded._id;
      const user = await User.findById(userId).select("-password");

      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }

      // Attach verified server-side user entity
      socket.user = user;
      return next();
    } catch (err) {
      return next(new Error("Authentication error: Invalid or expired token"));
    }
  });

  // Connection handling
  io.on("connection", (socket) => {
    const userId = socket.user._id.toString();
    const userRoom = `user:${userId}`;

    // Join personal user room for private notifications & progress events
    socket.join(userRoom);
    console.log(`[Socket.IO] User authenticated & connected: ${socket.user.name} (${userId}) -> room: ${userRoom}`);

    // ----------------------------------------------------
    // Event: buddyread:join (Authorized room admission)
    // ----------------------------------------------------
    socket.on("buddyread:join", async ({ buddyReadId }, callback) => {
      try {
        if (!buddyReadId) {
          if (callback) callback({ success: false, error: "buddyReadId is required" });
          return;
        }

        const buddyRead = await BuddyRead.findById(buddyReadId);
        if (!buddyRead) {
          if (callback) callback({ success: false, error: "Buddy Read not found" });
          return;
        }

        // Verify authorization: must be creator or listed participant
        const isCreator = buddyRead.creatorId.toString() === userId;
        const isParticipant = buddyRead.participants.some(
          (p) => p.userId && p.userId.toString() === userId
        );

        if (!isCreator && !isParticipant) {
          if (callback) callback({ success: false, error: "Not authorized to join this Buddy Read room" });
          return;
        }

        const buddyRoom = `buddy:${buddyReadId}`;
        socket.join(buddyRoom);
        console.log(`[Socket.IO] User ${socket.user.name} joined room: ${buddyRoom}`);

        if (callback) {
          callback({
            success: true,
            buddyReadId,
            room: buddyRoom,
            user: { id: userId, name: socket.user.name },
          });
        }
      } catch (err) {
        console.error("[Socket.IO] Error joining buddy read:", err.message);
        if (callback) callback({ success: false, error: "Internal server error" });
      }
    });

    // ----------------------------------------------------
    // Event: buddyread:leave
    // ----------------------------------------------------
    socket.on("buddyread:leave", ({ buddyReadId }, callback) => {
      if (buddyReadId) {
        const buddyRoom = `buddy:${buddyReadId}`;
        socket.leave(buddyRoom);
        console.log(`[Socket.IO] User ${socket.user.name} left room: ${buddyRoom}`);
      }
      if (callback) callback({ success: true });
    });

    // ----------------------------------------------------
    // Event: buddyread:message (Chat Message in Buddy Read)
    // ----------------------------------------------------
    socket.on("buddyread:message", async (data, callback) => {
      try {
        const { buddyReadId, text, page = 0, isSpoiler = false } = data || {};

        if (!buddyReadId || !text || !text.trim()) {
          if (callback) callback({ success: false, error: "Valid buddyReadId and text required" });
          return;
        }

        const buddyRead = await BuddyRead.findById(buddyReadId);
        if (!buddyRead) {
          if (callback) callback({ success: false, error: "Buddy Read not found" });
          return;
        }

        // Authorize participant
        const isCreator = buddyRead.creatorId.toString() === userId;
        const isParticipant = buddyRead.participants.some(
          (p) => p.userId && p.userId.toString() === userId
        );

        if (!isCreator && !isParticipant) {
          if (callback) callback({ success: false, error: "Not authorized to send messages in this Buddy Read" });
          return;
        }

        // Server-side identity enforcement (client cannot spoof sender)
        const newMessage = {
          userId: socket.user._id,
          userName: socket.user.name,
          userAvatar: socket.user.avatar || "",
          text: text.trim(),
          page: parseInt(page) || 0,
          isSpoiler: Boolean(isSpoiler),
          createdAt: new Date(),
        };

        buddyRead.messages.push(newMessage);
        await buddyRead.save();

        const savedMsg = buddyRead.messages[buddyRead.messages.length - 1];
        const buddyRoom = `buddy:${buddyReadId}`;

        // Broadcast to authorized room
        io.to(buddyRoom).emit("buddyread:message", {
          buddyReadId,
          message: savedMsg,
        });

        // Notify other participants via notification:new
        const otherParticipantIds = [
          ...new Set(
            [buddyRead.creatorId, ...buddyRead.participants.map((p) => p.userId)]
              .filter((id) => id && id.toString() !== userId)
              .map((id) => id.toString())
          ),
        ];

        for (const targetId of otherParticipantIds) {
          const notification = await Notification.create({
            userId: targetId,
            senderId: socket.user._id,
            senderName: socket.user.name,
            type: "buddy_read",
            title: `New Buddy Read Message`,
            message: `${socket.user.name} sent a message in "${buddyRead.title}"`,
            link: `/community`,
          });

          emitToUser(targetId, "notification:new", notification);
        }

        if (callback) callback({ success: true, message: savedMsg });
      } catch (err) {
        console.error("[Socket.IO] Error handling buddyread:message:", err.message);
        if (callback) callback({ success: false, error: "Failed to send message" });
      }
    });

    // ----------------------------------------------------
    // Event: buddyread:progress (Progress synchronization)
    // ----------------------------------------------------
    socket.on("buddyread:progress", async (data, callback) => {
      try {
        const { buddyReadId, currentPage } = data || {};

        if (!buddyReadId || currentPage === undefined) {
          if (callback) callback({ success: false, error: "Valid buddyReadId and currentPage required" });
          return;
        }

        const buddyRead = await BuddyRead.findById(buddyReadId).populate("bookId");
        if (!buddyRead) {
          if (callback) callback({ success: false, error: "Buddy Read not found" });
          return;
        }

        const participant = buddyRead.participants.find(
          (p) => p.userId && p.userId.toString() === userId
        );

        if (!participant) {
          if (callback) callback({ success: false, error: "User is not a participant in this Buddy Read" });
          return;
        }

        const parsedPage = Math.max(0, parseInt(currentPage) || 0);
        participant.currentPage = parsedPage;
        const totalPages = buddyRead.bookId?.pages || 300;
        participant.percentage = Math.min(100, Math.round((parsedPage / totalPages) * 100));

        // Check milestones
        const newlyUnlockedMilestones = [];
        buddyRead.milestones.forEach((m) => {
          const alreadyCompleted = m.completedBy.some((id) => id.toString() === userId);
          if (parsedPage >= m.targetPage && !alreadyCompleted) {
            m.completedBy.push(socket.user._id);
            newlyUnlockedMilestones.push(m);
          }
        });

        await buddyRead.save();

        const buddyRoom = `buddy:${buddyReadId}`;

        // Broadcast progress to room
        io.to(buddyRoom).emit("buddyread:progress", {
          buddyReadId,
          userId,
          userName: socket.user.name,
          currentPage: participant.currentPage,
          percentage: participant.percentage,
          milestones: buddyRead.milestones,
        });

        // Trigger milestone events if achieved
        for (const m of newlyUnlockedMilestones) {
          const milestoneData = {
            buddyReadId,
            milestoneId: m._id,
            name: m.name,
            targetPage: m.targetPage,
            userId,
            userName: socket.user.name,
            bookTitle: buddyRead.bookId?.title || buddyRead.title,
          };

          // Emit challenge:milestone to room and user
          io.to(buddyRoom).emit("challenge:milestone", milestoneData);
          emitToUser(userId, "challenge:milestone", milestoneData);

          // Create in-app notification
          const notification = await Notification.create({
            userId: socket.user._id,
            senderId: socket.user._id,
            senderName: "Readora Milestones",
            type: "milestone",
            title: "Milestone Reached! ✦",
            message: `You reached the "${m.name}" milestone at page ${m.targetPage}!`,
            link: "/community",
          });

          emitToUser(userId, "notification:new", notification);
        }

        if (callback) {
          callback({
            success: true,
            currentPage: participant.currentPage,
            percentage: participant.percentage,
            newlyUnlockedMilestones,
          });
        }
      } catch (err) {
        console.error("[Socket.IO] Error handling buddyread:progress:", err.message);
        if (callback) callback({ success: false, error: "Failed to update buddy progress" });
      }
    });

    // ----------------------------------------------------
    // Event: progress:updated (Personal library reading progress)
    // ----------------------------------------------------
    socket.on("progress:updated", (data) => {
      // Echo progress update to all other devices/sessions of the same user
      socket.to(userRoom).emit("progress:updated", data);
    });

    // Disconnect
    socket.on("disconnect", (reason) => {
      console.log(`[Socket.IO] User disconnected: ${socket.user.name} (${reason})`);
    });
  });

  return io;
}

/**
 * Helper to emit an event to a specific user's private room
 */
function emitToUser(userId, event, data) {
  if (!io) return false;
  const userRoom = `user:${userId.toString()}`;
  io.to(userRoom).emit(event, data);
  return true;
}

/**
 * Helper to emit an event to an authorized Buddy Read room
 */
function emitToBuddyRead(buddyReadId, event, data) {
  if (!io) return false;
  const buddyRoom = `buddy:${buddyReadId.toString()}`;
  io.to(buddyRoom).emit(event, data);
  return true;
}

/**
 * Get active io instance
 */
function getIO() {
  return io;
}

module.exports = {
  initSocketServer,
  emitToUser,
  emitToBuddyRead,
  getIO,
};
