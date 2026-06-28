import { Hono } from "hono";
import { ObjectId } from "mongodb";
import { getDb } from "../db/index.js";
import type { Check } from "../db/types.js";

const router = new Hono();

async function generateCheckNumber(fiscalYear: number): Promise<string> {
  const n = await getDb().collection("checks").countDocuments({ fiscal_year: fiscalYear });
  return `CHK-${fiscalYear}-${String(n + 1).padStart(5, "0")}`;
}

function serialize(doc: Record<string, unknown>) {
  return JSON.parse(JSON.stringify(doc, (_k, v) =>
    v instanceof ObjectId ? v.toHexString() : v
  ));
}

// GET /api/checks/
router.get("/", async (c) => {
  const data = await getDb().collection<Check>("checks").find().toArray();
  return c.json({ data: data.map(serialize), message: "لیست چک‌ها" });
});

// GET /api/checks/:id
router.get("/:id", async (c) => {
  const id = c.req.param("id");
  if (!ObjectId.isValid(id)) return c.json({ message: "شناسه نامعتبر" }, 400);
  const check = await getDb().collection<Check>("checks").findOne({ _id: new ObjectId(id) });
  if (!check) return c.json({ message: "چک یافت نشد" }, 404);
  return c.json({ data: serialize(check as Record<string, unknown>) });
});

// POST /api/checks/
router.post("/", async (c) => {
  const body = await c.req.json();
  const {
    check_type = "payment",
    amount,
    payee,
    bank_name,
    account_number,
    issue_date = new Date().toISOString().split("T")[0],
    due_date,
    fiscal_year,
    description,
    agreement_id,
  } = body;

  if (!amount || !fiscal_year) {
    return c.json({ message: "amount و fiscal_year الزامی است" }, 400);
  }

  const check_number = await generateCheckNumber(fiscal_year);
  const db = getDb();

  // Create journal document (with embedded lines)
  const docResult = await db.collection("journal_documents").insertOne({
    document_number: `DOC-CHK-${check_number}`,
    document_type: "PETTY_CASH_PAYMENT",
    status: "DRAFT",
    fiscal_year,
    document_date: issue_date,
    description: `صدور چک ${check_number}`,
    lines: [
      { account_code: "2101", account_name: "تعهدات پرداختنی", debit: amount, credit: 0, is_budgetary: false },
      { account_code: "1101", account_name: "بانک پرداخت هزینه", debit: 0, credit: amount, is_budgetary: false },
    ],
  });

  const checkDoc: Omit<Check, "_id"> = {
    check_number,
    check_type,
    status: "pending",
    amount,
    payee,
    bank_name,
    account_number,
    issue_date,
    due_date,
    fiscal_year,
    description,
    agreement_id: agreement_id ? new ObjectId(agreement_id) : undefined,
    journal_document_id: docResult.insertedId,
  };

  const result = await db.collection<Check>("checks").insertOne(checkDoc as Check);
  const inserted = await db.collection<Check>("checks").findOne({ _id: result.insertedId });

  return c.json({ message: "چک ثبت شد", data: serialize(inserted as Record<string, unknown>) }, 201);
});

// PATCH /api/checks/:id/cancel
router.patch("/:id/cancel", async (c) => {
  const id = c.req.param("id");
  if (!ObjectId.isValid(id)) return c.json({ message: "شناسه نامعتبر" }, 400);
  const { reason } = await c.req.json();

  const db = getDb();
  const check = await db.collection<Check>("checks").findOne({ _id: new ObjectId(id) });
  if (!check) return c.json({ message: "چک یافت نشد" }, 404);
  if (check.status === "cleared") return c.json({ message: "چک وصول‌شده قابل ابطال نیست" }, 400);

  await db.collection<Check>("checks").updateOne(
    { _id: new ObjectId(id) },
    { $set: { status: "cancelled", cancelled_reason: reason } }
  );

  const updated = await db.collection<Check>("checks").findOne({ _id: new ObjectId(id) });
  return c.json({ message: "چک ابطال شد", data: serialize(updated as Record<string, unknown>) });
});

// POST /api/checks/aggregate
router.post("/aggregate", async (c) => {
  const { check_ids } = await c.req.json() as { check_ids: string[] };

  const objectIds = check_ids.map((id) => new ObjectId(id));
  const db = getDb();
  const found = await db.collection<Check>("checks").find({ _id: { $in: objectIds } }).toArray();

  if (found.length !== check_ids.length) {
    return c.json({ message: "برخی چک‌ها یافت نشدند" }, 404);
  }

  const total = found.reduce((s, ch) => s + ch.amount, 0);
  const fiscal_year = found[0].fiscal_year;
  const check_number = await generateCheckNumber(fiscal_year);

  const aggResult = await db.collection<Check>("checks").insertOne({
    check_number,
    check_type: "payment",
    status: "aggregated",
    amount: total,
    payee: found[0].payee,
    bank_name: found[0].bank_name,
    issue_date: new Date().toISOString().split("T")[0],
    fiscal_year,
    description: `چک تجمیعی از ${found.length} چک`,
  } as Check);

  await db.collection<Check>("checks").updateMany(
    { _id: { $in: objectIds } },
    { $set: { status: "aggregated", aggregated_check_id: aggResult.insertedId } }
  );

  const agg = await db.collection<Check>("checks").findOne({ _id: aggResult.insertedId });
  return c.json({ message: "چک‌ها تجمیع شدند", data: serialize(agg as Record<string, unknown>) }, 201);
});

export default router;
