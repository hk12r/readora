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

    const user = await User.findById(decoded.userId || decoded._id).select("-password");
    if (user) {
      req.user = user;
      req.user.userId = user._id;
    } else {
      req.user = {
        _id: decoded.userId || decoded._id,
        userId: decoded.userId || decoded._id,
        role: decoded.role || "user",
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