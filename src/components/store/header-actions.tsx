"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { IconBag, IconHeart } from "@/components/icons";
import { useShop } from "@/modules/cart/client-store";

function Count({ n }: { n: number }) {
  const [bump, setBump] = useState(false);
  const prev = useRef(n);
  useEffect(() => {
    if (n > prev.current) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 500);
      prev.current = n;
      return () => clearTimeout(t);
    }
    prev.current = n;
  }, [n]);
  if (!n) return null;
  return (
    <span className={`absolute right-0.5 top-1 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-ink px-1 text-[10px] font-semibold tabular-nums text-ivory transition-transform ${bump ? "scale-125" : ""}`}>
      {n}
    </span>
  );
}

export function HeaderActions() {
  const { bag, favorites } = useShop();
  const items = bag.reduce((s, l) => s + l.qty, 0);
  return (
    <div className="flex items-center justify-end gap-1">
      <Link href="/favoritos" className="relative grid h-11 w-11 place-items-center rounded-full transition-colors hover:bg-gold/10" aria-label={`Favoritos${favorites.length ? `, ${favorites.length}` : ""}`}>
        <IconHeart />
        <Count n={favorites.length} />
      </Link>
      <Link href="/bolsa" className="relative grid h-11 w-11 place-items-center rounded-full transition-colors hover:bg-gold/10" aria-label={`Bolsa de compra${items ? `, ${items} productos` : ""}`}>
        <IconBag />
        <Count n={items} />
      </Link>
    </div>
  );
}
