import { suggest } from "@/modules/catalog/queries";
import { clientIp, rateLimit, tooMany } from "@/lib/rate-limit";

/** Sugerencias del buscador: GET /api/buscar?q=oud */
export async function GET(request: Request) {
  const rl = rateLimit(`buscar:${clientIp(request.headers)}`, 60, 60_000);
  if (!rl.ok) return tooMany(rl.retryAfter);
  const q = (new URL(request.url).searchParams.get("q") ?? "").slice(0, 60);
  const items = await suggest(q);
  return Response.json(
    {
      items: items.map((p) => ({
        slug: p.slug,
        name: p.name,
        brandName: p.brandName,
        line: p.line,
        inspiredByHouse: p.inspiredByHouse,
        imageUrl: p.imageUrl,
        priceFrom: p.priceFrom,
      })),
    },
    { headers: { "Cache-Control": "private, max-age=30" } },
  );
}
