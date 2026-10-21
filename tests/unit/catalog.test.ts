import { describe, expect, it } from "vitest";
import { buildSearchText } from "@/modules/catalog/search-text";
import { preparadaBottle } from "@/modules/catalog/types";
import { productInputSchema } from "@/lib/validation/catalog";
import catalog from "../../data/catalogo-tienda-2026-10.json";

describe("búsqueda", () => {
  it("encuentra sin tildes y por referencia de la preparada", () => {
    const t = buildSearchText({ name: "Inspirado en Olympéa", brandName: "Perfupox Preparada", line: "PREPARADA", gender: "MUJER", inspiredBy: "Olympéa", inspiredByHouse: "Rabanne" });
    expect(t).toContain("olympea");
    expect(t).toContain("rabanne");
    expect(t).toContain("dama");
  });
});

describe("perfumería preparada", () => {
  it("usa el frasco Perfupox del tamaño elegido", () => {
    expect(preparadaBottle(30)).toBe("/products/preparada/30.webp");
    expect(preparadaBottle(100)).toBe("/products/preparada/100.webp");
    expect(preparadaBottle(null)).toBe("/products/preparada/100.webp");
  });

  it("exige el perfume de referencia solo en la preparada", () => {
    const base = { name: "X", brandId: "0b5f0c2e-7a0b-4b39-9d2a-9a3f6e0c1d11", gender: "UNISEX", variants: [{ sku: "ABC-1", sizeMl: 30, price: 20_000 }] };
    expect(productInputSchema.safeParse({ ...base, line: "PREPARADA" }).success).toBe(false);
    expect(productInputSchema.safeParse({ ...base, line: "PREPARADA", inspiredBy: "Scandal" }).success).toBe(true);
    expect(productInputSchema.safeParse({ ...base, line: "ARABE", inspiredBy: "Scandal" }).success).toBe(false);
  });
});

describe("catálogo importado de la tienda", () => {
  it("tiene precios enteros y decants más baratos que el frasco", () => {
    expect(catalog.originals).toHaveLength(68);
    for (const o of catalog.originals) {
      expect(Number.isInteger(o.price) && o.price > 0).toBe(true);
      expect(o.decant5).toBeLessThan(o.decant10);
      expect(o.decant10).toBeLessThan(o.price);
    }
  });

  it("no repite identificadores de producto", () => {
    const slugs = [...catalog.originals.map((o) => o.slug), ...catalog.preparadas.map((p) => p.slug)];
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(catalog.preparadas).toHaveLength(186);
  });
});
