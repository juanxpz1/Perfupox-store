"use client";

import { shop, useShop } from "@/modules/cart/client-store";
import { IconHeart } from "@/components/icons";
import { toast } from "./toaster";

export function FavoriteButton({ slug, name, className = "", large = false }: { slug: string; name: string; className?: string; large?: boolean }) {
  const { favorites } = useShop();
  const on = favorites.includes(slug);
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? `Quitar ${name} de favoritos` : `Guardar ${name} en favoritos`}
      onClick={() => toast(shop.toggleFavorite(slug) ? "Guardado en favoritos" : "Quitado de favoritos")}
      className={`grid place-items-center rounded-full transition-transform hover:scale-110 active:scale-95 ${
        large ? "h-[52px] w-[52px] rounded-brand border border-line" : "h-10 w-10 bg-ivory/80 backdrop-blur"
      } ${className}`}
    >
      <IconHeart size={large ? 22 : 18} className={on ? "fill-gold stroke-gold" : ""} />
    </button>
  );
}
