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
    sizeMl: z.number().int().min(1, "El tamaño debe ser mayor que cero.").max(1000),
    label: cleanText(60).optional(),
    price: positiveCopSchema,
    compareAtPrice: copSchema.nullable().optional(),
    stock: z.number().int().min(0, "El inventario no puede ser negativo."),
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
    concentration: z.enum(["EAU_DE_COLOGNE", "EAU_DE_TOILETTE", "EAU_DE_PARFUM", "PARFUM", "EXTRAIT", "OTRA"]),
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
    const skus = p.variants.map((v) => v.sku);
    const dup = skus.find((s, i) => skus.indexOf(s) !== i);
    if (dup) ctx.addIssue({ code: "custom", path: ["variants"], message: `El SKU ${dup} está repetido.` });
  });

export type ProductInput = z.infer<typeof productInputSchema>;
export type VariantInput = z.infer<typeof variantInputSchema>;

/** Filtros del catálogo leídos desde la URL. Todo lo desconocido se ignora en lugar de fallar. */
export const catalogQuerySchema = z.object({
  q: cleanText(60).optional().catch(undefined),
  linea: z.enum(["arabe", "disenador", "nicho", "preparada"]).optional().catch(undefined),
  genero: z.enum(["hombre", "mujer", "unisex"]).optional().catch(undefined),
  familia: slugSchema.optional().catch(undefined),
  marca: z
    .union([slugSchema, z.array(slugSchema)])
    .transform((v) => (Array.isArray(v) ? v : [v]))
    .optional()
    .catch(undefined),
  min: z.coerce.number().int().min(0).optional().catch(undefined),
  max: z.coerce.number().int().min(0).optional().catch(undefined),
  disponible: z
    .enum(["1"])
    .transform(() => true)
    .optional()
    .catch(undefined),
  orden: z.enum(["relevancia", "precio-asc", "precio-desc", "novedades", "populares"]).default("relevancia").catch("relevancia"),
  pagina: z.coerce.number().int().min(1).max(500).default(1).catch(1),
});

export type CatalogQuery = z.infer<typeof catalogQuerySchema>;
