export type ProductLine = "ARABE" | "DISENADOR" | "NICHO" | "PREPARADA";
export type Gender = "HOMBRE" | "MUJER" | "UNISEX";
export type VariantKind = "FRASCO" | "DECANT" | "PREPARADO";

/** Lo que necesita una tarjeta de producto en listados. */
export type ProductCard = {
  id: string;
  slug: string;
  name: string;
  brandName: string;
  line: ProductLine;
  gender: Gender;
  inspiredBy: string | null;
  inspiredByHouse: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  /** Precio más bajo entre las presentaciones disponibles. */
  priceFrom: number | null;
  /** Precio del frasco original, si existe y está disponible. */
  bottlePrice: number | null;
  compareAtPrice: number | null;
  hasDecants: boolean;
  available: boolean;
  isNew: boolean;
};

export type VariantView = {
  id: string;
  sku: string;
  kind: VariantKind;
  sizeMl: number | null;
  label: string | null;
  price: number;
  compareAtPrice: number | null;
  available: boolean;
  /** Unidades restantes solo si se lleva conteo y quedan pocas. */
  lowStock: number | null;
};

export type ProductDetail = ProductCard & {
  brandSlug: string;
  concentration: string | null;
  familyName: string | null;
  shortDescription: string | null;
  description: string | null;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  countryOfOrigin: string | null;
  images: { url: string; alt: string }[];
  variants: VariantView[];
};

export const LINE_LABELS: Record<ProductLine, string> = {
  ARABE: "Árabes",
  DISENADOR: "Diseñador",
  NICHO: "Nicho",
  PREPARADA: "Perfumería preparada",
};

export const LINE_SLUGS: Record<ProductLine, "arabe" | "disenador" | "nicho" | "preparada"> = {
  ARABE: "arabe",
  DISENADOR: "disenador",
  NICHO: "nicho",
  PREPARADA: "preparada",
};

export const GENDER_LABELS: Record<Gender, string> = { HOMBRE: "Hombre", MUJER: "Mujer", UNISEX: "Unisex" };

export const CONCENTRATION_LABELS: Record<string, string> = {
  EAU_DE_COLOGNE: "Eau de Cologne",
  EAU_DE_TOILETTE: "Eau de Toilette",
  EAU_DE_PARFUM: "Eau de Parfum",
  PARFUM: "Parfum",
  EXTRAIT: "Extrait de Parfum",
  OTRA: "Otra",
};

/** Foto del frasco Perfupox según tamaño, para la perfumería preparada. */
export function preparadaBottle(sizeMl: number | null | undefined): string {
  if (sizeMl === 30 || sizeMl === 50 || sizeMl === 60) return `/products/preparada/${sizeMl}.webp`;
  return "/products/preparada/100.webp";
}

export const DECANT_IMAGE = "/products/preparada/decant.webp";
