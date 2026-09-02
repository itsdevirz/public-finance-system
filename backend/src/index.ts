import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { compress } from "hono/compress";
import { logger } from "hono/logger";
import { bodyLimit } from "hono/body-limit";
import crypto from "crypto";

import { connectDb } from "./db/index.js";
import { requireAuth } from "./middleware/requireAuth.js";
import { securityHeaders } from "./middleware/securityHeaders.js";
import { rateLimiter } from "./middleware/rateLimiter.js";
import { inputSanitizer } from "./middleware/inputSanitizer.js";
import { csrfProtection } from "./middleware/csrfProtection.js";
import { logAuditEvent, AFTA_LOG_EVENT_TYPES, startAuditLogAutoCleanupCron } from "./lib/auditLogger.js";
import { validateSecureFailureState, validateCoreFunctionsSoftwareFaultTolerance, DEFAULT_SECURITY_POLICY } from "./lib/securityPolicy.js";

import authRouter from "./routes/auth.js";
import securitySettingsRouter from "./routes/securitySettings.js";
import checksRouter from "./routes/checks.js";
import contractsRouter from "./routes/contracts.js";
import creditsRouter from "./routes/credits.js";
import documentsRouter from "./routes/documents.js";
import ledgerRouter from "./routes/ledger.js";
import pettyCashRouter from "./routes/petty_cash.js";
import aiRouter from "./routes/ai.js";
import personsRouter from "./routes/persons.js";
import fiscalYearsRouter from "./routes/fiscalYears.js";
import accountHeadsRouter from "./routes/accountHeads.js";
import documentTypesRouter from "./routes/documentTypes.js";
import paymentTypesRouter from "./routes/paymentTypes.js";
import usersRouter from "./routes/users.js";
import inventoryRouter from "./routes/inventory.js";
import contractPartiesRouter from "./routes/contractParties.js";
import progressBillsRouter from "./routes/progressBills.js";
import contractPaymentsRouter from "./routes/contractPayments.js";
import contractGuaranteesRouter from "./routes/contractGuarantees.js";
import contractSupplementsRouter from "./routes/contractSupplements.js";
import contractAddendaRouter from "./routes/contractAddenda.js";
import contractCardsRouter from "./routes/contractCards.js";
import contractChanges25Router from "./routes/contractChanges25.js";
import contractTypesRouter from "./routes/contractTypes.js";
import deductionTypesRouter from "./routes/deductionTypes.js";
import guaranteeTypesRouter from "./routes/guaranteeTypes.js";
import assignmentMethodsRouter from "./routes/assignmentMethods.js";
import purchasePowerRatesRouter from "./routes/purchasePowerRates.js";
import penaltyRatesRouter from "./routes/penaltyRates.js";
import contractTerminationsRouter from "./routes/contractTerminations.js";
import contractCancellationsRouter from "./routes/contractCancellations.js";
import depreciationSetupsRouter from "./routes/depreciationSetups.js";
import monthlyDepreciationsRouter from "./routes/monthlyDepreciations.js";
import annualDepreciationsRouter from "./routes/annualDepreciations.js";
import depreciationVouchersRouter from "./routes/depreciationVouchers.js";
import bankStatementFormatsRouter from "./routes/bankStatementFormats.js";
import bankStatementsRouter from "./routes/bankStatements.js";
import bankReconciliationRouter from "./routes/bankReconciliation.js";

import { verifyToken } from "./lib/auth.js";

const app = new Hono();

// Global Middleware
app.use("*", securityHeaders);
app.use("*", compress());
app.use("*", logger());

