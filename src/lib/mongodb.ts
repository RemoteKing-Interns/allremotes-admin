import { MongoClient, type Db } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI ?? "";

if (!MONGODB_URI) {
  console.warn("[mongodb] MONGODB_URI is not set – API routes will use JSON fallbacks.");
}

let cached: { client: MongoClient; db: Db } | null = null;

export async function getDb(): Promise<Db> {
  if (cached) return cached.db;
  if (!MONGODB_URI) {
    console.error("[mongodb] MONGODB_URI is not configured in environment variables");
    throw new Error("MONGODB_URI is not configured");
  }

  try {
    console.log("[mongodb] Attempting to connect to MongoDB...");
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db(); // uses the db name from the connection string
    cached = { client, db };
    console.log("[mongodb] Successfully connected to MongoDB");
    return db;
  } catch (error) {
    console.error("[mongodb] Failed to connect to MongoDB:", error);
    console.error("[mongodb] Connection string (first 10 chars):", MONGODB_URI.substring(0, 10) + "...");
    throw new Error(`MongoDB connection failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function hasMongoUri() {
  return Boolean(MONGODB_URI);
}
