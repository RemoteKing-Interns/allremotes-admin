import { MongoClient, type Db } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI ?? "";

if (!MONGODB_URI) {
  console.warn("[mongodb] MONGODB_URI is not set – API routes will use JSON fallbacks.");
}

let cached: { client: MongoClient; db: Db } | null = null;

export async function getDb(): Promise<Db> {
  if (cached) return cached.db;
  if (!MONGODB_URI) throw new Error("MONGODB_URI is not configured");

  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db(); // uses the db name from the connection string
  cached = { client, db };
  return db;
}

export function hasMongoUri() {
  return Boolean(MONGODB_URI);
}
