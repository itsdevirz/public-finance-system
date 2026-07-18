import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  BarChart2, ArrowLeftRight, Wallet, PieChart,
  Search, Printer, FileDown, ChevronLeft, Loader2, RotateCcw, AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/api";
import { printTable } from "@/lib/printUtils";

const SIDEBAR_ITEMS = [
  { id: "performance",  label: "عملکرد بودجه",                      icon: BarChart2 },
  { id: "comparison",   label: "مقایسه بودجه مصوب با عملکرد",       icon: ArrowLeftRight },
  { id: "remaining",    label: "مانده اعتبارات",                     icon: Wallet },
  { id: "allocation",   label: "گزارش تخصیص و مصرف اعتبارات",       icon: PieChart },
];

const ROUTE_MAP = {
  "performance": "/reports/budget/performance",
  "comparison":  "/reports/budget/comparison",
  "remaining":   "/reports/budget/remaining",
  "allocation":  "/reports/budget/allocation",
};

function getDefaultId(pathname) {
  const seg = pathname.split("/").pop();
  return Object.keys(ROUTE_MAP).find((k) => ROUTE_MAP[k].endsWith(seg)) ?? "performance";
}

function toPersianDigits(str) {
  if (str == null) return "";
  const id = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(str).replace(/[0-9]/g, function (w) {
    return id[+w];
  });
}

function fmtNum(n) {
  if (n === 0 || n == null) return "—";
  return toPersianDigits(Number(n).toLocaleString("fa-IR"));
}

