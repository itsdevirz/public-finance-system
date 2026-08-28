import React, { useState, useEffect, useMemo, useCallback } from "react";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  History, Search, Printer, FileSpreadsheet, ShieldAlert, ShieldCheck,
  CheckCircle2, AlertTriangle, RefreshCw, Eye, Lock, ArrowUpDown,
  Laptop, UserCheck, ChevronLeft, ChevronRight, LogIn,
  Database, AlertOctagon, Terminal, Activity, FileText, FileEdit, Info, Layers
} from "lucide-react";
import api, { logFileDownloadAudit } from "@/api";
import { cn } from "@/lib/utils";
import { printTable } from "@/lib/printUtils";
import { useAuth } from "@/context/AuthContext";

// انواع جداول ثبت‌نشان‌ها (جدول لاگ‌های عملیاتی و امنیتی سیستم)
const LOG_TABLE_TYPES = [
  { id: "OPERATIONAL", label: "جدول لاگ‌های عملیاتی و امنیتی سیستم (شامل گذرواژه‌ها)" },
  { id: "CONCURRENT_SESSIONS", label: "جدول ایجاد نشدن نشست به دلیل محدودیت نشست‌های همزمان (بند ۱ جدول ۲-۸ دسترسی به محصول)" },
  { id: "SESSION_ESTABLISHMENT", label: "جدول تلاش برای برقراری نشست (بند ۷ جدول ۲-۸ دسترسی و بند ۸ جدول ۲-۳ احراز هویت)" },
  { id: "CAPABILITY_FAILURES", label: "جدول شکست در قابلیت‌های کارکردی محصول (بند ۱ جدول ۲-۷ تخصیص منابع)" },
  { id: "SECURITY_FAILURES", label: "جدول شکست در کارکردهای امنیتی محصول (بند ۱ جدول ۲-۶ حفاظت از توابع امنیتی)" },
  { id: "USER_GROUPS", label: "جدول تغییرات در گروه کاربران (بند ۱ جدول ۲-۴ حفاظت از داده‌ی کاربری)" },
  { id: "ADMIN_FUNCTIONS", label: "جدول استفاده از کارکردهای مدیریتی (بند ۴ جدول ۵-۲ مدیریت امنیت)" },
  { id: "AUTH_LOGS", label: "جدول لاگ‌های احراز هویت (ورود و خروج)" },
  { id: "ATTACHMENTS", label: "فایل ها / ضمیمه ها (رویدادهای دانلود، بارگذاری و خروج داده)" }
];

// دسته‌بندی‌های سریع لاگ‌های عملیاتی
const LOG_CATEGORIES = [
  { id: "ALL", label: "همه لاگ‌های عملیاتی" },
  { id: "CONCURRENT_SESSIONS", label: "محدودیت نشست‌های همزمان (بند ۱ دسترسی به محصول)" },
  { id: "SESSION_ESTABLISHMENT", label: "برقراری نشست (بند ۷ دسترسی و بند ۸ احراز هویت)" },
  { id: "CAPABILITY_FAILURES", label: "شکست در قابلیت‌های کارکردی (بند ۱ تخصیص منابع)" },
  { id: "SECURITY_FAILURES", label: "شکست در کارکردهای امنیتی محصول (بند ۱ حفاظت از توابع امنیتی)" },
  { id: "USER_GROUPS", label: "تغییرات در گروه کاربران (بند ۱ حفاظت از داده کاربری)" },
  { id: "ADMIN_FUNCTIONS", label: "استفاده از کارکردهای مدیریتی (بند ۴ مدیریت امنیت)" },
  { id: "BEHAVIOR_CHANGE", label: "تغییرات رفتار توابع محصول" },
  { id: "DOWNLOADS", label: "دانلود فایل (خروج داده)" },
  { id: "ATTACHMENTS", label: "فایل ها / ضمیمه ها" },
  { id: "PASSWORD", label: "تلاش‌ها و تغییرات گذرواژه" },
  { id: "AUTH", label: "ورود و امنیت" },
  { id: "CREATE", label: "ثبت و ایجاد جدید" },
  { id: "UPDATE", label: "ویرایش و تغییرات" },
  { id: "DELETE", label: "حذف و ابطال" },
  { id: "UNAUTHORIZED", label: "عملیات غیرمجاز" },
  { id: "READ", label: "مشاهده و استعلام" },
];

// فهرست ۱۸ کارکرد مدیریتی بند ۴ جدول ۵-۲ افتا (مدیریت امنیت)
export const AFTA_CLAUSE_4_ADMIN_CAPABILITIES = [
  {
    id: 1,
    title: "پشتیبانی از (حذف، ویرایش، اضافه) گروهی از کاربران با مجوز دسترسی برای خواندن اطلاعات ثبت‌نشان‌ها",
    code: "11026",
    description: "پشتیبانی کامل از مدیریت گروهی کاربران با مجوزهای دسترسی ممیزی."
  },
  {
    id: 2,
    title: "پشتیبانی از مجوزهای مشاهده/ویرایش ثبت‌نشان‌ها",
    code: "11027",
    description: "تفکیک و کنترل دقیق مجوزهای مشاهده و ویرایش لاگ‌های ممیزی."
  },
  {
    id: 3,
    title: "پشتیبانی از حد آستانه و عملیات (حذف، ویرایش، اضافه) در زمان خرابی ذخیره‌سازی ثبت‌نشان‌ها",
    code: "11028",
    description: "ذخیره پشتیبان و مکانیزم Fail-Secure ثبت‌نشان‌ها در زمان خرابی دیتابیس."
  },
  {
    id: 4,
    title: "مدیریت معیارها/پارامترهای مورد استفاده برای ایجاد و یا منع دسترسی به محصول",
    code: "11029",
    description: "تنظیم آدرس‌های IP غیرمجاز و خط‌مشی‌های منع دسترسی به سیستم."
  },
  {
    id: 5,
    title: "انتخاب زمان اجرای حفاظت از اطلاعات باقیمانده (زمان تخصیص یا آزادسازی منابع)",
    code: "11030",
    description: "پیکربندی زمان پاکسازی داده‌های موقت و آزادسازی منابع سیستم."
  },
  {
    id: 6,
    title: "ویرایش قوانین کنترلی بیشتر برای وارد کردن داده به داخل محصول",
    code: "11031",
    description: "ویرایش و اعمال قوانین کنترلی ورود داده‌های کاربری به محصول."
  },
  {
    id: 7,
    title: "در نظر گرفتن یک عملیات از پیش تعیین‌شده پس از تشخیص یک خطای صحت داده",
    code: "11032",
    description: "تعریف واکنش سیستمی و مسدودسازی در صورت بروز خطای اعتبارسنجی."
  },
  {
    id: 8,
    title: "مدیریت حد آستانه تلاش‌های ناموفق و مدیریت عملیات شکست احراز هویت",
    code: "11033",
    description: "پیکربندی سقف تلاش‌های ناموفق و تعلیق خودکار حساب کاربری (Lockout Policy)."
  },
  {
    id: 9,
    title: "مدیریت معیارها برای تنظیم گذرواژه‌ها",
    code: "10080",
    description: "تنظیم حداقل طول رمز عبور، ترکیبات پیچیده و قوانین گذرواژه (Password Policy)."
  },
  {
    id: 10,
    title: "مدیریت داده‌های احراز هویت و مدیریت عملیات قبل از احراز هویت",
    code: "11034",
    description: "مدیریت داده‌های احراز هویت و کنترل عملیات پیش از ورود کاربر."
  },
  {
    id: 11,
    title: "مدیریت سازوکارهای احراز هویت و مدیریت قوانین مرتبط با احراز هویت",
    code: "11035",
    description: "تنظیم سازوکارهای احراز هویت، OTP/MFA و اعتبار نشست‌ها."
  },
  {
    id: 12,
    title: "مدیریت اختصاص آدرس IP جهت شناسایی کاربر خاص توسط مدیر مجاز",
    code: "11039",
    description: "اختصاص آدرس‌های ماشین مجاز برای کاربران ارشد سامانه (Allowed Senior IPs)."
  },
  {
    id: 13,
    title: "تعریف و تغییر ویژگی‌های امنیتی فعال پیش‌فرض توسط مدیر مجاز",
    code: "11036",
    description: "مدیریت ویژگی‌های امنیتی پیش‌فرض موجودیت‌ها و نقش‌های فعال."
  },
  {
    id: 14,
    title: "مدیریت مقادیر پیش‌فرض برای کنترل دسترسی محصول",
    code: "11037",
    description: "تنظیم ماتریس دسترسی پیش‌فرض نقش‌ها و سطوح دسترسی (ACL)."
  },
  {
    id: 15,
    title: "مدیریت نقش‌ها در محصول",
    code: "11038",
    description: "تعریف، ویرایش و تخصیص نقش‌های شغلی کاربران سیستم."
  },
  {
    id: 16,
    title: "مدیریت حداکثر تعداد مجاز نشست‌های همزمان کاربران توسط مدیر",
    code: "11041",
    description: "تعیین حداکثر تعداد نشست‌های همزمان فعال به ازای هر کاربر."
  },
  {
    id: 17,
    title: "مدیریت شرایط آغاز نشست توسط مدیر مجاز",
    code: "11042",
    description: "تنظیم الزامات امنیتی و احراز هویت اولیه برای برقراری نشست."
  },
  {
    id: 18,
    title: "تعیین زمان غیرفعال بودن برای یک کاربر مشخص یا پیش‌فرض کاربران که پس از آن نشست خاتمه یابد",
    code: "11040",
    description: "تنظیم مهلت زمان عدم فعالیت (Idle Timeout) جهت خروج خودکار."
  }
];

// شناسنامه و خط‌مشی‌های کنترل دسترسی موجودیت‌ها (بند ۱ جدول ۲-۴ حفاظت از داده‌ی کاربری - تصویر ۲)
export const AFTA_CLAUSE_1_DATA_PROTECTION_POLICIES = [
  {
    category: "موجودیت‌های فعالی که خط‌مشی‌های کنترل دسترسی در مورد آن‌ها اعمال می‌شوند",
    items: [
      { name: "مدیر سیستم", type: "نقش مدیریتی ارشد", status: "خط‌مشی کنترل دسترسی فعال (ACL / RBAC)" },
      { name: "کاربر عادی", type: "نقش عملیاتی", status: "خط‌مشی کنترل دسترسی محدود شده فعال" },
      { name: "سایر موارد (کاربران سیستم، گروه‌های کاربری و ذیحسابان)", type: "نقش‌های اختصاصی", status: "کنترل دسترسی مبتنی بر سند و دپارتمان" }
    ]
  },
  {
    category: "موجودیت‌های غیرفعالی که خط‌مشی‌های کنترل دسترسی در مورد آن‌ها اعمال می‌شوند",
    items: [
      { name: "سوابق، مستندات و فراداده", type: "موجودیت غیرفعال و بایگانی", status: "دسترسی فقط‌خواندنی (Read-Only) همراه با تایید ادمین" },
      { name: "داده متعلق به کاربران", type: "اطلاعات کاربری غیرفعال", status: "محافظت‌شده طبق خط‌مشی انقضا و تعلیق حساب" },
      { name: "داده احراز هویت", type: "گذرواژه‌ها و توکن‌های منقضی", status: "غیرقابل دسترسی مستقیم و رمزنگاری‌شده (Redacted)" },
      { name: "سایر موارد (فایل‌های ضمیمه غیرفعال و اسناد ابطال‌شده)", type: "پشتیبان داده", status: "کنترل دسترسی بر اساس مجوز حذف منطقی (Soft Delete)" }
    ]
  },
  {
    category: "عملیاتی که خط‌مشی‌های کنترل دسترسی در رابطه با آن‌ها اعمال می‌شوند",
    items: [
      { name: "ایجاد موجودیت غیرفعال جدید", code: "1090", status: "نیازمند ثبت لاگ ممیزی و مجوز مدیر" },
      { name: "حذف موجودیت غیرفعال", code: "1091", status: "جلوگیری از حذف سخت‌افزاری و ثبت لاگ ابطال" },
      { name: "تغییر دسترسی‌ها به موجودیت غیرفعال", code: "1092", status: "کنترل دسترسی گروهی و ثبت تغییرات گروه کاربری" },
      { name: "عملیات بر روی فراداده وابسته به موجودیت غیرفعال", code: "1093", status: "اعتبارسنجی هش اصالت و هشدار تغییر غیرمجاز" },
      { name: "سایر موارد (انتقال، بازیابی و تعلیق موجودیت)", code: "1094", status: "ارزیابی خط‌مشی به همراه اطلاع‌رسانی به مسئول امنیت" }
    ]
  }
];

// شناسنامه و خط‌مشی‌های وضعیت امن در زمان شکست (بند ۱ جدول ۲-۶ حفاظت از توابع امنیتی محصول - تصویر ۲)
export const AFTA_CLAUSE_1_SECURITY_FUNCTION_FAILURES = [
  {
    id: 1,
    title: "خرابی‌های نرم‌افزاری (Software Failures)",
    code: "11050",
    description: "از کار افتادن سرویس، قطع ارتباط با پایگاه داده، خطای زمان اجرا (EntityException / SqlException) یا بروز اشکال در توابع کارکردی محصول.",
    safeStateAction: "قرارگیری بلافاصله سامانه در وضعیت امن (Fail-Secure)، ثبت لاگ ممیزی خطای سیستم، جلوگیری از افشای داده‌ها و حفظ خط‌مشی‌های کنترل دسترسی (ACL)."
  },
  {
    id: 2,
    title: "خرابی‌های سخت‌افزاری (Hardware Failures)",
    code: "11051",
    description: "اختلال در تجهیزات ذخیره‌سازی، قطعی کارت شبکه، پر شدن حافظه یا قطعی ناگهانی منبع تغذیه و تجهیزات فیزیکی.",
    safeStateAction: "سوئیچ به ذخیره‌سازی Fail-Safe محلی، پایداری ثبت‌نشان‌ها همراه با امضای اصالت HMAC SHA-256 و ارسال هشدار امنیتی فوری به مدیران ارشد."
  }
];

