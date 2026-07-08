import { Hono } from "hono";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { getDb } from "../db/index.js";
import type { JournalDocument } from "../db/types.js";
import { decryptDocument } from "../lib/crypto.js";
import { serialize, dateToNum, parseFaNum } from "../lib/helpers.js";

// ─── بارگذاری نقشه نام حساب‌ها از sanamaCodes.json —————————————————
const __dirname_ledger = dirname(fileURLToPath(import.meta.url));

const accountNameMap = new Map<string, string>(); // code → title

try {
  const raw = JSON.parse(
    readFileSync(join(__dirname_ledger, "../data/sanamaCodes.json"), "utf-8")
  );
  for (const group of raw.groups ?? []) {
    accountNameMap.set(group.code, group.title);
    for (const acct of group.accounts ?? []) {
      accountNameMap.set(acct.code, acct.title);
      for (const child of acct.children ?? []) {
        accountNameMap.set(child.code, child.title);
      }
    }
  }
} catch {
  // اگر فایل در دسترس نبود، نام‌ها از سند گرفته می‌شوند
}

const router = new Hono();


// GET /api/ledger/general-ledger — دفتر کل یک حساب در بازه زمانی
// Query params:
//   accountCode: کد حساب کل (3 رقم) — اجباری
//   dateFrom:    تاریخ شروع
//   dateTo:      تاریخ پایان
//   fiscalYear:  سال مالی (اختیاری)
router.get("/general-ledger", async (c) => {
  const accountCode = (c.req.query("accountCode") ?? "").trim();
  const dateFrom    = c.req.query("dateFrom")   ?? "";
  const dateTo      = c.req.query("dateTo")     ?? "";
  const fiscalYear  = c.req.query("fiscalYear") ?? "";

  if (!accountCode) {
    return c.json({ success: false, message: "کد حساب کل الزامی است" }, 400);
  }

  const fromNum = dateFrom ? dateToNum(dateFrom) : 0;
  const toNum   = dateTo   ? dateToNum(dateTo)   : 99999999;

  const db    = getDb();
  const query: Record<string, unknown> = {};
  if (fiscalYear) query.fiscal_year = parseInt(fiscalYear, 10);

  const docs = await db
    .collection<JournalDocument>("journal_documents")
    .find(query)
    .toArray();

  // نقشه نام حساب از sanamaCodes و account_heads
  const getAccountName = (code: string, fallback: string) =>
    accountNameMap.get(code) ?? fallback ?? "";

  // ─── گردش قبل از بازه (برای مانده اول دوره) ─────────────────────────
  let openDebit  = 0;
  let openCredit = 0;

  // ─── ردیف‌های داخل بازه ──────────────────────────────────────────────
  const rows: {
    date:         string;
    doc_number:   string;
    description:  string;
    debit:        number;
    credit:       number;
    balance:      number;
    nature:       string;
  }[] = [];

  for (const rawDoc of docs) {
    const doc = decryptDocument(serialize(rawDoc as Record<string, unknown>));
    if (doc.status === "CANCELLED") continue;

    const docDateNum = dateToNum(doc.document_date ?? "");

    for (const line of (doc.lines ?? []) as any[]) {
      const rawCode  = (line.account_code ?? "") as string;
      const digits   = rawCode.replace(/\D/g, "");
      // تطبیق کد: ۳ رقم اول کد باید با accountCode یکسان باشد
      if (!digits.startsWith(accountCode)) continue;

      const d  = (line.debit  ?? 0) as number;
      const cr = (line.credit ?? 0) as number;

      if (docDateNum < fromNum) {
        // قبل از بازه → مانده افتتاحیه
        openDebit  += d;
        openCredit += cr;
      } else if (docDateNum <= toNum) {
        // داخل بازه → ردیف دفتر کل
        rows.push({
          date:        doc.document_date   ?? "",
          doc_number:  doc.document_number ?? "",
          description: line.description   ?? doc.description ?? "",
          debit:       d,
          credit:      cr,
          balance:     0, // بعداً محاسبه می‌شود
          nature:      "",
        });
      }
    }
  }

  // مرتب‌سازی بر اساس تاریخ و شماره سند
  rows.sort((a, b) => {
    const da = dateToNum(a.date);
    const db_ = dateToNum(b.date);
    if (da !== db_) return da - db_;
    return a.doc_number.localeCompare(b.doc_number, "en", { numeric: true });
  });

  // ─── محاسبه مانده تجمیعی ──────────────────────────────────────────────
  let runningBalance = openDebit - openCredit;
  for (const row of rows) {
    runningBalance += row.debit - row.credit;
    row.balance = runningBalance;
    row.nature  = runningBalance > 0 ? "بدهکار" : runningBalance < 0 ? "بستانکار" : "تراز";
  }

  // مانده اول دوره
  const openNet     = openDebit - openCredit;
  const openBalance = {
    debit:   openDebit,
    credit:  openCredit,
    balance: openNet,
    nature:  openNet > 0 ? "بدهکار" : openNet < 0 ? "بستانکار" : "تراز",
  };

  // جمع گردش دوره
  const totals = rows.reduce(
    (acc, r) => ({ debit: acc.debit + r.debit, credit: acc.credit + r.credit }),
    { debit: 0, credit: 0 }
  );

  const accountName = getAccountName(accountCode, "");

  return c.json({
    data:         rows,
    openBalance,
    totals,
    accountCode,
    accountName,
    message:      "دفتر کل",
  });
});

