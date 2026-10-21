"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { IconCheck, IconClose } from "@/components/icons";
import { formatCop } from "@/lib/money";
import { shop, useShop } from "@/modules/cart/client-store";
import { preparadaBottle } from "@/modules/catalog/types";

type Info = { productName: string; label: string | null; price: number; imageUrl: string | null; line: string; sizeMl: number | null };

/** Confirmación al agregar a la bolsa, sin sacar al cliente de la página. */
export function AddedSheet() {
  const { lastAdded } = useShop();
  const [info, setInfo] = useState<Info | null>(null);
  useEffect(() => {
    if (!lastAdded) return;
    let off = false;
    fetch("/api/bolsa", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ variantIds: [lastAdded.variantId] }) })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => !off && d?.variants?.[0] && setInfo(d.variants[0]))
      .catch(() => {});
    const t = setTimeout(() => shop.dismissAdded(), 6000);
    return () => {
      off = true;
      clearTimeout(t);
    };
  }, [lastAdded]);
  const show = Boolean(lastAdded && info);
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed right-[max(16px,env(safe-area-inset-right,0px))] top-[calc(84px+env(safe-area-inset-top,0px))] z-[75] w-[min(370px,calc(100%-32px))] border border-line bg-paper p-5 shadow-2xl transition-all duration-500 ease-[cubic-bezier(.2,.8,.2,1)] ${
        show ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-3 opacity-0"
      }`}
    >
      {info ? (
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-ok">
              <IconCheck size={14} /> Agregado a tu bolsa
            </span>
            <button type="button" aria-label="Cerrar aviso" onClick={() => shop.dismissAdded()} className="grid h-8 w-8 place-items-center">
              <IconClose size={16} />
            </button>
          </div>
          <div className="grid grid-cols-[56px_1fr] items-center gap-4">
            <span className={`relative h-16 w-14 ${info.line === "PREPARADA" ? "bg-night" : "bg-white"}`}>
              <Image src={info.line === "PREPARADA" ? preparadaBottle(info.sizeMl) : (info.imageUrl ?? preparadaBottle(100))} alt="" fill sizes="56px" className="object-contain p-1" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-[17px] font-semibold">{info.productName}</p>
              <p className="text-xs text-muted">
                {info.label} · {formatCop(info.price)}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => shop.dismissAdded()} className="border border-ink px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.16em]">
              Seguir viendo
            </button>
            <Link href="/bolsa" onClick={() => shop.dismissAdded()} className="bg-ink px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-ivory">
              Ver bolsa
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