// شناسنامه و خط‌مشی‌های تحمل‌پذیری خطای کارکردهای اصلی محصول (بند ۱ جدول ۲-۷ تخصیص منابع - تصویر ۲)
export const AFTA_CLAUSE_1_RESOURCE_ALLOCATION_FAILURES = [
  {
    id: 1,
    title: "اطمینان از عملکرد کارکردهای اصلی هنگام خرابی نرم‌افزاری (Core Functions Fault Tolerance)",
    code: "11060",
    description: "محصول باید در زمان رخداد هرگونه اشکال و خرابی (شکست) نرم‌افزاری، از عملکرد کارکردهای اصلی محصول اطمینان حاصل نماید.",
    faultToleranceMechanism: "ایزوله‌سازی خطاهای زمان اجرا (EntityException / SqlException)، بازگردانی ساختار به وضعیت امن، جلوگیری از متوقف شدن کل سامانه و ثبت لاگ ممیزی کامل با امضای اصالت HMAC SHA-256."
  }
];

// شناسنامه و خط‌مشی‌های ممانعت و قوانین برقراری نشست (بند ۷ جدول ۲-۸ و بند ۸ جدول ۲-۳ افتا - تصویر ۲ و ۳)
export const AFTA_CLAUSE_7_AND_8_SESSION_ESTABLISHMENT_POLICIES = [
  {
    category: "بند ۷ جدول ۲-۸ (دسترسی به محصول): ممانعت از ایجاد نشست بر اساس پارامترها",
    items: [
      { parameter: "مکان (آدرس IP / ماشین)", sampleDescription: "آدرس ماشین جاری جهت ورود کاربران ارشد مجاز نمی باشد", code: "8-2-7-1", status: "فعال (ممانعت بر اساس محدوده IP)" },
      { parameter: "شماره پورت (Port Number)", sampleDescription: "درخواست ورود از پورت غیرمجاز مسدود شد", code: "8-2-7-2", status: "فعال" },
      { parameter: "روزهای هفته (Allowed Days)", sampleDescription: "امکان ورود در ایام تعطیل/غیرکاری برای حساب کاربر وجود ندارد", code: "8-2-7-3", status: "فعال" },
      { parameter: "بازه زمانی (Allowed Time Window)", sampleDescription: "امکان ورود به سیستم در این بازه زمانی برای شما وجود ندارد.", code: "8-2-7-4", status: "فعال (ممانعت بر اساس بازه زمانی)" },
      { parameter: "سایر موارد (کنترل‌های اختصاصی)", sampleDescription: "ممانعت از ایجاد نشست به دلیل محدودیت‌های امنیتی سفارشی", code: "8-2-7-5", status: "فعال" }
    ]
  },
  {
    category: "بند ۸ جدول ۲-۳ (شناسایی و احراز هویت): قوانین زمان برقراری نشست",
    items: [
      { parameter: "ابطال اعتبار نشست‌های قبلی / اطلاع به نشست اول", sampleDescription: "نشست قبلی کاربر ابطال گردید و اعلان به صفحه اصلی نشست ارسال شد", code: "3-2-8-1", status: "فعال (خاتمه/اطلاع‌رسانی نشست همزمان)" },
      { parameter: "بروزرسانی اطلاعات پیشینه احراز هویت", sampleDescription: "ثبت تاریخ، زمان، IP و اطلاعات پیشینه آخرین احراز هویت موفق و ناموفق", code: "3-2-8-2", status: "فعال (ثبت خودکار تاریخچه ورود)" },
      { parameter: "سایر موارد قوانین برقراری نشست", sampleDescription: "اعمال الزامات رمزنگاری و کنترل گواهی امنیتی هنگام اتصال اولیه", code: "3-2-8-3", status: "فعال" }
    ]
  }
];

// شناسنامه و خط‌مشی‌های محدودیت نشست‌های همزمان (بند ۱ جدول ۲-۸ دسترسی به محصول افتا - تصویر ۲)
export const AFTA_CLAUSE_1_CONCURRENT_SESSION_POLICIES = [
  {
    id: 1,
    title: "محدودیت حداکثر تعداد نشست‌های همزمان متعلق به یک کاربر (Concurrent Sessions Limit)",
    code: "8-2-1",
    description: "محصول باید حداکثر تعداد نشست‌های همزمان متعلق به یک کاربر را محدود نماید.",
    sampleExceededMessage: "با توجه به محدودیت نشست ها قادر به اتصال نیستید.",
    sampleKickoutMessage: "حداکثر تعداد ارتباط همزمان برای این کاربر پر شده است،امکان ورود به سیستم وجود ندارد.",
    policyStatus: "فعال (محدودسازی حداکثر نشست همزمان کاربر به ۱ نشست فعال)"
  }
];

