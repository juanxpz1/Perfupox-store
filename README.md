# Perfupox · Perfume Store

Tienda en línea de Perfupox: perfumería árabe, de diseñador, nicho (próximamente) y perfumería preparada.
Pesos colombianos, español de Colombia, pagos por transferencia QR y a cuotas con Addi.

## Estado del proyecto

| Fase | Contenido | Estado |
|---|---|---|
| 1 | Diagnóstico y arquitectura | Hecha |
| 2 | Sistema visual y prototipo navegable | Hecha |
| 3 | Proyecto, base de datos, migraciones, validaciones y configuración | **Hecha** |
| 4 | Tienda pública: inicio, catálogo, filtros, búsqueda, ficha, cuentas | Pendiente |
| 5 | Carrito, checkout, pedidos, pago QR, Addi y envíos | Pendiente |
| 6 | Panel administrativo | Pendiente |
| 7 | Calidad, accesibilidad y rendimiento | Pendiente |
| 8 | Despliegue y documentación final | Pendiente |

## Tecnologías

| Pieza | Elección | Motivo |
|---|---|---|
| Framework | Next.js 16 (App Router, Cache Components) + React 19 + TypeScript | Páginas renderizadas en servidor para SEO; tienda y API en un solo proyecto |
| Estilos | Tailwind CSS 4 con los tokens del sistema visual | Identidad propia, sin plantillas |
| Base de datos | PostgreSQL 16 | Transacciones reales para inventario y pedidos |
| Acceso a datos | Drizzle ORM + node-postgres | TypeScript puro, sin binarios externos, migraciones SQL versionadas y legibles |
| Validación | Zod 4 | Las mismas reglas en el navegador y en el servidor |
| Pruebas | Vitest (unitarias y contra PostgreSQL real) | Rápidas y sin dependencias de navegador |
| Tipografía | San Francisco en Apple, Inter autoalojada en Android y Windows | Sin peticiones a servidores externos de fuentes |
| Hosting | Railway (app + PostgreSQL) | Despliegue desde GitHub con migración automática |

## Estructura

```
src/
  app/                 rutas de Next.js (tienda, cuenta y panel se agregan en las fases 4 a 6)
  config/
    env.ts             variables de entorno validadas; detecta qué integraciones tienen credenciales
    store.ts           identidad de la marca y valores por defecto
  db/
    schema/            tablas, enumeraciones y relaciones
    client.ts          conexión única de la app (solo servidor)
  lib/
    money.ts           pesos colombianos como enteros, formato $389.000, número PX-001001
    validation/        esquemas Zod de catálogo, checkout y datos colombianos
    colombia.ts        departamentos
  modules/
    pricing/           cálculo de totales, cupones y zonas de envío (función pura)
    orders/status.ts   flujo de estados del pedido y quién puede cambiarlos
    inventory/stock.ts descuentos, devoluciones y ajustes de inventario atómicos con registro
drizzle/               migraciones SQL versionadas
scripts/               migrar, cargar datos iniciales y borrar la demostración
tests/                 pruebas unitarias y de base de datos
public/brand/          logotipo en versiones oro, tinta, monograma y horizontal
```

## Reglas de negocio clave

- **Dinero en enteros.** Precios, descuentos y totales son pesos enteros. La base de datos rechaza un pedido cuyo total no sea `subtotal − descuento + envío`.
- **El servidor calcula todo.** El checkout recibe productos y cantidades, nunca precios ni totales. `modules/pricing` recalcula con datos de la base.
- **Inventario sin sobreventa.** Las unidades se descuentan al crear el pedido con un `UPDATE … WHERE stock >= cantidad` dentro de la transacción. Probado con tres compras simultáneas de la última unidad: solo una gana. Si el pedido vence sin pago (24 h) o se cancela antes del envío, las unidades vuelven.
- **Pago por QR.** El pedido queda en «pendiente de pago». El cliente sube el comprobante y pasa a «pago en verificación». Solo el personal puede confirmarlo.
- **Pago con Addi.** Solo se confirma con la notificación firmada de Addi. Volver a la página de éxito no marca nada como pagado. Cada notificación se guarda una sola vez por su identificador.
- **Historial congelado.** Las líneas del pedido copian nombre, marca, SKU y precio.
- **Pedidos sin duplicados.** Cada checkout lleva una clave de idempotencia única.
- **Reseñas verificadas.** Una reseña por artículo comprado.
- **Datos de demostración identificados.** Marcas y productos de ejemplo tienen `is_demo = true` y nombre con «(demo)».

## Instalación local

Requisitos: Node.js 22.12 o superior y PostgreSQL 16.

```bash
git clone https://github.com/juanxpz1/Perfupox-store.git
cd Perfupox-store
npm install
cp .env.example .env          # completa DATABASE_URL y TEST_DATABASE_URL
npm run db:migrate            # crea las tablas
npm run db:seed               # configuración base + catálogo de demostración
npm run dev                   # http://localhost:3000
```

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `npm start` | Compilación y servidor de producción |
| `npm run lint` / `npm run typecheck` | ESLint y TypeScript |
| `npm test` | Pruebas. Las de base de datos corren si `TEST_DATABASE_URL` está definida |
| `npm run check` | Todo lo anterior en orden |
| `npm run db:generate` | Genera una migración nueva tras cambiar `src/db/schema` |
| `npm run db:migrate` | Aplica migraciones pendientes |
| `npm run db:seed` | Datos iniciales (idempotente). `SEED_DEMO=false` omite la demostración |
| `npm run db:purge-demo -- --confirmar` | Borra productos, marcas y zonas de demostración |

## Despliegue en Railway

1. En Railway, crea un proyecto nuevo y elige **Deploy from GitHub repo** con `juanxpz1/Perfupox-store`.
2. Agrega un servicio **PostgreSQL** al mismo proyecto.
3. En las variables del servicio de la app, crea `DATABASE_URL` con el valor `${{Postgres.DATABASE_URL}}` y `APP_URL` con el dominio de la tienda.
4. `railway.json` ya define la compilación, la migración automática antes de cada despliegue y el arranque.
5. Para cargar la configuración inicial una vez: desde la terminal de Railway, `npm run db:seed` (con `SEED_DEMO=false` en producción).

## Pendiente de confirmar por el propietario

- Razón social, NIT, correo, WhatsApp, dirección y horario (`src/config/store.ts`).
- Datos de la cuenta y código QR para transferencias.
- Cuenta de comercio aliado con Addi y sus credenciales.
- Textos legales: términos, tratamiento de datos (Ley 1581 de 2012), cambios, devoluciones y retracto. Se crean como borradores sin publicar.
- Zonas, tarifas y tiempos reales de envío (las actuales dicen «ejemplo»).
- Listado de marcas e inventario real.
