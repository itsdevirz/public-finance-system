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

export const REVIEW_REPORTS_SUB = [
  { to: "/review/reports/contract-card", label: "گزارش کارت قرارداد" },
  { to: "/review/reports/contract-card-summary", label: "گزارش کارت قرارداد خلاصه" },
];

export const REVIEW_SUB = [
  { to: "/review/reports", label: "گزارش‌ها", children: REVIEW_REPORTS_SUB },
  { to: "/review/fixed-transfer", label: "حواله ثابت" },
  { to: "/review/construction-deposit", label: "واریزی عمرانی" },
  { to: "/review/current-payment", label: "پرداختی جاری" },
  { to: "/review/current-deposit", label: "واریزی جاری" },
  { to: "/review/warehouse-receipt-transfer", label: "رسیدگی رسید و حواله انبار" },
  { to: "/review/cartable", label: "کارتابل" },
  { to: "/review/agent-submissions", label: "رسیدگی ارسالی‌های عاملین" },
  { to: "/review/attachments", label: "الصاق ضمائم" },
];

export const CREDITS_TOP_SUB = [
  { to: "/credits/agreements", label: "موافقت نامه" },
  { to: "/credits/allocation-no-doc", label: "تخصیص بدون سند" },
  {
    to: "/credits/search",
    label: "جستجو در موافقت نامه، تخصیص و دریافت وجه",
  },
  { to: "/credits/receipt-no-doc", label: "دریافت وجه بدون سند" },
  { to: "/credits/funded", label: "اعتبار تامین شده" },
  { to: "/credits/funded-search", label: "جستجو در اعتبار تامین شده" },
  { to: "/credits/funded-copy", label: "کپی تامین اعتبار" },
  { to: "/credits/funded-merge", label: "ادغام تامین اعتبار" },
  { to: "/credits/payroll-from-excel", label: "تامین حقوق از اکسل" },
  { to: "/credits/payroll-funding", label: "تامین اعتبار حقوق" },
  { to: "/credits/payment-request-no-doc", label: "درخواست وجه بدون سند" },
  {
    to: "/credits/notification",
    label: "ابلاغ",
    children: [
      { to: "/credits/notification/request", label: "درخواست ابلاغ" },
      { to: "/credits/notification/bank-report", label: "گزارش اعلام به بانک" },
      { to: "/credits/notification/court-form", label: "فرم دیوان محاسبات" },
      { to: "/credits/notification/recipients-report", label: "گزارش ابلاغ گیرندگان" },
      { to: "/credits/notification/request-report", label: "گزارش درخواست ابلاغ" },
      { to: "/credits/notification/recipients-detail-report", label: "گزارش ابلاغ گیرندگان تفکیکی" },
      { to: "/credits/notification/fund-confirmation", label: "تاییدیه وجوه ابلاغی" },
      { to: "/credits/notification/supplementary-report", label: "گزارش تکمیلی ابلاغ" },
      { to: "/credits/notification/copy-request", label: "کپی درخواست ابلاغ" },
    ],
  },
  {
    to: "/credits/reports",
    label: "گزارش ها",
    children: [
      { to: "/credits/reports/budget", label: "گزارش های بودجه ای", children: [
        { to: "/credits/reports/budget/all-programs", label: "لیست کلیه برنامه ها" },
        { to: "/credits/reports/budget/program-activities", label: "لیست فعالیت های یک برنامه" },
        { to: "/credits/reports/budget/funded-programs", label: "لیست برنامه های دارای اعتبار" },
        { to: "/credits/reports/budget/dept-by-deputy", label: "لیست ادارات کل هر معاونت" },
        { to: "/credits/reports/budget/deputy-activities", label: "لیست فعالیت های یک معاونت" },
        { to: "/credits/reports/budget/program-agents", label: "لیست عامل های ذیحساب یک برنامه" },
        { to: "/credits/reports/budget/program-notif-receivers", label: "لیست ابلاغ گیرندگان از یک برنامه" },
        { to: "/credits/reports/budget/activity-notif-receivers", label: "لیست ابلاغ گیرندگان از یک فعالیت" },
        { to: "/credits/reports/budget/misc-payments", label: "لیست پرداخت های متفرقه" },
        { to: "/credits/reports/budget/contracts-by-program", label: "لیست قراردادهای یک برنامه/فعالیت/زیرفعالیت" },
        { to: "/credits/reports/budget/contract-programs", label: "لیست برنامه های یک قرارداد" },
        { to: "/credits/reports/budget/contract-activities", label: "لیست فعالیت های یک قرارداد" },
        { to: "/credits/reports/budget/contract-sub-activities", label: "لیست زیرفعالیت های یک قرارداد" },
      ] },
      { to: "/credits/reports/performance", label: "گزارش های عملکردی", children: [
        { to: "/credits/reports/performance/program-stats", label: "آمار عملکرد برنامه ها به تفکیک هر برنامه" },
        { to: "/credits/reports/performance/by-program", label: "گزارش اعتبارات به تفکیک برنامه" },
        { to: "/credits/reports/performance/by-chapter-program", label: "گزارش اعتبارات به تفکیک فصل های یک برنامه-2" },
        { to: "/credits/reports/performance/by-deputy", label: "گزارش اعتبارات برحسب معاونت برنامه" },
        { to: "/credits/reports/performance/summary", label: "گزارش خلاصه اعتبارات" },
        { to: "/credits/reports/performance/funding", label: "گزارش تامین اعتبار" },
        { to: "/credits/reports/performance/by-agent", label: "گزارش اعتبارات به تفکیک عامل ذیحساب" },
        { to: "/credits/reports/performance/by-notif-receiver", label: "گزارش اعتبارات به تفکیک ابلاغ گیرنده" },
      ] },
      { to: "/credits/reports/ledgers", label: "دفاتر اعتبارات", children: [
        { to: "/credits/reports/ledgers/program-level", label: "درسطح برنامه/طرح-فعالیت/پروژه-زیرفعالیت/زیرپروژه" },
        { to: "/credits/reports/ledgers/contract-level", label: "درسطح قرارداد" },
        { to: "/credits/reports/ledgers/agent-level", label: "درسطح عامل ذیحساب" },
        { to: "/credits/reports/ledgers/notif-receiver-level", label: "درسطح ابلاغ گیرندگان" },
        { to: "/credits/reports/ledgers/misc-level", label: "درسطح متفرقه" },
        { to: "/credits/reports/ledgers/interim-docs", label: "دفتر اعتبارات اسناد بین راهی" },
        { to: "/credits/reports/ledgers/documentary", label: "دفتر اعتبارات اسنادی" },
        { to: "/credits/reports/ledgers/petty-cash", label: "گزارش تنخواه" },
        { to: "/credits/reports/ledgers/overall", label: "گزارش اعتباری کلی" },
      ] },
      { to: "/credits/reports/agreements", label: "گزارش های موافقت نامه ای", children: [
        { to: "/credits/reports/agreements/by-detail", label: "اعتبارات به تفکیک", children: [
          { to: "/credits/reports/agreements/by-detail/program", label: "برنامه" },
          { to: "/credits/reports/agreements/by-detail/activity", label: "فعالیت" },
          { to: "/credits/reports/agreements/by-detail/clause", label: "بند و اجرا" },
          { to: "/credits/reports/agreements/by-detail/investment-chapters", label: "فصول سرمایه گذاری" },
          { to: "/credits/reports/agreements/by-detail/expense-resources", label: "اعتبارات هزینه و منابع" },
        ] },
        { to: "/credits/reports/agreements/expense-resources", label: "موافقت نامه اعتبارات هزینه ای و منابع", children: [
          { to: "/credits/reports/agreements/expense-resources/form-2a", label: "فرم دو الف-اعتبارات هزینه ای بر حسب برنامه/فصل" },
          { to: "/credits/reports/agreements/expense-resources/form-4-chapters", label: "فرم شماره چهار-شروع شرح فصول هزینه" },
          { to: "/credits/reports/agreements/expense-resources/form-4-personnel", label: "فرم شماره چهار-انتساب هزینه های پرسنلی" },
          { to: "/credits/reports/agreements/expense-resources/form-5-income", label: "فرم شماره پنج-درآمدها-واگذاری دارایی های سرمایه ای و مالی" },
          { to: "/credits/reports/agreements/expense-resources/form-1-summary", label: "فرم شماره یک-خلاصه بودجه دستگاه" },
          { to: "/credits/reports/agreements/expense-resources/form-6-manpower", label: "فرم شماره شش-نیروی انسانی" },
          { to: "/credits/reports/agreements/expense-resources/form-4b-non-personnel", label: "فرم شماره چهار ب-انتساب هزینه های غیر پرسنلی" },
          { to: "/credits/reports/agreements/expense-resources/form-3-program-activity", label: "فرم شماره سه-اعتبارات هزینه ای بر حسب برنامه/فعالیت و اهداف کمی" },
          { to: "/credits/reports/agreements/expense-resources/form-2b-annual-plan", label: "فرم شماره دو ب-ارتباط برنامه سالانه با مراکز فعالیت اصلی" },
          { to: "/credits/reports/agreements/expense-resources/form-7-provincial", label: "فرم شماره هفت-توزیع استانی اعتبارات" },
          { to: "/credits/reports/agreements/expense-resources/form-2-expense-program", label: "فرم شماره دو-اعتبارات هزینه بر حسب برنامه" },
        ] },
        { to: "/credits/reports/agreements/form-four", label: "فرم چهار موافقت نامه" },
        { to: "/credits/reports/agreements/detailed-budget", label: "گزارش بودجه تفصیلی" },
        { to: "/credits/reports/agreements/payment-control", label: "گزارش کنترل پرداخت های بودجه، فرم شماره پنج" },
      ] },
      { to: "/credits/reports/allocation", label: "گزارش های تخصیص اعتبار", children: [
        { to: "/credits/reports/allocation/by-program", label: "لیست تخصیص اعتبار بر حسب برنامه" },
        { to: "/credits/reports/allocation/all", label: "لیست کلیه تخصیص اعتبارات" },
        { to: "/credits/reports/allocation/program-chapter", label: "لیست تخصیص اعتبار برنامه فصل" },
      ] },
      { to: "/credits/reports/receipts", label: "گزارش های دریافت وجه", children: [
        { to: "/credits/reports/receipts/all", label: "لیست کلیه دریافتی ها" },
        { to: "/credits/reports/receipts/no-program", label: "لیست دریافتی های بدون برنامه" },
      ] },
      { to: "/credits/reports/credits-1", label: "گزارش اعتبارات-1" },
      { to: "/credits/reports/payment-request-no-doc", label: "گزارش درخواست وجه بدون سند" },
      { to: "/credits/reports/comprehensive", label: "گزارش جامع اعتبارات" },
      { to: "/credits/reports/commercial", label: "گزارش بازرگانی" },
      { to: "/credits/reports/by-detail", label: "گزارش اعتبارات بر حسب تفصیل" },
    ],
  },
  { to: "/credits/sub-accountant-agent", label: "عامل ذیحساب", children: [
    { to: "/credits/sub-accountant-agent/version-1", label: "نسخه اول", children: [
      { to: "/credits/sub-accountant-agent/version-1/total-credit-form", label: "فرم تعیین اعتبار کلی" },
      { to: "/credits/sub-accountant-agent/version-1/agent-requests", label: "درخواست وجه های عاملین" },
      { to: "/credits/sub-accountant-agent/version-1/agent-expenses", label: "هزینه های عاملین" },
      { to: "/credits/sub-accountant-agent/version-1/fund-from-expense", label: "ثبت تامین اعتبار از هزینه" },
    ] },
    { to: "/credits/sub-accountant-agent/version-2", label: "نسخه دوم", children: [
      { to: "/credits/sub-accountant-agent/version-2/send-credit", label: "ارسال اعتبار به عامل" },
      { to: "/credits/sub-accountant-agent/version-2/confirm-issue", label: "تایید و صدور تامین برای عامل" },
    ] },
    { to: "/credits/sub-accountant-agent/view-confirm-credit", label: "مشاهده و تایید اعتبار" },
    { to: "/credits/sub-accountant-agent/view-confirm-request", label: "مشاهده و تایید درخواست" },
    { to: "/credits/sub-accountant-agent/view-confirm-expense", label: "مشاهده و تایید هزینه" },
    { to: "/credits/sub-accountant-agent/plan-program-percent", label: "درصد طرح/برنامه" },
    { to: "/credits/sub-accountant-agent/cost-center-relation", label: "ارتباط مراکز هزینه" },
    { to: "/credits/sub-accountant-agent/agents-relation", label: "ارتباط عاملین ذیحساب" },
  ] },
  { to: "/credits/read-from-file", label: "خواندن اطلاعات از فایل" },
  { to: "/credits/warehouse-receipt-reg", label: "ثبت اعتبارات رسید و حواله انبار" },
  { to: "/credits/fund-from-doc", label: "ثبت تامین اعتبار از سند" },
  { to: "/credits/warehouse-fund-template", label: "قالب تامین اعتبار انبار" },
];

