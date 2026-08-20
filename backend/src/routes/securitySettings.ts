import { Hono } from "hono";
import { ObjectId } from "mongodb";
import { getDb } from "../db/index.js";
import { DEFAULT_SECURITY_POLICY } from "../lib/securityPolicy.js";
import { logAuditEvent, AFTA_LOG_EVENT_TYPES, verifyLogIntegrity, signExistingLogs, runAuditLogRetentionAndRotation } from "../lib/auditLogger.js";
import { requireRole } from "../middleware/rbacMiddleware.js";
import { sendAdminThresholdNotification } from "../lib/notifier.js";
import { pruneExpiredSessions } from "../lib/sessionHelper.js";

const router = new Hono();

// GET /api/security/policy - Read security policy
router.get("/policy", async (c) => {
  try {
    const db = getDb();
    const config = await db.collection("system_settings").findOne({ key: "security_policy" });
    const policy = config?.value ? { ...DEFAULT_SECURITY_POLICY, ...config.value } : DEFAULT_SECURITY_POLICY;
    return c.json({
      success: true,
      data: policy
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// PUT /api/security/policy - Update security policy (Admin only)
router.put("/policy", requireRole(["admin"]), async (c) => {
  const payload = (c.get as any)("jwtPayload");
  try {
    const body = await c.req.json();
    const db = getDb();

    const maxFailedAttempts = Number(body.lockoutPolicy?.maxFailedAttempts);
    if (body.lockoutPolicy?.maxFailedAttempts !== undefined && (isNaN(maxFailedAttempts) || maxFailedAttempts <= 0 || !Number.isInteger(maxFailedAttempts))) {
      return c.json({ success: false, message: "تعداد تلاش‌های ناموفق احراز هویت باید یک عدد صحیح مثبت (بزرگتر از صفر) باشد." }, 400);
    }

    const existingConfig = await db.collection("system_settings").findOne({ key: "security_policy" });
    const existingVal = existingConfig?.value || DEFAULT_SECURITY_POLICY;

    const newPolicy = {
      passwordPolicy: {
        minLength: Number(body.passwordPolicy?.minLength) || 8,
        requireUppercase: !!body.passwordPolicy?.requireUppercase,
        requireLowercase: !!body.passwordPolicy?.requireLowercase,
        requireNumbers: !!body.passwordPolicy?.requireNumbers,
        requireSpecialChars: !!body.passwordPolicy?.requireSpecialChars,
      },
      lockoutPolicy: {
        maxFailedAttempts: maxFailedAttempts > 0 ? maxFailedAttempts : 5,
        lockoutDurationMinutes: Math.max(1, Number(body.lockoutPolicy?.lockoutDurationMinutes) || 15),
      },
      sessionPolicy: {
        tokenExpiresInHours: Math.max(1, Number(body.sessionPolicy?.tokenExpiresInHours) || 8),
        maxConcurrentSessions: Math.max(1, Number(body.sessionPolicy?.maxConcurrentSessions) || 3),
        idleTimeoutMinutes: Math.max(1, Number(body.sessionPolicy?.idleTimeoutMinutes) || 30),
      },
      entityAccessPolicies: body.entityAccessPolicies || existingVal.entityAccessPolicies || DEFAULT_SECURITY_POLICY.entityAccessPolicies,
      activeUserSecurityChangePolicy: body.activeUserSecurityChangePolicy || existingVal.activeUserSecurityChangePolicy || DEFAULT_SECURITY_POLICY.activeUserSecurityChangePolicy,
      inactiveEntityAccessPolicies: body.inactiveEntityAccessPolicies || existingVal.inactiveEntityAccessPolicies || DEFAULT_SECURITY_POLICY.inactiveEntityAccessPolicies,
      inactiveEntityOperationsPolicy: body.inactiveEntityOperationsPolicy || existingVal.inactiveEntityOperationsPolicy || DEFAULT_SECURITY_POLICY.inactiveEntityOperationsPolicy,
      inactiveEntityPolicyCriteria: body.inactiveEntityPolicyCriteria || existingVal.inactiveEntityPolicyCriteria || DEFAULT_SECURITY_POLICY.inactiveEntityPolicyCriteria,
      activeInactiveInteractionPolicy: body.activeInactiveInteractionPolicy || existingVal.activeInactiveInteractionPolicy || DEFAULT_SECURITY_POLICY.activeInactiveInteractionPolicy,
      activeToInactivePreventionRules: body.activeToInactivePreventionRules || existingVal.activeToInactivePreventionRules || DEFAULT_SECURITY_POLICY.activeToInactivePreventionRules,
      resourceSanitizationPolicy: body.resourceSanitizationPolicy || existingVal.resourceSanitizationPolicy || DEFAULT_SECURITY_POLICY.resourceSanitizationPolicy,
      userDataInputAccessPolicy: body.userDataInputAccessPolicy || existingVal.userDataInputAccessPolicy || DEFAULT_SECURITY_POLICY.userDataInputAccessPolicy,
      secureDataTransportPolicy: body.secureDataTransportPolicy || existingVal.secureDataTransportPolicy || DEFAULT_SECURITY_POLICY.secureDataTransportPolicy,
      userDataEgressAccessPolicy: body.userDataEgressAccessPolicy || existingVal.userDataEgressAccessPolicy || DEFAULT_SECURITY_POLICY.userDataEgressAccessPolicy,
      targetedDataEgressRules: body.targetedDataEgressRules || existingVal.targetedDataEgressRules || DEFAULT_SECURITY_POLICY.targetedDataEgressRules,
      sensitiveDataIntegrityPolicy: body.sensitiveDataIntegrityPolicy || existingVal.sensitiveDataIntegrityPolicy || DEFAULT_SECURITY_POLICY.sensitiveDataIntegrityPolicy,
      dataIntegrityErrorResponsePolicy: body.dataIntegrityErrorResponsePolicy || existingVal.dataIntegrityErrorResponsePolicy || DEFAULT_SECURITY_POLICY.dataIntegrityErrorResponsePolicy,
      productRolesDefinitionPolicy: body.productRolesDefinitionPolicy || existingVal.productRolesDefinitionPolicy || DEFAULT_SECURITY_POLICY.productRolesDefinitionPolicy,
      userRoleAssignmentPolicy: body.userRoleAssignmentPolicy || existingVal.userRoleAssignmentPolicy || DEFAULT_SECURITY_POLICY.userRoleAssignmentPolicy,
      secureFailureStatePolicy: body.secureFailureStatePolicy || existingVal.secureFailureStatePolicy || DEFAULT_SECURITY_POLICY.secureFailureStatePolicy,
      internalTransitProtectionPolicy: body.internalTransitProtectionPolicy || existingVal.internalTransitProtectionPolicy || DEFAULT_SECURITY_POLICY.internalTransitProtectionPolicy,
      securityDataInteroperabilityPolicy: body.securityDataInteroperabilityPolicy || existingVal.securityDataInteroperabilityPolicy || DEFAULT_SECURITY_POLICY.securityDataInteroperabilityPolicy,
      trustedTimestampPolicy: body.trustedTimestampPolicy || existingVal.trustedTimestampPolicy || DEFAULT_SECURITY_POLICY.trustedTimestampPolicy,
      productSoftwareUpdatePolicy: body.productSoftwareUpdatePolicy || existingVal.productSoftwareUpdatePolicy || DEFAULT_SECURITY_POLICY.productSoftwareUpdatePolicy,
      coreFunctionsSoftwareFaultTolerancePolicy: body.coreFunctionsSoftwareFaultTolerancePolicy || existingVal.coreFunctionsSoftwareFaultTolerancePolicy || DEFAULT_SECURITY_POLICY.coreFunctionsSoftwareFaultTolerancePolicy,
      lastSuccessfulSessionNoticePolicy: body.lastSuccessfulSessionNoticePolicy || existingVal.lastSuccessfulSessionNoticePolicy || DEFAULT_SECURITY_POLICY.lastSuccessfulSessionNoticePolicy,
      lastFailedSessionNoticePolicy: body.lastFailedSessionNoticePolicy || existingVal.lastFailedSessionNoticePolicy || DEFAULT_SECURITY_POLICY.lastFailedSessionNoticePolicy,
      preserveAccessRecordsPolicy: body.preserveAccessRecordsPolicy || existingVal.preserveAccessRecordsPolicy || DEFAULT_SECURITY_POLICY.preserveAccessRecordsPolicy,
      sessionEstablishmentPreventionPolicy: body.sessionEstablishmentPreventionPolicy || existingVal.sessionEstablishmentPreventionPolicy || DEFAULT_SECURITY_POLICY.sessionEstablishmentPreventionPolicy,
      trustedChannelPolicy: body.trustedChannelPolicy || existingVal.trustedChannelPolicy || DEFAULT_SECURITY_POLICY.trustedChannelPolicy,
      httpsProtocolPolicy: body.httpsProtocolPolicy || existingVal.httpsProtocolPolicy || DEFAULT_SECURITY_POLICY.httpsProtocolPolicy,
      tlsClientPolicy: body.tlsClientPolicy || existingVal.tlsClientPolicy || DEFAULT_SECURITY_POLICY.tlsClientPolicy,
      tlsServerPolicy: body.tlsServerPolicy || existingVal.tlsServerPolicy || DEFAULT_SECURITY_POLICY.tlsServerPolicy,
      mutualTlsPolicy: body.mutualTlsPolicy || existingVal.mutualTlsPolicy || DEFAULT_SECURITY_POLICY.mutualTlsPolicy,
      certificateValidationPolicy: body.certificateValidationPolicy || existingVal.certificateValidationPolicy || DEFAULT_SECURITY_POLICY.certificateValidationPolicy,
      sshProtocolPolicy: body.sshProtocolPolicy || existingVal.sshProtocolPolicy || DEFAULT_SECURITY_POLICY.sshProtocolPolicy,
    };

    await db.collection("system_settings").updateOne(
      { key: "security_policy" },
      { $set: { key: "security_policy", value: newPolicy, updatedAt: new Date().toISOString() } },
      { upsert: true }
    );

    // ۴. تمامی تغییرات در پیکربندی و رفتار کارکردی محصول
    await logAuditEvent({
      userId: payload.sub,
      username: payload.username,
      userRole: payload.role,
      action: AFTA_LOG_EVENT_TYPES.FUNCTION_BEHAVIOR_CHANGE,
      eventType: AFTA_LOG_EVENT_TYPES.FUNCTION_BEHAVIOR_CHANGE,
      resource: "system_settings",
      result: "SUCCESS",
      ip: c.req.header("x-forwarded-for") || "127.0.0.1",
      userAgent: c.req.header("user-agent"),
      details: { newPolicy }
    });

    // ثبت اختصاصی تغییرات حداقل طول رمز عبور (کلید 10080) و کاراکترهای مورد نیاز رمز عبور (کلید 10081)
    const formatCharPattern = (p: any) => {
      if (!p) return "!@#$%^&*";
      const required: string[] = [];
      if (p.requireUppercase) required.push("A-Z");
      if (p.requireLowercase) required.push("a-z");
      if (p.requireNumbers) required.push("0-9");
      if (p.requireSpecialChars) required.push("!@#$%^&*");
      return required.length > 0 ? required.join(" ") : "بدون محدودیت";
    };

    const clientIp = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "127.0.0.1";
    const currentAdminUsername = payload.username || "admin";
    const currentAdminRole = payload.role || "admin";

    const oldMinLength = existingVal.passwordPolicy?.minLength ?? 8;
    const newMinLength = newPolicy.passwordPolicy?.minLength ?? 8;
    if (oldMinLength !== newMinLength) {
      await logAuditEvent({
        userId: payload.sub,
        username: currentAdminUsername,
        userRole: currentAdminRole,
        action: `حداقل تعداد کاراکتر های رمز عبور از ${oldMinLength} به ${newMinLength} تغییر یافت`,
        eventType: "PASSWORD_VERIFY_ATTEMPT_LOG",
        resource: "کلید های پیکر بندی سیستم",
        result: "SUCCESS",
        ip: clientIp,
        userAgent: c.req.header("user-agent"),
        details: {
          key: "10080",
          tableName: "کلید های پیکر بندی سیستم",
          isPasswordVerifyAttemptLog: true,
          oldVal: oldMinLength,
          newVal: newMinLength
        }
      });
    }

    const oldCharPattern = formatCharPattern(existingVal.passwordPolicy);
    const newCharPattern = formatCharPattern(newPolicy.passwordPolicy);
    if (oldCharPattern !== newCharPattern) {
      await logAuditEvent({
        userId: payload.sub,
        username: currentAdminUsername,
        userRole: currentAdminRole,
        action: `کاراکترهای مورد نیاز برای رمز عبور از ${oldCharPattern} به ${newCharPattern} تغییر یافت`,
        eventType: "PASSWORD_VERIFY_ATTEMPT_LOG",
        resource: "کلید های پیکر بندی سیستم",
        result: "SUCCESS",
        ip: clientIp,
        userAgent: c.req.header("user-agent"),
        details: {
          key: "10081",
          tableName: "کلید های پیکر بندی سیستم",
          isPasswordVerifyAttemptLog: true,
          oldVal: oldCharPattern,
          newVal: newCharPattern
        }
      });
    }

    return c.json({ success: true, message: "خط‌مشی‌های امنیتی با موفقیت به‌روزرسانی شد.", data: newPolicy });
  } catch (error: any) {
    await logAuditEvent({
      userId: payload?.sub,
      username: payload?.username,
      action: AFTA_LOG_EVENT_TYPES.AUDIT_LOG_CONFIG_CHANGE,
      eventType: AFTA_LOG_EVENT_TYPES.AUDIT_LOG_CONFIG_CHANGE,
      resource: "system_settings",
      result: "FAILURE",
      ip: c.req.header("x-forwarded-for") || "127.0.0.1",
      errorCode: 500,
      details: { error: error.message }
    });

    return c.json({ success: false, message: error.message }, 500);
  }
});

const DEFAULT_AUDIT_CONFIG = {
  email: true,
  sms: true,
  systemMessage: true,
  suspendLogin: true,
  formComplete: true,
  new: true,
  delete: true,
  issue: true,
  login: true,
  failedLogin: true,
  edit: true
};

const AUDIT_CONFIG_LABELS: Record<string, string> = {
  email: "ارسال Email",
  sms: "ارسال SMS",
  systemMessage: "ارسال پیام سامانه",
  suspendLogin: "تعلیق ورود",
  formComplete: "تکمیل فرم",
  new: "جدید",
  delete: "حذف",
  issue: "صدور",
  login: "ورود",
  failedLogin: "ورود ناموفق",
  edit: "ویرایش"
};

// GET /api/security/audit-config - Read logging config (AFTA Item 4)
router.get("/audit-config", async (c) => {
  try {
    const db = getDb();
    const doc = await db.collection("system_settings").findOne({ key: "audit_config" });
    const config = doc?.value ? { ...DEFAULT_AUDIT_CONFIG, ...doc.value } : DEFAULT_AUDIT_CONFIG;
    return c.json({ success: true, data: config });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// POST /api/security/audit-config - Update logging config & log audit event (AFTA Item 4)
router.post("/audit-config", async (c) => {
  const payload = (c.get as any)("jwtPayload");
  try {
    const newConfig = await c.req.json();
    const db = getDb();
    const doc = await db.collection("system_settings").findOne({ key: "audit_config" });
    const oldConfig = doc?.value ? { ...DEFAULT_AUDIT_CONFIG, ...doc.value } : DEFAULT_AUDIT_CONFIG;

    await db.collection("system_settings").updateOne(
      { key: "audit_config" },
      { $set: { key: "audit_config", value: newConfig, updatedAt: new Date() } },
      { upsert: true }
    );

    // Identify changed keys and log AUDIT_LOG_CONFIG_CHANGE for each change
    const clientIp = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "127.0.0.1";
    const userRole = payload?.role || "مدیر سیستم";
    const username = payload?.username || "netel";

    let changeCount = 0;
    for (const key of Object.keys(newConfig)) {
      if (oldConfig[key] !== newConfig[key]) {
        changeCount++;
        const label = AUDIT_CONFIG_LABELS[key] || key;
        const statusStr = newConfig[key] ? "فعال" : "غیرفعال";
        const actionDesc = `${label} - ${statusStr}`;

        await logAuditEvent({
          userId: payload?.sub || "admin_01",
          username,
          userRole,
          action: actionDesc,
          eventType: AFTA_LOG_EVENT_TYPES.AUDIT_LOG_CONFIG_CHANGE,
          resource: "موارد رویدادنگاری",
          method: "POST",
          result: "SUCCESS",
          ip: clientIp,
          userAgent: c.req.header("user-agent"),
          details: { item: key, label, enabled: newConfig[key], previousState: oldConfig[key] }
        });
      }
    }

    // If no specific key changed, still issue a generic change event if requested
    if (changeCount === 0) {
      await logAuditEvent({
        userId: payload?.sub || "admin_01",
        username,
        userRole,
        action: "بررسی و تایید پیکربندی موارد رویدادنگاری",
        eventType: AFTA_LOG_EVENT_TYPES.AUDIT_LOG_CONFIG_CHANGE,
        resource: "موارد رویدادنگاری",
        method: "POST",
        result: "SUCCESS",
        ip: clientIp,
        userAgent: c.req.header("user-agent"),
        details: { config: newConfig }
      });
    }

    return c.json({ success: true, message: "پیکربندی ثبت‌نشان‌ها با موفقیت به‌روزرسانی شد.", data: newConfig });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});


// POST /api/security/validate-user-data - User data validation & import access control (AFTA Items 7 & 14)
router.post("/validate-user-data", async (c) => {
  const payload = (c.get as any)("jwtPayload");
  const body = await c.req.json().catch(() => ({}));
  const clientIp = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "127.0.0.1";
  const username = payload?.username || "admin";
  const userRole = payload?.role || "مدیر سیستم";

  const {
    type = "ATTACHMENT_SUCCESS",
    operation = "ADD", // "ADD" | "DELETE" | "IMPORT"
    originalFileName = "1M.xlsx",
    attachmentName,
    fileSizeBytes = 1048576, // 1MB
    docType = "8",
    docCount = "1",
    dataType = "1",
    taskId = "27117",
    taskRotationId = "72456",
    docId = "38604",
    attachmentId = "25137"
  } = body;

  // ── ویژگی‌های امنیتی و خط‌مشی کنترل دسترسی داده کاربری (۴ شرط الزام افتا) ──
  // ۱. نوع داده (DataType)
  // ۲. حجم و اندازه (Max 10MB)
  // ۳. فرمت (Disallow executable/dangerous formats)
  // ۴. تعداد دفعات import / تعداد سند (Max 50 docs per import)

  const allowedFormats = [".xlsx", ".xls", ".doc", ".docx", ".pdf", ".png", ".jpg", ".jpeg", ".csv", ".txt", ".zip"];
  const ext = originalFileName.substring(originalFileName.lastIndexOf(".")).toLowerCase() || ".xlsx";
  const isFormatAllowed = allowedFormats.includes(ext);

  const maxSizeBytes = 10 * 1024 * 1024; // 10MB
  const isSizeAllowed = fileSizeBytes <= maxSizeBytes;

  const maxDocsPerBatch = 50;
  const isDocCountAllowed = Number(docCount) <= maxDocsPerBatch;

  if (type === "FILE_CORRUPTED_ERROR" || !isFormatAllowed || !isSizeAllowed || !isDocCountAllowed) {
    const fileSizeKb = Math.round(fileSizeBytes / 1024);
    const actionDesc = `Message : فرمت یا حجم داده کاربری ارسالی غیرمجاز می‌باشد (فرمت: ${ext}، حجم: ${fileSizeKb}KB)`;
    await logAuditEvent({
      userId: payload?.sub || "admin_01",
      username,
      userRole,
      action: actionDesc,
      eventType: AFTA_LOG_EVENT_TYPES.USER_DATA_VALIDATION_FAILURE,
      resource: "داده‌های کاربری",
      method: "POST",
      result: "FAILURE",
      ip: clientIp,
      errorCode: 400,
      userAgent: c.req.header("user-agent"),
      details: { error: "Validation Failed", format: ext, sizeKb: fileSizeKb, docCount }
    });

    return c.json({
      success: false,
      message: "فرمت یا حجم داده کاربری ارسالی غیرمجاز می‌باشد"
    }, 400);
  }

  const generatedUniqueName = attachmentName || `${crypto.randomUUID()}${ext}`;

  if (operation === "DELETE") {
    // ردیف ۲ تصویر راهنما: لاگ حذف ضمیمه با مقدار کلید واقعی
    const actionDesc = `AttachmentName: '${generatedUniqueName}' OrginalAttachmentName: '${originalFileName}' TaskId: '${taskId}' TaskRotationId: '${taskRotationId}' DocId: '${docId}' DocType: '${docType}' DocCount: '${docCount}' DataType: '${dataType}' IsAttached: 'True' Type: '0'`;
    await logAuditEvent({
      userId: payload?.sub || "admin_01",
      username,
      userRole,
      action: actionDesc,
      eventType: AFTA_LOG_EVENT_TYPES.USER_DATA_IMPORT_ATTEMPT,
      resource: "ضمیمه",
      method: "DELETE",
      result: "SUCCESS",
      ip: clientIp,
      userAgent: c.req.header("user-agent"),
      details: {
        operation: "DELETE",
        attachmentId: attachmentId,
        key: attachmentId,
        fileName: originalFileName,
        uniqueName: generatedUniqueName
      }
    });

    return c.json({
      success: true,
      message: "حذف ضمیمه و داده کاربری با موفقیت تایید و لاگ گردید."
    });
  }

  // ردیف ۱ تصویر راهنما: لاگ افزودن/ایمپورت ضمیمه با مقدار کلید 0
  const actionDesc = `AttachmentName: '${generatedUniqueName}' OrginalAttachmentName: '${originalFileName}' TaskId: '${taskId}' TaskRotationId: '${taskRotationId}' DocId: '${docId}' DocType: '${docType}' DocCount: '${docCount}' DataType: '${dataType}' IsAttached: 'True' Type: '0'`;
  await logAuditEvent({
    userId: payload?.sub || "admin_01",
    username,
    userRole,
    action: actionDesc,
    eventType: AFTA_LOG_EVENT_TYPES.USER_DATA_IMPORT_ATTEMPT,
    resource: "ضمیمه",
    method: "POST",
    result: "SUCCESS",
    ip: clientIp,
    userAgent: c.req.header("user-agent"),
    details: {
      operation: "ADD",
      key: "0",
      fileName: originalFileName,
      uniqueName: generatedUniqueName,
      docId,
      docType,
      dataType
    }
  });

  return c.json({
    success: true,
    message: "بررسی صحت و ورود داده کاربری/ضمیمه با موفقیت تایید و لاگ گردید."
  });
});

// POST /api/security/validate-egress - Validate data egress and export policy (AFTA Items 8 & 9)
router.post("/validate-egress", async (c) => {
  try {
    const payload = (c.get as any)("jwtPayload");
    const userRole = payload?.role || "حسابدار";
    const body = await c.req.json().catch(() => ({}));
    const { exportType = "CSV", recordCount = 1, fileSizeMB = 1, destination } = body;

    const db = getDb();
    const config = await db.collection("system_settings").findOne({ key: "security_policy" });
    const policy = config?.value ? { ...DEFAULT_SECURITY_POLICY, ...config.value } : DEFAULT_SECURITY_POLICY;

    const egressPolicy = policy.userDataEgressAccessPolicy || DEFAULT_SECURITY_POLICY.userDataEgressAccessPolicy!;
    const targetedRules = policy.targetedDataEgressRules || DEFAULT_SECURITY_POLICY.targetedDataEgressRules!;

    // 1. Validate User Data Egress Access Policy (Item 8)
    const { validateUserDataEgressAccessPolicy, validateTargetedDataEgressRules } = await import("../lib/securityPolicy.js");
    const egressCheck = validateUserDataEgressAccessPolicy({ exportType, recordCount, fileSizeMB, formatValid: true }, egressPolicy);
    if (!egressCheck.allowed) {
      await logAuditEvent({
        userId: payload?.sub,
        username: payload?.username,
        userRole,
        action: AFTA_LOG_EVENT_TYPES.SECURITY_FUNCTION_FAILURE,
        eventType: AFTA_LOG_EVENT_TYPES.SECURITY_FUNCTION_FAILURE,
        resource: c.req.path,
        method: "POST",
        result: "FAILURE",
        ip: c.req.header("x-forwarded-for") || "127.0.0.1",
        userAgent: c.req.header("user-agent"),
        errorCode: 403,
        details: { reason: "ممانعت از خروج داده (بند ۸ افتا)", details: egressCheck.reason }
      });
      return c.json({ success: false, allowed: false, message: egressCheck.reason }, 403);
    }

    // 2. Validate Targeted Data Egress Rules (Item 9)
    // Non-admin users attempting untargeted export when preventUntargetedDataEgress is enabled get blocked!
    const isUntargeted = targetedRules.preventUntargetedDataEgress && userRole !== "admin" && !destination;
    const targetedCheck = validateTargetedDataEgressRules({
      hasTargetDestination: !isUntargeted,
      destinationAuthorized: true,
      isBulkWithoutApproval: targetedRules.requireAdminApprovalForBulkEgress && userRole !== "admin" && recordCount > 1000
    }, targetedRules);

    if (!targetedCheck.allowed) {
      await logAuditEvent({
        userId: payload?.sub,
        username: payload?.username,
        userRole,
        action: AFTA_LOG_EVENT_TYPES.SECURITY_FUNCTION_FAILURE,
        eventType: AFTA_LOG_EVENT_TYPES.SECURITY_FUNCTION_FAILURE,
        resource: c.req.path,
        method: "POST",
        result: "FAILURE",
        ip: c.req.header("x-forwarded-for") || "127.0.0.1",
        userAgent: c.req.header("user-agent"),
        errorCode: 403,
        details: { reason: "ممانعت از خروج بدون هدف داده کاربری (بند ۹ افتا)", details: targetedCheck.reason }
      });
      return c.json({ success: false, allowed: false, message: targetedCheck.reason }, 403);
    }

    // Log successful egress check
    await logAuditEvent({
      userId: payload?.sub,
      username: payload?.username,
      userRole,
      action: AFTA_LOG_EVENT_TYPES.DATA_EXPORT_ATTEMPT,
      eventType: AFTA_LOG_EVENT_TYPES.DATA_EXPORT_ATTEMPT,
      resource: c.req.path,
      method: "POST",
      result: "SUCCESS",
      ip: c.req.header("x-forwarded-for") || "127.0.0.1",
      userAgent: c.req.header("user-agent"),
      details: { exportType, recordCount, destination: destination || "مجاز" }
    });

    return c.json({ success: true, allowed: true, message: "خروج داده طبق خط‌مشی مجاز می‌باشد." });
  } catch (error: any) {
    return c.json({ success: false, allowed: false, message: error.message }, 500);
  }
});

// GET /api/security/entity-policies - Read active entity access control policies
router.get("/entity-policies", async (c) => {
  try {
    const db = getDb();
    const config = await db.collection("system_settings").findOne({ key: "security_policy" });
    const entityPolicies = config?.value?.entityAccessPolicies || DEFAULT_SECURITY_POLICY.entityAccessPolicies;
    return c.json({
      success: true,
      data: entityPolicies
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// PUT /api/security/entity-policies - Update active entity access control policies (Admin only)
router.put("/entity-policies", requireRole(["admin"]), async (c) => {
  const payload = (c.get as any)("jwtPayload");
  try {
    const body = await c.req.json();
    const db = getDb();

    if (!Array.isArray(body.entityAccessPolicies)) {
      return c.json({ success: false, message: "فرمت خط‌مشی‌های کنترل دسترسی نامعتبر است." }, 400);
    }

    const config = await db.collection("system_settings").findOne({ key: "security_policy" });
    const currentVal = config?.value || DEFAULT_SECURITY_POLICY;
    const updatedPolicy = {
      ...currentVal,
      entityAccessPolicies: body.entityAccessPolicies
    };

    await db.collection("system_settings").updateOne(
      { key: "security_policy" },
      { $set: { key: "security_policy", value: updatedPolicy, updatedAt: new Date().toISOString() } },
      { upsert: true }
    );

    await logAuditEvent({
      userId: payload.sub,
      username: payload.username,
      userRole: payload.role,
      action: "به‌روزرسانی خط‌مشی‌های کنترل دسترسی موجودیت‌ها و عملیات",
      eventType: AFTA_LOG_EVENT_TYPES.FUNCTION_BEHAVIOR_CHANGE,
      resource: "entity_access_policies",
      result: "SUCCESS",
      ip: c.req.header("x-forwarded-for") || "127.0.0.1",
      userAgent: c.req.header("user-agent"),
      details: { updatedPoliciesCount: body.entityAccessPolicies.length }
    });

    return c.json({
      success: true,
      message: "خط‌مشی‌های کنترل دسترسی موجودیت‌ها و عملیات با موفقیت به‌روزرسانی شد.",
      data: body.entityAccessPolicies
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// GET /api/security/audit-logs - Advanced audit log retrieval (Admin or Authorized users)
router.get("/audit-logs", async (c) => {
  const payload = (c.get as any)("jwtPayload");
  if (!payload) {
    return c.json({ success: false, message: "احراز هویت الزامی است" }, 401);
  }
  const userRole = payload.role || "حسابدار";
  const userPermissions = payload.permissions || {};
  const isAuthorized = userRole === "admin" || userRole === "مدیر سیستم" || userPermissions["audit.view"] === true || userPermissions["audit.read"] === true || userPermissions["audit_logs"] === true;

  if (!isAuthorized) {
    await logAuditEvent({
      userId: payload?.sub || "unauthorized_user",
      username: payload?.username || "unauthorized_user",
      userRole,
      action: "تلاش غیر مجاز جهت دسترسی به صفحه لاگ های سیستمی",
      eventType: AFTA_LOG_EVENT_TYPES.AUDIT_LOG_READ_FAILURE,
      resource: c.req.path,
      method: c.req.method,
      result: "FAILURE",
      ip: c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "127.0.0.1",
      userAgent: c.req.header("user-agent"),
      errorCode: 403,
      details: { reason: "تلاش‌های ناموفق برای خواندن اطلاعات از ثبت‌نشان‌ها (الزام ۲ افتا)", requiredPermission: "audit.view" }
    });
    return c.json({ success: false, message: "دسترسی غیرمجاز. فقط مدیر سیستم یا کاربران دارنده مجوز مجاز به مشاهده ثبت نشان‌ها هستند." }, 403);
  }
  try {
    const db = getDb();
    const { username, action, eventType, result, osType, ip, resource, shamsiDate, search, sortBy = "createdAt", sortOrder = "desc", page = "1", limit = "50" } = c.req.query();
    
    const query: any = {};
    if (username) query.username = { $regex: username, $options: "i" };
    if (action) query.action = { $regex: action, $options: "i" };
    if (eventType) query.eventType = { $regex: eventType, $options: "i" };
    if (result) query.result = result;
    if (osType) query.osType = osType;
    if (ip) query.ip = { $regex: ip, $options: "i" };
    if (resource) query.resource = { $regex: resource, $options: "i" };
    if (shamsiDate) query.shamsiDate = { $regex: shamsiDate, $options: "i" };

    if (search && typeof search === "string" && search.trim() !== "" && search !== "undefined" && search !== "null" && !search.includes("function")) {
      const searchRegex = { $regex: search.trim(), $options: "i" };
      query.$or = [
        { username: searchRegex },
        { userFullName: searchRegex },
        { action: searchRegex },
        { eventType: searchRegex },
        { resource: searchRegex },
        { ip: searchRegex },
        { osName: searchRegex },
        { browser: searchRegex },
        { shamsiDate: searchRegex }
      ];
    }

    const validSortFields: Record<string, string> = {
      createdAt: "createdAt",
      shamsiDateTime: "createdAt",
      username: "username",
      action: "action",
      osName: "osName",
      ip: "ip",
      durationMs: "durationMs"
    };

    const sortField = validSortFields[sortBy] || "createdAt";
    const sortDirection = sortOrder === "asc" ? 1 : -1;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const total = await db.collection("audit_logs").countDocuments(query);
    const logs = await db.collection("audit_logs")
      .find(query)
      .sort({ [sortField]: sortDirection })
      .skip(skip)
      .limit(limitNum)
      .toArray();

    const enrichedLogs = logs.map((log: any) => ({
      ...log,
      isIntegrityValid: verifyLogIntegrity(log)
    }));

    // ۳. خواندن اطلاعات از ثبت‌نشان‌ها (موفق)
    await logAuditEvent({
      userId: payload.sub,
      username: payload.username,
      userRole: payload.role || "مدیر",
      action: "مشاهده اطلاعات ممیزی سیستم",
      eventType: AFTA_LOG_EVENT_TYPES.AUDIT_LOG_READ_SUCCESS,
      resource: "/api/security/audit-logs",
      result: "SUCCESS",
      ip: c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "127.0.0.1",
      details: { query, totalReturned: enrichedLogs.length }
    });

    return c.json({
      success: true,
      data: enrichedLogs,
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) }
    });
  } catch (error: any) {
    // ۲. تلاش‌های ناموفق برای خواندن اطلاعات از ثبت‌نشان‌ها
    await logAuditEvent({
      userId: payload?.sub,
      username: payload?.username,
      action: AFTA_LOG_EVENT_TYPES.AUDIT_LOG_READ_FAILURE,
      eventType: AFTA_LOG_EVENT_TYPES.AUDIT_LOG_READ_FAILURE,
      resource: "audit_logs",
      result: "FAILURE",
      ip: c.req.header("x-forwarded-for") || "127.0.0.1",
      errorCode: 500,
      details: { error: error.message }
    });

    return c.json({ success: false, message: error.message }, 500);
  }
});

// POST /api/security/simulate-read-failure - Simulate a failed audit log read attempt for AFTA compliance
router.post("/simulate-read-failure", async (c) => {
  const payload = (c.get as any)("jwtPayload");
  const clientIp = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "192.168.1.105";
  const userAgent = c.req.header("user-agent") || "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";
  
  await logAuditEvent({
    userId: payload?.sub || "usr_unauthorized_01",
    username: payload?.username || "unauthorized_user",
    userRole: payload?.role || "حسابدار",
    action: AFTA_LOG_EVENT_TYPES.AUDIT_LOG_READ_FAILURE,
    eventType: AFTA_LOG_EVENT_TYPES.AUDIT_LOG_READ_FAILURE,
    resource: "/api/security/audit-logs",
    method: "GET",
    result: "FAILURE",
    ip: clientIp,
    userAgent,
    errorCode: 403,
    details: {
      error: "Access Denied: Attempted unauthorized read access to security audit log records",
      requestedEndpoint: "/api/security/audit-logs",
      location: "ایران (تهران)"
    }
  });

  return c.json({
    success: true,
    message: "رویداد تلاش ناموفق برای خواندن ثبت‌نشان‌ها با ثبت دقیق IP، آدرس مسیر و متاداده‌ها ایجاد گردید."
  });
});

// GET /api/security/audit-logs/verify-integrity - Complete database integrity check (Admin only)
router.get("/audit-logs/verify-integrity", requireRole(["admin"]), async (c) => {
  const payload = (c.get as any)("jwtPayload");
  try {
    await signExistingLogs();
    const db = getDb();
    const allLogs = await db.collection("audit_logs").find({}).limit(2000).toArray();
    
    let validCount = 0;
    let tamperedCount = 0;
    const tamperedEntries: any[] = [];

    for (const log of allLogs) {
      const isValid = verifyLogIntegrity(log);
      if (isValid) {
        validCount++;
      } else {
        tamperedCount++;
        tamperedEntries.push({
          _id: log._id,
          username: log.username,
          action: log.action,
          shamsiDateTime: log.shamsiDateTime,
          timestamp: log.timestamp
        });
      }
    }

    await logAuditEvent({
      userId: payload.sub,
      username: payload.username,
      action: "اسکن و اعتبارسنجی سلامت اصالت ثبت‌نشان‌ها",
      eventType: AFTA_LOG_EVENT_TYPES.AUDIT_LOG_READ_SUCCESS,
      resource: "audit_logs_integrity",
      result: tamperedCount === 0 ? "SUCCESS" : "FAILURE",
      ip: c.req.header("x-forwarded-for") || "127.0.0.1",
      details: { totalScanned: allLogs.length, validCount, tamperedCount }
    });

    return c.json({
      success: true,
      totalScanned: allLogs.length,
      validCount,
      tamperedCount,
      isFullySecure: tamperedCount === 0,
      tamperedEntries
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// GET /api/security/active-sessions - List active user sessions (Admin gets all, regular user gets own)
router.get("/active-sessions", async (c) => {
  try {
    const payload = (c.get as any)("jwtPayload");
    const db = getDb();
    const isAdmin = payload?.role === "admin";
    const userIdFilter = isAdmin ? undefined : payload?.sub;

    const sessions = await pruneExpiredSessions(db, userIdFilter);
    return c.json({ success: true, data: sessions });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// POST /api/security/revoke-session - Revoke session / token (Admin or Session Initiator User)
router.post("/revoke-session", async (c) => {
  try {
    const payload = (c.get as any)("jwtPayload");
    const { token, sessionId } = await c.req.json();
    const db = getDb();
    const isAdmin = payload?.role === "admin";

    let queryFilter: any = {};
    if (token) {
      queryFilter = { token };
    } else if (sessionId) {
      try {
        if (typeof sessionId === "string" && ObjectId.isValid(sessionId)) {
          queryFilter = { $or: [{ _id: sessionId }, { _id: new ObjectId(sessionId) }] };
        } else {
          queryFilter = { _id: sessionId };
        }
      } catch (_) {
        queryFilter = { _id: sessionId };
      }
    } else {
      return c.json({ success: false, message: "شناسه نشست یا توکن جهت ابطال الزامی است." }, 400);
    }

    const session = await db.collection("active_sessions").findOne(queryFilter);

    if (session) {
      // Permission check: User must be Admin or the initiator of the session
      const isInitiator = session.userId?.toString() === payload?.sub || session.username === payload?.username;
      if (!isAdmin && !isInitiator) {
        return c.json({ success: false, message: "دسترسی غیرمجاز. شما تنها مجاز به ابطال نشست‌های خودتان هستید." }, 403);
      }

      const sessionToken = session.token || token;
      if (sessionToken) {
        await db.collection("revoked_tokens").updateOne(
          { token: sessionToken },
          { $set: { token: sessionToken, revokedAt: new Date().toISOString(), reason: isAdmin ? "خروج توسط مدیر سیستم" : "خاتمه نشست توسط کاربر آغازگر" } },
          { upsert: true }
        );
      }
      await db.collection("active_sessions").deleteOne({ _id: session._id });
    } else if (token && isAdmin) {
      // Direct token revocation by admin
      await db.collection("revoked_tokens").updateOne(
        { token },
        { $set: { token, revokedAt: new Date().toISOString(), reason: "خروج توسط مدیر سیستم" } },
        { upsert: true }
      );
      await db.collection("active_sessions").deleteOne({ token });
    } else {
      return c.json({ success: false, message: "نشست یافت نشد یا قبلاً باطل شده است." }, 404);
    }

    await logAuditEvent({
      userId: payload.sub,
      username: payload.username,
      userRole: payload.role,
      action: isAdmin ? AFTA_LOG_EVENT_TYPES.INACTIVE_SESSION_TERMINATED_BY_ADMIN : AFTA_LOG_EVENT_TYPES.SESSION_TERMINATED_BY_USER,
      eventType: isAdmin ? AFTA_LOG_EVENT_TYPES.INACTIVE_SESSION_TERMINATED_BY_ADMIN : AFTA_LOG_EVENT_TYPES.SESSION_TERMINATED_BY_USER,
      resource: "active_sessions",
      result: "SUCCESS",
      ip: c.req.header("x-forwarded-for") || "127.0.0.1",
      userAgent: c.req.header("user-agent"),
      details: { sessionId, tokenRevoked: true, terminatedByAdmin: isAdmin }
    });

    return c.json({ success: true, message: "نشست کاربر با موفقیت باطل شد." });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// GET /api/security/storage-status - دریافت وضعیت ظرفیت ذخیره‌سازی ثبت‌نشان‌ها و پیام‌های هشدار
router.get("/storage-status", requireRole(["admin"]), async (c) => {
  try {
    const db = getDb();
    const totalLogs = await db.collection("audit_logs").countDocuments();
    const threshold = 10000;
    const notifications = await db.collection("system_notifications")
      .find({ recipientRole: "admin" })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    const unreadCount = notifications.filter(n => !n.read).length;

    return c.json({
      success: true,
      totalLogs,
      threshold,
      percentageUsed: Number(((totalLogs / threshold) * 100).toFixed(1)),
      unreadNotificationsCount: unreadCount,
      notifications
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// POST /api/security/test-threshold-alert - شبیه‌سازی و تست ارسال پیام هشدار حد آستانه ۱۰,۰۰۰ به ادمین
router.post("/test-threshold-alert", requireRole(["admin"]), async (c) => {
  try {
    const db = getDb();
    const totalLogs = await db.collection("audit_logs").countDocuments();
    
    // ارسال پیام هشدار آزمایشی در سامانه
    await sendAdminThresholdNotification({
      currentCount: Math.max(totalLogs, 10000),
      threshold: 10000,
      actionTaken: "تست آزمایشی اعلان سامانه هنگام سرریز حد آستانه ۱۰,۰۰۰ رکورد",
      isSimulated: true
    });

    return c.json({
      success: true,
      message: "هشدار آزمایشی حد آستانه ۱۰,۰۰۰ لاگ با موفقیت در سامانه ثبت و صادر گردید."
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// POST /api/security/notifications/mark-read - علامت‌گذاری پیام‌ها به‌عنوان خوانده‌شده
router.post("/notifications/mark-read", requireRole(["admin"]), async (c) => {
  try {
    const db = getDb();
    await db.collection("system_notifications").updateMany(
      { recipientRole: "admin" },
      { $set: { read: true } }
    );
    return c.json({ success: true, message: "پیام‌ها با موفقیت به‌عنوان خوانده‌شده علامت‌گذاری شدند." });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// POST /api/security/prune-logs - اجرای فوری عملیات پاکسازی لاگ‌های قدیمی‌تر از ۳ ماه و چرخش ظرفیت ۱۰,۰۰۰
router.post("/prune-logs", requireRole(["admin"]), async (c) => {
  try {
    const result = await runAuditLogRetentionAndRotation();
    return c.json({
      success: true,
      message: `عملیات پاکسازی و چرخش لاگ‌ها با موفقیت اجرا شد. (پاکسازی ${result.prunedByAge} لاگ قدیمی‌تر از ۳ ماه، چرخش ${result.prunedByCapacity} لاگ ظرفیت ۱۰,۰۰۰)`,
      result
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

export default router;
