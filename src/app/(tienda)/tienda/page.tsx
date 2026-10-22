import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CatalogFilters, SortSelect } from "@/components/store/catalog-filters";
import { PRICE_RANGES } from "@/modules/catalog/price-ranges";
import { ProductGrid, ProductGridSkeleton } from "@/components/store/product-card";
import { IconClose } from "@/components/icons";
import { catalogQuerySchema, type CatalogQuery } from "@/lib/validation/catalog";
import { catalogFacets, listProducts } from "@/modules/catalog/queries";
import { whatsappLink } from "@/lib/whatsapp";

type SP = Promise<Record<string, string | string[] | undefined>>;

const LINE_TITLE = { arabe: "Perfumes árabes", disenador: "Perfumes de diseñador", nicho: "Perfumería nicho", preparada: "Perfumería preparada" } as const;
const GENDER_TITLE = { hombre: "para hombre", mujer: "para mujer", unisex: "unisex" } as const;

function titleFor(q: CatalogQuery) {
  if (q.q) return `Resultados para «${q.q}»`;
  const base = q.formato === "decant" ? "Decants de perfumes originales" : q.linea ? LINE_TITLE[q.linea] : "Todos los perfumes";
  return q.genero ? `${base} ${GENDER_TITLE[q.genero]}` : base;
}

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const q = catalogQuerySchema.parse(await searchParams);
  const filtered = q.q || q.marca?.length || q.min != null || q.max != null || q.orden !== "relevancia" || q.pagina > 1;
  const canonical = new URLSearchParams();
  if (q.linea) canonical.set("linea", q.linea);
  if (q.genero) canonical.set("genero", q.genero);
  if (q.formato) canonical.set("formato", q.formato);
  return {
    title: titleFor(q),
    description: "Perfumes originales árabes y de diseñador, decants de 5 y 10 ml y perfumería preparada. Pide por WhatsApp con asesoría personalizada.",
    alternates: { canonical: `/tienda${canonical.size ? `?${canonical}` : ""}` },
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

function hrefWith(q: CatalogQuery, patch: Partial<Record<keyof CatalogQuery, string | string[] | number | undefined>>) {
  const merged = { ...q, ...patch } as Record<string, unknown>;
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) {
    if (v == null || v === "" || (k === "orden" && v === "relevancia") || (k === "pagina" && v === 1)) continue;
    if (Array.isArray(v)) v.forEach((x) => p.append(k, String(x)));
    else p.set(k, String(v));
  }
  return `/tienda${p.size ? `?${p}` : ""}`;
}

