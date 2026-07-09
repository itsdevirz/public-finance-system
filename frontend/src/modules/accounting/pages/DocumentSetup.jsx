import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { PersianDatePicker } from "@/components/ui/persian-date-picker";
import { Separator } from "@/components/ui/separator";
import {
  Settings, Calculator, FileSpreadsheet, Save, Plus, Trash2, CheckCircle2,
  AlertCircle, Shield, Printer, Workflow, ListPlus, FileCheck, RefreshCw, Eye, AlertTriangle, Play, HelpCircle
} from "lucide-react";
import api from "@/api";
import sanamaCodes from "@/data/sanamaCodes.json";

// Extract groups for the SearchableSelect fields
const allGroups = sanamaCodes.groups.map((g) => ({ code: g.code, title: g.title, accounts: g.accounts }));
const groupOptions = allGroups.map((g) => ({ value: g.code, label: `${g.code} – ${g.title}` }));

function getAccounts(groupCode) {
  const g = allGroups.find((x) => x.code === groupCode);
  return g ? g.accounts : [];
}

function getSubAccounts(groupCode, accountCode) {
  const accounts = getAccounts(groupCode);
  const a = accounts.find((x) => x.code === accountCode);
  return a ? (a.children || []) : [];
}

function formatNumber(val) {
  if (val === null || val === undefined || val === "") return "";
  const clean = val.toString().replace(/,/g, "").replace(/،/g, "");
  const n = parseInt(clean, 10);
  if (isNaN(n)) return "";
  return n.toLocaleString("fa-IR");
}

function parseNumber(str) {
  if (!str) return 0;
  const clean = str.toString().replace(/,/g, "").replace(/،/g, "").replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d));
  return parseInt(clean, 10) || 0;
}