export const CHECK_ISSUANCE_TOP = [
  { to: "/check-issuance/receipts", label: "دریافت ها", children: [
    { to: "/check-issuance/receipts/check-issuance", label: "دریافت وجه - صدور چک" },
  ] },
  { to: "/check-issuance/payments", label: "پرداخت ها", children: [
    { to: "/check-issuance/payments/with-check", label: "پرداخت با چک" },
    { to: "/check-issuance/payments/without-check", label: "پرداخت بدون چک" },
    { to: "/check-issuance/payments/cancel-check", label: "ابطال پرداخت با چک" },
    { to: "/check-issuance/payments/return-voided", label: "بازگشت چک باطله" },
    { to: "/check-issuance/payments/cancel-without-check", label: "ابطال پرداخت بدون چک" },
    { to: "/check-issuance/payments/check-delivery", label: "تحویل چک" },
    { to: "/check-issuance/payments/check-toggle", label: "فعال/غیرفعال کردن چک" },
    { to: "/check-issuance/payments/void-no-doc", label: "ابطال چک های بدون سند" },
    { to: "/check-issuance/payments/return-issued", label: "بازگرداندن چک صادر شده" },
    { to: "/check-issuance/payments/confirm-no-check-payment", label: "ثبت تایید پرداخت بی چک برای سند در حالت ذیحسابی" },
    { to: "/check-issuance/payments/aggregate-check", label: "پرداخت چک تجمیعی" },
    { to: "/check-issuance/payments/assign-no-doc", label: "اختصاص چک های بدون سند" },
    { to: "/check-issuance/payments/print-receipt", label: "چاپ فیش" },
    { to: "/check-issuance/payments/register-bank-receipt", label: "ثبت فیش های بانکی" },
    { to: "/check-issuance/payments/print-aggregate-confirmation", label: "چاپ تجمیعی تاییدیه چک" },
  ] },
  { to: "/check-issuance/reports", label: "گزارش ها", children: [
    { to: "/check-issuance/reports/bank-ledgers", label: "دفاتر بانک", children: [
      { to: "/check-issuance/reports/bank-ledgers/regular", label: "گزارش عادی" },
      { to: "/check-issuance/reports/bank-ledgers/detailed", label: "گزارش تفکیکی" },
    ] },
    { to: "/check-issuance/reports/balances", label: "موجودی ها" },
    { to: "/check-issuance/reports/bank-accounts", label: "لیست شماره حساب های هر بانک" },
    { to: "/check-issuance/reports/used-checks", label: "لیست چک های استفاده شده از دسته چک/شماره حساب" },
    { to: "/check-issuance/reports/remaining-checks", label: "لیست چک های باقیمانده از دسته چک/شماره حساب" },
    { to: "/check-issuance/reports/voided-checks", label: "لیست چک های باطل یا رزرو شده دسته چک/شماره حساب" },
    { to: "/check-issuance/reports/checkbooks", label: "لیست دسته چک های تعریف شده" },
    { to: "/check-issuance/reports/misc-search", label: "جستجوی متفرقه روی چک/بی چک" },
    { to: "/check-issuance/reports/aggregate-checks", label: "گزارش چک های تجمیعی" },
    { to: "/check-issuance/reports/aggregate-with-doc", label: "گزارش چک های تجمیعی با سند و بدون سند" },
  ] },
  { to: "/check-issuance/e-transfer", label: "حواله الکترونیکی" },
  { to: "/check-issuance/e-transfer-batch", label: "حواله الکترونیکی-گروهی" },
];

