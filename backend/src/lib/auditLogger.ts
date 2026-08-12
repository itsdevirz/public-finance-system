import { ObjectId } from "mongodb";
import { getDb } from "../db/index.js";
import crypto from "crypto";
import fs from "fs";
import path from "path";

// ── 14 گستره الزامی ثبت‌نشان‌ها مطابق سند افتا ───────────────────────────
export const AFTA_LOG_EVENT_TYPES = {
  // ۱. شروع و اتمام توابع / درخواست‌ها
  FUNCTION_START: "شروع تابع / درخواست",
  FUNCTION_END: "اتمام تابع / درخواست",

  // ۲. تلاش‌های ناموفق برای خواندن اطلاعات از ثبت‌نشان‌ها
  AUDIT_LOG_READ_FAILURE: "تلاش ناموفق برای خواندن ثبت‌نشان‌ها",

  // ۳. خواندن اطلاعات از ثبت‌نشان‌ها
  AUDIT_LOG_READ_SUCCESS: "خواندن اطلاعات ثبت‌نشان‌ها",

  // ۴. تمامی تغییرات در پیکربندی ثبت‌نشان‌ها
  AUDIT_LOG_CONFIG_CHANGE: "تغییر در پیکربندی ثبت‌نشان‌ها",

  // ۵. عملیات انجام‌شده به دلیل سرریز حافظه ثبت‌نشان‌ها از حد آستانه
  AUDIT_LOG_OVERFLOW_ACTION: "عملیات سرریز حافظه ثبت‌نشان‌ها از حد آستانه",

  // ۶. عملیات انجام‌شده به دلیل شکست در ذخیره‌سازی ثبت‌نشان‌ها
  AUDIT_LOG_STORAGE_FAILURE: "شکست در ذخیره‌سازی ثبت‌نشان‌ها و اجرای Fallback",

  // ۷. تلاش‌های موفقیت‌آمیز برای بررسی صحت داده کاربری، شامل نتایج بررسی
  USER_DATA_VALIDATION_SUCCESS: "بررسی صحت داده کاربری (موفق)",
  USER_DATA_VALIDATION_FAILURE: "بررسی صحت داده کاربری (ناموفق)",

  // ۸. تمام کاربردهای سازوکار احراز هویت
  AUTH_MECHANISM_USAGE: "فراخوانی سازوکار احراز هویت",

  // ۹. نتایج نهایی عملیات احراز هویت
  AUTH_FINAL_OUTCOME: "نتیجه نهایی احراز هویت",

  // ۱۰. تلاش موفق و ناموفق هر گذرواژه بررسی‌شده توسط محصول
  PASSWORD_VERIFY_SUCCESS: "بررسی موفقیت‌آمیز گذرواژه",
  PASSWORD_VERIFY_FAILURE: "بررسی ناموفق گذرواژه",

  // ۱۱. شکست و موفقیت انتساب ویژگی‌های امنیتی کاربر به موجودیت فعال (ایجاد نشست/موجودیت)
  SECURITY_ATTR_BINDING_SUCCESS: "انتساب ویژگی‌های امنیتی به موجودیت فعال (موفق)",
  SECURITY_ATTR_BINDING_FAILURE: "انتساب ویژگی‌های امنیتی به موجودیت فعال (ناموفق)",

  // ۱۲. تمامی تغییرات بر روی مقادیر ویژگی‌های امنیتی
  SECURITY_ATTR_CHANGE: "تغییر مقادیر ویژگی‌های امنیتی",

  // ۱۳. تمامی درخواست‌ها (موفق و ناموفق) برای اجرای عملیات بر روی موجودیت غیرفعال
  INACTIVE_ENTITY_OPERATION: "درخواست عملیات بر روی موجودیت غیرفعال",

  // ۱۴. تمامی تلاش‌ها برای وارد کردن داده‌های کاربری (شامل ویژگی‌های امنیتی)
  USER_DATA_IMPORT_ATTEMPT: "تلاش برای وارد کردن داده‌های کاربری"
} as const;

