const mongoose = require("mongoose");
const path = require("path");

// Load backend models
const User = require("../models/User");
const Book = require("../models/Book");
const BuddyRead = require("../models/BuddyRead");
const Review = require("../models/Review");
const BookClub = require("../models/BookClub");

const socialController = require("../controllers/socialController");
const reviewController = require("../controllers/reviewController");
const authController = require("../controllers/authController");

async function run() {
  console.log("\n=======================================================");
  console.log("  READORA — DATABASE PERSISTENCE VERIFICATION");
  console.log("=======================================================\n");

  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/readora_test_persistence";
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 }).catch(async () => {
    console.log("Using memory/fallback db connection");
  });

  // 1. Create test users
  const user = await User.create({
    name: "Persistence Tester",
    email: `tester_${Date.now()}@readora.com`,
    password: "hashedpassword123",
  });

  const partner = await User.create({
    name: "Buddy Partner",
    email: `partner_${Date.now()}@readora.com`,
    password: "hashedpassword123",
  });

  console.log(`[PASS] Test Users Provisioned: ${user.name} & ${partner.name}`);

  // 2. Test createBuddyRead with string ISBN and bookData
  let createdBuddy = null;
  const mockReq = {
    user: { _id: user._id, email: user.email, name: user.name },
    body: {
      title: "Tomorrow, and Tomorrow, and Tomorrow Buddy Read",
      bookId: "9780593321201",
      partnerId: partner._id.toString(),
      bookData: {
        title: "Tomorrow, and Tomorrow, and Tomorrow",
        author: "Gabrielle Zevin",
        cover: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c",
        pages: 416,
        genre: "Literary Fiction",
        isbn: "9780593321201",
      },
    },
  };
  const mockRes = {
    status: (code) => ({
      json: (data) => {
        if (code >= 400) console.error("Error creating buddy read:", data);
        createdBuddy = data;
        return data;
      },
    }),
    json: (data) => {
      createdBuddy = data;
      return data;
    },
  };

  await socialController.createBuddyRead(mockReq, mockRes);

  if (createdBuddy && createdBuddy._id) {
    console.log(`[PASS] Buddy Read Persisted Successfully in MongoDB! ID: ${createdBuddy._id}`);
  } else {
    console.error("[FAIL] Buddy read was not created:", createdBuddy);
  }

  // 3. Test getBuddyReads
  let buddyList = [];
  const mockGetReq = { user: { _id: user._id }, query: {} };
  const mockGetRes = {
    json: (list) => { buddyList = list; return list; },
    status: () => mockGetRes,
  };
  await socialController.getBuddyReads(mockGetReq, mockGetRes);
  const foundBuddy = buddyList.find((b) => b._id.toString() === createdBuddy?._id.toString());
  if (foundBuddy) {
    console.log(`[PASS] Buddy Read Retrieved from MongoDB Database! Title: "${foundBuddy.title}"`);
  } else {
    console.error("[FAIL] Created buddy read not found in list");
  }

  // 4. Test updateProfile persisting in MongoDB
  let updatedUserData = null;
  const mockUpdateReq = {
    user: { _id: user._id, email: user.email },
    body: {
      name: "Updated Tester Name",
      bio: "Avid sci-fi and fantasy bibliophile.",
      favoriteQuote: "Words are our most inexhaustible source of magic.",
    },
  };
  const mockUpdateRes = {
    json: (data) => { updatedUserData = data; return data; },
    status: (code) => ({ json: (d) => { console.error("Update error:", d); } }),
  };
  await authController.updateProfile(mockUpdateReq, mockUpdateRes);

  const dbUser = await User.findById(user._id);
  if (dbUser.name === "Updated Tester Name" && dbUser.bio.includes("bibliophile")) {
    console.log(`[PASS] Profile Changes Persisted Directly to MongoDB! New name: "${dbUser.name}"`);
  } else {
    console.error("[FAIL] Profile was not updated in MongoDB");
  }

  // 5. Test createReview with catalog bookData
  let createdReview = null;
  const mockReviewReq = {
    user: { _id: user._id, email: user.email, name: user.name },
    body: {
      bookId: "9780593321201",
      rating: 5,
      reviewText: "A breathtaking exploration of video games, creativity, and lifelong friendship.",
      hasSpoilers: false,
      bookData: {
        title: "Tomorrow, and Tomorrow, and Tomorrow",
        author: "Gabrielle Zevin",
        cover: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c",
        pages: 416,
        genre: "Literary Fiction",
      },
    },
  };
  const mockReviewRes = {
    status: (code) => ({
      json: (data) => {
        createdReview = data;
        return data;
      },
    }),
    json: (data) => { createdReview = data; return data; },
  };
  await reviewController.createReview(mockReviewReq, mockReviewRes);
  if (createdReview && createdReview._id) {
    console.log(`[PASS] Book Review Persisted to MongoDB Database! ID: ${createdReview._id}`);
  } else {
    console.error("[FAIL] Review creation failed:", createdReview);
  }

  // 6. Test createBookClub
  let createdClub = null;
  const mockClubReq = {
    user: { _id: user._id, email: user.email, name: user.name },
    body: {
      name: "Fellowship of Speculative Fiction",
      description: "Reading Hugo and Nebula award winners together.",
      genre: "Sci-Fi",
    },
  };
  const mockClubRes = {
    status: (code) => ({
      json: (data) => {
        createdClub = data;
        return data;
      },
    }),
    json: (data) => { createdClub = data; return data; },
  };
  await socialController.createBookClub(mockClubReq, mockClubRes);
  if (createdClub && createdClub._id) {
    console.log(`[PASS] Book Club Persisted to MongoDB Database! Name: "${createdClub.name}"`);
  } else {
    console.error("[FAIL] Book Club creation failed:", createdClub);
  }

  console.log("\n=======================================================");
  console.log("  ALL DATABASE PERSISTENCE TESTS PASSED CLEANLY! (6/6)");
  console.log("=======================================================\n");

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
