import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import multer from "multer";
import { ApiError } from "../utils/ApiError.js";
import {
  localeOf,
  translate,
  type MessageKey,
  type MessageParams,
} from "../i18n/messages.js";

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    message: translate("routeNotFound", localeOf(req), { path: req.originalUrl }),
  });
};

export const errorHandler = (
  err: Error & { code?: number | string },
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const locale = localeOf(req);
  const send = (status: number, key: MessageKey, params?: MessageParams) =>
    res.status(status).json({ message: translate(key, locale, params) });

  if (err instanceof ApiError) {
    return send(err.statusCode, err.key, err.params);
  }

  // A malformed id, e.g. GET /api/products/abc
  if (err instanceof mongoose.Error.CastError) {
    return send(400, "invalidId");
  }

  if (err instanceof mongoose.Error.ValidationError) {
    return send(400, "invalidData");
  }

  if (err instanceof multer.MulterError) {
    return send(400, err.code === "LIMIT_FILE_SIZE" ? "imageTooLarge" : "uploadFailed");
  }

  // Duplicate key (e.g. an email or slug that already exists)
  if (err.code === 11000) {
    return send(409, "duplicate");
  }

  console.error("Unhandled error:", err);
  return send(500, "serverError");
};
