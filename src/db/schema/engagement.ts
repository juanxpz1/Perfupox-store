import { boolean, check, index, integer, jsonb, pgTable, primaryKey, text, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createdAt, id, tsz, updatedAt } from "./_helpers";
import { consentTypeEnum, reviewStatusEnum, subscriptionStatusEnum } from "./enums";
import { users } from "./users";
import { products } from "./catalog";
import { orderItems } from "./commerce";

export const favorites = pgTable(
  "favorites",
  {
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.productId] })],
);

/** Solo se reseña un artículo comprado y entregado (compra verificada): una reseña por artículo. */
export const reviews = pgTable(
  "reviews",
  {
    id: id(),
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    orderItemId: uuid()
      .notNull()
      .unique()
      .references(() => orderItems.id, { onDelete: "cascade" }),
    rating: integer().notNull(),
    title: text(),
    body: text().notNull(),
    status: reviewStatusEnum().notNull().default("PENDIENTE"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("reviews_product_status_idx").on(t.productId, t.status),
    check("reviews_rating_range", sql`${t.rating} BETWEEN 1 AND 5`),
  ],
);

export const newsletterSubscriptions = pgTable("newsletter_subscriptions", {
  id: id(),
  email: text().notNull().unique(),
  status: subscriptionStatusEnum().notNull().default("PENDIENTE"),
  confirmTokenHash: text().unique(),
  consentTextVersion: text().notNull(),
  consentedAt: tsz().notNull(),
  confirmedAt: tsz(),
  unsubscribedAt: tsz(),
  createdAt: createdAt(),
});

/** Evidencia de autorizaciones (Ley 1581 de 2012): qué texto aceptó, cuándo y por qué medio. */
export const consents = pgTable(
  "consents",
  {
    id: id(),
    userId: uuid().references(() => users.id, { onDelete: "set null" }),
    email: text().notNull(),
    type: consentTypeEnum().notNull(),
    version: text().notNull(),
    granted: boolean().notNull(),
    source: text().notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("consents_email_type_idx").on(t.email, t.type)],
);

// ─────────────── Contenido y configuración ───────────────

export const banners = pgTable("banners", {
  id: id(),
  title: text().notNull(),
  subtitle: text(),
  imageUrl: text(),
  linkUrl: text(),
  placement: text().notNull(),
  isActive: boolean().notNull().default(true),
  startsAt: tsz(),
  endsAt: tsz(),
  sortOrder: integer().notNull().default(0),
});

export const faqs = pgTable("faqs", {
  id: id(),
  question: text().notNull(),
  answer: text().notNull(),
  category: text(),
  isActive: boolean().notNull().default(true),
  sortOrder: integer().notNull().default(0),
});

/** Páginas legales y editoriales editables desde el panel. */
export const contentPages = pgTable("content_pages", {
  id: id(),
  slug: text().notNull().unique(),
  title: text().notNull(),
  body: text().notNull(),
  isPublished: boolean().notNull().default(false),
  /** El propietario debe revisar el texto legal antes de publicarlo. */
  needsReview: boolean().notNull().default(true),
  updatedAt: updatedAt(),
  publishedAt: tsz(),
});

/** Ajustes clave/valor: anuncios, envío gratis, WhatsApp, datos de la cuenta para QR. */
export const storeSettings = pgTable("store_settings", {
  key: text().primaryKey(),
  value: jsonb().notNull(),
  updatedAt: updatedAt(),
});

/** Acciones administrativas. Nunca guarda contraseñas, tokens ni comprobantes. */
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: id(),
    actorId: uuid().references(() => users.id, { onDelete: "set null" }),
    action: text().notNull(),
    entity: text().notNull(),
    entityId: text(),
    metadata: jsonb(),
    createdAt: createdAt(),
  },
  (t) => [
    index("audit_entity_idx").on(t.entity, t.entityId),
    index("audit_actor_idx").on(t.actorId, t.createdAt),
  ],
);
