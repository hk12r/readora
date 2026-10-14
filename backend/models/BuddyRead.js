const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: { type: String, required: true },
    userAvatar: { type: String, default: "" },
    text: { type: String, required: true },
    page: { type: Number, default: 0 },
    isSpoiler: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const milestoneSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    targetPage: { type: Number, required: true },
    completedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { _id: true }
);

const buddyReadSchema = new mongoose.Schema(
  {
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
      index: true,
    },

    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
    },

    targetFinishDate: {
      type: Date,
    },

    participants: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        currentPage: {
          type: Number,
          default: 0,
        },
        percentage: {
          type: Number,
          default: 0,
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    milestones: {
      type: [milestoneSchema],
      default: [],
    },

    messages: {
      type: [messageSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("BuddyRead", buddyReadSchema);
