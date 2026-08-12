import { getDb } from "../db/index.js";
import { getShamsiDetails } from "./shamsi.js";

export interface ThresholdAlertOptions {
  currentCount: number;
  threshold?: number;
  actionTaken?: string;
  isSimulated?: boolean;
}

/**
 * ارسال و ثبت هشدار به کاربر ادمین در سیستم
 */
export async function sendAdminThresholdNotification(options: ThresholdAlertOptions): Promise<void> {
  const threshold = options.threshold || 10000;
  const { currentCount, actionTaken = "چرخش اتوماتیک لاگ‌ها (Log Rotation)", isSimulated = false } = options;
  const now = new Date();
  const shamsi = getShamsiDetails(now);

  const title = isSimulated
    ? "⚠️ [آزمایشی] هشدار سرریز حافظه ثبت‌نشان‌های دیتابیس"
    : "🚨 هشدار حد آستانه ذخیره‌سازی ثبت‌نشان‌ها (۱۰,۰۰۰ رکورد)";

  const message = isSimulated
    ? `این یک پیام تست اطلاع‌رسانی است. حجم لاگ‌های دیتابیس به حد آستانه ۱۰,۰۰۰ رکورد رسیده است.`
    : `تعداد رکوردهای ثبت‌نشان امنیتی به حد آستانه ۱۰,۰۰۰ رکورد رسید. ${actionTaken} با موفقیت اجرا شد.`;

  const notificationDoc = {
    recipientRole: "admin",
    type: "LOG_THRESHOLD_ALERT",
    level: "CRITICAL",
    title,
    message,
    shamsiDateTime: shamsi.shamsiDateTime,
    shamsiDate: shamsi.shamsiDate,
    shamsiTime: shamsi.shamsiTime,
    createdAt: now.toISOString(),
    read: false,
    channels: ["SYSTEM_UI"],
    details: {
      currentCount,
      threshold,
      usagePercentage: ((currentCount / threshold) * 100).toFixed(1) + "%",
      actionTaken,
      isSimulated
    }
  };

  try {
    const db = getDb();
    await db.collection("system_notifications").insertOne(notificationDoc);
    console.log(`[ADMIN NOTIFICATION SYSTEM] Log threshold alert logged for Admin (${currentCount}/${threshold})`);
  } catch (err) {
    console.error("Failed to insert threshold notification to DB:", err);
  }
}
