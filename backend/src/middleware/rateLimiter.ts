import { createMiddleware } from "hono/factory";

interface RateLimitStore {
  count: number;
  resetTime: number;
}

const memoryStore = new Map<string, RateLimitStore>();

// Clean expired records every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of memoryStore.entries()) {
    if (now > record.resetTime) {
      memoryStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function rateLimiter(options: { windowMs: number; max: number; message?: string }) {
  const { windowMs, max, message = "تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً کمی بعد دوباره تلاش کنید." } = options;

  return createMiddleware(async (c, next) => {
    const ip = c.req.header("x-forwarded-for") || c.req.header("cf-connecting-ip") || "127.0.0.1";
    const path = c.req.path;
    const key = `${ip}:${path}`;

    const now = Date.now();
    let record = memoryStore.get(key);

    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + windowMs };
      memoryStore.set(key, record);
    } else {
      record.count += 1;
    }

    c.header("X-RateLimit-Limit", max.toString());
    c.header("X-RateLimit-Remaining", Math.max(0, max - record.count).toString());
    c.header("X-RateLimit-Reset", Math.ceil(record.resetTime / 1000).toString());

    if (record.count > max) {
      return c.json({ success: false, message }, 429);
    }

    await next();
  });
}