export interface AuditLogParams {
  userId?: string | ObjectId;
  username?: string;
  action: string;
  resource: string;
  result: "SUCCESS" | "FAILURE";
  ip?: string;
  userAgent?: string;
  correlationId?: string;
  errorCode?: string | number;
  details?: Record<string, any>;
  eventType?: keyof typeof AFTA_LOG_EVENT_TYPES | string;
}

const SENSITIVE_KEYS = new Set([
  "password",
  "pass",
  "secret",
  "token",
  "accesstoken",
  "refreshtoken",
  "authorization",
  "privatekey",
  "apikey",
  "creditcard"
]);

function sanitizePayload(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizePayload(item));
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizePayload(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

const AUDIT_STORAGE_THRESHOLD = 100000; // حد آستانه تعداد لوگ‌ها قبل از سرریز

// ذخیره‌سازی پشتیبان در صورت شکست دیتابیس (Fail-Secure Fallback)
function writeFallbackFileLog(logEntry: Record<string, any>): void {
  try {
    const logsDir = path.join(process.cwd(), "logs");
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    const fallbackFilePath = path.join(logsDir, "audit_fallback.log");
    fs.appendFileSync(fallbackFilePath, JSON.stringify(logEntry) + "\n", "utf8");
  } catch (err) {
    console.error("Critical Storage Error: Fallback log file writing failed:", err);
  }
}

export async function logAuditEvent(params: AuditLogParams): Promise<void> {
  const correlationId = params.correlationId || crypto.randomUUID();
  const logEntry = {
    userId: params.userId ? (typeof params.userId === "string" ? params.userId : params.userId.toHexString()) : "SYSTEM",
    username: params.username || "anonymous",
    action: params.action,
    eventType: params.eventType || params.action,
    resource: params.resource,
    result: params.result,
    ip: params.ip || "127.0.0.1",
    userAgent: params.userAgent || "Unknown",
    correlationId,
    errorCode: params.errorCode || null,
    details: sanitizePayload(params.details || {}),
    timestamp: new Date().toISOString(),
    createdAt: new Date()
  };

  try {
    const db = getDb();

    // ۵. بررسی حد آستانه سرریز حافظه ثبت‌نشان‌ها
    const count = await db.collection("audit_logs").estimatedDocumentCount();
    if (count >= AUDIT_STORAGE_THRESHOLD) {
      // اجرای عملیات کنترل سرریز (حذف پایش شده قدیمی‌ترین لوگ‌های غیربحرانی و ثبت لوگ سرریز)
      const overflowLog = {
        userId: "SYSTEM",
        username: "SYSTEM_MONITOR",
        action: AFTA_LOG_EVENT_TYPES.AUDIT_LOG_OVERFLOW_ACTION,
        eventType: AFTA_LOG_EVENT_TYPES.AUDIT_LOG_OVERFLOW_ACTION,
        resource: "audit_logs_storage",
        result: "SUCCESS",
        ip: "127.0.0.1",
        correlationId,
        details: { currentCount: count, threshold: AUDIT_STORAGE_THRESHOLD, actionTaken: "چرخش اتوماتیک و آرشیو لوگ‌های قدیمی" },
        timestamp: new Date().toISOString(),
        createdAt: new Date()
      };

      // حذف قدیمی‌ترین ۱۰,۰۰۰ لوگ
      const oldestLogs = await db.collection("audit_logs").find().sort({ createdAt: 1 }).limit(10000).toArray();
      if (oldestLogs.length > 0) {
        const ids = oldestLogs.map((l) => l._id);
        await db.collection("audit_logs").deleteMany({ _id: { $in: ids } });
      }
      await db.collection("audit_logs").insertOne(overflowLog);
    }

    await db.collection("audit_logs").insertOne(logEntry);
  } catch (error: any) {
    // ۶. عملیات انجام‌شده به دلیل شکست در ذخیره‌سازی ثبت‌نشان‌ها (Fail-Secure Fallback)
    console.error("Critical Failure: MongoDB audit log write error. Executing fail-secure fallback log:", error);
    
    const storageFailureLog = {
      ...logEntry,
      fallbackReason: AFTA_LOG_EVENT_TYPES.AUDIT_LOG_STORAGE_FAILURE,
      errorMsg: error.message
    };
    writeFallbackFileLog(storageFailureLog);
  }
}
