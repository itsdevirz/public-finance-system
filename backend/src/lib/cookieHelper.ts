import { Context } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";

// نام کوکی امن با رعایت پیشوند استاندارد W3C برای Host-Only Cookie
export const SECURE_COOKIE_NAME = "__Host-auth_token";
export const FALLBACK_COOKIE_NAME = "auth_token";

export interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "Strict" | "Lax" | "None";
  path: string;
  maxAge: number;
  domain?: undefined; // عدم وجود domain برای برقراری ویژگی Host-Only
}

/**
 * پیکربندی سرآیند کوکی امن مطابق با الزامات امنیتی (HttpOnly, Secure, SameSite, Host-Only)
 */
export function setSecureAuthCookie(c: Context, token: string, maxAgeSeconds: number = 86400) {
  const isHttps = c.req.url.startsWith("https://") || c.req.header("x-forwarded-proto") === "https" || process.env.NODE_ENV === "production";

  // ۱. پیکربندی کوکی اصلی Host-Only (با پیشوند __Host-)
  // ویژگی Host-Only نیازمند عدم تعریف Domain، تنظیم Path=/ و فعال بودن Secure است.
  if (isHttps) {
    setCookie(c, SECURE_COOKIE_NAME, token, {
      path: "/",
      secure: true,
      httpOnly: true,
      sameSite: "Strict",
      maxAge: maxAgeSeconds,
    });
  }

  // ۲. تنظیم کوکی پشتیبان برای محیط توسعه محلی بدون HTTPS (با حفظ HttpOnly و SameSite)
  setCookie(c, FALLBACK_COOKIE_NAME, token, {
    path: "/",
    secure: isHttps,
    httpOnly: true,
    sameSite: "Strict",
    maxAge: maxAgeSeconds,
  });
}

/**
 * دریافت توکن احراز هویت از کوکی یا هدر Authorization
 */
export function getAuthTokenFromCookieOrHeader(c: Context): string | null {
  // اولویت ۱: هدر Authorization
  const authHeader = c.req.header("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  // اولویت ۲: کوکی امن Host-Only
  const secureCookie = getCookie(c, SECURE_COOKIE_NAME);
  if (secureCookie) {
    return secureCookie;
  }

  // اولویت ۳: کوکی پشتیبان
  const fallbackCookie = getCookie(c, FALLBACK_COOKIE_NAME);
  if (fallbackCookie) {
    return fallbackCookie;
  }

  return null;
}

/**
 * پاکسازی و ابطال کوکی امن در هنگام خروج (Logout)
 */
export function clearSecureAuthCookie(c: Context) {
  deleteCookie(c, SECURE_COOKIE_NAME, { path: "/", secure: true });
  deleteCookie(c, FALLBACK_COOKIE_NAME, { path: "/" });
}
