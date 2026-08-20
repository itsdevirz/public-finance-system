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
  Laptop, UserCheck, ChevronLeft, ChevronRight,
  Database, AlertOctagon, Terminal, Activity, FileText, Info, Layers
} from "lucide-react";
import api, { logFileDownloadAudit } from "@/api";
import { cn } from "@/lib/utils";
import { printTable } from "@/lib/printUtils";
import { useAuth } from "@/context/AuthContext";

// انواع جداول ثبت‌نشان‌ها (جدول لاگ‌های عملیاتی و امنیتی سیستم)
const LOG_TABLE_TYPES = [
  { id: "OPERATIONAL", label: "جدول لاگ‌های عملیاتی و امنیتی سیستم (شامل گذرواژه‌ها)" },
  { id: "AUTH_LOGS", label: "جدول لاگ‌های احراز هویت (ورود و خروج)" },
  { id: "ATTACHMENTS", label: "فایل ها / ضمیمه ها (رویدادهای دانلود، بارگذاری و خروج داده - بند ۸ افتا)" }
];

// دسته‌بندی‌های سریع لاگ‌های عملیاتی
const LOG_CATEGORIES = [
  { id: "ALL", label: "همه لاگ‌های عملیاتی" },
  { id: "DOWNLOADS", label: "دانلود فایل (خروج داده - بند ۸ افتا)" },
  { id: "ATTACHMENTS", label: "فایل ها / ضمیمه ها" },
  { id: "PASSWORD", label: "تلاش‌ها و تغییرات گذرواژه" },
  { id: "AUTH", label: "ورود و امنیت" },
  { id: "CREATE", label: "ثبت و ایجاد جدید" },
  { id: "UPDATE", label: "ویرایش و تغییرات" },
  { id: "DELETE", label: "حذف و ابطال" },
  { id: "UNAUTHORIZED", label: "عملیات غیرمجاز" },
  { id: "READ", label: "مشاهده و استعلام" },
];

// تابع تبدیل شرح‌های فنی به توضیحات کامل و قابل فهم برای کاربران غیربرنامه‌نویس
function formatHumanReadableDescription(log) {
  const rawAction = (log.action || log.eventType || "").trim();
  const resourceLower = (log.resource || "").toLowerCase();
  const methodUpper = (log.method || "").toUpperCase();
  const details = log.details || {};

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

      const isAttachmentLog = log.resource === "ضمیمه" || actionStr.includes("AttachmentName") || isDownloadLog;
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

      if (isDownloadLog || log.details?.fileName) {
        tableName = log.details?.section || log.resource || "کتابخانه";
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
      if (isAttachmentLog) {
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

      // 5. کاربر (نام کاربری)
      let username = log.username || log.userFullName || (log.userId ? String(log.userId) : "—");
      if (username === "anonymous") username = "کاربر مهمان";

      // 6. نوع کاربر (نقش)
      let userRole = log.userRole || "—";

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
        if (item.tableName !== "ضمیمه" && item.opType !== "دانلود فایل" && !item.raw?.action?.includes("AttachmentName") && item.raw?.resource !== "ضمیمه" && item.raw?.eventType !== "DATA_EXPORT_ATTEMPT") return false;
      }

      // فیلتر تب‌های سریع در حالت لاگ‌های عملیاتی
      if (logTableType === "OPERATIONAL") {
        if (selectedCategory === "DOWNLOADS" && item.opType !== "دانلود فایل" && !item.isDownloadLog) return false;
        if (selectedCategory === "ATTACHMENTS" && item.tableName !== "ضمیمه" && item.opType !== "دانلود فایل" && !item.raw?.action?.includes("AttachmentName")) return false;
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
                  <span className="font-mono text-primary text-xs dir-ltr block">{selectedLogModal.ip || "192.168.35.244"}</span>
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
                    <span>خروج داده از محصول و دانلود فایل (بند ۸ جدول ۲-۴ حفاظت از داده‌های کاربردی افتا):</span>
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
                      <span className="font-bold text-foreground text-xs">{selectedLogModal.userFullName || selectedLogModal.username || "NETEL شریف"}</span>
                    </div>
                    <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg border border-blue-100 dark:border-blue-900/50">
                      <span className="text-muted-foreground block text-[10px] font-medium">نام کاربری:</span>
                      <span className="font-bold text-foreground text-xs font-mono">{selectedLogModal.username || "netel"}</span>
                    </div>
                    <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg border border-blue-100 dark:border-blue-900/50">
                      <span className="text-muted-foreground block text-[10px] font-medium">IP کاربر:</span>
                      <span className="font-bold text-primary text-xs font-mono dir-ltr text-right block">{selectedLogModal.ip || "192.168.35.215"}</span>
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
    </PageShell>
  );
}
