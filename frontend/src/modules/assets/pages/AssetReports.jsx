import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { PersianDatePicker } from "@/components/ui/persian-date-picker";
import {
  Search, Printer, Download, RefreshCw, Loader2, AlertCircle, ChevronLeft,
  ClipboardList, Building2, UserCheck, QrCode, Tag, Coins, HelpCircle,
  Trash2, Wrench, ArrowLeftRight, FileText
} from "lucide-react";
import { useAssets } from "@/context/AssetContext";
import { printTable } from "@/lib/printUtils";
import { cn } from "@/lib/utils";

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function fmtNum(n) {
  if (n === 0 || n == null) return "—";
  return Number(n).toLocaleString("fa-IR");
}

function today() {
  return new Date().toLocaleDateString("fa-IR");
}

function getStatusLabel(status) {
  if (status === "active" || status === "فعال") return "فعال (سالم)";
  if (status === "scrap" || status === "اسقاط") return "اسقاط شده";
  if (status === "lost" || status === "مفقود") return "مفقود شده";
  if (status === "repair" || status === "در تعمیر") return "در حال تعمیر";
  if (status === "unlabeled" || status === "بدون برچسب") return "بدون برچسب";
  return status || "—";
}

function getLostReasonLabel(reason) {
  if (reason === "theft") return "سرقت";
  if (reason === "missing") return "مفقود — محل نامعلوم";
  if (reason === "disaster") return "حوادث طبیعی (سیل، آتش‌سوزی)";
  if (reason === "other") return "سایر دلایل";
  return reason || "—";
}

function getFollowStatusLabel(status) {
  if (status === "reported") return "گزارش داده شده";
  if (status === "police") return "شکایت به مراجع قضایی";
  if (status === "recovered") return "بازیابی شده";
  if (status === "closed") return "پرونده مختومه";
  return status || "در دست بررسی";
}

function getScrapReasonLabel(reason) {
  if (reason === "worn") return "فرسودگی و استهلاک کامل";
  if (reason === "damaged") return "آسیب جبران‌ناپذیر";
  if (reason === "obsolete") return "منسوخ شدن فناوری";
  if (reason === "accident") return "حادثه یا سانحه";
  if (reason === "other") return "سایر دلایل";
  return reason || "—";
}

// ─── REPORTS CONFIGURATION (MONTHLY/ANNUAL DEPRECIATION REMOVED) ──────────────
const SIDEBAR_ITEMS = [
  { id: "all",                      label: "لیست کلیه اموال",          icon: ClipboardList,     desc: "مشاهده مشخصات کامل تمامی اموال ثبت شده در سیستم" },
  { id: "by-unit",                  label: "اموال هر واحد",            icon: Building2,         desc: "لیست دارایی‌ها و اموال اختصاص‌یافته به تفکیک واحدهای اداری" },
  { id: "by-employee",              label: "اموال هر کارمند",          icon: UserCheck,         desc: "گزارش اقلام تحویلی و مسئولیت اموالی پرسنل سازمان" },
  { id: "labeled",                  label: "اموال برچسب‌دار",          icon: QrCode,            desc: "فهرست دارایی‌های پلاک‌کوبی‌شده و برچسب‌دار" },
  { id: "unlabeled",                label: "اموال بدون برچسب",        icon: Tag,               desc: "شناسایی اقلام فاقد برچسب اموال جهت پلاک‌گذاری" },
  { id: "depreciation-cumulative",  label: "استهلاک انباشته",         icon: Coins,             desc: "خلاصه ارزش تاریخی، استهلاک انباشته و ارزش دفتری اموال" },
  { id: "book-value",               label: "ارزش دفتری اموال",         icon: FileText,          desc: "گزارش ارزش دفتری باقیمانده دارایی‌های سازمان" },
  { id: "lost",                     label: "اموال مفقود",              icon: HelpCircle,        desc: "اموال مفقودی و سرقتی به همراه وضعیت پیگیری حقوقی" },
  { id: "scrapped",                 label: "اموال اسقاطی",             icon: Trash2,            desc: "دارایی‌های فرسوده از رده خارج شده و مجوزهای مربوطه" },
  { id: "in-repair",                label: "اموال در تعمیر",            icon: Wrench,            desc: "اموال ارسالی به نمایندگی‌ها جهت تعمیر و بازسازی" },
  { id: "transferred",              label: "اموال منتقل شده",          icon: ArrowLeftRight,    desc: "تاریخچه جابجایی دارایی‌ها بین واحدها و مراکز هزینه" }
];

const ROUTE_MAP = {
  "all":                      "/assets/reports/all",
  "by-unit":                  "/assets/reports/by-unit",
  "by-employee":              "/assets/reports/by-employee",
  "labeled":                  "/assets/reports/labeled",
  "unlabeled":                "/assets/reports/unlabeled",
  "depreciation-cumulative":  "/assets/reports/depreciation-cumulative",
  "book-value":               "/assets/reports/book-value",
  "lost":                     "/assets/reports/lost",
  "scrapped":                 "/assets/reports/scrapped",
  "in-repair":                "/assets/reports/in-repair",
  "transferred":              "/assets/reports/transferred",
};

function getDefaultId(pathname) {
  const seg = pathname.split("/").pop();
  return Object.keys(ROUTE_MAP).find((k) => ROUTE_MAP[k].endsWith(seg)) ?? "all";
}

