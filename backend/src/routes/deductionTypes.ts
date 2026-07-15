import { Hono } from "hono";
import { getDb } from "../db/index.js";
import { ObjectId } from "mongodb";
import type { DeductionType } from "../db/types.js";

const router = new Hono();

function serialize(doc: Record<string, unknown> | Record<string, unknown>[]) {
  return JSON.parse(JSON.stringify(doc, (_k, v) =>
    v instanceof ObjectId ? v.toHexString() : v
  ));
}

// GET /api/deduction-types - List all deduction types
router.get("/", async (c) => {
  try {
    const db = getDb();
    const list = await db.collection<DeductionType>("deduction_types")
      .find()
      .sort({ code: 1 })
      .toArray();
    return c.json({ success: true, data: serialize(list as any) });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// GET /api/deduction-types/suggest-code - Suggest next sequential code
router.get("/suggest-code", async (c) => {
  try {
    const db = getDb();
    const items = await db.collection<DeductionType>("deduction_types")
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

// GET /api/deduction-types/:id - Get deduction type by ID
router.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (!ObjectId.isValid(id)) {
      return c.json({ success: false, message: "شناسه نوع کسورات نامعتبر است" }, 400);
    }
    const db = getDb();
    const item = await db.collection<DeductionType>("deduction_types").findOne({ _id: new ObjectId(id) });
    if (!item) {
      return c.json({ success: false, message: "نوع کسورات مورد نظر یافت نشد" }, 404);
    }
    return c.json({ success: true, data: serialize(item as any) });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// POST /api/deduction-types - Create new deduction type
router.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const db = getDb();

    const { code, title, nature, calcMethod, status } = body;
    if (!code || !title || !nature || !calcMethod || !status) {
      return c.json({ success: false, message: "وارد کردن تمامی فیلدهای ستاره‌دار الزامی است" }, 400);
    }

    // Check code duplication
    const duplicateCode = await db.collection<DeductionType>("deduction_types").findOne({ code: code.trim() });
    if (duplicateCode) {
      return c.json({ success: false, message: `کد نوع کسور "${code}" قبلاً تعریف شده است` }, 400);
    }

    // Check title duplication
    const duplicateTitle = await db.collection<DeductionType>("deduction_types").findOne({ title: title.trim() });
    if (duplicateTitle) {
      return c.json({ success: false, message: `نوع کسور با عنوان "${title}" قبلاً ثبت شده است` }, 400);
    }

    const doc: DeductionType = {
      code: code.trim(),
      title: title.trim(),
      nature: nature.trim(),
      calcMethod: calcMethod.trim() === "مبلغ ثابت" ? "مبلغ ثابت" : "درصدی",
      rate: body.rate ? Number(body.rate) : 0,
      amount: body.amount ? Number(body.amount) : 0,
      moeinAccount: body.moeinAccount ? body.moeinAccount.trim() : "",
      status: status === "غیرفعال" ? "غیرفعال" : "فعال",
      description: body.description ? body.description.trim() : "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await db.collection("deduction_types").insertOne(doc);
    const inserted = await db.collection("deduction_types").findOne({ _id: result.insertedId });
    return c.json({ success: true, data: serialize(inserted as any) }, 201);
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// PUT /api/deduction-types/:id - Update deduction type
router.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (!ObjectId.isValid(id)) {
      return c.json({ success: false, message: "شناسه نوع کسورات نامعتبر است" }, 400);
    }

    const body = await c.req.json();
    const db = getDb();

    const { code, title, nature, calcMethod, status } = body;
    if (!code || !title || !nature || !calcMethod || !status) {
      return c.json({ success: false, message: "وارد کردن تمامی فیلدهای ستاره‌دار الزامی است" }, 400);
    }

    // Check code duplication for other documents
    const duplicateCode = await db.collection<DeductionType>("deduction_types").findOne({
      code: code.trim(),
      _id: { $ne: new ObjectId(id) }
    });
    if (duplicateCode) {
      return c.json({ success: false, message: `کد نوع کسور "${code}" به نوع کسور دیگری اختصاص دارد` }, 400);
    }

    // Check title duplication for other documents
    const duplicateTitle = await db.collection<DeductionType>("deduction_types").findOne({
      title: title.trim(),
      _id: { $ne: new ObjectId(id) }
    });
    if (duplicateTitle) {
      return c.json({ success: false, message: `نوع کسور با عنوان "${title}" به نوع کسور دیگری اختصاص دارد` }, 400);
    }

    const { _id, createdAt, ...updateData } = body;
    const result = await db.collection<DeductionType>("deduction_types").findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          code: code.trim(),
          title: title.trim(),
          nature: nature.trim(),
          calcMethod: calcMethod.trim() === "مبلغ ثابت" ? "مبلغ ثابت" : "درصدی",
          rate: updateData.rate ? Number(updateData.rate) : 0,
          amount: updateData.amount ? Number(updateData.amount) : 0,
          moeinAccount: updateData.moeinAccount ? updateData.moeinAccount.trim() : "",
          status: status === "غیرفعال" ? "غیرفعال" : "فعال",
          description: updateData.description ? updateData.description.trim() : "",
          updatedAt: new Date().toISOString()
        }
      },
      { returnDocument: "after" }
    );

    if (!result) {
      return c.json({ success: false, message: "نوع کسورات مورد نظر یافت نشد" }, 404);
    }

    return c.json({ success: true, data: serialize(result as any) });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// DELETE /api/deduction-types/:id - Delete deduction type
router.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (!ObjectId.isValid(id)) {
      return c.json({ success: false, message: "شناسه نوع کسورات نامعتبر است" }, 400);
    }

    const db = getDb();
    const result = await db.collection<DeductionType>("deduction_types").deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return c.json({ success: false, message: "نوع کسورات مورد نظر یافت نشد" }, 404);
    }
    return c.json({ success: true, message: "نوع کسورات با موفقیت حذف شد" });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

export default router;
