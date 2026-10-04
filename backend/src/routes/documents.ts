import { Hono } from "hono";
import { ObjectId } from "mongodb";
import { getDb } from "../db/index.js";
import type { JournalDocument, JournalLine } from "../db/types.js";
import { decryptDocument } from "../lib/crypto.js";
import { serialize } from "../lib/helpers.js";

import sanamaCodes from "../data/sanamaCodes.json";

// ── نقشه ماهیت کدها — یک‌بار در startup ساخته می‌شود ─────────────────────────
const natureMap = new Map<string, "debit" | "credit" | "both">();
for (const group of sanamaCodes.groups ?? []) {
  for (const account of group.accounts ?? []) {
    for (const child of account.children ?? []) {
      if (child.code && child.nature) {
        natureMap.set(String(child.code), child.nature as "debit" | "credit" | "both");
      }
    }
  }
}

const CONTRA_ASSET_CODES = new Set(["14551", "15020", "15040", "15045", "15050", "16040", "16050"]);

function getAccountNature(code: string): "debit" | "credit" | "both" {
  const cleanCode = String(code).trim();
  if (CONTRA_ASSET_CODES.has(cleanCode)) return "credit";

  const explicit = natureMap.get(cleanCode);
  if (explicit) return explicit;

  const firstDigit = cleanCode.charAt(0);
  const first3 = cleanCode.substring(0, 3);

  if (firstDigit === "1") return "debit";
  if (firstDigit === "2") return "credit";
  if (firstDigit === "3") return "credit";
  if (firstDigit === "4") return "credit";
  if (firstDigit === "5" || firstDigit === "6") return "debit";
  if (firstDigit === "7") return "both";

  if (first3 === "810" || ["910", "915", "920", "925", "930", "935", "940", "950"].includes(first3)) {
    return "debit";
  }
  if (first3 === "820" || ["960", "970", "980", "990"].includes(first3)) {
    return "credit";
  }

  return "both";
}

const router = new Hono();

