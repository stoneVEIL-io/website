import "dotenv/config";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is missing.");
}

const sql = neon(process.env.DATABASE_URL);

async function run() {
  try {
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `;
    console.log("Tables:");
    console.log(tables);

    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'leads';
    `;
    console.log("\nColumns of 'leads' table:");
    console.log(columns);
  } catch (error) {
    console.error("Error executing query:", error);
  }
}

run();
