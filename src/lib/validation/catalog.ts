import { z } from "zod";
import { cleanText, copSchema, positiveCopSchema, requiredText, slugSchema, uuidSchema } from "./common";

const notesSchema = z
  .array(requiredText(60))
  .max(12, "Máximo 12 notas por nivel.")
  .transform((arr) => [...new Set(arr)]);

export const variantInputSchema = z
  .object({
    id: uuidSchema.optional(),
    sku: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9][A-Z0-9-]{2,39}$/, "El SKU usa letras, números y guiones, de 3 a 40 caracteres."),
    kind: z.enum(["FRASCO", "DECANT", "PREPARADO"]).default("FRASCO"),
    sizeMl: z.number().int().min(1, "El tamaño debe ser mayor que cero.").max(1000).nullable(),
    label: cleanText(60).optional(),
    price: positiveCopSchema,
    compareAtPrice: copSchema.nullable().optional(),
    stock: z.number().int().min(0, "El inventario no puede ser negativo.").default(0),
    trackInventory: z.boolean().default(true),
    lowStockThreshold: z.number().int().min(0).max(1000).default(3),
    isActive: z.boolean().default(true),
  })
  .refine((v) => v.compareAtPrice == null || v.compareAtPrice > v.price, {
    path: ["compareAtPrice"],
    message: "El precio anterior debe ser mayor que el precio de venta para mostrar una promoción.",
  });

export const productInputSchema = z
  .object({
    name: requiredText(120, "Escribe el nombre comercial."),
    slug: slugSchema.optional(),
    brandId: uuidSchema,
    line: z.enum(["ARABE", "DISENADOR", "NICHO", "PREPARADA"]),
    gender: z.enum(["HOMBRE", "MUJER", "UNISEX"]),
    concentration: z.enum(["EAU_DE_COLOGNE", "EAU_DE_TOILETTE", "EAU_DE_PARFUM", "PARFUM", "EXTRAIT", "OTRA"]).nullable().default(null),
    inspiredBy: cleanText(120).optional(),
    inspiredByHouse: cleanText(80).optional(),
    familyId: uuidSchema.nullable().optional(),
    shortDescription: cleanText(280).optional(),
    description: cleanText(5000).optional(),
    topNotes: notesSchema.default([]),
    heartNotes: notesSchema.default([]),
    baseNotes: notesSchema.default([]),
    countryOfOrigin: cleanText(60).optional(),
    isActive: z.boolean().default(false),
    isFeatured: z.boolean().default(false),
    isNew: z.boolean().default(false),
    categoryIds: z.array(uuidSchema).max(10).default([]),
    variants: z.array(variantInputSchema).min(1, "Agrega al menos una presentación con precio e inventario."),
  })
  .superRefine((p, ctx) => {
    if (p.line === "PREPARADA" && !p.inspiredBy)
      ctx.addIssue({ code: "custom", path: ["inspiredBy"], message: "Indica en qué perfume está inspirada la preparada." });
    if (p.line !== "PREPARADA" && p.inspiredBy)
      ctx.addIssue({ code: "custom", path: ["inspiredBy"], message: "Solo la perfumería preparada lleva perfume de referencia." });
    const skus = p.variants.map((v) => v.sku);
    const dup = skus.find((s, i) => skus.indexOf(s) !== i);
    if (dup) ctx.addIssue({ code: "custom", path: ["variants"], message: `El SKU ${dup} está repetido.` });
  });

export type ProductInput = z.infer<typeof productInputSchema>;
export type VariantInput = z.infer<typeof variantInputSchema>;

/** Filtros del catálogo leídos desde la URL. Todo lo desconocido se ignora en lugar de fallar. */
const multi = <T extends z.ZodTypeAny>(item: T) =>
  z
    .union([item, z.array(item)])
    .transform((v) => (Array.isArray(v) ? v : [v]) as z.infer<T>[])
    .optional()
    .catch(undefined);

export const catalogQuerySchema = z.object({
  q: cleanText(60).optional().catch(undefined),
  linea: z.enum(["arabe", "disenador", "nicho", "preparada"]).optional().catch(undefined),
  genero: z.enum(["hombre", "mujer", "unisex"]).optional().catch(undefined),
  marca: multi(slugSchema),
  /** "decant": solo originales con decants disponibles. */
  formato: z.enum(["decant", "frasco"]).optional().catch(undefined),
  min: z.coerce.number().int().min(0).max(100_000_000).optional().catch(undefined),
  max: z.coerce.number().int().min(0).max(100_000_000).optional().catch(undefined),
  orden: z.enum(["relevancia", "precio-asc", "precio-desc", "novedades", "nombre"]).default("relevancia").catch("relevancia"),
  pagina: z.coerce.number().int().min(1).max(500).default(1).catch(1),
});

export type CatalogQuery = z.infer<typeof catalogQuerySchema>;
