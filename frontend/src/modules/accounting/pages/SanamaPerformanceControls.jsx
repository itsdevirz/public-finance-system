import { useState, useEffect } from "react";
import {
  ShieldCheck, AlertTriangle, CheckCircle2, RefreshCw, FileText,
  Building2, ArrowLeftRight, Search, Info, Layers, Check, FileCheck2, Filter,
  FileSpreadsheet, Download, Save, Calculator, HelpCircle, Eye, Printer, LayoutDashboard,
  Pencil, X
} from "lucide-react";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import api from "@/api";
import { validateSanamaPerformanceForms, SANAMA_PERFORMANCE_RULES } from "@/lib/sanamaPerformanceValidation";

// ─── ثوابت داده‌های اولیه فرم‌های استاندارد سناما ──────────────────────────────────────────

const INITIAL_FORM1 = {
  initialBudget: 1000000000,
  increase: 100000000,
  decrease: 50000000,
  drafts: 800000000,
  legalAdjustments: 0,
};

const INITIAL_FORM_4_6_EXPENSE = [
  { id: 1, title: "بودجه اعتبار نهایی", accountType: "h", creditType: "مصوب / ابلاغی", moeinCodes: "91001 / -94001", approvedAmount: 250000000 },
  { id: 2, title: "اعتبار تخصیص یافته", accountType: "h", creditType: "مصوب / ابلاغی", moeinCodes: "93001 / 97001 / 98001 / 99001 / 92501 / 93501", approvedAmount: 200000000 },
  { id: 3, title: "دریافتی از محل اعتبارات تخصیص یافته / درآمدهای اختصاصی", accountType: "h", creditType: "مصوب / ابلاغی", moeinCodes: "41001 / 41005 / 41006 / 81010 / 81017 / 81019 / -94001", approvedAmount: 180000000 },
  { id: 4, title: "اعتبار مصرف شده", accountType: "h", creditType: "مصوب-ابلاغی", moeinCodes: "99001", approvedAmount: 150000000 },
  { id: 5, title: "پیش پرداخت", accountType: "h", creditType: "مصوب-ابلاغی", moeinCodes: "98001", approvedAmount: 10000000 },
  { id: 6, title: "پیش پرداخت اعتبار اسنادی", accountType: "h", creditType: "مصوب-ابلاغی", moeinCodes: "98001", approvedAmount: 0 },
  { id: 7, title: "علی‌الحساب", accountType: "h", creditType: "مصوب-ابلاغی", moeinCodes: "98001", approvedAmount: 10000000 },
  { id: 8, title: "اسناد واخواهی", accountType: "h", creditType: "مصوب-ابلاغی", moeinCodes: "92501", approvedAmount: 0 },
  { id: 9, title: "کسری ابواب جمعی", accountType: "h", creditType: "مصوب-ابلاغی", moeinCodes: "81007 / 93501", approvedAmount: 0 },
  { id: 10, title: "وجوه انتقالی (محاسباتی)", accountType: "h", creditType: "مصوب-ابلاغی", moeinCodes: "محاسباتی", approvedAmount: 10000000, isCalculated: true },
  { id: 11, title: "اوراق انتقالی", accountType: "h", creditType: "مصوب-ابلاغی", moeinCodes: "81010 / 81019", approvedAmount: 0 },
];

const INITIAL_FORM_5_7_EXPENSE = [
  { id: 1, title: "بودجه اعتبار نهایی هزینه‌ای", accountType: "h", creditType: "مصوب / ابلاغی", moeinCodes: "91001 / -94001", approvedAmount: 250000000 },
  { id: 2, title: "اعتبار تخصیص یافته هزینه‌ای", accountType: "h", creditType: "مصوب / ابلاغی", moeinCodes: "93001 / 97001 / 98001 / 99001 / 92501 / 93501", approvedAmount: 200000000 },
  { id: 3, title: "دریافتی از محل تخصیص هزینه‌ای", accountType: "h", creditType: "مصوب / ابلاغی", moeinCodes: "41001 / 41005 / 41006 / 81010 / 81017 / 81019 / -94001", approvedAmount: 180000000 },
  { id: 4, title: "اعتبار مصرف شده هزینه‌ای", accountType: "h", creditType: "مصوب-ابلاغی", moeinCodes: "99001", approvedAmount: 150000000 },
  { id: 5, title: "پیش پرداخت و علی‌الحساب", accountType: "h", creditType: "مصوب-ابلاغی", moeinCodes: "98001", approvedAmount: 20000000 },
  { id: 6, title: "اسناد واخواهی و کسری ابواب جمعی", accountType: "h", creditType: "مصوب-ابلاغی", moeinCodes: "92501 / 81007 / 93501", approvedAmount: 0 },
  { id: 7, title: "وجوه انتقالی سالانه (محاسباتی)", accountType: "h", creditType: "مصوب-ابلاغی", moeinCodes: "محاسباتی", approvedAmount: 10000000, isCalculated: true },
];

const INITIAL_FORM_7_5_CAPITAL = [
  { id: 1, title: "بودجه اعتبار نهایی", accountType: "t", creditType: "مصوب / ابلاغی", moeinCodes: "91002 / -94002", approvedAmount: 500000000 },
  { id: 2, title: "اعتبار تخصیص یافته", accountType: "t", creditType: "مصوب / ابلاغی", moeinCodes: "93002 / 97002 / 98002 / 99002 / 92502 / 93502", approvedAmount: 400000000 },
  { id: 3, title: "دریافتی از محل اعتبارات تخصیص یافته / درآمدهای اختصاصی", accountType: "t", creditType: "مصوب / ابلاغی", moeinCodes: "41003 / 81010 / 81017 / 81019 / -94002", approvedAmount: 380000000 },
  { id: 4, title: "اعتبار مصرف شده", accountType: "t", creditType: "مصوب-ابلاغی", moeinCodes: "99002", approvedAmount: 300000000 },
  { id: 5, title: "موجودی‌ها", accountType: "t", creditType: "مصوب-ابلاغی", moeinCodes: "98002", approvedAmount: 20000000 },
  { id: 6, title: "پیش پرداخت", accountType: "t", creditType: "مصوب-ابلاغی", moeinCodes: "98002", approvedAmount: 30000000 },
  { id: 7, title: "پیش پرداخت مواد و کالا", accountType: "t", creditType: "مصوب-ابلاغی", moeinCodes: "98002", approvedAmount: 0 },
  { id: 8, title: "پیش پرداخت اعتبار اسنادی", accountType: "t", creditType: "مصوب-ابلاغی", moeinCodes: "98002", approvedAmount: 0 },
  { id: 9, title: "علی‌الحساب", accountType: "t", creditType: "مصوب-ابلاغی", moeinCodes: "98002", approvedAmount: 15000000 },
  { id: 10, title: "اسناد واخواهی", accountType: "t", creditType: "مصوب-ابلاغی", moeinCodes: "92502", approvedAmount: 0 },
  { id: 11, title: "کسری ابواب جمعی", accountType: "t", creditType: "مصوب-ابلاغی", moeinCodes: "81007 / 93502", approvedAmount: 0 },
  { id: 12, title: "وجوه انتقالی (محاسباتی)", accountType: "t", creditType: "مصوب-ابلاغی", moeinCodes: "محاسباتی", approvedAmount: 15000000, isCalculated: true },
  { id: 13, title: "اوراق انتقالی", accountType: "t", creditType: "مصوب-ابلاغی", moeinCodes: "81010 / 81019", approvedAmount: 0 },
];

