/** Rangos de precio del filtro del catálogo (COP). */
export const PRICE_RANGES = [
  { id: "0-50000", label: "Hasta $50.000", min: undefined, max: 50_000 },
  { id: "50000-150000", label: "$50.000 a $150.000", min: 50_000, max: 150_000 },
  { id: "150000-250000", label: "$150.000 a $250.000", min: 150_000, max: 250_000 },
  { id: "250000-400000", label: "$250.000 a $400.000", min: 250_000, max: 400_000 },
  { id: "400000-", label: "Más de $400.000", min: 400_000, max: undefined },
] as const;