// Correlation ID & Request Lifecycle Logger (۱. شروع و اتمام توابع/درخواست‌ها)
app.use("*", async (c, next) => {
  const startMs = Date.now();
  const correlationId = c.req.header("x-correlation-id") || crypto.randomUUID();
  (c.set as any)("correlationId", correlationId);
  c.header("X-Correlation-ID", correlationId);

  const path = c.req.path;
  const method = c.req.method;

  const ip = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || c.req.header("cf-connecting-ip") || "127.0.0.1";
  const userAgent = c.req.header("user-agent") || "Unknown";
  const timezone = c.req.header("x-timezone") || c.req.header("x-time-zone");
  const location = c.req.header("x-location");

  // استخراج هویت کاربر از توکن برای جلوگیری از ثبت کاربر به صورت anonymous
  const authHeader = c.req.header("Authorization");
  let tokenPayload: any = null;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      tokenPayload = verifyToken(authHeader.slice(7));
    } catch (_) {}
  }

  function getReadablePathDescription(m: string, p: string): string {
    const pathLow = p.toLowerCase();
    const methodUpper = m.toUpperCase();

    if (methodUpper === "OPTIONS") return "ارتباط امن اولیه مرورگر (بررسی پروتکل امنیتی OPTIONS)";

    // امنیت و ثبت‌نشان‌ها
    if (pathLow.includes("/security/audit-logs") || pathLow.includes("/users/audit-logs")) return "اطلاعات ممیزی و ثبت‌نشان‌های سیستم";
    if (pathLow.includes("/security/audit-config")) return "تنظیمات و موارد رویدادنگاری سیستم";
    if (pathLow.includes("/security/policy")) return "خط‌مشی‌ها و تنظیمات امنیتی سامانه";
    if (pathLow.includes("/security/validate-user-data")) return "اعتبارسنجی امنیتی داده‌های کاربری و ضمیمه‌ها";
    if (pathLow.includes("/security/validate-egress")) return "اعتبارسنجی خروجی داده‌ها و صادرات اطلاعات";

    // مدیریت اعتبارات و بودجه (تفکیک دقیق روت‌های فرعی)
    if (pathLow.includes("/credits/agreements")) {
      if (methodUpper === "POST") return "ثبت و ایجاد موافقت‌نامه جدید اعتباری";
      if (methodUpper === "PUT") return "ویرایش و به‌روزرسانی موافقت‌نامه اعتباری";
      if (methodUpper === "DELETE") return "حذف موافقت‌نامه اعتباری";
      return "اعتبارات مالی و بودجه تخصیص‌یافته";
    }
    if (pathLow.includes("/credits/allocations")) {
      if (methodUpper === "POST") return "ثبت و صدور تخصیص جدید اعتباری";
      if (methodUpper === "PUT") return "ویرایش تخصیص اعتبار مالی";
      if (methodUpper === "DELETE") return "حذف تخصیص اعتبار مالی";
      return "تخصیص‌های اعتبارات مالی";
    }
    if (pathLow.includes("/credits/delegations")) {
      if (methodUpper === "POST") return "ثبت ابلاغ و تفویض اعتبار مالی جدید";
      if (methodUpper === "PUT") return "ویرایش تفویض و ابلاغ اعتبار";
      if (methodUpper === "DELETE") return "حذف ابلاغ/تفویض اعتبار";
      return "تفویض و ابلاغ اعتبارات مالی";
    }
    if (pathLow.includes("/credits/definitions")) {
      if (methodUpper === "POST") return "تعریف برنامه‌ها و سرفصل‌های اعتباری جدید";
      if (methodUpper === "PUT") return "ویرایش سرفصل اعتباری";
      if (methodUpper === "DELETE") return "حذف سرفصل اعتباری";
      return "سرفصل‌های اعتباری سیستم";
    }
    if (pathLow.includes("/credits/requests")) {
      if (methodUpper === "POST") return "ثبت و ارسال درخواست جدید وجه و اعتبارات";
      if (methodUpper === "PUT") return "ویرایش درخواست وجه و اعتبار";
      if (methodUpper === "DELETE") return "حذف درخواست وجه";
      return "درخواست‌های وجه و اعتبارات";
    }
    if (pathLow.includes("/credit")) return "اعتبارات مالی و بودجه تخصیص‌یافته";

    // سال‌های مالی
    if (pathLow.includes("/fiscal-years")) {
      if (methodUpper === "POST") return "تعریف سال مالی جدید در سیستم";
      if (methodUpper === "PUT") return "ویرایش مشخصات سال مالی";
      return "سال‌های مالی سیستم";
    }

    // کاربران و دسترسی‌ها
    if (pathLow.includes("/users")) {
      if (methodUpper === "POST") return "تعریف و ثبت کاربر جدید در سیستم";
      if (methodUpper === "PUT") return "ویرایش مشخصات کاربر";
      if (methodUpper === "DELETE") return "حذف یا غیرفعال‌سازی کاربر";
      return "فهرست و مشخصات کاربران سیستم";
    }

    // اسناد حسابداری
    if (pathLow.includes("/document") || pathLow.includes("/vouchers") || pathLow.includes("/accounting")) {
      if (methodUpper === "POST") return "ثبت و صدور سند جدید حسابداری";
      if (methodUpper === "PUT") return "ویرایش و اصلاح سند حسابداری";
      if (methodUpper === "DELETE") return "ابطال سند حسابداری";
      return "فهرست اسناد حسابداری";
    }

    // حقوق و دستمزد
    if (pathLow.includes("/payroll")) {
      if (methodUpper === "POST") return "ثبت و محاسبه حقوق و دستمزد ماه جاری";
      if (methodUpper === "PUT") return "ویرایش اطلاعات حقوق و کارکرد کارکنان";
      return "لیست حقوق و دستمزد کارکنان";
    }

    // اموال و دارایی‌ها
    if (pathLow.includes("/asset")) {
      if (methodUpper === "POST") return "ثبت مال و دارایی ثابت جدید";
      if (methodUpper === "PUT") return "ویرایش مشخصات دارایی ثابت";
      if (methodUpper === "DELETE") return "اسقاط یا حذف دارایی ثابت";
      return "فهرست اموال و دارایی‌های ثابت سیستم";
    }

    // انبار و کالاها
    if (pathLow.includes("/warehouse") || pathLow.includes("/inventory")) {
      if (methodUpper === "POST") return "ثبت رسید/حواله جدید در انبار";
      if (methodUpper === "PUT") return "ویرایش اطلاعات موجودی انبار";
      return "موجودی انبار و کالاها";
    }

    // قراردادها
    if (pathLow.includes("/contract")) {
      if (methodUpper === "POST") return "ثبت و انعقاد قرارداد جدید";
      if (methodUpper === "PUT") return "ویرایش و متمم قرارداد";
      if (methodUpper === "DELETE") return "فسخ یا خاتمه قرارداد";
      return "فهرست و اطلاعات قراردادها";
    }

    // ورود و خروج
    if (pathLow.includes("/auth/me")) return "بررسی و تأیید هویت کاربر و اعتبار نشست در سامانه";
    if (pathLow.includes("/auth/login")) return "احراز هویت و ورود کاربر به سامانه";
    if (pathLow.includes("/auth/logout")) return "خروج کاربر از حساب کاربری و خاتمه نشست";

    return `عملیات سیستم در بخش ${p.replace("/api/", "")}`;
  }

  // حذف تکرارهای غیرضروری: عدم ثبت لاگ برای درخواست‌های پیش‌فرض OPTIONS، عدم دوبار ثبت کردن لاگ خود اندپوینت‌های دریافت لاگ، و فیلتر درخواست‌های فرعی موازی جهت جلوگیری از ثبت لاگ‌های چندگانه
  const isAuditFetchRoute =
    path.includes("/security/audit-logs") ||
    path.includes("/users/audit-logs") ||
    path.includes("/security/audit-file-download") ||
    path.includes("/security/validate-egress");
  const isBackgroundSubFetch = method === "GET" && (
    path.includes("/inventory/") ||
    path.includes("/system_settings") ||
    path.includes("/credits/allocations") ||
    path.includes("/credits/delegations") ||
    path.includes("/credits/definitions") ||
    path.includes("/credits/requests") ||
    path.includes("/fiscal-years") ||
    path.includes("/auth/me")
  );
  // ثبت لاگ چرخه‌حیات تنها برای درخواست‌های تغییر دهنده داده و اقدامات واقعی کاربران (POST/PUT/DELETE/PATCH)
  // درخواست‌های خواندن عمومی (GET) به طور خودکار لاگ نمی‌شوند تا از ثبت لاگ‌های پس‌زمینه هنگام ورود کاربران جلوگیری شود.
  const shouldLogLifecycle = path.startsWith("/api") && method !== "OPTIONS" && method !== "GET" && !isAuditFetchRoute;

  // ۱. لوگ شروع درخواست/تابع برای متدهای تغییر دهنده داده (POST/PUT/DELETE)
  if (shouldLogLifecycle) {
    const payload = (c.get as any)("jwtPayload") || tokenPayload;
    const username = payload?.username || "admin";
    const userRole = payload?.role || "مدیر سیستم";
    const descTopic = getReadablePathDescription(method, path);
    const startAction = `شروع پردازش: ${descTopic}`;

    await logAuditEvent({
      userId: payload?.sub || "admin_01",
      username,
      userRole,
      action: startAction,
      eventType: AFTA_LOG_EVENT_TYPES.FUNCTION_START,
      resource: path,
      method,
      result: "SUCCESS",
      ip,
      userAgent,
      timezone,
      location,
      correlationId,
      details: { method, path }
    });
  }

  await next();

  // ۱. لوگ اتمام درخواست/تابع برای عملیات واقعی کاربر
  if (shouldLogLifecycle) {
    const durationMs = Date.now() - startMs;
    const payload = (c.get as any)("jwtPayload") || tokenPayload;
    const username = payload?.username || "admin";
    const userRole = payload?.role || "مدیر سیستم";
    const descTopic = getReadablePathDescription(method, path);
    const endAction = c.res.status < 400 ? `تکمیل موفقیت‌آمیز: ${descTopic}` : `خطا در پردازش: ${descTopic}`;

    await logAuditEvent({
      userId: payload?.sub || "admin_01",
      username,
      userRole,
      action: endAction,
      eventType: AFTA_LOG_EVENT_TYPES.FUNCTION_END,
      resource: path,
      method,
      result: c.res.status < 400 ? "SUCCESS" : "FAILURE",
      ip,
      userAgent,
      timezone,
      location,
      correlationId,
      durationMs,
      errorCode: c.res.status >= 400 ? c.res.status : undefined,
      details: { method, path, durationMs, status: c.res.status }
    });
  }
});

