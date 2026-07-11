import { Hono } from "hono";
import { getDb } from "../db/index.js";
import { ObjectId } from "mongodb";
import type { ContractAddendumDocument } from "../db/types.js";

const router = new Hono();

function serialize(doc: Record<string, unknown>) {
  return JSON.parse(JSON.stringify(doc, (_k, v) =>
    v instanceof ObjectId ? v.toHexString() : v
  ));
}

async function syncContractAddendaAndSupplements(contractId: string) {
  try {
    const db = getDb();
    
    // 1. Get all supplements
    const supplements = await db.collection("contract_supplements")
      .find({ contract_id: contractId })
      .toArray();
      
    // 2. Get all addenda
    const addendaDocs = await db.collection("contract_addenda")
      .find({ contract_id: contractId })
      .toArray();

    // 3. Rebuild addenda list on contract
    const addendaRecords: any[] = [];
    let totalIncrease = 0;
    let totalDecrease = 0;

    supplements.forEach((s: any) => {
      const isDecrease = s.supplement_type?.includes("کاهش");
      const amt = Number(s.supplement_amount || 0);
      if (isDecrease) {
        totalDecrease += amt;
      } else {
        totalIncrease += amt;
      }
      addendaRecords.push({
        addendum_number: s.supplement_number,
        type: isDecrease ? "کاهش" : "افزایش",
        amount: amt,
        description: s.description || "",
        date: s.supplement_date,
      });
    });

    addendaDocs.forEach((a: any) => {
      const isDecrease = a.addendum_type?.includes("کاهش");
      const amt = Number(a.addendum_amount || 0);
      if (isDecrease) {
        totalDecrease += amt;
      } else {
        totalIncrease += amt;
      }
      addendaRecords.push({
        addendum_number: a.addendum_number,
        type: isDecrease ? "کاهش" : "افزایش",
        amount: amt,
        description: a.description || "",
        date: a.addendum_date,
      });
    });

    // 4. Update contract document
    await db.collection("contracts").updateOne(
      { _id: new ObjectId(contractId) },
      {
        $set: {
          increase_amount: totalIncrease,
          decrease_amount: totalDecrease,
          addenda: addendaRecords,
        }
      }
    );
  } catch (err) {
    console.error("Error syncing contract addenda and supplements:", err);
  }
}

// GET /api/contract-addenda
router.get("/", async (c) => {
  try {
    const db = getDb();
    const list = await db.collection("contract_addenda")
      .find()
      .sort({ addendum_date: -1 })
      .toArray();
    return c.json({ success: true, data: serialize(list as any) });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// GET /api/contract-addenda/suggest-number
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

    const lastItem = await db.collection("contract_addenda")
      .find({ addendum_number: { $regex: `^${yearPrefix}-A-` } })
      .sort({ addendum_number: -1 })
      .limit(1)
      .toArray();

    let nextNumber = 1;
    if (lastItem.length > 0 && lastItem[0].addendum_number) {
      const parts = lastItem[0].addendum_number.split("-A-");
      if (parts.length > 1) {
        const num = parseInt(parts[1], 10);
        if (!isNaN(num)) {
          nextNumber = num + 1;
        }
      }
    }
    const nextNumberStr = `${yearPrefix}-A-${String(nextNumber).padStart(4, "0")}`;
    return c.json({ success: true, addendum_number: nextNumberStr });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// GET /api/contract-addenda/:id
router.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (!ObjectId.isValid(id)) return c.json({ success: false, message: "شناسه نامعتبر" }, 400);
    const db = getDb();
    const item = await db.collection("contract_addenda").findOne({ _id: new ObjectId(id) });
    if (!item) {
      return c.json({ success: false, message: "الحاقیه یافت نشد" }, 404);
    }
    return c.json({ success: true, data: serialize(item as any) });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// POST /api/contract-addenda
router.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const db = getDb();

    const { contract_id, addendum_number, addendum_type, addendum_date } = body;
    if (!contract_id || !addendum_number || !addendum_type || !addendum_date) {
      return c.json({ success: false, message: "فیلدهای ستاره‌دار الزامی هستند." }, 400);
    }

    const duplicate = await db.collection("contract_addenda").findOne({
      addendum_number
    });
    if (duplicate) {
      return c.json({ success: false, message: "این شماره الحاقیه قبلاً ثبت شده است." }, 400);
    }

    const doc = {
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await db.collection("contract_addenda").insertOne(doc);

    // Sync to contracts collection
    await syncContractAddendaAndSupplements(contract_id);

    const inserted = await db.collection("contract_addenda").findOne({ _id: result.insertedId });
    return c.json({ success: true, data: serialize(inserted as any) }, 201);
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// PUT /api/contract-addenda/:id
router.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (!ObjectId.isValid(id)) return c.json({ success: false, message: "شناسه نامعتبر" }, 400);
    const body = await c.req.json();
    const db = getDb();

    const { contract_id, addendum_number, addendum_type, addendum_date } = body;
    if (!contract_id || !addendum_number || !addendum_type || !addendum_date) {
      return c.json({ success: false, message: "فیلدهای ستاره‌دار الزامی هستند." }, 400);
    }

    const duplicate = await db.collection("contract_addenda").findOne({
      addendum_number,
      _id: { $ne: new ObjectId(id) }
    });
    if (duplicate) {
      return c.json({ success: false, message: "این شماره الحاقیه قبلاً ثبت شده است." }, 400);
    }

    const { _id, ...updateData } = body;
    const result = await db.collection("contract_addenda").findOneAndUpdate(
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
      return c.json({ success: false, message: "الحاقیه یافت نشد" }, 404);
    }

    // Sync to contracts collection
    await syncContractAddendaAndSupplements(contract_id);

    return c.json({ success: true, data: serialize(result as any) });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// DELETE /api/contract-addenda/:id
router.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (!ObjectId.isValid(id)) return c.json({ success: false, message: "شناسه نامعتبر" }, 400);
    const db = getDb();
    const doc = await db.collection("contract_addenda").findOne({ _id: new ObjectId(id) });
    if (!doc) {
      return c.json({ success: false, message: "الحاقیه یافت نشد" }, 404);
    }
    
    await db.collection("contract_addenda").deleteOne({ _id: new ObjectId(id) });

    // Sync contract
    await syncContractAddendaAndSupplements(doc.contract_id);

    return c.json({ success: true, message: "الحاقیه با موفقیت حذف شد" });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

export default router;