// GET /api/ledger/ — flatten all embedded lines with their parent doc info (paginated)
router.get("/", async (c) => {
  const page = parseInt(c.req.query("page") ?? "1", 10);
  const limit = parseInt(c.req.query("limit") ?? "50", 10);
  const skip = (page - 1) * limit;

  const db = getDb();
  const totalDocs = await db.collection("journal_documents").countDocuments();

  const docs = await db
    .collection<JournalDocument>("journal_documents")
    .find()
    .sort({ _id: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  const data = docs.flatMap((doc) => {
    const decrypted = decryptDocument(serialize(doc as Record<string, unknown>));
    return (decrypted.lines ?? []).map((line: any) => ({
      doc_id: decrypted._id,
      doc_number: decrypted.document_number,
      doc_date: decrypted.document_date,
      doc_status: decrypted.status,
      fiscal_year: decrypted.fiscal_year,
      ...line,
    }));
  });

  return c.json({
    data,
    pagination: {
      total: totalDocs,
      page,
      limit,
      totalPages: Math.ceil(totalDocs / limit),
    },
    message: "دفتر کل",
  });
});

// GET /api/ledger/balance — total debit vs credit
router.get("/balance", async (c) => {
  const docs = await getDb()
    .collection<JournalDocument>("journal_documents")
    .find()
    .toArray();

  let total_debit = 0;
  let total_credit = 0;

  for (const doc of docs) {
    const decrypted = decryptDocument(serialize(doc as Record<string, unknown>));
    for (const line of decrypted.lines ?? []) {
      total_debit += line.debit ?? 0;
      total_credit += line.credit ?? 0;
    }
  }

  return c.json({ data: { total_debit, total_credit }, message: "تراز کل" });
});

// GET /api/ledger/trial-balance — تراز آزمایشی (۴، ۶ یا ۸ ستونی)
// Query params:
//   level: group|main|moein|detail  (default: main)
//   dateFrom: شروع دوره (YYYY/MM/DD یا 1404/01/01)
//   dateTo:   پایان دوره
//   fiscalYear: سال مالی (اختیاری)
router.get("/trial-balance", async (c) => {
  const level      = c.req.query("level")      ?? "main";
  const dateFrom   = c.req.query("dateFrom")   ?? "";
  const dateTo     = c.req.query("dateTo")     ?? "";
  const fiscalYear = c.req.query("fiscalYear") ?? "";

  // ─── تعداد ارقام کد بر اساس سطح ─────────────────────────────────────────
  const CODE_LEN: Record<string, number> = { group: 1, main: 3, moein: 5 };

  /** کد حساب را به اندازه سطح کوتاه می‌کند؛ برای detail کد کامل برمی‌گرداند */
  function getCodeForLevel(rawCode: string): string {
    const digits = rawCode.replace(/\D/g, "");
    const len = CODE_LEN[level];
    return len ? digits.slice(0, len) : digits;
  }

  /** نام حساب را از نقشه مرجع می‌گیرد؛ اگر نبود، از ردیف سند استفاده می‌کند */
  function getNameForCode(levelCode: string, fallback: string): string {
    return accountNameMap.get(levelCode) ?? fallback ?? "";
  }

  const fromNum = dateFrom ? dateToNum(dateFrom) : 0;
  const toNum   = dateTo   ? dateToNum(dateTo)   : 99999999;

  const db = getDb();
  const query: Record<string, unknown> = {};
  if (fiscalYear) query.fiscal_year = parseInt(fiscalYear, 10);

  const docs = await db
    .collection<JournalDocument>("journal_documents")
    .find(query)
    .toArray();

  // ─── تجمیع گردش‌ها در یک نقشه: levelCode → accumulators ────────────────
  const map = new Map<string, {
    name:          string;
    debit_before:  number;  // گردش قبل از بازه → برای مانده اول دوره
    credit_before: number;
    debit_turn:    number;  // گردش طی دوره
    credit_turn:   number;
    hasTurn:       boolean; // آیا در بازه تراکنشی داشته
  }>();

  for (const rawDoc of docs) {
    const doc = decryptDocument(serialize(rawDoc as Record<string, unknown>));
    if (doc.status === "CANCELLED") continue;

    const docDateNum = dateToNum(doc.document_date ?? "");

    for (const line of (doc.lines ?? []) as any[]) {
      const rawCode = (line.account_code ?? "") as string;
      const code = getCodeForLevel(rawCode);
      if (!code) continue;

      if (!map.has(code)) {
        map.set(code, {
          name:          getNameForCode(code, line.account_name ?? ""),
          debit_before:  0,
          credit_before: 0,
          debit_turn:    0,
          credit_turn:   0,
          hasTurn:       false,
        });
      }
      const entry = map.get(code)!;

      // اگر نام از مرجع پیدا نشد و سند نام دارد، ثبت کن
      if (!accountNameMap.has(code) && !entry.name && line.account_name) {
        entry.name = line.account_name;
      }

      const d  = (line.debit  ?? 0) as number;
      const cr = (line.credit ?? 0) as number;

      if (docDateNum >= fromNum && docDateNum <= toNum) {
        // فقط اسناد داخل بازه → گردش دوره
        entry.debit_turn  += d;
        entry.credit_turn += cr;
        entry.hasTurn = true;
      }
      // قبل یا بعد از بازه: نادیده می‌گیریم
    }
  }

  // ─── ساخت آرایه نتیجه ────────────────────────────────────────────────────
  const rows: {
    code:         string;
    name:         string;
    debit_begin:  number;
    credit_begin: number;
    debit_turn:   number;
    credit_turn:  number;
    debit_net:    number;
    credit_net:   number;
    debit_bal:    number;
    credit_bal:   number;
  }[] = [];

  for (const [code, e] of map.entries()) {
    // فقط حساب‌هایی که در بازه گردش داشتند نمایش داده می‌شوند
    if (!e.hasTurn) continue;

    // مانده اول دوره (خالص یک‌طرفه)
    const openNet      = e.debit_before - e.credit_before;
    const debit_begin  = openNet > 0 ? openNet  : 0;
    const credit_begin = openNet < 0 ? -openNet : 0;

    // تجمعی = مانده اول دوره + گردش دوره (خالص)
    const cumDebit  = e.debit_before  + e.debit_turn;
    const cumCredit = e.credit_before + e.credit_turn;
    const debit_net  = cumDebit  > cumCredit ? cumDebit  - cumCredit : 0;
    const credit_net = cumCredit > cumDebit  ? cumCredit - cumDebit  : 0;

    // مانده نهایی
    const finalNet   = cumDebit - cumCredit;
    const debit_bal  = finalNet > 0 ? finalNet  : 0;
    const credit_bal = finalNet < 0 ? -finalNet : 0;

    rows.push({
      code,
      name:         e.name,
      debit_begin,
      credit_begin,
      debit_turn:   e.debit_turn,
      credit_turn:  e.credit_turn,
      debit_net,
      credit_net,
      debit_bal,
      credit_bal,
    });
  }

  // مرتب‌سازی عددی بر اساس کد حساب
  rows.sort((a, b) => a.code.localeCompare(b.code, "en", { numeric: true }));

  // جمع کل
  const totals = rows.reduce(
    (acc, r) => ({
      debit_begin:  acc.debit_begin  + r.debit_begin,
      credit_begin: acc.credit_begin + r.credit_begin,
      debit_turn:   acc.debit_turn   + r.debit_turn,
      credit_turn:  acc.credit_turn  + r.credit_turn,
      debit_net:    acc.debit_net    + r.debit_net,
      credit_net:   acc.credit_net   + r.credit_net,
      debit_bal:    acc.debit_bal    + r.debit_bal,
      credit_bal:   acc.credit_bal   + r.credit_bal,
    }),
    { debit_begin: 0, credit_begin: 0, debit_turn: 0, credit_turn: 0,
      debit_net: 0, credit_net: 0, debit_bal: 0, credit_bal: 0 }
  );

  return c.json({ data: rows, totals, message: "تراز آزمایشی" });
});

// GET /api/ledger/account-lines — اسناد بر اساس نوع حساب (sanama xmlCode)
// Query params:
//   xmlCode: کد XML فیلد سناما (مثلاً CreditType, ExpenseArticle, ...)
//   dateFrom, dateTo: بازه تاریخی
//   fiscalYear: سال مالی (اختیاری)
router.get("/account-lines", async (c) => {
  const xmlCode    = c.req.query("xmlCode")    ?? "";
  const dateFrom   = c.req.query("dateFrom")   ?? "";
  const dateTo     = c.req.query("dateTo")     ?? "";
  const fiscalYear = c.req.query("fiscalYear") ?? "";

  const fromNum = dateFrom ? dateToNum(dateFrom) : 0;
  const toNum   = dateTo   ? dateToNum(dateTo)   : 99999999;

  const db = getDb();
  const query: Record<string, unknown> = {};
  if (fiscalYear) query.fiscal_year = parseInt(fiscalYear, 10);

  const docs = await db
    .collection<JournalDocument>("journal_documents")
    .find(query)
    .toArray();

  // نتیجه: هر ردیف = یک line از یک سند که در بازه تاریخی قرار دارد
  const rows: {
    doc_id:       string;
    doc_number:   string;
    doc_date:     string;
    account_code: string;
    account_name: string;
    debit:        number;
    credit:       number;
    balance:      number;  // مانده = debit - credit
    nature:       string;  // بدهکار / بستانکار / تراز
    description:  string;
  }[] = [];

  for (const rawDoc of docs) {
    const doc = decryptDocument(serialize(rawDoc as Record<string, unknown>));
    if (doc.status === "CANCELLED") continue;

    const docDateNum = dateToNum(doc.document_date ?? "");
    if (docDateNum < fromNum || docDateNum > toNum) continue;

    for (const line of (doc.lines ?? []) as any[]) {
      const code = (line.account_code ?? "") as string;
      if (!code) continue;

      const codeDigits = code.replace(/\D/g, "");

      // فیلتر بر اساس نوع حساب:
      // کدها همیشه به شکل کامل (معین = ۵ رقم) ذخیره می‌شوند
      // → گروه: رقم اول کد
      // → کل: ۳ رقم اول کد
      // → معین: ۵ رقم اول کد
      // → تفصیلی: بیشتر از ۵ رقم
      if (xmlCode && xmlCode !== "ALL") {
        if (xmlCode === "group"  && codeDigits.length !== 1)  continue;
        if (xmlCode === "main"   && codeDigits.length !== 3)  continue;
        if (xmlCode === "moein"  && codeDigits.length !== 5)  continue;
        if (xmlCode === "detail" && codeDigits.length <= 5)   continue;
        // برای NomineeCode و سایر xmlCode‌های سناما — فعلاً همه را برمی‌گردانیم
        // (این فیلدها در metadata سند هستند نه در account_code)
      }

      const d  = (line.debit  ?? 0) as number;
      const cr = (line.credit ?? 0) as number;
      const bal = d - cr;

      rows.push({
        doc_id:       String(doc._id ?? ""),
        doc_number:   doc.document_number ?? "",
        doc_date:     doc.document_date   ?? "",
        account_code: code,
        account_name: accountNameMap.get(code) || (line.account_name ?? ""),
        debit:        d,
        credit:       cr,
        balance:      bal,
        nature:       bal > 0 ? "بدهکار" : bal < 0 ? "بستانکار" : "تراز",
        description:  line.description ?? "",
      });
    }
  }

  rows.sort((a, b) => a.account_code.localeCompare(b.account_code, "en", { numeric: true }));

  const totals = rows.reduce(
    (acc, r) => ({ debit: acc.debit + r.debit, credit: acc.credit + r.credit, balance: acc.balance + r.balance }),
    { debit: 0, credit: 0, balance: 0 }
  );

  return c.json({ data: rows, totals, message: "مرور حساب‌ها" });
});

// GET /api/ledger/persons-debug — بررسی ساختار واقعی اسناد برای عیب‌یابی
router.get("/persons-debug", async (c) => {
  const db = getDb();
  const docs = await db.collection<JournalDocument>("journal_documents").find().limit(5).toArray();
  const result = docs.map((rawDoc) => {
    const doc = decryptDocument(serialize(rawDoc as Record<string, unknown>));
    return {
      id:      doc._id,
      status:  doc.status,
      rowCount: (doc.rawRows ?? []).length,
      sampleRows: (doc.rawRows ?? []).slice(0, 3).map((r: any) => ({
        subAccount:    r.subAccount,
        debit:         r.debit,
        credit:        r.credit,
        sanamaFields:  r.sanamaFields,
      })),
    };
  });
  return c.json({ data: result });
});

// GET /api/ledger/persons-balance — مانده هر شخص بر اساس sanamaFields.sanama_21
// برای هر شخص ثبت‌شده در collection persons،
// تمام ردیف‌های اسناد که sanama_21 آن‌ها با nomineeCode شخص تطابق دارد را
// جمع‌آوری و به صورت خلاصه بدهکار/بستانکار/مانده برمی‌گرداند.
router.get("/persons-balance", async (c) => {
  const dateFrom   = c.req.query("dateFrom")   ?? "";
  const dateTo     = c.req.query("dateTo")     ?? "";
  const fiscalYear = c.req.query("fiscalYear") ?? "";

  function dateToNum(d: string): number {
    if (!d) return 0;
    const persian = ["۰","۱","۲","۳","۴","۵","۶","۷","۸","۹"];
    const arabic  = ["٠","١","٢","٣","٤","٥","٦","٧","٨","٩"];
    let s = d;
    for (let i = 0; i < 10; i++) {
      s = s.replace(new RegExp(persian[i], "g"), String(i));
      s = s.replace(new RegExp(arabic[i],  "g"), String(i));
    }
    const parts = s.split(/[\/\-\.]/);
    if (parts.length === 3) {
      return parseInt(`${parts[0].padStart(4,"0")}${parts[1].padStart(2,"0")}${parts[2].padStart(2,"0")}`, 10) || 0;
    }
    return parseInt(s.replace(/[^\d]/g, ""), 10) || 0;
  }

  const fromNum = dateFrom ? dateToNum(dateFrom) : 0;
  const toNum   = dateTo   ? dateToNum(dateTo)   : 99999999;

  const db = getDb();

  // ── بارگذاری همه اشخاص ──────────────────────────────────────────────────
  const persons = await db.collection("persons").find().toArray() as any[];

  // ساخت نقشه nomineeCode → نام شخص
  const personNameMap = new Map<string, string>();
  for (const p of persons) {
    if (!p.nomineeCode) continue;
    // نام شخص: title برای حقوقی، firstName+lastName برای حقیقی
    const name = p.title || [p.firstName, p.lastName].filter(Boolean).join(" ") || p.nomineeCode;
    personNameMap.set(String(p.nomineeCode), name);
  }

  // ── بارگذاری اسناد ──────────────────────────────────────────────────────
  const query: Record<string, unknown> = {};
  if (fiscalYear) query.fiscal_year = parseInt(fiscalYear, 10);

  const docs = await db
    .collection<JournalDocument>("journal_documents")
    .find(query)
    .toArray();

  // ── تبدیل رشته فارسی/عربی/کاما‌دار به عدد ─────────────────────────────
  function parseFaNum(v: unknown): number {
    if (!v) return 0;
    const persian = ["۰","۱","۲","۳","۴","۵","۶","۷","۸","۹"];
    const arabic  = ["٠","١","٢","٣","٤","٥","٦","٧","٨","٩"];
    let s = String(v).replace(/,|،/g, "");
    for (let i = 0; i < 10; i++) {
      s = s.replace(new RegExp(persian[i], "g"), String(i));
      s = s.replace(new RegExp(arabic[i],  "g"), String(i));
    }
    return parseInt(s.replace(/[^0-9]/g, ""), 10) || 0;
  }

  // نقشه تجمیع: nomineeCode → { debit, credit }
  const map = new Map<string, { debit: number; credit: number }>();

  for (const rawDoc of docs) {
    const doc = decryptDocument(serialize(rawDoc as Record<string, unknown>));
    if (doc.status === "CANCELLED") continue;

    const docDateNum = dateToNum(doc.document_date ?? "");
    if (docDateNum < fromNum || docDateNum > toNum) continue;

    // rawRows: آرایه ردیف‌های سند به شکل رابط کاربری (شامل sanamaFields)
    const rawRows: any[] = doc.rawRows ?? [];

    for (const row of rawRows) {
      // NomineeCode در sanamaFields.sanama_21 ذخیره شده
      // مقدار: رشته ساده برابر nomineeCode (از SearchableSelect)
      const rawNominee = row.sanamaFields?.sanama_21;
      if (!rawNominee) continue;

      let nomineeCode: string;
      if (typeof rawNominee === "object" && rawNominee !== null) {
        nomineeCode = String(rawNominee.nomineeCode ?? rawNominee.code ?? rawNominee.id ?? rawNominee.value ?? "");
      } else {
        nomineeCode = String(rawNominee).trim();
      }

      if (!nomineeCode) continue;

      const d  = parseFaNum(row.debit);
      const cr = parseFaNum(row.credit);
      if (d === 0 && cr === 0) continue;

      if (!map.has(nomineeCode)) map.set(nomineeCode, { debit: 0, credit: 0 });
      const entry = map.get(nomineeCode)!;
      entry.debit  += d;
      entry.credit += cr;
    }
  }

  // ── ساخت پاسخ ────────────────────────────────────────────────────────────
  const rows: {
    nominee_code:  string;
    person_name:   string;
    debit:         number;
    credit:        number;
    balance:       number;
    nature:        string;
  }[] = [];

  // اشخاصی که در اسناد ظاهر شدند
  for (const [nomineeCode, e] of map.entries()) {
    const bal = e.debit - e.credit;
    rows.push({
      nominee_code: nomineeCode,
      person_name:  personNameMap.get(nomineeCode) ?? nomineeCode,
      debit:        e.debit,
      credit:       e.credit,
      balance:      bal,
      nature:       bal > 0 ? "بدهکار" : bal < 0 ? "بستانکار" : "تراز",
    });
  }

  // اشخاص ثبت‌شده که در هیچ سندی نیستند (مانده صفر)
  for (const p of persons) {
    if (!p.nomineeCode) continue;
    const code = String(p.nomineeCode);
    if (!map.has(code)) {
      const name = p.title || [p.firstName, p.lastName].filter(Boolean).join(" ") || code;
      rows.push({
        nominee_code: code,
        person_name:  name,
        debit:        0,
        credit:       0,
        balance:      0,
        nature:       "تراز",
      });
    }
  }

  rows.sort((a, b) => a.nominee_code.localeCompare(b.nominee_code, "en", { numeric: true }));

  const totals = rows.reduce(
    (acc, r) => ({ debit: acc.debit + r.debit, credit: acc.credit + r.credit, balance: acc.balance + r.balance }),
    { debit: 0, credit: 0, balance: 0 }
  );

  return c.json({ data: rows, totals, message: "مانده اشخاص" });
});

// GET /api/ledger/grouped-lines — خلاصه حساب بر اساس سطح (group | main | person)
// برای هر کد، مجموع بدهکار و بستانکار ردیف‌های آن گروه‌بندی می‌شود
// Query params:
//   level: group | main | person
//   dateFrom, dateTo: بازه تاریخی (اختیاری)
//   fiscalYear: سال مالی (اختیاری)
router.get("/grouped-lines", async (c) => {
  const level      = (c.req.query("level")      ?? "main") as "group" | "main" | "person";
  const dateFrom   = c.req.query("dateFrom")   ?? "";
  const dateTo     = c.req.query("dateTo")     ?? "";
  const fiscalYear = c.req.query("fiscalYear") ?? "";

  function dateToNum(d: string): number {
    if (!d) return 0;
    const persian = ["۰","۱","۲","۳","۴","۵","۶","۷","۸","۹"];
    const arabic  = ["٠","١","٢","٣","٤","٥","٦","٧","٨","٩"];
    let s = d;
    for (let i = 0; i < 10; i++) {
      s = s.replace(new RegExp(persian[i], "g"), String(i));
      s = s.replace(new RegExp(arabic[i],  "g"), String(i));
    }
    const parts = s.split(/[\/\-\.]/);
    if (parts.length === 3) {
      return parseInt(`${parts[0].padStart(4,"0")}${parts[1].padStart(2,"0")}${parts[2].padStart(2,"0")}`, 10) || 0;
    }
    return parseInt(s.replace(/[^\d]/g, ""), 10) || 0;
  }

  const fromNum = dateFrom ? dateToNum(dateFrom) : 0;
  const toNum   = dateTo   ? dateToNum(dateTo)   : 99999999;

  const db = getDb();
  const query: Record<string, unknown> = {};
  if (fiscalYear) query.fiscal_year = parseInt(fiscalYear, 10);

  const docs = await db
    .collection<JournalDocument>("journal_documents")
    .find(query)
    .toArray();

  // بارگذاری اشخاص برای سطح person
  const personMap = new Map<string, string>(); // nomineeCode → title
  if (level === "person") {
    const persons = await db.collection("persons").find().toArray();
    for (const p of persons as any[]) {
      if (p.nomineeCode) personMap.set(String(p.nomineeCode), p.title ?? ([p.firstName, p.lastName].filter(Boolean).join(" ")) ?? "");
    }
  }

  // نقشه تجمیع: key → { debit, credit, name, code }
  const map = new Map<string, { code: string; name: string; debit: number; credit: number }>();

  for (const rawDoc of docs) {
    const doc = decryptDocument(serialize(rawDoc as Record<string, unknown>));
    if (doc.status === "CANCELLED") continue;

    const docDateNum = dateToNum(doc.document_date ?? "");
    if (docDateNum < fromNum || docDateNum > toNum) continue;

    for (const line of (doc.lines ?? []) as any[]) {
      const rawCode = (line.account_code ?? "") as string;
      const digits  = rawCode.replace(/\D/g, "");
      if (!digits) continue;

      let key  = "";
      let name = "";

      if (level === "group") {
        // رقم اول = گروه حساب
        key  = digits.slice(0, 1);
        name = accountNameMap.get(key) ?? (line.account_name ?? "").slice(0, 20);
      } else if (level === "main") {
        // ۳ رقم اول = حساب کل
        key  = digits.slice(0, 3);
        name = accountNameMap.get(key) ?? (line.account_name ?? "").slice(0, 30);
      } else if (level === "person") {
        // برای اشخاص: کد NomineeCode از ردیف سند می‌آید
        // در اسناد دستی NomineeCode به عنوان یک فیلد روی line یا metadata سند ثبت می‌شود
        // فعلاً کدهای تفصیلی (بیش از ۵ رقم) را به عنوان شناسه شخص در نظر می‌گیریم
        if (digits.length <= 5) continue; // فقط تفصیلی
        key  = digits;
        name = personMap.get(digits) ?? accountNameMap.get(rawCode) ?? (line.account_name ?? "");
      }

      if (!key) continue;

      if (!map.has(key)) {
        map.set(key, { code: key, name, debit: 0, credit: 0 });
      }
      const entry = map.get(key)!;
      // اگر نام بهتری پیدا شد، به‌روز کن
      if (!entry.name && name) entry.name = name;
      entry.debit  += (line.debit  ?? 0) as number;
      entry.credit += (line.credit ?? 0) as number;
    }
  }

  // ساخت آرایه نتیجه
  type GroupedRow = {
    account_code: string;
    account_name: string;
    debit:        number;
    credit:       number;
    balance:      number;
    nature:       string;
  };

  const rows: GroupedRow[] = [];

  for (const [, e] of map.entries()) {
    const bal = e.debit - e.credit;
    rows.push({
      account_code: e.code,
      account_name: e.name,
      debit:        e.debit,
      credit:       e.credit,
      balance:      bal,
      nature:       bal > 0 ? "بدهکار" : bal < 0 ? "بستانکار" : "تراز",
    });
  }

  rows.sort((a, b) => a.account_code.localeCompare(b.account_code, "en", { numeric: true }));

  const totals = rows.reduce(
    (acc, r) => ({ debit: acc.debit + r.debit, credit: acc.credit + r.credit, balance: acc.balance + r.balance }),
    { debit: 0, credit: 0, balance: 0 }
  );

  return c.json({ data: rows, totals, message: `مرور حساب — سطح ${level}` });
});

export default router;


