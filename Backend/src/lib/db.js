import mongoose from "mongoose";

export async function connectDB() {
  try {
    const db_url = process.env.MONGODB_URL;

    if (!db_url) {
      console.warn("[MongoDB] Notice: MONGODB_URL is not defined in environment variables. Starting in memory mode.");
      return;
    }

    const connection = await mongoose.connect(db_url, {
      serverSelectionTimeoutMS: 3000, // Fast 3-second timeout for graceful fallback
    });
    console.log("[MongoDB] Connected to database:", connection.connection.host);
  } catch (error) {
    console.warn("[MongoDB] Notice: Could not connect to MongoDB (" + error.message + "). Application will run with in-memory persistence.");
  }
}
