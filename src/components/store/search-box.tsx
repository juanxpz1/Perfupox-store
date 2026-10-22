"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { IconSearch } from "@/components/icons";
import { formatCop } from "@/lib/money";
import { preparadaBottle } from "@/modules/catalog/types";

type Hit = { slug: string; name: string; brandName: string; line: string; inspiredByHouse: string | null; imageUrl: string | null; priceFrom: number | null };

/** Buscador con autocompletado accesible (combobox). Enter sin selección lleva al catálogo filtrado. */
export function SearchBox({ className = "", autoFocus = false, onNavigate }: { className?: string; autoFocus?: boolean; onNavigate?: () => void }) {
  const router = useRouter();
  const listId = useId();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState(-1);
  const [loading, setLoading] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const tooShort = q.trim().length < 2;

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/buscar?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        if (res.ok) {
          setHits((await res.json()).items);
          setOpen(true);
          setSel(-1);
        }
      } catch {
        // búsqueda cancelada o sin conexión: se conserva el último resultado
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    setQ("");
    onNavigate?.();
    router.push(href);
  };

  return (
    <div ref={box} className={`relative ${className}`}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (sel >= 0 && hits[sel]) go(`/perfume/${hits[sel].slug}`);
          else if (q.trim()) go(`/tienda?q=${encodeURIComponent(q.trim())}`);
        }}
        className="flex items-center gap-2 border-b border-line py-1.5 transition-colors focus-within:border-ink"
      >
        <IconSearch size={16} className="shrink-0 text-muted" />
        <label htmlFor={`${listId}-input`} className="sr-only">
          Buscar perfume, marca o referencia
        </label>
        <input
          id={`${listId}-input`}
          type="search"
          role="combobox"
          aria-expanded={open && !tooShort && hits.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={sel >= 0 ? `${listId}-${sel}` : undefined}
          autoComplete="off"
          autoFocus={autoFocus}
          maxLength={60}
          placeholder="Busca un perfume o una marca"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => hits.length && setOpen(true)}
          onKeyDown={(e) => {
            if (!open || !hits.length) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setSel((s) => (s + 1) % hits.length);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setSel((s) => (s - 1 + hits.length) % hits.length);
            } else if (e.key === "Escape") setOpen(false);
          }}
          className="w-full min-w-0 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
        />
        {loading ? <span className="h-3 w-3 animate-spin rounded-full border border-muted border-r-transparent" aria-hidden /> : null}
      </form>
      {open && !tooShort ? (
        <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-[min(380px,calc(100vw-32px))] border border-line bg-paper shadow-xl">
          <ul id={listId} role="listbox" aria-label="Sugerencias">
            {hits.map((h, i) => (
              <li key={h.slug} id={`${listId}-${i}`} role="option" aria-selected={i === sel}>
                <button
                  type="button"
                  onMouseEnter={() => setSel(i)}
                  onClick={() => go(`/perfume/${h.slug}`)}
                  className={`grid w-full grid-cols-[44px_1fr_auto] items-center gap-3 border-b border-line px-3 py-2.5 text-left ${i === sel ? "bg-ivory" : ""}`}
                >
                  <span className="relative h-12 w-11 bg-white">
                    <Image src={h.imageUrl ?? preparadaBottle(100)} alt="" fill sizes="44px" className="object-contain p-1" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{h.name}</span>
                    <span className="block truncate text-[11px] uppercase tracking-[0.12em] text-muted">
                      {h.line === "PREPARADA" ? `Preparada · Ref. ${h.inspiredByHouse}` : h.brandName}
                    </span>
                  </span>
                  <span className="text-sm tabular-nums">{h.priceFrom != null ? formatCop(h.priceFrom) : "—"}</span>
                </button>
              </li>
            ))}
          </ul>
          {hits.length ? (
            <button type="button" onClick={() => go(`/tienda?q=${encodeURIComponent(q.trim())}`)} className="w-full px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-gold">
              Ver todos los resultados
            </button>
          ) : (
            <p className="px-3 py-4 text-sm text-muted">Sin resultados para «{q.trim()}». Prueba con el nombre de la marca, por ejemplo «Lattafa».</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
