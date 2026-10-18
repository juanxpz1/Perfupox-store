import { and, eq, gte, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { PgTransaction } from "drizzle-orm/pg-core";
import * as s from "@/db/schema";

type Executor = NodePgDatabase<typeof s> | PgTransaction<any, typeof s, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export class InsufficientStockError extends Error {
  constructor(readonly variantId: string) {
    super("No hay unidades suficientes para completar la compra.");
    this.name = "InsufficientStockError";
  }
}

/**
 * Descuenta unidades de forma atómica. La condición `stock >= qty` va en el mismo UPDATE,
 * así que dos compras simultáneas de la última unidad no pueden ganar ambas:
 * PostgreSQL bloquea la fila y la segunda ve el stock ya actualizado.
 * Debe ejecutarse dentro de la transacción que crea el pedido.
 */
export async function decrementStock(
  tx: Executor,
  args: { variantId: string; quantity: number; orderId?: string; userId?: string; reason?: string },
): Promise<number> {
  if (!Number.isInteger(args.quantity) || args.quantity <= 0) throw new RangeError("Cantidad inválida.");
  const [row] = await tx
    .update(s.productVariants)
    .set({ stock: sql`${s.productVariants.stock} - ${args.quantity}` })
    .where(
      and(
        eq(s.productVariants.id, args.variantId),
        eq(s.productVariants.isActive, true),
        gte(s.productVariants.stock, args.quantity),
      ),
    )
    .returning({ stock: s.productVariants.stock });
  if (!row) throw new InsufficientStockError(args.variantId);

  await tx.insert(s.inventoryMovements).values({
    variantId: args.variantId,
    type: "VENTA",
    quantity: -args.quantity,
    stockAfter: row.stock,
    orderId: args.orderId,
    userId: args.userId,
    reason: args.reason,
  });
  return row.stock;
}

/** Devuelve unidades al inventario (cancelación, devolución o entrada de mercancía). */
export async function incrementStock(
  tx: Executor,
  args: {
    variantId: string;
    quantity: number;
    type: "ENTRADA" | "DEVOLUCION" | "CANCELACION";
    orderId?: string;
    userId?: string;
    reason?: string;
  },
): Promise<number> {
  if (!Number.isInteger(args.quantity) || args.quantity <= 0) throw new RangeError("Cantidad inválida.");
  const [row] = await tx
    .update(s.productVariants)
    .set({ stock: sql`${s.productVariants.stock} + ${args.quantity}` })
    .where(eq(s.productVariants.id, args.variantId))
    .returning({ stock: s.productVariants.stock });
  if (!row) throw new Error("La presentación no existe.");
  await tx.insert(s.inventoryMovements).values({
    variantId: args.variantId,
    type: args.type,
    quantity: args.quantity,
    stockAfter: row.stock,
    orderId: args.orderId,
    userId: args.userId,
    reason: args.reason,
  });
  return row.stock;
}

/**
 * Ajuste manual desde el panel: fija el inventario a un valor y registra la diferencia,
 * con motivo y usuario responsable obligatorios.
 */
export async function adjustStock(
  tx: Executor,
  args: { variantId: string; newStock: number; userId: string; reason: string },
): Promise<number> {
  if (!Number.isInteger(args.newStock) || args.newStock < 0) throw new RangeError("El inventario no puede ser negativo.");
  if (!args.reason.trim()) throw new Error("El ajuste necesita un motivo.");
  const [current] = await tx
    .select({ stock: s.productVariants.stock })
    .from(s.productVariants)
    .where(eq(s.productVariants.id, args.variantId))
    .for("update");
  if (!current) throw new Error("La presentación no existe.");
  const diff = args.newStock - current.stock;
  if (diff === 0) return current.stock;
  await tx.update(s.productVariants).set({ stock: args.newStock }).where(eq(s.productVariants.id, args.variantId));
  await tx.insert(s.inventoryMovements).values({
    variantId: args.variantId,
    type: "AJUSTE",
    quantity: diff,
    stockAfter: args.newStock,
    userId: args.userId,
    reason: args.reason.trim(),
  });
  return args.newStock;
}
