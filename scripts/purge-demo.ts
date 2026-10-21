/**
 * Borra el catálogo de demostración (productos y marcas con isDemo = true) y las zonas de envío de ejemplo.
 * Se ejecuta antes del lanzamiento. Exige confirmación explícita.
 */
import { and, eq, inArray, like, sql } from "drizzle-orm";
import { connect, explainDbError } from "./_db";
import * as s from "../src/db/schema";

async function main() {
  if (process.argv[2] !== "--confirmar") {
    console.log("Esto borra todos los productos, marcas y zonas de demostración.\nEjecuta: npm run db:purge-demo -- --confirmar");
    return;
  }
  const { db, pool } = connect();
  await db.transaction(async (tx) => {
    const demo = await tx.select({ id: s.products.id }).from(s.products).where(eq(s.products.isDemo, true));
    const ids = demo.map((p) => p.id);
    if (ids.length) {
      const variants = await tx.select({ id: s.productVariants.id }).from(s.productVariants).where(inArray(s.productVariants.productId, ids));
      const vIds = variants.map((v) => v.id);
      if (vIds.length) await tx.delete(s.inventoryMovements).where(inArray(s.inventoryMovements.variantId, vIds));
      await tx.delete(s.products).where(inArray(s.products.id, ids));
    }
    await tx.delete(s.brands).where(and(eq(s.brands.isDemo, true), sql`not exists (select 1 from products p where p.brand_id = ${s.brands.id})`));
    await tx.delete(s.shippingZones).where(like(s.shippingZones.name, "%(ejemplo)"));
    console.log(`Productos de demostración eliminados: ${ids.length}.`);
  });
  await pool.end();
}

main().catch((err) => {
  console.error(`Error al borrar la demostración:
${explainDbError(err)}`);
  process.exit(1);
});
