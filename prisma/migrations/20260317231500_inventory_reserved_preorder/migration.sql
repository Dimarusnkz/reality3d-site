ALTER TABLE "ShopInventoryItem" ADD COLUMN IF NOT EXISTS "reserved" DECIMAL(18,3) NOT NULL DEFAULT 0;
ALTER TABLE "ShopProduct" ADD COLUMN IF NOT EXISTS "allowPreorder" BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE "ShopProduct" p
SET "stock" = GREATEST(0, FLOOR(COALESCE(i."quantity", 0) - COALESCE(i."reserved", 0))::INT)
FROM "ShopInventoryItem" i
WHERE i."productId" = p."id";

