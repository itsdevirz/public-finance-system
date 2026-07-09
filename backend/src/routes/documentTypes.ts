import { Hono } from "hono";
import { getDb } from "../db/index.js";
import { ObjectId } from "mongodb";

const router = new Hono();

// ─── انواع سند پیش‌فرض ───────────────────────────────────────────────────────
export const DEFAULT_DOCUMENT_TYPES = [
  { code: "OPN", title: "سند افتتاحیه",        shortTitle: "افتتاحیه",    group: "حسابداری", module: "حسابداری",      nature: "بدهکار",    level: "گروه" },
  { code: "CLS", title: "سند اختتامیه",         shortTitle: "اختتامیه",    group: "حسابداری", module: "حسابداری",      nature: "بستانکار",  level: "گروه" },
  { code: "JRN", title: "سند روزنامه",           shortTitle: "روزنامه",     group: "حسابداری", module: "حسابداری",      nature: "بدهکار",    level: "کل"   },
  { code: "ADJ", title: "سند اصلاحی",            shortTitle: "اصلاحی",      group: "حسابداری", module: "حسابداری",      nature: "بدهکار",    level: "کل"   },
  { code: "ADU", title: "سند تعدیلی",            shortTitle: "تعدیلی",      group: "حسابداری", module: "حسابداری",      nature: "بدهکار",    level: "کل"   },
  { code: "RCV", title: "سند دریافت نقدی",       shortTitle: "دریافت نقدی", group: "خزانه",    module: "دریافت و پرداخت", nature: "بدهکار",  level: "معین" },
  { code: "PAY", title: "سند پرداخت نقدی",       shortTitle: "پرداخت نقدی", group: "خزانه",    module: "دریافت و پرداخت", nature: "بستانکار", level: "معین" },
  { code: "CHR", title: "سند دریافت چک",         shortTitle: "دریافت چک",   group: "دریافت",   module: "دریافت و پرداخت", nature: "بدهکار",  level: "معین" },
  { code: "CHP", title: "سند پرداخت چک",         shortTitle: "پرداخت چک",   group: "پرداخت",   module: "دریافت و پرداخت", nature: "بستانکار", level: "معین" },
  { code: "TRF", title: "سند انتقال بین بانک‌ها", shortTitle: "انتقال",      group: "خزانه",    module: "دریافت و پرداخت", nature: "بدهکار",  level: "معین" },
  { code: "SLS", title: "سند فروش",              shortTitle: "فروش",        group: "فروش",     module: "فروش",          nature: "بدهکار",    level: "معین" },
  { code: "PUR", title: "سند خرید",              shortTitle: "خرید",        group: "خرید",     module: "خرید",          nature: "بستانکار",  level: "معین" },
  { code: "SRT", title: "سند برگشت از فروش",      shortTitle: "برگشت فروش",  group: "فروش",     module: "فروش",          nature: "بستانکار",  level: "معین" },
  { code: "PRT", title: "سند برگشت از خرید",      shortTitle: "برگشت خرید",  group: "خرید",     module: "خرید",          nature: "بدهکار",    level: "معین" },
  { code: "WRH", title: "سند انبار",              shortTitle: "انبار",       group: "انبار",    module: "انبار",         nature: "بدهکار",    level: "تفصیلی" },
  { code: "AST", title: "سند اموال",              shortTitle: "اموال",       group: "اموال",    module: "اموال",         nature: "بدهکار",    level: "تفصیلی" },
  { code: "SAL", title: "سند حقوق و دستمزد",      shortTitle: "حقوق",        group: "حقوق و دستمزد", module: "حقوق",   nature: "بدهکار",    level: "تفصیلی" },
  { code: "FXR", title: "سند تسعیر ارز",          shortTitle: "تسعیر ارز",   group: "حسابداری", module: "حسابداری",      nature: "بدهکار",    level: "کل"   },
  { code: "TMC", title: "سند بستن حساب موقت",      shortTitle: "بستن موقت",   group: "حسابداری", module: "حسابداری",      nature: "بستانکار",  level: "کل"   },
];

// ─── ساختار کامل یک DocumentType ─────────────────────────────────────────────
interface DocumentType {
  _id?: ObjectId;
  code: string;
  title: string;
  shortTitle: string;
  group: string;        // گروه سند
  module: string;       // ماژول مربوطه
  color: string;
  icon: string;
  isActive: boolean;
  isDefault: boolean;   // آیا از انواع پیش‌فرض سیستم است
  description: string;

  // تب ۲: شماره‌گذاری
  numbering: {
    method: "auto" | "manual" | "combined";
    prefix: string;
    startNumber: number;
    digitCount: number;
    separatePerYear: boolean;
    separatePerBranch: boolean;
    separatePerType: boolean;
    separatePerPeriod: boolean;
  };

  // تب ۳: تنظیمات ثبت
  registration: {
    allowDraft: boolean;
    allowTemporary: boolean;
    allowFinal: boolean;
    allowEdit: boolean;
    allowDelete: boolean;
    allowReverse: boolean;
    allowCopy: boolean;
    allowPrint: boolean;
    allowArchive: boolean;
    autoGenerateAccounting: boolean;
    autoPostOnSave: boolean;
    saveDraft: boolean;
  };