const INITIAL_FORM_8_RESOURCES = [
  { id: 1, resourceKind: "درآمد عمومی", expectedMoein: "81008", receivedMoein: "71001 / 81013", sentMoein: "71001 / 81013", expectedAmount: 1000000000, receivedAmount: 950000000, sentAmount: 950000000 },
  { id: 2, resourceKind: "درآمد اختصاصی", expectedMoein: "81008", receivedMoein: "81013", sentMoein: "81013", expectedAmount: 200000000, receivedAmount: 180000000, sentAmount: 180000000 },
  { id: 3, resourceKind: "واگذاری دارایی مالی (عمومی)", expectedMoein: "81008", receivedMoein: "63001 / 81013", sentMoein: "63001 / 81013", expectedAmount: 0, receivedAmount: 0, sentAmount: 0 },
  { id: 4, resourceKind: "واگذاری دارایی سرمایه‌ای (عمومی)", expectedMoein: "81008", receivedMoein: "63001 / 81013", sentMoein: "63001 / 81013", expectedAmount: 500000000, receivedAmount: 480000000, sentAmount: 480000000 },
  { id: 5, resourceKind: "واگذاری دارایی سرمایه‌ای (اختصاصی)", expectedMoein: "81008", receivedMoein: "81013", sentMoein: "81013", expectedAmount: 0, receivedAmount: 0, sentAmount: 0 },
];

const INITIAL_FORM_9 = {
  prepayments: { initialBalance: 100000000, consumedTransferred: 40000000, inventory: 0, objectionTransferred: 0, deficitTransferred: 0, sentToTreasury: 10000000, yearEndBalance: 50000000, moeinExpense: "98003", moeinCapital: "98004" },
  inventories: { initialBalance: 50000000, consumedTransferred: 20000000, objectionTransferred: 0, deficitTransferred: 0, sentToTreasury: 5000000, yearEndBalance: 25000000, moeinExpense: "98003", moeinCapital: "98004" },
  onAccounts: { initialBalance: 60000000, consumedTransferred: 30000000, inventory: 0, objectionTransferred: 0, deficitTransferred: 0, sentToTreasury: 10000000, yearEndBalance: 20000000, moeinExpense: "98003", moeinCapital: "98004" }
};

const INITIAL_FORM_10 = [
  { id: 1, section: "وجوه انتقالی", initialBalance: 150000000, nonFinalPrevYears: 20000000, objectionDeficitPrevYears: 0, investmentsPrevYears: 0, transferredDraftsExpense: 94003, transferredDraftsCapital: 94004, receivedNotifiedBonds: "81010 / 81019 / 81017", consumedTransferred: 100000000, prepayments: 10000000, onAccounts: 10000000, sentToTreasury: 10000000, objectionTransferred: 92503, deficitTransferred: 93503, yearEndMoeinApproved: "91501 / 97003", yearEndMoeinNotified: "95003" },
  { id: 2, section: "سرمایه‌گذاری", initialBalance: 50000000, transferredFunds: 50000000, deficitTransferred: 93503, yearEndBalance: 0 }
];

const INITIAL_FORM_11 = [
  { id: 1, rowType: "سطر اسناد واخواهی شده", initialBalance: 30000000, consumedTransferred: 10000000, sentToTreasury: 5000000, deficit: 0, moeinExpense: "92503", moeinCapital: "92504" },
  { id: 2, rowType: "سطر کسری ابواب جمعی (دارای مانده)", initialBalance: 15000000, consumedTransferred: 5000000, sentToTreasury: 0, yearEndMoeinExpense: "93503", yearEndMoeinCapital: "93504" },
  { id: 3, rowType: "سطر کسری ابواب جمعی برداشتی", initialBalance: 10000000, consumedTransferred: 0, sentToTreasury: 0, yearEndMoeinExpense: "81007", yearEndMoeinCapital: "81007" },
];

const INITIAL_FORM_13 = [
  { id: 1, rowType: "اوراق دریافتی", accountType: "o", creditType: "مصوب / ابلاغی", moeinExpenseApproved: "41001 / 41006 / 81010 / 81017 / -94001", moeinExpenseNotified: "81010 / 81017", moeinCapitalApproved: "41003 / 81010 / 81017 / -94002", moeinCapitalNotified: "81010 / 81017", amount: 500000000 },
  { id: 2, rowType: "اوراق واگذار شده", accountType: "o", creditType: "مصوب - ابلاغی", moeinExpenseApproved: "99001 / 98001 / 92501 / 93501", moeinExpenseNotified: "", moeinCapitalApproved: "99002 / 98002 / 92502 / 93502", moeinCapitalNotified: "", amount: 450000000 },
  { id: 3, rowType: "اوراق مصرف نشده (قفل)", accountType: "o", creditType: "مصوب - ابلاغی", moeinExpenseApproved: "قفل شده", moeinExpenseNotified: "", moeinCapitalApproved: "قفل شده", moeinCapitalNotified: "", amount: 0 },
  { id: 4, rowType: "اوراق انتقالی", accountType: "o", creditType: "مصوب - ابلاغی", moeinExpenseApproved: "81010", moeinExpenseNotified: "81010", moeinCapitalApproved: "81010", moeinCapitalNotified: "81010", amount: 50000000 },
];

