import { MongoClient, Db } from "mongodb";

const MONGO_URI = process.env.MONGO_URI ?? "mongodb://localhost:27017";
const DB_NAME = process.env.DB_NAME ?? "public_finance";

let _db: Db | null = null;

export async function connectDb(): Promise<Db> {
  if (_db) return _db;
  const client = new MongoClient(MONGO_URI, {
    maxPoolSize: 10,          // connection pool
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });
  await client.connect();
  _db = client.db(DB_NAME);
  console.log(`✓ Connected to MongoDB: ${DB_NAME}`);
  await ensureIndexes(_db);
  return _db;
}

export function getDb(): Db {
  if (!_db) throw new Error("DB not initialised — call connectDb() first");
  return _db;
}

/**
 * ایجاد Index های ضروری برای بهینه‌سازی query ها
 * این تابع idempotent است — اگر index وجود داشته باشد، دوباره ساخته نمی‌شود
 */
async function ensureIndexes(db: Db): Promise<void> {
  try {
    const jd = db.collection("journal_documents");
    await Promise.all([
      // فیلتر بر اساس status (رایج‌ترین filter)
      jd.createIndex({ status: 1 }, { background: true }),
      // فیلتر بر اساس سال مالی
      jd.createIndex({ fiscal_year: 1 }, { background: true }),
      // ترکیب status + fiscal_year (trial-balance, grouped-lines)
      jd.createIndex({ status: 1, fiscal_year: 1 }, { background: true }),
      // Index روی کد حساب داخل lines برای aggregation
      jd.createIndex({ "lines.account_code": 1 }, { background: true, sparse: true }),

      // persons collection
      db.collection("persons").createIndex({ nomineeCode: 1 }, { background: true, unique: true, sparse: true }),
      db.collection("persons").createIndex({ inactive: 1 }, { background: true }),

      // credit_definitions
      db.collection("credit_definitions").createIndex({ createdAt: -1 }, { background: true }),

      // fiscal_years
      db.collection("fiscal_years").createIndex({ year: 1 }, { background: true, unique: true }),
    ]);
    console.log("✓ MongoDB indexes ensured");
  } catch (err) {
    // اگر index قبلاً وجود داشت یا مشکلی بود، اجرا ادامه می‌یابد
    console.warn("Index creation warning:", err);
  }
}

