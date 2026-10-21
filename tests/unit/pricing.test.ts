import { describe, expect, it } from "vitest";
import {
  calculateTotals,
  type CouponRule,
  evaluateCoupon,
  type PricedLine,
  resolveZone,
  type ZoneRule,
} from "@/modules/pricing/calculate";

const NOW = new Date("2026-10-18T12:00:00-05:00");

const line = (over: Partial<PricedLine> = {}): PricedLine => ({
  variantId: "v1",
  sku: "PFX-1",
  unitPrice: 200_000,
  quantity: 1,
  stock: 5,
  trackInventory: true,
  isActive: true,
  ...over,
});

const coupon = (over: Partial<CouponRule> = {}): CouponRule => ({
  code: "BIENVENIDA",
  type: "PORCENTAJE",
  value: 10,
  minSubtotal: null,
  maxDiscount: null,
  maxUses: null,
  maxUsesPerCustomer: 1,
  usedCount: 0,
  startsAt: null,
  endsAt: null,
  isActive: true,
  ...over,
});

const zones: ZoneRule[] = [
  { id: "z-dep", name: "Antioquia", departments: ["Antioquia"], cities: [], price: 15_000, freeFrom: null, minDays: 2, maxDays: 4, isActive: true, sortOrder: 2 },
  { id: "z-med", name: "Medellín", departments: ["Antioquia"], cities: ["Medellín"], price: 9_000, freeFrom: 250_000, minDays: 1, maxDays: 2, isActive: true, sortOrder: 1 },
  { id: "z-nac", name: "Nacional", departments: [], cities: [], price: 20_000, freeFrom: null, minDays: 3, maxDays: 6, isActive: true, sortOrder: 9 },
  { id: "z-off", name: "Inactiva", departments: ["Bogotá D.C."], cities: [], price: 1, freeFrom: null, minDays: 1, maxDays: 1, isActive: false, sortOrder: 0 },
];

const base = { maxQtyPerLine: 10, zones, freeShippingFrom: 300_000, now: NOW };

describe("calculateTotals", () => {
  it("suma líneas y agrega el envío de la zona", () => {
    const t = calculateTotals({ ...base, lines: [line({ quantity: 2 }), line({ variantId: "v2", sku: "PFX-2", unitPrice: 45_000 })], destination: { department: "Antioquia", city: "Rionegro" } });
    expect(t.subtotal).toBe(445_000);
    expect(t.shipping).toBe(0); // supera el umbral global de 300.000
    expect(t.freeShippingApplied).toBe(true);
    expect(t.total).toBe(445_000);
    expect(t.canCheckout).toBe(true);
  });

  it("cobra envío cuando no alcanza el umbral", () => {
    const t = calculateTotals({ ...base, lines: [line()], destination: { department: "Antioquia", city: "Rionegro" } });
    expect(t.shipping).toBe(15_000);
    expect(t.total).toBe(215_000);
  });

  it("calcula el envío gratis después del descuento", () => {
    const t = calculateTotals({
      ...base,
      lines: [line({ unitPrice: 310_000 })],
      coupon: { rule: coupon({ value: 10 }), usesByCustomer: 0 },
      destination: { department: "Antioquia", city: "Rionegro" },
    });
    expect(t.discount).toBe(31_000);
    expect(t.freeShippingApplied).toBe(false);
    expect(t.total).toBe(310_000 - 31_000 + 15_000);
  });

  it("bloquea el checkout si una línea supera el inventario", () => {
    const t = calculateTotals({ ...base, lines: [line({ quantity: 6, stock: 5 })], destination: { department: "Antioquia", city: "Medellín" } });
    expect(t.lineProblems).toEqual([{ sku: "PFX-1", kind: "insufficient_stock", available: 5 }]);
    expect(t.canCheckout).toBe(false);
  });

  it("detecta productos agotados, inactivos y cantidades inválidas", () => {
    const t = calculateTotals({
      ...base,
      lines: [line({ stock: 0 }), line({ sku: "B", isActive: false }), line({ sku: "C", quantity: 0 }), line({ sku: "D", quantity: 1.5 })],
      destination: { department: "Antioquia", city: "Medellín" },
    });
    expect(t.lineProblems.map((p) => p.kind)).toEqual(["out_of_stock", "inactive", "invalid_quantity", "invalid_quantity"]);
    // Las cantidades inválidas no suman al subtotal.
    expect(t.subtotal).toBe(400_000);
  });

  it("con disponibilidad manual ignora el conteo de unidades", () => {
    const t = calculateTotals({ ...base, lines: [line({ stock: 0, quantity: 3, trackInventory: false })], destination: { department: "Antioquia", city: "Medellín" } });
    expect(t.lineProblems).toEqual([]);
    const off = calculateTotals({ ...base, lines: [line({ trackInventory: false, isActive: false })], destination: { department: "Antioquia", city: "Medellín" } });
    expect(off.lineProblems[0].kind).toBe("inactive");
  });

  it("no permite checkout sin destino ni con carrito vacío", () => {
    expect(calculateTotals({ ...base, lines: [line()] }).canCheckout).toBe(false);
    expect(calculateTotals({ ...base, lines: [], destination: { department: "Antioquia", city: "Medellín" } }).canCheckout).toBe(false);
  });
});

