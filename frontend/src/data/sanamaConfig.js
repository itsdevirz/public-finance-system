/**
 * ─── تعاریف تگ‌های ۴۸‌گانه سناما ──────────────────────────────────────────
 * هر تگ شامل: key, label, group, type, options (اختیاری), tooltip
 */

export const TAG_GROUPS = [
  { key: "budget", label: "اطلاعات بودجه‌ای", color: "emerald" },
  { key: "expense", label: "طبقه‌بندی هزینه و درآمد", color: "blue" },
  { key: "nominee", label: "اشخاص و ذی‌نفعان", color: "purple" },
  { key: "tax", label: "اطلاعات مالیاتی و زمانی", color: "yellow" },
  { key: "bank", label: "اطلاعات بانکی و ارزی", color: "orange" },
  { key: "debt", label: "بدهی‌ها و مطالبات", color: "red" },
  { key: "guarantee", label: "تضمینات و قراردادها", color: "slate" },
  { key: "asset", label: "دارایی‌ها و موجودی‌ها", color: "amber" },
  { key: "other", label: "سایر", color: "gray" },
];

export const SANAMA_TAGS = [
  // ─── گروه ۱: بودجه‌ای ─────────────────────────────────────────
  { key: "SourceType", label: "نوع منابع", group: "budget", type: "dropdown", options: ["عمومی", "اختصاصی", "متفرقه", "سایر"], tooltip: "نوع منبع اعتباری" },
  { key: "TransferalType", label: "نوع انتقال", group: "budget", type: "dropdown", options: ["جاری", "متمم", "سنواتی"], tooltip: "جاری/متمم/سنواتی" },
  { key: "CreditType", label: "نوع اعتبار", group: "budget", type: "dropdown", options: ["مصوب", "ابلاغی", "تخصیصی"], tooltip: "نوع اعتبار بودجه‌ای" },
  { key: "CreditInfo", label: "اطلاعات اعتبار", group: "budget", type: "dropdown", options: ["طرح", "برنامه", "فعالیت"], tooltip: "طرح/برنامه" },
  { key: "CreditCode", label: "شماره برنامه/طرح", group: "budget", type: "input", tooltip: "کد برنامه یا طرح" },
  { key: "RankNumber", label: "شماره ردیف", group: "budget", type: "input", tooltip: "ردیف بودجه‌ای" },
  { key: "SubBudgetCode", label: "کد زیربودجه", group: "budget", type: "input", tooltip: "کد زیربودجه مرتبط" },

  // ─── گروه ۲: هزینه و درآمد ────────────────────────────────────
  { key: "ExpenseArticle", label: "فصل هزینه", group: "expense", type: "dropdown", options: ["فصل ۱ - کارکنان", "فصل ۲ - استفاده از کالا", "فصل ۳ - خدمات", "فصل ۴ - کمک‌ها", "فصل ۵ - سایر", "فصل ۶ - تملک دارایی", "فصل ۷ - رفاهی"], tooltip: "فصل هزینه‌ای طبق طبقه‌بندی دولتی" },
  { key: "ConstructArticle", label: "فصل عمرانی", group: "expense", type: "dropdown", options: ["عمران شهری", "راه و ساختمان", "تجهیزات", "آب و فاضلاب", "برق و انرژی"], tooltip: "فصل هزینه عمرانی" },
  { key: "ExpenseDetailArticle", label: "ماده هزینه تفصیلی", group: "expense", type: "dropdown", options: ["حقوق و مزایا", "فوق‌العاده‌ها", "حق‌الزحمه", "اضافه‌کاری", "بازنشستگی", "بیمه"], tooltip: "جزئیات ماده هزینه" },
  { key: "IncomeCode", label: "کد درآمد", group: "expense", type: "input", tooltip: "کد طبقه‌بندی درآمد" },
  { key: "IncomeSubject", label: "موضوع درآمد", group: "expense", type: "input", tooltip: "شرح موضوع درآمد" },

  // ─── گروه ۳: اشخاص ────────────────────────────────────────────
  { key: "NomineeCode", label: "کد ذی‌نفع", group: "nominee", type: "input", tooltip: "شناسه ملی یا کد ذی‌نفع (۱۶ کاراکتر)", maxLength: 16 },
  { key: "NomineeName", label: "نام ذی‌نفع", group: "nominee", type: "input", tooltip: "نام و نام خانوادگی یا نام شرکت" },
  { key: "DebentureSenderRank", label: "ردیف ابلاغ‌دهنده", group: "nominee", type: "input", tooltip: "ردیف فرستنده ابلاغ" },
  { key: "DebentureReceiverRank", label: "ردیف ابلاغ‌گیرنده", group: "nominee", type: "input", tooltip: "ردیف دریافت‌کننده ابلاغ" },

  // ─── گروه ۴: مالیاتی و زمانی ─────────────────────────────────
  { key: "TaxSeason", label: "دوره مالیاتی", group: "tax", type: "dropdown", options: ["فصل ۱ (بهار)", "فصل ۲ (تابستان)", "فصل ۳ (پاییز)", "فصل ۴ (زمستان)"], tooltip: "فصل مالیاتی مرتبط" },
  { key: "Year", label: "سال", group: "tax", type: "input", tooltip: "سال مالی مرتبط" },
  { key: "DueDate", label: "تاریخ سررسید", group: "tax", type: "date", tooltip: "تاریخ سررسید پرداخت" },

  // ─── گروه ۵: بانکی و ارزی ────────────────────────────────────
  { key: "AccountNumber", label: "شماره شبا", group: "bank", type: "input", tooltip: "شماره حساب شبا (IR + 24 رقم)", maxLength: 26 },
  { key: "CurrencyType", label: "نوع ارز", group: "bank", type: "dropdown", options: ["ریال", "دلار", "یورو", "درهم", "لیر", "یوآن"], tooltip: "نوع ارز معامله" },

  // ─── گروه ۶: بدهی‌ها و مطالبات ────────────────────────────────
  { key: "DemandStatus", label: "وضعیت مطالبات", group: "debt", type: "dropdown", options: ["جاری", "سررسید گذشته", "مشکوک‌الوصول", "لاوصول"], tooltip: "وضعیت فعلی مطالبات" },
  { key: "DebitSubject", label: "موضوع بدهی", group: "debt", type: "input", tooltip: "شرح موضوع بدهی" },
  { key: "ReceivablesSubject", label: "موضوع مطالبات", group: "debt", type: "input", tooltip: "شرح موضوع مطالبات" },
  { key: "LeakageSubject", label: "موضوع کسری", group: "debt", type: "input", tooltip: "موضوع کسری ابوابجمعی" },

  // ─── گروه ۷: تضمینات و قراردادها ─────────────────────────────
  { key: "AssuranceType", label: "نوع تضمین", group: "guarantee", type: "dropdown", options: ["ضمانت‌نامه بانکی", "چک", "سفته", "وثیقه ملکی", "بیمه‌نامه"], tooltip: "نوع ضمانت‌نامه یا تضمین" },
  { key: "AssuranceSubject", label: "موضوع تضمین", group: "guarantee", type: "input", tooltip: "شرح موضوع تضمین" },
  { key: "ContractProperties", label: "مشخصات قرارداد", group: "guarantee", type: "textarea", tooltip: "جزئیات قرارداد مرتبط" },
  { key: "SecuritiesType", label: "نوع اوراق بهادار", group: "guarantee", type: "dropdown", options: ["اسناد خزانه", "اوراق مشارکت", "اوراق صکوک", "اوراق سلف"], tooltip: "نوع اوراق بهادار" },
  { key: "SecuritiesProperties", label: "مشخصات اوراق", group: "guarantee", type: "textarea", tooltip: "جزئیات اوراق بهادار" },

  // ─── گروه ۸: دارایی‌ها ────────────────────────────────────────
  { key: "FixedAssetType", label: "نوع دارایی ثابت", group: "asset", type: "dropdown", options: ["زمین", "ساختمان", "ماشین‌آلات", "تجهیزات", "وسایل نقلیه", "اثاثه"], tooltip: "طبقه‌بندی دارایی ثابت" },
  { key: "InventoryType", label: "نوع موجودی", group: "asset", type: "dropdown", options: ["مواد اولیه", "کالای ساخته‌شده", "ملزومات", "قطعات یدکی"], tooltip: "نوع موجودی انبار" },
  { key: "InvestmentType", label: "نوع سرمایه‌گذاری", group: "asset", type: "dropdown", options: ["کوتاه‌مدت", "بلندمدت", "سپرده بانکی", "سهام"], tooltip: "نوع سرمایه‌گذاری" },

  // ─── گروه ۹: سایر ─────────────────────────────────────────────
  { key: "Quantity", label: "مقدار/تعداد", group: "other", type: "number", tooltip: "مقدار یا تعداد مرتبط" },
  { key: "TempPaymentType", label: "نوع پرداخت غیرقطعی", group: "other", type: "dropdown", options: ["تنخواه‌گردان", "پیش‌پرداخت", "علی‌الحساب"], tooltip: "نوع پرداخت موقت" },
  { key: "AnnualAdjustmentsSubject", label: "موضوع تعدیلات سنواتی", group: "other", type: "input", tooltip: "شرح تعدیلات سال‌های قبل" },
  { key: "TransferItems", label: "اقلام انتقالی", group: "other", type: "input", tooltip: "شرح اقلام انتقال‌یافته" },
  { key: "AllocationSource", label: "منبع تخصیص", group: "other", type: "dropdown", options: ["بودجه عمومی", "درآمد اختصاصی", "اسناد خزانه", "تسهیلات", "سایر"], tooltip: "منبع تامین اعتبار" },
];

