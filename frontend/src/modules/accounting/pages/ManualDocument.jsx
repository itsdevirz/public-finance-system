import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  FileText, CheckCircle2, Ban, X, AlertCircle,
  Check, FileEdit
} from "lucide-react";
import api from "@/api";
import { useApiCache } from "@/hooks/useApiCache";
import { encrypt } from "@/lib/crypto";
import { printTable } from "@/lib/printUtils";
import { PersianDatePicker } from "@/components/ui/persian-date-picker";
import sanamaCodes from "@/data/sanamaCodes.json";
import subAccountTitles from "@/data/subAccountTitles.json";
import sanamaRequirements from "@/data/sanamaRequirements.json";
import { PersonSanamaField } from "@/components/ui/person-sanama-field";
import ShebaInput from "@/components/ui/sheba-input";
import { checkDebitNatureBalance, clearBalanceCache } from "@/lib/accountBalanceCheck";
import { useAuth } from "@/context/AuthContext";

// ---- helpers ----
const allGroups = sanamaCodes.groups.map((g) => ({ code: g.code, title: g.title, accounts: g.accounts }));

function numberToPersianWords(num) {
  if (!num || isNaN(num) || num === 0) return "صفر";
  const ones = ["", "یک", "دو", "سه", "چهار", "پنج", "شش", "هفت", "هشت", "نه"];
  const teens = ["ده", "یازده", "دوازده", "سیزده", "چهارده", "پانزده", "شانزده", "هفده", "هجده", "نوزده"];
  const tens = ["", "ده", "بیست", "سی", "چهل", "پنجاه", "شصت", "هفتاد", "هشتاد", "نود"];
  const hundreds = ["", "صد", "دویست", "سیصد", "چهارصد", "پانصد", "ششصد", "هفتصد", "هشتصد", "نهصد"];
  const scales = ["", "هزار", "میلیون", "میلیارد", "تریلیون"];

  function convertChunk(n) {
    let str = "";
    const h = Math.floor(n / 100);
    const t = Math.floor((n % 100) / 10);
    const o = n % 10;
    if (h > 0) {
      str += hundreds[h];
      if (t > 0 || o > 0) str += " و ";
    }
    if (t === 1) {
      str += teens[o];
    } else {
      if (t > 1) {
        str += tens[t];
        if (o > 0) str += " و ";
      }
      if (o > 0) str += ones[o];
    }
    return str;
  }

  let n = Math.abs(num);
  let chunks = [];
  while (n > 0) {
    chunks.push(n % 1000);
    n = Math.floor(n / 1000);
  }

  let result = [];
  for (let i = chunks.length - 1; i >= 0; i--) {
    const chunk = chunks[i];
    if (chunk > 0) {
      const chunkText = convertChunk(chunk);
      const scaleText = scales[i];
      result.push(chunkText + (scaleText ? " " + scaleText : ""));
    }
  }
  return result.join(" و ");
}

// ── کامپوننت انتخاب شماره برنامه/طرح — با caching ──────────────────────────
function CreditCodeSanamaField({ value, onChange, labelCls, inputCls }) {
  const { data, loading } = useApiCache("/api/credits/definitions");

  const options = useMemo(() => {
    if (!data?.data) return [];
    return data.data
      .filter((c) => c.expense?.programNumber || c.capital?.projectNumber)
      .map((c) => {
        const num  = c.capital?.projectNumber || c.expense?.programNumber || "";
        const type = c.creditType === "capital" ? "تملک دارایی" : "هزینه";
        return {
          value: num,
          label: `${num}${c.capital?.projectTitle ? ` — ${c.capital.projectTitle}` : ""}${c.capital?.projectPlanTitle ? ` / ${c.capital.projectPlanTitle}` : ""} (${type})`,
        };
      })
      .filter((o) => o.value);
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Label className={labelCls}>شماره برنامه/طرح</Label>
        <input
          type="text" inputMode="numeric" className={inputCls}
          placeholder="در حال بارگیری..." value={value ?? ""}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
          dir="ltr" disabled
        />
      </div>
    );
  }

  if (options.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <Label className={labelCls}>شماره برنامه/طرح</Label>
        <input
          type="text" inputMode="numeric" className={inputCls}
          placeholder="عدد وارد کنید..." value={value ?? ""}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
          dir="ltr"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Label className={labelCls}>شماره برنامه/طرح</Label>
      <div className="flex-1">
        <SearchableSelect
          value={value ?? ""}
          onChange={(v) => onChange(v || "")}
          options={options}
          placeholder="انتخاب از اعتبارهای تعریف‌شده..."
          searchable
        />
      </div>
    </div>
  );
}


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
const DocRow = React.memo(({ row, idx, onChange, onDelete, isActive, onActivate }) => {
  const [debitVal, setDebitVal] = useState(row.debit || "");
  const [creditVal, setCreditVal] = useState(row.credit || "");
  const debitFocused = React.useRef(false);
  const creditFocused = React.useRef(false);

  useEffect(() => {
    if (!debitFocused.current) {
      setDebitVal(row.debit || "");
    }
  }, [row.debit]);

  useEffect(() => {
    if (!creditFocused.current) {
      setCreditVal(row.credit || "");
    }
  }, [row.credit]);

  const nature = useMemo(() => {
    if (!row.group || !row.account || !row.subAccount) return null;
    const subs = getSubAccounts(row.group, row.account);
    const found = subs.find((s) => s.code === row.subAccount);
    return found ? found.nature : null;
  }, [row.group, row.account, row.subAccount]);

  function setGroup(val) {
    onChange({ ...row, group: val, account: "", subAccount: "", debit: "", credit: "", sanamaFields: {} });
  }

  function setAccount(val) {
    onChange({ ...row, account: val, subAccount: "", debit: "", credit: "", sanamaFields: {} });
  }

  function setSubAccount(val) {
    onChange({
      ...row,
      subAccount: val,
      sanamaFields: {},
    });
  }

  const cellCls = "border-l last:border-l-0 px-2 py-1 overflow-hidden";
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
          className={`${inputCls} text-blue-700`}
          value={debitVal}
          onClick={(e) => e.stopPropagation()}
          onFocus={() => { debitFocused.current = true; }}
          onChange={(e) => setDebitVal(e.target.value)}
          onBlur={(e) => {
            debitFocused.current = false;
            const formatted = formatNumber(e.target.value);
            setDebitVal(formatted);
            onChange({ ...row, debit: formatted });
          }}
          placeholder={nature === "credit" ? "(بستانکار)" : ""}
        />
      </td>

      {/* مبلغ بستانکار */}
      <td className={`${cellCls} w-36`}>
        <input
          className={`${inputCls} text-rose-700`}
          value={creditVal}
          onClick={(e) => e.stopPropagation()}
          onFocus={() => { creditFocused.current = true; }}
          onChange={(e) => setCreditVal(e.target.value)}
          onBlur={(e) => {
            creditFocused.current = false;
            const formatted = formatNumber(e.target.value);
            setCreditVal(formatted);
            onChange({ ...row, credit: formatted });
          }}
          placeholder={nature === "debit" ? "(بدهکار)" : ""}
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
}, (prev, next) => {
  return prev.idx === next.idx &&
         prev.isActive === next.isActive &&
         prev.row === next.row;
});

