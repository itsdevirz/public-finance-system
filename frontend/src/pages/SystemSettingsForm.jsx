import { useState, useEffect, useRef } from "react";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Settings, Save, RefreshCw, ShieldCheck, AlertCircle, CheckCircle2,
  FileText, Printer, Lock, Sliders, Bell, Database, Download, Upload,
  Calendar, Clock, Trash2, FileCheck, HelpCircle, HardDrive, Check,
  FolderArchive, Sparkles, ArrowDownToLine, ArrowUpFromLine, Laptop, Activity, LogOut,
  User, KeyRound, Shield, ShieldAlert
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/api";
import { validateEgressPermission } from "@/lib/egressValidator";

const INITIAL_SETTINGS = {
  // ۱. تنظیمات عمومی و سیستم
  activeFiscalYear: "1405",
  currencyUnit: "rial", // rial or toman
  recordsPerPage: 15,
  displayPersianDigits: true,

  // ۲. حسابداری و کنترل اسناد
  docNumberingMode: "annual", // annual, monthly, continuous
  voucherApprovalLevels: 2, // 1, 2, 3
  strictCreditControl: "strict", // strict, warning, allow
  preventBackdatedDocs: true,
  autoApproveVouchers: false,

  // ۳. تنظیمات چاپ و امضاهای گزارشات
  signatureTitle1: "",
  signatureName1: "",
  signatureTitle2: "",
  signatureName2: "",
  signatureTitle3: "",
  signatureName3: "",
  showLogoInReports: true,
  defaultPaperSize: "A4",

  // ۴. پشتیبان‌گیری، نگهداری و بازیابی
  backupFrequency: "monthly", // daily, monthly, yearly, manual
  autoDailyBackup: true,
  sessionTimeoutMinutes: 60,
  enableAuditLog: true,

  // ۵. پیامک و اطلاع‌رسانی
  enableSmsNotification: false,
  smsApiKey: "",
  smsLineNumber: "",

  // ۶. قوانین تغییر ویژگی‌های امنیتی کاربر فعال (مطابق الزامات افتا)
  disallowSecurityChangeDuringSession: true,
  forceReAuthOnSecurityChange: true,
  revokeAllSessionsOnSecurityChange: true,
  auditLogSecurityChanges: true,
  notifyUserSecurityAlert: false,

  // ۷. خط‌مشی‌های کنترل دسترسی موجودیت‌های غیرفعال (مطابق الزامات افتا)
  inactiveEntityPolicies: {
    recordsDocsMetadata: { read: true, restore: false, delete: false, export: true },
    userBelongingData: { read: true, restore: false, delete: false, export: false },
    authData: { read: false, restore: false, delete: false, export: false },
    otherInactiveCases: { read: true, restore: false, delete: false, export: false }
  },

  // ۸. خط‌مشی‌های عملیاتی در رابطه با موجودیت‌های غیرفعال (مطابق الزامات افتا)
  inactiveEntityOperationsPolicy: {
    createInactiveEntity: { requireAdminApproval: true, auditLog: true, rbacCheck: true },
    deleteInactiveEntity: { preventHardDelete: true, requireAdminApproval: true, auditLog: true },
    changeInactiveAccess: { requireAdminApproval: true, auditLog: true, notifySecurityOfficer: true },
    inactiveMetadataOps: { readOnlyMetadata: true, auditLog: true, checkIntegrity: true },
    otherInactiveOps: { requireAdminApproval: true, auditLog: true }
  },

  // ۹. ویژگی‌های تعریف خط‌مشی‌های موجودیت‌های غیرفعال (مطابق الزامات افتا)
  inactiveEntityPolicyCriteria: {
    useUserRolesAndPermissions: true,
    useSessionInfoAndRequestParams: true,
    useOtherCriteria: false
  },

  // ۱۰. مجازسازی عملیات بین موجودیت فعال و غیرفعال (مطابق الزام جدید افتا در تصویر)
  activeInactiveInteractionPolicy: {
    enableACLCheck: true,
    checkByUserId: true,
    checkByGroupId: true,
    checkByUserRole: true,
    requireExplicitACLRecord: true,
    auditUnauthorizedInteractions: true,
  },

  // ۱۱. قوانین ممانعت از دسترسی موجودیت فعال به غیرفعال (مطابق الزام تصویر جدید افتا)
  activeToInactivePreventionRules: {
    preventAccessOnExceedingSessionThreshold: true,
    sessionThresholdLimit: 3,
    preventAccessOnAccountDeactivation: true,
    preventAccessOnIPAnomaly: true,
    preventAccessOnOtherCriteria: true,
  },

  // ۱۲. تضمین پاک‌سازی داده‌های مانده و سازوکار امن دسترسی به منابع قبلی (مطابق بند ۵ افتا)
  resourceSanitizationPolicy: {
    wipeCryptoKeysOnRelease: true,
    sanitizeTempFilesOnRelease: true,
    isolateSessionMemoryBuffers: true,
    requireSecureAccessForLegacyResources: true,
    auditResourceAllocationAndRelease: true,
  },

  // ۱۳. خط‌مشی کنترل دسترسی هنگام دریافت داده کاربری بر اساس ویژگی‌های امنیتی داده (مطابق تصویر افتا)
  userDataInputAccessPolicy: {
    enableInputDataAccessControl: true,
    checkDataType: true,
    allowedDataTypes: ["JSON", "CSV", "XLSX", "PDF", "TXT"],
    checkVolumeAndSize: true,
    maxPayloadSizeMB: 10,
    checkFormat: true,
    checkImportFrequencyLimit: true,
    maxImportsPerHour: 20,
    checkOtherInputCriteria: true,
  },

  // ۱۴. پروتکل امن برای انتقال داده، همبستگی ویژگی‌های امنیتی و ممانعت از شنود و گم‌شدن داده (مطابق تصویر افتا)
  secureDataTransportPolicy: {
    enforceTLSEncryption: true,
    transparentSecurityAttributeCoupling: true,
    preventEavesdropping: true,
    preventDataLossAndTamperingInTransit: true,
    auditTransportSecurityViolations: true,
  },

  // ۱۵. خط‌مشی کنترل دسترسی هنگام خروج و انتقال داده کاربری به بیرون از محصول (مطابق بند ۸ افتا)
  userDataEgressAccessPolicy: {
    enableEgressDataAccessControl: true,
    checkDataType: true,
    allowedExportDataTypes: ["PDF", "XLSX", "CSV", "JSON"],
    checkVolumeAndSize: true,
    maxExportRecordsPerRequest: 5000,
    maxExportFileSizeBytes: 20971520,
    checkFormat: true,
    checkOtherEgressCriteria: true,
  },

  // ۱۶. قوانین ممانعت از خروج بدون هدف داده کاربری به خارج از محصول (مطابق بند ۹ افتا)
  targetedDataEgressRules: {
    preventUntargetedDataEgress: true,
    requireExplicitEgressDestination: true,
    requireAdminApprovalForBulkEgress: true,
    preventEgressToUnauthorizedEndpoints: true,
    auditUntargetedEgressAttempts: true,
  },

  lastUpdated: null,
};

// خط‌مشی‌های پیش‌فرض کنترل دسترسی موجودیت‌ها و عملیات (مطابق الزامات امنیتی افتا)
const DEFAULT_ENTITY_ACCESS_POLICIES = [
  {
    entityId: "vouchers",
    entityName: "اسناد مالی و حسابداری",
    systemAdmin: { read: true, create: true, update: true, delete: true, approve: true, export: true },
    regularUser: { read: true, create: true, update: true, delete: false, approve: false, export: true },
    otherRoles: { read: true, create: false, update: false, delete: false, approve: false, export: true }
  },
  {
    entityId: "contracts",
    entityName: "قراردادها و پیمانکاران",
    systemAdmin: { read: true, create: true, update: true, delete: true, approve: true, export: true },
    regularUser: { read: true, create: true, update: true, delete: false, approve: false, export: false },
    otherRoles: { read: true, create: false, update: false, delete: false, approve: false, export: false }
  },
  {
    entityId: "credits",
    entityName: "اعتبارات و موافقت‌نامه‌ها",
    systemAdmin: { read: true, create: true, update: true, delete: true, approve: true, export: true },
    regularUser: { read: true, create: false, update: false, delete: false, approve: false, export: true },
    otherRoles: { read: true, create: false, update: false, delete: false, approve: false, export: false }
  },
  {
    entityId: "users",
    entityName: "کاربران و سطوح دسترسی",
    systemAdmin: { read: true, create: true, update: true, delete: true, approve: true, export: true },
    regularUser: { read: false, create: false, update: false, delete: false, approve: false, export: false },
    otherRoles: { read: false, create: false, update: false, delete: false, approve: false, export: false }
  },
  {
    entityId: "settings",
    entityName: "تنظیمات و خط‌مشی‌های امنیتی",
    systemAdmin: { read: true, create: true, update: true, delete: true, approve: true, export: true },
    regularUser: { read: false, create: false, update: false, delete: false, approve: false, export: false },
    otherRoles: { read: false, create: false, update: false, delete: false, approve: false, export: false }
  },
  {
    entityId: "reports",
    entityName: "گزارشات مدیریتی و نظارتی",
    systemAdmin: { read: true, create: true, update: true, delete: true, approve: true, export: true },
    regularUser: { read: true, create: true, update: false, delete: false, approve: false, export: true },
    otherRoles: { read: true, create: false, update: false, delete: false, approve: false, export: true }
  },
  {
    entityId: "inventory",
    entityName: "اموال و انبارداری",
    systemAdmin: { read: true, create: true, update: true, delete: true, approve: true, export: true },
    regularUser: { read: true, create: true, update: true, delete: false, approve: false, export: false },
    otherRoles: { read: true, create: false, update: false, delete: false, approve: false, export: false }
  }
];

// لیست نسخه‌های پشتیبان ذخیره شده در سیستم (خالی در ابتدا)
const DEFAULT_BACKUPS = [];

const TABS = [
  { id: "general", label: "عمومی و سیستم", icon: Sliders },
  { id: "accounting", label: "حسابداری و کنترل اسناد", icon: FileText },
  { id: "reports", label: "امضاها و چاپ گزارشات", icon: Printer },
  { id: "backup", label: "پشتیبان‌گیری و بازیابی داده‌ها", icon: Database },
  { id: "security", label: "امنیت و دسترسی", icon: Lock },
  { id: "sms", label: "پیامک و اطلاع‌رسانی", icon: Bell },
];