// ── تابع مشترک اعتبارسنجی مانده حساب — با MongoDB Aggregation ─────────────────
async function validateAccountBalances(
  newLines: JournalLine[],
  excludeId?: string
): Promise<{ valid: false; message: string; error_code: string; account_code: string; total_debit: number; total_credit: number; excess: number } | { valid: true }> {
  if (!newLines.length) return { valid: true };

  // فقط کدهایی که ماهیت محدود (debit یا credit) دارند بررسی می‌شوند
  const codesInDoc = [...new Set(newLines.map(l => String(l.account_code || (l as any).subAccount || "").trim()))].filter(Boolean);
  const restrictedCodes = codesInDoc.filter(c => {
    const n = getAccountNature(c);
    return n === "debit" || n === "credit";
  });

  if (!restrictedCodes.length) return { valid: true };

  const db = getDb();

  // یک Aggregation Pipeline برای همه کدها — یک query به MongoDB
  const matchStage: Record<string, unknown> = {
    status: { $ne: "CANCELLED" },
    "lines.account_code": { $in: restrictedCodes },
  };
  if (excludeId && ObjectId.isValid(excludeId)) {
    matchStage["_id"] = { $ne: new ObjectId(excludeId) };
  }

  const pipeline = [
    { $match: matchStage },
    { $unwind: "$lines" },
    {
      $match: {
        $expr: {
          $in: [
            { $ifNull: ["$lines.account_code", "$lines.subAccount"] },
            restrictedCodes
          ]
        }
      }
    },
    {
      $group: {
        _id: { $ifNull: ["$lines.account_code", "$lines.subAccount"] },
        histDebit:  { $sum: "$lines.debit" },
        histCredit: { $sum: "$lines.credit" },
      },
    },
  ];

  const historyResult = await db
    .collection<JournalDocument>("journal_documents")
    .aggregate(pipeline)
    .toArray();

  // ساخت نقشه موجودی تاریخی
  const histMap = new Map<string, { debit: number; credit: number }>();
  for (const row of historyResult) {
    histMap.set(String(row._id), { debit: row.histDebit ?? 0, credit: row.histCredit ?? 0 });
  }

  for (const code of restrictedCodes) {
    const nature = getAccountNature(code);
    const hist = histMap.get(code) ?? { debit: 0, credit: 0 };

    const newDebit  = newLines.filter(l => String(l.account_code || (l as any).subAccount) === code).reduce((s, l) => s + (Number(l.debit)  || 0), 0);
    const newCredit = newLines.filter(l => String(l.account_code || (l as any).subAccount) === code).reduce((s, l) => s + (Number(l.credit) || 0), 0);

    const totalDebit  = hist.debit  + newDebit;
    const totalCredit = hist.credit + newCredit;

    if (nature === "debit" && totalCredit > totalDebit) {
      const excess = totalCredit - totalDebit;
      return {
        valid: false,
        message: `خطا: مانده حساب معین «${code}» دارای ماهیت بدهکار است. جمع بستانکارها (${totalCredit.toLocaleString("fa-IR")} ریال) از جمع بدهکارها (${totalDebit.toLocaleString("fa-IR")} ریال) بیشتر می‌شود. ثبت سند به دلیل ایجاد مانده بستانکار غیرمجاز متوقف شد. مازاد: ${excess.toLocaleString("fa-IR")} ریال`,
        error_code: "CREDIT_EXCEEDS_DEBIT",
        account_code: code,
        total_debit: totalDebit,
        total_credit: totalCredit,
        excess,
      };
    }

    if (nature === "credit" && totalDebit > totalCredit) {
      const excess = totalDebit - totalCredit;
      return {
        valid: false,
        message: `خطا: مانده حساب معین «${code}» دارای ماهیت بستانکار است. جمع بدهکارها (${totalDebit.toLocaleString("fa-IR")} ریال) از جمع بستانکارها (${totalCredit.toLocaleString("fa-IR")} ریال) بیشتر می‌شود. ثبت سند به دلیل ایجاد مانده بدهکار غیرمجاز متوقف شد. مازاد: ${excess.toLocaleString("fa-IR")} ریال`,
        error_code: "DEBIT_EXCEEDS_CREDIT",
        account_code: code,
        total_debit: totalDebit,
        total_credit: totalCredit,
        excess,
      };
    }
  }

  return { valid: true };
}

// POST /api/documents/migrate
router.post("/migrate", async (c) => {
  const db = getDb();
  const docs = await db.collection<JournalDocument>("journal_documents").find().toArray();
  let updated = 0;

  for (const rawDoc of docs) {
    const serialized = serialize(rawDoc as Record<string, unknown>);
    if (!serialized.ciphertext) continue;

    try {
      const decrypted = decryptDocument(serialized);
      const patch: Record<string, unknown> = {};

      if (!serialized.document_date && decrypted.document_date) {
        patch.document_date = decrypted.document_date;
      }

      if ((!serialized.lines || (serialized.lines as unknown[]).length === 0) && decrypted.lines?.length) {
        patch.lines = decrypted.lines;
      }

      if (Object.keys(patch).length > 0) {
        await db.collection<JournalDocument>("journal_documents").updateOne(
          { _id: rawDoc._id },
          { $set: patch }
        );
        updated++;
      }
    } catch { /* skip */ }
  }

  return c.json({ message: `${updated} سند به‌روزرسانی شد`, updated, total: docs.length });
});

export async function getNextDocumentNumber(fiscalYear: number | string): Promise<string> {
  const db = getDb();
  const fyNum = Number(fiscalYear) || 1405;
  const fyStr = String(fyNum);

  const docs = await db
    .collection<JournalDocument>("journal_documents")
    .find({
      $or: [
        { fiscal_year: fyNum },
        { "rawHeader.fiscalYear": fyStr }
      ]
    } as any)
    .project({ document_number: 1, rawHeader: 1 })
    .toArray();

  let maxNo = 0;
  for (const d of docs) {
    const rawNo = String(d.document_number || d.rawHeader?.docNo || "").trim();
    const cleanNum = rawNo.replace(/\D/g, "");
    const num = parseInt(cleanNum, 10);
    if (!isNaN(num) && num > 0 && num < 100000000) {
      if (num > maxNo) {
        maxNo = num;
      }
    }
  }

  return String(maxNo + 1);
}

