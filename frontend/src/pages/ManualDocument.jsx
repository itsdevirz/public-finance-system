import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Plus, Trash2, Save, Printer, RotateCcw,
  FileText, CheckCircle2, Ban, X, AlertCircle
} from "lucide-react";
import api from "@/api";
import { encrypt } from "@/lib/crypto";
import { PersianDatePicker } from "@/components/ui/persian-date-picker";
import sanamaCodes from "@/data/sanamaCodes.json";
import subAccountTitles from "@/data/subAccountTitles.json";
import sanamaRequirements from "@/data/sanamaRequirements.json";

// ---- helpers ----
const allGroups = sanamaCodes.groups.map((g) => ({ code: g.code, title: g.title, accounts: g.accounts }));

function getSubAccountTitle(rowNum) {
  return subAccountTitles.find((t) => t.row === rowNum);
}

function getRequiredRows(subAccountCode) {
  return sanamaRequirements[subAccountCode]?.requiredRows ?? [];
}

function needsSanamaFields(subAccountCode) {
  return getRequiredRows(subAccountCode).length > 0;
}

function getAccounts(groupCode) {
  const g = allGroups.find((x) => x.code === groupCode);
  return g ? g.accounts : [];
}

function getSubAccounts(groupCode, accountCode) {
  const accounts = getAccounts(groupCode);
  const a = accounts.find((x) => x.code === accountCode);
  return a ? (a.children || []) : [];
}

function toEnglishDigits(str) {
  if (str == null) return "";
  const persianDigits = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
  const arabicDigits  = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];
  let clean = str.toString().replace(/,/g, "").replace(/،/g, "");
  for (let i = 0; i < 10; i++) {
    clean = clean.replace(persianDigits[i], i).replace(arabicDigits[i], i);
  }
  return clean.replace(/[^0-9-]/g, "");
}

function formatNumber(val) {
  const clean = toEnglishDigits(val);
  const n = parseInt(clean, 10);
  if (isNaN(n)) return "";
  return n.toLocaleString("fa-IR");
}

function parseNumber(str) {
  const clean = toEnglishDigits(str);
  return parseInt(clean, 10) || 0;
}

const EMPTY_ROW = {
  id: Date.now(),
  group: "",
  account: "",
  subAccount: "",
  debit: "",
  credit: "",
  checkDate: "",
  checkNo: "",
  createYear: "",
  personFlag: false,
  checkFlag: false,
  desc: "",
  sanamaFields: {},
};

// ---- آماده‌سازی options برای SearchableSelect ----
const groupOptions = allGroups.map((g) => ({ value: g.code, label: `${g.code} – ${g.title}` }));

function accountOptions(groupCode) {
  return getAccounts(groupCode).map((a) => ({ value: a.code, label: `${a.code} – ${a.title}` }));
}

function subAccountOptions(groupCode, accountCode) {
  return getSubAccounts(groupCode, accountCode).map((s) => ({ value: s.code, label: `${s.code} – ${s.title}` }));
}

