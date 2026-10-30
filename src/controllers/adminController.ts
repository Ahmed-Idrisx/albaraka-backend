import { Response } from "express";
import { adminService } from "../services/adminService.js";
import { asyncHandler, IdParam } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { t } from "../i18n/messages.js";

export const getAdmins = asyncHandler(async (_req, res: Response) => {
  res.json(await adminService.list());
});

export const createAdmin = asyncHandler(async (req, res: Response) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    throw ApiError.badRequest("allFieldsRequired");
  if (password.length < 8)
    throw ApiError.badRequest("passwordTooShort");

  res.status(201).json(await adminService.create({ name, email, password }));
});

export const updateAdmin = asyncHandler<IdParam>(async (req, res: Response) => {
  const { name, email } = req.body;
  res.json(await adminService.update(req.params.id, { name, email }));
});

export const deleteAdmin = asyncHandler<IdParam>(async (req, res: Response) => {
  await adminService.remove(req.params.id);
  res.json({ message: t(req, "adminDeleted") });
});
