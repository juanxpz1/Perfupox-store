/**
 * Importa el catálogo real de la tienda desde data/catalogo-tienda-2026-10.json
 * (extraído de los catálogos PDF entregados por Perfupox).
 *
 * - Originales: frasco completo (tamaño por confirmar) + decants de 5 ml y 10 ml.
 * - Preparada: una ficha por perfume de referencia, con los tamaños y precios del catálogo de tamaños.
 *   Su foto principal es la del perfume de referencia; la tienda muestra el frasco Perfupox al elegir tamaño.
 * - La disponibilidad se maneja a mano desde el panel (trackInventory = false): todo entra disponible.
 *
 * Es idempotente: si el producto ya existe (mismo slug) actualiza precios y datos básicos,
 * sin tocar la disponibilidad ni lo que el administrador haya editado después.
 */
import { readFileSync } from "node:fs";
import { and, eq } from "drizzle-orm";
import { connect, explainDbError } from "./_db";
import * as s from "../src/db/schema";
import { slugify } from "../src/lib/slug";
import { buildSearchText } from "../src/modules/catalog/search-text";

type Original = { name: string; brand: string; gender: "HOMBRE" | "MUJER" | "UNISEX"; price: number; decant5: number; decant10: number; image: string; slug: string };
type Preparada = { inspiredBy: string; house: string; gender: "HOMBRE" | "MUJER" | "UNISEX"; slug: string; image: string };
type Catalog = { originals: Original[]; preparadas: Preparada[]; preparadaSizes: { ml: number; price: number }[] };

/** Casas árabes del catálogo. El resto de originales se clasifica como diseñador. */
const ARAB_HOUSES = new Set([
  "Rasasi", "Lattafa", "Armaf", "Afnan", "Maison Alhambra", "Al Haramain", "Bharara",
  "Dumont", "French Avenue", "Rayhaan", "Emper", "Rave",
]);
const PREPARADA_BRAND = "Perfupox Preparada";

async function main() {
  const file = process.argv[2] ?? "data/catalogo-tienda-2026-10.json";
  const data = JSON.parse(readFileSync(file, "utf8")) as Catalog;
  const { db, pool } = connect();
  const stats = { created: 0, updated: 0 };

  await db.transaction(async (tx) => {
    const cats = await tx.select({ id: s.categories.id, slug: s.categories.slug }).from(s.categories);
    const catId = (slug: string) => cats.find((c) => c.slug === slug)?.id;
    const brandCache = new Map<string, string>();

    async function brandId(name: string) {
      if (brandCache.has(name)) return brandCache.get(name)!;
      const slug = slugify(name);
      const [row] = await tx
        .insert(s.brands)
        .values({ name, slug, isDemo: false })
        .onConflictDoUpdate({ target: s.brands.slug, set: { name } })
        .returning({ id: s.brands.id });
      brandCache.set(name, row.id);
      return row.id;
    }

    type VariantSeed = { sku: string; kind: "FRASCO" | "DECANT" | "PREPARADO"; sizeMl: number | null; label: string; price: number; sortOrder: number };

    async function upsertProduct(
      p: Omit<typeof s.products.$inferInsert, "brandId" | "searchText"> & { brandName: string },
      variants: VariantSeed[],
      category: string,
      image?: { url: string; alt: string },
    ) {
      const bId = await brandId(p.brandName);
      const searchText = buildSearchText({ name: p.name, brandName: p.brandName, line: p.line, gender: p.gender, inspiredBy: p.inspiredBy, inspiredByHouse: p.inspiredByHouse });
      const [existing] = await tx.select({ id: s.products.id }).from(s.products).where(eq(s.products.slug, p.slug));
      let productId: string;
      if (existing) {
        productId = existing.id;
        await tx.update(s.products).set({ name: p.name, brandId: bId, gender: p.gender, inspiredBy: p.inspiredBy, inspiredByHouse: p.inspiredByHouse, searchText }).where(eq(s.products.id, productId));
        stats.updated++;
      } else {
        const { brandName: _b, ...rest } = p; // eslint-disable-line @typescript-eslint/no-unused-vars
        const [row] = await tx.insert(s.products).values({ ...rest, brandId: bId, searchText, isActive: true, publishedAt: new Date() }).returning({ id: s.products.id });
        productId = row.id;
        const c = catId(category);
        if (c) await tx.insert(s.productCategories).values({ productId, categoryId: c }).onConflictDoNothing();
        stats.created++;
      }
      // La foto principal se sincroniza siempre con el catálogo: se crea si falta y se actualiza si cambió.
      if (image) {
        const [img] = await tx.select({ id: s.productImages.id, url: s.productImages.url }).from(s.productImages).where(and(eq(s.productImages.productId, productId), eq(s.productImages.sortOrder, 0)));
        if (!img) await tx.insert(s.productImages).values({ productId, url: image.url, alt: image.alt, sortOrder: 0 });
        else if (img.url !== image.url) await tx.update(s.productImages).set({ url: image.url, alt: image.alt }).where(eq(s.productImages.id, img.id));
      }
      for (const v of variants) {
        const [ev] = await tx.select({ id: s.productVariants.id }).from(s.productVariants).where(and(eq(s.productVariants.sku, v.sku)));
        if (ev) await tx.update(s.productVariants).set({ price: v.price, label: v.label }).where(eq(s.productVariants.id, ev.id));
        else await tx.insert(s.productVariants).values({ ...v, productId, trackInventory: false, stock: 0, isActive: true });
      }
    }

    for (const o of data.originals) {
      const line = ARAB_HOUSES.has(o.brand) ? "ARABE" : "DISENADOR";
      const base = `PFX-${o.slug.toUpperCase()}`.slice(0, 34);
      await upsertProduct(
        { slug: o.slug, name: o.name, brandName: o.brand, line, gender: o.gender, concentration: null },
        [
          { sku: `${base}-F`, kind: "FRASCO", sizeMl: null, label: "Frasco original", price: o.price, sortOrder: 0 },
          { sku: `${base}-D10`, kind: "DECANT", sizeMl: 10, label: "Decant 10 ml", price: o.decant10, sortOrder: 1 },
          { sku: `${base}-D5`, kind: "DECANT", sizeMl: 5, label: "Decant 5 ml", price: o.decant5, sortOrder: 2 },
        ],
        line === "ARABE" ? "arabes" : "disenador",
        { url: o.image, alt: `${o.name} de ${o.brand}, frasco original` },
      );
    }

    for (const p of data.preparadas) {
      const base = `PREP-${p.slug.replace(/^preparada-/, "").toUpperCase()}`.slice(0, 34);
      await upsertProduct(
        {
          slug: p.slug,
          name: `Inspirado en ${p.inspiredBy}`,
          brandName: PREPARADA_BRAND,
          line: "PREPARADA",
          gender: p.gender,
          concentration: null,
          inspiredBy: p.inspiredBy,
          inspiredByHouse: p.house,
        },
        data.preparadaSizes.map((z, i) => ({ sku: `${base}-${z.ml}`, kind: "PREPARADO" as const, sizeMl: z.ml, label: `${z.ml} ml`, price: z.price, sortOrder: i })),
        "perfumeria-preparada",
        { url: p.image, alt: `Foto de referencia: ${p.inspiredBy} de ${p.house}. El producto que recibes es la perfumería preparada Perfupox.` },
      );
    }
  });

  console.log(`Catálogo importado: ${stats.created} productos nuevos, ${stats.updated} actualizados.`);
  await pool.end();
}

main().catch((err) => {
  console.error(`Error al importar el catálogo:
${explainDbError(err)}`);
  process.exit(1);
});
