import { Hono } from "hono";
import { getDb } from "../db/index.js";
import { ObjectId } from "mongodb";
import { hashPassword } from "../lib/auth.js";
import { validatePassword } from "../lib/securityPolicy.js";
import { logAuditEvent } from "../lib/auditLogger.js";

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
      ipRestriction: body.ipRestriction || "",
      allowOutside: !!body.allowOutside,
      maxFailedAttempts: Number(body.maxFailedAttempts) || 5,
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
    
    // Log audit action
    await logAuditEvent({
      userId: payload.sub,
      username: payload.username,
      action: "ایجاد کاربر جدید",
      resource: "users",
      result: "SUCCESS",
      ip: c.req.header("x-forwarded-for") || "127.0.0.1",
      details: { targetUserId: result.insertedId.toHexString(), targetUsername: doc.username, role: doc.role }
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
      updateData.ipRestriction = body.ipRestriction?.trim() !== undefined ? body.ipRestriction.trim() : existingUser.ipRestriction;
      updateData.allowOutside = body.allowOutside !== undefined ? !!body.allowOutside : existingUser.allowOutside;
      updateData.maxFailedAttempts = body.maxFailedAttempts !== undefined ? Number(body.maxFailedAttempts) : existingUser.maxFailedAttempts;
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

    // Only update password if provided and valid according to policy
    if (body.password && body.password.trim() !== "") {
      const passCheck = validatePassword(body.password);
      if (!passCheck.valid) {
        return c.json({ success: false, message: passCheck.message }, 400);
      }
      updateData.password = await hashPassword(body.password);
    }

    await db.collection("users").updateOne(
      { _id: userObjectId },
      { $set: updateData }
    );

    // Log audit action
    await logAuditEvent({
      userId: payload.sub,
      username: payload.username,
      action: "ویرایش اطلاعات کاربر",
      resource: "users",
      result: "SUCCESS",
      ip: c.req.header("x-forwarded-for") || "127.0.0.1",
      details: { targetUserId: id, updatedRole: updateData.role, updatedStatus: updateData.status }
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

    const db = getDb();
    const logs = await db.collection("audit_logs").find().sort({ createdAt: -1 }).toArray();
    return c.json({ success: true, data: logs });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

export default router;
