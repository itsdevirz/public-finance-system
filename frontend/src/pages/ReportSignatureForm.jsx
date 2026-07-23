import { useState, useEffect, useRef } from "react";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  FileSignature, Upload, Trash2, Edit3, Check, RefreshCw, Printer,
  Eye, CheckCircle2, AlertCircle, UserCheck, ShieldCheck, Image as ImageIcon,
  Building2, Sliders, Layers, Sparkles, X, Plus
} from "lucide-react";
import { cn } from "@/lib/utils";

// لیست پیش‌فرض سمت‌ها جهت ایجاد سریع
const DEFAULT_ROLES = [
  { id: "treasurer", label: "ذیحساب و مدیرکل امور مالی", defaultSlot: 3 },
  { id: "financial_manager", label: "رئیس امور مالی و حسابداری", defaultSlot: 2 },
  { id: "accountant", label: "تنظیم کننده / کارشناس حسابداری", defaultSlot: 1 },
  { id: "credit_manager", label: "رئیس اداره اعتبارات و بودجه", defaultSlot: 2 },
  { id: "deputy_treasurer", label: "معاون ذیحساب", defaultSlot: 3 },
];

export default function ReportSignatureForm() {
  const [signatures, setSignatures] = useState([]);
  const [editingId, setEditingId] = useState(null);

  // حالت‌های فرم ایجاد/ویرایش امضا
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("ذیحساب و مدیرکل امور مالی");
  const [slot, setSlot] = useState("3"); // 1: راست (تنظیم کننده)، 2: مرکز (مدیر مالی)، 3: چپ (ذیحساب)
  const [signatureImage, setSignatureImage] = useState(null); // Base64
  const [stampImage, setStampImage] = useState(null); // Base64
  const [isActive, setIsActive] = useState(true);

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const sigFileRef = useRef(null);
  const stampFileRef = useRef(null);

  // بارگذاری امضاها از localStorage در هنگام شروع
  useEffect(() => {
    try {
      const saved = localStorage.getItem("user_report_signatures");
      if (saved) {
        setSignatures(JSON.parse(saved));
      }
    } catch (_) {}
  }, []);

  // ذخیره‌سازی تغییرات لیست امضاها در localStorage
  function saveSignaturesToStorage(newList) {
    setSignatures(newList);
    localStorage.setItem("user_report_signatures", JSON.stringify(newList));
  }

  // تبدیل فایل به Base64
  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }

  // آپلود اسکن امضا
  async function handleSignatureUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg("حجم تصویر امضا نباید بیشتر از ۲ مگابایت باشد.");
      return;
    }
    try {
      const base64 = await fileToBase64(file);
      setSignatureImage(base64);
      setErrorMsg("");
    } catch (err) {
      setErrorMsg("خطا در بارگذاری تصویر امضا: " + err.message);
    }
  }

  // آپلود اسکن مهر
  async function handleStampUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg("حجم تصویر مهر نباید بیشتر از ۲ مگابایت باشد.");
      return;
    }
    try {
      const base64 = await fileToBase64(file);
      setStampImage(base64);
      setErrorMsg("");
    } catch (err) {
      setErrorMsg("خطا در بارگذاری تصویر مهر: " + err.message);
    }
  }

  // ثبت یا بروزرسانی امضای کاربر
  function handleSubmit(e) {
    e.preventDefault();
    if (!userName.trim()) {
      setErrorMsg("نام و نام خانوادگی کاربر الزامی است.");
      return;
    }
    if (!userRole.trim()) {
      setErrorMsg("عنوان سازمانی / سمت کاربر الزامی است.");
      return;
    }
    if (!signatureImage) {
      setErrorMsg("تصویر اسکن شده امضای کاربر الزامی است.");
      return;
    }

    try {
      setIsSaving(true);
      setErrorMsg("");

      let updatedList = [];
      if (editingId) {
        // ویرایش امضای موجود
        updatedList = signatures.map(item => {
          if (item.id === editingId) {
            return {
              ...item,
              userName,
              userRole,
              slot,
              signatureImage,
              stampImage,
              isActive,
              updatedAt: new Date().toISOString()
            };
          }
          return item;
        });
        setSuccessMsg(`امضای اسکن شده کاربر «${userName}» با موفقیت بروزرسانی شد.`);
      } else {
        // افزودن امضای جدید
        const newItem = {
          id: "sig-" + Date.now(),
          userName,
          userRole,
          slot,
          signatureImage,
          stampImage,
          isActive,
          createdAt: new Date().toISOString()
        };
        updatedList = [newItem, ...signatures];
        setSuccessMsg(`امضای اسکن شده جدید برای کاربر «${userName}» ثبت گردید.`);
      }

      saveSignaturesToStorage(updatedList);
      resetForm();
      setIsSaving(false);
    } catch (err) {
      setIsSaving(false);
      setErrorMsg("خطا در ذخیره‌سازی امضا: " + err.message);
    }
  }

  // پاکسازی فرم
  function resetForm() {
    setEditingId(null);
    setUserName("");
    setUserRole("ذیحساب و مدیرکل امور مالی");
    setSlot("3");
    setSignatureImage(null);
    setStampImage(null);
    setIsActive(true);
    setErrorMsg("");
    if (sigFileRef.current) sigFileRef.current.value = "";
    if (stampFileRef.current) stampFileRef.current.value = "";
  }

  // ویرایش یک امضا
  function handleEdit(item) {
    setEditingId(item.id);
    setUserName(item.userName);
    setUserRole(item.userRole);
    setSlot(item.slot || "3");
    setSignatureImage(item.signatureImage);
    setStampImage(item.stampImage || null);
    setIsActive(item.isActive !== false);
    setErrorMsg("");
    setSuccessMsg("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // تغییر وضعیت فعال/غیرفعال
  function handleToggleActive(id) {
    const updated = signatures.map(item => {
      if (item.id === id) {
        return { ...item, isActive: !item.isActive };
      }
      return item;
    });
    saveSignaturesToStorage(updated);
  }

  // حذف امضا
  function handleDelete(id, name) {
    if (window.confirm(`آیا از حذف امضای اسکن شده «${name}» اطمینان دارید؟`)) {
      const updated = signatures.filter(item => item.id !== id);
      saveSignaturesToStorage(updated);
      setSuccessMsg(`امضای کاربر «${name}» با موفقیت حذف گردید.`);
    }
  }

  // چاپ برگه تست تاییدیه امضاها
  function handlePrintSignaturesSheet() {
    const win = window.open("", "_blank", "width=850,height=950");
    if (!win) return;

    const activeSigs = signatures.filter(s => s.isActive);
    const toPersianDigits = str => String(str || "").replace(/[0-9]/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]);

    win.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="UTF-8"/>
  <title>برگه تایید نمونه امضاهای اسکن شده رسمی</title>
  <style>
    @page { size: A4 portrait; margin: 12mm 15mm; }
    body { font-family: Tahoma, sans-serif; font-size: 11px; color: #111; direction: rtl; padding: 15px; margin: 0; line-height: 1.6; }
    .container { border: 2px solid #111; border-radius: 8px; padding: 20px; background: #fff; max-width: 750px; margin: 0 auto; }
    .header { text-align: center; border-bottom: 2px solid #111; padding-bottom: 12px; margin-bottom: 20px; }
    .header h2 { margin: 0; font-size: 16px; font-weight: bold; }
    .header p { margin: 4px 0 0 0; font-size: 11px; color: #444; }
    .sig-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 20px; }
    .sig-box { border: 1px solid #ccc; border-radius: 6px; padding: 10px; text-align: center; background: #fdfdfd; min-height: 160px; display: flex; flex-direction: column; justify-content: space-between; }
    .sig-img { max-height: 60px; max-width: 140px; object-fit: contain; margin: 8px auto; }
    .stamp-img { max-height: 50px; max-width: 80px; object-fit: contain; margin: 4px auto; }
    .role { font-weight: bold; font-size: 11px; color: #000; }
    .name { font-size: 11px; margin-top: 2px; color: #333; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>وزارت امور اقتصادی و دارایی — اداره کل امور مالی و ذیحسابی</h2>
      <p>برگه تایید نمونه امضاهای اسکن شده دیجیتال جهت درج پای اسناد و گزارشات مالی</p>
      <div style="font-size: 10px; margin-top: 6px;">تاریخ تنظیم: ${toPersianDigits(new Date().toLocaleDateString("fa-IR"))}</div>
    </div>

    <div class="sig-grid">
      ${activeSigs.map(sig => `
        <div class="sig-box">
          <div class="role">${sig.userRole}</div>
          <div class="name">${sig.userName}</div>
          <div>
            ${sig.signatureImage ? `<img src="${sig.signatureImage}" class="sig-img" alt="امضا"/>` : ''}
            ${sig.stampImage ? `<img src="${sig.stampImage}" class="stamp-img" alt="مهر"/>` : ''}
          </div>
          <div style="font-size: 9px; color: #666; border-top: 1px dashed #ddd; pt-4;">محل تایید سناما</div>
        </div>
      `).join('')}
    </div>

    <div style="margin-top: 40px; font-size: 10px; text-align: justify; background: #f9f9f9; padding: 10px; border-radius: 4px; border: 1px solid #eee;">
      <strong>تاییدیه ذیحسابی:</strong> تصاویر امضا و مهر فوق جهت درج الکترونیکی در ذیل اسناد حسابداری، فیش‌های حقوقی و ترازنامه‌های مالی دستگاه اسکن و تایید گردیده است.
    </div>
  </div>
  <script>window.onload = function() { window.print(); };</script>
</body>
</html>`);
    win.document.close();
  }

  return (
    <PageShell>
      <PageHeader
        title="تنظیم امضای گزارشات و فیش‌ها"
        description="اسکن، آپلود و مدیریت امضای دیجیتال و مهر رسمی کاربران جهت درج خودکار پای اسناد و گزارشات مالی"
      />

      <div className="space-y-4 text-right" dir="rtl">
        {/* پیام‌های اطلاع‌رسانی */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-xl flex items-center gap-2 font-semibold animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs p-3.5 rounded-xl flex items-center gap-2 font-semibold animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* هدر کنترل بالای صفحه */}
        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <FileSignature className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                مدیریت امضاهای اسکن شده کاربران
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">
                  تعداد امضاهای فعال: {signatures.filter(s => s.isActive).length}
                </Badge>
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                امضاهای بارگذاری شده به طور خودکار پای اسناد حسابداری، فیش‌های حقوقی و صورت‌های مالی قرار می‌گیرند.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintSignaturesSheet}
              disabled={signatures.length === 0}
              className="h-9 text-xs gap-1.5 border-blue-300 text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950 font-bold"
            >
              <Printer className="h-4 w-4" /> چاپ نمونه امضاها
            </Button>
          </div>
        </div>

        {/* کارت ثبت / ویرایش امضای جدید */}
        <Card className="border-slate-200/80 dark:border-slate-800 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                {editingId ? "ویرایش امضای اسکن شده کاربر" : "افزودن و اسکن امضای جدید برای کاربر"}
              </h4>
            </div>

            {editingId && (
              <Button variant="ghost" size="sm" onClick={resetForm} className="h-7 text-xs text-rose-600 gap-1">
                <X className="h-3.5 w-3.5" /> انصراف از ویرایش
              </Button>
            )}
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs font-semibold">نام و نام خانوادگی کاربر *</Label>
                  <Input
                    value={userName}
                    onChange={e => setUserName(e.target.value)}
                    className="h-9 text-xs mt-1.5 font-bold"
                    placeholder="مثال: محمدعلی رضایی"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">عنوان سازمانی / سمت در گزارشات *</Label>
                  <Input
                    value={userRole}
                    onChange={e => setUserRole(e.target.value)}
                    className="h-9 text-xs mt-1.5 font-semibold"
                    placeholder="مثال: ذیحساب و مدیرکل امور مالی"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">موقعیت و ردیف امضا در ذیل گزارشات</Label>
                  <select
                    value={slot}
                    onChange={e => setSlot(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm mt-1.5 font-semibold"
                  >
                    <option value="1">امضاء اول (سمت راست — تنظیم کننده / کارشناس)</option>
                    <option value="2">امضاء دوم (مرکز — مدیر مالی / رئیس امور مالی)</option>
                    <option value="3">امضاء سوم (سمت چپ — ذیحساب / مدیرکل)</option>
                  </select>
                </div>
              </div>

              {/* بخش بارگذاری اسکن امضا و مهر */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/60 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                {/* ۱. اسکن امضا */}
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <ImageIcon className="h-4 w-4 text-blue-600" />
                    بارگذاری فایل اسکن شده امضای کاربر *
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    فایل اسکن امضا ترجیحاً شفاف (PNG/WEBP) یا پس‌زمینه سفید بدون حاشیه (حداکثر ۲ مگابایت)
                  </p>

                  <div className="flex items-center gap-3">
                    <input
                      ref={sigFileRef}
                      type="file"
                      accept="image/png, image/jpeg, image/webp, image/svg+xml"
                      onChange={handleSignatureUpload}
                      className="hidden"
                      id="uploadSignatureInput"
                    />
                    <label
                      htmlFor="uploadSignatureInput"
                      className="h-9 px-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
                    >
                      <Upload className="h-4 w-4 text-blue-600" />
                      انتخاب فایل اسکن امضا...
                    </label>

                    {signatureImage && (
                      <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                        <Check className="h-4 w-4" /> آماده درج
                      </span>
                    )}
                  </div>

                  {/* پیش‌نمایش تصویر امضا */}
                  {signatureImage ? (
                    <div className="mt-2 p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-center relative group">
                      <img
                        src={signatureImage}
                        alt="پیش‌نمایش امضا"
                        className="max-h-20 max-w-full mx-auto object-contain"
                      />
                      <span className="text-[10px] text-slate-400 block mt-1">پیش‌نمایش تصویر اسکن شده امضا</span>
                    </div>
                  ) : (
                    <div className="mt-2 h-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-[11px] text-slate-400">
                      تصویر امضایی انتخاب نشده است
                    </div>
                  )}
                </div>

                {/* ۲. اسکن مهر رسمی */}
                <div className="space-y-3 border-r-0 md:border-r border-slate-200 dark:border-slate-800 md:pr-6">
                  <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-emerald-600" />
                    بارگذاری اسکن مهر رسمی (اختیاری)
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    فایل اسکن شده مهر رسمی ذیحسابی یا دستگاه جهت چاپ پای گزارشات (حداکثر ۲ مگابایت)
                  </p>

                  <div className="flex items-center gap-3">
                    <input
                      ref={stampFileRef}
                      type="file"
                      accept="image/png, image/jpeg, image/webp, image/svg+xml"
                      onChange={handleStampUpload}
                      className="hidden"
                      id="uploadStampInput"
                    />
                    <label
                      htmlFor="uploadStampInput"
                      className="h-9 px-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
                    >
                      <Upload className="h-4 w-4 text-emerald-600" />
                      انتخاب فایل اسکن مهر...
                    </label>

                    {stampImage && (
                      <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                        <Check className="h-4 w-4" /> آماده درج
                      </span>
                    )}
                  </div>

                  {/* پیش‌نمایش تصویر مهر */}
                  {stampImage ? (
                    <div className="mt-2 p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-center">
                      <img
                        src={stampImage}
                        alt="پیش‌نمایش مهر"
                        className="max-h-20 max-w-full mx-auto object-contain"
                      />
                      <span className="text-[10px] text-slate-400 block mt-1">پیش‌نمایش تصویر اسکن شده مهر</span>
                    </div>
                  ) : (
                    <div className="mt-2 h-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-[11px] text-slate-400">
                      مهر اسکن شده ثبت نشده است
                    </div>
                  )}
                </div>
              </div>

              {/* فعال بودن */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActiveSig"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                <label htmlFor="isActiveSig" className="text-xs text-slate-700 dark:text-slate-300 font-bold cursor-pointer">
                  فعال بودن این امضا جهت درج خودکار در خروجی‌های چاپی اسناد و گزارشات
                </label>
              </div>

              {/* دکمه ثبت */}
              <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 text-xs gap-1.5 px-6 shadow-md shadow-blue-500/20"
                >
                  <Plus className="h-4 w-4" />
                  {editingId ? "ثبت تغییرات امضا" : "ذخیره و ثبت امضای اسکن شده کاربر"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* لیست امضاهای ثبت شده */}
        <Card className="border-slate-200/80 dark:border-slate-800 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-600" />
              لیست امضاها و مهرهای اسکن شده ثبت شده در سیستم
            </h4>
            <span className="text-[11px] text-muted-foreground font-semibold">
              تعداد: {signatures.length}
            </span>
          </CardHeader>

          <CardContent className="pt-4">
            {signatures.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-xs space-y-2">
                <FileSignature className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-700" />
                <p className="font-bold">هنوز هیچ امضای اسکن شده‌ای در سیستم ثبت نشده است.</p>
                <p className="text-[11px]">از فرم بالا می‌توانید تصویر اسکن شده امضا و مهر هر کاربر را آپلود نمایید.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-xs text-right">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                    <tr>
                      <th className="p-3">نام و نام خانوادگی</th>
                      <th className="p-3">عنوان سازمانی / سمت</th>
                      <th className="p-3">ردیف امضا</th>
                      <th className="p-3 text-center">تصویر اسکن امضا</th>
                      <th className="p-3 text-center">تصویر مهر</th>
                      <th className="p-3 text-center">وضعیت</th>
                      <th className="p-3 text-center">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {signatures.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-bold text-slate-900 dark:text-slate-100">
                          {item.userName}
                        </td>
                        <td className="p-3 text-slate-700 dark:text-slate-300 font-semibold">
                          {item.userRole}
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="bg-slate-50 text-slate-700 text-[10px]">
                            {item.slot === "1" ? "امضاء ۱ (راست)" : item.slot === "2" ? "امضاء ۲ (مرکز)" : "امضاء ۳ (چپ)"}
                          </Badge>
                        </td>
                        <td className="p-3 text-center">
                          {item.signatureImage ? (
                            <img
                              src={item.signatureImage}
                              alt="امضا"
                              className="h-10 max-w-[120px] object-contain mx-auto border border-slate-200 dark:border-slate-800 rounded p-1 bg-white"
                            />
                          ) : (
                            <span className="text-slate-400 text-[10px]">بدون امضا</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {item.stampImage ? (
                            <img
                              src={item.stampImage}
                              alt="مهر"
                              className="h-10 max-w-[80px] object-contain mx-auto border border-slate-200 dark:border-slate-800 rounded p-1 bg-white"
                            />
                          ) : (
                            <span className="text-slate-400 text-[10px]">بدون مهر</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(item.id)}
                            className="cursor-pointer"
                          >
                            <Badge
                              className={cn(
                                "text-[10px] cursor-pointer",
                                item.isActive
                                  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 border-none"
                              )}
                            >
                              {item.isActive ? "فعال" : "غیرفعال"}
                            </Badge>
                          </button>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(item)}
                              className="h-7 w-7 p-0 text-blue-600 hover:bg-blue-50"
                              title="ویرایش"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(item.id, item.userName)}
                              className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-50"
                              title="حذف"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
