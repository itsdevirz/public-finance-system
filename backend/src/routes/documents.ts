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

router.get("/", async (c) => {
  const data = await getDb().collection<JournalDocument>("journal_documents").find().toArray();
  return c.json({ data: data.map((d) => serialize(d as Record<string, unknown>)), message: "لیست اسناد" });
});

router.get("/:id", async (c) => {
  const id = c.req.param("id");
  if (!ObjectId.isValid(id)) return c.json({ message: "شناسه نامعتبر" }, 400);
  const doc = await getDb().collection<JournalDocument>("journal_documents").findOne({ _id: new ObjectId(id) });
  if (!doc) return c.json({ message: "سند یافت نشد" }, 404);
  return c.json({ data: serialize(doc as Record<string, unknown>) });
});

router.post("/", async (c) => {
  const body = await c.req.json();
  const { document_type, fiscal_year, lines = [] } = body;
  if (!document_type || !fiscal_year) {
    return c.json({ message: "document_type و fiscal_year الزامی است" }, 400);
  }

  const document_number = `DOC-${fiscal_year}-${Date.now()}`;
  const result = await getDb().collection<JournalDocument>("journal_documents").insertOne({
    ...body,
    document_number,
    status: body.status ?? "DRAFT",
    lines,
  });
  const inserted = await getDb().collection<JournalDocument>("journal_documents").findOne({ _id: result.insertedId });
  return c.json({ message: "سند ثبت شد", data: serialize(inserted as Record<string, unknown>) }, 201);
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

export default router;
