import { Hono } from "hono";
import { SanamaService } from "../lib/sanama/sanama.service";

const router = new Hono();

// GET /api/sanama/settings
router.get("/settings", async (c) => {
  try {
    const settings = await SanamaService.getOrgSettings();
    return c.json({ success: true, data: settings });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// POST /api/sanama/settings
router.post("/settings", async (c) => {
  try {
    const body = await c.req.json();
    const { mainOrgID, mainOrgCode } = body;
    if (!mainOrgID || !mainOrgCode) {
      return c.json({ success: false, message: "شناسه ملی دستگاه و ردیف بودجه‌ای الزامی هستند." }, 400);
    }
    await SanamaService.saveOrgSettings(mainOrgID, mainOrgCode);
    return c.json({ success: true, message: "تنظیمات دستگاه اجرایی سناما با موفقیت ذخیره شد." });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// POST /api/sanama/validate
router.post("/validate", async (c) => {
  try {
    const options = await c.req.json();
    const validation = await SanamaService.validateData(options);
    return c.json({ success: true, data: validation });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// POST /api/sanama/preview
router.post("/preview", async (c) => {
  try {
    const options = await c.req.json();
    const preview = await SanamaService.generatePreview(options);
    return c.json({ success: true, data: preview });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// GET /api/sanama/export-xml
router.get("/export-xml", async (c) => {
  try {
    const query = c.req.query();
    const options = {
      exportType: query.exportType as any,
      month: query.month,
      fiscalYear: query.fiscalYear,
      fromAccountCode: query.fromAccountCode,
      toAccountCode: query.toAccountCode,
      fromDate: query.fromDate,
      toDate: query.toDate,
      fromDocNo: query.fromDocNo,
      toDocNo: query.toDocNo,
      sourceType: query.sourceType
    };

    const userPayload: any = (c as any).get("jwtPayload") || {};
    const userInfo = {
      username: userPayload.username || "admin",
      ip: c.req.header("x-forwarded-for") || "127.0.0.1"
    };

    const { xml, filename, validation } = await SanamaService.generateXml(options, userInfo);

    // If query has strict=true and there are errors, return 400 with validation errors
    if (query.strict === "true" && !validation.isValid) {
      return c.json(
        {
          success: false,
          message: "فایل XML به دلیل وجود خطاهای اعتبارسنجی قابل دانلود نیست.",
          validation
        },
        400
      );
    }

    c.header("Content-Type", "application/xml; charset=utf-8");
    c.header("Content-Disposition", `attachment; filename="${filename}"`);
    return c.text(xml);
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

export default router;
