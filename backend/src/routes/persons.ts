import { Hono } from "hono";
import { getDb } from "../db/index.js";
import { ObjectId } from "mongodb";
import sanamaTypes from "../data/sanamaTypes.json";

const router = new Hono();

// Helper to validate detailClass matches the personKind hierarchy in sanamaTypes.json
// Supports both 3-level (class → subclass → detail) and 2-level (class → detail) structures
function isValidSanamaCode(personKind: string, detailClass: string): boolean {
  const typesData = sanamaTypes as any;
  const section = typesData.personTypes.find((s: any) => s.type === personKind);
  if (!section) return false;

  for (const cls of section.children || []) {
    for (const sub of cls.children || []) {
      // 2-level: class → detail (no sub-children), sub itself is the leaf
      if (!sub.children || sub.children.length === 0) {
        if (sub.code === detailClass) return true;
        continue;
      }
      // 3-level: class → subclass → detail
      for (const det of sub.children || []) {
        if (det.code === detailClass) return true;
      }
    }
  }
  return false;
}

// DELETE /api/persons/clear-all - Clear all persons
router.delete("/clear-all", async (c) => {
  try {
    const db = getDb();
    const result = await db.collection("persons").deleteMany({});
    return c.json({ success: true, message: "تمامی رکوردهای اشخاص با موفقیت حذف شدند", count: result.deletedCount });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// GET /api/persons - Get all persons
router.get("/", async (c) => {
  try {
    const db = getDb();
    const persons = await db.collection("persons")
      .find({}, {
        projection: {
          _id: 1, nomineeCode: 1, personKind: 1, title: 1,
          firstName: 1, lastName: 1, nationalId: 1, inactive: 1,
          personClass: 1, subClass: 1, detailClass: 1,
          economicCode: 1, sheba: 1, province: 1, city: 1,
        }
      })
      .sort({ nomineeCode: 1 })
      .toArray();
    return c.json({ success: true, data: persons });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

function normalizePersianText(str: any): string {
  if (!str) return "";
  return String(str)
    .replace(/[\u064B-\u0652]/g, "")   // Remove Arabic diacritics/harakat
    .replace(/[\u064A\u0649]/g, "ی")   // Arabic Yeh / Alef Maksura -> Persian Yeh
    .replace(/\u0643/g, "ک")           // Arabic Keh -> Persian Keh
    .replace(/[\u200c\u00a0]/g, " ")    // ZWNJ and non-breaking space -> space
    .replace(/\s+/g, " ")              // Multiple spaces -> single space
    .replace(/[٠۰]/g, "0")
    .replace(/[١۱]/g, "1")
    .replace(/[٢۲]/g, "2")
    .replace(/[٣۳]/g, "3")
    .replace(/[٤۴]/g, "4")
    .replace(/[٥۵]/g, "5")
    .replace(/[٦۶]/g, "6")
    .replace(/[٧۷]/g, "7")
    .replace(/[٨۸]/g, "8")
    .replace(/[٩۹]/g, "9")
    .trim();
}

function formatNationalId11(personKind?: string, nationalId?: string): string {
  const kind = (personKind || "A").trim().substring(0, 1).toUpperCase();
  const cleanId = String(nationalId || "").replace(/\D/g, "").trim();
  if (!cleanId) return "";
  if (kind === "A") {
    return cleanId.length >= 11 ? cleanId.slice(0, 11) : cleanId.padStart(11, "0");
  } else {
    // اشخاص حقیقی (B, C, D): طبق پروتکل، با قرار گرفتن عدد ۹ قبل از کد ملی ۱۰ رقمی، به ۱۱ رقم تبدیل می‌شود
    if (cleanId.length === 10 && !cleanId.startsWith("9")) {
      return `9${cleanId}`;
    }
    if (cleanId.length >= 11) {
      return cleanId.slice(0, 11);
    }
    return cleanId;
  }
}

function buildNomineeCode(personKind?: string, detailClass?: string, nationalId?: string, exclusiveCode?: string, suggestedCode?: string): string {
  const kind = (personKind || "A").trim().substring(0, 1).toUpperCase();
  const cls4 = String(detailClass || "").replace(/\D/g, "").padStart(4, "0").substring(0, 4);

  const rawId = String(nationalId || exclusiveCode || suggestedCode || "").replace(/\D/g, "").trim();
  const id11 = formatNationalId11(kind, rawId);

  return `${kind}${cls4}${id11}`;
}

// POST /api/persons/import - Bulk import persons from Excel/CSV
router.post("/import", async (c) => {
  try {
    const body = await c.req.json();
    const items = Array.isArray(body.items) ? body.items : [];
    if (items.length === 0) {
      return c.json({ success: false, message: "هیچ رکوردی برای آپلود دریافت نشد" }, 400);
    }

    const db = getDb();
    let inserted = 0;
    let updated = 0;

    for (const raw of items) {
      let rawNatId = normalizePersianText(raw.nationalId || raw["شناسه ملی"] || raw["شناسه ملی طرف حساب"] || raw["کد ملی"] || "");
      const title = normalizePersianText(raw.title || raw["طرف حساب"] || raw["عنوان"] || raw["عنوان شخصیت حقوقی"] || "");

      let personKind = (raw.personKind || raw["نوع شخص"] || "").toString().trim().toUpperCase();
      if (!personKind || !["A", "B", "C", "D"].includes(personKind)) {
        const cleanId = rawNatId.replace(/\D/g, "");
        personKind = cleanId.length === 10 ? "B" : "A";
      }

      const nationalId = formatNationalId11(personKind, rawNatId);
      const detailClass = normalizePersianText(raw.detailClass || raw["کد طبقه بندی"] || "3237");
      const personClass = raw.personClass || (detailClass ? detailClass.substring(0, 2) : "32");
      const subClass = raw.subClass || (detailClass ? detailClass.substring(0, 3) : "323");

      if (!title && !nationalId) continue;

      const nomineeCode = raw.nomineeCode || buildNomineeCode(personKind, detailClass, nationalId);

      const filter = nationalId 
        ? { $or: [{ nomineeCode }, { nationalId }] }
        : { nomineeCode };

      const existing = await db.collection("persons").findOne(filter);

      const docData = {
        personKind,
        personClass,
        subClass,
        detailClass,
        nationalId,
        title,
        nomineeCode,
        inactive: false,
        updatedAt: new Date().toISOString(),
      };

      if (existing) {
        await db.collection("persons").updateOne({ _id: existing._id }, { $set: docData });
        updated++;
      } else {
        await db.collection("persons").insertOne({
          ...docData,
          createdAt: new Date().toISOString(),
        });
        inserted++;
      }
    }

    return c.json({
      success: true,
      message: `${inserted} شخص جدید افزوده‌شد و ${updated} شخص بروزرسانی گردید.`,
      data: { inserted, updated, total: items.length },
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// GET /api/persons/:id - Get a single person
router.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const db = getDb();
    const person = await db.collection("persons").findOne({ _id: new ObjectId(id) });
    if (!person) {
      return c.json({ success: false, message: "شخص مورد نظر یافت نشد" }, 404);
    }
    return c.json({ success: true, data: person });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// POST /api/persons - Create a new person
router.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const db = getDb();

    // Validate personKind and detailClass based on sanamaTypes.json
    if (!body.personKind || !body.detailClass) {
      return c.json({ success: false, message: "نوع شخص و جزء‌طبقه الزامی هستند" }, 400);
    }

    if (!isValidSanamaCode(body.personKind, body.detailClass)) {
      return c.json({ 
        success: false, 
        message: `کد جزء‌طبقه ${body.detailClass} برای نوع شخص ${body.personKind} در سند ساختار سناما (sanamaTypes.json) نامعتبر است` 
      }, 400);
    }
    
    const nationalId = formatNationalId11(body.personKind, body.nationalId);
    const nomineeCode = body.nomineeCode || buildNomineeCode(body.personKind, body.detailClass, nationalId, body.exclusiveCode, body.suggestedCode);

    // Check if nomineeCode already exists
    const existing = await db.collection("persons").findOne({ nomineeCode });
    if (existing) {
      return c.json({ success: false, message: "شخصی با این کد شناسایی (NomineeCode) قبلاً ثبت شده است" }, 400);
    }

    const doc = {
      ...body,
      nationalId,
      nomineeCode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await db.collection("persons").insertOne(doc);
    return c.json({ success: true, data: { ...doc, _id: result.insertedId } }, 201);
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// PUT /api/persons/:id - Update a person
router.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const db = getDb();

    // Validate personKind and detailClass based on sanamaTypes.json
    if (!body.personKind || !body.detailClass) {
      return c.json({ success: false, message: "نوع شخص و جزء‌طبقه الزامی هستند" }, 400);
    }

    if (!isValidSanamaCode(body.personKind, body.detailClass)) {
      return c.json({ 
        success: false, 
        message: `کد جزء‌طبقه ${body.detailClass} برای نوع شخص ${body.personKind} در سند ساختار سناما (sanamaTypes.json) نامعتبر است` 
      }, 400);
    }

    const nationalId = formatNationalId11(body.personKind, body.nationalId);
    const nomineeCode = body.nomineeCode || buildNomineeCode(body.personKind, body.detailClass, nationalId, body.exclusiveCode, body.suggestedCode);

    // Check if nomineeCode already exists for another person
    const existing = await db.collection("persons").findOne({ 
      nomineeCode, 
      _id: { $ne: new ObjectId(id) } 
    });
    if (existing) {
      return c.json({ success: false, message: "شخصی با این کد شناسایی (NomineeCode) قبلاً ثبت شده است" }, 400);
    }

    const { _id, ...updateData } = body;
    updateData.nationalId = nationalId;
    updateData.nomineeCode = nomineeCode;
    const result = await db.collection("persons").findOneAndUpdate(
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
      return c.json({ success: false, message: "شخص مورد نظر یافت نشد" }, 404);
    }

    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// DELETE /api/persons/:id - Delete a person
router.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const db = getDb();
    const result = await db.collection("persons").deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return c.json({ success: false, message: "شخص مورد نظر یافت نشد" }, 404);
    }
    return c.json({ success: true, message: "شخص با موفقیت حذف شد" });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

export default router;
