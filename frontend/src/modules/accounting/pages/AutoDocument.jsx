import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import api from "@/api";
import { encrypt } from "@/lib/crypto";
import { PersianDatePicker } from "@/components/ui/persian-date-picker";
import {
  Search, CheckCircle2, AlertCircle, X, FileText, Save,
  Zap, ChevronDown, Layers, Hash
} from "lucide-react";
import { INITIAL_TEMPLATES } from "@/data/operationsTemplates";
import sanamaRequirements from "@/data/sanamaRequirements.json";
import subAccountTitles from "@/data/subAccountTitles.json";
import { checkDebitNatureBalance, clearBalanceCache } from "@/lib/accountBalanceCheck";
import { PersonSanamaField } from "@/components/ui/person-sanama-field";

// ─── helpers ──────────────────────────────────────────────────────────────────
function getRequiredRows(code) {
  return sanamaRequirements[code]?.requiredRows ?? [];
}

function getSubAccountTitle(rowNum) {
  return subAccountTitles.find((t) => t.row === rowNum);
}

// ─── نوع حسابداری ─────────────────────────────────────────────────────────────
function matchesType(t, type) {
  if (type.codePrefix) return typeof t.code === "string" && t.code.startsWith(type.codePrefix);
  if (type.categories) return type.categories.includes(t.category);
  return true;
}

const ACCOUNTING_TYPES = [
  { value: "current",  label: "حسابداری عملیات جاری",                     num: 1, codePrefix: "OP-"  },
  { value: "payroll",  label: "حسابداری حقوق و مزایای مستمر کارکنان",     num: 2, categories: ["payroll"] },
  { value: "capital",  label: "حسابداری عملیات سرمایه‌ای",                 num: 3, categories: ["capital"] },
];

// ─── کامپوننت یک فیلد سناما ──────────────────────────────────────────────────
function SanamaField({ rowDef, value, onChange }) {
  const cls = "h-9 text-xs rounded-lg border border-input bg-background px-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30 w-full transition-all";

  const label = (
    <Label className="text-[11px] font-semibold text-foreground/80 flex items-center gap-1">
      <span className="text-rose-500">*</span>{rowDef.title}
    </Label>
  );

  if (rowDef.values) {
    return (
      <div className="space-y-1">
        {label}
        <SearchableSelect
          value={value ?? ""}
          onChange={(v) => onChange(v || "")}
          options={rowDef.values.map((v) => ({ value: String(v.type), label: v.title }))}
          placeholder="انتخاب کنید..."
          searchable={rowDef.values.length > 8}
        />
      </div>
    );
  }
  if (rowDef.groups) {
    return (
      <div className="space-y-1">
        {label}
        <SearchableSelect
          value={value ?? ""}
          onChange={(v) => onChange(v || "")}
          options={rowDef.groups.flatMap((g) =>
            g.values.map((v) => ({ value: String(v.type), label: v.title, group: g.title }))
          )}
          placeholder="انتخاب کنید..."
        />
      </div>
    );
  }
  // ردیف ۲۱ — اشخاص: از PersonSanamaField استفاده می‌شود
  if (rowDef.types) {
    return <PersonSanamaField value={value} onChange={onChange} required />;
  }
  // عددی (default)
  return (
    <div className="space-y-1">
      {label}
      <input type="text" inputMode="numeric" className={cls} placeholder="عدد وارد کنید..." value={value ?? ""} onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))} dir="ltr" />
    </div>
  );
}