  // تب ۴: کنترل‌های مالی
  financialControls: {
    requireBalanced: boolean;
    allowZeroAmount: boolean;
    allowNoDescription: boolean;
    allowDuplicateAccount: boolean;
    allowDuplicateMoein: boolean;
    allowDuplicateCostCenter: boolean;
    checkAmountLimit: boolean;
    maxAmount: number;
    checkFiscalDate: boolean;
    checkFiscalPeriod: boolean;
    checkAccountStatus: boolean;
  };

  // تب ۵: گردش کار
  workflow: {
    requireSupervisorApproval: boolean;
    requireFinanceManagerApproval: boolean;
    requireCEOApproval: boolean;
    approvalSteps: number;
    allowReject: boolean;
    allowReturnForCorrection: boolean;
  };

  // تب ۶: تنظیمات چاپ
  print: {
    template: string;
    showLogo: boolean;
    showStamp: boolean;
    showSignature: boolean;
    showBarcode: boolean;
    showQRCode: boolean;
    copyCount: number;
    autoPrintAfterPost: boolean;
  };

  // تب ۷: اتصال سیستم‌ها
  systemConnections: string[];   // ["انبار","اموال","حقوق",...]

  // تب ۸: دسترسی کاربران
  permissions: {
    canCreate: string[];   // نقش‌ها
    canEdit: string[];
    canDelete: string[];
    canPrint: string[];
    canVoid: string[];
    canApprove: string[];
    canView: string[];
  };

  // تب ۹: تنظیمات پیشرفته
  advanced: {
    autoGenerateReversal: boolean;
    createCorrectionDoc: boolean;
    allowAttachment: boolean;
    requireAttachment: boolean;
    recordEffectiveDate: boolean;
    recordDueDate: boolean;
    recordUniqueId: boolean;
    recordTrackingCode: boolean;
    recordReferenceNumber: boolean;
    recordArchiveNumber: boolean;
  };

  createdAt: string;
  updatedAt: string;
}

// ─── مقدار پیش‌فرض برای یک DocumentType جدید ────────────────────────────────
function defaultDocType(partial: Partial<DocumentType> = {}): Omit<DocumentType, "_id"> {
  return {
    code: "",
    title: "",
    shortTitle: "",
    group: "عمومی",
    module: "حسابداری",
    color: "#6366f1",
    icon: "FileText",
    isActive: true,
    isDefault: false,
    description: "",
    numbering: {
      method: "auto",
      prefix: "",
      startNumber: 1,
      digitCount: 6,
      separatePerYear: true,
      separatePerBranch: false,
      separatePerType: true,
      separatePerPeriod: false,
    },
    registration: {
      allowDraft: true,
      allowTemporary: true,
      allowFinal: true,
      allowEdit: true,
      allowDelete: false,
      allowReverse: true,
      allowCopy: true,
      allowPrint: true,
      allowArchive: true,
      autoGenerateAccounting: false,
      autoPostOnSave: false,
      saveDraft: true,
    },
    financialControls: {
      requireBalanced: true,
      allowZeroAmount: false,
      allowNoDescription: false,
      allowDuplicateAccount: false,
      allowDuplicateMoein: false,
      allowDuplicateCostCenter: true,
      checkAmountLimit: false,
      maxAmount: 0,
      checkFiscalDate: true,
      checkFiscalPeriod: true,
      checkAccountStatus: true,
    },
    workflow: {
      requireSupervisorApproval: false,
      requireFinanceManagerApproval: false,
      requireCEOApproval: false,
      approvalSteps: 1,
      allowReject: true,
      allowReturnForCorrection: true,
    },
    print: {
      template: "default",
      showLogo: true,
      showStamp: true,
      showSignature: true,
      showBarcode: false,
      showQRCode: true,
      copyCount: 2,
      autoPrintAfterPost: false,
    },
    systemConnections: [],
    permissions: {
      canCreate:  ["admin", "accountant"],
      canEdit:    ["admin", "accountant"],
      canDelete:  ["admin"],
      canPrint:   ["admin", "accountant", "viewer"],
      canVoid:    ["admin"],
      canApprove: ["admin", "manager"],
      canView:    ["admin", "accountant", "viewer", "auditor"],
    },
    advanced: {
      autoGenerateReversal: false,
      createCorrectionDoc: false,
      allowAttachment: true,
      requireAttachment: false,
      recordEffectiveDate: false,
      recordDueDate: false,
      recordUniqueId: true,
      recordTrackingCode: false,
      recordReferenceNumber: false,
      recordArchiveNumber: false,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...partial,
  };
}

// ─── GET /api/document-types ──────────────────────────────────────────────────
router.get("/", async (c) => {
  try {
    const db = getDb();
    const { search, group, module: mod, isActive } = c.req.query();

    const filter: any = {};
    if (search) filter.$or = [
      { code:       { $regex: search, $options: "i" } },
      { title:      { $regex: search, $options: "i" } },
      { shortTitle: { $regex: search, $options: "i" } },
    ];
    if (group)    filter.group = group;
    if (mod)      filter.module = mod;
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const types = await db.collection("document_types")
      .find(filter).sort({ isDefault: -1, code: 1 }).toArray();

    return c.json({ success: true, data: types });
  } catch (e: any) {
    return c.json({ success: false, message: e.message }, 500);
  }
});

// ─── GET /api/document-types/seed — بارگذاری انواع پیش‌فرض ──────────────────
router.post("/seed", async (c) => {
  try {
    const db = getDb();
    let seeded = 0;

    for (const dt of DEFAULT_DOCUMENT_TYPES) {
      const exists = await db.collection("document_types").findOne({ code: dt.code });
      if (!exists) {
        await db.collection("document_types").insertOne(
          defaultDocType({ ...dt, isDefault: true })
        );
        seeded++;
      }
    }

    return c.json({ success: true, message: `${seeded} نوع سند پیش‌فرض بارگذاری شد` });
  } catch (e: any) {
    return c.json({ success: false, message: e.message }, 500);
  }
});

// ─── GET /api/document-types/:id ─────────────────────────────────────────────
router.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const db = getDb();
    const doc = await db.collection("document_types")
      .findOne({ _id: new ObjectId(id) });
    if (!doc) return c.json({ success: false, message: "نوع سند یافت نشد" }, 404);
    return c.json({ success: true, data: doc });
  } catch (e: any) {
    return c.json({ success: false, message: e.message }, 500);
  }
});

