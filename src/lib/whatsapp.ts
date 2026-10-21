import { store } from "@/config/store";

/** Enlace a WhatsApp con un mensaje ya escrito. */
export function whatsappLink(message: string): string {
  return `https://wa.me/${store.contact.whatsapp}?text=${encodeURIComponent(message)}`;
}