export async function fixAndMigrateDocumentNumbers(): Promise<{ updated: number }> {
  const db = getDb();
  const docs = await db
    .collection<JournalDocument>("journal_documents")
    .find()
    .sort({ _id: 1 })
    .toArray();

  const fyGroups = new Map<string, JournalDocument[]>();
  for (const doc of docs) {
    const fy = String(doc.fiscal_year || "1405");
    if (!fyGroups.has(fy)) {
      fyGroups.set(fy, []);
    }
    fyGroups.get(fy)!.push(doc);
  }

  let updatedCount = 0;

  for (const [, groupDocs] of fyGroups.entries()) {
    let seq = 1;
    for (const doc of groupDocs) {
      const currentDocNo = String(doc.document_number || "");
      const targetDocNo = String(seq);

      if (currentDocNo !== targetDocNo || currentDocNo.startsWith("DOC-")) {
        await db.collection<JournalDocument>("journal_documents").updateOne(
          { _id: doc._id },
          { $set: { document_number: targetDocNo } }
        );
        updatedCount++;
      }
      seq++;
    }
  }

  return { updated: updatedCount };
}

// GET /api/documents/next-number/:fiscalYear
router.get("/next-number/:fiscalYear", async (c) => {
  const fy = c.req.param("fiscalYear");
  const nextNo = await getNextDocumentNumber(fy);
  return c.json({ success: true, fiscalYear: fy, nextDocumentNumber: nextNo });
});

router.post("/fix-numbers", async (c) => {
  const res = await fixAndMigrateDocumentNumbers();
  return c.json({ success: true, message: `${res.updated} سند شماره‌گذاری شد`, ...res });
});

// GET /api/documents — با projection برای کاهش داده منتقله
router.get("/", async (c) => {
  const db = getDb();
  const legacyCount = await db.collection("journal_documents").countDocuments({ document_number: { $regex: /^DOC-/ } });
  if (legacyCount > 0) {
    await fixAndMigrateDocumentNumbers();
  }

  const data = await db
    .collection<JournalDocument>("journal_documents")
    .find()
    .sort({ _id: -1 })
    .toArray();
  const decrypted = data.map((d) => {
    const doc = decryptDocument(serialize(d as Record<string, unknown>));
    if (doc.document_date && doc.fiscal_year) {
      const fyStr = String(doc.fiscal_year);
      const dateClean = String(doc.document_date).replace(/[۰-۹]/g, ch => "۰۱۲۳۴۵۶۷۸۹".indexOf(ch).toString());
      const parts = dateClean.split("/");
      if (parts.length === 3 && parts[0] !== fyStr) {
        doc.document_date = `${fyStr}/${parts[1].padStart(2, "0")}/${parts[2].padStart(2, "0")}`;
      }
    }
    return doc;
  });
  return c.json({ data: decrypted, message: "لیست اسناد" });
});

// GET /api/documents/account-balance/:accountCode — با MongoDB Aggregation
router.get("/account-balance/:accountCode", async (c) => {
  const accountCode = c.req.param("accountCode");
  const excludeId   = c.req.query("excludeId");

  const matchStage: Record<string, unknown> = {
    status: { $ne: "CANCELLED" },
    "lines.account_code": accountCode,
  };
  if (excludeId && ObjectId.isValid(excludeId)) {
    matchStage["_id"] = { $ne: new ObjectId(excludeId) };
  }

  const pipeline = [
    { $match: matchStage },
    { $unwind: "$lines" },
    { $match: { "lines.account_code": accountCode } },
    {
      $group: {
        _id: null,
        totalDebit:  { $sum: "$lines.debit" },
        totalCredit: { $sum: "$lines.credit" },
      },
    },
  ];

  const result = await getDb()
    .collection<JournalDocument>("journal_documents")
    .aggregate(pipeline)
    .toArray();

  const totalDebit  = result[0]?.totalDebit  ?? 0;
  const totalCredit = result[0]?.totalCredit ?? 0;

  return c.json({
    accountCode,
    totalDebit,
    totalCredit,
    balance: totalDebit - totalCredit,
  });
});

