const mongoose = require("mongoose");

const badgeSchema = new mongoose.Schema(
  {
    id: String,
    name: String,
    icon: String,
    description: String,
    earnedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      default: "",
    },

    otp: {
      type: String,
      default: null,
    },

    otpExpires: {
      type: Date,
      default: null,
    },

    googleId: {
      type: String,
      default: null,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    role: {
      type: String,
      default: "user",
      enum: ["user", "admin"],
    },

    avatar: {
      type: String,
      default: "",
    },

    bio: {
      type: String,
      default: "Curious reader exploring new literary galaxies.",
    },

    favoriteQuote: {
      type: String,
      default: "There is no friend as loyal as a book.",
    },

    favoriteGenres: {
      type: [String],
      default: ["Fantasy", "Literary Fiction", "Mystery"],
    },

    xp: {
      type: Number,
      default: 0,
    },

    level: {
      type: Number,
      default: 1,
    },

    badges: {
      type: [badgeSchema],
      default: [
        {
          id: "welcome_reader",
          name: "New Explorer",
          icon: "✦",
          description: "Began the literary voyage on Readora.",
          earnedAt: new Date(),
        },
      ],
    },

    streak: {
      current: { type: Number, default: 1 },
      longest: { type: Number, default: 1 },
      lastReadDate: { type: Date, default: Date.now },
    },

    readingGoal: {
      annualTarget: { type: Number, default: 25 },
      monthlyTarget: { type: Number, default: 2 },
      pagesTarget: { type: Number, default: 7500 },
      minutesTarget: { type: Number, default: 600 },
      streakTarget: { type: Number, default: 30 },
    },

    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);