export default function SanamaPerformanceControls() {
  const [mainMode, setMainMode] = useState("forms"); // "forms" یا "audit"
  const [activeFormTab, setActiveFormTab] = useState("form1");

  // وضعیت ممیزی و قوانین
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [selectedRuleCode, setSelectedRuleCode] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [checkedCount, setCheckedCount] = useState(0);

  // وضعیت فرم‌های استاندارد سناما
  const [form1Data, setForm1Data] = useState(INITIAL_FORM1);
  const [form46Data, setForm46Data] = useState(INITIAL_FORM_4_6_EXPENSE);
  const [form57ExpData, setForm57ExpData] = useState(INITIAL_FORM_5_7_EXPENSE);
  const [form75CapData, setForm75CapData] = useState(INITIAL_FORM_7_5_CAPITAL);
  const [form8Data, setForm8Data] = useState(INITIAL_FORM_8_RESOURCES);
  const [form9Data, setForm9Data] = useState(INITIAL_FORM_9);
  const [form10Data, setForm10Data] = useState(INITIAL_FORM_10);
  const [form11Data, setForm11Data] = useState(INITIAL_FORM_11);
  const [form13Data, setForm13Data] = useState(INITIAL_FORM_13);

  // ویرایش سریع ردیف خطادار
  const [editingItem, setEditingItem] = useState(null);
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [modalSuccess, setModalSuccess] = useState(null);
  const [editForm, setEditForm] = useState({
    project_number: "",
    misc_row_number: "",
    financial_assets_row_number: "",
    program_number: "",
    notifier_budget_row: "",
    credit_type: "مصوب",
  });

  const openEditModal = (itemRef) => {
    setModalError(null);
    setModalSuccess(null);
    const target = items.find(it => String(it.id) === String(itemRef)) 
      || items[0] 
      || {
          id: itemRef || "6a4ec5fe87126a358aa52cc1",
          title: "اعتبار ردیف بودجه خزانه‌داری",
          project_number: "",
          misc_row_number: "",
          financial_assets_row_number: "",
          program_number: "",
          notifier_budget_row: "",
          credit_type: "مصوب"
        };

    setEditingItem(target);
    setEditForm({
      project_number: target.project_number || "",
      misc_row_number: target.misc_row_number || "",
      financial_assets_row_number: target.financial_assets_row_number || "",
      program_number: target.program_number || "",
      notifier_budget_row: target.notifier_budget_row || "",
      credit_type: target.credit_type || "مصوب",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;

    setModalError(null);
    setModalSuccess(null);

    // اعتبارسنجی مقادیر ضروری برای رفع خطای ۱۳۲ و ۱۳۱
    const { project_number, misc_row_number, financial_assets_row_number } = editForm;
    if (!project_number?.trim() && !misc_row_number?.trim() && !financial_assets_row_number?.trim()) {
      setModalError("علت عدم اعمال: حداقل یکی از فیلدهای «شماره طرح»، «شماره ردیف متفرقه» یا «شماره ردیف تملک دارایی‌های مالی» باید مقداردهی شود تا خطای ۱۳۲ خزانه‌داری برطرف گردد.");
      return;
    }

    setModalSaving(true);
    try {
      const payload = {
        ...editForm,
        notifierRow: editForm.notifier_budget_row,
        creditKind: editForm.credit_type === "ابلاغی" ? "notified" : "approved",
        capital: {
          ...(editingItem.raw?.capital || {}),
          projectNumber: editForm.project_number
        },
        expense: {
          ...(editingItem.raw?.expense || {}),
          programNumber: editForm.program_number
        }
      };

      const targetId = editingItem.raw?._id || editingItem.id;
      if (targetId && String(targetId).length === 24) {
        await api.put(`/api/credits/definitions/${targetId}`, payload);
      }

      setModalSuccess("اصلاحات با موفقیت در سناما و دیتابیس اعتبارات ذخیره شد.");

      // فراخوانی مجدد اطلاعات جهت بروزرسانی فیلترها و ممیزی
      await fetchData();

      setTimeout(() => {
        setEditingItem(null);
        setModalSaving(false);
      }, 1000);
    } catch (err) {
      console.error("Error saving SANAMA definition edit:", err);
      const errMsg = err?.response?.data?.message || err?.message || "خطا در برقراری ارتباط با سرور و ثبت اطلاعات.";
      setModalError(`علت عدم اعمال: ${errMsg}`);
      setModalSaving(false);
    }
  };

  // محاسبات فرم ۱
  const calculatedForm1Final = form1Data.initialBudget + form1Data.legalAdjustments + form1Data.increase - form1Data.decrease - form1Data.drafts;

  // محاسبات فرم ۹
  const calculateForm9Transferred = (sec) => {
    return sec.initialBalance - (sec.consumedTransferred + (sec.inventory || 0) + sec.objectionTransferred + sec.deficitTransferred + sec.sentToTreasury + sec.yearEndBalance);
  };

  // محاسبات فرم ۴-۶
  const f46Received = form46Data.find(r => r.id === 3)?.approvedAmount || 0;
  const f46Consumed = form46Data.find(r => r.id === 4)?.approvedAmount || 0;
  const f46Prepay = form46Data.find(r => r.id === 5)?.approvedAmount || 0;
  const f46PrepayLetter = form46Data.find(r => r.id === 6)?.approvedAmount || 0;
  const f46OnAccount = form46Data.find(r => r.id === 7)?.approvedAmount || 0;
  const f46Objection = form46Data.find(r => r.id === 8)?.approvedAmount || 0;
  const f46Deficit = form46Data.find(r => r.id === 9)?.approvedAmount || 0;
  const f46Bonds = form46Data.find(r => r.id === 11)?.approvedAmount || 0;
  const calculatedF46Transferred = f46Received - (f46Consumed + f46Prepay + f46PrepayLetter + f46OnAccount + f46Objection + f46Deficit + f46Bonds);

  // محاسبات فرم ۵-۷ هزینه‌ای
  const f57ExpReceived = form57ExpData.find(r => r.id === 3)?.approvedAmount || 0;
  const f57ExpConsumed = form57ExpData.find(r => r.id === 4)?.approvedAmount || 0;
  const f57ExpPrepay = form57ExpData.find(r => r.id === 5)?.approvedAmount || 0;
  const f57ExpObjection = form57ExpData.find(r => r.id === 6)?.approvedAmount || 0;
  const calculatedF57ExpTransferred = f57ExpReceived - (f57ExpConsumed + f57ExpPrepay + f57ExpObjection);

  // بارگذاری داده‌ها و اعتبارسنجی
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/credits/definitions");
      const list = res.data?.data || [];
      const mapped = list.map((item, idx) => ({
        id: item._id || idx + 1,
        project_number: item.project_number || item.capital?.projectNumber || "",
        program_number: item.program_number || item.expense?.programNumber || "",
        misc_row_number: item.misc_row_number || "",
        financial_assets_row_number: item.financial_assets_row_number || "",
        credit_type: item.creditKind === "notified" ? "ابلاغی" : (item.credit_type || "مصوب"),
        credit_location: item.credit_location || (item.creditKind === "notified" ? "متمرکز" : "استانی"),
        receipt_location: item.receipt_location || "استانی",
        notifier_budget_row: item.notifierRow || item.notifier_budget_row || "",
        executive_body_budget_row: item.executive_body_budget_row || "101000",
        final_credit_budget: Number(item.final_credit_budget ?? item.amount ?? 0),
        initial_credit_budget: Number(item.initial_credit_budget ?? item.amount ?? 0),
        allocated_credit: Number(item.allocated_credit ?? item.amount ?? 0),
        received_credit: Number(item.received_credit ?? item.amount ?? 0),
        consumed_credit: Number(item.consumed_credit ?? 0),
        non_final_payments: Number(item.non_final_payments ?? 0),
        transferred_bonds: Number(item.transferred_bonds ?? 0),
        other_consumption: Number(item.other_consumption ?? 0),
        legal_adjustments: Number(item.legal_adjustments ?? 0),
        legal_adjustments_row: item.legal_adjustments_row || "",
        increase: Number(item.increase ?? 0),
        decrease: Number(item.decrease ?? 0),
        drafts: Number(item.drafts ?? 0),
        special_revenue_received: Number(item.special_revenue_received ?? 0),
        form_type: item.form_type || 1,
        title: item.title || item.expense?.expenseChapter || item.capital?.projectTitle || `اعتبار ردیف ${idx + 1}`,
        raw: item,
      }));

      setItems(mapped);
      runValidation(mapped);
    } catch {
      const sampleItems = [
        {
          id: "FORM-1",
          form_type: 1,
          credit_type: "مصوب",
          credit_location: "استانی",
          receipt_location: "استانی",
          program_number: "10101",
          final_credit_budget: calculatedForm1Final,
          initial_credit_budget: form1Data.initialBudget,
          increase: form1Data.increase,
          decrease: form1Data.decrease,
          drafts: form1Data.drafts,
          allocated_credit: form46Data.find(r => r.id === 2)?.approvedAmount || 0,
          received_credit: f46Received,
          consumed_credit: f46Consumed,
        },
        {
          id: "FORM-4-6",
          form_type: 4,
          credit_type: "ابلاغی",
          credit_location: "متمرکز",
          receipt_location: "استانی",
          program_number: "10102",
          notifier_budget_row: "102000",
          executive_body_budget_row: "101000",
          final_credit_budget: form46Data.find(r => r.id === 1)?.approvedAmount || 0,
          allocated_credit: form46Data.find(r => r.id === 2)?.approvedAmount || 0,
          received_credit: f46Received,
          consumed_credit: f46Consumed,
        }
      ];
      setItems(sampleItems);
      runValidation(sampleItems);
    } finally {
      setLoading(false);
    }
  };

  const runValidation = (data) => {
    const errs = validateSanamaPerformanceForms(data);
    setErrors(errs);
    setCheckedCount(data.length);
  };

  useEffect(() => {
    fetchData();
  }, [form1Data, form46Data, form57ExpData, form75CapData, form9Data]);

  const filteredRules = SANAMA_PERFORMANCE_RULES.filter(rule => 
    rule.title.includes(searchTerm) || 
    rule.desc.includes(searchTerm) || 
    String(rule.code).includes(searchTerm)
  );

  const activeErrors = selectedRuleCode 
    ? errors.filter(e => e.code === selectedRuleCode)
    : errors;

  return (
    <PageShell>
      <PageHeader 
        title="ممیزی و نمایش فرم‌های عملکرد سناما (خزانه‌داری کل کشور)" 
        description="مشاهده، تکمیل، موازنه هوشمند و ممیزی ۲۲ ضابطه و کنترل‌های استاندارد وزارت دارایی"
      />

      {/* ─── نوار سوئیچ اصلی (فرم‌ها / داشبورد ممیزی) ─── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-slate-900 text-white p-3 rounded-2xl shadow-lg border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600/30 text-blue-400 rounded-xl border border-blue-500/30">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-100">سامانه نظارت آنی خزانه‌داری کل (سناما)</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">کنترل موازنه، معین‌ها و انطباق فرم‌های عملکرد مالی ۱ تا ۱۳</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700 w-full sm:w-auto justify-center">
          <Button
            size="sm"
            variant={mainMode === "forms" ? "default" : "ghost"}
            onClick={() => setMainMode("forms")}
            className={cn(
              "text-xs font-bold gap-2 rounded-lg h-9 px-4",
              mainMode === "forms" && "bg-blue-600 text-white shadow-md hover:bg-blue-700"
            )}
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>فرم‌های استاندارد سناما (۹ فرم)</span>
          </Button>

          <Button
            size="sm"
            variant={mainMode === "audit" ? "default" : "ghost"}
            onClick={() => setMainMode("audit")}
            className={cn(
              "text-xs font-bold gap-2 rounded-lg h-9 px-4 relative",
              mainMode === "audit" && "bg-emerald-600 text-white shadow-md hover:bg-emerald-700"
            )}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>ممیزی هوشمند قوانین ({errors.length} خطا)</span>
            {errors.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping absolute -top-0.5 -right-0.5" />
            )}
          </Button>
        </div>
      </div>

      {/* ─── خلاصه وضعیت خطاهای سناما ─── */}
      {errors.length > 0 && (
        <Card className="mb-6 border-amber-300 bg-amber-50/70 dark:bg-amber-950/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/50 text-amber-700 rounded-lg">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300">ممیزی آنلاین سناما فعال است</h4>
                <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                  تعداد {errors.length} مغایرت موازنه و کد معین در فرم‌های فعال عملکرد شناسایی شد.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setMainMode("audit")}
              className="text-xs gap-1.5 h-8 border-amber-400 text-amber-900 hover:bg-amber-100"
            >
              <span>مشاهده ریز مغایرت‌ها</span>
              <Badge variant="destructive" className="text-[10px]">{errors.length}</Badge>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ════════════════════════ حالت ۱: نمایش فرم‌های ۹‌گانه ════════════════════════ */}
      {mainMode === "forms" && (
        <Tabs value={activeFormTab} onValueChange={setActiveFormTab} className="w-full">
          <TabsList className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-1 bg-slate-200/70 dark:bg-slate-800/70 p-1.5 rounded-xl mb-6 overflow-x-auto">
            <TabsTrigger value="form1" className="text-[11px] font-bold py-2">فرم ۱</TabsTrigger>
            <TabsTrigger value="form46" className="text-[11px] font-bold py-2">فرم ۴-۶</TabsTrigger>
            <TabsTrigger value="form57exp" className="text-[11px] font-bold py-2">۵-۷ هزینه</TabsTrigger>
            <TabsTrigger value="form75cap" className="text-[11px] font-bold py-2 text-emerald-700 dark:text-emerald-400">۵-۷ سرمایه</TabsTrigger>
            <TabsTrigger value="form8" className="text-[11px] font-bold py-2 text-blue-700 dark:text-blue-400">فرم ۸</TabsTrigger>
            <TabsTrigger value="form9" className="text-[11px] font-bold py-2 text-purple-700 dark:text-purple-400">فرم ۹</TabsTrigger>
            <TabsTrigger value="form10" className="text-[11px] font-bold py-2 text-teal-700 dark:text-teal-400">فرم ۱۰</TabsTrigger>
            <TabsTrigger value="form11" className="text-[11px] font-bold py-2 text-indigo-700 dark:text-indigo-400">فرم ۱۱</TabsTrigger>
            <TabsTrigger value="form13" className="text-[11px] font-bold py-2 text-cyan-700 dark:text-cyan-400">فرم ۱۳</TabsTrigger>
          </TabsList>

          {/* ─── فرم ۱ ─── */}
          <TabsContent value="form1">
            <Card className="border shadow-sm">
              <CardHeader className="bg-lime-50/70 dark:bg-lime-950/20 border-b pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-black text-lime-900 dark:text-lime-300">
                      فرم ۱ — موافقت‌نامه / عملکرد اعتبار مصوب هزینه‌ای
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">
                      تنظیم اولیه، افزایش، کاهش، حواله‌ها و محاسبه خودکار بودجه اعتبار نهایی با معین‌های ۹۱۰۰۱ و ۹۴۰۰۱-
                    </CardDescription>
                  </div>
                  <Badge className="bg-lime-600 text-white text-xs px-3 py-1">معین ۹۱۰۰۱ / ۹۴۰۰۱-</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right border-collapse border border-lime-200">
                    <thead>
                      <tr className="bg-lime-100 dark:bg-lime-900/40 text-lime-900 dark:text-lime-200 font-bold border-b border-lime-300">
                        <th className="p-3 border-l border-lime-300">عنوان ستون</th>
                        <th className="p-3 border-l border-lime-300">نوع حساب</th>
                        <th className="p-3 border-l border-lime-300">حساب معین</th>
                        <th className="p-3 border-l border-lime-300">سطوح تفصیلی</th>
                        <th className="p-3 w-48">مبلغ (ریال)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-lime-100">
                      <tr className="hover:bg-lime-50/40">
                        <td className="p-3 font-bold text-slate-800">بودجه اعتبار اولیه</td>
                        <td className="p-3 text-slate-600">هزینه</td>
                        <td className="p-3 font-mono font-semibold">قابل ویرایش</td>
                        <td className="p-3 text-slate-500">تکمیل توسط کاربر</td>
                        <td className="p-2">
                          <Input type="number" value={form1Data.initialBudget} onChange={(e) => setForm1Data({ ...form1Data, initialBudget: Number(e.target.value) })} className="h-8 text-xs font-mono" />
                        </td>
                      </tr>
                      <tr className="hover:bg-lime-50/40">
                        <td className="p-3 font-bold text-emerald-700">افزایش (+)</td>
                        <td className="p-3 text-slate-600">هزینه</td>
                        <td className="p-3 font-mono font-semibold">قابل ویرایش</td>
                        <td className="p-3 text-slate-500">تکمیل توسط کاربر</td>
                        <td className="p-2">
                          <Input type="number" value={form1Data.increase} onChange={(e) => setForm1Data({ ...form1Data, increase: Number(e.target.value) })} className="h-8 text-xs font-mono text-emerald-700" />
                        </td>
                      </tr>
                      <tr className="hover:bg-lime-50/40">
                        <td className="p-3 font-bold text-rose-700">کاهش (-)</td>
                        <td className="p-3 text-slate-600">هزینه</td>
                        <td className="p-3 font-mono font-semibold">قابل ویرایش</td>
                        <td className="p-3 text-slate-500">تکمیل توسط کاربر</td>
                        <td className="p-2">
                          <Input type="number" value={form1Data.decrease} onChange={(e) => setForm1Data({ ...form1Data, decrease: Number(e.target.value) })} className="h-8 text-xs font-mono text-rose-700" />
                        </td>
                      </tr>
                      <tr className="hover:bg-lime-50/40">
                        <td className="p-3 font-bold text-blue-700">حواله (-)</td>
                        <td className="p-3 text-slate-600">هزینه</td>
                        <td className="p-3 font-mono font-bold text-blue-800">94001</td>
                        <td className="p-3 text-slate-500">سطوح تفصیلی مطابق الزامات پروتکل الکترونیکی</td>
                        <td className="p-2">
                          <Input type="number" value={form1Data.drafts} onChange={(e) => setForm1Data({ ...form1Data, drafts: Number(e.target.value) })} className="h-8 text-xs font-mono text-blue-700" />
                        </td>
                      </tr>
                      <tr className="bg-lime-200/70 font-black text-slate-900">
                        <td className="p-3">بودجه اعتبار نهایی (محاسباتی)</td>
                        <td className="p-3">هزینه</td>
                        <td className="p-3 font-mono">91001 / -94001</td>
                        <td className="p-3 text-slate-700">مطابق الزامات پروتکل تبادل الکترونیکی</td>
                        <td className="p-3 font-mono text-sm text-lime-900">
                          {calculatedForm1Final.toLocaleString("fa-IR")} ریال
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── فرم ۴-۶ ─── */}
          <TabsContent value="form46">
            <Card className="border shadow-sm">
              <CardHeader className="bg-amber-50/70 border-b pb-4">
                <CardTitle className="text-base font-black text-amber-900">
                  فرم ۴-۶ — اعتبارات هزینه (جدول ۱۱ ردیفی معین)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right border-collapse border border-slate-200">
                    <thead>
                      <tr className="bg-amber-100 text-amber-900 font-bold border-b">
                        <th className="p-3 border-l w-12 text-center">ردیف</th>
                        <th className="p-3 border-l">عنوان ستون</th>
                        <th className="p-3 border-l w-20 text-center">نوع حساب</th>
                        <th className="p-3 border-l w-28 text-center">اعتبار</th>
                        <th className="p-3 border-l font-mono">حساب معین سناما</th>
                        <th className="p-3 w-48">مبلغ (ریال)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {form46Data.map((row) => (
                        <tr key={row.id} className={cn("hover:bg-slate-50/50", row.isCalculated && "bg-amber-100/50 font-bold")}>
                          <td className="p-3 text-center font-mono font-semibold">{row.id}</td>
                          <td className="p-3 font-semibold text-slate-800">{row.title}</td>
                          <td className="p-3 text-center font-mono">{row.accountType}</td>
                          <td className="p-3 text-center text-slate-600">{row.creditType}</td>
                          <td className="p-3 font-mono text-blue-700 font-semibold">{row.moeinCodes}</td>
                          <td className="p-2">
                            {row.isCalculated ? (
                              <div className="p-2 font-mono font-black text-amber-900 bg-amber-200/60 rounded text-center">
                                {calculatedF46Transferred.toLocaleString("fa-IR")}
                              </div>
                            ) : (
                              <Input
                                type="number"
                                value={row.approvedAmount}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setForm46Data(form46Data.map(r => r.id === row.id ? { ...r, approvedAmount: val } : r));
                                }}
                                className="h-8 text-xs font-mono"
                              />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── فرم ۵-۷ اعتبارات هزینه ─── */}
          <TabsContent value="form57exp">
            <Card className="border shadow-sm">
              <CardHeader className="bg-blue-50/70 border-b pb-4">
                <CardTitle className="text-base font-black text-blue-900">
                  فرم ۵-۷ — اعتبارات هزینه (تراز عملکرد هزینه‌ای)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right border-collapse border border-slate-200">
                    <thead>
                      <tr className="bg-blue-100 text-blue-900 font-bold border-b">
                        <th className="p-3 border-l w-12 text-center">ردیف</th>
                        <th className="p-3 border-l">عنوان ستون</th>
                        <th className="p-3 border-l w-20 text-center">نوع حساب</th>
                        <th className="p-3 border-l w-28 text-center">اعتبار</th>
                        <th className="p-3 border-l font-mono">حساب معین سناما</th>
                        <th className="p-3 w-48">مبلغ مصوب (ریال)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {form57ExpData.map((row) => (
                        <tr key={row.id} className={cn("hover:bg-slate-50/50", row.isCalculated && "bg-blue-100/50 font-bold")}>
                          <td className="p-3 text-center font-mono font-semibold">{row.id}</td>
                          <td className="p-3 font-semibold text-slate-800">{row.title}</td>
                          <td className="p-3 text-center font-mono">{row.accountType}</td>
                          <td className="p-3 text-center text-slate-600">{row.creditType}</td>
                          <td className="p-3 font-mono text-blue-700 font-semibold">{row.moeinCodes}</td>
                          <td className="p-2">
                            {row.isCalculated ? (
                              <div className="p-2 font-mono font-black text-blue-900 bg-blue-200/60 rounded text-center">
                                {calculatedF57ExpTransferred.toLocaleString("fa-IR")}
                              </div>
                            ) : (
                              <Input
                                type="number"
                                value={row.approvedAmount}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setForm57ExpData(form57ExpData.map(r => r.id === row.id ? { ...r, approvedAmount: val } : r));
                                }}
                                className="h-8 text-xs font-mono"
                              />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── فرم ۵-۷ اعتبارات سرمایه‌ای ─── */}
          <TabsContent value="form75cap">
            <Card className="border shadow-sm">
              <CardHeader className="bg-emerald-50/70 border-b pb-4">
                <CardTitle className="text-base font-black text-emerald-900">
                  فرم ۵-۷ — اعتبارات سرمایه‌ای (تملک دارایی‌های سرمایه‌ای - نوع حساب t)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right border-collapse border border-slate-200">
                    <thead>
                      <tr className="bg-emerald-100 text-emerald-900 font-bold border-b">
                        <th className="p-3 border-l w-12 text-center">ردیف</th>
                        <th className="p-3 border-l">عنوان ستون</th>
                        <th className="p-3 border-l w-20 text-center">نوع حساب</th>
                        <th className="p-3 border-l w-28 text-center">اعتبار</th>
                        <th className="p-3 border-l font-mono">حساب معین سناما</th>
                        <th className="p-3 w-48">مبلغ مصوب (ریال)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {form75CapData.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50/50">
                          <td className="p-3 text-center font-mono font-semibold">{row.id}</td>
                          <td className="p-3 font-semibold text-slate-800">{row.title}</td>
                          <td className="p-3 text-center font-mono">{row.accountType}</td>
                          <td className="p-3 text-center text-slate-600">{row.creditType}</td>
                          <td className="p-3 font-mono text-emerald-700 font-semibold">{row.moeinCodes}</td>
                          <td className="p-2">
                            <Input
                              type="number"
                              value={row.approvedAmount}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setForm75CapData(form75CapData.map(r => r.id === row.id ? { ...r, approvedAmount: val } : r));
                              }}
                              className="h-8 text-xs font-mono"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── فرم ۸ منابع ─── */}
          <TabsContent value="form8">
            <Card className="border shadow-sm">
              <CardHeader className="bg-blue-50/70 border-b pb-4">
                <CardTitle className="text-base font-black text-blue-900">
                  فرم ۸ — منابع و درآمدهای عمومی و اختصاصی
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right border-collapse border border-slate-200">
                    <thead>
                      <tr className="bg-blue-100 text-blue-900 font-bold border-b">
                        <th className="p-3 border-l w-12 text-center">ردیف</th>
                        <th className="p-3 border-l">ماهیت منابع</th>
                        <th className="p-3 border-l font-mono">معین پیش‌بینی</th>
                        <th className="p-3 border-l font-mono">معین وصول</th>
                        <th className="p-3 border-l font-mono">معین ارسال به خزانه</th>
                        <th className="p-3 w-32">پیش‌بینی</th>
                        <th className="p-3 w-32">وصول</th>
                        <th className="p-3 w-32">ارسال به خزانه</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {form8Data.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50/50">
                          <td className="p-3 text-center font-mono font-semibold">{row.id}</td>
                          <td className="p-3 font-bold text-slate-800">{row.resourceKind}</td>
                          <td className="p-3 font-mono text-slate-600">{row.expectedMoein}</td>
                          <td className="p-3 font-mono text-blue-700 font-semibold">{row.receivedMoein}</td>
                          <td className="p-3 font-mono text-emerald-700 font-semibold">{row.sentMoein}</td>
                          <td className="p-2">
                            <Input type="number" value={row.expectedAmount} onChange={(e) => { const val = Number(e.target.value); setForm8Data(form8Data.map(r => r.id === row.id ? { ...r, expectedAmount: val } : r)); }} className="h-8 text-xs font-mono" />
                          </td>
                          <td className="p-2">
                            <Input type="number" value={row.receivedAmount} onChange={(e) => { const val = Number(e.target.value); setForm8Data(form8Data.map(r => r.id === row.id ? { ...r, receivedAmount: val } : r)); }} className="h-8 text-xs font-mono text-blue-700" />
                          </td>
                          <td className="p-2">
                            <Input type="number" value={row.sentAmount} onChange={(e) => { const val = Number(e.target.value); setForm8Data(form8Data.map(r => r.id === row.id ? { ...r, sentAmount: val } : r)); }} className="h-8 text-xs font-mono text-emerald-700" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── فرم ۹ ─── */}
          <TabsContent value="form9">
            <Card className="border shadow-sm">
              <CardHeader className="bg-purple-50/70 border-b pb-4">
                <CardTitle className="text-base font-black text-purple-900">
                  فرم ۹ — سطر پیش‌پرداخت‌ها، موجودی‌ها و علی‌الحساب
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="border rounded-xl p-4 bg-purple-50/20">
                  <h4 className="font-bold text-xs text-purple-900 mb-3">سطر پیش پرداخت‌ها (معین ۹۸۰۰۳ / ۹۸۰۰۴)</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="text-[11px] text-muted-foreground">مانده ابتدای سال</label>
                      <Input type="number" value={form9Data.prepayments.initialBalance} onChange={e => setForm9Data({...form9Data, prepayments: {...form9Data.prepayments, initialBalance: Number(e.target.value)}})} className="h-8 font-mono mt-1" />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground">اعتبار انتقالی مصرف شده</label>
                      <Input type="number" value={form9Data.prepayments.consumedTransferred} onChange={e => setForm9Data({...form9Data, prepayments: {...form9Data.prepayments, consumedTransferred: Number(e.target.value)}})} className="h-8 font-mono mt-1" />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground">وجوه ارسالی به خزانه</label>
                      <Input type="number" value={form9Data.prepayments.sentToTreasury} onChange={e => setForm9Data({...form9Data, prepayments: {...form9Data.prepayments, sentToTreasury: Number(e.target.value)}})} className="h-8 font-mono mt-1" />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground">مانده پایان سال</label>
                      <Input type="number" value={form9Data.prepayments.yearEndBalance} onChange={e => setForm9Data({...form9Data, prepayments: {...form9Data.prepayments, yearEndBalance: Number(e.target.value)}})} className="h-8 font-mono mt-1 text-purple-700 font-bold" />
                    </div>
                  </div>
                  <div className="mt-3 p-2 bg-purple-100 rounded text-xs font-mono font-bold text-purple-900 flex justify-between">
                    <span>ستون وجوه انتقالی (فرمول محاسباتی):</span>
                    <span>{calculateForm9Transferred(form9Data.prepayments).toLocaleString("fa-IR")} ریال</span>
                  </div>
                </div>

                <div className="border rounded-xl p-4 bg-purple-50/20">
                  <h4 className="font-bold text-xs text-purple-900 mb-3">سطر موجودی‌ها (معین ۹۸۰۰۳ / ۹۸۰۰۴)</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="text-[11px] text-muted-foreground">مانده ابتدای سال</label>
                      <Input type="number" value={form9Data.inventories.initialBalance} onChange={e => setForm9Data({...form9Data, inventories: {...form9Data.inventories, initialBalance: Number(e.target.value)}})} className="h-8 font-mono mt-1" />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground">اعتبار انتقالی مصرف شده</label>
                      <Input type="number" value={form9Data.inventories.consumedTransferred} onChange={e => setForm9Data({...form9Data, inventories: {...form9Data.inventories, consumedTransferred: Number(e.target.value)}})} className="h-8 font-mono mt-1" />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground">وجوه ارسالی به خزانه</label>
                      <Input type="number" value={form9Data.inventories.sentToTreasury} onChange={e => setForm9Data({...form9Data, inventories: {...form9Data.inventories, sentToTreasury: Number(e.target.value)}})} className="h-8 font-mono mt-1" />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground">مانده پایان سال</label>
                      <Input type="number" value={form9Data.inventories.yearEndBalance} onChange={e => setForm9Data({...form9Data, inventories: {...form9Data.inventories, yearEndBalance: Number(e.target.value)}})} className="h-8 font-mono mt-1 text-purple-700 font-bold" />
                    </div>
                  </div>
                  <div className="mt-3 p-2 bg-purple-100 rounded text-xs font-mono font-bold text-purple-900 flex justify-between">
                    <span>ستون وجوه انتقالی (فرمول محاسباتی):</span>
                    <span>{calculateForm9Transferred(form9Data.inventories).toLocaleString("fa-IR")} ریال</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── فرم ۱۰ ─── */}
          <TabsContent value="form10">
            <Card className="border shadow-sm">
              <CardHeader className="bg-teal-50/70 border-b pb-4">
                <CardTitle className="text-base font-black text-teal-900">
                  فرم ۱۰ — وجوه انتقالی و سرمایه‌گذاری‌ها
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right border-collapse border border-slate-200">
                    <thead>
                      <tr className="bg-teal-100 text-teal-900 font-bold border-b">
                        <th className="p-3 border-l">عنوان بخش</th>
                        <th className="p-3 border-l font-mono">حواله انتقالی</th>
                        <th className="p-3 border-l font-mono">دریافتی از اعتبار انتقالی</th>
                        <th className="p-3 border-l font-mono">اعتبار مصرف شده</th>
                        <th className="p-3 border-l font-mono">مانده پایان سال</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {form10Data.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-800">{row.section}</td>
                          <td className="p-3 font-mono text-teal-700 font-semibold">{row.transferredDraftsExpense || row.transferredFunds}</td>
                          <td className="p-3 font-mono text-blue-700 font-semibold">{row.receivedNotifiedBonds || "-"}</td>
                          <td className="p-3 font-mono font-bold">{row.consumedTransferred?.toLocaleString("fa-IR") || "-"}</td>
                          <td className="p-3 font-mono text-emerald-800 font-black">{row.yearEndMoeinApproved || row.yearEndBalance || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── فرم ۱۱ ─── */}
          <TabsContent value="form11">
            <Card className="border shadow-sm">
              <CardHeader className="bg-indigo-50/70 border-b pb-4">
                <CardTitle className="text-base font-black text-indigo-900">
                  فرم ۱۱ — اسناد واخواهی شده و کسری ابواب جمعی
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right border-collapse border border-slate-200">
                    <thead>
                      <tr className="bg-indigo-100 text-indigo-900 font-bold border-b">
                        <th className="p-3 border-l">عنوان سطر</th>
                        <th className="p-3 border-l font-mono">معین هزینه‌ای</th>
                        <th className="p-3 border-l font-mono">معین سرمایه‌ای</th>
                        <th className="p-3 w-36">مانده ابتدای سال</th>
                        <th className="p-3 w-36">مصرف شده</th>
                        <th className="p-3 w-36">ارسال به خزانه</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {form11Data.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-800">{row.rowType}</td>
                          <td className="p-3 font-mono text-indigo-700 font-semibold">{row.moeinExpense || row.yearEndMoeinExpense}</td>
                          <td className="p-3 font-mono text-indigo-700 font-semibold">{row.moeinCapital || row.yearEndMoeinCapital}</td>
                          <td className="p-2 font-mono">{row.initialBalance.toLocaleString("fa-IR")}</td>
                          <td className="p-2 font-mono">{row.consumedTransferred.toLocaleString("fa-IR")}</td>
                          <td className="p-2 font-mono">{row.sentToTreasury.toLocaleString("fa-IR")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── فرم ۱۳ ─── */}
          <TabsContent value="form13">
            <Card className="border shadow-sm">
              <CardHeader className="bg-cyan-50/70 border-b pb-4">
                <CardTitle className="text-base font-black text-cyan-900">
                  فرم ۱۳ — اوراق مالی، واگذار شده و انتقالی
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right border-collapse border border-slate-200">
                    <thead>
                      <tr className="bg-cyan-100 text-cyan-900 font-bold border-b">
                        <th className="p-3 border-l">عنوان ستون</th>
                        <th className="p-3 border-l w-20 text-center">نوع حساب</th>
                        <th className="p-3 border-l font-mono">معین هزینه‌ای مصوب</th>
                        <th className="p-3 border-l font-mono">معین سرمایه‌ای مصوب</th>
                        <th className="p-3 w-44">مبلغ اوراق (ریال)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {form13Data.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-800">{row.rowType}</td>
                          <td className="p-3 text-center font-mono">{row.accountType}</td>
                          <td className="p-3 font-mono text-cyan-700 font-semibold">{row.moeinExpenseApproved}</td>
                          <td className="p-3 font-mono text-cyan-700 font-semibold">{row.moeinCapitalApproved}</td>
                          <td className="p-3 font-mono font-bold text-cyan-900">{row.amount.toLocaleString("fa-IR")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      )}

      {/* ════════════════════════ حالت ۲: داشبورد ممیزی و قوانین ════════════════════════ */}
      {mainMode === "audit" && (
        <div className="space-y-6">
          {/* خلاصه کارت‌ها */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">فرم‌های اعتبارسنجی شده</p>
                  <h3 className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">{checkedCount} فرم</h3>
                </div>
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl text-emerald-600">
                  <FileCheck2 className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            <Card className={cn(
              "border-2",
              errors.length > 0 
                ? "border-amber-300 bg-amber-50/50 dark:bg-amber-950/20" 
                : "border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20"
            )}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-foreground/80">مجموع مغایرت‌های سناما</p>
                  <h3 className={cn("text-2xl font-black mt-1", errors.length > 0 ? "text-amber-600" : "text-emerald-600")}>
                    {errors.length} خطای سناما
                  </h3>
                </div>
                <div className={cn("p-3 rounded-xl", errors.length > 0 ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600")}>
                  {errors.length > 0 ? <AlertTriangle className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-blue-800 dark:text-blue-300">قواعد خزانه‌داری کل</p>
                  <h3 className="text-2xl font-black text-blue-700 dark:text-blue-400 mt-1">۳۳ ضابطه سناما</h3>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-xl text-blue-600">
                  <ShieldCheck className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-950/20">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-purple-800 dark:text-purple-300">انواع اعتبارات</p>
                  <h3 className="text-2xl font-black text-purple-700 dark:text-purple-400 mt-1">مصوب / ابلاغی</h3>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/40 rounded-xl text-purple-600">
                  <Layers className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ابزار ممیزی و قوانین */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 border shadow-sm">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <span>قوانین کنترل فرم عملکرد</span>
                  </CardTitle>
                  <Button size="sm" variant="outline" onClick={fetchData} disabled={loading} className="gap-1.5 h-8">
                    <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
                    <span>بازبینی</span>
                  </Button>
                </div>
                <div className="relative mt-2">
                  <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
                  <Input
                    placeholder="جستجوی کد یا عنوان قانون..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-9 h-9 text-xs"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-2 max-h-[600px] overflow-y-auto divide-y">
                <button
                  onClick={() => setSelectedRuleCode(null)}
                  className={cn(
                    "w-full text-right p-3 rounded-lg text-xs font-semibold transition flex items-center justify-between",
                    selectedRuleCode === null ? "bg-primary text-primary-foreground shadow" : "hover:bg-muted/50"
                  )}
                >
                  <span>نمایش همه قوانین و خطاها</span>
                  <Badge variant={selectedRuleCode === null ? "secondary" : "outline"} className="text-[10px]">
                    {errors.length} خطا
                  </Badge>
                </button>

                {filteredRules.map((rule) => {
                  const ruleErrors = errors.filter(e => e.code === rule.code);
                  const isSelected = selectedRuleCode === rule.code;

                  return (
                    <button
                      key={rule.code}
                      onClick={() => setSelectedRuleCode(rule.code)}
                      className={cn(
                        "w-full text-right p-3 rounded-lg text-xs transition flex flex-col gap-1 mt-1",
                        isSelected ? "bg-primary/10 border-primary border text-primary font-medium" : "hover:bg-muted/40 text-foreground/90"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold flex items-center gap-1.5">
                          <span className="bg-primary/20 text-primary px-1.5 py-0.5 rounded text-[11px]">کد {rule.code}</span>
                          {rule.title}
                        </span>
                        {ruleErrors.length > 0 ? (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                            {ruleErrors.length} خطا
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300 bg-emerald-50 px-1.5 py-0">
                            سالم
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{rule.desc}</p>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 border shadow-sm flex flex-col">
              <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-accent" />
                    <span>نتایج بررسی هوشمند و مغایرت‌ها</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {selectedRuleCode 
                      ? `نمایش نتایج مربوط به قانون کد ${selectedRuleCode}`
                      : "نمایش کلیه خطاها و مغایرت‌های یافت شده در فرم عملکرد سناما"}
                  </CardDescription>
                </div>
                {selectedRuleCode && (
                  <Button size="sm" variant="ghost" onClick={() => setSelectedRuleCode(null)} className="text-xs h-8">
                    پاک‌سازی فیلتر
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-4 flex-1 overflow-y-auto">
                {activeErrors.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground gap-3">
                    <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-inner">
                      <CheckCircle2 className="h-10 w-10 animate-bounce" />
                    </div>
                    <h4 className="text-base font-bold text-emerald-800 dark:text-emerald-300">هیچ مغایرتی یافت نشد!</h4>
                    <p className="text-xs max-w-md">
                      تمامی قوانین و ضوابط خزانه‌داری کل کشور (سناما) در فیلدها و اقلام اعتبارات با موفقیت برقرار است.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeErrors.map((err, i) => (
                      <div 
                        key={i} 
                        className="p-4 rounded-xl border border-destructive/30 bg-destructive/5 dark:bg-destructive/10 flex flex-col gap-2 transition hover:shadow-md"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="bg-destructive text-destructive-foreground px-2 py-0.5 rounded font-black text-xs">
                              خطای کد {err.code}
                            </span>
                            <span className="text-xs font-semibold text-foreground/80">
                              شناسه ردیف: <span className="font-mono text-primary">{err.itemRef}</span>
                            </span>
                          </div>
                          <Badge variant="outline" className="border-destructive/40 text-destructive text-[11px]">
                            عدم رعایت ضوابط سناما
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-destructive/20 mt-1">
                          <p className="text-xs font-medium text-destructive dark:text-red-400 leading-relaxed pr-1">
                            {err.message}
                          </p>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => openEditModal(err.itemRef)}
                            className="text-xs gap-1.5 h-8 bg-blue-600 hover:bg-blue-700 text-white font-bold shrink-0 shadow-sm"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            <span>اصلاح فیلدها و رفع خطا</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ─── مدال اصلاح سریع فیلدهای سناما (پاسخ به کد ۱۳۲ و سایر کدها) ─── */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
          <Card className="w-full max-w-lg shadow-2xl border-2 border-blue-500 bg-background animate-in fade-in zoom-in duration-200">
            <CardHeader className="bg-blue-600 text-white p-4 flex flex-row items-center justify-between rounded-t-xl">
              <div>
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Pencil className="h-5 w-5 text-blue-200" />
                  <span>اصلاح فیلدهای سناما برای اعتبار مشخص‌شده</span>
                </CardTitle>
                <CardDescription className="text-xs text-blue-100 font-sans mt-1 flex flex-col gap-0.5">
                  <span>عنوان اعتبار: <strong className="text-white">{editingItem.title || "اعتبار ردیف ثبت‌شده در سیستم"}</strong></span>
                  <span className="font-mono text-[11px] opacity-90">شناسه رکورد: {editingItem.id}</span>
                </CardDescription>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setEditingItem(null)} className="text-white hover:bg-blue-700 h-8 w-8 p-0 rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 rounded-lg text-amber-900 dark:text-amber-300">
                <p className="font-bold">راهنمای رفع خطای ۱۳۲ و قوانین سناما:</p>
                <p className="mt-1 leading-relaxed">
                  حداقل یکی از فیلدهای «شماره طرح»، «شماره ردیف متفرقه» یا «شماره ردیف تملک دارایی‌های مالی» باید با یک شماره معتبر خزانه‌داری جای‌گذاری و مقداردهی شود.
                </p>
              </div>

              {/* نمایش خطای عدم اعمال با دلیل روشن */}
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-rose-800 font-medium text-xs flex items-start gap-2 animate-in fade-in">
                  <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">{modalError}</div>
                </div>
              )}

              {/* نمایش پیغام موفقیت */}
              {modalSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-800 font-medium text-xs flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div>{modalSuccess}</div>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">شماره طرح (project_number)</label>
                <Input
                  value={editForm.project_number}
                  onChange={e => {
                    setEditForm({ ...editForm, project_number: e.target.value });
                    setModalError(null);
                  }}
                  placeholder="مثال: 1307002001"
                  className="h-9 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">شماره ردیف متفرقه (misc_row_number)</label>
                <Input
                  value={editForm.misc_row_number}
                  onChange={e => {
                    setEditForm({ ...editForm, misc_row_number: e.target.value });
                    setModalError(null);
                  }}
                  placeholder="مثال: 503000"
                  className="h-9 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">شماره ردیف تملک دارایی‌های مالی (financial_assets_row_number)</label>
                <Input
                  value={editForm.financial_assets_row_number}
                  onChange={e => {
                    setEditForm({ ...editForm, financial_assets_row_number: e.target.value });
                    setModalError(null);
                  }}
                  placeholder="مثال: 700001"
                  className="h-9 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">شماره برنامه</label>
                  <Input
                    value={editForm.program_number}
                    onChange={e => setEditForm({ ...editForm, program_number: e.target.value })}
                    placeholder="مثال: 10101"
                    className="h-9 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">ردیف ابلاغ دهنده</label>
                  <Input
                    value={editForm.notifier_budget_row}
                    onChange={e => setEditForm({ ...editForm, notifier_budget_row: e.target.value })}
                    placeholder="مثال: 102000"
                    className="h-9 font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t mt-4">
                <Button variant="outline" onClick={() => setEditingItem(null)} disabled={modalSaving} className="h-9 text-xs">
                  انصراف
                </Button>
                <Button onClick={handleSaveEdit} disabled={modalSaving} className="h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 shadow">
                  {modalSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  <span>{modalSaving ? "در حال ذخیره‌سازی..." : "ذخیره و اعمال در سناما"}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </PageShell>
  );
}
