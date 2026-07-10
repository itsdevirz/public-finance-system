import { Hono } from "hono";
import { getDb } from "../db/index.js";
import { ObjectId } from "mongodb";

const router = new Hono();

// Helper to seed warehouses if empty
async function ensureWarehouses() {
  const db = getDb();
  const count = await db.collection("inventory_warehouses").countDocuments();
  if (count === 0) {
    await db.collection("inventory_warehouses").insertMany([
      { id: "WH-001", name: "انبار مرکزی", code: "WH-001", location: "ساختمان مرکزی" },
      { id: "WH-002", name: "انبار ملزومات", code: "WH-002", location: "طبقه همکف" }
    ]);
  }
}

// GET /api/inventory/warehouses
router.get("/warehouses", async (c) => {
  try {
    await ensureWarehouses();
    const db = getDb();
    const list = await db.collection("inventory_warehouses").find().toArray();
    return c.json({ success: true, data: list });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

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

export default router;
