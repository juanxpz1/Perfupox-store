import {
  type AnyPgColumn,
  boolean,
  check,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createdAt, id, tsz, updatedAt } from "./_helpers";
import { concentrationEnum, genderEnum, productLineEnum, variantKindEnum } from "./enums";

export const brands = pgTable("brands", {
  id: id(),
  name: text().notNull(),
  slug: text().notNull().unique(),
  origin: text(),
  description: text(),
  logoUrl: text(),
  isFeatured: boolean().notNull().default(false),
  isActive: boolean().notNull().default(true),
  /** Marca los datos de demostración para borrarlos antes del lanzamiento. */
  isDemo: boolean().notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const categories = pgTable("categories", {
  id: id(),
  name: text().notNull(),
  slug: text().notNull().unique(),
  parentId: uuid().references((): AnyPgColumn => categories.id, { onDelete: "set null" }),
  sortOrder: integer().notNull().default(0),
  isActive: boolean().notNull().default(true),
});

export const olfactoryFamilies = pgTable("olfactory_families", {
  id: id(),
  name: text().notNull(),
  slug: text().notNull().unique(),
  description: text(),
  sortOrder: integer().notNull().default(0),
});

export const collections = pgTable("collections", {
  id: id(),
  name: text().notNull(),
  slug: text().notNull().unique(),
  description: text(),
  imageUrl: text(),
  isActive: boolean().notNull().default(true),
  startsAt: tsz(),
  endsAt: tsz(),
  sortOrder: integer().notNull().default(0),
});

export const products = pgTable(
  "products",
  {
    id: id(),
    slug: text().notNull().unique(),
    name: text().notNull(),
    brandId: uuid()
      .notNull()
      .references(() => brands.id, { onDelete: "restrict" }),
    line: productLineEnum().notNull(),
    gender: genderEnum().notNull(),
    /** Vacío si el catálogo de la tienda no la indica. */
    concentration: concentrationEnum(),
    familyId: uuid().references(() => olfactoryFamilies.id, { onDelete: "set null" }),
    shortDescription: text(),
    description: text(),
    topNotes: text().array().notNull().default(sql`'{}'::text[]`),
    heartNotes: text().array().notNull().default(sql`'{}'::text[]`),
    baseNotes: text().array().notNull().default(sql`'{}'::text[]`),
    countryOfOrigin: text(),
    /**
     * Solo perfumería preparada: perfume de referencia y su casa. Se muestra como texto,
     * nunca con fotos ni logotipos de la marca de referencia.
     */
    inspiredBy: text(),
    inspiredByHouse: text(),
    /** Texto normalizado (sin tildes, minúsculas) para la búsqueda. Lo calcula la aplicación. */
    searchText: text().notNull().default(""),
    /** Un producto nuevo nace oculto hasta que el administrador lo publica. */
    isActive: boolean().notNull().default(false),
    isFeatured: boolean().notNull().default(false),
    isNew: boolean().notNull().default(false),
    isDemo: boolean().notNull().default(false),
    publishedAt: tsz(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("products_listing_idx").on(t.isActive, t.line, t.gender),
    index("products_brand_idx").on(t.brandId),
    index("products_family_idx").on(t.familyId),
    index("products_search_trgm_idx").using("gin", sql`${t.searchText} gin_trgm_ops`),
  ],
);

/** Presentación vendible: tamaño, SKU, precio e inventario propios. Dinero en COP enteros. */
export const productVariants = pgTable(
  "product_variants",
  {
    id: id(),
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sku: text().notNull().unique(),
    kind: variantKindEnum().notNull().default("FRASCO"),
    /** Puede quedar vacío si aún no se conoce el tamaño del frasco. */
    sizeMl: integer(),
    /** Etiqueta opcional, por ejemplo «Intensidad alta» en perfumería preparada. */
    label: text(),
    price: integer().notNull(),
    compareAtPrice: integer(),
    stock: integer().notNull().default(0),
    /**
     * Si es falso, la disponibilidad depende solo de `isActive` (el administrador la marca a mano)
     * y no se descuentan unidades. Útil para decants y preparados, que se hacen al momento.
     */
    trackInventory: boolean().notNull().default(true),
    lowStockThreshold: integer().notNull().default(3),
    weightGrams: integer(),
    isActive: boolean().notNull().default(true),
    sortOrder: integer().notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("variants_product_idx").on(t.productId),
    check("variants_price_positive", sql`${t.price} > 0`),
    check("variants_stock_non_negative", sql`${t.stock} >= 0`),
    check("variants_size_positive", sql`${t.sizeMl} IS NULL OR ${t.sizeMl} > 0`),
    check(
      "variants_compare_at_gt_price",
      sql`${t.compareAtPrice} IS NULL OR ${t.compareAtPrice} > ${t.price}`,
    ),
  ],
);

export const productImages = pgTable(
  "product_images",
  {
    id: id(),
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    variantId: uuid().references(() => productVariants.id, { onDelete: "set null" }),
    url: text().notNull(),
    alt: text().notNull(),
    width: integer(),
    height: integer(),
    sortOrder: integer().notNull().default(0),
  },
  (t) => [index("product_images_product_idx").on(t.productId, t.sortOrder)],
);

export const productCategories = pgTable(
  "product_categories",
  {
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    categoryId: uuid()
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.productId, t.categoryId] }), index("product_categories_cat_idx").on(t.categoryId)],
);

export const productCollections = pgTable(
  "product_collections",
  {
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    collectionId: uuid()
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    sortOrder: integer().notNull().default(0),
  },
  (t) => [
    primaryKey({ columns: [t.productId, t.collectionId] }),
    index("product_collections_col_idx").on(t.collectionId),
  ],
);
