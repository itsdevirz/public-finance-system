import { Hono } from "hono";
import { ObjectId } from "mongodb";
import { getDb } from "../db/index.js";
import type { JournalDocument, JournalLine } from "../db/types.js";
import { decryptDocument } from "../lib/crypto.js";
import { serialize } from "../lib/helpers.js";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const sanamaCodes = require("../data/sanamaCodes.json");

// ── نقشه ماهیت کدها — یک‌بار در startup ساخته می‌شود ─────────────────────────
const natureMap = new Map<string, "debit" | "credit" | "both">();
for (const group of sanamaCodes.groups ?? []) {
  for (const account of group.accounts ?? []) {
    for (const child of account.children ?? []) {
      if (child.code && child.nature) {
        natureMap.set(String(child.code), child.nature);
      }
    }
  }
}

function getAccountNature(code: string): "debit" | "credit" | "both" | null {
  return natureMap.get(code) ?? null;
}

const router = new Hono();

// ── تابع مشترک اعتبارسنجی مانده حساب — با MongoDB Aggregation ─────────────────
async function validateAccountBalances(
  newLines: JournalLine[],
  excludeId?: string
): Promise<{ valid: false; message: string; error_code: string; account_code: string; total_debit: number; total_credit: number; excess: number } | { valid: true }> {
  if (!newLines.length) return { valid: true };

  // فقط کدهایی که ماهیت محدود (debit یا credit) دارند بررسی می‌شوند
  const codesInDoc = [...new Set(newLines.map(l => String(l.account_code)))];
  const restrictedCodes = codesInDoc.filter(c => {
    const n = getAccountNature(c);
    return n === "debit" || n === "credit";
  });

  if (!restrictedCodes.length) return { valid: true };

  const db = getDb();

  // یک Aggregation Pipeline برای همه کدها — یک query به MongoDB
  const matchStage: Record<string, unknown> = {
    status: { $ne: "CANCELLED" },
    "lines.account_code": { $in: restrictedCodes },
  };
  if (excludeId && ObjectId.isValid(excludeId)) {
    matchStage["_id"] = { $ne: new ObjectId(excludeId) };
  }

  const pipeline = [
    { $match: matchStage },
    { $unwind: "$lines" },
    { $match: { "lines.account_code": { $in: restrictedCodes } } },
    {
      $group: {
        _id: "$lines.account_code",
        histDebit:  { $sum: "$lines.debit" },
        histCredit: { $sum: "$lines.credit" },
      },
    },
  ];

  const historyResult = await db
    .collection<JournalDocument>("journal_documents")
    .aggregate(pipeline)
    .toArray();

  // ساخت نقشه موجودی تاریخی
  const histMap = new Map<string, { debit: number; credit: number }>();
  for (const row of historyResult) {
    histMap.set(String(row._id), { debit: row.histDebit ?? 0, credit: row.histCredit ?? 0 });
  }

  for (const code of restrictedCodes) {
    const nature = getAccountNature(code);
    const hist = histMap.get(code) ?? { debit: 0, credit: 0 };

    const newDebit  = newLines.filter(l => String(l.account_code) === code).reduce((s, l) => s + (Number(l.debit)  || 0), 0);
    const newCredit = newLines.filter(l => String(l.account_code) === code).reduce((s, l) => s + (Number(l.credit) || 0), 0);

    const totalDebit  = hist.debit  + newDebit;
    const totalCredit = hist.credit + newCredit;

    if (nature === "debit" && totalDebit > 0 && totalCredit > totalDebit) {
      const excess = totalCredit - totalDebit;
      return {
        valid: false,
        message: `خطا: معین ${code} (ماهیت بدهکار) تا کنون ${totalDebit.toLocaleString()} ریال بدهکار شده. جمع بستانکارها (${totalCredit.toLocaleString()} ریال) نمی‌تواند از این مقدار بیشتر شود. مازاد: ${excess.toLocaleString()} ریال`,
        error_code: "CREDIT_EXCEEDS_DEBIT",
        account_code: code,
        total_debit: totalDebit,
        total_credit: totalCredit,
        excess,
      };
    }

    if (nature === "credit" && totalCredit > 0 && totalDebit > totalCredit) {
      const excess = totalDebit - totalCredit;
      return {
        valid: false,
        message: `خطا: معین ${code} (ماهیت بستانکار) تا کنون ${totalCredit.toLocaleString()} ریال بستانکار شده. جمع بدهکارها (${totalDebit.toLocaleString()} ریال) نمی‌تواند از این مقدار بیشتر شود. مازاد: ${excess.toLocaleString()} ریال`,
        error_code: "DEBIT_EXCEEDS_CREDIT",
        account_code: code,
        total_debit: totalDebit,
        total_credit: totalCredit,
        excess,
      };
    }
  }

  return { valid: true };
}

