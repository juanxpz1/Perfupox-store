import "server-only";

/**
 * Límite de solicitudes en memoria (ventana deslizante simple por clave).
 * Suficiente para una sola instancia en Railway; si se escala a varias, mover a Redis.
 */
const buckets = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return { ok: false, retryAfter: Math.ceil((windowMs - (now - hits[0])) / 1000) };
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 10_000) {
    for (const [k, v] of buckets) if (!v.some((t) => now - t < windowMs)) buckets.delete(k);
  }
  return { ok: true, retryAfter: 0 };
}

export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "local";
}

export function tooMany(retryAfter: number) {
  return Response.json(
    { error: "Demasiadas solicitudes. Espera unos segundos e intenta de nuevo." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}
