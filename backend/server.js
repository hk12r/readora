const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

const bookRoutes = require("./routes/bookRoutes");
const libraryRoutes = require("./routes/libraryRoutes");
const searchRoutes = require("./routes/searchRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const errorHandler = require("./middleware/errorMiddleware");
const logger = require("./middleware/loggerMiddleware");
const authRoutes = require("./routes/authRoutes");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const sanitizeMongoInput = require("./middleware/sanitizeMiddleware");

const app = express();

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);
app.use(helmet());
app.use(express.json());
app.use(sanitizeMongoInput);
app.use(logger);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    message: "Too many requests, please try again later.",
  },
});

app.use(apiLimiter);

// Connect to MongoDB
connectDB();

// API Routes
app.use("/api/books", bookRoutes);
app.use("/api/library", libraryRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/auth", authRoutes);

app.use(errorHandler);

// Home route
app.get("/", (req, res) => {
  res.send("READORA Backend is running!");
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});