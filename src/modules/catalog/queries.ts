import "server-only";
import { connection } from "next/server";
import { and, asc, eq, inArray, sql, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import * as s from "@/db/schema";
import { normalizeSearch } from "@/lib/slug";
import type { CatalogQuery } from "@/lib/validation/catalog";
import type { Gender, ProductCard, ProductDetail, ProductLine, VariantKind } from "./types";

export const PAGE_SIZE = 24;

const LINE_FROM_SLUG = { arabe: "ARABE", disenador: "DISENADOR", nicho: "NICHO", preparada: "PREPARADA" } as const;
const GENDER_FROM_SLUG = { hombre: "HOMBRE", mujer: "MUJER", unisex: "UNISEX" } as const;

/**
 * Resumen de presentaciones disponibles por producto. Una presentación está disponible si está activa y,
 * cuando lleva conteo de inventario, le quedan unidades.
 */
const variantAgg = sql`(
  SELECT
    v.product_id,
    MIN(v.price) FILTER (WHERE v.is_active AND (NOT v.track_inventory OR v.stock > 0)) AS price_from,
    MIN(v.price) FILTER (WHERE v.kind = 'FRASCO' AND v.is_active AND (NOT v.track_inventory OR v.stock > 0)) AS bottle_price,
    MIN(v.compare_at_price) FILTER (WHERE v.kind = 'FRASCO' AND v.is_active) AS compare_at_price,
    BOOL_OR(v.kind = 'DECANT' AND v.is_active AND (NOT v.track_inventory OR v.stock > 0)) AS has_decants
  FROM product_variants v
  GROUP BY v.product_id
)`;

const firstImage = sql`(
  SELECT DISTINCT ON (product_id) product_id, url, alt FROM product_images ORDER BY product_id, sort_order
)`;

type CardRow = {
  id: string;
  slug: string;
  name: string;
  brand_name: string;
  line: ProductLine;
  gender: Gender;
  inspired_by: string | null;
  inspired_by_house: string | null;
  image_url: string | null;
  image_alt: string | null;
  price_from: number | null;
  bottle_price: number | null;
  compare_at_price: number | null;
  has_decants: boolean | null;
  is_new: boolean;
  total?: number;
};

const toCard = (r: CardRow): ProductCard => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  brandName: r.brand_name,
  line: r.line,
  gender: r.gender,
  inspiredBy: r.inspired_by,
  inspiredByHouse: r.inspired_by_house,
  imageUrl: r.image_url,
  imageAlt: r.image_alt,
  priceFrom: r.price_from == null ? null : Number(r.price_from),
  bottlePrice: r.bottle_price == null ? null : Number(r.bottle_price),
  compareAtPrice: r.compare_at_price == null ? null : Number(r.compare_at_price),
  hasDecants: Boolean(r.has_decants),
  available: r.price_from != null,
  isNew: r.is_new,
});

const cardSelect = sql`
  SELECT p.id, p.slug, p.name, b.name AS brand_name, p.line, p.gender, p.inspired_by, p.inspired_by_house,
         i.url AS image_url, i.alt AS image_alt, va.price_from, va.bottle_price, va.compare_at_price, va.has_decants, p.is_new`;

const cardFrom = sql`
  FROM products p
  JOIN brands b ON b.id = p.brand_id
  LEFT JOIN ${variantAgg} va ON va.product_id = p.id
  LEFT JOIN ${firstImage} i ON i.product_id = p.id`;

/** Convierte los filtros de la URL en condiciones SQL. Siempre excluye productos no publicados. */
function whereFor(q: Partial<CatalogQuery>, opts: { ignoreBrand?: boolean } = {}): SQL {
  const parts: SQL[] = [sql`p.is_active`];
  if (q.linea) parts.push(sql`p.line = ${LINE_FROM_SLUG[q.linea]}`);
  if (q.genero) parts.push(sql`p.gender = ${GENDER_FROM_SLUG[q.genero]}`);
  if (q.marca?.length && !opts.ignoreBrand) parts.push(sql`b.slug IN (${sql.join(q.marca.map((m) => sql`${m}`), sql`, `)})`);
  if (q.formato === "decant") parts.push(sql`va.has_decants`);
  if (q.formato === "frasco") parts.push(sql`va.bottle_price IS NOT NULL`);
  // El precio de referencia de un original es el del frasco; el de la preparada, su tamaño más pequeño.
  if (q.min != null) parts.push(sql`COALESCE(va.bottle_price, va.price_from) >= ${q.min}`);
  if (q.max != null) parts.push(sql`COALESCE(va.bottle_price, va.price_from) <= ${q.max}`);
  if (q.q) {
    const tokens = normalizeSearch(q.q).split(/\s+/).filter((t) => t.length > 0).slice(0, 6);
    for (const t of tokens) parts.push(sql`p.search_text LIKE ${"%" + t.replace(/[%_\\]/g, "\\$&") + "%"}`);
  }
  return sql.join(parts, sql` AND `);
}

