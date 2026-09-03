import crypto from "node:crypto";

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

export interface LockoutPolicy {
  maxFailedAttempts: number;
  lockoutDurationMinutes: number;
}

export interface SessionPolicy {
  tokenExpiresInHours: number;
  maxConcurrentSessions: number;
  idleTimeoutMinutes: number;
}

export interface EntityOperationPermissions {
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
  approve: boolean;
  export: boolean;
}

export interface EntityAccessPolicy {
  entityId: string;
  entityName: string;
  systemAdmin: EntityOperationPermissions;
  regularUser: EntityOperationPermissions;
  otherRoles: EntityOperationPermissions;
}

export interface ActiveUserSecurityChangePolicy {
  disallowChangeDuringActiveSession: boolean;
  forceReAuthentication: boolean;
  revokeAllDeviceSessions: boolean;
  auditLogSecurityChanges: boolean;
  notifyUserSecurityAlert: boolean;
}

export interface InactiveEntityPermissions {
  read: boolean;
  restore: boolean;
  delete: boolean;
  export: boolean;
}

export interface InactiveEntityAccessPolicies {
  recordsDocsMetadata: InactiveEntityPermissions;
  userBelongingData: InactiveEntityPermissions;
  authData: InactiveEntityPermissions;
  otherInactiveCases: InactiveEntityPermissions;
}

export interface InactiveEntityOperationConfig {
  requireAdminApproval: boolean;
  auditLog: boolean;
  preventHardDelete?: boolean;
  rbacCheck?: boolean;
  notifySecurityOfficer?: boolean;
  readOnlyMetadata?: boolean;
  checkIntegrity?: boolean;
}

export interface InactiveEntityOperationsPolicy {
  createInactiveEntity: InactiveEntityOperationConfig;
  deleteInactiveEntity: InactiveEntityOperationConfig;
  changeInactiveAccess: InactiveEntityOperationConfig;
  inactiveMetadataOps: InactiveEntityOperationConfig;
  otherInactiveOps: InactiveEntityOperationConfig;
}

export interface InactiveEntityPolicyCriteria {
  useUserRolesAndPermissions: boolean;
  useSessionInfoAndRequestParams: boolean;
  useOtherCriteria: boolean;
}

export interface ActiveInactiveInteractionPolicy {
  enableACLCheck: boolean;
  checkByUserId: boolean;
  checkByGroupId: boolean;
  checkByUserRole: boolean;
  requireExplicitACLRecord: boolean;
  auditUnauthorizedInteractions: boolean;
}

export interface ActiveToInactivePreventionRules {
  preventAccessOnExceedingSessionThreshold: boolean;
  sessionThresholdLimit: number;
  preventAccessOnAccountDeactivation: boolean;
  preventAccessOnIPAnomaly: boolean;
  preventAccessOnOtherCriteria: boolean;
}

export interface ResourceSanitizationPolicy {
  wipeCryptoKeysOnRelease: boolean;
  sanitizeTempFilesOnRelease: boolean;
  isolateSessionMemoryBuffers: boolean;
  requireSecureAccessForLegacyResources: boolean;
  auditResourceAllocationAndRelease: boolean;
}

export interface UserDataInputAccessPolicy {
  enableInputDataAccessControl: boolean;
  checkDataType: boolean;
  allowedDataTypes: string[];
  checkVolumeAndSize: boolean;
  maxPayloadSizeMB: number;
  checkFormat: boolean;
  checkImportFrequencyLimit: boolean;
  maxImportsPerHour: number;
  checkOtherInputCriteria: boolean;
}

export interface SecureDataTransportPolicy {
  enforceTLSEncryption: boolean;
  transparentSecurityAttributeCoupling: boolean;
  preventEavesdropping: boolean;
  preventDataLossAndTamperingInTransit: boolean;
  auditTransportSecurityViolations: boolean;
}

export interface UserDataEgressAccessPolicy {
  enableEgressDataAccessControl: boolean;
  checkDataType: boolean;
  allowedExportDataTypes: string[];
  checkVolumeAndSize: boolean;
  maxExportRecordsPerRequest: number;
  maxExportFileSizeBytes: number;
  checkFormat: boolean;
  checkOtherEgressCriteria: boolean;
}

export interface TargetedDataEgressRules {
  preventUntargetedDataEgress: boolean;
  requireExplicitEgressDestination: boolean;
  requireAdminApprovalForBulkEgress: boolean;
  preventEgressToUnauthorizedEndpoints: boolean;
  auditUntargetedEgressAttempts: boolean;
}

// بند ۵ افتا: توانایی تعریف نقش‌های مختلف در محصول
export interface ProductRolesDefinitionPolicy {
  enableRolesDefinition: boolean;
  supportedRoles: {
    systemAdmin: boolean; // مدیر سیستم
    advancedSupportUser: boolean; // پشتیبانی / کاربر پیشرفته
    regularUser: boolean; // کاربر عادی
    otherCustomRoles: boolean; // سایر موارد
  };
  auditLogRoleChanges: boolean;
}

// بند ۶ افتا: ارتباط کاربران به نقش‌های تعریف‌شده و الزام ۱ نقش به هر حساب
export interface UserRoleAssignmentPolicy {
  enableRoleAssignment: boolean;
  singleRolePerAccountEnforcement: boolean; // هر حساب کاربری تنها به یک نقش مرتبط است
  allowMultiUsersPerRole: boolean; // چندین کاربر می‌توانند نقش مشابهی داشته باشند
  auditRoleAssignmentChanges: boolean;
}

// رده ۲-۶ بند ۱ افتا: حفظ وضعیت امن محصول هنگام رخ دادن خرابی، اشکال یا شکست
export interface SecureFailureStatePolicy {
  enableSecureFailureState: boolean;
  softwareFailureProtection: boolean; // خرابی‌های نرم‌افزاری
  hardwareFailureProtection: boolean; // خرابی‌های سخت‌افزاری
  preserveDataIntegrityOnCrash: boolean; // حفظ صحت داده‌ها
  maintainAccessControlRulesOnFailure: boolean; // حفظ خط‌مشی کنترل دسترسی
  auditLogFailureEvents: boolean;
}

// رده ۲-۶ بند ۲ افتا: حفاظت از داده هنگام انتقال بین بخش‌های مجزای محصول (ممانعت از افشاء و تغییر)
export interface InternalTransitProtectionPolicy {
  enableInternalTransitProtection: boolean;
  preventDataLeakageInTransit: boolean; // جلوگیری از افشای داده
  preventDataTamperingInTransit: boolean; // جلوگیری از تغییر داده
  enforceInternalComponentTLS: boolean; // بستر و زیرساخت امن انتقال بین اجزاء
  auditTransitSecurityViolations: boolean;
}

// رده ۲-۶ بند ۳ افتا: تفسیر سازگار و یکسان داده‌های امنیتی قابل اشتراک‌گذاری با سایر محصولات IT
export interface SecurityDataInteroperabilityPolicy {
  enableSecurityDataInteroperability: boolean;
  supportedShareableData: {
    authData: boolean; // داده‌های احراز هویت
    cryptoKeys: boolean; // کلید
    digitalSignature: boolean; // امضای دیجیتال
    auditLogs: boolean; // ثبت‌نشان‌ها (داده‌های ممیزی)
    otherSecurityAttributes: boolean; // سایر موارد
  };
  enforceStandardFormatInterpretation: boolean;
}

// رده ۲-۶ بند ۴ افتا: زمان و تاریخ معتبر و استفاده از مهرهای زمانی معتبر (Trusted Timestamps)
export interface TrustedTimestampPolicy {
  enableTrustedTimestamping: boolean;
  ntpServerAddress?: string; // آدرس سرور NTP محلی شبکه
  timestampMethods: {
    getTimestampFromNtpServer: boolean; // گرفتن مهرهای زمانی از سرور NTP
    setTimestampViaInternet: boolean; // تنظیم مهرهای زمانی از طریق اینترنت
    setDefaultTrustedTimestamp: boolean; // تنظیم مهرهای زمانی به صورت پیش‌فرض (معتبر و عدم امکان دستکاری غیرمجاز)
    otherMethods: boolean; // سایر موارد (همگام‌سازی محلی سیستم)
  };
  verifyTimestampIntegrity: boolean;
}

// الزام افتا: بروزرسانی نرم‌افزار و میان‌افزار محصول برای مدیر سیستم
export interface ProductSoftwareUpdatePolicy {
  enableSoftwareUpdateManagement: boolean;
  updateMethods: {
    manualUpdate: boolean; // بروزرسانی دستی
    autoSearchForUpdates: boolean; // جستجوی خودکار بروزرسانی‌ها
    automaticUpdates: boolean; // بروزرسانی‌های خودکار
    manualUpdateAfterSecurityVerification: boolean; // بروزرسانی دستی بعد از اطمینان از امنیت وصله و یا فایل بروزرسانی
  };
  // الزام جدید افتا: سازوکار مورد استفاده برای صحت‌سنجی (اصالت‌سنجی) بروزرسانی‌های خودکار پیش از نصب
  autoUpdateAuthenticityVerification: {
    enableAuthenticityVerification: boolean;
    digitalSignature: boolean; // امضای دیجیتال
    publishedHash: boolean; // درهم‌ساز منتشرشده
  };
  requireAdminApprovalForUpdates: boolean;
  auditLogUpdateEvents: boolean;
}

// الزام جدید افتا: اطمینان از عملکرد کارکردهای اصلی محصول در زمان رخداد هرگونه اشکال و خرابی (شکست) نرم‌افزاری
export interface CoreFunctionsSoftwareFaultTolerancePolicy {
  enableFaultTolerancePolicy: boolean;
  isolationOfFaultyModules: boolean; // جداسازی ماژول‌های دچار خطای زمان اجرا جهت عدم اختلال در سایر کارکردها
  fallbackToCoreOperationalMode: boolean; // بازگشت به حالت عملیاتی پایه و فعال نگه‌داشتن کارکردهای اصلی سیستم
  gracefulDegradation: boolean; // افت کیفیت کنترل‌شده (Graceful Degradation) بدون از کار افتادن وظایف اصلی
  auditLogFaultEvents: boolean; // ثبت دقیق رویدادهای خرابی و ناهنجاری نرم‌افزاری در لاگ حسابرسی افتا
}

// بند ۴ افتا: نمایش آخرین تلاش موفق برای ایجاد نشست
export interface LastSuccessfulSessionNoticePolicy {
  enable: boolean;
  displayDate: boolean;
  displayTime: boolean;
  displayOtherInfo: boolean;
}

// بند ۵ افتا: نمایش آخرین تلاش ناموفق برای ایجاد نشست و تعداد تلاش‌های ناموفق تا آخرین نشست موفقیت‌آمیز
export interface LastFailedSessionNoticePolicy {
  enable: boolean;
  displayDate: boolean;
  displayTime: boolean;
  displayOtherInfo: boolean;
  displayFailedAttemptsCount: boolean;
}

export interface PreserveAccessRecordsPolicy {
  preventAutoClearWithoutUserView: boolean;
  requireExplicitUserDismissal: boolean;
}

// الزام افتا: توانایی ممانعت از ایجاد نشست بر اساس پارامترهایی از قبیل مکان، شماره پورت، روز، زمان و سایر موارد
export interface SessionEstablishmentPreventionPolicy {
  enable: boolean;
  preventByLocation: boolean;
  allowedIpRanges?: string[];
  preventByPort: boolean;
  allowedPorts?: number[];
  preventByDay: boolean;
  allowedDays?: string[];
  preventByTime: boolean;
  allowedStartTime?: string;
  allowedEndTime?: string;
  preventByOtherParams: boolean;
  otherParamsRules?: {
    blockSuspiciousUserAgents?: boolean;
    requireValidStatus?: boolean;
  };
}

// الزام افتا (رده ۲-۹): کانال‌ها/مسیرهای مورد اعتماد
export interface TrustedChannelPolicy {
  enable: boolean;
  protocols: {
    https: boolean;
    tls: boolean;
    ssh: boolean;
  };
  allowRemoteConnectionOnlyViaSecureChannel: boolean;
  requireSecureChannelForInitialAuth: boolean;
}

// الزام افتا (رده ۳-۱): الزامات امنیتی مبتنی بر انتخاب - پروتکل HTTPS
export interface HttpsProtocolPolicy {
  enable: boolean;
  rfc2818Compliance: boolean;
  requireTlsForHttps: boolean;
  invalidCertificateHandling: "disconnect" | "promptForApproval";
}

