import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Trash2, Edit, Save, RefreshCw, FileText, CheckCircle2, AlertCircle,
  Search, Filter, ArrowDown, Landmark, TrendingUp, ShieldCheck, Lock, Wallet,
  FileCheck, Send, RotateCcw, ChevronLeft, Eye, Activity, Paperclip, Upload
} from "lucide-react";
import { BUDGETARY_MOEIN_LIST, deriveBudgetCodesFromMoein, deriveMoeinFromChapterAndArticle } from "@/lib/budgetMoeinMapper";
import { PersianDatePicker } from "@/components/ui/persian-date-picker";
import api from "@/api";

function fmtNum(n) {
  if (n === 0 || n == null) return "۰";
  return Number(n).toLocaleString("fa-IR");
}

export default function BudgetModule() {
  const { pathname } = useLocation();
  const activeTab = pathname.includes("amendments")
    ? "amendments"
    : (pathname.includes("review") || pathname.includes("ledger") || pathname.includes("card"))
      ? "review"
      : "approved";

  const [agreements, setAgreements] = useState([]);
  const [amendments, setAmendments] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [fundingRequests, setFundingRequests] = useState([]);
  const [obligations, setObligations] = useState([]);
  const [realizations, setRealizations] = useState([]);
  const [remittances, setRemittances] = useState([]);
  const [paymentRequests, setPaymentRequests] = useState([]);

  const [loading, setLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // ردیف بودجه انتخابی و گام فعال در زنجیره مرور اعتبار
  const [selectedAgrId, setSelectedAgrId] = useState("");
  const [activeStep, setActiveStep] = useState("approved");

  // فرم ثبت/ویرایش بودجه مصوب (بدون داده پیش‌فرض موک)
  const [editingAgr, setEditingAgr] = useState(null);
  const [agrForm, setAgrForm] = useState({
    title: "",
    fiscal_year: "",
    notification_number: "",
    notification_date: "",
    notification_authority: "",
    organization: "",
    funding_source: "",
    budget_row: "",
    program_code: "",
    activity_code: "",
    project_code: "",
    chapter_code: "",
    article_code: "",
    cost_center: "",
    moein_code: "",
    moein_title: "",
    total_amount: "",
    description: "",
    status: "confirmed"
  });

  // فرم ثبت اصلاحیه بودجه
  const [editingAmd, setEditingAmd] = useState(null);
  const [amdForm, setAmdForm] = useState({
    agreement_id: "",
    fiscal_year: "1403",
    amendment_type: "increase",
    amount: "",
    source_program_code: "",
    target_program_code: "",
    description: "",
    status: "approved"
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [agrRes, amdRes, alcRes, fndRes, oblRes, rlzRes, remRes, reqRes] = await Promise.all([
        api.get("/api/credits/agreements"),
        api.get("/api/credits/budget/amendments"),
        api.get("/api/credits/allocations"),
        api.get("/api/credits/funding/requests"),
        api.get("/api/credits/obligations"),
        api.get("/api/credits/realizations"),
        api.get("/api/credits/payments/remittances"),
        api.get("/api/credits/requests")
      ]);
      const agrList = agrRes.data?.data || [];
      setAgreements(agrList);
      setAmendments(amdRes.data?.data || []);
      setAllocations(alcRes.data?.data || []);
      setFundingRequests(fndRes.data?.data || []);
      setObligations(oblRes.data?.data || []);
      setRealizations(rlzRes.data?.data || []);
      setRemittances(remRes.data?.data || []);
      setPaymentRequests(reqRes.data?.data || []);

      if (agrList.length > 0 && !selectedAgrId) {
        setSelectedAgrId(String(agrList[0]._id));
      }
    } catch (e) {
      setAlertMsg({ type: "error", text: "خطا در بارگذاری اطلاعات جامع اعتبارات" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pathname]);

  // مدیریت انتخاب فایل پیوست
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setAgrForm((prev) => ({
        ...prev,
        attachment_name: file.name,
        attachment_data: event.target?.result || ""
      }));
    };
    reader.readAsDataURL(file);
  };

  // تغییر وضعیت مستقیم از جدول (ذخیره موقت -> ارسال -> تایید -> قطعی)
  const handleStatusChange = async (agreementId, newStatus) => {
    try {
      setLoading(true);
      await api.put(`/api/credits/agreements/${agreementId}`, { status: newStatus });
      setAlertMsg({ type: "success", text: "وضعیت بودجه با موفقیت به‌روزرسانی شد" });
      fetchData();
    } catch (e) {
      setAlertMsg({ type: "error", text: "خطا در تغییر وضعیت بودجه" });
    } finally {
      setLoading(false);
    }
  };

  // ثبت یا ویرایش بودجه مصوب با اعمال ۷ کنترل و پشتیبانی از ۴ مرحله چرخه وضعیت
  const handleAgrSubmit = async (e, overrideStatus = null) => {
    if (e) e.preventDefault();
    const finalStatus = overrideStatus || agrForm.status || "draft";

    // کنترل ۱: سال مالی معتبر باشد
    const fy = Number(agrForm.fiscal_year);
    if (!fy || fy < 1390 || fy > 1450) {
      setAlertMsg({ type: "error", text: "کنترل ۱: سال مالی واردشده معتبر نمی‌باشد (باید بین ۱۳۹۰ تا ۱۴۵۰ باشد)" });
      return;
    }

    // کنترل ۲ & ۳: ردیف بودجه و ترکیب برنامه‌/فعالیت/فصل/ماده معتبر باشد
    if (!agrForm.title || !agrForm.program_code || !agrForm.chapter_code) {
      setAlertMsg({ type: "error", text: "کنترل ۲ و ۳: عنوان برنامه، کد برنامه، کد فعالیت، فصل و ماده الزامی است" });
      return;
    }

    // کنترل ۴: منبع تأمین اعتبار مشخص باشد
    if (!agrForm.funding_source) {
      setAlertMsg({ type: "error", text: "کنترل ۴: منبع تأمین اعتبار (عمومی، اختصاصی، تملک و...) باید مشخص باشد" });
      return;
    }

    // کنترل ۵: مبلغ منفی نباشد مگر در عملیات اصلاحی مجاز
    const amt = Number(agrForm.total_amount);
    if (isNaN(amt) || amt <= 0) {
      setAlertMsg({ type: "error", text: "کنترل ۵: مبلغ بودجه مصوب باید یک عدد مثبت باشد" });
      return;
    }

    // کنترل ۶: برای یک ابلاغ، ثبت تکراری انجام نشود
    if (agrForm.notification_number) {
      const isDuplicate = agreements.some(
        (a) => a.notification_number === agrForm.notification_number && String(a._id) !== String(editingAgr?._id)
      );
      if (isDuplicate) {
        setAlertMsg({ type: "error", text: `کنترل ۶: شماره ابلاغ «${agrForm.notification_number}» قبلاً ثبت شده است (جلوگیری از ثبت تکراری)` });
        return;
      }
    }

    // کنترل ۷: بعد از قطعی شدن، ویرایش مستقیم ممنوع است
    if (editingAgr && (editingAgr.status === "confirmed" || editingAgr.status === "allocated")) {
      setAlertMsg({ type: "error", text: "کنترل ۷: این بودجه مصوب «قطعی» شده است. ویرایش مستقیم ممنوع می‌باشد؛ لطفاً از «اصلاحیه بودجه» استفاده کنید." });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...agrForm,
        status: finalStatus,
        fiscal_year: fy,
        total_amount: amt
      };

      if (editingAgr) {
        await api.put(`/api/credits/agreements/${editingAgr._id}`, payload);
        setAlertMsg({ type: "success", text: "بودجه مصوب با موفقیت بروزرسانی شد" });
      } else {
        await api.post("/api/credits/agreements", payload);
        setAlertMsg({ type: "success", text: "بودجه مصوب با موفقیت ثبت گردید" });
      }
      setAgrForm({
        title: "",
        fiscal_year: "",
        notification_number: "",
        notification_date: "",
        notification_authority: "",
        organization: "",
        funding_source: "",
        budget_row: "",
        program_code: "",
        activity_code: "",
        project_code: "",
        chapter_code: "",
        article_code: "",
        cost_center: "",
        moein_code: "",
        moein_title: "",
        total_amount: "",
        description: "",
        status: "confirmed"
      });
      setEditingAgr(null);
      fetchData();
    } catch (e) {
      setAlertMsg({ type: "error", text: "خطا در ثبت اطلاعات بودجه مصوب" });
    } finally {
      setLoading(false);
    }
  };

  // ثبت اصلاحیه بودجه
  const handleAmdSubmit = async (e) => {
    e.preventDefault();
    if (!amdForm.agreement_id || !amdForm.amount) {
      setAlertMsg({ type: "error", text: "انتخاب موافقت‌نامه و مبلغ اصلاحیه الزامی است" });
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...amdForm,
        fiscal_year: Number(amdForm.fiscal_year),
        amount: Number(amdForm.amount)
      };
      await api.post("/api/credits/budget/amendments", payload);
      setAlertMsg({ type: "success", text: "اصلاحیه بودجه با موفقیت ثبت شد" });
      setAmdForm({
        agreement_id: "",
        fiscal_year: "1403",
        amendment_type: "increase",
        amount: "",
        source_program_code: "",
        target_program_code: "",
        description: "",
        status: "approved"
      });
      fetchData();
    } catch (e) {
      setAlertMsg({ type: "error", text: "خطا در ثبت اصلاحیه بودجه" });
    } finally {
      setLoading(false);
    }
  };

  const deleteAgr = async (id) => {
    if (!window.confirm("آیا از حذف این برنامه بودجه مصوب اطمینان دارید؟")) return;
    try {
      await api.delete(`/api/credits/agreements/${id}`);
      setAlertMsg({ type: "success", text: "مورد با موفقیت حذف شد" });
      fetchData();
    } catch (e) {
      setAlertMsg({ type: "error", text: "خطا در حذف مورد" });
    }
  };

  const deleteAmd = async (id) => {
    if (!window.confirm("آیا از حذف این اصلاحیه بودجه اطمینان دارید؟")) return;
    try {
      await api.delete(`/api/credits/budget/amendments/${id}`);
      setAlertMsg({ type: "success", text: "اصلاحیه با موفقیت حذف شد" });
      fetchData();
    } catch (e) {
      setAlertMsg({ type: "error", text: "خطا در حذف اصلاحیه" });
    }
  };

  // اطلاعات محاسباتی ردیف انتخابی
  const selectedAgr = agreements.find((a) => String(a._id) === String(selectedAgrId)) || agreements[0];
  const agrIdStr = selectedAgr ? String(selectedAgr._id) : "";

  const selectedAmds = selectedAgr ? amendments.filter((amd) => String(amd.agreement_id) === agrIdStr) : [];
  const selectedAllocs = selectedAgr ? allocations.filter((alc) => String(alc.agreement_id) === agrIdStr) : [];
  const selectedFundings = selectedAgr ? fundingRequests.filter((fnd) => String(fnd.agreement_id) === agrIdStr) : [];
  const selectedObligations = selectedAgr ? obligations.filter((obl) => String(obl.agreement_id) === agrIdStr || selectedFundings.some(f => String(f._id) === String(obl.funding_confirmation_id))) : obligations;
  const selectedRealizations = realizations.filter((rlz) => selectedObligations.some(o => String(o._id) === String(rlz.obligation_id))) || realizations;
  const selectedPayRequests = paymentRequests.filter((req) => String(req.agreement_id) === agrIdStr) || paymentRequests;
  const selectedRemittances = remittances.filter((rem) => rem.status === "paid" || rem.status === "issued") || remittances;
  const selectedPayments = remittances.filter((rem) => rem.status === "paid") || remittances;

  // محاسبات ۱۰ مرحله‌ای
  const valApproved = selectedAgr ? Number(selectedAgr.total_amount) || 0 : 0;
  const valAmendments = selectedAmds.reduce((sum, item) => {
    const amt = Number(item.amount) || 0;
    return item.amendment_type === "increase" ? sum + amt : item.amendment_type === "decrease" ? sum - amt : sum;
  }, 0);
  const valFinalCredit = valApproved + valAmendments;
  const valAllocations = selectedAllocs.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const valFunding = selectedFundings.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const valObligations = selectedObligations.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const valRealizations = selectedRealizations.reduce((sum, item) => sum + (Number(item.verified_amount) || 0), 0);
  const valPayRequests = selectedPayRequests.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const valRemittances = selectedRemittances.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const valPayments = selectedPayments.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const filteredAgreements = agreements.filter(
    (a) =>
      a.title?.includes(searchTerm) ||
      a.program_code?.includes(searchTerm) ||
      a.agreement_number?.includes(searchTerm)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {alertMsg && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between ${alertMsg.type === "error"
              ? "bg-destructive/10 text-destructive border border-destructive/20"
              : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
            }`}
        >
          <div className="flex items-center gap-2">
            {alertMsg.type === "error" ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            <span>{alertMsg.text}</span>
          </div>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setAlertMsg(null)}>
            ×
          </Button>
        </div>
      )}

      {/* ۱. زبانه بودجه مصوب */}
      {activeTab === "approved" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* فرم افزودن/ویرایش */}
          <Card className="lg:col-span-1 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                {editingAgr ? "ویرایش بودجه مصوب" : "ثبت بودجه مصوب جدید"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAgrSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">عنوان برنامه / ردیف بودجه</Label>
                  <Input
                    value={agrForm.title}
                    onChange={(e) => setAgrForm({ ...agrForm, title: e.target.value })}
                    placeholder="مثال: برنامه بهسازی ابنیه ستادی"
                    className="text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">سال مالی</Label>
                  <Input
                    value={agrForm.fiscal_year}
                    onChange={(e) => setAgrForm({ ...agrForm, fiscal_year: e.target.value })}
                    placeholder="مثال: ۱۴۰۵"
                    className="text-xs"
                    required
                  />
                </div>

                {/* شماره، تاریخ و مرجع ابلاغ */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">شماره ابلاغ</Label>
                    <Input
                      value={agrForm.notification_number}
                      onChange={(e) => setAgrForm({ ...agrForm, notification_number: e.target.value })}
                      placeholder="مثال: ابلاغ-۱۰۱"
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">تاریخ ابلاغ</Label>
                    <PersianDatePicker
                      value={agrForm.notification_date}
                      onChange={(e) => setAgrForm({ ...agrForm, notification_date: e.target.value })}
                      placeholder="۱۴۰۵/۰۱/۰۱"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">مرجع ابلاغ</Label>
                    <Input
                      value={agrForm.notification_authority}
                      onChange={(e) => setAgrForm({ ...agrForm, notification_authority: e.target.value })}
                      placeholder="مثال: سازمان برنامه و بودجه"
                      className="text-xs"
                    />
                  </div>
                </div>

                {/* دستگاه، منبع و ردیف بودجه */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">دستگاه اجرایی</Label>
                    <Input
                      value={agrForm.organization}
                      onChange={(e) => setAgrForm({ ...agrForm, organization: e.target.value })}
                      placeholder="مثال: دستگاه مرکزی / وزارتخانه"
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">منبع تأمین</Label>
                    <Input
                      value={agrForm.funding_source}
                      onChange={(e) => setAgrForm({ ...agrForm, funding_source: e.target.value })}
                      placeholder="مثال: منابع عمومی - ۱۱۰۰۰۰"
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">ردیف بودجه</Label>
                    <Input
                      value={agrForm.budget_row}
                      onChange={(e) => setAgrForm({ ...agrForm, budget_row: e.target.value })}
                      placeholder="مثال: ۱۲۳۴"
                      className="text-xs"
                    />
                  </div>
                </div>

                {/* انتخاب هوشمند کد معین بودجه‌ای مرتبط */}
                <div className="space-y-1.5 bg-primary/5 p-3 rounded-xl border border-primary/20">
                  <Label className="text-xs font-bold text-primary flex items-center justify-between">
                    <span>کد معین بودجه‌ای مرتبط (سناما)</span>
                    <span className="text-[10px] text-muted-foreground font-normal">مقداردهی هوشمند فصل و ماده</span>
                  </Label>
                  <select
                    value={agrForm.moein_code}
                    onChange={(e) => {
                      const code = e.target.value;
                      if (!code) {
                        setAgrForm({ ...agrForm, moein_code: "", moein_title: "" });
                        return;
                      }
                      const derived = deriveBudgetCodesFromMoein(code);
                      setAgrForm({
                        ...agrForm,
                        moein_code: derived.moein_code,
                        moein_title: derived.moein_title,
                        chapter_code: derived.chapter_code,
                        article_code: derived.article_code
                      });
                    }}
                    className="w-full bg-background border border-input rounded-lg px-2.5 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value="">-- انتخاب کد معین بودجه‌ای مرتبط --</option>
                    {BUDGETARY_MOEIN_LIST.map((m) => (
                      <option key={m.code} value={m.code}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">کد برنامه</Label>
                    <Input
                      value={agrForm.program_code}
                      onChange={(e) => setAgrForm({ ...agrForm, program_code: e.target.value })}
                      placeholder="مثال: ۱۰"
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">کد فعالیت</Label>
                    <Input
                      value={agrForm.activity_code}
                      onChange={(e) => setAgrForm({ ...agrForm, activity_code: e.target.value })}
                      placeholder="مثال: ۲۰"
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">طرح / پروژه</Label>
                    <Input
                      value={agrForm.project_code}
                      onChange={(e) => setAgrForm({ ...agrForm, project_code: e.target.value })}
                      placeholder="مثال: طرح توسعه"
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">کد فصل هزینه</Label>
                    <Input
                      value={agrForm.chapter_code}
                      onChange={(e) => {
                        const ch = e.target.value;
                        const derived = deriveMoeinFromChapterAndArticle(ch, agrForm.article_code, agrForm.program_code);
                        setAgrForm({
                          ...agrForm,
                          chapter_code: ch,
                          moein_code: derived.code,
                          moein_title: derived.title
                        });
                      }}
                      placeholder="مثال: ۰۲"
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">کد ماده / بند</Label>
                    <Input
                      value={agrForm.article_code}
                      onChange={(e) => {
                        const art = e.target.value;
                        const derived = deriveMoeinFromChapterAndArticle(agrForm.chapter_code, art, agrForm.program_code);
                        setAgrForm({
                          ...agrForm,
                          article_code: art,
                          moein_code: derived.code,
                          moein_title: derived.title
                        });
                      }}
                      placeholder="مثال: ۰۵"
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">مرکز هزینه</Label>
                    <Input
                      value={agrForm.cost_center}
                      onChange={(e) => setAgrForm({ ...agrForm, cost_center: e.target.value })}
                      placeholder="مثال: اداره کل امور مالی"
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">مبلغ مصوب (ریال)</Label>
                  <Input
                    type="number"
                    value={agrForm.total_amount}
                    onChange={(e) => setAgrForm({ ...agrForm, total_amount: e.target.value })}
                    placeholder="مبلغ را به ریال وارد کنید..."
                    className="text-xs font-mono"
                    required
                  />
                  {agrForm.total_amount > 0 && (
                    <span className="text-[10px] text-muted-foreground block">
                      {fmtNum(agrForm.total_amount)} ریال
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">توضیحات و مستندات قانونی</Label>
                  <Input
                    value={agrForm.description}
                    onChange={(e) => setAgrForm({ ...agrForm, description: e.target.value })}
                    placeholder="توضیحات، مصوبات هیئت وزیران یا ابلاغیه..."
                    className="text-xs"
                  />
                </div>

                {/* پیوست فایل ابلاغیه / مستندات قانونی */}
                <div className="space-y-1.5 bg-muted/40 p-3 rounded-xl border border-border/60">
                  <Label className="text-xs font-bold text-foreground flex items-center justify-between">
                    <span>پیوست تصویر / اسکن ابلاغیه بودجه</span>
                    {agrForm.attachment_name && (
                      <span className="text-[10px] text-emerald-600 font-bold font-mono dir-ltr">{agrForm.attachment_name}</span>
                    )}
                  </Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id="budget-attachment-input"
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={handleFileSelect}
                    />
                    <label
                      htmlFor="budget-attachment-input"
                      className="cursor-pointer bg-background border border-input hover:bg-muted/50 rounded-lg px-3 py-1.5 text-xs font-bold text-foreground flex items-center gap-2 shadow-xs transition-colors"
                    >
                      <Paperclip className="h-3.5 w-3.5 text-primary" />
                      {agrForm.attachment_name ? "تغییر فایل پیوست" : "انتخاب فایل (PDF / تصویر ابلاغیه)"}
                    </label>
                    {agrForm.attachment_name && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-rose-500 hover:text-rose-600"
                        onClick={() => setAgrForm({ ...agrForm, attachment_name: "", attachment_data: "" })}
                      >
                        حذف پیوست
                      </Button>
                    )}
                  </div>
                </div>

                {/* دکمه‌های گردش کار ۴ مرحله‌ای: ذخیره موقت -> ارسال برای تأیید -> تأیید -> قطعی */}
                <div className="space-y-2 pt-2 border-t border-border/60">
                  <div className="text-[11px] font-bold text-muted-foreground">چرخه وضعیت و عملیات ثبت:</div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={loading}
                      className="text-xs font-bold gap-1 border-amber-300 text-amber-700 hover:bg-amber-50"
                      onClick={(e) => handleAgrSubmit(e, "draft")}
                    >
                      <Save className="h-3.5 w-3.5" />
                      ذخیره موقت
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={loading}
                      className="text-xs font-bold gap-1 border-blue-300 text-blue-700 hover:bg-blue-50"
                      onClick={(e) => handleAgrSubmit(e, "pending_approval")}
                    >
                      <Send className="h-3.5 w-3.5" />
                      ارسال برای تأیید
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={loading}
                      className="text-xs font-bold gap-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                      onClick={(e) => handleAgrSubmit(e, "approved")}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      تأیید
                    </Button>

                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      disabled={loading}
                      className="text-xs font-bold gap-1 bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={(e) => handleAgrSubmit(e, "confirmed")}
                    >
                      <Lock className="h-3.5 w-3.5" />
                      ثبت قطعی
                    </Button>
                  </div>

                  {editingAgr && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs text-muted-foreground mt-1"
                      onClick={() => {
                        setEditingAgr(null);
                        setAgrForm({
                          title: "",
                          fiscal_year: "",
                          notification_number: "",
                          notification_date: "",
                          notification_authority: "",
                          organization: "",
                          funding_source: "",
                          budget_row: "",
                          program_code: "",
                          activity_code: "",
                          project_code: "",
                          chapter_code: "",
                          article_code: "",
                          cost_center: "",
                          moein_code: "",
                          moein_title: "",
                          total_amount: "",
                          description: "",
                          status: "confirmed"
                        });
                      }}
                    >
                      انصراف از ویرایش
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* جدول لیست بودجه‌های مصوب */}
          <Card className="lg:col-span-2 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-bold">لیست برنامه‌های بودجه مصوب</CardTitle>
              <Badge variant="outline" className="text-xs">{agreements.length} برنامه</Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-muted/50 border-y text-muted-foreground font-semibold whitespace-nowrap">
                    <tr>
                      <th className="p-3">شماره / عنوان برنامه</th>
                      <th className="p-3">کدها (برنامه/فصل/معین)</th>
                      <th className="p-3 text-center">سال</th>
                      <th className="p-3">مبلغ مصوب (ریال)</th>
                      <th className="p-3 text-center">پیوست</th>
                      <th className="p-3 text-center">وضعیت چرخه</th>
                      <th className="p-3 text-center min-w-[150px]">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {agreements.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-muted-foreground">
                          هیچ بودجه مصوبی ثبت نشده است.
                        </td>
                      </tr>
                    ) : (
                      agreements.map((item) => (
                        <tr key={item._id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 whitespace-nowrap">
                            <div className="font-bold text-foreground">{item.title}</div>
                            <div className="text-[10px] text-muted-foreground font-mono">شماره ابلاغ: {item.notification_number || item.agreement_number}</div>
                          </td>
                          <td className="p-3 font-mono text-[11px] whitespace-nowrap">
                            {item.program_code || "-"}/{item.chapter_code || "-"}/{item.article_code || "-"}
                            {item.moein_code && <div className="text-[9px] text-primary">{item.moein_code}</div>}
                          </td>
                          <td className="p-3 text-center whitespace-nowrap">{item.fiscal_year}</td>
                          <td className="p-3 font-bold text-primary whitespace-nowrap">{fmtNum(item.total_amount)}</td>
                          <td className="p-3 text-center whitespace-nowrap">
                            {item.attachment_name ? (
                              <a
                                href={item.attachment_data || "#"}
                                download={item.attachment_name}
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs transition-colors"
                                title="دانلود فایل پیوست ابلاغیه"
                              >
                                <Paperclip className="h-3 w-3 text-blue-600" />
                                پیوست
                              </a>
                            ) : (
                              <span className="text-muted-foreground text-[10px]">-</span>
                            )}
                          </td>
                          <td className="p-3 text-center whitespace-nowrap">
                            {item.status === "draft" && <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-[10px] px-2 py-0.5">ذخیره موقت</Badge>}
                            {item.status === "pending_approval" && <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 text-[10px] px-2 py-0.5">در انتظار تأیید</Badge>}
                            {item.status === "approved" && <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px] px-2 py-0.5">تأییدشده</Badge>}
                            {(item.status === "confirmed" || item.status === "allocated" || !item.status) && (
                              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300 text-[10px] px-2 py-0.5">🔒 قطعی</Badge>
                            )}
                          </td>
                          <td className="p-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                              {/* ۱. دکمه مرحله بعد چرخه وضعیت */}
                              {item.status === "draft" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-[10px] font-bold text-blue-700 border-blue-300 bg-blue-50 hover:bg-blue-100 px-2 rounded-lg gap-1"
                                  onClick={() => handleStatusChange(item._id, "pending_approval")}
                                  title="ارسال برای تأیید"
                                >
                                  <Send className="h-3 w-3" />
                                  ارسال
                                </Button>
                              )}
                              {item.status === "pending_approval" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-[10px] font-bold text-emerald-700 border-emerald-300 bg-emerald-50 hover:bg-emerald-100 px-2 rounded-lg gap-1"
                                  onClick={() => handleStatusChange(item._id, "approved")}
                                  title="تأیید بودجه"
                                >
                                  <CheckCircle2 className="h-3 w-3" />
                                  تأیید
                                </Button>
                              )}
                              {item.status === "approved" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-[10px] font-bold text-purple-700 border-purple-300 bg-purple-50 hover:bg-purple-100 px-2 rounded-lg gap-1"
                                  onClick={() => handleStatusChange(item._id, "confirmed")}
                                  title="قطعی‌سازی نهایی"
                                >
                                  <Lock className="h-3 w-3" />
                                  قطعی
                                </Button>
                              )}

                              {/* ۲. دکمه ویرایش (آیکون مشخص آبی) */}
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0 text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center justify-center transition-colors"
                                title="ویرایش بودجه"
                                onClick={() => {
                                  setEditingAgr(item);
                                  setAgrForm({
                                    title: item.title || "",
                                    fiscal_year: String(item.fiscal_year || ""),
                                    notification_number: item.notification_number || "",
                                    notification_date: item.notification_date || "",
                                    notification_authority: item.notification_authority || "",
                                    organization: item.organization || "",
                                    funding_source: item.funding_source || "",
                                    budget_row: item.budget_row || "",
                                    program_code: item.program_code || "",
                                    activity_code: item.activity_code || "",
                                    project_code: item.project_code || "",
                                    chapter_code: item.chapter_code || "",
                                    article_code: item.article_code || "",
                                    cost_center: item.cost_center || "",
                                    moein_code: item.moein_code || "",
                                    moein_title: item.moein_title || "",
                                    total_amount: String(item.total_amount || ""),
                                    attachment_name: item.attachment_name || "",
                                    attachment_data: item.attachment_data || "",
                                    description: item.description || "",
                                    status: item.status || "draft"
                                  });
                                }}
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>

                              {/* ۳. دکمه حذف (آیکون مشخص قرمز/رز) */}
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0 text-rose-600 border-rose-200 bg-rose-50 hover:bg-rose-100 rounded-lg flex items-center justify-center transition-colors"
                                title="حذف بودجه"
                                onClick={() => deleteAgr(item._id)}
                              >
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
      )}

      {/* ۲. زبانه اصلاحیه بودجه */}
      {activeTab === "amendments" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* فرم ثبت اصلاحیه */}
          <Card className="lg:col-span-1 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Edit className="h-4 w-4 text-emerald-600" />
                ثبت اصلاحیه و متمم بودجه
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAmdSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">انتخاب موافقت‌نامه / برنامه</Label>
                  <select
                    value={amdForm.agreement_id}
                    onChange={(e) => setAmdForm({ ...amdForm, agreement_id: e.target.value })}
                    className="w-full h-9 px-3 text-xs rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">انتخاب کنید...</option>
                    {agreements.map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.title} ({fmtNum(a.total_amount)} ریال)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">نوع اصلاحیه</Label>
                  <select
                    value={amdForm.amendment_type}
                    onChange={(e) => setAmdForm({ ...amdForm, amendment_type: e.target.value })}
                    className="w-full h-9 px-3 text-xs rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="increase">افزایش بودجه (+)</option>
                    <option value="decrease">کاهش بودجه (-)</option>
                    <option value="reallocation">جابجایی بین برنامه‌ها (اصلاحیه)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">مبلغ اصلاحیه (ریال)</Label>
                  <Input
                    type="number"
                    value={amdForm.amount}
                    onChange={(e) => setAmdForm({ ...amdForm, amount: e.target.value })}
                    placeholder="0"
                    className="text-xs font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">توضیحات و علت اصلاحیه</Label>
                  <Input
                    value={amdForm.description}
                    onChange={(e) => setAmdForm({ ...amdForm, description: e.target.value })}
                    placeholder="شماره مصوبه هیات امنا / شورای اداری..."
                    className="text-xs"
                  />
                </div>

                <Button type="submit" size="sm" className="w-full text-xs font-bold gap-2" disabled={loading}>
                  <Save className="h-4 w-4" />
                  ثبت اصلاحیه بودجه
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* جدول اصلاحیه‌های بودجه */}
          <Card className="lg:col-span-2 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-bold">لیست اصلاحیه‌های ثبت‌شده</CardTitle>
              <Badge variant="outline" className="text-xs">{amendments.length} اصلاحیه</Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-muted/50 border-y text-muted-foreground font-semibold">
                    <tr>
                      <th className="p-3">شماره اصلاحیه</th>
                      <th className="p-3">نوع</th>
                      <th className="p-3">مبلغ (ریال)</th>
                      <th className="p-3">توضیحات</th>
                      <th className="p-3 text-center">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {amendments.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-muted-foreground">
                          اصلاحیه بودجه‌ای ثبت نشده است.
                        </td>
                      </tr>
                    ) : (
                      amendments.map((item) => (
                        <tr key={item._id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-mono font-bold">{item.amendment_number}</td>
                          <td className="p-3">
                            <Badge
                              variant="outline"
                              className={
                                item.amendment_type === "increase"
                                  ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                  : item.amendment_type === "decrease"
                                    ? "bg-rose-50 text-rose-600 border-rose-200"
                                    : "bg-blue-50 text-blue-600 border-blue-200"
                              }
                            >
                              {item.amendment_type === "increase"
                                ? "افزایش"
                                : item.amendment_type === "decrease"
                                  ? "کاهش"
                                  : "جابجایی"}
                            </Badge>
                          </td>
                          <td className="p-3 font-bold">{fmtNum(item.amount)}</td>
                          <td className="p-3 text-muted-foreground">{item.description || "-"}</td>
                          <td className="p-3 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-rose-600"
                              onClick={() => deleteAmd(item._id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
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
      )}

      {/* ۳. زبانه مرور اعتبار (مرکز اصلی کار حسابدار - ۱۰ مرحله‌ای تعاملی) */}
      {activeTab === "review" && (
        <div className="space-y-6">
          {/* هدر انتخاب ردیف بودجه */}
          <Card className="bg-card/70 border-primary/20 shadow-sm">
            <CardContent className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                  <Landmark className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-foreground">مرکز اصلی مرور اعتبار و چرخه کامل مالی</h2>
                  <p className="text-xs text-muted-foreground">با کلیک روی هریک از ۱۰ مرحله زنجیره اعتبارات، اسناد و جزئیات دقیق همان مرحله باز می‌شود</p>
                </div>
              </div>

              {/* انتخاب‌گر ردیف بودجه */}
              <div className="w-full md:w-80 space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground block">انتخاب ردیف بودجه / برنامه:</label>
                <select
                  value={selectedAgrId}
                  onChange={(e) => setSelectedAgrId(e.target.value)}
                  className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-primary/30 bg-background focus:outline-none focus:ring-2 focus:ring-primary shadow-xs cursor-pointer"
                >
                  {agreements.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.title} ({a.program_code || "بدون کد"})
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* اگر ردیف انتخابی وجود داشته باشد، زنجیره ۱۰ مرحله‌ای نمایش داده می‌شود */}
          {selectedAgr ? (
            <div className="space-y-6">
              {/* زنجیره عمودی ۱۰ کارت محاسباتی با فلش‌های رو به پایین ↓ */}
              <div className="flex flex-col items-center gap-2.5 max-w-2xl mx-auto">
                {/* ۱. بودجه مصوب */}
                <div
                  onClick={() => setActiveStep("approved")}
                  className={`w-full cursor-pointer transition-all duration-200 rounded-2xl border p-4 shadow-sm ${activeStep === "approved"
                      ? "bg-primary/10 border-primary ring-2 ring-primary/40 shadow-md scale-[1.01]"
                      : "bg-card hover:bg-muted/40 border-border"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                        ۱
                      </div>
                      <div>
                        <span className="text-xs font-bold text-muted-foreground block">بودجه مصوب اولیه</span>
                        <h3 className="text-sm font-black text-foreground">{selectedAgr.title}</h3>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="text-base font-black text-primary font-mono">{fmtNum(valApproved)}</div>
                      <span className="text-[9px] font-semibold text-muted-foreground">ریال</span>
                    </div>
                  </div>
                </div>

                <div className="text-muted-foreground/60"><ArrowDown className="h-4 w-4" /></div>

                {/* ۲. اصلاحیه */}
                <div
                  onClick={() => setActiveStep("amendments")}
                  className={`w-full cursor-pointer transition-all duration-200 rounded-2xl border p-4 shadow-sm ${activeStep === "amendments"
                      ? "bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/40 shadow-md scale-[1.01]"
                      : "bg-card hover:bg-muted/40 border-border"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-amber-500/20 text-amber-600 flex items-center justify-center font-bold text-xs">
                        ۲
                      </div>
                      <div>
                        <span className="text-xs font-bold text-muted-foreground block">اصلاحیه (خالص افزایش/کاهش)</span>
                        <span className="text-[11px] font-semibold text-foreground">{selectedAmds.length} اصلاحیه ثبت‌شده</span>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className={`text-base font-black font-mono ${valAmendments >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {valAmendments >= 0 ? `+${fmtNum(valAmendments)}` : fmtNum(valAmendments)}
                      </div>
                      <span className="text-[9px] font-semibold text-muted-foreground">ریال</span>
                    </div>
                  </div>
                </div>

                <div className="text-muted-foreground/60"><ArrowDown className="h-4 w-4" /></div>

                {/* ۳. اعتبار نهایی */}
                <div
                  onClick={() => setActiveStep("final")}
                  className={`w-full cursor-pointer transition-all duration-200 rounded-2xl border p-4 shadow-sm ${activeStep === "final"
                      ? "bg-indigo-500/10 border-indigo-600 ring-2 ring-indigo-500/40 shadow-md scale-[1.01]"
                      : "bg-card hover:bg-muted/40 border-border"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-indigo-500/20 text-indigo-600 flex items-center justify-center font-bold text-xs">
                        ۳
                      </div>
                      <div>
                        <span className="text-xs font-bold text-indigo-700 block">اعتبار نهایی (سقف مصوب)</span>
                        <span className="text-[11px] font-semibold text-muted-foreground">بودجه اولیه + خالص اصلاحیه</span>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="text-lg font-black text-indigo-600 font-mono">{fmtNum(valFinalCredit)}</div>
                      <span className="text-[9px] font-semibold text-muted-foreground">ریال</span>
                    </div>
                  </div>
                </div>

                <div className="text-muted-foreground/60"><ArrowDown className="h-4 w-4" /></div>

                {/* ۴. تخصیص */}
                <div
                  onClick={() => setActiveStep("allocations")}
                  className={`w-full cursor-pointer transition-all duration-200 rounded-2xl border p-4 shadow-sm ${activeStep === "allocations"
                      ? "bg-blue-500/10 border-blue-500 ring-2 ring-blue-500/40 shadow-md scale-[1.01]"
                      : "bg-card hover:bg-muted/40 border-border"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-blue-500/20 text-blue-600 flex items-center justify-center font-bold text-xs">
                        ۴
                      </div>
                      <div>
                        <span className="text-xs font-bold text-muted-foreground block">تخصیص اعتبار</span>
                        <span className="text-[11px] font-semibold text-foreground">{selectedAllocs.length} نوبت تخصیص</span>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="text-base font-black text-blue-600 font-mono">{fmtNum(valAllocations)}</div>
                      <span className="text-[9px] font-semibold text-muted-foreground">ریال</span>
                    </div>
                  </div>
                </div>

                <div className="text-muted-foreground/60"><ArrowDown className="h-4 w-4" /></div>

                {/* ۵. تأمین اعتبار */}
                <div
                  onClick={() => setActiveStep("funding")}
                  className={`w-full cursor-pointer transition-all duration-200 rounded-2xl border p-4 shadow-sm ${activeStep === "funding"
                      ? "bg-amber-500/10 border-amber-600 ring-2 ring-amber-500/40 shadow-md scale-[1.01]"
                      : "bg-card hover:bg-muted/40 border-border"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-amber-500/20 text-amber-600 flex items-center justify-center font-bold text-xs">
                        ۵
                      </div>
                      <div>
                        <span className="text-xs font-bold text-muted-foreground block">تأمین اعتبار</span>
                        <span className="text-[11px] font-semibold text-foreground">{selectedFundings.length} گواهی رزرو</span>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="text-base font-black text-amber-600 font-mono">{fmtNum(valFunding)}</div>
                      <span className="text-[9px] font-semibold text-muted-foreground">ریال</span>
                    </div>
                  </div>
                </div>

                <div className="text-muted-foreground/60"><ArrowDown className="h-4 w-4" /></div>

                {/* ۶. تعهد */}
                <div
                  onClick={() => setActiveStep("obligations")}
                  className={`w-full cursor-pointer transition-all duration-200 rounded-2xl border p-4 shadow-sm ${activeStep === "obligations"
                      ? "bg-purple-500/10 border-purple-500 ring-2 ring-purple-500/40 shadow-md scale-[1.01]"
                      : "bg-card hover:bg-muted/40 border-border"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-purple-500/20 text-purple-600 flex items-center justify-center font-bold text-xs">
                        ۶
                      </div>
                      <div>
                        <span className="text-xs font-bold text-muted-foreground block">تعهد مالی</span>
                        <span className="text-[11px] font-semibold text-foreground">{selectedObligations.length} تعهد قطعی</span>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="text-base font-black text-purple-600 font-mono">{fmtNum(valObligations)}</div>
                      <span className="text-[9px] font-semibold text-muted-foreground">ریال</span>
                    </div>
                  </div>
                </div>

                <div className="text-muted-foreground/60"><ArrowDown className="h-4 w-4" /></div>

                {/* ۷. تحقق */}
                <div
                  onClick={() => setActiveStep("realizations")}
                  className={`w-full cursor-pointer transition-all duration-200 rounded-2xl border p-4 shadow-sm ${activeStep === "realizations"
                      ? "bg-indigo-500/10 border-indigo-600 ring-2 ring-indigo-500/40 shadow-md scale-[1.01]"
                      : "bg-card hover:bg-muted/40 border-border"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-indigo-500/20 text-indigo-600 flex items-center justify-center font-bold text-xs">
                        ۷
                      </div>
                      <div>
                        <span className="text-xs font-bold text-muted-foreground block">تحقق / تسجیل</span>
                        <span className="text-[11px] font-semibold text-foreground">{selectedRealizations.length} صورت وضعیت تاییدشده</span>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="text-base font-black text-indigo-600 font-mono">{fmtNum(valRealizations)}</div>
                      <span className="text-[9px] font-semibold text-muted-foreground">ریال</span>
                    </div>
                  </div>
                </div>

                <div className="text-muted-foreground/60"><ArrowDown className="h-4 w-4" /></div>

                {/* ۸. درخواست پرداخت */}
                <div
                  onClick={() => setActiveStep("paymentRequests")}
                  className={`w-full cursor-pointer transition-all duration-200 rounded-2xl border p-4 shadow-sm ${activeStep === "paymentRequests"
                      ? "bg-sky-500/10 border-sky-500 ring-2 ring-sky-500/40 shadow-md scale-[1.01]"
                      : "bg-card hover:bg-muted/40 border-border"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-sky-500/20 text-sky-600 flex items-center justify-center font-bold text-xs">
                        ۸
                      </div>
                      <div>
                        <span className="text-xs font-bold text-muted-foreground block">درخواست پرداخت</span>
                        <span className="text-[11px] font-semibold text-foreground">{selectedPayRequests.length} درخواست وجه</span>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="text-base font-black text-sky-600 font-mono">{fmtNum(valPayRequests)}</div>
                      <span className="text-[9px] font-semibold text-muted-foreground">ریال</span>
                    </div>
                  </div>
                </div>

                <div className="text-muted-foreground/60"><ArrowDown className="h-4 w-4" /></div>

                {/* ۹. حواله */}
                <div
                  onClick={() => setActiveStep("remittances")}
                  className={`w-full cursor-pointer transition-all duration-200 rounded-2xl border p-4 shadow-sm ${activeStep === "remittances"
                      ? "bg-teal-500/10 border-teal-500 ring-2 ring-teal-500/40 shadow-md scale-[1.01]"
                      : "bg-card hover:bg-muted/40 border-border"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-teal-500/20 text-teal-600 flex items-center justify-center font-bold text-xs">
                        ۹
                      </div>
                      <div>
                        <span className="text-xs font-bold text-muted-foreground block">حواله پرداخت</span>
                        <span className="text-[11px] font-semibold text-foreground">{selectedRemittances.length} حواله صادرشده</span>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="text-base font-black text-teal-600 font-mono">{fmtNum(valRemittances)}</div>
                      <span className="text-[9px] font-semibold text-muted-foreground">ریال</span>
                    </div>
                  </div>
                </div>

                <div className="text-muted-foreground/60"><ArrowDown className="h-4 w-4" /></div>

                {/* ۱۰. پرداخت */}
                <div
                  onClick={() => setActiveStep("payments")}
                  className={`w-full cursor-pointer transition-all duration-200 rounded-2xl border p-4 shadow-sm ${activeStep === "payments"
                      ? "bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/40 shadow-md scale-[1.01]"
                      : "bg-card hover:bg-muted/40 border-border"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-emerald-500/20 text-emerald-600 flex items-center justify-center font-bold text-xs">
                        ۱۰
                      </div>
                      <div>
                        <span className="text-xs font-bold text-muted-foreground block">پرداخت قطعی</span>
                        <span className="text-[11px] font-semibold text-foreground">{selectedPayments.length} تسویه بانکی</span>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="text-base font-black text-emerald-600 font-mono">{fmtNum(valPayments)}</div>
                      <span className="text-[9px] font-semibold text-muted-foreground">ریال</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* پنل بازشونده ریز جزئیات گام انتخاب‌شده (Detail Panel) */}
              <Card className="shadow-lg border-2 border-primary/20">
                <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Eye className="h-4 w-4 text-primary" />
                    جزئیات دقیق گام انتخاب‌شده: {
                      activeStep === "approved" ? "بودجه مصوب" :
                        activeStep === "amendments" ? "اصلاحیه بودجه" :
                          activeStep === "final" ? "اعتبار نهایی" :
                            activeStep === "allocations" ? "تخصیص اعتبار" :
                              activeStep === "funding" ? "تأمین اعتبار" :
                                activeStep === "obligations" ? "تعهدات مالی" :
                                  activeStep === "realizations" ? "تحقق / تسجیل" :
                                    activeStep === "paymentRequests" ? "درخواست پرداخت" :
                                      activeStep === "remittances" ? "حواله پرداخت" : "پرداخت قطعی"
                    }
                  </CardTitle>
                  <Badge variant="outline" className="text-xs font-mono">
                    ردیف: {selectedAgr.title}
                  </Badge>
                </CardHeader>
                <CardContent className="p-4">
                  {/* ۱. جزئیات بودجه مصوب */}
                  {activeStep === "approved" && (
                    <div className="space-y-3 text-xs">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-muted/40 rounded-xl">
                        <div><span className="text-muted-foreground">عنوان:</span> <strong className="block">{selectedAgr.title}</strong></div>
                        <div><span className="text-muted-foreground">کد برنامه:</span> <strong className="block font-mono">{selectedAgr.program_code || "-"}</strong></div>
                        <div><span className="text-muted-foreground">کد فصل:</span> <strong className="block font-mono">{selectedAgr.chapter_code || "-"}</strong></div>
                        <div><span className="text-muted-foreground">مبلغ مصوب:</span> <strong className="block text-primary font-mono">{fmtNum(selectedAgr.total_amount)} ریال</strong></div>
                      </div>
                      {selectedAgr.description && (
                        <p className="text-xs text-muted-foreground p-2 bg-background rounded-lg border">توضیحات: {selectedAgr.description}</p>
                      )}
                    </div>
                  )}

                  {/* ۲. جزئیات اصلاحیه‌ها */}
                  {activeStep === "amendments" && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-muted/50 font-semibold">
                          <tr>
                            <th className="p-2.5">شماره اصلاحیه</th>
                            <th className="p-2.5">نوع</th>
                            <th className="p-2.5">مبلغ (ریال)</th>
                            <th className="p-2.5">توضیحات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {selectedAmds.length === 0 ? (
                            <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">اصلاحیه‌ای برای این ردیف ثبت نشده است.</td></tr>
                          ) : (
                            selectedAmds.map((item) => (
                              <tr key={item._id}>
                                <td className="p-2.5 font-mono">{item.amendment_number}</td>
                                <td className="p-2.5">{item.amendment_type === "increase" ? "افزایش" : "کاهش"}</td>
                                <td className="p-2.5 font-bold font-mono">{fmtNum(item.amount)}</td>
                                <td className="p-2.5 text-muted-foreground">{item.description || "-"}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* ۳. جزئیات اعتبار نهایی */}
                  {activeStep === "final" && (
                    <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2 text-xs">
                      <div className="flex justify-between items-center"><span>بودجه مصوب اولیه:</span><span className="font-mono font-bold">{fmtNum(valApproved)} ریال</span></div>
                      <div className="flex justify-between items-center"><span>خالص اصلاحات و متمم:</span><span className="font-mono font-bold text-amber-600">{valAmendments >= 0 ? `+${fmtNum(valAmendments)}` : fmtNum(valAmendments)} ریال</span></div>
                      <hr />
                      <div className="flex justify-between items-center text-sm font-black text-indigo-700"><span>اعتبار نهایی قابل تخصیص:</span><span className="font-mono">{fmtNum(valFinalCredit)} ریال</span></div>
                    </div>
                  )}

                  {/* ۴. جزئیات تخصیص */}
                  {activeStep === "allocations" && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-muted/50 font-semibold">
                          <tr>
                            <th className="p-2.5">شماره تخصیص</th>
                            <th className="p-2.5">دوره</th>
                            <th className="p-2.5">مبلغ (ریال)</th>
                            <th className="p-2.5">وضعیت</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {selectedAllocs.length === 0 ? (
                            <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">تخصیص اعتباری ثبت نشده است.</td></tr>
                          ) : (
                            selectedAllocs.map((item) => (
                              <tr key={item._id}>
                                <td className="p-2.5 font-mono font-bold">{item.allocation_number}</td>
                                <td className="p-2.5">{item.period || "عمومی"}</td>
                                <td className="p-2.5 font-bold font-mono text-blue-600">{fmtNum(item.amount)}</td>
                                <td className="p-2.5"><Badge variant="outline" className="bg-blue-50 text-blue-600">تخصیص‌یافته</Badge></td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* ۵. جزئیات تأمین اعتبار */}
                  {activeStep === "funding" && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-muted/50 font-semibold">
                          <tr>
                            <th className="p-2.5">کد گواهی</th>
                            <th className="p-2.5">موضوع</th>
                            <th className="p-2.5">واحد متقاضی</th>
                            <th className="p-2.5">مبلغ (ریال)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {selectedFundings.length === 0 ? (
                            <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">گواهی تأمین اعتباری ثبت نشده است.</td></tr>
                          ) : (
                            selectedFundings.map((item) => (
                              <tr key={item._id}>
                                <td className="p-2.5 font-mono font-bold">{item.confirmation_code || item.request_number}</td>
                                <td className="p-2.5 font-semibold">{item.purpose}</td>
                                <td className="p-2.5">{item.requesting_unit}</td>
                                <td className="p-2.5 font-bold font-mono text-amber-600">{fmtNum(item.amount)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* ۶. جزئیات تعهدات */}
                  {activeStep === "obligations" && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-muted/50 font-semibold">
                          <tr>
                            <th className="p-2.5">شماره تعهد</th>
                            <th className="p-2.5">ذینفع / پیمانکار</th>
                            <th className="p-2.5">مبلغ تعهد</th>
                            <th className="p-2.5">آزادسازی‌شده</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {selectedObligations.length === 0 ? (
                            <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">تعهد مالی ثبت نشده است.</td></tr>
                          ) : (
                            selectedObligations.map((item) => (
                              <tr key={item._id}>
                                <td className="p-2.5 font-mono font-bold">{item.obligation_number}</td>
                                <td className="p-2.5 font-semibold">{item.beneficiary_name}</td>
                                <td className="p-2.5 font-bold font-mono text-purple-600">{fmtNum(item.amount)}</td>
                                <td className="p-2.5 text-muted-foreground">{fmtNum(item.released_amount || 0)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* ۷. جزئیات تحقق / تسجیل */}
                  {activeStep === "realizations" && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-muted/50 font-semibold">
                          <tr>
                            <th className="p-2.5">شماره تسجیل</th>
                            <th className="p-2.5">شماره فاکتور/صورت وضعیت</th>
                            <th className="p-2.5">مبلغ ابرازی</th>
                            <th className="p-2.5">مبلغ تاییدشده (ریال)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {selectedRealizations.length === 0 ? (
                            <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">مورد تحقق یا تسجیلی ثبت نشده است.</td></tr>
                          ) : (
                            selectedRealizations.map((item) => (
                              <tr key={item._id}>
                                <td className="p-2.5 font-mono font-bold">{item.realization_number}</td>
                                <td className="p-2.5 font-semibold">{item.bill_number || "-"}</td>
                                <td className="p-2.5 text-muted-foreground">{fmtNum(item.claimed_amount)}</td>
                                <td className="p-2.5 font-bold font-mono text-indigo-600">{fmtNum(item.verified_amount)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* ۸. جزئیات درخواست پرداخت */}
                  {activeStep === "paymentRequests" && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-muted/50 font-semibold">
                          <tr>
                            <th className="p-2.5">شماره درخواست</th>
                            <th className="p-2.5">عنوان / بابت</th>
                            <th className="p-2.5">مبلغ (ریال)</th>
                            <th className="p-2.5">وضعیت</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {selectedPayRequests.length === 0 ? (
                            <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">درخواست پرداختی ثبت نشده است.</td></tr>
                          ) : (
                            selectedPayRequests.map((item) => (
                              <tr key={item._id}>
                                <td className="p-2.5 font-mono font-bold">{item.request_number}</td>
                                <td className="p-2.5 font-semibold">{item.title || item.description}</td>
                                <td className="p-2.5 font-bold font-mono text-sky-600">{fmtNum(item.amount)}</td>
                                <td className="p-2.5"><Badge variant="outline" className="bg-sky-50 text-sky-700">{item.status}</Badge></td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* ۹. جزئیات حواله */}
                  {activeStep === "remittances" && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-muted/50 font-semibold">
                          <tr>
                            <th className="p-2.5">شماره حواله</th>
                            <th className="p-2.5">دریافت‌کننده</th>
                            <th className="p-2.5">مبلغ حواله (ریال)</th>
                            <th className="p-2.5">وضعیت</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {selectedRemittances.length === 0 ? (
                            <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">حواله‌ای صادر نشده است.</td></tr>
                          ) : (
                            selectedRemittances.map((item) => (
                              <tr key={item._id}>
                                <td className="p-2.5 font-mono font-bold">{item.remittance_number}</td>
                                <td className="p-2.5 font-semibold">{item.recipient_name}</td>
                                <td className="p-2.5 font-bold font-mono text-teal-600">{fmtNum(item.amount)}</td>
                                <td className="p-2.5"><Badge variant="outline" className="bg-teal-50 text-teal-700">{item.status}</Badge></td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* ۱۰. جزئیات پرداخت قطعی */}
                  {activeStep === "payments" && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-muted/50 font-semibold">
                          <tr>
                            <th className="p-2.5">شماره پرداخت / حواله</th>
                            <th className="p-2.5">دریافت‌کننده</th>
                            <th className="p-2.5">مبلغ پرداخت‌نشده/پرداخت‌باقی‌مانده</th>
                            <th className="p-2.5">مبلغ پرداخت قطعی (ریال)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {selectedPayments.length === 0 ? (
                            <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">پرداخت قطعی ثبت نشده است.</td></tr>
                          ) : (
                            selectedPayments.map((item) => (
                              <tr key={item._id}>
                                <td className="p-2.5 font-mono font-bold">{item.remittance_number}</td>
                                <td className="p-2.5 font-semibold">{item.recipient_name}</td>
                                <td className="p-2.5 text-muted-foreground">{item.iban || "-"}</td>
                                <td className="p-2.5 font-bold font-mono text-emerald-600">{fmtNum(item.amount)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                هیچ ردیف بودجه‌ای انتخاب نشده است.
              </CardContent>
            </Card>
          )}

          {/* جدول تجمیعی کلیه ردیف‌های بودجه */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary" />
                جدول تجمیعی کلیه ردیف‌های بودجه
              </CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="جستجو در عنوان..."
                  className="pr-8 text-xs h-8"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-muted/50 border-y text-muted-foreground font-semibold">
                    <tr>
                      <th className="p-3">ردیف بودجه</th>
                      <th className="p-3">بودجه مصوب اولیه</th>
                      <th className="p-3">اصلاحیه (خالص)</th>
                      <th className="p-3">اعتبار نهایی</th>
                      <th className="p-3">تخصیص</th>
                      <th className="p-3 text-center">انتخاب جهت مرور</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredAgreements.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-muted-foreground">
                          موردی یافت نشد.
                        </td>
                      </tr>
                    ) : (
                      filteredAgreements.map((a) => {
                        const amdList = amendments.filter((amd) => String(amd.agreement_id) === String(a._id));
                        const netAmd = amdList.reduce((sum, item) => {
                          const amt = Number(item.amount) || 0;
                          return item.amendment_type === "increase" ? sum + amt : item.amendment_type === "decrease" ? sum - amt : sum;
                        }, 0);
                        const finalBudget = (a.total_amount || 0) + netAmd;
                        const relAllocs = allocations.filter((alc) => String(alc.agreement_id) === String(a._id));
                        const allocAmt = relAllocs.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

                        return (
                          <tr key={a._id} className={`hover:bg-muted/30 transition-colors ${String(a._id) === String(selectedAgrId) ? "bg-primary/5 font-bold" : ""}`}>
                            <td className="p-3">
                              <div>{a.title}</div>
                              <span className="text-[10px] font-mono text-muted-foreground">{a.program_code || "-"}</span>
                            </td>
                            <td className="p-3 font-mono">{fmtNum(a.total_amount)}</td>
                            <td className={`p-3 font-mono ${netAmd >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                              {netAmd >= 0 ? `+${fmtNum(netAmd)}` : fmtNum(netAmd)}
                            </td>
                            <td className="p-3 font-black text-indigo-600 font-mono">{fmtNum(finalBudget)}</td>
                            <td className="p-3 font-bold text-blue-600 font-mono">{fmtNum(allocAmt)}</td>
                            <td className="p-3 text-center">
                              <Button
                                size="sm"
                                variant={String(a._id) === String(selectedAgrId) ? "default" : "outline"}
                                className="text-xs h-7"
                                onClick={() => {
                                  setSelectedAgrId(String(a._id));
                                  setActiveStep("approved");
                                }}
                              >
                                مرور زنجیره
                              </Button>
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
      )}
    </div>
  );
}