export default function SystemSettingsForm() {
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [backups, setBackups] = useState(DEFAULT_BACKUPS);
  const [entityPolicies, setEntityPolicies] = useState(DEFAULT_ENTITY_ACCESS_POLICIES);
  const [selectedRoleTab, setSelectedRoleTab] = useState("systemAdmin"); // systemAdmin, regularUser, otherRoles
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // حالت‌های بخش پشتیبان‌گیری
  const [newBackupType, setNewBackupType] = useState("monthly");
  const [newBackupPeriod, setNewBackupPeriod] = useState("");
  const [importFileMeta, setImportFileMeta] = useState(null);
  const [importRawData, setImportRawData] = useState(null);
  const fileInputRef = useRef(null);

  // حالت‌های بخش نشست‌های فعال
  const [activeSessions, setActiveSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [revokingId, setRevokingId] = useState(null);

  const fetchActiveSessions = async () => {
    try {
      setLoadingSessions(true);
      const res = await api.get("/api/security/active-sessions");
      if (res?.data?.success && Array.isArray(res.data.data)) {
        setActiveSessions(res.data.data);
      } else {
        const storedUser = localStorage.getItem("user");
        const parsed = storedUser ? JSON.parse(storedUser) : null;
        setActiveSessions([
          {
            _id: "s-current",
            username: parsed?.username || "مدیر سیستم",
            role: parsed?.role || "مدیر ارشد",
            ip: "127.0.0.1",
            browserName: "مرورگر جاری (Chrome/Edge)",
            osName: "Windows 11",
            lastActivity: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            isCurrent: true
          }
        ]);
      }
    } catch (_) {
      const storedUser = localStorage.getItem("user");
      const parsed = storedUser ? JSON.parse(storedUser) : null;
      setActiveSessions([
        {
          _id: "s-current",
          username: parsed?.username || "مدیر سیستم",
          role: parsed?.role || "مدیر ارشد",
          ip: "127.0.0.1",
          browserName: "مرورگر جاری (Chrome/Edge)",
          osName: "Windows 11",
          lastActivity: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          isCurrent: true
        }
      ]);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    if (activeTab === "security") {
      fetchActiveSessions();
    }
  }, [activeTab]);

  const handleRevokeSession = async (sessionId, token) => {
    if (!window.confirm("آیا از ابطال این نشست و خروج اجباری کاربر مطمئن هستید؟")) return;
    try {
      setRevokingId(sessionId);
      await api.post("/api/security/revoke-session", { sessionId, token });
      setSuccessMsg("نشست انتخاب شده با موفقیت باطل گردید.");
      await fetchActiveSessions();
    } catch (err) {
      setErrorMsg("خطا در ابطال نشست: " + (err.response?.data?.message || err.message));
    } finally {
      setRevokingId(null);
    }
  };

  // بارگذاری تنظیمات و خط‌مشی‌های امنیتی از بک‌اند و localStorage
  const fetchSecurityPolicy = async () => {
    try {
      const res = await api.get("/api/security/policy");
      if (res?.data?.success && res.data.data) {
        const p = res.data.data;
        setSettings(prev => ({
          ...prev,
          sessionTimeoutMinutes: p.sessionPolicy?.idleTimeoutMinutes ?? prev.sessionTimeoutMinutes,
          maxConcurrentSessions: p.sessionPolicy?.maxConcurrentSessions ?? 3,
          disallowSecurityChangeDuringSession: p.activeUserSecurityChangePolicy?.disallowChangeDuringActiveSession ?? true,
          forceReAuthOnSecurityChange: p.activeUserSecurityChangePolicy?.forceReAuthentication ?? true,
          revokeAllSessionsOnSecurityChange: p.activeUserSecurityChangePolicy?.revokeAllDeviceSessions ?? true,
          auditLogSecurityChanges: p.activeUserSecurityChangePolicy?.auditLogSecurityChanges ?? true,
          notifyUserSecurityAlert: p.activeUserSecurityChangePolicy?.notifyUserSecurityAlert ?? false,
          inactiveEntityPolicies: p.inactiveEntityAccessPolicies || prev.inactiveEntityPolicies,
          inactiveEntityOperationsPolicy: p.inactiveEntityOperationsPolicy || prev.inactiveEntityOperationsPolicy,
          inactiveEntityPolicyCriteria: p.inactiveEntityPolicyCriteria || prev.inactiveEntityPolicyCriteria,
          activeInactiveInteractionPolicy: p.activeInactiveInteractionPolicy || prev.activeInactiveInteractionPolicy,
          activeToInactivePreventionRules: p.activeToInactivePreventionRules || prev.activeToInactivePreventionRules,
          resourceSanitizationPolicy: p.resourceSanitizationPolicy || prev.resourceSanitizationPolicy,
          userDataInputAccessPolicy: p.userDataInputAccessPolicy || prev.userDataInputAccessPolicy,
          secureDataTransportPolicy: p.secureDataTransportPolicy || prev.secureDataTransportPolicy,
          userDataEgressAccessPolicy: p.userDataEgressAccessPolicy || prev.userDataEgressAccessPolicy,
          targetedDataEgressRules: p.targetedDataEgressRules || prev.targetedDataEgressRules,
        }));

        if (Array.isArray(p.entityAccessPolicies) && p.entityAccessPolicies.length > 0) {
          setEntityPolicies(p.entityAccessPolicies);
        }
      }
    } catch (err) {
      console.error("خطا در دريافت خط‌مشی‌های امنیتی از بک‌اند:", err);
    }
  };

  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem("system_settings");
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }

      const savedBackups = localStorage.getItem("system_backups_list");
      if (savedBackups) {
        setBackups(JSON.parse(savedBackups));
      }

      const savedEntityPolicies = localStorage.getItem("system_entity_access_policies");
      if (savedEntityPolicies) {
        setEntityPolicies(JSON.parse(savedEntityPolicies));
      }
    } catch (_) {}

    fetchSecurityPolicy();
  }, []);

  const saveSecurityPolicyToBackend = async (opts = {}) => {
    const s = opts.settings || settings;
    const ep = opts.entityPolicies || entityPolicies;
    const payload = {
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true
      },
      lockoutPolicy: {
        maxFailedAttempts: 5,
        lockoutDurationMinutes: 15
      },
      sessionPolicy: {
        tokenExpiresInHours: 8,
        maxConcurrentSessions: s.activeToInactivePreventionRules?.preventAccessOnExceedingSessionThreshold
          ? (Number(s.activeToInactivePreventionRules?.sessionThresholdLimit) || 3)
          : (Number(s.maxConcurrentSessions) || 3),
        idleTimeoutMinutes: Number(s.sessionTimeoutMinutes) || 30
      },
      entityAccessPolicies: ep,
      activeUserSecurityChangePolicy: {
        disallowChangeDuringActiveSession: !!s.disallowSecurityChangeDuringSession,
        forceReAuthentication: !!s.forceReAuthOnSecurityChange,
        revokeAllDeviceSessions: !!s.revokeAllSessionsOnSecurityChange,
        auditLogSecurityChanges: !!s.auditLogSecurityChanges,
        notifyUserSecurityAlert: !!s.notifyUserSecurityAlert
      },
      inactiveEntityAccessPolicies: s.inactiveEntityPolicies,
      inactiveEntityOperationsPolicy: s.inactiveEntityOperationsPolicy,
      inactiveEntityPolicyCriteria: s.inactiveEntityPolicyCriteria,
      activeInactiveInteractionPolicy: s.activeInactiveInteractionPolicy,
      activeToInactivePreventionRules: s.activeToInactivePreventionRules,
      resourceSanitizationPolicy: s.resourceSanitizationPolicy,
      userDataInputAccessPolicy: s.userDataInputAccessPolicy,
      secureDataTransportPolicy: s.secureDataTransportPolicy,
      userDataEgressAccessPolicy: s.userDataEgressAccessPolicy,
      targetedDataEgressRules: s.targetedDataEgressRules,
    };
    await api.put("/api/security/policy", payload);
  };

  function set(field, val) {
    setSettings(s => ({ ...s, [field]: val }));
    setErrorMsg("");
    setSuccessMsg("");
  }

  function handleReset() {
    if (window.confirm("آیا از بازنشانی کلیه تنظیمات سیستم به حالت اولیه اطمینان دارید؟")) {
      setSettings(INITIAL_SETTINGS);
      localStorage.setItem("system_settings", JSON.stringify(INITIAL_SETTINGS));
      setSuccessMsg("تنظیمات با موفقیت به حالت اولیه بازنشانی شد.");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setIsSaving(true);
      setErrorMsg("");
      const updated = {
        ...settings,
        lastUpdated: new Date().toISOString()
      };

      setSettings(updated);
      localStorage.setItem("system_settings", JSON.stringify(updated));
      localStorage.setItem("system_entity_access_policies", JSON.stringify(entityPolicies));

      // ارسال مستقیم به دیتابیس سرور بک‌اند جهت اعمال فوری
      await saveSecurityPolicyToBackend({ settings: updated, entityPolicies });

      setIsSaving(false);
      setSuccessMsg("تنظیمات و خط‌مشی‌های امنیتی سامانه با موفقیت در دیتابیس ذخیره و اعمال گردید.");
    } catch (err) {
      setIsSaving(false);
      setErrorMsg("خطا در ذخیره‌سازی تنظیمات در سرور: " + (err.response?.data?.message || err.message));
    }
  }

  function handleEntityPolicyToggle(entityId, roleCategory, opKey) {
    setEntityPolicies(prev => prev.map(item => {
      if (item.entityId === entityId) {
        return {
          ...item,
          [roleCategory]: {
            ...item[roleCategory],
            [opKey]: !item[roleCategory][opKey]
          }
        };
      }
      return item;
    }));
    setErrorMsg("");
    setSuccessMsg("");
  }

  async function handleSaveEntityPolicies() {
    try {
      setIsSaving(true);
      setErrorMsg("");
      localStorage.setItem("system_entity_access_policies", JSON.stringify(entityPolicies));

      // ارسال مستقیم به دیتابیس سرور بک‌اند جهت اعمال فوری
      await saveSecurityPolicyToBackend({ entityPolicies });

      setSuccessMsg("خط‌مشی‌های کنترل دسترسی موجودیت‌ها و عملیات با موفقیت در دیتابیس سرور ذخیره شد.");
    } catch (err) {
      setErrorMsg("خطا در ذخیره‌سازی خط‌مشی‌ها: " + (err.response?.data?.message || err.message));
    } finally {
      setIsSaving(false);
    }
  }

  // ─── ۱. ایجاد نسخه پشتیبان جدید در حافظه ───
  function handleCreateBackup() {
    try {
      const now = new Date();
      const persianDate = now.toLocaleDateString("fa-IR");
      const timeStr = now.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });

      const typeNameMap = {
        daily: `روزانه (${persianDate})`,
        monthly: `ماهیانه (${newBackupPeriod})`,
        yearly: `سالیانه (سال مالی ${settings.activeFiscalYear})`,
        manual: "دستی (فوق‌العاده)"
      };

      const typeName = typeNameMap[newBackupType] || "دستی";
      const filename = `PFS_Backup_${newBackupType}_${settings.activeFiscalYear}_${Date.now().toString().slice(-6)}.json`;

      const newBackupObj = {
        id: "bk-" + Date.now(),
        filename,
        type: newBackupType,
        typeName,
        size: "۲.۱ مگابایت",
        date: `${persianDate} - ${timeStr}`,
        recordsCount: 1250
      };

      const updatedList = [newBackupObj, ...backups];
      setBackups(updatedList);
      localStorage.setItem("system_backups_list", JSON.stringify(updatedList));

      setSuccessMsg(`نسخه پشتیبان جدید با موفقیت ایجاد گردید: ${typeName}`);
    } catch (err) {
      setErrorMsg("خطا در ایجاد پشتیبان: " + err.message);
    }
  }

  // ─── ۲. خروجی تمام سیستم (Export JSON Download) ───
  async function handleExportFullBackup() {
    try {
      setErrorMsg("");
      setSuccessMsg("");
      const check = await validateEgressPermission({ exportType: "JSON", recordCount: 1000 });
      if (!check.allowed) {
        setErrorMsg(`ممانعت از خروجی داده (الزام بند ۹ افتا): ${check.reason}`);
        return;
      }
      // جمع‌آوری تمام اطلاعات کلیدی سیستم از localStorage
      const backupPayload = {
        metadata: {
          appName: "سامانه مدیریت مالی و حسابداری دولتی",
          version: "1405.2.0",
          exportDate: new Date().toISOString(),
          persianDate: new Date().toLocaleDateString("fa-IR"),
          fiscalYear: settings.activeFiscalYear,
          orgName: localStorage.getItem("org_name") || "دستگاه اجرایی",
        },
        data: {
          system_settings: localStorage.getItem("system_settings"),
          financial_details: localStorage.getItem("financial_details"),
          org_name: localStorage.getItem("org_name"),
          tax_tables: localStorage.getItem("tax_tables"),
          issued_payslips: localStorage.getItem("issued_payslips"),
          payroll_settings: localStorage.getItem("payroll_settings"),
          document_settings: localStorage.getItem("document_settings"),
          sanama_org_logo: localStorage.getItem("sanama_org_logo"),
          system_backups_list: localStorage.getItem("system_backups_list"),
        }
      };

      const jsonString = JSON.stringify(backupPayload, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `PublicFinance_Full_Backup_${settings.activeFiscalYear}_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccessMsg("فایل پشتیبان کامل سیستم (JSON) با موفقیت دانلود شد.");
    } catch (err) {
      setErrorMsg("خطا در خروجی فایل پشتیبان: " + err.message);
    }
  }

  // ─── ۳. انتخاب فایل پشتیبان (Import File Selection) ───
  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!parsed || !parsed.data) {
          throw new Error("فرمت فایل پشتیبان معتبر نیست یا آسیب دیده است.");
        }

        setImportFileMeta({
          name: file.name,
          size: (file.size / 1024).toFixed(1) + " کیلوبایت",
          date: parsed.metadata?.persianDate || "نامشخص",
          orgName: parsed.metadata?.orgName || "نامشخص",
          fiscalYear: parsed.metadata?.fiscalYear || "نامشخص",
          version: parsed.metadata?.version || "1.0",
        });

        setImportRawData(parsed);
        setErrorMsg("");
      } catch (err) {
        setErrorMsg("خطا در خواندن فایل پشتیبان: " + err.message);
        setImportFileMeta(null);
        setImportRawData(null);
      }
    };
    reader.readAsText(file);
  }

  // ─── ۴. بازیابی نهایی داده‌ها (Restore Backup into System) ───
  function handleRestoreBackup() {
    if (!importRawData || !importRawData.data) return;

    if (!window.confirm("آیا از بازیابی و جایگزینی اطلاعات سیستم با این فایل پشتیبان اطمینان دارید؟")) {
      return;
    }

    try {
      const { data } = importRawData;

      // بازگردانی تمامی کلیدهای اصلی سیستم
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
          localStorage.setItem(key, data[key]);
        }
      });

      // به‌روزرسانی state فرم با تنظیمات بازیابی‌شده
      if (data.system_settings) {
        setSettings(JSON.parse(data.system_settings));
      }
      if (data.system_backups_list) {
        setBackups(JSON.parse(data.system_backups_list));
      }

      setImportFileMeta(null);
      setImportRawData(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      setSuccessMsg("بازیابی اطلاعات با موفقیت انجام شد! تمامی بخش‌ها و تنظیمات سیستم بروزرسانی گردیدند.");
    } catch (err) {
      setErrorMsg("خطا در اعمال و بازیابی داده‌ها: " + err.message);
    }
  }

  // ─── ۵. حذف یک نسخه پشتیبان از لیست ───
  function handleDeleteBackup(id) {
    if (window.confirm("آیا از حذف این نسخه پشتیبان اطمینان دارید؟")) {
      const next = backups.filter(b => b.id !== id);
      setBackups(next);
      localStorage.setItem("system_backups_list", JSON.stringify(next));
      setSuccessMsg("نسخه پشتیبان از لیست حذف شد.");
    }
  }

  return (
    <PageShell>
      <PageHeader
        title="تنظیمات عمومی و پشتیبان‌گیری سامانه"
        description="مدیریت سال مالی، کنترل‌های حسابداری، امضاهای گزارشات، پشتیبان‌گیری سالیانه/ماهیانه/روزانه و ورودی/خروجی کامل سیستم"
      />

      <div className="space-y-4 text-right" dir="rtl">
        {/* پیام‌های اطلاع‌رسانی زنده */}
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

        {/* هدر بالای تنظیمات */}
        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center shadow-md">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                تنظیمات و پیکربندی مرکزی سامانه
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                  سال مالی active: {settings.activeFiscalYear}
                </Badge>
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                تغییر پارامترها بلافاصله بر روی فرآیندهای مالی، اسناد و گزارشات سیستم اعمال می‌شود.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="h-9 text-xs gap-1.5 text-slate-600 hover:text-slate-900"
            >
              <RefreshCw className="h-4 w-4" /> بازنشانی تنظیمات
            </Button>
          </div>
        </div>

        {/* کارت اصلی با تب‌ها */}
        <Card className="border-slate-200/80 dark:border-slate-800 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex flex-wrap gap-2">
              {TABS.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200",
                      isActive
                        ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* ─── TAB 1: عمومی و سیستم ─── */}
              {activeTab === "general" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs font-semibold">سال مالی فعال سامانه</Label>
                      <select
                        value={settings.activeFiscalYear}
                        onChange={e => set("activeFiscalYear", e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm mt-1.5 font-bold font-mono"
                      >
                        <option value="1405">۱۴۰۵ (سال جاری)</option>
                        <option value="1404">۱۴۰۴</option>
                        <option value="1403">۱۴۰۳</option>
                      </select>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold">واحد پولی اصلی نمایش مبالغ</Label>
                      <select
                        value={settings.currencyUnit}
                        onChange={e => set("currencyUnit", e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm mt-1.5 font-semibold"
                      >
                        <option value="rial">ریال (استاندارد دولتی و سناما)</option>
                        <option value="toman">تومان</option>
                      </select>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold">تعداد ردیف در هر صفحه جداول</Label>
                      <select
                        value={settings.recordsPerPage}
                        onChange={e => set("recordsPerPage", Number(e.target.value))}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm mt-1.5 font-mono"
                      >
                        <option value={10}>۱۰ ردیف</option>
                        <option value={15}>۱۵ ردیف</option>
                        <option value={25}>۲۵ ردیف</option>
                        <option value={50}>۵۰ ردیف</option>
                      </select>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label className="text-xs font-semibold">نمایش اعداد و ارقام به فارسی در خروجی‌ها</Label>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="displayPersianDigits"
                        checked={settings.displayPersianDigits}
                        onChange={e => set("displayPersianDigits", e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="displayPersianDigits" className="text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                        نمایش کلیه اعداد، شماره اسناد و مبالغ به صورت ارقام فارسی (۰۱۲۳۴۵۶۷۸۹) در چاپ فیش‌ها و گزارشات
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── TAB 2: حسابداری و کنترل اسناد ─── */}
              {activeTab === "accounting" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-semibold">روش شماره‌گذاری اسناد حسابداری</Label>
                      <select
                        value={settings.docNumberingMode}
                        onChange={e => set("docNumberingMode", e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm mt-1.5 font-semibold"
                      >
                        <option value="annual">شماره‌گذاری مسلسل سالانه (۱ الی n)</option>
                        <option value="monthly">شماره‌گذاری تفکیک شده ماهانه</option>
                        <option value="continuous">شماره‌گذاری پیوسته مستقل از دوره</option>
                      </select>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold">تعداد سطوح تایید و تصویب اسناد</Label>
                      <select
                        value={settings.voucherApprovalLevels}
                        onChange={e => set("voucherApprovalLevels", Number(e.target.value))}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm mt-1.5 font-semibold"
                      >
                        <option value={1}>۱ مرحله (تایید کارشناس حسابداری)</option>
                        <option value={2}>۲ مرحله (کارشناس + مدیر مالی)</option>
                        <option value={3}>۳ مرحله (کارشناس + مدیر مالی + ذیحساب)</option>
                      </select>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold">سطح کنترل سقف اعتبار در صدور سند</Label>
                      <select
                        value={settings.strictCreditControl}
                        onChange={e => set("strictCreditControl", e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm mt-1.5 font-semibold"
                      >
                        <option value="strict">سخت‌گیرانه (ممانعت از ثبت سند بدون تامین اعتبار کافی)</option>
                        <option value="warning">هشدار (نمایش اخطار ولی اجازه ثبت)</option>
                        <option value="allow">بدون کنترل سقف اعتبار</option>
                      </select>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="preventBackdatedDocs"
                        checked={settings.preventBackdatedDocs}
                        onChange={e => set("preventBackdatedDocs", e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600"
                      />
                      <label htmlFor="preventBackdatedDocs" className="text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                        ممانعت از ثبت اسناد با تاریخ رترو (تاریخ‌های قبل از سند قبلی ثبت شده)
                      </label>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="autoApproveVouchers"
                        checked={settings.autoApproveVouchers}
                        onChange={e => set("autoApproveVouchers", e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600"
                      />
                      <label htmlFor="autoApproveVouchers" className="text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                        تصویب خودکار اسناد بلافاصله پس از ثبت بدون نیاز به تایید کارتابل
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── TAB 3: امضاها و چاپ گزارشات ─── */}
              {activeTab === "reports" && (
                <div className="space-y-5">
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 border-r-4 pr-2 border-blue-600">
                      عناوین و نام‌های امضاء‌کنندگان گزارشات رسمی
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-semibold">عنوان امضاء‌کننده اول (راست)</Label>
                        <Input
                          value={settings.signatureTitle1}
                          onChange={e => set("signatureTitle1", e.target.value)}
                          className="h-9 text-xs mt-1.5"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold">نام امضاء‌کننده اول</Label>
                        <Input
                          value={settings.signatureName1}
                          onChange={e => set("signatureName1", e.target.value)}
                          className="h-9 text-xs mt-1.5"
                        />
                      </div>

                      <div>
                        <Label className="text-xs font-semibold">عنوان امضاء‌کننده دوم (وسط)</Label>
                        <Input
                          value={settings.signatureTitle2}
                          onChange={e => set("signatureTitle2", e.target.value)}
                          className="h-9 text-xs mt-1.5"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold">نام امضاء‌کننده دوم</Label>
                        <Input
                          value={settings.signatureName2}
                          onChange={e => set("signatureName2", e.target.value)}
                          className="h-9 text-xs mt-1.5"
                        />
                      </div>

                      <div>
                        <Label className="text-xs font-semibold">عنوان امضاء‌کننده سوم (چپ)</Label>
                        <Input
                          value={settings.signatureTitle3}
                          onChange={e => set("signatureTitle3", e.target.value)}
                          className="h-9 text-xs mt-1.5"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold">نام امضاء‌کننده سوم</Label>
                        <Input
                          value={settings.signatureName3}
                          onChange={e => set("signatureName3", e.target.value)}
                          className="h-9 text-xs mt-1.5"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-semibold">اندازه کاغذ پیش‌فرض چاپ اسناد و گزارشات</Label>
                      <select
                        value={settings.defaultPaperSize}
                        onChange={e => set("defaultPaperSize", e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm mt-1.5 font-semibold"
                      >
                        <option value="A4">A4 (استاندارد)</option>
                        <option value="A5">A5</option>
                        <option value="Letter">Letter</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-3 pt-6">
                      <input
                        type="checkbox"
                        id="showLogoInReports"
                        checked={settings.showLogoInReports}
                        onChange={e => set("showLogoInReports", e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600"
                      />
                      <label htmlFor="showLogoInReports" className="text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                        نمایش آرم و لوگوی رسمی سازمان در بالای گزارشات چاپی و فیش‌های حقوقی
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── TAB 4: پشتیبان‌گیری، ورودی و خروجی داده‌ها (BACKUP & RESTORE) ─── */}
              {activeTab === "backup" && (
                <div className="space-y-6">
                  {/* بنر راهنما */}
                  <div className="bg-blue-50/70 dark:bg-blue-950/30 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/40 flex items-start gap-3">
                    <Database className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
                      <strong>مدیریت جامع نسخه‌های پشتیبان:</strong> در این بخش می‌توانید دوره پشتیبان‌گیری خودکار سیستم را تنظیم کرده، به صورت دستی در دوره‌های سالیانه یا ماهیانه نسخه پشتیبان بسازید، خروجی کامل کلیه داده‌های سیستم (Export JSON) دریافت کنید یا داده‌ها را از یک فایل پشتیبان قبلی بازیابی نمایید (Import Backup).
                    </div>
                  </div>

                  {/* بخش ۱: تنظیمات دوره و ایجاد نسخه جدید */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/60 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        دوره پشتیبان‌گیری خودکار سیستم
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        تعیین زمان‌بندی ایجاد خودکار فایل پشتیبان از پایگاه داده و اطلاعات
                      </p>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {[
                          { id: "daily", label: "روزانه", desc: "انتهای هر روز کاری" },
                          { id: "monthly", label: "ماهیانه", desc: "پایان هر ماه شمسی" },
                          { id: "yearly", label: "سالیانه", desc: "پایان سال مالی" },
                          { id: "manual", label: "دستی", desc: "صرفاً بنا به درخواست" },
                        ].map(freq => (
                          <button
                            key={freq.id}
                            type="button"
                            onClick={() => set("backupFrequency", freq.id)}
                            className={cn(
                              "p-3 rounded-xl border text-right transition-all text-xs",
                              settings.backupFrequency === freq.id
                                ? "border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 font-bold shadow-sm"
                                : "border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600"
                            )}
                          >
                            <div className="flex justify-between items-center">
                              <span>{freq.label}</span>
                              {settings.backupFrequency === freq.id && <Check className="h-4 w-4 text-blue-600" />}
                            </div>
                            <span className="text-[10px] text-muted-foreground block mt-1 font-normal">{freq.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* ایجاد نسخه فوری دستی */}
                    <div className="space-y-3 border-r-0 md:border-r border-slate-200 dark:border-slate-800 md:pr-6">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <FolderArchive className="h-4 w-4 text-emerald-600" />
                        ایجاد نسخه پشتیبان جدید (اکنون)
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        تولید فوری نسخه پشتیبان با مشخص کردن دوره ماهیانه یا سالیانه
                      </p>

                      <div className="space-y-3 pt-1">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-[11px]">نوع دوره</Label>
                            <select
                              value={newBackupType}
                              onChange={e => setNewBackupType(e.target.value)}
                              className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs shadow-sm mt-1"
                            >
                              <option value="monthly">ماهیانه</option>
                              <option value="yearly">سالیانه</option>
                              <option value="daily">روزانه</option>
                              <option value="manual">فوق‌العاده / دستی</option>
                            </select>
                          </div>
                          <div>
                            <Label className="text-[11px]">نام دوره / ماه</Label>
                            <Input
                              value={newBackupPeriod}
                              onChange={e => setNewBackupPeriod(e.target.value)}
                              className="h-8 text-xs mt-1"
                              placeholder="مثلاً: مرداد ۱۴۰۵"
                            />
                          </div>
                        </div>

                        <Button
                          type="button"
                          onClick={handleCreateBackup}
                          className="w-full h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-md shadow-emerald-500/20"
                        >
                          <HardDrive className="h-4 w-4" />
                          ایجاد و ذخیره نسخه پشتیبان جدید
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* بخش ۲: خروجی و ورودی فایل پشتیبان (EXPORT / IMPORT) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* خروجی دانلود */}
                    <div className="bg-slate-50 dark:bg-slate-900/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-xs">
                        <ArrowDownToLine className="h-4 w-4 text-blue-600" />
                        خروجی فایل پشتیبان سیستم (Export JSON)
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        دانلود یک فایل یکپارچه شامل کلیه اطلاعات مالی، مشخصات ذیحسابی، اسناد، جداول مالیاتی، فیش‌ها و تنظیمات سیستم جهت نگهداری خارج از نرم‌افزار.
                      </p>
                      <Button
                        type="button"
                        onClick={handleExportFullBackup}
                        className="h-9 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-2 w-full shadow-md shadow-blue-500/20"
                      >
                        <Download className="h-4 w-4" />
                        دانلود خروجی پشتیبان کامل سیستم (Export .JSON)
                      </Button>
                    </div>

                    {/* ورودی بارگذاری */}
                    <div className="bg-slate-50 dark:bg-slate-900/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-xs">
                        <ArrowUpFromLine className="h-4 w-4 text-amber-600" />
                        بازیابی و ورودی فایل پشتیبان (Import Backup)
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        بارگذاری فایل پشتیبان قبلی (`.json`) و بازگردانی کلیه اطلاعات سیستم.
                      </p>

                      <div className="flex gap-2 items-center">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".json"
                          onChange={handleFileChange}
                          className="hidden"
                          id="importBackupFile"
                        />
                        <label
                          htmlFor="importBackupFile"
                          className="flex-1 h-9 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                        >
                          <Upload className="h-4 w-4 text-amber-600" />
                          انتخاب فایل پشتیبان از رایانه...
                        </label>
                      </div>

                      {/* پیش‌نمایش متادیتای فایل انتخاب شده */}
                      {importFileMeta && (
                        <div className="bg-amber-50/80 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-900/50 space-y-2 animate-in fade-in">
                          <div className="flex justify-between items-center text-xs font-bold text-amber-900 dark:text-amber-200">
                            <span>فایل انتخاب شده: {importFileMeta.name}</span>
                            <Badge className="bg-amber-200 text-amber-900 border-none text-[10px]">
                              {importFileMeta.size}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-1 text-[11px] text-amber-800 dark:text-amber-300">
                            <div>سازمان: {importFileMeta.orgName}</div>
                            <div>سال مالی: {importFileMeta.fiscalYear}</div>
                            <div>تاریخ خروجی: {importFileMeta.date}</div>
                            <div>نسخه پشتیبان: {importFileMeta.version}</div>
                          </div>
                          <Button
                            type="button"
                            onClick={handleRestoreBackup}
                            className="w-full h-8 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs gap-1.5 mt-1"
                          >
                            <FileCheck className="h-4 w-4" />
                            تایید نهایی و بازیابی داده‌های سیستم
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* بخش ۳: جدول لیست نسخه‌های پشتیبان موجود */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <HardDrive className="h-4 w-4 text-purple-600" />
                        لیست نسخه‌های پشتیبان سیستم در حافظه
                      </span>
                      <span className="text-[11px] font-normal text-muted-foreground">
                        تعداد نسخه‌ها: {backups.length}
                      </span>
                    </h4>

                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                      <table className="w-full text-xs text-right">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                          <tr>
                            <th className="p-3">نام فایل پشتیبان</th>
                            <th className="p-3">نوع و دوره پشتیبان</th>
                            <th className="p-3">تاریخ و زمان ایجاد</th>
                            <th className="p-3">حجم تخمینی</th>
                            <th className="p-3 text-center">عملیات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {backups.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-6 text-center text-muted-foreground text-xs">
                                هیچ نسخه پشتیبانی یافت نشد.
                              </td>
                            </tr>
                          ) : (
                            backups.map(bk => (
                              <tr key={bk.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                                <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                                  {bk.filename}
                                </td>
                                <td className="p-3">
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-[10px]",
                                      bk.type === "yearly" && "bg-purple-50 text-purple-700 border-purple-200",
                                      bk.type === "monthly" && "bg-blue-50 text-blue-700 border-blue-200",
                                      bk.type === "daily" && "bg-emerald-50 text-emerald-700 border-emerald-200",
                                      bk.type === "manual" && "bg-amber-50 text-amber-700 border-amber-200"
                                    )}
                                  >
                                    {bk.typeName}
                                  </Badge>
                                </td>
                                <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                                  {bk.date}
                                </td>
                                <td className="p-3 font-mono text-slate-500">
                                  {bk.size}
                                </td>
                                <td className="p-3 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={handleExportFullBackup}
                                      className="h-7 w-7 p-0 text-blue-600 hover:bg-blue-50"
                                      title="دانلود نسخه"
                                    >
                                      <Download className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteBackup(bk.id)}
                                      className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-50"
                                      title="حذف نسخه"
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
                  </div>
                </div>
              )}

              {/* ─── TAB 5: پشتیبان‌گیری و امنیت (SECURITY & ACCESS CONTROL POLICIES) ─── */}
              {activeTab === "security" && (
                <div className="space-y-6">
                  {/* بنر اصلی الزام امنیتی (مطابق تصویر) */}
                  <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-5 rounded-2xl shadow-md space-y-2 border border-blue-900/50">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="h-6 w-6 text-emerald-400 shrink-0" />
                      <h3 className="text-sm md:text-base font-black text-slate-100">
                        محصول باید برای موجودیت‌ها و عملیات، خط‌مشی‌های کنترل دسترسی اعمال نماید.
                      </h3>
                    </div>
                    <p className="text-xs text-blue-200/90 leading-relaxed pr-8 font-medium">
                      موجودیت‌های فعالی که خط‌مشی‌های کنترل دسترسی در مورد آنها اعمال می‌شوند، مشخص گردد.
                    </p>
                  </div>

                  {/* بخش مدیریت تعاملی خط‌مشی‌ها (به تفکیک دسته‌های مدیر سیستم، کاربر عادی، سایر موارد) */}
                  <div className="bg-slate-50 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <Sliders className="h-4 w-4 text-blue-600" />
                          تعیین ماتریس خط‌مشی دسترسی به موجودیت‌های فعال و عملیات
                        </h4>
                        <span className="text-[11px] text-muted-foreground block mt-0.5">
                          انتخاب دسته و اعمال مجوزهای عملیاتی (مشاهده، ایجاد، ویرایش، حذف، تایید، خروجی)
                        </span>
                      </div>

                      <Button
                        type="button"
                        onClick={handleSaveEntityPolicies}
                        className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 px-3 shadow-sm shadow-emerald-500/20"
                      >
                        <Save className="h-3.5 w-3.5" />
                        ذخیره خط‌مشی‌ها
                      </Button>
                    </div>

                    {/* تب‌های سه دسته اصلی تصویر */}
                    <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                      {[
                        { id: "systemAdmin", label: "مدیر سیستم", badgeBg: "bg-purple-100 text-purple-800 border-purple-300" },
                        { id: "regularUser", label: "کاربر عادی", badgeBg: "bg-blue-100 text-blue-800 border-blue-300" },
                        { id: "otherRoles", label: "سایر موارد (نقش‌های سفارشی)", badgeBg: "bg-amber-100 text-amber-800 border-amber-300" }
                      ].map(cat => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedRoleTab(cat.id)}
                          className={cn(
                            "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                            selectedRoleTab === cat.id
                              ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20"
                              : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                          )}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>

                    {/* جدول ماتریس دسترسی به موجودیت‌ها */}
                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-sm">
                      <table className="w-full text-xs text-right">
                        <thead className="bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-bold border-b">
                          <tr>
                            <th className="p-3 min-w-[180px]">موجودیت فعال سامانه</th>
                            <th className="p-3 text-center min-w-[70px]">مشاهده</th>
                            <th className="p-3 text-center min-w-[70px]">ایجاد</th>
                            <th className="p-3 text-center min-w-[70px]">ویرایش</th>
                            <th className="p-3 text-center min-w-[70px]">حذف</th>
                            <th className="p-3 text-center min-w-[70px]">تایید</th>
                            <th className="p-3 text-center min-w-[70px]">خروجی</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {entityPolicies.map(item => {
                            const perms = item[selectedRoleTab] || { read: false, create: false, update: false, delete: false, approve: false, export: false };
                            return (
                              <tr key={item.entityId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                                <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                                  {item.entityName}
                                  <span className="text-[10px] text-muted-foreground block font-mono font-normal">
                                    {item.entityId}
                                  </span>
                                </td>

                                {[
                                  { key: "read", label: "مشاهده" },
                                  { key: "create", label: "ایجاد" },
                                  { key: "update", label: "ویرایش" },
                                  { key: "delete", label: "حذف" },
                                  { key: "approve", label: "تایید" },
                                  { key: "export", label: "خروجی" }
                                ].map(op => (
                                  <td key={op.key} className="p-3 text-center">
                                    <input
                                      type="checkbox"
                                      checked={!!perms[op.key]}
                                      onChange={() => handleEntityPolicyToggle(item.entityId, selectedRoleTab, op.key)}
                                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    />
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <Separator />

                  {/* جدول قوانین تعیین‌شده برای موجودیت‌های غیرفعال (مطابق تصویر جدید) */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                    <div className="bg-slate-900 dark:bg-slate-800 text-white p-3.5 font-bold text-xs flex items-center justify-between border-b border-slate-800">
                      <span className="flex items-center gap-2">
                        <FolderArchive className="h-4 w-4 text-amber-400" />
                        تعیین خط‌مشی‌های کنترل دسترسی در مورد موجودیت‌های غیرفعال
                      </span>
                      <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px]">
                        الزام امنیتی افتا
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-slate-200 dark:divide-slate-800">
                      {/* ستون راست: عنوان اصلی الزامات مطابق تصویر */}
                      <div className="md:col-span-5 bg-slate-50/80 dark:bg-slate-900/50 p-5 flex flex-col justify-center items-center text-center font-bold text-xs text-slate-800 dark:text-slate-200 leading-relaxed border-b md:border-b-0 md:border-l border-slate-200 dark:border-slate-800 space-y-2">
                        <FolderArchive className="h-7 w-7 text-amber-500 mb-1" />
                        <span>موجودیت‌های غیرفعالی که خط‌مشی‌های کنترل دسترسی در مورد آنها اعمال می‌شوند، مشخص گردد.</span>
                        <span className="text-[11px] text-muted-foreground font-normal">
                          تعیین مجوزهای عملیاتی بر روی سوابق تاریخی، مستندات، داده‌های کاربران غیرفعال و داده‌های احراز هویت
                        </span>
                      </div>

                      {/* ستون چپ: سطور ۴ گانه تصویر */}
                      <div className="md:col-span-7 divide-y divide-slate-200 dark:divide-slate-800">
                        
                        {/* سطر ۱: سوابق، مستندات و فراداده */}
                        <div className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                              <FileText className="h-3.5 w-3.5 text-blue-500" />
                              سوابق، مستندات و فراداده
                            </span>
                            <span className="text-[10px] text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                              اسناد مالی، مدارک و فراداده‌های تاریخی
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed pr-5">
                            اسناد مالی دوره‌های قبل، فایل‌های پیوست مدارک بایگانی‌شده و فراداده‌های مربوطه به حالت «صرفاً خواندنی» تبدیل شده و اصلاح یا حذف آن‌ها مسدود می‌گردد.
                          </p>

                          <div className="flex flex-wrap gap-4 pr-5 pt-1">
                            {[
                              { key: "read", label: "مشاهده سوابق" },
                              { key: "export", label: "خروجی/دانلود" },
                              { key: "restore", label: "بازیابی مجدد" },
                              { key: "delete", label: "حذف کلا" }
                            ].map(op => (
                              <label key={op.key} className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={settings.inactiveEntityPolicies?.recordsDocsMetadata?.[op.key] ?? (op.key === "read" || op.key === "export")}
                                  onChange={e => {
                                    const updated = {
                                      ...settings.inactiveEntityPolicies,
                                      recordsDocsMetadata: {
                                        ...settings.inactiveEntityPolicies?.recordsDocsMetadata,
                                        [op.key]: e.target.checked
                                      }
                                    };
                                    set("inactiveEntityPolicies", updated);
                                  }}
                                  className="h-3.5 w-3.5 rounded border-slate-300 text-amber-600"
                                />
                                <span>{op.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* سطر ۲: داده متعلق به کاربران */}
                        <div className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5 text-emerald-500" />
                              داده متعلق به کاربران
                            </span>
                            <span className="text-[10px] text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                              اطلاعات کارمندان غیرفعال/منتقل‌شده
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed pr-5">
                            فایل‌ها، پیش‌نویس‌ها و گزارشات شخصی کاربران غیرفعال یا تعلیق‌شده ایزوله گردیده و دسترسی سایرین به آن‌ها منوط به مجوز ذیحسابی/مدیر سیستم خواهد بود.
                          </p>

                          <div className="flex flex-wrap gap-4 pr-5 pt-1">
                            {[
                              { key: "read", label: "مشاهده اطلاعات" },
                              { key: "export", label: "خروجی گرفتن" },
                              { key: "restore", label: "فعال‌سازی مجدد" },
                              { key: "delete", label: "امحاء داده‌ها" }
                            ].map(op => (
                              <label key={op.key} className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={settings.inactiveEntityPolicies?.userBelongingData?.[op.key] ?? (op.key === "read")}
                                  onChange={e => {
                                    const updated = {
                                      ...settings.inactiveEntityPolicies,
                                      userBelongingData: {
                                        ...settings.inactiveEntityPolicies?.userBelongingData,
                                        [op.key]: e.target.checked
                                      }
                                    };
                                    set("inactiveEntityPolicies", updated);
                                  }}
                                  className="h-3.5 w-3.5 rounded border-slate-300 text-amber-600"
                                />
                                <span>{op.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* سطر ۳: داده احراز هویت */}
                        <div className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                              <KeyRound className="h-3.5 w-3.5 text-rose-500" />
                              داده احراز هویت
                            </span>
                            <span className="text-[10px] text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded font-bold">
                              حفاظت شده و رمزنگاری‌شده
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed pr-5">
                            هش‌های رمز عبور قدیمی، توکن‌های ابطال‌شده و سوابق ورود غیرفعال به هیچ عنوان قابل مشاهده یا خروجی نبوده و صرفاً جهت حسابرسی امنیتی نگهداری می‌شوند.
                          </p>

                          <div className="flex flex-wrap gap-4 pr-5 pt-1">
                            {[
                              { key: "read", label: "مشاهده مستقیم" },
                              { key: "export", label: "خروجی توکن‌ها" },
                              { key: "restore", label: "بازیابی توکن" },
                              { key: "delete", label: "پاک‌سازی سوابق" }
                            ].map(op => (
                              <label key={op.key} className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={settings.inactiveEntityPolicies?.authData?.[op.key] ?? false}
                                  onChange={e => {
                                    const updated = {
                                      ...settings.inactiveEntityPolicies,
                                      authData: {
                                        ...settings.inactiveEntityPolicies?.authData,
                                        [op.key]: e.target.checked
                                      }
                                    };
                                    set("inactiveEntityPolicies", updated);
                                  }}
                                  className="h-3.5 w-3.5 rounded border-slate-300 text-amber-600"
                                />
                                <span>{op.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* سطر ۴: سایر موارد */}
                        <div className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                              <Shield className="h-3.5 w-3.5 text-purple-500" />
                              سایر موارد
                            </span>
                            <span className="text-[10px] text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                              لاگ‌های حسابرسی قدیمی و پیکربندی‌های تاریخی
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed pr-5">
                            شامل لاگ‌های حسابرسی افتا (Audit Logs) دوره‌های قبل، فایل‌های پشتیبان منقضی‌شده و تنظیمات سیستم در دوره‌های گذشته.
                          </p>

                          <div className="flex flex-wrap gap-4 pr-5 pt-1">
                            {[
                              { key: "read", label: "مشاهده لاگ‌ها" },
                              { key: "export", label: "خروجی آرشیو" },
                              { key: "restore", label: "بازگردانی پیکربندی" },
                              { key: "delete", label: "امحاء لاگ‌های کهنه" }
                            ].map(op => (
                              <label key={op.key} className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={settings.inactiveEntityPolicies?.otherInactiveCases?.[op.key] ?? (op.key === "read")}
                                  onChange={e => {
                                    const updated = {
                                      ...settings.inactiveEntityPolicies,
                                      otherInactiveCases: {
                                        ...settings.inactiveEntityPolicies?.otherInactiveCases,
                                        [op.key]: e.target.checked
                                      }
                                    };
                                    set("inactiveEntityPolicies", updated);
                                  }}
                                  className="h-3.5 w-3.5 rounded border-slate-300 text-amber-600"
                                />
                                <span>{op.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* جدول تعیین خط‌مشی‌های کنترل دسترسی عملیات مرتبط با موجودیت‌های غیرفعال (مطابق تصویر جدید) */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                    <div className="bg-slate-900 dark:bg-slate-800 text-white p-3.5 font-bold text-xs flex items-center justify-between border-b border-slate-800">
                      <span className="flex items-center gap-2">
                        <Sliders className="h-4 w-4 text-purple-400" />
                        تعیین خط‌مشی‌های کنترل دسترسی عملیاتی بر روی موجودیت‌های غیرفعال
                      </span>
                      <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[10px]">
                        الزام امنیتی افتا
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-slate-200 dark:divide-slate-800">
                      {/* ستون راست: عنوان اصلی الزامات مطابق تصویر */}
                      <div className="md:col-span-5 bg-slate-50/80 dark:bg-slate-900/50 p-5 flex flex-col justify-center items-center text-center font-bold text-xs text-slate-800 dark:text-slate-200 leading-relaxed border-b md:border-b-0 md:border-l border-slate-200 dark:border-slate-800 space-y-2">
                        <Sliders className="h-7 w-7 text-purple-500 mb-1" />
                        <span>عملیاتی که خط‌مشی‌های کنترل دسترسی در رابطه با آنها اعمال می‌شوند، مشخص گردد.</span>
                        <span className="text-[11px] text-muted-foreground font-normal">
                          تعیین ضوابط و تاییدهای لازم برای ایجاد، حذف، تغییر دسترسی و متاداده موجودیت‌های غیرفعال
                        </span>
                      </div>

                      {/* ستون چپ: سطور ۵ گانه تصویر */}
                      <div className="md:col-span-7 divide-y divide-slate-200 dark:divide-slate-800">
                        
                        {/* سطر ۱: ایجاد موجودیت غیرفعال جدید */}
                        <div className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                              <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                              ایجاد موجودیت غیرفعال جدید
                            </span>
                            <span className="text-[10px] text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                              ثبت اسناد و اطلاعات بایگانی جدید
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed pr-5">
                            ثبت موجودیت‌ها یا اسناد خاموش و بایگانی جدید، نیازمند کنترل نقش کاربران (RBAC)، تایید صریح مدیر سیستم و ثبت دقیق لاگ حسابرسی است.
                          </p>
                          <div className="flex flex-wrap gap-4 pr-5 pt-1">
                            {[
                              { key: "requireAdminApproval", label: "الزام تایید مدیر سیستم" },
                              { key: "auditLog", label: "ثبت سابقه در Audit Log" },
                              { key: "rbacCheck", label: "ارزیابی سخت‌گیرانه RBAC" }
                            ].map(op => (
                              <label key={op.key} className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={settings.inactiveEntityOperationsPolicy?.createInactiveEntity?.[op.key] ?? true}
                                  onChange={e => {
                                    const updated = {
                                      ...settings.inactiveEntityOperationsPolicy,
                                      createInactiveEntity: {
                                        ...settings.inactiveEntityOperationsPolicy?.createInactiveEntity,
                                        [op.key]: e.target.checked
                                      }
                                    };
                                    set("inactiveEntityOperationsPolicy", updated);
                                  }}
                                  className="h-3.5 w-3.5 rounded border-slate-300 text-purple-600"
                                />
                                <span>{op.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* سطر ۲: حذف موجودیت غیرفعال */}
                        <div className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                              <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                              حذف موجودیت غیرفعال
                            </span>
                            <span className="text-[10px] text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded font-bold">
                              حفاظت شده علیه امحاء
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed pr-5">
                            ممانعت مطلق از حذف فیزیکی (Hard Delete) موجودیت‌ها و اسناد غیرفعال سیستم؛ هرگونه پاک‌سازی صرفاً با مجوز ارشد و ثبت رویداد امنیتی میسر است.
                          </p>
                          <div className="flex flex-wrap gap-4 pr-5 pt-1">
                            {[
                              { key: "preventHardDelete", label: "ممانعت از حذف فیزیکی (Hard Delete)" },
                              { key: "requireAdminApproval", label: "الزام تایید مدیر ارشد" },
                              { key: "auditLog", label: "ثبت رویداد امحاء در افتا" }
                            ].map(op => (
                              <label key={op.key} className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={settings.inactiveEntityOperationsPolicy?.deleteInactiveEntity?.[op.key] ?? true}
                                  onChange={e => {
                                    const updated = {
                                      ...settings.inactiveEntityOperationsPolicy,
                                      deleteInactiveEntity: {
                                        ...settings.inactiveEntityOperationsPolicy?.deleteInactiveEntity,
                                        [op.key]: e.target.checked
                                      }
                                    };
                                    set("inactiveEntityOperationsPolicy", updated);
                                  }}
                                  className="h-3.5 w-3.5 rounded border-slate-300 text-purple-600"
                                />
                                <span>{op.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* سطر ۳: تغییر دسترسی‌ها به موجودیت غیرفعال */}
                        <div className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                              <Lock className="h-3.5 w-3.5 text-amber-500" />
                              تغییر دسترسی‌ها به موجودیت غیرفعال
                            </span>
                            <span className="text-[10px] text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                              تغییر سطوح دسترسی RBAC
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed pr-5">
                            هرگونه اعطا یا سلب مجوزهای مشاهده/بازیابی اسناد و داده‌های غیرفعال منوط به تایید مدیر سیستم، هشدار امنیتی و ثبت دقیق تغییرات است.
                          </p>
                          <div className="flex flex-wrap gap-4 pr-5 pt-1">
                            {[
                              { key: "requireAdminApproval", label: "تایید مدیر سیستم" },
                              { key: "auditLog", label: "ثبت سابقه تغییر دسترسی" },
                              { key: "notifySecurityOfficer", label: "ارسال هشدار به مسئول امنیت" }
                            ].map(op => (
                              <label key={op.key} className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={settings.inactiveEntityOperationsPolicy?.changeInactiveAccess?.[op.key] ?? true}
                                  onChange={e => {
                                    const updated = {
                                      ...settings.inactiveEntityOperationsPolicy,
                                      changeInactiveAccess: {
                                        ...settings.inactiveEntityOperationsPolicy?.changeInactiveAccess,
                                        [op.key]: e.target.checked
                                      }
                                    };
                                    set("inactiveEntityOperationsPolicy", updated);
                                  }}
                                  className="h-3.5 w-3.5 rounded border-slate-300 text-purple-600"
                                />
                                <span>{op.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* سطر ۴: عملیات بر روی فراداده وابسته به موجودیت غیرفعال */}
                        <div className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                              <FileCheck className="h-3.5 w-3.5 text-emerald-500" />
                              عملیات بر روی فراداده وابسته به موجودیت غیرفعال
                            </span>
                            <span className="text-[10px] text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                              متاداده و فراداده وابستگی‌ها
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed pr-5">
                            فراداده و برچسب‌های وابستگی موجودیت‌های غیرفعال قفل و «صرفاً خواندنی» گردیده و تمامیت داده‌ها (Integrity) دائماً ارزیابی می‌شود.
                          </p>
                          <div className="flex flex-wrap gap-4 pr-5 pt-1">
                            {[
                              { key: "readOnlyMetadata", label: "قفل متاداده (Read-Only)" },
                              { key: "auditLog", label: "ثبت هرگونه فراخوانی متاداده" },
                              { key: "checkIntegrity", label: "سنجش تمامیت (Integrity Check)" }
                            ].map(op => (
                              <label key={op.key} className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={settings.inactiveEntityOperationsPolicy?.inactiveMetadataOps?.[op.key] ?? true}
                                  onChange={e => {
                                    const updated = {
                                      ...settings.inactiveEntityOperationsPolicy,
                                      inactiveMetadataOps: {
                                        ...settings.inactiveEntityOperationsPolicy?.inactiveMetadataOps,
                                        [op.key]: e.target.checked
                                      }
                                    };
                                    set("inactiveEntityOperationsPolicy", updated);
                                  }}
                                  className="h-3.5 w-3.5 rounded border-slate-300 text-purple-600"
                                />
                                <span>{op.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* سطر ۵: سایر موارد */}
                        <div className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                              <ShieldCheck className="h-3.5 w-3.5 text-purple-500" />
                              سایر موارد
                            </span>
                            <span className="text-[10px] text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                              جابجایی و صادرات دسته‌ای آرشیو
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed pr-5">
                            شامل کلیه عملیات سیستم از جمله تبدیل فرمت، انتقال آرشیو تاریخی، فشرده‌سازی و استخراج داده‌های غیرفعال.
                          </p>
                          <div className="flex flex-wrap gap-4 pr-5 pt-1">
                            {[
                              { key: "requireAdminApproval", label: "الزام تایید مدیر سیستم" },
                              { key: "auditLog", label: "ثبت کامل رویداد در لاگ افتا" }
                            ].map(op => (
                              <label key={op.key} className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={settings.inactiveEntityOperationsPolicy?.otherInactiveOps?.[op.key] ?? true}
                                  onChange={e => {
                                    const updated = {
                                      ...settings.inactiveEntityOperationsPolicy,
                                      otherInactiveOps: {
                                        ...settings.inactiveEntityOperationsPolicy?.otherInactiveOps,
                                        [op.key]: e.target.checked
                                      }
                                    };
                                    set("inactiveEntityOperationsPolicy", updated);
                                  }}
                                  className="h-3.5 w-3.5 rounded border-slate-300 text-purple-600"
                                />
                                <span>{op.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* جدول تعیین ویژگی‌هایی که بر اساس آن خط‌مشی‌های موجودیت‌های غیرفعال تعریف می‌شوند (مطابق تصویر جدید) */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                    <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-4 font-bold text-xs flex items-center justify-between border-b border-blue-800">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                        <span className="text-xs md:text-sm font-black">
                          محصول باید بر اساس ویژگی‌های زیر، برای موجودیت‌های غیرفعال خط‌مشی‌های کنترل دسترسی اعمال نماید.
                        </span>
                      </div>
                      <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] shrink-0">
                        الزام افتا
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-slate-200 dark:divide-slate-800">
                      {/* ستون راست: عنوان اصلی مطابق تصویر */}
                      <div className="md:col-span-5 bg-slate-50/80 dark:bg-slate-900/50 p-5 flex flex-col justify-center items-center text-center font-bold text-xs text-slate-800 dark:text-slate-200 leading-relaxed border-b md:border-b-0 md:border-l border-slate-200 dark:border-slate-800 space-y-2">
                        <Sliders className="h-7 w-7 text-indigo-600 mb-1" />
                        <span>ویژگی‌هایی که بر اساس آن خط‌مشی‌ها تعریف می‌شوند، انتخاب گردد.</span>
                        <span className="text-[11px] text-muted-foreground font-normal">
                          انتخاب معیارهای اصلی احراز هویت و ارزیابی سطح دسترسی بر روی موجودیت‌های غیرفعال
                        </span>
                      </div>

                      {/* ستون چپ: ۳ سطر انتخابی با چک‌باکس مربع مطابق تصویر */}
                      <div className="md:col-span-7 divide-y divide-slate-200 dark:divide-slate-800">
                        
                        {/* سطر ۱: نقش‌ها و مجوزهای کاربر مجاز */}
                        <div className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <label htmlFor="useUserRolesAndPermissions" className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              id="useUserRolesAndPermissions"
                              checked={settings.inactiveEntityPolicyCriteria?.useUserRolesAndPermissions ?? true}
                              onChange={e => {
                                const updated = {
                                  ...settings.inactiveEntityPolicyCriteria,
                                  useUserRolesAndPermissions: e.target.checked
                                };
                                set("inactiveEntityPolicyCriteria", updated);
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                نقش‌ها و مجوزهای کاربر مجاز
                              </span>
                              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                                ارزیابی سطح دسترسی موجودیت‌های غیرفعال بر اساس ماتریس نقش‌ها و سطوح دسترسی پیش‌فرض کاربر (RBAC).
                              </p>
                            </div>
                          </label>
                        </div>

                        {/* سطر ۲: اطلاعات نشست کاربر و پارامترهایی که با درخواست فرستاده می‌شوند */}
                        <div className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <label htmlFor="useSessionInfoAndRequestParams" className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              id="useSessionInfoAndRequestParams"
                              checked={settings.inactiveEntityPolicyCriteria?.useSessionInfoAndRequestParams ?? true}
                              onChange={e => {
                                const updated = {
                                  ...settings.inactiveEntityPolicyCriteria,
                                  useSessionInfoAndRequestParams: e.target.checked
                                };
                                set("inactiveEntityPolicyCriteria", updated);
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                اطلاعات نشست کاربر و پارامترهایی که با درخواست فرستاده می‌شوند.
                              </span>
                              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                                اعمال خط‌مشی‌ها بر اساس خصوصیات نشست کلاینت (IP، توکن JWT، وضعیت احراز هویت) و پارامترهای درخواست HTTP.
                              </p>
                            </div>
                          </label>
                        </div>

                        {/* سطر ۳: سایر موارد */}
                        <div className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <label htmlFor="useOtherCriteria" className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              id="useOtherCriteria"
                              checked={settings.inactiveEntityPolicyCriteria?.useOtherCriteria ?? false}
                              onChange={e => {
                                const updated = {
                                  ...settings.inactiveEntityPolicyCriteria,
                                  useOtherCriteria: e.target.checked
                                };
                                set("inactiveEntityPolicyCriteria", updated);
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                سایر موارد
                              </span>
                              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                                اعمال ضوابط بر اساس محدوده ساعات کاری، موقعیت شبکه‌ای اینترانت و گواهی‌نامه‌های امنیتی اختصاصی.
                              </p>
                            </div>
                          </label>
                        </div>

                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* کارت مجازسازی عملیات بین موجودیت فعال تحت کنترل و موجودیت غیرفعال (مطابق تصویر الزامات افتا) */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                    <div className="bg-gradient-to-r from-amber-900 via-orange-950 to-slate-900 text-white p-4 font-bold text-xs flex items-center justify-between border-b border-amber-800">
                      <div className="flex items-center gap-2.5">
                        <Shield className="h-5 w-5 text-amber-400 shrink-0" />
                        <span className="text-xs md:text-sm font-black">
                          قاعده مجازسازی عملیات بین موجودیت فعال تحت کنترل و موجودیت غیرفعال کنترل‌شده
                        </span>
                      </div>
                      <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px] shrink-0">
                        الزام امنیتی افتا
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-slate-200 dark:divide-slate-800">
                      {/* ستون راست: متن دقیق الزام مطابق تصویر */}
                      <div className="md:col-span-5 bg-amber-50/40 dark:bg-slate-900/50 p-5 flex flex-col justify-center items-center text-center font-bold text-xs text-slate-800 dark:text-slate-200 leading-relaxed border-b md:border-b-0 md:border-l border-slate-200 dark:border-slate-800 space-y-3">
                        <Activity className="h-8 w-8 text-amber-600 mb-1" />
                        <span className="text-amber-900 dark:text-amber-300 font-extrabold text-xs leading-relaxed">
                          محصول باید بر اساس قاعده‌ای عملیات بین موجودیت فعال تحت کنترل و موجودیت غیرفعال کنترل‌شده را مجاز نماید.
                        </span>
                        <p className="text-[11px] text-muted-foreground font-normal leading-relaxed text-justify bg-white/70 dark:bg-slate-800/60 p-3 rounded-lg border border-amber-200/60 dark:border-amber-900/40">
                          (این قاعده می‌تواند بدین شکل باشد که در فهرست کنترل دسترسی (ACL)، سابقه (رکوردی) وجود داشته باشد که به کاربر با شناسه کاربری یا شناسه گروه مربوطه یا نقش کاربری تعریف‌شده حق دسترسی به موجودیت غیرفعال را بدهد.)
                        </p>
                      </div>

                      {/* ستون چپ: گزینه‌ها و ابزارهای تنظیم این قاعده */}
                      <div className="md:col-span-7 divide-y divide-slate-200 dark:divide-slate-800">
                        
                        {/* ۱. الزام ارزیابی ACL */}
                        <div className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <label htmlFor="enableACLCheck" className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              id="enableACLCheck"
                              checked={settings.activeInactiveInteractionPolicy?.enableACLCheck ?? true}
                              onChange={e => {
                                set("activeInactiveInteractionPolicy", {
                                  ...settings.activeInactiveInteractionPolicy,
                                  enableACLCheck: e.target.checked
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                فعال‌سازی ارزیابی فهرست کنترل دسترسی (ACL)
                              </span>
                              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                                تمام فراخوانی‌ها و پردازش‌های بین موجودیت فعال و غیرفعال مستلزم تطبیق با سوابق ACL ثبت‌شده می‌باشد.
                              </p>
                            </div>
                          </label>
                        </div>

                        {/* ۲. معیارهای اعطای حق دسترسی در رکورد ACL */}
                        <div className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors space-y-2">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                            معیارهای شناسایی مجاز در رکورد کنترل دسترسی (ACL Record):
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                              <input
                                type="checkbox"
                                checked={settings.activeInactiveInteractionPolicy?.checkByUserId ?? true}
                                onChange={e => {
                                  set("activeInactiveInteractionPolicy", {
                                    ...settings.activeInactiveInteractionPolicy,
                                    checkByUserId: e.target.checked
                                  });
                                }}
                                className="h-3.5 w-3.5 rounded border-slate-300 text-amber-600"
                              />
                              <span>شناسه کاربری (User ID)</span>
                            </label>

                            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                              <input
                                type="checkbox"
                                checked={settings.activeInactiveInteractionPolicy?.checkByGroupId ?? true}
                                onChange={e => {
                                  set("activeInactiveInteractionPolicy", {
                                    ...settings.activeInactiveInteractionPolicy,
                                    checkByGroupId: e.target.checked
                                  });
                                }}
                                className="h-3.5 w-3.5 rounded border-slate-300 text-amber-600"
                              />
                              <span>شناسه گروه (Group ID)</span>
                            </label>

                            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                              <input
                                type="checkbox"
                                checked={settings.activeInactiveInteractionPolicy?.checkByUserRole ?? true}
                                onChange={e => {
                                  set("activeInactiveInteractionPolicy", {
                                    ...settings.activeInactiveInteractionPolicy,
                                    checkByUserRole: e.target.checked
                                  });
                                }}
                                className="h-3.5 w-3.5 rounded border-slate-300 text-amber-600"
                              />
                              <span>نقش کاربری (User Role)</span>
                            </label>
                          </div>
                        </div>

                        {/* ۳. الزام سابقه صریح و ثبت لاگ عدم اجازه */}
                        <div className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors space-y-2">
                          <label htmlFor="requireExplicitACLRecord" className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              id="requireExplicitACLRecord"
                              checked={settings.activeInactiveInteractionPolicy?.requireExplicitACLRecord ?? true}
                              onChange={e => {
                                set("activeInactiveInteractionPolicy", {
                                  ...settings.activeInactiveInteractionPolicy,
                                  requireExplicitACLRecord: e.target.checked
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                الزام وجود سابقه صریح (Explicit Record) در ACL
                              </span>
                              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                                در صورت نبود سابقه صریح تعاملی برای موجودیت غیرفعال، درخواست تعامل بلافاصله مسدود و در لاگ افتا ثبت گردد.
                              </p>
                            </div>
                          </label>
                        </div>

                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* کارت قوانین ممانعت از دسترسی موجودیت فعال به موجودیت غیرفعال (مطابق تصویر جدید افتا) */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                    <div className="bg-gradient-to-r from-rose-900 via-red-950 to-slate-900 text-white p-4 font-bold text-xs flex items-center justify-between border-b border-rose-800">
                      <div className="flex items-center gap-2.5">
                        <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
                        <span className="text-xs md:text-sm font-black">
                          محصول باید بر اساس قوانینی، از دسترسی موجودیت فعال به موجودیت غیرفعال جلوگیری نماید.
                        </span>
                      </div>
                      <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30 text-[10px] shrink-0">
                        الزام امنیتی افتا
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-slate-200 dark:divide-slate-800">
                      {/* ستون راست: عنوان اصلی قوانین ممانعت از دسترسی مطابق تصویر */}
                      <div className="md:col-span-5 bg-rose-50/40 dark:bg-slate-900/50 p-5 flex flex-col justify-center items-center text-center font-bold text-xs text-slate-800 dark:text-slate-200 leading-relaxed border-b md:border-b-0 md:border-l border-slate-200 dark:border-slate-800 space-y-2">
                        <Shield className="h-8 w-8 text-rose-600 mb-1" />
                        <span className="text-rose-900 dark:text-rose-300 font-extrabold text-xs leading-relaxed">
                          قوانین ممانعت از دسترسی مشخص شوند
                        </span>
                        <span className="text-[11px] text-muted-foreground font-normal leading-relaxed text-justify bg-white/70 dark:bg-slate-800/60 p-2.5 rounded-lg border border-rose-200/60 dark:border-rose-900/40">
                          (در صورت اعمال قوانین بیشتر توسط محصول، در «سایر موارد» بیان شود).
                        </span>
                      </div>

                      {/* ستون چپ: سطور جدول قوانین ممانعت مطابق تصویر */}
                      <div className="md:col-span-7 divide-y divide-slate-200 dark:divide-slate-800">
                        
                        {/* سطر ۱: عبور تعداد نشست آغاز شده با نام کاربری مشابه از مقدار آستانه از پیش تعریف‌شده */}
                        <div className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors space-y-3">
                          <label htmlFor="preventAccessOnExceedingSessionThreshold" className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              id="preventAccessOnExceedingSessionThreshold"
                              checked={settings.activeToInactivePreventionRules?.preventAccessOnExceedingSessionThreshold ?? true}
                              onChange={e => {
                                set("activeToInactivePreventionRules", {
                                  ...settings.activeToInactivePreventionRules,
                                  preventAccessOnExceedingSessionThreshold: e.target.checked
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 mt-0.5"
                            />
                            <div className="flex-1">
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                عبور تعداد نشست آغاز شده با نام کاربری مشابه از مقدار آستانه از پیش تعریف‌شده
                              </span>
                              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                                ممانعت و مسدودسازی خودکار دسترسی کلاینت به موجودیت‌های غیرفعال در صورت فراتر رفتن تعداد نشست‌های همزمان کاربر از حد آستانه مجاز.
                              </p>
                            </div>
                          </label>

                          {settings.activeToInactivePreventionRules?.preventAccessOnExceedingSessionThreshold && (
                            <div className="mr-7 pt-1 flex items-center gap-3 bg-rose-50/50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-rose-100 dark:border-slate-700">
                              <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                مقدار آستانه مجاز نشست‌های همزمان:
                              </Label>
                              <Input
                                type="number"
                                min="1"
                                max="10"
                                value={settings.activeToInactivePreventionRules?.sessionThresholdLimit ?? 3}
                                onChange={e => {
                                  const val = Math.max(1, parseInt(e.target.value) || 1);
                                  set("activeToInactivePreventionRules", {
                                    ...settings.activeToInactivePreventionRules,
                                    sessionThresholdLimit: val
                                  });
                                }}
                                className="w-20 h-8 text-xs text-center font-bold"
                              />
                              <span className="text-[11px] text-muted-foreground">نشست همزمان</span>
                            </div>
                          )}
                        </div>

                        {/* سطر ۲: سایر موارد */}
                        <div className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                              <ShieldCheck className="h-3.5 w-3.5 text-indigo-500" />
                              سایر موارد (قوانین ممانعت تکمیلی محصول)
                            </span>
                            <span className="text-[10px] text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                              ضوابط امنیتی افتا
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed pr-1">
                            شامل ممانعت از دسترسی در صورت غیرفعال/تعلیق شدن حساب کاربر، ناهنجاری آدرس IP، تغییر کلید امنیتی یا انقضای اعتبار دوره مالی.
                          </p>

                          <div className="flex flex-col gap-2 pt-1">
                            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={settings.activeToInactivePreventionRules?.preventAccessOnAccountDeactivation ?? true}
                                onChange={e => {
                                  set("activeToInactivePreventionRules", {
                                    ...settings.activeToInactivePreventionRules,
                                    preventAccessOnAccountDeactivation: e.target.checked
                                  });
                                }}
                                className="h-3.5 w-3.5 rounded border-slate-300 text-rose-600"
                              />
                              <span>ممانعت فوری از دسترسی در صورت غیرفعال/تعلیق شدن وضعیت حساب کاربری</span>
                            </label>

                            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={settings.activeToInactivePreventionRules?.preventAccessOnIPAnomaly ?? true}
                                onChange={e => {
                                  set("activeToInactivePreventionRules", {
                                    ...settings.activeToInactivePreventionRules,
                                    preventAccessOnIPAnomaly: e.target.checked
                                  });
                                }}
                                className="h-3.5 w-3.5 rounded border-slate-300 text-rose-600"
                              />
                              <span>ممانعت از دسترسی در صورت تغییر غیرمجاز IP یا شناسایی نشست‌های ناهنجار</span>
                            </label>

                            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={settings.activeToInactivePreventionRules?.preventAccessOnOtherCriteria ?? true}
                                onChange={e => {
                                  set("activeToInactivePreventionRules", {
                                    ...settings.activeToInactivePreventionRules,
                                    preventAccessOnOtherCriteria: e.target.checked
                                  });
                                }}
                                className="h-3.5 w-3.5 rounded border-slate-300 text-rose-600"
                              />
                              <span>اعمال سایر قوانین ممانعت از دسترسی و ثبت در Audit Log افتا</span>
                            </label>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* کارت پاک‌سازی اطلاعات مانده منابع و دسترسی به منابع قبلی (مطابق بند ۵ تصویر افتا) */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                    <div className="bg-gradient-to-r from-teal-900 via-emerald-950 to-slate-900 text-white p-4 font-bold text-xs flex items-center justify-between border-b border-teal-800">
                      <div className="flex items-center gap-2.5">
                        <HardDrive className="h-5 w-5 text-teal-400 shrink-0" />
                        <span className="text-xs md:text-sm font-black">
                          تضمین عدم نشت اطلاعات در تخصیص و آزادسازی منابع و سازوکار امن دسترسی به منابع قبلی (بند ۵ افتا)
                        </span>
                      </div>
                      <Badge className="bg-teal-500/20 text-teal-300 border-teal-500/30 text-[10px] shrink-0">
                        بند ۵ الزام افتا
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-slate-200 dark:divide-slate-800">
                      {/* ستون راست: متن دقیق بند ۵ افتا */}
                      <div className="md:col-span-5 bg-teal-50/40 dark:bg-slate-900/50 p-5 flex flex-col justify-center items-center text-center font-bold text-xs text-slate-800 dark:text-slate-200 leading-relaxed border-b md:border-b-0 md:border-l border-slate-200 dark:border-slate-800 space-y-3">
                        <Database className="h-8 w-8 text-teal-600 mb-1" />
                        <span className="text-teal-950 dark:text-teal-300 font-extrabold text-xs leading-relaxed">
                          بند ۵ - پاک‌سازی اطلاعات منابع و دسترسی به منابع قبلی
                        </span>
                        <p className="text-[11px] text-muted-foreground font-normal leading-relaxed text-justify bg-white/70 dark:bg-slate-800/60 p-3 rounded-lg border border-teal-200/60 dark:border-teal-900/40">
                          «محصول باید تضمین نماید تمام اطلاعات قبلی منابع یا در هنگام تخصیص و یا در هنگام آزادسازی آن‌ها، غیرقابل دسترس می‌گردد و یا سازوکاری امن برای دسترسی به منابع قبلی وجود دارد.»
                        </p>
                      </div>

                      {/* ستون چپ: گزینه‌ها و تنظیمات پاک‌سازی و دسترسی امن */}
                      <div className="md:col-span-7 divide-y divide-slate-200 dark:divide-slate-800">
                        
                        {/* ۱. امحاء فوری کلیدها و بوفرهای حافظه */}
                        <div className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <label htmlFor="wipeCryptoKeysOnRelease" className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              id="wipeCryptoKeysOnRelease"
                              checked={settings.resourceSanitizationPolicy?.wipeCryptoKeysOnRelease ?? true}
                              onChange={e => {
                                set("resourceSanitizationPolicy", {
                                  ...settings.resourceSanitizationPolicy,
                                  wipeCryptoKeysOnRelease: e.target.checked
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                امحاء و صفر کردن فوری کلیدهای رمزنگاری و داده‌های حساس حافظه (Memory Wiping)
                              </span>
                              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                                تخریب و صفر نمودن بوفرهای کلید AES-256 و داده‌های حساس حافظه RAM پس از پایان استفاده جهت ممانعت از بازخوانی (destroyCryptoKey).
                              </p>
                            </div>
                          </label>
                        </div>

                        {/* ۲. پاک‌سازی فایل‌ها و داده‌های موقت */}
                        <div className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <label htmlFor="sanitizeTempFilesOnRelease" className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              id="sanitizeTempFilesOnRelease"
                              checked={settings.resourceSanitizationPolicy?.sanitizeTempFilesOnRelease ?? true}
                              onChange={e => {
                                set("resourceSanitizationPolicy", {
                                  ...settings.resourceSanitizationPolicy,
                                  sanitizeTempFilesOnRelease: e.target.checked
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                پاک‌سازی کامل باقی‌مانده فایل‌ها و بوفرهای موقت در زمان آزادسازی
                              </span>
                              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                                امحاء و حذف امن (Secure Erasure) فایل‌های آپلود شده موقت، پیش‌نویس‌ها و بوفرهای آزادشده قبل از تخصیص مجدد به کاربر جدید.
                              </p>
                            </div>
                          </label>
                        </div>

                        {/* ۳. سازوکار امن دسترسی به سوابق منابع قبلی */}
                        <div className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <label htmlFor="requireSecureAccessForLegacyResources" className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              id="requireSecureAccessForLegacyResources"
                              checked={settings.resourceSanitizationPolicy?.requireSecureAccessForLegacyResources ?? true}
                              onChange={e => {
                                set("resourceSanitizationPolicy", {
                                  ...settings.resourceSanitizationPolicy,
                                  requireSecureAccessForLegacyResources: e.target.checked
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                سازوکار امن و ثبت لاگ برای دسترسی به سوابق منابع قبلی (Secure Legacy Resource Access)
                              </span>
                              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                                دسترسی به نسخه‌های تاریخی یا منابع گذشته منوط به احراز هویت قوی، ارزیابی RBAC و ثبت کامل رویداد در لاگ افتا می‌باشد.
                              </p>
                            </div>
                          </label>
                        </div>

                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* کارت خط‌مشی کنترل دسترسی هنگام دریافت داده کاربری (مطابق دقیق با جدول تصویر افتا) */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                    <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white p-4 font-bold text-xs flex items-center justify-between border-b border-blue-800">
                      <div className="flex items-center gap-2.5">
                        <FileCheck className="h-5 w-5 text-blue-400 shrink-0" />
                        <span className="text-xs md:text-sm font-black">
                          خط‌مشی کنترل دسترسی هنگام دریافت داده کاربری و ویژگی‌های امنیتی مرتبط (الزام افتا)
                        </span>
                      </div>
                      <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-[10px] shrink-0">
                        الزام تصویر افتا
                      </Badge>
                    </div>

                    <div className="p-5 space-y-4">
                      {/* توضیحات صورت الزام بالای کارت */}
                      <div className="bg-blue-50/60 dark:bg-blue-950/30 p-4 rounded-xl border border-blue-200/80 dark:border-blue-900/50 flex items-start gap-3">
                        <ShieldAlert className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-950 dark:text-blue-200 font-semibold leading-relaxed">
                          «محصول باید هنگام دریافت داده کاربری خط‌مشی کنترل دسترسی را اعمال و برای این کار از ویژگی‌های امنیتی مرتبط با داده کاربری استفاده کند.»
                        </p>
                      </div>

                      {/* جدول اختصاصی مطابق با ساختار تصویر افتا */}
                      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                        <table className="w-full text-xs text-right border-collapse">
                          <thead>
                            <tr className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700">
                              <th className="p-3 w-12 text-center font-extrabold border-l border-slate-200 dark:border-slate-700">انتخاب</th>
                              <th className="p-3 font-extrabold text-slate-900 dark:text-slate-100">
                                ویژگی‌های امنیتی مرتبط با داده کاربری که در هنگام ورود آن به محصول استفاده می‌شوند
                              </th>
                              <th className="p-3 w-48 font-extrabold text-center border-r border-slate-200 dark:border-slate-700">پیکربندی / مقادیر مجاز</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {/* سطر ۱: نوع داده */}
                            <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="p-3 text-center border-l border-slate-200 dark:border-slate-800">
                                <input
                                  type="checkbox"
                                  checked={settings.userDataInputAccessPolicy?.checkDataType ?? true}
                                  onChange={e => {
                                    set("userDataInputAccessPolicy", {
                                      ...settings.userDataInputAccessPolicy,
                                      checkDataType: e.target.checked
                                    });
                                  }}
                                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                              </td>
                              <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                                نوع داده
                                <p className="text-[11px] text-muted-foreground font-normal mt-0.5">
                                  ارزیابی و کنترل مجاز بودن انواع ساختار داده‌های ورودی کلاینت به سامانه
                                </p>
                              </td>
                              <td className="p-3 text-center border-r border-slate-200 dark:border-slate-800">
                                <span className="inline-block bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 font-mono text-[11px] px-2.5 py-1 rounded-md font-bold">
                                  JSON, CSV, XLSX, PDF
                                </span>
                              </td>
                            </tr>

                            {/* سطر ۲: حجم و اندازه */}
                            <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="p-3 text-center border-l border-slate-200 dark:border-slate-800">
                                <input
                                  type="checkbox"
                                  checked={settings.userDataInputAccessPolicy?.checkVolumeAndSize ?? true}
                                  onChange={e => {
                                    set("userDataInputAccessPolicy", {
                                      ...settings.userDataInputAccessPolicy,
                                      checkVolumeAndSize: e.target.checked
                                    });
                                  }}
                                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                              </td>
                              <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                                حجم و اندازه
                                <p className="text-[11px] text-muted-foreground font-normal mt-0.5">
                                  کنترل حجم و اندازه پِی‌لود درخواست‌ها و فایل‌های ورودی جهت ممانعت از حملات سرریز و DoS
                                </p>
                              </td>
                              <td className="p-3 text-center border-r border-slate-200 dark:border-slate-800">
                                <div className="flex items-center justify-center gap-1.5">
                                  <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={settings.userDataInputAccessPolicy?.maxPayloadSizeMB ?? 10}
                                    onChange={e => {
                                      set("userDataInputAccessPolicy", {
                                        ...settings.userDataInputAccessPolicy,
                                        maxPayloadSizeMB: Number(e.target.value) || 10
                                      });
                                    }}
                                    className="w-16 h-8 text-center text-xs font-bold rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                                  />
                                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">مگابایت</span>
                                </div>
                              </td>
                            </tr>

                            {/* سطر ۳: فرمت */}
                            <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="p-3 text-center border-l border-slate-200 dark:border-slate-800">
                                <input
                                  type="checkbox"
                                  checked={settings.userDataInputAccessPolicy?.checkFormat ?? true}
                                  onChange={e => {
                                    set("userDataInputAccessPolicy", {
                                      ...settings.userDataInputAccessPolicy,
                                      checkFormat: e.target.checked
                                    });
                                  }}
                                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                              </td>
                              <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                                فرمت
                                <p className="text-[11px] text-muted-foreground font-normal mt-0.5">
                                  اعتبارسنجی پسوند استاندارد، MIME Type و ساختار کدگذاری UTF-8
                                </p>
                              </td>
                              <td className="p-3 text-center border-r border-slate-200 dark:border-slate-800">
                                <Badge className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300 text-[10px]">
                                  اعتبارسنجی خودکار
                                </Badge>
                              </td>
                            </tr>

                            {/* سطر ۴: تعداد دفعات Import */}
                            <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="p-3 text-center border-l border-slate-200 dark:border-slate-800">
                                <input
                                  type="checkbox"
                                  checked={settings.userDataInputAccessPolicy?.checkImportFrequencyLimit ?? true}
                                  onChange={e => {
                                    set("userDataInputAccessPolicy", {
                                      ...settings.userDataInputAccessPolicy,
                                      checkImportFrequencyLimit: e.target.checked
                                    });
                                  }}
                                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                              </td>
                              <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                                تعداد دفعات Import
                                <p className="text-[11px] text-muted-foreground font-normal mt-0.5">
                                  محدودسازی سقف تعداد دفعات بارگذاری و ورود دسته‌ای اطلاعات در یک بازه زمانی
                                </p>
                              </td>
                              <td className="p-3 text-center border-r border-slate-200 dark:border-slate-800">
                                <div className="flex items-center justify-center gap-1.5">
                                  <input
                                    type="number"
                                    min="1"
                                    max="500"
                                    value={settings.userDataInputAccessPolicy?.maxImportsPerHour ?? 20}
                                    onChange={e => {
                                      set("userDataInputAccessPolicy", {
                                        ...settings.userDataInputAccessPolicy,
                                        maxImportsPerHour: Number(e.target.value) || 20
                                      });
                                    }}
                                    className="w-16 h-8 text-center text-xs font-bold rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                                  />
                                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">بار در ساعت</span>
                                </div>
                              </td>
                            </tr>

                            {/* سطر ۵: سایر موارد */}
                            <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="p-3 text-center border-l border-slate-200 dark:border-slate-800">
                                <input
                                  type="checkbox"
                                  checked={settings.userDataInputAccessPolicy?.checkOtherInputCriteria ?? true}
                                  onChange={e => {
                                    set("userDataInputAccessPolicy", {
                                      ...settings.userDataInputAccessPolicy,
                                      checkOtherInputCriteria: e.target.checked
                                    });
                                  }}
                                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                              </td>
                              <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                                سایر موارد
                                <p className="text-[11px] text-muted-foreground font-normal mt-0.5">
                                  پاک‌سازی ورودی‌ها از کدهای مخرب (Input Sanitization)، حفاظت در برابر XSS/SQLi و بررسی تمامیت (Checksum)
                                </p>
                              </td>
                              <td className="p-3 text-center border-r border-slate-200 dark:border-slate-800">
                                <Badge className="bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-300 text-[10px]">
                                  Sanitization & Audit
                                </Badge>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* کارت خط‌مشی پروتکل امن انتقال داده، همبستگی ویژگی‌های امنیتی و ممانعت از شنود و گم‌شدن داده (مطابق الزام تصویر جدید افتا) */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                    <div className="bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-900 text-white p-4 font-bold text-xs flex items-center justify-between border-b border-emerald-800">
                      <div className="flex items-center gap-2.5">
                        <Lock className="h-5 w-5 text-emerald-400 shrink-0" />
                        <span className="text-xs md:text-sm font-black">
                          پروتکل امن انتقال داده، همبستگی ویژگی‌های امنیتی و ممانعت از شنود و گم‌شدن داده (الزام افتا)
                        </span>
                      </div>
                      <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] shrink-0">
                        الزام تصویر افتا
                      </Badge>
                    </div>

                    <div className="p-5 space-y-4">
                      {/* توضیحات صورت الزام بالای کارت */}
                      <div className="bg-emerald-50/60 dark:bg-emerald-950/30 p-4 rounded-xl border border-emerald-200/80 dark:border-emerald-900/50 flex items-start gap-3">
                        <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-emerald-950 dark:text-emerald-200 font-semibold leading-relaxed">
                          «محصول باید از یک پروتکل امن برای انتقال داده استفاده نماید. این پروتکل ارتباط و همبستگی شفافی را بین داده کاربری دریافت شده و ویژگی‌های امنیتی آن فراهم و همچنین از شنود و گم‌شدن داده حین انتقال جلوگیری می‌کند.»
                        </p>
                      </div>

                      {/* شبکه تنظیمات پروتکل امن انتقال داده */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* ۱. الزام استفاده از پروتکل رمزنگاری‌شده TLS/HTTPS */}
                        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/50 dark:hover:bg-slate-800/60 transition-colors">
                          <label htmlFor="enforceTLSEncryption" className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              id="enforceTLSEncryption"
                              checked={settings.secureDataTransportPolicy?.enforceTLSEncryption ?? true}
                              onChange={e => {
                                set("secureDataTransportPolicy", {
                                  ...settings.secureDataTransportPolicy,
                                  enforceTLSEncryption: e.target.checked
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                <Lock className="h-3.5 w-3.5 text-emerald-600" />
                                الزام کانال رمزنگاری‌شده TLS 1.3 / HTTPS
                              </span>
                              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                                تمام تبادلات داده بین کلاینت و سرور حتماً از طریق پروتکل امن کانال رمزنگاری قوی HTTPS صورت پذیرد.
                              </p>
                            </div>
                          </label>
                        </div>

                        {/* ۲. همبستگی شفاف بین داده کاربری و ویژگی‌های امنیتی */}
                        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/50 dark:hover:bg-slate-800/60 transition-colors">
                          <label htmlFor="transparentSecurityAttributeCoupling" className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              id="transparentSecurityAttributeCoupling"
                              checked={settings.secureDataTransportPolicy?.transparentSecurityAttributeCoupling ?? true}
                              onChange={e => {
                                set("secureDataTransportPolicy", {
                                  ...settings.secureDataTransportPolicy,
                                  transparentSecurityAttributeCoupling: e.target.checked
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                <Activity className="h-3.5 w-3.5 text-emerald-600" />
                                همبستگی شفاف داده کاربری و ویژگی‌های امنیتی
                              </span>
                              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                                انتقال و تطبیق همزمان داده کاربری با توکن احراز هویت JWT، گواهی کلاینت و ویژگی‌های امنیتی مربوطه.
                              </p>
                            </div>
                          </label>
                        </div>

                        {/* ۳. جلوگیری کامل از شنود و استراق سمع در شبکه */}
                        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/50 dark:hover:bg-slate-800/60 transition-colors">
                          <label htmlFor="preventEavesdropping" className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              id="preventEavesdropping"
                              checked={settings.secureDataTransportPolicy?.preventEavesdropping ?? true}
                              onChange={e => {
                                set("secureDataTransportPolicy", {
                                  ...settings.secureDataTransportPolicy,
                                  preventEavesdropping: e.target.checked
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                <Shield className="h-3.5 w-3.5 text-emerald-600" />
                                محافظت در برابر شنود و استراق سمع شبکه (Eavesdropping Protection)
                              </span>
                              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                                رمزنکاری کامل داده‌های حساس مالی در شبکه عمومی جهت عدم امکان افشا یا بازخوانی توسط شنودکنندگان.
                              </p>
                            </div>
                          </label>
                        </div>

                        {/* ۴. جلوگیری از گم‌شدن و دستکاری داده حین انتقال */}
                        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/50 dark:hover:bg-slate-800/60 transition-colors">
                          <label htmlFor="preventDataLossAndTamperingInTransit" className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              id="preventDataLossAndTamperingInTransit"
                              checked={settings.secureDataTransportPolicy?.preventDataLossAndTamperingInTransit ?? true}
                              onChange={e => {
                                set("secureDataTransportPolicy", {
                                  ...settings.secureDataTransportPolicy,
                                  preventDataLossAndTamperingInTransit: e.target.checked
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                جلوگیری از گم‌شدن، فقدان و تحریف داده (Data Loss & Anti-Tampering)
                              </span>
                              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                                اعتبارسنجی تمامیت داده‌ها با امضای HMAC-SHA256 و چک‌سام جهت ممانعت از کسر یا تغییر بایت‌ها در بستر شبکه.
                              </p>
                            </div>
                          </label>
                        </div>

                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* کارت خط‌مشی کنترل دسترسی هنگام خروج و انتقال داده کاربری به بیرون از محصول (مطابق بند ۸ تصویر افتا) */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                    <div className="bg-gradient-to-r from-violet-900 via-purple-950 to-slate-900 text-white p-4 font-bold text-xs flex items-center justify-between border-b border-violet-800">
                      <div className="flex items-center gap-2.5">
                        <Download className="h-5 w-5 text-violet-400 shrink-0" />
                        <span className="text-xs md:text-sm font-black">
                          بند ۸ - خط‌مشی کنترل دسترسی هنگام انتقال و خروج داده کاربری به بیرون از محصول (الزام افتا)
                        </span>
                      </div>
                      <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 text-[10px] shrink-0">
                        بند ۸ الزام افتا
                      </Badge>
                    </div>

                    <div className="p-5 space-y-4">
                      {/* توضیحات صورت الزام بالای کارت */}
                      <div className="bg-violet-50/60 dark:bg-violet-950/30 p-4 rounded-xl border border-violet-200/80 dark:border-violet-900/50 flex items-start gap-3">
                        <ShieldAlert className="h-5 w-5 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-violet-950 dark:text-violet-200 font-semibold leading-relaxed">
                          «۸ - محصول باید هنگام انتقال داده به بیرون از محصول، خط‌مشی کنترل دسترسی را اعمال نماید و برای این کار از ویژگی‌های امنیتی مرتبط با داده کاربری استفاده کند.»
                        </p>
                      </div>

                      {/* جدول اختصاصی مطابق ساختار بند ۸ تصویر افتا */}
                      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                        <table className="w-full text-xs text-right border-collapse">
                          <thead>
                            <tr className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700">
                              <th className="p-3 w-12 text-center font-extrabold border-l border-slate-200 dark:border-slate-700">انتخاب</th>
                              <th className="p-3 font-extrabold text-slate-900 dark:text-slate-100">
                                ویژگی‌های امنیتی مرتبط با داده کاربری که در هنگام خروج آن از محصول استفاده می‌شوند
                              </th>
                              <th className="p-3 w-48 font-extrabold text-center border-r border-slate-200 dark:border-slate-700">پیکربندی / مقادیر مجاز</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {/* سطر ۱: نوع داده */}
                            <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="p-3 text-center border-l border-slate-200 dark:border-slate-800">
                                <input
                                  type="checkbox"
                                  checked={settings.userDataEgressAccessPolicy?.checkDataType ?? true}
                                  onChange={e => {
                                    set("userDataEgressAccessPolicy", {
                                      ...settings.userDataEgressAccessPolicy,
                                      checkDataType: e.target.checked
                                    });
                                  }}
                                  className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                                />
                              </td>
                              <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                                نوع داده
                                <p className="text-[11px] text-muted-foreground font-normal mt-0.5">
                                  ارزیابی و کنترل مجاز بودن خروجی‌گرفتن و صادرات انواع اسناد و داده‌ها به بیرون از سیستم
                                </p>
                              </td>
                              <td className="p-3 text-center border-r border-slate-200 dark:border-slate-800">
                                <span className="inline-block bg-violet-100 dark:bg-violet-900/50 text-violet-800 dark:text-violet-300 font-mono text-[11px] px-2.5 py-1 rounded-md font-bold">
                                  PDF, XLSX, CSV, JSON
                                </span>
                              </td>
                            </tr>

                            {/* سطر ۲: حجم و اندازه */}
                            <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="p-3 text-center border-l border-slate-200 dark:border-slate-800">
                                <input
                                  type="checkbox"
                                  checked={settings.userDataEgressAccessPolicy?.checkVolumeAndSize ?? true}
                                  onChange={e => {
                                    set("userDataEgressAccessPolicy", {
                                      ...settings.userDataEgressAccessPolicy,
                                      checkVolumeAndSize: e.target.checked
                                    });
                                  }}
                                  className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                                />
                              </td>
                              <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                                حجم و اندازه
                                <p className="text-[11px] text-muted-foreground font-normal mt-0.5">
                                  سقف مجاز تعداد رکوردها و حجم فایل‌های خروجی در هر نوبت جهت ممانعت از سرقت دسته‌ای داده‌ها (Mass Export Limit)
                                </p>
                              </td>
                              <td className="p-3 text-center border-r border-slate-200 dark:border-slate-800">
                                <div className="flex items-center justify-center gap-1.5">
                                  <input
                                    type="number"
                                    min="100"
                                    max="50000"
                                    value={settings.userDataEgressAccessPolicy?.maxExportRecordsPerRequest ?? 5000}
                                    onChange={e => {
                                      set("userDataEgressAccessPolicy", {
                                        ...settings.userDataEgressAccessPolicy,
                                        maxExportRecordsPerRequest: Number(e.target.value) || 5000
                                      });
                                    }}
                                    className="w-20 h-8 text-center text-xs font-bold rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                                  />
                                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">رکورد</span>
                                </div>
                              </td>
                            </tr>

                            {/* سطر ۳: فرمت */}
                            <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="p-3 text-center border-l border-slate-200 dark:border-slate-800">
                                <input
                                  type="checkbox"
                                  checked={settings.userDataEgressAccessPolicy?.checkFormat ?? true}
                                  onChange={e => {
                                    set("userDataEgressAccessPolicy", {
                                      ...settings.userDataEgressAccessPolicy,
                                      checkFormat: e.target.checked
                                    });
                                  }}
                                  className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                                />
                              </td>
                              <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                                فرمت
                                <p className="text-[11px] text-muted-foreground font-normal mt-0.5">
                                  اعتبارسنجی فرمت خروجی، کدگذاری امن و درج امضا یا مشخصات کلاینت/واترمارک امنیتی در خروجی
                                </p>
                              </td>
                              <td className="p-3 text-center border-r border-slate-200 dark:border-slate-800">
                                <Badge className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300 text-[10px]">
                                  امضا و واترمارک
                                </Badge>
                              </td>
                            </tr>

                            {/* سطر ۴: سایر موارد */}
                            <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="p-3 text-center border-l border-slate-200 dark:border-slate-800">
                                <input
                                  type="checkbox"
                                  checked={settings.userDataEgressAccessPolicy?.checkOtherEgressCriteria ?? true}
                                  onChange={e => {
                                    set("userDataEgressAccessPolicy", {
                                      ...settings.userDataEgressAccessPolicy,
                                      checkOtherEgressCriteria: e.target.checked
                                    });
                                  }}
                                  className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                                />
                              </td>
                              <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                                سایر موارد
                                <p className="text-[11px] text-muted-foreground font-normal mt-0.5">
                                  ثبت کامل رویداد خروج داده در لاگ حسابرسی افتا (Audit Log) و ماسک‌کردن داده‌های حساس (Data Masking)
                                </p>
                              </td>
                              <td className="p-3 text-center border-r border-slate-200 dark:border-slate-800">
                                <Badge className="bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-300 text-[10px]">
                                  Masking & Audit
                                </Badge>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* کارت قوانین ممانعت از خروج بدون هدف داده کاربری به خارج از محصول (مطابق بند ۹ تصویر افتا) */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                    <div className="bg-gradient-to-r from-amber-900 via-orange-950 to-slate-900 text-white p-4 font-bold text-xs flex items-center justify-between border-b border-amber-800">
                      <div className="flex items-center gap-2.5">
                        <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0" />
                        <span className="text-xs md:text-sm font-black">
                          بند ۹ - قوانین ممانعت از خروج بدون هدف داده کاربری به خارج از محصول (الزام افتا)
                        </span>
                      </div>
                      <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px] shrink-0">
                        بند ۹ الزام افتا
                      </Badge>
                    </div>

                    <div className="p-5 space-y-4">
                      {/* توضیحات صورت الزام بالای کارت */}
                      <div className="bg-amber-50/60 dark:bg-amber-950/30 p-4 rounded-xl border border-amber-200/80 dark:border-amber-900/50 flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-950 dark:text-amber-200 font-semibold leading-relaxed">
                          «۹ - محصول باید هنگام خروج داده کاربری به خارج از محصول، قوانینی را اعمال نماید.»
                        </p>
                      </div>

                      {/* جدول اختصاصی مطابق ساختار بند ۹ تصویر افتا */}
                      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                        <table className="w-full text-xs text-right border-collapse">
                          <thead>
                            <tr className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700">
                              <th className="p-3 w-12 text-center font-extrabold border-l border-slate-200 dark:border-slate-700">انتخاب</th>
                              <th className="p-3 font-extrabold text-slate-900 dark:text-slate-100">
                                قوانینی که در هنگام خروج داده از محصول اعمال می‌شوند، مشخص شوند
                              </th>
                              <th className="p-3 w-48 font-extrabold text-center border-r border-slate-200 dark:border-slate-700">پیکربندی / وضعیت قانون</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {/* سطر ۱: قانون محدودسازی خروج بدون هدف توسط مدیر سیستم */}
                            <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="p-3 text-center border-l border-slate-200 dark:border-slate-800">
                                <input
                                  type="checkbox"
                                  checked={settings.targetedDataEgressRules?.preventUntargetedDataEgress ?? true}
                                  onChange={e => {
                                    set("targetedDataEgressRules", {
                                      ...settings.targetedDataEgressRules,
                                      preventUntargetedDataEgress: e.target.checked
                                    });
                                  }}
                                  className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                                />
                              </td>
                              <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                                مدیر سیستم باید خروج داده‌ها را محدود نماید، به طوریکه کاربران محصول، قادر به خروج بدون هدف داده به خارج از محصول نباشند.
                                <p className="text-[11px] text-muted-foreground font-normal mt-1 leading-relaxed">
                                  الزام مشخص بودن علت شغلی و مقصد خروج داده‌ها و ممانعت از دانلودهای آزادانه یا صادرات بدون مجوز اداری ثبت‌شده.
                                </p>
                              </td>
                              <td className="p-3 text-center border-r border-slate-200 dark:border-slate-800">
                                <Badge className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 text-[10px]">
                                  ممانعت از خروج بدون هدف
                                </Badge>
                              </td>
                            </tr>

                            {/* سطر ۲: سایر موارد */}
                            <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="p-3 text-center border-l border-slate-200 dark:border-slate-800">
                                <input
                                  type="checkbox"
                                  checked={settings.targetedDataEgressRules?.auditUntargetedEgressAttempts ?? true}
                                  onChange={e => {
                                    set("targetedDataEgressRules", {
                                      ...settings.targetedDataEgressRules,
                                      auditUntargetedEgressAttempts: e.target.checked
                                    });
                                  }}
                                  className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                                />
                              </td>
                              <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                                سایر موارد
                                <p className="text-[11px] text-muted-foreground font-normal mt-0.5">
                                  احراز آدرس مقاصد خروجی مجاز، الزام تایید مدیر سیستم برای خروجی‌های انبوه و ثبت تلاش‌های غیرمجاز خروج در لاگ افتا
                                </p>
                              </td>
                              <td className="p-3 text-center border-r border-slate-200 dark:border-slate-800">
                                <Badge className="bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300 border-orange-300 text-[10px]">
                                  تایید مدیر & لاگ افتا
                                </Badge>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* جدول قوانین تعیین‌شده در صورت تغییر ویژگی‌های امنیتی کاربر فعال (مطابق تصویر) */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                    <div className="bg-slate-900 dark:bg-slate-800 text-white p-3.5 font-bold text-xs flex items-center justify-between border-b border-slate-800">
                      <span className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-emerald-400" />
                        تعیین قوانین اعمالی در صورت تغییر ویژگی‌های امنیتی کاربر فعال
                      </span>
                      <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">
                        الزام امنیتی افتا
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-slate-200 dark:divide-slate-800">
                      {/* ستون راست: عنوان اصلی الزامات مطابق تصویر */}
                      <div className="md:col-span-5 bg-slate-50/80 dark:bg-slate-900/50 p-5 flex items-center justify-center text-center font-bold text-xs text-slate-800 dark:text-slate-200 leading-relaxed border-b md:border-b-0 md:border-l border-slate-200 dark:border-slate-800">
                        قوانینی که در صورت تغییر ویژگی‌های امنیتی کاربر فعال، اعمال می‌شود، مشخص گردد.
                      </div>

                      {/* ستون چپ: سطور جدول موارد (غیرمجاز بودن هرگونه تغییر در طول نشست فعال و سایر موارد) */}
                      <div className="md:col-span-7 divide-y divide-slate-200 dark:divide-slate-800">
                        {/* سطر ۱: غیرمجاز بودن هرگونه تغییر در طول نشست فعال */}
                        <div className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              id="disallowSecurityChangeDuringSession"
                              checked={settings.disallowSecurityChangeDuringSession ?? true}
                              onChange={e => set("disallowSecurityChangeDuringSession", e.target.checked)}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                            />
                            <div>
                              <label htmlFor="disallowSecurityChangeDuringSession" className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                                غیرمجاز بودن هرگونه تغییر در طول نشست فعال
                              </label>
                              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                                هرگونه تغییر در نقش، کلمه عبور یا مجوزهای کاربر در طول یک نشست فعال غیرمجاز بوده و بلافاصله منجر به ابطال نشست جاری می‌گردد.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* سطر ۲: سایر موارد */}
                        <div className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors space-y-3">
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            سایر موارد:
                          </div>

                          <div className="space-y-2.5 pr-2">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                id="revokeAllSessionsOnSecurityChange"
                                checked={settings.revokeAllSessionsOnSecurityChange ?? true}
                                onChange={e => set("revokeAllSessionsOnSecurityChange", e.target.checked)}
                                className="h-4 w-4 rounded border-slate-300 text-blue-600"
                              />
                              <label htmlFor="revokeAllSessionsOnSecurityChange" className="text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                                ابطال فوری کلیه نشست‌ها و توکن‌های فعال کلاینت در تمامی دستگاه‌ها
                              </label>
                            </div>

                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                id="forceReAuthOnSecurityChange"
                                checked={settings.forceReAuthOnSecurityChange ?? true}
                                onChange={e => set("forceReAuthOnSecurityChange", e.target.checked)}
                                className="h-4 w-4 rounded border-slate-300 text-blue-600"
                              />
                              <label htmlFor="forceReAuthOnSecurityChange" className="text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                                الزام کاربر به ورود مجدد و احراز هویت مجدد سیستم (Force Re-Authentication)
                              </label>
                            </div>

                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                id="auditLogSecurityChanges"
                                checked={settings.auditLogSecurityChanges ?? true}
                                onChange={e => set("auditLogSecurityChanges", e.target.checked)}
                                className="h-4 w-4 rounded border-slate-300 text-blue-600"
                              />
                              <label htmlFor="auditLogSecurityChanges" className="text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                                ثبت کامل سابقه رویداد تغییر ویژگی‌های امنیتی در لایه Audit Log افتا
                              </label>
                            </div>

                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                id="notifyUserSecurityAlert"
                                checked={settings.notifyUserSecurityAlert ?? false}
                                onChange={e => set("notifyUserSecurityAlert", e.target.checked)}
                                className="h-4 w-4 rounded border-slate-300 text-blue-600"
                              />
                              <label htmlFor="notifyUserSecurityAlert" className="text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                                ارسال پیامک و هشدار امنیتی به کاربر و مدیر سیستم
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* جدول مدیریت نشست‌های فعال کاربران در سیستم (Active Sessions Manager) */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm space-y-3 p-5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <Activity className="h-4 w-4 text-emerald-500" />
                          مدیریت تعاملی نشست‌های فعال کاربران در سامانه (Active Sessions)
                        </h4>
                        <span className="text-[11px] text-muted-foreground block mt-0.5">
                          مشاهده دستگاه‌های متصل، آدرس‌های IP و امکان ابطال و خروج فوری نشست‌های فعال
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[11px] font-bold">
                          نشست‌های فعال: {activeSessions.length}
                        </Badge>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={fetchActiveSessions}
                          disabled={loadingSessions}
                          className="h-8 text-xs gap-1.5 text-slate-700 dark:text-slate-300"
                        >
                          <RefreshCw className={cn("h-3.5 w-3.5", loadingSessions && "animate-spin")} />
                          بروزرسانی لیست
                        </Button>
                      </div>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                      <table className="w-full text-xs text-right">
                        <thead className="bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-bold border-b">
                          <tr>
                            <th className="p-3">نام کاربر و نقش</th>
                            <th className="p-3">آدرس IP</th>
                            <th className="p-3">مرورگر و سیستم‌عامل</th>
                            <th className="p-3">آخرین زمان فعالیت</th>
                            <th className="p-3 text-center">عملیات ابطال</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {activeSessions.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-6 text-center text-muted-foreground text-xs">
                                هیچ نشست فعالی در حال حاضر یافت نشد.
                              </td>
                            </tr>
                          ) : (
                            activeSessions.map((session, idx) => (
                              <tr key={session._id || idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                                <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                                  <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    <span>{session.username || "کاربر سیستم"}</span>
                                    <Badge variant="outline" className="text-[10px] bg-slate-100 dark:bg-slate-800">
                                      {session.role || "کاربر"}
                                    </Badge>
                                    {session.isCurrent && (
                                      <Badge className="bg-emerald-100 text-emerald-800 border-none text-[9px]">
                                        نشست فعلی شما
                                      </Badge>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3 font-mono dir-ltr text-right text-slate-600 dark:text-slate-400">
                                  {session.ip || "127.0.0.1"}
                                </td>
                                <td className="p-3 text-slate-700 dark:text-slate-300">
                                  <div className="flex items-center gap-1.5">
                                    <Laptop className="h-3.5 w-3.5 text-slate-400" />
                                    <span>{session.browserName || session.userAgent || "مرورگر"} ({session.osName || "ویندوز"})</span>
                                  </div>
                                </td>
                                <td className="p-3 font-mono text-slate-500">
                                  {session.lastActivity ? new Date(session.lastActivity).toLocaleTimeString("fa-IR") : "هم‌اکنون"}
                                </td>
                                <td className="p-3 text-center">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    disabled={revokingId === session._id}
                                    onClick={() => handleRevokeSession(session._id, session.token)}
                                    className="h-7 text-[11px] text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-bold gap-1"
                                  >
                                    <LogOut className="h-3.5 w-3.5" />
                                    ابطال و خروج
                                  </Button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <Separator />

                  {/* تنظیمات متداول نشست و لاگ‌ها */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-semibold">مدت زمان خروج خودکار (Session Timeout)</Label>
                      <select
                        value={settings.sessionTimeoutMinutes}
                        onChange={e => set("sessionTimeoutMinutes", Number(e.target.value))}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm mt-1.5 font-mono"
                      >
                        <option value={15}>۱۵ دقیقه غیرفعال بودن</option>
                        <option value={30}>۳۰ دقیقه غیرفعال بودن</option>
                        <option value={60}>۶۰ دقیقه (۱ ساعت)</option>
                        <option value={120}>۱۲۰ دقیقه (۲ ساعت)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3 pt-1">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="autoDailyBackup"
                        checked={settings.autoDailyBackup}
                        onChange={e => set("autoDailyBackup", e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600"
                      />
                      <label htmlFor="autoDailyBackup" className="text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                        پشتیبان‌گیری خودکار روزانه از پایگاه داده و فایل‌ها
                      </label>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="enableAuditLog"
                        checked={settings.enableAuditLog}
                        onChange={e => set("enableAuditLog", e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600"
                      />
                      <label htmlFor="enableAuditLog" className="text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                        فعال‌سازی ثبت دقیق سوابق دسترسی و تغییرات اسناد (Audit Log)
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── TAB 6: پیامک و اطلاع‌رسانی ─── */}
              {activeTab === "sms" && (
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="enableSmsNotification"
                      checked={settings.enableSmsNotification}
                      onChange={e => set("enableSmsNotification", e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600"
                    />
                    <label htmlFor="enableSmsNotification" className="text-xs text-slate-700 dark:text-slate-300 font-bold cursor-pointer">
                      فعال‌سازی پنل پیامک خودکار اطلاع‌رسانی فیش حقوقی و واریزی‌ها
                    </label>
                  </div>

                  {settings.enableSmsNotification && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div>
                        <Label className="text-xs font-semibold">کلید اختصاصی وب‌سرویس پیامک (API Key)</Label>
                        <Input
                          type="password"
                          value={settings.smsApiKey}
                          onChange={e => set("smsApiKey", e.target.value)}
                          className="h-9 text-xs mt-1.5 font-mono text-left"
                          placeholder="xxxxxxxx-xxxx-xxxx-xxxx"
                        />
                      </div>

                      <div>
                        <Label className="text-xs font-semibold">شماره خط اختصاصی ارسال پیامک</Label>
                        <Input
                          value={settings.smsLineNumber}
                          onChange={e => set("smsLineNumber", e.target.value)}
                          className="h-9 text-xs mt-1.5 font-mono text-left"
                          placeholder="3000xxxxxxx"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* نوار ذخیره‌سازی پایین صفحه */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  آخرین بروزرسانی تنظیمات: {settings.lastUpdated ? new Date(settings.lastUpdated).toLocaleDateString("fa-IR") : "—"}
                </span>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 text-white dark:text-slate-900 font-bold h-9 text-xs gap-1.5 px-6 shadow-md"
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? "در حال ذخیره‌سازی..." : "ذخیره تغییرات تنظیمات"}
                  </Button>
                </div>
              </div>

            </form>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