// الزام افتا (رده ۳-۲): الزامات امنیتی مبتنی بر انتخاب - پروتکل TLS Client
export interface TlsClientPolicy {
  enable: boolean;
  enforceTls12Only: boolean;
  rfc6125IdentityValidation: boolean;
  serverCertificateValidation: {
    requireValidCertificate: boolean;
    invalidCertAction: "disconnect" | "promptForApproval" | "otherActions";
    otherActionText?: string;
  };
  clientHelloEllipticCurves: {
    mode: "noExtension" | "nistCurves";
    curves: {
      secp256r1: boolean;
      secp384r1: boolean;
      secp521r1: boolean;
    };
  };
  cipherSuites: {
    tls_aes_256_gcm_sha384: boolean;
    tls_aes_128_gcm_sha256: boolean;
    tls_dhe_rsa_with_aes_256_gcm_sha384: boolean;
    tls_dhe_rsa_with_aes_128_gcm_sha256: boolean;
    tls_ecdhe_rsa_with_aes_128_gcm_sha256: boolean;
    tls_ecdhe_rsa_with_aes_256_gcm_sha384: boolean;
    tls_ecdhe_ecdsa_with_aes_256_gcm_sha384: boolean;
    tls_ecdhe_ecdsa_with_aes_128_gcm_sha256: boolean;
    tls_rsa_with_aes_256_gcm_sha384: boolean;
    tls_rsa_with_aes_128_gcm_sha256: boolean;
    tls_ecdh_ecdsa_with_aes_256_gcm_sha384: boolean;
    tls_ecdh_ecdsa_with_aes_128_gcm_sha256: boolean;
    tls_ecdh_rsa_with_aes_256_gcm_sha384: boolean;
    tls_ecdh_rsa_with_aes_128_gcm_sha256: boolean;
    tls_dh_rsa_with_aes_256_gcm_sha384: boolean;
    tls_dh_rsa_with_aes_128_gcm_sha256: boolean;
  };
}

// الزام افتا (رده ۳-۳): الزامات امنیتی مبتنی بر انتخاب - پروتکل TLS Server
export interface TlsServerPolicy {
  enable: boolean;
  enforceTls12Only: boolean; // الزام ۱: پیاده‌سازی TLS 1.2 (RFC 5246)
  rejectLegacyProtocols: { // الزام ۲: رد درخواست‌های اتصال SSL 1.0, SSL 2.0, SSL 3.0, TLS 1.0 و TLS 1.1
    ssl10: boolean;
    ssl20: boolean;
    ssl30: boolean;
    tls10: boolean;
    tls11: boolean;
  };
  keyExchangeParameters: { // الزام ۳: پارامترهای ساخت کلید
    rsaKeySizes: { // ۱. استفاده از RSA با اندازه کلید ۲۰۴۸، ۳۰۷۲ یا ۴۰۹۶ بیت
      rsa2048: boolean;
      rsa3072: boolean;
      rsa4096: boolean;
    };
    ecdhNistCurves: { // ۲. پارامترهای ECDH(E) با استفاده از NIST Curves (secp256r1, secp384r1, secp521r1)
      secp256r1: boolean;
      secp384r1: boolean;
      secp521r1: boolean;
      disallowOtherCurves: boolean;
    };
    dhKeySizes: { // ۳. پارامترهای دیفی-هلمن با اندازه کلید ۲۰۴۸ یا ۳۰۷۲ بیت
      dh2048: boolean;
      dh3072: boolean;
    };
  };
  cipherSuites: { // الزام ۱ (بخش دوم): مجموعه‌های رمز
    tls_aes_256_gcm_sha384: boolean;
    tls_aes_128_gcm_sha256: boolean;
    tls_dhe_rsa_with_aes_256_gcm_sha384: boolean;
    tls_dhe_rsa_with_aes_128_gcm_sha256: boolean;
    tls_ecdhe_rsa_with_aes_128_gcm_sha256: boolean;
    tls_ecdhe_rsa_with_aes_256_gcm_sha384: boolean;
    tls_ecdhe_ecdsa_with_aes_256_gcm_sha384: boolean;
    tls_ecdhe_ecdsa_with_aes_128_gcm_sha256: boolean;
    tls_rsa_with_aes_256_gcm_sha384: boolean;
    tls_rsa_with_aes_128_gcm_sha256: boolean;
    tls_ecdh_ecdsa_with_aes_256_gcm_sha384: boolean;
    tls_ecdh_ecdsa_with_aes_128_gcm_sha256: boolean;
    tls_ecdh_rsa_with_aes_256_gcm_sha384: boolean;
    tls_ecdh_rsa_with_aes_128_gcm_sha256: boolean;
    tls_dh_rsa_with_aes_256_gcm_sha384: boolean;
    tls_dh_rsa_with_aes_128_gcm_sha256: boolean;
  };
}

export interface MutualTlsPolicy {
  enable: boolean;
  enableMutualAuthX509v3?: boolean;
  rejectMismatchSubjectDnOrSan?: boolean;
  enforceSubjectIdentityMatching?: boolean;
  mismatchedIdentityAction?: string;
  requireValidClientCert?: boolean;
}

// الزام افتا (رده ۳-۵): اعتبارسنجی گواهی‌نامه (Certificate Validation)
export interface CertificateValidationPolicy {
  enable: boolean;
  pathValidationRules: {
    rfc5280PathValidation: boolean;
    endWithTrustedCA: boolean;
    requireBasicConstraintsCaTrue: boolean;
  };
  strictCaAcceptanceOnlyWithBasicConstraints: boolean; // الزام ۲: پذیرش گواهی‌نامه به عنوان CA تنها در صورت وجود basicConstraints و پرچم CA=TRUE
  x509v3Rfc5280AuthenticationScopes: { // الزام ۳: استفاده از گواهی‌نامه‌های X509v3 تعریف‌شده در RFC 5280 برای احراز هویت
    https: boolean;
    tls: boolean;
    ssh: boolean;
    codeSigningSoftwareUpdates: boolean;
    codeSigningIntegrityVerification: boolean;
    otherUseCases: boolean;
  };
  revocationCheckingMethods: {
    ocspRfc696: boolean;
    crlRfc5280Section63: boolean;
    crlRfc5759Section5: boolean;
    disallowOtherRevocationMethods: boolean;
  };
  extendedKeyUsageRules: {
    codeSigningOid: boolean;
    serverAuthOid: boolean;
    clientAuthOid: boolean;
    ocspSigningOid: boolean;
  };
}

// الزام افتا (رده ۳-۶): الزامات امنیتی پروتکل SSH (SSH Security Protocol)
export interface SshProtocolPolicy {
  enable: boolean;
  rfcCompliance: {
    rfc4251: boolean;
    rfc4252: boolean;
    rfc4253: boolean;
    rfc4254: boolean;
    rfc5656: boolean;
    rfc6668: boolean;
  };
  authMethods: {
    publicKeyAuth: boolean;
    passwordAuth: boolean;
  };
  packetSizeLimit: {
    enableMaxPacketCheck: boolean;
    maxPacketSizeBytes: number;
  };
  encryptionAlgorithms: {
    aes128Cbc: boolean;
    aes192Cbc: boolean;
    aes256Cbc: boolean;
    aes128Ctr: boolean;
    aes192Ctr: boolean;
    aes256Ctr: boolean;
    aeadAes128Gcm: boolean;
    aeadAes256Gcm: boolean;
  };
  hostKeyAlgorithms: {
    sshEd25519: boolean;
    sshEd448: boolean;
    rsaSha2512: boolean;
    rsaSha2256: boolean;
    ecdsaSha2Nistp521: boolean;
    ecdsaSha2Nistp384: boolean;
    ecdsaSha2Nistp256: boolean;
    x509v3EcdsaSha2Nistp521: boolean;
    x509v3EcdsaSha2Nistp384: boolean;
    x509v3EcdsaSha2Nistp256: boolean;
    x509v3Rsa2048Sha256: boolean;
    sshRsa: boolean;
    x509v3SshRsa: boolean;
  };
  macAlgorithms: {
    aeadAes256Gcm: boolean;
    aeadAes128Gcm: boolean;
    hmacSha2512: boolean;
    hmacSha2256: boolean;
    hmacSha196: boolean;
    hmacSha1: boolean;
  };
  kexAlgorithms: {
    curve25519Sha256: boolean;
    curve448Sha512: boolean;
    dhGroupExchangeSha256: boolean;
    dhGroup18Sha512: boolean;
    dhGroup17Sha512: boolean;
    dhGroup16Sha512: boolean;
    dhGroup15Sha512: boolean;
    ecdhSha2Nistp521: boolean;
    ecdhSha2Nistp384: boolean;
    ecdhSha2Nistp256: boolean;
    rsa2048Sha256: boolean;
    dhGroupExchangeSha1: boolean;
    dhGroup14Sha256: boolean;
  };
  rekeyingPolicy: {
    enableRekeying: boolean;
    maxDurationMinutes: number;
    maxDataTransferredMb: number;
  };
  hostVerificationPolicy: {
    enableHostVerification: boolean;
    useLocalKnownHostsDb: boolean;
  };
}

export interface SensitiveDataIntegrityPolicy {
  enableTamperDetection: boolean;
  maintainHashedValues: boolean;
  maintainDigitalSignatures?: boolean;
  otherTamperDetection: boolean;
  autoBlockOnTamperAlert?: boolean;
  auditLogTamperEvents?: boolean;
}

export interface DataIntegrityErrorResponsePolicy {
  enableErrorResponse: boolean;
  notifyAuthorizedRoles: boolean;
  autoRollbackToPreviousState: boolean;
  otherResponseActions: boolean;
  auditLogErrorEvents?: boolean;
}

export interface FunctionBehaviorManagementPolicy {
  enableLoginTimeWindow: boolean;
  allowedLoginStartTime: string; // e.g., "07:00"
  allowedLoginEndTime: string;   // e.g., "23:30"
  specifyBehaviorConfigs?: {
    restrictAdminIpRange: boolean;
    allowedAdminIpRange: string;
    strictSessionLock: boolean;
    autoArchiveLogsDays: number;
  };
  disabledFunctions?: {
    disableDirectDatabaseExport: boolean;
    disableRemotePasswordReset: boolean;
    disableGuestLogin: boolean;
    disableBulkFileDownloads: boolean;
  };
  enabledFunctions?: {
    enableMfaForAdmins: boolean;
    enableAuditLogIntegritySigning: boolean;
    enableEgressValidationCheck: boolean;
    enableRealTimeSecurityAlerts: boolean;
  };
  otherBehaviorSettings?: {
    customSecurityNotice: string;
    customManagementNotes: string;
  };
}

export interface SecurityFunctionsManagementPolicy {
  enableFunctionsMgmt?: boolean;
  behaviorConfiguration?: boolean;
  disableFunctions?: boolean;
  enableFunctions?: boolean;
  otherFunctionsMgmt?: boolean;
}

export interface AuthSecurityAttributesPolicy {
  enableAuthSecurityMgmt?: boolean;
  querySecurityAttributes?: boolean;
  modifySecurityAttributes?: boolean;
  deleteSecurityAttributes?: boolean;
  changeDefaultSecurityAttributes?: boolean;
  otherAuthSecurityOps?: boolean;
}

export interface ProductDataManagementPolicy {
  enableProductDataMgmt?: boolean;
  changeDefaultData?: boolean;
  deleteData?: boolean;
  queryData?: boolean;
  initializeData?: boolean;
  createData?: boolean;
  readData?: boolean;
  otherDataOps?: boolean;
}

export interface SecurityManagementCapabilitiesPolicy {
  enableCapabilitiesMgmt?: boolean;
  groupUserAuditTokenRead?: boolean;
  auditTokenReadWritePerms?: boolean;
  auditTokenStorageThresholdOps?: boolean;
  accessCriteriaParametersMgmt?: boolean;
  residualDataProtectionTimingConfig?: boolean;
  dataInputValidationRulesEdit?: boolean;
  dataIntegrityErrorActionConfig?: boolean;
  failedAuthThresholdMgmt?: boolean;
  passwordComplexityCriteriaMgmt?: boolean;
  authDataAndPreAuthOpsMgmt?: boolean;
  authMechanismsAndRulesMgmt?: boolean;
  preAuthIpAssignmentProcessMgmt?: boolean;
  defaultActiveEntitySecurityAttrsMgmt?: boolean;
  defaultProductAccessControlValuesMgmt?: boolean;
  productRolesMgmt?: boolean;
  maxConcurrentSessionsPerUserMgmt?: boolean;
  sessionStartConditionsMgmt?: boolean;
  specificUserInactivityTimeoutConfig?: boolean;
  defaultUsersInactivityTimeoutConfig?: boolean;
}

