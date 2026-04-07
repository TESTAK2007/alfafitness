import mongoose from "mongoose";

const DEFAULT_LOCAL_URI = "mongodb://127.0.0.1:27017/alfafitness";

const connectWithUri = async (uri, label) => {
  if (!uri) {
    return false;
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    console.log(`MongoDB connected (${label}).`);
    return true;
  } catch (error) {
    console.warn(`MongoDB connection failed (${label}): ${error.message}`);
    return false;
  }
};

export const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;
  const localUri = process.env.MONGODB_URI_LOCAL || DEFAULT_LOCAL_URI;

  if (mongoUri) {
    const atlasConnected = await connectWithUri(mongoUri, "Atlas");
    if (atlasConnected) {
      return true;
    }
  } else {
    console.warn("MONGODB_URI is not set.");
  }

  if (localUri && localUri !== mongoUri) {
    const localConnected = await connectWithUri(localUri, "Local");
    if (localConnected) {
      return true;
    }
  }

  console.warn("MongoDB is unavailable. Starting with in-memory fallback.");
  return false;
};
