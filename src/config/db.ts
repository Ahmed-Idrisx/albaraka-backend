import mongoose from "mongoose";
import { env } from "./env.js";
import dns from "dns";

if (!process.env.VERCEL) {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
}

let cached: Promise<typeof mongoose> | null = null;

const connectDB = async (): Promise<void> => {
  const uri = env.MONGODB_URI;
  if (!uri)
    throw new Error("Missing required environment variable MONGODB_URI");

  mongoose.set("strictQuery", true);
  cached ??= mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });

  try {
    await cached;
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    cached = null;
    throw error;
  }
};

export default connectDB;
