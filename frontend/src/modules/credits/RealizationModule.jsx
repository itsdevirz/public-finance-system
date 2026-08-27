import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Plus, Trash2, Edit, Save, AlertCircle, RefreshCw, FileCheck, Landmark, Upload, Paperclip, Lock } from "lucide-react";
import { PersianDatePicker } from "@/components/ui/persian-date-picker";
import api from "@/api";

function fmtNum(n) {
  if (n === 0 || n == null) return "۰";
  return Number(n).toLocaleString("fa-IR");
}

export default function RealizationModule() {
  const [realizations, setRealizations] = useState([]);
  const [obligations, setObligations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);

  const [form, setForm] = useState({
    obligation_id: "",
    fiscal_year: "1403",
    claimed_amount: "",
    verified_amount: "",
    bill_number: "",
    verification_date: new Date().toLocaleDateString("fa-IR"),
    verifier: "کارشناس رسیدگی و تسجیل",
    description: "",
    attachment_name: "",
    attachment_data: "",
    status: "verified"
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rRes, oRes] = await Promise.all([
        api.get("/api/credits/realizations"),
        api.get("/api/credits/obligations")
      ]);
      setRealizations(rRes.data?.data || []);
      setObligations(oRes.data?.data || []);
    } catch (e) {
      setAlertMsg({ type: "error", text: "خطا در دریافت اطلاعات تحقق و تسجیل" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // محاسبه سوابق تعهد انتخابی و مانده تعهد قابل تحقق
  const selectedObligation = obligations.find(o => String(o._id) === String(form.obligation_id));
  const initialObligationAmt = selectedObligation ? (Number(selectedObligation.amount) || 0) : 0;
  const releasedObligationAmt = selectedObligation ? (Number(selectedObligation.released_amount) || 0) : 0;
  const netObligationAmt = Math.max(0, initialObligationAmt - releasedObligationAmt);

  const previousRealizations = selectedObligation
    ? realizations
        .filter(r => String(r.obligation_id) === String(selectedObligation._id))
        .reduce((sum, r) => sum + (Number(r.verified_amount) || 0), 0)
    : 0;

  const remainingObligationBalance = Math.max(0, netObligationAmt - previousRealizations);

  // آپلود فایل پیوست صورت وضعیت / سند تحقق
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

  const handleObligationChange = (obId) => {
    const found = obligations.find(o => String(o._id) === String(obId));
    if (found) {
      setForm(prev => ({
        ...prev,
        obligation_id: obId,
        fiscal_year: String(found.fiscal_year || 1403),
        claimed_amount: String(prev.claimed_amount || found.amount || ""),
        verified_amount: String(prev.verified_amount || found.amount || "")
      }));
    } else {
      setForm(prev => ({ ...prev, obligation_id: obId }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.obligation_id) {
      setAlertMsg({ type: "error", text: "انتخاب تعهد مالی مربوطه الزامی است" });
      return;
    }
    if (!form.claimed_amount || !form.verified_amount) {
      setAlertMsg({ type: "error", text: "مبلغ ابرازی صورتحساب و مبلغ تاییدشده تسجیل الزامی است" });
      return;
    }

    const verifiedAmt = Number(form.verified_amount) || 0;
    if (selectedObligation && verifiedAmt > remainingObligationBalance) {
      setAlertMsg({
        type: "error",
        text: `خطای تسجیل: مبلغ تاییدشده (${fmtNum(verifiedAmt)} ریال) بیشتر از مانده تعهد قابل تحقق (${fmtNum(remainingObligationBalance)} ریال) است.`
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        fiscal_year: Number(form.fiscal_year || 1403),
        claimed_amount: Number(form.claimed_amount),
        verified_amount: verifiedAmt,
        bill_number: form.bill_number || `BILL-${form.fiscal_year || 1403}-${Date.now().toString().slice(-6)}`
      };
      await api.post("/api/credits/realizations", payload);
      setAlertMsg({ type: "success", text: "مورد تحقق/تسجیل با موفقیت تایید و به تعهد مربوط متصل شد." });
      setForm({
        obligation_id: "",
        fiscal_year: "1403",
        claimed_amount: "",
        verified_amount: "",
        bill_number: "",
        verification_date: new Date().toLocaleDateString("fa-IR"),
        verifier: "کارشناس رسیدگی و تسجیل",
        description: "",
        attachment_name: "",
        attachment_data: "",
        status: "verified"
      });
      fetchData();
    } catch (e) {
      setAlertMsg({ type: "error", text: "خطا در ثبت تسجیل" });
    } finally {
      setLoading(false);
    }
  };

  const deleteRlz = async (id) => {
    if (!window.confirm("آیا از حذف این مورد تسجیل اطمینان دارید؟")) return;
    try {
      await api.delete(`/api/credits/realizations/${id}`);
      setAlertMsg({ type: "success", text: "مورد تسجیل حذف شد" });
      fetchData();
    } catch (e) {
      setAlertMsg({ type: "error", text: "خطا در حذف تسجیل" });
    }
  };

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* فرم ثبت تحقق و تسجیل */}
        <Card className="lg:col-span-1 shadow-sm border-indigo-500/20">
          <CardHeader className="bg-indigo-500/5 border-b border-indigo-500/10 py-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-indigo-800 dark:text-indigo-300">
              <FileCheck className="h-4 w-4 text-indigo-600" />
              ثبت سند تحقق / تسجیل هزینه (بخش ۱۲)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* انتخاب تعهد مربوطه */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">۱. انتخاب تعهد مالی مربوطه</Label>
                <select
                  value={form.obligation_id}
                  onChange={(e) => handleObligationChange(e.target.value)}
                  className="w-full h-9 px-3 text-xs font-semibold rounded-lg border border-indigo-500/30 bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  required
                >
                  <option value="">انتخاب تعهد قطعی...</option>
                  {obligations.map((o) => {
                    const netAmt = (Number(o.amount) || 0) - (Number(o.released_amount) || 0);
                    return (
                      <option key={o._id} value={o._id}>
                        تعهد {o.obligation_number} — {o.beneficiary_name} (تعهد خالص: {fmtNum(netAmt)} ریال)
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* نمایش وضعیت اتصال سند تحقق به تعهد و محاسبه مانده تعهد */}
              {selectedObligation && (
                <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 space-y-2.5 text-xs animate-in fade-in">
                  <div className="font-bold text-indigo-900 dark:text-indigo-200 border-b border-indigo-500/20 pb-1.5 flex items-center gap-1.5">
                    <Lock className="h-4 w-4 text-indigo-600" />
                    اطلاعات تعهد: {selectedObligation.beneficiary_name}
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between text-muted-foreground">
                      <span>شماره تعهد / قرارداد:</span>
                      <span className="font-mono font-bold text-foreground">{selectedObligation.obligation_number} / {selectedObligation.contract_number || "—"}</span>
                    </div>
                    <div className="flex justify-between text-purple-700 dark:text-purple-400 font-bold border-t border-indigo-500/10 pt-1">
                      <span>🔒 تعهد خالص فعلی:</span>
                      <span className="font-mono">{fmtNum(netObligationAmt)} ریال</span>
                    </div>
                    <div className="flex justify-between text-indigo-700 dark:text-indigo-400 font-bold">
                      <span>🔍 تسجیل‌های قبلی:</span>
                      <span className="font-mono">{fmtNum(previousRealizations)} ریال</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-black border-t border-indigo-500/20 pt-1 text-xs">
                      <span>💡 مانده تعهد قابل تحقق:</span>
                      <span className="font-mono">{fmtNum(remainingObligationBalance)} ریال</span>
                    </div>
                  </div>
                </div>
              )}

              {/* شماره سند تحقق و تاریخ */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">شماره سند / صورتحساب</Label>
                  <Input
                    value={form.bill_number}
                    onChange={(e) => setForm({ ...form, bill_number: e.target.value })}
                    placeholder="مثلاً: BILL-1403/88"
                    className="text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">تاریخ تحقق / تسجیل</Label>
                  <PersianDatePicker
                    value={form.verification_date}
                    onChange={(d) => setForm({ ...form, verification_date: d })}
                  />
                </div>
              </div>

              {/* مبالغ ابرازی و تاییدشده */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">مبلغ ابرازی صورتحساب (ریال)</Label>
                  <Input
                    type="number"
                    value={form.claimed_amount}
                    onChange={(e) => setForm({ ...form, claimed_amount: e.target.value })}
                    placeholder="0"
                    className="text-xs font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-indigo-700 dark:text-indigo-400">مبلغ تأییدشده تسجیل (ریال)</Label>
                  <Input
                    type="number"
                    value={form.verified_amount}
                    onChange={(e) => setForm({ ...form, verified_amount: e.target.value })}
                    placeholder="0"
                    className="text-xs font-mono font-bold border-indigo-500/40"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">مأمور / کارشناس رسیدگی و تسجیل</Label>
                <Input
                  value={form.verifier}
                  onChange={(e) => setForm({ ...form, verifier: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">شرح و توضیحات تسجیل</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="ملاحظات کارشناس رسیدگی..."
                  className="text-xs"
                />
              </div>

              {/* پیوست اسناد تحقق */}
              <div className="space-y-1.5 pt-1">
                <Label className="text-xs font-semibold flex items-center gap-1">
                  <Paperclip className="h-3.5 w-3.5 text-indigo-600" />
                  پیوست تصویر صورت وضعیت / سند تحقق
                </Label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 cursor-pointer">
                    <div className="h-9 px-3 text-xs border border-dashed border-indigo-500/40 rounded-lg flex items-center justify-between bg-indigo-500/5 hover:bg-indigo-500/10 transition-colors">
                      <span className="text-muted-foreground truncate">
                        {form.attachment_name || "انتخاب فایل اسناد تحقق..."}
                      </span>
                      <Upload className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
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

              <Button type="submit" size="sm" className="w-full text-xs font-bold gap-2 bg-indigo-600 hover:bg-indigo-700 text-white" disabled={loading}>
                <FileCheck className="h-4 w-4" />
                تأیید و ثبت سند تحقق / تسجیل
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* جدول موارد تحقق و تسجیل شده */}
        <Card className="lg:col-span-2 shadow-sm border-indigo-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-3 bg-indigo-500/5 border-b border-indigo-500/10">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-indigo-600" />
              لیست اسناد تحقق/تسجیل‌شده و اتصال به تعهد (بخش ۱۲)
            </CardTitle>
            <Badge variant="outline" className="text-xs border-indigo-500/30 text-indigo-700">{realizations.length} مورد تسجیل</Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-muted/50 border-b text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-3">شماره صورتحساب</th>
                    <th className="p-3">تعهد مربوطه</th>
                    <th className="p-3">مبلغ ابرازی</th>
                    <th className="p-3">مبلغ تأییدشده</th>
                    <th className="p-3">مانده تعهد پس از تسجیل</th>
                    <th className="p-3">پیوست</th>
                    <th className="p-3 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {realizations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-muted-foreground">
                        هیچ سند تحققی ثبت نشده است.
                      </td>
                    </tr>
                  ) : (
                    realizations.map((item) => {
                      const matchedOb = obligations.find(o => String(o._id) === String(item.obligation_id));
                      const obNetAmt = matchedOb ? (Number(matchedOb.amount) || 0) - (Number(matchedOb.released_amount) || 0) : 0;

                      // محاسبه مجموع تسجیل‌های تا این سند
                      const obRealizations = realizations.filter(r => String(r.obligation_id) === String(item.obligation_id));
                      const totalVerifiedForOb = obRealizations.reduce((sum, r) => sum + (Number(r.verified_amount) || 0), 0);
                      const currentObligationRemaining = Math.max(0, obNetAmt - totalVerifiedForOb);

                      return (
                        <tr key={item._id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-mono font-bold text-indigo-900 dark:text-indigo-200">{item.bill_number || item.realization_number}</td>
                          <td className="p-3">
                            <div className="font-bold text-foreground">{matchedOb?.beneficiary_name || "تعهد عمومی"}</div>
                            <div className="text-[10px] font-mono text-muted-foreground">{matchedOb?.obligation_number}</div>
                          </td>
                          <td className="p-3 font-mono text-muted-foreground">{fmtNum(item.claimed_amount)}</td>
                          <td className="p-3 font-bold text-indigo-600 font-mono">{fmtNum(item.verified_amount)}</td>
                          <td className="p-3 font-bold text-emerald-600 font-mono">{fmtNum(currentObligationRemaining)}</td>
                          <td className="p-3">
                            {item.attachment_name ? (
                              <a
                                href={item.attachment_data || "#"}
                                download={item.attachment_name}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:underline"
                              >
                                <Paperclip className="h-3 w-3" />
                                اسناد
                              </a>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-500/10"
                              onClick={() => deleteRlz(item._id)}
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
    </div>
  );
}
