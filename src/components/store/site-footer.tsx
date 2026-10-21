import Image from "next/image";
import Link from "next/link";
import { store } from "@/config/store";
import { IconInstagram, IconMail, IconWhatsapp } from "@/components/icons";
import { whatsappLink } from "@/lib/whatsapp";

export function SiteFooter() {
  return (
    <footer className="bg-night-2 text-sm text-night-muted">
      <div className="mx-auto max-w-[1320px] pb-[max(28px,env(safe-area-inset-bottom))] pl-[max(20px,env(safe-area-inset-left,0px))] pr-[max(20px,env(safe-area-inset-right,0px))] pt-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div className="flex flex-col gap-4">
            <Image src={store.logo.lockupGold} alt={`${store.name} ${store.tagline}`} width={198} height={50} className="h-12 w-auto self-start" />
            <p className="max-w-[34ch]">{store.description}</p>
            <div className="flex flex-wrap gap-2">
              {["Transferencia QR", "Addi"].map((m) => (
                <span key={m} className="border border-white/15 px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] text-night-fg">
                  {m}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-night-fg">Tienda</h2>
            <ul className="grid gap-2">
              <li><Link className="hover:text-gold-2" href="/tienda?linea=arabe">Perfumes árabes</Link></li>
              <li><Link className="hover:text-gold-2" href="/tienda?linea=disenador">Diseñador</Link></li>
              <li><Link className="hover:text-gold-2" href="/tienda?formato=decant">Decants</Link></li>
              <li><Link className="hover:text-gold-2" href="/tienda?linea=preparada">Perfumería preparada</Link></li>
            </ul>
          </div>
          <div>
            <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-night-fg">Ayuda</h2>
            <ul className="grid gap-2">
              <li><Link className="hover:text-gold-2" href="/bolsa">Tu bolsa</Link></li>
              <li><Link className="hover:text-gold-2" href="/favoritos">Favoritos</Link></li>
              <li><a className="hover:text-gold-2" href={whatsappLink("Hola Perfupox, necesito ayuda con una compra.")} target="_blank" rel="noopener noreferrer">Asesoría por WhatsApp</a></li>
            </ul>
          </div>
          <div>
            <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-night-fg">Contacto</h2>
            <ul className="grid gap-3">
              <li>
                <a className="flex items-center gap-2 hover:text-gold-2" href={whatsappLink("Hola Perfupox")} target="_blank" rel="noopener noreferrer">
                  <IconWhatsapp size={18} /> {store.contact.whatsappDisplay}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <IconMail size={18} /> <span className="select-all break-all">{store.contact.email}</span>
              </li>
              <li>
                <a className="flex items-center gap-2 hover:text-gold-2" href={store.social.instagram} target="_blank" rel="noopener noreferrer">
                  <IconInstagram size={18} /> @perfupoxstore
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-wrap justify-between gap-4 border-t border-white/10 pt-6 text-xs">
          <span>© {store.name} {store.tagline}</span>
          <span>Precios en pesos colombianos (COP).</span>
        </div>
      </div>
    </footer>
  );
}
