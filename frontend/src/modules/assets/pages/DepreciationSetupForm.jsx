import { useState, useEffect, useMemo } from "react";
import {
  Save, Plus, Trash2, Printer, Search, X, Copy, Eye,
  Play, CheckCircle2, Info, Paperclip, Calendar,
  Sliders, ShieldCheck, Database, ListFilter, DollarSign,
  ChevronLeft, FileText, Activity
} from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import api from "@/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { PersianDatePicker } from "@/components/ui/persian-date-picker";
import { cn } from "@/lib/utils";

// ─── CONSTANTS & DATA PRESETS ──────────────────────────────────────────────────
const DEPRECIATION_METHODS = [
  "خط مستقیم",
  "نزولی",
  "نزولی مضاعف",
  "مجموع سنوات",
  "بر اساس کارکرد",
  "بر اساس تولید",
  "سفارشی"
];

const CALC_PERIODS = ["ماهانه", "فصلی", "سالانه"];
const CALC_BASES = ["ارزش خرید", "ارزش دفتری", "ارزش جایگزینی"];
const ROUNDING_OPTIONS = ["بدون گرد کردن", "گرد به ریال", "گرد به هزار", "گرد به میلیون"];

const ASSET_GROUPS = [
  "تجهیزات اداری",
  "وسایل نقلیه",
  "ساختمان و ابنیه",
  "رایانه و ملزومات فناوری",
  "ماشین‌آلات و تجهیزات کارگاهی",
  "ابزارآلات"
];

const ASSET_SUBGROUPS = {
  "تجهیزات اداری": ["میز و صندلی اداری", "کولر و تهویه مطبوع", "فایل اداری"],
  "وسایل نقلیه": ["سواری", "کامیون", "وانت"],
  "ساختمان و ابنیه": ["ملکی اداری", "ملکی مسکونی", "محوطه‌سازی"],
  "رایانه و ملزومات فناوری": ["سرور", "لپ‌تاپ", "تجهیزات شبکه"],
  "ماشین‌آلات و تجهیزات کارگاهی": ["جرثقیل", "ژنراتور برق", "کمپرسور"],
  "ابزارآلات": ["ابزارهای تراشکاری", "ابزارهای اندازه‌گیری"]
};

const COST_CENTERS = [
  "۱۰۱ - واحد مالی و حسابداری",
  "۱۰۲ - واحد پشتیبانی و تدارکات",
  "۱۰۳ - واحد مدیریت و اجرایی",
  "۱۰۴ - کارگاه شماره ۱"
];

const PROJECTS = [
  "طرح احداث ساختمان مرکزی",
  "پروژه بهسازی شبکه داخلی",
  "طرح تجهیز سالن همایش"
];

const LOCATIONS = [
  "ساختمان مرکزی - طبقه اول",
  "ساختمان مرکزی - طبقه دوم",
  "انبار شماره ۱ - پشتیبانی"
];

const ORGANIZATIONS = [
  "معاونت اداری و مالی",
  "مدیریت سرمایه انسانی",
  "اداره پشتیبانی"
];

const OWNERSHIP_TYPES = ["ملکی", "استیجاری", "امانی"];
const COMPANIES = ["شرکت مادر / سازمان اصلی", "شرکت تابعه شماره ۱", "شرکت تابعه شماره ۲"];

const MOEIN_ACCOUNTS = [
  { code: "611010", name: "هزینه استهلاک تجهیزات اداری" },
  { code: "611020", name: "هزینه استهلاک وسایل نقلیه" },
  { code: "611030", name: "هزینه استهلاک ساختمان‌ها" },
  { code: "611040", name: "هزینه استهلاک تجهیزات رایانه‌ای" },
  { code: "151010", name: "استهلاک انباشته تجهیزات اداری" },
  { code: "151020", name: "استهلاک انباشته وسایل نقلیه" },
  { code: "151030", name: "استهلاک انباشته ساختمان‌ها" },
  { code: "151040", name: "استهلاک انباشته تجهیزات رایانه‌ای" }
];

const INITIAL_FORM = {
  setup_code: "",
  title: "",
  status: "فعال",
  fiscal_year: 1403,
  start_date: "1403/01/01",
  end_date: "",

  scope: {
    asset_group: "",
    asset_subgroup: "",
    cost_center: "",
    project: "",
    location: "",
    org_unit: "",
    ownership_type: "ملکی",
    company: "شرکت مادر / سازمان اصلی",
  },

  calc_method: {
    method: "خط مستقیم",
    period: "سالانه",
    basis: "ارزش خرید",
    salvage_value: 0,
    useful_life: 5,
    useful_life_unit: "سال",
    rounding: "بدون گرد کردن",
  },

  accounting: {
    expense_account_code: "",
    expense_account_name: "",
    accumulated_depr_account_code: "",
    accumulated_depr_account_name: "",
    default_cost_center: "",
    default_project: "",
    voucher_desc_template: "ثبت استهلاک دوره {دوره}",
    voucher_numbering: "خودکار",
  },

  calc_settings: {
    calc_from_utilization: true,
    calc_from_purchase: false,
    first_month_depr: "کامل",
    calc_last_month: true,
    stop_after_useful_life: true,
    skip_scrapped_assets: true,
    skip_sold_assets: true,
    auto_calc_on_close_month: false,
    auto_issue_voucher: false,
  },

  notes: "",
  creator: "مدیر مالی",
  attachments: [],
  audit_logs: [],
  is_finalized: false
};