// ---- SanamaNumericInput: input عددی با local state برای جلوگیری از از دست دادن focus ----
function SanamaNumericInput({ value, onChange, inputCls }) {
  const [localVal, setLocalVal] = React.useState(value ?? "");
  const isFocused = React.useRef(false);

  React.useEffect(() => {
    if (!isFocused.current) {
      setLocalVal(value ?? "");
    }
  }, [value]);

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      className={inputCls}
      placeholder="عدد وارد کنید..."
      value={localVal}
      dir="ltr"
      onFocus={() => { isFocused.current = true; }}
      onChange={(e) => setLocalVal(e.target.value.replace(/\D/g, ""))}
      onBlur={() => {
        isFocused.current = false;
        onChange(localVal.replace(/\D/g, ""));
      }}
    />
  );
}

// wrapper: label کوچک خاکستری بالا، input پایین
function SanamaWrap({ title, children, wide = false }) {
  return (
    <div className={`flex flex-col gap-1 min-w-0 ${wide ? "sm:col-span-2" : ""}`}>
      <span
        className="text-[10px] font-medium text-muted-foreground/80 leading-none truncate"
        title={title}
      >
        {title}
      </span>
      {children}
    </div>
  );
}

// ---- SanamaField: رندر یک فیلد سناما بر اساس نوع ردیف ----
function SanamaField({ rowDef, value, onChange, optional }) {
  const inputCls = "h-8 text-xs rounded-md border border-input bg-white px-2.5 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 w-full transition-all placeholder:text-muted-foreground/40";

  const placeholder = optional ? `${rowDef.default ?? "0"}` : "انتخاب کنید...";

  // dropdown ساده
  if (rowDef.values) {
    const opts = rowDef.values.map((v) => ({ value: String(v.type), label: v.title }));
    return (
      <SanamaWrap title={rowDef.title}>
        <SearchableSelect
          value={value !== undefined && value !== null ? String(value) : ""}
          onChange={(v) => onChange(v || "")}
          options={opts}
          placeholder={placeholder}
          searchable={opts.length > 8}
        />
      </SanamaWrap>
    );
  }

  // dropdown گروه‌بندی‌شده
  if (rowDef.groups) {
    const opts = rowDef.groups.flatMap((g) =>
      g.values.map((v) => ({ value: String(v.type), label: v.title, group: g.title }))
    );
    return (
      <SanamaWrap title={rowDef.title}>
        <SearchableSelect
          value={value !== undefined && value !== null ? String(value) : ""}
          onChange={(v) => onChange(v || "")}
          options={opts}
          placeholder={placeholder}
        />
      </SanamaWrap>
    );
  }

  // 1. فیلد تاریخ (تاریخ سررسید، تاریخ ایجاد و هر فیلدی که عنوان یا کد آن شامل تاریخ/سررسید/Date باشد)
  if (
    rowDef.row === 37 ||
    (rowDef.xmlCode && rowDef.xmlCode.toLowerCase().includes("date")) ||
    (rowDef.title && (rowDef.title.includes("تاریخ") || rowDef.title.includes("سررسید") || rowDef.title.includes("زمان")))
  ) {
    let dateStr = value ?? "";
    if (typeof dateStr === "object" && dateStr !== null) {
      dateStr = dateStr.target?.value ?? dateStr.value ?? "";
    }
    dateStr = String(dateStr);
    if (dateStr === "0" || dateStr === "00000000" || dateStr === "null" || dateStr === "undefined") {
      dateStr = "";
    }
    if (dateStr.length === 8 && !dateStr.includes("/")) {
      dateStr = `${dateStr.slice(0, 4)}/${dateStr.slice(4, 6)}/${dateStr.slice(6, 8)}`;
    }
    return (
      <SanamaWrap title={rowDef.title}>
        <PersianDatePicker
          value={dateStr}
          onChange={(e) => {
            const rawVal = e?.target?.value ?? e;
            onChange(rawVal || "");
          }}
          placeholder="۱۴۰۵/۰۱/۰۱"
        />
      </SanamaWrap>
    );
  }

  // input عددی
  if ("default" in rowDef) {
    if (rowDef.row === 8) {
      return (
        <SanamaWrap title={rowDef.title}>
          <CreditCodeSanamaField value={value} onChange={onChange} labelCls="" inputCls={inputCls} />
        </SanamaWrap>
      );
    }
    if (rowDef.row === 31 || (rowDef.title && rowDef.title.includes("شبا"))) {
      return (
        <SanamaWrap title={rowDef.title} wide>
          <ShebaInput value={value} onChange={onChange} />
        </SanamaWrap>
      );
    }
    return (
      <SanamaWrap title={rowDef.title}>
        <SanamaNumericInput value={value} onChange={onChange} inputCls={inputCls} />
      </SanamaWrap>
    );
  }


  // ردیف اشخاص
  if (rowDef.types) {
    return (
      <SanamaWrap title={rowDef.title} wide>
        <PersonSanamaField value={value} onChange={onChange} labelCls="" required={!optional} />
      </SanamaWrap>
    );
  }

  return null;
}

// فیلدهایی که اختیاری‌اند
const OPTIONAL_ROWS = new Set();

