import { Schema, model, Document } from "mongoose";

export interface ISettings extends Document {
  storeName: string;
  storePhone: string;
  workingHours: string;
  units: string[];
}

const settingsSchema = new Schema<ISettings>(
  {
    storeName: { type: String, default: "البركة" },
    storePhone: { type: String, default: "+201043104194" },
    workingHours: { type: String, default: "من 9 صباحاً حتى 10 مساءً" },
    units: {
      type: [String],
      default: ["كجم", "قطعة", "نصف كيلو", "ربع كيلو", "صينية"],
    },
  },
  { timestamps: true },
);

export default model<ISettings>("Settings", settingsSchema);
