import Product from "../models/Product.js";
import Category from "../models/Category.js";
import { ApiError } from "../utils/ApiError.js";
import { uniqueSlug } from "../utils/slugify.js";
import { imagekit } from "../config/imagekit.js";

interface ProductInput {
  name: string;
  description?: string;
  category: string;
  price: number;
  discountPrice?: number;
  unit: string;
  stock: number;
  isAvailable?: boolean;
}

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
  async list() {
    return Product.find().populate("category", "name slug");
  }

  async homeSections() {
    const categories = await Category.find().sort({ order: 1, createdAt: 1 });

    const sections = await Promise.all(
      categories.map(async (category) => ({
        category,
        products: await Product.find({ category: category._id })
          .populate("category", "name slug")
          .sort({ isAvailable: -1, createdAt: -1 }),
      })),
    );

    // A category with no products at all would render an empty row.
    return sections.filter((section) => section.products.length > 0);
  }

  async getById(id: string) {
    const product = await Product.findById(id).populate(
      "category",
      "name slug",
    );
    if (!product) throw ApiError.notFound("المنتج غير موجود");
    return product;
  }

  async getBySlug(slug: string) {
    const product = await Product.findOne({ slug }).populate(
      "category",
      "name slug",
    );
    if (!product) throw ApiError.notFound("المنتج غير موجود");
    return product;
  }

  async create(data: ProductInput, file: Express.Multer.File) {
    await this.assertCategoryExists(data.category);
    this.assertPricing(data.price, data.discountPrice);
    const image = await this.uploadImage(file);

    return Product.create({
      ...data,
      slug: uniqueSlug(data.name),
      ...(image && { image }),
    });
  }

  async update(
    id: string,
    data: Partial<ProductInput>,
    file?: Express.Multer.File,
  ) {
    const existing = await Product.findById(id);
    if (!existing) throw ApiError.notFound("المنتج غير موجود");

    if (data.category) await this.assertCategoryExists(data.category);

    this.assertPricing(
      data.price ?? existing.price,
      data.discountPrice ?? existing.discountPrice,
    );

    // Caught here as well as in the model hook: switching a product back on without
    // touching its stock sends no stock field at all, so the hook has nothing to read.
    const updateData: Partial<ProductInput> & { image?: string } = { ...data };
    if ((updateData.stock ?? existing.stock) === 0) {
      updateData.isAvailable = false;
    }
    if (file) updateData.image = await this.uploadImage(file);

    const product = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate("category", "name slug");
    return product;
  }

  async remove(id: string) {
    const product = await Product.findByIdAndDelete(id);
    if (!product) throw ApiError.notFound("المنتج غير موجود");
  }

  private async assertCategoryExists(categoryId: string) {
    const exists = await Category.exists({ _id: categoryId });
    if (!exists) throw ApiError.badRequest("التصنيف المحدد غير موجود");
  }

  private assertPricing(price: number, discountPrice?: number | null) {
    if (discountPrice != null && discountPrice >= price) {
      throw ApiError.badRequest("سعر الخصم يجب أن يكون أقل من السعر الأساسي");
    }
  }
}

export const productService = new ProductService();
