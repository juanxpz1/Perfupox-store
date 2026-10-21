"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { IconBag, IconCard, IconQr, IconWhatsapp } from "@/components/icons";
import { formatCop } from "@/lib/money";
import { whatsappLink } from "@/lib/whatsapp";
import { shop } from "@/modules/cart/client-store";
import { DECANT_IMAGE, GENDER_LABELS, LINE_LABELS, preparadaBottle, type ProductDetail, type VariantView } from "@/modules/catalog/types";
import { FavoriteButton } from "./favorite-button";
import { useRouter } from "next/navigation";

const KIND_TITLE = { FRASCO: "Frasco original", DECANT: "Decant", PREPARADO: "Tamaño" } as const;

function variantImage(p: ProductDetail, v: VariantView | undefined) {
  if (p.line === "PREPARADA") return { url: preparadaBottle(v?.sizeMl), alt: `Frasco Perfupox de ${v?.sizeMl ?? 100} ml` };
  if (v?.kind === "DECANT") return { url: DECANT_IMAGE, alt: `Atomizador de decant de ${v.sizeMl} ml` };
  return p.images[0] ?? { url: preparadaBottle(100), alt: p.name };
}

export function ProductView({ p }: { p: ProductDetail }) {
  const router = useRouter();
  const isPrep = p.line === "PREPARADA";
  const firstAvailable = p.variants.find((v) => v.available) ?? p.variants[0];
  const [variantId, setVariantId] = useState(firstAvailable?.id);
  const [qty, setQty] = useState(1);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const stage = useRef<HTMLButtonElement>(null);
  const v = p.variants.find((x) => x.id === variantId);
  const img = variantImage(p, v);
  const maxQty = v?.lowStock ?? 10;

  const groups = useMemo(() => {
    const g = new Map<string, VariantView[]>();
    for (const x of p.variants) g.set(x.kind, [...(g.get(x.kind) ?? []), x]);
    return [...g.entries()];
  }, [p.variants]);

  const add = (go: boolean) => {
    if (!v?.available) return;
    shop.add(v.id, qty);
    if (go) {
      shop.dismissAdded();
      router.push("/bolsa");
    }
  };

  const waMsg = `Hola Perfupox, me interesa ${isPrep ? `la preparada inspirada en ${p.inspiredBy} (${p.inspiredByHouse})` : `${p.name} de ${p.brandName}`}${v ? `, ${v.label ?? ""}` : ""}. ¿Está disponible?`;

  return (
    <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
      <div className="lg:sticky lg:top-[150px] lg:self-start">
        <button
          ref={stage}
          type="button"
          aria-label={zoom ? "Reducir imagen" : "Ampliar imagen"}
          onClick={() => setZoom((z) => !z)}
          onPointerMove={(e) => {
            const r = stage.current!.getBoundingClientRect();
            setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
          }}
          className={`relative block aspect-[4/5] w-full overflow-hidden rounded-brand ${isPrep || v?.kind === "DECANT" ? "bg-night" : "bg-white"} ${zoom ? "cursor-zoom-out" : "cursor-zoom-in"}`}
        >
          {isPrep || v?.kind === "DECANT" ? <span className="absolute inset-0 bg-[radial-gradient(circle_at_50%_80%,rgba(201,168,106,.3),transparent_60%)]" /> : null}
          <span className="absolute inset-0 transition-transform duration-500 ease-out" style={{ transform: zoom ? "scale(2)" : "none", transformOrigin: origin }}>
            <Image
              key={img.url}
              src={img.url}
              alt={img.alt}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 55vw"
              className={`object-contain animate-[pfx-fade_.5s_ease-out] ${isPrep || v?.kind === "DECANT" ? "px-[28%] py-[12%]" : "p-[8%]"}`}
            />
          </span>
          <span className="absolute bottom-3 left-3 bg-ivory/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">{zoom ? "Toca para reducir" : "Toca para ampliar"}</span>
        </button>
        {!isPrep && p.hasDecants ? (
          <div className="mt-3 grid grid-cols-4 gap-2">
            {p.variants
              .filter((x, i, arr) => arr.findIndex((y) => y.kind === x.kind) === i)
              .map((x) => {
                const im = variantImage(p, x);
                const on = v?.kind === x.kind;
                return (
                  <button
                    key={x.kind}
                    type="button"
                    onClick={() => setVariantId((p.variants.find((y) => y.kind === x.kind && y.available) ?? x).id)}
                    aria-label={`Ver ${KIND_TITLE[x.kind].toLowerCase()}`}
                    className={`relative aspect-[4/5] border ${on ? "border-ink" : "border-transparent"} ${x.kind === "DECANT" ? "bg-night" : "bg-white"}`}
                  >
                    <Image src={im.url} alt="" fill sizes="80px" className="object-contain p-2" />
                  </button>
                );
              })}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
            {isPrep ? "Perfumería preparada Perfupox" : `${p.brandName} · ${LINE_LABELS[p.line]}`}
          </p>
          {isPrep ? <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-muted">Inspirado en</p> : null}
          <h1 className={`${isPrep ? "mt-1" : "mt-3"} text-[clamp(36px,4.4vw,58px)] leading-[1.02]`}>{isPrep ? p.inspiredBy : p.name}</h1>
          <p className="mt-3 text-muted">
            {isPrep ? `Referencia: ${p.inspiredByHouse}` : "Perfume original"} · {GENDER_LABELS[p.gender]}
          </p>
        </div>

        {v ? (
          <p className="font-display text-4xl font-semibold tabular-nums tracking-tight">
            {formatCop(v.price)}
            {v.compareAtPrice && v.compareAtPrice > v.price ? <s className="ml-3 text-xl font-normal text-muted">{formatCop(v.compareAtPrice)}</s> : null}
          </p>
        ) : null}

        {groups.map(([kind, vs]) => (
          <fieldset key={kind}>
            <legend className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em]">{kind === "DECANT" ? "Decant · muestra del original" : KIND_TITLE[kind as keyof typeof KIND_TITLE]}</legend>
            <div className="flex flex-wrap gap-2">
              {vs.map((x) => (
                <button
                  key={x.id}
                  type="button"
                  aria-pressed={x.id === variantId}
                  disabled={!x.available}
                  onClick={() => {
                    setVariantId(x.id);
                    setQty(1);
                  }}
                  className={`min-w-[104px] border px-4 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    x.id === variantId ? "border-ink shadow-[inset_0_0_0_1px_var(--ink)]" : "border-line bg-paper hover:border-muted"
                  }`}
                >
                  <span className="block text-sm font-medium">{x.kind === "FRASCO" ? (x.sizeMl ? `${x.sizeMl} ml` : "Frasco completo") : x.label}</span>
                  <span className="block text-xs tabular-nums text-muted">{x.available ? formatCop(x.price) : "Agotado"}</span>
                </button>
              ))}
            </div>
          </fieldset>
        ))}

        <p className="flex items-center gap-2.5 text-sm" role="status">
          <span className={`h-2 w-2 rounded-full ${v?.available ? (v.lowStock != null ? "bg-warn" : "bg-ok") : "bg-muted"}`} />
          {!v?.available ? "No disponible por ahora" : v.lowStock != null ? `Últimas ${v.lowStock} unidades` : isPrep ? "Disponible · se prepara para tu pedido" : "Disponible"}
        </p>

        <div className="grid grid-cols-[auto_1fr_auto] gap-2">
          <div className="flex items-center border border-line" role="group" aria-label="Cantidad">
            <button type="button" className="h-[52px] w-11 text-lg" aria-label="Quitar una unidad" onClick={() => setQty((q) => Math.max(1, q - 1))}>
              −
            </button>
            <output className="w-8 text-center tabular-nums" aria-live="polite">{qty}</output>
            <button type="button" className="h-[52px] w-11 text-lg" aria-label="Agregar una unidad" onClick={() => setQty((q) => Math.min(maxQty, q + 1))}>
              +
            </button>
          </div>
          <button
            type="button"
            disabled={!v?.available}
            onClick={() => add(false)}
            className="flex items-center justify-center gap-2 bg-ink px-4 text-xs font-semibold uppercase tracking-[0.18em] text-ivory transition-colors hover:bg-gold hover:text-night disabled:opacity-40"
          >
            <IconBag size={18} /> Agregar a la bolsa
          </button>
          <FavoriteButton slug={p.slug} name={p.name} large />
        </div>
        <button type="button" disabled={!v?.available} onClick={() => add(true)} className="border border-ink py-4 text-xs font-semibold uppercase tracking-[0.18em] transition-colors hover:bg-ink hover:text-ivory disabled:opacity-40">
          Comprar ahora
        </button>
        <a href={whatsappLink(waMsg)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 text-sm font-medium text-muted underline-offset-4 hover:text-ink hover:underline">
          <IconWhatsapp size={18} /> Preguntar por este perfume
        </a>

        <ul className="grid gap-px border border-line bg-line sm:grid-cols-2">
          <li className="flex gap-3 bg-ivory p-4 text-sm">
            <IconQr size={22} className="shrink-0 text-gold" />
            <span><b className="font-semibold">Transferencia con QR.</b> Confirmamos tu pedido al verificar el pago.</span>
          </li>
          <li className="flex gap-3 bg-ivory p-4 text-sm">
            <IconCard size={22} className="shrink-0 text-gold" />
            <span><b className="font-semibold">A cuotas con Addi.</b> Aprobación y cuotas las define Addi.</span>
          </li>
        </ul>

        {isPrep ? (
          <p className="border-l-2 border-gold bg-paper p-4 text-sm text-muted">
            Perfume preparado por Perfupox con esencias de alta concentración, inspirado en el perfil olfativo de {p.inspiredBy} de {p.inspiredByHouse}. No es el producto original ni está afiliado a esa marca.
          </p>
        ) : null}
      </div>
    </div>
  );
}
