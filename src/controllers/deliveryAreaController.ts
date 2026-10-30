import { Response } from "express";
import { deliveryAreaService } from "../services/deliveryAreaService.js";
import { asyncHandler, IdParam } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { t } from "../i18n/messages.js";
import { toBoolean, toNumber } from "../utils/parse.js";

export const getDeliveryAreas = asyncHandler(async (req, res: Response) => {
  // The storefront asks for ?activeOnly=true; the dashboard lists everything.
  res.json(await deliveryAreaService.list(req.query.activeOnly === "true"));
});

export const createDeliveryArea = asyncHandler(async (req, res: Response) => {
  const { name } = req.body;
  const price = toNumber(req.body.price);
  if (!name || price == null)
    throw ApiError.badRequest("areaFieldsRequired");

  res.status(201).json(
    await deliveryAreaService.create({
      name,
      nameEn: req.body.nameEn,
      price,
      isActive: toBoolean(req.body.isActive),
      order: toNumber(req.body.order),
    }),
  );
});

export const updateDeliveryArea = asyncHandler<IdParam>(
  async (req, res: Response) => {
    res.json(
      await deliveryAreaService.update(req.params.id, {
        name: req.body.name || undefined,
        nameEn: req.body.nameEn,
        price: toNumber(req.body.price),
        isActive: toBoolean(req.body.isActive),
        order: toNumber(req.body.order),
      }),
    );
  },
);

export const deleteDeliveryArea = asyncHandler<IdParam>(
  async (req, res: Response) => {
    await deliveryAreaService.remove(req.params.id);
    res.json({ message: t(req, "areaDeleted") });
  },
);
