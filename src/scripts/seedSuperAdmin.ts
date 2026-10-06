import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import dns from "dns";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import { env } from "../config/env.js";

const seedSuperAdmin = async (): Promise<void> => {
  const name = env.SUPERADMIN_NAME;
  const email = env.SUPERADMIN_EMAIL;
  const password = env.SUPERADMIN_PASSWORD;

  if (!name || !email || !password) {
    throw new Error(
      "Set SUPERADMIN_NAME, SUPERADMIN_EMAIL, and SUPERADMIN_PASSWORD in .env before seeding.",
    );
  }
  if (password.length < 8) {
    throw new Error("SUPERADMIN_PASSWORD must be at least 8 characters long.");
  }

  dns.setServers(["8.8.8.8"]);
  await connectDB();

  const existingSuperAdmin = await User.findOne({ role: "superadmin" }).select(
    "_id",
  );
  if (existingSuperAdmin) {
    console.log("A superadmin account already exists; no account was created.");
    return;
  }

  const existingUser = await User.findOne({ email }).select("_id");
  if (existingUser) {
    throw new Error("SUPERADMIN_EMAIL is already used by another account.");
  }

  const user = await User.create({
    name,
    email,
    password: await bcrypt.hash(password, 10),
    role: "superadmin",
  });

  console.log(`Superadmin account created for ${user.email}.`);
};

try {
  await seedSuperAdmin();
} catch (error) {
  console.error(
    "Failed to seed superadmin:",
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
