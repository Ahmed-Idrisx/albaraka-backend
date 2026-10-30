import { Request, Response } from "express";
import { productService, ProductSort } from "../services/productService.js";
import { asyncHandler, IdParam } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { t } from "../i18n/messages.js";
import { toBoolean, toNumber, toPagination } from "../utils/parse.js";

/** Reads the product fields from a multipart body. An empty discount clears it. */
const readProductBody = (body: Request["body"]) => ({
  name: body.name || undefined,
  nameEn: body.nameEn,
  description: body.description,
  descriptionEn: body.descriptionEn,
  category: body.category || undefined,
  price: toNumber(body.price),
  discountPrice:
    body.discountPrice === "" ? null : toNumber(body.discountPrice),
  unit: body.unit || undefined,
  stock: toNumber(body.stock),
  isAvailable: toBoolean(body.isAvailable),
});

const SORTS: ProductSort[] = ["newest", "price_asc", "price_desc"];

/**
 * GET /products?category=<slug>&search=&minPrice=&maxPrice=&available=true
 *              &sort=newest|price_asc|price_desc&page=&limit=
 */
export const getProducts = asyncHandler(async (req, res: Response) => {
  const { category, search, sort } = req.query;
  res.json(
    await productService.list({
      category: typeof category === "string" ? category : undefined,
      search: typeof search === "string" ? search : undefined,
      minPrice: toNumber(req.query.minPrice),
      maxPrice: toNumber(req.query.maxPrice),
      availableOnly: toBoolean(req.query.available) === true,
      sort: SORTS.includes(sort as ProductSort)
        ? (sort as ProductSort)
        : "newest",
      ...toPagination(req.query),
    }),
  );
});

/** GET /products/price-range — lowest and highest price, for filter hints. */
export const getPriceRange = asyncHandler(async (_req, res: Response) => {
  res.json(await productService.priceRange());
});

/** Home page: every category with its newest products, in one request. */
export const getHomeSections = asyncHandler(async (_req, res: Response) => {
  res.json(await productService.homeSections());
});

export const getProduct = asyncHandler<IdParam>(async (req, res: Response) => {
  res.json(await productService.getById(req.params.id));
});

export const getProductBySlug = asyncHandler<{ slug: string }>(
  async (req, res: Response) => {
    res.json(await productService.getBySlug(req.params.slug));
  },
);

export const createProduct = asyncHandler(async (req, res: Response) => {
  const { name, category, price, unit, stock, ...rest } = readProductBody(
    req.body,
  );

  if (!name || !category || price == null || !unit) {
    throw ApiError.badRequest("productFieldsRequired");
  }
  if (!req.file) throw ApiError.badRequest("productImageRequired");

  res
    .status(201)
    .json(
      await productService.create(
        { ...rest, name, category, price, unit, stock: stock ?? 0 },
        req.file,
      ),
    );
});

export const updateProduct = asyncHandler<IdParam>(
  async (req, res: Response) => {
    res.json(
      await productService.update(
        req.params.id,
        readProductBody(req.body),
        req.file,
      ),
    );
  },
);

export const deleteProduct = asyncHandler<IdParam>(
  async (req, res: Response) => {
    await productService.remove(req.params.id);
    res.json({ message: t(req, "productDeleted") });
  },
);
