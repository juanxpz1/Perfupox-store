/**
 * Crea la base de datos de DATABASE_URL si no existe.
 * Se conecta a la base administrativa "postgres" del mismo servidor con el mismo usuario.
 */
import { Client } from "pg";
import { explainDbError } from "./_db";

async function main() {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) throw new Error("Falta DATABASE_URL en .env");
  const url = new URL(raw);
  const name = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (!/^[A-Za-z0-9_]+$/.test(name)) throw new Error(`Nombre de base de datos no válido: "${name}". Usa letras, números y guion bajo.`);
  const admin = new URL(raw);
  admin.pathname = "/postgres";
  const ssl = process.env.DATABASE_SSL === "true" || process.env.DATABASE_SSL === "1";
  const client = new Client({ connectionString: admin.toString(), ssl: ssl ? { rejectUnauthorized: false } : undefined, connectionTimeoutMillis: 10_000 });
  await client.connect();
  try {
    const { rowCount } = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [name]);
    if (rowCount) {
      console.log(`La base de datos "${name}" ya existe.`);
      return;
    }
    await client.query(`CREATE DATABASE "${name}"`);
    console.log(`Base de datos "${name}" creada. Ahora ejecuta: npm run db:migrate`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(`Error al crear la base de datos:\n${explainDbError(err)}`);
  process.exit(1);
});
