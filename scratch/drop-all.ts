import "dotenv/config";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is missing.");
}

const sql = neon(process.env.DATABASE_URL);

async function run() {
  try {
    console.log("Dropping tables...");
    await sql`DROP TABLE IF EXISTS playing_with_neon CASCADE;`;
    await sql`DROP TABLE IF EXISTS leads CASCADE;`;
    await sql`DROP TABLE IF EXISTS __drizzle_migrations CASCADE;`;
    console.log("Tables dropped successfully.");
  } catch (error) {
    console.error("Error dropping tables:", error);
  }
}

run();