router.get("/:id", async (c) => {
  const id = c.req.param("id");
  if (!ObjectId.isValid(id)) return c.json({ message: "شناسه نامعتبر" }, 400);
  const doc = await getDb()
    .collection<JournalDocument>("journal_documents")
    .findOne({ _id: new ObjectId(id) });
  if (!doc) return c.json({ message: "سند یافت نشد" }, 404);
  const decrypted = decryptDocument(serialize(doc as Record<string, unknown>));
  if (decrypted.document_date && decrypted.fiscal_year) {
    const fyStr = String(decrypted.fiscal_year);
    const dateClean = String(decrypted.document_date).replace(/[۰-۹]/g, ch => "۰۱۲۳۴۵۶۷۸۹".indexOf(ch).toString());
    const parts = dateClean.split("/");
    if (parts.length === 3 && parts[0] !== fyStr) {
      decrypted.document_date = `${fyStr}/${parts[1].padStart(2, "0")}/${parts[2].padStart(2, "0")}`;
    }
  }
  return c.json({ data: decrypted });
});

router.post("/", async (c) => {
  const payload = (c.get as any)("jwtPayload") as any;
  const isAdmin = payload.role === "admin";
  const db = getDb();

  let user: any = null;
  let permissions: any = {};

  if (!isAdmin) {
    user = await db.collection("users").findOne({ _id: new ObjectId(payload.sub) });
    permissions = user?.permissions || {};
    if (!permissions["doc.create"]) {
      return c.json({ message: "دسترسی غیرمجاز. شما مجوز ثبت سند جدید را ندارید." }, 403);
    }
  }

  const body = await c.req.json();
  const { document_type, fiscal_year, ciphertext, lines = [] } = body;
  if (!document_type || !fiscal_year) {
    return c.json({ message: "document_type و fiscal_year الزامی است" }, 400);
  }

  let resolvedDate: string | undefined = body.document_date;
  let resolvedLines: unknown[] = ciphertext ? [] : lines;
  if (ciphertext) {
    try {
      const preview = decryptDocument({ ciphertext } as any);
      if (preview.document_date && !resolvedDate) resolvedDate = preview.document_date;
      if (preview.lines?.length) resolvedLines = preview.lines;
    } catch { /* ادامه بده */ }
  }

  if (resolvedDate && fiscal_year) {
    const fyStr = String(fiscal_year);
    const dateClean = String(resolvedDate).replace(/[۰-۹]/g, ch => "۰۱۲۳۴۵۶۷۸۹".indexOf(ch).toString());
    const parts = dateClean.split("/");
    if (parts.length === 3 && parts[0] !== fyStr) {
      resolvedDate = `${fyStr}/${parts[1].padStart(2, "0")}/${parts[2].padStart(2, "0")}`;
    }
  }

  // Always validate account nature balances for ALL document statuses (DRAFT and CONFIRMED)
  const balanceCheck = await validateAccountBalances(resolvedLines as JournalLine[]);
  if (!balanceCheck.valid) {
    return c.json(balanceCheck, 422);
  }

  const targetStatus = body.status ?? "DRAFT";
  if (targetStatus === "CONFIRMED") {
    // Enforce transaction amount limits ONLY for CONFIRMED status
    if (!isAdmin && user) {
      const totalDebit = (resolvedLines as any[]).reduce((s, l) => s + (Number(l.debit) || 0), 0);
      if (user.financialLimitMax > 0 && totalDebit > user.financialLimitMax) {
        return c.json({ message: `خطا: مبلغ سند (${totalDebit.toLocaleString()} ریال) بیشتر از سقف مجاز تراکنش شما (${user.financialLimitMax.toLocaleString()} ریال) است.` }, 403);
      }
      if (user.financialLimitMin > 0 && totalDebit < user.financialLimitMin) {
        return c.json({ message: `خطا: مبلغ سند (${totalDebit.toLocaleString()} ریال) کمتر از حداقل مجاز تراکنش شما (${user.financialLimitMin.toLocaleString()} ریال) است.` }, 403);
      }
    }
  }

  const document_number = await getNextDocumentNumber(fiscal_year);
  const result = await getDb()
    .collection<JournalDocument>("journal_documents")
    .insertOne({
      ...body,
      document_number,
      document_date: resolvedDate,
      status: body.status ?? "DRAFT",
      lines: resolvedLines,
    } as JournalDocument);

  const inserted = await getDb()
    .collection<JournalDocument>("journal_documents")
    .findOne({ _id: result.insertedId });
  const decrypted = decryptDocument(serialize(inserted as Record<string, unknown>));
  return c.json({ message: "سند ثبت شد", data: decrypted }, 201);
});

