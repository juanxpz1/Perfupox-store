CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE TYPE "public"."variant_kind" AS ENUM('FRASCO', 'DECANT', 'PREPARADO');--> statement-breakpoint
ALTER TABLE "product_variants" DROP CONSTRAINT "variants_size_positive";--> statement-breakpoint
ALTER TABLE "product_variants" ALTER COLUMN "size_ml" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "concentration" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "kind" "variant_kind" DEFAULT 'FRASCO' NOT NULL;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "track_inventory" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "inspired_by" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "inspired_by_house" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "search_text" text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE INDEX "products_search_trgm_idx" ON "products" USING gin ("search_text" gin_trgm_ops);--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "variants_size_positive" CHECK ("product_variants"."size_ml" IS NULL OR "product_variants"."size_ml" > 0);