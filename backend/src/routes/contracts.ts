import { Hono } from "hono";
import { ObjectId } from "mongodb";
import { getDb } from "../db/index.js";
import type { Contract } from "../db/types.js";

const router = new Hono();

function serialize(doc: Record<string, unknown>) {
  return JSON.parse(JSON.stringify(doc, (_k, v) =>
    v instanceof ObjectId ? v.toHexString() : v
  ));
}

router.get("/", async (c) => {
  const data = await getDb().collection<Contract>("contracts").find().toArray();
  return c.json({ data: data.map((d) => serialize(d as Record<string, unknown>)), message: "لیست قراردادها" });
});

router.get("/:id", async (c) => {
  const id = c.req.param("id");
  if (!ObjectId.isValid(id)) return c.json({ message: "شناسه نامعتبر" }, 400);
  const contract = await getDb().collection<Contract>("contracts").findOne({ _id: new ObjectId(id) });
  if (!contract) return c.json({ message: "قرارداد یافت نشد" }, 404);
  return c.json({ data: serialize(contract as Record<string, unknown>) });
});

router.post("/", async (c) => {
  const body = await c.req.json();
  const { title, contractor_name, amount, fiscal_year } = body;
  if (!title || !contractor_name || !amount || !fiscal_year) {
    return c.json({ message: "فیلدهای الزامی: title، contractor_name، amount، fiscal_year" }, 400);
  }

  const contract_number = `CNT-${fiscal_year}-${Date.now()}`;
  const result = await getDb().collection<Contract>("contracts").insertOne({
    ...body,
    contract_number,
    status: body.status ?? "draft",
    deductions: body.deductions ?? [],
    payments: body.payments ?? [],
    addenda: body.addenda ?? [],
  });
  const inserted = await getDb().collection<Contract>("contracts").findOne({ _id: result.insertedId });
  return c.json({ message: "قرارداد ثبت شد", data: serialize(inserted as Record<string, unknown>) }, 201);
});

router.patch("/:id", async (c) => {
  const id = c.req.param("id");
  if (!ObjectId.isValid(id)) return c.json({ message: "شناسه نامعتبر" }, 400);
  const body = await c.req.json();
  const res = await getDb().collection<Contract>("contracts").findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: body },
    { returnDocument: "after" }
  );
  if (!res) return c.json({ message: "قرارداد یافت نشد" }, 404);
  return c.json({ message: "قرارداد به‌روز شد", data: serialize(res as Record<string, unknown>) });
});

router.delete("/:id", async (c) => {
  const id = c.req.param("id");
  if (!ObjectId.isValid(id)) return c.json({ message: "شناسه نامعتبر" }, 400);
  await getDb().collection<Contract>("contracts").deleteOne({ _id: new ObjectId(id) });
  return c.json({ message: "قرارداد حذف شد" });
});

export default router;
