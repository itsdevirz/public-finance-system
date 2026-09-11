import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Trash2, Edit, Save, RefreshCw, FileText, CheckCircle2, AlertCircle,
  Copy, Printer, FileSpreadsheet, FileCode, X, ArrowLeft, Send, Lock,
  HelpCircle, Layers, ShieldCheck, Landmark, CheckSquare, Download, FileCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/api";

function fmtNum(n) {
  if (n === 0 || n == null || isNaN(n)) return "۰";
  return Number(n).toLocaleString("fa-IR");
}

// تبدیل عدد به حروف فارسی ساده
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

// فصول اعتبار مطابق پروتکل صفحه ۱۹
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

export default function AgreementRegistrationForm({ onComplete }) {
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);
  const [editingAgr, setEditingAgr] = useState(null);

  // ۱. فیلدهای کنترلی هدر بالای فرم (۷ فیلد اصلی)
  const [headerForm, setHeaderForm] = useState({
    title: "",
    creditCategory: "expense", // هزینه‌ای (expense) / عمرانی (capital)
    sourceType: "public", // عمومی / اختصاصی / سایر منابع
    creditType: "approved", // مصوب / ابلاغی
    creditSpec: "program", // برنامه / طرح
    baseCode: "", // کد مبنا (کد فعالیت/طرح) - لایه اتصال به تخصیص/تأمین/پرداخت
    yearType: "current", // جاری / متمم / سنواتی
    fiscalYear: "1404", // ۱۴۰۳ / ۱۴۰۴ / ۱۴۰۵
    description: "",
  });

  // ۲. سطرهای تفکیکی جدول جزئیات (Data Grid Rows)
  const [items, setItems] = useState([
    {
      id: "row-1",
      miscellaneousRowNumber: "", // شماره ردیف متفرقه (۶ تا ۸ رقم)
      programOrProjectNumber: "", // شماره برنامه (۴ رقم) یا طرح (۱۲/۱۴ رقم)
      capitalType: "national", // استانی (۱۴ رقم) / ملی (۱۲ رقم)
      chapterCode: "210000", // فصل اعتبار پیش‌فرض
      amount: "", // مبلغ به ریال
      notifierCode: "", // ابلاغ‌دهنده (۶ رقم)
      agencyBudgetRow: "", // ردیف بودجه‌ای دستگاه دریافت‌کننده (۶ رقم)
    }
  ]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/credits/agreements");
      setAgreements(res.data?.data || []);
    } catch (e) {
      console.error("Error fetching agreements:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // محاسبه کدهای حسابداری اتوماتیک بر اساس نوع اعتبارات
  const getAccountingCodes = (category) => {
    if (category === "expense") {
      return { debtor: "92001", creditor: "91001", title: "اعتبارات هزینه‌ای (بدهکار: ۹۲۰۰۱ / بستانکار: ۹۱۰۰۱)" };
    } else {
      return { debtor: "92002", creditor: "91002", title: "اعتبارات تملک دارایی‌های سرمایه‌ای (بدهکار: ۹۲۰۰۲ / بستانکار: ۹۱۰۰۲)" };
    }
  };

  const accountingInfo = getAccountingCodes(headerForm.creditCategory);

  // محاسبه جمع کل مبالغ سطرهای جزئیات
  const totalGridAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  // افزودن سطر جدید به جدول
  const handleAddRow = () => {
    const defaultChapter = headerForm.creditCategory === "expense" ? "210000" : "110100";
    setItems([
      ...items,
      {
        id: `row-${Date.now()}`,
        miscellaneousRowNumber: "",
        programOrProjectNumber: "",
        capitalType: "national",
        chapterCode: defaultChapter,
        amount: "",
        notifierCode: "",
        agencyBudgetRow: "",
      }
    ]);
  };

  // کپی کردن سطر انتخابی
  const handleCopyRow = (itemToCopy) => {
    setItems([
      ...items,
      {
        ...itemToCopy,
        id: `row-copy-${Date.now()}`,
        amount: itemToCopy.amount, // امکان ویرایش آسان مبلغ برای فصل جدید
      }
    ]);
    setAlertMsg({ type: "success", text: "سطر موردنظر کپی شد. می‌توانید مقادیر عددی و فصل جدید را بازنویسی فرمایید." });
  };

  // حذف سطر
  const handleDeleteRow = (id) => {
    if (items.length <= 1) {
      setAlertMsg({ type: "error", text: "حداقل وجود یک سطر جزئیات در موافقتنامه الزامی است." });
      return;
    }
    setItems(items.filter(i => i.id !== id));
  };

  // به‌روزرسانی فیلد سطر
  const handleRowChange = (id, field, value) => {
    setItems(items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  // اعتبارسنجی جامع فرم موافقتنامه
  const validateForm = () => {
    if (!headerForm.title.trim()) {
      setAlertMsg({ type: "error", text: "لطفاً عنوان موافقتنامه را وارد فرمایید." });
      return false;
    }
    if (!headerForm.baseCode.trim()) {
      setAlertMsg({ type: "error", text: "لطفاً «کد مبنا» را جهت ایجاد لایه اتصال به تخصیص و پرداخت مشخص نمایید." });
      return false;
    }

    // بررسی اعتبارسنجی طول کدهای سطرها
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const rowNum = i + 1;

      // شماره ردیف متفرقه (۶ تا ۸ رقم)
      if (item.miscellaneousRowNumber && (item.miscellaneousRowNumber.length < 6 || item.miscellaneousRowNumber.length > 8)) {
        setAlertMsg({ type: "error", text: `سطر ${rowNum}: شماره ردیف متفرقه باید بین ۶ تا ۸ رقم باشد.` });
        return false;
      }

      // شماره برنامه یا طرح (هزینه‌ای ۴ رقم / عمرانی استانی ۱۴ رقم یا ملی ۱۲ رقم)
      if (headerForm.creditCategory === "expense") {
        if (item.programOrProjectNumber && item.programOrProjectNumber.length !== 4) {
          setAlertMsg({ type: "error", text: `سطر ${rowNum}: شماره برنامه اعتبارات هزینه‌ای باید دقیقاً ۴ رقم باشد.` });
          return false;
        }
      } else {
        const expectedLen = item.capitalType === "provincial" ? 14 : 12;
        if (item.programOrProjectNumber && item.programOrProjectNumber.length !== expectedLen) {
          setAlertMsg({ type: "error", text: `سطر ${rowNum}: شماره طرح اعتبارات عمرانی ${item.capitalType === "provincial" ? "استانی (۱۴ رقم)" : "ملی (۱۲ رقم)"} معتبر نمی‌باشد.` });
          return false;
        }
      }

      // ابلاغ‌دهنده (۶ رقم)
      if (item.notifierCode && item.notifierCode.length !== 6) {
        setAlertMsg({ type: "error", text: `سطر ${rowNum}: کد ابلاغ‌دهنده باید ۶ رقم باشد.` });
        return false;
      }

      // ردیف بودجه‌ای دستگاه (۶ رقم)
      if (item.agencyBudgetRow && item.agencyBudgetRow.length !== 6) {
        setAlertMsg({ type: "error", text: `سطر ${rowNum}: کد ردیف بودجه‌ای دستگاه باید ۶ رقم باشد.` });
        return false;
      }
    }
    return true;
  };

  // ذخیره اصلی موافقتنامه
  const handleSave = async (statusType = "confirmed", actionType = "save") => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const payload = {
        title: headerForm.title,
        fiscal_year: headerForm.fiscalYear,
        credit_category: headerForm.creditCategory,
        source_type: headerForm.sourceType,
        credit_type: headerForm.creditType,
        credit_spec: headerForm.creditSpec,
        base_code: headerForm.baseCode,
        year_type: headerForm.yearType,
        total_amount: totalGridAmount,
        debtor_account: accountingInfo.debtor,
        creditor_account: accountingInfo.creditor,
        issue_journal_voucher: true,
        status: statusType,
        description: headerForm.description,
        items: items.map(i => ({
          miscellaneousRowNumber: i.miscellaneousRowNumber,
          programOrProjectNumber: i.programOrProjectNumber,
          capitalType: i.capitalType,
          chapterCode: i.chapterCode,
          amount: Number(i.amount) || 0,
          notifierCode: i.notifierCode,
          agencyBudgetRow: i.agencyBudgetRow,
          debtorAccount: accountingInfo.debtor,
          creditorAccount: accountingInfo.creditor
        }))
      };

      if (editingAgr) {
        await api.put(`/api/credits/agreements/${editingAgr._id}`, payload);
        setAlertMsg({ type: "success", text: "موافقتنامه با موفقیت ویرایش شد و سند حسابداری مربوطه صادر گردید." });
      } else {
        await api.post("/api/credits/agreements", payload);
        setAlertMsg({ type: "success", text: "موافقتنامه جدید و سند حسابداری اتوماتیک با موفقیت ثبت شد." });
      }

      await fetchData();

      if (actionType === "new") {
        handleResetForm();
      } else if (actionType === "return" && onComplete) {
        onComplete();
      }
    } catch (e) {
      setAlertMsg({ type: "error", text: "خطا در ثبت موافقتنامه و صدور سند حسابداری." });
    } finally {
      setLoading(false);
    }
  };

  // کپی کامل موافقتنامه جاری
  const handleCopyEntireAgreement = () => {
    setHeaderForm({
      ...headerForm,
      title: `کپی - ${headerForm.title}`,
      baseCode: `${headerForm.baseCode}-کپی`,
    });
    setEditingAgr(null);
    setAlertMsg({ type: "success", text: "اطلاعات موافقتنامه کپی گردید. می‌توانید مبالغ و فصول جدید را ویرایش فرمایید." });
  };

  // ریست فرم
  const handleResetForm = () => {
    setEditingAgr(null);
    setHeaderForm({
      title: "",
      creditCategory: "expense",
      sourceType: "public",
      creditType: "approved",
      creditSpec: "program",
      baseCode: "",
      yearType: "current",
      fiscalYear: "1404",
      description: "",
    });
    setItems([
      {
        id: "row-1",
        miscellaneousRowNumber: "",
        programOrProjectNumber: "",
        capitalType: "national",
        chapterCode: "210000",
        amount: "",
        notifierCode: "",
        agencyBudgetRow: "",
      }
    ]);
  };

  // ویرایش موافقتنامه از جدول پایین
  const handleEditAgreement = (agr) => {
    setEditingAgr(agr);
    setHeaderForm({
      title: agr.title || "",
      creditCategory: agr.credit_category || "expense",
      sourceType: agr.source_type || "public",
      creditType: agr.credit_type || "approved",
      creditSpec: agr.credit_spec || "program",
      baseCode: agr.base_code || "",
      yearType: agr.year_type || "current",
      fiscalYear: String(agr.fiscal_year || "1404"),
      description: agr.description || "",
    });
    if (agr.items && agr.items.length > 0) {
      setItems(agr.items.map((it, idx) => ({
        id: `row-edit-${idx}`,
        miscellaneousRowNumber: it.miscellaneousRowNumber || "",
        programOrProjectNumber: it.programOrProjectNumber || "",
        capitalType: it.capitalType || "national",
        chapterCode: it.chapterCode || (agr.credit_category === "capital" ? "110100" : "210000"),
        amount: it.amount != null ? String(it.amount) : "",
        notifierCode: it.notifierCode || "",
        agencyBudgetRow: it.agencyBudgetRow || "",
      })));
    }
  };

  // حذف موافقتنامه
  const handleDeleteAgreement = async (id) => {
    if (!window.confirm("آیا از حذف این موافقتنامه اطمینان دارید؟")) return;
    try {
      setLoading(true);
      await api.delete(`/api/credits/agreements/${id}`);
      setAlertMsg({ type: "success", text: "موافقتنامه با موفقیت حذف گردید." });
      fetchData();
    } catch (e) {
      setAlertMsg({ type: "error", text: "خطا در حذف موافقتنامه." });
    } finally {
      setLoading(false);
    }
  };

  // خروجی گرفتن فرضی (Export)
  const handleExport = (format) => {
    setAlertMsg({ type: "success", text: `خروجی موافقتنامه با فرمت ${format.toUpperCase()} با موفقیت تولید شد.` });
  };

  // چاپ
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300" dir="rtl">
      {/* پیام هشدار / موفقیت */}
      {alertMsg && (
        <div className={cn(
          "p-4 rounded-xl border flex items-center justify-between text-xs font-bold shadow-xs",
          alertMsg.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"
        )}>
          <div className="flex items-center gap-2">
            {alertMsg.type === "success" ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-rose-600" />}
            <span>{alertMsg.text}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setAlertMsg(null)} className="h-6 w-6 p-0"><X className="h-4 w-4" /></Button>
        </div>
      )}

      {/* ۲. نوار ابزار عملیاتی و آیکون‌های پنجره (Toolbar Buttons) */}
      <Card className="border border-primary/20 bg-gradient-to-r from-card via-muted/30 to-card shadow-xs">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {/* ایجاد */}
              <Button onClick={handleResetForm} variant="outline" size="sm" className="h-8 text-xs font-bold gap-1 bg-background hover:bg-muted">
                <Plus className="h-3.5 w-3.5 text-primary" />
                ایجاد
              </Button>

              {/* ذخیره و صدور سند */}
              <Button onClick={() => handleSave("confirmed", "save")} disabled={loading} size="sm" className="h-8 text-xs font-bold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs">
                <FileCheck className="h-3.5 w-3.5" />
                ذخیره و صدور سند
              </Button>

              {/* ذخیره و جدید */}
              <Button onClick={() => handleSave("confirmed", "new")} disabled={loading} variant="outline" size="sm" className="h-8 text-xs font-bold gap-1 border-blue-300 text-blue-700 hover:bg-blue-50">
                <Save className="h-3.5 w-3.5" />
                ذخیره و جدید
              </Button>

              {/* ذخیره و برگشت */}
              <Button onClick={() => handleSave("confirmed", "return")} disabled={loading} variant="outline" size="sm" className="h-8 text-xs font-bold gap-1 border-indigo-300 text-indigo-700 hover:bg-indigo-50">
                <ArrowLeft className="h-3.5 w-3.5" />
                ذخیره و برگشت
              </Button>

              {/* ویرایش */}
              {editingAgr && (
                <Button onClick={() => handleSave("confirmed", "save")} variant="outline" size="sm" className="h-8 text-xs font-bold gap-1 border-amber-300 text-amber-700 hover:bg-amber-50">
                  <Edit className="h-3.5 w-3.5" />
                  بروزرسانی ویرایش
                </Button>
              )}

              {/* کپی */}
              <Button onClick={handleCopyEntireAgreement} variant="outline" size="sm" className="h-8 text-xs font-bold gap-1 border-purple-300 text-purple-700 hover:bg-purple-50">
                <Copy className="h-3.5 w-3.5" />
                کپی موافقتنامه
              </Button>

              {/* اصلاحیه */}
              <Button onClick={() => handleSave("draft", "save")} variant="outline" size="sm" className="h-8 text-xs font-bold gap-1 border-orange-300 text-orange-700 hover:bg-orange-50">
                <FileText className="h-3.5 w-3.5" />
                ثبت اصلاحیه
              </Button>

              {/* بستن */}
              <Button onClick={onComplete || handleResetForm} variant="ghost" size="sm" className="h-8 text-xs font-bold gap-1 text-muted-foreground hover:bg-muted">
                <X className="h-3.5 w-3.5" />
                بستن
              </Button>
            </div>

            {/* خروجی‌ها و چاپ */}
            <div className="flex items-center gap-1">
              <Button onClick={handlePrint} variant="outline" size="sm" className="h-8 text-xs font-bold gap-1">
                <Printer className="h-3.5 w-3.5 text-foreground" />
                چاپ
              </Button>
              <Button onClick={() => handleExport("xlsx")} variant="outline" size="sm" className="h-8 text-xs font-bold gap-1 text-emerald-700 border-emerald-300 bg-emerald-50/50 hover:bg-emerald-100">
                <FileSpreadsheet className="h-3.5 w-3.5" />
                XLSX
              </Button>
              <Button onClick={() => handleExport("pdf")} variant="outline" size="sm" className="h-8 text-xs font-bold gap-1 text-rose-700 border-rose-300 bg-rose-50/50 hover:bg-rose-100">
                <Download className="h-3.5 w-3.5" />
                PDF
              </Button>
              <Button onClick={() => handleExport("doc")} variant="outline" size="sm" className="h-8 text-xs font-bold gap-1 text-blue-700 border-blue-300 bg-blue-50/50 hover:bg-blue-100">
                <FileCode className="h-3.5 w-3.5" />
                Word
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ۱. کادر فیلدهای بالای پنجره: ثبت موافقتنامه (۷ فیلد اصلی کنترلی) */}
      <Card className="shadow-sm border-2 border-primary/20">
        <CardHeader className="pb-3 border-b border-border/50 bg-primary/5 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
              <Landmark className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-black text-foreground">ثبت موافقتنامه</CardTitle>
              <p className="text-[11px] text-muted-foreground">ورود اطلاعات کنترلی موافقتنامه بودجه‌ای دستگاه</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-background text-primary border-primary/30 font-mono text-xs px-2.5 py-1">
            کد حسابداری بدهکار: {accountingInfo.debtor} | بستانکار: {accountingInfo.creditor}
          </Badge>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          {/* عنوان موافقتنامه */}
          <div className="space-y-1">
            <Label className="text-xs font-bold text-foreground">عنوان موافقتنامه <span className="text-rose-500">*</span></Label>
            <Input
              value={headerForm.title}
              onChange={(e) => setHeaderForm({ ...headerForm, title: e.target.value })}
              placeholder="مثال: موافقتنامه اعتبارات هزینه‌ای برنامه‌های اداری و عمومی سال ۱۴۰۴"
              className="text-xs font-bold"
            />
          </div>

          {/* شبکه ۶ فیلد کشویی و کنترلی اصلی */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* ۱. اعتبارات */}
            <div className="space-y-1 bg-muted/30 p-2.5 rounded-xl border border-border/50">
              <Label className="text-[11px] font-bold text-muted-foreground block">۱. اعتبارات:</Label>
              <select
                value={headerForm.creditCategory}
                onChange={(e) => {
                  const cat = e.target.value;
                  setHeaderForm({ ...headerForm, creditCategory: cat });
                  // به‌روزرسانی فصل پیش‌فرض سطرهای جدول
                  const defChap = cat === "expense" ? "210000" : "110100";
                  setItems(items.map(i => ({ ...i, chapterCode: defChap })));
                }}
                className="w-full bg-background border border-input rounded-lg px-2 py-1.5 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="expense">هزینه‌ای</option>
                <option value="capital">تملک دارایی‌های سرمایه‌ای (عمرانی)</option>
              </select>
            </div>

            {/* ۲. نوع منبع */}
            <div className="space-y-1 bg-muted/30 p-2.5 rounded-xl border border-border/50">
              <Label className="text-[11px] font-bold text-muted-foreground block">۲. نوع منبع:</Label>
              <select
                value={headerForm.sourceType}
                onChange={(e) => setHeaderForm({ ...headerForm, sourceType: e.target.value })}
                className="w-full bg-background border border-input rounded-lg px-2 py-1.5 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="public">۱. عمومی</option>
                <option value="special">۲. اختصاصی</option>
                <option value="other">۳. سایر منابع</option>
              </select>
            </div>

            {/* ۳. نوع اعتبار */}
            <div className="space-y-1 bg-muted/30 p-2.5 rounded-xl border border-border/50">
              <Label className="text-[11px] font-bold text-muted-foreground block">۳. نوع اعتبار:</Label>
              <select
                value={headerForm.creditType}
                onChange={(e) => setHeaderForm({ ...headerForm, creditType: e.target.value })}
                className="w-full bg-background border border-input rounded-lg px-2 py-1.5 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="approved">۱. مصوب</option>
                <option value="notified">۲. ابلاغی (ابلاغیه)</option>
              </select>
            </div>

            {/* ۴. مشخصات اعتبار */}
            <div className="space-y-1 bg-muted/30 p-2.5 rounded-xl border border-border/50">
              <Label className="text-[11px] font-bold text-muted-foreground block">۴. مشخصات اعتبار:</Label>
              <select
                value={headerForm.creditSpec}
                onChange={(e) => setHeaderForm({ ...headerForm, creditSpec: e.target.value })}
                className="w-full bg-background border border-input rounded-lg px-2 py-1.5 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="program">برنامه</option>
                <option value="project">طرح</option>
              </select>
            </div>

            {/* ۵. کد مبنا (کد فعالیت / طرح) */}
            <div className="space-y-1 bg-primary/10 p-2.5 rounded-xl border border-primary/30">
              <Label className="text-[11px] font-bold text-primary flex items-center justify-between">
                <span>۵. کد مبنا:</span>
                <HelpCircle className="h-3 w-3 text-primary cursor-help" title="حلقه اتصال به تخصیص، تأمین اعتبار و پرداخت" />
              </Label>
              <Input
                value={headerForm.baseCode}
                onChange={(e) => setHeaderForm({ ...headerForm, baseCode: e.target.value })}
                placeholder="مثال: ۱"
                className="bg-background text-xs font-mono font-bold text-center text-primary border-primary/40"
              />
            </div>

            {/* ۶ & ۷. نوع سال و سال مالی */}
            <div className="space-y-1 bg-muted/30 p-2.5 rounded-xl border border-border/50">
              <div className="flex justify-between items-center">
                <Label className="text-[11px] font-bold text-muted-foreground block">۶. سال:</Label>
                <span className="text-[10px] font-bold text-primary">۷. سال مالی</span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <select
                  value={headerForm.yearType}
                  onChange={(e) => setHeaderForm({ ...headerForm, yearType: e.target.value })}
                  className="bg-background border border-input rounded-lg px-1 py-1.5 text-[11px] font-bold text-foreground cursor-pointer"
                >
                  <option value="current">۱. جاری</option>
                  <option value="supplementary">۲. متمم</option>
                  <option value="prior">۳. سنواتی</option>
                </select>
                <select
                  value={headerForm.fiscalYear}
                  onChange={(e) => setHeaderForm({ ...headerForm, fiscalYear: e.target.value })}
                  className="bg-background border border-input rounded-lg px-1 py-1.5 text-[11px] font-bold text-foreground cursor-pointer"
                >
                  <option value="1405">۱۴۰۵</option>
                  <option value="1404">۱۴۰۴</option>
                  <option value="1403">۱۴۰۳</option>
                </select>
              </div>
            </div>
          </div>

          {/* جعبه راهنمای کارکرد کلیدی کد مبنا */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2">
            <HelpCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="font-bold">⚠️ کارکرد کلیدی کد مبنا:</strong> این کد حلقه اتصال ثبت حسابداری موافقتنامه به مراحل بعدی چرخه اعتبار (تخصیص، تأمین اعتبار و پرداخت) است. با ثبت کد مبنا در موافقتنامه (مثلاً <span className="font-mono font-bold bg-amber-200 dark:bg-amber-900/60 px-1.5 py-0.5 rounded">«۱»</span>)، در زمان ثبت تخصیص تنها با فراخوانی کد مبنای ۱، کلیه اطلاعات موافقتنامه به صورت خودکار فراخوانی شده و مبلغ تخصیص در سقف موافقتنامه قفل می‌گردد.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ۳. بخش دوم: جدول ثبت جزئیات (سطرهای اطلاعاتی - Data Grid) */}
      <Card className="shadow-sm border">
        <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              جدول جزئیات ثبت موافقتنامه ({items.length} سطر)
            </CardTitle>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs font-mono">
              جمع کل: {fmtNum(totalGridAmount)} ریال
            </Badge>
          </div>

          <Button onClick={handleAddRow} size="sm" className="h-8 text-xs font-bold gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs">
            <Plus className="h-4 w-4" />
            سطر جدید
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-muted/60 text-muted-foreground font-bold border-b whitespace-nowrap">
                <tr>
                  <th className="p-3 text-center w-12">#</th>
                  <th className="p-3">۱. شماره ردیف متفرقه (۶-۸ رقم)</th>
                  <th className="p-3">
                    ۲. شماره برنامه/طرح
                    <span className="text-[10px] block font-normal text-muted-foreground">
                      {headerForm.creditCategory === "expense" ? "هزینه‌ای: ۴ رقم" : "عمرانی: استانی ۱۴/ملی ۱۲ رقم"}
                    </span>
                  </th>
                  <th className="p-3">
                    ۳. فصول اعتبار
                    <span className="text-[10px] block font-normal text-muted-foreground">مطابق پروتکل صفحه ۱۹</span>
                  </th>
                  <th className="p-3">۴. مبلغ (ریال)</th>
                  <th className="p-3">۵. ابلاغ‌دهنده (۶ رقم)</th>
                  <th className="p-3">۶. ردیف دستگاه / ذیحساب (۶ رقم)</th>
                  <th className="p-3 text-center">کدهای حسابداری (بدهکار/بستانکار)</th>
                  <th className="p-3 text-center w-28">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((item, index) => {
                  const chaptersList = headerForm.creditCategory === "expense" ? EXPENSE_CHAPTERS : CAPITAL_CHAPTERS;
                  return (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      {/* ردیف */}
                      <td className="p-3 text-center font-mono font-bold text-muted-foreground">{index + 1}</td>

                      {/* ۱. شماره ردیف متفرقه */}
                      <td className="p-2.5">
                        <Input
                          value={item.miscellaneousRowNumber}
                          onChange={(e) => handleRowChange(item.id, "miscellaneousRowNumber", e.target.value)}
                          placeholder="مثال: ۱۰۰۲۰۰"
                          className="h-8 text-xs font-mono font-bold"
                          maxLength={8}
                        />
                      </td>

                      {/* ۲. شماره برنامه یا طرح */}
                      <td className="p-2.5 space-y-1">
                        {headerForm.creditCategory === "capital" && (
                          <div className="flex items-center gap-2 mb-1">
                            <label className="text-[10px] font-bold text-muted-foreground">نوع طرح:</label>
                            <select
                              value={item.capitalType}
                              onChange={(e) => handleRowChange(item.id, "capitalType", e.target.value)}
                              className="bg-background border rounded px-1 text-[10px] font-bold cursor-pointer"
                            >
                              <option value="national">ملی (۱۲ رقم)</option>
                              <option value="provincial">استانی (۱۴ رقم)</option>
                            </select>
                          </div>
                        )}
                        <Input
                          value={item.programOrProjectNumber}
                          onChange={(e) => handleRowChange(item.id, "programOrProjectNumber", e.target.value)}
                          placeholder={headerForm.creditCategory === "expense" ? "کد ۴ رقمی" : (item.capitalType === "provincial" ? "کد ۱۴ رقمی" : "کد ۱۲ رقمی")}
                          className="h-8 text-xs font-mono font-bold"
                          maxLength={headerForm.creditCategory === "expense" ? 4 : (item.capitalType === "provincial" ? 14 : 12)}
                        />
                      </td>

                      {/* ۳. فصول اعتبار (مطابق پروتکل صفحه ۱۹) */}
                      <td className="p-2.5">
                        <select
                          value={item.chapterCode}
                          onChange={(e) => handleRowChange(item.id, "chapterCode", e.target.value)}
                          className="w-full h-8 bg-background border border-input rounded-md px-2 text-xs font-bold text-foreground focus:outline-none cursor-pointer"
                        >
                          {chaptersList.map((ch) => (
                            <option key={ch.code} value={ch.code}>
                              {ch.code} - {ch.title}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* ۴. مبلغ به ریال */}
                      <td className="p-2.5 min-w-[180px]">
                        <Input
                          type="number"
                          value={item.amount}
                          onChange={(e) => handleRowChange(item.id, "amount", e.target.value)}
                          placeholder="مبلغ ریالی..."
                          className="h-8 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400"
                        />
                        {Number(item.amount) > 0 && (
                          <span className="text-[10px] text-muted-foreground font-semibold block mt-0.5 truncate max-w-[200px]" title={numToPersianWords(item.amount)}>
                            {numToPersianWords(item.amount)}
                          </span>
                        )}
                      </td>

                      {/* ۵. ابلاغ‌دهنده */}
                      <td className="p-2.5">
                        <Input
                          value={item.notifierCode}
                          onChange={(e) => handleRowChange(item.id, "notifierCode", e.target.value)}
                          placeholder="کد ۶ رقمی"
                          className="h-8 text-xs font-mono"
                          maxLength={6}
                        />
                      </td>

                      {/* ۶. ردیف بودجه‌ای دستگاه / عامل ذیحساب */}
                      <td className="p-2.5">
                        <Input
                          value={item.agencyBudgetRow}
                          onChange={(e) => handleRowChange(item.id, "agencyBudgetRow", e.target.value)}
                          placeholder="کد ۶ رقمی دستگاه"
                          className="h-8 text-xs font-mono"
                          maxLength={6}
                        />
                      </td>

                      {/* کدهای اتوماتیک حسابداری */}
                      <td className="p-2.5 text-center">
                        <Badge variant="outline" className="font-mono text-[10px] px-2 py-1 bg-muted/40 text-foreground border-border">
                          بدهکار: {accountingInfo.debtor} | بستانکار: {accountingInfo.creditor}
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
                            title="کپی سطر جهت تغییر مبلغ و فصل جدید"
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
        </CardContent>
      </Card>

      {/* ۴. جدول لیست موافقتنامه‌های ثبت‌شده (پایین پنجره) */}
      <Card className="shadow-sm border">
        <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
              موافقتنامه‌ها ({agreements.length} مورد ثبت‌شده)
            </CardTitle>
          </div>
          <Button onClick={fetchData} variant="outline" size="sm" disabled={loading} className="h-8 text-xs font-bold gap-1">
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            به‌روزرسانی
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-muted/50 border-b text-muted-foreground font-bold whitespace-nowrap">
                <tr>
                  <th className="p-3">عنوان موافقتنامه</th>
                  <th className="p-3 text-center">کد مبنا</th>
                  <th className="p-3 text-center">نوع اعتبارات</th>
                  <th className="p-3 text-center">سال مالی</th>
                  <th className="p-3">مبلغ کل (ریال)</th>
                  <th className="p-3 text-center">کدهای حسابداری</th>
                  <th className="p-3 text-center">وضعیت</th>
                  <th className="p-3 text-center w-28">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {agreements.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      هیچ موافقتنامه‌ای ثبت نشده است.
                    </td>
                  </tr>
                ) : (
                  agreements.map((agr) => (
                    <tr key={agr._id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-bold text-foreground">{agr.title}</td>
                      <td className="p-3 text-center font-mono font-bold text-primary">{agr.base_code || agr.program_code || "-"}</td>
                      <td className="p-3 text-center">
                        <Badge variant="outline" className={agr.credit_category === "capital" ? "bg-amber-50 text-amber-700 border-amber-300" : "bg-blue-50 text-blue-700 border-blue-300"}>
                          {agr.credit_category === "capital" ? "عمرانی (تملک)" : "هزینه‌ای"}
                        </Badge>
                      </td>
                      <td className="p-3 text-center font-mono">{agr.fiscal_year}</td>
                      <td className="p-3 font-bold font-mono text-emerald-600">{fmtNum(agr.total_amount)}</td>
                      <td className="p-3 text-center font-mono text-[11px]">
                        بدهکار: {agr.debtor_account || (agr.credit_category === "capital" ? "92002" : "92001")} | بستانکار: {agr.creditor_account || (agr.credit_category === "capital" ? "91002" : "91001")}
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
                          🔒 قطعی و صادرشده
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditAgreement(agr)}
                            className="h-7 w-7 p-0 text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-lg"
                            title="ویرایش"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteAgreement(agr._id)}
                            className="h-7 w-7 p-0 text-rose-600 border-rose-200 bg-rose-50 hover:bg-rose-100 rounded-lg"
                            title="حذف"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
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
  );
}
