import { Hono } from "hono";
import { getDb } from "../db/index.js";
import { ObjectId } from "mongodb";
import type { ContractCancellation, Contract } from "../db/types.js";

const router = new Hono();

function serialize(doc: Record<string, unknown> | Record<string, unknown>[]) {
  return JSON.parse(JSON.stringify(doc, (_k, v) =>
    v instanceof ObjectId ? v.toHexString() : v
  ));
}

// GET /api/contract-cancellations - List all cancellations
router.get("/", async (c) => {
  try {
    const db = getDb();
    const list = await db.collection<ContractCancellation>("contract_cancellations")
      .find()
      .sort({ cancellation_date: -1 })
      .toArray();
    return c.json({ success: true, data: serialize(list as any) });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// GET /api/contract-cancellations/suggest-number - Suggest next sequential cancellation number
router.get("/suggest-number", async (c) => {
  try {
    const db = getDb();
    const items = await db.collection<ContractCancellation>("contract_cancellations")
      .find()
      .toArray();
    
    let nextNum = 1;
    const yearPrefix = 1403; // Default public sector fiscal year
    
    if (items.length > 0) {
      const numbers = items
        .map(i => {
          const parts = i.cancellation_number.split("-");
          return parts.length > 2 ? parseInt(parts[2], 10) : NaN;
        })
        .filter(n => !isNaN(n));
      if (numbers.length > 0) {
        nextNum = Math.max(...numbers) + 1;
      }
    }
    const nextNumber = `CNCL-${yearPrefix}-${String(nextNum).padStart(3, "0")}`;
    return c.json({ success: true, cancellation_number: nextNumber });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// GET /api/contract-cancellations/:id - Get cancellation by ID
router.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (!ObjectId.isValid(id)) {
      return c.json({ success: false, message: "شناسه پرونده فسخ نامعتبر است" }, 400);
    }
    const db = getDb();
    const item = await db.collection<ContractCancellation>("contract_cancellations").findOne({ _id: new ObjectId(id) });
    if (!item) {
      return c.json({ success: false, message: "پرونده فسخ مورد نظر یافت نشد" }, 404);
    }
    return c.json({ success: true, data: serialize(item as any) });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// POST /api/contract-cancellations - Create new cancellation
router.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const db = getDb();

    const { contract_id, cancellation_number, cancellation_date, reason, status } = body;
    if (!contract_id || !cancellation_number || !cancellation_date || !reason || !status) {
      return c.json({ success: false, message: "وارد کردن تمامی فیلدهای ستاره‌دار الزامی است" }, 400);
    }

    // Verify contract exists
    if (!ObjectId.isValid(contract_id)) {
      return c.json({ success: false, message: "شناسه قرارداد انتخاب شده نامعتبر است" }, 400);
    }
    const contract = await db.collection<Contract>("contracts").findOne({ _id: new ObjectId(contract_id) });
    if (!contract) {
      return c.json({ success: false, message: "قرارداد مورد نظر یافت نشد" }, 404);
    }

    // Check duplication of cancellation_number
    const duplicate = await db.collection<ContractCancellation>("contract_cancellations").findOne({
      cancellation_number: cancellation_number.trim()
    });
    if (duplicate) {
      return c.json({ success: false, message: `شماره ابلاغیه فسخ "${cancellation_number}" قبلاً ثبت شده است` }, 400);
    }

    const doc: ContractCancellation = {
      contract_id: contract_id,
      contract_number: contract.contract_number,
      contract_title: contract.title,
      contractor_name: contract.contractor_name,
      cancellation_number: cancellation_number.trim(),
      cancellation_date: cancellation_date.trim(),
      reason: reason.trim() as any,
      damages_claimed_amount: body.damages_claimed_amount ? Number(body.damages_claimed_amount) : 0,
      guarantee_confiscation_status: body.guarantee_confiscation_status || "اقدام نشده",
      legal_case_status: body.legal_case_status || "بدون اقدام",
      status: status.trim() as any,
      description: body.description ? body.description.trim() : "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await db.collection("contract_cancellations").insertOne(doc);
    
    // Update contract status to 'cancelled' (or keep 'active' if draft cancellation)
    const newContractStatus = status === "تایید نهایی" ? "cancelled" : contract.status;
    await db.collection("contracts").updateOne(
      { _id: new ObjectId(contract_id) },
      { $set: { status: newContractStatus } }
    );

    const inserted = await db.collection("contract_cancellations").findOne({ _id: result.insertedId });
    return c.json({ success: true, data: serialize(inserted as any) }, 201);
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// PUT /api/contract-cancellations/:id - Update cancellation
router.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (!ObjectId.isValid(id)) {
      return c.json({ success: false, message: "شناسه پرونده فسخ نامعتبر است" }, 400);
    }

    const body = await c.req.json();
    const db = getDb();

    const { contract_id, cancellation_number, cancellation_date, reason, status } = body;
    if (!contract_id || !cancellation_number || !cancellation_date || !reason || !status) {
      return c.json({ success: false, message: "وارد کردن تمامی فیلدهای ستاره‌دار الزامی است" }, 400);
    }

    // Verify contract exists
    if (!ObjectId.isValid(contract_id)) {
      return c.json({ success: false, message: "شناسه قرارداد انتخاب شده نامعتبر است" }, 400);
    }
    const contract = await db.collection<Contract>("contracts").findOne({ _id: new ObjectId(contract_id) });
    if (!contract) {
      return c.json({ success: false, message: "قرارداد مورد نظر یافت نشد" }, 404);
    }

    // Check duplicate cancellation number for other documents
    const duplicate = await db.collection<ContractCancellation>("contract_cancellations").findOne({
      cancellation_number: cancellation_number.trim(),
      _id: { $ne: new ObjectId(id) }
    });
    if (duplicate) {
      return c.json({ success: false, message: `شماره ابلاغیه فسخ "${cancellation_number}" به پرونده دیگری اختصاص دارد` }, 400);
    }

    const currentCancellation = await db.collection<ContractCancellation>("contract_cancellations").findOne({ _id: new ObjectId(id) });
    if (!currentCancellation) {
      return c.json({ success: false, message: "پرونده فسخ مورد نظر یافت نشد" }, 404);
    }

    // If contract_id has changed, revert the old contract status first
    if (currentCancellation.contract_id !== contract_id) {
      await db.collection("contracts").updateOne(
        { _id: new ObjectId(currentCancellation.contract_id) },
        { $set: { status: "active" } }
      );
    }

    const { _id, createdAt, ...updateData } = body;
    const result = await db.collection<ContractCancellation>("contract_cancellations").findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          contract_id: contract_id,
          contract_number: contract.contract_number,
          contract_title: contract.title,
          contractor_name: contract.contractor_name,
          cancellation_number: cancellation_number.trim(),
          cancellation_date: cancellation_date.trim(),
          reason: reason.trim() as any,
          damages_claimed_amount: updateData.damages_claimed_amount ? Number(updateData.damages_claimed_amount) : 0,
          guarantee_confiscation_status: updateData.guarantee_confiscation_status || "اقدام نشده",
          legal_case_status: updateData.legal_case_status || "بدون اقدام",
          status: status.trim() as any,
          description: updateData.description ? updateData.description.trim() : "",
          updatedAt: new Date().toISOString()
        }
      },
      { returnDocument: "after" }
    );

    // Update contract status
    const newContractStatus = status === "تایید نهایی" ? "cancelled" : "active";
    await db.collection("contracts").updateOne(
      { _id: new ObjectId(contract_id) },
      { $set: { status: newContractStatus } }
    );

    return c.json({ success: true, data: serialize(result as any) });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// DELETE /api/contract-cancellations/:id - Delete cancellation
router.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (!ObjectId.isValid(id)) {
      return c.json({ success: false, message: "شناسه پرونده فسخ نامعتبر است" }, 400);
    }

    const db = getDb();
    const item = await db.collection<ContractCancellation>("contract_cancellations").findOne({ _id: new ObjectId(id) });
    if (!item) {
      return c.json({ success: false, message: "پرونده فسخ مورد نظر یافت نشد" }, 404);
    }

    // Revert the main contract status to 'active' before deleting cancellation
    await db.collection("contracts").updateOne(
      { _id: new ObjectId(item.contract_id) },
      { $set: { status: "active" } }
    );

    const result = await db.collection<ContractCancellation>("contract_cancellations").deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return c.json({ success: false, message: "پرونده فسخ مورد نظر یافت نشد" }, 404);
    }
    return c.json({ success: true, message: "پرونده فسخ با موفقیت حذف شد و وضعیت قرارداد به فعال تغییر یافت" });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

export default router;