/**
 * ─── ماتریس تگ‌های الزامی بر اساس AccCode ───────────────────────────────────
 * هر کلید = کد حساب معین، مقدار = آرایه از key تگ‌هایی که ✓ (الزامی) هستند
 */
export const ACC_TAG_MATRIX = {
  // ─── سری ۱۰۰: دارایی‌ها ────────────────────────────────────────
  "101": { label: "وجوه نقد", tags: ["AccountNumber", "CurrencyType", "NomineeCode", "NomineeName"] },
  "102": { label: "سرمایه‌گذاری‌ها", tags: ["InvestmentType", "DueDate", "NomineeCode", "NomineeName", "AccountNumber"] },
  "103": { label: "مطالبات", tags: ["NomineeCode", "NomineeName", "DemandStatus", "ReceivablesSubject", "DueDate"] },
  "104": { label: "پیش‌پرداخت‌ها", tags: ["NomineeCode", "NomineeName", "TempPaymentType", "Year"] },
  "105": { label: "موجودی‌ها", tags: ["InventoryType", "Quantity"] },
  "106": { label: "دارایی ثابت", tags: ["FixedAssetType", "NomineeCode", "NomineeName", "Quantity"] },

  // ─── سری ۲۰۰: بدهی‌ها ──────────────────────────────────────────
  "201": { label: "حساب‌های پرداختنی", tags: ["NomineeCode", "NomineeName", "DebitSubject", "DueDate"] },
  "202": { label: "اسناد پرداختنی", tags: ["NomineeCode", "NomineeName", "DebitSubject", "DueDate", "AccountNumber"] },
  "203": { label: "بدهی بلندمدت", tags: ["NomineeCode", "NomineeName", "DebitSubject", "DueDate", "Year"] },
  "204": { label: "ذخایر", tags: ["DebitSubject", "Year"] },
  "205": { label: "سپرده‌ها", tags: ["NomineeCode", "NomineeName", "AccountNumber", "DueDate"] },

  // ─── سری ۳۰۰: حقوق صاحبان ─────────────────────────────────────
  "301": { label: "سرمایه", tags: ["Year"] },
  "302": { label: "اندوخته‌ها", tags: ["Year", "AnnualAdjustmentsSubject"] },
  "303": { label: "مازاد / کسری", tags: ["Year", "AnnualAdjustmentsSubject"] },

  // ─── سری ۴۰۰: درآمدها ──────────────────────────────────────────
  "401": { label: "درآمد عمومی", tags: ["IncomeCode", "IncomeSubject", "SourceType", "Year"] },
  "402": { label: "درآمد اختصاصی", tags: ["IncomeCode", "IncomeSubject", "SourceType", "Year"] },
  "403": { label: "کمک‌ها و هدایا", tags: ["IncomeCode", "IncomeSubject", "NomineeCode", "NomineeName"] },

  // ─── سری ۵۰۰: هزینه‌ها ─────────────────────────────────────────
  "501": { label: "هزینه پرسنلی", tags: ["ExpenseArticle", "ExpenseDetailArticle", "NomineeCode", "NomineeName", "TaxSeason"] },
  "502": { label: "هزینه اداری", tags: ["ExpenseArticle", "ExpenseDetailArticle", "NomineeCode", "NomineeName"] },
  "503": { label: "هزینه سرمایه‌ای", tags: ["ExpenseArticle", "ConstructArticle", "FixedAssetType", "NomineeCode", "NomineeName"] },

  // ─── سری ۸۰۰: انتظامی ─────────────────────────────────────────
  "801": { label: "تضمینات دریافتی", tags: ["AssuranceType", "AssuranceSubject", "ContractProperties", "NomineeCode", "NomineeName", "DueDate"] },
  "802": { label: "تضمینات پرداختی", tags: ["AssuranceType", "AssuranceSubject", "ContractProperties", "NomineeCode", "NomineeName", "DueDate"] },
  "803": { label: "اوراق بهادار", tags: ["SecuritiesType", "SecuritiesProperties", "DueDate", "Quantity"] },

  // ─── سری ۹۰۰: بودجه‌ای ─────────────────────────────────────────
  "901": { label: "اعتبار مصوب", tags: ["SourceType", "TransferalType", "CreditType", "CreditInfo", "CreditCode", "RankNumber", "ExpenseArticle"] },
  "902": { label: "اعتبار ابلاغی", tags: ["SourceType", "TransferalType", "CreditType", "CreditInfo", "CreditCode", "RankNumber", "DebentureSenderRank", "DebentureReceiverRank", "ExpenseArticle"] },
  "903": { label: "تخصیص اعتبار", tags: ["SourceType", "CreditType", "CreditCode", "SubBudgetCode", "ExpenseArticle"] },
  "904": { label: "تامین اعتبار", tags: ["SourceType", "CreditType", "CreditCode", "ExpenseArticle", "NomineeCode", "NomineeName"] },
  "905": { label: "دریافت از خزانه", tags: ["SourceType", "AccountNumber", "AllocationSource"] },
};

