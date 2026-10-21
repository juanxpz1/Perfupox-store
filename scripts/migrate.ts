import { migrate } from "drizzle-orm/node-postgres/migrator";
import { connect, explainDbError } from "./_db";

/** Aplica las migraciones pendientes de la carpeta drizzle/. Se ejecuta en cada despliegue antes de iniciar la app. */
async function main() {
  const { db, pool } = connect();
  const started = Date.now();
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log(`Migraciones aplicadas en ${Date.now() - started} ms.`);
  await pool.end();
}

main().catch((err) => {
  console.error(`Error al aplicar migraciones:
${explainDbError(err)}`);
  process.exit(1);
});