export const BOOKKEEPING_TOP = [
  { to: "/bookkeeping/operations-balance", label: "تراز عملیات", children: [
    { to: "/bookkeeping/operations-balance/different-states", label: "تراز در حالت های مختلف" },
    { to: "/bookkeeping/operations-balance/moein-chapters", label: "تراز عملیات معین/فصول" },
    { to: "/bookkeeping/operations-balance/moein-detail-link", label: "ارتباط معین و تفصیلی" },
    { to: "/bookkeeping/operations-balance/samad-system", label: "سامانه سماد(الف-ب)" },
    { to: "/bookkeeping/operations-balance/sanama-attachments", label: "ضمائم الصاقی سناما" },
  ] },
  { to: "/bookkeeping/misc-accounts", label: "متفرقه(لیست حساب‌ها)", children: [
    { to: "/bookkeeping/misc-accounts/account-groups", label: "لیست گروه حساب ها" },
    { to: "/bookkeeping/misc-accounts/main-accounts", label: "لیست حساب های کل" },
    { to: "/bookkeeping/misc-accounts/moein-accounts", label: "لیست حساب های معین" },
    { to: "/bookkeeping/misc-accounts/detail-accounts", label: "لیست حساب های تفصیلی" },
    { to: "/bookkeeping/misc-accounts/detailed-report", label: "گزارش تفصیلی" },
  ] },
  { to: "/bookkeeping/ledger-reports", label: "گزارش دفاتر", children: [
    { to: "/bookkeeping/ledger-reports/general-ledger", label: "دفتر کل" },
    { to: "/bookkeeping/ledger-reports/moein-ledger", label: "دفتر معین" },
    { to: "/bookkeeping/ledger-reports/journal", label: "دفتر روزنامه" },
    { to: "/bookkeeping/ledger-reports/model-13", label: "مدل 13" },
    { to: "/bookkeeping/ledger-reports/moein-program-chapter", label: "دفتر معین (معین-برنامه-فصل)" },
    { to: "/bookkeeping/ledger-reports/detail-ledger", label: "دفتر تفصیلی" },
    { to: "/bookkeeping/ledger-reports/account-review", label: "مرور حساب ها" },
    { to: "/bookkeeping/ledger-reports/securities", label: "گزارش اوراق بهادار" },
  ] },
  { to: "/bookkeeping/summary-status", label: "گزارش خلاصه وضعیت" },
  { to: "/bookkeeping/bank-reconciliation", label: "مغایرت بانکی", children: [
    { to: "/bookkeeping/bank-reconciliation/account-format-setup", label: "تنظیم فرمت صورت حساب بانک" },
    { to: "/bookkeeping/bank-reconciliation/account-info-read", label: "خواندن اطلاعات حساب ها" },
    { to: "/bookkeeping/bank-reconciliation/account-reconciliation", label: "مغایرت حساب ها" },
  ] },
  { to: "/bookkeeping/final-documents", label: "سندهای قطعی", children: [
    { to: "/bookkeeping/final-documents/finalize-doc", label: "قطعی کردن سند" },
    { to: "/bookkeeping/final-documents/unfinalize-doc", label: "خارج نمودن سند از قطعی" },
  ] },
  { to: "/bookkeeping/budget-execution", label: "گزارش‌های تفریغ بودجه", children: [
    { to: "/bookkeeping/budget-execution/budget-allocation-setup", label: "تنظیمات تفریغ بودجه" },
    { to: "/bookkeeping/budget-execution/budget-allocation", label: "تفریغ بودجه" },
    { to: "/bookkeeping/budget-execution/aggregate-budget-allocation", label: "تفریغ بودجه تجمیعی" },
  ] },
  { to: "/bookkeeping/misc-persons", label: "گزارش‌های متفرقه(اشخاص)", children: [
    { to: "/bookkeeping/misc-persons/persons-report", label: "گزارش اشخاص" },
    { to: "/bookkeeping/misc-persons/persons-balance", label: "گزارش مانده اشخاص" },
  ] },
  { to: "/bookkeeping/financial-statements", label: "صورت‌های مالی", children: [
    { to: "/bookkeeping/financial-statements/balance-sheet", label: "صورت وضعیت مالی1" },
    { to: "/bookkeeping/financial-statements/change-in-financial-position", label: "صورت تغییرات در وضعیت مالی" },
    { to: "/bookkeeping/financial-statements/comparison-budget-performance", label: "صورت مقایسه بودجه عمومی و عملکرد تلفیقی" },
    { to: "/bookkeeping/financial-statements/parametric-balance-sheet", label: "صورت وضعیت مالی پارامتریک" },
    { to: "/bookkeeping/financial-statements/notes", label: "یادداشت توضیحی" },
    { to: "/bookkeeping/financial-statements/reports-settings", label: "تنظیمات گزارش" },
  ] },
  { to: "/bookkeeping/accountant-agents", label: "گزارش عاملین ذیحساب" },
  { to: "/bookkeeping/document-notification", label: "گزارش ابلاغ سند" },
  { to: "/bookkeeping/smart-control", label: "کنترل هوشمند" },
  { to: "/bookkeeping/petty-cash", label: "گزارش تنخواه" },
  { to: "/bookkeeping/open-items", label: "هشدار اقلام باز دفتر" },
  { to: "/bookkeeping/resource-forms", label: "فرم‌های منابع و مصارف", children: [
    { to: "/bookkeeping/resource-forms/deposit-expense-confirmation", label: "فرم تاییدیه مصارف سپرده" },
  ] },
];