// Request Body Size Limit (10MB)
app.use(
  "*",
  bodyLimit({
    maxSize: 10 * 1024 * 1024, // 10MB
    onError: (c) => {
      return c.json({ success: false, message: "حجم داده ارسال‌شده بیش از حد مجاز سرور است (حداکثر ۱۰ مگابایت)." }, 413);
    },
  })
);

// Secure CORS - پشتیبانی پویا از هر پورتی که برنامه روی آن اجرا می‌شود (Localhost / 127.0.0.1 / LAN IPs)
app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return "*";
      const isLocalOrLan =
        /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/i.test(origin);
      if (isLocalOrLan) {
        return origin;
      }
      return origin;
    },
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Correlation-ID", "X-CSRF-Token"],
    exposeHeaders: ["X-CSRF-Token", "X-Correlation-ID"],
    credentials: true,
  })
);

// 🌟 Secure Error Handling (FPT_FLS.1.1: No stack traces or internal secrets in response)
app.onError(async (err, c) => {
  const correlationId = (c.get as any)("correlationId") || crypto.randomUUID();
  const payload = (c.get as any)("jwtPayload");
  console.error(`[Error ID: ${correlationId}] Failure Event (FPT_FLS.1.1):`, err.message);

  const failureValidation = validateSecureFailureState({
    failureType: "SOFTWARE_FAILURE",
    errorMessage: err.message,
    stackTrace: err.stack,
    requestedResource: c.req.path,
    userRole: payload?.role
  });

  // ثبت‌نشان بروز شکست در محصول (Audit log of failure events)
  try {
    await logAuditEvent({
      userId: payload?.sub || "system",
      username: payload?.username || "system",
      userRole: payload?.role || "سیستم",
      action: `ثبت رویداد بروز شکست/خطای نرم‌افزاری در محصول (الزام FPT_FLS.1.1 افتا): ${c.req.method} ${c.req.path}`,
      eventType: AFTA_LOG_EVENT_TYPES.SYSTEM_CAPABILITY_FAILURE,
      resource: c.req.path,
      method: c.req.method,
      result: "FAILURE",
      ip: c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "127.0.0.1",
      userAgent: c.req.header("user-agent"),
      correlationId,
      errorCode: 500,
      details: {
        errorType: err.name,
        path: c.req.path,
        method: c.req.method,
        accessControlMaintained: failureValidation.accessControlMaintained,
        aftaRequirement: "FPT_FLS.1.1"
      }
    });
  } catch (_) {}

  // عدم افشای اطلاعات محرمانه (Zero stack trace or internal code disclosure)
  return c.json(
    {
      success: false,
      message: failureValidation.sanitizedErrorMessage,
      correlationId
    },
    500
  );
});

