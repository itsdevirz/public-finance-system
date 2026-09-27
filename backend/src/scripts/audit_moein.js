import fs from 'fs';
import path from 'path';

const REFERENCE_MAP = {
  // گروه 91 تا 99 — بودجه و اعتبار
  "91001": { title: "بودجه اعتبار هزینه", nature: "credit" },
  "91002": { title: "بودجه اعتبار سرمایهای", nature: "credit" },
  "91003": { title: "بودجه اعتبار هزینه انتقالی", nature: "credit" },
  "91004": { title: "بودجه اعتبار سرمایهای انتقالی", nature: "credit" },
  "91501": { title: "اعتبار هزینه انتقالی", nature: "debit" },
  "91502": { title: "اعتبار سرمایهای انتقالی", nature: "debit" },
  "92001": { title: "اعتبار هزینه", nature: "debit" },
  "92002": { title: "اعتبار سرمایهای", nature: "debit" },
  "92501": { title: "بابت اعتبار هزینه", nature: "debit" },
  "92502": { title: "بابت اعتبار سرمایهای", nature: "debit" },
  "92503": { title: "بابت اعتبار هزینه انتقالی", nature: "debit" },
  "92504": { title: "بابت اعتبار سرمایهای انتقالی", nature: "debit" },
  "93001": { title: "اعتبار هزینه تخصیصیافته", nature: "debit" },
  "93002": { title: "اعتبار سرمایهای تخصیصیافته", nature: "debit" },
  "93501": { title: "کسری ابواب جمعی بابت اعتبار هزینه", nature: "debit" },
  "93502": { title: "کسری ابواب جمعی بابت اعتبار سرمایه ای", nature: "debit" },
  "93503": { title: "کسری ابواب جمعی بابت اعتبار هزینه انتقالی", nature: "debit" },
  "93504": { title: "کسری ابواب جمعی بابت اعتبار سرمایه انتقالی", nature: "debit" },
  "94001": { title: "حواله اعتبار هزینه", nature: "debit" },
  "94002": { title: "حواله اعتبار سرمایهای", nature: "debit" },
  "94003": { title: "حواله اعتبار هزینه انتقالی", nature: "debit" },
  "94004": { title: "حواله اعتبار سرمایهای انتقالی", nature: "debit" },
  "95001": { title: "اعتبار هزینه ابلاغی", nature: "debit" },
  "95002": { title: "اعتبار سرمایهای ابلاغی", nature: "debit" },
  "95003": { title: "اعتبار هزینه انتقالی ابلاغی", nature: "debit" },
  "95004": { title: "اعتبار سرمایهای انتقالی ابلاغی", nature: "debit" },
  "96001": { title: "کنترل اعتبار هزینه", nature: "credit" },
  "96002": { title: "کنترل اعتبار سرمایهای", nature: "credit" },
  "97001": { title: "اعتبار هزینه تامینشده", nature: "debit" },
  "97002": { title: "اعتبار سرمایهای تامینشده", nature: "debit" },
  "97003": { title: "اعتبار هزینه انتقالی تامینشده", nature: "debit" },
  "97004": { title: "اعتبار سرمایهای انتقالی تامینشده", nature: "debit" },
  "98001": { title: "اعتبار هزینه بابت پرداخت های غیر قطعی", nature: "debit" },
  "98002": { title: "اعتبار سرمایه بابت پرداخت های غیر قطعی", nature: "debit" },
  "98003": { title: "اعتبار هزینه انتقالی بابت پرداخت های غیر قطعی", nature: "debit" },
  "98004": { title: "اعتبار سرمایه انتقالی بابت پرداخت های غیر قطعی", nature: "debit" },
  "99001": { title: "اعتبار هزینه مصرف شده", nature: "debit" },
  "99002": { title: "اعتبار سرمایه مصرف شده", nature: "debit" },
  "99003": { title: "اعتبار هزینه انتقالی مصرف شده", nature: "debit" },
  "99004": { title: "اعتبار سرمایه انتقالی مصرف شده", nature: "debit" },

  // گروه 11 — بانک، صندوق و دریافتنیها
  "11001": { title: "بانک پرداخت هزینه", nature: "debit" },
  "11002": { title: "بانک پرداخت سرمایه ای", nature: "debit" },
  "11003": { title: "بانک پرداخت اختصاصی", nature: "debit" },
  "11004": { title: "بانک وجوه سایر منابع", nature: "debit" },
  "11005": { title: "بانک دریافت وجوه سپرده", nature: "debit" },
  "11006": { title: "بانک رد وجوه سپرده", nature: "debit" },
  "11007": { title: "بانک دریافت", nature: "debit" },
  "11009": { title: "بانک رد وجوه اضافه دریافتی", nature: "debit" },
  "11010": { title: "بانک مالیات و عوارض ارزش افزوده", nature: "debit" },
  "11011": { title: "بانک وجوه کارشناسی ثبت", nature: "debit" },
  "11012": { title: "بانک وجوه خدمات ثبت", nature: "debit" },
  "11013": { title: "بانکوجوه (اموال سرقتی و اختلاسی)", nature: "debit" },
  "11014": { title: "بانک دریافت فروش اراضی", nature: "debit" },
  "11015": { title: "بانک پرداخت فروش اراضی", nature: "debit" },
  "11016": { title: "بانک دریافت درآمدهای خانه های سازمانی", nature: "debit" },
  "11017": { title: "بانک پرداخت خانه های سازمانی", nature: "debit" },
  "11018": { title: "بانک پرداخت وجوه یارانه", nature: "debit" },
  "11019": { title: "بانک ارزی", nature: "debit" },
  "11020": { title: "کارت هدیه", nature: "debit" },
  "11021": { title: "تنخواهگردان پرداخت بابت عملیات جاری", nature: "debit" },
  "11022": { title: "تنخواهگردان پرداخت بابت عملیات سرمایهای", nature: "debit" },
  "11024": { title: "صندوق", nature: "debit" },
  "11025": { title: "بانک دریافت اجاره املاک و اراضی", nature: "debit" },
  "11026": { title: "حواله ارزی", nature: "debit" },

  "11501": { title: "حسابها و اسناد دریافتنی", nature: "debit" },
  "11502": { title: "دریافتنی ارزی", nature: "debit" },
  "11503": { title: "مطالبات از سایر واحدها", nature: "debit" },
  "11504": { title: "ذخیره مطالبات مشکوکالوصول", nature: "credit" },
  "11505": { title: "حسابها و اسناد دریافتنی- اسناد واخواهی هزینه", nature: "debit" },
  "11506": { title: "حسابها و اسناد دریافتنی-اسناد واخواهی سرمایهای", nature: "debit" },
  "11507": { title: "حسابها و اسناد دریافتنی-کسری ابوابجمعی هزینه", nature: "debit" },
  "11508": { title: "حسابها و اسناد دریافتنی- کسری ابوابجمعی سرمایهای", nature: "debit" },
  "11509": { title: "حسابها و اسناد دریافتنی بن غیرنقدی", nature: "debit" },
  "11510": { title: "ودایع", nature: "debit" },
  "11511": { title: "حسابها و اسناد دریافتنی- حواله قیر", nature: "debit" },
  "11513": { title: "دریافتنی بابت تنخواه رد وجوه سپرده", nature: "credit" },
  "11517": { title: "دریافتنی بابت رد وجوه اضافه دریافتی", nature: "credit" },
  "11519": { title: "مالیات و عوارض ارزش افزوده خرید کالا", nature: "debit" },
  "11520": { title: "سایر حسابها و اسناد دریافتنی", nature: "debit" },
  "11521": { title: "حسابها و اسناد دریافتنی- سهمیه وکیوم باتوم", nature: "debit" },
  "11522": { title: "مطالبات از خزانه", nature: "debit" },

  // گروه 12 — سرمایهگذاری
  "12001": { title: "حسابها و اسناد دریافتنی", nature: "debit" },
  "12002": { title: "حسابها و اسناد دریافتنی ارزی", nature: "debit" },
  "12003": { title: "مطالبات از سایر واحدها", nature: "debit" },
  "12004": { title: "ذخیره مطالبات مشکوک الوصول", nature: "credit" },
  "12501": { title: "سرمایهگذاری در شرکتها", nature: "debit" },
  "12502": { title: "سایر سرمایهگذاریها", nature: "debit" },
  "12503": { title: "درآمد دورههای آتی", nature: "credit" },

  // گروه 13 — موجودیها
  "13001": { title: "موجودی ملزومات", nature: "debit" },
  "13002": { title: "موجودی مواد", nature: "debit" },
  "13003": { title: "موجودی کالا", nature: "debit" },
  "13004": { title: "سایر موجودیها", nature: "debit" },
  "13005": { title: "ذخیره کاهش ارزش موجودیها", nature: "credit" },
  "13006": { title: "موجودیهای امانی نزد سایر اشخاص - موجودی ملزومات", nature: "debit" },
  "13007": { title: "موجودی امانی نزد سایر اشخاص - موجودی مواد", nature: "debit" },
  "13008": { title: "موجودیهای امانی نزد سایر اشخاص - موجودی کالا", nature: "debit" },
  "13009": { title: "موجودی امانی نزد سایر اشخاص - سایر موجودیها", nature: "debit" },
  "13010": { title: "سایر موجودیها - اوراق بهادار", nature: "debit" },
  "13011": { title: "سایر موجودیها - تنخواه گردان اوراق بهادار", nature: "debit" },

  // گروه 14 — پیشپرداخت و داراییهای نگهداریشده
  "14001": { title: "پیشپرداخت بابت عملیات جاری", nature: "debit" },
  "14523": { title: "داراییهای نگهداریشده برای فروش", nature: "debit" },
  "14551": { title: "ذخیره کاهش ارزش داراییها", nature: "credit" },

  // گروه 15 — داراییهای ثابت مشهود
  "15001": { title: "دارایی در جریان تکمیل", nature: "debit" },
  "15002": { title: "اثاثه و منصوبات", nature: "debit" },
  "15003": { title: "وسایل نقلیه زمینی و زیرزمینی", nature: "debit" },
  "15004": { title: "ماشین آلات و تجهیزات", nature: "debit" },
  "15005": { title: "ساختمان و مستحدثات", nature: "debit" },
  "15006": { title: "زمین", nature: "debit" },
  "15007": { title: "اقلام گرانبها", nature: "debit" },
  "15008": { title: "داراییهای زیستی مولد", nature: "debit" },
  "15009": { title: "وسایل و ادوات دریایی", nature: "debit" },
  "15010": { title: "وسایل و ادوات هوایی", nature: "debit" },
  "15011": { title: "راهها", nature: "debit" },
  "15012": { title: "تاسیسات", nature: "debit" },
  "15013": { title: "شبکههای توزیع و انتقال", nature: "debit" },
  "15014": { title: "سدها", nature: "debit" },
  "15015": { title: "میراث ملی", nature: "debit" },
  "15016": { title: "سایر داراییهای ثابت مشهود", nature: "debit" },
  "15020": { title: "دارایی اجارهای", nature: "debit" },
  "15022": { title: "داراییهای امانی نزد سایر اشخاص - اثاثه و منصوبات", nature: "debit" },
  "15023": { title: "داراییهای امانی نزد سایر اشخاص - وسایل نقلیه زمینی و زیرزمینی", nature: "debit" },
  "15024": { title: "داراییهای امانی نزد سایر اشخاص - ماشین آلات و تجهیزات", nature: "debit" },
  "15025": { title: "داراییهای امانی نزد سایر اشخاص - ساختمان و مستحدثات", nature: "debit" },
  "15026": { title: "داراییهای امانی نزد سایر اشخاص - زمین", nature: "debit" },
  "15027": { title: "داراییهای امانی نزد سایر اشخاص - اقلام گرانبها", nature: "debit" },
  "15028": { title: "داراییهای امانی نزد سایر اشخاص - داراییهای زیستی مولد", nature: "debit" },
  "15029": { title: "داراییهای امانی نزد سایر اشخاص - وسایل و ادوات دریایی", nature: "debit" },
  "15030": { title: "داراییهای امانی نزد سایر اشخاص - وسایل و ادوات هوایی", nature: "debit" },
  "15032": { title: "داراییهای امانی نزد سایر اشخاص - تاسیسات", nature: "debit" },
  "15036": { title: "داراییهای امانی نزد سایر اشخاص - سایر داراییهای ثابت", nature: "debit" },
  "15040": { title: "استهلاک انباشته", nature: "credit" },
  "15045": { title: "استهلاک انباشته دارایی اجارهای", nature: "credit" },
  "15050": { title: "ذخیره کاهش ارزش داراییها", nature: "credit" },
  "15060": { title: "پیش پرداخت بابت عملیات سرمایهای", nature: "debit" },
  "15070": { title: "پیش پرداخت اعتبار اسنادی", nature: "debit" },
  "15080": { title: "پیش پرداخت مواد و کالا", nature: "debit" },
  "15090": { title: "پیش پرداخت داراییهای استیجاری", nature: "debit" },

  // گروه 16 — داراییهای نامشهود
  "16001": { title: "نرم افزار رایانهای", nature: "debit" },
  "16002": { title: "سرقفلی", nature: "debit" },
  "16003": { title: "بانکهای اطلاعاتی", nature: "debit" },
  "16004": { title: "حق تالیف و اختراع", nature: "debit" },
  "16005": { title: "حق امتیاز و فرانشیز", nature: "debit" },
  "16006": { title: "داراییهای نامشهود در جریان تکمیل", nature: "debit" },
  "16007": { title: "سایر داراییهای نامشهود", nature: "debit" },
  "16040": { title: "استهلاک انباشته", nature: "credit" },
  "16050": { title: "ذخیره کاهش ارزش داراییها", nature: "credit" },
  "16060": { title: "پیشپرداخت بابت عملیات سرمایهای داراییهای نامشهود", nature: "debit" },

  // گروه 17 و 18 — سرمایهگذاری و مطالبات بلندمدت
  "17001": { title: "سرمایهگذاری در شرکتها", nature: "debit" },
  "17002": { title: "سایر سرمایهگذاریها", nature: "debit" },
  "17003": { title: "درآمد دورههای آتی", nature: "credit" },
  "17004": { title: "ذخیره کاهش ارزش سرمایهگذاریها", nature: "credit" },
  "18001": { title: "مطالبات بلندمدت دولت", nature: "debit" },
  "18002": { title: "تسهیلات مالی دریافتی بلندمدت", nature: "debit" },
  "18003": { title: "تسهیلات مالی دریافتی ارزی بلندمدت", nature: "debit" },

  // گروه 21 تا 27 — بدهیها و ذخایر
  "21001": { title: "حسابها و اسناد پرداختنی", nature: "credit" },
  "21002": { title: "حسابها و اسناد پرداختنی ارزی", nature: "credit" },
  "21003": { title: "حسابها و اسناد پرداختنی-اعتبار اسنادی", nature: "credit" },
  "21004": { title: "هزینه مالی آتی", nature: "debit" },
  "21005": { title: "حقوق و مزایای پرداختنی", nature: "credit" },
  "21006": { title: "بدهی به سایر واحدها", nature: "credit" },
  "21007": { title: "سپردههای پرداختنی", nature: "credit" },
  "21008": { title: "سپردههای پرداختنی ارزی", nature: "credit" },
  "21009": { title: "سود تضمین شده پرداختنی", nature: "credit" },
  "21010": { title: "مالیات و عوارض ارزش افزوده فروش کالا و خدمات", nature: "credit" },
  "21011": { title: "اسناد خزانه پرداختنی", nature: "credit" },
  "22001": { title: "حسابها و اسناد پرداختنی", nature: "credit" },
  "22002": { title: "بدهی به سایر واحدها", nature: "credit" },
  "23001": { title: "پیش دریافت اعتبار هزینه", nature: "credit" },
  "23002": { title: "پیش دریافت اعتبار سرمایهای", nature: "credit" },
  "23003": { title: "پیش دریافت درآمد", nature: "credit" },
  "24001": { title: "بیمه پرداختنی", nature: "credit" },
  "24002": { title: "حق بازنشستگی پرداختنی", nature: "credit" },
  "24003": { title: "سایر کسور پرداختنی", nature: "credit" },
  "24004": { title: "مالیات پرداختنی", nature: "credit" },
  "24005": { title: "ذخیره احکام صادره از مراجع ذیصلاح", nature: "credit" },
  "24006": { title: "ذخیره تعهدات هزینهای", nature: "credit" },
  "24007": { title: "ذخیره تعهدات سرمایهای", nature: "credit" },
  "24008": { title: "سایر حسابها و اسناد پرداختنی", nature: "credit" },
  "24009": { title: "بدهی بابت وجوه نامشخص", nature: "credit" },
  "24010": { title: "بدهی بابت چکهای بینراهی", nature: "credit" },
  "24011": { title: "بدهی به اشخاص بابت وجوه اضافه دریافتی", nature: "credit" },
  "24012": { title: "بدهی بابت اوراق بهادار", nature: "credit" },
  "24013": { title: "بدهی بابت وجه الضمان", nature: "credit" },
  "25001": { title: "اوراق مشارکت پرداختنی", nature: "credit" },
  "25002": { title: "تسهیلات مالی دریافتی بلندمدت", nature: "credit" },
  "25003": { title: "تسهیلات مالی پرداختنی ارزی بلندمدت", nature: "credit" },
  "25006": { title: "اوراق مرابحه پرداختنی", nature: "credit" },
  "25007": { title: "سایر حسابها و اسناد پرداختنی بلندمدت", nature: "credit" },
  "26001": { title: "ذخیره مزایای پایان خدمت کارکنان", nature: "credit" },
  "27001": { title: "ذخیره مرخصی استفاده نشده کارکنان", nature: "credit" },
  "27002": { title: "سایر ذخایر", nature: "credit" },

  // گروه 31 تا 33 — ارزش خالص و تعدیلات
  "31001": { title: "ارزش خالص انباشته", nature: "credit" },
  "31004": { title: "داراییهای انتقالی", nature: "credit" },
  "31005": { title: "داراییهای دریافتی", nature: "credit" },
  "31006": { title: "تعدیلات سنواتی", nature: "credit" },
  "31007": { title: "خالص تغییر در وضعیت مالی", nature: "credit" },
  "31010": { title: "انتقال از سایر اقلام ارزش خالص", nature: "credit" },
  "32001": { title: "مازاد تجدید ارزیابی", nature: "credit" },
  "33001": { title: "تفاوت تسعیر داراییها و بدهیهای ارزی", nature: "credit" },
  "33002": { title: "تفاوت تسعیر ارز عملیات خارجی", nature: "credit" },

  // گروه 41 تا 46 — درآمدها و دریافتیها
  "41001": { title: "دریافتی بابت عملیات جاری", nature: "credit" },
  "41002": { title: "دریافتی بابت عملیات جاری در دوره متمم", nature: "credit" },
  "41003": { title: "دریافتی بابت عملیات سرمایهای", nature: "credit" },
  "41004": { title: "دریافتی بابت عملیات سرمایهای در دوره متمم", nature: "credit" },
  "41005": { title: "دریافتی از خزانه بابت حقوق و مزایا", nature: "credit" },
  "41006": { title: "دریافتی بابت وجوه یارانه", nature: "credit" },
  "41007": { title: "دریافتی بابت عملیات جاری از محل اعتبار سال قبل", nature: "credit" },
  "41008": { title: "دریافتی بابت عملیات سرمایهای از محل اعتبار سال قبل", nature: "credit" },
  "41009": { title: "قیر دریافتی بابت عملیات سرمایهای", nature: "credit" },
  "41010": { title: "دریافتی از محل سایر منابع", nature: "credit" },
  "41011": { title: "قیر دریافتی از محل سایر منابع", nature: "credit" },
  "43001": { title: "هدایا و کمکها", nature: "credit" },
  "45001": { title: "درآمدهای مالیاتی", nature: "credit" },
  "45002": { title: "درآمدهای ناشی از کمکهای اجتماعی", nature: "credit" },
  "45003": { title: "درآمدهای حاصل از مالکیت", nature: "credit" },
  "45004": { title: "درآمدهای حاصل از فروش کالا و خدمات", nature: "credit" },
  "45005": { title: "درآمدهای حاصل از جرایم و خسارات", nature: "credit" },
  "45006": { title: "سایر درآمدهای واحد", nature: "credit" },
  "45007": { title: "تخفیفات و بخشودگی", nature: "credit" },
  "46001": { title: "درآمدها - انتقالات", nature: "credit" },

  // گروه 51 — درآمدهای دولت
  "51001": { title: "درآمدهای مالیاتی", nature: "credit" },
  "51002": { title: "درآمدهای حاصل از مالکیت دولت", nature: "credit" },
  "51003": { title: "درآمدهای حاصل از فروش کالا و خدمات", nature: "credit" },
  "51004": { title: "درآمدهای حاصل از جرایم و خسارات", nature: "credit" },
  "51005": { title: "سایر درآمدهای دولت", nature: "credit" },
  "51006": { title: "تخفیفات و بخشودگی", nature: "debit" },
  "51007": { title: "درآمدهای ناشی از کمک های اجتماعی", nature: "credit" },

  // گروه 61 تا 63 — هزینهها
  "61001": { title: "هزینه جبران خدمت کارکنان", nature: "debit" },
  "61002": { title: "هزینه استفاده از کالا و خدمات", nature: "debit" },
  "61003": { title: "هزینه مصرف دارایی های ثابت", nature: "debit" },
  "61004": { title: "هزینه سود", nature: "debit" },
  "61005": { title: "یارانه", nature: "debit" },
  "61006": { title: "هزینه های کمک های بلاعوض", nature: "debit" },
  "61007": { title: "هزینههای اجتماعی", nature: "debit" },
  "61008": { title: "سایر هزینهها", nature: "debit" },
  "62001": { title: "هزینه ها - انتقالات", nature: "debit" },
  "63001": { title: "انتقال به خزانه", nature: "debit" },

  // گروه 71 — وجوه ارسالی
  "71001": { title: "وجوه ارسالی به خزانه بابت درآمد عمومی", nature: "debit" },

  // حسابهای انتظامی
  "81007": { title: "حساب انتظامی - کسری ابوابجمعی برداشتی", nature: "debit" },
  "82007": { title: "طرف حساب انتظامی - کسری ابوابجمعی برداشتی", nature: "credit" },
  "81008": { title: "حساب انتظامی - منابع پیشبینی شده", nature: "debit" },
  "82008": { title: "طرف حساب انتظامی - منابع پیشبینی شده", nature: "credit" },
  "81010": { title: "حساب انتظامی - اسناد خزانه اسلامی", nature: "debit" },
  "82010": { title: "طرف حساب انتظامی - اسناد خزانه اسلامی", nature: "credit" },
  "81011": { title: "حساب انتظامی - موجودیهای امانی", nature: "debit" },
  "82011": { title: "طرف حساب انتظامی - موجودیهای امانی", nature: "credit" },
  "81012": { title: "حساب انتظامی - داراییهای امانی", nature: "debit" },
  "82012": { title: "طرف حساب انتظامی - داراییهای امانی", nature: "credit" },
  "81013": { title: "حساب انتظامی - کنترل منابع بودجهای", nature: "debit" },
  "82013": { title: "طرف حساب انتظامی - کنترل منابع بودجهای", nature: "credit" },
  "81014": { title: "حساب انتظامی - اوراق مرابحه", nature: "debit" },
  "82014": { title: "طرف حساب انتظامی - اوراق مرابحه", nature: "credit" },
  "81015": { title: "حساب انتظامی - اوراق مشارکت", nature: "debit" },
  "82015": { title: "طرف حساب انتظامی - اوراق مشارکت", nature: "credit" },
  "81016": { title: "حساب انتظامی - کنترل سفارشها", nature: "debit" },
  "82016": { title: "طرف حساب انتظامی - کنترل سفارشها", nature: "credit" },
  "81017": { title: "حساب انتظامی - کنترل دریافتیها بابت اعتبار", nature: "debit" },
  "82017": { title: "طرف حساب انتظامی - کنترل دریافتیها بابت اعتبار", nature: "credit" },
  "81018": { title: "حساب انتظامی - بدهیهای احتمالی", nature: "debit" },
  "82018": { title: "طرف حساب انتظامی - بدهیهای احتمالی", nature: "credit" },
  "81019": { title: "حساب انتظامی - اسناد تسویه خزانه", nature: "debit" },
  "82019": { title: "طرف حساب انتظامی - اسناد تسویه خزانه", nature: "credit" }
};

