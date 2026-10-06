import { Response } from "express";
import { productService } from "../services/productService.js";
import { asyncHandler, IdParam } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

export const getProducts = asyncHandler(async (_req, res: Response) => {
  res.json(await productService.list());
});

/** Home page: every category with its newest products, in one request to avoid multiple calls. */
export const getHomeSections = asyncHandler(async (_req, res: Response) => {
  res.json(await productService.homeSections());
});

export const getProduct = asyncHandler<IdParam>(async (req, res: Response) => {
  res.json(await productService.getById(req.params.id));
});

export const getProductBySlug = asyncHandler<{ slug: string }>(
  async (req, res: Response) => {
    res.json(await productService.getBySlug(req.params.slug));
  },
);

export const createProduct = asyncHandler(async (req, res: Response) => {
  const {
    name,
    description,
    category,
    price,
    discountPrice,
    unit,
    stock,
    isAvailable,
  } = req.body;

  if (!name || !category || price == null || !unit) {
    throw ApiError.badRequest("الاسم والتصنيف والسعر والوحدة حقول مطلوبة");
  }
  if (!req.file) throw ApiError.badRequest("صورة المنتج مطلوبة");

  res.status(201).json(
    await productService.create(
      {
        name,
        description,
        category,
        price: Number(price),
        discountPrice:
          discountPrice != null ? Number(discountPrice) : undefined,
        unit,
        stock: Number(stock ?? 0),
        isAvailable,
      },
      req.file,
    ),
  );
});

export const updateProduct = asyncHandler<IdParam>(
  async (req, res: Response) => {
    const {
      name,
      description,
      category,
      price,
      discountPrice,
      unit,
      stock,
      isAvailable,
    } = req.body;
    res.json(
      await productService.update(
        req.params.id,
        {
          name,
          description,
          category,
          price: price != null ? Number(price) : undefined,
          discountPrice:
            discountPrice != null ? Number(discountPrice) : undefined,
          unit,
          stock: stock != null ? Number(stock) : undefined,
          isAvailable: isAvailable != null ? isAvailable === "true" : undefined,
        },
        req.file,
      ),
    );
  },
);

export const deleteProduct = asyncHandler<IdParam>(
  async (req, res: Response) => {
    await productService.remove(req.params.id);
    res.json({ message: "تم حذف المنتج" });
  },
);