router.patch("/:id/confirm", async (c) => {
  const id = c.req.param("id");
  if (!ObjectId.isValid(id)) return c.json({ message: "شناسه نامعتبر" }, 400);

  const payload = (c.get as any)("jwtPayload") as any;
  const isAdmin = payload.role === "admin";
  const db = getDb();

  if (!isAdmin) {
    const user = await db.collection("users").findOne({ _id: new ObjectId(payload.sub) });
    if (!user?.permissions?.["doc.approve"]) {
      return c.json({ message: "دسترسی غیرمجاز. شما مجوز تایید و نهایی‌سازی اسناد را ندارید." }, 403);
    }
  }

  const existingDoc = await db.collection<JournalDocument>("journal_documents").findOne({ _id: new ObjectId(id) });
  if (!existingDoc) return c.json({ message: "سند یافت نشد" }, 404);

  let docLines: JournalLine[] = (existingDoc.lines || []) as JournalLine[];
  if (existingDoc.ciphertext) {
    try {
      const dec = decryptDocument(existingDoc as Record<string, unknown>);
      if (dec.lines?.length) docLines = dec.lines as JournalLine[];
    } catch { /* ادامه بده */ }
  }

  const balanceCheck = await validateAccountBalances(docLines, id);
  if (!balanceCheck.valid) {
    return c.json(balanceCheck, 422);
  }

  const res = await getDb()
    .collection<JournalDocument>("journal_documents")
    .findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { status: "CONFIRMED" } },
      { returnDocument: "after" }
    );
  if (!res) return c.json({ message: "سند یافت نشد" }, 404);
  return c.json({ message: "سند تایید شد", data: serialize(res as Record<string, unknown>) });
});

