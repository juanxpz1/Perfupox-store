import { z } from "zod";
import { getProductsBySlugs, priceVariants } from "@/modules/catalog/queries";
import { clientIp, rateLimit, tooMany } from "@/lib/rate-limit";

const bodySchema = z.object({
  variantIds: z.array(z.uuid()).max(30).default([]),
  favorites: z.array(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(90)).max(60).default([]),
});

/**
 * Datos vigentes para la bolsa y los favoritos guardados en el navegador:
 * precios, disponibilidad y nombres salen siempre de la base de datos.
 */
export async function POST(request: Request) {
  const rl = rateLimit(`bolsa:${clientIp(request.headers)}`, 120, 60_000);
  if (!rl.ok) return tooMany(rl.retryAfter);
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Solicitud inválida." }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return Response.json({ error: "Solicitud inválida." }, { status: 400 });
  const [variants, favorites] = await Promise.all([priceVariants(parsed.data.variantIds), getProductsBySlugs(parsed.data.favorites)]);
  return Response.json({ variants, favorites }, { headers: { "Cache-Control": "no-store" } });
}