// POST /api/documents/migrate
router.post("/migrate", async (c) => {
  const db = getDb();
  const docs = await db.collection<JournalDocument>("journal_documents").find().toArray();
  let updated = 0;

  for (const rawDoc of docs) {
    const serialized = serialize(rawDoc as Record<string, unknown>);
    if (!serialized.ciphertext) continue;

    try {
      const decrypted = decryptDocument(serialized);
      const patch: Record<string, unknown> = {};

      if (!serialized.document_date && decrypted.document_date) {
        patch.document_date = decrypted.document_date;
      }

      if ((!serialized.lines || (serialized.lines as unknown[]).length === 0) && decrypted.lines?.length) {
        patch.lines = decrypted.lines;
      }

      if (Object.keys(patch).length > 0) {
        await db.collection<JournalDocument>("journal_documents").updateOne(
          { _id: rawDoc._id },
          { $set: patch }
        );
        updated++;
      }
    } catch { /* skip */ }
  }

  return c.json({ message: `${updated} سند به‌روزرسانی شد`, updated, total: docs.length });
});

// GET /api/documents — با projection برای کاهش داده منتقله
router.get("/", async (c) => {
  const data = await getDb()
    .collection<JournalDocument>("journal_documents")
    .find()
    .sort({ _id: -1 })
    .toArray();
  const decrypted = data.map((d) => decryptDocument(serialize(d as Record<string, unknown>)));
  return c.json({ data: decrypted, message: "لیست اسناد" });
});

// GET /api/documents/account-balance/:accountCode — با MongoDB Aggregation
router.get("/account-balance/:accountCode", async (c) => {
  const accountCode = c.req.param("accountCode");
  const excludeId   = c.req.query("excludeId");

  const matchStage: Record<string, unknown> = {
    status: { $ne: "CANCELLED" },
    "lines.account_code": accountCode,
  };
  if (excludeId && ObjectId.isValid(excludeId)) {
    matchStage["_id"] = { $ne: new ObjectId(excludeId) };
  }

  const pipeline = [
    { $match: matchStage },
    { $unwind: "$lines" },
    { $match: { "lines.account_code": accountCode } },
    {
      $group: {
        _id: null,
        totalDebit:  { $sum: "$lines.debit" },
        totalCredit: { $sum: "$lines.credit" },
      },
    },
  ];

  const result = await getDb()
    .collection<JournalDocument>("journal_documents")
    .aggregate(pipeline)
    .toArray();

  const totalDebit  = result[0]?.totalDebit  ?? 0;
  const totalCredit = result[0]?.totalCredit ?? 0;

  return c.json({
    accountCode,
    totalDebit,
    totalCredit,
    balance: totalDebit - totalCredit,
  });
});

router.get("/:id", async (c) => {
  const id = c.req.param("id");
  if (!ObjectId.isValid(id)) return c.json({ message: "شناسه نامعتبر" }, 400);
  const doc = await getDb()
    .collection<JournalDocument>("journal_documents")
    .findOne({ _id: new ObjectId(id) });
  if (!doc) return c.json({ message: "سند یافت نشد" }, 404);
  const decrypted = decryptDocument(serialize(doc as Record<string, unknown>));
  return c.json({ data: decrypted });
});

