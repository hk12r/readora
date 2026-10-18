const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
require("dotenv").config();

const connectDB = require("./config/db");
const sanitizeMongoInput = require("./middleware/sanitizeMiddleware");
const logger = require("./middleware/loggerMiddleware");
const errorHandler = require("./middleware/errorMiddleware");

// Route imports
const authRoutes = require("./routes/authRoutes");
const bookRoutes = require("./routes/bookRoutes");
const libraryRoutes = require("./routes/libraryRoutes");
const searchRoutes = require("./routes/searchRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const readingRoutes = require("./routes/readingRoutes");
const noteRoutes = require("./routes/noteRoutes");
const challengeRoutes = require("./routes/challengeRoutes");
const socialRoutes = require("./routes/socialRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const adminRoutes = require("./routes/adminRoutes");

// Auto-seeders
const { seedDatabaseIfNeeded } = require("./controllers/bookController");
const { seedChallengesIfNeeded } = require("./controllers/challengeController");

const app = express();
const server = http.createServer(app);

// Socket.IO Setup with JWT authentication and authorized room handling
const { initSocketServer } = require("./services/socketService");
const io = initSocketServer(server);

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow localhost on any port for Vite and dev tools
      callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(sanitizeMongoInput);
app.use(logger);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: {
    message: "Too many requests, please try again later.",
  },
});

app.use("/api/", apiLimiter);

// Connect to MongoDB & Seed
connectDB().then(() => {
  seedDatabaseIfNeeded();
  seedChallengesIfNeeded();
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/library", libraryRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/reading", readingRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/challenges", challengeRoutes);
app.use("/api/social", socialRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);

// Base route
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "READORA Complete Reading Universe API is active!",
    version: "2.0.0",
  });
});

app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`READORA server running on port ${PORT}`);
});