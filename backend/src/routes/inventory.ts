import { Hono } from "hono";
import { getDb } from "../db/index.js";
import { ObjectId } from "mongodb";
import { decryptDocument } from "../lib/crypto.js";
import { serialize } from "../lib/helpers.js";

const router = new Hono();

// Helper to seed warehouses if empty
// GET /api/inventory/assets (Registered Assets)
router.get("/assets", async (c) => {
  try {
    const db = getDb();
    const list = await db.collection("inventory_assets").find().toArray();
    return c.json({ success: true, data: list });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// POST /api/inventory/assets
router.post("/assets", async (c) => {
  try {
    const db = getDb();
    const body = await c.req.json();
    const doc = {
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    delete doc._id;
    const res = await db.collection("inventory_assets").insertOne(doc);
    return c.json({ success: true, data: { ...doc, _id: res.insertedId, id: doc.id || res.insertedId.toString() } });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// PUT /api/inventory/assets/:id
router.put("/assets/:id", async (c) => {
  try {
    const db = getDb();
    const id = c.req.param("id");
    const body = await c.req.json();
    const query = id.length === 24 ? { _id: new ObjectId(id) } : { id: Number(id) };
    const doc = { ...body, updatedAt: new Date().toISOString() };
    delete doc._id;
    await db.collection("inventory_assets").updateOne(query, { $set: doc });
    return c.json({ success: true, data: doc });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// DELETE /api/inventory/assets/:id
router.delete("/assets/:id", async (c) => {
  try {
    const db = getDb();
    const id = c.req.param("id");
    const query = id.length === 24 ? { _id: new ObjectId(id) } : { id: Number(id) };
    await db.collection("inventory_assets").deleteOne(query);
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// GET /api/inventory/sanama-xml
router.get("/sanama-xml", async (c) => {
  try {
    const db = getDb();
    
    // Fetch all journal documents
    let docs = await db.collection("journal_documents").find({ status: "CONFIRMED" }).toArray();
    if (docs.length === 0) {
      // Fallback to all documents if no confirmed ones are found (for sandbox/demo purposes)
      docs = await db.collection("journal_documents").find().toArray();
    }

    const attrs = [
      "SourceType", "SourceEssence", "OtherSourceType", "CreditType", "TransferalType",
      "CreditInfo", "RankNumber", "CreditCode", "ExpenseArticle", "ConstructArticle",
      "ExpenseDetailArticle", "IncomeCode", "IncomeSubject", "TaxSeason", "DebentureSenderRank",
      "DebentureReceiverRank", "CostCenter", "AwardArticle", "SecuritiesType", "Year",
      "NomineeCode", "Nominee", "GuaranteeEssence", "DemandStatus", "TempPaymentType",
      "LeakageSubject", "AssuranceType", "AssuranceSubject", "CurrencyType", "AccountNumber",
      "InsuranceType", "DebitSubject", "FixedAssetType", "InventoryType", "Quantity",
      "DueDate", "SecuritiesProperties", "ContractProperties", "InvestmentType",
      "AnnualAdjustmentSubject", "TransferItems", "ReceivablesSubject", "AllocationSource",
      "SubBudgetCode"
    ];

    const defaultValues: Record<string, string> = {
      SourceType: "0",
      SourceEssence: "0",
      OtherSourceType: "0",
      CreditType: "",
      TransferalType: "0",
      CreditInfo: "0",
      RankNumber: "0",
      CreditCode: "0",
      ExpenseArticle: "0",
      ConstructArticle: "0",
      ExpenseDetailArticle: "0",
      IncomeCode: "0",
      IncomeSubject: "0",
      TaxSeason: "0",
      DebentureSenderRank: "",
      DebentureReceiverRank: "0",
      CostCenter: "",
      AwardArticle: "0",
      SecuritiesType: "0",
      Year: "",
      NomineeCode: "0",
      Nominee: "0",
      GuaranteeEssence: "0",
      DemandStatus: "0",
      TempPaymentType: "0",
      LeakageSubject: "0",
      AssuranceType: "0",
      AssuranceSubject: "0",
      CurrencyType: "0",
      AccountNumber: "IR0",
      InsuranceType: "0",
      DebitSubject: "0",
      FixedAssetType: "0",
      InventoryType: "0",
      Quantity: "0",
      DueDate: "0",
      SecuritiesProperties: "0",
      ContractProperties: "0",
      InvestmentType: "0",
      AnnualAdjustmentSubject: "0",
      TransferItems: "0",
      ReceivablesSubject: "0",
      AllocationSource: "0",
      SubBudgetCode: "400367"
    };

    // Grouping structure to aggregate debit & credit progress totals by combination
    const reportGroups: Record<string, any> = {};

    for (const doc of docs) {
      let decrypted: any = doc;
      try {
        decrypted = decryptDocument(serialize(doc as Record<string, unknown>));
      } catch (err) {
        // Fallback
      }

      const lines = decrypted.lines || [];
      for (const line of lines) {
        const accCode = String(line.account_code || "");
        if (!accCode) continue;

        // Resolve fields
        const resolvedFields: Record<string, string> = {};
        for (const attr of attrs) {
          let val = "";
          if (line.sanamaFields && line.sanamaFields[attr] !== undefined && line.sanamaFields[attr] !== null) {
            val = String(line.sanamaFields[attr]);
          } else if (line[attr] !== undefined && line[attr] !== null) {
            val = String(line[attr]);
          } else {
            val = defaultValues[attr] || "0";
          }
          if (val === "0" || val === "۰") {
            val = "";
          }
          resolvedFields[attr] = val;
        }

        // Build composite key for grouping
        const compositeKey = `${accCode}_${attrs.map(a => resolvedFields[a]).join("_")}`;

        if (!reportGroups[compositeKey]) {
          reportGroups[compositeKey] = {
            AccCode: accCode,
            SummaryProgressDeptor: 0,
            SummaryProgressCreditor: 0,
            ...resolvedFields
          };
        }

        reportGroups[compositeKey].SummaryProgressDeptor += Number(line.debit || 0);
        reportGroups[compositeKey].SummaryProgressCreditor += Number(line.credit || 0);
      }
    }

    // Generate XML output
    let xml = `<?xml version="1.0" encoding="utf-8"?>`;
    xml += `<SanamaInfo ProtocolName="SANAMA" ProtocolVer="3.1" ProtocolType="MonthlyProtocol" MainOrgID="" MainOrgCode=" 400367" Year="1404" Month="15" Co="شرکت مهندسی تحلیلگران اطلاعات پویا، TahlilgaranCo.ir، Tel:021-44204750، تاریخ ایجاد فایل:1405/02/30, کاربر ایجاد کننده فایل:Admin">`;

    // 1. Render Report List
    for (const group of Object.values(reportGroups)) {
      xml += `<Report_List`;
      xml += ` AccCode="${group.AccCode}"`;
      xml += ` SummaryProgressDeptor="${group.SummaryProgressDeptor}"`;
      xml += ` SummaryProgressCreditor="${group.SummaryProgressCreditor}"`;
      for (const attr of attrs) {
        xml += ` ${attr}="${group[attr]}"`;
      }
      xml += ` />`;
    }

    // 2. Render Bank Reconcile list (6 standard accounts matching the sample XML pattern)
    const mockReconciles = [
      { num: "IR820100004167011444752404", dscp: "بانک پرداخت سرمایه ای", type: "2", ledgerVal: "111067071818" },
      { num: "IR680100004067011407760692", dscp: "بانک دریافت وجوه سپرده", type: "5", ledgerVal: "14172649164" },
      { num: "IR750100004167011452752411", dscp: "بانک رد وجوه سپرده", type: "6", ledgerVal: "160550459" },
      { num: "IR530170000002171140625004", dscp: "بانک پرداخت سرمایه ای", type: "2", ledgerVal: "0" },
      { num: "IR530017000000217114072100", dscp: "بانک دریافت وجوه سپرده", type: "5", ledgerVal: "0" },
      { num: "IR930710000000217114076900", dscp: "بانک رد وجوه سپرده", type: "6", ledgerVal: "0" }
    ];

    for (const rec of mockReconciles) {
      xml += `<ContrastAccount_List AccountNumber="${rec.num}" AccountDscp="${rec.dscp}" AccountType="${rec.type}" MojoodiTebgheDaftar="${rec.ledgerVal}" MojoodiTebgheBank="0">`;
      xml += `<AccountNumberImage />`;
      xml += `<difftype1 Value="0"><Detail_List Date="" Description="" Expense="0" /></difftype1>`;
      xml += `<difftype2 Value="0"><Detail_List Date="" Description="" Expense="0" /></difftype2>`;
      xml += `<difftype3 Value="0"><Detail_List Date="" Description="" Expense="0" /></difftype3>`;
      xml += `<difftype4 Value="0"><Detail_List Date="" Description="" Expense="0" DocNo="" /></difftype4>`;
      xml += `<difftype5 Value="0"><Detail_List Date="" Description="" Expense="0" DocNo="" /></difftype5>`;
      xml += `<difftype6 Value="0"><Detail_List Date="" Description="" Expense="0" /></difftype6>`;
      xml += `<difftype7 Value="0"><Detail_List Date="" Description="" Expense="0" /></difftype7>`;
      xml += `<difftype8 Value="0"><Detail_List Date="" Documents="" Expense="0" /></difftype8>`;
      xml += `<difftype9 Value="0"><Detail_List Date="" Description="" Expense="0" /></difftype9>`;
      xml += `<difftype10 Value="0"><Detail_List CheckNo="0" Zinaf="" Expense="0" Date="" Description="" DocNo="" DocDate="" /></difftype10>`;
      xml += `<difftype11 Value="0"><Detail_List Date="" Description="" Expense="0" /></difftype11>`;
      xml += `<difftype12 Value="0"><Detail_List Date="" Description="" Expense="0" /></difftype12>`;
      xml += `</ContrastAccount_List>`;
    }

    xml += `</SanamaInfo>\n`;

    c.header("Content-Type", "application/xml; charset=utf-8");
    c.header("Content-Disposition", 'attachment; filename="sanama-export.xml"');
    return c.text(xml);
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// GET /api/inventory/receipts
router.get("/receipts", async (c) => {
  try {
    const db = getDb();
    const list = await db.collection("inventory_receipts").find().toArray();
    return c.json({ success: true, data: list });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// POST /api/inventory/receipts
router.post("/receipts", async (c) => {
  try {
    const db = getDb();
    const body = await c.req.json();
    const doc = {
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    delete doc._id;
    const res = await db.collection("inventory_receipts").insertOne(doc);
    return c.json({ success: true, data: { ...doc, _id: res.insertedId } });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// PUT /api/inventory/receipts/:id
router.put("/receipts/:id", async (c) => {
  try {
    const db = getDb();
    const id = c.req.param("id");
    const body = await c.req.json();
    const query = id.length === 24 ? { _id: new ObjectId(id) } : { id: id };
    const doc = { ...body, updatedAt: new Date().toISOString() };
    delete doc._id;
    await db.collection("inventory_receipts").updateOne(query, { $set: doc });
    return c.json({ success: true, data: doc });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// DELETE /api/inventory/receipts/:id
router.delete("/receipts/:id", async (c) => {
  try {
    const db = getDb();
    const id = c.req.param("id");
    const query = id.length === 24 ? { _id: new ObjectId(id) } : { id: id };
    await db.collection("inventory_receipts").deleteOne(query);
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// GET /api/inventory/issues
router.get("/issues", async (c) => {
  try {
    const db = getDb();
    const list = await db.collection("inventory_issues").find().toArray();
    return c.json({ success: true, data: list });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// POST /api/inventory/issues
router.post("/issues", async (c) => {
  try {
    const db = getDb();
    const body = await c.req.json();
    const doc = {
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    delete doc._id;
    const res = await db.collection("inventory_issues").insertOne(doc);
    return c.json({ success: true, data: { ...doc, _id: res.insertedId } });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// PUT /api/inventory/issues/:id
router.put("/issues/:id", async (c) => {
  try {
    const db = getDb();
    const id = c.req.param("id");
    const body = await c.req.json();
    const query = id.length === 24 ? { _id: new ObjectId(id) } : { id: id };
    const doc = { ...body, updatedAt: new Date().toISOString() };
    delete doc._id;
    await db.collection("inventory_issues").updateOne(query, { $set: doc });
    return c.json({ success: true, data: doc });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// DELETE /api/inventory/issues/:id
router.delete("/issues/:id", async (c) => {
  try {
    const db = getDb();
    const id = c.req.param("id");
    const query = id.length === 24 ? { _id: new ObjectId(id) } : { id: id };
    await db.collection("inventory_issues").deleteOne(query);
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// GET /api/inventory/alerts
router.get("/alerts", async (c) => {
  try {
    const db = getDb();
    const list = await db.collection("inventory_alerts").find().toArray();
    return c.json({ success: true, data: list });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// POST /api/inventory/alerts
router.post("/alerts", async (c) => {
  try {
    const db = getDb();
    const body = await c.req.json();
    const doc = {
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    delete doc._id;
    const res = await db.collection("inventory_alerts").insertOne(doc);
    return c.json({ success: true, data: { ...doc, _id: res.insertedId } });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// PUT /api/inventory/alerts/:id
router.put("/alerts/:id", async (c) => {
  try {
    const db = getDb();
    const id = c.req.param("id");
    const body = await c.req.json();
    const query = id.length === 24 ? { _id: new ObjectId(id) } : { id: id };
    const doc = { ...body, updatedAt: new Date().toISOString() };
    delete doc._id;
    await db.collection("inventory_alerts").updateOne(query, { $set: doc });
    return c.json({ success: true, data: doc });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// DELETE /api/inventory/alerts/:id
router.delete("/alerts/:id", async (c) => {
  try {
    const db = getDb();
    const id = c.req.param("id");
    const query = id.length === 24 ? { _id: new ObjectId(id) } : { id: id };
    await db.collection("inventory_alerts").deleteOne(query);
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ─── CUSTOM CONFIGURATIONS CRUD & SEEDING ─────────────────────────────────────
const SEED_DATA: Record<string, any[]> = {
  groups: [
    { id: 1, code: "01", title: "اموال منقول", depreciable: true,  usefulLife: 10, depRate: 10, inactive: false },
    { id: 2, code: "02", title: "اموال غیرمنقول", depreciable: true,  usefulLife: 40, depRate: 2.5, inactive: false },
    { id: 3, code: "03", title: "تجهیزات اداری", depreciable: true,  usefulLife: 5,  depRate: 20, inactive: false },
    { id: 4, code: "04", title: "وسایط نقلیه",   depreciable: true,  usefulLife: 8,  depRate: 12.5, inactive: false },
    { id: 5, code: "05", title: "اموال مصرفی",   depreciable: false, usefulLife: "", depRate: "",  inactive: false },
  ],
  subgroups: [
    { id: 1, code: "01-01", title: "رایانه و لپ‌تاپ", groupCode: "01", description: "شامل رایانه‌های رومیزی و لپ‌تاپ‌ها", inactive: false },
    { id: 2, code: "01-02", title: "تجهیزات شبکه", groupCode: "01", description: "سوئیچ، روتر و ملزومات غیرفعال", inactive: false },
    { id: 3, code: "03-01", title: "میز و صندلی اداری", groupCode: "03", description: "انواع مبلمان اداری و کنفرانس", inactive: false },
  ],
  types: [
    { id: 1, code: "T-01", title: "غیرمصرفی (دارایی ثابت)", nature: "non-consumable", description: "دارای طول عمر مفید بیش از یک سال", inactive: false },
    { id: 2, code: "T-02", title: "مصرفی", nature: "consumable", description: "اقلام مصرفی اداری", inactive: false },
    { id: 3, code: "T-03", title: "در حکم مصرفی", nature: "consumable-2", description: "دارای عمر مفید کوتاه یا ارزش ناچیز", inactive: false },
  ],
  natures: [
    { id: 1, code: "N-01", title: "اموال منقول", movable: true, description: "اموال قابل حمل", inactive: false },
    { id: 2, code: "N-02", title: "اموال غیرمنقول", movable: false, description: "زمین و ساختمان", inactive: false },
  ],
  units: [
    { id: 1, code: "U-01", title: "دستگاه", abbreviation: "دستگاه", inactive: false },
    { id: 2, code: "U-02", title: "عدد", abbreviation: "عدد", inactive: false },
    { id: 3, code: "U-03", title: "متر", abbreviation: "متر", inactive: false },
    { id: 4, code: "U-04", title: "جلد", abbreviation: "جلد", inactive: false },
  ],
  locations: [
    { id: 1, code: "L-01", name: "ساختمان مرکزی - طبقه اول - اتاق ۱۰۱", building: "ساختمان مرکزی", floor: "اول", room: "۱۰۱", inactive: false },
    { id: 2, code: "L-02", name: "ساختمان مرکزی - طبقه دوم - سالن کنفرانس", building: "ساختمان مرکزی", floor: "دوم", room: "سالن کنفرانس", inactive: false },
  ],
  suppliers: [
    { id: 1, code: "S-01", name: "شرکت رایان سیستم", tel: "021-88888888", manager: "احمدی", active: true },
    { id: 2, code: "S-02", name: "صنایع چوب نیلپر", tel: "021-77777777", manager: "رضایی", active: true },
  ],
  items: [
    { id: 1, code: "IT-001", name: "کاغذ A4 کپی‌مکس", category: "ملزومات اداری", unit: "عدد", minStock: 10, currentStock: 50, price: 1500000 },
    { id: 2, code: "IT-002", name: "پوشه مقوایی", category: "ملزومات اداری", unit: "عدد", minStock: 100, currentStock: 450, price: 50000 },
    { id: 3, code: "IT-003", name: "خودکار کیان آبی", category: "ملزومات اداری", unit: "عدد", minStock: 50, currentStock: 200, price: 30000 },
  ],
  requests: [
    { id: 1, requestCode: "REQ-001", requesterName: "علی احمدی", department: "امور مالی", itemCode: "IT-001", quantity: 5, date: "1403/04/10", status: "pending" },
    { id: 2, requestCode: "REQ-002", requesterName: "زهرا حسینی", department: "کارگزینی", itemCode: "IT-003", quantity: 10, date: "1403/04/12", status: "approved" },
  ],
  transfers: [
    { id: 1, transferCode: "TR-001", itemCode: "IT-001", fromStoreCode: "WH-001", toStoreCode: "WH-002", quantity: 20, date: "1403/04/15", status: "confirmed" },
  ],
  warehouses: [
    { id: 1, code: "WH-001", name: "انبار مرکزی", location: "ساختمان مرکزی", manager: "حمید رضایی" },
    { id: 2, code: "WH-002", name: "انبار ملزومات", location: "طبقه همکف", manager: "مریم علوی" }
  ],
  employees: []
};

const collections = [
  "groups",
  "subgroups",
  "types",
  "natures",
  "units",
  "locations",
  "suppliers",
  "items",
  "requests",
  "transfers",
  "warehouses",
  "employees",
  "employee_contracts",
  "employee_decrees",
  "attendance_records",
  "employee_leaves",
  "employee_missions",
  "payroll_calculations",
  "payroll_settings",
  "tax_tables",
  "audits"
];

collections.forEach((name) => {
  const collName = `inventory_${name}`;

  // GET /api/inventory/:name
  router.get(`/${name}`, async (c) => {
    try {
      const db = getDb();
      const count = await db.collection(collName).countDocuments();
      if (count === 0 && SEED_DATA[name]) {
        await db.collection(collName).insertMany(SEED_DATA[name]);
      }
      const list = await db.collection(collName).find().toArray();
      return c.json({ success: true, data: list });
    } catch (error: any) {
      return c.json({ success: false, message: error.message }, 500);
    }
  });

  // POST /api/inventory/:name
  router.post(`/${name}`, async (c) => {
    try {
      const db = getDb();
      const body = await c.req.json();
      const doc = {
        ...body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      delete doc._id;
      const res = await db.collection(collName).insertOne(doc);
      return c.json({ success: true, data: { ...doc, _id: res.insertedId, id: doc.id || res.insertedId.toString() } });
    } catch (error: any) {
      return c.json({ success: false, message: error.message }, 500);
    }
  });

  // PUT /api/inventory/:name/:id
  router.put(`/${name}/:id`, async (c) => {
    try {
      const db = getDb();
      const id = c.req.param("id");
      const body = await c.req.json();
      let query: any = { id: id };
      if (id.length === 24) {
        try {
          query = { _id: new ObjectId(id) };
        } catch (e) {
          // ignore
        }
      } else if (!isNaN(Number(id))) {
        query = { $or: [{ id: Number(id) }, { id: id }] };
      }
      const doc = { ...body, updatedAt: new Date().toISOString() };
      delete doc._id;
      await db.collection(collName).updateOne(query, { $set: doc });
      return c.json({ success: true, data: doc });
    } catch (error: any) {
      return c.json({ success: false, message: error.message }, 500);
    }
  });

  // DELETE /api/inventory/:name/:id
  router.delete(`/${name}/:id`, async (c) => {
    try {
      const db = getDb();
      const id = c.req.param("id");
      let query: any = { id: id };
      if (id.length === 24) {
        try {
          query = { _id: new ObjectId(id) };
        } catch (e) {
          // ignore
        }
      } else if (!isNaN(Number(id))) {
        query = { $or: [{ id: Number(id) }, { id: id }] };
      }
      await db.collection(collName).deleteOne(query);
      return c.json({ success: true });
    } catch (error: any) {
      return c.json({ success: false, message: error.message }, 500);
    }
  });
});

export default router;
