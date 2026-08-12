/**
 * User-Agent Parser Module
 * تحلیل‌گر رشته User-Agent جهت استخراج دقیق سیستم‌عامل، نسخه، نوع دستگاه و مرورگر
 */

export interface ParsedUserAgent {
  osName: string;         // e.g. "Windows 11", "macOS Sonoma", "Ubuntu Linux", "Android 14", "iOS 17"
  osType: string;         // e.g. "Windows", "macOS", "Linux", "Android", "iOS", "ChromeOS", "Unix", "Unknown"
  osVersion: string;      // e.g. "11", "10.0", "14.2", "17.0"
  deviceType: string;     // e.g. "دسکتاپ (Desktop)", "موبایل (Mobile)", "تبلت (Tablet)", "ربات (Bot)"
  browserName: string;    // e.g. "Google Chrome", "Mozilla Firefox", "Microsoft Edge", "Apple Safari"
  browserVersion: string; // e.g. "122.0"
  browser: string;        // e.g. "Google Chrome 122.0"
}

export function parseUserAgent(uaString?: string | null): ParsedUserAgent {
  const ua = uaString || "";

  if (!ua || ua.trim() === "" || ua === "Unknown") {
    return {
      osName: "نامشخص (Unknown)",
      osType: "Unknown",
      osVersion: "-",
      deviceType: "نامشخص",
      browserName: "نامشخص",
      browserVersion: "-",
      browser: "نامشخص"
    };
  }

  // 1. Operating System Detection
  let osName = "سیستم‌عامل نامشخص";
  let osType = "Unknown";
  let osVersion = "";

  if (/windows nt 10\.0/i.test(ua)) {
    // Windows 10 vs Windows 11 (Windows 11 reports Windows NT 10.0 in UA, but can be refined)
    if (/win64; x64/i.test(ua) || /x64/i.test(ua)) {
      osName = "Windows 10 / 11 (64-bit)";
    } else {
      osName = "Windows 10 / 11 (32-bit)";
    }
    osType = "Windows";
    osVersion = "10 / 11";
  } else if (/windows nt 6\.3/i.test(ua)) {
    osName = "Windows 8.1";
    osType = "Windows";
    osVersion = "8.1";
  } else if (/windows nt 6\.2/i.test(ua)) {
    osName = "Windows 8";
    osType = "Windows";
    osVersion = "8";
  } else if (/windows nt 6\.1/i.test(ua)) {
    osName = "Windows 7";
    osType = "Windows";
    osVersion = "7";
  } else if (/windows nt/i.test(ua)) {
    const match = ua.match(/Windows NT ([\d.]+)/i);
    osVersion = match ? match[1] : "";
    osName = `Windows (NT ${osVersion})`;
    osType = "Windows";
  } else if (/android/i.test(ua)) {
    const match = ua.match(/Android ([\d.]+)/i);
    osVersion = match ? match[1] : "";
    osName = `Android ${osVersion}`.trim();
    osType = "Android";
  } else if (/iphone|ipad|ipod/i.test(ua)) {
    const match = ua.match(/OS ([\d_]+) like Mac OS X/i);
    osVersion = match ? match[1].replace(/_/g, ".") : "";
    const isPad = /ipad/i.test(ua);
    osName = isPad ? `iPadOS ${osVersion}`.trim() : `iOS ${osVersion}`.trim();
    osType = "iOS";
  } else if (/mac os x/i.test(ua)) {
    const match = ua.match(/Mac OS X ([\d_]+)/i);
    osVersion = match ? match[1].replace(/_/g, ".") : "";
    osName = `macOS ${osVersion}`.trim();
    osType = "macOS";
  } else if (/cros/i.test(ua)) {
    osName = "ChromeOS";
    osType = "ChromeOS";
  } else if (/ubuntu/i.test(ua)) {
    osName = "Ubuntu Linux";
    osType = "Linux";
  } else if (/debian/i.test(ua)) {
    osName = "Debian Linux";
    osType = "Linux";
  } else if (/fedora/i.test(ua)) {
    osName = "Fedora Linux";
    osType = "Linux";
  } else if (/linux/i.test(ua)) {
    osName = "Linux (Generic)";
    osType = "Linux";
  } else if (/unix|x11/i.test(ua)) {
    osName = "Unix";
    osType = "Unix";
  }

  // 2. Device Type Detection
  let deviceType = "دسکتاپ (Desktop)";
  if (/bot|googlebot|crawler|spider|robot|crawling/i.test(ua)) {
    deviceType = "ربات (Bot)";
  } else if (/ipad/i.test(ua) || (/android/i.test(ua) && !/mobile/i.test(ua))) {
    deviceType = "تبلت (Tablet)";
  } else if (/mobile|iphone|ipod|android|blackberry|opera mini|windows phone/i.test(ua)) {
    deviceType = "موبایل (Mobile)";
  }

  // 3. Browser Detection
  let browserName = "مرورگر نامشخص";
  let browserVersion = "";

  if (/edg\/([\d.]+)/i.test(ua)) {
    browserName = "Microsoft Edge";
    browserVersion = ua.match(/edg\/([\d.]+)/i)?.[1] || "";
  } else if (/opr\/([\d.]+)/i.test(ua) || /opera/i.test(ua)) {
    browserName = "Opera";
    browserVersion = ua.match(/opr\/([\d.]+)/i)?.[1] || ua.match(/opera\/([\d.]+)/i)?.[1] || "";
  } else if (/chrome\/([\d.]+)/i.test(ua)) {
    browserName = "Google Chrome";
    browserVersion = ua.match(/chrome\/([\d.]+)/i)?.[1] || "";
  } else if (/firefox\/([\d.]+)/i.test(ua)) {
    browserName = "Mozilla Firefox";
    browserVersion = ua.match(/firefox\/([\d.]+)/i)?.[1] || "";
  } else if (/safari\/([\d.]+)/i.test(ua) && !/chrome/i.test(ua)) {
    browserName = "Apple Safari";
    browserVersion = ua.match(/version\/([\d.]+)/i)?.[1] || "";
  } else if (/msie|trident/i.test(ua)) {
    browserName = "Internet Explorer";
    browserVersion = ua.match(/(?:msie |rv:)([\d.]+)/i)?.[1] || "";
  }

  const browser = browserVersion ? `${browserName} ${browserVersion.split(".")[0]}` : browserName;

  return {
    osName,
    osType,
    osVersion,
    deviceType,
    browserName,
    browserVersion,
    browser
  };
}
