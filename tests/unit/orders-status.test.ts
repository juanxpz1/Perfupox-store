import { describe, expect, it } from "vitest";
import {
  allowedTransitions,
  assertTransition,
  canTransition,
  cancellationRestocks,
  InvalidTransitionError,
  ORDER_STATUSES,
  refundAllowed,
} from "@/modules/orders/status";

describe("estados del pedido", () => {
  it("el cliente sube el comprobante QR pero no puede confirmar su propio pago", () => {
    expect(canTransition("PENDIENTE_PAGO", "PAGO_EN_VERIFICACION", "customer")).toBe(true);
    expect(canTransition("PAGO_EN_VERIFICACION", "PAGO_CONFIRMADO", "customer")).toBe(false);
    expect(canTransition("PENDIENTE_PAGO", "PAGO_CONFIRMADO", "customer")).toBe(false);
  });

  it("solo el sistema confirma un pago de Addi directamente", () => {
    expect(canTransition("PENDIENTE_PAGO", "PAGO_CONFIRMADO", "system")).toBe(true);
    expect(canTransition("PENDIENTE_PAGO", "PAGO_CONFIRMADO", "staff")).toBe(false);
  });

  it("el personal verifica o rechaza el comprobante", () => {
    expect(allowedTransitions("PAGO_EN_VERIFICACION", "staff").sort()).toEqual(["CANCELADO", "PAGO_CONFIRMADO", "PENDIENTE_PAGO"]);
  });

  it("sigue el flujo de despacho en orden", () => {
    expect(canTransition("PAGO_CONFIRMADO", "EN_PREPARACION", "staff")).toBe(true);
    expect(canTransition("EN_PREPARACION", "ENVIADO", "staff")).toBe(true);
    expect(canTransition("ENVIADO", "ENTREGADO", "staff")).toBe(true);
    expect(canTransition("PAGO_CONFIRMADO", "ENVIADO", "staff")).toBe(false);
  });

  it("no se cancela un pedido ya enviado", () => {
    for (const actor of ["customer", "system", "staff", "admin"] as const) {
      expect(canTransition("ENVIADO", "CANCELADO", actor)).toBe(false);
    }
  });

  it("cancelar un pedido pagado y reembolsar es solo para administrador", () => {
    expect(canTransition("PAGO_CONFIRMADO", "CANCELADO", "staff")).toBe(false);
    expect(canTransition("PAGO_CONFIRMADO", "CANCELADO", "admin")).toBe(true);
    expect(canTransition("ENTREGADO", "REEMBOLSADO", "staff")).toBe(false);
  });

  it("REEMBOLSADO es un estado final", () => {
    for (const to of ORDER_STATUSES) expect(canTransition("REEMBOLSADO", to, "admin")).toBe(false);
  });

  it("lanza un error claro ante una transición inválida", () => {
    expect(() => assertTransition("ENTREGADO", "PENDIENTE_PAGO", "admin")).toThrow(InvalidTransitionError);
  });

  it("la cancelación devuelve inventario solo antes del envío", () => {
    expect(cancellationRestocks("PENDIENTE_PAGO")).toBe(true);
    expect(cancellationRestocks("EN_PREPARACION")).toBe(true);
    expect(cancellationRestocks("ENVIADO")).toBe(false);
  });

  it("un pedido cancelado sin pago no se reembolsa", () => {
    expect(refundAllowed("CANCELADO", false)).toBe(false);
    expect(refundAllowed("CANCELADO", true)).toBe(true);
  });
});
