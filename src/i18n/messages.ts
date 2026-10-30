import { Request } from "express";

export type Locale = "ar" | "en";

/**
 * Every message the API sends to people, in both languages. Services throw
 * with a key (e.g. ApiError.notFound("productNotFound")) and the error handler
 * picks the language from the request's Accept-Language header.
 * `{name}`-style placeholders are filled from the error's params.
 */
export const messages = {
  // General
  unauthorized: { ar: "غير مصرح", en: "Not authorized" },
  loginRequired: { ar: "يجب تسجيل الدخول", en: "Please log in" },
  sessionInvalid: {
    ar: "جلسة غير صالحة، سجل الدخول مرة أخرى",
    en: "Your session has expired, please log in again",
  },
  forbidden: {
    ar: "ليس لديك صلاحية لهذا الإجراء",
    en: "You don't have permission to do this",
  },
  notFound: { ar: "العنصر غير موجود", en: "Not found" },
  routeNotFound: { ar: "المسار غير موجود: {path}", en: "Route not found: {path}" },
  invalidId: { ar: "المعرّف غير صحيح", en: "Invalid id" },
  invalidData: { ar: "بيانات غير صحيحة", en: "Invalid data" },
  duplicate: { ar: "هذا العنصر موجود بالفعل", en: "This item already exists" },
  serverError: { ar: "حدث خطأ في الخادم", en: "Something went wrong on our side" },
  imageTooLarge: {
    ar: "حجم الصورة يجب ألا يتجاوز 5 ميجا",
    en: "The image must be 5 MB or smaller",
  },
  uploadFailed: { ar: "خطأ في رفع الملف", en: "File upload failed" },
  imageOnly: {
    ar: "الملف المرفوع يجب أن يكون صورة",
    en: "The uploaded file must be an image",
  },

  // Auth & admins
  credentialsRequired: {
    ar: "البريد الإلكتروني وكلمة المرور مطلوبان",
    en: "Email and password are required",
  },
  wrongCredentials: {
    ar: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
    en: "Wrong email or password",
  },
  loggedOut: { ar: "تم تسجيل الخروج", en: "Logged out" },
  userNotFound: { ar: "المستخدم غير موجود", en: "User not found" },
  allFieldsRequired: { ar: "كل الحقول مطلوبة", en: "All fields are required" },
  passwordTooShort: {
    ar: "كلمة المرور يجب أن تكون 8 أحرف على الأقل",
    en: "Password must be at least 8 characters",
  },
  emailTaken: {
    ar: "هذا البريد الإلكتروني مستخدم بالفعل",
    en: "This email is already in use",
  },
  superadminLocked: {
    ar: "لا يمكن تعديل أو حذف حساب المدير العام",
    en: "The owner account can't be edited or deleted",
  },
  adminDeleted: { ar: "تم حذف الحساب", en: "Account deleted" },

  // Categories
  categoryNameRequired: { ar: "اسم التصنيف مطلوب", en: "Category name is required" },
  categoryImageRequired: {
    ar: "صورة التصنيف مطلوبة",
    en: "Category image is required",
  },
  categoryNotFound: { ar: "التصنيف غير موجود", en: "Category not found" },
  categoryHasProducts: {
    ar: "لا يمكن حذف التصنيف لأنه يحتوي على {count} منتج",
    en: "This category can't be deleted because it has {count} products",
  },
  categoryDeleted: { ar: "تم حذف التصنيف", en: "Category deleted" },

  // Products
  productFieldsRequired: {
    ar: "الاسم والتصنيف والسعر والوحدة حقول مطلوبة",
    en: "Name, category, price and unit are required",
  },
  productImageRequired: {
    ar: "صورة المنتج مطلوبة",
    en: "Product image is required",
  },
  productNotFound: { ar: "المنتج غير موجود", en: "Product not found" },
  invalidCategory: {
    ar: "التصنيف المحدد غير موجود",
    en: "The selected category doesn't exist",
  },
  invalidDiscount: {
    ar: "سعر الخصم يجب أن يكون أكبر من صفر وأقل من السعر الأساسي",
    en: "The discount price must be above zero and below the regular price",
  },
  productDeleted: { ar: "تم حذف المنتج", en: "Product deleted" },

  // Delivery areas
  areaFieldsRequired: {
    ar: "اسم المنطقة وسعر التوصيل مطلوبان",
    en: "Area name and delivery price are required",
  },
  areaNotFound: { ar: "منطقة التوصيل غير موجودة", en: "Delivery area not found" },
  areaRequired: { ar: "اختر منطقة التوصيل", en: "Please choose a delivery area" },
  areaUnavailable: {
    ar: "منطقة التوصيل غير متاحة",
    en: "This delivery area is not available",
  },
  areaDeleted: { ar: "تم حذف المنطقة", en: "Area deleted" },

  // Cart & orders
  invalidCart: { ar: "السلة غير صحيحة", en: "Invalid cart" },
  emptyCart: { ar: "السلة فارغة", en: "Your cart is empty" },
  customerFieldsRequired: {
    ar: "الاسم ورقم الهاتف والعنوان مطلوبة",
    en: "Name, phone number and address are required",
  },
  productGone: {
    ar: "أحد المنتجات لم يعد متاحًا",
    en: "One of the products is no longer available",
  },
  productUnavailable: {
    ar: "المنتج \"{name}\" غير متاح حاليًا",
    en: "\"{name}\" is not available right now",
  },
  notEnoughStock: {
    ar: "الكمية المطلوبة من \"{name}\" غير متوفرة",
    en: "Not enough \"{name}\" in stock",
  },
  invalidQuantity: {
    ar: "الكمية يجب أن تكون 1 على الأقل",
    en: "Quantity must be at least 1",
  },
  orderNumberRequired: { ar: "رقم الطلب مطلوب", en: "Order number is required" },
  orderNotFound: { ar: "الطلب غير موجود", en: "Order not found" },
  orderNumberNotFound: {
    ar: "لم يتم العثور على طلب بهذا الرقم",
    en: "No order found with this number",
  },
  invalidStatus: { ar: "حالة الطلب غير صحيحة", en: "Invalid order status" },
  invalidPaymentStatus: { ar: "حالة الدفع غير صحيحة", en: "Invalid payment status" },

  // Push notifications
  subscriptionIncomplete: {
    ar: "بيانات الاشتراك غير مكتملة",
    en: "Incomplete subscription data",
  },
  endpointRequired: { ar: "endpoint مطلوب", en: "endpoint is required" },
  pushEnabled: { ar: "تم تفعيل إشعارات الطلبات", en: "Order notifications enabled" },
  pushDisabled: { ar: "تم إيقاف إشعارات الطلبات", en: "Order notifications disabled" },
  pushTestSent: { ar: "تم إرسال إشعار تجريبي", en: "Test notification sent" },
} satisfies Record<string, Record<Locale, string>>;

export type MessageKey = keyof typeof messages;

/** A param can be plain text or text per language (e.g. a product's two names). */
export type MessageParams = Record<
  string,
  string | number | Partial<Record<Locale, string>>
>;

/** Arabic unless the client asked for English. */
export const localeOf = (req: Request): Locale =>
  req.headers["accept-language"]?.toLowerCase().startsWith("en") ? "en" : "ar";

export const translate = (
  key: MessageKey,
  locale: Locale,
  params: MessageParams = {},
): string =>
  messages[key][locale].replace(/\{(\w+)\}/g, (_, name: string) => {
    const value = params[name];
    if (value == null) return "";
    if (typeof value === "object") return value[locale] || value.ar || "";
    return String(value);
  });

/** Shorthand for success messages in controllers. */
export const t = (req: Request, key: MessageKey, params?: MessageParams) =>
  translate(key, localeOf(req), params);
