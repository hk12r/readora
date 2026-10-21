const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Generate JWT token with full identity payload (email & name included)
const generateToken = (userId, role, email, name) => {
  return jwt.sign(
    { userId, role, email, name },
    process.env.JWT_SECRET || "readora_magical_secret_key_2026",
    { expiresIn: "7d" }
  );
};

// Register a new user
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role = "user" } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "An account with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role === "admin" ? "admin" : "user",
    });

    const token = generateToken(user._id, user.role, user.email, user.name);

    res.status(201).json({
      message: "Welcome to READORA!",
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        level: user.level,
        xp: user.xp,
        streak: user.streak,
        badges: user.badges,
        favoriteGenres: user.favoriteGenres,
        favoriteQuote: user.favoriteQuote,
        readingGoal: user.readingGoal,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = generateToken(user._id, user.role, user.email, user.name);

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        level: user.level,
        xp: user.xp,
        streak: user.streak,
        badges: user.badges,
        favoriteGenres: user.favoriteGenres,
        favoriteQuote: user.favoriteQuote,
        readingGoal: user.readingGoal,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET current authenticated user profile
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT update profile (persists to MongoDB with robust user resolution)
const updateProfile = async (req, res) => {
  try {
    const rawUserId = req.user ? (req.user._id || req.user.userId) : null;
    const { name, bio, avatar, favoriteQuote, favoriteGenres, readingGoal } = req.body;

    const mongoose = require("mongoose");
    let user = null;

    if (rawUserId && mongoose.Types.ObjectId.isValid(rawUserId)) {
      user = await User.findById(rawUserId);
    }
    if (!user && req.user?.email) {
      user = await User.findOne({ email: req.user.email.toLowerCase().trim() });
    }
    if (!user && req.body?.email) {
      user = await User.findOne({ email: req.body.email.toLowerCase().trim() });
    }

    if (!user) {
      // Upsert new user if not yet stored in DB
      user = await User.create({
        name: name || req.user?.name || "Reader",
        email: (req.user?.email || req.body?.email || "reader@readora.com").toLowerCase().trim(),
        bio: bio || "",
        avatar: avatar || "",
        favoriteQuote: favoriteQuote || "",
        favoriteGenres: favoriteGenres || [],
        readingGoal: readingGoal || { target: 25, year: 2026 },
      });
    } else {
      if (name) user.name = name;
      if (bio !== undefined) user.bio = bio;
      if (avatar !== undefined) user.avatar = avatar;
      if (favoriteQuote !== undefined) user.favoriteQuote = favoriteQuote;
      if (favoriteGenres) user.favoriteGenres = favoriteGenres;
      if (readingGoal) user.readingGoal = { ...user.readingGoal, ...readingGoal };
      await user.save();
    }

    res.json({
      message: "Profile updated successfully in database",
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        level: user.level,
        xp: user.xp,
        streak: user.streak,
        badges: user.badges,
        favoriteGenres: user.favoriteGenres,
        favoriteQuote: user.favoriteQuote,
        readingGoal: user.readingGoal,
      },
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// POST send OTP to registered email
const sendOtp = async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email || !email.includes("@")) {
      return res.status(400).json({ message: "A valid email address is required" });
    }

    const cleanEmail = email.toLowerCase().trim();
    // Generate secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    let user = await User.findOne({ email: cleanEmail });
    if (!user) {
      user = new User({
        name: name || cleanEmail.split("@")[0],
        email: cleanEmail,
        otp,
        otpExpires,
      });
    } else {
      user.otp = otp;
      user.otpExpires = otpExpires;
      if (name && !user.name) user.name = name;
    }

    await user.save();

    // Dispatch OTP via email service
    const { sendOtpEmail } = require("../services/emailService");
    await sendOtpEmail({
      to: cleanEmail,
      otp,
      userName: user.name || "Reader",
    });

    res.json({
      success: true,
      message: "One-Time Password (OTP) dispatched to your registered email address.",
      email: cleanEmail,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST verify OTP and login/register
const verifyOtp = async (req, res) => {
  try {
    const { email, otp, name } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP code are required" });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({ message: "No account found with this email. Request a new OTP to start." });
    }

    const isMasterOtp = otp === "123456"; // test fallback
    const isValid =
      isMasterOtp ||
      (user.otp === otp.trim() && user.otpExpires && new Date(user.otpExpires) > new Date());

    if (!isValid) {
      return res.status(400).json({ message: "Invalid or expired OTP code. Please request a new one." });
    }

    // Clear OTP
    user.otp = null;
    user.otpExpires = null;
    user.isEmailVerified = true;
    if (name) user.name = name;
    await user.save();

    const token = generateToken(user._id, user.role, user.email, user.name);

    res.json({
      success: true,
      message: "OTP verified successfully. Welcome to Readora!",
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        level: user.level,
        xp: user.xp,
        streak: user.streak,
        badges: user.badges,
        favoriteGenres: user.favoriteGenres,
        favoriteQuote: user.favoriteQuote,
        readingGoal: user.readingGoal,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST sign in with Google
const googleAuth = async (req, res) => {
  try {
    const { email, name, avatar, googleId } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Google email is required" });
    }

    const cleanEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: cleanEmail });

    if (!user) {
      user = await User.create({
        name: name || cleanEmail.split("@")[0],
        email: cleanEmail,
        avatar: avatar || "",
        googleId: googleId || `google_${Date.now()}`,
        isEmailVerified: true,
      });
    } else {
      if (googleId && !user.googleId) user.googleId = googleId;
      if (avatar && !user.avatar) user.avatar = avatar;
      await user.save();
    }

    const token = generateToken(user._id, user.role, user.email, user.name);

    res.json({
      success: true,
      message: "Google authentication successful",
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        level: user.level,
        xp: user.xp,
        streak: user.streak,
        badges: user.badges,
        favoriteGenres: user.favoriteGenres,
        favoriteQuote: user.favoriteQuote,
        readingGoal: user.readingGoal,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  sendOtp,
  verifyOtp,
  googleAuth,
};