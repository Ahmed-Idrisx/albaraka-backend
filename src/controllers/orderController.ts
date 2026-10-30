import { Response } from "express";
import { orderService } from "../services/orderService.js";
import { asyncHandler, IdParam } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { OrderStatus, PaymentStatus } from "../types/index.js";
import { toPagination } from "../utils/parse.js";

const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

/** Public — guest checkout. */
export const createOrder = asyncHandler(async (req, res: Response) => {
  const { customer, items, deliveryAreaId } = req.body;
  const name = String(customer?.name ?? "").trim();
  const phone = String(customer?.phone ?? "").trim();
  const address = String(customer?.address ?? "").trim();
  if (!name || !phone || !address) {
    throw ApiError.badRequest("customerFieldsRequired");
  }
  if (!Array.isArray(items)) throw ApiError.badRequest("invalidCart");

  res.status(201).json(
    await orderService.create({
      // Only the fields the order stores — never the raw body.
      customer: { name, phone, address, notes: typeof customer.notes === "string" ? customer.notes.trim() : undefined },
      items,
      deliveryAreaId,
    }),
  );
});

/** Public — guests look up their own order by its number. */
export const trackOrder = asyncHandler(async (req, res: Response) => {
  const { orderNumber } = req.query;
  if (!orderNumber) throw ApiError.badRequest("orderNumberRequired");

  res.json(await orderService.trackOrder(String(orderNumber)));
});

/** GET /orders?status=&page=&limit= — dashboard list, newest first. */
export const getOrders = asyncHandler(async (req, res: Response) => {
  const status = req.query.status as OrderStatus | undefined;
  res.json(
    await orderService.list({
      status: status && ORDER_STATUSES.includes(status) ? status : undefined,
      ...toPagination(req.query),
    }),
  );
});

export const getOrder = asyncHandler<IdParam>(async (req, res: Response) => {
  res.json(await orderService.getById(req.params.id));
});

export const updateOrderStatus = asyncHandler<IdParam>(
  async (req, res: Response) => {
    const { status } = req.body;
    if (!ORDER_STATUSES.includes(status))
      throw ApiError.badRequest("invalidStatus");

    res.json(await orderService.updateStatus(req.params.id, status));
  },
);

export const updatePaymentStatus = asyncHandler<IdParam>(
  async (req, res: Response) => {
    const { paymentStatus } = req.body as { paymentStatus: PaymentStatus };
    if (!["unpaid", "paid"].includes(paymentStatus))
      throw ApiError.badRequest("invalidPaymentStatus");

    res.json(
      await orderService.updatePaymentStatus(req.params.id, paymentStatus),
    );
  },
);

export const getStats = asyncHandler(async (_req, res: Response) => {
  res.json(await orderService.stats());
});

export const getAnalytics = asyncHandler(async (req, res: Response) => {
  const days = req.query.days ? Number(req.query.days) : undefined;

  // only allow 7–90 days to avoid abuse and performance issues
  res.json(
    await orderService.analytics(
      days ? Math.min(Math.max(days, 7), 90) : undefined,
    ),
  );
});
