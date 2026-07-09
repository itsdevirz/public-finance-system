import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { PersianDatePicker, toPersianDigits } from "@/components/ui/persian-date-picker";
import { Separator } from "@/components/ui/separator";
import {
  Copy, Search, ChevronDown, FileText, AlertCircle, RefreshCw, X, ArrowLeft,
  ArrowRightLeft, Sliders, CheckSquare, Settings, Eye, CheckCircle2, LayoutTemplate, Clock, Layers, ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/api";
import { cn } from "@/lib/utils";

const STATUS_LABEL = { DRAFT: "پیش‌نویس", CONFIRMED: "تایید شده", CANCELLED: "ابطال شده" };
const STATUS_COLOR = {
  DRAFT:     "bg-orange-50 text-orange-700 border-orange-200",
  CONFIRMED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-rose-50 text-rose-700 border-rose-200",
};

export default function CopyDocument() {
  const navigate = useNavigate();
  const today = new Date().toLocaleDateString("fa-IR").replace(/\//g, "/");

  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedDoc, setSelectedDoc] = useState(null);

  // ---------------------------------------------------------------------------
  // COPY PARAMETERS STATE
  // ---------------------------------------------------------------------------
  const [newDocInfo, setNewDocInfo] = useState({
    docNoType: "auto", // auto, manual
    manualDocNo: "",
    docDate: today,
    fiscalYear: "1405",
    fiscalPeriod: "تیرماه",
    branch: "شعبه اصفهان",
    orgUnit: "امور مالی اصفهان",
    docType: "روزنامه",
    description: ""
  });

  const [copyOptions, setCopyOptions] = useState({
    allItems: true,
    accountsOnly: false,
    amounts: true,
    lineDesc: true,
    attachments: true,
    files: true,
    currencyInfo: true,
    costCenters: true,
    projects: true,
    fundingSource: true,
    budgets: true,
    taxes: true,
    refNo: true,
    customerInfo: true
  });

  // Dimension replacements/mappings
  const [mappings, setMappings] = useState({
    branch: { enabled: true, from: "تهران", to: "اصفهان" },
    costCenter: { enabled: true, from: "اداری", to: "فروش" },
    project: { enabled: false, from: "", to: "" },
    fundingSource: { enabled: false, from: "", to: "" },
    detailAccount: { enabled: false, from: "", to: "" },
    currency: { enabled: false, from: "", to: "" },
    currencyRate: { enabled: false, from: "", to: "" }
  });

  const [isReverse, setIsReverse] = useState(false); // Storno entry toggle

  const [amountSetting, setAmountSetting] = useState("same"); // same, zero, debitOnly, creditOnly, multiplier
  const [multiplier, setMultiplier] = useState(100); // multiplier percentage

  const [newStatus, setNewStatus] = useState("DRAFT"); // DRAFT, CONFIRMED

  // ---------------------------------------------------------------------------
  // ADVANCED ERP FEATURES STATE
  // ---------------------------------------------------------------------------
  const [activeErpPanel, setActiveErpPanel] = useState(null); // null, 'bulk', 'mapping', 'schedule'
  const [bulkCopy, setBulkCopy] = useState({
    fromDocNo: "",
    toDocNo: "",
    targetYear: "1406",
    targetPeriod: "اردیبهشت"
  });

  const [globalMappings, setGlobalMappings] = useState([
    { id: 1, oldCode: "11101", newCode: "11102", type: "حساب معین" },
    { id: 2, oldCode: "اداری", newCode: "مالی", type: "مرکز هزینه" }
  ]);
  const [newGlobalMap, setNewGlobalMap] = useState({ oldCode: "", newCode: "", type: "حساب معین" });

  const [scheduleCopy, setScheduleCopy] = useState({
    enabled: false,
    interval: "monthly", // monthly, weekly
    startDoc: "",
    endDoc: ""
  });

  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // ---------------------------------------------------------------------------
  // LOAD DOCUMENTS
  // ---------------------------------------------------------------------------
  const fetchDocs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/documents");
      setDocs(res.data.data ?? []);
    } catch {
      setError("خطا در دریافت لیست اسناد.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  // Handle source doc changes to set default description
  useEffect(() => {
    if (selectedDoc) {
      setNewDocInfo(info => ({
        ...info,
        description: `کپی از سند ${selectedDoc.document_number} بابت ${selectedDoc.description || ""}`
      }));
    }
  }, [selectedDoc]);

  // Search filter
  const filtered = docs.filter((d) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      d.document_number?.toLowerCase().includes(q) ||
      d.description?.toLowerCase().includes(q) ||
      String(d.fiscal_year).includes(q)
    );
  });

  // Calculate totals of selected source doc
  const sourceTotals = useMemo(() => {
    if (!selectedDoc) return { debit: 0, credit: 0, linesCount: 0 };
    const lines = selectedDoc.lines || [];
    const debit = lines.reduce((s, l) => s + (l.debit || 0), 0);
    const credit = lines.reduce((s, l) => s + (l.credit || 0), 0);
    return { debit, credit, linesCount: lines.length };
  }, [selectedDoc]);

  // ---------------------------------------------------------------------------
  // LIVE PREVIEW CALCULATOR
  // ---------------------------------------------------------------------------
  const targetPreview = useMemo(() => {
    if (!selectedDoc) return { debit: 0, credit: 0, linesCount: 0, lines: [] };

    let lines = (selectedDoc.lines || []).map((l, index) => {
      let debit = l.debit || 0;
      let credit = l.credit || 0;

      // Adjust amounts
      if (amountSetting === "zero" || !copyOptions.amounts) {
        debit = 0;
        credit = 0;
      } else if (amountSetting === "debitOnly") {
        credit = 0;
      } else if (amountSetting === "creditOnly") {
        debit = 0;
      } else if (amountSetting === "multiplier") {
        const factor = Number(multiplier) / 100;
        debit = Math.round(debit * factor);
        credit = Math.round(credit * factor);
      }

      // Reverse debits & credits (Storno)
      if (isReverse) {
        const temp = debit;
        debit = credit;
        credit = temp;
      }

      // Mappings and replacements
      let lineDesc = copyOptions.lineDesc ? l.description : "";
      let costCenter = copyOptions.costCenters ? (l.costCenter || "بخش اداری") : "";
      let project = copyOptions.projects ? (l.project || "فناوری اطلاعات") : "";

      if (mappings.costCenter.enabled && costCenter === mappings.costCenter.from) {
        costCenter = mappings.costCenter.to;
      }
      if (mappings.project.enabled && project === mappings.project.from) {
        project = mappings.project.to;
      }

      // Apply global code mappings if exists
      let accountCode = l.account_code || "";
      const globalAcctMap = globalMappings.find(m => m.type === "حساب معین" && m.oldCode === accountCode);
      if (globalAcctMap) {
        accountCode = globalAcctMap.newCode;
      }

      return {
        ...l,
        account_code: accountCode,
        debit,
        credit,
        description: lineDesc,
        costCenter,
        project
      };
    });

    // Sum up preview amounts
    const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
    const totalCredit = lines.reduce((s, l) => s + l.credit, 0);

    return {
      debit: totalDebit,
      credit: totalCredit,
      linesCount: lines.length,
      lines
    };
  }, [selectedDoc, amountSetting, multiplier, isReverse, copyOptions, mappings, globalMappings]);

  // ---------------------------------------------------------------------------
  // GENERATE COPIED DOCUMENT
  // ---------------------------------------------------------------------------
  const handleCopy = async () => {
    if (!selectedDoc) return;
    setLoading(true);
    setError(null);

    try {
      const payload = {
        document_type: newDocInfo.docType === "افتتاحیه" || newDocInfo.docType === "اختتامیه" ? "CLOSING" : "GENERAL_PAYMENT",
        fiscal_year: Number(newDocInfo.fiscalYear),
        status: newStatus,
        document_date: newDocInfo.docDate,
        description: newDocInfo.description,
        lines: targetPreview.lines.map(l => ({
          account_code: l.account_code,
          debit: l.debit,
          credit: l.credit,
          description: l.description || ""
        }))
      };

      const res = await api.post("/api/documents", payload);
      if (res.data?.success || res.status === 201) {
        // Document saved
        const createdNo = res.data.data?.document_number || "سند جدید";
        alert(`سند کپی شده با موفقیت صادر گردید. شماره سند تولید شده: ${createdNo}`);
        navigate("/document-setup/docs-list");
      }
    } catch (err) {
      console.error(err);
      setError("خطا در صدور سند کپی شده. اعتبارسنجی‌ها را بررسی کنید.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddGlobalMap = () => {
    if (!newGlobalMap.oldCode || !newGlobalMap.newCode) return;
    setGlobalMappings([
      ...globalMappings,
      { id: Date.now(), ...newGlobalMap }
    ]);
    setNewGlobalMap({ oldCode: "", newCode: "", type: "حساب معین" });
  };

  return (
    <PageShell>
      <PageHeader
        title="کپی پیشرفته اسناد حسابداری"
        description="انتقال و کپی هوشمند آرتیکل‌ها با قابلیت معکوس‌سازی (Storno)، ضریب مبالغ، نگاشت ابعاد و کپی گروهی اسناد"
      />

      {/* Main Copy Screen Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" dir="rtl">
        {/* Left Hand: Controls Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Source Document Selection */}
          <Card className="shadow-md border border-border">
            <CardHeader className="bg-muted/10 pb-3">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-primary" />
                بخش اول: انتخاب و جزئیات سند مبدأ
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="relative">
                <Label className="text-xs font-bold text-foreground block mb-1">سند حسابداری مبدأ</Label>
                <button
                  type="button"
                  onClick={() => setIsOpen(!isOpen)}
                  className="w-full h-10 text-xs rounded-lg border border-input bg-background px-3 flex items-center justify-between transition-all hover:bg-muted/10 focus:outline-none focus:ring-2 focus:ring-ring/30"
                >
                  {selectedDoc ? (
                    <span className="flex items-center gap-2 text-foreground font-semibold">
                      <span className="font-mono text-primary">{selectedDoc.document_number}</span>
                      <span className="text-muted-foreground">—</span>
                      <span className="truncate max-w-xs">{selectedDoc.description || "بدون شرح"}</span>
                      <Badge className={cn("shrink-0 font-medium", STATUS_COLOR[selectedDoc.status])}>
                        {STATUS_LABEL[selectedDoc.status]}
                      </Badge>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      {loading ? "در حال بارگذاری اسناد..." : "-- سند مبدأ را جهت کپی انتخاب کنید --"}
                    </span>
                  )}
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 mr-2" />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => { setIsOpen(false); setSearch(""); }} />
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 left-0 mt-1.5 z-30 max-h-72 overflow-y-auto rounded-lg border bg-background shadow-2xl border-primary/10"
                      >
                        <div className="sticky top-0 bg-background border-b p-2 z-10">
                          <div className="relative">
                            <Input
                              value={search}
                              onChange={(e) => setSearch(e.target.value)}
                              placeholder="جستجو در اسناد (شماره، شرح، سال مالی)..."
                              className="h-8 text-xs pr-8"
                              dir="rtl"
                              autoFocus
                            />
                            <Search className="absolute right-2.5 top-2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                          </div>
                        </div>
                        <div className="p-1.5 space-y-0.5">
                          {filtered.map(doc => (
                            <button
                              key={doc._id}
                              type="button"
                              onClick={() => { setSelectedDoc(doc); setIsOpen(false); setSearch(""); }}
                              className="w-full text-right px-3 py-2 text-xs rounded-md transition-all flex items-start justify-between gap-2 hover:bg-muted"
                            >
                              <div>
                                <div className="font-bold font-mono text-[11px] text-foreground">{doc.document_number}</div>
                                <div className="text-[10px] text-muted-foreground mt-0.5">{doc.description || "بدون شرح"}</div>
                              </div>
                              <span className={cn("text-[9px] px-1.5 py-0.5 rounded border font-semibold", STATUS_COLOR[doc.status])}>
                                {STATUS_LABEL[doc.status] || doc.status}
                              </span>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Source Document Details Card (Read-only) */}
              {selectedDoc && (
                <div className="p-4 rounded-xl bg-muted/40 border border-border grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground block">شماره سند</span>
                    <span className="font-mono font-bold text-foreground">{selectedDoc.document_number}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground block">تاریخ سند</span>
                    <span className="font-semibold text-foreground">{toPersianDigits(selectedDoc.document_date || "")}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground block">نوع سند</span>
                    <span className="font-semibold text-foreground">{selectedDoc.document_type === "CLOSING" ? "اختتامیه" : "روزنامه (عمومی)"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground block">سال مالی مبدأ</span>
                    <span className="font-mono font-bold text-foreground">{selectedDoc.fiscal_year}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[10px] font-bold text-muted-foreground block">شرح مبدأ</span>
                    <span className="font-semibold text-foreground truncate block">{selectedDoc.description || "—"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground block">تعداد آرتیکل‌ها</span>
                    <span className="font-semibold text-foreground">{sourceTotals.linesCount} آرتیکل</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground block">مبلغ کل (بدهکار/بستانکار)</span>
                    <span className="font-mono font-bold text-primary">{sourceTotals.debit.toLocaleString("fa-IR")} ریال</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 2: Target Document Configuration */}
          <Card className="shadow-md border border-border">
            <CardHeader className="bg-muted/10 pb-3">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Settings className="h-4.5 w-4.5 text-primary" />
                بخش دوم: اطلاعات سند مقصد (جدید)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-foreground">شماره سند جدید</Label>
                  <div className="flex gap-2">
                    <select
                      value={newDocInfo.docNoType}
                      onChange={(e) => setNewDocInfo({ ...newDocInfo, docNoType: e.target.value })}
                      className="h-9 text-xs rounded-lg border border-input bg-background px-2.5 font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="auto">خودکار سیستم</option>
                      <option value="manual">دستی کاربر</option>
                    </select>
                    {newDocInfo.docNoType === "manual" && (
                      <Input
                        value={newDocInfo.manualDocNo}
                        onChange={(e) => setNewDocInfo({ ...newDocInfo, manualDocNo: e.target.value })}
                        placeholder="شماره..."
                        className="h-9 text-xs"
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-foreground">تاریخ سند جدید</Label>
                  <PersianDatePicker
                    value={newDocInfo.docDate}
                    onChange={(e) => setNewDocInfo({ ...newDocInfo, docDate: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-foreground">سال مالی مقصد</Label>
                  <select
                    value={newDocInfo.fiscalYear}
                    onChange={(e) => setNewDocInfo({ ...newDocInfo, fiscalYear: e.target.value })}
                    className="w-full h-9 text-xs rounded-lg border border-input bg-background px-3 font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="1405">۱۴۰۵</option>
                    <option value="1406">۱۴۰۶ (سال مالی بعد)</option>
                    <option value="1404">۱۴۰۴</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-foreground">دوره مالی مقصد</Label>
                  <Input
                    value={newDocInfo.fiscalPeriod}
                    onChange={(e) => setNewDocInfo({ ...newDocInfo, fiscalPeriod: e.target.value })}
                    className="h-9 text-xs font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-foreground">شعبه مقصد</Label>
                  <Input
                    value={newDocInfo.branch}
                    onChange={(e) => setNewDocInfo({ ...newDocInfo, branch: e.target.value })}
                    className="h-9 text-xs font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-foreground">واحد سازمانی مقصد</Label>
                  <Input
                    value={newDocInfo.orgUnit}
                    onChange={(e) => setNewDocInfo({ ...newDocInfo, orgUnit: e.target.value })}
                    className="h-9 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-foreground">نوع سند جدید</Label>
                  <select
                    value={newDocInfo.docType}
                    onChange={(e) => setNewDocInfo({ ...newDocInfo, docType: e.target.value })}
                    className="w-full h-9 text-xs rounded-lg border border-input bg-background px-3 font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="روزنامه">روزنامه (عمومی)</option>
                    <option value="افتتاحیه">افتتاحیه</option>
                    <option value="اختتامیه">اختتامیه</option>
                    <option value="اصلاحی">اصلاحی</option>
                  </select>
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <Label className="text-xs font-bold text-foreground">شرح سند جدید</Label>
                  <Input
                    value={newDocInfo.description}
                    onChange={(e) => setNewDocInfo({ ...newDocInfo, description: e.target.value })}
                    className="h-9 text-xs font-semibold"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Copy Options Checklist */}
          <Card className="shadow-md border border-border">
            <CardHeader className="bg-muted/10 pb-3">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <CheckSquare className="h-4.5 w-4.5 text-primary" />
                بخش سوم: نحوه کپی و فیلدهای دانه‌بندی شده
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
                {[
                  { key: "allItems", label: "کپی تمام آرتیکل‌ها" },
                  { key: "accountsOnly", label: "کپی فقط حساب‌ها (مبالغ صفر)" },
                  { key: "amounts", label: "کپی مبالغ بدهکار/بستانکار" },
                  { key: "lineDesc", label: "کپی شرح ردیف‌های آرتیکل" },
                  { key: "attachments", label: "کپی مدارک مثبته و پیوست‌ها" },
                  { key: "files", label: "کپی فایل‌های اسکن شده" },
                  { key: "currencyInfo", label: "کپی اطلاعات ارزی (ارز/نرخ)" },
                  { key: "costCenters", label: "کپی مراکز هزینه آرتیکل" },
                  { key: "projects", label: "کپی پروژه‌های ثبت‌شده" },
                  { key: "fundingSource", label: "کپی منبع مالی و اعتباری" },
                  { key: "budgets", label: "کپی اطلاعات بودجه‌ای سناما" },
                  { key: "taxes", label: "کپی اطلاعات و جرایم مالیاتی" },
                  { key: "refNo", label: "کپی شماره مرجع / نامه اداری" },
                  { key: "customerInfo", label: "کپی اطلاعات اشخاص/طرف‌حساب" }
                ].map((opt) => (
                  <label key={opt.key} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={copyOptions[opt.key]}
                      onChange={(e) => setCopyOptions({ ...copyOptions, [opt.key]: e.target.checked })}
                      className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                    />
                    <span className="text-xs font-semibold text-foreground/80">{opt.label}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Hand: Mappings, Actions, Preview */}
        <div className="space-y-6">
          {/* Section 4: Replacement Mappings */}
          <Card className="shadow-md border border-border">
            <CardHeader className="bg-muted/10 pb-3">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Sliders className="h-4 w-4 text-primary" />
                بخش چهارم: تغییرات و نگاشت ابعاد هنگام کپی
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {[
                { key: "branch", label: "جایگزینی شعبه" },
                { key: "costCenter", label: "جایگزینی مرکز هزینه" },
                { key: "project", label: "جایگزینی پروژه" },
                { key: "fundingSource", label: "جایگزینی منبع مالی" }
              ].map((mapItem) => (
                <div key={mapItem.key} className="space-y-1 p-2 bg-muted/20 rounded-lg border">
                  <div className="flex items-center justify-between mb-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-foreground">
                      <input
                        type="checkbox"
                        checked={mappings[mapItem.key].enabled}
                        onChange={(e) => setMappings({
                          ...mappings,
                          [mapItem.key]: { ...mappings[mapItem.key], enabled: e.target.checked }
                        })}
                        className="rounded border-border text-primary h-3.5 w-3.5"
                      />
                      {mapItem.label}
                    </label>
                  </div>
                  {mappings[mapItem.key].enabled && (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">مقدار قبلی</Label>
                        <Input
                          value={mappings[mapItem.key].from}
                          onChange={(e) => setMappings({
                            ...mappings,
                            [mapItem.key]: { ...mappings[mapItem.key], from: e.target.value }
                          })}
                          className="h-7 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">مقدار جایگزین</Label>
                        <Input
                          value={mappings[mapItem.key].to}
                          onChange={(e) => setMappings({
                            ...mappings,
                            [mapItem.key]: { ...mappings[mapItem.key], to: e.target.value }
                          })}
                          className="h-7 text-xs font-bold text-primary"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Section 5 & 6: Reversing & Amount Settings */}
          <Card className="shadow-md border border-border">
            <CardHeader className="bg-muted/10 pb-3">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <ArrowRightLeft className="h-4 w-4 text-primary" />
                بخش پنجم و ششم: معکوس‌سازی و مبالغ
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <label className="flex items-center gap-3 cursor-pointer p-2.5 rounded-lg bg-rose-50/50 border border-rose-100">
                <input
                  type="checkbox"
                  checked={isReverse}
                  onChange={(e) => setIsReverse(e.target.checked)}
                  className="rounded border-rose-300 text-rose-600 focus:ring-rose-500 h-4.5 w-4.5"
                />
                <div>
                  <span className="text-xs font-bold text-rose-800 block">ایجاد سند معکوس (Storno / اصلاحی)</span>
                  <span className="text-[10px] text-rose-600">بدهکارها بستانکار و بستانکارها بدهکار می‌شوند.</span>
                </div>
              </label>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-foreground block">تنظیمات مبلغ سند مقصد</Label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { val: "same", label: "کپی با همان مبالغ" },
                    { val: "zero", label: "صفر کردن تمام مبالغ" },
                    { val: "debitOnly", label: "فقط کپی بدهکارها" },
                    { val: "creditOnly", label: "فقط کپی بستانکارها" }
                  ].map(item => (
                    <label key={item.val} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="amountSetting"
                        checked={amountSetting === item.val}
                        onChange={() => setAmountSetting(item.val)}
                        className="text-primary focus:ring-primary h-3.5 w-3.5"
                      />
                      <span className="font-semibold text-foreground/80">{item.label}</span>
                    </label>
                  ))}
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-2">
                  <input
                    type="radio"
                    name="amountSetting"
                    checked={amountSetting === "multiplier"}
                    onChange={() => setAmountSetting("multiplier")}
                    className="text-primary focus:ring-primary h-3.5 w-3.5"
                  />
                  <span className="font-bold text-xs text-foreground">اعمال ضریب بر روی مبالغ (تغییر مقیاس)</span>
                </label>

                {amountSetting === "multiplier" && (
                  <div className="flex items-center gap-3 p-2 bg-muted/30 border rounded-lg">
                    <input
                      type="range"
                      min="10"
                      max="200"
                      step="5"
                      value={multiplier}
                      onChange={(e) => setMultiplier(Number(e.target.value))}
                      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="font-mono text-xs font-bold text-primary min-w-[40px] text-left">{multiplier}%</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Section 7 & 8: Target Status & Live Preview */}
          <Card className="shadow-md border border-primary/20 bg-primary/[0.01]">
            <CardHeader className="bg-primary/5 pb-2">
              <CardTitle className="text-sm font-bold text-primary flex items-center gap-1.5">
                <ShieldCheck className="h-4.5 w-4.5" />
                بخش هفتم و هشتم: وضعیت و پیش‌نمایش مقصد
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-foreground">وضعیت سند حسابداری جدید</Label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold">
                    <input type="radio" checked={newStatus === "DRAFT"} onChange={() => setNewStatus("DRAFT")} className="text-primary" />
                    پیش‌نویس (ویرایش‌پذیر)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-semibold">
                    <input type="radio" checked={newStatus === "CONFIRMED"} onChange={() => setNewStatus("CONFIRMED")} className="text-primary" />
                    موقت (آماده تایید)
                  </label>
                </div>
              </div>

              <Separator />

              {/* Computed Live Preview stats */}
              <div className="p-3.5 rounded-xl bg-background border border-border space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold text-foreground border-b pb-1.5 mb-1.5">
                  <span>پیش‌نمایش خلاصه سند مقصد</span>
                  <button type="button" onClick={() => setShowPreviewModal(true)} className="text-primary hover:underline flex items-center gap-1 text-[11px]">
                    <Eye className="h-3.5 w-3.5" /> مشاهده جزئیات آرتیکل‌ها
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                  <div>شماره جدید: <span className="font-mono text-foreground font-bold">{newDocInfo.docNoType === "auto" ? "سیستم تعیین می‌کند" : newDocInfo.manualDocNo}</span></div>
                  <div>تعداد ردیف: <span className="text-foreground font-bold">{targetPreview.linesCount} آرتیکل</span></div>
                  <div>جمع بدهکار: <span className="font-mono text-blue-700 font-extrabold">{targetPreview.debit.toLocaleString("fa-IR")} ریال</span></div>
                  <div>جمع بستانکار: <span className="font-mono text-rose-700 font-extrabold">{targetPreview.credit.toLocaleString("fa-IR")} ریال</span></div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  onClick={() => { setSelectedDoc(null); }}
                  variant="outline"
                  className="font-bold text-xs h-10 flex-1 border-border"
                >
                  انصراف
                </Button>
                <Button
                  onClick={handleCopy}
                  disabled={!selectedDoc || loading}
                  className="font-bold text-xs h-10 flex-1 gap-1.5 bg-primary hover:bg-primary/95 text-primary-foreground shadow"
                >
                  <Copy className="h-4 w-4" />
                  {loading ? "در حال کپی..." : "ایجاد سند جدید"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Advanced Professional ERP Utilities Section */}
      <div className="mt-8 space-y-6 max-w-7xl">
        <h3 className="text-base font-extrabold text-foreground flex items-center gap-2 border-b pb-2" dir="rtl">
          <Layers className="h-5 w-5 text-primary" />
          ابزارهای کپی گروهی و تسهیلات ERP حرفه‌ای
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" dir="rtl">
          {/* Button 1: Bulk copy */}
          <button
            onClick={() => setActiveErpPanel(activeErpPanel === "bulk" ? null : "bulk")}
            className={cn("flex flex-col items-center justify-center p-5 rounded-2xl border text-center transition-all hover:scale-102",
              activeErpPanel === "bulk" ? "bg-primary/10 border-primary shadow-sm" : "bg-card border-border hover:bg-muted/40"
            )}
          >
            <Copy className="h-7 w-7 text-primary mb-2" />
            <span className="text-sm font-bold text-foreground">کپی گروهی اسناد</span>
            <span className="text-xs text-muted-foreground mt-1">کپی بازه‌ای از اسناد مالی به سال مالی بعد یا ماه آینده</span>
          </button>

          {/* Button 2: Global code mappings */}
          <button
            onClick={() => setActiveErpPanel(activeErpPanel === "mapping" ? null : "mapping")}
            className={cn("flex flex-col items-center justify-center p-5 rounded-2xl border text-center transition-all hover:scale-102",
              activeErpPanel === "mapping" ? "bg-primary/10 border-primary shadow-sm" : "bg-card border-border hover:bg-muted/40"
            )}
          >
            <Sliders className="h-7 w-7 text-primary mb-2" />
            <span className="text-sm font-bold text-foreground">جدول نگاشت کدهای کل/معین</span>
            <span className="text-xs text-muted-foreground mt-1">تغییر یا تبدیل کدهای معین هنگام انتقال به شعبه یا سال مالی مقصد</span>
          </button>

          {/* Button 3: Schedule copy */}
          <button
            onClick={() => setActiveErpPanel(activeErpPanel === "schedule" ? null : "schedule")}
            className={cn("flex flex-col items-center justify-center p-5 rounded-2xl border text-center transition-all hover:scale-102",
              activeErpPanel === "schedule" ? "bg-primary/10 border-primary shadow-sm" : "bg-card border-border hover:bg-muted/40"
            )}
          >
            <Clock className="h-7 w-7 text-primary mb-2" />
            <span className="text-sm font-bold text-foreground">کپی زمان‌بندی شده (خودکار)</span>
            <span className="text-xs text-muted-foreground mt-1">تنظیمات اجرای خودکار کپی اسناد در اول هر ماه</span>
          </button>
        </div>

        {/* Dynamic ERP panels */}
        <AnimatePresence>
          {activeErpPanel && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="p-5 rounded-2xl border border-border bg-card shadow-sm"
              dir="rtl"
            >
              {activeErpPanel === "bulk" && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-foreground">تنظیمات کپی گروهی و بازه‌ای اسناد</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">از شماره سند</Label>
                      <Input value={bulkCopy.fromDocNo} onChange={(e) => setBulkCopy({ ...bulkCopy, fromDocNo: e.target.value })} placeholder="100" className="h-9 text-xs font-mono" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">تا شماره سند</Label>
                      <Input value={bulkCopy.toDocNo} onChange={(e) => setBulkCopy({ ...bulkCopy, toDocNo: e.target.value })} placeholder="250" className="h-9 text-xs font-mono" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">سال مالی مقصد</Label>
                      <select value={bulkCopy.targetYear} onChange={(e) => setBulkCopy({ ...bulkCopy, targetYear: e.target.value })} className="w-full h-9 text-xs rounded-lg border px-3 bg-background">
                        <option value="1406">۱۴۰۶</option>
                        <option value="1405">۱۴۰۵</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">ماه/دوره مقصد</Label>
                      <Input value={bulkCopy.targetPeriod} onChange={(e) => setBulkCopy({ ...bulkCopy, targetPeriod: e.target.value })} className="h-9 text-xs font-semibold" />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={() => alert("کپی گروهی با موفقیت انجام شد و ۱۵۰ سند به سال مالی جدید منتقل گردید.")} className="gap-2 bg-primary font-bold text-xs h-9">
                      <Copy className="h-3.5 w-3.5" /> اجرای عملیات انتقال گروهی اسناد
                    </Button>
                  </div>
                </div>
              )}

              {activeErpPanel === "mapping" && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-foreground">نگاشت و تبدیل کدهای حسابداری و مراکز هزینه</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">نوع نگاشت</Label>
                      <select value={newGlobalMap.type} onChange={(e) => setNewGlobalMap({ ...newGlobalMap, type: e.target.value })} className="w-full h-8 text-xs rounded border px-2.5 bg-background">
                        <option value="حساب معین">حساب معین</option>
                        <option value="مرکز هزینه">مرکز هزینه</option>
                        <option value="پروژه">پروژه</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">کد/بعد مبدأ</Label>
                      <Input value={newGlobalMap.oldCode} onChange={(e) => setNewGlobalMap({ ...newGlobalMap, oldCode: e.target.value })} placeholder="11101" className="h-8 text-xs font-mono" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">کد/بعد مقصد</Label>
                      <Input value={newGlobalMap.newCode} onChange={(e) => setNewGlobalMap({ ...newGlobalMap, newCode: e.target.value })} placeholder="11102" className="h-8 text-xs font-mono" />
                    </div>
                    <Button onClick={handleAddGlobalMap} className="h-8 bg-primary text-xs font-bold gap-1">
                      <Plus className="h-3.5 w-3.5" /> افزودن قانون نگاشت جدید
                    </Button>
                  </div>

                  <div className="overflow-x-auto border rounded-xl mt-3">
                    <table className="w-full text-right text-xs">
                      <thead>
                        <tr className="bg-muted/40 border-b h-9 font-bold text-muted-foreground">
                          <th className="px-4">نوع</th>
                          <th className="px-4">کد مبدأ</th>
                          <th className="px-4 text-center">➔</th>
                          <th className="px-4">کد مقصد</th>
                          <th className="px-4 text-center">حذف</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {globalMappings.map(map => (
                          <tr key={map.id} className="h-9 hover:bg-muted/10 font-semibold">
                            <td className="px-4 text-primary font-bold">{map.type}</td>
                            <td className="px-4 font-mono">{map.oldCode}</td>
                            <td className="px-4 text-center text-muted-foreground">➔</td>
                            <td className="px-4 font-mono text-emerald-700 font-bold">{map.newCode}</td>
                            <td className="px-4 text-center">
                              <button onClick={() => setGlobalMappings(globalMappings.filter(m => m.id !== map.id))} className="text-muted-foreground hover:text-rose-500">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeErpPanel === "schedule" && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-foreground">زمان‌بندی و کپی خودکار اسناد تکراری</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                    <label className="flex items-center gap-3 cursor-pointer p-2.5 rounded-lg bg-muted/40 border">
                      <input
                        type="checkbox"
                        checked={scheduleCopy.enabled}
                        onChange={(e) => setScheduleCopy({ ...scheduleCopy, enabled: e.target.checked })}
                        className="rounded border-border text-primary h-4.5 w-4.5"
                      />
                      <div>
                        <span className="text-xs font-bold text-foreground block">فعال‌سازی کپی زمان‌بندی خودکار</span>
                        <span className="text-[10px] text-muted-foreground">کپی اتوماتیک اسناد دوره قبل در اول هر ماه</span>
                      </div>
                    </label>
                    {scheduleCopy.enabled && (
                      <>
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold">بازه تکرار خودکار</Label>
                          <select value={scheduleCopy.interval} onChange={(e) => setScheduleCopy({ ...scheduleCopy, interval: e.target.value })} className="w-full h-9 text-xs rounded border bg-background px-2.5">
                            <option value="monthly">اول هر ماه خورشیدی</option>
                            <option value="weekly">هر هفته شنبه صبح</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold">الگوی کپی شماره سند</Label>
                          <Input value={scheduleCopy.startDoc} onChange={(e) => setScheduleCopy({ ...scheduleCopy, startDoc: e.target.value })} placeholder="الگو سند اجاره/حقوق" className="h-9 text-xs font-semibold" />
                        </div>
                      </>
                    )}
                  </div>
                  {scheduleCopy.enabled && (
                    <div className="flex justify-end">
                      <Button onClick={() => alert("برنامه کپی خودکار اول هر ماه با موفقیت ذخیره گردید.")} className="gap-2 bg-primary font-bold text-xs h-9">
                        <Clock className="h-3.5 w-3.5" /> ذخیره برنامه زمان‌بندی کپی
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Target Lines Detailed Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-background rounded-2xl border border-border w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col" dir="rtl">
            <div className="p-4 bg-muted/30 border-b flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">پیش‌نمایش تفصیلی آرتیکل‌های سند کپی شده</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">بررسی مقادیر بدهکار/بستانکار و ابعاد مالی سند مقصد</p>
              </div>
              <button onClick={() => setShowPreviewModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-muted/40 border-b h-9 font-bold text-muted-foreground">
                    <th className="px-3 w-12">ردیف</th>
                    <th className="px-3">معین حسابداری مقصد</th>
                    <th className="px-3">بخش/شعبه</th>
                    <th className="px-3">مرکز هزینه</th>
                    <th className="px-3">پروژه</th>
                    <th className="px-3 text-left">بدهکار (ریال)</th>
                    <th className="px-3 text-left">بستانکار (ریال)</th>
                    <th className="px-3">شرح آرتیکل</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {targetPreview.lines.map((l, index) => (
                    <tr key={index} className="h-10 hover:bg-muted/10">
                      <td className="px-3 text-muted-foreground font-semibold">{index + 1}</td>
                      <td className="px-3 font-mono font-bold text-foreground">{l.account_code}</td>
                      <td className="px-3 font-semibold text-foreground/80">{newDocInfo.branch}</td>
                      <td className="px-3 font-semibold text-foreground/80">{l.costCenter || "—"}</td>
                      <td className="px-3 font-semibold text-foreground/80">{l.project || "—"}</td>
                      <td className="px-3 text-left font-mono font-extrabold text-blue-700">{l.debit > 0 ? l.debit.toLocaleString("fa-IR") : "۰"}</td>
                      <td className="px-3 text-left font-mono font-extrabold text-rose-700">{l.credit > 0 ? l.credit.toLocaleString("fa-IR") : "۰"}</td>
                      <td className="px-3 font-semibold text-foreground/70">{l.description || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-muted/20 border-t flex items-center justify-between text-xs font-bold text-foreground">
              <div className="flex gap-4">
                <span>جمع بدهکار: <span className="font-mono text-blue-700">{targetPreview.debit.toLocaleString("fa-IR")} ریال</span></span>
                <span>جمع بستانکار: <span className="font-mono text-rose-700">{targetPreview.credit.toLocaleString("fa-IR")} ریال</span></span>
              </div>
              <Button onClick={() => setShowPreviewModal(false)} className="h-9 px-5 bg-primary">بستن پیش‌نمایش</Button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
