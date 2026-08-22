import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Trash2, Edit, Save, CheckCircle2, AlertCircle, RefreshCw, Lock, Unlock, Search,
  Landmark, ArrowDown, Eye, Filter
} from "lucide-react";
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
    beneficiary_name: "",
    fiscal_year: "1403",
    amount: "",
    funding_confirmation_id: "",
    description: "",
    status: "active"
  });

  const [releaseModal, setReleaseModal] = useState(null);
  const [releaseAmount, setReleaseAmount] = useState("");

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.beneficiary_name || !form.amount) {
      setAlertMsg({ type: "error", text: "نام ذینفع/طرف تعهد و مبلغ تعهد الزامی است" });
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        fiscal_year: Number(form.fiscal_year),
        amount: Number(form.amount)
      };

      if (editingOb) {
        await api.put(`/api/credits/obligations/${editingOb._id}`, payload);
        setAlertMsg({ type: "success", text: "تعهد مالی با موفقیت اصلاح گردید" });
      } else {
        await api.post("/api/credits/obligations", payload);
        setAlertMsg({ type: "success", text: "تعهد مالی قطعی با موفقیت ایجاد گردید" });
      }

      setForm({
        beneficiary_name: "",
        fiscal_year: "1403",
        amount: "",
        funding_confirmation_id: "",
        description: "",
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

  const deleteOb = async (id) => {
    if (!window.confirm("آیا از حذف این تعهد مالی اطمینان دارید؟")) return;
    try {
      await api.delete(`/api/credits/obligations/${id}`);
      setAlertMsg({ type: "success", text: "تعهد مالی حذف گردید" });
      fetchData();
    } catch (e) {
      setAlertMsg({ type: "error", text: "خطا در حذف تعهد" });
    }
  };

  const handleRelease = async () => {
    if (!releaseModal || !releaseAmount) return;
    try {
      await api.post(`/api/credits/obligations/${releaseModal._id}/release`, {
        releaseAmount: Number(releaseAmount)
      });
      setAlertMsg({ type: "success", text: "آزادسازی تعهد با موفقیت ثبت شد" });
      setReleaseModal(null);
      setReleaseAmount("");
      fetchData();
    } catch (e) {
      setAlertMsg({ type: "error", text: "خطا در آزادسازی تعهد" });
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

  const filteredObligations = obligations.filter(
    (o) =>
      o.beneficiary_name?.includes(searchTerm) ||
      o.obligation_number?.includes(searchTerm)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {alertMsg && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between ${
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
          <Card className="lg:col-span-1 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Lock className="h-4 w-4 text-purple-600" />
                {editingOb ? "اصلاح تعهد مالی" : "ایجاد تعهد مالی جدید"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">نام ذینفع / طرف قرارداد</Label>
                  <Input
                    value={form.beneficiary_name}
                    onChange={(e) => setForm({ ...form, beneficiary_name: e.target.value })}
                    placeholder="نام شرکت، پیمانکار یا شحص حقوقی..."
                    className="text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">گواهی تأمین اعتبار مربوطه</Label>
                  <select
                    value={form.funding_confirmation_id}
                    onChange={(e) => setForm({ ...form, funding_confirmation_id: e.target.value })}
                    className="w-full h-9 px-3 text-xs rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">انتخاب از رزروهای فعال...</option>
                    {fundingRequests.map((f) => (
                      <option key={f._id} value={f._id}>
                        {f.confirmation_code || f.request_number} - {f.purpose} ({fmtNum(f.amount)} ریال)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">مبلغ تعهد (ریال)</Label>
                    <Input
                      type="number"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      placeholder="0"
                      className="text-xs font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">سال مالی</Label>
                    <Input
                      value={form.fiscal_year}
                      onChange={(e) => setForm({ ...form, fiscal_year: e.target.value })}
                      className="text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">توضیحات و شماره قرارداد</Label>
                  <Input
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="شماره قرارداد یا خرید..."
                    className="text-xs"
                  />
                </div>

                <Button type="submit" size="sm" className="w-full text-xs font-bold gap-2" disabled={loading}>
                  <Lock className="h-4 w-4" />
                  {editingOb ? "بروزرسانی تعهد" : "ثبت تعهد مالی قطعی"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* جدول تعهدات */}
          <Card className="lg:col-span-2 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-bold">لیست تعهدات مالی صادرشده</CardTitle>
              <Badge variant="outline" className="text-xs">{obligations.length} تعهد</Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-muted/50 border-y text-muted-foreground font-semibold">
                    <tr>
                      <th className="p-3">شماره تعهد</th>
                      <th className="p-3">نام ذینفع</th>
                      <th className="p-3">مبلغ تعهد (ریال)</th>
                      <th className="p-3">آزادسازی‌شده</th>
                      <th className="p-3 text-center">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {obligations.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-muted-foreground">
                          هیچ تعهد مالی ایجاد نشده است.
                        </td>
                      </tr>
                    ) : (
                      obligations.map((item) => (
                        <tr key={item._id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-mono font-bold">{item.obligation_number}</td>
                          <td className="p-3 font-bold text-foreground">{item.beneficiary_name}</td>
                          <td className="p-3 font-bold text-purple-600">{fmtNum(item.amount)}</td>
                          <td className="p-3 font-semibold text-emerald-600">{fmtNum(item.released_amount || 0)}</td>
                          <td className="p-3 text-center space-x-1 space-x-reverse">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-[10px] text-emerald-600 gap-1"
                              onClick={() => {
                                setReleaseModal(item);
                                setReleaseAmount(String(item.amount - (item.released_amount || 0)));
                              }}
                            >
                              <Unlock className="h-3 w-3" />
                              آزادسازی
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-rose-600"
                              onClick={() => deleteOb(item._id)}
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

      {/* مدال آزادسازی تعهد */}
      {releaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Unlock className="h-5 w-5 text-emerald-600" />
              ثبت آزادسازی تعهد: {releaseModal.obligation_number}
            </h3>
            <p className="text-xs text-muted-foreground">
              نام ذینفع: <strong className="text-foreground">{releaseModal.beneficiary_name}</strong>
            </p>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">مبلغ قابل آزادسازی (ریال)</Label>
              <Input
                type="number"
                value={releaseAmount}
                onChange={(e) => setReleaseAmount(e.target.value)}
                className="text-xs font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setReleaseModal(null)} className="text-xs">
                انصراف
              </Button>
              <Button size="sm" onClick={handleRelease} className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white">
                تایید آزادسازی
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

                <div className="text-muted-foreground/60"><ArrowDown className="h-4 w-4" /></div>

                {/* ۱۰. پرداخت */}
                <div
                  onClick={() => setActiveStep("payments")}
                  className={`w-full cursor-pointer transition-all duration-200 rounded-2xl border p-4 shadow-sm ${
                    activeStep === "payments"
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
              <Card className="shadow-lg border-2 border-purple-500/30">
                <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Eye className="h-4 w-4 text-purple-600" />
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
                  <Badge variant="outline" className="text-xs font-mono bg-purple-50 text-purple-800 border-purple-300">
                    ردیف: {selectedAgr.title}
                  </Badge>
                </CardHeader>
                <CardContent className="p-4">
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

                  {activeStep !== "obligations" && (
                    <div className="text-xs p-3 text-muted-foreground text-center">
                      مشاهده ریز اسناد مربوط به <strong>{activeStep}</strong> برای ردیف بودجه انتخابی.
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

          {/* جدول جامع کلیه تعهدات */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Filter className="h-4 w-4 text-purple-600" />
                مرور جامع کلیه تعهدات مالی
              </CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="جستجو در نام ذینفع یا شماره..."
                  className="pr-8 text-xs h-8"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-muted/50 border-y text-muted-foreground font-semibold">
                    <tr>
                      <th className="p-3">شماره تعهد</th>
                      <th className="p-3">نام ذینفع / طرف قرارداد</th>
                      <th className="p-3">مبلغ اصلی تعهد (ریال)</th>
                      <th className="p-3">وضعیت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredObligations.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-muted-foreground">
                          موردی پیدا نشد.
                        </td>
                      </tr>
                    ) : (
                      filteredObligations.map((o) => (
                        <tr key={o._id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-mono font-bold">{o.obligation_number}</td>
                          <td className="p-3 font-bold text-foreground">{o.beneficiary_name}</td>
                          <td className="p-3 font-bold text-purple-600">{fmtNum(o.amount)}</td>
                          <td className="p-3">
                            <Badge
                              variant="outline"
                              className={
                                o.status === "released"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-purple-50 text-purple-700 border-purple-200"
                              }
                            >
                              {o.status === "released" ? "آزادسازی کامل" : "فعال"}
                            </Badge>
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
    </div>
  );
}
