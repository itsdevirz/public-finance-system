# مستند معماری و الزامات امنیتی سیستم جامع نظام مالی بخش عمومی

این سند، معماری امنیتی، خط‌مشی‌ها و کنترلهای حفاظتی پیاده‌سازی شده در پروژه مطابق با سند «پروفایل حفاظتی برنامه‌های کاربردی تحت شبکه» را تشریح می‌کند.

---

## ۱. معماری امنیتی (Security Architecture)

سیستم بر پایه معماری **Defense in Depth** و **Fail-Secure** طراحی شده است. هیچ کنترل امنیتی صرفاً به لایه فرانت‌اند محول نشده و تمامی قوانین اعتبارسنجی، مجوزدهی و حریم داده در لایه بک‌اند (Hono Server / Node.js) به صورت خودکار اعمال و Enforce می‌شوند.

```
[ Client / Browser / Tauri ]
        │ (HTTPS / TLS 1.3 + Security Headers)
        ▼
┌────────────────────────────────────────────────────────┐
│ Hono Web Application Security Layer                    │
├────────────────────────────────────────────────────────┤
│ 1. Security Headers (CSP, HSTS, X-Frame, Nosniff)     │
│ 2. Rate Limiting (IP & Endpoint throttling)            │
│ 3. Input Sanitizer (NoSQL, XSS, Path Traversal)        │
│ 4. Request Body Size Limiter (Max 10MB)                │
│ 5. Correlation ID Injector & Error Handler (No Stack) │
└────────────────────────┬───────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────┐
│ Authentication & Authorization Engine                  │
├────────────────────────────────────────────────────────┤
│ 1. JWT Authentication & Bearer Verification            │
│ 2. Account Status Verifier (Active/Disabled/Locked)    │
│ 3. Active Session & Token Revocation Check             │
│ 4. Granular RBAC Engine (Roles & Permission Keys)      │
└────────────────────────┬───────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────┐
│ Cryptography & Data Persistence Layer                  │
├────────────────────────────────────────────────────────┤
│ 1. Password Hashing (bcrypt / Cost Factor 12)          │
│ 2. AES-256-GCM Payload Encryption (IV + Auth Tag)    │
│ 3. Immutability Audit Logger (MongoDB audit_logs)      │
└────────────────────────────────────────────────────────┘
```

---

## ۲. احراز هویت (Authentication Flow)

۱. **فرآیند ورود (Login)**:
   - درخواست ورود کاربر توسط Rate Limiter (حداکثر ۱۰ تلاش در دقیقه) دریافت می‌شود.
   - وضعیت کاربر چک می‌شود (`فعال` / `غیرفعال` / `مسدود`).
   - در صورت مسدود بودن حساب به دلیل تلاش‌های ناموفق مکرر (۵ بار متوالی)، زمان باقی‌مانده از قفل ۱۵ دقیقه‌ای اعلام می‌شود.
   - مقایسه رمز عبور با تابع Constant-time جهت جلوگیری از **Timing Attacks** انجام می‌شود.
   - در صورت موفقیت، `failedLoginAttempts` صفر شده، توکن JWT با الگوریتم HMAC-SHA256 تولید شده و نشست فعال در `active_sessions` ثبت می‌شود.
   - لوگ امنیتی با مشخصات IP، UserAgent و Correlation ID ثبت می‌گردد.

۲. **سیاست رمز عبور (Password Policy)**:
   - حداقل طول: ۸ کاراکتر
   - الزام به وجود حداقل یک حرف بزرگ انگلیسی (`A-Z`)
   - الزام به وجود حداقل یک حرف کوچک انگلیسی (`a-z`)
   - الزام به وجود حداقل یک عدد (`0-9`)
   - الزام به وجود حداقل یک کاراکتر خاص (`!@#$%^&*`)

---

## ۳. مدل کنترل دسترسی و ماتریس مجوزها (Authorization / RBAC Matrix)

سیستم از **Role-Based Access Control (RBAC)** و مجوزهای ریزدانه (**Granular Permissions**) پشتیبانی می‌کند.

| نقش (Role) | عنوان کاربری | دسترسی‌های پیش‌فرض |
|---|---|---|
| `admin` | مدیر سیستم | کامل بر تمامی بخش‌ها، تنظیمات امنیتی، مدیریت کاربران و لوگ‌ها |
| `حسابدار` | کارشناس حسابداری | ثبت سند (`doc.create`)، مشاهده اسناد (`doc.view`)، مدیریت قراردادها (`contract.view`) |
| `سرپرست` | تاییدکننده مالی | تایید نهایی اسناد (`doc.approve`)، ویرایش اسناد (`doc.edit`)، خروجی داده‌ها (`export.data`) |
| `بیننده` | حسابرس / ناظر | صرفاً مشاهده گزارش‌ها و اسناد بدون امکان ثبت یا تغییر |

### ماتریس کلیدهای مجوز (Permission Keys)
- `doc.view`: مشاهده اسناد حسابداری
- `doc.create`: ثبت سند مالی جدید
- `doc.edit`: ویرایش سند
- `doc.delete`: حذف سند
- `doc.approve`: تایید و نهایی‌سازی سند
- `contract.view` / `contract.create` / `contract.edit` / `contract.delete`: مدیریت قراردادها
- `credit.view` / `credit.create` / `credit.edit`: مدیریت اعتبارات
- `export.data`: خروجی گرفتن از اطلاعات حساس
- `import.data`: ورود اطلاعات از فایل‌های خارجی

