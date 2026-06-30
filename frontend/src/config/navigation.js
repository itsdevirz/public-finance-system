// ─── اطلاعات پایه ────────────────────────────────────────────────────────────
export const BASIC_INFO_SUB = [
  { to: "/basic-info/account-heads", label: "تعریف سرفصل حساب‌ها" },
  {
    to: "/basic-info/definitions",
    label: "تعاریف",
    children: [
      { to: "/basic-info/definitions/fiscal-year", label: "تعریف دوره مالی" },
      { to: "/basic-info/definitions/persons", label: "تعریف اشخاص" },
      { to: "/basic-info/definitions/bank",    label: "تعریف بانک" },
      { to: "/basic-info/definitions/credit",  label: "تعریف اعتبار" },
      { to: "/basic-info/definitions/check",   label: "تعریف چک" },
    ],
  },
  {
    to: "/basic-info/document-setup",
    label: "تنظیم اسناد",
    children: [
      { to: "/basic-info/document-setup/document-types", label: "تعریف انواع سند" },
      { to: "/basic-info/document-setup/payment-types",  label: "تعریف انواع پرداخت" },
    ],
  },
  {
    to: "/basic-info/contracts",
    label: "قراردادها",
    children: [
      { to: "/basic-info/contracts/deduction-types",        label: "تعریف انواع کسور" },
      { to: "/basic-info/contracts/parties",                label: "تعریف طرف قرارداد" },
      { to: "/basic-info/contracts/drafts",                 label: "تعریف پیش‌نویس قراردادها" },
      { to: "/basic-info/contracts/register",               label: "ثبت قراردادها" },
      { to: "/basic-info/contracts/deductions",             label: "تعریف کسور هر قرارداد" },
      { to: "/basic-info/contracts/change-25",              label: "ثبت افزایش و کاهش ۲۵٪ قرارداد" },
      { to: "/basic-info/contracts/addendum",               label: "ثبت متمم قراردادها" },
      { to: "/basic-info/contracts/change-25-addendum",     label: "ثبت افزایش و کاهش ۲۵٪ تغییرات" },
      { to: "/basic-info/contracts/report-by-party",        label: "گزارش بر اساس طرف قرارداد" },
      { to: "/basic-info/contracts/status",                 label: "وضعیت قرارداد" },
      { to: "/basic-info/contracts/card",                   label: "کارت قرارداد" },
      { to: "/basic-info/contracts/payment-statement",      label: "صورت پرداخت قراردادها" },
      { to: "/basic-info/contracts/purchase-power-rate",    label: "نرخ حفظ قدرت خرید" },
      { to: "/basic-info/contracts/penalty-rate",           label: "نرخ درصد محاسبه جرائم" },
    ],
  },
  {
    to: "/basic-info/bookkeeping",
    label: "دفترداری",
    children: [
      { to: "/basic-info/bookkeeping/account-heads",       label: "تعریف سرفصل حساب‌ها" },
      { to: "/basic-info/bookkeeping/fiscal-period",       label: "تعریف دوره مالی" },
      { to: "/basic-info/bookkeeping/detail",              label: "تعریف تفصیلی" },
      { to: "/basic-info/bookkeeping/detail-moein",        label: "ارتباط تفصیلی با معین" },
      {
        to: "/basic-info/bookkeeping/reports",
        label: "گزارش‌ها",
        children: [
          { to: "/basic-info/bookkeeping/reports/general-ledger-req", label: "ملزومات حساب کل" },
          { to: "/basic-info/bookkeeping/reports/subsidiary-req",     label: "ملزومات حساب معین" },
          { to: "/basic-info/bookkeeping/reports/permanent-equiv",    label: "کدهای معادل حساب‌های دائمی" },
        ],
      },
      { to: "/basic-info/bookkeeping/treasurer-moein",    label: "ارتباط ذیحساب با معین" },
      { to: "/basic-info/bookkeeping/sanama",             label: "الزامات سناما" },
      { to: "/basic-info/bookkeeping/person-replacement", label: "جایگزینی اشخاص" },
    ],
  },
];

