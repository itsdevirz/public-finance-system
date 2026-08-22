import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Plus, Trash2, Edit, Save, AlertCircle, RefreshCw, FileCheck } from "lucide-react";
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
    verifier: "کارشناس رسیدگی و تسجیل",
    description: "",
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.claimed_amount || !form.verified_amount) {
      setAlertMsg({ type: "error", text: "مبلغ ابرازی و مبلغ تاییدشده تسجیل الزامی است" });
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        fiscal_year: Number(form.fiscal_year),
        claimed_amount: Number(form.claimed_amount),
        verified_amount: Number(form.verified_amount)
      };
      await api.post("/api/credits/realizations", payload);
      setAlertMsg({ type: "success", text: "مورد تحقق/تسجیل با موفقیت تایید و ثبت شد" });
      setForm({
        obligation_id: "",
        fiscal_year: "1403",
        claimed_amount: "",
        verified_amount: "",
        bill_number: "",
        verifier: "کارشناس رسیدگی و تسجیل",
        description: "",
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* فرم ثبت تسجیل */}
        <Card className="lg:col-span-1 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-indigo-600" />
              ثبت تحقق و تسجیل (رسیدگی و تایید قطعی هزینه)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">تعهد مالی مربوطه</Label>
                <select
                  value={form.obligation_id}
                  onChange={(e) => setForm({ ...form, obligation_id: e.target.value })}
                  className="w-full h-9 px-3 text-xs rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">انتخاب تعهد...</option>
                  {obligations.map((o) => (
                    <option key={o._id} value={o._id}>
                      {o.obligation_number} — {o.beneficiary_name} ({fmtNum(o.amount)} ریال)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">شماره صورت وضعیت/فاکتور</Label>
                  <Input
                    value={form.bill_number}
                    onChange={(e) => setForm({ ...form, bill_number: e.target.value })}
                    placeholder="INV-1002"
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">رسیدگی‌کننده</Label>
                  <Input
                    value={form.verifier}
                    onChange={(e) => setForm({ ...form, verifier: e.target.value })}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">مبلغ ابرازی ذینفع (ریال)</Label>
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
                  <Label className="text-xs font-semibold">مبلغ تاییدشده (تسجیل)</Label>
                  <Input
                    type="number"
                    value={form.verified_amount}
                    onChange={(e) => setForm({ ...form, verified_amount: e.target.value })}
                    placeholder="0"
                    className="text-xs font-mono text-indigo-600 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">شرح تسجیل و کسورات</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="توضیحات مفاصاحساب یا صورتجلسه تحویل..."
                  className="text-xs"
                />
              </div>

              <Button type="submit" size="sm" className="w-full text-xs font-bold gap-2" disabled={loading}>
                <CheckCircle2 className="h-4 w-4" />
                تایید و ثبت تسجیل
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* جدول موارد تسجیل‌شده */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-bold">لیست صورت وضعیت‌ها و اسناد تسجیل‌شده</CardTitle>
            <Badge variant="outline" className="text-xs">{realizations.length} مورد</Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-muted/50 border-y text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-3">شماره تسجیل</th>
                    <th className="p-3">شماره صورت وضعیت</th>
                    <th className="p-3">مبلغ ابرازی</th>
                    <th className="p-3">مبلغ تسجیل‌شده (ریال)</th>
                    <th className="p-3 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {realizations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-muted-foreground">
                        هیچ مورد تحقق/تسجیلی ثبت نشده است.
                      </td>
                    </tr>
                  ) : (
                    realizations.map((item) => (
                      <tr key={item._id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-mono font-bold">{item.realization_number}</td>
                        <td className="p-3 font-semibold text-foreground">{item.bill_number || "-"}</td>
                        <td className="p-3 text-muted-foreground">{fmtNum(item.claimed_amount)}</td>
                        <td className="p-3 font-bold text-indigo-600">{fmtNum(item.verified_amount)}</td>
                        <td className="p-3 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-rose-600"
                            onClick={() => deleteRlz(item._id)}
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
    </div>
  );
}
