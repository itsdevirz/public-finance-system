/**
 * سامانه نظارت آنی خزانه‌داری کل کشور (سناما)
 * ماژول کنترل‌های هوشمند فرم عملکرد و فرم منابع (کدهای ۸۰۰-۸۹۹)
 *
 * راهنما:
 * - مصوب = استانی
 * - ابلاغی = کشوری / متمرکز / ملی
 */

export const SANAMA_PERFORMANCE_RULES = [
  { code: 11, title: 'محل اعتبار و محل وصول', desc: 'چنانچه محل اعتبار "استانی" انتخاب شود، محل وصول نمی‌تواند "متمرکز" باشد.' },
  { code: 12, title: 'تعیین نوع اعتبار', desc: '"نوع اعتبار" تعیین نگردیده است.' },
  { code: 131, title: 'شماره برنامه/ردیف', desc: 'شماره برنامه / ردیف (متفرقه / تملک دارایی‌های مالی) تعیین نگردیده است.' },
  { code: 14, title: 'ردیف بودجه‌ای ابلاغ دهنده', desc: 'ردیف بودجه‌ای ابلاغ دهنده تعیین نگردیده است.' },
  { code: 15, title: 'تطابق اعتبار نهایی فرم ۱ با ۴ و ۶', desc: 'مبلغ فیلد "بودجه اعتبار نهایی" در فرم ۱ بایستی حسب مورد با مبلغ فیلد "بودجه اعتبار نهایی" در فرم‌های ۴ و ۶ برابر باشد.' },
  { code: 16, title: 'ردیف بودجه دستگاه و ابلاغ دهنده', desc: 'ردیف بودجه‌ای دستگاه اجرایی نمی‌تواند با ردیف بودجه‌ای ابلاغ دهنده یکسان باشد.' },
  { code: 17, title: 'تکمیل فیلدهای فرم', desc: 'فیلدهای این فرم تکمیل نگردیده است.' },
  { code: 19, title: 'عدم منفی بودن مقادیر', desc: 'مقادیر مندرج در فیلدها نبایستی منفی باشد.' },
  { code: 20, title: 'عدم تکرار شماره برنامه', desc: 'شماره برنامه نمی‌تواند تکراری انتخاب شود.' },
  { code: 21, title: 'عدم تکرار ردیف متفرقه', desc: 'شماره ردیف متفرقه نمی‌تواند تکراری انتخاب شود.' },
  { code: 22, title: 'عدم تکرار ردیف تملک دارایی مالی', desc: 'شماره ردیف تملک دارایی‌های مالی نمی‌تواند تکراری انتخاب شود.' },
  { code: 23, title: 'برابری اعتبار نهایی و تخصیص در ابلاغی', desc: 'در صورتی که نوع اعتبار "ابلاغی" تعیین شود، مبالغ فیلدهای "بودجه اعتبار نهایی" و "اعتبار تخصیص یافته" بایستی برابر باشد.' },
  { code: 24, title: 'سقف اعتبار تخصیص یافته', desc: 'مبلغ "اعتبار تخصیص یافته" باید کوچک‌تر یا مساوی مبلغ "بودجه اعتبار نهایی" باشد.' },
  { code: 25, title: 'کف اعتبار تخصیص یافته نسبت به دریافتی', desc: 'مبلغ "اعتبار تخصیص یافته" باید بزرگ‌تر یا مساوی مبلغ "دریافتی از محل اعتبارات تخصیص یافته" باشد.' },
  { code: 26, title: 'برابری تخصیص و دریافتی در ابلاغی', desc: 'در صورتی که نوع اعتبار "ابلاغی" تعیین شود، مبالغ فیلدهای "اعتبار تخصیص یافته" و "دریافتی از محل اعتبارات تخصیص یافته" بایستی برابر باشد.' },
  { code: 27, title: 'تطابق دریافتی با مصارف و اوراق', desc: 'مبلغ فیلد "دریافتی از محل اعتبارات تخصیص یافته" بایستی با مجموع مبالغ فیلدهای "اعتبار مصرف شده"، "پرداخت‌های غیرقطعی"، ..... و "اوراق انتقالی" برابر باشد.' },
  { code: 28, title: 'محاسبه بودجه اعتبار نهایی فرم ۱ و ۲', desc: 'در فرم‌های ۱ و ۲ مبلغ "بودجه اعتبار نهایی" بایستی با مبالغ فیلدهای "بودجه اعتبار اولیه" + "تغییرات ناشی از استنادات قانونی" + "افزایش" - "کاهش" - "حواله‌ها" برابر باشد.' },
  { code: 32, title: 'محل اعتبار و استان طرح‌های استانی', desc: 'برای طرح‌های استانی، محل اعتبار بایستی استانی بوده و محل وصول همان استان طرح باشد.' },
  { code: 34, title: 'عدم تکرار ترکیب برنامه و نوع اعتبار/ابلاغ دهنده', desc: 'ترکیب "شماره برنامه" و نوع اعتبار "مصوب" و ترکیب "شماره برنامه" و "ردیف بودجه‌ای ابلاغ دهنده" نمی‌تواند تکراری انتخاب شود.' },
  { code: 35, title: 'عدم تکرار ردیف تغییرات قانونی', desc: 'ردیف‌های بودجه‌ای "تغییرات ناشی از استنادات قانونی" نمی‌تواند تکراری انتخاب شود.' },
  { code: 36, title: 'تکمیل مبلغ تغییرات قانونی', desc: 'مبلغ فیلد "تغییرات ناشی از استنادات قانونی" بایستی تکمیل شود.' },
  { code: 48, title: 'تفاوت ردیف متفرقه اولیه و تغییرات قانونی', desc: 'شماره "ردیف متفرقه" تعیین شده در فرم‌های ۱ و ۲ نمی‌تواند با شماره "ردیف متفرقه" مندرج در تغییرات قانونی یکسان باشد.' },
  { code: 51, title: 'عدم تکرار شماره طرح', desc: 'شماره طرح نمی‌تواند تکراری انتخاب شود.' },
  { code: 52, title: 'سقف دریافتی درآمدهای اختصاصی', desc: 'مبلغ "دریافتی از محل درآمدهای اختصاصی" باید کوچک‌تر یا مساوی مبلغ "بودجه اعتبار نهایی" باشد.' },
  { code: 47, title: 'سقف مبلغ حواله‌ها', desc: 'مبلغ فیلد "حواله‌ها" بایستی کوچک‌تر یا مساوی مبالغ فیلدهای "بودجه اعتبار اولیه" +/- "تغییرات ناشی از استنادات قانونی" + "افزایش" - "کاهش" باشد.' },
  { code: 62, title: 'عدم استفاده از شماره طرح حروف‌دار در فرم ۴', desc: 'دستگاه اجرایی نمی‌تواند در فرم ۴ از شماره طرح حروف‌دار برای اعتبار ابلاغی استفاده نماید.' },
  { code: 63, title: 'مغایرت اعتبار نهایی فرم ۳ با حواله ابلاغ دهنده', desc: 'بودجه اعتبار نهایی در فرم ۳ با جمع حواله دستگاه ابلاغ دهنده مغایرت دارد.' },
  { code: 64, title: 'مغایرت اعتبار نهایی فرم ۴ با حواله ابلاغ دهنده', desc: 'بودجه اعتبار نهایی در فرم ۴ با جمع حواله دستگاه ابلاغ دهنده مغایرت دارد.' },
  { code: 65, title: 'مغایرت اعتبار نهایی فرم ۵ با حواله ابلاغ دهنده', desc: 'بودجه اعتبار نهایی در فرم ۵ با جمع حواله دستگاه ابلاغ دهنده مغایرت دارد.' },
  { code: 66, title: 'مغایرت اعتبار نهایی فرم ۶ با حواله ابلاغ دهنده', desc: 'بودجه اعتبار نهایی در فرم ۶ با جمع حواله دستگاه ابلاغ دهنده مغایرت دارد.' },
  { code: 67, title: 'عدم درج فصل تکراری با شرایط یکسان', desc: 'امکان درج فصل تکراری با شرایط یکسان وجود ندارد.' },
  { code: 1157, title: 'عدم درج فصل ۳ در حساب هزینه‌ای و اختصاصی', desc: 'امکان درج فصل ۳ در حساب هزینه‌ای و اختصاصی وجود ندارد.' },
  { code: 1158, title: 'عدم درج فصل ۸ در حساب سرمایه‌ای و سرمایه‌ای اختصاصی', desc: 'امکان درج فصل ۸ در حساب سرمایه‌ای و سرمایه‌ای اختصاصی وجود ندارد.' },
  { code: 132, title: 'تعیین شماره طرح/ردیف متفرقه/تملک مالی', desc: 'شماره طرح / ردیف (متفرقه / تملک دارایی‌های مالی) تعیین نگردیده است.' },

  // ─── قوانین سری ۸۰۰ فرم‌های منابع (فرم ۸ و خزانه‌داری) ───────────────────
  { code: 801, title: 'تکمیل منابع پیش‌بینی شده', desc: 'مبلغ فیلد "منابع پیش‌بینی شده" بایستی تکمیل شود.' },
  { code: 802, title: 'تعیین نوع منبع ملی برای دستگاه‌های ملی/دانشگاه‌ها', desc: 'برای دستگاه‌های اجرایی ملی و دانشگاه‌ها و مراکز آموزش عالی، نوع منبع بایستی "ملی" تعیین شود.' },
  { code: 803, title: 'سقف مبلغ وجوه ارسالی به خزانه', desc: 'مبلغ فیلد "وصولی" بایستی بزرگ‌تر یا مساوی مبلغ فیلد "وجوه ارسالی به خزانه" باشد.' },
  { code: 804, title: 'تکمیل وجوه ارسالی در صورت وصولی', desc: 'در صورت تکمیل فیلد "وصولی"، فیلد "وجوه ارسالی به خزانه" نیز بایستی تکمیل شود.' },
  { code: 805, title: 'تکمیل فیلدهای فرم منابع', desc: 'فیلدهای این فرم تکمیل نگردیده است.' },
  { code: 806, title: 'عدم منفی بودن مقادیر منابع', desc: 'مقادیر مندرج در فیلدها نبایستی منفی باشد.' },
  { code: 808, title: 'سقف وصولی درامدهای اختصاصی و واگذاری سرمایه‌ای', desc: 'مبلغ فیلد "منابع پیش‌بینی شده" در درآمدهای اختصاصی و واگذاری دارایی‌های سرمایه‌ای اختصاصی بایستی بزرگ‌تر یا مساوی مبلغ فیلد "وصولی" باشد.' },
  { code: 809, title: 'سقف ارسالی به خزانه در اختصاصی‌ها', desc: 'مبلغ فیلد "وصولی" در درآمدهای اختصاصی و واگذاری دارایی‌های سرمایه‌ای اختصاصی بایستی بزرگ‌تر یا مساوی مبلغ فیلد "وجوه ارسالی به خزانه" باشد.' },
  { code: 810, title: 'محل وصول منبع استانی', desc: 'چنانچه منبع "استانی" انتخاب شود، محل وصول نمی‌تواند غیر از استان دستگاه تعیین گردد.' },
  { code: 811, title: 'تعیین منبع ملی برای واگذاری دارایی مالی', desc: '"منبع" واگذاری دارایی‌های مالی بایستی "ملی" تعیین شود.' },
  { code: 812, title: 'عدم تکرار شماره طبقه‌بندی', desc: '"شماره طبقه‌بندی" نمی‌تواند تکراری انتخاب شود.' },
  { code: 813, title: 'برابری پیش‌بینی، وصولی و ارسالی طبقه‌بندی خاص', desc: 'مبالغ فیلدهای "منابع پیش‌بینی شده"، "وصولی" و "وجوه ارسالی به خزانه" برای شماره طبقه‌بندی‌های ۳۱۰۶۰۱، ۱۶۰۱۹۶ و ۱۶۰۱۹۷ بایستی برابر باشند.' },
  { code: 814, title: 'محدودیت شماره طبقه‌بندی ۱۶۰۱۰۵ و ۱۶۰۱۰۶', desc: 'امکان استفاده از شماره طبقه‌بندی‌های ۱۶۰۱۰۵ و ۱۶۰۱۰۶ صرفاً برای دانشگاه‌های زیرمجموعه وزارت علوم و وزارت بهداشت وجود دارد.' },
  { code: 816, title: 'الزامی بودن شماره طبقه‌بندی', desc: '"شماره طبقه‌بندی" نمی‌تواند خالی باشد.' },
];

