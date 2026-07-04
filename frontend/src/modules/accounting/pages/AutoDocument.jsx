import { useState, useMemo, useEffect, useCallback } from "react";
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
import { PersianDatePicker, toPersianDigits } from "@/components/ui/persian-date-picker";
import {
  Search, CheckCircle2, AlertCircle, X, FileText, Save,
  Zap, ChevronDown, Layers
} from "lucide-react";
import { INITIAL_TEMPLATES } from "@/data/operationsTemplates";
import sanamaRequirements from "@/data/sanamaRequirements.json";
import subAccountTitles from "@/data/subAccountTitles.json";

// ─── helpers ──────────────────────────────────────────────────────────────────
function getRequiredRows(subAccountCode) {
  return sanamaRequirements[subAccountCode]?.requiredRows ?? [];
}

function getSubAccountTitle(rowNum) {
  return subAccountTitles.find((t) => t.row === rowNum);
}

// جمع‌آوری تمام الزامات سناما منحصر به فرد برای یک الگو
function collectSanamaRequirements(template) {
  const rowSet = new Set();
  template.lines.forEach((line) => {
    const rows = getRequiredRows(line.accountCode);
    rows.forEach((r) => rowSet.add(r));
  });
  return Array.from(rowSet).sort((a, b) => a - b);
}

