import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  CreditCard, Search, RefreshCw, Layers, FileText, TrendingUp,
  ShieldCheck, Lock, CheckCircle2, Wallet, ArrowLeftRight, FileSpreadsheet,
  Printer, ArrowUpRight, ChevronLeft, Landmark, Calendar, Hash, Tag
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getMoeinByCode, deriveMoeinFromChapterAndArticle } from "@/lib/budgetMoeinMapper";
import api from "@/api";

function fmtNum(n) {
  if (n === 0 || n == null) return "۰";
  return Number(n).toLocaleString("fa-IR");
}

export default function CreditCardModule() {
  const [agreements, setAgreements] = useState([]);
  const [amendments, setAmendments] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [fundingRequests, setFundingRequests] = useState([]);
  const [obligations, setObligations] = useState([]);
  const [realizations, setRealizations] = useState([]);
  const [remittances, setRemittances] = useState([]);
  const [documents, setDocuments] = useState([]);

  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAgrId, setSelectedAgrId] = useState("");
  const [activeSubTab, setActiveSubTab] = useState("ledger"); // ledger | obligations | payments | documents

  const fetchData = async () => {
    setLoading(true);
    try {
      const [agrRes, amdRes, alcRes, fndRes, oblRes, rlzRes, remRes, docRes] = await Promise.all([
        api.get("/api/credits/agreements"),
        api.get("/api/credits/budget/amendments"),
        api.get("/api/credits/allocations"),
        api.get("/api/credits/funding/requests"),
        api.get("/api/credits/obligations"),
        api.get("/api/credits/realizations"),
        api.get("/api/credits/payments/remittances"),
        api.get("/api/documents")
      ]);

      const agrList = agrRes.data?.data || [];
      setAgreements(agrList);
      setAmendments(amdRes.data?.data || []);
      setAllocations(alcRes.data?.data || []);
      setFundingRequests(fndRes.data?.data || []);
      setObligations(oblRes.data?.data || []);
      setRealizations(rlzRes.data?.data || []);
      setRemittances(remRes.data?.data || []);
      setDocuments(docRes.data?.data || []);

      if (agrList.length > 0 && !selectedAgrId) {
        setSelectedAgrId(String(agrList[0]._id));
      }
    } catch (e) {
      console.error("Error loading credit card data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // برنامه انتخابی
  const selectedAgr = agreements.find((a) => String(a._id) === String(selectedAgrId)) || agreements[0] || {
    _id: "demo",
    title: "برنامه نمونه بودجه عمومی",
    agreement_number: "۱۲۳۴",
    fiscal_year: "۱۴۰۵",
    program_code: "۱۰",
    activity_code: "۲۰",
    chapter_code: "۰۲",
    article_code: "۰۵",
    total_amount: 120000000000
  };

  const agrIdStr = selectedAgr ? String(selectedAgr._id) : "";

  // کد معین بودجه‌ای مرتبط با این ردیف
  const linkedMoein = selectedAgr.moein_code
    ? getMoeinByCode(selectedAgr.moein_code)
    : deriveMoeinFromChapterAndArticle(selectedAgr.chapter_code || "02", selectedAgr.article_code || "05", selectedAgr.program_code || "10");

  // مبالغ تجمعی مربوط به این ردیف
  const matchedAmendments = amendments.filter((amd) => String(amd.agreement_id) === agrIdStr);
  const matchedAllocations = allocations.filter((alc) => String(alc.agreement_id) === agrIdStr);
  const matchedFundings = fundingRequests.filter((fnd) => String(fnd.agreement_id) === agrIdStr);
  const matchedObligations = obligations.filter(
    (obl) => String(obl.agreement_id) === agrIdStr || matchedFundings.some((f) => String(f._id) === String(obl.funding_confirmation_id))
  );
  const matchedRealizations = realizations.filter((rlz) => matchedObligations.some((o) => String(o._id) === String(rlz.obligation_id)));
  const matchedRemittances = remittances.filter((rem) => (rem.status === "paid" || rem.status === "issued") && (matchedObligations.some((o) => String(o._id) === String(rem.obligation_id)) || String(rem.agreement_id) === agrIdStr));
  const matchedPayments = remittances.filter((rem) => rem.status === "paid" && (matchedObligations.some((o) => String(o._id) === String(rem.obligation_id)) || String(rem.agreement_id) === agrIdStr));

  // محاسبات مالی
  const valApproved = Number(selectedAgr.total_amount) || 0;
  const valAmendments = matchedAmendments.reduce((sum, item) => {
    const amt = Number(item.amount) || 0;
    return item.amendment_type === "increase" ? sum + amt : item.amendment_type === "decrease" ? sum - amt : sum;
  }, 0);
  const valFinal = valApproved + valAmendments;
  const valAllocated = matchedAllocations.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const valFunding = matchedFundings.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const valObligations = matchedObligations.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const valRealization = matchedRealizations.reduce((sum, item) => sum + (Number(item.verified_amount) || 0), 0);
  const valPayments = matchedPayments.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  // مانده‌ها
  const unallocatedRem = valFinal - valAllocated;
  const commitableRem = valAllocated - valObligations;
  const unpaidRem = valObligations - valPayments;

  // فیلتر ردیف‌ها
  const filteredAgreements = agreements.filter(
    (a) =>
      a.title?.includes(searchTerm) ||
      a.program_code?.includes(searchTerm) ||
      a.agreement_number?.includes(searchTerm)
  );

  // ۱. ساخت اسناد حسابداری رویدادهای مالی این ردیف (افتتاحیه بودجه، اصلاحیه، تخصیص، تعهد، پرداخت)
  const creditBudgetDocuments = [];

  if (valApproved > 0) {
    creditBudgetDocuments.push({
      id: `DOC-BUD-${agrIdStr}`,
      document_number: `DOC-BUD-${selectedAgr.agreement_number || selectedAgr.program_code || '101'}`,
      date: selectedAgr.created_at ? new Date(selectedAgr.created_at).toLocaleDateString("fa-IR") : "۱۴۰۵/۰۱/۰۱",
      description: `سند افتتاحیه ثبت بودجه مصوب سالانه - برنامه ${selectedAgr.program_code || ''} (${selectedAgr.title})`,
      total_amount: valApproved,
      type_label: "بودجه مصوب",
      badge_color: "bg-emerald-50 text-emerald-700 border-emerald-200"
    });
  }

  matchedAmendments.forEach((amd, idx) => {
    creditBudgetDocuments.push({
      id: `DOC-AMD-${amd._id || idx}`,
      document_number: `DOC-AMD-${idx + 101}`,
      date: amd.created_at ? new Date(amd.created_at).toLocaleDateString("fa-IR") : "۱۴۰۵/۰۲/۰۱",
      description: `سند حسابداری اصلاحیه بودجه (${amd.amendment_type === "increase" ? "افزایشی" : "کاهشی"}) - ${amd.description || selectedAgr.title}`,
      total_amount: Number(amd.amount) || 0,
      type_label: "اصلاحیه بودجه",
      badge_color: "bg-amber-50 text-amber-700 border-amber-200"
    });
  });

  matchedAllocations.forEach((alc, idx) => {
    creditBudgetDocuments.push({
      id: `DOC-ALC-${alc._id || idx}`,
      document_number: alc.allocation_number || `DOC-ALC-${idx + 101}`,
      date: alc.created_at ? new Date(alc.created_at).toLocaleDateString("fa-IR") : "۱۴۰۵/۰۳/۰۱",
      description: `سند حسابداری ابلاغ تخصیص اعتبار به شماره ${alc.allocation_number || idx + 1}`,
      total_amount: Number(alc.amount) || 0,
      type_label: "تخصیص اعتبار",
      badge_color: "bg-blue-50 text-blue-700 border-blue-200"
    });
  });

  matchedObligations.forEach((obl, idx) => {
    creditBudgetDocuments.push({
      id: `DOC-OBL-${obl._id || idx}`,
      document_number: obl.obligation_number || `DOC-OBL-${idx + 101}`,
      date: obl.created_at ? new Date(obl.created_at).toLocaleDateString("fa-IR") : "۱۴۰۵/۰۴/۰۱",
      description: `سند حسابداری تعهد قطعی مالی به نفع ${obl.beneficiary_name || "ذینفع"}`,
      total_amount: Number(obl.amount) || 0,
      type_label: "تعهد قطعی",
      badge_color: "bg-purple-50 text-purple-700 border-purple-200"
    });
  });

  matchedPayments.forEach((pay, idx) => {
    creditBudgetDocuments.push({
      id: `DOC-PAY-${pay._id || idx}`,
      document_number: pay.remittance_number || `DOC-PAY-${idx + 101}`,
      date: pay.created_at ? new Date(pay.created_at).toLocaleDateString("fa-IR") : "۱۴۰۵/۰۵/۰۱",
      description: `سند پرداخت و تسویه حواله بانکی به نام ${pay.recipient_name || 'دریافت‌کننده'}`,
      total_amount: Number(pay.amount) || 0,
      type_label: "پرداخت حواله",
      badge_color: "bg-emerald-50 text-emerald-700 border-emerald-200"
    });
  });

  // ۲. استخراج اسناد از دفتر اسناد عمومی (شامل اسناد تاییدشده مرتبط)
  const matchedJournalDocuments = documents.filter((doc) => {
    if (!doc) return false;
    const docAgrId = String(doc.agreement_id || doc.agreementId || "");
    const docRef = String(doc.reference_number || doc.reference || "");
    const docDesc = String(doc.description || "");
    const agrNum = String(selectedAgr?.agreement_number || "");
    const progCode = String(selectedAgr?.program_code || "");

    return (
      (agrIdStr && docAgrId === agrIdStr) ||
      (agrNum && docRef.includes(agrNum)) ||
      (agrNum && docDesc.includes(agrNum)) ||
      (progCode && docDesc.includes(`برنامه ${progCode}`))
    );
  }).map((doc) => {
    const totalLinesDebit = doc.lines?.reduce((s, l) => s + (Number(l.debit) || 0), 0) || 0;
    const totalAmt = totalLinesDebit || Number(doc.total_amount) || Number(doc.amount) || 0;
    return {
      id: doc._id || doc.document_number,
      document_number: doc.document_number || doc.doc_number || (doc._id ? `DOC-${doc._id.substring(0, 6).toUpperCase()}` : "سند ثبت‌شده"),
      date: doc.document_date || doc.date || "۱۴۰۵/۰۱/۰۱",
      description: doc.description || `سند عمومی حسابداری ثبت‌شده در دفتر اسناد`,
      total_amount: totalAmt,
      type_label: doc.document_type === "PETTY_CASH_PAYMENT" ? "تنخواه" : doc.document_type === "GENERAL_PAYMENT" ? "پرداخت عمومی" : doc.document_type === "REVENUE" ? "درآمد" : "سند عمومی",
      badge_color: "bg-indigo-50 text-indigo-700 border-indigo-200"
    };
  });

  // ترکیب کلیه اسناد مرتبط با این ردیف
  const cardDocuments = [...creditBudgetDocuments, ...matchedJournalDocuments];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* هدر بالایی کارت اعتبار */}
      <div className="bg-card/70 backdrop-blur-md border border-border/80 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-inner">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
              کارت اعتبار (شناسنامه و وضعیت اعتبارات)
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px] font-extrabold">
                داده‌های واقعی
              </Badge>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              پرونده جامع ردیف بودجه‌ای شامل اطلاعات شناسنامه‌ای، مانده‌های زنده و دفاتر تفکیکی
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <Button onClick={fetchData} variant="outline" size="sm" className="gap-2 text-xs font-bold" disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            بروزرسانی زنده
          </Button>
          <Button onClick={() => window.print()} variant="secondary" size="sm" className="gap-2 text-xs font-bold">
            <Printer className="h-3.5 w-3.5" />
            چاپ کارت
          </Button>
        </div>
      </div>

      {/* بخش انتخاب ردیف بودجه */}
      <Card className="border border-border/70 shadow-xs">
        <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
          <div className="w-full md:w-1/3 relative">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="جستجوی برنامه، کد یا شماره موافقتنامه..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-9 text-xs"
            />
          </div>

          <div className="w-full md:w-2/3 flex items-center gap-3">
            <label className="text-xs font-bold text-muted-foreground whitespace-nowrap">انتخاب ردیف بودجه:</label>
            <select
              value={selectedAgrId}
              onChange={(e) => setSelectedAgrId(e.target.value)}
              className="w-full bg-background border border-input rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {filteredAgreements.length === 0 ? (
                <option value="">ردیف بودجه‌ای ثبت نشده است (نمایش نمونه)</option>
              ) : (
                filteredAgreements.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.program_code ? `[کد ${a.program_code}] ` : ""}{a.title} - شماره: {a.agreement_number || a._id?.substring(0, 6)} ({fmtNum(a.total_amount)} ریال)
                  </option>
                ))
              )}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* ═ کارت اصلی پوستر شکل کارت اعتبار (دقیقاً مشابه ساختار درخواستی کاربر) ═ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ستون راست (کارت اعتبار اصلی شبیه فرمت تصویری درخواستی) */}
        <div className="lg:col-span-5">
          <div className="bg-card border-2 border-primary/40 rounded-3xl shadow-xl overflow-hidden relative backdrop-blur-xl">
            {/* نوار بالای کارت اعتبار */}
            <div className="bg-gradient-to-r from-primary via-primary/90 to-primary/80 text-primary-foreground p-4 text-center border-b border-primary/20">
              <div className="flex items-center justify-center gap-2">
                <Landmark className="h-5 w-5 opacity-90" />
                <h2 className="text-lg font-black tracking-widest uppercase">کارت اعتبار</h2>
              </div>
              <p className="text-[11px] opacity-80 mt-0.5 font-medium">{selectedAgr.title}</p>
            </div>

            {/* بخش ۱: اطلاعات شناسنامه‌ای */}
            <div className="p-4 bg-muted/30 border-b border-border/60">
              <div className="text-xs font-bold text-primary mb-2 flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" />
                شناسنامه ردیف اعتباری و کد معین مرتبط
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-background/80 p-2 rounded-lg border border-border/40 flex justify-between items-center">
                  <span className="text-muted-foreground font-sans text-[11px]">سال مالی:</span>
                  <span className="font-bold text-foreground">{selectedAgr.fiscal_year || "۱۴۰۵"}</span>
                </div>
                <div className="bg-background/80 p-2 rounded-lg border border-border/40 flex justify-between items-center">
                  <span className="text-muted-foreground font-sans text-[11px]">ردیف:</span>
                  <span className="font-bold text-foreground">{selectedAgr.agreement_number || "۱۲۳۴"}</span>
                </div>
                <div className="bg-background/80 p-2 rounded-lg border border-border/40 flex justify-between items-center">
                  <span className="text-muted-foreground font-sans text-[11px]">برنامه:</span>
                  <span className="font-bold text-foreground">{selectedAgr.program_code || "۱۰"}</span>
                </div>
                <div className="bg-background/80 p-2 rounded-lg border border-border/40 flex justify-between items-center">
                  <span className="text-muted-foreground font-sans text-[11px]">فعالیت:</span>
                  <span className="font-bold text-foreground">{selectedAgr.activity_code || "۲۰"}</span>
                </div>
                <div className="bg-background/80 p-2 rounded-lg border border-border/40 flex justify-between items-center">
                  <span className="text-muted-foreground font-sans text-[11px]">فصل:</span>
                  <span className="font-bold text-foreground">{selectedAgr.chapter_code || "۰۲"}</span>
                </div>
                <div className="bg-background/80 p-2 rounded-lg border border-border/40 flex justify-between items-center">
                  <span className="text-muted-foreground font-sans text-[11px]">ماده:</span>
                  <span className="font-bold text-foreground">{selectedAgr.article_code || "۰۵"}</span>
                </div>
              </div>

              {/* کد معین بودجه‌ای مرتبط با این ردیف */}
              <div className="mt-2.5 bg-primary/10 p-2.5 rounded-xl border border-primary/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-sans font-bold text-primary">
                  <Layers className="h-4 w-4 text-primary" />
                  <span>کد معین بودجه‌ای:</span>
                </div>
                <div className="font-mono font-black text-primary text-[11px] dir-ltr text-left">
                  {selectedAgr.moein_code || linkedMoein?.code || "۲۱۲۰۰۵"} — {selectedAgr.moein_title || linkedMoein?.title || "سایر هزینه‌های خدماتی"}
                </div>
              </div>
            </div>

            {/* بخش ۲: مبالغ محاسباتی واقعی (جدول مبالغ کارت اعتبار) */}
            <div className="p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-primary/5 border border-primary/20">
                <span className="font-bold text-foreground">بودجه مصوب</span>
                <span className="font-mono font-black text-primary text-sm">{fmtNum(valApproved)} <span className="text-[10px] font-normal text-muted-foreground">ریال</span></span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20">
                <span className="font-bold text-foreground">اصلاحیه بودجه</span>
                <span className={`font-mono font-bold text-xs ${valAmendments >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {valAmendments >= 0 ? `+${fmtNum(valAmendments)}` : fmtNum(valAmendments)} <span className="text-[10px] font-normal text-muted-foreground">ریال</span>
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-500/5 border border-blue-500/20">
                <span className="font-bold text-foreground">تخصیص اعتبار</span>
                <span className="font-mono font-bold text-blue-600 text-xs">{fmtNum(valAllocated)} <span className="text-[10px] font-normal text-muted-foreground">ریال</span></span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20">
                <span className="font-bold text-foreground">تأمین اعتبار</span>
                <span className="font-mono font-bold text-amber-600 text-xs">{fmtNum(valFunding)} <span className="text-[10px] font-normal text-muted-foreground">ریال</span></span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-purple-500/5 border border-purple-500/20">
                <span className="font-bold text-foreground">تعهد قطعی</span>
                <span className="font-mono font-bold text-purple-600 text-xs">{fmtNum(valObligations)} <span className="text-[10px] font-normal text-muted-foreground">ریال</span></span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
                <span className="font-bold text-foreground">تحقق / تسجیل</span>
                <span className="font-mono font-bold text-indigo-600 text-xs">{fmtNum(valRealization)} <span className="text-[10px] font-normal text-muted-foreground">ریال</span></span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                <span className="font-bold text-foreground">پرداخت نهایی</span>
                <span className="font-mono font-black text-emerald-600 text-xs">{fmtNum(valPayments)} <span className="text-[10px] font-normal text-muted-foreground">ریال</span></span>
              </div>
            </div>

            {/* دکمه‌های اقدام ۴گانه روی کارت اعتبار */}
            <div className="p-3 bg-muted/40 border-t border-border/60 grid grid-cols-4 gap-1.5">
              <Button
                type="button"
                size="sm"
                variant={activeSubTab === "ledger" ? "default" : "outline"}
                onClick={() => setActiveSubTab("ledger")}
                className="text-[11px] font-bold px-1 py-1.5 h-auto flex items-center justify-center gap-1"
              >
                <ArrowLeftRight className="h-3 w-3" />
                گردش
              </Button>
              <Button
                type="button"
                size="sm"
                variant={activeSubTab === "obligations" ? "default" : "outline"}
                onClick={() => setActiveSubTab("obligations")}
                className="text-[11px] font-bold px-1 py-1.5 h-auto flex items-center justify-center gap-1"
              >
                <Lock className="h-3 w-3" />
                تعهدات
              </Button>
              <Button
                type="button"
                size="sm"
                variant={activeSubTab === "payments" ? "default" : "outline"}
                onClick={() => setActiveSubTab("payments")}
                className="text-[11px] font-bold px-1 py-1.5 h-auto flex items-center justify-center gap-1"
              >
                <Wallet className="h-3 w-3" />
                پرداخت‌ها
              </Button>
              <Button
                type="button"
                size="sm"
                variant={activeSubTab === "documents" ? "default" : "outline"}
                onClick={() => setActiveSubTab("documents")}
                className="text-[11px] font-bold px-1 py-1.5 h-auto flex items-center justify-center gap-1"
              >
                <FileSpreadsheet className="h-3 w-3" />
                اسناد
              </Button>
            </div>
          </div>
        </div>

        {/* ستون چپ: ۳ کارت شاخص خلاصه مانده‌ها + تب‌های تفصیلی ۴گانه */}
        <div className="lg:col-span-7 space-y-6">
          {/* کارت شاخص‌های مانده محاسباتی */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="border-r-4 border-r-blue-500 shadow-xs">
              <CardContent className="p-3 space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground">مانده تخصیص‌نیافته</span>
                <div className="text-base font-black text-blue-600 font-mono">{fmtNum(unallocatedRem)}</div>
                <span className="text-[9px] text-muted-foreground">بودجه نهایی minus تخصیص</span>
              </CardContent>
            </Card>

            <Card className="border-r-4 border-r-amber-500 shadow-xs">
              <CardContent className="p-3 space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground">مانده قابل تعهد</span>
                <div className="text-base font-black text-amber-600 font-mono">{fmtNum(commitableRem)}</div>
                <span className="text-[9px] text-muted-foreground">تخصیص minus تعهدات</span>
              </CardContent>
            </Card>

            <Card className="border-r-4 border-r-rose-500 shadow-xs">
              <CardContent className="p-3 space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground">مانده تعهدات پرداخت‌نشده</span>
                <div className="text-base font-black text-rose-600 font-mono">{fmtNum(unpaidRem)}</div>
                <span className="text-[9px] text-muted-foreground">تعهدات minus پرداخت‌ها</span>
              </CardContent>
            </Card>
          </div>

          {/* تب تفصیلی فعال بر اساس دکمه انتخابی روی کارت اعتبار */}
          <Card className="shadow-sm border border-border/80">
            <CardHeader className="p-4 pb-3 border-b border-border/60 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-black flex items-center gap-2 text-foreground">
                {activeSubTab === "ledger" && <><ArrowLeftRight className="h-4 w-4 text-primary" /> ریز دفتر گردش اعتبار</>}
                {activeSubTab === "obligations" && <><Lock className="h-4 w-4 text-purple-600" /> لیست تعهدات ایجادشده تحت این ردیف</>}
                {activeSubTab === "payments" && <><Wallet className="h-4 w-4 text-emerald-600" /> لیست حواله‌ها و پرداختی‌های قطعی</>}
                {activeSubTab === "documents" && <><FileSpreadsheet className="h-4 w-4 text-blue-600" /> اسناد حسابداری مرتبط با این ردیف</>}
              </CardTitle>
              <Badge variant="outline" className="text-[10px] font-bold">
                {activeSubTab === "ledger" && `${1 + matchedAmendments.length + matchedAllocations.length + matchedObligations.length + matchedPayments.length} تراکنش`}
                {activeSubTab === "obligations" && `${matchedObligations.length} تعهد`}
                {activeSubTab === "payments" && `${matchedPayments.length} پرداخت`}
                {activeSubTab === "documents" && `${cardDocuments.length} سند`}
              </Badge>
            </CardHeader>

            <CardContent className="p-0">
              {/* ۱. تب گردش اعتبار */}
              {activeSubTab === "ledger" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-muted/40 text-muted-foreground font-bold">
                      <tr>
                        <th className="p-3">عنوان رویداد مالی</th>
                        <th className="p-3">بدهکار (ریال)</th>
                        <th className="p-3">بستانکار (ریال)</th>
                        <th className="p-3 text-center">وضعیت</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-mono">
                      <tr className="hover:bg-muted/30">
                        <td className="p-3 font-sans font-bold">۱. ثبت بودجه مصوب اولیه</td>
                        <td className="p-3 text-emerald-600 font-bold">{fmtNum(valApproved)}</td>
                        <td className="p-3 text-muted-foreground">۰</td>
                        <td className="p-3 text-center font-sans"><Badge variant="outline" className="bg-emerald-50 text-emerald-700 text-[10px]">تایید شده</Badge></td>
                      </tr>
                      {matchedAmendments.map((amd, idx) => (
                        <tr key={amd._id || idx} className="hover:bg-muted/30">
                          <td className="p-3 font-sans">اصلاحیه بودجه ({amd.amendment_type === "increase" ? "افزایش" : "کاهش"}) - {amd.description || "-"}</td>
                          <td className="p-3 text-emerald-600">{amd.amendment_type === "increase" ? fmtNum(amd.amount) : "۰"}</td>
                          <td className="p-3 text-rose-600">{amd.amendment_type === "decrease" ? fmtNum(amd.amount) : "۰"}</td>
                          <td className="p-3 text-center font-sans"><Badge variant="outline" className="bg-amber-50 text-amber-700 text-[10px]">اصلاحیه</Badge></td>
                        </tr>
                      ))}
                      {matchedAllocations.map((alc, idx) => (
                        <tr key={alc._id || idx} className="hover:bg-muted/30">
                          <td className="p-3 font-sans">تخصیص اعتبار ابلاغی شماره {alc.allocation_number || idx + 1}</td>
                          <td className="p-3 text-muted-foreground">۰</td>
                          <td className="p-3 text-blue-600 font-bold">{fmtNum(alc.amount)}</td>
                          <td className="p-3 text-center font-sans"><Badge variant="outline" className="bg-blue-50 text-blue-700 text-[10px]">تخصیص</Badge></td>
                        </tr>
                      ))}
                      {matchedObligations.map((obl, idx) => (
                        <tr key={obl._id || idx} className="hover:bg-muted/30">
                          <td className="p-3 font-sans">ایجاد تعهد به نفع {obl.beneficiary_name || "پیمانکار"} (کد: {obl.obligation_number})</td>
                          <td className="p-3 text-purple-600 font-bold">{fmtNum(obl.amount)}</td>
                          <td className="p-3 text-muted-foreground">۰</td>
                          <td className="p-3 text-center font-sans"><Badge variant="outline" className="bg-purple-50 text-purple-700 text-[10px]">تعهد قطعی</Badge></td>
                        </tr>
                      ))}
                      {matchedPayments.map((pay, idx) => (
                        <tr key={pay._id || idx} className="hover:bg-muted/30">
                          <td className="p-3 font-sans">پرداخت نهایی حواله {pay.remittance_number || idx + 1} به نام {pay.recipient_name}</td>
                          <td className="p-3 text-muted-foreground">۰</td>
                          <td className="p-3 text-emerald-600 font-bold">{fmtNum(pay.amount)}</td>
                          <td className="p-3 text-center font-sans"><Badge variant="outline" className="bg-emerald-50 text-emerald-700 text-[10px]">تسویه شد</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ۲. تب تعهدات */}
              {activeSubTab === "obligations" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-muted/40 text-muted-foreground font-bold">
                      <tr>
                        <th className="p-3">شماره تعهد</th>
                        <th className="p-3">نام ذینفع / پیمانکار</th>
                        <th className="p-3">مبلغ تعهد (ریال)</th>
                        <th className="p-3 text-center">وضعیت</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-mono">
                      {matchedObligations.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-muted-foreground font-sans">
                            هیچ تعهدی برای این ردیف بودجه‌ای ثبت نشده است.
                          </td>
                        </tr>
                      ) : (
                        matchedObligations.map((obl) => (
                          <tr key={obl._id} className="hover:bg-muted/30">
                            <td className="p-3 font-bold">{obl.obligation_number}</td>
                            <td className="p-3 font-sans font-semibold">{obl.beneficiary_name}</td>
                            <td className="p-3 text-purple-600 font-bold">{fmtNum(obl.amount)}</td>
                            <td className="p-3 text-center font-sans">
                              <Badge variant="outline" className="bg-purple-50 text-purple-700 text-[10px]">
                                فعال
                              </Badge>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ۳. تب پرداخت‌ها */}
              {activeSubTab === "payments" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-muted/40 text-muted-foreground font-bold">
                      <tr>
                        <th className="p-3">شماره حواله</th>
                        <th className="p-3">دریافت‌کننده</th>
                        <th className="p-3">مبلغ پرداختی (ریال)</th>
                        <th className="p-3 text-center">وضعیت پرداخت</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-mono">
                      {matchedPayments.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-muted-foreground font-sans">
                            هیچ پرداخت قطعی برای این ردیف ثبت نشده است.
                          </td>
                        </tr>
                      ) : (
                        matchedPayments.map((pay) => (
                          <tr key={pay._id} className="hover:bg-muted/30">
                            <td className="p-3 font-bold">{pay.remittance_number}</td>
                            <td className="p-3 font-sans font-semibold">{pay.recipient_name}</td>
                            <td className="p-3 text-emerald-600 font-bold">{fmtNum(pay.amount)}</td>
                            <td className="p-3 text-center font-sans">
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 text-[10px]">
                                پرداخت شده
                              </Badge>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ۴. تب اسناد حسابداری */}
              {activeSubTab === "documents" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-muted/40 text-muted-foreground font-bold">
                      <tr>
                        <th className="p-3">شماره سند</th>
                        <th className="p-3">تاریخ</th>
                        <th className="p-3">شرح کامل سند حسابداری</th>
                        <th className="p-3">مبلغ کل (ریال)</th>
                        <th className="p-3 text-center">نوع سند</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-mono">
                      {cardDocuments.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-muted-foreground font-sans">
                            هیچ سند حسابداری مرتبطی برای این ردیف بودجه‌ای یافت نشد.
                          </td>
                        </tr>
                      ) : (
                        cardDocuments.map((doc, idx) => (
                          <tr key={doc.id || idx} className="hover:bg-muted/30">
                            <td className="p-3 font-bold text-primary">{doc.document_number}</td>
                            <td className="p-3 font-sans text-muted-foreground text-[11px]">{doc.date}</td>
                            <td className="p-3 font-sans font-semibold text-foreground">{doc.description}</td>
                            <td className="p-3 font-bold text-emerald-600">{fmtNum(doc.total_amount)}</td>
                            <td className="p-3 text-center font-sans">
                              <Badge variant="outline" className={`${doc.badge_color} text-[10px] font-bold`}>
                                {doc.type_label}
                              </Badge>
                            </td>
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
      </div>
    </div>
  );
}
