import { Response } from "express";
import { categoryService } from "../services/categoryService.js";
import { asyncHandler, IdParam } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

export const getCategories = asyncHandler(async (_req, res: Response) => {
  res.json(await categoryService.getAll());
});

export const createCategory = asyncHandler(async (req, res: Response) => {
  const { name, order } = req.body;
  if (!name) throw ApiError.badRequest("اسم التصنيف مطلوب");

  res.status(201).json(await categoryService.create({ name, order }, req.file));
});

export const updateCategory = asyncHandler<IdParam>(
  async (req, res: Response) => {
    const { name, order } = req.body;
    res.json(
      await categoryService.update(req.params.id, { name, order }, req.file),
    );
  },
);

export const deleteCategory = asyncHandler<IdParam>(
  async (req, res: Response) => {
    await categoryService.remove(req.params.id);
    res.json({ message: "تم حذف التصنيف" });
  },
);
