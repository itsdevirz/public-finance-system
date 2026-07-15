import { Hono } from "hono";
import { getDb } from "../db/index.js";
import { ObjectId } from "mongodb";
import type { GuaranteeType } from "../db/types.js";

const router = new Hono();

function serialize(doc: Record<string, unknown> | Record<string, unknown>[]) {
  return JSON.parse(JSON.stringify(doc, (_k, v) =>
    v instanceof ObjectId ? v.toHexString() : v
  ));
}

// GET /api/guarantee-types - List all guarantee types
router.get("/", async (c) => {
  try {
    const db = getDb();
    const list = await db.collection<GuaranteeType>("guarantee_types")
      .find()
      .sort({ code: 1 })
      .toArray();
    return c.json({ success: true, data: serialize(list as any) });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// GET /api/guarantee-types/suggest-code - Suggest next sequential code
router.get("/suggest-code", async (c) => {
  try {
    const db = getDb();
    const items = await db.collection<GuaranteeType>("guarantee_types")
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

// GET /api/guarantee-types/:id - Get guarantee type by ID
router.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (!ObjectId.isValid(id)) {
      return c.json({ success: false, message: "شناسه نوع ضمانت‌نامه نامعتبر است" }, 400);
    }
    const db = getDb();
    const item = await db.collection<GuaranteeType>("guarantee_types").findOne({ _id: new ObjectId(id) });
    if (!item) {
      return c.json({ success: false, message: "نوع ضمانت‌نامه مورد نظر یافت نشد" }, 404);
    }
    return c.json({ success: true, data: serialize(item as any) });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// POST /api/guarantee-types - Create new guarantee type
router.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const db = getDb();

    const { code, title, nature, status } = body;
    if (!code || !title || !nature || !status) {
      return c.json({ success: false, message: "وارد کردن تمامی فیلدهای ستاره‌دار الزامی است" }, 400);
    }

    // Check code duplication
    const duplicateCode = await db.collection<GuaranteeType>("guarantee_types").findOne({ code: code.trim() });
    if (duplicateCode) {
      return c.json({ success: false, message: `کد نوع ضمانت‌نامه "${code}" قبلاً تعریف شده است` }, 400);
    }

    // Check title duplication
    const duplicateTitle = await db.collection<GuaranteeType>("guarantee_types").findOne({ title: title.trim() });
    if (duplicateTitle) {
      return c.json({ success: false, message: `نوع ضمانت‌نامه با عنوان "${title}" قبلاً ثبت شده است` }, 400);
    }

    const doc: GuaranteeType = {
      code: code.trim(),
      title: title.trim(),
      nature: nature.trim(),
      allowedCollaterals: Array.isArray(body.allowedCollaterals) ? body.allowedCollaterals : [],
      validityDurationDays: body.validityDurationDays ? Number(body.validityDurationDays) : undefined,
      status: status === "غیرفعال" ? "غیرفعال" : "فعال",
      description: body.description ? body.description.trim() : "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await db.collection("guarantee_types").insertOne(doc);
    const inserted = await db.collection("guarantee_types").findOne({ _id: result.insertedId });
    return c.json({ success: true, data: serialize(inserted as any) }, 201);
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// PUT /api/guarantee-types/:id - Update guarantee type
router.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (!ObjectId.isValid(id)) {
      return c.json({ success: false, message: "شناسه نوع ضمانت‌نامه نامعتبر است" }, 400);
    }

    const body = await c.req.json();
    const db = getDb();

    const { code, title, nature, status } = body;
    if (!code || !title || !nature || !status) {
      return c.json({ success: false, message: "وارد کردن تمامی فیلدهای ستاره‌دار الزامی است" }, 400);
    }

    // Check code duplication for other documents
    const duplicateCode = await db.collection<GuaranteeType>("guarantee_types").findOne({
      code: code.trim(),
      _id: { $ne: new ObjectId(id) }
    });
    if (duplicateCode) {
      return c.json({ success: false, message: `کد نوع ضمانت‌نامه "${code}" به نوع ضمانت‌نامه دیگری اختصاص دارد` }, 400);
    }

    // Check title duplication for other documents
    const duplicateTitle = await db.collection<GuaranteeType>("guarantee_types").findOne({
      title: title.trim(),
      _id: { $ne: new ObjectId(id) }
    });
    if (duplicateTitle) {
      return c.json({ success: false, message: `نوع ضمانت‌نامه با عنوان "${title}" به نوع ضمانت‌نامه دیگری اختصاص دارد` }, 400);
    }

    const { _id, createdAt, ...updateData } = body;
    const result = await db.collection<GuaranteeType>("guarantee_types").findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          code: code.trim(),
          title: title.trim(),
          nature: nature.trim(),
          allowedCollaterals: Array.isArray(updateData.allowedCollaterals) ? updateData.allowedCollaterals : [],
          validityDurationDays: updateData.validityDurationDays ? Number(updateData.validityDurationDays) : undefined,
          status: status === "غیرفعال" ? "غیرفعال" : "فعال",
          description: updateData.description ? updateData.description.trim() : "",
          updatedAt: new Date().toISOString()
        }
      },
      { returnDocument: "after" }
    );

    if (!result) {
      return c.json({ success: false, message: "نوع ضمانت‌نامه مورد نظر یافت نشد" }, 404);
    }

    return c.json({ success: true, data: serialize(result as any) });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// DELETE /api/guarantee-types/:id - Delete guarantee type
router.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (!ObjectId.isValid(id)) {
      return c.json({ success: false, message: "شناسه نوع ضمانت‌نامه نامعتبر است" }, 400);
    }

    const db = getDb();
    const result = await db.collection<GuaranteeType>("guarantee_types").deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return c.json({ success: false, message: "نوع ضمانت‌نامه مورد نظر یافت نشد" }, 404);
    }
    return c.json({ success: true, message: "نوع ضمانت‌نامه با موفقیت حذف شد" });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

export default router;
