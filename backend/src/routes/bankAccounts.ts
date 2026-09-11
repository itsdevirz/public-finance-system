import { Hono } from "hono";
import { getDb } from "../db/index.js";
import { ObjectId } from "mongodb";

const router = new Hono();

// ─── GET /api/bank-accounts — دریافت تمامی حساب‌های بانکی تعریف‌شده ───────────
router.get("/", async (c) => {
  try {
    const db = getDb();
    let accounts = await db.collection("bank_accounts").find().sort({ createdAt: -1 }).toArray();

    // اگر دیتابیس خالی باشد، ثبت اولیه نمونه‌های بانک مرکزی در پایگاه داده
    if (accounts.length === 0) {
      const defaultAccounts = [
        {
          bank: "central",
          bankName: "بانک مرکزی جمهوری اسلامی ایران",
          branch: "اداره اعتبارات و خزانه‌داری کل کشور",
          accountNumber: "4001000041670114",
          moeinAccount: "11001",
          moeinTitle: "۱۱۰۰۱ — بانک پرداخت هزینه (اعتبارات هزینه‌ای)",
          sheba: "IR010000000040010000416701",
          bankCode: "010",
          branchCode: "1001",
          currency: "rial",
          accountHolder: "خزانه‌داری کل کشور - پرداخت هزینه",
          description: "حساب اعتبارات هزینه‌ای دستگاه بانک مرکزی",
          status: "active",
          isCentralBank: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          bank: "central",
          bankName: "بانک مرکزی جمهوری اسلامی ایران",
          branch: "اداره اعتبارات و خزانه‌داری کل کشور",
          accountNumber: "4002000041670115",
          moeinAccount: "11002",
          moeinTitle: "۱۱۰۰۲ — بانک پرداخت سرمایه‌ای (تملک اعتبارات سرمایه‌ای)",
          sheba: "IR010000000040020000416702",
          bankCode: "010",
          branchCode: "1001",
          currency: "rial",
          accountHolder: "خزانه‌داری کل کشور - تملک سرمایه‌ای",
          description: "حساب اعتبارات طرح‌های عمرانی و سرمایه‌ای نزد بانک مرکزی",
          status: "active",
          isCentralBank: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          bank: "melli",
          bankName: "بانک ملی ایران",
          branch: "شعبه مرکزی",
          accountNumber: "0105432100009",
          moeinAccount: "11003",
          moeinTitle: "۱۱۰۰۳ — بانک پرداخت اختصاصی",
          sheba: "IR170170000000105432100009",
          bankCode: "017",
          branchCode: "0101",
          currency: "rial",
          accountHolder: "اداره کل امور مالی دستگاه",
          description: "حساب درآمدها و پرداخت‌های اختصاصی",
          status: "active",
          isCentralBank: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ];

      await db.collection("bank_accounts").insertMany(defaultAccounts);
      accounts = await db.collection("bank_accounts").find().sort({ createdAt: -1 }).toArray();
    }

    return c.json({ success: true, data: accounts });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ─── POST /api/bank-accounts — تعریف حساب بانکی جدید ───────────────────────
router.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const db = getDb();

    if (!body.bank || !body.branch || !body.accountNumber) {
      return c.json({ success: false, message: "فیلدهای بانک، شعبه و شماره حساب الزامی هستند" }, 400);
    }

    const doc = {
      bank: body.bank,
      bankName: body.bankName || body.bank,
      branch: body.branch,
      accountNumber: body.accountNumber,
      moeinAccount: body.moeinAccount || "",
      moeinTitle: body.moeinTitle || "",
      sheba: body.sheba || "",
      bankCode: body.bankCode || "",
      branchCode: body.branchCode || "",
      currency: body.currency || "rial",
      accountHolder: body.accountHolder || "",
      description: body.description || "",
      status: body.status || "active",
      isCentralBank: body.bank === "central" || (body.accountNumber && String(body.accountNumber).startsWith("4")),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await db.collection("bank_accounts").insertOne(doc);
    return c.json({ success: true, data: { ...doc, _id: result.insertedId } }, 201);
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ─── PUT /api/bank-accounts/:id — ویرایش حساب بانکی ───────────────────────────
router.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const db = getDb();

    const { _id, ...updateFields } = body;
    updateFields.updatedAt = new Date().toISOString();
    updateFields.isCentralBank = body.bank === "central" || (body.accountNumber && String(body.accountNumber).startsWith("4"));

    const result = await db.collection("bank_accounts").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateFields },
      { returnDocument: "after" }
    );

    if (!result) {
      return c.json({ success: false, message: "حساب بانکی مورد نظر یافت نشد" }, 404);
    }

    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ─── DELETE /api/bank-accounts/:id — حذف حساب بانکی ──────────────────────────
router.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const db = getDb();

    const result = await db.collection("bank_accounts").deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return c.json({ success: false, message: "حساب بانکی مورد نظر یافت نشد" }, 404);
    }

    return c.json({ success: true, message: "حساب بانکی با موفقیت حذف شد" });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

export default router;
