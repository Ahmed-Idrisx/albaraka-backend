import Settings, { DEFAULT_UNITS, ISettings, IUnit } from "../models/Settings.js";
import Product from "../models/Product.js";

/** English names for the units the shop started with, used for older data. */
const KNOWN_UNITS = new Map(DEFAULT_UNITS.map((u) => [u.ar, u.en]));

/**
 * Older data stored units as plain Arabic strings. They are turned into
 * { ar, en } pairs in memory only — nothing is written back until an admin
 * saves the settings, so an older deployment reading the same database keeps
 * working.
 */
const normalizeUnits = (units: unknown[] = []): IUnit[] =>
  units.map((u) =>
    typeof u === "string"
      ? { ar: u, en: KNOWN_UNITS.get(u) ?? "" }
      : { ar: (u as IUnit).ar, en: (u as IUnit).en ?? "" },
  );

class SettingsService {
  /** Always returns the single settings document, creating it with defaults on first call. */
  async get(): Promise<ISettings> {
    const raw = await Settings.collection.findOne({});
    if (!raw) return Settings.create({});
    return Settings.hydrate({ ...raw, units: normalizeUnits(raw.units) });
  }

  async update(data: Partial<Omit<ISettings, "units">> & { units?: IUnit[] }) {
    const settings = await this.get();
    Object.assign(settings, data);
    await settings.save();
    if (data.units) await this.syncProductUnits(settings.units);
    return settings;
  }

  /** Arabic unit → English unit, from the shop's unit list. */
  async unitMap() {
    const settings = await this.get();
    return new Map(settings.units.map((u) => [u.ar, u.en]));
  }

  async unitEn(unit: string) {
    return (await this.unitMap()).get(unit) ?? "";
  }

  /**
   * Products saved before units had English names have an empty `unitEn`.
   * Fill it from the unit list for this response only (nothing is saved).
   */
  async fillUnitEn<T extends { unit: string; unitEn?: string }>(products: T[]) {
    if (products.every((p) => p.unitEn)) return products;
    const map = await this.unitMap();
    for (const product of products) {
      if (!product.unitEn) product.unitEn = map.get(product.unit) ?? "";
    }
    return products;
  }

  /** Keeps every product's stored English unit in step with the unit list. */
  private async syncProductUnits(units: IUnit[]) {
    await Promise.all(
      units.map((u) => Product.updateMany({ unit: u.ar }, { unitEn: u.en })),
    );
  }
}

export const settingsService = new SettingsService();
