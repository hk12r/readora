const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Generate JWT token
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
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

    const token = generateToken(user._id, user.role);

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

    const token = generateToken(user._id, user.role);

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

// PUT update profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, bio, avatar, favoriteQuote, favoriteGenres, readingGoal } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;
    if (favoriteQuote !== undefined) user.favoriteQuote = favoriteQuote;
    if (favoriteGenres) user.favoriteGenres = favoriteGenres;
    if (readingGoal) user.readingGoal = { ...user.readingGoal, ...readingGoal };

    await user.save();

    res.json({
      message: "Profile updated successfully",
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

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
};