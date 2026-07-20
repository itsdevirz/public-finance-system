import { Hono } from "hono";
import { ObjectId } from "mongodb";
import { getDb } from "../db/index.js";
import type { Agreement, CreditAllocation, CreditReceipt, CreditDelegation } from "../db/types.js";

const router = new Hono();

function serialize(doc: Record<string, unknown>) {
  return JSON.parse(JSON.stringify(doc, (_k, v) =>
    v instanceof ObjectId ? v.toHexString() : v
  ));
}

// ─── Agreements ───────────────────────────────────────────────────────────────

router.get("/agreements", async (c) => {
  const data = await getDb().collection<Agreement>("agreements").find().toArray();
  return c.json({ data: data.map((d) => serialize(d as Record<string, unknown>)), message: "لیست موافقتنامه‌ها" });
});

router.post("/agreements", async (c) => {
  const body = await c.req.json();
  const agreement_number = `AGR-${body.fiscal_year}-${Date.now()}`;
  const result = await getDb().collection<Agreement>("agreements").insertOne({
    ...body, agreement_number, status: body.status ?? "draft",
  });
  const inserted = await getDb().collection<Agreement>("agreements").findOne({ _id: result.insertedId });
  return c.json({ message: "موافقتنامه ثبت شد", data: serialize(inserted as Record<string, unknown>) }, 201);
});

router.put("/agreements/:id", async (c) => {
  const id = c.req.param("id");
  let oid: ObjectId;
  try { oid = new ObjectId(id); } catch { return c.json({ message: "شناسه نامعتبر است" }, 400); }
  const body = await c.req.json();
  const { _id, ...updateData } = body;
  const result = await getDb().collection<Agreement>("agreements").findOneAndUpdate(
    { _id: oid },
    { $set: { ...updateData } },
    { returnDocument: "after" }
  );
  if (!result) return c.json({ message: "موافقتنامه یافت نشد" }, 404);
  return c.json({ message: "موافقتنامه با موفقیت ویرایش شد", data: serialize(result as Record<string, unknown>) });
});

router.delete("/agreements/:id", async (c) => {
  const id = c.req.param("id");
  let oid: ObjectId;
  try { oid = new ObjectId(id); } catch { return c.json({ message: "شناسه نامعتبر است" }, 400); }
  const result = await getDb().collection("agreements").deleteOne({ _id: oid });
  if (result.deletedCount === 0) return c.json({ message: "موافقتنامه یافت نشد" }, 404);
  return c.json({ message: "موافقتنامه با موفقیت حذف شد" });
});

// ─── Allocations ──────────────────────────────────────────────────────────────

router.get("/allocations", async (c) => {
  const data = await getDb().collection<CreditAllocation>("credit_allocations").find().toArray();
  return c.json({ data: data.map((d) => serialize(d as Record<string, unknown>)), message: "لیست تخصیص‌ها" });
});

router.post("/allocations", async (c) => {
  const body = await c.req.json();
  const allocation_number = `ALLOC-${body.fiscal_year}-${Date.now()}`;
  const result = await getDb().collection<CreditAllocation>("credit_allocations").insertOne({
    ...body,
    allocation_number,
    status: body.status ?? "draft",
    agreement_id: body.agreement_id ? new ObjectId(body.agreement_id) : undefined,
  });
  const inserted = await getDb().collection<CreditAllocation>("credit_allocations").findOne({ _id: result.insertedId });
  return c.json({ message: "تخصیص ثبت شد", data: serialize(inserted as Record<string, unknown>) }, 201);
});

router.put("/allocations/:id", async (c) => {
  const id = c.req.param("id");
  let oid: ObjectId;
  try { oid = new ObjectId(id); } catch { return c.json({ message: "شناسه نامعتبر است" }, 400); }
  const body = await c.req.json();
  const { _id, agreement_id, ...updateData } = body;
  const result = await getDb().collection<CreditAllocation>("credit_allocations").findOneAndUpdate(
    { _id: oid },
    {
      $set: {
        ...updateData,
        agreement_id: agreement_id ? new ObjectId(agreement_id) : undefined,
      }
    },
    { returnDocument: "after" }
  );
  if (!result) return c.json({ message: "تخصیص یافت نشد" }, 404);
  return c.json({ message: "تخصیص با موفقیت ویرایش شد", data: serialize(result as Record<string, unknown>) });
});

router.delete("/allocations/:id", async (c) => {
  const id = c.req.param("id");
  let oid: ObjectId;
  try { oid = new ObjectId(id); } catch { return c.json({ message: "شناسه نامعتبر است" }, 400); }
  const result = await getDb().collection("credit_allocations").deleteOne({ _id: oid });
  if (result.deletedCount === 0) return c.json({ message: "تخصیص یافت نشد" }, 404);
  return c.json({ message: "تخصیص با موفقیت حذف شد" });
});

