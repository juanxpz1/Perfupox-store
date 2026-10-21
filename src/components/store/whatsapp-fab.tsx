"use client";

import { usePathname } from "next/navigation";
import { IconWhatsapp } from "@/components/icons";
import { whatsappLink } from "@/lib/whatsapp";

const GENERIC = "Hola Perfupox, quiero asesoría para elegir un perfume.";

/** Botón flotante de WhatsApp. En la ficha de un perfume, el mensaje menciona ese perfume. */
export function WhatsappFab() {
  const path = usePathname();
  if (path === "/bolsa") return null;
  return (
    <a
      href={whatsappLink(GENERIC)}
      onClick={(e) => {
        const h1 = document.querySelector("h1")?.textContent?.trim();
        if (path.startsWith("/perfume/") && h1) e.currentTarget.href = whatsappLink(`Hola Perfupox, me interesa «${h1}». ${window.location.href}`);
      }}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      className="fixed bottom-[calc(18px+env(safe-area-inset-bottom,0px))] right-[calc(18px+env(safe-area-inset-right,0px))] z-[55] grid h-14 w-14 place-items-center rounded-full bg-ink text-ivory shadow-[0_18px_40px_-14px_rgba(0,0,0,.55)] transition-transform hover:scale-105"
    >
      <IconWhatsapp size={26} />
    </a>
  );
}
