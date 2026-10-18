import { boolean, check, index, integer, jsonb, pgTable, text, unique, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createdAt, id, tsz, updatedAt } from "./_helpers";
import {
  discountTypeEnum,
  inventoryMovementTypeEnum,
  orderStatusEnum,
  paymentMethodEnum,
  paymentStatusEnum,
  productLineEnum,
  shipmentStatusEnum,
} from "./enums";
import { users } from "./users";
import { productVariants } from "./catalog";

// ─────────────── Carrito ───────────────

/** Pertenece a un usuario o a un visitante identificado por un token en cookie (se guarda su hash). */
export const carts = pgTable(
  "carts",
  {
    id: id(),
    userId: uuid()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text().unique(),
    expiresAt: tsz().notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [check("carts_owner_present", sql`${t.userId} IS NOT NULL OR ${t.tokenHash} IS NOT NULL`)],
);

export const cartItems = pgTable(
  "cart_items",
  {
    id: id(),
    cartId: uuid()
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    variantId: uuid()
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    quantity: integer().notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    unique("cart_items_cart_variant_uq").on(t.cartId, t.variantId),
    check("cart_items_qty_range", sql`${t.quantity} BETWEEN 1 AND 20`),
  ],
);

// ─────────────── Envíos ───────────────

export const shippingZones = pgTable("shipping_zones", {
  id: id(),
  name: text().notNull(),
  /** Departamentos cubiertos. Si `cities` tiene valores, la zona aplica solo a esas ciudades. */
  departments: text().array().notNull().default(sql`'{}'::text[]`),
  cities: text().array().notNull().default(sql`'{}'::text[]`),
  price: integer().notNull(),
  freeFrom: integer(),
  minDays: integer().notNull(),
  maxDays: integer().notNull(),
  isActive: boolean().notNull().default(true),
  sortOrder: integer().notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

// ─────────────── Pedidos ───────────────

export const orders = pgTable(
  "orders",
  {
    id: id(),
    /** Consecutivo visible al cliente, se muestra como PX-000123. */
    number: integer().notNull().unique().generatedAlwaysAsIdentity({ startWith: 1001 }),
    userId: uuid().references(() => users.id, { onDelete: "set null" }),
    status: orderStatusEnum().notNull().default("PENDIENTE_PAGO"),
    email: text().notNull(),
    customerName: text().notNull(),
    phone: text().notNull(),
    documentId: text(),
    subtotal: integer().notNull(),
    discountTotal: integer().notNull().default(0),
    shippingTotal: integer().notNull().default(0),
    total: integer().notNull(),
    couponCode: text(),
    paymentMethod: paymentMethodEnum().notNull(),
    // Copia de la dirección de entrega al momento de comprar
    shipRecipient: text().notNull(),
    shipPhone: text().notNull(),
    shipDepartment: text().notNull(),
    shipCity: text().notNull(),
    shipLine1: text().notNull(),
    shipLine2: text(),
    shipNotes: text(),
    shippingZoneId: uuid().references(() => shippingZones.id, { onDelete: "set null" }),
    shippingLabel: text().notNull(),
    customerNotes: text(),
    /** Evita pedidos duplicados por doble clic o reintentos de red. */
    idempotencyKey: text().notNull().unique(),
    paidAt: tsz(),
    cancelledAt: tsz(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("orders_status_created_idx").on(t.status, t.createdAt),
    index("orders_email_idx").on(t.email),
    index("orders_user_idx").on(t.userId),
    check(
      "orders_totals_consistent",
      sql`${t.total} = ${t.subtotal} - ${t.discountTotal} + ${t.shippingTotal} AND ${t.total} >= 0 AND ${t.discountTotal} >= 0 AND ${t.discountTotal} <= ${t.subtotal}`,
    ),
  ],
);

/** Copia congelada de lo comprado: el historial no cambia si luego se edita el catálogo. */
export const orderItems = pgTable(
  "order_items",
  {
    id: id(),
    orderId: uuid()
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    variantId: uuid().references(() => productVariants.id, { onDelete: "set null" }),
    productName: text().notNull(),
    brandName: text().notNull(),
    line: productLineEnum().notNull(),
    variantName: text().notNull(),
    sku: text().notNull(),
    unitPrice: integer().notNull(),
    quantity: integer().notNull(),
    lineTotal: integer().notNull(),
  },
  (t) => [
    index("order_items_order_idx").on(t.orderId),
    index("order_items_variant_idx").on(t.variantId),
    check("order_items_line_total", sql`${t.lineTotal} = ${t.unitPrice} * ${t.quantity} AND ${t.quantity} > 0`),
  ],
);

export const orderStatusHistory = pgTable(
  "order_status_history",
  {
    id: id(),
    orderId: uuid()
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    from: orderStatusEnum(),
    to: orderStatusEnum().notNull(),
    note: text(),
    actorId: uuid().references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [index("order_history_order_idx").on(t.orderId, t.createdAt)],
);

// ─────────────── Inventario ───────────────

/** Cada cambio de existencias deja registro. `quantity` positivo = entrada, negativo = salida. */
export const inventoryMovements = pgTable(
  "inventory_movements",
  {
    id: id(),
    variantId: uuid()
      .notNull()
      .references(() => productVariants.id, { onDelete: "restrict" }),
    type: inventoryMovementTypeEnum().notNull(),
    quantity: integer().notNull(),
    stockAfter: integer().notNull(),
    reason: text(),
    userId: uuid().references(() => users.id, { onDelete: "set null" }),
    orderId: uuid().references(() => orders.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [
    index("inventory_variant_idx").on(t.variantId, t.createdAt),
    index("inventory_order_idx").on(t.orderId),
    check("inventory_qty_non_zero", sql`${t.quantity} <> 0`),
    check("inventory_stock_after_non_negative", sql`${t.stockAfter} >= 0`),
  ],
);

// ─────────────── Pagos ───────────────

/**
 * Intentos de pago de un pedido.
 * Transferencia QR: el cliente sube el comprobante y el personal lo verifica.
 * Addi: se confirma solo con la notificación firmada del proveedor.
 */
export const payments = pgTable(
  "payments",
  {
    id: id(),
    orderId: uuid()
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    method: paymentMethodEnum().notNull(),
    status: paymentStatusEnum().notNull().default("PENDIENTE"),
    amount: integer().notNull(),
    provider: text().notNull(),
    providerReference: text(),
    /** Ruta privada del comprobante; nunca una URL pública. */
    receiptKey: text(),
    failureReason: text(),
    verifiedById: uuid().references(() => users.id, { onDelete: "set null" }),
    verifiedAt: tsz(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    unique("payments_provider_ref_uq").on(t.provider, t.providerReference),
    index("payments_order_idx").on(t.orderId),
    index("payments_status_idx").on(t.status),
    check("payments_amount_positive", sql`${t.amount} > 0`),
  ],
);

/** Notificaciones del proveedor. La restricción única impide procesar dos veces el mismo evento. */
export const paymentEvents = pgTable(
  "payment_events",
  {
    id: id(),
    provider: text().notNull(),
    eventId: text().notNull(),
    paymentId: uuid().references(() => payments.id, { onDelete: "set null" }),
    type: text().notNull(),
    signatureValid: boolean().notNull(),
    payload: jsonb().notNull(),
    processedAt: tsz(),
    createdAt: createdAt(),
  },
  (t) => [unique("payment_events_provider_event_uq").on(t.provider, t.eventId)],
);

export const shipments = pgTable("shipments", {
  id: id(),
  orderId: uuid()
    .notNull()
    .unique()
    .references(() => orders.id, { onDelete: "cascade" }),
  carrier: text(),
  trackingNumber: text(),
  trackingUrl: text(),
  status: shipmentStatusEnum().notNull().default("PENDIENTE"),
  shippedAt: tsz(),
  deliveredAt: tsz(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

// ─────────────── Promociones ───────────────

export const coupons = pgTable(
  "coupons",
  {
    id: id(),
    /** Siempre en mayúsculas. */
    code: text().notNull().unique(),
    description: text(),
    type: discountTypeEnum().notNull(),
    /** Porcentaje (1 a 100) o valor fijo en COP según `type`. */
    value: integer().notNull(),
    minSubtotal: integer(),
    maxDiscount: integer(),
    maxUses: integer(),
    maxUsesPerCustomer: integer().default(1),
    usedCount: integer().notNull().default(0),
    startsAt: tsz(),
    endsAt: tsz(),
    isActive: boolean().notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    check("coupons_code_upper", sql`${t.code} = upper(${t.code})`),
    check(
      "coupons_value_valid",
      sql`(${t.type} = 'PORCENTAJE' AND ${t.value} BETWEEN 1 AND 100) OR (${t.type} = 'VALOR_FIJO' AND ${t.value} > 0)`,
    ),
  ],
);

export const couponRedemptions = pgTable(
  "coupon_redemptions",
  {
    id: id(),
    couponId: uuid()
      .notNull()
      .references(() => coupons.id, { onDelete: "restrict" }),
    orderId: uuid()
      .notNull()
      .unique()
      .references(() => orders.id, { onDelete: "cascade" }),
    email: text().notNull(),
    amount: integer().notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("coupon_redemptions_coupon_email_idx").on(t.couponId, t.email)],
);
