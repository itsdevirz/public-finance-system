import { useState, useCallback, useEffect } from "react";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Printer, FileDown, BookOpen, Loader2, AlertCircle, ChevronDown,
  Users, Layers, Hash, TrendingUp, TrendingDown, Minus,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import api from "@/api";
import { printTable } from "@/lib/printUtils";
import subAccountTitles from "@/data/subAccountTitles.json";
import { cn } from "@/lib/utils";

// ─── ساختار منوی سایدبار ─────────────────────────────────────────────────────
const SIDEBAR_SECTIONS = [
  {
    id: "accounts",
    label: "مرور حساب",
    items: [
      { id: "moein",  label: "حساب معین (۵ رقم)",  mode: "lines",   xmlCode: "moein"  },
      { id: "main",   label: "حساب کل (۳ رقم)",    mode: "grouped", xmlCode: "main"   },
      { id: "group",  label: "گروه حساب (۱ رقم)",  mode: "grouped", xmlCode: "group"  },
      { id: "person", label: "اشخاص",               mode: "persons", xmlCode: "person" },
    ],
  },
  {
    id: "sanama",
    label: "الزامات سناما",
    items: subAccountTitles.map((r) => ({
      id:      `sanama_${r.row}`,
      label:   r.title,
      mode:    "lines",
      xmlCode: r.xmlCode,
    })),
  },
];

// نقشه مسیر به آیتم پیش‌فرض
const ROUTE_DEFAULT_MAP = {
  "account-review-main":   "main",
  "account-review-group":  "group",
  "account-review-person": "person",
  "account-review":        "moein",
};

// ─── helpers ─────────────────────────────────────────────────────────────────
function fmtNum(n) {
  if (n === null || n === undefined || n === 0) return "—";
  return Number(n).toLocaleString("fa-IR");
}