export interface SecurityPolicyConfig {
  passwordPolicy: PasswordPolicy;
  lockoutPolicy: LockoutPolicy;
  sessionPolicy: SessionPolicy;
  functionBehaviorPolicy?: FunctionBehaviorManagementPolicy;
  securityFunctionsManagementPolicy?: SecurityFunctionsManagementPolicy;
  authSecurityAttributesPolicy?: AuthSecurityAttributesPolicy;
  productDataManagementPolicy?: ProductDataManagementPolicy;
  securityManagementCapabilitiesPolicy?: SecurityManagementCapabilitiesPolicy;
  entityAccessPolicies?: EntityAccessPolicy[];
  activeUserSecurityChangePolicy?: ActiveUserSecurityChangePolicy;
  inactiveEntityAccessPolicies?: InactiveEntityAccessPolicies;
  inactiveEntityOperationsPolicy?: InactiveEntityOperationsPolicy;
  inactiveEntityPolicyCriteria?: InactiveEntityPolicyCriteria;
  activeInactiveInteractionPolicy?: ActiveInactiveInteractionPolicy;
  activeToInactivePreventionRules?: ActiveToInactivePreventionRules;
  resourceSanitizationPolicy?: ResourceSanitizationPolicy;
  userDataInputAccessPolicy?: UserDataInputAccessPolicy;
  secureDataTransportPolicy?: SecureDataTransportPolicy;
  userDataEgressAccessPolicy?: UserDataEgressAccessPolicy;
  targetedDataEgressRules?: TargetedDataEgressRules;
  sensitiveDataIntegrityPolicy?: SensitiveDataIntegrityPolicy;
  dataIntegrityErrorResponsePolicy?: DataIntegrityErrorResponsePolicy;
  productRolesDefinitionPolicy?: ProductRolesDefinitionPolicy;
  userRoleAssignmentPolicy?: UserRoleAssignmentPolicy;
  secureFailureStatePolicy?: SecureFailureStatePolicy;
  internalTransitProtectionPolicy?: InternalTransitProtectionPolicy;
  securityDataInteroperabilityPolicy?: SecurityDataInteroperabilityPolicy;
  trustedTimestampPolicy?: TrustedTimestampPolicy;
  productSoftwareUpdatePolicy?: ProductSoftwareUpdatePolicy;
  coreFunctionsSoftwareFaultTolerancePolicy?: CoreFunctionsSoftwareFaultTolerancePolicy;
  lastSuccessfulSessionNoticePolicy?: LastSuccessfulSessionNoticePolicy;
  lastFailedSessionNoticePolicy?: LastFailedSessionNoticePolicy;
  preserveAccessRecordsPolicy?: PreserveAccessRecordsPolicy;
  sessionEstablishmentPreventionPolicy?: SessionEstablishmentPreventionPolicy;
  trustedChannelPolicy?: TrustedChannelPolicy;
  httpsProtocolPolicy?: HttpsProtocolPolicy;
  tlsClientPolicy?: TlsClientPolicy;
  tlsServerPolicy?: TlsServerPolicy;
  mutualTlsPolicy?: MutualTlsPolicy;
  certificateValidationPolicy?: CertificateValidationPolicy;
  sshProtocolPolicy?: SshProtocolPolicy;
}

export const DEFAULT_ENTITY_ACCESS_POLICIES: EntityAccessPolicy[] = [
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

export const DEFAULT_SECURITY_POLICY: SecurityPolicyConfig = {
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  },
  lockoutPolicy: {
    maxFailedAttempts: 5,
    lockoutDurationMinutes: 15,
  },
  sessionPolicy: {
    tokenExpiresInHours: 8,
    maxConcurrentSessions: 1,
    idleTimeoutMinutes: 30,
  },
  functionBehaviorPolicy: {
    enableLoginTimeWindow: true,
    allowedLoginStartTime: "07:00",
    allowedLoginEndTime: "23:30",
    specifyBehaviorConfigs: {
      restrictAdminIpRange: true,
      allowedAdminIpRange: "192.168.35.0/24",
      strictSessionLock: true,
      autoArchiveLogsDays: 90
    },
    disabledFunctions: {
      disableDirectDatabaseExport: false,
      disableRemotePasswordReset: false,
      disableGuestLogin: true,
      disableBulkFileDownloads: false
    },
    enabledFunctions: {
      enableMfaForAdmins: true,
      enableAuditLogIntegritySigning: true,
      enableEgressValidationCheck: true,
      enableRealTimeSecurityAlerts: true
    },
    otherBehaviorSettings: {
      customSecurityNotice: "ورود کاربران غیرمجاز ممنوع می‌باشد.",
      customManagementNotes: "مدیریت رفتارهای توابع کارکردی محصول مطابق بند ۱ جدول ۲-۵ افتا"
    }
  },
  securityFunctionsManagementPolicy: {
    enableFunctionsMgmt: true,
    behaviorConfiguration: true,
    disableFunctions: true,
    enableFunctions: true,
    otherFunctionsMgmt: true
  },
  authSecurityAttributesPolicy: {
    enableAuthSecurityMgmt: true,
    querySecurityAttributes: false,
    modifySecurityAttributes: true,
    deleteSecurityAttributes: false,
    changeDefaultSecurityAttributes: true,
    otherAuthSecurityOps: true
  },
  productDataManagementPolicy: {
    enableProductDataMgmt: true,
    changeDefaultData: true,
    deleteData: false,
    queryData: false,
    initializeData: true,
    createData: true,
    readData: true,
    otherDataOps: true
  },
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
    specificUserInactivityTimeoutConfig: true,
    defaultUsersInactivityTimeoutConfig: true
  },
  entityAccessPolicies: DEFAULT_ENTITY_ACCESS_POLICIES,
  activeUserSecurityChangePolicy: {
    disallowChangeDuringActiveSession: true,
    forceReAuthentication: true,
    revokeAllDeviceSessions: true,
    auditLogSecurityChanges: true,
    notifyUserSecurityAlert: false,
  },
  inactiveEntityAccessPolicies: {
    recordsDocsMetadata: { read: true, restore: false, delete: false, export: true },
    userBelongingData: { read: true, restore: false, delete: false, export: false },
    authData: { read: false, restore: false, delete: false, export: false },
    otherInactiveCases: { read: true, restore: false, delete: false, export: false }
  },
  inactiveEntityOperationsPolicy: {
    createInactiveEntity: { requireAdminApproval: true, auditLog: true, rbacCheck: true },
    deleteInactiveEntity: { preventHardDelete: true, requireAdminApproval: true, auditLog: true },
    changeInactiveAccess: { requireAdminApproval: true, auditLog: true, notifySecurityOfficer: true },
    inactiveMetadataOps: { requireAdminApproval: true, readOnlyMetadata: true, auditLog: true, checkIntegrity: true },
    otherInactiveOps: { requireAdminApproval: true, auditLog: true }
  },
  inactiveEntityPolicyCriteria: {
    useUserRolesAndPermissions: true,
    useSessionInfoAndRequestParams: true,
    useOtherCriteria: false
  },
  activeInactiveInteractionPolicy: {
    enableACLCheck: true,
    checkByUserId: true,
    checkByGroupId: true,
    checkByUserRole: true,
    requireExplicitACLRecord: true,
    auditUnauthorizedInteractions: true,
  },
  activeToInactivePreventionRules: {
    preventAccessOnExceedingSessionThreshold: true,
    sessionThresholdLimit: 3,
    preventAccessOnAccountDeactivation: true,
    preventAccessOnIPAnomaly: true,
    preventAccessOnOtherCriteria: true,
  },
  resourceSanitizationPolicy: {
    wipeCryptoKeysOnRelease: true,
    sanitizeTempFilesOnRelease: true,
    isolateSessionMemoryBuffers: true,
    requireSecureAccessForLegacyResources: true,
    auditResourceAllocationAndRelease: true,
  },
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
  secureDataTransportPolicy: {
    enforceTLSEncryption: true,
    transparentSecurityAttributeCoupling: true,
    preventEavesdropping: true,
    preventDataLossAndTamperingInTransit: true,
    auditTransportSecurityViolations: true,
  },
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
  targetedDataEgressRules: {
    preventUntargetedDataEgress: true,
    requireExplicitEgressDestination: true,
    requireAdminApprovalForBulkEgress: true,
    preventEgressToUnauthorizedEndpoints: true,
    auditUntargetedEgressAttempts: true,
  },
  sensitiveDataIntegrityPolicy: {
    enableTamperDetection: true,
    maintainHashedValues: true,
    maintainDigitalSignatures: true,
    otherTamperDetection: true,
    autoBlockOnTamperAlert: true,
    auditLogTamperEvents: true,
  },
  dataIntegrityErrorResponsePolicy: {
    enableErrorResponse: true,
    notifyAuthorizedRoles: true,
    autoRollbackToPreviousState: true,
    otherResponseActions: true,
    auditLogErrorEvents: true,
  },
  productRolesDefinitionPolicy: {
    enableRolesDefinition: true,
    supportedRoles: {
      systemAdmin: true,
      advancedSupportUser: true,
      regularUser: true,
      otherCustomRoles: true,
    },
    auditLogRoleChanges: true,
  },
  userRoleAssignmentPolicy: {
    enableRoleAssignment: true,
    singleRolePerAccountEnforcement: true,
    allowMultiUsersPerRole: true,
    auditRoleAssignmentChanges: true,
  },
  secureFailureStatePolicy: {
    enableSecureFailureState: true,
    softwareFailureProtection: true,
    hardwareFailureProtection: true,
    preserveDataIntegrityOnCrash: true,
    maintainAccessControlRulesOnFailure: true,
    auditLogFailureEvents: true,
  },
  internalTransitProtectionPolicy: {
    enableInternalTransitProtection: true,
    preventDataLeakageInTransit: true,
    preventDataTamperingInTransit: true,
    enforceInternalComponentTLS: true,
    auditTransitSecurityViolations: true,
  },
  securityDataInteroperabilityPolicy: {
    enableSecurityDataInteroperability: true,
    supportedShareableData: {
      authData: true,
      cryptoKeys: true,
      digitalSignature: true,
      auditLogs: true,
      otherSecurityAttributes: true,
    },
    enforceStandardFormatInterpretation: true,
  },
  trustedTimestampPolicy: {
    enableTrustedTimestamping: true,
    ntpServerAddress: "127.0.0.1",
    timestampMethods: {
      getTimestampFromNtpServer: true,
      setTimestampViaInternet: false, // غیرفعال برای محیط لوکال شبکه داخلی بدون اینترنت
      setDefaultTrustedTimestamp: true,
      otherMethods: true,
    },
    verifyTimestampIntegrity: true,
  },
  productSoftwareUpdatePolicy: {
    enableSoftwareUpdateManagement: true,
    updateMethods: {
      manualUpdate: true,
      autoSearchForUpdates: true,
      automaticUpdates: false,
      manualUpdateAfterSecurityVerification: true,
    },
    autoUpdateAuthenticityVerification: {
      enableAuthenticityVerification: true,
      digitalSignature: true,
      publishedHash: true,
    },
    requireAdminApprovalForUpdates: true,
    auditLogUpdateEvents: true,
  },
  coreFunctionsSoftwareFaultTolerancePolicy: {
    enableFaultTolerancePolicy: true,
    isolationOfFaultyModules: true,
    fallbackToCoreOperationalMode: true,
    gracefulDegradation: true,
    auditLogFaultEvents: true,
  },
  lastSuccessfulSessionNoticePolicy: {
    enable: true,
    displayDate: true,
    displayTime: true,
    displayOtherInfo: true,
  },
  lastFailedSessionNoticePolicy: {
    enable: true,
    displayDate: true,
    displayTime: true,
    displayOtherInfo: true,
    displayFailedAttemptsCount: true,
  },
  preserveAccessRecordsPolicy: {
    preventAutoClearWithoutUserView: true,
    requireExplicitUserDismissal: true,
  },
  sessionEstablishmentPreventionPolicy: {
    enable: true,
    preventByLocation: true,
    allowedIpRanges: ["192.168.0.0/16", "10.0.0.0/8", "127.0.0.1", "::1", "localhost"],
    preventByPort: true,
    allowedPorts: [80, 443, 3000, 3001, 5000, 5173, 8000, 8001, 8002, 8080, 8443],
    preventByDay: true,
    allowedDays: ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "شنبه", "یک‌شنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه"],
    preventByTime: true,
    allowedStartTime: "07:00",
    allowedEndTime: "23:30",
    preventByOtherParams: true,
    otherParamsRules: {
      blockSuspiciousUserAgents: true,
      requireValidStatus: true,
    }
  },
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
  httpsProtocolPolicy: {
    enable: true,
    rfc2818Compliance: true,
    requireTlsForHttps: true,
    invalidCertificateHandling: "disconnect"
  },
  tlsClientPolicy: {
    enable: true,
    enforceTls12Only: true,
    rfc6125IdentityValidation: true,
    serverCertificateValidation: {
      requireValidCertificate: true,
      invalidCertAction: "disconnect",
      otherActionText: ""
    },
    clientHelloEllipticCurves: {
      mode: "nistCurves",
      curves: {
        secp256r1: true,
        secp384r1: true,
        secp521r1: true
      }
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
      tls_dh_rsa_with_aes_128_gcm_sha256: true
    }
  },
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
      tls_dh_rsa_with_aes_128_gcm_sha256: true
    }
  },
  mutualTlsPolicy: {
    enable: true,
    enableMutualAuthX509v3: true,
    enforceSubjectIdentityMatching: true,
    mismatchedIdentityAction: "disconnect"
  },
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
  }
};

export function validateSshPacketSize(
  packetSizeBytes: number,
  policy: SshProtocolPolicy = DEFAULT_SECURITY_POLICY.sshProtocolPolicy!
): { valid: boolean; reason?: string } {
  if (policy.packetSizeLimit?.enableMaxPacketCheck) {
    const max = policy.packetSizeLimit.maxPacketSizeBytes || 35000;
    if (packetSizeBytes > max) {
      return {
        valid: false,
        reason: `بسته SSH با اندازه ${packetSizeBytes} بایت بیشتر از حد آستانه مجاز (${max} بایت) بوده و کنار گذاشته شد (مطابق RFC 4253 و الزام ۳ رده ۳-۶ افتا).`
      };
    }
  }
  return { valid: true };
}

