import { ObjectId } from "mongodb";

/**
 * تبدیل ObjectId به string برای serialize کردن پاسخ‌های MongoDB
 */
export function serialize(doc: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(
    JSON.stringify(doc, (_k, v) => (v instanceof ObjectId ? v.toHexString() : v))
  );
}

const PERSIAN_DIGITS = ["۰","۱","۲","۳","۴","۵","۶","۷","۸","۹"];
const ARABIC_DIGITS  = ["٠","١","٢","٣","٤","٥","٦","٧","٨","٩"];

/**
 * تبدیل تاریخ شمسی (فارسی/عربی/انگلیسی) به عدد 8 رقمی YYYYMMDD
 */
export function dateToNum(d: string): number {
  if (!d) return 0;
  let s = d;
  for (let i = 0; i < 10; i++) {
    s = s.replace(new RegExp(PERSIAN_DIGITS[i], "g"), String(i));
    s = s.replace(new RegExp(ARABIC_DIGITS[i],  "g"), String(i));
  }
  const parts = s.split(/[\/\-\.]/);
  if (parts.length === 3) {
    const y   = parts[0].padStart(4, "0");
    const m   = parts[1].padStart(2, "0");
    const day = parts[2].padStart(2, "0");
    return parseInt(`${y}${m}${day}`, 10) || 0;
  }
  return parseInt(s.replace(/[^\d]/g, ""), 10) || 0;
}

/**
 * تبدیل عدد فارسی/عربی/با کاما به عدد انگلیسی
 */
export function parseFaNum(v: unknown): number {
  if (!v) return 0;
  let s = String(v).replace(/,|،/g, "");
  for (let i = 0; i < 10; i++) {
    s = s.replace(new RegExp(PERSIAN_DIGITS[i], "g"), String(i));
    s = s.replace(new RegExp(ARABIC_DIGITS[i],  "g"), String(i));
  }
  return parseInt(s.replace(/[^0-9]/g, ""), 10) || 0;
}
