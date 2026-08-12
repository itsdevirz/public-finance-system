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
import { logAuditEvent, AFTA_LOG_EVENT_TYPES } from "./lib/auditLogger.js";

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

const app = new Hono();

// Global Middleware
app.use("*", securityHeaders);
app.use("*", compress());
app.use("*", logger());

// Correlation ID & Request Lifecycle Logger (۱. شروع و اتمام توابع/درخواست‌ها)
app.use("*", async (c, next) => {
  const startMs = Date.now();
  const correlationId = c.req.header("x-correlation-id") || crypto.randomUUID();
  c.set("correlationId", correlationId);
  c.header("X-Correlation-ID", correlationId);

  const path = c.req.path;
  const method = c.req.method;

  // ۱. لوگ شروع درخواست/تابع برای روت‌های غیر استاتیک API
  if (path.startsWith("/api")) {
    await logAuditEvent({
      action: `${AFTA_LOG_EVENT_TYPES.FUNCTION_START}: ${method} ${path}`,
      eventType: AFTA_LOG_EVENT_TYPES.FUNCTION_START,
      resource: path,
      result: "SUCCESS",
      ip: c.req.header("x-forwarded-for") || "127.0.0.1",
      correlationId,
      details: { method, path }
    });
  }

  await next();

  // ۱. لوگ اتمام درخواست/تابع
  if (path.startsWith("/api")) {
    const durationMs = Date.now() - startMs;
    const payload = (c.get as any)("jwtPayload");

    await logAuditEvent({
      userId: payload?.sub,
      username: payload?.username,
      action: `${AFTA_LOG_EVENT_TYPES.FUNCTION_END}: ${method} ${path}`,
      eventType: AFTA_LOG_EVENT_TYPES.FUNCTION_END,
      resource: path,
      result: c.res.status < 400 ? "SUCCESS" : "FAILURE",
      ip: c.req.header("x-forwarded-for") || "127.0.0.1",
      correlationId,
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

// Secure CORS
app.use(
  "*",
  cors({
    origin: (origin) => {
      const allowed = [
        "http://localhost",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://localhost:2111",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:2111",
      ];
      return allowed.includes(origin) ? origin : allowed[0];
    },
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Correlation-ID"],
    credentials: true,
  })
);

// Secure Error Handling (No stack traces in response)
app.onError((err, c) => {
  const correlationId = c.get("correlationId") || "UNKNOWN";
  console.error(`[Error ID: ${correlationId}] Global Server Error:`, err);
  return c.json(
    {
      success: false,
      message: "خطایی در سمت سرور رخ داد. لطفا دوباره تلاش کنید.",
      correlationId,
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
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
  serve({ fetch: app.fetch, port: 8000 }, () => {
    console.log("🚀 Server running securely at http://localhost:8000");
  });
}).catch((err) => {
  console.error("Failed to connect to MongoDB:", err);
  process.exit(1);
});
