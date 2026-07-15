import { Hono } from "hono";
import { getDb } from "../db/index.js";
import { ObjectId } from "mongodb";
import type { PenaltyRate } from "../db/types.js";

const router = new Hono();

function serialize(doc: Record<string, unknown> | Record<string, unknown>[]) {
  return JSON.parse(JSON.stringify(doc, (_k, v) =>
    v instanceof ObjectId ? v.toHexString() : v
  ));
}

// GET /api/penalty-rates - List all rates
router.get("/", async (c) => {
  try {
    const db = getDb();
    const list = await db.collection<PenaltyRate>("penalty_rates")
      .find()
      .sort({ code: 1 })
      .toArray();
    return c.json({ success: true, data: serialize(list as any) });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// GET /api/penalty-rates/suggest-code - Suggest next sequential code
router.get("/suggest-code", async (c) => {
  try {
    const db = getDb();
    const items = await db.collection<PenaltyRate>("penalty_rates")
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

// GET /api/penalty-rates/:id - Get rate by ID
router.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (!ObjectId.isValid(id)) {
      return c.json({ success: false, message: "شناسه نرخ جریمه نامعتبر است" }, 400);
    }
    const db = getDb();
    const item = await db.collection<PenaltyRate>("penalty_rates").findOne({ _id: new ObjectId(id) });
    if (!item) {
      return c.json({ success: false, message: "نرخ جریمه مورد نظر یافت نشد" }, 404);
    }
    return c.json({ success: true, data: serialize(item as any) });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// POST /api/penalty-rates - Create new rate
router.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const db = getDb();

    const { code, title, nature, calcMethod, status } = body;
    if (!code || !title || !nature || !calcMethod || !status) {
      return c.json({ success: false, message: "وارد کردن تمامی فیلدهای ستاره‌دار الزامی است" }, 400);
    }

    // Check code duplication
    const duplicateCode = await db.collection<PenaltyRate>("penalty_rates").findOne({ code: code.trim() });
    if (duplicateCode) {
      return c.json({ success: false, message: `کد نرخ جریمه "${code}" قبلاً تعریف شده است` }, 400);
    }

    // Check title duplication
    const duplicateTitle = await db.collection<PenaltyRate>("penalty_rates").findOne({ title: title.trim() });
    if (duplicateTitle) {
      return c.json({ success: false, message: `نرخ جریمه با عنوان "${title}" قبلاً ثبت شده است` }, 400);
    }

    const doc: PenaltyRate = {
      code: code.trim(),
      title: title.trim(),
      nature: nature.trim(),
      calcMethod: calcMethod.trim() as any,
      rate: body.rate ? Number(body.rate) : 0,
      amount: body.amount ? Number(body.amount) : 0,
      status: status === "غیرفعال" ? "غیرفعال" : "فعال",
      description: body.description ? body.description.trim() : "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await db.collection("penalty_rates").insertOne(doc);
    const inserted = await db.collection("penalty_rates").findOne({ _id: result.insertedId });
    return c.json({ success: true, data: serialize(inserted as any) }, 201);
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// PUT /api/penalty-rates/:id - Update rate
router.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (!ObjectId.isValid(id)) {
      return c.json({ success: false, message: "شناسه نرخ جریمه نامعتبر است" }, 400);
    }

    const body = await c.req.json();
    const db = getDb();

    const { code, title, nature, calcMethod, status } = body;
    if (!code || !title || !nature || !calcMethod || !status) {
      return c.json({ success: false, message: "وارد کردن تمامی فیلدهای ستاره‌دار الزامی است" }, 400);
    }

    // Check code duplication for other documents
    const duplicateCode = await db.collection<PenaltyRate>("penalty_rates").findOne({
      code: code.trim(),
      _id: { $ne: new ObjectId(id) }
    });
    if (duplicateCode) {
      return c.json({ success: false, message: `کد نرخ جریمه "${code}" به نرخ جریمه دیگری اختصاص دارد` }, 400);
    }

    // Check title duplication for other documents
    const duplicateTitle = await db.collection<PenaltyRate>("penalty_rates").findOne({
      title: title.trim(),
      _id: { $ne: new ObjectId(id) }
    });
    if (duplicateTitle) {
      return c.json({ success: false, message: `نرخ جریمه با عنوان "${title}" به نرخ جریمه دیگری اختصاص دارد` }, 400);
    }

    const { _id, createdAt, ...updateData } = body;
    const result = await db.collection<PenaltyRate>("penalty_rates").findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          code: code.trim(),
          title: title.trim(),
          nature: nature.trim(),
          calcMethod: calcMethod.trim() as any,
          rate: updateData.rate ? Number(updateData.rate) : 0,
          amount: updateData.amount ? Number(updateData.amount) : 0,
          status: status === "غیرفعال" ? "غیرفعال" : "فعال",
          description: updateData.description ? updateData.description.trim() : "",
          updatedAt: new Date().toISOString()
        }
      },
      { returnDocument: "after" }
    );

    if (!result) {
      return c.json({ success: false, message: "نرخ جریمه مورد نظر یافت نشد" }, 404);
    }

    return c.json({ success: true, data: serialize(result as any) });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// DELETE /api/penalty-rates/:id - Delete rate
router.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (!ObjectId.isValid(id)) {
      return c.json({ success: false, message: "شناسه نرخ جریمه نامعتبر است" }, 400);
    }

    const db = getDb();
    const result = await db.collection<PenaltyRate>("penalty_rates").deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return c.json({ success: false, message: "نرخ جریمه مورد نظر یافت نشد" }, 404);
    }
    return c.json({ success: true, message: "نرخ جریمه با موفقیت حذف شد" });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

export default router;
