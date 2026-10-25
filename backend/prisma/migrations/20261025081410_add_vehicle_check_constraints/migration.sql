-- Database-level safety net (Prisma's schema file cannot express CHECK constraints).
-- Even if a bug slips past API validation, the database refuses impossible stock or prices.

-- Stock can never go below zero (protects purchase).
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_quantity_non_negative" CHECK ("quantity" >= 0);

-- Every vehicle must have a positive price.
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_price_positive" CHECK ("price" > 0);