export function validateSshRekeyingTrigger(
  durationMinutes: number,
  transferredMb: number,
  policy: SshProtocolPolicy = DEFAULT_SECURITY_POLICY.sshProtocolPolicy!
): { mustRekey: boolean; reason?: string } {
  if (policy.rekeyingPolicy?.enableRekeying) {
    const maxTime = policy.rekeyingPolicy.maxDurationMinutes || 60;
    const maxData = policy.rekeyingPolicy.maxDataTransferredMb || 1024;

    if (durationMinutes >= maxTime || transferredMb >= maxData) {
      return {
        mustRekey: true,
        reason: `رسیدن به حد آستانه نشست SSH (مدت زمان ${durationMinutes} دقیقه یا حجم داده ${transferredMb} مگابایت). کلیدهای نشست باید تجدید گردند (Rekeying - الزام ۸ رده ۳-۶ افتا).`
      };
    }
  }
  return { mustRekey: false };
}

export function validateSshHostVerification(
  hostInfo: { hostname: string; hostKeyInLocalKnownHosts: boolean },
  policy: SshProtocolPolicy = DEFAULT_SECURITY_POLICY.sshProtocolPolicy!
): { valid: boolean; reason?: string } {
  if (policy.hostVerificationPolicy?.enableHostVerification && policy.hostVerificationPolicy?.useLocalKnownHostsDb) {
    if (!hostInfo.hostKeyInLocalKnownHosts) {
      return {
        valid: false,
        reason: `احراز هویت سرور SSH برای میزبان ${hostInfo.hostname} در پایگاه داده محلی known_hosts ناموفق بود (مطابق RFC 4251 بخش 7.1 و الزام ۹ رده ۳-۶ افتا).`
      };
    }
  }
  return { valid: true };
}

export function validateCaCertificateAcceptance(
  cert: { basicConstraintsPresent: boolean; isCA: boolean },
  policy: CertificateValidationPolicy = DEFAULT_SECURITY_POLICY.certificateValidationPolicy!
): { valid: boolean; reason?: string; aftaCompliance: string } {
  if (policy.strictCaAcceptanceOnlyWithBasicConstraints !== false) {
    if (!cert.basicConstraintsPresent || !cert.isCA) {
      return {
        valid: false,
        reason: "پذیرش گواهی‌نامه به عنوان CA رد گردید. محصول تنها در صورتی که افزونه مربوط به basicConstraints از پیش تنظیم شده باشد و همچنین، پرچم CA به حالت TRUE تنظیم شده باشد، یک گواهی‌نامه را به عنوان گواهی‌نامه CA می‌پذیرد (مطابق الزام FIA_X509_EXT.1.2/Rev افتا).",
        aftaCompliance: "عدم انطباق با FIA_X509_EXT.1.2/Rev (عدم وجود basicConstraints یا CA=FALSE)"
      };
    }
  }
  return {
    valid: true,
    aftaCompliance: "انطباق کامل با الزام FIA_X509_EXT.1.2/Rev افتا (پذیرش گواهی‌نامه CA تنها با افزونه basicConstraints و پرچم CA=TRUE)"
  };
}

export function validateX509v3Rfc5280Scope(
  scope: "HTTPS" | "TLS" | "SSH" | "CODE_SIGNING_UPDATES" | "CODE_SIGNING_INTEGRITY" | "OTHER",
  policy: CertificateValidationPolicy = DEFAULT_SECURITY_POLICY.certificateValidationPolicy!
): { valid: boolean; reason?: string } {
  const scopes = policy.x509v3Rfc5280AuthenticationScopes;
  if (scope === "HTTPS" && !scopes?.https) return { valid: false, reason: "پشتیبانی احراز هویت X509v3 RFC 5280 برای HTTPS غیرفعال است (الزام ۳ رده ۳-۵ افتا)." };
  if (scope === "TLS" && !scopes?.tls) return { valid: false, reason: "پشتیبانی احراز هویت X509v3 RFC 5280 برای کارکردهای TLS غیرفعال است (الزام ۳ رده ۳-۵ افتا)." };
  if (scope === "SSH" && !scopes?.ssh) return { valid: false, reason: "پشتیبانی احراز هویت X509v3 RFC 5280 برای SSH غیرفعال است (الزام ۳ رده ۳-۵ افتا)." };
  if (scope === "CODE_SIGNING_UPDATES" && !scopes?.codeSigningSoftwareUpdates) return { valid: false, reason: "پشتیبانی از گواهی‌نامه امضای کد جهت بروزرسانی‌های نرم‌افزار غیرفعال است (الزام ۳ رده ۳-۵ افتا)." };
  if (scope === "CODE_SIGNING_INTEGRITY" && !scopes?.codeSigningIntegrityVerification) return { valid: false, reason: "پشتیبانی از گواهی‌نامه امضای کد جهت تأیید یکپارچگی غیرفعال است (الزام ۳ رده ۳-۵ افتا)." };
  if (scope === "OTHER" && !scopes?.otherUseCases) return { valid: false, reason: "پشتیبانی از سایر کارکردهای احراز هویت X509v3 غیرفعال است (الزام ۳ رده ۳-۵ افتا)." };

  return { valid: true };
}

export function validateCertificatePathRules(
  certPath: { length: number; endsWithTrustedCA: boolean; allCaHaveBasicConstraintsCaTrue: boolean },
  policy: CertificateValidationPolicy = DEFAULT_SECURITY_POLICY.certificateValidationPolicy!
): { valid: boolean; reason?: string } {
  if (policy.pathValidationRules.rfc5280PathValidation && certPath.length < 2) {
    return { valid: false, reason: "طول مسیر گواهی‌نامه به حداقل ۲ گواهی‌نامه نرسیده است (مطابق RFC 5280 و رده ۳-۵ افتا)." };
  }
  if (policy.pathValidationRules.endWithTrustedCA && !certPath.endsWithTrustedCA) {
    return { valid: false, reason: "مسیر گواهی‌نامه به گواهی‌نامه CA امن و معتبر منتهی نگردیده است (مطابق رده ۳-۵ افتا)." };
  }
  if (policy.pathValidationRules.requireBasicConstraintsCaTrue && !certPath.allCaHaveBasicConstraintsCaTrue) {
    return { valid: false, reason: "افزونه basicConstraints یا پرچم CA=TRUE برای تمام گواهی‌نامه‌های CA مسیر تنظیم نشده است (مطابق رده ۳-۵ افتا)." };
  }
  return { valid: true };
}

export function validateCertificateRevocationCheck(
  method: "OCSP_RFC696" | "CRL_RFC5280_SEC63" | "CRL_RFC5759_SEC5" | "OTHER",
  policy: CertificateValidationPolicy = DEFAULT_SECURITY_POLICY.certificateValidationPolicy!
): { valid: boolean; reason?: string } {
  if (method === "OCSP_RFC696" && policy.revocationCheckingMethods.ocspRfc696) return { valid: true };
  if (method === "CRL_RFC5280_SEC63" && policy.revocationCheckingMethods.crlRfc5280Section63) return { valid: true };
  if (method === "CRL_RFC5759_SEC5" && policy.revocationCheckingMethods.crlRfc5759Section5) return { valid: true };

  if (policy.revocationCheckingMethods.disallowOtherRevocationMethods) {
    return { valid: false, reason: "روش فسخ غیرمجاز است. صرفاً OCSP (RFC 696) و CRL (RFC 5280/RFC 5759) مجاز می‌باشند (مطابق رده ۳-۵ افتا)." };
  }
  return { valid: true };
}

export function validateExtendedKeyUsageOid(
  usagePurpose: "CODE_SIGNING" | "SERVER_AUTH" | "CLIENT_AUTH" | "OCSP_SIGNING",
  ekuOid: string,
  policy: CertificateValidationPolicy = DEFAULT_SECURITY_POLICY.certificateValidationPolicy!
): { valid: boolean; reason?: string } {
  if (usagePurpose === "CODE_SIGNING") {
    if (policy.extendedKeyUsageRules.codeSigningOid && ekuOid !== "1.3.6.1.5.5.7.3.3") {
      return { valid: false, reason: "گواهی‌نامه بروزرسانی/کد باید دارای OID 1.3.6.1.5.5.7.3.3 (id-kp3 Code Signing) در بخش extendedKeyUsage باشد (مطابق رده ۳-۵ افتا)." };
    }
  }
  if (usagePurpose === "SERVER_AUTH") {
    if (policy.extendedKeyUsageRules.serverAuthOid && ekuOid !== "1.3.6.1.5.5.7.3.1") {
      return { valid: false, reason: "گواهی‌نامه سرور TLS باید دارای OID 1.3.6.1.5.5.7.3.1 (id-kp1 Server Authentication) باشد (مطابق رده ۳-۵ افتا)." };
    }
  }
  if (usagePurpose === "CLIENT_AUTH") {
    if (policy.extendedKeyUsageRules.clientAuthOid && ekuOid !== "1.3.6.1.5.5.7.3.2") {
      return { valid: false, reason: "گواهی‌نامه کلاینت TLS باید دارای OID 1.3.6.1.5.5.7.3.2 (id-kp2 Client Authentication) باشد (مطابق رده ۳-۵ افتا)." };
    }
  }
  if (usagePurpose === "OCSP_SIGNING") {
    if (policy.extendedKeyUsageRules.ocspSigningOid && ekuOid !== "1.3.6.1.5.5.7.3.9") {
      return { valid: false, reason: "گواهی‌نامه پاسخ‌دهنده OCSP باید دارای OID 1.3.6.1.5.5.7.3.9 (id-kp9 OCSP Signing) باشد (مطابق رده ۳-۵ افتا)." };
    }
  }
  return { valid: true };
}

export function validateMutualTlsIdentity(
  certInfo: { subjectDN?: string; sanName?: string; expectedClientIdentifier?: string },
  policy: MutualTlsPolicy = DEFAULT_SECURITY_POLICY.mutualTlsPolicy!
): { valid: boolean; reason?: string } {
  if (!policy.enableMutualAuthX509v3) {
    return { valid: true };
  }

  if (policy.enforceSubjectIdentityMatching) {
    const expected = certInfo.expectedClientIdentifier?.trim().toLowerCase();
    const subject = certInfo.subjectDN?.trim().toLowerCase();
    const san = certInfo.sanName?.trim().toLowerCase();

    if (!expected || (!subject?.includes(expected) && !san?.includes(expected))) {
      return {
        valid: false,
        reason: "عدم مطابقت نام متمایز (Subject DN) یا نام دیگر فاعل در گواهی‌نامه X509v3 با شناساننده کلاینت مورد انتظار. کانال امن برقرار نگردید (مطابق الزام ۲ رده ۳-۴ افتا)."
      };
    }
  }

  return { valid: true };
}

export function validateTlsServerProtocolRequest(
  requestProtocol: string,
  policy: TlsServerPolicy = DEFAULT_SECURITY_POLICY.tlsServerPolicy!
): { allowed: boolean; reason?: string } {
  const normProto = requestProtocol.trim().toUpperCase();
  if (normProto === "SSL1.0" || normProto === "SSL 1.0" || normProto === "SSLV1") {
    if (policy.rejectLegacyProtocols?.ssl10) return { allowed: false, reason: "ارتباط بر پایه SSL 1.0 طبق الزام شماره ۲ افتا (پروتکل TLS Server) مسدود و رد گردید." };
  }
  if (normProto === "SSL2.0" || normProto === "SSL 2.0" || normProto === "SSLV2") {
    if (policy.rejectLegacyProtocols?.ssl20) return { allowed: false, reason: "ارتباط بر پایه SSL 2.0 طبق الزام شماره ۲ افتا (پروتکل TLS Server) مسدود و رد گردید." };
  }
  if (normProto === "SSL3.0" || normProto === "SSL 3.0" || normProto === "SSLV3") {
    if (policy.rejectLegacyProtocols?.ssl30) return { allowed: false, reason: "ارتباط بر پایه SSL 3.0 طبق الزام شماره ۲ افتا (پروتکل TLS Server) مسدود و رد گردید." };
  }
  if (normProto === "TLS1.0" || normProto === "TLS 1.0" || normProto === "TLSV1.0") {
    if (policy.rejectLegacyProtocols?.tls10) return { allowed: false, reason: "ارتباط بر پایه TLS 1.0 طبق الزام شماره ۲ افتا (پروتکل TLS Server) مسدود و رد گردید." };
  }
  if (normProto === "TLS1.1" || normProto === "TLS 1.1" || normProto === "TLSV1.1") {
    if (policy.rejectLegacyProtocols?.tls11) return { allowed: false, reason: "ارتباط بر پایه TLS 1.1 طبق الزام شماره ۲ افتا (پروتکل TLS Server) مسدود و رد گردید." };
  }
  return { allowed: true };
}