// ---- ردیف جدول ----
function DocRow({ row, idx, onChange, onDelete, isActive, onActivate }) {
  const nature = useMemo(() => {
    if (!row.group || !row.account || !row.subAccount) return null;
    const subs = getSubAccounts(row.group, row.account);
    const found = subs.find((s) => s.code === row.subAccount);
    return found ? found.nature : null;
  }, [row.group, row.account, row.subAccount]);

  function set(field, val) {
    onChange({ ...row, [field]: val });
  }

  function setGroup(val) {
    onChange({ ...row, group: val, account: "", subAccount: "", debit: "", credit: "", sanamaFields: {} });
  }

  function setAccount(val) {
    onChange({ ...row, account: val, subAccount: "", debit: "", credit: "", sanamaFields: {} });
  }

  function setSubAccount(val) {
    const subs = getSubAccounts(row.group, row.account);
    const sub = subs.find((s) => s.code === val);
    const newNature = sub ? sub.nature : null;
    onChange({
      ...row,
      subAccount: val,
      sanamaFields: {},
      debit: newNature === "credit" ? "" : row.debit,
      credit: newNature === "debit" ? "" : row.credit,
    });
  }

  const cellCls = "border-l last:border-l-0 px-2 py-1";
  const inputCls = "h-8 text-sm rounded border-0 bg-transparent focus:bg-white focus:border focus:border-primary w-full px-1.5";

  return (
    <tr
      className={`border-b transition-colors text-xs ${isActive ? "bg-primary/5 ring-1 ring-inset ring-primary/20" : "hover:bg-blue-50/40"}`}
      onClick={onActivate}
    >
      <td className={`${cellCls} text-center text-muted-foreground w-10`}>{idx + 1}</td>

      {/* گروه */}
      <td className={`${cellCls} w-36`}>
        <SearchableSelect
          value={row.group}
          onChange={setGroup}
          options={groupOptions}
          placeholder="گروه..."
        />
      </td>

      {/* کل */}
      <td className={`${cellCls} w-44`}>
        <SearchableSelect
          value={row.account}
          onChange={setAccount}
          options={accountOptions(row.group)}
          placeholder="کل..."
          disabled={!row.group}
        />
      </td>

      {/* معین */}
      <td className={`${cellCls} w-56`}>
        <SearchableSelect
          value={row.subAccount}
          onChange={setSubAccount}
          options={subAccountOptions(row.group, row.account)}
          placeholder="معین..."
          disabled={!row.account}
        />
      </td>

      {/* مبلغ بدهکار */}
      <td className={`${cellCls} w-36`}>
        <input
          className={`${inputCls} text-blue-700 disabled:opacity-30 disabled:cursor-not-allowed`}
          value={row.debit}
          onChange={(e) => set("debit", e.target.value)}
          onBlur={(e) => set("debit", formatNumber(e.target.value))}
          disabled={nature === "credit"}
          placeholder={nature === "credit" ? "—" : ""}
        />
      </td>

      {/* مبلغ بستانکار */}
      <td className={`${cellCls} w-36`}>
        <input
          className={`${inputCls} text-rose-700 disabled:opacity-30 disabled:cursor-not-allowed`}
          value={row.credit}
          onChange={(e) => set("credit", e.target.value)}
          onBlur={(e) => set("credit", formatNumber(e.target.value))}
          disabled={nature === "debit"}
          placeholder={nature === "debit" ? "—" : ""}
        />
      </td>

      {/* حذف */}
      <td className={`${cellCls} w-10 text-center`}>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="text-muted-foreground hover:text-rose-500 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </td>
    </tr>
  );
}

// ---- SanamaField: رندر یک فیلد سناما بر اساس نوع ردیف ----
function SanamaField({ rowDef, value, onChange, optional }) {
  const inputCls = "h-9 text-xs rounded-lg border border-input bg-background/60 px-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30 w-full transition-all";
  const labelCls = "text-[11px] text-muted-foreground shrink-0 w-44";

  const placeholder = optional ? `${rowDef.default ?? "0"}` : "انتخاب کنید...";

  // ردیف‌های با values (dropdown ساده)
  if (rowDef.values) {
    const opts = rowDef.values.map((v) => ({ value: v.type, label: v.title }));
    return (
      <div className="flex items-center gap-2">
        <Label className={labelCls}>{rowDef.title}</Label>
        <div className="flex-1">
          <SearchableSelect
            value={value ?? ""}
            onChange={(v) => onChange(v || (rowDef.default ?? ""))}
            options={opts}
            placeholder={placeholder}
            searchable={opts.length > 8}
          />
        </div>
      </div>
    );
  }

  // ردیف‌های با groups (dropdown گروه‌بندی‌شده)
  if (rowDef.groups) {
    const opts = rowDef.groups.flatMap((g) =>
      g.values.map((v) => ({ value: v.type, label: v.title, group: g.title }))
    );
    return (
      <div className="flex items-center gap-2">
        <Label className={labelCls}>{rowDef.title}</Label>
        <div className="flex-1">
          <SearchableSelect
            value={value ?? ""}
            onChange={(v) => onChange(v || (rowDef.default ?? ""))}
            options={opts}
            placeholder={placeholder}
          />
        </div>
      </div>
    );
  }

  // ردیف‌های با default (input عددی — اجباری)
  if ("default" in rowDef) {
    return (
      <div className="flex items-center gap-2">
        <Label className={labelCls}>{rowDef.title}</Label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          className={inputCls}
          placeholder="عدد وارد کنید..."
          value={value ?? ""}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, "");
            onChange(val);
          }}
          dir="ltr"
        />
      </div>
    );
  }

  // ردیف ۲۱ اشخاص — input متنی
  if (rowDef.types) {
    return (
      <div className="flex items-center gap-2">
        <Label className={labelCls}>{rowDef.title}{optional && <span className="text-[10px] text-muted-foreground/60 mr-1">(اختیاری)</span>}</Label>
        <input
          type="text"
          className={inputCls}
          placeholder="کد اشخاص را وارد کنید"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          dir="ltr"
        />
      </div>
    );
  }

  return null;
}

