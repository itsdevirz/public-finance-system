import { useState, useCallback, useEffect } from "react";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Printer, FileDown, BookOpen, Loader2, AlertCircle, ChevronDown,
  Users, Layers, List, Hash,
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
      { id: "person", label: "اشخاص",               mode: "grouped", xmlCode: "person" },
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

// ─── helpers ─────────────────────────────────────────────────────────────────
function fmtNum(n) {
  if (n === null || n === undefined || n === 0) return "—";
  return Number(n).toLocaleString("fa-IR");
}

function exportCSV(rows, label, columns) {
  const headers = columns.map((c) => c.label);
  const body = rows.map((r) => columns.map((c) => {
    const v = r[c.key];
    return typeof v === "string" ? `"${v}"` : (v ?? "");
  }).join(","));
  const csv = [headers.join(","), ...body].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `مرور-حساب-${label}.csv`;
  a.click();
  URL.revokeObjectURL(url);
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

// ─── تعریف ستون‌ها برای هر سطح ───────────────────────────────────────────────
function getColumns(item) {
  if (!item) return [];

  // ستون‌های مشترک ثابت (بدون ستون اول و دوم که متغیرند)
  const fixedCols = [
    { key: "debit",      label: "بدهکار",     color: "text-blue-700",  align: "left" },
    { key: "credit",     label: "بستانکار",   color: "text-rose-700",  align: "left" },
    { key: "balance",    label: "مانده",       color: "",               align: "left" },
    { key: "nature",     label: "ماهیت",       color: "",               align: "center" },
  ];

  // ستون‌های اضافه فقط برای سطح lines (حساب معین، تفصیلی، سناما)
  const docCols = [
    { key: "doc_number", label: "شماره سند",  color: "text-muted-foreground", align: "right" },
    { key: "doc_date",   label: "تاریخ",      color: "text-muted-foreground", align: "right" },
  ];

  if (item.mode === "grouped") {
    if (item.xmlCode === "group") {
      // گروه حساب: فقط ۱ رقم کد
      return [
        { key: "account_code", label: "کد گروه", color: "font-mono font-semibold", align: "right" },
        { key: "account_name", label: "نام گروه حساب", color: "", align: "right" },
        ...fixedCols,
      ];
    }
    if (item.xmlCode === "main") {
      // حساب کل: ۳ رقم
      return [
        { key: "account_code", label: "کد حساب کل", color: "font-mono font-semibold", align: "right" },
        { key: "account_name", label: "نام حساب کل", color: "", align: "right" },
        ...fixedCols,
      ];
    }
    if (item.xmlCode === "person") {
      // اشخاص: شناسه + نام شخص
      return [
        { key: "account_code", label: "شناسه شخص", color: "font-mono font-semibold", align: "right" },
        { key: "account_name", label: "نام شخص", color: "", align: "right" },
        ...fixedCols,
      ];
    }
    return [
      { key: "account_code", label: "کد حساب", color: "font-mono font-semibold", align: "right" },
      { key: "account_name", label: "نام حساب", color: "", align: "right" },
      ...fixedCols,
    ];
  }

  // سطح lines (معین، تفصیلی، سناما)
  return [
    { key: "account_code", label: "کد حساب", color: "font-mono font-semibold", align: "right" },
    { key: "account_name", label: "نام حساب", color: "", align: "right" },
    ...fixedCols,
    ...docCols,
  ];
}

// ─── badge ماهیت ─────────────────────────────────────────────────────────────
function NatureBadge({ nature }) {
  const cls =
    nature === "بدهکار"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : nature === "بستانکار"
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : "bg-emerald-50 text-emerald-700 border-emerald-200";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${cls}`}>
      {nature}
    </span>
  );
}

// ─── رنگ مانده بر اساس ماهیت ─────────────────────────────────────────────────
function balanceColor(nature) {
  if (nature === "بدهکار")   return "text-blue-700";
  if (nature === "بستانکار") return "text-rose-700";
  return "text-emerald-700";
}

// نقشه مسیر به آیتم پیش‌فرض
const ROUTE_DEFAULT_MAP = {
  "account-review-main":   "main",
  "account-review-group":  "group",
  "account-review-person": "person",
  "account-review":        "moein",
};

// ─── صفحه اصلی ───────────────────────────────────────────────────────────────
export default function AccountReview() {
  const location = useLocation();
  const [activeItem, setActiveItem] = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [rows,       setRows]       = useState(null);
  const [totals,     setTotals]     = useState({});
  const [meta,       setMeta]       = useState(null);

  // پیدا کردن تمام آیتم‌های سایدبار در یک آرایه مسطح
  const allItems = SIDEBAR_SECTIONS.flatMap((s) => s.items);

  const handleSelect = useCallback(async (item) => {
    setActiveItem(item);
    setFetchError("");
    setLoading(true);
    setRows(null);
    setMeta(null);

    try {
      let res;
      if (item.mode === "grouped") {
        const lvl = item.xmlCode === "person" ? "person"
                  : item.xmlCode === "main"   ? "main"
                  : "group";
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
            <Card>
              <CardContent className="p-0">
                {/* toolbar */}
                <div className="flex items-center justify-between px-4 py-3 border-b flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {activeItem?.xmlCode === "person" ? (
                      <Users className="h-4 w-4 text-primary" />
                    ) : activeItem?.xmlCode === "group" ? (
                      <Layers className="h-4 w-4 text-primary" />
                    ) : activeItem?.xmlCode === "main" ? (
                      <Hash className="h-4 w-4 text-primary" />
                    ) : (
                      <BookOpen className="h-4 w-4 text-primary" />
                    )}
                    <span className="text-sm font-bold">مرور حساب‌ها</span>
                    {meta && (
                      <>
                        <span className="text-xs font-semibold text-primary border border-primary/30 rounded px-2 py-0.5 bg-primary/5">
                          {meta.label}
                        </span>
                        <span className="text-xs text-muted-foreground border rounded px-2 py-0.5 bg-muted/50">
                          {meta.count} ردیف
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline" size="sm" className="gap-1 h-8 text-xs"
                      onClick={() => printTable("#account-review-table", `مرور حساب‌ها — ${meta?.label ?? ""}`)}
                    >
                      <Printer className="h-3.5 w-3.5" /> چاپ
                    </Button>
                    <Button
                      variant="outline" size="sm" className="gap-1 h-8 text-xs"
                      onClick={() => exportCSV(rows, meta?.label ?? "", columns)}
                    >
                      <FileDown className="h-3.5 w-3.5" /> اکسل
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto" id="account-review-table">
                  {rows.length === 0 ? (
                    <div className="py-16 text-center text-muted-foreground text-sm" dir="rtl">
                      <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-20" />
                      <p>سندی برای این نوع حساب یافت نشد</p>
                    </div>
                  ) : (
                    <table className="w-full text-xs" dir="rtl">
                      <thead>
                        <tr className="border-b bg-muted/40">
                          {columns.map((col) => (
                            <th
                              key={col.key}
                              className={`px-3 py-2.5 font-bold text-muted-foreground whitespace-nowrap
                                ${col.align === "left"   ? "text-left"   : ""}
                                ${col.align === "center" ? "text-center" : ""}
                                ${col.align === "right"  ? "text-right"  : ""}
                                ${col.key === "debit"  ? "text-blue-700" : ""}
                                ${col.key === "credit" ? "text-rose-700" : ""}
                              `}
                            >
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, idx) => (
                          <tr
                            key={`${row.account_code ?? row.doc_id}-${idx}`}
                            className={`border-b transition-colors ${
                              idx % 2 === 0 ? "hover:bg-muted/30" : "bg-muted/10 hover:bg-muted/30"
                            }`}
                          >
                            {columns.map((col) => {
                              const val = row[col.key];

                              if (col.key === "nature") {
                                return (
                                  <td key={col.key} className="px-3 py-2 text-center">
                                    <NatureBadge nature={val} />
                                  </td>
                                );
                              }
                              if (col.key === "balance") {
                                return (
                                  <td key={col.key} className={`px-3 py-2 text-left font-mono tabular-nums whitespace-nowrap ${balanceColor(row.nature)}`}>
                                    {fmtNum(Math.abs(val ?? 0))}
                                  </td>
                                );
                              }
                              if (col.key === "debit") {
                                return (
                                  <td key={col.key} className="px-3 py-2 text-left font-mono text-blue-700 tabular-nums whitespace-nowrap">
                                    {(val ?? 0) > 0 ? fmtNum(val) : "—"}
                                  </td>
                                );
                              }
                              if (col.key === "credit") {
                                return (
                                  <td key={col.key} className="px-3 py-2 text-left font-mono text-rose-700 tabular-nums whitespace-nowrap">
                                    {(val ?? 0) > 0 ? fmtNum(val) : "—"}
                                  </td>
                                );
                              }
                              if (col.key === "account_code") {
                                return (
                                  <td key={col.key} className="px-3 py-2 font-mono font-semibold whitespace-nowrap">
                                    {val || "—"}
                                  </td>
                                );
                              }
                              if (col.key === "account_name") {
                                return (
                                  <td key={col.key} className="px-3 py-2 max-w-[220px] truncate" title={val}>
                                    {val || "—"}
                                  </td>
                                );
                              }
                              return (
                                <td key={col.key} className={`px-3 py-2 text-xs text-muted-foreground whitespace-nowrap
                                  ${col.align === "left" ? "text-left font-mono tabular-nums" : ""}
                                `}>
                                  {val || "—"}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 bg-muted/30 font-bold">
                          <td className="px-3 py-2.5" colSpan={2}>
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
          )}
        </div>
      </div>
    </PageShell>
  );
}
