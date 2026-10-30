import DeliveryArea, { IDeliveryArea } from "../models/DeliveryArea.js";
import { ApiError } from "../utils/ApiError.js";

interface DeliveryAreaInput {
  name: string;
  nameEn?: string;
  price: number;
  isActive?: boolean;
  order?: number;
}

class DeliveryAreaService {
  /** `activeOnly` for the storefront; the dashboard needs the hidden ones too. */
  async list(activeOnly = false) {
    const filter = activeOnly ? { isActive: true } : {};
    return DeliveryArea.find(filter)
      .select("name nameEn price isActive order")
      .sort({ order: 1, name: 1 });
  }

  async create(data: DeliveryAreaInput) {
    return DeliveryArea.create(data);
  }

  async update(id: string, data: Partial<DeliveryAreaInput>) {
    const area = await DeliveryArea.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    if (!area) throw ApiError.notFound("areaNotFound");
    return area;
  }

  async remove(id: string) {
    const area = await DeliveryArea.findByIdAndDelete(id);
    if (!area) throw ApiError.notFound("areaNotFound");
  }
  // resolveFee is used by the checkout form to calculate the delivery fee based on the selected area.
  async resolveFee(
    areaId?: string,
  ): Promise<{ fee: number; area: IDeliveryArea | null }> {
    const activeAreas = await DeliveryArea.countDocuments({ isActive: true });
    if (activeAreas === 0) return { fee: 0, area: null };

    if (!areaId) throw ApiError.badRequest("areaRequired");

    const area = await DeliveryArea.findById(areaId);
    if (!area || !area.isActive)
      throw ApiError.badRequest("areaUnavailable");

    return { fee: area.price, area };
  }
}

export const deliveryAreaService = new DeliveryAreaService();