/**
 * بررسی خطاهای سناما روی یک فرم عملکرد یا لیست فرم‌های عملکرد
 * @param {Array<Object>} items لیست ردیف‌ها/فرم‌های عملکرد
 * @returns {Array<Object>} لیست خطاهای پیدا شده با مشخصات کد، پیام و شناسه ردیف
 */
export function validateSanamaPerformanceForms(items = []) {
  const errors = [];

  if (!Array.isArray(items) || items.length === 0) {
    return [{ code: 17, itemIndex: -1, message: 'فیلدهای این فرم تکمیل نگردیده است.' }];
  }

  // نقشه‌های برقراری یکتایی
  const programNumbers = new Set();
  const miscRowNumbers = new Set();
  const financialAssetsRows = new Set();
  const legalAdjustmentRows = new Set();
  const projectNumbers = new Set();
  const chaptersInProgram = new Set();
  const incomeClassificationCodes = new Set();
  const programApprovedCombos = new Set();
  const programNotifierCombos = new Set();

  items.forEach((item, idx) => {
    const itemRef = item.id || item._id || idx + 1;

    const creditLocation = item.credit_location || (item.credit_type === "مصوب" ? "استانی" : item.credit_type === "ابلاغی" ? "متمرکز" : "");
    const receiptLocation = item.receipt_location || "";
    const creditType = item.credit_type || "";

    // ─── خطای کد ۱۱ ─────────────────────────────────────────────────────────
    if ((creditLocation === "استانی" || creditType === "مصوب") && receiptLocation === "متمرکز") {
      errors.push({
        code: 11,
        itemIndex: idx,
        itemRef,
        message: 'چنانچه محل اعتبار "استانی" انتخاب شود، محل وصول نمی‌تواند "متمرکز" باشد.',
      });
    }

    // ─── خطای کد ۱۲ ─────────────────────────────────────────────────────────
    if (!creditType && item.form_type !== 8) {
      errors.push({
        code: 12,
        itemIndex: idx,
        itemRef,
        message: '"نوع اعتبار" تعیین نگردیده است.',
      });
    }

    // ─── خطای کد ۱۳۱ ────────────────────────────────────────────────────────
    if (!item.program_number && !item.misc_row_number && !item.financial_assets_row_number && item.form_type !== 8) {
      errors.push({
        code: 131,
        itemIndex: idx,
        itemRef,
        message: 'شماره برنامه / ردیف (متفرقه / تملک دارایی‌های مالی) تعیین نگردیده است.',
      });
    }

    // ─── خطای کد ۱۳۲ ────────────────────────────────────────────────────────
    if (!item.project_number && !item.misc_row_number && !item.financial_assets_row_number && item.form_type !== 8) {
      errors.push({
        code: 132,
        itemIndex: idx,
        itemRef,
        message: 'شماره طرح / ردیف (متفرقه / تملک دارایی‌های مالی) تعیین نگردیده است.',
      });
    }

    // ─── خطای کد ۳۲ (طرح‌های استانی) ────────────────────────────────────────
    if (item.is_provincial_project && (creditLocation !== "استانی" || (item.receipt_province && item.project_province && item.receipt_province !== item.project_province))) {
      errors.push({
        code: 32,
        itemIndex: idx,
        itemRef,
        message: 'برای طرح‌های استانی، محل اعتبار بایستی استانی بوده و محل وصول همان استان طرح باشد.',
      });
    }

    // ─── خطای کد ۱۱۵۷ (عدم درج فصل ۳ در حساب هزینه‌ای و اختصاصی) ─────────────
    const chapter = String(item.chapter_code || item.expense_chapter || "").trim();
    const accountKind = String(item.account_kind || "").trim();
    if ((accountKind === "هزینه‌ای" || accountKind === "اختصاصی") && (chapter === "3" || chapter === "03")) {
      errors.push({
        code: 1157,
        itemIndex: idx,
        itemRef,
        message: 'امکان درج فصل ۳ در حساب هزینه‌ای و اختصاصی وجود ندارد.',
      });
    }

    // ─── خطای کد ۱۱۵۸ (عدم درج فصل ۸ در حساب سرمایه‌ای) ──────────────────────
    if ((accountKind === "سرمایه‌ای" || accountKind === "سرمایه‌ای اختصاصی") && (chapter === "8" || chapter === "08")) {
      errors.push({
        code: 1158,
        itemIndex: idx,
        itemRef,
        message: 'امکان درج فصل ۸ در حساب سرمایه‌ای و سرمایه‌ای اختصاصی وجود ندارد.',
      });
    }

    // ─── خطای کد ۶۲ (شماره طرح حروف‌دار در فرم ۴) ─────────────────────────
    if (item.form_type === 4 && item.project_number && /[a-zA-Zآ-ی]/.test(String(item.project_number))) {
      errors.push({
        code: 62,
        itemIndex: idx,
        itemRef,
        message: 'دستگاه اجرایی نمی‌تواند در فرم ۴ از شماره طرح حروف‌دار برای اعتبار ابلاغی استفاده نماید.',
      });
    }

    // ─── خطای ۵۱ (تکراری بودن شماره طرح) ─────────────────────────────────────
    if (item.project_number) {
      const pNo = String(item.project_number).trim();
      if (projectNumbers.has(pNo)) {
        errors.push({
          code: 51,
          itemIndex: idx,
          itemRef,
          message: `شماره طرح «${pNo}» نمی‌تواند تکراری انتخاب شود.`,
        });
      } else {
        projectNumbers.add(pNo);
      }
    }

    // ─── خطای ۶۷ (فصل تکراری با شرایط یکسان) ──────────────────────────────────
    if (chapter) {
      const key = `${item.form_type || 1}:${item.program_number || item.project_number || ''}:${chapter}`;
      if (chaptersInProgram.has(key)) {
        errors.push({
          code: 67,
          itemIndex: idx,
          itemRef,
          message: `امکان درج فصل تکراری «${chapter}» با شرایط یکسان وجود ندارد.`,
        });
      } else {
        chaptersInProgram.add(key);
      }
    }

    // ─── خطای کد ۴۸ (برابری ردیف متفرقه اولیه و تغییرات قانونی) ─────────────
    if ((item.form_type === 1 || item.form_type === 2) && item.misc_row_number && item.legal_adjustments_misc_row &&
        String(item.misc_row_number).trim() === String(item.legal_adjustments_misc_row).trim()) {
      errors.push({
        code: 48,
        itemIndex: idx,
        itemRef,
        message: 'شماره "ردیف متفرقه" تعیین شده در بخش ورود اطلاعات فرم‌های ۱ و ۲ نمی‌تواند با شماره "ردیف متفرقه" مندرج در بخش "تغییرات ناشی از استنادات قانونی" یکسان باشد.',
      });
    }

    // ─── خطای کد ۱۴ ─────────────────────────────────────────────────────────
    if ((creditType === "ابلاغی" || creditLocation === "متمرکز" || creditLocation === "ملی") &&
        item.form_type !== 8 && (!item.notifier_budget_row || String(item.notifier_budget_row).trim() === "")) {
      errors.push({
        code: 14,
        itemIndex: idx,
        itemRef,
        message: 'ردیف بودجه‌ای ابلاغ دهنده تعیین نگردیده است.',
      });
    }

    // ─── خطای کد ۱۶ ─────────────────────────────────────────────────────────
    if (item.notifier_budget_row && item.executive_body_budget_row &&
        String(item.notifier_budget_row).trim() === String(item.executive_body_budget_row).trim()) {
      errors.push({
        code: 16,
        itemIndex: idx,
        itemRef,
        message: 'ردیف بودجه‌ای دستگاه اجرایی نمی‌تواند با ردیف بودجه‌ای ابلاغ دهنده یکسان باشد.',
      });
    }

    // ─── خطای کد ۱۹ و ۸۰۶ (بررسی عدم منفی بودن مقادیر) ─────────────────────
    const numFields = [
      'final_credit_budget', 'initial_credit_budget', 'allocated_credit',
      'received_credit', 'consumed_credit', 'non_final_payments',
      'transferred_bonds', 'other_consumption', 'legal_adjustments',
      'increase', 'decrease', 'drafts', 'special_revenue_received',
      'expected_amount', 'received_amount', 'sent_amount'
    ];
    for (const fld of numFields) {
      if (item[fld] !== undefined && item[fld] !== null && Number(item[fld]) < 0) {
        errors.push({
          code: item.form_type === 8 ? 806 : 19,
          itemIndex: idx,
          itemRef,
          message: 'مقادیر مندرج در فیلدها نبایستی منفی باشد.',
        });
        break;
      }
    }

    // ─── موازنه محاسباتی مبالغ ──────────────────────────────────────────────
    const finalBudget = Number(item.final_credit_budget) || 0;
    const initialBudget = Number(item.initial_credit_budget) || 0;
    const allocated = Number(item.allocated_credit) || 0;
    const received = Number(item.received_credit) || 0;
    const consumed = Number(item.consumed_credit) || 0;
    const nonFinal = Number(item.non_final_payments) || 0;
    const bonds = Number(item.transferred_bonds) || 0;
    const otherCons = Number(item.other_consumption) || 0;
    const legalAdj = Number(item.legal_adjustments) || 0;
    const inc = Number(item.increase) || 0;
    const dec = Number(item.decrease) || 0;
    const drafts = Number(item.drafts) || 0;
    const specialRev = Number(item.special_revenue_received) || 0;

    // ─── خطای کد ۲۳ ─────────────────────────────────────────────────────────
    if (creditType === 'ابلاغی' && allocated !== finalBudget && item.form_type !== 8) {
      errors.push({
        code: 23,
        itemIndex: idx,
        itemRef,
        message: `در اعتبار "ابلاغی"، مبلغ "بودجه اعتبار نهایی" (${finalBudget.toLocaleString('fa-IR')}) با "اعتبار تخصیص یافته" (${allocated.toLocaleString('fa-IR')}) برابر نیست.`,
      });
    }

    // ─── خطای کد ۲۴ ─────────────────────────────────────────────────────────
    if (allocated > finalBudget && item.form_type !== 8) {
      errors.push({
        code: 24,
        itemIndex: idx,
        itemRef,
        message: `مبلغ "اعتبار تخصیص یافته" (${allocated.toLocaleString('fa-IR')}) باید کوچک‌تر یا مساوی "بودجه اعتبار نهایی" (${finalBudget.toLocaleString('fa-IR')}) باشد.`,
      });
    }

    // ─── خطای کد ۲۵ ─────────────────────────────────────────────────────────
    if (allocated < received && item.form_type !== 8) {
      errors.push({
        code: 25,
        itemIndex: idx,
        itemRef,
        message: `مبلغ "اعتبار تخصیص یافته" (${allocated.toLocaleString('fa-IR')}) باید بزرگ‌تر یا مساوی "دریافتی" (${received.toLocaleString('fa-IR')}) باشد.`,
      });
    }

    // ─── خطای کد ۲۶ ─────────────────────────────────────────────────────────
    if (creditType === 'ابلاغی' && allocated !== received && item.form_type !== 8) {
      errors.push({
        code: 26,
        itemIndex: idx,
        itemRef,
        message: `در اعتبار "ابلاغی"، مبلغ "اعتبار تخصیص یافته" (${allocated.toLocaleString('fa-IR')}) با "دریافتی از محل اعتبارات" (${received.toLocaleString('fa-IR')}) برابر نیست.`,
      });
    }

    // ─── خطای کد ۲۷ ─────────────────────────────────────────────────────────
    const consTotal = consumed + nonFinal + bonds + otherCons;
    if (received !== consTotal && item.form_type !== 8 && received > 0) {
      errors.push({
        code: 27,
        itemIndex: idx,
        itemRef,
        message: `مبلغ "دریافتی" (${received.toLocaleString('fa-IR')}) با مجموع (مصرف شده + پیش‌پرداخت + اوراق + سایر = ${consTotal.toLocaleString('fa-IR')}) برابر نیست.`,
      });
    }

    // ─── خطای کد ۲۸ ─────────────────────────────────────────────────────────
    if (item.form_type === 1 || item.form_type === 2) {
      const calcFinal = initialBudget + legalAdj + inc - dec - drafts;
      if (finalBudget !== calcFinal) {
        errors.push({
          code: 28,
          itemIndex: idx,
          itemRef,
          message: `در فرم‌های ۱ و ۲، بودجه نهایی (${finalBudget.toLocaleString('fa-IR')}) با حاصل (اولیه + استنادات + افزایش - کاهش - حواله = ${calcFinal.toLocaleString('fa-IR')}) برابر نیست.`,
        });
      }
    }

    // ─── خطای ۲۰، ۲۱، ۲۲ ───────────────────────────────────────────────────
    if (item.program_number) {
      const pNum = String(item.program_number).trim();
      if (programNumbers.has(pNum)) {
        errors.push({
          code: 20,
          itemIndex: idx,
          itemRef,
          message: `شماره برنامه «${pNum}» نمی‌تواند تکراری انتخاب شود.`,
        });
      } else {
        programNumbers.add(pNum);
      }
    }

    if (item.misc_row_number) {
      const mRow = String(item.misc_row_number).trim();
      if (miscRowNumbers.has(mRow)) {
        errors.push({
          code: 21,
          itemIndex: idx,
          itemRef,
          message: `شماره ردیف متفرقه «${mRow}» نمی‌تواند تکراری انتخاب شود.`,
        });
      } else {
        miscRowNumbers.add(mRow);
      }
    }

    if (item.financial_assets_row_number) {
      const fRow = String(item.financial_assets_row_number).trim();
      if (financialAssetsRows.has(fRow)) {
        errors.push({
          code: 22,
          itemIndex: idx,
          itemRef,
          message: `شماره ردیف تملک دارایی‌های مالی «${fRow}» نمی‌تواند تکراری انتخاب شود.`,
        });
      } else {
        financialAssetsRows.add(fRow);
      }
    }

    // ─── خطای کد ۳۴ ─────────────────────────────────────────────────────────
    if (item.program_number) {
      const pNum = String(item.program_number).trim();
      if (creditType === "مصوب") {
        const key = `APPROVED:${pNum}`;
        if (programApprovedCombos.has(key)) {
          errors.push({
            code: 34,
            itemIndex: idx,
            itemRef,
            message: `ترکیب شماره برنامه «${pNum}» و نوع اعتبار "مصوب" نمی‌تواند تکراری انتخاب شود.`,
          });
        } else {
          programApprovedCombos.add(key);
        }
      }
      if (item.notifier_budget_row) {
        const notifRow = String(item.notifier_budget_row).trim();
        const key = `NOTIFIER:${pNum}:${notifRow}`;
        if (programNotifierCombos.has(key)) {
          errors.push({
            code: 34,
            itemIndex: idx,
            itemRef,
            message: `ترکیب شماره برنامه «${pNum}» و "ردیف بودجه‌ای ابلاغ دهنده" «${notifRow}» نمی‌تواند تکراری انتخاب شود.`,
          });
        } else {
          programNotifierCombos.add(key);
        }
      }
    }

    // ─── خطای کد ۳۵ ─────────────────────────────────────────────────────────
    if (item.legal_adjustments_row) {
      const lRow = String(item.legal_adjustments_row).trim();
      if (legalAdjustmentRows.has(lRow)) {
        errors.push({
          code: 35,
          itemIndex: idx,
          itemRef,
          message: `ردیف‌های بودجه‌ای "تغییرات ناشی از استنادات قانونی" «${lRow}» نمی‌تواند تکراری انتخاب شود.`,
        });
      } else {
        legalAdjustmentRows.add(lRow);
      }
    }

    // ─── خطای کد ۳۶ ─────────────────────────────────────────────────────────
    if (item.legal_adjustments_row && (item.legal_adjustments == null || item.legal_adjustments === "")) {
      errors.push({
        code: 36,
        itemIndex: idx,
        itemRef,
        message: 'مبلغ فیلد "تغییرات ناشی از استنادات قانونی" بایستی تکمیل شود.',
      });
    }

    // ─── خطای کد ۵۲ ─────────────────────────────────────────────────────────
    if (specialRev > finalBudget) {
      errors.push({
        code: 52,
        itemIndex: idx,
        itemRef,
        message: `مبلغ "دریافتی از محل درآمدهای اختصاصی" (${specialRev.toLocaleString('fa-IR')}) باید کوچک‌تر یا مساوی مبلغ "بودجه اعتبار نهایی" (${finalBudget.toLocaleString('fa-IR')}) باشد.`,
      });
    }

    // ─── خطای کد ۴۷ ─────────────────────────────────────────────────────────
    const maxDrafts = initialBudget + legalAdj + inc - dec;
    if (drafts > maxDrafts) {
      errors.push({
        code: 47,
        itemIndex: idx,
        itemRef,
        message: `مبلغ فیلد "حواله‌ها" (${drafts.toLocaleString('fa-IR')}) بایستی کوچک‌تر یا مساوی مبالغ ("اولیه" +/- "تغییرات قانونی" + "افزایش" - "کاهش") یعنی (${maxDrafts.toLocaleString('fa-IR')}) باشد.`,
      });
    }

    // ════════════════════════ قوانین فرم‌های منابع (سری ۸۰۰) ════════════════════════
    const expRes = Number(item.expected_amount ?? item.expected_resources ?? 0);
    const recAmt = Number(item.received_amount ?? item.received_credit ?? 0);
    const sentAmt = Number(item.sent_amount ?? item.sent_to_treasury ?? 0);
    const incCode = String(item.income_code || item.classification_code || "").trim();

    if (item.form_type === 8 || item.is_resource_form) {
      // ─── خطای ۸۰۱ ──────────────────────────────────────────────────────────
      if (expRes === 0 && !item.expected_amount) {
        errors.push({ code: 801, itemIndex: idx, itemRef, message: 'مبلغ فیلد "منابع پیش‌بینی شده" بایستی تکمیل شود.' });
      }

      // ─── خطای ۸۰۲ ──────────────────────────────────────────────────────────
      if (item.is_national_agency && item.source_type !== "ملی") {
        errors.push({ code: 802, itemIndex: idx, itemRef, message: 'برای دستگاه‌های اجرایی ملی و دانشگاه‌ها و مراکز آموزش عالی، نوع منبع بایستی "ملی" تعیین شود.' });
      }

      // ─── خطای ۸۰۳ ──────────────────────────────────────────────────────────
      if (recAmt < sentAmt) {
        errors.push({ code: 803, itemIndex: idx, itemRef, message: 'مبلغ فیلد "وصولی" بایستی بزرگ‌تر یا مساوی مبلغ فیلد "وجوه ارسالی به خزانه" باشد.' });
      }

      // ─── خطای ۸۰۴ ──────────────────────────────────────────────────────────
      if (recAmt > 0 && (sentAmt === 0 && !item.sent_amount)) {
        errors.push({ code: 804, itemIndex: idx, itemRef, message: 'در صورت تکمیل فیلد "وصولی"، فیلد "وجوه ارسالی به خزانه" نیز بایستی تکمیل شود.' });
      }

      // ─── خطای ۸۰۸ و ۸۰۹ ────────────────────────────────────────────────────
      if (item.is_special_revenue || item.resource_kind?.includes("اختصاصی")) {
        if (expRes < recAmt) {
          errors.push({ code: 808, itemIndex: idx, itemRef, message: 'مبلغ فیلد "منابع پیش‌بینی شده" در درآمدهای اختصاصی و واگذاری دارایی‌های سرمایه‌ای اختصاصی بایستی بزرگ‌تر یا مساوی مبلغ فیلد "وصولی" باشد.' });
        }
        if (recAmt < sentAmt) {
          errors.push({ code: 809, itemIndex: idx, itemRef, message: 'مبلغ فیلد "وصولی" در درآمدهای اختصاصی و واگذاری دارایی‌های سرمایه‌ای اختصاصی بایستی بزرگ‌تر یا مساوی مبلغ فیلد "وجوه ارسالی به خزانه" باشد.' });
        }
      }

      // ─── خطای ۸۱۰ ──────────────────────────────────────────────────────────
      if (item.source_type === "استانی" && item.receipt_province && item.agency_province && item.receipt_province !== item.agency_province) {
        errors.push({ code: 810, itemIndex: idx, itemRef, message: 'چنانچه منبع "استانی" انتخاب شود، محل وصول نمی‌تواند غیر از استان دستگاه تعیین گردد.' });
      }

      // ─── خطای ۸۱۱ ──────────────────────────────────────────────────────────
      if (item.is_financial_assets && item.source_type !== "ملی") {
        errors.push({ code: 811, itemIndex: idx, itemRef, message: '"منبع" واگذاری دارایی‌های مالی بایستی "ملی" تعیین شود.' });
      }

      // ─── خطای ۸۱۲ ──────────────────────────────────────────────────────────
      if (incCode) {
        if (incomeClassificationCodes.has(incCode)) {
          errors.push({ code: 812, itemIndex: idx, itemRef, message: `"شماره طبقه‌بندی" «${incCode}» نمی‌تواند تکراری انتخاب شود.` });
        } else {
          incomeClassificationCodes.add(incCode);
        }
      }

      // ─── خطای ۸۱۳ ──────────────────────────────────────────────────────────
      if (["310601", "160196", "160197"].includes(incCode)) {
        if (expRes !== recAmt || recAmt !== sentAmt) {
          errors.push({ code: 813, itemIndex: idx, itemRef, message: 'مبالغ فیلدهای "منابع پیش‌بینی شده"، "وصولی" و "وجوه ارسالی به خزانه" برای شماره طبقه‌بندی‌های ۳۱۰۶۰۱، ۱۶۰۱۹۶ و ۱۶۰۱۹۷ بایستی برابر باشند.' });
        }
      }

      // ─── خطای ۸۱۴ ──────────────────────────────────────────────────────────
      if (["160105", "160106"].includes(incCode) && !item.is_university) {
        errors.push({ code: 814, itemIndex: idx, itemRef, message: 'امکان استفاده از شماره طبقه‌بندی‌های ۱۶۰۱۰۵ و ۱۶۰۱۰۶ صرفاً برای دانشگاه‌های زیرمجموعه وزارت علوم و وزارت بهداشت وجود دارد.' });
      }

      // ─── خطای ۸۱۶ ──────────────────────────────────────────────────────────
      if (!incCode && item.is_resource_form) {
        errors.push({ code: 816, itemIndex: idx, itemRef, message: '"شماره طبقه‌بندی" نمی‌تواند خالی باشد.' });
      }
    }
  });

  // ─── خطای کد ۱۵ (مقایسه فرم ۱ با فرم‌های ۴ و ۶) ──────────────────────────
  const form1Items = items.filter((i) => i.form_type === 1);
  const form4Items = items.filter((i) => i.form_type === 4);
  const form6Items = items.filter((i) => i.form_type === 6);

  if (form1Items.length > 0 && (form4Items.length > 0 || form6Items.length > 0)) {
    const form1Total = form1Items.reduce((acc, i) => acc + (Number(i.final_credit_budget) || 0), 0);
    const form4Total = form4Items.reduce((acc, i) => acc + (Number(i.final_credit_budget) || 0), 0);
    const form6Total = form6Items.reduce((acc, i) => acc + (Number(i.final_credit_budget) || 0), 0);

    if (form4Items.length > 0 && form1Total !== form4Total) {
      errors.push({
        code: 15,
        itemIndex: -1,
        itemRef: 'فرم ۱ و ۴',
        message: `مبلغ فیلد "بودجه اعتبار نهایی" در فرم ۱ (${form1Total.toLocaleString('fa-IR')}) با مبلغ فیلد در فرم ۴ (${form4Total.toLocaleString('fa-IR')}) برابر نیست.`,
      });
    }
    if (form6Items.length > 0 && form1Total !== form6Total) {
      errors.push({
        code: 15,
        itemIndex: -1,
        itemRef: 'فرم ۱ و ۶',
        message: `مبلغ فیلد "بودجه اعتبار نهایی" در فرم ۱ (${form1Total.toLocaleString('fa-IR')}) با مبلغ فیلد در فرم ۶ (${form6Total.toLocaleString('fa-IR')}) برابر نیست.`,
      });
    }
  }

  return errors;
}
