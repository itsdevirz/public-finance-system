import { Hono } from "hono";
import { ObjectId } from "mongodb";
import { getDb } from "../db/index.js";
import type { Agreement, CreditAllocation, CreditReceipt, CreditDelegation } from "../db/types.js";

const router = new Hono();

function serialize(doc: Record<string, unknown>) {
  return JSON.parse(JSON.stringify(doc, (_k, v) =>
    v instanceof ObjectId ? v.toHexString() : v
  ));
}

// ─── Agreements ───────────────────────────────────────────────────────────────

router.get("/agreements", async (c) => {
  const data = await getDb().collection<Agreement>("agreements").find().toArray();
  return c.json({ data: data.map((d) => serialize(d as Record<string, unknown>)), message: "لیست موافقتنامه‌ها" });
});

router.post("/agreements", async (c) => {
  const body = await c.req.json();
  const agreement_number = `AGR-${body.fiscal_year}-${Date.now()}`;
  const result = await getDb().collection<Agreement>("agreements").insertOne({
    ...body, agreement_number, status: body.status ?? "draft",
  });
  const inserted = await getDb().collection<Agreement>("agreements").findOne({ _id: result.insertedId });
  return c.json({ message: "موافقتنامه ثبت شد", data: serialize(inserted as Record<string, unknown>) }, 201);
});

// ─── Allocations ──────────────────────────────────────────────────────────────

router.get("/allocations", async (c) => {
  const data = await getDb().collection<CreditAllocation>("credit_allocations").find().toArray();
  return c.json({ data: data.map((d) => serialize(d as Record<string, unknown>)), message: "لیست تخصیص‌ها" });
});

router.post("/allocations", async (c) => {
  const body = await c.req.json();
  const allocation_number = `ALLOC-${body.fiscal_year}-${Date.now()}`;
  const result = await getDb().collection<CreditAllocation>("credit_allocations").insertOne({
    ...body,
    allocation_number,
    status: body.status ?? "draft",
    agreement_id: body.agreement_id ? new ObjectId(body.agreement_id) : undefined,
  });
  const inserted = await getDb().collection<CreditAllocation>("credit_allocations").findOne({ _id: result.insertedId });
  return c.json({ message: "تخصیص ثبت شد", data: serialize(inserted as Record<string, unknown>) }, 201);
});

// ─── Receipts ─────────────────────────────────────────────────────────────────

router.get("/receipts", async (c) => {
  const data = await getDb().collection<CreditReceipt>("credit_receipts").find().toArray();
  return c.json({ data: data.map((d) => serialize(d as Record<string, unknown>)), message: "لیست دریافت‌های اعتبار" });
});

router.post("/receipts", async (c) => {
  const body = await c.req.json();
  const receipt_number = `REC-${body.fiscal_year}-${Date.now()}`;
  const result = await getDb().collection<CreditReceipt>("credit_receipts").insertOne({
    ...body,
    receipt_number,
    allocation_id: body.allocation_id ? new ObjectId(body.allocation_id) : undefined,
  });
  const inserted = await getDb().collection<CreditReceipt>("credit_receipts").findOne({ _id: result.insertedId });
  return c.json({ message: "دریافت اعتبار ثبت شد", data: serialize(inserted as Record<string, unknown>) }, 201);
});

// ─── Delegations ──────────────────────────────────────────────────────────────

router.get("/delegations", async (c) => {
  const data = await getDb().collection<CreditDelegation>("credit_delegations").find().toArray();
  return c.json({ data: data.map((d) => serialize(d as Record<string, unknown>)), message: "لیست تفویض اعتبار" });
});

router.post("/delegations", async (c) => {
  const body = await c.req.json();
  const delegation_number = `DEL-${body.fiscal_year}-${Date.now()}`;
  const result = await getDb().collection<CreditDelegation>("credit_delegations").insertOne({
    ...body,
    delegation_number,
    status: body.status ?? "pending",
    journal_document_id: body.journal_document_id ? new ObjectId(body.journal_document_id) : undefined,
  });
  const inserted = await getDb().collection<CreditDelegation>("credit_delegations").findOne({ _id: result.insertedId });
  return c.json({ message: "تفویض اعتبار ثبت شد", data: serialize(inserted as Record<string, unknown>) }, 201);
});

// ─── Credit Definitions (تعریف اعتبار) ───────────────────────────────────────

router.get("/definitions", async (c) => {
  const data = await getDb().collection("credit_definitions").find().sort({ createdAt: -1 }).toArray();
  return c.json({ data: data.map((d) => serialize(d as Record<string, unknown>)), message: "لیست اعتبارهای تعریف‌شده" });
});

router.post("/definitions", async (c) => {
  const body = await c.req.json();
  const doc = {
    ...body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const result = await getDb().collection("credit_definitions").insertOne(doc);
  const inserted = await getDb().collection("credit_definitions").findOne({ _id: result.insertedId });
  return c.json({ message: "اعتبار با موفقیت ثبت شد", data: serialize(inserted as Record<string, unknown>) }, 201);
});

router.put("/definitions/:id", async (c) => {
  const id = c.req.param("id");
  let oid: import("mongodb").ObjectId;
  try {
    oid = new ObjectId(id);
  } catch {
    return c.json({ message: "شناسه نامعتبر است" }, 400);
  }
  const body = await c.req.json();
  const { _id, createdAt, ...updateData } = body;
  const result = await getDb().collection("credit_definitions").findOneAndUpdate(
    { _id: oid },
    { $set: { ...updateData, updatedAt: new Date().toISOString() } },
    { returnDocument: "after" }
  );
  if (!result) return c.json({ message: "اعتبار یافت نشد" }, 404);
  return c.json({ message: "اعتبار با موفقیت ویرایش شد", data: serialize(result as Record<string, unknown>) });
});

router.delete("/definitions/:id", async (c) => {
  const id = c.req.param("id");
  let oid: import("mongodb").ObjectId;
  try {
    oid = new ObjectId(id);
  } catch {
    return c.json({ message: "شناسه نامعتبر است" }, 400);
  }
  const result = await getDb().collection("credit_definitions").deleteOne({ _id: oid });
  if (result.deletedCount === 0) return c.json({ message: "اعتبار یافت نشد" }, 404);
  return c.json({ message: "اعتبار با موفقیت حذف شد" });
});

router.get("/", (_c) => _c.json({ message: "اعتبارات" }));

export default router;
