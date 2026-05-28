import "dotenv/config";
import { db } from "../lib/db";
import { sql } from "drizzle-orm";

async function run() {
  console.log("Checking database connection...");
  try {
    const result = await db.execute(sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`);
    console.log("Database connection successful!");
    console.log("Existing public tables:", result);
  } catch (error) {
    console.error("Database connection failed:", error);
  }
}

run();