// ─── کامپوننت رندر یک فیلد سناما ─────────────────────────────────────────────
function SanamaField({ rowDef, value, onChange }) {
  const inputCls =
    "h-9 text-xs rounded-lg border border-input bg-background px-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30 w-full transition-all";

  if (rowDef.values) {
    const opts = rowDef.values.map((v) => ({ value: String(v.type), label: v.title }));
    return (
      <div className="space-y-1">
        <Label className="text-xs font-semibold text-foreground">
          {rowDef.title} <span className="text-rose-500">*</span>
        </Label>
        <SearchableSelect
          value={value ?? ""}
          onChange={(v) => onChange(v || "")}
          options={opts}
          placeholder="انتخاب کنید..."
          searchable={opts.length > 8}
        />
      </div>
    );
  }

  if (rowDef.groups) {
    const opts = rowDef.groups.flatMap((g) =>
      g.values.map((v) => ({ value: String(v.type), label: v.title, group: g.title }))
    );
    return (
      <div className="space-y-1">
        <Label className="text-xs font-semibold text-foreground">
          {rowDef.title} <span className="text-rose-500">*</span>
        </Label>
        <SearchableSelect
          value={value ?? ""}
          onChange={(v) => onChange(v || "")}
          options={opts}
          placeholder="انتخاب کنید..."
        />
      </div>
    );
  }

  if (rowDef.types) {
    return (
      <div className="space-y-1">
        <Label className="text-xs font-semibold text-foreground">
          {rowDef.title} <span className="text-rose-500">*</span>
        </Label>
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

  // default — عددی
  return (
    <div className="space-y-1">
      <Label className="text-xs font-semibold text-foreground">
        {rowDef.title} <span className="text-rose-500">*</span>
      </Label>
      <input
        type="text"
        inputMode="numeric"
        className={inputCls}
        placeholder="عدد وارد کنید..."
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
        dir="ltr"
      />
    </div>
  );
}

// ─── تعریف نوع حسابداری و mapping به category ─────────────────────────────────
// برای عملیات جاری: همه ثبت‌های با کد OP- (شامل ثبت‌های ۱ تا ۴۹ و زیرثبت‌هایشان)
function matchesType(t, type) {
  if (type.codePrefix) return typeof t.code === "string" && t.code.startsWith(type.codePrefix);
  if (type.categories) return type.categories.includes(t.category);
  return true;
}

const ACCOUNTING_TYPES = [
  {
    value: "current",
    label: "حسابداری عملیات جاری",
    num: 1,
    codePrefix: "OP-",   // همه ثبت‌های ۱ تا ۴۹ با کد OP-xx
  },
  {
    value: "payroll",
    label: "حسابداری حقوق و مزایای مستمر کارکنان",
    num: 2,
    categories: ["payroll"],
  },
  {
    value: "capital",
    label: "حسابداری عملیات سرمایه‌ای",
    num: 3,
    categories: ["capital"],
  },
];

// ─── صفحه اصلی ────────────────────────────────────────────────────────────────
export default function AutoDocument() {
  const today = new Date().toLocaleDateString("fa-IR").replace(/\//g, "/");

  // جستجو و انتخاب ثبت
  const [search, setSearch] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedAccountingType, setSelectedAccountingType] = useState(null);

  // فیلدهای سند
  const [fiscalYears, setFiscalYears] = useState([]);
  const [docFields, setDocFields] = useState({
    fiscalYear: "",
    documentDate: today,
    description: "",
  });

  // مبالغ هر ردیف
  const [lineAmounts, setLineAmounts] = useState({});

  // الزامات سناما
  const [sanamaValues, setSanamaValues] = useState({});

  // وضعیت ارسال
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // دریافت دوره‌های مالی
  useEffect(() => {
    api.get("/api/fiscal-years").then((res) => {
      if (res.data?.success) {
        const list = res.data.data || [];
        setFiscalYears(list);
        if (list.length > 0) {
          setDocFields((p) => ({ ...p, fiscalYear: String(list[0].year) }));
        }
      }
    }).catch(() => {});
  }, []);

  // فیلتر الگوها
  const filteredTemplates = useMemo(() => {
    const q = search.trim().toLowerCase();
    const typeObj = selectedAccountingType
      ? ACCOUNTING_TYPES.find((t) => t.value === selectedAccountingType)
      : null;

    return INITIAL_TEMPLATES.filter((t) => t.status === "active")
      .filter((t) => {
        if (!typeObj) return true;
        return matchesType(t, typeObj);
      })
      .filter((t) => {
        if (!q) return true;
        return (
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.code?.toLowerCase().includes(q)
        );
      });
  }, [search, selectedAccountingType]);

  // الزامات سناما ثبت انتخاب‌شده
  const sanamaRows = useMemo(() => {
    if (!selectedTemplate) return [];
    const rowNums = collectSanamaRequirements(selectedTemplate);
    return rowNums.map((num) => getSubAccountTitle(num)).filter(Boolean);
  }, [selectedTemplate]);

  // انتخاب الگو
  const handleSelectTemplate = (tpl) => {
    setSelectedTemplate(tpl);
    setIsDropdownOpen(false);
    setSearch("");
    setSanamaValues({});
    setLineAmounts({});
    setDocFields((p) => ({
      ...p,
      description: `ثبت سند بابت ${tpl.description}`,
    }));
    setMessage(null);
  };

  // تغییر مبلغ
  const handleAmountChange = (idx, value) => {
    const raw = value.replace(/\D/g, "");
    const formatted = raw ? raw.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "";
    setLineAmounts((p) => ({ ...p, [idx]: formatted }));
  };

  // محاسبه جمع
  const totals = useMemo(() => {
    if (!selectedTemplate) return { debit: 0, credit: 0, diff: 0 };
    let debit = 0, credit = 0;
    selectedTemplate.lines.forEach((line, idx) => {
      const val = parseFloat((lineAmounts[idx] || "").replace(/,/g, "")) || 0;
      if (line.type === "debit") debit += val;
      else credit += val;
    });
    return { debit, credit, diff: debit - credit };
  }, [selectedTemplate, lineAmounts]);

  // اعتبارسنجی الزامات سناما
  const validateSanama = () => {
    for (const rowDef of sanamaRows) {
      const key = `sanama_${rowDef.row}`;
      const val = sanamaValues[key];
      if (!val || String(val).trim() === "") {
        return `فیلد «${rowDef.title}» الزامی است.`;
      }
    }
    return null;
  };

  // ارسال سند
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    if (totals.debit <= 0) {
      setMessage({ type: "error", text: "لطفاً مبالغ را وارد کنید." });
      return;
    }
    if (totals.diff !== 0) {
      setMessage({ type: "error", text: `سند تراز نیست! اختلاف: ${Math.abs(totals.diff).toLocaleString("fa-IR")} ریال` });
      return;
    }

    const sanamaError = validateSanama();
    if (sanamaError) {
      setMessage({ type: "error", text: sanamaError });
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
        return {
          id: Date.now() + Math.random(),
          group,
          account,
          subAccount: code,
          account_name: line.accountName,
          debit: line.type === "debit" ? String(val) : "0",
          credit: line.type === "credit" ? String(val) : "0",
          desc: line.accountName,
          sanamaFields: sanamaValues,
        };
      });

      const sensitiveState = {
        header: {
          fiscalYear: String(docFields.fiscalYear),
          docNo: "",
          docDate: docFields.documentDate,
          docType: "موقت",
          access: "عادی",
          desc: docFields.description,
          letterNo: "",
          letterDate: "",
          status: "صدور سند",
        },
        rows: parsedLines,
      };

      const encryptedHex = await encrypt(JSON.stringify(sensitiveState));

      const payload = {
        document_type: "GENERAL_PAYMENT",
        fiscal_year: Number(docFields.fiscalYear) || 1405,
        status: "DRAFT",
        ciphertext: encryptedHex,
        is_template_derived: true,
        template_id: selectedTemplate.id,
        template_title: selectedTemplate.title,
      };

      const res = await api.post("/api/documents", payload);
      const docNum = res.data?.data?.document_number || "سند صادر شده";

      setMessage({
        type: "success",
        text: `سند با شماره «${docNum}» با موفقیت ثبت گردید.`,
      });

      // ریست فرم
      setSelectedTemplate(null);
      setLineAmounts({});
      setSanamaValues({});
      setDocFields((p) => ({ ...p, description: "" }));
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "خطا در ثبت سند.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell>
      <div className="mb-6 flex items-center gap-3" dir="rtl">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Zap className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">صدور سند اتوماتیک</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            انتخاب ثبت از الگوهای سناما، تکمیل الزامات و صدور سند
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} dir="rtl">
        {/* پیام */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={`mb-4 flex items-center gap-2 rounded-xl border px-4 py-3 text-xs ${
                message.type === "success"
                  ? "border-green-200 bg-green-50 text-green-800"
                  : "border-rose-200 bg-rose-50 text-rose-800"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              )}
              <span className="flex-1">{message.text}</span>
              <button type="button" onClick={() => setMessage(null)}>
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* انتخاب نوع حسابداری */}
        <Card className="mb-4">
          <CardContent className="p-4 space-y-3">
            <Label className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-primary" />
              نوع حسابداری
            </Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {ACCOUNTING_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => {
                    setSelectedAccountingType(
                      selectedAccountingType === type.value ? null : type.value
                    );
                    setSelectedTemplate(null);
                    setLineAmounts({});
                    setSanamaValues({});
                    setSearch("");
                  }}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-right transition-all duration-200 ${
                    selectedAccountingType === type.value
                      ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                      : "border-border bg-background text-foreground/70 hover:border-primary/40 hover:bg-muted/50"
                  }`}
                >
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    selectedAccountingType === type.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {type.num}
                  </span>
                  <span className="text-xs font-semibold leading-tight">{type.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* انتخاب ثبت */}
        <Card className="mb-4">
          <CardContent className="p-4 space-y-3">
            <Label className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-primary" />
              انتخاب ثبت حسابداری
            </Label>

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full h-10 text-xs rounded-lg border border-input bg-background px-3 focus:outline-none focus:ring-2 focus:ring-ring/30 font-semibold flex items-center justify-between transition-all hover:bg-muted/10 text-right"
              >
                <span className={selectedTemplate ? "text-foreground" : "text-muted-foreground"}>
                  {selectedTemplate
                    ? `${selectedTemplate.title} — ${selectedTemplate.description}`
                    : "-- لطفاً یک ثبت انتخاب کنید --"}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 mr-2" />
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => { setIsDropdownOpen(false); setSearch(""); }}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 left-0 mt-1.5 z-30 max-h-72 overflow-y-auto rounded-lg border bg-background shadow-2xl p-1.5 border-primary/10"
                    >
                      {/* جستجو */}
                      <div className="sticky top-0 bg-background pb-1.5 border-b mb-1 px-1 pt-1 z-10">
                        <div className="relative">
                          <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="جستجو در ثبت‌ها..."
                            className="h-8 text-xs pr-8"
                            dir="rtl"
                            autoFocus
                          />
                          <Search className="absolute right-2.5 top-2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>

                      {/* لیست */}
                      {filteredTemplates.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground text-xs">
                          ثبتی یافت نشد.
                        </div>
                      ) : (
                        filteredTemplates.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => handleSelectTemplate(t)}
                            className={`w-full text-right px-3 py-2 text-xs rounded-md transition-all flex items-start gap-2 ${
                              selectedTemplate?.id === t.id
                                ? "bg-primary text-primary-foreground font-bold"
                                : "hover:bg-muted text-foreground/80 hover:text-foreground"
                            }`}
                          >
                            <span className="shrink-0 font-mono text-[10px] mt-0.5 opacity-60">{t.code}</span>
                            <span className="flex-1">
                              <span className="font-bold">{t.title}</span>
                              <span className="block text-[11px] opacity-70 mt-0.5">{t.description}</span>
                            </span>
                          </button>
                        ))
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>

        {selectedTemplate && (
          <>
            {/* اطلاعات سند */}
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">دوره مالی</Label>
                    <select
                      value={docFields.fiscalYear}
                      onChange={(e) => setDocFields((p) => ({ ...p, fiscalYear: e.target.value }))}
                      className="w-full h-9 text-xs rounded-lg border border-input bg-background px-3 focus:outline-none focus:ring-2 focus:ring-ring/30"
                    >
                      {fiscalYears.map((fy) => (
                        <option key={fy._id} value={String(fy.year)}>{fy.year}</option>
                      ))}
                      {fiscalYears.length === 0 && <option value="1405">۱۴۰۵</option>}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">تاریخ سند</Label>
                    <PersianDatePicker
                      value={docFields.documentDate}
                      onChange={(e) => setDocFields((p) => ({ ...p, documentDate: e.target.value }))}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-1">
                    <Label className="text-xs font-semibold">شرح سند</Label>
                    <Input
                      value={docFields.description}
                      onChange={(e) => setDocFields((p) => ({ ...p, description: e.target.value }))}
                      placeholder="شرح سند..."
                      className="h-9 text-xs"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* جدول آرتیکل‌ها */}
            <Card className="mb-4">
              <CardContent className="p-0">
                <div className="px-4 pt-4 pb-2">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5" />
                    ردیف‌های حسابداری
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs" dir="rtl">
                    <thead>
                      <tr className="border-b bg-muted/40">
                        <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground w-20">ماهیت</th>
                        <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground w-24">کد معین</th>
                        <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground">نام حساب</th>
                        {selectedTemplate.lines[0]?.section && (
                          <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground w-36">بخش</th>
                        )}
                        <th className="px-3 py-2.5 text-right font-semibold text-blue-600 w-36">بدهکار (ریال)</th>
                        <th className="px-3 py-2.5 text-right font-semibold text-rose-600 w-36">بستانکار (ریال)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTemplate.lines.map((line, idx) => {
                        const isDebit = line.type === "debit";
                        const val = lineAmounts[idx] || "";
                        return (
                          <tr key={idx} className="border-b last:border-0 hover:bg-muted/10">
                            <td className="px-3 py-2.5">
                              <Badge
                                variant="outline"
                                className={isDebit
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : "bg-rose-50 text-rose-700 border-rose-200"
                                }
                              >
                                {isDebit ? "بدهکار" : "بستانکار"}
                              </Badge>
                            </td>
                            <td className="px-3 py-2.5 font-mono font-semibold">{line.accountCode}</td>
                            <td className="px-3 py-2.5 text-foreground/80">{line.accountName}</td>
                            {selectedTemplate.lines[0]?.section && (
                              <td className="px-3 py-2.5 text-muted-foreground text-[11px]">{line.section || "—"}</td>
                            )}
                            <td className="px-3 py-2">
                              {isDebit ? (
                                <Input
                                  value={val}
                                  onChange={(e) => handleAmountChange(idx, e.target.value)}
                                  placeholder="مبلغ..."
                                  className="h-8 text-xs font-mono text-blue-700"
                                  dir="ltr"
                                />
                              ) : (
                                <span className="text-muted-foreground/30 px-2">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              {!isDebit ? (
                                <Input
                                  value={val}
                                  onChange={(e) => handleAmountChange(idx, e.target.value)}
                                  placeholder="مبلغ..."
                                  className="h-8 text-xs font-mono text-rose-700"
                                  dir="ltr"
                                />
                              ) : (
                                <span className="text-muted-foreground/30 px-2">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* نوار تراز */}
                <div className="flex items-center gap-6 border-t px-4 py-2.5 bg-muted/20 text-xs flex-wrap">
                  <span className="text-muted-foreground">
                    جمع بدهکار:{" "}
                    <span className="font-semibold text-blue-700">
                      {totals.debit.toLocaleString("fa-IR")}
                    </span>
                  </span>
                  <span className="text-muted-foreground">
                    جمع بستانکار:{" "}
                    <span className="font-semibold text-rose-700">
                      {totals.credit.toLocaleString("fa-IR")}
                    </span>
                  </span>
                  <span
                    className={`font-semibold ${
                      totals.diff === 0 && totals.debit > 0
                        ? "text-green-600"
                        : "text-rose-600 flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-lg"
                    }`}
                  >
                    {totals.diff === 0 && totals.debit > 0 ? (
                      "تراز (اختلاف: ۰)"
                    ) : (
                      <>
                        <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
                        <span>
                          سند ناتراز است! (اختلاف:{" "}
                          {Math.abs(totals.diff).toLocaleString("fa-IR")} ریال)
                        </span>
                      </>
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* الزامات سناما */}
            {sanamaRows.length > 0 && (
              <Card className="mb-4">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                      <FileText className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">الزامات سناما</h3>
                      <p className="text-[11px] text-muted-foreground">
                        تمام فیلدهای زیر اجباری هستند — {sanamaRows.length} فیلد
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {sanamaRows.map((rowDef) => {
                      const key = `sanama_${rowDef.row}`;
                      return (
                        <SanamaField
                          key={rowDef.row}
                          rowDef={rowDef}
                          value={sanamaValues[key]}
                          onChange={(val) =>
                            setSanamaValues((p) => ({ ...p, [key]: val }))
                          }
                        />
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* دکمه صدور */}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={
                  loading ||
                  totals.debit <= 0 ||
                  totals.diff !== 0
                }
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-10 px-6"
              >
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
