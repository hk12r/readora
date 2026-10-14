const mongoose = require("mongoose");

const clubDiscussionCommentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: { type: String, required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const clubDiscussionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    comments: {
      type: [clubDiscussionCommentSchema],
      default: [],
    },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const nominationSchema = new mongoose.Schema(
  {
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    nominatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    votes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { _id: true }
);

const bookClubSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    genre: {
      type: String,
      default: "All Genres",
    },

    avatar: {
      type: String,
      default: "",
    },

    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    members: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        role: {
          type: String,
          enum: ["admin", "moderator", "member"],
          default: "member",
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    currentBook: {
      bookId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Book",
      },
      deadline: Date,
    },

    nominations: {
      type: [nominationSchema],
      default: [],
    },

    discussions: {
      type: [clubDiscussionSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("BookClub", bookClubSchema);
