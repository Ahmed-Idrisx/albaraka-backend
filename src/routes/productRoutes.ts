import { Router } from "express";
import {
  getProducts,
  getProduct,
  getProductBySlug,
  getHomeSections,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/uploadImages.js";

const router = Router();

// Public — the literal paths must be declared before "/:id" or they'd be read as ids.
router.get("/", getProducts);
router.get("/home", getHomeSections);
router.get("/slug/:slug", getProductBySlug);
router.get("/:id", getProduct);

// Dashboard
router.post("/", protect, upload.single("image"), createProduct);
router.patch("/:id", protect, upload.single("image"), updateProduct);
router.delete("/:id", protect, deleteProduct);

export default router;