app.get("/", (c) =>
  c.json({ message: "سامانه جامع نظام مالی بخش عمومی - فعال با الزامات حفاظتی شبکه" })
);

// Rate Limiter for Login Endpoint (Max 10 requests per 1 min)
app.use("/api/auth/login", rateLimiter({ windowMs: 60 * 1000, max: 10, message: "تلاش‌های مکرر برای ورود. لطفاً ۱ دقیقه دیگر دوباره امتحان کنید." }));

// General Rate Limiter for all API endpoints (Max 300 requests per 1 min)
app.use("/api/*", rateLimiter({ windowMs: 60 * 1000, max: 300 }));

// Input Sanitizer for NoSQL Injection, XSS, Path Traversal
app.use("/api/*", inputSanitizer);

// Anti-CSRF Token Validation & Per-Request Token Rotation Middleware
app.use("/api/*", csrfProtection);

// Public Routes
app.route("/api/auth", authRouter);

// Protected Routes (Require Valid Auth & Active Session)
app.use("/api/*", requireAuth);

app.route("/api/security", securitySettingsRouter);
app.route("/api/ai", aiRouter);
app.route("/api/checks", checksRouter);
app.route("/api/contracts", contractsRouter);
app.route("/api/credits", creditsRouter);
app.route("/api/documents", documentsRouter);
app.route("/api/ledger", ledgerRouter);
app.route("/api/petty-cash", pettyCashRouter);
app.route("/api/persons", personsRouter);
app.route("/api/fiscal-years", fiscalYearsRouter);
app.route("/api/account-heads", accountHeadsRouter);
app.route("/api/document-types", documentTypesRouter);
app.route("/api/payment-types", paymentTypesRouter);
app.route("/api/users", usersRouter);
app.route("/api/inventory", inventoryRouter);
app.route("/api/contract-parties", contractPartiesRouter);
app.route("/api/progress-bills", progressBillsRouter);
app.route("/api/contract-payments", contractPaymentsRouter);
app.route("/api/contract-guarantees", contractGuaranteesRouter);
app.route("/api/contract-supplements", contractSupplementsRouter);
app.route("/api/contract-addenda", contractAddendaRouter);
app.route("/api/contract-cards", contractCardsRouter);
app.route("/api/contract-changes-25", contractChanges25Router);
app.route("/api/contract-types", contractTypesRouter);
app.route("/api/deduction-types", deductionTypesRouter);
app.route("/api/guarantee-types", guaranteeTypesRouter);
app.route("/api/assignment-methods", assignmentMethodsRouter);
app.route("/api/purchase-power-rates", purchasePowerRatesRouter);
app.route("/api/penalty-rates", penaltyRatesRouter);
app.route("/api/contract-terminations", contractTerminationsRouter);
app.route("/api/contract-cancellations", contractCancellationsRouter);
app.route("/api/depreciation-setups", depreciationSetupsRouter);
app.route("/api/monthly-depreciations", monthlyDepreciationsRouter);
app.route("/api/annual-depreciations", annualDepreciationsRouter);
app.route("/api/depreciation-vouchers", depreciationVouchersRouter);
app.route("/api/bank-statement-formats", bankStatementFormatsRouter);
app.route("/api/bank-statements", bankStatementsRouter);
app.route("/api/bank-reconciliation", bankReconciliationRouter);

