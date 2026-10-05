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
  Check, FileEdit, Copy, GitFork
} from "lucide-react";
import api from "@/api";
import { useApiCache } from "@/hooks/useApiCache";
import { encrypt } from "@/lib/crypto";

import { PersianDatePicker, toPersianDigits } from "@/components/ui/persian-date-picker";
import sanamaCodes from "@/data/sanamaCodes.json";
import subAccountTitles from "@/data/subAccountTitles.json";
import sanamaRequirements from "@/data/sanamaRequirements.json";
import { PersonSanamaField } from "@/components/ui/person-sanama-field";
import { CreditCodeSanamaField } from "@/components/ui/credit-code-sanama-field";
import ShebaInput from "@/components/ui/sheba-input";
import { checkDebitNatureBalance, clearBalanceCache } from "@/lib/accountBalanceCheck";
import { useAuth } from "@/context/AuthContext";
import { useFiscalYear } from "@/context/FiscalYearContext";
import { useTabs } from "@/context/TabContext";
import { DocWorkflowTreeModal } from "@/modules/accounting/components/DocWorkflowTreeModal";

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



function getSubAccountTitle(rowNum) {
  return subAccountTitles.find((t) => t.row === rowNum);
}

function getCreditInfoAutoValue(subAccountCode) {
  if (!subAccountCode) return null;
  const clean = toEnglishDigits(subAccountCode).trim();
  if (!clean) return null;
  const lastChar = clean.slice(-1);
  if (lastChar === "1" || lastChar === "3") {
    return "1"; // "برنامه"
  }
  if (lastChar === "2" || lastChar === "4") {
    return "2"; // "طرح"
  }
  return null;
}

function getRequiredRows(subAccountCode) {
  return sanamaRequirements[subAccountCode]?.requiredRows ?? [];
}

function needsSanamaFields(subAccountCode) {
  return getRequiredRows(subAccountCode).length > 0;
}

function areSanamaRequirementsMatching(subAccountA, subAccountB) {
  if (!subAccountA || !subAccountB) return false;
  const reqsA = getRequiredRows(subAccountA);
  const reqsB = getRequiredRows(subAccountB);
  if (reqsA.length === 0 || reqsB.length === 0) return false;
  if (reqsA.length !== reqsB.length) return false;

  const sortedA = [...reqsA].sort((a, b) => a - b);
  const sortedB = [...reqsB].sort((a, b) => a - b);
  return sortedA.every((val, idx) => val === sortedB[idx]);
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
  const arabicDigits = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];
  let clean = str.toString().replace(/,/g, "").replace(/،/g, "");
  for (let i = 0; i < 10; i++) {
    clean = clean.replace(persianDigits[i], i).replace(arabicDigits[i], i);
  }
  return clean.replace(/[^0-9-]/g, "");
}

function formatNumber(val) {
  if (val == null || val === "") return "";
  const clean = toEnglishDigits(val);
  if (clean === "") return "";
  const n = parseInt(clean, 10);
  if (isNaN(n)) return "";
  return n.toLocaleString("fa-IR");
}

function parseNumber(str) {
  if (str == null || str === "") return 0;
  const clean = toEnglishDigits(str);
  if (clean === "") return 0;
  return parseInt(clean, 10) || 0;
}

function adjustDateToFiscalYear(dateStr, targetFiscalYear) {
  if (!targetFiscalYear) return dateStr || "";
  const fyEng = toEnglishDigits(targetFiscalYear);

  if (!dateStr || dateStr === "0" || dateStr === "00000000") {
    const todayFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric', month: 'numeric', day: 'numeric' });
    const todayParts = toEnglishDigits(todayFormatter.format(new Date())).split("/");
    const month = (todayParts[1] || "01").padStart(2, "0");
    const day = (todayParts[2] || "01").padStart(2, "0");
    return toPersianDigits(`${fyEng}/${month}/${day}`);
  }

  const cleanStr = toEnglishDigits(dateStr);
  const parts = cleanStr.split("/");
  if (parts.length === 3) {
    const month = parts[1].padStart(2, "0");
    const day = parts[2].padStart(2, "0");
    return toPersianDigits(`${fyEng}/${month}/${day}`);
  }
  return dateStr;
}

