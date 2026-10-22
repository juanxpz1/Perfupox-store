import { describe, expect, it } from "vitest";
import { catalogQuerySchema, productInputSchema } from "@/lib/validation/catalog";
import { cleanText, departmentSchema, documentSchema, emailSchema, phoneSchema } from "@/lib/validation/common";
import { formatCop, formatOrderNumber, percentOf } from "@/lib/money";
import { slugify } from "@/lib/slug";

describe("datos colombianos", () => {
  it("normaliza correo, celular y documento", () => {
    expect(emailSchema.parse("  Cliente@Correo.COM ")).toBe("cliente@correo.com");
    expect(phoneSchema.parse("+57 300 123 4567")).toBe("3001234567");
    expect(documentSchema.parse("1.023.456.789")).toBe("1023456789");
  });

  it("rechaza celulares que no son colombianos y departamentos inexistentes", () => {
    expect(phoneSchema.safeParse("6041234567").success).toBe(false);
    expect(phoneSchema.safeParse("30012345").success).toBe(false);
    expect(departmentSchema.safeParse("Gotham").success).toBe(false);
    expect(departmentSchema.safeParse("Córdoba").success).toBe(true);
  });

  it("limpia caracteres de control y espacios", () => {
    expect(cleanText(80).parse("Dejar en\u0000   portería ")).toBe("Dejar en portería");
  });
});

describe("productInputSchema", () => {
  const product = {
    name: "Oud Sultani",
    brandId: "0b5f0c2e-7a0b-4b39-9d2a-9a3f6e0c1d11",
    line: "ARABE",
    gender: "UNISEX",
    concentration: "EAU_DE_PARFUM",
    variants: [{ sku: "pfx-oud-100", sizeMl: 100, price: 389_000, compareAtPrice: 429_000, stock: 4 }],
  };

  it("acepta un producto válido y normaliza el SKU", () => {
    const r = productInputSchema.parse(product);
    expect(r.variants[0].sku).toBe("PFX-OUD-100");
    expect(r.isActive).toBe(false);
  });

  it("rechaza un precio anterior que no es mayor al actual", () => {
    const r = productInputSchema.safeParse({ ...product, variants: [{ ...product.variants[0], compareAtPrice: 300_000 }] });
    expect(r.success).toBe(false);
  });

  it("rechaza precios con decimales y SKU repetidos", () => {
    expect(productInputSchema.safeParse({ ...product, variants: [{ ...product.variants[0], price: 1000.5 }] }).success).toBe(false);
    expect(productInputSchema.safeParse({ ...product, variants: [product.variants[0], { ...product.variants[0], sizeMl: 50 }] }).success).toBe(false);
  });
});

describe("catalogQuerySchema", () => {
  it("ignora parámetros inválidos en la URL sin romper la página", () => {
    const r = catalogQuerySchema.parse({ linea: "hackeo", orden: "<script>", pagina: "-3", genero: "mujer", marca: "lattafa", formato: "x" });
    expect(r).toMatchObject({ linea: undefined, orden: "relevancia", pagina: 1, genero: "mujer", marca: ["lattafa"], formato: undefined });
  });
});

describe("utilidades", () => {
  it("formatea pesos colombianos", () => {
    expect(formatCop(389000)).toBe("$389.000");
    expect(formatCop(0)).toBe("$0");
    expect(() => formatCop(10.5)).toThrow();
  });

  it("formatea el número de pedido y porcentajes", () => {
    expect(formatOrderNumber(1001)).toBe("PX-001001");
    expect(percentOf(99_999, 10)).toBe(9_999);
  });

  it("genera slugs limpios", () => {
    expect(slugify("Ámbar & Oud Nº 1 — 100 ml")).toBe("ambar-y-oud-n-1-100-ml");
  });
});
