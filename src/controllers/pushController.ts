import { Response } from "express";
import { pushService } from "../services/pushService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { t } from "../i18n/messages.js";
import { AuthRequest } from "../types/index.js";
import { env } from "../config/env.js";

export const getPublicKey = asyncHandler(async (_req, res: Response) => {
  res.json({ publicKey: env.VAPID_PUBLIC_KEY ?? null });
});

export const subscribe = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth)
      throw ApiError.badRequest("subscriptionIncomplete");

    await pushService.subscribe(req.user!.id, { endpoint, keys });
    res.status(201).json({ message: t(req, "pushEnabled") });
  },
);

export const unsubscribe = asyncHandler(async (req, res: Response) => {
  const { endpoint } = req.body;
  if (!endpoint) throw ApiError.badRequest("endpointRequired");

  await pushService.unsubscribe(endpoint);
  res.json({ message: t(req, "pushDisabled") });
});

export const sendTest = asyncHandler(async (_req, res: Response) => {
  await pushService.broadcast({
    title: "تجربة إشعار",
    body: "الإشعارات تعمل بنجاح ✅",
    url: "/dashboard/orders",
  });
  res.json({ message: t(_req, "pushTestSent") });
});
