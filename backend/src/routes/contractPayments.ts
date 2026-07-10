import { Hono } from "hono";
import { getDb } from "../db/index.js";
import { ObjectId } from "mongodb";
import type { ContractPayment } from "../db/types.js";

const router = new Hono();

function serialize(doc: Record<string, unknown>) {
  return JSON.parse(JSON.stringify(doc, (_k, v) =>
    v instanceof ObjectId ? v.toHexString() : v
  ));
}

// GET /api/contract-payments
router.get("/", async (c) => {
  try {
    const db = getDb();
    const list = await db.collection<ContractPayment>("contract_payments")
      .find()
      .sort({ payment_date: -1 })
      .toArray();
    return c.json({ success: true, data: serialize(list as any) });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// GET /api/contract-payments/suggest-number
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

    const lastItem = await db.collection<ContractPayment>("contract_payments")
      .find({ payment_number: { $regex: `^${yearPrefix}-` } })
      .sort({ payment_number: -1 })
      .limit(1)
      .toArray();

    let nextNumber = 1;
    if (lastItem.length > 0 && lastItem[0].payment_number) {
      const parts = lastItem[0].payment_number.split("-");
      if (parts.length > 1) {
        const num = parseInt(parts[1], 10);
        if (!isNaN(num)) {
          nextNumber = num + 1;
        }
      }
    }
    const nextNumberStr = `${yearPrefix}-${String(nextNumber).padStart(5, "0")}`;
    return c.json({ success: true, payment_number: nextNumberStr });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// GET /api/contract-payments/:id
router.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (!ObjectId.isValid(id)) return c.json({ success: false, message: "شناسه نامعتبر" }, 400);
    const db = getDb();
    const item = await db.collection<ContractPayment>("contract_payments").findOne({ _id: new ObjectId(id) });
    if (!item) {
      return c.json({ success: false, message: "پرداخت یافت نشد" }, 404);
    }
    return c.json({ success: true, data: serialize(item as any) });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// POST /api/contract-payments
router.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const db = getDb();

    const { contract_id, payment_number, payment_date, payment_method, payment_account } = body;
    if (!contract_id || !payment_number || !payment_date || !payment_method || !payment_account) {
      return c.json({ success: false, message: "فیلدهای ستاره‌دار الزامی هستند." }, 400);
    }

    const duplicate = await db.collection<ContractPayment>("contract_payments").findOne({
      payment_number
    });
    if (duplicate) {
      return c.json({ success: false, message: "این شماره پرداخت قبلاً ثبت شده است." }, 400);
    }

    const doc = {
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await db.collection("contract_payments").insertOne(doc);
    
    // Auto-update linked progress bill to paid and link this payment document
    if (body.statement_id && ObjectId.isValid(body.statement_id)) {
      await db.collection("progress_bills").updateOne(
        { _id: new ObjectId(body.statement_id) },
        { $set: { status: "پرداخت شده" } }
      );
    }

    // Auto-insert payment doc reference in contract payments sub-collection
    if (body.contract_id && ObjectId.isValid(body.contract_id)) {
      const netPay = body.payable_amount || (body.gross_amount - body.total_deductions);
      const paymentRecord = {
        payment_date: body.payment_date,
        gross_amount: body.gross_amount,
        deductions: body.total_deductions,
        net_amount: netPay,
        document_number: body.doc_number || body.payment_number,
      };
      await db.collection("contracts").updateOne(
        { _id: new ObjectId(body.contract_id) },
        { $push: { payments: paymentRecord } as any }
      );
    }

    const inserted = await db.collection("contract_payments").findOne({ _id: result.insertedId });
    return c.json({ success: true, data: serialize(inserted as any) }, 201);
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// PUT /api/contract-payments/:id
router.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (!ObjectId.isValid(id)) return c.json({ success: false, message: "شناسه نامعتبر" }, 400);
    const body = await c.req.json();
    const db = getDb();

    const { contract_id, payment_number, payment_date, payment_method, payment_account } = body;
    if (!contract_id || !payment_number || !payment_date || !payment_method || !payment_account) {
      return c.json({ success: false, message: "فیلدهای ستاره‌دار الزامی هستند." }, 400);
    }

    const duplicate = await db.collection<ContractPayment>("contract_payments").findOne({
      payment_number,
      _id: { $ne: new ObjectId(id) }
    });
    if (duplicate) {
      return c.json({ success: false, message: "این شماره پرداخت قبلاً ثبت شده است." }, 400);
    }

    const { _id, ...updateData } = body;
    const result = await db.collection<ContractPayment>("contract_payments").findOneAndUpdate(
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
      return c.json({ success: false, message: "پرداخت یافت نشد" }, 404);
    }

    return c.json({ success: true, data: serialize(result as any) });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// DELETE /api/contract-payments/:id
router.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (!ObjectId.isValid(id)) return c.json({ success: false, message: "شناسه نامعتبر" }, 400);
    const db = getDb();
    const result = await db.collection<ContractPayment>("contract_payments").deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return c.json({ success: false, message: "پرداخت یافت نشد" }, 404);
    }
    return c.json({ success: true, message: "پرداخت با موفقیت حذف شد" });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

export default router;
