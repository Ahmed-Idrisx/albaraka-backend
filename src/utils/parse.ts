// Helpers for request values. Multipart forms send everything as strings, and an
// empty input arrives as "" — which must mean "not set", not 0 or false.

const isBlank = (value: unknown) =>
  value === undefined || value === null || value === "";

export const toNumber = (value: unknown): number | undefined => {
  if (isBlank(value)) return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
};

export const toBoolean = (value: unknown): boolean | undefined => {
  if (isBlank(value)) return undefined;
  return value === true || value === "true";
};

/** Reads ?page=&limit= with sane bounds. */
export const toPagination = (query: Record<string, unknown>, maxLimit = 50) => {
  const page = Math.max(1, Math.floor(toNumber(query.page) ?? 1));
  const limit = Math.min(maxLimit, Math.max(1, Math.floor(toNumber(query.limit) ?? 20)));
  return { page, limit, skip: (page - 1) * limit };
};

/** The one list shape every paginated endpoint returns. */
export const paginated = <T>(
  items: T[],
  total: number,
  { page, limit }: { page: number; limit: number },
) => ({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
