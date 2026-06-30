import { Hono } from "hono";
import { getDb } from "../db/index.js";
import { ObjectId } from "mongodb";

const router = new Hono();

// GET /api/fiscal-years - List all fiscal years
router.get("/", async (c) => {
  try {
    const db = getDb();
    const years = await db.collection("fiscal_years").find().sort({ year: -1 }).toArray();
    return c.json({ success: true, data: years });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// POST /api/fiscal-years - Create a new fiscal year
router.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const db = getDb();

    const year = parseInt(body.year);
    if (isNaN(year) || year < 1000 || year > 9999) {
      return c.json({ success: false, message: "سال باید یک عدد ۴ رقمی معتبر باشد (مثلاً ۱۴۰۳)" }, 400);
    }

    if (!body.title || !body.title.trim()) {
      return c.json({ success: false, message: "عنوان دوره مالی الزامی است" }, 400);
    }

    // Check if the year already exists
    const existing = await db.collection("fiscal_years").findOne({ year });
    if (existing) {
      return c.json({ success: false, message: `دوره مالی سال ${year} قبلاً تعریف شده است` }, 400);
    }

    const doc = {
      year,
      title: body.title.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await db.collection("fiscal_years").insertOne(doc);
    return c.json({ success: true, data: { ...doc, _id: result.insertedId } }, 201);
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// PUT /api/fiscal-years/:id - Update an existing fiscal year
router.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const db = getDb();

    const year = parseInt(body.year);
    if (isNaN(year) || year < 1000 || year > 9999) {
      return c.json({ success: false, message: "سال باید یک عدد ۴ رقمی معتبر باشد (مثلاً ۱۴۰۳)" }, 400);
    }

    if (!body.title || !body.title.trim()) {
      return c.json({ success: false, message: "عنوان دوره مالی الزامی است" }, 400);
    }

    // Check if the year already exists for another document
    const existing = await db.collection("fiscal_years").findOne({ 
      year, 
      _id: { $ne: new ObjectId(id) } 
    });
    if (existing) {
      return c.json({ success: false, message: `دوره مالی سال ${year} قبلاً تعریف شده است` }, 400);
    }

    const { _id, ...updateData } = body;
    const result = await db.collection("fiscal_years").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          year,
          title: body.title.trim(),
          updatedAt: new Date().toISOString() 
        } 
      },
      { returnDocument: "after" }
    );

    if (!result) {
      return c.json({ success: false, message: "دوره مالی مورد نظر یافت نشد" }, 404);
    }

    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// DELETE /api/fiscal-years/:id - Delete a fiscal year
router.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const db = getDb();
    const result = await db.collection("fiscal_years").deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return c.json({ success: false, message: "دوره مالی مورد نظر یافت نشد" }, 404);
    }
    return c.json({ success: true, message: "دوره مالی با موفقیت حذف شد" });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

export default router;
