import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { AuthUser } from "../types/index.js";
import { ApiError } from "../utils/ApiError.js";
import { env } from "../config/env.js";

class AuthService {
  private signToken(user: AuthUser): string {
    return jwt.sign(
      user,
      env.JWT_SECRET as string,
      {
        expiresIn: env.JWT_EXPIRES_IN || "30d",
      } as jwt.SignOptions,
    );
  }

  async login(email: string, password: string) {
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password",
    );
    if (!user) {
      throw ApiError.unauthorized("wrongCredentials");
    }

    const matches = await bcrypt.compare(password, user.password);
    if (!matches) {
      throw ApiError.unauthorized("wrongCredentials");
    }

    const payload: AuthUser = {
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
    };

    return { token: this.signToken(payload), user: payload };
  }

  async getProfile(userId: string) {
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound("userNotFound");
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  }
}

export const authService = new AuthService();
