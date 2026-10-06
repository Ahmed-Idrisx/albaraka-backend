import Order, { IOrder, IOrderItem } from "../models/Order.js";
import Product from "../models/Product.js";
import { OrderStatus, PaymentStatus } from "../types/index.js";
import { ApiError } from "../utils/ApiError.js";
import { deliveryAreaService } from "./deliveryAreaService.js";

interface CreateOrderInput {
  customer: {
    name: string;
    phone: string;
    address: string;
    city?: string;
    notes?: string;
  };
  items: { productId: string; quantity: number }[];
  /** Required once the shop has set up delivery areas. */
  deliveryAreaId?: string;
}

/** The part of an order line that inventory cares about. */
type StockLine = Pick<IOrderItem, "product" | "name" | "quantity">;

/** The fields an order is created with — the rest of the schema has defaults. */
type NewOrder = Pick<
  IOrder,
  | "orderNumber"
  | "customer"
  | "items"
  | "deliveryArea"
  | "subtotal"
  | "deliveryFee"
  | "total"
>;

class OrderService {
  async list() {
    return Order.find().sort({ createdAt: 1 });
  }

  async getById(id: string) {
    const order = await Order.findById(id);
    if (!order) throw ApiError.notFound("الطلب غير موجود");
    return order;
  }

  async trackOrder(orderNumber: string) {
    const order = await Order.findOne({
      orderNumber: orderNumber.trim().toUpperCase(),
    }).select("-customer");

    if (!order) throw ApiError.notFound("لم يتم العثور على طلب بهذا الرقم");
    return order;
  }

  async create({ customer, items, deliveryAreaId }: CreateOrderInput) {
    if (!items?.length) throw ApiError.badRequest("السلة فارغة");

    const lines = this.mergeLines(items);

    // The fee comes from the chosen area, never from the client.
    const { fee: deliveryFee, area } =
      await deliveryAreaService.resolveFee(deliveryAreaId);
    const products = await Product.find({
      _id: { $in: lines.map((line) => line.productId) },
    });

    const orderItems: IOrderItem[] = lines.map((line) => {
      const product = products.find(
        (candidate) => candidate.id === line.productId,
      );
      if (!product) throw ApiError.badRequest("أحد المنتجات لم يعد متاحًا");
      if (!product.isAvailable)
        throw ApiError.badRequest(`المنتج "${product.name}" غير متاح حاليًا`);

      return {
        product: product._id as IOrderItem["product"],
        name: product.name,
        price: product.discountPrice ?? product.price,
        unit: product.unit,
        quantity: line.quantity,
      };
    });

    // Stock first: if the shop can't cover the order, nothing else should have
    // happened. This throws when a line can't be met.
    await this.reserveStock(orderItems);

    const subtotal = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    let order;
    try {
      order = await this.insertWithOrderNumber({
        customer,
        items: orderItems,
        deliveryArea: area
          ? { area: area._id, name: area.name, price: area.price }
          : undefined,
        subtotal,
        deliveryFee,
        total: subtotal + deliveryFee,
      });
    } catch (error) {
      // The goods were taken off the shelf for an order that never existed.
      await this.releaseStock(orderItems);
      throw error;
    }

    return order;
  }

  async updateStatus(id: string, status: OrderStatus) {
    const order = await Order.findById(id);
    if (!order) throw ApiError.notFound("الطلب غير موجود");

    const wasCancelled = order.status === "cancelled";
    const isCancelling = status === "cancelled";

    if (isCancelling && !wasCancelled) {
      // Returning stock on cancellation keeps inventory honest without a separate job.
      await this.releaseStock(order.items);
    } else if (wasCancelled && !isCancelling) {
      // If an admin reactivates a cancelled order, the stock must be reserved again.
      await this.reserveStock(order.items);
    }

    order.status = status;
    await order.save();
    return order;
  }

  async updatePaymentStatus(id: string, paymentStatus: PaymentStatus) {
    const order = await Order.findByIdAndUpdate(
      id,
      { paymentStatus },
      { new: true },
    );
    if (!order) throw ApiError.notFound("الطلب غير موجود");
    return order;
  }

  async stats() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [todayOrders, pendingOrders, deliveredOrders, revenueAgg] =
      await Promise.all([
        Order.countDocuments({ createdAt: { $gte: startOfDay } }),
        Order.countDocuments({ status: "pending" }),
        Order.countDocuments({ status: "delivered" }),
        Order.aggregate([
          { $match: { status: "delivered" } },
          { $group: { _id: null, total: { $sum: "$total" } } },
        ]),
      ]);