function exportCSV(rows, label, columns) {
  const headers = columns.map((c) => c.label);
  const body = rows.map((r) =>
    columns.map((c) => {
      const v = r[c.key];
      return typeof v === "string" ? `"${v}"` : (v ?? "");
    }).join(",")
  );
  const csv = [headers.join(","), ...body].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `مرور-حساب-${label}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function balanceColor(nature) {
  if (nature === "بدهکار")   return "text-blue-700";
  if (nature === "بستانکار") return "text-rose-700";
  return "text-emerald-700";
}

// ─── تعریف ستون‌ها برای هر سطح ───────────────────────────────────────────────
function getColumns(item) {
  if (!item) return [];
  const fixedCols = [
    { key: "debit",   label: "بدهکار",   align: "left"   },
    { key: "credit",  label: "بستانکار", align: "left"   },
    { key: "balance", label: "مانده",    align: "left"   },
    { key: "nature",  label: "ماهیت",    align: "center" },
  ];
  const docCols = [
    { key: "doc_number", label: "شماره سند", align: "right" },
    { key: "doc_date",   label: "تاریخ",     align: "right" },
  ];
  if (item.id && item.id.startsWith("sanama_")) {
    let codeLabel = item.label;
    let nameLabel = `عنوان ${item.label}`;

    if (item.xmlCode === "DebitSubject") {
      codeLabel = "کد موضوع";
      nameLabel = "عنوان موضوع بدهی";
    } else if (item.label.startsWith("شماره ")) {
      codeLabel = item.label;
      nameLabel = `عنوان ${item.label.substring(6)}`;
    } else if (item.label.startsWith("مشخصات ")) {
      codeLabel = item.label.replace("مشخصات", "کد");
      nameLabel = `عنوان ${item.label.substring(7)}`;
    } else if (item.label.startsWith("مشحصات ")) { // handle potential typo in data
      codeLabel = item.label.replace("مشحصات", "کد");
      nameLabel = `عنوان ${item.label.substring(7)}`;
    }

    return [
      { key: "account_code", label: codeLabel, align: "right" },
      { key: "account_name", label: nameLabel, align: "right" },
      ...fixedCols,
    ];
  }
  if (item.mode === "persons") {
    return [
      { key: "nominee_code", label: "شناسه شخص", align: "right" },
      { key: "person_name",  label: "نام شخص",   align: "right" },
      ...fixedCols,
    ];
  }
  if (item.mode === "grouped") {
    const codeLabel = item.xmlCode === "group" ? "کد گروه" : "کد حساب کل";
    const nameLabel = item.xmlCode === "group" ? "نام گروه حساب" : "نام حساب کل";
    return [
      { key: "account_code", label: codeLabel, align: "right" },
      { key: "account_name", label: nameLabel, align: "right" },
      ...fixedCols,
    ];
  }
  return [
    { key: "account_code", label: "کد حساب", align: "right" },
    { key: "account_name", label: "نام حساب", align: "right" },
    ...fixedCols,
    ...docCols,
  ];
}

// ─── badge ماهیت ─────────────────────────────────────────────────────────────
function NatureBadge({ nature }) {
  if (nature === "بدهکار") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-blue-50 text-blue-700 border-blue-200">
      <TrendingUp className="h-2.5 w-2.5" /> بدهکار
    </span>
  );
  if (nature === "بستانکار") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-rose-50 text-rose-700 border-rose-200">
      <TrendingDown className="h-2.5 w-2.5" /> بستانکار
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200">
      <Minus className="h-2.5 w-2.5" /> تراز
    </span>
  );
}

// ─── SidebarSection ───────────────────────────────────────────────────────────
function SidebarSection({ section, activeId, onSelect }) {
  const hasActive = section.items.some((i) => i.id === activeId);
  const [open, setOpen] = useState(() => hasActive || section.id !== "sanama");
  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[11px] font-bold text-muted-foreground uppercase tracking-wide hover:bg-muted/40 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          {hasActive && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
          {section.label}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "" : "-rotate-90"}`} />
      </button>
      {open && (
        <div className="mt-0.5 space-y-0.5">
          {section.items.map((item) => {
            const isActive = item.id === activeId;
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all text-right ${
                  isActive
                    ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                    : "text-foreground/70 hover:bg-muted/60 hover:text-foreground"
                }`}
              >
                <span className={`h-3.5 w-3.5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                  isActive ? "border-primary-foreground" : "border-border"
                }`}>
                  {isActive && <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
                </span>
                <span className="flex-1 text-right leading-snug">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── کارت‌های خلاصه اشخاص ────────────────────────────────────────────────────
function PersonsSummaryCards({ rows, totals }) {
  const debtors   = rows.filter((r) => r.nature === "بدهکار");
  const creditors = rows.filter((r) => r.nature === "بستانکار");
  const balanced  = rows.filter((r) => r.nature === "تراز");
  return (
    <div className="grid grid-cols-3 gap-3 mb-4" dir="rtl">
      <div className="rounded-xl border bg-blue-50/60 border-blue-100 p-3 flex flex-col gap-1">
        <div className="flex items-center gap-2 text-blue-700">
          <TrendingUp className="h-4 w-4" />
          <span className="text-xs font-bold">بدهکاران</span>
          <span className="mr-auto text-xs font-bold bg-blue-100 text-blue-700 rounded-full px-2 py-0.5">
            {debtors.length} نفر
          </span>
        </div>
        <p className="text-sm font-bold font-mono text-blue-800 tabular-nums mt-1">
          {Number(totals.debit || 0).toLocaleString("fa-IR")} ریال
        </p>
      </div>
      <div className="rounded-xl border bg-rose-50/60 border-rose-100 p-3 flex flex-col gap-1">
        <div className="flex items-center gap-2 text-rose-700">
          <TrendingDown className="h-4 w-4" />
          <span className="text-xs font-bold">بستانکاران</span>
          <span className="mr-auto text-xs font-bold bg-rose-100 text-rose-700 rounded-full px-2 py-0.5">
            {creditors.length} نفر
          </span>
        </div>
        <p className="text-sm font-bold font-mono text-rose-800 tabular-nums mt-1">
          {Number(totals.credit || 0).toLocaleString("fa-IR")} ریال
        </p>
      </div>
      <div className="rounded-xl border bg-muted/40 border-border p-3 flex flex-col gap-1">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Minus className="h-4 w-4" />
          <span className="text-xs font-bold">تراز (صفر)</span>
          <span className="mr-auto text-xs font-bold bg-muted text-muted-foreground rounded-full px-2 py-0.5">
            {balanced.length} نفر
          </span>
        </div>
        <p className="text-sm font-bold font-mono text-foreground/60 tabular-nums mt-1">
          {rows.length} شخص در مجموع
        </p>
      </div>
    </div>
  );
}

// ─── صفحه اصلی ───────────────────────────────────────────────────────────────
export default function AccountReview() {
  const location = useLocation();
  const [activeItem, setActiveItem] = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [rows,       setRows]       = useState(null);
  const [totals,     setTotals]     = useState({});
  const [meta,       setMeta]       = useState(null);
  const [searchText, setSearchText] = useState("");

  // وضعیت تجمیع کد معین و سطر بازشده (Expanded Rows)
  const [isAggregated, setIsAggregated] = useState(true);
  const [expandedCodes, setExpandedCodes] = useState({});

  const allItems = SIDEBAR_SECTIONS.flatMap((s) => s.items);

  const handleSelect = useCallback(async (item) => {
    setActiveItem(item);
    setFetchError("");
    setLoading(true);
    setRows(null);
    setMeta(null);
    setSearchText("");
    setExpandedCodes({});
    try {
      let res;
      if (item.mode === "persons") {
        res = await api.get("/api/ledger/persons-balance");
      } else if (item.mode === "grouped") {
        const lvl = item.xmlCode === "main" ? "main" : "group";
        res = await api.get(`/api/ledger/grouped-lines?level=${lvl}`);
      } else {
        res = await api.get(
          `/api/ledger/account-lines?xmlCode=${encodeURIComponent(item.xmlCode)}`
        );
      }
      const data = res.data.data ?? [];
      setRows(data);
      setTotals(res.data.totals ?? {});
      setMeta({ label: item.label, count: data.length });
    } catch (err) {
      setFetchError(err?.response?.data?.message ?? "خطا در دریافت اطلاعات");
    } finally {
      setLoading(false);
    }
  }, []);

  // انتخاب خودکار بر اساس مسیر URL
  useEffect(() => {
    const lastSegment = location.pathname.split("/").pop();
    const defaultId   = ROUTE_DEFAULT_MAP[lastSegment] ?? "moein";
    const item        = allItems.find((i) => i.id === defaultId);
    if (item) handleSelect(item);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const columns = getColumns(activeItem);
  const isPersonMode = activeItem?.mode === "persons";

  // تابع تجمیع‌کننده کد معین‌ها (Moein Aggregator)
  const aggregateMoeinRows = (rawRows) => {
    if (!rawRows || !Array.isArray(rawRows)) return [];
    const map = new Map();

    rawRows.forEach((r) => {
      const code = r.account_code || r.nominee_code || "سایر";
      const name = r.account_name || r.person_name || "کد معین نامشخص";

      if (!map.has(code)) {
        map.set(code, {
          account_code: code,
          account_name: name,
          debit: 0,
          credit: 0,
          details: [],
        });
      }

      const item = map.get(code);
      const d = Number(r.debit) || 0;
      const c = Number(r.credit) || 0;

      item.debit += d;
      item.credit += c;
      item.details.push(r);
    });

    return Array.from(map.values()).map((item) => {
      const diff = item.debit - item.credit;
      const balance = Math.abs(diff);
      let nature = "تراز";
      if (diff > 0) nature = "بدهکار";
      else if (diff < 0) nature = "بستانکار";

      return {
        ...item,
        balance,
        nature,
        doc_count: item.details.length,
      };
    });
  };

  // داده‌های فیلترشده اولیه
  const filteredRawRows = (rows ?? []).filter((r) => {
    if (!searchText) return true;
    const q = searchText.toLowerCase();
    if (isPersonMode) {
      return (
        (r.nominee_code ?? "").toLowerCase().includes(q) ||
        (r.person_name  ?? "").toLowerCase().includes(q)
      );
    }
    return (
      (r.account_code ?? "").toLowerCase().includes(q) ||
      (r.account_name ?? "").toLowerCase().includes(q) ||
      (r.doc_number   ?? "").toLowerCase().includes(q) ||
      (r.description  ?? "").toLowerCase().includes(q)
    );
  });

  // سطرهای پردازش‌شده (تجمیعی بر اساس کد معین یا تفکیکی)
  const aggregatedRows = isPersonMode || !isAggregated ? filteredRawRows : aggregateMoeinRows(filteredRawRows);

  const toggleExpand = (code) => {
    setExpandedCodes((prev) => ({ ...prev, [code]: !prev[code] }));
  };

  return (
    <PageShell>
      <PageHeader
        title="مرور حساب‌ها (تجمیع کد معین‌ها)"
        description="گزارش مرور حساب با قابلیت تجمیع کد معین‌ها (مانند ۱۱۰۰۱) و کلیک جهت مشاهده ریز تراکنش‌ها"
      />
      <div className="flex gap-4 items-start" dir="rtl">
        {/* ── سایدبار ── */}
        <aside className="w-60 shrink-0 sticky top-4">
          <Card className="overflow-hidden">
            <div className="px-4 py-3 border-b bg-muted/20">
              <span className="text-sm font-bold">نوع حساب</span>
              <p className="text-[10px] text-muted-foreground mt-0.5">روی هر مورد کلیک کنید</p>
            </div>
            <div className="overflow-y-auto max-h-[calc(100vh-220px)] px-2 py-2">
              {SIDEBAR_SECTIONS.map((section) => (
                <SidebarSection
                  key={section.id}
                  section={section}
                  activeId={activeItem?.id ?? null}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          </Card>
        </aside>

        {/* ── محتوا ── */}
        <div className="flex-1 min-w-0 space-y-4">
          {fetchError && (
            <Card className="border-rose-200 bg-rose-50">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
                <p className="text-sm text-rose-700">{fetchError}</p>
              </CardContent>
            </Card>
          )}
          {loading && (
            <Card>
              <CardContent className="py-20 flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm">در حال بارگذاری اطلاعات مرور حساب...</p>
              </CardContent>
            </Card>
          )}
          {!loading && rows === null && !fetchError && (
            <Card>
              <CardContent className="py-24 flex flex-col items-center gap-3 text-muted-foreground/50">
                <BookOpen className="h-12 w-12 opacity-20" />
                <p className="text-sm font-medium">نوع حساب را از سایدبار انتخاب کنید</p>
                <p className="text-xs">کد معین‌ها به صورت تجمیعی نمایش داده می‌شوند</p>
              </CardContent>
            </Card>
          )}

          {!loading && rows !== null && (
            <>
              {isPersonMode && rows.length > 0 && (
                <PersonsSummaryCards rows={rows} totals={totals} />
              )}
              <Card>
                <CardContent className="p-0">
                  {/* toolbar */}
                  <div className="flex items-center justify-between px-4 py-3 border-b flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isPersonMode ? <Users className="h-4 w-4 text-primary" />
                        : activeItem?.xmlCode === "group" ? <Layers className="h-4 w-4 text-primary" />
                        : activeItem?.xmlCode === "main"  ? <Hash className="h-4 w-4 text-primary" />
                        : <BookOpen className="h-4 w-4 text-primary" />}
                      <span className="text-sm font-bold">گزارش مرور حساب</span>
                      {meta && (
                        <>
                          <span className="text-xs font-semibold text-primary border border-primary/30 rounded px-2 py-0.5 bg-primary/5">
                            {meta.label}
                          </span>
                          <span className="text-xs text-muted-foreground border rounded px-2 py-0.5 bg-muted/50">
                            {isAggregated && !isPersonMode ? `${aggregatedRows.length} کد معین تجمیعی` : `${filteredRawRows.length} اسناد`}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex gap-2 items-center">
                      {/* دکمه سوییچ بین حالت تجمیعی کد معین و تفکیکی */}
                      {!isPersonMode && (
                        <Button
                          variant={isAggregated ? "default" : "outline"}
                          size="sm"
                          className="h-8 text-xs font-bold gap-1.5"
                          onClick={() => setIsAggregated(!isAggregated)}
                        >
                          <Layers className="h-3.5 w-3.5" />
                          {isAggregated ? "نمایش تجمیعی معین (فعال)" : "نمایش تفکیکی اسناد"}
                        </Button>
                      )}

                      {rows && rows.length > 0 && (
                        <input
                          type="text" dir="rtl"
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                          placeholder="جستجوی کد معین، عنوان یا سند..."
                          className="h-8 text-xs border rounded-md px-2.5 bg-white focus:outline-none focus:border-primary w-48"
                        />
                      )}
                      <Button variant="outline" size="sm" className="gap-1 h-8 text-xs"
                        onClick={() => printTable("#account-review-table", `مرور حساب‌ها — ${meta?.label ?? ""}`)}>
                        <Printer className="h-3.5 w-3.5" /> چاپ
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1 h-8 text-xs"
                        onClick={() => exportCSV(aggregatedRows, meta?.label ?? "", columns)}>
                        <FileDown className="h-3.5 w-3.5" /> اکسل
                      </Button>
                    </div>
                  </div>

                  <div className="overflow-x-auto" id="account-review-table">
                    {aggregatedRows.length === 0 ? (
                      <div className="py-16 text-center text-muted-foreground text-sm" dir="rtl">
                        {isPersonMode ? (
                          <>
                            <Users className="h-8 w-8 mx-auto mb-2 opacity-20" />
                            <p>{searchText ? "شخصی با این مشخصات یافت نشد" : "هیچ شخصی در سیستم ثبت نشده است"}</p>
                          </>
                        ) : (
                          <>
                            <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-20" />
                            <p>سندی برای این کد معین یافت نشد</p>
                          </>
                        )}
                      </div>
                    ) : (
                      <table className="w-full text-xs" dir="rtl">
                        <thead>
                          <tr className="border-b bg-muted/40 text-muted-foreground font-bold">
                            {isAggregated && !isPersonMode && <th className="px-3 py-2.5 text-center w-10">جزئیات</th>}
                            <th className="px-3 py-2.5 text-right">کد معین / حساب</th>
                            <th className="px-3 py-2.5 text-right">عنوان کد معین / حساب</th>
                            <th className="px-3 py-2.5 text-left text-blue-700">بدهکار (ریال)</th>
                            <th className="px-3 py-2.5 text-left text-rose-700">بستانکار (ریال)</th>
                            <th className="px-3 py-2.5 text-left">مانده (ریال)</th>
                            <th className="px-3 py-2.5 text-center">ماهیت</th>
                            {isAggregated && !isPersonMode ? (
                              <th className="px-3 py-2.5 text-center">تعداد تراکنش‌ها</th>
                            ) : (
                              <>
                                <th className="px-3 py-2.5 text-right">شماره سند</th>
                                <th className="px-3 py-2.5 text-right">تاریخ</th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {aggregatedRows.map((row, idx) => {
                            const codeKey = row.account_code || `row-${idx}`;
                            const isExpanded = expandedCodes[codeKey];

                            if (isAggregated && !isPersonMode) {
                              return (
                                <tr key={codeKey} className="contents">
                                  {/* سطر اصلی کد معین (تجمیعی) */}
                                  <tr
                                    onClick={() => toggleExpand(codeKey)}
                                    className={cn(
                                      "border-b transition-colors cursor-pointer font-bold select-none",
                                      isExpanded ? "bg-primary/10 hover:bg-primary/15" : (idx % 2 === 0 ? "hover:bg-muted/30" : "bg-muted/10 hover:bg-muted/30")
                                    )}
                                  >
                                    <td className="px-3 py-3 text-center">
                                      <ChevronDown className={cn("h-4 w-4 text-primary transition-transform inline-block", isExpanded ? "rotate-180" : "")} />
                                    </td>
                                    <td className="px-3 py-3 font-mono text-primary text-sm whitespace-nowrap text-right">
                                      {row.account_code}
                                    </td>
                                    <td className="px-3 py-3 text-foreground whitespace-nowrap text-right">
                                      {row.account_name}
                                    </td>
                                    <td className="px-3 py-3 text-left font-mono text-blue-700 tabular-nums whitespace-nowrap">
                                      {row.debit > 0 ? fmtNum(row.debit) : "—"}
                                    </td>
                                    <td className="px-3 py-3 text-left font-mono text-rose-700 tabular-nums whitespace-nowrap">
                                      {row.credit > 0 ? fmtNum(row.credit) : "—"}
                                    </td>
                                    <td className={cn("px-3 py-3 text-left font-mono tabular-nums whitespace-nowrap", balanceColor(row.nature))}>
                                      {fmtNum(row.balance)}
                                    </td>
                                    <td className="px-3 py-3 text-center whitespace-nowrap">
                                      <NatureBadge nature={row.nature} />
                                    </td>
                                    <td className="px-3 py-3 text-center whitespace-nowrap">
                                      <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                        {row.doc_count} سند (کلیک جهت ریز)
                                      </span>
                                    </td>
                                  </tr>

                                  {/* سطر زیرمجموعه بازشونده تراکنش‌های ریز این کد معین */}
                                  {isExpanded && (
                                    <tr className="bg-muted/30 border-b">
                                      <td colSpan={8} className="p-3 pr-8">
                                        <div className="bg-background border border-primary/20 rounded-xl p-3 shadow-xs space-y-2">
                                          <div className="flex items-center justify-between text-xs font-bold text-primary border-b pb-2">
                                            <span>ریز اسناد و تراکنش‌های کد معین {row.account_code} ({row.account_name})</span>
                                            <span>تعداد اسناد: {row.doc_count}</span>
                                          </div>
                                          <div className="overflow-x-auto">
                                            <table className="w-full text-xs text-right">
                                              <thead className="bg-muted/50 text-muted-foreground font-semibold border-b">
                                                <tr>
                                                  <th className="p-2 w-10 text-center">#</th>
                                                  <th className="p-2">شماره سند</th>
                                                  <th className="p-2 text-center">تاریخ سند</th>
                                                  <th className="p-2">شرح تراکنش</th>
                                                  <th className="p-2 text-left text-blue-700">بدهکار (ریال)</th>
                                                  <th className="p-2 text-left text-rose-700">بستانکار (ریال)</th>
                                                </tr>
                                              </thead>
                                              <tbody className="divide-y">
                                                {row.details.map((detail, dIdx) => (
                                                  <tr key={detail.doc_id || dIdx} className="hover:bg-muted/40">
                                                    <td className="p-2 text-center font-mono text-muted-foreground">{dIdx + 1}</td>
                                                    <td className="p-2 font-mono font-bold text-primary">{detail.doc_number || detail.doc_id || "—"}</td>
                                                    <td className="p-2 text-center font-mono">{detail.doc_date || "—"}</td>
                                                    <td className="p-2 text-foreground font-medium">{detail.description || "سند حسابداری معین"}</td>
                                                    <td className="p-2 text-left font-mono text-blue-700 font-bold">{detail.debit > 0 ? fmtNum(detail.debit) : "—"}</td>
                                                    <td className="p-2 text-left font-mono text-rose-700 font-bold">{detail.credit > 0 ? fmtNum(detail.credit) : "—"}</td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </tr>
                              );
                            }

                            // حالت غیر تجمیعی (نمایش مسطح اسناد یا اشخاص)
                            return (
                              <tr key={codeKey} className={cn("border-b transition-colors", idx % 2 === 0 ? "hover:bg-muted/30" : "bg-muted/10 hover:bg-muted/30")}>
                                <td className="px-3 py-2 font-mono font-semibold whitespace-nowrap text-right">{row.account_code || row.nominee_code || "—"}</td>
                                <td className="px-3 py-2 max-w-[240px] truncate text-right">{row.account_name || row.person_name || "—"}</td>
                                <td className="px-3 py-2 text-left font-mono text-blue-700 tabular-nums whitespace-nowrap">{row.debit > 0 ? fmtNum(row.debit) : "—"}</td>
                                <td className="px-3 py-2 text-left font-mono text-rose-700 tabular-nums whitespace-nowrap">{row.credit > 0 ? fmtNum(row.credit) : "—"}</td>
                                <td className={cn("px-3 py-2 text-left font-mono font-semibold tabular-nums whitespace-nowrap", balanceColor(row.nature))}>{fmtNum(Math.abs(row.balance ?? 0))}</td>
                                <td className="px-3 py-2 text-center"><NatureBadge nature={row.nature} /></td>
                                <td className="px-3 py-2 font-mono text-right">{row.doc_number || "—"}</td>
                                <td className="px-3 py-2 font-mono text-right">{row.doc_date || "—"}</td>
                              </tr>
                            );
                          })}
                        </tbody>

                        <tfoot>
                          <tr className="border-t-2 bg-muted/30 font-bold">
                            <td className="px-3 py-2.5 text-right" colSpan={isAggregated && !isPersonMode ? 3 : 2}>
                              <span className="text-xs font-bold">جمع کل</span>
                            </td>
                            <td className="px-3 py-2.5 text-left font-mono text-blue-700 tabular-nums whitespace-nowrap">
                              {fmtNum(totals.debit)}
                            </td>
                            <td className="px-3 py-2.5 text-left font-mono text-rose-700 tabular-nums whitespace-nowrap">
                              {fmtNum(totals.credit)}
                            </td>
                            <td className="px-3 py-2.5 text-left font-mono tabular-nums whitespace-nowrap">
                              {fmtNum(Math.abs(totals.balance ?? 0))}
                            </td>
                            <td colSpan={3} />
                          </tr>
                        </tfoot>
                      </table>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </PageShell>
  );
}
