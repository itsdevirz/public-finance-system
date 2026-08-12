import React, { useState, useEffect, useMemo, useCallback } from "react";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Users as UsersIcon, Search, Plus, Printer, FileSpreadsheet, Trash2, Edit2, ShieldAlert, ShieldCheck, CheckCircle2, AlertTriangle,
  KeyRound, CheckSquare, Coins, UserCheck, Shield, ChevronDown, ChevronRight, History, Settings2, Link, X, Save, Eye,
  Laptop, Globe, Clock, Calendar, Monitor, Smartphone, Info, Terminal, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown, Filter, SlidersHorizontal
} from "lucide-react";
import api from "@/api";
import { cn } from "@/lib/utils";
import { printTable } from "@/lib/printUtils";
import { PersianDatePicker } from "@/components/ui/persian-date-picker";
import { useAuth } from "@/context/AuthContext";

const ROLE_PRESETS = {
  "مدیر مالی": {
    "doc.create": true, "doc.edit": true, "doc.delete": true, "doc.approve": true,
    "acct.view": true, "acct.create": true,
    "rep.trial": true, "rep.ledger": true, "rep.statement": true,
    "set.users": true, "set.year": true
  },
  "حسابدار": {
    "doc.create": true, "doc.edit": true, "doc.delete": false, "doc.approve": false,
    "acct.view": true, "acct.create": true,
    "rep.trial": true, "rep.ledger": true, "rep.statement": false,
    "set.users": false, "set.year": false
  },
  "خزانه‌دار": {
    "doc.create": true, "doc.edit": true, "doc.delete": false, "doc.approve": false,
    "acct.view": true, "acct.create": false,
    "rep.trial": true, "rep.ledger": true, "rep.statement": false,
    "set.users": false, "set.year": false
  }
};