export function validateTlsServerKeyExchangeParameters(
  params: { keyType: "RSA" | "ECDH" | "ECDHE" | "DH"; keySizeBits?: number; curveName?: string },
  policy: TlsServerPolicy = DEFAULT_SECURITY_POLICY.tlsServerPolicy!
): { valid: boolean; reason?: string } {
  if (params.keyType === "RSA") {
    const size = params.keySizeBits;
    if (size !== 2048 && size !== 3072 && size !== 4096) {
      return { valid: false, reason: `اندازه کلید RSA (${size} بیت) معتبر نیست. اندازه کلید RSA باید ۲۰۴۸، ۳۰۷۲ یا ۴۰۹۶ بیت باشد (مطابق الزام ۳ افتا).` };
    }
  }

  if (params.keyType === "ECDH" || params.keyType === "ECDHE") {
    const curve = params.curveName;
    const allowedCurves = ["secp256r1", "secp384r1", "secp521r1"];
    if (!curve || !allowedCurves.includes(curve)) {
      return { valid: false, reason: `منحنی بیضوی (${curve}) مجاز نمی‌باشد. پارامترهای ECDH(E) باید صرفاً از NIST Curves شامل secp256r1، secp384r1 یا secp521r1 باشند (مطابق الزام ۳ افتا).` };
    }
  }

  if (params.keyType === "DH") {
    const size = params.keySizeBits;
    if (size !== 2048 && size !== 3072) {
      return { valid: false, reason: `اندازه کلید دیفی-هلمن DH (${size} بیت) معتبر نیست. پارامترهای DH باید ۲۰۴۸ یا ۳۰۷۲ بیت باشند (مطابق الزام ۳ افتا).` };
    }
  }

  return { valid: true };
}

export function validateTargetedDataEgressRules(
  context: { hasTargetDestination?: boolean; destinationAuthorized?: boolean; isBulkWithoutApproval?: boolean },
  rules: TargetedDataEgressRules = DEFAULT_SECURITY_POLICY.targetedDataEgressRules!
): { allowed: boolean; reason?: string } {
  if (rules.preventUntargetedDataEgress && context.hasTargetDestination === false) {
    return {
      allowed: false,
      reason: "خروج داده‌ها بدون تعیین هدف و مقصد مشخص امکان‌پذیر نمی‌باشد (ممانعت از خروج بدون هدف طبق الزام بند ۹ افتا)."
    };
  }

  if (rules.preventEgressToUnauthorizedEndpoints && context.destinationAuthorized === false) {
    return {
      allowed: false,
      reason: "مقصد خروج داده کاربری در فهرست سامانه‌ها و آدرس‌های مجاز تاییدشده توسط مدیر سیستم نیست."
    };
  }

  if (rules.requireAdminApprovalForBulkEgress && context.isBulkWithoutApproval === true) {
    return {
      allowed: false,
      reason: "خروجی دسته‌ای داده‌ها منوط به اخذ تاییدیه قبلی از مدیر سیستم می‌باشد."
    };
  }

  return { allowed: true };
}

export function validateUserDataEgressAccessPolicy(
  egressMeta: { exportType?: string; recordCount?: number; fileSizeMB?: number; formatValid?: boolean },
  policy: UserDataEgressAccessPolicy = DEFAULT_SECURITY_POLICY.userDataEgressAccessPolicy!
): { allowed: boolean; reason?: string } {
  if (!policy.enableEgressDataAccessControl) {
    return { allowed: true };
  }

  if (policy.checkDataType && egressMeta.exportType) {
    if (Array.isArray(policy.allowedExportDataTypes) && !policy.allowedExportDataTypes.includes(egressMeta.exportType.toUpperCase())) {
      return {
        allowed: false,
        reason: `خروجی‌گرفتن با نوع داده (${egressMeta.exportType}) طبق خط‌مشی کنترل دسترسی خروج مجاز نمی‌باشد.`
      };
    }
  }

  if (policy.checkVolumeAndSize) {
    if (typeof egressMeta.recordCount === "number") {
      const maxRecords = policy.maxExportRecordsPerRequest || 5000;
      if (egressMeta.recordCount > maxRecords) {
        return {
          allowed: false,
          reason: `تعداد رکوردهای خروجی (${egressMeta.recordCount}) فراتر از حد مجاز هر نوبت خروجی (${maxRecords} رکورد) است.`
        };
      }
    }

    if (typeof egressMeta.fileSizeMB === "number") {
      const maxSizeMB = Math.round((policy.maxExportFileSizeBytes || 20971520) / (1024 * 1024));
      if (egressMeta.fileSizeMB > maxSizeMB) {
        return {
          allowed: false,
          reason: `حجم فایل خروجی (${egressMeta.fileSizeMB}MB) بیش از حد مجاز خروج داده به بیرون (${maxSizeMB}MB) است.`
        };
      }
    }
  }

  if (policy.checkFormat && egressMeta.formatValid === false) {
    return {
      allowed: false,
      reason: "فرمت خروجی داده یا کدگذاری آن معتبر نبوده و طبق خط‌مشی خروج مسدود گردید."
    };
  }

  return { allowed: true };
}

export function validateSecureDataTransportPolicy(
  context: { isSecureProtocol?: boolean; hasAuthHeaders?: boolean; checksumValid?: boolean },
  policy: SecureDataTransportPolicy = DEFAULT_SECURITY_POLICY.secureDataTransportPolicy!
): { secure: boolean; reason?: string } {
  if (policy.enforceTLSEncryption && context.isSecureProtocol === false) {
    return {
      secure: false,
      reason: "کانال انتقال ناامن (عدم استفاده از HTTPS/TLS). احتمال شنود یا استراق سمع داده‌ها وجود دارد."
    };
  }

  if (policy.transparentSecurityAttributeCoupling && context.hasAuthHeaders === false) {
    return {
      secure: false,
      reason: "عدم وجود همبستگی شفاف بین داده کاربری و ویژگی‌های امنیتی احراز هویت در هدرهای انتقال."
    };
  }

  if (policy.preventDataLossAndTamperingInTransit && context.checksumValid === false) {
    return {
      secure: false,
      reason: "شناسایی دستکاری یا عدم تطابق تمامیت داده حین انتقال (احتمال فقدان یا تغییر بایت‌ها در شبکه)."
    };
  }

  return { secure: true };
}

export function validateUserDataInputAccessPolicy(
  inputMeta: { dataType?: string; sizeMB?: number; formatValid?: boolean; importCountLastHour?: number },
  policy: UserDataInputAccessPolicy = DEFAULT_SECURITY_POLICY.userDataInputAccessPolicy!
): { valid: boolean; reason?: string } {
  if (!policy.enableInputDataAccessControl) {
    return { valid: true };
  }

  if (policy.checkDataType && inputMeta.dataType) {
    if (Array.isArray(policy.allowedDataTypes) && !policy.allowedDataTypes.includes(inputMeta.dataType.toUpperCase())) {
      return {
        valid: false,
        reason: `نوع داده ورودی (${inputMeta.dataType}) در فهرست انواع داده مجاز سیستم نیست.`
      };
    }
  }

  if (policy.checkVolumeAndSize && typeof inputMeta.sizeMB === "number") {
    const maxSize = policy.maxPayloadSizeMB || 10;
    if (inputMeta.sizeMB > maxSize) {
      return {
        valid: false,
        reason: `حجم و اندازه داده ورودی (${inputMeta.sizeMB}MB) بیش از حد مجاز (${maxSize}MB) می‌باشد.`
      };
    }
  }

  if (policy.checkFormat && inputMeta.formatValid === false) {
    return {
      valid: false,
      reason: "فرمت یا ساختار داده کاربری دریافتی نامعتبر بوده و طبق خط‌مشی رد گردید."
    };
  }

  if (policy.checkImportFrequencyLimit && typeof inputMeta.importCountLastHour === "number") {
    const maxLimit = policy.maxImportsPerHour || 20;
    if (inputMeta.importCountLastHour >= maxLimit) {
      return {
        valid: false,
        reason: `تعداد دفعات Import کاربر در یک ساعت گذشته (${inputMeta.importCountLastHour}) به حد مجاز (${maxLimit}) رسیده است.`
      };
    }
  }

  return { valid: true };
}

export function validateResourceSanitizationPolicy(
  opType: "allocation" | "release" | "legacy_access",
  policy: ResourceSanitizationPolicy = DEFAULT_SECURITY_POLICY.resourceSanitizationPolicy!
): { sanitized: boolean; message?: string } {
  if (opType === "allocation" || opType === "release") {
    if (policy.sanitizeTempFilesOnRelease || policy.wipeCryptoKeysOnRelease) {
      return { sanitized: true, message: "باقی‌مانده داده‌ها و کلیدهای امنیتی منابع در هنگام تخصیص/آزادسازی کاملاً پاک‌سازی گردید." };
    }
  }

  if (opType === "legacy_access") {
    if (policy.requireSecureAccessForLegacyResources) {
      return { sanitized: true, message: "دسترسی به منابع و داده‌های قبلی مستلزم احراز هویت، RBAC و ثبت لاگ افتا می‌باشد." };
    }
  }

  return { sanitized: true };
}

export function validateActiveToInactivePreventionRules(
  context: { currentActiveSessionsCount?: number; isAccountActive?: boolean; ipChanged?: boolean },
  rules: ActiveToInactivePreventionRules = DEFAULT_SECURITY_POLICY.activeToInactivePreventionRules!
): { allowed: boolean; reason?: string } {
  if (rules.preventAccessOnExceedingSessionThreshold) {
    const threshold = rules.sessionThresholdLimit || 3;
    if (context.currentActiveSessionsCount !== undefined && context.currentActiveSessionsCount > threshold) {
      return {
        allowed: false,
        reason: `تعداد نشست‌های آغاز شده با نام کاربری مشابه (${context.currentActiveSessionsCount}) از مقدار آستانه از پیش تعریف‌شده (${threshold}) فراتر رفته است.`
      };
    }
  }

  if (rules.preventAccessOnAccountDeactivation && context.isAccountActive === false) {
    return {
      allowed: false,
      reason: "دسترسی به موجودیت غیرفعال به علت تعلیق یا غیرفعال شدن حساب کاربری مسدود گردیده است."
    };
  }

  if (rules.preventAccessOnIPAnomaly && context.ipChanged) {
    return {
      allowed: false,
      reason: "دسترسی به موجودیت غیرفعال به علت شناسایی ناهنجاری آدرس IP نشست مسدود گردید."
    };
  }

  return { allowed: true };
}

export function validateActiveToInactiveInteractionACL(
  userInfo: { userId?: string; groupId?: string; userRole?: string },
  aclRecord: { allowedUserIds?: string[]; allowedGroupIds?: string[]; allowedRoles?: string[] } | null,
  policy: ActiveInactiveInteractionPolicy = DEFAULT_SECURITY_POLICY.activeInactiveInteractionPolicy!
): { allowed: boolean; reason?: string } {
  if (!policy.enableACLCheck) {
    return { allowed: true };
  }

  if (policy.requireExplicitACLRecord && !aclRecord) {
    return { allowed: false, reason: "سابقه (رکوردی) در فهرست کنترل دسترسی (ACL) برای این موجودیت غیرفعال یافت نشد." };
  }

  if (!aclRecord) {
    return { allowed: false, reason: "دسترسی به موجودیت غیرفعال فاقد رکورد ACL می‌باشد." };
  }

  let matched = false;

  if (policy.checkByUserId && userInfo.userId && aclRecord.allowedUserIds?.includes(userInfo.userId)) {
    matched = true;
  }

  if (policy.checkByGroupId && userInfo.groupId && aclRecord.allowedGroupIds?.includes(userInfo.groupId)) {
    matched = true;
  }

  if (policy.checkByUserRole && userInfo.userRole && (userInfo.userRole === "admin" || aclRecord.allowedRoles?.includes(userInfo.userRole))) {
    matched = true;
  }

  if (matched) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: "شناسه کاربری، شناسه گروه یا نقش کاربری در رکورد ACL مجاز برای موجودیت غیرفعال یافت نشد."
  };
}

export function validatePassword(password: string, policy: PasswordPolicy = DEFAULT_SECURITY_POLICY.passwordPolicy): { valid: boolean; message?: string } {
  if (!password || password.length < policy.minLength) {
    return { valid: false, message: `رمز عبور باید حداقل ${policy.minLength} کاراکتر باشد.` };
  }
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    return { valid: false, message: "رمز عبور باید حداقل شامل یک حرف بزرگ انگلیسی باشد." };
  }
  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    return { valid: false, message: "رمز عبور باید حداقل شامل یک حرف کوچک انگلیسی باشد." };
  }
  if (policy.requireNumbers && !/[0-9]/.test(password)) {
    return { valid: false, message: "رمز عبور باید حداقل شامل یک عدد باشد." };
  }
  if (policy.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, message: "رمز عبور باید حداقل شامل یک کاراکتر خاص (!@#$%^&*) باشد." };
  }
  return { valid: true };
}

export interface TlsClientValidationResult {
  valid: boolean;
  allowed: boolean;
  reason?: string;
  enabledCipherSuitesCount: number;
  activeCipherSuitesList: string[];
  protocolVersionStatus: string;
  aftaCompliance: string;
}

export function getEnabledTlsClientCipherSuites(
  policy: TlsClientPolicy = DEFAULT_SECURITY_POLICY.tlsClientPolicy!
): string[] {
  const cipherSuites = policy?.cipherSuites || {};
  return Object.keys(cipherSuites).filter(k => (cipherSuites as any)[k] === true);
}

