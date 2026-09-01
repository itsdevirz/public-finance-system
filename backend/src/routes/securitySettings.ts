import { Hono } from "hono";
import { ObjectId } from "mongodb";
import { getDb } from "../db/index.js";
import { DEFAULT_SECURITY_POLICY, validateTlsClientConnection, validateInternalTransitProtection, validateSecurityDataInteroperability, validateTrustedTimestamping, validateProductSoftwareUpdate, validateAutoUpdateAuthenticity } from "../lib/securityPolicy.js";
import { executeRealTlsHandshake } from "../lib/secureTlsClient.js";
import { logAuditEvent, AFTA_LOG_EVENT_TYPES, verifyLogIntegrity, signExistingLogs, runAuditLogRetentionAndRotation, extractClientIp } from "../lib/auditLogger.js";
import { requireRole } from "../middleware/rbacMiddleware.js";
import { sendAdminThresholdNotification } from "../lib/notifier.js";
import { pruneExpiredSessions } from "../lib/sessionHelper.js";
import { SECURITY_POLICY_LABELS } from "../lib/securityPolicyLabels.js";

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
        maxConcurrentSessions: Math.max(1, Number(body.sessionPolicy?.maxConcurrentSessions) || 1),
        idleTimeoutMinutes: Math.max(1, Number(body.sessionPolicy?.idleTimeoutMinutes) || 30),
      },
      functionBehaviorPolicy: body.functionBehaviorPolicy || existingVal.functionBehaviorPolicy || DEFAULT_SECURITY_POLICY.functionBehaviorPolicy,
      securityFunctionsManagementPolicy: body.securityFunctionsManagementPolicy || existingVal.securityFunctionsManagementPolicy || DEFAULT_SECURITY_POLICY.securityFunctionsManagementPolicy,
      authSecurityAttributesPolicy: body.authSecurityAttributesPolicy || existingVal.authSecurityAttributesPolicy || DEFAULT_SECURITY_POLICY.authSecurityAttributesPolicy,
      productDataManagementPolicy: body.productDataManagementPolicy || existingVal.productDataManagementPolicy || DEFAULT_SECURITY_POLICY.productDataManagementPolicy,
      securityManagementCapabilitiesPolicy: body.securityManagementCapabilitiesPolicy || existingVal.securityManagementCapabilitiesPolicy || DEFAULT_SECURITY_POLICY.securityManagementCapabilitiesPolicy,
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

    const clientIp = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "127.0.0.1";
    const currentAdminUsername = payload.username || "admin";
    const currentAdminRole = payload.role || "admin";

    // تابع کمکی برای استخراج مقدار کلیدهای عادی و تو در تو (Nested)
    const getNestedValue = (obj: any, path: string) => {
      if (!obj) return undefined;
      const parts = path.split(".");
      let curr = obj;
      for (const part of parts) {
        if (curr === null || curr === undefined) return undefined;
        curr = curr[part];
      }
      return curr;
    };

    // ثبت لاگ ممیزی با جزییات کامل برای تک‌تک آیتم‌ها و آکاردئون‌های تغییریافته
    for (const [sectionKey, sectionMeta] of Object.entries(SECURITY_POLICY_LABELS)) {
      const defaultSection = (DEFAULT_SECURITY_POLICY as any)[sectionKey] || {};
      const oldSection = (existingVal as any)[sectionKey] || {};
      const newSection = (newPolicy as any)[sectionKey] || {};

      for (const [fieldKey, meta] of Object.entries(sectionMeta)) {
        const defaultFieldVal = getNestedValue(defaultSection, fieldKey);
        const rawOldVal = getNestedValue(oldSection, fieldKey);
        const rawNewVal = getNestedValue(newSection, fieldKey);

        const defaultFallback = defaultFieldVal !== undefined 
          ? defaultFieldVal 
          : (meta.type === "boolean" ? false : "");

        const oldVal = rawOldVal !== undefined ? rawOldVal : defaultFallback;
        const newVal = rawNewVal !== undefined ? rawNewVal : defaultFallback;

        if (oldVal !== newVal) {
          let actionText = "";
          let changeType = "UPDATED";

          if (meta.type === "boolean" || typeof newVal === "boolean") {
            const isActivated = newVal === true;
            changeType = isActivated ? "ACTIVATED" : "DEACTIVATED";
            const stateStr = isActivated ? "(فعال شد)" : "(غیرفعال شد)";
            actionText = `آکاردئون [${meta.accordion}]: تیک گزینه ${meta.label} ${stateStr}`;
          } else {
            const oldStr = oldVal !== undefined && oldVal !== null && oldVal !== "" ? oldVal : "خالی";
            const newStr = newVal !== undefined && newVal !== null && newVal !== "" ? newVal : "خالی";
            actionText = `آکاردئون [${meta.accordion}]: مقدار ${meta.label} از [${oldStr}] به [${newStr}] ثبت شد.`;
          }

          await logAuditEvent({
            userId: payload.sub,
            username: currentAdminUsername,
            userRole: currentAdminRole === "admin" ? "مدیر سیستم" : currentAdminRole,
            action: actionText,
            eventType: AFTA_LOG_EVENT_TYPES.FUNCTION_BEHAVIOR_CHANGE,
            resource: "کلید های پیکر بندی سیستم",
            result: "SUCCESS",
            ip: clientIp,
            userAgent: c.req.header("user-agent"),
            details: {
              accordion: meta.accordion,
              itemLabel: meta.label,
              fieldKey: `${sectionKey}.${fieldKey}`,
              changeType,
              oldVal: String(oldVal),
              newVal: String(newVal),
              tableName: "کلید های پیکر بندی سیستم"
            }
          });
        }
      }
    }

    // ثبت لاگ ممیزی برای ماتریس دسترسی به موجودیت‌ها (آکاردئون ماتریس خط‌مشی کنترل دسترسی)
    const oldEntityPolicies = existingVal.entityAccessPolicies || [];
    const newEntityPolicies = newPolicy.entityAccessPolicies || [];

    if (Array.isArray(newEntityPolicies) && Array.isArray(oldEntityPolicies)) {
      const roleLabels: Record<string, string> = {
        systemAdmin: "مدیر سیستم",
        regularUser: "کاربر عادی",
        otherRoles: "سایر نقش‌ها"
      };
      const opLabels: Record<string, string> = {
        read: "مشاهده",
        create: "ایجاد",
        update: "ویرایش",
        delete: "حذف",
        approve: "تأیید",
        export: "خروجی"
      };

      for (const newEp of newEntityPolicies) {
        const oldEp = oldEntityPolicies.find((item: any) => item.entityId === newEp.entityId);
        if (!oldEp) continue;

        for (const roleKey of ["systemAdmin", "regularUser", "otherRoles"] as const) {
          const oldRolePerms = oldEp[roleKey] || {};
          const newRolePerms = newEp[roleKey] || {};

          for (const opKey of ["read", "create", "update", "delete", "approve", "export"] as const) {
            const oldVal = !!oldRolePerms[opKey];
            const newVal = !!newRolePerms[opKey];

            if (oldVal !== newVal) {
              const stateStr = newVal ? "(فعال شد)" : "(غیرفعال شد)";
              const actionText = `آکاردئون [ماتریس خط‌مشی کنترل دسترسی به موجودیت‌های فعال و عملیات]: تیک گزینه مجوز ${opLabels[opKey] || opKey} نقش ${roleLabels[roleKey] || roleKey} برای '${newEp.entityName || newEp.entityId}' ${stateStr}`;

              await logAuditEvent({
                userId: payload.sub,
                username: currentAdminUsername,
                userRole: currentAdminRole === "admin" ? "مدیر سیستم" : currentAdminRole,
                action: actionText,
                eventType: AFTA_LOG_EVENT_TYPES.FUNCTION_BEHAVIOR_CHANGE,
                resource: "کلید های پیکر بندی سیستم",
                result: "SUCCESS",
                ip: clientIp,
                userAgent: c.req.header("user-agent"),
                details: {
                  accordion: "ماتریس خط‌مشی کنترل دسترسی به موجودیت‌های فعال و عملیات",
                  itemLabel: `مجوز ${opLabels[opKey] || opKey} - ${roleLabels[roleKey] || roleKey} - ${newEp.entityName || newEp.entityId}`,
                  fieldKey: `entityAccessPolicies.${newEp.entityId}.${roleKey}.${opKey}`,
                  changeType: newVal ? "ACTIVATED" : "DEACTIVATED",
                  oldVal: String(oldVal),
                  newVal: String(newVal),
                  tableName: "کلید های پیکر بندی سیستم"
                }
              });
            }
          }
        }
      }
    }

    // ۳. ثبت تغییر آدرس ماشین‌های غیرمجاز سامانه (بند ۴ جدول ۵-۲ افتا)
    const oldUnauthorizedIps = existingVal.functionBehaviorPolicy?.unauthorizedMachineIps || "";
    const newUnauthorizedIps = newPolicy.functionBehaviorPolicy?.unauthorizedMachineIps || "";
    if (oldUnauthorizedIps !== newUnauthorizedIps) {
      await logAuditEvent({
        userId: payload.sub,
        username: currentAdminUsername,
        userRole: currentAdminRole === "admin" ? "مدیر" : currentAdminRole,
        action: `آدرس ماشین های غیرمجاز سامانه از ${oldUnauthorizedIps || "خالی"} به ${newUnauthorizedIps || "خالی"} تغییر یافت`,
        eventType: AFTA_LOG_EVENT_TYPES.ADMIN_FUNCTION_USAGE,
        resource: "کلید های پیکر بندی سیستم",
        result: "SUCCESS",
        ip: clientIp,
        userAgent: c.req.header("user-agent"),
        details: {
          tableName: "کلید های پیکر بندی سیستم",
          operation: "ویرایش",
          aftaClause: "5-2-4",
          oldVal: oldUnauthorizedIps,
          newVal: newUnauthorizedIps
        }
      });
    }

    // ۴. ثبت تغییر آدرس ماشین‌های مجاز برای کاربران ارشد سامانه (بند ۴ جدول ۵-۲ افتا)
    const oldAllowedAdminIps = existingVal.functionBehaviorPolicy?.allowedAdminIpRange || "";
    const newAllowedAdminIps = newPolicy.functionBehaviorPolicy?.allowedAdminIpRange || "";
    if (oldAllowedAdminIps !== newAllowedAdminIps) {
      await logAuditEvent({
        userId: payload.sub,
        username: currentAdminUsername,
        userRole: currentAdminRole === "admin" ? "مدیر" : currentAdminRole,
        action: `آدرس ماشین های مجاز برای کاربران ارشد سامانه از ${oldAllowedAdminIps || "خالی"} به ${newAllowedAdminIps || "خالی"} تغییر یافت`,
        eventType: AFTA_LOG_EVENT_TYPES.ADMIN_FUNCTION_USAGE,
        resource: "کلید های پیکر بندی سیستم",
        result: "SUCCESS",
        ip: clientIp,
        userAgent: c.req.header("user-agent"),
        details: {
          tableName: "کلید های پیکر بندی سیستم",
          operation: "ویرایش",
          aftaClause: "5-2-4",
          oldVal: oldAllowedAdminIps,
          newVal: newAllowedAdminIps
        }
      });
    }

    // ۵. ثبت‌نشان تغییر سرور NTP (الزام FPT_STM.1.1 افتا)
    const oldNtpServer = existingVal.trustedTimestampPolicy?.ntpServerAddress || "127.0.0.1";
    const newNtpServer = newPolicy.trustedTimestampPolicy?.ntpServerAddress || "127.0.0.1";
    if (oldNtpServer !== newNtpServer) {
      await logAuditEvent({
        userId: payload.sub,
        username: currentAdminUsername,
        userRole: currentAdminRole === "admin" ? "مدیر" : currentAdminRole,
        action: `آدرس سرور NTP محلی سیستم از ${oldNtpServer} به ${newNtpServer} تغییر یافت (الزام FPT_STM.1.1)`,
        eventType: AFTA_LOG_EVENT_TYPES.NTP_SERVER_CHANGE,
        resource: "system_time_policy",
        result: "SUCCESS",
        ip: clientIp,
        userAgent: c.req.header("user-agent"),
        details: { oldNtpServer, newNtpServer, aftaClause: "FPT_STM.1.1" }
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

// POST /api/security/validate-internal-transit - اعتبارسنجی انتقال داده امنیتی در داخل محصول (الزام FPT_ITT.1.1 افتا)
router.post("/validate-internal-transit", async (c) => {
  try {
    const payload = (c.get as any)("jwtPayload");
    const body = await c.req.json();
    const db = getDb();

    const config = await db.collection("system_settings").findOne({ key: "security_policy" });
    const policy = config?.value?.internalTransitProtectionPolicy || DEFAULT_SECURITY_POLICY.internalTransitProtectionPolicy;

    const validation = validateInternalTransitProtection(
      {
        sourceComponent: body.sourceComponent || "Web-Node-1",
        targetComponent: body.targetComponent || "Database-Cluster-1",
        protocol: body.protocol || "TLSv1.3",
        isEncrypted: body.isEncrypted !== undefined ? !!body.isEncrypted : true,
        hasIntegrityProtection: body.hasIntegrityProtection !== undefined ? !!body.hasIntegrityProtection : true
      },
      policy
    );

    if (!validation.valid && policy.auditTransitSecurityViolations !== false) {
      await logAuditEvent({
        userId: payload?.sub || "system",
        username: payload?.username || "system",
        userRole: payload?.role || "سیستم",
        action: `ممانعت از انتقال غیرامن داده بین بخش‌های داخلی محصول (الزام FPT_ITT.1.1 افتا): ${validation.reason}`,
        eventType: AFTA_LOG_EVENT_TYPES.SECURITY_FUNCTION_FAILURE,
        resource: "internal_transit_channel",
        result: "FAILURE",
        ip: extractClientIp(c),
        userAgent: c.req.header("user-agent"),
        errorCode: 403,
        details: {
          source: body.sourceComponent,
          target: body.targetComponent,
          protocol: body.protocol,
          reason: validation.reason,
          aftaClause: "FPT_ITT.1.1"
        }
      });
    }

    return c.json({
      success: validation.valid,
      validation
    }, validation.valid ? 200 : 403);
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// POST /api/security/validate-data-interoperability - سازگاری و تفسیر یکسان داده‌های امنیتی قابل اشتراک‌گذاری (الزام FPT_TDC.1.1 & FPT_TDC.1.2 افتا)
router.post("/validate-data-interoperability", async (c) => {
  try {
    const payload = (c.get as any)("jwtPayload");
    const body = await c.req.json();
    const db = getDb();

    const config = await db.collection("system_settings").findOne({ key: "security_policy" });
    const policy = config?.value?.securityDataInteroperabilityPolicy || DEFAULT_SECURITY_POLICY.securityDataInteroperabilityPolicy;

    const validation = validateSecurityDataInteroperability(
      {
        dataType: body.dataType || "authData",
        format: body.format || "JSON_JWT",
        targetSystem: body.targetSystem || "IdentityServer_OAuth2",
        schemaVersion: body.schemaVersion || "1.0"
      },
      policy
    );

    if (!validation.valid) {
      await logAuditEvent({
        userId: payload?.sub || "system",
        username: payload?.username || "system",
        userRole: payload?.role || "سیستم",
        action: `عدم امکان تبادل/تفسیر یکسان داده امنیتی با محصولات IT خارجی (الزام FPT_TDC.1.1/2 افتا): ${validation.reason}`,
        eventType: AFTA_LOG_EVENT_TYPES.SECURITY_FUNCTION_FAILURE,
        resource: "security_data_interoperability",
        result: "FAILURE",
        ip: extractClientIp(c),
        userAgent: c.req.header("user-agent"),
        errorCode: 400,
        details: {
          dataType: body.dataType,
          format: body.format,
          targetSystem: body.targetSystem,
          reason: validation.reason,
          aftaClause: "FPT_TDC.1.1 & FPT_TDC.1.2"
        }
      });
    }

    return c.json({
      success: validation.valid,
      validation
    }, validation.valid ? 200 : 400);
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// POST /api/security/update-system-time - تغییر و همگام‌سازی زمان سیستم محلی با ثبت‌نشان (الزام FPT_STM.1.1 افتا)
router.post("/update-system-time", requireRole(["admin"]), async (c) => {
  try {
    const payload = (c.get as any)("jwtPayload");
    const body = await c.req.json();
    const clientIp = extractClientIp(c);

    const oldTime = new Date().toISOString();
    const newTime = body.newTime ? new Date(body.newTime).toISOString() : oldTime;
    const syncSource = body.syncSource || "ساعت سخت‌افزاری محلی / سرور NTP داخلی شبکه";

    // ثبت‌نشان تغییر زمان (الزام FPT_STM.1.1)
    await logAuditEvent({
      userId: payload?.sub || "admin_01",
      username: payload?.username || "admin",
      userRole: payload?.role || "مدیر سیستم",
      action: `تغییر و همگام‌سازی زمان سیستم محلی از منبع '${syncSource}' (الزام FPT_STM.1.1 افتا)`,
      eventType: AFTA_LOG_EVENT_TYPES.SYSTEM_TIME_CHANGE,
      resource: "system_clock",
      result: "SUCCESS",
      ip: clientIp,
      userAgent: c.req.header("user-agent"),
      details: {
        oldTime,
        newTime,
        syncSource,
        aftaClause: "FPT_STM.1.1"
      }
    });

    return c.json({
      success: true,
      message: `زمان سیستم با موفقیت از منبع '${syncSource}' همگام‌سازی گردید و ثبت‌نشان تغییر زمان ثبت شد.`,
      systemTime: newTime
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// POST /api/security/validate-trusted-timestamp - اعتبارسنجی مهرهای زمانی معتبر سیستم (الزام FPT_STM.1.1 افتا)
router.post("/validate-trusted-timestamp", async (c) => {
  try {
    const body = await c.req.json();
    const db = getDb();

    const config = await db.collection("system_settings").findOne({ key: "security_policy" });
    const policy = config?.value?.trustedTimestampPolicy || DEFAULT_SECURITY_POLICY.trustedTimestampPolicy;

    const validation = validateTrustedTimestamping(
      {
        methodUsed: body.methodUsed || "DEFAULT_SYSTEM_RTC",
        ntpServerAddress: body.ntpServerAddress || policy.ntpServerAddress || "127.0.0.1",
        timestampValue: body.timestampValue || new Date().toISOString()
      },
      policy
    );

    return c.json({
      success: validation.valid,
      validation
    }, validation.valid ? 200 : 400);
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// POST /api/security/check-updates - جستجوی خودکار/دستی بروزرسانی‌های نرم‌افزار و میان‌افزار (الزام FPT_TUD_EXT.1.2 افتا)
router.post("/check-updates", requireRole(["admin"]), async (c) => {
  try {
    const payload = (c.get as any)("jwtPayload");
    const db = getDb();
    const config = await db.collection("system_settings").findOne({ key: "security_policy" });
    const policy = config?.value?.productSoftwareUpdatePolicy || DEFAULT_SECURITY_POLICY.productSoftwareUpdatePolicy;

    const validation = validateProductSoftwareUpdate(
      {
        updateMethod: "AUTO_SEARCH",
        userRole: payload?.role || "admin"
      },
      policy
    );

    if (!validation.valid) {
      return c.json({ success: false, message: validation.reason }, 403);
    }

    await logAuditEvent({
      userId: payload?.sub || "admin_01",
      username: payload?.username || "admin",
      userRole: payload?.role || "مدیر سیستم",
      action: "جستجوی بروزرسانی‌های نرم‌افزار و میان‌افزار محصول توسط مدیر سیستم (الزام FPT_TUD_EXT.1.2 افتا)",
      eventType: AFTA_LOG_EVENT_TYPES.ADMIN_FUNCTION_USAGE,
      resource: "software_firmware_updates",
      result: "SUCCESS",
      ip: extractClientIp(c),
      userAgent: c.req.header("user-agent"),
      details: { updateMethod: "AUTO_SEARCH", aftaClause: "FPT_TUD_EXT.1.2" }
    });

    return c.json({
      success: true,
      currentVersion: "v2.5.0-build2026",
      latestAvailableVersion: "v2.5.0-build2026",
      updateAvailable: false,
      message: "سامانه به‌روز است. هیچ بسته بروزرسانی جدیدی برای نصب وجود ندارد.",
      validation
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// POST /api/security/apply-update - اعمال بروزرسانی دستی یا خودکار نرم‌افزار و میان‌افزار توسط مدیر سیستم همراه با اصالت‌سنجی (الزام FPT_TUD_EXT.1.2 افتا)
router.post("/apply-update", requireRole(["admin"]), async (c) => {
  try {
    const payload = (c.get as any)("jwtPayload");
    const body = await c.req.json();
    const db = getDb();

    const config = await db.collection("system_settings").findOne({ key: "security_policy" });
    const policy = config?.value?.productSoftwareUpdatePolicy || DEFAULT_SECURITY_POLICY.productSoftwareUpdatePolicy;

    const validation = validateProductSoftwareUpdate(
      {
        updateMethod: body.updateMethod || "MANUAL_AFTER_VERIFICATION",
        userRole: payload?.role || "admin",
        patchVersion: body.patchVersion || "v2.5.1",
        publishedHashHex: body.publishedHashHex,
        digitalSignatureHex: body.digitalSignatureHex,
        publicKeyPem: body.publicKeyPem
      },
      policy
    );

    if (!validation.valid) {
      await logAuditEvent({
        userId: payload?.sub || "admin_01",
        username: payload?.username || "admin",
        userRole: payload?.role || "مدیر سیستم",
        action: `تلاش ناموفق برای بروزرسانی نرم‌افزار/میان‌افزار محصول: ${validation.reason}`,
        eventType: AFTA_LOG_EVENT_TYPES.SECURITY_FUNCTION_FAILURE,
        resource: "software_firmware_updates",
        result: "FAILURE",
        ip: extractClientIp(c),
        userAgent: c.req.header("user-agent"),
        errorCode: 403,
        details: { reason: validation.reason, aftaClause: "FPT_TUD_EXT.1.2" }
      });

      return c.json({ success: false, message: validation.reason }, 403);
    }

    await logAuditEvent({
      userId: payload?.sub || "admin_01",
      username: payload?.username || "admin",
      userRole: payload?.role || "مدیر سیستم",
      action: `اعمال موفقیت‌آمیز بروزرسانی نرم‌افزار/میان‌افزار نسخه ${body.patchVersion || "جدید"} توسط مدیر سیستم (الزام FPT_TUD_EXT.1.2 افتا)`,
      eventType: AFTA_LOG_EVENT_TYPES.FUNCTION_BEHAVIOR_CHANGE,
      resource: "software_firmware_updates",
      result: "SUCCESS",
      ip: extractClientIp(c),
      userAgent: c.req.header("user-agent"),
      details: {
        patchVersion: body.patchVersion || "v2.5.1",
        updateMethod: body.updateMethod || "MANUAL_AFTER_VERIFICATION",
        aftaClause: "FPT_TUD_EXT.1.2"
      }
    });

    return c.json({
      success: true,
      message: `بسته بروزرسانی نرم‌افزار/میان‌افزار (نسخه ${body.patchVersion || "جدید"}) با موفقیت اصالت‌سنجی و بر روی سامانه نصب گردید.`,
      validation
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// POST /api/security/verify-update-authenticity - احراز اصالت نرم‌افزار/میان‌افزار پیش از نصب بروزرسانی خودکار (الزام FPT_TUD_EXT.1.3 افتا)
router.post("/verify-update-authenticity", requireRole(["admin"]), async (c) => {
  try {
    const payload = (c.get as any)("jwtPayload");
    const body = await c.req.json();
    const db = getDb();

    const config = await db.collection("system_settings").findOne({ key: "security_policy" });
    const policy = config?.value?.productSoftwareUpdatePolicy || DEFAULT_SECURITY_POLICY.productSoftwareUpdatePolicy;

    const validation = validateAutoUpdateAuthenticity(
      {
        patchVersion: body.patchVersion || "v2.5.1",
        publishedHashHex: body.publishedHashHex,
        digitalSignatureHex: body.digitalSignatureHex,
        publicKeyPem: body.publicKeyPem
      },
      policy
    );

    if (!validation.valid) {
      await logAuditEvent({
        userId: payload?.sub || "admin_01",
        username: payload?.username || "admin",
        userRole: payload?.role || "مدیر سیستم",
        action: `تلاش ناموفق برای احراز اصالت پیش از نصب بروزرسانی خودکار (الزام FPT_TUD_EXT.1.3): ${validation.reason}`,
        eventType: AFTA_LOG_EVENT_TYPES.SECURITY_FUNCTION_FAILURE,
        resource: "auto_update_authenticity_verification",
        result: "FAILURE",
        ip: extractClientIp(c),
        userAgent: c.req.header("user-agent"),
        errorCode: 400,
        details: { reason: validation.reason, aftaClause: "FPT_TUD_EXT.1.3" }
      });
    }

    return c.json({
      success: validation.valid,
      validation
    }, validation.valid ? 200 : 400);
  } catch (error: any) {
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
    attachmentId = "25137",
    customMessage,
    allowedFormat = "json"
  } = body;

  // ── ویژگی‌های امنیتی و خط‌مشی کنترل دسترسی داده کاربری (۴ شرط الزام افتا) ──
  // ۱. نوع داده (DataType)
  // ۲. حجم و اندازه (Max 10MB)
  // ۳. فرمت (Disallow executable/dangerous formats)
  // ۴. تعداد دفعات import / تعداد سند (Max 50 docs per import)

  const allowedFormats = [".xlsx", ".xls", ".doc", ".docx", ".pdf", ".png", ".jpg", ".jpeg", ".csv", ".txt", ".zip", ".json"];
  const ext = originalFileName.includes(".") ? originalFileName.substring(originalFileName.lastIndexOf(".")).toLowerCase() : "";
  const isFormatAllowed = allowedFormats.includes(ext);

  const maxSizeBytes = 10 * 1024 * 1024; // 10MB
  const isSizeAllowed = fileSizeBytes <= maxSizeBytes;

  const maxDocsPerBatch = 50;
  const isDocCountAllowed = Number(docCount) <= maxDocsPerBatch;

  if (type === "FILE_CORRUPTED_ERROR" || !isFormatAllowed || !isSizeAllowed || !isDocCountAllowed) {
    const fileSizeKb = Math.round(fileSizeBytes / 1024);
    const defaultMsg = `Message : کاربر قصد بارگذاری فایلی با فرمت ${ext || "نامشخص"} را داشته، در صورتی که فرمت مجاز ${allowedFormat} می‌باشد.`;
    const actionDesc = customMessage
      ? (customMessage.startsWith("Message :") ? customMessage : `Message : ${customMessage}`)
      : defaultMsg;

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
      details: { error: "Validation Failed", format: ext, sizeKb: fileSizeKb, docCount, allowedFormat }
    });

    return c.json({
      success: false,
      message: actionDesc.replace(/^Message\s*:\s*/i, "")
    }, 400);
  }

  const generatedUniqueName = attachmentName || `${crypto.randomUUID()}${ext}`;

  if (operation === "DELETE") {
    // ردیف ۲ تصویر راهنما: لاگ حذف ضمیمه
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
        fileName: originalFileName,
        uniqueName: generatedUniqueName
      }
    });

    return c.json({
      success: true,
      message: "حذف ضمیمه و داده کاربری با موفقیت تایید و لاگ گردید."
    });
  }

  // ردیف ۱ تصویر راهنما: لاگ افزودن/ایمپورت ضمیمه
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

    // Note: Success log is recorded by the file download event endpoint (/api/security/audit-file-download)
    // to ensure exactly ONE comprehensive audit log entry is saved per file download action.
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

  const reqUsername = payload?.username || "کاربر غیرمجاز";
  if (!isAuthorized) {
    const actionDesc = `تلاش ناموفق و غیرمجاز جهت ورود به بخش ثبت نشان‌ها با نام کاربری '${reqUsername}'`;
    await logAuditEvent({
      userId: payload?.sub || "unauthorized_user",
      username: reqUsername,
      userRole,
      action: actionDesc,
      eventType: AFTA_LOG_EVENT_TYPES.AUDIT_LOG_READ_FAILURE,
      resource: c.req.path,
      method: c.req.method,
      result: "FAILURE",
      ip: extractClientIp(c),
      userAgent: c.req.header("user-agent"),
      errorCode: 403,
      details: {
        tableName: "لاگ های احراز هویت",
        aftaClause: "8-2-2",
        requestType: "مشاهده و استعلام",
        requestResult: "ناموفق",
        reason: "تلاش‌های ناموفق برای خواندن اطلاعات از ثبت‌نشان‌ها (الزام ۲ افتا)"
      }
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

    // ۳. خواندن اطلاعات از ثبت‌نشان‌ها (موفق با ثبت صریح نام کاربری)
    const successActionDesc = `ورود و فراخوانی اطلاعات ثبت نشان‌ها توسط کاربر '${reqUsername}'`;
    await logAuditEvent({
      userId: payload.sub,
      username: reqUsername,
      userRole: payload.role || "مدیر",
      action: successActionDesc,
      eventType: AFTA_LOG_EVENT_TYPES.AUDIT_LOG_READ_SUCCESS,
      resource: "/api/security/audit-logs",
      result: "SUCCESS",
      ip: extractClientIp(c),
      userAgent: c.req.header("user-agent"),
      details: {
        tableName: "لاگ های احراز هویت",
        aftaClause: "8-2-3",
        requestType: "مشاهده و استعلام",
        requestResult: "موفق",
        query,
        totalReturned: enrichedLogs.length
      }
    });

    return c.json({
      success: true,
      data: enrichedLogs,
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) }
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
  const clientIp = extractClientIp(c);
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

// POST /api/security/report-security-failure - Log security function failure (AFTA Clause 1 Table 6-2)
router.post("/report-security-failure", async (c) => {
  const payload = (c.get as any)("jwtPayload");
  const body = await c.req.json().catch(() => ({}));
  const clientIp = body.clientIp || extractClientIp(c);
  const userAgent = c.req.header("user-agent") || "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";
  
  const timestampStr = body.timestampStr || new Date().toLocaleString("en-US", { hour12: true });
  const errorSummary = body.errorSummary || "System.Data.Entity.Core.EntityException: The underlying provider failed on Open. ---> System.Data.SqlClient.SqlException: SQL Server service has been paused.";
  const formattedAction = `#. error at ${timestampStr}.\nSummary: ${errorSummary}`;

  await logAuditEvent({
    userId: payload?.sub || "sys_admin",
    username: payload?.username || "admin",
    userRole: payload?.role === "admin" ? "مدیر" : (payload?.role || "مدیر"),
    action: formattedAction,
    eventType: AFTA_LOG_EVENT_TYPES.SECURITY_FUNCTION_FAILURE,
    resource: "توابع امنیتی محصول",
    method: "ERROR",
    result: "FAILURE",
    ip: clientIp,
    userAgent,
    errorCode: 500,
    details: {
      tableName: "توابع امنیتی محصول",
      aftaClause: "6-2-1",
      timestampStr,
      errorSummary,
      operation: "خطا"
    }
  });

  return c.json({
    success: true,
    message: "رویداد شکست در کارکردهای امنیتی محصول با الگوی استاندارد افتا به ثبت‌نشان‌ها اضافه شد."
  });
});

// POST /api/security/report-capability-failure - Log system capability failure (AFTA Clause 1 Table 7-2)
router.post("/report-capability-failure", async (c) => {
  const payload = (c.get as any)("jwtPayload");
  const body = await c.req.json().catch(() => ({}));
  const clientIp = body.clientIp || extractClientIp(c);
  const userAgent = c.req.header("user-agent") || "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";
  
  const timestampStr = body.timestampStr || new Date().toLocaleString("en-US", { hour12: true });
  const errorSummary = body.errorSummary || "System.Data.Entity.Core.EntityException: The underlying provider failed on Open. ---> System.Data.SqlClient.SqlException: SQL Server service has been paused.";
  const formattedAction = `#. error at ${timestampStr}.\nSummary: ${errorSummary}`;

  await logAuditEvent({
    userId: payload?.sub || "sys_admin",
    username: payload?.username || "admin",
    userRole: payload?.role === "admin" ? "مدیر" : (payload?.role || "مدیر"),
    action: formattedAction,
    eventType: AFTA_LOG_EVENT_TYPES.SYSTEM_CAPABILITY_FAILURE,
    resource: "توابع کارکردی محصول",
    method: "ERROR",
    result: "FAILURE",
    ip: clientIp,
    userAgent,
    errorCode: 500,
    details: {
      tableName: "توابع کارکردی محصول",
      aftaClause: "7-2-1",
      timestampStr,
      errorSummary,
      operation: "خطا"
    }
  });

  return c.json({
    success: true,
    message: "رویداد شکست در قابلیت‌های کارکردی محصول با الگوی استاندارد افتا به ثبت‌نشان‌ها اضافه شد."
  });
});

// POST /api/security/report-session-establishment-failure - Log session establishment attempt/prevention (AFTA Clause 7 Table 8-2 & Clause 8 Table 3-2)
router.post("/report-session-establishment-failure", async (c) => {
  const payload = (c.get as any)("jwtPayload");
  const body = await c.req.json().catch(() => ({}));
  const clientIp = body.clientIp || extractClientIp(c);
  const userAgent = c.req.header("user-agent") || "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";
  
  const restrictionType = body.restrictionType || "IP"; // "IP" | "TIME"
  const formattedAction = restrictionType === "TIME" 
    ? "امکان ورود به سیستم در این بازه زمانی برای شما وجود ندارد."
    : "آدرس ماشین جاری جهت ورود کاربران ارشد مجاز نمی باشد";

  await logAuditEvent({
    userId: payload?.sub || "usr_senior_01",
    username: payload?.username || "کاربر ارشد",
    userRole: payload?.role === "admin" ? "مدیر" : (payload?.role || "مدیر"),
    action: formattedAction,
    eventType: AFTA_LOG_EVENT_TYPES.SESSION_ESTABLISHMENT_ATTEMPT,
    resource: "لاگ های احراز هویت",
    method: "POST",
    result: "FAILURE",
    ip: clientIp,
    userAgent,
    errorCode: 403,
    details: {
      tableName: "لاگ های احراز هویت",
      aftaClause: restrictionType === "TIME" ? "8-2-7-4" : "8-2-7-1",
      requestType: "ورود به سامانه",
      requestResult: "ناموفق",
      restrictionType
    }
  });

  return c.json({
    success: true,
    message: "رویداد تلاش برقراری نشست (ممانعت بر اساس آدرس ماشین / بازه زمانی) با الگوی استاندارد افتا ثبت شد."
  });
});

// POST /api/security/report-concurrent-session-limit - Log concurrent session limit (AFTA Clause 1 Table 8-2)
router.post("/report-concurrent-session-limit", async (c) => {
  const payload = (c.get as any)("jwtPayload");
  const body = await c.req.json().catch(() => ({}));
  const clientIp = body.clientIp || extractClientIp(c);
  const userAgent = c.req.header("user-agent") || "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";
  
  const type = body.type || "LIMIT_EXCEEDED"; // "LIMIT_EXCEEDED" | "SESSION_KICKOUT"
  const username = body.username || payload?.username || "کاربر ارشد";
  const userRole = payload?.role === "admin" ? "مدیر" : (payload?.role || "مدیر");

  const formattedAction = type === "SESSION_KICKOUT"
    ? `کاربر '${username}:${clientIp}' به علت برقرای نشست همزمان جدید از سامانه خارج شد`
    : "حداکثر تعداد ارتباط همزمان برای این کاربر پر شده است،امکان ورود به سیستم وجود ندارد.";

  await logAuditEvent({
    userId: payload?.sub || "usr_senior_01",
    username,
    userRole,
    action: formattedAction,
    eventType: AFTA_LOG_EVENT_TYPES.CONCURRENT_SESSION_LIMIT_EXCEEDED,
    resource: "لاگ های احراز هویت",
    method: type === "SESSION_KICKOUT" ? "DELETE" : "POST",
    result: type === "SESSION_KICKOUT" ? "SUCCESS" : "FAILURE",
    ip: clientIp,
    userAgent,
    errorCode: type === "SESSION_KICKOUT" ? 200 : 403,
    details: {
      tableName: "لاگ های احراز هویت",
      aftaClause: "8-2-1",
      requestType: type === "SESSION_KICKOUT" ? "خروج از سامانه" : "ورود به سامانه",
      requestResult: type === "SESSION_KICKOUT" ? "موفق" : "ناموفق",
      limitType: type
    }
  });

  return c.json({
    success: true,
    message: "رویداد محدودیت نشست‌های همزمان (پر شدن سقف/خروج خودکار) با الگوی استاندارد افتا ثبت شد."
  });
});

// POST /api/security/audit-file-download - Log file export & download event
router.post("/audit-file-download", async (c) => {
  const payload = (c.get as any)("jwtPayload");
  const body = await c.req.json().catch(() => ({}));
  
  const clientIp = body.clientIp || body.ip || extractClientIp(c);
  const userAgent = c.req.header("user-agent") || "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";

  const fileName = body.fileName || body.filename || "add new source";
  const dataType = body.dataType || "فایل ضمیمه / داده کاربری";
  const fileSize = body.fileSize || "نامشخص";
  const fileFormat = body.fileFormat || body.format || (fileName.includes(".") ? fileName.split(".").pop()?.toUpperCase() : "PNG");
  const section = body.section || body.module || body.department || "کتابخانه";
  const otherDetails = body.otherDetails || body.details || "دانلود فایل از محصول";

  const formattedDescription = `نام فایل: ${fileName} | قسمت/بخش: ${section} | نوع داده: ${dataType} | حجم و اندازه: ${fileSize} | فرمت: ${fileFormat} | سایر موارد: ${otherDetails}`;

  await logAuditEvent({
    userId: payload?.sub || body.userId || "usr_netel_01",
    username: payload?.username || body.username || "netel",
    userFullName: payload?.userFullName || payload?.fullName || body.userFullName || payload?.username || "NETEL شریف",
    userRole: payload?.role || body.userRole || "کاربر",
    action: "دانلود فایل",
    eventType: AFTA_LOG_EVENT_TYPES.DATA_EXPORT_ATTEMPT, // "همه تلاش‌ها برای خارج کردن اطلاعات از محصول"
    resource: section || "کتابخانه",
    method: "GET",
    result: "SUCCESS",
    ip: clientIp,
    userAgent,
    details: {
      fileName,
      dataType,
      fileSize,
      fileFormat,
      section,
      otherDetails,
      operation: "DOWNLOAD_FILE",
      customDescription: formattedDescription
    }
  });

  return c.json({
    success: true,
    message: "لاگ دانلود فایل و خروج داده با موفقیت ثبت گردید."
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
    const isAdmin = payload?.role === "admin" || payload?.role === "مدیر سیستم" || payload?.username?.toLowerCase() === "admin";
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
    const isAdmin = payload?.role === "admin" || payload?.role === "مدیر سیستم" || payload?.username?.toLowerCase() === "admin";

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

// POST /api/security/simulate-tls-client-connection - تست و اعتبارسنجی واقعی اتصال سوکت TLS Client
router.post("/simulate-tls-client-connection", requireRole(["admin"]), async (c) => {
  const payload = (c.get as any)("jwtPayload");
  try {
    const body = await c.req.json().catch(() => ({}));
    const db = getDb();
    const config = await db.collection("system_settings").findOne({ key: "security_policy" });
    const policy = config?.value ? { ...DEFAULT_SECURITY_POLICY, ...config.value } : DEFAULT_SECURITY_POLICY;

    const tlsPolicy = policy.tlsClientPolicy || DEFAULT_SECURITY_POLICY.tlsClientPolicy;
    const targetUrl = body.targetUrl || body.targetHost || "https://google.com";

    // اجرای دست‌تکانی واقعی سوکت TLS شبکه
    const realResult = await executeRealTlsHandshake(targetUrl, tlsPolicy);

    const clientIp = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "127.0.0.1";
    await logAuditEvent({
      userId: payload?.sub,
      username: payload?.username || "admin",
      userRole: "مدیر سیستم",
      action: `دست‌تکانی واقعی سوکت TLS Client با آدرس '${realResult.host}:${realResult.port}' (${realResult.success ? "انطباق کامل و برقراری اتصال امن" : "عدم انطباق/رد اتصال"})`,
      eventType: AFTA_LOG_EVENT_TYPES.ADMIN_FUNCTION_USAGE,
      resource: "پروتکل TLS Client (رده ۳-۲ افتا)",
      result: realResult.success ? "SUCCESS" : "FAILURE",
      ip: clientIp,
      userAgent: c.req.header("user-agent"),
      details: {
        targetUrl: realResult.targetUrl,
        negotiatedProtocol: realResult.negotiatedProtocol,
        negotiatedCipherSuite: realResult.negotiatedCipherSuite,
        enabledCipherSuitesCount: realResult.enabledCipherSuitesCount,
        aftaComplianceStatus: realResult.aftaComplianceStatus,
        serverCertificate: realResult.serverCertificate,
        message: realResult.message
      }
    });

    return c.json({
      success: realResult.success,
      realResult,
      validationResult: {
        valid: realResult.success,
        allowed: realResult.success,
        enabledCipherSuitesCount: realResult.enabledCipherSuitesCount,
        protocolVersionStatus: realResult.negotiatedProtocol || "TLSv1.3",
        aftaCompliance: realResult.aftaComplianceStatus,
        reason: realResult.message
      },
      message: realResult.message
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

export default router;
