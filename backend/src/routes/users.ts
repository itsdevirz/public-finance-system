import { Hono } from "hono";
import { getDb } from "../db/index.js";
import { ObjectId } from "mongodb";
import { hashPassword } from "../lib/auth.js";
import { validatePassword } from "../lib/securityPolicy.js";
import { logAuditEvent, AFTA_LOG_EVENT_TYPES, verifyLogIntegrity, signExistingLogs } from "../lib/auditLogger.js";

const router = new Hono();

// GET /api/users - List all users
router.get("/", async (c) => {
  try {
    const payload = (c.get as any)("jwtPayload") as any;
    const isAdmin = payload.role === "admin";
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
    const rawPass = body.password || "AdminPass123!";
    const passCheck = validatePassword(rawPass);
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
    
    // Log audit action with USER_GROUP_CHANGE eventType
    await logAuditEvent({
      userId: payload.sub,
      username: payload.username,
      userRole: payload.role,
      action: "ایجاد کاربر و تعیین گروه کاربری",
      eventType: AFTA_LOG_EVENT_TYPES.USER_GROUP_CHANGE,
      resource: "users",
      result: "SUCCESS",
      ip: c.req.header("x-forwarded-for") || "127.0.0.1",
      userAgent: c.req.header("user-agent"),
      details: { targetUserId: result.insertedId.toHexString(), targetUsername: doc.username, userGroup: doc.userGroup, role: doc.role }
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
    const isAdmin = payload.role === "admin";

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
      updateData.role = body.role || existingUser.role;
      updateData.permissions = body.permissions || existingUser.permissions;
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
      const passCheck = validatePassword(body.password.trim());
      if (!passCheck.valid) {
        return c.json({ success: false, message: passCheck.message }, 400);
      }
      updateData.password = await hashPassword(body.password.trim());
    }

    await db.collection("users").updateOne(
      { _id: userObjectId },
      { $set: updateData }
    );

    // Immediate enforcement: Revoke active sessions upon security attribute changes
    const isSecurityAttrChanged =
      (updateData.status && updateData.status !== existingUser.status) ||
      (updateData.role && updateData.role !== existingUser.role) ||
      updateData.password ||
      (updateData.permissions && JSON.stringify(updateData.permissions) !== JSON.stringify(existingUser.permissions));

    if (isSecurityAttrChanged) {
      const activeSessions = await db.collection("active_sessions").find({ userId: userObjectId }).toArray();
      if (activeSessions.length > 0) {
        const tokensToRevoke = activeSessions.map((s) => ({
          token: s.token,
          revokedAt: new Date().toISOString(),
          reason: "ابطال فوری نشست به دلیل تغییر ویژگی‌های امنیتی کاربر"
        }));
        await db.collection("revoked_tokens").insertMany(tokensToRevoke);
        await db.collection("active_sessions").deleteMany({ userId: userObjectId });
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
    for (const [key, label] of Object.entries(fieldLabels)) {
      if (key === "password") {
        if (body.password && typeof body.password === "string" && body.password.trim() !== "") {
          changes[key] = { label, before: "•••••• (رمز قبلی)", after: "•••••• (تغییر یافته)" };
        }
        continue;
      }
      const beforeVal = (existingUser as any)[key];
      const afterVal = (updateData as any)[key];
      if (afterVal !== undefined && JSON.stringify(beforeVal) !== JSON.stringify(afterVal)) {
        changes[key] = {
          label,
          before: beforeVal === true ? "فعال" : beforeVal === false ? "غیرفعال" : (beforeVal ?? "مشخص نشده"),
          after: afterVal === true ? "فعال" : afterVal === false ? "غیرفعال" : (afterVal ?? "مشخص نشده")
        };
      }
    }

    // Log audit action with before & after changes and UserAgent
    await logAuditEvent({
      userId: payload.sub,
      username: payload.username,
      action: `ویرایش مشخصات کاربر "${existingUser.username}"`,
      resource: "users",
      result: "SUCCESS",
      ip: c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "127.0.0.1",
      userAgent: c.req.header("user-agent") || c.req.header("User-Agent"),
      details: {
        targetUserId: id,
        targetUsername: existingUser.username,
        targetFullName: `${existingUser.firstName || ""} ${existingUser.lastName || ""}`.trim() || existingUser.username,
        changesCount: Object.keys(changes).length,
        changes: changes
      }
    });

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

    // Log audit action
    await logAuditEvent({
      userId: payload.sub,
      username: payload.username,
      action: "حذف کاربر",
      resource: "users",
      result: "SUCCESS",
      ip: c.req.header("x-forwarded-for") || "127.0.0.1",
      details: { deletedUserId: id, deletedUsername: existingUser.username }
    });

    return c.json({ success: true, message: "کاربر با موفقیت از سیستم حذف شد" });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// GET /api/users/audit-logs - List activity logs (Admin only)
router.get("/audit-logs", async (c) => {
  try {
    const payload = (c.get as any)("jwtPayload") as any;
    if (payload.role !== "admin") {
      return c.json({ success: false, message: "دسترسی غیرمجاز. فقط مدیر سیستم مجاز به مشاهده تاریخچه عملکرد است." }, 403);
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

    return c.json({ success: true, data: enrichedLogs });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

export default router;