async function Results({ searchParams }: { searchParams: SP }) {
  const q = catalogQuerySchema.parse(await searchParams);
  const [{ items, total, pages }, facets] = await Promise.all([listProducts(q), catalogFacets(q)]);

  const chips: { label: string; href: string }[] = [];
  if (q.q) chips.push({ label: `«${q.q}»`, href: hrefWith(q, { q: undefined, pagina: 1 }) });
  if (q.linea) chips.push({ label: LINE_TITLE[q.linea], href: hrefWith(q, { linea: undefined, pagina: 1 }) });
  if (q.genero) chips.push({ label: GENDER_TITLE[q.genero], href: hrefWith(q, { genero: undefined, pagina: 1 }) });
  if (q.formato) chips.push({ label: q.formato === "decant" ? "Decants" : "Frasco original", href: hrefWith(q, { formato: undefined, pagina: 1 }) });
  const range = PRICE_RANGES.find((r) => r.min === q.min && r.max === q.max);
  if (q.min != null || q.max != null) chips.push({ label: range?.label ?? "Precio", href: hrefWith(q, { min: undefined, max: undefined, pagina: 1 }) });
  for (const m of q.marca ?? []) {
    const b = facets.brands.find((x) => x.slug === m);
    chips.push({ label: b?.name ?? m, href: hrefWith(q, { marca: (q.marca ?? []).filter((x) => x !== m), pagina: 1 }) });
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
      <div className="flex flex-wrap items-center justify-between gap-3 lg:block">
        <CatalogFilters brands={facets.brands} />
        <div className="lg:hidden">
          <SortSelect />
        </div>
      </div>
      <div className="min-w-0">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
          <p className="text-sm text-muted" aria-live="polite">
            {total === 1 ? "1 perfume" : `${total} perfumes`}
          </p>
          <div className="hidden lg:block">
            <SortSelect />
          </div>
        </div>
        {chips.length ? (
          <div className="mb-8 flex flex-wrap items-center gap-2">
            {chips.map((c) => (
              <Link key={c.label} href={c.href} scroll={false} className="inline-flex items-center gap-2 border border-line bg-paper px-3 py-1.5 text-xs" aria-label={`Quitar filtro ${c.label}`}>
                {c.label} <IconClose size={12} />
              </Link>
            ))}
            <Link href="/tienda" scroll={false} className="ml-1 text-xs font-semibold uppercase tracking-[0.14em] text-gold">
              Limpiar todo
            </Link>
          </div>
        ) : null}
        {items.length ? (
          <ProductGrid items={items} priorityCount={4} />
        ) : (
          <div className="flex flex-col items-start gap-4 border border-dashed border-line p-10">
            <h2 className="text-3xl">No encontramos perfumes con esos filtros</h2>
            <p className="max-w-[56ch] text-muted">
              Prueba quitando algún filtro, busca por la marca (por ejemplo «Lattafa» o «Armaf») o escríbenos: si no lo tenemos publicado, te ayudamos a conseguirlo.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/tienda" className="bg-ink px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-ivory">
                Ver todo el catálogo
              </Link>
              <a href={whatsappLink(`Hola Perfupox, busco ${q.q ? `«${q.q}»` : "un perfume"} y no lo encontré en la tienda.`)} target="_blank" rel="noopener noreferrer" className="border border-ink px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                Preguntar por WhatsApp
              </a>
            </div>
          </div>
        )}
        {pages > 1 ? (
          <nav aria-label="Páginas" className="mt-16 flex flex-wrap items-center justify-center gap-2">
            {q.pagina > 1 ? (
              <Link href={hrefWith(q, { pagina: q.pagina - 1 })} className="border border-line px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em]">
                Anterior
              </Link>
            ) : null}
            {Array.from({ length: pages }, (_, i) => i + 1)
              .filter((n) => n === 1 || n === pages || Math.abs(n - q.pagina) <= 1)
              .map((n, i, arr) => (
                <span key={n} className="flex items-center gap-2">
                  {i > 0 && n - arr[i - 1] > 1 ? <span className="text-muted">…</span> : null}
                  <Link
                    href={hrefWith(q, { pagina: n })}
                    aria-current={n === q.pagina ? "page" : undefined}
                    className={`grid h-10 min-w-10 place-items-center border px-2 text-sm tabular-nums ${n === q.pagina ? "border-ink bg-ink text-ivory" : "border-line"}`}
                  >
                    {n}
                  </Link>
                </span>
              ))}
            {q.pagina < pages ? (
              <Link href={hrefWith(q, { pagina: q.pagina + 1 })} className="border border-line px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em]">
                Siguiente
              </Link>
            ) : null}
          </nav>
        ) : null}
      </div>
    </div>
  );
}

async function Heading({ searchParams }: { searchParams: SP }) {
  const q = catalogQuerySchema.parse(await searchParams);
  return (
    <>
      <h1 className="mt-3 text-[clamp(36px,5vw,64px)] leading-[1.02]">{titleFor(q)}</h1>
      {q.linea === "preparada" ? (
        <p className="mt-4 max-w-[70ch] text-muted">
          Línea propia de Perfupox, preparada en el local. Cada referencia indica el perfume en el que se inspira; no es el producto original ni está afiliada a esas marcas.
        </p>
      ) : q.formato === "decant" ? (
        <p className="mt-4 max-w-[70ch] text-muted">Muestras de 5 y 10 ml extraídas del frasco original, para probarlo en tu piel antes de comprar el frasco completo.</p>
      ) : null}
    </>
  );
}

export default function CatalogPage({ searchParams }: { searchParams: SP }) {
  return (
    <div className="mx-auto max-w-[1320px] pb-24 pl-[max(20px,env(safe-area-inset-left,0px))] pr-[max(20px,env(safe-area-inset-right,0px))] pt-10">
      <nav aria-label="Migas de pan" className="text-xs text-muted">
        <Link href="/" className="hover:text-gold">Inicio</Link> <span aria-hidden>/</span> <span aria-current="page">Tienda</span>
      </nav>
      <header className="mb-10">
        <Suspense fallback={<h1 className="mt-3 text-[clamp(36px,5vw,64px)] leading-[1.02]">Tienda</h1>}>
          <Heading searchParams={searchParams} />
        </Suspense>
      </header>
      <Suspense fallback={<div className="grid gap-10 lg:grid-cols-[240px_1fr]"><div className="hidden h-96 animate-pulse bg-paper lg:block" /><ProductGridSkeleton count={8} /></div>}>
        <Results searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
