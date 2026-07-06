import { Hono } from "hono";
import { ObjectId } from "mongodb";
import { getDb } from "../db/index.js";
import type { JournalDocument, JournalLine } from "../db/types.js";
import { decryptDocument } from "../lib/crypto.js";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const sanamaCodes = require("../data/sanamaCodes.json");

// ── ماهیت یک کد معین از sanamaCodes ─────────────────────────────────────────
function getAccountNature(code: string): "debit" | "credit" | "both" | null {
  for (const group of sanamaCodes.groups) {
    for (const account of group.accounts) {
      const found = account.children?.find((c: { code: string; nature: string }) => c.code === code);
      if (found) return found.nature ?? null;
    }
  }
  return null;
}

const router = new Hono();

function serialize(doc: Record<string, unknown>) {
  return JSON.parse(JSON.stringify(doc, (_k, v) =>
    v instanceof ObjectId ? v.toHexString() : v
  ));
}

// ── تابع مشترک اعتبارسنجی مانده حساب ─────────────────────────────────────────
async function validateAccountBalances(
  newLines: JournalLine[],
  excludeId?: string
): Promise<{ valid: false; message: string; error_code: string; account_code: string; total_debit: number; total_credit: number; excess: number } | { valid: true }> {
  if (!newLines.length) return { valid: true };

  // کدهایی که در سند جدید بستانکار یا بدهکار می‌شن
  const codesInDoc = [...new Set(newLines.map(l => String(l.account_code)))];

  const db = getDb();
  const allDocs = await db.collection<JournalDocument>("journal_documents")
    .find({ status: { $ne: "CANCELLED" } })
    .toArray();

  for (const code of codesInDoc) {
    const nature = getAccountNature(code);
    if (!nature || nature === "both") continue; // "both" = بدون محدودیت

    // تاریخچه موجود (بدون سند جاری)
    let histDebit = 0, histCredit = 0;
    for (const rawDoc of allDocs) {
      const doc = serialize(rawDoc as Record<string, unknown>);
      if (excludeId && doc._id === excludeId) continue;
      let docLines = doc.lines as JournalLine[] | undefined;
      if ((!docLines || docLines.length === 0) && doc.ciphertext) {
        try { docLines = (decryptDocument(doc as any)).lines ?? []; } catch { continue; }
      }
      if (!docLines) continue;
      for (const line of docLines) {
        if (String(line.account_code) === code) {
          histDebit  += Number(line.debit)  || 0;
          histCredit += Number(line.credit) || 0;
        }
      }
    }

    // مقادیر در سند جدید
    const newDebit  = newLines.filter(l => String(l.account_code) === code).reduce((s, l) => s + (Number(l.debit)  || 0), 0);
    const newCredit = newLines.filter(l => String(l.account_code) === code).reduce((s, l) => s + (Number(l.credit) || 0), 0);

    const totalDebit  = histDebit  + newDebit;
    const totalCredit = histCredit + newCredit;

    if (nature === "debit" && totalDebit > 0 && totalCredit > totalDebit) {
      // ماهیت بدهکار: بستانکار نباید از بدهکار بیشتر بشه
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
      // ماهیت بستانکار: بدهکار نباید از بستانکار بیشتر بشه
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

// POST /api/documents/migrate — اسناد قدیمی که document_date یا lines ندارند را اصلاح کن
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

router.get("/", async (c) => {
  const data = await getDb().collection<JournalDocument>("journal_documents").find().toArray();
  const decrypted = data.map((d) => decryptDocument(serialize(d as Record<string, unknown>)));
  return c.json({ data: decrypted, message: "لیست اسناد" });
});

// GET /api/documents/account-balance/:accountCode — موجودی یک معین از همه اسناد
router.get("/account-balance/:accountCode", async (c) => {
  const accountCode = c.req.param("accountCode");
  const excludeId = c.req.query("excludeId"); // برای ویرایش سند — سند جاری رو حذف کن

  const docs = await getDb()
    .collection<JournalDocument>("journal_documents")
    .find({ status: { $ne: "CANCELLED" } })
    .toArray();

  let totalDebit = 0;
  let totalCredit = 0;

  for (const rawDoc of docs) {
    const doc = serialize(rawDoc as Record<string, unknown>);
    if (excludeId && doc._id === excludeId) continue;

    let lines = doc.lines as JournalLine[] | undefined;

    // اگر lines خالیه، از ciphertext استخراج کن
    if ((!lines || lines.length === 0) && doc.ciphertext) {
      try {
        const decrypted = decryptDocument(doc as any);
        lines = decrypted.lines ?? [];
      } catch { continue; }
    }

    if (!lines) continue;

    for (const line of lines) {
      if (String(line.account_code) === String(accountCode)) {
        totalDebit  += Number(line.debit)  || 0;
        totalCredit += Number(line.credit) || 0;
      }
    }
  }

  return c.json({
    accountCode,
    totalDebit,
    totalCredit,
    balance: totalDebit - totalCredit, // موجودی: مثبت = بدهکار، منفی = بستانکار
  });
});

router.get("/:id", async (c) => {
  const id = c.req.param("id");
  if (!ObjectId.isValid(id)) return c.json({ message: "شناسه نامعتبر" }, 400);
  const doc = await getDb().collection<JournalDocument>("journal_documents").findOne({ _id: new ObjectId(id) });
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

  // تاریخ و ردیف‌ها را از ciphertext استخراج کن تا در دیتابیس ذخیره شوند
  let resolvedDate: string | undefined = body.document_date;
  let resolvedLines: unknown[] = ciphertext ? [] : lines;
  if (ciphertext) {
    try {
      const preview = decryptDocument({ ciphertext } as any);
      if (preview.document_date) resolvedDate = preview.document_date;
      if (preview.lines?.length) resolvedLines = preview.lines;
    } catch { /* ادامه بده */ }
  }

  // ── اعتبارسنجی قانون مانده ──────────────────────────────────────────────────
  const balanceCheckPost = await validateAccountBalances(resolvedLines as JournalLine[]);
  if (!balanceCheckPost.valid) {
    return c.json(balanceCheckPost, 422);
  }

  const document_number = `DOC-${fiscal_year}-${Date.now()}`;
  const result = await getDb().collection<JournalDocument>("journal_documents").insertOne({
    ...body,
    document_number,
    document_date: resolvedDate,
    status: body.status ?? "DRAFT",
    lines: resolvedLines,
  } as JournalDocument);

  const inserted = await getDb().collection<JournalDocument>("journal_documents").findOne({ _id: result.insertedId });
  const decrypted = decryptDocument(serialize(inserted as Record<string, unknown>));
  return c.json({ message: "سند ثبت شد", data: decrypted }, 201);
});

router.patch("/:id/confirm", async (c) => {
  const id = c.req.param("id");
  if (!ObjectId.isValid(id)) return c.json({ message: "شناسه نامعتبر" }, 400);
  const res = await getDb().collection<JournalDocument>("journal_documents").findOneAndUpdate(
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

  // تاریخ و ردیف‌ها را از ciphertext استخراج کن
  if (ciphertext) {
    try {
      const preview = decryptDocument({ ciphertext } as any);
      if (preview.document_date) updateData.document_date = preview.document_date;
      if (preview.lines?.length) updateData.lines = preview.lines;
    } catch { /* ادامه بده */ }
  }

  // ── اعتبارسنجی قانون مانده (با حذف سند جاری از تاریخچه) ──────────────────
  const newLines = (updateData.lines ?? []) as JournalLine[];
  const balanceCheckPut = await validateAccountBalances(newLines, id);
  if (!balanceCheckPut.valid) {
    return c.json(balanceCheckPut, 422);
  }

  const res = await getDb().collection<JournalDocument>("journal_documents").findOneAndUpdate(
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

  const res = await getDb().collection<JournalDocument>("journal_documents").deleteOne({
    _id: new ObjectId(id),
  });

  if (res.deletedCount === 0) return c.json({ message: "سند یافت نشد" }, 404);
  return c.json({ message: "سند با موفقیت حذف شد" });
});

export default router;
