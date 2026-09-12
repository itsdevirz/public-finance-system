/**
 * کنترل پویای ماهیت و مانده کلیه حساب‌ها در سیستم مالی عمومی:
 * - حساب‌های ماهیت بدهکار (دارایی‌ها غیر کاهنده، هزینه‌ها، طرف حساب‌های انتظامی و...): جمع بستانکارها نباید از جمع بدهکارها بیشتر شود (مانده باید >= 0 بدهکار باشد).
 * - حساب‌های ماهیت بستانکار (بدهی‌ها غیر کاهنده، حقوق مالکانه، درآمدها، طرف حساب‌های انتظامی بستانکار و...): جمع بدهکارها نباید از جمع بستانکارها بیشتر شود (مانده باید >= 0 بستانکار باشد).
 * - حساب‌های کاهنده (مانند استهلاک انباشته یا ذخیره کاهش ارزش): ماهیت بستانکار دارند.
 */

import api from "@/api";
import sanamaCodes from "@/data/sanamaCodes.json";

// ── نقشه ماهیت کدها — یک‌بار ساخته می‌شود ──────────────────────────────────
const natureMap = new Map();
for (const group of sanamaCodes.groups || []) {
  for (const account of group.accounts || []) {
    for (const sub of account.children || []) {
      if (sub.code && sub.nature) {
        natureMap.set(String(sub.code), sub.nature);
      }
    }
  }
}

// حساب‌های کاهنده دارایی (دارای ماهیت بستانکار)
const CONTRA_ASSET_CODES = new Set(["14551", "15020", "15040", "15045", "15050", "16040", "16050"]);

/**
 * ماهیت یک معین را برای کلیه گروه‌های ۱ تا ۹ برمی‌گرداند
 * @returns {"debit"|"credit"|"both"}
 */
export function getAccountNature(subAccountCode) {
  const cleanCode = String(subAccountCode || "").trim();
  if (!cleanCode) return "both";

  if (CONTRA_ASSET_CODES.has(cleanCode)) return "credit";

  const explicit = natureMap.get(cleanCode);
  if (explicit) return explicit;

  const firstDigit = cleanCode.charAt(0);
  const first3 = cleanCode.substring(0, 3);

  if (firstDigit === "1") return "debit";    // دارایی‌ها
  if (firstDigit === "2") return "credit";   // بدهی‌ها
  if (firstDigit === "3") return "credit";   // خالص دارایی‌ها
  if (firstDigit === "4") return "credit";   // درآمدها
  if (firstDigit === "5" || firstDigit === "6") return "debit"; // هزینه‌ها
  if (firstDigit === "7") return "both";

  if (first3 === "810" || ["910", "915", "920", "925", "930", "935", "940", "950"].includes(first3)) {
    return "debit";
  }
  if (first3 === "820" || ["960", "970", "980", "990"].includes(first3)) {
    return "credit";
  }

  return "both";
}

// ── کش با TTL 5 دقیقه ────────────────────────────────────────────────────────
const CACHE_TTL = 5 * 60 * 1000;
const balanceCache = new Map(); // key → { data, ts }

function getCached(key) {
  const entry = balanceCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    balanceCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data) {
  balanceCache.set(key, { data, ts: Date.now() });
}

/** کش را پاک کن (بعد از ثبت موفق سند) */
export function clearBalanceCache() {
  balanceCache.clear();
}

/**
 * موجودی یک معین را از API دریافت می‌کند
 */
export async function fetchAccountBalance(accountCode, excludeDocId = null) {
  const cacheKey = `${accountCode}:${excludeDocId || ""}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const params = excludeDocId ? `?excludeId=${excludeDocId}` : "";
    const res = await api.get(`/api/documents/account-balance/${accountCode}${params}`);
    setCache(cacheKey, res.data);
    return res.data;
  } catch {
    return { totalDebit: 0, totalCredit: 0, balance: 0 };
  }
}

/**
 * بررسی قانون موجودی و ماهیت حساب‌ها (بدهکار/بستانکار) بر اساس کنترل انباشته
 *
 * @param {Array} rows - ردیف‌های سند: [{ subAccount, debit, credit }, ...]
 * @param {string|null} excludeDocId - برای ویرایش سند
 * @returns {Promise<string|null>} - null یعنی ok، وگرنه پیام خطا
 */
export async function checkDebitNatureBalance(rows, excludeDocId = null) {
  // گروه‌بندی ردیف‌ها بر اساس کد معین
  const byAccount = new Map();
  for (const row of rows) {
    const code = String(row.subAccount || row.account_code || "").trim();
    if (!code) continue;
    if (!byAccount.has(code)) {
      byAccount.set(code, { debit: 0, credit: 0 });
    }
    const acc = byAccount.get(code);
    acc.debit  += Number(row.debit)  || 0;
    acc.credit += Number(row.credit) || 0;
  }

  // کدهایی که دارای ماهیت محدود (debit یا credit) هستند
  const codesToCheck = [];
  for (const [code] of byAccount.entries()) {
    const nature = getAccountNature(code);
    if (nature === "debit" || nature === "credit") {
      codesToCheck.push(code);
    }
  }

  if (codesToCheck.length === 0) return null;

  // ارسال موازی درخواست‌های محاسبه موجودی انباشته
  const results = await Promise.all(
    codesToCheck.map(code => fetchAccountBalance(code, excludeDocId))
  );

  for (let i = 0; i < codesToCheck.length; i++) {
    const code = codesToCheck[i];
    const existing = results[i];
    const newAmounts = byAccount.get(code);
    const nature = getAccountNature(code);

    const totalDebit  = (existing.totalDebit  || 0) + newAmounts.debit;
    const totalCredit = (existing.totalCredit || 0) + newAmounts.credit;

    if (nature === "debit" && totalCredit > totalDebit) {
      const overage = (totalCredit - totalDebit).toLocaleString("fa-IR");
      return `خطا: مانده حساب معین «${code}» دارای ماهیت بدهکار است. جمع بستانکارها (${totalCredit.toLocaleString("fa-IR")} ریال) از جمع بدهکارها (${totalDebit.toLocaleString("fa-IR")} ریال) بیشتر می‌شود. مانده بستانکار غیرمجاز (مازاد): ${overage} ریال. ثبت سند متوقف شد.`;
    }

    if (nature === "credit" && totalDebit > totalCredit) {
      const overage = (totalDebit - totalCredit).toLocaleString("fa-IR");
      return `خطا: مانده حساب معین «${code}» دارای ماهیت بستانکار است. جمع بدهکارها (${totalDebit.toLocaleString("fa-IR")} ریال) از جمع بستانکارها (${totalCredit.toLocaleString("fa-IR")} ریال) بیشتر می‌شود. مانده بدهکار غیرمجاز (مازاد): ${overage} ریال. ثبت سند متوقف شد.`;
    }
  }

  return null;
}
