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

  // ── فرم درخواست وجه ──
  const [showForm, setShowForm] = useState(false);
  const [editingReq, setEditingReq] = useState(null);

  const getInitialReqForm = () => {
    // Current shamsi date as default request date
    let request_date = "";
    try {
      const todayFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric', month: 'numeric', day: 'numeric' });
      request_date = todayFormatter.format(new Date());
    } catch (e) {}

    return {
      fiscal_year: "1403",
      request_number: "",
      request_date: request_date,
      requesting_unit: "واحد مالی",
      requester: "علی محمدی",
      title: "",
      description: "",
      request_type: "پرداخت",
      status: "pending",
      priority: "عادی",
      amount: 0,
      amount_in_words: "",
      project: "",
      cost_center: "مرکز و عمومی",
      agreement_id: "",
      allocation_id: "",

      // Payment details
      payment_type: "انتقال بانکی",
      payment_due_date: "",
      payment_account: "",
      payment_method: "یک مرحله ای",
      iban: "",
      destination_bank: "",
      destination_account: "",
      recipient_name: "",
      national_id: "",
      payment_description: "",
      attachments: [],

      // Items
      items: [
        {
          description_item: "",
          code: 1, // Quantity multiplier
          unit: "دستگاه",
          unit_price: 0,
          total_price: 0,
          cost_center: "اداری و عمومی",
          project: "",
          description: ""
        }
      ]
    };
  };

  const [reqForm, setReqForm] = useState(getInitialReqForm());

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...reqForm.items];
    const item = { ...updatedItems[index], [field]: value };
    if (field === "code" || field === "unit_price") {
      const qty = Number(item.code) || 0;
      const price = Number(item.unit_price) || 0;
      item.total_price = qty * price;
    }
    updatedItems[index] = item;
    const totalAmount = updatedItems.reduce((sum, it) => sum + (it.total_price || 0), 0);
    const amountInWords = numToPersianWords(totalAmount);
    setReqForm({
      ...reqForm,
      items: updatedItems,
      amount: totalAmount,
      amount_in_words: amountInWords
    });
  };

  const addItemRow = () => {
    setReqForm({
      ...reqForm,
      items: [
        ...reqForm.items,
        {
          description_item: "",
          code: 1,
          unit: "عدد",
          unit_price: 0,
          total_price: 0,
          cost_center: "اداری و عمومی",
          project: "",
          description: ""
        }
      ]
    });
  };

  const removeItemRow = (index) => {
    if (reqForm.items.length <= 1) return;
    const updatedItems = reqForm.items.filter((_, idx) => idx !== index);
    const totalAmount = updatedItems.reduce((sum, it) => sum + (it.total_price || 0), 0);
    const amountInWords = numToPersianWords(totalAmount);
    setReqForm({
      ...reqForm,
      items: updatedItems,
      amount: totalAmount,
      amount_in_words: amountInWords
    });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    const newAttachments = files.map(file => ({
      name: file.name,
      size: (file.size / 1024).toFixed(1) + " KB",
      type: file.type
    }));
    setReqForm({
      ...reqForm,
      attachments: [...reqForm.attachments, ...newAttachments]
    });
  };

  const removeAttachment = (index) => {
    setReqForm({
      ...reqForm,
      attachments: reqForm.attachments.filter((_, idx) => idx !== index)
    });
  };

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
    to_unit: "", delegation_date: "", description: "", request_id: ""
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

  // ── مدیریت ارسال فرم درخواست وجه ──
  const handleReqSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!reqForm.fiscal_year || !reqForm.amount || !reqForm.requesting_unit || !reqForm.title || !reqForm.allocation_id) {
      setAlertMsg({ type: "error", text: "پر کردن فیلدهای ستاره‌دار (سال مالی، واحد درخواست دهنده، عنوان درخواست، تخصیص اعتبار مرجع و مبلغ) الزامی است" });
      return;
    }

    // Validate that request amount does not exceed remaining allocation amount
    const selectedAlloc = allocations.find(al => String(al._id) === String(reqForm.allocation_id));
    if (selectedAlloc) {
      const currentRequested = requests
        .filter(r => String(r.allocation_id) === String(reqForm.allocation_id) && String(r._id) !== editingReq)
        .reduce((sum, r) => sum + (r.amount ?? 0), 0);
      const remaining = selectedAlloc.amount - currentRequested;
      if (Number(reqForm.amount) > remaining) {
        setAlertMsg({
          type: "error",
          text: `مبلغ درخواست وجه از سقف باقیمانده تخصیص اعتبار مربوطه (${fmtNum(remaining)} ریال) بیشتر است.`
        });
        return;
      }
    }

    try {
      const payload = {
        ...reqForm,
        fiscal_year: Number(reqForm.fiscal_year),
        amount: Number(reqForm.amount)
      };

      if (editingReq) {
        await api.put(`/api/credits/requests/${editingReq}`, payload);
        setAlertMsg({ type: "success", text: "درخواست وجه با موفقیت ویرایش شد" });
      } else {
        await api.post("/api/credits/requests", payload);
        setAlertMsg({ type: "success", text: "درخواست وجه با موفقیت ثبت شد" });
      }
      setReqForm(getInitialReqForm());
      setEditingReq(null);
      setShowForm(false);
      fetchData();
    } catch (err) {
      setAlertMsg({ type: "error", text: "خطا در ثبت درخواست وجه" });
    }
  };

  const handleSendForApproval = async () => {
    if (!reqForm.fiscal_year || !reqForm.amount || !reqForm.requesting_unit || !reqForm.title || !reqForm.allocation_id) {
      setAlertMsg({ type: "error", text: "پر کردن فیلدهای ستاره‌دار (سال مالی، واحد درخواست دهنده، عنوان درخواست، تخصیص اعتبار مرجع و مبلغ) الزامی است" });
      return;
    }

    // Validate that request amount does not exceed remaining allocation amount
    const selectedAlloc = allocations.find(al => String(al._id) === String(reqForm.allocation_id));
    if (selectedAlloc) {
      const currentRequested = requests
        .filter(r => String(r.allocation_id) === String(reqForm.allocation_id) && String(r._id) !== editingReq)
        .reduce((sum, r) => sum + (r.amount ?? 0), 0);
      const remaining = selectedAlloc.amount - currentRequested;
      if (Number(reqForm.amount) > remaining) {
        setAlertMsg({
          type: "error",
          text: `مبلغ درخواست وجه از سقف باقیمانده تخصیص اعتبار مربوطه (${fmtNum(remaining)} ریال) بیشتر است.`
        });
        return;
      }
    }

    try {
      const payload = {
        ...reqForm,
        status: "approved",
        fiscal_year: Number(reqForm.fiscal_year),
        amount: Number(reqForm.amount)
      };

      if (editingReq) {
        await api.put(`/api/credits/requests/${editingReq}`, payload);
        setAlertMsg({ type: "success", text: "درخواست وجه با موفقیت ارسال و ویرایش شد" });
      } else {
        await api.post("/api/credits/requests", payload);
        setAlertMsg({ type: "success", text: "درخواست وجه با موفقیت ثبت و ارسال شد" });
      }
      setReqForm(getInitialReqForm());
      setEditingReq(null);
      setShowForm(false);
      fetchData();
    } catch (err) {
      setAlertMsg({ type: "error", text: "خطا در ارسال درخواست وجه" });
    }
  };

  // حذف درخواست وجه
  const handleReqDelete = async (id) => {
    if (!confirm("آیا از حذف این درخواست وجه اطمینان دارید؟")) return;
    try {
      await api.delete(`/api/credits/requests/${id}`);
      setAlertMsg({ type: "success", text: "درخواست وجه با موفقیت حذف شد" });
      fetchData();
    } catch (err) {
      setAlertMsg({ type: "error", text: "خطا در حذف درخواست وجه" });
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
    if (!delForm.fiscal_year || !delForm.amount || !delForm.to_unit || !delForm.request_id) {
      setAlertMsg({ type: "error", text: "پر کردن فیلدهای ستاره‌دار (سال مالی، مبلغ، واحد مقصد و درخواست وجه مرجع) الزامی است" });
      return;
    }

    // Validate that delegation amount does not exceed remaining request amount
    const selectedReq = requests.find(r => String(r._id) === String(delForm.request_id));
    if (selectedReq) {
      const currentDelegated = delegations
        .filter(d => String(d.request_id) === String(delForm.request_id) && String(d._id) !== editingDel)
        .reduce((sum, d) => sum + (d.amount ?? 0), 0);
      const remaining = selectedReq.amount - currentDelegated;
      if (Number(delForm.amount) > remaining) {
        setAlertMsg({
          type: "error",
          text: `مبلغ ابلاغ اعتبار از سقف باقیمانده درخواست وجه مربوطه (${fmtNum(remaining)} ریال) بیشتر است.`
        });
        return;
      }
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
      setDelForm({ fiscal_year: "", amount: "", from_unit: "مرکز", to_unit: "", delegation_date: "", description: "", request_id: "" });
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
        <PageHeader title="داشبورد و مدیریت اعتبارات" description="فرآیندهای موافقت‌نامه، درخواست وجه، تخصیص و ابلاغ اعتبار دستگاه" />
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
                <p className="text-xs text-amber-600 font-semibold">کل درخواست‌های وجه</p>
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
                <FileSpreadsheet className="h-4 w-4" /> درخواست وجه
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

  // ─── ۳. صفحه درخواست وجه ────────────────────────────────────────────────
  if (pathname === "/credits/requests") {
    if (allocations.length === 0) {
      return (
        <PageShell>
          <PageHeader title="درخواست وجه" description="ثبت و پیگیری تقاضای تخصیص و ابلاغ اعتبار توسط واحدهای سازمانی" />
          <Card dir="rtl" className="max-w-xl mx-auto mt-12 border-rose-100 bg-rose-50/50">
            <CardHeader className="text-right flex flex-row items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600 shrink-0">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <CardTitle className="text-sm font-bold text-rose-900">فرم درخواست وجه قفل است</CardTitle>
            </CardHeader>
            <CardContent className="text-right text-xs text-rose-800 space-y-4">
              <p>لطفاً ابتدا از بخش «تخصیص اعتبار»، حداقل یک تخصیص اعتبار ثبت کنید تا فرم درخواست وجه برای شما باز شود.</p>
              <Button onClick={() => navigate("/credits/allocation-no-doc")} className="bg-rose-600 hover:bg-rose-700 text-white text-xs h-8 px-4 rounded-lg">
                ورود به تخصیص اعتبار
              </Button>
            </CardContent>
          </Card>
        </PageShell>
      );
    }

    // گزینه‌های تخصیص اعتبار برای سلکت باکس
    const allocOptions = allocations
      .filter(al => !reqForm.fiscal_year || Number(al.fiscal_year) === Number(reqForm.fiscal_year))
      .map(al => {
        const referenceAgr = agreements.find(a => String(a._id) === String(al.agreement_id));
        const currentRequested = requests
          .filter(r => String(r.allocation_id) === String(al._id) && String(r._id) !== editingReq)
          .reduce((sum, r) => sum + (r.amount ?? 0), 0);
        const remaining = al.amount - currentRequested;
        return {
          value: String(al._id),
          label: `تخصیص: ${al.allocation_number || "نامشخص"} | بابت: ${referenceAgr?.title || "موافق‌نامه نامشخص"} | باقیمانده: ${fmtNum(remaining)} ریال`
        };
      });

    // گزینه‌های موافقت‌نامه برای سلکت باکس
    const agrOptions = agreements
      .filter(a => !reqForm.fiscal_year || Number(a.fiscal_year) === Number(reqForm.fiscal_year))
      .map(a => ({
        value: String(a._id),
        label: `${a.title} (کل مصوب: ${fmtNum(a.total_amount)} ریال)`
      }));

    if (showForm) {
      // FULL PAGE FORM VIEW
      return (
        <PageShell>
          <div className="bg-background rounded-2xl border shadow-sm overflow-hidden" dir="rtl">
            {/* Form Top Header */}
            <div className="bg-muted/30 px-6 py-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-amber-600 animate-pulse" />
                <h2 className="text-base font-bold text-foreground">درخواست وجه</h2>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => { setShowForm(false); setEditingReq(null); setReqForm(getInitialReqForm()); }}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Alert Message */}
            {alertMsg && (
              <div className={cn("m-4 p-4 rounded-xl border flex items-center gap-2 text-sm justify-between",
                alertMsg.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800")}>
                <div className="flex items-center gap-2">
                  {alertMsg.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                  <span>{alertMsg.text}</span>
                </div>
                <button onClick={() => setAlertMsg(null)}><X className="h-4 w-4" /></button>
              </div>
            )}

            <div className="p-6 space-y-6">
              {/* SECTION 1: اطلاعات اصلی */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                  <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                  <h3 className="text-sm font-bold text-blue-700">اطلاعات اصلی</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-right">
                  {/* Right Column of General Info */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 items-center gap-2">
                      <Label className="text-xs font-semibold text-muted-foreground">شماره درخواست :</Label>
                      <div className="col-span-2">
                        <Input 
                          value={reqForm.request_number} 
                          onChange={e => setReqForm({ ...reqForm, request_number: e.target.value })} 
                          placeholder="مثال: ۱۴۰۳/۰۳/۰۰۱۲ (یا خالی برای تولید خودکار)" 
                          className="h-9 text-xs" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 items-center gap-2">
                      <Label className="text-xs font-semibold text-muted-foreground">تاریخ درخواست <span className="text-rose-500">*</span> :</Label>
                      <div className="col-span-2">
                        <PersianDatePicker 
                          value={reqForm.request_date} 
                          onChange={e => setReqForm({ ...reqForm, request_date: e.target.value })} 
                          placeholder="۱۴۰۳/۰۳/۲۰" 
                          className="h-9 text-xs" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 items-center gap-2">
                      <Label className="text-xs font-semibold text-muted-foreground">واحد درخواست دهنده <span className="text-rose-500">*</span> :</Label>
                      <div className="col-span-2">
                        <SearchableSelect 
                          value={reqForm.requesting_unit} 
                          onChange={val => setReqForm({ ...reqForm, requesting_unit: val })} 
                          options={[
                            { value: "واحد مالی", label: "واحد مالی" },
                            { value: "اداره کل فناوری اطلاعات", label: "اداره کل فناوری اطلاعات" },
                            { value: "اداره کل عمران و بهسازی", label: "اداره کل عمران و بهسازی" },
                            { value: "معاونت پشتیبانی و توسعه منابع", label: "معاونت پشتیبانی و توسعه منابع" },
                          ]} 
                          placeholder="انتخاب واحد..." 
                          searchable={true} 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 items-center gap-2">
                      <Label className="text-xs font-semibold text-muted-foreground">درخواست دهنده <span className="text-rose-500">*</span> :</Label>
                      <div className="col-span-2">
                        <SearchableSelect 
                          value={reqForm.requester} 
                          onChange={val => setReqForm({ ...reqForm, requester: val })} 
                          options={[
                            { value: "علی محمدی", label: "علی محمدی" },
                            { value: "رضا علوی", label: "رضا علوی" },
                            { value: "مریم رضایی", label: "مریم رضایی" },
                          ]} 
                          placeholder="انتخاب درخواست دهنده..." 
                          searchable={true} 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 items-center gap-2">
                      <Label className="text-xs font-semibold text-muted-foreground">عنوان درخواست <span className="text-rose-500">*</span> :</Label>
                      <div className="col-span-2">
                        <Input 
                          value={reqForm.title} 
                          onChange={e => setReqForm({ ...reqForm, title: e.target.value })} 
                          placeholder="مثال: پرداخت هزینه خرید تجهیزات اداری" 
                          className="h-9 text-xs" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 items-start gap-2">
                      <Label className="text-xs font-semibold text-muted-foreground pt-2">شرح درخواست :</Label>
                      <div className="col-span-2">
                        <textarea 
                          value={reqForm.description} 
                          onChange={e => setReqForm({ ...reqForm, description: e.target.value })} 
                          placeholder="شرح کامل علت درخواست..." 
                          className="w-full min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Left Column of General Info */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 items-center gap-2">
                      <Label className="text-xs font-semibold text-muted-foreground">نوع درخواست :</Label>
                      <div className="col-span-2">
                        <SearchableSelect 
                          value={reqForm.request_type} 
                          onChange={val => setReqForm({ ...reqForm, request_type: val })} 
                          options={[
                            { value: "پرداخت", label: "پرداخت" },
                            { value: "پیش‌پرداخت", label: "پیش‌پرداخت" },
                            { value: "علی‌الحساب", label: "علی‌الحساب" },
                          ]} 
                          placeholder="نوع..." 
                          searchable={false} 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 items-center gap-2">
                      <Label className="text-xs font-semibold text-muted-foreground">وضعیت :</Label>
                      <div className="col-span-2">
                        <SearchableSelect 
                          value={reqForm.status} 
                          onChange={val => setReqForm({ ...reqForm, status: val })} 
                          options={[
                            { value: "pending", label: "در حال بررسی" },
                            { value: "approved", label: "تایید شده" },
                            { value: "rejected", label: "رد شده" },
                          ]} 
                          placeholder="وضعیت..." 
                          searchable={false} 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 items-center gap-2">
                      <Label className="text-xs font-semibold text-muted-foreground">اولویت :</Label>
                      <div className="col-span-2">
                        <SearchableSelect 
                          value={reqForm.priority} 
                          onChange={val => setReqForm({ ...reqForm, priority: val })} 
                          options={[
                            { value: "عادی", label: "عادی" },
                            { value: "فوری", label: "فوری" },
                            { value: "آنی", label: "آنی" },
                          ]} 
                          placeholder="اولویت..." 
                          searchable={false} 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 items-center gap-2">
                      <Label className="text-xs font-semibold text-muted-foreground">مبلغ درخواستی (ریال) :</Label>
                      <div className="col-span-2 relative">
                        <Input 
                          type="text"
                          value={fmtNum(reqForm.amount)} 
                          readOnly 
                          className="h-9 text-xs pl-8 font-mono bg-muted font-bold text-amber-800" 
                          dir="ltr"
                        />
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">ریال</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 items-center gap-2">
                      <Label className="text-xs font-semibold text-muted-foreground">ارز :</Label>
                      <div className="col-span-2">
                        <SearchableSelect 
                          value={reqForm.currency || "ریال"} 
                          onChange={val => setReqForm({ ...reqForm, currency: val })} 
                          options={[
                            { value: "ریال", label: "ریال" },
                            { value: "دلار", label: "دلار" },
                            { value: "یورو", label: "یورو" },
                          ]} 
                          placeholder="ارز..." 
                          searchable={false} 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 items-center gap-2">
                      <Label className="text-xs font-semibold text-muted-foreground">مبلغ به حروف :</Label>
                      <div className="col-span-2">
                        <Input 
                          value={reqForm.amount_in_words || "صفر ریال"} 
                          readOnly 
                          className="h-9 text-xs bg-muted text-amber-700 font-medium" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 items-center gap-2">
                      <Label className="text-xs font-semibold text-muted-foreground">پروژه :</Label>
                      <div className="col-span-2">
                        <SearchableSelect 
                          value={reqForm.project} 
                          onChange={val => setReqForm({ ...reqForm, project: val })} 
                          options={[
                            { value: "", label: "انتخاب کنید" },
                            { value: "پروژه خرید تجهیزات اداری و ملزومات", label: "پروژه خرید تجهیزات اداری و ملزومات" },
                            { value: "پروژه هوشمندسازی سیستم مالی", label: "پروژه هوشمندسازی سیستم مالی" },
                          ]} 
                          placeholder="انتخاب پروژه..." 
                          searchable={true} 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 items-center gap-2">
                      <Label className="text-xs font-semibold text-muted-foreground">سال مالی ارجاع :</Label>
                      <div className="col-span-2">
                        <SearchableSelect value={reqForm.fiscal_year} onChange={val => setReqForm({ ...reqForm, fiscal_year: val, agreement_id: "", allocation_id: "" })} options={fiscalYears} placeholder="سال..." searchable={false} />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 items-center gap-2">
                      <Label className="text-xs font-semibold text-muted-foreground">تخصیص اعتبار مرجع <span className="text-rose-500">*</span> :</Label>
                      <div className="col-span-2">
                        <SearchableSelect 
                          value={reqForm.allocation_id} 
                          onChange={val => {
                            const selectedAlloc = allocations.find(al => String(al._id) === String(val));
                            setReqForm({ 
                              ...reqForm, 
                              allocation_id: val, 
                              agreement_id: selectedAlloc ? String(selectedAlloc.agreement_id) : "" 
                            });
                          }} 
                          options={allocOptions} 
                          placeholder="انتخاب تخصیص اعتبار مرجع..." 
                          searchable={true} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: جزئیات پرداخت */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                  <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                  <h3 className="text-sm font-bold text-blue-700">جزئیات پرداخت</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-right">
                  {/* Right Column of Payment Details */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 items-center gap-2">
                      <Label className="text-xs font-semibold text-muted-foreground">نوع پرداخت :</Label>
                      <div className="col-span-2">
                        <SearchableSelect 
                          value={reqForm.payment_type} 
                          onChange={val => setReqForm({ ...reqForm, payment_type: val })} 
                          options={[
                            { value: "انتقال بانکی", label: "انتقال بانکی" },
                            { value: "چک", label: "چک" },
                            { value: "کارت به کارت", label: "کارت به کارت" },
                            { value: "نقدی / تنخواه", label: "نقدی / تنخواه" },
                          ]} 
                          placeholder="انتخاب نوع پرداخت..." 
                          searchable={false} 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 items-center gap-2">
                      <Label className="text-xs font-semibold text-muted-foreground">حساب پرداختی :</Label>
                      <div className="col-span-2">
                        <SearchableSelect 
                          value={reqForm.payment_account} 
                          onChange={val => setReqForm({ ...reqForm, payment_account: val })} 
                          options={[
                            { value: "بانک ملت - حساب جاری 12345678", label: "بانک ملت - حساب جاری 12345678" },
                            { value: "بانک ملی - حساب جاری 87654321", label: "بانک ملی - حساب جاری 87654321" },
                          ]} 
                          placeholder="انتخاب حساب بانکی..." 
                          searchable={true} 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 items-center gap-2">
                      <Label className="text-xs font-semibold text-muted-foreground">شماره شبا :</Label>
                      <div className="col-span-2">
                        <Input 
                          value={reqForm.iban} 
                          onChange={e => setReqForm({ ...reqForm, iban: e.target.value })} 
                          placeholder="IR12 0123 4567 8901 2345 6789 01" 
                          className="h-9 text-xs font-mono" 
                          dir="ltr"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 items-center gap-2">
                      <Label className="text-xs font-semibold text-muted-foreground">بانک مقصد :</Label>
                      <div className="col-span-2">
                        <SearchableSelect 
                          value={reqForm.destination_bank} 
                          onChange={val => setReqForm({ ...reqForm, destination_bank: val })} 
                          options={[
                            { value: "بانک سامان", label: "بانک سامان" },
                            { value: "بانک ملت", label: "بانک ملت" },
                            { value: "بانک ملی", label: "بانک ملی" },
                            { value: "بانک تجارت", label: "بانک تجارت" },
                          ]} 
                          placeholder="انتخاب بانک..." 
                          searchable={true} 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 items-center gap-2">
                      <Label className="text-xs font-semibold text-muted-foreground">شماره حساب مقصد :</Label>
                      <div className="col-span-2">
                        <Input 
                          value={reqForm.destination_account} 
                          onChange={e => setReqForm({ ...reqForm, destination_account: e.target.value })} 
                          placeholder="987654321098" 
                          className="h-9 text-xs font-mono" 
                          dir="ltr"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 items-center gap-2">
                      <Label className="text-xs font-semibold text-muted-foreground">شخص/شرکت دریافت کننده :</Label>
                      <div className="col-span-2">
                        <Input 
                          value={reqForm.recipient_name} 
                          onChange={e => setReqForm({ ...reqForm, recipient_name: e.target.value })} 
                          placeholder="شرکت نوین سیستم" 
                          className="h-9 text-xs" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 items-center gap-2">
                      <Label className="text-xs font-semibold text-muted-foreground">شناسه ملی / کد اقتصادی :</Label>
                      <div className="col-span-2">
                        <Input 
                          value={reqForm.national_id} 
                          onChange={e => setReqForm({ ...reqForm, national_id: e.target.value })} 
                          placeholder="12345678901" 
                          className="h-9 text-xs font-mono" 
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Left Column of Payment Details */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 items-center gap-2">
                      <Label className="text-xs font-semibold text-muted-foreground">موعد پرداخت :</Label>
                      <div className="col-span-2">
                        <PersianDatePicker 
                          value={reqForm.payment_due_date} 
                          onChange={e => setReqForm({ ...reqForm, payment_due_date: e.target.value })} 
                          placeholder="۱۴۰۳/۰۳/۲۵" 
                          className="h-9 text-xs" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 items-center gap-2">
                      <Label className="text-xs font-semibold text-muted-foreground">روش پرداخت :</Label>
                      <div className="col-span-2">
                        <SearchableSelect 
                          value={reqForm.payment_method} 
                          onChange={val => setReqForm({ ...reqForm, payment_method: val })} 
                          options={[
                            { value: "یک مرحله ای", label: "یک مرحله ای" },
                            { value: "چند مرحله ای", label: "چند مرحله ای" },
                          ]} 
                          placeholder="روش پرداخت..." 
                          searchable={false} 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 items-start gap-2">
                      <Label className="text-xs font-semibold text-muted-foreground pt-1.5">پیوست ها :</Label>
                      <div className="col-span-2 space-y-2">
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-muted/70 rounded-md border text-[11px] cursor-pointer transition-colors font-medium">
                            <Plus className="h-3.5 w-3.5" />
                            افزودن فایل
                            <input 
                              type="file" 
                              multiple 
                              onChange={handleFileChange} 
                              className="hidden" 
                            />
                          </label>
                        </div>

                        {reqForm.attachments && reqForm.attachments.length > 0 && (
                          <div className="space-y-1.5">
                            {reqForm.attachments.map((file, fileIdx) => (
                              <div key={fileIdx} className="flex items-center justify-between p-2 rounded-lg border bg-muted/20 text-xs gap-3">
                                <div className="flex items-center gap-1.5 truncate">
                                  <FileText className="h-4 w-4 text-red-500 shrink-0" />
                                  <span className="font-semibold text-foreground/80 truncate" title={file.name}>{file.name}</span>
                                  <span className="text-[10px] text-muted-foreground font-mono shrink-0">({file.size})</span>
                                </div>
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-5 w-5 text-rose-500 hover:text-rose-700" 
                                  onClick={() => removeAttachment(fileIdx)}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 items-start gap-2">
                      <Label className="text-xs font-semibold text-muted-foreground pt-2">توضیحات پرداخت :</Label>
                      <div className="col-span-2">
                        <textarea 
                          value={reqForm.payment_description} 
                          onChange={e => setReqForm({ ...reqForm, payment_description: e.target.value })} 
                          placeholder="لطفا در اسرع وقت اقدام شود." 
                          className="w-full min-h-[100px] rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: اقلام درخواست */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                    <h3 className="text-sm font-bold text-blue-700">اقلام درخواست</h3>
                  </div>
                  <Button type="button" size="sm" variant="outline" onClick={addItemRow} className="h-8 gap-1 text-xs border-dashed">
                    <Plus className="h-3.5 w-3.5" /> افزودن سطر جدید
                  </Button>
                </div>

                <div className="overflow-x-auto rounded-xl border">
                  <table className="w-full text-xs text-right border-collapse">
                    <thead>
                      <tr className="bg-muted/70 border-b font-bold text-muted-foreground text-center">
                        <th className="px-2 py-2 w-10">ردیف</th>
                        <th className="px-3 py-2 min-w-[200px] text-right">شرح کالا / خدمت <span className="text-rose-500">*</span></th>
                        <th className="px-2 py-2 w-24">کد کالا</th>
                        <th className="px-2 py-2 w-24">واحد</th>
                        <th className="px-3 py-2 w-36">مبلغ واحد (ریال) <span className="text-rose-500">*</span></th>
                        <th className="px-3 py-2 w-40">مبلغ کل (ریال)</th>
                        <th className="px-3 py-2 w-32">مرکز هزینه</th>
                        <th className="px-3 py-2 w-32">پروژه</th>
                        <th className="px-3 py-2 min-w-[150px]">شرح</th>
                        <th className="px-2 py-2 w-10">حذف</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reqForm.items.map((item, index) => (
                        <tr key={index} className="border-b hover:bg-muted/10 transition-colors">
                          <td className="px-2 py-2.5 text-center font-semibold text-muted-foreground">{index + 1}</td>
                          <td className="px-2 py-2">
                            <Input 
                              value={item.description_item} 
                              onChange={e => handleItemChange(index, "description_item", e.target.value)} 
                              placeholder="مثال: پرینتر لیزری HP 401dn"
                              required
                              className="h-8 text-xs bg-transparent"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <Input 
                              type="number"
                              value={item.code} 
                              onChange={e => handleItemChange(index, "code", Number(e.target.value))} 
                              className="h-8 text-xs text-center font-mono bg-transparent"
                              min="1"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <select
                              value={item.unit}
                              onChange={e => handleItemChange(index, "unit", e.target.value)}
                              className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                              <option value="دستگاه">دستگاه</option>
                              <option value="عدد">عدد</option>
                              <option value="بسته">بسته</option>
                              <option value="شاخه">شاخه</option>
                              <option value="متر">متر</option>
                              <option value="خدمت">خدمت</option>
                            </select>
                          </td>
                          <td className="px-2 py-2">
                            <Input 
                              type="number"
                              value={item.unit_price} 
                              onChange={e => handleItemChange(index, "unit_price", Number(e.target.value))} 
                              placeholder="مبلغ واحد..."
                              required
                              className="h-8 text-xs font-mono text-center bg-transparent"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <Input 
                              type="text"
                              value={fmtNum(item.total_price)} 
                              readOnly 
                              className="h-8 text-xs text-center font-mono font-bold bg-muted text-emerald-800"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <select
                              value={item.cost_center || "اداری و عمومی"}
                              onChange={e => handleItemChange(index, "cost_center", e.target.value)}
                              className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                              <option value="اداری و عمومی">اداری و عمومی</option>
                              <option value="پشتیبانی">پشتیبانی</option>
                              <option value="فناوری اطلاعات">فناوری اطلاعات</option>
                            </select>
                          </td>
                          <td className="px-2 py-2">
                            <Input 
                              value={item.project} 
                              onChange={e => handleItemChange(index, "project", e.target.value)} 
                              placeholder="پروژه..."
                              className="h-8 text-xs bg-transparent"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <Input 
                              value={item.description} 
                              onChange={e => handleItemChange(index, "description", e.target.value)} 
                              placeholder="توضیحات قلم..."
                              className="h-8 text-xs bg-transparent"
                            />
                          </td>
                          <td className="px-2 py-2 text-center">
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-rose-500 hover:text-rose-700 disabled:opacity-40" 
                              disabled={reqForm.items.length <= 1}
                              onClick={() => removeItemRow(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {/* Total row */}
                      <tr className="bg-muted/40 font-bold border-t">
                        <td colSpan={2} className="px-3 py-3 text-left">جمع کل :</td>
                        <td className="px-2 py-3 text-center font-mono">—</td>
                        <td className="px-2 py-3 text-center text-muted-foreground">—</td>
                        <td className="px-3 py-3 text-center text-muted-foreground">—</td>
                        <td className="px-3 py-3 text-center font-mono text-emerald-900 text-sm font-extrabold bg-emerald-50/50">
                          {fmtNum(reqForm.amount)} ریال
                        </td>
                        <td colSpan={4} className="px-3 py-3"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Form Bottom Buttons Actions */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t pt-6">
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" className="h-9 text-xs" onClick={() => { setShowForm(false); setEditingReq(null); setReqForm(getInitialReqForm()); }}>
                    بازگشت
                  </Button>
                  <Button type="submit" className="h-9 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
                    <Save className="h-4 w-4" /> ذخیره
                  </Button>
                  <Button type="button" className="h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5" onClick={handleSendForApproval}>
                    <CheckCircle2 className="h-4 w-4" /> ارسال برای تایید
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" className="h-9 text-xs gap-1.5" onClick={() => window.print()}>
                    <FileText className="h-4 w-4" /> چاپ
                  </Button>
                  <Button type="button" variant="outline" className="h-9 text-xs gap-1.5">
                    <SearchableSelect placeholder="پیش نمایش" searchable={false} options={[{ value: "1", label: "پیش نمایش فرم" }]} className="border-0 w-24 h-7" />
                  </Button>
                  <Button type="button" variant="outline" className="h-9 text-xs gap-1.5">
                    <RefreshCw className="h-4 w-4" /> سابقه گردش کار
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </PageShell>
      );
    }

    // LIST VIEW
    return (
      <PageShell>
        <PageHeader title="درخواست وجه" description="ثبت و پیگیری تقاضای تخصیص و ابلاغ اعتبار توسط واحدهای سازمانی" />
        
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

        <Card dir="rtl" className="w-full">
          <CardHeader className="text-right flex items-center justify-between flex-row">
            <CardTitle className="text-sm font-bold text-foreground">لیست درخواست‌های ثبت شده وجه</CardTitle>
            <div className="flex items-center gap-2">
              <Button onClick={() => { setShowForm(true); setEditingReq(null); setReqForm(getInitialReqForm()); }} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 text-xs font-semibold h-8 px-3 rounded-lg">
                <Plus className="h-4 w-4" /> ثبت درخواست وجه جدید
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={fetchData} disabled={loading}>
                <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead>
                  <tr className="bg-muted/50 border-b font-bold text-muted-foreground text-center">
                    <th className="px-3 py-3 text-right">شماره درخواست / واحد متقاضی / عنوان</th>
                    <th className="px-3 py-3 w-28">تاریخ درخواست</th>
                    <th className="px-3 py-3 w-24">سال مالی</th>
                    <th className="px-3 py-3 w-36">درخواست دهنده</th>
                    <th className="px-3 py-3 w-36">مبلغ درخواستی (ریال)</th>
                    <th className="px-3 py-3 w-28">وضعیت</th>
                    <th className="px-3 py-3 w-24">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted-foreground">
                        هیچ درخواست وجهی ثبت نشده است
                      </td>
                    </tr>
                  ) : (
                    requests.map((req) => {
                      return (
                        <tr key={req._id} className="border-b hover:bg-muted/30">
                          <td className="px-3 py-3.5 text-right">
                            <span className="font-semibold text-amber-700">{req.request_number}</span>
                            <div className="text-[10px] font-bold text-foreground mt-0.5">{req.requesting_unit}</div>
                            <div className="text-[10px] text-muted-foreground font-medium mt-0.5">موضوع: {req.title || req.description || "—"}</div>
                          </td>
                          <td className="px-3 py-3.5 text-center font-mono text-muted-foreground">{req.request_date || "—"}</td>
                          <td className="px-3 py-3.5 text-center font-mono">{req.fiscal_year}</td>
                          <td className="px-3 py-3.5 text-center">{req.requester || "—"}</td>
                          <td className="px-3 py-3.5 text-center font-mono font-bold text-amber-900">{fmtNum(req.amount)}</td>
                          <td className="px-3 py-3.5 text-center">
                            <Badge className={cn("text-[9px] font-bold text-white border-0 px-2 py-0.5",
                              req.status === "approved" && "bg-emerald-600",
                              req.status === "pending" && "bg-amber-500",
                              req.status === "rejected" && "bg-rose-600"
                            )}>
                              {req.status === "approved" ? "تایید شده" : req.status === "rejected" ? "رد شده" : "در انتظار"}
                            </Badge>
                          </td>
                          <td className="px-3 py-3.5 text-center">
                            <div className="flex gap-1.5 justify-center">
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-amber-600" onClick={() => {
                                setEditingReq(req._id);
                                setReqForm({
                                  fiscal_year: req.fiscal_year ? String(req.fiscal_year) : "1403",
                                  agreement_id: req.agreement_id ? String(req.agreement_id) : "",
                                  allocation_id: req.allocation_id ? String(req.allocation_id) : "",
                                  request_number: req.request_number ?? "",
                                  request_date: req.request_date ?? "",
                                  requesting_unit: req.requesting_unit ?? "واحد مالی",
                                  requester: req.requester ?? "علی محمدی",
                                  title: req.title ?? "",
                                  description: req.description ?? "",
                                  request_type: req.request_type ?? "پرداخت",
                                  status: req.status ?? "pending",
                                  priority: req.priority ?? "عادی",
                                  amount: req.amount ?? 0,
                                  amount_in_words: req.amount_in_words ?? "",
                                  project: req.project ?? "",
                                  cost_center: req.cost_center ?? "مرکز و عمومی",
                                  payment_type: req.payment_type ?? "انتقال بانکی",
                                  payment_due_date: req.payment_due_date ?? "",
                                  payment_account: req.payment_account ?? "",
                                  payment_method: req.payment_method ?? "یک مرحله ای",
                                  iban: req.iban ?? "",
                                  destination_bank: req.destination_bank ?? "",
                                  destination_account: req.destination_account ?? "",
                                  recipient_name: req.recipient_name ?? "",
                                  national_id: req.national_id ?? "",
                                  payment_description: req.payment_description ?? "",
                                  attachments: req.attachments ?? [],
                                  items: req.items && req.items.length > 0 ? req.items : [{
                                    description_item: "",
                                    code: 1,
                                    unit: "دستگاه",
                                    unit_price: 0,
                                    total_price: 0,
                                    cost_center: "اداری و عمومی",
                                    project: "",
                                    description: ""
                                  }]
                                });
                                setShowForm(true);
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
      </PageShell>
    );
  }

  // ─── ۴. صفحه تخصیص اعتبار ───────────────────────────────────────────────────
  if (pathname === "/credits/allocation-no-doc") {
    if (agreements.length === 0) {
      return (
        <PageShell>
          <PageHeader title="تخصیص بودجه و اعتبار" description="اختصاص مبالغ بودجه بر اساس موافقت‌نامه‌های مصوب" />
          <Card dir="rtl" className="max-w-xl mx-auto mt-12 border-rose-100 bg-rose-50/50">
            <CardHeader className="text-right flex flex-row items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-rose-5050/10 flex items-center justify-center text-rose-600 shrink-0">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <CardTitle className="text-sm font-bold text-rose-900">فرم تخصیص اعتبار قفل است</CardTitle>
            </CardHeader>
            <CardContent className="text-right text-xs text-rose-800 space-y-4">
              <p>لطفاً ابتدا از بخش «ثبت موافقت‌نامه»، حداقل یک موافقت‌نامه مالی ثبت کنید تا بتوانید اقدام به تخصیص اعتبار نمایید.</p>
              <Button onClick={() => navigate("/credits/agreements")} className="bg-rose-600 hover:bg-rose-700 text-white text-xs h-8 px-4 rounded-lg">
                ورود به ثبت موافقت‌نامه
              </Button>
            </CardContent>
          </Card>
        </PageShell>
      );
    }
    // گزینه‌های موافقت‌نامه برای سلکت باکس
    const agreementOptions = agreements
      .filter(a => !allocForm.fiscal_year || Number(a.fiscal_year) === Number(allocForm.fiscal_year))
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
    if (requests.length === 0) {
      return (
        <PageShell>
          <PageHeader title="ابلاغ اعتبار و انتقال بودجه" description="ابلاغ اعتبار مصوب به معاونت‌ها و ادارات تابعه" />
          <Card dir="rtl" className="max-w-xl mx-auto mt-12 border-rose-100 bg-rose-50/50">
            <CardHeader className="text-right flex flex-row items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600 shrink-0">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <CardTitle className="text-sm font-bold text-rose-900">فرم ابلاغ اعتبار قفل است</CardTitle>
            </CardHeader>
            <CardContent className="text-right text-xs text-rose-800 space-y-4">
              <p>لطفاً ابتدا از بخش «درخواست وجه»، حداقل یک درخواست ثبت کنید تا فرم ابلاغ اعتبار برای شما باز شود.</p>
              <Button onClick={() => navigate("/credits/requests")} className="bg-rose-600 hover:bg-rose-700 text-white text-xs h-8 px-4 rounded-lg">
                ورود به درخواست وجه
              </Button>
            </CardContent>
          </Card>
        </PageShell>
      );
    }

    // گزینه‌های درخواست وجه برای سلکت باکس
    const requestOptions = requests
      .filter(r => !delForm.fiscal_year || Number(r.fiscal_year) === Number(delForm.fiscal_year))
      .map(r => {
        const currentDelegated = delegations
          .filter(d => String(d.request_id) === String(r._id) && String(d._id) !== editingDel)
          .reduce((sum, d) => sum + (d.amount ?? 0), 0);
        const remaining = r.amount - currentDelegated;
        return {
          value: String(r._id),
          label: `درخواست: ${r.request_number || "نامشخص"} | واحد: ${r.requesting_unit} | باقیمانده: ${fmtNum(remaining)} ریال`
        };
      });

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
                    <SearchableSelect value={delForm.fiscal_year} onChange={val => setDelForm({ ...delForm, fiscal_year: val, request_id: "" })} options={fiscalYears} placeholder="سال..." searchable={false} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">تاریخ ابلاغ</Label>
                    <PersianDatePicker value={delForm.delegation_date} onChange={e => setDelForm({ ...delForm, delegation_date: e.target.value })} placeholder="۱۴۰۳/۰۴/۱۵" className="h-9 text-xs" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">درخواست وجه مرجع <span className="text-rose-500">*</span></Label>
                  <SearchableSelect 
                    value={delForm.request_id} 
                    onChange={val => {
                      const selectedReq = requests.find(r => String(r._id) === String(val));
                      if (selectedReq) {
                        const currentDelegated = delegations
                          .filter(d => String(d.request_id) === String(val) && String(d._id) !== editingDel)
                          .reduce((sum, d) => sum + (d.amount ?? 0), 0);
                        const remaining = selectedReq.amount - currentDelegated;
                        setDelForm({
                          ...delForm,
                          request_id: val,
                          amount: String(remaining),
                          to_unit: selectedReq.requesting_unit || "",
                          description: `ابلاغ اعتبار بابت درخواست وجه شماره ${selectedReq.request_number} - ${selectedReq.title || ""}`
                        });
                      } else {
                        setDelForm({ ...delForm, request_id: val });
                      }
                    }} 
                    options={requestOptions} 
                    placeholder="انتخاب درخواست وجه مرجع..." 
                    searchable={true} 
                  />
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
                                    delegation_date: del.delegation_date ?? "", description: del.description ?? "",
                                    request_id: del.request_id ?? ""
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
