import { getAllMenuRoutes } from "@/config/navigation";

const EXTRA_TITLES = {
  "/": "داشبورد اصلی",
  "/login": "ورود به سیستم",
  "/guarantees/register/contract": "ثبت قرارداد ضمانت‌نامه",
  "/deposits/manual-form": "ثبت دستی سپرده",
  "/basic-info": "اطلاعات پایه",
  "/document-setup": "تنظیم اسناد",
  "/reports": "گزارشات مالی و حسابداری",
  "/system-management": "مدیریت سیستم و امکانات",
  "/credits": "مدیریت اعتبارات",
  "/payroll": "سیستم حقوق و دستمزد",
  "/warehouse": "سیستم انبار",
  "/assets": "سیستم اموال",
  "/ai": "دستیار هوشمند مالی (AI)",
};

export function getTabTitle(pathname) {
  if (EXTRA_TITLES[pathname]) {
    return EXTRA_TITLES[pathname];
  }

  try {
    const menuRoutes = getAllMenuRoutes();
    const match = menuRoutes.find((r) => r.path === pathname);
    if (match && match.label) {
      return match.label;
    }
  } catch (e) {
    console.error("Error getting tab title:", e);
  }

  // Fallback formatting for path
  const cleanPath = pathname.replace(/^\//, "");
  if (!cleanPath) return "داشبورد اصلی";

  const parts = cleanPath.split("/");
  const lastPart = parts[parts.length - 1];
  
  return decodeURIComponent(lastPart).replace(/-/g, " ");
}
