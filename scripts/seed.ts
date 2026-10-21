/**
 * Datos iniciales.
 *
 * - Configuración base (familias olfativas, categorías, ajustes, borradores de páginas legales):
 *   se crean una sola vez y son reales.
 * - Catálogo de demostración: marcas y productos ficticios marcados con `isDemo = true`.
 *   Se omiten con SEED_DEMO=false y se borran con `npm run db:purge-demo`.
 *
 * Es idempotente: se puede ejecutar varias veces sin duplicar datos.
 */
import { eq, sql } from "drizzle-orm";
import { connect } from "./_db";
import * as s from "../src/db/schema";
import { slugify } from "../src/lib/slug";

const FAMILIES = [
  ["Ambaradas", "Ámbar, resinas y especias. Cálidas y envolventes."],
  ["Amaderadas", "Oud, cedro, sándalo y vetiver."],
  ["Florales", "Rosa, jazmín, iris y peonía."],
  ["Gourmand", "Vainilla, café, praliné y caramelo."],
  ["Frescas", "Cítricos, almizcles limpios y notas marinas."],
  ["Aromáticas", "Lavanda, salvia, romero y hierbas."],
] as const;

const CATEGORIES = ["Árabes", "Diseñador", "Nicho", "Perfumería preparada", "Sets de regalo"];

const SETTINGS: Record<string, unknown> = {
  announcements: [
    "Perfumes originales árabes y de diseñador",
    "Prueba antes de comprar: decants de 5 y 10 ml",
    "Paga por transferencia o a cuotas con Addi",
  ],
  free_shipping_from: null,
  whatsapp: { number: "573233318497", enabled: true },
  qr_payment: {
    enabled: false,
    instructions: "POR CONFIGURAR: banco, titular y llave o código QR de la cuenta de la tienda.",
    qrImageKey: null,
  },
  consent_versions: { terms: "2026-10-borrador", privacy: "2026-10-borrador", marketing: "2026-10-borrador" },
};

const LEGAL_PAGES = [
  ["terminos-y-condiciones", "Términos y condiciones"],
  ["politica-de-privacidad", "Política de tratamiento de datos personales"],
  ["cambios-y-devoluciones", "Cambios, devoluciones y derecho de retracto"],
  ["envios", "Información de envíos"],
] as const;

const DRAFT_NOTICE =
  "BORRADOR PENDIENTE DE REVISIÓN. El propietario debe completar este texto con la información real del comercio " +
  "(razón social, NIT, canales de atención, plazos) y validarlo con un asesor legal antes de publicarlo.";

const FAQS = [
  ["¿Los perfumes son originales?", "Sí. Los perfumes árabes y de diseñador son originales. La perfumería preparada es una línea propia de la tienda y se identifica como tal en la ficha y en el pedido."],
  ["¿Cómo pago por transferencia con QR?", "Al finalizar la compra verás el código QR y los datos de pago. Después de pagar, sube el comprobante desde tu pedido y lo verificamos para confirmar el despacho."],
  ["¿Puedo pagar a cuotas?", "Sí, con Addi. La aprobación y el número de cuotas los define Addi al momento del pago."],
] as const;

// ───── Demostración: nombres, marcas, notas y precios ficticios ─────
const DEMO_BRANDS = [
  ["Casa Demo Oriente", "Emiratos Árabes Unidos (demo)"],
  ["Maison Demo Paris", "Francia (demo)"],
  ["Perfupox Preparada", "Colombia"],
] as const;

type DemoProduct = {
  name: string;
  brand: (typeof DEMO_BRANDS)[number][0];
  line: "ARABE" | "DISENADOR" | "PREPARADA";
  gender: "HOMBRE" | "MUJER" | "UNISEX";
  concentration: "EAU_DE_TOILETTE" | "EAU_DE_PARFUM" | "PARFUM" | "EXTRAIT";
  family: string;
  notes: [string[], string[], string[]];
  variants: { ml: number; price: number; was?: number; stock: number; label?: string }[];
  isNew?: boolean;
  isFeatured?: boolean;
};

