/**
 * ماژول پیاده‌سازی و استخراج خروجی استاندارد ۶۰ ستونه متنی حقوق و دستمزد خزانه (سامانه سینا)
 * مطابق با دستورالعمل خزانه داری کل کشور (ستون های D35 تا D94 اکسل)
 */

// نگاشت کدهای عددی استاندارد خزانه
export const TREASURY_CODES = {
  gender: {
    male: "2",
    female: "4",
    2: "2",
    4: "4"
  },
  maritalStatus: {
    single: "1",       // مجرد
    other: "2",        // سایر
    married: "3",      // متاهل
    with_dependents: "3",
    widowed: "2",
    divorced: "2",
    1: "1",
    2: "2",
    3: "3"
  },
  employmentType: {
    official: "5",          // رسمی
    official_probation: "5",// رسمی
    probationary: "6",      // پیمانی
    contractual: "7",       // سایر / قراردادی
    company: "7",
    hourly: "7",
    daily: "7",
    5: "5",
    6: "6",
    7: "7"
  },
  highestDegree: {
    phd: "1",            // دکترا
    post_phd: "1",
    master: "2",         // فوق لیسانس
    bachelor: "3",       // لیسانس
    associate: "4",      // فوق دیپلم
    diploma: "5",        // دیپلم
    under_diploma: "6",  // باسواد بدون مدرک
    1: "1", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6"
  },
  pensionFund: {
    civil: "7",           // بازنشستگی کشوری
    social_security: "8", // تامین اجتماعی
    other: "9",           // سایر
    armed_forces: "9",
    none: "9",
    7: "7", 8: "8", 9: "9"
  },
  healthInsuranceStatus: {
    health_services: "1", // خدمات درمانی
    social_security: "2", // تامین اجتماعی
    other: "3",           // سایر
    1: "1", 2: "2", 3: "3"
  }
};

/**
 * پاکسازی نام بانک بر اساس استاندارد خزانه (حذف کشیدگی حروف و کاراکترهای زايد)
 */
export function sanitizeBankName(bankName) {
  if (!bankName) return "";
  let clean = String(bankName)
    .replace(/[\u0640]/g, "") // حذف کشیدگی حروف (تطویل / کشیده)
    .replace(/\s+/g, " ")      // استانداردسازی فاصله‌ها
    .trim();
  return clean;
}

/**
 * اعتبارسنجی یک کارمند بر اساس قوانین خزانه
 */