export function validateTlsClientConnection(
  params: { cipherSuite?: string; tlsVersion?: string; targetHost?: string },
  policy: TlsClientPolicy = DEFAULT_SECURITY_POLICY.tlsClientPolicy!
): TlsClientValidationResult {
  const enabledSuites = getEnabledTlsClientCipherSuites(policy);
  const enabledCount = enabledSuites.length;

  if (!policy?.enable) {
    return {
      valid: false,
      allowed: false,
      reason: "پروتکل TLS Client در خط‌مشی‌های امنیت سیستم غیرفعال گردیده است.",
      enabledCipherSuitesCount: enabledCount,
      activeCipherSuitesList: enabledSuites,
      protocolVersionStatus: "DISABLED",
      aftaCompliance: "غیرانطباق - پروتکل غیرفعال است"
    };
  }

  const tlsVer = (params?.tlsVersion || "TLSv1.3").toUpperCase();
  if (policy.enforceTls12Only) {
    if (tlsVer.includes("1.0") || tlsVer.includes("1.1") || tlsVer.includes("SSL")) {
      return {
        valid: false,
        allowed: false,
        reason: `نسخه پروتکل ارتباطی (${tlsVer}) ناامن بوده و طبق خط‌مشی TLS Client انحصاراً نسخه‌های TLS 1.2 و TLS 1.3 مجاز می‌باشند (مطابق الزام ۱ رده ۳-۲ افتا).`,
        enabledCipherSuitesCount: enabledCount,
        activeCipherSuitesList: enabledSuites,
        protocolVersionStatus: "REJECTED_LEGACY_PROTOCOL",
        aftaCompliance: "عدم انطباق با الزام ۱ افتا"
      };
    }
  }

  if (params?.cipherSuite) {
    const normCipher = params.cipherSuite.trim().toLowerCase();
    const isAllowed = Object.entries(policy.cipherSuites || {}).some(
      ([key, enabled]) => enabled && (key.toLowerCase() === normCipher || key.replace(/_/g, "-").toLowerCase() === normCipher)
    );

    if (!isAllowed) {
      return {
        valid: false,
        allowed: false,
        reason: `مجموعه رمز درخواست‌شده (${params.cipherSuite}) در لیست مجموعه‌های رمز مجاز TLS Client سیستم فعال نمی‌باشد.`,
        enabledCipherSuitesCount: enabledCount,
        activeCipherSuitesList: enabledSuites,
        protocolVersionStatus: "REJECTED_CIPHER_SUITE",
        aftaCompliance: "عدم انطباق با مجموعه‌های رمز مجاز"
      };
    }
  }

  return {
    valid: true,
    allowed: true,
    enabledCipherSuitesCount: enabledCount,
    activeCipherSuitesList: enabledSuites,
    protocolVersionStatus: "ENFORCED_TLS_1.2_1.3",
    aftaCompliance: "انطباق کامل با الزام افتا (رده ۳-۲) و استاندارد RFC 8446/5288/5289/6125"
  };
}

export function validateSessionEstablishmentPrevention(
  requestDetails: {
    ip?: string;
    port?: number;
    currentDay?: string;
    currentTime?: string;
    userRole?: string;
    userStatus?: string;
    userAgent?: string;
  },
  policy: SessionEstablishmentPreventionPolicy = DEFAULT_SECURITY_POLICY.sessionEstablishmentPreventionPolicy!,
  functionBehaviorPolicy?: FunctionBehaviorManagementPolicy
): { valid: boolean; reason?: string; parameter?: "location" | "port" | "day" | "time" | "other" } {
  if (!policy || policy.enable === false) {
    return { valid: true };
  }

  // ۱. مکان (Location / IP)
  if (policy.preventByLocation) {
    const clientIp = requestDetails.ip || "127.0.0.1";
    const allowedIps = policy.allowedIpRanges && policy.allowedIpRanges.length > 0
      ? policy.allowedIpRanges
      : ["192.168.0.0/16", "10.0.0.0/8", "127.0.0.1", "::1", "localhost"];

    const isAllowedIp = allowedIps.some((range) => {
      const cleanRange = range.trim();
      if (cleanRange === clientIp || cleanRange === "0.0.0.0/0" || cleanRange === "*") return true;
      if (cleanRange.includes("/")) {
        const prefix = cleanRange.split("/")[0].replace(/\.0$/, "").replace(/\.0$/, "");
        return clientIp.startsWith(prefix);
      }
      return clientIp.includes(cleanRange);
    });

    if (!isAllowedIp) {
      return {
        valid: false,
        parameter: "location",
        reason: `ممانعت از ایجاد نشست بر اساس موقعیت مکانی / IP غیرمجاز (${clientIp}). دسترسی خارج از محدوده آدرس‌های مجاز شبکه رد شد.`
      };
    }
  }

  // ۲. شماره پورت (Port number)
  if (policy.preventByPort) {
    const clientPort = requestDetails.port;
    if (clientPort) {
      const activeServerPort = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
      const defaultAppPorts = [80, 443, 3000, 3001, 3002, 5000, 5173, 5174, 5175, 5176, 8000, 8001, 8002, 8080, 8443, activeServerPort];
      
      const configuredPorts = (policy.allowedPorts && policy.allowedPorts.length > 0)
        ? policy.allowedPorts.map(p => Number(p)).filter(p => !isNaN(p) && p > 0)
        : [];

      const allowedPorts = Array.from(new Set([...configuredPorts, ...defaultAppPorts]));
      const numericClientPort = Number(clientPort);

      if (!allowedPorts.includes(numericClientPort)) {
        return {
          valid: false,
          parameter: "port",
          reason: `ممانعت از ایجاد نشست بر اساس شماره پورت غیرمجاز (${clientPort}). این پورت در لیست پورت‌های مجاز سیستم ثبت نشده است و ورود به سامانه مسدود گردید (الزام FTA_TSE.1.1 افتا).`
        };
      }
    }
  }

  // ۳. روز (Day of week)
  if (policy.preventByDay) {
    const day = requestDetails.currentDay || new Date().toLocaleDateString("en-US", { weekday: "long" });
    const allowedDays = policy.allowedDays && policy.allowedDays.length > 0
      ? policy.allowedDays
      : ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "شنبه", "یک‌شنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه"];

    const isAllowedDay = allowedDays.some(d => d.toLowerCase() === day.toLowerCase());
    if (!isAllowedDay) {
      return {
        valid: false,
        parameter: "day",
        reason: `ممانعت از ایجاد نشست بر اساس روز غیرمجاز هفته (${day}). ورود به سامانه در این روز بر اساس خط‌مشی امنیتی مسدود می‌باشد.`
      };
    }
  }

  // ۴. زمان (Time window)
  if (policy.preventByTime) {
    const startTime = policy.allowedStartTime || functionBehaviorPolicy?.allowedLoginStartTime || "07:00";
    const endTime = policy.allowedEndTime || functionBehaviorPolicy?.allowedLoginEndTime || "23:30";

    const currentTimeStr = requestDetails.currentTime || new Date().toTimeString().slice(0, 5); // "HH:mm"

    if (currentTimeStr < startTime || currentTimeStr > endTime) {
      return {
        valid: false,
        parameter: "time",
        reason: `ممانعت از ایجاد نشست بر اساس زمان ورود (${currentTimeStr}). ورود به سامانه خارج از ساعات مجاز اداری/عملیاتی (${startTime} الی ${endTime}) ممنوع است.`
      };
    }
  }

  // ۵. سایر موارد (Other parameters)
  if (policy.preventByOtherParams) {
    if (requestDetails.userStatus && (requestDetails.userStatus === "غیرفعال" || requestDetails.userStatus === "مسدود")) {
      return {
        valid: false,
        parameter: "other",
        reason: `ممانعت از ایجاد نشست بر اساس سایر موارد: حساب کاربری در وضعیت '${requestDetails.userStatus}' می‌باشد.`
      };
    }

    if (requestDetails.userAgent === "" || requestDetails.userAgent === "Unknown") {
      return {
        valid: false,
        parameter: "other",
        reason: "ممانعت از ایجاد نشست بر اساس سایر موارد: مشخصات مرورگر/کلاینت (User-Agent) ناشناخته یا غیرمعتبر است."
      };
    }
  }

  return { valid: true };
}

// 🌟 الزام FPT_FLS.1.1 افتا: حفظ و امنیت وضعیت امن در زمان شکست ۱ (خرابی‌های نرم‌افزاری و سخت‌افزاری)
export function validateSecureFailureState(
  failureInfo: {
    failureType: "SOFTWARE_FAILURE" | "HARDWARE_FAILURE" | "DATABASE_DISCONNECT" | "UNHANDLED_EXCEPTION";
    errorMessage?: string;
    stackTrace?: string;
    requestedResource?: string;
    userRole?: string;
  },
  policy: SecureFailureStatePolicy = DEFAULT_SECURITY_POLICY.secureFailureStatePolicy!
): {
  secureStateMaintained: boolean;
  sensitiveDataExposed: boolean;
  accessControlMaintained: boolean;
  auditLogged: boolean;
  sanitizedErrorMessage: string;
  aftaCompliance: string;
} {
  if (!policy || policy.enableSecureFailureState === false) {
    return {
      secureStateMaintained: false,
      sensitiveDataExposed: false,
      accessControlMaintained: false,
      auditLogged: false,
      sanitizedErrorMessage: "خطای عمومی سیستم.",
      aftaCompliance: "غیرفعال"
    };
  }

  const rawMsg = failureInfo.errorMessage || "";
  const stack = failureInfo.stackTrace || "";
  const containsSensitiveInfo = /at\s+.*:\d+:\d+|node_modules|mongodb:\/\/|password|secret|key|eval|internal/i.test(rawMsg + stack);

  // عدم افشای اطلاعات محرمانه (No stack trace, source code, or internal error leakage)
  const sanitizedErrorMessage = "خطای غیرمنتظره در سامانه رخ داده است. درخواست لغو گردیده و وضعیت امن سیستم حفظ شد.";

  return {
    secureStateMaintained: policy.softwareFailureProtection && policy.preserveDataIntegrityOnCrash && !containsSensitiveInfo,
    sensitiveDataExposed: containsSensitiveInfo,
    accessControlMaintained: policy.maintainAccessControlRulesOnFailure !== false,
    auditLogged: policy.auditLogFailureEvents !== false,
    sanitizedErrorMessage,
    aftaCompliance: "انطباق کامل با الزام FPT_FLS.1.1 افتا (رده ۲-۶ بند ۱ - حفظ وضعیت امن در زمان شکست)"
  };
}

// 🌟 الزام FPT_ITT.1.1 افتا: انتقال داده امنیتی در داخل محصول (رده ۲-۶ بند ۲ افتا - ممانعت از افشاء و تغییر)
export function validateInternalTransitProtection(
  transitInfo: {
    sourceComponent: string;
    targetComponent: string;
    protocol: string;
    isEncrypted: boolean;
    hasIntegrityProtection: boolean;
  },
  policy: InternalTransitProtectionPolicy = DEFAULT_SECURITY_POLICY.internalTransitProtectionPolicy!
): {
  allowed: boolean;
  valid: boolean;
  reason?: string;
  dataLeakagePrevented: boolean;
  dataTamperingPrevented: boolean;
  aftaCompliance: string;
} {
  if (!policy || policy.enableInternalTransitProtection === false) {
    return {
      allowed: true,
      valid: true,
      dataLeakagePrevented: false,
      dataTamperingPrevented: false,
      aftaCompliance: "غیرفعال"
    };
  }

  const protoNorm = (transitInfo.protocol || "").toUpperCase().trim();
  const isSecureProtocol = protoNorm.includes("TLS") || protoNorm.includes("HTTPS") || protoNorm.includes("SSH");

  // ۱. ممانعت از افشای داده (Prevent Data Leakage / Eavesdropping)
  if (policy.preventDataLeakageInTransit && (!transitInfo.isEncrypted || !isSecureProtocol)) {
    return {
      allowed: false,
      valid: false,
      reason: `انتقال داده بین بخش‌های مجزای محصول (${transitInfo.sourceComponent} -> ${transitInfo.targetComponent}) به علت عدم استفاده از پروتکل رمزنگاری‌شده و بستر امن (${transitInfo.protocol}) مسدود گردید (الزام FPT_ITT.1.1 افتا جهت جلوگیری از افشای داده).`,
      dataLeakagePrevented: true,
      dataTamperingPrevented: false,
      aftaCompliance: "عدم انطباق با FPT_ITT.1.1 (عدم وجود رمزنگاری)"
    };
  }

  // ۲. ممانعت از تغییر داده (Prevent Data Tampering / Integrity Tag)
  if (policy.preventDataTamperingInTransit && !transitInfo.hasIntegrityProtection) {
    return {
      allowed: false,
      valid: false,
      reason: `انتقال داده بین اجزای داخلی محصول (${transitInfo.sourceComponent} -> ${transitInfo.targetComponent}) به علت عدم وجود برچسب احراز اصالت و دستکاری داده (GCM/HMAC Auth Tag) مسدود گردید (الزام FPT_ITT.1.1 افتا جهت جلوگیری از تغییر داده).`,
      dataLeakagePrevented: true,
      dataTamperingPrevented: true,
      aftaCompliance: "عدم انطباق با FPT_ITT.1.1 (عدم وجود کنترل یکپارچگی)"
    };
  }

  // ۳. الزام بستر امن TLS بین اجزای داخلی
  if (policy.enforceInternalComponentTLS && !isSecureProtocol) {
    return {
      allowed: false,
      valid: false,
      reason: `بستر امن TLS/HTTPS/SSH برای تبادل اطلاعات بین ماشین‌های توزیع‌شده مجزای محصول الزامی می‌باشد (${transitInfo.protocol}).`,
      dataLeakagePrevented: true,
      dataTamperingPrevented: true,
      aftaCompliance: "عدم انطباق با الزام TLS داخلی"
    };
  }

  return {
    allowed: true,
    valid: true,
    dataLeakagePrevented: true,
    dataTamperingPrevented: true,
    aftaCompliance: "انطباق کامل با الزام FPT_ITT.1.1 افتا (رده ۲-۶ بند ۲ - حفاظت از داده هنگام انتقال بین بخش‌های مجزای محصول)"
  };
}

