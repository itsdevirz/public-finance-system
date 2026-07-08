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