router.post("/", async (c) => {
  const body = await c.req.json();
  const { document_type, fiscal_year, ciphertext, lines = [] } = body;
  if (!document_type || !fiscal_year) {
    return c.json({ message: "document_type و fiscal_year الزامی است" }, 400);
  }

  let resolvedDate: string | undefined = body.document_date;
  let resolvedLines: unknown[] = ciphertext ? [] : lines;
  if (ciphertext) {
    try {
      const preview = decryptDocument({ ciphertext } as any);
      if (preview.document_date) resolvedDate = preview.document_date;
      if (preview.lines?.length) resolvedLines = preview.lines;
    } catch { /* ادامه بده */ }
  }

  const balanceCheck = await validateAccountBalances(resolvedLines as JournalLine[]);
  if (!balanceCheck.valid) {
    return c.json(balanceCheck, 422);
  }

  const document_number = `DOC-${fiscal_year}-${Date.now()}`;
  const result = await getDb()
    .collection<JournalDocument>("journal_documents")
    .insertOne({
      ...body,
      document_number,
      document_date: resolvedDate,
      status: body.status ?? "DRAFT",
      lines: resolvedLines,
    } as JournalDocument);

  const inserted = await getDb()
    .collection<JournalDocument>("journal_documents")
    .findOne({ _id: result.insertedId });
  const decrypted = decryptDocument(serialize(inserted as Record<string, unknown>));
  return c.json({ message: "سند ثبت شد", data: decrypted }, 201);
});

router.patch("/:id/confirm", async (c) => {
  const id = c.req.param("id");
  if (!ObjectId.isValid(id)) return c.json({ message: "شناسه نامعتبر" }, 400);
  const res = await getDb()
    .collection<JournalDocument>("journal_documents")
    .findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { status: "CONFIRMED" } },
      { returnDocument: "after" }
    );
  if (!res) return c.json({ message: "سند یافت نشد" }, 404);
  return c.json({ message: "سند تایید شد", data: serialize(res as Record<string, unknown>) });
});

router.put("/:id", async (c) => {
  const id = c.req.param("id");
  if (!ObjectId.isValid(id)) return c.json({ message: "شناسه نامعتبر" }, 400);

  const body = await c.req.json();
  const { document_type, fiscal_year, ciphertext, lines = [] } = body;

  if (!document_type || !fiscal_year) {
    return c.json({ message: "document_type و fiscal_year الزامی است" }, 400);
  }

  const updateData: Record<string, unknown> = {
    document_type,
    fiscal_year,
    status: body.status ?? "DRAFT",
    lines: ciphertext ? [] : lines,
    ...(ciphertext ? { ciphertext } : {}),
  };

  if (ciphertext) {
    try {
      const preview = decryptDocument({ ciphertext } as any);
      if (preview.document_date) updateData.document_date = preview.document_date;
      if (preview.lines?.length)  updateData.lines = preview.lines;
    } catch { /* ادامه بده */ }
  }

  const newLines = (updateData.lines ?? []) as JournalLine[];
  const balanceCheck = await validateAccountBalances(newLines, id);
  if (!balanceCheck.valid) {
    return c.json(balanceCheck, 422);
  }

  const res = await getDb()
    .collection<JournalDocument>("journal_documents")
    .findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: "after" }
    );

  if (!res) return c.json({ message: "سند یافت نشد" }, 404);
  const decrypted = decryptDocument(serialize(res as Record<string, unknown>));
  return c.json({ message: "سند بروزرسانی شد", data: decrypted });
});

router.delete("/:id", async (c) => {
  const id = c.req.param("id");
  if (!ObjectId.isValid(id)) return c.json({ message: "شناسه نامعتبر" }, 400);

  const res = await getDb()
    .collection<JournalDocument>("journal_documents")
    .deleteOne({ _id: new ObjectId(id) });

  if (res.deletedCount === 0) return c.json({ message: "سند یافت نشد" }, 404);
  return c.json({ message: "سند با موفقیت حذف شد" });
});

export default router;
