import { Response } from "express";
import { categoryService } from "../services/categoryService.js";
import { asyncHandler, IdParam } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { t } from "../i18n/messages.js";
import { toNumber } from "../utils/parse.js";

export const getCategories = asyncHandler(async (_req, res: Response) => {
  res.json(await categoryService.getAll());
});

export const createCategory = asyncHandler(async (req, res: Response) => {
  const { name } = req.body;
  if (!name) throw ApiError.badRequest("categoryNameRequired");
  if (!req.file) throw ApiError.badRequest("categoryImageRequired");

  res
    .status(201)
    .json(
      await categoryService.create(
        { name, nameEn: req.body.nameEn, order: toNumber(req.body.order) },
        req.file,
      ),
    );
});

export const updateCategory = asyncHandler<IdParam>(
  async (req, res: Response) => {
    const name = req.body.name || undefined;
    const nameEn = req.body.nameEn;
    const order = toNumber(req.body.order);
    res.json(
      await categoryService.update(
        req.params.id,
        { name, nameEn, order },
        req.file,
      ),
    );
  },
);

export const deleteCategory = asyncHandler<IdParam>(
  async (req, res: Response) => {
    await categoryService.remove(req.params.id);
    res.json({ message: t(req, "categoryDeleted") });
  },
);