export function validateEmployeeForTreasury(emp, calc = null) {
  const errors = [];
  const warnings = [];

  const nationalId = String(emp.nationalId || "").trim();
  if (!nationalId || nationalId.length !== 10 || !/^\d{10}$/.test(nationalId)) {
    errors.push(`کد ملی کارمند (${emp.firstName} ${emp.lastName}) باید دقیقاً ۱۰ رقم عددی بدون فاصله و خط تیره باشد.`);
  }

  const maritalCode = TREASURY_CODES.maritalStatus[emp.maritalStatus] || "1";
  const childrenCount = Number(emp.childrenCount || 0);

  // قانون اعتبارسنجی حیاتی: اگر مجرد (1) است، اولاد حتماً باید 0 باشد
  if (maritalCode === "1" && childrenCount > 0) {
    errors.push(`خطای حیاتی خزانه: وضعیت تاهل کارمند "${emp.firstName} ${emp.lastName}" مجرد است اما تعداد اولاد ${childrenCount} ثبت شده است. تعداد اولاد کارمند مجرد باید ۰ باشد.`);
  }

  const bankName = String(emp.bankName || "").trim();
  if (bankName.includes("ـ")) {
    warnings.push(`نام بانک (${bankName}) دارای کشیدگی حروف است که اصلاح خودکار خواهد شد.`);
  }

  const code = String(emp.code || "").trim();
  if (!code) {
    errors.push(`شماره پرسنلی کارمند (${emp.firstName} ${emp.lastName}) نامعتبر یا خالی است.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * ساخت آرایه ۶۰ ستونه برای یک رکورد حقوق پرسنل (مطابق ستون‌های D35 تا D94 اکسل)
 */
export function buildTreasury60Fields(emp, calc = {}, options = {}) {
  const safeCalc = calc || {};
  const { executiveOrgCode = "127500" } = options;

  const birthDateStr = String(emp.birthDate || "");
  let birthYear = "1360";
  let birthMonth = "01";
  
  if (birthDateStr.includes("/")) {
    const parts = birthDateStr.split("/");
    if (parts.length >= 2) {
      birthYear = parts[0].padStart(4, "13");
      birthMonth = parts[1].padStart(2, "0");
    }
  } else if (emp.birthYear) {
    birthYear = String(emp.birthYear).padStart(4, "13");
    birthMonth = String(emp.birthMonth || "01").padStart(2, "0");
  }

  const maritalCode = TREASURY_CODES.maritalStatus[emp.maritalStatus] || "1";
  let children = Number(emp.childrenCount || 0);
  if (maritalCode === "1") {
    children = 0; // الزامی طبق بند ۱۰
  }

  // مبالغ اقلام احکام و پرداختی‌ها (فیلدهای ۱۵ تا ۵۵)
  const fields15to55 = new Array(41).fill(0);

  // 15. حق شغل / حقوق مبنا
  fields15to55[0] = Math.round(Number(safeCalc.baseSalary || emp.baseSalary || (Number(emp.dailyBaseSalary || 0) * 30) || 0));
  // 16. حق شاغل / افزایش سنواتی
  fields15to55[1] = Math.round(Number(safeCalc.experiencePay || 0));
  // 17. فوق‌العاده شغل
  fields15to55[2] = Math.round(Number(safeCalc.jobAllowance || 0));
  // 18. تفاوت تطبیق
  fields15to55[3] = Math.round(Number(safeCalc.adjustmentDifference || 0));
  // 19. افزایش جزء ب بند 11
  fields15to55[4] = Math.round(Number(safeCalc.clauseBIncrease || 0));
  // 20. فوق‌العاده سختی کار
  fields15to55[5] = Math.round(Number(safeCalc.hardshipAllowance || 0));
  // 21. فوق‌العاده بدی آب و هوا
  fields15to55[6] = Math.round(Number(safeCalc.badWeatherAllowance || 0));
  // 22. مبلغ تضمین
  fields15to55[7] = Math.round(Number(safeCalc.guaranteeAmount || 0));
  // 23. فوق‌العاده محل خدمت
  fields15to55[8] = Math.round(Number(safeCalc.serviceLocationAllowance || 0));
  // 24. خدمت در مناطق جنگ‌زده
  fields15to55[9] = Math.round(Number(safeCalc.warZoneAllowance || 0));
  // 25. فوق‌العاده ویژه
  fields15to55[10] = Math.round(Number(safeCalc.specialAllowance || 0));
  // 26. فوق‌العاده نشان‌های دولتی
  fields15to55[11] = Math.round(Number(safeCalc.honorAllowance || 0));
  // 27. کمک‌هزینه عائله‌مندی
  fields15to55[12] = Math.round(Number(safeCalc.familyAllowance || 0));
  // 28. کمک‌هزینه اولاد
  fields15to55[13] = Math.round(Number(safeCalc.childAllowance || emp.childAllowance || 0));
  // 29. فوق‌العاده ایثارگری
  fields15to55[14] = Math.round(Number(safeCalc.sacrificeAllowance || 0));
  // 30. تفاوت حداقل دریافتی
  fields15to55[15] = Math.round(Number(safeCalc.minSalaryDiff || 0));
  // 31. کسر صندوق
  fields15to55[16] = Math.round(Number(safeCalc.pensionDeduction || 0));
  // 32. سایر احکام / حق مسئولیت
  fields15to55[17] = Math.round(Number(safeCalc.responsibilityAllowance || emp.responsibilityAllowance || 0));
  // 33. فوق‌العاده مناطق کمتر توسعه‌یافته
  fields15to55[18] = Math.round(Number(safeCalc.underdevelopedAllowance || 0));
  // 34. فوق‌العاده جذب هیئت امنا
  fields15to55[19] = Math.round(Number(safeCalc.boardAllowance || 0));
  // 35. فوق‌العاده اشتغال خارج از کشور
  fields15to55[20] = Math.round(Number(safeCalc.overseasAllowance || 0));
  // 36. خدمات درمانی سهم دستگاه
  fields15to55[21] = Math.round(Number(safeCalc.healthInsEmployer || 0));
  // 37. ضریب تعدیل
  fields15to55[22] = Math.round(Number(safeCalc.adjustmentCoefficient || 0));
  // 38. تنزل پست
  fields15to55[23] = Math.round(Number(safeCalc.demotionDiff || 0));
  // 39. حق اشخاص
  fields15to55[24] = Math.round(Number(safeCalc.personalRights || 0));
  // 40. کمک‌هزینه اقلام مصرفی / بن / مسکن
  fields15to55[25] = Math.round(Number(safeCalc.groceryAllowance || emp.groceryAllowance || 0) + Number(safeCalc.housingAllowance || emp.housingAllowance || 0));
  // 41. درصد مقطع تحصیلی / پایه سنواتی
  fields15to55[26] = Math.round(Number(safeCalc.degreePercentage || 0));
  // 42. فوق‌العاده مدیریت
  fields15to55[27] = Math.round(Number(safeCalc.managementAllowance || 0));
  // 43. ایثارگری سهم دستگاه
  fields15to55[28] = Math.round(Number(safeCalc.sacrificeEmployerShare || 0));
  // 44. بازنشستگی سهم دولت (کشوری)
  fields15to55[29] = Math.round(Number(safeCalc.pensionEmployerShareCivil || 0));
  // 45. بیمه تامین اجتماعی سهم دولت
  fields15to55[30] = Math.round(Number(safeCalc.socialInsEmployer || safeCalc.employerInsurance || 0));
  // 46. بیمه خدمات درمانی سهم دولت
  fields15to55[31] = Math.round(Number(safeCalc.healthInsGovtShare || 0));
  // 47. بازنشستگی سهم دولت (جهاد)
  fields15to55[32] = Math.round(Number(safeCalc.pensionJihadEmployerShare || 0));
  // 48. سایر پرداختی‌ها
  fields15to55[33] = Math.round(Number(safeCalc.otherAllowances || emp.otherAllowances || 0) + Number(safeCalc.overtimePay || 0));
  // 49. مالیات حقوق
  fields15to55[34] = Math.round(Number(safeCalc.tax || safeCalc.taxDeduction || 0));
  // 50. بازنشستگی سهم کارمند (کشوری)
  fields15to55[35] = Math.round(Number(safeCalc.pensionEmployeeShareCivil || 0));
  // 51. بیمه تامین اجتماعی سهم کارمند
  fields15to55[36] = Math.round(Number(safeCalc.socialInsEmployee || safeCalc.employeeInsurance || 0));
  // 52. بیمه خدمات درمانی سهم کارمند
  fields15to55[37] = Math.round(Number(safeCalc.healthInsEmployee || 0));
  // 53. بازنشستگی سهم کارمند (جهاد)
  fields15to55[38] = Math.round(Number(safeCalc.pensionJihadEmployeeShare || 0));
  // 54. مقرری ماه اول و سایر کسور بازنشستگی
  fields15to55[39] = Math.round(Number(safeCalc.firstMonthDeduction || 0));
  // 55. سایر کسور
  fields15to55[40] = Math.round(Number(safeCalc.otherDeductions || 0));

  // 56. جمع کل کنترل مبالغ (فیلدهای ۱۵ تا ۵۵ با قدر مطلق مثبت)
  const totalSumField56 = fields15to55.reduce((sum, val) => sum + Math.abs(val), 0);

  // آرایه کامل ۶۰ فیلد
  const record = [
    // 1..14
    String(emp.executiveOrgCode || executiveOrgCode || "127500"),
    String(emp.nationalId || "").trim(),
    String(emp.code || "").trim(),
    String(birthYear),
    String(birthMonth),
    String(emp.lastName || "").trim(),
    String(emp.firstName || "").trim(),
    String(TREASURY_CODES.gender[emp.gender] || "2"),
    String(maritalCode),
    String(children),
    String(TREASURY_CODES.employmentType[emp.employmentType] || "5"),
    String(TREASURY_CODES.highestDegree[emp.highestDegree] || "3"),
    String(TREASURY_CODES.pensionFund[emp.pensionFund] || "7"),
    String(TREASURY_CODES.healthInsuranceStatus[emp.healthInsuranceStatus || "1"] || "1"),

    // 15..55
    ...fields15to55.map(v => String(v || 0)),

    // 56
    String(totalSumField56),

    // 57..60
    String(emp.shebaNo || emp.accountNo || "").replace(/\s+/g, ""),
    sanitizeBankName(emp.bankName || "بانک سپه"),
    String(emp.branchName || "مرکزی").trim(),
    String(emp.bankBranchCode || emp.branchCode || "101").trim()
  ];

  return record;
}

/**
 * ساخت نام فایل استاندارد خزانه: [W|D][O][MONTH][SERIAL].TXT
 * مثال حقوق جاری: W0307001.TXT
 * مثال معوقات: WM0307001.TXT
 */
export function generateTreasuryFilename(options = {}) {
  const {
    platform = "W",    // W برای ویندوز، D برای داس
    isArrears = false, // false برای حقوق جاری، true برای معوقات (M)
    yearMonth = "0307",// سال 03 و ماه 07 یا 9903
    serial = "001"     // 3 رقمی
  } = options;

  const prefix = platform.toUpperCase() === "D" ? "D" : "W";
  const typeLetter = isArrears ? "M" : "";
  const formattedYearMonth = String(yearMonth).padStart(4, "0");
  const formattedSerial = String(serial).padStart(3, "0");

  return `${prefix}${typeLetter}${formattedYearMonth}${formattedSerial}.TXT`;
}

/**
 * تولید فایل متنی استاندارد ۶۰ ستونه بدون هدر با خط شکن CRLF
 */
export function generateTreasury60TextFile(employees = [], payrollCalculations = [], options = {}) {
  const validationResults = [];
  const lines = [];

  for (const emp of employees) {
    const empId = emp._id || emp.id;
    const calc = payrollCalculations.find(c => String(c.employeeId) === String(empId)) || {};
    
    const vRes = validateEmployeeForTreasury(emp, calc);
    validationResults.push({
      employee: `${emp.firstName || ""} ${emp.lastName || ""}`,
      code: emp.code,
      nationalId: emp.nationalId,
      ...vRes
    });

    const fields = buildTreasury60Fields(emp, calc, options);
    lines.push(fields.join(","));
  }

  // انتهای هر سطر با CRLF (\r\n)
  const fileContent = lines.join("\r\n");
  const filename = generateTreasuryFilename(options);

  const hasCriticalErrors = validationResults.some(r => !r.isValid);

  return {
    filename,
    fileContent,
    recordCount: lines.length,
    validationResults,
    hasCriticalErrors
  };
}
