/**
 * تبدیل تاریخ میلادی به شمسی و برگرداندن بازه سال مالی جاری
 */
export function getCurrentPersianYear() {
  const now = new Date();
  // تقریب ساده: سال شمسی = سال میلادی - 621/622
  // روش دقیق‌تر:
  const persian = now.toLocaleDateString("fa-IR", { year: "numeric" });
  return parseInt(persian.replace(/[^0-9]/g, ""), 10) || new Date().getFullYear() - 621;
}

export function getDefaultDateRange() {
  const year = getCurrentPersianYear();
  return {
    dateFrom: `${year}/01/01`,
    dateTo: `${year}/12/29`,
    fiscalYear: String(year),
  };
}
