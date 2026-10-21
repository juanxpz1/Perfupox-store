/**
 * Pruebas contra PostgreSQL real. Usan una base de datos aparte (TEST_DATABASE_URL),
 * la recrean desde cero y aplican las migraciones versionadas.
 * Si TEST_DATABASE_URL no está definida, se omiten.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { eq, sql } from "drizzle-orm";
import * as s from "@/db/schema";
import { adjustStock, decrementStock, incrementStock, InsufficientStockError } from "@/modules/inventory/stock";

const url = process.env.TEST_DATABASE_URL;
const suite = url ? describe : describe.skip;

suite("base de datos", () => {
  let pool: Pool;
  let db: ReturnType<typeof drizzle<typeof s>>;
  let variantId: string;
  let brandId: string;

  beforeAll(async () => {
    pool = new Pool({ connectionString: url, max: 6 });
    await pool.query("DROP SCHEMA IF EXISTS public CASCADE; DROP SCHEMA IF EXISTS drizzle CASCADE; CREATE SCHEMA public;");
    db = drizzle(pool, { schema: s, casing: "snake_case" });
    await migrate(db, { migrationsFolder: "./drizzle" });

    const [brand] = await db.insert(s.brands).values({ name: "Prueba", slug: "prueba" }).returning();
    brandId = brand.id;
    const [product] = await db
      .insert(s.products)
      .values({ slug: "p1", name: "P1", brandId, line: "ARABE", gender: "UNISEX", concentration: "EAU_DE_PARFUM" })
      .returning();
    const [variant] = await db
      .insert(s.productVariants)
      .values({ productId: product.id, sku: "T-1", sizeMl: 100, price: 100_000, stock: 1 })
      .returning();
    variantId = variant.id;
  });

  afterAll(async () => {
    await pool?.end();
  });

  const rejects = async (p: Promise<unknown>, constraint: string) => {
    const err = await p.then(
      () => null,
      (e: { cause?: { constraint?: string; code?: string } }) => e,
    );
    expect(err, `se esperaba violar ${constraint}`).not.toBeNull();
    expect(err!.cause?.constraint ?? err!.cause?.code).toBe(constraint);
  };

  it("no permite precios en cero, inventario negativo ni precio anterior menor", async () => {
    const [product] = await db.select().from(s.products).limit(1);
    await rejects(db.insert(s.productVariants).values({ productId: product.id, sku: "X0", sizeMl: 50, price: 0 }), "variants_price_positive");
    await rejects(db.update(s.productVariants).set({ stock: -1 }).where(eq(s.productVariants.id, variantId)), "variants_stock_non_negative");
    await rejects(
      db.insert(s.productVariants).values({ productId: product.id, sku: "X1", sizeMl: 50, price: 100, compareAtPrice: 90 }),
      "variants_compare_at_gt_price",
    );
  });

  it("no permite SKU ni correos duplicados (sin importar mayúsculas)", async () => {
    const [product] = await db.select().from(s.products).limit(1);
    await rejects(db.insert(s.productVariants).values({ productId: product.id, sku: "T-1", sizeMl: 10, price: 10 }), "product_variants_sku_unique");
    await db.insert(s.users).values({ email: "ana@correo.com", name: "Ana" });
    await rejects(db.insert(s.users).values({ email: "ANA@correo.com", name: "Ana 2" }), "users_email_lower_uq");
  });

  it("exige totales coherentes en el pedido y en sus líneas", async () => {
    const base = {
      email: "c@c.co", customerName: "C C", phone: "3000000000", paymentMethod: "TRANSFERENCIA_QR" as const,
      shipRecipient: "C", shipPhone: "3000000000", shipDepartment: "Córdoba", shipCity: "Montería", shipLine1: "Calle 1",
      shippingLabel: "Nacional",
    };
    await rejects(
      db.insert(s.orders).values({ ...base, idempotencyKey: "k1", subtotal: 100, discountTotal: 0, shippingTotal: 10, total: 999 }),
      "orders_totals_consistent",
    );
    const [order] = await db
      .insert(s.orders)
      .values({ ...base, idempotencyKey: "k2", subtotal: 100, discountTotal: 10, shippingTotal: 5, total: 95 })
      .returning();
    expect(order.number).toBeGreaterThanOrEqual(1001);
    await rejects(
      db.insert(s.orderItems).values({ orderId: order.id, productName: "P", brandName: "B", line: "ARABE", variantName: "100 ml", sku: "T-1", unitPrice: 50, quantity: 2, lineTotal: 99 }),
      "order_items_line_total",
    );
    // Clave de idempotencia repetida: el segundo intento no crea otro pedido.
    await rejects(
      db.insert(s.orders).values({ ...base, idempotencyKey: "k2", subtotal: 100, discountTotal: 10, shippingTotal: 5, total: 95 }),
      "orders_idempotencyKey_unique",
    );
  });

  it("no procesa dos veces la misma notificación del proveedor de pagos", async () => {
    const ev = { provider: "ADDI", eventId: "evt-1", type: "APPROVED", signatureValid: true, payload: {} };
    await db.insert(s.paymentEvents).values(ev);
    await rejects(db.insert(s.paymentEvents).values(ev), "payment_events_provider_event_uq");
  });

  it("valida cupones en mayúsculas y porcentajes entre 1 y 100", async () => {
    await rejects(db.insert(s.coupons).values({ code: "hola", type: "VALOR_FIJO", value: 1000 }), "coupons_code_upper");
    await rejects(db.insert(s.coupons).values({ code: "PCT", type: "PORCENTAJE", value: 150 }), "coupons_value_valid");
  });

  it("dos compras simultáneas de la última unidad: solo una gana", async () => {
    const attempt = () =>
      db.transaction(async (tx) => {
        await decrementStock(tx, { variantId, quantity: 1 });
        // Simula el resto del trabajo de crear el pedido mientras la fila sigue bloqueada.
        await tx.execute(sql`select pg_sleep(0.15)`);
      });
    const results = await Promise.allSettled([attempt(), attempt(), attempt()]);
    const ok = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected");
    expect(ok).toBe(1);
    expect(failed).toHaveLength(2);
    for (const f of failed) expect((f as PromiseRejectedResult).reason).toBeInstanceOf(InsufficientStockError);

    const [v] = await db.select({ stock: s.productVariants.stock }).from(s.productVariants).where(eq(s.productVariants.id, variantId));
    expect(v.stock).toBe(0);
  });

  it("registra cada movimiento de inventario con el saldo resultante", async () => {
    const [admin] = await db.insert(s.users).values({ email: "admin@perfupox.co", name: "Admin", role: "ADMIN" }).returning();
    await db.transaction((tx) => incrementStock(tx, { variantId, quantity: 5, type: "ENTRADA", userId: admin.id, reason: "Compra a proveedor" }));
    await db.transaction((tx) => adjustStock(tx, { variantId, newStock: 3, userId: admin.id, reason: "Conteo físico" }));
    await expect(db.transaction((tx) => adjustStock(tx, { variantId, newStock: 2, userId: admin.id, reason: "  " }))).rejects.toThrow(
      "motivo",
    );

    const moves = await db
      .select({ type: s.inventoryMovements.type, quantity: s.inventoryMovements.quantity, stockAfter: s.inventoryMovements.stockAfter })
      .from(s.inventoryMovements)
      .where(eq(s.inventoryMovements.variantId, variantId))
      .orderBy(s.inventoryMovements.createdAt);
    expect(moves).toEqual([
      { type: "VENTA", quantity: -1, stockAfter: 0 },
      { type: "ENTRADA", quantity: 5, stockAfter: 5 },
      { type: "AJUSTE", quantity: -2, stockAfter: 3 },
    ]);
  });

  it("no permite borrar una marca con productos", async () => {
    await rejects(db.delete(s.brands).where(eq(s.brands.id, brandId)), "products_brand_id_brands_id_fk");
  });

  it("con disponibilidad manual vende sin descontar unidades, y nada si está desactivada", async () => {
    const [product] = await db.select().from(s.products).limit(1);
    const [v] = await db
      .insert(s.productVariants)
      .values({ productId: product.id, sku: "T-DEC-5", kind: "DECANT", sizeMl: 5, price: 15_000, stock: 0, trackInventory: false })
      .returning();
    await expect(db.transaction((tx) => decrementStock(tx, { variantId: v.id, quantity: 3 }))).resolves.toBeNull();
    const [after] = await db.select({ stock: s.productVariants.stock }).from(s.productVariants).where(eq(s.productVariants.id, v.id));
    expect(after.stock).toBe(0);
    const moves = await db.select().from(s.inventoryMovements).where(eq(s.inventoryMovements.variantId, v.id));
    expect(moves).toHaveLength(0);
    await db.update(s.productVariants).set({ isActive: false }).where(eq(s.productVariants.id, v.id));
    await expect(db.transaction((tx) => decrementStock(tx, { variantId: v.id, quantity: 1 }))).rejects.toBeInstanceOf(InsufficientStockError);
  });

  it("permite frascos sin tamaño conocido pero no tamaños en cero", async () => {
    const [product] = await db.select().from(s.products).limit(1);
    await db.insert(s.productVariants).values({ productId: product.id, sku: "T-F-NULL", price: 100_000 });
    await rejects(db.insert(s.productVariants).values({ productId: product.id, sku: "T-F-0", sizeMl: 0, price: 100_000 }), "variants_size_positive");
  });
});