// ─── POST /api/document-types ─────────────────────────────────────────────────
router.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const db = getDb();

    if (!body.code || !body.title) {
      return c.json({ success: false, message: "کد و عنوان نوع سند الزامی است" }, 400);
    }

    const exists = await db.collection("document_types").findOne({ code: body.code });
    if (exists) return c.json({ success: false, message: "نوع سندی با این کد قبلاً ثبت شده است" }, 400);

    const doc = defaultDocType({ ...body, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    const result = await db.collection("document_types").insertOne(doc);

    return c.json({ success: true, data: { ...doc, _id: result.insertedId } }, 201);
  } catch (e: any) {
    return c.json({ success: false, message: e.message }, 500);
  }
});

// ─── PUT /api/document-types/:id ─────────────────────────────────────────────
router.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const db = getDb();

    // کد تکراری برای سایر اسناد
    if (body.code) {
      const exists = await db.collection("document_types")
        .findOne({ code: body.code, _id: { $ne: new ObjectId(id) } });
      if (exists) return c.json({ success: false, message: "نوع سندی با این کد قبلاً ثبت شده است" }, 400);
    }

    const { _id, ...update } = body;
    const result = await db.collection("document_types").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...update, updatedAt: new Date().toISOString() } },
      { returnDocument: "after" }
    );

    if (!result) return c.json({ success: false, message: "نوع سند یافت نشد" }, 404);
    return c.json({ success: true, data: result });
  } catch (e: any) {
    return c.json({ success: false, message: e.message }, 500);
  }
});

// ─── PATCH /api/document-types/:id/toggle ────────────────────────────────────
router.patch("/:id/toggle", async (c) => {
  try {
    const id = c.req.param("id");
    const db = getDb();
    const current = await db.collection("document_types").findOne({ _id: new ObjectId(id) });
    if (!current) return c.json({ success: false, message: "نوع سند یافت نشد" }, 404);

    const result = await db.collection("document_types").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { isActive: !current.isActive, updatedAt: new Date().toISOString() } },
      { returnDocument: "after" }
    );
    return c.json({ success: true, data: result });
  } catch (e: any) {
    return c.json({ success: false, message: e.message }, 500);
  }
});

// ─── DELETE /api/document-types/:id ──────────────────────────────────────────
router.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const db = getDb();

    const docType = await db.collection("document_types").findOne({ _id: new ObjectId(id) });
    if (!docType) return c.json({ success: false, message: "نوع سند یافت نشد" }, 404);

    // بررسی استفاده در اسناد مالی
    const usedCount = await db.collection("journal_documents")
      .countDocuments({ document_type_code: docType.code });

    if (usedCount > 0) {
      // فقط غیرفعال کن
      await db.collection("document_types").updateOne(
        { _id: new ObjectId(id) },
        { $set: { isActive: false, updatedAt: new Date().toISOString() } }
      );
      return c.json({
        success: true, deactivated: true,
        message: `این نوع سند در ${usedCount} سند مالی استفاده شده است. به‌جای حذف، غیرفعال گردید.`,
      });
    }

    if (docType.isDefault) {
      return c.json({ success: false, message: "انواع سند پیش‌فرض سیستم قابل حذف نیستند. فقط می‌توانید آن‌ها را غیرفعال کنید." }, 400);
    }

    await db.collection("document_types").deleteOne({ _id: new ObjectId(id) });
    return c.json({ success: true, message: "نوع سند با موفقیت حذف شد" });
  } catch (e: any) {
    return c.json({ success: false, message: e.message }, 500);
  }
});

export default router;
