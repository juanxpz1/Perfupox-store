import { describe, expect, it } from "vitest";
import { checkoutSchema } from "@/lib/validation/checkout";
import { catalogQuerySchema, productInputSchema } from "@/lib/validation/catalog";
import { phoneSchema } from "@/lib/validation/common";
import { formatCop, formatOrderNumber, percentOf } from "@/lib/money";
import { slugify } from "@/lib/slug";

const validCheckout = {
  idempotencyKey: "0b5f0c2e-7a0b-4b39-9d2a-9a3f6e0c1d11",
  email: "  Cliente@Correo.COM ",
  customerName: "Laura   Gómez",
  phone: "+57 300 123 4567",
  documentId: "1.023.456.789",
  shipping: {
    recipientName: "Laura Gómez",
    phone: "3001234567",
    department: "Córdoba",
    city: "Montería",
    line1: "Calle 30 # 5-20",
  },
  paymentMethod: "TRANSFERENCIA_QR",
  acceptTerms: true,
};

describe("checkoutSchema", () => {
  it("normaliza correo, celular, documento y espacios", () => {
    const r = checkoutSchema.parse(validCheckout);
    expect(r.email).toBe("cliente@correo.com");
    expect(r.phone).toBe("3001234567");
    expect(r.documentId).toBe("1023456789");
    expect(r.customerName).toBe("Laura Gómez");
  });

  it("no acepta precios ni totales del navegador", () => {
    const r = checkoutSchema.parse({ ...validCheckout, total: 1, subtotal: 1 });
    expect(r).not.toHaveProperty("total");
    expect(r).not.toHaveProperty("subtotal");
  });

  it("exige aceptar términos y un departamento válido", () => {
    const r = checkoutSchema.safeParse({ ...validCheckout, acceptTerms: false, shipping: { ...validCheckout.shipping, department: "Gotham" } });
    expect(r.success).toBe(false);
    const paths = r.error!.issues.map((i) => i.path.join("."));
    expect(paths).toContain("acceptTerms");
    expect(paths).toContain("shipping.department");
  });

  it("rechaza celulares que no son colombianos", () => {
    expect(phoneSchema.safeParse("6041234567").success).toBe(false);
    expect(phoneSchema.safeParse("30012345").success).toBe(false);
  });

  it("limpia caracteres de control", () => {
    const r = checkoutSchema.parse({ ...validCheckout, customerNotes: "Dejar en\u0000 portería" });
    expect(r.customerNotes).toBe("Dejar en portería");
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
    const r = catalogQuerySchema.parse({ linea: "hackeo", orden: "<script>", pagina: "-3", genero: "mujer", marca: "lattafa" });
    expect(r).toMatchObject({ linea: undefined, orden: "relevancia", pagina: 1, genero: "mujer", marca: ["lattafa"] });
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
