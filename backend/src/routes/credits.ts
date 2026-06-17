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

router.get("/", (_c) => _c.json({ message: "اعتبارات" }));

export default router;