// ─── Budget Requests (درخواست وجه) ───────────────────────────────────────────

router.get("/requests", async (c) => {
  const data = await getDb().collection("budget_requests").find().toArray();
  return c.json({ data: data.map((d) => serialize(d as Record<string, unknown>)), message: "لیست درخواست‌های وجه" });
});

router.post("/requests", async (c) => {
  const body = await c.req.json();
  const request_number = body.request_number || `REQ-${body.fiscal_year || 1403}-${Date.now()}`;
  const result = await getDb().collection("budget_requests").insertOne({
    ...body,
    request_number,
    status: body.status ?? "pending",
    agreement_id: body.agreement_id ? new ObjectId(body.agreement_id) : undefined,
  });
  const inserted = await getDb().collection("budget_requests").findOne({ _id: result.insertedId });
  return c.json({ message: "درخواست وجه ثبت شد", data: serialize(inserted as Record<string, unknown>) }, 201);
});

router.put("/requests/:id", async (c) => {
  const id = c.req.param("id");
  let oid: ObjectId;
  try { oid = new ObjectId(id); } catch { return c.json({ message: "شناسه نامعتبر است" }, 400); }
  const body = await c.req.json();
  const { _id, agreement_id, ...updateData } = body;
  const result = await getDb().collection("budget_requests").findOneAndUpdate(
    { _id: oid },
    {
      $set: {
        ...updateData,
        agreement_id: agreement_id ? new ObjectId(agreement_id) : undefined,
      }
    },
    { returnDocument: "after" }
  );
  if (!result) return c.json({ message: "درخواست وجه یافت نشد" }, 404);
  return c.json({ message: "درخواست وجه با موفقیت ویرایش شد", data: serialize(result as Record<string, unknown>) });
});

router.delete("/requests/:id", async (c) => {
  const id = c.req.param("id");
  let oid: ObjectId;
  try { oid = new ObjectId(id); } catch { return c.json({ message: "شناسه نامعتبر است" }, 400); }
  const result = await getDb().collection("budget_requests").deleteOne({ _id: oid });
  if (result.deletedCount === 0) return c.json({ message: "درخواست وجه یافت نشد" }, 404);
  return c.json({ message: "درخواست وجه با موفقیت حذف شد" });
});

// ─── Receipts ─────────────────────────────────────────────────────────────────

router.get("/receipts", async (c) => {
  const data = await getDb().collection<CreditReceipt>("credit_receipts").find().toArray();
  return c.json({ data: data.map((d) => serialize(d as Record<string, unknown>)), message: "لیست دریافت‌های اعتبار" });
});

router.post("/receipts", async (c) => {
  const body = await c.req.json();
  const receipt_number = `REC-${body.fiscal_year}-${Date.now()}`;
  const result = await getDb().collection<CreditReceipt>("credit_receipts").insertOne({
    ...body,
    receipt_number,
    allocation_id: body.allocation_id ? new ObjectId(body.allocation_id) : undefined,
  });
  const inserted = await getDb().collection<CreditReceipt>("credit_receipts").findOne({ _id: result.insertedId });
  return c.json({ message: "دریافت اعتبار ثبت شد", data: serialize(inserted as Record<string, unknown>) }, 201);
});

// ─── Delegations ──────────────────────────────────────────────────────────────

router.get("/delegations", async (c) => {
  const data = await getDb().collection<CreditDelegation>("credit_delegations").find().toArray();
  return c.json({ data: data.map((d) => serialize(d as Record<string, unknown>)), message: "لیست تفویض اعتبار" });
});

router.post("/delegations", async (c) => {
  const body = await c.req.json();
  const delegation_number = `DEL-${body.fiscal_year}-${Date.now()}`;
  const result = await getDb().collection<CreditDelegation>("credit_delegations").insertOne({
    ...body,
    delegation_number,
    status: body.status ?? "pending",
    journal_document_id: body.journal_document_id ? new ObjectId(body.journal_document_id) : undefined,
  });
  const inserted = await getDb().collection<CreditDelegation>("credit_delegations").findOne({ _id: result.insertedId });
  return c.json({ message: "تفویض اعتبار ثبت شد", data: serialize(inserted as Record<string, unknown>) }, 201);
});