router.put("/:id", async (c) => {
  const id = c.req.param("id");
  if (!ObjectId.isValid(id)) return c.json({ message: "شناسه نامعتبر" }, 400);

  const payload = (c.get as any)("jwtPayload") as any;
  const isAdmin = payload.role === "admin";
  const db = getDb();

  let user: any = null;
  let permissions: any = {};

  if (!isAdmin) {
    user = await db.collection("users").findOne({ _id: new ObjectId(payload.sub) });
    permissions = user?.permissions || {};
    if (!permissions["doc.edit"]) {
      return c.json({ message: "دسترسی غیرمجاز. شما مجوز ویرایش اسناد را ندارید." }, 403);
    }
  }

  const body = await c.req.json();
  const { document_type, fiscal_year, ciphertext, lines = [] } = body;

  if (!document_type || !fiscal_year) {
    return c.json({ message: "document_type و fiscal_year الزامی است" }, 400);
  }

  const updateData: Record<string, unknown> = {
    document_type,
    fiscal_year,
    status: body.status ?? "DRAFT",
    lines: ciphertext ? [] : lines,
    ...(ciphertext ? { ciphertext } : {}),
  };

  if (body.document_date) {
    updateData.document_date = body.document_date;
  }
  if (ciphertext) {
    try {
      const preview = decryptDocument({ ciphertext } as any);
      if (preview.document_date && !updateData.document_date) updateData.document_date = preview.document_date;
      if (preview.lines?.length)  updateData.lines = preview.lines;
    } catch { /* ادامه بده */ }
  }

  if (updateData.document_date && fiscal_year) {
    const fyStr = String(fiscal_year);
    const dateClean = String(updateData.document_date).replace(/[۰-۹]/g, ch => "۰۱۲۳۴۵۶۷۸۹".indexOf(ch).toString());
    const parts = dateClean.split("/");
    if (parts.length === 3 && parts[0] !== fyStr) {
      updateData.document_date = `${fyStr}/${parts[1].padStart(2, "0")}/${parts[2].padStart(2, "0")}`;
    }
  }

  const newLines = (updateData.lines ?? []) as JournalLine[];
  // Always validate account nature balances for ALL document statuses (DRAFT and CONFIRMED)
  const balanceCheck = await validateAccountBalances(newLines, id);
  if (!balanceCheck.valid) {
    return c.json(balanceCheck, 422);
  }

  const targetStatus = body.status ?? "DRAFT";
  if (targetStatus === "CONFIRMED") {
    // Enforce transaction amount limits and approve check ONLY for CONFIRMED status
    if (!isAdmin && user) {
      const totalDebit = newLines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
      if (user.financialLimitMax > 0 && totalDebit > user.financialLimitMax) {
        return c.json({ message: `خطا: مبلغ سند (${totalDebit.toLocaleString()} ریال) بیشتر از سقف مجاز تراکنش شما (${user.financialLimitMax.toLocaleString()} ریال) است.` }, 403);
      }
      if (user.financialLimitMin > 0 && totalDebit < user.financialLimitMin) {
        return c.json({ message: `خطا: مبلغ سند (${totalDebit.toLocaleString()} ریال) کمتر از حداقل مجاز تراکنش شما (${user.financialLimitMin.toLocaleString()} ریال) است.` }, 403);
      }

      if (updateData.status === "CONFIRMED" && !permissions["doc.approve"]) {
        return c.json({ message: "دسترسی غیرمجاز. شما مجوز تایید و نهایی‌سازی اسناد را ندارید." }, 403);
      }
    }
  }

  const res = await getDb()
    .collection<JournalDocument>("journal_documents")
    .findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: "after" }
    );

  if (!res) return c.json({ message: "سند یافت نشد" }, 404);
  const decrypted = decryptDocument(serialize(res as Record<string, unknown>));
  return c.json({ message: "سند بروزرسانی شد", data: decrypted });
});

router.delete("/:id", async (c) => {
  const id = c.req.param("id");
  if (!ObjectId.isValid(id)) return c.json({ message: "شناسه نامعتبر" }, 400);

  const payload = (c.get as any)("jwtPayload") as any;
  const db = getDb();

  const existingDoc = await db.collection<JournalDocument>("journal_documents").findOne({ _id: new ObjectId(id) });
  if (!existingDoc) return c.json({ message: "سند یافت نشد" }, 404);

  const status = (existingDoc.status || "").trim();
  if (status === "CONFIRMED" || status === "صدور سند قطعی" || status === "FINAL" || existingDoc.workflowStep === "FINAL") {
    return c.json({ message: "خطا: امکان حذف سندی که توسط رئیس دستگاه تأیید نهایی و قطعی شده است وجود ندارد." }, 403);
  }

  const res = await db
    .collection<JournalDocument>("journal_documents")
    .deleteOne({ _id: new ObjectId(id) });

  if (res.deletedCount === 0) return c.json({ message: "سند یافت نشد" }, 404);
  return c.json({ message: "سند با موفقیت حذف شد" });
});