    return {
      todayOrders,
      pendingOrders,
      deliveredOrders,
      totalRevenue: revenueAgg[0]?.total ?? 0,
    };
  }

  async analytics(days = 14) {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - (days - 1));

    const sold = { status: { $ne: "cancelled" } };

    const [daily, byStatus, topProducts] = await Promise.all([
      Order.aggregate<{ _id: string; orders: number; revenue: number }>([
        { $match: { createdAt: { $gte: since }, ...sold } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            orders: { $sum: 1 },
            revenue: { $sum: "$total" },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      Order.aggregate<{ _id: OrderStatus; count: number }>([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),

      Order.aggregate<{ _id: string; quantity: number; revenue: number }>([
        { $match: sold },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.name",
            quantity: { $sum: "$items.quantity" },
            revenue: {
              $sum: { $multiply: ["$items.price", "$items.quantity"] },
            },
          },
        },
        { $sort: { quantity: -1 } },
        { $limit: 5 },
      ]),
    ]);

    return {
      daily: this.fillDays(since, days, daily),
      byStatus: byStatus.map(({ _id, count }) => ({ status: _id, count })),
      topProducts: topProducts.map(({ _id, quantity, revenue }) => ({
        name: _id,
        quantity,
        revenue,
      })),
    };
  }

  private fillDays(
    since: Date,
    days: number,
    rows: { _id: string; orders: number; revenue: number }[],
  ) {
    const found = new Map(rows.map((row) => [row._id, row]));

    return Array.from({ length: days }, (_, offset) => {
      const day = new Date(since);
      day.setDate(day.getDate() + offset);
      const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(
        day.getDate(),
      ).padStart(2, "0")}`;

      return {
        date: key,
        orders: found.get(key)?.orders ?? 0,
        revenue: found.get(key)?.revenue ?? 0,
      };
    });
  }

  private mergeLines(items: CreateOrderInput["items"]) {
    const totals = new Map<string, number>();

    for (const item of items) {
      if (!Number.isFinite(item.quantity) || item.quantity < 1) {
        throw ApiError.badRequest("الكمية يجب أن تكون 1 على الأقل");
      }

      totals.set(
        item.productId,
        (totals.get(item.productId) ?? 0) + item.quantity,
      );
    }

    return [...totals].map(([productId, quantity]) => ({
      productId,
      quantity,
    }));
  }

  private async reserveStock(items: StockLine[]) {
    const taken: StockLine[] = [];

    for (const item of items) {
      const result = await Product.updateOne(
        {
          _id: item.product,
          isAvailable: true,
          stock: { $gte: item.quantity },
        },
        [
          { $set: { stock: { $subtract: ["$stock", item.quantity] } } },
          {
            $set: {
              isAvailable: {
                $cond: [{ $lte: ["$stock", 0] }, false, "$isAvailable"],
              },
            },
          },
        ],
      );
      if (result.modifiedCount !== 1) {
        await this.releaseStock(taken);
        throw ApiError.badRequest(
          `الكمية المطلوبة من "${item.name}" غير متوفرة`,
        );
      }

      taken.push(item);
    }
  }

  private async releaseStock(items: StockLine[]) {
    await Promise.all(
      items.map((item) =>
        Product.updateOne(
          { _id: item.product },
          { $inc: { stock: item.quantity } },
        ),
      ),
    );
  }

  private async insertWithOrderNumber(fields: Omit<NewOrder, "orderNumber">) {
    for (let attempt = 1; ; attempt++) {
      try {
        return await Order.create({
          ...fields,
          orderNumber: await this.generateOrderNumber(),
        });
      } catch (error) {
        if ((error as { code?: number }).code !== 11000 || attempt === 5)
          throw error;
      }
    }
  }

  private async generateOrderNumber(): Promise<string> {
    const now = new Date();
    const datePart =
      String(now.getFullYear() % 100).padStart(2, "0") +
      String(now.getMonth() + 1).padStart(2, "0") +
      String(now.getDate()).padStart(2, "0");

    const latest = await Order.findOne({
      orderNumber: new RegExp(`^AB-${datePart}-`),
    })
      .sort({ orderNumber: -1 })
      .select("orderNumber")
      .lean<{ orderNumber: string } | null>();

    const sequence = latest ? Number(latest.orderNumber.slice(-4)) + 1 : 1;
    return `AB-${datePart}-${String(sequence).padStart(4, "0")}`;
  }
}

export const orderService = new OrderService();
