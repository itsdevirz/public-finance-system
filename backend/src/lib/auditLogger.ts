import { ObjectId } from "mongodb";
import { getDb } from "../db/index.js";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { parseUserAgent, ParsedUserAgent } from "./uaParser.js";
import { getShamsiDetails, resolveIpLocation, resolveTimezone } from "./shamsi.js";
import { sendAdminThresholdNotification } from "./notifier.js";

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
  USER_DATA_IMPORT_ATTEMPT: "تلاش برای وارد کردن داده‌های کاربری",

  // ۱۵. همه تلاش‌ها برای خارج کردن اطلاعات از محصول (مطابق الزامات جدید)
  DATA_EXPORT_ATTEMPT: "همه تلاش‌ها برای خارج کردن اطلاعات از محصول",

  // ۱۶. تمامی تغییرات در رفتارهای توابع کارکردی محصول
  FUNCTION_BEHAVIOR_CHANGE: "تمامی تغییرات در رفتارهای توابع کارکردی محصول",

  // ۱۷. استفاده از کارکردهای مدیریتی
  ADMIN_FUNCTION_USAGE: "استفاده از کارکردهای مدیریتی",

  // ۱۸. تغییرات در گروه کاربران
  USER_GROUP_CHANGE: "تغییرات در گروه کاربران",

  // ۱۹. شکست در کارکردهای امنیتی محصول
  SECURITY_FUNCTION_FAILURE: "شکست در کارکردهای امنیتی محصول",

  // ۲۰. تمامی قابلیت‌هایی از محصول که به دلیل شکست (خرابی یا مشکل کارکرد)، نمی‌توانند عملیات مورد نظر را انجام دهند
  SYSTEM_CAPABILITY_FAILURE: "شکست در قابلیت کارکردی محصول (خرابی/مشکل کارکرد)",

  // ۲۱. تلاش موفق یا ناموفق برای برقراری نشست
  SESSION_ESTABLISHMENT_ATTEMPT: "تلاش برای برقراری نشست",

  // ۲۲. ایجاد نشدن نشست به دلیل محدودیت نشست‌های همزمان (حداقل)
  CONCURRENT_SESSION_LIMIT_EXCEEDED: "ایجاد نشدن نشست به دلیل محدودیت نشست‌های همزمان",

  // ۲۳. خاتمه دادن به یک نشست غیرفعال توسط سازوکار قفل نشست
  INACTIVE_SESSION_TERMINATED_BY_LOCK: "خاتمه دادن به نشست غیرفعال توسط سازوکار قفل نشست",

  // ۲۴. خاتمه به نشست غیرفعال توسط مدیر سیستم
  INACTIVE_SESSION_TERMINATED_BY_ADMIN: "خاتمه به نشست غیرفعال توسط مدیر سیستم",

  // ۲۵. خاتمه نشست توسط کاربر آغازگر
  SESSION_TERMINATED_BY_USER: "خاتمه نشست توسط کاربر آغازگر"
} as const;