router.put("/delegations/:id", async (c) => {
  const id = c.req.param("id");
  let oid: ObjectId;
  try { oid = new ObjectId(id); } catch { return c.json({ message: "شناسه نامعتبر است" }, 400); }
  const body = await c.req.json();
  const { _id, journal_document_id, ...updateData } = body;
  const result = await getDb().collection<CreditDelegation>("credit_delegations").findOneAndUpdate(
    { _id: oid },
    {
      $set: {
        ...updateData,
        journal_document_id: journal_document_id ? new ObjectId(journal_document_id) : undefined,
      }
    },
    { returnDocument: "after" }
  );
  if (!result) return c.json({ message: "تفویض اعتبار یافت نشد" }, 404);
  return c.json({ message: "تفویض اعتبار با موفقیت ویرایش شد", data: serialize(result as Record<string, unknown>) });
});

router.delete("/delegations/:id", async (c) => {
  const id = c.req.param("id");
  let oid: ObjectId;
  try { oid = new ObjectId(id); } catch { return c.json({ message: "شناسه نامعتبر است" }, 400); }
  const result = await getDb().collection("credit_delegations").deleteOne({ _id: oid });
  if (result.deletedCount === 0) return c.json({ message: "تفویض اعتبار یافت نشد" }, 404);
  return c.json({ message: "تفویض اعتبار با موفقیت حذف شد" });
});

// ─── Credit Definitions (تعریف اعتبار) ───────────────────────────────────────

router.get("/definitions", async (c) => {
  const data = await getDb().collection("credit_definitions").find().sort({ createdAt: -1 }).toArray();
  return c.json({ data: data.map((d) => serialize(d as Record<string, unknown>)), message: "لیست اعتبارهای تعریف‌شده" });
});

