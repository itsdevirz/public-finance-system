// ─── budgetMoeinMapper.js ──────────────────────────────────────────────────
// نگاشت و ارتباط هوشمند بین کدهای طبقه‌بندی بودجه (برنامه، فعالیت، فصل، ماده)
// با کدهای سرفصل معین بودجه‌ای (نظام حسابداری بخش عمومی / سناما)

export const BUDGET_CHAPTERS = [
  { code: "01", title: "فصل ۰۱ — جبران خدمات کارکنان", defaultMoeinPrefix: "211" },
  { code: "02", title: "فصل ۰۲ — استفاده از کالاها و خدمات", defaultMoeinPrefix: "212" },
  { code: "03", title: "فصل ۰۳ — مصارف سرمایه‌ای / دارایی‌های ثابت", defaultMoeinPrefix: "213" },
  { code: "04", title: "فصل ۰۴ — یارانه و کمک‌های بلاعوض", defaultMoeinPrefix: "214" },
  { code: "05", title: "فصل ۰۵ — رفاه اجتماعی", defaultMoeinPrefix: "215" },
  { code: "06", title: "فصل ۰۶ — سایر هزینه‌ها", defaultMoeinPrefix: "216" },
  { code: "07", title: "فصل ۰۷ — تملک دارایی‌های سرمایه‌ای", defaultMoeinPrefix: "110" },
];

export const BUDGET_ARTICLES = [
  { code: "01", title: "ماده ۰۱ — حقوق و مزایای مستمر" },
  { code: "02", title: "ماده ۰۲ — فوق‌العاده‌ها و مزایای شغلی" },
  { code: "03", title: "ماده ۰۳ — پاداش و عیدی کارکنان" },
  { code: "04", title: "ماده ۰۴ — حق بیمه و سهم صندوق بازنشستگی" },
  { code: "05", title: "ماده ۰۵ — سایر هزینه‌های پرسنلی / اداری" },
  { code: "06", title: "ماده ۰۶ — ملزومات، سوخت و مواد مصرفی" },
  { code: "07", title: "ماده ۰۷ — ماموریت، مسافرت و حمل‌ونقل" },
];

export const BUDGETARY_MOEIN_LIST = [
  { code: "211001", chapter: "01", article: "01", title: "۲۱۱۰01 — حقوق و دستمزد مستمر کارکنان", chapterTitle: "فصل ۰۱ — جبران خدمات", articleTitle: "ماده ۰۱ — حقوق و مزایا" },
  { code: "211002", chapter: "01", article: "02", title: "۲۱۱۰02 — فوق‌العاده شغل و سختی کار", chapterTitle: "فصل ۰۱ — جبران خدمات", articleTitle: "ماده ۰۲ — فوق‌العاده‌ها" },
  { code: "211003", chapter: "01", article: "03", title: "۲۱۱۰03 — پاداش پایان سال و مزایای رفاهی", chapterTitle: "فصل ۰۱ — جبران خدمات", articleTitle: "ماده ۰۳ — پاداش" },
  { code: "211004", chapter: "01", article: "04", title: "۲۱۱۰04 — حق بیمه سهم کارفرما و بازنشستگی", chapterTitle: "فصل ۰۱ — جبران خدمات", articleTitle: "ماده ۰۴ — بیمه" },
  { code: "211005", chapter: "01", article: "05", title: "۲۱۱۰05 — سایر پرداخت‌های پرسنلی و پرسنل قراردادی", chapterTitle: "فصل ۰۱ — جبران خدمات", articleTitle: "ماده ۰۵ — سایر" },

  { code: "212001", chapter: "02", article: "01", title: "۲۱۲۰۰۱ — هزینه آب، برق، گاز و ارتباطات", chapterTitle: "فصل ۰۲ — کالا و خدمات", articleTitle: "ماده ۰۱ — خدمات عمومی" },
  { code: "212002", chapter: "02", article: "02", title: "۲۱۲۰۰۲ — اجاره ساختمان، ماشین‌آلات و تجهیزات", chapterTitle: "فصل ۰۲ — کالا و خدمات", articleTitle: "ماده ۰۲ — اجاره" },
  { code: "212005", chapter: "02", article: "05", title: "۲۱۲۰۰۵ — سایر هزینه‌های خدماتی و اداری", chapterTitle: "فصل ۰۲ — کالا و خدمات", articleTitle: "ماده ۰۵ — سایر خدمات" },
  { code: "212006", chapter: "02", article: "06", title: "۲۱۲۰۰۶ — ملزومات، سوخت و قطعات یدکی مصرفی", chapterTitle: "فصل ۰۲ — کالا و خدمات", articleTitle: "ماده ۰۶ — ملزومات" },
  { code: "212007", chapter: "02", article: "07", title: "۲۱۲۰۰۷ — هزینه ماموریت روزانه و فوق‌العاده سفر", chapterTitle: "فصل ۰۲ — کالا و خدمات", articleTitle: "ماده ۰۷ — ماموریت" },

  { code: "110100", chapter: "03", article: "01", title: "۱۱۰۱۰۰ — احداث، خرید و تکمیل ساختمان و مستحدثات", chapterTitle: "فصل ۰۳ / ۰۷ — سرمایه‌ای", articleTitle: "ماده ۰۱ — ساختمان" },
  { code: "110200", chapter: "03", article: "02", title: "۱۱۰۲۰0 — خرید ماشین‌آلات، تجهیزات و ابزارآلات", chapterTitle: "فصل ۰۳ / ۰۷ — سرمایه‌ای", articleTitle: "ماده ۰۲ — ماشین‌آلات" },
  { code: "110300", chapter: "03", article: "05", title: "۱۱۰۳۰۰ — خرید سایر دارایی‌های ثابت و نرم‌افزار", chapterTitle: "فصل ۰۳ / ۰۷ — سرمایه‌ای", articleTitle: "ماده ۰۵ — سایر دارایی‌ها" },

  { code: "214001", chapter: "04", article: "05", title: "۲۱۴۰۰۱ — یارانه و کمک‌های بلاعوض بودجه‌ای", chapterTitle: "فصل ۰۴ — یارانه", articleTitle: "ماده ۰۵ — یارانه" },
  { code: "215001", chapter: "05", article: "05", title: "۲۱۵۰۰۱ — کمک‌های رفاهی و درمان مستقیم کارکنان", chapterTitle: "فصل ۰۵ — رفاه اجتماعی", articleTitle: "ماده ۰۵ — رفاه" },
  { code: "216001", chapter: "06", article: "05", title: "۲۱۶۰۰۱ — دیون، خریدهای سنواتی و سایر هزینه‌ها", chapterTitle: "فصل ۰۶ — سایر هزینه‌ها", articleTitle: "ماده ۰۵ — سایر" },
];

