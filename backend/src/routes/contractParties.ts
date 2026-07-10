import { Hono } from "hono";
import { getDb } from "../db/index.js";
import { ObjectId } from "mongodb";
import type { ContractParty } from "../db/types.js";

const router = new Hono();

function serialize(doc: Record<string, unknown>) {
  return JSON.parse(JSON.stringify(doc, (_k, v) =>
    v instanceof ObjectId ? v.toHexString() : v
  ));
}

// GET /api/contract-parties
router.get("/", async (c) => {
  try {
    const db = getDb();
    const list = await db.collection<ContractParty>("contract_parties")
      .find()
      .sort({ code: -1 })
      .toArray();
    return c.json({ success: true, data: serialize(list as any) });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// GET /api/contract-parties/suggest-code
router.get("/suggest-code", async (c) => {
  try {
    const db = getDb();
    const latestFiscalYearObj = await db.collection("fiscal_years")
      .find()
      .sort({ year: -1 })
      .limit(1)
      .toArray();
    
    let yearPrefix = 1403;
    if (latestFiscalYearObj.length > 0 && latestFiscalYearObj[0].year) {
      yearPrefix = latestFiscalYearObj[0].year;
    }

    const lastItem = await db.collection<ContractParty>("contract_parties")
      .find({ code: { $regex: `^${yearPrefix}-` } })
      .sort({ code: -1 })
      .limit(1)
      .toArray();

    let nextNumber = 1;
    if (lastItem.length > 0 && lastItem[0].code) {
      const parts = lastItem[0].code.split("-");
      const num = parseInt(parts[1], 10);
      if (!isNaN(num)) {
        nextNumber = num + 1;
      }
    }
    const nextCode = `${yearPrefix}-${String(nextNumber).padStart(5, "0")}`;
    return c.json({ success: true, code: nextCode });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// GET /api/contract-parties/:id
router.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (!ObjectId.isValid(id)) return c.json({ success: false, message: "شناسه نامعتبر" }, 400);
    const db = getDb();
    const item = await db.collection<ContractParty>("contract_parties").findOne({ _id: new ObjectId(id) });
    if (!item) {
      return c.json({ success: false, message: "طرف قرارداد یافت نشد" }, 404);
    }
    return c.json({ success: true, data: serialize(item as any) });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// POST /api/contract-parties
router.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const db = getDb();

    const { code, personType, name, nationalId, status } = body;
    if (!code || !personType || !name || !nationalId || !status) {
      return c.json({ success: false, message: "فیلدهای ستاره‌دار الزامی هستند." }, 400);
    }

    const duplicateCode = await db.collection<ContractParty>("contract_parties").findOne({ code });
    if (duplicateCode) {
      return c.json({ success: false, message: "کد طرف قرارداد تکراری است." }, 400);
    }

    const duplicateId = await db.collection<ContractParty>("contract_parties").findOne({ nationalId });
    if (duplicateId) {
      return c.json({ success: false, message: "شناسه ملی تکراری است." }, 400);
    }

    const doc = {
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await db.collection("contract_parties").insertOne(doc);
    const inserted = await db.collection("contract_parties").findOne({ _id: result.insertedId });
    return c.json({ success: true, data: serialize(inserted as any) }, 201);
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// PUT /api/contract-parties/:id
router.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (!ObjectId.isValid(id)) return c.json({ success: false, message: "شناسه نامعتبر" }, 400);
    const body = await c.req.json();
    const db = getDb();

    const { code, personType, name, nationalId, status } = body;
    if (!code || !personType || !name || !nationalId || !status) {
      return c.json({ success: false, message: "فیلدهای ستاره‌دار الزامی هستند." }, 400);
    }

    const duplicateCode = await db.collection<ContractParty>("contract_parties").findOne({
      code,
      _id: { $ne: new ObjectId(id) }
    });
    if (duplicateCode) {
      return c.json({ success: false, message: "کد طرف قرارداد تکراری است." }, 400);
    }

    const duplicateId = await db.collection<ContractParty>("contract_parties").findOne({
      nationalId,
      _id: { $ne: new ObjectId(id) }
    });
    if (duplicateId) {
      return c.json({ success: false, message: "شناسه ملی تکراری است." }, 400);
    }

    const { _id, ...updateData } = body;
    const result = await db.collection<ContractParty>("contract_parties").findOneAndUpdate(
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
      return c.json({ success: false, message: "طرف قرارداد یافت نشد" }, 404);
    }

    return c.json({ success: true, data: serialize(result as any) });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// DELETE /api/contract-parties/:id
router.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (!ObjectId.isValid(id)) return c.json({ success: false, message: "شناسه نامعتبر" }, 400);
    const db = getDb();
    const result = await db.collection<ContractParty>("contract_parties").deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return c.json({ success: false, message: "طرف قرارداد یافت نشد" }, 404);
    }
    return c.json({ success: true, message: "طرف قرارداد با موفقیت حذف شد" });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

export default router;
