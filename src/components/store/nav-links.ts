export type NavItem = { label: string; href?: string; soon?: boolean; children?: { label: string; href: string }[] };

const byGender = (linea: string) => [
  { label: "Hombre", href: `/tienda?linea=${linea}&genero=hombre` },
  { label: "Mujer", href: `/tienda?linea=${linea}&genero=mujer` },
  { label: "Unisex", href: `/tienda?linea=${linea}&genero=unisex` },
  { label: "Ver todo", href: `/tienda?linea=${linea}` },
];

export const NAV: NavItem[] = [
  { label: "Árabes", href: "/tienda?linea=arabe", children: byGender("arabe") },
  { label: "Diseñador", href: "/tienda?linea=disenador", children: byGender("disenador") },
  { label: "Decants", href: "/tienda?formato=decant" },
  { label: "Preparada", href: "/tienda?linea=preparada", children: byGender("preparada") },
  { label: "Nicho", soon: true },
  { label: "Hombre", href: "/tienda?genero=hombre" },
  { label: "Mujer", href: "/tienda?genero=mujer" },
];
