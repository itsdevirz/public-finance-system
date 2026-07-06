/**
 * قانون موجودی معین:
 * حسابی که ماهیت بدهکار دارد، جمع بستانکارهایش در همه اسناد
 * نباید از جمع بدهکارهایش بیشتر شود (مانده نباید منفی شود).
 *
 * این تابع برای هر معین بدهکار در سند جاری چک می‌کند که
 * آیا بعد از ثبت این سند، مانده آن منفی می‌شود یا نه.
 */

import api from "@/api";
import sanamaCodes from "@/data/sanamaCodes.json";

// کش موجودی‌ها برای جلوگیری از درخواست‌های تکراری در یک session
const balanceCache = new Map();

/**
 * ماهیت یک معین را از sanamaCodes برمی‌گرداند
 * @returns "debit" | "credit" | "both" | null
 */
export function getAccountNature(subAccountCode) {
  for (const group of sanamaCodes.groups) {
    for (const account of group.accounts) {
      const children = account.children || [];
      for (const sub of children) {
        if (String(sub.code) === String(subAccountCode)) {
          return sub.nature || null;
        }
      }
    }
  }
  return null;
}

/**
 * موجودی یک معین را از API دریافت می‌کند
 * @param {string} accountCode - کد معین
 * @param {string} [excludeDocId] - آیدی سند جاری برای ویرایش (حذف از محاسبه)
 * @returns {{ totalDebit, totalCredit, balance }}
 */
export async function fetchAccountBalance(accountCode, excludeDocId = null) {
  const cacheKey = `${accountCode}:${excludeDocId || ""}`;
  if (balanceCache.has(cacheKey)) {
    return balanceCache.get(cacheKey);
  }

  try {
    const params = excludeDocId ? `?excludeId=${excludeDocId}` : "";
    const res = await api.get(`/api/documents/account-balance/${accountCode}${params}`);
    const data = res.data;
    balanceCache.set(cacheKey, data);
    return data;
  } catch {
    return { totalDebit: 0, totalCredit: 0, balance: 0 };
  }
}

/** کش را پاک کن (بعد از ثبت موفق سند) */
export function clearBalanceCache() {
  balanceCache.clear();
}

/**
 * بررسی قانون موجودی برای یک سند
 *
 * @param {Array} rows - ردیف‌های سند: [{ subAccount, debit, credit }, ...]
 *   - debit و credit باید عدد (number) باشند
 * @param {string} [excludeDocId] - برای ویرایش سند
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

  // برای هر معین که در این سند ظاهر شده
  for (const [code, newAmounts] of byAccount.entries()) {
    if (newAmounts.credit === 0) continue; // فقط وقتی بستانکار می‌کنیم چک کن

    const nature = getAccountNature(code);
    if (nature !== "debit") continue; // فقط معین‌های بدهکار‌طبیعت

    // موجودی از سایر اسناد
    const existing = await fetchAccountBalance(code, excludeDocId);

    // بعد از ثبت این سند، مانده چقدر می‌شه؟
    const newTotalDebit  = existing.totalDebit  + newAmounts.debit;
    const newTotalCredit = existing.totalCredit + newAmounts.credit;

    if (newTotalCredit > newTotalDebit) {
      const overage = (newTotalCredit - newTotalDebit).toLocaleString("fa-IR");
      return `حساب معین «${code}» دارای ماهیت بدهکار است. مبلغ بستانکار (${newTotalCredit.toLocaleString("fa-IR")}) از مبلغ بدهکار (${newTotalDebit.toLocaleString("fa-IR")}) بیشتر می‌شود. اضافه: ${overage} ریال`;
    }
  }

  return null; // همه چیز ok
}
