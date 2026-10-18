const puppeteer = require("puppeteer-core");
const http = require("http");
const path = require("path");
const fs = require("fs");
const { spawn, execSync } = require("child_process");
const mongoose = require("../backend/node_modules/mongoose");
const jwt = require("../backend/node_modules/jsonwebtoken");
const dotenv = require("../backend/node_modules/dotenv");

const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

dotenv.config({ path: path.join(__dirname, "../backend/.env") });
dotenv.config();

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUTPUT_DIR = path.join(__dirname, "../docs/experiment-8-screenshots");
const JWT_SECRET = process.env.JWT_SECRET || "readora_magical_secret_key_2026";

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function isPortOpen(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/`, () => resolve(true));
    req.on("error", () => resolve(false));
    req.setTimeout(1000, () => {
      req.abort();
      resolve(false);
    });
  });
}

async function runCapture() {
  console.log("\n=======================================================");
  console.log("  READORA — CAPTURING GENUINE SUBMISSION SCREENSHOTS");
  console.log("=======================================================\n");

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // 1. Connect to Database & Prepare Users
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/readora";
  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log("Connected to MongoDB for screenshot preparation.");
  } catch (err) {
    console.log("Atlas failed, connecting to local MongoDB...");
    await mongoose.connect("mongodb://127.0.0.1:27017/readora", { serverSelectionTimeoutMS: 4000 });
  }

  const User = require("../backend/models/User");
  const Book = require("../backend/models/Book");
  const BuddyRead = require("../backend/models/BuddyRead");
  const Notification = require("../backend/models/Notification");

  // Create or update Lyra (User 1)
  let lyra = await User.findOne({ email: "reader@readora.com" });
  if (!lyra) {
    lyra = await User.create({
      name: "Lyra Valerius",
      email: "reader@readora.com",
      password: "password123",
      role: "user",
      xp: 480,
      level: 3,
      badges: [
        { id: "b1", name: "New Explorer", icon: "✦", description: "Began journey" },
        { id: "b2", name: "First Finish", icon: "🏆", description: "Completed a book" },
      ],
      streak: { current: 5, longest: 14 },
    });
  }

  // Create or update Julian (User 2)
  let julian = await User.findOne({ email: "julian@readora.com" });
  if (!julian) {
    julian = await User.create({
      name: "Julian Sterling",
      email: "julian@readora.com",
      password: "password123",
      role: "user",
      xp: 320,
      level: 2,
      badges: [
        { id: "b1", name: "New Explorer", icon: "✦", description: "Began journey" },
      ],
      streak: { current: 3, longest: 7 },
    });
  }

  let book = await Book.findOne();
  if (!book) {
    book = await Book.create({
      title: "The Midnight Library",
      author: "Matt Haig",
      pages: 300,
      isbn: "9780525559474",
      cover: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1602190253i/52578297.jpg",
      genre: "Fiction",
    });
  }

  // Ensure active Buddy Read exists between Lyra and Julian
  let buddyRead = await BuddyRead.findOne({ title: "Midnight Library Fellowship" });
  if (!buddyRead) {
    buddyRead = await BuddyRead.create({
      bookId: book._id,
      creatorId: lyra._id,
      title: "Midnight Library Fellowship",
      participants: [
        { userId: lyra._id, currentPage: 65, percentage: 22 },
        { userId: julian._id, currentPage: 40, percentage: 13 },
      ],
      milestones: [
        { name: "First Quarter Checkpoint", targetPage: 75, completedBy: [] },
        { name: "Halfway Checkpoint", targetPage: 150, completedBy: [] },
        { name: "Final Stretch", targetPage: 250, completedBy: [] },
      ],
      messages: [
        {
          userId: lyra._id,
          userName: "Lyra Valerius",
          text: "Welcome Julian! Let's read through chapter 5 by Friday.",
          page: 25,
          isSpoiler: false,
          createdAt: new Date(Date.now() - 3600000),
        },
      ],
    });
  }

  // Tokens
  const lyraToken = jwt.sign({ userId: lyra._id, role: lyra.role }, JWT_SECRET, { expiresIn: "24h" });
  const julianToken = jwt.sign({ userId: julian._id, role: julian.role }, JWT_SECRET, { expiresIn: "24h" });

  // 2. Check Backend Server on port 5000
  let backendProcess = null;
  const backendUp = await isPortOpen(5000);
  if (!backendUp) {
    console.log("Starting backend server on port 5000...");
    backendProcess = spawn("node", ["backend/server.js"], {
      cwd: path.join(__dirname, ".."),
      shell: true,
      stdio: "pipe",
    });
    backendProcess.stdout.on("data", (d) => console.log(`[Backend] ${d}`));
    backendProcess.stderr.on("data", (d) => console.error(`[Backend Err] ${d}`));
    await wait(3500);
  } else {
    console.log("Backend server is already running on port 5000.");
  }

  // 3. Serve Frontend Production Build on port 4173 using Express
  const express = require("../backend/node_modules/express");
  let previewServer = null;
  const viteUp = await isPortOpen(4173);
  if (!viteUp) {
    console.log("Serving frontend production build on port 4173...");
    const previewApp = express();
    previewApp.use("/readora", express.static(path.join(__dirname, "../dist")));
    previewApp.use(express.static(path.join(__dirname, "../dist")));
    previewApp.use((req, res) => {
      res.sendFile(path.join(__dirname, "../dist/index.html"));
    });
    previewServer = previewApp.listen(4173);
    await wait(1000);
  } else {
    console.log("Frontend preview is already running on port 4173.");
  }

  const BASE_URL = "http://localhost:4173/readora";

  // 4. Launch Puppeteer with Chrome
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      `--user-data-dir=${path.join(__dirname, "../node_modules/.cache/chrome_user_data")}`,
      "--window-size=1440,960",
    ],
    defaultViewport: { width: 1440, height: 960, deviceScaleFactor: 1.5 },
  });

  console.log("Chrome launched successfully.");

  // Helper to inject auth in page
  async function injectAuth(page, userObj, token) {
    await page.evaluate(
      (u, t) => {
        localStorage.setItem("readora_user", JSON.stringify(u));
        localStorage.setItem("readora_token", t);
      },
      userObj,
      token
    );
  }

  // -------------------------------------------------------------
  // Screenshot 1: READORA Running Successfully (Homepage)
  // -------------------------------------------------------------
  console.log("Capturing 01_readora_running_successfully.png...");
  const page1 = await browser.newPage();
  await page1.goto(BASE_URL, { waitUntil: "networkidle2" });
  await wait(1500);
  await page1.screenshot({
    path: path.join(OUTPUT_DIR, "01_readora_running_successfully.png"),
    fullPage: false,
  });
  console.log("  [SAVED] 01_readora_running_successfully.png");

  // -------------------------------------------------------------
  // Screenshot 2: Buddy Read Header & Status Pill (Cropped)
  // -------------------------------------------------------------
  console.log("Navigating to Community...");
  await page1.goto(`${BASE_URL}/community`, { waitUntil: "networkidle2" });
  await injectAuth(page1, lyra, lyraToken);
  await page1.goto(`${BASE_URL}/community`, { waitUntil: "networkidle2" });
  await wait(1500);

  // Click Buddy Reads tab
  await page1.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const buddyTab = buttons.find((b) => b.textContent.includes("Buddy Reads"));
    if (buddyTab) buddyTab.click();
  });
  await wait(1200);

  // Click the active buddy read card (selects the card container)
  await page1.evaluate(() => {
    const cards = Array.from(document.querySelectorAll(".cursor-pointer"));
    const fellowshipCard = cards.find((c) => c.textContent.includes("Midnight Library"));
    if (fellowshipCard) {
      fellowshipCard.click();
    }
  });
  await wait(1500);

  // Wait for the room view to render
  await page1.waitForSelector("#buddy-read-header-card", { timeout: 6000 });

  console.log("Capturing 02_buddy_read_room_active.png (Cropped to room header)...");
  const elHeader = await page1.$("#buddy-read-header-card");
  if (elHeader) {
    await elHeader.screenshot({ path: path.join(OUTPUT_DIR, "02_buddy_read_room_active.png") });
    console.log("  [SAVED - CROPPED] 02_buddy_read_room_active.png");
  } else {
    throw new Error("Could not find #buddy-read-header-card");
  }

  // -------------------------------------------------------------
  // Screenshot 3: Real-Time Chat Stream (Cropped)
  // -------------------------------------------------------------
  console.log("Capturing 03_realtime_chat_without_refresh.png (Cropped to chat stream)...");
  const { emitToBuddyRead, emitToUser } = require("../backend/services/socketService");

  // Broadcast Julian's chat message to the room via Socket.IO
  const chatMsg = {
    _id: new mongoose.Types.ObjectId().toString(),
    userId: julian._id,
    userName: "Julian Sterling",
    text: "Just finished Chapter 4! The library scene was breathtaking.",
    page: 85,
    isSpoiler: false,
    createdAt: new Date(),
  };

  buddyRead.messages.push(chatMsg);
  await buddyRead.save();

  emitToBuddyRead(buddyRead._id, "buddyread:message", {
    buddyReadId: buddyRead._id.toString(),
    message: chatMsg,
  });
  await wait(1500);

  // Focus and capture only the chat section
  await page1.bringToFront();
  const elChat = await page1.$("#buddy-chat-section");
  if (elChat) {
    await elChat.screenshot({ path: path.join(OUTPUT_DIR, "03_realtime_chat_without_refresh.png") });
    console.log("  [SAVED - CROPPED] 03_realtime_chat_without_refresh.png");
  } else {
    throw new Error("Could not find #buddy-chat-section");
  }

  // -------------------------------------------------------------
  // Screenshot 4: Real-Time Reading Progress Bars (Cropped)
  // -------------------------------------------------------------
  console.log("Capturing 04_realtime_progress_sync.png (Cropped to participants progress)...");
  // Update Julian's page progress to 150 (50%) via Socket.IO
  const julianParticipant = buddyRead.participants.find(
    (p) => p.userId && p.userId.toString() === julian._id.toString()
  );
  if (julianParticipant) {
    julianParticipant.currentPage = 150;
    julianParticipant.percentage = 50;
  }
  await buddyRead.save();

  emitToBuddyRead(buddyRead._id, "buddyread:progress", {
    buddyReadId: buddyRead._id.toString(),
    userId: julian._id.toString(),
    userName: "Julian Sterling",
    currentPage: 150,
    percentage: 50,
    milestones: buddyRead.milestones,
  });
  await wait(1500);

  // Focus and capture only the participants progress section
  await page1.bringToFront();
  const elProgress = await page1.$("#buddy-participants-progress");
  if (elProgress) {
    await elProgress.screenshot({ path: path.join(OUTPUT_DIR, "04_realtime_progress_sync.png") });
    console.log("  [SAVED - CROPPED] 04_realtime_progress_sync.png");
  } else {
    throw new Error("Could not find #buddy-participants-progress");
  }

  // -------------------------------------------------------------
  // Screenshot 5: Real-Time In-App Notification Dropdown (Cropped)
  // -------------------------------------------------------------
  console.log("Capturing 05_realtime_notification_alert.png (Cropped to notification bell & dropdown)...");
  const testNotif = await Notification.create({
    userId: lyra._id,
    senderId: julian._id,
    senderName: "Julian Sterling",
    type: "follow",
    title: "New Follower",
    message: "Julian Sterling started following your reading universe!",
    link: "/community",
  });
  emitToUser(lyra._id, "notification:new", testNotif);
  await wait(800);

  // Scroll back to top to ensure clean navbar dropdown capture without offset issues
  await page1.evaluate(() => window.scrollTo(0, 0));
  await wait(600);

  // Click the notification bell to show the dropdown with active unread alerts
  await page1.evaluate(() => {
    const bellBtn = document.querySelector('button[title="Notifications"]');
    if (bellBtn) bellBtn.click();
  });
  await wait(1200);

  const notifClip = await page1.evaluate(() => {
    const container = document.querySelector("#navbar-notif-container");
    const dropdown =
      document.querySelector("#navbar-notif-dropdown") ||
      document.querySelector(".animate-scale-in") ||
      (container ? container.querySelector(".absolute") : null);

    if (!container || !dropdown) return null;
    const r1 = container.getBoundingClientRect();
    const r2 = dropdown.getBoundingClientRect();

    const minX = Math.min(r1.left, r2.left) - 15;
    const maxX = Math.max(r1.right, r2.right) + 15;
    const maxY = r2.bottom + 25;

    return {
      x: Math.max(0, Math.floor(minX)),
      y: 0,
      width: Math.ceil(maxX - minX),
      height: Math.ceil(maxY),
    };
  });

  if (notifClip) {
    await page1.screenshot({
      path: path.join(OUTPUT_DIR, "05_realtime_notification_alert.png"),
      clip: notifClip,
    });
    console.log("  [SAVED - CROPPED] 05_realtime_notification_alert.png");
  } else {
    throw new Error("Could not find notification elements to clip");
  }
  console.log("  [SAVED] 05_realtime_notification_alert.png");

  // -------------------------------------------------------------
  // Screenshot 6: Challenge Milestones, Badges & XP Rewards
  // -------------------------------------------------------------
  console.log("Capturing 06_challenge_milestones_and_badges.png...");
  await page1.goto(`${BASE_URL}/challenges`, { waitUntil: "networkidle2" });
  await wait(1500);
  await page1.screenshot({
    path: path.join(OUTPUT_DIR, "06_challenge_milestones_and_badges.png"),
    fullPage: false,
  });
  console.log("  [SAVED] 06_challenge_milestones_and_badges.png");

  // -------------------------------------------------------------
  // Screenshot 7: Community Social Hub & Readers Directory
  // -------------------------------------------------------------
  console.log("Capturing 07_community_social_hub.png...");
  await page1.goto(`${BASE_URL}/community`, { waitUntil: "networkidle2" });
  await wait(1500);
  await page1.screenshot({
    path: path.join(OUTPUT_DIR, "07_community_social_hub.png"),
    fullPage: false,
  });
  console.log("  [SAVED] 07_community_social_hub.png");

  // -------------------------------------------------------------
  // Screenshot 8: Personal Reading Library with Shelves & Progress
  // -------------------------------------------------------------
  console.log("Capturing 08_personal_library_progress.png...");
  await page1.goto(`${BASE_URL}/library`, { waitUntil: "networkidle2" });
  await wait(1500);
  await page1.screenshot({
    path: path.join(OUTPUT_DIR, "08_personal_library_progress.png"),
    fullPage: false,
  });
  console.log("  [SAVED] 08_personal_library_progress.png");

  // Cleanup
  await browser.close();
  if (backendProcess) backendProcess.kill();
  if (previewServer) previewServer.close();
  await mongoose.disconnect();

  console.log("\n=======================================================");
  console.log("  ALL 8 SCREENSHOTS SUCCESSFULLY CAPTURED IN:");
  console.log(`  ${OUTPUT_DIR}`);
  console.log("=======================================================\n");

  process.exit(0);
}

runCapture().catch((err) => {
  console.error("Screenshot capture failed:", err);
  process.exit(1);
});