/**
 * دریافت مشخصات معین بر اساس کد معین بودجه‌ای
 */
export function getMoeinByCode(moeinCode) {
  if (!moeinCode) return null;
  const cleanCode = String(moeinCode).trim();
  const found = BUDGETARY_MOEIN_LIST.find((m) => m.code === cleanCode);
  if (found) return found;

  // اگر پیدا نشد، بر اساس ۲ تا ۳ رقم اول فصل و ماده حدس می‌زنیم
  const ch = cleanCode.substring(2, 4) || "01";
  const art = cleanCode.substring(4, 6) || "05";
  return {
    code: cleanCode,
    chapter: ch,
    article: art,
    title: `${cleanCode} — معین بودجه‌ای مرتبط`,
    chapterTitle: `فصل ${ch}`,
    articleTitle: `ماده ${art}`
  };
}

/**
 * محاسبه خودکار کد و عنوان معین بر اساس فصل و ماده و برنامه
 */
export function deriveMoeinFromChapterAndArticle(chapterCode, articleCode, programCode = "10") {
  const chStr = String(chapterCode || "01").padStart(2, "0");
  const artStr = String(articleCode || "05").padStart(2, "0");

  const exactMatch = BUDGETARY_MOEIN_LIST.find((m) => m.chapter === chStr && m.article === artStr);
  if (exactMatch) return exactMatch;

  // فرمول استاندارد تولید کد معین
  let prefix = "211";
  if (chStr === "02") prefix = "212";
  else if (chStr === "03" || chStr === "07") prefix = "110";
  else if (chStr === "04") prefix = "214";
  else if (chStr === "05") prefix = "215";
  else if (chStr === "06") prefix = "216";

  const generatedCode = `${prefix}0${artStr}`;
  return {
    code: generatedCode,
    chapter: chStr,
    article: artStr,
    title: `${generatedCode} — معین مرتبط با فصل ${chStr} و ماده ${artStr}`,
    chapterTitle: `فصل ${chStr}`,
    articleTitle: `ماده ${artStr}`
  };
}

/**
 * دریافت فصل و ماده بر اساس انتخاب کد معین
 */
export function deriveBudgetCodesFromMoein(moeinCode) {
  const item = getMoeinByCode(moeinCode);
  if (!item) return { chapter_code: "01", article_code: "05" };
  return {
    chapter_code: item.chapter,
    article_code: item.article,
    moein_code: item.code,
    moein_title: item.title
  };
}
