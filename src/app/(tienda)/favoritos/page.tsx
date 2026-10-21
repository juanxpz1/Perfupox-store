import type { Metadata } from "next";
import { FavoritesView } from "@/components/store/bag-view";

export const metadata: Metadata = { title: "Favoritos", robots: { index: false } };

export default function FavoritesPage() {
  return (
    <div className="mx-auto max-w-[1320px] pb-24 pl-[max(20px,env(safe-area-inset-left,0px))] pr-[max(20px,env(safe-area-inset-right,0px))] pt-12">
      <h1 className="mb-3 text-[clamp(36px,5vw,60px)]">Favoritos</h1>
      <p className="mb-10 text-muted">Se guardan en este navegador.</p>
      <FavoritesView />
    </div>
  );
}
