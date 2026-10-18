/** Convierte un texto en un identificador apto para URL: "Oud Sultani 100 ml" → "oud-sultani-100-ml". */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " y ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Normaliza texto para búsquedas sin tildes ni mayúsculas. */
export function normalizeSearch(input: string): string {
  return input.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}
