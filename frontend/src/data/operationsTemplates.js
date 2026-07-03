// ۴۹ ثبت پیش‌فرض با جزئیات آرتیکل‌های مالی بر اساس کدهای ۵ رقمی استاندارد سناما
export const INITIAL_TEMPLATES = [
  {
    id: 1,
    title: "ثبت شماره ۱",
    description: "ثبت اعتبار هزینه و بودجه اعتبار هزینه",
    code: "OP-01",
    category: "payments",
    status: "active",
    lines: [
      { type: "debit", accountCode: "92001", accountName: "اعتبار هزینه", ratio: "100%" },
      { type: "credit", accountCode: "91001", accountName: "بودجه اعتبار هزینه", ratio: "100%" }
    ]
  },
  {
    id: 2,
    title: "ثبت شماره ۲",
    description: "دریافت تنخواه‌گردان حسابداری از خزانه (شامل اعتبار بانکی)",
    code: "OP-02",
    category: "payments",
    status: "active",
    lines: [
      { type: "debit", accountCode: "11001", accountName: "بانک پرداخت هزینه", ratio: "100%" },
      { type: "credit", accountCode: "23001", accountName: "پیش دریافت اعتبار هزینه", ratio: "100%" }
    ]
  },
  {
    id: 3,
    title: "ثبت شماره ۳",
    description: "پرداخت از محل تنخواه‌گردان حسابداری (ثبت قبل از پرداخت)",
    code: "OP-03",
    category: "payments",
    status: "active",
    lines: [
      { type: "debit", accountCode: "97001", accountName: "اعتبار هزینه تامین شده", ratio: "100%" },
      { type: "credit", accountCode: "96001", accountName: "کنترل اعتبار هزینه", ratio: "100%" }
    ]
  },
  {
    id: 4,
    title: "ثبت شماره ۴",
    description: "به هنگام تخصیص اعتبار",
    code: "OP-04",
    category: "payments",
    status: "active",
    lines: [
      { type: "debit", accountCode: "93001", accountName: "اعتبار هزینه تخصیص یافته", ratio: "100%" },
      { type: "credit", accountCode: "92001", accountName: "اعتبار هزینه", ratio: "100%" }
    ]
  },
  {
    id: 5,
    title: "ثبت شماره ۵",
    description: "در صورت دریافت وجه نقد (شامل اعتبار بانکی) و تسویه و پا به پای تنخواه‌گردان حسابداری با اعتبار تخصیص یافته",
    code: "OP-05",
    category: "payments",
    status: "active",
    lines: [
      { type: "debit", accountCode: "96001", accountName: "کنترل اعتبار هزینه", ratio: "100%" },
      { type: "debit", accountCode: "23001", accountName: "پیش دریافت اعتبار هزینه", ratio: "100%" },
      { type: "debit", accountCode: "11001", accountName: "بانک پرداخت هزینه", ratio: "100%" },
      { type: "credit", accountCode: "93001", accountName: "اعتبار هزینه تخصیص یافته", ratio: "100%" },
      { type: "credit", accountCode: "41001", accountName: "دریافتی بابت عملیات جاری", ratio: "100%" }
    ]
  },
  {
    id: 6,
    title: "ثبت شماره ۶",
    description: "دریافت وجه نقد (شامل اعتبار بانکی) از محل اعتبار اختصاصی مصوب",
    code: "OP-06",
    category: "receipts",
    status: "active",
    lines: [
      { type: "debit", accountCode: "11003", accountName: "بانک پرداخت اختصاصی", ratio: "100%" },
      { type: "debit", accountCode: "81017", accountName: "حساب انتظامی - کنترل دریافتی‌ها بابت اعتبار", ratio: "100%" },
      { type: "credit", accountCode: "11522", accountName: "مطالبات و خزانه", ratio: "100%" },
      { type: "credit", accountCode: "82017", accountName: "طرف حساب انتظامی - کنترل دریافتی‌ها بابت اعتبار", ratio: "100%" }
    ]
  },
  {
    id: 7,
    title: "ثبت شماره ۷",
    description: "به هنگام دریافت هدایا و کمک‌های نقدی یا محتمل شدن ورود جریان منافع اقتصادی یا توان خدمت‌رسانی آتی (در صورتی که نحوه مصرف وجوه تعیین نشده باشد)",
    code: "OP-07",
    category: "receipts",
    status: "active",
    lines: [
      { type: "debit", accountCode: "11004", accountName: "بانک وجوه سایر منابع", ratio: "100%" },
      { type: "debit", accountCode: "12001", accountName: "حساب ها و اسناد دریافتنی", ratio: "100%" },
      { type: "debit", accountCode: "13001", accountName: "موجودی ملزومات", ratio: "100%" },
      { type: "credit", accountCode: "43001", accountName: "هدایا و کمک‌ها", ratio: "100%" }
    ]
  },
  {
    id: 8,
    title: "ثبت شماره ۸",
    description: "به هنگام دریافت اعلامیه بانکی در خصوص واریز وجوه تنخواه‌گردان پرداخت (دریافتی از ذیحسابی سایر واحدها)",
    code: "OP-08",
    category: "receipts",
    status: "active",
    lines: [
      { type: "debit", accountCode: "11004", accountName: "بانک وجوه سایر منابع", ratio: "100%" },
      { type: "credit", accountCode: "21001", accountName: "حساب‌ها و اسناد پرداختنی", ratio: "100%" }
    ]
  },
  {
    id: 9,
    title: "ثبت شماره ۹",
    description: "به هنگام دریافت اعلامیه بانکی در خصوص واریز وجوه حاصل از هدایای نقدی و سایر وجوه انتقالی مشروط که شرایط مصرف آن تعیین شده است",
    code: "OP-09",
    category: "receipts",
    status: "active",
    lines: [
      { type: "debit", accountCode: "11004", accountName: "بانک وجوه سایر منابع", ratio: "100%" },
      { type: "credit", accountCode: "22001", accountName: "حساب‌ها و اسناد پرداختنی", ratio: "100%" }
    ]
  },
  {
    id: 10,
    title: "ثبت شماره ۱۰",
    description: "مصرف هدایای نقدی محدود شده برای هدف خاص مطابق با شرایط تعیین شده",
    code: "OP-10",
    category: "payments",
    status: "active",
    lines: [
      { type: "debit", accountCode: "22001", accountName: "حساب‌ها و اسناد پرداختنی", ratio: "100%" },
      { type: "credit", accountCode: "43001", accountName: "هدایا و کمک‌ها", ratio: "100%" }
    ]
  },
  {
    id: 11,
    title: "ثبت شماره ۱۱",
    description: "تامین و دریافت بخشی از منابع واحد گزارشگر به عنوان سایر منابع از خزانه",
    code: "OP-11",
    category: "receipts",
    status: "active",
    lines: [
      { type: "debit", accountCode: "11004", accountName: "بانک وجوه سایر منابع", ratio: "100%" },
      { type: "credit", accountCode: "41010", accountName: "دریافتی از محل سایر منابع", ratio: "100%" }
    ]
  },
  {
    id: 12,
    title: "ثبت شماره ۱۲",
    description: "به هنگام ابلاغ تمام یا بخشی از اعتبار تخصیص یافته به سایر واحدها",
    code: "OP-12",
    category: "payments",
    status: "active",
    lines: [
      { type: "debit", accountCode: "94001", accountName: "حواله اعتبار هزینه", ratio: "100%" },
      { type: "credit", accountCode: "93001", accountName: "اعتبار هزینه تخصیص یافته", ratio: "100%" },
      { type: "credit", accountCode: "92001", accountName: "اعتبار هزینه", ratio: "100%" }
    ]
  },
  {
    id: 13,
    title: "ثبت شماره ۱۳",
    description: "انتقال وجوه مربوط به ابلاغ اعتبار (عمومی / اختصاصی) به واحد دریافت‌کننده اعتبار ابلاغی",
    code: "OP-13",
    category: "payments",
    status: "active",
    lines: [
      { type: "debit", accountCode: "62001", accountName: "هزینه‌ها - انتقالات", ratio: "100%" },
      { type: "credit", accountCode: "11001", accountName: "بانک پرداخت هزینه", ratio: "100%" },
      { type: "credit", accountCode: "11003", accountName: "بانک پرداخت اختصاصی", ratio: "100%" }
    ]
  },
  {
    id: 14,
    title: "ثبت شماره ۱۴",
    description: "به هنگام دریافت اعلامیه ابلاغ اعتبار و واریز وجوه ابلاغی (عمومی / اختصاصی)",
    code: "OP-14",
    category: "receipts",
    status: "active",
    lines: [
      { type: "debit", accountCode: "95001", accountName: "اعتبار هزینه ابلاغی", ratio: "100%" },
      { type: "debit", accountCode: "11001", accountName: "بانک پرداخت هزینه", ratio: "100%" },
      { type: "debit", accountCode: "11003", accountName: "بانک پرداخت اختصاصی", ratio: "100%" },
      { type: "debit", accountCode: "81017", accountName: "حساب انتظامی - کنترل دریافتی‌ها بابت اعتبار", ratio: "100%" },
      { type: "credit", accountCode: "91001", accountName: "بودجه اعتبار هزینه", ratio: "100%" },
      { type: "credit", accountCode: "46001", accountName: "درآمدها - انتقالات", ratio: "100%" },
      { type: "credit", accountCode: "82017", accountName: "طرف حساب انتظامی - کنترل دریافتی‌ها بابت اعتبار", ratio: "100%" }
    ]
  },
  {
    id: 15,
    title: "ثبت شماره ۱۵",
    description: "به هنگام تامین اعتبار (عمومی / اختصاصی)",
    code: "OP-15",
    category: "payments",
    status: "active",
    lines: [
      { type: "debit", accountCode: "97001", accountName: "اعتبار هزینه تامین شده", ratio: "100%", section: "از محل اعتبار تخصیص یافته" },
      { type: "credit", accountCode: "93001", accountName: "اعتبار هزینه تخصیص یافته", ratio: "100%", section: "از محل اعتبار تخصیص یافته" },
      { type: "debit", accountCode: "97001", accountName: "اعتبار هزینه تامین شده", ratio: "100%", section: "از محل اعتبار اختصاصی" },
      { type: "credit", accountCode: "92001", accountName: "اعتبار هزینه", ratio: "100%", section: "از محل اعتبار اختصاصی" },
      { type: "debit", accountCode: "97001", accountName: "اعتبار هزینه تامین شده", ratio: "100%", section: "از محل اعتبار ابلاغی" },
      { type: "credit", accountCode: "95001", accountName: "اعتبار هزینه ابلاغی", ratio: "100%", section: "از محل اعتبار ابلاغی" }
    ]
  },
  {
    id: 16,
    title: "ثبت شماره ۱۶",
    description: "در صورت واگذاری تنخواه‌گردان پرداخت به عاملین ذیحساب طبق قوانین و مقررات مربوط",
    code: "OP-16",
    category: "payments",
    status: "active",
    lines: [
      { type: "debit", accountCode: "11021", accountName: "تنخواه گردان پرداخت بابت عملیات جاری", ratio: "100%" },
      { type: "credit", accountCode: "11001", accountName: "بانک پرداخت هزینه", ratio: "100%" },
      { type: "credit", accountCode: "11003", accountName: "بانک پرداخت اختصاصی", ratio: "100%" },
      { type: "credit", accountCode: "11004", accountName: "بانک وجوه سایر منابع", ratio: "100%" },
      { type: "debit", accountCode: "98001", accountName: "اعتبار هزینه بابت پرداخت های غیر قطعی", ratio: "100%" },
      { type: "credit", accountCode: "97001", accountName: "اعتبار هزینه تامین شده", ratio: "100%" }
    ]
  },
  {
    id: 17,
    title: "ثبت شماره ۱۷-۱",
    description: "دریافت تضمین در قبال واگذاری پیش‌پرداخت بابت عملیات جاری",
    code: "OP-17-1",
    category: "receipts",
    status: "active",
    lines: [
      { type: "debit", accountCode: "81001", accountName: "حساب انتظامی - تضمین های دریافتی", ratio: "100%" },
      { type: "credit", accountCode: "82001", accountName: "طرف حساب انتظامی - تضمین‌های دریافتی", ratio: "100%" }
    ]
  },
  {
    id: 50,
    title: "ثبت شماره ۱۷-۲",
    description: "به هنگام واگذاری پیش‌پرداخت به اشخاص ذینفع با رعایت مقررات و ضوابط قانونی",
    code: "OP-17-2",
    category: "payments",
    status: "active",
    lines: [
      { type: "debit", accountCode: "14001", accountName: "پیش پرداخت بابت عملیات جاری", ratio: "100%" },
      { type: "credit", accountCode: "11001", accountName: "بانک پرداخت هزینه", ratio: "100%" },
      { type: "credit", accountCode: "11003", accountName: "بانک پرداخت اختصاصی", ratio: "100%" },
      { type: "credit", accountCode: "11004", accountName: "بانک وجوه سایر منابع", ratio: "100%" },
      { type: "debit", accountCode: "98001", accountName: "اعتبار هزینه بابت پرداخت های غیر قطعی", ratio: "100%" },
      { type: "credit", accountCode: "97001", accountName: "اعتبار هزینه تامین شده", ratio: "100%" }
    ]
  },
  {
    id: 18,
    title: "ثبت شماره ۱۸",
    description: "شناسایی موجودی‌ها",
    code: "OP-18",
    category: "receipts",
    status: "active",
    lines: [
      { type: "debit", accountCode: "13001", accountName: "موجودی‌ها به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها", ratio: "100%" },
      { type: "credit", accountCode: "14001", accountName: "پیش‌پرداخت بابت عملیات جاری", ratio: "100%" },
      { type: "credit", accountCode: "21001", accountName: "حساب‌ها و اسناد پرداختنی", ratio: "100%" },
      { type: "debit", accountCode: "99001", accountName: "اعتبار هزینه مصرف شده", ratio: "100%", section: "به میزان پیش‌پرداخت منقضی شده" },
      { type: "credit", accountCode: "98001", accountName: "اعتبار هزینه بابت پرداخت‌های غیر قطعی", ratio: "100%", section: "به میزان پیش‌پرداخت منقضی شده" },
      { type: "debit", accountCode: "82001", accountName: "طرف حساب انتظامی - تضمین‌های دریافتی", ratio: "100%", section: "به میزان کاهش تضمین‌های دریافتی" },
      { type: "credit", accountCode: "81001", accountName: "حساب انتظامی - تضمین‌های دریافتی", ratio: "100%", section: "به میزان کاهش تضمین‌های دریافتی" }
    ]
  },
  {
    id: 19,
    title: "ثبت شماره ۱۹",
    description: "شناسایی هزینه‌ها",
    code: "OP-19",
    category: "expenses",
    status: "active",
    lines: [
      { type: "debit", accountCode: "61001", accountName: "هزینه‌ها به تفکیک طبقه‌بندی اقتصادی دولت", ratio: "100%" },
      { type: "credit", accountCode: "14001", accountName: "پیش‌پرداخت بابت عملیات جاری", ratio: "100%" },
      { type: "credit", accountCode: "21001", accountName: "حساب‌ها و اسناد پرداختنی", ratio: "100%" },
      { type: "debit", accountCode: "99001", accountName: "اعتبار هزینه مصرف شده", ratio: "100%", section: "به میزان پیش‌پرداخت منقضی شده" },
      { type: "credit", accountCode: "98001", accountName: "اعتبار هزینه بابت پرداخت‌های غیرقطعی", ratio: "100%", section: "به میزان پیش‌پرداخت منقضی شده" },
      { type: "debit", accountCode: "82001", accountName: "طرف حساب انتظامی - تضمین‌های دریافتی", ratio: "100%", section: "به میزان کاهش تضمین‌های دریافتی" },
      { type: "credit", accountCode: "81001", accountName: "حساب انتظامی - تضمین‌های دریافتی", ratio: "100%", section: "به میزان کاهش تضمین‌های دریافتی" }
    ]
  },
  {
    id: "20-1",
    title: "ثبت شماره ۲۰-۱",
    description: "شناسایی کسور قانونی مربوط و تسویه خالص بدهی‌ها",
    code: "OP-20-1",
    category: "expenses",
    status: "active",
    lines: [
      { type: "debit", accountCode: "21001", accountName: "حساب‌ها و اسناد پرداختنی", ratio: "100%" },
      { type: "credit", accountCode: "24001", accountName: "بیمه پرداختنی", ratio: "100%" },
      { type: "credit", accountCode: "24004", accountName: "مالیات پرداختنی", ratio: "100%" },
      { type: "credit", accountCode: "21007", accountName: "سپرده‌های پرداختنی", ratio: "100%" },
      { type: "credit", accountCode: "11001", accountName: "بانک پرداخت هزینه", ratio: "100%" },
      { type: "credit", accountCode: "11003", accountName: "بانک پرداخت اختصاصی", ratio: "100%" },
      { type: "credit", accountCode: "11004", accountName: "بانک وجوه سایر منابع", ratio: "100%" },
      { type: "debit", accountCode: "99001", accountName: "اعتبار هزینه مصرف شده", ratio: "100%" },
      { type: "credit", accountCode: "97001", accountName: "اعتبار هزینه تامین شده", ratio: "100%" }
    ]
  },
  {
    id: "20-2",
    title: "ثبت شماره ۲۰-۲",
    description: "به هنگام تسویه کسور قانونی مربوط",
    code: "OP-20-2",
    category: "expenses",
    status: "active",
    lines: [
      { type: "debit", accountCode: "24001", accountName: "بیمه پرداختنی", ratio: "100%" },
      { type: "debit", accountCode: "24004", accountName: "مالیات پرداختنی", ratio: "100%" },
      { type: "credit", accountCode: "11001", accountName: "بانک پرداخت هزینه", ratio: "100%" },
      { type: "credit", accountCode: "11003", accountName: "بانک پرداخت اختصاصی", ratio: "100%" },
      { type: "credit", accountCode: "11004", accountName: "بانک وجوه سایر منابع", ratio: "100%" },
      { type: "debit", accountCode: "99001", accountName: "اعتبار هزینه مصرف شده", ratio: "100%" },
      { type: "credit", accountCode: "97001", accountName: "اعتبار هزینه تامین شده", ratio: "100%" }
    ]
  },
  {
    id: 21,
    title: "ثبت شماره ۲۱-۱",
    description: "در صورت پرداخت بخشی از بدهی‌ها به عنوان علی‌الحساب",
    code: "OP-21-1",
    category: "payments",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "21001", accountName: "حساب‌ها و اسناد پرداختنی",                             ratio: "**" },
      { type: "credit", accountCode: "24001", accountName: "بیمه پرداختنی",                                         ratio: "**" },
      { type: "credit", accountCode: "24004", accountName: "مالیات پرداختنی",                                       ratio: "**" },
      { type: "credit", accountCode: "21007", accountName: "سپرده‌های پرداختنی",                                    ratio: "**" },
      { type: "credit", accountCode: "11001", accountName: "بانک پرداخت هزینه",                                     ratio: "**" },
      { type: "credit", accountCode: "11003", accountName: "بانک پرداخت اختصاصی",                                   ratio: "**" },
      { type: "credit", accountCode: "11004", accountName: "بانک وجوه سایر منابع",                                  ratio: "**" },
      { type: "debit",  accountCode: "81003", accountName: "حساب انتظامی- علی‌الحساب بابت عملیات جاری",            ratio: "**" },
      { type: "credit", accountCode: "82003", accountName: "طرف حساب انتظامی- علی‌الحساب بابت عملیات جاری",       ratio: "**" },
      { type: "debit",  accountCode: "98001", accountName: "اعتبار هزینه بابت پرداخت‌های غیرقطعی",                 ratio: "**" },
      { type: "credit", accountCode: "97001", accountName: "اعتبار هزینه تامین شده",                                ratio: "**" }
    ]
  },
  {
    id: 51,
    title: "ثبت شماره ۲۱-۲",
    description: "به هنگام پرداخت کسور قانونی مرتبط با علی‌الحساب",
    code: "OP-21-2",
    category: "payments",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "24001", accountName: "بیمه پرداختنی",              ratio: "**" },
      { type: "debit",  accountCode: "24004", accountName: "مالیات پرداختنی",            ratio: "**" },
      { type: "credit", accountCode: "11001", accountName: "بانک پرداخت هزینه",          ratio: "**" },
      { type: "credit", accountCode: "11003", accountName: "بانک پرداخت اختصاصی",        ratio: "**" },
      { type: "credit", accountCode: "11004", accountName: "بانک وجوه سایر منابع",       ratio: "**" },
      { type: "debit",  accountCode: "98001", accountName: "اعتبار هزینه بابت پرداخت‌های غیرقطعی", ratio: "**" },
      { type: "credit", accountCode: "97001", accountName: "اعتبار هزینه تامین شده",    ratio: "**" }
    ]
  },
  {
    id: 22,
    title: "ثبت شماره ۲۲-۱",
    description: "در صورت پرداخت مابقی بدهی‌های مرتبط با علی‌الحساب و تسویه آن",
    code: "OP-22-1",
    category: "payments",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "21001", accountName: "حساب‌ها و اسناد پرداختنی",                              ratio: "**" },
      { type: "credit", accountCode: "24001", accountName: "بیمه پرداختنی",                                          ratio: "**" },
      { type: "credit", accountCode: "24004", accountName: "مالیات پرداختنی",                                        ratio: "**" },
      { type: "credit", accountCode: "21007", accountName: "سپرده‌های پرداختنی",                                     ratio: "**" },
      { type: "credit", accountCode: "11001", accountName: "بانک پرداخت هزینه",                                      ratio: "**" },
      { type: "credit", accountCode: "11003", accountName: "بانک پرداخت اختصاصی",                                    ratio: "**" },
      { type: "credit", accountCode: "11004", accountName: "بانک وجوه سایر منابع",                                   ratio: "**" },
      { type: "debit",  accountCode: "82003", accountName: "طرف حساب انتظامی- علی‌الحساب بابت عملیات جاری",        ratio: "**" },
      { type: "credit", accountCode: "81003", accountName: "حساب انتظامی- علی‌الحساب بابت عملیات جاری",            ratio: "**" },
      { type: "debit",  accountCode: "99001", accountName: "اعتبار هزینه مصرف شده",                                  ratio: "**" },
      { type: "credit", accountCode: "98001", accountName: "اعتبار هزینه بابت پرداخت‌های غیرقطعی",                  ratio: "**" },
      { type: "credit", accountCode: "97001", accountName: "اعتبار هزینه تامین شده",                                 ratio: "**" }
    ]
  },
  {
    id: 52,
    title: "ثبت شماره ۲۲-۲",
    description: "پرداخت کسور قانونی مرتبط با تسویه علی‌الحساب",
    code: "OP-22-2",
    category: "payments",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "24001", accountName: "بیمه پرداختنی",              ratio: "**" },
      { type: "debit",  accountCode: "24004", accountName: "مالیات پرداختنی",            ratio: "**" },
      { type: "credit", accountCode: "11001", accountName: "بانک پرداخت هزینه",          ratio: "**" },
      { type: "credit", accountCode: "11003", accountName: "بانک پرداخت اختصاصی",        ratio: "**" },
      { type: "credit", accountCode: "11004", accountName: "بانک وجوه سایر منابع",       ratio: "**" },
      { type: "debit",  accountCode: "99001", accountName: "اعتبار هزینه مصرف شده",      ratio: "**" },
      { type: "credit", accountCode: "97001", accountName: "اعتبار هزینه تامین شده",     ratio: "**" }
    ]
  },
  {
    id: 23,
    title: "ثبت شماره ۲۳",
    description: "به هنگام دریافت اسناد و مدارک مربوط به استفاده از تنخواه‌گردان پرداخت واگذار شده از عاملین ذیحساب",
    code: "OP-23",
    category: "payments",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "81006", accountName: "حساب انتظامی- اسناد وصولی از عاملین ذیحساب",      ratio: "**" },
      { type: "credit", accountCode: "82006", accountName: "طرف حساب انتظامی- اسناد وصولی از عاملین ذیحساب", ratio: "**" }
    ]
  },
  {
    id: 24,
    title: "ثبت شماره ۲۴",
    description: "پس از تایید اسناد و مدارک مربوط به استفاده از تنخواه‌گردان پرداخت واگذار شده",
    code: "OP-24",
    category: "payments",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "61001", accountName: "هزینه‌ها - هزینه جبران خدمت کارکنان (به تفکیک طبقه‌بندی اقتصادی دولت)",    ratio: "**" },
      { type: "debit",  accountCode: "61002", accountName: "هزینه‌ها - هزینه استفاده از کالا و خدمات (به تفکیک طبقه‌بندی اقتصادی دولت)", ratio: "**" },
      { type: "debit",  accountCode: "13001", accountName: "موجودی‌ها - موجودی ملزومات (به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها)",        ratio: "**" },
      { type: "debit",  accountCode: "14001", accountName: "پیش‌پرداخت بابت عملیات جاری",                                                  ratio: "**" },
      { type: "credit", accountCode: "11021", accountName: "تنخواه‌گردان پرداخت بابت عملیات جاری",                                         ratio: "**" },
      { type: "debit",  accountCode: "81003", accountName: "حساب انتظامی- علی‌الحساب بابت عملیات جاری",                                    ratio: "**" },
      { type: "credit", accountCode: "82003", accountName: "طرف حساب انتظامی- علی‌الحساب بابت عملیات جاری",                               ratio: "**" },
      { type: "debit",  accountCode: "81001", accountName: "حساب انتظامی- تضمین‌های دریافتی",                                               ratio: "**" },
      { type: "credit", accountCode: "82001", accountName: "طرف حساب انتظامی- تضمین‌های دریافتی",                                          ratio: "**" },
      { type: "debit",  accountCode: "99001", accountName: "اعتبار هزینه مصرف شده (به میزان پرداخت‌های قطعی از محل تنخواه‌گردان)",         ratio: "**" },
      { type: "credit", accountCode: "98001", accountName: "اعتبار هزینه بابت پرداخت‌های غیرقطعی",                                         ratio: "**" }
    ]
  },
  {
    id: 25,
    title: "ثبت شماره ۲۵",
    description: "در صورت تایید اسناد و مدارک مربوط به تسویه تنخواه‌گردان واگذار شده به عاملین ذیحساب در موعد قانونی مقرر",
    code: "OP-25",
    category: "payments",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "21001", accountName: "حساب‌ها و اسناد پرداختنی",                                                      ratio: "**" },
      { type: "credit", accountCode: "61001", accountName: "هزینه‌ها - به تفکیک طبقه‌بندی اقتصادی دولت",                                    ratio: "**" },
      { type: "credit", accountCode: "13001", accountName: "موجودی‌ها - به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها",                            ratio: "**" },
      { type: "credit", accountCode: "14001", accountName: "پیش‌پرداخت بابت عملیات جاری",                                                    ratio: "**" },
      { type: "credit", accountCode: "11004", accountName: "بانک وجوه سایر منابع",                                                           ratio: "**" },
      { type: "debit",  accountCode: "82003", accountName: "طرف حساب انتظامی- علی‌الحساب بابت عملیات جاری",                                 ratio: "**" },
      { type: "credit", accountCode: "81003", accountName: "حساب انتظامی- علی‌الحساب بابت عملیات جاری",                                     ratio: "**" },
      { type: "debit",  accountCode: "82001", accountName: "طرف حساب انتظامی- تضمین‌های دریافتی",                                            ratio: "**" },
      { type: "credit", accountCode: "81001", accountName: "حساب انتظامی- تضمین‌های دریافتی",                                                ratio: "**" }
    ]
  },
  {
    id: 26,
    title: "ثبت شماره ۲۶",
    description: "شناسایی واریز نقدی تنخواه‌گردان پرداخت و پیش‌پرداخت سال‌جاری",
    code: "OP-26",
    category: "payments",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "11001", accountName: "بانک پرداخت هزینه",                          ratio: "**" },
      { type: "debit",  accountCode: "11003", accountName: "بانک پرداخت اختصاصی",                        ratio: "**" },
      { type: "debit",  accountCode: "11004", accountName: "بانک وجوه سایر منابع",                       ratio: "**" },
      { type: "credit", accountCode: "11021", accountName: "تنخواه‌گردان پرداخت بابت عملیات جاری",       ratio: "**" },
      { type: "credit", accountCode: "14001", accountName: "پیش‌پرداخت بابت عملیات جاری",                ratio: "**" },
      { type: "debit",  accountCode: "93001", accountName: "اعتبار هزینه تخصیص یافته", section: "به ميزان واريز نقدي پيشپرداخت و تنخواهگردانپرداخت از محل اعتبار تخصيصيافته، اعتبار اختصاصي و اعتبار ابالغي",                   ratio: "**" },
      { type: "debit",  accountCode: "92001", accountName: "اعتبار هزینه", section: "به ميزان واريز نقدي پيشپرداخت و تنخواهگردانپرداخت از محل اعتبار تخصيصيافته، اعتبار اختصاصي و اعتبار ابالغي",                               ratio: "**" },
      { type: "debit",  accountCode: "95001", accountName: "اعتبار هزینه ابلاغی", section: "به ميزان واريز نقدي پيشپرداخت و تنخواهگردانپرداخت از محل اعتبار تخصيصيافته، اعتبار اختصاصي و اعتبار ابالغي",                        ratio: "**" },
      { type: "credit", accountCode: "98001", accountName: "اعتبار هزینه بابت پرداخت‌های غیرقطعی", section: "به ميزان واريز نقدي پيشپرداخت و تنخواهگردانپرداخت از محل اعتبار تخصيصيافته، اعتبار اختصاصي و اعتبار ابالغي",       ratio: "**" },
      { type: "debit",  accountCode: "82001", accountName: "طرف حساب انتظامی- تضمین‌های دریافتی", section: "به ميزان كاهش تضمينهاي دريافتي",        ratio: "**" },
      { type: "credit", accountCode: "81001", accountName: "حساب انتظامی- تضمین‌های دریافتی", section: "به ميزان كاهش تضمينهاي دريافتي",            ratio: "**" }
    ]
  },
  {
    id: 27,
    title: "ثبت شماره ۲۷",
    description: "در صورت واخواهی اسناد ارایه شده",
    code: "OP-27",
    category: "payments",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "11505", accountName: "حساب‌ها و اسناد دریافتنی- اسناد واخواهی هزینه", ratio: "**" },
      { type: "credit", accountCode: "11021", accountName: "تنخواه‌گردان پرداخت بابت عملیات جاری",          ratio: "**" },
      { type: "debit",  accountCode: "92501", accountName: "اسناد واخواهی بابت اعتبار هزینه",               ratio: "**" },
      { type: "credit", accountCode: "98001", accountName: "اعتبار هزینه بابت پرداخت‌های غیرقطعی",          ratio: "**" }
    ]
  },
  {
    id: 28,
    title: "ثبت شماره ۲۸",
    description: "در صورت رفع اسناد واخواهی در سال شناسایی آن",
    code: "OP-28",
    category: "payments",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "61001", accountName: "هزینه‌ها - به تفکیک طبقه‌بندی اقتصادی دولت",             ratio: "**" },
      { type: "debit",  accountCode: "13001", accountName: "موجودی‌ها - به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها",      ratio: "**" },
      { type: "debit",  accountCode: "14001", accountName: "پیش‌پرداخت بابت عملیات جاری",                              ratio: "**" },
      { type: "credit", accountCode: "11505", accountName: "حساب‌ها و اسناد دریافتنی- اسناد واخواهی هزینه",           ratio: "**" },
      { type: "debit",  accountCode: "99001", accountName: "اعتبار هزینه مصرف شده",                                    ratio: "**" },
      { type: "debit",  accountCode: "98001", accountName: "اعتبار هزینه بابت پرداخت‌های غیرقطعی",                    ratio: "**" },
      { type: "credit", accountCode: "92501", accountName: "اسناد واخواهی بابت اعتبار هزینه",                          ratio: "**" }
    ]
  },
  {
    id: 29,
    title: "ثبت شماره ۲۹",
    description: "در صورت رفع اسناد واخواهی شده در سال بعد (پس از پایان آخرین مهلت درنظر گرفته شده برای ارائه صورت‌حساب دریافت و پرداخت نهایی)",
    code: "OP-29",
    category: "payments",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "31006", accountName: "تعدیلات سنواتی",                                                 ratio: "**" },
      { type: "debit",  accountCode: "13001", accountName: "موجودی‌ها - به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها",              ratio: "**" },
      { type: "debit",  accountCode: "14001", accountName: "پیش‌پرداخت بابت عملیات جاری",                                     ratio: "**" },
      { type: "credit", accountCode: "11505", accountName: "حساب‌ها و اسناد دریافتنی- اسناد واخواهی هزینه",                  ratio: "**" },
      { type: "debit",  accountCode: "99003", accountName: "اعتبار هزینه انتقالی مصرف شده",                                   ratio: "**" },
      { type: "debit",  accountCode: "98003", accountName: "اعتبار هزینه انتقالی بابت پرداخت‌های غیرقطعی",                   ratio: "**" },
      { type: "credit", accountCode: "92503", accountName: "اسناد واخواهی بابت اعتبار هزینه انتقالی",                        ratio: "**" }
    ]
  },
  {
    id: 30,
    title: "ثبت شماره ۳۰",
    description: "در صورت عدم رفع اسناد واخواهی شده تا موعد قانونی تهیه صورت‌حساب عملکرد بودجه سالانه کل کشور",
    code: "OP-30",
    category: "payments",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "11507", accountName: "حساب‌ها و اسناد دریافتنی- کسری ابواب‌جمعی هزینه",       ratio: "**" },
      { type: "credit", accountCode: "11505", accountName: "حساب‌ها و اسناد دریافتنی- اسناد واخواهی هزینه",         ratio: "**" },
      { type: "debit",  accountCode: "93503", accountName: "کسری ابواب‌جمعی بابت اعتبار هزینه انتقالی",             ratio: "**" },
      { type: "credit", accountCode: "92503", accountName: "اسناد واخواهی بابت اعتبار هزینه انتقالی",               ratio: "**" }
    ]
  },
  {
    id: 31,
    title: "ثبت شماره ۳۱",
    description: "در صورت ایجاد کسری در دارایی‌ها",
    code: "OP-31",
    category: "payments",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "11507", accountName: "حساب‌ها و اسناد دریافتنی- کسری ابواب‌جمعی هزینه",       ratio: "**" },
      { type: "credit", accountCode: "13001", accountName: "موجودی‌ها - به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها",     ratio: "**" },
      { type: "credit", accountCode: "11021", accountName: "تنخواه‌گردان پرداخت بابت عملیات جاری",                   ratio: "**" },
      { type: "credit", accountCode: "14001", accountName: "پیش‌پرداخت بابت عملیات جاری",                            ratio: "**" },
      { type: "credit", accountCode: "11001", accountName: "بانک پرداخت هزینه",                                      ratio: "**" },
      { type: "credit", accountCode: "11003", accountName: "بانک پرداخت اختصاصی",                                    ratio: "**" },
      { type: "credit", accountCode: "11004", accountName: "بانک وجوه سایر منابع",                                   ratio: "**" },
      { type: "debit",  accountCode: "93501", accountName: "کسری ابواب‌جمعی بابت اعتبار هزینه",                      ratio: "**" },
      { type: "credit", accountCode: "98001", accountName: "اعتبار هزینه بابت پرداخت‌های غیرقطعی",                   ratio: "**" },
      { type: "credit", accountCode: "92001", accountName: "اعتبار هزینه",                                           ratio: "**" },
      { type: "credit", accountCode: "93001", accountName: "اعتبار هزینه تخصیص یافته",                               ratio: "**" },
      { type: "credit", accountCode: "95001", accountName: "اعتبار هزینه ابلاغی",                                    ratio: "**" }
    ]
  },
  {
    id: 32,
    title: "ثبت شماره ۳۲",
    description: "در صورت رفع کسری ابواب‌جمعی در سال شناسایی آن",
    code: "OP-32",
    category: "payments",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "61001", accountName: "هزینه‌ها - به تفکیک طبقه‌بندی اقتصادی دولت",            ratio: "**" },
      { type: "debit",  accountCode: "13001", accountName: "موجودی‌ها - به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها",     ratio: "**" },
      { type: "credit", accountCode: "11507", accountName: "حساب‌ها و اسناد دریافتنی- کسری ابواب‌جمعی هزینه",        ratio: "**" },
      { type: "debit",  accountCode: "99001", accountName: "اعتبار هزینه مصرف شده",                                   ratio: "**" },
      { type: "credit", accountCode: "93501", accountName: "کسری ابواب‌جمعی بابت اعتبار هزینه",                      ratio: "**" }
    ]
  },
  {
    id: 33,
    title: "ثبت شماره ۳۳",
    description: "در صورت رفع کسری ابواب‌جمعی پس از پایان آخرین مهلت درنظر گرفته شده برای ارائه صورت‌حساب دریافت و پرداخت نهایی",
    code: "OP-33",
    category: "payments",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "31006", accountName: "تعدیلات سنواتی",                                              ratio: "**" },
      { type: "debit",  accountCode: "13001", accountName: "موجودی‌ها - به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها",           ratio: "**" },
      { type: "credit", accountCode: "11507", accountName: "حساب‌ها و اسناد دریافتنی- کسری ابواب‌جمعی هزینه",             ratio: "**" },
      { type: "debit",  accountCode: "99003", accountName: "اعتبار هزینه انتقالی مصرف شده",                                ratio: "**" },
      { type: "credit", accountCode: "93503", accountName: "کسری ابواب‌جمعی بابت اعتبار هزینه انتقالی",                   ratio: "**" }
    ]
  },
  {
    id: 34,
    title: "ثبت شماره ۳۴",
    description: "در صورت واریز نقدی کسری ابواب‌جمعی یا اسناد واخواهی شده از سوی اشخاص در سال(های) پس از شناسایی آن",
    code: "OP-34",
    category: "payments",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "11001", accountName: "بانک پرداخت هزینه",                                      ratio: "**" },
      { type: "debit",  accountCode: "11003", accountName: "بانک پرداخت اختصاصی",                                    ratio: "**" },
      { type: "debit",  accountCode: "11004", accountName: "بانک وجوه سایر منابع",                                   ratio: "**" },
      { type: "credit", accountCode: "11505", accountName: "حساب‌ها و اسناد دریافتنی- اسناد واخواهی هزینه",         ratio: "**" },
      { type: "credit", accountCode: "11507", accountName: "حساب‌ها و اسناد دریافتنی- کسری ابواب‌جمعی هزینه",       ratio: "**" },
      { type: "debit",  accountCode: "91003", accountName: "بودجه اعتبار هزینه انتقالی",                             ratio: "**" },
      { type: "credit", accountCode: "92503", accountName: "اسناد واخواهی بابت اعتبار هزینه انتقالی",               ratio: "**" },
      { type: "credit", accountCode: "93503", accountName: "کسری ابواب‌جمعی بابت اعتبار هزینه انتقالی",             ratio: "**" }
    ]
  },
  {
    id: 35,
    title: "ثبت شماره ۳۵-۱",
    description: "احکام تعهدآور صادره از مراجع ذی‌صلاح - به هنگام صدور حکم تعهدآور از سوی مراجع ذی‌صلاح به واحد محکوم",
    code: "OP-35-1",
    category: "expenses",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "61001", accountName: "هزینه‌ها - به تفکیک طبقه‌بندی اقتصادی دولت",  ratio: "**" },
      { type: "credit", accountCode: "24005", accountName: "ذخیره احکام صادره از مراجع ذی‌صلاح",           ratio: "**" }
    ]
  },
  {
    id: 53,
    title: "ثبت شماره ۳۵-۲",
    description: "احکام تعهدآور صادره از مراجع ذی‌صلاح - برداشت از حساب‌های بانکی پس از تامین منابع (اعتبار مصوب یا وجوه سایر منابع)",
    code: "OP-35-2",
    category: "expenses",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "24005", accountName: "ذخیره احکام صادره از مراجع ذی‌صلاح",  ratio: "**" },
      { type: "credit", accountCode: "11001", accountName: "بانک پرداخت هزینه",                    ratio: "**" },
      { type: "credit", accountCode: "11003", accountName: "بانک پرداخت اختصاصی",                  ratio: "**" },
      { type: "credit", accountCode: "11004", accountName: "بانک وجوه سایر منابع",                 ratio: "**" },
      { type: "debit",  accountCode: "99001", accountName: "اعتبار هزینه مصرف شده",                ratio: "**" },
      { type: "credit", accountCode: "97001", accountName: "اعتبار هزینه تامین شده",               ratio: "**" }
    ]
  },
  {
    id: 54,
    title: "ثبت شماره ۳۵-۳-۱",
    description: "موضوع بند (ج) ماده (۲۴) قانون تنظیم بخشی از مقررات مالی دولت - دفاتر واحد محکوم: پس از جابجایی و کاهش اعتبار واحد محکوم",
    code: "OP-35-3-1",
    category: "expenses",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "91001", accountName: "بودجه اعتبار هزینه",                          ratio: "**" },
      { type: "credit", accountCode: "92001", accountName: "اعتبار هزینه / اعتبار هزینه تخصیص یافته",    ratio: "**" },
      { type: "debit",  accountCode: "24005", accountName: "ذخیره احکام صادره از مراجع ذی‌صلاح",         ratio: "**" },
      { type: "credit", accountCode: "46001", accountName: "درآمدها - انتقالات",                          ratio: "**" }
    ]
  },
  {
    id: 55,
    title: "ثبت شماره ۳۵-۳-۲",
    description: "موضوع بند (ج) ماده (۲۴) قانون تنظیم بخشی از مقررات مالی دولت - دفاتر سازمان مدیریت و برنامه‌ریزی استان: در صورت پرداخت احکام صادره واحدهای محکوم توسط سازمان مدیریت و برنامه‌ریزی استان",
    code: "OP-35-3-2",
    category: "expenses",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "97001", accountName: "اعتبار هزینه تامین شده",   ratio: "**" },
      { type: "credit", accountCode: "95001", accountName: "اعتبار هزینه ابلاغی",      ratio: "**" },
      { type: "debit",  accountCode: "62001", accountName: "هزینه‌ها - انتقالات",       ratio: "**" },
      { type: "credit", accountCode: "11001", accountName: "بانک پرداخت ...",           ratio: "**" },
      { type: "debit",  accountCode: "99001", accountName: "اعتبار هزینه مصرف شده",    ratio: "**" },
      { type: "credit", accountCode: "97001", accountName: "اعتبار هزینه تامین شده",   ratio: "**" }
    ]
  },
  {
    id: 56,
    title: "ثبت شماره ۳۵-۴",
    description: "در صورتی که منابع لازم در مهلت قانونی تعیین شده برای پرداخت احکام صادره از مراجع ذی‌صلاح تامین نشود و برداشت وجه نقد از سوی اشخاص انجام شود - کسری وجوه ایجاد شده بر اساس اعلامیه بانکی",
    code: "OP-35-4",
    category: "expenses",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "24005", accountName: "ذخیره احکام صادره از مراجع ذی‌صلاح",         ratio: "**" },
      { type: "credit", accountCode: "11001", accountName: "بانک پرداخت هزینه",                           ratio: "**" },
      { type: "credit", accountCode: "11003", accountName: "بانک پرداخت اختصاصی",                         ratio: "**" },
      { type: "credit", accountCode: "11004", accountName: "بانک وجوه سایر منابع",                        ratio: "**" },
      { type: "debit",  accountCode: "81007", accountName: "حساب انتظامی- کسری ابواب‌جمعی برداشتی",       ratio: "**" },
      { type: "credit", accountCode: "82007", accountName: "طرف حساب انتظامی- کسری ابواب‌جمعی برداشتی",  ratio: "**" }
    ]
  },
  {
    id: 57,
    title: "ثبت شماره ۳۵-۵",
    description: "چنانچه برداشت وجه نقد به موجب احکام صادره از مراجع ذی‌صلاح از حساب بانکی عامل ذیحساب انجام شود - به محض اطلاع از کسری ایجاد شده در تنخواه‌گردان پرداخت",
    code: "OP-35-5",
    category: "expenses",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "61001", accountName: "هزینه‌ها - به تفکیک طبقه‌بندی اقتصادی دولت",  ratio: "**" },
      { type: "credit", accountCode: "11021", accountName: "تنخواه‌گردان پرداخت بابت عملیات جاری",         ratio: "**" },
      { type: "debit",  accountCode: "93001", accountName: "اعتبار هزینه تخصیص یافته", section: "تعديل حسابهاي بودجه اي مربوط",                     ratio: "**" },
      { type: "credit", accountCode: "98001", accountName: "اعتبار هزینه بابت پرداخت‌های غیرقطعی", section: "تعديل حسابهاي بودجه اي مربوط",         ratio: "**" },
      { type: "debit",  accountCode: "81007", accountName: "حساب انتظامی- کسری ابواب‌جمعی برداشتی",        ratio: "**" },
      { type: "credit", accountCode: "82007", accountName: "طرف حساب انتظامی- کسری ابواب‌جمعی برداشتی",   ratio: "**" }
    ]
  },
  {
    id: 58,
    title: "ثبت شماره ۳۵-۶",
    description: "چنانچه در سال شناسایی کسری ابواب‌جمعی برداشتی، منابع لازم تامین و کسری رفع گردد",
    code: "OP-35-6",
    category: "expenses",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "82007", accountName: "طرف حساب انتظامی- کسری ابواب‌جمعی برداشتی",  ratio: "**" },
      { type: "credit", accountCode: "81007", accountName: "حساب انتظامی- کسری ابواب‌جمعی برداشتی",      ratio: "**" },
      { type: "debit",  accountCode: "99001", accountName: "اعتبار هزینه مصرف شده",                       ratio: "**" },
      { type: "credit", accountCode: "93001", accountName: "اعتبار هزینه تخصیص یافته",                    ratio: "**" }
    ]
  },
  {
    id: 59,
    title: "ثبت شماره ۳۵-۷",
    description: "چنانچه منابع لازم برای رفع کسری ابواب‌جمعی برداشتی، در دوره‌های مالی پس از شناسایی آن تامین شود",
    code: "OP-35-7",
    category: "expenses",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "82007", accountName: "طرف حساب انتظامی- کسری ابواب‌جمعی برداشتی",  ratio: "**" },
      { type: "credit", accountCode: "81007", accountName: "حساب انتظامی- کسری ابواب‌جمعی برداشتی",      ratio: "**" }
    ]
  },
  {
    id: 60,
    title: "ثبت شماره ۳۵-۸",
    description: "در صورت واریز نقدی کسری ابواب‌جمعی برداشتی از سوی اشخاص در دوره‌های مالی پس از شناسایی آن",
    code: "OP-35-8",
    category: "expenses",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "11001", accountName: "بانک پرداخت هزینه",                           ratio: "**" },
      { type: "debit",  accountCode: "11003", accountName: "بانک پرداخت اختصاصی",                         ratio: "**" },
      { type: "debit",  accountCode: "11004", accountName: "بانک وجوه سایر منابع",                        ratio: "**" },
      { type: "credit", accountCode: "31006", accountName: "تعدیلات سنواتی",                              ratio: "**" },
      { type: "debit",  accountCode: "82007", accountName: "طرف حساب انتظامی- کسری ابواب‌جمعی برداشتی",  ratio: "**" },
      { type: "credit", accountCode: "81007", accountName: "حساب انتظامی- کسری ابواب‌جمعی برداشتی",      ratio: "**" }
    ]
  },
  {
    id: 36,
    title: "ثبت شماره ۳۶",
    description: "پس از تامین اعتبار لازم و به هنگام خرید بن غیرنقدی کارکنان",
    code: "OP-36",
    category: "expenses",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "11509", accountName: "حساب‌ها و اسناد دریافتنی- بن غیرنقدی",  ratio: "**" },
      { type: "credit", accountCode: "11001", accountName: "بانک پرداخت هزینه",                      ratio: "**" },
      { type: "credit", accountCode: "11003", accountName: "بانک پرداخت اختصاصی",                    ratio: "**" },
      { type: "credit", accountCode: "11004", accountName: "بانک وجوه سایر منابع",                   ratio: "**" },
      { type: "credit", accountCode: "21001", accountName: "حساب‌ها و اسناد پرداختنی",               ratio: "**" }
    ]
  },
  {
    id: 37,
    title: "ثبت شماره ۳۷",
    description: "به هنگام تحویل بن غیرنقدی به کارکنان",
    code: "OP-37",
    category: "expenses",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "61001", accountName: "هزینه‌ها - به تفکیک طبقه‌بندی اقتصادی دولت",  ratio: "**" },
      { type: "credit", accountCode: "11509", accountName: "حساب‌ها و اسناد دریافتنی- بن غیرنقدی",        ratio: "**" },
      { type: "debit",  accountCode: "99001", accountName: "اعتبار هزینه مصرف شده",                        ratio: "**" },
      { type: "credit", accountCode: "97001", accountName: "اعتبار هزینه تامین شده",                       ratio: "**" }
    ]
  },
  {
    id: 38,
    title: "ثبت شماره ۳۸",
    description: "پس از تامین اعتبار لازم و به هنگام خرید کارت هدیه از بانک‌ها یا موسسات مالی مطابق قوانین و مقررات مربوط",
    code: "OP-38",
    category: "expenses",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "11020", accountName: "کارت هدیه",                          ratio: "**" },
      { type: "credit", accountCode: "11001", accountName: "بانک پرداخت هزینه",                  ratio: "**" },
      { type: "credit", accountCode: "11003", accountName: "بانک پرداخت اختصاصی",                ratio: "**" },
      { type: "credit", accountCode: "11004", accountName: "بانک وجوه سایر منابع",               ratio: "**" },
      { type: "credit", accountCode: "21001", accountName: "حساب‌ها و اسناد پرداختنی",           ratio: "**" }
    ]
  },
  {
    id: 39,
    title: "ثبت شماره ۳۹",
    description: "به هنگام واگذاری کارت هدیه به اشخاص طبق قوانین و مقررات مربوط",
    code: "OP-39",
    category: "expenses",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "61001", accountName: "هزینه‌ها - به تفکیک طبقه‌بندی اقتصادی دولت",  ratio: "**" },
      { type: "credit", accountCode: "11020", accountName: "کارت هدیه",                                    ratio: "**" },
      { type: "debit",  accountCode: "99001", accountName: "اعتبار هزینه مصرف شده",                        ratio: "**" },
      { type: "credit", accountCode: "97001", accountName: "اعتبار هزینه تامین شده",                       ratio: "**" }
    ]
  },
  {
    id: 40,
    title: "ثبت شماره ۴۰",
    description: "شناسایی بدهی‌ها بابت تعهدات مازاد بر اعتبار هزینه تخصیص یافته",
    code: "OP-40",
    category: "expenses",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "61001", accountName: "هزینه‌ها - به تفکیک طبقه‌بندی اقتصادی دولت",            ratio: "**" },
      { type: "debit",  accountCode: "13001", accountName: "موجودی‌ها - به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها",     ratio: "**" },
      { type: "credit", accountCode: "24006", accountName: "ذخیره تعهدات هزینه‌ای",                                  ratio: "**" }
    ]
  },
  {
    id: 41,
    title: "ثبت شماره ۴۱",
    description: "شناسایی مزایای پایان خدمت کارکنان و مرخصی استفاده نشده کارکنان در پایان سال مالی",
    code: "OP-41",
    category: "expenses",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "61001", accountName: "هزینه مزایای پایان خدمت - به تفکیک طبقه‌بندی اقتصادی دولت", section: "هزينه مزاياي پايان خدمت كاركنان",        ratio: "**" },
      { type: "credit", accountCode: "26001", accountName: "ذخیره مزایای پایان خدمت کارکنان", section: "هزينه مزاياي پايان خدمت كاركنان",                                   ratio: "**" },
      { type: "debit",  accountCode: "61001", accountName: "هزینه مرخصی استفاده نشده - به تفکیک طبقه‌بندی اقتصادی دولت", section: "هزينه مرخصي استفاده نشده كاركنان",       ratio: "**" },
      { type: "credit", accountCode: "27001", accountName: "ذخیره مرخصی استفاده نشده کارکنان", section: "هزينه مرخصي استفاده نشده كاركنان",                                  ratio: "**" }
    ]
  },
  {
    id: 42,
    title: "ثبت شماره ۴۲",
    description: "به هنگام پرداخت مزایای پایان خدمت و مرخصی استفاده نشده کارکنان",
    code: "OP-42",
    category: "expenses",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "97001", accountName: "اعتبار هزینه تامین شده",                    ratio: "**" },
      { type: "credit", accountCode: "93001", accountName: "اعتبار هزینه تخصیص یافته",                  ratio: "**" },
      { type: "credit", accountCode: "95001", accountName: "اعتبار هزینه ابلاغی",                       ratio: "**" },
      { type: "debit",  accountCode: "26001", accountName: "ذخیره مزایای پایان خدمت کارکنان",           ratio: "**" },
      { type: "debit",  accountCode: "27001", accountName: "ذخیره مرخصی استفاده نشده کارکنان",          ratio: "**" },
      { type: "credit", accountCode: "11001", accountName: "بانک پرداخت هزینه",                         ratio: "**" },
      { type: "credit", accountCode: "11003", accountName: "بانک پرداخت اختصاصی",                       ratio: "**" },
      { type: "debit",  accountCode: "99001", accountName: "اعتبار هزینه مصرف شده",                     ratio: "**" },
      { type: "credit", accountCode: "97001", accountName: "اعتبار هزینه تامین شده",                    ratio: "**" }
    ]
  },
  {
    id: 43,
    title: "ثبت شماره ۴۳",
    description: "شناسایی سایر ذخایر (مانند جرایم یا مخارج پاکسازی غیرقانونی محیط زیست، دعاوی حقوقی و مزایای اجتماعی)",
    code: "OP-43",
    category: "expenses",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "61001", accountName: "هزینه‌ها - به تفکیک طبقه‌بندی اقتصادی دولت",        ratio: "**" },
      { type: "debit",  accountCode: "15001", accountName: "دارایی‌ها - به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها",  ratio: "**" },
      { type: "debit",  accountCode: "13001", accountName: "موجودی‌ها - به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها",  ratio: "**" },
      { type: "credit", accountCode: "27002", accountName: "سایر ذخایر",                                         ratio: "**" }
    ]
  },
  {
    id: 44,
    title: "ثبت شماره ۴۴-۱",
    description: "بستن حساب‌های مالی موقت",
    code: "OP-44-1",
    category: "closing",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "41001", accountName: "دریافتی بابت عملیات جاری",                    ratio: "**" },
      { type: "debit",  accountCode: "43001", accountName: "هدایا و کمک‌ها",                              ratio: "**" },
      { type: "debit",  accountCode: "41010", accountName: "دریافتی از محل سایر منابع",                   ratio: "**" },
      { type: "debit",  accountCode: "46001", accountName: "درآمدها- انتقالات",                           ratio: "**" },
      { type: "credit", accountCode: "61001", accountName: "هزینه‌ها - به تفکیک طبقه‌بندی اقتصادی دولت",  ratio: "**" },
      { type: "credit", accountCode: "62001", accountName: "هزینه‌ها- انتقالات",                          ratio: "**" },
      { type: "credit", accountCode: "63001", accountName: "انتقال به خزانه",                             ratio: "**" },
      { type: "credit", accountCode: "31007", accountName: "خالص تغییر در وضعیت مالی",                   ratio: "**" },
      { type: "debit",  accountCode: "31007", accountName: "خالص تغییر در وضعیت مالی",                   ratio: "**" },
      { type: "credit", accountCode: "31001", accountName: "ارزش خالص انباشته",                           ratio: "**" },
      { type: "debit",  accountCode: "31001", accountName: "ارزش خالص انباشته",                           ratio: "**" },
      { type: "credit", accountCode: "31006", accountName: "تعدیلات سنواتی",                              ratio: "**" }
    ]
  },
  {
    id: 45,
    title: "ثبت شماره ۴۴-۲",
    description: "بستن حساب‌های مالی دایمی",
    code: "OP-44-2",
    category: "closing",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "21001", accountName: "حساب‌ها و اسناد پرداختنی",                              ratio: "**" },
      { type: "debit",  accountCode: "24001", accountName: "بیمه پرداختنی",                                         ratio: "**" },
      { type: "debit",  accountCode: "24004", accountName: "مالیات پرداختنی",                                       ratio: "**" },
      { type: "debit",  accountCode: "21007", accountName: "سپرده پرداختنی",                                        ratio: "**" },
      { type: "debit",  accountCode: "24005", accountName: "ذخیره احکام صادره از مراجع ذی‌صلاح",                    ratio: "**" },
      { type: "debit",  accountCode: "24006", accountName: "ذخیره تعهدات هزینه‌ای",                                 ratio: "**" },
      { type: "debit",  accountCode: "26001", accountName: "ذخیره مزایای پایان خدمت کارکنان",                       ratio: "**" },
      { type: "debit",  accountCode: "27001", accountName: "ذخیره مرخصی استفاده نشده کارکنان",                      ratio: "**" },
      { type: "debit",  accountCode: "27002", accountName: "سایر ذخایر",                                            ratio: "**" },
      { type: "debit",  accountCode: "31001", accountName: "ارزش خالص انباشته",                                     ratio: "**" },
      { type: "credit", accountCode: "11001", accountName: "بانک پرداخت هزینه",                                     ratio: "**" },
      { type: "credit", accountCode: "11003", accountName: "بانک پرداخت اختصاصی",                                   ratio: "**" },
      { type: "credit", accountCode: "11004", accountName: "بانک وجوه سایر منابع",                                  ratio: "**" },
      { type: "credit", accountCode: "11020", accountName: "کارت هدیه",                                             ratio: "**" },
      { type: "credit", accountCode: "11021", accountName: "تنخواه‌گردان پرداخت بابت عملیات جاری",                  ratio: "**" },
      { type: "credit", accountCode: "11509", accountName: "حساب‌ها و اسناد دریافتنی- بن غیرنقدی",                  ratio: "**" },
      { type: "credit", accountCode: "11505", accountName: "حساب‌ها و اسناد دریافتنی- اسناد واخواهی هزینه",         ratio: "**" },
      { type: "credit", accountCode: "11507", accountName: "حساب‌ها و اسناد دریافتنی- کسری ابواب‌جمعی هزینه",       ratio: "**" },
      { type: "credit", accountCode: "11522", accountName: "مطالبات از خزانه",                                      ratio: "**" },
      { type: "credit", accountCode: "13001", accountName: "موجودی‌ها - به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها",    ratio: "**" },
      { type: "credit", accountCode: "14001", accountName: "پیش‌پرداخت بابت عملیات جاری",                           ratio: "**" }
    ]
  },
  {
    id: 46,
    title: "ثبت شماره ۴۴-۳",
    description: "بستن حساب‌های انتظامی",
    code: "OP-44-3",
    category: "closing",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "82003", accountName: "طرف حساب انتظامی- علی‌الحساب بابت عملیات جاری",          ratio: "**" },
      { type: "credit", accountCode: "81003", accountName: "حساب انتظامی- علی‌الحساب بابت عملیات جاری",              ratio: "**" },
      { type: "debit",  accountCode: "82001", accountName: "طرف حساب انتظامی- تضمین‌های دریافتی",                    ratio: "**" },
      { type: "credit", accountCode: "81001", accountName: "حساب انتظامی- تضمین‌های دریافتی",                        ratio: "**" },
      { type: "debit",  accountCode: "82006", accountName: "طرف حساب انتظامی- اسناد وصولی از عاملین ذیحساب",         ratio: "**" },
      { type: "credit", accountCode: "81006", accountName: "حساب انتظامی- اسناد وصولی از عاملین ذیحساب",             ratio: "**" },
      { type: "debit",  accountCode: "82007", accountName: "طرف حساب انتظامی- کسری ابواب‌جمعی برداشتی",              ratio: "**" },
      { type: "credit", accountCode: "81007", accountName: "حساب انتظامی- کسری ابواب‌جمعی برداشتی",                  ratio: "**" },
      { type: "debit",  accountCode: "82017", accountName: "طرف حساب انتظامی- کنترل دریافتی‌ها بابت اعتبار",         ratio: "**" },
      { type: "credit", accountCode: "81017", accountName: "حساب انتظامی- کنترل دریافتی‌ها بابت اعتبار",             ratio: "**" }
    ]
  },
  {
    id: 47,
    title: "ثبت شماره ۴۴-۴",
    description: "بستن حساب‌های بودجه‌ای",
    code: "OP-44-4",
    category: "closing",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "91001", accountName: "بودجه اعتبار هزینه",                                        ratio: "**" },
      { type: "debit",  accountCode: "91003", accountName: "بودجه اعتبار هزینه انتقالی",                                ratio: "**" },
      { type: "credit", accountCode: "92001", accountName: "اعتبار هزینه",                                              ratio: "**" },
      { type: "credit", accountCode: "93001", accountName: "اعتبار هزینه تخصیص یافته",                                  ratio: "**" },
      { type: "credit", accountCode: "94001", accountName: "حواله اعتبار هزینه",                                        ratio: "**" },
      { type: "credit", accountCode: "94003", accountName: "حواله اعتبار هزینه انتقالی",                                ratio: "**" },
      { type: "credit", accountCode: "95001", accountName: "اعتبار هزینه ابلاغی",                                       ratio: "**" },
      { type: "credit", accountCode: "95003", accountName: "اعتبار هزینه انتقالی ابلاغی",                               ratio: "**" },
      { type: "credit", accountCode: "91501", accountName: "اعتبار هزینه انتقالی",                                      ratio: "**" },
      { type: "credit", accountCode: "97001", accountName: "اعتبار هزینه تامین شده",                                    ratio: "**" },
      { type: "credit", accountCode: "97003", accountName: "اعتبار هزینه انتقالی تامین شده",                            ratio: "**" },
      { type: "credit", accountCode: "99001", accountName: "اعتبار هزینه مصرف شده",                                     ratio: "**" },
      { type: "credit", accountCode: "99003", accountName: "اعتبار هزینه انتقالی مصرف شده",                             ratio: "**" },
      { type: "credit", accountCode: "98001", accountName: "اعتبار هزینه بابت پرداخت‌های غیرقطعی",                      ratio: "**" },
      { type: "credit", accountCode: "98003", accountName: "اعتبار هزینه انتقالی بابت پرداخت‌های غیرقطعی",              ratio: "**" },
      { type: "credit", accountCode: "92501", accountName: "اسناد واخواهی بابت اعتبار هزینه",                           ratio: "**" },
      { type: "credit", accountCode: "92503", accountName: "اسناد واخواهی بابت اعتبار هزینه انتقالی",                   ratio: "**" },
      { type: "credit", accountCode: "93501", accountName: "کسری ابواب‌جمعی بابت اعتبار هزینه",                         ratio: "**" },
      { type: "credit", accountCode: "93503", accountName: "کسری ابواب‌جمعی بابت اعتبار هزینه انتقالی",                 ratio: "**" }
    ]
  },
  {
    id: 48,
    title: "ثبت شماره ۴۵-۱",
    description: "افتتاح حساب‌های مالی دایمی",
    code: "OP-45-1",
    category: "opening",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "11001", accountName: "بانک پرداخت هزینه",                                     ratio: "**" },
      { type: "debit",  accountCode: "11003", accountName: "بانک پرداخت اختصاصی",                                   ratio: "**" },
      { type: "debit",  accountCode: "11004", accountName: "بانک وجوه سایر منابع",                                  ratio: "**" },
      { type: "debit",  accountCode: "11020", accountName: "کارت هدیه",                                             ratio: "**" },
      { type: "debit",  accountCode: "11021", accountName: "تنخواه‌گردان پرداخت بابت عملیات جاری",                  ratio: "**" },
      { type: "debit",  accountCode: "11509", accountName: "حساب‌ها و اسناد دریافتنی- بن غیرنقدی",                  ratio: "**" },
      { type: "debit",  accountCode: "11505", accountName: "حساب‌ها و اسناد دریافتنی- اسناد واخواهی هزینه",         ratio: "**" },
      { type: "debit",  accountCode: "11507", accountName: "حساب‌ها و اسناد دریافتنی- کسری ابواب‌جمعی هزینه",       ratio: "**" },
      { type: "debit",  accountCode: "11522", accountName: "مطالبات از خزانه",                                      ratio: "**" },
      { type: "debit",  accountCode: "13001", accountName: "موجودی‌ها - به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها",    ratio: "**" },
      { type: "debit",  accountCode: "14001", accountName: "پیش‌پرداخت بابت عملیات جاری",                           ratio: "**" },
      { type: "credit", accountCode: "21001", accountName: "حساب‌ها و اسناد پرداختنی",                              ratio: "**" },
      { type: "credit", accountCode: "24001", accountName: "بیمه پرداختنی",                                         ratio: "**" },
      { type: "credit", accountCode: "24004", accountName: "مالیات پرداختنی",                                       ratio: "**" },
      { type: "credit", accountCode: "21007", accountName: "سپرده پرداختنی",                                        ratio: "**" },
      { type: "credit", accountCode: "24005", accountName: "ذخیره احکام صادره از مراجع ذی‌صلاح",                    ratio: "**" },
      { type: "credit", accountCode: "24006", accountName: "ذخیره تعهدات هزینه‌ای",                                 ratio: "**" },
      { type: "credit", accountCode: "26001", accountName: "ذخیره مزایای پایان خدمت کارکنان",                       ratio: "**" },
      { type: "credit", accountCode: "27001", accountName: "ذخیره مرخصی استفاده نشده کارکنان",                      ratio: "**" },
      { type: "credit", accountCode: "27002", accountName: "سایر ذخایر",                                            ratio: "**" },
      { type: "credit", accountCode: "31001", accountName: "ارزش خالص انباشته",                                     ratio: "**" }
    ]
  },
  {
    id: 49,
    title: "ثبت شماره ۴۵-۲",
    description: "افتتاح حساب‌های انتظامی",
    code: "OP-45-2",
    category: "opening",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "81003", accountName: "حساب انتظامی- علی‌الحساب بابت عملیات جاری",          ratio: "**" },
      { type: "credit", accountCode: "82003", accountName: "طرف حساب انتظامی- علی‌الحساب بابت عملیات جاری",      ratio: "**" },
      { type: "debit",  accountCode: "81001", accountName: "حساب انتظامی- تضمین‌های دریافتی",                    ratio: "**" },
      { type: "credit", accountCode: "82001", accountName: "طرف حساب انتظامی- تضمین‌های دریافتی",                ratio: "**" },
      { type: "debit",  accountCode: "81006", accountName: "حساب انتظامی- اسناد وصولی از عاملین ذیحساب",         ratio: "**" },
      { type: "credit", accountCode: "82006", accountName: "طرف حساب انتظامی- اسناد وصولی از عاملین ذیحساب",     ratio: "**" },
      { type: "debit",  accountCode: "81007", accountName: "حساب انتظامی- کسری ابواب‌جمعی برداشتی",              ratio: "**" },
      { type: "credit", accountCode: "82007", accountName: "طرف حساب انتظامی- کسری ابواب‌جمعی برداشتی",          ratio: "**" }
    ]
  },
  {
    id: 61,
    title: "ثبت شماره ۴۵-۳",
    description: "افتتاح حساب‌های بودجه‌ای (حساب‌های اعتبار هزینه انتقالی با سطح تفصیلی سنواتی افتتاح می‌شوند)",
    code: "OP-45-3",
    category: "opening",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "91501", accountName: "اعتبار هزینه انتقالی",                               ratio: "**" },
      { type: "debit",  accountCode: "97003", accountName: "اعتبار هزینه انتقالی تامین شده",                     ratio: "**" },
      { type: "debit",  accountCode: "98003", accountName: "اعتبار هزینه انتقالی بابت پرداخت‌های غیرقطعی",       ratio: "**" },
      { type: "debit",  accountCode: "92503", accountName: "اسناد واخواهی بابت اعتبار هزینه انتقالی",            ratio: "**" },
      { type: "debit",  accountCode: "93503", accountName: "کسری ابواب‌جمعی بابت اعتبار هزینه انتقالی",          ratio: "**" },
      { type: "credit", accountCode: "91003", accountName: "بودجه اعتبار هزینه انتقالی",                         ratio: "**" }
    ]
  },
  {
    id: 62,
    title: "ثبت شماره ۴۶",
    description: "به هنگام تامین اعتبار از محل وجوه انتقالی سال‌های قبل",
    code: "OP-46",
    category: "budget",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "97003", accountName: "اعتبار هزینه انتقالی تامین شده",  ratio: "**" },
      { type: "credit", accountCode: "91501", accountName: "اعتبار هزینه انتقالی",             ratio: "**" }
    ]
  },
  {
    id: 63,
    title: "ثبت شماره ۴۷",
    description: "در صورت واریز تمام یا بخشی از پیش‌پرداخت سال‌های قبل به حساب واحد گزارشگر",
    code: "OP-47",
    category: "budget",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "11001", accountName: "بانک پرداخت هزینه",                                   ratio: "**" },
      { type: "debit",  accountCode: "11003", accountName: "بانک پرداخت اختصاصی",                                 ratio: "**" },
      { type: "debit",  accountCode: "11004", accountName: "بانک وجوه سایر منابع",                                ratio: "**" },
      { type: "credit", accountCode: "14001", accountName: "پیش‌پرداخت بابت عملیات جاری",                         ratio: "**" },
      { type: "debit",  accountCode: "91003", accountName: "بودجه اعتبار هزینه انتقالی",                          ratio: "**" },
      { type: "credit", accountCode: "98003", accountName: "اعتبار هزینه انتقالی بابت پرداخت‌های غیرقطعی",        ratio: "**" }
    ]
  },
  {
    id: 64,
    title: "ثبت شماره ۴۸",
    description: "در صورت واریز تمام یا بخشی از علی‌الحساب سال‌های قبل به حساب واحد گزارشگر",
    code: "OP-48",
    category: "budget",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "11001", accountName: "بانک پرداخت هزینه",                                   ratio: "**" },
      { type: "debit",  accountCode: "11003", accountName: "بانک پرداخت اختصاصی",                                 ratio: "**" },
      { type: "debit",  accountCode: "11004", accountName: "بانک وجوه سایر منابع",                                ratio: "**" },
      { type: "credit", accountCode: "31006", accountName: "تعدیلات سنواتی",                                      ratio: "**" },
      { type: "credit", accountCode: "13001", accountName: "موجودی‌ها - به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها",  ratio: "**" },
      { type: "debit",  accountCode: "82003", accountName: "طرف حساب انتظامی- علی‌الحساب بابت عملیات جاری",       ratio: "**" },
      { type: "credit", accountCode: "81003", accountName: "حساب انتظامی- علی‌الحساب بابت عملیات جاری",           ratio: "**" },
      { type: "debit",  accountCode: "91003", accountName: "بودجه اعتبار هزینه انتقالی",                          ratio: "**" },
      { type: "credit", accountCode: "98003", accountName: "اعتبار هزینه انتقالی بابت پرداخت‌های غیرقطعی",        ratio: "**" }
    ]
  },
  {
    id: 65,
    title: "ثبت شماره ۴۹",
    description: "در صورتی‌که بر اساس قوانین و مقررات مربوط واحد گزارشگر ملزم به واریز وجوه حاصل از پیش‌پرداخت و علی‌الحساب انتقالی یا واریز منابع مانده بودجه‌ای به حساب خزانه باشد",
    code: "OP-49",
    category: "budget",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "63001", accountName: "انتقال به خزانه",              ratio: "**" },
      { type: "credit", accountCode: "11001", accountName: "بانک پرداخت هزینه",            ratio: "**" },
      { type: "credit", accountCode: "11003", accountName: "بانک پرداخت اختصاصی",          ratio: "**" },
      { type: "debit",  accountCode: "91003", accountName: "بودجه اعتبار هزینه انتقالی",   ratio: "**" },
      { type: "credit", accountCode: "91501", accountName: "اعتبار هزینه انتقالی",         ratio: "**" }
    ]
  },
  {
    id: 101,
    title: "ثبت شماره ۱-۱",
    description: "به میزان کسور بازنشستگی و حق بیمه سهم دولت بر اساس لیست تایید شده",
    code: "PAY-1-1",
    category: "payroll",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "92001", accountName: "اعتبار هزینه",        ratio: "**" },
      { type: "credit", accountCode: "91001", accountName: "بودجه اعتبار هزینه",  ratio: "**" }
    ]
  },
  {
    id: 102,
    title: "ثبت شماره ۱-۲",
    description: "معادل ناخالص لیست تایید شده (با احتساب اعتبارات اضافه شده بابت کسور بازنشستگی و حق بیمه سهم دولت به کسر از غیبت و کسری کارکنان)",
    code: "PAY-1-2",
    category: "payroll",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "93001", accountName: "اعتبار هزینه تخصیص یافته",                           ratio: "**", section: "درصورت تامین اعتبار از محل اعتبار تخصیص یافته" },
      { type: "credit", accountCode: "92001", accountName: "اعتبار هزینه",                                       ratio: "**", section: "درصورت تامین اعتبار از محل اعتبار تخصیص یافته" },
      { type: "debit",  accountCode: "97001", accountName: "اعتبار هزینه تامین شده",                             ratio: "**", section: "درصورت تامین اعتبار از محل اعتبار تخصیص یافته" },
      { type: "credit", accountCode: "93001", accountName: "اعتبار هزینه تخصیص یافته",                           ratio: "**", section: "درصورت تامین اعتبار از محل اعتبار تخصیص یافته" },
      { type: "debit",  accountCode: "95001", accountName: "اعتبار هزینه ابلاغی",                                ratio: "**", section: "درصورت تامین اعتبار از محل اعتبار ابلاغی" },
      { type: "credit", accountCode: "91001", accountName: "بودجه اعتبار هزینه",                                 ratio: "**", section: "درصورت تامین اعتبار از محل اعتبار ابلاغی" },
      { type: "debit",  accountCode: "97001", accountName: "اعتبار هزینه تامین شده",                             ratio: "**", section: "درصورت تامین اعتبار از محل اعتبار ابلاغی" },
      { type: "credit", accountCode: "95001", accountName: "اعتبار هزینه ابلاغی",                                ratio: "**", section: "درصورت تامین اعتبار از محل اعتبار ابلاغی" },
      { type: "debit",  accountCode: "61001", accountName: "هزینه‌ها - به تفکیک طبقه‌بندی اقتصادی دولت",         ratio: "**" },
      { type: "credit", accountCode: "24001", accountName: "بیمه پرداختنی",                                      ratio: "**" },
      { type: "credit", accountCode: "24002", accountName: "حق بازنشستگی پرداختنی",                              ratio: "**" },
      { type: "credit", accountCode: "24004", accountName: "مالیات پرداختنی",                                    ratio: "**" },
      { type: "credit", accountCode: "24003", accountName: "سایر کسورات پرداختنی",                               ratio: "**" },
      { type: "credit", accountCode: "21005", accountName: "حقوق و مزایای پرداختنی",                             ratio: "**" }
    ]
  },
  {
    id: 103,
    title: "ثبت شماره ۲",
    description: "به هنگام واریز مبلغ قابل پرداخت به حساب بانکی کارکنان، واحد گزارشگر و کسور متعلقه به حساب‌های ذیربط توسط خزانه",
    code: "PAY-2",
    category: "payroll",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "11001", accountName: "بانک پرداخت هزینه",                  ratio: "**" },
      { type: "debit",  accountCode: "24001", accountName: "بیمه پرداختنی",                       ratio: "**" },
      { type: "debit",  accountCode: "24002", accountName: "حق بازنشستگی پرداختنی",               ratio: "**" },
      { type: "debit",  accountCode: "24004", accountName: "مالیات پرداختنی",                     ratio: "**" },
      { type: "debit",  accountCode: "21005", accountName: "حقوق و مزایای پرداختنی",              ratio: "**" },
      { type: "credit", accountCode: "41005", accountName: "دریافتی از خزانه بابت حقوق و مزایا", ratio: "**" },
      { type: "debit",  accountCode: "99001", accountName: "اعتبار هزینه مصرف شده",               ratio: "**" },
      { type: "credit", accountCode: "97001", accountName: "اعتبار هزینه تامین شده",              ratio: "**" }
    ]
  },
  {
    id: 104,
    title: "ثبت شماره ۳",
    description: "به هنگام پرداخت سایر کسور مرتبط با حقوق و مزایای مستمر",
    code: "PAY-3",
    category: "payroll",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "24003", accountName: "سایر کسورات پرداختنی",  ratio: "**" },
      { type: "credit", accountCode: "11001", accountName: "بانک پرداخت هزینه",     ratio: "**" },
      { type: "debit",  accountCode: "99001", accountName: "اعتبار هزینه مصرف شده", ratio: "**" },
      { type: "credit", accountCode: "97001", accountName: "اعتبار هزینه تامین شده",ratio: "**" }
    ]
  },
  {
    id: 105,
    title: "ثبت شماره ۴",
    description: "بستن حساب‌های حقوق و مزایای مستمر",
    code: "PAY-4",
    category: "payroll",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "91001", accountName: "بودجه اعتبار هزینه",                                   ratio: "**" },
      { type: "credit", accountCode: "92001", accountName: "اعتبار هزینه",                                         ratio: "**" },
      { type: "credit", accountCode: "93001", accountName: "اعتبار هزینه تخصیص یافته",                             ratio: "**" },
      { type: "credit", accountCode: "95001", accountName: "اعتبار هزینه ابلاغی",                                  ratio: "**" },
      { type: "credit", accountCode: "97001", accountName: "اعتبار هزینه تامین شده",                               ratio: "**" },
      { type: "credit", accountCode: "99001", accountName: "اعتبار هزینه مصرف شده",                                ratio: "**" },
      { type: "debit",  accountCode: "41005", accountName: "دریافتی از خزانه بابت حقوق و مزایا",                   ratio: "**" },
      { type: "credit", accountCode: "61001", accountName: "هزینه‌ها - به تفکیک طبقه‌بندی اقتصادی دولت",           ratio: "**" },
      { type: "credit", accountCode: "31007", accountName: "خالص تغییر در وضعیت مالی",                             ratio: "**" },
      { type: "debit",  accountCode: "31007", accountName: "خالص تغییر در وضعیت مالی",                             ratio: "**" },
      { type: "credit", accountCode: "31001", accountName: "ارزش خالص انباشته",                                    ratio: "**" }
    ]
  },
  {
    id: 106,
    title: "ثبت شماره ۵-۱",
    description: "به میزان وجوه دریافتی از صندوق بازنشستگی مربوط",
    code: "PAY-5-1",
    category: "payroll",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "11001", accountName: "بانک ...",                          ratio: "**" },
      { type: "credit", accountCode: "24008", accountName: "سایر حساب‌ها و اسناد پرداختنی",    ratio: "**" }
    ]
  },
  {
    id: 107,
    title: "ثبت شماره ۵-۲",
    description: "به هنگام پرداخت حقوق و مزایای بازنشستگی و موظفین",
    code: "PAY-5-2",
    category: "payroll",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "24008", accountName: "سایر حساب‌ها و اسناد پرداختنی",    ratio: "**" },
      { type: "credit", accountCode: "11001", accountName: "بانک ...",                          ratio: "**" }
    ]
  },

  // ─── عملیات سرمایه‌ای ─────────────────────────────────────────────────────
  {
    id: 108,
    title: "ثبت شماره ۱",
    description: "به هنگام ابلاغ بودجه (عمومی / اختصاصی) یا تبادل موافقتنامه",
    code: "CAP-1",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "92002", accountName: "اعتبار سرمایه‌ای",        ratio: "**" },
      { type: "credit", accountCode: "91002", accountName: "بودجه اعتبار سرمایه‌ای",  ratio: "**" }
    ]
  },
  {
    id: 109,
    title: "ثبت شماره ۲",
    description: "در صورت دریافت تنخواه‌گردان حسابداری از خزانه (شامل اعتبار بانکی)",
    code: "CAP-2",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "11002", accountName: "بانک پرداخت سرمایه‌ای",         ratio: "**" },
      { type: "credit", accountCode: "23002", accountName: "پیش‌دریافت اعتبار سرمایه‌ای",   ratio: "**" }
    ]
  },
  {
    id: 110,
    title: "ثبت شماره ۳",
    description: "در صورت پرداخت از محل تنخواه‌گردان حسابداری (ثبت قبل از پرداخت)",
    code: "CAP-3",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "97002", accountName: "اعتبار سرمایه‌ای تامین شده",  ratio: "**" },
      { type: "credit", accountCode: "96002", accountName: "کنترل اعتبار سرمایه‌ای",       ratio: "**" }
    ]
  },
  {
    id: 111,
    title: "ثبت شماره ۴",
    description: "به هنگام تخصیص اعتبار",
    code: "CAP-4",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "93002", accountName: "اعتبار سرمایه‌ای تخصیص یافته", ratio: "**" },
      { type: "credit", accountCode: "92002", accountName: "اعتبار سرمایه‌ای",              ratio: "**" }
    ]
  },
  {
    id: 112,
    title: "ثبت شماره ۵",
    description: "در صورت دریافت وجه نقد (شامل اعتبار بانکی) و تسویه و پا به پای تنخواه‌گردان حسابداری با اعتبار تخصیص یافته",
    code: "CAP-5",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "96002", accountName: "کنترل اعتبار سرمایه‌ای",          ratio: "**", section: "بخش اول" },
      { type: "credit", accountCode: "93002", accountName: "اعتبار سرمایه‌ای تخصیص یافته",    ratio: "**", section: "بخش اول" },
      { type: "debit",  accountCode: "23002", accountName: "پیش‌دریافت اعتبار سرمایه‌ای",     ratio: "**", section: "بخش دوم" },
      { type: "debit",  accountCode: "11002", accountName: "بانک پرداخت سرمایه‌ای",           ratio: "**", section: "بخش دوم" },
      { type: "credit", accountCode: "41002", accountName: "دریافتی بابت عملیات سرمایه‌ای",   ratio: "**", section: "بخش دوم" }
    ]
  },
  {
    id: 113,
    title: "ثبت شماره ۶",
    description: "دریافت وجه نقد (شامل اعتبار بانکی) از محل اعتبار اختصاصی مصوب",
    code: "CAP-6",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "11003", accountName: "بانک پرداخت اختصاصی",                           ratio: "**", section: "بخش اصلی" },
      { type: "credit", accountCode: "21001", accountName: "مطالبات از خزانه",                               ratio: "**", section: "بخش اصلی" },
      { type: "debit",  accountCode: "89001", accountName: "حساب انتظامی - کنترل دریافتی‌ها بابت اعتبار",   ratio: "**", section: "حساب‌های انتظامی" },
      { type: "credit", accountCode: "99001", accountName: "طرف حساب انتظامی - کنترل دریافتی‌ها بابت اعتبار", ratio: "**", section: "حساب‌های انتظامی" }
    ]
  },
  {
    id: 114,
    title: "ثبت شماره ۷",
    description: "به هنگام دریافت هدایا و کمک‌های نقدی یا غیرنقدی یا محتمل شدن ورود جریان منافع اقتصادی یا توان خدمت‌رسانی آتی (در صورتی که نحوه مصرف وجوه تعیین نشده باشد)",
    code: "CAP-7",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "11004", accountName: "بانک وجوه سایر منابع",                              ratio: "**" },
      { type: "debit",  accountCode: "13001", accountName: "دارایی‌ها به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها", ratio: "**" },
      { type: "debit",  accountCode: "14001", accountName: "موجودی‌ها به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها", ratio: "**" },
      { type: "debit",  accountCode: "15001", accountName: "حساب‌ها و اسناد دریافتنی",                          ratio: "**" },
      { type: "credit", accountCode: "51001", accountName: "هدایا و کمک‌ها",                                    ratio: "**" }
    ]
  },
  {
    id: 115,
    title: "ثبت شماره ۸",
    description: "به هنگام دریافت اعلامیه بانکی در خصوص واریز وجوه تنخواه‌گردان پرداخت (دریافتی از ذیحسابی سایر واحدها)",
    code: "CAP-8",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "11004", accountName: "بانک وجوه سایر منابع",       ratio: "**" },
      { type: "credit", accountCode: "24001", accountName: "حساب‌ها و اسناد پرداختنی",   ratio: "**" }
    ]
  },
  {
    id: 116,
    title: "ثبت شماره ۹",
    description: "به هنگام دریافت اعلامیه بانکی در خصوص واریز وجوه حاصل از هدایای نقدی و غیرنقدی مشروط که شرایط مصرف آن تعیین شده است",
    code: "CAP-9",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "11004", accountName: "بانک وجوه سایر منابع",                              ratio: "**" },
      { type: "debit",  accountCode: "13001", accountName: "دارایی‌ها به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها", ratio: "**" },
      { type: "debit",  accountCode: "14001", accountName: "موجودی‌ها به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها", ratio: "**" },
      { type: "credit", accountCode: "24001", accountName: "حساب‌ها و اسناد پرداختنی",                          ratio: "**" }
    ]
  },
  {
    id: 117,
    title: "ثبت شماره ۱۰",
    description: "زمانی که هدایای نقدی و غیرنقدی محدود شده برای هدف خاص مطابق با شرایط از پیش تعیین شده به مصرف برسند",
    code: "CAP-10",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "24001", accountName: "حساب‌ها و اسناد پرداختنی", ratio: "**" },
      { type: "credit", accountCode: "51001", accountName: "هدایا و کمک‌ها",           ratio: "**" }
    ]
  },
  {
    id: 118,
    title: "ثبت شماره ۱۱",
    description: "در صورتی که بخشی از منابع واحد گزارشگر به عنوان سایر منابع از خزانه تامین و دریافت گردد",
    code: "CAP-11",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "11004", accountName: "بانک وجوه سایر منابع",      ratio: "**" },
      { type: "credit", accountCode: "41003", accountName: "دریافتی از محل سایر منابع", ratio: "**" }
    ]
  },
  {
    id: 119,
    title: "ثبت شماره ۱۲",
    description: "به هنگام ابلاغ تمام یا بخشی از اعتبار تخصیص یافته به سایر واحدها",
    code: "CAP-12",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "62001", accountName: "حواله اعتبار سرمایه‌ای",            ratio: "**" },
      { type: "credit", accountCode: "93002", accountName: "اعتبار سرمایه‌ای تخصیص یافته",      ratio: "**" },
      { type: "credit", accountCode: "92002", accountName: "اعتبار سرمایه‌ای",                  ratio: "**" }
    ]
  },
  {
    id: 120,
    title: "ثبت شماره ۱۳",
    description: "انتقال وجوه مربوط به ابلاغ اعتبار (عمومی / اختصاصی) به واحد دریافت‌کننده اعتبار ابلاغی",
    code: "CAP-13",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "63001", accountName: "هزینه‌ها - انتقالات",                                        ratio: "**" },
      { type: "credit", accountCode: "11002", accountName: "بانک پرداخت سرمایه‌ای / بانک پرداخت اختصاصی",               ratio: "**" }
    ]
  },
  {
    id: 121,
    title: "ثبت شماره ۱۴",
    description: "به هنگام دریافت اعلامیه ابلاغ اعتبار و واریز وجوه ابلاغی (عمومی / اختصاصی)",
    code: "CAP-14",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "94001", accountName: "اعتبار سرمایه‌ای ابلاغی",                                      ratio: "**", section: "بخش اول - بودجه" },
      { type: "credit", accountCode: "91002", accountName: "بودجه اعتبار سرمایه‌ای",                                       ratio: "**", section: "بخش اول - بودجه" },
      { type: "debit",  accountCode: "11002", accountName: "بانک پرداخت سرمایه‌ای / بانک پرداخت اختصاصی",                 ratio: "**", section: "بخش دوم - وجوه" },
      { type: "credit", accountCode: "41004", accountName: "درآمدها - انتقالات",                                            ratio: "**", section: "بخش دوم - وجوه" },
      { type: "debit",  accountCode: "89001", accountName: "حساب انتظامی - کنترل دریافتی‌ها بابت اعتبار",                  ratio: "**", section: "حساب‌های انتظامی" },
      { type: "credit", accountCode: "99001", accountName: "طرف حساب انتظامی - کنترل دریافتی‌ها بابت اعتبار",              ratio: "**", section: "حساب‌های انتظامی" }
    ]
  },
  {
    id: 122,
    title: "ثبت شماره ۱۵",
    description: "اخذ تضمین مربوط به شرکت در مناقصه",
    code: "CAP-15",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "89002", accountName: "حساب انتظامی - تضمین‌های دریافتی",       ratio: "**" },
      { type: "credit", accountCode: "99002", accountName: "طرف حساب انتظامی - تضمین‌های دریافتی",   ratio: "**" }
    ]
  },
  {
    id: 123,
    title: "ثبت شماره ۱۶",
    description: "به هنگام تامین اعتبار (عمومی / اختصاصی)",
    code: "CAP-16",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "97002", accountName: "اعتبار سرمایه‌ای تامین شده",        ratio: "**", section: "از محل اعتبار تخصیص یافته" },
      { type: "credit", accountCode: "93002", accountName: "اعتبار سرمایه‌ای تخصیص یافته",      ratio: "**", section: "از محل اعتبار تخصیص یافته" },
      { type: "debit",  accountCode: "97002", accountName: "اعتبار سرمایه‌ای تامین شده",        ratio: "**", section: "از محل اعتبار اختصاصی" },
      { type: "credit", accountCode: "92002", accountName: "اعتبار سرمایه‌ای",                  ratio: "**", section: "از محل اعتبار اختصاصی" },
      { type: "debit",  accountCode: "97002", accountName: "اعتبار سرمایه‌ای تامین شده",        ratio: "**", section: "از محل اعتبار ابلاغی" },
      { type: "credit", accountCode: "94001", accountName: "اعتبار سرمایه‌ای ابلاغی",           ratio: "**", section: "از محل اعتبار ابلاغی" }
    ]
  },
  {
    id: 124,
    title: "ثبت شماره ۱۷",
    description: "به هنگام انعقاد قرارداد",
    code: "CAP-17",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "89003", accountName: "حساب انتظامی - کنترل قراردادها",       ratio: "**" },
      { type: "credit", accountCode: "99003", accountName: "طرف حساب انتظامی - کنترل قراردادها",   ratio: "**" }
    ]
  },
  {
    id: 125,
    title: "ثبت شماره ۱۸",
    description: "در صورت واگذاری تنخواه‌گردان پرداخت به عاملین ذیحساب طبق قوانین و مقررات مربوط",
    code: "CAP-18",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "16001", accountName: "تنخواه‌گردان پرداخت بابت عملیات سرمایه‌ای",  ratio: "**", section: "واگذاری تنخواه‌گردان" },
      { type: "credit", accountCode: "11002", accountName: "بانک پرداخت سرمایه‌ای",                      ratio: "**", section: "واگذاری تنخواه‌گردان" },
      { type: "credit", accountCode: "11003", accountName: "بانک پرداخت اختصاصی",                        ratio: "**", section: "واگذاری تنخواه‌گردان" },
      { type: "credit", accountCode: "11004", accountName: "بانک وجوه سایر منابع",                       ratio: "**", section: "واگذاری تنخواه‌گردان" },
      { type: "debit",  accountCode: "98002", accountName: "اعتبار سرمایه‌ای بابت پرداخت‌های غیرقطعی",  ratio: "**", section: "کنترل اعتبار غیرقطعی" },
      { type: "credit", accountCode: "97002", accountName: "اعتبار سرمایه‌ای تامین شده",                ratio: "**", section: "کنترل اعتبار غیرقطعی" }
    ]
  },
  {
    id: 126,
    title: "ثبت شماره ۱۹-۱",
    description: "اخذ تضمین در قبال واگذاری پیش‌پرداخت بابت عملیات سرمایه‌ای و پیش‌پرداخت مواد و کالا",
    code: "CAP-19-1",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "89002", accountName: "حساب انتظامی - تضمین‌های دریافتی",       ratio: "**" },
      { type: "credit", accountCode: "99002", accountName: "طرف حساب انتظامی - تضمین‌های دریافتی",   ratio: "**" }
    ]
  },
  {
    id: 127,
    title: "ثبت شماره ۱۹-۲",
    description: "به هنگام واگذاری پیش‌پرداخت به اشخاص ذینفع با رعایت قوانین و مقررات مربوط",
    code: "CAP-19-2",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "17001", accountName: "پیش‌پرداخت بابت عملیات سرمایه‌ای",         ratio: "**", section: "واگذاری پیش‌پرداخت" },
      { type: "debit",  accountCode: "17002", accountName: "پیش‌پرداخت مواد و کالا",                    ratio: "**", section: "واگذاری پیش‌پرداخت" },
      { type: "credit", accountCode: "11002", accountName: "بانک پرداخت سرمایه‌ای",                     ratio: "**", section: "واگذاری پیش‌پرداخت" },
      { type: "credit", accountCode: "11003", accountName: "بانک پرداخت اختصاصی",                       ratio: "**", section: "واگذاری پیش‌پرداخت" },
      { type: "credit", accountCode: "11004", accountName: "بانک وجوه سایر منابع",                      ratio: "**", section: "واگذاری پیش‌پرداخت" },
      { type: "debit",  accountCode: "98002", accountName: "اعتبار سرمایه‌ای بابت پرداخت‌های غیرقطعی", ratio: "**", section: "کنترل اعتبار غیرقطعی" },
      { type: "credit", accountCode: "97002", accountName: "اعتبار سرمایه‌ای تامین شده",               ratio: "**", section: "کنترل اعتبار غیرقطعی" }
    ]
  },
  {
    id: 128,
    title: "ثبت شماره ۱۹-۳",
    description: "پیش‌پرداخت از محل موجودی‌ها به اشخاص ذینفع با رعایت قوانین و مقررات مربوط",
    code: "CAP-19-3",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "17002", accountName: "پیش‌پرداخت مواد و کالا",                               ratio: "**" },
      { type: "credit", accountCode: "14001", accountName: "موجودی‌ها به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها",    ratio: "**" }
    ]
  },
  {
    id: 129,
    title: "ثبت شماره ۲۰",
    description: "شناسایی موجودی‌ها",
    code: "CAP-20",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "14001", accountName: "موجودی‌ها به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها",  ratio: "**", section: "شناسایی موجودی‌ها" },
      { type: "credit", accountCode: "17001", accountName: "پیش‌پرداخت بابت عملیات سرمایه‌ای",                   ratio: "**", section: "شناسایی موجودی‌ها" },
      { type: "credit", accountCode: "24001", accountName: "حساب‌ها و اسناد پرداختنی",                            ratio: "**", section: "شناسایی موجودی‌ها" },
      { type: "debit",  accountCode: "99002", accountName: "طرف حساب انتظامی - تضمین‌های دریافتی",               ratio: "**", section: "کاهش تضمین‌های دریافتی" },
      { type: "credit", accountCode: "89002", accountName: "حساب انتظامی - تضمین‌های دریافتی",                   ratio: "**", section: "کاهش تضمین‌های دریافتی" }
    ]
  },
  {
    id: 130,
    title: "ثبت شماره ۲۱",
    description: "شناسایی دارایی در جریان تکمیل",
    code: "CAP-21",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "13002", accountName: "دارایی در جریان تکمیل",                                ratio: "**", section: "شناسایی دارایی" },
      { type: "credit", accountCode: "17001", accountName: "پیش‌پرداخت بابت عملیات سرمایه‌ای",                    ratio: "**", section: "شناسایی دارایی" },
      { type: "credit", accountCode: "17002", accountName: "پیش‌پرداخت مواد و کالا",                               ratio: "**", section: "شناسایی دارایی" },
      { type: "credit", accountCode: "14001", accountName: "موجودی‌ها به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها",   ratio: "**", section: "شناسایی دارایی" },
      { type: "credit", accountCode: "24001", accountName: "حساب‌ها و اسناد پرداختنی",                             ratio: "**", section: "شناسایی دارایی" },
      { type: "debit",  accountCode: "95002", accountName: "اعتبار سرمایه‌ای مصرف شده",                           ratio: "**", section: "قطعی شدن اعتبار" },
      { type: "credit", accountCode: "98002", accountName: "اعتبار سرمایه‌ای بابت پرداخت‌های غیرقطعی",            ratio: "**", section: "قطعی شدن اعتبار" },
      { type: "debit",  accountCode: "99002", accountName: "طرف حساب انتظامی - تضمین‌های دریافتی",                ratio: "**", section: "کاهش تضمین‌های دریافتی" },
      { type: "credit", accountCode: "89002", accountName: "حساب انتظامی - تضمین‌های دریافتی",                    ratio: "**", section: "کاهش تضمین‌های دریافتی" }
    ]
  },
  {
    id: 131,
    title: "ثبت شماره ۲۲",
    description: "شناسایی دارایی‌های ثابت مشهود و دارایی‌های نامشهود",
    code: "CAP-22",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "13001", accountName: "دارایی‌ها به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها",   ratio: "**", section: "شناسایی دارایی" },
      { type: "credit", accountCode: "17001", accountName: "پیش‌پرداخت بابت عملیات سرمایه‌ای",                    ratio: "**", section: "شناسایی دارایی" },
      { type: "credit", accountCode: "24001", accountName: "حساب‌ها و اسناد پرداختنی",                             ratio: "**", section: "شناسایی دارایی" },
      { type: "debit",  accountCode: "95002", accountName: "اعتبار سرمایه‌ای مصرف شده",                           ratio: "**", section: "قطعی شدن اعتبار" },
      { type: "credit", accountCode: "98002", accountName: "اعتبار سرمایه‌ای بابت پرداخت‌های غیرقطعی",            ratio: "**", section: "قطعی شدن اعتبار" },
      { type: "debit",  accountCode: "99002", accountName: "طرف حساب انتظامی - تضمین‌های دریافتی",                ratio: "**", section: "کاهش تضمین‌های دریافتی" },
      { type: "credit", accountCode: "89002", accountName: "حساب انتظامی - تضمین‌های دریافتی",                    ratio: "**", section: "کاهش تضمین‌های دریافتی" }
    ]
  },
  {
    id: 132,
    title: "ثبت شماره ۲۳-۱",
    description: "شناسایی کسور قانونی مربوط و تسویه خالص بدهی‌ها",
    code: "CAP-23-1",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "24001", accountName: "حساب‌ها و اسناد پرداختنی",       ratio: "**", section: "شناسایی کسور و تسویه بدهی" },
      { type: "credit", accountCode: "25001", accountName: "بیمه پرداختنی",                  ratio: "**", section: "شناسایی کسور و تسویه بدهی" },
      { type: "credit", accountCode: "25002", accountName: "سپرده‌های پرداختنی",             ratio: "**", section: "شناسایی کسور و تسویه بدهی" },
      { type: "credit", accountCode: "11002", accountName: "بانک پرداخت سرمایه‌ای",          ratio: "**", section: "شناسایی کسور و تسویه بدهی" },
      { type: "credit", accountCode: "11003", accountName: "بانک پرداخت اختصاصی",            ratio: "**", section: "شناسایی کسور و تسویه بدهی" },
      { type: "credit", accountCode: "11004", accountName: "بانک وجوه سایر منابع",           ratio: "**", section: "شناسایی کسور و تسویه بدهی" },
      { type: "debit",  accountCode: "95002", accountName: "اعتبار سرمایه‌ای مصرف شده",     ratio: "**", section: "قطعی شدن اعتبار" },
      { type: "credit", accountCode: "97002", accountName: "اعتبار سرمایه‌ای تامین شده",    ratio: "**", section: "قطعی شدن اعتبار" }
    ]
  },
  {
    id: 133,
    title: "ثبت شماره ۲۳-۲",
    description: "به هنگام تسویه کسور مربوط",
    code: "CAP-23-2",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "25001", accountName: "بیمه پرداختنی",               ratio: "**", section: "تسویه کسور" },
      { type: "credit", accountCode: "11002", accountName: "بانک پرداخت سرمایه‌ای",       ratio: "**", section: "تسویه کسور" },
      { type: "credit", accountCode: "11003", accountName: "بانک پرداخت اختصاصی",         ratio: "**", section: "تسویه کسور" },
      { type: "credit", accountCode: "11004", accountName: "بانک وجوه سایر منابع",        ratio: "**", section: "تسویه کسور" },
      { type: "debit",  accountCode: "95002", accountName: "اعتبار سرمایه‌ای مصرف شده",  ratio: "**", section: "قطعی شدن اعتبار" },
      { type: "credit", accountCode: "97002", accountName: "اعتبار سرمایه‌ای تامین شده", ratio: "**", section: "قطعی شدن اعتبار" }
    ]
  },
  {
    id: 134,
    title: "ثبت شماره ۲۴-۱",
    description: "در صورت پرداخت بخشی از بدهی‌ها به عنوان علی‌الحساب",
    code: "CAP-24-1",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "24001", accountName: "حساب‌ها و اسناد پرداختنی",                          ratio: "**", section: "پرداخت علی‌الحساب" },
      { type: "credit", accountCode: "25001", accountName: "بیمه پرداختنی",                                     ratio: "**", section: "پرداخت علی‌الحساب" },
      { type: "credit", accountCode: "25002", accountName: "سپرده‌های پرداختنی",                                ratio: "**", section: "پرداخت علی‌الحساب" },
      { type: "credit", accountCode: "11002", accountName: "بانک پرداخت سرمایه‌ای",                             ratio: "**", section: "پرداخت علی‌الحساب" },
      { type: "credit", accountCode: "11003", accountName: "بانک پرداخت اختصاصی",                               ratio: "**", section: "پرداخت علی‌الحساب" },
      { type: "credit", accountCode: "11004", accountName: "بانک وجوه سایر منابع",                              ratio: "**", section: "پرداخت علی‌الحساب" },
      { type: "debit",  accountCode: "89004", accountName: "حساب انتظامی - علی‌الحساب بابت عملیات سرمایه‌ای",  ratio: "**", section: "کنترل انتظامی علی‌الحساب" },
      { type: "credit", accountCode: "99004", accountName: "طرف حساب انتظامی - علی‌الحساب بابت عملیات سرمایه‌ای", ratio: "**", section: "کنترل انتظامی علی‌الحساب" },
      { type: "debit",  accountCode: "98002", accountName: "اعتبار سرمایه‌ای بابت پرداخت‌های غیرقطعی",          ratio: "**", section: "کنترل اعتبار غیرقطعی" },
      { type: "credit", accountCode: "97002", accountName: "اعتبار سرمایه‌ای تامین شده",                        ratio: "**", section: "کنترل اعتبار غیرقطعی" }
    ]
  },
  {
    id: 135,
    title: "ثبت شماره ۲۴-۲",
    description: "به هنگام پرداخت کسور قانونی مرتبط با علی‌الحساب",
    code: "CAP-24-2",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "25001", accountName: "بیمه پرداختنی",               ratio: "**", section: "پرداخت کسور قانونی" },
      { type: "credit", accountCode: "11002", accountName: "بانک پرداخت سرمایه‌ای",       ratio: "**", section: "پرداخت کسور قانونی" },
      { type: "credit", accountCode: "11003", accountName: "بانک پرداخت اختصاصی",         ratio: "**", section: "پرداخت کسور قانونی" },
      { type: "credit", accountCode: "11004", accountName: "بانک وجوه سایر منابع",        ratio: "**", section: "پرداخت کسور قانونی" },
      { type: "debit",  accountCode: "98002", accountName: "اعتبار سرمایه‌ای بابت پرداخت‌های غیرقطعی", ratio: "**", section: "کنترل اعتبار غیرقطعی" },
      { type: "credit", accountCode: "97002", accountName: "اعتبار سرمایه‌ای تامین شده", ratio: "**", section: "کنترل اعتبار غیرقطعی" }
    ]
  },
  {
    id: 136,
    title: "ثبت شماره ۲۵-۱",
    description: "در صورت پرداخت مابقی بدهی‌های مرتبط با علی‌الحساب و تسویه آن",
    code: "CAP-25-1",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "24001", accountName: "حساب‌ها و اسناد پرداختنی",                              ratio: "**", section: "تسویه بدهی" },
      { type: "credit", accountCode: "25001", accountName: "بیمه پرداختنی",                                         ratio: "**", section: "تسویه بدهی" },
      { type: "credit", accountCode: "25002", accountName: "سپرده‌های پرداختنی",                                    ratio: "**", section: "تسویه بدهی" },
      { type: "credit", accountCode: "11002", accountName: "بانک پرداخت سرمایه‌ای",                                 ratio: "**", section: "تسویه بدهی" },
      { type: "credit", accountCode: "11003", accountName: "بانک پرداخت اختصاصی",                                   ratio: "**", section: "تسویه بدهی" },
      { type: "credit", accountCode: "11004", accountName: "بانک وجوه سایر منابع",                                  ratio: "**", section: "تسویه بدهی" },
      { type: "debit",  accountCode: "99004", accountName: "طرف حساب انتظامی - علی‌الحساب بابت عملیات سرمایه‌ای",  ratio: "**", section: "برگشت انتظامی علی‌الحساب" },
      { type: "credit", accountCode: "89004", accountName: "حساب انتظامی - علی‌الحساب بابت عملیات سرمایه‌ای",      ratio: "**", section: "برگشت انتظامی علی‌الحساب" },
      { type: "debit",  accountCode: "95002", accountName: "اعتبار سرمایه‌ای مصرف شده",                             ratio: "**", section: "قطعی شدن اعتبار" },
      { type: "credit", accountCode: "98002", accountName: "اعتبار سرمایه‌ای بابت پرداخت‌های غیرقطعی",              ratio: "**", section: "قطعی شدن اعتبار" },
      { type: "credit", accountCode: "97002", accountName: "اعتبار سرمایه‌ای تامین شده",                            ratio: "**", section: "قطعی شدن اعتبار" }
    ]
  },
  {
    id: 137,
    title: "ثبت شماره ۲۵-۲",
    description: "به هنگام پرداخت کسور قانونی مرتبط با علی‌الحساب",
    code: "CAP-25-2",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "25001", accountName: "بیمه پرداختنی",               ratio: "**", section: "پرداخت کسور قانونی" },
      { type: "credit", accountCode: "11002", accountName: "بانک پرداخت سرمایه‌ای",       ratio: "**", section: "پرداخت کسور قانونی" },
      { type: "credit", accountCode: "11003", accountName: "بانک پرداخت اختصاصی",         ratio: "**", section: "پرداخت کسور قانونی" },
      { type: "credit", accountCode: "11004", accountName: "بانک وجوه سایر منابع",        ratio: "**", section: "پرداخت کسور قانونی" },
      { type: "debit",  accountCode: "95002", accountName: "اعتبار سرمایه‌ای مصرف شده",  ratio: "**", section: "قطعی شدن اعتبار" },
      { type: "credit", accountCode: "97002", accountName: "اعتبار سرمایه‌ای تامین شده", ratio: "**", section: "قطعی شدن اعتبار" }
    ]
  },
  {
    id: 138,
    title: "ثبت شماره ۲۶-۱",
    description: "در صورت خرید اعتباری (نسیه) دارایی‌های ثابت مشهود",
    code: "CAP-26-1",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "13001", accountName: "دارایی‌ها به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها", ratio: "**" },
      { type: "debit",  accountCode: "18001", accountName: "هزینه مالی آتی",                                    ratio: "**" },
      { type: "credit", accountCode: "24001", accountName: "حساب‌ها و اسناد پرداختنی",                          ratio: "**" }
    ]
  },
  {
    id: 139,
    title: "ثبت شماره ۲۶-۲",
    description: "به میزان تحقق هزینه‌های مالی آتی در هر سال مالی",
    code: "CAP-26-2",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "64001", accountName: "هزینه‌ها به تفکیک طبقه‌بندی اقتصادی دولت", ratio: "**" },
      { type: "credit", accountCode: "18001", accountName: "هزینه مالی آتی",                            ratio: "**" }
    ]
  },
  {
    id: 140,
    title: "ثبت شماره ۲۷",
    description: "شناسایی دارایی‌های تکمیل شده",
    code: "CAP-27",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "13001", accountName: "دارایی‌ها به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها", ratio: "**" },
      { type: "credit", accountCode: "13002", accountName: "دارایی در جریان تکمیل",                              ratio: "**" }
    ]
  },
  {
    id: 141,
    title: "ثبت شماره ۲۸",
    description: "احتساب مازاد موجودی‌ها پس از پایان طرح تملک دارایی‌های سرمایه‌ای",
    code: "CAP-28",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "14001", accountName: "موجودی‌ها به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها", ratio: "**", section: "شناسایی موجودی مازاد" },
      { type: "credit", accountCode: "13002", accountName: "دارایی در جریان تکمیل",                              ratio: "**", section: "شناسایی موجودی مازاد" },
      { type: "debit",  accountCode: "98002", accountName: "اعتبار سرمایه‌ای بابت پرداخت‌های غیرقطعی",           ratio: "**", section: "قطعی شدن اعتبار" },
      { type: "credit", accountCode: "95002", accountName: "اعتبار سرمایه‌ای مصرف شده",                          ratio: "**", section: "قطعی شدن اعتبار" }
    ]
  },
  {
    id: 142,
    title: "ثبت شماره ۲۹-۱",
    description: "انتقال دارایی‌های واحد گزارشگر به سایر واحدها — واحد انتقال‌دهنده",
    code: "CAP-29-1",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "19001", accountName: "دارایی‌های انتقالی",                                   ratio: "**" },
      { type: "credit", accountCode: "13002", accountName: "دارایی در جریان تکمیل",                                ratio: "**" },
      { type: "credit", accountCode: "13001", accountName: "دارایی‌ها به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها",    ratio: "**" },
      { type: "credit", accountCode: "14001", accountName: "موجودی‌ها به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها",    ratio: "**" }
    ]
  },
  {
    id: 143,
    title: "ثبت شماره ۲۹-۲",
    description: "انتقال دارایی‌های واحد گزارشگر به سایر واحدها — واحد دریافت‌کننده",
    code: "CAP-29-2",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "13002", accountName: "دارایی در جریان تکمیل",                                ratio: "**" },
      { type: "debit",  accountCode: "13001", accountName: "دارایی‌ها به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها",    ratio: "**" },
      { type: "debit",  accountCode: "14001", accountName: "موجودی‌ها به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها",    ratio: "**" },
      { type: "credit", accountCode: "19002", accountName: "دارایی‌های دریافتی",                                   ratio: "**" }
    ]
  },
  {
    id: 144,
    title: "ثبت شماره ۲۹-۳",
    description: "انتقال دارایی به واحد دیگر — واحد انتقال‌دهنده (شناسایی هزینه انتقال)",
    code: "CAP-29-3",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "63001", accountName: "هزینه‌ها - انتقالات",                                   ratio: "**" },
      { type: "credit", accountCode: "13002", accountName: "دارایی در جریان تکمیل",                                 ratio: "**" },
      { type: "credit", accountCode: "13001", accountName: "دارایی‌ها به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها",     ratio: "**" },
      { type: "credit", accountCode: "14001", accountName: "موجودی‌ها به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها",     ratio: "**" }
    ]
  },
  {
    id: 145,
    title: "ثبت شماره ۲۹-۴",
    description: "انتقال دارایی به واحد دیگر — واحد دریافت‌کننده (شناسایی درآمد انتقال)",
    code: "CAP-29-4",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "13002", accountName: "دارایی در جریان تکمیل",                                 ratio: "**" },
      { type: "debit",  accountCode: "13001", accountName: "دارایی‌ها به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها",     ratio: "**" },
      { type: "debit",  accountCode: "14001", accountName: "موجودی‌ها به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها",     ratio: "**" },
      { type: "credit", accountCode: "41004", accountName: "درآمدها - انتقالات",                                    ratio: "**" }
    ]
  },
  {
    id: 146,
    title: "ثبت شماره ۳۰-۱",
    description: "انتقال دارایی‌های واحد گزارشگر به شرکت‌ها — به عنوان افزایش سرمایه دولت",
    code: "CAP-30-1",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "13003", accountName: "سرمایه‌گذاری در شرکت‌ها",                               ratio: "**" },
      { type: "credit", accountCode: "13001", accountName: "دارایی‌ها به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها",     ratio: "**" }
    ]
  },
  {
    id: 147,
    title: "ثبت شماره ۳۰-۲",
    description: "انتقال دارایی‌های واحد گزارشگر به خارج از واحدهای گزارشگر — به عنوان مطالبات بلندمدت دولت",
    code: "CAP-30-2",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "15002", accountName: "مطالبات بلندمدت دولت",                                  ratio: "**" },
      { type: "credit", accountCode: "13001", accountName: "دارایی‌ها به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها",     ratio: "**" }
    ]
  },
  {
    id: 148,
    title: "ثبت شماره ۳۰-۳",
    description: "انتقال دارایی‌های واحد گزارشگر به خارج از واحدهای گزارشگر — به عنوان کمک دولت",
    code: "CAP-30-3",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "64001", accountName: "هزینه‌ها به تفکیک طبقه‌بندی اقتصادی دولت",             ratio: "**" },
      { type: "credit", accountCode: "13001", accountName: "دارایی‌ها به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها",     ratio: "**" }
    ]
  },
  {
    id: 149,
    title: "ثبت شماره ۳۱",
    description: "به هنگام دریافت اسناد و مدارک مربوط به استفاده از تنخواه‌گردان پرداخت واگذار شده از عاملین ذیحساب",
    code: "CAP-31",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "89005", accountName: "حساب انتظامی - اسناد وصولی از عاملین ذیحساب",       ratio: "**" },
      { type: "credit", accountCode: "99005", accountName: "طرف حساب انتظامی - اسناد وصولی از عاملین ذیحساب",   ratio: "**" }
    ]
  },
  {
    id: 150,
    title: "ثبت شماره ۳۲",
    description: "پس از تایید اسناد و مدارک مربوط به استفاده از تنخواه‌گردان پرداخت واگذار شده",
    code: "CAP-32",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "13002", accountName: "دارایی در جریان تکمیل",                                  ratio: "**", section: "شناسایی دارایی و موجودی" },
      { type: "debit",  accountCode: "13001", accountName: "دارایی‌ها به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها",      ratio: "**", section: "شناسایی دارایی و موجودی" },
      { type: "debit",  accountCode: "14001", accountName: "موجودی‌ها به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها",      ratio: "**", section: "شناسایی دارایی و موجودی" },
      { type: "debit",  accountCode: "17001", accountName: "پیش‌پرداخت بابت عملیات سرمایه‌ای",                       ratio: "**", section: "شناسایی دارایی و موجودی" },
      { type: "debit",  accountCode: "17002", accountName: "پیش‌پرداخت مواد و کالا",                                  ratio: "**", section: "شناسایی دارایی و موجودی" },
      { type: "credit", accountCode: "16001", accountName: "تنخواه‌گردان پرداخت بابت عملیات سرمایه‌ای",              ratio: "**", section: "شناسایی دارایی و موجودی" },
      { type: "debit",  accountCode: "89002", accountName: "حساب انتظامی - تضمین‌های دریافتی",                       ratio: "**", section: "برگشت تضمین‌های دریافتی" },
      { type: "credit", accountCode: "99002", accountName: "طرف حساب انتظامی - تضمین‌های دریافتی",                   ratio: "**", section: "برگشت تضمین‌های دریافتی" },
      { type: "debit",  accountCode: "89004", accountName: "حساب انتظامی - علی‌الحساب بابت عملیات سرمایه‌ای",        ratio: "**", section: "برگشت علی‌الحساب" },
      { type: "credit", accountCode: "99004", accountName: "طرف حساب انتظامی - علی‌الحساب بابت عملیات سرمایه‌ای",    ratio: "**", section: "برگشت علی‌الحساب" },
      { type: "debit",  accountCode: "95002", accountName: "اعتبار سرمایه‌ای مصرف شده",                               ratio: "**", section: "قطعی شدن اعتبار" },
      { type: "credit", accountCode: "98002", accountName: "اعتبار سرمایه‌ای بابت پرداخت‌های غیرقطعی",                ratio: "**", section: "قطعی شدن اعتبار" }
    ]
  },
  {
    id: 151,
    title: "ثبت شماره ۳۳",
    description: "در صورت تایید اسناد و مدارک مربوط به تسویه تنخواه‌گردان واگذار شده به عاملین ذیحساب در موعد قانونی مقرر",
    code: "CAP-33",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "24001", accountName: "حساب‌ها و اسناد پرداختنی",                               ratio: "**", section: "تسویه تنخواه‌گردان" },
      { type: "credit", accountCode: "13002", accountName: "دارایی در جریان تکمیل",                                   ratio: "**", section: "تسویه تنخواه‌گردان" },
      { type: "credit", accountCode: "13001", accountName: "دارایی‌ها به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها",       ratio: "**", section: "تسویه تنخواه‌گردان" },
      { type: "credit", accountCode: "14001", accountName: "موجودی‌ها به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها",       ratio: "**", section: "تسویه تنخواه‌گردان" },
      { type: "credit", accountCode: "17001", accountName: "پیش‌پرداخت بابت عملیات سرمایه‌ای",                        ratio: "**", section: "تسویه تنخواه‌گردان" },
      { type: "credit", accountCode: "11004", accountName: "بانک وجوه سایر منابع",                                    ratio: "**", section: "تسویه تنخواه‌گردان" },
      { type: "debit",  accountCode: "99004", accountName: "طرف حساب انتظامی - علی‌الحساب بابت عملیات سرمایه‌ای",    ratio: "**", section: "برگشت انتظامی علی‌الحساب" },
      { type: "credit", accountCode: "89004", accountName: "حساب انتظامی - علی‌الحساب بابت عملیات سرمایه‌ای",        ratio: "**", section: "برگشت انتظامی علی‌الحساب" },
      { type: "debit",  accountCode: "99002", accountName: "طرف حساب انتظامی - تضمین‌های دریافتی",                   ratio: "**", section: "برگشت انتظامی تضمین" },
      { type: "credit", accountCode: "89002", accountName: "حساب انتظامی - تضمین‌های دریافتی",                       ratio: "**", section: "برگشت انتظامی تضمین" }
    ]
  },
  {
    id: 152,
    title: "ثبت شماره ۳۴",
    description: "شناسایی واریز نقدی تنخواه‌گردان پرداخت و پیش‌پرداخت سال‌جاری",
    code: "CAP-34",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "11002", accountName: "بانک پرداخت سرمایه‌ای",                                   ratio: "**", section: "واریز نقدی" },
      { type: "debit",  accountCode: "11003", accountName: "بانک پرداخت اختصاصی",                                     ratio: "**", section: "واریز نقدی" },
      { type: "debit",  accountCode: "11004", accountName: "بانک وجوه سایر منابع",                                    ratio: "**", section: "واریز نقدی" },
      { type: "credit", accountCode: "17001", accountName: "پیش‌پرداخت بابت عملیات سرمایه‌ای",                        ratio: "**", section: "واریز نقدی" },
      { type: "credit", accountCode: "17002", accountName: "پیش‌پرداخت مواد و کالا",                                  ratio: "**", section: "واریز نقدی" },
      { type: "credit", accountCode: "16001", accountName: "تنخواه‌گردان پرداخت بابت عملیات سرمایه‌ای",               ratio: "**", section: "واریز نقدی" },
      { type: "debit",  accountCode: "93002", accountName: "اعتبار سرمایه‌ای تخصیص یافته",                            ratio: "**", section: "برگشت اعتبار غیرقطعی" },
      { type: "debit",  accountCode: "92002", accountName: "اعتبار سرمایه‌ای",                                        ratio: "**", section: "برگشت اعتبار غیرقطعی" },
      { type: "debit",  accountCode: "94001", accountName: "اعتبار سرمایه‌ای ابلاغی",                                 ratio: "**", section: "برگشت اعتبار غیرقطعی" },
      { type: "credit", accountCode: "98002", accountName: "اعتبار سرمایه‌ای بابت پرداخت‌های غیرقطعی",                ratio: "**", section: "برگشت اعتبار غیرقطعی" },
      { type: "debit",  accountCode: "99002", accountName: "طرف حساب انتظامی - تضمین‌های دریافتی",                   ratio: "**", section: "کاهش تضمین‌های دریافتی" },
      { type: "credit", accountCode: "89002", accountName: "حساب انتظامی - تضمین‌های دریافتی",                       ratio: "**", section: "کاهش تضمین‌های دریافتی" }
    ]
  },
  {
    id: 153,
    title: "ثبت شماره ۳۵",
    description: "در صورت واخواهی اسناد ارایه شده",
    code: "CAP-35",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "15003", accountName: "حساب‌ها و اسناد دریافتنی - اسناد واخواهی سرمایه‌ای",  ratio: "**", section: "ثبت واخواهی" },
      { type: "credit", accountCode: "16001", accountName: "تنخواه‌گردان پرداخت بابت عملیات سرمایه‌ای",           ratio: "**", section: "ثبت واخواهی" },
      { type: "debit",  accountCode: "96003", accountName: "اسناد واخواهی بابت اعتبار سرمایه‌ای",                 ratio: "**", section: "کنترل اعتبار" },
      { type: "credit", accountCode: "98002", accountName: "اعتبار سرمایه‌ای بابت پرداخت‌های غیرقطعی",            ratio: "**", section: "کنترل اعتبار" }
    ]
  },
  {
    id: 154,
    title: "ثبت شماره ۳۶",
    description: "در صورت رفع اسناد واخواهی در سال شناسایی آن",
    code: "CAP-36",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "13001", accountName: "دارایی‌ها به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها",    ratio: "**", section: "رفع واخواهی - شناسایی دارایی" },
      { type: "debit",  accountCode: "13002", accountName: "دارایی در جریان تکمیل",                                 ratio: "**", section: "رفع واخواهی - شناسایی دارایی" },
      { type: "debit",  accountCode: "14001", accountName: "موجودی‌ها به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها",    ratio: "**", section: "رفع واخواهی - شناسایی دارایی" },
      { type: "debit",  accountCode: "17002", accountName: "پیش‌پرداخت مواد و کالا",                                ratio: "**", section: "رفع واخواهی - شناسایی دارایی" },
      { type: "debit",  accountCode: "17001", accountName: "پیش‌پرداخت بابت عملیات سرمایه‌ای",                     ratio: "**", section: "رفع واخواهی - شناسایی دارایی" },
      { type: "credit", accountCode: "15003", accountName: "حساب‌ها و اسناد دریافتنی - اسناد واخواهی سرمایه‌ای",  ratio: "**", section: "رفع واخواهی - شناسایی دارایی" },
      { type: "debit",  accountCode: "95002", accountName: "اعتبار سرمایه‌ای مصرف شده",                            ratio: "**", section: "قطعی شدن اعتبار" },
      { type: "debit",  accountCode: "98002", accountName: "اعتبار سرمایه‌ای بابت پرداخت‌های غیرقطعی",             ratio: "**", section: "قطعی شدن اعتبار" },
      { type: "credit", accountCode: "96003", accountName: "اسناد واخواهی بابت اعتبار سرمایه‌ای",                  ratio: "**", section: "قطعی شدن اعتبار" }
    ]
  },
  {
    id: 155,
    title: "ثبت شماره ۳۷",
    description: "در صورت رفع اسناد واخواهی شده در سال بعد (پس از پایان آخرین مهلت درنظر گرفته شده)",
    code: "CAP-37",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "13001", accountName: "دارایی‌ها به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها",    ratio: "**", section: "رفع واخواهی - شناسایی دارایی" },
      { type: "debit",  accountCode: "13002", accountName: "دارایی در جریان تکمیل",                                 ratio: "**", section: "رفع واخواهی - شناسایی دارایی" },
      { type: "debit",  accountCode: "14001", accountName: "موجودی‌ها به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها",    ratio: "**", section: "رفع واخواهی - شناسایی دارایی" },
      { type: "debit",  accountCode: "17002", accountName: "پیش‌پرداخت مواد و کالا",                                ratio: "**", section: "رفع واخواهی - شناسایی دارایی" },
      { type: "debit",  accountCode: "17001", accountName: "پیش‌پرداخت بابت عملیات سرمایه‌ای",                     ratio: "**", section: "رفع واخواهی - شناسایی دارایی" },
      { type: "credit", accountCode: "15003", accountName: "حساب‌ها و اسناد دریافتنی - اسناد واخواهی سرمایه‌ای",  ratio: "**", section: "رفع واخواهی - شناسایی دارایی" },
      { type: "debit",  accountCode: "95003", accountName: "اعتبار سرمایه‌ای انتقالی مصرف شده",                    ratio: "**", section: "قطعی شدن اعتبار انتقالی" },
      { type: "debit",  accountCode: "98003", accountName: "اعتبار سرمایه‌ای انتقالی بابت پرداخت‌های غیرقطعی",     ratio: "**", section: "قطعی شدن اعتبار انتقالی" },
      { type: "credit", accountCode: "96004", accountName: "اسناد واخواهی بابت اعتبار سرمایه‌ای انتقالی",          ratio: "**", section: "قطعی شدن اعتبار انتقالی" }
    ]
  },
  {
    id: 156,
    title: "ثبت شماره ۳۸",
    description: "در صورت عدم رفع اسناد واخواهی شده تا موعد قانونی تهیه صورت‌حساب عملکرد بودجه سالانه کل کشور",
    code: "CAP-38",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "15004", accountName: "حساب‌ها و اسناد دریافتنی - کسری ابواب جمعی سرمایه‌ای", ratio: "**", section: "تبدیل به کسری ابواب جمعی" },
      { type: "credit", accountCode: "15003", accountName: "حساب‌ها و اسناد دریافتنی - اسناد واخواهی سرمایه‌ای",   ratio: "**", section: "تبدیل به کسری ابواب جمعی" },
      { type: "debit",  accountCode: "96005", accountName: "کسری ابواب جمعی بابت اعتبار سرمایه‌ای انتقالی",         ratio: "**", section: "کنترل اعتبار انتقالی" },
      { type: "credit", accountCode: "96004", accountName: "اسناد واخواهی بابت اعتبار سرمایه‌ای انتقالی",           ratio: "**", section: "کنترل اعتبار انتقالی" }
    ]
  },
  {
    id: 157,
    title: "ثبت شماره ۳۹",
    description: "در صورت ایجاد کسری در دارایی‌ها",
    code: "CAP-39",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "15004", accountName: "حساب‌ها و اسناد دریافتنی - کسری ابواب جمعی سرمایه‌ای", ratio: "**", section: "شناسایی کسری در دارایی‌ها" },
      { type: "credit", accountCode: "16001", accountName: "تنخواه‌گردان پرداخت بابت عملیات سرمایه‌ای",              ratio: "**", section: "شناسایی کسری در دارایی‌ها" },
      { type: "credit", accountCode: "17001", accountName: "پیش‌پرداخت بابت عملیات سرمایه‌ای",                       ratio: "**", section: "شناسایی کسری در دارایی‌ها" },
      { type: "credit", accountCode: "17002", accountName: "پیش‌پرداخت مواد و کالا",                                  ratio: "**", section: "شناسایی کسری در دارایی‌ها" },
      { type: "credit", accountCode: "13001", accountName: "دارایی‌ها به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها",       ratio: "**", section: "شناسایی کسری در دارایی‌ها" },
      { type: "credit", accountCode: "13002", accountName: "دارایی در جریان تکمیل",                                   ratio: "**", section: "شناسایی کسری در دارایی‌ها" },
      { type: "credit", accountCode: "14001", accountName: "موجودی‌ها به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها",       ratio: "**", section: "شناسایی کسری در دارایی‌ها" },
      { type: "credit", accountCode: "11002", accountName: "بانک پرداخت سرمایه‌ای",                                   ratio: "**", section: "شناسایی کسری در دارایی‌ها" },
      { type: "credit", accountCode: "11003", accountName: "بانک پرداخت اختصاصی",                                     ratio: "**", section: "شناسایی کسری در دارایی‌ها" },
      { type: "credit", accountCode: "11004", accountName: "بانک وجوه سایر منابع",                                    ratio: "**", section: "شناسایی کسری در دارایی‌ها" },
      { type: "debit",  accountCode: "96005", accountName: "کسری ابواب جمعی بابت اعتبار سرمایه‌ای",                  ratio: "**", section: "کنترل اعتبار" },
      { type: "credit", accountCode: "98002", accountName: "اعتبار سرمایه‌ای بابت پرداخت‌های غیرقطعی",                ratio: "**", section: "کنترل اعتبار" },
      { type: "credit", accountCode: "92002", accountName: "اعتبار سرمایه‌ای",                                        ratio: "**", section: "کنترل اعتبار" },
      { type: "credit", accountCode: "93002", accountName: "اعتبار سرمایه‌ای تخصیص یافته",                            ratio: "**", section: "کنترل اعتبار" },
      { type: "credit", accountCode: "94001", accountName: "اعتبار سرمایه‌ای ابلاغی",                                 ratio: "**", section: "کنترل اعتبار" }
    ]
  },
  {
    id: 158,
    title: "ثبت شماره ۴۰",
    description: "در صورت رفع کسری ابواب جمعی در سال شناسایی آن",
    code: "CAP-40",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "13001", accountName: "دارایی‌ها به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها",      ratio: "**", section: "رفع کسری - شناسایی دارایی" },
      { type: "debit",  accountCode: "13002", accountName: "دارایی در جریان تکمیل",                                   ratio: "**", section: "رفع کسری - شناسایی دارایی" },
      { type: "debit",  accountCode: "14001", accountName: "موجودی‌ها به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها",      ratio: "**", section: "رفع کسری - شناسایی دارایی" },
      { type: "credit", accountCode: "15004", accountName: "حساب‌ها و اسناد دریافتنی - کسری ابواب جمعی سرمایه‌ای",  ratio: "**", section: "رفع کسری - شناسایی دارایی" },
      { type: "debit",  accountCode: "95002", accountName: "اعتبار سرمایه‌ای مصرف شده",                               ratio: "**", section: "قطعی شدن اعتبار" },
      { type: "debit",  accountCode: "98002", accountName: "اعتبار سرمایه‌ای بابت پرداخت‌های غیرقطعی",                ratio: "**", section: "قطعی شدن اعتبار" },
      { type: "credit", accountCode: "96005", accountName: "کسری ابواب جمعی بابت اعتبار سرمایه‌ای",                  ratio: "**", section: "قطعی شدن اعتبار" }
    ]
  },
  {
    id: 159,
    title: "ثبت شماره ۴۱",
    description: "در صورت رفع کسری ابواب جمعی پس از پایان آخرین مهلت درنظر گرفته شده برای ارائه صورت‌حساب دریافت و پرداخت نهایی",
    code: "CAP-41",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "13001", accountName: "دارایی‌ها به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها",      ratio: "**", section: "رفع کسری - شناسایی دارایی" },
      { type: "debit",  accountCode: "13002", accountName: "دارایی در جریان تکمیل",                                   ratio: "**", section: "رفع کسری - شناسایی دارایی" },
      { type: "debit",  accountCode: "14001", accountName: "موجودی‌ها به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها",      ratio: "**", section: "رفع کسری - شناسایی دارایی" },
      { type: "credit", accountCode: "15004", accountName: "حساب‌ها و اسناد دریافتنی - کسری ابواب جمعی سرمایه‌ای",  ratio: "**", section: "رفع کسری - شناسایی دارایی" },
      { type: "debit",  accountCode: "95003", accountName: "اعتبار سرمایه‌ای انتقالی مصرف شده",                      ratio: "**", section: "قطعی شدن اعتبار انتقالی" },
      { type: "debit",  accountCode: "98003", accountName: "اعتبار سرمایه‌ای انتقالی بابت پرداخت‌های غیرقطعی",       ratio: "**", section: "قطعی شدن اعتبار انتقالی" },
      { type: "credit", accountCode: "96006", accountName: "کسری ابواب جمعی بابت اعتبار سرمایه‌ای انتقالی",          ratio: "**", section: "قطعی شدن اعتبار انتقالی" }
    ]
  },
  {
    id: 160,
    title: "ثبت شماره ۴۲",
    description: "در صورت واریز نقدی کسری ابواب جمعی یا اسناد واخواهی شده از سوی اشخاص در سال(های) پس از شناسایی آن",
    code: "CAP-42",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "11002", accountName: "بانک پرداخت سرمایه‌ای",                                   ratio: "**", section: "واریز نقدی از اشخاص" },
      { type: "debit",  accountCode: "11003", accountName: "بانک پرداخت اختصاصی",                                     ratio: "**", section: "واریز نقدی از اشخاص" },
      { type: "debit",  accountCode: "11004", accountName: "بانک وجوه سایر منابع",                                    ratio: "**", section: "واریز نقدی از اشخاص" },
      { type: "credit", accountCode: "15003", accountName: "حساب‌ها و اسناد دریافتنی - اسناد واخواهی سرمایه‌ای",     ratio: "**", section: "واریز نقدی از اشخاص" },
      { type: "credit", accountCode: "15004", accountName: "حساب‌ها و اسناد دریافتنی - کسری ابواب جمعی سرمایه‌ای",  ratio: "**", section: "واریز نقدی از اشخاص" },
      { type: "debit",  accountCode: "91003", accountName: "بودجه اعتبار سرمایه‌ای انتقالی",                          ratio: "**", section: "کنترل اعتبار انتقالی" },
      { type: "credit", accountCode: "96004", accountName: "اسناد واخواهی بابت اعتبار سرمایه‌ای انتقالی",             ratio: "**", section: "کنترل اعتبار انتقالی" },
      { type: "credit", accountCode: "96006", accountName: "کسری ابواب جمعی بابت اعتبار سرمایه‌ای انتقالی",           ratio: "**", section: "کنترل اعتبار انتقالی" }
    ]
  },
  {
    id: 161,
    title: "ثبت شماره ۴۳-۱",
    description: "به هنگام صدور احکام تعهدآور از سوی مراجع ذی‌صلاح",
    code: "CAP-43-1",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "13001", accountName: "دارایی‌ها به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها",    ratio: "**" },
      { type: "debit",  accountCode: "13002", accountName: "دارایی در جریان تکمیل",                                 ratio: "**" },
      { type: "credit", accountCode: "26001", accountName: "ذخیره احکام صادره از مراجع ذی‌صلاح",                    ratio: "**" }
    ]
  },
  {
    id: 162,
    title: "ثبت شماره ۴۳-۲",
    description: "برداشت از حساب‌های بانکی پس از تامین منابع (اعتبار مصوب یا وجوه سایر منابع)",
    code: "CAP-43-2",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "26001", accountName: "ذخیره احکام صادره از مراجع ذی‌صلاح",                    ratio: "**", section: "پرداخت و تسویه" },
      { type: "credit", accountCode: "11002", accountName: "بانک پرداخت سرمایه‌ای",                                  ratio: "**", section: "پرداخت و تسویه" },
      { type: "credit", accountCode: "11003", accountName: "بانک پرداخت اختصاصی",                                    ratio: "**", section: "پرداخت و تسویه" },
      { type: "credit", accountCode: "11004", accountName: "بانک وجوه سایر منابع",                                   ratio: "**", section: "پرداخت و تسویه" },
      { type: "debit",  accountCode: "95002", accountName: "اعتبار سرمایه‌ای مصرف شده",                              ratio: "**", section: "قطعی شدن اعتبار" },
      { type: "credit", accountCode: "97002", accountName: "اعتبار سرمایه‌ای تامین شده",                             ratio: "**", section: "قطعی شدن اعتبار" }
    ]
  },
  {
    id: 163,
    title: "ثبت شماره ۴۳-۳-۱",
    description: "دفاتر واحد محکوم: پس از جابجایی و کاهش اعتبار واحد محکوم",
    code: "CAP-43-3-1",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "91002", accountName: "بودجه اعتبار سرمایه‌ای",                                 ratio: "**", section: "کاهش اعتبار واحد محکوم" },
      { type: "credit", accountCode: "92002", accountName: "اعتبار سرمایه‌ای",                                       ratio: "**", section: "کاهش اعتبار واحد محکوم" },
      { type: "credit", accountCode: "93002", accountName: "اعتبار سرمایه‌ای تخصیص یافته",                           ratio: "**", section: "کاهش اعتبار واحد محکوم" },
      { type: "debit",  accountCode: "26001", accountName: "ذخیره احکام صادره از مراجع ذی‌صلاح",                    ratio: "**", section: "تسویه ذخیره" },
      { type: "credit", accountCode: "41004", accountName: "درآمدها - انتقالات",                                     ratio: "**", section: "تسویه ذخیره" }
    ]
  },
  {
    id: 164,
    title: "ثبت شماره ۴۳-۳-۲",
    description: "دفاتر سازمان مدیریت و برنامه‌ریزی استان: پرداخت احکام صادره واحدهای محکوم",
    code: "CAP-43-3-2",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "97002", accountName: "اعتبار سرمایه‌ای تامین شده",                             ratio: "**", section: "تامین و پرداخت" },
      { type: "credit", accountCode: "94001", accountName: "اعتبار سرمایه‌ای ابلاغی",                                ratio: "**", section: "تامین و پرداخت" },
      { type: "debit",  accountCode: "63001", accountName: "هزینه‌ها - انتقالات",                                    ratio: "**", section: "شناسایی هزینه" },
      { type: "credit", accountCode: "11002", accountName: "بانک پرداخت ...",                                        ratio: "**", section: "شناسایی هزینه" },
      { type: "debit",  accountCode: "95002", accountName: "اعتبار سرمایه‌ای مصرف شده",                              ratio: "**", section: "قطعی شدن اعتبار" },
      { type: "credit", accountCode: "97002", accountName: "اعتبار سرمایه‌ای تامین شده",                             ratio: "**", section: "قطعی شدن اعتبار" }
    ]
  },
  {
    id: 165,
    title: "ثبت شماره ۴۳-۴",
    description: "کسری ابواب جمعی برداشتی — زمانی که منابع لازم تامین نشود و برداشت وجه نقد از سوی اشخاص انجام شود",
    code: "CAP-43-4",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "26001", accountName: "ذخیره احکام صادره از مراجع ذی‌صلاح",                     ratio: "**", section: "شناسایی کسری برداشتی" },
      { type: "credit", accountCode: "11002", accountName: "بانک پرداخت سرمایه‌ای",                                   ratio: "**", section: "شناسایی کسری برداشتی" },
      { type: "credit", accountCode: "11003", accountName: "بانک پرداخت اختصاصی",                                     ratio: "**", section: "شناسایی کسری برداشتی" },
      { type: "credit", accountCode: "11004", accountName: "بانک وجوه سایر منابع",                                    ratio: "**", section: "شناسایی کسری برداشتی" },
      { type: "debit",  accountCode: "89006", accountName: "حساب انتظامی - کسری ابواب جمعی برداشتی",                  ratio: "**", section: "کنترل انتظامی" },
      { type: "credit", accountCode: "99006", accountName: "طرف حساب انتظامی - کسری ابواب جمعی برداشتی",              ratio: "**", section: "کنترل انتظامی" }
    ]
  },
  {
    id: 166,
    title: "ثبت شماره ۴۳-۵",
    description: "برداشت وجه نقد از حساب بانکی عامل ذیحساب — کسری ایجاد شده در تنخواه‌گردان پرداخت",
    code: "CAP-43-5",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "13001", accountName: "دارایی‌ها به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها",      ratio: "**", section: "شناسایی کسری تنخواه" },
      { type: "debit",  accountCode: "13002", accountName: "دارایی در جریان تکمیل",                                   ratio: "**", section: "شناسایی کسری تنخواه" },
      { type: "credit", accountCode: "16001", accountName: "تنخواه‌گردان پرداخت بابت عملیات سرمایه‌ای",               ratio: "**", section: "شناسایی کسری تنخواه" },
      { type: "debit",  accountCode: "93002", accountName: "اعتبار سرمایه‌ای تخصیص یافته",                            ratio: "**", section: "تعدیل حساب‌های بودجه‌ای" },
      { type: "credit", accountCode: "98002", accountName: "اعتبار سرمایه‌ای بابت پرداخت‌های غیرقطعی",                ratio: "**", section: "تعدیل حساب‌های بودجه‌ای" },
      { type: "debit",  accountCode: "89006", accountName: "حساب انتظامی - کسری ابواب جمعی برداشتی",                  ratio: "**", section: "کنترل انتظامی" },
      { type: "credit", accountCode: "99006", accountName: "طرف حساب انتظامی - کسری ابواب جمعی برداشتی",              ratio: "**", section: "کنترل انتظامی" }
    ]
  },
  {
    id: 167,
    title: "ثبت شماره ۴۳-۶",
    description: "چنانچه در سال شناسایی کسری ابواب جمعی برداشتی، منابع لازم تامین و کسری رفع گردد",
    code: "CAP-43-6",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "99006", accountName: "طرف حساب انتظامی - کسری ابواب جمعی برداشتی",             ratio: "**", section: "رفع انتظامی" },
      { type: "credit", accountCode: "89006", accountName: "حساب انتظامی - کسری ابواب جمعی برداشتی",                  ratio: "**", section: "رفع انتظامی" },
      { type: "debit",  accountCode: "95002", accountName: "اعتبار سرمایه‌ای مصرف شده",                               ratio: "**", section: "قطعی شدن اعتبار" },
      { type: "credit", accountCode: "93002", accountName: "اعتبار سرمایه‌ای تخصیص یافته",                            ratio: "**", section: "قطعی شدن اعتبار" }
    ]
  },
  {
    id: 168,
    title: "ثبت شماره ۴۳-۷",
    description: "چنانچه منابع لازم برای رفع کسری ابواب جمعی برداشتی، در دوره‌های مالی پس از شناسایی آن تامین شود",
    code: "CAP-43-7",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "99006", accountName: "طرف حساب انتظامی - کسری ابواب جمعی برداشتی",             ratio: "**" },
      { type: "credit", accountCode: "89006", accountName: "حساب انتظامی - کسری ابواب جمعی برداشتی",                  ratio: "**" }
    ]
  },
  {
    id: 169,
    title: "ثبت شماره ۴۳-۸",
    description: "در صورت واریز نقدی کسری ابواب جمعی برداشتی از سوی اشخاص در دوره‌های مالی پس از شناسایی آن",
    code: "CAP-43-8",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "11002", accountName: "بانک پرداخت سرمایه‌ای",                                   ratio: "**", section: "واریز نقدی از اشخاص" },
      { type: "debit",  accountCode: "11003", accountName: "بانک پرداخت اختصاصی",                                     ratio: "**", section: "واریز نقدی از اشخاص" },
      { type: "debit",  accountCode: "11004", accountName: "بانک وجوه سایر منابع",                                    ratio: "**", section: "واریز نقدی از اشخاص" },
      { type: "credit", accountCode: "13001", accountName: "دارایی‌ها به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها",       ratio: "**", section: "واریز نقدی از اشخاص" },
      { type: "credit", accountCode: "13002", accountName: "دارایی در جریان تکمیل",                                   ratio: "**", section: "واریز نقدی از اشخاص" },
      { type: "debit",  accountCode: "99006", accountName: "طرف حساب انتظامی - کسری ابواب جمعی برداشتی",              ratio: "**", section: "رفع انتظامی" },
      { type: "credit", accountCode: "89006", accountName: "حساب انتظامی - کسری ابواب جمعی برداشتی",                  ratio: "**", section: "رفع انتظامی" }
    ]
  },
  {
    id: 170,
    title: "ثبت شماره ۴۴",
    description: "شناسایی هزینه استهلاک دارایی‌ها",
    code: "CAP-44",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "64002", accountName: "هزینه‌ها به تفکیک طبقه‌بندی اقتصادی دولت - استهلاک", ratio: "**" },
      { type: "credit", accountCode: "13004", accountName: "استهلاک انباشته ...",                                  ratio: "**" }
    ]
  },
  {
    id: 171,
    title: "ثبت شماره ۴۵-۱",
    description: "معاوضه دارایی‌های واحد گزارشگر با دارایی سایر واحدها — دارایی با ارزش منصفانه اندازه‌گیری شده",
    code: "CAP-45-1",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "13001", accountName: "دارایی‌ها به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها (جدید)", ratio: "**", section: "شناسایی دارایی جدید و خروج قدیم" },
      { type: "debit",  accountCode: "13004", accountName: "استهلاک انباشته ...",                                       ratio: "**", section: "شناسایی دارایی جدید و خروج قدیم" },
      { type: "debit",  accountCode: "13005", accountName: "ذخیره کاهش ارزش دارایی‌ها",                                ratio: "**", section: "شناسایی دارایی جدید و خروج قدیم" },
      { type: "debit",  accountCode: "11002", accountName: "بانک ...",                                                   ratio: "**", section: "شناسایی دارایی جدید و خروج قدیم" },
      { type: "debit",  accountCode: "15001", accountName: "حساب‌ها و اسناد دریافتنی",                                  ratio: "**", section: "شناسایی دارایی جدید و خروج قدیم" },
      { type: "debit",  accountCode: "64001", accountName: "هزینه‌ها به تفکیک طبقه‌بندی اقتصادی دولت",                 ratio: "**", section: "شناسایی دارایی جدید و خروج قدیم" },
      { type: "credit", accountCode: "13001", accountName: "دارایی‌ها به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها (قدیم)", ratio: "**", section: "شناسایی دارایی جدید و خروج قدیم" },
      { type: "credit", accountCode: "11002", accountName: "بانک ...",                                                   ratio: "**", section: "شناسایی دارایی جدید و خروج قدیم" },
      { type: "credit", accountCode: "24001", accountName: "حساب‌ها و اسناد پرداختنی",                                  ratio: "**", section: "شناسایی دارایی جدید و خروج قدیم" },
      { type: "credit", accountCode: "41005", accountName: "درآمدهای واحد به تفکیک طبقه‌بندی مربوط",                   ratio: "**", section: "شناسایی دارایی جدید و خروج قدیم" }
    ]
  },
  {
    id: 172,
    title: "ثبت شماره ۴۵-۲",
    description: "معاوضه فاقد محتوای تجاری یا دارایی تحصیل‌شده با ارزش منصفانه قابل اندازه‌گیری نباشد — بر اساس ارزش دفتری",
    code: "CAP-45-2",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "13001", accountName: "دارایی‌ها به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها (جدید)", ratio: "**" },
      { type: "debit",  accountCode: "13004", accountName: "استهلاک انباشته ...",                                        ratio: "**" },
      { type: "debit",  accountCode: "13005", accountName: "ذخیره کاهش ارزش دارایی‌ها",                                 ratio: "**" },
      { type: "debit",  accountCode: "11002", accountName: "بانک ...",                                                    ratio: "**" },
      { type: "debit",  accountCode: "15001", accountName: "حساب‌ها و اسناد دریافتنی",                                   ratio: "**" },
      { type: "credit", accountCode: "13001", accountName: "دارایی‌ها به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها (قدیم)", ratio: "**" },
      { type: "credit", accountCode: "11002", accountName: "بانک ...",                                                    ratio: "**" },
      { type: "credit", accountCode: "24001", accountName: "حساب‌ها و اسناد پرداختنی",                                   ratio: "**" }
    ]
  },
  {
    id: 173,
    title: "ثبت شماره ۴۶-۱",
    description: "شناسایی کاهش ارزش دارایی‌های ثابت مشهود و دارایی‌های نامشهود — روش بهای تمام شده",
    code: "CAP-46-1",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "64003", accountName: "هزینه‌ها به تفکیک طبقه‌بندی اقتصادی دولت - کاهش ارزش", ratio: "**" },
      { type: "credit", accountCode: "13005", accountName: "ذخیره کاهش ارزش دارایی‌ها",                               ratio: "**" }
    ]
  },
  {
    id: 174,
    title: "ثبت شماره ۴۶-۲",
    description: "شناسایی برگشت کاهش ارزش دارایی‌ها",
    code: "CAP-46-2",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "13005", accountName: "ذخیره کاهش ارزش دارایی‌ها",                               ratio: "**" },
      { type: "credit", accountCode: "41005", accountName: "درآمدهای واحد به تفکیک طبقه‌بندی مربوط",                  ratio: "**" }
    ]
  },
  {
    id: 175,
    title: "ثبت شماره ۴۷-۱",
    description: "شناسایی افزایش مبلغ دفتری دارایی‌های ثابت مشهود و دارایی‌های نامشهود در نتیجه تجدید ارزیابی",
    code: "CAP-47-1",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "13001", accountName: "دارایی‌ها به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها",  ratio: "**" },
      { type: "debit",  accountCode: "13004", accountName: "استهلاک انباشته ...",                                  ratio: "**" },
      { type: "debit",  accountCode: "13005", accountName: "ذخیره کاهش ارزش دارایی‌ها",                           ratio: "**" },
      { type: "credit", accountCode: "13001", accountName: "دارایی‌ها به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها",  ratio: "**" },
      { type: "credit", accountCode: "41005", accountName: "درآمدهای واحد به تفکیک طبقه‌بندی مربوط",             ratio: "**" },
      { type: "credit", accountCode: "31007", accountName: "مازاد تجدید ارزیابی",                                 ratio: "**" }
    ]
  },
  {
    id: 176,
    title: "ثبت شماره ۴۷-۲",
    description: "شناسایی کاهش ارزش دارایی‌ها در روش تجدید ارزیابی",
    code: "CAP-47-2",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "31007", accountName: "مازاد تجدید ارزیابی",                                  ratio: "**" },
      { type: "debit",  accountCode: "64003", accountName: "هزینه‌ها به تفکیک طبقه‌بندی اقتصادی دولت - کاهش ارزش", ratio: "**" },
      { type: "debit",  accountCode: "13004", accountName: "استهلاک انباشته ...",                                   ratio: "**" },
      { type: "credit", accountCode: "13001", accountName: "دارایی‌ها به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها",   ratio: "**" },
      { type: "credit", accountCode: "13005", accountName: "ذخیره کاهش ارزش دارایی‌ها",                            ratio: "**" }
    ]
  },
  {
    id: 177,
    title: "ثبت شماره ۴۸",
    description: "در صورت برکناری دایمی دارایی‌های واحد گزارشگر طبق قوانین و مقررات مربوط",
    code: "CAP-48",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "13004", accountName: "استهلاک انباشته ...",                                   ratio: "**", section: "خروج دارایی" },
      { type: "debit",  accountCode: "13005", accountName: "ذخیره کاهش ارزش دارایی‌ها",                            ratio: "**", section: "خروج دارایی" },
      { type: "debit",  accountCode: "64001", accountName: "هزینه‌ها به تفکیک طبقه‌بندی اقتصادی دولت",             ratio: "**", section: "خروج دارایی" },
      { type: "credit", accountCode: "13001", accountName: "دارایی‌ها به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها",   ratio: "**", section: "خروج دارایی" },
      { type: "debit",  accountCode: "31007", accountName: "مازاد تجدید ارزیابی",                                  ratio: "**", section: "انتقال مازاد تجدید ارزیابی" },
      { type: "credit", accountCode: "31008", accountName: "انتقال از سایر اقلام ارزش خالص",                       ratio: "**", section: "انتقال مازاد تجدید ارزیابی" }
    ]
  },
  {
    id: 178,
    title: "ثبت شماره ۴۹",
    description: "شناسایی کاهش ارزش موجودی‌ها",
    code: "CAP-49",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "64003", accountName: "هزینه‌ها به تفکیک طبقه‌بندی اقتصادی دولت - کاهش ارزش موجودی", ratio: "**" },
      { type: "credit", accountCode: "14002", accountName: "ذخیره کاهش ارزش موجودی‌ها",                                    ratio: "**" }
    ]
  },
  {
    id: 179,
    title: "ثبت شماره ۵۰",
    description: "شناسایی درآمد حاصل از بازیافت کاهش ارزش موجودی‌ها",
    code: "CAP-50",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "14002", accountName: "ذخیره کاهش ارزش موجودی‌ها",                          ratio: "**" },
      { type: "credit", accountCode: "41005", accountName: "درآمدهای واحد به تفکیک طبقه‌بندی مربوط",             ratio: "**" }
    ]
  },
  {
    id: 180,
    title: "ثبت شماره ۵۱",
    description: "شناسایی بدهی‌ها بابت تعهدات مازاد بر اعتبار سرمایه‌ای تخصیص یافته",
    code: "CAP-51",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "13001", accountName: "دارایی‌ها به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها",  ratio: "**" },
      { type: "debit",  accountCode: "13002", accountName: "دارایی در جریان تکمیل",                               ratio: "**" },
      { type: "debit",  accountCode: "14001", accountName: "موجودی‌ها به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها",  ratio: "**" },
      { type: "credit", accountCode: "27001", accountName: "ذخیره تعهدات سرمایه‌ای",                             ratio: "**" }
    ]
  },
  {
    id: 181,
    title: "ثبت شماره ۵۲-۱",
    description: "بستن حساب‌های مالی موقت",
    code: "CAP-52-1",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "41002", accountName: "دریافتی بابت عملیات سرمایه‌ای",                        ratio: "**" },
      { type: "debit",  accountCode: "51001", accountName: "هدایا و کمک‌ها",                                       ratio: "**" },
      { type: "debit",  accountCode: "41003", accountName: "دریافتی از محل سایر منابع",                             ratio: "**" },
      { type: "debit",  accountCode: "41004", accountName: "درآمدها - انتقالات",                                    ratio: "**" },
      { type: "debit",  accountCode: "41005", accountName: "درآمدهای واحد به تفکیک طبقه‌بندی مربوط",               ratio: "**" },
      { type: "credit", accountCode: "64001", accountName: "هزینه‌ها به تفکیک طبقه‌بندی اقتصادی دولت",             ratio: "**", },
      { type: "credit", accountCode: "63001", accountName: "هزینه‌ها - انتقالات",                                  ratio: "**", },
      { type: "credit", accountCode: "32001", accountName: "انتقال به خزانه",                                      ratio: "**", },
      { type: "credit", accountCode: "33001", accountName: "خالص تغییر در وضعیت مالی",                             ratio: "**", },
      { type: "debit",  accountCode: "33001", accountName: "خالص تغییر در وضعیت مالی",                             ratio: "**", section: "حساب ارزش خالص انباشته بابت تغییرات مربوط، حسب مورد شناسايي ميشود" },
      { type: "debit",  accountCode: "31006", accountName: "تعدیلات سنواتی",                                       ratio: "**" },
      { type: "debit",  accountCode: "19002", accountName: "دارایی‌های دریافتی",                                   ratio: "**" },
      { type: "credit", accountCode: "31001", accountName: "ارزش خالص انباشته",                                    ratio: "**" },
      { type: "debit",  accountCode: "31001", accountName: "ارزش خالص انباشته",                                    ratio: "**" },
      { type: "credit", accountCode: "19001", accountName: "دارایی‌های انتقالی",                                   ratio: "**" }
    ]
  },
  {
    id: 182,
    title: "ثبت شماره ۵۲-۲",
    description: "بستن حساب‌های مالی دایمی - حسابداری عملیات سرمایه‌ای",
    code: "CAP-52-2",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "21001", accountName: "حساب‌ها و اسناد پرداختنی",                              ratio: "**" },
      { type: "debit",  accountCode: "24001", accountName: "بیمه پرداختنی",                                         ratio: "**" },
      { type: "debit",  accountCode: "24004", accountName: "مالیات پرداختنی",                                       ratio: "**" },
      { type: "debit",  accountCode: "21007", accountName: "سپرده پرداختنی",                                        ratio: "**" },
      { type: "debit",  accountCode: "24005", accountName: "ذخیره احکام صادره از مراجع ذی‌صلاح",                    ratio: "**" },
      { type: "debit",  accountCode: "15040", accountName: "استهلاک انباشته ...",                                   ratio: "**" },
      { type: "debit",  accountCode: "13005", accountName: "ذخیره کاهش ارزش موجودی‌ها",                             ratio: "**" },
      { type: "debit",  accountCode: "15050", accountName: "ذخیره کاهش ارزش دارایی‌ها",                             ratio: "**" },
      { type: "debit",  accountCode: "24007", accountName: "ذخیره تعهدات سرمایه‌ای",                                ratio: "**" },
      { type: "debit",  accountCode: "32001", accountName: "مازاد تجدید ارزیابی",                                   ratio: "**" },
      { type: "debit",  accountCode: "31001", accountName: "ارزش خالص انباشته",                                     ratio: "**" },
      { type: "credit", accountCode: "11002", accountName: "بانک پرداخت سرمایه‌ای",                                 ratio: "**" },
      { type: "credit", accountCode: "11003", accountName: "بانک پرداخت اختصاصی",                                   ratio: "**" },
      { type: "credit", accountCode: "11004", accountName: "بانک وجوه سایر منابع",                                  ratio: "**" },
      { type: "credit", accountCode: "11022", accountName: "تنخواه گردان پرداخت بابت عملیات سرمایه‌ای",             ratio: "**" },
      { type: "credit", accountCode: "13001", accountName: "موجودی‌ها - به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها",    ratio: "**" },
      { type: "credit", accountCode: "11506", accountName: "حساب‌ها و اسناد دریافتنی- اسناد واخواهی سرمایه‌ای",     ratio: "**" },
      { type: "credit", accountCode: "11508", accountName: "حساب‌ها و اسناد دریافتنی- کسری ابواب‌جمعی سرمایه‌ای",   ratio: "**" },
      { type: "credit", accountCode: "11522", accountName: "مطالبات از خزانه",                                      ratio: "**" },
      { type: "credit", accountCode: "15001", accountName: "دارایی در جریان تکمیل",                                 ratio: "**" },
      { type: "credit", accountCode: "15002", accountName: "دارایی‌ها - به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها",    ratio: "**" },
      { type: "credit", accountCode: "17001", accountName: "سرمایه‌گذاری در شرکت‌ها",                               ratio: "**" },
      { type: "credit", accountCode: "18001", accountName: "مطالبات بلندمدت دولت",                                  ratio: "**" },
      { type: "credit", accountCode: "15060", accountName: "پیش‌پرداخت بابت عملیات سرمایه‌ای",                      ratio: "**" },
      { type: "credit", accountCode: "15080", accountName: "پیش‌پرداخت مواد و کالا",                                ratio: "**" },
      { type: "credit", accountCode: "21004", accountName: "هزینه مالی آتی",                                        ratio: "**" }
    ]
  },
  {
    id: 183,
    title: "ثبت شماره ۵۲-۳",
    description: "بستن حساب‌های انتظامی - حسابداری عملیات سرمایه‌ای",
    code: "CAP-52-3",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "82004", accountName: "طرف حساب انتظامی- علی‌الحساب بابت عملیات سرمایه‌ای",  ratio: "**" },
      { type: "credit", accountCode: "81004", accountName: "حساب انتظامی- علی‌الحساب بابت عملیات سرمایه‌ای",      ratio: "**" },
      { type: "debit",  accountCode: "82001", accountName: "طرف حساب انتظامی- تضمین‌های دریافتی",                  ratio: "**" },
      { type: "credit", accountCode: "81001", accountName: "حساب انتظامی- تضمین‌های دریافتی",                      ratio: "**" },
      { type: "debit",  accountCode: "82006", accountName: "طرف حساب انتظامی- اسناد وصولی از عاملین ذیحساب",       ratio: "**" },
      { type: "credit", accountCode: "81006", accountName: "حساب انتظامی- اسناد وصولی از عاملین ذیحساب",           ratio: "**" },
      { type: "debit",  accountCode: "82007", accountName: "طرف حساب انتظامی- کسری ابواب‌جمعی برداشتی",            ratio: "**" },
      { type: "credit", accountCode: "81007", accountName: "حساب انتظامی- کسری ابواب‌جمعی برداشتی",                ratio: "**" },
      { type: "debit",  accountCode: "82017", accountName: "طرف حساب انتظامی- کنترل دریافتی‌ها بابت اعتبار",       ratio: "**" },
      { type: "credit", accountCode: "81017", accountName: "حساب انتظامی- کنترل دریافتی‌ها بابت اعتبار",           ratio: "**" }
    ]
  },
  {
    id: 184,
    title: "ثبت شماره ۵۲-۴",
    description: "بستن حساب‌های بودجه‌ای - حسابداری عملیات سرمایه‌ای",
    code: "CAP-52-4",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "91002", accountName: "بودجه اعتبار سرمایه‌ای",                                     ratio: "**" },
      { type: "debit",  accountCode: "91004", accountName: "بودجه اعتبار سرمایه‌ای انتقالی",                              ratio: "**" },
      { type: "credit", accountCode: "92002", accountName: "اعتبار سرمایه‌ای",                                            ratio: "**" },
      { type: "credit", accountCode: "93002", accountName: "اعتبار سرمایه‌ای تخصیص یافته",                                ratio: "**" },
      { type: "credit", accountCode: "94002", accountName: "حواله اعتبار سرمایه‌ای",                                      ratio: "**" },
      { type: "credit", accountCode: "94004", accountName: "حواله اعتبار سرمایه‌ای انتقالی",                              ratio: "**" },
      { type: "credit", accountCode: "95002", accountName: "اعتبار سرمایه‌ای ابلاغی",                                     ratio: "**" },
      { type: "credit", accountCode: "95004", accountName: "اعتبار سرمایه‌ای انتقالی ابلاغی",                             ratio: "**" },
      { type: "credit", accountCode: "91502", accountName: "اعتبار سرمایه‌ای انتقالی",                                    ratio: "**" },
      { type: "credit", accountCode: "97002", accountName: "اعتبار سرمایه‌ای تامین شده",                                  ratio: "**" },
      { type: "credit", accountCode: "97004", accountName: "اعتبار سرمایه‌ای انتقالی تامین شده",                          ratio: "**" },
      { type: "credit", accountCode: "99002", accountName: "اعتبار سرمایه‌ای مصرف شده",                                   ratio: "**" },
      { type: "credit", accountCode: "99004", accountName: "اعتبار سرمایه‌ای انتقالی مصرف شده",                           ratio: "**" },
      { type: "credit", accountCode: "98002", accountName: "اعتبار سرمایه‌ای بابت پرداخت‌های غیرقطعی",                   ratio: "**" },
      { type: "credit", accountCode: "98004", accountName: "اعتبار سرمایه‌ای انتقالی بابت پرداخت‌های غیرقطعی",           ratio: "**" },
      { type: "credit", accountCode: "92502", accountName: "اسناد واخواهی بابت اعتبار سرمایه‌ای",                        ratio: "**" },
      { type: "credit", accountCode: "92504", accountName: "اسناد واخواهی بابت اعتبار سرمایه‌ای انتقالی",                ratio: "**" },
      { type: "credit", accountCode: "93502", accountName: "کسری ابواب‌جمعی بابت اعتبار سرمایه‌ای",                      ratio: "**" },
      { type: "credit", accountCode: "93504", accountName: "کسری ابواب‌جمعی بابت اعتبار سرمایه‌ای انتقالی",              ratio: "**" }
    ]
  },
  {
    id: 185,
    title: "ثبت شماره ۵۳-۱",
    description: "افتتاح حساب‌های مالی دایمی - حسابداری عملیات سرمایه‌ای",
    code: "CAP-53-1",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "11002", accountName: "بانک پرداخت سرمایه‌ای",                                 ratio: "**" },
      { type: "debit",  accountCode: "11003", accountName: "بانک پرداخت اختصاصی",                                   ratio: "**" },
      { type: "debit",  accountCode: "11004", accountName: "بانک وجوه سایر منابع",                                  ratio: "**" },
      { type: "debit",  accountCode: "11022", accountName: "تنخواه گردان پرداخت بابت عملیات سرمایه‌ای",             ratio: "**" },
      { type: "debit",  accountCode: "13001", accountName: "موجودی‌ها - به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها",    ratio: "**" },
      { type: "debit",  accountCode: "11506", accountName: "حساب‌ها و اسناد دریافتنی- اسناد واخواهی سرمایه‌ای",     ratio: "**" },
      { type: "debit",  accountCode: "11508", accountName: "حساب‌ها و اسناد دریافتنی- کسری ابواب‌جمعی سرمایه‌ای",   ratio: "**" },
      { type: "debit",  accountCode: "15001", accountName: "دارایی در جریان تکمیل",                                 ratio: "**" },
      { type: "debit",  accountCode: "11522", accountName: "مطالبات از خزانه",                                      ratio: "**" },
      { type: "debit",  accountCode: "15002", accountName: "دارایی‌ها - به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها",    ratio: "**" },
      { type: "debit",  accountCode: "17001", accountName: "سرمایه‌گذاری در شرکت‌ها",                               ratio: "**" },
      { type: "debit",  accountCode: "18001", accountName: "مطالبات بلندمدت دولت",                                  ratio: "**" },
      { type: "debit",  accountCode: "15060", accountName: "پیش‌پرداخت بابت عملیات سرمایه‌ای",                      ratio: "**" },
      { type: "debit",  accountCode: "15080", accountName: "پیش‌پرداخت مواد و کالا",                                ratio: "**" },
      { type: "debit",  accountCode: "21004", accountName: "هزینه مالی آتی",                                        ratio: "**" },
      { type: "credit", accountCode: "21001", accountName: "حساب‌ها و اسناد پرداختنی",                              ratio: "**" },
      { type: "credit", accountCode: "24001", accountName: "بیمه پرداختنی",                                         ratio: "**" },
      { type: "credit", accountCode: "24004", accountName: "مالیات پرداختنی",                                       ratio: "**" },
      { type: "credit", accountCode: "21007", accountName: "سپرده پرداختنی",                                        ratio: "**" },
      { type: "credit", accountCode: "24005", accountName: "ذخیره احکام صادره از مراجع ذی‌صلاح",                    ratio: "**" },
      { type: "credit", accountCode: "15040", accountName: "استهلاک انباشته ...",                                   ratio: "**" },
      { type: "credit", accountCode: "13005", accountName: "ذخیره کاهش ارزش موجودی‌ها",                             ratio: "**" },
      { type: "credit", accountCode: "15050", accountName: "ذخیره کاهش ارزش دارایی‌ها",                             ratio: "**" },
      { type: "credit", accountCode: "24007", accountName: "ذخیره تعهدات سرمایه‌ای",                                ratio: "**" },
      { type: "credit", accountCode: "32001", accountName: "مازاد تجدید ارزیابی",                                   ratio: "**" },
      { type: "credit", accountCode: "31001", accountName: "ارزش خالص انباشته",                                     ratio: "**" }
    ]
  },
  {
    id: 186,
    title: "ثبت شماره ۵۳-۲",
    description: "افتتاح حساب‌های انتظامی - حسابداری عملیات سرمایه‌ای",
    code: "CAP-53-2",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "81004", accountName: "حساب انتظامی- علی‌الحساب بابت عملیات سرمایه‌ای",      ratio: "**" },
      { type: "credit", accountCode: "82004", accountName: "طرف حساب انتظامی- علی‌الحساب بابت عملیات سرمایه‌ای",  ratio: "**" },
      { type: "debit",  accountCode: "81001", accountName: "حساب انتظامی- تضمین‌های دریافتی",                      ratio: "**" },
      { type: "credit", accountCode: "82001", accountName: "طرف حساب انتظامی- تضمین‌های دریافتی",                  ratio: "**" },
      { type: "debit",  accountCode: "81006", accountName: "حساب انتظامی- اسناد وصولی از عاملین ذیحساب",           ratio: "**" },
      { type: "credit", accountCode: "82006", accountName: "طرف حساب انتظامی- اسناد وصولی از عاملین ذیحساب",       ratio: "**" },
      { type: "debit",  accountCode: "81007", accountName: "حساب انتظامی- کسری ابواب‌جمعی برداشتی",                ratio: "**" },
      { type: "credit", accountCode: "82007", accountName: "طرف حساب انتظامی- کسری ابواب‌جمعی برداشتی",            ratio: "**" }
    ]
  },
  {
    id: 187,
    title: "ثبت شماره ۵۳-۳",
    description: "افتتاح حساب‌های بودجه‌ای - حسابداری عملیات سرمایه‌ای (حساب‌های اعتبار سرمایه‌ای انتقالی با سطح تفصیلی سنواتی افتتاح می‌شوند)",
    code: "CAP-53-3",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "91502", accountName: "اعتبار سرمایه‌ای انتقالی",                                    ratio: "**" },
      { type: "debit",  accountCode: "97004", accountName: "اعتبار سرمایه‌ای انتقالی تامین شده",                          ratio: "**" },
      { type: "debit",  accountCode: "98004", accountName: "اعتبار سرمایه‌ای انتقالی بابت پرداخت‌های غیرقطعی",           ratio: "**" },
      { type: "debit",  accountCode: "92504", accountName: "اسناد واخواهی بابت اعتبار سرمایه‌ای انتقالی",                ratio: "**" },
      { type: "debit",  accountCode: "93504", accountName: "کسری ابواب‌جمعی بابت اعتبار سرمایه‌ای انتقالی",              ratio: "**" },
      { type: "credit", accountCode: "91004", accountName: "بودجه اعتبار سرمایه‌ای انتقالی",                              ratio: "**" }
    ]
  },
  {
    id: 188,
    title: "ثبت شماره ۵۴",
    description: "به هنگام تامین اعتبار از محل وجوه انتقالی سال‌های قبل",
    code: "CAP-54",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "97004", accountName: "اعتبار سرمایه‌ای انتقالی تامین شده",  ratio: "**" },
      { type: "credit", accountCode: "91502", accountName: "اعتبار سرمایه‌ای انتقالی",             ratio: "**" }
    ]
  },
  {
    id: 189,
    title: "ثبت شماره ۵۵",
    description: "در صورت واریز تمام یا بخشی از پیش‌پرداخت سال‌های قبل به حساب واحد گزارشگر",
    code: "CAP-55",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "11002", accountName: "بانک پرداخت سرمایه‌ای",                                  ratio: "**" },
      { type: "debit",  accountCode: "11003", accountName: "بانک پرداخت اختصاصی",                                    ratio: "**" },
      { type: "debit",  accountCode: "11004", accountName: "بانک وجوه سایر منابع",                                   ratio: "**" },
      { type: "credit", accountCode: "15060", accountName: "پیش‌پرداخت بابت عملیات سرمایه‌ای",                       ratio: "**" },
      { type: "debit",  accountCode: "91004", accountName: "بودجه اعتبار سرمایه‌ای انتقالی",                         ratio: "**" },
      { type: "credit", accountCode: "98004", accountName: "اعتبار سرمایه‌ای انتقالی بابت پرداخت‌های غیرقطعی",       ratio: "**" }
    ]
  },
  {
    id: 190,
    title: "ثبت شماره ۵۶",
    description: "در صورت واریز تمام یا بخشی از علی‌الحساب سال‌های قبل به حساب واحد گزارشگر",
    code: "CAP-56",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "11002", accountName: "بانک پرداخت سرمایه‌ای",                                  ratio: "**" },
      { type: "debit",  accountCode: "11003", accountName: "بانک پرداخت اختصاصی",                                    ratio: "**" },
      { type: "debit",  accountCode: "11004", accountName: "بانک وجوه سایر منابع",                                   ratio: "**" },
      { type: "credit", accountCode: "15001", accountName: "دارایی در جریان تکمیل",                                  ratio: "**" },
      { type: "credit", accountCode: "15002", accountName: "دارایی‌ها - به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها",     ratio: "**" },
      { type: "credit", accountCode: "13001", accountName: "موجودی‌ها - به تفکیک طبقه‌بندی شیوه‌نامه دارایی‌ها",     ratio: "**" },
      { type: "debit",  accountCode: "82004", accountName: "طرف حساب انتظامی- علی‌الحساب بابت عملیات سرمایه‌ای",     ratio: "**" },
      { type: "credit", accountCode: "81004", accountName: "حساب انتظامی- علی‌الحساب بابت عملیات سرمایه‌ای",         ratio: "**" },
      { type: "debit",  accountCode: "91004", accountName: "بودجه اعتبار سرمایه‌ای انتقالی",                         ratio: "**" },
      { type: "credit", accountCode: "98004", accountName: "اعتبار سرمایه‌ای انتقالی بابت پرداخت‌های غیرقطعی",       ratio: "**" }
    ]
  },
  {
    id: 191,
    title: "ثبت شماره ۵۷",
    description: "در صورتی‌که بر اساس قوانین و مقررات مربوط واحد گزارشگر ملزم به واریز وجوه حاصل از پیش‌پرداخت و علی‌الحساب انتقالی یا واریز منابع مانده بودجه‌ای به حساب خزانه باشد",
    code: "CAP-57",
    category: "capital",
    status: "active",
    lines: [
      { type: "debit",  accountCode: "63001", accountName: "انتقال به خزانه",               ratio: "**" },
      { type: "credit", accountCode: "11002", accountName: "بانک پرداخت سرمایه‌ای",         ratio: "**" },
      { type: "credit", accountCode: "11003", accountName: "بانک پرداخت اختصاصی",           ratio: "**" },
      { type: "debit",  accountCode: "91004", accountName: "بودجه اعتبار سرمایه‌ای انتقالی", section: "به میزان مانده منابع مصرف نشده بودجه اي واريزي به خزانه، ثبت ذيل اعمال ميشود", ratio: "**" },
      { type: "credit", accountCode: "91502", accountName: "اعتبار سرمایه‌ای انتقالی",      ratio: "**" }
    ]
  }
];
