import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { serverEnv } from "@/config/env";
import * as schema from "./schema";

/**
 * Pool único por proceso. En desarrollo se reutiliza entre recargas en caliente
 * para no agotar las conexiones de PostgreSQL.
 */
const globalForDb = globalThis as unknown as { pgPool?: Pool };

const pool =
  globalForDb.pgPool ??
  new Pool({
    connectionString: serverEnv().DATABASE_URL,
    max: serverEnv().DATABASE_POOL_MAX,
    ssl: serverEnv().DATABASE_SSL ? { rejectUnauthorized: false } : undefined,
  });

if (process.env.NODE_ENV !== "production") globalForDb.pgPool = pool;

export const db = drizzle(pool, { schema, casing: "snake_case" });
export type Db = typeof db;
