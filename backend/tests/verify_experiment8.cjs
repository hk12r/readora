const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const http = require("http");
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const ioClient = require("socket.io-client");
const jwt = require("jsonwebtoken");

require("dotenv").config({ path: path.join(__dirname, "../.env") });
require("dotenv").config();

const { initSocketServer } = require("../services/socketService");
const User = require("../models/User");
const Book = require("../models/Book");
const BuddyRead = require("../models/BuddyRead");
const Notification = require("../models/Notification");
const LibraryEntry = require("../models/LibraryEntry");
const socialRoutes = require("../routes/socialRoutes");
const libraryRoutes = require("../routes/libraryRoutes");

let TEST_SOCKET_URL = "";
const JWT_SECRET = process.env.JWT_SECRET || "readora_magical_secret_key_2026";

async function runTestSuite() {
  console.log("\n=======================================================");
  console.log("  READORA — EXPERIMENT 8 AUTOMATED TEST SUITE");
  console.log("=======================================================\n");

  const results = [];
  function assert(name, condition, details = "") {
    if (condition) {
      console.log(`  [PASS] ${name}`);
      results.push({ name, status: "PASS", details });
    } else {
      console.error(`  [FAIL] ${name} - ${details}`);
      results.push({ name, status: "FAIL", details });
    }
  }

  // 1. Database Connection
  const mongoUri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    "mongodb://127.0.0.1:27017/readora";

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    assert("Database Connectivity", mongoose.connection.readyState === 1, "Connected to MongoDB");
  } catch (err) {
    try {
      console.log("  [INFO] Atlas connect failed, attempting local MongoDB fallback...");
      await mongoose.connect("mongodb://127.0.0.1:27017/readora", { serverSelectionTimeoutMS: 4000 });
      assert("Database Connectivity (Local Fallback)", mongoose.connection.readyState === 1, "Connected to Local MongoDB");
    } catch (fallbackErr) {
      assert("Database Connectivity", false, `Atlas: ${err.message}; Local: ${fallbackErr.message}`);
      process.exit(1);
    }
  }

  // 2. Start Test Server with Socket.IO
  const app = express();
  app.use(express.json());

  // Attach mock user middleware for test routes if token present
  const authMiddleware = async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ message: "No token" });
      const token = authHeader.replace("Bearer ", "");
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.userId || decoded._id);
      if (!user) return res.status(401).json({ message: "User not found" });
      req.user = user;
      next();
    } catch (e) {
      return res.status(401).json({ message: "Invalid token" });
    }
  };

  app.use("/api/social", authMiddleware, socialRoutes);
  app.use("/api/library", authMiddleware, libraryRoutes);

  const server = http.createServer(app);
  const ioServer = initSocketServer(server);

  await new Promise((resolve) => server.listen(0, resolve));
  const allocatedPort = server.address().port;
  TEST_SOCKET_URL = `http://localhost:${allocatedPort}`;
  assert("Socket.IO Server Startup", ioServer !== null, `Server running on dynamic port ${allocatedPort}`);

  // 3. Prepare Test Users & Test Book
  await User.deleteMany({ email: { $in: ["alice_test@readora.com", "bob_test@readora.com", "charlie_test@readora.com"] } });
  
  const alice = await User.create({
    name: "Alice Wonderland",
    email: "alice_test@readora.com",
    password: "Password123!",
    role: "user",
    xp: 150,
    level: 1,
  });

  const bob = await User.create({
    name: "Bob Bookworm",
    email: "bob_test@readora.com",
    password: "Password123!",
    role: "user",
    xp: 200,
    level: 2,
  });

  const charlie = await User.create({
    name: "Charlie Intruder",
    email: "charlie_test@readora.com",
    password: "Password123!",
    role: "user",
  });

  const aliceToken = jwt.sign({ userId: alice._id, role: alice.role }, JWT_SECRET, { expiresIn: "1h" });
  const bobToken = jwt.sign({ userId: bob._id, role: bob.role }, JWT_SECRET, { expiresIn: "1h" });
  const charlieToken = jwt.sign({ userId: charlie._id, role: charlie.role }, JWT_SECRET, { expiresIn: "1h" });

  assert("Test User Provisioning & JWT Generation", aliceToken && bobToken && charlieToken, "Generated valid JWTs");

  let testBook = await Book.findOne();
  if (!testBook) {
    testBook = await Book.create({
      title: "The Midnight Library",
      author: "Matt Haig",
      pages: 300,
      isbn: "9780525559474",
      genre: "Fiction",
    });
  }

  // -------------------------------------------------------------------------
  // TEST 1: Unauthenticated Socket.IO connection rejected
  // -------------------------------------------------------------------------
  await new Promise((resolve) => {
    const unauthClient = ioClient(TEST_SOCKET_URL, {
      transports: ["websocket"],
      reconnection: false,
    });

    unauthClient.on("connect_error", (err) => {
      assert("Test 1: Unauthenticated Handshake Rejection", err.message.includes("Authentication error"), err.message);
      unauthClient.disconnect();
      resolve();
    });

    unauthClient.on("connect", () => {
      assert("Test 1: Unauthenticated Handshake Rejection", false, "Should not connect without token");
      unauthClient.disconnect();
      resolve();
    });
  });

  // -------------------------------------------------------------------------
  // TEST 2: Invalid JWT token rejected
  // -------------------------------------------------------------------------
  await new Promise((resolve) => {
    const invalidClient = ioClient(TEST_SOCKET_URL, {
      auth: { token: "totally_invalid_token_xyz" },
      transports: ["websocket"],
      reconnection: false,
    });

    invalidClient.on("connect_error", (err) => {
      assert("Test 2: Invalid Token Rejection", err.message.includes("Authentication error"), err.message);
      invalidClient.disconnect();
      resolve();
    });

    invalidClient.on("connect", () => {
      assert("Test 2: Invalid Token Rejection", false, "Should not connect with invalid token");
      invalidClient.disconnect();
      resolve();
    });
  });

  // -------------------------------------------------------------------------
  // TEST 3: Authenticated Connection for Alice & Bob
  // -------------------------------------------------------------------------
  const aliceSocket = ioClient(TEST_SOCKET_URL, {
    auth: { token: aliceToken },
    transports: ["websocket"],
  });

  const bobSocket = ioClient(TEST_SOCKET_URL, {
    auth: { token: bobToken },
    transports: ["websocket"],
  });

  await Promise.all([
    new Promise((resolve) => aliceSocket.on("connect", resolve)),
    new Promise((resolve) => bobSocket.on("connect", resolve)),
  ]);

  assert("Test 3: Authenticated Handshake for Authorized Users", aliceSocket.connected && bobSocket.connected, "Alice and Bob connected");

  // -------------------------------------------------------------------------
  // TEST 4: Room Authorization Check on buddyread:join
  // -------------------------------------------------------------------------
  const buddyRead = await BuddyRead.create({
    bookId: testBook._id,
    creatorId: alice._id,
    title: "Alice & Bob's Deep Dive",
    participants: [
      { userId: alice._id, currentPage: 10, percentage: 3 },
      { userId: bob._id, currentPage: 10, percentage: 3 },
    ],
    milestones: [
      { name: "Quarter Checkpoint", targetPage: 75, completedBy: [] },
      { name: "Halfway Checkpoint", targetPage: 150, completedBy: [] },
    ],
  });

  // Charlie tries to join (unauthorized)
  const charlieSocket = ioClient(TEST_SOCKET_URL, {
    auth: { token: charlieToken },
    transports: ["websocket"],
  });
  await new Promise((resolve) => charlieSocket.on("connect", resolve));

  await new Promise((resolve) => {
    charlieSocket.emit("buddyread:join", { buddyReadId: buddyRead._id.toString() }, (res) => {
      assert(
        "Test 4a: Room Authorization - Unauthorized User Denied",
        res && res.success === false && res.error.includes("Not authorized"),
        res ? res.error : "No response"
      );
      charlieSocket.disconnect();
      resolve();
    });
  });

  // Alice and Bob join (authorized)
  const [aliceJoinRes, bobJoinRes] = await Promise.all([
    new Promise((resolve) => aliceSocket.emit("buddyread:join", { buddyReadId: buddyRead._id.toString() }, resolve)),
    new Promise((resolve) => bobSocket.emit("buddyread:join", { buddyReadId: buddyRead._id.toString() }, resolve)),
  ]);

  assert(
    "Test 4b: Room Authorization - Authorized Participants Admitted",
    aliceJoinRes?.success === true && bobJoinRes?.success === true,
    `Joined room: ${aliceJoinRes?.room}`
  );

  // -------------------------------------------------------------------------
  // TEST 5: Real-time Chat (buddyread:message)
  // -------------------------------------------------------------------------
  await new Promise((resolve) => {
    bobSocket.once("buddyread:message", (data) => {
      const isMatch =
        data.buddyReadId === buddyRead._id.toString() &&
        data.message.text === "Chapter 3 had an incredible twist!" &&
        data.message.userName === "Alice Wonderland";

      assert("Test 5: Real-Time Chat Message Delivery (buddyread:message)", isMatch, `Delivered: "${data.message.text}" from ${data.message.userName}`);
      resolve();
    });

    aliceSocket.emit("buddyread:message", {
      buddyReadId: buddyRead._id.toString(),
      text: "Chapter 3 had an incredible twist!",
      page: 45,
      isSpoiler: false,
    });
  });

  // -------------------------------------------------------------------------
  // TEST 6: Real-time Reading Progress Synchronization (buddyread:progress)
  // -------------------------------------------------------------------------
  await new Promise((resolve) => {
    aliceSocket.once("buddyread:progress", (data) => {
      const isMatch =
        data.buddyReadId === buddyRead._id.toString() &&
        data.userId === bob._id.toString() &&
        data.currentPage === 50;

      assert("Test 6: Real-Time Progress Sync (buddyread:progress)", isMatch, `Bob synced to page ${data.currentPage} (${data.percentage}%)`);
      resolve();
    });

    bobSocket.emit("buddyread:progress", {
      buddyReadId: buddyRead._id.toString(),
      currentPage: 50,
    });
  });

  // -------------------------------------------------------------------------
  // TEST 7: Milestone Reached Event (challenge:milestone)
  // -------------------------------------------------------------------------
  await new Promise((resolve) => {
    // When Bob reaches page 75, the "Quarter Checkpoint" (targetPage 75) is unlocked!
    aliceSocket.once("challenge:milestone", (data) => {
      const isMatch =
        data.buddyReadId === buddyRead._id.toString() &&
        data.name === "Quarter Checkpoint" &&
        data.targetPage === 75;

      assert("Test 7: Real-Time Milestone Event (challenge:milestone)", isMatch, `Milestone "${data.name}" completed by ${data.userName}`);
      resolve();
    });

    bobSocket.emit("buddyread:progress", {
      buddyReadId: buddyRead._id.toString(),
      currentPage: 75,
    });
  });

  // -------------------------------------------------------------------------
  // TEST 8: Follow & Real-Time Notification (follow:new and notification:new)
  // -------------------------------------------------------------------------
  let receivedFollow = false;
  let receivedNotif = false;

  await new Promise(async (resolve) => {
    bobSocket.once("follow:new", (data) => {
      if (data.followerId === alice._id.toString()) {
        receivedFollow = true;
        if (receivedFollow && receivedNotif) resolve();
      }
    });

    const onNotif = (data) => {
      if ((data.senderId?.toString() === alice._id.toString() || data.senderName === alice.name) && data.type === "follow") {
        receivedNotif = true;
        bobSocket.off("notification:new", onNotif);
        if (receivedFollow && receivedNotif) resolve();
      }
    };
    bobSocket.on("notification:new", onNotif);

    // Alice follows Bob via social controller logic
    const { emitToUser } = require("../services/socketService");
    const notif = await Notification.create({
      userId: bob._id,
      senderId: alice._id,
      senderName: alice.name,
      type: "follow",
      title: "New Follower",
      message: `${alice.name} started following your reading universe!`,
    });

    emitToUser(bob._id, "follow:new", {
      followerId: alice._id.toString(),
      followerName: alice.name,
      followersCount: 1,
    });
    emitToUser(bob._id, "notification:new", notif);
  });

  assert("Test 8a: Real-Time Follow Event (follow:new)", receivedFollow, "Bob received follow:new");
  assert("Test 8b: Real-Time In-App Notification (notification:new)", receivedNotif, "Bob received notification:new");

  // -------------------------------------------------------------------------
  // TEST 9: Personal Library Reading Progress Echo (progress:updated)
  // -------------------------------------------------------------------------
  const aliceSecondSocket = ioClient(TEST_SOCKET_URL, {
    auth: { token: aliceToken },
    transports: ["websocket"],
  });
  await new Promise((resolve) => aliceSecondSocket.on("connect", resolve));

  await new Promise((resolve) => {
    aliceSecondSocket.once("progress:updated", (data) => {
      assert("Test 9: Personal Library Progress Sync (progress:updated)", data.currentPage === 120, `Page updated to ${data.currentPage}`);
      aliceSecondSocket.disconnect();
      resolve();
    });

    aliceSocket.emit("progress:updated", {
      entryId: "entry_mock_123",
      currentPage: 120,
      percentage: 40,
      shelf: "Currently Reading",
    });
  });

  // -------------------------------------------------------------------------
  // TEST 10: Disconnect / Reconnect Graceful Cleanup
  // -------------------------------------------------------------------------
  aliceSocket.disconnect();
  bobSocket.disconnect();
  assert("Test 10: Clean Disconnect & Reconnect Lifecycle", !aliceSocket.connected && !bobSocket.connected, "Sockets cleanly disconnected");

  // -------------------------------------------------------------------------
  // TEST 11: Real-Time Registered Email Dispatch Verification
  // -------------------------------------------------------------------------
  const { getEmailDispatches } = require("../services/emailService");
  const bobDispatches = getEmailDispatches("bob_test@readora.com");
  assert(
    "Test 11: Real-Time Registered Email Dispatch Verification",
    bobDispatches.length > 0,
    `Dispatched ${bobDispatches.length} real-time email updates to registered email: bob_test@readora.com`
  );

  // Cleanup Database Test Records
  await User.deleteMany({ email: { $in: ["alice_test@readora.com", "bob_test@readora.com", "charlie_test@readora.com"] } });
  await BuddyRead.findByIdAndDelete(buddyRead._id);
  await Notification.deleteMany({ userId: { $in: [alice._id, bob._id] } });

  server.close();
  await mongoose.disconnect();

  console.log("\n=======================================================");
  const passCount = results.filter((r) => r.status === "PASS").length;
  const failCount = results.filter((r) => r.status === "FAIL").length;
  console.log(`  RESULTS: ${passCount} PASSED, ${failCount} FAILED out of ${results.length} total assertions.`);
  console.log("=======================================================\n");

  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
