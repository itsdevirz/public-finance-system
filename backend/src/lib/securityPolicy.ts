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

export interface SecurityPolicyConfig {
  passwordPolicy: PasswordPolicy;
  lockoutPolicy: LockoutPolicy;
  sessionPolicy: SessionPolicy;
  entityAccessPolicies?: EntityAccessPolicy[];
  activeUserSecurityChangePolicy?: ActiveUserSecurityChangePolicy;
  inactiveEntityAccessPolicies?: InactiveEntityAccessPolicies;
  inactiveEntityOperationsPolicy?: InactiveEntityOperationsPolicy;
  inactiveEntityPolicyCriteria?: InactiveEntityPolicyCriteria;
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
  }
};

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