const backendPath = path.resolve('c:/Users/Alireza/Downloads/public-finance-system-updated/public-finance-system/backend/src/data/sanamaCodes.json');
const frontendPath = path.resolve('c:/Users/Alireza/Downloads/public-finance-system-updated/public-finance-system/frontend/src/data/sanamaCodes.json');

function auditAndFix(filePath) {
  console.log(`\n=== AUDITING FILE: ${filePath} ===`);
  const rawData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  const appCodesMap = new Map();
  let totalAppCodes = 0;

  function scan(node) {
    if (node.code && node.nature !== undefined) {
      appCodesMap.set(String(node.code).trim(), node);
      totalAppCodes++;
    }
    if (Array.isArray(node.groups)) node.groups.forEach(scan);
    if (Array.isArray(node.accounts)) node.accounts.forEach(scan);
    if (Array.isArray(node.children)) node.children.forEach(scan);
  }

  scan(rawData);

  let matchCount = 0;
  let mismatchCount = 0;
  let notInReferenceCount = 0;
  let missingFromAppCount = 0;

  const changesList = [];
  const notInRefList = [];
  const missingFromAppList = [];

  for (const [code, node] of appCodesMap.entries()) {
    const ref = REFERENCE_MAP[code];
    if (!ref) {
      notInReferenceCount++;
      notInRefList.push({ code, title: node.title, nature: node.nature });
    } else {
      const currentNature = node.nature;
      const correctNature = ref.nature;

      if (currentNature === correctNature) {
        matchCount++;
      } else {
        mismatchCount++;
        changesList.push({
          code,
          title: node.title,
          oldNature: currentNature === 'debit' ? 'بدهکار' : currentNature === 'credit' ? 'بستانکار' : currentNature,
          correctNature: correctNature === 'debit' ? 'بدهکار' : 'بستانکار',
          file: path.basename(filePath)
        });
        node.nature = correctNature;
      }
    }
  }

  for (const [refCode, refObj] of Object.entries(REFERENCE_MAP)) {
    if (!appCodesMap.has(refCode)) {
      missingFromAppCount++;
      missingFromAppList.push({ code: refCode, title: refObj.title, nature: refObj.nature === 'debit' ? 'بدهکار' : 'بستانکار' });
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(rawData, null, 2), 'utf8');

  console.log(`Results for ${path.basename(filePath)}:`);
  console.log(`Total Ref Codes: ${Object.keys(REFERENCE_MAP).length}`);
  console.log(`Total App Codes: ${totalAppCodes}`);
  console.log(`MATCH: ${matchCount}`);
  console.log(`MISMATCH (Fixed): ${mismatchCount}`);
  console.log(`NOT_IN_REFERENCE: ${notInReferenceCount}`);
  console.log(`MISSING_FROM_APPLICATION: ${missingFromAppCount}`);

  return {
    filePath,
    totalRef: Object.keys(REFERENCE_MAP).length,
    totalApp: totalAppCodes,
    matchCount,
    mismatchCount,
    notInReferenceCount,
    missingFromAppCount,
    changesList,
    notInRefList,
    missingFromAppList
  };
}

const backendRes = auditAndFix(backendPath);
const frontendRes = auditAndFix(frontendPath);

fs.writeFileSync('c:/Users/Alireza/Downloads/public-finance-system-updated/public-finance-system/audit_results.json', JSON.stringify({ backendRes, frontendRes }, null, 2), 'utf8');
console.log('\nAudit completed. Results saved to audit_results.json');
