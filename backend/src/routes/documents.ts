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
