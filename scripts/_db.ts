import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/db/schema";

/** Conexión para scripts de línea de comandos (migración y datos iniciales). */
export function connect() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Falta DATABASE_URL. Copia .env.example a .env y complétalo.");
  const ssl = process.env.DATABASE_SSL === "true" || process.env.DATABASE_SSL === "1";
  const pool = new Pool({ connectionString: url, max: 2, ssl: ssl ? { rejectUnauthorized: false } : undefined });
  const db = drizzle(pool, { schema, casing: "snake_case" });
  return { db, pool };
}
