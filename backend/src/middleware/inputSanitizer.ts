import { createMiddleware } from "hono/factory";

function isNoSqlInjection(val: any): boolean {
  if (val && typeof val === "object") {
    const keys = Object.keys(val);
    for (const key of keys) {
      if (key.startsWith("$") || key.includes(".")) {
        return true;
      }
      if (isNoSqlInjection(val[key])) return true;
    }
  }
  return false;
}

function sanitizeValue(val: any): any {
  if (typeof val === "string") {
    // Escape HTML tags to prevent XSS in reflected responses
    return val
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/javascript:/gi, "")
      .replace(/data:/gi, "data_clean:");
  }
  if (Array.isArray(val)) {
    return val.map(sanitizeValue);
  }
  if (val && typeof val === "object") {
    const cleaned: Record<string, any> = {};
    for (const key of Object.keys(val)) {
      if (key.startsWith("$")) continue; // Strip MongoDB operator keys injected in user body
      cleaned[key] = sanitizeValue(val[key]);
    }
    return cleaned;
  }
  return val;
}

export const inputSanitizer = createMiddleware(async (c, next) => {
  const url = c.req.url;

  // Path Traversal Check
  if (url.includes("../") || url.includes("..\\") || url.includes("%2e%2e")) {
    return c.json({ success: false, message: "مسیریابی غیرمجاز (Path Traversal Detected)" }, 400);
  }

  // Check query params for NoSQL Injection
  const query = c.req.query();
  for (const [k, v] of Object.entries(query)) {
    if (k.startsWith("$") || v.includes("$where") || v.includes("$ne")) {
      return c.json({ success: false, message: "پارامتر غیرمجاز یا ناامن (NoSQL Injection Detected)" }, 400);
    }
  }

  await next();
});