/**
 * ─── قوانین شرطی ─────────────────────────────────────────────────────────────
 * هر قانون: when (شرط) → then (اقدام)
 */
export const CONDITIONAL_RULES = [
  {
    id: "credit-type-ablaghi",
    description: "اگر نوع اعتبار ابلاغی باشد",
    when: { field: "CreditType", value: "ابلاغی" },
    then: { show: ["DebentureSenderRank", "DebentureReceiverRank"], require: ["DebentureSenderRank", "DebentureReceiverRank"] },
  },
  {
    id: "currency-account",
    description: "اگر حساب ارزی باشد",
    when: { field: "CurrencyType", notEqual: "ریال" },
    then: { require: ["CurrencyType"] },
  },
  {
    id: "capital-expense",
    description: "اگر هزینه سرمایه‌ای باشد",
    when: { field: "ExpenseArticle", value: "فصل ۶ - تملک دارایی" },
    then: { show: ["ConstructArticle", "FixedAssetType"], require: ["ConstructArticle"] },
  },
  {
    id: "allocation-treasury",
    description: "اگر منبع تخصیص اسناد خزانه باشد",
    when: { field: "AllocationSource", value: "اسناد خزانه" },
    then: { show: ["SecuritiesType", "DueDate"], require: ["SecuritiesType", "DueDate"] },
  },
  {
    id: "temp-payment",
    description: "اگر پرداخت غیرقطعی فعال باشد",
    when: { field: "TempPaymentType", notEmpty: true },
    then: { show: ["NomineeCode", "NomineeName"], require: ["NomineeCode"] },
  },
];

/**
 * ─── پروفایل‌های فرم بر اساس سری حساب ────────────────────────────────────────
 */
export const ACCOUNT_PROFILES = {
  "100": { label: "دارایی‌ها", focusGroups: ["bank", "nominee", "asset"], hideGroups: ["budget"] },
  "200": { label: "بدهی‌ها", focusGroups: ["nominee", "debt"], hideGroups: ["budget", "asset"] },
  "300": { label: "حقوق صاحبان", focusGroups: ["other"], hideGroups: ["budget", "expense", "bank", "guarantee"] },
  "400": { label: "درآمدها", focusGroups: ["expense", "budget"], hideGroups: ["guarantee", "asset"] },
  "500": { label: "هزینه‌ها", focusGroups: ["expense", "nominee", "tax"], hideGroups: ["guarantee", "asset"] },
  "800": { label: "انتظامی", focusGroups: ["guarantee", "nominee"], hideGroups: ["budget", "expense"] },
  "900": { label: "بودجه‌ای", focusGroups: ["budget", "expense"], hideGroups: ["asset", "guarantee"] },
};
