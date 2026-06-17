import { Hono } from "hono";
import { ObjectId } from "mongodb";
import { getDb } from "../db/index.js";
import { hashPassword, verifyPassword, signToken, verifyToken } from "../lib/auth.js";

const router = new Hono();

// POST /api/auth/register  (فقط برای ساخت اولین ادمین — در محیط production غیرفعال کن)
router.post("/register", async (c) => {
  const { username, password, role = "user" } = await c.req.json();
  if (!username || !password) {
    return c.json({ message: "username و password الزامی است" }, 400);
  }

  const db = getDb();
  const exists = await db.collection("users").findOne({ username });
  if (exists) return c.json({ message: "این نام کاربری قبلاً ثبت شده" }, 409);

  const hashed = await hashPassword(password);
  const result = await db.collection("users").insertOne({ username, password: hashed, role, created_at: new Date() });

  return c.json({ message: "کاربر ثبت شد", id: result.insertedId.toHexString() }, 201);
});

// POST /api/auth/login
router.post("/login", async (c) => {
  const { username, password } = await c.req.json();
  if (!username || !password) {
    return c.json({ message: "username و password الزامی است" }, 400);
  }

  const db = getDb();
  const user = await db.collection("users").findOne({ username });

  // زمان پاسخ یکسان تا از timing attack جلوگیری بشه
  const valid = user ? await verifyPassword(password, user.password as string) : await verifyPassword(password, "$2b$12$invalidhashpadding000000000000000000000000000000000000");

  if (!user || !valid) {
    return c.json({ message: "نام کاربری یا رمز عبور اشتباه است" }, 401);
  }

  const token = signToken({ sub: (user._id as ObjectId).toHexString(), username: user.username, role: user.role });

  return c.json({
    message: "ورود موفق",
    token,
    user: { id: (user._id as ObjectId).toHexString(), username: user.username, role: user.role },
  });
});

// GET /api/auth/me  (نیاز به توکن دارد)
router.get("/me", async (c) => {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) return c.json({ message: "توکن یافت نشد" }, 401);

  const payload = verifyToken(header.slice(7));
  if (!payload) return c.json({ message: "توکن نامعتبر یا منقضی شده" }, 401);

  const user = await getDb().collection("users").findOne({ _id: new ObjectId(payload.sub) });
  if (!user) return c.json({ message: "کاربر یافت نشد" }, 404);

  return c.json({ user: { id: payload.sub, username: user.username, role: user.role } });
});

export default router;
