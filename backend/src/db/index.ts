import { MongoClient, Db } from "mongodb";

const MONGO_URI = process.env.MONGO_URI ?? "mongodb://localhost:27017";
const DB_NAME = process.env.DB_NAME ?? "public_finance";

let _db: Db | null = null;

export async function connectDb(): Promise<Db> {
  if (_db) return _db;
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  _db = client.db(DB_NAME);
  console.log(`✓ Connected to MongoDB: ${DB_NAME}`);
  return _db;
}

export function getDb(): Db {
  if (!_db) throw new Error("DB not initialised — call connectDb() first");
  return _db;
}
