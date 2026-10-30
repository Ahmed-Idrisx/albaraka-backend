import { Schema, model, Document } from "mongoose";

export interface ICategory extends Document {
  name: string;
  /** English name; the storefront falls back to `name` when it's empty. */
  nameEn: string;
  slug: string;
  image: string;
  order: number;
  createdAt: Date;
}

const categorySchema = new Schema<ICategory>(
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
    image: { type: String, required: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export default model<ICategory>("Category", categorySchema);
