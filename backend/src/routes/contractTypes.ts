import { Hono } from "hono";
import { getDb } from "../db/index.js";
import { ObjectId } from "mongodb";
import type { ContractType } from "../db/types.js";

const router = new Hono();

function serialize(doc: Record<string, unknown> | Record<string, unknown>[]) {
  return JSON.parse(JSON.stringify(doc, (_k, v) =>
    v instanceof ObjectId ? v.toHexString() : v
  ));
}

// GET /api/contract-types - List all contract types
router.get("/", async (c) => {
  try {
    const db = getDb();
    const list = await db.collection<ContractType>("contract_types")
      .find()
      .sort({ code: 1 })
      .toArray();
    return c.json({ success: true, data: serialize(list as any) });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// GET /api/contract-types/suggest-code - Suggest next sequential code
router.get("/suggest-code", async (c) => {
  try {
    const db = getDb();
    const items = await db.collection<ContractType>("contract_types")
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

// GET /api/contract-types/:id - Get contract type by ID
router.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (!ObjectId.isValid(id)) {
      return c.json({ success: false, message: "شناسه نوع قرارداد نامعتبر است" }, 400);
    }
    const db = getDb();
    const item = await db.collection<ContractType>("contract_types").findOne({ _id: new ObjectId(id) });
    if (!item) {
      return c.json({ success: false, message: "نوع قرارداد مورد نظر یافت نشد" }, 404);
    }
    return c.json({ success: true, data: serialize(item as any) });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// POST /api/contract-types - Create new contract type
router.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const db = getDb();

    const { code, title, nature, status } = body;
    if (!code || !title || !nature || !status) {
      return c.json({ success: false, message: "وارد کردن تمامی فیلدهای ستاره‌دار الزامی است" }, 400);
    }

    // Check code duplication
    const duplicateCode = await db.collection<ContractType>("contract_types").findOne({ code: code.trim() });
    if (duplicateCode) {
      return c.json({ success: false, message: `کد نوع قرارداد "${code}" قبلاً تعریف شده است` }, 400);
    }

    // Check title duplication
    const duplicateTitle = await db.collection<ContractType>("contract_types").findOne({ title: title.trim() });
    if (duplicateTitle) {
      return c.json({ success: false, message: `نوع قرارداد با عنوان "${title}" قبلاً ثبت شده است` }, 400);
    }

    const doc: ContractType = {
      code: code.trim(),
      title: title.trim(),
      nature: nature.trim(),
      taxRate: body.taxRate ? Number(body.taxRate) : 0,
      insuranceRate: body.insuranceRate ? Number(body.insuranceRate) : 0,
      hasGuarantee: !!body.hasGuarantee,
      status: status === "غیرفعال" ? "غیرفعال" : "فعال",
      description: body.description ? body.description.trim() : "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await db.collection("contract_types").insertOne(doc);
    const inserted = await db.collection("contract_types").findOne({ _id: result.insertedId });
    return c.json({ success: true, data: serialize(inserted as any) }, 201);
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// PUT /api/contract-types/:id - Update contract type
router.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (!ObjectId.isValid(id)) {
      return c.json({ success: false, message: "شناسه نوع قرارداد نامعتبر است" }, 400);
    }

    const body = await c.req.json();
    const db = getDb();

    const { code, title, nature, status } = body;
    if (!code || !title || !nature || !status) {
      return c.json({ success: false, message: "وارد کردن تمامی فیلدهای ستاره‌دار الزامی است" }, 400);
    }

    // Check code duplication for other documents
    const duplicateCode = await db.collection<ContractType>("contract_types").findOne({
      code: code.trim(),
      _id: { $ne: new ObjectId(id) }
    });
    if (duplicateCode) {
      return c.json({ success: false, message: `کد نوع قرارداد "${code}" به نوع قرارداد دیگری اختصاص دارد` }, 400);
    }

    // Check title duplication for other documents
    const duplicateTitle = await db.collection<ContractType>("contract_types").findOne({
      title: title.trim(),
      _id: { $ne: new ObjectId(id) }
    });
    if (duplicateTitle) {
      return c.json({ success: false, message: `نوع قرارداد با عنوان "${title}" به نوع قرارداد دیگری اختصاص دارد` }, 400);
    }

    const { _id, createdAt, ...updateData } = body;
    const result = await db.collection<ContractType>("contract_types").findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          code: code.trim(),
          title: title.trim(),
          nature: nature.trim(),
          taxRate: updateData.taxRate ? Number(updateData.taxRate) : 0,
          insuranceRate: updateData.insuranceRate ? Number(updateData.insuranceRate) : 0,
          hasGuarantee: !!updateData.hasGuarantee,
          status: status === "غیرفعال" ? "غیرفعال" : "فعال",
          description: updateData.description ? updateData.description.trim() : "",
          updatedAt: new Date().toISOString()
        }
      },
      { returnDocument: "after" }
    );

    if (!result) {
      return c.json({ success: false, message: "نوع قرارداد مورد نظر جهت ویرایش یافت نشد" }, 404);
    }

    return c.json({ success: true, data: serialize(result as any) });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// DELETE /api/contract-types/:id - Delete contract type
router.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (!ObjectId.isValid(id)) {
      return c.json({ success: false, message: "شناسه نوع قرارداد نامعتبر است" }, 400);
    }

    const db = getDb();
    const result = await db.collection<ContractType>("contract_types").deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return c.json({ success: false, message: "نوع قرارداد مورد نظر یافت نشد" }, 404);
    }
    return c.json({ success: true, message: "نوع قرارداد با موفقیت حذف شد" });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

export default router;
