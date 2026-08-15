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

export interface SecurityPolicyConfig {
  passwordPolicy: PasswordPolicy;
  lockoutPolicy: LockoutPolicy;
  sessionPolicy: SessionPolicy;
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
    maxConcurrentSessions: 3,
    idleTimeoutMinutes: 30,
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
    inactiveMetadataOps: { readOnlyMetadata: true, auditLog: true, checkIntegrity: true },
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
  }
};

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