export default function BudgetReport() {
  const navigate = useNavigate();
  const location = useLocation();
  const [active, setActive] = useState(() => getDefaultId(location.pathname));
  const current = SIDEBAR_ITEMS.find((i) => i.id === active);

  // ── فیلترهای گزارش عملکرد بودجه ──
  const [fiscalYear, setFiscalYear] = useState("");
  const [orgUnit, setOrgUnit] = useState("");
  const [program, setProgram] = useState("");
  const [project, setProject] = useState("");

  // ── داده‌های گزارش و لیست فیلترهای پویا ──
  const [fiscalYears, setFiscalYears] = useState([]);
  const [orgUnits, setOrgUnits] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [projects, setProjects] = useState([]);

  const [rows, setRows] = useState(null);
  const [totals, setTotals] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // بارگذاری سال‌های مالی در زمان مونت شدن
  useEffect(() => {
    api.get("/api/fiscal-years")
      .then((r) => {
        const list = (r.data?.data ?? []).map((y) => ({
          value: String(y.year),
          label: `${y.year} — ${y.title}`,
        }));
        setFiscalYears(list);
        if (list.length > 0) setFiscalYear(list[0].value);
      })
      .catch(() => {});
  }, []);

  // بارگذاری فیلترهای پویا با تغییر سال مالی
  useEffect(() => {
    if (!fiscalYear) return;
    api.get(`/api/credits/filters?fiscalYear=${fiscalYear}`)
      .then((res) => {
        if (res.data?.success) {
          setOrgUnits([
            { value: "", label: "— همه واحدها —" },
            ...(res.data.orgUnits ?? [])
          ]);
          setPrograms([
            { value: "", label: "— همه برنامه‌ها —" },
            ...(res.data.programs ?? [])
          ]);
          setProjects([
            { value: "", label: "— همه طرح‌ها/پروژه‌ها —" },
            ...(res.data.projects ?? [])
          ]);
        }
      })
      .catch(() => {});
  }, [fiscalYear]);

  useEffect(() => {
    setActive(getDefaultId(location.pathname));
  }, [location.pathname]);

  function handleSelect(id) {
    setActive(id);
    navigate(ROUTE_MAP[id]);
  }

  // اجرای جستجوی گزارش عملکرد بودجه
  const handleQuery = async (e) => {
    e?.preventDefault();
    if (!fiscalYear) {
      setError("انتخاب سال مالی الزامی است");
      return;
    }
    setError("");
    setLoading(true);
    setRows(null);
    try {
      const params = new URLSearchParams({ fiscalYear });
      if (orgUnit) params.append("orgUnit", orgUnit);
      if (program) params.append("program", program);
      if (project) params.append("project", project);

      const res = await api.get(`/api/credits/performance?${params.toString()}`);
      if (res.data?.success) {
        setRows(res.data.data ?? []);
        setTotals(res.data.totals ?? {});
      } else {
        setError(res.data?.message ?? "خطا در دریافت گزارش");
      }
    } catch (err) {
      setError(err?.response?.data?.message ?? "خطا در برقراری ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  // ریست کردن فیلترها
  const handleReset = () => {
    setOrgUnit("");
    setProgram("");
    setProject("");
    setRows(null);
    setTotals({});
    setError("");
    if (fiscalYears.length > 0) setFiscalYear(fiscalYears[0].value);
  };

  // چاپ گزارش
  const handlePrint = () => {
    printTable("#budget-performance-table", `گزارش ${current?.label} سال مالی ${fiscalYear}`);
  };

  // خروجی اکسل
  const handleExportExcel = () => {
    if (!rows || rows.length === 0) return;

    let headers = [];
    let dataRows = [];

    switch (active) {
      case "comparison":
        headers = ["کد بودجه", "عنوان برنامه / طرح", "بودجه مصوب", "عملکرد / هزینه", "درصد جذب"];
        dataRows = rows.map(r => {
          const percent = r.approved > 0 ? ((r.expense / r.approved) * 100) : 0;
          return [r.code, r.title, r.approved, r.expense, `${percent.toFixed(1)}%`];
        });
        break;
      case "remaining":
        headers = ["کد بودجه", "عنوان برنامه / طرح", "بودجه مصوب", "عملکرد / هزینه", "مانده اعتبار"];
        dataRows = rows.map(r => [r.code, r.title, r.approved, r.expense, r.approved - r.expense]);
        break;
      case "allocation":
        headers = ["کد بودجه", "عنوان برنامه / طرح", "بودجه مصوب", "تخصیص", "مصرف / هزینه", "مانده تخصیص"];
        dataRows = rows.map(r => [r.code, r.title, r.approved, r.allocation, r.expense, r.allocation - r.expense]);
        break;
      case "performance":
      default:
        headers = ["کد بودجه", "عنوان برنامه / طرح", "بودجه مصوب", "تخصیص", "هزینه / مصرف", "مانده اعتبار"];
        dataRows = rows.map(r => [r.code, r.title, r.approved, r.allocation, r.expense, r.balance]);
        break;
    }

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
      + [
        headers.join(","),
        ...dataRows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
      ].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `گزارش_${current?.label}_${fiscalYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderHeaders = () => {
    switch (active) {
      case "comparison":
        return (
          <tr className="bg-[#0e305d] text-white border-b border-border">
            <th className="px-3 py-2.5 w-32 whitespace-nowrap font-bold">کد بودجه</th>
            <th className="px-3 py-2.5 min-w-[200px] font-bold">عنوان برنامه / طرح</th>
            <th className="px-3 py-2.5 text-center w-32 whitespace-nowrap font-bold">بودجه مصوب</th>
            <th className="px-3 py-2.5 text-center w-32 whitespace-nowrap font-bold">عملکرد / هزینه</th>
            <th className="px-3 py-2.5 text-center w-32 whitespace-nowrap font-bold">درصد تحقق (جذب)</th>
          </tr>
        );
      case "remaining":
        return (
          <tr className="bg-[#0e305d] text-white border-b border-border">
            <th className="px-3 py-2.5 w-32 whitespace-nowrap font-bold">کد بودجه</th>
            <th className="px-3 py-2.5 min-w-[200px] font-bold">عنوان برنامه / طرح</th>
            <th className="px-3 py-2.5 text-center w-32 whitespace-nowrap font-bold">بودجه مصوب</th>
            <th className="px-3 py-2.5 text-center w-32 whitespace-nowrap font-bold">عملکرد / هزینه</th>
            <th className="px-3 py-2.5 text-center w-32 whitespace-nowrap font-bold">مانده اعتبار</th>
          </tr>
        );
      case "allocation":
        return (
          <tr className="bg-[#0e305d] text-white border-b border-border">
            <th className="px-3 py-2.5 w-32 whitespace-nowrap font-bold">کد بودجه</th>
            <th className="px-3 py-2.5 min-w-[200px] font-bold">عنوان برنامه / طرح</th>
            <th className="px-3 py-2.5 text-center w-32 whitespace-nowrap font-bold">بودجه مصوب</th>
            <th className="px-3 py-2.5 text-center w-32 whitespace-nowrap font-bold">تخصیص</th>
            <th className="px-3 py-2.5 text-center w-32 whitespace-nowrap font-bold">مصرف / هزینه</th>
            <th className="px-3 py-2.5 text-center w-32 whitespace-nowrap font-bold">مانده تخصیص</th>
          </tr>
        );
      case "performance":
      default:
        return (
          <tr className="bg-[#0e305d] text-white border-b border-border">
            <th className="px-3 py-2.5 w-32 whitespace-nowrap font-bold">کد بودجه</th>
            <th className="px-3 py-2.5 min-w-[200px] font-bold">عنوان برنامه / طرح</th>
            <th className="px-3 py-2.5 text-center w-32 whitespace-nowrap font-bold">بودجه مصوب</th>
            <th className="px-3 py-2.5 text-center w-32 whitespace-nowrap font-bold">تخصیص</th>
            <th className="px-3 py-2.5 text-center w-32 whitespace-nowrap font-bold">هزینه / مصرف</th>
            <th className="px-3 py-2.5 text-center w-32 whitespace-nowrap font-bold">مانده اعتبار</th>
          </tr>
        );
    }
  };

  const renderRows = () => {
    if (rows.length === 0) {
      return (
        <tr>
          <td colSpan={active === "comparison" || active === "remaining" ? 5 : 6} className="py-16 text-center text-muted-foreground">
            <div className="flex flex-col items-center gap-2">
              <BarChart2 className="h-8 w-8 opacity-30" />
              <p className="text-sm">اطلاعاتی یافت نشد</p>
              <p className="text-xs opacity-60">در سال مالی انتخابی هیچ موافقت‌نامه بودجه‌ای ثبت نشده است</p>
            </div>
          </td>
        </tr>
      );
    }

    return rows.map((row, i) => {
      const isOdd = i % 2 === 1;
      const rowClass = cn("border-b hover:bg-primary/5 transition-colors", isOdd && "bg-muted/10");

      switch (active) {
        case "comparison": {
          const percent = row.approved > 0 ? ((row.expense / row.approved) * 100) : 0;
          return (
            <tr key={row._id} className={rowClass}>
              <td className="px-3 py-2 font-mono font-medium text-muted-foreground whitespace-nowrap">{toPersianDigits(row.code)}</td>
              <td className="px-3 py-2 font-medium">{row.title}</td>
              <td className="px-3 py-2 text-center font-mono tabular-nums text-blue-700">{fmtNum(row.approved)}</td>
              <td className="px-3 py-2 text-center font-mono tabular-nums text-rose-700">{fmtNum(row.expense)}</td>
              <td className="px-3 py-2 text-center font-mono tabular-nums font-bold text-amber-700">{toPersianDigits(percent.toFixed(1))}٪</td>
            </tr>
          );
        }
        case "remaining": {
          const rem = row.approved - row.expense;
          return (
            <tr key={row._id} className={rowClass}>
              <td className="px-3 py-2 font-mono font-medium text-muted-foreground whitespace-nowrap">{toPersianDigits(row.code)}</td>
              <td className="px-3 py-2 font-medium">{row.title}</td>
              <td className="px-3 py-2 text-center font-mono tabular-nums text-blue-700">{fmtNum(row.approved)}</td>
              <td className="px-3 py-2 text-center font-mono tabular-nums text-rose-700">{fmtNum(row.expense)}</td>
              <td className="px-3 py-2 text-center font-mono tabular-nums font-bold text-emerald-700">{fmtNum(rem)}</td>
            </tr>
          );
        }
        case "allocation": {
          const remAlloc = row.allocation - row.expense;
          return (
            <tr key={row._id} className={rowClass}>
              <td className="px-3 py-2 font-mono font-medium text-muted-foreground whitespace-nowrap">{toPersianDigits(row.code)}</td>
              <td className="px-3 py-2 font-medium">{row.title}</td>
              <td className="px-3 py-2 text-center font-mono tabular-nums text-blue-700">{fmtNum(row.approved)}</td>
              <td className="px-3 py-2 text-center font-mono tabular-nums text-indigo-700">{fmtNum(row.allocation)}</td>
              <td className="px-3 py-2 text-center font-mono tabular-nums text-rose-700">{fmtNum(row.expense)}</td>
              <td className="px-3 py-2 text-center font-mono tabular-nums font-bold text-emerald-700">{fmtNum(remAlloc)}</td>
            </tr>
          );
        }
        case "performance":
        default:
          return (
            <tr key={row._id} className={rowClass}>
              <td className="px-3 py-2 font-mono font-medium text-muted-foreground whitespace-nowrap">{toPersianDigits(row.code)}</td>
              <td className="px-3 py-2 font-medium">{row.title}</td>
              <td className="px-3 py-2 text-center font-mono tabular-nums text-blue-700">{fmtNum(row.approved)}</td>
              <td className="px-3 py-2 text-center font-mono tabular-nums text-indigo-700">{fmtNum(row.allocation)}</td>
              <td className="px-3 py-2 text-center font-mono tabular-nums text-rose-700">{fmtNum(row.expense)}</td>
              <td className="px-3 py-2 text-center font-mono tabular-nums font-bold text-emerald-700">{fmtNum(row.balance)}</td>
            </tr>
          );
      }
    });
  };

  const renderTotals = () => {
    if (rows.length === 0) return null;

    switch (active) {
      case "comparison": {
        const totalPercent = totals.approved > 0 ? ((totals.expense / totals.approved) * 100) : 0;
        return (
          <tfoot>
            <tr className="border-t-2 bg-muted/40 font-bold">
              <td className="px-3 py-2.5" colSpan={2}>
                <span className="text-xs font-bold">جمع کل</span>
              </td>
              <td className="px-3 py-2.5 text-center font-mono text-blue-700">{fmtNum(totals.approved)}</td>
              <td className="px-3 py-2.5 text-center font-mono text-rose-700">{fmtNum(totals.expense)}</td>
              <td className="px-3 py-2.5 text-center font-mono text-amber-700">{toPersianDigits(totalPercent.toFixed(1))}٪</td>
            </tr>
          </tfoot>
        );
      }
      case "remaining": {
        const totalRem = totals.approved - totals.expense;
        return (
          <tfoot>
            <tr className="border-t-2 bg-muted/40 font-bold">
              <td className="px-3 py-2.5" colSpan={2}>
                <span className="text-xs font-bold">جمع کل</span>
              </td>
              <td className="px-3 py-2.5 text-center font-mono text-blue-700">{fmtNum(totals.approved)}</td>
              <td className="px-3 py-2.5 text-center font-mono text-rose-700">{fmtNum(totals.expense)}</td>
              <td className="px-3 py-2.5 text-center font-mono text-emerald-700">{fmtNum(totalRem)}</td>
            </tr>
          </tfoot>
        );
      }
      case "allocation": {
        const totalRemAlloc = totals.allocation - totals.expense;
        return (
          <tfoot>
            <tr className="border-t-2 bg-muted/40 font-bold">
              <td className="px-3 py-2.5" colSpan={2}>
                <span className="text-xs font-bold">جمع کل</span>
              </td>
              <td className="px-3 py-2.5 text-center font-mono text-blue-700">{fmtNum(totals.approved)}</td>
              <td className="px-3 py-2.5 text-center font-mono text-indigo-700">{fmtNum(totals.allocation)}</td>
              <td className="px-3 py-2.5 text-center font-mono text-rose-700">{fmtNum(totals.expense)}</td>
              <td className="px-3 py-2.5 text-center font-mono text-emerald-700">{fmtNum(totalRemAlloc)}</td>
            </tr>
          </tfoot>
        );
      }
      case "performance":
      default:
        return (
          <tfoot>
            <tr className="border-t-2 bg-muted/40 font-bold">
              <td className="px-3 py-2.5" colSpan={2}>
                <span className="text-xs font-bold">جمع کل</span>
              </td>
              <td className="px-3 py-2.5 text-center font-mono text-blue-700">{fmtNum(totals.approved)}</td>
              <td className="px-3 py-2.5 text-center font-mono text-indigo-700">{fmtNum(totals.allocation)}</td>
              <td className="px-3 py-2.5 text-center font-mono text-rose-700">{fmtNum(totals.expense)}</td>
              <td className="px-3 py-2.5 text-center font-mono text-emerald-700">{fmtNum(totals.balance)}</td>
            </tr>
          </tfoot>
        );
    }
  };

  return (
    <PageShell>
      <PageHeader
        title="گزارش‌های بودجه"
        description="عملکرد بودجه، مقایسه مصوب با عملکرد، مانده و تخصیص اعتبارات"
      >
        {rows && rows.length > 0 && !loading && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 ml-1" /> چاپ
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportExcel}>
              <FileDown className="h-4 w-4 ml-1" /> اکسل
            </Button>
          </div>
        )}
      </PageHeader>

      <div className="flex gap-4">
        {/* سایدبار */}
        <aside className="w-56 shrink-0">
          <Card>
            <CardContent className="p-2">
              <p className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wide">نوع گزارش</p>
              <nav className="space-y-0.5">
                {SIDEBAR_ITEMS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => handleSelect(id)}
                    className={cn(
                      "w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                      active === id
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 text-right">{label}</span>
                    {active === id && <ChevronLeft className="h-3 w-3 shrink-0" />}
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>
        </aside>

        <main className="flex-1 min-w-0">
          <Card>
            <CardContent className="pt-5">
              <div dir="rtl" className="space-y-5">
                {/* فرم فیلتر */}
                <form onSubmit={handleQuery} className="mb-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 rounded-xl border bg-muted/20 p-4 items-end">
                  <div className="flex flex-col gap-1.5 text-right">
                    <Label className="text-xs font-semibold">سال مالی *</Label>
                    <SearchableSelect
                      value={fiscalYear}
                      onChange={setFiscalYear}
                      options={fiscalYears}
                      placeholder="انتخاب سال مالی..."
                      searchable={false}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 text-right">
                    <Label className="text-xs font-semibold">واحد سازمانی</Label>
                    <SearchableSelect
                      value={orgUnit}
                      onChange={setOrgUnit}
                      options={orgUnits}
                      placeholder="انتخاب واحد..."
                      searchable={true}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 text-right">
                    <Label className="text-xs font-semibold">برنامه</Label>
                    <SearchableSelect
                      value={program}
                      onChange={setProgram}
                      options={programs}
                      placeholder="انتخاب برنامه..."
                      searchable={true}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 text-right">
                    <Label className="text-xs font-semibold">پروژه (طرح)</Label>
                    <SearchableSelect
                      value={project}
                      onChange={setProject}
                      options={projects}
                      placeholder="انتخاب طرح..."
                      searchable={true}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" className="flex-1 h-8 text-xs gap-1.5 bg-[#004b93] hover:bg-[#003d79] text-white" disabled={loading}>
                      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                      نمایش
                    </Button>
                    <Button type="button" variant="outline" size="sm" className="h-8 px-2" onClick={handleReset} disabled={loading} title="پاک کردن فیلترها">
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </form>

                {/* خطا */}
                {error && (
                  <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* لودینگ */}
                {loading && (
                  <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-sm">در حال دریافت اطلاعات...</p>
                  </div>
                )}

                {/* خالی بودن قبل از اجرا */}
                {!loading && rows === null && !error && (
                  <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                      {current && <current.icon className="h-8 w-8" />}
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-foreground">گزارش {current?.label}</p>
                      <p className="text-xs mt-1">سال مالی و فیلترها را تنظیم کرده و روی دکمه نمایش کلیک کنید</p>
                    </div>
                  </div>
                )}

                {/* جدول نتایج */}
                {!loading && rows !== null && (
                  <div className="border rounded-xl overflow-hidden bg-background">
                    <div className="overflow-x-auto" id="budget-performance-table">
                      <table className="w-full text-xs text-right">
                        <thead>
                          {renderHeaders()}
                        </thead>
                        <tbody>
                          {renderRows()}
                        </tbody>
                        {renderTotals()}
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </PageShell>
  );
}
