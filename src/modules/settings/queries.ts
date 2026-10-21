import "server-only";
import { connection } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { storeSettings } from "@/db/schema";

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  await connection();
  const [row] = await db.select({ value: storeSettings.value }).from(storeSettings).where(eq(storeSettings.key, key));
  return (row?.value as T | undefined) ?? fallback;
}

export async function announcements(): Promise<string[]> {
  const v = await getSetting<unknown>("announcements", []);
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, 5) : [];
}
