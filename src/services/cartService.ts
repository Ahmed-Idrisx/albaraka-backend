import { isValidObjectId } from "mongoose";
import Product from "../models/Product.js";
import DeliveryArea from "../models/DeliveryArea.js";
import { settingsService } from "./settingsService.js";

interface CartLine {
  productId: string;
  quantity: number;
}

/**
 * Why a line can't be ordered as is. The storefront turns the code into text
 * in the customer's language.
 */
type CartIssue = "removed" | "unavailable" | "out_of_stock" | "limited_stock";

class CartService {
  /**
   * Re-prices a guest's cart from the database. Every line comes back with an
   * `issue` code (null when it can be ordered as is).
   */
  async validate(lines: CartLine[], deliveryAreaId?: string) {
    const products = await Product.find({
      _id: { $in: lines.map((line) => line.productId).filter(isValidObjectId) },
    }).select(
      "name nameEn slug image unit unitEn price discountPrice stock isAvailable",
    );

    await settingsService.fillUnitEn(products);

    const items = lines.map((line) => {
      const product = products.find(
        (candidate) => candidate.id === line.productId,
      );

      if (!product) {
        return {
          productId: line.productId,
          quantity: line.quantity,
          issue: "removed" as CartIssue,
        };
      }

      const price = product.discountPrice ?? product.price;
      const quantity = Math.max(
        1,
        Math.min(line.quantity, product.stock || line.quantity),
      );

      let issue: CartIssue | null = null;
      if (!product.isAvailable) issue = "unavailable";
      else if (product.stock === 0) issue = "out_of_stock";
      else if (product.stock < line.quantity) issue = "limited_stock";

      return {
        productId: product.id,
        name: product.name,
        nameEn: product.nameEn,
        slug: product.slug,
        image: product.image,
        unit: product.unit,
        unitEn: product.unitEn,
        price,
        quantity,
        lineTotal: price * quantity,
        // How many are left, so "only N left" can be shown.
        stock: product.stock,
        issue,
      };
    });

    // Delivery is priced purely by the area the customer picks.
    let deliveryFee = 0;
    if (deliveryAreaId && isValidObjectId(deliveryAreaId)) {
      const area = await DeliveryArea.findOne({
        _id: deliveryAreaId,
        isActive: true,
      }).select("price");
      deliveryFee = area?.price ?? 0;
    }

    const subtotal = items.reduce(
      (sum, item) => sum + (item.issue ? 0 : (item.lineTotal ?? 0)),
      0,
    );

    return {
      items,
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
      canCheckout: items.length > 0 && items.every((item) => !item.issue),
    };
  }
}

export const cartService = new CartService();
