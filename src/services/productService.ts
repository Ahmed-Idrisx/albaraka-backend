import Product from "../models/Product.js";
import Category from "../models/Category.js";
import { ApiError } from "../utils/ApiError.js";
import { uniqueSlug } from "../utils/slugify.js";
import { escapeRegex } from "../utils/escapeRegex.js";
import { paginated } from "../utils/parse.js";
import { imagekit } from "../config/imagekit.js";
import { settingsService } from "./settingsService.js";

interface ProductInput {
  name: string;
  nameEn?: string;
  description?: string;
  descriptionEn?: string;
  category: string;
  price: number;
  /** `null` removes an existing discount. */
  discountPrice?: number | null;
  unit: string;
  stock: number;
  isAvailable?: boolean;
}

export type ProductSort = "newest" | "price_asc" | "price_desc";

interface ListFilters {
  category?: string; // category slug
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  availableOnly?: boolean;
  sort: ProductSort;
  page: number;
  limit: number;
  skip: number;
}

/** What a product card needs — lists never send descriptions or timestamps. */
const CARD_FIELDS =
  "name nameEn slug price discountPrice unit unitEn stock image isAvailable category";
const CATEGORY_FIELDS = "name nameEn slug";

// Prices filter and sort on what the customer actually pays.
const SORTS: Record<ProductSort, Record<string, 1 | -1>> = {
  newest: { isAvailable: -1, createdAt: -1, _id: 1 },
  price_asc: { effectivePrice: 1, _id: 1 },
  price_desc: { effectivePrice: -1, _id: 1 },
};
const HOME_PRODUCTS_PER_CATEGORY = 8;

class ProductService {
  private async uploadImage(file: Express.Multer.File) {
    const response = await imagekit.upload({
      file: file.buffer,
      fileName: file.originalname,
      folder: "/albaraka/products",
    });

    return imagekit.url({
      path: response.filePath,
      transformation: [
        { quality: "auto" },
        { format: "webp" },
        { width: "512" },
      ],
    });
  }

  async list({
    category,
    search,
    minPrice,
    maxPrice,
    availableOnly,
    sort,
    page,
    limit,
    skip,
  }: ListFilters) {
    const match: Record<string, unknown> = {};

    if (category) {
      const found = await Category.findOne({ slug: category }).select("_id");
      if (!found) return paginated([], 0, { page, limit });
      match.category = found._id;
    }
    if (search?.trim()) {
      // Customers may search in either language.
      const pattern = { $regex: escapeRegex(search.trim()), $options: "i" };
      match.$or = [{ name: pattern }, { nameEn: pattern }];
    }
    if (availableOnly) match.isAvailable = true;

    const priceRange: Record<string, number> = {};
    if (minPrice != null) priceRange.$gte = minPrice;
    if (maxPrice != null) priceRange.$lte = maxPrice;

    const [result] = await Product.aggregate<{
      items: Record<string, unknown>[];
      total: { count: number }[];
    }>([
      { $match: match },
      {
        $addFields: {
          effectivePrice: { $ifNull: ["$discountPrice", "$price"] },
        },
      },
      ...(Object.keys(priceRange).length
        ? [{ $match: { effectivePrice: priceRange } }]
        : []),
      {
        $facet: {
          items: [
            { $sort: SORTS[sort] },
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                effectivePrice: 0,
                description: 0,
                descriptionEn: 0,
                __v: 0,
              },
            },
          ],
          total: [{ $count: "count" }],
        },
      },
    ]);

    // Back to documents so they get the same `id` JSON shape as every other endpoint.
    const items = await Product.populate(
      result.items.map((doc) => Product.hydrate(doc)),
      { path: "category", select: CATEGORY_FIELDS },
    );

    await settingsService.fillUnitEn(items);
    return paginated(items, result.total[0]?.count ?? 0, { page, limit });
  }

  /** The cheapest and dearest price in the shop, for the price filter's hints. */
  async priceRange() {
    const [range] = await Product.aggregate<{ min: number; max: number }>([
      { $project: { p: { $ifNull: ["$discountPrice", "$price"] } } },
      { $group: { _id: null, min: { $min: "$p" }, max: { $max: "$p" } } },
    ]);
    return { min: range?.min ?? 0, max: range?.max ?? 0 };
  }

  /** Home page: each category with a handful of its newest products. */
  async homeSections() {
    const categories = await Category.find()
      .select("name nameEn slug image")
      .sort({ order: 1, createdAt: 1 });

    const sections = await Promise.all(
      categories.map(async (category) => ({
        category,
        availableCount: await Product.countDocuments({
          category: category._id,
          isAvailable: true,
        }),
        products: await Product.find({ category: category._id })
          .select(CARD_FIELDS)
          .sort({ isAvailable: -1, createdAt: -1 })
          .limit(HOME_PRODUCTS_PER_CATEGORY),
      })),
    );

    await settingsService.fillUnitEn(sections.flatMap((s) => s.products));
    // A category with no products at all would render an empty row.
    return sections.filter((section) => section.products.length > 0);
  }

  async getById(id: string) {
    const product = await Product.findById(id).populate(
      "category",
      CATEGORY_FIELDS,
    );
    if (!product) throw ApiError.notFound("productNotFound");
    await settingsService.fillUnitEn([product]);
    return product;
  }

  async getBySlug(slug: string) {
    const product = await Product.findOne({ slug }).populate(
      "category",
      CATEGORY_FIELDS,
    );
    if (!product) throw ApiError.notFound("productNotFound");
    await settingsService.fillUnitEn([product]);
    return product;
  }

  async create(data: ProductInput, file: Express.Multer.File) {
    await this.assertCategoryExists(data.category);
    this.assertPricing(data.price, data.discountPrice);

    return Product.create({
      ...data,
      unitEn: await settingsService.unitEn(data.unit),
      discountPrice: data.discountPrice ?? undefined,
      slug: uniqueSlug(data.name),
      image: await this.uploadImage(file),
    });
  }

  async update(
    id: string,
    data: Partial<ProductInput>,
    file?: Express.Multer.File,
  ) {
    const existing = await Product.findById(id);
    if (!existing) throw ApiError.notFound("productNotFound");

    if (data.category) await this.assertCategoryExists(data.category);

    this.assertPricing(
      data.price ?? existing.price,
      data.discountPrice !== undefined
        ? data.discountPrice
        : existing.discountPrice,
    );

    // Caught here as well as in the model hook: switching a product back on without
    // touching its stock sends no stock field at all, so the hook has nothing to read.
    const updateData: Partial<ProductInput> & { image?: string } = { ...data };
    if ((updateData.stock ?? existing.stock) === 0) {
      updateData.isAvailable = false;
    }
    if (file) updateData.image = await this.uploadImage(file);
    const unitEn = data.unit
      ? await settingsService.unitEn(data.unit)
      : undefined;

    return Product.findByIdAndUpdate(id, { ...updateData, unitEn }, {
      new: true,
      runValidators: true,
    }).populate("category", CATEGORY_FIELDS);
  }

  async remove(id: string) {
    const product = await Product.findByIdAndDelete(id);
    if (!product) throw ApiError.notFound("productNotFound");
  }

  private async assertCategoryExists(categoryId: string) {
    const exists = await Category.exists({ _id: categoryId });
    if (!exists) throw ApiError.badRequest("invalidCategory");
  }

  private assertPricing(price: number, discountPrice?: number | null) {
    if (
      discountPrice != null &&
      (discountPrice <= 0 || discountPrice >= price)
    ) {
      throw ApiError.badRequest("invalidDiscount");
    }
  }
}

export const productService = new ProductService();
