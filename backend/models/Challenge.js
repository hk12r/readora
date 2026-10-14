const mongoose = require("mongoose");

const promptSchema = new mongoose.Schema(
  {
    id: String,
    text: String,
    targetCount: { type: Number, default: 1 },
    completedCount: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    bookTitle: { type: String, default: "" },
  },
  { _id: false }
);

const challengeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    type: {
      type: String,
      enum: ["count", "pages", "genre", "country", "prompts"],
      default: "count",
    },

    category: {
      type: String,
      default: "General",
    },

    targetCount: {
      type: Number,
      required: true,
      default: 12,
    },

    prompts: {
      type: [promptSchema],
      default: [],
    },

    badgeReward: {
      name: String,
      icon: String,
      xp: { type: Number, default: 150 },
    },

    isPublic: {
      type: Boolean,
      default: true,
    },

    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    deadline: {
      type: Date,
    },

    participants: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        progress: {
          type: Number,
          default: 0,
        },
        completed: {
          type: Boolean,
          default: false,
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Challenge", challengeSchema);