// POST /api/documents/:id/workflow/approve — تایید و ارجاع به مرحله بعدی روال
router.post("/:id/workflow/approve", async (c) => {
  const id = c.req.param("id");
  if (!ObjectId.isValid(id)) return c.json({ message: "شناسه نامعتبر" }, 400);

  const payload = (c.get as any)("jwtPayload") as any;
  const db = getDb();
  let user: any = null;
  if (payload.sub && ObjectId.isValid(payload.sub)) {
    user = await db.collection("users").findOne({ _id: new ObjectId(payload.sub) });
  }
  const userRole = user?.position || user?.role || payload.role || "کاربر";
  const userName = user?.name || (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.username) || payload.username || "کاربر";
  const userDisplay = `${userName} (${userRole})`;

  const existingDoc = await db.collection<JournalDocument>("journal_documents").findOne({ _id: new ObjectId(id) });
  if (!existingDoc) return c.json({ message: "سند یافت نشد" }, 404);

  const currentStep = existingDoc.workflowStep || "REGULATOR";

  const userPosition = (user?.position || user?.role || payload.role || "کاربر").trim();
  const isAdmin = userPosition === "admin" || userPosition === "مدیر سیستم" || user?.isAdmin;

  if (!isAdmin) {
    if ((currentStep === "ACCOUNTANT" || currentStep === "DRAFT" || currentStep === "REGULATOR") && !userPosition.includes("تنظیم حساب") && userPosition !== "REGULATOR") {
      return c.json({ message: "خطا: دسترسی غیرمجاز. تأیید سند در این مرحله فقط توسط کاربر «تنظیم حساب» امکان‌پذیر است." }, 403);
    }
    if (currentStep === "FIN_HEAD" && !userPosition.includes("رئیس امور مالی") && userPosition !== "FIN_HEAD") {
      return c.json({ message: "خطا: دسترسی غیرمجاز. تأیید سند در این مرحله فقط توسط «رئیس امور مالی» امکان‌پذیر است." }, 403);
    }
    if (currentStep === "FIN_DIRECTOR" && !userPosition.includes("مدیر مالی") && !userPosition.includes("ذیحساب") && userPosition !== "FIN_DIRECTOR") {
      return c.json({ message: "خطا: دسترسی غیرمجاز. تأیید سند در این مرحله فقط توسط «مدیر مالی و ذیحساب» امکان‌پذیر است." }, 403);
    }
    if (currentStep === "AGENCY_HEAD" && !userPosition.includes("رئیس دستگاه") && userPosition !== "AGENCY_HEAD") {
      return c.json({ message: "خطا: دسترسی غیرمجاز. تأیید سند در این مرحله فقط توسط «رئیس دستگاه اجرایی» امکان‌پذیر است." }, 403);
    }
  }

  let nextStep = "FIN_HEAD";
  let nextRole = "رئیس امور مالی";
  let nextStatus = "تأیید تنظیم حساب";

  if (currentStep === "ACCOUNTANT" || currentStep === "DRAFT" || currentStep === "REGULATOR") {
    nextStep = "FIN_HEAD";
    nextRole = "رئیس امور مالی";
    nextStatus = "تأیید تنظیم حساب";
  } else if (currentStep === "FIN_HEAD") {
    nextStep = "FIN_DIRECTOR";
    nextRole = "مدیر مالی و ذیحساب";
    nextStatus = "تأیید رئیس امور مالی";
  } else if (currentStep === "FIN_DIRECTOR") {
    nextStep = "AGENCY_HEAD";
    nextRole = "رئیس دستگاه اجرایی";
    nextStatus = "تأیید مدیر مالی و ذیحساب";
  } else if (currentStep === "AGENCY_HEAD") {
    nextStep = "FINAL";
    nextRole = "تکمیل شده";
    nextStatus = "CONFIRMED";
  }

  const historyItem = {
    action: "APPROVE",
    user: userDisplay,
    date: new Date().toISOString(),
    fromStep: currentStep,
    toStep: nextStep,
  };

  const updateFields: Record<string, unknown> = {
    workflowStep: nextStep,
    currentAssigneeRole: nextRole,
    status: nextStatus === "CONFIRMED" ? "CONFIRMED" : nextStatus,
    updatedAt: new Date().toISOString(),
  };

  const res = await db.collection<JournalDocument>("journal_documents").findOneAndUpdate(
    { _id: new ObjectId(id) },
    {
      $set: updateFields,
      $push: { workflowHistory: historyItem } as any
    },
    { returnDocument: "after" }
  );

  return c.json({ success: true, message: `سند با موفقیت تأیید شد و به ${nextRole} ارسال گردید.`, data: res });
});

