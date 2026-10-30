# Albaraka API — مرجع مختصر

كل المسارات تبدأ بـ `/api`. كل الردود JSON.

## قواعد عامة

- **المعرّف دايمًا `id`** (مافي `_id` ولا `__v` في أي رد).
- **الأخطاء** دايمًا بالشكل `{ "message": "..." }` مع كود HTTP مناسب
  (400 بيانات غلط أو معرّف غلط، 401 محتاج تسجيل دخول، 403 مافي صلاحية، 404 مش موجود، 409 مكرر).
- **القوائم الكبيرة مقسّمة صفحات** (`products` و `orders`):
  `?page=1&limit=20` (الحد الأقصى 50)، والرد:
  ```json
  { "items": [...], "total": 42, "page": 1, "pages": 3 }
  ```
- **لوحة التحكم** محتاجة توكن: كوكي `token` (بيتعمل تلقائيًا عند الدخول) أو هيدر `Authorization: Bearer <token>`.
- **رفع الصور** (منتج/قسم): `multipart/form-data` والحقل اسمه `image` (حد أقصى 5 ميجا).
- **اللغة:** ابعت هيدر `Accept-Language: en` عشان رسائل الأخطاء والنجاح ترجع بالإنجليزي (الافتراضي عربي).
- **المحتوى بلغتين:** كل نص الأدمن بيكتبه ليه نسخة إنجليزية اختيارية جنبه:
  `name`/`nameEn` (منتج، قسم، منطقة)، `description`/`descriptionEn`، `unit`/`unitEn`،
  `storeName`/`storeNameEn`، `workingHours`/`workingHoursEn`. لو الإنجليزي فاضي اعرض العربي.
- **الوحدات** في الإعدادات بقت `units: [{ "ar": "كجم", "en": "kg" }]`. المنتج بيتخزن بالاسم العربي في `unit`،
  والـ API بيملا `unitEn` من قائمة الوحدات.

## المتجر (عام)

| الطريقة | المسار | الوصف |
| --- | --- | --- |
| GET | `/products/home` | كل قسم مع أحدث 8 منتجات فيه و`availableCount` (عدد المتاح) |
| GET | `/products?category=<slug>&search=&minPrice=&maxPrice=&available=true&sort=&page=&limit=` | قائمة منتجات (حقول الكارت فقط). `sort`: `newest` أو `price_asc` أو `price_desc`. السعر بيتفلتر على السعر بعد الخصم |
| GET | `/products/price-range` | `{ min, max }` أقل وأعلى سعر في المتجر |
| GET | `/products/slug/:slug` | منتج كامل بالـ slug |
| GET | `/categories` | الأقسام: `id, name, slug, image, order` |
| GET | `/delivery-areas?activeOnly=true` | مناطق التوصيل المفعّلة |
| GET | `/settings` | `storeName, storePhone, workingHours, units` |
| POST | `/cart/validate` | يعيد تسعير السلة من قاعدة البيانات |
| POST | `/orders` | إنشاء طلب (دفع عند الاستلام) |
| GET | `/orders/track?orderNumber=` | حالة الطلب بدون بيانات العميل |

**كارت المنتج** (في القوائم):
```json
{ "id", "name", "slug", "price", "discountPrice", "unit", "stock", "image", "isAvailable",
  "category": { "id", "name", "slug" } }
```
السعر اللي يتعرض = `discountPrice ?? price`.

**`POST /cart/validate`**
```json
// الطلب
{ "items": [{ "productId": "...", "quantity": 2 }], "deliveryAreaId": "اختياري" }
// الرد
{ "items": [{ "productId", "name", "slug", "image", "unit", "price", "quantity", "lineTotal",
              "issue": null }],
  "subtotal": 30, "deliveryFee": 20, "total": 50, "canCheckout": true }
```
`issue` كود المشكلة: `removed` أو `unavailable` أو `out_of_stock` أو `limited_stock` (ومعاه `stock` = المتاح)، أو `null`. الفرونت بيترجم الكود. كل سطر فيه كمان `nameEn` و `unitEn`.

**`POST /orders`**
```json
// الطلب
{ "customer": { "name", "phone", "address", "notes": "اختياري" },
  "items": [{ "productId", "quantity" }],
  "deliveryAreaId": "مطلوب لو في مناطق توصيل مفعّلة" }
// الرد 201
{ "orderNumber": "AB-261023-0001", "total": 50 }
```

## لوحة التحكم (محتاجة تسجيل دخول)

| الطريقة | المسار | الوصف |
| --- | --- | --- |
| POST | `/auth/login` | `{ email, password }` ← `{ user, token }` |
| POST | `/auth/logout` | |
| GET | `/auth/me` | المستخدم الحالي |
| GET | `/orders/stats` | `todayOrders, pendingOrders, deliveredOrders, totalRevenue` |
| GET | `/orders/analytics?days=14` | مبيعات يومية + أكثر المنتجات مبيعًا |
| GET | `/orders?status=&page=&limit=` | ملخص الطلبات، الأحدث أولًا |
| GET | `/orders/:id` | الطلب كامل |
| PATCH | `/orders/:id/status` | `{ status }` — الإلغاء يرجّع المخزون |
| PATCH | `/orders/:id/payment` | `{ paymentStatus: "paid" \| "unpaid" }` |
| GET | `/products/:id` | منتج كامل للتعديل |
| POST / PATCH | `/products`, `/products/:id` | multipart: `name, nameEn, category(id), price, discountPrice, unit, stock, description, descriptionEn, isAvailable, image` — `discountPrice` فاضي يشيل الخصم |
| DELETE | `/products/:id` | |
| POST / PATCH / DELETE | `/categories`, `/categories/:id` | multipart: `name, nameEn, order, image` — مايتحذفش قسم فيه منتجات |
| POST / PATCH / DELETE | `/delivery-areas`, `/delivery-areas/:id` | `{ name, nameEn, price, isActive, order }` |
| PATCH | `/settings` | أي من `storeName, storeNameEn, storePhone, workingHours, workingHoursEn, units` — حفظ الوحدات بيحدّث `unitEn` في كل المنتجات |
| GET / POST / PATCH / DELETE | `/admins`, `/admins/:id` | للمدير العام فقط |
| GET | `/push/public-key` | مفتاح إشعارات المتصفح (عام) |
| POST | `/push/subscribe`, `/push/unsubscribe`, `/push/test` | إشعارات الطلبات الجديدة |

**ملخص الطلب** (في `GET /orders`):
```json
{ "id", "orderNumber", "customer": { "name", "phone" }, "total", "status", "paymentStatus", "createdAt" }
```

**حالات الطلب:** `pending` → `confirmed` → `preparing` → `out_for_delivery` → `delivered`، أو `cancelled`.