// ─── FIELD COMPONENT ────────────────────────────────────────────────────────────
function Field({ label, required, children, col }) {
  return (
    <div className={cn("flex flex-col gap-1.5", col === 2 && "col-span-1 md:col-span-2", col === 3 && "col-span-1 md:col-span-3")}>
      <Label className="text-xs font-semibold text-right text-foreground">
        {label}
        {required && <span className="text-red-500 mr-1">*</span>}
      </Label>
      {children}
    </div>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────────
export default function DepreciationSetupForm() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [list, setList] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [activeTab, setActiveTab] = useState("basic"); // basic | scope | method | accounting | settings | additional
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  
  // شبیه‌ساز فایل پیوست
  const [newAttachment, setNewAttachment] = useState({ name: "", type: "آیین‌نامه" });
  
  // شبیه‌ساز تست محاسبه
  const [testInputs, setTestInputs] = useState({
    purchase_value: 500_000_000,
    utilization_date: "1403/01/15",
  });
  const [testResult, setTestResult] = useState([]);

  // بارگذاری داده‌های اولیه
  useEffect(() => {
    fetchList();
    suggestCode();
  }, []);

  const fetchList = async () => {
    try {
      const res = await api.get("/api/depreciation-setups");
      if (res.data?.success) {
        setList(res.data.data);
      }
    } catch (e) {
      console.error("خطا در دریافت لیست تنظیمات استهلاک:", e);
    }
  };

  const suggestCode = async () => {
    try {
      const res = await api.get("/api/depreciation-setups/suggest-code");
      if (res.data?.success) {
        setForm((prev) => ({ ...prev, setup_code: res.data.setup_code }));
      }
    } catch (e) {
      console.error("خطا در پیشنهاد کد تنظیم:", e);
    }
  };

  // کنترل تغییرات فیلدها در بخش‌های مختلف
  const updateBase = (field, val) => {
    setForm(prev => ({ ...prev, [field]: val }));
  };

  const updateScope = (field, val) => {
    setForm(prev => ({ ...prev, scope: { ...prev.scope, [field]: val } }));
  };

  const updateMethod = (field, val) => {
    setForm(prev => ({ ...prev, calc_method: { ...prev.calc_method, [field]: val } }));
  };

  const updateAccounting = (field, val) => {
    setForm(prev => ({ ...prev, accounting: { ...prev.accounting, [field]: val } }));
  };

  const updateSettings = (field, val) => {
    setForm(prev => ({ ...prev, calc_settings: { ...prev.calc_settings, [field]: val } }));
  };

  // مدیریت حساب‌های معین هزینه و انباشته
  const handleSelectMoein = (type, code) => {
    const matched = MOEIN_ACCOUNTS.find(m => m.code === code);
    if (matched) {
      if (type === "expense") {
        updateAccounting("expense_account_code", matched.code);
        updateAccounting("expense_account_name", matched.name);
      } else {
        updateAccounting("accumulated_depr_account_code", matched.code);
        updateAccounting("accumulated_depr_account_name", matched.name);
      }
    }
  };

  // مدیریت فایل‌های پیوست
  const handleAddAttachment = () => {
    if (!newAttachment.name.trim()) return;
    const att = {
      row_num: form.attachments.length + 1,
      name: newAttachment.name.trim(),
      size: `${(Math.random() * 2 + 0.5).toFixed(1)} MB`,
      date: new Date().toLocaleDateString("fa-IR"),
      type: newAttachment.type
    };
    setForm(prev => ({
      ...prev,
      attachments: [...prev.attachments, att]
    }));
    setNewAttachment({ name: "", type: "آیین‌نامه" });
  };

  const handleDeleteAttachment = (idx) => {
    setForm(prev => {
      const filtered = prev.attachments.filter((_, i) => i !== idx);
      return {
        ...prev,
        attachments: filtered.map((item, i) => ({ ...item, row_num: i + 1 }))
      };
    });
  };

  // دکمه‌های عملیاتی فرم
  const handleNew = () => {
    setForm(INITIAL_FORM);
    setSelectedId(null);
    suggestCode();
    setActiveTab("basic");
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      alert("لطفا عنوان تنظیم را وارد کنید.");
      return;
    }
    
    try {
      const payload = {
        ...form,
        audit_logs: [
          ...form.audit_logs,
          {
            row_num: form.audit_logs.length + 1,
            user: "مدیر مالی",
            date: new Date().toLocaleString("fa-IR"),
            action: selectedId ? "ویرایش تنظیم استهلاک" : "ایجاد تنظیم استهلاک جدید",
            comment: `تنظیم استهلاک برای گروه: ${form.scope.asset_group || "همه گروه‌ها"}`
          }
        ]
      };

      let res;
      if (selectedId) {
        res = await api.put(`/api/depreciation-setups/${selectedId}`, payload);
      } else {
        res = await api.post("/api/depreciation-setups", payload);
      }

      if (res.data?.success) {
        alert("تنظیم استهلاک با موفقیت ذخیره شد.");
        fetchList();
        loadSetupDetails(res.data.data);
      }
    } catch (e) {
      alert(e.response?.data?.message || "خطا در ثبت اطلاعات.");
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    if (!confirm("آیا از حذف این قانون تنظیم استهلاک اطمینان دارید؟")) return;

    try {
      const res = await api.delete(`/api/depreciation-setups/${selectedId}`);
      if (res.data?.success) {
        alert("تنظیم با موفقیت حذف شد.");
        handleNew();
        fetchList();
      }
    } catch (e) {
      alert(e.response?.data?.message || "خطا در حذف تنظیم.");
    }
  };

  const handleCopy = () => {
    if (!selectedId) return;
    setSelectedId(null);
    setForm(prev => ({
      ...prev,
      _id: undefined,
      is_finalized: false,
      title: `${prev.title} (کپی)`
    }));
    suggestCode();
    alert("اطلاعات جهت کپی آماده است. کد تنظیم جدید ایجاد شد. پس از بازبینی ذخیره نمایید.");
  };

  const handleFinalize = async () => {
    if (!selectedId) return;
    if (!confirm("با نهایی‌سازی، این قانون استهلاک قفل می‌شود و فیلدها غیرقابل ویرایش خواهند شد. آیا ادامه می‌دهید؟")) return;

    try {
      const updated = {
        ...form,
        is_finalized: true,
        audit_logs: [
          ...form.audit_logs,
          {
            row_num: form.audit_logs.length + 1,
            user: "مدیر مالی",
            date: new Date().toLocaleString("fa-IR"),
            action: "ثبت نهایی و قفل قانون استهلاک",
            comment: "تایید نهایی روش محاسبات استهلاک"
          }
        ]
      };
      const res = await api.put(`/api/depreciation-setups/${selectedId}`, updated);
      if (res.data?.success) {
        alert("سند نهایی شد.");
        loadSetupDetails(res.data.data);
        fetchList();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // بارگذاری تنظیم
  const loadSetupDetails = (setup) => {
    setSelectedId(setup._id);
    setForm({
      setup_code: setup.setup_code ?? "",
      title: setup.title ?? "",
      status: setup.status ?? "فعال",
      fiscal_year: setup.fiscal_year ?? 1403,
      start_date: setup.start_date ?? "",
      end_date: setup.end_date ?? "",
      scope: {
        asset_group: setup.scope?.asset_group ?? "",
        asset_subgroup: setup.scope?.asset_subgroup ?? "",
        cost_center: setup.scope?.cost_center ?? "",
        project: setup.scope?.project ?? "",
        location: setup.scope?.location ?? "",
        org_unit: setup.scope?.org_unit ?? "",
        ownership_type: setup.scope?.ownership_type ?? "ملکی",
        company: setup.scope?.company ?? "",
      },
      calc_method: {
        method: setup.calc_method?.method ?? "خط مستقیم",
        period: setup.calc_method?.period ?? "سالانه",
        basis: setup.calc_method?.basis ?? "ارزش خرید",
        salvage_value: setup.calc_method?.salvage_value ?? 0,
        useful_life: setup.calc_method?.useful_life ?? 5,
        useful_life_unit: setup.calc_method?.useful_life_unit ?? "سال",
        rounding: setup.calc_method?.rounding ?? "بدون گرد کردن",
      },
      accounting: {
        expense_account_code: setup.accounting?.expense_account_code ?? "",
        expense_account_name: setup.accounting?.expense_account_name ?? "",
        accumulated_depr_account_code: setup.accounting?.accumulated_depr_account_code ?? "",
        accumulated_depr_account_name: setup.accounting?.accumulated_depr_account_name ?? "",
        default_cost_center: setup.accounting?.default_cost_center ?? "",
        default_project: setup.accounting?.default_project ?? "",
        voucher_desc_template: setup.accounting?.voucher_desc_template ?? "ثبت استهلاک دوره {دوره}",
        voucher_numbering: setup.accounting?.voucher_numbering ?? "خودکار",
      },
      calc_settings: {
        calc_from_utilization: setup.calc_settings?.calc_from_utilization ?? true,
        calc_from_purchase: setup.calc_settings?.calc_from_purchase ?? false,
        first_month_depr: setup.calc_settings?.first_month_depr ?? "کامل",
        calc_last_month: setup.calc_settings?.calc_last_month ?? true,
        stop_after_useful_life: setup.calc_settings?.stop_after_useful_life ?? true,
        skip_scrapped_assets: setup.calc_settings?.skip_scrapped_assets ?? true,
        skip_sold_assets: setup.calc_settings?.skip_sold_assets ?? true,
        auto_calc_on_close_month: setup.calc_settings?.auto_calc_on_close_month ?? false,
        auto_issue_voucher: setup.calc_settings?.auto_issue_voucher ?? false,
      },
      notes: setup.notes ?? "",
      creator: setup.creator ?? "ثبت‌کننده سیستم",
      attachments: setup.attachments ?? [],
      audit_logs: setup.audit_logs ?? [],
      is_finalized: setup.is_finalized ?? false
    });
    setShowSearchModal(false);
  };

  // شبیه‌ساز محاسبه استهلاک بر اساس روش انتخابی (جهت تست محاسبه)
  const runTestCalculation = () => {
    const cost = Number(testInputs.purchase_value || 0);
    const salvage = Number(form.calc_method.salvage_value || 0);
    const life = Number(form.calc_method.useful_life || 1);
    const isYearly = form.calc_method.useful_life_unit === "سال";
    
    // تعداد دوره‌ها
    const totalPeriods = isYearly ? life : Math.ceil(life / 12);
    
    let base = cost - salvage;
    let results = [];
    let accDepr = 0;

    if (form.calc_method.method === "خط مستقیم") {
      const annualDepr = base / totalPeriods;
      for (let i = 1; i <= totalPeriods; i++) {
        accDepr += annualDepr;
        results.push({
          period: `سال ${i}`,
          start_value: cost - (accDepr - annualDepr),
          amount: annualDepr,
          acc: accDepr,
          end_value: cost - accDepr,
        });
      }
    } else if (form.calc_method.method.includes("نزولی")) {
      const rate = form.calc_method.method === "نزولی مضاعف" ? (2 / totalPeriods) : (1.5 / totalPeriods);
      let currentVal = cost;
      for (let i = 1; i <= totalPeriods; i++) {
        let depr = currentVal * rate;
        if (i === totalPeriods || currentVal - depr < salvage) {
          depr = Math.max(0, currentVal - salvage);
        }
        accDepr += depr;
        const nextVal = currentVal - depr;
        results.push({
          period: `سال ${i}`,
          start_value: currentVal,
          amount: depr,
          acc: accDepr,
          end_value: nextVal,
        });
        currentVal = nextVal;
      }
    } else {
      // برای سایر روش‌ها شبیه‌ساز ساده
      const step = base / totalPeriods;
      for (let i = 1; i <= totalPeriods; i++) {
        accDepr += step;
        results.push({
          period: `دوره ${i}`,
          start_value: cost - (accDepr - step),
          amount: step,
          acc: accDepr,
          end_value: cost - accDepr,
        });
      }
    }
    setTestResult(results);
  };

  const filteredSetups = list.filter(item =>
    item.setup_code.includes(searchQuery) ||
    item.title.includes(searchQuery) ||
    item.scope?.asset_group?.includes(searchQuery)
  );

  return (
    <PageShell>
      {/* Breadcrumb */}
      <div className="mb-3 flex items-center gap-1 text-xs text-muted-foreground print:hidden" dir="rtl">
        <span className="text-blue-600 cursor-pointer hover:underline">سیستم اموال</span>
        <span>/</span>
        <span className="text-blue-600 cursor-pointer hover:underline">استهلاک</span>
        <span>/</span>
        <span>تنظیم استهلاک اموال</span>
      </div>

      {/* هدر */}
      <div className="mb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b pb-4" dir="rtl">
        <div className="text-right">
          <div className="flex items-center gap-2">
            <h1 className="text-lg md:text-xl font-bold text-foreground">تنظیم پارامترها و قوانین استهلاک</h1>
            {form.is_finalized && (
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200">
                <ShieldCheck className="h-3 w-3 ml-1 inline" /> نهایی‌شده و قفل
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">پیکربندی قوانین و روش‌های استهلاک دارایی‌ها به صورت قاعده-محور (Rule-Based)</p>
        </div>

        {/* دکمه‌های فرم */}
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={form.is_finalized}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-1 text-xs"
          >
            <Save className="h-4 w-4" /> ذخیره
          </Button>

          <Button variant="outline" size="sm" onClick={handleNew} className="gap-1 text-xs">
            <Plus className="h-4 w-4" /> جدید
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={!selectedId || form.is_finalized}
            className="text-destructive hover:bg-destructive/5 gap-1 text-xs"
          >
            <Trash2 className="h-4 w-4" /> حذف
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            disabled={!selectedId}
            className="gap-1 text-xs"
          >
            <Copy className="h-4 w-4" /> کپی تنظیم
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreviewModal(true)}
            className="gap-1 text-xs"
          >
            <Eye className="h-4 w-4" /> پیش‌نمایش
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowTestModal(true);
              runTestCalculation();
            }}
            className="text-orange-600 border-orange-200 bg-orange-50 hover:bg-orange-100 gap-1 text-xs"
          >
            <Play className="h-4 w-4" /> تست محاسبه
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleFinalize}
            disabled={!selectedId || form.is_finalized}
            className="text-emerald-600 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 gap-1 text-xs"
          >
            <CheckCircle2 className="h-4 w-4" /> ثبت نهایی
          </Button>

          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1 text-xs">
            <Printer className="h-4 w-4" /> چاپ
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => setShowSearchModal(true)} className="bg-muted/30 border-dashed gap-1 text-xs">
            <Search className="h-4 w-4" /> لیست قوانین
          </Button>
        </div>
      </div>

      {/* بخش اصلی رابط کاربری */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" dir="rtl">
        {/* سایدبار ناوبری تب‌ها (سمت راست در راست‌به‌چپ) */}
        <div className="lg:col-span-1 space-y-2 print:hidden">
          <Card className="shadow-sm border-border/80 overflow-hidden">
            <div className="border-b bg-muted/10 p-3 text-xs font-bold text-muted-foreground text-center">
              بخش‌های تنظیم استهلاک
            </div>
            <div className="p-2 space-y-1.5">
              <button
                onClick={() => setActiveTab("basic")}
                className={cn(
                  "w-full text-right px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between",
                  activeTab === "basic" ? "bg-blue-600 text-white" : "hover:bg-muted text-muted-foreground"
                )}
              >
                <span>۱. اطلاعات پایه</span>
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={() => setActiveTab("scope")}
                className={cn(
                  "w-full text-right px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between",
                  activeTab === "scope" ? "bg-blue-600 text-white" : "hover:bg-muted text-muted-foreground"
                )}
              >
                <span>۲. محدوده اعمال تنظیم</span>
                <ListFilter className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={() => setActiveTab("method")}
                className={cn(
                  "w-full text-right px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between",
                  activeTab === "method" ? "bg-blue-600 text-white" : "hover:bg-muted text-muted-foreground"
                )}
              >
                <span>۳. روش محاسبه استهلاک</span>
                <DollarSign className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={() => setActiveTab("accounting")}
                className={cn(
                  "w-full text-right px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between",
                  activeTab === "accounting" ? "bg-blue-600 text-white" : "hover:bg-muted text-muted-foreground"
                )}
              >
                <span>۴. تنظیمات حسابداری</span>
                <Database className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={() => setActiveTab("settings")}
                className={cn(
                  "w-full text-right px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between",
                  activeTab === "settings" ? "bg-blue-600 text-white" : "hover:bg-muted text-muted-foreground"
                )}
              >
                <span>۵. تنظیمات محاسباتی</span>
                <Sliders className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={() => setActiveTab("additional")}
                className={cn(
                  "w-full text-right px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between",
                  activeTab === "additional" ? "bg-blue-600 text-white" : "hover:bg-muted text-muted-foreground"
                )}
              >
                <span>۶. اطلاعات تکمیلی و ضمایم</span>
                <Activity className="h-3.5 w-3.5" />
              </button>
            </div>
          </Card>
        </div>

        {/* محتوای پنل‌ها (سمت چپ) */}
        <div className="lg:col-span-3">
          <Card className="shadow-sm border-border/80 min-h-[420px] relative">
            <CardContent className="p-6">
              
              {/* ۱. اطلاعات پایه */}
              {activeTab === "basic" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="border-b pb-2 mb-4">
                    <h3 className="text-sm font-bold text-foreground">اطلاعات پایه قانون استهلاک</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">شناسه، عنوان و تاریخ اعتبار قانون</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    <Field label="کد تنظیم استهلاک" required>
                      <Input
                        value={form.setup_code}
                        readOnly
                        dir="ltr"
                        className="bg-muted/40 font-mono text-center text-xs h-9 font-semibold text-muted-foreground"
                      />
                    </Field>

                    <Field label="عنوان تنظیم استهلاک" required col={2}>
                      <Input
                        value={form.title}
                        onChange={(e) => updateBase("title", e.target.value)}
                        disabled={form.is_finalized}
                        placeholder="مانند: استهلاک ساختمان‌ها و تاسیسات"
                        className="text-xs h-9 text-right"
                      />
                    </Field>

                    <Field label="دوره مالی" required>
                      <Input
                        type="number"
                        value={form.fiscal_year}
                        onChange={(e) => updateBase("fiscal_year", Number(e.target.value))}
                        disabled={form.is_finalized}
                        className="text-xs h-9 text-center font-mono"
                      />
                    </Field>

                    <Field label="تاریخ شروع اعتبار" required>
                      <PersianDatePicker
                        value={form.start_date}
                        onChange={(e) => updateBase("start_date", e.target.value)}
                        disabled={form.is_finalized}
                      />
                    </Field>

                    <Field label="تاریخ پایان اعتبار">
                      <PersianDatePicker
                        value={form.end_date}
                        onChange={(e) => updateBase("end_date", e.target.value)}
                        disabled={form.is_finalized}
                      />
                    </Field>

                    <Field label="وضعیت">
                      <select
                        value={form.status}
                        onChange={(e) => updateBase("status", e.target.value)}
                        disabled={form.is_finalized}
                        className="h-9 w-full rounded border border-input bg-background px-3 py-1 text-xs text-right"
                      >
                        <option value="فعال">فعال</option>
                        <option value="غیرفعال">غیرفعال</option>
                      </select>
                    </Field>
                  </div>
                </div>
              )}

              {/* ۲. محدوده اعمال تنظیم */}
              {activeTab === "scope" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="border-b pb-2 mb-4 flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-bold text-foreground">محدوده اعمال تنظیم (قواعد فیلترینگ اموال)</h3>
                      <p className="text-[10px] text-muted-foreground mt-0.5">مشخص کنید این روش استهلاک برای کدام دسته از اموال اعمال شود.</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-blue-50/50 text-blue-600 font-semibold border-blue-100">قاعده-محور</Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    <Field label="گروه دارایی">
                      <select
                        value={form.scope.asset_group}
                        onChange={(e) => {
                          updateScope("asset_group", e.target.value);
                          updateScope("asset_subgroup", ""); // ریست زیرگروه
                        }}
                        disabled={form.is_finalized}
                        className="h-9 w-full rounded border border-input bg-background px-3 py-1 text-xs text-right"
                      >
                        <option value="">همه گروه‌ها</option>
                        {ASSET_GROUPS.map((g, i) => <option key={i} value={g}>{g}</option>)}
                      </select>
                    </Field>

                    <Field label="زیرگروه دارایی">
                      <select
                        value={form.scope.asset_subgroup}
                        onChange={(e) => updateScope("asset_subgroup", e.target.value)}
                        disabled={form.is_finalized || !form.scope.asset_group}
                        className="h-9 w-full rounded border border-input bg-background px-3 py-1 text-xs text-right disabled:bg-muted/40"
                      >
                        <option value="">همه زیرگروه‌ها</option>
                        {form.scope.asset_group &&
                          ASSET_SUBGROUPS[form.scope.asset_group]?.map((s, i) => (
                            <option key={i} value={s}>{s}</option>
                          ))
                        }
                      </select>
                    </Field>

                    <Field label="واحد سازمانی">
                      <select
                        value={form.scope.org_unit}
                        onChange={(e) => updateScope("org_unit", e.target.value)}
                        disabled={form.is_finalized}
                        className="h-9 w-full rounded border border-input bg-background px-3 py-1 text-xs text-right"
                      >
                        <option value="">همه واحدهای سازمانی</option>
                        {ORGANIZATIONS.map((o, i) => <option key={i} value={o}>{o}</option>)}
                      </select>
                    </Field>

                    <Field label="مرکز هزینه">
                      <select
                        value={form.scope.cost_center}
                        onChange={(e) => updateScope("cost_center", e.target.value)}
                        disabled={form.is_finalized}
                        className="h-9 w-full rounded border border-input bg-background px-3 py-1 text-xs text-right"
                      >
                        <option value="">همه مراکز هزینه</option>
                        {COST_CENTERS.map((c, i) => <option key={i} value={c}>{c}</option>)}
                      </select>
                    </Field>

                    <Field label="پروژه">
                      <select
                        value={form.scope.project}
                        onChange={(e) => updateScope("project", e.target.value)}
                        disabled={form.is_finalized}
                        className="h-9 w-full rounded border border-input bg-background px-3 py-1 text-xs text-right"
                      >
                        <option value="">همه پروژه‌ها</option>
                        {PROJECTS.map((p, i) => <option key={i} value={p}>{p}</option>)}
                      </select>
                    </Field>

                    <Field label="محل استقرار">
                      <select
                        value={form.scope.location}
                        onChange={(e) => updateScope("location", e.target.value)}
                        disabled={form.is_finalized}
                        className="h-9 w-full rounded border border-input bg-background px-3 py-1 text-xs text-right"
                      >
                        <option value="">همه مکان‌ها</option>
                        {LOCATIONS.map((l, i) => <option key={i} value={l}>{l}</option>)}
                      </select>
                    </Field>

                    <Field label="نوع مالکیت">
                      <select
                        value={form.scope.ownership_type}
                        onChange={(e) => updateScope("ownership_type", e.target.value)}
                        disabled={form.is_finalized}
                        className="h-9 w-full rounded border border-input bg-background px-3 py-1 text-xs text-right"
                      >
                        {OWNERSHIP_TYPES.map((o, i) => <option key={i} value={o}>{o}</option>)}
                      </select>
                    </Field>

                    <Field label="شرکت (در هلدینگ)">
                      <select
                        value={form.scope.company}
                        onChange={(e) => updateScope("company", e.target.value)}
                        disabled={form.is_finalized}
                        className="h-9 w-full rounded border border-input bg-background px-3 py-1 text-xs text-right"
                      >
                        {COMPANIES.map((c, i) => <option key={i} value={c}>{c}</option>)}
                      </select>
                    </Field>
                  </div>
                </div>
              )}

              {/* ۳. روش محاسبه استهلاک */}
              {activeTab === "method" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="border-b pb-2 mb-4">
                    <h3 className="text-sm font-bold text-foreground">روش و مبنای محاسبه استهلاک</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">فرمول محاسباتی، عمر مفید و مبالغ اولیه</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    <Field label="روش استهلاک" required>
                      <select
                        value={form.calc_method.method}
                        onChange={(e) => updateMethod("method", e.target.value)}
                        disabled={form.is_finalized}
                        className="h-9 w-full rounded border border-input bg-background px-3 py-1 text-xs text-right font-semibold text-blue-600"
                      >
                        {DEPRECIATION_METHODS.map((m, i) => <option key={i} value={m}>{m}</option>)}
                      </select>
                    </Field>

                    <Field label="دوره محاسبه" required>
                      <select
                        value={form.calc_method.period}
                        onChange={(e) => updateMethod("period", e.target.value)}
                        disabled={form.is_finalized}
                        className="h-9 w-full rounded border border-input bg-background px-3 py-1 text-xs text-right"
                      >
                        {CALC_PERIODS.map((p, i) => <option key={i} value={p}>{p}</option>)}
                      </select>
                    </Field>

                    <Field label="مبنای محاسبه استهلاک" required>
                      <select
                        value={form.calc_method.basis}
                        onChange={(e) => updateMethod("basis", e.target.value)}
                        disabled={form.is_finalized}
                        className="h-9 w-full rounded border border-input bg-background px-3 py-1 text-xs text-right"
                      >
                        {CALC_BASES.map((b, i) => <option key={i} value={b}>{b}</option>)}
                      </select>
                    </Field>

                    <Field label="عمر مفید" required>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={form.calc_method.useful_life}
                          onChange={(e) => updateMethod("useful_life", Number(e.target.value))}
                          disabled={form.is_finalized}
                          className="h-9 text-xs text-center font-mono w-2/3"
                          min={1}
                        />
                        <select
                          value={form.calc_method.useful_life_unit}
                          onChange={(e) => updateMethod("useful_life_unit", e.target.value)}
                          disabled={form.is_finalized}
                          className="h-9 w-1/3 rounded border border-input bg-background text-xs text-center"
                        >
                          <option value="سال">سال</option>
                          <option value="ماه">ماه</option>
                        </select>
                      </div>
                    </Field>

                    <Field label="ارزش اسقاط (ریال)">
                      <div className="relative">
                        <Input
                          type="text"
                          value={Number(form.calc_method.salvage_value || 0).toLocaleString()}
                          onChange={(e) => updateMethod("salvage_value", Number(e.target.value.replace(/,/g, "")))}
                          disabled={form.is_finalized}
                          dir="ltr"
                          className="h-9 text-xs text-center font-mono pl-10"
                        />
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">ریال</span>
                      </div>
                    </Field>

                    <Field label="نحوه گرد کردن مبالغ استهلاک" required>
                      <select
                        value={form.calc_method.rounding}
                        onChange={(e) => updateMethod("rounding", e.target.value)}
                        disabled={form.is_finalized}
                        className="h-9 w-full rounded border border-input bg-background px-3 py-1 text-xs text-right"
                      >
                        {ROUNDING_OPTIONS.map((r, i) => <option key={i} value={r}>{r}</option>)}
                      </select>
                    </Field>
                  </div>
                </div>
              )}

              {/* ۴. تنظیمات حسابداری */}
              {activeTab === "accounting" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="border-b pb-2 mb-4">
                    <h3 className="text-sm font-bold text-foreground">تنظیمات و نگاشت‌های حسابداری</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">معین استهلاک انباشته، هزینه استهلاک و قالب اسناد حسابداری</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    <Field label="حساب هزینه استهلاک (معین)" required col={2}>
                      <div className="flex gap-2">
                        <select
                          value={form.accounting.expense_account_code}
                          onChange={(e) => handleSelectMoein("expense", e.target.value)}
                          disabled={form.is_finalized}
                          className="h-9 w-1/3 rounded border border-input bg-background text-xs font-mono text-center"
                        >
                          <option value="">انتخاب کد</option>
                          {MOEIN_ACCOUNTS.filter(m => m.code.startsWith("6")).map((m, i) => (
                            <option key={i} value={m.code}>{m.code}</option>
                          ))}
                        </select>
                        <Input
                          value={form.accounting.expense_account_name}
                          readOnly
                          className="h-9 text-xs text-right bg-muted/40 text-muted-foreground w-2/3"
                          placeholder="نام حساب با انتخاب کد معین تکمیل می‌شود"
                        />
                      </div>
                    </Field>

                    <Field label="شماره‌گذاری سند حسابداری" required>
                      <select
                        value={form.accounting.voucher_numbering}
                        onChange={(e) => updateAccounting("voucher_numbering", e.target.value)}
                        disabled={form.is_finalized}
                        className="h-9 w-full rounded border border-input bg-background px-3 py-1 text-xs text-right"
                      >
                        <option value="خودکار">خودکار</option>
                        <option value="دستی">دستی</option>
                      </select>
                    </Field>

                    <Field label="حساب استهلاک انباشته (معین)" required col={2}>
                      <div className="flex gap-2">
                        <select
                          value={form.accounting.accumulated_depr_account_code}
                          onChange={(e) => handleSelectMoein("accumulated", e.target.value)}
                          disabled={form.is_finalized}
                          className="h-9 w-1/3 rounded border border-input bg-background text-xs font-mono text-center"
                        >
                          <option value="">انتخاب کد</option>
                          {MOEIN_ACCOUNTS.filter(m => m.code.startsWith("1")).map((m, i) => (
                            <option key={i} value={m.code}>{m.code}</option>
                          ))}
                        </select>
                        <Input
                          value={form.accounting.accumulated_depr_account_name}
                          readOnly
                          className="h-9 text-xs text-right bg-muted/40 text-muted-foreground w-2/3"
                          placeholder="نام حساب با انتخاب کد معین تکمیل می‌شود"
                        />
                      </div>
                    </Field>

                    <Field label="مرکز هزینه پیش‌فرض">
                      <select
                        value={form.accounting.default_cost_center}
                        onChange={(e) => updateAccounting("default_cost_center", e.target.value)}
                        disabled={form.is_finalized}
                        className="h-9 w-full rounded border border-input bg-background px-3 py-1 text-xs text-right"
                      >
                        <option value="">همان مرکز هزینه محدوده اعمال</option>
                        {COST_CENTERS.map((c, i) => <option key={i} value={c}>{c}</option>)}
                      </select>
                    </Field>

                    <Field label="شرح پیش‌فرض سند استهلاک" col={2}>
                      <Input
                        value={form.accounting.voucher_desc_template}
                        onChange={(e) => updateAccounting("voucher_desc_template", e.target.value)}
                        disabled={form.is_finalized}
                        className="h-9 text-xs text-right font-medium"
                        placeholder="مانند: ثبت استهلاک دوره {ماه} مربوط به {گروه}"
                      />
                    </Field>

                    <Field label="پروژه پیش‌فرض">
                      <select
                        value={form.accounting.default_project}
                        onChange={(e) => updateAccounting("default_project", e.target.value)}
                        disabled={form.is_finalized}
                        className="h-9 w-full rounded border border-input bg-background px-3 py-1 text-xs text-right"
                      >
                        <option value="">همان پروژه محدوده اعمال</option>
                        {PROJECTS.map((p, i) => <option key={i} value={p}>{p}</option>)}
                      </select>
                    </Field>
                  </div>
                </div>
              )}

              {/* ۵. تنظیمات محاسباتی */}
              {activeTab === "settings" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="border-b pb-2 mb-4">
                    <h3 className="text-sm font-bold text-foreground">قوانین و تنظیمات رفتاری محاسبات</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">تنظیمات تاریخ‌های شروع، پایان و توقف فرآیند استهلاک‌گیری</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    <Field label="مبنای شروع محاسبه">
                      <div className="flex flex-col gap-2.5 pt-1.5">
                        <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-muted-foreground hover:text-foreground">
                          <input
                            type="radio"
                            name="start_basis"
                            checked={form.calc_settings.calc_from_utilization}
                            onChange={() => {
                              updateSettings("calc_from_utilization", true);
                              updateSettings("calc_from_purchase", false);
                            }}
                            disabled={form.is_finalized}
                            className="h-4 w-4 text-blue-600 rounded-full border-gray-300 focus:ring-blue-500"
                          />
                          <span>محاسبه از تاریخ بهره‌برداری دارایی</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-muted-foreground hover:text-foreground">
                          <input
                            type="radio"
                            name="start_basis"
                            checked={form.calc_settings.calc_from_purchase}
                            onChange={() => {
                              updateSettings("calc_from_purchase", true);
                              updateSettings("calc_from_utilization", false);
                            }}
                            disabled={form.is_finalized}
                            className="h-4 w-4 text-blue-600 rounded-full border-gray-300 focus:ring-blue-500"
                          />
                          <span>محاسبه از تاریخ خرید دارایی</span>
                        </label>
                      </div>
                    </Field>

                    <Field label="محاسبه استهلاک ماه اول">
                      <select
                        value={form.calc_settings.first_month_depr}
                        onChange={(e) => updateSettings("first_month_depr", e.target.value)}
                        disabled={form.is_finalized}
                        className="h-9 w-full rounded border border-input bg-background px-3 py-1 text-xs text-right"
                      >
                        <option value="کامل">کامل (یک ماه کامل استهلاک)</option>
                        <option value="نصف">نصف (نصف ماه استهلاک)</option>
                        <option value="بر اساس روز">روزشمار (بر اساس روزهای مانده از ماه)</option>
                      </select>
                    </Field>

                    <div className="grid grid-cols-1 gap-4 pt-4 sm:col-span-2 md:col-span-3">
                      <div className="text-xs font-bold text-muted-foreground mb-1 border-b pb-1">تنظیمات تکمیلی توقف و خروج اموال</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-muted-foreground hover:text-foreground">
                          <input
                            type="checkbox"
                            checked={form.calc_settings.calc_last_month}
                            onChange={(e) => updateSettings("calc_last_month", e.target.checked)}
                            disabled={form.is_finalized}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600"
                          />
                          <span>محاسبه استهلاک ماه آخر خروج</span>
                        </label>

                        <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-muted-foreground hover:text-foreground">
                          <input
                            type="checkbox"
                            checked={form.calc_settings.stop_after_useful_life}
                            onChange={(e) => updateSettings("stop_after_useful_life", e.target.checked)}
                            disabled={form.is_finalized}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600"
                          />
                          <span>توقف استهلاک پس از پایان عمر مفید</span>
                        </label>

                        <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-muted-foreground hover:text-foreground">
                          <input
                            type="checkbox"
                            checked={form.calc_settings.skip_scrapped_assets}
                            onChange={(e) => updateSettings("skip_scrapped_assets", e.target.checked)}
                            disabled={form.is_finalized}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600"
                          />
                          <span>عدم محاسبه برای اموال اسقاط شده</span>
                        </label>

                        <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-muted-foreground hover:text-foreground">
                          <input
                            type="checkbox"
                            checked={form.calc_settings.skip_sold_assets}
                            onChange={(e) => updateSettings("skip_sold_assets", e.target.checked)}
                            disabled={form.is_finalized}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600"
                          />
                          <span>عدم محاسبه برای دارایی‌های فروخته شده</span>
                        </label>

                        <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-muted-foreground hover:text-foreground">
                          <input
                            type="checkbox"
                            checked={form.calc_settings.auto_calc_on_close_month}
                            onChange={(e) => updateSettings("auto_calc_on_close_month", e.target.checked)}
                            disabled={form.is_finalized}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600"
                          />
                          <span>محاسبه خودکار هنگام بستن ماه</span>
                        </label>

                        <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-muted-foreground hover:text-foreground">
                          <input
                            type="checkbox"
                            checked={form.calc_settings.auto_issue_voucher}
                            onChange={(e) => updateSettings("auto_issue_voucher", e.target.checked)}
                            disabled={form.is_finalized}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600"
                          />
                          <span>صدور خودکار سند حسابداری همزمان</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ۶. اطلاعات تکمیلی و ضمایم */}
              {activeTab === "additional" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="border-b pb-2 mb-4">
                    <h3 className="text-sm font-bold text-foreground">ضمایم آیین‌نامه‌ها و تاریخچه گردش کار</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">یادداشت‌ها، فایل‌ها و تغییرات سیستمی مربوط به این قانون</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Field label="توضیحات و ملاحظات آیین‌نامه‌ای" col={2}>
                      <textarea
                        value={form.notes}
                        onChange={(e) => updateBase("notes", e.target.value)}
                        disabled={form.is_finalized}
                        className="w-full min-h-[140px] text-xs p-3 rounded-md border border-input bg-background text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="متن آیین‌نامه یا یادداشت‌های تکمیلی..."
                      />
                    </Field>

                    <div className="space-y-3 bg-muted/10 p-3 rounded-lg border h-fit">
                      <div className="text-xs font-bold text-foreground flex items-center gap-1">
                        <Paperclip className="h-3.5 w-3.5 text-blue-600" /> بارگذاری فایل ضمیمه (شبیه‌ساز)
                      </div>
                      <div className="space-y-3">
                        <Field label="نام فایل">
                          <Input
                            placeholder="مثال: instruction_depr.pdf"
                            value={newAttachment.name}
                            onChange={(e) => setNewAttachment(prev => ({ ...prev, name: e.target.value }))}
                            disabled={form.is_finalized}
                            className="h-8 text-xs text-right"
                          />
                        </Field>
                        <Field label="نوع فایل">
                          <select
                            value={newAttachment.type}
                            onChange={(e) => setNewAttachment(prev => ({ ...prev, type: e.target.value }))}
                            disabled={form.is_finalized}
                            className="h-8 w-full rounded border border-input bg-background px-2 text-xs"
                          >
                            <option value="آیین‌نامه">آیین‌نامه مالی</option>
                            <option value="مصوبه">مصوبه هیئت مدیره</option>
                            <option value="پیوست">پیوست فنی</option>
                            <option value="سایر">سایر</option>
                          </select>
                        </Field>
                        <Button
                          type="button"
                          onClick={handleAddAttachment}
                          disabled={form.is_finalized}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
                        >
                          <Plus className="h-3 w-3 ml-1" /> افزودن پیوست
                        </Button>
                      </div>
                    </div>

                    {/* لیست ضمایم */}
                    <div className="col-span-1 md:col-span-3">
                      <h4 className="text-xs font-bold text-foreground mb-2">لیست اسناد ضمیمه‌شده</h4>
                      <div className="overflow-x-auto rounded border">
                        <Table>
                          <TableHeader className="bg-muted/40">
                            <TableRow>
                              <TableHead className="text-right text-xs w-12">ردیف</TableHead>
                              <TableHead className="text-right text-xs">نام سند</TableHead>
                              <TableHead className="text-center text-xs w-28">نوع سند</TableHead>
                              <TableHead className="text-center text-xs w-24">حجم فایل</TableHead>
                              <TableHead className="text-center text-xs w-28">تاریخ بارگذاری</TableHead>
                              <TableHead className="text-center text-xs w-16">عملیات</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(form.attachments || []).map((att, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="text-xs font-mono text-center">{idx + 1}</TableCell>
                                <TableCell className="text-xs font-medium text-right font-mono" dir="ltr">{att.name}</TableCell>
                                <TableCell className="text-xs text-center">{att.type}</TableCell>
                                <TableCell className="text-xs font-mono text-center">{att.size}</TableCell>
                                <TableCell className="text-xs font-mono text-center">{att.date}</TableCell>
                                <TableCell className="text-center p-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteAttachment(idx)}
                                    disabled={form.is_finalized}
                                    className="h-7 w-7 text-destructive hover:text-destructive/80"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                            {(form.attachments || []).length === 0 && (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center text-xs py-6 text-muted-foreground">هیچ فایلی ضمیمه نشده است.</TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    {/* لاگ تغییرات */}
                    <div className="col-span-1 md:col-span-3 mt-4 border-t pt-4">
                      <h4 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1">
                        <Activity className="h-4 w-4 text-blue-600" /> تاریخچه تغییرات سیستمی (Audit Log)
                      </h4>
                      <div className="overflow-x-auto rounded border">
                        <Table>
                          <TableHeader className="bg-muted/40">
                            <TableRow>
                              <TableHead className="text-right text-xs w-12">ردیف</TableHead>
                              <TableHead className="text-right text-xs w-28">کاربر</TableHead>
                              <TableHead className="text-center text-xs w-40">تاریخ و ساعت اقدام</TableHead>
                              <TableHead className="text-center text-xs w-48">نوع عملیات</TableHead>
                              <TableHead className="text-right text-xs">شرح / پی‌نوشت کارتابل</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(form.audit_logs || []).map((log, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="text-xs font-mono text-center">{idx + 1}</TableCell>
                                <TableCell className="text-xs font-semibold text-right">{log.user}</TableCell>
                                <TableCell className="text-xs font-mono text-center">{log.date}</TableCell>
                                <TableCell className="text-xs text-center font-bold text-blue-700">{log.action}</TableCell>
                                <TableCell className="text-xs text-right text-muted-foreground">{log.comment || "-"}</TableCell>
                              </TableRow>
                            ))}
                            {(form.audit_logs || []).length === 0 && (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center text-xs py-6 text-muted-foreground">هیچ لاگ سیستمی ثبت نشده است.</TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </CardContent>
          </Card>
        </div>
      </div>

      {/* بخش آمار و جدول قوانین در پایین صفحه (Rule-Based Overview) */}
      <Card className="mt-8 border-border/80 shadow-sm print:hidden">
        <div className="border-b bg-muted/10 p-3 flex justify-between items-center" dir="rtl">
          <span className="font-bold text-xs">قوانین استهلاک فعال در سیستم (Rule-Based Matrix)</span>
          <span className="text-[10px] text-muted-foreground font-semibold">تعداد: {list.length} قانون</span>
        </div>
        <CardContent className="p-4" dir="rtl">
          <div className="overflow-x-auto rounded border">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="text-right text-xs">شناسه</TableHead>
                  <TableHead className="text-right text-xs">عنوان قانون</TableHead>
                  <TableHead className="text-right text-xs">گروه دارایی هدف</TableHead>
                  <TableHead className="text-center text-xs">روش استهلاک</TableHead>
                  <TableHead className="text-center text-xs">عمر مفید</TableHead>
                  <TableHead className="text-center text-xs">ارزش اسقاط</TableHead>
                  <TableHead className="text-right text-xs">حساب معین هزینه</TableHead>
                  <TableHead className="text-center text-xs">وضعیت</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((item, idx) => (
                  <TableRow
                    key={item._id}
                    onClick={() => loadSetupDetails(item)}
                    className="cursor-pointer hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="text-xs font-mono font-bold text-blue-600">{item.setup_code}</TableCell>
                    <TableCell className="text-xs font-semibold">{item.title}</TableCell>
                    <TableCell className="text-xs font-medium text-muted-foreground">{item.scope?.asset_group || "همه دارایی‌ها"}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="text-[10px] font-bold bg-blue-50 text-blue-700">{item.calc_method?.method}</Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-center">{item.calc_method?.useful_life} {item.calc_method?.useful_life_unit}</TableCell>
                    <TableCell className="text-xs font-mono text-center">{Number(item.calc_method?.salvage_value || 0).toLocaleString()} ریال</TableCell>
                    <TableCell className="text-xs font-mono text-right">{item.accounting?.expense_account_code} - {item.accounting?.expense_account_name}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className={cn(
                        "text-[10px] font-bold",
                        item.status === "فعال" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                      )}>
                        {item.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {list.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-xs py-8 text-muted-foreground">هیچ قانون استهلاکی در سیستم تعریف نشده است.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* مودال جستجو قوانین */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-3xl border-border/80 shadow-2xl max-h-[85vh] flex flex-col" dir="rtl">
            <div className="border-b border-border/80 p-4 bg-muted/10 flex justify-between items-center">
              <span className="font-bold text-sm">لیست قوانین استهلاک</span>
              <button onClick={() => setShowSearchModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 border-b border-border/80">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجو بر اساس کد، عنوان تنظیم یا گروه دارایی..."
                  className="h-9 pr-9 text-xs text-right w-full"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="overflow-x-auto rounded border">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="text-right text-xs">ردیف</TableHead>
                      <TableHead className="text-center text-xs">کد تنظیم</TableHead>
                      <TableHead className="text-right text-xs">عنوان تنظیم</TableHead>
                      <TableHead className="text-right text-xs">گروه دارایی</TableHead>
                      <TableHead className="text-center text-xs">روش محاسبه</TableHead>
                      <TableHead className="text-center text-xs">وضعیت</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSetups.map((p, idx) => (
                      <TableRow
                        key={p._id}
                        onClick={() => loadSetupDetails(p)}
                        className="cursor-pointer hover:bg-muted/40 transition-colors"
                      >
                        <TableCell className="text-xs">{idx + 1}</TableCell>
                        <TableCell className="text-center text-xs font-semibold font-mono text-blue-600">{p.setup_code}</TableCell>
                        <TableCell className="text-right text-xs font-semibold">{p.title}</TableCell>
                        <TableCell className="text-right text-xs font-medium text-muted-foreground">{p.scope?.asset_group || "همه دارایی‌ها"}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="text-[10px]">{p.calc_method?.method}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className={p.status === "فعال" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}>
                            {p.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredSetups.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-xs py-8 text-muted-foreground">قانون تنظیمی یافت نشد.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
            
            <div className="border-t border-border/80 p-3 bg-muted/10 flex justify-end">
              <Button onClick={() => setShowSearchModal(false)} variant="outline" size="sm" className="text-xs h-8">بستن</Button>
            </div>
          </Card>
        </div>
      )}

      {/* مودال پیش‌نمایش کامل سند */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-4xl border-border/80 shadow-2xl max-h-[90vh] flex flex-col" dir="rtl">
            <div className="border-b p-4 bg-muted/15 flex justify-between items-center">
              <span className="font-bold text-sm flex items-center gap-1.5"><FileText className="h-4 w-4 text-blue-600" /> پیش‌نمایش آیین‌نامه و شناسنامه تنظیم استهلاک</span>
              <button onClick={() => setShowPreviewModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/5">
                <div><span className="text-[10px] text-muted-foreground block">کد قانون استهلاک:</span><span className="text-xs font-mono font-bold">{form.setup_code}</span></div>
                <div><span className="text-[10px] text-muted-foreground block">عنوان قانون:</span><span className="text-xs font-semibold">{form.title || "تعیین نشده"}</span></div>
                <div><span className="text-[10px] text-muted-foreground block">دوره مالی:</span><span className="text-xs font-semibold">{form.fiscal_year}</span></div>
                <div><span className="text-[10px] text-muted-foreground block">وضعیت:</span><span className="text-xs font-semibold">{form.status}</span></div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-foreground border-r-2 border-blue-600 pr-2">۱. محدوده اعمال قوانین استهلاک</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div><span className="text-muted-foreground">گروه دارایی:</span> {form.scope.asset_group || "همه دارایی‌ها"}</div>
                  <div><span className="text-muted-foreground">زیرگروه دارایی:</span> {form.scope.asset_subgroup || "همه زیرگروه‌ها"}</div>
                  <div><span className="text-muted-foreground">مرکز هزینه:</span> {form.scope.cost_center || "همه مراکز هزینه"}</div>
                  <div><span className="text-muted-foreground">پروژه:</span> {form.scope.project || "همه پروژه‌ها"}</div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-foreground border-r-2 border-blue-600 pr-2">۲. روش و جزئیات محاسباتی</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div><span className="text-muted-foreground">روش استهلاک:</span> {form.calc_method.method}</div>
                  <div><span className="text-muted-foreground">دوره محاسباتی:</span> {form.calc_method.period}</div>
                  <div><span className="text-muted-foreground">عمر مفید:</span> {form.calc_method.useful_life} {form.calc_method.useful_life_unit}</div>
                  <div><span className="text-muted-foreground">ارزش اسقاط:</span> {Number(form.calc_method.salvage_value).toLocaleString()} ریال</div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-foreground border-r-2 border-blue-600 pr-2">۳. تنظیمات اسناد و حسابداری</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div><span className="text-muted-foreground">سند هزینه استهلاک (بدهکار):</span> {form.accounting.expense_account_code} - {form.accounting.expense_account_name || "تعیین نشده"}</div>
                  <div><span className="text-muted-foreground">سند استهلاک انباشته (بستانکار):</span> {form.accounting.accumulated_depr_account_code} - {form.accounting.accumulated_depr_account_name || "تعیین نشده"}</div>
                  <div><span className="text-muted-foreground">قالب شرح سند:</span> {form.accounting.voucher_desc_template}</div>
                  <div><span className="text-muted-foreground">شماره‌گذاری سند:</span> {form.accounting.voucher_numbering}</div>
                </div>
              </div>
            </div>
            
            <div className="border-t p-3 bg-muted/10 flex justify-end gap-2">
              <Button onClick={handlePrint} className="bg-blue-600 text-white text-xs h-8"><Printer className="h-4 w-4 ml-1" /> چاپ شناسنامه</Button>
              <Button onClick={() => setShowPreviewModal(false)} variant="outline" size="sm" className="text-xs h-8">بستن</Button>
            </div>
          </Card>
        </div>
      )}

      {/* مودال تست محاسبه استهلاک */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-4xl border-border/80 shadow-2xl max-h-[85vh] flex flex-col" dir="rtl">
            <div className="border-b p-4 bg-muted/15 flex justify-between items-center">
              <span className="font-bold text-sm flex items-center gap-1.5"><Play className="h-4 w-4 text-orange-600 animate-pulse" /> شبیه‌ساز زنده محاسبه استهلاک (تست محاسباتی)</span>
              <button onClick={() => setShowTestModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 border-b bg-muted/5 flex flex-wrap gap-4 items-end">
              <Field label="ارزش اولیه دارایی (فرضی)">
                <div className="relative">
                  <Input
                    type="text"
                    value={Number(testInputs.purchase_value || 0).toLocaleString()}
                    onChange={(e) => setTestInputs(prev => ({ ...prev, purchase_value: Number(e.target.value.replace(/,/g, "")) }))}
                    dir="ltr"
                    className="h-8 text-xs text-center font-mono pl-10"
                  />
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">ریال</span>
                </div>
              </Field>

              <Field label="تاریخ بهره‌برداری دارایی">
                <PersianDatePicker
                  value={testInputs.utilization_date}
                  onChange={(e) => setTestInputs(prev => ({ ...prev, utilization_date: e.target.value }))}
                />
              </Field>

              <Button onClick={runTestCalculation} className="bg-orange-600 hover:bg-orange-700 text-white text-xs h-8">
                اجرای شبیه‌سازی محاسبات
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 text-blue-700 p-3 rounded-lg text-xs leading-relaxed">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <strong>مبنای شبیه‌سازی:</strong> محاسبات زیر بر اساس روش <strong>{form.calc_method.method}</strong> با عمر مفید <strong>{form.calc_method.useful_life} {form.calc_method.useful_life_unit}</strong> و ارزش اسقاط <strong>{Number(form.calc_method.salvage_value).toLocaleString()} ریال</strong> طراحی شده است.
                </div>
              </div>

              <div className="overflow-x-auto rounded border">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="text-center text-xs">دوره</TableHead>
                      <TableHead className="text-center text-xs">ارزش دفتری ابتدای دوره</TableHead>
                      <TableHead className="text-center text-xs">مبلغ هزینه استهلاک دوره</TableHead>
                      <TableHead className="text-center text-xs">استهلاک انباشته پایان دوره</TableHead>
                      <TableHead className="text-center text-xs">ارزش دفتری انتهای دوره</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {testResult.map((res, idx) => (
                      <TableRow key={idx} className="hover:bg-muted/20">
                        <TableCell className="text-center text-xs font-semibold">{res.period}</TableCell>
                        <TableCell className="text-center text-xs font-mono">{Number(res.start_value).toLocaleString()} ریال</TableCell>
                        <TableCell className="text-center text-xs font-mono font-bold text-orange-600">{Number(res.amount).toLocaleString()} ریال</TableCell>
                        <TableCell className="text-center text-xs font-mono text-muted-foreground">{Number(res.acc).toLocaleString()} ریال</TableCell>
                        <TableCell className="text-center text-xs font-mono font-bold text-blue-700">{Number(res.end_value).toLocaleString()} ریال</TableCell>
                      </TableRow>
                    ))}
                    {testResult.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-xs py-8 text-muted-foreground">جهت دریافت اقساط استهلاک، دکمه شبیه‌سازی محاسبات را بزنید.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
            
            <div className="border-t p-3 bg-muted/10 flex justify-end">
              <Button onClick={() => setShowTestModal(false)} variant="outline" size="sm" className="text-xs h-8">بستن</Button>
            </div>
          </Card>
        </div>
      )}

    </PageShell>
  );
}
