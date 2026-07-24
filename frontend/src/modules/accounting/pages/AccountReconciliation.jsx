import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Scale, RefreshCw, Zap, Link2, Unlink2, FileText, CheckCircle2, AlertCircle,
  Building2, Printer, FileDown, Search, Filter, ShieldCheck, ChevronLeft,
  ArrowUpRight, ArrowDownLeft, Landmark, Eye, LogOut
} from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import api from "@/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { printTable } from "@/lib/printUtils";
import { cn } from "@/lib/utils";
import { getCurrentPersianYear } from "@/lib/fiscalUtils";

// تبدیل و نمایش اعداد به فارسی
function toPersianDigits(n) {
  if (n === null || n === undefined || n === "") return "";
  return String(n).replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
}

function fmtNum(n) {
  if (n === null || n === undefined || n === 0) return "۰";
  return toPersianDigits(Number(n).toLocaleString("fa-IR"));
}

export default function AccountReconciliation() {
  const navigate = useNavigate();
  const currentYear = getCurrentPersianYear();

  // داده‌های عمومی
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [fiscalYear, setFiscalYear] = useState(String(currentYear));
  const [accountNumber, setAccountNumber] = useState("");

  // اقلام دوطرفه میزکار مغایرت
  const [ledgerItems, setLedgerItems] = useState([]);
  const [bankItems, setBankItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // انتخاب شده‌ها برای تطبیق دستی
  const [selectedLedgerIds, setSelectedLedgerIds] = useState([]);
  const [selectedBankIds, setSelectedBankIds] = useState([]);

  // جستجو
  const [ledgerSearch, setLedgerSearch] = useState("");
  const [bankSearch, setBankSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all, reconciled, unreconciled

  // پیام‌ها
  const [alertMsg, setAlertMsg] = useState(null);

  // صورت مغایرت بانکی (۴ بخشی)
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [statementData, setStatementData] = useState(null);
  const [statementLoading, setStatementLoading] = useState(false);

  // بارگذاری لیست بسته‌ها و اقلام میزکار
  const fetchBatches = async () => {
    try {
      const res = await api.get("/api/bank-statements");
      const list = res.data?.data || [];
      setBatches(list);
      if (list.length > 0 && !selectedBatchId) {
        setSelectedBatchId(list[0]._id);
        if (list[0].account_number) setAccountNumber(list[0].account_number);
      }
    } catch (err) {
      console.error("Error fetching bank statement batches:", err);
    }
  };

  const fetchWorkspace = async () => {
    setLoading(true);
    setAlertMsg(null);
    try {
      const params = new URLSearchParams();
      if (selectedBatchId) params.append("batch_id", selectedBatchId);
      if (accountNumber) params.append("account_number", accountNumber);
      if (fiscalYear) params.append("fiscal_year", fiscalYear);

      const res = await api.get(`/api/bank-reconciliation/workspace?${params.toString()}`);
      if (res.data?.success) {
        setLedgerItems(res.data.ledger_items || []);
        setBankItems(res.data.bank_items || []);
      }
    } catch (err) {
      console.error("Error fetching workspace data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    fetchWorkspace();
  }, [selectedBatchId, fiscalYear]);

  // تطبیق هوشمند خودکار (Auto-Match)
  const handleAutoMatch = async () => {
    setLoading(true);
    setAlertMsg(null);
    try {
      const res = await api.post("/api/bank-reconciliation/auto-match", {
        ledger_items: ledgerItems,
        bank_items: bankItems,
      });

      if (res.data?.success) {
        setLedgerItems(res.data.ledger_items || []);
        setBankItems(res.data.bank_items || []);
        setAlertMsg({ type: "success", text: res.data.message });
      }
    } catch (err) {
      console.error("Error performing auto match:", err);
      setAlertMsg({ type: "error", text: "خطا در اجرای تطبیق هوشمند خودکار" });
    } finally {
      setLoading(false);
    }
  };

  // تطبیق دستی اقلام انتخاب شده
  const handleManualMatch = () => {
    if (selectedLedgerIds.length === 0 || selectedBankIds.length === 0) {
      setAlertMsg({ type: "error", text: "لطفا حداقل یک آیتم از دفتر و یک آیتم از صورت‌حساب بانک را انتخاب کنید." });
      return;
    }

    const matchId = `MANUAL_${Date.now()}`;
    const newLedger = ledgerItems.map((l) =>
      selectedLedgerIds.includes(l.id) ? { ...l, status: "reconciled", match_id: matchId } : l
    );
    const newBank = bankItems.map((b) =>
      selectedBankIds.includes(b.id) ? { ...b, status: "reconciled", match_id: matchId } : b
    );

    setLedgerItems(newLedger);
    setBankItems(newBank);
    setSelectedLedgerIds([]);
    setSelectedBankIds([]);
    setAlertMsg({ type: "success", text: "اقلام انتخابی با موفقیت تطبیق داده شدند." });
  };

  // رفع تطبیق اقلام
  const handleUnmatch = () => {
    if (selectedLedgerIds.length === 0 && selectedBankIds.length === 0) {
      setAlertMsg({ type: "error", text: "لطفا اقلام مورد نظر جهت رفع تطبیق را انتخاب کنید." });
      return;
    }

    const newLedger = ledgerItems.map((l) =>
      selectedLedgerIds.includes(l.id) ? { ...l, status: "unreconciled", match_id: null } : l
    );
    const newBank = bankItems.map((b) =>
      selectedBankIds.includes(b.id) ? { ...b, status: "unreconciled", match_id: null } : b
    );

    setLedgerItems(newLedger);
    setBankItems(newBank);
    setSelectedLedgerIds([]);
    setSelectedBankIds([]);
    setAlertMsg({ type: "success", text: "تطبیق اقلام انتخابی با موفقیت لغو شد." });
  };

  // صدور صورت مغایرت بانکی (۴ بخشی)
  const handleOpenStatementModal = async () => {
    setShowStatementModal(true);
    setStatementLoading(true);
    try {
      const res = await api.get(`/api/bank-reconciliation/statement?batch_id=${selectedBatchId}`);
      if (res.data?.success) {
        setStatementData(res.data.statement);
      }
    } catch (err) {
      console.error("Error fetching statement data:", err);
    } finally {
      setStatementLoading(false);
    }
  };

  // فیلتر کردن اقلام دفتر و بانک
  const filteredLedger = useMemo(() => {
    return ledgerItems.filter((l) => {
      const q = ledgerSearch.toLowerCase();
      const matchSearch =
        (l.doc_number || "").toLowerCase().includes(q) ||
        (l.description || "").toLowerCase().includes(q);

      if (statusFilter === "reconciled") return matchSearch && l.status === "reconciled";
      if (statusFilter === "unreconciled") return matchSearch && l.status !== "reconciled";
      return matchSearch;
    });
  }, [ledgerItems, ledgerSearch, statusFilter]);

  const filteredBank = useMemo(() => {
    return bankItems.filter((b) => {
      const q = bankSearch.toLowerCase();
      const matchSearch =
        (b.ref_number || "").toLowerCase().includes(q) ||
        (b.description || "").toLowerCase().includes(q);

      if (statusFilter === "reconciled") return matchSearch && b.status === "reconciled";
      if (statusFilter === "unreconciled") return matchSearch && b.status !== "reconciled";
      return matchSearch;
    });
  }, [bankItems, bankSearch, statusFilter]);

  // خلاصه‌های مالی
  const ledgerTotals = useMemo(() => {
    const totalDebit = filteredLedger.reduce((sum, i) => sum + (i.debit || 0), 0);
    const totalCredit = filteredLedger.reduce((sum, i) => sum + (i.credit || 0), 0);
    const reconciledCount = filteredLedger.filter((i) => i.status === "reconciled").length;
    return { totalDebit, totalCredit, reconciledCount, totalCount: filteredLedger.length };
  }, [filteredLedger]);

  const bankTotals = useMemo(() => {
    const totalDebit = filteredBank.reduce((sum, i) => sum + (i.debit || 0), 0);
    const totalCredit = filteredBank.reduce((sum, i) => sum + (i.credit || 0), 0);
    const reconciledCount = filteredBank.filter((i) => i.status === "reconciled").length;
    return { totalDebit, totalCredit, reconciledCount, totalCount: filteredBank.length };
  }, [filteredBank]);

  return (
    <PageShell>
      {/* هدر صفحه */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/80 pb-4 mb-5" dir="rtl">
        <div className="flex items-center gap-2.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-inner">
            <Scale className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">مغایرت حساب‌ها (میزکار مغایرت بانکی)</h1>
            <p className="text-xs text-muted-foreground">تطبیق خودکار و دستی اقلام دفاتر حسابداری سازمان با صورت‌حساب الکترونیکی بانک</p>
          </div>
        </div>

        {/* دکمه‌های بالا */}
        <div className="flex items-center flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/system-management")}
            className="gap-1.5 h-9 text-xs border-border/80 hover:bg-muted"
          >
            <LogOut className="h-4 w-4 rotate-180" /> خروج
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenStatementModal}
            className="gap-1.5 h-9 text-xs border-blue-200 bg-blue-50/50 text-blue-700 hover:bg-blue-100 font-semibold"
          >
            <FileText className="h-4 w-4" /> صورت مغایرت بانکی (۴ بخشی)
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handleAutoMatch}
            disabled={loading}
            className="gap-1.5 h-9 text-xs bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-sm"
          >
            <Zap className="h-4 w-4" /> تطبیق هوشمند خودکار ⚡
          </Button>
        </div>
      </div>

      <div className="space-y-5" dir="rtl">
        {/* پیام‌های سیستم */}
        {alertMsg && (
          <div className={cn(
            "p-3 rounded-xl text-xs font-semibold flex items-center justify-between shadow-sm animate-in fade-in duration-300",
            alertMsg.type === "success" ? "bg-emerald-50 border border-emerald-200 text-emerald-800" : "bg-rose-50 border border-rose-200 text-rose-800"
          )}>
            <div className="flex items-center gap-2">
              {alertMsg.type === "success" ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-rose-600" />}
              <span>{alertMsg.text}</span>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setAlertMsg(null)} className="h-6 text-[10px]">بستن</Button>
          </div>
        )}

        {/* فیلترهای بالای میزکار */}
        <Card className="border-border/80 shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              <div>
                <Label className="text-xs font-semibold text-muted-foreground block mb-1">بسته صورت‌حساب بانک</Label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs text-right"
                >
                  {batches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.batch_number} — {b.bank_name} ({b.account_number})
                    </option>
                  ))}
                  {batches.length === 0 && <option value="">صورت‌حسابی وارد نشده است</option>}
                </select>
              </div>

              <div>
                <Label className="text-xs font-semibold text-muted-foreground block mb-1">فیلتر وضعیت تطبیق</Label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs text-right"
                >
                  <option value="all">نمایش همه اقلام</option>
                  <option value="unreconciled">فقط اقلام فاقد تطبیق (مغایرت)</option>
                  <option value="reconciled">فقط اقلام تطبیق‌یافته</option>
                </select>
              </div>

              {/* ابزارهای تطبیق دستی */}
              <div className="md:col-span-2 flex items-center justify-end gap-2 pt-4 md:pt-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManualMatch}
                  disabled={selectedLedgerIds.length === 0 || selectedBankIds.length === 0}
                  className="gap-1.5 h-9 text-xs border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-bold"
                >
                  <Link2 className="h-4 w-4" /> تطبیق دستی اقلام انتخاب شده
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUnmatch}
                  disabled={selectedLedgerIds.length === 0 && selectedBankIds.length === 0}
                  className="gap-1.5 h-9 text-xs border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-100 font-bold"
                >
                  <Unlink2 className="h-4 w-4" /> لغو تطبیق (رفع مغایرت)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* میزکار دوطرفه مقایسه (Dual Workspace) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* جدول سمت راست: اسناد و ردیف‌های دفاتر حسابداری (Ledger) */}
          <Card className="border-border/80 shadow-sm flex flex-col">
            <CardHeader className="p-3.5 bg-blue-50/50 dark:bg-blue-950/20 border-b flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-600" />
                <div>
                  <CardTitle className="text-sm font-bold text-foreground">دفتر حسابداری (اسناد سازمان)</CardTitle>
                  <CardDescription className="text-[11px] text-muted-foreground">
                    تعداد: {fmtNum(ledgerTotals.totalCount)} | تطبیق‌یافته: {fmtNum(ledgerTotals.reconciledCount)}
                  </CardDescription>
                </div>
              </div>

              <div className="relative max-w-[180px]">
                <Search className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={ledgerSearch}
                  onChange={(e) => setLedgerSearch(e.target.value)}
                  placeholder="جستجو در سند..."
                  className="h-8 pr-8 text-[11px] text-right"
                />
              </div>
            </CardHeader>

            <CardContent className="p-0 flex-1 flex flex-col justify-between">
              <div className="overflow-x-auto max-h-[440px] overflow-y-auto">
                <Table>
                  <TableHeader className="bg-muted/30 sticky top-0 text-[11px]">
                    <TableRow>
                      <TableHead className="text-center py-2 w-8">تست</TableHead>
                      <TableHead className="text-center py-2">تاریخ</TableHead>
                      <TableHead className="text-center py-2">شماره سند</TableHead>
                      <TableHead className="text-center py-2 text-rose-600">بدهکار</TableHead>
                      <TableHead className="text-center py-2 text-emerald-600">بستانکار</TableHead>
                      <TableHead className="text-right py-2">شرح سند</TableHead>
                      <TableHead className="text-center py-2 w-14">وضعیت</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-[11px]">
                    {filteredLedger.map((l) => {
                      const isSelected = selectedLedgerIds.includes(l.id);
                      return (
                        <TableRow key={l.id} className={cn(l.status === "reconciled" && "bg-emerald-50/40 dark:bg-emerald-950/20")}>
                          <TableCell className="text-center py-1.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedLedgerIds([...selectedLedgerIds, l.id]);
                                else setSelectedLedgerIds(selectedLedgerIds.filter((id) => id !== l.id));
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </TableCell>
                          <TableCell className="font-mono text-center py-1.5">{l.doc_date}</TableCell>
                          <TableCell className="font-mono font-bold text-center text-blue-600 py-1.5">{l.doc_number}</TableCell>
                          <TableCell className="font-mono text-center text-rose-600 font-semibold py-1.5">{fmtNum(l.debit)}</TableCell>
                          <TableCell className="font-mono text-center text-emerald-600 font-semibold py-1.5">{fmtNum(l.credit)}</TableCell>
                          <TableCell className="text-right max-w-[180px] truncate py-1.5">{l.description}</TableCell>
                          <TableCell className="text-center py-1.5">
                            <span className={cn(
                              "px-1.5 py-0.5 rounded text-[10px] font-bold",
                              l.status === "reconciled" ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                            )}>
                              {l.status === "reconciled" ? "تطبیق" : "مغایرت"}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filteredLedger.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-xs py-8 text-muted-foreground">
                          هیچ سند حسابداری در بازه انتخابی یافت نشد.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* خلاصه مالی پایین جدول دفتر */}
              <div className="bg-muted/20 p-2.5 border-t text-xs flex items-center justify-between font-mono">
                <span>جمع بدهکار: <strong className="text-rose-600">{fmtNum(ledgerTotals.totalDebit)}</strong></span>
                <span>جمع بستانکار: <strong className="text-emerald-600">{fmtNum(ledgerTotals.totalCredit)}</strong></span>
              </div>
            </CardContent>
          </Card>

          {/* جدول سمت چپ: تراکنش‌های صورت‌حساب الکترونیکی بانک (Bank) */}
          <Card className="border-border/80 shadow-sm flex flex-col">
            <CardHeader className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 border-b flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2">
                <Landmark className="h-4 w-4 text-emerald-600" />
                <div>
                  <CardTitle className="text-sm font-bold text-foreground">صورت‌حساب بانک (فایل وارد شده)</CardTitle>
                  <CardDescription className="text-[11px] text-muted-foreground">
                    تعداد: {fmtNum(bankTotals.totalCount)} | تطبیق‌یافته: {fmtNum(bankTotals.reconciledCount)}
                  </CardDescription>
                </div>
              </div>

              <div className="relative max-w-[180px]">
                <Search className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={bankSearch}
                  onChange={(e) => setBankSearch(e.target.value)}
                  placeholder="جستجو در بانک..."
                  className="h-8 pr-8 text-[11px] text-right"
                />
              </div>
            </CardHeader>

            <CardContent className="p-0 flex-1 flex flex-col justify-between">
              <div className="overflow-x-auto max-h-[440px] overflow-y-auto">
                <Table>
                  <TableHeader className="bg-muted/30 sticky top-0 text-[11px]">
                    <TableRow>
                      <TableHead className="text-center py-2 w-8">تست</TableHead>
                      <TableHead className="text-center py-2">تاریخ</TableHead>
                      <TableHead className="text-center py-2">شماره پیگیری</TableHead>
                      <TableHead className="text-center py-2 text-rose-600">بدهکار</TableHead>
                      <TableHead className="text-center py-2 text-emerald-600">بستانکار</TableHead>
                      <TableHead className="text-right py-2">شرح تراکنش</TableHead>
                      <TableHead className="text-center py-2 w-14">وضعیت</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-[11px]">
                    {filteredBank.map((b) => {
                      const isSelected = selectedBankIds.includes(b.id);
                      return (
                        <TableRow key={b.id} className={cn(b.status === "reconciled" && "bg-emerald-50/40 dark:bg-emerald-950/20")}>
                          <TableCell className="text-center py-1.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedBankIds([...selectedBankIds, b.id]);
                                else setSelectedBankIds(selectedBankIds.filter((id) => id !== b.id));
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </TableCell>
                          <TableCell className="font-mono text-center py-1.5">{b.date}</TableCell>
                          <TableCell className="font-mono font-bold text-center text-blue-600 py-1.5">{b.ref_number}</TableCell>
                          <TableCell className="font-mono text-center text-rose-600 font-semibold py-1.5">{fmtNum(b.debit)}</TableCell>
                          <TableCell className="font-mono text-center text-emerald-600 font-semibold py-1.5">{fmtNum(b.credit)}</TableCell>
                          <TableCell className="text-right max-w-[180px] truncate py-1.5">{b.description}</TableCell>
                          <TableCell className="text-center py-1.5">
                            <span className={cn(
                              "px-1.5 py-0.5 rounded text-[10px] font-bold",
                              b.status === "reconciled" ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                            )}>
                              {b.status === "reconciled" ? "تطبیق" : "مغایرت"}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filteredBank.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-xs py-8 text-muted-foreground">
                          هیچ تراکنش بانکی در این بسته یافت نشد.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* خلاصه مالی پایین جدول بانک */}
              <div className="bg-muted/20 p-2.5 border-t text-xs flex items-center justify-between font-mono">
                <span>جمع برداشت: <strong className="text-rose-600">{fmtNum(bankTotals.totalDebit)}</strong></span>
                <span>جمع واریز: <strong className="text-emerald-600">{fmtNum(bankTotals.totalCredit)}</strong></span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* مدال صورت مغایرت بانکی استاندارد (۴ بخشی) */}
      <Modal
        open={showStatementModal}
        onClose={() => setShowStatementModal(false)}
        title="صورت مغایرت بانکی استاندارد (۴ بخشی)"
        description="خلاصه تطبیق اقلام دفاتر سازمان و صورت‌حساب الکترونیکی بانک"
        size="xl"
      >
        <div className="flex items-center justify-end mb-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => printTable("#reconciliation-statement-print", "صورت مغایرت بانکی")}
            className="h-8 text-xs gap-1.5"
          >
            <Printer className="h-3.5 w-3.5" /> چاپ رسمی
          </Button>
        </div>

        {statementLoading ? (
          <div className="py-12 text-center text-xs text-muted-foreground animate-pulse">
            در حال محاسبه و استخراج صورت مغایرت بانکی...
          </div>
        ) : statementData ? (
          <div className="space-y-5 pt-2" id="reconciliation-statement-print">
            <div className="text-center border-b pb-3 space-y-1">
              <h2 className="text-base font-bold">فرم رسمی صورت مغایرت بانکی</h2>
              <p className="text-xs text-muted-foreground">حساب بانکی: {accountNumber || "—"}</p>
            </div>

            {/* جدول ۴ بخشی استاندارد */}
            <div className="border rounded-xl overflow-hidden text-xs">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="text-right py-2.5 font-bold text-foreground">شرح بخش‌های صورت مغایرت</TableHead>
                    <TableHead className="text-center py-2.5 font-bold text-foreground w-40">مبلغ (ریال)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="font-mono">
                  {/* بخش ۱: مانده طبق دفتر */}
                  <TableRow className="bg-blue-50/40 dark:bg-blue-950/20 font-bold">
                    <TableCell className="text-right">۱. مانده حساب طبق دفاتر حسابداری سازمان</TableCell>
                    <TableCell className="text-center text-blue-700">{fmtNum(statementData.ledger_ending_balance)}</TableCell>
                  </TableRow>

                  {/* بخش ۲: چک‌های معوق */}
                  <TableRow>
                    <TableCell className="text-right pr-6 font-semibold">
                      افزودن: چک‌های معوق صادر شده که هنوز توسط دارنده به بانک ارائه نشده است (+)
                    </TableCell>
                    <TableCell className="text-center text-emerald-600 font-bold">+{fmtNum(statementData.total_pending_checks)}</TableCell>
                  </TableRow>

                  {/* بخش ۳: وجوه بین‌راهی */}
                  <TableRow>
                    <TableCell className="text-right pr-6 font-semibold">
                      کسر: وجوه بین‌راهی و واریزی‌های ثبت‌شده در دفتر که در بانک ثبت نشده است (-)
                    </TableCell>
                    <TableCell className="text-center text-rose-600 font-bold">-{fmtNum(statementData.total_transit_funds)}</TableCell>
                  </TableRow>

                  {/* بخش ۴: مانده طبق بانک */}
                  <TableRow className="bg-emerald-50/40 dark:bg-emerald-950/20 font-bold">
                    <TableCell className="text-right">۴. مانده نهایی طبق صورت‌حساب دریافت شده از بانک</TableCell>
                    <TableCell className="text-center text-emerald-700">{fmtNum(statementData.bank_ending_balance)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* وضعیت نهایی تراز و مغایرت */}
            <div className={cn(
              "p-4 rounded-xl border flex items-center justify-between text-xs font-bold",
              statementData.is_balanced ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-amber-50 border-amber-200 text-amber-800"
            )}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span>وضعیت مغایرت: {statementData.is_balanced ? "کاملاً تراز (بدون مغایرت)" : "دارای مغایرت اقلام باز"}</span>
              </div>
              <span className="font-mono text-sm">مبلغ اختلاف: {fmtNum(statementData.discrepancy)} ریال</span>
            </div>
          </div>
        ) : null}
      </Modal>
    </PageShell>
  );
}