// POST /api/documents/:id/workflow/reject — رد سند و ارجاع به مرحله قبلی همراه با دلیل رد
router.post("/:id/workflow/reject", async (c) => {
  const id = c.req.param("id");
  if (!ObjectId.isValid(id)) return c.json({ message: "شناسه نامعتبر" }, 400);

  const body = await c.req.json();
  const reason = (body.reason || "").trim();
  if (!reason) {
    return c.json({ message: "وارد نمودن دلیل رد سند الزامی است." }, 400);
  }

  const payload = (c.get as any)("jwtPayload") as any;
  const db = getDb();
  let user: any = null;
  if (payload.sub && ObjectId.isValid(payload.sub)) {
    user = await db.collection("users").findOne({ _id: new ObjectId(payload.sub) });
  }
  const userRole = user?.position || user?.role || payload.role || "کاربر";
  const userName = user?.name || (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.username) || payload.username || "کاربر";
  const userDisplay = `${userName} (${userRole})`;

  const existingDoc = await db.collection<JournalDocument>("journal_documents").findOne({ _id: new ObjectId(id) });
  if (!existingDoc) return c.json({ message: "سند یافت نشد" }, 404);

  const currentStep = existingDoc.workflowStep || "REGULATOR";

  const userPosition = (user?.position || user?.role || payload.role || "کاربر").trim();
  const isAdmin = userPosition === "admin" || userPosition === "مدیر سیستم" || user?.isAdmin;

  if (!isAdmin) {
    if ((currentStep === "ACCOUNTANT" || currentStep === "DRAFT" || currentStep === "REGULATOR") && !userPosition.includes("تنظیم حساب") && userPosition !== "REGULATOR") {
      return c.json({ message: "خطا: دسترسی غیرمجاز. رد سند در این مرحله فقط توسط کاربر «تنظیم حساب» امکان‌پذیر است." }, 403);
    }
    if (currentStep === "FIN_HEAD" && !userPosition.includes("رئیس امور مالی") && userPosition !== "FIN_HEAD") {
      return c.json({ message: "خطا: دسترسی غیرمجاز. رد سند در این مرحله فقط توسط «رئیس امور مالی» امکان‌پذیر است." }, 403);
    }
    if (currentStep === "FIN_DIRECTOR" && !userPosition.includes("مدیر مالی") && !userPosition.includes("ذیحساب") && userPosition !== "FIN_DIRECTOR") {
      return c.json({ message: "خطا: دسترسی غیرمجاز. رد سند در این مرحله فقط توسط «مدیر مالی و ذیحساب» امکان‌پذیر است." }, 403);
    }
    if (currentStep === "AGENCY_HEAD" && !userPosition.includes("رئیس دستگاه") && userPosition !== "AGENCY_HEAD") {
      return c.json({ message: "خطا: دسترسی غیرمجاز. رد سند در این مرحله فقط توسط «رئیس دستگاه اجرایی» امکان‌پذیر است." }, 403);
    }
  }

  let prevStep = "ACCOUNTANT";
  let prevRole = "حسابدار";

  if (currentStep === "REGULATOR" || currentStep === "ACCOUNTANT" || currentStep === "DRAFT") {
    prevStep = "ACCOUNTANT";
    prevRole = "حسابدار";
  } else if (currentStep === "FIN_HEAD") {
    prevStep = "REGULATOR";
    prevRole = "تنظیم حساب";
  } else if (currentStep === "FIN_DIRECTOR") {
    prevStep = "FIN_HEAD";
    prevRole = "رئیس امور مالی";
  } else if (currentStep === "AGENCY_HEAD") {
    prevStep = "FIN_DIRECTOR";
    prevRole = "مدیر مالی و ذیحساب";
  }

  const statusStr = `ابطال‌شده (برگشت از ${userDisplay})`;

  const historyItem = {
    action: "REJECT",
    user: userDisplay,
    reason,
    date: new Date().toISOString(),
    fromStep: currentStep,
    toStep: prevStep,
  };

  const updateFields: Record<string, unknown> = {
    workflowStep: prevStep,
    currentAssigneeRole: prevRole,
    status: statusStr,
    returnedUser: userDisplay,
    rejectionReason: reason,
    updatedAt: new Date().toISOString(),
  };

  const res = await db.collection<JournalDocument>("journal_documents").findOneAndUpdate(
    { _id: new ObjectId(id) },
    {
      $set: updateFields,
      $push: { workflowHistory: historyItem } as any
    },
    { returnDocument: "after" }
  );

  return c.json({ success: true, message: `سند رد شد و به ${prevRole} برگشت داده شد.`, data: res });
});

export default router;
