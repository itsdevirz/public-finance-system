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
  User, UserCheck, KeyRound, Shield, ShieldAlert, ChevronDown, ChevronUp, Globe, AlertOctagon,
  Search, Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import api, { logFileDownloadAudit } from "@/api";
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

  // ۲۵. رده ۲-۶ بند ۱ افتا: حفظ وضعیت امن محصول هنگام رخ دادن خرابی، اشکال یا شکست
  secureFailureStatePolicy: {
    enableSecureFailureState: true,
    softwareFailureProtection: true, // خرابی‌های نرم‌افزاری
    hardwareFailureProtection: true, // خرابی‌های سخت‌افزاری / قطع ارتباط با دیتابیس
    preserveDataIntegrityOnCrash: true, // حفظ صحت داده‌ها
    maintainAccessControlRulesOnFailure: true, // حفظ خط‌مشی کنترل دسترسی
    auditLogFailureEvents: true,
  },

  // ۲۶. رده ۲-۶ بند ۲ افتا: جلوگیری از افشاء یا تغییر داده هنگام انتقال بین بخش‌های مجزای محصول
  internalTransitProtectionPolicy: {
    enableInternalTransitProtection: true,
    preventDataLeakageInTransit: true, // جلوگیری از افشای داده
    preventDataTamperingInTransit: true, // جلوگیری از تغییر داده
    enforceInternalComponentTLS: true, // بستر و زیرساخت امن انتقال بین اجزاء
    auditTransitSecurityViolations: true,
  },

  // ۲۷. رده ۲-۶ بند ۳ افتا: تفسیر سازگار و یکسان داده‌های امنیتی قابل اشتراک‌گذاری با سایر محصولات IT
  securityDataInteroperabilityPolicy: {
    enableSecurityDataInteroperability: true,
    supportedShareableData: {
      authData: true, // داده‌های احراز هویت
      cryptoKeys: true, // کلید
      digitalSignature: true, // امضای دیجیتال
      auditLogs: true, // ثبت‌نشان‌ها (داده‌های ممیزی)
      otherSecurityAttributes: true, // سایر موارد
    },
    enforceStandardFormatInterpretation: true,
  },

  // ۲۸. رده ۲-۶ بند ۴ افتا: زمان و تاریخ معتبر و استفاده از مهرهای زمانی معتبر (مطابق تصویر فایل ورد افتا)
  trustedTimestampPolicy: {
    enableTrustedTimestamping: true,
    timestampMethods: {
      getTimestampFromNtpServer: true, // گرفتن مهرهای زمانی از سرور NTP
      setTimestampViaInternet: true, // تنظیم مهرهای زمانی از طریق اینترنت
      setDefaultTrustedTimestamp: true, // تنظیم مهرهای زمانی به صورت پیش‌فرض (معتبر و عدم امکان دستکاری غیرمجاز)
      otherMethods: true, // سایر موارد
    },
    verifyTimestampIntegrity: true,
  },

  // ۲۹. الزام افتا: بروزرسانی نرم‌افزار و میان‌افزار محصول برای مدیر سیستم (مطابق تصویر سند افتا)
  productSoftwareUpdatePolicy: {
    enableSoftwareUpdateManagement: true,
    updateMethods: {
      manualUpdate: true, // بروزرسانی دستی
      autoSearchForUpdates: true, // جستجوی خودکار بروزرسانی‌ها
      automaticUpdates: false, // بروزرسانی‌های خودکار
      manualUpdateAfterSecurityVerification: true, // بروزرسانی دستی بعد از اطمینان از امنیت وصله و یا فایل بروزرسانی
    },
    autoUpdateAuthenticityVerification: {
      enableAuthenticityVerification: true,
      digitalSignature: true, // امضای دیجیتال
      publishedHash: true, // درهم‌ساز منتشرشده
    },
    requireAdminApprovalForUpdates: true,
    auditLogUpdateEvents: true,
  },

  // ۳۰. الزام افتا: اطمینان از عملکرد کارکردهای اصلی محصول در زمان رخداد هرگونه اشکال و خرابی (شکست) نرم‌افزاری
  coreFunctionsSoftwareFaultTolerancePolicy: {
    enableFaultTolerancePolicy: true,
    isolationOfFaultyModules: true, // جداسازی ماژول‌های دچار خطای زمان اجرا جهت عدم اختلال در سایر کارکردها
    fallbackToCoreOperationalMode: true, // بازگشت به حالت عملیاتی پایه و فعال نگه‌داشتن کارکردهای اصلی سیستم
    gracefulDegradation: true, // افت کیفیت کنترل‌شده (Graceful Degradation) بدون از کار افتادن وظایف اصلی
    auditLogFaultEvents: true, // ثبت دقیق رویدادهای خرابی و ناهنجاری نرم‌افزاری در لاگ حسابرسی افتا
  },

  // ۳۱. بند ۴ افتا: الزام نمایش آخرین تلاش موفق برای ایجاد نشست (بر اساس روز، زمان و سایر موارد)
  lastSuccessfulSessionNoticePolicy: {
    enable: true,
    displayDate: true,
    displayTime: true,
    displayOtherInfo: true,
  },

  // ۳۲. بند ۵ افتا: الزام نمایش آخرین تلاش ناموفق برای ایجاد نشست و تعداد تلاش‌های ناموفق تا این نشست
  lastFailedSessionNoticePolicy: {
    enable: true,
    displayDate: true,
    displayTime: true,
    displayOtherInfo: true,
    displayFailedAttemptsCount: true,
  },

  // ۳۳. الزام عدم پاک‌سازی اطلاعات سوابق دسترسی از واسط کاربر بدون بازدید کاربر
  preserveAccessRecordsPolicy: {
    preventAutoClearWithoutUserView: true,
    requireExplicitUserDismissal: true,
  },

  // ۳۴. الزام افتا: توانایی ممانعت از ایجاد نشست بر اساس پارامترهایی از قبیل مکان، شماره پورت، روز، زمان و سایر موارد
  sessionEstablishmentPreventionPolicy: {
    enable: true,
    preventByLocation: true,
    preventByPort: true,
    preventByDay: true,
    preventByTime: true,
    preventByOtherParams: true,
  },

  // ۳۵-۳۷. الزامات کانال‌ها/مسیرهای مورد اعتماد (افتا)
  trustedChannelPolicy: {
    enable: true,
    protocols: {
      https: true,
      tls: true,
      ssh: true
    },
    allowRemoteConnectionOnlyViaSecureChannel: true,
    requireSecureChannelForInitialAuth: true
  },

  // ۳۸-۴۰. الزامات امنیتی پروتکل HTTPS (افتا - رده ۳-۱)
  httpsProtocolPolicy: {
    enable: true,
    rfc2818Compliance: true,
    requireTlsForHttps: true,
    invalidCertificateHandling: "disconnect",
  },

  // ۴۱-۴۴. الزامات امنیتی پروتکل TLS Client (افتا - رده ۳-۲)
  tlsClientPolicy: {
    enable: true,
    enforceTls12Only: true,
    rfc6125IdentityValidation: true,
    serverCertificateValidation: {
      requireValidCertificate: true,
      invalidCertAction: "disconnect",
      otherActionText: "",
    },
    clientHelloEllipticCurves: {
      mode: "nistCurves",
      curves: {
        secp256r1: true,
        secp384r1: true,
        secp521r1: true,
      },
    },
    cipherSuites: {
      tls_aes_256_gcm_sha384: true,
      tls_aes_128_gcm_sha256: true,
      tls_dhe_rsa_with_aes_256_gcm_sha384: true,
      tls_dhe_rsa_with_aes_128_gcm_sha256: true,
      tls_ecdhe_rsa_with_aes_128_gcm_sha256: true,
      tls_ecdhe_rsa_with_aes_256_gcm_sha384: true,
      tls_ecdhe_ecdsa_with_aes_256_gcm_sha384: true,
      tls_ecdhe_ecdsa_with_aes_128_gcm_sha256: true,
      tls_rsa_with_aes_256_gcm_sha384: true,
      tls_rsa_with_aes_128_gcm_sha256: true,
      tls_ecdh_ecdsa_with_aes_256_gcm_sha384: true,
      tls_ecdh_ecdsa_with_aes_128_gcm_sha256: true,
      tls_ecdh_rsa_with_aes_256_gcm_sha384: true,
      tls_ecdh_rsa_with_aes_128_gcm_sha256: true,
      tls_dh_rsa_with_aes_256_gcm_sha384: true,
      tls_dh_rsa_with_aes_128_gcm_sha256: true,
    },
  },

  // ۴۵-۲. الزامات امنیتی پروتکل TLS Server (افتا - رده ۳-۳)
  tlsServerPolicy: {
    enable: true,
    enforceTls12Only: true,
    rejectLegacyProtocols: {
      ssl10: true,
      ssl20: true,
      ssl30: true,
      tls10: true,
      tls11: true,
    },
    keyExchangeParameters: {
      rsaKeySizes: {
        rsa2048: true,
        rsa3072: true,
        rsa4096: true,
      },
      ecdhNistCurves: {
        secp256r1: true,
        secp384r1: true,
        secp521r1: true,
        disallowOtherCurves: true,
      },
      dhKeySizes: {
        dh2048: true,
        dh3072: true,
      },
    },
    cipherSuites: {
      tls_aes_256_gcm_sha384: true,
      tls_aes_128_gcm_sha256: true,
      tls_dhe_rsa_with_aes_256_gcm_sha384: true,
      tls_dhe_rsa_with_aes_128_gcm_sha256: true,
      tls_ecdhe_rsa_with_aes_128_gcm_sha256: true,
      tls_ecdhe_rsa_with_aes_256_gcm_sha384: true,
      tls_ecdhe_ecdsa_with_aes_256_gcm_sha384: true,
      tls_ecdhe_ecdsa_with_aes_128_gcm_sha256: true,
      tls_rsa_with_aes_256_gcm_sha384: true,
      tls_rsa_with_aes_128_gcm_sha256: true,
      tls_ecdh_ecdsa_with_aes_256_gcm_sha384: true,
      tls_ecdh_ecdsa_with_aes_128_gcm_sha256: true,
      tls_ecdh_rsa_with_aes_256_gcm_sha384: true,
      tls_ecdh_rsa_with_aes_128_gcm_sha256: true,
      tls_dh_rsa_with_aes_256_gcm_sha384: true,
      tls_dh_rsa_with_aes_128_gcm_sha256: true,
    },
  },

  // ۴۵-۳. الزامات امنیتی پروتکل TLS مشترک کلاینت و سرور (افتا - رده ۳-۴)
  mutualTlsPolicy: {
    enable: true,
    enableMutualAuthX509v3: true,
    enforceSubjectIdentityMatching: true,
    mismatchedIdentityAction: "disconnect",
  },

  // ۴۵-۴. الزامات اعتبارسنجی گواهی‌نامه (افتا - رده ۳-۵)
  certificateValidationPolicy: {
    enable: true,
    pathValidationRules: {
      rfc5280PathValidation: true,
      endWithTrustedCA: true,
      requireBasicConstraintsCaTrue: true,
    },
    strictCaAcceptanceOnlyWithBasicConstraints: true,
    x509v3Rfc5280AuthenticationScopes: {
      https: true,
      tls: true,
      ssh: true,
      codeSigningSoftwareUpdates: true,
      codeSigningIntegrityVerification: true,
      otherUseCases: true,
    },
    revocationCheckingMethods: {
      ocspRfc696: true,
      crlRfc5280Section63: true,
      crlRfc5759Section5: true,
      disallowOtherRevocationMethods: true,
    },
    extendedKeyUsageRules: {
      codeSigningOid: true,
      serverAuthOid: true,
      clientAuthOid: true,
      ocspSigningOid: true,
    },
  },

  // ۴۵-۵. الزامات امنیتی پروتکل SSH (افتا - رده ۳-۶)
  sshProtocolPolicy: {
    enable: true,
    rfcCompliance: {
      rfc4251: true,
      rfc4252: true,
      rfc4253: true,
      rfc4254: true,
      rfc5656: true,
      rfc6668: true,
    },
    authMethods: {
      publicKeyAuth: true,
      passwordAuth: true,
    },
    packetSizeLimit: {
      enableMaxPacketCheck: true,
      maxPacketSizeBytes: 35000,
    },
    encryptionAlgorithms: {
      aes128Cbc: true,
      aes192Cbc: true,
      aes256Cbc: true,
      aes128Ctr: true,
      aes192Ctr: true,
      aes256Ctr: true,
      aeadAes128Gcm: true,
      aeadAes256Gcm: true,
    },
    hostKeyAlgorithms: {
      sshEd25519: true,
      sshEd448: true,
      rsaSha2512: true,
      rsaSha2256: true,
      ecdsaSha2Nistp521: true,
      ecdsaSha2Nistp384: true,
      ecdsaSha2Nistp256: true,
      x509v3EcdsaSha2Nistp521: true,
      x509v3EcdsaSha2Nistp384: true,
      x509v3EcdsaSha2Nistp256: true,
      x509v3Rsa2048Sha256: true,
      sshRsa: true,
      x509v3SshRsa: true,
    },
    macAlgorithms: {
      aeadAes256Gcm: true,
      aeadAes128Gcm: true,
      hmacSha2512: true,
      hmacSha2256: true,
      hmacSha196: true,
      hmacSha1: true,
    },
    kexAlgorithms: {
      curve25519Sha256: true,
      curve448Sha512: true,
      dhGroupExchangeSha256: true,
      dhGroup18Sha512: true,
      dhGroup17Sha512: true,
      dhGroup16Sha512: true,
      dhGroup15Sha512: true,
      ecdhSha2Nistp521: true,
      ecdhSha2Nistp384: true,
      ecdhSha2Nistp256: true,
      rsa2048Sha256: true,
      dhGroupExchangeSha1: true,
      dhGroup14Sha256: true,
    },
    rekeyingPolicy: {
      enableRekeying: true,
      maxDurationMinutes: 60,
      maxDataTransferredMb: 1024,
    },
    hostVerificationPolicy: {
      enableHostVerification: true,
      useLocalKnownHostsDb: true,
    },
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
  const [openAftaSections, setOpenAftaSections] = useState({ afta_password_policy: true, afta_matrix: true, afta_audit_logs_viewer: true });

  const toggleAftaSection = (id) => {
    setOpenAftaSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const ALL_AFTA_KEYS = [
    "afta_password_policy",
    "afta_audit_logs_viewer",
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
    "afta_fpt_item1_secure_failure_state",
    "afta_fpt_item2_internal_transit",
    "afta_fpt_item3_security_data_interoperability",
    "afta_fpt_item4_trusted_timestamps",
    "afta_product_software_update",
    "afta_core_functions_fault_tolerance",
    "afta_tls_server_protocol",
    "afta_mutual_tls_protocol",
    "afta_certificate_validation_policy",
    "afta_ssh_protocol",
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

  // حالت‌های بخش ثبت‌نشان‌ها و لاگ‌های ممیزی افتا
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);
  const [auditLogSearch, setAuditLogSearch] = useState("");
  const [auditLogResultFilter, setAuditLogResultFilter] = useState("");
  const [selectedAuditLogModal, setSelectedAuditLogModal] = useState(null);

  const fetchAuditLogs = async (overrideParams = {}) => {
    try {
      setLoadingAuditLogs(true);
      let s = typeof overrideParams.search === "string" ? overrideParams.search : auditLogSearch;
      let r = typeof overrideParams.result === "string" ? overrideParams.result : auditLogResultFilter;
      const res = await api.get("/api/security/audit-logs", {
        params: {
          search: s.trim() || undefined,
          result: r || undefined,
          limit: 50
        }
      });
      if (res?.data?.success && Array.isArray(res.data.data)) {
        setAuditLogs(res.data.data);
      }
    } catch (err) {
      console.error("خطا در دریافت ثبت‌نشان‌ها:", err);
    } finally {
      setLoadingAuditLogs(false);
    }
  };

  const handleSimulateReadFailure = async () => {
    try {
      const res = await api.post("/api/security/simulate-read-failure");
      if (res.data?.success) {
        setSuccessMsg(res.data.message || "رکورد جدید لاگ با ثبت آدرس مسیر و IP ایجاد گردید.");
        await fetchAuditLogs({ search: "تلاش ناموفق برای خواندن ثبت‌نشان‌ها" });
      }
    } catch (err) {
      setErrorMsg("خطا در ایجاد رویداد آزمایشی: " + (err.response?.data?.message || err.message));
    }
  };

  useEffect(() => {
    if (activeTab === "security") {
      fetchActiveSessions();
      fetchAuditLogs();
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
          passwordPolicy: p.passwordPolicy || prev.passwordPolicy || {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: true
          },
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
          sensitiveDataIntegrityPolicy: p.sensitiveDataIntegrityPolicy || prev.sensitiveDataIntegrityPolicy,
          dataIntegrityErrorResponsePolicy: p.dataIntegrityErrorResponsePolicy || prev.dataIntegrityErrorResponsePolicy,
          productRolesDefinitionPolicy: p.productRolesDefinitionPolicy || prev.productRolesDefinitionPolicy,
          userRoleAssignmentPolicy: p.userRoleAssignmentPolicy || prev.userRoleAssignmentPolicy,
          secureFailureStatePolicy: p.secureFailureStatePolicy || prev.secureFailureStatePolicy,
          internalTransitProtectionPolicy: p.internalTransitProtectionPolicy || prev.internalTransitProtectionPolicy,
          securityDataInteroperabilityPolicy: p.securityDataInteroperabilityPolicy || prev.securityDataInteroperabilityPolicy,
          trustedTimestampPolicy: p.trustedTimestampPolicy || prev.trustedTimestampPolicy,
          productSoftwareUpdatePolicy: p.productSoftwareUpdatePolicy || prev.productSoftwareUpdatePolicy,
          coreFunctionsSoftwareFaultTolerancePolicy: p.coreFunctionsSoftwareFaultTolerancePolicy || prev.coreFunctionsSoftwareFaultTolerancePolicy,
          lastSuccessfulSessionNoticePolicy: p.lastSuccessfulSessionNoticePolicy || prev.lastSuccessfulSessionNoticePolicy,
          lastFailedSessionNoticePolicy: p.lastFailedSessionNoticePolicy || prev.lastFailedSessionNoticePolicy,
          preserveAccessRecordsPolicy: p.preserveAccessRecordsPolicy || prev.preserveAccessRecordsPolicy,
          sessionEstablishmentPreventionPolicy: p.sessionEstablishmentPreventionPolicy || prev.sessionEstablishmentPreventionPolicy,
          trustedChannelPolicy: p.trustedChannelPolicy || prev.trustedChannelPolicy,
          httpsProtocolPolicy: p.httpsProtocolPolicy || prev.httpsProtocolPolicy,
          tlsClientPolicy: p.tlsClientPolicy || prev.tlsClientPolicy,
          tlsServerPolicy: p.tlsServerPolicy || prev.tlsServerPolicy,
          mutualTlsPolicy: p.mutualTlsPolicy || prev.mutualTlsPolicy,
          certificateValidationPolicy: p.certificateValidationPolicy || prev.certificateValidationPolicy,
          sshProtocolPolicy: p.sshProtocolPolicy || prev.sshProtocolPolicy,
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
        minLength: Number(s.passwordPolicy?.minLength) || 8,
        requireUppercase: s.passwordPolicy?.requireUppercase ?? true,
        requireLowercase: s.passwordPolicy?.requireLowercase ?? true,
        requireNumbers: s.passwordPolicy?.requireNumbers ?? true,
        requireSpecialChars: s.passwordPolicy?.requireSpecialChars ?? true
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
      sensitiveDataIntegrityPolicy: s.sensitiveDataIntegrityPolicy,
      dataIntegrityErrorResponsePolicy: s.dataIntegrityErrorResponsePolicy,
      productRolesDefinitionPolicy: s.productRolesDefinitionPolicy,
      userRoleAssignmentPolicy: s.userRoleAssignmentPolicy,
      secureFailureStatePolicy: s.secureFailureStatePolicy,
      internalTransitProtectionPolicy: s.internalTransitProtectionPolicy,
      securityDataInteroperabilityPolicy: s.securityDataInteroperabilityPolicy,
      trustedTimestampPolicy: s.trustedTimestampPolicy,
      productSoftwareUpdatePolicy: s.productSoftwareUpdatePolicy,
      coreFunctionsSoftwareFaultTolerancePolicy: s.coreFunctionsSoftwareFaultTolerancePolicy,
      lastSuccessfulSessionNoticePolicy: s.lastSuccessfulSessionNoticePolicy,
      lastFailedSessionNoticePolicy: s.lastFailedSessionNoticePolicy,
      preserveAccessRecordsPolicy: s.preserveAccessRecordsPolicy,
      sessionEstablishmentPreventionPolicy: s.sessionEstablishmentPreventionPolicy,
      trustedChannelPolicy: s.trustedChannelPolicy,
      httpsProtocolPolicy: s.httpsProtocolPolicy,
      tlsClientPolicy: s.tlsClientPolicy,
      tlsServerPolicy: s.tlsServerPolicy,
      mutualTlsPolicy: s.mutualTlsPolicy,
      certificateValidationPolicy: s.certificateValidationPolicy,
      sshProtocolPolicy: s.sshProtocolPolicy,
    };
    await api.put("/api/security/policy", payload);
  };

  function set(field, val) {
    setSettings(s => ({ ...s, [field]: val }));
    setErrorMsg("");
    setSuccessMsg("");
  }

  function setPasswordPolicy(field, val) {
    setSettings(s => ({
      ...s,
      passwordPolicy: {
        ...(s.passwordPolicy || { minLength: 8, requireUppercase: true, requireLowercase: true, requireNumbers: true, requireSpecialChars: true }),
        [field]: val
      }
    }));
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

      const fileName = `PublicFinance_Full_Backup_${settings.activeFiscalYear}_${new Date().toISOString().slice(0, 10)}.json`;
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      await logFileDownloadAudit({
        fileName,
        section: "تنظیمات سیستم و پشتیبان‌گیری",
        dataType: "بایگانی و داده کاربری کامل سیستم",
        fileSize: `${(jsonString.length / 1024).toFixed(1)} KB`,
        fileFormat: "JSON",
        otherDetails: "دانلود خروجی پشتیبان کامل سیستم"
      });

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

                  {/* 🌟 کارت جدید: خط‌مشی رمز عبور و کاراکترهای مجاز (Password Policy & Required Characters) */}
                  <AftaAccordionCard
                    id="afta_password_policy"
                    number="تنظیمات رمز عبور"
                    title="خط‌مشی طول رمز عبور و کاراکترهای الزامی (Password Policy)"
                    description="تعیین حداقل طول رمز عبور، حروف بزرگ/کوچک انگلیسی، ارقام و کاراکترهای خاص هنگام تعریف کاربران جدید"
                    isOpen={!!openAftaSections["afta_password_policy"]}
                    onToggle={toggleAftaSection}
                    icon={KeyRound}
                  >
                    <div className="space-y-4">
                      <div className="bg-blue-50/70 dark:bg-blue-950/30 p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/50 space-y-1 text-xs">
                        <span className="font-bold text-blue-900 dark:text-blue-200 block">
                          🔒 الزامات و پیچیدگی رمز عبور کاربران (افتا - رده 7)
                        </span>
                        <p className="text-blue-800 dark:text-blue-300 text-[11px] leading-relaxed">
                          تنظیمات ثبت‌شده در این بخش مستقیماً در هنگام ثبت کاربر جدید و یا تغییر رمز عبور توسط کاربران اعمال می‌شود و در صورت عدم رعایت الزامات، سیستم از ایجاد کاربر جلوگیری خواهد کرد.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            حداقل طول رمز عبور (تعداد کاراکتر)
                          </Label>
                          <Input
                            type="number"
                            min={4}
                            max={32}
                            value={settings.passwordPolicy?.minLength ?? 8}
                            onChange={(e) => setPasswordPolicy("minLength", Math.max(4, Math.min(32, Number(e.target.value) || 8)))}
                            className="h-9 text-xs font-mono w-full max-w-xs"
                          />
                          <p className="text-[10.5px] text-muted-foreground">حداقل تعداد کاراکتر مجاز برای رمز عبور (پیش‌فرض: ۸ کاراکتر)</p>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-3">
                        <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                          کاراکترهای الزامی جهت تشکیل رمز عبور معتبر:
                        </Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <label className="flex items-center gap-2.5 p-3 rounded-xl border bg-white dark:bg-slate-900 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <input
                              type="checkbox"
                              checked={settings.passwordPolicy?.requireUppercase ?? true}
                              onChange={(e) => setPasswordPolicy("requireUppercase", e.target.checked)}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                              <span className="text-xs font-bold block text-slate-800 dark:text-slate-200">شامل حروف بزرگ انگلیسی (A-Z)</span>
                              <span className="text-[10px] text-muted-foreground">حداقل یک حرف بزرگ انگلیسی در رمز عبور وجود داشته باشد</span>
                            </div>
                          </label>

                          <label className="flex items-center gap-2.5 p-3 rounded-xl border bg-white dark:bg-slate-900 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <input
                              type="checkbox"
                              checked={settings.passwordPolicy?.requireLowercase ?? true}
                              onChange={(e) => setPasswordPolicy("requireLowercase", e.target.checked)}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                              <span className="text-xs font-bold block text-slate-800 dark:text-slate-200">شامل حروف کوچک انگلیسی (a-z)</span>
                              <span className="text-[10px] text-muted-foreground">حداقل یک حرف کوچک انگلیسی در رمز عبور وجود داشته باشد</span>
                            </div>
                          </label>

                          <label className="flex items-center gap-2.5 p-3 rounded-xl border bg-white dark:bg-slate-900 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <input
                              type="checkbox"
                              checked={settings.passwordPolicy?.requireNumbers ?? true}
                              onChange={(e) => setPasswordPolicy("requireNumbers", e.target.checked)}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                              <span className="text-xs font-bold block text-slate-800 dark:text-slate-200">شامل ارقام و اعداد (0-9)</span>
                              <span className="text-[10px] text-muted-foreground">حداقل یک عدد در رمز عبور وجود داشته باشد</span>
                            </div>
                          </label>

                          <label className="flex items-center gap-2.5 p-3 rounded-xl border bg-white dark:bg-slate-900 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <input
                              type="checkbox"
                              checked={settings.passwordPolicy?.requireSpecialChars ?? true}
                              onChange={(e) => setPasswordPolicy("requireSpecialChars", e.target.checked)}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                              <span className="text-xs font-bold block text-slate-800 dark:text-slate-200">شامل کاراکترهای خاص و نمادها (!@#$%^&*)</span>
                              <span className="text-[10px] text-muted-foreground">حداقل یک نماد ویژه مانند !@#$%^&* در رمز وجود داشته باشد</span>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </AftaAccordionCard>

                  {/* 🌟 بخش جدید: مشاهده لاگ‌های ممیزی و ثبت‌نشان‌های افتا (Audit Logs Viewer) */}
                  <AftaAccordionCard
                    id="afta_audit_logs_viewer"
                    number="بند ۳ افتا"
                    title="ثبت‌نشان‌ها و لاگ‌های ممیزی امنیتی افتا (Audit Logs)"
                    description="مشاهده ثبت‌نشان‌ها، تلاش‌های ناموفق (AUDIT_LOG_READ_FAILURE)، اصالت HMAC و رویدادهای امنیتی"
                    isOpen={!!openAftaSections["afta_audit_logs_viewer"]}
                    onToggle={toggleAftaSection}
                    icon={Activity}
                  >
                    <div className="space-y-4">
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-slate-100 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <ShieldCheck className="h-4 w-4 text-emerald-500" />
                            جدول ثبت‌نشان‌ها و ممیزی امنیتی سیستم
                          </span>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            در این جدول تمامی رویدادها، ورودها، تلاش‌های ناموفق (`AUDIT_LOG_READ_FAILURE`) و امضای اصالت HMAC ردیابی می‌شوند.
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleSimulateReadFailure}
                            className="h-8 text-xs font-bold gap-1.5 bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
                            title="تولید یک رکورد لاگ آزمایشی با ثبت دقیق آدرس IP و آدرس مسیر API جهت گزارش به افتا"
                          >
                            <AlertTriangle className="h-3.5 w-3.5" />
                            تولید رکورد لاگ با آدرس و IP
                          </Button>

                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => fetchAuditLogs()}
                            disabled={loadingAuditLogs}
                            className="h-8 text-xs font-bold gap-1.5 bg-white dark:bg-slate-900 border-slate-300"
                          >
                            <RefreshCw className={cn("h-3.5 w-3.5", loadingAuditLogs && "animate-spin")} />
                            به‌روزرسانی
                          </Button>
                        </div>
                      </div>

                      {/* فیلترها و جستجوی لاگ‌ها */}
                      <div className="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 p-3 rounded-xl border">
                        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                          <Input
                            placeholder="جستجو کلمه کلیدی، عنوان رویداد، IP، آدرس مسیر..."
                            value={auditLogSearch}
                            onChange={(e) => {
                              setAuditLogSearch(e.target.value);
                              fetchAuditLogs({ search: e.target.value });
                            }}
                            className="h-8 text-xs bg-slate-50 dark:bg-slate-800"
                          />
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 text-xs">
                          <span className="text-muted-foreground text-[11px]">فیلتر سریع:</span>
                          <button
                            type="button"
                            onClick={() => { setAuditLogSearch(""); setAuditLogResultFilter(""); fetchAuditLogs({ search: "", result: "" }); }}
                            className={cn("px-2 py-1 rounded-lg border text-[11px] font-bold transition-all", !auditLogSearch && !auditLogResultFilter ? "bg-blue-600 text-white border-blue-600" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300")}
                          >
                            همه
                          </button>
                          <button
                            type="button"
                            onClick={() => { setAuditLogSearch("تلاش ناموفق برای خواندن ثبت‌نشان‌ها"); fetchAuditLogs({ search: "تلاش ناموفق برای خواندن ثبت‌نشان‌ها" }); }}
                            className="px-2 py-1 rounded-lg border text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-300 dark:border-rose-800 hover:bg-rose-100"
                          >
                            تلاش‌های ناموفق لاگ
                          </button>
                          <button
                            type="button"
                            onClick={() => { setAuditLogResultFilter("FAILURE"); fetchAuditLogs({ result: "FAILURE" }); }}
                            className="px-2 py-1 rounded-lg border text-[11px] font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300 dark:border-amber-800 hover:bg-amber-100"
                          >
                            همه شکست‌ها (FAILURE)
                          </button>
                        </div>
                      </div>

                      {/* جدول لاگ‌ها */}
                      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-sm max-h-[400px]">
                        <table className="w-full text-xs text-right min-w-[850px]">
                          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b sticky top-0 z-10">
                            <tr>
                              <th className="p-2.5">وضعیت</th>
                              <th className="p-2.5">عنوان رویداد / اکشن</th>
                              <th className="p-2.5">کاربر</th>
                              <th className="p-2.5">آدرس (IP / مسیر API)</th>
                              <th className="p-2.5">تاریخ و زمان شمسی</th>
                              <th className="p-2.5 text-center min-w-[90px] w-[90px] whitespace-nowrap bg-slate-100 dark:bg-slate-800">جزئیات</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loadingAuditLogs ? (
                              <tr>
                                <td colSpan={6} className="p-6 text-center text-xs text-muted-foreground">
                                  در حال دریافت ثبت‌نشان‌ها از دیتابیس...
                                </td>
                              </tr>
                            ) : auditLogs.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="p-6 text-center text-xs text-muted-foreground">
                                  هیچ ثبت‌نشانی مطابق با فیلتر یافت نشد.
                                </td>
                              </tr>
                            ) : (
                              auditLogs.map((log) => (
                                <tr key={log._id || log.timestamp} className={cn("group hover:bg-slate-50/70 dark:hover:bg-slate-800/40", log.result === "FAILURE" && "bg-rose-50/30 dark:bg-rose-950/20")}>
                                  <td className="p-2.5">
                                    <span className={cn(
                                      "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                                      log.result === "FAILURE"
                                        ? "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-900/50 dark:text-rose-300"
                                        : "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-300"
                                    )}>
                                      {log.result === "FAILURE" ? "ناموفق (FAILURE)" : "موفق (SUCCESS)"}
                                    </span>
                                  </td>
                                  <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">
                                    {log.action || log.eventType}
                                  </td>
                                  <td className="p-2.5 font-medium text-slate-700 dark:text-slate-300">
                                    {log.userFullName || log.username} ({log.userRole || "کاربر"})
                                  </td>
                                  <td className="p-2.5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                                    <div className="space-y-0.5">
                                      <span className="font-bold block text-slate-800 dark:text-slate-200">IP: {log.ip || "127.0.0.1"}</span>
                                      <span className="text-[10px] block text-blue-600 dark:text-blue-400 font-semibold">{log.resource || "/api/security/audit-logs"}</span>
                                    </div>
                                  </td>
                                  <td className="p-2.5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                                    {log.shamsiDateTime || log.shamsiDate || log.timestamp}
                                  </td>
                                  <td className="p-2.5 text-center min-w-[90px] w-[90px] whitespace-nowrap bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50">
                                    <button
                                      type="button"
                                      onClick={() => alert(`📋 جزئیات کامل ثبت‌نشان افتا:\n\n📌 عنوان رویداد: ${log.action || log.eventType}\n🌐 آدرس آی‌پی (IP Address): ${log.ip || "127.0.0.1"}\n🔗 آدرس مسیر درخواست (Resource Path): ${log.resource || "/api/security/audit-logs"}\n📍 موقعیت مکانی: ${log.ipLocation || "ایران (تهران)"}\n👤 نام کاربر و نقش: ${log.userFullName || log.username} (${log.userRole || "حسابدار"})\n📅 تاریخ و زمان شمسی: ${log.shamsiDateTime || log.timestamp}\n⚠️ کد خطای امنیتی: ${log.errorCode || 403}\n🔐 امضای اصالت HMAC: ${log.signature || "معتبر"}`)}
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 font-semibold text-[11px] border border-blue-200 dark:border-blue-800/50 transition-colors"
                                      title="مشاهده جزئیات کامل لاگ"
                                    >
                                      <Eye className="h-4 w-4" />
                                      <span>نمایش</span>
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </AftaAccordionCard>

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

                  {/* 🌟 تمامی تغییرات در رفتارهای توابع کارکردی محصول (مدیریت امنیت) */}
                  <AftaAccordionCard
                    id="afta_function_behavior_management"
                    number="مدیریت امنیت"
                    title="مدیریت امنیت و تمامی تغییرات در رفتارهای توابع کارکردی محصول"
                    description="پشتیبانی از ۴ فعالیت مدیریتی توابع: تعیین/تغییر رفتار (کلید‌های ۱۰۰۶۶ و ۱۰۰۶۷)، غیرفعال نمودن، فعال نمودن و سایر موارد"
                    isOpen={!!openAftaSections["afta_function_behavior_management"]}
                    onToggle={toggleAftaSection}
                    icon={Sliders}
                  >
                    <div className="space-y-4">
                      {/* فعالیت ۱: تعیین و تغییر رفتار (بازه زمانی مجاز برای ورود کلید ۱۰۰۶۶ و ۱۰۰۶۷) */}
                      <div className="p-3.5 rounded-xl border bg-white dark:bg-slate-900 space-y-3 shadow-2xs">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 border-r-4 pr-2 border-blue-600">
                          <Clock className="h-4 w-4 text-blue-600" />
                          ۱. تعیین و تغییر رفتار: بازه زمانی مجاز برای ورود به سیستم (کلید‌های ۱۰۰۶۶ و ۱۰۰۶۷)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                          <div>
                            <Label className="text-[11px] text-muted-foreground block mb-1">ابتدای بازه زمانی مجاز برای ورود (کلید ۱۰۰۶۶):</Label>
                            <Input
                              type="text"
                              value={settings.functionBehaviorPolicy?.allowedLoginStartTime || "07:00"}
                              onChange={e => {
                                set("functionBehaviorPolicy", {
                                  ...settings.functionBehaviorPolicy,
                                  allowedLoginStartTime: e.target.value
                                });
                              }}
                              placeholder="07:00"
                              className="h-8 text-xs font-mono text-center dir-ltr"
                            />
                          </div>
                          <div>
                            <Label className="text-[11px] text-muted-foreground block mb-1">انتهای بازه زمانی مجاز برای ورود (کلید ۱۰۰۶۷):</Label>
                            <Input
                              type="text"
                              value={settings.functionBehaviorPolicy?.allowedLoginEndTime || "23:30"}
                              onChange={e => {
                                set("functionBehaviorPolicy", {
                                  ...settings.functionBehaviorPolicy,
                                  allowedLoginEndTime: e.target.value
                                });
                              }}
                              placeholder="23:30"
                              className="h-8 text-xs font-mono text-center dir-ltr"
                            />
                          </div>
                          <div className="flex items-end">
                            <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-2 rounded-lg border w-full bg-slate-50 dark:bg-slate-800/60">
                              <input
                                type="checkbox"
                                checked={settings.functionBehaviorPolicy?.enableLoginTimeWindow ?? true}
                                onChange={e => {
                                  set("functionBehaviorPolicy", {
                                    ...settings.functionBehaviorPolicy,
                                    enableLoginTimeWindow: e.target.checked
                                  });
                                }}
                                className="h-4 w-4 rounded border-slate-300 text-blue-600"
                              />
                              <span>اعمال محدودیت بازه زمانی ورود</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* فعالیت‌های ۲ و ۳: غیرفعال نمودن / فعال نمودن توابع و کارکردها */}
                      <div className="p-3.5 rounded-xl border bg-white dark:bg-slate-900 space-y-3 shadow-2xs">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 border-r-4 pr-2 border-emerald-600">
                          <ShieldCheck className="h-4 w-4 text-emerald-600" />
                          ۲ و ۳. فعالیت‌های مدیریتی غیرفعال نمودن و فعال نمودن توابع مربوط به مدیریت محصول
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                          <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-2.5 rounded-lg border bg-slate-50 dark:bg-slate-800/60">
                            <input
                              type="checkbox"
                              checked={settings.functionBehaviorPolicy?.disabledFunctions?.disableDirectDatabaseExport ?? false}
                              onChange={e => {
                                set("functionBehaviorPolicy", {
                                  ...settings.functionBehaviorPolicy,
                                  disabledFunctions: {
                                    ...settings.functionBehaviorPolicy?.disabledFunctions,
                                    disableDirectDatabaseExport: e.target.checked
                                  }
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-rose-600"
                            />
                            <span>غیرفعال نمودن خروجی مستقیم پایگاه داده (غیرفعال نمودن کارکرد)</span>
                          </label>

                          <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-2.5 rounded-lg border bg-slate-50 dark:bg-slate-800/60">
                            <input
                              type="checkbox"
                              checked={settings.functionBehaviorPolicy?.enabledFunctions?.enableMfaForAdmins ?? true}
                              onChange={e => {
                                set("functionBehaviorPolicy", {
                                  ...settings.functionBehaviorPolicy,
                                  enabledFunctions: {
                                    ...settings.functionBehaviorPolicy?.enabledFunctions,
                                    enableMfaForAdmins: e.target.checked
                                  }
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                            />
                            <span>فعال نمودن احراز هویت دو عاملی مدیران سیستم (فعال نمودن کارکرد)</span>
                          </label>
                        </div>
                      </div>
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

                  {/* ۲۵. 🌟 رده ۲-۶ بند ۱ افتا: حفظ وضعیت امن محصول هنگام رخ دادن خرابی، اشکال یا شکست */}
                  <AftaAccordionCard
                    id="afta_fpt_item1_secure_failure_state"
                    number="رده ۲-۶ بند ۱ افتا"
                    title="حفاظت در برابر شکست و حفظ وضعیت امن هنگام خرابی‌های نرم‌افزاری و سخت‌افزاری"
                    description="قرارگیری محصول در وضعیت امن، حفظ صحت داده‌ها و تداوم خط‌مشی کنترل دسترسی در زمان بروز اختلال یا قطعی ارتباط با دیتابیس"
                    isOpen={!!openAftaSections["afta_fpt_item1_secure_failure_state"]}
                    onToggle={toggleAftaSection}
                    icon={ShieldAlert}
                  >
                    <div className="space-y-4">
                      <div className="bg-rose-50 dark:bg-rose-950/30 p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/50">
                        <span className="text-xs font-bold text-rose-900 dark:text-rose-200 block mb-1">
                          الزام رده ۲-۶ بند ۱ افتا: محصول باید هنگام رخ دادن هرگونه خرابی، اشکال یا شکست مانند از کار افتادن محصول، قطع شدن ارتباط محصول با پایگاه داده و یا اختلال در کارکردهای محصول، در وضعیت امن قرار گرفته، صحت داده‌ها و خط‌مشی کنترل دسترسی را حفظ نماید.
                        </span>
                        <p className="text-[11px] text-rose-800 dark:text-rose-300 leading-relaxed">
                          توضیح خلاصه جهت گزارش به افتا: نرم‌افزار هنگام بروز خرابی‌های نرم‌افزاری، سخت‌افزاری و قطعی شبکه با دیتابیس بلافاصله تراکنش‌ها را به‌صورت غیرمخرب متوقف نموده، از افشای اطلاعات ممانعت کرده و صحت داده‌ها و خط‌مشی کنترل دسترسی را کاملاً حفظ می‌نماید.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.secureFailureStatePolicy?.softwareFailureProtection ?? true}
                            onChange={e => {
                              set("secureFailureStatePolicy", {
                                ...settings.secureFailureStatePolicy,
                                softwareFailureProtection: e.target.checked
                              });
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-rose-600 mt-0.5"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                              ۱. خرابی‌های نرم‌افزاری (Software Failures)
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                              مدیریت خطاهای غیرمنتظره زمان اجرا و Crash، هدایت امن کاربر به وضعیت Fail-Safe و ممانعت از افشای حافظه یا پشته خطاهای امنیتی.
                            </span>
                          </div>
                        </label>

                        <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.secureFailureStatePolicy?.hardwareFailureProtection ?? true}
                            onChange={e => {
                              set("secureFailureStatePolicy", {
                                ...settings.secureFailureStatePolicy,
                                hardwareFailureProtection: e.target.checked
                              });
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-rose-600 mt-0.5"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                              ۲. خرابی‌های سخت‌افزاری و قطع ارتباط با دیتابیس (Hardware Failures & DB Disconnect)
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                              مدیریت قطعی سخت‌افزار، سرور و اتصال دیتابیس با بازگردانی (Rollback) تراکنش‌های ناتمام و قفل‌گذاری حساب‌های حساس.
                            </span>
                          </div>
                        </label>

                        <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                          <input
                            type="checkbox"
                            checked={settings.secureFailureStatePolicy?.preserveDataIntegrityOnCrash ?? true}
                            onChange={e => {
                              set("secureFailureStatePolicy", {
                                ...settings.secureFailureStatePolicy,
                                preserveDataIntegrityOnCrash: e.target.checked
                              });
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-rose-600"
                          />
                          <span>حفظ صحت کامل داده‌ها (Data Integrity) پس از بازیابی از شرایط خرابی</span>
                        </label>

                        <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                          <input
                            type="checkbox"
                            checked={settings.secureFailureStatePolicy?.maintainAccessControlRulesOnFailure ?? true}
                            onChange={e => {
                              set("secureFailureStatePolicy", {
                                ...settings.secureFailureStatePolicy,
                                maintainAccessControlRulesOnFailure: e.target.checked
                              });
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-rose-600"
                          />
                          <span>حفظ و عدم تنزل خط‌مشی‌های کنترل دسترسی (ACL Rules) در زمان اختلال سیستم</span>
                        </label>
                      </div>
                    </div>
                  </AftaAccordionCard>

                  {/* ۲۶. 🌟 رده ۲-۶ بند ۲ افتا: حفاظت از داده هنگام انتقال بین بخش‌های مجزای محصول */}
                  <AftaAccordionCard
                    id="afta_fpt_item2_internal_transit"
                    number="رده ۲-۶ بند ۲ افتا"
                    title="حفاظت از داده‌ها هنگام انتقال بین بخش‌های مجزای محصول (ممانعت از افشاء و تغییر)"
                    description="ایجاد بستر و زیرساخت امن جهت جلوگیری از افشاء یا تغییر داده‌ها هنگام انتقال بین ماژول‌ها و سرویس‌های داخلی"
                    isOpen={!!openAftaSections["afta_fpt_item2_internal_transit"]}
                    onToggle={toggleAftaSection}
                    icon={Lock}
                  >
                    <div className="space-y-4">
                      <div className="bg-blue-50 dark:bg-blue-950/30 p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/50">
                        <span className="text-xs font-bold text-blue-900 dark:text-blue-200 block mb-1">
                          الزام رده ۲-۶ بند ۲ افتا: محصول باید از طریق فراهم نمودن بستر و زیرساخت امن، توانایی جلوگیری از افشاء یا تغییر داده، هنگام انتقال بین بخش‌های مجزای خود را داشته باشد.
                        </span>
                        <p className="text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed">
                          توضیح خلاصه جهت گزارش به افتا: کلیه ارتباطات و انتقال داده‌ها بین بخش‌های مختلف محصول از طریق پروتکل‌های رمزنگاری‌شده (TLS/HTTPS و بستر امن IPC) صورت گرفته و در برابر شنود، افشاء یا دستکاری محافظت می‌شود.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                          <input
                            type="checkbox"
                            checked={settings.internalTransitProtectionPolicy?.preventDataLeakageInTransit ?? true}
                            onChange={e => {
                              set("internalTransitProtectionPolicy", {
                                ...settings.internalTransitProtectionPolicy,
                                preventDataLeakageInTransit: e.target.checked
                              });
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600"
                          />
                          <span>جلوگیری از افشای داده‌ها هنگام انتقال بین بخش‌های مجزای محصول (Prevent Data Leakage)</span>
                        </label>

                        <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900">
                          <input
                            type="checkbox"
                            checked={settings.internalTransitProtectionPolicy?.preventDataTamperingInTransit ?? true}
                            onChange={e => {
                              set("internalTransitProtectionPolicy", {
                                ...settings.internalTransitProtectionPolicy,
                                preventDataTamperingInTransit: e.target.checked
                              });
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600"
                          />
                          <span>جلوگیری از تغییر یا دستکاری داده‌ها در بستر انتقال داخلی (Prevent Data Tampering)</span>
                        </label>

                        <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer p-3 rounded-xl border bg-white dark:bg-slate-900 md:col-span-2">
                          <input
                            type="checkbox"
                            checked={settings.internalTransitProtectionPolicy?.enforceInternalComponentTLS ?? true}
                            onChange={e => {
                              set("internalTransitProtectionPolicy", {
                                ...settings.internalTransitProtectionPolicy,
                                enforceInternalComponentTLS: e.target.checked
                              });
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600"
                          />
                          <span>الزام بستر رمزنگاری TLS/IPC در تمامی ارتباطات فرانت‌اند، بک‌اند و سرویس‌های داخلی</span>
                        </label>
                      </div>
                    </div>
                  </AftaAccordionCard>

                  {/* ۲۷. 🌟 رده ۲-۶ بند ۳ افتا: تفسیر سازگار و یکسان داده‌های امنیتی قابل اشتراک‌گذاری با سایر محصولات IT */}
                  <AftaAccordionCard
                    id="afta_fpt_item3_security_data_interoperability"
                    number="رده ۲-۶ بند ۳ افتا"
                    title="تفسیر سازگار و یکسان داده‌های امنیتی هنگام اشتراک‌گذاری با سایر محصولات IT"
                    description="تفسیر یکنواخت داده‌های امنیتی (احراز هویت، کلید، امضای دیجیتال، ثبت‌نشان‌ها و سایر موارد) در تبادل با محصولات امن IT"
                    isOpen={!!openAftaSections["afta_fpt_item3_security_data_interoperability"]}
                    onToggle={toggleAftaSection}
                    icon={Activity}
                  >
                    <div className="space-y-4">
                      <div className="bg-purple-50 dark:bg-purple-950/30 p-3.5 rounded-xl border border-purple-200 dark:border-purple-900/50">
                        <span className="text-xs font-bold text-purple-900 dark:text-purple-200 block mb-1">
                          الزام رده ۲-۶ بند ۳ افتا: در صورتی که محصول از محصولات امن IT دیگری استفاده می‌کند، باید تفسیر سازگار و یکسانی را از داده امنیتی در زمان اشتراک‌گذاری آن بین خود و دیگر محصولات امن IT، فراهم آورد.
                        </span>
                        <p className="text-[11px] text-purple-800 dark:text-purple-300 leading-relaxed">
                          توضیح خلاصه جهت گزارش به افتا: ساختار و تفسیر داده‌های امنیتی قابل اشتراک‌گذاری کاملاً منطبق بر استانداردهای امنیتی IT بوده و با سایر سامانه‌های امنیتی به‌صورت سازگار مبادله می‌شود.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-xs font-black text-purple-900 dark:text-purple-300 flex items-center gap-2 border-b pb-2">
                          داده‌های امنیتی قابل اشتراک‌گذاری پشتیبانی‌شده در محصول (مطابق جدول افتا):
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.securityDataInteroperabilityPolicy?.supportedShareableData?.authData ?? true}
                              onChange={e => {
                                set("securityDataInteroperabilityPolicy", {
                                  ...settings.securityDataInteroperabilityPolicy,
                                  supportedShareableData: {
                                    ...settings.securityDataInteroperabilityPolicy?.supportedShareableData,
                                    authData: e.target.checked
                                  }
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-purple-600 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                ۱. داده‌های احراز هویت (Authentication Data)
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                                پشتیبانی از توکن‌ها، ادعاهای هویت و هش‌های احراز هویت استاندارد (JWT / OAuth2 / SAML2).
                              </span>
                            </div>
                          </label>

                          <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.securityDataInteroperabilityPolicy?.supportedShareableData?.cryptoKeys ?? true}
                              onChange={e => {
                                set("securityDataInteroperabilityPolicy", {
                                  ...settings.securityDataInteroperabilityPolicy,
                                  supportedShareableData: {
                                    ...settings.securityDataInteroperabilityPolicy?.supportedShareableData,
                                    cryptoKeys: e.target.checked
                                  }
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-purple-600 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                ۲. کلید (Cryptographic Keys)
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                                تبادل و تفسیر سازگار کلیدهای عمومی و گواهی‌های رمزنگاری (JWK / PEM / PKCS#8).
                              </span>
                            </div>
                          </label>

                          <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.securityDataInteroperabilityPolicy?.supportedShareableData?.digitalSignature ?? true}
                              onChange={e => {
                                set("securityDataInteroperabilityPolicy", {
                                  ...settings.securityDataInteroperabilityPolicy,
                                  supportedShareableData: {
                                    ...settings.securityDataInteroperabilityPolicy?.supportedShareableData,
                                    digitalSignature: e.target.checked
                                  }
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-purple-600 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                ۳. امضای دیجیتال (Digital Signatures / PKI)
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                                پشتیبانی و اعتبارسنجی یکسان امضاهای دیجیتال ممهور به گواهی‌های معتبر (X.509).
                              </span>
                            </div>
                          </label>

                          <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.securityDataInteroperabilityPolicy?.supportedShareableData?.auditLogs ?? true}
                              onChange={e => {
                                set("securityDataInteroperabilityPolicy", {
                                  ...settings.securityDataInteroperabilityPolicy,
                                  supportedShareableData: {
                                    ...settings.securityDataInteroperabilityPolicy?.supportedShareableData,
                                    auditLogs: e.target.checked
                                  }
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-purple-600 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                ۴. ثبت‌نشان‌ها / داده‌های ممیزی (Audit Logs / Security Trail)
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                                تولید لاگ‌های حسابرسی طبق ساختار استاندارد قابل پردازش توسط SIEM و مرکز عملیات امنیت.
                              </span>
                            </div>
                          </label>

                          <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer md:col-span-2">
                            <input
                              type="checkbox"
                              checked={settings.securityDataInteroperabilityPolicy?.supportedShareableData?.otherSecurityAttributes ?? true}
                              onChange={e => {
                                set("securityDataInteroperabilityPolicy", {
                                  ...settings.securityDataInteroperabilityPolicy,
                                  supportedShareableData: {
                                    ...settings.securityDataInteroperabilityPolicy?.supportedShareableData,
                                    otherSecurityAttributes: e.target.checked
                                  }
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-purple-600 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                ۵. سایر موارد (Other Security Attributes)
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                                برچسب‌های امنیتی، سطوح محرمانگی داده‌ها و مشخصه‌های کنترل دسترسی نقش‌محور.
                              </span>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </AftaAccordionCard>

                  {/* ۲۸. 🌟 رده ۲-۶ بند ۴ افتا: تولید و استفاده از مهرهای زمانی معتبر (مطابق تصویر فایل ورد افتا) */}
                  <AftaAccordionCard
                    id="afta_fpt_item4_trusted_timestamps"
                    number="رده ۲-۶ بند ۴ افتا"
                    title="تولید و استفاده از زمان و تاریخ معتبر (مهرهای زمانی معتبر - Trusted Timestamps)"
                    description="الزام تولید و استفاده از مهرهای زمانی معتبر، گرفتن زمان از NTP، اینترنت، تنظیم پیش‌فرض معتبر و سایر موارد"
                    isOpen={!!openAftaSections["afta_fpt_item4_trusted_timestamps"]}
                    onToggle={toggleAftaSection}
                    icon={Clock}
                  >
                    <div className="space-y-4">
                      <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
                        <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 block mb-1">
                          الزام رده ۲-۶ بند ۴ افتا: محصول باید زمان و تاریخ معتبری داشته باشد، بنابراین باید مهرهای زمانی معتبر را تولید یا از آن‌ها استفاده نماید.
                        </span>
                        <p className="text-[11px] text-emerald-800 dark:text-emerald-300 leading-relaxed">
                          توضیح خلاصه جهت گزارش به افتا: روش‌های انتخاب و ایجاد مهرهای زمانی معتبر در محصول فعال بوده و از دستکاری غیرمجاز زمان سیستم و تراکنش‌ها ممانعت می‌گردد.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-xs font-black text-emerald-900 dark:text-emerald-300 flex items-center gap-2 border-b pb-2">
                          روش‌های ایجاد مهرهای زمانی معتبر انتخاب شود (مطابق جدول افتا):
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.trustedTimestampPolicy?.timestampMethods?.getTimestampFromNtpServer ?? true}
                              onChange={e => {
                                set("trustedTimestampPolicy", {
                                  ...settings.trustedTimestampPolicy,
                                  timestampMethods: {
                                    ...settings.trustedTimestampPolicy?.timestampMethods,
                                    getTimestampFromNtpServer: e.target.checked
                                  }
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-emerald-600 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                ۱. گرفتن مهرهای زمانی از سرور NTP
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                                دریافت و همگام‌سازی زمان و مهرهای زمانی مرجع از سرور شبکه (NTP Server).
                              </span>
                            </div>
                          </label>

                          <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.trustedTimestampPolicy?.timestampMethods?.setTimestampViaInternet ?? true}
                              onChange={e => {
                                set("trustedTimestampPolicy", {
                                  ...settings.trustedTimestampPolicy,
                                  timestampMethods: {
                                    ...settings.trustedTimestampPolicy?.timestampMethods,
                                    setTimestampViaInternet: e.target.checked
                                  }
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-emerald-600 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                ۲. تنظیم مهرهای زمانی از طریق اینترنت
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                                همگام‌سازی آنلاین و دریافت مهرهای زمانی از سرورهای مرجع اینترنتی (Internet Time Protocol).
                              </span>
                            </div>
                          </label>

                          <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.trustedTimestampPolicy?.timestampMethods?.setDefaultTrustedTimestamp ?? true}
                              onChange={e => {
                                set("trustedTimestampPolicy", {
                                  ...settings.trustedTimestampPolicy,
                                  timestampMethods: {
                                    ...settings.trustedTimestampPolicy?.timestampMethods,
                                    setDefaultTrustedTimestamp: e.target.checked
                                  }
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-emerald-600 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                ۳. تنظیم مهرهای زمانی به صورت پیش‌فرض (معتبر و عدم امکان دستکاری غیرمجاز)
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                                اعمال مهر زمانی پیش‌فرض سیستم با حفاظت در برابر دستکاری و تغییرات غیرمجاز زمان.
                              </span>
                            </div>
                          </label>

                          <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.trustedTimestampPolicy?.timestampMethods?.otherMethods ?? true}
                              onChange={e => {
                                set("trustedTimestampPolicy", {
                                  ...settings.trustedTimestampPolicy,
                                  timestampMethods: {
                                    ...settings.trustedTimestampPolicy?.timestampMethods,
                                    otherMethods: e.target.checked
                                  }
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-emerald-600 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                ۴. سایر موارد
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                                استفاده از سخت‌افزارهای امنیتی زمات‌سنجی (HSM) و مراکز گواهی مهر زمانی (TSA).
                              </span>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </AftaAccordionCard>

                  {/* ۲۹. 🌟 الزام افتا: بروزرسانی نرم‌افزار و میان‌افزار محصول برای مدیر سیستم (مطابق تصویر فایل ورد افتا) */}
                  <AftaAccordionCard
                    id="afta_product_software_update"
                    number="الزام بروزرسانی افتا"
                    title="الزام افتا: بروزرسانی نرم‌افزار و میان‌افزار محصول برای مدیر سیستم"
                    description="فراهم نمودن امکان بروزرسانی محصول با تعیین روش‌های بروزرسانی دستی، جستجوی خودکار، بروزرسانی خودکار و اعتبارسنجی امنیتی وصله‌ها"
                    isOpen={!!openAftaSections["afta_product_software_update"]}
                    onToggle={toggleAftaSection}
                    icon={RefreshCw}
                  >
                    <div className="space-y-4">
                      <div className="bg-sky-50 dark:bg-sky-950/30 p-3.5 rounded-xl border border-sky-200 dark:border-sky-900/50">
                        <span className="text-xs font-bold text-sky-900 dark:text-sky-200 block mb-1">
                          الزام افتا: محصول باید امکان بروزرسانی نرم‌افزار و میان‌افزار محصول را برای مدیر سیستم فراهم نماید.
                        </span>
                        <p className="text-[11px] text-sky-800 dark:text-sky-300 leading-relaxed">
                          توضیح خلاصه جهت گزارش به افتا: امکان بروزرسانی امن نرم‌افزار و میان‌افزار سیستم برای مدیر ارشد فراهم شده و روش‌های بروزرسانی بر اساس ضوابط امنیتی افتا تعیین و اعتبارسنجی می‌گردند.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-xs font-black text-sky-900 dark:text-sky-300 flex items-center gap-2 border-b pb-2">
                          روش بروزرسانی مورد استفاده در محصول، مشخص گردد (مطابق جدول افتا - حداقل یک مورد لازم و کافی است):
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.productSoftwareUpdatePolicy?.updateMethods?.manualUpdate ?? true}
                              onChange={e => {
                                set("productSoftwareUpdatePolicy", {
                                  ...settings.productSoftwareUpdatePolicy,
                                  updateMethods: {
                                    ...settings.productSoftwareUpdatePolicy?.updateMethods,
                                    manualUpdate: e.target.checked
                                  }
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-sky-600 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                ۱. بروزرسانی دستی (Manual Update)
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                                بارگذاری و نصب دستی فایل‌های بروزرسانی یا بسته وصله‌های نرم‌افزاری/میان‌افزاری توسط مدیر سیستم.
                              </span>
                            </div>
                          </label>

                          <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.productSoftwareUpdatePolicy?.updateMethods?.autoSearchForUpdates ?? true}
                              onChange={e => {
                                set("productSoftwareUpdatePolicy", {
                                  ...settings.productSoftwareUpdatePolicy,
                                  updateMethods: {
                                    ...settings.productSoftwareUpdatePolicy?.updateMethods,
                                    autoSearchForUpdates: e.target.checked
                                  }
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-sky-600 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                ۲. جستجوی خودکار بروزرسانی‌ها (Auto Search for Updates)
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                                برقراری ارتباط دوره‌ای خودکار با مخزن مرجع جهت بررسی و اطلاع‌رسانی انتشار نسخه‌ها و وصله‌های جدید.
                              </span>
                            </div>
                          </label>

                          <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.productSoftwareUpdatePolicy?.updateMethods?.automaticUpdates ?? false}
                              onChange={e => {
                                set("productSoftwareUpdatePolicy", {
                                  ...settings.productSoftwareUpdatePolicy,
                                  updateMethods: {
                                    ...settings.productSoftwareUpdatePolicy?.updateMethods,
                                    automaticUpdates: e.target.checked
                                  }
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-sky-600 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                ۳. بروزرسانی‌های خودکار (Automatic Updates)
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                                دریافت و اعمال خودکار بروزرسانی‌های امنیتی و وصله‌های بحرانی در زمان‌های کم‌ترافیک سیستم.
                              </span>
                            </div>
                          </label>

                          <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.productSoftwareUpdatePolicy?.updateMethods?.manualUpdateAfterSecurityVerification ?? true}
                              onChange={e => {
                                set("productSoftwareUpdatePolicy", {
                                  ...settings.productSoftwareUpdatePolicy,
                                  updateMethods: {
                                    ...settings.productSoftwareUpdatePolicy?.updateMethods,
                                    manualUpdateAfterSecurityVerification: e.target.checked
                                  }
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-sky-600 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                ۴. بروزرسانی دستی بعد از اطمینان از امنیت وصله و یا فایل بروزرسانی
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                                اعتبارسنجی امضای دیجیتال توسعه‌دهنده، هش فایل وصله (SHA-256 Checksum) و سلامت فایل قبل از نصب دستی.
                              </span>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* الزام دوم افتا: احراز اصالت پیش از نصب خودکار بروزرسانی‌ها */}
                      <div className="space-y-3 pt-3 border-t">
                        <div className="bg-amber-50 dark:bg-amber-950/30 p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/50">
                          <span className="text-xs font-bold text-amber-900 dark:text-amber-200 block mb-1">
                            الزام افتا (احراز اصالت بروزرسانی‌های خودکار): در صورت استفاده از بروزرسانی به روش خودکار، محصول باید پیش از نصب بروزرسانی‌های نرم‌افزاری و میان‌افزاری، امکان احراز اصالت میان‌افزار یا نرم‌افزار را فراهم نماید.
                          </span>
                          <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                            توضیح خلاصه جهت گزارش به افتا: سازوکارهای اعتبارسنجی اصالت فایل‌های بروزرسانی (امضای دیجیتال و درهم‌ساز منتشرشده) جهت ممانعت از نصب وصله‌های آلوده یا غیرمجاز فعال می‌باشد.
                          </p>
                        </div>

                        <h4 className="text-xs font-black text-amber-900 dark:text-amber-300 flex items-center gap-2 border-b pb-2">
                          سازوکار مورد استفاده برای صحت‌سنجی (اصالت‌سنجی) بروزرسانی‌ها انتخاب گردد (مطابق جدول افتا):
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.productSoftwareUpdatePolicy?.autoUpdateAuthenticityVerification?.digitalSignature ?? true}
                              onChange={e => {
                                set("productSoftwareUpdatePolicy", {
                                  ...settings.productSoftwareUpdatePolicy,
                                  autoUpdateAuthenticityVerification: {
                                    ...settings.productSoftwareUpdatePolicy?.autoUpdateAuthenticityVerification,
                                    digitalSignature: e.target.checked
                                  }
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-amber-600 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                ۱. امضای دیجیتال (Digital Signature)
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                                بررسی و اعتبارسنجی امضای دیجیتال معتبر سازنده بر روی کلیه پکیج‌های بروزرسانی خودکار قبل از نصب.
                              </span>
                            </div>
                          </label>

                          <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.productSoftwareUpdatePolicy?.autoUpdateAuthenticityVerification?.publishedHash ?? true}
                              onChange={e => {
                                set("productSoftwareUpdatePolicy", {
                                  ...settings.productSoftwareUpdatePolicy,
                                  autoUpdateAuthenticityVerification: {
                                    ...settings.productSoftwareUpdatePolicy?.autoUpdateAuthenticityVerification,
                                    publishedHash: e.target.checked
                                  }
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-amber-600 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                ۲. درهم‌ساز منتشرشده (Published Hash / Digest)
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                                محاسبه و تطبیق درهم‌ساز رمزنگاری‌شده (SHA-256 Checksum) با مقدار هش رسمی انتشاریافته شرکت.
                              </span>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </AftaAccordionCard>

                  {/* ۳۰. 🌟 الزام افتا: اطمینان از عملکرد کارکردهای اصلی محصول در زمان رخداد هرگونه اشکال و خرابی (شکست) نرم‌افزاری */}
                  <AftaAccordionCard
                    id="afta_core_functions_fault_tolerance"
                    number="الزام تداوم کارکرد افتا"
                    title="الزام افتا: اطمینان از عملکرد کارکردهای اصلی محصول هنگام بروز اشکال و خرابی (شکست) نرم‌افزاری"
                    description="تضمین پایداری و تداوم ارائه خدمات اصلی سیستم و جداسازی ماژول‌های معیوب در صورت وقوع خطاهای زمان اجرا و Crash"
                    isOpen={!!openAftaSections["afta_core_functions_fault_tolerance"]}
                    onToggle={toggleAftaSection}
                    icon={ShieldCheck}
                  >
                    <div className="space-y-4">
                      <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
                        <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 block mb-1">
                          الزام افتا: محصول باید در زمان رخداد هرگونه اشکال و خرابی (شکست) نرم‌افزاری، از عملکرد کارکردهای اصلی محصول اطمینان حاصل نماید.
                        </span>
                        <p className="text-[11px] text-emerald-800 dark:text-emerald-300 leading-relaxed">
                          توضیح خلاصه جهت گزارش به افتا: سامانه به مکانیزم‌های تحمل خطا (Fault Tolerance) و جداسازی ماژول‌ها مجهز بوده و هنگام بروز خطا در یک بخش، تداوم فعالیت کارکردهای اصلی محصول را تضمین می‌نماید.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.coreFunctionsSoftwareFaultTolerancePolicy?.isolationOfFaultyModules ?? true}
                            onChange={e => {
                              set("coreFunctionsSoftwareFaultTolerancePolicy", {
                                ...settings.coreFunctionsSoftwareFaultTolerancePolicy,
                                isolationOfFaultyModules: e.target.checked
                              });
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-emerald-600 mt-0.5"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                              ۱. جداسازی ماژول‌های دارای خطای نرم‌افزاری (Faulty Module Isolation)
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                              جداسازی ایزوله سرویس‌ها و ماژول‌های دچار خطای زمان اجرا جهت ممانعت از تسری خطا به سایر کارکردهای اصلی.
                            </span>
                          </div>
                        </label>

                        <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.coreFunctionsSoftwareFaultTolerancePolicy?.fallbackToCoreOperationalMode ?? true}
                            onChange={e => {
                              set("coreFunctionsSoftwareFaultTolerancePolicy", {
                                ...settings.coreFunctionsSoftwareFaultTolerancePolicy,
                                fallbackToCoreOperationalMode: e.target.checked
                              });
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-emerald-600 mt-0.5"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                              ۲. فعال نگه‌داشتن کارکردهای اصلی محصول (Core Functionality Preservation)
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                              هدایت سامانه به وضعیت عملیاتی امن و پایداری ارائه سرویس‌های اصلی مالی، حسابداری و کنترل اسناد.
                            </span>
                          </div>
                        </label>

                        <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.coreFunctionsSoftwareFaultTolerancePolicy?.gracefulDegradation ?? true}
                            onChange={e => {
                              set("coreFunctionsSoftwareFaultTolerancePolicy", {
                                ...settings.coreFunctionsSoftwareFaultTolerancePolicy,
                                gracefulDegradation: e.target.checked
                              });
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-emerald-600 mt-0.5"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                              ۳. افت کیفیت کنترل‌شده نرم‌افزار (Graceful Degradation)
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                              غیرفعال‌سازی موقت ماژول‌های فرعی و غیرضروری در شرایط اختلال شدید جهت حفظ پایداری کامل وظایف کلیدی.
                            </span>
                          </div>
                        </label>

                        <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.coreFunctionsSoftwareFaultTolerancePolicy?.auditLogFaultEvents ?? true}
                            onChange={e => {
                              set("coreFunctionsSoftwareFaultTolerancePolicy", {
                                ...settings.coreFunctionsSoftwareFaultTolerancePolicy,
                                auditLogFaultEvents: e.target.checked
                              });
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-emerald-600 mt-0.5"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                              ۴. ثبت‌نشان رویدادهای اشکال و خرابی نرم‌افزار (Fault Audit Logging)
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                              ثبت دقیق پشته خطاهای زمان اجرا، رخدادهای غیرمنتظره و منشاء اشکال در لاگ حسابرسی امنیتی افتا (Audit Log).
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </AftaAccordionCard>

                  {/* ۳۱. 🌟 نمایش آخرین تلاش موفق برای ایجاد نشست */}
                  <AftaAccordionCard
                    id="afta_last_successful_session_notice"
                    number="الزام افتا"
                    title="نمایش آخرین تلاش موفق برای ایجاد نشست"
                    description="در صورت برقراری نشست به طور موفقیت‌آمیز، محصول باید قادر به نمایش آخرین تلاش موفق برای ایجاد نشست بر اساس موارد زیر باشد"
                    isOpen={!!openAftaSections["afta_last_successful_session_notice"]}
                    onToggle={toggleAftaSection}
                    icon={CheckCircle2}
                  >
                    <div className="space-y-4">
                      <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
                        <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 block">
                          در صورت برقراری نشست به طور موفقیت‌آمیز، محصول باید قادر به نمایش آخرین تلاش موفق برای ایجاد نشست بر اساس موارد زیر باشد.
                        </span>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-xs font-black text-emerald-900 dark:text-emerald-300 border-b pb-2">
                          پارامترها و موارد نمایشی آخرین تلاش موفق برای ایجاد نشست:
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.lastSuccessfulSessionNoticePolicy?.displayDate ?? true}
                              onChange={e => {
                                set("lastSuccessfulSessionNoticePolicy", {
                                  ...settings.lastSuccessfulSessionNoticePolicy,
                                  displayDate: e.target.checked
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-emerald-600 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                ۱. روز (تاریخ ورود موفق قبلی)
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                                نمایش تاریخ دقیق (روز/ماه/سال) آخرین نشست موفق ایجادشده.
                              </span>
                            </div>
                          </label>

                          <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.lastSuccessfulSessionNoticePolicy?.displayTime ?? true}
                              onChange={e => {
                                set("lastSuccessfulSessionNoticePolicy", {
                                  ...settings.lastSuccessfulSessionNoticePolicy,
                                  displayTime: e.target.checked
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-emerald-600 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                ۲. زمان (ساعت ورود موفق قبلی)
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                                نمایش زمان دقیق (ساعت:دقیقه:ثانیه) آخرین نشست موفق.
                              </span>
                            </div>
                          </label>

                          <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.lastSuccessfulSessionNoticePolicy?.displayOtherInfo ?? true}
                              onChange={e => {
                                set("lastSuccessfulSessionNoticePolicy", {
                                  ...settings.lastSuccessfulSessionNoticePolicy,
                                  displayOtherInfo: e.target.checked
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-emerald-600 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                ۳. سایر موارد (IP و مشخصات دستگاه)
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                                نمایش آدرس IP، سیستم‌عامل و مرورگر کلاینت در ورود موفق قبلی.
                              </span>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </AftaAccordionCard>

                  {/* ۳۲. 🌟 نمایش آخرین تلاش ناموفق و تعداد تلاش‌های ناموفق تا این نشست */}
                  <AftaAccordionCard
                    id="afta_last_failed_session_notice"
                    number="الزام افتا"
                    title="نمایش آخرین تلاش ناموفق برای ایجاد نشست و تعداد تلاش‌های ناموفق"
                    description="در صورت برقراری نشست به طور موفقیت‌آمیز، محصول باید قادر به نمایش آخرین تلاش ناموفق و تعداد تلاش‌های ناموفق تا این نشست باشد"
                    isOpen={!!openAftaSections["afta_last_failed_session_notice"]}
                    onToggle={toggleAftaSection}
                    icon={AlertTriangle}
                  >
                    <div className="space-y-4">
                      <div className="bg-amber-50 dark:bg-amber-950/30 p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/50">
                        <span className="text-xs font-bold text-amber-900 dark:text-amber-200 block">
                          در صورت برقراری نشست به طور موفقیت‌آمیز، محصول باید قادر به نمایش آخرین تلاش ناموفق برای ایجاد نشست بر اساس موارد زیر و تعداد تلاش‌های ناموفق تا آخرین نشست موفقیت‌آمیز باشد.
                        </span>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-xs font-black text-amber-900 dark:text-amber-300 border-b pb-2">
                          پارامترها و موارد نمایشی آخرین تلاش ناموفق و شمارش خطاها:
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.lastFailedSessionNoticePolicy?.displayDate ?? true}
                              onChange={e => {
                                set("lastFailedSessionNoticePolicy", {
                                  ...settings.lastFailedSessionNoticePolicy,
                                  displayDate: e.target.checked
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-amber-600 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                ۱. روز (تاریخ آخرین تلاش ناموفق)
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                                نمایش تاریخ روز آخرین تلاش ناموفق ثبت‌شده برای ورود.
                              </span>
                            </div>
                          </label>

                          <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.lastFailedSessionNoticePolicy?.displayTime ?? true}
                              onChange={e => {
                                set("lastFailedSessionNoticePolicy", {
                                  ...settings.lastFailedSessionNoticePolicy,
                                  displayTime: e.target.checked
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-amber-600 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                ۲. زمان (ساعت آخرین تلاش ناموفق)
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                                نمایش زمان دقیق (ساعت:دقیقه:ثانیه) آخرین تلاش ناموفق.
                              </span>
                            </div>
                          </label>

                          <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.lastFailedSessionNoticePolicy?.displayOtherInfo ?? true}
                              onChange={e => {
                                set("lastFailedSessionNoticePolicy", {
                                  ...settings.lastFailedSessionNoticePolicy,
                                  displayOtherInfo: e.target.checked
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-amber-600 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                ۳. سایر موارد (آدرس IP و علت خطای ورود)
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                                نمایش IP مبدأ، سیستم‌عامل و دلیل عدم موفقیت تلاش قبلی.
                              </span>
                            </div>
                          </label>

                          <label className="p-3.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.lastFailedSessionNoticePolicy?.displayFailedAttemptsCount ?? true}
                              onChange={e => {
                                set("lastFailedSessionNoticePolicy", {
                                  ...settings.lastFailedSessionNoticePolicy,
                                  displayFailedAttemptsCount: e.target.checked
                                });
                              }}
                              className="h-4 w-4 rounded border-amber-400 text-amber-600 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-black text-amber-900 dark:text-amber-200 block">
                                ۴. نمایش تعداد تلاش‌های ناموفق تا آخرین نشست موفقیت‌آمیز
                              </span>
                              <span className="text-[11px] text-amber-800 dark:text-amber-300 block mt-0.5 leading-relaxed">
                                استخراج و نمایش شمارش دقیق تعداد دفعات تلاش ناموفق صورت‌گرفته تا قبل از این ورود موفق.
                              </span>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </AftaAccordionCard>

                  {/* ۳۳. 🌟 عدم پاک‌سازی سوابق دسترسی از واسط کاربر بدون بازدید کاربر */}
                  <AftaAccordionCard
                    id="afta_preserve_access_records"
                    number="الزام افتا"
                    title="عدم پاک‌سازی اطلاعات سوابق دسترسی از واسط کاربر بدون بازدید کاربر"
                    description="محصول نباید اطلاعات سوابق دسترسی را بدون بازدید کاربر، از واسط کاربر پاک نماید"
                    isOpen={!!openAftaSections["afta_preserve_access_records"]}
                    onToggle={toggleAftaSection}
                    icon={Lock}
                  >
                    <div className="space-y-4">
                      <div className="bg-blue-50 dark:bg-blue-950/30 p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/50">
                        <span className="text-xs font-bold text-blue-900 dark:text-blue-200 block">
                          محصول نباید اطلاعات سوابق دسترسی را بدون بازدید کاربر، از واسط کاربر پاک نماید.
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.preserveAccessRecordsPolicy?.preventAutoClearWithoutUserView ?? true}
                            onChange={e => {
                              set("preserveAccessRecordsPolicy", {
                                ...settings.preserveAccessRecordsPolicy,
                                preventAutoClearWithoutUserView: e.target.checked
                              });
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 mt-0.5"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                              ۱. ممانعت از پاک‌سازی خودکار سوابق دسترسی در UI بدون بازدید کاربر
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                              جلوگیری از انقضای تایمری یا حذف پیش‌فرض اعلانات و سوابق دسترسی قبل از نمایش به کاربر.
                            </span>
                          </div>
                        </label>

                        <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.preserveAccessRecordsPolicy?.requireExplicitUserDismissal ?? true}
                            onChange={e => {
                              set("preserveAccessRecordsPolicy", {
                                ...settings.preserveAccessRecordsPolicy,
                                requireExplicitUserDismissal: e.target.checked
                              });
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 mt-0.5"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                              ۲. الزام تایید و بسته شدن صریح توسط کاربر (Explicit Dismissal)
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                              باقی ماندن پنجره و گزارش سوابق دسترسی تا زمانی که کاربر صراحتاً دکمه «مشاهده شد و تأیید» را فشارد دهد.
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </AftaAccordionCard>

                  {/* ۳۴. 🌟 ممانعت از ایجاد نشست بر اساس پارامترهایی از قبیل مکان، پورت، روز و زمان */}
                  <AftaAccordionCard
                    id="afta_session_establishment_prevention"
                    number="الزام افتا"
                    title="ممانعت از ایجاد نشست بر اساس پارامترهای مشخص"
                    description="محصول باید توانایی ممانعت از ایجاد نشست بر اساس پارامترهایی (مکان، شماره پورت، روز، زمان و سایر موارد) را داشته باشد"
                    isOpen={!!openAftaSections["afta_session_establishment_prevention"]}
                    onToggle={toggleAftaSection}
                    icon={ShieldAlert}
                  >
                    <div className="space-y-4">
                      <div className="bg-rose-50 dark:bg-rose-950/30 p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/50">
                        <span className="text-xs font-bold text-rose-900 dark:text-rose-200 block">
                          محصول باید توانایی ممانعت از ایجاد نشست بر اساس پارامترهایی را داشته باشد.
                        </span>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-xs font-black text-rose-900 dark:text-rose-300 border-b pb-2">
                          پارامترهای موجود برای جلوگیری از نشست:
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.sessionEstablishmentPreventionPolicy?.preventByLocation ?? true}
                              onChange={e => {
                                set("sessionEstablishmentPreventionPolicy", {
                                  ...settings.sessionEstablishmentPreventionPolicy,
                                  preventByLocation: e.target.checked
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-rose-600 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                ۱. مکان (Location / Geo-IP)
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                                ممانعت از ایجاد نشست بر اساس موقعیت مکانی، محدوده جغرافیایی و آدرس شبکه کلاینت.
                              </span>
                            </div>
                          </label>

                          <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.sessionEstablishmentPreventionPolicy?.preventByPort ?? true}
                              onChange={e => {
                                set("sessionEstablishmentPreventionPolicy", {
                                  ...settings.sessionEstablishmentPreventionPolicy,
                                  preventByPort: e.target.checked
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-rose-600 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                ۲. شماره پورت (Port Number)
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                                جلوگیری از برقراری نشست در صورت استفاده از پورت‌های غیرمجاز یا ناامن شبکه.
                              </span>
                            </div>
                          </label>

                          <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.sessionEstablishmentPreventionPolicy?.preventByDay ?? true}
                              onChange={e => {
                                set("sessionEstablishmentPreventionPolicy", {
                                  ...settings.sessionEstablishmentPreventionPolicy,
                                  preventByDay: e.target.checked
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-rose-600 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                ۳. روز (Days of Week)
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                                ممانعت از ایجاد نشست در روزهای غیرمجاز هفته یا ایام تعطیلات رسمی.
                              </span>
                            </div>
                          </label>

                          <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.sessionEstablishmentPreventionPolicy?.preventByTime ?? true}
                              onChange={e => {
                                set("sessionEstablishmentPreventionPolicy", {
                                  ...settings.sessionEstablishmentPreventionPolicy,
                                  preventByTime: e.target.checked
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-rose-600 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                ۴. زمان (Allowed Time Windows)
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                                ممانعت از ورود در ساعات غیرمجاز شبانه‌روز (خارج از ساعات اداری تعیین‌شده).
                              </span>
                            </div>
                          </label>

                          <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer lg:col-span-2">
                            <input
                              type="checkbox"
                              checked={settings.sessionEstablishmentPreventionPolicy?.preventByOtherParams ?? true}
                              onChange={e => {
                                set("sessionEstablishmentPreventionPolicy", {
                                  ...settings.sessionEstablishmentPreventionPolicy,
                                  preventByOtherParams: e.target.checked
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-rose-600 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                ۵. سایر موارد (IP، سقف نشست‌های همزمان و ناهنجاری‌های امنیتی)
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                                ممانعت بر اساس عبور از سقف مجاز نشست‌ها، تعلیق حساب، ناهنجاری IP و تغییر غیرمعمول کلاینت.
                              </span>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </AftaAccordionCard>

                  {/* ۳۵. 🌟 فراهم‌سازی مسیر ارتباطی امن و متمایز منطقی (پروتکل‌های مورد اعتماد) */}
                  <AftaAccordionCard
                    id="afta_trusted_channel_protocols"
                    number="الزام افتا"
                    title="فراهم‌سازی مسیر ارتباطی امن و متمایز منطقی"
                    description="محصول باید قادر باشد مسیر ارتباطی امنی بین خود، کاربران و دیگر محصولات IT فراهم نماید تا از تغییر و افشای داده تبادلی حفاظت نماید"
                    isOpen={!!openAftaSections["afta_trusted_channel_protocols"]}
                    onToggle={toggleAftaSection}
                    icon={ShieldCheck}
                  >
                    <div className="space-y-4">
                      <div className="bg-indigo-50 dark:bg-indigo-950/30 p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900/50">
                        <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 block">
                          محصول باید قادر باشد مسیر ارتباطی امنی بین خود، کاربران و دیگر محصولات IT فراهم نماید که به طور منطقی از دیگر کانال‌ها متمایز باشد. سپس از طریق این کانال احراز هویت را انجام دهد و از تغییر و افشای داده تبادلی حفاظت نماید و تغییرات را تشخیص دهد.
                        </span>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-xs font-black text-indigo-900 dark:text-indigo-300 border-b pb-2">
                          پروتوکل‌های مورد استفاده برای ایجاد کانال امن:
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.trustedChannelPolicy?.protocols?.https ?? true}
                              onChange={e => {
                                set("trustedChannelPolicy", {
                                  ...settings.trustedChannelPolicy,
                                  protocols: {
                                    ...settings.trustedChannelPolicy?.protocols,
                                    https: e.target.checked
                                  }
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-indigo-600 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                ۱. HTTPS (پروتکل انتقال امن ابرمتن)
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                                استفاده از HTTPS برای ارتباطات واسط کاربری و سرویس‌های وب.
                              </span>
                            </div>
                          </label>

                          <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.trustedChannelPolicy?.protocols?.tls ?? true}
                              onChange={e => {
                                set("trustedChannelPolicy", {
                                  ...settings.trustedChannelPolicy,
                                  protocols: {
                                    ...settings.trustedChannelPolicy?.protocols,
                                    tls: e.target.checked
                                  }
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-indigo-600 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                ۲. TLS (پروتکل امنیت لایه انتقال)
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                                برقراری رمزنگاری لایه انتقال در تبادلات داده بین اجزا و موجودیت‌های IT.
                              </span>
                            </div>
                          </label>

                          <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.trustedChannelPolicy?.protocols?.ssh ?? true}
                              onChange={e => {
                                set("trustedChannelPolicy", {
                                  ...settings.trustedChannelPolicy,
                                  protocols: {
                                    ...settings.trustedChannelPolicy?.protocols,
                                    ssh: e.target.checked
                                  }
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-indigo-600 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                ۳. SSH (پروتوکل پوسته امن)
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                                استفاده از SSH برای دسترسی‌های مدیریتی، سروری و انتقال امن فرمان‌ها.
                              </span>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </AftaAccordionCard>

                  {/* ۳۶. 🌟 مجوز آغاز ارتباطات راه‌دور صرفاً از طریق کانال امن */}
                  <AftaAccordionCard
                    id="afta_remote_connection_secure_channel"
                    number="الزام افتا"
                    title="مجوز آغاز ارتباطات راه‌دور صرفاً از طریق کانال امن"
                    description="محصول باید به کاربر یا دیگر محصولات IT معتبر اجازه دهد که ارتباطات راه‌دور را از طریق کانال امن آغاز کنند"
                    isOpen={!!openAftaSections["afta_remote_connection_secure_channel"]}
                    onToggle={toggleAftaSection}
                    icon={Lock}
                  >
                    <div className="space-y-4">
                      <div className="bg-cyan-50 dark:bg-cyan-950/30 p-3.5 rounded-xl border border-cyan-200 dark:border-cyan-900/50">
                        <span className="text-xs font-bold text-cyan-900 dark:text-cyan-200 block">
                          محصول باید به کاربر/دیگر محصول IT معتبر اجازه دهد که ارتباطات راه‌دور را از طریق کانال امن آغاز کنند.
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.trustedChannelPolicy?.allowRemoteConnectionOnlyViaSecureChannel ?? true}
                            onChange={e => {
                              set("trustedChannelPolicy", {
                                ...settings.trustedChannelPolicy,
                                allowRemoteConnectionOnlyViaSecureChannel: e.target.checked
                              });
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-cyan-600 mt-0.5"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                              ۱. برقراری و آغاز کلیه ارتباطات راه‌دور کلاینت‌ها و محصولات IT متصل فقط از طریق کانال امن
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                              ممانعت از ایجاد ارتباطات راه‌دور غیرایمن یا ناامن (پروتوکل‌های بدون رمزنگاری).
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </AftaAccordionCard>

                  {/* ۳۷. 🌟 الزام استفاده از کانال امن برای احراز هویت اولیه کاربر */}
                  <AftaAccordionCard
                    id="afta_initial_auth_secure_channel"
                    number="الزام افتا"
                    title="الزام استفاده از کانال امن برای احراز هویت اولیه کاربر"
                    description="محصول باید استفاده از کانال امن را برای احراز هویت اولیه کاربر الزامی نماید"
                    isOpen={!!openAftaSections["afta_initial_auth_secure_channel"]}
                    onToggle={toggleAftaSection}
                    icon={ShieldCheck}
                  >
                    <div className="space-y-4">
                      <div className="bg-violet-50 dark:bg-violet-950/30 p-3.5 rounded-xl border border-violet-200 dark:border-violet-900/50">
                        <span className="text-xs font-bold text-violet-900 dark:text-violet-200 block">
                          محصول باید استفاده از کانال امن را برای احراز هویت اولیه کاربر الزامی نماید.
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.trustedChannelPolicy?.requireSecureChannelForInitialAuth ?? true}
                            onChange={e => {
                              set("trustedChannelPolicy", {
                                ...settings.trustedChannelPolicy,
                                requireSecureChannelForInitialAuth: e.target.checked
                              });
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-violet-600 mt-0.5"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                              ۱. اجباری نمودن گذر از کانال ارتباطی رمزنگاری‌شده در زمان احراز هویت اولیه و ارسال اعتبارنامه‌ها
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                              مسدودسازی هرگونه ارسال نام‌کاربری و رمز عبور در پروتکل‌های متنی غیررمزنگاری‌شده.
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </AftaAccordionCard>

                  {/* ۳۸. 🌟 اجرای پروتکل HTTPS مطابق با RFC 2818 */}
                  <AftaAccordionCard
                    id="afta_https_rfc2818"
                    number="الزام افتا"
                    title="اجرای پروتکل HTTPS مطابق با RFC 2818"
                    description="محصول باید پروتکل HTTPS را مطابق با استاندارد RFC 2818 اجرا کند"
                    isOpen={!!openAftaSections["afta_https_rfc2818"]}
                    onToggle={toggleAftaSection}
                    icon={Globe}
                  >
                    <div className="space-y-4">
                      <div className="bg-sky-50 dark:bg-sky-950/30 p-3.5 rounded-xl border border-sky-200 dark:border-sky-900/50">
                        <span className="text-xs font-bold text-sky-900 dark:text-sky-200 block">
                          محصول باید پروتکل HTTPS را مطابق با RFC 2818 اجرا کند.
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.httpsProtocolPolicy?.rfc2818Compliance ?? true}
                            onChange={e => {
                              set("httpsProtocolPolicy", {
                                ...settings.httpsProtocolPolicy,
                                rfc2818Compliance: e.target.checked
                              });
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-sky-600 mt-0.5"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                              ۱. الزام رعایت مشخصات و استانداردهای HTTP over TLS مطابق با RFC 2818
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                              تطبیق کامل نحوه ارتباطات وب، انطباق دامنه و اعتبارسنجی لایه انتقال بر اساس ضوابط RFC 2818.
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </AftaAccordionCard>

                  {/* ۳۹. 🌟 اجرای پروتکل HTTPS با استفاده از TLS */}
                  <AftaAccordionCard
                    id="afta_https_via_tls"
                    number="الزام افتا"
                    title="اجرای پروتکل HTTPS با استفاده از TLS"
                    description="محصول باید پروتکل HTTPS را با استفاده از TLS اجرا کند"
                    isOpen={!!openAftaSections["afta_https_via_tls"]}
                    onToggle={toggleAftaSection}
                    icon={ShieldCheck}
                  >
                    <div className="space-y-4">
                      <div className="bg-teal-50 dark:bg-teal-950/30 p-3.5 rounded-xl border border-teal-200 dark:border-teal-900/50">
                        <span className="text-xs font-bold text-teal-900 dark:text-teal-200 block">
                          محصول باید پروتکل HTTPS را با استفاده از TLS اجرا کند.
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.httpsProtocolPolicy?.requireTlsForHttps ?? true}
                            onChange={e => {
                              set("httpsProtocolPolicy", {
                                ...settings.httpsProtocolPolicy,
                                requireTlsForHttps: e.target.checked
                              });
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-teal-600 mt-0.5"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                              ۱. الزام استفاده از پروتکل امنیتی TLS جهت برقراری و رمزنگاری ارتباطات HTTPS
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                              غیرفعال‌سازی پروتکل‌های قدیمی و ناامن (مانند SSLv2/SSLv3) و اجبار به الگوریتم‌های امن TLS.
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </AftaAccordionCard>

                  {/* ۴۰. 🌟 مواجهه با گواهی‌نامه نامعتبر در ارتباط با سایر محصولات IT */}
                  <AftaAccordionCard
                    id="afta_invalid_certificate_handling"
                    number="الزام افتا"
                    title="سیاست برخورد با گواهی‌نامه نامعتبر در ارتباط با سایر محصولات IT"
                    description="در صورتی که گواهی‌نامه ارائه شده از سمت دیگر محصولات IT (در هنگام برقراری ارتباط) نامعتبر باشد، محصول باید بر اساس ضوابط تعیین‌شده عمل نماید"
                    isOpen={!!openAftaSections["afta_invalid_certificate_handling"]}
                    onToggle={toggleAftaSection}
                    icon={AlertOctagon}
                  >
                    <div className="space-y-4">
                      <div className="bg-amber-50 dark:bg-amber-950/30 p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/50">
                        <span className="text-xs font-bold text-amber-900 dark:text-amber-200 block">
                          در صورتی که گواهی‌نامه ارائه شده از سمت دیگر محصولات IT (در هنگام برقراری ارتباط) نامعتبر باشد، محصول باید بر اساس موارد زیر عمل نماید.
                        </span>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-xs font-black text-amber-900 dark:text-amber-300 border-b pb-2">
                          تعیین رفتار محصول در صورت مواجهه با گواهی‌نامه نامعتبر:
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <label className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                            (settings.httpsProtocolPolicy?.invalidCertificateHandling ?? "disconnect") === "disconnect"
                              ? "border-amber-500 bg-amber-50/40 dark:bg-amber-950/30 ring-1 ring-amber-500"
                              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                          }`}>
                            <input
                              type="radio"
                              name="invalidCertificateHandling"
                              checked={(settings.httpsProtocolPolicy?.invalidCertificateHandling ?? "disconnect") === "disconnect"}
                              onChange={() => {
                                set("httpsProtocolPolicy", {
                                  ...settings.httpsProtocolPolicy,
                                  invalidCertificateHandling: "disconnect"
                                });
                              }}
                              className="h-4 w-4 text-amber-600 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                ۱. عدم برقراری اتصال (قطع ارتباط)
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                                مسدودسازی کامل و ممانعت از تبادل هرگونه داده در صورت عدم اعتبار گواهی‌نامه کلاینت/سرور مقابل.
                              </span>
                            </div>
                          </label>

                          <label className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                            settings.httpsProtocolPolicy?.invalidCertificateHandling === "promptForApproval"
                              ? "border-amber-500 bg-amber-50/40 dark:bg-amber-950/30 ring-1 ring-amber-500"
                              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                          }`}>
                            <input
                              type="radio"
                              name="invalidCertificateHandling"
                              checked={settings.httpsProtocolPolicy?.invalidCertificateHandling === "promptForApproval"}
                              onChange={() => {
                                set("httpsProtocolPolicy", {
                                  ...settings.httpsProtocolPolicy,
                                  invalidCertificateHandling: "promptForApproval"
                                });
                              }}
                              className="h-4 w-4 text-amber-600 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                ۲. برای برقراری اتصال درخواست مجوز کند
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                                توقف موقت و ارسال هشدار امنیتی به مدیر سیستم جهت بررسی و تایید/رد صریح مجوز برقراری اتصال.
                              </span>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </AftaAccordionCard>

                  {/* ۴۱. 🌟 پیاده‌سازی TLS 1.2 و رد سایر نسخه‌های TLS و SSL */}
                  <AftaAccordionCard
                    id="afta_tls12_enforcement"
                    number="الزام افتا"
                    title="پیاده‌سازی پروتکل TLS 1.2 و رد سایر نسخه‌های ناامن TLS و SSL"
                    description="محصول باید TLS 1.2 (RFC 5246) را پیاده‌سازی و دیگر نسخه‌های TLS و SSL را رد کند"
                    isOpen={!!openAftaSections["afta_tls12_enforcement"]}
                    onToggle={toggleAftaSection}
                    icon={Lock}
                  >
                    <div className="space-y-4">
                      <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
                        <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 block">
                          محصول باید TLS 1.2 (RFC 5246) را پیاده‌سازی و دیگر نسخه‌های TLS و SSL را رد کند.
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.tlsClientPolicy?.enforceTls12Only ?? true}
                            onChange={e => {
                              set("tlsClientPolicy", {
                                ...settings.tlsClientPolicy,
                                enforceTls12Only: e.target.checked
                              });
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-emerald-600 mt-0.5"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                              ۱. پیاده‌سازی و اجبار استاندارد TLS 1.2 (مطابق با RFC 5246) و مسدودسازی تمامی نسخه‌های قبلی TLS/SSL
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                              رد صریح هرگونه درخواست اتصال بر پایه SSLv2, SSLv3, TLS 1.0, TLS 1.1 جهت ارتقای امنیت لایه انتقال.
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </AftaAccordionCard>

                  {/* ۴۲. 🌟 پیکربندی و انتخاب مجموعه‌های رمز (Cipher Suites) در TLS Client */}
                  <AftaAccordionCard
                    id="afta_tls_cipher_suites"
                    number="الزام افتا"
                    title="پیکربندی مجموعه‌های رمز (Cipher Suites) پشتیبانی‌شده در TLS Client"
                    description="محصول باید TLS را با پشتیبانی از مجموعه‌های رمز استاندارد تعیین‌شده پیاده‌سازی نماید"
                    isOpen={!!openAftaSections["afta_tls_cipher_suites"]}
                    onToggle={toggleAftaSection}
                    icon={ShieldCheck}
                  >
                    <div className="space-y-4">
                      <div className="bg-blue-50 dark:bg-blue-950/30 p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/50">
                        <span className="text-xs font-bold text-blue-900 dark:text-blue-200 block">
                          محصول باید TLS را با پشتیبانی از مجموعه‌های رمز زیر پیاده‌سازی نماید:
                        </span>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-xs font-black text-blue-900 dark:text-blue-300 border-b pb-2">
                          مجموعه رمزهای مورد استفاده و پیاده‌سازی‌شده محصول (TLS Client Cipher Suites):
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {[
                            { key: "tls_aes_256_gcm_sha384", name: "TLS_AES_256_GCM_SHA384", hex: "0x1302", rfc: "RFC 8446" },
                            { key: "tls_aes_128_gcm_sha256", name: "TLS_AES_128_GCM_SHA256", hex: "0x1301", rfc: "RFC 8446" },
                            { key: "tls_dhe_rsa_with_aes_256_gcm_sha384", name: "TLS_DHE_RSA_WITH_AES_256_GCM_SHA384", hex: "0x009F", rfc: "RFC 5288" },
                            { key: "tls_dhe_rsa_with_aes_128_gcm_sha256", name: "TLS_DHE_RSA_WITH_AES_128_GCM_SHA256", hex: "0x009E", rfc: "RFC 5288" },
                            { key: "tls_ecdhe_rsa_with_aes_128_gcm_sha256", name: "TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256", hex: "0xC02F", rfc: "RFC 5289" },
                            { key: "tls_ecdhe_rsa_with_aes_256_gcm_sha384", name: "TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384", hex: "0xC030", rfc: "RFC 5289" },
                            { key: "tls_ecdhe_ecdsa_with_aes_256_gcm_sha384", name: "TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384", hex: "0xC02C", rfc: "RFC 5289" },
                            { key: "tls_ecdhe_ecdsa_with_aes_128_gcm_sha256", name: "TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256", hex: "0xC02B", rfc: "RFC 5289" },
                            { key: "tls_rsa_with_aes_256_gcm_sha384", name: "TLS_RSA_WITH_AES_256_GCM_SHA384", hex: "0x009D", rfc: "RFC 5288" },
                            { key: "tls_rsa_with_aes_128_gcm_sha256", name: "TLS_RSA_WITH_AES_128_GCM_SHA256", hex: "0x009C", rfc: "RFC 5288" },
                            { key: "tls_ecdh_ecdsa_with_aes_256_gcm_sha384", name: "TLS_ECDH_ECDSA_WITH_AES_256_GCM_SHA384", hex: "0xC02E", rfc: "RFC 5288" },
                            { key: "tls_ecdh_ecdsa_with_aes_128_gcm_sha256", name: "TLS_ECDH_ECDSA_WITH_AES_128_GCM_SHA256", hex: "0xC02D", rfc: "RFC 5289" },
                            { key: "tls_ecdh_rsa_with_aes_256_gcm_sha384", name: "TLS_ECDH_RSA_WITH_AES_256_GCM_SHA384", hex: "0xC032", rfc: "RFC 5289" },
                            { key: "tls_ecdh_rsa_with_aes_128_gcm_sha256", name: "TLS_ECDH_RSA_WITH_AES_128_GCM_SHA256", hex: "0xC031", rfc: "RFC 5289" },
                            { key: "tls_dh_rsa_with_aes_256_gcm_sha384", name: "TLS_DH_RSA_WITH_AES_256_GCM_SHA384", hex: "0x00A1", rfc: "RFC 5288" },
                            { key: "tls_dh_rsa_with_aes_128_gcm_sha256", name: "TLS_DH_RSA_WITH_AES_128_GCM_SHA256", hex: "0x00A0", rfc: "RFC 5288" },
                          ].map(item => (
                            <label key={item.key} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
                              <input
                                type="checkbox"
                                checked={settings.tlsClientPolicy?.cipherSuites?.[item.key] ?? true}
                                onChange={e => {
                                  set("tlsClientPolicy", {
                                    ...settings.tlsClientPolicy,
                                    cipherSuites: {
                                      ...settings.tlsClientPolicy?.cipherSuites,
                                      [item.key]: e.target.checked
                                    }
                                  });
                                }}
                                className="h-4 w-4 rounded border-slate-300 text-blue-600 mt-0.5"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 dir-ltr text-left">
                                  <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 truncate">
                                    {item.name}
                                  </span>
                                  <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                    {item.hex}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1 dir-rtl text-right">
                                  مطابق با {item.rfc}
                                </span>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </AftaAccordionCard>

                  {/* ۴۳. 🌟 مطابقت شناسه ارائه شده با شناسه مرجع مطابق بخش 6 از RFC 6125 */}
                  <AftaAccordionCard
                    id="afta_rfc6125_identity_validation"
                    number="الزام افتا"
                    title="تایید مطابقت شناسه ارائه‌شده با شناسه مرجع (مطابق با RFC 6125)"
                    description="محصول باید مطابقت شناسه ارائه شده با شناسه مرجع را با توجه به بخش 6 از RFC 6125، تأیید نماید"
                    isOpen={!!openAftaSections["afta_rfc6125_identity_validation"]}
                    onToggle={toggleAftaSection}
                    icon={CheckCircle2}
                  >
                    <div className="space-y-4">
                      <div className="bg-indigo-50 dark:bg-indigo-950/30 p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900/50">
                        <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 block">
                          محصول باید مطابقت شناسه ارائه شده با شناسه مرجع را با توجه به بخش 6 از RFC 6125، تأیید نماید.
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.tlsClientPolicy?.rfc6125IdentityValidation ?? true}
                            onChange={e => {
                              set("tlsClientPolicy", {
                                ...settings.tlsClientPolicy,
                                rfc6125IdentityValidation: e.target.checked
                              });
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 mt-0.5"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                              ۱. الزام اعتبارسنجی دقیق نام دامنه/شناسه مرجع کلاینت در گواهی‌نامه بر اساس قوانین RFC 6125 (Section 6)
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                              بررسی کامل انطباق Subject Alternative Name (SAN) و Common Name (CN) با سرویس‌دهنده مقصد جهت ممانعت از حملات MITM.
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </AftaAccordionCard>

                  {/* ۴۴. 🌟 رفتار سامانه هنگام مواجهه با گواهی‌نامه سرور غیرمعتبر */}
                  <AftaAccordionCard
                    id="afta_server_cert_validation"
                    number="الزام افتا"
                    title="الزام برقراری کانال امن صرفاً با گواهی‌نامه سرور معتبر و تعیین رفتار در صورت عدم اعتبار"
                    description="محصول باید کانال امن را فقط در صورت معتبر بودن گواهی‌نامه سرور برقرار سازد؛ بنابراین اگر گواهی‌نامه سرور غیرمعتبر به نظر رسید، بر اساس ضوابط تعیین‌شده رفتار کند"
                    isOpen={!!openAftaSections["afta_server_cert_validation"]}
                    onToggle={toggleAftaSection}
                    icon={AlertOctagon}
                  >
                    <div className="space-y-4">
                      <div className="bg-rose-50 dark:bg-rose-950/30 p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/50">
                        <span className="text-xs font-bold text-rose-900 dark:text-rose-200 block">
                          محصول باید کانال امن را فقط در صورت معتبر بودن گواهی‌نامه سرور برقرار سازد؛ بنابراین اگر گواهی‌نامه سرور غیرمعتبر به نظر رسید، محصول باید بر اساس موارد زیر رفتار نماید.
                        </span>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-xs font-black text-rose-900 dark:text-rose-300 border-b pb-2">
                          اقدام سامانه در صورت غیرمعتبر بودن گواهی‌نامه سرور:
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <label className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                            (settings.tlsClientPolicy?.serverCertificateValidation?.invalidCertAction ?? "disconnect") === "disconnect"
                              ? "border-rose-500 bg-rose-50/40 dark:bg-rose-950/30 ring-1 ring-rose-500"
                              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                          }`}>
                            <input
                              type="radio"
                              name="serverInvalidCertAction"
                              checked={(settings.tlsClientPolicy?.serverCertificateValidation?.invalidCertAction ?? "disconnect") === "disconnect"}
                              onChange={() => {
                                set("tlsClientPolicy", {
                                  ...settings.tlsClientPolicy,
                                  serverCertificateValidation: {
                                    ...settings.tlsClientPolicy?.serverCertificateValidation,
                                    invalidCertAction: "disconnect"
                                  }
                                });
                              }}
                              className="h-4 w-4 text-rose-600 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                ۱. ارتباط را برقرار نکند
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                                قطع فوری اتصال و مسدودسازی کامل هرگونه ارتباط با سرور دارای گواهی‌نامه غیرمعتبر.
                              </span>
                            </div>
                          </label>

                          <label className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                            settings.tlsClientPolicy?.serverCertificateValidation?.invalidCertAction === "promptForApproval"
                              ? "border-rose-500 bg-rose-50/40 dark:bg-rose-950/30 ring-1 ring-rose-500"
                              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                          }`}>
                            <input
                              type="radio"
                              name="serverInvalidCertAction"
                              checked={settings.tlsClientPolicy?.serverCertificateValidation?.invalidCertAction === "promptForApproval"}
                              onChange={() => {
                                set("tlsClientPolicy", {
                                  ...settings.tlsClientPolicy,
                                  serverCertificateValidation: {
                                    ...settings.tlsClientPolicy?.serverCertificateValidation,
                                    invalidCertAction: "promptForApproval"
                                  }
                                });
                              }}
                              className="h-4 w-4 text-rose-600 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                ۲. برای برقراری ارتباط درخواست مجوز کند
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                                توقف برقراری اتصال و درخواست تایید رسمی/مجوز صریح از راهبر سیستم.
                              </span>
                            </div>
                          </label>

                          <label className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                            settings.tlsClientPolicy?.serverCertificateValidation?.invalidCertAction === "otherActions"
                              ? "border-rose-500 bg-rose-50/40 dark:bg-rose-950/30 ring-1 ring-rose-500"
                              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                          }`}>
                            <input
                              type="radio"
                              name="serverInvalidCertAction"
                              checked={settings.tlsClientPolicy?.serverCertificateValidation?.invalidCertAction === "otherActions"}
                              onChange={() => {
                                set("tlsClientPolicy", {
                                  ...settings.tlsClientPolicy,
                                  serverCertificateValidation: {
                                    ...settings.tlsClientPolicy?.serverCertificateValidation,
                                    invalidCertAction: "otherActions"
                                  }
                                });
                              }}
                              className="h-4 w-4 text-rose-600 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                ۳. سایر موارد
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                                ثبت دقیق لاگ رویداد امنیتی، اعلان هوشمند و اتخاذ اقدام مکمّل سفارشی.
                              </span>
                            </div>
                          </label>
                        </div>

                        {settings.tlsClientPolicy?.serverCertificateValidation?.invalidCertAction === "otherActions" && (
                          <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                              شرح و تنظیمات اقدامات جایگزین (سایر موارد):
                            </Label>
                            <Input
                              type="text"
                              value={settings.tlsClientPolicy?.serverCertificateValidation?.otherActionText || ""}
                              onChange={e => {
                                set("tlsClientPolicy", {
                                  ...settings.tlsClientPolicy,
                                  serverCertificateValidation: {
                                    ...settings.tlsClientPolicy?.serverCertificateValidation,
                                    otherActionText: e.target.value
                                  }
                                });
                              }}
                              placeholder="مثال: ارسال پیامک به مدیر امنیت، ثبت رویداد در SIEM و تعلیق موقت کانال..."
                              className="text-xs h-9"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </AftaAccordionCard>

                  {/* ۴۵. 🌟 ضوابط استفاده از خم‌های بیضوی در پیام ClientHello */}
                  <AftaAccordionCard
                    id="afta_client_hello_elliptic_curves"
                    number="الزام افتا"
                    title="تعیین ضوابط استفاده از خم‌های بیضوی (Elliptic Curves) در پیام ClientHello"
                    description="محصول باید در پیام ClientHello برای استفاده از خم‌های بیضوی، بر اساس الزامات افتا عمل نماید"
                    isOpen={!!openAftaSections["afta_client_hello_elliptic_curves"]}
                    onToggle={toggleAftaSection}
                    icon={ShieldAlert}
                  >
                    <div className="space-y-4">
                      <div className="bg-purple-50 dark:bg-purple-950/30 p-3.5 rounded-xl border border-purple-200 dark:border-purple-900/50">
                        <span className="text-xs font-bold text-purple-900 dark:text-purple-200 block">
                          محصول باید در پیام ClientHello برای استفاده از خم‌های بیضوی، بر اساس موارد زیر عمل نماید.
                        </span>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-xs font-black text-purple-900 dark:text-purple-300 border-b pb-2">
                          تنظیم نحوه ارائه افزونه Supported Elliptic Curves Extension:
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <label className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                            settings.tlsClientPolicy?.clientHelloEllipticCurves?.mode === "noExtension"
                              ? "border-purple-500 bg-purple-50/40 dark:bg-purple-950/30 ring-1 ring-purple-500"
                              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                          }`}>
                            <input
                              type="radio"
                              name="ellipticCurvesMode"
                              checked={settings.tlsClientPolicy?.clientHelloEllipticCurves?.mode === "noExtension"}
                              onChange={() => {
                                set("tlsClientPolicy", {
                                  ...settings.tlsClientPolicy,
                                  clientHelloEllipticCurves: {
                                    ...settings.tlsClientPolicy?.clientHelloEllipticCurves,
                                    mode: "noExtension"
                                  }
                                });
                              }}
                              className="h-4 w-4 text-purple-600 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                ۱. ارائه نكردن Supported Elliptic Curves Extension
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                                در صورتی که محصول از خم‌های بیضوی استفاده می‌نماید، این افزونه ارائه نشود.
                              </span>
                            </div>
                          </label>

                          <label className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                            (settings.tlsClientPolicy?.clientHelloEllipticCurves?.mode ?? "nistCurves") === "nistCurves"
                              ? "border-purple-500 bg-purple-50/40 dark:bg-purple-950/30 ring-1 ring-purple-500"
                              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                          }`}>
                            <input
                              type="radio"
                              name="ellipticCurvesMode"
                              checked={(settings.tlsClientPolicy?.clientHelloEllipticCurves?.mode ?? "nistCurves") === "nistCurves"}
                              onChange={() => {
                                set("tlsClientPolicy", {
                                  ...settings.tlsClientPolicy,
                                  clientHelloEllipticCurves: {
                                    ...settings.tlsClientPolicy?.clientHelloEllipticCurves,
                                    mode: "nistCurves"
                                  }
                                });
                              }}
                              className="h-4 w-4 text-purple-600 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                ۲. ارائه Supported Elliptic Curves Extension به همراه NIST Curves
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                                نوع خم به همراه خم‌های استاندارد secp256r1 یا secp384r1 یا secp521r1 ارائه گردد.
                              </span>
                            </div>
                          </label>
                        </div>

                        {(settings.tlsClientPolicy?.clientHelloEllipticCurves?.mode ?? "nistCurves") === "nistCurves" && (
                          <div className="mt-3 p-3.5 bg-purple-50/50 dark:bg-purple-950/20 rounded-xl border border-purple-200 dark:border-purple-900/40">
                            <span className="text-xs font-bold text-purple-900 dark:text-purple-300 block mb-2.5">
                              انتخاب خم‌های بیضوی مجاز (NIST Curves):
                            </span>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                              {[
                                { key: "secp256r1", name: "secp256r1 (NIST P-256)", desc: "خم ۲۵۶ بیتی استاندارد" },
                                { key: "secp384r1", name: "secp384r1 (NIST P-384)", desc: "خم ۳۸۴ بیتی با امنیت بالا" },
                                { key: "secp521r1", name: "secp521r1 (NIST P-521)", desc: "خم ۵۲۱ بیتی فوق امن" },
                              ].map(curve => (
                                <label key={curve.key} className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={settings.tlsClientPolicy?.clientHelloEllipticCurves?.curves?.[curve.key] ?? true}
                                    onChange={e => {
                                      set("tlsClientPolicy", {
                                        ...settings.tlsClientPolicy,
                                        clientHelloEllipticCurves: {
                                          ...settings.tlsClientPolicy?.clientHelloEllipticCurves,
                                          curves: {
                                            ...settings.tlsClientPolicy?.clientHelloEllipticCurves?.curves,
                                            [curve.key]: e.target.checked
                                          }
                                        }
                                      });
                                    }}
                                    className="h-4 w-4 rounded border-slate-300 text-purple-600"
                                  />
                                  <div>
                                    <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 block">
                                      {curve.name}
                                    </span>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                                      {curve.desc}
                                    </span>
                                  </div>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </AftaAccordionCard>

                  {/* ۴۶. 🌟 پیاده‌سازی و پیکربندی پروتکل TLS Server (الزامات ۱، ۲ و ۳ افتا) */}
                  <AftaAccordionCard
                    id="afta_tls_server_protocol"
                    number="الزام افتا (۳-۳)"
                    title="پروتکل TLS Server، اجبار TLS 1.2، رد نسخه‌های ناامن و پارامترهای ساخت کلید"
                    description="الزامات ۱، ۲ و ۳ از رده ۳-۳ افتا: پیاده‌سازی TLS 1.2، رد اتصالات SSL/TLS ناامن، تعیین مجموعه‌های رمز و پارامترهای ساخت کلید (RSA/ECDH/DH)"
                    isOpen={!!openAftaSections["afta_tls_server_protocol"]}
                    onToggle={toggleAftaSection}
                    icon={ShieldCheck}
                  >
                    <div className="space-y-5">
                      {/* 🟢 بخش ۱: الزام ۱ افتا - پیاده‌سازی TLS 1.2 (RFC 5246) و انتخاب مجموعه‌های رمز */}
                      <div className="space-y-3">
                        <div className="bg-teal-50 dark:bg-teal-950/30 p-3.5 rounded-xl border border-teal-200 dark:border-teal-900/50">
                          <span className="text-xs font-bold text-teal-900 dark:text-teal-200 block">
                            بند ۱) محصول باید TLS (RFC 5246 TLS 1.2) را پیاده‌سازی کند. همچنین محصول باید TLS را با پشتیبانی از مجموعه‌های رمز زیر پیاده‌سازی نماید:
                          </span>
                        </div>

                        <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.tlsServerPolicy?.enforceTls12Only ?? true}
                            onChange={e => {
                              set("tlsServerPolicy", {
                                ...settings.tlsServerPolicy,
                                enforceTls12Only: e.target.checked
                              });
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-teal-600 mt-0.5"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                              ۱. پیاده‌سازی و اجبار استاندارد TLS 1.2 (مطابق با RFC 5246) در سمت TLS Server
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                              پشتیبانی کامل از ساختار دست‌تکانی و رمزنگاری RFC 5246 TLS 1.2 در سرویس‌دهی سرور سامانه.
                            </span>
                          </div>
                        </label>

                        <h4 className="text-xs font-black text-teal-900 dark:text-teal-300 border-b pb-2 pt-2">
                          مجموعه رمز مورد استفاده و پیاده‌سازی شده محصول، انتخاب گردد (۱۶ مجموعه رمز استاندارد):
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {[
                            { key: "tls_aes_256_gcm_sha384", name: "TLS_AES_256_GCM_SHA384", hex: "0x1302", rfc: "RFC 8446" },
                            { key: "tls_aes_128_gcm_sha256", name: "TLS_AES_128_GCM_SHA256", hex: "0x1301", rfc: "RFC 8446" },
                            { key: "tls_dhe_rsa_with_aes_256_gcm_sha384", name: "TLS_DHE_RSA_WITH_AES_256_GCM_SHA384", hex: "0x009F", rfc: "RFC 5288" },
                            { key: "tls_dhe_rsa_with_aes_128_gcm_sha256", name: "TLS_DHE_RSA_WITH_AES_128_GCM_SHA256", hex: "0x009E", rfc: "RFC 5288" },
                            { key: "tls_ecdhe_rsa_with_aes_128_gcm_sha256", name: "TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256", hex: "0xC02F", rfc: "RFC 5289" },
                            { key: "tls_ecdhe_rsa_with_aes_256_gcm_sha384", name: "TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384", hex: "0xC030", rfc: "RFC 5289" },
                            { key: "tls_ecdhe_ecdsa_with_aes_256_gcm_sha384", name: "TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384", hex: "0xC02C", rfc: "RFC 5289" },
                            { key: "tls_ecdhe_ecdsa_with_aes_128_gcm_sha256", name: "TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256", hex: "0xC02B", rfc: "RFC 5289" },
                            { key: "tls_rsa_with_aes_256_gcm_sha384", name: "TLS_RSA_WITH_AES_256_GCM_SHA384", hex: "0x009D", rfc: "RFC 5288" },
                            { key: "tls_rsa_with_aes_128_gcm_sha256", name: "TLS_RSA_WITH_AES_128_GCM_SHA256", hex: "0x009C", rfc: "RFC 5288" },
                            { key: "tls_ecdh_ecdsa_with_aes_256_gcm_sha384", name: "TLS_ECDH_ECDSA_WITH_AES_256_GCM_SHA384", hex: "0xC02E", rfc: "RFC 5288" },
                            { key: "tls_ecdh_ecdsa_with_aes_128_gcm_sha256", name: "TLS_ECDH_ECDSA_WITH_AES_128_GCM_SHA256", hex: "0xC02D", rfc: "RFC 5289" },
                            { key: "tls_ecdh_rsa_with_aes_256_gcm_sha384", name: "TLS_ECDH_RSA_WITH_AES_256_GCM_SHA384", hex: "0xC032", rfc: "RFC 5289" },
                            { key: "tls_ecdh_rsa_with_aes_128_gcm_sha256", name: "TLS_ECDH_RSA_WITH_AES_128_GCM_SHA256", hex: "0xC031", rfc: "RFC 5289" },
                            { key: "tls_dh_rsa_with_aes_256_gcm_sha384", name: "TLS_DH_RSA_WITH_AES_256_GCM_SHA384", hex: "0x00A1", rfc: "RFC 5288" },
                            { key: "tls_dh_rsa_with_aes_128_gcm_sha256", name: "TLS_DH_RSA_WITH_AES_128_GCM_SHA256", hex: "0x00A0", rfc: "RFC 5288" },
                          ].map(item => (
                            <label key={item.key} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
                              <input
                                type="checkbox"
                                checked={settings.tlsServerPolicy?.cipherSuites?.[item.key] ?? true}
                                onChange={e => {
                                  set("tlsServerPolicy", {
                                    ...settings.tlsServerPolicy,
                                    cipherSuites: {
                                      ...settings.tlsServerPolicy?.cipherSuites,
                                      [item.key]: e.target.checked
                                    }
                                  });
                                }}
                                className="h-4 w-4 rounded border-slate-300 text-teal-600 mt-0.5"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 dir-ltr text-left">
                                  <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 truncate">
                                    {item.name}
                                  </span>
                                  <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-teal-600 dark:text-teal-400 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                    {item.hex}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1 dir-rtl text-right">
                                  مطابق با {item.rfc}
                                </span>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* 🔴 بخش ۲: الزام ۲ افتا - رد درخواست‌های اتصال ناامن SSL 1.0, SSL 2.0, SSL 3.0, TLS 1.0 و TLS 1.1 */}
                      <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                        <div className="bg-rose-50 dark:bg-rose-950/30 p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/50">
                          <span className="text-xs font-bold text-rose-900 dark:text-rose-200 block">
                            بند ۲) محصول باید اتصال‌های کاربرانی که درخواست SSL1.0، SSL2.0، SSL3.0، TLS1.0 و TLS1.1 دارند را رد نماید:
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {[
                            { key: "ssl10", label: "مسدودسازی و رد درخواست SSL 1.0" },
                            { key: "ssl20", label: "مسدودسازی و رد درخواست SSL 2.0" },
                            { key: "ssl30", label: "مسدودسازی و رد درخواست SSL 3.0" },
                            { key: "tls10", label: "مسدودسازی و رد درخواست TLS 1.0" },
                            { key: "tls11", label: "مسدودسازی و رد درخواست TLS 1.1" },
                          ].map(item => (
                            <label key={item.key} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={settings.tlsServerPolicy?.rejectLegacyProtocols?.[item.key] ?? true}
                                onChange={e => {
                                  set("tlsServerPolicy", {
                                    ...settings.tlsServerPolicy,
                                    rejectLegacyProtocols: {
                                      ...settings.tlsServerPolicy?.rejectLegacyProtocols,
                                      [item.key]: e.target.checked
                                    }
                                  });
                                }}
                                className="h-4 w-4 rounded border-slate-300 text-rose-600"
                              />
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                {item.label}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* 🔵 بخش ۳: الزام ۳ افتا - پارامترهای ساخت کلید (Key Generation Parameters) */}
                      <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                        <div className="bg-blue-50 dark:bg-blue-950/30 p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/50">
                          <span className="text-xs font-bold text-blue-900 dark:text-blue-200 block">
                            بند ۳) محصول باید پارامترهای ساخت کلید را بر اساس موارد زیر ایجاد نماید (طول کلید یا نوع خم مورد استفاده مشخص گردد):
                          </span>
                        </div>

                        {/* ۳-۱. کلید RSA */}
                        <div className="p-3.5 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                          <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                            ۱. استفاده از RSA با اندازه کلید ۲۰۴۸ یا ۳۰۷۲ یا ۴۰۹۶ بیت:
                          </span>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
                            {[
                              { key: "rsa2048", label: "RSA 2048-bit (حداقل طول استاندارد)" },
                              { key: "rsa3072", label: "RSA 3072-bit (امنیت بالا)" },
                              { key: "rsa4096", label: "RSA 4096-bit (فوق امن)" },
                            ].map(rsa => (
                              <label key={rsa.key} className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={settings.tlsServerPolicy?.keyExchangeParameters?.rsaKeySizes?.[rsa.key] ?? true}
                                  onChange={e => {
                                    set("tlsServerPolicy", {
                                      ...settings.tlsServerPolicy,
                                      keyExchangeParameters: {
                                        ...settings.tlsServerPolicy?.keyExchangeParameters,
                                        rsaKeySizes: {
                                          ...settings.tlsServerPolicy?.keyExchangeParameters?.rsaKeySizes,
                                          [rsa.key]: e.target.checked
                                        }
                                      }
                                    });
                                  }}
                                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                                />
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                  {rsa.label}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* ۳-۲. خم‌های بیضوی ECDH(E) */}
                        <div className="p-3.5 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                          <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                            ۲. پارامترهای (ECDH(E با استفاده از NIST Curveهای secp256r1 یا secp384r1 یا secp521r1 و هیچ مورد دیگر:
                          </span>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
                            {[
                              { key: "secp256r1", label: "secp256r1 (NIST P-256)" },
                              { key: "secp384r1", label: "secp384r1 (NIST P-384)" },
                              { key: "secp521r1", label: "secp521r1 (NIST P-521)" },
                            ].map(curve => (
                              <label key={curve.key} className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={settings.tlsServerPolicy?.keyExchangeParameters?.ecdhNistCurves?.[curve.key] ?? true}
                                  onChange={e => {
                                    set("tlsServerPolicy", {
                                      ...settings.tlsServerPolicy,
                                      keyExchangeParameters: {
                                        ...settings.tlsServerPolicy?.keyExchangeParameters,
                                        ecdhNistCurves: {
                                          ...settings.tlsServerPolicy?.keyExchangeParameters?.ecdhNistCurves,
                                          [curve.key]: e.target.checked
                                        }
                                      }
                                    });
                                  }}
                                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                                />
                                <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                                  {curve.label}
                                </span>
                              </label>
                            ))}
                          </div>
                          <label className="p-2.5 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 flex items-center gap-2.5 cursor-pointer mt-2">
                            <input
                              type="checkbox"
                              checked={settings.tlsServerPolicy?.keyExchangeParameters?.ecdhNistCurves?.disallowOtherCurves ?? true}
                              onChange={e => {
                                set("tlsServerPolicy", {
                                  ...settings.tlsServerPolicy,
                                  keyExchangeParameters: {
                                    ...settings.tlsServerPolicy?.keyExchangeParameters,
                                    ecdhNistCurves: {
                                      ...settings.tlsServerPolicy?.keyExchangeParameters?.ecdhNistCurves,
                                      disallowOtherCurves: e.target.checked
                                    }
                                  }
                                });
                              }}
                              className="h-4 w-4 rounded border-amber-400 text-amber-600"
                            />
                            <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                              ممانعت صریح از استفاده از هرگونه خم غیر استاندارد دیگر (به غیر از NIST Curves تاییدشده)
                            </span>
                          </label>
                        </div>

                        {/* ۳-۳. کلید دیفی-هلمن (DH) */}
                        <div className="p-3.5 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                          <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                            ۳. پارامترهای دیفی-هلمن (DH) با اندازه کلید ۲۰۴۸ یا ۳۰۷۲ بیت:
                          </span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                            {[
                              { key: "dh2048", label: "DH 2048-bit (پایه استاندارد)" },
                              { key: "dh3072", label: "DH 3072-bit (پیشرفته امن)" },
                            ].map(dh => (
                              <label key={dh.key} className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={settings.tlsServerPolicy?.keyExchangeParameters?.dhKeySizes?.[dh.key] ?? true}
                                  onChange={e => {
                                    set("tlsServerPolicy", {
                                      ...settings.tlsServerPolicy,
                                      keyExchangeParameters: {
                                        ...settings.tlsServerPolicy?.keyExchangeParameters,
                                        dhKeySizes: {
                                          ...settings.tlsServerPolicy?.keyExchangeParameters?.dhKeySizes,
                                          [dh.key]: e.target.checked
                                        }
                                      }
                                    });
                                  }}
                                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                                />
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                  {dh.label}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </AftaAccordionCard>

                  {/* ۴۷. 🌟 پروتکل TLS مشترک کلاینت و سرور (الزامات ۱ و ۲ افتا - رده ۳-۴) */}
                  <AftaAccordionCard
                    id="afta_mutual_tls_protocol"
                    number="الزام افتا (۳-۴)"
                    title="پروتکل TLS مشترک کلاینت و سرور (mTLS)، احراز هویت دوطرفه و مطابقت شناساننده"
                    description="پشتیبانی از احراز هویت دوطرفه با گواهی‌نامه‌های X509v3 و ممانعت از ایجاد کانال در صورت عدم مطابقت نام متمایز (Subject DN)"
                    isOpen={!!openAftaSections["afta_mutual_tls_protocol"]}
                    onToggle={toggleAftaSection}
                    icon={ShieldCheck}
                  >
                    <div className="space-y-4">
                      <div className="bg-indigo-50 dark:bg-indigo-950/30 p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900/50">
                        <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 block">
                          الزامات احراز هویت دوطرفه TLS کلاینت و سرور (mTLS) و اعتبارسنجی گواهی‌نامه‌های X509v3 (مطابق الزامات افتا - رده ۳-۴):
                        </span>
                      </div>

                      <div className="space-y-3">
                        <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.mutualTlsPolicy?.enableMutualAuthX509v3 ?? true}
                            onChange={e => {
                              set("mutualTlsPolicy", {
                                ...settings.mutualTlsPolicy,
                                enableMutualAuthX509v3: e.target.checked
                              });
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 mt-0.5"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                              ۱. پشتیبانی از احراز هویت دوطرفه کلاینت‌ها/سرورهای TLS با استفاده از گواهی‌نامه‌های X509v3
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                              برقراری احراز هویت متقابل کلاینت و سرور (Mutual Authentication / mTLS) بر پایه گواهی‌نامه‌های دیجیتال X.509v3.
                            </span>
                          </div>
                        </label>

                        <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.mutualTlsPolicy?.enforceSubjectIdentityMatching ?? true}
                            onChange={e => {
                              set("mutualTlsPolicy", {
                                ...settings.mutualTlsPolicy,
                                enforceSubjectIdentityMatching: e.target.checked
                              });
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 mt-0.5"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                              ۲. ممانعت از برقراری کانال امن در صورت عدم مطابقت نام متمایز (Subject DN) یا نام دیگر فاعل با شناساننده کلاینت مورد انتظار
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                              در صورت عدم تطابق نام متمایز موجود در گواهی‌نامه با شناسه کلاینت مورد انتظار، محصول نباید کانال امن را برقرار سازد.
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </AftaAccordionCard>

                  {/* ۴۸. 🌟 اعتبارسنجی گواهی‌نامه (الزامات ۱، ۲ و ۳ افتا - رده ۳-۵) */}
                  <AftaAccordionCard
                    id="afta_certificate_validation_policy"
                    number="الزام افتا (۳-۵)"
                    title="اعتبارسنجی گواهی‌نامه، پذیرش CA، احراز هویت X509v3، روش‌های فسخ و OIDهای extendedKeyUsage"
                    description="الزامات ۱، ۲ و ۳ از رده ۳-۵ افتا: قوانین مسیر، پذیرش CA فقط با basicConstraints، کارکردهای احراز هویت X509v3، بررسی فسخ (OCSP/CRL) و OIDهای EKU"
                    isOpen={!!openAftaSections["afta_certificate_validation_policy"]}
                    onToggle={toggleAftaSection}
                    icon={ShieldCheck}
                  >
                    <div className="space-y-5">
                      {/* 🔵 بخش ۱: الزام ۱ افتا - قوانین تأیید مسیر گواهی‌نامه (Certificate Path Validation Rules) */}
                      <div className="space-y-3">
                        <div className="bg-blue-50 dark:bg-blue-950/30 p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/50">
                          <span className="text-xs font-bold text-blue-900 dark:text-blue-200 block">
                            بند ۱) محصول باید گواهی‌نامه‌ها را بر اساس قوانین زیر (تأیید مسیر، مسدودسازی، فسخ و OIDها) تأیید کند:
                          </span>
                        </div>

                        <div className="grid grid-cols-1 gap-2.5">
                          <label className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.certificateValidationPolicy?.pathValidationRules?.rfc5280PathValidation ?? true}
                              onChange={e => {
                                set("certificateValidationPolicy", {
                                  ...settings.certificateValidationPolicy,
                                  pathValidationRules: {
                                    ...settings.certificateValidationPolicy?.pathValidationRules,
                                    rfc5280PathValidation: e.target.checked
                                  }
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                ۱-۱. تأیید گواهی‌نامه RFC 5280 و تأیید مسیر گواهی‌نامه که از حداقل طول مسیر ۲ گواهی‌نامه پشتیبانی می‌کند
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                                بررسی ساختار و اعتبار زنجیره گواهی‌نامه مطابق ضوابط RFC 5280.
                              </span>
                            </div>
                          </label>

                          <label className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.certificateValidationPolicy?.pathValidationRules?.endWithTrustedCA ?? true}
                              onChange={e => {
                                set("certificateValidationPolicy", {
                                  ...settings.certificateValidationPolicy,
                                  pathValidationRules: {
                                    ...settings.certificateValidationPolicy?.pathValidationRules,
                                    endWithTrustedCA: e.target.checked
                                  }
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                ۱-۲. مسیر گواهی‌نامه باید با یک گواهی‌نامه CA امن پایان یابد
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                                الزام انتها و تایید ریشه زنجیره توسط یک صادرکننده گواهی (CA) معتبر و تاییدشده.
                              </span>
                            </div>
                          </label>

                          <label className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.certificateValidationPolicy?.pathValidationRules?.requireBasicConstraintsCaTrue ?? true}
                              onChange={e => {
                                set("certificateValidationPolicy", {
                                  ...settings.certificateValidationPolicy,
                                  pathValidationRules: {
                                    ...settings.certificateValidationPolicy?.pathValidationRules,
                                    requireBasicConstraintsCaTrue: e.target.checked
                                  }
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                ۱-۳. اطمینان از وجود افزونه basicConstraints و تنظیم پرچم CA به حالت TRUE برای تمام گواهی‌نامه‌های CA
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                                حصول اطمینان از وجود افزونه basicConstraints و مقدار CA=TRUE در گواهی‌نامه‌های میانی و ریشه.
                              </span>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* 🔴 بخش ۲: الزام ۲ افتا - پذیرش گواهی‌نامه CA تنها با basicConstraints و پرچم CA=TRUE */}
                      <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                        <div className="bg-amber-50 dark:bg-amber-950/30 p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/50">
                          <span className="text-xs font-bold text-amber-900 dark:text-amber-200 block">
                            بند ۲) شرط پذیرش گواهی‌نامه به عنوان CA توسط محصول:
                          </span>
                        </div>

                        <label className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.certificateValidationPolicy?.strictCaAcceptanceOnlyWithBasicConstraints ?? true}
                            onChange={e => {
                              set("certificateValidationPolicy", {
                                ...settings.certificateValidationPolicy,
                                strictCaAcceptanceOnlyWithBasicConstraints: e.target.checked
                              });
                            }}
                            className="h-4 w-4 rounded border-amber-400 text-amber-600 mt-0.5"
                          />
                          <div>
                            <span className="text-xs font-bold text-amber-950 dark:text-amber-200 block">
                              محصول باید تنها در صورتی که افزونه مربوط به basicConstraints از پیش تنظیم شده باشد و همچنین، پرچم CA به حالت TRUE تنظیم شده باشد، یک گواهی‌نامه را به عنوان گواهی‌نامه CA بپذیرد.
                            </span>
                            <span className="text-[11px] text-amber-800 dark:text-amber-300 block mt-1 leading-relaxed">
                              جلوگیری از سوءاستفاده و پذیرش گواهی‌نامه‌های غیر مجاز فاقد پرچم صریح CA.
                            </span>
                          </div>
                        </label>
                      </div>

                      {/* 🟢 بخش ۳: الزام ۳ افتا - استفاده از گواهی‌نامه‌های X509v3 تعریف‌شده در RFC 5280 برای احراز هویت */}
                      <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                        <div className="bg-teal-50 dark:bg-teal-950/30 p-3.5 rounded-xl border border-teal-200 dark:border-teal-900/50">
                          <span className="text-xs font-bold text-teal-900 dark:text-teal-200 block">
                            بند ۳) محصول باید برای پشتیبانی از احراز هویت برای موارد زیر، از گواهی‌نامه‌های X509v3 تعریف‌شده در RFC 5280 استفاده کند:
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                          {[
                            { key: "https", label: "پشتیبانی از X509v3 در پروتکل HTTPS" },
                            { key: "tls", label: "پشتیبانی از X509v3 در کارکردهای TLS" },
                            { key: "ssh", label: "پشتیبانی از X509v3 در پروتکل SSH" },
                            { key: "codeSigningSoftwareUpdates", label: "امضای کد برای بروزرسانی‌های نرم‌افزار سیستم" },
                            { key: "codeSigningIntegrityVerification", label: "امضای کد برای تأیید یکپارچگی" },
                            { key: "otherUseCases", label: "سایر موارد و کارکردهای احراز هویت" },
                          ].map(scope => (
                            <label key={scope.key} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={settings.certificateValidationPolicy?.x509v3Rfc5280AuthenticationScopes?.[scope.key] ?? true}
                                onChange={e => {
                                  set("certificateValidationPolicy", {
                                    ...settings.certificateValidationPolicy,
                                    x509v3Rfc5280AuthenticationScopes: {
                                      ...settings.certificateValidationPolicy?.x509v3Rfc5280AuthenticationScopes,
                                      [scope.key]: e.target.checked
                                    }
                                  });
                                }}
                                className="h-4 w-4 rounded border-slate-300 text-teal-600"
                              />
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                {scope.label}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* 🟣 بخش ۴: روش‌های تأیید وضعیت فسخ گواهی‌نامه (Revocation Checking Methods) */}
                      <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                        <div className="bg-purple-50 dark:bg-purple-950/30 p-3.5 rounded-xl border border-purple-200 dark:border-purple-900/50">
                          <span className="text-xs font-bold text-purple-900 dark:text-purple-200 block">
                            بخش روش‌های تأیید وضعیت فسخ گواهی‌نامه (Revocation Checking Methods):
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {[
                            { key: "ocspRfc696", label: "پروتکل وضعیت آنلاین گواهی‌نامه (OCSP) مشخص‌شده در RFC 696" },
                            { key: "crlRfc5280Section63", label: "لیست فسخ گواهی‌نامه (CRL) مشخص‌شده در RFC 5280 بخش 6.3" },
                            { key: "crlRfc5759Section5", label: "لیست فسخ گواهی‌نامه (CRL) مشخص‌شده در RFC 5759 بخش 5" },
                            { key: "disallowOtherRevocationMethods", label: "عدم استفاده از هیچ روش فسخ غیرمجاز دیگری" },
                          ].map(method => (
                            <label key={method.key} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={settings.certificateValidationPolicy?.revocationCheckingMethods?.[method.key] ?? true}
                                onChange={e => {
                                  set("certificateValidationPolicy", {
                                    ...settings.certificateValidationPolicy,
                                    revocationCheckingMethods: {
                                      ...settings.certificateValidationPolicy?.revocationCheckingMethods,
                                      [method.key]: e.target.checked
                                    }
                                  });
                                }}
                                className="h-4 w-4 rounded border-slate-300 text-purple-600"
                              />
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                {method.label}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* 🟢 بخش ۵: قوانین تأیید بخش extendedKeyUsage (EKU OID Validation) */}
                      <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                        <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
                          <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 block">
                            بخش قوانین تأیید بخش extendedKeyUsage (مطابق با OIDهای استاندارد):
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {[
                            {
                              key: "codeSigningOid",
                              title: "گواهی‌نامه‌های بروزرسانی و صحت کدهای اجرایی",
                              purpose: "Code Signing (id-kp3)",
                              oid: "1.3.6.1.5.5.7.3.3",
                              desc: "باید دارای شناسه OID 1.3.6.1.5.5.7.3.3 در بخش extendedKeyUsage باشند."
                            },
                            {
                              key: "serverAuthOid",
                              title: "گواهی‌نامه‌های سرور ارائه شده برای TLS",
                              purpose: "Server Authentication (id-kp1)",
                              oid: "1.3.6.1.5.5.7.3.1",
                              desc: "باید دارای شناسه OID 1.3.6.1.5.5.7.3.1 در بخش extendedKeyUsage باشند."
                            },
                            {
                              key: "clientAuthOid",
                              title: "گواهی‌نامه‌های کلاینت ارائه شده برای TLS",
                              purpose: "Client Authentication (id-kp2)",
                              oid: "1.3.6.1.5.5.7.3.2",
                              desc: "باید دارای شناسه OID 1.3.6.1.5.5.7.3.2 در بخش extendedKeyUsage باشند."
                            },
                            {
                              key: "ocspSigningOid",
                              title: "گواهی‌نامه‌های پاسخ‌دهنده وضعیت فسخ OCSP",
                              purpose: "OCSP Signing (id-pk9)",
                              oid: "1.3.6.1.5.5.7.3.9",
                              desc: "باید دارای شناسه OID 1.3.6.1.5.5.7.3.9 در بخش extendedKeyUsage باشند."
                            },
                          ].map(eku => (
                            <label key={eku.key} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={settings.certificateValidationPolicy?.extendedKeyUsageRules?.[eku.key] ?? true}
                                onChange={e => {
                                  set("certificateValidationPolicy", {
                                    ...settings.certificateValidationPolicy,
                                    extendedKeyUsageRules: {
                                      ...settings.certificateValidationPolicy?.extendedKeyUsageRules,
                                      [eku.key]: e.target.checked
                                    }
                                  });
                                }}
                                className="h-4 w-4 rounded border-slate-300 text-emerald-600 mt-0.5"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                    {eku.title}
                                  </span>
                                  <span className="text-[10px] font-mono bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                                    {eku.purpose}
                                  </span>
                                </div>
                                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block mt-1 dir-ltr text-left">
                                  OID: {eku.oid}
                                </span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
                                  {eku.desc}
                                </span>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </AftaAccordionCard>

                  {/* ۴۹. 🌟 الزامات امنیتی پروتکل SSH (الزامات ۱ تا ۹ افتا - رده ۳-۶) */}
                  <AftaAccordionCard
                    id="afta_ssh_protocol"
                    number="الزام افتا (۳-۶)"
                    title="پروتکل SSH، احراز هویت، الگوریتم‌های رمزنگاری، کلید عمومی، MAC، تبادل کلید، آستانه Rekeying و اعتبارسنجی میزبان"
                    description="الزامات ۹‌گانه رده ۳-۶ افتا: استاندارد RFCها، احراز هویت، حد بسته‌ها، الگوریتم‌های Cipher/HostKey/MAC/KEX، تجدید کلید و known_hosts"
                    isOpen={!!openAftaSections["afta_ssh_protocol"]}
                    onToggle={toggleAftaSection}
                    icon={ShieldCheck}
                  >
                    <div className="space-y-5">
                      {/* 🔵 الزام ۱: انطباق با RFCهای ۴۲۵۱، ۴۲۵۲، ۴۲۵۳، ۴۲۵۴، ۵۶۵۶ و ۶۶۶۸ */}
                      <div className="space-y-3">
                        <div className="bg-slate-100 dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                            بند ۱) محصول باید پروتکل SSH را مطابق با RFCهای 4251, 4252, 4253, 4254, 5656 و 6668 پیاده‌سازی نماید:
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                          {["rfc4251", "rfc4252", "rfc4253", "rfc4254", "rfc5656", "rfc6668"].map(rfc => (
                            <label key={rfc} className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between cursor-pointer">
                              <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                                {rfc.toUpperCase()}
                              </span>
                              <input
                                type="checkbox"
                                checked={settings.sshProtocolPolicy?.rfcCompliance?.[rfc] ?? true}
                                onChange={e => {
                                  set("sshProtocolPolicy", {
                                    ...settings.sshProtocolPolicy,
                                    rfcCompliance: {
                                      ...settings.sshProtocolPolicy?.rfcCompliance,
                                      [rfc]: e.target.checked
                                    }
                                  });
                                }}
                                className="h-4 w-4 rounded border-slate-300 text-blue-600"
                              />
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* 🟢 الزام ۲: روش‌های احراز هویت (RFC 4252) */}
                      <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                        <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
                          <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 block">
                            بند ۲) روش‌های احراز هویت پروتکل SSH (مطابق RFC 4252):
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <label className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.sshProtocolPolicy?.authMethods?.publicKeyAuth ?? true}
                              onChange={e => {
                                set("sshProtocolPolicy", {
                                  ...settings.sshProtocolPolicy,
                                  authMethods: {
                                    ...settings.sshProtocolPolicy?.authMethods,
                                    publicKeyAuth: e.target.checked
                                  }
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                            />
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              احراز هویت مبتنی بر کلید عمومی (Public Key Authentication)
                            </span>
                          </label>

                          <label className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.sshProtocolPolicy?.authMethods?.passwordAuth ?? true}
                              onChange={e => {
                                set("sshProtocolPolicy", {
                                  ...settings.sshProtocolPolicy,
                                  authMethods: {
                                    ...settings.sshProtocolPolicy?.authMethods,
                                    passwordAuth: e.target.checked
                                  }
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                            />
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              احراز هویت مبتنی بر گذرواژه (Password Authentication)
                            </span>
                          </label>
                        </div>
                      </div>

                      {/* 🔴 الزام ۳: رد بسته‌های بزرگتر از مقدار مشخص (RFC 4253) */}
                      <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                        <div className="bg-rose-50 dark:bg-rose-950/30 p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/50">
                          <span className="text-xs font-bold text-rose-900 dark:text-rose-200 block">
                            بند ۳) کنار گذاشتن بسته‌های بزرگتر از حد آستانه مشخص‌شده (مطابق RFC 4253):
                          </span>
                        </div>
                        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                              حداکثر اندازه بسته مجاز SSH (Max Packet Size Limit):
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                              کنار گذاشتن صریح هرگونه بسته SSH با اندازه بیشتر از آستانه مشخص‌شده (پیش‌فرض ۳۵,۰۰۰ بایت).
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={settings.sshProtocolPolicy?.packetSizeLimit?.maxPacketSizeBytes ?? 35000}
                              onChange={e => {
                                set("sshProtocolPolicy", {
                                  ...settings.sshProtocolPolicy,
                                  packetSizeLimit: {
                                    ...settings.sshProtocolPolicy?.packetSizeLimit,
                                    maxPacketSizeBytes: Number(e.target.value) || 35000
                                  }
                                });
                              }}
                              className="w-28 px-3 py-1.5 border rounded-lg text-xs font-mono text-center font-bold dark:bg-slate-800 dark:border-slate-700"
                            />
                            <span className="text-xs text-slate-500 font-bold">بایت</span>
                          </div>
                        </div>
                      </div>

                      {/* 🟣 الزام ۴: الگوریتم‌های رمزنگاری مجاز SSH */}
                      <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                        <div className="bg-purple-50 dark:bg-purple-950/30 p-3.5 rounded-xl border border-purple-200 dark:border-purple-900/50">
                          <span className="text-xs font-bold text-purple-900 dark:text-purple-200 block">
                            بند ۴) الگوریتم‌های رمزنگاری مجاز در پیاده‌سازی SSH:
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                          {[
                            { key: "aes128Cbc", label: "AES128-CBC" },
                            { key: "aes192Cbc", label: "AES192-CBC" },
                            { key: "aes256Cbc", label: "AES256-CBC" },
                            { key: "aes128Ctr", label: "AES128-CTR" },
                            { key: "aes192Ctr", label: "AES192-CTR" },
                            { key: "aes256Ctr", label: "AES256-CTR" },
                            { key: "aeadAes128Gcm", label: "AEAD_AES_128_GCM" },
                            { key: "aeadAes256Gcm", label: "AEAD_AES_256_GCM" },
                          ].map(algo => (
                            <label key={algo.key} className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between cursor-pointer">
                              <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                                {algo.label}
                              </span>
                              <input
                                type="checkbox"
                                checked={settings.sshProtocolPolicy?.encryptionAlgorithms?.[algo.key] ?? true}
                                onChange={e => {
                                  set("sshProtocolPolicy", {
                                    ...settings.sshProtocolPolicy,
                                    encryptionAlgorithms: {
                                      ...settings.sshProtocolPolicy?.encryptionAlgorithms,
                                      [algo.key]: e.target.checked
                                    }
                                  });
                                }}
                                className="h-4 w-4 rounded border-slate-300 text-purple-600"
                              />
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* 🔵 الزام ۵: الگوریتم‌های کلید عمومی مجاز SSH */}
                      <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                        <div className="bg-indigo-50 dark:bg-indigo-950/30 p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900/50">
                          <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 block">
                            بند ۵) الگوریتم‌های کلید عمومی مجاز در پروتکل انتقال SSH (۱۳ الگوریتم مجاز):
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                          {[
                            { key: "sshEd25519", label: "ssh-ed25519" },
                            { key: "sshEd448", label: "ssh-ed448" },
                            { key: "rsaSha2512", label: "rsa-sha2-512" },
                            { key: "rsaSha2256", label: "rsa-sha2-256" },
                            { key: "ecdsaSha2Nistp521", label: "ecdsa-sha2-nistp521" },
                            { key: "ecdsaSha2Nistp384", label: "ecdsa-sha2-nistp384" },
                            { key: "ecdsaSha2Nistp256", label: "ecdsa-sha2-nistp256" },
                            { key: "x509v3EcdsaSha2Nistp521", label: "x509v3-ecdsa-sha2-nistp521" },
                            { key: "x509v3EcdsaSha2Nistp384", label: "x509v3-ecdsa-sha2-nistp384" },
                            { key: "x509v3EcdsaSha2Nistp256", label: "x509v3-ecdsa-sha2-nistp256" },
                            { key: "x509v3Rsa2048Sha256", label: "x509v3-rsa2048-sha256" },
                            { key: "sshRsa", label: "ssh-rsa" },
                            { key: "x509v3SshRsa", label: "x509v3-ssh-rsa" },
                          ].map(algo => (
                            <label key={algo.key} className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between cursor-pointer">
                              <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 dir-ltr text-left">
                                {algo.label}
                              </span>
                              <input
                                type="checkbox"
                                checked={settings.sshProtocolPolicy?.hostKeyAlgorithms?.[algo.key] ?? true}
                                onChange={e => {
                                  set("sshProtocolPolicy", {
                                    ...settings.sshProtocolPolicy,
                                    hostKeyAlgorithms: {
                                      ...settings.sshProtocolPolicy?.hostKeyAlgorithms,
                                      [algo.key]: e.target.checked
                                    }
                                  });
                                }}
                                className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                              />
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* 🟡 الزام ۶: الگوریتم‌های صحت داده MAC */}
                      <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                        <div className="bg-amber-50 dark:bg-amber-950/30 p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/50">
                          <span className="text-xs font-bold text-amber-900 dark:text-amber-200 block">
                            بند ۶) الگوریتم‌های صحت داده‌های MAC مجاز در SSH:
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                          {[
                            { key: "aeadAes256Gcm", label: "AEAD_AES_256_GCM" },
                            { key: "aeadAes128Gcm", label: "AEAD_AES_128_GCM" },
                            { key: "hmacSha2512", label: "hmac-sha2-512" },
                            { key: "hmacSha2256", label: "hmac-sha2-256" },
                            { key: "hmacSha196", label: "hmac-sha1-96" },
                            { key: "hmacSha1", label: "hmac-sha1" },
                          ].map(mac => (
                            <label key={mac.key} className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between cursor-pointer">
                              <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 dir-ltr text-left">
                                {mac.label}
                              </span>
                              <input
                                type="checkbox"
                                checked={settings.sshProtocolPolicy?.macAlgorithms?.[mac.key] ?? true}
                                onChange={e => {
                                  set("sshProtocolPolicy", {
                                    ...settings.sshProtocolPolicy,
                                    macAlgorithms: {
                                      ...settings.sshProtocolPolicy?.macAlgorithms,
                                      [mac.key]: e.target.checked
                                    }
                                  });
                                }}
                                className="h-4 w-4 rounded border-slate-300 text-amber-600"
                              />
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* 🟠 الزام ۷: الگوریتم‌های تبادل کلید KEX */}
                      <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                        <div className="bg-orange-50 dark:bg-orange-950/30 p-3.5 rounded-xl border border-orange-200 dark:border-orange-900/50">
                          <span className="text-xs font-bold text-orange-900 dark:text-orange-200 block">
                            بند ۷) الگوریتم‌های تبادل کلید (Key Exchange - KEX) مجاز در SSH (۱۳ الگوریتم مجاز):
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                          {[
                            { key: "curve25519Sha256", label: "curve25519-sha256" },
                            { key: "curve448Sha512", label: "curve448-sha512" },
                            { key: "dhGroupExchangeSha256", label: "diffie-hellman-group-exchange-sha256" },
                            { key: "dhGroup18Sha512", label: "diffie-hellman-group18-sha512" },
                            { key: "dhGroup17Sha512", label: "diffie-hellman-group17-sha512" },
                            { key: "dhGroup16Sha512", label: "diffie-hellman-group16-sha512" },
                            { key: "dhGroup15Sha512", label: "diffie-hellman-group15-sha512" },
                            { key: "ecdhSha2Nistp521", label: "ecdh-sha2-nistp521" },
                            { key: "ecdhSha2Nistp384", label: "ecdh-sha2-nistp384" },
                            { key: "ecdhSha2Nistp256", label: "ecdh-sha2-nistp256" },
                            { key: "rsa2048Sha256", label: "rsa2048-sha256" },
                            { key: "dhGroupExchangeSha1", label: "diffie-hellman-group-exchange-sha1" },
                            { key: "dhGroup14Sha256", label: "diffie-hellman-group14-sha256" },
                          ].map(kex => (
                            <label key={kex.key} className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between cursor-pointer">
                              <span className="text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200 dir-ltr text-left truncate">
                                {kex.label}
                              </span>
                              <input
                                type="checkbox"
                                checked={settings.sshProtocolPolicy?.kexAlgorithms?.[kex.key] ?? true}
                                onChange={e => {
                                  set("sshProtocolPolicy", {
                                    ...settings.sshProtocolPolicy,
                                    kexAlgorithms: {
                                      ...settings.sshProtocolPolicy?.kexAlgorithms,
                                      [kex.key]: e.target.checked
                                    }
                                  });
                                }}
                                className="h-4 w-4 rounded border-slate-300 text-orange-600"
                              />
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* 🟤 الزام ۸: حد آستانه تجدید کلید Rekeying */}
                      <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                        <div className="bg-teal-50 dark:bg-teal-950/30 p-3.5 rounded-xl border border-teal-200 dark:border-teal-900/50">
                          <span className="text-xs font-bold text-teal-900 dark:text-teal-200 block">
                            بند ۸) آستانه تجدید کلید نشست‌های SSH (Rekeying Threshold):
                          </span>
                        </div>
                        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                            تجدید اجباری کلیدها در صورت رسیدن به حد آستانه زمان (۱ ساعت) یا حجم داده (۱ گیگابایت):
                          </span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                              <span className="text-xs text-slate-700 dark:text-slate-300 font-bold">آستانه زمانی تجدید کلید:</span>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  value={settings.sshProtocolPolicy?.rekeyingPolicy?.maxDurationMinutes ?? 60}
                                  onChange={e => {
                                    set("sshProtocolPolicy", {
                                      ...settings.sshProtocolPolicy,
                                      rekeyingPolicy: {
                                        ...settings.sshProtocolPolicy?.rekeyingPolicy,
                                        maxDurationMinutes: Number(e.target.value) || 60
                                      }
                                    });
                                  }}
                                  className="w-20 px-2 py-1 border rounded text-xs font-mono text-center font-bold dark:bg-slate-800 dark:border-slate-700"
                                />
                                <span className="text-xs text-slate-500 font-bold">دقیقه (۱ ساعت)</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                              <span className="text-xs text-slate-700 dark:text-slate-300 font-bold">آستانه حجمی تجدید کلید:</span>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  value={settings.sshProtocolPolicy?.rekeyingPolicy?.maxDataTransferredMb ?? 1024}
                                  onChange={e => {
                                    set("sshProtocolPolicy", {
                                      ...settings.sshProtocolPolicy,
                                      rekeyingPolicy: {
                                        ...settings.sshProtocolPolicy?.rekeyingPolicy,
                                        maxDataTransferredMb: Number(e.target.value) || 1024
                                      }
                                    });
                                  }}
                                  className="w-20 px-2 py-1 border rounded text-xs font-mono text-center font-bold dark:bg-slate-800 dark:border-slate-700"
                                />
                                <span className="text-xs text-slate-500 font-bold">مگابایت (۱ گیگابایت)</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ⚪ الزام ۹: احراز هویت سرور توسط کلاینت با پایگاه داده محلی known_hosts */}
                      <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                        <div className="bg-blue-50 dark:bg-blue-950/30 p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/50">
                          <span className="text-xs font-bold text-blue-900 dark:text-blue-200 block">
                            بند ۹) احراز هویت سرور SSH توسط کلاینت (مطابق RFC 4251 بخش 7.1):
                          </span>
                        </div>
                        <label className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20 flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.sshProtocolPolicy?.hostVerificationPolicy?.useLocalKnownHostsDb ?? true}
                            onChange={e => {
                              set("sshProtocolPolicy", {
                                ...settings.sshProtocolPolicy,
                                hostVerificationPolicy: {
                                  ...settings.sshProtocolPolicy?.hostVerificationPolicy,
                                  useLocalKnownHostsDb: e.target.checked
                                }
                              });
                            }}
                            className="h-4 w-4 rounded border-blue-400 text-blue-600 mt-0.5"
                          />
                          <div>
                            <span className="text-xs font-bold text-blue-950 dark:text-blue-200 block">
                              محصول باید اطمینان حاصل نماید که کلاینت SSH، سرور SSH را با استفاده از پایگاه داده محلی (مخصوص نام میزبان و کلید عمومی متناظر آن RFC 4251 Sec 7.1) احراز هویت می‌نماید.
                            </span>
                            <span className="text-[11px] text-blue-800 dark:text-blue-300 block mt-1 leading-relaxed">
                              تطبیق اجباری کلید عمومی سرور با داده‌های ثبت‌شده در پایگاه داده local known_hosts جهت ممانعت از حملات Man-in-the-Middle.
                            </span>
                          </div>
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