export default function DocumentSetup() {
  const location = useLocation();
  const navigate = useNavigate();
  const today = new Date().toLocaleDateString("fa-IR").replace(/\//g, "/");

  // Determine active tab based on route pathname
  const initialTab = location.pathname.endsWith("/calc-form") ? "calculation" : "settings";
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (location.pathname.endsWith("/calc-form")) {
      setActiveTab("calculation");
    } else {
      setActiveTab("settings");
    }
  }, [location.pathname]);

  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  // ---------------------------------------------------------------------------
  // TAB 1: STATE & HANDLERS (Document Settings)
  // ---------------------------------------------------------------------------
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem("document_settings");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return {
      general: {
        fiscalYear: "1405",
        docType: "روزنامه",
        numberingTemplate: "auto",
        lastDocNo: "125",
        prefix: "1405-",
        length: 6,
        defaultDate: "today"
      },
      statuses: {
        draft: true,
        temporary: true,
        final: true,
        approved: true,
        archived: true,
        reversed: true
      },
      controls: {
        preventUnbalanced: true,
        preventClosedPeriod: true,
        preventClosedYear: true,
        preventInactive: true,
        controlDuplicate: true,
        controlDate: true,
        controlBalance: true
      },
      workflow: {
        needsApproval: true,
        approvalSteps: 3,
        managerApproval: true,
        auditorApproval: false,
        treasurerApproval: true,
        allowReject: true
      },
      printing: {
        stamp: true,
        signature: true,
        qr: true,
        barcode: false,
        logo: true,
        fullDesc: true
      },
      security: {
        editFinal: false,
        deleteDoc: true,
        editAfterApproved: false,
        changeLog: true,
        logIp: true,
        logUser: true
      },
      sanama: {
        docTypeCategory: "financial", // budget, financial, accrual, cash, corrective
        opType: "current",
        executiveBody: "135001 - وزارت امور اقتصادی و دارایی",
        executingUnit: "10 - ستاد مرکزی",
        fundingSource: "1 - منابع عمومی دولت",
        mandatoryDimensions: true,
        separateNumbering: true
      }
    };
  });

  const handleSaveSettings = () => {
    localStorage.setItem("document_settings", JSON.stringify(settings));
    setMessage({ type: "success", text: "تنظیمات اسناد حسابداری با موفقیت ذخیره گردید." });
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => setMessage(null), 5000);
  };

  // ---------------------------------------------------------------------------
  // TAB 2: STATE & HANDLERS (Document Register Form)
  // ---------------------------------------------------------------------------
  const [docHeader, setDocHeader] = useState({
    docNo: `${settings.general.prefix}${String(Number(settings.general.lastDocNo) + 1).padStart(settings.general.length, "0")}`,
    docDate: today,
    docType: settings.general.docType,
    branch: "شعبه مرکزی تهران",
    orgUnit: "امور مالی ستاد",
    desc: "ثبت سند تعدیلات پایان دوره مالی",
    status: "موقت"
  });

  const [docLines, setDocLines] = useState([
    { id: 1, group: "1", account: "110", subAccount: "11001", costCenter: "بخش اداری", project: "طرح فناوری اطلاعات", debit: "15,000,000", credit: "", desc: "واریز تنخواه گردان بخش مالی" },
    { id: 2, group: "2", account: "210", subAccount: "21005", costCenter: "امور کارکنان", project: "طرح فناوری اطلاعات", debit: "", credit: "15,000,000", desc: "پرداخت بابت مساعده" }
  ]);

  const [attachments, setAttachments] = useState([
    { id: 1, name: "invoice_1092.pdf", size: "1.4 MB", type: "pdf" },
    { id: 2, name: "signed_contract.jpg", size: "850 KB", type: "image" }
  ]);

  const totalDebit = useMemo(() => docLines.reduce((sum, line) => sum + parseNumber(line.debit), 0), [docLines]);
  const totalCredit = useMemo(() => docLines.reduce((sum, line) => sum + parseNumber(line.credit), 0), [docLines]);
  const difference = totalDebit - totalCredit;

  const addDocLine = () => {
    setDocLines([...docLines, {
      id: Date.now(),
      group: "",
      account: "",
      subAccount: "",
      costCenter: "",
      project: "",
      debit: "",
      credit: "",
      desc: ""
    }]);
  };

  const removeDocLine = (id) => {
    if (docLines.length === 1) return;
    setDocLines(docLines.filter(line => line.id !== id));
  };

  const updateDocLine = (id, field, value) => {
    setDocLines(docLines.map(line => {
      if (line.id !== id) return line;
      const updated = { ...line, [field]: value };
      if (field === "group") {
        updated.account = "";
        updated.subAccount = "";
      } else if (field === "account") {
        updated.subAccount = "";
      }
      return updated;
    }));
  };

  const handleRegisterDoc = async () => {
    if (settings.controls.preventUnbalanced && difference !== 0) {
      setMessage({ type: "error", text: "خطا: جلوگیری از ثبت سند نامتوازن فعال است. اختلاف باید صفر باشد." });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const payload = {
        document_type: docHeader.docType === "افتتاحیه" || docHeader.docType === "اختتامیه" ? "CLOSING" : "GENERAL_PAYMENT",
        fiscal_year: Number(settings.general.fiscalYear),
        status: docHeader.status === "موقت" ? "DRAFT" : "CONFIRMED",
        document_date: docHeader.docDate,
        description: docHeader.desc,
        lines: docLines.map(l => ({
          account_code: l.subAccount || "11001",
          debit: parseNumber(l.debit),
          credit: parseNumber(l.credit),
          description: l.desc
        }))
      };

      // Mock DB save since database might require encrypted ciphertext, or do regular post
      const res = await api.post("/api/documents", payload);
      if (res.data?.success || res.status === 201) {
        // Increment document number settings
        const nextNo = String(Number(settings.general.lastDocNo) + 1);
        setSettings(s => ({
          ...s,
          general: { ...s.general, lastDocNo: nextNo }
        }));
        localStorage.setItem("document_settings", JSON.stringify({
          ...settings,
          general: { ...settings.general, lastDocNo: nextNo }
        }));

        setMessage({
          type: "success",
          text: `سند حسابداری با شماره ${res.data.data?.document_number || docHeader.docNo} با موفقیت در سامانه ثبت گردید.`
        });

        // Clear registry lines
        setDocLines([
          { id: 1, group: "", account: "", subAccount: "", costCenter: "", project: "", debit: "", credit: "", desc: "" },
          { id: 2, group: "", account: "", subAccount: "", costCenter: "", project: "", debit: "", credit: "", desc: "" }
        ]);
        setDocHeader(h => ({
          ...h,
          docNo: `${settings.general.prefix}${String(Number(nextNo) + 1).padStart(settings.general.length, "0")}`
        }));
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: err.response?.data?.message || "خطا در ثبت سند در سرور. ارتباط را بررسی کنید." });
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // TAB 3: STATE & HANDLERS (Calculation Operation Form)
  // ---------------------------------------------------------------------------
  const [calcForm, setCalcForm] = useState({
    opType: "payroll",
    period: "monthly",
    execDate: today,
    orgUnit: "شعبه مرکزی تهران",
    scope: "all",
    method: "auto",
    formula: "[کارکرد] * [حقوق پایه روزانه] - [کسورات بیمه و مالیات]",
    autoCreate: true
  });

  const [isCalculated, setIsCalculated] = useState(false);
  const [calcResults, setCalcResults] = useState([]);
  const [calcErrors, setCalcErrors] = useState([]);
  const [generatedDocNo, setGeneratedDocNo] = useState("");

  const handleRunCalculation = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setIsCalculated(true);
      if (calcForm.opType === "payroll") {
        setCalcResults([
          { id: 1, detail: "امیرحسین باقری (مدیریت فناوری)", baseVal: "۴۵,۰۰۰,۰۰۰", rate: "۷٪ بیمه", resultVal: "۳,۱۵۰,۰۰۰", type: "کسور بیمه سهم کارمند" },
          { id: 2, detail: "زهرا منصوری (بخش حسابداری)", baseVal: "۳۸,۰۰۰,۰۰۰", rate: "۱۰٪ مالیات", resultVal: "۳,۸۰۰,۰۰۰", type: "مالیات حقوق متعلقه" },
          { id: 3, detail: "سعید عباسی (خدمات پشتیبانی)", baseVal: "۲۸,۰۰۰,۰۰۰", rate: "حقوق پایه", resultVal: "۲۸,۰۰۰,۰۰۰", type: "حقوق ناخالص پرداختنی" }
        ]);
        setCalcErrors([
          { type: "info", text: "محاسبه حقوق و مزایا بر اساس ۳ نفر پرسنل فعال انجام شد." },
          { type: "warning", text: "اطلاعات مالیاتی کدملی شماره ۰۰۱۸۸۳۲۷۶۱ در سیستم بیمه ناقص است، اما محاسبه انجام شد." }
        ]);
      } else if (calcForm.opType === "depreciation") {
        setCalcResults([
          { id: 1, detail: "خودرو سواری پژو پارس (پلاک ۴۴ب۸۸)", baseVal: "۸۰۰,۰۰۰,۰۰۰", rate: "۲۰٪ نزولی", resultVal: "۱۳,۳۳۳,۳۳۳", type: "هزینه استهلاک وسایط نقلیه" },
          { id: 2, detail: "ساختمان مرکزی اداری", baseVal: "۷,۵۰۰,۰۰۰,۰۰۰", rate: "۵٪ مستقیم", resultVal: "۳۱,۲۵۰,۰۰۰", type: "هزینه استهلاک ساختمان" },
          { id: 3, detail: "تجهیزات رایانه‌ای واحد مالی", baseVal: "۱۲۰,۰۰۰,۰۰۰", rate: "۳۳٪ مستقیم", resultVal: "۳,۳۰۰,۰۰۰", type: "هزینه استهلاک نرم‌افزار و رایانه" }
        ]);
        setCalcErrors([
          { type: "info", text: "استهلاک کل دارایی‌های ثابت مشهود شعبه مرکزی محاسبه شد." }
        ]);
      } else if (calcForm.opType === "tax") {
        setCalcResults([
          { id: 1, detail: "درآمدهای مشمول مالیات تیرماه", baseVal: "۱,۲۰۰,۰۰۰,۰۰۰", rate: "۹٪ ارزش افزوده", resultVal: "۱۰۸,۰۰۰,۰۰۰", type: "مالیات و عوارض ارزش افزوده فروش" }
        ]);
        setCalcErrors([
          { type: "info", text: "مالیات بر ارزش افزوده فروش با موفقیت استخراج شد." }
        ]);
      } else {
        setCalcResults([
          { id: 1, detail: "موجودی ارزی صندوق دلاری", baseVal: "۵۰,۰۰۰ $", rate: "۵۲۰,۰۰۰ نرخ تسعیر", resultVal: "۱,۰۰۰,۰۰۰,۰۰۰", type: "سود حاصل از تسعیر ارز" }
        ]);
        setCalcErrors([
          { type: "info", text: "نرخ تسعیر ارز بانک مرکزی در تاریخ اجرا اعمال گردید." }
        ]);
      }
    }, 800);
  };

  const handleGenerateCalcDoc = async () => {
    setLoading(true);
    try {
      // Form generated lines based on calculation results
      let lines = [];
      if (calcForm.opType === "payroll") {
        lines = [
          { account_code: "21005", debit: 0, credit: 28000000, description: "حقوق و مزایای پرداختنی پرسنل" },
          { account_code: "24001", debit: 0, credit: 3150000, description: "بیمه پرداختنی سهم کارمند" },
          { account_code: "24004", debit: 0, credit: 3800000, description: "مالیات حقوق پرداختنی" },
          { account_code: "11001", debit: 34950000, credit: 0, description: "هزینه حقوق و دستمزد ناخالص" }
        ];
      } else if (calcForm.opType === "depreciation") {
        lines = [
          { account_code: "15040", debit: 0, credit: 47883333, description: "استهلاک انباشته دارایی‌های ثابت" },
          { account_code: "11021", debit: 47883333, credit: 0, description: "هزینه استهلاک دارایی‌های ثابت مشهود" }
        ];
      } else {
        lines = [
          { account_code: "11001", debit: 10000000, credit: 0, description: "حساب معادل سود و زیان تسعیر" },
          { account_code: "11019", debit: 0, credit: 10000000, description: "سود حاصل از تسعیر موجودی ارزی" }
        ];
      }

      const payload = {
        document_type: "GENERAL_PAYMENT",
        fiscal_year: Number(settings.general.fiscalYear),
        status: "DRAFT",
        document_date: calcForm.execDate,
        description: `صدور سند خودکار حاصل از محاسبات ${
          calcForm.opType === "payroll" ? "حقوق و دستمزد" :
          calcForm.opType === "depreciation" ? "استهلاک دارایی‌ها" :
          calcForm.opType === "tax" ? "مالیات" : "تسعیر ارز"
        } دوره ${calcForm.period === "monthly" ? "ماهانه" : calcForm.period === "quarterly" ? "فصلی" : "سالانه"}`,
        lines: lines
      };

      const res = await api.post("/api/documents", payload);
      if (res.data?.success || res.status === 201) {
        setGeneratedDocNo(res.data.data?.document_number || `DOC-CALC-${Date.now()}`);
        setMessage({
          type: "success",
          text: `سند حسابداری با موفقیت به شماره ${res.data.data?.document_number} صادر گردید.`
        });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "خطا در برقراری ارتباط با پایگاه داده جهت صدور سند محاسباتی." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell>
      <PageHeader
        title="تنظیم اسناد و محاسبات مالی"
        description="تنظیمات جامع سند حسابداری، بررسی توازن و مانده، صدور سند دستی و فرم هوشمند محاسبه و استهلاک"
      />

      {/* Alert Messages */}
      {message && (
        <div
          dir="rtl"
          className={`mb-6 flex items-start gap-3 rounded-xl border p-4 text-sm animate-in fade-in slide-in-from-top-3 duration-300 ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50/70 text-emerald-800"
              : "border-rose-200 bg-rose-50/70 text-rose-800"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
          )}
          <div className="flex-1 font-semibold">{message.text}</div>
          <button
            onClick={() => setMessage(null)}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            بستن
          </button>
        </div>
      )}

      {/* Tabs Selector */}
      <div className="mb-6 flex border-b border-border" dir="rtl">
        <button
          onClick={() => { setActiveTab("settings"); navigate("/document-setup"); }}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-semibold transition-all duration-300 ${
            activeTab === "settings"
              ? "border-primary text-primary font-bold bg-primary/5"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
          }`}
        >
          <Settings className="h-4 w-4" />
          ۱. تنظیمات اسناد حسابداری
        </button>
        <button
          onClick={() => { setActiveTab("registry"); }}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-semibold transition-all duration-300 ${
            activeTab === "registry"
              ? "border-primary text-primary font-bold bg-primary/5"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
          }`}
        >
          <FileSpreadsheet className="h-4 w-4" />
          ۲. فرم ثبت (محاسبه) سند
        </button>
        <button
          onClick={() => { setActiveTab("calculation"); navigate("/document-setup/calc-form"); }}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-semibold transition-all duration-300 ${
            activeTab === "calculation"
              ? "border-primary text-primary font-bold bg-primary/5"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
          }`}
        >
          <Calculator className="h-4 w-4" />
          ۳. فرم محاسبه عملیات مالی
        </button>
      </div>

      <div dir="rtl">
        {/* =====================================================================
            TAB 1: DOCUMENT SETUP SETTINGS
            ===================================================================== */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* General Settings */}
              <Card className="shadow-md border border-border">
                <CardHeader className="bg-muted/20 pb-3">
                  <CardTitle className="flex items-center gap-2 text-base text-foreground font-bold">
                    <ListPlus className="h-4 w-4 text-primary" />
                    اطلاعات عمومی و شماره‌گذاری اسناد
                  </CardTitle>
                  <CardDescription>قوانین مربوط به سال مالی و الگوهای شماره‌گذاری</CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-foreground">سال مالی فعال</Label>
                      <select
                        value={settings.general.fiscalYear}
                        onChange={(e) => setSettings({
                          ...settings,
                          general: { ...settings.general, fiscalYear: e.target.value }
                        })}
                        className="w-full h-9 text-xs rounded-lg border border-input bg-background px-3 font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="1405">۱۴۰۵ (سال مالی جاری)</option>
                        <option value="1404">۱۴۰۴</option>
                        <option value="1403">۱۴۰۳</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-foreground">نوع سند پیش‌فرض</Label>
                      <select
                        value={settings.general.docType}
                        onChange={(e) => setSettings({
                          ...settings,
                          general: { ...settings.general, docType: e.target.value }
                        })}
                        className="w-full h-9 text-xs rounded-lg border border-input bg-background px-3 font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="روزنامه">روزنامه (عمومی)</option>
                        <option value="افتتاحیه">افتتاحیه</option>
                        <option value="اختتامیه">اختتامیه</option>
                        <option value="اصلاحی">اصلاحی</option>
                        <option value="بودجه">بودجه</option>
                        <option value="تعدیل">تعدیل</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground block">قالب شماره سند</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setSettings({
                          ...settings,
                          general: { ...settings.general, numberingTemplate: "auto" }
                        })}
                        className={`py-2 px-3 text-xs rounded-lg border text-center transition-all ${
                          settings.general.numberingTemplate === "auto"
                            ? "bg-primary/10 border-primary text-primary font-bold"
                            : "bg-background border-border text-muted-foreground hover:bg-muted/40"
                        }`}
                      >
                        شماره‌گذاری خودکار سیستم
                      </button>
                      <button
                        onClick={() => setSettings({
                          ...settings,
                          general: { ...settings.general, numberingTemplate: "manual" }
                        })}
                        className={`py-2 px-3 text-xs rounded-lg border text-center transition-all ${
                          settings.general.numberingTemplate === "manual"
                            ? "bg-primary/10 border-primary text-primary font-bold"
                            : "bg-background border-border text-muted-foreground hover:bg-muted/40"
                        }`}
                      >
                        شماره‌گذاری دستی کاربر
                      </button>
                    </div>
                  </div>

                  {settings.general.numberingTemplate === "auto" && (
                    <div className="p-4 rounded-xl bg-muted/30 border border-dashed border-border space-y-3">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-muted-foreground">پیش‌شماره الگو</Label>
                          <Input
                            value={settings.general.prefix}
                            onChange={(e) => setSettings({
                              ...settings,
                              general: { ...settings.general, prefix: e.target.value }
                            })}
                            className="h-8 text-xs font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-muted-foreground">طول شماره</Label>
                          <Input
                            type="number"
                            value={settings.general.length}
                            onChange={(e) => setSettings({
                              ...settings,
                              general: { ...settings.general, length: Number(e.target.value) }
                            })}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-muted-foreground">شروع شماره از</Label>
                          <Input
                            type="number"
                            value={settings.general.lastDocNo}
                            onChange={(e) => setSettings({
                              ...settings,
                              general: { ...settings.general, lastDocNo: e.target.value }
                            })}
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        الگوی شماره فعلی: <span className="font-mono text-primary font-bold">{settings.general.prefix}{String(Number(settings.general.lastDocNo) + 1).padStart(settings.general.length, "0")}</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-foreground">تاریخ پیش‌فرض ثبت سند</Label>
                    <select
                      value={settings.general.defaultDate}
                      onChange={(e) => setSettings({
                        ...settings,
                        general: { ...settings.general, defaultDate: e.target.value }
                      })}
                      className="w-full h-9 text-xs rounded-lg border border-input bg-background px-3 font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="today">تاریخ روز سیستم ({today})</option>
                      <option value="last">آخرین تاریخ ثبت‌شده در اسناد قبلی</option>
                    </select>
                  </div>
                </CardContent>
              </Card>

              {/* Posting Controls */}
              <Card className="shadow-md border border-border">
                <CardHeader className="bg-muted/20 pb-3">
                  <CardTitle className="flex items-center gap-2 text-base text-foreground font-bold">
                    <Shield className="h-4 w-4 text-primary" />
                    کنترل‌های ثبت و امنیت اسناد
                  </CardTitle>
                  <CardDescription>تعیین فیلترها و قوانین سخت‌گیرانه برای جلوگیری از خطای حسابداری</CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="space-y-3">
                    <Label className="text-xs font-bold text-foreground block mb-1">کنترل‌های اعتبارسنجی سند</Label>
                    <div className="space-y-2">
                      {[
                        { key: "preventUnbalanced", label: "جلوگیری از ثبت سند نامتوازن (مغایرت غیر صفر)" },
                        { key: "preventClosedPeriod", label: "جلوگیری از ثبت سند در دوره یا ماه بسته شده" },
                        { key: "preventClosedYear", label: "جلوگیری از ثبت سند در سال مالی بسته شده" },
                        { key: "preventInactive", label: "جلوگیری از ثبت روی حساب‌های غیرفعال یا معلق" },
                        { key: "controlDuplicate", label: "کنترل تکراری بودن شماره سند (در کل سیستم)" },
                        { key: "controlDate", label: "کنترل تاریخ سند با محدوده تاریخ سال مالی" },
                        { key: "controlBalance", label: "کنترل مانده حساب‌های دارای ماهیت محدود (بدهکار/بستانکار)" }
                      ].map((ctrl) => (
                        <label key={ctrl.key} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.controls[ctrl.key]}
                            onChange={(e) => setSettings({
                              ...settings,
                              controls: { ...settings.controls, [ctrl.key]: e.target.checked }
                            })}
                            className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                          />
                          <span className="text-xs font-semibold text-foreground/80">{ctrl.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Workflow & Printing Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Workflow approval */}
              <Card className="shadow-md border border-border">
                <CardHeader className="bg-muted/20 pb-3">
                  <CardTitle className="flex items-center gap-2 text-base text-foreground font-bold">
                    <Workflow className="h-4 w-4 text-primary" />
                    گردش کار و سلسله مراتب تأییدات
                  </CardTitle>
                  <CardDescription>مدیریت تایید چندمرحله‌ای برای نهایی شدن قطعی سند</CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.workflow.needsApproval}
                      onChange={(e) => setSettings({
                        ...settings,
                        workflow: { ...settings.workflow, needsApproval: e.target.checked }
                      })}
                      className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                    />
                    <span className="text-xs font-bold text-foreground">نیاز به تأییدیه چند مرحله‌ای جهت قطعی شدن</span>
                  </label>

                  {settings.workflow.needsApproval && (
                    <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold text-muted-foreground">تعداد مراحل تأیید سند</Label>
                        <Input
                          type="number"
                          value={settings.workflow.approvalSteps}
                          onChange={(e) => setSettings({
                            ...settings,
                            workflow: { ...settings.workflow, approvalSteps: Number(e.target.value) }
                          })}
                          className="h-8 w-20 text-center text-xs"
                        />
                      </div>
                      <Separator className="my-2" />
                      <div className="space-y-2">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.workflow.managerApproval}
                            onChange={(e) => setSettings({
                              ...settings,
                              workflow: { ...settings.workflow, managerApproval: e.target.checked }
                            })}
                            className="rounded border-border text-primary focus:ring-primary h-4.5 w-4.5"
                          />
                          <span className="text-xs font-semibold text-foreground/80">مرحله ۱: تأیید مدیر مالی سازمان</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.workflow.auditorApproval}
                            onChange={(e) => setSettings({
                              ...settings,
                              workflow: { ...settings.workflow, auditorApproval: e.target.checked }
                            })}
                            className="rounded border-border text-primary focus:ring-primary h-4.5 w-4.5"
                          />
                          <span className="text-xs font-semibold text-foreground/80">مرحله ۲: تأیید حسابرس داخلی</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.workflow.treasurerApproval}
                            onChange={(e) => setSettings({
                              ...settings,
                              workflow: { ...settings.workflow, treasurerApproval: e.target.checked }
                            })}
                            className="rounded border-border text-primary focus:ring-primary h-4.5 w-4.5"
                          />
                          <span className="text-xs font-semibold text-foreground/80">مرحله ۳: تأیید ذی‌حساب / خزانه‌دار</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.workflow.allowReject}
                            onChange={(e) => setSettings({
                              ...settings,
                              workflow: { ...settings.workflow, allowReject: e.target.checked }
                            })}
                            className="rounded border-border text-primary focus:ring-primary h-4.5 w-4.5"
                          />
                          <span className="text-xs font-semibold text-foreground/80">امکان رد سند و بازگشت به مرحله تدوین (اصلاح سند)</span>
                        </label>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Print settings & security */}
              <Card className="shadow-md border border-border">
                <CardHeader className="bg-muted/20 pb-3">
                  <CardTitle className="flex items-center gap-2 text-base text-foreground font-bold">
                    <Printer className="h-4 w-4 text-primary" />
                    تنظیمات امنیتی و الگوهای چاپ
                  </CardTitle>
                  <CardDescription>تعیین فیلدهای مجاز خروجی چاپی و مجوزهای ویرایشی</CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground block">قالب امنیتی و ردپا (Audit Log)</Label>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      {[
                        { key: "editFinal", label: "ویرایش سند قطعی شده" },
                        { key: "deleteDoc", label: "امکان حذف کامل سند" },
                        { key: "editAfterApproved", label: "اصلاح سند بعد از تایید" },
                        { key: "changeLog", label: "ثبت تاریخچه تغییرات" },
                        { key: "logIp", label: "ثبت IP کاربر" },
                        { key: "logUser", label: "ثبت کد ملی و شناسه کاربر" }
                      ].map((item) => (
                        <label key={item.key} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.security[item.key]}
                            onChange={(e) => setSettings({
                              ...settings,
                              security: { ...settings.security, [item.key]: e.target.checked }
                            })}
                            className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                          />
                          <span className="text-xs font-semibold text-foreground/80">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <Separator className="my-2" />

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground block">تنظیمات پیش‌فرض چاپ اسناد</Label>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      {[
                        { key: "stamp", label: "چاپ مهر سازمان" },
                        { key: "signature", label: "چاپ کادرهای امضا" },
                        { key: "qr", label: "چاپ QR Code رهگیری" },
                        { key: "barcode", label: "چاپ بارکد شماره سند" },
                        { key: "logo", label: "چاپ لوگو وزارتخانه" },
                        { key: "fullDesc", label: "چاپ شرح تفصیلی آرتیکل‌ها" }
                      ].map((item) => (
                        <label key={item.key} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.printing[item.key]}
                            onChange={(e) => setSettings({
                              ...settings,
                              printing: { ...settings.printing, [item.key]: e.target.checked }
                            })}
                            className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                          />
                          <span className="text-xs font-semibold text-foreground/80">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Public Sector / SANAMA 3.1 Settings */}
            <Card className="shadow-md border border-primary/20 bg-primary/[0.01]">
              <CardHeader className="bg-primary/5 pb-3">
                <CardTitle className="flex items-center gap-2 text-base text-primary font-bold">
                  <FileCheck className="h-4 w-4" />
                  ابعاد و الزامات سامانه سناما ۳.۱ (نظام حسابداری بخش عمومی)
                </CardTitle>
                <CardDescription>تعیین تنظیمات اختصاصی منطبق بر قوانین دیوان محاسبات و سناما</CardDescription>
              </CardHeader>
              <CardContent className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-foreground">نوع سند سناما</Label>
                    <select
                      value={settings.sanama.docTypeCategory}
                      onChange={(e) => setSettings({
                        ...settings,
                        sanama: { ...settings.sanama, docTypeCategory: e.target.value }
                      })}
                      className="w-full h-9 text-xs rounded-lg border border-input bg-background px-3 font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="financial">سند مالی (تعهدی)</option>
                      <option value="budget">سند بودجه‌ای</option>
                      <option value="accrual">سند تعهدی غیرنقدی</option>
                      <option value="cash">سند نقدی خالص</option>
                      <option value="corrective">سند اصلاحی سناما</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-foreground">دستگاه اجرایی پیش‌فرض</Label>
                    <Input
                      value={settings.sanama.executiveBody}
                      onChange={(e) => setSettings({
                        ...settings,
                        sanama: { ...settings.sanama, executiveBody: e.target.value }
                      })}
                      className="h-9 text-xs font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-foreground">منبع تأمین اعتبار پیش‌فرض</Label>
                    <select
                      value={settings.sanama.fundingSource}
                      onChange={(e) => setSettings({
                        ...settings,
                        sanama: { ...settings.sanama, fundingSource: e.target.value }
                      })}
                      className="w-full h-9 text-xs rounded-lg border border-input bg-background px-3 font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="1">۱ - منابع عمومی دولت</option>
                      <option value="2">۲ - درآمدهای اختصاصی دستگاه</option>
                      <option value="3">۳ - وجوه سپرده قانون ثبت</option>
                      <option value="4">۴ - سایر منابع مالی اختصاصی</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 mt-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.sanama.mandatoryDimensions}
                      onChange={(e) => setSettings({
                        ...settings,
                        sanama: { ...settings.sanama, mandatoryDimensions: e.target.checked }
                      })}
                      className="rounded border-border text-primary focus:ring-primary h-4.5 w-4.5"
                    />
                    <span className="text-xs font-semibold text-foreground/80">کنترل اجباری ابعاد حسابداری (طرح، برنامه، مرکز هزینه، منبع مالی) در آرتیکل‌ها</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.sanama.separateNumbering}
                      onChange={(e) => setSettings({
                        ...settings,
                        sanama: { ...settings.sanama, separateNumbering: e.target.checked }
                      })}
                      className="rounded border-border text-primary focus:ring-primary h-4.5 w-4.5"
                    />
                    <span className="text-xs font-semibold text-foreground/80">تنظیمات شماره‌گذاری مجزا و مستقل برای هر نوع سند (بودجه‌ای، مالی، جاری)</span>
                  </label>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end pt-4 pb-10">
              <Button
                onClick={handleSaveSettings}
                className="gap-2 bg-primary hover:bg-primary/95 text-primary-foreground font-bold px-6 h-10 shadow-lg"
              >
                <Save className="h-4.5 w-4.5" />
                ذخیره تنظیمات اسناد مالی
              </Button>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 2: DOCUMENT REGISTRY & REAL-TIME BALANCING FORM
            ===================================================================== */}
        {activeTab === "registry" && (
          <div className="space-y-6">
            {/* Header section */}
            <Card className="shadow-md border border-border">
              <CardHeader className="bg-muted/10 pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold text-foreground">اطلاعات عمومی سند حسابداری</CardTitle>
                  <Badge className="bg-blue-100 text-blue-800 border border-blue-200">وضعیت سند: {docHeader.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-foreground">شماره سند</Label>
                    <Input
                      disabled={settings.general.numberingTemplate === "auto"}
                      value={docHeader.docNo}
                      onChange={(e) => setDocHeader({ ...docHeader, docNo: e.target.value })}
                      className="h-9 text-xs font-mono font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-foreground">تاریخ سند</Label>
                    <PersianDatePicker
                      value={docHeader.docDate}
                      onChange={(e) => setDocHeader({ ...docHeader, docDate: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-foreground">نوع سند</Label>
                    <select
                      value={docHeader.docType}
                      onChange={(e) => setDocHeader({ ...docHeader, docType: e.target.value })}
                      className="w-full h-9 text-xs rounded-lg border border-input bg-background px-3 font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="روزنامه">روزنامه (عمومی)</option>
                      <option value="افتتاحیه">افتتاحیه</option>
                      <option value="اختتامیه">اختتامیه</option>
                      <option value="اصلاحی">اصلاحی</option>
                      <option value="بودجه">بودجه</option>
                      <option value="تعدیل">تعدیل</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-foreground">شعبه صادر کننده</Label>
                    <Input
                      value={docHeader.branch}
                      onChange={(e) => setDocHeader({ ...docHeader, branch: e.target.value })}
                      className="h-9 text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-foreground">واحد سازمانی مجری</Label>
                    <Input
                      value={docHeader.orgUnit}
                      onChange={(e) => setDocHeader({ ...docHeader, orgUnit: e.target.value })}
                      className="h-9 text-xs font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-foreground">شرح کلی سند</Label>
                    <Input
                      value={docHeader.desc}
                      onChange={(e) => setDocHeader({ ...docHeader, desc: e.target.value })}
                      className="h-9 text-xs font-semibold"
                    />
                  </div>
                </div>

                {/* SANAMA dimensional parameters */}
                <div className="mt-4 p-4 rounded-xl bg-primary/[0.02] border border-primary/10 grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="sm:col-span-2">
                    <span className="text-[10px] font-bold text-primary block mb-1">دستگاه اجرایی (سناما)</span>
                    <span className="text-xs font-medium text-foreground/80">{settings.sanama.executiveBody}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-primary block mb-1">واحد مجری (سناما)</span>
                    <span className="text-xs font-medium text-foreground/80">{settings.sanama.executingUnit}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-primary block mb-1">منبع تأمین اعتبار (سناما)</span>
                    <span className="text-xs font-medium text-foreground/80">{settings.sanama.fundingSource}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Line Items Table (آرتیکل‌ها) */}
            <Card className="shadow-md border border-border overflow-hidden">
              <CardHeader className="bg-muted/10 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold text-foreground">جزئیات آرتیکل‌های سند حسابداری</CardTitle>
                  <Button
                    onClick={addDocLine}
                    size="sm"
                    className="gap-1 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold h-8"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    افزودن ردیف آرتیکل
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1000px] border-collapse text-right text-xs">
                    <thead>
                      <tr className="bg-muted/40 border-b border-border text-muted-foreground font-bold h-10">
                        <th className="px-3 w-10 text-center">ردیف</th>
                        <th className="px-3 w-48">گروه / کل حساب</th>
                        <th className="px-3 w-60">حساب معین</th>
                        <th className="px-3 w-40">مرکز هزینه</th>
                        <th className="px-3 w-40">پروژه</th>
                        <th className="px-3 w-36">بدهکار (ریال)</th>
                        <th className="px-3 w-36">بستانکار (ریال)</th>
                        <th className="px-3">شرح آرتیکل</th>
                        <th className="px-3 w-12 text-center">حذف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {docLines.map((line, index) => (
                        <tr key={line.id} className="hover:bg-muted/10 h-11 transition-colors">
                          <td className="px-3 text-center text-muted-foreground font-semibold">{index + 1}</td>
                          <td className="px-3">
                            <div className="grid grid-cols-2 gap-1.5">
                              <select
                                value={line.group}
                                onChange={(e) => updateDocLine(line.id, "group", e.target.value)}
                                className="h-8 text-xs rounded border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                              >
                                <option value="">گروه...</option>
                                {groupOptions.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                              </select>
                              <select
                                value={line.account}
                                disabled={!line.group}
                                onChange={(e) => updateDocLine(line.id, "account", e.target.value)}
                                className="h-8 text-xs rounded border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                              >
                                <option value="">کل...</option>
                                {getAccounts(line.group).map(a => <option key={a.code} value={a.code}>{a.code} - {a.title}</option>)}
                              </select>
                            </div>
                          </td>
                          <td className="px-3">
                            <select
                              value={line.subAccount}
                              disabled={!line.account}
                              onChange={(e) => updateDocLine(line.id, "subAccount", e.target.value)}
                              className="w-full h-8 text-xs rounded border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
                            >
                              <option value="">معین را انتخاب کنید...</option>
                              {getSubAccounts(line.group, line.account).map(s => <option key={s.code} value={s.code}>{s.code} - {s.title}</option>)}
                            </select>
                          </td>
                          <td className="px-3">
                            <input
                              type="text"
                              value={line.costCenter}
                              onChange={(e) => updateDocLine(line.id, "costCenter", e.target.value)}
                              className="h-8 text-xs rounded border border-input bg-background px-2 w-full focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                              placeholder="مرکز هزینه..."
                            />
                          </td>
                          <td className="px-3">
                            <input
                              type="text"
                              value={line.project}
                              onChange={(e) => updateDocLine(line.id, "project", e.target.value)}
                              className="h-8 text-xs rounded border border-input bg-background px-2 w-full focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                              placeholder="پروژه..."
                            />
                          </td>
                          <td className="px-3">
                            <input
                              type="text"
                              value={line.debit}
                              onChange={(e) => updateDocLine(line.id, "debit", e.target.value)}
                              onBlur={(e) => updateDocLine(line.id, "debit", formatNumber(e.target.value))}
                              className="h-8 text-xs font-mono text-left rounded border border-input bg-background px-2 w-full focus:outline-none focus:ring-1 focus:ring-primary text-blue-700 font-bold"
                              dir="ltr"
                              placeholder="0"
                            />
                          </td>
                          <td className="px-3">
                            <input
                              type="text"
                              value={line.credit}
                              onChange={(e) => updateDocLine(line.id, "credit", e.target.value)}
                              onBlur={(e) => updateDocLine(line.id, "credit", formatNumber(e.target.value))}
                              className="h-8 text-xs font-mono text-left rounded border border-input bg-background px-2 w-full focus:outline-none focus:ring-1 focus:ring-primary text-rose-700 font-bold"
                              dir="ltr"
                              placeholder="0"
                            />
                          </td>
                          <td className="px-3">
                            <input
                              type="text"
                              value={line.desc}
                              onChange={(e) => updateDocLine(line.id, "desc", e.target.value)}
                              className="h-8 text-xs rounded border border-input bg-background px-2 w-full focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
                              placeholder="شرح جزئی آرتیکل..."
                            />
                          </td>
                          <td className="px-3 text-center">
                            <button
                              disabled={docLines.length === 1}
                              onClick={() => removeDocLine(line.id)}
                              className="text-muted-foreground hover:text-rose-500 disabled:opacity-30 disabled:hover:text-muted-foreground transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Calculations Summary Section */}
                <div className="flex flex-col sm:flex-row items-center justify-between border-t border-border bg-muted/20 p-4 gap-4">
                  <div className="flex items-center gap-6 text-xs flex-wrap font-semibold text-foreground/80">
                    <div>
                      جمع بدهکار: <span className="font-mono text-blue-700 text-sm font-extrabold">{totalDebit.toLocaleString("fa-IR")} ریال</span>
                    </div>
                    <div>
                      جمع بستانکار: <span className="font-mono text-rose-700 text-sm font-extrabold">{totalCredit.toLocaleString("fa-IR")} ریال</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>اختلاف:</span>
                      <span className={`font-mono text-sm font-extrabold px-2 py-0.5 rounded ${
                        difference === 0
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}>
                        {Math.abs(difference).toLocaleString("fa-IR")} ریال
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {difference === 0 ? (
                      <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-3 py-1 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        سند تراز است
                      </Badge>
                    ) : (
                      <Badge className="bg-rose-100 text-rose-800 border border-rose-300 font-bold px-3 py-1 flex items-center gap-1 animate-pulse">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        سند تراز نیست!
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attachments & Approvals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Attachments Section */}
              <Card className="shadow-md border border-border">
                <CardHeader className="bg-muted/10 pb-3">
                  <CardTitle className="text-sm font-bold text-foreground">پیوست‌های سند حسابداری</CardTitle>
                  <CardDescription>مدارک مثبته، اسکن فاکتور، تصویر قرارداد و فیش‌های پیوستی</CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-3">
                  <div className="border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-6 text-center cursor-pointer transition-colors">
                    <span className="text-xs font-semibold text-muted-foreground">کلیک کنید یا فایل‌ها را به این قسمت بکشید (حداکثر ۵ مگابایت)</span>
                  </div>

                  <div className="space-y-2">
                    {attachments.map(file => (
                      <div key={file.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-foreground font-mono">{file.name}</span>
                          <span className="text-[10px] text-muted-foreground">({file.size})</span>
                        </div>
                        <button
                          onClick={() => setAttachments(attachments.filter(f => f.id !== file.id))}
                          className="text-muted-foreground hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Approval workflow statuses */}
              <Card className="shadow-md border border-border">
                <CardHeader className="bg-muted/10 pb-3">
                  <CardTitle className="text-sm font-bold text-foreground">تأییدات و گردش کار سند</CardTitle>
                  <CardDescription>آخرین وضعیت امضاهای دیجیتال منطبق بر قوانین تأیید</CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="relative border-r-2 border-primary/20 pr-6 space-y-4">
                    <div className="relative">
                      <div className="absolute right-[-29px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white shadow">
                        <CheckCircle2 className="h-3 w-3" />
                      </div>
                      <div className="text-xs">
                        <div className="font-bold text-foreground">تنظیم‌کننده سند (کاربر فعلی)</div>
                        <div className="text-muted-foreground mt-0.5 font-medium">سند ثبت موقت شد — امیرحسین باقری - امروز</div>
                      </div>
                    </div>

                    <div className="relative">
                      <div className={`absolute right-[-29px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-white shadow ${
                        settings.workflow.needsApproval ? "bg-amber-500" : "bg-muted text-muted-foreground"
                      }`}>
                        {settings.workflow.needsApproval ? <RefreshCw className="h-2.5 w-2.5 animate-spin" /> : "–"}
                      </div>
                      <div className="text-xs">
                        <div className="font-bold text-foreground">کنترل‌کننده سند</div>
                        <div className="text-muted-foreground mt-0.5 font-medium">
                          {settings.workflow.needsApproval ? "در انتظار تراز و کنترل مانده معین" : "غیرفعال (تنظیمات)"}
                        </div>
                      </div>
                    </div>

                    <div className="relative">
                      <div className={`absolute right-[-29px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-white shadow ${
                        settings.workflow.needsApproval && settings.workflow.managerApproval ? "bg-amber-500" : "bg-muted text-muted-foreground"
                      }`}>
                        {settings.workflow.needsApproval && settings.workflow.managerApproval ? <RefreshCw className="h-2.5 w-2.5" /> : "–"}
                      </div>
                      <div className="text-xs">
                        <div className="font-bold text-foreground">تأییدکننده (مدیر امور مالی)</div>
                        <div className="text-muted-foreground mt-0.5 font-medium">در انتظار امضای دیجیتال مدیر مالی</div>
                      </div>
                    </div>

                    <div className="relative">
                      <div className="absolute right-[-29px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-muted text-muted-foreground shadow">
                        –
                      </div>
                      <div className="text-xs">
                        <div className="font-bold text-foreground">ثبت‌کننده نهایی (دی‌حساب خزانه‌داری)</div>
                        <div className="text-muted-foreground mt-0.5 font-medium">در انتظار تایید نهاد نظارتی</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-between items-center pt-4 pb-10">
              <Button
                variant="outline"
                className="font-bold text-xs h-10 px-5 border-border"
                onClick={() => {
                  setDocLines([
                    { id: 1, group: "", account: "", subAccount: "", costCenter: "", project: "", debit: "", credit: "", desc: "" },
                    { id: 2, group: "", account: "", subAccount: "", costCenter: "", project: "", debit: "", credit: "", desc: "" }
                  ]);
                }}
              >
                پاک‌سازی کامل فرم
              </Button>
              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  className="font-bold text-xs h-10 px-5 gap-2"
                >
                  <Printer className="h-4 w-4" />
                  چاپ پیش‌نویس سند
                </Button>
                <Button
                  disabled={loading}
                  onClick={handleRegisterDoc}
                  className="gap-2 bg-primary hover:bg-primary/95 text-primary-foreground font-bold px-6 h-10 shadow-lg"
                >
                  <Save className="h-4.5 w-4.5" />
                  {loading ? "در حال ثبت..." : "ثبت و محاسبه سند مالی"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 3: PRE-CALCULATION & AUTOMATIC GENERATION OPERATIONS
            ===================================================================== */}
        {activeTab === "calculation" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Calculation Settings Parameters */}
              <Card className="shadow-md border border-border md:col-span-1">
                <CardHeader className="bg-muted/10 pb-3">
                  <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                    <Calculator className="h-4.5 w-4.5 text-primary" />
                    پارامترهای محاسبه مالی
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-foreground">نوع عملیات محاسبه</Label>
                    <select
                      value={calcForm.opType}
                      onChange={(e) => {
                        setCalcForm({ ...calcForm, opType: e.target.value });
                        setIsCalculated(false);
                      }}
                      className="w-full h-9 text-xs rounded-lg border border-input bg-background px-3 font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="payroll">حقوق و دستمزد مستمر کارکنان</option>
                      <option value="depreciation">محاسبه استهلاک اموال و دارایی ثابت</option>
                      <option value="tax">محاسبه مالیات بر ارزش افزوده و عملکرد</option>
                      <option value="currency">تسعیر نرخ ارز صندوق و بانک ارزی</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-foreground">دوره زمانی محاسبه</Label>
                    <select
                      value={calcForm.period}
                      onChange={(e) => setCalcForm({ ...calcForm, period: e.target.value })}
                      className="w-full h-9 text-xs rounded-lg border border-input bg-background px-3 font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="monthly">ماهانه (تیرماه ۱۴۰۵)</option>
                      <option value="quarterly">فصلی (بهار ۱۴۰۵)</option>
                      <option value="annual">سالانه (کل دوره مالی ۱۴۰۵)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-foreground">تاریخ اجرای محاسبه</Label>
                    <PersianDatePicker
                      value={calcForm.execDate}
                      onChange={(e) => setCalcForm({ ...calcForm, execDate: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-foreground">واحد سازمانی / شعبه</Label>
                    <Input
                      value={calcForm.orgUnit}
                      onChange={(e) => setCalcForm({ ...calcForm, orgUnit: e.target.value })}
                      className="h-9 text-xs font-semibold"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground block">محدوده اطلاعات ورودی</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                        <input
                          type="radio"
                          name="scope"
                          checked={calcForm.scope === "all"}
                          onChange={() => setCalcForm({ ...calcForm, scope: "all" })}
                          className="text-primary focus:ring-primary"
                        />
                        همه داده‌ها
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                        <input
                          type="radio"
                          name="scope"
                          checked={calcForm.scope === "limited"}
                          onChange={() => setCalcForm({ ...calcForm, scope: "limited" })}
                          className="text-primary focus:ring-primary"
                        />
                        بخش خاص
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground block">روش محاسبه محاسبات</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                        <input
                          type="radio"
                          name="method"
                          checked={calcForm.method === "auto"}
                          onChange={() => setCalcForm({ ...calcForm, method: "auto" })}
                          className="text-primary focus:ring-primary"
                        />
                        هوشمند خودکار
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                        <input
                          type="radio"
                          name="method"
                          checked={calcForm.method === "manual"}
                          onChange={() => setCalcForm({ ...calcForm, method: "manual" })}
                          className="text-primary focus:ring-primary"
                        />
                        فرمول دلخواه
                      </label>
                    </div>
                  </div>

                  {calcForm.method === "manual" && (
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-foreground">فرمول محاسباتی در سیستم</Label>
                      <textarea
                        value={calcForm.formula}
                        onChange={(e) => setCalcForm({ ...calcForm, formula: e.target.value })}
                        rows={3}
                        className="w-full text-xs font-mono rounded-lg border border-input bg-background p-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
                        dir="ltr"
                      />
                    </div>
                  )}

                  <label className="flex items-center gap-3 cursor-pointer mt-2">
                    <input
                      type="checkbox"
                      checked={calcForm.autoCreate}
                      onChange={(e) => setCalcForm({ ...calcForm, autoCreate: e.target.checked })}
                      className="rounded border-border text-primary focus:ring-primary h-4.5 w-4.5"
                    />
                    <span className="text-xs font-bold text-foreground">ایجاد خودکار سند پیش‌نویس پس از محاسبه</span>
                  </label>

                  <div className="pt-2">
                    <Button
                      onClick={handleRunCalculation}
                      disabled={loading}
                      className="w-full gap-2 bg-primary hover:bg-primary/95 text-primary-foreground font-bold h-10 shadow"
                    >
                      <Play className="h-4 w-4" />
                      اجرای محاسبه و پیش‌نمایش
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Calculation Preview and Action Results */}
              <div className="md:col-span-2 space-y-6">
                {isCalculated ? (
                  <>
                    {/* Error & Discrepancies Report */}
                    <Card className="shadow-md border border-border">
                      <CardHeader className="bg-muted/10 pb-2">
                        <CardTitle className="text-sm font-bold text-foreground flex items-center gap-1.5">
                          <AlertCircle className="h-4.5 w-4.5 text-amber-500" />
                          گزارش خطاها، مغایرت‌ها و انطباق سنجی سناما
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 space-y-2">
                        {calcErrors.map((err, i) => (
                          <div
                            key={i}
                            className={`flex items-start gap-2.5 p-2 rounded-lg text-xs font-semibold ${
                              err.type === "info"
                                ? "bg-blue-50 text-blue-800 border border-blue-100"
                                : "bg-amber-50 text-amber-800 border border-amber-100 animate-pulse"
                            }`}
                          >
                            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                            <span>{err.text}</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    {/* Results Preview */}
                    <Card className="shadow-md border border-border">
                      <CardHeader className="bg-muted/10 pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                            <Eye className="h-4.5 w-4.5 text-primary" />
                            پیش‌نمایش نتایج تفصیلی محاسبه
                          </CardTitle>
                          <Badge className="bg-emerald-100 text-emerald-800 font-semibold">محاسبه نهایی شده</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <table className="w-full text-right text-xs">
                            <thead>
                              <tr className="bg-muted/30 border-b h-9 text-muted-foreground font-bold">
                                <th className="px-4">ردیف/پردیس</th>
                                <th className="px-4">شرح تفصیلی دارایی/کارمند</th>
                                <th className="px-4">مبنای محاسبه</th>
                                <th className="px-4">نرخ اعمال شده</th>
                                <th className="px-4">مبلغ نهایی محاسبه (ریال)</th>
                                <th className="px-4">معین حسابداری خروجی</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {calcResults.map((res, i) => (
                                <tr key={res.id} className="h-10 hover:bg-muted/10">
                                  <td className="px-4 font-semibold text-muted-foreground">{i + 1}</td>
                                  <td className="px-4 font-bold text-foreground">{res.detail}</td>
                                  <td className="px-4 font-mono font-semibold">{res.baseVal}</td>
                                  <td className="px-4 font-semibold">{res.rate}</td>
                                  <td className="px-4 font-mono text-emerald-700 font-bold">{res.resultVal}</td>
                                  <td className="px-4">
                                    <span className="bg-muted border rounded px-2 py-0.5 font-bold font-mono text-[10px] text-muted-foreground">
                                      {res.type}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Generation status and triggers */}
                        <div className="p-4 bg-muted/20 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="text-xs font-semibold text-foreground/80">
                            {generatedDocNo ? (
                              <div className="flex items-center gap-2">
                                <span className="text-emerald-700">✓ سند حسابداری با موفقیت صادر گردید:</span>
                                <span className="font-mono font-bold text-primary text-sm bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
                                  {generatedDocNo}
                                </span>
                              </div>
                            ) : (
                              <span>مجموع مبلغ کل محاسبات: <span className="font-mono text-primary font-bold text-sm">۳۵,۰۰۰,۰۰۰ ریال</span></span>
                            )}
                          </div>

                          {!generatedDocNo && (
                            <Button
                              onClick={handleGenerateCalcDoc}
                              disabled={loading}
                              className="gap-2 bg-primary hover:bg-primary/95 text-primary-foreground font-bold h-9 px-5 shadow"
                            >
                              <FileCheck className="h-4 w-4" />
                              {loading ? "در حال صدور سند..." : "صدور نهایی سند حسابداری"}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card className="border border-dashed border-border rounded-xl h-64 flex flex-col items-center justify-center text-center p-6 bg-muted/10">
                    <HelpCircle className="h-12 w-12 text-muted-foreground/30 mb-3" />
                    <h3 className="text-sm font-bold text-foreground mb-1">پیش‌نمایش نتایج محاسبه</h3>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      جهت شروع، ابتدا پارامترها و نوع عملیات محاسباتی را از پنل سمت راست انتخاب نموده و روی دکمه «اجرای محاسبه و پیش‌نمایش» کلیک کنید.
                    </p>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