---

## ۴. مدیریت نشست و ابطال (Session Management & Revocation)

- **انقضای توکن**: توکن‌های JWT پس از ۸ ساعت منقضی می‌شوند.
- **ابطال نشست (Revocation)**: در هنگام خروج کاربر (Logout) یا اقدام مدیر سیستم، توکن در کلکسیون `revoked_tokens` قرار گرفته و تمام درخواست‌های بعدی رد می‌شوند.
- **محدودیت نشست همزمان**: سرور تعداد نشست‌های فعال کاربر را از طریق کلکسیون `active_sessions` مدیریت می‌کند.

---

## ۵. ثبت رخدادهای امنیتی (Audit Logging Specification)

رویدادهای زیر به صورت متمرکز در کلکسیون `audit_logs` دیتابیس ثبت می‌شوند:
- ورود موفق و ناموفق
- خروج از سیستم
- قفل شدن حساب کاربری
- ایجاد، ویرایش و حذف کاربر
- تغییر نقش‌ها و مجوزها
- تغییر تنظیمات امنیتی و خط‌مشی‌ها
- دسترسی به لوگ‌ها و ابطال نشست‌ها
- خطاهای غیرمجاز (401 / 403)

### ساختار سند Audit Log:
```json
{
  "userId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "username": "financial_user",
  "action": "ویرایش اطلاعات کاربر",
  "resource": "users",
  "result": "SUCCESS",
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0 ...",
  "correlationId": "req-1723467890-a1b2c",
  "errorCode": null,
  "details": { "targetUserId": "...", "updatedRole": "حسابدار" },
  "timestamp": "2026-08-12T11:28:45.123Z"
}
```
*نکته: تمامی Secrets، رمزهای عبور و توکن‌ها قبل از ذخیره‌سازی لوگ سانسور (`[REDACTED]`) می‌شوند.*

---

## ۶. رمزنگاری و مدیریت کلیدها (Cryptography & Key Management)

- **گذرواژه‌ها**: استفاده از `bcrypt` با `SALT_ROUNDS = 12`.
- **اسناد مالی حساس**: استفاده از `AES-256-GCM` با کلید ۳۲ بایتی، IV تصادفی ۱۲ بایتی و Authentication Tag ۱۶ بایتی جهت تضمین محرمانگی و یکپارچگی (Integrity).
- **مدیریت کلیدها**: کلید رمزنگاری (`ENCRYPTION_KEY`) و کلید امضای توکن (`JWT_SECRET`) از طریق فایل‌های `.env` و Secret Manager سرور تزریق شده و هرگز در کد ذخیره یا Commit نمیشوند.

---

## ۷. هدرهای امنیتی HTTP و لایه شبکه (Security Headers & TLS)

سرور Hono تمامی هدرهای حفاظتی زیر را روی کلیه پاسخ‌ها تنظیم می‌کند:
- `Content-Security-Policy`: محدودکننده منابع اسکریپت و استایل
- `X-Content-Type-Options: nosniff`: جلوگیری از MIME-sniffing
- `X-Frame-Options: DENY`: جلوگیری از حمله Clickjacking
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security`: اجبار به استفاده از HTTPS در محیط Production

---

## ۸. به‌روزرسانی امن (Secure Update Architecture)

قبل از اعمال هرگونه آپدیت نرم‌افزاری یا بسته‌های دیتابیس:
۱. هش `SHA-256` فایل‌های به‌روزرسانی محاسبه شده و با هش معتبر سنجیده می‌شود (`verifyUpdateIntegrity`).
۲. امضای دیجیتال RSA/ECDSA فایل آپدیت با استفاده از کلید عمومی سیستم تایید می‌شود (`verifyUpdateSignature`).
۳. آپدیت‌های نامعتبر یا تغییر یافته بلافاصله رد می‌شوند.

---

## ۹. اعتبارسنجی گواهی‌نامه TLS (Certificate Validation)

تمامی ارتباطات شبکه لایه سرور که به سرویس‌های خارجی متصل می‌شوند، گواهی‌نامه TLS طرف مقابل را از نظر:
- اعتبار زنجیره (Chain Trust)
- تاریخ منقضی نشدن (Expiration)
- مطابقت نام دامنه (Hostname)
ارزیابی کرده و در صورت هرگونه مغایرت، ارتباط را طبق اصل **Fail-Secure** قطع می‌کنند.

---

## ۱۰. دستورالعمل سخت‌سازی محیط تولید (Production Hardening Checklist)

- [x] تنظیم متغیرهای محیطی `JWT_SECRET` و `ENCRYPTION_KEY` به کلیدهای تصادفی با انتروپی بالا.
- [x] فعال‌سازی TLS/HTTPS و گواهی‌نامه معتبر SSL روی پورت مربوطه.
- [x] فعال‌سازی `NODE_ENV=production`.
- [x] جداسازی دسترسی دیتابیس MongoDB و اعمال کاربر اختصاصی برنامه با Least Privilege.
- [x] بررسی روزانه audit logها و مانیتورینگ نرخ درخواست‌ها.
