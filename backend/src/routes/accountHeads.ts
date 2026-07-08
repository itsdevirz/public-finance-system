import { Hono } from "hono";
import { getDb } from "../db/index.js";
import { ObjectId } from "mongodb";

const router = new Hono();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildTree(accounts: any[]): any[] {
  const map = new Map<string, any>();
  const roots: any[] = [];

  for (const acc of accounts) {
    map.set(String(acc._id), { ...acc, children: [] });
  }

  for (const acc of accounts) {
    const node = map.get(String(acc._id))!;
    if (acc.parentId) {
      const parent = map.get(String(acc.parentId));
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  }

  // مرتب‌سازی بر اساس کد حساب
  function sortChildren(nodes: any[]) {
    nodes.sort((a, b) => a.code.localeCompare(b.code, "fa"));
    for (const n of nodes) sortChildren(n.children);
  }
  sortChildren(roots);

  return roots;
}

// ─── GET /api/account-heads — همه حساب‌ها (صاف) ──────────────────────────────
router.get("/", async (c) => {
  try {
    const db = getDb();
    const { search, type, flat } = c.req.query();

    const filter: any = {};

    if (search) {
      filter.$or = [
        { code: { $regex: search, $options: "i" } },
        { title: { $regex: search, $options: "i" } },
      ];
    }

    if (type) {
      filter.accountType = type;
    }

    const accounts = await db
      .collection("account_heads")
      .find(filter)
      .sort({ code: 1 })
      .toArray();

    if (flat === "true") {
      return c.json({ success: true, data: accounts });
    }

    return c.json({ success: true, data: buildTree(accounts) });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ─── GET /api/account-heads/:id ───────────────────────────────────────────────
router.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const db = getDb();
    const account = await db
      .collection("account_heads")
      .findOne({ _id: new ObjectId(id) });

    if (!account) {
      return c.json({ success: false, message: "سرفصل حساب یافت نشد" }, 404);
    }
    return c.json({ success: true, data: account });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ─── POST /api/account-heads ──────────────────────────────────────────────────
router.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const db = getDb();

    const required = ["code", "title", "accountType", "level", "nature"];
    for (const f of required) {
      if (!body[f]) {
        return c.json({ success: false, message: `فیلد ${f} الزامی است` }, 400);
      }
    }

    // بررسی تکراری نبودن کد
    const existing = await db
      .collection("account_heads")
      .findOne({ code: body.code });
    if (existing) {
      return c.json({ success: false, message: "حسابی با این کد قبلاً ثبت شده است" }, 400);
    }

    // بررسی وجود والد (اگر parentId داده شده)
    if (body.parentId) {
      const parent = await db
        .collection("account_heads")
        .findOne({ _id: new ObjectId(body.parentId) });
      if (!parent) {
        return c.json({ success: false, message: "حساب والد یافت نشد" }, 400);
      }
    }

    const doc = {
      code: body.code,
      title: body.title,
      accountType: body.accountType,      // دارایی | بدهی | درآمد | هزینه | سرمایه
      level: body.level,                  // گروه | کل | معین | تفصیلی
      nature: body.nature,                // بدهکار | بستانکار
      parentId: body.parentId ? new ObjectId(body.parentId) : null,
      isActive: body.isActive !== false,
      description: body.description ?? "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await db.collection("account_heads").insertOne(doc);
    return c.json({ success: true, data: { ...doc, _id: result.insertedId } }, 201);
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ─── PUT /api/account-heads/:id ───────────────────────────────────────────────
router.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const db = getDb();

    // بررسی تکراری نبودن کد برای سایر حساب‌ها
    if (body.code) {
      const existing = await db
        .collection("account_heads")
        .findOne({ code: body.code, _id: { $ne: new ObjectId(id) } });
      if (existing) {
        return c.json({ success: false, message: "حسابی با این کد قبلاً ثبت شده است" }, 400);
      }
    }

    // جلوگیری از circular reference
    if (body.parentId && String(body.parentId) === id) {
      return c.json({ success: false, message: "حساب نمی‌تواند والد خودش باشد" }, 400);
    }

    const { _id, ...updateData } = body;
    const update: any = {
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    if (updateData.parentId) {
      update.parentId = new ObjectId(updateData.parentId);
    } else if (updateData.parentId === null) {
      update.parentId = null;
    }

    const result = await db.collection("account_heads").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: update },
      { returnDocument: "after" }
    );

    if (!result) {
      return c.json({ success: false, message: "سرفصل حساب یافت نشد" }, 404);
    }

    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ─── PATCH /api/account-heads/:id/toggle-active ──────────────────────────────
router.patch("/:id/toggle-active", async (c) => {
  try {
    const id = c.req.param("id");
    const db = getDb();
    const account = await db
      .collection("account_heads")
      .findOne({ _id: new ObjectId(id) });

    if (!account) {
      return c.json({ success: false, message: "سرفصل حساب یافت نشد" }, 404);
    }

    const result = await db.collection("account_heads").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { isActive: !account.isActive, updatedAt: new Date().toISOString() } },
      { returnDocument: "after" }
    );

    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ─── DELETE /api/account-heads/:id ───────────────────────────────────────────
router.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const db = getDb();

    // بررسی اینکه حساب زیرمجموعه دارد یا خیر
    const childCount = await db
      .collection("account_heads")
      .countDocuments({ parentId: new ObjectId(id) });

    if (childCount > 0) {
      return c.json(
        { success: false, message: "این حساب دارای زیرمجموعه است و قابل حذف نیست" },
        400
      );
    }

    // بررسی اینکه حساب در اسناد مالی استفاده شده یا خیر
    const account = await db
      .collection("account_heads")
      .findOne({ _id: new ObjectId(id) });

    if (!account) {
      return c.json({ success: false, message: "سرفصل حساب یافت نشد" }, 404);
    }

    const usedInDoc = await db.collection("journal_documents").findOne({
      "lines.account_code": account.code,
    });

    if (usedInDoc) {
      // فقط غیرفعال کن
      await db.collection("account_heads").updateOne(
        { _id: new ObjectId(id) },
        { $set: { isActive: false, updatedAt: new Date().toISOString() } }
      );
      return c.json({
        success: true,
        deactivated: true,
        message: "این حساب در اسناد مالی استفاده شده است. به جای حذف، غیرفعال گردید.",
      });
    }

    await db.collection("account_heads").deleteOne({ _id: new ObjectId(id) });
    return c.json({ success: true, message: "سرفصل حساب با موفقیت حذف شد" });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ─── GET /api/account-heads/:id/balance — گردش حساب ────────────────────────
router.get("/:id/balance", async (c) => {
  try {
    const id = c.req.param("id");
    const db = getDb();

    const account = await db
      .collection("account_heads")
      .findOne({ _id: new ObjectId(id) });

    if (!account) {
      return c.json({ success: false, message: "سرفصل حساب یافت نشد" }, 404);
    }

    const pipeline = [
      { $match: { "lines.account_code": account.code } },
      { $unwind: "$lines" },
      { $match: { "lines.account_code": account.code } },
      {
        $group: {
          _id: null,
          totalDebit: { $sum: "$lines.debit" },
          totalCredit: { $sum: "$lines.credit" },
          docCount: { $sum: 1 },
        },
      },
    ];

    const [stats] = await db
      .collection("journal_documents")
      .aggregate(pipeline)
      .toArray();

    const totalDebit = stats?.totalDebit ?? 0;
    const totalCredit = stats?.totalCredit ?? 0;
    const balance =
      account.nature === "بدهکار"
        ? totalDebit - totalCredit
        : totalCredit - totalDebit;

    return c.json({
      success: true,
      data: {
        code: account.code,
        title: account.title,
        nature: account.nature,
        totalDebit,
        totalCredit,
        balance,
        docCount: stats?.docCount ?? 0,
      },
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

export default router;
