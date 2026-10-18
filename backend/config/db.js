const mongoose = require("mongoose");

const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  const localUri = "mongodb://127.0.0.1:27017/readora";

  if (primaryUri) {
    try {
      await mongoose.connect(primaryUri, { serverSelectionTimeoutMS: 3000 });
      console.log("MongoDB connected successfully to primary URI");
      return;
    } catch (error) {
      console.warn("Primary MongoDB connection failed (" + error.message + "), falling back to local MongoDB...");
    }
  }

  try {
    await mongoose.connect(localUri, { serverSelectionTimeoutMS: 3000 });
    console.log("MongoDB connected successfully to local instance (readora)");
  } catch (error) {
    console.error("Local MongoDB connection also failed:", error.message);
  }
};

module.exports = connectDB;