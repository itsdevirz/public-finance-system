import { Hono } from "hono";
import { getDb } from "../db/index.js";
import { ObjectId } from "mongodb";
import type { MonthlyDepreciationCalculation, DepreciationSetup } from "../db/types.js";

const router = new Hono();

function serialize(doc: Record<string, unknown>) {
  return JSON.parse(JSON.stringify(doc, (_k, v) =>
    v instanceof ObjectId ? v.toHexString() : v
  ));
}

// GET /api/monthly-depreciations
router.get("/", async (c) => {
  try {
    const db = getDb();
    const list = await db.collection<MonthlyDepreciationCalculation>("monthly_depreciations")
      .find()
      .sort({ createdAt: -1 })
      .toArray();
    return c.json({ success: true, data: serialize(list as any) });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// POST /api/monthly-depreciations/calculate
router.post("/calculate", async (c) => {
  try {
    const body = await c.req.json();
    const db = getDb();

    const { fiscal_year, month, filters = {} } = body;
    if (!fiscal_year || !month) {
      return c.json({ success: false, message: "سال و ماه محاسبه الزامی است" }, 400);
    }

    // ۱. دریافت دارایی‌ها از پایگاه داده (یا ایجاد نمونه دارایی‌ها در صورت خالی بودن)
    let dbAssets: any[] = await db.collection("inventory_assets").find().toArray();
    if (dbAssets.length === 0) {
      // ایجاد داده‌های نمونه جهت اجرای بی‌نقص برنامه
      dbAssets = [
        {
          code: "FA-1001",
          name: "سواری پژو پارس - اداری",
          group: "وسایل نقلیه",
          subgroup: "سواری",
          cost_center: "۱۰۲ - واحد پشتیبانی و تدارکات",
          project: "پروژه بهسازی شبکه داخلی",
          location: "ساختمان مرکزی - طبقه اول",
          org_unit: "اداره پشتیبانی",
          original_value: 850_000_000,
          utilization_date: "1401/02/10",
          status: "فعال"
        },
        {
          code: "FA-1002",
          name: "سرور HP ProLiant DL380",
          group: "رایانه و ملزومات فناوری",
          subgroup: "سرور",
          cost_center: "۱۰۱ - واحد مالی و حسابداری",
          project: "پروژه بهسازی شبکه داخلی",
          location: "ساختمان مرکزی - طبقه دوم",
          org_unit: "معاونت اداری و مالی",
          original_value: 450_000_000,
          utilization_date: "1402/06/15",
          status: "فعال"
        },
        {
          code: "FA-1003",
          name: "میز کنفرانس ۲۰ نفره چوبی",
          group: "تجهیزات اداری",
          subgroup: "میز و صندلی اداری",
          cost_center: "۱۰۳ - واحد مدیریت و اجرایی",
          project: "طرح تجهیز سالن همایش",
          location: "ساختمان مرکزی - طبقه دوم",
          org_unit: "مدیریت سرمایه انسانی",
          original_value: 120_000_000,
          utilization_date: "1403/01/20",
          status: "فعال"
        },
        {
          code: "FA-1004",
          name: "سوله انبار مرکزی پشتیبانی",
          group: "ساختمان و ابنیه",
          subgroup: "ملکی اداری",
          cost_center: "۱۰۲ - واحد پشتیبانی و تدارکات",
          project: "طرح احداث ساختمان مرکزی",
          location: "انبار شماره ۱ - پشتیبانی",
          org_unit: "اداره پشتیبانی",
          original_value: 4_500_000_000,
          utilization_date: "1395/10/01",
          status: "فعال"
        },
        {
          code: "FA-1005",
          name: "لپ‌تاپ لنوو ThinkPad - امور مالی",
          group: "رایانه و ملزومات فناوری",
          subgroup: "لپ‌تاپ",
          cost_center: "۱۰۱ - واحد مالی و حسابداری",
          project: "پروژه بهسازی شبکه داخلی",
          location: "ساختمان مرکزی - طبقه اول",
          org_unit: "معاونت اداری و مالی",
          original_value: 65_000_000,
          utilization_date: "1403/02/05",
          status: "اسقاط شده" // ایجاد خطا برای دارایی‌های اسقاط شده
        },
        {
          code: "FA-1006",
          name: "کمپرسور باد کارگاه",
          group: "ماشین‌آلات و تجهیزات کارگاهی",
          subgroup: "کمپرسور",
          cost_center: "۱۰۴ - کارگاه شماره ۱",
          project: "طرح احداث ساختمان مرکزی",
          location: "انبار شماره ۱ - پشتیبانی",
          org_unit: "اداره پشتیبانی",
          original_value: 350_000_000,
          utilization_date: "", // ایجاد خطا برای تاریخ نامعتبر
          status: "فعال"
        }
      ];
    }

    // ۲. دریافت قوانین تنظیم استهلاک
    const deprRules = await db.collection<DepreciationSetup>("depreciation_setups").find({ status: "فعال" }).toArray();

    let totalAssetsCount = 0;
    let calculatedCount = 0;
    let rejectedCount = 0;
    let totalDeprMonth = 0;
    let totalBookValue = 0;

    const items = dbAssets.map((asset: any, idx: number) => {
      // نگاشت پویای فیلدها جهت پشتیبانی از ثبت اموال (camelCase) و شبیه‌ساز (snake_case)
      const assetCode = asset.assetCode || asset.code;
      const assetName = asset.assetName || asset.name;
      const assetGroup = asset.assetGroup || asset.group;
      const assetSubgroup = asset.assetSubgroup || asset.subgroup;
      const costCenter = asset.costCenter || asset.cost_center;
      const project = asset.project || asset.project;
      const location = asset.location || asset.location;
      const orgUnit = asset.organization || asset.org_unit;
      const initialVal = Number(asset.purchaseAmount || asset.original_value || 0);
      const utilizationDate = asset.operationDate || asset.purchaseDate || asset.utilization_date;
      const usefulLifeFromAsset = Number(asset.usefulLife || asset.useful_life || 0);
      const status = asset.status || "فعال";

      totalAssetsCount++;
      
      // بررسی فیلترهای اعمال شده
      let isMatched = true;
      if (filters.asset_group && assetGroup !== filters.asset_group) isMatched = false;
      if (filters.asset_subgroup && assetSubgroup !== filters.asset_subgroup) isMatched = false;
      if (filters.cost_center && costCenter !== filters.cost_center) isMatched = false;
      if (filters.project && project !== filters.project) isMatched = false;
      if (filters.location && location !== filters.location) isMatched = false;
      if (filters.org_unit && orgUnit !== filters.org_unit) isMatched = false;
      if (filters.asset_status && status !== filters.asset_status) isMatched = false;

      if (!isMatched) {
        return null; // فیلتر شده است
      }

      let errorMsg = "";
      let amount = 0;
      let accBefore = 0;
      let accAfter = 0;
      let usefulLife = usefulLifeFromAsset || 5;

      // بررسی وضعیت اسقاطی
      if (status === "اسقاط شده") {
        errorMsg = "دارایی اسقاط شده است";
      } else if (status === "فروخته شده") {
        errorMsg = "دارایی فروخته شده است";
      } else if (!utilizationDate) {
        errorMsg = "تاریخ بهره‌برداری نامعتبر است";
      } else {
        // یافتن قانون متناسب با دارایی بر اساس گروه
        const rule = deprRules.find(r => r.scope?.asset_group === assetGroup);
        if (!rule) {
          errorMsg = "روش استهلاک تعریف نشده است";
        } else {
          usefulLife = usefulLifeFromAsset || rule.calc_method.useful_life || 5;
          const isYearly = rule.calc_method.useful_life_unit === "سال";
          const totalMonths = isYearly ? usefulLife * 12 : usefulLife;

          // شبیه‌ساز محاسبه ماه‌های سپری شده فرضی
          const matchedYear = parseInt(utilizationDate.split("/")[0]) || 1400;
          const passedMonths = Math.max(0, (fiscal_year - matchedYear) * 12);
          
          const salvage = Number(rule.calc_method.salvage_value || 0);
          const baseValue = initialVal - salvage;

          if (passedMonths >= totalMonths) {
            errorMsg = "عمر مفید دارایی به پایان رسیده است";
          } else {
            accBefore = Math.floor((baseValue / totalMonths) * Math.min(passedMonths, totalMonths));
            amount = Math.floor(baseValue / totalMonths);
            accAfter = accBefore + amount;
          }
        }
      }

      if (errorMsg) {
        rejectedCount++;
        return {
          row_num: 0,
          asset_code: assetCode,
          asset_name: assetName,
          asset_group: assetGroup,
          utilization_date: utilizationDate || "تعیین نشده",
          original_value: initialVal,
          useful_life: usefulLife,
          accumulated_before: 0,
          amount: 0,
          accumulated_after: 0,
          book_value: initialVal,
          status: "خطا در محاسبه",
          error_msg: errorMsg
        };
      } else {
        calculatedCount++;
        totalDeprMonth += amount;
        const bookVal = initialVal - accAfter;
        totalBookValue += bookVal;
        return {
          row_num: 0,
          asset_code: assetCode,
          asset_name: assetName,
          asset_group: assetGroup,
          utilization_date: utilizationDate,
          original_value: initialVal,
          useful_life: usefulLife,
          accumulated_before: accBefore,
          amount: amount,
          accumulated_after: accAfter,
          book_value: bookVal,
          status: "محاسبه شده"
        };
      }
    }).filter(Boolean);

    // به‌روزرسانی ردیف‌ها
    const finalItems = items.map((item: any, idx: number) => ({
      ...item,
      row_num: idx + 1
    }));

    const resultPayload = {
      fiscal_year,
      month,
      calc_date: `${fiscal_year}/${month === "اسفند" ? "12" : "05"}/31`,
      voucher_date: `${fiscal_year}/${month === "اسفند" ? "12" : "05"}/31`,
      status: "پیش‌نویس",
      filters,
      summary: {
        total_assets: totalAssetsCount,
        calculated_assets: calculatedCount,
        rejected_assets: rejectedCount,
        total_depreciation_amount: totalDeprMonth,
        total_book_value: totalBookValue
      },
      items: finalItems
    };

    return c.json({ success: true, data: resultPayload });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// POST /api/monthly-depreciations/save
router.post("/save", async (c) => {
  try {
    const body = await c.req.json();
    const db = getDb();

    const { fiscal_year, month } = body;
    if (!fiscal_year || !month) {
      return c.json({ success: false, message: "اطلاعات دوره الزامی است" }, 400);
    }

    const doc = {
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // در صورت وجود محاسبات تکراری حذف یا بروزرسانی می‌شود
    await db.collection("monthly_depreciations").deleteOne({ fiscal_year, month });

    const result = await db.collection("monthly_depreciations").insertOne(doc);
    const saved = await db.collection("monthly_depreciations").findOne({ _id: result.insertedId });
    return c.json({ success: true, data: serialize(saved as any) }, 201);
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// POST /api/monthly-depreciations/issue-voucher/:id
router.post("/issue-voucher/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (!ObjectId.isValid(id)) return c.json({ success: false, message: "شناسه نامعتبر" }, 400);

    const db = getDb();
    const calc = await db.collection<MonthlyDepreciationCalculation>("monthly_depreciations").findOne({ _id: new ObjectId(id) });
    if (!calc) {
      return c.json({ success: false, message: "محاسبه مورد نظر یافت نشد" }, 404);
    }

    const voucherNo = `VOU-${calc.fiscal_year}-${Math.floor(1000 + Math.random() * 9000)}`;
    const update = await db.collection("monthly_depreciations").findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: "سند صادر شده",
          voucher: {
            voucher_number: voucherNo,
            voucher_status: "صادر شده موقت",
            expense_account_code: "611010",
            accumulated_depr_account_code: "151010"
          },
          updatedAt: new Date().toISOString()
        }
      },
      { returnDocument: "after" }
    );

    return c.json({ success: true, data: serialize(update as any) });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// DELETE /api/monthly-depreciations/:id
router.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (!ObjectId.isValid(id)) return c.json({ success: false, message: "شناسه نامعتبر" }, 400);

    const db = getDb();
    const result = await db.collection("monthly_depreciations").deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return c.json({ success: false, message: "محاسبه یافت نشد" }, 404);
    }
    return c.json({ success: true, message: "محاسبه با موفقیت لغو و حذف شد" });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

export default router;