const DEMO_PRODUCTS: DemoProduct[] = [
  { name: "Oud Sultani (demo)", brand: "Casa Demo Oriente", line: "ARABE", gender: "UNISEX", concentration: "EAU_DE_PARFUM", family: "ambaradas", notes: [["Azafrán", "Cardamomo"], ["Rosa", "Oud"], ["Ámbar", "Sándalo", "Almizcle"]], variants: [{ ml: 100, price: 389_000, was: 429_000, stock: 4 }], isFeatured: true },
  { name: "Layali Rose (demo)", brand: "Casa Demo Oriente", line: "ARABE", gender: "MUJER", concentration: "EAU_DE_PARFUM", family: "florales", notes: [["Lichi", "Bergamota"], ["Rosa", "Peonía"], ["Vainilla", "Almizcle"]], variants: [{ ml: 100, price: 259_000, stock: 12 }], isFeatured: true },
  { name: "Amber Majlis (demo)", brand: "Casa Demo Oriente", line: "ARABE", gender: "HOMBRE", concentration: "EXTRAIT", family: "ambaradas", notes: [["Canela", "Ciruela"], ["Tabaco", "Miel"], ["Ámbar", "Haba tonka"]], variants: [{ ml: 100, price: 319_000, stock: 9 }] },
  { name: "Vanille Dorée (demo)", brand: "Casa Demo Oriente", line: "ARABE", gender: "MUJER", concentration: "EAU_DE_PARFUM", family: "gourmand", notes: [["Pera", "Almendra"], ["Praliné", "Jazmín"], ["Vainilla", "Caramelo"]], variants: [{ ml: 100, price: 239_000, stock: 20 }], isNew: true },
  { name: "Cèdre Noir (demo)", brand: "Maison Demo Paris", line: "DISENADOR", gender: "HOMBRE", concentration: "EAU_DE_TOILETTE", family: "amaderadas", notes: [["Pimienta negra", "Pomelo"], ["Cedro", "Vetiver"], ["Ambroxan", "Cuero"]], variants: [{ ml: 50, price: 305_000, stock: 3 }, { ml: 100, price: 449_000, stock: 6 }], isNew: true },
  { name: "Bleu Marin (demo)", brand: "Maison Demo Paris", line: "DISENADOR", gender: "HOMBRE", concentration: "EAU_DE_PARFUM", family: "frescas", notes: [["Limón", "Menta"], ["Lavanda", "Geranio"], ["Incienso", "Cedro"]], variants: [{ ml: 60, price: 352_000, stock: 2 }, { ml: 100, price: 489_000, was: 529_000, stock: 2 }] },
  { name: "Fleur d'Iris (demo)", brand: "Maison Demo Paris", line: "DISENADOR", gender: "MUJER", concentration: "EAU_DE_PARFUM", family: "florales", notes: [["Mandarina", "Pera"], ["Iris", "Jazmín"], ["Pachulí", "Vainilla"]], variants: [{ ml: 50, price: 349_000, stock: 5 }, { ml: 90, price: 529_000, stock: 8 }] },
  { name: "Preparada Ambarada", brand: "Perfupox Preparada", line: "PREPARADA", gender: "UNISEX", concentration: "EXTRAIT", family: "ambaradas", notes: [[], [], []], variants: [
    { ml: 30, price: 45_000, stock: 50, label: "Intensidad media" }, { ml: 50, price: 65_000, stock: 50, label: "Intensidad media" }, { ml: 100, price: 110_000, stock: 50, label: "Intensidad media" },
    { ml: 30, price: 56_000, stock: 50, label: "Intensidad alta" }, { ml: 50, price: 81_000, stock: 50, label: "Intensidad alta" }, { ml: 100, price: 138_000, stock: 50, label: "Intensidad alta" },
  ] },
];

const DEMO_ZONES = [
  { name: "Ciudad principal (ejemplo)", departments: ["Bogotá D.C.", "Antioquia", "Valle del Cauca", "Atlántico"], cities: ["Bogotá", "Medellín", "Cali", "Barranquilla"], price: 12_000, minDays: 1, maxDays: 2, sortOrder: 1 },
  { name: "Nacional (ejemplo)", departments: [], cities: [], price: 18_000, minDays: 2, maxDays: 5, sortOrder: 9 },
];

