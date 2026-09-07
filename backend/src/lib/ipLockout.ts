import { getDb } from "../db/index.js";
import { logAuditEvent, AFTA_LOG_EVENT_TYPES } from "./auditLogger.js";

export interface IpLockoutRecord {
  ip: string;
  failedAttempts: number;
  blockedUntil: string | null;
  lastAttemptAt: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CheckIpResult {
  blocked: boolean;
  remainingMinutes: number;
  reason?: string;
}

/**
 * بررسی وضعیت مسدودی آدرس IP درخواست‌دهنده
 */
export async function checkIpLockout(ip: string, policy: any): Promise<CheckIpResult> {
  const enableIpLockout = policy?.enableIpLockout !== false;
  if (!enableIpLockout || !ip || ip === "127.0.0.1" || ip === "localhost") {
    return { blocked: false, remainingMinutes: 0 };
  }

  try {
    const db = getDb();
    const record = await db.collection("ip_lockouts").findOne({ ip });
    if (!record || !record.blockedUntil) {
      return { blocked: false, remainingMinutes: 0 };
    }

    const blockedUntilTime = new Date(record.blockedUntil).getTime();
    const now = Date.now();

    if (now < blockedUntilTime) {
      const remainingMs = blockedUntilTime - now;
      const remainingMinutes = Math.max(1, Math.ceil(remainingMs / (60 * 1000)));
      return {
        blocked: true,
        remainingMinutes,
        reason: `آدرس IP شما (${ip}) به دلیل تلاش‌های ناموفق مکرر مسدود شده است. ${remainingMinutes} دقیقه باقی‌مانده است.`
      };
    }

    // زمان مسدودی منقضی شده است -> پاکسازی وضعیت مسدودی
    await db.collection("ip_lockouts").updateOne(
      { ip },
      { $set: { blockedUntil: null, failedAttempts: 0, updatedAt: new Date().toISOString() } }
    );
    return { blocked: false, remainingMinutes: 0 };
  } catch (err) {
    console.error("Error in checkIpLockout:", err);
    return { blocked: false, remainingMinutes: 0 };
  }
}

/**
 * ثبت تلاش ناموفق برای آدرس IP و مسدودسازی خودکار در صورت رسیدن به سقف مجاز
 */
export async function recordIpFailure(ip: string, policy: any): Promise<void> {
  const enableIpLockout = policy?.enableIpLockout !== false;
  if (!enableIpLockout || !ip || ip === "127.0.0.1" || ip === "localhost") return;

  const maxAttempts = Math.max(1, Number(policy?.maxIpFailedAttempts) || 10);
  const lockoutDurationMin = Math.max(1, Number(policy?.ipLockoutDurationMinutes) || 30);
  const rateLimitWindowMin = Math.max(1, Number(policy?.ipRateLimitWindowMinutes) || 5);

  try {
    const db = getDb();
    const now = new Date();
    const record = await db.collection("ip_lockouts").findOne({ ip });

    let currentAttempts = record ? (record.failedAttempts || 0) : 0;
    const lastAttemptTime = record?.lastAttemptAt ? new Date(record.lastAttemptAt).getTime() : 0;
    const windowMs = rateLimitWindowMin * 60 * 1000;

    // اگر از آخرین تلاش بیشتر از پنجره زمانی بگذرد، شمارنده از ۱ ریست می‌شود
    if (now.getTime() - lastAttemptTime > windowMs) {
      currentAttempts = 1;
    } else {
      currentAttempts += 1;
    }

    const isLimitReached = currentAttempts >= maxAttempts;
    let blockedUntilIso: string | null = null;

    if (isLimitReached) {
      const blockedUntilDate = new Date(now.getTime() + lockoutDurationMin * 60 * 1000);
      blockedUntilIso = blockedUntilDate.toISOString();
    }

    await db.collection("ip_lockouts").updateOne(
      { ip },
      {
        $set: {
          ip,
          failedAttempts: currentAttempts,
          blockedUntil: blockedUntilIso,
          lastAttemptAt: now.toISOString(),
          updatedAt: now.toISOString()
        },
        $setOnInsert: { createdAt: now.toISOString() }
      },
      { upsert: true }
    );

    // ثبت لاگ ممیزی در صورت مسدود شدن خودکار IP
    if (isLimitReached) {
      const actionDesc = `مسدودسازی خودکار آدرس IP '${ip}' به مدت ${lockoutDurationMin} دقیقه به علت ثبت ${currentAttempts} بار تلاش ناموفق ورود متوالی در پنجره ${rateLimitWindowMin} دقیقه‌ای (الزام امنیت افتا)`;
      await logAuditEvent({
        userId: "SYSTEM",
        username: "system_security",
        userFullName: "سیستم هوشمند مسدودسازی IP",
        userRole: "مدیر سیستم",
        action: actionDesc,
        eventType: AFTA_LOG_EVENT_TYPES.SECURITY_FUNCTION_FAILURE,
        resource: "/api/auth/login",
        result: "FAILURE",
        ip,
        details: {
          blockedIp: ip,
          failedAttempts: currentAttempts,
          maxAllowedAttempts: maxAttempts,
          lockoutDurationMinutes: lockoutDurationMin,
          rateLimitWindowMinutes: rateLimitWindowMin,
          blockedUntil: blockedUntilIso
        }
      });
    }
  } catch (err) {
    console.error("Error in recordIpFailure:", err);
  }
}

/**
 * پاکسازی آمار خطای IP پس از ورود موفقیت‌آمیز
 */
export async function clearIpFailure(ip: string): Promise<void> {
  if (!ip || ip === "127.0.0.1" || ip === "localhost") return;
  try {
    const db = getDb();
    await db.collection("ip_lockouts").updateOne(
      { ip },
      { $set: { failedAttempts: 0, blockedUntil: null, updatedAt: new Date().toISOString() } }
    );
  } catch (err) {
    console.error("Error in clearIpFailure:", err);
  }
}

/**
 * رفع مسدودی دستی آدرس IP توسط مدیر سیستم به همراه ثبت لاگ ممیزی کامل
 */
export async function unblockIp(ip: string, adminUsername: string, adminUserId?: string): Promise<boolean> {
  try {
    const db = getDb();
    const result = await db.collection("ip_lockouts").deleteOne({ ip });

    const actionDesc = `رفع مسدودی دستی آدرس IP '${ip}' توسط مدیر سیستم ('${adminUsername}')`;
    await logAuditEvent({
      userId: adminUserId || "ADMIN",
      username: adminUsername || "admin",
      userFullName: adminUsername || "مدیر سیستم",
      userRole: "مدیر سیستم",
      action: actionDesc,
      eventType: AFTA_LOG_EVENT_TYPES.ADMIN_FUNCTION_USAGE,
      resource: "/api/security/ip-lockouts/unblock",
      result: "SUCCESS",
      ip: "127.0.0.1",
      details: {
        unblockedIp: ip,
        actionBy: adminUsername,
        actionTimestamp: new Date().toISOString()
      }
    });

    return result.deletedCount > 0;
  } catch (err) {
    console.error("Error in unblockIp:", err);
    return false;
  }
}

/**
 * دریافت لیست آدرس‌های IP مسدودشده فعلی به همراه اطلاعات زمان منقضی شدن
 */
export async function getIpLockouts(): Promise<any[]> {
  try {
    const db = getDb();
    const nowIso = new Date().toISOString();
    const records = await db.collection("ip_lockouts").find({
      blockedUntil: { $ne: null, $gt: nowIso }
    }).toArray();

    const now = Date.now();
    return records.map(r => {
      const remainingMs = new Date(r.blockedUntil).getTime() - now;
      const remainingMinutes = Math.max(1, Math.ceil(remainingMs / (60 * 1000)));
      return {
        ip: r.ip,
        failedAttempts: r.failedAttempts,
        blockedUntil: r.blockedUntil,
        remainingMinutes,
        lastAttemptAt: r.lastAttemptAt
      };
    });
  } catch (err) {
    console.error("Error in getIpLockouts:", err);
    return [];
  }
}
