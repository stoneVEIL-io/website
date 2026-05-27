import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is missing.");
}

let connectionString = process.env.DATABASE_URL;

if (connectionString.startsWith("https://")) {
  // If a REST API endpoint is provided, configure the fetchEndpoint
  neonConfig.fetchEndpoint = connectionString;
  
  // Parse the host to construct a valid connection string that neon() requires
  try {
    const url = new URL(connectionString);
    const dbName = url.pathname.split("/").filter(Boolean)[0] || "neondb";
    connectionString = `postgresql://db_user:db_pass@${url.hostname}/${dbName}`;
  } catch (e) {
    // Fallback placeholder connection string
    connectionString = "postgresql://db_user:db_pass@localhost/neondb";
  }
}

const sql = neon(connectionString);
export const db = drizzle(sql, { schema });
