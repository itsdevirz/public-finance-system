import { Hono } from "hono";
import { ObjectId } from "mongodb";
import { getDb } from "../db/index.js";

const router = new Hono();

const DEFAULT_STATIC_PASSWORD = "you1431569";
const SETTING_KEY_PASSWORD = "department_definition_password";

/**
 * دریافت یا ایجاد تنظیمات رمز ایستای تعریف اداره
 */
async function getStoredStaticPassword(): Promise<string> {
  try {
    const db = getDb();
    const setting = await db.collection("system_settings").findOne({ key: SETTING_KEY_PASSWORD });
    if (setting && setting.value) {
      return String(setting.value);
    }
  } catch (err) {
    console.error("Error reading department password setting:", err);
  }
  return DEFAULT_STATIC_PASSWORD;
}

/**
 * اطمینان از وجود حداقل یک اداره پیش‌فرض در سیستم
 */
export async function ensureDefaultDepartment(): Promise<any> {
  try {
    const db = getDb();
    const count = await db.collection("departments").countDocuments();
    if (count === 0) {
      const defaultDept = {
        code: "01",
        name: "اداره کل مرکزی",
        managerName: "مدیر سیستم",
        phone: "021-88888888",
        nationalId: "14000000000",
        address: "سازمان مرکزی - ساختمان امور مالی و اداری",
        description: "اداره کل اصلی و پیش‌فرض سامانه",
        isDefault: true,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const result = await db.collection("departments").insertOne(defaultDept);
      return { ...defaultDept, _id: result.insertedId };
    }
    const def = await db.collection("departments").findOne({ isDefault: true });
    if (def) return def;
    return await db.collection("departments").findOne();
  } catch (err) {
    console.error("Error ensuring default department:", err);
    return null;
  }
}

// ─── تایید رمز ایستای ورود به تعریف اداره ──────────────────────────────────────
router.post("/verify-password", async (c) => {
  try {
    const body = await c.req.json();
    const enteredPassword = body.password ? String(body.password).trim() : "";
    const storedPassword = await getStoredStaticPassword();

    if (!enteredPassword) {
      return c.json({ success: false, message: "رمز عبور را وارد نمایید." }, 400);
    }

    if (enteredPassword === storedPassword) {
      return c.json({
        success: true,
        message: "رمز عبور تایید شد.",
        unlocked: true,
      });
    }

    return c.json({
      success: false,
      message: "رمز عبور وارد شده نادرست است.",
    }, 401);
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ─── تغییر رمز ایستای تعریف اداره (توسط مدیر سیستم) ───────────────────────────
router.post("/change-password", async (c) => {
  try {
    const body = await c.req.json();
    const { currentPassword, newPassword } = body;

    if (!newPassword || String(newPassword).trim().length < 4) {
      return c.json({ success: false, message: "رمز عبور جدید باید حداقل ۴ کاراکتر باشد." }, 400);
    }

    const storedPassword = await getStoredStaticPassword();
    const trimmedCurrent = currentPassword ? String(currentPassword).trim() : "";

    // اعتبارسنجی رمز عبور فعلی
    if (trimmedCurrent !== storedPassword) {
      return c.json({ success: false, message: "رمز عبور فعلی اشتباه است." }, 400);
    }

    const db = getDb();
    await db.collection("system_settings").updateOne(
      { key: SETTING_KEY_PASSWORD },
      {
        $set: {
          key: SETTING_KEY_PASSWORD,
          value: String(newPassword).trim(),
          updatedAt: new Date().toISOString(),
        },
      },
      { upsert: true }
    );

    return c.json({
      success: true,
      message: "رمز عبور ایستای تعریف اداره با موفقیت تغییر یافت.",
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ─── GET /api/departments - لیست تمام ادارات ────────────────────────────────────
router.get("/", async (c) => {
  try {
    const db = getDb();
    await ensureDefaultDepartment();
    const list = await db.collection("departments").find().sort({ code: 1 }).toArray();
    return c.json({ success: true, data: list });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ─── GET /api/departments/:id - دریافت یک اداره ────────────────────────────────
router.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const db = getDb();
    let query: any = {};
    if (ObjectId.isValid(id)) {
      query = { _id: new ObjectId(id) };
    } else {
      query = { code: id };
    }
    const dept = await db.collection("departments").findOne(query);
    if (!dept) {
      return c.json({ success: false, message: "اداره مورد نظر یافت نشد." }, 404);
    }
    return c.json({ success: true, data: dept });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ─── POST /api/departments - ایجاد اداره جدید ─────────────────────────────────
router.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const db = getDb();

    const code = body.code ? String(body.code).trim() : "";
    const name = body.name ? String(body.name).trim() : "";

    if (!code) {
      return c.json({ success: false, message: "کد یا شناسه سازمان/اداره الزامی است." }, 400);
    }
    if (!name) {
      return c.json({ success: false, message: "نام سازمان/اداره الزامی است." }, 400);
    }

    // بررسی تکراری نبودن کد
    const existingCode = await db.collection("departments").findOne({ code });
    if (existingCode) {
      return c.json({ success: false, message: `سازمان یا اداره‌ای با کد «${code}» قبلاً تعریف شده است.` }, 400);
    }

    const isDefault = Boolean(body.isDefault);
    if (isDefault) {
      // غیرفعال کردن پیش‌فرض برای بقیه
      await db.collection("departments").updateMany({}, { $set: { isDefault: false } });
    }

    const newDoc = {
      code,
      name,
      managerName: body.managerName ? String(body.managerName).trim() : "",
      phone: body.phone ? String(body.phone).trim() : "",
      nationalId: body.nationalId ? String(body.nationalId).trim() : "",
      economicCode: body.economicCode ? String(body.economicCode).trim() : "",
      postalCode: body.postalCode ? String(body.postalCode).trim() : "",
      address: body.address ? String(body.address).trim() : "",
      description: body.description ? String(body.description).trim() : "",
      isDefault,
      isActive: body.isActive !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const res = await db.collection("departments").insertOne(newDoc);
    return c.json({
      success: true,
      message: "اداره جدید با موفقیت ثبت شد.",
      data: { ...newDoc, _id: res.insertedId },
    }, 201);
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ─── PUT /api/departments/:id - ویرایش اداره ──────────────────────────────────
router.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const db = getDb();

    if (!ObjectId.isValid(id)) {
      return c.json({ success: false, message: "شناسه اداره نامعتبر است." }, 400);
    }

    const code = body.code ? String(body.code).trim() : "";
    const name = body.name ? String(body.name).trim() : "";

    if (!code) {
      return c.json({ success: false, message: "کد سازمان/اداره الزامی است." }, 400);
    }
    if (!name) {
      return c.json({ success: false, message: "نام سازمان/اداره الزامی است." }, 400);
    }

    // بررسی تکراری نبودن کد با اسناد دیگر
    const existingCode = await db.collection("departments").findOne({
      code,
      _id: { $ne: new ObjectId(id) },
    });
    if (existingCode) {
      return c.json({ success: false, message: `سازمان یا اداره‌ای با کد «${code}» قبلاً تعریف شده است.` }, 400);
    }

    const isDefault = Boolean(body.isDefault);
    if (isDefault) {
      await db.collection("departments").updateMany(
        { _id: { $ne: new ObjectId(id) } },
        { $set: { isDefault: false } }
      );
    }

    const updateData: Record<string, any> = {
      code,
      name,
      managerName: body.managerName ? String(body.managerName).trim() : "",
      phone: body.phone ? String(body.phone).trim() : "",
      nationalId: body.nationalId ? String(body.nationalId).trim() : "",
      economicCode: body.economicCode ? String(body.economicCode).trim() : "",
      postalCode: body.postalCode ? String(body.postalCode).trim() : "",
      address: body.address ? String(body.address).trim() : "",
      description: body.description ? String(body.description).trim() : "",
      isDefault,
      isActive: body.isActive !== false,
      updatedAt: new Date().toISOString(),
    };

    const res = await db.collection("departments").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: "after" }
    );

    if (!res) {
      return c.json({ success: false, message: "اداره مورد نظر یافت نشد." }, 404);
    }

    return c.json({
      success: true,
      message: "اطلاعات اداره با موفقیت ویرایش شد.",
      data: res,
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ─── DELETE /api/departments/:id - حذف اداره ───────────────────────────────────
router.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const db = getDb();

    if (!ObjectId.isValid(id)) {
      return c.json({ success: false, message: "شناسه اداره نامعتبر است." }, 400);
    }

    const count = await db.collection("departments").countDocuments();
    if (count <= 1) {
      return c.json({ success: false, message: "حداقل باید یک اداره در سیستم باقی بماند و امکان حذف آخرین اداره وجود ندارد." }, 400);
    }

    const dept = await db.collection("departments").findOne({ _id: new ObjectId(id) });
    if (!dept) {
      return c.json({ success: false, message: "اداره مورد نظر یافت نشد." }, 404);
    }

    if (dept.isDefault) {
      return c.json({ success: false, message: "اداره پیش‌فرض سیستم قابل حذف نیست. ابتدا اداره پیش‌فرض دیگری انتخاب کنید." }, 400);
    }

    // بررسی اسناد مربوط به این اداره
    const docsCount = await db.collection("journal_documents").countDocuments({
      $or: [
        { departmentId: id },
        { departmentId: dept.code },
      ],
    });

    if (docsCount > 0) {
      return c.json({
        success: false,
        message: `امکان حذف این اداره وجود ندارد؛ تعداد ${docsCount} سند به این اداره منتسب می‌باشد. می‌توانید آن را غیرفعال نمایید.`,
      }, 400);
    }

    await db.collection("departments").deleteOne({ _id: new ObjectId(id) });

    return c.json({
      success: true,
      message: "اداره با موفقیت حذف شد.",
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

export default router;
