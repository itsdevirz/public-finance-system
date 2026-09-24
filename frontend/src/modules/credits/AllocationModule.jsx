import { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { 
  TrendingUp, Edit, Trash2, CheckCircle2, AlertCircle, Eye,
  Plus, Save, RefreshCw, FileText, Copy, Printer, FileSpreadsheet,
  Download, Layers, Landmark, ShieldCheck, Scale, Calculator, Search, HelpCircle, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/api";
import { printTable } from "@/lib/printUtils";
import * as XLSX from "xlsx";

// ─── توابع کمکی تبدیل اعداد و مبالغ به فارسی و حروف ─────────────────────────────
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

// ─── ثابت‌های فصول اعتبارات و منابع تخصیص ──────────────────────────────────────────
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

export const ALLOCATION_SOURCES = [
  { id: "1", label: "نقد" },
  { id: "2", label: "قیر" },
  { id: "3", label: "اسناد تسویه خزانه" },
  { id: "4", label: "تسهیلات مالی" },
  { id: "5", label: "اسناد خزانه اسلامی" },
  { id: "6", label: "اوراق مشارکت" },
  { id: "7", label: "اوراق مرابحه" },
  { id: "8", label: "اوراق اجاره" },
  { id: "9", label: "اوراق منفعت" },
];

export default function AllocationModule() {
  const { pathname } = useLocation();

  // داده‌های اصلی از سرور
  const [allocations, setAllocations] = useState([]);
  const [agreements, setAgreements] = useState([]);

  const [loading, setLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingAllocId, setEditingAllocId] = useState(null);

  // مودال پروانه رسمی چاپ تخصیص
  const [selectedPrintAlloc, setSelectedPrintAlloc] = useState(null);

  // ۱. سربرگ اعتبارات (اطلاعات کلان)
  const [headerForm, setHeaderForm] = useState({
    agreement_id: "",
    sourceType: "1", // ۱. عمومی / ۲. اختصاصی
    creditType: "approved", // ۱. مصوب / ۲. ابلاغی
    creditSpec: "program", // ۱. برنامه / ۲. طرح
    creditCategory: "expense", // هزینه‌ای (expense) / تملک (capital)
    fiscalYear: "1404",
    period: "سه ماهه اول",
    agencyBudgetRow: "109000", // ردیف بودجه‌ای ۶ رقمی
    agreementBaseCode: "", // کد مبنای موافقتنامه دریافت شده از مرحله قبل
    allocationBaseCode: "", // کد مبنای تخصیص صادرشده برای استفاده در مرحله بعد (دریافت)
  });

  // ۲. سطرهای جزئیات تخصیص (ریز اعتبار)
  const [detailRows, setDetailRows] = useState([
    {
      id: "row_1",
      chapterCode: "210000",
      chapterTitle: "جبران خدمات کارکنان (فصل ۱)",
      programOrProjectNumber: "1001",
      allocationSource: "1", // نقد
      agencyRow: "109000",
      amount: 0,
      description: "تخصیص سه‌ماهه اول فصل اول حقوق و مزایای کارکنان",
      rowBaseCode: "",
    },
  ]);

  // دریافت داده‌ها از API
  const fetchData = async () => {
    setLoading(true);
    try {
      const [alRes, agRes] = await Promise.all([
        api.get("/api/credits/allocations"),
        api.get("/api/credits/agreements"),
      ]);

      const agList = agRes.data?.data || [];
      const alList = alRes.data?.data || [];
      setAllocations(alList);
      setAgreements(agList);

      if (agList.length > 0 && !headerForm.agreement_id) {
        handleSelectAgreement(agList[0], alList);
      }
    } catch (e) {
      setAlertMsg({ type: "error", text: "خطا در دریافت اطلاعات تخصیص اعتبارات" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pathname]);

  // هنگام انتخاب موافقتنامه، اطلاعات کلان آن در سربرگ قرار می‌گیرد
  const handleSelectAgreement = (agr) => {
    if (!agr) return;
    const isCapital = agr.credit_category === "capital";
    const srcType = String(agr.source_type || agr.sourceType || "1");
    const credType = agr.credit_type === "notified" || agr.creditType === "notified" ? "notified" : "approved";
    const baseC = agr.base_code || agr.program_code || `AGR-BASE-${agr.fiscal_year || 1404}-${Date.now()}`;
    const newAllocBaseCode = `ALLOC-BASE-${agr.fiscal_year || 1404}-${Math.floor(100000 + Math.random() * 900000)}`;

    setHeaderForm((prev) => ({
      ...prev,
      agreement_id: String(agr._id),
      creditCategory: isCapital ? "capital" : "expense",
      sourceType: srcType,
      creditType: credType,
      creditSpec: isCapital ? "project" : "program",
      fiscalYear: String(agr.fiscal_year || "1404"),
      agencyBudgetRow: agr.agency_budget_row || agr.notifier_budget_row || "109000",
      agreementBaseCode: baseC,
      allocationBaseCode: newAllocBaseCode,
    }));

    const defaultChapters = isCapital ? CAPITAL_CHAPTERS : EXPENSE_CHAPTERS;
    setDetailRows((prevRows) =>
      prevRows.map((r) => ({
        ...r,
        chapterCode: defaultChapters[0].code,
        chapterTitle: defaultChapters[0].title,
        rowBaseCode: `${newAllocBaseCode}-DET`,
      }))
    );
  };

  const selectedAgreement = useMemo(() => {
    return agreements.find((a) => String(a._id) === String(headerForm.agreement_id)) || null;
  }, [agreements, headerForm.agreement_id]);

  const agreementTotalApproved = Number(selectedAgreement?.total_amount || selectedAgreement?.amount || 0);

  const totalPreviousAllocated = useMemo(() => {
    if (!headerForm.agreement_id) return 0;
    return allocations
      .filter((a) => String(a.agreement_id) === String(headerForm.agreement_id) && String(a._id) !== String(editingAllocId))
      .reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
  }, [allocations, headerForm.agreement_id, editingAllocId]);

  const currentFormTotalAmount = useMemo(() => {
    return detailRows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  }, [detailRows]);

  const remainingAgreementBalance = Math.max(0, agreementTotalApproved - totalPreviousAllocated);

  const accountingInfo = useMemo(() => {
    const isCap = headerForm.creditCategory === "capital";
    return {
      debtor: isCap ? "93002 (تخصیص تملک)" : "93001 (تخصیص هزینه)",
      creditor: isCap ? "92002 (حساب مقابل)" : "92001 (حساب مقابل)",
      debtorCode: isCap ? "93002" : "93001",
      creditorCode: isCap ? "92002" : "92001",
    };
  }, [headerForm.creditCategory]);

  const handleAddRow = () => {
    const defaultChapters = headerForm.creditCategory === "capital" ? CAPITAL_CHAPTERS : EXPENSE_CHAPTERS;
    const newRow = {
      id: `row_${Date.now()}`,
      chapterCode: defaultChapters[0].code,
      chapterTitle: defaultChapters[0].title,
      programOrProjectNumber: headerForm.creditCategory === "capital" ? "13040010010001" : "1001",
      allocationSource: "1",
      agencyRow: headerForm.agencyBudgetRow || "109000",
      amount: 0,
      description: "تخصیص سه‌ماهه اعتبار بودجه‌ای",
      rowBaseCode: `${headerForm.allocationBaseCode || "ALLOC-BASE"}-DET-${detailRows.length + 1}`,
    };
    setDetailRows([...detailRows, newRow]);
  };

  const handleUpdateRow = (id, field, val) => {
    setDetailRows((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const updated = { ...r, [field]: val };
          if (field === "chapterCode") {
            const list = headerForm.creditCategory === "capital" ? CAPITAL_CHAPTERS : EXPENSE_CHAPTERS;
            const found = list.find((c) => c.code === val);
            if (found) updated.chapterTitle = found.title;
          }
          return updated;
        }
        return r;
      })
    );
  };

  const handleDeleteRow = (id) => {
    if (detailRows.length === 1) {
      setAlertMsg({ type: "error", text: "حداقل یک سطر در ریز تخصیص باید وجود داشته باشد." });
      return;
    }
    setDetailRows(detailRows.filter((r) => r.id !== id));
  };

  const handleCopyRow = (row) => {
    const copied = {
      ...row,
      id: `row_copy_${Date.now()}`,
      rowBaseCode: `${headerForm.allocationBaseCode || "ALLOC-BASE"}-DET-${detailRows.length + 1}`,
    };
    setDetailRows([...detailRows, copied]);
  };

  const handleResetForm = () => {
    setEditingAllocId(null);
    const defaultChapters = headerForm.creditCategory === "capital" ? CAPITAL_CHAPTERS : EXPENSE_CHAPTERS;
    setHeaderForm((prev) => ({
      ...prev,
      allocationBaseCode: `ALLOC-BASE-${prev.fiscalYear}-${Math.floor(100000 + Math.random() * 900000)}`,
    }));
    setDetailRows([
      {
        id: "row_1",
        chapterCode: defaultChapters[0].code,
        chapterTitle: defaultChapters[0].title,
        programOrProjectNumber: headerForm.creditCategory === "capital" ? "13040010010001" : "1001",
        allocationSource: "1",
        agencyRow: headerForm.agencyBudgetRow || "109000",
        amount: 0,
        description: "تخصیص اعتبار بودجه‌ای",
        rowBaseCode: `ALLOC-BASE-${headerForm.fiscalYear}-DET-1`,
      },
    ]);
    setAlertMsg({ type: "success", text: "فرم تخصیص با موفقیت بازنشانی شد." });
  };

  const validateRowCodes = () => {
    for (let i = 0; i < detailRows.length; i++) {
      const r = detailRows[i];
      const codeStr = String(r.programOrProjectNumber || "").trim();
      if (!codeStr) {
        setAlertMsg({ type: "error", text: `سطر ${i + 1}: شماره برنامه / طرح وارد نشده است.` });
        return false;
      }
      if (headerForm.creditSpec === "program") {
        if (codeStr.length !== 4) {
          setAlertMsg({ type: "error", text: `سطر ${i + 1}: شماره برنامه باید دقیقاً ۴ رقمی باشد (مقدار فعلی: ${codeStr.length} رقم).` });
          return false;
        }
      } else {
        if (codeStr.length !== 12 && codeStr.length !== 14) {
          setAlertMsg({ type: "error", text: `سطر ${i + 1}: شماره طرح باید ۱۲ رقمی (ملی) یا ۱۴ رقمی (استانی) باشد (مقدار فعلی: ${codeStr.length} رقم).` });
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmitAllocation = async (e) => {
    if (e) e.preventDefault();

    if (!headerForm.agreement_id) {
      setAlertMsg({ type: "error", text: "لطفاً موافقت‌نامه مربوطه را انتخاب کنید." });
      return;
    }

    if (currentFormTotalAmount <= 0) {
      setAlertMsg({ type: "error", text: "مبلغ تخصیص باید بزرگتر از صفر باشد." });
      return;
    }

    if (!validateRowCodes()) return;

    setLoading(true);
    try {
      const payload = {
        agreement_id: headerForm.agreement_id,
        fiscal_year: Number(headerForm.fiscalYear),
        period: headerForm.period,
        credit_category: headerForm.creditCategory,
        source_type: headerForm.sourceType,
        credit_type: headerForm.creditType,
        credit_spec: headerForm.creditSpec,
        agency_budget_row: headerForm.agencyBudgetRow,
        agreement_base_code: headerForm.agreementBaseCode,
        base_code: headerForm.allocationBaseCode,
        amount: currentFormTotalAmount,
        title: `تخصیص اعتبار ${headerForm.period} سال ${headerForm.fiscalYear} - ${selectedAgreement?.title || ""}`,
        allocation_number: editingAllocId
          ? allocations.find((a) => String(a._id) === String(editingAllocId))?.allocation_number
          : `ALLOC-${headerForm.fiscalYear}-${Date.now()}`,
        items: detailRows,
        status: "allocated",
      };

      if (editingAllocId) {
        await api.put(`/api/credits/allocations/${editingAllocId}`, payload);
        setAlertMsg({ type: "success", text: "تخصیص اعتبار و سند مربوطه با موفقیت ویرایش شد." });
      } else {
        await api.post("/api/credits/allocations", payload);
        setAlertMsg({ type: "success", text: "تخصیص اعتبار با موفقیت صادر و سند حسابداری مربوطه صادر گردید." });
      }

      handleResetForm();
      fetchData();
    } catch (e) {
      setAlertMsg({ type: "error", text: e.response?.data?.message || "خطا در ثبت تخصیص اعتبار" });
    } finally {
      setLoading(false);
    }
  };

  const handleEditAlloc = (alloc) => {
    setEditingAllocId(String(alloc._id));
    const isCap = alloc.credit_category === "capital";

    setHeaderForm({
      agreement_id: String(alloc.agreement_id || ""),
      sourceType: String(alloc.source_type || "1"),
      creditType: alloc.credit_type || "approved",
      creditSpec: alloc.credit_spec || (isCap ? "project" : "program"),
      creditCategory: isCap ? "capital" : "expense",
      fiscalYear: String(alloc.fiscal_year || "1404"),
      period: alloc.period || "سه ماهه اول",
      agencyBudgetRow: alloc.agency_budget_row || "109000",
      agreementBaseCode: alloc.agreement_base_code || "",
      allocationBaseCode: alloc.base_code || alloc.allocation_number || "",
    });

    if (Array.isArray(alloc.items) && alloc.items.length > 0) {
      setDetailRows(
        alloc.items.map((it, idx) => ({
          id: `edit_row_${idx}_${Date.now()}`,
          chapterCode: it.chapterCode || (isCap ? CAPITAL_CHAPTERS[0].code : EXPENSE_CHAPTERS[0].code),
          chapterTitle: it.chapterTitle || (isCap ? CAPITAL_CHAPTERS[0].title : EXPENSE_CHAPTERS[0].title),
          programOrProjectNumber: it.programOrProjectNumber || "1001",
          allocationSource: String(it.allocationSource || "1"),
          agencyRow: it.agencyRow || alloc.agency_budget_row || "109000",
          amount: Number(it.amount) || 0,
          description: it.description || "",
          rowBaseCode: it.rowBaseCode || alloc.base_code || "",
        }))
      );
    } else {
      setDetailRows([
        {
          id: `row_edit_single_${Date.now()}`,
          chapterCode: isCap ? CAPITAL_CHAPTERS[0].code : EXPENSE_CHAPTERS[0].code,
          chapterTitle: isCap ? CAPITAL_CHAPTERS[0].title : EXPENSE_CHAPTERS[0].title,
          programOrProjectNumber: "1001",
          allocationSource: "1",
          agencyRow: alloc.agency_budget_row || "109000",
          amount: Number(alloc.amount) || 0,
          description: alloc.description || alloc.title || "",
          rowBaseCode: alloc.base_code || "",
        },
      ]);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCopyAlloc = (alloc) => {
    handleEditAlloc(alloc);
    setEditingAllocId(null);
    setHeaderForm((prev) => ({
      ...prev,
      allocationBaseCode: `ALLOC-BASE-${prev.fiscalYear}-${Math.floor(100000 + Math.random() * 900000)}`,
    }));
    setAlertMsg({ type: "success", text: "اطلاعات تخصیص کپی شد. پس از بررسی می‌توانید آن را به عنوان تخصیص جدید ثبت کنید." });
  };

  const handleDeleteAlloc = async (id) => {
    if (!window.confirm("آیا از حذف این تخصیص اعتبار اطمینان دارید؟")) return;
    try {
      await api.delete(`/api/credits/allocations/${id}`);
      setAlertMsg({ type: "success", text: "تخصیص اعتبار با موفقیت حذف گردید." });
      fetchData();
    } catch (e) {
      setAlertMsg({ type: "error", text: "خطا در حذف تخصیص اعتبار" });
    }
  };

  // کلیک روی آیکون پرینت سطر -> باز کردن مودال و فراهم‌سازی چاپ پروانه ابلاغ تخصیص
  const handleOpenPrintModal = (alloc) => {
    setSelectedPrintAlloc(alloc);
  };

  // چاپ مستقیم پروانه ابلاغ تخصیص
  const handleTriggerPrintCertificate = () => {
    printTable("#official-alloc-certificate", "پروانه رسمی ابلاغ تخصیص اعتبار");
  };

  // خروجی اکسل (Excel Export)
  const handleExportExcel = () => {
    if (allocations.length === 0) {
      setAlertMsg({ type: "error", text: "داده‌ای برای خروجی اکسل وجود ندارد." });
      return;
    }

    const excelData = allocations.map((alloc, idx) => {
      const parentAgr = agreements.find((a) => String(a._id) === String(alloc.agreement_id));
      return {
        "ردیف": idx + 1,
        "شماره تخصیص / کد مبنا": alloc.allocation_number || alloc.base_code || "—",
        "موافقت‌نامه مادر": parentAgr?.title || "—",
        "کد مبنای موافقتنامه": alloc.agreement_base_code || parentAgr?.base_code || "—",
        "دوره / سال": `${alloc.period || "سه ماهه اول"} (${alloc.fiscal_year || "1404"})`,
        "نوع منبع": alloc.source_type === "2" ? "اختصاصی" : "عمومی",
        "نوع اعتبار": alloc.credit_type === "notified" ? "ابلاغی" : "مصوب",
        "مبلغ (ریال)": Number(alloc.amount) || 0,
        "کد بدهکار": alloc.debtor_account || (alloc.credit_category === "capital" ? "93002" : "93001"),
        "کد بستانکار": alloc.creditor_account || (alloc.credit_category === "capital" ? "92002" : "92001"),
        "وضعیت": alloc.status === "allocated" ? "تخصیص یافته" : "معلق",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "لیست تخصیص‌ها");
    XLSX.writeFile(workbook, `Allocation_Report_${Date.now()}.xlsx`);
  };

  // خروجی وورد (Word Export)
  const handleExportWord = () => {
    if (allocations.length === 0) {
      setAlertMsg({ type: "error", text: "داده‌ای برای خروجی وورد وجود ندارد." });
      return;
    }

    const rowsHtml = allocations
      .map(
        (a, i) => `
      <tr>
        <td style="border:1px solid #ccc;padding:8px;text-align:center;">${i + 1}</td>
        <td style="border:1px solid #ccc;padding:8px;text-align:center;">${a.allocation_number || a.base_code}</td>
        <td style="border:1px solid #ccc;padding:8px;text-align:center;">${a.period || "سه ماهه"} (${a.fiscal_year || 1404})</td>
        <td style="border:1px solid #ccc;padding:8px;text-align:left;">${fmtNum(a.amount)} ریال</td>
        <td style="border:1px solid #ccc;padding:8px;text-align:center;">${a.source_type === "2" ? "اختصاصی" : "عمومی"}</td>
        <td style="border:1px solid #ccc;padding:8px;text-align:center;">تخصیص یافته</td>
      </tr>
    `
      )
      .join("");

    const wordHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>گزارش تخصیص اعتبار</title></head>
      <body dir="rtl" style="font-family:Tahoma, Arial, sans-serif;">
        <h2 style="text-align:center;">گزارش رسمی تخصیص اعتبارات مالی و بودجه‌ای</h2>
        <table style="width:100%;border-collapse:collapse;margin-top:15px;">
          <thead>
            <tr style="background-color:#f2f2f2;">
              <th style="border:1px solid #ccc;padding:8px;">ردیف</th>
              <th style="border:1px solid #ccc;padding:8px;">شماره تخصیص / کد مبنا</th>
              <th style="border:1px solid #ccc;padding:8px;">دوره / سال</th>
              <th style="border:1px solid #ccc;padding:8px;">مبلغ (ریال)</th>
              <th style="border:1px solid #ccc;padding:8px;">نوع منبع</th>
              <th style="border:1px solid #ccc;padding:8px;">وضعیت</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([wordHtml], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Allocations_Report_${Date.now()}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredAllocations = useMemo(() => {
    if (!searchTerm.trim()) return allocations;
    const term = searchTerm.toLowerCase();
    return allocations.filter((a) => {
      const numStr = String(a.allocation_number || a.base_code || "").toLowerCase();
      const perStr = String(a.period || "").toLowerCase();
      const yrStr = String(a.fiscal_year || "").toLowerCase();
      const amtStr = String(a.amount || "").toLowerCase();
      return numStr.includes(term) || perStr.includes(term) || yrStr.includes(term) || amtStr.includes(term);
    });
  }, [allocations, searchTerm]);

  return (
    <div className="space-y-6 dir-rtl text-right">

      {/* هشدارها و پیام‌های سیستم */}
      {alertMsg && (
        <div
          className={cn(
            "p-3.5 rounded-xl border flex items-center justify-between text-xs font-bold transition-all shadow-sm",
            alertMsg.type === "error"
              ? "bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400"
              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
          )}
        >
          <div className="flex items-center gap-2">
            {alertMsg.type === "error" ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            <span>{alertMsg.text}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setAlertMsg(null)} className="h-6 w-6 p-0 rounded-full">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* ─── کارت‌های شاخص‌های کلیدی اعتبارات تخصیص‌یافته (KPIs) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="shadow-sm border border-border/60 bg-card">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-muted-foreground">کل اعتبار موافقت‌نامه</span>
                <p className="text-sm font-extrabold font-mono text-emerald-600">{fmtNum(agreementTotalApproved)} ریال</p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Landmark className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-border/60 bg-card">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-muted-foreground">تخصیص‌یافته قبلی</span>
                <p className="text-sm font-extrabold font-mono text-blue-600">{fmtNum(totalPreviousAllocated)} ریال</p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-border/60 bg-card">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-muted-foreground">مانده اعتبار موافقت‌نامه</span>
                <p className="text-sm font-extrabold font-mono text-amber-600">{fmtNum(remainingAgreementBalance)} ریال</p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Scale className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-border/60 bg-card">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-muted-foreground">کد معین حسابداری تخصیص</span>
                <p className="text-xs font-mono font-bold text-purple-600">{accountingInfo.debtorCode} (بدهکار)</p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── نوار ابزار عملیاتی مشابه محیط موافقت‌نامه ─── */}
      <Card className="shadow-sm border border-border">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                onClick={handleSubmitAllocation}
                disabled={loading}
                className="h-9 text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              >
                <Save className="h-4 w-4" />
                {editingAllocId ? "ثبت اصلاح تخصیص" : "ایجاد ذخیره و صدور سند"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleResetForm}
                className="h-9 text-xs font-bold gap-1.5 text-slate-700 hover:bg-slate-100"
              >
                <RefreshCw className="h-4 w-4 text-slate-500" />
                برگشت / بازنشانی
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleExportExcel}
                className="h-9 text-xs font-bold gap-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-300"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                خروجی اکسل
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleExportWord}
                className="h-9 text-xs font-bold gap-1.5 text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-300"
              >
                <FileText className="h-4 w-4 text-blue-600" />
                خروجی وورد
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => printTable("#printable-allocations-table", "گزارش تخصیص‌های اعتبارات صادرشده")}
                className="h-9 text-xs font-bold gap-1.5 text-purple-700 bg-purple-50 hover:bg-purple-100 border-purple-300"
              >
                <Printer className="h-4 w-4 text-purple-600" />
                چاپ جدول / PDF
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="px-3 py-1 font-mono text-xs bg-muted text-foreground font-bold">
                کد مبنای موافقت‌نامه: {headerForm.agreementBaseCode || "دریافت‌نشده"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── بخش اول: سربرگ اعتبارات (اطلاعات کلان) ─── */}
      <Card className="shadow-sm border">
        <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <span>الف) بخش اول: سربرگ اعتبارات (اطلاعات کلان موافقت‌نامه و تخصیص)</span>
            </div>
            {editingAllocId && (
              <Badge className="bg-amber-500 text-white font-bold text-[11px]">
                در حال ویرایش تخصیص شناسه {editingAllocId}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* انتخاب موافقت‌نامه مادر */}
            <div className="space-y-1.5 col-span-1 md:col-span-2">
              <Label className="font-bold text-foreground flex items-center justify-between">
                <span>موافقت‌نامه مادر (مبنای تخصیص)</span>
                <span className="text-[10px] text-muted-foreground">دریافت اطلاعات مرحله قبل</span>
              </Label>

              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs font-bold focus:ring-2 focus:ring-primary"
                value={headerForm.agreement_id}
                onChange={(e) => {
                  const found = agreements.find((a) => String(a._id) === e.target.value);
                  if (found) handleSelectAgreement(found);
                }}
              >
                {agreements.length === 0 ? (
                  <option value="">هیچ موافقت‌نامه‌ای ثبت نشده است</option>
                ) : (
                  agreements.map((agr) => (
                    <option key={agr._id} value={String(agr._id)}>
                      {agr.title} — کد مبنا: {agr.base_code || agr.program_code || "-"} ({fmtNum(agr.total_amount)} ریال)
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* نوع منبع اعتبار */}
            <div className="space-y-1.5">
              <Label className="font-bold text-foreground">نوع منبع اعتبار</Label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs font-bold"
                value={headerForm.sourceType}
                onChange={(e) => setHeaderForm({ ...headerForm, sourceType: e.target.value })}
              >
                <option value="1">۱. عمومی</option>
                <option value="2">۲. اختصاصی</option>
              </select>
            </div>

            {/* نوع اعتبار */}
            <div className="space-y-1.5">
              <Label className="font-bold text-foreground">نوع اعتبار</Label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs font-bold"
                value={headerForm.creditType}
                onChange={(e) => setHeaderForm({ ...headerForm, creditType: e.target.value })}
              >
                <option value="approved">۱. مصوب</option>
                <option value="notified">۲. ابلاغی</option>
              </select>
            </div>

            {/* مشخصات کلی اعتبار */}
            <div className="space-y-1.5">
              <Label className="font-bold text-foreground">مشخصات کلی اعتبار</Label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs font-bold"
                value={headerForm.creditSpec}
                onChange={(e) => setHeaderForm({ ...headerForm, creditSpec: e.target.value })}
              >
                <option value="program">۱. برنامه (هزینه‌ای)</option>
                <option value="project">۲. طرح (عمرانی / تملک)</option>
              </select>
            </div>

            {/* دوره تخصیص */}
            <div className="space-y-1.5">
              <Label className="font-bold text-foreground">دوره تخصیص</Label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs font-bold"
                value={headerForm.period}
                onChange={(e) => setHeaderForm({ ...headerForm, period: e.target.value })}
              >
                <option value="سه ماهه اول">سه ماهه اول</option>
                <option value="سه ماهه دوم">سه ماهه دوم</option>
                <option value="سه ماهه سوم">سه ماهه سوم</option>
                <option value="سه ماهه چهارم">سه ماهه چهارم</option>
                <option value="شش ماهه اول">شش ماهه اول</option>
                <option value="کامل">کامل سالانه</option>
                <option value="متمم">دوره متمم</option>
              </select>
            </div>

            {/* سال مالی */}
            <div className="space-y-1.5">
              <Label className="font-bold text-foreground">سال مالی</Label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs font-bold"
                value={headerForm.fiscalYear}
                onChange={(e) => setHeaderForm({ ...headerForm, fiscalYear: e.target.value })}
              >
                <option value="1403">۱۴۰۳</option>
                <option value="1404">۱۴۰۴</option>
                <option value="1405">۱۴۰۵</option>
              </select>
            </div>

            {/* کد مبنای تخصیص (صادر شده برای مرحله بعدی: دریافت اعتبارات) */}
            <div className="space-y-1.5">
              <Label className="font-bold text-primary flex items-center gap-1">
                <span>کد مبنای تخصیص (تولید خودکار)</span>
                <HelpCircle className="h-3 w-3 text-muted-foreground" title="این کد مبنا جهت استفاده در مرحله دریافت اعتبارات صادر می‌گردد." />
              </Label>
              <Input
                readOnly
                value={headerForm.allocationBaseCode}
                className="h-9 text-xs font-mono font-bold bg-primary/5 text-primary border-primary/30 text-center"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── بخش دوم: جزئیات تخصیص (ریز اعتبار) ─── */}
      <Card className="shadow-sm border">
        <CardHeader className="pb-3 border-b border-border/50 bg-muted/20 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Calculator className="h-4 w-4 text-emerald-600" />
            <span>ب) بخش دوم: جزئیات تخصیص (ریز فصول، برنامه/طرح، منبع تخصیص و مبالغ)</span>
          </CardTitle>
          <Button
            type="button"
            onClick={handleAddRow}
            size="sm"
            className="h-8 text-xs font-bold gap-1 bg-primary hover:bg-primary/90 text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            افزودن سطر تخصیص جدید
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-muted/50 border-b text-muted-foreground font-bold whitespace-nowrap">
                <tr>
                  <th className="p-2.5 text-center w-10">#</th>
                  <th className="p-2.5 min-w-[220px]">فصل اعتبارات و کد معین</th>
                  <th className="p-2.5 min-w-[150px]">
                    شماره {headerForm.creditSpec === "program" ? "برنامه (۴ رقم)" : "طرح (۱۲/۱۴ رقم)"}
                  </th>
                  <th className="p-2.5 min-w-[140px]">منبع تخصیص</th>
                  <th className="p-2.5 min-w-[100px] text-center">ردیف دستگاه</th>
                  <th className="p-2.5 min-w-[150px]">مبلغ تخصیص (ریال)</th>
                  <th className="p-2.5 min-w-[180px]">شرح تخصیص</th>
                  <th className="p-2.5 min-w-[130px] text-center">کد مبنای سطر</th>
                  <th className="p-2.5 text-center w-20">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {detailRows.map((item, idx) => {
                  const activeChapterList = headerForm.creditCategory === "capital" ? CAPITAL_CHAPTERS : EXPENSE_CHAPTERS;
                  return (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-2.5 text-center font-bold text-muted-foreground">{idx + 1}</td>

                      {/* فصل اعتباری */}
                      <td className="p-2.5">
                        <select
                          className="w-full h-8 rounded border border-input bg-background px-2 text-[11px] font-bold"
                          value={item.chapterCode}
                          onChange={(e) => handleUpdateRow(item.id, "chapterCode", e.target.value)}
                        >
                          {activeChapterList.map((ch) => (
                            <option key={ch.code} value={ch.code}>
                              {ch.title}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* شماره برنامه / طرح */}
                      <td className="p-2.5">
                        <Input
                          type="text"
                          dir="ltr"
                          value={item.programOrProjectNumber}
                          onChange={(e) => handleUpdateRow(item.id, "programOrProjectNumber", e.target.value.replace(/\D/g, ""))}
                          placeholder={headerForm.creditSpec === "program" ? "۴ رقم" : "۱۲ یا ۱۴ رقم"}
                          className="h-8 text-xs font-mono text-center font-bold"
                          maxLength={headerForm.creditSpec === "program" ? 4 : 14}
                        />
                      </td>

                      {/* منبع تخصیص (۹ نوع) */}
                      <td className="p-2.5">
                        <select
                          className="w-full h-8 rounded border border-input bg-background px-2 text-[11px] font-bold"
                          value={item.allocationSource}
                          onChange={(e) => handleUpdateRow(item.id, "allocationSource", e.target.value)}
                        >
                          {ALLOCATION_SOURCES.map((src) => (
                            <option key={src.id} value={src.id}>
                              {src.id}. {src.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* ردیف دستگاه (۶ رقمی) */}
                      <td className="p-2.5">
                        <Input
                          type="text"
                          dir="ltr"
                          value={item.agencyRow}
                          onChange={(e) => handleUpdateRow(item.id, "agencyRow", e.target.value.replace(/\D/g, ""))}
                          placeholder="۶ رقم"
                          className="h-8 text-xs font-mono text-center font-bold"
                          maxLength={6}
                        />
                      </td>

                      {/* مبلغ تخصیص */}
                      <td className="p-2.5">
                        <Input
                          type="text"
                          dir="ltr"
                          value={item.amount ? Number(item.amount).toLocaleString("fa-IR") : ""}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/\D/g, "");
                            handleUpdateRow(item.id, "amount", raw ? Number(raw) : 0);
                          }}
                          placeholder="۰"
                          className="h-8 text-xs font-mono text-center font-extrabold text-emerald-600"
                        />
                      </td>

                      {/* شرح تخصیص */}
                      <td className="p-2.5">
                        <Input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleUpdateRow(item.id, "description", e.target.value)}
                          placeholder="شرح کامل تخصیص اعتبار..."
                          className="h-8 text-xs font-bold"
                        />
                      </td>

                      {/* کد مبنای سطر */}
                      <td className="p-2.5 text-center">
                        <Badge variant="outline" className="font-mono text-[10px] bg-primary/5 text-primary border-primary/20">
                          {item.rowBaseCode || headerForm.allocationBaseCode || "—"}
                        </Badge>
                      </td>

                      {/* عملیات سطر */}
                      <td className="p-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyRow(item)}
                            className="h-7 w-7 p-0 text-purple-600 hover:bg-purple-50 rounded-lg"
                            title="کپی سطر تخصیص"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRow(item.id)}
                            className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-50 rounded-lg"
                            title="حذف سطر"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* خلاصه مبلغ کل و حروف در انتهای جدول ریز تخصیص */}
          <div className="p-3.5 bg-muted/30 border-t flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="font-bold text-muted-foreground">مبلغ کل به حروف:</span>
              <p className="font-bold text-primary text-sm">{numToPersianWords(currentFormTotalAmount)}</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-left">
                <span className="text-[11px] font-bold text-muted-foreground">مجموع مبلغ تخصیص در این فرم:</span>
                <p className="text-base font-extrabold font-mono text-emerald-600">{fmtNum(currentFormTotalAmount)} ریال</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── کارت لیست تخصیص‌های صادرشده (مطابق کامل با تصویر کاربر) ─── */}
      <Card className="shadow-sm border">
        <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-sm font-bold text-foreground">لیست تخصیص‌های صادرشده</CardTitle>
            {/* نشانگر بیضی‌شکل تعداد تخصیص‌ها دقیقا مطابق با تصویر کاربر */}
            <span className="inline-flex items-center justify-center px-3 py-0.5 rounded-full border text-xs font-bold bg-muted/60 text-foreground border-border">
              {filteredAllocations.length} تخصیص
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="جستجو در تخصیص‌ها..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 text-xs pr-8"
              />
            </div>
            <Button onClick={fetchData} variant="outline" size="sm" disabled={loading} className="h-8 text-xs font-bold gap-1">
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              به‌روزرسانی
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0" id="printable-allocations-table">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-muted/40 border-b text-muted-foreground font-bold whitespace-nowrap">
                <tr>
                  <th className="p-3">شماره تخصیص</th>
                  <th className="p-3 text-center">دوره / سال</th>
                  <th className="p-3 text-left">مبلغ (ریال)</th>
                  <th className="p-3 text-center">وضعیت</th>
                  <th className="p-3 text-center w-36">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredAllocations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      هیچ تخصیص اعتباری صادر نشده است.
                    </td>
                  </tr>
                ) : (
                  filteredAllocations.map((alloc) => {
                    const displayNum = alloc.allocation_number || alloc.base_code || `ALLOC-${alloc.fiscal_year || 1404}-${alloc._id}`;
                    return (
                      <tr key={alloc._id} className="hover:bg-muted/20 transition-colors">
                        {/* شماره تخصیص */}
                        <td className="p-3 font-mono font-extrabold text-slate-800 dark:text-slate-200">
                          {displayNum}
                        </td>

                        {/* دوره / سال */}
                        <td className="p-3 text-center font-bold text-foreground">
                          {alloc.period || "سه ماهه اول"} ({alloc.fiscal_year || "1405"})
                        </td>

                        {/* مبلغ (ریال) با رندر متمم پررنگ سرمه‌ای مطابق تصویر کاربر */}
                        <td className="p-3 text-left font-mono font-extrabold text-blue-700 dark:text-blue-400 text-sm">
                          {fmtNum(alloc.amount)}
                        </td>

                        {/* وضعیت تخصیص (بج بیضی آبی نئونی مطابقت کامل با تصویر) */}
                        <td className="p-3 text-center">
                          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full border text-[11px] font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20">
                            تخصیص یافته
                          </span>
                        </td>

                        {/* عملیات (دکمه‌های ویرایش، حذف، کپی، پرینت) */}
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditAlloc(alloc)}
                              className="h-7 w-7 p-0 text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-lg"
                              title="ویرایش تخصیص"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopyAlloc(alloc)}
                              className="h-7 w-7 p-0 text-purple-600 border-purple-200 bg-purple-50 hover:bg-purple-100 rounded-lg"
                              title="کپی تخصیص"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenPrintModal(alloc)}
                              className="h-7 w-7 p-0 text-emerald-600 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 rounded-lg"
                              title="مشاهده پروانه تخصیص / پرینت"
                            >
                              <Printer className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteAlloc(alloc._id)}
                              className="h-7 w-7 p-0 text-rose-600 border-rose-200 bg-rose-50 hover:bg-rose-100 rounded-lg"
                              title="حذف تخصیص"
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
          </div>
        </CardContent>
      </Card>

      {/* ─── مودال نمایش و چاپ رسمی پروانه تخصیص اعتبار (کامل با جزئیات سطرها) ─── */}
      {selectedPrintAlloc && (
        <Modal
          open={!!selectedPrintAlloc}
          onClose={() => setSelectedPrintAlloc(null)}
          title="پروانه رسمی ابلاغ تخصیص اعتبار"
          size="2xl"
        >
          <div className="space-y-5 p-4 text-right dir-rtl" id="official-alloc-certificate">
            {/* سربرگ رسمی پروانه */}
            <div className="border-b-2 border-primary/20 pb-4 text-center space-y-1.5">
              <h3 className="text-lg font-extrabold text-foreground">جمهوری اسلامی ایران</h3>
              <h4 className="text-sm font-bold text-primary">سازمان مدیریت و برنامه‌ریزی کشور / خزانه‌داری کل</h4>
              <p className="text-xs font-bold text-muted-foreground">
                پروانه رسمی ابلاغ تخصیص اعتبار مالی و بودجه‌ای (سال {selectedPrintAlloc.fiscal_year || "1405"})
              </p>
            </div>

            {/* اطلاعات کلان در سربرگ پروانه */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs bg-muted/40 p-3.5 rounded-xl border border-border/80">
              <div><span className="font-bold text-muted-foreground">شماره تخصیص:</span> <span className="font-mono font-bold text-foreground dir-ltr inline-block">{selectedPrintAlloc.allocation_number}</span></div>
              <div><span className="font-bold text-muted-foreground">کد مبنای تخصیص:</span> <span className="font-mono font-bold text-primary dir-ltr inline-block">{selectedPrintAlloc.base_code || selectedPrintAlloc.allocation_number}</span></div>
              <div><span className="font-bold text-muted-foreground">کد مبنای موافقتنامه:</span> <span className="font-mono font-bold text-foreground dir-ltr inline-block">{selectedPrintAlloc.agreement_base_code || "—"}</span></div>
              <div><span className="font-bold text-muted-foreground">دوره تخصیص:</span> <span className="font-bold text-foreground">{selectedPrintAlloc.period || "سه ماهه اول"}</span></div>
              <div><span className="font-bold text-muted-foreground">نوع منبع اعتبار:</span> <span className="font-bold text-foreground">{selectedPrintAlloc.source_type === "2" ? "اختصاصی" : "عمومی"}</span></div>
              <div><span className="font-bold text-muted-foreground">نوع اعتبار:</span> <span className="font-bold text-foreground">{selectedPrintAlloc.credit_type === "notified" ? "ابلاغی" : "مصوب"}</span></div>
              <div><span className="font-bold text-muted-foreground">کد بدهکار (۹۳۰۰۱/۹۳۰۰۲):</span> <span className="font-mono font-bold text-purple-600">{selectedPrintAlloc.debtor_account || (selectedPrintAlloc.credit_category === "capital" ? "93002" : "93001")}</span></div>
              <div><span className="font-bold text-muted-foreground">کد بستانکار (۹۲۰۰۱/۹۲۰۰۲):</span> <span className="font-mono font-bold text-purple-600">{selectedPrintAlloc.creditor_account || (selectedPrintAlloc.credit_category === "capital" ? "92002" : "92001")}</span></div>
              <div><span className="font-bold text-muted-foreground">وضعیت اعتبار:</span> <span className="font-bold text-emerald-600">تخصیص یافته و قطعی</span></div>
            </div>

            {/* جدول ریز سطور تخصیص داده شده در پروانه */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-foreground">جدول تفکیکی ریز تخصیص بر حسب فصول و برنامه‌ها:</h4>
              <div className="overflow-x-auto border rounded-xl">
                <table className="w-full text-right text-xs">
                  <thead className="bg-muted/60 border-b font-bold text-muted-foreground">
                    <tr>
                      <th className="p-2 text-center w-8">#</th>
                      <th className="p-2">فصل اعتباری</th>
                      <th className="p-2 text-center">شماره برنامه / طرح</th>
                      <th className="p-2 text-center">منبع</th>
                      <th className="p-2 text-center">ردیف دستگاه</th>
                      <th className="p-2 text-left">مبلغ (ریال)</th>
                      <th className="p-2">شرح سطر</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {Array.isArray(selectedPrintAlloc.items) && selectedPrintAlloc.items.length > 0 ? (
                      selectedPrintAlloc.items.map((it, idx) => {
                        const srcObj = ALLOCATION_SOURCES.find((s) => s.id === String(it.allocationSource)) || { label: "نقد" };
                        return (
                          <tr key={idx}>
                            <td className="p-2 text-center font-bold">{idx + 1}</td>
                            <td className="p-2 font-bold">{it.chapterTitle || it.chapterCode || "—"}</td>
                            <td className="p-2 text-center font-mono font-bold">{it.programOrProjectNumber || "—"}</td>
                            <td className="p-2 text-center font-bold">{srcObj.label}</td>
                            <td className="p-2 text-center font-mono">{it.agencyRow || selectedPrintAlloc.agency_budget_row || "109000"}</td>
                            <td className="p-2 text-left font-mono font-bold text-emerald-600">{fmtNum(it.amount)}</td>
                            <td className="p-2 text-muted-foreground">{it.description || "—"}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-4 text-center text-muted-foreground">
                          تخصیص کلی به مبلغ {fmtNum(selectedPrintAlloc.amount)} ریال
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* خلاصه مبلغ کل و حروف در پروانه */}
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center space-y-1">
              <span className="text-xs font-bold text-muted-foreground">مبلغ کل تخصیص صادرشده:</span>
              <p className="text-xl font-extrabold font-mono text-emerald-600">{fmtNum(selectedPrintAlloc.amount)} ریال</p>
              <p className="text-xs font-bold text-emerald-700">{numToPersianWords(selectedPrintAlloc.amount)}</p>
            </div>

            {/* محل امضاهای رسمی ابلاغ */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t text-center text-xs font-bold text-muted-foreground">
              <div className="space-y-8">
                <p>مسئول تنظیم و ثبت اعتبارات</p>
                <p className="text-slate-400 font-normal">[ امضاء و مهر ]</p>
              </div>
              <div className="space-y-8">
                <p>ذیحساب و مدیر امور مالی</p>
                <p className="text-slate-400 font-normal">[ امضاء و مهر ]</p>
              </div>
              <div className="space-y-8">
                <p>رئیس دستگاه اجرایی / معاونت بودجه</p>
                <p className="text-slate-400 font-normal">[ امضاء و مهر ]</p>
              </div>
            </div>

            {/* دکمه‌های عملیاتی پایین مودال پرینت */}
            <div className="border-t pt-4 flex flex-wrap items-center justify-between gap-2 no-print">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  onClick={handleTriggerPrintCertificate}
                  className="h-9 text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                >
                  <Printer className="h-4 w-4" />
                  چاپ پروانه رسمی (پرینت مستقیم / PDF)
                </Button>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedPrintAlloc(null)}
                className="h-9 text-xs font-bold"
              >
                بستن
              </Button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
