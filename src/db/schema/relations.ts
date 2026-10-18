import { relations } from "drizzle-orm";
import { addresses, users } from "./users";
import {
  brands,
  categories,
  collections,
  olfactoryFamilies,
  productCategories,
  productCollections,
  productImages,
  products,
  productVariants,
} from "./catalog";
import {
  cartItems,
  carts,
  couponRedemptions,
  coupons,
  inventoryMovements,
  orderItems,
  orders,
  orderStatusHistory,
  paymentEvents,
  payments,
  shipments,
  shippingZones,
} from "./commerce";
import { favorites, reviews } from "./engagement";

export const usersRelations = relations(users, ({ many, one }) => ({
  addresses: many(addresses),
  orders: many(orders),
  cart: one(carts),
  favorites: many(favorites),
  reviews: many(reviews),
}));

export const addressesRelations = relations(addresses, ({ one }) => ({
  user: one(users, { fields: [addresses.userId], references: [users.id] }),
}));

export const brandsRelations = relations(brands, ({ many }) => ({ products: many(products) }));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, { fields: [categories.parentId], references: [categories.id], relationName: "tree" }),
  children: many(categories, { relationName: "tree" }),
  products: many(productCategories),
}));

export const familiesRelations = relations(olfactoryFamilies, ({ many }) => ({ products: many(products) }));

export const collectionsRelations = relations(collections, ({ many }) => ({ products: many(productCollections) }));

export const productsRelations = relations(products, ({ one, many }) => ({
  brand: one(brands, { fields: [products.brandId], references: [brands.id] }),
  family: one(olfactoryFamilies, { fields: [products.familyId], references: [olfactoryFamilies.id] }),
  variants: many(productVariants),
  images: many(productImages),
  categories: many(productCategories),
  collections: many(productCollections),
  reviews: many(reviews),
}));

export const variantsRelations = relations(productVariants, ({ one, many }) => ({
  product: one(products, { fields: [productVariants.productId], references: [products.id] }),
  images: many(productImages),
  movements: many(inventoryMovements),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, { fields: [productImages.productId], references: [products.id] }),
  variant: one(productVariants, { fields: [productImages.variantId], references: [productVariants.id] }),
}));

export const productCategoriesRelations = relations(productCategories, ({ one }) => ({
  product: one(products, { fields: [productCategories.productId], references: [products.id] }),
  category: one(categories, { fields: [productCategories.categoryId], references: [categories.id] }),
}));

export const productCollectionsRelations = relations(productCollections, ({ one }) => ({
  product: one(products, { fields: [productCollections.productId], references: [products.id] }),
  collection: one(collections, { fields: [productCollections.collectionId], references: [collections.id] }),
}));

export const cartsRelations = relations(carts, ({ one, many }) => ({
  user: one(users, { fields: [carts.userId], references: [users.id] }),
  items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, { fields: [cartItems.cartId], references: [carts.id] }),
  variant: one(productVariants, { fields: [cartItems.variantId], references: [productVariants.id] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  shippingZone: one(shippingZones, { fields: [orders.shippingZoneId], references: [shippingZones.id] }),
  items: many(orderItems),
  payments: many(payments),
  history: many(orderStatusHistory),
  shipment: one(shipments),
  couponRedemption: one(couponRedemptions),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  variant: one(productVariants, { fields: [orderItems.variantId], references: [productVariants.id] }),
}));

export const orderHistoryRelations = relations(orderStatusHistory, ({ one }) => ({
  order: one(orders, { fields: [orderStatusHistory.orderId], references: [orders.id] }),
  actor: one(users, { fields: [orderStatusHistory.actorId], references: [users.id] }),
}));

export const paymentsRelations = relations(payments, ({ one, many }) => ({
  order: one(orders, { fields: [payments.orderId], references: [orders.id] }),
  verifiedBy: one(users, { fields: [payments.verifiedById], references: [users.id] }),
  events: many(paymentEvents),
}));

export const paymentEventsRelations = relations(paymentEvents, ({ one }) => ({
  payment: one(payments, { fields: [paymentEvents.paymentId], references: [payments.id] }),
}));

export const shipmentsRelations = relations(shipments, ({ one }) => ({
  order: one(orders, { fields: [shipments.orderId], references: [orders.id] }),
}));

export const inventoryMovementsRelations = relations(inventoryMovements, ({ one }) => ({
  variant: one(productVariants, { fields: [inventoryMovements.variantId], references: [productVariants.id] }),
  user: one(users, { fields: [inventoryMovements.userId], references: [users.id] }),
  order: one(orders, { fields: [inventoryMovements.orderId], references: [orders.id] }),
}));

export const couponsRelations = relations(coupons, ({ many }) => ({ redemptions: many(couponRedemptions) }));

export const couponRedemptionsRelations = relations(couponRedemptions, ({ one }) => ({
  coupon: one(coupons, { fields: [couponRedemptions.couponId], references: [coupons.id] }),
  order: one(orders, { fields: [couponRedemptions.orderId], references: [orders.id] }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, { fields: [favorites.userId], references: [users.id] }),
  product: one(products, { fields: [favorites.productId], references: [products.id] }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  product: one(products, { fields: [reviews.productId], references: [products.id] }),
  user: one(users, { fields: [reviews.userId], references: [users.id] }),
  orderItem: one(orderItems, { fields: [reviews.orderItemId], references: [orderItems.id] }),
}));
