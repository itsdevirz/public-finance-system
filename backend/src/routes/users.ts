import { Hono } from "hono";
import { getDb } from "../db/index.js";
import { ObjectId } from "mongodb";
import { hashPassword } from "../lib/auth.js";
import { validatePassword } from "../lib/securityPolicy.js";
import { logAuditEvent, AFTA_LOG_EVENT_TYPES, verifyLogIntegrity, signExistingLogs, extractClientIp } from "../lib/auditLogger.js";
import { getShamsiDetails } from "../lib/shamsi.js";
import { pruneExpiredSessions } from "../lib/sessionHelper.js";

const router = new Hono();

// GET /api/users - List all users
router.get("/", async (c) => {
  try {
    const payload = (c.get as any)("jwtPayload") as any;
    const isAdmin = payload.role === "admin" || payload.role === "مدیر سیستم" || payload.username?.toLowerCase() === "admin";
    const db = getDb();

    if (!isAdmin) {
      // Only return the logged-in user's own profile record
      const user = await db.collection("users").findOne({ _id: new ObjectId(payload.sub) }, { projection: { password: 0 } });
      return c.json({ success: true, data: user ? [user] : [] });
    }

    // Exclude password hashes from listing for security
    const users = await db.collection("users").find({}, { projection: { password: 0 } }).toArray();
    return c.json({ success: true, data: users });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// POST /api/users - Create a new user (Admin only)
router.post("/", async (c) => {
  try {
    const payload = (c.get as any)("jwtPayload") as any;
    if (payload.role !== "admin") {
      return c.json({ success: false, message: "دسترسی غیرمجاز. فقط مدیر سیستم مجاز به تعریف کاربر جدید است." }, 403);
    }

    const body = await c.req.json();
    const db = getDb();

    if (!body.username || !body.username.trim()) {
      return c.json({ success: false, message: "نام کاربری الزامی است" }, 400);
    }

    // Password Policy Check
    if (!body.password || (typeof body.password === "string" && !body.password.trim())) {
      return c.json({ success: false, message: "تعیین رمز عبور برای کاربر جدید الزامی است." }, 400);
    }
    const rawPass = body.password.trim();
    const secPolicyConfig = await db.collection("system_settings").findOne({ key: "security_policy" });
    const secPolicy = secPolicyConfig?.value || {};
    const passCheck = validatePassword(rawPass, secPolicy.passwordPolicy);
    if (!passCheck.valid) {
      return c.json({ success: false, message: passCheck.message }, 400);
    }

    // Check if the username already exists
    const existing = await db.collection("users").findOne({ username: body.username.trim().toLowerCase() });
    if (existing) {
      return c.json({ success: false, message: "این نام کاربری قبلاً در سامانه ثبت شده است" }, 400);
    }

    const passwordHash = await hashPassword(rawPass);

    const doc = {
      username: body.username.trim().toLowerCase(),
      password: passwordHash,
      firstName: body.firstName?.trim() || "",
      lastName: body.lastName?.trim() || "",
      employeeId: body.employeeId?.trim() || "",
      nationalId: body.nationalId?.trim() || "",
      phone: body.phone?.trim() || "",
      email: body.email?.trim() || "",
      department: body.department?.trim() || "حسابداری مالی",
      position: body.position?.trim() || "کارشناس حسابداری",
      userGroup: body.userGroup?.trim() || "حسابداری",
      directManager: body.directManager?.trim() || "",
      branch: body.branch?.trim() || "شعبه مرکزی",
      costCenter: body.costCenter?.trim() || "اداری",
      fiscalYear: body.fiscalYear?.trim() || "1405",
      status: body.status || "فعال", // فعال, غیرفعال, مسدود
      twoFactor: !!body.twoFactor,
      authMethod: body.authMethod || (body.twoFactor ? "TWO_FACTOR" : "PASSWORD"),
      ipRestriction: body.ipRestriction || "",
      allowOutside: !!body.allowOutside,
      maxFailedAttempts: Math.max(1, Math.floor(Number(body.maxFailedAttempts) || 5)),
      lockoutDuration: Number(body.lockoutDuration) || 15,
      maxConcurrentSessions: Math.max(1, Math.floor(Number(body.maxConcurrentSessions) || 1)),
      idleTimeoutMinutes: body.idleTimeoutMinutes !== undefined && body.idleTimeoutMinutes !== null && body.idleTimeoutMinutes !== "" ? Math.max(1, Math.floor(Number(body.idleTimeoutMinutes))) : null,
      role: body.role || "حسابدار",
      permissions: body.permissions || {},
      financialLimitMin: Number(body.financialLimitMin) || 0,
      financialLimitMax: Number(body.financialLimitMax) || 0,
      allowedCostCenters: body.allowedCostCenters || [],
      workflowLevel: body.workflowLevel || "ثبت کننده",
      preferences: body.preferences || {
        fiscalYear: "1405",
        company: "سازمان مرکزی",
        language: "fa",
        theme: "light",
        startPage: "/dashboard",
        pageSize: 10,
        dateFormat: "shamsi"
      },
      failedLoginAttempts: 0,
      lastLogin: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = await db.collection("users").insertOne(doc);
    
    // Log audit action with USER_GROUP_CHANGE eventType (AFTA Clause 1 Table 4-2)
    const shamsiCreate = getShamsiDetails(new Date());
    const roleNameCreate = doc.role || doc.userGroup || "حسابدار";
    const createActionText = `کاربر ${doc.username} در تاریخ ${shamsiCreate.shamsiDate} و ساعت ${shamsiCreate.shamsiTime} با نقش ${roleNameCreate} ساخته شد`;

    await logAuditEvent({
      userId: payload.sub,
      username: payload.username,
      userRole: payload.role === "admin" ? "مدیر" : payload.role,
      action: createActionText,
      eventType: AFTA_LOG_EVENT_TYPES.USER_GROUP_CHANGE,
      resource: "گروه‌های کاربری",
      result: "SUCCESS",
      ip: extractClientIp(c),
      userAgent: c.req.header("user-agent"),
      details: {
        tableName: "گروه‌های کاربری",
        operation: "افزودن",
        aftaClause: "4-2-1",
        name: doc.username,
        description: roleNameCreate,
        role: roleNameCreate,
        icon: "",
        targetUserId: result.insertedId.toHexString()
      }
    });

    const { password, ...safeData } = doc;
    return c.json({ success: true, data: { ...safeData, _id: result.insertedId } }, 201);
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// PUT /api/users/:id - Update an existing user (Admin or Self-edit only)
router.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const payload = (c.get as any)("jwtPayload") as any;
    const isAdmin = payload.role === "admin" || payload.role === "مدیر سیستم" || payload.username?.toLowerCase() === "admin";

    // Non-admin can only edit their own user profile
    if (!isAdmin && payload.sub !== id) {
      return c.json({ success: false, message: "دسترسی غیرمجاز. شما مجاز به ویرایش این کاربر نیستید." }, 403);
    }

    const body = await c.req.json();
    const db = getDb();

    const userObjectId = new ObjectId(id);
    const existingUser = await db.collection("users").findOne({ _id: userObjectId });
    if (!existingUser) {
      return c.json({ success: false, message: "کاربر مورد نظر یافت نشد" }, 404);
    }

    // الزامات افتا: غیرمجاز بودن هرگونه تغییر در ویژگی‌های امنیتی و مشخصات کاربر دارای نشست فعال مجزا
    const secConfig = await db.collection("system_settings").findOne({ key: "security_policy" });
    const securityPolicy = secConfig?.value?.activeUserSecurityChangePolicy || {
      disallowChangeDuringActiveSession: true
    };

    const authHeader = c.req.header("authorization") || "";
    const currentToken = authHeader.replace(/^Bearer\s+/i, "").trim();

    if (securityPolicy.disallowChangeDuringActiveSession === true && !isAdmin) {
      const activeSessions = await pruneExpiredSessions(db, userObjectId);
      // Filter out the current requesting session token
      const otherActiveSessions = activeSessions.filter((s: any) => s.token !== currentToken);
      if (otherActiveSessions.length > 0) {
        const errorMsgAction = "Message : کاربر مورد نظر دارای نشست فعال دیگری در سامانه می باشد و امکان تغییر مشخصات آن وجود ندارد.";
        await logAuditEvent({
          userId: payload.sub,
          username: payload.username || "admin",
          userRole: payload.role || "مدیر سیستم",
          action: errorMsgAction,
          eventType: AFTA_LOG_EVENT_TYPES.USER_DATA_VALIDATION_FAILURE,
          resource: "users",
          result: "FAILURE",
          ip: c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "127.0.0.1",
          userAgent: c.req.header("user-agent"),
          errorCode: 400,
          details: {
            targetUserId: id,
            targetUsername: existingUser.username,
            reason: "کاربر مورد نظر دارای نشست فعال دیگری در سامانه می باشد و امکان تغییر مشخصات آن وجود ندارد."
          }
        });

        return c.json({
          success: false,
          message: "کاربر مورد نظر دارای نشست فعال دیگری در سامانه می باشد و امکان تغییر مشخصات آن وجود ندارد."
        }, 400);
      }
    }

    // Set fields allowed for anyone (self-profile update)
    const updateData: any = {
      firstName: body.firstName?.trim() !== undefined ? body.firstName.trim() : existingUser.firstName,
      lastName: body.lastName?.trim() !== undefined ? body.lastName.trim() : existingUser.lastName,
      phone: body.phone?.trim() !== undefined ? body.phone.trim() : existingUser.phone,
      email: body.email?.trim() !== undefined ? body.email.trim() : existingUser.email,
      preferences: body.preferences || existingUser.preferences,
      updatedAt: new Date().toISOString()
    };

    // Admin updates (only allowed for admins)
    if (isAdmin) {
      updateData.employeeId = body.employeeId?.trim() !== undefined ? body.employeeId.trim() : existingUser.employeeId;
      updateData.nationalId = body.nationalId?.trim() !== undefined ? body.nationalId.trim() : existingUser.nationalId;
      updateData.department = body.department?.trim() !== undefined ? body.department.trim() : existingUser.department;
      updateData.position = body.position?.trim() !== undefined ? body.position.trim() : existingUser.position;
      updateData.userGroup = body.userGroup?.trim() !== undefined ? body.userGroup.trim() : existingUser.userGroup;
      updateData.directManager = body.directManager?.trim() !== undefined ? body.directManager.trim() : existingUser.directManager;
      updateData.branch = body.branch?.trim() !== undefined ? body.branch.trim() : existingUser.branch;
      updateData.costCenter = body.costCenter?.trim() !== undefined ? body.costCenter.trim() : existingUser.costCenter;
      updateData.fiscalYear = body.fiscalYear?.trim() !== undefined ? body.fiscalYear.trim() : existingUser.fiscalYear;
      updateData.status = body.status || existingUser.status;
      updateData.twoFactor = body.twoFactor !== undefined ? !!body.twoFactor : existingUser.twoFactor;
      updateData.authMethod = body.authMethod || (updateData.twoFactor ? "TWO_FACTOR" : (existingUser.authMethod || "PASSWORD"));
      updateData.ipRestriction = body.ipRestriction?.trim() !== undefined ? body.ipRestriction.trim() : existingUser.ipRestriction;
      updateData.allowOutside = body.allowOutside !== undefined ? !!body.allowOutside : existingUser.allowOutside;
      updateData.maxFailedAttempts = body.maxFailedAttempts !== undefined ? Math.max(1, Math.floor(Number(body.maxFailedAttempts) || 5)) : existingUser.maxFailedAttempts;
      updateData.lockoutDuration = body.lockoutDuration !== undefined ? Number(body.lockoutDuration) : existingUser.lockoutDuration;
      updateData.maxConcurrentSessions = body.maxConcurrentSessions !== undefined ? Math.max(1, Math.floor(Number(body.maxConcurrentSessions) || 1)) : (existingUser.maxConcurrentSessions || 1);
      updateData.idleTimeoutMinutes = body.idleTimeoutMinutes !== undefined
        ? (body.idleTimeoutMinutes !== null && body.idleTimeoutMinutes !== "" ? Math.max(1, Math.floor(Number(body.idleTimeoutMinutes))) : null)
        : existingUser.idleTimeoutMinutes;

      // Prevent an admin from demoting their own admin role or the root 'admin' account
      const isTargetRootAdmin = existingUser.username?.toLowerCase() === "admin";
      const isSelfEdit = String(payload.sub) === String(id) || (payload.username && payload.username.toLowerCase() === existingUser.username?.toLowerCase());

      if (isTargetRootAdmin || (isSelfEdit && (existingUser.role === "admin" || existingUser.role === "مدیر سیستم"))) {
        updateData.role = "admin";
      } else {
        updateData.role = (body.role === "مدیر سیستم" ? "admin" : body.role) || existingUser.role;
      }

      // If final target role is admin/مدیر سیستم, force full unrestricted permissions
      const isFinalRoleAdmin = updateData.role === "admin" || updateData.role === "مدیر سیستم" || existingUser.username?.toLowerCase() === "admin";
      if (isFinalRoleAdmin) {
        updateData.permissions = {
          "doc.create": true, "doc.edit": true, "doc.delete": true, "doc.approve": true,
          "acct.view": true, "acct.create": true,
          "rep.trial": true, "rep.ledger": true, "rep.statement": true,
          "set.users": true, "set.year": true, "audit.view": true
        };
      } else {
        updateData.permissions = body.permissions || existingUser.permissions;
      }

      updateData.financialLimitMin = body.financialLimitMin !== undefined ? Number(body.financialLimitMin) : existingUser.financialLimitMin;
      updateData.financialLimitMax = body.financialLimitMax !== undefined ? Number(body.financialLimitMax) : existingUser.financialLimitMax;
      updateData.allowedCostCenters = body.allowedCostCenters || existingUser.allowedCostCenters;
      updateData.workflowLevel = body.workflowLevel || existingUser.workflowLevel;

      if (updateData.status === "فعال") {
        updateData.failedLoginAttempts = 0;
        updateData.lockoutUntil = null;
      }
    }

    // Only update password if explicitly provided as non-empty string during edit
    if (body.password && typeof body.password === "string" && body.password.trim() !== "") {
      const secPolicyConfig = await db.collection("system_settings").findOne({ key: "security_policy" });
      const secPolicy = secPolicyConfig?.value || {};
      const passCheck = validatePassword(body.password.trim(), secPolicy.passwordPolicy);
      if (!passCheck.valid) {
        return c.json({ success: false, message: passCheck.message }, 400);
      }
      updateData.password = await hashPassword(body.password.trim());
    }

    await db.collection("users").updateOne(
      { _id: userObjectId },
      { $set: updateData }
    );

    // Immediate enforcement: Revoke active sessions upon security attribute changes, EXCLUDING current requesting token
    const isSecurityAttrChanged =
      (updateData.status && updateData.status !== existingUser.status) ||
      (updateData.role && updateData.role !== existingUser.role) ||
      updateData.password ||
      (updateData.permissions && JSON.stringify(updateData.permissions) !== JSON.stringify(existingUser.permissions));

    if (isSecurityAttrChanged) {
      const activeSessions = await db.collection("active_sessions").find({ userId: userObjectId }).toArray();
      const currentToken = (c.req.header("authorization") || "").replace(/^Bearer\s+/i, "").trim();

      const sessionsToRevoke = activeSessions.filter((s: any) => s.token !== currentToken);
      if (sessionsToRevoke.length > 0) {
        const tokensToRevoke = sessionsToRevoke.map((s: any) => ({
          token: s.token,
          revokedAt: new Date().toISOString(),
          reason: "ابطال فوری نشست‌های دیگر به دلیل تغییر ویژگی‌های امنیتی کاربر"
        }));
        await db.collection("revoked_tokens").insertMany(tokensToRevoke);
        const idsToRevoke = sessionsToRevoke.map((s: any) => s._id);
        await db.collection("active_sessions").deleteMany({ _id: { $in: idsToRevoke } });
      }
    }

    // Calculate field-by-field differences (Before vs After) for audit log details
    const fieldLabels: Record<string, string> = {
      firstName: "نام",
      lastName: "نام خانوادگی",
      phone: "شماره تماس",
      email: "پست الکترونیکی",
      employeeId: "کد پرسنلی",
      nationalId: "کد ملی",
      department: "دپارتمان/واحد",
      position: "سمت سازمانی",
      userGroup: "گروه کاربری",
      directManager: "مدیر مستقیم",
      branch: "شعبه فعالیت",
      costCenter: "مرکز هزینه",
      fiscalYear: "سال مالی",
      status: "وضعیت حساب",
      role: "نقش دسترسی",
      twoFactor: "ورود دو مرحله‌ای (2FA)",
      authMethod: "روش احراز هویت مورد استفاده",
      ipRestriction: "محدودیت IP",
      allowOutside: "دسترسی خارج از شبکه",
      maxFailedAttempts: "حداکثر تلاش ناموفق",
      lockoutDuration: "مدت قفل حساب (دقیقه)",
      financialLimitMin: "حداقل سقف مالی",
      financialLimitMax: "حداکثر سقف مالی",
      workflowLevel: "سطح گردش کار",
      password: "رمز عبور"
    };

    const changes: Record<string, { label: string; before: any; after: any }> = {};
    const changeSummaryParts: string[] = [];

    for (const [key, label] of Object.entries(fieldLabels)) {
      if (key === "password") {
        if (body.password && typeof body.password === "string" && body.password.trim() !== "") {
          changes[key] = { label, before: "••••••", after: "•••••• (جدید)" };
          changeSummaryParts.push(`${label}: تغییر یافت از "••••••" به "•••••• (جدید)"`);
        }
        continue;
      }
      const beforeVal = (existingUser as any)[key];
      const afterVal = (updateData as any)[key];
      if (afterVal !== undefined && JSON.stringify(beforeVal) !== JSON.stringify(afterVal)) {
        const bFormatted = beforeVal === true ? "فعال" : beforeVal === false ? "غیرفعال" : (beforeVal ?? "مشخص نشده");
        const aFormatted = afterVal === true ? "فعال" : afterVal === false ? "غیرفعال" : (afterVal ?? "مشخص نشده");
        changes[key] = {
          label,
          before: bFormatted,
          after: aFormatted
        };
        changeSummaryParts.push(`${label}: تغییر یافت از "${bFormatted}" به "${aFormatted}"`);
      }
    }

    const changesText = changeSummaryParts.join("؛ ");
    const actionText = changeSummaryParts.length > 0
      ? `ویرایش مشخصات کاربر "${existingUser.username}": ${changesText}`
      : `ویرایش مشخصات کاربر "${existingUser.username}"`;

    // Log audit action with before & after changes and UserAgent
    await logAuditEvent({
      userId: payload.sub,
      username: payload.username,
      action: actionText,
      resource: "users",
      result: "SUCCESS",
      ip: extractClientIp(c),
      userAgent: c.req.header("user-agent") || c.req.header("User-Agent"),
      details: {
        targetUserId: id,
        targetUsername: existingUser.username,
        targetFullName: `${existingUser.firstName || ""} ${existingUser.lastName || ""}`.trim() || existingUser.username,
        changesSummary: changesText,
        changesCount: Object.keys(changes).length,
        changes: changes
      }
    });

    if (changes.userGroup || changes.role) {
      const oldGroupVal = existingUser.userGroup || existingUser.role || "حسابدار";
      const newGroupVal = body.userGroup || body.role || "حسابدار";
      const shamsiEdit = getShamsiDetails(new Date());
      const editActionText = `ویرایش نقش کاربر ${existingUser.username} از '${oldGroupVal}' به '${newGroupVal}' در تاریخ ${shamsiEdit.shamsiDate} و ساعت ${shamsiEdit.shamsiTime}`;

      await logAuditEvent({
        userId: payload.sub,
        username: payload.username,
        userRole: payload.role === "admin" ? "مدیر" : payload.role,
        action: editActionText,
        eventType: AFTA_LOG_EVENT_TYPES.USER_GROUP_CHANGE,
        resource: "گروه‌های کاربری",
        result: "SUCCESS",
        ip: extractClientIp(c),
        userAgent: c.req.header("user-agent"),
        details: {
          tableName: "گروه‌های کاربری",
          operation: "ویرایش",
          aftaClause: "4-2-1",
          name: existingUser.username,
          oldDescription: oldGroupVal,
          description: newGroupVal,
          role: newGroupVal,
          targetUserId: id
        }
      });
    }

    const updated = await db.collection("users").findOne({ _id: userObjectId }, { projection: { password: 0 } });
    return c.json({ success: true, data: updated });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// DELETE /api/users/:id - Delete a user (Admin only)
router.delete("/:id", async (c) => {
  try {
    const payload = (c.get as any)("jwtPayload") as any;
    if (payload.role !== "admin") {
      return c.json({ success: false, message: "دسترسی غیرمجاز. فقط مدیر سیستم مجاز به حذف کاربر است." }, 403);
    }

    const id = c.req.param("id");
    const db = getDb();
    const userObjectId = new ObjectId(id);

    const existingUser = await db.collection("users").findOne({ _id: userObjectId });
    if (!existingUser) {
      return c.json({ success: false, message: "کاربر مورد نظر یافت نشد" }, 404);
    }

    // Prevent deleting oneself
    if (payload.sub === id) {
      return c.json({ success: false, message: "شما نمی‌توانید حساب ادمین فعال خودتان را حذف کنید" }, 400);
    }

    const result = await db.collection("users").deleteOne({ _id: userObjectId });
    if (result.deletedCount === 0) {
      return c.json({ success: false, message: "کاربر مورد نظر یافت نشد" }, 404);
    }

    // Log audit action with USER_GROUP_CHANGE (AFTA Clause 1 Table 4-2)
    const shamsiDelete = getShamsiDetails(new Date());
    const roleNameDelete = existingUser.role || existingUser.userGroup || "حسابدار";
    const deleteActionText = `کاربر ${existingUser.username} با نقش ${roleNameDelete} در تاریخ ${shamsiDelete.shamsiDate} و ساعت ${shamsiDelete.shamsiTime} از سیستم حذف شد`;

    await logAuditEvent({
      userId: payload.sub,
      username: payload.username,
      userRole: payload.role === "admin" ? "مدیر" : payload.role,
      action: deleteActionText,
      eventType: AFTA_LOG_EVENT_TYPES.USER_GROUP_CHANGE,
      resource: "گروه‌های کاربری",
      result: "SUCCESS",
      ip: extractClientIp(c),
      userAgent: c.req.header("user-agent"),
      details: {
        tableName: "گروه‌های کاربری",
        operation: "حذف",
        aftaClause: "4-2-1",
        name: existingUser.username,
        description: roleNameDelete,
        role: roleNameDelete,
        icon: "",
        targetUserId: id
      }
    });

    return c.json({ success: true, message: "کاربر با موفقیت از سیستم حذف شد" });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// GET /api/users/audit-logs - List activity logs (Admin or Authorized users)
router.get("/audit-logs", async (c) => {
  try {
    const payload = (c.get as any)("jwtPayload") as any;
    const userRole = payload?.role || "حسابدار";
    const userPermissions = payload?.permissions || {};
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
        details: { reason: "تلاش‌های ناموفق برای خواندن اطلاعات از ثبت‌نشان‌ها (الزام ۲ افتا)", requiredPermission: "audit.view" }
      });
      return c.json({ success: false, message: "دسترسی غیرمجاز. فقط مدیر سیستم یا کاربران دارنده مجوز مجاز به مشاهده تاریخچه ثبت نشان‌ها هستند." }, 403);
    }

    await signExistingLogs();
    const { limit = "100", username, result, osType, eventType, resource, search, sortBy = "createdAt", sortOrder = "desc" } = c.req.query();
    const db = getDb();
    const query: any = {};
    if (username) query.username = { $regex: username, $options: "i" };
    if (result) query.result = result;
    if (osType) query.osType = osType;
    if (eventType) query.eventType = { $regex: eventType, $options: "i" };
    if (resource) query.resource = { $regex: resource, $options: "i" };

    if (search && typeof search === "string" && search.trim() !== "" && search !== "undefined" && search !== "null" && !search.includes("function")) {
      const sRegex = { $regex: search.trim(), $options: "i" };
      query.$or = [
        { username: sRegex },
        { userFullName: sRegex },
        { action: sRegex },
        { eventType: sRegex },
        { resource: sRegex },
        { ip: sRegex },
        { osName: sRegex },
        { browser: sRegex },
        { shamsiDate: sRegex }
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

    const limitNum = Math.min(parseInt(limit, 10) || 100, 500);
    const logs = await db.collection("audit_logs")
      .find(query)
      .sort({ [sortField]: sortDirection })
      .limit(limitNum)
      .toArray();

    const enrichedLogs = logs.map((log: any) => ({
      ...log,
      isIntegrityValid: verifyLogIntegrity(log)
    }));

    const successActionDesc = `ورود و فراخوانی اطلاعات ثبت نشان‌ها توسط کاربر '${reqUsername}'`;
    await logAuditEvent({
      userId: payload.sub,
      username: reqUsername,
      userRole: payload.role || "مدیر",
      action: successActionDesc,
      eventType: AFTA_LOG_EVENT_TYPES.AUDIT_LOG_READ_SUCCESS,
      resource: "/api/users/audit-logs",
      result: "SUCCESS",
      ip: extractClientIp(c),
      details: { limit, totalReturned: enrichedLogs.length }
    });

    return c.json({ success: true, data: enrichedLogs });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

export default router;