// ─── بلوک الزامات یک کد حساب ─────────────────────────────────────────────────
function AccountSanamaBlock({ line, lineIdx, sanamaValues, onSanamaChange }) {
  const requiredRows = getRequiredRows(line.accountCode);
  if (!requiredRows.length) return null;

  const isDebit = line.type === "debit";

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/50 overflow-hidden">
      {/* هدر کد حساب */}
      <div className={`flex items-center gap-2.5 px-3 py-2 border-b border-amber-200 ${isDebit ? "bg-blue-50/60" : "bg-rose-50/60"}`}>
        <span className={`text-[10px] font-bold rounded px-2 py-0.5 border font-mono ${isDebit ? "bg-blue-100 border-blue-300 text-blue-700" : "bg-rose-100 border-rose-300 text-rose-700"}`}>
          {isDebit ? "بدهکار" : "بستانکار"}
        </span>
        <Hash className="h-3 w-3 text-amber-600" />
        <span className="font-mono font-bold text-sm text-foreground">{line.accountCode}</span>
        <span className="text-xs text-muted-foreground">—</span>
        <span className="text-xs font-semibold text-foreground/80">{line.accountName}</span>
        {line.section && (
          <span className="mr-auto text-[10px] bg-muted border rounded px-2 py-0.5 text-muted-foreground">{line.section}</span>
        )}
      </div>
      {/* فیلدهای الزامی */}
      <div className="p-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {requiredRows.map((rowNum) => {
          const rowDef = getSubAccountTitle(rowNum);
          if (!rowDef) return null;
          const key = `l${lineIdx}_s${rowNum}`;
          return (
            <SanamaField
              key={key}
              rowDef={rowDef}
              value={sanamaValues[key]}
              onChange={(val) => onSanamaChange(key, val)}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── صفحه اصلی ────────────────────────────────────────────────────────────────
export default function AutoDocument() {
  const today = new Date().toLocaleDateString("fa-IR").replace(/\//g, "/");

  const [search, setSearch] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedAccountingType, setSelectedAccountingType] = useState(null);

  const [fiscalYears, setFiscalYears] = useState([]);
  const [docFields, setDocFields] = useState({ fiscalYear: "", documentDate: today, description: "" });

  // مبالغ هر ردیف
  const [lineAmounts, setLineAmounts] = useState({});

  // الزامات سناما: کلید = `l{lineIdx}_s{rowNum}`
  const [sanamaValues, setSanamaValues] = useState({});

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    api.get("/api/fiscal-years").then((res) => {
      if (res.data?.success) {
        const list = res.data.data || [];
        setFiscalYears(list);
        if (list.length > 0) setDocFields((p) => ({ ...p, fiscalYear: String(list[0].year) }));
      }
    }).catch(() => {});
  }, []);

  // فیلتر ثبت‌ها
  const filteredTemplates = useMemo(() => {
    const q = search.trim().toLowerCase();
    const typeObj = selectedAccountingType ? ACCOUNTING_TYPES.find((t) => t.value === selectedAccountingType) : null;
    return INITIAL_TEMPLATES
      .filter((t) => t.status === "active")
      .filter((t) => (!typeObj || matchesType(t, typeObj)))
      .filter((t) => !q || t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.code?.toLowerCase().includes(q));
  }, [search, selectedAccountingType]);

  // آیا هر کد حسابی الزامات سناما دارد؟
  const linesWithSanama = useMemo(() => {
    if (!selectedTemplate) return [];
    return selectedTemplate.lines
      .map((line, idx) => ({ line, idx, rows: getRequiredRows(line.accountCode) }))
      .filter((x) => x.rows.length > 0);
  }, [selectedTemplate]);

  const hasSanama = linesWithSanama.length > 0;

  // مجموع فیلدهای سناما اجباری
  const totalSanamaFields = useMemo(() =>
    linesWithSanama.reduce((sum, x) => sum + x.rows.length, 0),
    [linesWithSanama]
  );

  // فیلدهای سناما پر شده
  const filledSanamaFields = useMemo(() => {
    let count = 0;
    for (const { idx, rows } of linesWithSanama) {
      for (const rowNum of rows) {
        const v = sanamaValues[`l${idx}_s${rowNum}`];
        if (v !== undefined && v !== null && String(v).trim() !== "") count++;
      }
    }
    return count;
  }, [linesWithSanama, sanamaValues]);

  const allSanamaFilled = filledSanamaFields === totalSanamaFields;

  const handleSelectTemplate = (tpl) => {
    setSelectedTemplate(tpl);
    setIsDropdownOpen(false);
    setSearch("");
    setSanamaValues({});
    setLineAmounts({});
    setDocFields((p) => ({ ...p, description: `ثبت سند بابت ${tpl.description}` }));
    setMessage(null);
  };

  const handleAmountChange = (idx, value) => {
    const raw = value.replace(/\D/g, "");
    const formatted = raw ? raw.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "";
    setLineAmounts((p) => ({ ...p, [idx]: formatted }));
  };

  const totals = useMemo(() => {
    if (!selectedTemplate) return { debit: 0, credit: 0, diff: 0 };
    let debit = 0, credit = 0;
    selectedTemplate.lines.forEach((line, idx) => {
      const val = parseFloat((lineAmounts[idx] || "").replace(/,/g, "")) || 0;
      if (line.type === "debit") debit += val; else credit += val;
    });
    return { debit, credit, diff: debit - credit };
  }, [selectedTemplate, lineAmounts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTemplate) return;
    if (totals.debit <= 0) { setMessage({ type: "error", text: "لطفاً مبالغ را وارد کنید." }); return; }
    if (totals.diff !== 0) { setMessage({ type: "error", text: `سند تراز نیست! اختلاف: ${Math.abs(totals.diff).toLocaleString("fa-IR")} ریال` }); return; }

    // اعتبارسنجی همه الزامات سناما
    for (const { line, idx, rows } of linesWithSanama) {
      for (const rowNum of rows) {
        const key = `l${idx}_s${rowNum}`;
        const val = sanamaValues[key];
        if (!val || String(val).trim() === "") {
          const rowDef = getSubAccountTitle(rowNum);
          setMessage({ type: "error", text: `فیلد «${rowDef?.title ?? `ردیف ${rowNum}`}» برای حساب ${line.accountCode} — ${line.accountName} الزامی است.` });
          return;
        }
      }
    }

    // ─── بررسی قانون موجودی معین‌های بدهکار ───────────────────────────────
    const balanceRows = selectedTemplate.lines.map((line, idx) => ({
      subAccount: line.accountCode,
      debit:  line.type === "debit"  ? (parseFloat((lineAmounts[idx] || "").replace(/,/g, "")) || 0) : 0,
      credit: line.type === "credit" ? (parseFloat((lineAmounts[idx] || "").replace(/,/g, "")) || 0) : 0,
    }));
    const balanceError = await checkDebitNatureBalance(balanceRows, null);
    if (balanceError) {
      setMessage({ type: "error", text: balanceError });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const parsedLines = selectedTemplate.lines.map((line, idx) => {
        const val = parseFloat((lineAmounts[idx] || "").replace(/,/g, "")) || 0;
        const code = line.accountCode;
        const group = code.charAt(0);
        const account = group === "9" ? code.substring(0, 2) : code.substring(0, 3);
        // جمع‌آوری فیلدهای سناما این خط
        const lineSanamaFields = {};
        getRequiredRows(code).forEach((rowNum) => {
          lineSanamaFields[`sanama_${rowNum}`] = sanamaValues[`l${idx}_s${rowNum}`];
        });
        return {
          id: Date.now() + Math.random(),
          group, account, subAccount: code,
          account_name: line.accountName,
          debit: line.type === "debit" ? String(val) : "0",
          credit: line.type === "credit" ? String(val) : "0",
          desc: line.accountName,
          sanamaFields: lineSanamaFields,
        };
      });

      const encryptedHex = await encrypt(JSON.stringify({
        header: { fiscalYear: String(docFields.fiscalYear), docNo: "", docDate: docFields.documentDate, docType: "موقت", access: "عادی", desc: docFields.description, letterNo: "", letterDate: "", status: "صدور سند" },
        rows: parsedLines,
      }));

      const res = await api.post("/api/documents", {
        document_type: "GENERAL_PAYMENT",
        fiscal_year: Number(docFields.fiscalYear) || 1405,
        status: "DRAFT",
        ciphertext: encryptedHex,
        is_template_derived: true,
        template_id: selectedTemplate.id,
        template_title: selectedTemplate.title,
      });

      setMessage({ type: "success", text: `سند با شماره «${res.data?.data?.document_number}» با موفقیت ثبت گردید.` });
      setSelectedTemplate(null); setLineAmounts({}); setSanamaValues({});
      setDocFields((p) => ({ ...p, description: "" }));
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "خطا در ثبت سند." });
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = !loading && selectedTemplate && totals.debit > 0 && totals.diff === 0 && allSanamaFilled;

  // ─── رندر ───────────────────────────────────────────────────────────────────
  return (
    <PageShell>
      <div className="mb-6 flex items-center gap-3" dir="rtl">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Zap className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">صدور سند اتوماتیک</h1>
          <p className="text-xs text-muted-foreground mt-0.5">انتخاب ثبت از الگوهای سناما، تکمیل الزامات و صدور سند</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} dir="rtl">
        {/* پیام */}
        <AnimatePresence>
          {message && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className={`mb-4 flex items-center gap-2 rounded-xl border px-4 py-3 text-xs ${message.type === "success" ? "border-green-200 bg-green-50 text-green-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}>
              {message.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" /> : <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />}
              <span className="flex-1">{message.text}</span>
              <button type="button" onClick={() => setMessage(null)}><X className="h-3.5 w-3.5" /></button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── ۱. نوع حسابداری ─── */}
        <Card className="mb-4">
          <CardContent className="p-4 space-y-3">
            <Label className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-primary" />
              نوع حسابداری
            </Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {ACCOUNTING_TYPES.map((type) => (
                <button key={type.value} type="button"
                  onClick={() => { setSelectedAccountingType(selectedAccountingType === type.value ? null : type.value); setSelectedTemplate(null); setLineAmounts({}); setSanamaValues({}); setSearch(""); }}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-right transition-all duration-200 ${selectedAccountingType === type.value ? "border-primary bg-primary/10 text-primary font-bold shadow-sm" : "border-border bg-background text-foreground/70 hover:border-primary/40 hover:bg-muted/50"}`}>
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${selectedAccountingType === type.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{type.num}</span>
                  <span className="text-xs font-semibold leading-tight">{type.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ─── ۲. انتخاب ثبت ─── */}
        <Card className="mb-4">
          <CardContent className="p-4 space-y-3">
            <Label className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-primary" />
              انتخاب ثبت حسابداری
            </Label>
            <div className="relative">
              <button type="button" onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full h-10 text-xs rounded-lg border border-input bg-background px-3 focus:outline-none focus:ring-2 focus:ring-ring/30 font-semibold flex items-center justify-between transition-all hover:bg-muted/10 text-right">
                <span className={selectedTemplate ? "text-foreground" : "text-muted-foreground"}>
                  {selectedTemplate ? `${selectedTemplate.title} — ${selectedTemplate.description}` : "-- یک ثبت انتخاب کنید --"}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 mr-2" />
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => { setIsDropdownOpen(false); setSearch(""); }} />
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.15 }}
                      className="absolute right-0 left-0 mt-1.5 z-30 max-h-72 overflow-y-auto rounded-lg border bg-background shadow-2xl p-1.5 border-primary/10">
                      <div className="sticky top-0 bg-background pb-1.5 border-b mb-1 px-1 pt-1 z-10">
                        <div className="relative">
                          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجو در ثبت‌ها..." className="h-8 text-xs pr-8" dir="rtl" autoFocus />
                          <Search className="absolute right-2.5 top-2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>
                      {filteredTemplates.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground text-xs">ثبتی یافت نشد.</div>
                      ) : filteredTemplates.map((t) => (
                        <button key={t.id} type="button" onClick={() => handleSelectTemplate(t)}
                          className={`w-full text-right px-3 py-2 text-xs rounded-md transition-all flex items-start gap-2 ${selectedTemplate?.id === t.id ? "bg-primary text-primary-foreground font-bold" : "hover:bg-muted text-foreground/80 hover:text-foreground"}`}>
                          <span className="shrink-0 font-mono text-[10px] mt-0.5 opacity-60">{t.code}</span>
                          <span className="flex-1">
                            <span className="font-bold">{t.title}</span>
                            <span className="block text-[11px] opacity-70 mt-0.5 line-clamp-2">{t.description}</span>
                          </span>
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>

        {selectedTemplate && (
          <>
            {/* ─── ۳. اطلاعات سند ─── */}
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">دوره مالی <span className="text-rose-500">*</span></Label>
                    <select value={docFields.fiscalYear} onChange={(e) => setDocFields((p) => ({ ...p, fiscalYear: e.target.value }))}
                      className="w-full h-9 text-xs rounded-lg border border-input bg-background px-3 focus:outline-none focus:ring-2 focus:ring-ring/30">
                      {fiscalYears.map((fy) => <option key={fy._id} value={String(fy.year)}>{fy.year}</option>)}
                      {fiscalYears.length === 0 && <option value="1405">۱۴۰۵</option>}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">تاریخ سند</Label>
                    <PersianDatePicker value={docFields.documentDate} onChange={(e) => setDocFields((p) => ({ ...p, documentDate: e.target.value }))} className="h-9 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">شرح سند</Label>
                    <Input value={docFields.description} onChange={(e) => setDocFields((p) => ({ ...p, description: e.target.value }))} placeholder="شرح سند..." className="h-9 text-xs" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ─── ۴. جدول آرتیکل‌ها + الزامات سناما هر کد ─── */}
            <Card className="mb-4">
              <CardContent className="p-0">
                {/* هدر */}
                <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-primary" />
                    ردیف‌های حسابداری و الزامات سناما
                  </h3>
                  {hasSanama && (
                    <div className={`flex items-center gap-1.5 text-xs rounded-full px-3 py-1 border font-semibold ${allSanamaFilled ? "bg-green-50 border-green-200 text-green-700" : "bg-amber-50 border-amber-200 text-amber-700"}`}>
                      {allSanamaFilled ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                      {filledSanamaFields}/{totalSanamaFields} الزام سناما تکمیل شده
                    </div>
                  )}
                </div>

                {/* ردیف‌ها */}
                <div className="space-y-0 divide-y">
                  {selectedTemplate.lines.map((line, idx) => {
                    const isDebit = line.type === "debit";
                    const val = lineAmounts[idx] || "";
                    const hasReq = getRequiredRows(line.accountCode).length > 0;

                    return (
                      <div key={idx} className={hasReq ? "bg-amber-50/20" : ""}>
                        {/* ردیف جدول */}
                        <div className="grid items-center gap-2 px-4 py-2.5" style={{ gridTemplateColumns: "auto 1fr auto auto" }}>
                          {/* ماهیت + کد */}
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={isDebit ? "bg-blue-50 text-blue-700 border-blue-200 font-mono text-[10px]" : "bg-rose-50 text-rose-700 border-rose-200 font-mono text-[10px]"}>
                              {isDebit ? "بد" : "بس"}
                            </Badge>
                            <span className="font-mono font-bold text-sm text-foreground">{line.accountCode}</span>
                          </div>
                          {/* نام حساب */}
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-semibold text-foreground truncate">{line.accountName}</span>
                            {line.section && <span className="text-[10px] text-muted-foreground">{line.section}</span>}
                          </div>
                          {/* نشانگر سناما */}
                          {hasReq ? (
                            <span className="text-[9px] bg-amber-100 border border-amber-300 text-amber-700 rounded px-1.5 py-0.5 font-semibold whitespace-nowrap">الزامات سناما ▼</span>
                          ) : <span />}
                          {/* ورودی مبلغ */}
                          <div className="w-36">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[10px] font-bold whitespace-nowrap ${isDebit ? "text-blue-600" : "text-rose-600"}`}>{isDebit ? "بدهکار:" : "بستانکار:"}</span>
                              <Input value={val} onChange={(e) => handleAmountChange(idx, e.target.value)} placeholder="مبلغ..." className={`h-7 text-xs font-mono w-28 ${isDebit ? "text-blue-700" : "text-rose-700"}`} dir="ltr" />
                            </div>
                          </div>
                        </div>

                        {/* الزامات سناما این کد — مستقیم زیر ردیف */}
                        {hasReq && (
                          <div className="px-4 pb-3">
                            <AccountSanamaBlock
                              line={line}
                              lineIdx={idx}
                              sanamaValues={sanamaValues}
                              onSanamaChange={(key, val) => setSanamaValues((p) => ({ ...p, [key]: val }))}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* نوار تراز */}
                <div className="flex items-center gap-6 border-t px-4 py-2.5 bg-muted/20 text-xs flex-wrap">
                  <span className="text-muted-foreground">جمع بدهکار: <span className="font-semibold text-blue-700">{totals.debit.toLocaleString("fa-IR")}</span></span>
                  <span className="text-muted-foreground">جمع بستانکار: <span className="font-semibold text-rose-700">{totals.credit.toLocaleString("fa-IR")}</span></span>
                  <span className={`font-semibold ${totals.diff === 0 && totals.debit > 0 ? "text-green-600" : "text-rose-600 flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-lg"}`}>
                    {totals.diff === 0 && totals.debit > 0 ? "✓ تراز" : <><AlertCircle className="h-3.5 w-3.5" />اختلاف: {Math.abs(totals.diff).toLocaleString("fa-IR")} ریال</>}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* ─── دکمه صدور ─── */}
            <div className="flex items-center justify-between pb-6">
              <p className="text-xs text-muted-foreground">
                {!canSubmit && (
                  <span className="flex items-center gap-1 text-amber-600">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {totals.debit === 0 ? "مبالغ را وارد کنید" : totals.diff !== 0 ? "سند تراز نیست" : !allSanamaFilled ? `${totalSanamaFields - filledSanamaFields} فیلد سناما باقی‌مانده` : ""}
                  </span>
                )}
              </p>
              <Button type="submit" disabled={!canSubmit} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-10 px-6">
                <Save className="h-4 w-4" />
                {loading ? "در حال صدور..." : "صدور سند اتوماتیک"}
              </Button>
            </div>
          </>
        )}
      </form>
    </PageShell>
  );
}