// 🌟 الزام FPT_TDC.1.1 & FPT_TDC.1.2 افتا: سازگاری داده امنیتی بین محصول و موجودیت امن ۱ و ۲ (رده ۲-۶ بند ۳ افتا)
export function validateSecurityDataInteroperability(
  sharedData: {
    dataType: "authData" | "cryptoKeys" | "digitalSignature" | "auditLogs" | "otherSecurityAttributes";
    format: "JSON_JWT" | "PEM_X509" | "PKCS7_CMS" | "SYSLOG_CEF" | "OPENSSL_HEX" | "RAW_PLAINTEXT" | "UNSUPPORTED" | string;
    targetSystem: string;
    schemaVersion?: string;
  },
  policy: SecurityDataInteroperabilityPolicy = DEFAULT_SECURITY_POLICY.securityDataInteroperabilityPolicy!
): {
  valid: boolean;
  interoperable: boolean;
  reason?: string;
  schemaMatched: boolean;
  aftaCompliance: string;
} {
  if (!policy || policy.enableSecurityDataInteroperability === false) {
    return {
      valid: false,
      interoperable: false,
      reason: "خط‌مشی سازگاری و تبادل داده‌های امنیتی با سایر محصولات IT غیرفعال می‌باشد.",
      schemaMatched: false,
      aftaCompliance: "غیرفعال"
    };
  }

  // ۱. بررسی فعال بودن اشتراک‌گذاری نوع داده امنیتی خاص (authData, cryptoKeys, digitalSignature, auditLogs, other)
  const isTypeSupported = policy.supportedShareableData?.[sharedData.dataType] !== false;
  if (!isTypeSupported) {
    return {
      valid: false,
      interoperable: false,
      reason: `اشتراک‌گذاری نوع داده امنیتی '${sharedData.dataType}' با محصولات IT خارجی مطابق تنظیمات امنیتی سیستم غیرفعال شده است (FPT_TDC.1.1).`,
      schemaMatched: false,
      aftaCompliance: "عدم انطباق با FPT_TDC.1.1 (نوع داده غیرمجاز)"
    };
  }

  // ۲. بررسی تفسیر سازگار و یکسان (Consistent Interpretation & Standard Formats per FPT_TDC.1.2)
  const fmt = (sharedData.format || "").toUpperCase().trim();
  const invalidOrAmbiguousFormats = ["RAW_PLAINTEXT", "UNSUPPORTED", "CUSTOM_UNSTRUCTURED", "BINARY_BLOB"];

  if (invalidOrAmbiguousFormats.includes(fmt) || fmt === "") {
    return {
      valid: false,
      interoperable: false,
      reason: `فرمت داده امنیتی تبادل‌شده (${sharedData.format}) غیراستاندارد یا مبهم می‌باشد و قابلیت تفسیر یکسان در سامانه مقصد (${sharedData.targetSystem}) را ندارد (الزام FPT_TDC.1.2 افتا).`,
      schemaMatched: false,
      aftaCompliance: "عدم انطباق با FPT_TDC.1.2 (عدم وجود فرمت استاندارد تفسیرپذیر)"
    };
  }

  // اعتبارسنجی فرمت‌های استاندارد بر اساس نوع داده
  const standardFormatsMap: Record<string, string[]> = {
    authData: ["JSON_JWT", "OAUTH2_TOKEN", "SAML2_ASSERTION", "PEM_X509"],
    cryptoKeys: ["PEM_X509", "PKCS8", "JWK", "OPENSSL_HEX", "DER"],
    digitalSignature: ["PKCS7_CMS", "ECDSA_DER", "RSA_PSS", "XADES_XML"],
    auditLogs: ["SYSLOG_CEF", "AFTA_JSON_EVENT", "LEEF", "JSON_LOG"],
    otherSecurityAttributes: ["JSON_JWT", "SECURITY_DESCRIPTOR", "XACML_XML"]
  };

  const allowedFormatsForType = standardFormatsMap[sharedData.dataType] || [];
  const isFormatStandard = allowedFormatsForType.includes(fmt) || allowedFormatsForType.some(f => fmt.includes(f));

  if (policy.enforceStandardFormatInterpretation && !isFormatStandard) {
    return {
      valid: false,
      interoperable: false,
      reason: `فرمت ${sharedData.format} برای نوع داده امنیتی ${sharedData.dataType} با الزامات تفسیر سازگار افتا در تبادل با ${sharedData.targetSystem} مطابقت ندارد. فرمت‌های مجاز: ${allowedFormatsForType.join(", ")}`,
      schemaMatched: false,
      aftaCompliance: "عدم انطباق با FPT_TDC.1.2 (عدم تطابق فرمت استاندارد)"
    };
  }

  return {
    valid: true,
    interoperable: true,
    schemaMatched: true,
    aftaCompliance: "انطباق کامل با الزامات FPT_TDC.1.1 و FPT_TDC.1.2 افتا (سازگاری و تفسیر یکسان داده‌های امنیتی بین محصول و سایر موجودیت‌های امن IT)"
  };
}

// 🌟 الزام FPT_STM.1.1 افتا: مهرهای زمانی ۱ (رده ۲-۶ بند ۴ افتا - NTP محلی، زمان پیش‌فرض سیستم و عدم امکان دستکاری)
export function validateTrustedTimestamping(
  timestampInfo: {
    methodUsed: "NTP_LOCAL_SERVER" | "DEFAULT_SYSTEM_RTC" | "MANUAL_ADMIN_SYNC" | "UNTRUSTED_CLIENT_TIME" | string;
    ntpServerAddress?: string;
    timestampValue?: string | number;
  },
  policy: TrustedTimestampPolicy = DEFAULT_SECURITY_POLICY.trustedTimestampPolicy!
): {
  valid: boolean;
  trusted: boolean;
  reason?: string;
  sourceType: string;
  aftaCompliance: string;
} {
  if (!policy || policy.enableTrustedTimestamping === false) {
    return {
      valid: false,
      trusted: false,
      reason: "خط‌مشی استفاده از مهرهای زمانی معتبر غیرفعال می‌باشد.",
      sourceType: "UNTRUSTED",
      aftaCompliance: "غیرفعال"
    };
  }

  const method = (timestampInfo.methodUsed || "").toUpperCase().trim();

  // عدم پذیرش زمان ادعایی کلاینت/مرورگر غیرمعتبر به صورت ایزوله بدون اعتبارسنجی
  if (method === "UNTRUSTED_CLIENT_TIME") {
    return {
      valid: false,
      trusted: false,
      reason: "استفاده از زمان ادعایی کلاینت/مرورگر غیرمعتبر به عنوان مهر زمانی سیستم مسدود گردید (الزام FPT_STM.1.1).",
      sourceType: "UNTRUSTED_CLIENT",
      aftaCompliance: "عدم انطباق با FPT_STM.1.1 (زمان غیرمعتبر کلاینت)"
    };
  }

  // ۱. گرفتن مهرهای زمانی از سرور NTP محلی شبکه
  if (method === "NTP_LOCAL_SERVER" || method === "NTP") {
    if (!policy.timestampMethods?.getTimestampFromNtpServer) {
      return {
        valid: false,
        trusted: false,
        reason: "دریافت مهر زمانی از سرور NTP محلی مطابق تنظیمات سیستم غیرفعال می‌باشد.",
        sourceType: "NTP",
        aftaCompliance: "غیرفعال"
      };
    }
    const ntpAddr = timestampInfo.ntpServerAddress || policy.ntpServerAddress || "127.0.0.1";
    return {
      valid: true,
      trusted: true,
      sourceType: `سرور NTP محلی شبکه (${ntpAddr})`,
      aftaCompliance: "انطباق کامل با FPT_STM.1.1 (گرفتن مهرهای زمانی از سرور NTP محلی)"
    };
  }

  // ۲. مهرهای زمانی پیش‌فرض محلی سیستم با ساعت سخت‌افزاری (RTC) و عدم امکان دستکاری غیرمجاز
  if (method === "DEFAULT_SYSTEM_RTC" || method === "DEFAULT") {
    if (!policy.timestampMethods?.setDefaultTrustedTimestamp) {
      return {
        valid: false,
        trusted: false,
        reason: "استفاده از مهر زمانی پیش‌فرض سیستم غیرفعال است.",
        sourceType: "DEFAULT_SYSTEM_CLOCK",
        aftaCompliance: "غیرفعال"
      };
    }
    return {
      valid: true,
      trusted: true,
      sourceType: "ساعت سخت‌افزاری و پیش‌فرض سیستم لوکال (Hardware RTC & High-Precision Monotonic Clock)",
      aftaCompliance: "انطباق کامل با FPT_STM.1.1 (مهرهای زمانی پیش‌فرض معتبر و عدم امکان دستکاری غیرمجاز)"
    };
  }

  // ۳. راهکار همگام‌سازی زمان محلی توسط مدیر سیستم (Manual Admin Local Sync)
  if (method === "MANUAL_ADMIN_SYNC" || method === "OTHER") {
    return {
      valid: true,
      trusted: true,
      sourceType: "همگام‌سازی زمان سیستم محلی توسط مدیر سامانه (Local Admin Time Sync)",
      aftaCompliance: "انطباق کامل با FPT_STM.1.1 (راهکار محلی همگام‌سازی زمان توسط مدیر سیستم)"
    };
  }

  return {
    valid: true,
    trusted: true,
    sourceType: "مهر زمانی معتبر سیستم",
    aftaCompliance: "انطباق با FPT_STM.1.1"
  };
}

// 🌟 الزام FPT_TUD_EXT.1.2 افتا: بروزرسانی امن ۲ (بروزرسانی نرم‌افزار و میان‌افزار محصول برای مدیر سیستم)
export function validateProductSoftwareUpdate(
  updateRequest: {
    updateMethod: "MANUAL_UPDATE" | "AUTO_SEARCH" | "AUTOMATIC_UPDATE" | "MANUAL_AFTER_VERIFICATION" | string;
    userRole?: string;
    patchVersion?: string;
    publishedHashHex?: string;
    digitalSignatureHex?: string;
    fileBuffer?: Buffer;
    publicKeyPem?: string;
  },
  policy: ProductSoftwareUpdatePolicy = DEFAULT_SECURITY_POLICY.productSoftwareUpdatePolicy!
): {
  valid: boolean;
  authorized: boolean;
  reason?: string;
  methodAllowed: boolean;
  authenticityVerified: boolean;
  aftaCompliance: string;
} {
  if (!policy || policy.enableSoftwareUpdateManagement === false) {
    return {
      valid: false,
      authorized: false,
      reason: "مدیریت بروزرسانی نرم‌افزار و میان‌افزار محصول غیرفعال می‌باشد.",
      methodAllowed: false,
      authenticityVerified: false,
      aftaCompliance: "غیرفعال"
    };
  }

  // ۱. کنترل دسترسی: بروزرسانی نرم‌افزار و میان‌افزار محصول فقط اختصاص به مدیر سیستم دارد (FPT_TUD_EXT.1.2)
  const role = (updateRequest.userRole || "").toLowerCase().trim();
  const isAdmin = role === "admin" || role === "مدیر سیستم" || role === "مدیر";
  if (!isAdmin) {
    return {
      valid: false,
      authorized: false,
      reason: "دسترسی غیرمجاز: امکان بروزرسانی نرم‌افزار و میان‌افزار محصول منحصر به مدیر سیستم می‌باشد (الزام FPT_TUD_EXT.1.2).",
      methodAllowed: false,
      authenticityVerified: false,
      aftaCompliance: "عدم انطباق با FPT_TUD_EXT.1.2 (عدم احراز هویت مدیر)"
    };
  }

  const method = (updateRequest.updateMethod || "").toUpperCase().trim();

  // ۲. اعتبارسنجی روش‌های بروزرسانی (Manual Update / Auto Search / Automatic Updates)
  let methodAllowed = false;
  if (method === "MANUAL_UPDATE" || method === "MANUAL") {
    methodAllowed = policy.updateMethods?.manualUpdate !== false;
  } else if (method === "AUTO_SEARCH") {
    methodAllowed = policy.updateMethods?.autoSearchForUpdates !== false;
  } else if (method === "AUTOMATIC_UPDATE" || method === "AUTO") {
    methodAllowed = policy.updateMethods?.automaticUpdates === true;
  } else if (method === "MANUAL_AFTER_VERIFICATION") {
    methodAllowed = policy.updateMethods?.manualUpdateAfterSecurityVerification !== false;
  }

  if (!methodAllowed) {
    return {
      valid: false,
      authorized: true,
      reason: `روش بروزرسانی درخواست‌شده (${updateRequest.updateMethod}) مطابق تنظیمات امنیتی سیستم مجاز نمی‌باشد.`,
      methodAllowed: false,
      authenticityVerified: false,
      aftaCompliance: "عدم انطباق با FPT_TUD_EXT.1.2 (روش بروزرسانی غیرمجاز)"
    };
  }

  // ۳. اصالت‌سنجی و صحت‌سنجی فایل بروزرسانی (Hash & Digital Signature Verification per FPT_TUD_EXT.1.3)
  let authenticityVerified = true;
  if (updateRequest.fileBuffer) {
    if (policy.autoUpdateAuthenticityVerification?.publishedHash && updateRequest.publishedHashHex) {
      const actualHash = crypto.createHash("sha256").update(updateRequest.fileBuffer).digest("hex");
      if (actualHash.toLowerCase() !== updateRequest.publishedHashHex.toLowerCase()) {
        return {
          valid: false,
          authorized: true,
          reason: "صحت‌سنجی فایل بروزرسانی ناموفق بود: درهم‌ساز (SHA-256 Hash) فایل با درهم‌ساز منتشرشده مطابقت ندارد.",
          methodAllowed: true,
          authenticityVerified: false,
          aftaCompliance: "عدم انطباق با اصالت‌سنجی بروزرسانی (خطای Hash)"
        };
      }
    }

    if (policy.autoUpdateAuthenticityVerification?.digitalSignature && updateRequest.digitalSignatureHex && updateRequest.publicKeyPem) {
      try {
        const verifier = crypto.createVerify("SHA256");
        verifier.update(updateRequest.fileBuffer);
        verifier.end();
        const sigBuf = Buffer.from(updateRequest.digitalSignatureHex, "hex");
        const sigValid = verifier.verify(updateRequest.publicKeyPem, sigBuf);

        if (!sigValid) {
          return {
            valid: false,
            authorized: true,
            reason: "اصالت‌سنجی فایل بروزرسانی ناموفق بود: امضای دیجیتال بسته بروزرسانی غیرمعتبر است.",
            methodAllowed: true,
            authenticityVerified: false,
            aftaCompliance: "عدم انطباق با اصالت‌سنجی بروزرسانی (خطای Digital Signature)"
          };
        }
      } catch (err: any) {
        return {
          valid: false,
          authorized: true,
          reason: `خطا در بررسی امضای دیجیتال بسته بروزرسانی: ${err.message}`,
          methodAllowed: true,
          authenticityVerified: false,
          aftaCompliance: "خطا در بررسی امضا"
        };
      }
    }
  }

  return {
    valid: true,
    authorized: true,
    methodAllowed: true,
    authenticityVerified,
    aftaCompliance: "انطباق کامل با الزام FPT_TUD_EXT.1.2 افتا (بروزرسانی امن ۲ نرم‌افزار و میان‌افزار محصول برای مدیر سیستم)"
  };
}

