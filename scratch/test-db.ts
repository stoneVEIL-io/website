import dotenv from "dotenv";

// Load .env from workspace root
dotenv.config();

async function testConnection() {
  console.log("Testing connection with DATABASE_URL:", process.env.DATABASE_URL);
  
  try {
    // Dynamically import db modules to ensure dotenv has initialized first
    const { db } = await import("../lib/db");
    const { leads } = await import("../lib/schema");

    console.log("Querying database using Drizzle client...");
    const result = await db.select().from(leads).limit(1);
    console.log("Query completed successfully. Result:", result);
  } catch (error: any) {
    console.error("Database query failed:");
    console.error(error);
  }
}

testConnection();
