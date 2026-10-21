import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/db/schema";

/** Conexión para scripts de línea de comandos (migración y datos iniciales). */
export function connect() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw new Error("Falta DATABASE_URL. Copia .env.example a .env y escribe la conexión a tu PostgreSQL.");
  const ssl = process.env.DATABASE_SSL === "true" || process.env.DATABASE_SSL === "1";
  const pool = new Pool({ connectionString: url, max: 2, ssl: ssl ? { rejectUnauthorized: false } : undefined, connectionTimeoutMillis: 10_000 });
  const db = drizzle(pool, { schema, casing: "snake_case" });
  return { db, pool };
}

/** Muestra dónde apunta DATABASE_URL sin revelar la contraseña. */
function parts() {
  try {
    const u = new URL(process.env.DATABASE_URL ?? "");
    return { user: decodeURIComponent(u.username) || "tu_usuario", db: u.pathname.replace(/^\//, "") || "perfupox" };
  } catch {
    return { user: "tu_usuario", db: "perfupox" };
  }
}

function target(): string {
  try {
    const u = new URL(process.env.DATABASE_URL ?? "");
    return `${u.username || "(sin usuario)"}@${u.hostname}:${u.port || "5432"}${u.pathname}`;
  } catch {
    return "(DATABASE_URL no es una URL válida)";
  }
}

/**
 * Traduce los errores de PostgreSQL más comunes a una explicación con la solución.
 * Drizzle envuelve el error original en `cause`, que es donde está el motivo real.
 */
export function explainDbError(err: unknown): string {
  const e = err as { message?: string; code?: string; cause?: { code?: string; message?: string } };
  const code = e?.cause?.code ?? e?.code;
  const raw = e?.cause?.message ?? e?.message ?? String(err);
  const where = target();
  const { user, db } = parts();
  const hints: Record<string, string> = {
    ECONNREFUSED: `No hay un PostgreSQL escuchando en ${where}. Verifica que el servicio esté encendido y que el puerto sea el correcto.`,
    ENOTFOUND: `No se encuentra el servidor de ${where}. Revisa el nombre del host en DATABASE_URL.`,
    ETIMEDOUT: `La conexión a ${where} tardó demasiado. Si es una base en Railway, usa la URL pública (DATABASE_PUBLIC_URL) y DATABASE_SSL=true.`,
    "28P01": `Usuario o contraseña incorrectos para ${where}. Revisa DATABASE_URL.`,
    "28000": `El usuario no tiene permiso para conectarse a ${where}.`,
    "3D000": `La base de datos "${db}" no existe. Como administrador de PostgreSQL ejecuta:\n  CREATE DATABASE "${db}" OWNER "${user}";`,
    "42501": `El usuario "${user}" no tiene permiso para crear tablas en "${db}". Como administrador de PostgreSQL (usuario postgres) ejecuta:\n  ALTER DATABASE "${db}" OWNER TO "${user}";\n  \\c "${db}"\n  ALTER SCHEMA public OWNER TO "${user}";`,
    "0A000": `Falta una extensión. Conéctate como administrador y ejecuta: CREATE EXTENSION IF NOT EXISTS pg_trgm;`,
  };
  const ssl = /ssl|SSL|self.signed|certificate/.test(raw)
    ? "Problema de SSL. En local usa DATABASE_SSL=false; con la URL pública de Railway usa DATABASE_SSL=true."
    : null;
  const hint = (code && hints[code]) ?? ssl ?? `Conexión: ${where}.`;
  return `${raw}${code ? ` [${code}]` : ""}\n→ ${hint}`;
}
