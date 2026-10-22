import Image from "next/image";
import Link from "next/link";
import { formatCop } from "@/lib/money";
import { GENDER_LABELS, LINE_LABELS, preparadaBottle, type ProductCard as Card } from "@/modules/catalog/types";
import { FavoriteButton } from "./favorite-button";

/** Tarjeta de producto. La preparada muestra la foto del perfume de referencia con una franja que la identifica como preparada. */
export function ProductCard({ p, priority = false }: { p: Card; priority?: boolean }) {
  const isPrep = p.line === "PREPARADA";
  return (
    <article className="group relative flex min-w-0 flex-col gap-3">
      <Link
        href={`/perfume/${p.slug}`}
        className="relative block aspect-[4/5] overflow-hidden rounded-brand bg-white"
        aria-label={`${p.name}${isPrep ? `, referencia ${p.inspiredByHouse}` : ` de ${p.brandName}`}`}
      >
        {isPrep && p.imageUrl ? (
          <>
            <Image
              src={p.imageUrl}
              alt={p.imageAlt ?? `Referencia: ${p.inspiredBy}`}
              fill
              priority={priority}
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 22vw"
              className="object-contain p-[9%] pb-[16%] transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            />
            <span className="absolute inset-x-0 bottom-0 truncate bg-night/90 px-2 py-1.5 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-gold-2">
              Preparada Perfupox
            </span>
          </>
        ) : isPrep ? (
          <Image src={preparadaBottle(100)} alt="" fill sizes="22vw" className="object-contain px-[28%] py-[8%]" />
        ) : p.imageUrl ? (
          <Image
            src={p.imageUrl}
            alt={p.imageAlt ?? p.name}
            fill
            priority={priority}
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 22vw"
            className="object-contain p-[9%] transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        ) : null}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {!p.available ? (
            <span className="bg-ink px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ivory">Agotado</span>
          ) : p.isNew ? (
            <span className="border border-line bg-ivory px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink">Nuevo</span>
          ) : null}
          {p.hasDecants && !isPrep ? (
            <span className="border border-gold/60 bg-ivory/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink">Decants</span>
          ) : null}
        </div>
      </Link>
      <FavoriteButton slug={p.slug} name={p.name} className="absolute right-2 top-2" />
      <Link href={`/perfume/${p.slug}`} className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
          {isPrep ? `Ref. ${p.inspiredByHouse}` : p.brandName}
        </span>
        <h3 className="line-clamp-2 text-[17px] leading-snug">{isPrep ? p.inspiredBy : p.name}</h3>
        <span className="text-xs text-muted">
          {isPrep ? LINE_LABELS.PREPARADA : `${LINE_LABELS[p.line]} · Original`} · {GENDER_LABELS[p.gender]}
        </span>
        <span className="mt-1 text-[15px] font-semibold tabular-nums">
          {p.priceFrom == null ? (
            <span className="font-normal text-muted">No disponible por ahora</span>
          ) : isPrep ? (
            <>
              <span className="text-xs font-normal text-muted">Desde </span>
              {formatCop(p.priceFrom)}
            </>
          ) : p.bottlePrice != null ? (
            <>
              {formatCop(p.bottlePrice)}
              {p.compareAtPrice && p.compareAtPrice > p.bottlePrice ? <s className="ml-2 text-xs font-normal text-muted">{formatCop(p.compareAtPrice)}</s> : null}
            </>
          ) : (
            <span className="font-normal text-muted">Frasco agotado</span>
          )}
        </span>
        {!isPrep && p.hasDecants && p.priceFrom != null ? (
          <span className="text-xs tabular-nums text-muted">Decant desde {formatCop(p.priceFrom)}</span>
        ) : null}
      </Link>
    </article>
  );
}

export function ProductGrid({ items, priorityCount = 0 }: { items: Card[]; priorityCount?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((p, i) => (
        <ProductCard key={p.id} p={p} priority={i < priorityCount} />
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4" aria-busy="true" aria-label="Cargando perfumes">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex flex-col gap-3">
          <div className="aspect-[4/5] animate-pulse rounded-brand bg-paper" />
          <div className="h-3 w-1/3 animate-pulse bg-paper" />
          <div className="h-4 w-2/3 animate-pulse bg-paper" />
          <div className="h-4 w-1/4 animate-pulse bg-paper" />
        </div>
      ))}
    </div>
  );
}
