import { useState, useCallback } from "react";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, FileDown, BookOpen, Loader2, AlertCircle, ChevronDown } from "lucide-react";
import api from "@/api";
import { printTable } from "@/lib/printUtils";
import subAccountTitles from "@/data/subAccountTitles.json";

// ─── ساختار منوی سایدبار ─────────────────────────────────────────────────────
const SIDEBAR_SECTIONS = [
  {
    id: "accounts",
    label: "نوع حساب",
    items: [
      { id: "group",  label: "گروه حساب (۱ رقم)", xmlCode: "group"  },
      { id: "main",   label: "حساب کل (۳ رقم)",    xmlCode: "main"   },
      { id: "moein",  label: "حساب معین (۵ رقم)",  xmlCode: "moein"  },
      { id: "detail", label: "حساب تفصیلی",         xmlCode: "detail" },
      { id: "person", label: "اشخاص",               xmlCode: "NomineeCode" },
    ],
  },
  {
    id: "sanama",
    label: "الزامات سناما",
    items: subAccountTitles.map((r) => ({
      id:      `sanama_${r.row}`,
      label:   r.title,
      xmlCode: r.xmlCode,
    })),
  },
];

// ─── helpers ─────────────────────────────────────────────────────────────────
function fmtNum(n) {
  if (n === null || n === undefined || n === 0) return "—";
  return Number(n).toLocaleString("fa-IR");
}

function exportCSV(rows, label) {
  const headers = ["کد حساب", "نام حساب", "بدهکار", "بستانکار", "مانده سند", "ماهیت", "شماره سند", "تاریخ"];
  const body = rows.map((r) => [
    r.account_code, `"${r.account_name}"`, r.debit, r.credit,
    Math.abs(r.balance), r.nature, r.doc_number, r.doc_date,
  ].join(","));
  const csv = [headers.join(","), ...body].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url;
  a.download = `مرور-حساب-${label}.csv`; a.click();
  URL.revokeObjectURL(url);
}

// ─── SidebarSection (radio-style) ────────────────────────────────────────────
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
                {/* radio indicator */}
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

