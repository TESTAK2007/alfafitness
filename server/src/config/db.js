import mongoose from "mongoose";

export const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.warn("MONGODB_URI is not set. Starting with in-memory fallback.");
    return false;
  }

  try {
    await mongoose.connect(mongoUri);
    return true;
  } catch (error) {
    console.warn(`MongoDB unavailable. Starting with in-memory fallback. Reason: ${error.message}`);
    return false;
  }
};
