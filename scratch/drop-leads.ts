import "dotenv/config";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is missing.");
}

const sql = neon(process.env.DATABASE_URL);

async function run() {
  try {
    console.log("Dropping leads table...");
    await sql`DROP TABLE IF EXISTS leads CASCADE;`;
    console.log("Leads table dropped successfully.");
  } catch (error) {
    console.error("Error dropping table:", error);
  }
}

run();
