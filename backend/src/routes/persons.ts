import { Hono } from "hono";
import { getDb } from "../db/index.js";
import { ObjectId } from "mongodb";
import sanamaTypes from "../data/sanamaTypes.json";

const router = new Hono();

// Helper to validate detailClass matches the personKind hierarchy in sanamaTypes.json
function isValidSanamaCode(personKind: string, detailClass: string): boolean {
  const typesData = sanamaTypes as any;
  const section = typesData.personTypes.find((s: any) => s.type === personKind);
  if (!section) return false;
  
  for (const cls of section.children || []) {
    for (const sub of cls.children || []) {
      for (const det of sub.children || []) {
        if (det.code === detailClass) {
          return true;
        }
      }
    }
  }
  return false;
}

// GET /api/persons - Get all persons
router.get("/", async (c) => {
  try {
    const db = getDb();
    const persons = await db.collection("persons").find().toArray();
    return c.json({ success: true, data: persons });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// GET /api/persons/:id - Get a single person
router.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const db = getDb();
    const person = await db.collection("persons").findOne({ _id: new ObjectId(id) });
    if (!person) {
      return c.json({ success: false, message: "شخص مورد نظر یافت نشد" }, 404);
    }
    return c.json({ success: true, data: person });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// POST /api/persons - Create a new person
router.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const db = getDb();

    // Validate personKind and detailClass based on sanamaTypes.json
    if (!body.personKind || !body.detailClass) {
      return c.json({ success: false, message: "نوع شخص و جزء‌طبقه الزامی هستند" }, 400);
    }

    if (!isValidSanamaCode(body.personKind, body.detailClass)) {
      return c.json({ 
        success: false, 
        message: `کد جزء‌طبقه ${body.detailClass} برای نوع شخص ${body.personKind} در سند ساختار سناما (sanamaTypes.json) نامعتبر است` 
      }, 400);
    }
    
    // Check if nomineeCode already exists
    if (body.nomineeCode) {
      const existing = await db.collection("persons").findOne({ nomineeCode: body.nomineeCode });
      if (existing) {
        return c.json({ success: false, message: "شخصی با این کد شناسایی (NomineeCode) قبلاً ثبت شده است" }, 400);
      }
    }

    const doc = {
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await db.collection("persons").insertOne(doc);
    return c.json({ success: true, data: { ...doc, _id: result.insertedId } }, 201);
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// PUT /api/persons/:id - Update a person
router.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const db = getDb();

    // Validate personKind and detailClass based on sanamaTypes.json
    if (!body.personKind || !body.detailClass) {
      return c.json({ success: false, message: "نوع شخص و جزء‌طبقه الزامی هستند" }, 400);
    }

    if (!isValidSanamaCode(body.personKind, body.detailClass)) {
      return c.json({ 
        success: false, 
        message: `کد جزء‌طبقه ${body.detailClass} برای نوع شخص ${body.personKind} در سند ساختار سناما (sanamaTypes.json) نامعتبر است` 
      }, 400);
    }

    // Check if nomineeCode already exists for another person
    if (body.nomineeCode) {
      const existing = await db.collection("persons").findOne({ 
        nomineeCode: body.nomineeCode, 
        _id: { $ne: new ObjectId(id) } 
      });
      if (existing) {
        return c.json({ success: false, message: "شخصی با این کد شناسایی (NomineeCode) قبلاً ثبت شده است" }, 400);
      }
    }

    const { _id, ...updateData } = body;
    const result = await db.collection("persons").findOneAndUpdate(
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
      return c.json({ success: false, message: "شخص مورد نظر یافت نشد" }, 404);
    }

    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// DELETE /api/persons/:id - Delete a person
router.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const db = getDb();
    const result = await db.collection("persons").deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return c.json({ success: false, message: "شخص مورد نظر یافت نشد" }, 404);
    }
    return c.json({ success: true, message: "شخص با موفقیت حذف شد" });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

export default router;
