export const CREDITS_SUB = [
  { to: "/basic-info/credits/chapters", label: "تعریف فصول" },
  { to: "/basic-info/credits/sub-chapters", label: "تعریف زیرفصول" },
  { to: "/basic-info/credits/chapter-parts", label: "تعریف جز فصول" },
  { to: "/basic-info/credits/chapters-full", label: "تعریف فصول / زیرفصول / جز فصول" },
  { to: "/basic-info/credits/resources", label: "تعریف منابع" },
  { to: "/basic-info/credits/clauses", label: "تعریف بند و اجزا" },
  { to: "/basic-info/credits/deputies", label: "تعریف معاونت‌ها" },
  { to: "/basic-info/credits/departments", label: "تعریف ادارات کل" },
  { to: "/basic-info/credits/representatives", label: "تعریف نمایندگی" },
  { to: "/basic-info/credits/program-specs", label: "تعریف مشخصات برنامه / طرح" },
  { to: "/basic-info/credits/activity-specs", label: "تعریف مشخصات فعالیت / پروژه" },
  { to: "/basic-info/credits/sub-activity-specs", label: "تعریف مشخصات زیرفعالیت / زیرپروژه" },
  { to: "/basic-info/credits/sub-account-agents", label: "تعریف عاملین زیرحساب" },
  { to: "/basic-info/credits/notification-recv", label: "معرفی ابلاغ‌گیرندگان" },
  { to: "/basic-info/credits/misc-payments", label: "تعریف پرداخت‌های متفرقه" },
  { to: "/basic-info/credits/resource-nature", label: "ماهیت منابع" },
  { to: "/basic-info/credits/cost-center", label: "مرکز هزینه" },
  { to: "/basic-info/credits/row", label: "ردیف" },
  { to: "/basic-info/credits/income-type", label: "نوع درآمد" },
  { to: "/basic-info/credits/income-subject", label: "موضوع درآمد / سایر درآمدهای دولت" },
  { to: "/basic-info/credits/tax-period", label: "دوره مالیاتی" },
  { to: "/basic-info/credits/donations-class", label: "طبقه‌بندی هدایا و کمک‌های دریافتی" },
  { to: "/basic-info/credits/securities", label: "اوراق بهادار" },
  { to: "/basic-info/credits/notifier", label: "ابلاغ‌دهنده" },
  { to: "/basic-info/credits/deposit-nature", label: "ماهیت سپرده" },
  { to: "/basic-info/credits/receivables-status", label: "وضعیت مطالبات" },
  { to: "/basic-info/credits/non-final-payment", label: "انواع پرداخت غیرقطعی" },
  { to: "/basic-info/credits/shortage-subject", label: "موضوع کسری ابوابجمعی" },
  { to: "/basic-info/credits/insurance-type", label: "نوع بیمه" },
  { to: "/basic-info/credits/bank-account-type", label: "نوع حساب بانکی" },
  { to: "/basic-info/credits/income-specs", label: "مشخصات درآمد" },
  { to: "/basic-info/credits/creation-year", label: "سال ایجاد" },
  { to: "/basic-info/credits/securities-specs", label: "مشخصات اوراق یا اسناد" },
  { to: "/basic-info/credits/transferred-items", label: "اقلام انتقال‌یافته" },
  { to: "/basic-info/credits/securities-price", label: "تعریف قیمت واحد اوراق بهادار" },
  { to: "/basic-info/credits/fixed-assets-types", label: "تعریف انواع دارایی ثابت" },
  {
    to: "/basic-info/credits/equivalent-detail",
    label: "تفضیلی‌های معادل",
    children: [
      { to: "/basic-info/credits/equivalent-detail/commercial-chapters", label: "فصول بازرگانی" },
      { to: "/basic-info/credits/equivalent-detail/commercial-cost-centers", label: "مراکز هزینه بازرگانی" },
    ],
  },
  { to: "/basic-info/credits/receivables-subject", label: "موضوع مطالبات" },
];

