import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import ShebaInput from "@/components/ui/sheba-input";
import { Wallet, Send, RotateCcw, Plus, Trash2, CheckCircle2, AlertCircle, RefreshCw, FileText } from "lucide-react";
import api from "@/api";

function fmtNum(n) {
  if (n === 0 || n == null) return "۰";
  return Number(n).toLocaleString("fa-IR");
}

export default function PaymentWorkflowModule() {
  const { pathname } = useLocation();
  const activeTab = pathname.includes("remittance")
    ? "remittance"
    : pathname.includes("payment")
    ? "payment"
    : pathname.includes("return")
    ? "return"
    : "request";

  const [remittances, setRemittances] = useState([]);
  const [returns, setReturns] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);

  // فرم ثبت حواله / پرداخت
  const [remForm, setRemForm] = useState({
    recipient_name: "",
    iban: "",
    recipient_bank: "بانک ملی ایران",
    amount: "",
    fiscal_year: "1403",
    description: "",
    status: "paid"
  });

  // فرم برگشت پرداخت
  const [retForm, setRetForm] = useState({
    remittance_id: "",
    amount: "",
    reason: "اشتباه در شبا / عدم مطابقت حساب",
    fiscal_year: "1403"
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [remRes, retRes, reqRes] = await Promise.all([
        api.get("/api/credits/payments/remittances"),
        api.get("/api/credits/payments/returns"),
        api.get("/api/credits/requests")
      ]);
      setRemittances(remRes.data?.data || []);
      setReturns(retRes.data?.data || []);
      setRequests(reqRes.data?.data || []);
    } catch (e) {
      setAlertMsg({ type: "error", text: "خطا در دریافت اطلاعات پرداختی‌ها" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pathname]);

  const handleRemSubmit = async (e) => {
    e.preventDefault();
    if (!remForm.recipient_name || !remForm.amount) {
      setAlertMsg({ type: "error", text: "نام دریافت‌کننده و مبلغ حواله الزامی است" });
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...remForm,
        fiscal_year: Number(remForm.fiscal_year),
        amount: Number(remForm.amount)
      };
      await api.post("/api/credits/payments/remittances", payload);
      setAlertMsg({ type: "success", text: "حواله پرداخت با موفقیت صادر و نهایی گردید" });
      setRemForm({
        recipient_name: "",
        iban: "",
        recipient_bank: "بانک ملی ایران",
        amount: "",
        fiscal_year: "1403",
        description: "",
        status: "paid"
      });
      fetchData();
    } catch (e) {
      setAlertMsg({ type: "error", text: "خطا در صدور حواله پرداخت" });
    } finally {
      setLoading(false);
    }
  };

  const handleRetSubmit = async (e) => {
    e.preventDefault();
    if (!retForm.remittance_id || !retForm.amount) {
      setAlertMsg({ type: "error", text: "انتخاب حواله و مبلغ برگشتی الزامی است" });
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...retForm,
        fiscal_year: Number(retForm.fiscal_year),
        amount: Number(retForm.amount)
      };
      await api.post("/api/credits/payments/returns", payload);
      setAlertMsg({ type: "success", text: "برگشت پرداخت با موفقیت ثبت شد و وضعیت حواله بروزرسانی گردید" });
      setRetForm({
        remittance_id: "",
        amount: "",
        reason: "اشتباه در شبا / عدم مطابقت حساب",
        fiscal_year: "1403"
      });
      fetchData();
    } catch (e) {
      setAlertMsg({ type: "error", text: "خطا در ثبت برگشت پرداخت" });
    } finally {
      setLoading(false);
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

      {/* ۱. درخواست پرداخت / درخواست وجه */}
      {activeTab === "request" && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              درخواست‌های پرداخت و وجه فعال
            </CardTitle>
            <Badge variant="outline" className="text-xs">{requests.length} درخواست</Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-muted/50 border-y text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-3">شماره درخواست</th>
                    <th className="p-3">عنوان / بابت</th>
                    <th className="p-3">واحد متقاضی</th>
                    <th className="p-3">مبلغ (ریال)</th>
                    <th className="p-3 text-center">وضعیت</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {requests.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-muted-foreground">
                        هیچ درخواست پرداختی ثبت نشده است.
                      </td>
                    </tr>
                  ) : (
                    requests.map((r) => (
                      <tr key={r._id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-mono font-bold">{r.request_number}</td>
                        <td className="p-3 font-bold text-foreground">{r.title || r.description || "درخواست پرداخت"}</td>
                        <td className="p-3 text-muted-foreground">{r.requesting_unit || "-"}</td>
                        <td className="p-3 font-bold text-primary">{fmtNum(r.amount)}</td>
                        <td className="p-3 text-center">
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            در انتظار اقدام
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
      )}

      {/* ۲. حواله / ۳. پرداخت قطعی */}
      {(activeTab === "remittance" || activeTab === "payment") && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* فرم صدور حواله */}
          <Card className="lg:col-span-1 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Send className="h-4 w-4 text-emerald-600" />
                صدور حواله الکترونیکی و پرداخت
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRemSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">نام و خانوادگی / نام شرکت دریافت‌کننده</Label>
                  <Input
                    value={remForm.recipient_name}
                    onChange={(e) => setRemForm({ ...remForm, recipient_name: e.target.value })}
                    placeholder="ذینفع..."
                    className="text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">شماره شبا (IBAN)</Label>
                  <ShebaInput
                    value={remForm.iban}
                    onChange={(val) => setRemForm({ ...remForm, iban: val })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">مبلغ حواله (ریال)</Label>
                    <Input
                      type="number"
                      value={remForm.amount}
                      onChange={(e) => setRemForm({ ...remForm, amount: e.target.value })}
                      placeholder="0"
                      className="text-xs font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">بانک مقصد</Label>
                    <Input
                      value={remForm.recipient_bank}
                      onChange={(e) => setRemForm({ ...remForm, recipient_bank: e.target.value })}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">بابت / توضیحات حواله</Label>
                  <Input
                    value={remForm.description}
                    onChange={(e) => setRemForm({ ...remForm, description: e.target.value })}
                    placeholder="تسویه صورت وضعیت..."
                    className="text-xs"
                  />
                </div>

                <Button type="submit" size="sm" className="w-full text-xs font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" disabled={loading}>
                  <Send className="h-4 w-4" />
                  صدور و اجرای حواله
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* جدول حواله‌ها */}
          <Card className="lg:col-span-2 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-bold">لیست حواله‌ها و پرداختی‌های صادرشده</CardTitle>
              <Badge variant="outline" className="text-xs">{remittances.length} حواله</Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-muted/50 border-y text-muted-foreground font-semibold">
                    <tr>
                      <th className="p-3">شماره حواله</th>
                      <th className="p-3">دریافت‌کننده</th>
                      <th className="p-3">مبلغ (ریال)</th>
                      <th className="p-3 text-center">وضعیت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {remittances.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-muted-foreground">
                          هیچ حواله پرداختی صادر نشده است.
                        </td>
                      </tr>
                    ) : (
                      remittances.map((item) => (
                        <tr key={item._id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-mono font-bold">{item.remittance_number}</td>
                          <td className="p-3 font-bold text-foreground">
                            <div>{item.recipient_name}</div>
                            <span className="text-[10px] font-mono text-muted-foreground">{item.iban || "-"}</span>
                          </td>
                          <td className="p-3 font-bold text-emerald-600">{fmtNum(item.amount)}</td>
                          <td className="p-3 text-center">
                            <Badge
                              variant="outline"
                              className={
                                item.status === "returned"
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
                              }
                            >
                              {item.status === "returned" ? "برگشت خورده" : "پرداخت شده"}
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

      {/* ۴. برگشت پرداخت */}
      {activeTab === "return" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-rose-600" />
                ثبت برگشت پرداخت / حواله
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRetSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">انتخاب حواله برگشتی</Label>
                  <select
                    value={retForm.remittance_id}
                    onChange={(e) => {
                      const rem = remittances.find((r) => String(r._id) === e.target.value);
                      setRetForm({
                        ...retForm,
                        remittance_id: e.target.value,
                        amount: rem ? String(rem.amount) : retForm.amount
                      });
                    }}
                    className="w-full h-9 px-3 text-xs rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">انتخاب کنید...</option>
                    {remittances.map((r) => (
                      <option key={r._id} value={r._id}>
                        {r.remittance_number} — {r.recipient_name} ({fmtNum(r.amount)} ریال)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">مبلغ برگشتی (ریال)</Label>
                  <Input
                    type="number"
                    value={retForm.amount}
                    onChange={(e) => setRetForm({ ...retForm, amount: e.target.value })}
                    placeholder="0"
                    className="text-xs font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">علت برگشت پرداخت</Label>
                  <Input
                    value={retForm.reason}
                    onChange={(e) => setRetForm({ ...retForm, reason: e.target.value })}
                    className="text-xs"
                    required
                  />
                </div>

                <Button type="submit" size="sm" className="w-full text-xs font-bold gap-2 bg-rose-600 hover:bg-rose-700 text-white" disabled={loading}>
                  <RotateCcw className="h-4 w-4" />
                  ثبت برگشت پرداخت
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* جدول برگشت‌های پرداخت */}
          <Card className="lg:col-span-2 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-bold">لیست برگشت پرداخت‌های ثبت‌شده</CardTitle>
              <Badge variant="outline" className="text-xs">{returns.length} مورد</Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-muted/50 border-y text-muted-foreground font-semibold">
                    <tr>
                      <th className="p-3">شماره برگشت</th>
                      <th className="p-3">مبلغ (ریال)</th>
                      <th className="p-3">علت برگشت</th>
                      <th className="p-3 text-center">وضعیت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {returns.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-muted-foreground">
                          هیچ برگشت پرداختی ثبت نشده است.
                        </td>
                      </tr>
                    ) : (
                      returns.map((item) => (
                        <tr key={item._id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-mono font-bold text-rose-600">{item.return_number}</td>
                          <td className="p-3 font-bold">{fmtNum(item.amount)}</td>
                          <td className="p-3 text-muted-foreground">{item.reason}</td>
                          <td className="p-3 text-center">
                            <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">
                              پردازش شده
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
