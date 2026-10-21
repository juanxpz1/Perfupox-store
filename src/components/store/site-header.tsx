import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { store } from "@/config/store";
import { HeaderActions } from "./header-actions";
import { MobileMenu } from "./mobile-menu";
import { NAV } from "./nav-links";
import { SearchBox } from "./search-box";

export function SiteHeader() {
  return (
    <header className="sticky top-[env(safe-area-inset-top,0px)] z-[60] border-b border-line bg-ivory/90 backdrop-blur-xl">
      <div className="mx-auto grid h-[68px] max-w-[1320px] grid-cols-[1fr_auto_1fr] items-center gap-4 pl-[max(16px,env(safe-area-inset-left,0px))] pr-[max(16px,env(safe-area-inset-right,0px))] lg:h-[76px]">
        <div className="flex items-center gap-2">
          <Suspense fallback={<span className="h-11 w-11 lg:hidden" />}>
            <MobileMenu />
          </Suspense>
          <SearchBox className="hidden w-full max-w-[280px] lg:block" />
        </div>
        <Link href="/" aria-label={`${store.name} ${store.tagline}, inicio`} className="block">
          <Image src={store.logo.lockupInk} alt="" width={198} height={50} priority className="h-9 w-auto dark:hidden lg:h-11" />
          <Image src={store.logo.lockupGold} alt="" width={198} height={50} priority className="hidden h-9 w-auto dark:block lg:h-11" />
        </Link>
        <HeaderActions />
      </div>
      <nav aria-label="Categorías" className="hidden border-t border-line lg:block">
        <ul className="mx-auto flex max-w-[1320px] justify-center gap-1 px-4">
          {NAV.map((n) => (
            <li key={n.label} className="group">
              {n.soon ? (
                <span className="flex items-center gap-2 px-4 py-3 text-xs font-medium uppercase tracking-[0.18em] text-muted" title="Muy pronto">
                  {n.label}
                  <span className="border border-line px-1.5 py-0.5 text-[9px] tracking-[0.12em]">Pronto</span>
                </span>
              ) : (
                <Link
                  href={n.href!}
                  className="relative block px-4 py-3 text-xs font-medium uppercase tracking-[0.18em] after:absolute after:inset-x-4 after:bottom-2 after:h-px after:origin-right after:scale-x-0 after:bg-gold after:transition-transform after:duration-500 group-hover:after:origin-left group-hover:after:scale-x-100 group-focus-within:after:scale-x-100"
                >
                  {n.label}
                </Link>
              )}
              {n.children ? (
                <div className="invisible absolute inset-x-0 top-full -translate-y-1 border-b border-line bg-paper opacity-0 shadow-xl transition-all duration-300 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  <div className="mx-auto flex max-w-[1320px] items-center gap-10 px-8 py-7">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">{n.label}</span>
                    {n.children.map((c) => (
                      <Link key={c.href} href={c.href} className="font-display text-xl font-semibold tracking-tight transition-colors hover:text-gold">
                        {c.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
