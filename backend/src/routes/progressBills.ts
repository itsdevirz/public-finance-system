import { Hono } from "hono";
import { getDb } from "../db/index.js";
import { ObjectId } from "mongodb";
import type { ProgressBill } from "../db/types.js";

const router = new Hono();

function serialize(doc: Record<string, unknown>) {
  return JSON.parse(JSON.stringify(doc, (_k, v) =>
    v instanceof ObjectId ? v.toHexString() : v
  ));
}

// GET /api/progress-bills
router.get("/", async (c) => {
  try {
    const db = getDb();
    const list = await db.collection<ProgressBill>("progress_bills")
      .find()
      .sort({ statement_date: -1 })
      .toArray();
    return c.json({ success: true, data: serialize(list as any) });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// GET /api/progress-bills/:id
router.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (!ObjectId.isValid(id)) return c.json({ success: false, message: "شناسه نامعتبر" }, 400);
    const db = getDb();
    const item = await db.collection<ProgressBill>("progress_bills").findOne({ _id: new ObjectId(id) });
    if (!item) {
      return c.json({ success: false, message: "صورت وضعیت یافت نشد" }, 404);
    }
    return c.json({ success: true, data: serialize(item as any) });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// POST /api/progress-bills
router.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const db = getDb();

    const { contract_id, statement_number, statement_date, progress_percent } = body;
    if (!contract_id || !statement_number || !statement_date || progress_percent === undefined) {
      return c.json({ success: false, message: "فیلدهای ستاره‌دار الزامی هستند." }, 400);
    }

    // Check if statement_number already exists for this contract
    const duplicate = await db.collection<ProgressBill>("progress_bills").findOne({
      contract_id,
      statement_number
    });
    if (duplicate) {
      return c.json({ success: false, message: "این شماره صورت وضعیت قبلاً برای این قرارداد ثبت شده است." }, 400);
    }

    const doc = {
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await db.collection("progress_bills").insertOne(doc);
    const inserted = await db.collection("progress_bills").findOne({ _id: result.insertedId });
    return c.json({ success: true, data: serialize(inserted as any) }, 201);
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// PUT /api/progress-bills/:id
router.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (!ObjectId.isValid(id)) return c.json({ success: false, message: "شناسه نامعتبر" }, 400);
    const body = await c.req.json();
    const db = getDb();

    const { contract_id, statement_number, statement_date, progress_percent } = body;
    if (!contract_id || !statement_number || !statement_date || progress_percent === undefined) {
      return c.json({ success: false, message: "فیلدهای ستاره‌دار الزامی هستند." }, 400);
    }

    // Check duplicate statement number (excluding self)
    const duplicate = await db.collection<ProgressBill>("progress_bills").findOne({
      contract_id,
      statement_number,
      _id: { $ne: new ObjectId(id) }
    });
    if (duplicate) {
      return c.json({ success: false, message: "این شماره صورت وضعیت قبلاً برای این قرارداد ثبت شده است." }, 400);
    }

    const { _id, ...updateData } = body;
    const result = await db.collection<ProgressBill>("progress_bills").findOneAndUpdate(
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
      return c.json({ success: false, message: "صورت وضعیت یافت نشد" }, 404);
    }

    return c.json({ success: true, data: serialize(result as any) });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// DELETE /api/progress-bills/:id
router.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (!ObjectId.isValid(id)) return c.json({ success: false, message: "شناسه نامعتبر" }, 400);
    const db = getDb();
    const result = await db.collection<ProgressBill>("progress_bills").deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return c.json({ success: false, message: "صورت وضعیت یافت نشد" }, 404);
    }
    return c.json({ success: true, message: "صورت وضعیت با موفقیت حذف شد" });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

export default router;
