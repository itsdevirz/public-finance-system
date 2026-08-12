import { Hono } from "hono";
import { ObjectId } from "mongodb";
import { getDb } from "../db/index.js";

const router = new Hono();

export interface BankStatementFormat {
  _id?: ObjectId | string;
  code: string;
  title: string;
  bank_name: string;
  account_number?: string;
  file_type: "excel" | "csv" | "text";
  delimiter: string; // "," | ";" | "\t" | "|"
  header_row_index: number; // 1-indexed (e.g. row 1 or 2)
  encoding: "utf-8" | "windows-1256" | "ansi";
  is_default: boolean;
  status: "active" | "inactive";

  // Column Mappings (Column Letters like "A", "B", "C" or 1-indexed numbers)
  mapping: {
    date_col: string;
    date_format: string; // "YYYY/MM/DD" | "YYYYMMDD" | "YY/MM/DD"
    time_col?: string;
    ref_number_col: string;
    debit_col: string;
    credit_col: string;
    balance_col: string;
    description_col: string;
    payer_id_col?: string;
  };

  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

function serialize(doc: Record<string, unknown>) {
  return JSON.parse(
    JSON.stringify(doc, (_k, v) => (v instanceof ObjectId ? v.toHexString() : v))
  );
}

// ─── فرمت‌های پیش‌فرض بانک‌های ایران ──────────────────────────────────────
const DEFAULT_PRESETS: Omit<BankStatementFormat, "_id">[] = [
  {
    code: "FMT-MELLI-01",
    title: "فرمت استاندارد فایل صورت‌حساب بانک ملی ایران (اکسل)",
    bank_name: "بانک ملی ایران",
    file_type: "excel",
    delimiter: ",",
    header_row_index: 2,
    encoding: "utf-8",
    is_default: true,
    status: "active",
    mapping: {
      date_col: "A",
      date_format: "YYYY/MM/DD",
      time_col: "B",
      ref_number_col: "C",
      debit_col: "D",
      credit_col: "E",
      balance_col: "F",
      description_col: "G",
      payer_id_col: "H",
    },
    remarks: "الگوی رسمی خروجی اینترنتی صورت‌حساب بانک ملی (بام)",
  },
  {
    code: "FMT-MELLAT-01",
    title: "فرمت استاندارد فایل صورت‌حساب بانک ملت (CSV/متنی)",
    bank_name: "بانک ملت",
    file_type: "csv",
    delimiter: ",",
    header_row_index: 1,
    encoding: "utf-8",
    is_default: true,
    status: "active",
    mapping: {
      date_col: "A",
      date_format: "YYYY/MM/DD",
      ref_number_col: "B",
      debit_col: "C",
      credit_col: "D",
      balance_col: "E",
      description_col: "F",
      payer_id_col: "G",
    },
    remarks: "الگوی استاندارد صورت‌حساب فرافراتکس بانک ملت",
  },
  {
    code: "FMT-TEJARAT-01",
    title: "فرمت صورت‌حساب بانک تجارت (اکسل)",
    bank_name: "بانک تجارت",
    file_type: "excel",
    delimiter: ",",
    header_row_index: 1,
    encoding: "utf-8",
    is_default: true,
    status: "active",
    mapping: {
      date_col: "A",
      date_format: "YYYY/MM/DD",
      ref_number_col: "B",
      debit_col: "C",
      credit_col: "D",
      balance_col: "E",
      description_col: "F",
    },
    remarks: "الگوی صورت‌حساب سامانه تجارت الکترونیک",
  },
  {
    code: "FMT-SEPAH-01",
    title: "فرمت صورت‌حساب بانک سپه (CSV)",
    bank_name: "بانک سپه",
    file_type: "csv",
    delimiter: ";",
    header_row_index: 1,
    encoding: "utf-8",
    is_default: true,
    status: "active",
    mapping: {
      date_col: "A",
      date_format: "YYYYMMDD",
      ref_number_col: "B",
      debit_col: "C",
      credit_col: "D",
      balance_col: "E",
      description_col: "F",
    },
    remarks: "الگوی صورت‌حساب سامانه امید بانک سپه",
  },
];

// دریافت تمامی فرمت‌های ثبت‌شده در دیتابیس
router.get("/", async (c) => {
  try {
    const db = getDb();
    const collection = db.collection<BankStatementFormat>("bank_statement_formats");
    const data = await collection.find().sort({ createdAt: -1 }).toArray();

    return c.json({
      success: true,
      data: data.map((d) => serialize(d as Record<string, unknown>)),
      message: "لیست فرمت‌های صورت حساب بانک",
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// پیشنهاد کد فرمت بعدی
router.get("/suggest-code", async (c) => {
  try {
    const db = getDb();
    const count = await db.collection("bank_statement_formats").countDocuments();
    const nextCode = `FMT-${String(count + 1).padStart(3, "0")}`;
    return c.json({ success: true, code: nextCode });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ثبت فرمت جدید
router.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const { title, bank_name, file_type, mapping } = body;

    if (!title || !bank_name || !file_type || !mapping) {
      return c.json({ success: false, message: "فیلدهای عنوان، نام بانک، نوع فایل و نگاشت الزامی هستند" }, 400);
    }

    const db = getDb();
    const now = new Date().toISOString();
    const code = body.code || `FMT-${Date.now().toString().slice(-4)}`;

    const newFormat: Omit<BankStatementFormat, "_id"> = {
      code,
      title,
      bank_name,
      account_number: body.account_number || "",
      file_type,
      delimiter: body.delimiter || ",",
      header_row_index: Number(body.header_row_index) || 1,
      encoding: body.encoding || "utf-8",
      is_default: Boolean(body.is_default),
      status: body.status || "active",
      mapping: {
        date_col: mapping.date_col || "A",
        date_format: mapping.date_format || "YYYY/MM/DD",
        time_col: mapping.time_col || "",
        ref_number_col: mapping.ref_number_col || "B",
        debit_col: mapping.debit_col || "C",
        credit_col: mapping.credit_col || "D",
        balance_col: mapping.balance_col || "E",
        description_col: mapping.description_col || "F",
        payer_id_col: mapping.payer_id_col || "",
      },
      remarks: body.remarks || "",
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection<BankStatementFormat>("bank_statement_formats").insertOne(newFormat as any);
    const inserted = await db.collection("bank_statement_formats").findOne({ _id: result.insertedId as any });

    return c.json({
      success: true,
      message: "فرمت صورت حساب بانک با موفقیت ثبت شد",
      data: serialize(inserted as Record<string, unknown>),
    }, 201);
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ویرایش فرمت
router.patch("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (!ObjectId.isValid(id)) return c.json({ success: false, message: "شناسه نامعتبر" }, 400);

    const body = await c.req.json();
    const db = getDb();

    const updateDoc = {
      ...body,
      updatedAt: new Date().toISOString(),
    };
    delete updateDoc._id;

    const res = await db.collection<BankStatementFormat>("bank_statement_formats").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateDoc },
      { returnDocument: "after" }
    );

    if (!res) return c.json({ success: false, message: "فرمت مورد نظر یافت نشد" }, 404);

    return c.json({
      success: true,
      message: "فرمت صورت حساب بانک به‌روزرسانی شد",
      data: serialize(res as Record<string, unknown>),
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// حذف فرمت
router.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (!ObjectId.isValid(id)) return c.json({ success: false, message: "شناسه نامعتبر" }, 400);

    const db = getDb();
    await db.collection("bank_statement_formats").deleteOne({ _id: new ObjectId(id) });

    return c.json({ success: true, message: "فرمت صورت حساب بانک با موفقیت حذف شد" });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// تست و پارس محتوای فایل نمونه
router.post("/parse-test", async (c) => {
  try {
    const { file_content, delimiter = ",", header_row = 1, mapping } = await c.req.json();

    if (!file_content || !mapping) {
      return c.json({ success: false, message: "محتوای فایل و نگاشت ستون‌ها الزامی است" }, 400);
    }

    // تبدیل خطوط فایل متنی/CSV به آرایه‌ها جهت پیش‌نمایش
    const lines = String(file_content)
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const dataRows = lines.slice(Math.max(0, header_row - 1));

    const colToIndex = (col: string): number => {
      if (!col) return -1;
      const clean = col.toUpperCase().trim();
      if (/^[A-Z]+$/.test(clean)) {
        let num = 0;
        for (let i = 0; i < clean.length; i++) {
          num = num * 26 + (clean.charCodeAt(i) - 64);
        }
        return num - 1;
      }
      const parsedNum = parseInt(clean, 10);
      return !isNaN(parsedNum) ? Math.max(0, parsedNum - 1) : -1;
    };

    const dateIdx = colToIndex(mapping.date_col);
    const refIdx = colToIndex(mapping.ref_number_col);
    const debitIdx = colToIndex(mapping.debit_col);
    const creditIdx = colToIndex(mapping.credit_col);
    const balanceIdx = colToIndex(mapping.balance_col);
    const descIdx = colToIndex(mapping.description_col);

    const parsedRows = dataRows.slice(0, 20).map((row, idx) => {
      const parts = row.split(delimiter).map((p) => p.replace(/^["']|["']$/g, "").trim());
      return {
        row_num: idx + 1,
        date: parts[dateIdx] || "—",
        ref_number: parts[refIdx] || "—",
        debit: parts[debitIdx] || "0",
        credit: parts[creditIdx] || "0",
        balance: parts[balanceIdx] || "0",
        description: parts[descIdx] || row,
      };
    });

    return c.json({
      success: true,
      total_rows: dataRows.length,
      preview_rows: parsedRows,
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

export default router;
