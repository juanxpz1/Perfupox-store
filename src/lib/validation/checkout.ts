import { z } from "zod";
import { cleanText, departmentSchema, documentSchema, emailSchema, phoneSchema, requiredText, uuidSchema } from "./common";

export const addressSchema = z.object({
  recipientName: requiredText(80, "Escribe el nombre de quien recibe."),
  phone: phoneSchema,
  department: departmentSchema,
  city: requiredText(60, "Escribe la ciudad o municipio."),
  line1: requiredText(120, "Escribe la dirección: calle, número y complemento."),
  line2: cleanText(120).optional(),
  neighborhood: cleanText(60).optional(),
  notes: cleanText(200).optional(),
});

/**
 * Lo que el navegador envía al confirmar la compra.
 * No incluye precios ni totales: el servidor los recalcula desde la base de datos.
 */
export const checkoutSchema = z.object({
  idempotencyKey: z.uuid(),
  email: emailSchema,
  customerName: requiredText(80, "Escribe tu nombre completo.").refine(
    (v) => v.split(" ").length >= 2,
    "Escribe nombre y apellido.",
  ),
  phone: phoneSchema,
  documentId: documentSchema,
  shipping: addressSchema,
  paymentMethod: z.enum(["TRANSFERENCIA_QR", "ADDI"], { message: "Elige un método de pago." }),
  couponCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]{3,30}$/, "El cupón usa letras, números y guiones.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  customerNotes: cleanText(300).optional(),
  acceptTerms: z.literal(true, { message: "Debes aceptar los términos y la política de datos para continuar." }),
  acceptMarketing: z.boolean().default(false),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const cartLineSchema = z.object({
  variantId: uuidSchema,
  quantity: z.number().int().min(1).max(10, "Máximo 10 unidades por producto."),
});
