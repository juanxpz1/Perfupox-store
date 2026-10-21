import Link from "next/link";
import { Star8 } from "@/components/icons";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-[720px] flex-col items-center gap-5 px-5 py-28 text-center">
      <Star8 size={48} className="text-gold" />
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">Error 404</p>
      <h1 className="text-[clamp(36px,5vw,56px)]">Esta fragancia se evaporó</h1>
      <p className="text-muted">La página que buscas no existe o el perfume ya no está publicado. Busca en el catálogo o vuelve al inicio.</p>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <Link href="/tienda" className="bg-ink px-7 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-ivory">
          Ver catálogo
        </Link>
        <Link href="/" className="border border-ink px-7 py-4 text-xs font-semibold uppercase tracking-[0.2em]">
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