// ─── تنظیم اسناد ─────────────────────────────────────────────────────────────
export const DOCUMENT_SETUP_TOP = [
  { to: "/document-setup/calc-form",    label: "فرم محاسبه" },
  { to: "/document-setup/manual-doc",   label: "صدور سند دستی" },
  { to: "/document-setup/auto-doc",     label: "صدور سند اتوماتیک" },
  { to: "/document-setup/copy-doc",     label: "کپی سند" },
  { to: "/document-setup/docs-list",    label: "لیست اسناد" },
];

// ─── TOP_NAV — فقط ۹ مورد خواسته‌شده ─────────────────────────────────────────
export const TOP_NAV = [
  // ۲ — تنظیم اسناد
  { to: "/document-setup", label: "تنظیم اسناد", num: 2, subItems: DOCUMENT_SETUP_TOP },

  // ۳ — گزارشات
  {
    to: "/bookkeeping", label: "گزارشات", num: 3, subItems: [
      { to: "/bookkeeping/ledger-reports", label: "گزارش دفاتر", children: [
        { to: "/bookkeeping/ledger-reports/general-ledger",        label: "دفتر کل" },
        { to: "/bookkeeping/ledger-reports/moein-ledger",          label: "دفتر معین" },
        { to: "/bookkeeping/ledger-reports/journal",               label: "دفتر روزنامه" },
        { to: "/bookkeeping/ledger-reports/model-13",              label: "مدل ۱۳" },
        { to: "/bookkeeping/ledger-reports/moein-program-chapter", label: "دفتر معین (معین-برنامه-فصل)" },
        { to: "/bookkeeping/ledger-reports/detail-ledger",         label: "دفتر تفصیلی" },
        { to: "/bookkeeping/ledger-reports/account-review",        label: "مرور حساب‌ها" },
        { to: "/bookkeeping/ledger-reports/securities",            label: "گزارش اوراق بهادار" },
      ]},
      { to: "/bookkeeping/misc-accounts", label: "لیست حساب‌ها", children: [
        { to: "/bookkeeping/misc-accounts/account-groups",  label: "لیست گروه حساب‌ها" },
        { to: "/bookkeeping/misc-accounts/main-accounts",   label: "لیست حساب‌های کل" },
        { to: "/bookkeeping/misc-accounts/moein-accounts",  label: "لیست حساب‌های معین" },
        { to: "/bookkeeping/misc-accounts/detail-accounts", label: "لیست حساب‌های تفصیلی" },
        { to: "/bookkeeping/misc-accounts/detailed-report", label: "گزارش تفصیلی" },
      ]},
      { to: "/bookkeeping/financial-statements", label: "صورت‌های مالی", children: [
        { to: "/bookkeeping/financial-statements/balance-sheet",                 label: "صورت وضعیت مالی" },
        { to: "/bookkeeping/financial-statements/change-in-financial-position",  label: "صورت تغییرات در وضعیت مالی" },
        { to: "/bookkeeping/financial-statements/comparison-budget-performance", label: "مقایسه بودجه و عملکرد" },
        { to: "/bookkeeping/financial-statements/parametric-balance-sheet",      label: "صورت وضعیت مالی پارامتریک" },
        { to: "/bookkeeping/financial-statements/notes",                         label: "یادداشت توضیحی" },
        { to: "/bookkeeping/financial-statements/reports-settings",              label: "تنظیمات گزارش" },
      ]},
      { to: "/bookkeeping/summary-status",       label: "گزارش خلاصه وضعیت" },
      { to: "/bookkeeping/misc-persons", label: "گزارش‌های اشخاص", children: [
        { to: "/bookkeeping/misc-persons/persons-report",  label: "گزارش اشخاص" },
        { to: "/bookkeeping/misc-persons/persons-balance", label: "گزارش مانده اشخاص" },
      ]},
      { to: "/bookkeeping/budget-execution", label: "تفریغ بودجه", children: [
        { to: "/bookkeeping/budget-execution/budget-allocation-setup",      label: "تنظیمات تفریغ بودجه" },
        { to: "/bookkeeping/budget-execution/budget-allocation",            label: "تفریغ بودجه" },
        { to: "/bookkeeping/budget-execution/aggregate-budget-allocation",  label: "تفریغ بودجه تجمیعی" },
      ]},
      { to: "/bookkeeping/accountant-agents",     label: "گزارش عاملین ذیحساب" },
      { to: "/bookkeeping/document-notification", label: "گزارش ابلاغ سند" },
      { to: "/bookkeeping/petty-cash",            label: "گزارش تنخواه" },
    ],
  },

  // ۴ — تراز عملیات
  {
    to: "/bookkeeping/operations-balance", label: "تراز عملیات", num: 4, subItems: [
      { to: "/bookkeeping/operations-balance/different-states",   label: "تراز در حالت‌های مختلف" },
      { to: "/bookkeeping/operations-balance/moein-chapters",     label: "تراز عملیات معین/فصول" },
      { to: "/bookkeeping/operations-balance/moein-detail-link",  label: "ارتباط معین و تفصیلی" },
      { to: "/bookkeeping/operations-balance/samad-system",       label: "سامانه سماد (الف-ب)" },
      { to: "/bookkeeping/operations-balance/sanama-attachments", label: "ضمائم الصاقی سناما" },
    ],
  },

  // ۵ — امکانات
  {
    to: "/system-management", label: "امکانات", num: 5, subItems: [
      { to: "/system-management/users",             label: "تعریف کاربر" },
      { to: "/system-management/user-groups",       label: "تعریف گروه کاربران" },
      { to: "/system-management/permissions",       label: "تعریف دسترسی" },
      { to: "/system-management/change-password",   label: "تغییر رمزعبور" },
      { to: "/system-management/financial-details", label: "مشخصات ذیحسابی" },
      { to: "/system-management/settings",          label: "تنظیمات" },
      { to: "/bookkeeping/bank-reconciliation", label: "مغایرت بانکی", children: [
        { to: "/bookkeeping/bank-reconciliation/account-format-setup",  label: "تنظیم فرمت صورت حساب بانک" },
        { to: "/bookkeeping/bank-reconciliation/account-info-read",     label: "خواندن اطلاعات حساب‌ها" },
        { to: "/bookkeeping/bank-reconciliation/account-reconciliation",label: "مغایرت حساب‌ها" },
      ]},
      { to: "/bookkeeping/smart-control", label: "کنترل هوشمند" },
      { to: "/bookkeeping/account-setup", label: "تنظیم حساب" },
      { to: "/system-management/backup",            label: "پشتیبان‌گیری" },
      { to: "/system-management/report-signature",  label: "تنظیم امضای گزارشات" },
    ],
  },

  // ۶ — الگوی سند
  {
    to: "/system-management/document-templates",
    label: "الگوی سند",
    num: 6,
    subItems: [
      { to: "/system-management/document-templates/current-operations", label: "حسابداری عملیات جاری" },
      { to: "/system-management/document-templates/payroll",            label: "حسابداری حقوق و مزایای مستمر کارکنان" },
      { to: "/system-management/document-templates/capital-operations",  label: "حسابداری عملیات سرمایه‌ای" },
      { to: "/system-management/document-templates/revenues",            label: "حسابداری درآمدها" },
      { to: "/system-management/document-templates/deposits",            label: "حسابداری وجوه سپرده" },
      { to: "/system-management/document-templates/special-cases",       label: "حسابداری موارد خاص" },
    ],
  },

  // ۷ — دستیار هوش مصنوعی
  {
    to: "/ai", label: "دستیار هوشمند مالی (AI)", num: 7, subItems: [
      { to: "/ai/chat", label: "گفتگو با دستیار" },
    ],
  },

  // ۷ — سیستم حقوق و دستمزد
  {
    to: "/payroll", label: "سیستم حقوق و دستمزد", num: 8, subItems: [
      { to: "/payroll/dashboard", label: "داشبورد حقوق" },
      { to: "/payroll/employees", label: "اطلاعات کارکنان", children: [
        { to: "/payroll/employees/list",      label: "لیست کارکنان" },
        { to: "/payroll/employees/new",       label: "ثبت کارمند جدید" },
        { to: "/payroll/employees/contracts", label: "قراردادها" },
        { to: "/payroll/employees/decrees",   label: "احکام حقوقی" },
      ]},
      { to: "/payroll/attendance", label: "حضور و غیاب", children: [
        { to: "/payroll/attendance/register", label: "ثبت کارکرد ماه" },
        { to: "/payroll/attendance/list",     label: "لیست کارکرد" },
        { to: "/payroll/attendance/leave",    label: "مرخصی‌ها" },
        { to: "/payroll/attendance/mission",  label: "مأموریت" },
      ]},
      { to: "/payroll/calculate", label: "محاسبه حقوق", children: [
        { to: "/payroll/calculate/monthly",   label: "محاسبه ماهانه" },
        { to: "/payroll/calculate/settings",  label: "تنظیمات محاسبه" },
        { to: "/payroll/calculate/tax-table", label: "جدول مالیات" },
        { to: "/payroll/calculate/insurance", label: "تنظیمات بیمه" },
      ]},
      { to: "/payroll/payslip", label: "فیش حقوقی", children: [
        { to: "/payroll/payslip/view",  label: "مشاهده فیش حقوقی" },
        { to: "/payroll/payslip/print", label: "چاپ فیش حقوقی" },
        { to: "/payroll/payslip/bulk",  label: "چاپ گروهی فیش‌ها" },
      ]},
      { to: "/payroll/loans", label: "وام و مساعده", children: [
        { to: "/payroll/loans/new",     label: "ثبت وام" },
        { to: "/payroll/loans/list",    label: "لیست وام‌ها" },
        { to: "/payroll/loans/advance", label: "مساعده" },
        { to: "/payroll/loans/balance", label: "مانده وام کارکنان" },
      ]},
      { to: "/payroll/reports", label: "گزارش‌ها", children: [
        { to: "/payroll/reports/list",      label: "لیست حقوق ماهانه" },
        { to: "/payroll/reports/insurance", label: "لیست بیمه" },
        { to: "/payroll/reports/tax",       label: "لیست مالیات" },
        { to: "/payroll/reports/overtime",  label: "گزارش اضافه‌کاری" },
        { to: "/payroll/reports/absence",   label: "گزارش غیبت" },
        { to: "/payroll/reports/leave",     label: "گزارش مرخصی" },
        { to: "/payroll/reports/unit-cost", label: "هزینه حقوق واحدها" },
        { to: "/payroll/reports/annual",    label: "گزارش سالانه حقوق" },
        { to: "/payroll/reports/eid",       label: "گزارش عیدی و سنوات" },
      ]},
    ],
  },

  // ۸ — سیستم انبار
  {
    to: "/warehouse", label: "سیستم انبار", num: 9, subItems: [
      { to: "/warehouse/dashboard", label: "داشبورد انبار" },
      { to: "/warehouse/items", label: "مدیریت کالاها", children: [
        { to: "/warehouse/items/list",       label: "لیست کالاها" },
        { to: "/warehouse/items/new",        label: "ثبت کالای جدید" },
        { to: "/warehouse/items/categories", label: "دسته‌بندی کالاها" },
        { to: "/warehouse/items/barcodes",   label: "بارکد و QR Code" },
      ]},
      { to: "/warehouse/stores", label: "مدیریت انبارها", children: [
        { to: "/warehouse/stores/list",  label: "لیست انبارها" },
        { to: "/warehouse/stores/new",   label: "ثبت انبار جدید" },
        { to: "/warehouse/stores/stock", label: "موجودی کالا در انبار" },
      ]},
      { to: "/warehouse/receipts", label: "ورود کالا (رسید)", children: [
        { to: "/warehouse/receipts/new",         label: "رسید جدید" },
        { to: "/warehouse/receipts/list",        label: "لیست رسیدها" },
        { to: "/warehouse/receipts/purchase",    label: "رسید خرید" },
        { to: "/warehouse/receipts/return",      label: "برگشت از مصرف" },
        { to: "/warehouse/receipts/transfer-in", label: "رسید انتقال از انبار دیگر" },
      ]},
      { to: "/warehouse/issues", label: "خروج کالا (حواله)", children: [
        { to: "/warehouse/issues/new",         label: "حواله جدید" },
        { to: "/warehouse/issues/list",        label: "لیست حواله‌ها" },
        { to: "/warehouse/issues/consumption", label: "مصرف داخلی" },
        { to: "/warehouse/issues/delivery",    label: "تحویل به پرسنل" },
        { to: "/warehouse/issues/scrap",       label: "اسقاط" },
      ]},
      { to: "/warehouse/requests", label: "درخواست کالا", children: [
        { to: "/warehouse/requests/new",     label: "درخواست جدید" },
        { to: "/warehouse/requests/list",    label: "لیست درخواست‌ها" },
        { to: "/warehouse/requests/pending", label: "در انتظار تایید" },
        { to: "/warehouse/requests/approve", label: "تایید درخواست‌ها" },
      ]},
      { to: "/warehouse/transfers", label: "انتقال بین انبارها", children: [
        { to: "/warehouse/transfers/new",     label: "انتقال جدید" },
        { to: "/warehouse/transfers/list",    label: "لیست انتقالات" },
        { to: "/warehouse/transfers/confirm", label: "تایید دریافت" },
      ]},
      { to: "/warehouse/inventory", label: "انبارگردانی", children: [
        { to: "/warehouse/inventory/new",         label: "شروع انبارگردانی" },
        { to: "/warehouse/inventory/count",       label: "ثبت شمارش" },
        { to: "/warehouse/inventory/discrepancy", label: "گزارش مغایرت" },
        { to: "/warehouse/inventory/history",     label: "تاریخچه انبارگردانی" },
      ]},
      { to: "/warehouse/suppliers", label: "تامین‌کنندگان", children: [
        { to: "/warehouse/suppliers/list", label: "لیست تامین‌کنندگان" },
        { to: "/warehouse/suppliers/new",  label: "ثبت تامین‌کننده" },
      ]},
      { to: "/warehouse/reports", label: "گزارش‌ها", children: [
        { to: "/warehouse/reports/stock",          label: "موجودی لحظه‌ای" },
        { to: "/warehouse/reports/stock-by-store", label: "موجودی هر انبار" },
        { to: "/warehouse/reports/stock-by-group", label: "موجودی هر گروه" },
        { to: "/warehouse/reports/turnover",       label: "گردش ورود و خروج" },
        { to: "/warehouse/reports/transfers",      label: "گزارش انتقالات" },
        { to: "/warehouse/reports/shortage",       label: "کالاهای کمتر از نقطه سفارش" },
        { to: "/warehouse/reports/discrepancy",    label: "مغایرت‌های انبار" },
        { to: "/warehouse/reports/audit",          label: "تاریخچه عملیات (Audit)" },
      ]},
    ],
  },

  // ۹ — سیستم اموال
  {
    to: "/assets", label: "سیستم اموال", num: 10, subItems: [
      { to: "/assets/basic-info", label: "اطلاعات پایه", children: [
        { to: "/assets/basic-info/asset-groups",          label: "تعریف گروه اموال" },
        { to: "/assets/basic-info/asset-subgroups",       label: "تعریف زیرگروه اموال" },
        { to: "/assets/basic-info/asset-types",           label: "تعریف نوع مال (مصرفی/غیرمصرفی)" },
        { to: "/assets/basic-info/asset-nature",          label: "تعریف ماهیت مال (منقول/غیرمنقول)" },
        { to: "/assets/basic-info/units",                 label: "تعریف واحد اندازه‌گیری" },
        { to: "/assets/basic-info/locations",             label: "تعریف مکان‌ها (ساختمان/طبقه/اتاق)" },
        { to: "/assets/basic-info/suppliers",             label: "تعریف تامین‌کنندگان" },
        { to: "/assets/basic-info/depreciation-methods",  label: "روش‌های استهلاک" },
      ]},
      { to: "/assets/register", label: "ثبت اموال", children: [
        { to: "/assets/register/new",      label: "ثبت مال جدید" },
        { to: "/assets/register/delivery", label: "تحویل به پرسنل" },
        { to: "/assets/register/scrap",    label: "اسقاط مال" },
        { to: "/assets/register/sale",     label: "فروش مال" },
        { to: "/assets/register/lost",     label: "ثبت مفقودی" },
      ]},
      { to: "/assets/depreciation", label: "استهلاک", children: [
        { to: "/assets/depreciation/setup",    label: "تنظیم استهلاک" },
        { to: "/assets/depreciation/monthly",  label: "محاسبه استهلاک ماهانه" },
        { to: "/assets/depreciation/annual",   label: "محاسبه استهلاک سالانه" },
        { to: "/assets/depreciation/document", label: "صدور سند استهلاک" },
      ]},
      { to: "/assets/warehouse", label: "انبار و موجودی", children: [
        { to: "/assets/warehouse/receipt",   label: "رسید انبار (اموال مصرفی)" },
        { to: "/assets/warehouse/issue",     label: "حواله انبار" },
        { to: "/assets/warehouse/balance",   label: "موجودی انبار" },
        { to: "/assets/warehouse/min-stock", label: "هشدار حداقل موجودی" },
      ]},
      { to: "/assets/reports", label: "گزارش‌ها", children: [
        { to: "/assets/reports/all",                      label: "لیست کلیه اموال" },
        { to: "/assets/reports/by-unit",                  label: "اموال هر واحد" },
        { to: "/assets/reports/by-employee",              label: "اموال هر کارمند" },
        { to: "/assets/reports/labeled",                  label: "اموال برچسب‌دار" },
        { to: "/assets/reports/unlabeled",                label: "اموال بدون برچسب" },
        { to: "/assets/reports/depreciation-monthly",    label: "استهلاک ماهانه" },
        { to: "/assets/reports/depreciation-annual",     label: "استهلاک سالانه" },
        { to: "/assets/reports/depreciation-cumulative", label: "استهلاک انباشته" },
        { to: "/assets/reports/book-value",              label: "ارزش دفتری اموال" },
        { to: "/assets/reports/lost",                    label: "اموال مفقود" },
        { to: "/assets/reports/scrapped",                label: "اموال اسقاطی" },
        { to: "/assets/reports/in-repair",               label: "اموال در تعمیر" },
        { to: "/assets/reports/transferred",             label: "اموال منتقل شده" },
      ]},
    ],
  },
];

// ─── helper functions ────────────────────────────────────────────────────────
export function flattenMenuItems(items, acc = []) {
  for (const item of items) {
    acc.push({ path: item.to, label: item.label });
    if (item.children?.length) flattenMenuItems(item.children, acc);
    if (item.subItems?.length) flattenMenuItems(item.subItems, acc);
  }
  return acc;
}

export function getAllMenuRoutes() {
  const routes = [{ path: "/basic-info", label: "اطلاعات پایه" }];
  flattenMenuItems(BASIC_INFO_SUB, routes);

  for (const item of TOP_NAV) {
    routes.push({ path: item.to, label: item.label });
    if (item.subItems) flattenMenuItems(item.subItems, routes);
  }

  const unique = new Map();
  for (const route of routes) unique.set(route.path, route.label);
  return Array.from(unique, ([path, label]) => ({ path, label }));
}
