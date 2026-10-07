import mongoose from "mongoose";
import { env } from "./env.js";

let connectionPromise: Promise<void> | undefined;

const connectDB = async (): Promise<void> => {
  const uri = env.MONGODB_URI;
  if (mongoose.connection.readyState === 1) {
    return;
  }

  mongoose.set("strictQuery", true);

  if (!connectionPromise || mongoose.connection.readyState === 0) {
    connectionPromise = mongoose
      .connect(uri)
      .then(() => {
        console.log("MongoDB connected");
      })
      .catch((error: unknown) => {
        connectionPromise = undefined;
        console.error("MongoDB connection failed:", error);
        throw error;
      });
  }

  await connectionPromise;
};

export default connectDB;
