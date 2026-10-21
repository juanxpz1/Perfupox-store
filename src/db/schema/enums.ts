import { pgEnum } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["CUSTOMER", "STAFF", "ADMIN"]);

export const genderEnum = pgEnum("gender", ["HOMBRE", "MUJER", "UNISEX"]);

export const concentrationEnum = pgEnum("concentration", [
  "EAU_DE_COLOGNE",
  "EAU_DE_TOILETTE",
  "EAU_DE_PARFUM",
  "PARFUM",
  "EXTRAIT",
  "OTRA",
]);

/** Línea comercial de la tienda. */
export const productLineEnum = pgEnum("product_line", ["ARABE", "DISENADOR", "NICHO", "PREPARADA"]);

export const orderStatusEnum = pgEnum("order_status", [
  "PENDIENTE_PAGO",
  "PAGO_EN_VERIFICACION",
  "PAGO_CONFIRMADO",
  "EN_PREPARACION",
  "ENVIADO",
  "ENTREGADO",
  "CANCELADO",
  "REEMBOLSADO",
]);

export const paymentMethodEnum = pgEnum("payment_method", ["TRANSFERENCIA_QR", "ADDI", "OTRO"]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "PENDIENTE",
  "EN_VERIFICACION",
  "APROBADO",
  "RECHAZADO",
  "CANCELADO",
  "REEMBOLSADO",
]);

export const discountTypeEnum = pgEnum("discount_type", ["PORCENTAJE", "VALOR_FIJO"]);

export const inventoryMovementTypeEnum = pgEnum("inventory_movement_type", [
  "ENTRADA",
  "VENTA",
  "AJUSTE",
  "DEVOLUCION",
  "CANCELACION",
]);

export const shipmentStatusEnum = pgEnum("shipment_status", [
  "PENDIENTE",
  "EN_TRANSITO",
  "ENTREGADO",
  "NOVEDAD",
  "DEVUELTO",
]);

export const reviewStatusEnum = pgEnum("review_status", ["PENDIENTE", "PUBLICADA", "RECHAZADA"]);

export const consentTypeEnum = pgEnum("consent_type", ["TRATAMIENTO_DATOS", "MARKETING", "TERMINOS"]);

export const subscriptionStatusEnum = pgEnum("subscription_status", ["PENDIENTE", "CONFIRMADA", "CANCELADA"]);

/** Tipo de presentación: frasco completo, decant (muestra de un original) o perfume preparado. */
export const variantKindEnum = pgEnum("variant_kind", ["FRASCO", "DECANT", "PREPARADO"]);
