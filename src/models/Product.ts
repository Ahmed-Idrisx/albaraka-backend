import { Schema, model, Document, Types } from "mongoose";

// The unit list itself is admin-editable via Settings, this is just the stored value on the product.
// Every text field has an English twin (`...En`); empty means "use the Arabic".
export interface IProduct extends Document {
  name: string;
  nameEn: string;
  slug: string;
  description?: string;
  descriptionEn?: string;
  category: Types.ObjectId;
  price: number;
  discountPrice?: number;
  unit: string; // Arabic unit name from Settings.units, e.g. "كجم"
  unitEn: string; // its English name, copied from Settings.units on save
  stock: number;
  image: string;
  isAvailable: boolean;
  createdAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    nameEn: { type: String, trim: true, default: "" },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: { type: String, trim: true },
    descriptionEn: { type: String, trim: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, min: 0 },
    unit: { type: String, required: true },
    unitEn: { type: String, default: "" },
    stock: { type: Number, required: true, min: 0, default: 0 },
    image: { type: String, required: true },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true },
);

productSchema.index(
  { name: "text", nameEn: "text", description: "text" },
  { default_language: "none" },
);

productSchema.pre("save", function (next) {
  if (this.stock === 0) this.isAvailable = false;
  next();
});

productSchema.pre(
  ["findOneAndUpdate", "updateOne", "updateMany"],
  function (next) {
    const update = this.getUpdate();

    if (!update || Array.isArray(update)) return next();

    const nextStock = update.$set?.stock ?? update.stock;
    if (nextStock === 0) this.set({ isAvailable: false });

    next();
  },
);

export default model<IProduct>("Product", productSchema);
