/**
 * Dinero en pesos colombianos como enteros. Nunca se usan decimales de punto flotante
 * para precios, descuentos ni totales.
 */
export type Cop = number;

const formatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

export function formatCop(value: Cop): string {
  assertCop(value);
  // Intl agrega un espacio duro entre el símbolo y la cifra; se normaliza a "$389.000".
  return formatter.format(value).replace(/\s/g, "");
}

export function assertCop(value: number): asserts value is Cop {
  if (!Number.isSafeInteger(value)) throw new TypeError(`Valor monetario inválido: ${value}`);
}

/** Porcentaje entero sobre un valor, redondeado hacia abajo: un descuento nunca supera el porcentaje anunciado. */
export function percentOf(value: Cop, percent: number): Cop {
  assertCop(value);
  if (!Number.isInteger(percent) || percent < 0 || percent > 100) throw new RangeError(`Porcentaje inválido: ${percent}`);
  return Math.floor((value * percent) / 100);
}

/** Muestra el número de pedido como PX-001234. */
export function formatOrderNumber(n: number): string {
  return `PX-${String(n).padStart(6, "0")}`;
}