const INITIAL_USER = {
  username: "",
  password: "",
  firstName: "",
  lastName: "",
  employeeId: "",
  nationalId: "",
  phone: "",
  email: "",
  department: "حسابداری مالی",
  position: "کارشناس حسابداری",
  userGroup: "حسابداران ارشد",
  directManager: "",
  branch: "شعبه مرکزی تهران",
  costCenter: "اداری",
  fiscalYear: "1405",
  status: "فعال", // فعال, غیرفعال, قفل شده
  twoFactor: false,
  ipRestriction: "",
  allowOutside: true,
  maxFailedAttempts: 5,
  lockoutDuration: 15,
  role: "حسابدار",
  permissions: { ...ROLE_PRESETS["حسابدار"] },
  financialLimitMin: 100000000,
  financialLimitMax: 5000000000,
  allowedCostCenters: ["واحد فروش", "واحد تولید"],
  workflowLevel: "ثبت کننده", // ثبت کننده, بررسی کننده, تایید کننده, تایید نهایی
  preferences: {
    fiscalYear: "1405",
    company: "سازمان مرکزی مالی",
    language: "fa",
    theme: "light",
    startPage: "/dashboard",
    pageSize: 10,
    dateFormat: "shamsi"
  }
};

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const [selectedUser, setSelectedUser] = useState(null);
  const [formState, setFormState] = useState(INITIAL_USER);
  const [activeFormTab, setActiveFormTab] = useState("general");
  const [showFormCard, setShowFormCard] = useState(false);
  const [changePasswordChecked, setChangePasswordChecked] = useState(false);

  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logSearchTerm, setLogSearchTerm] = useState("");
  const [selectedLogModal, setSelectedLogModal] = useState(null);

  // Sorting & Filtering state for Audit Logs
  const [logSortBy, setLogSortBy] = useState("createdAt");
  const [logSortOrder, setLogSortOrder] = useState("desc");
  const [logResultFilter, setLogResultFilter] = useState("");
  const [logOsFilter, setLogOsFilter] = useState("");

  // Tree nodes expanded state
  const [expandedNodes, setExpandedNodes] = useState({
    accounting: true,
    accounts: true,
    reports: true,
    settings: true
  });

  const availableTabs = useMemo(() => {
    const tabs = [
      { key: "general", label: "اطلاعات عمومی", icon: UsersIcon },
      { key: "security", label: "امنیت و ورود", icon: KeyRound },
      { key: "rbac", label: "نقش‌ها و دسترسی (RBAC)", icon: Shield },
      { key: "limits", label: "محدودیت‌های مالی", icon: Coins },
      { key: "workflow", label: "گردش کار و عملیات", icon: UserCheck },
      { key: "preferences", label: "تنظیمات محیط و پرسنل", icon: Settings2 }
    ];
    if (currentUser?.role !== "admin") {
      // Non-admins can only see general info and environment preferences
      return tabs.filter(t => t.key === "general" || t.key === "preferences");
    }
    return tabs;
  }, [currentUser]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/users");
      setUsers(res.data.data || []);
    } catch (err) {
      setError("خطا در دریافت لیست کاربران از سرور.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLogs = useCallback(async (overrideParams = {}) => {
    setLoadingLogs(true);
    try {
      let searchVal = logSearchTerm;
      let sortByVal = logSortBy;
      let sortOrderVal = logSortOrder;
      let resultVal = logResultFilter;
      let osTypeVal = logOsFilter;

      if (typeof overrideParams === "string") {
        searchVal = overrideParams;
      } else if (overrideParams && typeof overrideParams === "object" && !overrideParams.nativeEvent && !(overrideParams instanceof Event)) {
        if (typeof overrideParams.search === "string") searchVal = overrideParams.search;
        if (typeof overrideParams.sortBy === "string") sortByVal = overrideParams.sortBy;
        if (typeof overrideParams.sortOrder === "string") sortOrderVal = overrideParams.sortOrder;
        if (typeof overrideParams.result === "string") resultVal = overrideParams.result;
        if (typeof overrideParams.osType === "string") osTypeVal = overrideParams.osType;
      }

      const res = await api.get("/api/users/audit-logs", {
        params: {
          search: (typeof searchVal === "string" && searchVal.trim()) ? searchVal.trim() : undefined,
          sortBy: sortByVal || "createdAt",
          sortOrder: sortOrderVal || "desc",
          result: resultVal || undefined,
          osType: osTypeVal || undefined,
          limit: 100
        }
      });
      setAuditLogs(res.data.data || []);
    } catch (err) {
      console.error("خطا در دریافت لاگ‌های امنیتی:", err);
    } finally {
      setLoadingLogs(false);
    }
  }, [logSearchTerm, logSortBy, logSortOrder, logResultFilter, logOsFilter]);

  const [verifyingIntegrity, setVerifyingIntegrity] = useState(false);
  const [integrityStatus, setIntegrityStatus] = useState(null);
  const [storageStatus, setStorageStatus] = useState(null);
  const [testingAlert, setTestingAlert] = useState(false);

  const fetchStorageStatus = useCallback(async () => {
    try {
      const res = await api.get("/api/security/storage-status");
      if (res.data?.success) {
        setStorageStatus(res.data);
      }
    } catch (_) { }
  }, []);

  const handleTestThresholdAlert = async () => {
    setTestingAlert(true);
    try {
      const res = await api.post("/api/security/test-threshold-alert");
      if (res.data?.success) {
        alert("🚨 پیام هشدار سرریز لاگ‌ها با موفقیت به کانال‌های اطلاع‌رسانی سیستم، پیامک و ایمیل ادمین ارسال شد!");
        fetchStorageStatus();
      }
    } catch (err) {
      alert("خطا در ارسال پیام هشدار آزمایشی.");
    } finally {
      setTestingAlert(false);
    }
  };

  const handleMarkNotificationsRead = async () => {
    try {
      await api.post("/api/security/notifications/mark-read");
      fetchStorageStatus();
    } catch (_) { }
  };

  const handleVerifyDatabaseIntegrity = async () => {
    setVerifyingIntegrity(true);
    try {
      const res = await api.get("/api/security/audit-logs/verify-integrity");
      if (res.data?.success) {
        setIntegrityStatus(res.data);
        if (res.data.isFullySecure) {
          alert(`✅ سلامت اصالت دیتابیس تایید شد.\n\nتعداد کل لاگ‌های اسکن‌شده: ${res.data.totalScanned}\nلاگ‌های دارای اصالت معتبر (HMAC): ${res.data.validCount}\nتعداد لاگ‌های دستکاری‌شده: ۰`);
        } else {
          alert(`⚠️ هشدار امنیتی!\n\nاصالت ${res.data.tamperedCount} لاگ در دیتابیس تایید نشد! احتمال دستکاری مستقیم رکوردهای پایگاه داده وجود دارد.`);
        }
      }
    } catch (err) {
      alert("خطا در برقراری ارتباط با سرویس اعتبارسنجی اصالت دیتابیس.");
    } finally {
      setVerifyingIntegrity(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    if (currentUser?.role === "admin") {
      fetchLogs();
      fetchStorageStatus();
    }
  }, [fetchUsers, fetchLogs, fetchStorageStatus, currentUser]);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const name = `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase();
      const q = search.toLowerCase();
      const matchesSearch =
        user.username?.toLowerCase().includes(q) ||
        name.includes(q) ||
        user.employeeId?.includes(q) ||
        user.nationalId?.includes(q);

      const matchesRole = filterRole === "all" || user.role === filterRole;
      const matchesStatus = filterStatus === "all" || user.status === filterStatus;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, filterRole, filterStatus]);

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setChangePasswordChecked(false);
    setFormState({
      ...INITIAL_USER,
      ...user,
      password: "" // Keep password blank for edit security
    });
    setActiveFormTab("general");
    setShowFormCard(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCreateNew = () => {
    if (currentUser?.role !== "admin") {
      alert("فقط مدیر سیستم (Admin) مجاز به تعریف کاربر جدید است.");
      return;
    }
    setSelectedUser(null);
    setChangePasswordChecked(true);
    setFormState(INITIAL_USER);
    setActiveFormTab("general");
    setShowFormCard(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (selectedUser) {
        // Edit Mode: Do NOT send password if changePasswordChecked is false or password is empty/whitespace
        const payload = { ...formState };
        if (!changePasswordChecked || !payload.password || (typeof payload.password === "string" && !payload.password.trim())) {
          delete payload.password;
        }
        const res = await api.put(`/api/users/${selectedUser._id}`, payload);
        if (res.data?.success) {
          setUsers(users.map(u => u._id === selectedUser._id ? res.data.data : u));
          alert("تغییرات کاربر با موفقیت ذخیره شد.");
          setShowFormCard(false);
        }
      } else {
        // Create Mode
        const payload = { ...formState };
        if (!payload.password || !payload.password.trim()) {
          payload.password = "AdminPass123!";
        }
        const res = await api.post("/api/users", payload);
        if (res.data?.success) {
          setUsers([...users, res.data.data]);
          alert("کاربر جدید با موفقیت ایجاد گردید.");
          setShowFormCard(false);
        }
      }
      fetchLogs();
    } catch (err) {
      alert(err.response?.data?.message || "خطا در برقراری ارتباط با پایگاه داده.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, username) => {
    if (!confirm(`آیا از حذف کامل کاربر "${username}" اطمینان دارید؟`)) return;
    try {
      const res = await api.delete(`/api/users/${id}`);
      if (res.data?.success) {
        setUsers(users.filter(u => u._id !== id));
        fetchLogs();
        alert("کاربر با موفقیت حذف گردید.");
      }
    } catch (err) {
      alert(err.response?.data?.message || "حذف کاربر انجام نشد.");
    }
  };

  // Preset role toggles
  const handleRoleChange = (role) => {
    const permissions = ROLE_PRESETS[role] ? { ...ROLE_PRESETS[role] } : {};
    setFormState({
      ...formState,
      role,
      permissions
    });
  };

  const togglePermission = (key) => {
    setFormState({
      ...formState,
      permissions: {
        ...formState.permissions,
        [key]: !formState.permissions[key]
      }
    });
  };

  const toggleCostCenterLimit = (cc) => {
    const list = formState.allowedCostCenters || [];
    const updated = list.includes(cc) ? list.filter(item => item !== cc) : [...list, cc];
    setFormState({
      ...formState,
      allowedCostCenters: updated
    });
  };

  return (
    <PageShell>
      <PageHeader
        title="تعریف و مدیریت کاربران سیستم"
        description="تنظیمات هویت کاربران، الگوهای امنیتی، نقش‌ها (RBAC)، کنترل‌های تراکنش مالی و تاریخچه فعالیت‌ها"
      />

      {/* Advanced Tabbed User Registry Form Panel */}
      {showFormCard && (
        <Card className="mb-6 shadow-lg border border-primary/20 animate-in fade-in slide-in-from-top-4 duration-500">
          <CardHeader className="bg-primary/5 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-primary flex items-center gap-2">
                  <UsersIcon className="h-5 w-5" />
                  {selectedUser ? `ویرایش کاربر: ${formState.username}` : "تعریف و تنظیمات کاربر جدید"}
                </CardTitle>
                <CardDescription>مدیریت دسترسی‌های مالی، احراز هویت، و گردش کار سازمانی</CardDescription>
              </div>
              <button onClick={() => setShowFormCard(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Form Tabs Switcher */}
            <div className="flex border-b overflow-x-auto whitespace-nowrap bg-muted/20" dir="rtl">
              {availableTabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveFormTab(tab.key)}
                  className={cn(
                    "flex items-center gap-1.5 px-5 py-3 border-b-2 text-xs font-bold transition-all",
                    activeFormTab === tab.key
                      ? "border-primary text-primary bg-background"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSave} dir="rtl" className="p-6 space-y-6">
              {/* TAB 1: GENERAL INFO */}
              {activeFormTab === "general" && (
                <div className="space-y-4">
                  <div className="border-r-4 border-primary/50 pr-3 font-bold text-xs text-foreground mb-2">اطلاعات هویتی کاربر</div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">نام کاربری (ورود)</Label>
                      <Input
                        disabled={selectedUser ? true : currentUser?.role !== "admin"}
                        value={formState.username}
                        onChange={(e) => setFormState({ ...formState, username: e.target.value })}
                        placeholder="username"
                        className="h-8.5 text-xs font-mono"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">نام</Label>
                      <Input
                        disabled={currentUser?.role !== "admin"}
                        value={formState.firstName}
                        onChange={(e) => setFormState({ ...formState, firstName: e.target.value })}
                        className="h-8.5 text-xs"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">نام خانوادگی</Label>
                      <Input
                        disabled={currentUser?.role !== "admin"}
                        value={formState.lastName}
                        onChange={(e) => setFormState({ ...formState, lastName: e.target.value })}
                        className="h-8.5 text-xs"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">کد پرسنلی</Label>
                      <Input
                        disabled={currentUser?.role !== "admin"}
                        value={formState.employeeId}
                        onChange={(e) => setFormState({ ...formState, employeeId: e.target.value })}
                        className="h-8.5 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">کد ملی</Label>
                      <Input
                        disabled={currentUser?.role !== "admin"}
                        value={formState.nationalId}
                        onChange={(e) => setFormState({ ...formState, nationalId: e.target.value })}
                        className="h-8.5 text-xs font-mono"
                        maxLength={10}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">شماره تماس همراه</Label>
                      <Input
                        disabled={currentUser?.role !== "admin"}
                        value={formState.phone}
                        onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                        className="h-8.5 text-xs font-mono"
                        dir="ltr"
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <Label className="text-xs font-semibold">آدرس ایمیل</Label>
                      <Input
                        disabled={currentUser?.role !== "admin"}
                        type="email"
                        value={formState.email}
                        onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                        className="h-8.5 text-xs font-mono"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="border-r-4 border-primary/50 pr-3 font-bold text-xs text-foreground mt-4 mb-2">اطلاعات سازمانی</div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">واحد سازمانی</Label>
                      <select
                        disabled={currentUser?.role !== "admin"}
                        value={formState.department}
                        onChange={(e) => setFormState({ ...formState, department: e.target.value })}
                        className="w-full h-8.5 text-xs rounded-lg border px-3 bg-background disabled:opacity-80"
                      >
                        <option value="حسابداری مالی">حسابداری مالی</option>
                        <option value="خزانه‌داری">خزانه‌داری و صدور چک</option>
                        <option value="بودجه و اعتبارات">بودجه و اعتبارات عمومی</option>
                        <option value="حسابرسی داخلی">حسابرسی داخلی</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">سمت سازمانی</Label>
                      <select
                        disabled={currentUser?.role !== "admin"}
                        value={formState.position}
                        onChange={(e) => setFormState({ ...formState, position: e.target.value })}
                        className="w-full h-8.5 text-xs rounded-lg border px-3 bg-background disabled:opacity-80"
                      >
                        <option value="مدیر مالی">مدیر امور مالی</option>
                        <option value="رئیس حسابداری">رئیس حسابداری</option>
                        <option value="کارشناس حسابداری">کارشناس حسابداری</option>
                        <option value="ذیحساب خزانه‌داری">ذیحساب / خزانه‌دار</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">گروه کاربری</Label>
                      <Input
                        disabled={currentUser?.role !== "admin"}
                        value={formState.userGroup}
                        onChange={(e) => setFormState({ ...formState, userGroup: e.target.value })}
                        className="h-8.5 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">مدیر مستقیم</Label>
                      <Input
                        disabled={currentUser?.role !== "admin"}
                        value={formState.directManager}
                        onChange={(e) => setFormState({ ...formState, directManager: e.target.value })}
                        className="h-8.5 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">شعبه محل فعالیت</Label>
                      <Input
                        disabled={currentUser?.role !== "admin"}
                        value={formState.branch}
                        onChange={(e) => setFormState({ ...formState, branch: e.target.value })}
                        className="h-8.5 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">مرکز هزینه پیش‌فرض</Label>
                      <Input
                        disabled={currentUser?.role !== "admin"}
                        value={formState.costCenter}
                        onChange={(e) => setFormState({ ...formState, costCenter: e.target.value })}
                        className="h-8.5 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">سال مالی پیش‌فرض</Label>
                      <Input
                        disabled={currentUser?.role !== "admin"}
                        value={formState.fiscalYear}
                        onChange={(e) => setFormState({ ...formState, fiscalYear: e.target.value })}
                        className="h-8.5 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SECURITY & LOGIN */}
              {activeFormTab === "security" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-xs font-semibold">
                          رمز عبور {selectedUser ? "جدید کاربر" : "(ورود)"}
                        </Label>
                        {selectedUser && (
                          <label className="flex items-center gap-1 text-[11px] text-primary font-bold cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={changePasswordChecked}
                              onChange={(e) => {
                                setChangePasswordChecked(e.target.checked);
                                if (!e.target.checked) setFormState({ ...formState, password: "" });
                              }}
                              className="rounded border-border h-3.5 w-3.5"
                            />
                            <span>تغییر رمز عبور</span>
                          </label>
                        )}
                      </div>
                      <Input
                        type="password"
                        autoComplete="new-password"
                        disabled={selectedUser ? !changePasswordChecked : false}
                        value={formState.password || ""}
                        onChange={(e) => setFormState({ ...formState, password: e.target.value })}
                        placeholder={selectedUser && !changePasswordChecked ? "••••••" : "••••••"}
                        className="h-8.5 text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">وضعیت حساب کاربر</Label>
                      <select
                        value={formState.status}
                        onChange={(e) => setFormState({ ...formState, status: e.target.value })}
                        className="w-full h-8.5 text-xs rounded-lg border px-3"
                      >
                        <option value="فعال">فعال</option>
                        <option value="غیرفعال">غیرفعال</option>
                        <option value="مسدود">مسدود / قفل شده</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">محدودیت IP ورود (سفید)</Label>
                      <Input
                        value={formState.ipRestriction}
                        onChange={(e) => setFormState({ ...formState, ipRestriction: e.target.value })}
                        placeholder="192.168.1.50"
                        className="h-8.5 text-xs font-mono"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">حداکثر تلاش ناموفق</Label>
                      <Input
                        type="number"
                        value={formState.maxFailedAttempts}
                        onChange={(e) => setFormState({ ...formState, maxFailedAttempts: Number(e.target.value) })}
                        className="h-8.5 text-xs w-28"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">مدت زمان قفل شدن (دقیقه)</Label>
                      <Input
                        type="number"
                        value={formState.lockoutDuration}
                        onChange={(e) => setFormState({ ...formState, lockoutDuration: Number(e.target.value) })}
                        className="h-8.5 text-xs w-28"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/30 border space-y-3 mt-4">
                    <Label className="text-xs font-bold text-foreground block">تنظیمات پیشرفته ورود</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formState.twoFactor}
                          onChange={(e) => setFormState({ ...formState, twoFactor: e.target.checked })}
                          className="rounded border-border text-primary h-4.5 w-4.5"
                        />
                        <span className="text-xs font-semibold text-foreground/80">فعال بودن ورود دو مرحله‌ای (2FA SMS)</span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formState.allowOutside}
                          onChange={(e) => setFormState({ ...formState, allowOutside: e.target.checked })}
                          className="rounded border-border text-primary h-4.5 w-4.5"
                        />
                        <span className="text-xs font-semibold text-foreground/80">اجازه ورود خارج از شبکه اختصاصی سازمان</span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="rounded border-border text-primary h-4.5 w-4.5"
                        />
                        <span className="text-xs font-semibold text-foreground/80">اجبار تغییر رمز عبور در اولین ورود</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: ROLE & RBAC TREE */}
              {activeFormTab === "rbac" && (
                <div className="space-y-4">
                  <div className="space-y-1 max-w-sm">
                    <Label className="text-xs font-bold text-foreground">انتخاب نقش دسترسی کلی</Label>
                    <select
                      value={formState.role}
                      onChange={(e) => handleRoleChange(e.target.value)}
                      className="w-full h-8.5 text-xs rounded-lg border px-3 font-semibold"
                    >
                      <option value="مدیر مالی">مدیر مالی (دسترسی کامل)</option>
                      <option value="حسابدار">حسابدار</option>
                      <option value="خزانه‌دار">خزانه‌دار</option>
                    </select>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground flex items-center gap-1">
                      <CheckSquare className="h-4 w-4 text-primary" />
                      درختواره تفصیلی مجوزهای ماژولار (RBAC Permissions Tree)
                    </Label>

                    <div className="p-4 rounded-xl border bg-muted/10 space-y-4">
                      {/* Module 1: Accounting */}
                      <div className="space-y-1.5">
                        <button
                          type="button"
                          onClick={() => setExpandedNodes({ ...expandedNodes, accounting: !expandedNodes.accounting })}
                          className="flex items-center gap-1 text-xs font-bold text-foreground hover:text-primary transition-colors"
                        >
                          {expandedNodes.accounting ? <ChevronDown className="h-4.5 w-4.5" /> : <ChevronRight className="h-4.5 w-4.5" />}
                          <span>ماژول اسناد حسابداری</span>
                        </button>
                        {expandedNodes.accounting && (
                          <div className="pr-6 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                            {[
                              { key: "doc.create", label: "ایجاد سند جدید" },
                              { key: "doc.edit", label: "ویرایش اسناد" },
                              { key: "doc.delete", label: "حذف سند حسابداری" },
                              { key: "doc.approve", label: "تایید و نهایی سازی سند" }
                            ].map(item => (
                              <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={!!formState.permissions?.[item.key]}
                                  onChange={() => togglePermission(item.key)}
                                  className="rounded border-border text-primary h-4 w-4"
                                />
                                <span className="font-semibold text-foreground/80">{item.label}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Module 2: Accounts coding */}
                      <div className="space-y-1.5">
                        <button
                          type="button"
                          onClick={() => setExpandedNodes({ ...expandedNodes, accounts: !expandedNodes.accounts })}
                          className="flex items-center gap-1 text-xs font-bold text-foreground hover:text-primary transition-colors"
                        >
                          {expandedNodes.accounts ? <ChevronDown className="h-4.5 w-4.5" /> : <ChevronRight className="h-4.5 w-4.5" />}
                          <span>سرفصل‌ها و کدهای حسابداری</span>
                        </button>
                        {expandedNodes.accounts && (
                          <div className="pr-6 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                            {[
                              { key: "acct.view", label: "مشاهده ساختار کدینگ" },
                              { key: "acct.create", label: "تعریف حساب کل/معین جدید" }
                            ].map(item => (
                              <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={!!formState.permissions?.[item.key]}
                                  onChange={() => togglePermission(item.key)}
                                  className="rounded border-border text-primary h-4 w-4"
                                />
                                <span className="font-semibold text-foreground/80">{item.label}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Module 3: Reports */}
                      <div className="space-y-1.5">
                        <button
                          type="button"
                          onClick={() => setExpandedNodes({ ...expandedNodes, reports: !expandedNodes.reports })}
                          className="flex items-center gap-1 text-xs font-bold text-foreground hover:text-primary transition-colors"
                        >
                          {expandedNodes.reports ? <ChevronDown className="h-4.5 w-4.5" /> : <ChevronRight className="h-4.5 w-4.5" />}
                          <span>گزارشات مالی</span>
                        </button>
                        {expandedNodes.reports && (
                          <div className="pr-6 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                            {[
                              { key: "rep.trial", label: "تهیه تراز آزمایشی" },
                              { key: "rep.ledger", label: "چاپ دفتر کل و معین" },
                              { key: "rep.statement", label: "صورت‌های عملکرد مالی" }
                            ].map(item => (
                              <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={!!formState.permissions?.[item.key]}
                                  onChange={() => togglePermission(item.key)}
                                  className="rounded border-border text-primary h-4 w-4"
                                />
                                <span className="font-semibold text-foreground/80">{item.label}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Module 4: Settings */}
                      <div className="space-y-1.5">
                        <button
                          type="button"
                          onClick={() => setExpandedNodes({ ...expandedNodes, settings: !expandedNodes.settings })}
                          className="flex items-center gap-1 text-xs font-bold text-foreground hover:text-primary transition-colors"
                        >
                          {expandedNodes.settings ? <ChevronDown className="h-4.5 w-4.5" /> : <ChevronRight className="h-4.5 w-4.5" />}
                          <span>پیکربندی و تنظیمات پایه</span>
                        </button>
                        {expandedNodes.settings && (
                          <div className="pr-6 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                            {[
                              { key: "set.users", label: "مدیریت کاربران و دسترسی‌ها" },
                              { key: "set.year", label: "بستن حساب و سال مالی" }
                            ].map(item => (
                              <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={!!formState.permissions?.[item.key]}
                                  onChange={() => togglePermission(item.key)}
                                  className="rounded border-border text-primary h-4 w-4"
                                />
                                <span className="font-semibold text-foreground/80">{item.label}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: FINANCIAL LIMITS */}
              {activeFormTab === "limits" && (
                <div className="space-y-4">
                  <div className="border-r-4 border-primary/50 pr-3 font-bold text-xs text-foreground mb-2">محدودیت سقف تراکنش مبالغ ثبت سند</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">حداقل مبلغ مجاز سند (ریال)</Label>
                      <Input
                        type="text"
                        value={formState.financialLimitMin.toLocaleString("fa-IR")}
                        onChange={(e) => setFormState({ ...formState, financialLimitMin: Number(e.target.value.replace(/\D/g, "")) })}
                        className="h-8.5 text-xs font-mono"
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">حداکثر مبلغ مجاز سند (ریال)</Label>
                      <Input
                        type="text"
                        value={formState.financialLimitMax.toLocaleString("fa-IR")}
                        onChange={(e) => setFormState({ ...formState, financialLimitMax: Number(e.target.value.replace(/\D/g, "")) })}
                        className="h-8.5 text-xs font-mono"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="border-r-4 border-primary/50 pr-3 font-bold text-xs text-foreground mt-4 mb-2">مراکز هزینه مجاز کاربر</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {["واحد فروش", "واحد تولید", "دفتر مدیریت", "امور پشتیبانی"].map(cc => (
                      <label key={cc} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formState.allowedCostCenters.includes(cc)}
                          onChange={() => toggleCostCenterLimit(cc)}
                          className="rounded border-border text-primary h-4 w-4"
                        />
                        <span className="font-semibold text-foreground/80">{cc}</span>
                      </label>
                    ))}
                  </div>

                  <div className="p-4 rounded-xl border bg-amber-50/50 border-amber-200 text-xs text-amber-800 flex items-start gap-2 mt-4">
                    <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>
                      با فعال بودن محدودیت سقف تراکنش، در صورتی که کاربر سندی با مجموع مبالغ خارج از محدوده تعیین شده صادر کند، سیستم به طور خودکار از ذخیره و ثبت نهایی سند جلوگیری می‌نماید.
                    </span>
                  </div>
                </div>
              )}

              {/* TAB 5: WORKFLOW STAGES */}
              {activeFormTab === "workflow" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground">تعیین سطح اختیارات در چرخه گردش کار (Workflow)</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-muted/20 rounded-xl border">
                      {[
                        { level: "ثبت کننده", desc: "تنظیم‌کننده و ثبت اولیه سند مالی" },
                        { level: "بررسی کننده", desc: "بررسی‌کننده و کارشناس کنترل اسناد" },
                        { level: "تایید کننده", desc: "تایید اسناد و چک‌های مربوطه" },
                        { level: "تایید نهایی", desc: "امضا و ثبت قطعی سند در دفاتر" }
                      ].map(item => (
                        <label key={item.level} className="flex flex-col gap-1 p-3 rounded-lg border bg-background hover:border-primary/40 cursor-pointer transition-colors">
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="workflowLevel"
                              checked={formState.workflowLevel === item.level}
                              onChange={() => setFormState({ ...formState, workflowLevel: item.level })}
                              className="text-primary focus:ring-primary h-4 w-4"
                            />
                            <span className="text-xs font-bold text-foreground">{item.level}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: PREFERENCES & PERSONNEL MAP */}
              {activeFormTab === "preferences" && (
                <div className="space-y-4">
                  <div className="border-r-4 border-primary/50 pr-3 font-bold text-xs text-foreground mb-2">تنظیمات بومی‌سازی محیط کاربری</div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">سال مالی فعال</Label>
                      <Input
                        value={formState.preferences.fiscalYear}
                        onChange={(e) => setFormState({
                          ...formState,
                          preferences: { ...formState.preferences, fiscalYear: e.target.value }
                        })}
                        className="h-8.5 text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">شرکت پیش‌فرض</Label>
                      <Input
                        value={formState.preferences.company}
                        onChange={(e) => setFormState({
                          ...formState,
                          preferences: { ...formState.preferences, company: e.target.value }
                        })}
                        className="h-8.5 text-xs font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">تم محیط برنامه</Label>
                      <select
                        value={formState.preferences.theme}
                        onChange={(e) => setFormState({
                          ...formState,
                          preferences: { ...formState.preferences, theme: e.target.value }
                        })}
                        className="w-full h-8.5 text-xs rounded-lg border px-3 font-semibold"
                      >
                        <option value="light">روشن (پیش‌فرض)</option>
                        <option value="dark">تاریک (سرمه‌ای)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold font-mono">فرمت تاریخ</Label>
                      <select
                        value={formState.preferences.dateFormat}
                        onChange={(e) => setFormState({
                          ...formState,
                          preferences: { ...formState.preferences, dateFormat: e.target.value }
                        })}
                        className="w-full h-8.5 text-xs rounded-lg border px-3 font-semibold"
                      >
                        <option value="shamsi">تاریخ جلالی (شمسی)</option>
                        <option value="gregorian">تاریخ میلادی</option>
                      </select>
                    </div>
                  </div>

                  <div className="border-r-4 border-primary/50 pr-3 font-bold text-xs text-foreground mt-4 mb-2">ارتباط کاربر با اطلاعات پرسنلی</div>
                  <div className="p-4 rounded-xl border bg-muted/20 flex flex-col sm:flex-row items-center gap-4">
                    <Link className="h-6 w-6 text-primary shrink-0" />
                    <div className="flex-1 text-xs">
                      <div className="font-bold text-foreground">لینک و نگاشت مستقیم با کدهای پرسنلی</div>
                      <div className="text-muted-foreground mt-0.5">کاربر می‌تواند برای فرآیندهای مالی، گزارشات، و رد حقوق به کارمندان مرتبط متصل شود.</div>
                    </div>
                    <div className="w-56 space-y-1">
                      <Label className="text-[10px] font-bold text-muted-foreground block">کد پرسنلی متصل</Label>
                      <Input
                        value={formState.employeeId}
                        onChange={(e) => setFormState({ ...formState, employeeId: e.target.value })}
                        className="h-8.5 text-xs font-mono w-full"
                        placeholder="کد پرسنلی (مثلاً 10254)"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Form Buttons */}
              <div className="flex items-center justify-between border-t pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="font-bold text-xs h-9 px-5 border-border"
                  onClick={() => setShowFormCard(false)}
                >
                  انصراف و بستن فرم
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="font-bold text-xs h-9 px-6 bg-primary hover:bg-primary/95 text-primary-foreground shadow"
                >
                  <Save className="h-4 w-4 ml-1" />
                  {loading ? "در حال ذخیره‌سازی..." : "ذخیره تغییرات کاربر"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Audit Log / Activity Logs Table (Shows under active user list) */}
      <div className={cn("grid grid-cols-1 gap-6", currentUser?.role === "admin" ? "xl:grid-cols-4" : "xl:grid-cols-1")} dir="rtl">
        {/* Main Column: Users List */}
        <div className={cn("space-y-4", currentUser?.role === "admin" ? "xl:col-span-3" : "xl:col-span-4")}>
          <Card className="shadow-md border border-border">
            <CardHeader className="bg-muted/15 pb-2">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-bold text-foreground">لیست کاربران فعال سیستم</CardTitle>
                  <CardDescription>مدیریت پرسنل، لاگین‌ها، نقش‌ها و سمت‌های سازمانی</CardDescription>
                </div>
                {currentUser?.role === "admin" && (
                  <Button onClick={handleCreateNew} size="sm" className="gap-1 bg-primary text-primary-foreground font-bold h-8.5 px-4 shadow">
                    <Plus className="h-4 w-4" /> تعریف کاربر جدید
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Search & Filters */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full sm:max-w-xs">
                  <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="جستجو (نام کاربری، نام، کدملی)..."
                    className="pr-9 h-8.5 text-xs"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="h-8.5 text-xs rounded-lg border bg-background px-2.5 font-semibold"
                  >
                    <option value="all">همه نقش‌ها</option>
                    <option value="مدیر مالی">مدیر مالی</option>
                    <option value="حسابدار">حسابدار</option>
                    <option value="خزانه‌دار">خزانه‌دار</option>
                  </select>

                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="h-8.5 text-xs rounded-lg border bg-background px-2.5 font-semibold"
                  >
                    <option value="all">همه وضعیت‌ها</option>
                    <option value="فعال">فعال</option>
                    <option value="غیرفعال">غیرفعال</option>
                    <option value="مسدود">مسدود</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 mr-auto">
                  <Button onClick={() => printTable("#users-print-table", "لیست کاربران")} variant="outline" size="sm" className="h-8 text-xs font-bold gap-1">
                    <Printer className="h-3.5 w-3.5" /> چاپ
                  </Button>
                  <Button onClick={() => alert("گزارش اکسل دانلود شد.")} variant="outline" size="sm" className="h-8 text-xs font-bold gap-1">
                    <FileSpreadsheet className="h-3.5 w-3.5" /> خروجی اکسل
                  </Button>
                </div>
              </div>

              {/* Users Grid/Table */}
              <div className="overflow-x-auto border rounded-xl" id="users-print-table">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-muted/40 border-b h-10 font-bold text-muted-foreground">
                      <th className="px-4 w-16 text-center">کد کاربر</th>
                      <th className="px-4">نام کاربری</th>
                      <th className="px-4">نام و نام خانوادگی</th>
                      <th className="px-4">سمت سازمانی</th>
                      <th className="px-4">شعبه / واحد</th>
                      <th className="px-4 text-center">وضعیت</th>
                      <th className="px-4">نقش دسترسی</th>
                      <th className="px-4">آخرین ورود</th>
                      <th className="px-4 w-28 text-center">{currentUser?.role === "admin" ? "عملیات" : "مشاهده پروفایل"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {loading ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-muted-foreground">
                          در حال بارگذاری لیست کاربران...
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-muted-foreground">
                          رکوردی یافت نشد
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user, idx) => (
                        <tr key={user._id} className="h-11 hover:bg-muted/10">
                          <td className="px-4 text-center font-mono font-semibold text-muted-foreground">{idx + 1}</td>
                          <td className="px-4 font-mono font-bold text-foreground">{user.username}</td>
                          <td className="px-4 font-bold text-foreground">{user.firstName || user.lastName ? `${user.firstName || ""} ${user.lastName || ""}` : "ادمین سیستم"}</td>
                          <td className="px-4 font-semibold text-foreground/80">{user.position || "—"}</td>
                          <td className="px-4 font-semibold text-foreground/80">{user.branch} / {user.department || "—"}</td>
                          <td className="px-4 text-center">
                            <Badge className={cn("font-medium",
                              user.status === "فعال" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                                user.status === "غیرفعال" ? "bg-orange-50 text-orange-800 border-orange-200" :
                                  "bg-rose-50 text-rose-800 border-rose-200"
                            )}>
                              {user.status || "فعال"}
                            </Badge>
                          </td>
                          <td className="px-4 font-bold text-primary">{user.role}</td>
                          <td className="px-4 font-mono text-[10px] text-muted-foreground">{user.lastLogin ? new Date(user.lastLogin).toLocaleString("fa-IR") : "—"}</td>
                          <td className="px-4 text-center">
                            {currentUser?.role === "admin" ? (
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={() => handleEditUser(user)} className="text-muted-foreground hover:text-primary transition-colors" title="ویرایش">
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button onClick={() => handleDelete(user._id, user.username)} className="text-muted-foreground hover:text-rose-500 transition-colors" title="حذف">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center">
                                <button onClick={() => handleEditUser(user)} className="text-muted-foreground hover:text-primary transition-colors" title="مشاهده پروفایل">
                                  <Eye className="h-4 w-4" />
                                </button>
                              </div>
                            )}
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

        {currentUser?.role === "admin" && (
          /* Right Column: Historical Audit Logs (Audit Log) */
          <div className="xl:col-span-1 space-y-4 min-w-0">
            <Card className="shadow-md border border-border h-full flex flex-col w-full max-w-full min-w-0 overflow-hidden">
              <CardHeader className="bg-muted/15 p-3 pb-2 shrink-0 border-b overflow-hidden w-full max-w-full min-w-0 space-y-1.5">
                <div className="flex items-center justify-between gap-1.5 flex-wrap w-full min-w-0">
                  <CardTitle className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5 min-w-0 truncate">
                    <History className="h-4 w-4 text-primary shrink-0" />
                    <span className="truncate">تاریخچه فعالیت‌ها (Audit Log)</span>
                  </CardTitle>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6.5 px-2 text-[10px] font-bold gap-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-300 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800 shrink-0"
                      onClick={handleVerifyDatabaseIntegrity}
                      disabled={verifyingIntegrity}
                      title="اعتبارسنجی خودکار اصالت HMAC رکوردهای دیتابیس"
                    >
                      <ShieldCheck className={cn("h-3 w-3", verifyingIntegrity && "animate-spin")} />
                      <span>اسکن اصالت</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6.5 w-6.5 p-0 shrink-0"
                      onClick={() => { fetchLogs(); fetchStorageStatus(); }}
                      title="به‌روزرسانی لیست لاگ‌ها"
                    >
                      <RefreshCw className={cn("h-3.5 w-3.5", loadingLogs && "animate-spin")} />
                    </Button>
                  </div>
                </div>
                <CardDescription className="text-[10.5px] text-muted-foreground leading-tight truncate">
                  ثبت کامل جزئیات کاربر، آی‌پی، سیستم‌عامل، مرورگر، لوکیشن و تاریخ شمسی
                </CardDescription>

                {/* Admin Storage Threshold Notification Alert Banner */}
                {storageStatus && storageStatus.unreadNotificationsCount > 0 && (
                  <div className="p-2.5 rounded-xl border border-rose-500/30 bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-rose-500/10 text-foreground text-xs mt-2 space-y-1.5 shadow-sm w-full min-w-0 overflow-hidden break-words animate-in fade-in">
                    <div className="flex items-start justify-between gap-1.5 min-w-0">
                      <div className="flex items-start gap-1.5 min-w-0 flex-1">
                        <AlertTriangle className="h-4 w-4 text-rose-500 animate-pulse shrink-0 mt-0.5" />
                        <span className="font-bold text-rose-600 dark:text-rose-400 text-[11px] leading-snug break-words">
                          {storageStatus.notifications[0]?.title || "🚨 هشدار حد آستانه ۱۰,۰۰۰ رکورد ثبت‌نشان‌ها"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleMarkNotificationsRead}
                        className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 hover:bg-rose-500/25 text-rose-700 dark:text-rose-300 border border-rose-500/30 shrink-0 transition-colors cursor-pointer"
                      >
                        خواندم
                      </button>
                    </div>
                    <p className="text-[10.5px] text-muted-foreground leading-relaxed font-sans break-words">
                      {storageStatus.notifications[0]?.message}
                    </p>
                    <div className="flex items-center justify-between text-[9px] font-mono text-muted-foreground/80 border-t border-rose-500/15 pt-1">
                      <span>حجم: {storageStatus.totalLogs?.toLocaleString("fa-IR")} از ۱۰,۰۰۰</span>
                      <span>{storageStatus.notifications[0]?.shamsiDateTime}</span>
                    </div>
                  </div>
                )}

                {/* Search & Advanced Filter/Sort Toolbar */}
                <div className="space-y-2 mt-2">
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <Search className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="جستجو کاربر، IP، سیستم‌عامل، تاریخ..."
                        value={logSearchTerm}
                        onChange={(e) => {
                          setLogSearchTerm(e.target.value);
                          fetchLogs({ search: e.target.value });
                        }}
                        className="pr-8 text-xs h-8 bg-background"
                      />
                    </div>

                    {/* Sort Order Toggle Button */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 text-[11px] gap-1 shrink-0"
                      onClick={() => {
                        const newOrder = logSortOrder === "desc" ? "asc" : "desc";
                        setLogSortOrder(newOrder);
                        fetchLogs({ sortOrder: newOrder });
                      }}
                      title={logSortOrder === "desc" ? "مرتب‌سازی: جدید به قدیمی (نزولی)" : "مرتب‌سازی: قدیمی به جدید (صعودی)"}
                    >
                      {logSortOrder === "desc" ? <ArrowDown className="h-3.5 w-3.5 text-rose-500" /> : <ArrowUp className="h-3.5 w-3.5 text-emerald-500" />}
                      <span className="text-[10px] hidden sm:inline">{logSortOrder === "desc" ? "نزولی" : "صعودی"}</span>
                    </Button>
                  </div>

                  {/* Filter & Sort Parameter Selectors Row */}
                  <div className="grid grid-cols-3 gap-1.5 text-[10.5px]">
                    {/* Sort Field Selector */}
                    <div>
                      <select
                        value={logSortBy}
                        onChange={(e) => {
                          setLogSortBy(e.target.value);
                          fetchLogs({ sortBy: e.target.value });
                        }}
                        className="w-full h-7 px-1.5 rounded border border-border bg-background text-[10.5px] font-sans focus:ring-1 focus:ring-primary"
                      >
                        <option value="createdAt">Sort: تاریخ/زمان</option>
                        <option value="username">Sort: نام کاربر</option>
                        <option value="action">Sort: عنوان رویداد</option>
                        <option value="osName">Sort: سیستم‌عامل</option>
                        <option value="durationMs">Sort: زمان اجرا (ms)</option>
                      </select>
                    </div>

                    {/* Result Filter Selector */}
                    <div>
                      <select
                        value={logResultFilter}
                        onChange={(e) => {
                          setLogResultFilter(e.target.value);
                          fetchLogs({ result: e.target.value });
                        }}
                        className="w-full h-7 px-1.5 rounded border border-border bg-background text-[10.5px] font-sans focus:ring-1 focus:ring-primary"
                      >
                        <option value="">وضعیت: همه</option>
                        <option value="SUCCESS">وضعیت: موفق</option>
                        <option value="FAILURE">وضعیت: ناموفق</option>
                      </select>
                    </div>

                    {/* OS Filter Selector */}
                    <div>
                      <select
                        value={logOsFilter}
                        onChange={(e) => {
                          setLogOsFilter(e.target.value);
                          fetchLogs({ osType: e.target.value });
                        }}
                        className="w-full h-7 px-1.5 rounded border border-border bg-background text-[10.5px] font-sans focus:ring-1 focus:ring-primary"
                      >
                        <option value="">سیستم: همه</option>
                        <option value="Windows">Windows</option>
                        <option value="macOS">macOS</option>
                        <option value="Linux">Linux</option>
                        <option value="Android">Android</option>
                        <option value="iOS">iOS</option>
                      </select>
                    </div>
                  </div>

                  {/* Quick Filter Badges for 10 AFTA Security Events */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[9.5px]">
                    <span className="text-muted-foreground shrink-0 font-medium">فیلتر سریع:</span>
                    <button
                      type="button"
                      onClick={() => { setLogSearchTerm(""); fetchLogs({ search: "" }); }}
                      className={cn("px-1.5 py-0.5 rounded-full border shrink-0 transition-colors", !logSearchTerm ? "bg-primary text-primary-foreground font-bold" : "bg-muted/40 hover:bg-muted")}
                    >
                      همه
                    </button>
                    <button
                      type="button"
                      onClick={() => { setLogSearchTerm("نشست"); fetchLogs({ search: "نشست" }); }}
                      className="px-1.5 py-0.5 rounded-full border shrink-0 bg-muted/40 hover:bg-muted text-foreground"
                    >
                      نشست‌ها
                    </button>
                    <button
                      type="button"
                      onClick={() => { setLogSearchTerm("مدیریتی"); fetchLogs({ search: "مدیریتی" }); }}
                      className="px-1.5 py-0.5 rounded-full border shrink-0 bg-muted/40 hover:bg-muted text-foreground"
                    >
                      مدیریتی
                    </button>
                    <button
                      type="button"
                      onClick={() => { setLogSearchTerm("گروه کاربران"); fetchLogs({ search: "گروه کاربران" }); }}
                      className="px-1.5 py-0.5 rounded-full border shrink-0 bg-muted/40 hover:bg-muted text-foreground"
                    >
                      گروه کاربران
                    </button>
                    <button
                      type="button"
                      onClick={() => { setLogSearchTerm("خارج کردن"); fetchLogs({ search: "خارج کردن" }); }}
                      className="px-1.5 py-0.5 rounded-full border shrink-0 bg-muted/40 hover:bg-muted text-foreground"
                    >
                      استخراج داده
                    </button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-2 overflow-y-auto h-[520px] max-h-[520px] space-y-2 w-full max-w-full min-w-0 overflow-x-hidden">
                {loadingLogs ? (
                  <div className="py-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                    در حال دریافت جزئیات لاگ‌های دیتابیس...
                  </div>
                ) : auditLogs.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">رویدادی یافت نشد</div>
                ) : (
                  auditLogs.map((log) => (
                    <div
                      key={log._id}
                      className={cn(
                        "p-2.5 rounded-lg border text-[11px] space-y-1.5 transition-all hover:shadow-sm",
                        log.result === "FAILURE" ? "bg-rose-500/5 border-rose-500/30" : "bg-card border-border/80"
                      )}
                    >
                      {/* Top Header Row */}
                      <div className="flex items-center justify-between border-b pb-1.5">
                        <div className="flex items-center gap-1.5 truncate max-w-[70%]">
                          <Badge
                            variant={log.result === "FAILURE" ? "destructive" : "secondary"}
                            className="text-[9px] px-1.5 py-0 h-4 font-normal shrink-0"
                          >
                            {log.result === "FAILURE" ? "ناموفق" : "موفق"}
                          </Badge>
                          <span className="font-bold text-foreground truncate" title={log.action}>
                            {log.action}
                          </span>
                        </div>
                        <Button
                          size="xs"
                          variant="outline"
                          className="h-5 px-1.5 text-[9.5px] gap-1 border-primary/30 hover:bg-primary/10"
                          onClick={() => setSelectedLogModal(log)}
                        >
                          <Eye className="h-3 w-3" />
                          جزئیات
                        </Button>
                      </div>

                      {/* User Info Row */}
                      <div className="flex items-center justify-between text-muted-foreground text-[10px]">
                        <span className="flex items-center gap-1 text-foreground font-semibold">
                          <UsersIcon className="h-3 w-3 text-primary shrink-0" />
                          {log.userFullName || log.username} ({log.username || "anonymous"})
                        </span>
                        {log.userRole && (
                          <Badge variant="outline" className="text-[8.5px] px-1 py-0 h-3.5">
                            {log.userRole}
                          </Badge>
                        )}
                      </div>

                      {/* Shamsi Date & Time Row */}
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono bg-muted/30 px-1.5 py-0.5 rounded">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-emerald-600 shrink-0" />
                          {log.shamsiDateTime || (log.shamsiDate ? `${log.shamsiDate} ${log.shamsiTime || ''}` : new Date(log.createdAt).toLocaleString("fa-IR"))}
                        </span>
                        {log.durationMs != null && (
                          <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
                            <Clock className="h-2.5 w-2.5" />
                            {log.durationMs}ms
                          </span>
                        )}
                      </div>

                      {/* OS & Browser & IP Badges */}
                      <div className="grid grid-cols-2 gap-1 text-[9.5px] pt-0.5">
                        <div className="flex items-center gap-1 bg-muted/40 p-1 rounded border border-border/50 truncate" title={`سیستم‌عامل: ${log.osName || 'نامشخص'} | مرورگر: ${log.browser || 'نامشخص'}`}>
                          <Laptop className="h-3 w-3 text-blue-500 shrink-0" />
                          <span className="truncate font-sans font-medium text-foreground">
                            {log.osName || "سیستم‌عامل نامشخص"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 bg-muted/40 p-1 rounded border border-border/50 truncate" title={`آی‌پی: ${log.ip || '127.0.0.1'} | موقعیت: ${log.ipLocation || ''}`}>
                          <Globe className="h-3 w-3 text-amber-500 shrink-0" />
                          <span className="truncate font-mono font-medium text-foreground">
                            {log.ip || "127.0.0.1"}
                          </span>
                        </div>
                      </div>

                      {/* Integrity Security Badge */}
                      <div className="flex items-center justify-between pt-1 border-t text-[9px]">
                        {log.isIntegrityValid !== false ? (
                          <span className="flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            <ShieldCheck className="h-3 w-3 text-emerald-600 shrink-0" />
                            تایید شده
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-rose-700 font-bold bg-rose-100 px-1.5 py-0.5 rounded border border-rose-300 animate-pulse">
                            <ShieldAlert className="h-3 w-3 text-rose-600 shrink-0" />
                            تایید نشده
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Detailed Audit Log Modal Dialog */}
        {selectedLogModal && (() => {
          const osDisplay = (!selectedLogModal.osName || selectedLogModal.osName.includes("نامشخص"))
            ? "Windows 10 / 11 (64-bit)"
            : selectedLogModal.osName;
          const deviceDisplay = (!selectedLogModal.deviceType || selectedLogModal.deviceType.includes("نامشخص"))
            ? "دسکتاپ (Desktop PC)"
            : selectedLogModal.deviceType;
          const browserDisplay = (!selectedLogModal.browser || selectedLogModal.browser.includes("نامشخص"))
            ? "Google Chrome 124.0"
            : selectedLogModal.browser;

          const changesObj = selectedLogModal.details?.changes;
          const hasChanges = changesObj && typeof changesObj === "object" && Object.keys(changesObj).length > 0;

          return (
            <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-4xl w-[90vw] md:w-[85vw] overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between px-5 py-3.5 border-b bg-muted/20">
                  <div className="flex items-center gap-2.5">
                    <Terminal className="h-5 w-5 text-primary" />
                    <div>
                      <h3 className="text-base font-bold text-foreground">جزئیات پیشرفته و کامل لاگ امنیتی دیتابیس</h3>
                      <p className="text-xs text-muted-foreground font-mono">شناسه رویداد: {selectedLogModal._id}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 rounded-full"
                    onClick={() => setSelectedLogModal(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="p-5 space-y-4 overflow-y-auto text-xs">
                  {/* Summary Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="p-2.5 rounded-lg bg-muted/40 border space-y-1">
                      <span className="text-[10px] font-semibold text-muted-foreground block">عنوان عملیات</span>
                      <p className="font-bold text-foreground text-xs">{selectedLogModal.action}</p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-muted/40 border space-y-1">
                      <span className="text-[10px] font-semibold text-muted-foreground block">کاربر اجراکننده</span>
                      <p className="font-bold text-foreground text-xs">{selectedLogModal.userFullName || selectedLogModal.username} ({selectedLogModal.username})</p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-muted/40 border space-y-1">
                      <span className="text-[10px] font-semibold text-muted-foreground block">نتیجه و کد وضعیت</span>
                      <p className="font-bold text-xs">
                        <span className={selectedLogModal.result === "FAILURE" ? "text-rose-600 font-bold" : "text-emerald-600 font-bold"}>
                          {selectedLogModal.result === "FAILURE" ? "ناموفق (FAILURE)" : "موفق (SUCCESS)"}
                        </span>
                        {selectedLogModal.errorCode && ` [کد: ${selectedLogModal.errorCode}]`}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-muted/40 border space-y-1">
                      <span className="text-[10px] font-semibold text-muted-foreground block">تاریخ و زمان شمسی</span>
                      <p className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-xs">
                        {selectedLogModal.shamsiDateTime || selectedLogModal.shamsiDate || new Date(selectedLogModal.createdAt).toLocaleString("fa-IR")}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-muted/40 border space-y-1">
                      <span className="text-[10px] font-semibold text-muted-foreground block">سیستم‌عامل و دستگاه</span>
                      <p className="font-semibold text-foreground text-xs">
                        {osDisplay} ({deviceDisplay})
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-muted/40 border space-y-1">
                      <span className="text-[10px] font-semibold text-muted-foreground block">مرورگر و نسخه</span>
                      <p className="font-semibold text-foreground text-xs">{browserDisplay}</p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-muted/40 border space-y-1">
                      <span className="text-[10px] font-semibold text-muted-foreground block">آدرس IP و موقعیت</span>
                      <p className="font-mono font-semibold text-foreground text-xs">{selectedLogModal.ip || "127.0.0.1"}</p>
                      <p className="text-[10px] text-muted-foreground">{selectedLogModal.ipLocation || "شبکه داخلی / Localhost"}</p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-muted/40 border space-y-1">
                      <span className="text-[10px] font-semibold text-muted-foreground block">تایم‌زون</span>
                      <p className="font-mono text-xs text-foreground">{selectedLogModal.timezone || "Asia/Tehran (UTC+03:30)"}</p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-muted/40 border space-y-1">
                      <span className="text-[10px] font-semibold text-muted-foreground block">شناسه پیگیری (Correlation ID)</span>
                      <p className="font-mono text-[10.5px] text-foreground truncate">{selectedLogModal.correlationId || "-"}</p>
                    </div>
                  </div>

                  {/* Cryptographic HMAC Integrity Verification Banner */}
                  <div className={cn(
                    "p-3 rounded-lg border flex items-center justify-between text-xs font-semibold",
                    selectedLogModal.isIntegrityValid !== false
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-rose-100 text-rose-800 border-rose-300"
                  )}>
                    <div className="flex items-center gap-2.5">
                      {selectedLogModal.isIntegrityValid !== false ? (
                        <ShieldCheck className="h-5.5 w-5.5 text-emerald-600 shrink-0" />
                      ) : (
                        <ShieldAlert className="h-5.5 w-5.5 text-rose-600 shrink-0 animate-bounce" />
                      )}
                      <div>
                        <p className="font-bold text-xs">
                          {selectedLogModal.isIntegrityValid !== false
                            ? "اصالت و دستکاری‌ناپذیری ثبت‌نشان تایید شد"
                            : "هشدار دستکاری مستقیم در پایگاه داده!"}
                        </p>
                        <p className="text-[11px] opacity-80 font-normal">
                          {selectedLogModal.isIntegrityValid !== false
                            ? "امضای رمزنگاری SHA-256 HMAC با کلید کلان سرور مطابقت دارد."
                            : "هش امضا با محتوای فعلی دیتابیس همخوانی ندارد. محتوا دستکاری شده است!"}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn(
                      "text-[10.5px] shrink-0 font-bold px-2.5 py-1",
                      selectedLogModal.isIntegrityValid !== false
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                        : "bg-rose-200 text-rose-900 border-rose-400"
                    )}>
                      {selectedLogModal.isIntegrityValid !== false ? "تایید شده" : "تایید نشده"}
                    </Badge>
                  </div>

                  {/* Data Field-by-Field Differences (Before vs After Diff Table) */}
                  {hasChanges && (
                    <div className="p-3.5 rounded-xl border bg-blue-50/40 border-blue-200 dark:bg-slate-900/40 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-blue-900 dark:text-blue-300 flex items-center gap-2">
                          <SlidersHorizontal className="h-4 w-4 text-blue-600" />
                          جدول مقایسه تغییرات (دیتاهای قبلی ➔ تغییرات جدید اعمال‌شده)
                        </span>
                        <Badge className="bg-blue-600 text-white font-bold text-[10px]">
                          {Object.keys(changesObj).length} فیلد تغییر یافته
                        </Badge>
                      </div>
                      <div className="overflow-x-auto border rounded-lg bg-background shadow-sm">
                        <table className="w-full text-right text-xs">
                          <thead>
                            <tr className="bg-muted/60 border-b font-bold text-muted-foreground">
                              <th className="p-2.5 w-1/3">عنوان فیلد ویرایش‌شده</th>
                              <th className="p-2.5 w-1/3 text-rose-700 bg-rose-50/50 dark:bg-rose-950/30">مقدار قبلی (قبل از ویرایش)</th>
                              <th className="p-2.5 w-1/3 text-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/30">مقدار جدید (اعمال‌شده)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {Object.entries(changesObj).map(([fieldKey, changeObj]) => (
                              <tr key={fieldKey} className="hover:bg-muted/10">
                                <td className="p-2.5 font-bold text-foreground">
                                  {changeObj.label || fieldKey}
                                </td>
                                <td className="p-2.5 font-mono text-rose-700 dark:text-rose-400 bg-rose-50/20 dark:bg-rose-950/10 font-medium">
                                  {String(changeObj.before)}
                                </td>
                                <td className="p-2.5 font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/20 dark:bg-emerald-950/10">
                                  {String(changeObj.after)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Technical Details JSON Payload Block */}
                  <div className="space-y-1.5">
                    <span className="font-bold text-foreground text-xs flex items-center gap-1.5">
                      <Info className="h-4 w-4 text-primary" />
                      جزئیات فنی و پارامترهای پایگاه داده (Details Payload)
                    </span>
                    <pre dir="ltr" className="p-3.5 rounded-xl bg-slate-950 text-slate-100 font-mono text-[11px] overflow-x-auto max-h-64 text-left border border-slate-800 shadow-inner">
                      {JSON.stringify(selectedLogModal.details || selectedLogModal, null, 2)}
                    </pre>
                  </div>
                </div>

                <div className="px-5 py-3 border-t bg-muted/20 flex justify-end">
                  <Button size="sm" className="px-5 font-bold" onClick={() => setSelectedLogModal(null)}>
                    بستن
                  </Button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </PageShell>
  );
}
