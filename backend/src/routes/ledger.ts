import { Hono } from "hono";
import { ObjectId } from "mongodb";
import { getDb } from "../db/index.js";
import type { JournalDocument } from "../db/types.js";

const router = new Hono();

function serialize(doc: Record<string, unknown>) {
  return JSON.parse(JSON.stringify(doc, (_k, v) =>
    v instanceof ObjectId ? v.toHexString() : v
  ));
}

// GET /api/ledger/ — flatten all embedded lines with their parent doc info
router.get("/", async (c) => {
  const docs = await getDb()
    .collection<JournalDocument>("journal_documents")
    .find()
    .toArray();

  const data = docs.flatMap((doc) =>
    (doc.lines ?? []).map((line) => ({
      doc_id: doc._id?.toHexString(),
      doc_number: doc.document_number,
      doc_date: doc.document_date,
      doc_status: doc.status,
      fiscal_year: doc.fiscal_year,
      ...line,
    }))
  );

  return c.json({ data, message: "دفتر کل" });
});

// GET /api/ledger/balance — total debit vs credit
router.get("/balance", async (c) => {
  const result = await getDb()
    .collection<JournalDocument>("journal_documents")
    .aggregate([
      { $unwind: "$lines" },
      {
        $group: {
          _id: null,
          total_debit: { $sum: "$lines.debit" },
          total_credit: { $sum: "$lines.credit" },
        },
      },
    ])
    .toArray();

  const totals = result[0] ?? { total_debit: 0, total_credit: 0 };
  return c.json({ data: { total_debit: totals.total_debit, total_credit: totals.total_credit }, message: "تراز کل" });
});

export default router;
