const express = require("express");
const {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  sendOtp,
  verifyOtp,
  googleAuth,
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/google", googleAuth);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);

module.exports = router;