import { useState, useEffect, useRef } from "react";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FileSignature, Upload, Trash2, Edit3, Check, Printer, CheckCircle2, AlertCircle, Image as ImageIcon, Building2, Layers, Sparkles, X, Plus, UserCheck, ShieldAlert, BookOpen, Warehouse, Calculator, Coins, Landmark, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/api";
import { SYSTEM_MODULES, getModuleSignatures, saveModuleSignatures } from "@/lib/moduleRoles";

const ICON_MAP = {
  BookOpen,
  Warehouse,
  Building2,
  Calculator,
  Coins,
  Landmark
};

export default function ReportSignatureForm() {
  const [activeModuleKey, setActiveModuleKey] = useState("accounting");
  const [usersList, setUsersList] = useState([]);
  const [moduleSignatures, setModuleSignatures] = useState({});
  const [globalSignatures, setGlobalSignatures] = useState([]);

  const [editingRoleId, setEditingRoleId] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [userName, setUserName] = useState("");
  const [userRoleTitle, setUserRoleTitle] = useState("");
  const [slot, setSlot] = useState("1");
  const [signatureImage, setSignatureImage] = useState(null);
  const [stampImage, setStampImage] = useState(null);
  const [isActive, setIsActive] = useState(true);

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const sigFileRef = useRef(null);
  const stampFileRef = useRef(null);

  const activeModuleDef = SYSTEM_MODULES.find(m => m.key === activeModuleKey) || SYSTEM_MODULES[0];

  // بارگذاری کاربران سیستم
  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await api.get("/api/users");
        if (res.data?.success && Array.isArray(res.data.data)) {
          setUsersList(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching users for signature assignment:", err);
      }
    }
    loadUsers();
  }, []);

  // بارگذاری امضاکنندگان ماژول فعال
  useEffect(() => {
    const currentSignatures = getModuleSignatures(activeModuleKey);
    setModuleSignatures(prev => ({ ...prev, [activeModuleKey]: currentSignatures }));
    resetForm();
  }, [activeModuleKey]);

  // بارگذاری امضاهای کلی از localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("user_report_signatures");
      if (saved) setGlobalSignatures(JSON.parse(saved));
    } catch (_) {}
  }, []);

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }

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

  // انتخاب کاربر از لیست سیستم
  function handleSelectUser(uId) {
    setSelectedUserId(uId);
    if (!uId) return;
    const found = usersList.find(u => String(u._id || u.id) === String(uId));
    if (found) {
      const fullName = `${found.firstName || ""} ${found.lastName || ""}`.trim() || found.username;
      setUserName(fullName);
      // بررسی اگر کاربر مدیر سیستم است
      const isAdmin = found.role === "admin" || found.role === "مدیر سیستم" || found.username?.toLowerCase() === "admin";
      if (isAdmin) {
        setSuccessMsg(`⚠️ کاربر انتخاب شده «${fullName}» دارای نقش مدیر سیستم است (دسترسی کامل فول اکسس، ولی در صورت عدم تخصیص صریح، در چاپ اسناد نمی‌آید).`);
      }
    }
  }

  function resetForm() {
    setEditingRoleId(null);
    setSelectedUserId("");
    setUserName("");
    setUserRoleTitle("");
    setSlot("1");
    setSignatureImage(null);
    setStampImage(null);
    setIsActive(true);
    setErrorMsg("");
    if (sigFileRef.current) sigFileRef.current.value = "";
    if (stampFileRef.current) stampFileRef.current.value = "";
  }

  function handleEditRoleSignature(item) {
    setEditingRoleId(item.roleId || item.id);
    setSelectedUserId(item.userId || "");
    setUserName(item.userName || "");
    setUserRoleTitle(item.roleTitle || item.userRole || "");
    setSlot(String(item.slot || 1));
    setSignatureImage(item.signatureImage || null);
    setStampImage(item.stampImage || null);
    setIsActive(item.isActive !== false);
    setErrorMsg("");
    setSuccessMsg("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleSaveRoleSignature(e) {
    e.preventDefault();
    if (!userName.trim()) {
      setErrorMsg("نام و نام خانوادگی کاربر انتخابی الزامی است.");
      return;
    }
    if (!userRoleTitle.trim()) {
      setErrorMsg("عنوان نقش سازمانی الزامی است.");
      return;
    }

    try {
      setIsSaving(true);
      setErrorMsg("");

      const currentModuleSigs = moduleSignatures[activeModuleKey] || [];
      const isSystemAdminUser = usersList.some(u => String(u._id || u.id) === String(selectedUserId) && (u.role === "admin" || u.role === "مدیر سیستم"));

      const updatedSig = {
        roleId: editingRoleId || ("sig-" + Date.now()),
        roleTitle: userRoleTitle,
        userId: selectedUserId,
        userName: userName.trim(),
        signatureImage,
        stampImage,
        slot: Number(slot) || 1,
        isActive,
        isSystemAdmin: isSystemAdminUser,
        updatedAt: new Date().toISOString()
      };

      const existingIndex = currentModuleSigs.findIndex(s => s.roleId === updatedSig.roleId || s.roleTitle === updatedSig.roleTitle);
      let newModuleList = [];
      if (existingIndex >= 0) {
        newModuleList = [...currentModuleSigs];
        newModuleList[existingIndex] = updatedSig;
      } else {
        newModuleList = [...currentModuleSigs, updatedSig];
      }

      saveModuleSignatures(activeModuleKey, newModuleList);
      setModuleSignatures(prev => ({ ...prev, [activeModuleKey]: newModuleList }));

      // ذخیره‌سازی در لیست کلی
      const newGlobal = [updatedSig, ...globalSignatures.filter(g => g.roleId !== updatedSig.roleId)];
      setGlobalSignatures(newGlobal);
      localStorage.setItem("user_report_signatures", JSON.stringify(newGlobal));

      setSuccessMsg(`کاربر «${userName}» با نقش «${userRoleTitle}» در ماژول «${activeModuleDef.title}» ذخیره گردید.`);
      resetForm();
      setIsSaving(false);
    } catch (err) {
      setIsSaving(false);
      setErrorMsg("خطا در ذخیره‌سازی امضا: " + err.message);
    }
  }

  function handlePrintModuleSheet() {
    const win = window.open("", "_blank", "width=850,height=950");
    if (!win) return;

    const currentSigs = (moduleSignatures[activeModuleKey] || []).filter(s => s.isActive);
    const toPersianDigits = str => String(str || "").replace(/[0-9]/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]);

    win.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="UTF-8"/>
  <title>نمونه امضاهای رسمی — ${activeModuleDef.title}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm 15mm; }
    body { font-family: Tahoma, sans-serif; font-size: 11px; color: #111; direction: rtl; padding: 15px; margin: 0; line-height: 1.6; }
    .container { border: 2px solid #111; border-radius: 8px; padding: 20px; background: #fff; max-width: 750px; margin: 0 auto; }
    .header { text-align: center; border-bottom: 2px solid #111; padding-bottom: 12px; margin-bottom: 20px; }
    .header h2 { margin: 0; font-size: 16px; font-weight: bold; }
    .header p { margin: 4px 0 0 0; font-size: 11px; color: #444; }
    .sig-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 20px; }
    .sig-box { border: 1px solid #ccc; border-radius: 6px; padding: 10px; text-align: center; background: #fdfdfd; min-height: 140px; display: flex; flex-direction: column; justify-content: space-between; }
    .sig-img { max-height: 55px; max-width: 130px; object-fit: contain; margin: 6px auto; }
    .stamp-img { max-height: 45px; max-width: 75px; object-fit: contain; margin: 4px auto; }
    .role { font-weight: bold; font-size: 11px; color: #000; }
    .name { font-size: 11px; margin-top: 2px; color: #333; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>سامانه امور مالی و ذیحسابی — ${activeModuleDef.title}</h2>
      <p>برگه رسمی تایید کاربران مسئول و امضاکنندگان مجاز بخش ${activeModuleDef.title}</p>
      <div style="font-size: 10px; margin-top: 6px;">تاریخ تنظیم: ${toPersianDigits(new Date().toLocaleDateString("fa-IR"))}</div>
    </div>

    <div class="sig-grid">
      ${currentSigs.map(sig => `
        <div class="sig-box">
          <div class="role">${sig.roleTitle}</div>
          <div class="name">${sig.userName || 'تخصیص نیافته'}</div>
          <div>
            ${sig.signatureImage ? `<img src="${sig.signatureImage}" class="sig-img" alt="امضا"/>` : ''}
            ${sig.stampImage ? `<img src="${sig.stampImage}" class="stamp-img" alt="مهر"/>` : ''}
          </div>
          <div style="font-size: 9px; color: #666; border-top: 1px dashed #ddd; padding-top: 4px;">محل امضا و تایید رسمی</div>
        </div>
      `).join('')}
    </div>

    <div style="margin-top: 30px; font-size: 10px; text-align: justify; background: #f9f9f9; padding: 10px; border-radius: 4px; border: 1px solid #eee;">
      <strong>تاییدیه ذیحسابی و مدیر مالی:</strong> امضاکنندگان و کاربران مسئول فوق برای درج الکترونیکی در اسناد و گزارشات مالی بخش ${activeModuleDef.title} تعیین و تایید گردیده‌اند. (مدیر سیستم دارای دسترسی کامل بوده اما در چاپ اسناد درج نمی‌شود).
    </div>
  </div>
  <script>window.onload = function() { window.print(); };</script>
</body>
</html>`);
    win.document.close();
  }

  const currentModuleSignaturesList = moduleSignatures[activeModuleKey] || [];

  return (
    <PageShell>
      <PageHeader
        title="تعریف و تخصیص امضاکنندگان و کاربران مسئول (نقش‌های ۶گانه)"
        description="تعریف کاربر و امضای دیجیتال برای نقش‌های مصوب در ۶ بخش: حسابداری عمومی، انبار، اموال، حقوق و دستمزد، اعتبارات جاری و اعتبارات سرمایه‌ای"
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

        {/* قانون اصلی مدیر سیستم */}
        <div className="bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 p-4 rounded-2xl flex items-start gap-3 shadow-sm">
          <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <h4 className="font-extrabold text-amber-900 dark:text-amber-200">
              🛡️ قانون دسترسی فول اکسس و چاپ اسناد برای «مدیر سیستم»
            </h4>
            <p className="text-amber-800 dark:text-amber-300 leading-relaxed font-medium">
              کاربر با نقش <strong>«مدیر سیستم»</strong> دارای دسترسی کامل و غیرقابل محدودیت (Full Access) به تمام بخش‌های نرم‌افزار است.
              اما بنا بر قوانین حسابداری عمومی و نظارتی، <strong>نام مدیر سیستم در خروجی چاپی اسناد درج نمی‌شود</strong> مگر آنکه صراحتاً در فرم زیر برای یک نقش مشخص (مانند ذیحساب یا تنظیم حساب) انتخاب شده باشد.
            </p>
          </div>
        </div>

        {/* تب‌های ۶ ماژول اصلی سیستم */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto bg-slate-100/80 dark:bg-slate-900 p-1.5 rounded-2xl gap-1">
          {SYSTEM_MODULES.map(m => {
            const IconComponent = ICON_MAP[m.icon] || Layers;
            const isActiveTab = activeModuleKey === m.key;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => setActiveModuleKey(m.key)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer",
                  isActiveTab
                    ? "bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 shadow-sm border border-slate-200 dark:border-slate-700"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50"
                )}
              >
                <IconComponent className="h-4 w-4" />
                <span>{m.title}</span>
              </button>
            );
          })}
        </div>

        {/* هدر ماژول فعال */}
        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <FileSignature className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                تنظیم امضاکنندگان: {activeModuleDef.title}
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">
                  تعداد نقش‌های تعریف‌شده: {activeModuleDef.roles.length}
                </Badge>
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                تخصیص کاربر و اسکن امضا برای نقش‌های مصوب در خروجی چاپی اسناد این ماژول
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintModuleSheet}
              className="h-9 text-xs gap-1.5 border-blue-300 text-blue-700 hover:bg-blue-50 font-bold"
            >
              <Printer className="h-4 w-4" /> چاپ برگه تایید امضاها
            </Button>
          </div>
        </div>

        {/* فرم تخصیص کاربر و اسکن امضا */}
        <Card className="border-slate-200/80 dark:border-slate-800 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                {editingRoleId ? "ویرایش امضا و کاربر نقش منتخب" : "تخصیص کاربر و اسکن امضا برای نقش‌های مصوب ماژول"}
              </h4>
            </div>

            {editingRoleId && (
              <Button variant="ghost" size="sm" onClick={resetForm} className="h-7 text-xs text-rose-600 gap-1">
                <X className="h-3.5 w-3.5" /> انصراف از ویرایش
              </Button>
            )}
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleSaveRoleSignature} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* انتخاب نقش در این ماژول */}
                <div>
                  <Label className="text-xs font-semibold">انتخاب نقش مصوب ماژول *</Label>
                  <select
                    value={userRoleTitle}
                    onChange={e => {
                      setUserRoleTitle(e.target.value);
                      const foundRole = activeModuleDef.roles.find(r => r.title === e.target.value);
                      if (foundRole) {
                        setEditingRoleId(foundRole.id);
                        setSlot(String(foundRole.defaultSlot || 1));
                      }
                    }}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm mt-1.5 font-bold"
                  >
                    <option value="">-- انتخاب نقش مورد نظر --</option>
                    {activeModuleDef.roles.map(r => (
                      <option key={r.id} value={r.title}>
                        {r.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* انتخاب کاربر از سیستم */}
                <div>
                  <Label className="text-xs font-semibold">انتخاب کاربر از لیست کاربران سیستم *</Label>
                  <select
                    value={selectedUserId}
                    onChange={e => handleSelectUser(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm mt-1.5 font-bold"
                  >
                    <option value="">-- ورود دستی نام یا انتخاب از لیست --</option>
                    {usersList.map(u => {
                      const fName = `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username;
                      const isAdmin = u.role === "admin" || u.role === "مدیر سیستم";
                      return (
                        <option key={u._id || u.id} value={u._id || u.id}>
                          {fName} ({u.username}) {isAdmin ? "⚡ مدیر سیستم" : `— ${u.role || ""}`}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* نام و نام خانوادگی امضاکننده */}
                <div>
                  <Label className="text-xs font-semibold">نام و نام خانوادگی کامل امضاکننده *</Label>
                  <Input
                    value={userName}
                    onChange={e => setUserName(e.target.value)}
                    className="h-9 text-xs mt-1.5 font-bold"
                    placeholder="مثال: دکتر محمدعلی رضایی"
                  />
                </div>
              </div>

              {/* موقعیت امضا در خروجی چاپی */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold">موقعیت و ردیف امضا در ذیل اسناد چاپی</Label>
                  <select
                    value={slot}
                    onChange={e => setSlot(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm mt-1.5 font-semibold"
                  >
                    <option value="1">امضاء راست (تنظیم‌کننده / کارشناس)</option>
                    <option value="2">امضاء مرکز (رئیس امور مالی)</option>
                    <option value="3">امضاء چپ (مدیر مالی / ذیحساب / رئیس دستگاه)</option>
                  </select>
                </div>

                <div className="flex items-center pt-6 gap-3">
                  <input
                    type="checkbox"
                    id="isActiveModuleSig"
                    checked={isActive}
                    onChange={e => setIsActive(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600"
                  />
                  <label htmlFor="isActiveModuleSig" className="text-xs text-slate-700 dark:text-slate-300 font-bold cursor-pointer">
                    فعال بودن این نقش جهت درج خودکار در خروجی‌های چاپی اسناد این ماژول
                  </label>
                </div>
              </div>

              {/* آپلود اسکن امضا و مهر */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/60 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                {/* ۱. امضا */}
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <ImageIcon className="h-4 w-4 text-blue-600" />
                    آپلود تصویر اسکن شده امضای کاربر
                  </Label>
                  <div className="flex items-center gap-3">
                    <input
                      ref={sigFileRef}
                      type="file"
                      accept="image/png, image/jpeg, image/webp, image/svg+xml"
                      onChange={handleSignatureUpload}
                      className="hidden"
                      id="uploadSigModuleInput"
                    />
                    <label
                      htmlFor="uploadSigModuleInput"
                      className="h-9 px-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm"
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

                  {signatureImage ? (
                    <div className="mt-2 p-3 bg-white dark:bg-slate-950 border rounded-xl text-center">
                      <img src={signatureImage} alt="امضا" className="max-h-20 max-w-full mx-auto object-contain" />
                    </div>
                  ) : (
                    <div className="mt-2 h-16 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-[11px] text-slate-400">
                      تصویر امضایی انتخاب نشده است
                    </div>
                  )}
                </div>

                {/* ۲. مهر رسمی */}
                <div className="space-y-3 border-r-0 md:border-r border-slate-200 dark:border-slate-800 md:pr-6">
                  <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-emerald-600" />
                    آپلود اسکن مهر رسمی (اختیاری)
                  </Label>
                  <div className="flex items-center gap-3">
                    <input
                      ref={stampFileRef}
                      type="file"
                      accept="image/png, image/jpeg, image/webp, image/svg+xml"
                      onChange={handleStampUpload}
                      className="hidden"
                      id="uploadStampModuleInput"
                    />
                    <label
                      htmlFor="uploadStampModuleInput"
                      className="h-9 px-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm"
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

                  {stampImage ? (
                    <div className="mt-2 p-3 bg-white dark:bg-slate-950 border rounded-xl text-center">
                      <img src={stampImage} alt="مهر" className="max-h-20 max-w-full mx-auto object-contain" />
                    </div>
                  ) : (
                    <div className="mt-2 h-16 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-[11px] text-slate-400">
                      تصویر مهری انتخاب نشده است
                    </div>
                  )}
                </div>
              </div>

              {/* دکمه ثبت */}
              <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 text-xs gap-1.5 px-6 shadow-md"
                >
                  <Save className="h-4 w-4" />
                  ذخیره و تخصیص کاربر برای نقش در {activeModuleDef.title}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* جدول کاربران و نقش‌های تخصیص داده شده در این ماژول */}
        <Card className="border-slate-200/80 dark:border-slate-800 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-blue-600" />
              جدول وضعیت تخصیص نقش‌های مصوب ماژول: {activeModuleDef.title}
            </h4>
          </CardHeader>

          <CardContent className="pt-4">
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                  <tr>
                    <th className="p-3">عنوان نقش مصوب</th>
                    <th className="p-3">کاربر تخصیص یافته</th>
                    <th className="p-3">موقعیت امضا</th>
                    <th className="p-3 text-center">تصویر اسکن امضا</th>
                    <th className="p-3 text-center">تصویر مهر</th>
                    <th className="p-3 text-center">وضعیت</th>
                    <th className="p-3 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {activeModuleDef.roles.map(r => {
                    const assigned = currentModuleSignaturesList.find(s => s.roleTitle === r.title || s.roleId === r.id);
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-extrabold text-blue-900 dark:text-blue-200">
                          {r.title}
                        </td>
                        <td className="p-3 text-slate-900 dark:text-slate-100 font-bold">
                          {assigned?.userName ? (
                            <span className="flex items-center gap-1.5">
                              {assigned.userName}
                              {assigned.isSystemAdmin && (
                                <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[9px]">
                                  مدیر سیستم
                                </Badge>
                              )}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">هنوز کاربر تخصیص داده نشده</span>
                          )}
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="bg-slate-50 text-slate-700 text-[10px]">
                            {assigned?.slot === 1 ? "راست (امضا ۱)" : assigned?.slot === 2 ? "مرکز (امضا ۲)" : "چپ (امضا ۳)"}
                          </Badge>
                        </td>
                        <td className="p-3 text-center">
                          {assigned?.signatureImage ? (
                            <img src={assigned.signatureImage} alt="امضا" className="h-9 max-w-[110px] object-contain mx-auto border rounded p-0.5 bg-white" />
                          ) : (
                            <span className="text-slate-400 text-[10px]">بدون امضا</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {assigned?.stampImage ? (
                            <img src={assigned.stampImage} alt="مهر" className="h-9 max-w-[70px] object-contain mx-auto border rounded p-0.5 bg-white" />
                          ) : (
                            <span className="text-slate-400 text-[10px]">بدون مهر</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <Badge className={assigned?.isActive !== false ? "bg-emerald-100 text-emerald-800 border-none" : "bg-slate-100 text-slate-600 border-none"}>
                            {assigned?.isActive !== false ? "فعال" : "غیرفعال"}
                          </Badge>
                        </td>
                        <td className="p-3 text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditRoleSignature(assigned || { roleId: r.id, roleTitle: r.title, slot: r.defaultSlot })}
                            className="h-7 px-2.5 text-blue-600 hover:bg-blue-50 text-[11px] font-bold gap-1"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            {assigned ? "ویرایش" : "تخصیص کاربر"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
