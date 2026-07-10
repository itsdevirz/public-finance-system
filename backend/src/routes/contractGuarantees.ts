import { Hono } from "hono";
import { getDb } from "../db/index.js";
import { ObjectId } from "mongodb";
import type { ContractGuarantee } from "../db/types.js";

const router = new Hono();

function serialize(doc: Record<string, unknown>) {
  return JSON.parse(JSON.stringify(doc, (_k, v) =>
    v instanceof ObjectId ? v.toHexString() : v
  ));
}

// GET /api/contract-guarantees
router.get("/", async (c) => {
  try {
    const db = getDb();
    const list = await db.collection<ContractGuarantee>("contract_guarantees")
      .find()
      .sort({ expiry_date: -1 })
      .toArray();
    return c.json({ success: true, data: serialize(list as any) });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// GET /api/contract-guarantees/suggest-number
router.get("/suggest-number", async (c) => {
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

    const lastItem = await db.collection<ContractGuarantee>("contract_guarantees")
      .find({ guarantee_number: { $regex: `^${yearPrefix}-` } })
      .sort({ guarantee_number: -1 })
      .limit(1)
      .toArray();

    let nextNumber = 1;
    if (lastItem.length > 0 && lastItem[0].guarantee_number) {
      const parts = lastItem[0].guarantee_number.split("-");
      if (parts.length > 1) {
        const num = parseInt(parts[1], 10);
        if (!isNaN(num)) {
          nextNumber = num + 1;
        }
      }
    }
    const nextNumberStr = `${yearPrefix}-${String(nextNumber).padStart(5, "0")}`;
    return c.json({ success: true, guarantee_number: nextNumberStr });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// GET /api/contract-guarantees/:id
router.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (!ObjectId.isValid(id)) return c.json({ success: false, message: "شناسه نامعتبر" }, 400);
    const db = getDb();
    const item = await db.collection<ContractGuarantee>("contract_guarantees").findOne({ _id: new ObjectId(id) });
    if (!item) {
      return c.json({ success: false, message: "ضمانت‌نامه یافت نشد" }, 404);
    }
    return c.json({ success: true, data: serialize(item as any) });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// POST /api/contract-guarantees
router.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const db = getDb();

    const { contract_id, guarantee_number, guarantee_type, amount, issue_date, expiry_date } = body;
    if (!contract_id || !guarantee_number || !guarantee_type || !amount || !issue_date || !expiry_date) {
      return c.json({ success: false, message: "فیلدهای ستاره‌دار الزامی هستند." }, 400);
    }

    const duplicate = await db.collection<ContractGuarantee>("contract_guarantees").findOne({
      guarantee_number
    });
    if (duplicate) {
      return c.json({ success: false, message: "این شماره ضمانت‌نامه قبلاً ثبت شده است." }, 400);
    }

    const doc = {
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await db.collection("contract_guarantees").insertOne(doc);

    // Auto-update guarantee details on contract document
    if (body.contract_id && ObjectId.isValid(body.contract_id)) {
      await db.collection("contracts").updateOne(
        { _id: new ObjectId(body.contract_id) },
        {
          $set: {
            guarantee_status: body.status || "معتبر",
            guarantee_expiry_date: body.expiry_date,
          }
        }
      );
    }

    const inserted = await db.collection("contract_guarantees").findOne({ _id: result.insertedId });
    return c.json({ success: true, data: serialize(inserted as any) }, 201);
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// PUT /api/contract-guarantees/:id
router.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (!ObjectId.isValid(id)) return c.json({ success: false, message: "شناسه نامعتبر" }, 400);
    const body = await c.req.json();
    const db = getDb();

    const { contract_id, guarantee_number, guarantee_type, amount, issue_date, expiry_date } = body;
    if (!contract_id || !guarantee_number || !guarantee_type || !amount || !issue_date || !expiry_date) {
      return c.json({ success: false, message: "فیلدهای ستاره‌دار الزامی هستند." }, 400);
    }

    const duplicate = await db.collection<ContractGuarantee>("contract_guarantees").findOne({
      guarantee_number,
      _id: { $ne: new ObjectId(id) }
    });
    if (duplicate) {
      return c.json({ success: false, message: "این شماره ضمانت‌نامه قبلاً ثبت شده است." }, 400);
    }

    const { _id, ...updateData } = body;
    const result = await db.collection<ContractGuarantee>("contract_guarantees").findOneAndUpdate(
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
      return c.json({ success: false, message: "ضمانت‌نامه یافت نشد" }, 404);
    }

    return c.json({ success: true, data: serialize(result as any) });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// DELETE /api/contract-guarantees/:id
router.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (!ObjectId.isValid(id)) return c.json({ success: false, message: "شناسه نامعتبر" }, 400);
    const db = getDb();
    const result = await db.collection<ContractGuarantee>("contract_guarantees").deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return c.json({ success: false, message: "ضمانت‌نامه یافت نشد" }, 404);
    }
    return c.json({ success: true, message: "ضمانت‌نامه با موفقیت حذف شد" });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

export default router;
