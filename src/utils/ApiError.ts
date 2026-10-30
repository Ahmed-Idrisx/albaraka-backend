import type { MessageKey, MessageParams } from "../i18n/messages.js";

/**
 * Error carrying an HTTP status and a message key. The error handler turns the
 * key into Arabic or English text depending on the request.
 */
export class ApiError extends Error {
  statusCode: number;
  key: MessageKey;
  params?: MessageParams;

  constructor(statusCode: number, key: MessageKey, params?: MessageParams) {
    super(key);
    this.statusCode = statusCode;
    this.key = key;
    this.params = params;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(key: MessageKey, params?: MessageParams) {
    return new ApiError(400, key, params);
  }
  static unauthorized(key: MessageKey = "unauthorized") {
    return new ApiError(401, key);
  }
  static forbidden(key: MessageKey = "forbidden") {
    return new ApiError(403, key);
  }
  static notFound(key: MessageKey = "notFound") {
    return new ApiError(404, key);
  }
  static conflict(key: MessageKey, params?: MessageParams) {
    return new ApiError(409, key, params);
  }
}