router.post("/definitions", async (c) => {
  const body = await c.req.json();
  const doc = {
    ...body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const result = await getDb().collection("credit_definitions").insertOne(doc);
  const inserted = await getDb().collection("credit_definitions").findOne({ _id: result.insertedId });
  return c.json({ message: "اعتبار با موفقیت ثبت شد", data: serialize(inserted as Record<string, unknown>) }, 201);
});

router.put("/definitions/:id", async (c) => {
  const id = c.req.param("id");
  let oid: import("mongodb").ObjectId;
  try {
    oid = new ObjectId(id);
  } catch {
    return c.json({ message: "شناسه نامعتبر است" }, 400);
  }
  const body = await c.req.json();
  const { _id, createdAt, ...updateData } = body;
  const result = await getDb().collection("credit_definitions").findOneAndUpdate(
    { _id: oid },
    { $set: { ...updateData, updatedAt: new Date().toISOString() } },
    { returnDocument: "after" }
  );
  if (!result) return c.json({ message: "اعتبار یافت نشد" }, 404);
  return c.json({ message: "اعتبار با موفقیت ویرایش شد", data: serialize(result as Record<string, unknown>) });
});

router.delete("/definitions/:id", async (c) => {
  const id = c.req.param("id");
  let oid: import("mongodb").ObjectId;
  try {
    oid = new ObjectId(id);
  } catch {
    return c.json({ message: "شناسه نامعتبر است" }, 400);
  }
  const result = await getDb().collection("credit_definitions").deleteOne({ _id: oid });
  if (result.deletedCount === 0) return c.json({ message: "اعتبار یافت نشد" }, 404);
  return c.json({ message: "اعتبار با موفقیت حذف شد" });
});

// ─── تابع کمکی تزریق داده‌های نمونه بودجه در صورت خالی بودن دیتابیس ───────────
async function seedMockBudgetData(db: any) {
  const count = await db.collection("agreements").countDocuments({});
  if (count > 0) return;

  console.log("✓ Seeding mock budget agreements and allocations...");

  const agr1Id = new ObjectId();
  const agr2Id = new ObjectId();
  const agr3Id = new ObjectId();

  await db.collection("agreements").insertMany([
    {
      _id: agr1Id,
      agreement_number: "AGR-1403-101",
      title: "برنامه خدمات پشتیبانی و نوسازی اداری",
      fiscal_year: 1403,
      total_amount: 1500000000,
      program_code: "11001",
      activity_code: "01",
      chapter_code: "110200",
      status: "confirmed",
      description: "طرح خرید و بهسازی ماشین آلات اداری"
    },
    {
      _id: agr2Id,
      agreement_number: "AGR-1403-102",
      title: "برنامه توسعه فناوری اطلاعات و نرم‌افزارهای مالی",
      fiscal_year: 1403,
      total_amount: 3000000000,
      program_code: "12002",
      activity_code: "02",
      chapter_code: "232000",
      status: "confirmed",
      description: "طرح توسعه نرم افزارهای جامع و شبکه"
    },
    {
      _id: agr3Id,
      agreement_number: "AGR-1403-103",
      title: "برنامه عمران و تعمیرات اساسی ساختمان‌ها",
      fiscal_year: 1403,
      total_amount: 5000000000,
      program_code: "13003",
      activity_code: "03",
      chapter_code: "110100",
      status: "confirmed",
      description: "طرح بهسازی ابنیه و ساختمان های ستادی"
    }
  ]);

  await db.collection("credit_allocations").insertMany([
    {
      allocation_number: "ALLOC-1403-201",
      agreement_id: agr1Id,
      fiscal_year: 1403,
      amount: 500000000,
      status: "allocated"
    },
    {
      allocation_number: "ALLOC-1403-202",
      agreement_id: agr2Id,
      fiscal_year: 1403,
      amount: 1200000000,
      status: "allocated"
    },
    {
      allocation_number: "ALLOC-1403-203",
      agreement_id: agr3Id,
      fiscal_year: 1403,
      amount: 2000000000,
      status: "allocated"
    }
  ]);

  await db.collection("credit_delegations").insertMany([
    {
      delegation_number: "DEL-1403-301",
      fiscal_year: 1403,
      amount: 300000000,
      from_unit: "مرکز",
      to_unit: "معاونت پشتیبانی و توسعه منابع",
      status: "confirmed"
    },
    {
      delegation_number: "DEL-1403-302",
      fiscal_year: 1403,
      amount: 500000000,
      from_unit: "مرکز",
      to_unit: "اداره کل فناوری اطلاعات",
      status: "confirmed"
    }
  ]);

  // ثبت اسناد حسابداری هزینه فرضی متناظر
  await db.collection("journal_documents").insertMany([
    {
      document_number: "DOC-1403-BUD1",
      document_type: "GENERAL_PAYMENT",
      fiscal_year: 1403,
      status: "CONFIRMED",
      document_date: "1403/05/10",
      description: "سند هزینه واحد اداری - معاونت پشتیبانی و توسعه منابع",
      lines: [
        { account_code: "110200", account_name: "فصل ماشین آلات و تجهیزات", debit: 350000000, credit: 0, is_budgetary: true },
        { account_code: "11001", account_name: "بانک پرداخت هزینه", debit: 0, credit: 350000000, is_budgetary: false }
      ]
    },
    {
      document_number: "DOC-1403-BUD2",
      document_type: "GENERAL_PAYMENT",
      fiscal_year: 1403,
      status: "CONFIRMED",
      document_date: "1403/06/15",
      description: "سند توسعه سامانه مالی - اداره کل فناوری اطلاعات",
      lines: [
        { account_code: "232000", account_name: "فصل دارایی‌های نامشهود", debit: 800000000, credit: 0, is_budgetary: true },
        { account_code: "11001", account_name: "بانک پرداخت هزینه", debit: 0, credit: 800000000, is_budgetary: false }
      ]
    },
    {
      document_number: "DOC-1403-BUD3",
      document_type: "GENERAL_PAYMENT",
      fiscal_year: 1403,
      status: "CONFIRMED",
      document_date: "1403/07/20",
      description: "سند بهسازی ابنیه مرکزی - اداره کل عمران و بهسازی",
      lines: [
        { account_code: "110100", account_name: "فصل ساختمان و مستحدثات", debit: 1500000000, credit: 0, is_budgetary: true },
        { account_code: "11001", account_name: "بانک پرداخت هزینه", debit: 0, credit: 1500000000, is_budgetary: false }
      ]
    }
  ]);

  // ثبت درخواست‌های وجه فرضی متناظر
  const reqCount = await db.collection("budget_requests").countDocuments({});
  if (reqCount === 0) {
    await db.collection("budget_requests").insertMany([
      {
        request_number: "REQ-1403-501",
        agreement_id: agr1Id,
        fiscal_year: 1403,
        amount: 400000000,
        requesting_unit: "معاونت پشتیبانی و توسعه منابع",
        request_date: "1403/04/10",
        status: "approved",
        description: "درخواست وجه جهت خرید اقلام اداری"
      },
      {
        request_number: "REQ-1403-502",
        agreement_id: agr2Id,
        fiscal_year: 1403,
        amount: 900000000,
        requesting_unit: "اداره کل فناوری اطلاعات",
        request_date: "1403/05/12",
        status: "pending",
        description: "درخواست تخصیص اعتبار خرید تجهیزات شبکه"
      }
    ]);
  }
}

// ─── GET /api/credits/filters — دریافت فیلترهای پویا ────────────────────────
router.get("/filters", async (c) => {
  try {
    const db = getDb();
    const fiscalYear = c.req.query("fiscalYear");
    if (!fiscalYear) {
      return c.json({ success: false, message: "سال مالی الزامی است" }, 400);
    }
    const yearNum = Number(fiscalYear);

    // بررسی و تزریق داده‌های فرضی در صورت خالی بودن دیتابیس (غیرفعال شد)
    // await seedMockBudgetData(db);

    const agreements = await db.collection<Agreement>("agreements").find({ fiscal_year: yearNum }).toArray();
    
    const programsMap = new Map<string, string>();
    const projectsMap = new Map<string, string>();

    for (const agr of agreements) {
      if (agr.program_code) {
        programsMap.set(agr.program_code, `${agr.program_code} — ${agr.title || "برنامه بودجه"}`);
      }
      if (agr.activity_code) {
        projectsMap.set(agr.activity_code, `${agr.activity_code} — پروژه/طرح`);
      }
    }

    const programs = Array.from(programsMap.entries()).map(([value, label]) => ({ value, label }));
    const projects = Array.from(projectsMap.entries()).map(([value, label]) => ({ value, label }));

    const delegations = await db.collection<CreditDelegation>("credit_delegations").find({ fiscal_year: yearNum }).toArray();
    const unitsSet = new Set<string>();
    for (const del of delegations) {
      if (del.to_unit) unitsSet.add(del.to_unit);
      if (del.from_unit) unitsSet.add(del.from_unit);
    }
    
    if (unitsSet.size === 0) {
      unitsSet.add("معاونت پشتیبانی و توسعه منابع");
      unitsSet.add("اداره کل فناوری اطلاعات");
      unitsSet.add("اداره کل عمران و بهسازی");
    }

    const orgUnits = Array.from(unitsSet).map((unit) => ({ value: unit, label: unit }));

    return c.json({
      success: true,
      programs,
      projects,
      orgUnits
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ─── GET /api/credits/performance — گزارش عملکرد بودجه ───────────────────────
router.get("/performance", async (c) => {
  try {
    const db = getDb();
    const fiscalYear = c.req.query("fiscalYear");
    const orgUnit = c.req.query("orgUnit")?.trim();
    const program = c.req.query("program")?.trim();
    const project = c.req.query("project")?.trim();

    if (!fiscalYear) {
      return c.json({ success: false, message: "سال مالی الزامی است" }, 400);
    }

    const yearNum = Number(fiscalYear);

    // بررسی و تزریق داده‌های فرضی در صورت خالی بودن دیتابیس (غیرفعال شد)
    // await seedMockBudgetData(db);

    // ۱. موافقت‌نامه‌ها (بودجه مصوب)
    const agrFilter: any = { fiscal_year: yearNum };
    if (program) {
      agrFilter.program_code = program;
    }
    if (project) {
      agrFilter.activity_code = project;
    }

    const agreements = await db.collection<Agreement>("agreements").find(agrFilter).toArray();

    // ۲. تخصیص‌ها
    const allocations = await db.collection<CreditAllocation>("credit_allocations").find({
      fiscal_year: yearNum
    }).toArray();

    const allocMap = new Map<string, number>();
    for (const alloc of allocations) {
      if (alloc.agreement_id) {
        const key = String(alloc.agreement_id);
        allocMap.set(key, (allocMap.get(key) ?? 0) + (alloc.amount ?? 0));
      }
    }

    // ۳. هزینه‌ها (اسناد غیر ابطال شده)
    const docs = await db.collection("journal_documents").find({
      status: { $ne: "CANCELLED" },
      fiscal_year: yearNum
    }).toArray();

    // ۴. تجمیع و محاسبه مقادیر گزارش
    const data = agreements.map((agr) => {
      const agrId = String(agr._id);
      const approved = agr.total_amount ?? 0;
      const allocation = allocMap.get(agrId) ?? 0;

      let expense = 0;
      const matchPrefix = agr.chapter_code || agr.program_code || "";

      if (matchPrefix) {
        for (const doc of docs) {
          if (orgUnit) {
            const docDesc = (doc.description ?? "").toLowerCase();
            const hasUnit = docDesc.includes(orgUnit.toLowerCase()) || 
                            doc.lines.some((l: any) => (l.description ?? "").toLowerCase().includes(orgUnit.toLowerCase()));
            if (!hasUnit) continue;
          }

          for (const line of doc.lines) {
            if (line.account_code && line.account_code.startsWith(matchPrefix)) {
              expense += (line.debit ?? 0) - (line.credit ?? 0);
            }
          }
        }
      }

      const finalExpense = Math.max(0, expense);
      const balance = Math.max(0, allocation - finalExpense);

      return {
        _id: agrId,
        code: agr.program_code || agr.agreement_number || agrId,
        title: agr.title || "بدون عنوان",
        approved,
        allocation,
        expense: finalExpense,
        balance,
      };
    });

    const totals = data.reduce(
      (acc, curr) => {
        acc.approved += curr.approved;
        acc.allocation += curr.allocation;
        acc.expense += curr.expense;
        acc.balance += curr.balance;
        return acc;
      },
      { approved: 0, allocation: 0, expense: 0, balance: 0 }
    );

    return c.json({
      success: true,
      data,
      totals,
      message: "گزارش عملکرد بودجه با موفقیت محاسبه شد"
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

router.post("/sanama-performance-check", async (c) => {
  try {
    const body = await c.req.json();
    const items = Array.isArray(body.items) ? body.items : [body];
    const errors: Array<{ code: number; itemIndex: number; message: string }> = [];

    items.forEach((item: any, idx: number) => {
      const creditLocation = item.credit_location || (item.credit_type === "مصوب" ? "استانی" : item.credit_type === "ابلاغی" ? "متمرکز" : "");
      const receiptLocation = item.receipt_location || "";
      const creditType = item.credit_type || "";

      // کد ۱۱
      if ((creditLocation === "استانی" || creditType === "مصوب") && receiptLocation === "متمرکز") {
        errors.push({ code: 11, itemIndex: idx, message: 'چنانچه محل اعتبار "استانی" (مصوب) انتخاب شود، محل وصول نمی‌تواند "متمرکز" باشد.' });
      }
      // کد ۱۲
      if (!creditType || !String(creditType).trim()) {
        errors.push({ code: 12, itemIndex: idx, message: '"نوع اعتبار" تعیین نگردیده است.' });
      }
      // کد ۱۳۱
      if (!item.program_number && !item.misc_row_number && !item.financial_assets_row_number) {
        errors.push({ code: 131, itemIndex: idx, message: 'شماره برنامه / ردیف (متفرقه / تملک دارایی‌های مالی) تعیین نگردیده است.' });
      }
      // کد ۱۳۲
      if (!item.project_number && !item.misc_row_number && !item.financial_assets_row_number) {
        errors.push({ code: 132, itemIndex: idx, message: 'شماره طرح / ردیف (متفرقه / تملک دارایی‌های مالی) تعیین نگردیده است.' });
      }
      // کد ۱۱۵۷
      const chapter = String(item.chapter_code || item.expense_chapter || "").trim();
      const accountKind = String(item.account_kind || "").trim();
      if ((accountKind === "هزینه‌ای" || accountKind === "اختصاصی") && (chapter === "3" || chapter === "03")) {
        errors.push({ code: 1157, itemIndex: idx, message: 'امکان درج فصل ۳ در حساب هزینه‌ای و اختصاصی وجود ندارد.' });
      }
      // کد ۱۱۵۸
      if ((accountKind === "سرمایه‌ای" || accountKind === "سرمایه‌ای اختصاصی") && (chapter === "8" || chapter === "08")) {
        errors.push({ code: 1158, itemIndex: idx, message: 'امکان درج فصل ۸ در حساب سرمایه‌ای و سرمایه‌ای اختصاصی وجود ندارد.' });
      }
      // کد ۶۲
      if (item.form_type === 4 && item.project_number && /[a-zA-Zآ-ی]/.test(String(item.project_number))) {
        errors.push({ code: 62, itemIndex: idx, message: 'دستگاه اجرایی نمی‌تواند در فرم ۴ از شماره طرح حروف‌دار برای اعتبار ابلاغی استفاده نماید.' });
      }
      // کد ۴۸
      if ((item.form_type === 1 || item.form_type === 2) && item.misc_row_number && item.legal_adjustments_misc_row && String(item.misc_row_number).trim() === String(item.legal_adjustments_misc_row).trim()) {
        errors.push({ code: 48, itemIndex: idx, message: 'شماره "ردیف متفرقه" تعیین شده در فرم‌های ۱ و ۲ نمی‌تواند با شماره "ردیف متفرقه" مندرج در تغییرات قانونی یکسان باشد.' });
      }
      // کد ۱۴
      if ((creditType === "ابلاغی" || creditLocation === "متمرکز" || creditLocation === "ملی") && (!item.notifier_budget_row || !String(item.notifier_budget_row).trim())) {
        errors.push({ code: 14, itemIndex: idx, message: 'ردیف بودجه‌ای ابلاغ دهنده تعیین نگردیده است.' });
      }
      // کد ۱۶
      if (item.executive_body_budget_row && item.notifier_budget_row && String(item.executive_body_budget_row).trim() === String(item.notifier_budget_row).trim()) {
        errors.push({ code: 16, itemIndex: idx, message: 'ردیف بودجه‌ای دستگاه اجرایی نمی‌تواند با ردیف بودجه‌ای ابلاغ دهنده یکسان باشد.' });
      }
      // کد ۱۹
      const numericFields = [
        item.final_credit_budget, item.initial_credit_budget, item.allocated_credit,
        item.received_credit, item.consumed_credit, item.non_final_payments,
        item.transferred_bonds, item.increase, item.decrease, item.drafts,
        item.special_revenue_received, item.legal_adjustments
      ];
      if (numericFields.some((v) => v != null && v !== "" && Number(v) < 0)) {
        errors.push({ code: 19, itemIndex: idx, message: 'مقادیر مندرج در فیلدها نبایستی منفی باشد.' });
      }

      const finalBudget = Number(item.final_credit_budget) || 0;
      const allocated = Number(item.allocated_credit) || 0;
      const received = Number(item.received_credit) || 0;
      const initialBudget = Number(item.initial_credit_budget) || 0;
      const legalAdj = Number(item.legal_adjustments) || 0;
      const inc = Number(item.increase) || 0;
      const dec = Number(item.decrease) || 0;
      const drafts = Number(item.drafts) || 0;
      const consumed = Number(item.consumed_credit) || 0;
      const nonFinal = Number(item.non_final_payments) || 0;
      const bonds = Number(item.transferred_bonds) || 0;
      const otherCons = Number(item.other_consumption) || 0;
      const specialRev = Number(item.special_revenue_received) || 0;

      // کد ۲۳
      if (creditType === "ابلاغی" && finalBudget !== allocated) {
        errors.push({ code: 23, itemIndex: idx, message: `در صورتی که نوع اعتبار "ابلاغی" تعیین شود، مبالغ فیلدهای "بودجه اعتبار نهایی" و "اعتبار تخصیص یافته" بایستی برابر باشد.` });
      }
      // کد ۲۴
      if (allocated > finalBudget) {
        errors.push({ code: 24, itemIndex: idx, message: `مبلغ "اعتبار تخصیص یافته" باید کوچک‌تر یا مساوی مبلغ "بودجه اعتبار نهایی" باشد.` });
      }
      // کد ۲۵
      if (allocated < received) {
        errors.push({ code: 25, itemIndex: idx, message: `مبلغ "اعتبار تخصیص یافته" باید بزرگ‌تر یا مساوی مبلغ "دریافتی از محل اعتبارات تخصیص یافته" باشد.` });
      }
      // کد ۲۶
      if (creditType === "ابلاغی" && allocated !== received) {
        errors.push({ code: 26, itemIndex: idx, message: `در صورتی که نوع اعتبار "ابلاغی" تعیین شود، مبالغ فیلدهای "اعتبار تخصیص یافته" و "دریافتی از محل اعتبارات تخصیص یافته" بایستی برابر باشد.` });
      }
      // کد ۲۷
      const sumConsumed = consumed + nonFinal + bonds + otherCons;
      if (received !== sumConsumed) {
        errors.push({ code: 27, itemIndex: idx, message: `مبلغ فیلد "دریافتی از محل اعتبارات تخصیص یافته" بایستی با مجموع مبالغ فیلدهای "اعتبار مصرف شده"، "پرداخت‌های غیرقطعی" و "اوراق انتقالی" برابر باشد.` });
      }
      // کد ۲۸
      if (item.form_type === 1 || item.form_type === 2 || !item.form_type) {
        const calculatedFinal = initialBudget + legalAdj + inc - dec - drafts;
        if (finalBudget !== calculatedFinal) {
          errors.push({ code: 28, itemIndex: idx, message: `در فرم‌های ۱ و ۲ مبلغ "بودجه اعتبار نهایی" بایستی با مجموع مبالغ ("اولیه" + "تغییرات قانونی" + "افزایش" - "کاهش" - "حواله‌ها") برابر باشد.` });
        }
      }
      // کد ۳۲
      if (item.is_provincial_project && (creditLocation !== "استانی" || (item.receipt_province && item.project_province && item.receipt_province !== item.project_province))) {
        errors.push({ code: 32, itemIndex: idx, message: 'برای طرح‌های استانی، محل اعتبار بایستی استانی بوده و محل وصول همان استان طرح باشد.' });
      }
      // کد ۳۶
      if (item.legal_adjustments_row && (item.legal_adjustments == null || item.legal_adjustments === "")) {
        errors.push({ code: 36, itemIndex: idx, message: 'مبلغ فیلد "تغییرات ناشی از استنادات قانونی" بایستی تکمیل شود.' });
      }
      // کد ۵۲
      if (specialRev > finalBudget) {
        errors.push({ code: 52, itemIndex: idx, message: `مبلغ "دریافتی از محل درآمدهای اختصاصی" باید کوچک‌تر یا مساوی مبلغ "بودجه اعتبار نهایی" باشد.` });
      }
      // کد ۴۷
      const maxDrafts = initialBudget + legalAdj + inc - dec;
      if (drafts > maxDrafts) {
        errors.push({ code: 47, itemIndex: idx, message: `مبلغ فیلد "حواله‌ها" بایستی کوچک‌تر یا مساوی مبالغ ("اولیه" +/- "تغییرات قانونی" + "افزایش" - "کاهش") باشد.` });
      }

      // ─── قوانین سری ۸۰۰ فرم‌های منابع ─────────────────────────────────────
      const expRes = Number(item.expected_amount ?? item.expected_resources ?? 0);
      const recAmt = Number(item.received_amount ?? item.received_credit ?? 0);
      const sentAmt = Number(item.sent_amount ?? item.sent_to_treasury ?? 0);
      const incCode = String(item.income_code || item.classification_code || "").trim();

      if (item.form_type === 8 || item.is_resource_form) {
        if (expRes === 0 && !item.expected_amount) {
          errors.push({ code: 801, itemIndex: idx, message: 'مبلغ فیلد "منابع پیش‌بینی شده" بایستی تکمیل شود.' });
        }
        if (item.is_national_agency && item.source_type !== "ملی") {
          errors.push({ code: 802, itemIndex: idx, message: 'برای دستگاه‌های اجرایی ملی و دانشگاه‌ها و مراکز آموزش عالی، نوع منبع بایستی "ملی" تعیین شود.' });
        }
        if (recAmt < sentAmt) {
          errors.push({ code: 803, itemIndex: idx, message: 'مبلغ فیلد "وصولی" بایستی بزرگ‌تر یا مساوی مبلغ فیلد "وجوه ارسالی به خزانه" باشد.' });
        }
        if (recAmt > 0 && (sentAmt === 0 && !item.sent_amount)) {
          errors.push({ code: 804, itemIndex: idx, message: 'در صورت تکمیل فیلد "وصولی"، فیلد "وجوه ارسالی به خزانه" نیز بایستی تکمیل شود.' });
        }
        if (item.is_special_revenue || item.resource_kind?.includes("اختصاصی")) {
          if (expRes < recAmt) {
            errors.push({ code: 808, itemIndex: idx, message: 'مبلغ فیلد "منابع پیش‌بینی شده" در درآمدهای اختصاصی و واگذاری دارایی‌های سرمایه‌ای اختصاصی بایستی بزرگ‌تر یا مساوی مبلغ فیلد "وصولی" باشد.' });
          }
          if (recAmt < sentAmt) {
            errors.push({ code: 809, itemIndex: idx, message: 'مبلغ فیلد "وصولی" در درآمدهای اختصاصی و واگذاری دارایی‌های سرمایه‌ای اختصاصی بایستی بزرگ‌تر یا مساوی مبلغ فیلد "وجوه ارسالی به خزانه" باشد.' });
          }
        }
        if (item.source_type === "استانی" && item.receipt_province && item.agency_province && item.receipt_province !== item.agency_province) {
          errors.push({ code: 810, itemIndex: idx, message: 'چنانچه منبع "استانی" انتخاب شود، محل وصول نمی‌تواند غیر از استان دستگاه تعیین گردد.' });
        }
        if (item.is_financial_assets && item.source_type !== "ملی") {
          errors.push({ code: 811, itemIndex: idx, message: '"منبع" واگذاری دارایی‌های مالی بایستی "ملی" تعیین شود.' });
        }
        if (["310601", "160196", "160197"].includes(incCode)) {
          if (expRes !== recAmt || recAmt !== sentAmt) {
            errors.push({ code: 813, itemIndex: idx, message: 'مبالغ فیلدهای "منابع پیش‌بینی شده"، "وصولی" و "وجوه ارسالی به خزانه" برای شماره طبقه‌بندی‌های ۳۱۰۶۰۱، ۱۶۰۱۹۶ و ۱۶۰۱۹۷ بایستی برابر باشند.' });
          }
        }
        if (["160105", "160106"].includes(incCode) && !item.is_university) {
          errors.push({ code: 814, itemIndex: idx, message: 'امکان استفاده از شماره طبقه‌بندی‌های ۱۶۰۱۰۵ و ۱۶۰۱۰۶ صرفاً برای دانشگاه‌های زیرمجموعه وزارت علوم و وزارت بهداشت وجود دارد.' });
        }
        if (!incCode && item.is_resource_form) {
          errors.push({ code: 816, itemIndex: idx, message: '"شماره طبقه‌بندی" نمی‌تواند خالی باشد.' });
        }
      }
    });

    return c.json({
      success: true,
      valid: errors.length === 0,
      errorsCount: errors.length,
      errors,
      message: errors.length === 0 ? "کنترل‌های فرم عملکرد سناما تایید شد" : "مغایرت‌هایی در فرم عملکرد سناما وجود دارد"
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

router.get("/", (_c) => _c.json({ message: "اعتبارات" }));

export default router;