function orderFor(q: Partial<CatalogQuery>): SQL {
  switch (q.orden) {
    case "precio-asc":
      return sql`COALESCE(va.bottle_price, va.price_from) ASC NULLS LAST, p.name`;
    case "precio-desc":
      return sql`COALESCE(va.bottle_price, va.price_from) DESC NULLS LAST, p.name`;
    case "novedades":
      return sql`p.published_at DESC NULLS LAST, p.name`;
    case "nombre":
      return sql`p.name`;
    default: {
      const text = q.q ? normalizeSearch(q.q) : null;
      return sql`(va.price_from IS NULL), ${text ? sql`similarity(p.search_text, ${text}) DESC,` : sql``} p.is_featured DESC,
        CASE p.line WHEN 'ARABE' THEN 0 WHEN 'DISENADOR' THEN 1 WHEN 'NICHO' THEN 2 ELSE 3 END, p.name`;
    }
  }
}

export async function listProducts(q: CatalogQuery): Promise<{ items: ProductCard[]; total: number; pages: number }> {
  await connection();
  const offset = (q.pagina - 1) * PAGE_SIZE;
  const res = await db.execute<CardRow>(sql`
    ${cardSelect}, COUNT(*) OVER()::int AS total
    ${cardFrom}
    WHERE ${whereFor(q)}
    ORDER BY ${orderFor(q)}
    LIMIT ${PAGE_SIZE} OFFSET ${offset}`);
  const total = res.rows[0]?.total ?? (offset > 0 ? await countProducts(q) : 0);
  return { items: res.rows.map(toCard), total, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

async function countProducts(q: CatalogQuery): Promise<number> {
  const res = await db.execute<{ n: number }>(sql`SELECT COUNT(*)::int AS n ${cardFrom} WHERE ${whereFor(q)}`);
  return res.rows[0]?.n ?? 0;
}

/** Marcas con cantidad de productos según los demás filtros activos, y rango de precios. */
export async function catalogFacets(q: CatalogQuery) {
  await connection();
  const brands = await db.execute<{ slug: string; name: string; n: number }>(sql`
    SELECT b.slug, b.name, COUNT(*)::int AS n ${cardFrom}
    WHERE ${whereFor(q, { ignoreBrand: true })} AND p.line <> 'PREPARADA'
    GROUP BY b.slug, b.name ORDER BY b.name`);
  return { brands: brands.rows };
}

export async function getProductsBySlugs(slugs: string[]): Promise<ProductCard[]> {
  await connection();
  if (!slugs.length) return [];
  const res = await db.execute<CardRow>(sql`
    ${cardSelect} ${cardFrom}
    WHERE p.is_active AND p.slug IN (${sql.join(slugs.slice(0, 60).map((x) => sql`${x}`), sql`, `)})`);
  const bySlug = new Map(res.rows.map((r) => [r.slug, toCard(r)]));
  return slugs.map((x) => bySlug.get(x)).filter((x): x is ProductCard => Boolean(x));
}

/** Selección para la portada: destacados del administrador o, si no hay, una muestra fija por línea. */
export async function homeSelection(line: ProductLine, limit = 8): Promise<ProductCard[]> {
  await connection();
  const res = await db.execute<CardRow>(sql`
    ${cardSelect} ${cardFrom}
    WHERE p.is_active AND p.line = ${line} AND va.price_from IS NOT NULL
    ORDER BY p.is_featured DESC, p.is_new DESC, md5(p.slug)
    LIMIT ${limit}`);
  return res.rows.map(toCard);
}

export async function catalogCounts(): Promise<Record<ProductLine, number> & { decants: number }> {
  await connection();
  const res = await db.execute<{ line: ProductLine; n: number; d: number }>(sql`
    SELECT p.line, COUNT(*)::int AS n, COUNT(*) FILTER (WHERE va.has_decants)::int AS d
    ${cardFrom} WHERE p.is_active GROUP BY p.line`);
  const out = { ARABE: 0, DISENADOR: 0, NICHO: 0, PREPARADA: 0, decants: 0 };
  for (const r of res.rows) {
    out[r.line] = r.n;
    out.decants += r.d;
  }
  return out;
}

export async function getProduct(slug: string): Promise<ProductDetail | null> {
  await connection();
  const p = await db.query.products.findFirst({
    where: and(eq(s.products.slug, slug), eq(s.products.isActive, true)),
    with: {
      brand: true,
      family: true,
      images: { orderBy: asc(s.productImages.sortOrder) },
      variants: { orderBy: asc(s.productVariants.sortOrder) },
    },
  });
  if (!p) return null;
  const variants = p.variants.map((v) => {
    const available = v.isActive && (!v.trackInventory || v.stock > 0);
    return {
      id: v.id,
      sku: v.sku,
      kind: v.kind as VariantKind,
      sizeMl: v.sizeMl,
      label: v.label,
      price: v.price,
      compareAtPrice: v.compareAtPrice,
      available,
      lowStock: v.trackInventory && available && v.stock <= v.lowStockThreshold ? v.stock : null,
    };
  });
  const avail = variants.filter((v) => v.available);
  const bottle = avail.find((v) => v.kind === "FRASCO");
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    brandName: p.brand.name,
    brandSlug: p.brand.slug,
    line: p.line,
    gender: p.gender,
    inspiredBy: p.inspiredBy,
    inspiredByHouse: p.inspiredByHouse,
    imageUrl: p.images[0]?.url ?? null,
    imageAlt: p.images[0]?.alt ?? null,
    images: p.images.map((i) => ({ url: i.url, alt: i.alt })),
    priceFrom: avail.length ? Math.min(...avail.map((v) => v.price)) : null,
    bottlePrice: bottle?.price ?? null,
    compareAtPrice: bottle?.compareAtPrice ?? null,
    hasDecants: avail.some((v) => v.kind === "DECANT"),
    available: avail.length > 0,
    isNew: p.isNew,
    concentration: p.concentration,
    familyName: p.family?.name ?? null,
    shortDescription: p.shortDescription,
    description: p.description,
    topNotes: p.topNotes,
    heartNotes: p.heartNotes,
    baseNotes: p.baseNotes,
    countryOfOrigin: p.countryOfOrigin,
    variants,
  };
}

/** Relacionados: misma línea y público; prioriza la misma marca o la misma casa de referencia. */
export async function relatedProducts(p: ProductDetail, limit = 4): Promise<ProductCard[]> {
  await connection();
  const res = await db.execute<CardRow>(sql`
    ${cardSelect} ${cardFrom}
    WHERE p.is_active AND p.id <> ${p.id} AND p.line = ${p.line} AND va.price_from IS NOT NULL
    ORDER BY (b.name = ${p.brandName} OR p.inspired_by_house IS NOT DISTINCT FROM ${p.inspiredByHouse}) DESC,
             (p.gender = ${p.gender}) DESC, md5(p.slug || ${p.slug})
    LIMIT ${limit}`);
  return res.rows.map(toCard);
}

/** Sugerencias del buscador del encabezado. */
export async function suggest(term: string, limit = 6): Promise<ProductCard[]> {
  await connection();
  const q = normalizeSearch(term).slice(0, 60);
  if (q.length < 2) return [];
  const res = await db.execute<CardRow>(sql`
    ${cardSelect} ${cardFrom}
    WHERE ${whereFor({ q })}
    ORDER BY (va.price_from IS NULL), (p.line = 'PREPARADA'), similarity(p.search_text, ${q}) DESC, p.name
    LIMIT ${limit}`);
  return res.rows.map(toCard);
}

/** Zonas de envío activas para informar tiempos y costos en la ficha. */
export async function activeShippingZones() {
  await connection();
  return db
    .select({ name: s.shippingZones.name, price: s.shippingZones.price, minDays: s.shippingZones.minDays, maxDays: s.shippingZones.maxDays, freeFrom: s.shippingZones.freeFrom })
    .from(s.shippingZones)
    .where(eq(s.shippingZones.isActive, true))
    .orderBy(asc(s.shippingZones.sortOrder));
}

/** Precios vigentes de presentaciones, para que la bolsa nunca muestre precios guardados en el navegador. */
export async function priceVariants(ids: string[]) {
  await connection();
  if (!ids.length) return [];
  const rows = await db.query.productVariants.findMany({
    where: inArray(s.productVariants.id, ids.slice(0, 50)),
    with: { product: { with: { brand: true, images: { orderBy: asc(s.productImages.sortOrder), limit: 1 } } } },
  });
  return rows
    .filter((v) => v.product.isActive)
    .map((v) => ({
      variantId: v.id,
      sku: v.sku,
      kind: v.kind as VariantKind,
      sizeMl: v.sizeMl,
      label: v.label,
      price: v.price,
      available: v.isActive && (!v.trackInventory || v.stock > 0),
      maxQty: v.trackInventory ? Math.min(v.stock, 10) : 10,
      productSlug: v.product.slug,
      productName: v.product.name,
      brandName: v.product.brand.name,
      line: v.product.line as ProductLine,
      inspiredByHouse: v.product.inspiredByHouse,
      imageUrl: v.product.images[0]?.url ?? null,
    }));
}

export async function allProductSlugs() {
  await connection();
  return db.select({ slug: s.products.slug, updatedAt: s.products.updatedAt }).from(s.products).where(eq(s.products.isActive, true));
}