describe("evaluateCoupon", () => {
  it("aplica porcentaje redondeando hacia abajo", () => {
    expect(evaluateCoupon(coupon({ value: 15 }), 199_999, 0, NOW)).toEqual({ discount: 29_999, problem: null });
  });

  it("respeta el tope de descuento y nunca supera el subtotal", () => {
    expect(evaluateCoupon(coupon({ value: 50, maxDiscount: 40_000 }), 200_000, 0, NOW).discount).toBe(40_000);
    expect(evaluateCoupon(coupon({ type: "VALOR_FIJO", value: 500_000 }), 120_000, 0, NOW).discount).toBe(120_000);
  });

  it.each([
    ["not_found", null, 0],
    ["inactive", coupon({ isActive: false }), 0],
    ["not_started", coupon({ startsAt: new Date("2026-11-01") }), 0],
    ["expired", coupon({ endsAt: new Date("2026-10-01") }), 0],
    ["exhausted", coupon({ maxUses: 5, usedCount: 5 }), 0],
    ["customer_limit", coupon(), 1],
    ["min_subtotal", coupon({ minSubtotal: 500_000 }), 0],
  ] as const)("rechaza el cupón por %s", (problem, rule, uses) => {
    expect(evaluateCoupon(rule, 200_000, uses, NOW)).toEqual({ discount: 0, problem });
  });
});

describe("resolveZone", () => {
  it("prefiere la ciudad exacta sin importar tildes ni mayúsculas", () => {
    expect(resolveZone(zones, "antioquia", "MEDELLIN")?.id).toBe("z-med");
  });

  it("usa la zona del departamento y luego la nacional", () => {
    expect(resolveZone(zones, "Antioquia", "Envigado")?.id).toBe("z-dep");
    expect(resolveZone(zones, "Córdoba", "Montería")?.id).toBe("z-nac");
  });

  it("ignora zonas inactivas", () => {
    expect(resolveZone(zones, "Bogotá D.C.", "Bogotá")?.id).toBe("z-nac");
  });

  it("devuelve null si ninguna zona cubre el destino", () => {
    expect(resolveZone(zones.filter((z) => z.id !== "z-nac"), "Córdoba", "Montería")).toBeNull();
  });

  it("aplica el umbral de envío gratis propio de la zona", () => {
    const t = calculateTotals({ ...base, lines: [line({ unitPrice: 260_000 })], destination: { department: "Antioquia", city: "Medellín" } });
    expect(t.shipping).toBe(0);
  });
});