// ─── صفحه اصلی ───────────────────────────────────────────────────────────────
export default function AccountReview() {
  // آیتم فعال (radio — فقط یکی)
  const [activeItem, setActiveItem] = useState(null);

  // داده
  const [loading,    setLoading]    = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [rows,       setRows]       = useState(null);
  const [totals,     setTotals]     = useState({});
  const [meta,       setMeta]       = useState(null);

  // انتخاب آیتم → بارگذاری فوری
  const handleSelect = useCallback(async (item) => {
    setActiveItem(item);
    setFetchError("");
    setLoading(true);
    setRows(null);
    setMeta(null);

    try {
      const res = await api.get(
        `/api/ledger/account-lines?xmlCode=${encodeURIComponent(item.xmlCode)}`
      );
      const data = res.data.data ?? [];
      const t = res.data.totals ?? {};
      setRows(data);
      setTotals(t);
      setMeta({ label: item.label, count: data.length });
    } catch (err) {
      setFetchError(err?.response?.data?.message ?? "خطا در دریافت اطلاعات");
    } finally {
      setLoading(false);
    }
  }, []);

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

        {/* ── محتوای اصلی ── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* خطا */}
          {fetchError && (
            <Card className="border-rose-200 bg-rose-50">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
                <p className="text-sm text-rose-700">{fetchError}</p>
              </CardContent>
            </Card>
          )}

          {/* لودینگ */}
          {loading && (
            <Card>
              <CardContent className="py-20 flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm">در حال بارگذاری اسناد...</p>
              </CardContent>
            </Card>
          )}

          {/* حالت اولیه */}
          {!loading && rows === null && !fetchError && (
            <Card>
              <CardContent className="py-24 flex flex-col items-center gap-3 text-muted-foreground/50">
                <BookOpen className="h-12 w-12 opacity-20" />
                <p className="text-sm font-medium">نوع حساب را از سایدبار انتخاب کنید</p>
                <p className="text-xs">اسناد به صورت خودکار نمایش داده می‌شوند</p>
              </CardContent>
            </Card>
          )}

          {/* جدول نتایج */}
          {!loading && rows !== null && (
            <Card>
              <CardContent className="p-0">
                {/* toolbar */}
                <div className="flex items-center justify-between px-4 py-3 border-b flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <BookOpen className="h-4 w-4 text-primary" />
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
                    <Button variant="outline" size="sm" className="gap-1 h-8 text-xs"
                      onClick={() => printTable("#account-review-table", `مرور حساب‌ها — ${meta?.label ?? ""}`)}>
                      <Printer className="h-3.5 w-3.5" /> چاپ
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1 h-8 text-xs"
                      onClick={() => exportCSV(rows, meta?.label ?? "")}>
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
                          <th className="px-3 py-2.5 text-right font-bold text-muted-foreground w-24 whitespace-nowrap">کد حساب</th>
                          <th className="px-3 py-2.5 text-right font-bold text-muted-foreground min-w-[160px]">نام حساب</th>
                          <th className="px-3 py-2.5 text-left font-bold text-blue-700 w-28 whitespace-nowrap">بدهکار</th>
                          <th className="px-3 py-2.5 text-left font-bold text-rose-700 w-28 whitespace-nowrap">بستانکار</th>
                          <th className="px-3 py-2.5 text-left font-bold text-foreground/60 w-28 whitespace-nowrap">مانده سند</th>
                          <th className="px-3 py-2.5 text-center font-bold text-foreground/60 w-24 whitespace-nowrap">ماهیت</th>
                          <th className="px-3 py-2.5 text-right font-bold text-foreground/60 w-32 whitespace-nowrap">شماره سند</th>
                          <th className="px-3 py-2.5 text-right font-bold text-foreground/60 w-24 whitespace-nowrap">تاریخ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, idx) => (
                          <tr
                            key={`${row.doc_id}-${row.account_code}-${idx}`}
                            className={`border-b transition-colors ${
                              idx % 2 === 0 ? "hover:bg-muted/30" : "bg-muted/10 hover:bg-muted/30"
                            }`}
                          >
                            <td className="px-3 py-2 font-mono font-semibold whitespace-nowrap">{row.account_code}</td>
                            <td className="px-3 py-2 max-w-[220px] truncate" title={row.account_name}>
                              {row.account_name || "—"}
                            </td>
                            <td className="px-3 py-2 text-left font-mono text-blue-700 tabular-nums whitespace-nowrap">
                              {row.debit > 0 ? fmtNum(row.debit) : "—"}
                            </td>
                            <td className="px-3 py-2 text-left font-mono text-rose-700 tabular-nums whitespace-nowrap">
                              {row.credit > 0 ? fmtNum(row.credit) : "—"}
                            </td>
                            <td className={`px-3 py-2 text-left font-mono tabular-nums whitespace-nowrap ${
                              row.nature === "بدهکار" ? "text-blue-700" :
                              row.nature === "بستانکار" ? "text-rose-700" : "text-emerald-700"
                            }`}>
                              {fmtNum(Math.abs(row.balance))}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                row.nature === "بدهکار"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : row.nature === "بستانکار"
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
                              }`}>
                                {row.nature}
                              </span>
                            </td>
                            <td className="px-3 py-2 font-mono text-xs text-muted-foreground whitespace-nowrap">
                              {row.doc_number || "—"}
                            </td>
                            <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                              {row.doc_date || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 bg-muted/30 font-bold">
                          <td className="px-3 py-2.5" colSpan={2}>
                            <span className="text-xs font-bold">جمع کل</span>
                          </td>
                          <td className="px-3 py-2.5 text-left font-mono text-blue-700 tabular-nums whitespace-nowrap">
                            {fmtNum(totals.debit)}
                          </td>
                          <td className="px-3 py-2.5 text-left font-mono text-rose-700 tabular-nums whitespace-nowrap">
                            {fmtNum(totals.credit)}
                          </td>
                          <td className="px-3 py-2.5 text-left font-mono tabular-nums whitespace-nowrap">
                            {fmtNum(Math.abs(totals.balance))}
                          </td>
                          <td colSpan={3} />
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
