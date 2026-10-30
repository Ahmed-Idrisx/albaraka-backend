import { Schema, model, Document } from "mongoose";

/** A unit of sale in both languages, e.g. { ar: "كجم", en: "kg" }. */
export interface IUnit {
  ar: string;
  en: string;
}

export interface ISettings extends Document {
  storeName: string;
  storeNameEn: string;
  storePhone: string;
  workingHours: string;
  workingHoursEn: string;
  units: IUnit[];
}

export const DEFAULT_UNITS: IUnit[] = [
  { ar: "كجم", en: "kg" },
  { ar: "قطعة", en: "piece" },
  { ar: "نصف كيلو", en: "half kg" },
  { ar: "ربع كيلو", en: "quarter kg" },
  { ar: "صينية", en: "tray" },
];

const unitSchema = new Schema<IUnit>(
  {
    ar: { type: String, required: true, trim: true },
    en: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const settingsSchema = new Schema<ISettings>(
  {
    storeName: { type: String, default: "البركة" },
    // English twins start empty so the site never shows made-up text;
    // until the admin fills them, the English site shows the Arabic.
    storeNameEn: { type: String, default: "" },
    storePhone: { type: String, default: "+201043104194" },
    workingHours: { type: String, default: "من 9 صباحاً حتى 10 مساءً" },
    workingHoursEn: { type: String, default: "" },
    units: { type: [unitSchema], default: DEFAULT_UNITS },
  },
  { timestamps: true },
);

export default model<ISettings>("Settings", settingsSchema);