function SanamaExtraFields({ row, onSanamaChange }) {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const requiredRows = getRequiredRows(row.subAccount);
  if (!requiredRows.length) return null;

  const isDebit  = parseFloat(String(row.debit  || "").replace(/,/g, "")) > 0;
  const isCredit = parseFloat(String(row.credit || "").replace(/,/g, "")) > 0;

  const acctCode  = row.subAccount || "";
  const acctTitle = (() => {
    if (!row.group || !row.account || !row.subAccount) return row.desc || "";
    const subs = getSubAccounts(row.group, row.account);
    return subs.find((s) => s.code === row.subAccount)?.title || row.desc || "";
  })();

  const amount = isDebit
    ? parseFloat(String(row.debit || "").replace(/,/g, ""))
    : isCredit
    ? parseFloat(String(row.credit || "").replace(/,/g, ""))
    : 0;

  const amountStr = amount > 0 ? amount.toLocaleString("fa-IR") : null;

  // رنگ‌بندی بر اساس ماهیت
  const theme = isDebit
    ? { bar: "bg-blue-500",  header: "bg-blue-50/70  border-blue-100",  badge: "bg-blue-100 text-blue-700 border-blue-200",  label: "بدهکار",  amount: "text-blue-700" }
    : isCredit
    ? { bar: "bg-rose-500",  header: "bg-rose-50/70  border-rose-100",  badge: "bg-rose-100 text-rose-700 border-rose-200",  label: "بستانکار", amount: "text-rose-700" }
    : { bar: "bg-muted",     header: "bg-muted/30    border-border",     badge: "bg-muted text-muted-foreground border-border", label: "—",       amount: "text-muted-foreground" };

  const creditTypeValue = row.sanamaFields?.["sanama_5"];

  // خلاصه تفصیلی‌های پر شده
  const filledSummaries = requiredRows.map((rowNum) => {
    const rowDef = getSubAccountTitle(rowNum);
    if (!rowDef) return null;
    const isNotifiedCredit = creditTypeValue === "2" || creditTypeValue === "ابلاغی";
    if (rowNum === 15 && !isNotifiedCredit) return null;

    const fieldKey = `sanama_${rowNum}`;
    const val = row.sanamaFields?.[fieldKey];
    if (!val || val === "0" || val === "") return null;

    let displayVal = val;
    if (rowDef.values) {
      const match = rowDef.values.find((v) => String(v.type) === String(val));
      if (match) displayVal = match.title;
    } else if (rowDef.groups) {
      for (const g of rowDef.groups) {
        const match = g.values.find((v) => String(v.type) === String(val));
        if (match) { displayVal = match.title; break; }
      }
    }
    return { title: rowDef.title, val: displayVal };
  }).filter(Boolean);

  return (
    <div className="border-t border-border/60 bg-background overflow-visible transition-all">
      {/* ── نوار هدر تفصیلی ── */}
      <div className={`flex items-center justify-between gap-3 px-4 py-2 border-b ${theme.header}`} dir="rtl">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className={`w-1 h-7 rounded-full shrink-0 ${theme.bar}`} />

          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${theme.badge}`}>
            {theme.label}
          </span>

          <code className="text-xs font-bold font-mono text-foreground shrink-0">{acctCode}</code>

          {acctTitle && <span className="text-border/80 shrink-0">|</span>}

          {acctTitle && (
            <span className="text-xs text-foreground/70 truncate font-medium">{acctTitle}</span>
          )}

          {amountStr && (
            <span className={`text-xs font-mono font-bold shrink-0 ${theme.amount}`}>
              ({amountStr} ریال)
            </span>
          )}
        </div>

        {/* دکمه ثبت / ویرایش تفصیلی */}
        <div className="shrink-0 flex items-center gap-2">
          {isConfirmed ? (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 h-7 text-xs bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300 font-medium"
              onClick={() => setIsConfirmed(false)}
            >
              <FileEdit className="h-3.5 w-3.5 text-amber-600" />
              ویرایش تفصیلی
            </Button>
          ) : (
            <Button
              size="sm"
              variant="default"
              className="gap-1.5 h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs"
              onClick={() => setIsConfirmed(true)}
            >
              <Check className="h-3.5 w-3.5" />
              ثبت و تایید تفصیلی
            </Button>
          )}
        </div>
      </div>

      {/* ── نمایش حالت خلاصه تک سطری (isConfirmed = true) ── */}
      {isConfirmed ? (
        <div className="px-4 py-2 bg-emerald-50/30 border-b flex items-center gap-2 flex-wrap text-xs" dir="rtl">
          <span className="text-emerald-800 font-medium text-[11px] shrink-0">خلاصه تفصیلی‌های ثبت‌شده:</span>
          {filledSummaries.length > 0 ? (
            filledSummaries.map((item, idx) => (
              <span key={idx} className="bg-white border border-emerald-200 text-emerald-950 px-2 py-0.5 rounded text-[11px] font-medium shadow-2xs">
                <span className="text-muted-foreground ml-1">{item.title}:</span>
                <span className="font-semibold">{item.val}</span>
              </span>
            ))
          ) : (
            <span className="text-muted-foreground text-[11px] italic">هیچ مقداری انتخاب نشده است (پیش‌فرض)</span>
          )}
        </div>
      ) : (
        /* ── نمایش فرم کامل تفصیلی (isConfirmed = false) ── */
        <div className="px-4 py-3 grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3 bg-muted/10">
          {requiredRows.map((rowNum) => {
            const rowDef = getSubAccountTitle(rowNum);
            if (!rowDef) return null;

            const isNotifiedCredit = creditTypeValue === "2" || creditTypeValue === "ابلاغی";
            if (rowNum === 15 && !isNotifiedCredit) return null;

            const optional  = OPTIONAL_ROWS.has(rowNum);
            const fieldKey  = `sanama_${rowNum}`;
            const fieldVal  = row.sanamaFields?.[fieldKey];
            return (
              <SanamaField
                key={rowNum}
                rowDef={rowDef}
                value={fieldVal}
                optional={optional}
                onChange={(val) => onSanamaChange(fieldKey, val)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---- کامپوننت محتوای چاپی برگ سند حسابداری ----
function VoucherPrintContent({ header, rows, totalDebit, totalCredit, diff, today, allGroups }) {
  return (
    <div id="printable-voucher" className="p-4 border rounded-lg bg-white text-right text-gray-900 font-sans" dir="rtl">
      {/* هدر رسمی سند */}
      <div className="border-b-2 border-gray-900 pb-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-700 font-mono space-y-0.5">
            <div>تاریخ: <span className="font-bold text-black">{header.docDate || today}</span></div>
            <div>شماره سند: <span className="font-bold text-black">{header.docNo || "پیش‌فرض"}</span></div>
            <div>دوره مالی: <span className="font-bold text-black">{header.fiscalYear || "1405"}</span></div>
          </div>
          <div className="text-center">
            <h2 className="text-xs font-bold text-gray-700">جمهوری اسلامی ایران</h2>
            <h1 className="text-base font-black text-gray-900 mt-0.5">برگ سند حسابداری (مالی)</h1>
            <span className="text-[11px] font-semibold text-gray-600">دستگاه اجرایی / سازمان عمومی</span>
          </div>
          <div className="text-xs text-gray-700 font-mono space-y-0.5">
            <div>نوع سند: <span className="font-bold text-black">{header.docType}</span></div>
            <div>دسترسی: <span className="font-bold text-black">{header.access}</span></div>
            <div>وضعیت: <span className="font-bold text-black">{header.status}</span></div>
          </div>
        </div>

        {/* شماره و تاریخ نامه و شرح کلی */}
        <div className="mt-3 pt-2 border-t border-gray-300 grid grid-cols-3 gap-2 text-xs">
          <div><span className="text-gray-600">شماره نامه:</span> <span className="font-medium">{header.letterNo || "—"}</span></div>
          <div><span className="text-gray-600">تاریخ نامه:</span> <span className="font-medium">{header.letterDate || "—"}</span></div>
          <div className="col-span-3 mt-1"><span className="text-gray-600">شرح کلی سند:</span> <span className="font-medium">{header.desc || "—"}</span></div>
        </div>
      </div>

      {/* جدول ردیف‌های سند */}
      <table className="w-full text-xs border-collapse border border-gray-800 my-2" dir="rtl">
        <thead>
          <tr className="bg-gray-100 border-b border-gray-800 text-gray-900 font-bold">
            <th className="border border-gray-800 p-2 text-center w-8">#</th>
            <th className="border border-gray-800 p-2 text-right w-44">گروه و کل</th>
            <th className="border border-gray-800 p-2 text-right w-48">حساب معین</th>
            <th className="border border-gray-800 p-2 text-right">جزئیات تفصیلی (الزامات سناما)</th>
            <th className="border border-gray-800 p-2 text-center w-32">بدهکار (ریال)</th>
            <th className="border border-gray-800 p-2 text-center w-32">بستانکار (ریال)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            const grpObj  = allGroups.find(g => g.code === row.group);
            const acctObj = getAccounts(row.group).find(a => a.code === row.account);
            const subObj  = getSubAccounts(row.group, row.account).find(s => s.code === row.subAccount);

            const sanamaSummary = getRequiredRows(row.subAccount).map(rNum => {
              const rDef = getSubAccountTitle(rNum);
              const val  = row.sanamaFields?.[`sanama_${rNum}`];
              if (!val || val === "0") return null;
              return `${rDef?.title}: ${val}`;
            }).filter(Boolean).join(" | ");

            return (
              <tr key={row.id || idx} className="border-b border-gray-400">
                <td className="border border-gray-800 p-2 text-center font-mono">{idx + 1}</td>
                <td className="border border-gray-800 p-2">
                  <div className="font-bold">{row.group ? `${row.group} - ${grpObj?.title || ""}` : "—"}</div>
                  <div className="text-[11px] text-gray-700">{row.account ? `${row.account} - ${acctObj?.title || ""}` : ""}</div>
                </td>
                <td className="border border-gray-800 p-2 font-semibold">
                  {row.subAccount ? `${row.subAccount} - ${subObj?.title || ""}` : "—"}
                </td>
                <td className="border border-gray-800 p-2 text-[11px] text-gray-800">
                  {sanamaSummary || row.desc || "—"}
                </td>
                <td className="border border-gray-800 p-2 text-left font-mono font-bold text-blue-950">
                  {row.debit ? parseNumber(row.debit).toLocaleString("fa-IR") : "۰"}
                </td>
                <td className="border border-gray-800 p-2 text-left font-mono font-bold text-rose-950">
                  {row.credit ? parseNumber(row.credit).toLocaleString("fa-IR") : "۰"}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-gray-100 font-bold border-t-2 border-gray-800">
            <td colSpan={4} className="border border-gray-800 p-2 text-left">جمع کل:</td>
            <td className="border border-gray-800 p-2 text-left font-mono font-black text-blue-950">
              {totalDebit.toLocaleString("fa-IR")}
            </td>
            <td className="border border-gray-800 p-2 text-left font-mono font-black text-rose-950">
              {totalCredit.toLocaleString("fa-IR")}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* مبلغ به حروف و وضعیت تراز */}
      <div className="mt-3 border border-gray-300 p-2.5 rounded bg-gray-50 flex items-center justify-between text-xs">
        <div>
          <span className="font-bold text-gray-700">مبلغ سند به حروف: </span>
          <span className="font-bold text-black">{numberToPersianWords(totalDebit)} ریال</span>
        </div>
        <div>
          <span className="font-bold text-gray-700">وضعیت تراز: </span>
          <span className={`font-bold ${diff === 0 ? "text-green-700" : "text-rose-700"}`}>
            {diff === 0 ? "تراز کامل (تفاوت: ۰ ریال)" : `ناتراز (اختلاف: ${Math.abs(diff).toLocaleString("fa-IR")} ریال)`}
          </span>
        </div>
      </div>

      {/* امضاهای رسمی */}
      <div className="mt-8 pt-4 border-t-2 border-gray-900 grid grid-cols-4 gap-4 text-center text-xs font-bold text-gray-900">
        <div className="border border-gray-300 p-3 rounded">
          <div className="mb-8">تنظیم‌کننده</div>
          <div className="text-[10px] text-gray-500 font-normal">امضا / تاریخ</div>
        </div>
        <div className="border border-gray-300 p-3 rounded">
          <div className="mb-8">حسابدار / کارشناس</div>
          <div className="text-[10px] text-gray-500 font-normal">امضا / تاریخ</div>
        </div>
        <div className="border border-gray-300 p-3 rounded">
          <div className="mb-8">تاییدکننده (رئیس حسابداری)</div>
          <div className="text-[10px] text-gray-500 font-normal">امضا / تاریخ</div>
        </div>
        <div className="border border-gray-300 p-3 rounded">
          <div className="mb-8">مدیر مالی / ذیحساب</div>
          <div className="text-[10px] text-gray-500 font-normal">امضا / تاریخ</div>
        </div>
      </div>
    </div>
  );
}

// ---- component اصلی ----
export default function ManualDocument() {
  const { user: currentUser } = useAuth();
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

  // مدال‌ها و دیالوگ‌ها
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showCheckModal, setShowCheckModal] = useState(false);
  const [showRemittanceModal, setShowRemittanceModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showCloseAccountModal, setShowCloseAccountModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [remittanceNo, setRemittanceNo] = useState(() => Math.floor(100000 + Math.random() * 900000).toString());

  // پرینت اختصاصی و استاندارد بدون صفحه سفید و با حفظ چیدمان کامل
  const handlePrintVoucherDocument = useCallback(() => {
    const printEl = document.getElementById("printable-voucher");
    if (!printEl) {
      window.print();
      return;
    }

    const printWin = window.open("", "_blank", "width=1050,height=850");
    if (!printWin) {
      window.print();
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
      <head>
        <meta charset="utf-8">
        <title>برگ سند حسابداری - ${header.docNo || "جدید"}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            direction: rtl;
            margin: 0;
            padding: 16px;
            background: #ffffff;
            color: #000000;
            width: 100%;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 12px 0;
          }
          th, td {
            border: 1px solid #000000 !important;
            padding: 6px 8px !important;
            font-size: 11px !important;
          }
          th {
            background-color: #f3f4f6 !important;
            font-weight: bold !important;
          }
          .text-center { text-align: center !important; }
          .text-right { text-align: right !important; }
          .text-left { text-align: left !important; }
          .font-bold { font-weight: bold !important; }
          .font-black { font-weight: 900 !important; }
          .font-semibold { font-weight: 600 !important; }
          .font-mono { font-family: monospace !important; }
          .grid { display: grid; }
          .grid-cols-3 { grid-template-columns: repeat(3, 1fr); gap: 8px; }
          .grid-cols-4 { grid-template-columns: repeat(4, 1fr); gap: 12px; }
          .flex { display: flex; }
          .justify-between { justify-content: space-between; }
          .items-center { align-items: center; }
          .border { border: 1px solid #d1d5db; }
          .border-b-2 { border-bottom: 2px solid #000000; }
          .border-t-2 { border-top: 2px solid #000000; }
          .border-t { border-top: 1px solid #e5e7eb; }
          .rounded { border-radius: 4px; }
          .p-2 { padding: 8px; }
          .p-2\.5 { padding: 10px; }
          .p-3 { padding: 12px; }
          .p-4 { padding: 16px; }
          .mb-4 { margin-bottom: 16px; }
          .mb-8 { margin-bottom: 32px; }
          .mt-3 { margin-top: 12px; }
          .mt-8 { margin-top: 32px; }
          .text-xs { font-size: 12px; }
          .text-sm { font-size: 14px; }
          .text-base { font-size: 16px; }
          .text-gray-500 { color: #6b7280; }
          .text-gray-600 { color: #4b5563; }
          .text-gray-700 { color: #374151; }
          .text-gray-900 { color: #111827; }
          .text-black { color: #000000; }
          .bg-gray-50 { background-color: #f9fafb !important; }
          .bg-gray-100 { background-color: #f3f4f6 !important; }
          .no-print { display: none !important; }
        </style>
      </head>
      <body>
        <div>
          ${printEl.innerHTML}
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.focus();
              window.print();
            }, 250);
          };
        </script>
      </body>
      </html>
    `;

    printWin.document.open();
    printWin.document.write(htmlContent);
    printWin.document.close();
  }, [header]);

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
  const docId = location.state?.copyMode ? null : (location.state?.docId || new URLSearchParams(location.search).get("id"));
  const copySourceId = location.state?.copyMode ? location.state?.docId : null;

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const sourceId = docId || copySourceId;
    if (!sourceId) return;

    let isMounted = true;
    async function fetchDoc() {
      setLoading(true);
      try {
        const res = await api.get(`/api/documents/${sourceId}`);
        if (!isMounted) return;
        const doc = res.data.data;
        if (doc) {
          setHeader({
            fiscalYear: String(doc.fiscal_year || "1404"),
            // در حالت کپی، شماره سند پاک می‌شه تا سند جدید صادر بشه
            docNo: copySourceId ? "" : (doc.document_number || ""),
            docDate: doc.document_date || today,
            docType: doc.rawHeader?.docType ||
                     (doc.document_type === "CLOSING" ? "اختتامیه" :
                      doc.document_type === "TRANSFER" ? "دائم" : "موقت"),
            access: doc.rawHeader?.access || "عادی",
            desc: copySourceId ? `کپی از سند ${doc.document_number}` : (doc.description || ""),
            letterNo: doc.reference_number || "",
            letterDate: doc.rawHeader?.letterDate || "",
            status: "صدور سند",
          });

          if (doc.rawRows && doc.rawRows.length > 0) {
            const sanitizedRows = doc.rawRows.map(r => {
              const code = r.subAccount || "";
              const group = code.charAt(0) || "";
              const account = code.substring(0, 3);
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
              const account = code.substring(0, 3);
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
  }, [docId, copySourceId]);

  async function handleSave() {
    // ─── بررسی سطوح دسترسی بر اساس نقش و مجوزها ───────────────────────────
    if (currentUser && currentUser.role !== "admin") {
      if (docId) {
        if (!currentUser.permissions?.["doc.edit"]) {
          setMessage({ type: "error", text: "دسترسی غیرمجاز. شما مجوز ویرایش سند حسابداری را ندارید." });
          return;
        }
      } else {
        if (!currentUser.permissions?.["doc.create"]) {
          setMessage({ type: "error", text: "دسترسی غیرمجاز. شما مجوز ایجاد سند جدید را ندارید." });
          return;
        }
      }

      let statusMapped = "DRAFT";
      if (header.status === "رد شده") {
        statusMapped = "CANCELLED";
      } else if (["پرداخت و دریافت", "دفترداری", "اعتمادات", "بایگانی"].includes(header.status)) {
        statusMapped = "CONFIRMED";
      }

      if (statusMapped === "CONFIRMED" && !currentUser.permissions?.["doc.approve"]) {
        setMessage({ type: "error", text: "دسترسی غیرمجاز. شما مجوز تایید و نهایی‌سازی اسناد را ندارید." });
        return;
      }

      // ─── بررسی محدودیت‌های مبالغ مالی کاربر ──────────────────────────────────
      const totalDebit = rows.reduce((sum, r) => sum + parseNumber(r.debit), 0);
      if (currentUser.financialLimitMax > 0 && totalDebit > currentUser.financialLimitMax) {
        setMessage({
          type: "error",
          text: `مبلغ کل سند (${totalDebit.toLocaleString("fa-IR")} ریال) بیشتر از سقف مجاز تراکنش شما (${currentUser.financialLimitMax.toLocaleString("fa-IR")} ریال) است.`
        });
        return;
      }
      if (currentUser.financialLimitMin > 0 && totalDebit < currentUser.financialLimitMin) {
        setMessage({
          type: "error",
          text: `مبلغ کل سند (${totalDebit.toLocaleString("fa-IR")} ریال) کمتر از حداقل مجاز تراکنش شما (${currentUser.financialLimitMin.toLocaleString("fa-IR")} ریال) است.`
        });
        return;
      }
    }

    if (diff !== 0) {
      setMessage({ type: "error", text: "سند تراز نیست! اختلاف بدهکار و بستانکار باید صفر باشد." });
      return;
    }

    const validRows = rows.filter(r => r.group && r.account && r.subAccount);
    if (validRows.length === 0) {
      setMessage({ type: "error", text: "حداقل یک ردیف کامل (گروه، کل، معین) الزامی است." });
      return;
    }

    // ─── بررسی قانون موجودی معین‌های بدهکار ───────────────────────────────
    const balanceRows = rows
      .filter(r => r.subAccount)
      .map(r => ({
        subAccount: r.subAccount,
        debit:  parseNumber(r.debit),
        credit: parseNumber(r.credit),
      }));
    const balanceError = await checkDebitNatureBalance(balanceRows, docId || null);
    if (balanceError) {
      setMessage({ type: "error", text: balanceError });
      return;
    }

    // بررسی الزامات سناما برای تمامی ردیف‌ها
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (r.group && r.account && r.subAccount) {
        const requiredRows = getRequiredRows(r.subAccount);
        const creditTypeValue = r.sanamaFields?.["sanama_5"];
        const isNotifiedCredit = creditTypeValue === "2" || creditTypeValue === "ابلاغی";

        for (const rowNum of requiredRows) {
          // ردیف ۱۵ (ابلاغ دهنده) فقط برای اعتبار ابلاغی الزامی است
          if (rowNum === 15 && !isNotifiedCredit) continue;

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
      clearBalanceCache();
      
      if (!docId && res.data.data.document_number) {
        setH("docNo", res.data.data.document_number);
      }
    } catch (err) {
      console.error("Save error:", err);
      const errData = err.response?.data;
      if (errData?.error_code === "CREDIT_EXCEEDS_DEBIT") {
        setMessage({
          type: "error",
          text: errData.message,
        });
      } else {
        setMessage({ type: "error", text: errData?.message || "خطا در ثبت سند در سرور. اتصال را بررسی کنید." });
      }
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

  const setH = useCallback((k, v) => setHeader((p) => ({ ...p, [k]: v })), []);

  const addRow = useCallback(() => {
    const id = Date.now();
    setRows((prev) => [...prev, { ...EMPTY_ROW, id }]);
    setActiveRowId(id);
  }, []);

  const updateRow = useCallback((id, updated) => {
    setRows((prev) => prev.map((r) => (r.id === id ? updated : r)));
  }, []);

  const deleteRow = useCallback((id) => {
    setRows((prev) => {
      const next = prev.filter((r) => r.id !== id);
      if (activeRowId === id && next.length) setActiveRowId(next[0].id);
      return next.length ? next : [{ ...EMPTY_ROW, id: Date.now() }];
    });
  }, [activeRowId]);

  const handleSanamaChange = useCallback((rowId, fieldKey, val) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === rowId
          ? { ...r, sanamaFields: { ...r.sanamaFields, [fieldKey]: val } }
          : r
      )
    );
  }, []);

  const totalDebit  = useMemo(() => rows.reduce((s, r) => s + parseNumber(r.debit),  0), [rows]);
  const totalCredit = useMemo(() => rows.reduce((s, r) => s + parseNumber(r.credit), 0), [rows]);
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
        title={copySourceId ? "کپی سند" : (docId ? "ویرایش سند مالی" : "صدور سند دستی")} 
        description={copySourceId ? "صدور سند جدید بر اساس سند مبدا" : (docId ? `ویرایش سند شماره ${header.docNo}` : "ثبت و ویرایش اسناد حسابداری")} 
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
                  <PersianDatePicker className="h-8 text-xs rounded-md border bg-white focus:border-primary" value={header.docDate} onChange={(e) => setH("docDate", e?.target?.value ?? e)} />
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
                  <PersianDatePicker className="h-8 text-xs rounded-md border bg-white focus:border-primary" value={header.letterDate} onChange={(e) => setH("letterDate", e?.target?.value ?? e)} />
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
          <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30" dir="rtl">
            <div className="flex items-center gap-2">
              <Button size="sm" variant="default" className="gap-1.5 h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-medium" onClick={addRow}>
                <Plus className="h-4 w-4" />
                درج سطر
              </Button>
            </div>
            <span className="text-xs font-semibold text-muted-foreground">
              جدول ردیف‌های سند
            </span>
          </div>
          <CardContent className="p-0">
            <div className="overflow-x-auto" id="manual-doc-print-area">
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

            {/* الزامات سناما — همه ردیف‌هایی که الزامات دارند */}
            {rows.some(r => r.subAccount && getRequiredRows(r.subAccount).length > 0) && (
              <div className="border-t">
                {rows.map((row) => {
                  const reqs = getRequiredRows(row.subAccount);
                  if (!reqs.length) return null;
                  return (
                    <SanamaExtraFields
                      key={row.id}
                      row={row}
                      onSanamaChange={(fieldKey, val) => handleSanamaChange(row.id, fieldKey, val)}
                    />
                  );
                })}
              </div>
            )}

            {/* جمع و خلاصه‌ تراز */}
            <div className="flex items-center justify-end border-t px-3 py-2 bg-muted/20">
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
            <div className="flex flex-wrap items-center gap-2" dir="rtl">
              <Button
                size="sm"
                className="gap-1.5 h-8 text-xs bg-green-600 hover:bg-green-700 text-white"
                onClick={handleSave}
                disabled={loading}
              >
                <Save className="h-3.5 w-3.5" />
                {loading ? "در حال ثبت..." : "ثبت تغییرات"}
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 h-8 text-xs hover:bg-blue-50 hover:text-blue-700 border-blue-200"
                onClick={() => setShowCheckModal(true)}
              >
                <FileText className="h-3.5 w-3.5 text-blue-600" />
                بررسی سند
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 h-8 text-xs bg-amber-500 hover:bg-amber-600 text-white border-amber-600 font-medium shadow-xs"
                onClick={() => setShowPrintModal(true)}
              >
                <Printer className="h-3.5 w-3.5" />
                چاپ سند
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 h-8 text-xs hover:bg-emerald-50 hover:text-emerald-700 border-emerald-200"
                onClick={() => setShowRemittanceModal(true)}
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                صدور حواله
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 h-8 text-xs hover:bg-slate-100"
                onClick={() => setShowNewModal(true)}
              >
                <Plus className="h-3.5 w-3.5 text-slate-600" />
                جدید
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 h-8 text-xs hover:bg-rose-50 hover:text-rose-700 border-rose-200"
                onClick={() => setShowRejectModal(true)}
              >
                <RotateCcw className="h-3.5 w-3.5 text-rose-600" />
                رد
              </Button>

              <div className="flex items-center gap-1 mr-auto">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs px-2.5"
                  onClick={() => setMessage({ type: "success", text: "حالت تجمیع ۱ فعال گردید." })}
                >
                  تجمیع ۱
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 text-xs px-2.5"
                  onClick={() => setMessage({ type: "success", text: "حالت تجمیع ۲ فعال گردید." })}
                >
                  تجمیع ۲
                </Button>
              </div>

              <div className="flex items-center gap-1.5 border-r border-l px-2">
                <span className="text-xs text-muted-foreground">تعداد ضمائم:</span>
                <Input
                  className="h-7 w-12 text-xs text-center font-bold"
                  defaultValue="0"
                  onChange={(e) => {
                    const count = e.target.value;
                    setMessage({ type: "success", text: `تعداد ضمائم سند: ${count}` });
                  }}
                />
              </div>

              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 h-8 text-xs hover:bg-purple-50 hover:text-purple-700 border-purple-200"
                onClick={() => setShowCloseAccountModal(true)}
              >
                <FileText className="h-3.5 w-3.5 text-purple-600" />
                بستن حساب
              </Button>

              <Button
                size="sm"
                variant="destructive"
                className="gap-1.5 h-8 text-xs"
                onClick={() => navigate("/document-setup")}
              >
                <Ban className="h-3.5 w-3.5" />
                خروج
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── مدال بررسی جامع سند ── */}
      {showCheckModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 text-right font-sans">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="font-bold text-sm flex items-center gap-2 text-gray-900">
                <FileText className="h-4 w-4 text-blue-600" />
                نتیجه بررسی جامع سند مالی
              </h3>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setShowCheckModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3 text-xs">
              {/* بررسی تراز */}
              <div className={`p-3 rounded-lg border flex items-center justify-between ${diff === 0 ? "bg-green-50 border-green-200 text-green-900" : "bg-rose-50 border-rose-200 text-rose-900"}`}>
                <div className="flex items-center gap-2">
                  {diff === 0 ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-rose-600" />}
                  <span className="font-medium">توازن بدهکار و بستانکار</span>
                </div>
                <span className="font-bold">
                  {diff === 0 ? "تراز کامل" : `اختلاف: ${Math.abs(diff).toLocaleString("fa-IR")} ریال`}
                </span>
              </div>

              {/* بررسی تعداد ردیف‌ها */}
              <div className="p-3 rounded-lg border bg-blue-50/50 border-blue-200 flex items-center justify-between text-blue-900">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">تعداد ردیف‌های ثبت‌شده</span>
                </div>
                <span className="font-bold">{rows.length} ردیف</span>
              </div>

              {/* بدهکار و بستانکار */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 border rounded-lg bg-gray-50">
                  <div className="text-gray-500">جمع کل بدهکار:</div>
                  <div className="font-bold text-blue-700 text-xs mt-1">{totalDebit.toLocaleString("fa-IR")} ریال</div>
                </div>
                <div className="p-2.5 border rounded-lg bg-gray-50">
                  <div className="text-gray-500">جمع کل بستانکار:</div>
                  <div className="font-bold text-rose-700 text-xs mt-1">{totalCredit.toLocaleString("fa-IR")} ریال</div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t flex justify-end">
              <Button size="sm" onClick={() => setShowCheckModal(false)}>
                بستن
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── مدال استاندارد چاپ برگ سند حسابداری ── */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black/60 z-50 overflow-y-auto p-3 md:p-6 flex justify-center items-start">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-4 md:p-6 text-right font-sans relative my-4 md:my-6 border" dir="rtl">
            {/* نوار دکمه‌های کنترل مدال - چسبان (Sticky) در بالای مدال */}
            <div className="sticky top-0 bg-white z-20 pb-3 pt-1 border-b mb-4 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm"
                  onClick={handlePrintVoucherDocument}
                >
                  <Printer className="h-4 w-4" />
                  چاپ سند / پرینت
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-800">پیش‌نمایش برگ سند حسابداری استاندارد</span>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100" onClick={() => setShowPrintModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* پیش‌نمایش درون مدال */}
            <VoucherPrintContent header={header} rows={rows} totalDebit={totalDebit} totalCredit={totalCredit} diff={diff} today={today} allGroups={allGroups} />
          </div>
        </div>
      )}

      {/* ── مدال صدور حواله ── */}
      {showRemittanceModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 text-right font-sans">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="font-bold text-sm flex items-center gap-2 text-gray-900">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                صدور حواله پرداختی سند
              </h3>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setShowRemittanceModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {diff !== 0 ? (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2 mb-4">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>امکان صدور حواله برای سند ناتراز وجود ندارد. ابتدا مبالغ را تراز کنید.</span>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-muted-foreground block mb-1">شماره حواله پرداختی:</label>
                  <Input className="h-8 text-xs font-mono font-bold" value={remittanceNo} onChange={(e) => setRemittanceNo(e.target.value)} />
                </div>
                <div>
                  <label className="text-muted-foreground block mb-1">مبلغ حواله (ریال):</label>
                  <Input className="h-8 text-xs font-mono font-bold bg-muted/40" value={totalDebit.toLocaleString("fa-IR")} readOnly />
                </div>
                <div>
                  <label className="text-muted-foreground block mb-1">تاریخ صدور حواله:</label>
                  <Input className="h-8 text-xs font-mono" value={header.docDate || today} readOnly />
                </div>
              </div>
            )}

            <div className="mt-5 pt-3 border-t flex justify-between gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowRemittanceModal(false)}>
                انصراف
              </Button>
              {diff === 0 && (
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                  onClick={() => {
                    setHeader(prev => ({ ...prev, status: "پرداخت و دریافت" }));
                    setMessage({ type: "success", text: `حواله شماره ${remittanceNo} با موفقیت صادر گردید و وضعیت سند تغییر یافت.` });
                    setShowRemittanceModal(false);
                  }}
                >
                  تایید و صدور حواله
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── مدال رد سند ── */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 text-right font-sans">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="font-bold text-sm flex items-center gap-2 text-rose-700">
                <RotateCcw className="h-4 w-4 text-rose-600" />
                رد سند مالی
              </h3>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setShowRejectModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-gray-700">لطفاً علت رد سند را جهت ثبت در سوابق وارد نمایید:</p>
              <textarea
                className="w-full h-24 p-2 text-xs border rounded-md focus:border-rose-500 focus:outline-none"
                placeholder="علت رد سند را بنویسید..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>

            <div className="mt-4 flex justify-between gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowRejectModal(false)}>
                انصراف
              </Button>
              <Button
                size="sm"
                className="bg-rose-600 hover:bg-rose-700 text-white"
                onClick={() => {
                  setHeader(prev => ({ ...prev, status: "رد شده" }));
                  setMessage({ type: "error", text: `سند مالی رد شد. (علت: ${rejectReason || "بدون توضیحات"})` });
                  setShowRejectModal(false);
                }}
              >
                تایید و رد سند
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── مدال ایجاد سند جدید ── */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 text-right font-sans">
            <div className="flex items-center justify-between border-b pb-3 mb-3">
              <h3 className="font-bold text-sm flex items-center gap-2 text-gray-900">
                <Plus className="h-4 w-4 text-emerald-600" />
                ایجاد سند جدید
              </h3>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setShowNewModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <p className="text-xs text-gray-600 mb-4">
              آیا از ایجاد سند جدید اطمینان دارید؟ تمامی اطلاعات فعلی فرم پاک خواهند شد.
            </p>

            <div className="flex justify-between gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowNewModal(false)}>
                انصراف
              </Button>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => {
                  handleNew();
                  setShowNewModal(false);
                }}
              >
                ایجاد سند جدید
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── مدال بستن حساب ── */}
      {showCloseAccountModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 text-right font-sans">
            <div className="flex items-center justify-between border-b pb-3 mb-3">
              <h3 className="font-bold text-sm flex items-center gap-2 text-gray-900">
                <FileText className="h-4 w-4 text-purple-600" />
                عملیات بستن حساب
              </h3>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setShowCloseAccountModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <p className="text-xs text-gray-600 mb-3">
              بررسی وضعیت بستن حساب برای سند شماره <span className="font-bold">{header.docNo || "جدید"}</span>:
            </p>

            <div className="p-3 border rounded bg-purple-50/50 border-purple-200 text-xs space-y-1 mb-4">
              <div className="flex justify-between">
                <span>وضعیت تراز:</span>
                <span className="font-bold">{diff === 0 ? "تراز کامل" : "ناتراز"}</span>
              </div>
              <div className="flex justify-between">
                <span>دوره مالی:</span>
                <span className="font-bold">{header.fiscalYear}</span>
              </div>
            </div>

            <div className="flex justify-between gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowCloseAccountModal(false)}>
                انصراف
              </Button>
              <Button
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => {
                  if (diff !== 0) {
                    setMessage({ type: "error", text: "بستن حساب نیازمند تراز کامل سند است." });
                  } else {
                    setHeader(prev => ({ ...prev, status: "حسابداری" }));
                    setMessage({ type: "success", text: "عملیات بستن حساب با موفقیت به پایان رسید." });
                  }
                  setShowCloseAccountModal(false);
                }}
              >
                تایید بستن حساب
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── ناحیه چاپی اصلی برای پرینت مرورگر (جلوگیری از صفحه سفید و حفظ کامل چیدمان) ── */}
      <div id="printable-voucher-container" className="hidden print:block">
        <style>{`
          @media print {
            @page {
              size: A4 portrait;
              margin: 8mm;
            }
            body {
              background: #ffffff !important;
              color: #000000 !important;
            }
            body > * {
              display: none !important;
            }
            #printable-voucher-container {
              display: block !important;
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #000000 !important;
            }
            #printable-voucher-container * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            #printable-voucher-container table {
              display: table !important;
              width: 100% !important;
            }
            #printable-voucher-container thead {
              display: table-header-group !important;
            }
            #printable-voucher-container tbody {
              display: table-row-group !important;
            }
            #printable-voucher-container tr {
              display: table-row !important;
            }
            #printable-voucher-container th, #printable-voucher-container td {
              display: table-cell !important;
            }
            #printable-voucher-container .grid {
              display: grid !important;
            }
            #printable-voucher-container .flex {
              display: flex !important;
            }
          }
        `}</style>
        <VoucherPrintContent header={header} rows={rows} totalDebit={totalDebit} totalCredit={totalCredit} diff={diff} today={today} allGroups={allGroups} />
      </div>
    </PageShell>
  );
}
