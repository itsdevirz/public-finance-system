import { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { 
  Landmark, CheckCircle2, Trash2, AlertCircle, FileCheck, Upload, Paperclip, Lock,
  Plus, Save, FileText, Printer, FileSpreadsheet, Download, Layers, ShieldCheck, Scale,
  Calculator, Search, HelpCircle, ArrowRight, Eye, RefreshCw
} from "lucide-react";
import { PersianDatePicker } from "@/components/ui/persian-date-picker";
import api from "@/api";
import { validateAndLogFileUpload } from "@/lib/fileUploadLogger";
import * as XLSX from "xlsx";

function fmtNum(n) {
  if (n === 0 || n == null || isNaN(n)) return "۰";
  return Number(n).toLocaleString("fa-IR");
}

function numToPersianWords(num) {
  if (!num || isNaN(num) || num === 0) return "صفر ریال";
  const units = ["", "یک", "دو", "سه", "چهار", "پنج", "شش", "هفت", "هشت", "نه"];
  const teens = ["ده", "یازده", "دوازده", "سیزده", "چهارده", "پانزده", "شانزده", "هفده", "هجده", "نوزده"];
  const tens = ["", "ده", "بیست", "سی", "چهل", "پنجاه", "شصت", "هفتاد", "هشتاد", "نود"];
  const hundreds = ["", "صد", "دویست", "سیصد", "چهارصد", "پانصد", "ششصد", "هفتصد", "هشتصد", "نهصد"];
  const thousands = ["", " هزار", " میلیون", " میلیارد", " تریلیون"];

  const n = Math.abs(Number(num));
  let str = n.toString();
  let parts = [];
  while (str.length > 0) {
    parts.unshift(str.slice(-3));
    str = str.slice(0, -3);
  }

  const convertGroup = (g) => {
    let val = parseInt(g, 10);
    if (val === 0) return "";
    let res = [];
    let h = Math.floor(val / 100);
    let rem = val % 100;
    let t = Math.floor(rem / 10);
    let u = rem % 10;

    if (h > 0) res.push(hundreds[h]);
    if (rem >= 10 && rem < 20) {
      res.push(teens[rem - 10]);
    } else {
      if (t > 0) res.push(tens[t]);
      if (u > 0) res.push(units[u]);
    }
    return res.join(" و ");
  };

  let wordParts = [];
  for (let i = 0; i < parts.length; i++) {
    let groupWord = convertGroup(parts[i]);
    if (groupWord) {
      let scale = thousands[parts.length - 1 - i];
      wordParts.push(groupWord + scale);
    }
  }
  return wordParts.join(" و ") + " ریال";
}

// فصول هزینه‌ای و سرمایه‌ای جهت سطر تفصیلی‌ها
export const EXPENSE_CHAPTERS = [
  { code: "210000", title: "جبران خدمات کارکنان (فصل ۱)" },
  { code: "220000", title: "استفاده از کالاها و خدمات (فصل ۲)" },
  { code: "230000", title: "مصرف سرمایه‌های ثابت (فصل ۳)" },
  { code: "240000", title: "سود (فصل ۴)" },
  { code: "250000", title: "یارانه (فصل ۵)" },
  { code: "260000", title: "کمک‌های بلاعوض (فصل ۶)" },
  { code: "270000", title: "مزایای اجتماعی (فصل ۷)" },
  { code: "280000", title: "سایر هزینه‌ها (فصل ۸)" },
];

export const CAPITAL_CHAPTERS = [
  { code: "110100", title: "ساختمان و مستحدثات (فصل ۱)" },
  { code: "110200", title: "ماشین‌آلات و تجهیزات (فصل ۲)" },
  { code: "110300", title: "سایر دارایی‌های ثابت (فصل ۳)" },
  { code: "120100", title: "تغییر در موجودی انبار (فصل ۴)" },
  { code: "130100", title: "اقلام گرانبها (فصل ۵)" },
  { code: "210000", title: "زمین (فصل ۶)" },
  { code: "220000", title: "سایر دارایی‌های تولید نشده (فصل ۷)" },
];

export default function RealizationModule() {
  const { pathname } = useLocation();

  // زبانه اصلی: "receipts" (دریافت اعتبارات) / "realizations" (تحقق و تسجیل صورتحساب‌ها)
  const [mainView, setMainView] = useState("receipts");

  // داده‌های دریافت شده از سرور
  const [receipts, setReceipts] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [agreements, setAgreements] = useState([]);
  const [realizations, setRealizations] = useState([]);
  const [obligations, setObligations] = useState([]);

  const [loading, setLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // =========================================================================
  // فرم اصلی دریافت اعتبارات (Credit Receipt Form)
  // =========================================================================
  const [headerForm, setHeaderForm] = useState({
    creditCategory: "expense", // expense (هزینه‌ای) / capital (تملک دارایی‌های سرمایه‌ای)
    creditType: "approved", // approved (استانی مصوب) / central (ابلاغی متمرکز)
    sourceType: "public", // public (عمومی - ۱) / special (اختصاصی - ۲)
    yearType: "current", // current (جاری) / supplementary (متمم) / prior (سنواتی)
    fiscalYear: "1404",
    receiptDate: new Date().toLocaleDateString("fa-IR"),
    allocation_id: "", // شناسه تخصیص انتخابی (آیتم مبنا)
    allocationBaseCode: "", // کد مبنای تخصیص صادرشده از مرحله قبل
    receiptBaseCode: `RCPT-BASE-1404-${Math.floor(100000 + Math.random() * 900000)}`, // کد مبنای صادرشده برای مرحله بعد (تأمین اعتبار)
    bankAccountCode: "11001",
    treasuryInstrument: "none", // none (نقدی) / treasury_bill (اسناد خزانه) / murabaha_bond (اوراق مرابحه)
    bankName: "بانک اعتبارات هزینه‌ای عمومی",
    referenceNumber: "",
    description: "",
  });

  // سطرهای تفصیلی دریافت اعتبارات
  const [detailRows, setDetailRows] = useState([
    {
      id: "row_1",
      chapterCode: "210000",
      chapterTitle: "جبران خدمات کارکنان (فصل ۱)",
      programOrProjectNumber: "1001",
      budgetRow: "109000",
      allocatedAmount: 0,
      receivedAmount: 0,
      description: "دریافت اعتبار سه‌ماهه اول فصل اول حقوق پرسنل",
    },
  ]);

  // =========================================================================
  // فرم تسجیل و تحقق صورتحساب‌ها (Legacy Realization Form)
  // =========================================================================
  const [realizeForm, setRealizeForm] = useState({
    obligation_id: "",
    fiscal_year: "1404",
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

  // دریافت داده‌ها از Backend
  const fetchData = async () => {
    setLoading(true);
    try {
      const [rcpRes, alcRes, agrRes, rlzRes, oblRes] = await Promise.all([
        api.get("/api/credits/receipts"),
        api.get("/api/credits/allocations"),
        api.get("/api/credits/agreements"),
        api.get("/api/credits/realizations"),
        api.get("/api/credits/obligations")
      ]);
      const rcpList = rcpRes.data?.data || [];
      const alcList = alcRes.data?.data || [];
      const agrList = agrRes.data?.data || [];
      setReceipts(rcpList);
      setAllocations(alcList);
      setAgreements(agrList);
      setRealizations(rlzRes.data?.data || []);
      setObligations(oblRes.data?.data || []);

      if (alcList.length > 0 && !headerForm.allocation_id) {
        handleSelectAllocation(alcList[0], agrList);
      }
    } catch (e) {
      setAlertMsg({ type: "error", text: "خطا در دریافت اطلاعات دریافت اعتبارات و تسجیل" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pathname]);

  // هنگام تغییر دسته اعتبارات (هزینه‌ای / تملک)، کدهای بانک و فصول را تنظیم می‌کنیم
  const handleCategoryTabChange = (cat) => {
    const isCap = cat === "capital";
    const bankCode = isCap ? "11002" : "11001";
    const srcTitle = headerForm.sourceType === "special" ? "اختصاصی" : "عمومی";
    const bankName = isCap ? `بانک تملک دارایی‌های سرمایه‌ای ${srcTitle}` : `بانک اعتبارات هزینه‌ای ${srcTitle}`;

    setHeaderForm(prev => ({
      ...prev,
      creditCategory: cat,
      bankAccountCode: bankCode,
      bankName
    }));

    const chapters = isCap ? CAPITAL_CHAPTERS : EXPENSE_CHAPTERS;
    setDetailRows([
      {
        id: `row_${Date.now()}`,
        chapterCode: chapters[0].code,
        chapterTitle: chapters[0].title,
        programOrProjectNumber: isCap ? "2001" : "1001",
        budgetRow: "109000",
        allocatedAmount: 0,
        receivedAmount: 0,
        description: `دریافت اعتبار ${isCap ? "عمرانی/تملک" : "جاری/هزینه‌ای"}`,
      }
    ]);
  };

  // انتخاب تخصیص به عنوان «آیتم مبنا» (Linkage from Allocation)
  const handleSelectAllocation = (alc, agrsList = agreements) => {
    if (!alc) return;
    const matchedAgr = agrsList.find(a => String(a._id) === String(alc.agreement_id));
    const isCap = alc.creditCategory === "capital" || alc.credit_category === "capital" || matchedAgr?.credit_category === "capital";
    const isSpecial = String(alc.sourceType || alc.source_type || matchedAgr?.source_type || "1") === "2" || alc.sourceType === "special";
    const isCentral = alc.creditType === "notified" || alc.credit_type === "notified" || matchedAgr?.credit_type === "notified";

    const baseAllocCode = alc.allocationBaseCode || alc.base_code || `ALLOC-BASE-${alc.fiscalYear || 1404}-${Date.now()}`;
    const newRcptBaseCode = `RCPT-BASE-${alc.fiscalYear || 1404}-${Math.floor(100000 + Math.random() * 900000)}`;

    const bankCode = isCap ? "11002" : "11001";
    const srcTitle = isSpecial ? "اختصاصی" : "عمومی";
    const bankName = isCap ? `بانک تملک دارایی‌های سرمایه‌ای ${srcTitle}` : `بانک اعتبارات هزینه‌ای ${srcTitle}`;

    setHeaderForm(prev => ({
      ...prev,
      allocation_id: String(alc._id),
      allocationBaseCode: baseAllocCode,
      receiptBaseCode: newRcptBaseCode,
      creditCategory: isCap ? "capital" : "expense",
      creditType: isCentral ? "central" : "approved",
      sourceType: isSpecial ? "special" : "public",
      fiscalYear: String(alc.fiscalYear || matchedAgr?.fiscal_year || "1404"),
      bankAccountCode: bankCode,
      bankName,
      description: `دریافت اعتبار مربوط به تخصیص ${alc.allocation_number || baseAllocCode} — ${matchedAgr?.title || "موافقتنامه"}`
    }));

    // پر کردن سطرهای تفصیلی بر اساس تخصیص انتخابی
    if (Array.isArray(alc.items) && alc.items.length > 0) {
      setDetailRows(alc.items.map((item, idx) => ({
        id: `row_alc_${idx}_${Date.now()}`,
        chapterCode: item.chapterCode || (isCap ? "110100" : "210000"),
        chapterTitle: item.chapterTitle || "فصل بودجه‌ای",
        programOrProjectNumber: item.programOrProjectNumber || "1001",
        budgetRow: item.agencyRow || alc.agencyBudgetRow || "109000",
        allocatedAmount: Number(item.amount) || 0,
        receivedAmount: Number(item.amount) || 0,
        description: item.description || `دریافت بابت سطر ${idx + 1}`
      })));
    } else {
      const totAmt = Number(alc.amount || alc.total_amount) || 0;
      const chapters = isCap ? CAPITAL_CHAPTERS : EXPENSE_CHAPTERS;
      setDetailRows([{
        id: `row_alc_single_${Date.now()}`,
        chapterCode: chapters[0].code,
        chapterTitle: chapters[0].title,
        programOrProjectNumber: matchedAgr?.program_code || "1001",
        budgetRow: alc.agencyBudgetRow || "109000",
        allocatedAmount: totAmt,
        receivedAmount: totAmt,
        description: `دریافت بابت تخصیص ${alc.allocation_number || ""}`
      }]);
    }
  };

  // افزودن سطر تفصیلی جدید
  const addDetailRow = () => {
    const chapters = headerForm.creditCategory === "capital" ? CAPITAL_CHAPTERS : EXPENSE_CHAPTERS;
    setDetailRows(prev => [
      ...prev,
      {
        id: `row_${Date.now()}_${Math.random()}`,
        chapterCode: chapters[0].code,
        chapterTitle: chapters[0].title,
        programOrProjectNumber: headerForm.creditCategory === "capital" ? "2001" : "1001",
        budgetRow: "109000",
        allocatedAmount: 0,
        receivedAmount: 0,
        description: ""
      }
    ]);
  };

  // حذف سطر تفصیلی
  const removeDetailRow = (id) => {
    if (detailRows.length === 1) return;
    setDetailRows(prev => prev.filter(r => r.id !== id));
  };

  // به‌روزرسانی فیلد سطر تفصیلی
  const updateDetailRow = (id, field, val) => {
    setDetailRows(prev => prev.map(r => {
      if (r.id !== id) return r;
      if (field === "chapterCode") {
        const chapters = headerForm.creditCategory === "capital" ? CAPITAL_CHAPTERS : EXPENSE_CHAPTERS;
        const found = chapters.find(c => c.code === val);
        return { ...r, chapterCode: val, chapterTitle: found?.title || val };
      }
      return { ...r, [field]: val };
    }));
  };

  // محاسبه جمع کل مبالغ دریافتی
  const totalReceiptAmount = useMemo(() => {
    return detailRows.reduce((sum, r) => sum + (Number(r.receivedAmount) || 0), 0);
  }, [detailRows]);

  // =========================================================================
  // محاسبه و پیش‌نمایش سند حسابداری خودکار بر اساس ۴ حالت هزینه‌ای و ۴ حالت تملک
  // =========================================================================
  const voucherPreview = useMemo(() => {
    const isCap = headerForm.creditCategory === "capital";
    const isCentral = headerForm.creditType === "central";
    const isPrior = headerForm.yearType === "prior";
    const isSpecial = headerForm.sourceType === "special";
    const srcTitle = isSpecial ? "منبع اختصاصی" : "منبع عمومی";
    const yearTitle = isPrior ? "سنواتی" : headerForm.yearType === "supplementary" ? "متمم" : "جاری";
    const amt = totalReceiptAmount;

    const lines = [];

    if (!isCap) {
      // ===== ۱. اعتبارات هزینه‌ای =====
      const bankCode = "11001";
      const bankName = `بانک اعتبارات هزینه‌ای (${srcTitle})`;

      if (!isCentral) {
        // ۱ & ۲. استانی (مصوب)
        const credCode = isPrior ? "41007" : "41001";
        const credName = isPrior ? `دریافت اعتبارات هزینه‌ای سنواتی (${srcTitle})` : `دریافت اعتبارات جاری (${srcTitle})`;

        lines.push({ code: bankCode, title: bankName, debit: amt, credit: 0, type: "FINANCIAL" });
        lines.push({ code: credCode, title: credName, debit: 0, credit: amt, type: "FINANCIAL" });
      } else {
        // ۳ & ۴. ابلاغی متمرکز هزینه‌ای
        lines.push({ code: bankCode, title: bankName, debit: amt, credit: 0, type: "FINANCIAL" });
        lines.push({ code: "46001", title: `درآمد انتقالات (${srcTitle})`, debit: 0, credit: amt, type: "FINANCIAL" });

        // ثبت‌های انتظامی/بودجه‌ای ابلاغی
        lines.push({ code: "81017", title: `حساب انتظامی اعتبارات ابلاغی ${yearTitle} (${srcTitle})`, debit: amt, credit: 0, type: "BUDGETARY" });
        lines.push({ code: "82017", title: `طرف حساب انتظامی اعتبارات ابلاغی ${yearTitle} (${srcTitle})`, debit: 0, credit: amt, type: "BUDGETARY" });
      }
    } else {
      // ===== ۲. اعتبارات تملک دارایی‌های سرمایه‌ای =====
      const bankCode = "11002";
      const bankName = `بانک تملک دارایی‌های سرمایه‌ای (${srcTitle})`;

      if (!isCentral) {
        // ۱ & ۲. استانی (مصوب) تملک
        const credCode = isPrior ? "41008" : "41003";
        const credName = isPrior ? `دریافت اعتبارات سرمایه‌ای سنواتی (${srcTitle})` : `دریافت اعتبارات سرمایه‌ای (${srcTitle})`;

        lines.push({ code: bankCode, title: bankName, debit: amt, credit: 0, type: "FINANCIAL" });
        lines.push({ code: credCode, title: credName, debit: 0, credit: amt, type: "FINANCIAL" });
      } else {
        // ۳ & ۴. ابلاغی متمرکز تملک
        lines.push({ code: bankCode, title: bankName, debit: amt, credit: 0, type: "FINANCIAL" });
        lines.push({ code: "46001", title: `درآمد انتقالات / اعتبارات سرمایه‌ای ابلاغی (${srcTitle})`, debit: 0, credit: amt, type: "FINANCIAL" });

        // ثبت‌های انتظامی ابلاغی
        lines.push({ code: "81017", title: `حساب انتظامی اعتبارات ابلاغی سرمایه‌ای ${yearTitle} (${srcTitle})`, debit: amt, credit: 0, type: "BUDGETARY" });
        lines.push({ code: "82017", title: `طرف حساب انتظامی اعتبارات ابلاغی سرمایه‌ای ${yearTitle} (${srcTitle})`, debit: 0, credit: amt, type: "BUDGETARY" });

        // اسناد خزانه (81010 / 82010)
        if (headerForm.treasuryInstrument === "treasury_bill") {
          lines.push({ code: "81010", title: `اسناد خزانه اسلامی ${yearTitle} (${srcTitle})`, debit: amt, credit: 0, type: "BUDGETARY" });
          lines.push({ code: "82010", title: `طرف حساب اسناد خزانه اسلامی ${yearTitle} (${srcTitle})`, debit: 0, credit: amt, type: "BUDGETARY" });
        }
        // اوراق مرابحه (81019 / 82019)
        if (headerForm.treasuryInstrument === "murabaha_bond") {
          lines.push({ code: "81019", title: `اوراق مرابحه ${yearTitle} (${srcTitle})`, debit: amt, credit: 0, type: "BUDGETARY" });
          lines.push({ code: "82019", title: `طرف حساب اوراق مرابحه ${yearTitle} (${srcTitle})`, debit: 0, credit: amt, type: "BUDGETARY" });
        }
      }
    }

    return lines;
  }, [headerForm, totalReceiptAmount]);

  // ذخیره و صدور سند دریافت اعتبار
  const handleSaveReceipt = async (issueVoucher = true) => {
    if (totalReceiptAmount <= 0) {
      setAlertMsg({ type: "error", text: "مبلغ دریافتی باید بزرگتر از صفر باشد." });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...headerForm,
        totalAmount: totalReceiptAmount,
        amount: totalReceiptAmount,
        items: detailRows,
        issue_journal_voucher: issueVoucher,
        status: "confirmed"
      };

      const res = await api.post("/api/credits/receipts", payload);
      setAlertMsg({ 
        type: "success", 
        text: issueVoucher 
          ? `دریافت اعتبار با موفقیت ذخیره شد و سند حسابداری شماره «${res.data?.data?.journal_document_number || "خودکار"}» صادر گردید.`
          : "دریافت اعتبار با موفقیت ذخیره گردید."
      });

      // بارگذاری مجدد و ایجاد کد مبنای جدید
      fetchData();
      setHeaderForm(prev => ({
        ...prev,
        receiptBaseCode: `RCPT-BASE-${prev.fiscalYear}-${Math.floor(100000 + Math.random() * 900000)}`,
        referenceNumber: "",
        description: ""
      }));
    } catch (e) {
      setAlertMsg({ type: "error", text: "خطا در ثبت دریافت اعتبار" });
    } finally {
      setLoading(false);
    }
  };

  // حذف دریافت اعتبار
  const handleDeleteReceipt = async (id) => {
    if (!window.confirm("آیا از حذف این دریافت اعتبار اطمینان دارید؟")) return;
    try {
      await api.delete(`/api/credits/receipts/${id}`);
      setAlertMsg({ type: "success", text: "دریافت اعتبار حذف شد" });
      fetchData();
    } catch (e) {
      setAlertMsg({ type: "error", text: "خطا در حذف مورد" });
    }
  };

  // خروجی اکسل لیست دریافتی‌ها
  const handleExportExcel = () => {
    if (receipts.length === 0) return;
    const data = receipts.map((r, i) => ({
      "ردیف": i + 1,
      "کد مبنای دریافت": r.receiptBaseCode || "—",
      "دسته اعتبار": r.creditCategory === "capital" ? "تملک دارایی‌های سرمایه‌ای" : "اعتبارات هزینه‌ای",
      "نوع اعتبار": r.creditType === "central" ? "ابلاغی متمرکز" : "استانی (مصوب)",
      "منبع": r.sourceType === "special" ? "اختصاصی" : "عمومی",
      "سال": r.yearType === "prior" ? "سنواتی" : r.yearType === "supplementary" ? "متمم" : "جاری",
      "مبلغ کل (ریال)": r.totalAmount || r.amount || 0,
      "تاریخ دریافت": r.receiptDate || "—",
      "شماره سند حسابداری": r.journal_document_number || "—"
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "دریافت اعتبارات");
    XLSX.writeFile(wb, `دریافت_اعتبارات_${new Date().toLocaleDateString("fa-IR").replace(/\//g, "-")}.xlsx`);
  };

  // پرینت رسمی پروانه دریافت اعتبار
  const handlePrintReceiptForm = (rcpt) => {
    const win = window.open("", "_blank", "width=900,height=1000");
    if (!win) return;

    const isCap = rcpt.creditCategory === "capital";
    const srcTitle = rcpt.sourceType === "special" ? "منبع اختصاصی" : "منبع عمومی";
    const typeTitle = rcpt.creditType === "central" ? "ابلاغی متمرکز" : "استانی (مصوب)";
    const yearTitle = rcpt.yearType === "prior" ? "سنواتی" : rcpt.yearType === "supplementary" ? "متمم" : "سال جاری";

    const itemsHtml = (rcpt.items || []).map((item, idx) => `
      <tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td style="text-align:center; font-family: Courier;">${item.programOrProjectNumber || "—"}</td>
        <td>${item.chapterTitle || item.chapterCode}</td>
        <td style="text-align:center; font-family: Courier;">${item.budgetRow || "109000"}</td>
        <td style="text-align:left; font-family: Courier; font-weight:bold;">${fmtNum(item.receivedAmount)}</td>
        <td>${item.description || "—"}</td>
      </tr>
    `).join("");

    win.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="UTF-8"/>
  <title>پروانه دریافت اعتبار - ${rcpt.receiptBaseCode || rcpt._id}</title>
  <style>
    body { font-family: Tahoma, sans-serif; font-size: 11px; padding: 20px; color: #111; line-height: 1.6; }
    .hdr { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
    .hdr h2 { margin: 0; font-size: 15px; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th, td { border: 1px solid #444; padding: 6px 8px; font-size: 10.5px; }
    th { background: #f0f0f0; text-align: center; }
    .footer { margin-top: 50px; display: flex; justify-content: space-between; text-align: center; font-weight: bold; }
    .stamp { border: 2px dashed #059669; color: #059669; padding: 5px 15px; border-radius: 8px; font-weight: bold; display: inline-block; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="hdr">
    <div>
      <h2>جمهوری اسلامی ایران</h2>
      <div style="font-size:12px; font-weight:bold; margin-top:5px;">پروانه رسمی دریافت اعتبار بودجه‌ای</div>
    </div>
    <div style="text-align:left;">
      <div>کد مبنای دریافت: <b>${rcpt.receiptBaseCode || "—"}</b></div>
      <div>تاریخ ثبت: ${rcpt.receiptDate || new Date().toLocaleDateString("fa-IR")}</div>
      <div>شماره سند حسابداری: <b>${rcpt.journal_document_number || "—"}</b></div>
    </div>
  </div>

  <div style="background:#f9fafb; padding:10px; border:1px solid #e5e7eb; border-radius:6px; margin-bottom:15px;">
    <b>مشخصات کلان اعتبار:</b><br/>
    • نوع اعتبار: <b>${isCap ? "تملک دارایی‌های سرمایه‌ای" : "اعتبارات هزینه‌ای"} (${typeTitle})</b><br/>
    • منبع و سال: <b>${srcTitle} — سال ${yearTitle} (${rcpt.fiscalYear || 1404})</b><br/>
    • مبلغ کل دریافتی: <b style="font-size:13px; color:#047857;">${fmtNum(rcpt.totalAmount || rcpt.amount)} ریال</b> (${numToPersianWords(rcpt.totalAmount || rcpt.amount)})
  </div>

  <table>
    <thead>
      <tr>
        <th>ردیف</th>
        <th>کد برنامه / طرح</th>
        <th>فصل بودجه‌ای</th>
        <th>ردیف بودجه</th>
        <th>مبلغ واریزی (ریال)</th>
        <th>شرح تفصیلی</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
  </table>

  <div style="margin-top:20px; font-size:10px; color:#555;">
    • این سند به منزله وصول قطعی اعتبار در حساب بانک مربوطه بوده و مبنای مرحله بعدی (تأمین اعتبار و پرداخت) قرار می‌گیرد.
  </div>

  <div class="footer">
    <div>مسئول اعتبارات و تنظیم حساب‌ها</div>
    <div>ذیحسابی و مدیر امور مالی</div>
    <div>رئیس دستگاه اجرایی / تایید نهایی</div>
  </div>

  <script>window.onload=function(){setTimeout(function(){window.print();window.close();},300);}</script>
</body>
</html>`);
    win.document.close();
  };

  // =========================================================================
  // هندلرهای بخش تسجیل صورتحساب‌ها (Realization Handlers)
  // =========================================================================
  const handleRealizeSubmit = async (e) => {
    e.preventDefault();
    if (!realizeForm.obligation_id || !realizeForm.claimed_amount || !realizeForm.verified_amount) {
      setAlertMsg({ type: "error", text: "انتخاب تعهد و ورود مبالغ تسجیل الزامی است" });
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/credits/realizations", {
        ...realizeForm,
        fiscal_year: Number(realizeForm.fiscal_year || 1404),
        claimed_amount: Number(realizeForm.claimed_amount),
        verified_amount: Number(realizeForm.verified_amount),
        bill_number: realizeForm.bill_number || `BILL-${Date.now().toString().slice(-6)}`
      });
      setAlertMsg({ type: "success", text: "مورد تسجیل/تحقق هزینه با موفقیت ثبت و به تعهد مربوط متصل شد." });
      setRealizeForm({
        obligation_id: "",
        fiscal_year: "1404",
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

  const handleDeleteRealization = async (id) => {
    if (!window.confirm("آیا از حذف این مورد تسجیل اطمینان دارید؟")) return;
    try {
      await api.delete(`/api/credits/realizations/${id}`);
      setAlertMsg({ type: "success", text: "مورد تسجیل حذف شد" });
      fetchData();
    } catch (e) {
      setAlertMsg({ type: "error", text: "خطا در حذف مورد" });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-right" dir="rtl">
      {/* پیام‌های هشدار / موفقیت */}
      {alertMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs font-bold flex items-center justify-between shadow-sm ${
            alertMsg.type === "error"
              ? "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-300"
              : "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {alertMsg.type === "error" ? <AlertCircle className="h-4 w-4 text-rose-600" /> : <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
            <span>{alertMsg.text}</span>
          </div>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground" onClick={() => setAlertMsg(null)}>
            ×
          </Button>
        </div>
      )}

      {/* هدر اصلی ماژول دریافت اعتبارات */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 text-white p-5 rounded-2xl shadow-md border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Landmark className="h-6 w-6 text-teal-400" />
            <h1 className="text-lg font-black text-white">مدیریت دریافت اعتبارات و خزانه (مرحله سوم اعتبارات)</h1>
          </div>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            ثبت وصول اعتبارات از خزانه کل، تفکیک اعتبارات استانی و ابلاغی متمرکز، مدیریت منابع عمومی/اختصاصی و صدور خودکار اسناد حسابداری دوبل.
          </p>
        </div>

        {/* سوییچر زبانه‌های اصلی */}
        <div className="flex items-center gap-1.5 bg-slate-800/90 p-1.5 rounded-xl border border-slate-700">
          <button
            onClick={() => setMainView("receipts")}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              mainView === "receipts"
                ? "bg-teal-600 text-white shadow-md"
                : "text-slate-300 hover:bg-slate-700/50"
            }`}
          >
            <Landmark className="h-4 w-4" />
            ۱. دریافت اعتبارات (وصول خزانه)
          </button>

          <button
            onClick={() => setMainView("realizations")}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              mainView === "realizations"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-300 hover:bg-slate-700/50"
            }`}
          >
            <FileCheck className="h-4 w-4" />
            ۲. تحقق و تسجیل صورتحساب‌ها
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* بخش ۱: دریافت اعتبارات (وصول اعتبارات از خزانه) */}
      {/* ========================================================================= */}
      {mainView === "receipts" && (
        <div className="space-y-6">
          {/* دو بخش اصلی نوع اعتبار (اعتبارات هزینه‌ای / اعتبارات تملک دارایی‌های سرمایه‌ای) */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b pb-3">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div>
                  <CardTitle className="text-sm font-extrabold flex items-center gap-2 text-slate-800 dark:text-slate-100">
                    <Scale className="h-4 w-4 text-teal-600" />
                    ورود اطلاعات و صدور پروانه دریافت اعتبار
                  </CardTitle>
                  <CardDescription className="text-[11px] mt-0.5">
                    انتخاب «آیتم مبنا» از مرحله تخصیص، تعیین نوع اعتبار، منبع مالی، سال و صدور اسناد حسابداری دوبل
                  </CardDescription>
                </div>

                {/* تب دو بخش اصلی: هزینه‌ای vs تملک دارایی‌های سرمایه‌ای */}
                <div className="flex items-center gap-2 bg-white dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner">
                  <button
                    onClick={() => handleCategoryTabChange("expense")}
                    className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 ${
                      headerForm.creditCategory === "expense"
                        ? "bg-teal-600 text-white shadow"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span>📜 اعتبارات هزینه‌ای</span>
                    <Badge variant="secondary" className="bg-white/20 text-white text-[10px] px-1 py-0 font-mono">11001</Badge>
                  </button>

                  <button
                    onClick={() => handleCategoryTabChange("capital")}
                    className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 ${
                      headerForm.creditCategory === "capital"
                        ? "bg-blue-600 text-white shadow"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span>🏗 اعتبارات تملک دارایی‌های سرمایه‌ای</span>
                    <Badge variant="secondary" className="bg-white/20 text-white text-[10px] px-1 py-0 font-mono">11002</Badge>
                  </button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-6">
              {/* انتخاب «آیتم مبنا» (Linkage from Allocation) */}
              <div className="bg-teal-50/70 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/50 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-extrabold text-teal-900 dark:text-teal-200 flex items-center gap-2">
                    <Layers className="h-4 w-4 text-teal-600" />
                    انتخاب «آیتم مبنا» (لینک به مرحله تخصیص اعتبارات)
                  </Label>
                  <span className="text-[10px] text-teal-700 dark:text-teal-400 font-bold">
                    * جهت انتقال اطلاعات موافقتنامه، تخصیص و ردیف‌های بودجه‌ای به این مرحله
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <select
                      value={headerForm.allocation_id}
                      onChange={(e) => {
                        const found = allocations.find(a => String(a._id) === String(e.target.value));
                        handleSelectAllocation(found);
                      }}
                      className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-teal-300 dark:border-teal-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                    >
                      <option value="">انتخاب تخصیص صادر شده به عنوان مبنا...</option>
                      {allocations.map(alc => {
                        const parentAgr = agreements.find(a => String(a._id) === String(alc.agreement_id));
                        const totAmt = alc.total_amount || alc.amount || 0;
                        return (
                          <option key={alc._id} value={alc._id}>
                            تخصیص {alc.allocation_number || alc.allocationBaseCode} — {parentAgr?.title || "موافقتنامه"} (مبلغ: {fmtNum(totAmt)} ریال)
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <div className="h-10 px-3 rounded-xl border border-teal-200 bg-white dark:bg-slate-900 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-bold">کد مبنای تخصیص:</span>
                      <span className="font-mono font-bold text-teal-700 dark:text-teal-300">{headerForm.allocationBaseCode || "—"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* فیلدهای سربرگ کلان فرم دریافت اعتبارات */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50/70 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                {/* ۱. نوع اعتبار */}
                <div>
                  <Label className="text-xs font-bold">۱. نوع اعتبار</Label>
                  <select
                    value={headerForm.creditType}
                    onChange={(e) => setHeaderForm({ ...headerForm, creditType: e.target.value })}
                    className="w-full h-9 px-3 text-xs font-bold rounded-lg border border-input bg-background mt-1.5"
                  >
                    <option value="approved">استانی (مصوب)</option>
                    <option value="central">ابلاغی متمرکز</option>
                  </select>
                </div>

                {/* ۲. نوع منبع */}
                <div>
                  <Label className="text-xs font-bold">۲. نوع منبع مالی</Label>
                  <select
                    value={headerForm.sourceType}
                    onChange={(e) => {
                      const src = e.target.value;
                      const isCap = headerForm.creditCategory === "capital";
                      const bankCode = isCap ? "11002" : "11001";
                      const srcTitle = src === "special" ? "اختصاصی" : "عمومی";
                      setHeaderForm({
                        ...headerForm,
                        sourceType: src,
                        bankAccountCode: bankCode,
                        bankName: isCap ? `بانک تملک دارایی‌های سرمایه‌ای ${srcTitle}` : `بانک اعتبارات هزینه‌ای ${srcTitle}`
                      });
                    }}
                    className="w-full h-9 px-3 text-xs font-bold rounded-lg border border-input bg-background mt-1.5"
                  >
                    <option value="public">منبع عمومی (۱)</option>
                    <option value="special">منبع اختصاصی (۲)</option>
                  </select>
                </div>

                {/* ۳. سال اعتبار */}
                <div>
                  <Label className="text-xs font-extrabold text-rose-700 dark:text-rose-400">۳. سال اعتبار (مهم)</Label>
                  <select
                    value={headerForm.yearType}
                    onChange={(e) => setHeaderForm({ ...headerForm, yearType: e.target.value })}
                    className="w-full h-9 px-3 text-xs font-black rounded-lg border border-rose-300 dark:border-rose-900 bg-background mt-1.5 text-rose-900 dark:text-rose-200"
                  >
                    <option value="current">۱- سال جاری</option>
                    <option value="supplementary">۲- متمم بودجه</option>
                    <option value="prior">۳- سال سنواتی</option>
                  </select>
                </div>

                {/* ۴. تاریخ دریافت */}
                <div>
                  <Label className="text-xs font-bold">تاریخ واریز / دریافت</Label>
                  <div className="mt-1.5">
                    <PersianDatePicker
                      value={headerForm.receiptDate}
                      onChange={(d) => setHeaderForm(prev => ({ ...prev, receiptDate: typeof d === "object" && d?.target ? d.target.value : String(d || "") }))}
                    />
                  </div>
                </div>

                {/* کد مبنای دریافت (جهت استفاده در مرحله بعد: تأمین اعتبار) */}
                <div>
                  <Label className="text-xs font-bold text-teal-700 dark:text-teal-300 flex items-center gap-1">
                    کد مبنای دریافت اعتبار
                    <HelpCircle className="h-3 w-3 text-slate-400" title="این کد مبنا جهت پیگیری و استفاده در مرحله بعدی (تأمین اعتبار) صادر می‌گردد." />
                  </Label>
                  <Input
                    value={headerForm.receiptBaseCode}
                    onChange={(e) => setHeaderForm({ ...headerForm, receiptBaseCode: e.target.value })}
                    className="h-9 text-xs font-mono font-bold text-teal-800 dark:text-teal-200 mt-1.5 bg-teal-50/50 dark:bg-teal-950/40"
                  />
                </div>

                {/* کد بانک بدهکار */}
                <div>
                  <Label className="text-xs font-bold">حساب بانک بدهکار (خودکار)</Label>
                  <div className="h-9 px-3 rounded-lg border border-input bg-muted/40 flex items-center justify-between text-xs mt-1.5">
                    <span className="font-bold text-slate-700 dark:text-slate-300">{headerForm.bankName}</span>
                    <Badge variant="outline" className="font-mono text-[10px] bg-white dark:bg-slate-900">{headerForm.bankAccountCode}</Badge>
                  </div>
                </div>

                {/* ابزار مالی / اسناد خزانه / اوراق مرابحه */}
                {headerForm.creditType === "central" && (
                  <div className="md:col-span-2">
                    <Label className="text-xs font-bold text-indigo-700 dark:text-indigo-300">نوع ابزار مالی دریافت متمرکز</Label>
                    <select
                      value={headerForm.treasuryInstrument}
                      onChange={(e) => setHeaderForm({ ...headerForm, treasuryInstrument: e.target.value })}
                      className="w-full h-9 px-3 text-xs font-bold rounded-lg border border-indigo-300 dark:border-indigo-900 bg-background mt-1.5"
                    >
                      <option value="none">واریز نقدی مستقیم به حساب بانک</option>
                      <option value="treasury_bill">اسناد خزانه اسلامی (حساب انتظامی ۸۱۰۱۰ / ۸۲۰۱۰)</option>
                      <option value="murabaha_bond">اوراق مرابحه (حساب انتظامی ۸۱۰۱۹ / ۸۲۰۱۹)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* ========================================================================= */}
              {/* جدول سطر تفصیلی‌ها (Detail Rows Table) */}
              {/* ========================================================================= */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Layers className="h-4 w-4 text-teal-600" />
                    سطر تفصیلی‌های دریافت اعتبار (جدول مبالغ به تفکیک برنامه/طرح و فصل بودجه)
                  </h3>
                  <Button size="sm" onClick={addDetailRow} className="h-8 text-xs font-bold gap-1 bg-teal-600 hover:bg-teal-700 text-white">
                    <Plus className="h-3.5 w-3.5" /> افزودن سطر تفصیلی
                  </Button>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto shadow-sm">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold">
                      <tr>
                        <th className="p-2.5 text-center w-12">ردیف</th>
                        <th className="p-2.5 w-32">کد برنامه / طرح</th>
                        <th className="p-2.5 w-60">فصل بودجه‌ای</th>
                        <th className="p-2.5 w-32">ردیف بودجه</th>
                        <th className="p-2.5 w-36">مبلغ تخصیص (مبنا)</th>
                        <th className="p-2.5 w-40 text-teal-700 dark:text-teal-300">مبلغ واریزی / دریافتی</th>
                        <th className="p-2.5">شرح تفصیلی سطر</th>
                        <th className="p-2.5 text-center w-12">حذف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {detailRows.map((r, i) => {
                        const chapters = headerForm.creditCategory === "capital" ? CAPITAL_CHAPTERS : EXPENSE_CHAPTERS;
                        return (
                          <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                            <td className="p-2 text-center font-bold text-slate-400">{i + 1}</td>

                            <td className="p-2">
                              <Input
                                value={r.programOrProjectNumber}
                                onChange={(e) => updateDetailRow(r.id, "programOrProjectNumber", e.target.value)}
                                className="h-8 text-xs font-mono"
                                placeholder="1001"
                              />
                            </td>

                            <td className="p-2">
                              <select
                                value={r.chapterCode}
                                onChange={(e) => updateDetailRow(r.id, "chapterCode", e.target.value)}
                                className="w-full h-8 px-2 text-xs font-bold rounded-md border border-input bg-background"
                              >
                                {chapters.map(c => (
                                  <option key={c.code} value={c.code}>{c.title}</option>
                                ))}
                              </select>
                            </td>

                            <td className="p-2">
                              <Input
                                value={r.budgetRow}
                                onChange={(e) => updateDetailRow(r.id, "budgetRow", e.target.value)}
                                className="h-8 text-xs font-mono"
                                placeholder="109000"
                              />
                            </td>

                            <td className="p-2">
                              <Input
                                type="number"
                                value={r.allocatedAmount}
                                onChange={(e) => updateDetailRow(r.id, "allocatedAmount", Number(e.target.value))}
                                className="h-8 text-xs font-mono text-muted-foreground"
                              />
                            </td>

                            <td className="p-2">
                              <Input
                                type="number"
                                value={r.receivedAmount}
                                onChange={(e) => updateDetailRow(r.id, "receivedAmount", Number(e.target.value))}
                                className="h-8 text-xs font-mono font-extrabold border-teal-500/40 text-teal-900 dark:text-teal-100"
                              />
                            </td>

                            <td className="p-2">
                              <Input
                                value={r.description}
                                onChange={(e) => updateDetailRow(r.id, "description", e.target.value)}
                                className="h-8 text-xs"
                                placeholder="توضیحات بابت این فصل..."
                              />
                            </td>

                            <td className="p-2 text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeDetailRow(r.id)}
                                className="h-7 w-7 p-0 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950"
                                disabled={detailRows.length === 1}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}

                      {/* سطر جمع کل */}
                      <tr className="bg-slate-100/70 dark:bg-slate-900/70 font-extrabold text-xs border-t-2 border-slate-300 dark:border-slate-700">
                        <td colSpan={5} className="p-3 text-right">جمع کل مبلغ دریافتی اعتبارات:</td>
                        <td className="p-3 font-mono text-sm text-emerald-700 dark:text-emerald-300">{fmtNum(totalReceiptAmount)} ریال</td>
                        <td colSpan={2} className="p-3 text-left text-[11px] text-slate-500 font-normal">
                          {numToPersianWords(totalReceiptAmount)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* پیش‌نمایش زنده و قانونی سند حسابداری دوبل (Live Voucher Preview) */}
              {/* ========================================================================= */}
              <div className="bg-slate-950 text-slate-100 p-4 rounded-2xl space-y-3 shadow-md border border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs font-black text-white">پیش‌نمایش خودکار و قانونی سند حسابداری دوبل (اصلی + انتظامی)</span>
                  </div>
                  <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 text-[10px] font-mono">
                    تعداد آرتیکل‌ها: {voucherPreview.length}
                  </Badge>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-[11px] font-mono">
                    <thead className="text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="pb-1 text-center w-10">#</th>
                        <th className="pb-1 w-24">کد حساب</th>
                        <th className="pb-1">عنوان کامل حساب بدهکار / بستانکار</th>
                        <th className="pb-1 text-left w-32 text-emerald-400">بدهکار (ریال)</th>
                        <th className="pb-1 text-left w-32 text-rose-400">بستانکار (ریال)</th>
                        <th className="pb-1 text-center w-24">نوع ثبت</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900">
                      {voucherPreview.map((line, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/50">
                          <td className="py-1.5 text-center text-slate-500">{idx + 1}</td>
                          <td className="py-1.5 font-bold text-amber-400">{line.code}</td>
                          <td className="py-1.5 font-sans font-semibold text-slate-200">{line.title}</td>
                          <td className="py-1.5 text-left text-emerald-400 font-bold">{line.debit > 0 ? fmtNum(line.debit) : "—"}</td>
                          <td className="py-1.5 text-left text-rose-400 font-bold">{line.credit > 0 ? fmtNum(line.credit) : "—"}</td>
                          <td className="py-1.5 text-center font-sans">
                            {line.type === "BUDGETARY" ? (
                              <Badge className="bg-purple-950 text-purple-300 border-purple-800 text-[9px] px-1">انتظامی/بودجه</Badge>
                            ) : (
                              <Badge className="bg-emerald-950 text-emerald-300 border-emerald-800 text-[9px] px-1">مالی اصلی</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* کلیدهای عملگر اصلی (Save & Issue Voucher Buttons) */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleSaveReceipt(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold h-10 px-5 text-xs gap-2 shadow"
                    disabled={loading}
                  >
                    <Save className="h-4 w-4" />
                    ذخیره و صدور سند حسابداری
                  </Button>

                  <Button
                    onClick={() => handleSaveReceipt(false)}
                    variant="outline"
                    className="h-10 text-xs font-bold gap-2"
                    disabled={loading}
                  >
                    ذخیره پیش‌نویس (بدون صدور سند)
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleExportExcel}
                    variant="outline"
                    className="h-10 text-xs font-bold gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                  >
                    <FileSpreadsheet className="h-4 w-4" /> خروجی اکسل
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ========================================================================= */}
          {/* جدول سوابق و لیست دریافت اعتبارات ثبت شده */}
          {/* ========================================================================= */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xs font-extrabold flex items-center gap-2">
                  <Landmark className="h-4 w-4 text-teal-600" />
                  لیست پروانه‌ها و دریافتی‌های ثبت‌شده از خزانه
                </CardTitle>
                <CardDescription className="text-[10px]">مجموع {receipts.length} مورد دریافت اعتبار ثبت‌شده در سیستم</CardDescription>
              </div>

              <div className="w-64">
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="جستجو در کد مبنا یا توضیحات..."
                  className="h-8 text-xs"
                />
              </div>
            </CardHeader>

            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-bold border-b">
                  <tr>
                    <th className="p-3 text-center">ردیف</th>
                    <th className="p-3">کد مبنای دریافت</th>
                    <th className="p-3">دسته و نوع اعتبار</th>
                    <th className="p-3">منبع و سال</th>
                    <th className="p-3 text-left">مبلغ کل (ریال)</th>
                    <th className="p-3 text-center">تاریخ دریافت</th>
                    <th className="p-3 text-center">شماره سند حسابداری</th>
                    <th className="p-3 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {receipts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground">
                        هیچ پروانه دریافت اعتباری ثبت نشده است.
                      </td>
                    </tr>
                  ) : (
                    receipts
                      .filter(r => 
                        !searchTerm || 
                        r.receiptBaseCode?.includes(searchTerm) || 
                        r.description?.includes(searchTerm)
                      )
                      .map((r, idx) => {
                        const isCap = r.creditCategory === "capital";
                        const isCentral = r.creditType === "central";
                        const isSpecial = r.sourceType === "special";
                        const isPrior = r.yearType === "prior";

                        return (
                          <tr key={r._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                            <td className="p-3 text-center font-mono text-slate-400">{idx + 1}</td>
                            <td className="p-3 font-mono font-bold text-teal-700 dark:text-teal-300">
                              {r.receiptBaseCode || "—"}
                            </td>
                            <td className="p-3 font-sans font-semibold">
                              <div className="flex items-center gap-1.5">
                                <Badge className={isCap ? "bg-blue-100 text-blue-800" : "bg-teal-100 text-teal-800"}>
                                  {isCap ? "تملک سرمایه‌ای" : "هزینه‌ای"}
                                </Badge>
                                <span className="text-[11px] text-slate-500">({isCentral ? "ابلاغی متمرکز" : "استانی مصوب"})</span>
                              </div>
                            </td>
                            <td className="p-3 text-slate-600">
                              {isSpecial ? "منبع اختصاصی" : "منبع عمومی"} | <span className="font-bold">{isPrior ? "سنواتی" : r.yearType === "supplementary" ? "متمم" : "جاری"}</span>
                            </td>
                            <td className="p-3 font-mono font-black text-emerald-700 dark:text-emerald-300 text-left">
                              {fmtNum(r.totalAmount || r.amount)}
                            </td>
                            <td className="p-3 text-center font-mono">{r.receiptDate || "—"}</td>
                            <td className="p-3 text-center font-mono">
                              {r.journal_document_number ? (
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 font-bold">
                                  {r.journal_document_number}
                                </Badge>
                              ) : (
                                <span className="text-slate-400 text-[11px]">پیش‌نویس</span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-indigo-600 hover:bg-indigo-50"
                                  onClick={() => handlePrintReceiptForm(r)}
                                  title="چاپ پروانه دریافت اعتبار"
                                >
                                  <Printer className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-50"
                                  onClick={() => handleDeleteReceipt(r._id)}
                                  title="حذف"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* بخش ۲: تحقق و تسجیل صورتحساب‌ها (Accruals & Verification View) */}
      {/* ========================================================================= */}
      {mainView === "realizations" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* فرم ثبت تحقق و تسجیل */}
          <Card className="lg:col-span-1 shadow-sm border-indigo-500/20">
            <CardHeader className="bg-indigo-500/5 border-b border-indigo-500/10 py-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-indigo-800 dark:text-indigo-300">
                <FileCheck className="h-4 w-4 text-indigo-600" />
                ثبت سند تحقق / تسجیل هزینه
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <form onSubmit={handleRealizeSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">۱. انتخاب تعهد مالی مربوطه</Label>
                  <select
                    value={realizeForm.obligation_id}
                    onChange={(e) => {
                      const found = obligations.find(o => String(o._id) === String(e.target.value));
                      if (found) {
                        setRealizeForm(prev => ({
                          ...prev,
                          obligation_id: e.target.value,
                          fiscal_year: String(found.fiscal_year || 1404),
                          claimed_amount: String(prev.claimed_amount || found.amount || ""),
                          verified_amount: String(prev.verified_amount || found.amount || "")
                        }));
                      } else {
                        setRealizeForm(prev => ({ ...prev, obligation_id: e.target.value }));
                      }
                    }}
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

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">شماره سند / صورتحساب</Label>
                    <Input
                      value={realizeForm.bill_number}
                      onChange={(e) => setRealizeForm({ ...realizeForm, bill_number: e.target.value })}
                      placeholder="BILL-1404/88"
                      className="text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">تاریخ تحقق / تسجیل</Label>
                    <PersianDatePicker
                      value={realizeForm.verification_date}
                      onChange={(d) => setRealizeForm((prev) => ({ ...prev, verification_date: typeof d === "object" && d?.target ? d.target.value : String(d || "") }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">مبلغ ابرازی صورتحساب</Label>
                    <Input
                      type="number"
                      value={realizeForm.claimed_amount}
                      onChange={(e) => setRealizeForm({ ...realizeForm, claimed_amount: e.target.value })}
                      placeholder="0"
                      className="text-xs font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-indigo-700 dark:text-indigo-400">مبلغ تأییدشده تسجیل</Label>
                    <Input
                      type="number"
                      value={realizeForm.verified_amount}
                      onChange={(e) => setRealizeForm({ ...realizeForm, verified_amount: e.target.value })}
                      placeholder="0"
                      className="text-xs font-mono font-bold border-indigo-500/40"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">شرح و ملاحظات تسجیل</Label>
                  <Input
                    value={realizeForm.description}
                    onChange={(e) => setRealizeForm({ ...realizeForm, description: e.target.value })}
                    placeholder="ملاحظات کارشناس رسیدگی..."
                    className="text-xs"
                  />
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
                لیست اسناد تحقق/تسجیل‌شده و اتصال به تعهد
              </CardTitle>
              <Badge variant="outline" className="text-xs border-indigo-500/30 text-indigo-700">{realizations.length} مورد تسجیل</Badge>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-muted/50 border-b text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-3">شماره صورتحساب</th>
                    <th className="p-3">تعهد مربوطه</th>
                    <th className="p-3">مبلغ ابرازی</th>
                    <th className="p-3">مبلغ تأییدشده</th>
                    <th className="p-3 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {realizations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-muted-foreground">
                        هیچ سند تحققی ثبت نشده است.
                      </td>
                    </tr>
                  ) : (
                    realizations.map((item) => {
                      const matchedOb = obligations.find(o => String(o._id) === String(item.obligation_id));
                      return (
                        <tr key={item._id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-mono font-bold text-indigo-900 dark:text-indigo-200">{item.bill_number || item.realization_number}</td>
                          <td className="p-3">
                            <div className="font-bold text-foreground">{matchedOb?.beneficiary_name || "تعهد عمومی"}</div>
                            <div className="text-[10px] font-mono text-muted-foreground">{matchedOb?.obligation_number}</div>
                          </td>
                          <td className="p-3 font-mono text-muted-foreground">{fmtNum(item.claimed_amount)}</td>
                          <td className="p-3 font-bold text-indigo-600 font-mono">{fmtNum(item.verified_amount)}</td>
                          <td className="p-3 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-500/10"
                              onClick={() => handleDeleteRealization(item._id)}
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
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
