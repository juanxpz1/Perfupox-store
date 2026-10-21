import { type Cop, percentOf } from "@/lib/money";
import { normalizeSearch } from "@/lib/slug";

/**
 * Cálculo de totales del pedido. Es una función pura: recibe los datos ya leídos de la
 * base de datos (precios, inventario, cupón, zonas) y nunca confía en importes del navegador.
 * El checkout la ejecuta en el servidor justo antes de crear el pedido.
 */

export type PricedLine = {
  variantId: string;
  sku: string;
  unitPrice: Cop;
  quantity: number;
  stock: number;
  /** Si es falso, solo cuenta `isActive` (disponibilidad marcada a mano en el panel). */
  trackInventory: boolean;
  isActive: boolean;
};

export type CouponRule = {
  code: string;
  type: "PORCENTAJE" | "VALOR_FIJO";
  value: number;
  minSubtotal: Cop | null;
  maxDiscount: Cop | null;
  maxUses: number | null;
  maxUsesPerCustomer: number | null;
  usedCount: number;
  startsAt: Date | null;
  endsAt: Date | null;
  isActive: boolean;
};

export type ZoneRule = {
  id: string;
  name: string;
  departments: string[];
  cities: string[];
  price: Cop;
  freeFrom: Cop | null;
  minDays: number;
  maxDays: number;
  isActive: boolean;
  sortOrder: number;
};

export type LineProblem =
  | { sku: string; kind: "inactive" }
  | { sku: string; kind: "out_of_stock" }
  | { sku: string; kind: "insufficient_stock"; available: number }
  | { sku: string; kind: "invalid_quantity" };

export type CouponProblem =
  | "not_found"
  | "inactive"
  | "not_started"
  | "expired"
  | "min_subtotal"
  | "exhausted"
  | "customer_limit";

export const COUPON_MESSAGES: Record<CouponProblem, string> = {
  not_found: "Ese cupón no existe. Revisa que esté bien escrito.",
  inactive: "Este cupón ya no está disponible.",
  not_started: "Este cupón todavía no está vigente.",
  expired: "Este cupón ya venció.",
  min_subtotal: "Tu compra no alcanza el valor mínimo para este cupón.",
  exhausted: "Este cupón alcanzó su límite de usos.",
  customer_limit: "Ya usaste este cupón el número máximo de veces.",
};

export type TotalsInput = {
  lines: PricedLine[];
  maxQtyPerLine: number;
  coupon?: { rule: CouponRule | null; usesByCustomer: number } | null;
  zones: ZoneRule[];
  destination?: { department: string; city: string } | null;
  /** Umbral global de envío gratis; una zona puede definir el suyo. */
  freeShippingFrom: Cop | null;
  now: Date;
};

export type Totals = {
  subtotal: Cop;
  discount: Cop;
  shipping: Cop | null;
  total: Cop;
  zone: Pick<ZoneRule, "id" | "name" | "minDays" | "maxDays"> | null;
  freeShippingApplied: boolean;
  lineProblems: LineProblem[];
  couponProblem: CouponProblem | null;
  /** Falso si hay problemas en las líneas o no hay zona de envío para el destino. */
  canCheckout: boolean;
};

export function checkLine(line: PricedLine, maxQty: number): LineProblem | null {
  if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > maxQty)
    return { sku: line.sku, kind: "invalid_quantity" };
  if (!line.isActive) return { sku: line.sku, kind: "inactive" };
  if (!line.trackInventory) return null;
  if (line.stock <= 0) return { sku: line.sku, kind: "out_of_stock" };
  if (line.quantity > line.stock) return { sku: line.sku, kind: "insufficient_stock", available: line.stock };
  return null;
}

export function evaluateCoupon(
  rule: CouponRule | null,
  subtotal: Cop,
  usesByCustomer: number,
  now: Date,
): { discount: Cop; problem: CouponProblem | null } {
  if (!rule) return { discount: 0, problem: "not_found" };
  if (!rule.isActive) return { discount: 0, problem: "inactive" };
  if (rule.startsAt && now < rule.startsAt) return { discount: 0, problem: "not_started" };
  if (rule.endsAt && now > rule.endsAt) return { discount: 0, problem: "expired" };
  if (rule.maxUses != null && rule.usedCount >= rule.maxUses) return { discount: 0, problem: "exhausted" };
  if (rule.maxUsesPerCustomer != null && usesByCustomer >= rule.maxUsesPerCustomer)
    return { discount: 0, problem: "customer_limit" };
  if (rule.minSubtotal != null && subtotal < rule.minSubtotal) return { discount: 0, problem: "min_subtotal" };

  let discount = rule.type === "PORCENTAJE" ? percentOf(subtotal, rule.value) : rule.value;
  if (rule.maxDiscount != null) discount = Math.min(discount, rule.maxDiscount);
  discount = Math.min(discount, subtotal);
  return { discount, problem: null };
}

/**
 * Elige la zona de envío: primero una que nombre la ciudad exacta dentro del departamento,
 * luego una que cubra todo el departamento. Entre empates gana el menor `sortOrder`.
 */
export function resolveZone(zones: ZoneRule[], department: string, city: string): ZoneRule | null {
  const dep = normalizeSearch(department);
  const cty = normalizeSearch(city);
  const active = zones.filter((z) => z.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  const coversDep = (z: ZoneRule) => z.departments.length === 0 || z.departments.some((d) => normalizeSearch(d) === dep);
  const byCity = active.find((z) => z.cities.length > 0 && coversDep(z) && z.cities.some((c) => normalizeSearch(c) === cty));
  if (byCity) return byCity;
  return active.find((z) => z.cities.length === 0 && coversDep(z)) ?? null;
}

export function calculateTotals(input: TotalsInput): Totals {
  const lineProblems: LineProblem[] = [];
  let subtotal = 0;
  for (const line of input.lines) {
    const problem = checkLine(line, input.maxQtyPerLine);
    if (problem) lineProblems.push(problem);
    if (problem?.kind !== "invalid_quantity") subtotal += line.unitPrice * line.quantity;
  }

  let discount = 0;
  let couponProblem: CouponProblem | null = null;
  if (input.coupon) {
    const res = evaluateCoupon(input.coupon.rule, subtotal, input.coupon.usesByCustomer, input.now);
    discount = res.discount;
    couponProblem = res.problem;
  }

  let shipping: Cop | null = null;
  let zone: Totals["zone"] = null;
  let freeShippingApplied = false;
  if (input.destination) {
    const z = resolveZone(input.zones, input.destination.department, input.destination.city);
    if (z) {
      zone = { id: z.id, name: z.name, minDays: z.minDays, maxDays: z.maxDays };
      const threshold = z.freeFrom ?? input.freeShippingFrom;
      // El envío gratis se calcula sobre lo que el cliente paga por productos, después del descuento.
      freeShippingApplied = threshold != null && subtotal - discount >= threshold;
      shipping = freeShippingApplied ? 0 : z.price;
    }
  }

  const total = subtotal - discount + (shipping ?? 0);
  const canCheckout =
    input.lines.length > 0 && lineProblems.length === 0 && (input.destination ? shipping !== null : false);

  return { subtotal, discount, shipping, total, zone, freeShippingApplied, lineProblems, couponProblem, canCheckout };
}
