import { Hono } from "hono";
import { ObjectId } from "mongodb";
import { getDb } from "../db/index.js";
import type { Review } from "../db/types.js";

const router = new Hono();

function serialize(doc: Record<string, unknown>) {
  return JSON.parse(JSON.stringify(doc, (_k, v) =>
    v instanceof ObjectId ? v.toHexString() : v
  ));
}

router.get("/", async (c) => {
  const data = await getDb().collection<Review>("reviews").find().toArray();
  return c.json({ data: data.map((d) => serialize(d as Record<string, unknown>)), message: "لیست تنخواه‌ها" });
});

router.get("/:id", async (c) => {
  const id = c.req.param("id");
  if (!ObjectId.isValid(id)) return c.json({ message: "شناسه نامعتبر" }, 400);
  const review = await getDb().collection<Review>("reviews").findOne({ _id: new ObjectId(id) });
  if (!review) return c.json({ message: "تنخواه یافت نشد" }, 404);
  return c.json({ data: serialize(review as Record<string, unknown>) });
});

router.post("/", async (c) => {
  const body = await c.req.json();
  const { review_type, fiscal_year, amount } = body;
  if (!review_type || !fiscal_year || !amount) {
    return c.json({ message: "review_type، fiscal_year و amount الزامی است" }, 400);
  }

  const review_number = `REV-${fiscal_year}-${Date.now()}`;
  const result = await getDb().collection<Review>("reviews").insertOne({
    ...body, review_number, status: body.status ?? "draft",
  });
  const inserted = await getDb().collection<Review>("reviews").findOne({ _id: result.insertedId });
  return c.json({ message: "تنخواه ثبت شد", data: serialize(inserted as Record<string, unknown>) }, 201);
});

router.patch("/:id/status", async (c) => {
  const id = c.req.param("id");
  if (!ObjectId.isValid(id)) return c.json({ message: "شناسه نامعتبر" }, 400);
  const { status } = await c.req.json();
  const res = await getDb().collection<Review>("reviews").findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { status } },
    { returnDocument: "after" }
  );
  if (!res) return c.json({ message: "تنخواه یافت نشد" }, 404);
  return c.json({ message: "وضعیت تنخواه به‌روز شد", data: serialize(res as Record<string, unknown>) });
});

export default router;
