import { normalizeSearch } from "@/lib/slug";

const LINE_WORDS = { ARABE: "arabe arabes", DISENADOR: "disenador diseñador", NICHO: "nicho", PREPARADA: "preparada preparado inspirado" } as const;
const GENDER_WORDS = { HOMBRE: "hombre caballero masculino", MUJER: "mujer dama femenino", UNISEX: "unisex" } as const;

/** Texto que alimenta la búsqueda: nombre, marca, referencia, línea, público y notas, sin tildes. */
export function buildSearchText(p: {
  name: string;
  brandName: string;
  line: keyof typeof LINE_WORDS;
  gender: keyof typeof GENDER_WORDS;
  inspiredBy?: string | null;
  inspiredByHouse?: string | null;
  notes?: string[];
}): string {
  return normalizeSearch(
    [p.name, p.brandName, p.inspiredBy, p.inspiredByHouse, LINE_WORDS[p.line], GENDER_WORDS[p.gender], ...(p.notes ?? [])]
      .filter(Boolean)
      .join(" "),
  );
}
