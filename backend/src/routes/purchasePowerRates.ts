import { Hono } from "hono";
import { getDb } from "../db/index.js";
import { ObjectId } from "mongodb";
import type { PurchasePowerRate } from "../db/types.js";

const router = new Hono();

function serialize(doc: Record<string, unknown> | Record<string, unknown>[]) {
  return JSON.parse(JSON.stringify(doc, (_k, v) =>
    v instanceof ObjectId ? v.toHexString() : v
  ));
}

// GET /api/purchase-power-rates - List all rates
router.get("/", async (c) => {
  try {
    const db = getDb();
    const list = await db.collection<PurchasePowerRate>("purchase_power_rates")
      .find()
      .sort({ code: 1 })
      .toArray();
    return c.json({ success: true, data: serialize(list as any) });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// GET /api/purchase-power-rates/suggest-code - Suggest next sequential code
router.get("/suggest-code", async (c) => {
  try {
    const db = getDb();
    const items = await db.collection<PurchasePowerRate>("purchase_power_rates")
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

// GET /api/purchase-power-rates/:id - Get rate by ID
router.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (!ObjectId.isValid(id)) {
      return c.json({ success: false, message: "شناسه نرخ حفظ قدرت خرید نامعتبر است" }, 400);
    }
    const db = getDb();
    const item = await db.collection<PurchasePowerRate>("purchase_power_rates").findOne({ _id: new ObjectId(id) });
    if (!item) {
      return c.json({ success: false, message: "نرخ حفظ قدرت خرید مورد نظر یافت نشد" }, 404);
    }
    return c.json({ success: true, data: serialize(item as any) });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// POST /api/purchase-power-rates - Create new rate
router.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const db = getDb();

    const { code, fiscalYear, annualRate, startDate, endDate, status } = body;
    if (!code || !fiscalYear || annualRate === undefined || !startDate || !endDate || !status) {
      return c.json({ success: false, message: "وارد کردن تمامی فیلدهای ستاره‌دار الزامی است" }, 400);
    }

    // Check code duplication
    const duplicateCode = await db.collection<PurchasePowerRate>("purchase_power_rates").findOne({ code: code.trim() });
    if (duplicateCode) {
      return c.json({ success: false, message: `کد نرخ "${code}" قبلاً تعریف شده است` }, 400);
    }

    const doc: PurchasePowerRate = {
      code: code.trim(),
      fiscalYear: Number(fiscalYear),
      annualRate: Number(annualRate),
      startDate: startDate.trim(),
      endDate: endDate.trim(),
      billTitle: body.billTitle ? body.billTitle.trim() : "",
      status: status === "غیرفعال" ? "غیرفعال" : "فعال",
      description: body.description ? body.description.trim() : "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await db.collection("purchase_power_rates").insertOne(doc);
    const inserted = await db.collection("purchase_power_rates").findOne({ _id: result.insertedId });
    return c.json({ success: true, data: serialize(inserted as any) }, 201);
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// PUT /api/purchase-power-rates/:id - Update rate
router.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (!ObjectId.isValid(id)) {
      return c.json({ success: false, message: "شناسه نرخ حفظ قدرت خرید نامعتبر است" }, 400);
    }

    const body = await c.req.json();
    const db = getDb();

    const { code, fiscalYear, annualRate, startDate, endDate, status } = body;
    if (!code || !fiscalYear || annualRate === undefined || !startDate || !endDate || !status) {
      return c.json({ success: false, message: "وارد کردن تمامی فیلدهای ستاره‌دار الزامی است" }, 400);
    }

    // Check code duplication for other documents
    const duplicateCode = await db.collection<PurchasePowerRate>("purchase_power_rates").findOne({
      code: code.trim(),
      _id: { $ne: new ObjectId(id) }
    });
    if (duplicateCode) {
      return c.json({ success: false, message: `کد نرخ "${code}" به نرخ دیگری اختصاص دارد` }, 400);
    }

    const { _id, createdAt, ...updateData } = body;
    const result = await db.collection<PurchasePowerRate>("purchase_power_rates").findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          code: code.trim(),
          fiscalYear: Number(fiscalYear),
          annualRate: Number(annualRate),
          startDate: startDate.trim(),
          endDate: endDate.trim(),
          billTitle: updateData.billTitle ? updateData.billTitle.trim() : "",
          status: status === "غیرفعال" ? "غیرفعال" : "فعال",
          description: updateData.description ? updateData.description.trim() : "",
          updatedAt: new Date().toISOString()
        }
      },
      { returnDocument: "after" }
    );

    if (!result) {
      return c.json({ success: false, message: "نرخ حفظ قدرت خرید مورد نظر یافت نشد" }, 404);
    }

    return c.json({ success: true, data: serialize(result as any) });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// DELETE /api/purchase-power-rates/:id - Delete rate
router.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (!ObjectId.isValid(id)) {
      return c.json({ success: false, message: "شناسه نرخ حفظ قدرت خرید نامعتبر است" }, 400);
    }

    const db = getDb();
    const result = await db.collection<PurchasePowerRate>("purchase_power_rates").deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return c.json({ success: false, message: "نرخ حفظ قدرت خرید مورد نظر یافت نشد" }, 404);
    }
    return c.json({ success: true, message: "نرخ حفظ قدرت خرید با موفقیت حذف شد" });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

export default router;
