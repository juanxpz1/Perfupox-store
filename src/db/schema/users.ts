import { boolean, index, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createdAt, id, tsz, updatedAt } from "./_helpers";
import { roleEnum } from "./enums";

export const users = pgTable(
  "users",
  {
    id: id(),
    email: text().notNull(),
    name: text().notNull(),
    phone: text(),
    documentId: text(),
    /** Hash argon2id. Nunca se guarda la contraseña. */
    passwordHash: text(),
    role: roleEnum().notNull().default("CUSTOMER"),
    emailVerifiedAt: tsz(),
    isActive: boolean().notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("users_email_lower_uq").on(sql`lower(${t.email})`), index("users_role_idx").on(t.role)],
);

export const addresses = pgTable(
  "addresses",
  {
    id: id(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    label: text(),
    recipientName: text().notNull(),
    phone: text().notNull(),
    department: text().notNull(),
    city: text().notNull(),
    line1: text().notNull(),
    line2: text(),
    neighborhood: text(),
    notes: text(),
    isDefault: boolean().notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("addresses_user_idx").on(t.userId)],
);