export interface AuditLogParams {
  userId?: string | ObjectId;
  username?: string;
  userFullName?: string;
  userRole?: string;
  action: string;
  resource: string;
  result: "SUCCESS" | "FAILURE";
  ip?: string;
  location?: string;
  userAgent?: string;
  timezone?: string;
  correlationId?: string;
  errorCode?: string | number;
  durationMs?: number;
  method?: string;
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

const AUDIT_STORAGE_THRESHOLD = 10000; // حد آستانه ۱۰,۰۰۰ رکورد لاگ قبل از سرریز
const HMAC_SECRET = process.env.AUDIT_LOG_SECRET || "AFTA_SECURE_HMAC_SECRET_KEY_2026";

/**
 * تولید امضای رمزنگاری HMAC برای اعتبارسنجی اصالت و دستکاری‌ناپذیری لاگ
 */
export function generateLogSignature(log: Record<string, any>): string {
  const payload = [
    log.userId || "",
    log.username || "",
    log.action || "",
    log.eventType || "",
    log.resource || "",
    log.result || "",
    log.ip || "",
    log.timestamp || "",
    log.correlationId || ""
  ].join("|");

  return crypto.createHmac("sha256", HMAC_SECRET).update(payload).digest("hex");
}

/**
 * بررسی و اعتبارسنجی اصالت لاگ دیتابیس در برابر دستکاری مستقیم
 */
export function verifyLogIntegrity(log: Record<string, any>): boolean {
  if (!log.signature || typeof log.signature !== "string") return false;
  try {
    const expected = generateLogSignature(log);
    const sigBuf = Buffer.from(log.signature, "hex");
    const expBuf = Buffer.from(expected, "hex");
    if (sigBuf.length !== expBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expBuf);
  } catch (_) {
    return false;
  }
}

/**
 * امضا و اعتبارسنجی اولیه برای لاگ‌های قدیمی که قبل از پیاده‌سازی HMAC ثبت شده‌اند
 */
export async function signExistingLogs(): Promise<number> {
  try {
    const db = getDb();
    const unsignedLogs = await db.collection("audit_logs").find({
      $or: [
        { signature: { $exists: false } },
        { signature: "" },
        { signature: null }
      ]
    }).toArray();

    let signedCount = 0;
    for (const log of unsignedLogs) {
      const sig = generateLogSignature(log);
      await db.collection("audit_logs").updateOne({ _id: log._id }, { $set: { signature: sig } });
      signedCount++;
    }
    return signedCount;
  } catch (err) {
    console.error("Error signing existing logs:", err);
    return 0;
  }
}

// ذخیره‌سازی پشتیبان در صورت شکست دیتابیس با سطح دسترسی محرمانه (Fail-Secure Fallback)
function writeFallbackFileLog(logEntry: Record<string, any>): void {
  try {
    const logsDir = path.join(process.cwd(), "logs");
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    const fallbackFilePath = path.join(logsDir, "audit_fallback.log");
    fs.appendFileSync(fallbackFilePath, JSON.stringify(logEntry) + "\n", "utf8");
    try {
      fs.chmodSync(fallbackFilePath, 0o600); // فقط خواندن/نوشتن برای مالک فایل
    } catch (_) {}
  } catch (err) {
    console.error("Critical Storage Error: Fallback log file writing failed:", err);
  }
}

/**
 * استخراج و شناسایی دقیق آدرس آی‌پی (IP) واقعی دستگاه درخواست‌دهنده
 */
export function extractClientIp(c: any): string {
  if (!c || !c.req) return "127.0.0.1";

  const forwarded = c.req.header("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0]?.trim();
    if (firstIp && firstIp !== "undefined" && firstIp !== "null") {
      return firstIp.replace(/^::ffff:/, "");
    }
  }

  const realIp = c.req.header("x-real-ip");
  if (realIp && realIp !== "undefined" && realIp !== "null") {
    return realIp.replace(/^::ffff:/, "");
  }

  const cfIp = c.req.header("cf-connecting-ip");
  if (cfIp && cfIp !== "undefined" && cfIp !== "null") {
    return cfIp.replace(/^::ffff:/, "");
  }

  const reqRaw = c.req?.raw as any;
  const socketIp = c.env?.incoming?.socket?.remoteAddress || c.env?.raw?.socket?.remoteAddress || reqRaw?.socket?.remoteAddress;
  if (socketIp) {
    if (socketIp === "::1" || socketIp === "::ffff:127.0.0.1") return "127.0.0.1";
    return socketIp.replace(/^::ffff:/, "");
  }

  return "127.0.0.1";
}

export async function logAuditEvent(params: AuditLogParams): Promise<void> {
  const now = new Date();
  const correlationId = params.correlationId || crypto.randomUUID();
  
  // ۱. استخراج متاداده‌های دقیق سیستم‌عامل، مرورگر و دستگاه
  const parsedUa: ParsedUserAgent = parseUserAgent(params.userAgent);
  
  // ۲. محاسبه دقیق تاریخ و زمان هجری شمسی
  const shamsi = getShamsiDetails(now);

  // ۳. موقعیت مکانی و تایم‌زون
  const clientIp = params.ip || "127.0.0.1";
  const ipLocation = resolveIpLocation(clientIp, params.location);
  const timezone = resolveTimezone(params.timezone);

  const logEntry = {
    userId: params.userId ? (typeof params.userId === "string" ? params.userId : params.userId.toHexString()) : "SYSTEM",
    username: params.username || "anonymous",
    userFullName: params.userFullName || params.username || "ناشناس",
    userRole: params.userRole || "سیستم",
    action: params.action,
    eventType: params.eventType || params.action,
    resource: params.resource,
    method: params.method || null,
    result: params.result,
    ip: clientIp,
    ipLocation,
    userAgent: params.userAgent || "Unknown",
    
    // فیلدهای دقیق سیستم‌عامل و مرورگر
    osName: parsedUa.osName,
    osType: parsedUa.osType,
    osVersion: parsedUa.osVersion,
    deviceType: parsedUa.deviceType,
    browser: parsedUa.browser,
    browserName: parsedUa.browserName,
    browserVersion: parsedUa.browserVersion,

    // فیلدهای دقیق تاریخ و زمان شمسی و تایم‌زون
    timezone,
    shamsiDate: shamsi.shamsiDate,
    shamsiDateTime: shamsi.shamsiDateTime,
    shamsiTime: shamsi.shamsiTime,
    shamsiYear: shamsi.shamsiYear,
    shamsiMonth: shamsi.shamsiMonth,
    shamsiDay: shamsi.shamsiDay,
    shamsiMonthName: shamsi.shamsiMonthName,
    shamsiDayOfWeek: shamsi.shamsiDayOfWeek,

    // اطلاعات فنی عملیات
    correlationId,
    durationMs: params.durationMs ?? null,
    errorCode: params.errorCode ?? null,
    details: sanitizePayload(params.details || {}),
    timestamp: now.toISOString(),
    createdAt: now,
    signature: ""
  };
  logEntry.signature = generateLogSignature(logEntry);

  try {
    const db = getDb();

    // ۵. بررسی حد آستانه سرریز حافظه و پاکسازی اتوماتیک
    const count = await db.collection("audit_logs").estimatedDocumentCount();
    if (count >= AUDIT_STORAGE_THRESHOLD) {
      await runAuditLogRetentionAndRotation();
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

/**
 * عملیات خودکار چرخش و پاکسازی لاگ‌ها:
 * ۱. پاکسازی اتوماتیک تمام لاگ‌های قدیمی‌تر از ۳ ماه (۹۰ روز)
 * ۲. بازنویسی و چرخش اتوماتیک قدیمی‌ترین لاگ‌ها در صورت تجاوز از سقف ۱۰,۰۰۰ رکورد (FIFO)
 */
export async function runAuditLogRetentionAndRotation(): Promise<{ prunedByAge: number; prunedByCapacity: number }> {
  let prunedByAge = 0;
  let prunedByCapacity = 0;

  try {
    const db = getDb();
    const now = new Date();

    // ۱. حذف لاگ‌های قدیمی‌تر از ۳ ماه (۹۰ روز)
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const ageDeleteResult = await db.collection("audit_logs").deleteMany({
      $or: [
        { createdAt: { $lt: threeMonthsAgo } },
        { timestamp: { $lt: threeMonthsAgo.toISOString() } }
      ]
    });
    prunedByAge = ageDeleteResult.deletedCount || 0;

    // ۲. بررسی ظرفیت ذخیره‌سازی (سقف ۱۰,۰۰۰ لاگ)
    const totalCount = await db.collection("audit_logs").countDocuments();
    if (totalCount >= AUDIT_STORAGE_THRESHOLD) {
      // تعداد رکوردهای اضافی که باید حذف و با لاگ جدید بازنویسی شوند
      const excess = (totalCount - AUDIT_STORAGE_THRESHOLD) + 500; // حذف حداقل ۵۰۰ لاگ قدیمی جهت ایجاد ظرفیت لاگ‌های جدید
      const oldestLogs = await db.collection("audit_logs")
        .find({}, { projection: { _id: 1 } })
        .sort({ createdAt: 1 })
        .limit(excess)
        .toArray();

      if (oldestLogs.length > 0) {
        const ids = oldestLogs.map((l) => l._id);
        const capDeleteResult = await db.collection("audit_logs").deleteMany({ _id: { $in: ids } });
        prunedByCapacity = capDeleteResult.deletedCount || 0;
      }

      // ارسال notification به ادمین سیستم
      sendAdminThresholdNotification({
        currentCount: totalCount,
        threshold: AUDIT_STORAGE_THRESHOLD,
        actionTaken: `چرخش اتوماتیک لاگ‌ها: ${prunedByCapacity} لاگ قدیمی با جدید بازنویسی شدند. (${prunedByAge} لاگ ۳ ماه پیش پاکسازی شد)`,
        isSimulated: false
      }).catch(err => console.error("Notification Error:", err));
    }

    if (prunedByAge > 0 || prunedByCapacity > 0) {
      console.log(`[AUDIT RETENTION AUTOMATIC CRON] Success: Pruned ${prunedByAge} logs (older than 3 months) & Rotated ${prunedByCapacity} logs (10,000 capacity threshold exceeded).`);
    }
  } catch (err) {
    console.error("Error in runAuditLogRetentionAndRotation:", err);
  }

  return { prunedByAge, prunedByCapacity };
}

/**
 * تایمر و زمان‌بندی اتوماتیک برای اجرای چرخش و پاکسازی لاگ‌ها (هر ۱ ساعت یک‌بار + هنگام استارت بک‌اند)
 */
export function startAuditLogAutoCleanupCron(): void {
  // اجرای فوری در استارت‌آپ سرور
  runAuditLogRetentionAndRotation().catch(err => console.error("Initial audit log cleanup failed:", err));

  // اجرای خودکار هر ۱ ساعت یک‌بار سر تایم دقیق
  const ONE_HOUR_MS = 60 * 60 * 1000;
  setInterval(() => {
    runAuditLogRetentionAndRotation().catch(err => console.error("Scheduled audit log cleanup failed:", err));
  }, ONE_HOUR_MS);
}
