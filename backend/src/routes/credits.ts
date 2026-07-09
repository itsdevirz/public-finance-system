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

// ─── Budget Requests (درخواست بودجه) ───────────────────────────────────────────

router.get("/requests", async (c) => {
  const data = await getDb().collection("budget_requests").find().toArray();
  return c.json({ data: data.map((d) => serialize(d as Record<string, unknown>)), message: "لیست درخواست‌های بودجه" });
});

router.post("/requests", async (c) => {
  const body = await c.req.json();
  const request_number = `REQ-${body.fiscal_year}-${Date.now()}`;
  const result = await getDb().collection("budget_requests").insertOne({
    ...body,
    request_number,
    status: body.status ?? "pending",
    agreement_id: body.agreement_id ? new ObjectId(body.agreement_id) : undefined,
  });
  const inserted = await getDb().collection("budget_requests").findOne({ _id: result.insertedId });
  return c.json({ message: "درخواست بودجه ثبت شد", data: serialize(inserted as Record<string, unknown>) }, 201);
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
  if (!result) return c.json({ message: "درخواست بودجه یافت نشد" }, 404);
  return c.json({ message: "درخواست بودجه با موفقیت ویرایش شد", data: serialize(result as Record<string, unknown>) });
});

router.delete("/requests/:id", async (c) => {
  const id = c.req.param("id");
  let oid: ObjectId;
  try { oid = new ObjectId(id); } catch { return c.json({ message: "شناسه نامعتبر است" }, 400); }
  const result = await getDb().collection("budget_requests").deleteOne({ _id: oid });
  if (result.deletedCount === 0) return c.json({ message: "درخواست بودجه یافت نشد" }, 404);
  return c.json({ message: "درخواست بودجه با موفقیت حذف شد" });
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

  // ثبت درخواست‌های بودجه فرضی متناظر
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
        description: "درخواست بودجه جهت خرید اقلام اداری"
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

router.get("/", (_c) => _c.json({ message: "اعتبارات" }));

export default router;