function getNextSequentialDocNo(targetFY, allDocs = []) {
  const fyStr = String(targetFY || "1405");
  const yearDocs = allDocs.filter(d => String(d.fiscal_year || d.fiscalYear || "").includes(fyStr));
  let maxNo = 0;
  yearDocs.forEach(d => {
    const rawNo = String(d.document_number || d.docNo || "").replace(/\D/g, "");
    const num = parseInt(rawNo, 10);
    if (!isNaN(num) && num > 0 && num < 100000000) {
      if (num > maxNo) maxNo = num;
    }
  });
  return String(maxNo + 1);
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
const DocRow = React.memo(({ row, idx, onChange, onDelete, onDuplicate, isActive, onActivate }) => {
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
    onActivate?.();
    onChange({ ...row, group: val, account: "", subAccount: "", debit: "", credit: "", sanamaFields: {}, isSanamaConfirmed: false, lastTouchTimestamp: Date.now() });
  }

  function setAccount(val) {
    onActivate?.();
    onChange({ ...row, account: val, subAccount: "", debit: "", credit: "", sanamaFields: {}, isSanamaConfirmed: false, lastTouchTimestamp: Date.now() });
  }

  function setSubAccount(val) {
    onActivate?.();
    const autoCreditInfo = getCreditInfoAutoValue(val);
    const initialSanama = {};
    if (autoCreditInfo) {
      initialSanama["sanama_6"] = autoCreditInfo;
    }
    onChange({
      ...row,
      subAccount: val,
      sanamaFields: initialSanama,
      isSanamaConfirmed: false,
      lastTouchTimestamp: Date.now(),
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
        />
      </td>

      {/* عملیات (کپی و حذف) */}
      <td className={`${cellCls} w-16 text-center`}>
        <div className="flex items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDuplicate?.(); }}
            className="text-muted-foreground hover:text-blue-600 transition-colors"
            title={`تکثیر / کپی سطر ${idx + 1}`}
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="text-muted-foreground hover:text-rose-500 transition-colors"
            title={`حذف سطر ${idx + 1}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}, (prev, next) => {
  return prev.idx === next.idx &&
    prev.isActive === next.isActive &&
    prev.row === next.row;
});

// ---- SanamaNumericInput: input عددی با local state برای جلوگیری از از دست دادن focus ----
function SanamaNumericInput({ value, onChange, inputCls, disabled = false, allowDash = false }) {
  const [localVal, setLocalVal] = React.useState(value ?? "");
  const isFocused = React.useRef(false);

  React.useEffect(() => {
    if (!isFocused.current) {
      setLocalVal(value ?? "");
    }
  }, [value]);

  const cleanVal = (val) => {
    if (!val) return "";
    const converted = toEnglishDigits(val);
    return allowDash ? converted.replace(/[^0-9-]/g, "") : converted.replace(/\D/g, "");
  };

  return (
    <input
      type="text"
      inputMode={allowDash ? "text" : "numeric"}
      className={`${inputCls} ${disabled ? "bg-muted cursor-not-allowed opacity-60 text-muted-foreground" : ""}`}
      value={localVal}
      disabled={disabled}
      dir="ltr"
      onFocus={() => { if (!disabled) isFocused.current = true; }}
      onChange={(e) => {
        if (!disabled) {
          const val = cleanVal(e.target.value);
          setLocalVal(val);
        }
      }}
      onBlur={() => {
        if (!disabled) {
          isFocused.current = false;
          const val = cleanVal(localVal);
          setLocalVal(val);
          onChange(val);
        }
      }}
    />
  );
}

// wrapper: label کوچک خاکستری بالا، input پایین
function SanamaWrap({ title, children, wide = false, hasError = false, errorMsg = "این الزام تکمیل شود" }) {
  return (
    <div className={`flex flex-col gap-1 min-w-0 w-full overflow-hidden ${wide ? "sm:col-span-2" : ""}`}>
      <span
        className={`text-[10px] font-medium leading-none truncate ${hasError ? "text-rose-600 font-semibold" : "text-muted-foreground/80"}`}
        title={title}
      >
        {title}
      </span>
      <div className="w-full min-w-0">
        {children}
      </div>
      {hasError && (
        <span className="text-[11px] text-rose-600 font-medium mt-0.5 animate-in fade-in duration-150">
          {errorMsg}
        </span>
      )}
    </div>
  );
}

// ---- SanamaField: رندر یک فیلد سناما بر اساس نوع ردیف ----
function SanamaField({ rowDef, value, onChange, optional, disabled = false, hasError = false }) {
  const errInputCls = hasError ? "border-rose-500 ring-1 ring-rose-500/50 text-rose-700" : "";
  const inputCls = `h-8 text-xs rounded-md border ${hasError ? "border-rose-500 ring-1 ring-rose-500/50" : "border-input"} bg-white px-2.5 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 w-full transition-all placeholder:text-muted-foreground/40`;

  const placeholder = disabled
    ? "غیرفعال (فصل دیگر انتخاب شد)"
    : optional
      ? `${rowDef.default ?? "0"}`
      : "انتخاب کنید...";

  const errSelectCls = hasError ? "border-rose-500 ring-1 ring-rose-500/50" : "";

  // dropdown ساده
  if (rowDef.values) {
    const opts = rowDef.values.map((v) => ({ value: String(v.type), label: v.title }));
    let selVal = value !== undefined && value !== null ? String(value) : "";
    const matchByTitle = rowDef.values.find((v) => v.title === selVal || String(v.type) === selVal);
    if (matchByTitle) {
      selVal = String(matchByTitle.type);
    }
    return (
      <SanamaWrap title={rowDef.title} hasError={hasError}>
        <SearchableSelect
          value={selVal}
          onChange={(v) => onChange(v || "")}
          options={opts}
          placeholder={disabled && !selVal ? "غیرفعال" : placeholder}
          searchable={opts.length > 8}
          disabled={disabled}
          className={errSelectCls}
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
      <SanamaWrap title={rowDef.title} hasError={hasError}>
        <SearchableSelect
          value={value !== undefined && value !== null ? String(value) : ""}
          onChange={(v) => onChange(v || "")}
          options={opts}
          placeholder={placeholder}
          disabled={disabled}
          className={errSelectCls}
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
      <SanamaWrap title={rowDef.title} hasError={hasError}>
        <PersianDatePicker
          value={dateStr}
          onChange={(e) => {
            const rawVal = e?.target?.value ?? e;
            onChange(rawVal || "");
          }}
          placeholder="۱۴۰۵/۰۱/۰۱"
          disabled={disabled}
          className={errSelectCls}
        />
      </SanamaWrap>
    );
  }

  // input عددی
  if ("default" in rowDef) {
    if (rowDef.row === 8) {
      return (
        <SanamaWrap title={rowDef.title} wide hasError={hasError}>
          <CreditCodeSanamaField value={value} onChange={onChange} inputCls={inputCls} disabled={disabled} hasError={hasError} />
        </SanamaWrap>
      );
    }
    if (rowDef.row === 31 || (rowDef.title && rowDef.title.includes("شبا"))) {
      return (
        <SanamaWrap title={rowDef.title} wide hasError={hasError}>
          <ShebaInput value={value} onChange={onChange} disabled={disabled} hasError={hasError} />
        </SanamaWrap>
      );
    }
    const allowDash = rowDef.row === 7 || (rowDef.title && rowDef.title.includes("شماره ردیف"));
    return (
      <SanamaWrap title={rowDef.title} hasError={hasError}>
        <SanamaNumericInput value={value} onChange={onChange} inputCls={inputCls} disabled={disabled} allowDash={allowDash} hasError={hasError} />
      </SanamaWrap>
    );
  }

  // ردیف اشخاص
  if (rowDef.types) {
    return (
      <SanamaWrap title={rowDef.title} wide hasError={hasError}>
        <PersonSanamaField value={value} onChange={onChange} showLabel={false} labelCls="" required={!optional && !disabled} disabled={disabled} hasError={hasError} />
      </SanamaWrap>
    );
  }

  return null;
}

// فیلدهایی که اختیاری‌اند
const OPTIONAL_ROWS = new Set();

function SanamaExtraFields({ row, allRows, onSanamaChange, onConfirmRow, onEditRow, onCopySanama }) {
  const [localConfirmed, setLocalConfirmed] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const isConfirmed = row.isSanamaConfirmed ?? localConfirmed;
  const requiredRows = getRequiredRows(row.subAccount);
  if (!requiredRows.length) return null;

  const availableSourceRows = (allRows || []).filter(
    (r) => r.id !== row.id && r.subAccount && getRequiredRows(r.subAccount).length > 0
  );
  const currIndex = (allRows || []).findIndex((r) => r.id === row.id) + 1;
  const prevRow = currIndex > 1 ? (allRows || [])[currIndex - 2] : null;
  const hasPrevRowSanama = prevRow && prevRow.subAccount && getRequiredRows(prevRow.subAccount).length > 0;

  const isDebit = parseFloat(String(row.debit || "").replace(/,/g, "")) > 0;
  const isCredit = parseFloat(String(row.credit || "").replace(/,/g, "")) > 0;

  const acctCode = row.subAccount || "";
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
    ? { bar: "bg-blue-500", header: "bg-blue-50/70  border-blue-100", badge: "bg-blue-100 text-blue-700 border-blue-200", label: "بدهکار", amount: "text-blue-700" }
    : isCredit
      ? { bar: "bg-rose-500", header: "bg-rose-50/70  border-rose-100", badge: "bg-rose-100 text-rose-700 border-rose-200", label: "بستانکار", amount: "text-rose-700" }
      : { bar: "bg-muted", header: "bg-muted/30    border-border", badge: "bg-muted text-muted-foreground border-border", label: "—", amount: "text-muted-foreground" };

  const creditTypeValue = row.sanamaFields?.["sanama_5"];
  const autoCreditInfo = getCreditInfoAutoValue(row.subAccount);

  useEffect(() => {
    if (autoCreditInfo && requiredRows.includes(6) && row.sanamaFields?.["sanama_6"] !== autoCreditInfo) {
      onSanamaChange?.("sanama_6", autoCreditInfo);
    }
  }, [row.subAccount, requiredRows, row.sanamaFields, autoCreditInfo, onSanamaChange]);

  const handleConfirmSanama = () => {
    const newErrors = {};
    let hasEmpty = false;

    const hasRow9 = requiredRows.includes(9);
    const hasRow11 = requiredRows.includes(11);
    const hasBothChapters = hasRow9 && hasRow11;

    const valRow9 = row.sanamaFields?.["sanama_9"];
    const valRow11 = row.sanamaFields?.["sanama_11"];

    const isRow9Filled = Boolean(valRow9 && String(valRow9).trim() !== "" && String(valRow9) !== "0");
    const isRow11Filled = Boolean(valRow11 && String(valRow11).trim() !== "" && String(valRow11) !== "0");

    requiredRows.forEach((rowNum) => {
      const isNotifiedCredit = creditTypeValue === "2" || creditTypeValue === "ابلاغی";
      if (rowNum === 15 && !isNotifiedCredit) return;

      let disabled = false;
      if (hasBothChapters) {
        if (rowNum === 11 && isRow9Filled) disabled = true;
        if (rowNum === 9 && isRow11Filled) disabled = true;
      }

      if (!disabled) {
        const fieldKey = `sanama_${rowNum}`;
        const val = row.sanamaFields?.[fieldKey];
        if (!val || String(val).trim() === "" || String(val) === "0") {
          newErrors[fieldKey] = true;
          hasEmpty = true;
        }
      }
    });

    if (hasEmpty) {
      setFieldErrors(newErrors);
      return;
    }

    setFieldErrors({});
    setLocalConfirmed(true);
    onConfirmRow?.(row.id);
  };

  // خلاصه تفصیلی‌های پر شده
  const filledSummaries = requiredRows.map((rowNum) => {
    const rowDef = getSubAccountTitle(rowNum);
    if (!rowDef) return null;
    const isNotifiedCredit = creditTypeValue === "2" || creditTypeValue === "ابلاغی";
    if (rowNum === 15 && !isNotifiedCredit) return null;

    const autoVal = rowNum === 6 ? autoCreditInfo : null;
    const fieldKey = `sanama_${rowNum}`;
    const val = autoVal || row.sanamaFields?.[fieldKey];
    if (!val || val === "0" || val === "") return null;

    let displayVal = val;
    if (rowDef.values) {
      const match = rowDef.values.find((v) => String(v.type) === String(val) || v.title === String(val));
      if (match) displayVal = match.title;
    } else if (rowDef.groups) {
      for (const g of rowDef.groups) {
        const match = g.values.find((v) => String(v.type) === String(val) || v.title === String(val));
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

        {/* دکمه ثبت / ویرایش / کپی تفصیلی */}
        <div className="shrink-0 flex items-center gap-2" dir="rtl">
          {availableSourceRows.length > 0 && !isConfirmed && (
            <div className="flex items-center gap-1.5">
              {hasPrevRowSanama && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 h-7 text-xs bg-blue-50/90 hover:bg-blue-100 text-blue-800 border-blue-200 font-medium"
                  onClick={() => onCopySanama?.(row.id, prevRow.id)}
                  title={`کپی تفصیلی از سطر ${currIndex - 1}`}
                >
                  <Copy className="h-3.5 w-3.5 text-blue-600" />
                  کپی از سطر قبل ({currIndex - 1})
                </Button>
              )}
              <select
                className="h-7 text-xs rounded border border-blue-200 bg-blue-50/50 text-blue-900 px-2 py-0 cursor-pointer font-medium hover:bg-blue-100/70"
                defaultValue=""
                onChange={(e) => {
                  const sourceId = Number(e.target.value);
                  if (sourceId) {
                    onCopySanama?.(row.id, sourceId);
                    e.target.value = "";
                  }
                }}
              >
                <option value="" disabled>کپی از تفصیلی سطر...</option>
                {availableSourceRows.map((srcRow) => {
                  const idx = (allRows || []).findIndex((r) => r.id === srcRow.id) + 1;
                  return (
                    <option key={srcRow.id} value={srcRow.id}>
                      سطر {idx} (معین {srcRow.subAccount})
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {isConfirmed ? (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 h-7 text-xs bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300 font-medium"
              onClick={() => {
                setLocalConfirmed(false);
                onEditRow?.(row.id);
              }}
            >
              <FileEdit className="h-3.5 w-3.5 text-amber-600" />
              ویرایش تفصیلی
            </Button>
          ) : (
            <Button
              size="sm"
              variant="default"
              className="gap-1.5 h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs"
              onClick={handleConfirmSanama}
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

            const hasRow9 = requiredRows.includes(9);
            const hasRow11 = requiredRows.includes(11);
            const hasBothChapters = hasRow9 && hasRow11;

            const valRow9 = row.sanamaFields?.["sanama_9"];
            const valRow11 = row.sanamaFields?.["sanama_11"];

            const isRow9Filled = Boolean(valRow9 && String(valRow9).trim() !== "" && String(valRow9) !== "0");
            const isRow11Filled = Boolean(valRow11 && String(valRow11).trim() !== "" && String(valRow11) !== "0");

            let disabled = false;
            let optional = OPTIONAL_ROWS.has(rowNum);

            if (rowNum === 6 && autoCreditInfo) {
              disabled = true;
            }

            if (hasBothChapters) {
              if (rowNum === 11 && isRow9Filled) {
                disabled = true;
                optional = true;
              } else if (rowNum === 9 && isRow11Filled) {
                disabled = true;
                optional = true;
              }
            }

            const fieldKey = `sanama_${rowNum}`;
            const fieldVal = (rowNum === 6 && autoCreditInfo) ? autoCreditInfo : row.sanamaFields?.[fieldKey];
            const hasErr = Boolean(fieldErrors[fieldKey]);
            return (
              <SanamaField
                key={rowNum}
                rowDef={rowDef}
                value={fieldVal}
                optional={optional}
                disabled={disabled}
                hasError={hasErr}
                onChange={(val) => {
                  onSanamaChange(fieldKey, val);
                  if (fieldErrors[fieldKey]) {
                    setFieldErrors((prev) => ({ ...prev, [fieldKey]: false }));
                  }
                }}
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
          <div className="col-span-3 mt-1"><span className="text-gray-600">شرح کلی سند:</span> <span className="font-medium">{header.desc || "—"}</span></div>
        </div>
      </div>

      {/* جدول ردیف‌های سند */}
      <table className="w-full text-xs border-collapse border border-gray-800 my-2" dir="rtl">
        <thead>
          <tr className="bg-gray-100 border-b border-gray-800 text-gray-900 font-bold">
            <th className="border border-gray-800 p-2 text-center w-16">ردیف</th>
            <th className="border border-gray-800 p-2 text-right w-44">گروه و کل</th>
            <th className="border border-gray-800 p-2 text-right">حساب معین</th>
            <th className="border border-gray-800 p-2 text-center w-36">بدهکار (ریال)</th>
            <th className="border border-gray-800 p-2 text-center w-36">بستانکار (ریال)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            const grpObj = allGroups.find(g => g.code === row.group);
            const acctObj = getAccounts(row.group).find(a => a.code === row.account);
            const subObj = getSubAccounts(row.group, row.account).find(s => s.code === row.subAccount);

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
            <td colSpan={3} className="border border-gray-800 p-2 text-left">جمع کل:</td>
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
          <div className="mb-8">تنظیم حساب</div>
          <div className="text-[10px] text-gray-500 font-normal">امضا / تاریخ</div>
        </div>
        <div className="border border-gray-300 p-3 rounded">
          <div className="mb-8">رئیس اعتبارات</div>
          <div className="text-[10px] text-gray-500 font-normal">امضا / تاریخ</div>
        </div>
        <div className="border border-gray-300 p-3 rounded">
          <div className="mb-8">مدیر مالی / ذیحساب</div>
          <div className="text-[10px] text-gray-500 font-normal">امضا / تاریخ</div>
        </div>
        <div className="border border-gray-300 p-3 rounded">
          <div className="mb-8">رئیس دستگاه اجرایی</div>
          <div className="text-[10px] text-gray-500 font-normal">امضا / تاریخ</div>
        </div>
      </div>
    </div>
  );
}

// ---- component اصلی ----
export default function ManualDocument() {
  const { user: currentUser } = useAuth();
  const { selectedFiscalYear } = useFiscalYear();
  const { closeTab, activeTabId, tabs } = useTabs();
  const location = useLocation();
  const navigate = useNavigate();
  const urlParamId = new URLSearchParams(location.search).get("id");
  const initialDocId = location.state?.copyMode ? null : (location.state?.docId || urlParamId);
  const copySourceId = location.state?.copyMode ? location.state?.docId : null;

  const handleExit = useCallback(() => {
    const currentTab = tabs?.find(t => t.id === activeTabId || t.path?.startsWith("/document-setup/manual-doc"));
    if (currentTab && closeTab) {
      closeTab(currentTab.id);
    } else if (activeTabId && closeTab) {
      closeTab(activeTabId);
    } else {
      navigate("/document-setup/docs-list");
    }
  }, [closeTab, activeTabId, tabs, navigate]);

  const [docId, setDocId] = useState(initialDocId);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      setMessage(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [message]);

  const today = new Date().toLocaleDateString("fa-IR").replace(/\//g, "/");

  const activeFY = selectedFiscalYear || localStorage.getItem("activeFiscalYear") || "1405";

  const [header, setHeader] = useState(() => ({
    fiscalYear: activeFY,
    docNo: "",
    docDate: adjustDateToFiscalYear(today, activeFY),
    docType: "موقت",
    access: "عادی",
    desc: "",
    letterNo: "",
    letterDate: adjustDateToFiscalYear(today, activeFY),
    status: "ثبت اولیه",
    returnedUser: "",
  }));

  useEffect(() => {
    if (selectedFiscalYear) {
      api.get("/api/documents").then((res) => {
        const allDocs = res.data?.data || [];
        const nextNo = getNextSequentialDocNo(selectedFiscalYear, allDocs);
        setHeader((h) => ({
          ...h,
          fiscalYear: selectedFiscalYear,
          docNo: docId ? h.docNo : nextNo,
          docDate: adjustDateToFiscalYear(h.docDate, selectedFiscalYear),
          letterDate: h.letterDate ? adjustDateToFiscalYear(h.letterDate, selectedFiscalYear) : adjustDateToFiscalYear("", selectedFiscalYear),
        }));
      }).catch(() => {
        setHeader((h) => ({
          ...h,
          fiscalYear: selectedFiscalYear,
          docDate: adjustDateToFiscalYear(h.docDate, selectedFiscalYear),
          letterDate: h.letterDate ? adjustDateToFiscalYear(h.letterDate, selectedFiscalYear) : adjustDateToFiscalYear("", selectedFiscalYear),
        }));
      });
    }
  }, [selectedFiscalYear, docId]);

  const [fiscalYears, setFiscalYears] = useState([]);
  const [systemUsers, setSystemUsers] = useState([]);

  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await api.get("/api/users");
        if (res.data?.success) {
          setSystemUsers(res.data.data || []);
        }
      } catch (err) {
        console.error("Error loading system users:", err);
      }
    }
    loadUsers();
  }, []);

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
            position: relative;
          }
          body::before {
            content: "" !important;
            position: fixed !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: 450px !important;
            height: 450px !important;
            max-width: 65vw !important;
            max-height: 65vh !important;
            background-image: url('/company_logo.png') !important;
            background-repeat: no-repeat !important;
            background-position: center !important;
            background-size: contain !important;
            opacity: 0.08 !important;
            pointer-events: none !important;
            z-index: -1 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
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
        }
      } catch (err) {
        console.error("Error loading fiscal years:", err);
      }
    }
    loadFiscalYears();
  }, []);

  const [rows, setRows] = useState([{ ...EMPTY_ROW, id: 1 }]);
  const [activeRowId, setActiveRowId] = useState(1);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [loadedDoc, setLoadedDoc] = useState(null);
  const [showTreeModal, setShowTreeModal] = useState(false);

  const activeRow = rows.find((r) => r.id === activeRowId) ?? rows[0];
  const showSanamaFields = needsSanamaFields(activeRow?.subAccount);

  useEffect(() => {
    setDocId(initialDocId);
  }, [initialDocId]);

  useEffect(() => {
    let isMounted = true;
    async function fetchDoc() {
      const sourceId = docId || copySourceId;

      if (!sourceId) {
        setLoadedDoc(null);
        // اگر کاربر درخواست ثبت سند جدید داده، چک کنیم که آیا پیش‌نویس دارد یا نه
        try {
          const res = await api.get("/api/documents");
          if (!isMounted) return;
          const allDocs = res.data.data || [];
          const existingDraft = allDocs.find((d) => {
            if (d.status !== "DRAFT") return false;
            if (!activeFY) return true;
            const dYear = String(d.fiscal_year || d.fiscalYear || d.document_date?.slice(0, 4) || "");
            return dYear.includes(String(activeFY));
          });
          if (existingDraft) {
            setDocId(existingDraft._id);
            navigate(`/document-setup/manual-doc?id=${existingDraft._id}`, { replace: true });
            setMessage({
              type: "error",
              text: `شما یک سند پیش‌نویس (شماره سند: ${existingDraft.document_number || "نامشخص"}) در این سال مالی دارید. لطفاً ابتدا آن را تکمیل یا حذف کنید تا بتوانید سند جدیدی ثبت نمایید.`,
            });
            return;
          }
          const nextNo = getNextSequentialDocNo(activeFY, allDocs);
          setHeader((h) => ({ ...h, docNo: nextNo }));
        } catch (err) {
          console.error("Error checking draft documents:", err);
        }
        return;
      }

      setLoading(true);
      try {
        const res = await api.get(`/api/documents/${sourceId}`);
        if (!isMounted) return;
        const doc = res.data.data;
        if (doc) {
          setLoadedDoc(doc);
          const isDocFinal = (doc.status === "CONFIRMED" || doc.status === "صدور سند قطعی" || doc.status === "FINAL" || doc.workflowStep === "FINAL") && !copySourceId;
          const uStr = currentUser
            ? `${currentUser.position || ""} ${currentUser.role || ""} ${currentUser.userGroup || ""} ${currentUser.workflowLevel || ""} ${currentUser.username || ""}`.toLowerCase()
            : "admin";
          const isAdminUser = !currentUser || currentUser.isAdmin === true || uStr.includes("admin") || uStr.includes("مدیر سیستم") || uStr.includes("مدیرکل");
          const isCurrentStepAccountant = doc.workflowStep === "ACCOUNTANT" || doc.workflowStep === "DRAFT" || (doc.status || "").includes("برگشت") || (doc.status || "").includes("ابطال");
          
          const isDocPermRejected = doc.isPermanentlyRejected || (doc.rejectionCount || 0) >= 3 || doc.workflowStep === "PERMANENTLY_REJECTED";
          const canEditThisDoc = copySourceId ? true : (!isDocPermRejected && (isAdminUser || isCurrentStepAccountant));
          setIsReadOnly(!canEditThisDoc);

          const targetFY = selectedFiscalYear || String(doc.fiscal_year || "1405");
          let docNoVal = doc.document_number || "";
          if (copySourceId) {
            try {
              const resAll = await api.get("/api/documents");
              docNoVal = getNextSequentialDocNo(targetFY, resAll.data?.data || []);
            } catch {
              docNoVal = "۱";
            }
          }

          let mappedStatus = "پیش‌نویس";
          if (isDocPermRejected) {
            mappedStatus = "ابطال‌شده";
          } else if (doc.status === "CONFIRMED" || doc.status === "FINAL" || doc.status === "صدور سند قطعی" || doc.workflowStep === "FINAL") {
            mappedStatus = "صدور سند قطعی";
          } else if (doc.status === "REJECTED" || doc.status?.startsWith("ابطال") || doc.status?.includes("رد") || doc.status?.includes("برگشت")) {
            mappedStatus = "ابطال‌شده";
          } else if (doc.status === "APPROVED" || doc.status === "تأییدشده") {
            mappedStatus = "تأییدشده";
          } else if (doc.status === "DRAFT" || doc.status === "پیش‌نویس") {
            mappedStatus = "پیش‌نویس";
          } else {
            mappedStatus = "ثبت اولیه";
          }

          let returnedUserVal = doc.rawHeader?.returnedUser || "";
          if ((mappedStatus === "ابطال‌شده" || doc.status === "REJECTED") && !returnedUserVal && doc.workflowHistory && doc.workflowHistory.length > 0) {
            const lastReject = [...doc.workflowHistory].reverse().find(h => h.action === "REJECT" || h.action === "PERMANENT_REJECT" || h.action === "رد" || h.fromStep?.includes("رد"));
            if (lastReject) {
              returnedUserVal = lastReject.user;
            }
          }

          setHeader({
            fiscalYear: targetFY,
            docNo: docNoVal,
            docDate: adjustDateToFiscalYear(doc.document_date || today, targetFY),
            docType: doc.rawHeader?.docType ||
              (doc.document_type === "CLOSING" ? "اختتامیه" :
                doc.document_type === "TRANSFER" ? "دائم" : "موقت"),
            access: doc.rawHeader?.access || "عادی",
            desc: copySourceId ? `کپی از سند ${doc.document_number}` : (doc.description || ""),
            letterNo: doc.reference_number || "",
            letterDate: doc.rawHeader?.letterDate ? adjustDateToFiscalYear(doc.rawHeader.letterDate, targetFY) : adjustDateToFiscalYear("", targetFY),
            status: mappedStatus,
            returnedUser: returnedUserVal,
            rejectionCount: doc.rejectionCount || 0,
            isPermanentlyRejected: isDocPermRejected,
          });

          if (isDocPermRejected && !copySourceId) {
            setMessage({
              type: "error",
              text: `⛔ این سند (شماره سند: ${doc.document_number}) به دلیل رسیدن به حد مجاز (۳ بار رد شدن)، به طور دائم رد و ابطال گردیده است. تمامی اطلاعات در حالت فقط‌خواندنی قرار دارد و امکان ارسال یا ویرایش مجدد وجود ندارد.`,
            });
          } else if (!canEditThisDoc && !copySourceId) {
            if (isDocFinal) {
              setMessage({
                type: "warning",
                text: `🔒 این سند (شماره سند: ${doc.document_number}) به صورت قطعی و نهایی تأیید شده است. تمامی اطلاعات در حالت فقط‌خواندنی قرار دارد و امکان تغییر وجود ندارد.`,
              });
            } else {
              setMessage({
                type: "warning",
                text: `🔒 این سند (شماره سند: ${doc.document_number}) جهت بررسی به تنظیم حساب / مراحل بعد ارسال شده و در کارتابل شما دیگر قابل تغییر نمی‌باشد.`,
              });
            }
          } else if (doc.status === "DRAFT") {
            setMessage({
              type: "error",
              text: `این سند در وضعیت «پیش‌نویس» قرار دارد (شماره سند: ${doc.document_number}). لطفاً پس از اصلاح موارد، روی «ثبت تغییرات» کلیک کنید.`,
            });
          }

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
    if (isReadOnly) {
      const isDocFinal = loadedDoc && (loadedDoc.status === "CONFIRMED" || loadedDoc.status === "صدور سند قطعی" || loadedDoc.status === "FINAL" || loadedDoc.workflowStep === "FINAL");
      const isDocPermRejected = loadedDoc && (loadedDoc.isPermanentlyRejected || (loadedDoc.rejectionCount || 0) >= 3 || loadedDoc.workflowStep === "PERMANENTLY_REJECTED");

      if (isDocPermRejected) {
        setMessage({ type: "error", text: "خطا: این سند به طور دائم رد و ابطال شده است و امکان ویرایش آن وجود ندارد." });
      } else if (isDocFinal) {
        setMessage({ type: "error", text: "خطا: این سند قطعی شده است و امکان ویرایش آن وجود ندارد." });
      } else {
        setMessage({ type: "error", text: "خطا: این سند جهت بررسی به مراحل بعدی ارسال شده و در کارتابل شما قابل تغییر نیست." });
      }
      return;
    }
    // ─── ۱. بررسی سطوح دسترسی اولیه ───────────────────────────────────────
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
    }

    // ─── ۲. جمع‌آوری خطاهایی که مانع تایید نهایی سند می‌شوند (اما مانع ذخیره پیش‌نویس نیستند) ───
    const validationErrors = [];

    // ۱. بررسی انتخاب تاریخ سند
    if (!header.docDate || !String(header.docDate).trim() || String(header.docDate).trim() === "—") {
      validationErrors.push("تاریخ سند تنظیم نشده است.");
    }

    // ۲. بررسی حداقل یک ردیف کامل
    const validRows = rows.filter(r => r.group && r.account && r.subAccount);
    if (validRows.length === 0) {
      validationErrors.push("حداقل یک ردیف کامل (گروه، کل، معین) ثبت نشده است.");
    }

    // ۳. بررسی تراز بودن سند
    if (diff !== 0) {
      validationErrors.push(`سند ناتراز است (اختلاف: ${Math.abs(diff).toLocaleString("fa-IR")} ریال).`);
    }

    // ۴. بررسی کنترل ماهیت و مانده کلیه حساب‌ها (از اولین سند تا سند جاری)
    const balanceRows = rows
      .filter(r => r.subAccount)
      .map(r => ({
        subAccount: r.subAccount,
        debit: parseNumber(r.debit),
        credit: parseNumber(r.credit),
      }));
    if (balanceRows.length > 0) {
      const balanceError = await checkDebitNatureBalance(balanceRows, docId || null);
      if (balanceError) {
        setMessage({ type: "error", text: balanceError });
        setLoading(false);
        return;
      }
    }

    // ۵. بررسی الزامات سناما برای تمامی ردیف‌ها
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (r.group && r.account && r.subAccount) {
        const requiredRows = getRequiredRows(r.subAccount);
        const creditTypeValue = r.sanamaFields?.["sanama_5"];
        const isNotifiedCredit = creditTypeValue === "2" || creditTypeValue === "ابلاغی";

        const hasRow9 = requiredRows.includes(9);
        const hasRow11 = requiredRows.includes(11);
        const isRow9Filled = Boolean(r.sanamaFields?.["sanama_9"] && String(r.sanamaFields["sanama_9"]).trim() !== "" && String(r.sanamaFields["sanama_9"]) !== "0");
        const isRow11Filled = Boolean(r.sanamaFields?.["sanama_11"] && String(r.sanamaFields["sanama_11"]).trim() !== "" && String(r.sanamaFields["sanama_11"]) !== "0");

        for (const rowNum of requiredRows) {
          if (rowNum === 15 && !isNotifiedCredit) continue;

          // غیرفعال و عدم الزام متقابل فصول اعتبارات (۹ و ۱۱)
          if (rowNum === 11 && hasRow9 && isRow9Filled) continue;
          if (rowNum === 9 && hasRow11 && isRow11Filled) continue;

          const rowDef = getSubAccountTitle(rowNum);
          const fieldKey = `sanama_${rowNum}`;
          const isOptional = OPTIONAL_ROWS.has(rowNum);
          const val = r.sanamaFields?.[fieldKey];
          if (!isOptional && (!val || String(val).trim() === "")) {
            validationErrors.push(`در ردیف ${i + 1}، فیلد سناما «${rowDef?.title ?? `ردیف ${rowNum}`}» برای معین ${r.subAccount} تکمیل نشده است.`);
            break;
          }
        }
      }
    }

    // ۶. بررسی سقف مبالغ مالی کاربر
    if (currentUser && currentUser.role !== "admin") {
      const totalDebit = rows.reduce((sum, r) => sum + parseNumber(r.debit), 0);
      if (currentUser.financialLimitMax > 0 && totalDebit > currentUser.financialLimitMax) {
        validationErrors.push(`مبلغ کل سند (${totalDebit.toLocaleString("fa-IR")} ریال) بیشتر از سقف مجاز کاربر است.`);
      }
      if (currentUser.financialLimitMin > 0 && totalDebit < currentUser.financialLimitMin) {
        validationErrors.push(`مبلغ کل سند (${totalDebit.toLocaleString("fa-IR")} ریال) کمتر از حداقل مجاز کاربر است.`);
      }
    }

    const hasValidationError = validationErrors.length > 0;

    // ─── تعیین وضعیت نهایی جهت ذخیره در سرور ───
    let statusMapped = "DRAFT";
    if (!hasValidationError) {
      if (header.status === "رد شده") {
        statusMapped = "CANCELLED";
      } else {
        statusMapped = "CONFIRMED";
      }

      if (currentUser && currentUser.role !== "admin" && statusMapped === "CONFIRMED" && !currentUser.permissions?.["doc.approve"]) {
        statusMapped = "DRAFT";
      }
    }

    setLoading(true);
    setMessage(null);

    try {
      const finalDocDate = adjustDateToFiscalYear(header.docDate, header.fiscalYear);

      const updatedHeader = {
        ...header,
        docDate: finalDocDate,
        status: hasValidationError ? "پیش‌نویس" : (header.status || "ثبت اولیه"),
        workflowStep: header.workflowStep || "REGULATOR",
        currentAssigneeRole: header.currentAssigneeRole || "تنظیم حساب",
      };

      const sensitiveState = {
        header: updatedHeader,
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

      const payload = {
        document_type: docTypeMapped,
        fiscal_year: Number(header.fiscalYear) || 1405,
        document_date: finalDocDate,
        status: hasValidationError ? "DRAFT" : (header.status || "ثبت اولیه"),
        workflowStep: header.workflowStep || "REGULATOR",
        currentAssigneeRole: header.currentAssigneeRole || "تنظیم حساب",
        returnedUser: header.returnedUser || "",
        rejectionReason: header.rejectionReason || "",
        ciphertext: encryptedHex,
      };

      const res = docId
        ? await api.put(`/api/documents/${docId}`, payload)
        : await api.post("/api/documents", payload);

      const savedDocNumber = res.data.data.document_number;
      const savedDocId = res.data.data._id || docId;

      if (savedDocId) {
        setDocId(savedDocId);
        navigate(`/document-setup/manual-doc?id=${savedDocId}`, { replace: true });
      }

      setHeader(prev => ({
        ...prev,
        status: hasValidationError ? "پیش‌نویس" : (prev.status || "ثبت اولیه"),
        docNo: savedDocNumber || prev.docNo
      }));

      clearBalanceCache();

      if (hasValidationError) {
        setMessage({
          type: "warning",
          text: `سند شماره ${savedDocNumber} به عنوان «پیش‌نویس» ذخیره شد (آخرین تغییرات شما حفظ گردید). مواردی که باید برای تایید نهایی اصلاح شوند: ${validationErrors.join(" | ")}`
        });
      } else {
        setMessage({
          type: "success",
          text: `سند شماره ${savedDocNumber} با موفقیت تایید و ثبت نهایی گردید.`
        });
      }
    } catch (err) {
      console.error("Save error:", err);
      const errData = err.response?.data;
      setMessage({ type: "error", text: errData?.message || "خطا در ثبت سند در سرور. اتصال را بررسی کنید." });
    } finally {
      setLoading(false);
    }
  }

  async function handleNew() {
    const activeFY = selectedFiscalYear || localStorage.getItem("activeFiscalYear") || "1405";
    let nextNo = "1";
    try {
      const res = await api.get("/api/documents");
      const allDocs = res.data.data || [];
      const existingDraft = allDocs.find((d) => {
        if (d.status !== "DRAFT") return false;
        if (!activeFY) return true;
        const dYear = String(d.fiscal_year || d.fiscalYear || d.document_date?.slice(0, 4) || "");
        return dYear.includes(String(activeFY));
      });
      if (existingDraft) {
        setMessage({
          type: "error",
          text: `امکان ثبت سند جدید وجود ندارد! شما یک سند پیش‌نویس (شماره سند: ${existingDraft.document_number || "نامشخص"}) در این سال مالی دارید. لطفاً ابتدا آن را تکمیل یا حذف نمایید.`,
        });
        return;
      }
      nextNo = getNextSequentialDocNo(activeFY, allDocs);
    } catch (err) {
      console.error("Error checking draft on handleNew:", err);
    }

    setHeader({
      fiscalYear: activeFY,
      docNo: nextNo,
      docDate: adjustDateToFiscalYear(today, activeFY),
      docType: "موقت",
      access: "عادی",
      desc: "",
      letterNo: "",
      letterDate: adjustDateToFiscalYear(today, activeFY),
      status: "صدور سند",
    });
    setDocId(null);
    const newId = Date.now();
    setRows([{ ...EMPTY_ROW, id: newId }]);
    setActiveRowId(newId);
    setMessage(null);
    navigate("/document-setup/manual-doc", { replace: true });
  }

  const setH = useCallback((k, v) => setHeader((p) => ({ ...p, [k]: v })), []);

  const addRow = useCallback(() => {
    const id = Date.now();
    setRows((prev) => [...prev, { ...EMPTY_ROW, id, lastTouchTimestamp: Date.now() }]);
    setActiveRowId(id);
  }, []);

  const updateRow = useCallback((id, updated) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...updated, lastTouchTimestamp: updated.lastTouchTimestamp || Date.now() }
          : r
      )
    );
  }, []);

  const deleteRow = useCallback((id) => {
    setRows((prev) => {
      if (prev.length <= 1) {
        return [{ ...EMPTY_ROW, id: Date.now() }];
      }
      return prev.filter((r) => r.id !== id);
    });
    setActiveRowId((curr) => (curr === id ? null : curr));
  }, []);

  const handleConfirmSanamaRow = useCallback((rowId) => {
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, isSanamaConfirmed: true } : r))
    );
  }, []);

  const handleEditSanamaRow = useCallback((rowId) => {
    setActiveRowId(rowId);
    setRows((prev) =>
      prev.map((r) =>
        r.id === rowId
          ? { ...r, isSanamaConfirmed: false, lastTouchTimestamp: Date.now() }
          : r
      )
    );
  }, []);

  const handleSanamaChange = useCallback((rowId, fieldKey, val) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;

        const reqRows = getRequiredRows(r.subAccount);
        const hasBothChapters = reqRows.includes(9) && reqRows.includes(11);
        const newSanamaFields = { ...r.sanamaFields, [fieldKey]: val };

        if (hasBothChapters) {
          if (fieldKey === "sanama_9" && val && String(val).trim() !== "" && String(val) !== "0") {
            newSanamaFields["sanama_11"] = "";
          } else if (fieldKey === "sanama_11" && val && String(val).trim() !== "" && String(val) !== "0") {
            newSanamaFields["sanama_9"] = "";
          }
        }

        return {
          ...r,
          lastTouchTimestamp: Date.now(),
          sanamaFields: newSanamaFields,
        };
      })
    );
  }, []);

  const handleCopySanamaFields = useCallback((targetRowId, sourceRowId) => {
    const targetRow = rows.find((r) => r.id === targetRowId);
    const sourceRow = rows.find((r) => r.id === sourceRowId);

    if (!targetRow || !sourceRow) return;

    const sourceIdx = rows.findIndex((r) => r.id === sourceRowId) + 1;
    const targetIdx = rows.findIndex((r) => r.id === targetRowId) + 1;

    const targetReqRows = getRequiredRows(targetRow.subAccount);
    const sourceReqRows = getRequiredRows(sourceRow.subAccount);

    if (targetReqRows.length === 0) {
      setMessage({
        type: "error",
        text: `سطر ${targetIdx} فیلد تفصیلی سناما ندارد.`,
      });
      return;
    }

    if (sourceReqRows.length === 0) {
      setMessage({
        type: "error",
        text: `سطر ${sourceIdx} فیلد تفصیلی برای کپی ندارد.`,
      });
      return;
    }

    // استخراج فیلدهای تفصیلی مشترک بین دو گروه
    const commonReqRows = targetReqRows.filter((rNum) => sourceReqRows.includes(rNum));

    if (commonReqRows.length === 0) {
      setMessage({
        type: "error",
        text: `امکان کپی تفصیلی وجود ندارد: هیچ فیلد تفصیلی مشترکی بین سطر ${sourceIdx} و سطر ${targetIdx} وجود ندارد.`,
      });
      return;
    }

    const copiedFields = { ...(targetRow.sanamaFields || {}) };
    let copiedCount = 0;

    commonReqRows.forEach((rNum) => {
      const fieldKey = `sanama_${rNum}`;
      const val = sourceRow.sanamaFields?.[fieldKey];
      if (val !== undefined && val !== null && val !== "") {
        copiedFields[fieldKey] = val;
        copiedCount++;
      }
    });

    setRows((prev) =>
      prev.map((r) =>
        r.id === targetRowId
          ? {
            ...r,
            sanamaFields: copiedFields,
            lastTouchTimestamp: Date.now(),
          }
          : r
      )
    );

    const sortedTarget = [...targetReqRows].sort((a, b) => a - b);
    const sortedSource = [...sourceReqRows].sort((a, b) => a - b);
    const isFullyIdentical = targetReqRows.length === sourceReqRows.length &&
      sortedTarget.every((val, idx) => val === sortedSource[idx]);

    if (copiedCount === 0) {
      setMessage({
        type: "warning",
        text: `فیلدهای تفصیلی مشترکی (${commonReqRows.length} فیلد) بین سطر ${sourceIdx} و سطر ${targetIdx} وجود دارد، اما هیچ مقداری در سطر ${sourceIdx} برای آنها وارد نشده بود.`,
      });
    } else if (isFullyIdentical) {
      setMessage({
        type: "success",
        text: `اطلاعات تفصیلی از سطر ${sourceIdx} به سطر ${targetIdx} با موفقیت کپی گردید.`,
      });
    } else {
      setMessage({
        type: "success",
        text: `اطلاعات فیلدهای تفصیلی مشابه (${copiedCount} فیلد مشترک) با موفقیت از سطر ${sourceIdx} به سطر ${targetIdx} کپی گردید.`,
      });
    }
  }, [rows]);

  const handleCopyRow = useCallback((targetRowId, sourceRowId) => {
    const targetRow = rows.find((r) => r.id === targetRowId);
    const sourceRow = rows.find((r) => r.id === sourceRowId);

    if (!targetRow || !sourceRow) return;

    const sourceIdx = rows.findIndex((r) => r.id === sourceRowId) + 1;
    const targetIdx = rows.findIndex((r) => r.id === targetRowId) + 1;

    setRows((prev) =>
      prev.map((r) =>
        r.id === targetRowId
          ? {
            ...r,
            group: sourceRow.group || "",
            account: sourceRow.account || "",
            subAccount: sourceRow.subAccount || "",
            debit: sourceRow.debit || "",
            credit: sourceRow.credit || "",
            checkDate: sourceRow.checkDate || "",
            checkNo: sourceRow.checkNo || "",
            createYear: sourceRow.createYear || "",
            personFlag: sourceRow.personFlag || false,
            checkFlag: sourceRow.checkFlag || false,
            desc: sourceRow.desc || "",
            sanamaFields: sourceRow.sanamaFields ? { ...sourceRow.sanamaFields } : {},
            isSanamaConfirmed: sourceRow.isSanamaConfirmed ?? false,
            lastTouchTimestamp: Date.now(),
          }
          : r
      )
    );

    setMessage({
      type: "success",
      text: `اطلاعات کامل سطر ${sourceIdx} با موفقیت به سطر ${targetIdx} کپی گردید.`,
    });
  }, [rows]);

  const handleDuplicateRow = useCallback((sourceRowId) => {
    const sourceRow = rows.find((r) => r.id === sourceRowId);
    if (!sourceRow) return;

    const sourceIdx = rows.findIndex((r) => r.id === sourceRowId) + 1;
    const newId = Date.now();
    const newRow = {
      ...sourceRow,
      id: newId,
      sanamaFields: sourceRow.sanamaFields ? { ...sourceRow.sanamaFields } : {},
      lastTouchTimestamp: Date.now(),
    };

    setRows((prev) => {
      const idx = prev.findIndex((r) => r.id === sourceRowId);
      if (idx === -1) return [...prev, newRow];
      const next = [...prev];
      next.splice(idx + 1, 0, newRow);
      return next;
    });

    setActiveRowId(newId);

    setMessage({
      type: "success",
      text: `سطر ${sourceIdx} با موفقیت تکثیر و ایجاد گردید.`,
    });
  }, [rows]);

  const activeTargetRow = useMemo(() => {
    return rows.find((r) => r.id === activeRowId) || rows[rows.length - 1];
  }, [rows, activeRowId]);

  const activeRowIndex = useMemo(() => {
    if (!activeTargetRow) return 1;
    const idx = rows.findIndex((r) => r.id === activeTargetRow.id);
    return idx >= 0 ? idx + 1 : 1;
  }, [rows, activeTargetRow]);

  const prevRowForActive = useMemo(() => {
    if (activeRowIndex <= 1) return null;
    return rows[activeRowIndex - 2];
  }, [rows, activeRowIndex]);

  const otherSourceRows = useMemo(() => {
    if (!activeTargetRow) return rows;
    return rows.filter((r) => r.id !== activeTargetRow.id);
  }, [rows, activeTargetRow]);

  const sortedSanamaRows = useMemo(() => {
    const eligible = rows.filter(
      (r) => r.subAccount && getRequiredRows(r.subAccount).length > 0
    );
    return eligible.slice().sort((a, b) => {
      // 1. Active row comes first
      if (a.id === activeRowId) return -1;
      if (b.id === activeRowId) return 1;

      // 2. Unconfirmed rows come before confirmed rows
      const aConf = Boolean(a.isSanamaConfirmed);
      const bConf = Boolean(b.isSanamaConfirmed);
      if (!aConf && bConf) return -1;
      if (aConf && !bConf) return 1;

      // 3. Most recently touched / selected row comes first
      const tA = a.lastTouchTimestamp || a.id || 0;
      const tB = b.lastTouchTimestamp || b.id || 0;
      return tB - tA;
    });
  }, [rows, activeRowId]);

  const totalDebit = useMemo(() => rows.reduce((s, r) => s + parseNumber(r.debit), 0), [rows]);
  const totalCredit = useMemo(() => rows.reduce((s, r) => s + parseNumber(r.credit), 0), [rows]);
  const diff = totalDebit - totalCredit;

  const STATUS_OPTIONS = [
    { key: "پیش‌نویس", label: "۱. پیش‌نویس", color: "bg-slate-500" },
    { key: "ثبت اولیه", label: "۲. ثبت اولیه", color: "bg-blue-500" },
    { key: "تأییدشده", label: "۳. تأییدشده", color: "bg-emerald-500" },
    { key: "صدور سند قطعی", label: "۴. صدور سند قطعی", color: "bg-green-600" },
    { key: "ابطال‌شده", label: "۵. برگشت شده از ......", color: "bg-rose-600" },
  ];

  const statusColors = {
    "پیش‌نویس": "bg-slate-500",
    "ثبت اولیه": "bg-blue-500",
    "تأییدشده": "bg-emerald-500",
    "صدور سند قطعی": "bg-green-600",
    "ابطال‌شده": "bg-rose-600",
    "صدور سند": "bg-green-600",
    "در جریان": "bg-amber-400",
    "رد شده": "bg-rose-500",
    "پرداخت و دریافت": "bg-blue-500",
    "دفترداری": "bg-purple-500",
    "اعتمادات": "bg-indigo-500",
    "بایگانی": "bg-gray-400",
    "حسابداری": "bg-teal-500",
  };

  const userOptions = useMemo(() => {
    const list = [...(systemUsers || [])];
    if (currentUser && !list.some((u) => u.username === currentUser.username || u.name === currentUser.name)) {
      list.unshift(currentUser);
    }
    if (list.length === 0) {
      list.push({
        name: "you",
        position: "مدیر مالی",
      });
    }

    return list.map((u) => {
      const uName = u.name || u.fullName || (u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.username) || "کاربر سیستم";
      const uPos = u.position || u.role || u.userGroup || "مدیر مالی";
      const fullLabel = `${uName} (${uPos})`;
      return {
        value: fullLabel,
        label: fullLabel,
      };
    });
  }, [systemUsers, currentUser]);

  const formattedReturnedUser = useMemo(() => {
    if (!header.returnedUser) return "";
    if (header.returnedUser.includes("(") && header.returnedUser.includes(")")) {
      return header.returnedUser;
    }
    const found = userOptions.find(o => o.value.startsWith(header.returnedUser) || o.value.includes(header.returnedUser));
    return found ? found.value : header.returnedUser;
  }, [header.returnedUser, userOptions]);

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
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-2xl border px-5 py-3.5 text-xs font-semibold shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-top-4 max-w-xl w-[90%] ${
            message.type === "success"
              ? "border-emerald-300 bg-emerald-50/95 text-emerald-900 shadow-emerald-500/10"
              : message.type === "warning"
              ? "border-amber-300 bg-amber-50/95 text-amber-900 shadow-amber-500/10"
              : "border-rose-300 bg-rose-50/95 text-rose-900 shadow-rose-500/10"
          }`}
          dir="rtl"
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          ) : message.type === "warning" ? (
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
          ) : (
            <Ban className="h-5 w-5 shrink-0 text-rose-600" />
          )}
          <span className="leading-relaxed flex-1">{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="mr-auto p-1 rounded-lg hover:bg-black/5 transition-colors text-foreground/60 hover:text-foreground cursor-pointer"
            title="بستن"
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
                      value={header.fiscalYear || selectedFiscalYear}
                      onChange={() => { }}
                      options={(fiscalYears.length > 0 ? fiscalYears : [{ year: header.fiscalYear || selectedFiscalYear }]).map((fy) => ({ value: String(fy.year), label: `${fy.year}` }))}
                      placeholder="دوره مالی..."
                      searchable={false}
                      disabled={true}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label className={labelCls}>شماره سند</Label>
                  <Input
                    className={`${inputCls} font-bold font-mono bg-muted text-muted-foreground cursor-not-allowed`}
                    value={header.docNo ? toPersianDigits(header.docNo) : "خودکار"}
                    disabled={true}
                    readOnly
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className={labelCls}>تاریخ سند</Label>
                  <PersianDatePicker
                    className="h-8 text-xs rounded-md border bg-white focus:border-primary"
                    value={header.docDate}
                    fixedYear={header.fiscalYear || selectedFiscalYear}
                    onChange={(e) => setH("docDate", e?.target?.value ?? e)}
                  />
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
                  <PersianDatePicker
                    className="h-8 text-xs rounded-md border bg-white focus:border-primary"
                    value={header.letterDate}
                    fixedYear={header.fiscalYear || selectedFiscalYear}
                    onChange={(e) => setH("letterDate", e?.target?.value ?? e)}
                  />
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
                  <div className="flex flex-wrap gap-1.5 items-center select-none">
                    {STATUS_OPTIONS.map((opt) => {
                      const isSelected =
                        header.status === opt.key ||
                        (opt.key === "صدور سند قطعی" && (header.status === "صدور سند قطعی" || header.status === "CONFIRMED" || header.status === "FINAL")) ||
                        (opt.key === "ثبت اولیه" && (header.status === "ثبت اولیه" || header.status?.startsWith("در انتظار تایید") || header.status === "PENDING" || header.status === "در جریان")) ||
                        (opt.key === "تأییدشده" && (header.status === "تأییدشده" || header.status === "APPROVED")) ||
                        (opt.key === "پیش‌نویس" && (header.status === "پیش‌نویس" || header.status === "DRAFT")) ||
                        (opt.key === "ابطال‌شده" && (header.status === "ابطال‌شده" || header.status?.startsWith("ابطال") || header.status?.includes("برگشت") || header.status?.includes("رد")));

                      let displayLabel = opt.label;
                      if (opt.key === "ابطال‌شده") {
                        const returnedName = formattedReturnedUser || header.returnedUser;
                        displayLabel = `۵. برگشت شده از ${returnedName ? returnedName : "......"}`;
                      }
                      return (
                        <div
                          key={opt.key}
                          className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition-all cursor-default select-none ${
                            isSelected ? opt.color + " text-white ring-2 ring-offset-1 ring-current font-bold" : "bg-muted text-muted-foreground/60 opacity-60"
                          }`}
                        >
                          {displayLabel}
                        </div>
                      );
                    })}
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
            <div className="flex items-center gap-2 flex-wrap">
              <Button size="sm" variant="default" className="gap-1.5 h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-medium" onClick={addRow}>
                <Plus className="h-4 w-4" />
                درج سطر
              </Button>

              {/* دکمه‌های کپی سطر (شامل کپی سطر از سطر قبل و کپی سطر از...) */}
              {rows.length > 1 && activeTargetRow && (
                <div className="flex items-center gap-1.5">
                  {prevRowForActive && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 h-8 text-xs bg-blue-50/90 hover:bg-blue-100 text-blue-800 border-blue-200 font-medium"
                      onClick={() => handleCopyRow(activeTargetRow.id, prevRowForActive.id)}
                      title={`کپی تمام اطلاعات سطر ${activeRowIndex - 1} به سطر ${activeRowIndex}`}
                    >
                      <Copy className="h-3.5 w-3.5 text-blue-600" />
                      کپی سطر از سطر قبل ({activeRowIndex - 1})
                    </Button>
                  )}
                  {otherSourceRows.length > 0 && (
                    <select
                      className="h-8 text-xs rounded-md border border-blue-200 bg-blue-50/50 text-blue-900 px-2 py-0 cursor-pointer font-medium hover:bg-blue-100/70"
                      defaultValue=""
                      onChange={(e) => {
                        const sourceId = Number(e.target.value);
                        if (sourceId && activeTargetRow) {
                          handleCopyRow(activeTargetRow.id, sourceId);
                          e.target.value = "";
                        }
                      }}
                    >
                      <option value="" disabled>کپی سطر {activeRowIndex} از...</option>
                      {otherSourceRows.map((srcRow) => {
                        const srcIdx = rows.findIndex((r) => r.id === srcRow.id) + 1;
                        const title = srcRow.subAccount || srcRow.account || srcRow.group || "سطر بدون حساب";
                        const amt = srcRow.debit ? `بدهکار: ${srcRow.debit}` : (srcRow.credit ? `بستانکار: ${srcRow.credit}` : "");
                        return (
                          <option key={srcRow.id} value={srcRow.id}>
                            سطر {srcIdx} ({title}{amt ? ` - ${amt}` : ""})
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>
              )}
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
                    <th className="px-2 py-2.5 text-center w-16">عملیات</th>
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
                      onDuplicate={() => handleDuplicateRow(row.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* الزامات سناما — همه ردیف‌هایی که الزامات دارند با اولویت ردیف فعال و آخرین گروه انتخابی */}
            {sortedSanamaRows.length > 0 && (
              <div className="border-t">
                {sortedSanamaRows.map((row) => (
                  <SanamaExtraFields
                    key={row.id}
                    row={row}
                    allRows={rows}
                    onSanamaChange={(fieldKey, val) => handleSanamaChange(row.id, fieldKey, val)}
                    onConfirmRow={(rowId) => handleConfirmSanamaRow(rowId)}
                    onEditRow={(rowId) => handleEditSanamaRow(rowId)}
                    onCopySanama={(targetRowId, sourceRowId) => handleCopySanamaFields(targetRowId, sourceRowId)}
                  />
                ))}
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
                { label: "گروه", value: activeRow?.group || "—" },
                { label: "کل", value: activeRow?.account || "—" },
                { label: "معین", value: activeRow?.subAccount || "—" },
                {
                  label: "ماهیت",
                  value: (() => {
                    const row = activeRow;
                    if (!row?.subAccount) return "—";
                    const subs = getSubAccounts(row.group, row.account);
                    const nature = subs.find((s) => s.code === row.subAccount)?.nature;
                    return nature === "debit" ? "بدهکار" :
                      nature === "credit" ? "بستانکار" :
                        nature === "both" ? "هر دو" : "—";
                  })(),
                },
                ...(needsSanamaFields(activeRow?.subAccount)
                  ? getRequiredRows(activeRow.subAccount).map((rowNum) => {
                    const rowDef = getSubAccountTitle(rowNum);
                    const fieldKey = `sanama_${rowNum}`;
                    const val = activeRow?.sanamaFields?.[fieldKey];
                    const defVal = rowDef?.default ?? "0";
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
                <Badge className={`${statusColors[header.status] || "bg-rose-600"} text-white text-xs px-3 py-1 font-medium`}>
                  {(header.status === "ابطال‌شده" || header.status?.startsWith("ابطال") || header.status?.includes("برگشت") || header.status?.includes("رد"))
                    ? `برگشت شده از ${formattedReturnedUser || header.returnedUser || "......"}`
                    : header.status}
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

              {loadedDoc && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 h-8 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 font-bold"
                  onClick={() => setShowTreeModal(true)}
                >
                  <GitFork className="h-3.5 w-3.5 text-blue-600" />
                  درختواره گردش کار
                </Button>
              )}

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
                className="gap-1.5 h-8 text-xs cursor-pointer"
                onClick={handleExit}
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
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
                onClick={async () => {
                  if (!rejectReason.trim()) {
                    alert("وارد نمودن دلیل رد سند الزامی است.");
                    return;
                  }
                  const uRole = currentUser?.position || currentUser?.role || "کاربر";
                  const uName = currentUser?.name || currentUser?.username || "کاربر";
                  const userDisplay = `${uName} (${uRole})`;
                  const statusStr = `برگشت شده از ${userDisplay}`;

                  if (docId) {
                    try {
                      await api.post(`/api/documents/${docId}/workflow/reject`, { reason: rejectReason.trim() });
                    } catch (e) {
                      console.error("Workflow reject error:", e);
                    }
                  }

                  setHeader(prev => ({
                    ...prev,
                    status: "ابطال‌شده",
                    returnedUser: userDisplay,
                    rejectionReason: rejectReason.trim()
                  }));
                  setMessage({ type: "error", text: `سند مالی رد شد و به مرحله قبل ارجاع یافت. (علت: ${rejectReason})` });
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

      {showTreeModal && loadedDoc && (
        <DocWorkflowTreeModal
          doc={loadedDoc}
          onClose={() => setShowTreeModal(false)}
        />
      )}
    </PageShell>
  );
}
