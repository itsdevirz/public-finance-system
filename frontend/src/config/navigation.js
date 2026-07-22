// ─── اطلاعات پایه ────────────────────────────────────────────────────────────
export const BASIC_INFO_SUB = [
  { to: "/basic-info/account-heads", label: "سرفصل حساب‌ها" },
  {
    to: "/basic-info/definitions",
    label: "تعاریف",
    children: [
      { to: "/basic-info/definitions/fiscal-year", label: "تعریف دوره مالی" },
      { to: "/basic-info/definitions/persons", label: "تعریف اشخاص" },
      { to: "/basic-info/definitions/bank",    label: "تعریف بانک" },
      { to: "/basic-info/definitions/credit",  label: "تعریف اعتبار" },
      { to: "/basic-info/definitions/check",   label: "تعریف چک" },
      { to: "/basic-info/definitions/contract-types", label: "تعریف انواع قرارداد" },
      { to: "/basic-info/definitions/deduction-types", label: "تعریف انواع کسور" },
      { to: "/basic-info/definitions/guarantee-types", label: "تعریف نوع ضمانتنامه" },
      { to: "/basic-info/definitions/parties", label: "تعریف طرف قرارداد" },
      { to: "/basic-info/definitions/assignment-methods", label: "تعریف روش واگذاری" },
      { to: "/basic-info/definitions/purchase-power-rate", label: "تعریف نرخ حفظ قدرت خرید" },
      { to: "/basic-info/definitions/penalty-rate", label: "تعریف نرخ جرائم" },
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
      { to: "/basic-info/contracts/register",               label: "ثبت قرارداد" },
      { to: "/basic-info/contracts/addendum",               label: "ثبت الحاقیه" },
      { to: "/basic-info/contracts/supplement",             label: "ثبت متمم" },
      { to: "/basic-info/contracts/card",                   label: "کارت قرارداد" },
      { to: "/basic-info/contracts/progress-billing",       label: "ثبت صورت وضعیت" },
      { to: "/basic-info/contracts/payment",                label: "پرداخت قرارداد" },
      { to: "/basic-info/contracts/guarantee",              label: "ثبت ضمانتنامه" },
      { to: "/basic-info/contracts/change-25",              label: "ثبت افزایش و کاهش ۲۵ درصد" },
      { to: "/basic-info/contracts/termination",            label: "خاتمه قرارداد" },
      { to: "/basic-info/contracts/cancellation",           label: "فسخ قرارداد" },
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
    to: "/reports", label: "گزارشات", num: 3, subItems: [
      // ۱. مرور حساب
      {
        to: "/bookkeeping/ledger-reports/account-review",
        label: "مرور حساب",
      },
      // ۲. گزارش‌های اسناد حسابداری
      {
        to: "/reports/documents",
        label: "گزارش‌های اسناد حسابداری",
      },
      // ۳. گزارش‌های حساب‌ها
      {
        to: "/reports/accounts",
        label: "گزارش‌های حساب‌ها",
      },
      // ۴. گزارش‌های بودجه
      {
        to: "/reports/budget",
        label: "گزارش‌های بودجه",
      },
      // ۵. گزارش‌های دریافت و پرداخت
      {
        to: "/reports/payments",
        label: "گزارش‌های دریافت و پرداخت",
      },
      // ۶. گزارش‌های مالی
      {
        to: "/reports/financial",
        label: "گزارش‌های مالی",
      },
      // ۷. گزارش‌های مدیریتی
      {
        to: "/reports/management",
        label: "گزارش‌های مدیریتی",
      },
      // ۸. گزارش قراردادها
      {
        to: "/reports/contracts",
        label: "گزارش قراردادها",
        children: [
          { to: "/reports/contracts/dashboard",    label: "داشبورد" },
          { to: "/reports/contracts/list",         label: "گزارش قراردادها" },
          { to: "/reports/contracts/payments",     label: "گزارش پرداختها" },
          { to: "/reports/contracts/guarantees",   label: "گزارش ضمانتها" },
          { to: "/reports/contracts/deductions",   label: "گزارش کسورات" },
          { to: "/reports/contracts/change-25",    label: "گزارش افزایش و کاهش" },
          { to: "/reports/contracts/by-party",     label: "گزارش طرف قرارداد" },
        ],
      },
      // ۹. خروجی سناما
      {
        to: "/reports/sanama-export",
        label: "خروجی سناما",
      },
      // ۱۰. فرم‌های استاندارد سناما
      {
        to: "/reports/sanama-forms",
        label: "فرم‌های استاندارد سناما",
      },
    ],
  },

  // ۴ — تراز عملیات
  {
    to: "/bookkeeping/operations-balance", label: "تراز عملیات", num: 4, subItems: [
      { to: "/bookkeeping/operations-balance/4-column",  label: "تراز ۴ ستونی" },
      { to: "/bookkeeping/operations-balance/6-column",  label: "تراز ۶ ستونی" },
      { to: "/bookkeeping/operations-balance/8-column",  label: "تراز ۸ ستونی" },
    ],
  },

  // ۵ — امکانات
  {
    to: "/system-management", label: "امکانات", num: 5, subItems: [
      { to: "/system-management/users",             label: "تعریف کاربر" },
      { to: "/system-management/financial-details", label: "مشخصات ذیحسابی" },
      { to: "/system-management/settings",          label: "تنظیمات" },
      { to: "/bookkeeping/bank-reconciliation", label: "مغایرت بانکی", children: [
        { to: "/bookkeeping/bank-reconciliation/account-format-setup",  label: "تنظیم فرمت صورت حساب بانک" },
        { to: "/bookkeeping/bank-reconciliation/account-info-read",     label: "خواندن اطلاعات حساب‌ها" },
        { to: "/bookkeeping/bank-reconciliation/account-reconciliation",label: "مغایرت حساب‌ها" },
      ]},
      { to: "/bookkeeping/smart-control", label: "کنترل هوشمند", children: [
        { to: "/bookkeeping/smart-control/sanama-performance", label: "کنترل فرم عملکرد (سناما)" },
      ]},
      { to: "/system-management/sanama-file-check", label: "ممیزی فرم عملکرد سناما", children: [
        { to: "/system-management/sanama-file-check/expense", label: "۱. هزینه" },
        { to: "/system-management/sanama-file-check/capital", label: "۲. تملک" },
        { to: "/system-management/sanama-file-check/financial-statements", label: "۳. تهیه صورت‌های مالی" },
      ]},
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

  // ۷ — مدیریت اعتبارات
  {
    to: "/credits",
    label: "مدیریت اعتبارات",
    num: 7,
    subItems: [
      { to: "/credits", label: "داشبورد اعتبارات" },
      { to: "/credits/agreements", label: "ثبت موافقت‌نامه" },
      { to: "/credits/allocation-no-doc", label: "تخصیص اعتبار" },
      { to: "/credits/requests", label: "درخواست وجه" },
      { to: "/credits/notification/request", label: "ابلاغ و انتقال اعتبار" },
    ]
  },

  // ۸ — دستیار هوش مصنوعی
  {
    to: "/ai", label: "دستیار هوشمند مالی (AI)", num: 8, subItems: [
      { to: "/ai/chat", label: "گفتگو با دستیار" },
    ],
  },

  // ۹ — سیستم حقوق و دستمزد
  {
    to: "/payroll", label: "سیستم حقوق و دستمزد", num: 9, subItems: [
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
      { to: "/payroll/payslip", label: "فیش حقوقی" },
      { to: "/payroll/loans", label: "وام و مساعده", children: [
        { to: "/payroll/loans/new",     label: "ثبت وام" },
        { to: "/payroll/loans/list",    label: "لیست وام‌ها" },
        { to: "/payroll/loans/advance", label: "مساعده" },
      ]},
      { to: "/payroll/reports", label: "گزارش‌ها" },
    ],
  },

  // ۱۰ — سیستم انبار
  {
    to: "/warehouse", label: "سیستم انبار", num: 10, subItems: [
      { to: "/warehouse/dashboard", label: "داشبورد انبار" },
      { to: "/warehouse/items", label: "مدیریت کالاها" },
      { to: "/warehouse/stores", label: "مدیریت انبارها" },
      { to: "/warehouse/receipts", label: "ورود کالا (رسید)" },
      { to: "/warehouse/issues", label: "خروج کالا (حواله)" },
      { to: "/warehouse/requests", label: "درخواست کالا" },
      { to: "/warehouse/transfers", label: "انتقال بین انبارها" },
      { to: "/warehouse/inventory", label: "انبارگردانی" },
      { to: "/warehouse/suppliers", label: "تامین‌کنندگان" },
      { to: "/warehouse/employees", label: "تعریف کارکنان" },
      { to: "/warehouse/reports", label: "گزارش‌ها" },
    ],
  },

  // ۱۱ — سیستم اموال
  {
    to: "/assets", label: "سیستم اموال", num: 11, subItems: [
      { to: "/assets/dashboard", label: "داشبورد اموال" },
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
        { to: "/assets/register/repair",   label: "تعمیر اموال" },
        { to: "/assets/register/transfer", label: "انتقال اموال" },
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
      { to: "/assets/reports", label: "گزارش‌ها" },
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
