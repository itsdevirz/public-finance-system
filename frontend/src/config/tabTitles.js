import { getAllMenuRoutes } from "@/config/navigation";

const EXTRA_TITLES = {
  "/": "داشبورد اصلی",
  "/login": "ورود به سیستم",
  "/basic-info": "اطلاعات پایه",
  "/document-setup": "تنظیم اسناد",
  "/reports": "گزارشات مالی و حسابداری",
  "/reports/internal": "۱. گزارش‌های درون‌سازمانی",
  "/reports/external": "۲. گزارش‌های برون‌سازمانی",
  "/reports/accounts": "۱-۱. گزارش‌های حساب",
  "/reports/budget": "۱-۲. گزارش‌های بودجه",
  "/reports/payments": "۱-۳. گزارش‌های دریافت و پرداخت",
  "/reports/financial": "۱-۴. گزارش‌های مالی",
  "/reports/management": "۱-۵. گزارش‌های مدیریتی",
  "/reports/contracts": "۱-۶. گزارش‌های قراردادی",
  "/reports/balance": "۲-۱. گزارش‌های تراز",
  "/reports/sanama": "۲-۲. گزارش‌های سناما (سنما)",
  "/reports/audit-legal": "۲-۳. گزارش‌های ممیزی و فرم‌های عملکرد قانونی",
  "/bookkeeping/operations-balance/10-column": "تراز ۱۰ ستونی",
  "/system-management": "مدیریت سیستم و امکانات",
  "/credits": "داشبورد اعتبارات",
  "/payroll": "سیستم حقوق و دستمزد",
  "/warehouse": "سیستم انبار",
  "/assets": "سیستم اموال",
  "/ai": "دستیار هوشمند مالی (AI)",

  // ─── مدیریت اعتبارات (اعتبارات و بودجه) ──────────────────────────────
  "/credits/agreements": "ثبت موافقت‌نامه",
  "/credits/allocations": "تخصیص اعتبار",
  "/credits/verification-realization": "دریافت اعتبارات",
  "/credits/commitments-funding": "تأمین اعتبار",
  "/credits/commitments-funding/request": "درخواست تأمین اعتبار",
  "/credits/commitments-funding/review": "مرور تأمین اعتبار",
  "/credits/payments": "پرداخت اعتبارات",
  "/credits/card": "شناسنامه و کارت اعتبار",

  // ─── خزانه، سپرده‌ها و چک ──────────────────────────────────────────────
  "/check-issuance": "صدور چک و پرداخت",
  "/guarantees/register/contract": "ثبت قرارداد ضمانت‌نامه",
  "/deposits/manual-form": "ثبت دستی سپرده",

  // ─── اطلاعات پایه و قراردادها ───────────────────────────────────────────
  "/basic-info/definitions/fiscal-year": "تعریف دوره مالی",
  "/basic-info/definitions/persons": "تعریف اشخاص",
  "/basic-info/definitions/bank": "تعریف بانک",
  "/basic-info/definitions/credit": "تعریف اعتبار",
  "/basic-info/definitions/check": "تعریف چک",
  "/basic-info/definitions/contract-types": "تعریف انواع قرارداد",
  "/basic-info/definitions/deduction-types": "تعریف انواع کسور",
  "/basic-info/definitions/guarantee-types": "تعریف نوع ضمانتنامه",
  "/basic-info/definitions/parties": "تعریف طرف قرارداد",
  "/basic-info/definitions/assignment-methods": "تعریف روش واگذاری",
  "/basic-info/definitions/purchase-power-rate": "تعریف نرخ حفظ قدرت خرید",
  "/basic-info/definitions/penalty-rate": "تعریف نرخ جرائم",
  "/basic-info/contracts/register": "ثبت قرارداد",
  "/basic-info/contracts/addendum": "ثبت الحاقیه",
  "/basic-info/contracts/supplement": "ثبت متمم",
  "/basic-info/contracts/card": "کارت قرارداد",
  "/basic-info/contracts/progress-billing": "ثبت صورت وضعیت",
  "/basic-info/contracts/payment": "پرداخت قرارداد",
  "/basic-info/contracts/guarantee": "ثبت ضمانتنامه",
  "/basic-info/contracts/change-25": "ثبت افزایش و کاهش ۲۵ درصد",
  "/basic-info/contracts/termination": "خاتمه قرارداد",
  "/basic-info/contracts/cancellation": "فسخ قرارداد",

  // ─── تنظیم اسناد و حسابداری ──────────────────────────────────────────
  "/document-setup/calc-form": "فرم محاسبه",
  "/document-setup/manual-doc": "صدور سند دستی",
  "/document-setup/auto-doc": "صدور سند اتوماتیک",
  "/document-setup/copy-doc": "کپی سند",
  "/document-setup/docs-list": "لیست اسناد",
  "/bookkeeping/ledger-reports/account-review": "مرور حساب‌ها",
  "/bookkeeping/operations-balance": "تراز عملیات",
  "/bookkeeping/bank-reconciliation": "مغایرت بانکی",
};

export function isRouteValid(pathname) {
  const cleanPath = pathname ? pathname.split("?")[0].replace(/\/$/, "") || "/" : "/";
  if (cleanPath === "/") return true;
  if (EXTRA_TITLES[cleanPath]) return true;

  try {
    const menuRoutes = getAllMenuRoutes();
    if (menuRoutes.some((r) => r.path === cleanPath)) return true;
  } catch (e) {
    console.error("Error checking route validity:", e);
  }

  return false;
}

export function getTabTitle(pathname) {
  const cleanPath = pathname ? pathname.split("?")[0].replace(/\/$/, "") || "/" : "/";

  if (EXTRA_TITLES[cleanPath]) {
    return EXTRA_TITLES[cleanPath];
  }

  try {
    const menuRoutes = getAllMenuRoutes();
    const match = menuRoutes.find((r) => r.path === cleanPath);
    if (match && match.label) {
      return match.label;
    }
  } catch (e) {
    console.error("Error getting tab title:", e);
  }

  if (cleanPath === "/") return "داشبورد اصلی";

  return "صفحه یافت نشد";
}