export const TOP_NAV = [
  { to: "/document-setup", label: "تنظیم اسناد", num: 2, subItems: DOCUMENT_SETUP_TOP },
  { to: "/review", label: "رسیدگی", num: 3, subItems: REVIEW_SUB },
  { to: "/credits", label: "اعتبارات", num: 4, subItems: CREDITS_TOP_SUB },
  { to: "/check-issuance", label: "صدور چک", num: 5, subItems: CHECK_ISSUANCE_TOP },
  { to: "/bookkeeping", label: "دفترداری و تنظیم حساب‌ها", num: 6, subItems: BOOKKEEPING_TOP },
  { to: "/system-management", label: "مدیریت سیستم", num: 7, subItems: [
    { to: "/system-management/automatic-doc-types", label: "تعریف انواع سند های اتوماتیک محاسباتی" },
    { to: "/system-management/non-calc-doc-types", label: "تعریف انواع سند های اتوماتیک غیر محاسباتی" },
    { to: "/system-management/credit-payroll-template", label: "قالب تامین اعتبار حقوق" },
    { to: "/system-management/payroll-doc-template", label: "قالب سند حقوق" },
    { to: "/system-management/assets-doc-template", label: "قالب سند اموال" },
    { to: "/system-management/calc-formulas", label: "تعریف فرمول محاسبه" },
    { to: "/system-management/balance-control", label: "کنترل موجودی حساب و برنامه/طرح" },
    { to: "/system-management/credit-control", label: "کنترل تامین اعتبار" },
    { to: "/system-management/program-details", label: "تکمیل اطلاعات برنامه ها/طرح ها" },
    { to: "/system-management/user-groups", label: "تعریف گروه کاربران" },
    { to: "/system-management/users", label: "تعریف کاربر" },
    { to: "/system-management/permissions", label: "تعریف دسترسی" },
    { to: "/system-management/change-password", label: "تغییر رمزعبور" },
    { to: "/system-management/user-performance", label: "مشاهده عملکرد کاربر" },
    { to: "/system-management/financial-details", label: "مشخصات ذیحسابی" },
    { to: "/system-management/approve-docs", label: "تصویب گروهی اسناد" },
    { to: "/system-management/close-account-chapters", label: "تنظیم سرفصل های بستن حساب" },
    { to: "/system-management/settings", label: "تنظیمات" },
    { to: "/system-management/update-manager", label: "مدیریت بروزرسانی" },
    { to: "/system-management/backup", label: "گرفتن نسخه پشتیبان" },
    { to: "/system-management/report-signature", label: "تنظیم امضای گزارشات" },
    {
      to: "/system-management/report-generator",
      label: "گزارش ساز",
      children: [
        { to: "/system-management/report-generator/define", label: "تعریف گزارش" },
        { to: "/system-management/report-generator/settings", label: "تنظیم گزارش" },
        { to: "/system-management/report-generator/generate", label: "گزارش گیری" },
        { to: "/system-management/report-generator/generate-2", label: "گزارش گیری-2" },
        { to: "/system-management/report-generator/generate-3", label: "گزارش گیری-3" },
      ],
    },
    { to: "/system-management/person-chapters", label: "تنظیم سرفصل های اشخاص" },
    { to: "/system-management/revoke-reconciliation", label: "ابطال مغایرت گیری" },
    { to: "/system-management/user-circle", label: "تعریف دایره کاربران" },
    { to: "/system-management/revoke-sanama", label: "ابطال سناما" },
    { to: "/system-management/signature-group", label: "گروه امضا" },
    { to: "/system-management/convert-chapter95", label: "تبدیل به سرفصل 95" },
    { to: "/system-management/convert-chapter94", label: "تبدیل به سرفصل 94" },
    { to: "/system-management/common-settings", label: "تنظیمات عمومی" },
    { to: "/system-management/change-moein-doc", label: "تغییر معین در سند" },
    { to: "/system-management/cartable", label: "کارتابل" },
    { to: "/system-management/credit-settings", label: "تنظیمات موافقت نامه/تخصیص/دریافت وجه" },
    { to: "/system-management/revoke-e-transfer", label: "ابطال حواله الکترونیکی" },
    { to: "/system-management/sanama-file-check", label: "بررسی فایل سناما" },
    { to: "/system-management/doc-requirements", label: "بررسی الزامات اسناد" },
  ] },
  { to: "/guarantees", label: "تضمینات", num: 8, subItems: [
    { to: "/guarantees/types", label: "انواع تضمینات" },
    { to: "/guarantees/causes", label: "تعریف علت ضمانت" },
    { to: "/guarantees/guarantee-type", label: "نوع تضمین" },
    { to: "/guarantees/subject", label: "موضوع تضمین" },
    { to: "/guarantees/register", label: "ثبت ضمانت نامه", children: [
      { to: "/guarantees/register/contract", label: "ضمانت قرارداد" },
      { to: "/guarantees/register/person", label: "ضمانت اشخاص" },
    ] },
    { to: "/guarantees/auto-doc", label: "سند اتوماتیک ضمانت" },
    { to: "/guarantees/extension-request", label: "درخواست تمدید ضمانت نامه گروهی" },
    { to: "/guarantees/report", label: "گزارش ضمانت نامه" },
    { to: "/guarantees/status-report", label: "گزارشات وضعیت تضمینات", children: [
      { to: "/guarantees/status-report/status", label: "وضعیت تضمینات" },
    ] },
    { to: "/guarantees/date-report", label: "گزارش ضمانت نامه ها بر اساس تاریخ" },
  ] },
  { to: "/deposits", label: "سپرده‌ها", num: 9, subItems: [
    { to: "/deposits/auto-register", label: "ثبت اتوماتیک سپرده از سند" },
    { to: "/deposits/manual-form", label: "ثبت فرم سپرده دستی" },
    { to: "/deposits/treasury", label: "دریافت سپرده از خزانه/استرداد/ثبت شماره بستانکاری" },
    { to: "/deposits/search", label: "جستجوی سپرده" },
  ] },
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