export const BASIC_INFO_SUB = [
  { to: "/basic-info/credits", label: "اعتبارات", children: CREDITS_SUB },
  {
    to: "/basic-info/document-setup",
    label: "تنظیم اسناد",
    children: [
      { to: "/basic-info/document-setup/document-types", label: "تعریف انواع سند" },
      { to: "/basic-info/document-setup/payment-types", label: "تعریف انواع پرداخت" },
    ],
  },
  {
    to: "/basic-info/check-issuance",
    label: "صدور چک",
    children: [
      { to: "/basic-info/check-issuance/bank-branches", label: "تعریف شعب بانکی" },
      { to: "/basic-info/check-issuance/bank-accounts", label: "تعریف شماره حساب بانکی" },
      { to: "/basic-info/check-issuance/checkbooks", label: "تعریف دسته چک هر شماره حساب" },
      { to: "/basic-info/check-issuance/recipients", label: "تعریف گیرندگان چک" },
      { to: "/basic-info/check-issuance/contract-desc", label: "تعریف شرح چک هر قرارداد" },
    ],
  },
  {
    to: "/basic-info/contracts",
    label: "قراردادها",
    children: [
      { to: "/basic-info/contracts/deduction-types", label: "تعریف انواع کسور" },
      { to: "/basic-info/contracts/parties", label: "تعریف طرف قرارداد" },
      { to: "/basic-info/contracts/drafts", label: "تعریف پیش‌نویس قراردادها" },
      { to: "/basic-info/contracts/register", label: "ثبت قراردادها" },
      { to: "/basic-info/contracts/deductions", label: "تعریف کسور هر قرارداد" },
      { to: "/basic-info/contracts/change-25", label: "ثبت افزایش و کاهش ۲۵٪ قرارداد" },
      { to: "/basic-info/contracts/addendum", label: "ثبت متمم قراردادها" },
      { to: "/basic-info/contracts/change-25-addendum", label: "ثبت افزایش و کاهش ۲۵٪ تغییرات" },
      { to: "/basic-info/contracts/report-by-party", label: "گزارش بر اساس طرف قرارداد" },
      { to: "/basic-info/contracts/status", label: "وضعیت قرارداد" },
      { to: "/basic-info/contracts/card", label: "کارت قرارداد" },
      { to: "/basic-info/contracts/payment-statement", label: "صورت پرداخت قراردادها" },
      { to: "/basic-info/contracts/purchase-power-rate", label: "نرخ حفظ قدرت خرید" },
      { to: "/basic-info/contracts/penalty-rate", label: "نرخ درصد محاسبه جرائم" },
    ],
  },
  {
    to: "/basic-info/bookkeeping",
    label: "دفترداری",
    children: [
      { to: "/basic-info/bookkeeping/account-heads", label: "تعریف سرفصل حساب‌ها" },
      { to: "/basic-info/bookkeeping/fiscal-period", label: "تعریف دوره مالی" },
      { to: "/basic-info/bookkeeping/persons", label: "تعریف اشخاص" },
      { to: "/basic-info/bookkeeping/detail", label: "تعریف تفصیلی" },
      { to: "/basic-info/bookkeeping/detail-moein", label: "ارتباط تفصیلی با معین" },
      {
        to: "/basic-info/bookkeeping/reports",
        label: "گزارش‌ها",
        children: [
          { to: "/basic-info/bookkeeping/reports/general-ledger-req", label: "ملزومات حساب کل" },
          { to: "/basic-info/bookkeeping/reports/subsidiary-req", label: "ملزومات حساب معین" },
          { to: "/basic-info/bookkeeping/reports/permanent-equiv", label: "کدهای معادل حساب‌های دائمی" },
        ],
      },
      { to: "/basic-info/bookkeeping/treasurer-moein", label: "ارتباط ذیحساب با معین" },
      { to: "/basic-info/bookkeeping/sanama", label: "الزامات سناما" },
      { to: "/basic-info/bookkeeping/person-replacement", label: "جایگزینی اشخاص" },
    ],
  },
];

