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
      { id: "detail", label: "حساب تفصیلی",         mode: "lines",   xmlCode: "detail" },
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
  const [open, setOpen] = useState(true);
  const hasActive = section.items.some((i) => i.id === activeId);
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

  const allItems = SIDEBAR_SECTIONS.flatMap((s) => s.items);

  const handleSelect = useCallback(async (item) => {
    setActiveItem(item);
    setFetchError("");
    setLoading(true);
    setRows(null);
    setMeta(null);
    setSearchText("");
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

  // فیلتر جستجو — برای همه حالت‌ها (اشخاص و حساب‌ها و سناما)
  const displayRows = (rows ?? []).filter((r) => {
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
      (r.account_name ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <PageShell>
      <PageHeader
        title="مرور حساب‌ها"
        description="مشاهده اسناد ثبت‌شده بر اساس نوع حساب"
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
                <p className="text-sm">در حال بارگذاری...</p>
              </CardContent>
            </Card>
          )}
          {!loading && rows === null && !fetchError && (
            <Card>
              <CardContent className="py-24 flex flex-col items-center gap-3 text-muted-foreground/50">
                <BookOpen className="h-12 w-12 opacity-20" />
                <p className="text-sm font-medium">نوع حساب را از سایدبار انتخاب کنید</p>
                <p className="text-xs">اسناد به صورت خودکار نمایش داده می‌شوند</p>
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
                      <span className="text-sm font-bold">مرور حساب‌ها</span>
                      {meta && (
                        <>
                          <span className="text-xs font-semibold text-primary border border-primary/30 rounded px-2 py-0.5 bg-primary/5">
                            {meta.label}
                          </span>
                          <span className="text-xs text-muted-foreground border rounded px-2 py-0.5 bg-muted/50">
                            {searchText
                              ? `${displayRows.length} از ${meta.count} مورد`
                              : `${meta.count} ردیف`}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex gap-2 items-center">
                      {rows && rows.length > 0 && (
                        <input
                          type="text" dir="rtl"
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                          placeholder="جستجو..."
                          className="h-8 text-xs border rounded-md px-2.5 bg-white focus:outline-none focus:border-primary w-44"
                        />
                      )}
                      <Button variant="outline" size="sm" className="gap-1 h-8 text-xs"
                        onClick={() => printTable("#account-review-table", `مرور حساب‌ها — ${meta?.label ?? ""}`)}>
                        <Printer className="h-3.5 w-3.5" /> چاپ
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1 h-8 text-xs"
                        onClick={() => exportCSV(displayRows, meta?.label ?? "", columns)}>
                        <FileDown className="h-3.5 w-3.5" /> اکسل
                      </Button>
                    </div>
                  </div>

                  <div className="overflow-x-auto" id="account-review-table">
                    {displayRows.length === 0 ? (
                      <div className="py-16 text-center text-muted-foreground text-sm" dir="rtl">
                        {isPersonMode ? (
                          <>
                            <Users className="h-8 w-8 mx-auto mb-2 opacity-20" />
                            <p>{searchText ? "شخصی با این مشخصات یافت نشد" : "هیچ شخصی در سیستم ثبت نشده است"}</p>
                          </>
                        ) : (
                          <>
                            <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-20" />
                            <p>سندی برای این نوع حساب یافت نشد</p>
                          </>
                        )}
                      </div>
                    ) : (
                      <table className="w-full text-xs" dir="rtl">
                        <thead>
                          <tr className="border-b bg-muted/40">
                            {columns.map((col) => (
                              <th key={col.key}
                                className={`px-3 py-2.5 font-bold text-muted-foreground whitespace-nowrap
                                  ${col.align === "left" ? "text-left" : col.align === "center" ? "text-center" : "text-right"}
                                  ${col.key === "debit" ? "!text-blue-700" : ""}
                                  ${col.key === "credit" ? "!text-rose-700" : ""}
                                `}
                              >
                                {col.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {displayRows.map((row, idx) => {
                            const rowKey = isPersonMode
                              ? (row.nominee_code ?? idx)
                              : `${row.account_code ?? row.doc_id}-${idx}`;
                            return (
                              <tr key={rowKey}
                                className={`border-b transition-colors
                                  ${idx % 2 === 0 ? "hover:bg-muted/30" : "bg-muted/10 hover:bg-muted/30"}
                                `}
                              >
                                {columns.map((col) => {
                                  const val = row[col.key];
                                  if (col.key === "nature") return (
                                    <td key={col.key} className="px-3 py-2 text-center">
                                      <NatureBadge nature={val} />
                                    </td>
                                  );
                                  if (col.key === "balance") return (
                                    <td key={col.key} className={`px-3 py-2 text-left font-mono font-semibold tabular-nums whitespace-nowrap ${balanceColor(row.nature)}`}>
                                      {fmtNum(Math.abs(val ?? 0))}
                                    </td>
                                  );
                                  if (col.key === "debit") return (
                                    <td key={col.key} className="px-3 py-2 text-left font-mono text-blue-700 tabular-nums whitespace-nowrap">
                                      {(val ?? 0) > 0 ? fmtNum(val) : "—"}
                                    </td>
                                  );
                                  if (col.key === "credit") return (
                                    <td key={col.key} className="px-3 py-2 text-left font-mono text-rose-700 tabular-nums whitespace-nowrap">
                                      {(val ?? 0) > 0 ? fmtNum(val) : "—"}
                                    </td>
                                  );
                                  if (col.key === "nominee_code" || col.key === "account_code") return (
                                    <td key={col.key} className="px-3 py-2 font-mono font-semibold whitespace-nowrap text-right">
                                      {val || "—"}
                                    </td>
                                  );
                                  if (col.key === "person_name" || col.key === "account_name") return (
                                    <td key={col.key} className="px-3 py-2 max-w-[240px] truncate text-right" title={val}>
                                      {val || "—"}
                                    </td>
                                  );
                                  return (
                                    <td key={col.key} className={`px-3 py-2 text-xs text-muted-foreground whitespace-nowrap
                                      ${col.align === "left" ? "text-left font-mono tabular-nums" : "text-right"}
                                    `}>
                                      {val || "—"}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>

                        <tfoot>
                          <tr className="border-t-2 bg-muted/30 font-bold">
                            <td className="px-3 py-2.5 text-right" colSpan={2}>
                              <span className="text-xs font-bold">جمع کل</span>
                            </td>
                            {columns.slice(2).map((col) => {
                              if (col.key === "debit") return (
                                <td key="debit" className="px-3 py-2.5 text-left font-mono text-blue-700 tabular-nums whitespace-nowrap">
                                  {fmtNum(totals.debit)}
                                </td>
                              );
                              if (col.key === "credit") return (
                                <td key="credit" className="px-3 py-2.5 text-left font-mono text-rose-700 tabular-nums whitespace-nowrap">
                                  {fmtNum(totals.credit)}
                                </td>
                              );
                              if (col.key === "balance") return (
                                <td key="balance" className="px-3 py-2.5 text-left font-mono tabular-nums whitespace-nowrap">
                                  {fmtNum(Math.abs(totals.balance ?? 0))}
                                </td>
                              );
                              return <td key={col.key} />;
                            })}
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
