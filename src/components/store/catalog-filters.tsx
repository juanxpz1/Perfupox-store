"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { IconClose, IconFilter } from "@/components/icons";
import { PRICE_RANGES } from "@/modules/catalog/price-ranges";

type Brand = { slug: string; name: string; n: number };

const LINES = [
  ["arabe", "Árabes"],
  ["disenador", "Diseñador"],
  ["preparada", "Perfumería preparada"],
] as const;
const GENDERS = [
  ["hombre", "Hombre"],
  ["mujer", "Mujer"],
  ["unisex", "Unisex"],
] as const;
const FORMATS = [
  ["decant", "Decants (5 y 10 ml)"],
  ["frasco", "Frasco original"],
] as const;


/** Filtros sincronizados con la URL: se pueden compartir, guardar y usar con el botón atrás. */
export function CatalogFilters({ brands }: { brands: Brand[] }) {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [showAllBrands, setShowAllBrands] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  const update = (mut: (p: URLSearchParams) => void) => {
    const p = new URLSearchParams(params.toString());
    mut(p);
    p.delete("pagina");
    start(() => router.push(`${path}${p.size ? `?${p}` : ""}`, { scroll: false }));
  };
  const setOne = (key: string, value: string | null) => update((p) => (value == null || p.get(key) === value ? p.delete(key) : p.set(key, value)));
  const toggleBrand = (slug: string) =>
    update((p) => {
      const cur = p.getAll("marca");
      p.delete("marca");
      (cur.includes(slug) ? cur.filter((x) => x !== slug) : [...cur, slug]).forEach((m) => p.append("marca", m));
    });
  const setPrice = (min?: number, max?: number) =>
    update((p) => {
      const same = p.get("min") === (min?.toString() ?? null) && p.get("max") === (max?.toString() ?? null);
      p.delete("min");
      p.delete("max");
      if (!same) {
        if (min != null) p.set("min", String(min));
        if (max != null) p.set("max", String(max));
      }
    });

  const linea = params.get("linea");
  const marcas = params.getAll("marca");
  const activeCount = ["linea", "genero", "formato", "min", "max"].filter((k) => params.get(k)).length + marcas.length;
  const shownBrands = showAllBrands ? brands : brands.slice(0, 10);

  const Radio = ({ name, value, label }: { name: string; value: string; label: string }) => {
    const on = params.get(name) === value;
    return (
      <button type="button" aria-pressed={on} onClick={() => setOne(name, value)} className="flex w-full items-center gap-3 py-1.5 text-left text-sm">
        <span className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border ${on ? "border-ink" : "border-line"}`}>{on ? <span className="h-2 w-2 rounded-full bg-ink" /> : null}</span>
        {label}
      </button>
    );
  };

  const panel = (
    <div className={`flex flex-col gap-8 transition-opacity ${pending ? "opacity-60" : ""}`}>
      <fieldset>
        <legend className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">Línea</legend>
        {LINES.map(([v, l]) => <Radio key={v} name="linea" value={v} label={l} />)}
        <p className="mt-1 py-1.5 text-sm text-muted">Nicho · próximamente</p>
      </fieldset>
      <fieldset>
        <legend className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">Para quién</legend>
        {GENDERS.map(([v, l]) => <Radio key={v} name="genero" value={v} label={l} />)}
      </fieldset>
      {linea !== "preparada" ? (
        <fieldset>
          <legend className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">Presentación</legend>
          {FORMATS.map(([v, l]) => <Radio key={v} name="formato" value={v} label={l} />)}
        </fieldset>
      ) : null}
      <fieldset>
        <legend className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">Precio desde</legend>
        {PRICE_RANGES.map((r) => {
          const on = params.get("min") === (r.min?.toString() ?? null) && params.get("max") === (r.max?.toString() ?? null);
          return (
            <button key={r.id} type="button" aria-pressed={on} onClick={() => setPrice(r.min, r.max)} className="flex w-full items-center gap-3 py-1.5 text-left text-sm">
              <span className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border ${on ? "border-ink" : "border-line"}`}>{on ? <span className="h-2 w-2 rounded-full bg-ink" /> : null}</span>
              {r.label}
            </button>
          );
        })}
      </fieldset>
      {linea !== "preparada" && brands.length ? (
        <fieldset>
          <legend className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">Marca</legend>
          {shownBrands.map((b) => {
            const on = marcas.includes(b.slug);
            return (
              <button key={b.slug} type="button" aria-pressed={on} onClick={() => toggleBrand(b.slug)} className="flex w-full items-center gap-3 py-1.5 text-left text-sm">
                <span className={`grid h-4 w-4 shrink-0 place-items-center border ${on ? "border-ink bg-ink" : "border-line"}`}>
                  {on ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--ivory)" strokeWidth="3" aria-hidden><path d="m5 12 5 5 9-10" /></svg> : null}
                </span>
                <span className="flex-1">{b.name}</span>
                <span className="text-xs tabular-nums text-muted">{b.n}</span>
              </button>
            );
          })}
          {brands.length > 10 ? (
            <button type="button" onClick={() => setShowAllBrands((x) => !x)} className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-gold">
              {showAllBrands ? "Ver menos" : `Ver las ${brands.length} marcas`}
            </button>
          ) : null}
        </fieldset>
      ) : null}
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 border border-line px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] lg:hidden"
        aria-expanded={open}
      >
        <IconFilter size={16} /> Filtros {activeCount ? <span className="grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-[10px] text-ivory">{activeCount}</span> : null}
      </button>
      <aside className="hidden lg:block" aria-label="Filtros">{panel}</aside>
      <div className={`fixed inset-0 z-[90] bg-black/50 transition-opacity lg:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"}`} onClick={() => setOpen(false)} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Filtros"
        inert={!open}
        className={`fixed inset-x-0 bottom-0 z-[95] flex max-h-[85dvh] flex-col rounded-t-xl bg-ivory transition-[transform,visibility] duration-500 ease-[cubic-bezier(.2,.8,.2,1)] lg:hidden ${open ? "visible translate-y-0" : "invisible translate-y-full"}`}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <span className="font-display text-xl font-semibold">Filtros</span>
          <button type="button" aria-label="Cerrar filtros" onClick={() => setOpen(false)} className="grid h-11 w-11 place-items-center">
            <IconClose />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-6">{panel}</div>
        <div className="grid grid-cols-2 gap-2 border-t border-line px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-4">
          <button type="button" onClick={() => start(() => router.push(path + (params.get("q") ? `?q=${encodeURIComponent(params.get("q")!)}` : ""), { scroll: false }))} className="border border-ink py-3.5 text-xs font-semibold uppercase tracking-[0.16em]">
            Limpiar
          </button>
          <button type="button" onClick={() => setOpen(false)} className="bg-ink py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-ivory">
            Ver resultados
          </button>
        </div>
      </div>
    </>
  );
}

export function SortSelect() {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  return (
    <label className="inline-flex items-center gap-2 text-xs">
      <span className="sr-only sm:not-sr-only sm:font-semibold sm:uppercase sm:tracking-[0.16em] sm:text-muted">Ordenar</span>
      <select
        value={params.get("orden") ?? "relevancia"}
        onChange={(e) => {
          const p = new URLSearchParams(params.toString());
          if (e.target.value === "relevancia") p.delete("orden");
          else p.set("orden", e.target.value);
          p.delete("pagina");
          router.push(`${path}${p.size ? `?${p}` : ""}`, { scroll: false });
        }}
        className="border border-line bg-paper px-3 py-2.5 text-xs font-medium text-ink"
      >
        <option value="relevancia">Relevancia</option>
        <option value="precio-asc">Precio: menor a mayor</option>
        <option value="precio-desc">Precio: mayor a menor</option>
        <option value="nombre">Nombre A–Z</option>
        <option value="novedades">Novedades</option>
      </select>
    </label>
  );
}
