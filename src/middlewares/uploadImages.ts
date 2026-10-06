import multer from "multer";
import { ApiError } from "../utils/ApiError.js";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB per image
const storage = multer.memoryStorage(); // Store files in memory for processing before uploading to ImageKit

export const upload = multer({
  storage: storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(ApiError.badRequest("الملف المرفوع يجب أن يكون صورة"));
    }
    return cb(null, true);
  },
});
