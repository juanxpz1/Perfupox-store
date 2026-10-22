/**
 * Flujo controlado de estados del pedido.
 *
 * Los pedidos llegan por WhatsApp y el personal los registra en el panel.
 *  PENDIENTE_PAGO ──(llega el comprobante)──▶ PAGO_EN_VERIFICACION ──(personal verifica)──▶ PAGO_CONFIRMADO
 *  PAGO_CONFIRMADO ──▶ EN_PREPARACION ──▶ ENVIADO ──▶ ENTREGADO
 *  Cancelación posible antes del envío. Reembolso solo sobre pedidos pagados.
 *
 * Quién dispara cada transición:
 *  - "customer": el propio cliente desde su pedido.
 *  - "system": el servidor al recibir una notificación verificada de la pasarela o al vencer un pedido.
 *  - "staff": personal operativo o administrador desde el panel.
 *  - "admin": solo administrador.
 */
export const ORDER_STATUSES = [
  "PENDIENTE_PAGO",
  "PAGO_EN_VERIFICACION",
  "PAGO_CONFIRMADO",
  "EN_PREPARACION",
  "ENVIADO",
  "ENTREGADO",
  "CANCELADO",
  "REEMBOLSADO",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type Actor = "customer" | "system" | "staff" | "admin";

type Rule = { to: OrderStatus; by: readonly Actor[] };

const RULES: Record<OrderStatus, readonly Rule[]> = {
  PENDIENTE_PAGO: [
    { to: "PAGO_EN_VERIFICACION", by: ["customer", "staff", "admin"] },
    { to: "PAGO_CONFIRMADO", by: ["system"] },
    { to: "CANCELADO", by: ["customer", "system", "staff", "admin"] },
  ],
  PAGO_EN_VERIFICACION: [
    { to: "PAGO_CONFIRMADO", by: ["staff", "admin"] },
    // Comprobante rechazado: el pedido vuelve a esperar pago.
    { to: "PENDIENTE_PAGO", by: ["staff", "admin"] },
    { to: "CANCELADO", by: ["staff", "admin"] },
  ],
  PAGO_CONFIRMADO: [
    { to: "EN_PREPARACION", by: ["staff", "admin"] },
    { to: "CANCELADO", by: ["admin"] },
  ],
  EN_PREPARACION: [
    { to: "ENVIADO", by: ["staff", "admin"] },
    { to: "CANCELADO", by: ["admin"] },
  ],
  ENVIADO: [{ to: "ENTREGADO", by: ["staff", "admin"] }],
  ENTREGADO: [{ to: "REEMBOLSADO", by: ["admin"] }],
  CANCELADO: [{ to: "REEMBOLSADO", by: ["admin"] }],
  REEMBOLSADO: [],
};

/** Estados en los que ya se recibió dinero. */
export const PAID_STATUSES: readonly OrderStatus[] = ["PAGO_CONFIRMADO", "EN_PREPARACION", "ENVIADO", "ENTREGADO"];

export function allowedTransitions(from: OrderStatus, actor: Actor): OrderStatus[] {
  return RULES[from].filter((r) => r.by.includes(actor)).map((r) => r.to);
}

export function canTransition(from: OrderStatus, to: OrderStatus, actor: Actor): boolean {
  return RULES[from].some((r) => r.to === to && r.by.includes(actor));
}

export class InvalidTransitionError extends Error {
  constructor(
    readonly from: OrderStatus,
    readonly to: OrderStatus,
    readonly actor: Actor,
  ) {
    super(`No se puede pasar el pedido de ${from} a ${to} (${actor}).`);
    this.name = "InvalidTransitionError";
  }
}

export function assertTransition(from: OrderStatus, to: OrderStatus, actor: Actor): void {
  if (!canTransition(from, to, actor)) throw new InvalidTransitionError(from, to, actor);
}

/**
 * Inventario: las unidades se descuentan al crear el pedido, dentro de la misma transacción,
 * para que dos clientes no paguen la misma última unidad (importante con transferencias que
 * se verifican a mano). Si el pedido se cancela o vence sin pago, las unidades vuelven.
 * La cancelación solo existe antes del envío, así que siempre devuelve inventario.
 */
export const UNPAID_ORDER_TTL_HOURS = 24;

export function cancellationRestocks(from: OrderStatus): boolean {
  return canTransition(from, "CANCELADO", "admin");
}

/** A un reembolso solo se llega desde un estado donde se recibió dinero. */
export function refundAllowed(from: OrderStatus, wasPaid: boolean): boolean {
  return (from === "ENTREGADO" || from === "CANCELADO") && wasPaid;
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDIENTE_PAGO: "Pendiente de pago",
  PAGO_EN_VERIFICACION: "Pago en verificación",
  PAGO_CONFIRMADO: "Pago confirmado",
  EN_PREPARACION: "En preparación",
  ENVIADO: "Enviado",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
  REEMBOLSADO: "Reembolsado",
};
