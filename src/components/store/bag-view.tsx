"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { IconWhatsapp, Star8 } from "@/components/icons";
import { formatCop } from "@/lib/money";
import { whatsappLink } from "@/lib/whatsapp";
import { shop, useShop } from "@/modules/cart/client-store";
import { preparadaBottle, type ProductCard as Card } from "@/modules/catalog/types";
import { ProductGrid } from "./product-card";
import { useHydrated } from "@/lib/use-hydrated";

type Priced = {
  variantId: string;
  sku: string;
  kind: "FRASCO" | "DECANT" | "PREPARADO";
  sizeMl: number | null;
  label: string | null;
  price: number;
  available: boolean;
  maxQty: number;
  productSlug: string;
  productName: string;
  brandName: string;
  line: string;
  inspiredByHouse: string | null;
  imageUrl: string | null;
};

type Loaded = { variants: Priced[]; favorites: Card[] };

/** Consulta precios y datos vigentes al servidor cada vez que cambia el contenido de la bolsa o los favoritos. */
function usePriced(variantIds: string[], favorites: string[]) {
  const key = variantIds.join(",") + "|" + favorites.join(",");
  const [res, setRes] = useState<{ key: string; data: Loaded | null; error: boolean } | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let off = false;
    const [v, f] = key.split("|");
    fetch("/api/bolsa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantIds: v ? v.split(",") : [], favorites: f ? f.split(",") : [] }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: Loaded) => !off && setRes({ key, data: d, error: false }))
      .catch(() => !off && setRes({ key, data: null, error: true }));
    return () => {
      off = true;
    };
  }, [key, attempt]);
  // Mientras llega la respuesta nueva se conservan los últimos datos para que la bolsa no parpadee.
  return { data: res?.data ?? null, error: res?.key === key && res.error, retry: () => setAttempt((x) => x + 1) };
}

