import "dotenv/config";
import dns from "node:dns";
import { env } from "./config/env.js";
import connectDB from "./config/db.js";
import app from "./app.js";

try {
  dns.setServers(["8.8.8.8"]);
  await connectDB();
  app.listen(env.PORT, () => {
    console.log(`Albaraka API running on http://localhost:${env.PORT}`);
  });
} catch (error) {
  console.error("Failed to start Albaraka API:", error);
  process.exitCode = 1;
}
