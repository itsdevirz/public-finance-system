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
  }
];
