import { imagekit } from "../config/imagekit.js";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import { ApiError } from "../utils/ApiError.js";
import { uniqueSlug } from "../utils/slugify.js";

interface CategoryInput {
  name: string;
  nameEn?: string;
  order?: number;
}

class CategoryService {
  private async uploadImage(file: Express.Multer.File) {
    const response = await imagekit.upload({
      file: file.buffer,
      fileName: file.originalname,
      folder: "/albaraka/categories",
    });

    return imagekit.url({
      path: response.filePath,
      transformation: [
        { quality: "auto" },
        { format: "webp" },
        { width: "1024" },
      ],
    });
  }

  async getAll() {
    return Category.find()
      .select("name nameEn slug image order")
      .sort({ order: 1, createdAt: 1 });
  }

  async create(data: CategoryInput, file: Express.Multer.File) {
    const image = await this.uploadImage(file);
    return Category.create({ ...data, slug: uniqueSlug(data.name), image });
  }

  async update(
    id: string,
    data: Partial<CategoryInput>,
    file?: Express.Multer.File,
  ) {
    const category = await Category.findById(id);
    if (!category) throw ApiError.notFound("categoryNotFound");

    if (data.name !== undefined) {
      category.name = data.name;
      category.slug = uniqueSlug(data.name);
    }
    if (data.nameEn !== undefined) category.nameEn = data.nameEn;
    if (data.order !== undefined) category.order = data.order;
    if (file) category.image = await this.uploadImage(file);

    await category.save();
    return category;
  }

  async remove(id: string) {
    const productCount = await Product.countDocuments({ category: id });
    if (productCount > 0) {
      throw ApiError.conflict("categoryHasProducts", { count: productCount });
    }

    const category = await Category.findByIdAndDelete(id);
    if (!category) throw ApiError.notFound("categoryNotFound");
  }
}

export const categoryService = new CategoryService();
