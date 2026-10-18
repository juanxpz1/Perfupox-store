import { z } from "zod";

/**
 * Variables de entorno del servidor, validadas al primer uso.
 * Si falta algo obligatorio la app falla al arrancar con un mensaje claro,
 * en lugar de fallar más tarde en medio de una compra.
 */
const bool = z
  .enum(["true", "false", "1", "0"])
  .optional()
  .transform((v) => v === "true" || v === "1");

const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url("DATABASE_URL debe ser una URL de PostgreSQL"),
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(50).default(10),
  DATABASE_SSL: bool,
  APP_URL: z.string().url().default("http://localhost:3000"),

  // Autenticación (Fase 4)
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET debe tener al menos 32 caracteres").optional(),

  // Addi (Fase 5). Si faltan, el método Addi queda desactivado.
  ADDI_CLIENT_ID: z.string().optional(),
  ADDI_CLIENT_SECRET: z.string().optional(),
  ADDI_ALLY_SLUG: z.string().optional(),
  ADDI_ENVIRONMENT: z.enum(["staging", "production"]).default("staging"),
  ADDI_CALLBACK_SECRET: z.string().optional(),

  // Almacenamiento de imágenes y comprobantes (Fase 5/6)
  STORAGE_BUCKET: z.string().optional(),
  STORAGE_ENDPOINT: z.string().url().optional(),
  STORAGE_ACCESS_KEY_ID: z.string().optional(),
  STORAGE_SECRET_ACCESS_KEY: z.string().optional(),
  STORAGE_PUBLIC_URL: z.string().url().optional(),

  // Correo transaccional (Fase 5)
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | undefined;

export function serverEnv(source: NodeJS.ProcessEnv = process.env): ServerEnv {
  if (cached && source === process.env) return cached;
  const parsed = serverSchema.safeParse(source);
  if (!parsed.success) {
    const detail = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Configuración inválida en variables de entorno:\n${detail}`);
  }
  if (source === process.env) cached = parsed.data;
  return parsed.data;
}

/** Qué integraciones externas tienen credenciales completas. Lo que no esté listo se oculta en la tienda. */
export function integrations(env: ServerEnv = serverEnv()) {
  return {
    addi: Boolean(env.ADDI_CLIENT_ID && env.ADDI_CLIENT_SECRET && env.ADDI_ALLY_SLUG && env.ADDI_CALLBACK_SECRET),
    storage: Boolean(env.STORAGE_BUCKET && env.STORAGE_ACCESS_KEY_ID && env.STORAGE_SECRET_ACCESS_KEY),
    email: Boolean(env.RESEND_API_KEY && env.EMAIL_FROM),
    auth: Boolean(env.AUTH_SECRET),
  };
}
