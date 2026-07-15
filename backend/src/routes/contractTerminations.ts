import { Hono } from "hono";
import { getDb } from "../db/index.js";
import { ObjectId } from "mongodb";
import type { ContractTermination, Contract } from "../db/types.js";

const router = new Hono();

function serialize(doc: Record<string, unknown> | Record<string, unknown>[]) {
  return JSON.parse(JSON.stringify(doc, (_k, v) =>
    v instanceof ObjectId ? v.toHexString() : v
  ));
}

// GET /api/contract-terminations - List all terminations
router.get("/", async (c) => {
  try {
    const db = getDb();
    const list = await db.collection<ContractTermination>("contract_terminations")
      .find()
      .sort({ termination_date: -1 })
      .toArray();
    return c.json({ success: true, data: serialize(list as any) });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// GET /api/contract-terminations/suggest-number - Suggest next sequential termination number
router.get("/suggest-number", async (c) => {
  try {
    const db = getDb();
    const items = await db.collection<ContractTermination>("contract_terminations")
      .find()
      .toArray();
    
    let nextNum = 1;
    const yearPrefix = 1403; // Default public sector fiscal year
    
    if (items.length > 0) {
      const numbers = items
        .map(i => {
          const parts = i.termination_number.split("-");
          return parts.length > 2 ? parseInt(parts[2], 10) : NaN;
        })
        .filter(n => !isNaN(n));
      if (numbers.length > 0) {
        nextNum = Math.max(...numbers) + 1;
      }
    }
    const nextNumber = `TERM-${yearPrefix}-${String(nextNum).padStart(3, "0")}`;
    return c.json({ success: true, termination_number: nextNumber });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// GET /api/contract-terminations/:id - Get termination by ID
router.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (!ObjectId.isValid(id)) {
      return c.json({ success: false, message: "شناسه صورت‌جلسه خاتمه نامعتبر است" }, 400);
    }
    const db = getDb();
    const item = await db.collection<ContractTermination>("contract_terminations").findOne({ _id: new ObjectId(id) });
    if (!item) {
      return c.json({ success: false, message: "صورت‌جلسه خاتمه مورد نظر یافت نشد" }, 404);
    }
    return c.json({ success: true, data: serialize(item as any) });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// POST /api/contract-terminations - Create new termination
router.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const db = getDb();

    const { contract_id, termination_number, termination_date, reason, status } = body;
    if (!contract_id || !termination_number || !termination_date || !reason || !status) {
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

    // Check duplication of termination_number
    const duplicate = await db.collection<ContractTermination>("contract_terminations").findOne({
      termination_number: termination_number.trim()
    });
    if (duplicate) {
      return c.json({ success: false, message: `شماره ابلاغیه خاتمه "${termination_number}" قبلاً ثبت شده است` }, 400);
    }

    const doc: ContractTermination = {
      contract_id: contract_id,
      contract_number: contract.contract_number,
      contract_title: contract.title,
      contractor_name: contract.contractor_name,
      termination_number: termination_number.trim(),
      termination_date: termination_date.trim(),
      reason: reason.trim() as any,
      work_done_amount: body.work_done_amount ? Number(body.work_done_amount) : 0,
      settlement_status: body.settlement_status || "تسویه نشده",
      guarantee_refund_status: body.guarantee_refund_status || "آزاد نشده",
      status: status.trim() as any,
      description: body.description ? body.description.trim() : "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await db.collection("contract_terminations").insertOne(doc);
    
    // Update contract status to 'completed' (or keep 'active' if draft termination)
    const newContractStatus = status === "تایید نهایی" ? "completed" : contract.status;
    await db.collection("contracts").updateOne(
      { _id: new ObjectId(contract_id) },
      { $set: { status: newContractStatus } }
    );

    const inserted = await db.collection("contract_terminations").findOne({ _id: result.insertedId });
    return c.json({ success: true, data: serialize(inserted as any) }, 201);
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// PUT /api/contract-terminations/:id - Update termination
router.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (!ObjectId.isValid(id)) {
      return c.json({ success: false, message: "شناسه صورت‌جلسه خاتمه نامعتبر است" }, 400);
    }

    const body = await c.req.json();
    const db = getDb();

    const { contract_id, termination_number, termination_date, reason, status } = body;
    if (!contract_id || !termination_number || !termination_date || !reason || !status) {
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

    // Check duplicate termination number for other documents
    const duplicate = await db.collection<ContractTermination>("contract_terminations").findOne({
      termination_number: termination_number.trim(),
      _id: { $ne: new ObjectId(id) }
    });
    if (duplicate) {
      return c.json({ success: false, message: `شماره ابلاغیه خاتمه "${termination_number}" به پرونده دیگری اختصاص دارد` }, 400);
    }

    const currentTermination = await db.collection<ContractTermination>("contract_terminations").findOne({ _id: new ObjectId(id) });
    if (!currentTermination) {
      return c.json({ success: false, message: "صورت‌جلسه خاتمه مورد نظر یافت نشد" }, 404);
    }

    // If contract_id has changed, revert the old contract status first
    if (currentTermination.contract_id !== contract_id) {
      await db.collection("contracts").updateOne(
        { _id: new ObjectId(currentTermination.contract_id) },
        { $set: { status: "active" } }
      );
    }

    const { _id, createdAt, ...updateData } = body;
    const result = await db.collection<ContractTermination>("contract_terminations").findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          contract_id: contract_id,
          contract_number: contract.contract_number,
          contract_title: contract.title,
          contractor_name: contract.contractor_name,
          termination_number: termination_number.trim(),
          termination_date: termination_date.trim(),
          reason: reason.trim() as any,
          work_done_amount: updateData.work_done_amount ? Number(updateData.work_done_amount) : 0,
          settlement_status: updateData.settlement_status || "تسویه نشده",
          guarantee_refund_status: updateData.guarantee_refund_status || "آزاد نشده",
          status: status.trim() as any,
          description: updateData.description ? updateData.description.trim() : "",
          updatedAt: new Date().toISOString()
        }
      },
      { returnDocument: "after" }
    );

    // Update contract status
    const newContractStatus = status === "تایید نهایی" ? "completed" : "active";
    await db.collection("contracts").updateOne(
      { _id: new ObjectId(contract_id) },
      { $set: { status: newContractStatus } }
    );

    return c.json({ success: true, data: serialize(result as any) });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// DELETE /api/contract-terminations/:id - Delete termination
router.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (!ObjectId.isValid(id)) {
      return c.json({ success: false, message: "شناسه صورت‌جلسه خاتمه نامعتبر است" }, 400);
    }

    const db = getDb();
    const item = await db.collection<ContractTermination>("contract_terminations").findOne({ _id: new ObjectId(id) });
    if (!item) {
      return c.json({ success: false, message: "صورت‌جلسه خاتمه مورد نظر یافت نشد" }, 404);
    }

    // Revert the main contract status to 'active' before deleting termination
    await db.collection("contracts").updateOne(
      { _id: new ObjectId(item.contract_id) },
      { $set: { status: "active" } }
    );

    const result = await db.collection<ContractTermination>("contract_terminations").deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return c.json({ success: false, message: "صورت‌جلسه خاتمه مورد نظر یافت نشد" }, 404);
    }
    return c.json({ success: true, message: "صورت‌جلسه خاتمه با موفقیت حذف شد و وضعیت قرارداد به فعال تغییر یافت" });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

export default router;
