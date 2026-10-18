/**
 * Datos de la marca. Lo que cambia con frecuencia (anuncios, WhatsApp, cuenta para QR,
 * envío gratis) vive en la tabla `store_settings` y se edita desde el panel;
 * aquí quedan los valores por defecto y la identidad.
 *
 * Los campos marcados como «POR CONFIRMAR» los debe completar el propietario antes del lanzamiento.
 */
export const store = {
  name: "Perfupox",
  legalName: "POR CONFIRMAR", // Razón social o nombre del titular
  taxId: "POR CONFIRMAR", // NIT
  tagline: "Perfume Store",
  description: "Perfumería árabe, de diseñador y preparada. Perfumes originales con envío a todo Colombia.",
  locale: "es-CO",
  currency: "COP",
  timeZone: "America/Bogota",
  logo: {
    lockupInk: "/brand/lockup-ink.png",
    lockupGold: "/brand/lockup-gold.png",
    monogramGold: "/brand/mono-gold.png",
    full: "/brand/logo-gold.png",
  },
  social: {
    instagram: "https://www.instagram.com/perfupoxstore",
  },
  contact: {
    email: null as string | null, // POR CONFIRMAR
    whatsapp: null as string | null, // POR CONFIRMAR, formato 57XXXXXXXXXX
    address: null as string | null,
    hours: null as string | null,
  },
  defaults: {
    freeShippingFrom: 300_000,
    lowStockThreshold: 3,
    maxQtyPerLine: 10,
    cartTtlDays: 30,
  },
} as const;

export type StoreConfig = typeof store;
