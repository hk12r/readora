const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      message: "Not authorized, no token provided",
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "readora_magical_secret_key_2026"
    );

    const uid = decoded.userId || decoded._id;
    let user = null;

    if (uid && mongoose.Types.ObjectId.isValid(uid)) {
      user = await User.findById(uid).select("-password");
    }
    if (!user && decoded.email) {
      user = await User.findOne({ email: decoded.email.toLowerCase().trim() }).select("-password");
    }

    if (user) {
      req.user = user;
      req.user.userId = user._id;
    } else {
      req.user = {
        _id: uid || new mongoose.Types.ObjectId(),
        userId: uid,
        role: decoded.role || "user",
        email: decoded.email || "reader@readora.com",
        name: decoded.name || "Reader",
      };
    }

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Not authorized, invalid token",
    });
  }
};

module.exports = protect;