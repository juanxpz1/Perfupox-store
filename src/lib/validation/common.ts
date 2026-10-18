import { z } from "zod";
import { DEPARTMENTS } from "@/lib/colombia";

/** Texto sin caracteres de control y sin espacios sobrantes. */
export const cleanText = (max: number) =>
  z
    .string()
    .transform((s) => s.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim())
    .pipe(z.string().max(max, `Máximo ${max} caracteres.`));

export const requiredText = (max: number, message = "Este campo es obligatorio.") =>
  cleanText(max).pipe(z.string().min(1, message));

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Escribe un correo válido, por ejemplo nombre@correo.com.").max(120));

/** Celular colombiano: 10 dígitos que empiezan por 3. Acepta espacios, guiones y el prefijo +57. */
export const phoneSchema = z
  .string()
  .transform((s) => s.replace(/[\s\-().]/g, "").replace(/^\+?57(?=3\d{9}$)/, ""))
  .pipe(z.string().regex(/^3\d{9}$/, "Escribe un celular de 10 dígitos que empiece por 3."));

/** Cédula u otro documento numérico, sin puntos. */
export const documentSchema = z
  .string()
  .transform((s) => s.replace(/[.\s-]/g, ""))
  .pipe(z.string().regex(/^\d{5,12}$/, "Escribe el número de documento sin puntos, entre 5 y 12 dígitos."));

export const departmentSchema = z.enum(DEPARTMENTS, { message: "Elige un departamento de la lista." });

export const copSchema = z
  .number({ message: "Escribe un valor en pesos." })
  .int("Los precios van en pesos enteros, sin decimales.")
  .min(0)
  .max(100_000_000, "El valor es demasiado alto.");

export const positiveCopSchema = copSchema.refine((v) => v > 0, "El valor debe ser mayor que cero.");

export const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Usa solo minúsculas, números y guiones.")
  .max(80);

export const uuidSchema = z.uuid("Identificador inválido.");