// فیلدهایی که اختیاری‌اند (default دارند)
const OPTIONAL_ROWS = new Set();

function SanamaExtraFields({ row, onSanamaChange }) {
  const requiredRows = getRequiredRows(row.subAccount);
  if (!requiredRows.length) return null;

  return (
    <div className="border-t bg-amber-50/40 px-3 py-3">
      <p className="text-xs font-medium text-amber-800 mb-3">
        الزامات سناما — معین {row.subAccount}
      </p>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {requiredRows.map((rowNum) => {
          const rowDef = getSubAccountTitle(rowNum);
          if (!rowDef) return null;
          const optional = OPTIONAL_ROWS.has(rowNum);
          const fieldKey = `sanama_${rowNum}`;
          const value = row.sanamaFields?.[fieldKey];
          return (
            <SanamaField
              key={rowNum}
              rowDef={rowDef}
              value={value}
              optional={optional}
              onChange={(val) => onSanamaChange(fieldKey, val)}
            />
          );
        })}
      </div>
    </div>
  );
}

// ---- component اصلی ----
export default function ManualDocument() {
  const today = new Date().toLocaleDateString("fa-IR").replace(/\//g, "/");

  const [header, setHeader] = useState({
    fiscalYear: "",
    docNo: "",
    docDate: today,
    docType: "موقت",
    access: "عادی",
    desc: "",
    letterNo: "",
    letterDate: "",
    status: "صدور سند",
  });

  const [fiscalYears, setFiscalYears] = useState([]);

  useEffect(() => {
    async function loadFiscalYears() {
      try {
        const res = await api.get("/api/fiscal-years");
        if (res.data?.success) {
          const list = res.data.data || [];
          setFiscalYears(list);
          if (list.length > 0) {
            setHeader(h => {
              if (!h.fiscalYear) {
                return { ...h, fiscalYear: String(list[0].year) };
              }
              return h;
            });
          }
        }
      } catch (err) {
        console.error("Error loading fiscal years:", err);
      }
    }
    loadFiscalYears();
  }, []);

  const [rows, setRows] = useState([{ ...EMPTY_ROW, id: 1 }]);
  const [activeRowId, setActiveRowId] = useState(1);

  const activeRow = rows.find((r) => r.id === activeRowId) ?? rows[0];
  const showSanamaFields = needsSanamaFields(activeRow?.subAccount);

  const location = useLocation();
  const navigate = useNavigate();
  const docId = location.state?.docId || new URLSearchParams(location.search).get("id");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!docId) return;

    let isMounted = true;
    async function fetchDoc() {
      setLoading(true);
      try {
        const res = await api.get(`/api/documents/${docId}`);
        if (!isMounted) return;
        const doc = res.data.data;
        if (doc) {
          setHeader({
            fiscalYear: String(doc.fiscal_year || "1404"),
            docNo: doc.document_number || "",
            docDate: doc.document_date || today,
            docType: doc.rawHeader?.docType || 
                     (doc.document_type === "CLOSING" ? "اختتامیه" :
                      doc.document_type === "TRANSFER" ? "دائم" : "موقت"),
            access: doc.rawHeader?.access || "عادی",
            desc: doc.description || "",
            letterNo: doc.reference_number || "",
            letterDate: doc.rawHeader?.letterDate || "",
            status: doc.rawHeader?.status || (doc.status === "CONFIRMED" ? "پرداخت و دریافت" : "صدور سند"),
          });

          if (doc.rawRows && doc.rawRows.length > 0) {
            const sanitizedRows = doc.rawRows.map(r => {
              const code = r.subAccount || "";
              const group = code.charAt(0) || "";
              const account = group === "9" ? code.substring(0, 2) : code.substring(0, 3);
              return {
                ...r,
                group,
                account
              };
            });
            setRows(sanitizedRows);
            if (sanitizedRows[0]) setActiveRowId(sanitizedRows[0].id);
          } else if (doc.lines && doc.lines.length > 0) {
            const parsed = doc.lines.map((l, i) => {
              const code = l.account_code || "";
              const group = code.charAt(0) || "";
              const account = group === "9" ? code.substring(0, 2) : code.substring(0, 3);
              return {
                ...EMPTY_ROW,
                id: i + 1,
                group,
                account,
                subAccount: code,
                debit: l.debit ? formatNumber(l.debit) : "",
                credit: l.credit ? formatNumber(l.credit) : "",
                desc: l.description || "",
              };
            });
            setRows(parsed);
            if (parsed[0]) setActiveRowId(parsed[0].id);
          }
        }
      } catch (err) {
        console.error("Error loading document:", err);
        setMessage({ type: "error", text: "خطا در بارگذاری اطلاعات سند از سرور." });
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchDoc();
    return () => { isMounted = false; };
  }, [docId]);

  async function handleSave() {
    if (diff !== 0) {
      setMessage({ type: "error", text: "سند تراز نیست! اختلاف بدهکار و بستانکار باید صفر باشد." });
      return;
    }

    const validRows = rows.filter(r => r.group && r.account && r.subAccount);
    if (validRows.length === 0) {
      setMessage({ type: "error", text: "حداقل یک ردیف کامل (گروه، کل، معین) الزامی است." });
      return;
    }

    // بررسی الزامات سناما برای تمامی ردیف‌ها
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (r.group && r.account && r.subAccount) {
        const requiredRows = getRequiredRows(r.subAccount);
        for (const rowNum of requiredRows) {
          const rowDef = getSubAccountTitle(rowNum);
          const fieldKey = `sanama_${rowNum}`;
          const isOptional = OPTIONAL_ROWS.has(rowNum);
          const val = r.sanamaFields?.[fieldKey];
          if (!isOptional && (!val || String(val).trim() === "")) {
            setMessage({
              type: "error",
              text: `در ردیف ${i + 1}، پر کردن فیلد الزامی سناما «${rowDef?.title ?? `ردیف ${rowNum}`}» برای معین ${r.subAccount} اجباری است.`
            });
            return;
          }
        }
      }
    }

    setLoading(true);
    setMessage(null);

    try {
      const sensitiveState = {
        header,
        rows: rows.map(r => ({
          ...r,
          account_name: getSubAccounts(r.group, r.account).find(s => s.code === r.subAccount)?.title || "",
        })),
      };

      const encryptedHex = await encrypt(JSON.stringify(sensitiveState));

      let docTypeMapped = "GENERAL_PAYMENT";
      if (header.docType === "افتتاحیه" || header.docType === "اختتامیه") {
        docTypeMapped = "CLOSING";
      } else if (header.docType === "اصلاحی" || header.docType === "دائم") {
        docTypeMapped = "TRANSFER";
      }

      let statusMapped = "DRAFT";
      if (header.status === "رد شده") {
        statusMapped = "CANCELLED";
      } else if (["پرداخت و دریافت", "دفترداری", "اعتمادات", "بایگانی"].includes(header.status)) {
        statusMapped = "CONFIRMED";
      }

      const payload = {
        document_type: docTypeMapped,
        fiscal_year: Number(header.fiscalYear) || 1404,
        status: statusMapped,
        ciphertext: encryptedHex,
      };

      const res = docId 
        ? await api.put(`/api/documents/${docId}`, payload)
        : await api.post("/api/documents", payload);
      
      setMessage({ 
        type: "success", 
        text: docId 
          ? `تغییرات سند شماره ${res.data.data.document_number} با موفقیت ذخیره شد.`
          : `سند با شماره ${res.data.data.document_number} با موفقیت ثبت شد و به صورت رمزنگاری‌شده ذخیره گردید.` 
      });
      
      if (!docId && res.data.data.document_number) {
        setH("docNo", res.data.data.document_number);
      }
    } catch (err) {
      console.error("Save error:", err);
      setMessage({ type: "error", text: err.response?.data?.message || "خطا در ثبت سند در سرور. اتصال را بررسی کنید." });
    } finally {
      setLoading(false);
    }
  }

  function handleNew() {
    const firstYear = fiscalYears.length > 0 ? String(fiscalYears[0].year) : "";
    setHeader({
      fiscalYear: firstYear,
      docNo: "",
      docDate: today,
      docType: "موقت",
      access: "عادی",
      desc: "",
      letterNo: "",
      letterDate: "",
      status: "صدور سند",
    });
    const newId = Date.now();
    setRows([{ ...EMPTY_ROW, id: newId }]);
    setActiveRowId(newId);
    setMessage(null);
    if (docId) {
      navigate("/document-setup/manual-doc", { replace: true });
    }
  }

  function setH(k, v) { setHeader((p) => ({ ...p, [k]: v })); }

  function addRow() {
    const id = Date.now();
    setRows((prev) => [...prev, { ...EMPTY_ROW, id }]);
    setActiveRowId(id);
  }

  function updateRow(id, updated) {
    setRows((prev) => prev.map((r) => (r.id === id ? updated : r)));
  }

  function deleteRow(id) {
    setRows((prev) => {
      const next = prev.filter((r) => r.id !== id);
      if (activeRowId === id && next.length) setActiveRowId(next[0].id);
      return next.length ? next : [{ ...EMPTY_ROW, id: Date.now() }];
    });
  }

  function handleSanamaChange(rowId, fieldKey, val) {
    setRows((prev) =>
      prev.map((r) =>
        r.id === rowId
          ? { ...r, sanamaFields: { ...r.sanamaFields, [fieldKey]: val } }
          : r
      )
    );
  }

  const totalDebit = rows.reduce((s, r) => s + parseNumber(r.debit), 0);
  const totalCredit = rows.reduce((s, r) => s + parseNumber(r.credit), 0);
  const diff = totalDebit - totalCredit;

  const statusColors = {
    "صدور سند": "bg-green-500",
    "در جریان": "bg-amber-400",
    "رد شده": "bg-rose-500",
    "پرداخت و دریافت": "bg-blue-500",
    "دفترداری": "bg-purple-500",
    "اعتمادات": "bg-indigo-500",
    "بایگانی": "bg-gray-400",
    "حسابداری": "bg-teal-500",
  };

  const inputCls = "h-8 text-xs rounded-md border bg-white focus:border-primary";
  const labelCls = "text-xs text-muted-foreground whitespace-nowrap";

  return (
    <PageShell>
      <PageHeader 
        title={docId ? "ویرایش سند مالی" : "صدور سند دستی"} 
        description={docId ? `ویرایش سند شماره ${header.docNo}` : "ثبت و ویرایش اسناد حسابداری"} 
      />

      {message && (
        <div
          className={`mb-4 flex items-center gap-2 rounded-xl border px-4 py-3 text-xs transition-all ${
            message.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
          dir="rtl"
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
          ) : (
            <Ban className="h-4 w-4 shrink-0 text-rose-600" />
          )}
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="mr-auto hover:opacity-80 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ===== هدر سند ===== */}
      <div>
        <Card className="mb-3">
          <CardContent className="p-3">
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 md:grid-cols-4">
              {/* ستون ۱ */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className={labelCls}>دوره مالی</Label>
                  <div className="flex-1">
                    <SearchableSelect
                      value={header.fiscalYear}
                      onChange={(v) => setH("fiscalYear", v || "")}
                      options={fiscalYears.map((fy) => ({ value: String(fy.year), label: `${fy.year}` }))}
                      placeholder="دوره مالی..."
                      searchable={false}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label className={labelCls}>شماره سند</Label>
                  <Input className={inputCls} value={header.docNo} onChange={(e) => setH("docNo", e.target.value)} />
                </div>
                <div className="flex items-center gap-2">
                  <Label className={labelCls}>تاریخ سند</Label>
                  <PersianDatePicker className="h-8 text-xs rounded-md border bg-white focus:border-primary" value={header.docDate} onChange={(e) => setH("docDate", e.target.value)} />
                </div>
              </div>

              {/* ستون ۲ */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className={labelCls}>نوع سند</Label>
                  <div className="flex-1">
                    <SearchableSelect
                      value={header.docType}
                      onChange={(v) => setH("docType", v || "موقت")}
                      options={["موقت", "دائم", "اصلاحی", "افتتاحیه", "اختتامیه"].map((t) => ({ value: t, label: t }))}
                      placeholder="نوع سند..."
                      searchable={false}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label className={labelCls}>دسترسی</Label>
                  <div className="flex-1">
                    <SearchableSelect
                      value={header.access}
                      onChange={(v) => setH("access", v || "عادی")}
                      options={["عادی", "محرمانه"].map((t) => ({ value: t, label: t }))}
                      placeholder="دسترسی..."
                      searchable={false}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label className={labelCls}>شماره نامه</Label>
                  <Input className={inputCls} value={header.letterNo} onChange={(e) => setH("letterNo", e.target.value)} />
                </div>
                <div className="flex items-center gap-2">
                  <Label className={labelCls}>تاریخ نامه</Label>
                  <PersianDatePicker className="h-8 text-xs rounded-md border bg-white focus:border-primary" value={header.letterDate} onChange={(e) => setH("letterDate", e.target.value)} />
                </div>
              </div>

              {/* ستون ۳ - وضعیت */}
              <div className="col-span-2 flex flex-col gap-2">
                <Label className={labelCls}>شرح سند</Label>
                <Input
                  className="h-8 text-xs rounded-md border bg-white"
                  value={header.desc}
                  onChange={(e) => setH("desc", e.target.value)}
                  placeholder="شرح سند را وارد کنید..."
                />
                <div className="mt-1">
                  <Label className={`${labelCls} mb-1 block`}>وضعیت سند</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.keys(statusColors).map((s) => (
                      <button
                        key={s}
                        onClick={() => setH("status", s)}
                        className={`rounded-full px-2.5 py-1 text-[10px] font-medium text-white transition-all ${
                          header.status === s ? statusColors[s] + " ring-2 ring-offset-1 ring-current" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===== جدول ردیف‌های سند ===== */}
      <div>
        <Card className="mb-3">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse min-w-[1100px]" dir="rtl">
                <thead>
                  <tr className="bg-muted/60 border-b text-muted-foreground text-xs">
                    <th className="px-2 py-2.5 text-center w-10">#</th>
                    <th className="px-2 py-2.5 text-right w-36">گروه</th>
                    <th className="px-2 py-2.5 text-right w-44">کل</th>
                    <th className="px-2 py-2.5 text-right w-56">معین</th>
                    <th className="px-2 py-2.5 text-right w-36 text-blue-600">بدهکار</th>
                    <th className="px-2 py-2.5 text-right w-36 text-rose-600">بستانکار</th>
                    <th className="px-2 py-2.5 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <DocRow
                      key={row.id}
                      row={row}
                      idx={idx}
                      isActive={row.id === activeRowId}
                      onActivate={() => setActiveRowId(row.id)}
                      onChange={(updated) => updateRow(row.id, updated)}
                      onDelete={() => deleteRow(row.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {showSanamaFields && (
              <SanamaExtraFields
                row={activeRow}
                onSanamaChange={(fieldKey, val) => handleSanamaChange(activeRowId, fieldKey, val)}
              />
            )}

            {/* جمع و دکمه اضافه */}
            <div className="flex items-center justify-between border-t px-3 py-2 bg-muted/20">
              <Button size="sm" variant="outline" className="gap-1 h-7 text-xs" onClick={addRow}>
                <Plus className="h-3.5 w-3.5" />
                درج سطر
              </Button>
              <div className="flex items-center gap-6 text-xs">
                <span className="text-muted-foreground">جمع بدهکار: <span className="font-semibold text-blue-700">{totalDebit.toLocaleString("fa-IR")}</span></span>
                <span className="text-muted-foreground">جمع بستانکار: <span className="font-semibold text-rose-700">{totalCredit.toLocaleString("fa-IR")}</span></span>
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${diff === 0 ? "text-green-600" : "text-rose-600 flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-lg"}`}>
                    {diff === 0 ? (
                      `تراز (اختلاف: ۰)`
                    ) : (
                      <>
                        <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
                        <span>سند ناتراز است! (اختلاف: {Math.abs(diff).toLocaleString("fa-IR")} ریال) - مبالغ را اصلاح کنید</span>
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===== پنل پایین ===== */}
      <div>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-muted-foreground mb-4">اطلاعات کدینگ انتخابی</p>

            {/* فیلدهای کدینگ — چهار ستون */}
            <div className="grid grid-cols-2 gap-x-10 gap-y-2.5 md:grid-cols-4" dir="rtl">
              {[
                { label: "گروه",  value: activeRow?.group      || "—" },
                { label: "کل",    value: activeRow?.account    || "—" },
                { label: "معین",  value: activeRow?.subAccount || "—" },
                {
                  label: "ماهیت",
                  value: (() => {
                    const row = activeRow;
                    if (!row?.subAccount) return "—";
                    const subs = getSubAccounts(row.group, row.account);
                    const nature = subs.find((s) => s.code === row.subAccount)?.nature;
                    return nature === "debit"  ? "بدهکار"  :
                           nature === "credit" ? "بستانکار":
                           nature === "both"   ? "هر دو"   : "—";
                  })(),
                },
                ...(needsSanamaFields(activeRow?.subAccount)
                  ? getRequiredRows(activeRow.subAccount).map((rowNum) => {
                      const rowDef   = getSubAccountTitle(rowNum);
                      const fieldKey = `sanama_${rowNum}`;
                      const val      = activeRow?.sanamaFields?.[fieldKey];
                      const defVal   = rowDef?.default ?? "0";
                      return {
                        label: rowDef?.title ?? `ردیف ${rowNum}`,
                        value: val && val !== defVal ? String(val) : "—",
                      };
                    })
                  : []),
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-20 shrink-0">{label}:</span>
                  <span className="text-sm font-semibold">{value}</span>
                </div>
              ))}
            </div>

            {/* ردیف پایین: وضعیت + خروج/ورود */}
            <div className="mt-4 flex flex-wrap items-center gap-6 border-t pt-3" dir="rtl">

              {/* وضعیت سند */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">وضعیت سند:</span>
                <Badge className={`${statusColors[header.status]} text-white text-xs px-3 py-1`}>
                  {header.status}
                </Badge>
              </div>

              {/* خروج / ورود */}
              <div className="flex items-center gap-4 mr-auto">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">خروج:</span>
                  <Input className="h-8 text-sm w-32" placeholder="—" readOnly />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">ورود:</span>
                  <Input className="h-8 text-sm w-32" placeholder="—" readOnly />
                </div>
              </div>

            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===== نوار دکمه‌ها ===== */}
      <div>
        <Card className="mt-3">
          <CardContent className="p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                className="gap-1.5 h-8 text-xs bg-green-600 hover:bg-green-700"
                onClick={handleSave}
                disabled={loading}
              >
                <Save className="h-3.5 w-3.5" />
                {loading ? "در حال ثبت..." : "ثبت تغییرات"}
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs">
                <FileText className="h-3.5 w-3.5" />
                بررسی سند
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs">
                <Printer className="h-3.5 w-3.5" />
                چاپ سند
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs">
                <CheckCircle2 className="h-3.5 w-3.5" />
                صدو حواله
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={handleNew}>
                <Plus className="h-3.5 w-3.5" />
                جدید
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs">
                <RotateCcw className="h-3.5 w-3.5" />
                رد
              </Button>
              <div className="flex items-center gap-1 mr-auto">
                <label className="text-xs text-muted-foreground">تجمیع ۱</label>
                <Button size="sm" variant="secondary" className="h-7 text-xs px-2">تجمیع ۲</Button>
              </div>
              <div className="flex items-center gap-1 border-r pr-2">
                <label className="text-xs text-muted-foreground">تعداد ضمائم</label>
                <Input className="h-7 w-10 text-xs text-center" defaultValue="0" />
              </div>
              <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs">
                <FileText className="h-3.5 w-3.5" />
                بستن حساب
              </Button>
              <Button size="sm" variant="destructive" className="gap-1.5 h-8 text-xs">
                <Ban className="h-3.5 w-3.5" />
                خروج
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
