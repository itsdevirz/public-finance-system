import { Hono } from "hono";
import { ObjectId } from "mongodb";
import { getDb } from "../db/index.js";

const router = new Hono();

export interface BankStatementTransaction {
  row_num: number;
  date: string;
  time?: string;
  ref_number: string;
  debit: number;
  credit: number;
  balance: number;
  description: string;
  payer_id?: string;
  status: "unreconciled" | "reconciled" | "matched";
}

export interface BankStatementBatch {
  _id?: ObjectId | string;
  batch_number: string;
  bank_name: string;
  account_number: string;
  format_id?: string;
  format_title?: string;
  fiscal_year: string;
  import_date: string;
  date_from: string;
  date_to: string;
  total_count: number;
  total_debit: number;
  total_credit: number;
  initial_balance: number;
  ending_balance: number;
  status: "imported" | "partially_reconciled" | "fully_reconciled";
  transactions: BankStatementTransaction[];
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

function serialize(doc: Record<string, unknown>) {
  return JSON.parse(
    JSON.stringify(doc, (_k, v) => (v instanceof ObjectId ? v.toHexString() : v))
  );
}

// ─── GET /api/bank-statements (دریافت بسته‌های صورت‌حساب وارد شده) ───────────
router.get("/", async (c) => {
  try {
    const db = getDb();
    const collection = db.collection<BankStatementBatch>("bank_statements");
    // بدون داده‌های دِمو — کاملاً خالی یا رکوردهای واقعی ثبت‌شده توسط کاربر
    const data = await collection
      .find({}, { projection: { transactions: 0 } }) // عدم ارسال ریز تراکنش‌ها در لیست کلی جهت سرعت
      .sort({ createdAt: -1 })
      .toArray();

    return c.json({
      success: true,
      data: data.map((d) => serialize(d as Record<string, unknown>)),
      message: "لیست صورت‌حساب‌های الکترونیکی بانک",
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ─── GET /api/bank-statements/:id (دریافت یک بسته با ریز تراکنش‌ها) ─────────
router.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (!ObjectId.isValid(id)) return c.json({ success: false, message: "شناسه نامعتبر" }, 400);

    const db = getDb();
    const batch = await db.collection("bank_statements").findOne({ _id: new ObjectId(id) });
    if (!batch) return c.json({ success: false, message: "صورت‌حساب مورد نظر یافت نشد" }, 404);

    return c.json({
      success: true,
      data: serialize(batch as Record<string, unknown>),
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ─── POST /api/bank-statements/import (ذخیره‌سازی بسته صورت‌حساب واردشده) ───
router.post("/import", async (c) => {
  try {
    const body = await c.req.json();
    const { bank_name, account_number, fiscal_year, transactions } = body;

    if (!bank_name || !account_number || !transactions || !Array.isArray(transactions)) {
      return c.json({ success: false, message: "اطلاعات بانک، شماره حساب و تراکنش‌ها الزامی هستند" }, 400);
    }

    const db = getDb();
    const now = new Date().toISOString();
    const count = await db.collection("bank_statements").countDocuments();
    const batch_number = `IMP-${fiscal_year || "1403"}-${String(count + 1).padStart(4, "0")}`;

    // محاسبه آمار و خلاصه مالی تراکنش‌ها
    let total_debit = 0;
    let total_credit = 0;
    let initial_balance = 0;
    let ending_balance = 0;

    const formattedTransactions: BankStatementTransaction[] = transactions.map((t: any, idx: number) => {
      const debit = Number(String(t.debit || 0).replace(/,/g, "")) || 0;
      const credit = Number(String(t.credit || 0).replace(/,/g, "")) || 0;
      const balance = Number(String(t.balance || 0).replace(/,/g, "")) || 0;

      total_debit += debit;
      total_credit += credit;

      if (idx === 0) initial_balance = balance - credit + debit;
      if (idx === transactions.length - 1) ending_balance = balance;

      return {
        row_num: idx + 1,
        date: t.date || "",
        time: t.time || "",
        ref_number: t.ref_number || "",
        debit,
        credit,
        balance,
        description: t.description || "",
        payer_id: t.payer_id || "",
        status: "unreconciled",
      };
    });

    const dates = formattedTransactions.map((t) => t.date).filter(Boolean);
    const date_from = dates.length > 0 ? dates[0] : "";
    const date_to = dates.length > 0 ? dates[dates.length - 1] : "";

    const newBatch: Omit<BankStatementBatch, "_id"> = {
      batch_number,
      bank_name,
      account_number,
      format_id: body.format_id || "",
      format_title: body.format_title || "",
      fiscal_year: String(fiscal_year || "1403"),
      import_date: now.slice(0, 10).replace(/-/g, "/"),
      date_from,
      date_to,
      total_count: formattedTransactions.length,
      total_debit,
      total_credit,
      initial_balance,
      ending_balance,
      status: "imported",
      transactions: formattedTransactions,
      remarks: body.remarks || "",
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection("bank_statements").insertOne(newBatch as any);
    const inserted = await db.collection("bank_statements").findOne({ _id: result.insertedId });

    return c.json({
      success: true,
      message: `صورت‌حساب بانک با موفقیت ثبت شد (${formattedTransactions.length} تراکنش)`,
      data: serialize(inserted as Record<string, unknown>),
    }, 201);
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ─── DELETE /api/bank-statements/:id (حذف صورت‌حساب واردشده) ────────────────
router.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (!ObjectId.isValid(id)) return c.json({ success: false, message: "شناسه نامعتبر" }, 400);

    const db = getDb();
    await db.collection("bank_statements").deleteOne({ _id: new ObjectId(id) });

    return c.json({ success: true, message: "صورت‌حساب بانک با موفقیت حذف شد" });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

export default router;