async function main() {
  const { db, pool } = connect();
  const withDemo = process.env.SEED_DEMO === "true";

  await db.transaction(async (tx) => {
    // Familias y categorías
    for (const [i, [name, description]] of FAMILIES.entries()) {
      await tx.insert(s.olfactoryFamilies).values({ name, slug: slugify(name), description, sortOrder: i }).onConflictDoNothing();
    }
    for (const [i, name] of CATEGORIES.entries()) {
      await tx.insert(s.categories).values({ name, slug: slugify(name), sortOrder: i }).onConflictDoNothing();
    }
    for (const [key, value] of Object.entries(SETTINGS)) {
      await tx.insert(s.storeSettings).values({ key, value }).onConflictDoNothing();
    }
    for (const [slug, title] of LEGAL_PAGES) {
      await tx.insert(s.contentPages).values({ slug, title, body: DRAFT_NOTICE, isPublished: false, needsReview: true }).onConflictDoNothing();
    }
    const faqCount = await tx.select({ n: sql<number>`count(*)::int` }).from(s.faqs);
    if (faqCount[0].n === 0) {
      await tx.insert(s.faqs).values(FAQS.map(([question, answer], i) => ({ question, answer, sortOrder: i })));
    }

    if (!withDemo) return;

    const zoneCount = await tx.select({ n: sql<number>`count(*)::int` }).from(s.shippingZones);
    if (zoneCount[0].n === 0) await tx.insert(s.shippingZones).values(DEMO_ZONES);

    const brandIds = new Map<string, string>();
    for (const [name, origin] of DEMO_BRANDS) {
      const [row] = await tx
        .insert(s.brands)
        .values({ name, slug: slugify(name), origin, isDemo: true, isFeatured: true })
        .onConflictDoUpdate({ target: s.brands.slug, set: { origin } })
        .returning({ id: s.brands.id });
      brandIds.set(name, row.id);
    }

    const families = await tx.select({ id: s.olfactoryFamilies.id, slug: s.olfactoryFamilies.slug }).from(s.olfactoryFamilies);
    const cats = await tx.select({ id: s.categories.id, slug: s.categories.slug }).from(s.categories);
    const catForLine = { ARABE: "arabes", DISENADOR: "disenador", PREPARADA: "perfumeria-preparada" } as const;

    for (const p of DEMO_PRODUCTS) {
      const slug = slugify(p.name);
      const exists = await tx.select({ id: s.products.id }).from(s.products).where(eq(s.products.slug, slug));
      if (exists.length) continue;

      const [prod] = await tx
        .insert(s.products)
        .values({
          slug,
          name: p.name,
          brandId: brandIds.get(p.brand)!,
          line: p.line,
          gender: p.gender,
          concentration: p.concentration,
          familyId: families.find((f) => f.slug === p.family)?.id,
          shortDescription: "Producto de demostración. Reemplázalo desde el panel con la información del fabricante.",
          topNotes: p.notes[0],
          heartNotes: p.notes[1],
          baseNotes: p.notes[2],
          isActive: true,
          isNew: p.isNew ?? false,
          isFeatured: p.isFeatured ?? false,
          isDemo: true,
          publishedAt: new Date(),
        })
        .returning({ id: s.products.id });

      const catId = cats.find((c) => c.slug === catForLine[p.line])?.id;
      if (catId) await tx.insert(s.productCategories).values({ productId: prod.id, categoryId: catId });

      for (const [i, v] of p.variants.entries()) {
        const suffix = v.label ? `-${v.label.includes("alta") ? "A" : "M"}` : "";
        const [variant] = await tx
          .insert(s.productVariants)
          .values({
            productId: prod.id,
            sku: `DEMO-${slug.slice(0, 18).toUpperCase()}-${v.ml}${suffix}`,
            sizeMl: v.ml,
            label: v.label,
            price: v.price,
            compareAtPrice: v.was,
            stock: v.stock,
            sortOrder: i,
          })
          .returning({ id: s.productVariants.id });
        await tx.insert(s.inventoryMovements).values({
          variantId: variant.id,
          type: "ENTRADA",
          quantity: v.stock,
          stockAfter: v.stock,
          reason: "Inventario inicial de demostración",
        });
      }
    }
  });

  const [{ products }] = await db.select({ products: sql<number>`count(*)::int` }).from(s.products);
  console.log(`Datos iniciales listos. Productos en catálogo: ${products}${withDemo ? " (incluye demostración)" : ""}.`);
  await pool.end();
}

main().catch((err) => {
  console.error("Error al cargar datos iniciales:", err);
  process.exit(1);
});