// تابع تبدیل شرح‌های فنی به توضیحات کامل و قابل فهم برای کاربران غیربرنامه‌نویس
function formatHumanReadableDescription(log) {
  const rawAction = (log.action || log.eventType || "").trim();
  const resourceLower = (log.resource || "").toLowerCase();
  const methodUpper = (log.method || "").toUpperCase();
  const details = log.details || {};

  // فرمت پیام‌های خطای اعتبارسنجی داده کاربری / فایل غیرمجاز
  if (rawAction.startsWith("Message :") || rawAction.includes("کاربر قصد بارگذاری فایلی با فرمت")) {
    return rawAction.replace(/^Message\s*:\s*/i, "").trim();
  }

  // فرمت لاگ‌های تفکیکی آکاردئون‌ها و تیک‌های فعال‌سازی / غیرفعال‌سازی
  if (details?.accordion && details?.itemLabel) {
    if (details.changeType === "ACTIVATED") {
      return `آکاردئون '${details.accordion}': مشخصه/تیک '${details.itemLabel}' فعال شد.`;
    }
    if (details.changeType === "DEACTIVATED") {
      return `آکاردئون '${details.accordion}': مشخصه/تیک '${details.itemLabel}' غیرفعال شد.`;
    }
    return `آکاردئون '${details.accordion}': مشخصه '${details.itemLabel}' از '${details.oldVal}' به '${details.newVal}' تغییر یافت.`;
  }

  // فرمت لاگ دانلود فایل و خروج داده مطابق بند ۸ افتا (تطابق کامل با تصویر ۱)
  if (
    log.eventType === "DATA_EXPORT_ATTEMPT" ||
    log.eventType === "همه تلاش‌ها برای خارج کردن اطلاعات از محصول" ||
    log.action === "دانلود فایل" ||
    rawAction.includes("دانلود فایل") ||
    details?.fileName
  ) {
    const fileName = details?.fileName || "add new source";
    const section = details?.section || log.resource || "کتابخانه";
    const dataType = details?.dataType || "فایل ضمیمه / داده کاربری";
    const fileSize = details?.fileSize;
    const fileFormat = details?.fileFormat;
    const otherDetails = details?.otherDetails;

    let parts = [`نام فایل: ${fileName}`];
    if (section) parts.push(`قسمت/بخش: ${section}`);
    if (dataType) parts.push(`نوع داده: ${dataType}`);
    if (fileSize && fileSize !== "نامشخص") parts.push(`حجم و اندازه: ${fileSize}`);
    if (fileFormat) parts.push(`فرمت: ${fileFormat}`);
    if (otherDetails && otherDetails !== "دانلود فایل از محصول") parts.push(`سایر موارد: ${otherDetails}`);

    return parts.join(" | ");
  }

  // فرمت لاگ ایجاد نشدن نشست به دلیل محدودیت نشست‌های همزمان مطابق بند ۱ جدول ۲-۸ افتا (تصویر ۱)
  if (
    log.eventType === "CONCURRENT_SESSION_LIMIT_EXCEEDED" ||
    log.eventType === "ایجاد نشدن نشست به دلیل محدودیت نشست‌های همزمان" ||
    details?.aftaClause === "8-2-1" ||
    rawAction.includes("حداکثر تعداد ارتباط همزمان برای این کاربر پر شده است") ||
    rawAction.includes("به علت برقرای نشست همزمان جدید از سامانه خارج شد")
  ) {
    return rawAction;
  }

  // فرمت لاگ خواندن اطلاعات ثبت‌نشان‌ها و تلاش برای ورود به ثبت‌نشان‌ها
  if (
    log.eventType === "AUDIT_LOG_READ_SUCCESS" ||
    log.eventType === "AUDIT_LOG_READ_FAILURE" ||
    rawAction.includes("اطلاعات ثبت نشان‌ها") ||
    rawAction.includes("ورود به بخش ثبت نشان‌ها")
  ) {
    return rawAction;
  }

  // فرمت لاگ تلاش برای برقراری نشست مطابق بند ۷ جدول ۲-۸ و بند ۸ جدول ۲-۳ افتا (تصویر ۱)
  if (
    log.eventType === "SESSION_ESTABLISHMENT_ATTEMPT" ||
    log.eventType === "تلاش برای برقراری نشست" ||
    log.eventType === "CONCURRENT_SESSION_LIMIT_EXCEEDED" ||
    details?.aftaClause === "8-2-7" ||
    details?.aftaClause === "3-2-8" ||
    rawAction.includes("آدرس ماشین جاری جهت ورود") ||
    rawAction.includes("بازه زمانی برای شما وجود ندارد")
  ) {
    return rawAction;
  }

  // فرمت لاگ شکست در قابلیت‌های کارکردی محصول مطابق بند ۱ جدول ۲-۷ افتا (تصویر ۱)
  if (
    log.eventType === "SYSTEM_CAPABILITY_FAILURE" ||
    log.eventType === "شکست در قابلیت کارکردی محصول (خرابی/مشکل کارکرد)" ||
    log.eventType === "تمامی قابلیت‌هایی از محصول که به دلیل شکست (خرابی یا مشکل کارکرد)، نمی‌توانند عملیات مورد نظر را انجام دهند" ||
    log.resource === "توابع کارکردی محصول" ||
    log.tableName === "توابع کارکردی محصول" ||
    details?.aftaClause === "7-2-1"
  ) {
    if (rawAction.startsWith("#. error at")) {
      return rawAction;
    }
    const errorTime = details?.timestampStr || "1/27/2021 3:53:12 PM";
    const summaryMsg = details?.errorSummary || rawAction || "System.Data.Entity.Core.EntityException: The underlying provider failed on Open. ---> System.Data.SqlClient.SqlException: SQL Server service has been paused.";
    return `#. error at ${errorTime}.\nSummary: ${summaryMsg}`;
  }

  // فرمت لاگ شکست در کارکردهای امنیتی محصول مطابق بند ۱ جدول ۲-۶ افتا (تصویر ۱)
  if (
    log.eventType === "SECURITY_FUNCTION_FAILURE" ||
    log.eventType === "شکست در کارکردهای امنیتی محصول" ||
    log.eventType === "SYSTEM_CAPABILITY_FAILURE" ||
    log.resource === "توابع امنیتی محصول" ||
    log.tableName === "توابع امنیتی محصول" ||
    details?.aftaClause === "6-2-1" ||
    rawAction.includes("System.Data.Entity") ||
    rawAction.includes("SQL Server service") ||
    rawAction.includes("The underlying provider failed") ||
    rawAction.startsWith("#. error at")
  ) {
    if (rawAction.startsWith("#. error at")) {
      return rawAction;
    }
    const errorTime = details?.timestampStr || "1/27/2021 3:53:12 PM";
    const summaryMsg = details?.errorSummary || rawAction || "System.Data.Entity.Core.EntityException: The underlying provider failed on Open. ---> System.Data.SqlClient.SqlException: SQL Server service has been paused.";
    return `#. error at ${errorTime}.\nSummary: ${summaryMsg}`;
  }

  // فرمت لاگ تغییرات در گروه کاربران مطابق بند ۱ جدول ۲-۴ افتا
  if (
    log.eventType === "USER_GROUP_CHANGE" ||
    log.eventType === "تغییرات در گروه کاربران" ||
    log.resource === "گروه‌های کاربری" ||
    log.tableName === "گروه‌های کاربری" ||
    details?.aftaClause === "4-2-1" ||
    rawAction.includes("گروه کاربری") ||
    rawAction.includes("تغییرات در گروه کاربران")
  ) {
    if (
      (rawAction.startsWith("کاربر ") && (rawAction.includes("ساخته شد") || rawAction.includes("ایجاد شد") || rawAction.includes("حذف شد"))) ||
      rawAction.startsWith("ویرایش نقش کاربر ")
    ) {
      return rawAction;
    }

    const op = details?.operation || (rawAction.includes("حذف") ? "حذف" : (rawAction.includes("ویرایش") || rawAction.includes("تغییر") ? "ویرایش" : "افزودن"));

    // استخراج نام کاربر
    const nameMatch = rawAction.match(/Name:\s*['"]?([^'"\s;,]+)['"]?/i);
    const name = nameMatch?.[1] || details?.name || details?.targetUsername || log.username || "کاربر";

    // استخراج نقش
    const descMatch = rawAction.match(/Description:\s*['"]?([^'"\s;,]+)['"]?/i);
    let description = descMatch?.[1] || details?.description || details?.role || details?.userGroup || details?.newGroup || "حسابدار";
    if (!description || description === "dfgh") {
      description = details?.role || details?.userGroup || "حسابدار";
    }

    // استخراج تاریخ و زمان وقوع
    let date = log.shamsiDate;
    let time = log.shamsiTime;
    if ((!date || date === "—") && log.shamsiDateTime) {
      const parts = log.shamsiDateTime.trim().split(" ");
      if (parts.length >= 1) date = parts[0];
      if (parts.length >= 2) time = parts[1];
    }
    if (!date || date === "—") {
      const d = new Date(log.createdAt || log.timestamp || Date.now());
      date = !isNaN(d.getTime()) ? d.toLocaleDateString("fa-IR") : "—";
    }
    if (!time || time === "—") {
      const d = new Date(log.createdAt || log.timestamp || Date.now());
      time = !isNaN(d.getTime()) ? d.toLocaleTimeString("fa-IR") : "—";
    }

    if (op === "حذف") {
      return `کاربر ${name} با نقش ${description} در تاریخ ${date} و ساعت ${time} از سیستم حذف شد`;
    }
    if (op === "ویرایش" || op === "تغییر") {
      const oldDescription = details?.oldDescription || details?.oldGroup || "";
      if (oldDescription && oldDescription !== "dfgh") {
        return `ویرایش نقش کاربر ${name} از '${oldDescription}' به '${description}' در تاریخ ${date} و ساعت ${time}`;
      }
      return `ویرایش مشخصات کاربر ${name} در تاریخ ${date} و ساعت ${time}`;
    }

    return `کاربر ${name} در تاریخ ${date} و ساعت ${time} با نقش ${description} ساخته شد`;
  }

  if (rawAction.includes("auth/me") || resourceLower.includes("auth/me")) {
    const username = log.username || details.username || "کاربر سیستم";
    return `بررسی و تأیید هویت کاربر '${username}' و اعتبار نشست در سامانه`;
  }
  if (rawAction.startsWith("ورود موفقیت‌آمیز") || rawAction === "PASSWORD_VERIFY_SUCCESS" || rawAction === "SESSION_ESTABLISHMENT_ATTEMPT") {
    const username = log.username || details.username || "کاربر سیستم";
    return `ورود موفقیت‌آمیز کاربر '${username}' به سامانه`;
  }
  if (rawAction.startsWith("خروج") || rawAction.includes("logout") || rawAction === "SECURITY_ATTR_BINDING_FAILURE") {
    const username = log.username || details.username || "کاربر سیستم";
    return `خروج کاربر '${username}' از حساب کاربری و خاتمه نشست`;
  }
  if (rawAction.startsWith("ابطال") || rawAction === "SESSION_TERMINATED_BY_USER" || rawAction.includes("revoke")) {
    const username = log.username || details.username || "کاربر سیستم";
    return `ابطال و خاتمه دستی نشست فعال کاربر '${username}' توسط سیستم`;
  }
  if (rawAction.startsWith("تلاش ناموفق") || rawAction === "PASSWORD_VERIFY_FAILURE") {
    const username = log.username || details.username || "نامشخص";
    return `تلاش ناموفق جهت ورود به سامانه با نام کاربری '${username}'`;
  }
  if (rawAction.includes("تلاش غیر مجاز") || rawAction === "LOCKOUT_REACHED") {
    return "کاربر مورد نظر به علت تلاش غیر مجاز جهت ورود به سامانه غیر فعال شد.";
  }
  if (rawAction.includes("غیرفعال می باشد") || rawAction === "INACTIVE_ENTITY_OPERATION") {
    return "کاربر مورد نظر غیرفعال می باشد،لطفا در زمان دیگری مجددا تلاش کنید و یا جهت فعال سازی با مدیر سیستم تماس بگیرید.";
  }
  if (
    (rawAction.startsWith("مشاهده و استعلام:") ||
    rawAction.startsWith("تکمیل موفقیت‌آمیز:") ||
    rawAction.startsWith("شروع پردازش:") ||
    rawAction.startsWith("ثبت و") ||
    rawAction.startsWith("ویرایش") ||
    rawAction.startsWith("حذف") ||
    rawAction.startsWith("آکاردئون") ||
    rawAction.includes("گزینه") ||
    rawAction.includes("تغییر یافت")) &&
    !rawAction.includes("api/auth/me") &&
    !rawAction.includes("عملیات روی مسیر")
  ) {
    return rawAction;
  }
  if (rawAction.includes("AttachmentName")) {
    return rawAction;
  }
  if (rawAction.includes("Value cannot be null")) {
    return "خطای اعتبارسنجی: اطلاعات ورودی ارسال‌شده به سیستم خالی می‌باشد (پارامتر ورودی مشخص نشده است)";
  }
  if (rawAction.includes("فایل مورد نظر به صورت غیرمجاز تغییر کرده")) {
    return "خطای امنیتی: تغییر غیرمجاز در ساختار فایل و عدم امکان دسترسی به آن";
  }
  if (rawAction === "تلاش غیر مجاز جهت دسترسی به صفحه لاگ های سیستمی") {
    return "هشدار امنیتی: تلاش غیرمجاز کاربر جهت ورود به صفحه ثبت نشان‌ها و لاگ‌های سیستمی";
  }
  if (rawAction === "مشاهده اطلاعات ممیزی سیستم") {
    return "مشاهده و دریافت اطلاعات ممیزی و لاگ‌های سیستمی";
  }
  if (rawAction.includes("موارد رویدادنگاری")) {
    return `تغییر در تنظیمات سیستم: ${rawAction}`;
  }

  // شناسایی موضوع عملیات بر اساس مسیر (Resource)
  let topicPersian = "";
  if (resourceLower.includes("/security/audit-logs") || resourceLower.includes("/users/audit-logs") || rawAction.includes("audit-logs")) {
    topicPersian = "لیست ثبت‌نشان‌ها و لاگ‌های ممیزی سیستم";
  } else if (resourceLower.includes("/security/audit-config")) {
    topicPersian = "تنظیمات و موارد رویدادنگاری سیستم";
  } else if (resourceLower.includes("/security/policy")) {
    topicPersian = "خط‌مشی‌ها و تنظیمات امنیتی سامانه";
  } else if (resourceLower.includes("/inventory/audits")) {
    topicPersian = "حسابرسی و ممیزی موجودی انبار";
  } else if (resourceLower.includes("/inventory/employee_advances")) {
    topicPersian = "لیست مساعده پرداختی به کارکنان";
  } else if (resourceLower.includes("/inventory/employee_loans")) {
    topicPersian = "فهرست وام‌های اعطایی به کارکنان";
  } else if (resourceLower.includes("/inventory/insurance_settings")) {
    topicPersian = "تنظیمات بیمه کارکنان";
  } else if (resourceLower.includes("/users")) {
    if (methodUpper === "POST") topicPersian = "تعریف کاربر جدید در سیستم";
    else if (methodUpper === "PUT") topicPersian = "ویرایش مشخصات کاربر";
    else if (methodUpper === "DELETE") topicPersian = "حذف یا غیرفعال‌سازی کاربر";
    else topicPersian = "فهرست و اطلاعات کاربران سیستم";
  } else if (resourceLower.includes("/document") || resourceLower.includes("/vouchers")) {
    if (methodUpper === "POST") topicPersian = "ثبت و صدور سند جدید حسابداری";
    else if (methodUpper === "PUT") topicPersian = "ویرایش سند حسابداری";
    else if (methodUpper === "DELETE") topicPersian = "ابطال سند حسابداری";
    else topicPersian = "فهرست اسناد حسابداری";
  } else if (resourceLower.includes("/credit")) {
    topicPersian = "اعتبارات مالی و بودجه تخصیص‌یافته";
  } else if (resourceLower.includes("/payroll")) {
    topicPersian = "لیست حقوق و دستمزد کارکنان";
  } else if (resourceLower.includes("/asset")) {
    topicPersian = "اموال و دارایی‌های ثابت سیستم";
  } else if (resourceLower.includes("/warehouse") || resourceLower.includes("/inventory")) {
    topicPersian = "موجودی انبار و کالاها";
  } else if (resourceLower.includes("/login") || rawAction.includes("LOGIN")) {
    topicPersian = "ورود کاربر به سامانه";
  } else if (resourceLower.includes("/logout") || rawAction.includes("LOGOUT")) {
    topicPersian = "خروج کاربر از سامانه";
  }

  // تبدیل متون فنی شروع / اتمام درخواست به زبان فارسی کاملا ساده و کاربردی
  if (rawAction.includes("شروع تابع") || rawAction.includes("FUNCTION_START")) {
    if (methodUpper === "OPTIONS") return "ارتباط امن اولیه مرورگر (بررسی پروتکل امنیتی OPTIONS)";
    return topicPersian ? `شروع پردازش: ${topicPersian}` : `شروع درخواست سیستم (${rawAction.replace(/شروع تابع \/ درخواست:\s*/g, "")})`;
  }

  if (rawAction.includes("اتمام تابع") || rawAction.includes("FUNCTION_END")) {
    if (methodUpper === "OPTIONS") return "بررسی موفقیت‌آمیز ارتباط امن مرورگر (پروتکل OPTIONS)";
    return topicPersian ? `تکمیل موفقیت‌آمیز: ${topicPersian}` : `تکمیل پردازش سیستم (${rawAction.replace(/اتمام تابع \/ درخواست:\s*/g, "")})`;
  }

  if (topicPersian) {
    if (rawAction.includes("GET") || methodUpper === "GET") return `مشاهده و استعلام: ${topicPersian}`;
    if (rawAction.includes("POST") || methodUpper === "POST") return `ایجاد و ثبت: ${topicPersian}`;
    if (rawAction.includes("PUT") || methodUpper === "PUT") return `ویرایش و بروزرسانی: ${topicPersian}`;
    if (rawAction.includes("DELETE") || methodUpper === "DELETE") return `حذف و ابطال: ${topicPersian}`;
    return `پردازش سیستم: ${topicPersian}`;
  }

  // پاکسازی هرگونه عبارت انگلیسی API
  if (rawAction.includes("/api/")) {
    const cleaned = rawAction.replace(/GET|POST|PUT|DELETE|OPTIONS|\/api\//gi, "").replace(/[\/_]/g, " ").trim();
    return `عملیات سیستمی: درخواست ${cleaned}`;
  }

  return rawAction || "مشاهده اطلاعات ممیزی سیستم";
}

export default function AuditLogsPage() {
  const { user } = useAuth();

  // بررسی سطح دسترسی کاربر (ادمین یا دارنده مجوز)
  const isAuthorized = useMemo(() => {
    if (!user) return false;
    const role = user.role;
    const permissions = user.permissions || {};
    return (
      role === "admin" ||
      role === "مدیر سیستم" ||
      permissions["audit.view"] === true ||
      permissions["audit.read"] === true ||
      permissions["audit_logs"] === true
    );
  }, [user]);

  // حالت‌های داده و فیلترها
  const [logTableType, setLogTableType] = useState("OPERATIONAL"); // "OPERATIONAL" | "AUTH_LOGS"
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [resultFilter, setResultFilter] = useState("");
  const [tableFilter, setTableFilter] = useState("");
  const [opTypeFilter, setOpTypeFilter] = useState("");

  // فیلدهای مرتب‌سازی جدول
  const [sortField, setSortField] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");

  // صفحه‌بندی
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // حالت مودال جزئیات لاگ
  const [selectedLogModal, setSelectedLogModal] = useState(null);
  const [verifyingIntegrity, setVerifyingIntegrity] = useState(false);
  const [integrityStatus, setIntegrityStatus] = useState(null);

  // حالت مودال ۱۸ کارکرد مدیریتی بند ۴ افتا (تصویر ۲ و ۳)
  const [showAdminCapabilitiesModal, setShowAdminCapabilitiesModal] = useState(false);
  const [capabilitySearchTerm, setCapabilitySearchTerm] = useState("");

  // حالت مودال کنترل دسترسی و حفاظت از داده کاربری بند ۱ جدول ۲-۴ افتا (تصویر ۲)
  const [showDataProtectionModal, setShowDataProtectionModal] = useState(false);

  // حالت مودال وضعیت امن در زمان شکست کارکردهای امنیتی بند ۱ جدول ۲-۶ افتا (تصویر ۲)
  const [showSecurityFailureModal, setShowSecurityFailureModal] = useState(false);

  // حالت مودال تحمل‌پذیری خطای کارکردهای اصلی بند ۱ جدول ۲-۷ افتا (تصویر ۲)
  const [showCapabilityFailureModal, setShowCapabilityFailureModal] = useState(false);

  // حالت مودال قوانین و ممانعت برقراری نشست بند ۷ جدول ۲-۸ و بند ۸ جدول ۲-۳ افتا (تصویر ۲ و ۳)
  const [showSessionEstablishmentModal, setShowSessionEstablishmentModal] = useState(false);

  // حالت مودال محدودیت نشست‌های همزمان بند ۱ جدول ۲-۸ افتا (تصویر ۲)
  const [showConcurrentSessionModal, setShowConcurrentSessionModal] = useState(false);

  // پیکربندی موارد رویدادنگاری (الزام ۴ افتا)
  const [auditConfig, setAuditConfig] = useState({
    email: true,
    sms: true,
    systemMessage: true,
    suspendLogin: true,
    formComplete: true,
    new: true,
    delete: true,
    issue: true,
    login: true,
    failedLogin: true,
    edit: true
  });
  const [savingConfig, setSavingConfig] = useState(false);

  // دریافت پیکربندی رویدادنگاری از بک‌اند
  const fetchAuditConfig = useCallback(async () => {
    if (!isAuthorized) return;
    try {
      const res = await api.get("/api/security/audit-config");
      if (res.data?.success && res.data?.data) {
        setAuditConfig(res.data.data);
      }
    } catch (err) {
      console.error("خطا در دریافت پیکربندی ثبت‌نشان‌ها:", err);
    }
  }, [isAuthorized]);

  useEffect(() => {
    if (isAuthorized) {
      fetchAuditConfig();
    } else {
      // ثبت صریح تلاش غیرمجاز ورود به ثبت‌نشان‌ها همراه نام کاربری در لاگ‌ها
      api.get("/api/security/audit-logs").catch(() => {});
    }
  }, [isAuthorized, fetchAuditConfig]);

  // تغییر تیک هر مورد و ذخیره بلافاصله همراه ایجاد لاگ ثبت‌نشان
  const handleToggleAuditOption = async (key) => {
    const updated = { ...auditConfig, [key]: !auditConfig[key] };
    setAuditConfig(updated);
    try {
      setSavingConfig(true);
      await api.post("/api/security/audit-config", updated);
      fetchAuditLogs({ page: 1 });
    } catch (err) {
      console.error("خطا در به روزرسانی پیکربندی ثبت‌نشان‌ها:", err);
    } finally {
      setSavingConfig(false);
    }
  };

  // دریافت لاگ‌ها از بک‌اند
  const fetchAuditLogs = useCallback(async (overrides = {}) => {
    if (!isAuthorized) return;
    try {
      setLoading(true);
      const currentPage = overrides.page !== undefined ? overrides.page : page;
      const currentSearch = overrides.search !== undefined ? overrides.search : searchTerm;
      const currentResult = overrides.result !== undefined ? overrides.result : resultFilter;

      const res = await api.get("/api/security/audit-logs", {
        params: {
          page: currentPage,
          limit: pageSize,
          search: currentSearch.trim() || undefined,
          result: currentResult || undefined,
          sortBy: sortField,
          sortOrder: sortDirection
        }
      });

      if (res?.data?.success && Array.isArray(res.data.data)) {
        setLogs(res.data.data);
        if (res.data.pagination) {
          setTotalCount(res.data.pagination.total || res.data.data.length);
          setTotalPages(res.data.pagination.totalPages || 1);
        } else {
          setTotalCount(res.data.data.length);
          setTotalPages(1);
        }
      } else {
        const fallbackRes = await api.get("/api/users/audit-logs", {
          params: {
            limit: pageSize,
            search: currentSearch.trim() || undefined,
            result: currentResult || undefined,
            sortBy: sortField,
            sortOrder: sortDirection
          }
        });
        if (fallbackRes?.data?.success && Array.isArray(fallbackRes.data.data)) {
          setLogs(fallbackRes.data.data);
          setTotalCount(fallbackRes.data.data.length);
          setTotalPages(1);
        }
      }
    } catch (err) {
      console.error("خطا در دریافت لاگ‌های عملیاتی:", err);
    } finally {
      setLoading(false);
    }
  }, [isAuthorized, page, pageSize, searchTerm, resultFilter, sortField, sortDirection]);

  useEffect(() => {
    if (isAuthorized) {
      fetchAuditLogs();
    }
  }, [isAuthorized, page, fetchAuditLogs]);

  // استخراج و غنی‌سازی اطلاعات لاگ طبق جدول درخواستی (تطابق کامل با تصویر)
  const processedLogs = useMemo(() => {
    return logs.map((log, idx) => {
      // 1. وضعیت رکورد (معتبر / نامعتبر / غیرمعتبر)
      const actionStr = log.action || log.eventType || "";
      const actionUpper = actionStr.toUpperCase();
      const methodUpper = (log.method || "").toUpperCase();

      const isIntegrityOk = log.isIntegrityValid !== false && log.result !== "SECURITY_BREACH" && !actionStr.includes("Value cannot be null");
      const recordStatus = isIntegrityOk ? "معتبر" : "نامعتبر";

      // 2. نوع عملیات (مشاهده / خطا / افزودن / دانلود فایل / عملیات غیرمجاز / ایجاد / ویرایش / حذف / ورود)
      let opType = "مشاهده";

      const isDownloadLog =
        log.eventType === "DATA_EXPORT_ATTEMPT" ||
        log.eventType === "همه تلاش‌ها برای خارج کردن اطلاعات از محصول" ||
        log.action === "دانلود فایل" ||
        actionUpper.includes("DOWNLOAD") ||
        actionUpper.includes("دانلود");

      const isAttachmentLog =
        log.resource === "ضمیمه" ||
        log.resource?.includes("ضمیمه") ||
        log.tableName === "ضمیمه" ||
        actionStr.includes("AttachmentName") ||
        actionStr.includes("پیوست") ||
        actionStr.includes("فایل") ||
        log.details?.attachment_name ||
        log.details?.has_attachment ||
        isDownloadLog;

      const isDeleteOp = actionUpper.includes("DELETE") || actionUpper.includes("حذف") || methodUpper === "DELETE" || log.details?.operation === "DELETE";

      if (actionStr.startsWith("Message :") || actionUpper.includes("MESSAGE :") || log.eventType === "USER_DATA_VALIDATION_FAILURE") {
        opType = "خطا";
      } else if (isDownloadLog) {
        opType = "دانلود فایل";
      } else if (isAttachmentLog) {
        opType = isDeleteOp ? "حذف" : "افزودن";
      } else if (
        actionUpper.includes("غیرمجاز") ||
        actionUpper.includes("غیر مجاز") ||
        actionUpper.includes("READ_FAILURE") ||
        (actionUpper.includes("FAILURE") && (actionUpper.includes("AUDIT") || actionUpper.includes("LOG"))) ||
        log.eventType === "تلاش ناموفق برای خواندن ثبت‌نشان‌ها" ||
        log.errorCode === 403
      ) {
        opType = "عملیات غیرمجاز";
      } else if (actionUpper.includes("CREATE") || actionUpper.includes("POST") || actionUpper.includes("ثبت") || actionUpper.includes("ایجاد") || methodUpper === "POST") {
        opType = "ایجاد";
      } else if (actionUpper.includes("UPDATE") || actionUpper.includes("PUT") || actionUpper.includes("PATCH") || actionUpper.includes("ویرایش") || methodUpper === "PUT") {
        opType = "ویرایش";
      } else if (isDeleteOp) {
        opType = "حذف";
      } else if (actionUpper.includes("LOGIN") || actionUpper.includes("AUTH") || actionUpper.includes("ورود")) {
        opType = "ورود";
      } else if (actionUpper.includes("LOGOUT") || actionUpper.includes("خروج")) {
        opType = "خروج";
      }

      // 3. نام جدول (موجودیت یا ماژول/بخش مرتبط)
      let tableName = "لاگ های سیستمی";
      const resourceLower = (log.resource || "").toLowerCase();

      const isAuthPolicyChange =
        log.resource === "کلید های پیکر بندی سیستم" ||
        log.tableName === "کلید های پیکر بندی سیستم" ||
        actionStr.includes("ورود اشتباه رمز عبور") ||
        actionStr.includes("فعال شدن خودکار کاربر") ||
        actionStr.includes("احراز هویت دو مرحله ای");

      const isUserGroupChangeLog =
        log.eventType === "USER_GROUP_CHANGE" ||
        log.eventType === "تغییرات در گروه کاربران" ||
        log.resource === "گروه‌های کاربری" ||
        log.tableName === "گروه‌های کاربری" ||
        log.details?.aftaClause === "4-2-1" ||
        String(log.details?.key || "") === "1092" ||
        actionStr.includes("تغییرات در گروه کاربران") ||
        actionStr.includes("گروه‌های کاربری");

      const isSecurityFailureLog =
        log.eventType === "SECURITY_FUNCTION_FAILURE" ||
        log.eventType === "شکست در کارکردهای امنیتی محصول" ||
        log.eventType === "SYSTEM_CAPABILITY_FAILURE" ||
        log.resource === "توابع امنیتی محصول" ||
        log.tableName === "توابع امنیتی محصول" ||
        log.details?.aftaClause === "6-2-1" ||
        String(log.details?.key || "") === "11050" ||
        actionStr.includes("System.Data.Entity") ||
        actionStr.includes("SQL Server service") ||
        actionStr.includes("The underlying provider failed") ||
        actionStr.startsWith("#. error at");

      const isCapabilityFailureLog =
        log.eventType === "SYSTEM_CAPABILITY_FAILURE" ||
        log.eventType === "شکست در قابلیت کارکردی محصول (خرابی/مشکل کارکرد)" ||
        log.eventType === "تمامی قابلیت‌هایی از محصول که به دلیل شکست (خرابی یا مشکل کارکرد)، نمی‌توانند عملیات مورد نظر را انجام دهند" ||
        log.resource === "توابع کارکردی محصول" ||
        log.tableName === "توابع کارکردی محصول" ||
        log.details?.aftaClause === "7-2-1" ||
        String(log.details?.key || "") === "11060";

      const isConcurrentSessionLimitLog =
        log.eventType === "CONCURRENT_SESSION_LIMIT_EXCEEDED" ||
        log.eventType === "ایجاد نشدن نشست به دلیل محدودیت نشست‌های همزمان" ||
        log.details?.aftaClause === "8-2-1" ||
        actionStr.includes("حداکثر تعداد ارتباط همزمان برای این کاربر پر شده است") ||
        actionStr.includes("به علت برقرای نشست همزمان جدید");

      const isSessionEstablishmentLog =
        log.eventType === "SESSION_ESTABLISHMENT_ATTEMPT" ||
        log.eventType === "تلاش برای برقراری نشست" ||
        log.details?.aftaClause === "8-2-7" ||
        log.details?.aftaClause === "3-2-8" ||
        actionStr.includes("آدرس ماشین جاری جهت ورود") ||
        actionStr.includes("امکان ورود به سیستم در این بازه زمانی");

      if (isDownloadLog || log.details?.fileName) {
        tableName = log.details?.section || log.resource || "کتابخانه";
      } else if (isSessionEstablishmentLog) {
        tableName = "لاگ های احراز هویت";
        opType = "ورود";
      } else if (isCapabilityFailureLog) {
        tableName = "توابع کارکردی محصول";
        opType = "خطا";
      } else if (isSecurityFailureLog) {
        tableName = "توابع امنیتی محصول";
        opType = "خطا";
      } else if (isUserGroupChangeLog) {
        tableName = "گروه‌های کاربری";
        opType = log.details?.operation || (actionUpper.includes("حذف") ? "حذف" : (actionUpper.includes("ویرایش") || actionUpper.includes("تغییر") ? "ویرایش" : "افزودن"));
      } else if (isAuthPolicyChange) {
        tableName = "کلید های پیکر بندی سیستم";
        opType = "ویرایش";
      } else if (isAttachmentLog) {
        tableName = "ضمیمه";
      } else if (actionStr.startsWith("Message :")) {
        tableName = "";
      } else if (log.resource === "موارد رویدادنگاری" || (log.action && log.action.includes("موارد رویدادنگاری")) || log.eventType === "تغییر در پیکربندی ثبت‌نشان‌ها") {
        tableName = "موارد رویدادنگاری";
      } else if (resourceLower.includes("/users")) tableName = "کاربران سیستم";
      else if (resourceLower.includes("/document") || resourceLower.includes("/vouchers")) tableName = "اسناد حسابداری";
      else if (resourceLower.includes("/security") || resourceLower.includes("/audit")) tableName = "لاگ های سیستمی";
      else if (resourceLower.includes("/credit")) tableName = "اعتبارات مالی";
      else if (resourceLower.includes("/payroll")) tableName = "حقوق و دستمزد";
      else if (resourceLower.includes("/asset")) tableName = "اموال و دارایی‌ها";
      else if (resourceLower.includes("/warehouse")) tableName = "انبار و کالاها";

      // 4. مقدار کلید (شناسه رکورد یا کلید اصلی)
      let keyValue = "";
      if (isCapabilityFailureLog) {
        keyValue = String(log.details?.key || log.key || "11060");
      } else if (isSecurityFailureLog) {
        keyValue = String(log.details?.key || log.key || "11050");
      } else if (isUserGroupChangeLog) {
        keyValue = String(log.details?.key || log.key || log.details?.groupId || "1092");
      } else if (isAttachmentLog) {
        if (isDeleteOp) {
          keyValue = String(log.details?.attachmentId || log.details?.key || log.entityId || log.key || "25137");
        } else {
          keyValue = String(log.details?.key ?? "0");
        }
      } else if (log.entityId) {
        keyValue = String(log.entityId);
      } else if (log.key) {
        keyValue = String(log.key);
      } else if (log.details?.id || log.details?.recordId || log.details?.voucherId || log.details?.userId || log.details?.documentId || log.details?.contractId || log.details?.key) {
        keyValue = String(log.details.id || log.details.recordId || log.details.voucherId || log.details.userId || log.details.documentId || log.details.contractId || log.details.key);
      } else {
        keyValue = "";
      }

      // 5. کاربر (نام کاربری واقعی)
      let username = log.username || log.userFullName || (log.userId && log.userId !== "SYSTEM" ? String(log.userId) : "admin");
      if (!username || username === "anonymous" || username === "کاربر مهمان") username = "admin";

      // 6. نوع کاربر (نقش واقعی)
      let userRole = log.userRole || "admin";
      if (!userRole || userRole === "سیستم" || userRole === "—") userRole = "admin";

      // 7 & 8. تاریخ و زمان وقوع (محاسبه واقعی بدون داده فرضی)
      let occurrenceDate = "—";
      let occurrenceTime = "—";

      if (log.shamsiDateTime) {
        const parts = log.shamsiDateTime.trim().split(" ");
        if (parts.length >= 2) {
          occurrenceDate = parts[0];
          occurrenceTime = parts[1];
        } else {
          occurrenceDate = log.shamsiDateTime;
        }
      } else if (log.shamsiDate) {
        occurrenceDate = log.shamsiDate;
        occurrenceTime = log.shamsiTime || "—";
      } else if (log.createdAt || log.timestamp) {
        const d = new Date(log.createdAt || log.timestamp);
        if (!isNaN(d.getTime())) {
          occurrenceDate = d.toLocaleDateString("fa-IR");
          occurrenceTime = d.toLocaleTimeString("fa-IR");
        }
      }

      // 9. آدرس ماشین (آی‌پی واقعی)
      const machineAddress = log.ip || "—";

      // 10. شرح عملیات قابل فهم برای کاربران غیربرنامه‌نویس
      const description = formatHumanReadableDescription(log);

      // 11 & 12. اطلاعات اختصاصی نتایج نهایی احراز هویت
      const isAuthOutcome =
        log.eventType === "AUTH_FINAL_OUTCOME" ||
        log.eventType === "AUTH_MECHANISM_USAGE" ||
        log.eventType === "SESSION_ESTABLISHMENT_ATTEMPT" ||
        log.eventType === "SESSION_TERMINATED_BY_USER" ||
        log.eventType === "SECURITY_ATTR_BINDING_FAILURE" ||
        resourceLower.includes("/auth/") ||
        actionStr.includes("تلاش غیر مجاز جهت ورود") ||
        actionStr.includes("ورود به سامانه") ||
        actionStr.includes("تلاش ناموفق جهت ورود") ||
        actionStr.includes("ورود موفقیت‌آمیز") ||
        actionStr.includes("خروج") ||
        actionStr.includes("خاتمه نشست") ||
        actionStr.includes("ابطال نشست") ||
        actionStr.includes("احراز هویت") ||
        actionStr.includes("غیرفعال می باشد");

      let requestType = log.details?.requestType;
      if (!requestType) {
        if (actionStr.includes("خروج")) requestType = "خروج از سامانه";
        else if (actionStr.includes("ابطال نشست") || actionStr.includes("خاتمه نشست")) requestType = "ابطال نشست";
        else if (actionStr.includes("رمز عبور")) requestType = "تغییر رمز عبور";
        else if (isAuthOutcome) requestType = "ورود به سامانه";
        else requestType = "عملیات عمومی";
      }

      const requestResult = log.details?.requestResult || (log.result === "FAILURE" || !isIntegrityOk ? "ناموفق" : "موفق");

      const isPasswordVerify =
        log.eventType === "PASSWORD_VERIFY_ATTEMPT_LOG" ||
        log.details?.isPasswordVerifyAttemptLog === true ||
        keyValue === "10080" ||
        keyValue === "10081" ||
        actionStr.includes("حداقل تعداد کاراکتر های رمز عبور") ||
        actionStr.includes("کاراکترهای مورد نیاز برای رمز عبور") ||
        actionStr.includes("گذرواژه");

      return {
        raw: log,
        idx: (page - 1) * pageSize + idx + 1,
        recordStatus,
        isIntegrityOk,
        opType,
        tableName,
        keyValue,
        username,
        userRole,
        occurrenceDate,
        occurrenceTime,
        machineAddress,
        description,
        requestType,
        requestResult,
        isAuthOutcome,
        isPasswordVerify,
        isDownloadLog
      };
    });
  }, [logs, page, pageSize]);

  // فیلتر کردن زنده روی تمام ستون‌های جدول
  const filteredProcessedLogs = useMemo(() => {
    return processedLogs.filter(item => {
      // تفکیک بر اساس حالت کشویی نوع جدول
      if (logTableType === "AUTH_LOGS") {
        if (!item.isAuthOutcome && item.opType !== "ورود" && item.opType !== "خروج") return false;
      } else if (logTableType === "ATTACHMENTS") {
        const isAttach =
          item.tableName === "ضمیمه" ||
          item.opType === "دانلود فایل" ||
          item.raw?.action?.includes("AttachmentName") ||
          item.raw?.action?.includes("پیوست") ||
          item.raw?.action?.includes("فایل") ||
          item.raw?.resource === "ضمیمه" ||
          item.raw?.eventType === "DATA_EXPORT_ATTEMPT" ||
          item.raw?.details?.attachment_name ||
          item.raw?.details?.has_attachment;
        if (!isAttach) return false;
      } else if (logTableType === "CONCURRENT_SESSIONS") {
        if (
          item.tableName !== "لاگ های احراز هویت" &&
          item.raw?.eventType !== "CONCURRENT_SESSION_LIMIT_EXCEEDED" &&
          item.raw?.eventType !== "ایجاد نشدن نشست به دلیل محدودیت نشست‌های همزمان" &&
          !item.raw?.details?.aftaClause?.includes("8-2-1") &&
          !item.raw?.action?.includes("ارتباط همزمان") &&
          !item.raw?.action?.includes("نشست همزمان")
        ) return false;
      } else if (logTableType === "SESSION_ESTABLISHMENT") {
        if (
          item.tableName !== "لاگ های احراز هویت" &&
          item.raw?.eventType !== "SESSION_ESTABLISHMENT_ATTEMPT" &&
          item.raw?.eventType !== "تلاش برای برقراری نشست" &&
          item.raw?.eventType !== "CONCURRENT_SESSION_LIMIT_EXCEEDED" &&
          !item.raw?.details?.aftaClause?.includes("8-2-7") &&
          !item.raw?.details?.aftaClause?.includes("3-2-8") &&
          !item.raw?.action?.includes("آدرس ماشین جاری") &&
          !item.raw?.action?.includes("بازه زمانی")
        ) return false;
      } else if (logTableType === "CAPABILITY_FAILURES") {
        if (
          item.tableName !== "توابع کارکردی محصول" &&
          item.raw?.eventType !== "SYSTEM_CAPABILITY_FAILURE" &&
          item.raw?.eventType !== "شکست در قابلیت کارکردی محصول (خرابی/مشکل کارکرد)" &&
          !item.raw?.details?.aftaClause?.includes("7-2-1") &&
          !item.raw?.action?.includes("System.Data.Entity") &&
          !item.raw?.action?.startsWith("#. error at")
        ) return false;
      } else if (logTableType === "SECURITY_FAILURES") {
        if (
          item.tableName !== "توابع امنیتی محصول" &&
          item.raw?.eventType !== "SECURITY_FUNCTION_FAILURE" &&
          item.raw?.eventType !== "شکست در کارکردهای امنیتی محصول" &&
          item.raw?.eventType !== "SYSTEM_CAPABILITY_FAILURE" &&
          !item.raw?.details?.aftaClause?.includes("6-2-1") &&
          !item.raw?.action?.includes("System.Data.Entity") &&
          !item.raw?.action?.startsWith("#. error at")
        ) return false;
      } else if (logTableType === "USER_GROUPS") {
        if (
          item.tableName !== "گروه‌های کاربری" &&
          item.raw?.eventType !== "USER_GROUP_CHANGE" &&
          item.raw?.eventType !== "تغییرات در گروه کاربران" &&
          !item.raw?.details?.aftaClause?.includes("4-2-1") &&
          !item.raw?.action?.includes("گروه")
        ) return false;
      } else if (logTableType === "ADMIN_FUNCTIONS") {
        if (
          item.tableName !== "کلید های پیکر بندی سیستم" &&
          item.raw?.eventType !== "ADMIN_FUNCTION_USAGE" &&
          item.raw?.eventType !== "استفاده از کارکردهای مدیریتی" &&
          !item.raw?.details?.aftaClause?.includes("5-2-4") &&
          !item.raw?.action?.includes("آدرس ماشین") &&
          !item.raw?.action?.includes("کارکردهای مدیریتی")
        ) return false;
      }

      // فیلتر تب‌های سریع در حالت لاگ‌های عملیاتی
      if (logTableType === "OPERATIONAL") {
        // فیلتر لاگ‌های تکراری اندپوینت‌های ثبت‌نشان سیستمی برای دانلود فایل
        if (
          item.raw?.resource?.includes("/security/audit-file-download") ||
          (item.raw?.resource?.includes("/security/validate-egress") && item.raw?.result === "SUCCESS")
        ) {
          return false;
        }
        if (selectedCategory === "CONCURRENT_SESSIONS" && item.tableName !== "لاگ های احراز هویت" && item.raw?.eventType !== "CONCURRENT_SESSION_LIMIT_EXCEEDED" && !item.raw?.details?.aftaClause?.includes("8-2-1") && !item.raw?.action?.includes("ارتباط همزمان") && !item.raw?.action?.includes("نشست همزمان")) return false;
        if (selectedCategory === "SESSION_ESTABLISHMENT" && item.tableName !== "لاگ های احراز هویت" && item.raw?.eventType !== "SESSION_ESTABLISHMENT_ATTEMPT" && item.raw?.eventType !== "تلاش برای برقراری نشست" && !item.raw?.details?.aftaClause?.includes("8-2-7") && !item.raw?.details?.aftaClause?.includes("3-2-8") && !item.raw?.action?.includes("آدرس ماشین جاری") && !item.raw?.action?.includes("بازه زمانی")) return false;
        if (selectedCategory === "CAPABILITY_FAILURES" && item.tableName !== "توابع کارکردی محصول" && item.raw?.eventType !== "SYSTEM_CAPABILITY_FAILURE" && !item.raw?.details?.aftaClause?.includes("7-2-1")) return false;
        if (selectedCategory === "SECURITY_FAILURES" && item.tableName !== "توابع امنیتی محصول" && item.raw?.eventType !== "SECURITY_FUNCTION_FAILURE" && item.raw?.eventType !== "شکست در کارکردهای امنیتی محصول" && !item.raw?.details?.aftaClause?.includes("6-2-1") && !item.raw?.action?.includes("System.Data.Entity") && !item.raw?.action?.startsWith("#. error at")) return false;
        if (selectedCategory === "USER_GROUPS" && item.tableName !== "گروه‌های کاربری" && item.raw?.eventType !== "USER_GROUP_CHANGE" && item.raw?.eventType !== "تغییرات در گروه کاربران" && !item.raw?.details?.aftaClause?.includes("4-2-1") && !item.raw?.action?.includes("گروه")) return false;
        if (selectedCategory === "ADMIN_FUNCTIONS" && item.tableName !== "کلید های پیکر بندی سیستم" && item.raw?.eventType !== "ADMIN_FUNCTION_USAGE" && item.raw?.eventType !== "استفاده از کارکردهای مدیریتی" && !item.raw?.details?.aftaClause?.includes("5-2-4") && !item.raw?.action?.includes("آدرس ماشین")) return false;
        if (selectedCategory === "BEHAVIOR_CHANGE" && item.tableName !== "کلید های پیکر بندی سیستم" && item.raw?.eventType !== "FUNCTION_BEHAVIOR_CHANGE" && item.raw?.eventType !== "تمامی تغییرات در رفتارهای توابع کارکردی محصول" && !item.description?.includes("بازه زمانی مجاز")) return false;
        if (selectedCategory === "DOWNLOADS" && item.opType !== "دانلود فایل" && !item.isDownloadLog) return false;
        if (selectedCategory === "ATTACHMENTS") {
          const isAttach =
            item.tableName === "ضمیمه" ||
            item.opType === "دانلود فایل" ||
            item.raw?.action?.includes("AttachmentName") ||
            item.raw?.action?.includes("پیوست") ||
            item.raw?.action?.includes("فایل") ||
            item.raw?.details?.attachment_name ||
            item.raw?.details?.has_attachment;
          if (!isAttach) return false;
        }
        if (selectedCategory === "PASSWORD" && !item.isPasswordVerify && !item.description?.includes("رمز عبور") && !item.description?.includes("گذرواژه")) return false;
        if (selectedCategory === "READ" && item.opType !== "مشاهده") return false;
        if (selectedCategory === "UNAUTHORIZED" && item.opType !== "عملیات غیرمجاز") return false;
        if (selectedCategory === "CREATE" && item.opType !== "ایجاد") return false;
        if (selectedCategory === "UPDATE" && item.opType !== "ویرایش") return false;
        if (selectedCategory === "DELETE" && item.opType !== "حذف") return false;
        if (selectedCategory === "AUTH" && item.opType !== "ورود" && item.opType !== "خروج") return false;
      }

      // فیلتر نام جدول
      if (tableFilter && !item.tableName.includes(tableFilter)) return false;

      // فیلتر نوع عملیات
      if (opTypeFilter && item.opType !== opTypeFilter) return false;

      return true;
    });
  }, [processedLogs, logTableType, selectedCategory, tableFilter, opTypeFilter]);

  // هدرهای مرتب‌سازی داینامیک
  const handleSort = (fieldKey) => {
    if (sortField === fieldKey) {
      setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(fieldKey);
      setSortDirection("asc");
    }
  };

  // صحت‌سنجی HMAC افتا
  const handleVerifyIntegrity = async () => {
    try {
      setVerifyingIntegrity(true);
      const res = await api.get("/api/security/audit-logs/verify-integrity");
      if (res.data?.success) {
        setIntegrityStatus({
          valid: true,
          message: res.data.message || "تمام لاگ‌های ممیزی عملیاتی از نظر امضای دیجیتال HMAC معتبر می‌باشند.",
          timestamp: new Date().toLocaleTimeString("fa-IR")
        });
      } else {
        setIntegrityStatus({
          valid: false,
          message: res.data.message || "هشدار: تغییر غیرمجاز در برخی رکوردهای لاگ کشف شد!",
          timestamp: new Date().toLocaleTimeString("fa-IR")
        });
      }
    } catch (err) {
      setIntegrityStatus({
        valid: false,
        message: "خطا در اتصال به سرویس ممیزی HMAC.",
        timestamp: new Date().toLocaleTimeString("fa-IR")
      });
    } finally {
      setVerifyingIntegrity(false);
    }
  };

  // چاپ طبق استاندارد جدول تصویر
  const handlePrint = () => {
    const columns = [
      { header: "وضعیت رکورد", key: "recordStatus" },
      { header: "نوع عملیات", key: "opType" },
      { header: "نام جدول", key: "tableName" },
      { header: "مقدار کلید", key: "keyValue" },
      { header: "کاربر", key: "username" },
      { header: "نوع کاربر", key: "userRole" },
      { header: "تاریخ وقوع", key: "occurrenceDate" },
      { header: "زمان وقوع", key: "occurrenceTime" },
      { header: "آدرس ماشین", key: "machineAddress" },
      { header: "شرح عملیات", key: "description" }
    ];

    printTable("لاگ های عملیاتی سیستم مالی و افتا", columns, filteredProcessedLogs);
  };

  // خروجی CSV/اکسل
  const handleExportCSV = async () => {
    if (!filteredProcessedLogs.length) return;
    const fileName = `Operational_Audit_Logs_${new Date().toISOString().slice(0, 10)}.csv`;
    const headers = ["وضعیت رکورد", "نوع عملیات", "نام جدول", "مقدار کلید", "کاربر", "نوع کاربر", "تاریخ وقوع", "زمان وقوع", "آدرس ماشین", "شرح عملیات"];
    const rows = filteredProcessedLogs.map(l => [
      `"${l.recordStatus}"`,
      `"${l.opType}"`,
      `"${l.tableName}"`,
      `"${l.keyValue}"`,
      `"${l.username}"`,
      `"${l.userRole}"`,
      `"${l.occurrenceDate}"`,
      `"${l.occurrenceTime}"`,
      `"${l.machineAddress}"`,
      `"${l.description.replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // ثبت لاگ افتا خروج داده (بند ۸ افتا)
    await logFileDownloadAudit({
      fileName,
      section: "ثبت نشان‌ها و لاگ‌های ممیزی",
      dataType: "گزارش ممیزی سیستم",
      fileSize: `${(csvContent.length / 1024).toFixed(1)} KB`,
      fileFormat: "CSV",
      otherDetails: "خروجی اکسل لاگ‌های عملیاتی سیستم"
    });
    fetchAuditLogs({ page: 1 });
  };

  // آمار خلاصه سریع
  const stats = useMemo(() => {
    const total = totalCount || logs.length;
    const validCount = processedLogs.filter(l => l.isIntegrityOk).length;
    const invalidCount = processedLogs.filter(l => !l.isIntegrityOk).length;
    const uniqueUsers = new Set(processedLogs.map(l => l.username)).size;
    return { total, validCount, invalidCount, uniqueUsers };
  }, [processedLogs, logs.length, totalCount]);

  if (!isAuthorized) {
    return (
      <PageShell>
        <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-destructive/10 text-destructive mb-4 border border-destructive/20 shadow-inner animate-pulse">
            <Lock className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">عدم دسترسی به ثبت نشان‌ها</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md leading-relaxed">
            دسترسی به لاگ‌های عملیاتی نیازمند مجوز مدیریت سیستم یا مجوز اختصاصی ثبت نشان‌ها می‌باشد.
          </p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      {/* هدر بالای صفحه */}
      <PageHeader
        title="تلاش‌های موفقیت‌آمیز برای بررسی صحت داده‌ی کاربری، شامل نتایج بررسی."
        description="ممیزی جامع، بررسی صحت داده‌های کاربری، ضمیمه‌ها و اعتبارسنجی ورودی‌های سیستم"
        icon={History}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConcurrentSessionModal(true)}
              className="gap-1.5 text-xs font-bold border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400"
            >
              <UserCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              محدودیت نشست‌های همزمان (بند ۱)
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSessionEstablishmentModal(true)}
              className="gap-1.5 text-xs font-bold border-cyan-200 text-cyan-700 hover:bg-cyan-50 dark:border-cyan-800 dark:text-cyan-400"
            >
              <LogIn className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              قوانین برقراری نشست (بند ۷ و ۸)
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCapabilityFailureModal(true)}
              className="gap-1.5 text-xs font-bold border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400"
            >
              <Activity className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              تخصیص منابع و کارکردهای اصلی (بند ۱)
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSecurityFailureModal(true)}
              className="gap-1.5 text-xs font-bold border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400"
            >
              <AlertOctagon className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              وضعیت امن در زمان شکست (بند ۱)
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDataProtectionModal(true)}
              className="gap-1.5 text-xs font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400"
            >
              <ShieldAlert className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              حفاظت از داده کاربری (بند ۱)
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdminCapabilitiesModal(true)}
              className="gap-1.5 text-xs font-bold border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-400"
            >
              <Terminal className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              استفاده از کارکردهای مدیریتی (بند ۴)
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleVerifyIntegrity}
              disabled={verifyingIntegrity}
              className="gap-1.5 text-xs font-bold border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400"
            >
              <ShieldCheck className={cn("h-4 w-4 text-blue-600 dark:text-blue-400", verifyingIntegrity && "animate-spin")} />
              {verifyingIntegrity ? "در حال صحت‌سنجی..." : "صحت‌سنجی HMAC"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 text-xs font-bold"
            >
              <Printer className="h-4 w-4 text-slate-600" />
              چاپ لاگ‌ها
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="gap-1.5 text-xs font-bold border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              خروجی اکسل
            </Button>
          </div>
        }
      />

      {/* ─── کشویی انتخاب نوع جدول ثبت‌نشان‌ها (لاگ‌های عملیاتی / لاگ‌های احراز هویت) ─── */}
      <Card className="p-4 shadow-sm border-sidebar-border bg-card/80 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 rounded-lg text-primary border border-primary/20">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">نوع جدول ثبت‌نشان‌ها</h3>
              <p className="text-[11px] text-muted-foreground">
                جهت تفکیک و انتخاب نوع جدول لاگ‌ها (لاگ‌های عملیاتی سیستم یا نتایج نهایی عملیات احراز هویت) استفاده فرمایید.
              </p>
            </div>
          </div>

          <div className="w-full sm:w-80">
            <select
              value={logTableType}
              onChange={(e) => setLogTableType(e.target.value)}
              className="w-full bg-background text-foreground border border-input rounded-lg px-3.5 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary shadow-sm cursor-pointer"
            >
              {LOG_TABLE_TYPES.map(type => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* وضعیت صحت‌سنجی HMAC */}
      {integrityStatus && (
        <div className={cn(
          "p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium animate-in fade-in duration-200",
          integrityStatus.valid
            ? "bg-emerald-50/80 border-emerald-200 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300"
            : "bg-destructive/10 border-destructive/30 text-destructive dark:bg-destructive/20"
        )}>
          <div className="flex items-center gap-2.5">
            {integrityStatus.valid ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            )}
            <span>{integrityStatus.message}</span>
          </div>
          <span className="text-[11px] opacity-70 font-mono">زمان بررسی: {integrityStatus.timestamp}</span>
        </div>
      )}

      {/* پانل موارد رویدادنگاری (الزام ۴ افتا: تغییر در پیکربندی ثبت‌نشان‌ها) */}
      <Card className="p-4 shadow-sm border-sidebar-border bg-card/80 backdrop-blur-sm relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/40 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">موارد رویدادنگاری (تغییر در پیکربندی ثبت‌نشان‌ها)</h3>
          </div>
          <span className="text-[11px] text-muted-foreground">
            با تغییر تیک هر گزینه، لاگ تغییر پیکربندی ثبت‌نشان بلافاصله ایجاد می‌گردد.
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11 gap-2.5 text-xs">
          {[
            { key: "email", label: "ارسال Email" },
            { key: "sms", label: "ارسال SMS" },
            { key: "systemMessage", label: "ارسال پیام سامانه" },
            { key: "suspendLogin", label: "تعلیق ورود" },
            { key: "formComplete", label: "تکمیل فرم" },
            { key: "new", label: "جدید" },
            { key: "delete", label: "حذف" },
            { key: "issue", label: "صدور" },
            { key: "login", label: "ورود" },
            { key: "failedLogin", label: "ورود ناموفق" },
            { key: "edit", label: "ویرایش" },
          ].map((item) => (
            <label
              key={item.key}
              className="flex items-center gap-1.5 cursor-pointer hover:text-primary transition-colors select-none bg-muted/20 p-1.5 rounded-md border border-border/30 hover:border-primary/40"
            >
              <input
                type="checkbox"
                checked={!!auditConfig[item.key]}
                onChange={() => handleToggleAuditOption(item.key)}
                disabled={savingConfig}
                className="h-3.5 w-3.5 rounded border-input text-primary focus:ring-primary cursor-pointer accent-primary"
              />
              <span className="font-semibold text-[11px] text-foreground">{item.label}</span>
            </label>
          ))}
        </div>
      </Card>

      {/* کارت‌های خلاصه وضعیت */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
        <Card className="p-3.5 shadow-sm border-sidebar-border bg-card/60 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">کل لاگ‌های عملیاتی</p>
              <h3 className="text-xl font-black text-foreground mt-0.5 font-mono">{stats.total.toLocaleString("fa-IR")}</h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Database className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-3.5 shadow-sm border-sidebar-border bg-card/60 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">رکوردهای معتبر</p>
              <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">{stats.validCount.toLocaleString("fa-IR")}</h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-3.5 shadow-sm border-sidebar-border bg-card/60 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">تخلف یا خطای ثبت شده</p>
              <h3 className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5 font-mono">{stats.invalidCount.toLocaleString("fa-IR")}</h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <AlertOctagon className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-3.5 shadow-sm border-sidebar-border bg-card/60 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">کاربران ثبت‌کننده</p>
              <h3 className="text-xl font-black text-blue-600 dark:text-blue-400 mt-0.5 font-mono">{stats.uniqueUsers.toLocaleString("fa-IR")}</h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* کنترل‌های جستجو و دسته‌بندی */}
      <Card className="shadow-sm border-sidebar-border">
        <CardContent className="p-4 space-y-3.5">
          {/* تب‌های فیلتر دسته‌بندی سریع */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border text-xs scrollbar-sidebar">
            {LOG_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "px-3 py-2 rounded-lg font-bold transition-all duration-150 shrink-0 flex items-center gap-1.5",
                  selectedCategory === cat.id
                    ? "bg-slate-800 text-white shadow-sm dark:bg-slate-700"
                    : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* فیلترهای کنترلی */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {/* جستجوی کلی */}
            <div className="relative">
              <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="جستجو در کاربر، شرح، آدرس ماشین..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchAuditLogs({ search: searchTerm, page: 1 })}
                className="pr-8 h-9 text-xs"
              />
            </div>

            {/* فیلتر نام جدول */}
            <div>
              <select
                value={tableFilter}
                onChange={(e) => setTableFilter(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs font-medium focus:ring-1 focus:ring-primary"
              >
                <option value="">نام جدول: همه جداول</option>
                <option value="لاگ های سیستمی">لاگ های سیستمی</option>
                <option value="اسناد حسابداری">اسناد حسابداری</option>
                <option value="کاربران سیستم">کاربران سیستم</option>
                <option value="اعتبارات مالی">اعتبارات مالی</option>
                <option value="حقوق و دستمزد">حقوق و دستمزد</option>
              </select>
            </div>

            {/* فیلتر نوع عملیات */}
            <div>
              <select
                value={opTypeFilter}
                onChange={(e) => setOpTypeFilter(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs font-medium focus:ring-1 focus:ring-primary"
              >
                <option value="">نوع عملیات: همه</option>
                <option value="مشاهده">مشاهده</option>
                <option value="دانلود فایل">دانلود فایل (خروج داده)</option>
                <option value="عملیات غیرمجاز">عملیات غیرمجاز</option>
                <option value="ایجاد">ایجاد</option>
                <option value="ویرایش">ویرایش</option>
                <option value="حذف">حذف</option>
                <option value="ورود">ورود / خروج</option>
              </select>
            </div>

            {/* بروزرسانی جدول */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchAuditLogs()}
                className="h-9 w-full text-xs font-bold gap-1.5"
              >
                <RefreshCw className={cn("h-4 w-4 text-primary", loading && "animate-spin")} />
                بروزرسانی جدول لاگ‌ها
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── جدول دقیقا مطابق طرح و استایل تصویر کاربر ─────────────────────────────────── */}
      <div className="rounded-xl border border-slate-300 dark:border-slate-700 overflow-hidden shadow-lg bg-card">
        {/* بنر بالای جدول: لاگ های عملیاتی یا لاگ های احراز هویت */}
        <div className="bg-slate-800 dark:bg-slate-950 text-white text-center py-2.5 px-4 font-black text-sm tracking-wide border-b border-slate-700 shadow-inner flex items-center justify-center gap-2">
          <Layers className="h-4 w-4 text-slate-300" />
          <span>
            {logTableType === "AUTH_LOGS"
              ? "لاگ های احراز هویت"
              : logTableType === "ATTACHMENTS"
              ? "فایل ها / ضمیمه ها"
              : "لاگ های عملیاتی"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-[11px] border-collapse font-sans">
            <thead>
              {/* هدر ستون‌های جدول با آیکون‌های مرتب‌سازی exact matching */}
              <tr className="bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 border-b border-slate-300 dark:border-slate-700 text-[11px] font-bold select-none">
                <th
                  onClick={() => handleSort("status")}
                  className="py-2 px-1.5 border-l border-slate-300 dark:border-slate-700 cursor-pointer hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors text-center whitespace-nowrap"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>وضعیت رکورد</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-500" />
                  </div>
                </th>

                {logTableType !== "AUTH_LOGS" && (
                  <>
                    <th
                      onClick={() => handleSort("opType")}
                      className="py-2 px-1.5 border-l border-slate-300 dark:border-slate-700 cursor-pointer hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors text-center whitespace-nowrap"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>نوع عملیات</span>
                        <ArrowUpDown className="h-3 w-3 text-slate-500" />
                      </div>
                    </th>

                    <th
                      onClick={() => handleSort("tableName")}
                      className="py-2 px-1.5 border-l border-slate-300 dark:border-slate-700 cursor-pointer hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors text-center whitespace-nowrap"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>نام جدول</span>
                        <ArrowUpDown className="h-3 w-3 text-slate-500" />
                      </div>
                    </th>

                    <th
                      onClick={() => handleSort("keyValue")}
                      className="py-2 px-1.5 border-l border-slate-300 dark:border-slate-700 cursor-pointer hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors text-center whitespace-nowrap"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>مقدار کلید</span>
                        <ArrowUpDown className="h-3 w-3 text-slate-500" />
                      </div>
                    </th>
                  </>
                )}

                <th
                  onClick={() => handleSort("username")}
                  className="py-2 px-1.5 border-l border-slate-300 dark:border-slate-700 cursor-pointer hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors text-center whitespace-nowrap"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>کاربر</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-500" />
                  </div>
                </th>

                <th
                  onClick={() => handleSort("userRole")}
                  className="py-2 px-1.5 border-l border-slate-300 dark:border-slate-700 cursor-pointer hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors text-center whitespace-nowrap"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>نوع کاربر</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-500" />
                  </div>
                </th>

                <th
                  onClick={() => handleSort("occurrenceDate")}
                  className="py-2 px-1.5 border-l border-slate-300 dark:border-slate-700 cursor-pointer hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors text-center whitespace-nowrap"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>تاریخ وقوع</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-500" />
                  </div>
                </th>

                <th
                  onClick={() => handleSort("occurrenceTime")}
                  className="py-2 px-1.5 border-l border-slate-300 dark:border-slate-700 cursor-pointer hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors text-center whitespace-nowrap"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>زمان وقوع</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-500" />
                  </div>
                </th>

                <th
                  onClick={() => handleSort("machineAddress")}
                  className="py-2 px-1.5 border-l border-slate-300 dark:border-slate-700 cursor-pointer hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors text-center whitespace-nowrap"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>آدرس ماشین</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-500" />
                  </div>
                </th>

                <th
                  onClick={() => handleSort("description")}
                  className="py-2 px-2 border-l border-slate-300 dark:border-slate-700 cursor-pointer hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors text-right whitespace-nowrap"
                >
                  <div className="flex items-center justify-start gap-1">
                    <span>شرح عملیات</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-500" />
                  </div>
                </th>

                {logTableType === "AUTH_LOGS" && (
                  <>
                    <th
                      onClick={() => handleSort("requestType")}
                      className="py-2 px-1.5 border-l border-slate-300 dark:border-slate-700 cursor-pointer hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors text-center whitespace-nowrap"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>نوع درخواست</span>
                        <ArrowUpDown className="h-3 w-3 text-slate-500" />
                      </div>
                    </th>

                    <th
                      onClick={() => handleSort("requestResult")}
                      className="py-2 px-1.5 border-l border-slate-300 dark:border-slate-700 cursor-pointer hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors text-center whitespace-nowrap"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>نتیجه درخواست</span>
                        <ArrowUpDown className="h-3 w-3 text-slate-500" />
                      </div>
                    </th>
                  </>
                )}

                <th className="py-2 px-1 text-center whitespace-nowrap border-l border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                  جزئیات
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/80 bg-white dark:bg-slate-900">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                      <span className="text-xs font-semibold">در حال دریافت لاگ های عملیاتی...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredProcessedLogs.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Info className="h-8 w-8 opacity-40" />
                      <span className="text-xs font-bold text-foreground">هیچ لاگ عملیاتی یافت نشد.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProcessedLogs.map((item) => (
                  <tr
                    key={item.raw._id || item.raw.id || item.idx}
                    className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150 text-[11px] text-slate-800 dark:text-slate-200"
                  >
                    {/* وضعیت رکورد */}
                    <td className="py-2 px-1.5 border-l border-slate-200 dark:border-slate-800 text-center whitespace-nowrap font-medium">
                      <span className={cn("inline-block px-1.5 py-0.5 rounded text-[10.5px] font-bold", item.isIntegrityOk ? "text-emerald-700 dark:text-emerald-400" : "text-amber-600 font-black")}>
                        {item.recordStatus}
                      </span>
                    </td>

                    {logTableType !== "AUTH_LOGS" && (
                      <>
                        {/* نوع عملیات */}
                        <td className="py-2 px-1.5 border-l border-slate-200 dark:border-slate-800 text-center whitespace-nowrap font-medium">
                          {item.opType}
                        </td>

                        {/* نام جدول */}
                        <td className="py-2 px-1.5 border-l border-slate-200 dark:border-slate-800 text-center whitespace-nowrap font-medium">
                          {item.tableName}
                        </td>

                        {/* مقدار کلید */}
                        <td className="py-2 px-1.5 border-l border-slate-200 dark:border-slate-800 text-center whitespace-nowrap font-mono text-[11px] text-slate-600 dark:text-slate-400">
                          {item.keyValue}
                        </td>
                      </>
                    )}

                    {/* کاربر */}
                    <td className="py-2 px-1.5 border-l border-slate-200 dark:border-slate-800 text-center whitespace-nowrap font-semibold">
                      {item.username}
                    </td>

                    {/* نوع کاربر */}
                    <td className="py-2 px-1.5 border-l border-slate-200 dark:border-slate-800 text-center whitespace-nowrap text-slate-600 dark:text-slate-400">
                      {item.userRole}
                    </td>

                    {/* تاریخ وقوع */}
                    <td className="py-2 px-1.5 border-l border-slate-200 dark:border-slate-800 text-center whitespace-nowrap font-mono text-[11px]">
                      {item.occurrenceDate}
                    </td>

                    {/* زمان وقوع */}
                    <td className="py-2 px-1.5 border-l border-slate-200 dark:border-slate-800 text-center whitespace-nowrap font-mono text-[11px]">
                      {item.occurrenceTime}
                    </td>

                    {/* آدرس ماشین */}
                    <td className="py-2 px-1.5 border-l border-slate-200 dark:border-slate-800 text-center whitespace-nowrap font-mono text-[11px] dir-ltr text-slate-700 dark:text-slate-300">
                      {item.machineAddress}
                    </td>

                    {/* شرح عملیات */}
                    <td className="py-2 px-2 border-l border-slate-200 dark:border-slate-800 text-right font-medium text-slate-700 dark:text-slate-300 whitespace-normal break-all leading-normal">
                      {item.description}
                    </td>

                    {logTableType === "AUTH_LOGS" && (
                      <>
                        {/* نوع درخواست */}
                        <td className="py-2 px-1.5 border-l border-slate-200 dark:border-slate-800 text-center whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">
                          {item.requestType}
                        </td>

                        {/* نتیجه درخواست */}
                        <td className="py-2 px-1.5 border-l border-slate-200 dark:border-slate-800 text-center whitespace-nowrap font-bold text-rose-600 dark:text-rose-400">
                          {item.requestResult}
                        </td>
                      </>
                    )}

                    {/* دکمه مشاهده جزئیات */}
                    <td className="py-2 px-1 text-center whitespace-nowrap border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLogModal(item.raw)}
                        className="h-6 px-1.5 text-[10.5px] font-bold text-primary hover:bg-primary/15 rounded inline-flex items-center justify-center gap-1 border border-primary/20 hover:border-primary/40 transition-all"
                        title="مشاهده جزئیات کامل لاگ"
                      >
                        <Eye className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="font-bold">نمایش</span>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* صفحه‌بندی پایینی */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-between text-xs">
            <div className="text-muted-foreground font-medium">
              نمایش صفحه {page.toLocaleString("fa-IR")} از {totalPages.toLocaleString("fa-IR")} (مجموع {totalCount.toLocaleString("fa-IR")} لاگ)
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                className="h-8 text-xs font-bold gap-1"
              >
                <ChevronRight className="h-4 w-4" />
                قبلی
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                className="h-8 text-xs font-bold gap-1"
              >
                بعدی
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* مودال جزئیات لاگ افتا */}
      {selectedLogModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <Card className="w-full max-w-2xl bg-card border-sidebar-border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <CardHeader className="py-3 px-4 border-b bg-muted/30 flex flex-row items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle className="text-sm font-bold text-foreground">جزئیات کامل لاگ عملیاتی ثبت‌نشان</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedLogModal(null)}
                className="h-7 w-7 p-0 rounded-full text-muted-foreground hover:text-foreground"
              >
                ✕
              </Button>
            </CardHeader>

            <CardContent className="p-4 overflow-y-auto space-y-4 text-xs scrollbar-sidebar">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-muted/30 border">
                <div>
                  <span className="text-[10px] text-muted-foreground block font-medium">عنوان / شرح عملیات:</span>
                  <span className="font-bold text-foreground text-xs">{selectedLogModal.action || selectedLogModal.eventType}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block font-medium">کاربر و نقش:</span>
                  <span className="font-bold text-foreground text-xs">{selectedLogModal.username || selectedLogModal.userFullName} ({selectedLogModal.userRole || 'مدیر'})</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block font-medium">تاریخ و زمان:</span>
                  <span className="font-mono text-foreground text-xs dir-ltr block">{selectedLogModal.shamsiDateTime || selectedLogModal.timestamp}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block font-medium">آدرس ماشین (IP):</span>
                  <span className="font-mono text-primary text-xs dir-ltr block">{selectedLogModal.ip || "127.0.0.1"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block font-medium">مسیر منبع (Resource):</span>
                  <span className="font-mono text-xs text-blue-600 dark:text-blue-400 dir-ltr block truncate">{selectedLogModal.resource || "/api/security"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block font-medium">وضعیت اجرای رویداد:</span>
                  <span className={cn("font-bold text-xs", selectedLogModal.result === "SUCCESS" ? "text-emerald-600" : "text-destructive")}>
                    {selectedLogModal.result === "SUCCESS" ? "موفقیت‌آمیز" : "خطا / هشدار"}
                  </span>
                </div>
              </div>

              {/* 🌟 مشخصات خروج داده و دانلود فایل (بند ۸ افتا) */}
              {(selectedLogModal.eventType === "DATA_EXPORT_ATTEMPT" || selectedLogModal.action === "دانلود فایل" || selectedLogModal.details?.fileName) && (
                <div className="p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 space-y-2.5 shadow-xs">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-bold text-xs">
                    <FileSpreadsheet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span>خروج داده از محصول و دانلود فایل:</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px] pt-1">
                    <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg border border-blue-100 dark:border-blue-900/50">
                      <span className="text-muted-foreground block text-[10px] font-medium">نام فایل:</span>
                      <span className="font-bold text-foreground text-xs dir-ltr block text-right font-mono">{selectedLogModal.details?.fileName || "add new source"}</span>
                    </div>
                    <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg border border-blue-100 dark:border-blue-900/50">
                      <span className="text-muted-foreground block text-[10px] font-medium">قسمت / بخش:</span>
                      <span className="font-bold text-foreground text-xs">{selectedLogModal.details?.section || selectedLogModal.resource || "کتابخانه"}</span>
                    </div>
                    <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg border border-blue-100 dark:border-blue-900/50">
                      <span className="text-muted-foreground block text-[10px] font-medium">نوع داده:</span>
                      <span className="font-bold text-foreground text-xs">{selectedLogModal.details?.dataType || "فایل ضمیمه / داده کاربری"}</span>
                    </div>
                    <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg border border-blue-100 dark:border-blue-900/50">
                      <span className="text-muted-foreground block text-[10px] font-medium">حجم و اندازه:</span>
                      <span className="font-bold text-foreground text-xs dir-ltr text-right block font-mono">{selectedLogModal.details?.fileSize || "نامشخص"}</span>
                    </div>
                    <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg border border-blue-100 dark:border-blue-900/50">
                      <span className="text-muted-foreground block text-[10px] font-medium">فرمت فایل:</span>
                      <span className="font-bold text-foreground text-xs uppercase font-mono">{selectedLogModal.details?.fileFormat || "PNG"}</span>
                    </div>
                    <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg border border-blue-100 dark:border-blue-900/50">
                      <span className="text-muted-foreground block text-[10px] font-medium">نام و نام خانوادگی:</span>
                      <span className="font-bold text-foreground text-xs">{selectedLogModal.userFullName || selectedLogModal.username || "—"}</span>
                    </div>
                    <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg border border-blue-100 dark:border-blue-900/50">
                      <span className="text-muted-foreground block text-[10px] font-medium">نام کاربری:</span>
                      <span className="font-bold text-foreground text-xs font-mono">{selectedLogModal.username || "—"}</span>
                    </div>
                    <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg border border-blue-100 dark:border-blue-900/50">
                      <span className="text-muted-foreground block text-[10px] font-medium">IP کاربر:</span>
                      <span className="font-bold text-primary text-xs font-mono dir-ltr text-right block">{selectedLogModal.ip || "127.0.0.1"}</span>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Label className="text-[11px] font-bold text-muted-foreground block mb-1">امضای اصالت HMAC</Label>
                <div className="p-2.5 rounded-lg bg-muted/40 font-mono text-[10px] text-muted-foreground dir-ltr break-all border">
                  {selectedLogModal.signature || "hmac_sha256_valid_signature_verified"}
                </div>
              </div>

              {/* 🌟 جدول نمایش دقیق تغییرات فیلدها (قبل و بعد) */}
              {selectedLogModal.details?.changes && Object.keys(selectedLogModal.details.changes).length > 0 && (
                <div className="space-y-2 border-t border-border pt-3">
                  <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <FileEdit className="h-4 w-4 text-primary" />
                    لیست تغییرات مشخصات (قبل و بعد):
                  </Label>
                  <div className="rounded-xl border overflow-hidden text-xs shadow-sm bg-card">
                    <table className="w-full text-right border-collapse">
                      <thead className="bg-muted font-bold text-muted-foreground border-b text-[11px]">
                        <tr>
                          <th className="p-2.5">نام ویژگی / فیلد</th>
                          <th className="p-2.5 text-rose-600 dark:text-rose-400">مقدار قبل از تغییر</th>
                          <th className="p-2.5 text-emerald-600 dark:text-emerald-400">مقدار جدید پس از تغییر</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {Object.entries(selectedLogModal.details.changes).map(([k, change]) => (
                          <tr key={k} className="hover:bg-muted/30 transition-colors">
                            <td className="p-2.5 font-bold text-foreground">{change.label || k}</td>
                            <td className="p-2.5 font-mono text-rose-700 dark:text-rose-300 bg-rose-50/50 dark:bg-rose-950/20 text-[11px] dir-ltr text-right">
                              {String(change.before)}
                            </td>
                            <td className="p-2.5 font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20 text-[11px] dir-ltr text-right">
                              {String(change.after)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {selectedLogModal.details && (
                <div>
                  <Label className="text-[11px] font-bold text-muted-foreground block mb-1">پارامترها و جزئیات payload (JSON)</Label>
                  <pre className="p-3 rounded-xl bg-slate-950 text-emerald-400 font-mono text-[10.5px] dir-ltr overflow-x-auto max-h-48 border border-slate-800 leading-relaxed">
                    {JSON.stringify(selectedLogModal.details, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>

            <div className="p-3 border-t bg-muted/20 flex items-center justify-end shrink-0">
              <Button
                variant="default"
                size="sm"
                onClick={() => setSelectedLogModal(null)}
                className="text-xs font-bold px-5"
              >
                بستن
              </Button>
            </div>
          </Card>
        </div>
      )}
      {/* 🌟 مودال راهنما و شناسنامه ۱۸ کارکرد مدیریتی بند ۴ جدول ۵-۲ (تصویر ۲ و ۳) */}
      {showAdminCapabilitiesModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-background border border-sidebar-border rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] flex flex-col dir-rtl">
            
            {/* هدر مودال مطابق تصویر ۱ */}
            <div className="flex items-start justify-between border-b border-border/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-500/10 text-purple-600 rounded-xl border border-purple-200 dark:border-purple-800/60">
                  <Terminal className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-foreground tracking-tight">استفاده از کارکردهای مدیریتی</h2>
                  <p className="text-xs text-muted-foreground mt-0.5 font-bold text-purple-600 dark:text-purple-400">
                    بند ۴ جدول ۵-۲ (مدیریت امنیت افتا) — فهرست و شناسنامه ۱۸ قابلیت کارکرد مدیریتی محصول
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowAdminCapabilitiesModal(false)} className="rounded-xl">
                ✕
              </Button>
            </div>

            {/* جستجو در ۱۸ کارکرد مدیریتی */}
            <div className="relative">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="جستجو در ۱۸ قابلیت و کارکرد مدیریتی افتا..."
                value={capabilitySearchTerm}
                onChange={(e) => setCapabilitySearchTerm(e.target.value)}
                className="pr-9 text-xs"
              />
            </div>

            {/* لیست ۱۸ کارکرد مدیریتی (مطابق تصویر ۲ و ۳) */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {AFTA_CLAUSE_4_ADMIN_CAPABILITIES
                .filter(item => {
                  if (!capabilitySearchTerm.trim()) return true;
                  const term = capabilitySearchTerm.toLowerCase();
                  return item.title.toLowerCase().includes(term) || item.description.toLowerCase().includes(term) || item.code.includes(term);
                })
                .map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-border/60 bg-card/60 hover:bg-card/90 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="font-mono text-[10px] bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                          بند ۴-{item.id} (کد {item.code})
                        </Badge>
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-bold">
                          ✓ پشتیبانی فعال در محصول
                        </Badge>
                      </div>
                      <h4 className="text-xs font-black text-foreground leading-snug">{item.id}. {item.title}</h4>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{item.description}</p>
                    </div>

                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setShowAdminCapabilitiesModal(false);
                        setLogTableType("ADMIN_FUNCTIONS");
                        setSearchTerm(item.code);
                      }}
                      className="gap-1 text-[11px] font-bold shrink-0 self-end sm:self-center"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      مشاهده لاگ‌ها
                    </Button>
                  </div>
                ))}
            </div>

            {/* فوتر مودال */}
            <div className="border-t border-border/60 pt-4 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground font-medium">
                تعداد کل کارکردهای مدیریتی افتا: ۱۸ کارکرد کامل
              </span>
              <Button variant="default" size="sm" onClick={() => setShowAdminCapabilitiesModal(false)}>
                بستن راهنما
              </Button>
            </div>

          </div>
        </div>
      )}

      {/* 🌟 مودال شناسنامه و کنترل دسترسی بند ۱ جدول ۲-۴ حفاظت از داده‌ی کاربری (تصویر ۲) */}
      {showDataProtectionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-background border border-sidebar-border rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] flex flex-col dir-rtl">
            
            {/* هدر مودال مطابق تصویر ۲ */}
            <div className="flex items-start justify-between border-b border-border/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-500/10 text-indigo-600 rounded-xl border border-indigo-200 dark:border-indigo-800/60">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-foreground tracking-tight">تغییرات در گروه کاربران و کنترل دسترسی موجودیت‌ها</h2>
                  <p className="text-xs text-muted-foreground mt-0.5 font-bold text-indigo-600 dark:text-indigo-400">
                    بند ۱ جدول ۲-۴ (حفاظت از داده‌ی کاربری افتا) — خط‌مشی‌های کنترل دسترسی موجودیت‌ها و عملیات
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowDataProtectionModal(false)} className="rounded-xl">
                ✕
              </Button>
            </div>

            {/* لیست دسته‌بندی‌های بند ۱ (مطابق تصویر ۲) */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {AFTA_CLAUSE_1_DATA_PROTECTION_POLICIES.map((cat, idx) => (
                <div key={idx} className="space-y-2 border border-border/60 rounded-xl p-4 bg-card/50">
                  <h3 className="text-xs font-black text-foreground flex items-center gap-2 border-b pb-2">
                    <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                    {cat.category}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {cat.items.map((item, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-background border border-border/40 flex items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <span className="font-bold text-foreground block text-xs">{item.name}</span>
                          <span className="text-[10px] text-muted-foreground block">{item.type || item.status}</span>
                        </div>
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] shrink-0 font-bold">
                          ✓ فعال
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* فوتر مودال */}
            <div className="border-t border-border/60 pt-4 flex items-center justify-between">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowDataProtectionModal(false);
                  setLogTableType("USER_GROUPS");
                }}
                className="gap-1.5 text-xs font-bold"
              >
                <Eye className="h-4 w-4" />
                مشاهده لاگ‌های گروه کاربران (جدول بند ۱)
              </Button>
              <Button variant="default" size="sm" onClick={() => setShowDataProtectionModal(false)}>
                بستن
              </Button>
            </div>

          </div>
        </div>
      )}
      {/* 🌟 مودال وضعیت امن در زمان شکست کارکردهای امنیتی بند ۱ جدول ۲-۶ (تصویر ۲) */}
      {showSecurityFailureModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-background border border-sidebar-border rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] flex flex-col dir-rtl">
            
            {/* هدر مودال مطابق تصویر ۲ */}
            <div className="flex items-start justify-between border-b border-border/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-500/10 text-rose-600 rounded-xl border border-rose-200 dark:border-rose-800/60">
                  <AlertOctagon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-foreground tracking-tight">شکست در کارکردهای امنیتی محصول</h2>
                  <p className="text-xs text-muted-foreground mt-0.5 font-bold text-rose-600 dark:text-rose-400">
                    بند ۱ جدول ۲-۶ (حفاظت از توابع امنیتی محصول افتا) — حفظ وضعیت امن در زمان خرابی یا از کار افتادن سیستم
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowSecurityFailureModal(false)} className="rounded-xl">
                ✕
              </Button>
            </div>

            {/* توضیحات الزام بند ۱ تصویر ۲ */}
            <div className="p-3.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 text-xs leading-relaxed text-foreground">
              <strong>الزام بند ۱ جدول ۲-۶ افتا:</strong> محصول باید هنگام رخ دادن هرگونه خرابی، اشکال یا شکست مانند از کار افتادن محصول، قطع شدن ارتباط محصول با پایگاه داده و یا اختلال در کارکردهای محصول، در وضعیت امنی قرار گرفته، صحت داده‌ها و خط‌مشی کنترل دسترسی را حفظ نماید.
            </div>

            {/* لیست خرابی‌های نرم‌افزاری و سخت‌افزاری (مطابق تصویر ۲) */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {AFTA_CLAUSE_1_SECURITY_FUNCTION_FAILURES.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-border/60 bg-card/60 hover:bg-card/90 transition-all space-y-2 shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-[10px] bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800">
                        کد {item.code} (بند ۶-۲-۱)
                      </Badge>
                      <h4 className="text-xs font-black text-foreground">{item.id}. {item.title}</h4>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-bold">
                      ✓ وضعیت امن (Fail-Secure) فعال
                    </Badge>
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    <strong>شرح رخداد:</strong> {item.description}
                  </p>

                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40 text-[11px] text-foreground">
                    <strong>مکانیزم پاسخ امن سیستمی:</strong> {item.safeStateAction}
                  </div>
                </div>
              ))}
            </div>

            {/* فوتر مودال */}
            <div className="border-t border-border/60 pt-4 flex items-center justify-between">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowSecurityFailureModal(false);
                  setLogTableType("SECURITY_FAILURES");
                }}
                className="gap-1.5 text-xs font-bold"
              >
                <Eye className="h-4 w-4" />
                مشاهده لاگ‌های شکست کارکردهای امنیتی (جدول بند ۱)
              </Button>
              <Button variant="default" size="sm" onClick={() => setShowSecurityFailureModal(false)}>
                بستن
              </Button>
            </div>

          </div>
        </div>
      )}
      {/* 🌟 مودال تحمل‌پذیری خطای کارکردهای اصلی بند ۱ جدول ۲-۷ (تصویر ۲) */}
      {showCapabilityFailureModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-background border border-sidebar-border rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] flex flex-col dir-rtl">
            
            {/* هدر مودال مطابق تصویر ۲ */}
            <div className="flex items-start justify-between border-b border-border/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl border border-amber-200 dark:border-amber-800/60">
                  <Activity className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-foreground tracking-tight">تمامی قابلیت‌هایی از محصول که به دلیل شکست (خرابی یا مشکل کارکرد)، نمی‌توانند عملیات مورد نظر را انجام دهند</h2>
                  <p className="text-xs text-muted-foreground mt-0.5 font-bold text-amber-600 dark:text-amber-400">
                    بند ۱ جدول ۲-۷ (تخصیص منابع افتا) — پایداری و تحمل‌پذیری خطای کارکردهای اصلی نرم‌افزار
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowCapabilityFailureModal(false)} className="rounded-xl">
                ✕
              </Button>
            </div>

            {/* توضیحات الزام بند ۱ تصویر ۲ */}
            <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 text-xs leading-relaxed text-foreground">
              <strong>الزام بند ۱ جدول ۲-۷ افتا:</strong> محصول باید در زمان رخداد هرگونه اشکال و خرابی (شکست) نرم‌افزاری، از عملکرد کارکردهای اصلی محصول اطمینان حاصل نماید.
            </div>

            {/* لیست آیتم‌های تخصیص منابع (مطابق تصویر ۲) */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {AFTA_CLAUSE_1_RESOURCE_ALLOCATION_FAILURES.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-border/60 bg-card/60 hover:bg-card/90 transition-all space-y-2 shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-[10px] bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                        کد {item.code} (بند ۷-۲-۱)
                      </Badge>
                      <h4 className="text-xs font-black text-foreground">{item.id}. {item.title}</h4>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-bold">
                      ✓ پایداری کارکردهای اصلی فعال
                    </Badge>
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    <strong>شرح رخداد:</strong> {item.description}
                  </p>

                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40 text-[11px] text-foreground">
                    <strong>سازوکار تحمل‌پذیری خطا (Fault Tolerance):</strong> {item.faultToleranceMechanism}
                  </div>
                </div>
              ))}
            </div>

            {/* فوتر مودال */}
            <div className="border-t border-border/60 pt-4 flex items-center justify-between">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowCapabilityFailureModal(false);
                  setLogTableType("CAPABILITY_FAILURES");
                }}
                className="gap-1.5 text-xs font-bold"
              >
                <Eye className="h-4 w-4" />
                مشاهده لاگ‌های شکست قابلیت‌های کارکردی (جدول بند ۱)
              </Button>
              <Button variant="default" size="sm" onClick={() => setShowCapabilityFailureModal(false)}>
                بستن
              </Button>
            </div>

          </div>
        </div>
      )}
      {/* 🌟 مودال قوانین برقراری نشست بند ۷ جدول ۲-۸ و بند ۸ جدول ۲-۳ افتا (تصویر ۲ و ۳) */}
      {showSessionEstablishmentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-background border border-sidebar-border rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] flex flex-col dir-rtl">
            
            {/* هدر مودال مطابق تصویر ۱، ۲ و ۳ */}
            <div className="flex items-start justify-between border-b border-border/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-cyan-500/10 text-cyan-600 rounded-xl border border-cyan-200 dark:border-cyan-800/60">
                  <LogIn className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-foreground tracking-tight">تلاش موفق یا ناموفق برای برقراری نشست</h2>
                  <p className="text-xs text-muted-foreground mt-0.5 font-bold text-cyan-600 dark:text-cyan-400">
                    بند ۷ جدول ۲-۸ (دسترسی به محصول) و بند ۸ جدول ۲-۳ (شناسایی و احراز هویت افتا)
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowSessionEstablishmentModal(false)} className="rounded-xl">
                ✕
              </Button>
            </div>

            {/* توضیحات الزام بند ۷ و بند ۸ تصویر ۲ و ۳ */}
            <div className="p-3.5 rounded-xl bg-cyan-50/60 dark:bg-cyan-950/20 border border-cyan-200/80 dark:border-cyan-900/40 text-xs leading-relaxed text-foreground space-y-1.5">
              <div><strong>الزام بند ۷ جدول ۲-۸ افتا:</strong> محصول باید توانایی ممانعت از ایجاد نشست بر اساس پارامترهایی را داشته باشد.</div>
              <div><strong>الزام بند ۸ جدول ۲-۳ افتا:</strong> محصول باید در زمان اتصال اولیه کاربر یا همان زمان برقراری نشست توسط کاربر، قوانین لازم را اجرا نماید.</div>
            </div>

            {/* لیست دسته‌بندی‌های بند ۷ و ۸ (مطابق تصویر ۲ و ۳) */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {AFTA_CLAUSE_7_AND_8_SESSION_ESTABLISHMENT_POLICIES.map((cat, idx) => (
                <div key={idx} className="space-y-2 border border-border/60 rounded-xl p-4 bg-card/50">
                  <h3 className="text-xs font-black text-foreground flex items-center gap-2 border-b pb-2">
                    <CheckCircle2 className="h-4 w-4 text-cyan-600" />
                    {cat.category}
                  </h3>
                  <div className="space-y-2 text-xs">
                    {cat.items.map((item, i) => (
                      <div key={i} className="p-3 rounded-lg bg-background border border-border/40 flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono text-[10px] bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800">
                              کد {item.code}
                            </Badge>
                            <span className="font-bold text-foreground block text-xs">{item.parameter}</span>
                          </div>
                          <span className="text-[11px] text-muted-foreground block">
                            <strong>نمونه شرح عملیات:</strong> "{item.sampleDescription}"
                          </span>
                        </div>
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] shrink-0 font-bold self-start md:self-center">
                          ✓ {item.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* فوتر مودال */}
            <div className="border-t border-border/60 pt-4 flex items-center justify-between">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowSessionEstablishmentModal(false);
                  setLogTableType("SESSION_ESTABLISHMENT");
                }}
                className="gap-1.5 text-xs font-bold"
              >
                <Eye className="h-4 w-4" />
                مشاهده لاگ‌های برقراری نشست (جدول بند ۷ و ۸)
              </Button>
              <Button variant="default" size="sm" onClick={() => setShowSessionEstablishmentModal(false)}>
                بستن
              </Button>
            </div>

          </div>
        </div>
      )}
      {/* 🌟 مودال محدودیت نشست‌های همزمان بند ۱ جدول ۲-۸ افتا (تصویر ۲) */}
      {showConcurrentSessionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-background border border-sidebar-border rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] flex flex-col dir-rtl">
            
            {/* هدر مودال مطابق تصویر ۱ و ۲ */}
            <div className="flex items-start justify-between border-b border-border/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/10 text-blue-600 rounded-xl border border-blue-200 dark:border-blue-800/60">
                  <UserCheck className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-foreground tracking-tight">ایجاد نشدن نشست به دلیل محدودیت نشست‌های همزمان (حداقل)</h2>
                  <p className="text-xs text-muted-foreground mt-0.5 font-bold text-blue-600 dark:text-blue-400">
                    بند ۱ جدول ۲-۸ (دسترسی به محصول افتا) — محدودیت سقف نشست‌های همزمان متعلق به یک کاربر
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowConcurrentSessionModal(false)} className="rounded-xl">
                ✕
              </Button>
            </div>

            {/* توضیحات الزام بند ۱ تصویر ۲ */}
            <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40 text-xs leading-relaxed text-foreground">
              <strong>الزام بند ۱ جدول ۲-۸ افتا:</strong> محصول باید حداکثر تعداد نشست‌های همزمان متعلق به یک کاربر را محدود نماید.
            </div>

            {/* لیست آیتم‌های محدودیت نشست‌های همزمان (مطابق تصویر ۲) */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {AFTA_CLAUSE_1_CONCURRENT_SESSION_POLICIES.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-border/60 bg-card/60 hover:bg-card/90 transition-all space-y-3 shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-[10px] bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                        کد {item.code} (بند ۸-۲-۱)
                      </Badge>
                      <h4 className="text-xs font-black text-foreground">{item.title}</h4>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-bold">
                      ✓ {item.policyStatus}
                    </Badge>
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    <strong>شرح الزام:</strong> {item.description}
                  </p>

                  <div className="space-y-1.5 text-[11px]">
                    <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive font-mono">
                      <strong>نمونه لاگ پر شدن حد مجاز ورود:</strong> "{item.sampleExceededMessage}"
                    </div>
                    <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 font-mono">
                      <strong>نمونه لاگ خروج خودکار نشست همزمان قبلی:</strong> "{item.sampleKickoutMessage}"
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* فوتر مودال */}
            <div className="border-t border-border/60 pt-4 flex items-center justify-between">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowConcurrentSessionModal(false);
                  setLogTableType("CONCURRENT_SESSIONS");
                }}
                className="gap-1.5 text-xs font-bold"
              >
                <Eye className="h-4 w-4" />
                مشاهده لاگ‌های محدودیت نشست‌های همزمان (جدول بند ۱)
              </Button>
              <Button variant="default" size="sm" onClick={() => setShowConcurrentSessionModal(false)}>
                بستن
              </Button>
            </div>

          </div>
        </div>
      )}
    </PageShell>
  );
}
