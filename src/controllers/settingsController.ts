import { Response } from "express";
import { settingsService } from "../services/settingsService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import type { IUnit } from "../models/Settings.js";

const TEXT_FIELDS = [
  "storeName",
  "storeNameEn",
  "storePhone",
  "workingHours",
  "workingHoursEn",
] as const;

export const getSettings = asyncHandler(async (_req, res: Response) => {
  res.json(await settingsService.get());
});

export const updateSettings = asyncHandler(async (req, res: Response) => {
  const patch: Record<string, unknown> = Object.fromEntries(
    TEXT_FIELDS.filter((key) => typeof req.body[key] === "string").map(
      (key) => [key, req.body[key].trim()],
    ),
  );

  // Units arrive as [{ ar, en }]; every unit needs at least its Arabic name.
  if (req.body.units !== undefined) {
    const units = req.body.units as IUnit[];
    if (
      !Array.isArray(units) ||
      units.length === 0 ||
      units.some((u) => typeof u?.ar !== "string" || !u.ar.trim())
    ) {
      throw ApiError.badRequest("invalidData");
    }
    patch.units = units.map((u) => ({
      ar: u.ar.trim(),
      en: typeof u.en === "string" ? u.en.trim() : "",
    }));
  }

  res.json(await settingsService.update(patch));
});
