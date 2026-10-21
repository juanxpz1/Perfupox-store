"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { IconClose, IconMenu } from "@/components/icons";
import { NAV } from "./nav-links";
import { SearchBox } from "./search-box";

export function MobileMenu() {
  const path = usePathname();
  const params = useSearchParams();
  const here = `${path}?${params}`;
  // El menú queda abierto solo en la página donde se abrió: al navegar se cierra solo.
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === here;
  const setOpen = (v: boolean) => setOpenAt(v ? here : null);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpenAt(null);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);
  return (
    <>
      <button type="button" className="grid h-11 w-11 place-items-center lg:hidden" aria-label="Abrir menú" aria-expanded={open} onClick={() => setOpen(true)}>
        <IconMenu />
      </button>
      <div className={`fixed inset-0 z-[90] bg-black/50 transition-opacity lg:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"}`} onClick={() => setOpen(false)} aria-hidden />
      <nav
        aria-label="Menú"
        className={`fixed inset-y-0 left-0 z-[95] flex w-[min(360px,88vw)] flex-col gap-6 overflow-y-auto bg-ivory pb-[max(24px,env(safe-area-inset-bottom))] pl-[max(20px,env(safe-area-inset-left))] pr-5 pt-[calc(16px+env(safe-area-inset-top,0px))] transition-[transform,visibility] duration-500 ease-[cubic-bezier(.2,.8,.2,1)] lg:hidden ${
          open ? "visible translate-x-0" : "invisible -translate-x-full"
        }`}
        inert={!open}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">Menú</span>
          <button type="button" className="grid h-11 w-11 place-items-center" aria-label="Cerrar menú" onClick={() => setOpen(false)}>
            <IconClose />
          </button>
        </div>
        <SearchBox onNavigate={() => setOpen(false)} />
        <ul className="flex flex-col">
          {NAV.map((n) => (
            <li key={n.label} className="border-b border-line">
              {n.soon ? (
                <span className="flex items-center justify-between py-4 font-display text-2xl text-muted">
                  {n.label} <span className="text-[10px] font-semibold uppercase tracking-[0.16em]">Próximamente</span>
                </span>
              ) : (
                <Link href={n.href!} className="block py-4 font-display text-2xl font-semibold tracking-tight">
                  {n.label}
                </Link>
              )}
              {n.children ? (
                <div className="flex flex-wrap gap-2 pb-4">
                  {n.children.slice(0, 3).map((c) => (
                    <Link key={c.href} href={c.href} className="border border-line px-3 py-1.5 text-xs font-medium">
                      {c.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
