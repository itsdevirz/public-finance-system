import { Hono } from "hono";
import { getDb } from "../db/index.js";
import { ObjectId } from "mongodb";
import type { DepreciationSetup } from "../db/types.js";

const router = new Hono();

function serialize(doc: Record<string, unknown>) {
  return JSON.parse(JSON.stringify(doc, (_k, v) =>
    v instanceof ObjectId ? v.toHexString() : v
  ));
}

// GET /api/depreciation-setups
router.get("/", async (c) => {
  try {
    const db = getDb();
    const list = await db.collection<DepreciationSetup>("depreciation_setups")
      .find()
      .sort({ createdAt: -1 })
      .toArray();
    return c.json({ success: true, data: serialize(list as any) });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// GET /api/depreciation-setups/suggest-code
router.get("/suggest-code", async (c) => {
  try {
    const db = getDb();
    const lastItem = await db.collection<DepreciationSetup>("depreciation_setups")
      .find({ setup_code: { $regex: "^DS-" } })
      .sort({ setup_code: -1 })
      .limit(1)
      .toArray();

    let nextNumber = 1;
    if (lastItem.length > 0 && lastItem[0].setup_code) {
      const parts = lastItem[0].setup_code.split("-");
      if (parts.length > 1) {
        const num = parseInt(parts[1], 10);
        if (!isNaN(num)) {
          nextNumber = num + 1;
        }
      }
    }
    const nextCode = `DS-${String(nextNumber).padStart(5, "0")}`;
    return c.json({ success: true, setup_code: nextCode });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// GET /api/depreciation-setups/:id
router.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (!ObjectId.isValid(id)) return c.json({ success: false, message: "شناسه نامعتبر" }, 400);
    const db = getDb();
    const item = await db.collection<DepreciationSetup>("depreciation_setups").findOne({ _id: new ObjectId(id) });
    if (!item) {
      return c.json({ success: false, message: "تنظیم مورد نظر یافت نشد" }, 404);
    }
    return c.json({ success: true, data: serialize(item as any) });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// POST /api/depreciation-setups
router.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const db = getDb();

    const { setup_code, title, status, fiscal_year, start_date } = body;
    if (!setup_code || !title || !status || !fiscal_year || !start_date) {
      return c.json({ success: false, message: "فیلدهای اجباری اطلاعات پایه را پر کنید." }, 400);
    }

    const duplicate = await db.collection<DepreciationSetup>("depreciation_setups").findOne({
      setup_code
    });
    if (duplicate) {
      return c.json({ success: false, message: "این کد تنظیم قبلاً در سیستم ثبت شده است." }, 400);
    }

    const doc = {
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await db.collection("depreciation_setups").insertOne(doc);
    const inserted = await db.collection("depreciation_setups").findOne({ _id: result.insertedId });
    return c.json({ success: true, data: serialize(inserted as any) }, 201);
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// PUT /api/depreciation-setups/:id
router.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (!ObjectId.isValid(id)) return c.json({ success: false, message: "شناسه نامعتبر" }, 400);
    const body = await c.req.json();
    const db = getDb();

    const { setup_code, title, status, fiscal_year, start_date } = body;
    if (!setup_code || !title || !status || !fiscal_year || !start_date) {
      return c.json({ success: false, message: "فیلدهای اجباری اطلاعات پایه را پر کنید." }, 400);
    }

    const duplicate = await db.collection<DepreciationSetup>("depreciation_setups").findOne({
      setup_code,
      _id: { $ne: new ObjectId(id) }
    });
    if (duplicate) {
      return c.json({ success: false, message: "این کد تنظیم قبلاً در سیستم ثبت شده است." }, 400);
    }

    const { _id, ...updateData } = body;
    const result = await db.collection<DepreciationSetup>("depreciation_setups").findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...updateData,
          updatedAt: new Date().toISOString()
        }
      },
      { returnDocument: "after" }
    );

    if (!result) {
      return c.json({ success: false, message: "تنظیم مورد نظر یافت نشد" }, 404);
    }

    return c.json({ success: true, data: serialize(result as any) });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// DELETE /api/depreciation-setups/:id
router.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (!ObjectId.isValid(id)) return c.json({ success: false, message: "شناسه نامعتبر" }, 400);
    const db = getDb();
    const result = await db.collection<DepreciationSetup>("depreciation_setups").deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return c.json({ success: false, message: "تنظیم مورد نظر یافت نشد" }, 404);
    }
    return c.json({ success: true, message: "تنظیم با موفقیت حذف شد" });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

export default router;
