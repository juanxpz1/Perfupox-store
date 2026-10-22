import { describe, expect, it } from "vitest";
import { integrations, serverEnv } from "@/config/env";

const base = { DATABASE_URL: "postgresql://u:p@localhost:5432/db" } as unknown as NodeJS.ProcessEnv;

describe("variables de entorno", () => {
  it("acepta .env.example copiado con los opcionales vacíos", () => {
    const env = serverEnv({ ...base, AUTH_SECRET: "", STORAGE_ENDPOINT: "", STORAGE_PUBLIC_URL: "  ", DATABASE_SSL: "" });
    expect(env.AUTH_SECRET).toBeUndefined();
    expect(env.STORAGE_ENDPOINT).toBeUndefined();
    expect(env.DATABASE_SSL).toBe(false);
    expect(integrations(env)).toEqual({ storage: false, email: false, auth: false });
  });

  it("sigue rechazando valores escritos pero inválidos", () => {
    expect(() => serverEnv({ ...base, AUTH_SECRET: "corta" })).toThrow(/AUTH_SECRET/);
    expect(() => serverEnv({ ...base, STORAGE_ENDPOINT: "no-es-url" })).toThrow(/STORAGE_ENDPOINT/);
    expect(() => serverEnv({ DATABASE_URL: "" } as unknown as NodeJS.ProcessEnv)).toThrow(/DATABASE_URL/);
  });
});
