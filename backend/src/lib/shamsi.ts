/**
 * Solar Hijri (Jalali / Shamsi) & Geolocation/Timezone Utility Module
 * تبدیل تاریخ میلادی به هجری شمسی و استخراج موقعیت و تایم‌زون
 */

export interface ShamsiDateDetails {
  shamsiDate: string;        // e.g. "1405/05/22"
  shamsiDateTime: string;    // e.g. "1405/05/22 20:16:53"
  shamsiTime: string;        // e.g. "20:16:53"
  shamsiYear: number;        // e.g. 1405
  shamsiMonth: number;       // e.g. 5
  shamsiDay: number;         // e.g. 22
  shamsiMonthName: string;   // e.g. "مرداد"
  shamsiDayOfWeek: string;   // e.g. "چهارشنبه"
}

const SHAMSI_MONTH_NAMES = [
  "فروردین", "اردیبهشت", "خرداد",
  "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر",
  "دی", "بهمن", "اسفند"
];

const PERSIAN_WEEK_DAYS = [
  "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه", "شنبه"
];

/**
 * الگوریتم دقیق تبدیل تاریخ میلادی به هجری شمسی (Jalali Converter)
 */
export function gregorianToJalali(gy: number, gm: number, gd: number): { jy: number; jm: number; jd: number } {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = (gy <= 1600) ? 0 : 979;
  gy -= (gy <= 1600) ? 621 : 1600;
  const gy2 = (gm > 2) ? (gy + 1) : gy;
  let days = (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) - 80 + gd + g_d_m[gm - 1];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let jm: number;
  let jd: number;
  if (days < 186) {
    jm = 1 + Math.floor(days / 31);
    jd = 1 + (days % 31);
  } else {
    jm = 7 + Math.floor((days - 186) / 30);
    jd = 1 + ((days - 186) % 30);
  }
  return { jy, jm, jd };
}

/**
 * دریافت جزئیات تاریخ شمسی از شیء Date
 */
export function getShamsiDetails(date: Date = new Date()): ShamsiDateDetails {
  const gy = date.getFullYear();
  const gm = date.getMonth() + 1;
  const gd = date.getDate();

  const { jy, jm, jd } = gregorianToJalali(gy, gm, gd);

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  const shamsiMonthStr = String(jm).padStart(2, "0");
  const shamsiDayStr = String(jd).padStart(2, "0");

  const shamsiDate = `${jy}/${shamsiMonthStr}/${shamsiDayStr}`;
  const shamsiTime = `${hours}:${minutes}:${seconds}`;
  const shamsiDateTime = `${shamsiDate} ${shamsiTime}`;

  const shamsiMonthName = SHAMSI_MONTH_NAMES[jm - 1] || "";
  const shamsiDayOfWeek = PERSIAN_WEEK_DAYS[date.getDay()] || "";

  return {
    shamsiDate,
    shamsiDateTime,
    shamsiTime,
    shamsiYear: jy,
    shamsiMonth: jm,
    shamsiDay: jd,
    shamsiMonthName,
    shamsiDayOfWeek
  };
}

/**
 * تشخیص نوع شبکه و موقعیت مکانی از روی آدرس IP
 */
export function resolveIpLocation(ip?: string | null, customLocation?: string | null): string {
  if (customLocation && customLocation.trim() !== "") {
    return customLocation;
  }

  const cleanIp = (ip || "127.0.0.1").replace(/^::ffff:/, "").trim();

  if (
    cleanIp === "127.0.0.1" ||
    cleanIp === "::1" ||
    cleanIp === "localhost" ||
    cleanIp.startsWith("192.168.") ||
    cleanIp.startsWith("10.") ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(cleanIp)
  ) {
    return "شبکه داخلی (LAN) / Localhost";
  }

  return `ایران (آی‌پای عمومی WAN: ${cleanIp})`;
}

/**
 * استخراج تایم‌زون سیستم/کاربر
 */
export function resolveTimezone(headerTimezone?: string | null): string {
  if (headerTimezone && headerTimezone.trim() !== "") {
    return headerTimezone.trim();
  }
  try {
    const defaultTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (defaultTz) {
      return `${defaultTz} (UTC+03:30)`;
    }
  } catch (_) {}
  return "Asia/Tehran (UTC+03:30)";
}
