import { Hono } from "hono";
import { getDb } from "../db/index.js";
import { ObjectId } from "mongodb";
import type { AssignmentMethod } from "../db/types.js";

const router = new Hono();

function serialize(doc: Record<string, unknown> | Record<string, unknown>[]) {
  return JSON.parse(JSON.stringify(doc, (_k, v) =>
    v instanceof ObjectId ? v.toHexString() : v
  ));
}

// GET /api/assignment-methods - List all assignment methods
router.get("/", async (c) => {
  try {
    const db = getDb();
    const list = await db.collection<AssignmentMethod>("assignment_methods")
      .find()
      .sort({ code: 1 })
      .toArray();
    return c.json({ success: true, data: serialize(list as any) });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// GET /api/assignment-methods/suggest-code - Suggest next sequential code
router.get("/suggest-code", async (c) => {
  try {
    const db = getDb();
    const items = await db.collection<AssignmentMethod>("assignment_methods")
      .find()
      .toArray();
    
    let nextNum = 1;
    if (items.length > 0) {
      const codes = items
        .map(i => parseInt(i.code, 10))
        .filter(n => !isNaN(n));
      if (codes.length > 0) {
        nextNum = Math.max(...codes) + 1;
      }
    }
    const nextCode = String(nextNum).padStart(2, "0");
    return c.json({ success: true, code: nextCode });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// GET /api/assignment-methods/:id - Get assignment method by ID
router.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (!ObjectId.isValid(id)) {
      return c.json({ success: false, message: "شناسه روش واگذاری نامعتبر است" }, 400);
    }
    const db = getDb();
    const item = await db.collection<AssignmentMethod>("assignment_methods").findOne({ _id: new ObjectId(id) });
    if (!item) {
      return c.json({ success: false, message: "روش واگذاری مورد نظر یافت نشد" }, 404);
    }
    return c.json({ success: true, data: serialize(item as any) });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// POST /api/assignment-methods - Create new assignment method
router.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const db = getDb();

    const { code, title, nature, status } = body;
    if (!code || !title || !nature || !status) {
      return c.json({ success: false, message: "وارد کردن تمامی فیلدهای ستاره‌دار الزامی است" }, 400);
    }

    // Check code duplication
    const duplicateCode = await db.collection<AssignmentMethod>("assignment_methods").findOne({ code: code.trim() });
    if (duplicateCode) {
      return c.json({ success: false, message: `کد روش واگذاری "${code}" قبلاً تعریف شده است` }, 400);
    }

    // Check title duplication
    const duplicateTitle = await db.collection<AssignmentMethod>("assignment_methods").findOne({ title: title.trim() });
    if (duplicateTitle) {
      return c.json({ success: false, message: `روش واگذاری با عنوان "${title}" قبلاً ثبت شده است` }, 400);
    }

    const doc: AssignmentMethod = {
      code: code.trim(),
      title: title.trim(),
      nature: nature.trim(),
      hasTenderCommittee: !!body.hasTenderCommittee,
      minAmount: body.minAmount ? Number(body.minAmount) : undefined,
      maxAmount: body.maxAmount ? Number(body.maxAmount) : undefined,
      status: status === "غیرفعال" ? "غیرفعال" : "فعال",
      description: body.description ? body.description.trim() : "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await db.collection("assignment_methods").insertOne(doc);
    const inserted = await db.collection("assignment_methods").findOne({ _id: result.insertedId });
    return c.json({ success: true, data: serialize(inserted as any) }, 201);
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// PUT /api/assignment-methods/:id - Update assignment method
router.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (!ObjectId.isValid(id)) {
      return c.json({ success: false, message: "شناسه روش واگذاری نامعتبر است" }, 400);
    }

    const body = await c.req.json();
    const db = getDb();

    const { code, title, nature, status } = body;
    if (!code || !title || !nature || !status) {
      return c.json({ success: false, message: "وارد کردن تمامی فیلدهای ستاره‌دار الزامی است" }, 400);
    }

    // Check code duplication for other documents
    const duplicateCode = await db.collection<AssignmentMethod>("assignment_methods").findOne({
      code: code.trim(),
      _id: { $ne: new ObjectId(id) }
    });
    if (duplicateCode) {
      return c.json({ success: false, message: `کد روش واگذاری "${code}" به روش واگذاری دیگری اختصاص دارد` }, 400);
    }

    // Check title duplication for other documents
    const duplicateTitle = await db.collection<AssignmentMethod>("assignment_methods").findOne({
      title: title.trim(),
      _id: { $ne: new ObjectId(id) }
    });
    if (duplicateTitle) {
      return c.json({ success: false, message: `روش واگذاری با عنوان "${title}" به روش واگذاری دیگری اختصاص دارد` }, 400);
    }

    const { _id, createdAt, ...updateData } = body;
    const result = await db.collection<AssignmentMethod>("assignment_methods").findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          code: code.trim(),
          title: title.trim(),
          nature: nature.trim(),
          hasTenderCommittee: !!updateData.hasTenderCommittee,
          minAmount: updateData.minAmount ? Number(updateData.minAmount) : undefined,
          maxAmount: updateData.maxAmount ? Number(updateData.maxAmount) : undefined,
          status: status === "غیرفعال" ? "غیرفعال" : "فعال",
          description: updateData.description ? updateData.description.trim() : "",
          updatedAt: new Date().toISOString()
        }
      },
      { returnDocument: "after" }
    );

    if (!result) {
      return c.json({ success: false, message: "روش واگذاری مورد نظر یافت نشد" }, 404);
    }

    return c.json({ success: true, data: serialize(result as any) });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// DELETE /api/assignment-methods/:id - Delete assignment method
router.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (!ObjectId.isValid(id)) {
      return c.json({ success: false, message: "شناسه روش واگذاری نامعتبر است" }, 400);
    }

    const db = getDb();
    const result = await db.collection<AssignmentMethod>("assignment_methods").deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return c.json({ success: false, message: "روش واگذاری مورد نظر یافت نشد" }, 404);
    }
    return c.json({ success: true, message: "روش واگذاری با موفقیت حذف شد" });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

export default router;
