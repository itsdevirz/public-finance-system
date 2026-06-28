import { createMiddleware } from "hono/factory";
import { verifyToken } from "../lib/auth.js";

export const requireAuth = createMiddleware(async (c, next) => {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return c.json({ message: "احراز هویت الزامی است" }, 401);
  }

  const payload = verifyToken(header.slice(7));
  if (!payload) {
    return c.json({ message: "توکن نامعتبر یا منقضی شده" }, 401);
  }

  // payload رو به context اضافه کن تا route‌ها بتونن ازش استفاده کنن
  c.set("jwtPayload", payload);
  await next();
});