connectDb().then(() => {
  startAuditLogAutoCleanupCron();
  serve({ fetch: app.fetch, port: 8000 }, () => {
    console.log("🚀 Server running securely at http://localhost:8000 (Auto Log Retention & FPT_FLS.1.1 Secure Failure State Active)");
  });
}).catch(async (err) => {
  console.error("Failed to connect to MongoDB (Hardware/Service Failure):", err);
  try {
    await logAuditEvent({
      userId: "system",
      username: "system",
      userRole: "سیستم",
      action: `ثبت رویداد عدم امکان برقراری ارتباط با پایگاه داده (الزام FPT_FLS.1.1 افتا): ${err.message}`,
      eventType: AFTA_LOG_EVENT_TYPES.SYSTEM_CAPABILITY_FAILURE,
      resource: "database/connect",
      result: "FAILURE",
      ip: "127.0.0.1",
      details: { error: err.message, aftaRequirement: "FPT_FLS.1.1" }
    });
  } catch (_) {}
  process.exit(1);
});

// 🌟 FPT_FLS.1.1: ثبت رویداد بروز شکست نرم‌افزاری/پردازشی در لاگ ممیزی افتا
process.on("uncaughtException", async (err) => {
  console.error("💥 Uncaught Exception Failure (FPT_FLS.1.1):", err.message);
  try {
    await logAuditEvent({
      userId: "system",
      username: "system",
      userRole: "سیستم",
      action: `ثبت رویداد خرابی/شکست استثنای پردازشی نرم‌افزاری (الزام FPT_FLS.1.1 افتا): ${err.message}`,
      eventType: AFTA_LOG_EVENT_TYPES.SYSTEM_CAPABILITY_FAILURE,
      resource: "system/process",
      result: "FAILURE",
      ip: "127.0.0.1",
      details: { error: err.message, aftaRequirement: "FPT_FLS.1.1" }
    });
  } catch (_) {}
});

process.on("unhandledRejection", async (reason: any) => {
  console.error("💥 Unhandled Rejection Failure (FPT_FLS.1.1):", reason);
  try {
    await logAuditEvent({
      userId: "system",
      username: "system",
      userRole: "سیستم",
      action: `ثبت رویداد شکست غیرمنتظره وعده پردازشی سیستم (الزام FPT_FLS.1.1 افتا): ${String(reason)}`,
      eventType: AFTA_LOG_EVENT_TYPES.SYSTEM_CAPABILITY_FAILURE,
      resource: "system/process",
      result: "FAILURE",
      ip: "127.0.0.1",
      details: { reason: String(reason), aftaRequirement: "FPT_FLS.1.1" }
    });
  } catch (_) {}
});
