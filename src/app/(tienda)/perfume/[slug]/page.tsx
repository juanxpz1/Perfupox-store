import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductView } from "@/components/store/product-view";
import { ProductGrid, ProductGridSkeleton } from "@/components/store/product-card";
import { activeShippingZones, getProduct, relatedProducts } from "@/modules/catalog/queries";
import { CONCENTRATION_LABELS, GENDER_LABELS, LINE_LABELS, LINE_SLUGS, preparadaBottle, type ProductDetail } from "@/modules/catalog/types";
import { formatCop } from "@/lib/money";
import { store } from "@/config/store";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return { title: "Perfume no encontrado" };
  const isPrep = p.line === "PREPARADA";
  const title = isPrep ? `Preparada inspirada en ${p.inspiredBy}` : `${p.name} de ${p.brandName}, original`;
  const description = isPrep
    ? `Perfumería preparada Perfupox inspirada en ${p.inspiredBy} (${p.inspiredByHouse}). Desde ${p.priceFrom ? formatCop(p.priceFrom) : ""}.`
    : `${p.name} de ${p.brandName}, perfume original${p.hasDecants ? " también en decant de 5 y 10 ml" : ""}. ${p.priceFrom ? `Desde ${formatCop(p.priceFrom)}.` : ""}`;
  const image = isPrep ? preparadaBottle(100) : p.images[0]?.url;
  return {
    title,
    description,
    alternates: { canonical: `/perfume/${p.slug}` },
    openGraph: { title, description, images: image ? [{ url: image }] : undefined, type: "website" },
  };
}

/** Datos estructurados solo con información real: precio y disponibilidad vigentes; sin reseñas inventadas. */
function JsonLd({ p }: { p: ProductDetail }) {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  const isPrep = p.line === "PREPARADA";
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: isPrep ? `Perfume preparado inspirado en ${p.inspiredBy}` : p.name,
    brand: { "@type": "Brand", name: isPrep ? store.name : p.brandName },
    image: [`${base}${isPrep ? preparadaBottle(100) : (p.images[0]?.url ?? "")}`],
    sku: p.variants[0]?.sku,
    offers: p.variants.map((v) => ({
      "@type": "Offer",
      sku: v.sku,
      name: v.label ?? undefined,
      price: v.price,
      priceCurrency: "COP",
      availability: v.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      url: `${base}/perfume/${p.slug}`,
    })),
  };
  const crumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: `${base}/` },
      { "@type": "ListItem", position: 2, name: LINE_LABELS[p.line], item: `${base}/tienda?linea=${LINE_SLUGS[p.line]}` },
      { "@type": "ListItem", position: 3, name: isPrep ? p.inspiredBy : p.name },
    ],
  };
  const json = (o: unknown) => JSON.stringify(o).replace(/</g, "\\u003c");
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json(data) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json(crumbs) }} />
    </>
  );
}

async function Shipping() {
  const zones = await activeShippingZones();
  if (!zones.length) return <p>Coordinamos el envío contigo por WhatsApp según tu ciudad. Las tarifas por zona se publicarán aquí.</p>;
  return (
    <ul className="grid gap-2">
      {zones.map((z) => (
        <li key={z.name} className="flex flex-wrap justify-between gap-2 border-b border-dashed border-line pb-2">
          <span>{z.name}</span>
          <span className="tabular-nums text-ink">
            {formatCop(z.price)} · {z.minDays === z.maxDays ? `${z.minDays}` : `${z.minDays} a ${z.maxDays}`} días hábiles
          </span>
        </li>
      ))}
    </ul>
  );
}

async function Related({ p }: { p: ProductDetail }) {
  const items = await relatedProducts(p, 4);
  if (!items.length) return null;
  return (
    <section aria-labelledby="relacionados" className="mt-24">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">Si te gusta este</p>
      <h2 id="relacionados" className="mb-10 mt-3 text-[clamp(30px,3.6vw,46px)]">
        {p.line === "PREPARADA" ? "Otras referencias de la casa" : `Más de ${LINE_LABELS[p.line].toLowerCase()}`}
      </h2>
      <ProductGrid items={items} />
    </section>
  );
}