export default function AssetReports() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Real Assets backend database connection
  const { assets, loading: assetsLoading } = useAssets();

  const [active, setActive] = useState(() => getDefaultId(location.pathname));
  const current = SIDEBAR_ITEMS.find((i) => i.id === active) ?? SIDEBAR_ITEMS[0];

  // ─── SEARCH & FILTER STATES ─────────────────────────────────────────────────
  const [menuSearch, setMenuSearch] = useState("");
  const [unit, setUnit] = useState("all");
  const [employee, setEmployee] = useState("all");
  const [group, setGroup] = useState("all");
  const [status, setStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState(null);
  const [queryMeta, setQueryMeta] = useState(null);

  // Sync state if URL changes directly
  useEffect(() => {
    const nextActive = getDefaultId(location.pathname);
    if (nextActive !== active) {
      setActive(nextActive);
      setRows(null);
      setQueryMeta(null);
    }
  }, [location.pathname]);

  // Clear results on report change
  useEffect(() => {
    setRows(null);
    setQueryMeta(null);
  }, [active]);

  const handleSelectReport = (id) => {
    setActive(id);
    navigate(ROUTE_MAP[id]);
  };

  // Filtered menu items based on search query
  const filteredSidebarItems = useMemo(() => {
    return SIDEBAR_ITEMS.filter((item) =>
      item.label.includes(menuSearch) || item.desc.includes(menuSearch)
    );
  }, [menuSearch]);

  // ─── DYNAMIC OPTIONS POPULATED FROM DATABASE DATA ────────────────────────────
  const uniqueUnits = useMemo(() => {
    const set = new Set();
    assets.forEach(a => {
      if (a.department) set.add(a.department);
      if (a.organization) set.add(a.organization);
    });
    return [
      { value: "all", label: "همه واحدها" },
      ...Array.from(set).map(u => ({ value: u, label: u }))
    ];
  }, [assets]);

  const uniqueEmployees = useMemo(() => {
    const set = new Set();
    assets.forEach(a => {
      if (a.personnelName) set.add(a.personnelName);
    });
    return [
      { value: "all", label: "همه کارکنان" },
      ...Array.from(set).map(e => ({ value: e, label: e }))
    ];
  }, [assets]);

  const uniqueGroups = useMemo(() => {
    const set = new Set();
    assets.forEach(a => {
      if (a.assetGroup) set.add(a.assetGroup);
    });
    return [
      { value: "all", label: "همه گروه‌ها" },
      ...Array.from(set).map(g => ({ value: g, label: g }))
    ];
  }, [assets]);

  const uniqueStatuses = useMemo(() => {
    const set = new Set();
    assets.forEach(a => {
      if (a.status) set.add(a.status);
    });
    return [
      { value: "all", label: "همه وضعیت‌ها" },
      ...Array.from(set).map(s => ({ value: s, label: getStatusLabel(s) }))
    ];
  }, [assets]);

  // Run/Show Report logic
  const handleShowReport = useCallback((e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setRows(null);

    // Simulate small delay to feel like processing
    setTimeout(() => {
      let filtered = [...assets];

      // Apply base filters
      if (group !== "all") {
        filtered = filtered.filter((a) => a.assetGroup === group);
      }
      if (unit !== "all" && active !== "transferred") {
        filtered = filtered.filter((a) => a.department === unit || a.organization === unit);
      }
      if (employee !== "all") {
        filtered = filtered.filter((a) => a.personnelName === employee);
      }

      // Filter based on active report type
      if (active === "all") {
        if (status !== "all") {
          filtered = filtered.filter((a) => a.status === status);
        }
      } else if (active === "by-unit") {
        filtered = filtered.filter((a) => a.status !== "scrap" && (a.department || a.organization));
      } else if (active === "by-employee") {
        filtered = filtered.filter((a) => a.personnelName && a.status !== "scrap");
      } else if (active === "labeled") {
        filtered = filtered.filter((a) => a.labelNumber);
      } else if (active === "unlabeled") {
        filtered = filtered.filter((a) => !a.labelNumber);
      } else if (active === "lost") {
        filtered = filtered.filter((a) => a.status === "lost" || a.status === "مفقود");
      } else if (active === "scrapped") {
        filtered = filtered.filter((a) => a.status === "scrap" || a.status === "اسقاط");
      } else if (active === "in-repair") {
        filtered = filtered.filter((a) => a.status === "repair" || a.status === "در تعمیر");
      } else if (active === "transferred") {
        filtered = filtered.filter((a) => a.transferTo);
      }

      // Date range filtering
      if (dateFrom) {
        filtered = filtered.filter((a) => a.purchaseDate >= dateFrom);
      }
      if (dateTo) {
        filtered = filtered.filter((a) => a.purchaseDate <= dateTo);
      }

      // Formulate query metadata to show above table
      setQueryMeta({
        reportName: current.label,
        unit: uniqueUnits.find(o => o.value === unit)?.label,
        employee: uniqueEmployees.find(o => o.value === employee)?.label,
        group: uniqueGroups.find(o => o.value === group)?.label,
        status: uniqueStatuses.find(o => o.value === status)?.label,
        dateFrom,
        dateTo
      });

      setRows(filtered);
      setLoading(false);
    }, 350);
  }, [active, unit, employee, group, status, dateFrom, dateTo, current, assets, uniqueUnits, uniqueEmployees, uniqueGroups, uniqueStatuses]);

  const handleResetFilters = () => {
    setUnit("all");
    setEmployee("all");
    setGroup("all");
    setStatus("all");
    setDateFrom("");
    setDateTo("");
    setRows(null);
    setQueryMeta(null);
  };

  // Helper to parse values
  const getDepreciationData = (item) => {
    const purchase = Number(item.purchaseAmount || 0);
    const accum = Number(item.accumulatedDepreciation || 0);
    const book = Number(item.bookValue || (purchase - accum));
    const rate = Number(item.depreciationRate || 0);
    const percent = purchase > 0 ? Math.round((accum / purchase) * 100) : 0;
    return {
      purchase,
      accum,
      book,
      rate,
      percent
    };
  };

  // Summaries
  const summaries = useMemo(() => {
    if (!rows) return null;
    const totalCount = rows.length;
    const totalValue = rows.reduce((sum, item) => sum + Number(item.purchaseAmount || 0), 0);
    const totalRepair = rows.reduce((sum, item) => sum + Number(item.repairCost || 0), 0);
    const totalScrap = rows.reduce((sum, item) => sum + Number(item.scrapValue || 0), 0);

    return { totalCount, totalValue, totalRepair, totalScrap };
  }, [rows]);

  // Export CSV
  const handleExportCSV = () => {
    if (!rows || !queryMeta) return;

    let headers = [];
    let dataMapper = (r, idx) => [];

    if (active === "all") {
      headers = ["ردیف", "کد اموال", "نام مال", "گروه اموال", "واحد سازمانی", "تحویل‌گیرنده", "تاریخ خرید", "ارزش خرید", "وضعیت"];
      dataMapper = (r, idx) => [idx + 1, r.assetCode, r.assetName, r.assetGroup, r.department || r.organization || "—", r.personnelName || "—", r.purchaseDate || "—", r.purchaseAmount || 0, getStatusLabel(r.status)];
    } else if (active === "by-unit") {
      headers = ["ردیف", "کد اموال", "نام مال", "واحد سازمانی", "تحویل‌گیرنده", "حساب معین", "مرکز هزینه", "طرح/پروژه", "ارزش خرید", "وضعیت نگهداشت"];
      dataMapper = (r, idx) => [idx + 1, r.assetCode, r.assetName, r.department || r.organization || "—", r.personnelName || "—", r.subAccount || "—", r.costCenter || "—", r.project || "—", r.purchaseAmount || 0, getStatusLabel(r.status)];
    } else if (active === "by-employee") {
      headers = ["ردیف", "کد اموال", "نام مال", "گروه اموال", "تحویل‌گیرنده", "تاریخ خرید", "وضعیت"];
      dataMapper = (r, idx) => [idx + 1, r.assetCode, r.assetName, r.assetGroup, r.personnelName || "—", r.purchaseDate || "—", getStatusLabel(r.status)];
    } else if (active === "labeled") {
      headers = ["ردیف", "کد اموال", "نام مال", "گروه اموال", "شماره برچسب", "تاریخ برچسب‌زنی", "وضعیت"];
      dataMapper = (r, idx) => [idx + 1, r.assetCode, r.assetName, r.assetGroup, r.labelNumber || "—", r.labelDate || "—", getStatusLabel(r.status)];
    } else if (active === "unlabeled") {
      headers = ["ردیف", "کد اموال", "نام مال", "گروه اموال", "واحد سازمانی", "علت عدم برچسب", "وضعیت"];
      dataMapper = (r, idx) => [idx + 1, r.assetCode, r.assetName, r.assetGroup, r.department || r.organization || "—", "برچسب اموال صادر نشده", getStatusLabel(r.status)];
    } else if (active === "depreciation-cumulative") {
      headers = ["ردیف", "کد اموال", "نام مال", "ارزش خرید", "استهلاک انباشته", "ارزش دفتری فعلی", "روش استهلاک"];
      dataMapper = (r, idx) => {
        const dep = getDepreciationData(r);
        return [idx + 1, r.assetCode, r.assetName, dep.purchase, dep.accum, dep.book, r.depreciationMethod === "straight" ? "خط مستقیم" : "نزولی"];
      };
    } else if (active === "book-value") {
      headers = ["ردیف", "کد اموال", "نام مال", "گروه اموال", "ارزش خرید", "استهلاک انباشته", "ارزش دفتری", "درصد مستهلک شده"];
      dataMapper = (r, idx) => {
        const dep = getDepreciationData(r);
        return [idx + 1, r.assetCode, r.assetName, r.assetGroup, dep.purchase, dep.accum, dep.book, `${dep.percent}%`];
      };
    } else if (active === "lost") {
      headers = ["ردیف", "کد اموال", "نام مال", "آخرین تحویل‌گیرنده", "تاریخ اعلام مفقودی", "علت مفقودی", "وضعیت پرونده"];
      dataMapper = (r, idx) => [idx + 1, r.assetCode, r.assetName, r.personnelName || "—", r.lostDate || "—", getLostReasonLabel(r.lostReason), getFollowStatusLabel(r.followStatus)];
    } else if (active === "scrapped") {
      headers = ["ردیف", "کد اموال", "نام مال", "تاریخ اسقاط", "ارزش اسقاطی", "علت اسقاط", "شماره مجوز"];
      dataMapper = (r, idx) => [idx + 1, r.assetCode, r.assetName, r.scrappedDate || "—", r.scrapValue || 0, getScrapReasonLabel(r.scrapReason), r.scrapLicense || "—"];
    } else if (active === "in-repair") {
      headers = ["ردیف", "کد اموال", "نام مال", "تعمیرگاه", "تاریخ ارسال", "هزینه تعمیر", "وضعیت"];
      dataMapper = (r, idx) => [idx + 1, r.assetCode, r.assetName, r.repairShop || "—", r.repairDate || "—", r.repairCost || 0, getStatusLabel(r.status)];
    } else if (active === "transferred") {
      headers = ["ردیف", "کد اموال", "نام مال", "واحد مبدا", "واحد مقصد", "تاریخ انتقال", "شماره مجوز"];
      dataMapper = (r, idx) => [idx + 1, r.assetCode, r.assetName, r.transferFrom || "—", r.transferTo || "—", r.transferDate || "—", r.transferLicense || "—"];
    }

    const csvContent = "\uFEFF" + [
      headers.join(","),
      ...rows.map((r, idx) => dataMapper(r, idx).map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${queryMeta.reportName}_${today().replace(/\//g, "-")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    if (!rows || !queryMeta) return;
    printTable("#asset-reports-table", queryMeta.reportName);
  };

  // Render parent loading if assets are still being loaded from backend context
  if (assetsLoading) {
    return (
      <PageShell>
        <PageHeader
          title="گزارش‌های سیستم اموال"
          description="گزارش جامع کلیه اموال، استهلاک، دارایی‌ها، اموال مفقودی و اسقاطی"
        />
        <div className="py-32 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-semibold">در حال بارگذاری اطلاعات اموال از دیتابیس...</p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="گزارش‌های سیستم اموال"
        description="گزارش جامع کلیه اموال، استهلاک، دارایی‌ها، اموال مفقودی و اسقاطی"
      >
        {rows !== null && !loading && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint} className="h-8">
              <Printer className="h-4 w-4 ml-1.5 text-muted-foreground" /> چاپ گزارش
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="h-8">
              <Download className="h-4 w-4 ml-1.5 text-muted-foreground" /> خروجی Excel
            </Button>
          </div>
        )}
      </PageHeader>

      <div className="flex flex-col lg:flex-row gap-4" dir="rtl">
        {/* SIDEBAR: REPORT MENU SELECTOR */}
        <aside className="w-full lg:w-72 shrink-0 space-y-3">
          <Card className="shadow-sm border bg-card/60 backdrop-blur-md">
            <CardContent className="p-3">
              <p className="px-2 pb-2 text-xs font-bold text-muted-foreground uppercase">انتخاب نوع گزارش</p>
              
              {/* Search titles */}
              <div className="relative mb-3">
                <Search className="absolute right-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="جستجوی عنوان گزارش..."
                  className="pr-9 h-8.5 text-xs"
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                />
              </div>

              {/* Menu list */}
              <div className="space-y-1 max-h-[460px] overflow-y-auto pr-1">
                {filteredSidebarItems.length > 0 ? (
                  filteredSidebarItems.map((item) => {
                    const Icon = item.icon;
                    const isSelected = active === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectReport(item.id)}
                        className={cn(
                          "w-full flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-right transition-all duration-200 group text-xs",
                          isSelected
                            ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon className={cn("h-4 w-4 shrink-0 mt-0.5", isSelected ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary")} />
                        <div className="flex-1 space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-[12px]">{item.label}</span>
                            {isSelected && <ChevronLeft className="h-3 w-3 shrink-0" />}
                          </div>
                          <p className={cn("text-[10px] leading-relaxed", isSelected ? "text-primary-foreground/80" : "text-muted-foreground/70")}>
                            {item.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-muted-foreground text-xs">
                    گزارشی با این عنوان یافت نشد.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* MAIN AREA: FILTERS & RESULT TABLE */}
        <main className="flex-1 space-y-4">
          <Card className="shadow-sm border bg-card/60 backdrop-blur-md">
            <CardContent className="pt-5">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-muted">
                {current && <current.icon className="h-5 w-5 text-primary" />}
                <div>
                  <h3 className="font-bold text-foreground text-sm">{current?.label}</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{current?.desc}</p>
                </div>
              </div>

              {/* DYNAMIC FILTERS FORM */}
              <form onSubmit={handleShowReport} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 items-end rounded-xl border bg-muted/10 p-4">
                  
                  {/* Filter: Organizational Unit (relevant for most reports, except by-employee where it's optional) */}
                  {active !== "by-employee" && (
                    <div className="space-y-1.5 text-right">
                      <Label className="text-xs font-semibold text-muted-foreground">واحد سازمانی</Label>
                      <SearchableSelect
                        value={unit}
                        onChange={setUnit}
                        options={uniqueUnits}
                        placeholder="انتخاب واحد..."
                      />
                    </div>
                  )}

                  {/* Filter: Employee (relevant for all, but specifically for by-employee) */}
                  {active === "by-employee" && (
                    <div className="space-y-1.5 text-right">
                      <Label className="text-xs font-semibold text-muted-foreground">کارمند تحویل‌گیرنده</Label>
                      <SearchableSelect
                        value={employee}
                        onChange={setEmployee}
                        options={uniqueEmployees}
                        placeholder="انتخاب کارمند..."
                      />
                    </div>
                  )}

                  {/* Filter: Asset Group (relevant for almost all reports) */}
                  <div className="space-y-1.5 text-right">
                    <Label className="text-xs font-semibold text-muted-foreground">گروه اموال</Label>
                    <SearchableSelect
                      value={group}
                      onChange={setGroup}
                      options={uniqueGroups}
                      placeholder="انتخاب گروه..."
                    />
                  </div>

                  {/* Filter: Status (Only for All Assets report) */}
                  {active === "all" && (
                    <div className="space-y-1.5 text-right">
                      <Label className="text-xs font-semibold text-muted-foreground">وضعیت مال</Label>
                      <SearchableSelect
                        value={status}
                        onChange={setStatus}
                        options={uniqueStatuses}
                        placeholder="انتخاب وضعیت..."
                      />
                    </div>
                  )}

                  {/* Filter: Date Range (Generic purchase date range filter) */}
                  <div className="space-y-1.5 text-right">
                    <Label className="text-xs font-semibold text-muted-foreground">از تاریخ خرید</Label>
                    <PersianDatePicker
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      placeholder="۱۴۰۰/۰۱/۰۱"
                    />
                  </div>
                  <div className="space-y-1.5 text-right">
                    <Label className="text-xs font-semibold text-muted-foreground">تا تاریخ خرید</Label>
                    <PersianDatePicker
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      placeholder="۱۴۰۳/۱۲/۲۹"
                    />
                  </div>

                  {/* Actions buttons */}
                  <div className="flex gap-2 items-end justify-end sm:col-span-2 md:col-span-1 lg:col-span-1">
                    <Button type="submit" className="flex-1 gap-1.5 h-8.5 text-xs font-semibold" disabled={loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      نمایش گزارش
                    </Button>
                    <Button type="button" variant="outline" size="icon" className="h-8.5 w-8.5 shrink-0" onClick={handleResetFilters} disabled={loading} title="پاک کردن فیلترها">
                      <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              </form>

              {/* LOADING INDICATOR */}
              {loading && (
                <div className="py-24 flex flex-col items-center gap-3 text-muted-foreground animate-pulse">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-xs font-semibold">در حال استخراج و محاسبه اطلاعات گزارش...</p>
                </div>
              )}

              {/* BEFORE SEARCH PROMPT */}
              {!loading && rows === null && (
                <div className="py-24 flex flex-col items-center gap-4 text-muted-foreground/60 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60 text-primary/60">
                    {current && <current.icon className="h-8 w-8" />}
                  </div>
                  <div>
                    <p className="font-bold text-foreground">تنظیم فیلترهای گزارش</p>
                    <p className="text-xs mt-1 max-w-sm">پارامترهای مورد نظر خود را در فرم فیلتر تنظیم کرده و روی دکمه نمایش گزارش کلیک کنید</p>
                  </div>
                </div>
              )}

              {/* RESULT SECTION */}
              {!loading && rows !== null && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  
                  {/* Summary Badges Panel */}
                  {summaries && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-muted/10 p-3 rounded-xl border">
                      <div className="bg-card p-2.5 rounded-lg border text-right space-y-1">
                        <span className="text-[10px] text-muted-foreground font-semibold">تعداد کل اقلام</span>
                        <p className="text-base font-bold text-foreground">{fmtNum(summaries.totalCount)} <span className="text-[10px] font-normal text-muted-foreground">قلم</span></p>
                      </div>
                      <div className="bg-card p-2.5 rounded-lg border text-right space-y-1">
                        <span className="text-[10px] text-muted-foreground font-semibold">ارزش خرید اولیه</span>
                        <p className="text-base font-bold text-primary">{fmtNum(summaries.totalValue)} <span className="text-[10px] font-normal text-muted-foreground">ریال</span></p>
                      </div>
                      
                      {active === "in-repair" ? (
                        <div className="bg-card p-2.5 rounded-lg border text-right space-y-1">
                          <span className="text-[10px] text-muted-foreground font-semibold">کل هزینه تعمیرات</span>
                          <p className="text-base font-bold text-amber-600">{fmtNum(summaries.totalRepair)} <span className="text-[10px] font-normal text-muted-foreground">ریال</span></p>
                        </div>
                      ) : active === "scrapped" ? (
                        <div className="bg-card p-2.5 rounded-lg border text-right space-y-1">
                          <span className="text-[10px] text-muted-foreground font-semibold">کل ارزش اسقاطی حاصله</span>
                          <p className="text-base font-bold text-rose-600">{fmtNum(summaries.totalScrap)} <span className="text-[10px] font-normal text-muted-foreground">ریال</span></p>
                        </div>
                      ) : (
                        <div className="bg-card p-2.5 rounded-lg border text-right space-y-1 col-span-2">
                          <span className="text-[10px] text-muted-foreground font-semibold font-mono">آخرین بروزرسانی گزارش</span>
                          <p className="text-xs font-semibold text-muted-foreground mt-1">تولید شده در تاریخ {today()} ساعت {new Date().toLocaleTimeString("fa-IR", {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* REPORT DATA TABLE */}
                  <div className="border rounded-xl overflow-hidden shadow-sm" id="asset-reports-table">
                    {/* Table Title for Printing */}
                    <div className="hidden print:block text-center py-4 border-b">
                      <h2 className="text-lg font-bold">گزارش {queryMeta?.reportName}</h2>
                      <p className="text-xs text-muted-foreground mt-1">تاریخ تهیه گزارش: {today()} | فیلترها: {queryMeta?.group || "همه گروه‌ها"}</p>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-right border-collapse" dir="rtl">
                        <thead>
                          <tr className="border-b bg-muted/40 font-bold text-muted-foreground text-center">
                            
                            {/* DYNAMIC HEADERS BASED ON REPORT TYPE */}
                            {active === "all" && (
                              <>
                                <th className="px-3 py-2.5 w-12 text-center border-l">ردیف</th>
                                <th className="px-3 py-2.5 w-24 border-l">کد اموال</th>
                                <th className="px-3 py-2.5 min-w-[150px] border-l">نام مال</th>
                                <th className="px-3 py-2.5 border-l">گروه اموال</th>
                                <th className="px-3 py-2.5 border-l">واحد سازمانی</th>
                                <th className="px-3 py-2.5 border-l">تحویل‌گیرنده</th>
                                <th className="px-3 py-2.5 w-24 text-center border-l">تاریخ خرید</th>
                                <th className="px-3 py-2.5 w-32 text-left border-l">ارزش خرید (ریال)</th>
                                <th className="px-3 py-2.5 w-24 text-center">وضعیت</th>
                              </>
                            )}

                            {active === "by-unit" && (
                              <>
                                <th className="px-3 py-2.5 w-12 text-center border-l">ردیف</th>
                                <th className="px-3 py-2.5 w-24 border-l">کد اموال</th>
                                <th className="px-3 py-2.5 min-w-[150px] border-l">نام مال</th>
                                <th className="px-3 py-2.5 border-l">واحد سازمانی</th>
                                <th className="px-3 py-2.5 border-l">تحویل‌گیرنده</th>
                                <th className="px-3 py-2.5 border-l">حساب معین</th>
                                <th className="px-3 py-2.5 border-l">مرکز هزینه</th>
                                <th className="px-3 py-2.5 border-l">طرح/پروژه</th>
                                <th className="px-3 py-2.5 w-28 text-left border-l">ارزش خرید (ریال)</th>
                                <th className="px-3 py-2.5 w-24 text-center">وضعیت نگهداشت</th>
                              </>
                            )}

                            {active === "by-employee" && (
                              <>
                                <th className="px-3 py-2.5 w-12 text-center border-l">ردیف</th>
                                <th className="px-3 py-2.5 w-24 border-l">کد اموال</th>
                                <th className="px-3 py-2.5 min-w-[180px] border-l">نام مال</th>
                                <th className="px-3 py-2.5 border-l">گروه اموال</th>
                                <th className="px-3 py-2.5 border-l">تحویل‌گیرنده</th>
                                <th className="px-3 py-2.5 w-24 text-center border-l">تاریخ خرید</th>
                                <th className="px-3 py-2.5 w-24 text-center">وضعیت اموال</th>
                              </>
                            )}

                            {active === "labeled" && (
                              <>
                                <th className="px-3 py-2.5 w-12 text-center border-l">ردیف</th>
                                <th className="px-3 py-2.5 w-24 border-l">کد اموال</th>
                                <th className="px-3 py-2.5 min-w-[180px] border-l">نام مال</th>
                                <th className="px-3 py-2.5 border-l">گروه اموال</th>
                                <th className="px-3 py-2.5 w-32 text-center border-l">شماره پلاک/برچسب</th>
                                <th className="px-3 py-2.5 w-28 text-center border-l">تاریخ برچسب‌زنی</th>
                                <th className="px-3 py-2.5 w-24 text-center">وضعیت</th>
                              </>
                            )}

                            {active === "unlabeled" && (
                              <>
                                <th className="px-3 py-2.5 w-12 text-center border-l">ردیف</th>
                                <th className="px-3 py-2.5 w-24 border-l">کد اموال</th>
                                <th className="px-3 py-2.5 min-w-[180px] border-l">نام مال</th>
                                <th className="px-3 py-2.5 border-l">گروه اموال</th>
                                <th className="px-3 py-2.5 border-l">واحد سازمانی</th>
                                <th className="px-3 py-2.5 border-l">علت عدم برچسب‌گذاری</th>
                                <th className="px-3 py-2.5 w-24 text-center">وضعیت</th>
                              </>
                            )}

                            {active === "depreciation-cumulative" && (
                              <>
                                <th className="px-3 py-2.5 w-12 text-center border-l">ردیف</th>
                                <th className="px-3 py-2.5 w-24 border-l">کد اموال</th>
                                <th className="px-3 py-2.5 min-w-[160px] border-l">نام مال</th>
                                <th className="px-3 py-2.5 w-32 text-left border-l">ارزش اولیه خرید (ریال)</th>
                                <th className="px-3 py-2.5 w-32 text-left border-l">استهلاک انباشته (ریال)</th>
                                <th className="px-3 py-2.5 w-32 text-left border-l">ارزش دفتری فعلی (ریال)</th>
                                <th className="px-3 py-2.5 w-28 text-center">روش محاسباتی</th>
                              </>
                            )}

                            {active === "book-value" && (
                              <>
                                <th className="px-3 py-2.5 w-12 text-center border-l">ردیف</th>
                                <th className="px-3 py-2.5 w-24 border-l">کد اموال</th>
                                <th className="px-3 py-2.5 min-w-[160px] border-l">نام مال</th>
                                <th className="px-3 py-2.5 border-l">گروه اموال</th>
                                <th className="px-3 py-2.5 w-32 text-left border-l">ارزش خرید اولیه (ریال)</th>
                                <th className="px-3 py-2.5 w-32 text-left border-l">استهلاک انباشته</th>
                                <th className="px-3 py-2.5 w-32 text-left border-l">ارزش دفتری فعلی</th>
                                <th className="px-3 py-2.5 w-24 text-center">میزان مستهلک شده</th>
                              </>
                            )}

                            {active === "lost" && (
                              <>
                                <th className="px-3 py-2.5 w-12 text-center border-l">ردیف</th>
                                <th className="px-3 py-2.5 w-24 border-l">کد اموال</th>
                                <th className="px-3 py-2.5 min-w-[160px] border-l">نام مال</th>
                                <th className="px-3 py-2.5 border-l">آخرین تحویل‌گیرنده</th>
                                <th className="px-3 py-2.5 w-28 text-center border-l">تاریخ مفقودی</th>
                                <th className="px-3 py-2.5 border-l">علت مفقودی</th>
                                <th className="px-3 py-2.5 w-36 text-center">وضعیت پرونده حقوقی</th>
                              </>
                            )}

                            {active === "scrapped" && (
                              <>
                                <th className="px-3 py-2.5 w-12 text-center border-l">ردیف</th>
                                <th className="px-3 py-2.5 w-24 border-l">کد اموال</th>
                                <th className="px-3 py-2.5 min-w-[160px] border-l">نام مال</th>
                                <th className="px-3 py-2.5 w-28 text-center border-l">تاریخ اسقاط</th>
                                <th className="px-3 py-2.5 w-32 text-left border-l">ارزش اسقاطی (ریال)</th>
                                <th className="px-3 py-2.5 border-l">علت اسقاط</th>
                                <th className="px-3 py-2.5 w-32 text-center">شماره مجوز اسقاط</th>
                              </>
                            )}

                            {active === "in-repair" && (
                              <>
                                <th className="px-3 py-2.5 w-12 text-center border-l">ردیف</th>
                                <th className="px-3 py-2.5 w-24 border-l">کد اموال</th>
                                <th className="px-3 py-2.5 min-w-[160px] border-l">نام مال</th>
                                <th className="px-3 py-2.5 border-l">تعمیرگاه طرف قرارداد</th>
                                <th className="px-3 py-2.5 w-28 text-center border-l">تاریخ ارسال</th>
                                <th className="px-3 py-2.5 w-32 text-left border-l font-bold text-amber-700">هزینه تعمیر (ریال)</th>
                                <th className="px-3 py-2.5 w-28 text-center">وضعیت تعمیر</th>
                              </>
                            )}

                            {active === "transferred" && (
                              <>
                                <th className="px-3 py-2.5 w-12 text-center border-l">ردیف</th>
                                <th className="px-3 py-2.5 w-24 border-l">کد اموال</th>
                                <th className="px-3 py-2.5 min-w-[160px] border-l">نام مال</th>
                                <th className="px-3 py-2.5 border-l">واحد سازمانی مبدا</th>
                                <th className="px-3 py-2.5 border-l">واحد مقصد</th>
                                <th className="px-3 py-2.5 w-28 text-center border-l">تاریخ جابجایی</th>
                                <th className="px-3 py-2.5 w-36 text-center">شماره مجوز انتقال</th>
                              </>
                            )}

                          </tr>
                        </thead>
                        <tbody>
                          {rows.length === 0 ? (
                            <tr>
                              <td colSpan={10} className="py-16 text-center text-muted-foreground font-medium">
                                <div className="flex flex-col items-center gap-2">
                                  <AlertCircle className="h-8 w-8 text-amber-500 opacity-60" />
                                  <p>داده‌ای متناسب با فیلترهای اعمال شده در این گزارش یافت نشد.</p>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            rows.map((row, idx) => {
                              const isCumDepReport = active === "depreciation-cumulative";
                              const isBookValReport = active === "book-value";
                              const depData = (isCumDepReport || isBookValReport) ? getDepreciationData(row) : null;

                              return (
                                <tr key={row._id || row.id || idx} className={cn("border-b hover:bg-muted/30 transition-colors", idx % 2 === 1 && "bg-muted/10")}>
                                  
                                  {/* RENDER COLUMNS DYNAMICALLY */}
                                  {active === "all" && (
                                    <>
                                      <td className="px-3 py-2 text-center text-muted-foreground border-l">{idx + 1}</td>
                                      <td className="px-3 py-2 font-mono font-semibold border-l text-center">{row.assetCode}</td>
                                      <td className="px-3 py-2 font-semibold text-foreground border-l">{row.assetName}</td>
                                      <td className="px-3 py-2 border-l">{row.assetGroup}</td>
                                      <td className="px-3 py-2 border-l">{row.department || row.organization || "—"}</td>
                                      <td className="px-3 py-2 border-l">{row.personnelName || "—"}</td>
                                      <td className="px-3 py-2 text-center font-mono border-l">{row.purchaseDate || "—"}</td>
                                      <td className="px-3 py-2 text-left font-mono tabular-nums border-l">{fmtNum(row.purchaseAmount)}</td>
                                      <td className="px-3 py-2 text-center">
                                        <Badge variant={row.status === "active" ? "success" : row.status === "repair" ? "warning" : "secondary"}>
                                          {getStatusLabel(row.status)}
                                        </Badge>
                                      </td>
                                    </>
                                  )}

                                  {active === "by-unit" && (
                                    <>
                                      <td className="px-3 py-2 text-center text-muted-foreground border-l">{idx + 1}</td>
                                      <td className="px-3 py-2 font-mono font-semibold border-l text-center">{row.assetCode}</td>
                                      <td className="px-3 py-2 font-semibold text-foreground border-l">{row.assetName}</td>
                                      <td className="px-3 py-2 border-l">{row.department || row.organization || "—"}</td>
                                      <td className="px-3 py-2 border-l">{row.personnelName || "—"}</td>
                                      <td className="px-3 py-2 border-l font-mono text-center">{row.subAccount || "—"}</td>
                                      <td className="px-3 py-2 border-l text-center">{row.costCenter || "—"}</td>
                                      <td className="px-3 py-2 border-l text-center">{row.project || "—"}</td>
                                      <td className="px-3 py-2 text-left font-mono tabular-nums border-l">{fmtNum(row.purchaseAmount)}</td>
                                      <td className="px-3 py-2 text-center">
                                        <Badge variant={row.status === "active" ? "success" : "warning"}>
                                          {row.status === "active" ? "سالم" : "نیازمند سرویس"}
                                        </Badge>
                                      </td>
                                    </>
                                  )}

                                  {active === "by-employee" && (
                                    <>
                                      <td className="px-3 py-2 text-center text-muted-foreground border-l">{idx + 1}</td>
                                      <td className="px-3 py-2 font-mono font-semibold border-l text-center">{row.assetCode}</td>
                                      <td className="px-3 py-2 font-semibold text-foreground border-l">{row.assetName}</td>
                                      <td className="px-3 py-2 border-l">{row.assetGroup}</td>
                                      <td className="px-3 py-2 font-semibold border-l">{row.personnelName}</td>
                                      <td className="px-3 py-2 text-center font-mono border-l">{row.purchaseDate || "—"}</td>
                                      <td className="px-3 py-2 text-center">
                                        <Badge variant="outline">{getStatusLabel(row.status)}</Badge>
                                      </td>
                                    </>
                                  )}

                                  {active === "labeled" && (
                                    <>
                                      <td className="px-3 py-2 text-center text-muted-foreground border-l">{idx + 1}</td>
                                      <td className="px-3 py-2 font-mono font-semibold border-l text-center">{row.assetCode}</td>
                                      <td className="px-3 py-2 font-semibold text-foreground border-l">{row.assetName}</td>
                                      <td className="px-3 py-2 border-l">{row.assetGroup}</td>
                                      <td className="px-3 py-2 text-center font-mono font-bold text-primary border-l">{row.labelNumber}</td>
                                      <td className="px-3 py-2 text-center font-mono border-l">{row.labelDate || "—"}</td>
                                      <td className="px-3 py-2 text-center"><Badge variant="success">پلاک کوبی شده</Badge></td>
                                    </>
                                  )}

                                  {active === "unlabeled" && (
                                    <>
                                      <td className="px-3 py-2 text-center text-muted-foreground border-l">{idx + 1}</td>
                                      <td className="px-3 py-2 font-mono font-semibold border-l text-center">{row.assetCode}</td>
                                      <td className="px-3 py-2 font-semibold text-foreground border-l">{row.assetName}</td>
                                      <td className="px-3 py-2 border-l">{row.assetGroup}</td>
                                      <td className="px-3 py-2 border-l">{row.department || row.organization || "—"}</td>
                                      <td className="px-3 py-2 text-rose-600 border-l">اقدام نشده (نیاز به صدور پلاک اموال)</td>
                                      <td className="px-3 py-2 text-center"><Badge variant="destructive">فاقد برچسب</Badge></td>
                                    </>
                                  )}

                                  {active === "depreciation-cumulative" && (
                                    <>
                                      <td className="px-3 py-2 text-center text-muted-foreground border-l">{idx + 1}</td>
                                      <td className="px-3 py-2 font-mono font-semibold border-l text-center">{row.assetCode}</td>
                                      <td className="px-3 py-2 font-semibold text-foreground border-l">{row.assetName}</td>
                                      <td className="px-3 py-2 text-left font-mono tabular-nums border-l">{fmtNum(depData.purchase)}</td>
                                      <td className="px-3 py-2 text-left font-mono tabular-nums text-rose-600 font-semibold border-l">{fmtNum(depData.accum)}</td>
                                      <td className="px-3 py-2 text-left font-mono tabular-nums font-bold text-primary border-l">{fmtNum(depData.book)}</td>
                                      <td className="px-3 py-2 text-center text-muted-foreground">
                                        {row.depreciationMethod === "straight" ? "خط مستقیم" : "نزولی ثابت"}
                                      </td>
                                    </>
                                  )}

                                  {active === "book-value" && (
                                    <>
                                      <td className="px-3 py-2 text-center text-muted-foreground border-l">{idx + 1}</td>
                                      <td className="px-3 py-2 font-mono font-semibold border-l text-center">{row.assetCode}</td>
                                      <td className="px-3 py-2 font-semibold text-foreground border-l">{row.assetName}</td>
                                      <td className="px-3 py-2 text-muted-foreground border-l">{row.assetGroup}</td>
                                      <td className="px-3 py-2 text-left font-mono tabular-nums border-l">{fmtNum(depData.purchase)}</td>
                                      <td className="px-3 py-2 text-left font-mono tabular-nums text-rose-600 border-l">{fmtNum(depData.accum)}</td>
                                      <td className="px-3 py-2 text-left font-mono tabular-nums font-bold text-primary border-l">{fmtNum(depData.book)}</td>
                                      <td className="px-3 py-2 text-center font-mono font-bold text-amber-700">
                                        {depData.percent}%
                                      </td>
                                    </>
                                  )}

                                  {active === "lost" && (
                                    <>
                                      <td className="px-3 py-2 text-center text-muted-foreground border-l">{idx + 1}</td>
                                      <td className="px-3 py-2 font-mono font-semibold border-l text-center">{row.assetCode}</td>
                                      <td className="px-3 py-2 font-semibold text-foreground border-l">{row.assetName}</td>
                                      <td className="px-3 py-2 font-semibold border-l">{row.personnelName || "—"}</td>
                                      <td className="px-3 py-2 text-center font-mono text-rose-600 border-l">{row.lostDate || "—"}</td>
                                      <td className="px-3 py-2 text-muted-foreground border-l">{getLostReasonLabel(row.lostReason)}</td>
                                      <td className="px-3 py-2 text-center">
                                        <Badge variant="warning">{getFollowStatusLabel(row.followStatus)}</Badge>
                                      </td>
                                    </>
                                  )}

                                  {active === "scrapped" && (
                                    <>
                                      <td className="px-3 py-2 text-center text-muted-foreground border-l">{idx + 1}</td>
                                      <td className="px-3 py-2 font-mono font-semibold border-l text-center">{row.assetCode}</td>
                                      <td className="px-3 py-2 font-semibold text-foreground border-l">{row.assetName}</td>
                                      <td className="px-3 py-2 text-center font-mono text-rose-600 border-l">{row.scrappedDate || "—"}</td>
                                      <td className="px-3 py-2 text-left font-mono tabular-nums text-green-700 font-bold border-l">{fmtNum(row.scrapValue)}</td>
                                      <td className="px-3 py-2 text-muted-foreground border-l">{getScrapReasonLabel(row.scrapReason)}</td>
                                      <td className="px-3 py-2 text-center font-mono text-muted-foreground font-semibold">{row.scrapLicense || "—"}</td>
                                    </>
                                  )}

                                  {active === "in-repair" && (
                                    <>
                                      <td className="px-3 py-2 text-center text-muted-foreground border-l">{idx + 1}</td>
                                      <td className="px-3 py-2 font-mono font-semibold border-l text-center">{row.assetCode}</td>
                                      <td className="px-3 py-2 font-semibold text-foreground border-l">{row.assetName}</td>
                                      <td className="px-3 py-2 border-l">{row.repairShop || "—"}</td>
                                      <td className="px-3 py-2 text-center font-mono border-l">{row.repairDate || "—"}</td>
                                      <td className="px-3 py-2 text-left font-mono tabular-nums text-amber-700 font-bold border-l">{fmtNum(row.repairCost)}</td>
                                      <td className="px-3 py-2 text-center">
                                        <Badge variant="warning">در تعمیرگاه</Badge>
                                      </td>
                                    </>
                                  )}

                                  {active === "transferred" && (
                                    <>
                                      <td className="px-3 py-2 text-center text-muted-foreground border-l">{idx + 1}</td>
                                      <td className="px-3 py-2 font-mono font-semibold border-l text-center">{row.assetCode}</td>
                                      <td className="px-3 py-2 font-semibold text-foreground border-l">{row.assetName}</td>
                                      <td className="px-3 py-2 text-muted-foreground border-l">{row.transferFrom || "—"}</td>
                                      <td className="px-3 py-2 font-semibold text-primary border-l">{row.transferTo || "—"}</td>
                                      <td className="px-3 py-2 text-center font-mono border-l">{row.transferDate || "—"}</td>
                                      <td className="px-3 py-2 text-center font-mono text-muted-foreground">{row.transferLicense || "—"}</td>
                                    </>
                                  )}

                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </PageShell>
  );
}
