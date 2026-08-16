import { useState, useEffect, useRef } from "react";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Settings, Save, RefreshCw, ShieldCheck, AlertCircle, AlertTriangle, CheckCircle2,
  FileText, Printer, Lock, Sliders, Bell, Database, Download, Upload,
  Calendar, Clock, Trash2, FileCheck, HelpCircle, HardDrive, Check,
  FolderArchive, Sparkles, ArrowDownToLine, ArrowUpFromLine, Laptop, Activity, LogOut,
  User, UserCheck, KeyRound, Shield, ShieldAlert, ChevronDown, ChevronUp
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

  // ۱۷. بند ۱۰ افتا: تشخیص تغییر غیرمجاز در داده کاربری حساس ذخیره‌شده در محصول (مطابق تصویر جدید افتا)
  sensitiveDataIntegrityPolicy: {
    enableTamperDetection: true,
    maintainHashedValues: true, // مقدار درهم‌سازی‌شده داده‌های کاربری ذخیره‌شده، نگهداری می‌شود (سطر ۱ تصویر)
    maintainDigitalSignatures: true,
    otherTamperDetection: true, // سایر موارد (سطر ۲ تصویر)
    autoBlockOnTamperAlert: true,
    auditLogTamperEvents: true,
  },

    // ۱۸. بند ۱۱ افتا: اقدامات مقابله‌ای در صورت تشخیص خطای صحت در داده‌ها (مطابق تصویر جدید افتا)
  dataIntegrityErrorResponsePolicy: {
    enableErrorResponse: true,
    notifyAuthorizedRoles: true, // ایجاد هشدار/اخطار برای نقش‌های مجاز (سطر ۱ تصویر)
    autoRollbackToPreviousState: true, // تصحیح داده بر اساس مقادیر قبل (سطر ۲ تصویر)
    otherResponseActions: true, // سایر موارد (ثبت در لاگ افتا و توقیف تراکنش مخدوش)
    auditLogErrorEvents: true,
  },

    // ۱۹. الزام ۱ مدیریت امنیت: مدیریت کارکردهای امنیتی مربوط به مدیریت محصول
  securityFunctionsManagementPolicy: {
    enableFunctionsMgmt: true,
    behaviorConfiguration: true, // تعیین و تغییر رفتار
    disableFunctions: true, // غیرفعال نمودن
    enableFunctions: true, // فعال نمودن
    otherFunctionsMgmt: true, // سایر موارد (لاگ‌گیری، تخصیص نقش، خروجی/ورودی)
  },

  // ۲۰. الزام ۲ مدیریت امنیت: محدودسازی عملیات بر روی ویژگی‌های امنیتی احراز هویت (Class 7)
  authSecurityAttributesPolicy: {
    enableAuthSecurityMgmt: true,
    querySecurityAttributes: true, // پرس‌و‌جو
    modifySecurityAttributes: true, // تغییر
    deleteSecurityAttributes: true, // حذف
    changeDefaultSecurityAttributes: true, // تغییر پیش‌فرض
    otherAuthSecurityOps: true, // سایر موارد
  },

  // ۲۱. الزام ۳ مدیریت امنیت: محدودسازی کارکردهای عملیاتی بر روی داده‌های محصول
  productDataManagementPolicy: {
    enableProductDataMgmt: true,
    changeDefaultData: true, // تغییر پیش‌فرض
    deleteData: true, // حذف نمودن
    queryData: true, // پرس‌و‌جو
    initializeData: true, // مقداردهی
    createData: true, // ایجاد
    readData: true, // مشاهده (مطابق تصویر جدید)
    otherDataOps: true, // سایر موارد (مطابق تصویر جدید)
  },

    // ۲۲. الزام ۴ مدیریت امنیت: توانایی‌های کارکردهای مدیریت امنیتی محصول (مطابق ۲ تصویر جدید)
  securityManagementCapabilitiesPolicy: {
    enableCapabilitiesMgmt: true,
    groupUserAuditTokenRead: true,
    auditTokenReadWritePerms: true,
    auditTokenStorageThresholdOps: true,
    accessCriteriaParametersMgmt: true,
    residualDataProtectionTimingConfig: true,
    dataInputValidationRulesEdit: true,
    dataIntegrityErrorActionConfig: true,
    failedAuthThresholdMgmt: true,
    passwordComplexityCriteriaMgmt: true,
    authDataAndPreAuthOpsMgmt: true,
    authMechanismsAndRulesMgmt: true,
    preAuthIpAssignmentProcessMgmt: true,
    defaultActiveEntitySecurityAttrsMgmt: true,
    defaultProductAccessControlValuesMgmt: true,
    productRolesMgmt: true,
    maxConcurrentSessionsPerUserMgmt: true,
    sessionStartConditionsMgmt: true,
    specificUserInactivityTimeoutConfig: true, // سطر ۱ تصویر ۲
    defaultUsersInactivityTimeoutConfig: true, // سطر ۲ تصویر ۲
  },

  // ۲۳. بند ۵ افتا: توانایی تعریف نقش‌های مختلف در محصول
  productRolesDefinitionPolicy: {
    enableRolesDefinition: true,
    supportedRoles: {
      systemAdmin: true, // مدیر سیستم
      advancedSupportUser: true, // پشتیبانی / کاربر پیشرفته
      regularUser: true, // کاربر عادی
      otherCustomRoles: true, // سایر موارد
    },
    auditLogRoleChanges: true,
  },

  // ۲۴. بند ۶ افتا: ارتباط کاربران به نقش‌های تعریف‌شده و الزام ۱ نقش به هر حساب
  userRoleAssignmentPolicy: {
    enableRoleAssignment: true,
    singleRolePerAccountEnforcement: true, // هر حساب کاربری تنها به یک نقش مرتبط است
    allowMultiUsersPerRole: true, // چندین کاربر می‌توانند نقش مشابهی داشته باشند
    auditRoleAssignmentChanges: true,
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

// ─── کامپوننت کارت آکاردئونی الزامات افتا (Compact AFTA Accordion Card) ────────
function AftaAccordionCard({ id, title, description, isOpen, onToggle, children, icon: Icon = Shield }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-all duration-200">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="w-full bg-slate-900 dark:bg-slate-800 text-white p-4 font-bold text-xs flex items-center justify-between transition-colors hover:bg-slate-850 dark:hover:bg-slate-750 text-right cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-inner">
            <Icon className="h-4.5 w-4.5" />
          </div>
          <div>
            <span className="text-sm font-black text-amber-300">{title}</span>
            {description && (
              <p className="text-[11px] font-normal text-slate-300 mt-0.5 line-clamp-1">
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center shrink-0">
          <ChevronDown className={cn("h-5 w-5 text-amber-400 transition-transform duration-300", isOpen && "rotate-180")} />
        </div>
      </button>

      {isOpen && (
        <div className="p-5 space-y-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 animate-in fade-in duration-200">
          {children}
        </div>
      )}
    </div>
  );
}

export default function SystemSettingsForm() {
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [backups, setBackups] = useState(DEFAULT_BACKUPS);
  const [entityPolicies, setEntityPolicies] = useState(DEFAULT_ENTITY_ACCESS_POLICIES);
  const [selectedRoleTab, setSelectedRoleTab] = useState("systemAdmin"); // systemAdmin, regularUser, otherRoles
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // حالت آکاردئونی الزامات افتا
  const [openAftaSections, setOpenAftaSections] = useState({ afta_matrix: true });

  const toggleAftaSection = (id) => {
    setOpenAftaSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const ALL_AFTA_KEYS = [
    "afta_matrix",
    "afta_security_change_rules",
    "afta_inactive_policies",
    "afta_inactive_operations",
    "afta_inactive_criteria",
    "afta_active_inactive_interaction",
    "afta_access_prevention",
    "afta_resource_sanitization",
    "afta_data_input_access",
    "afta_sensitive_data_tamper",
    "afta_data_integrity_error_response",
    "afta_secure_transport",
    "afta_data_egress_access",
    "afta_targeted_egress_rules",
    "afta_sec_mgmt_functions",
    "afta_sec_mgmt_auth_attrs",
    "afta_sec_mgmt_product_data",
    "afta_sec_mgmt_capabilities",
    "afta_product_roles_def",
    "afta_user_role_assignment",
    "afta_active_sessions"
  ];

  const expandAllAfta = () => {
    const all = {};
    ALL_AFTA_KEYS.forEach(k => { all[k] = true; });
    setOpenAftaSections(all);
  };

  const collapseAllAfta = () => {
    setOpenAftaSections({});
  };

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
          productRolesDefinitionPolicy: p.productRolesDefinitionPolicy || prev.productRolesDefinitionPolicy,
          userRoleAssignmentPolicy: p.userRoleAssignmentPolicy || prev.userRoleAssignmentPolicy,
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
      productRolesDefinitionPolicy: s.productRolesDefinitionPolicy,
      userRoleAssignmentPolicy: s.userRoleAssignmentPolicy,
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
                <div className="space-y-4">
                  {/* نوار کنترل آکاردئون‌های افتا */}
                  <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-4 rounded-2xl shadow-md border border-blue-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="h-6 w-6 text-emerald-400 shrink-0" />
                      <div>
                        <h3 className="text-sm md:text-base font-black text-slate-100 flex items-center gap-2">
                          مجموعه کامل الزامات امنیتی و استانداردهای افتا (آفتامدیریت محصول)
                        </h3>
                        <p className="text-[11px] text-blue-200/90 mt-0.5">
                          جهت مشاهده، پیکربندی یا تغییر پارامترهای هر بند، روی عنوان آن کلیک کنید تا پنل کشویی باز شود.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={expandAllAfta}
                        className="h-8 text-xs font-bold gap-1 bg-white/10 text-white hover:bg-white/20 border-white/20"
                      >
                        <ChevronDown className="h-3.5 w-3.5 text-amber-300" /> باز کردن همه
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={collapseAllAfta}
                        className="h-8 text-xs font-bold gap-1 bg-white/10 text-white hover:bg-white/20 border-white/20"
                      >
                        <ChevronUp className="h-3.5 w-3.5 text-rose-300" /> بستن همه
                      </Button>
                    </div>
                  </div>

                  {/* ۱. ماتریس خط‌مشی دسترسی موجودیت‌های فعال (بند ۱ افتا) */}
                  <AftaAccordionCard
                    id="afta_matrix"
                    number="بند ۱ افتا"
                    title="ماتریس خط‌مشی کنترل دسترسی به موجودیت‌های فعال و عملیات"
                    description="تعیین مجوزهای مشاهده، ایجاد، ویرایش، حذف، تایید و خروجی به تفکیک نقش‌های مدیر سیستم و کاربران"
                    isOpen={!!openAftaSections["afta_matrix"]}
                    onToggle={toggleAftaSection}
                    icon={Sliders}
                  >
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          انتخاب دسته نقش و اعمال مجوزهای عملیاتی
                        </span>
                        <Button
                          type="button"
                          onClick={handleSaveEntityPolicies}
                          className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 px-3 shadow-sm"
                        >
                          <Save className="h-3.5 w-3.5" />
                          ذخیره خط‌مشی‌ها
                        </Button>
                      </div>

                      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                        {[
                          { id: "systemAdmin", label: "مدیر سیستم" },
                          { id: "regularUser", label: "کاربر عادی" },
                          { id: "otherRoles", label: "سایر موارد (نقش‌های سفارشی)" }
                        ].map(cat => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setSelectedRoleTab(cat.id)}
                            className={cn(
                              "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                              selectedRoleTab === cat.id
                                ? "bg-blue-600 text-white border-blue-600 shadow-md"
                                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                            )}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>

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
                  </AftaAccordionCard>

                  {/* ۲. قوانین تغییر ویژگی‌های امنیتی کاربر فعال (بند ۶ افتا) */}
                  <AftaAccordionCard
                    id="afta_security_change_rules"
                    number="بند ۶ افتا"
                    title="تعیین قوانین اعمالی در صورت تغییر ویژگی‌های امنیتی کاربر فعال"
                    description="غیرمجاز بودن هرگونه تغییر در طول نشست فعال، ابطال فوری نشست‌ها و لزوم احراز هویت مجدد"
                    isOpen={!!openAftaSections["afta_security_change_rules"]}
                    onToggle={toggleAftaSection}
                    icon={Lock}
                  >
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
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

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                          <input
                            type="checkbox"
                            checked={settings.revokeAllSessionsOnSecurityChange ?? true}
                            onChange={e => set("revokeAllSessionsOnSecurityChange", e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600"
                          />
                          <span>ابطال فوری کلیه نشست‌ها و توکن‌های فعال کلاینت در تمامی دستگاه‌ها</span>
                        </label>

                        <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                          <input
                            type="checkbox"
                            checked={settings.forceReAuthOnSecurityChange ?? true}
                            onChange={e => set("forceReAuthOnSecurityChange", e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600"
                          />
                          <span>الزام کاربر به ورود مجدد و احراز هویت مجدد سیستم (Force Re-Authentication)</span>
                        </label>

                        <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                          <input
                            type="checkbox"
                            checked={settings.auditLogSecurityChanges ?? true}
                            onChange={e => set("auditLogSecurityChanges", e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600"
                          />
                          <span>ثبت کامل سابقه رویداد تغییر ویژگی‌های امنیتی در لایه Audit Log افتا</span>
                        </label>

                        <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                          <input
                            type="checkbox"
                            checked={settings.notifyUserSecurityAlert ?? false}
                            onChange={e => set("notifyUserSecurityAlert", e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600"
                          />
                          <span>ارسال پیامک و هشدار امنیتی به کاربر و مدیر سیستم</span>
                        </label>
                      </div>
                    </div>
                  </AftaAccordionCard>

                  {/* ۳. خط‌مشی‌های کنترل دسترسی موجودیت‌های غیرفعال (بند ۷ افتا) */}
                  <AftaAccordionCard
                    id="afta_inactive_policies"
                    number="بند ۷ افتا"
                    title="تعیین خط‌مشی‌های کنترل دسترسی در مورد موجودیت‌های غیرفعال"
                    description="تعیین تکالیف مجوزهای عملیاتی بر روی سوابق، مستندات، داده‌های کاربر غیرفعال و احراز هویت"
                    isOpen={!!openAftaSections["afta_inactive_policies"]}
                    onToggle={toggleAftaSection}
                    icon={FolderArchive}
                  >
                    <div className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900 rounded-xl border">
                      <div className="p-4 space-y-2">
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
                                  set("inactiveEntityPolicies", {
                                    ...settings.inactiveEntityPolicies,
                                    recordsDocsMetadata: {
                                      ...settings.inactiveEntityPolicies?.recordsDocsMetadata,
                                      [op.key]: e.target.checked
                                    }
                                  });
                                }}
                                className="h-3.5 w-3.5 rounded border-slate-300 text-amber-600"
                              />
                              <span>{op.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="p-4 space-y-2">
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
                                  set("inactiveEntityPolicies", {
                                    ...settings.inactiveEntityPolicies,
                                    userBelongingData: {
                                      ...settings.inactiveEntityPolicies?.userBelongingData,
                                      [op.key]: e.target.checked
                                    }
                                  });
                                }}
                                className="h-3.5 w-3.5 rounded border-slate-300 text-amber-600"
                              />
                              <span>{op.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="p-4 space-y-2">
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
                                  set("inactiveEntityPolicies", {
                                    ...settings.inactiveEntityPolicies,
                                    authData: {
                                      ...settings.inactiveEntityPolicies?.authData,
                                      [op.key]: e.target.checked
                                    }
                                  });
                                }}
                                className="h-3.5 w-3.5 rounded border-slate-300 text-amber-600"
                              />
                              <span>{op.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </AftaAccordionCard>

                  {/* ۴. خط‌مشی‌های عملیاتی موجودیت‌های غیرفعال (بند ۸ افتا) */}
                  <AftaAccordionCard
                    id="afta_inactive_operations"
                    number="بند ۸ افتا"
                    title="تعیین خط‌مشی‌های کنترل دسترسی عملیاتی بر روی موجودیت‌های غیرفعال"
                    description="تعیین ضوابط ایجاد، حذف، تغییر دسترسی و متاداده موجودیت‌های غیرفعال"
                    isOpen={!!openAftaSections["afta_inactive_operations"]}
                    onToggle={toggleAftaSection}
                    icon={Sliders}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                        <input
                          type="checkbox"
                          checked={settings.inactiveEntityOperationsPolicy?.createInactiveEntity?.requireAdminApproval ?? true}
                          onChange={e => {
                            set("inactiveEntityOperationsPolicy", {
                              ...settings.inactiveEntityOperationsPolicy,
                              createInactiveEntity: {
                                ...settings.inactiveEntityOperationsPolicy?.createInactiveEntity,
                                requireAdminApproval: e.target.checked
                              }
                            });
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-purple-600"
                        />
                        <span>ایجاد موجودیت غیرفعال نیازمند تایید مدیر ارشد سیستم</span>
                      </label>

                      <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                        <input
                          type="checkbox"
                          checked={settings.inactiveEntityOperationsPolicy?.deleteInactiveEntity?.preventHardDelete ?? true}
                          onChange={e => {
                            set("inactiveEntityOperationsPolicy", {
                              ...settings.inactiveEntityOperationsPolicy,
                              deleteInactiveEntity: {
                                ...settings.inactiveEntityOperationsPolicy?.deleteInactiveEntity,
                                preventHardDelete: e.target.checked
                              }
                            });
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-purple-600"
                        />
                        <span>ممانعت از حذف فیزیکی (Hard Delete) موجودیت‌های غیرفعال و ثبت در بایگانی</span>
                      </label>

                      <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                        <input
                          type="checkbox"
                          checked={settings.inactiveEntityOperationsPolicy?.changeInactiveAccess?.notifySecurityOfficer ?? true}
                          onChange={e => {
                            set("inactiveEntityOperationsPolicy", {
                              ...settings.inactiveEntityOperationsPolicy,
                              changeInactiveAccess: {
                                ...settings.inactiveEntityOperationsPolicy?.changeInactiveAccess,
                                notifySecurityOfficer: e.target.checked
                              }
                            });
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-purple-600"
                        />
                        <span>ارسال هشدار فوری به مسؤول امنیت سیستم هنگام تغییر دسترسی موجودیت غیرفعال</span>
                      </label>

                      <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                        <input
                          type="checkbox"
                          checked={settings.inactiveEntityOperationsPolicy?.inactiveMetadataOps?.checkIntegrity ?? true}
                          onChange={e => {
                            set("inactiveEntityOperationsPolicy", {
                              ...settings.inactiveEntityOperationsPolicy,
                              inactiveMetadataOps: {
                                ...settings.inactiveEntityOperationsPolicy?.inactiveMetadataOps,
                                checkIntegrity: e.target.checked
                              }
                            });
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-purple-600"
                        />
                        <span>کنترل یکپارچگی فراداده و هش اسناد هنگام دسترسی به موجودیت غیرفعال</span>
                      </label>
                    </div>
                  </AftaAccordionCard>

                  {/* ۵. ویژگی‌های تعریف خط‌مشی‌های موجودیت‌های غیرفعال (بند ۹ افتا) */}
                  <AftaAccordionCard
                    id="afta_inactive_criteria"
                    number="بند ۹ افتا"
                    title="ویژگی‌های تعریف خط‌مشی‌های موجودیت‌های غیرفعال"
                    description="تعیین ویژگی‌های کنترل دسترسی بر اساس نقش‌ها، مجوزها، پارامترهای درخواست و اطلاعات نشست"
                    isOpen={!!openAftaSections["afta_inactive_criteria"]}
                    onToggle={toggleAftaSection}
                    icon={Check}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                        <input
                          type="checkbox"
                          checked={settings.inactiveEntityPolicyCriteria?.useUserRolesAndPermissions ?? true}
                          onChange={e => {
                            set("inactiveEntityPolicyCriteria", {
                              ...settings.inactiveEntityPolicyCriteria,
                              useUserRolesAndPermissions: e.target.checked
                            });
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                        />
                        <span>استفاده از نقش‌ها و مجوزهای امنیتی کاربر جهت ارزیابی دسترسی</span>
                      </label>

                      <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                        <input
                          type="checkbox"
                          checked={settings.inactiveEntityPolicyCriteria?.useSessionInfoAndRequestParams ?? true}
                          onChange={e => {
                            set("inactiveEntityPolicyCriteria", {
                              ...settings.inactiveEntityPolicyCriteria,
                              useSessionInfoAndRequestParams: e.target.checked
                            });
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                        />
                        <span>استفاده از اطلاعات نشست فعال (IP، توکن و آستانه زمانی) و پارامترهای درخواست</span>
                      </label>
                    </div>
                  </AftaAccordionCard>

                  {/* ۶. مجازسازی عملیات بین موجودیت فعال و غیرفعال (الزام افتا) */}
                  <AftaAccordionCard
                    id="afta_active_inactive_interaction"
                    number="الزام افتا"
                    title="مجازسازی عملیات بین موجودیت فعال تحت کنترل و موجودیت غیرفعال"
                    description="بررسی صریح سابقه تعاملی در جدول کنترل دسترسی (ACL) و ممانعت از تعامل‌های غیرمجاز"
                    isOpen={!!openAftaSections["afta_active_inactive_interaction"]}
                    onToggle={toggleAftaSection}
                    icon={ShieldCheck}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                        <input
                          type="checkbox"
                          checked={settings.activeInactiveInteractionPolicy?.enableACLCheck ?? true}
                          onChange={e => {
                            set("activeInactiveInteractionPolicy", {
                              ...settings.activeInactiveInteractionPolicy,
                              enableACLCheck: e.target.checked
                            });
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600"
                        />
                        <span>فعال‌سازی بررسی صریح جدول کنترل دسترسی (ACL) برای تعامل موجودیت‌ها</span>
                      </label>

                      <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                        <input
                          type="checkbox"
                          checked={settings.activeInactiveInteractionPolicy?.requireExplicitACLRecord ?? true}
                          onChange={e => {
                            set("activeInactiveInteractionPolicy", {
                              ...settings.activeInactiveInteractionPolicy,
                              requireExplicitACLRecord: e.target.checked
                            });
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600"
                        />
                        <span>الزام وجود سابقه صریح تعاملی (در صورت نبود سابقه تعامل بلافاصله مسدود گردد)</span>
                      </label>
                    </div>
                  </AftaAccordionCard>

                  {/* ۷. قوانین ممانعت از دسترسی موجودیت فعال به غیرفعال (الزام افتا) */}
                  <AftaAccordionCard
                    id="afta_access_prevention"
                    number="الزام افتا"
                    title="قوانین ممانعت از دسترسی موجودیت فعال به موجودیت غیرفعال"
                    description="ممانعت بر اساس آستانه نشست، تعلیق حساب کاربری و ناهنجاری‌های امنیتی IP"
                    isOpen={!!openAftaSections["afta_access_prevention"]}
                    onToggle={toggleAftaSection}
                    icon={ShieldAlert}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                        <input
                          type="checkbox"
                          checked={settings.activeToInactivePreventionRules?.preventAccessOnExceedingSessionThreshold ?? true}
                          onChange={e => {
                            set("activeToInactivePreventionRules", {
                              ...settings.activeToInactivePreventionRules,
                              preventAccessOnExceedingSessionThreshold: e.target.checked
                            });
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-rose-600"
                        />
                        <span>ممانعت از دسترسی در صورت عبور تعداد نشست‌های همزمان از آستانه مجاز</span>
                      </label>

                      <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                        <input
                          type="checkbox"
                          checked={settings.activeToInactivePreventionRules?.preventAccessOnIPAnomaly ?? true}
                          onChange={e => {
                            set("activeToInactivePreventionRules", {
                              ...settings.activeToInactivePreventionRules,
                              preventAccessOnIPAnomaly: e.target.checked
                            });
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-rose-600"
                        />
                        <span>مسدودسازی دسترسی در صورت کشف ناهنجاری آدرس IP یا تغییر جغرافیایی نامتعارف</span>
                      </label>
                    </div>
                  </AftaAccordionCard>

                  {/* ۸. پاک‌سازی داده‌های مانده (بند ۵ افتا) */}
                  <AftaAccordionCard
                    id="afta_resource_sanitization"
                    number="بند ۵ افتا"
                    title="تضمین پاک‌سازی داده‌های مانده و سازوکار امن دسترسی به منابع قبلی"
                    description="تضمین عدم نشت اطلاعات در تخصیص و آزادسازی منابع، پاک‌سازی کلیدهای رمزنگاری و فایل‌های موقت"
                    isOpen={!!openAftaSections["afta_resource_sanitization"]}
                    onToggle={toggleAftaSection}
                    icon={Trash2}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                        <input
                          type="checkbox"
                          checked={settings.resourceSanitizationPolicy?.wipeCryptoKeysOnRelease ?? true}
                          onChange={e => {
                            set("resourceSanitizationPolicy", {
                              ...settings.resourceSanitizationPolicy,
                              wipeCryptoKeysOnRelease: e.target.checked
                            });
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                        />
                        <span>امحاء و صفر کردن کلیدهای رمزنگاری نشست هنگام آزادسازی منبع</span>
                      </label>

                      <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                        <input
                          type="checkbox"
                          checked={settings.resourceSanitizationPolicy?.sanitizeTempFilesOnRelease ?? true}
                          onChange={e => {
                            set("resourceSanitizationPolicy", {
                              ...settings.resourceSanitizationPolicy,
                              sanitizeTempFilesOnRelease: e.target.checked
                            });
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                        />
                        <span>پاک‌سازی امن فایل‌های موقت (Overwriting Temp Files) پس از پایان تراکنش</span>
                      </label>

                      <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                        <input
                          type="checkbox"
                          checked={settings.resourceSanitizationPolicy?.isolateSessionMemoryBuffers ?? true}
                          onChange={e => {
                            set("resourceSanitizationPolicy", {
                              ...settings.resourceSanitizationPolicy,
                              isolateSessionMemoryBuffers: e.target.checked
                            });
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                        />
                        <span>ایزوله‌سازی بافرهای حافظه نشست و ممانعت از بازخوانی حافظه قبلی</span>
                      </label>

                      <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                        <input
                          type="checkbox"
                          checked={settings.resourceSanitizationPolicy?.auditResourceAllocationAndRelease ?? true}
                          onChange={e => {
                            set("resourceSanitizationPolicy", {
                              ...settings.resourceSanitizationPolicy,
                              auditResourceAllocationAndRelease: e.target.checked
                            });
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                        />
                        <span>ثبت کامل رویدادهای تخصیص و پاک‌سازی منابع در لاگ امنیتی افتا</span>
                      </label>
                    </div>
                  </AftaAccordionCard>

                  {/* ۹. خط‌مشی کنترل دسترسی هنگام دریافت داده کاربری (الزام افتا) */}
                  <AftaAccordionCard
                    id="afta_data_input_access"
                    number="الزام افتا"
                    title="خط‌مشی کنترل دسترسی هنگام دریافت داده کاربری و ویژگی‌های امنیتی"
                    description="کنترل نوع داده، پسوندهای مجاز (JSON, CSV, XLSX, PDF, TXT)، سقف حجم فایل و فرکانس ورود داده"
                    isOpen={!!openAftaSections["afta_data_input_access"]}
                    onToggle={toggleAftaSection}
                    icon={ArrowDownToLine}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                        <input
                          type="checkbox"
                          checked={settings.userDataInputAccessPolicy?.enableInputDataAccessControl ?? true}
                          onChange={e => {
                            set("userDataInputAccessPolicy", {
                              ...settings.userDataInputAccessPolicy,
                              enableInputDataAccessControl: e.target.checked
                            });
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600"
                        />
                        <span>فعال‌سازی کنترل دسترسی هنگام دریافت و ورود داده کاربری</span>
                      </label>

                      <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                        <input
                          type="checkbox"
                          checked={settings.userDataInputAccessPolicy?.checkVolumeAndSize ?? true}
                          onChange={e => {
                            set("userDataInputAccessPolicy", {
                              ...settings.userDataInputAccessPolicy,
                              checkVolumeAndSize: e.target.checked
                            });
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600"
                        />
                        <span>اعمال سقف حجم مجاز برای فایل‌های ورودی (حداکثر ۱۰ مگابایت)</span>
                      </label>
                    </div>
                  </AftaAccordionCard>

                  {/* ۱۰. 🌟 بند ۱۰ افتا (مطابق تصویر جدید): تشخیص تغییر غیرمجاز در داده کاربری حساس ذخیره‌شده */}
                  <AftaAccordionCard
                    id="afta_sensitive_data_tamper"
                    number="بند ۱۰ افتا"
                    title="تشخیص تغییر غیرمجاز در داده کاربری حساس ذخیره‌شده در محصول"
                    description="چگونگی تشخیص تغییر در داده‌های کاربری حساس و نگهداری مقدار درهم‌سازی‌شده (مطابق الزام تصویر جدید افتا)"
                    isOpen={!!openAftaSections["afta_sensitive_data_tamper"]}
                    onToggle={toggleAftaSection}
                    icon={ShieldCheck}
                  >
                    <div className="space-y-4">
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed bg-slate-100 dark:bg-slate-800 p-3 rounded-xl">
                        محصول باید تغییر غیرمجاز را در داده کاربری حساس ذخیره‌شده (نظیر کلمات عبور، کلیدهای امنیتی، توکن‌ها و داده‌های مالی) تشخیص دهد.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* گزینه ۱: نگهداری مقدار درهم‌سازی‌شده (سطر ۱ تصویر) */}
                        <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-2">
                          <label className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.sensitiveDataIntegrityPolicy?.maintainHashedValues ?? true}
                              onChange={e => {
                                set("sensitiveDataIntegrityPolicy", {
                                  ...settings.sensitiveDataIntegrityPolicy,
                                  maintainHashedValues: e.target.checked
                                });
                              }}
                              className="h-4 w-4 rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-black text-emerald-900 dark:text-emerald-200 block">
                                مقدار درهم‌سازی‌شده داده‌های کاربری ذخیره‌شده، نگهداری می‌شود.
                              </span>
                              <span className="text-[11px] text-emerald-800 dark:text-emerald-400 block mt-1 leading-relaxed">
                                ذخیره‌سازی و بازبینی پیوسته مقدار درهم‌سازی‌شده (Hash/HMAC Checksum) برای داده‌های حساس کاربری جهت تشخیص دستکاری ناخواسته دیتابیس یا فایل‌ها.
                              </span>
                            </div>
                          </label>
                        </div>

                        {/* گزینه ۲: سایر موارد (سطر ۲ تصویر) */}
                        <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 space-y-2">
                          <label className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.sensitiveDataIntegrityPolicy?.otherTamperDetection ?? true}
                              onChange={e => {
                                set("sensitiveDataIntegrityPolicy", {
                                  ...settings.sensitiveDataIntegrityPolicy,
                                  otherTamperDetection: e.target.checked
                                });
                              }}
                              className="h-4 w-4 rounded border-blue-400 text-blue-600 focus:ring-blue-500 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-black text-blue-900 dark:text-blue-200 block">
                                سایر موارد (امضای دیجیتال، ثبت در لاگ حسابرسی و مسدودسازی آنی)
                              </span>
                              <span className="text-[11px] text-blue-800 dark:text-blue-400 block mt-1 leading-relaxed">
                                نگهداری امضای دیجیتال رمزنگاری‌شده، ثبت لحظه‌ای رویداد دستکاری در لاگ افتا و مسدودسازی دسترسی کاربر متخلف.
                              </span>
                            </div>
                          </label>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                          <input
                            type="checkbox"
                            checked={settings.sensitiveDataIntegrityPolicy?.autoBlockOnTamperAlert ?? true}
                            onChange={e => {
                              set("sensitiveDataIntegrityPolicy", {
                                ...settings.sensitiveDataIntegrityPolicy,
                                autoBlockOnTamperAlert: e.target.checked
                              });
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                          />
                          <span>مسدودسازی خودکار دسترسی هنگام کشف عدم تطابق درهم‌سازی (Hash Mismatch)</span>
                        </label>

                        <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                          <input
                            type="checkbox"
                            checked={settings.sensitiveDataIntegrityPolicy?.auditLogTamperEvents ?? true}
                            onChange={e => {
                              set("sensitiveDataIntegrityPolicy", {
                                ...settings.sensitiveDataIntegrityPolicy,
                                auditLogTamperEvents: e.target.checked
                              });
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                          />
                          <span>ثبت کامل تلاش‌های دستکاری داده‌های حساس در Audit Log افتا</span>
                        </label>
                      </div>
                    </div>
                  </AftaAccordionCard>

                  {/* ۱۱. 🌟 بند ۱۱ افتا (مطابق تصویر جدید): اقدامات مقابله‌ای در صورت تشخیص خطای صحت در داده‌ها */}
                  <AftaAccordionCard
                    id="afta_data_integrity_error_response"
                    number="بند ۱۱ افتا"
                    title="اقدامات مقابله‌ای در صورت تشخیص خطای صحت در داده‌ها"
                    description="تعیین واکنش سیستم هنگام کشف خطای صحت داده (هشدار به نقش‌های مجاز، تصحیح بر اساس مقادیر قبل و سایر موارد)"
                    isOpen={!!openAftaSections["afta_data_integrity_error_response"]}
                    onToggle={toggleAftaSection}
                    icon={AlertTriangle}
                  >
                    <div className="space-y-4">
                      <div className="bg-amber-50 dark:bg-amber-950/30 p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/50">
                        <span className="text-xs font-bold text-amber-900 dark:text-amber-200 block mb-1">
                          الزام بند ۱۱ افتا: محصول باید در صورت تشخیص خطای صحت در داده‌ها، اقدامات مقابله‌ای زیر را انجام دهد.
                        </span>
                        <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                          اقدام مقابله‌ای در صورت تشخیص خطا، مشخص شود (وجود یک مورد لازم و کافی است).
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* گزینه ۱: ایجاد هشدار/اخطار برای نقش‌های مجاز (سطر ۱ تصویر) */}
                        <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 space-y-2">
                          <label className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.dataIntegrityErrorResponsePolicy?.notifyAuthorizedRoles ?? true}
                              onChange={e => {
                                set("dataIntegrityErrorResponsePolicy", {
                                  ...settings.dataIntegrityErrorResponsePolicy,
                                  notifyAuthorizedRoles: e.target.checked
                                });
                              }}
                              className="h-4 w-4 rounded border-blue-400 text-blue-600 focus:ring-blue-500 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-black text-blue-900 dark:text-blue-200 block">
                                ایجاد هشدار/اخطار برای نقش‌های مجاز
                              </span>
                              <span className="text-[11px] text-blue-800 dark:text-blue-400 block mt-1 leading-relaxed">
                                ارسال آنی پیامک، اعلان امنیتی سیستم و هشدار فوری به مدیر سیستم و راهبران امنیتی.
                              </span>
                            </div>
                          </label>
                        </div>

                        {/* گزینه ۲: تصحیح داده بر اساس مقادیر قبل (سطر ۲ تصویر) */}
                        <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-2">
                          <label className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.dataIntegrityErrorResponsePolicy?.autoRollbackToPreviousState ?? true}
                              onChange={e => {
                                set("dataIntegrityErrorResponsePolicy", {
                                  ...settings.dataIntegrityErrorResponsePolicy,
                                  autoRollbackToPreviousState: e.target.checked
                                });
                              }}
                              className="h-4 w-4 rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-black text-emerald-900 dark:text-emerald-200 block">
                                تصحیح داده بر اساس مقادیر قبل (Rollback)
                              </span>
                              <span className="text-[11px] text-emerald-800 dark:text-emerald-400 block mt-1 leading-relaxed">
                                بازگردانی خودکار داده‌های مخدوش به آخرین وضعیت معتبر ثبت‌شده در نسخه‌گذاری امن (Transaction Rollback).
                              </span>
                            </div>
                          </label>
                        </div>

                        {/* گزینه ۳: سایر موارد (سطر ۳ تصویر) */}
                        <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/50 dark:bg-purple-950/20 space-y-2">
                          <label className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.dataIntegrityErrorResponsePolicy?.otherResponseActions ?? true}
                              onChange={e => {
                                set("dataIntegrityErrorResponsePolicy", {
                                  ...settings.dataIntegrityErrorResponsePolicy,
                                  otherResponseActions: e.target.checked
                                });
                              }}
                              className="h-4 w-4 rounded border-purple-400 text-purple-600 focus:ring-purple-500 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-black text-purple-900 dark:text-purple-200 block">
                                سایر موارد (ثبت در لاگ افتا و توقف عملیات)
                              </span>
                              <span className="text-[11px] text-purple-800 dark:text-purple-400 block mt-1 leading-relaxed">
                                ثبت کامل خطای صحت داده در لاگ حسابرسی افتا (Audit Log)، مسدودسازی تراکنش جاری و ابطال توکن کاربر.
                              </span>
                            </div>
                          </label>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                          <input
                            type="checkbox"
                            checked={settings.dataIntegrityErrorResponsePolicy?.auditLogErrorEvents ?? true}
                            onChange={e => {
                              set("dataIntegrityErrorResponsePolicy", {
                                ...settings.dataIntegrityErrorResponsePolicy,
                                auditLogErrorEvents: e.target.checked
                              });
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                          />
                          <span>ثبت کامل جزئیات خطای صحت داده در Audit Log حسابرسی افتا</span>
                        </label>
                      </div>
                    </div>
                  </AftaAccordionCard>

                  {/* ۱۱. پروتکل امن انتقال داده (الزام افتا) */}
                  <AftaAccordionCard
                    id="afta_secure_transport"
                    number="الزام افتا"
                    title="پروتکل امن انتقال داده، همبستگی ویژگی‌های امنیتی و ممانعت از شنود"
                    description="رمزنگاری TLS 1.3، ممانعت از شنود و دستکاری داده در شبکه"
                    isOpen={!!openAftaSections["afta_secure_transport"]}
                    onToggle={toggleAftaSection}
                    icon={Lock}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                        <input
                          type="checkbox"
                          checked={settings.secureDataTransportPolicy?.enforceTLSEncryption ?? true}
                          onChange={e => {
                            set("secureDataTransportPolicy", {
                              ...settings.secureDataTransportPolicy,
                              enforceTLSEncryption: e.target.checked
                            });
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600"
                        />
                        <span>الزام رمزنگاری TLS v1.3/v1.2 روی تمامی اتصالات پروتکل‌های ارتباطی</span>
                      </label>

                      <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                        <input
                          type="checkbox"
                          checked={settings.secureDataTransportPolicy?.preventEavesdropping ?? true}
                          onChange={e => {
                            set("secureDataTransportPolicy", {
                              ...settings.secureDataTransportPolicy,
                              preventEavesdropping: e.target.checked
                            });
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600"
                        />
                        <span>ممانعت از شنود (Eavesdropping) و سرقت توکن‌های ارتباطی در مسیر شبکه</span>
                      </label>

                      <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                        <input
                          type="checkbox"
                          checked={settings.secureDataTransportPolicy?.preventDataLossAndTamperingInTransit ?? true}
                          onChange={e => {
                            set("secureDataTransportPolicy", {
                              ...settings.secureDataTransportPolicy,
                              preventDataLossAndTamperingInTransit: e.target.checked
                            });
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600"
                        />
                        <span>کشف و ممانعت از دستکاری یا مخدوش شدن بسته‌های داده در حین انتقال (Data Tampering)</span>
                      </label>

                      <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                        <input
                          type="checkbox"
                          checked={settings.secureDataTransportPolicy?.auditTransportSecurityViolations ?? true}
                          onChange={e => {
                            set("secureDataTransportPolicy", {
                              ...settings.secureDataTransportPolicy,
                              auditTransportSecurityViolations: e.target.checked
                            });
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600"
                        />
                        <span>ثبت تلاش‌های تخلف امنیتی در انتقال داده در Audit Log افتا</span>
                      </label>
                    </div>
                  </AftaAccordionCard>

                  {/* ۱۲. خط‌مشی کنترل دسترسی هنگام خروج داده (بند ۸ افتا) */}
                  <AftaAccordionCard
                    id="afta_data_egress_access"
                    number="بند ۸ افتا"
                    title="خط‌مشی کنترل دسترسی هنگام انتقال و خروج داده کاربری به بیرون از محصول"
                    description="کنترل سقف تعداد رکوردهای خروجی (۵۰۰۰ رکورد)، حجم فایل و فرمت‌های مجاز خروجی"
                    isOpen={!!openAftaSections["afta_data_egress_access"]}
                    onToggle={toggleAftaSection}
                    icon={ArrowUpFromLine}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                        <input
                          type="checkbox"
                          checked={settings.userDataEgressAccessPolicy?.enableEgressDataAccessControl ?? true}
                          onChange={e => {
                            set("userDataEgressAccessPolicy", {
                              ...settings.userDataEgressAccessPolicy,
                              enableEgressDataAccessControl: e.target.checked
                            });
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600"
                        />
                        <span>فعال‌سازی کنترل دسترسی هنگام خروج و انتقال داده کاربری به بیرون</span>
                      </label>

                      <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                        <input
                          type="checkbox"
                          checked={settings.userDataEgressAccessPolicy?.checkVolumeAndSize ?? true}
                          onChange={e => {
                            set("userDataEgressAccessPolicy", {
                              ...settings.userDataEgressAccessPolicy,
                              checkVolumeAndSize: e.target.checked
                            });
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600"
                        />
                        <span>اعمال سقف مجاز رکوردهای خروجی (حداکثر ۵۰۰۰ رکورد در هر درخواست)</span>
                      </label>
                    </div>
                  </AftaAccordionCard>

                  {/* ۱۳. قوانین ممانعت از خروج بدون هدف داده کاربری (بند ۹ افتا) */}
                  <AftaAccordionCard
                    id="afta_targeted_egress_rules"
                    number="بند ۹ افتا"
                    title="قوانین ممانعت از خروج بدون هدف داده کاربری به خارج از محصول"
                    description="الزام تعیین آدرس مقصد صریح، تایید مدیر برای خروجی‌های انبوه و ثبت تلاش‌های غیرمجاز خروج در لاگ افتا"
                    isOpen={!!openAftaSections["afta_targeted_egress_rules"]}
                    onToggle={toggleAftaSection}
                    icon={ShieldAlert}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                        <input
                          type="checkbox"
                          checked={settings.targetedDataEgressRules?.preventUntargetedDataEgress ?? true}
                          onChange={e => {
                            set("targetedDataEgressRules", {
                              ...settings.targetedDataEgressRules,
                              preventUntargetedDataEgress: e.target.checked
                            });
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-amber-600"
                        />
                        <span>ممانعت از خروج بدون هدف و فاقد مقصد مشخص داده کاربری به خارج از محصول</span>
                      </label>

                      <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                        <input
                          type="checkbox"
                          checked={settings.targetedDataEgressRules?.requireAdminApprovalForBulkEgress ?? true}
                          onChange={e => {
                            set("targetedDataEgressRules", {
                              ...settings.targetedDataEgressRules,
                              requireAdminApprovalForBulkEgress: e.target.checked
                            });
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-amber-600"
                        />
                        <span>الزام دریافت تایید صریح مدیر ارشد سیستم برای خروجی‌های انبوه داده</span>
                      </label>

                      <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                        <input
                          type="checkbox"
                          checked={settings.targetedDataEgressRules?.auditUntargetedEgressAttempts ?? true}
                          onChange={e => {
                            set("targetedDataEgressRules", {
                              ...settings.targetedDataEgressRules,
                              auditUntargetedEgressAttempts: e.target.checked
                            });
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-amber-600"
                        />
                        <span>ثبت دقیق کلیه تلاش‌های غیرمجاز خروج داده در لاگ حسابرسی افتا</span>
                      </label>
                    </div>
                  </AftaAccordionCard>

                  {/* ۱۵. 🌟 مدیریت کارکردهای امنیتی مربوط به مدیریت محصول (الزام ۱ مدیریت امنیت) */}
                  <AftaAccordionCard
                    id="afta_sec_mgmt_functions"
                    title="مدیریت کارکردهای امنیتی مربوط به مدیریت محصول"
                    description="فراهم آوردن امکان فعالیت‌های مدیریتی بر روی توابع و کارکردهای مدیریت محصول برای مدیر سیستم و کاربران مجاز"
                    isOpen={!!openAftaSections["afta_sec_mgmt_functions"]}
                    onToggle={toggleAftaSection}
                    icon={Sliders}
                  >
                    <div className="space-y-4">
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed bg-slate-100 dark:bg-slate-800 p-3 rounded-xl">
                        محصول باید برای مدیر سیستم و هر کاربری که مجوز لازم را دارد، امکان فعالیت‌های مدیریتی زیر را بر روی توابع و تمام کارکردهای مربوط به مدیریت محصول فراهم آورد:
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                          <input
                            type="checkbox"
                            checked={settings.securityFunctionsManagementPolicy?.behaviorConfiguration ?? true}
                            onChange={e => {
                              set("securityFunctionsManagementPolicy", {
                                ...settings.securityFunctionsManagementPolicy,
                                behaviorConfiguration: e.target.checked
                              });
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600"
                          />
                          <span>تعیین و تغییر رفتار (Behavior Configuration & Modification)</span>
                        </label>

                        <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                          <input
                            type="checkbox"
                            checked={settings.securityFunctionsManagementPolicy?.disableFunctions ?? true}
                            onChange={e => {
                              set("securityFunctionsManagementPolicy", {
                                ...settings.securityFunctionsManagementPolicy,
                                disableFunctions: e.target.checked
                              });
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-rose-600"
                          />
                          <span>غیرفعال نمودن (Disable Security Functions)</span>
                        </label>

                        <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                          <input
                            type="checkbox"
                            checked={settings.securityFunctionsManagementPolicy?.enableFunctions ?? true}
                            onChange={e => {
                              set("securityFunctionsManagementPolicy", {
                                ...settings.securityFunctionsManagementPolicy,
                                enableFunctions: e.target.checked
                              });
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                          />
                          <span>فعال نمودن (Enable Security Functions)</span>
                        </label>

                        <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                          <input
                            type="checkbox"
                            checked={settings.securityFunctionsManagementPolicy?.otherFunctionsMgmt ?? true}
                            onChange={e => {
                              set("securityFunctionsManagementPolicy", {
                                ...settings.securityFunctionsManagementPolicy,
                                otherFunctionsMgmt: e.target.checked
                              });
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-purple-600"
                          />
                          <span>سایر موارد (ثبت حسابرسی لاگ، تخصیص نقش و وارد/صادر کردن خط‌مشی‌ها)</span>
                        </label>
                      </div>
                    </div>
                  </AftaAccordionCard>

                  {/* ۱۶. 🌟 محدودسازی عملیات بر روی ویژگی‌های امنیتی شناسایی و احراز هویت - Class 7 (الزام ۲ مدیریت امنیت) */}
                  <AftaAccordionCard
                    id="afta_sec_mgmt_auth_attrs"
                    title="محدودسازی عملیات بر روی ویژگی‌های امنیتی شناسایی و احراز هویت (Class 7)"
                    description="محدودسازی امکان تغییر پیش‌فرض و عملیات پرس‌وجو، تغییر، حذف و تغییر پیش‌فرض روی ویژگی‌های امنیتی احراز هویت"
                    isOpen={!!openAftaSections["afta_sec_mgmt_auth_attrs"]}
                    onToggle={toggleAftaSection}
                    icon={KeyRound}
                  >
                    <div className="space-y-4">
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed bg-slate-100 dark:bg-slate-800 p-3 rounded-xl">
                        محصول باید با اعمال خط‌مشی کنترل دسترسی، امکان تغییر پیش‌فرض و عملیات زیر را بر روی ویژگی‌های امنیتی الزام ۷ از رده (Class) شناسایی و احراز هویت، به مدیر سیستم و هر کاربری که مجوز لازم را دارد، محدود نماید:
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                          <input
                            type="checkbox"
                            checked={settings.authSecurityAttributesPolicy?.querySecurityAttributes ?? true}
                            onChange={e => {
                              set("authSecurityAttributesPolicy", {
                                ...settings.authSecurityAttributesPolicy,
                                querySecurityAttributes: e.target.checked
                              });
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600"
                          />
                          <span>پرس‌و‌جو (Query Security Attributes)</span>
                        </label>

                        <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                          <input
                            type="checkbox"
                            checked={settings.authSecurityAttributesPolicy?.modifySecurityAttributes ?? true}
                            onChange={e => {
                              set("authSecurityAttributesPolicy", {
                                ...settings.authSecurityAttributesPolicy,
                                modifySecurityAttributes: e.target.checked
                              });
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-amber-600"
                          />
                          <span>تغییر (Modify Security Attributes)</span>
                        </label>

                        <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                          <input
                            type="checkbox"
                            checked={settings.authSecurityAttributesPolicy?.deleteSecurityAttributes ?? true}
                            onChange={e => {
                              set("authSecurityAttributesPolicy", {
                                ...settings.authSecurityAttributesPolicy,
                                deleteSecurityAttributes: e.target.checked
                              });
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-rose-600"
                          />
                          <span>حذف (Delete Security Attributes)</span>
                        </label>

                        <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                          <input
                            type="checkbox"
                            checked={settings.authSecurityAttributesPolicy?.changeDefaultSecurityAttributes ?? true}
                            onChange={e => {
                              set("authSecurityAttributesPolicy", {
                                ...settings.authSecurityAttributesPolicy,
                                changeDefaultSecurityAttributes: e.target.checked
                              });
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                          />
                          <span>تغییر پیش‌فرض (Change Default Values)</span>
                        </label>

                        <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900 md:col-span-2">
                          <input
                            type="checkbox"
                            checked={settings.authSecurityAttributesPolicy?.otherAuthSecurityOps ?? true}
                            onChange={e => {
                              set("authSecurityAttributesPolicy", {
                                ...settings.authSecurityAttributesPolicy,
                                otherAuthSecurityOps: e.target.checked
                              });
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-purple-600"
                          />
                          <span>سایر موارد (بازنشانی کلمه عبور، الزام ورود دو مرحله‌ای و احراز هویت مجدد)</span>
                        </label>
                      </div>
                    </div>
                  </AftaAccordionCard>

                  {/* ۱۷. 🌟 محدودسازی کارکردهای عملیاتی بر روی داده‌های محصول (الزام ۳ مدیریت امنیت) */}
                  <AftaAccordionCard
                    id="afta_sec_mgmt_product_data"
                    title="محدودسازی کارکردهای عملیاتی بر روی داده‌های محصول"
                    description="محدودسازی عملیات تغییر پیش‌فرض، حذف، پرس‌وجو، مقداردهی و ایجاد داده‌های محصول بر اساس نقش کاربر"
                    isOpen={!!openAftaSections["afta_sec_mgmt_product_data"]}
                    onToggle={toggleAftaSection}
                    icon={Database}
                  >
                    <div className="space-y-4">
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed bg-slate-100 dark:bg-slate-800 p-3 rounded-xl">
                        محصول باید برای داده‌های محصول، امکان کارکردهای زیر را به مدیر سیستم و هر کاربری که مجوز لازم را دارد، محدود نماید:
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                          <input
                            type="checkbox"
                            checked={settings.productDataManagementPolicy?.changeDefaultData ?? true}
                            onChange={e => {
                              set("productDataManagementPolicy", {
                                ...settings.productDataManagementPolicy,
                                changeDefaultData: e.target.checked
                              });
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600"
                          />
                          <span>تغییر پیش‌فرض (Modify Default Data Configuration)</span>
                        </label>

                        <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                          <input
                            type="checkbox"
                            checked={settings.productDataManagementPolicy?.deleteData ?? true}
                            onChange={e => {
                              set("productDataManagementPolicy", {
                                ...settings.productDataManagementPolicy,
                                deleteData: e.target.checked
                              });
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-rose-600"
                          />
                          <span>حذف نمودن (Delete Data / Soft & Hard Delete)</span>
                        </label>

                        <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                          <input
                            type="checkbox"
                            checked={settings.productDataManagementPolicy?.queryData ?? true}
                            onChange={e => {
                              set("productDataManagementPolicy", {
                                ...settings.productDataManagementPolicy,
                                queryData: e.target.checked
                              });
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-amber-600"
                          />
                          <span>پرس‌و‌جو (Query & Search Data)</span>
                        </label>

                        <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                          <input
                            type="checkbox"
                            checked={settings.productDataManagementPolicy?.initializeData ?? true}
                            onChange={e => {
                              set("productDataManagementPolicy", {
                                ...settings.productDataManagementPolicy,
                                initializeData: e.target.checked
                              });
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                          />
                          <span>مقداردهی (Initialize Data / Default Seeding)</span>
                        </label>

                        <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                          <input
                            type="checkbox"
                            checked={settings.productDataManagementPolicy?.createData ?? true}
                            onChange={e => {
                              set("productDataManagementPolicy", {
                                ...settings.productDataManagementPolicy,
                                createData: e.target.checked
                              });
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-purple-600"
                          />
                          <span>ایجاد (Create Data Records & Master Entities)</span>
                        </label>

                        <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                          <input
                            type="checkbox"
                            checked={settings.productDataManagementPolicy?.readData ?? true}
                            onChange={e => {
                              set("productDataManagementPolicy", {
                                ...settings.productDataManagementPolicy,
                                readData: e.target.checked
                              });
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-cyan-600"
                          />
                          <span>مشاهده (Read & View Data Records)</span>
                        </label>

                        <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900 md:col-span-2">
                          <input
                            type="checkbox"
                            checked={settings.productDataManagementPolicy?.otherDataOps ?? true}
                            onChange={e => {
                              set("productDataManagementPolicy", {
                                ...settings.productDataManagementPolicy,
                                otherDataOps: e.target.checked
                              });
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                          />
                          <span>سایر موارد (خروجی گرفتن، بایگانی، بازیابی داده‌ها و متاداده)</span>
                        </label>
                      </div>
                    </div>
                  </AftaAccordionCard>

                  {/* ۲۲. 🌟 توانایی‌های کارکردهای مدیریت امنیتی محصول (الزام ۴ مدیریت امنیت - مطابق ۲ تصویر جدید) */}
                  <AftaAccordionCard
                    id="afta_sec_mgmt_capabilities"
                    title="توانایی‌های کارکردهای مدیریت امنیتی محصول"
                    description="مدیریت ثبت‌نشان‌ها، پارامترهای دسترسی، احراز هویت، ویژگی‌های موجودیت‌ها، نقش‌ها، تایم‌اوت غیرفعالی و نشست‌های همزمان"
                    isOpen={!!openAftaSections["afta_sec_mgmt_capabilities"]}
                    onToggle={toggleAftaSection}
                    icon={Activity}
                  >
                    <div className="space-y-6">
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed bg-slate-100 dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                        محصول باید توانایی انجام کارکردهای مدیریتی زیر را برای مدیر سیستم و کاربران مجاز داشته باشد:
                      </p>

                      {/* بخش ۱: مدیریت ثبت‌نشان‌ها و اطلاعات ممیزی */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-black text-amber-700 dark:text-amber-300 flex items-center gap-2 border-b pb-2">
                          <FileCheck className="h-4 w-4 text-amber-500" />
                          ۱. مدیریت ثبت‌نشان‌ها و اطلاعات حسابرسی (Audit Trail & Tokens)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                            <input
                              type="checkbox"
                              checked={settings.securityManagementCapabilitiesPolicy?.groupUserAuditTokenRead ?? true}
                              onChange={e => {
                                set("securityManagementCapabilitiesPolicy", {
                                  ...settings.securityManagementCapabilitiesPolicy,
                                  groupUserAuditTokenRead: e.target.checked
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600"
                            />
                            <span>پشتیبانی از مدیریت گروهی کاربران با مجوز خواندن ثبت‌نشان‌ها</span>
                          </label>

                          <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                            <input
                              type="checkbox"
                              checked={settings.securityManagementCapabilitiesPolicy?.auditTokenReadWritePerms ?? true}
                              onChange={e => {
                                set("securityManagementCapabilitiesPolicy", {
                                  ...settings.securityManagementCapabilitiesPolicy,
                                  auditTokenReadWritePerms: e.target.checked
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600"
                            />
                            <span>پشتیبانی از مجوزهای مشاهده و ویرایش ثبت‌نشان‌ها</span>
                          </label>

                          <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                            <input
                              type="checkbox"
                              checked={settings.securityManagementCapabilitiesPolicy?.auditTokenStorageThresholdOps ?? true}
                              onChange={e => {
                                set("securityManagementCapabilitiesPolicy", {
                                  ...settings.securityManagementCapabilitiesPolicy,
                                  auditTokenStorageThresholdOps: e.target.checked
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-rose-600"
                            />
                            <span>پشتیبانی از آستانه و عملیات هنگام خرابی ذخیره‌سازی ثبت‌نشان‌ها</span>
                          </label>
                        </div>
                      </div>

                      {/* بخش ۲: پارامترهای دسترسی، پاک‌سازی و اعتبارسنجی داده */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-black text-amber-700 dark:text-amber-300 flex items-center gap-2 border-b pb-2">
                          <Sliders className="h-4 w-4 text-amber-500" />
                          ۲. پارامترهای دسترسی، حفاظت از منابع و اعتبارسنجی داده
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                            <input
                              type="checkbox"
                              checked={settings.securityManagementCapabilitiesPolicy?.accessCriteriaParametersMgmt ?? true}
                              onChange={e => {
                                set("securityManagementCapabilitiesPolicy", {
                                  ...settings.securityManagementCapabilitiesPolicy,
                                  accessCriteriaParametersMgmt: e.target.checked
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                            />
                            <span>مدیریت معیارها و پارامترهای ایجاد یا منع دسترسی به محصول</span>
                          </label>

                          <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                            <input
                              type="checkbox"
                              checked={settings.securityManagementCapabilitiesPolicy?.residualDataProtectionTimingConfig ?? true}
                              onChange={e => {
                                set("securityManagementCapabilitiesPolicy", {
                                  ...settings.securityManagementCapabilitiesPolicy,
                                  residualDataProtectionTimingConfig: e.target.checked
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                            />
                            <span>پیکربندی زمان اجرای حفاظت از اطلاعات باقیمانده (تخصیص/آزادسازی منابع)</span>
                          </label>

                          <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                            <input
                              type="checkbox"
                              checked={settings.securityManagementCapabilitiesPolicy?.dataInputValidationRulesEdit ?? true}
                              onChange={e => {
                                set("securityManagementCapabilitiesPolicy", {
                                  ...settings.securityManagementCapabilitiesPolicy,
                                  dataInputValidationRulesEdit: e.target.checked
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600"
                            />
                            <span>ویرایش قوانین کنترلی پیشرفته برای وارد کردن داده به داخل محصول</span>
                          </label>

                          <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                            <input
                              type="checkbox"
                              checked={settings.securityManagementCapabilitiesPolicy?.dataIntegrityErrorActionConfig ?? true}
                              onChange={e => {
                                set("securityManagementCapabilitiesPolicy", {
                                  ...settings.securityManagementCapabilitiesPolicy,
                                  dataIntegrityErrorActionConfig: e.target.checked
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-purple-600"
                            />
                            <span>تعیین و پیکربندی عملیات خودکار پس از کشف خطای صحت داده</span>
                          </label>
                        </div>
                      </div>

                      {/* بخش ۳: احراز هویت، گذرواژه‌ها و آستانه شکست */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-black text-amber-700 dark:text-amber-300 flex items-center gap-2 border-b pb-2">
                          <KeyRound className="h-4 w-4 text-amber-500" />
                          ۳. احراز هویت، الزامات گذرواژه و مدیریت آستانه ورود
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                            <input
                              type="checkbox"
                              checked={settings.securityManagementCapabilitiesPolicy?.failedAuthThresholdMgmt ?? true}
                              onChange={e => {
                                set("securityManagementCapabilitiesPolicy", {
                                  ...settings.securityManagementCapabilitiesPolicy,
                                  failedAuthThresholdMgmt: e.target.checked
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-rose-600"
                            />
                            <span>مدیریت آستانه تلاش‌های ناموفق و عملیات هنگام شکست احراز هویت</span>
                          </label>

                          <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                            <input
                              type="checkbox"
                              checked={settings.securityManagementCapabilitiesPolicy?.passwordComplexityCriteriaMgmt ?? true}
                              onChange={e => {
                                set("securityManagementCapabilitiesPolicy", {
                                  ...settings.securityManagementCapabilitiesPolicy,
                                  passwordComplexityCriteriaMgmt: e.target.checked
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-amber-600"
                            />
                            <span>مدیریت معیارها و قواعد پیچیدگی تنظیم گذرواژه‌ها</span>
                          </label>

                          <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                            <input
                              type="checkbox"
                              checked={settings.securityManagementCapabilitiesPolicy?.authDataAndPreAuthOpsMgmt ?? true}
                              onChange={e => {
                                set("securityManagementCapabilitiesPolicy", {
                                  ...settings.securityManagementCapabilitiesPolicy,
                                  authDataAndPreAuthOpsMgmt: e.target.checked
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600"
                            />
                            <span>مدیریت داده‌های احراز هویت و عملیات پیش از ورود کاربر</span>
                          </label>

                          <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                            <input
                              type="checkbox"
                              checked={settings.securityManagementCapabilitiesPolicy?.authMechanismsAndRulesMgmt ?? true}
                              onChange={e => {
                                set("securityManagementCapabilitiesPolicy", {
                                  ...settings.securityManagementCapabilitiesPolicy,
                                  authMechanismsAndRulesMgmt: e.target.checked
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                            />
                            <span>مدیریت سازوکارها و قوانین مربوط به احراز هویت</span>
                          </label>

                          <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900 md:col-span-2">
                            <input
                              type="checkbox"
                              checked={settings.securityManagementCapabilitiesPolicy?.preAuthIpAssignmentProcessMgmt ?? true}
                              onChange={e => {
                                set("securityManagementCapabilitiesPolicy", {
                                  ...settings.securityManagementCapabilitiesPolicy,
                                  preAuthIpAssignmentProcessMgmt: e.target.checked
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-purple-600"
                            />
                            <span>مدیریت فرآیندها و اختصاص آدرس IP خاص قبل از شناسایی کاربر</span>
                          </label>
                        </div>
                      </div>

                      {/* بخش ۴: نقش‌ها، موجودیت‌ها و کنترل دسترسی پیش‌فرض */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-black text-amber-700 dark:text-amber-300 flex items-center gap-2 border-b pb-2">
                          <User className="h-4 w-4 text-amber-500" />
                          ۴. نقش‌ها، موجودیت‌های فعال و کنترل دسترسی پیش‌فرض
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                            <input
                              type="checkbox"
                              checked={settings.securityManagementCapabilitiesPolicy?.defaultActiveEntitySecurityAttrsMgmt ?? true}
                              onChange={e => {
                                set("securityManagementCapabilitiesPolicy", {
                                  ...settings.securityManagementCapabilitiesPolicy,
                                  defaultActiveEntitySecurityAttrsMgmt: e.target.checked
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600"
                            />
                            <span>تعریف و تغییر ویژگی‌های امنیتی موجودیت‌های فعال پیش‌فرض</span>
                          </label>

                          <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                            <input
                              type="checkbox"
                              checked={settings.securityManagementCapabilitiesPolicy?.defaultProductAccessControlValuesMgmt ?? true}
                              onChange={e => {
                                set("securityManagementCapabilitiesPolicy", {
                                  ...settings.securityManagementCapabilitiesPolicy,
                                  defaultProductAccessControlValuesMgmt: e.target.checked
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                            />
                            <span>مدیریت مقادیر پیش‌فرض برای کنترل دسترسی محصول (Default ACL)</span>
                          </label>

                          <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                            <input
                              type="checkbox"
                              checked={settings.securityManagementCapabilitiesPolicy?.productRolesMgmt ?? true}
                              onChange={e => {
                                set("securityManagementCapabilitiesPolicy", {
                                  ...settings.securityManagementCapabilitiesPolicy,
                                  productRolesMgmt: e.target.checked
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-purple-600"
                            />
                            <span>مدیریت جامع نقش‌ها و سطوح دسترسی در محصول</span>
                          </label>
                        </div>
                      </div>

                      {/* بخش ۵: نشست‌ها، آستانه همزمانی و تایم‌اوت غیرفعالی */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-black text-amber-700 dark:text-amber-300 flex items-center gap-2 border-b pb-2">
                          <Clock className="h-4 w-4 text-amber-500" />
                          ۵. مدیریت نشست‌ها، همزمانی ورود و تایم‌اوت غیرفعالی (تصویر ۲)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                            <input
                              type="checkbox"
                              checked={settings.securityManagementCapabilitiesPolicy?.maxConcurrentSessionsPerUserMgmt ?? true}
                              onChange={e => {
                                set("securityManagementCapabilitiesPolicy", {
                                  ...settings.securityManagementCapabilitiesPolicy,
                                  maxConcurrentSessionsPerUserMgmt: e.target.checked
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600"
                            />
                            <span>مدیریت حداکثر تعداد مجاز نشست‌های همزمان کاربران توسط مدیر</span>
                          </label>

                          <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                            <input
                              type="checkbox"
                              checked={settings.securityManagementCapabilitiesPolicy?.sessionStartConditionsMgmt ?? true}
                              onChange={e => {
                                set("securityManagementCapabilitiesPolicy", {
                                  ...settings.securityManagementCapabilitiesPolicy,
                                  sessionStartConditionsMgmt: e.target.checked
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600"
                            />
                            <span>مدیریت شرایط آغاز نشست و محدودیت‌های ورود توسط مدیر مجاز</span>
                          </label>

                          <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/20">
                            <input
                              type="checkbox"
                              checked={settings.securityManagementCapabilitiesPolicy?.specificUserInactivityTimeoutConfig ?? true}
                              onChange={e => {
                                set("securityManagementCapabilitiesPolicy", {
                                  ...settings.securityManagementCapabilitiesPolicy,
                                  specificUserInactivityTimeoutConfig: e.target.checked
                                });
                              }}
                              className="h-4 w-4 rounded border-indigo-400 text-indigo-600"
                            />
                            <span>تعیین زمان غیرفعال بودن برای کاربر مشخص که پس از آن، نشست خاتمه یابد (سطر ۱ تصویر ۲)</span>
                          </label>

                          <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/20">
                            <input
                              type="checkbox"
                              checked={settings.securityManagementCapabilitiesPolicy?.defaultUsersInactivityTimeoutConfig ?? true}
                              onChange={e => {
                                set("securityManagementCapabilitiesPolicy", {
                                  ...settings.securityManagementCapabilitiesPolicy,
                                  defaultUsersInactivityTimeoutConfig: e.target.checked
                                });
                              }}
                              className="h-4 w-4 rounded border-indigo-400 text-indigo-600"
                            />
                            <span>تعیین زمان پیش‌فرض غیرفعال بودن کاربران که پس از آن، نشست خاتمه یابد (سطر ۲ تصویر ۲)</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </AftaAccordionCard>

                  {/* ۲۳. 🌟 بند ۵ افتا (مطابق تصویر جدید): توانایی تعریف نقش‌های مختلف در محصول */}
                  <AftaAccordionCard
                    id="afta_product_roles_def"
                    title="بند ۵ افتا: توانایی تعریف نقش‌های مختلف در محصول"
                    description="تعریف و تفکیک نقش‌های استاندارد نظیر مدیر سیستم، پشتیبانی / کاربر پیشرفته، کاربر عادی و سایر موارد"
                    isOpen={!!openAftaSections["afta_product_roles_def"]}
                    onToggle={toggleAftaSection}
                    icon={User}
                  >
                    <div className="space-y-4">
                      <div className="bg-indigo-50 dark:bg-indigo-950/30 p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900/50">
                        <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 block mb-1">
                          الزام بند ۵ افتا: محصول باید توانایی تعریف نقش‌های مختلف را داشته باشد.
                        </span>
                        <p className="text-[11px] text-indigo-800 dark:text-indigo-300 leading-relaxed">
                          توضیح خلاصه: سیستم قابلیت تعریف و پشتیبانی از نقش‌های مختلف کاربری را بر اساس مسئولیت‌های اصلی سازمان فراهم می‌سازد. نقش‌های مشخص‌شده در زیر پشتیبانی می‌گردند:
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.productRolesDefinitionPolicy?.supportedRoles?.systemAdmin ?? true}
                            onChange={e => {
                              set("productRolesDefinitionPolicy", {
                                ...settings.productRolesDefinitionPolicy,
                                supportedRoles: {
                                  ...settings.productRolesDefinitionPolicy?.supportedRoles,
                                  systemAdmin: e.target.checked
                                }
                              });
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 mt-0.5"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                              ۱. مدیر سیستم (System Admin)
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                              مدیریت ارشد کاربران، پیکربندی زیرسیستم‌ها، تنظیمات خط‌مشی‌های امنیتی و بررسی لاگ‌های حسابرسی افتا.
                            </span>
                          </div>
                        </label>

                        <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.productRolesDefinitionPolicy?.supportedRoles?.advancedSupportUser ?? true}
                            onChange={e => {
                              set("productRolesDefinitionPolicy", {
                                ...settings.productRolesDefinitionPolicy,
                                supportedRoles: {
                                  ...settings.productRolesDefinitionPolicy?.supportedRoles,
                                  advancedSupportUser: e.target.checked
                                }
                              });
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 mt-0.5"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                              ۲. پشتیبانی / کاربر پیشرفته (Advanced Support User)
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                              دسترسی پشتیبانی فنی، عملیات ارشد حسابداری، بررسی اسناد و تایید در گردش‌کارهای مالی.
                            </span>
                          </div>
                        </label>

                        <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.productRolesDefinitionPolicy?.supportedRoles?.regularUser ?? true}
                            onChange={e => {
                              set("productRolesDefinitionPolicy", {
                                ...settings.productRolesDefinitionPolicy,
                                supportedRoles: {
                                  ...settings.productRolesDefinitionPolicy?.supportedRoles,
                                  regularUser: e.target.checked
                                }
                              });
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 mt-0.5"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                              ۳. کاربر عادی (Regular User)
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                              دسترسی استاندارد جهت ثبت اولیه اطلاعات، صدور اسناد و مشاهده گزارش‌های مرتبط با واحد کاری.
                            </span>
                          </div>
                        </label>

                        <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.productRolesDefinitionPolicy?.supportedRoles?.otherCustomRoles ?? true}
                            onChange={e => {
                              set("productRolesDefinitionPolicy", {
                                ...settings.productRolesDefinitionPolicy,
                                supportedRoles: {
                                  ...settings.productRolesDefinitionPolicy?.supportedRoles,
                                  otherCustomRoles: e.target.checked
                                }
                              });
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 mt-0.5"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                              ۴. سایر موارد (Custom Roles / نقش‌های سفارشی)
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                              تعریف و تخصیص نقش‌های تخصصی دستگاه نظیر خزانه‌دار، حسابرس، انباردار و کارشناس اعتبارات.
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </AftaAccordionCard>

                  {/* ۲۴. 🌟 بند ۶ افتا (مطابق تصویر جدید): ارتباط کاربران به نقش‌های تعریف‌شده و الزام ۱ نقش به هر حساب */}
                  <AftaAccordionCard
                    id="afta_user_role_assignment"
                    title="بند ۶ افتا: ارتباط کاربران به نقش‌های تعریف‌شده (انحصار ۱ نقش برای هر حساب کاربری)"
                    description="الزام ارتباط هر حساب کاربری تنها به یک نقش مرتبط و امکان تخصیص یک نقش مشترک به چندین کاربر"
                    isOpen={!!openAftaSections["afta_user_role_assignment"]}
                    onToggle={toggleAftaSection}
                    icon={UserCheck}
                  >
                    <div className="space-y-4">
                      <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
                        <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 block mb-1">
                          الزام بند ۶ افتا: محصول باید قادر باشد کاربران را به نقش‌های تعریف‌شده یا قابل تعریف مرتبط نماید، همچنین لازم است هر حساب کاربری تنها به یک نقش مرتبط شده باشد، اما ممکن است نقش‌ها تنها به یک کاربر محدود نشوند و چندین کاربر نقش مشابهی داشته باشند.
                        </span>
                        <p className="text-[11px] text-emerald-800 dark:text-emerald-300 leading-relaxed">
                          توضیح خلاصه: هر حساب کاربری در سیستم انحصاراتً دارای یک نقش فعال اصلی می‌باشد تا از تداخل دسترسی‌ها جلوگیری شود؛ با این حال، چندین کاربر می‌توانند یک نقش مشابه را بر عهده داشته باشند.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                          <input
                            type="checkbox"
                            checked={settings.userRoleAssignmentPolicy?.singleRolePerAccountEnforcement ?? true}
                            onChange={e => {
                              set("userRoleAssignmentPolicy", {
                                ...settings.userRoleAssignmentPolicy,
                                singleRolePerAccountEnforcement: e.target.checked
                              });
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                          />
                          <span>الزام انحصار هر حساب کاربری تنها به یک نقش مرتبط (Single Active Role per Account)</span>
                        </label>

                        <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                          <input
                            type="checkbox"
                            checked={settings.userRoleAssignmentPolicy?.allowMultiUsersPerRole ?? true}
                            onChange={e => {
                              set("userRoleAssignmentPolicy", {
                                ...settings.userRoleAssignmentPolicy,
                                allowMultiUsersPerRole: e.target.checked
                              });
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                          />
                          <span>امکان تخصیص یک نقش مشابه به چندین کاربر مختلف (Multi-User Role Binding)</span>
                        </label>

                        <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900 md:col-span-2">
                          <input
                            type="checkbox"
                            checked={settings.userRoleAssignmentPolicy?.auditRoleAssignmentChanges ?? true}
                            onChange={e => {
                              set("userRoleAssignmentPolicy", {
                                ...settings.userRoleAssignmentPolicy,
                                auditRoleAssignmentChanges: e.target.checked
                              });
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                          />
                          <span>ثبت دقیق کلیه تغییرات و انتساب نقش کاربران در لاگ حسابرسی افتا (Audit Log)</span>
                        </label>
                      </div>
                    </div>
                  </AftaAccordionCard>

                  {/* ۱۴. مدیریت نشست‌های فعال کاربران (Active Sessions) */}
                  <AftaAccordionCard
                    id="afta_active_sessions"
                    title="مدیریت نشست‌های فعال کاربران در سامانه (Active Sessions)"
                    description="مشاهده کاربران آنلاین، آدرس IP دستگاه‌ها و امکان ابطال فوری نشست‌های مشکوک"
                    isOpen={!!openAftaSections["afta_active_sessions"]}
                    onToggle={toggleAftaSection}
                    icon={Laptop}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
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

                      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900">
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
                  </AftaAccordionCard>
                </div>
              )}{activeTab === "sms" && (
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