async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) notFound();
  const isPrep = p.line === "PREPARADA";
  const hasNotes = p.topNotes.length + p.heartNotes.length + p.baseNotes.length > 0;
  const specs: [string, string][] = [
    ["Línea", isPrep ? "Perfumería preparada Perfupox" : `${LINE_LABELS[p.line]} · original`],
    ...(isPrep ? ([["Inspirado en", `${p.inspiredBy} · ${p.inspiredByHouse}`]] as [string, string][]) : ([["Marca", p.brandName]] as [string, string][])),
    ["Público", GENDER_LABELS[p.gender]],
    ...(p.concentration ? ([["Concentración", CONCENTRATION_LABELS[p.concentration] ?? p.concentration]] as [string, string][]) : []),
    ...(p.familyName ? ([["Familia olfativa", p.familyName]] as [string, string][]) : []),
    ...(p.countryOfOrigin ? ([["Origen", p.countryOfOrigin]] as [string, string][]) : []),
    ["Referencia", p.variants.map((v) => v.sku).join(", ")],
  ];

  return (
    <>
      <JsonLd p={p} />
      <nav aria-label="Migas de pan" className="py-6 text-xs text-muted">
        <Link href="/" className="hover:text-gold">Inicio</Link> <span aria-hidden>/</span>{" "}
        <Link href={`/tienda?linea=${LINE_SLUGS[p.line]}`} className="hover:text-gold">{LINE_LABELS[p.line]}</Link> <span aria-hidden>/</span>{" "}
        <span aria-current="page">{isPrep ? p.inspiredBy : p.name}</span>
      </nav>
      <ProductView p={p} />

      <div className="mt-16 grid gap-0 border-t border-line lg:ml-auto lg:w-[calc(50%-2rem)]">
        {[
          {
            t: "Notas olfativas",
            open: true,
            c: hasNotes ? (
              <dl className="grid">
                {[["Salida", p.topNotes], ["Corazón", p.heartNotes], ["Fondo", p.baseNotes]].map(([k, v]) => (
                  <div key={k as string} className="grid grid-cols-[90px_1fr] gap-4 border-b border-dashed border-line py-3 last:border-0">
                    <dt className="pt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">{k as string}</dt>
                    <dd className="text-[17px] text-ink">{(v as string[]).join(", ") || "—"}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p>Estamos completando las notas de este perfume. Si quieres saber cómo huele, escríbenos y te contamos.</p>
            ),
          },
          { t: "Descripción", c: <p>{p.description || p.shortDescription || (isPrep ? `Perfume preparado en el local, inspirado en ${p.inspiredBy}. Elige el tamaño que prefieras.` : `${p.name} de ${p.brandName}, perfume original.`)}</p> },
          {
            t: "Detalles",
            c: (
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
                {specs.map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt>{k}</dt>
                    <dd className="break-words text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
            ),
          },
          {
            t: "Envíos",
            c: (
              <Suspense fallback={<p>Cargando zonas de envío…</p>}>
                <Shipping />
              </Suspense>
            ),
          },
          { t: "Pedido, pago y cambios", c: <p>Agrega el perfume a tu bolsa y envía el pedido por WhatsApp. Allí confirmamos disponibilidad, valor del envío y forma de pago (transferencia o a cuotas con Addi). Las condiciones de cambios y devoluciones se publicarán con los términos de la tienda.</p> },
        ].map((s) => (
          <details key={s.t} open={s.open} className="group border-b border-line">
            <summary className="flex cursor-pointer list-none items-center justify-between py-5 text-xs font-semibold uppercase tracking-[0.2em] [&::-webkit-details-marker]:hidden">
              {s.t}
              <span className="text-lg font-light transition-transform group-open:rotate-45" aria-hidden>+</span>
            </summary>
            <div className="pb-6 text-sm text-muted">{s.c}</div>
          </details>
        ))}
      </div>

      <Suspense fallback={<div className="mt-24"><ProductGridSkeleton count={4} /></div>}>
        <Related p={p} />
      </Suspense>
    </>
  );
}

export default function Page({ params }: { params: Params }) {
  return (
    <div className="mx-auto max-w-[1320px] pb-24 pl-[max(20px,env(safe-area-inset-left,0px))] pr-[max(20px,env(safe-area-inset-right,0px))]">
      <Suspense
        fallback={
          <div className="grid gap-10 pt-16 lg:grid-cols-[1.1fr_1fr]">
            <div className="aspect-[4/5] animate-pulse rounded-brand bg-paper" />
            <div className="flex flex-col gap-4">
              <div className="h-4 w-1/3 animate-pulse bg-paper" />
              <div className="h-14 w-3/4 animate-pulse bg-paper" />
              <div className="h-10 w-1/4 animate-pulse bg-paper" />
            </div>
          </div>
        }
      >
        <ProductPage params={params} />
      </Suspense>
    </div>
  );
}
