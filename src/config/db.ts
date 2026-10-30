import mongoose from "mongoose";
import { env } from "./env.js";
import dns from "dns";

if (!process.env.VERCEL) {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
}

// Every document leaves the API the same way: `id` instead of `_id`, no `__v`.
mongoose.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret: Record<string, unknown>) => {
    delete ret._id;
    return ret;
  },
});

let cached: Promise<typeof mongoose> | null = null;

const connectDB = async (): Promise<void> => {
  mongoose.set("strictQuery", true);
  cached ??= mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 8000,
  });

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
