import { Hono } from "hono";
import { getDb } from "../db/index.js";
import { ObjectId } from "mongodb";
import type { ContractSupplement } from "../db/types.js";

const router = new Hono();

function serialize(doc: Record<string, unknown>) {
  return JSON.parse(JSON.stringify(doc, (_k, v) =>
    v instanceof ObjectId ? v.toHexString() : v
  ));
}

async function updateContractSupplementStats(contractId: string) {
  try {
    const db = getDb();
    const supplements = await db.collection<ContractSupplement>("contract_supplements")
      .find({ contract_id: contractId })
      .toArray();

    let totalIncrease = 0;
    let totalDecrease = 0;
    let totalDurationExt = 0;

    supplements.forEach((s) => {
      if (s.supplement_type?.includes("کاهش")) {
        totalDecrease += Number(s.supplement_amount || 0);
        totalDurationExt -= Number(s.supplement_duration || 0);
      } else {
        totalIncrease += Number(s.supplement_amount || 0);
        totalDurationExt += Number(s.supplement_duration || 0);
      }
    });

    await db.collection("contracts").updateOne(
      { _id: new ObjectId(contractId) },
      {
        $set: {
          increase_amount: totalIncrease,
          decrease_amount: totalDecrease,
        }
      }
    );
  } catch (err) {
    console.error("Error updating contract supplement stats:", err);
  }
}

// GET /api/contract-supplements
router.get("/", async (c) => {
  try {
    const db = getDb();
    const list = await db.collection<ContractSupplement>("contract_supplements")
      .find()
      .sort({ supplement_date: -1 })
      .toArray();
    return c.json({ success: true, data: serialize(list as any) });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// GET /api/contract-supplements/suggest-number
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

    const lastItem = await db.collection<ContractSupplement>("contract_supplements")
      .find({ supplement_number: { $regex: `^${yearPrefix}-M-` } })
      .sort({ supplement_number: -1 })
      .limit(1)
      .toArray();

    let nextNumber = 1;
    if (lastItem.length > 0 && lastItem[0].supplement_number) {
      const parts = lastItem[0].supplement_number.split("-M-");
      if (parts.length > 1) {
        const num = parseInt(parts[1], 10);
        if (!isNaN(num)) {
          nextNumber = num + 1;
        }
      }
    }
    const nextNumberStr = `${yearPrefix}-M-${String(nextNumber).padStart(4, "0")}`;
    return c.json({ success: true, supplement_number: nextNumberStr });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// GET /api/contract-supplements/:id
router.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (!ObjectId.isValid(id)) return c.json({ success: false, message: "شناسه نامعتبر" }, 400);
    const db = getDb();
    const item = await db.collection<ContractSupplement>("contract_supplements").findOne({ _id: new ObjectId(id) });
    if (!item) {
      return c.json({ success: false, message: "متمم یافت نشد" }, 404);
    }
    return c.json({ success: true, data: serialize(item as any) });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// POST /api/contract-supplements
router.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const db = getDb();

    const { contract_id, supplement_number, supplement_type, supplement_date } = body;
    if (!contract_id || !supplement_number || !supplement_type || !supplement_date) {
      return c.json({ success: false, message: "فیلدهای ستاره‌دار الزامی هستند." }, 400);
    }

    const duplicate = await db.collection<ContractSupplement>("contract_supplements").findOne({
      supplement_number
    });
    if (duplicate) {
      return c.json({ success: false, message: "این شماره متمم قبلاً ثبت شده است." }, 400);
    }

    const doc = {
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await db.collection("contract_supplements").insertOne(doc);

    // Sync to contracts collection
    await updateContractSupplementStats(contract_id);

    // Pushes mtemm references directly into dynamic array on contracts for registration summaries
    const mtemmRecord = {
      addendum_number: body.supplement_number,
      type: body.supplement_type?.includes("کاهش") ? "کاهش" : "افزایش",
      amount: body.supplement_amount || 0,
      description: body.description || "",
      date: body.supplement_date,
    };
    await db.collection("contracts").updateOne(
      { _id: new ObjectId(contract_id) },
      { $push: { addenda: mtemmRecord } as any }
    );

    const inserted = await db.collection("contract_supplements").findOne({ _id: result.insertedId });
    return c.json({ success: true, data: serialize(inserted as any) }, 201);
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// PUT /api/contract-supplements/:id
router.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (!ObjectId.isValid(id)) return c.json({ success: false, message: "شناسه نامعتبر" }, 400);
    const body = await c.req.json();
    const db = getDb();

    const { contract_id, supplement_number, supplement_type, supplement_date } = body;
    if (!contract_id || !supplement_number || !supplement_type || !supplement_date) {
      return c.json({ success: false, message: "فیلدهای ستاره‌دار الزامی هستند." }, 400);
    }

    const duplicate = await db.collection<ContractSupplement>("contract_supplements").findOne({
      supplement_number,
      _id: { $ne: new ObjectId(id) }
    });
    if (duplicate) {
      return c.json({ success: false, message: "این شماره متمم قبلاً ثبت شده است." }, 400);
    }

    const { _id, ...updateData } = body;
    const result = await db.collection<ContractSupplement>("contract_supplements").findOneAndUpdate(
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
      return c.json({ success: false, message: "متمم یافت نشد" }, 404);
    }

    // Sync to contracts collection
    await updateContractSupplementStats(contract_id);

    return c.json({ success: true, data: serialize(result as any) });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// DELETE /api/contract-supplements/:id
router.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (!ObjectId.isValid(id)) return c.json({ success: false, message: "شناسه نامعتبر" }, 400);
    const db = getDb();
    const doc = await db.collection<ContractSupplement>("contract_supplements").findOne({ _id: new ObjectId(id) });
    if (!doc) {
      return c.json({ success: false, message: "متمم یافت نشد" }, 404);
    }
    
    await db.collection<ContractSupplement>("contract_supplements").deleteOne({ _id: new ObjectId(id) });

    // Sync contract
    await updateContractSupplementStats(doc.contract_id);

    return c.json({ success: true, message: "متمم با موفقیت حذف شد" });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

export default router;
