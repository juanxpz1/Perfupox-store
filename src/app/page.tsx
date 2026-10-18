import Image from "next/image";
import { store } from "@/config/store";

/** Página temporal mientras se construye la tienda pública (Fase 4). */
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-10 bg-night px-6 py-24 text-center text-night-fg">
      <Image src={store.logo.full} alt={`${store.name} ${store.tagline}`} width={296} height={239} priority />
      <div className="flex max-w-xl flex-col gap-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-2">Muy pronto</p>
        <h1 className="text-4xl sm:text-5xl">
          Nuestra tienda en línea <span className="gold-text">está en camino</span>
        </h1>
        <p className="text-night-muted">{store.description}</p>
      </div>
      <a
        href={store.social.instagram}
        target="_blank"
        rel="noopener noreferrer"
        className="border border-night-fg/40 px-7 py-3 text-xs font-semibold uppercase tracking-[0.2em] transition-colors hover:border-gold-2 hover:text-gold-2"
      >
        Síguenos en Instagram
      </a>
    </main>
  );
}
