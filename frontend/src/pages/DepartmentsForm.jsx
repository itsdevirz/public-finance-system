import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2, Save, Trash2, Edit3, KeyRound, ShieldAlert,
  CheckCircle2, ArrowRightLeft, Lock, Unlock, AlertCircle,
  Eye, EyeOff, Plus, Landmark, Phone, MapPin, User, FileText, Check,
  LogOut
} from "lucide-react";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { useAuth } from "@/context/AuthContext";
import { useDepartment } from "@/context/DepartmentContext";
import api from "@/api";
import { cn } from "@/lib/utils";

function Field({ label, required, children, className = "" }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label className="text-xs font-semibold text-foreground/80 text-right">
        {label}
        {required && <span className="text-destructive mr-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

export default function DepartmentsForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    departments,
    selectedDepartmentId,
    setSelectedDepartmentId,
    refreshDepartments,
    loading: contextLoading
  } = useDepartment();

  // وضعیت باز شدن قفل با پسورد ایستا
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [staticPasswordInput, setStaticPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // پاک‌سازی قفل هنگام خروج از صفحه جهت الزام به وارد کردن پسورد در ورود بعدی
  useEffect(() => {
    return () => {
      sessionStorage.removeItem("dept_access_unlocked");
    };
  }, []);

  const handleLockAndExit = () => {
    sessionStorage.removeItem("dept_access_unlocked");
    setIsUnlocked(false);
    setStaticPasswordInput("");
    setAuthError("");
    handleNew();
  };

  // فرم تغییر رمز عبور ایستا
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changePasswordError, setChangePasswordError] = useState("");
  const [changePasswordSuccess, setChangePasswordSuccess] = useState("");
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);

  // فرم تعریف اداره
  const [selectedId, setSelectedId] = useState(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [managerName, setManagerName] = useState("");
  const [phone, setPhone] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [economicCode, setEconomicCode] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState("");
  const [search, setSearch] = useState("");

  const handleVerifyPassword = async (e) => {
    if (e) e.preventDefault();
    if (!staticPasswordInput.trim()) {
      setAuthError("لطفاً رمز عبور را وارد فرمایید.");
      return;
    }
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await api.post("/api/departments/verify-password", {
        password: staticPasswordInput.trim(),
      });
      if (res.data?.success) {
        setIsUnlocked(true);
        sessionStorage.setItem("dept_access_unlocked", "true");
        setAuthError("");
      } else {
        setAuthError(res.data?.message || "رمز عبور نادرست است.");
      }
    } catch (err) {
      setAuthError(err.response?.data?.message || "رمز عبور وارد شده نادرست است.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    if (e) e.preventDefault();
    setChangePasswordError("");
    setChangePasswordSuccess("");

    if (!currentPassword) {
      setChangePasswordError("لطفاً رمز عبور فعلی را وارد فرمایید.");
      return;
    }
    if (!newPassword || newPassword.length < 4) {
      setChangePasswordError("رمز عبور جدید باید حداقل ۴ کاراکتر باشد.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setChangePasswordError("رمز عبور جدید با تکرار آن یکسان نیست.");
      return;
    }

    setChangePasswordLoading(true);
    try {
      const res = await api.post("/api/departments/change-password", {
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
      });
      if (res.data?.success) {
        setChangePasswordSuccess("رمز عبور با موفقیت به‌روزرسانی شد.");
        setTimeout(() => {
          setShowChangePasswordModal(false);
          setCurrentPassword("");
          setNewPassword("");
          setConfirmNewPassword("");
          setChangePasswordSuccess("");
        }, 1500);
      }
    } catch (err) {
      setChangePasswordError(err.response?.data?.message || "خطا در تغییر رمز عبور.");
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const handleNew = () => {
    setSelectedId(null);
    setCode("");
    setName("");
    setManagerName("");
    setPhone("");
    setNationalId("");
    setEconomicCode("");
    setPostalCode("");
    setAddress("");
    setDescription("");
    setIsDefault(false);
    setIsActive(true);
    setSavedNotice("");
  };

  const handleRowClick = (item) => {
    setSelectedId(item._id);
    setCode(item.code || "");
    setName(item.name || "");
    setManagerName(item.managerName || "");
    setPhone(item.phone || "");
    setNationalId(item.nationalId || "");
    setEconomicCode(item.economicCode || "");
    setPostalCode(item.postalCode || "");
    setAddress(item.address || "");
    setDescription(item.description || "");
    setIsDefault(Boolean(item.isDefault));
    setIsActive(item.isActive !== false);
    setSavedNotice("");
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!code.trim() || !name.trim()) {
      alert("لطفاً کد و نام اداره را وارد فرمایید.");
      return;
    }

    setSaving(true);
    setSavedNotice("");
    const payload = {
      code: code.trim(),
      name: name.trim(),
      managerName: managerName.trim(),
      phone: phone.trim(),
      nationalId: nationalId.trim(),
      economicCode: economicCode.trim(),
      postalCode: postalCode.trim(),
      address: address.trim(),
      description: description.trim(),
      isDefault,
      isActive,
    };

    try {
      if (selectedId) {
        const res = await api.put(`/api/departments/${selectedId}`, payload);
        if (res.data?.success) {
          setSavedNotice("اطلاعات اداره با موفقیت ویرایش شد.");
          await refreshDepartments();
          setTimeout(() => setSavedNotice(""), 3500);
        }
      } else {
        const res = await api.post("/api/departments", payload);
        if (res.data?.success) {
          setSavedNotice("اداره جدید با موفقیت ایجاد گردید.");
          handleNew();
          await refreshDepartments();
          setTimeout(() => setSavedNotice(""), 3500);
        }
      }
    } catch (err) {
      console.error("Error saving department:", err);
      alert(err.response?.data?.message || "خطا در ذخیره‌سازی اطلاعات اداره");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm("آیا از حذف این اداره اطمینان دارید؟ کلیه اطلاعات و انتساب‌ها بررسی خواهد شد.")) return;

    try {
      const res = await api.delete(`/api/departments/${id}`);
      if (res.data?.success) {
        if (selectedId === id) handleNew();
        await refreshDepartments();
      }
    } catch (err) {
      console.error("Error deleting department:", err);
      alert(err.response?.data?.message || "خطا در حذف اداره");
    }
  };

  const handleSwitchDepartment = (dept, e) => {
    if (e) e.stopPropagation();
    const targetId = String(dept._id || dept.code);
    setSelectedDepartmentId(targetId);
  };

  const filteredList = useMemo(() => {
    if (!departments) return [];
    if (!search.trim()) return departments;
    const q = search.trim().toLowerCase();
    return departments.filter(
      (d) =>
        (d.name && d.name.toLowerCase().includes(q)) ||
        (d.code && d.code.toLowerCase().includes(q)) ||
        (d.managerName && d.managerName.toLowerCase().includes(q))
    );
  }, [departments, search]);

  // ─── صفحه قفل پسورد ایستا ────────────────────────────────────────────────────
  if (!isUnlocked) {
    return (
      <PageShell>
        <div className="flex min-h-[75vh] items-center justify-center p-4" dir="rtl">
          <Card className="w-full max-w-md shadow-2xl border-border bg-card/95 backdrop-blur-md rounded-3xl overflow-hidden">
            <div className="bg-gradient-to-l from-slate-900 via-teal-950 to-emerald-950 p-6 text-white text-center relative">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 mb-3 shadow-inner">
                <Lock className="h-8 w-8 animate-pulse" />
              </div>
              <h2 className="text-xl font-black">تعریف سازمان / اداره</h2>
              <p className="text-xs text-slate-300 mt-1">ورود نیازمند رمز عبور ایستای امنیتی است</p>
            </div>

            <CardContent className="p-6">
              <form onSubmit={handleVerifyPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-foreground">رمز عبور ایستای بخش تعاریف:</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={staticPasswordInput}
                      onChange={(e) => setStaticPasswordInput(e.target.value)}
                      placeholder="رمز عبور ایستا را وارد کنید..."
                      className="text-left font-mono tracking-widest pl-10 pr-3 py-2 text-sm rounded-xl"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                    جهت دسترسی به این بخش، رمز عبور امنیتی ایستا را وارد فرمایید.
                  </p>
                </div>

                {authError && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-semibold border border-destructive/20 animate-in fade-in">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                <div className="space-y-2 pt-1">
                  <Button
                    type="submit"
                    disabled={authLoading}
                    className="w-full gap-2 rounded-xl font-bold py-2.5 shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {authLoading ? (
                      <span>در حال بررسی رمز...</span>
                    ) : (
                      <>
                        <Unlock className="h-4 w-4" />
                        <span>تأیید و ورود به بخش تعریف اداره</span>
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => navigate("/")}
                    className="w-full text-xs text-muted-foreground hover:text-foreground rounded-xl"
                  >
                    انصراف و بازگشت به داشبورد
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </PageShell>
    );
  }

  // ─── صفحه اصلی تعریف اداره (پس از بازگشایی قفل) ──────────────────────────────
  const activeDeptObj = departments.find(d => String(d._id) === String(selectedDepartmentId) || String(d.code) === String(selectedDepartmentId));

  return (
    <PageShell>
      <div className="space-y-6" dir="rtl">
        {/* هدر صفحه */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/60 backdrop-blur-md p-5 rounded-2xl border shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-sm">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-foreground flex items-center gap-2">
                تعریف سازمان / اداره
                <Badge variant="outline" className="text-xs font-bold bg-primary/5 text-primary border-primary/20">
                  {departments.length} اداره تعریف‌شده
                </Badge>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                تعریف، ویرایش و تفکیک سازمان‌ها و ادارات تابعه جهت چنداداره‌ای بودن اسناد و تنظیمات
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {activeDeptObj && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                <Landmark className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>اداره فعال در سامانه: {activeDeptObj.name} ({activeDeptObj.code})</span>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowChangePasswordModal(true)}
              className="gap-2 rounded-xl text-xs font-bold border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>تغییر رمز ایستای این بخش</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLockAndExit}
              className="gap-2 rounded-xl text-xs font-bold border-rose-500/40 text-rose-700 dark:text-rose-300 hover:bg-rose-500/10 bg-rose-50/50 dark:bg-rose-950/20 shadow-xs"
              title="خروج و قفل مجدد این بخش جهت الزام به وارد کردن پسورد در ورود بعدی"
            >
              <LogOut className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
              <span>خروج و قفل بخش</span>
            </Button>
          </div>
        </div>

        {/* فرم ثبت / ویرایش اداره */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-5 border shadow-md bg-card">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                <span>{selectedId ? "ویرایش مشخصات سازمان / اداره" : "ثبت سازمان / اداره جدید"}</span>
                {selectedId && (
                  <Button variant="ghost" size="xs" onClick={handleNew} className="text-xs gap-1 text-muted-foreground hover:text-foreground">
                    <Plus className="h-3.5 w-3.5" /> فرم جدید
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="کد / شناسه اداره" required>
                    <Input
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="مثلاً: 01 یا 101"
                      className="font-mono text-center font-bold text-xs rounded-xl"
                      required
                    />
                  </Field>
                  <Field label="نام سازمان / اداره" required>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="مثلاً: اداره کل امور مالیاتی"
                      className="text-xs rounded-xl font-bold"
                      required
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="نام مدیر / رئیس اداره">
                    <Input
                      value={managerName}
                      onChange={(e) => setManagerName(e.target.value)}
                      placeholder="نام رئیس یا مسئول"
                      className="text-xs rounded-xl"
                    />
                  </Field>
                  <Field label="شماره تلفن / فکس">
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="شماره تماس اداره"
                      className="text-xs rounded-xl font-mono text-left"
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="شناسه ملی سازمان">
                    <Input
                      value={nationalId}
                      onChange={(e) => setNationalId(e.target.value)}
                      placeholder="شناسه ملی ۱۱ رقمی"
                      className="text-xs rounded-xl font-mono text-left"
                    />
                  </Field>
                  <Field label="کد اقتصادی">
                    <Input
                      value={economicCode}
                      onChange={(e) => setEconomicCode(e.target.value)}
                      placeholder="کد اقتصادی سازمان"
                      className="text-xs rounded-xl font-mono text-left"
                    />
                  </Field>
                </div>

                <Field label="نشانی و آدرس اداره">
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="استان، شهر، خیابان، پلاک..."
                    className="text-xs rounded-xl"
                  />
                </Field>

                <Field label="توضیحات تکمیلی">
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="یادداشت یا توضیحات..."
                    className="text-xs rounded-xl"
                  />
                </Field>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-muted/40 border">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                    <input
                      type="checkbox"
                      checked={isDefault}
                      onChange={(e) => setIsDefault(e.target.checked)}
                      className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                    />
                    <span>تنظیم به عنوان اداره اصلی و پیش‌فرض</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                    />
                    <span>وضعیت اداره فعال است</span>
                  </label>
                </div>

                {savedNotice && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-500/20 animate-in fade-in">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{savedNotice}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="flex-1 gap-2 rounded-xl text-xs font-bold shadow-md"
                  >
                    <Save className="h-4 w-4" />
                    <span>{saving ? "در حال ذخیره..." : selectedId ? "به‌روزرسانی اداره" : "ثبت و ایجاد اداره"}</span>
                  </Button>

                  {selectedId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleNew}
                      className="rounded-xl text-xs font-bold"
                    >
                      انصراف
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* لیست ادارات تعریف‌شده */}
          <Card className="lg:col-span-7 border shadow-md bg-card">
            <CardHeader className="pb-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-bold">فهرست سازمان‌ها و ادارات</CardTitle>
                <CardDescription className="text-xs">
                  انتخاب یا ویرایش ادارات تعریف‌شده
                </CardDescription>
              </div>
              <div className="w-full sm:w-60">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="جستجو در ادارات..."
                  className="text-xs rounded-xl h-8"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 text-xs">
                      <TableHead className="text-center w-14">کد</TableHead>
                      <TableHead className="text-right">نام سازمان / اداره</TableHead>
                      <TableHead className="text-right">مدیر / مسئول</TableHead>
                      <TableHead className="text-center">وضعیت</TableHead>
                      <TableHead className="text-center w-36">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredList.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-xs text-muted-foreground">
                          هیچ اداره‌ای یافت نشد.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredList.map((dept) => {
                        const isCurrentActive = String(dept._id) === String(selectedDepartmentId) || String(dept.code) === String(selectedDepartmentId);
                        const isSelectedRow = selectedId === dept._id;

                        return (
                          <TableRow
                            key={dept._id || dept.code}
                            onClick={() => handleRowClick(dept)}
                            className={cn(
                              "cursor-pointer text-xs hover:bg-muted/50 transition-colors",
                              isSelectedRow && "bg-primary/10",
                              isCurrentActive && "font-bold"
                            )}
                          >
                            <TableCell className="text-center font-mono font-bold">
                              {dept.code}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-foreground">{dept.name}</span>
                                {dept.address && (
                                  <span className="text-[10px] text-muted-foreground truncate max-w-xs">{dept.address}</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {dept.managerName || "—"}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex flex-col items-center gap-1">
                                {dept.isDefault && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                    پیش‌فرض
                                  </span>
                                )}
                                {isCurrentActive && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                    اداره فعال
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-1">
                                {!isCurrentActive && (
                                  <Button
                                    variant="outline"
                                    size="xs"
                                    onClick={(e) => handleSwitchDepartment(dept, e)}
                                    title="سوییچ به این اداره"
                                    className="h-7 px-2 text-[11px] font-bold rounded-lg border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 gap-1"
                                  >
                                    <ArrowRightLeft className="h-3 w-3" />
                                    <span>سوییچ</span>
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  onClick={() => handleRowClick(dept)}
                                  title="ویرایش"
                                  className="h-7 w-7 p-0 rounded-lg text-primary hover:bg-primary/10"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  onClick={(e) => handleDelete(dept._id, e)}
                                  disabled={dept.isDefault || filteredList.length <= 1}
                                  title="حذف"
                                  className="h-7 w-7 p-0 rounded-lg text-destructive hover:bg-destructive/10 disabled:opacity-30"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* مدال تغییر پسورد ایستا */}
        <Modal
          isOpen={showChangePasswordModal}
          onClose={() => setShowChangePasswordModal(false)}
          title="تغییر رمز عبور ایستای تعریف سازمان/اداره"
          className="max-w-md"
        >
          <form onSubmit={handleChangePassword} className="space-y-4 pt-2" dir="rtl">
            <p className="text-xs text-muted-foreground leading-relaxed">
              با تغییر این رمز، از این پس برای ورود به بخش «تعریف سازمان/اداره» رمز جدید درخواست خواهد شد.
            </p>

            <Field label="رمز عبور فعلی" required>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="رمز عبور فعلی را وارد کنید..."
                className="text-left font-mono rounded-xl text-xs"
                required
              />
            </Field>

            <Field label="رمز عبور جدید" required>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="رمز عبور جدید (حداقل ۴ کاراکتر)..."
                className="text-left font-mono rounded-xl text-xs"
                required
              />
            </Field>

            <Field label="تکرار رمز عبور جدید" required>
              <Input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="تکرار رمز جدید..."
                className="text-left font-mono rounded-xl text-xs"
                required
              />
            </Field>

            {changePasswordError && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-destructive/10 text-destructive text-xs font-semibold border border-destructive/20">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{changePasswordError}</span>
              </div>
            )}

            {changePasswordSuccess && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-500/20">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{changePasswordSuccess}</span>
              </div>
            )}

            <ModalFooter className="gap-2 pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowChangePasswordModal(false)}
                className="rounded-xl text-xs"
              >
                انصراف
              </Button>
              <Button
                type="submit"
                disabled={changePasswordLoading}
                className="rounded-xl text-xs font-bold gap-2"
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span>{changePasswordLoading ? "در حال ذخیره..." : "ذخیره رمز جدید"}</span>
              </Button>
            </ModalFooter>
          </form>
        </Modal>
      </div>
    </PageShell>
  );
}
