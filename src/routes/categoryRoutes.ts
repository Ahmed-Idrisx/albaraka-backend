import { Router } from "express";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/uploadImages.js";

const router = Router();

// Public — the storefront needs the category list.
router.get("/", getCategories);

// Dashboard
router.post("/", protect, upload.single("image"), createCategory);
router.patch("/:id", protect, upload.single("image"), updateCategory);
router.delete("/:id", protect, deleteCategory);

export default router;