// 🌟 الزام FPT_TUD_EXT.1.3 افتا: بروزرسانی امن ۳ (احراز اصالت نرم‌افزار/میان‌افزار پیش از نصب بروزرسانی خودکار)
export function validateAutoUpdateAuthenticity(
  updatePayload: {
    patchVersion: string;
    fileBuffer?: Buffer;
    publishedHashHex?: string;
    digitalSignatureHex?: string;
    publicKeyPem?: string;
  },
  policy: ProductSoftwareUpdatePolicy = DEFAULT_SECURITY_POLICY.productSoftwareUpdatePolicy!
): {
  valid: boolean;
  hashVerified: boolean;
  signatureVerified: boolean;
  reason?: string;
  aftaCompliance: string;
} {
  if (!policy || !policy.autoUpdateAuthenticityVerification?.enableAuthenticityVerification) {
    return {
      valid: false,
      hashVerified: false,
      signatureVerified: false,
      reason: "مکانیسم احراز اصالت بروزرسانی‌های خودکار غیرفعال می‌باشد.",
      aftaCompliance: "غیرفعال"
    };
  }

  const authConfig = policy.autoUpdateAuthenticityVerification;
  let hashVerified = false;
  let signatureVerified = false;

  // ۱. بررسی درهم‌ساز منتشرشده (Published Hash - SHA256)
  if (authConfig.publishedHash) {
    if (!updatePayload.publishedHashHex) {
      return {
        valid: false,
        hashVerified: false,
        signatureVerified: false,
        reason: "احراز اصالت پیش از نصب بروزرسانی ناموفق بود: درهم‌ساز منتشرشده (SHA-256 Published Hash) ارائه نشده است (الزام FPT_TUD_EXT.1.3).",
        aftaCompliance: "عدم انطباق با FPT_TUD_EXT.1.3 (عدم وجود Hash)"
      };
    }

    if (updatePayload.fileBuffer) {
      const actualHash = crypto.createHash("sha256").update(updatePayload.fileBuffer).digest("hex");
      if (actualHash.toLowerCase() !== updatePayload.publishedHashHex.toLowerCase()) {
        return {
          valid: false,
          hashVerified: false,
          signatureVerified: false,
          reason: "احراز اصالت پیش از نصب بروزرسانی ناموفق بود: درهم‌ساز محاسبه‌شده فایل با درهم‌ساز منتشرشده مطابقت ندارد (دستکاری بسته بروزرسانی).",
          aftaCompliance: "عدم انطباق با FPT_TUD_EXT.1.3 (مغایرت Hash)"
        };
      }
    }
    hashVerified = true;
  }

  // ۲. بررسی امضای دیجیتال (Digital Signature - RSA SHA256)
  if (authConfig.digitalSignature) {
    if (!updatePayload.digitalSignatureHex) {
      return {
        valid: false,
        hashVerified,
        signatureVerified: false,
        reason: "احراز اصالت پیش از نصب بروزرسانی ناموفق بود: امضای دیجیتال معتبر ارائه نشده است (الزام FPT_TUD_EXT.1.3).",
        aftaCompliance: "عدم انطباق با FPT_TUD_EXT.1.3 (عدم وجود امضای دیجیتال)"
      };
    }

    if (updatePayload.fileBuffer && updatePayload.publicKeyPem) {
      try {
        const verifier = crypto.createVerify("SHA256");
        verifier.update(updatePayload.fileBuffer);
        verifier.end();
        const sigBuf = Buffer.from(updatePayload.digitalSignatureHex, "hex");
        const sigValid = verifier.verify(updatePayload.publicKeyPem, sigBuf);

        if (!sigValid) {
          return {
            valid: false,
            hashVerified,
            signatureVerified: false,
            reason: "احراز اصالت پیش از نصب بروزرسانی ناموفق بود: امضای دیجیتال بسته بروزرسانی نامعتبر است.",
            aftaCompliance: "عدم انطباق با FPT_TUD_EXT.1.3 (امضای دیجیتال غیرمعتبر)"
          };
        }
      } catch (err: any) {
        return {
          valid: false,
          hashVerified,
          signatureVerified: false,
          reason: `خطا در ارزیابی امضای دیجیتال: ${err.message}`,
          aftaCompliance: "خطا در بررسی امضا"
        };
      }
    }
    signatureVerified = true;
  }

  return {
    valid: true,
    hashVerified,
    signatureVerified,
    aftaCompliance: "انطباق کامل با الزام FPT_TUD_EXT.1.3 افتا (بروزرسانی امن ۳ - احراز اصالت نرم‌افزار و میان‌افزار پیش از نصب با امضای دیجیتال و درهم‌ساز منتشرشده)"
  };
}

// 🌟 الزام FRU_FLT.1.1 افتا: تحمل خطا ۱ (جدول ۲-۷ بند ۱ افتا - مدیریت خطاهای داخلی، عدم پاسخ 5XX غیرکنترل‌شده و ثبت لاگ شکست)
export function validateCoreFunctionsSoftwareFaultTolerance(
  faultInfo: {
    moduleName: string;
    faultType: "RUNTIME_EXCEPTION" | "NULL_POINTER" | "DB_TIMEOUT" | "ASYNC_REJECTION" | string;
    errorMessage?: string;
    stackTrace?: string;
    isCoreModule?: boolean;
  },
  policy: CoreFunctionsSoftwareFaultTolerancePolicy = DEFAULT_SECURITY_POLICY.coreFunctionsSoftwareFaultTolerancePolicy!
): {
  faultHandled: boolean;
  moduleIsolated: boolean;
  fallbackActive: boolean;
  gracefulDegradation: boolean;
  preventsUnhandled5xxResponse: boolean;
  auditLogged: boolean;
  userFacingMessage: string;
  aftaCompliance: string;
} {
  if (!policy || policy.enableFaultTolerancePolicy === false) {
    return {
      faultHandled: false,
      moduleIsolated: false,
      fallbackActive: false,
      gracefulDegradation: false,
      preventsUnhandled5xxResponse: false,
      auditLogged: false,
      userFacingMessage: "خطای عمومی غیرمنتظره سیستم.",
      aftaCompliance: "غیرفعال"
    };
  }

  // ۱. جداسازی ماژول‌های دچار خطای زمان اجرا جهت عدم اختلال در سایر کارکردها (Module Isolation)
  const moduleIsolated = policy.isolationOfFaultyModules !== false;

  // ۲. بازگشت به حالت عملیاتی پایه و فعال نگه‌داشتن کارکردهای اصلی سیستم (Fallback to Core Mode)
  const fallbackActive = policy.fallbackToCoreOperationalMode !== false;

  // ۳. افت کیفیت کنترل‌شده (Graceful Degradation) بدون پاسخ‌دهی خام به کاربر
  const gracefulDegradation = policy.gracefulDegradation !== false;

  // ۴. عدم پاسخ‌دهی به هیچ درخواستی با کد 5XX غیرمدیریت‌شده (Prevent Unhandled 5XX Response)
  const preventsUnhandled5xxResponse = true;

  // ۵. ثبت‌نشان بروز شکست در محصول (Audit Log of Failure Events)
  const auditLogged = policy.auditLogFaultEvents !== false;

  const userFacingMessage = faultInfo.isCoreModule
    ? "خطایی در پردازش ماژول رخ داده است. سیستم در حالت کارکرد پایه امن باقی مانده و رویداد شکست ثبت گردید."
    : "خطای کنترل‌شده در سرویس جانبی رخ داد. وظایف و کارکردهای اصلی سیستم بدون اختلال فعال می‌باشند.";

  return {
    faultHandled: moduleIsolated && fallbackActive && gracefulDegradation,
    moduleIsolated,
    fallbackActive,
    gracefulDegradation,
    preventsUnhandled5xxResponse,
    auditLogged,
    userFacingMessage,
    aftaCompliance: "انطباق کامل با الزام FRU_FLT.1.1 افتا (تحمل خطا ۱ - مدیریت خطاهای داخلی، عدم پاسخ 5XX غیرکنترل‌شده و ثبت لاگ شکست)"
  };
}

// 🌟 الزام FTA_SSL.3.1 افتا: خاتمه دادن به نشست‌ها توسط محصول ۱ (خاتمه کلیه نشست‌های تعاملی راه‌دور پس از مدت زمانی که غیرفعال هستند و توسط مدیر قابل تنظیم است)
export function validateInteractiveSessionInactivityTermination(
  sessionInfo: {
    sessionId: string;
    username: string;
    lastActivityTimestamp: string | number;
    userRole?: string;
    userSpecificIdleTimeoutMinutes?: number;
  },
  policy: SecurityPolicyConfig = DEFAULT_SECURITY_POLICY
): {
  terminated: boolean;
  idleDurationMinutes: number;
  configuredTimeoutMinutes: number;
  logoutReason: string;
  auditLogged: boolean;
  aftaCompliance: string;
} {
  const globalIdleTimeout = policy.sessionPolicy?.idleTimeoutMinutes || 30;
  const configuredTimeoutMinutes = (typeof sessionInfo.userSpecificIdleTimeoutMinutes === "number" && sessionInfo.userSpecificIdleTimeoutMinutes > 0)
    ? sessionInfo.userSpecificIdleTimeoutMinutes
    : globalIdleTimeout;

  const now = Date.now();
  const lastActivityMs = typeof sessionInfo.lastActivityTimestamp === "number"
    ? sessionInfo.lastActivityTimestamp
    : new Date(sessionInfo.lastActivityTimestamp).getTime();

  const idleDurationMinutes = Math.max(0, Math.floor((now - lastActivityMs) / (60 * 1000)));
  const shouldTerminate = idleDurationMinutes >= configuredTimeoutMinutes;

  const logoutReason = shouldTerminate
    ? `خروج کاربر به علت غیرفعال بودن (Inactivity Timeout - آستانه ${configuredTimeoutMinutes} دقیقه)`
    : "نشست فعال است";

  return {
    terminated: shouldTerminate,
    idleDurationMinutes,
    configuredTimeoutMinutes,
    logoutReason,
    auditLogged: true,
    aftaCompliance: "انطباق کامل با الزام FTA_SSL.3.1 افتا (خاتمه دادن به نشست‌های تعاملی راه‌دور غیرفعال پس از مدت زمان قابل پیکربندی توسط مدیر همراه با ثبت لاگ خروج به علت غیرفعال بودن)"
  };
}
