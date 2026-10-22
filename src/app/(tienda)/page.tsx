import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { HeroStage } from "@/components/store/hero-stage";
import { ProductCard, ProductGridSkeleton } from "@/components/store/product-card";
import { IconArrow, IconBag, IconCard, IconShield, IconWhatsapp, Star8 } from "@/components/icons";
import { catalogCounts, homeSelection } from "@/modules/catalog/queries";
import type { ProductLine } from "@/modules/catalog/types";
import { formatCop } from "@/lib/money";
import { whatsappLink } from "@/lib/whatsapp";
import { store } from "@/config/store";

const PREP_SIZES = [
  { ml: 30, price: 20_000, img: "/products/preparada/30.webp", w: 144, h: 776 },
  { ml: 50, price: 30_000, img: "/products/preparada/50.webp", w: 176, h: 784 },
  { ml: 60, price: 35_000, img: "/products/preparada/60.webp", w: 176, h: 792 },
  { ml: 100, price: 50_000, img: "/products/preparada/100.webp", w: 336, h: 768 },
];

const wrap = "mx-auto max-w-[1320px] pl-[max(20px,env(safe-area-inset-left,0px))] pr-[max(20px,env(safe-area-inset-right,0px))]";

function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${light ? "text-gold-2" : "text-gold"}`}>{children}</p>;
}

function SectionHead({ eyebrow, title, href, cta }: { eyebrow: string; title: React.ReactNode; href?: string; cta?: string }) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="mt-3 text-[clamp(32px,4.4vw,56px)] leading-[1.02]">{title}</h2>
      </div>
      {href ? (
        <Link href={href} className="group inline-flex items-center gap-2 border-b border-ink pb-1 text-xs font-semibold uppercase tracking-[0.18em] transition-colors hover:text-gold">
          {cta} <IconArrow size={16} className="transition-transform group-hover:translate-x-1" />
        </Link>
      ) : null}
    </div>
  );
}

async function Rail({ line }: { line: ProductLine }) {
  const items = await homeSelection(line, 8);
  if (!items.length) return <p className="text-muted">Muy pronto tendremos perfumes disponibles en esta línea.</p>;
  return (
    <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-x-4 sm:gap-y-10 sm:overflow-visible sm:px-0 lg:grid-cols-4">
      {items.map((p, i) => (
        <div key={p.id} className="w-[64%] shrink-0 snap-start sm:w-auto">
          <ProductCard p={p} priority={i < 2} />
        </div>
      ))}
    </div>
  );
}

async function LineTiles() {
  const c = await catalogCounts();
  const n = (x: number) => (x === 1 ? "1 perfume" : `${x} perfumes`);
  return (
    <div className="grid gap-3 md:grid-cols-3 md:grid-rows-[260px_260px]">
      <Link href="/tienda?linea=arabe" className="group relative isolate flex min-h-[460px] flex-col justify-end overflow-hidden rounded-brand p-7 text-night-fg md:row-span-2 md:min-h-[300px]">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_70%_25%,#5a3a16,transparent_55%),radial-gradient(ellipse_at_15%_95%,#3b2210,transparent_60%)] bg-night transition-transform duration-[1.2s] group-hover:scale-105" />
        <Star8 size={320} className="absolute -right-16 -top-10 -z-10 text-gold-2 opacity-[.07]" />
        <Image src="/products/recortes/khamrah-lattafa.webp" alt="" width={400} height={500} className="absolute right-[8%] top-[7%] -z-10 w-[42%] max-w-[260px] drop-shadow-[0_30px_30px_rgba(0,0,0,.6)] transition-transform duration-1000 group-hover:-translate-y-2" />
        <Eyebrow light>La especialidad · {n(c.ARABE)}</Eyebrow>
        <h3 className="mt-2 text-4xl lg:text-5xl">Perfumes árabes</h3>
        <p className="mt-2 max-w-[32ch] text-sm text-night-muted">Lattafa, Rasasi, Armaf, Afnan y más. Originales con la proyección y duración que buscas.</p>
        <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]">Ver árabes <IconArrow size={16} /></span>
      </Link>
      <Link href="/tienda?linea=disenador" className="group relative isolate flex min-h-[220px] flex-col justify-end overflow-hidden rounded-brand bg-paper p-7">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(160deg,var(--paper),color-mix(in_srgb,var(--gold)_18%,var(--paper)))]" />
        <Eyebrow>{n(c.DISENADOR)}</Eyebrow>
        <h3 className="mt-2 text-3xl">Diseñador</h3>
        <p className="mt-1 text-sm text-muted">Versace, Jean Paul Gaultier, Armani y otras grandes casas.</p>
      </Link>
      <Link href="/tienda?formato=decant" className="group relative isolate flex min-h-[220px] flex-col justify-end overflow-hidden rounded-brand bg-ink p-7 text-ivory">
        <Image src="/products/preparada/decant.webp" alt="" width={60} height={300} className="absolute right-8 top-6 -z-10 h-[70%] w-auto opacity-80 transition-transform duration-700 group-hover:-translate-y-2" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-2">{n(c.decants)} en decant</p>
        <h3 className="mt-2 text-3xl">Decants</h3>
        <p className="mt-1 max-w-[26ch] text-sm opacity-75">Prueba un original en 5 o 10 ml antes de comprar el frasco.</p>
      </Link>
      <Link href="/tienda?linea=preparada" className="group relative isolate flex min-h-[340px] flex-col justify-end overflow-hidden rounded-brand p-7 md:col-span-2 md:min-h-[220px]">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(110deg,var(--paper)_35%,color-mix(in_srgb,var(--gold)_26%,var(--paper)))]" />
        <Image src="/products/preparada/100.webp" alt="" width={336} height={768} className="absolute right-[8%] top-6 -z-10 h-[44%] w-auto transition-transform duration-700 group-hover:-translate-y-2 md:top-1/2 md:h-[78%] md:-translate-y-1/2 md:group-hover:-translate-y-[54%]" />
        <Eyebrow>Hecha en el local · {n(c.PREPARADA)}</Eyebrow>
        <h3 className="mt-2 text-3xl lg:text-4xl">Perfumería preparada</h3>
        <p className="mt-1 max-w-[40ch] text-sm text-muted md:max-w-[52%]">Fragancias inspiradas en los perfumes que te gustan, en frascos de 30 a 100 ml desde {formatCop(20_000)}.</p>
      </Link>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden bg-night text-night-fg" aria-labelledby="hero-title">
        <div className={`${wrap} grid items-center gap-6 lg:min-h-[600px] lg:grid-cols-2`}>
          <div className="order-2 pb-16 pt-2 lg:order-1 lg:py-20">
            <p className="pfx-fade flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-2">
              <Star8 size={14} /> Perfumería árabe, de diseñador y preparada
            </p>
            <h1 id="hero-title" className="pfx-rise mt-6 text-[clamp(42px,5.2vw,74px)] leading-[1.02]">
              <span><span>Fragancias</span></span>
              <span><span>que <span className="gold-text">se recuerdan</span></span></span>
              <span><span>después de irte.</span></span>
            </h1>
            <p className="pfx-fade mt-6 max-w-[46ch] text-base text-night-muted">
              Perfumes originales, decants para probar antes de comprar y nuestra perfumería preparada en el local. Asesoría por WhatsApp y envíos a toda Colombia.
            </p>
            <div className="pfx-fade mt-9 flex flex-wrap gap-3">
              <Link href="/tienda?linea=arabe" className="bg-gold-2 px-7 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-night transition-colors hover:bg-night-fg">
                Descubrir colección
              </Link>
              <Link href="/tienda?formato=decant" className="border border-night-fg/50 px-7 py-4 text-xs font-semibold uppercase tracking-[0.2em] transition-colors hover:border-night-fg hover:bg-night-fg hover:text-night">
                Comprar decants
              </Link>
            </div>
            <dl className="pfx-fade mt-11 grid max-w-md grid-cols-3 gap-4 border-t border-white/10 pt-6">
              {[
                ["Originales", "Árabes y diseñador"],
                ["5 y 10 ml", "Decants"],
                ["WhatsApp", "Pedido y asesoría"],
              ].map(([b, s]) => (
                <div key={b}>
                  <dt className="sr-only">{s}</dt>
                  <dd className="font-display text-xl font-semibold text-night-fg">{b}</dd>
                  <dd className="text-[11px] uppercase tracking-[0.14em] text-night-muted">{s}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="order-1 lg:order-2">
            <HeroStage />
          </div>
        </div>
      </section>

      <section className={`${wrap} py-20 lg:py-24`} aria-labelledby="lineas">
        <SectionHead eyebrow="Explora la casa" title={<span id="lineas">Cuatro maneras de oler bien</span>} />
        <Suspense fallback={<div className="h-[540px] animate-pulse rounded-brand bg-paper" />}>
          <LineTiles />
        </Suspense>
      </section>

      <section className={`${wrap} pb-20`} aria-labelledby="arabes">
        <SectionHead eyebrow="Originales" title={<span id="arabes">Perfumes árabes</span>} href="/tienda?linea=arabe" cta="Ver todos" />
        <Suspense fallback={<ProductGridSkeleton count={4} />}>
          <Rail line="ARABE" />
        </Suspense>
      </section>

      <section className="bg-night text-night-fg" aria-labelledby="decants">
        <div className={`${wrap} grid items-center gap-12 py-20 lg:grid-cols-[1fr_1.1fr] lg:py-28`}>
          <div className="relative flex h-[320px] items-end justify-center gap-10 lg:h-[420px]">
            <div className="absolute inset-x-[10%] bottom-0 h-px bg-gradient-to-r from-transparent via-gold-2/60 to-transparent" />
            <Image src="/products/preparada/decant.webp" alt="Atomizador de decant Perfupox de 5 ml" width={60} height={300} className="h-[62%] w-auto drop-shadow-[0_30px_30px_rgba(0,0,0,.6)]" />
            <Image src="/products/preparada/decant.webp" alt="Atomizador de decant Perfupox de 10 ml" width={60} height={300} className="h-[86%] w-auto drop-shadow-[0_30px_30px_rgba(0,0,0,.6)]" />
          </div>
          <div>
            <Eyebrow light>¿Quieres probar un perfume original con poco dinero?</Eyebrow>
            <h2 id="decants" className="mt-4 text-[clamp(36px,5vw,64px)] leading-[1.02]">
              El original, <span className="gold-text">en decant</span>
            </h2>
            <p className="mt-6 max-w-[52ch] text-night-muted">
              Un decant es una muestra de perfume 100% original, extraída directamente del frasco y envasada en un atomizador. Te deja conocer cómo se comporta en tu piel antes de invertir en el frasco completo.
            </p>
            <ul className="mt-8 grid max-w-lg grid-cols-2 gap-px bg-white/10">
              {[
                ["5 ml", "Para conocerlo varios días"],
                ["10 ml", "Ideal para llevar contigo"],
              ].map(([a, b]) => (
                <li key={a} className="bg-night p-5">
                  <p className="font-display text-3xl font-semibold">{a}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.14em] text-night-muted">{b}</p>
                </li>
              ))}
            </ul>
            <Link href="/tienda?formato=decant" className="mt-9 inline-flex items-center gap-2 border-b border-gold-2 pb-1 text-xs font-semibold uppercase tracking-[0.18em] text-gold-2">
              Ver perfumes en decant <IconArrow size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className={`${wrap} py-20 lg:py-24`} aria-labelledby="disenador">
        <SectionHead eyebrow="Originales" title={<span id="disenador">De diseñador</span>} href="/tienda?linea=disenador" cta="Ver todos" />
        <Suspense fallback={<ProductGridSkeleton count={4} />}>
          <Rail line="DISENADOR" />
        </Suspense>
      </section>

      <section className={`${wrap} pb-20`} aria-labelledby="preparada">
        <div className="grid gap-12 rounded-brand border border-line bg-paper p-7 lg:grid-cols-[1fr_1.15fr] lg:p-14">
          <div>
            <Eyebrow>Perfumería preparada</Eyebrow>
            <h2 id="preparada" className="mt-4 text-[clamp(32px,4vw,52px)] leading-[1.04]">
              Tu fragancia favorita, preparada en el local
            </h2>
            <p className="mt-5 text-muted">
              Escoge entre más de 180 referencias inspiradas en perfumes conocidos y elige el tamaño. Es una línea propia de Perfupox, distinta a los perfumes originales, y así la identificamos en cada ficha y en tu pedido.
            </p>
            <Link href="/tienda?linea=preparada" className="mt-8 inline-flex bg-ink px-7 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-ivory transition-colors hover:bg-gold hover:text-night">
              Ver referencias
            </Link>
          </div>
          <ul className="grid grid-cols-4 items-end gap-3">
            {PREP_SIZES.map((z) => (
              <li key={z.ml} className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-[200px] items-end lg:h-[260px]">
                  <Image src={z.img} alt={`Frasco Perfupox de ${z.ml} ml`} width={z.w} height={z.h} className="h-auto max-h-full w-auto" style={{ height: `${50 + z.ml / 2}%` }} />
                </div>
                <p className="font-display text-lg font-semibold">{z.ml} ml</p>
                <p className="text-sm tabular-nums text-muted">{formatCop(z.price)}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={`${wrap} pb-20`} aria-labelledby="para-quien">
        <SectionHead eyebrow="Para quién" title={<span id="para-quien">Hombre, mujer y unisex</span>} />
        <div className="flex flex-col gap-3 md:h-[440px] md:flex-row">
          {[
            ["Hombre", "/tienda?genero=hombre", "Amaderados, especiados y frescos con carácter.", "#3a2a1a", "/products/recortes/hawas-for-him-rasasi.webp"],
            ["Mujer", "/tienda?genero=mujer", "Florales, frutales y gourmand con estela.", "#5a3040", "/products/recortes/yara-lattafa.webp"],
            ["Unisex", "/tienda?genero=unisex", "Oud, ámbar y café para cualquier piel.", "#4a3a14", "/products/recortes/bade-e-al-oud-for-glory-lattafa.webp"],
          ].map(([t, href, d, c, img], i) => (
            <Link
              key={t}
              href={href}
              className="group relative isolate flex min-h-[200px] flex-1 flex-col justify-end overflow-hidden rounded-brand p-7 text-night-fg transition-[flex] duration-700 ease-[cubic-bezier(.2,.8,.2,1)] md:hover:flex-[1.6]"
              style={{ background: `radial-gradient(ellipse at 50% 30%, ${c}, transparent 70%), var(--night)` }}
            >
              <span className="absolute left-7 top-6 font-mono text-[11px] text-night-muted">{["I", "II", "III"][i]}</span>
              <Image src={img} alt="" width={260} height={325} className="absolute right-5 top-5 -z-10 w-[24%] max-w-[140px] drop-shadow-[0_24px_24px_rgba(0,0,0,.6)] transition-transform duration-700 group-hover:-translate-y-2 md:w-[30%]" />
              <h3 className="text-5xl">{t}</h3>
              <p className="mt-2 max-w-[66%] text-sm text-night-muted md:max-w-none">{d}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className={`${wrap} pb-24`} aria-label="Por qué comprar en Perfupox">
        <ul className="grid border-y border-line sm:grid-cols-2 lg:grid-cols-4">
          {[
            [IconBag, "Pide por WhatsApp", "Arma tu bolsa y envíanos el pedido con un toque. Te respondemos para confirmarlo."],
            [IconCard, "Paga como prefieras", "Transferencia o a cuotas con Addi. Lo coordinamos contigo por WhatsApp."],
            [IconShield, "Originales y preparada, claros", "Cada ficha indica si es un perfume original o de nuestra línea preparada."],
            [IconWhatsapp, "Asesoría real", `Te ayudamos a elegir al ${store.contact.whatsappDisplay}.`],
          ].map(([Icon, t, d], i) => {
            const I = Icon as typeof IconBag;
            return (
              <li key={t as string} className={`grid content-start gap-3 border-line p-7 ${i < 3 ? "lg:border-r" : ""} ${i % 2 === 0 ? "sm:border-r lg:border-r" : ""} ${i < 2 ? "border-b lg:border-b-0" : i === 2 ? "border-b sm:border-b-0" : ""}`}>
                <I size={28} className="text-gold" />
                <h3 className="font-sans text-[13px] font-semibold uppercase tracking-[0.14em]">{t as string}</h3>
                <p className="text-sm text-muted">{d as string}</p>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="bg-night text-night-fg" aria-labelledby="contacto">
        <div className={`${wrap} flex flex-col items-start justify-between gap-8 py-16 lg:flex-row lg:items-center`}>
          <div>
            <Eyebrow light>¿No sabes cuál elegir?</Eyebrow>
            <h2 id="contacto" className="mt-3 text-[clamp(30px,3.6vw,46px)]">Cuéntanos qué te gusta y te recomendamos</h2>
          </div>
          <a
            href={whatsappLink("Hola Perfupox, quiero una recomendación de perfume.")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-gold-2 px-7 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-night transition-colors hover:bg-night-fg"
          >
            <IconWhatsapp size={20} /> Escribir por WhatsApp
          </a>
        </div>
      </section>
    </>
  );
}
