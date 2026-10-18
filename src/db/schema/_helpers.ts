import { timestamp, uuid } from "drizzle-orm/pg-core";

/** Clave primaria UUID generada por PostgreSQL. */
export const id = () => uuid().primaryKey().defaultRandom();

export const createdAt = () => timestamp({ withTimezone: true }).notNull().defaultNow();

export const updatedAt = () =>
  timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

export const tsz = () => timestamp({ withTimezone: true });
