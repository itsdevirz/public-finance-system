import { Hono } from "hono";
import { ObjectId } from "mongodb";
import { getDb } from "../db/index.js";
import type { JournalDocument } from "../db/types.js";
import { decryptDocument } from "../lib/crypto.js";

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

  const data = docs.flatMap((doc) => {
    const decrypted = decryptDocument(serialize(doc as Record<string, unknown>));
    return (decrypted.lines ?? []).map((line: any) => ({
      doc_id: decrypted._id,
      doc_number: decrypted.document_number,
      doc_date: decrypted.document_date,
      doc_status: decrypted.status,
      fiscal_year: decrypted.fiscal_year,
      ...line,
    }));
  });

  return c.json({ data, message: "دفتر کل" });
});

// GET /api/ledger/balance — total debit vs credit
router.get("/balance", async (c) => {
  const docs = await getDb()
    .collection<JournalDocument>("journal_documents")
    .find()
    .toArray();

  let total_debit = 0;
  let total_credit = 0;

  for (const doc of docs) {
    const decrypted = decryptDocument(serialize(doc as Record<string, unknown>));
    for (const line of decrypted.lines ?? []) {
      total_debit += line.debit ?? 0;
      total_credit += line.credit ?? 0;
    }
  }

  return c.json({ data: { total_debit, total_credit }, message: "تراز کل" });
});

export default router;
