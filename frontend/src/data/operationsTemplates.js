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
    description: "ثبت هزینه تعمیر و نگهداری وسایل نقلیه",
    code: "OP-15",
    category: "expenses",
    status: "active",
    lines: [
      { type: "debit", accountCode: "61002", accountName: "هزینه استفاده از کالا و خدمات", ratio: "100%" },
      { type: "credit", accountCode: "11001", accountName: "بانک پرداخت هزینه", ratio: "100%" }
    ]
  },
  {
    id: 16,
    title: "ثبت شماره ۱۶",
    description: "پرداخت هزینه‌های پستی و پیک",
    code: "OP-16",
    category: "expenses",
    status: "active",
    lines: [
      { type: "debit", accountCode: "61002", accountName: "هزینه استفاده از کالا و خدمات", ratio: "100%" },
      { type: "credit", accountCode: "11001", accountName: "بانک پرداخت هزینه", ratio: "100%" }
    ]
  },
  {
    id: 17,
    title: "ثبت شماره ۱۷",
    description: "پرداخت هزینه‌های پذیرایی و تشریفات",
    code: "OP-17",
    category: "expenses",
    status: "active",
    lines: [
      { type: "debit", accountCode: "61002", accountName: "هزینه استفاده از کالا و خدمات", ratio: "100%" },
      { type: "credit", accountCode: "11001", accountName: "بانک پرداخت هزینه", ratio: "100%" }
    ]
  },
  {
    id: 18,
    title: "ثبت شماره ۱۸",
    description: "ثبت هزینه تبلیغات و اطلاع‌رسانی",
    code: "OP-18",
    category: "expenses",
    status: "active",
    lines: [
      { type: "debit", accountCode: "61002", accountName: "هزینه استفاده از کالا و خدمات", ratio: "100%" },
      { type: "credit", accountCode: "21001", accountName: "حساب‌ها و اسناد پرداختنی حاصل از عملیات مبادله ای", ratio: "100%" }
    ]
  },
  {
    id: 19,
    title: "ثبت شماره ۱۹",
    description: "پرداخت حق‌الزحمه کارشناسان و مشاوران",
    code: "OP-19",
    category: "expenses",
    status: "active",
    lines: [
      { type: "debit", accountCode: "61002", accountName: "هزینه استفاده از کالا و خدمات", ratio: "100%" },
      { type: "credit", accountCode: "11001", accountName: "بانک پرداخت هزینه", ratio: "100%" }
    ]
  },
  {
    id: 20,
    title: "ثبت شماره ۲۰",
    description: "ثبت هزینه آموزش و ارتقای کارکنان",
    code: "OP-20",
    category: "expenses",
    status: "active",
    lines: [
      { type: "debit", accountCode: "61002", accountName: "هزینه استفاده از کالا و خدمات", ratio: "100%" },
      { type: "credit", accountCode: "11001", accountName: "بانک پرداخت هزینه", ratio: "100%" }
    ]
  },
  {
    id: 21,
    title: "ثبت شماره ۲۱",
    description: "ثبت هزینه خرید کتاب، نشریات و نرم‌افزار",
    code: "OP-21",
    category: "expenses",
    status: "active",
    lines: [
      { type: "debit", accountCode: "61002", accountName: "هزینه استفاده از کالا و خدمات", ratio: "100%" },
      { type: "credit", accountCode: "11001", accountName: "بانک پرداخت هزینه", ratio: "100%" }
    ]
  },
  {
    id: 22,
    title: "ثبت شماره ۲۲",
    description: "پرداخت هزینه‌های قضایی و ثبتی",
    code: "OP-22",
    category: "expenses",
    status: "active",
    lines: [
      { type: "debit", accountCode: "61002", accountName: "هزینه استفاده از کالا و خدمات", ratio: "100%" },
      { type: "credit", accountCode: "11001", accountName: "بانک پرداخت هزینه", ratio: "100%" }
    ]
  },
  {
    id: 23,
    title: "ثبت شماره ۲۳",
    description: "ثبت هزینه شارژ ساختمان و نظافت",
    code: "OP-23",
    category: "expenses",
    status: "active",
    lines: [
      { type: "debit", accountCode: "61002", accountName: "هزینه استفاده از کالا و خدمات", ratio: "100%" },
      { type: "credit", accountCode: "11001", accountName: "بانک پرداخت هزینه", ratio: "100%" }
    ]
  },
  {
    id: 24,
    title: "ثبت شماره ۲۴",
    description: "پرداخت مساعده به کارکنان",
    code: "OP-24",
    category: "salaries",
    status: "active",
    lines: [
      { type: "debit", accountCode: "11501", accountName: "حساب‌ها و اسناد دریافتنی", ratio: "100%" },
      { type: "credit", accountCode: "11001", accountName: "بانک پرداخت هزینه", ratio: "100%" }
    ]
  },
  {
    id: 25,
    title: "ثبت شماره ۲۵",
    description: "تسویه مساعده از حقوق ماهانه",
    code: "OP-25",
    category: "salaries",
    status: "active",
    lines: [
      { type: "debit", accountCode: "21005", accountName: "حقوق و مزایای پرداختنی", ratio: "100%" },
      { type: "credit", accountCode: "11501", accountName: "حساب‌ها و اسناد دریافتنی", ratio: "100%" }
    ]
  },
  {
    id: 26,
    title: "ثبت شماره ۲۶",
    description: "ثبت وام پرداختی به پرسنل",
    code: "OP-26",
    category: "salaries",
    status: "active",
    lines: [
      { type: "debit", accountCode: "11501", accountName: "حساب‌ها و اسناد دریافتنی", ratio: "100%" },
      { type: "credit", accountCode: "11001", accountName: "بانک پرداخت هزینه", ratio: "100%" }
    ]
  },
  {
    id: 27,
    title: "ثبت شماره ۲۷",
    description: "دریافت اقساط وام پرسنلی",
    code: "OP-27",
    category: "salaries",
    status: "active",
    lines: [
      { type: "debit", accountCode: "11007", accountName: "بانک دریافت", ratio: "100%" },
      { type: "credit", accountCode: "11501", accountName: "حساب‌ها و اسناد دریافتنی", ratio: "100%" }
    ]
  },
  {
    id: 28,
    title: "ثبت شماره ۲۸",
    description: "ثبت حقوق و مزایای ناخالص کارکنان",
    code: "OP-28",
    category: "salaries",
    status: "active",
    lines: [
      { type: "debit", accountCode: "61001", accountName: "هزینه جبران خدمت کارکنان", ratio: "100%" },
      { type: "credit", accountCode: "21005", accountName: "حقوق و مزایای پرداختنی", ratio: "100%" }
    ]
  },
  {
    id: 29,
    title: "ثبت شماره ۲۹",
    description: "ثبت کسر حق بیمه سهم کارمند و کارفرما",
    code: "OP-29",
    category: "salaries",
    status: "active",
    lines: [
      { type: "debit", accountCode: "61001", accountName: "هزینه جبران خدمت کارکنان", ratio: "23%" },
      { type: "debit", accountCode: "21005", accountName: "حقوق و مزایای پرداختنی", ratio: "7%" },
      { type: "credit", accountCode: "24001", accountName: "بیمه پرداختنی", ratio: "30%" }
    ]
  },
  {
    id: 30,
    title: "ثبت شماره ۳۰",
    description: "ثبت کسر مالیات حقوق و دستمزد",
    code: "OP-30",
    category: "salaries",
    status: "active",
    lines: [
      { type: "debit", accountCode: "21005", accountName: "حقوق و مزایای پرداختنی", ratio: "10%" },
      { type: "credit", accountCode: "24004", accountName: "مالیات پرداختنی", ratio: "10%" }
    ]
  },
  {
    id: 31,
    title: "ثبت شماره ۳۱",
    description: "ثبت سایر کسورات قانونی حقوق",
    code: "OP-31",
    category: "salaries",
    status: "active",
    lines: [
      { type: "debit", accountCode: "21005", accountName: "حقوق و مزایای پرداختنی", ratio: "100%" },
      { type: "credit", accountCode: "24003", accountName: "سایر کسورات پرداختنی", ratio: "100%" }
    ]
  },
  {
    id: 32,
    title: "ثبت شماره ۳۲",
    description: "پرداخت خالص حقوق و مزایای کارکنان",
    code: "OP-32",
    category: "salaries",
    status: "active",
    lines: [
      { type: "debit", accountCode: "21005", accountName: "حقوق و مزایای پرداختنی", ratio: "100%" },
      { type: "credit", accountCode: "11001", accountName: "بانک پرداخت هزینه", ratio: "100%" }
    ]
  },
  {
    id: 33,
    title: "ثبت شماره ۳۳",
    description: "ثبت ذخیره سنوات خدمت پرسنل (پایان کار)",
    code: "OP-33",
    category: "salaries",
    status: "active",
    lines: [
      { type: "debit", accountCode: "61001", accountName: "هزینه جبران خدمت کارکنان", ratio: "100%" },
      { type: "credit", accountCode: "22001", accountName: "حساب‌ها و اسناد پرداختنی حاصل از عملیات غیر مبادله ای", ratio: "100%" }
    ]
  },
  {
    id: 34,
    title: "ثبت شماره ۳۴",
    description: "ثبت ذخیره مرخصی استفاده‌نشده کارکنان",
    code: "OP-34",
    category: "salaries",
    status: "active",
    lines: [
      { type: "debit", accountCode: "61001", accountName: "هزینه جبران خدمت کارکنان", ratio: "100%" },
      { type: "credit", accountCode: "22001", accountName: "حساب‌ها و اسناد پرداختنی حاصل از عملیات غیر مبادله ای", ratio: "100%" }
    ]
  },
  {
    id: 35,
    title: "ثبت شماره ۳۵",
    description: "پرداخت علی‌الحساب عیدی و پاداش",
    code: "OP-35",
    category: "salaries",
    status: "active",
    lines: [
      { type: "debit", accountCode: "11501", accountName: "حساب‌ها و اسناد دریافتنی", ratio: "100%" },
      { type: "credit", accountCode: "11001", accountName: "بانک پرداخت هزینه", ratio: "100%" }
    ]
  },
  {
    id: 36,
    title: "ثبت شماره ۳۶",
    description: "تسویه نهایی عیدی و سنوات پایان سال",
    code: "OP-36",
    category: "salaries",
    status: "active",
    lines: [
      { type: "debit", accountCode: "61001", accountName: "هزینه جبران خدمت کارکنان", ratio: "100%" },
      { type: "credit", accountCode: "11501", accountName: "حساب‌ها و اسناد دریافتنی", ratio: "80%" },
      { type: "credit", accountCode: "11001", accountName: "بانک پرداخت هزینه (مابه‌التفاوت)", ratio: "20%" }
    ]
  },
  {
    id: 37,
    title: "ثبت شماره ۳۷",
    description: "ثبت درآمد فروش خدمات آموزشی",
    code: "OP-37",
    category: "receipts",
    status: "active",
    lines: [
      { type: "debit", accountCode: "11007", accountName: "بانک دریافت", ratio: "100%" },
      { type: "credit", accountCode: "45004", accountName: "درآمدهای حاصل از فروش کالا و خدمات", ratio: "100%" }
    ]
  },
  {
    id: 38,
    title: "ثبت شماره ۳۸",
    description: "ثبت درآمد فروش خدمات مشاوره‌ای",
    code: "OP-38",
    category: "receipts",
    status: "active",
    lines: [
      { type: "debit", accountCode: "11007", accountName: "بانک دریافت", ratio: "100%" },
      { type: "credit", accountCode: "45004", accountName: "درآمدهای حاصل از فروش کالا و خدمات", ratio: "100%" }
    ]
  },
  {
    id: 39,
    title: "ثبت شماره ۳۹",
    description: "ثبت درآمد اجاره اماکن و تجهیزات",
    code: "OP-39",
    category: "receipts",
    status: "active",
    lines: [
      { type: "debit", accountCode: "11007", accountName: "بانک دریافت", ratio: "100%" },
      { type: "credit", accountCode: "45003", accountName: "درآمدهای حاصل از مالکیت", ratio: "100%" }
    ]
  },
  {
    id: 40,
    title: "ثبت شماره ۴۰",
    description: "دریافت سود سپرده‌های بانکی جاری",
    code: "OP-40",
    category: "receipts",
    status: "active",
    lines: [
      { type: "debit", accountCode: "11007", accountName: "بانک دریافت", ratio: "100%" },
      { type: "credit", accountCode: "45006", accountName: "سایر درآمدهای واحد", ratio: "100%" }
    ]
  },
  {
    id: 41,
    title: "ثبت شماره ۴۱",
    description: "دریافت وجوه حاصل از بازیافت اسقاط",
    code: "OP-41",
    category: "receipts",
    status: "active",
    lines: [
      { type: "debit", accountCode: "11007", accountName: "بانک دریافت", ratio: "100%" },
      { type: "credit", accountCode: "45006", accountName: "سایر درآمدهای واحد", ratio: "100%" }
    ]
  },
  {
    id: 42,
    title: "ثبت شماره ۴۲",
    description: "ثبت کسری یا فزونی صندوق",
    code: "OP-42",
    category: "receipts",
    status: "active",
    lines: [
      { type: "debit", accountCode: "61008", accountName: "سایر هزینه‌ها", ratio: "100%" },
      { type: "credit", accountCode: "11024", accountName: "صندوق", ratio: "100%" }
    ]
  },
  {
    id: 43,
    title: "ثبت شماره ۴۳",
    description: "ثبت هزینه‌های بانکی و کارمزد تراکنش‌ها",
    code: "OP-43",
    category: "expenses",
    status: "active",
    lines: [
      { type: "debit", accountCode: "61002", accountName: "هزینه استفاده از کالا و خدمات", ratio: "100%" },
      { type: "credit", accountCode: "11001", accountName: "بانک پرداخت هزینه", ratio: "100%" }
    ]
  },
  {
    id: 44,
    title: "ثبت شماره ۴۴",
    description: "ثبت پیش‌دریافت درآمدها",
    code: "OP-44",
    category: "receipts",
    status: "active",
    lines: [
      { type: "debit", accountCode: "11007", accountName: "بانک دریافت", ratio: "100%" },
      { type: "credit", accountCode: "23003", accountName: "پیش دریافت درآمد", ratio: "100%" }
    ]
  },
  {
    id: 45,
    title: "ثبت شماره ۴۵",
    description: "تسویه پیش‌دریافت با ارائه خدمت",
    code: "OP-45",
    category: "receipts",
    status: "active",
    lines: [
      { type: "debit", accountCode: "23003", accountName: "پیش دریافت درآمد", ratio: "100%" },
      { type: "credit", accountCode: "45004", accountName: "درآمدهای حاصل از فروش کالا و خدمات", ratio: "100%" }
    ]
  },
  {
    id: 46,
    title: "ثبت شماره ۴۶",
    description: "ثبت مالیات بر ارزش افزوده خرید",
    code: "OP-46",
    category: "taxes",
    status: "active",
    lines: [
      { type: "debit", accountCode: "11519", accountName: "مالیات و عوارض ارزش افزوده خرید کالا و خدمات", ratio: "100%" },
      { type: "credit", accountCode: "11001", accountName: "بانک پرداخت هزینه", ratio: "100%" }
    ]
  },
  {
    id: 47,
    title: "ثبت شماره ۴۷",
    description: "ثبت مالیات بر ارزش افزوده فروش",
    code: "OP-47",
    category: "taxes",
    status: "active",
    lines: [
      { type: "debit", accountCode: "11007", accountName: "بانک دریافت", ratio: "100%" },
      { type: "credit", accountCode: "21010", accountName: "مالیات و عوارض ارزش افزوده فروش کالا و خدمات", ratio: "100%" }
    ]
  },
  {
    id: 48,
    title: "ثبت شماره ۴۸",
    description: "ثبت تهاتر مالیات ارزش افزوده خرید و فروش",
    code: "OP-48",
    category: "taxes",
    status: "active",
    lines: [
      { type: "debit", accountCode: "21010", accountName: "مالیات و عوارض ارزش افزوده فروش کالا و خدمات", ratio: "100%" },
      { type: "credit", accountCode: "11519", accountName: "مالیات و عوارض ارزش افزوده خرید کالا و خدمات", ratio: "100%" }
    ]
  },
  {
    id: 49,
    title: "ثبت شماره ۴۹",
    description: "ثبت ذخیره مالیات بر درآمد عملکرد سالانه",
    code: "OP-49",
    category: "taxes",
    status: "active",
    lines: [
      { type: "debit", accountCode: "61008", accountName: "سایر هزینه‌ها", ratio: "100%" },
      { type: "credit", accountCode: "24004", accountName: "مالیات پرداختنی", ratio: "100%" }
    ]
  }
];
