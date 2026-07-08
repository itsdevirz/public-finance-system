/**
 * قانون موجودی معین:
 * حسابی که ماهیت بدهکار دارد، جمع بستانکارهایش در همه اسناد
 * نباید از جمع بدهکارهایش بیشتر شود (مانده نباید منفی شود).
 */

import api from "@/api";
import sanamaCodes from "@/data/sanamaCodes.json";

// ── نقشه ماهیت کدها — یک‌بار ساخته می‌شود ──────────────────────────────────
const natureMap = new Map();
for (const group of sanamaCodes.groups) {
  for (const account of group.accounts) {
    for (const sub of account.children || []) {
      if (sub.code && sub.nature) {
        natureMap.set(String(sub.code), sub.nature);
      }
    }
  }
}

/**
 * ماهیت یک معین را برمی‌گرداند
 * @returns {"debit"|"credit"|"both"|null}
 */
export function getAccountNature(subAccountCode) {
  return natureMap.get(String(subAccountCode)) ?? null;
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
 * بررسی قانون موجودی برای یک سند — با Parallel Requests
 *
 * @param {Array} rows - ردیف‌های سند: [{ subAccount, debit, credit }, ...]
 * @param {string|null} excludeDocId - برای ویرایش سند
 * @returns {Promise<string|null>} - null یعنی ok، وگرنه پیام خطا
 */
export async function checkDebitNatureBalance(rows, excludeDocId = null) {
  // گروه‌بندی ردیف‌ها بر اساس کد معین
  const byAccount = new Map();
  for (const row of rows) {
    const code = String(row.subAccount || "");
    if (!code) continue;
    if (!byAccount.has(code)) {
      byAccount.set(code, { debit: 0, credit: 0 });
    }
    const acc = byAccount.get(code);
    acc.debit  += Number(row.debit)  || 0;
    acc.credit += Number(row.credit) || 0;
  }

  // فقط کدهایی که بستانکار شده‌اند و ماهیت بدهکار دارند نیاز به چک دارند
  const codesToCheck = [];
  for (const [code, amounts] of byAccount.entries()) {
    if (amounts.credit === 0) continue;
    const nature = getAccountNature(code);
    if (nature !== "debit") continue;
    codesToCheck.push(code);
  }

  if (codesToCheck.length === 0) return null;

  // همه درخواست‌ها را موازی ارسال کن (به جای sequential)
  const results = await Promise.all(
    codesToCheck.map(code => fetchAccountBalance(code, excludeDocId))
  );

  for (let i = 0; i < codesToCheck.length; i++) {
    const code = codesToCheck[i];
    const existing = results[i];
    const newAmounts = byAccount.get(code);

    const newTotalDebit  = (existing.totalDebit  || 0) + newAmounts.debit;
    const newTotalCredit = (existing.totalCredit || 0) + newAmounts.credit;

    if (newTotalCredit > newTotalDebit) {
      const overage = (newTotalCredit - newTotalDebit).toLocaleString("fa-IR");
      return `حساب معین «${code}» دارای ماهیت بدهکار است. مبلغ بستانکار (${newTotalCredit.toLocaleString("fa-IR")}) از مبلغ بدهکار (${newTotalDebit.toLocaleString("fa-IR")}) بیشتر می‌شود. اضافه: ${overage} ریال`;
    }
  }

  return null;
}