export const DOCUMENT_SETUP_TOP = [
  { to: "/document-setup/calc-form", label: "تعریف فرم محاسبه" },
  { to: "/document-setup/calc-form-search", label: "جستجوی فرم‌های محاسبه" },
  { to: "/document-setup/manual-doc", label: "صدور سند دستی" },
  { to: "/document-setup/issue-doc", label: "صدور سند" },
  { to: "/document-setup/search-doc", label: "جستجو در سند" },
  { to: "/document-setup/transfer-doc", label: "انتقال اسناد" },
  {
    to: "/document-setup/report",
    label: "گزارش",
    children: [
      { to: "/document-setup/report/doc-report", label: "گزارش اسناد" },
      { to: "/document-setup/report/no-doc-funded", label: "گزارش تامین اعتبار شده‌هایی که سند ندارند" },
      { to: "/document-setup/report/print-count", label: "گزارش تعداد چاپ سند توسط کاربر" },
      { to: "/document-setup/report/fund-doc-compare", label: "گزارش مقایسه‌ای تامین و سند" },
      { to: "/document-setup/report/revert-calc-form", label: "برگرداندن فرم محاسبه از تامین شده" },
      { to: "/document-setup/report/moein-violation", label: "عدم رعایت الزامات معین" },
      { to: "/document-setup/report/accrual-performance", label: "عملکرد مطابق با رویکرد تعهدی" },
      { to: "/document-setup/report/combined-turnover", label: "گزارش گردش حساب تلفیقی" },
      { to: "/document-setup/report/moein-detail-link", label: "ارتباط معین با تفصیلی‌ها" },
      { to: "/document-setup/report/all-period-docs", label: "گزارش کلیه اسناد دوره مالی" },
      { to: "/document-setup/report/bank-report", label: "گزارش بانک" },
      { to: "/document-setup/report/attachment", label: "مشاهده و ذخیره ضمیمه اسناد" },
    ],
  },
  { to: "/document-setup/copy-doc", label: "کپی اسناد" },
  { to: "/document-setup/payroll-doc", label: "صدور سند حقوق" },
  { to: "/document-setup/empty-doc", label: "درج سند خالی" },
  { to: "/document-setup/receipt-form", label: "فرم دریافت وجه دریافت پرداخت" },
  { to: "/document-setup/income-reg", label: "ثبت درآمد" },
  { to: "/document-setup/securities-reg", label: "ثبت اوراق بهادار" },
  { to: "/document-setup/securities-dist", label: "توزیع اوراق بهادار" },
  { to: "/document-setup/securities-collect", label: "وصول درآمد اوراق بهادار" },
  {
    to: "/document-setup/securities-report",
    label: "گزارشات اوراق",
    children: [{ to: "/document-setup/securities-report/performance", label: "گزارش عملکرد اوراق" }],
  },
  { to: "/document-setup/merge-docs", label: "ادغام اسناد" },
  { to: "/document-setup/assets-doc", label: "صدور سند اموال" },
  { to: "/document-setup/income-doc", label: "ثبت سند درآمدی" },
  { to: "/document-setup/penalty-calc", label: "محاسبه جرائم" },
];

export const TOP_NAV = [
  { to: "/document-setup", label: "تنظیم اسناد", num: 2, subItems: DOCUMENT_SETUP_TOP },
  { to: "/review", label: "رسیدگی", num: 3 },
  { to: "/credits", label: "اعتبارات", num: 4 },
  { to: "/check-issuance", label: "صدور چک", num: 5 },
  { to: "/bookkeeping", label: "دفترداری و تنظیم حساب‌ها", num: 6 },
  { to: "/system-management", label: "مدیریت سیستم", num: 7 },
  { to: "/guarantees", label: "تضمینات", num: 8 },
  { to: "/deposits", label: "سپرده‌ها", num: 9 },
];

/** تمام مسیرهای منو را به‌صورت تخت برمی‌گرداند */
export function flattenMenuItems(items, acc = []) {
  for (const item of items) {
    acc.push({ path: item.to, label: item.label });
    if (item.children?.length) {
      flattenMenuItems(item.children, acc);
    }
  }
  return acc;
}

/** همه مسیرهای قابل کلیک در سایدبار */
export function getAllMenuRoutes() {
  const routes = [{ path: "/basic-info", label: "اطلاعات پایه" }];
  flattenMenuItems(BASIC_INFO_SUB, routes);

  for (const item of TOP_NAV) {
    routes.push({ path: item.to, label: item.label });
    if (item.subItems) {
      flattenMenuItems(item.subItems, routes);
    }
  }

  const unique = new Map();
  for (const route of routes) {
    unique.set(route.path, route.label);
  }
  return Array.from(unique, ([path, label]) => ({ path, label }));
}
