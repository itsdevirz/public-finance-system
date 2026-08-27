import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Trash2, Edit, Save, CheckCircle2, AlertCircle, RefreshCw, Lock, Unlock, Search,
  Landmark, ArrowDown, Eye, Filter, FileText, Upload, Paperclip, ShieldAlert
} from "lucide-react";
import { PersianDatePicker } from "@/components/ui/persian-date-picker";
import api from "@/api";

function fmtNum(n) {
  if (n === 0 || n == null) return "۰";
  return Number(n).toLocaleString("fa-IR");
}

export default function ObligationModule() {
  const { pathname } = useLocation();
  const activeTab = pathname.includes("edit")
    ? "edit"
    : pathname.includes("release")
    ? "release"
    : pathname.includes("review")
    ? "review"
    : "create";

  const [obligations, setObligations] = useState([]);
  const [fundingRequests, setFundingRequests] = useState([]);
  const [agreements, setAgreements] = useState([]);
  const [amendments, setAmendments] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [realizations, setRealizations] = useState([]);
  const [remittances, setRemittances] = useState([]);
  const [paymentRequests, setPaymentRequests] = useState([]);

  const [loading, setLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedAgrId, setSelectedAgrId] = useState("");
  const [activeStep, setActiveStep] = useState("approved");

  const [editingOb, setEditingOb] = useState(null);
  const [form, setForm] = useState({
    funding_confirmation_id: "",
    agreement_id: "",
    obligation_number: "",
    obligation_date: new Date().toLocaleDateString("fa-IR"),
    beneficiary_name: "",
    contract_number: "",
    contract_amount: "",
    amount: "",
    fiscal_year: "1403",
    description: "",
    attachment_name: "",
    attachment_data: "",
    status: "active"
  });

  const [releaseModal, setReleaseModal] = useState(null);
  const [releaseAmount, setReleaseAmount] = useState("");
  const [releaseDate, setReleaseDate] = useState(new Date().toLocaleDateString("fa-IR"));
  const [releaseReason, setReleaseReason] = useState("");
  const [deleteWarningModal, setDeleteWarningModal] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [obRes, fRes, agRes, amdRes, alRes, rlzRes, remRes, reqRes] = await Promise.all([
        api.get("/api/credits/obligations"),
        api.get("/api/credits/funding/requests"),
        api.get("/api/credits/agreements"),
        api.get("/api/credits/budget/amendments"),
        api.get("/api/credits/allocations"),
        api.get("/api/credits/realizations"),
        api.get("/api/credits/payments/remittances"),
        api.get("/api/credits/requests")
      ]);
      const agList = agRes.data?.data || [];
      setObligations(obRes.data?.data || []);
      setFundingRequests(fRes.data?.data || []);
      setAgreements(agList);
      setAmendments(amdRes.data?.data || []);
      setAllocations(alRes.data?.data || []);
      setRealizations(rlzRes.data?.data || []);
      setRemittances(remRes.data?.data || []);
      setPaymentRequests(reqRes.data?.data || []);

      if (agList.length > 0 && !selectedAgrId) {
        setSelectedAgrId(String(agList[0]._id));
      }
    } catch (e) {
      setAlertMsg({ type: "error", text: "خطا در دریافت لیست تعهدات مالی" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pathname]);

  // انتخاب گواهی تأمین اعتبار و محاسبه شناسنامه و سقف تعهد
  const selectedFunding = fundingRequests.find(f => String(f._id) === String(form.funding_confirmation_id));
  const selectedFundingAgr = selectedFunding 
    ? agreements.find(a => String(a._id) === String(selectedFunding.agreement_id))
    : agreements.find(a => String(a._id) === String(form.agreement_id));

  // محاسبات شناسنامه و سقف تعهد برای گواهی انتخابی
  const fundingTotalAmount = selectedFunding ? (Number(selectedFunding.amount) || 0) : 0;
  const previousObligations = selectedFunding 
    ? obligations
        .filter(o => String(o.funding_confirmation_id) === String(selectedFunding._id) && String(o._id) !== String(editingOb?._id))
        .reduce((sum, o) => sum + (Number(o.amount) || 0) - (Number(o.released_amount) || 0), 0)
    : 0;
  const availableCommitmentAmount = Math.max(0, fundingTotalAmount - previousObligations);

  // آپلود فایل پیوست
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setForm(prev => ({
        ...prev,
        attachment_name: file.name,
        attachment_data: event.target.result
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleFundingChange = (fId) => {
    const found = fundingRequests.find(f => String(f._id) === String(fId));
    if (found) {
      const agr = agreements.find(a => String(a._id) === String(found.agreement_id));
      setForm(prev => ({
        ...prev,
        funding_confirmation_id: fId,
        agreement_id: found.agreement_id ? String(found.agreement_id) : "",
        fiscal_year: String(found.fiscal_year || agr?.fiscal_year || 1403),
        contract_number: found.contract_number || prev.contract_number,
        description: found.purpose ? `تعهد بر اساس گواهی تأمین اعتبار: ${found.purpose}` : prev.description
      }));
    } else {
      setForm(prev => ({ ...prev, funding_confirmation_id: fId }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.beneficiary_name || !form.amount) {
      setAlertMsg({ type: "error", text: "نام طرف حساب/ذینفع و مبلغ تعهد الزامی است" });
      return;
    }

    const commitmentAmt = Number(form.amount) || 0;
    if (selectedFunding && commitmentAmt > availableCommitmentAmount) {
      setAlertMsg({
        type: "error",
        text: `خطای کنترل اعتبار: مبلغ تعهد (${fmtNum(commitmentAmt)} ریال) بیشتر از سقف مانده قابل تعهد (${fmtNum(availableCommitmentAmount)} ریال) است.`
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        fiscal_year: Number(form.fiscal_year || 1403),
        contract_amount: Number(form.contract_amount || 0),
        amount: commitmentAmt,
        obligation_number: form.obligation_number || `OBL-${form.fiscal_year || 1403}-${Date.now().toString().slice(-6)}`
      };

      if (editingOb) {
        await api.put(`/api/credits/obligations/${editingOb._id}`, payload);
        setAlertMsg({ type: "success", text: "تعهد مالی با موفقیت اصلاح گردید" });
      } else {
        await api.post("/api/credits/obligations", payload);
        setAlertMsg({ type: "success", text: "تعهد مالی قطعی با موفقیت در سیستم ثبت گردید" });
      }

      setForm({
        funding_confirmation_id: "",
        agreement_id: "",
        obligation_number: "",
        obligation_date: new Date().toLocaleDateString("fa-IR"),
        beneficiary_name: "",
        contract_number: "",
        contract_amount: "",
        amount: "",
        fiscal_year: "1403",
        description: "",
        attachment_name: "",
        attachment_data: "",
        status: "active"
      });
      setEditingOb(null);
      fetchData();
    } catch (e) {
      setAlertMsg({ type: "error", text: "خطا در عملیات ثبت تعهد" });
    } finally {
      setLoading(false);
    }
  };

  // کنترل ممانعت از حذف مستقیم تعهد قطعی
  const handleDeleteAttempt = (item) => {
    if (item.status === "active" || item.status === "confirmed" || (Number(item.amount) || 0) > 0) {
      setDeleteWarningModal(item);
      return;
    }
    deleteOb(item._id);
  };

  const deleteOb = async (id) => {
    try {
      await api.delete(`/api/credits/obligations/${id}`);
      setAlertMsg({ type: "success", text: "تعهد پیش‌نویس حذف گردید" });
      fetchData();
    } catch (e) {
      setAlertMsg({ type: "error", text: "خطا در حذف تعهد" });
    }
  };

  // ثبت آزادسازی یا کاهش تعهد همراه با حفظ سوابق تعهد اولیه و آزادسازی
  const handleRelease = async () => {
    if (!releaseModal || !releaseAmount) return;
    const relAmt = Number(releaseAmount) || 0;
    const currentInitial = Number(releaseModal.amount) || 0;
    const currentReleased = Number(releaseModal.released_amount) || 0;

    if (relAmt <= 0) {
      setAlertMsg({ type: "error", text: "مبلغ آزادسازی باید بزرگتر از صفر باشد" });
      return;
    }
    if (relAmt > (currentInitial - currentReleased)) {
      setAlertMsg({ type: "error", text: "مبلغ آزادسازی نمی‌تواند از مانده تعهد قطعی بیشتر باشد" });
      return;
    }

    try {
      await api.post(`/api/credits/obligations/${releaseModal._id}/release`, {
        release_amount: relAmt,
        release_date: releaseDate,
        release_reason: releaseReason
      });
      setAlertMsg({ type: "success", text: `آزادسازی تعهد به مبلغ ${fmtNum(relAmt)} ریال با موفقیت در سوابق ثبت شد.` });
      setReleaseModal(null);
      setReleaseAmount("");
      setReleaseReason("");
      fetchData();
    } catch (e) {
      setAlertMsg({ type: "error", text: "خطا در ثبت آزادسازی تعهد" });
    }
  };

  // محاسبات ردیف انتخابی در مرور تعهدات
  const selectedAgr = agreements.find((a) => String(a._id) === String(selectedAgrId)) || agreements[0];
  const agrIdStr = selectedAgr ? String(selectedAgr._id) : "";

  const selectedAmds = selectedAgr ? amendments.filter((amd) => String(amd.agreement_id) === agrIdStr) : [];
  const selectedAllocs = selectedAgr ? allocations.filter((alc) => String(alc.agreement_id) === agrIdStr) : [];
  const selectedFundings = selectedAgr ? fundingRequests.filter((fnd) => String(fnd.agreement_id) === agrIdStr) : [];
  const selectedObligations = selectedAgr ? obligations.filter((obl) => String(obl.agreement_id) === agrIdStr || selectedFundings.some(f => String(f._id) === String(obl.funding_confirmation_id))) : obligations;
  const selectedRealizations = realizations.filter((rlz) => selectedObligations.some(o => String(o._id) === String(rlz.obligation_id))) || realizations;
  const selectedPayRequests = paymentRequests.filter((req) => String(req.agreement_id) === agrIdStr) || paymentRequests;
  const selectedRemittances = remittances.filter((rem) => rem.status === "paid" || rem.status === "issued") || remittances;

  // محاسبات سقف‌های اعتباری
  const valApproved = selectedAgr ? Number(selectedAgr.total_amount) || 0 : 0;
  const valAmendments = selectedAmds.reduce((sum, item) => {
    const amt = Number(item.amount) || 0;
    return item.amendment_type === "increase" ? sum + amt : item.amendment_type === "decrease" ? sum - amt : sum;
  }, 0);
  const valFinalCredit = valApproved + valAmendments;
  const valAllocations = selectedAllocs.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const valFunding = selectedFundings.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const valObligations = selectedObligations.reduce((sum, item) => sum + (Number(item.amount) || 0) - (Number(item.released_amount) || 0), 0);
  const valRealizations = selectedRealizations.reduce((sum, item) => sum + (Number(item.verified_amount) || 0), 0);
  const valPayRequests = selectedPayRequests.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const valRemittances = selectedRemittances.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {alertMsg && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-xs font-bold ${
            alertMsg.type === "error"
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

      {/* ۱. ایجاد تعهد / ۲. اصلاح تعهد / ۳. آزادسازی */}
      {(activeTab === "create" || activeTab === "edit" || activeTab === "release") && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 shadow-sm border-purple-500/20">
            <CardHeader className="bg-purple-500/5 border-b border-purple-500/10 py-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-purple-800 dark:text-purple-300">
                <Lock className="h-4 w-4 text-purple-600" />
                {editingOb ? "اصلاح تعهد مالی" : "ثبت تعهد مالی جدید (مرحله ۱۰)"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* گام ۱: انتخاب گواهی تأمین اعتبار */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">۱. انتخاب گواهی تأمین اعتبار (رزرو تخصیص)</Label>
                  <select
                    value={form.funding_confirmation_id}
                    onChange={(e) => handleFundingChange(e.target.value)}
                    className="w-full h-9 px-3 text-xs font-semibold rounded-lg border border-purple-500/30 bg-background focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                  >
                    <option value="">انتخاب از لیست تأمین اعتبارها...</option>
                    {fundingRequests.map((f) => (
                      <option key={f._id} value={f._id}>
                        گواهی {f.confirmation_code || f.request_number} — {f.purpose} ({fmtNum(f.amount)} ریال)
                      </option>
                    ))}
                  </select>
                </div>

                {/* نمایش درخت شناسنامه اعتبار تا مبلغ قابل تعهد */}
                {selectedFunding && (
                  <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-2.5 text-xs animate-in fade-in">
                    <div className="font-bold text-purple-900 dark:text-purple-200 border-b border-purple-500/20 pb-1.5 flex items-center gap-1.5">
                      <Landmark className="h-4 w-4 text-purple-600" />
                      شناسنامه اعتبار: {selectedFundingAgr?.title || "ردیف بودجه"}
                    </div>
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex justify-between text-muted-foreground">
                        <span>برنامه / فعالیت:</span>
                        <span className="font-mono font-bold text-foreground">{selectedFundingAgr?.program_code || "۱۰"} / {selectedFundingAgr?.activity_code || "۲۰"}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>فصل / ماده / معین:</span>
                        <span className="font-mono font-bold text-foreground">{selectedFundingAgr?.chapter_code || "۰۲"} / {selectedFundingAgr?.moein_code || "۵۱۰۱"}</span>
                      </div>
                      <div className="flex justify-between text-amber-700 dark:text-amber-400 font-bold border-t border-purple-500/10 pt-1">
                        <span>🛡️ مبلغ تأمین اعتبار:</span>
                        <span className="font-mono">{fmtNum(fundingTotalAmount)} ریال</span>
                      </div>
                      <div className="flex justify-between text-purple-700 dark:text-purple-400 font-bold">
                        <span>🔒 تعهدات قبلی:</span>
                        <span className="font-mono">{fmtNum(previousObligations)} ریال</span>
                      </div>
                      <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-black border-t border-purple-500/20 pt-1 text-xs">
                        <span>💡 مبلغ قابل تعهد:</span>
                        <span className="font-mono">{fmtNum(availableCommitmentAmount)} ریال</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* گام ۲: اطلاعات تعهد */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">شماره تعهد</Label>
                    <Input
                      value={form.obligation_number}
                      onChange={(e) => setForm({ ...form, obligation_number: e.target.value })}
                      placeholder="خودکار یا دستی..."
                      className="text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">تاریخ تعهد</Label>
                    <PersianDatePicker
                      value={form.obligation_date}
                      onChange={(d) => setForm({ ...form, obligation_date: d })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">طرف حساب / پیمانکار / ذینفع</Label>
                  <Input
                    value={form.beneficiary_name}
                    onChange={(e) => setForm({ ...form, beneficiary_name: e.target.value })}
                    placeholder="نام شرکت، طرف حساب یا پیمانکار..."
                    className="text-xs font-bold"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">شماره قرارداد</Label>
                    <Input
                      value={form.contract_number}
                      onChange={(e) => setForm({ ...form, contract_number: e.target.value })}
                      placeholder="مثلاً: CNT-1403/12"
                      className="text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">مبلغ قرارداد (ریال)</Label>
                    <Input
                      type="number"
                      value={form.contract_amount}
                      onChange={(e) => setForm({ ...form, contract_amount: e.target.value })}
                      placeholder="0"
                      className="text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-purple-700 dark:text-purple-400">مبلغ تعهد (ریال)</Label>
                    <Input
                      type="number"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      placeholder="0"
                      className="text-xs font-mono font-bold border-purple-500/40"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">سال مالی</Label>
                    <Input
                      value={form.fiscal_year}
                      onChange={(e) => setForm({ ...form, fiscal_year: e.target.value })}
                      className="text-xs font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">شرح و بابت تعهد</Label>
                  <Input
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="موضوع تعهد و مستندات..."
                    className="text-xs"
                  />
                </div>

                {/* پیوست مستندات تعهد */}
                <div className="space-y-1.5 pt-1">
                  <Label className="text-xs font-semibold flex items-center gap-1">
                    <Paperclip className="h-3.5 w-3.5 text-purple-600" />
                    پیوست مستندات تعهد (قرارداد / ابلاغیه)
                  </Label>
                  <div className="flex items-center gap-2">
                    <label className="flex-1 cursor-pointer">
                      <div className="h-9 px-3 text-xs border border-dashed border-purple-500/40 rounded-lg flex items-center justify-between bg-purple-500/5 hover:bg-purple-500/10 transition-colors">
                        <span className="text-muted-foreground truncate">
                          {form.attachment_name || "انتخاب فایل پیوست..."}
                        </span>
                        <Upload className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                      </div>
                      <input type="file" onChange={handleFileUpload} className="hidden" />
                    </label>
                    {form.attachment_name && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-9 px-2 text-rose-600 text-xs"
                        onClick={() => setForm(p => ({ ...p, attachment_name: "", attachment_data: "" }))}
                      >
                        حذف
                      </Button>
                    )}
                  </div>
                </div>

                <Button type="submit" size="sm" className="w-full text-xs font-bold gap-2 bg-purple-600 hover:bg-purple-700 text-white" disabled={loading}>
                  <Lock className="h-4 w-4" />
                  {editingOb ? "بروزرسانی تعهد" : "ثبت تعهد مالی قطعی"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* جدول تعهدات */}
          <Card className="lg:col-span-2 shadow-sm border-purple-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-3 bg-purple-500/5 border-b border-purple-500/10">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-600" />
                لیست تعهدات مالی و سوابق آزادسازی (بخش ۱۰ و ۱۱)
              </CardTitle>
              <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-700">{obligations.length} تعهد ثبت‌شده</Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-muted/50 border-b text-muted-foreground font-semibold">
                    <tr>
                      <th className="p-3">شماره تعهد</th>
                      <th className="p-3">طرف حساب / پیمانکار</th>
                      <th className="p-3">شماره قرارداد</th>
                      <th className="p-3">تعهد اولیه</th>
                      <th className="p-3">آزادسازی</th>
                      <th className="p-3">تعهد خالص</th>
                      <th className="p-3">پیوست</th>
                      <th className="p-3 text-center">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {obligations.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-muted-foreground">
                          هیچ تعهد مالی ثبت نشده است.
                        </td>
                      </tr>
                    ) : (
                      obligations.map((item) => {
                        const initialAmt = Number(item.amount) || 0;
                        const relAmt = Number(item.released_amount) || 0;
                        const netAmt = Math.max(0, initialAmt - relAmt);
                        return (
                          <tr key={item._id} className="hover:bg-muted/30 transition-colors">
                            <td className="p-3 font-mono font-bold text-purple-900 dark:text-purple-200">{item.obligation_number}</td>
                            <td className="p-3 font-bold text-foreground">{item.beneficiary_name}</td>
                            <td className="p-3 font-mono text-muted-foreground">{item.contract_number || "—"}</td>
                            <td className="p-3 font-bold text-foreground font-mono">{fmtNum(initialAmt)}</td>
                            <td className="p-3 font-semibold text-emerald-600 font-mono">{fmtNum(relAmt)}</td>
                            <td className="p-3 font-black text-purple-600 font-mono">{fmtNum(netAmt)}</td>
                            <td className="p-3">
                              {item.attachment_name ? (
                                <a
                                  href={item.attachment_data || "#"}
                                  download={item.attachment_name}
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-600 hover:underline"
                                >
                                  <Paperclip className="h-3 w-3" />
                                  پیوست
                                </a>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="p-3 text-center space-x-1 space-x-reverse">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-[10px] text-emerald-600 border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 gap-1 font-bold"
                                onClick={() => {
                                  setReleaseModal(item);
                                  setReleaseAmount(String(netAmt));
                                }}
                              >
                                <Unlock className="h-3 w-3" />
                                آزادسازی / کاهش
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-500/10"
                                onClick={() => handleDeleteAttempt(item)}
                                title="حذف"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
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

      {/* مدال هشداری عدم امکان حذف تعهد قطعی (بخش ۱۱) */}
      {deleteWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-amber-500/30 bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">
                  ممانعت حسابداری: تعهد قطعی قابل حذف مستقیم نیست (بند ۱۱)
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  طبق ضوابط مالی و حسابداری، تعهد قطعی شماره <strong className="text-foreground font-mono">{deleteWarningModal.obligation_number}</strong> نباید از دیتابیس حذف (Delete) شود. سوابق تعهد اولیه و آزادسازی باید در سیستم باقی بماند.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-muted/50 text-xs space-y-1 font-mono">
              <div className="flex justify-between">
                <span>تعهد اولیه:</span>
                <span className="font-bold">{fmtNum(deleteWarningModal.amount)} ریال</span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>آزادسازی شده:</span>
                <span className="font-bold">{fmtNum(deleteWarningModal.released_amount || 0)} ریال</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button size="sm" variant="outline" onClick={() => setDeleteWarningModal(null)} className="text-xs">
                متوجه شدم
              </Button>
              <Button
                size="sm"
                className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                onClick={() => {
                  const target = deleteWarningModal;
                  setDeleteWarningModal(null);
                  setReleaseModal(target);
                  setReleaseAmount(String(Number(target.amount) - Number(target.released_amount || 0)));
                }}
              >
                <Unlock className="h-3.5 w-3.5" />
                ثبت آزادسازی / کاهش تعهد
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* مدال آزادسازی یا کاهش تعهد (بخش ۱۱) */}
      {releaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-emerald-500/30 bg-card p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2 border-b pb-3">
              <Unlock className="h-5 w-5 text-emerald-600" />
              آزادسازی / کاهش تعهد: {releaseModal.obligation_number}
            </h3>

            {/* محاسبه سوابق: تعهد اولیه، آزادسازی، تعهد خالص */}
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5 text-xs">
              <div className="flex justify-between text-foreground font-bold">
                <span>تعهد اولیه:</span>
                <span className="font-mono">{fmtNum(releaseModal.amount)} ریال</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>آزادسازی‌های قبلی:</span>
                <span className="font-mono">{fmtNum(releaseModal.released_amount || 0)} ریال</span>
              </div>
              <div className="flex justify-between text-purple-700 dark:text-purple-300 font-black border-t border-emerald-500/20 pt-1">
                <span>مانده تعهد خالص فعلی:</span>
                <span className="font-mono">{fmtNum(Number(releaseModal.amount) - Number(releaseModal.released_amount || 0))} ریال</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">مبلغ آزادسازی جدید (ریال)</Label>
                <Input
                  type="number"
                  value={releaseAmount}
                  onChange={(e) => setReleaseAmount(e.target.value)}
                  className="text-xs font-mono font-bold border-emerald-500/40"
                  placeholder="0"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">تاریخ آزادسازی</Label>
                <PersianDatePicker
                  value={releaseDate}
                  onChange={setReleaseDate}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">علت / مستندات آزادسازی</Label>
                <Input
                  value={releaseReason}
                  onChange={(e) => setReleaseReason(e.target.value)}
                  placeholder="مثلاً: لغو بخشودگی مالیاتی یا اصلاح سقف قرارداد..."
                  className="text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" onClick={() => setReleaseModal(null)} className="text-xs">
                انصراف
              </Button>
              <Button size="sm" onClick={handleRelease} className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
                <CheckCircle2 className="h-4 w-4" />
                تایید و ثبت آزادسازی تعهد
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ۴. زبانه مرور تعهدات (مرکز اصلی کار حسابدار - ۱۰ مرحله‌ای تعاملی) */}
      {activeTab === "review" && (
        <div className="space-y-6">
          {/* هدر انتخاب ردیف بودجه */}
          <Card className="bg-card/70 border-purple-500/30 shadow-sm">
            <CardContent className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center border border-purple-500/20">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-foreground">مرکز مرور تعهدات و پایش ۱۰ مرحله‌ای اعتبارات</h2>
                  <p className="text-xs text-muted-foreground">انتخاب ردیف بودجه جهت پایش کامل تعهدات و روند جریان مالی از بودجه مصوب تا پرداخت</p>
                </div>
              </div>

              <div className="w-full md:w-80 space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground block">انتخاب ردیف بودجه / برنامه:</label>
                <select
                  value={selectedAgrId}
                  onChange={(e) => setSelectedAgrId(e.target.value)}
                  className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-purple-500/30 bg-background focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-xs cursor-pointer"
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

          {/* زنجیره ۱۰ مرحله‌ای */}
          {selectedAgr ? (
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-2.5 max-w-2xl mx-auto">
                {/* ۱. بودجه مصوب */}
                <div
                  onClick={() => setActiveStep("approved")}
                  className={`w-full cursor-pointer transition-all duration-200 rounded-2xl border p-4 shadow-sm ${
                    activeStep === "approved"
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
                  className={`w-full cursor-pointer transition-all duration-200 rounded-2xl border p-4 shadow-sm ${
                    activeStep === "amendments"
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
                  className={`w-full cursor-pointer transition-all duration-200 rounded-2xl border p-4 shadow-sm ${
                    activeStep === "final"
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
                  className={`w-full cursor-pointer transition-all duration-200 rounded-2xl border p-4 shadow-sm ${
                    activeStep === "allocations"
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
                  className={`w-full cursor-pointer transition-all duration-200 rounded-2xl border p-4 shadow-sm ${
                    activeStep === "funding"
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
                  className={`w-full cursor-pointer transition-all duration-200 rounded-2xl border p-4 shadow-sm ${
                    activeStep === "obligations"
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
                  className={`w-full cursor-pointer transition-all duration-200 rounded-2xl border p-4 shadow-sm ${
                    activeStep === "realizations"
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
                  className={`w-full cursor-pointer transition-all duration-200 rounded-2xl border p-4 shadow-sm ${
                    activeStep === "paymentRequests"
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
                  className={`w-full cursor-pointer transition-all duration-200 rounded-2xl border p-4 shadow-sm ${
                    activeStep === "remittances"
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
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
