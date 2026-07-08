import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Badge } from "@/components/ui/badge";
import { PersianDatePicker } from "@/components/ui/persian-date-picker";
import {
  Plus, Trash2, Edit, Save, X, FileText, CheckCircle2,
  AlertCircle, Calendar, DollarSign, Building, RefreshCw,
  FolderOpen, PieChart, Send, ShieldAlert, FileSpreadsheet
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/api";

// ─── تابع کمکی تبدیل عدد به حروف فارسی ──────────────────────────────────────────
function numToPersianWords(num) {
  if (num === 0) return "صفر ریال";
  if (!num || isNaN(num)) return "";
  
  const units = ["", "هزار", "میلیون", "میلیارد", "تریلیون"];
  const ones = ["", "یک", "دو", "سه", "چهار", "پنج", "شش", "هفت", "هشت", "نه"];
  const teens = ["ده", "یازده", "دوازده", "سیزده", "چهارده", "پانزده", "شانزده", "هفده", "هجده", "نوزده"];
  const tens = ["", "ده", "بیست", "سی", "چهل", "پنجاه", "شصت", "هفتاد", "هشتاد", "نود"];
  const hundreds = ["", "صد", "دویست", "سیصد", "چهارصد", "پانصد", "ششصد", "هفتصد", "هشتصد", "نهصد"];

  function getSection(n) {
    let res = [];
    const h = Math.floor(n / 100);
    const t = Math.floor((n % 100) / 10);
    const o = n % 10;

    if (h > 0) res.push(hundreds[h]);
    if (t === 1) {
      res.push(teens[o]);
    } else {
      if (t > 0) res.push(tens[t]);
      if (o > 0) res.push(ones[o]);
    }
    return res.join(" و ");
  }

  let parts = [];
  let temp = Number(num);
  let idx = 0;

  while (temp > 0) {
    const sec = temp % 1000;
    if (sec > 0) {
      const text = getSection(sec);
      parts.unshift(text + (units[idx] ? " " + units[idx] : ""));
    }
    temp = Math.floor(temp / 1000);
    idx++;
  }

  return parts.join(" و ") + " ریال";
}

function fmtNum(n) {
  if (n === 0 || n == null) return "۰";
  return Number(n).toLocaleString("fa-IR");
}

export default function Credits() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // ── کنترل بارگذاری سال‌های مالی ──
  const [fiscalYears, setFiscalYears] = useState([]);
  
  // ── مدیریت داده‌های اصلی ──
  const [agreements, setAgreements] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [delegations, setDelegations] = useState([]);
  const [definitions, setDefinitions] = useState([]);
  const [requests, setRequests] = useState([]);

  // ── وضعیت بارگذاری و خطاها ──
  const [loading, setLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);

  // ── فرم موافقت‌نامه ──
  const [editingAgr, setEditingAgr] = useState(null);
  const [agrForm, setAgrForm] = useState({
    title: "", fiscal_year: "", total_amount: "",
    program_code: "", activity_code: "", chapter_code: "", description: ""
  });

  // ── فرم درخواست بودجه ──
  const [editingReq, setEditingReq] = useState(null);
  const [reqForm, setReqForm] = useState({
    fiscal_year: "", agreement_id: "", amount: "",
    requesting_unit: "", request_date: "", description: "", status: "pending"
  });

  // ── فرم تخصیص اعتبار ──
  const [editingAlloc, setEditingAlloc] = useState(null);
  const [allocForm, setAllocForm] = useState({
    fiscal_year: "", agreement_id: "", amount: "",
    allocation_date: "", period: "سه ماهه اول", description: ""
  });

  // ── فرم تفویض / ابلاغ ──
  const [editingDel, setEditingDel] = useState(null);
  const [delForm, setDelForm] = useState({
    fiscal_year: "", amount: "", from_unit: "مرکز",
    to_unit: "", delegation_date: "", description: ""
  });

  // بارگذاری داده‌ها
  const fetchData = async () => {
    setLoading(true);
    try {
      const [yRes, aRes, alRes, dRes, dfRes, rRes] = await Promise.all([
        api.get("/api/fiscal-years"),
        api.get("/api/credits/agreements"),
        api.get("/api/credits/allocations"),
        api.get("/api/credits/delegations"),
        api.get("/api/credits/definitions"),
        api.get("/api/credits/requests")
      ]);

      setFiscalYears((yRes.data?.data ?? []).map(y => ({ value: String(y.year), label: String(y.year) })));
      setAgreements(aRes.data?.data ?? []);
      setAllocations(alRes.data?.data ?? []);
      setDelegations(dRes.data?.data ?? []);
      setDefinitions(dfRes.data?.data ?? []);
      setRequests(rRes.data?.data ?? []);
    } catch (e) {
      setAlertMsg({ type: "error", text: "خطا در بارگذاری اطلاعات از سرور" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pathname]);

  // ── مدیریت ارسال فرم موافقت‌نامه ──
  const handleAgrSubmit = async (e) => {
    e.preventDefault();
    if (!agrForm.title || !agrForm.fiscal_year || !agrForm.total_amount) {
      setAlertMsg({ type: "error", text: "پر کردن فیلدهای ستاره‌دار الزامی است" });
      return;
    }

    try {
      const payload = {
        ...agrForm,
        fiscal_year: Number(agrForm.fiscal_year),
        total_amount: Number(agrForm.total_amount)
      };

      if (editingAgr) {
        await api.put(`/api/credits/agreements/${editingAgr}`, payload);
        setAlertMsg({ type: "success", text: "موافقت‌نامه با موفقیت ویرایش شد" });
      } else {
        await api.post("/api/credits/agreements", payload);
        setAlertMsg({ type: "success", text: "موافقت‌نامه جدید با موفقیت ثبت شد" });
      }
      setAgrForm({ title: "", fiscal_year: "", total_amount: "", program_code: "", activity_code: "", chapter_code: "", description: "" });
      setEditingAgr(null);
      fetchData();
    } catch (err) {
      setAlertMsg({ type: "error", text: err.response?.data?.message ?? "خطا در ذخیره‌سازی موافقت‌نامه" });
    }
  };

  // حذف موافقت‌نامه
  const handleAgrDelete = async (id) => {
    if (!confirm("آیا از حذف این موافقت‌نامه اطمینان دارید؟")) return;
    try {
      await api.delete(`/api/credits/agreements/${id}`);
      setAlertMsg({ type: "success", text: "موافقت‌نامه با موفقیت حذف شد" });
      fetchData();
    } catch (err) {
      setAlertMsg({ type: "error", text: "خطا در حذف موافقت‌نامه" });
    }
  };

  // ── مدیریت ارسال فرم درخواست بودجه ──
  const handleReqSubmit = async (e) => {
    e.preventDefault();
    if (!reqForm.fiscal_year || !reqForm.agreement_id || !reqForm.amount || !reqForm.requesting_unit) {
      setAlertMsg({ type: "error", text: "پر کردن فیلدهای ستاره‌دار الزامی است" });
      return;
    }

    try {
      const payload = {
        ...reqForm,
        fiscal_year: Number(reqForm.fiscal_year),
        amount: Number(reqForm.amount)
      };

      if (editingReq) {
        await api.put(`/api/credits/requests/${editingReq}`, payload);
        setAlertMsg({ type: "success", text: "درخواست بودجه با موفقیت ویرایش شد" });
      } else {
        await api.post("/api/credits/requests", payload);
        setAlertMsg({ type: "success", text: "درخواست بودجه با موفقیت ثبت شد" });
      }
      setReqForm({ fiscal_year: "", agreement_id: "", amount: "", requesting_unit: "", request_date: "", description: "", status: "pending" });
      setEditingReq(null);
      fetchData();
    } catch (err) {
      setAlertMsg({ type: "error", text: "خطا در ثبت درخواست بودجه" });
    }
  };

  // حذف درخواست بودجه
  const handleReqDelete = async (id) => {
    if (!confirm("آیا از حذف این درخواست بودجه اطمینان دارید؟")) return;
    try {
      await api.delete(`/api/credits/requests/${id}`);
      setAlertMsg({ type: "success", text: "درخواست بودجه با موفقیت حذف شد" });
      fetchData();
    } catch (err) {
      setAlertMsg({ type: "error", text: "خطا در حذف درخواست بودجه" });
    }
  };

  // ── مدیریت ارسال فرم تخصیص ──
  const handleAllocSubmit = async (e) => {
    e.preventDefault();
    if (!allocForm.fiscal_year || !allocForm.agreement_id || !allocForm.amount) {
      setAlertMsg({ type: "error", text: "فیلدهای ستاره‌دار الزامی هستند" });
      return;
    }

    // بررسی سقف مجاز تخصیص
    const selectedAgr = agreements.find(a => String(a._id) === allocForm.agreement_id);
    if (selectedAgr) {
      const currentAllocated = allocations
        .filter(al => String(al.agreement_id) === allocForm.agreement_id && String(al._id) !== editingAlloc)
        .reduce((sum, al) => sum + (al.amount ?? 0), 0);
      const remaining = selectedAgr.total_amount - currentAllocated;
      if (Number(allocForm.amount) > remaining) {
        setAlertMsg({
          type: "error",
          text: `مبلغ تخصیص جدید از سقف باقیمانده بودجه مصوب (${fmtNum(remaining)} ریال) بیشتر است.`
        });
        return;
      }
    }

    try {
      const payload = {
        ...allocForm,
        fiscal_year: Number(allocForm.fiscal_year),
        amount: Number(allocForm.amount)
      };

      if (editingAlloc) {
        await api.put(`/api/credits/allocations/${editingAlloc}`, payload);
        setAlertMsg({ type: "success", text: "تخصیص با موفقیت ویرایش شد" });
      } else {
        await api.post("/api/credits/allocations", payload);
        setAlertMsg({ type: "success", text: "تخصیص اعتبار با موفقیت ثبت شد" });
      }
      setAllocForm({ fiscal_year: "", agreement_id: "", amount: "", allocation_date: "", period: "سه ماهه اول", description: "" });
      setEditingAlloc(null);
      fetchData();
    } catch (err) {
      setAlertMsg({ type: "error", text: "خطا در ذخیره‌سازی تخصیص" });
    }
  };

  // حذف تخصیص
  const handleAllocDelete = async (id) => {
    if (!confirm("آیا از حذف این تخصیص اعتبار اطمینان دارید؟")) return;
    try {
      await api.delete(`/api/credits/allocations/${id}`);
      setAlertMsg({ type: "success", text: "تخصیص با موفقیت حذف شد" });
      fetchData();
    } catch (err) {
      setAlertMsg({ type: "error", text: "خطا در حذف تخصیص" });
    }
  };

  // ── مدیریت ارسال فرم تفویض / ابلاغ ──
  const handleDelSubmit = async (e) => {
    e.preventDefault();
    if (!delForm.fiscal_year || !delForm.amount || !delForm.to_unit) {
      setAlertMsg({ type: "error", text: "پر کردن فیلدهای ستاره‌دار الزامی است" });
      return;
    }

    try {
      const payload = {
        ...delForm,
        fiscal_year: Number(delForm.fiscal_year),
        amount: Number(delForm.amount)
      };

      if (editingDel) {
        await api.put(`/api/credits/delegations/${editingDel}`, payload);
        setAlertMsg({ type: "success", text: "ابلاغ اعتبار با موفقیت ویرایش شد" });
      } else {
        await api.post("/api/credits/delegations", payload);
        setAlertMsg({ type: "success", text: "ابلاغ اعتبار با موفقیت ثبت شد" });
      }
      setDelForm({ fiscal_year: "", amount: "", from_unit: "مرکز", to_unit: "", delegation_date: "", description: "" });
      setEditingDel(null);
      fetchData();
    } catch (err) {
      setAlertMsg({ type: "error", text: "خطا در ثبت ابلاغ اعتبار" });
    }
  };

  // حذف ابلاغ
  const handleDelDelete = async (id) => {
    if (!confirm("آیا از حذف این ابلاغ اعتبار اطمینان دارید؟")) return;
    try {
      await api.delete(`/api/credits/delegations/${id}`);
      setAlertMsg({ type: "success", text: "ابلاغ با موفقیت حذف شد" });
      fetchData();
    } catch (err) {
      setAlertMsg({ type: "error", text: "خطا در حذف ابلاغ اعتبار" });
    }
  };

  // محاسبه آمارهای کلی داشبورد
  const totalApproved = agreements.reduce((sum, a) => sum + (a.total_amount ?? 0), 0);
  const totalAllocated = allocations.reduce((sum, al) => sum + (al.amount ?? 0), 0);
  const totalRequested = requests.reduce((sum, r) => sum + (r.amount ?? 0), 0);
  const totalDelegated = delegations.reduce((sum, d) => sum + (d.amount ?? 0), 0);

  // ─── ۱. صفحه داشبورد اعتبارات ───────────────────────────────────────────────
  if (pathname === "/credits") {
    return (
      <PageShell>
        <PageHeader title="داشبورد و مدیریت اعتبارات" description="فرآیندهای موافقت‌نامه، درخواست بودجه، تخصیص و ابلاغ اعتبار دستگاه" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6" dir="rtl">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
            <CardContent className="pt-6 flex items-center justify-between">
              <div className="text-right">
                <p className="text-xs text-blue-600 font-semibold">کل بودجه مصوب</p>
                <h3 className="text-lg font-bold mt-1 text-blue-900 font-mono">{fmtNum(totalApproved)} <span className="text-[10px]">ریال</span></h3>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                <FolderOpen className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200">
            <CardContent className="pt-6 flex items-center justify-between">
              <div className="text-right">
                <p className="text-xs text-amber-600 font-semibold">کل درخواست‌های بودجه</p>
                <h3 className="text-lg font-bold mt-1 text-amber-900 font-mono">{fmtNum(totalRequested)} <span className="text-[10px]">ریال</span></h3>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 border-indigo-200">
            <CardContent className="pt-6 flex items-center justify-between">
              <div className="text-right">
                <p className="text-xs text-indigo-600 font-semibold">کل تخصیص صادر شده</p>
                <h3 className="text-lg font-bold mt-1 text-indigo-900 font-mono">{fmtNum(totalAllocated)} <span className="text-[10px]">ریال</span></h3>
              </div>
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                <PieChart className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
            <CardContent className="pt-6 flex items-center justify-between">
              <div className="text-right">
                <p className="text-xs text-emerald-600 font-semibold">کل اعتبار ابلاغ‌شده</p>
                <h3 className="text-lg font-bold mt-1 text-emerald-900 font-mono">{fmtNum(totalDelegated)} <span className="text-[10px]">ریال</span></h3>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <Send className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4" dir="rtl">
          <Card className="hover:border-blue-300 transition-all cursor-pointer" onClick={() => navigate("/credits/agreements")}>
            <CardHeader className="text-right pb-2">
              <CardTitle className="text-sm font-bold text-blue-800 flex items-center gap-2">
                <FolderOpen className="h-4 w-4" /> موافقت‌نامه بودجه
              </CardTitle>
            </CardHeader>
            <CardContent className="text-right text-xs text-muted-foreground">
              ثبت موافقت‌نامه‌های مالی سالانه کل دستگاه به تفکیک برنامه‌ها، فعالیت‌ها و فصول هزینه‌ای.
            </CardContent>
          </Card>

          <Card className="hover:border-amber-300 transition-all cursor-pointer" onClick={() => navigate("/credits/requests")}>
            <CardHeader className="text-right pb-2">
              <CardTitle className="text-sm font-bold text-amber-800 flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" /> درخواست بودجه
              </CardTitle>
            </CardHeader>
            <CardContent className="text-right text-xs text-muted-foreground">
              ثبت تقاضای اعتبار توسط معاونت‌ها و واحدهای زیرمجموعه بر مبنای فصول هزینه‌ای موافقت‌نامه.
            </CardContent>
          </Card>

          <Card className="hover:border-indigo-300 transition-all cursor-pointer" onClick={() => navigate("/credits/allocation-no-doc")}>
            <CardHeader className="text-right pb-2">
              <CardTitle className="text-sm font-bold text-indigo-800 flex items-center gap-2">
                <PieChart className="h-4 w-4" /> تخصیص اعتبار
              </CardTitle>
            </CardHeader>
            <CardContent className="text-right text-xs text-muted-foreground">
              تخصیص بودجه مصوب در دوره‌های سه ماهه با کنترل عدم تجاوز از سقف کل موافقت‌نامه.
            </CardContent>
          </Card>

          <Card className="hover:border-emerald-300 transition-all cursor-pointer" onClick={() => navigate("/credits/notification/request")}>
            <CardHeader className="text-right pb-2">
              <CardTitle className="text-sm font-bold text-emerald-800 flex items-center gap-2">
                <Send className="h-4 w-4" /> ابلاغ و انتقال اعتبار
              </CardTitle>
            </CardHeader>
            <CardContent className="text-right text-xs text-muted-foreground">
              ثبت درخواست‌های ابلاغ اعتبار و انتقال تخصیص‌ها به واحدهای تابعه و ذیحسابی‌ها.
            </CardContent>
          </Card>
        </div>
      </PageShell>
    );
  }

  // ─── ۲. صفحه موافقت‌نامه‌ها ─────────────────────────────────────────────────
  if (pathname === "/credits/agreements") {
    return (
      <PageShell>
        <PageHeader title="موافقت‌نامه بودجه" description="ثبت و ویرایش موافقت‌نامه‌های بودجه مصوب دستگاه" />
        
        {alertMsg && (
          <div className={cn("p-4 mb-4 rounded-xl border flex items-center gap-2 text-sm justify-between",
            alertMsg.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800")} dir="rtl">
            <div className="flex items-center gap-2">
              {alertMsg.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
              <span>{alertMsg.text}</span>
            </div>
            <button onClick={() => setAlertMsg(null)}><X className="h-4 w-4" /></button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" dir="rtl">
          {/* فرم ثبت موافقت نامه */}
          <Card className="lg:col-span-1">
            <CardHeader className="text-right">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                {editingAgr ? "ویرایش موافقت‌نامه" : "موافقت‌نامه جدید"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAgrSubmit} className="space-y-4 text-right">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">عنوان موافقت‌نامه <span className="text-rose-500">*</span></Label>
                  <Input value={agrForm.title} onChange={e => setAgrForm({ ...agrForm, title: e.target.value })} placeholder="مثال: برنامه پشتیبانی اداری" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">سال مالی <span className="text-rose-500">*</span></Label>
                    <SearchableSelect value={agrForm.fiscal_year} onChange={val => setAgrForm({ ...agrForm, fiscal_year: val })} options={fiscalYears} placeholder="سال..." searchable={false} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">کد برنامه</Label>
                    <Input value={agrForm.program_code} onChange={e => setAgrForm({ ...agrForm, program_code: e.target.value })} placeholder="11001" className="font-mono" dir="ltr" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">کد طرح/پروژه</Label>
                    <Input value={agrForm.activity_code} onChange={e => setAgrForm({ ...agrForm, activity_code: e.target.value })} placeholder="01" className="font-mono" dir="ltr" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">کد فصل هزینه</Label>
                    <Input value={agrForm.chapter_code} onChange={e => setAgrForm({ ...agrForm, chapter_code: e.target.value })} placeholder="110200" className="font-mono" dir="ltr" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">مبلغ کل بودجه مصوب (ریال) <span className="text-rose-500">*</span></Label>
                  <div className="relative">
                    <Input type="number" value={agrForm.total_amount} onChange={e => setAgrForm({ ...agrForm, total_amount: e.target.value })} placeholder="مبلغ ریالی..." className="pl-8 font-mono" dir="ltr" />
                    <span className="absolute left-2.5 top-2 text-[10px] text-muted-foreground font-bold">ریال</span>
                  </div>
                  {agrForm.total_amount && (
                    <p className="text-[10px] text-blue-600 bg-blue-50/50 p-2 rounded border border-blue-100 font-semibold mt-1">
                      {numToPersianWords(agrForm.total_amount)}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">توضیحات</Label>
                  <Input value={agrForm.description} onChange={e => setAgrForm({ ...agrForm, description: e.target.value })} placeholder="توضیحات..." />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="submit" size="sm" className="flex-1 gap-1.5">
                    <Save className="h-4 w-4" /> ذخیره موافقت‌نامه
                  </Button>
                  {editingAgr && (
                    <Button type="button" variant="outline" size="sm" onClick={() => {
                      setEditingAgr(null);
                      setAgrForm({ title: "", fiscal_year: "", total_amount: "", program_code: "", activity_code: "", chapter_code: "", description: "" });
                    }}>
                      انصراف
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* لیست موافقت نامه ها */}
          <Card className="lg:col-span-2">
            <CardHeader className="text-right flex items-center justify-between flex-row">
              <CardTitle className="text-sm font-bold">لیست موافقت‌نامه‌های فعال</CardTitle>
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={fetchData} disabled={loading}>
                <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right">
                  <thead>
                    <tr className="bg-muted/50 border-b font-bold text-muted-foreground">
                      <th className="px-3 py-2.5">عنوان / جزئیات</th>
                      <th className="px-3 py-2.5 text-center w-24">سال مالی</th>
                      <th className="px-3 py-2.5 text-center w-40">بودجه مصوب (ریال)</th>
                      <th className="px-3 py-2.5 text-center w-44">کدینگ (برنامه/طرح/فصل)</th>
                      <th className="px-3 py-2.5 text-center w-24">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agreements.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-muted-foreground">
                          هیچ موافقت‌نامه‌ای ثبت نشده است
                        </td>
                      </tr>
                    ) : (
                      agreements.map((agr) => (
                        <tr key={agr._id} className="border-b hover:bg-muted/30">
                          <td className="px-3 py-3 font-semibold">
                            <div>{agr.title}</div>
                            {agr.description && <div className="text-[10px] text-muted-foreground font-normal mt-0.5">{agr.description}</div>}
                          </td>
                          <td className="px-3 py-3 text-center font-mono font-medium">{agr.fiscal_year}</td>
                          <td className="px-3 py-3 text-center font-mono font-bold text-blue-700">{fmtNum(agr.total_amount)}</td>
                          <td className="px-3 py-3 text-center font-mono text-muted-foreground">
                            {agr.program_code || "—"} / {agr.activity_code || "—"} / {agr.chapter_code || "—"}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <div className="flex gap-1.5 justify-center">
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-600" onClick={() => {
                                setEditingAgr(agr._id);
                                setAgrForm({
                                  title: agr.title, fiscal_year: String(agr.fiscal_year), total_amount: String(agr.total_amount),
                                  program_code: agr.program_code ?? "", activity_code: agr.activity_code ?? "",
                                  chapter_code: agr.chapter_code ?? "", description: agr.description ?? ""
                                });
                              }}>
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-rose-600" onClick={() => handleAgrDelete(agr._id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageShell>
    );
  }

  // ─── ۳. صفحه درخواست بودجه ────────────────────────────────────────────────
  if (pathname === "/credits/requests") {
    // گزینه‌های موافقت‌نامه برای سلکت باکس
    const agrOptions = agreements
      .filter(a => !reqForm.fiscal_year || a.fiscal_year === Number(reqForm.fiscal_year))
      .map(a => ({
        value: String(a._id),
        label: `${a.title} (کل مصوب: ${fmtNum(a.total_amount)} ریال)`
      }));

    return (
      <PageShell>
        <PageHeader title="درخواست بودجه" description="ثبت و پیگیری تقاضای تخصیص و ابلاغ اعتبار توسط واحدهای سازمانی" />
        
        {alertMsg && (
          <div className={cn("p-4 mb-4 rounded-xl border flex items-center gap-2 text-sm justify-between",
            alertMsg.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800")} dir="rtl">
            <div className="flex items-center gap-2">
              {alertMsg.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
              <span>{alertMsg.text}</span>
            </div>
            <button onClick={() => setAlertMsg(null)}><X className="h-4 w-4" /></button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" dir="rtl">
          {/* فرم ثبت درخواست */}
          <Card className="lg:col-span-1">
            <CardHeader className="text-right">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-amber-600" />
                {editingReq ? "ویرایش درخواست بودجه" : "درخواست بودجه جدید"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleReqSubmit} className="space-y-4 text-right">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">سال مالی <span className="text-rose-500">*</span></Label>
                    <SearchableSelect value={reqForm.fiscal_year} onChange={val => setReqForm({ ...reqForm, fiscal_year: val, agreement_id: "" })} options={fiscalYears} placeholder="سال..." searchable={false} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">تاریخ درخواست</Label>
                    <PersianDatePicker value={reqForm.request_date} onChange={e => setReqForm({ ...reqForm, request_date: e.target.value })} placeholder="۱۴۰۳/۰۴/۱۰" className="h-9 text-xs" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">انتخاب موافقت‌نامه مرجع <span className="text-rose-500">*</span></Label>
                  <SearchableSelect value={reqForm.agreement_id} onChange={val => setReqForm({ ...reqForm, agreement_id: val })} options={agrOptions} placeholder="موافقت‌نامه..." searchable={true} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">واحد درخواست‌کننده <span className="text-rose-500">*</span></Label>
                    <SearchableSelect value={reqForm.requesting_unit} onChange={val => setReqForm({ ...reqForm, requesting_unit: val })} options={[
                      { value: "معاونت پشتیبانی و توسعه منابع", label: "معاونت پشتیبانی و توسعه منابع" },
                      { value: "اداره کل فناوری اطلاعات", label: "اداره کل فناوری اطلاعات" },
                      { value: "اداره کل عمران و بهسازی", label: "اداره کل عمران و بهسازی" },
                    ]} placeholder="انتخاب واحد..." searchable={true} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">وضعیت درخواست</Label>
                    <SearchableSelect value={reqForm.status} onChange={val => setReqForm({ ...reqForm, status: val })} options={[
                      { value: "pending", label: "در انتظار بررسی" },
                      { value: "approved", label: "تایید شده" },
                      { value: "rejected", label: "رد شده" },
                    ]} placeholder="وضعیت..." searchable={false} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">مبلغ درخواستی (ریال) <span className="text-rose-500">*</span></Label>
                  <Input type="number" value={reqForm.amount} onChange={e => setReqForm({ ...reqForm, amount: e.target.value })} placeholder="مبلغ ریالی..." className="font-mono pl-8" dir="ltr" />
                  {reqForm.amount && (
                    <p className="text-[10px] text-amber-600 bg-amber-50/50 p-2 rounded border border-amber-100 font-semibold mt-1">
                      {numToPersianWords(reqForm.amount)}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">توضیحات</Label>
                  <Input value={reqForm.description} onChange={e => setReqForm({ ...reqForm, description: e.target.value })} placeholder="توضیحات درخواست..." />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="submit" size="sm" className="flex-1 gap-1.5 bg-amber-600 hover:bg-amber-700 text-white">
                    <Save className="h-4 w-4" /> ثبت درخواست
                  </Button>
                  {editingReq && (
                    <Button type="button" variant="outline" size="sm" onClick={() => {
                      setEditingReq(null);
                      setReqForm({ fiscal_year: "", agreement_id: "", amount: "", requesting_unit: "", request_date: "", description: "", status: "pending" });
                    }}>
                      انصراف
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* جدول درخواست ها */}
          <Card className="lg:col-span-2">
            <CardHeader className="text-right flex items-center justify-between flex-row">
              <CardTitle className="text-sm font-bold">لیست درخواست‌های بودجه</CardTitle>
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={fetchData} disabled={loading}>
                <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right">
                  <thead>
                    <tr className="bg-muted/50 border-b font-bold text-muted-foreground">
                      <th className="px-3 py-2.5">شماره سند / واحد متقاضی</th>
                      <th className="px-3 py-2.5 text-center w-24">سال مالی</th>
                      <th className="px-3 py-2.5 text-center w-36">موافقت‌نامه مرجع</th>
                      <th className="px-3 py-2.5 text-center w-32">مبلغ درخواستی (ریال)</th>
                      <th className="px-3 py-2.5 text-center w-24">وضعیت</th>
                      <th className="px-3 py-2.5 text-center w-20">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-muted-foreground">
                          هیچ درخواست بودجه‌ای ثبت نشده است
                        </td>
                      </tr>
                    ) : (
                      requests.map((req) => {
                        const relatedAgr = agreements.find(a => String(a._id) === String(req.agreement_id));
                        return (
                          <tr key={req._id} className="border-b hover:bg-muted/30">
                            <td className="px-3 py-3">
                              <span className="font-semibold text-amber-700">{req.request_number}</span>
                              <div className="text-[10px] font-bold text-foreground mt-0.5">{req.requesting_unit}</div>
                              {req.description && <div className="text-[9px] text-muted-foreground font-normal mt-0.5">{req.description}</div>}
                            </td>
                            <td className="px-3 py-3 text-center font-mono">{req.fiscal_year}</td>
                            <td className="px-3 py-3 text-center text-muted-foreground truncate max-w-[150px]" title={relatedAgr?.title}>
                              {relatedAgr?.title || "—"}
                            </td>
                            <td className="px-3 py-3 text-center font-mono font-bold text-amber-900">{fmtNum(req.amount)}</td>
                            <td className="px-3 py-3 text-center">
                              <Badge className={cn("text-[9px] font-bold text-white border-0",
                                req.status === "approved" && "bg-emerald-600",
                                req.status === "pending" && "bg-amber-500",
                                req.status === "rejected" && "bg-rose-600"
                              )}>
                                {req.status === "approved" ? "تایید شده" : req.status === "rejected" ? "رد شده" : "در انتظار"}
                              </Badge>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <div className="flex gap-1.5 justify-center">
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-amber-600" onClick={() => {
                                  setEditingReq(req._id);
                                  setReqForm({
                                    fiscal_year: req.fiscal_year ? String(req.fiscal_year) : "",
                                    agreement_id: req.agreement_id ? String(req.agreement_id) : "",
                                    amount: req.amount ? String(req.amount) : "",
                                    requesting_unit: req.requesting_unit ?? "",
                                    request_date: req.request_date ?? "",
                                    description: req.description ?? "",
                                    status: req.status ?? "pending"
                                  });
                                }}>
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-rose-600" onClick={() => handleReqDelete(req._id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageShell>
    );
  }

  // ─── ۴. صفحه تخصیص اعتبار ───────────────────────────────────────────────────
  if (pathname === "/credits/allocation-no-doc") {
    // گزینه‌های موافقت‌نامه برای سلکت باکس
    const agreementOptions = agreements
      .filter(a => !allocForm.fiscal_year || a.fiscal_year === Number(allocForm.fiscal_year))
      .map(a => {
        const allocatedAmount = allocations
          .filter(al => String(al.agreement_id) === String(a._id) && String(al._id) !== editingAlloc)
          .reduce((sum, al) => sum + (al.amount ?? 0), 0);
        const remaining = a.total_amount - allocatedAmount;
        
        return {
          value: String(a._id),
          label: `${a.title} (کل: ${fmtNum(a.total_amount)} | باقیمانده: ${fmtNum(remaining)})`
        };
      });

    return (
      <PageShell>
        <PageHeader title="تخصیص بودجه و اعتبار" description="اختصاص مبالغ بودجه بر اساس موافقت‌نامه‌های مصوب" />

        {alertMsg && (
          <div className={cn("p-4 mb-4 rounded-xl border flex items-center gap-2 text-sm justify-between",
            alertMsg.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800")} dir="rtl">
            <div className="flex items-center gap-2">
              {alertMsg.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
              <span>{alertMsg.text}</span>
            </div>
            <button onClick={() => setAlertMsg(null)}><X className="h-4 w-4" /></button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" dir="rtl">
          {/* فرم ثبت تخصیص */}
          <Card className="lg:col-span-1">
            <CardHeader className="text-right">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <PieChart className="h-4 w-4 text-indigo-600" />
                {editingAlloc ? "ویرایش تخصیص اعتبار" : "تخصیص جدید"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAllocSubmit} className="space-y-4 text-right">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">سال مالی <span className="text-rose-500">*</span></Label>
                    <SearchableSelect value={allocForm.fiscal_year} onChange={val => setAllocForm({ ...allocForm, fiscal_year: val, agreement_id: "" })} options={fiscalYears} placeholder="سال..." searchable={false} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">دوره تخصیص <span className="text-rose-500">*</span></Label>
                    <SearchableSelect value={allocForm.period} onChange={val => setAllocForm({ ...allocForm, period: val })} options={[
                      { value: "سه ماهه اول", label: "سه ماهه اول" },
                      { value: "سه ماهه دوم", label: "سه ماهه دوم" },
                      { value: "سه ماهه سوم", label: "سه ماهه سوم" },
                      { value: "سه ماهه چهارم", label: "سه ماهه چهارم" },
                    ]} placeholder="دوره..." searchable={false} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">انتخاب موافقت‌نامه مرجع <span className="text-rose-500">*</span></Label>
                  <SearchableSelect value={allocForm.agreement_id} onChange={val => setAllocForm({ ...allocForm, agreement_id: val })} options={agreementOptions} placeholder="موافقت‌نامه..." searchable={true} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">مبلغ تخصیص جدید (ریال) <span className="text-rose-500">*</span></Label>
                    <Input type="number" value={allocForm.amount} onChange={e => setAllocForm({ ...allocForm, amount: e.target.value })} placeholder="مبلغ ریالی..." className="font-mono pl-8" dir="ltr" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">تاریخ تخصیص</Label>
                    <PersianDatePicker value={allocForm.allocation_date} onChange={e => setAllocForm({ ...allocForm, allocation_date: e.target.value })} placeholder="۱۴۰۳/۰۴/۰۱" className="h-9 text-xs" />
                  </div>
                </div>

                {allocForm.amount && (
                  <p className="text-[10px] text-indigo-600 bg-indigo-50/50 p-2 rounded border border-indigo-100 font-semibold mt-1">
                    {numToPersianWords(allocForm.amount)}
                  </p>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">توضیحات</Label>
                  <Input value={allocForm.description} onChange={e => setAllocForm({ ...allocForm, description: e.target.value })} placeholder="مثال: تخصیص سه ماهه اول بخش فناوری" />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="submit" size="sm" className="flex-1 gap-1.5">
                    <Save className="h-4 w-4" /> ذخیره تخصیص
                  </Button>
                  {editingAlloc && (
                    <Button type="button" variant="outline" size="sm" onClick={() => {
                      setEditingAlloc(null);
                      setAllocForm({ fiscal_year: "", agreement_id: "", amount: "", allocation_date: "", period: "سه ماهه اول", description: "" });
                    }}>
                      انصراف
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* لیست تخصیص ها */}
          <Card className="lg:col-span-2">
            <CardHeader className="text-right flex items-center justify-between flex-row">
              <CardTitle className="text-sm font-bold">لیست تخصیص‌های صادر شده</CardTitle>
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={fetchData} disabled={loading}>
                <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right">
                  <thead>
                    <tr className="bg-muted/50 border-b font-bold text-muted-foreground">
                      <th className="px-3 py-2.5">موافقت‌نامه مرجع</th>
                      <th className="px-3 py-2.5 text-center w-24">سال مالی</th>
                      <th className="px-3 py-2.5 text-center w-32">دوره تخصیص</th>
                      <th className="px-3 py-2.5 text-center w-36">مبلغ تخصیص (ریال)</th>
                      <th className="px-3 py-2.5 text-center w-28">تاریخ تخصیص</th>
                      <th className="px-3 py-2.5 text-center w-20">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allocations.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-muted-foreground">
                          هیچ تخصیص اعتباری صادر نشده است
                        </td>
                      </tr>
                    ) : (
                      allocations.map((al) => {
                        const referenceAgr = agreements.find(a => String(a._id) === String(al.agreement_id));
                        return (
                          <tr key={al._id} className="border-b hover:bg-muted/30">
                            <td className="px-3 py-3">
                              <span className="font-semibold">{referenceAgr?.title || "موافقت‌نامه نامشخص"}</span>
                              {al.description && <div className="text-[10px] text-muted-foreground mt-0.5">{al.description}</div>}
                            </td>
                            <td className="px-3 py-3 text-center font-mono">{al.fiscal_year}</td>
                            <td className="px-3 py-3 text-center text-indigo-700 font-medium">{al.period}</td>
                            <td className="px-3 py-3 text-center font-mono font-bold text-indigo-900">{fmtNum(al.amount)}</td>
                            <td className="px-3 py-3 text-center font-mono text-muted-foreground">{al.allocation_date || "—"}</td>
                            <td className="px-3 py-3 text-center">
                              <div className="flex gap-1.5 justify-center">
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-indigo-600" onClick={() => {
                                  setEditingAlloc(al._id);
                                  setAllocForm({
                                    fiscal_year: String(al.fiscal_year), agreement_id: String(al.agreement_id),
                                    amount: String(al.amount), allocation_date: al.allocation_date ?? "",
                                    period: al.period ?? "سه ماهه اول", description: al.description ?? ""
                                  });
                                }}>
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-rose-600" onClick={() => handleAllocDelete(al._id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageShell>
    );
  }

  // ─── ۵. صفحه تفویض و ابلاغ اعتبار ────────────────────────────────────────────
  if (pathname === "/credits/notification/request") {
    return (
      <PageShell>
        <PageHeader title="ابلاغ اعتبار و انتقال بودجه" description="ابلاغ اعتبار مصوب به معاونت‌ها و ادارات تابعه" />

        {alertMsg && (
          <div className={cn("p-4 mb-4 rounded-xl border flex items-center gap-2 text-sm justify-between",
            alertMsg.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800")} dir="rtl">
            <div className="flex items-center gap-2">
              {alertMsg.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
              <span>{alertMsg.text}</span>
            </div>
            <button onClick={() => setAlertMsg(null)}><X className="h-4 w-4" /></button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" dir="rtl">
          {/* فرم ابلاغ اعتبار */}
          <Card className="lg:col-span-1">
            <CardHeader className="text-right">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Send className="h-4 w-4 text-emerald-600" />
                {editingDel ? "ویرایش ابلاغ اعتبار" : "ابلاغ اعتبار جدید"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleDelSubmit} className="space-y-4 text-right">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">سال مالی <span className="text-rose-500">*</span></Label>
                    <SearchableSelect value={delForm.fiscal_year} onChange={val => setDelForm({ ...delForm, fiscal_year: val })} options={fiscalYears} placeholder="سال..." searchable={false} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">تاریخ ابلاغ</Label>
                    <PersianDatePicker value={delForm.delegation_date} onChange={e => setDelForm({ ...delForm, delegation_date: e.target.value })} placeholder="۱۴۰۳/۰۴/۱۵" className="h-9 text-xs" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">واحد مبدأ</Label>
                    <Input value={delForm.from_unit} onChange={e => setDelForm({ ...delForm, from_unit: e.target.value })} placeholder="مرکز" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">واحد مقصد (دریافت‌کننده) <span className="text-rose-500">*</span></Label>
                    <SearchableSelect value={delForm.to_unit} onChange={val => setDelForm({ ...delForm, to_unit: val })} options={[
                      { value: "معاونت پشتیبانی و توسعه منابع", label: "معاونت پشتیبانی و توسعه منابع" },
                      { value: "اداره کل فناوری اطلاعات", label: "اداره کل فناوری اطلاعات" },
                      { value: "اداره کل عمران و بهسازی", label: "اداره کل عمران و بهسازی" },
                    ]} placeholder="انتخاب واحد..." searchable={true} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">مبلغ ابلاغ (ریال) <span className="text-rose-500">*</span></Label>
                  <Input type="number" value={delForm.amount} onChange={e => setDelForm({ ...delForm, amount: e.target.value })} placeholder="مبلغ ریالی..." className="font-mono pl-8" dir="ltr" />
                  {delForm.amount && (
                    <p className="text-[10px] text-emerald-600 bg-emerald-50/50 p-2 rounded border border-emerald-100 font-semibold mt-1">
                      {numToPersianWords(delForm.amount)}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">توضیحات</Label>
                  <Input value={delForm.description} onChange={e => setDelForm({ ...delForm, description: e.target.value })} placeholder="مثال: ابلاغ سه ماهه تجهیزات فناوری اطلاعات" />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="submit" size="sm" className="flex-1 gap-1.5">
                    <Save className="h-4 w-4" /> ذخیره ابلاغ
                  </Button>
                  {editingDel && (
                    <Button type="button" variant="outline" size="sm" onClick={() => {
                      setEditingDel(null);
                      setDelForm({ fiscal_year: "", amount: "", from_unit: "مرکز", to_unit: "", delegation_date: "", description: "" });
                    }}>
                      انصراف
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* لیست ابلاغ ها */}
          <Card className="lg:col-span-2">
            <CardHeader className="text-right flex items-center justify-between flex-row">
              <CardTitle className="text-sm font-bold">لیست تفویض و ابلاغ‌های فعال</CardTitle>
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={fetchData} disabled={loading}>
                <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right">
                  <thead>
                    <tr className="bg-muted/50 border-b font-bold text-muted-foreground">
                      <th className="px-3 py-2.5">جزئیات و مقصد ابلاغ</th>
                      <th className="px-3 py-2.5 text-center w-24">سال مالی</th>
                      <th className="px-3 py-2.5 text-center w-36">واحد مبدا / مقصد</th>
                      <th className="px-3 py-2.5 text-center w-36">مبلغ ابلاغ (ریال)</th>
                      <th className="px-3 py-2.5 text-center w-28">تاریخ ابلاغ</th>
                      <th className="px-3 py-2.5 text-center w-20">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {delegations.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-muted-foreground">
                          هیچ تفویض یا ابلاغ اعتباری ثبت نشده است
                        </td>
                      </tr>
                    ) : (
                      delegations.map((del) => (
                        <tr key={del._id} className="border-b hover:bg-muted/30">
                          <td className="px-3 py-3">
                            <span className="font-semibold">{del.delegation_number}</span>
                            {del.description && <div className="text-[10px] text-muted-foreground mt-0.5">{del.description}</div>}
                          </td>
                          <td className="px-3 py-3 text-center font-mono">{del.fiscal_year}</td>
                          <td className="px-3 py-3 text-center">
                            <span className="font-medium">{del.to_unit}</span>
                            <div className="text-[9px] text-muted-foreground mt-0.5">از: {del.from_unit || "مرکز"}</div>
                          </td>
                          <td className="px-3 py-3 text-center font-mono font-bold text-emerald-700">{fmtNum(del.amount)}</td>
                          <td className="px-3 py-3 text-center font-mono text-muted-foreground">{del.delegation_date || "—"}</td>
                          <td className="px-3 py-3 text-center">
                            <div className="flex gap-1.5 justify-center">
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-emerald-600" onClick={() => {
                                  setEditingDel(del._id);
                                  setDelForm({
                                    fiscal_year: String(del.fiscal_year), amount: String(del.amount),
                                    from_unit: del.from_unit ?? "مرکز", to_unit: del.to_unit ?? "",
                                    delegation_date: del.delegation_date ?? "", description: del.description ?? ""
                                  });
                                }}>
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-rose-600" onClick={() => handleDelDelete(del._id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageShell>
    );
  }

  //Fallback
  return (
    <PageShell>
      <PageHeader title="بخش اعتبارات" description="پیاده‌سازی فرآیندهای مالی دستگاه" />
      <Card>
        <CardContent className="py-12 flex flex-col items-center justify-center text-muted-foreground">
          <ShieldAlert className="h-10 w-10 text-rose-500 mb-2 animate-bounce" />
          <p className="text-sm font-semibold">بخش اعتبارات در حال توسعه است</p>
        </CardContent>
      </Card>
    </PageShell>
  );
}