export function BagView() {
  const { bag } = useShop();
  const ids = bag.map((l) => l.variantId);
  const { data, error, retry } = usePriced(ids, []);
  const hydrated = useHydrated();
  const [buyer, setBuyer] = useState({ name: "", city: "", notes: "" });

  if (!hydrated) return <div className="h-64 animate-pulse bg-paper" aria-busy="true" />;
  if (!bag.length)
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <Star8 size={40} className="text-gold" />
        <h2 className="text-3xl">Tu bolsa está vacía</h2>
        <p className="max-w-[44ch] text-muted">Explora los perfumes originales, prueba un decant o elige una referencia de nuestra perfumería preparada.</p>
        <Link href="/tienda" className="mt-2 bg-ink px-7 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-ivory">
          Ir a la tienda
        </Link>
      </div>
    );
  if (error)
    return (
      <div className="border border-line p-8">
        <h2 className="text-2xl">No pudimos cargar tu bolsa</h2>
        <p className="mt-2 text-muted">Revisa tu conexión e intenta de nuevo. Tus productos siguen guardados en este navegador.</p>
        <button type="button" onClick={retry} className="mt-5 border border-ink px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
          Reintentar
        </button>
      </div>
    );
  if (!data) return <div className="h-64 animate-pulse bg-paper" aria-busy="true" aria-label="Cargando tu bolsa" />;

  const byId = new Map(data.variants.map((v) => [v.variantId, v]));
  const lines = bag.map((l) => ({ l, v: byId.get(l.variantId) })).filter((x): x is { l: (typeof bag)[number]; v: Priced } => Boolean(x.v));
  const gone = bag.length - lines.length;
  const valid = lines.filter((x) => x.v.available);
  const subtotal = valid.reduce((s, x) => s + x.v.price * Math.min(x.l.qty, x.v.maxQty), 0);
  const message = [
    "Hola Perfupox, quiero hacer este pedido:",
    ...valid.map(({ l, v }) => `• ${Math.min(l.qty, v.maxQty)} × ${v.productName}${v.line === "PREPARADA" ? " (preparada)" : ` – ${v.brandName}`}, ${v.label ?? ""} [${v.sku}] – ${formatCop(v.price * Math.min(l.qty, v.maxQty))}`),
    `Subtotal: ${formatCop(subtotal)}`,
    buyer.name.trim() ? `Nombre: ${buyer.name.trim()}` : null,
    buyer.city.trim() ? `Ciudad: ${buyer.city.trim()}` : null,
    buyer.notes.trim() ? `Nota: ${buyer.notes.trim()}` : null,
    "¿Me confirmas disponibilidad, el valor del envío y la forma de pago?",
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_380px]">
      <div>
        {gone > 0 ? (
          <p className="mb-6 border-l-2 border-warn bg-paper p-4 text-sm">Algunos productos de tu bolsa ya no están publicados y los quitamos del resumen.</p>
        ) : null}
        <ul className="border-t border-line">
          {lines.map(({ l, v }) => {
            const isPrep = v.line === "PREPARADA";
            return (
              <li key={v.variantId} className="grid grid-cols-[84px_1fr] gap-5 border-b border-line py-6 sm:grid-cols-[96px_1fr_auto]">
                <Link href={`/perfume/${v.productSlug}`} className={`relative block aspect-[4/5] ${isPrep || v.kind === "DECANT" ? "bg-night" : "bg-white"}`}>
                  <Image
                    src={isPrep ? preparadaBottle(v.sizeMl) : v.kind === "DECANT" ? "/products/preparada/decant.webp" : (v.imageUrl ?? preparadaBottle(100))}
                    alt=""
                    fill
                    sizes="96px"
                    className="object-contain p-2"
                  />
                </Link>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{isPrep ? `Preparada · Ref. ${v.inspiredByHouse}` : v.brandName}</p>
                  <Link href={`/perfume/${v.productSlug}`} className="mt-1 block font-display text-xl font-semibold leading-tight">
                    {v.productName}
                  </Link>
                  <p className="mt-1 text-sm text-muted">
                    {v.label} · {formatCop(v.price)} c/u
                  </p>
                  {!v.available ? <p className="mt-2 text-sm font-medium text-danger">No disponible por ahora</p> : null}
                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex items-center border border-line" role="group" aria-label={`Cantidad de ${v.productName}`}>
                      <button type="button" className="h-10 w-10" aria-label="Quitar una unidad" onClick={() => shop.setQty(v.variantId, l.qty - 1)}>
                        −
                      </button>
                      <span className="w-7 text-center text-sm tabular-nums">{Math.min(l.qty, v.maxQty)}</span>
                      <button type="button" className="h-10 w-10 disabled:opacity-30" aria-label="Agregar una unidad" disabled={l.qty >= v.maxQty} onClick={() => shop.setQty(v.variantId, l.qty + 1)}>
                        +
                      </button>
                    </div>
                    <button type="button" onClick={() => shop.remove(v.variantId)} className="text-xs uppercase tracking-[0.14em] text-muted underline underline-offset-4">
                      Quitar
                    </button>
                  </div>
                </div>
                <p className="col-start-2 font-semibold tabular-nums sm:col-start-3 sm:text-right">{v.available ? formatCop(v.price * Math.min(l.qty, v.maxQty)) : "—"}</p>
              </li>
            );
          })}
        </ul>
      </div>
      <aside className="h-fit border border-line bg-paper p-6 lg:sticky lg:top-[150px]" aria-label="Resumen">
        <h2 className="text-2xl">Resumen</h2>
        <dl className="mt-6 grid gap-3 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd className="font-semibold tabular-nums">{formatCop(subtotal)}</dd>
          </div>
          <div className="flex justify-between text-muted">
            <dt>Envío</dt>
            <dd>Según tu ciudad</dd>
          </div>
        </dl>
        <fieldset className="mt-6 grid gap-3 border-t border-line pt-5">
          <legend className="sr-only">Tus datos (opcionales)</legend>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Agiliza tu pedido (opcional)</p>
          {(
            [
              ["name", "Tu nombre", "text", "name", 60],
              ["city", "Ciudad de entrega", "text", "address-level2", 60],
            ] as const
          ).map(([k, label, type, ac, max]) => (
            <label key={k} className="grid gap-1 text-xs">
              <span className="font-medium text-ink">{label}</span>
              <input
                id={`bolsa-${k}`}
                type={type}
                autoComplete={ac}
                maxLength={max}
                value={buyer[k]}
                onChange={(e) => setBuyer((b) => ({ ...b, [k]: e.target.value }))}
                className="border border-line bg-ivory px-3 py-2.5 text-sm text-ink outline-none focus:border-gold"
              />
            </label>
          ))}
          <label className="grid gap-1 text-xs">
            <span className="font-medium text-ink">Nota para la tienda</span>
            <textarea
              id="bolsa-notes"
              rows={2}
              maxLength={200}
              value={buyer.notes}
              onChange={(e) => setBuyer((b) => ({ ...b, notes: e.target.value }))}
              placeholder="Por ejemplo: es para regalo"
              className="resize-none border border-line bg-ivory px-3 py-2.5 text-sm text-ink outline-none focus:border-gold"
            />
          </label>
        </fieldset>
        <a
          href={whatsappLink(message)}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!valid.length}
          className={`mt-6 flex items-center justify-center gap-2 bg-ink py-4 text-xs font-semibold uppercase tracking-[0.18em] text-ivory transition-colors hover:bg-gold hover:text-night ${valid.length ? "" : "pointer-events-none opacity-40"}`}
        >
          <IconWhatsapp size={18} /> Pedir por WhatsApp
        </a>
        <p className="mt-4 text-xs text-muted">
          Se abre WhatsApp con tu pedido listo para enviar. Allí te confirmamos disponibilidad, el valor del envío y la forma de pago: transferencia o a cuotas con Addi.
        </p>
      </aside>
    </div>
  );
}

export function FavoritesView() {
  const { favorites } = useShop();
  const { data, error } = usePriced([], favorites);
  const hydrated = useHydrated();
  if (!hydrated || (!data && !error && favorites.length)) return <div className="h-64 animate-pulse bg-paper" aria-busy="true" />;
  if (!favorites.length || (data && !data.favorites.length))
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <Star8 size={40} className="text-gold" />
        <h2 className="text-3xl">Aún no tienes favoritos</h2>
        <p className="max-w-[44ch] text-muted">Toca el corazón en cualquier perfume para guardarlo aquí y compararlo después.</p>
        <Link href="/tienda" className="mt-2 bg-ink px-7 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-ivory">
          Explorar perfumes
        </Link>
      </div>
    );
  if (error) return <p className="text-muted">No pudimos cargar tus favoritos. Revisa tu conexión e intenta de nuevo.</p>;
  return <ProductGrid items={data!.favorites} />;
}
