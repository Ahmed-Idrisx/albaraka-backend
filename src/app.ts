import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import dns from "dns";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";

import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import deliveryAreaRoutes from "./routes/deliveryAreaRoutes.js";

dns.setServers(["8.8.8.8"]);
await connectDB();

const app = express();

// CORS configuration
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true, // required for the httpOnly auth cookie
  }),
);
// middlewares
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());

// Render pings this to keep deploys zero-downtime.
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "albaraka-api" });
});

app.use("/api/auth", authRoutes);
app.use("/api/admins", adminRoutes);
app.use("/api/delivery-areas", deliveryAreaRoutes);

// error handling middlewares
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`Albaraka API running on http://localhost:${env.PORT}`);
});

export default app;
