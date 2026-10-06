import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest, AuthUser, UserRole } from "../types/index.js";
import { ApiError } from "../utils/ApiError.js";
import { env } from "../config/env.js";

/** Reads the JWT from the httpOnly cookie and attaches req.user. */
export const protect = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
) => {
  const token = req.cookies?.token;

  if (!token) {
    return next(ApiError.unauthorized("يجب تسجيل الدخول"));
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthUser;
    req.user = decoded;
    return next();
  } catch {
    return next(ApiError.unauthorized("جلسة غير صالحة، سجل الدخول مرة أخرى"));
  }
};

/** Restricts a route to the given roles. Use after `protect`. */
export const requireRole =
  (...roles: UserRole[]) =>
  (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(ApiError.forbidden());
    }
    return next();
  };
