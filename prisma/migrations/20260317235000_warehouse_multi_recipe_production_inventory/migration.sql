CREATE TABLE IF NOT EXISTS "Warehouse" (
  "id" SERIAL NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Warehouse_code_key" ON "Warehouse"("code");

INSERT INTO "Warehouse" ("code", "name")
VALUES ('main', 'Основной')
ON CONFLICT ("code") DO NOTHING;

CREATE TABLE IF NOT EXISTS "WarehouseLocation" (
  "id" SERIAL NOT NULL,
  "warehouseId" INTEGER NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WarehouseLocation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "WarehouseLocation_warehouseId_code_key" ON "WarehouseLocation"("warehouseId","code");
CREATE INDEX IF NOT EXISTS "WarehouseLocation_warehouseId_idx" ON "WarehouseLocation"("warehouseId");

DO $$ BEGIN
  ALTER TABLE "WarehouseLocation" ADD CONSTRAINT "WarehouseLocation_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "ShopProduct" ADD COLUMN IF NOT EXISTS "itemType" TEXT NOT NULL DEFAULT 'product';
CREATE INDEX IF NOT EXISTS "ShopProduct_itemType_idx" ON "ShopProduct"("itemType");

ALTER TABLE "ShopInventoryItem" ADD COLUMN IF NOT EXISTS "warehouseId" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "ShopInventoryItem" ADD COLUMN IF NOT EXISTS "locationId" INTEGER;

UPDATE "ShopInventoryItem"
SET "warehouseId" = (SELECT "id" FROM "Warehouse" WHERE "code" = 'main' LIMIT 1)
WHERE "warehouseId" IS NULL OR "warehouseId" = 1;

DROP INDEX IF EXISTS "ShopInventoryItem_productId_key";

CREATE INDEX IF NOT EXISTS "ShopInventoryItem_warehouseId_idx" ON "ShopInventoryItem"("warehouseId");
DO $$ BEGIN
  CREATE UNIQUE INDEX "ShopInventoryItem_productId_warehouseId_key" ON "ShopInventoryItem"("productId","warehouseId");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ShopInventoryItem" ADD CONSTRAINT "ShopInventoryItem_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ShopInventoryItem" ADD CONSTRAINT "ShopInventoryItem_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "WarehouseLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "ShopWarehouseLog" ADD COLUMN IF NOT EXISTS "warehouseId" INTEGER DEFAULT 1;
ALTER TABLE "ShopWarehouseLog" ADD COLUMN IF NOT EXISTS "locationId" INTEGER;

DO $$ BEGIN
  ALTER TABLE "ShopWarehouseLog" ADD CONSTRAINT "ShopWarehouseLog_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ShopWarehouseLog" ADD CONSTRAINT "ShopWarehouseLog_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "WarehouseLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "WarehouseReceipt" ADD COLUMN IF NOT EXISTS "warehouseId" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "WarehouseReceipt" ADD COLUMN IF NOT EXISTS "locationId" INTEGER;

UPDATE "WarehouseReceipt"
SET "warehouseId" = (SELECT "id" FROM "Warehouse" WHERE "code" = 'main' LIMIT 1)
WHERE true;

CREATE INDEX IF NOT EXISTS "WarehouseReceipt_warehouseId_receivedAt_idx" ON "WarehouseReceipt"("warehouseId","receivedAt");

DO $$ BEGIN
  ALTER TABLE "WarehouseReceipt" ADD CONSTRAINT "WarehouseReceipt_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "WarehouseReceipt" ADD CONSTRAINT "WarehouseReceipt_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "WarehouseLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "WarehouseRecipe" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "productId" INTEGER NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WarehouseRecipe_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "WarehouseRecipe_productId_key" ON "WarehouseRecipe"("productId");

DO $$ BEGIN
  ALTER TABLE "WarehouseRecipe" ADD CONSTRAINT "WarehouseRecipe_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ShopProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "WarehouseRecipeItem" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "recipeId" UUID NOT NULL,
  "materialProductId" INTEGER NOT NULL,
  "quantity" DECIMAL(18,3) NOT NULL,
  "unit" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WarehouseRecipeItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "WarehouseRecipeItem_recipeId_idx" ON "WarehouseRecipeItem"("recipeId");
CREATE INDEX IF NOT EXISTS "WarehouseRecipeItem_materialProductId_idx" ON "WarehouseRecipeItem"("materialProductId");

DO $$ BEGIN
  ALTER TABLE "WarehouseRecipeItem" ADD CONSTRAINT "WarehouseRecipeItem_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "WarehouseRecipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "WarehouseRecipeItem" ADD CONSTRAINT "WarehouseRecipeItem_materialProductId_fkey" FOREIGN KEY ("materialProductId") REFERENCES "ShopProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "WarehouseProductionOrder" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "warehouseId" INTEGER NOT NULL,
  "productId" INTEGER NOT NULL,
  "quantity" DECIMAL(18,3) NOT NULL,
  "unit" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "comment" TEXT,
  "createdByUserId" INTEGER,
  "postedAt" TIMESTAMP(3),
  "postedByUserId" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WarehouseProductionOrder_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "WarehouseProductionOrder_warehouseId_createdAt_idx" ON "WarehouseProductionOrder"("warehouseId","createdAt");
CREATE INDEX IF NOT EXISTS "WarehouseProductionOrder_status_createdAt_idx" ON "WarehouseProductionOrder"("status","createdAt");

DO $$ BEGIN
  ALTER TABLE "WarehouseProductionOrder" ADD CONSTRAINT "WarehouseProductionOrder_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "WarehouseProductionOrder" ADD CONSTRAINT "WarehouseProductionOrder_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ShopProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "WarehouseProductionOrder" ADD CONSTRAINT "WarehouseProductionOrder_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "WarehouseProductionOrder" ADD CONSTRAINT "WarehouseProductionOrder_postedByUserId_fkey" FOREIGN KEY ("postedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "WarehouseProductionConsumeItem" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "productionId" UUID NOT NULL,
  "materialProductId" INTEGER NOT NULL,
  "quantity" DECIMAL(18,3) NOT NULL,
  "unit" TEXT NOT NULL,
  "unitCostKopeks" INTEGER,
  "totalCostKopeks" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WarehouseProductionConsumeItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "WarehouseProductionConsumeItem_productionId_idx" ON "WarehouseProductionConsumeItem"("productionId");
CREATE INDEX IF NOT EXISTS "WarehouseProductionConsumeItem_materialProductId_idx" ON "WarehouseProductionConsumeItem"("materialProductId");

DO $$ BEGIN
  ALTER TABLE "WarehouseProductionConsumeItem" ADD CONSTRAINT "WarehouseProductionConsumeItem_productionId_fkey" FOREIGN KEY ("productionId") REFERENCES "WarehouseProductionOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "WarehouseProductionConsumeItem" ADD CONSTRAINT "WarehouseProductionConsumeItem_materialProductId_fkey" FOREIGN KEY ("materialProductId") REFERENCES "ShopProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "WarehouseInventoryCount" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "warehouseId" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "comment" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdByUserId" INTEGER,
  "postedAt" TIMESTAMP(3),
  "postedByUserId" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WarehouseInventoryCount_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "WarehouseInventoryCount_warehouseId_startedAt_idx" ON "WarehouseInventoryCount"("warehouseId","startedAt");
CREATE INDEX IF NOT EXISTS "WarehouseInventoryCount_status_startedAt_idx" ON "WarehouseInventoryCount"("status","startedAt");

DO $$ BEGIN
  ALTER TABLE "WarehouseInventoryCount" ADD CONSTRAINT "WarehouseInventoryCount_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "WarehouseInventoryCount" ADD CONSTRAINT "WarehouseInventoryCount_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "WarehouseInventoryCount" ADD CONSTRAINT "WarehouseInventoryCount_postedByUserId_fkey" FOREIGN KEY ("postedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "WarehouseInventoryCountItem" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "inventoryId" UUID NOT NULL,
  "productId" INTEGER NOT NULL,
  "expectedQty" DECIMAL(18,3) NOT NULL,
  "countedQty" DECIMAL(18,3) NOT NULL,
  "delta" DECIMAL(18,3) NOT NULL,
  "unit" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WarehouseInventoryCountItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "WarehouseInventoryCountItem_inventoryId_idx" ON "WarehouseInventoryCountItem"("inventoryId");
CREATE INDEX IF NOT EXISTS "WarehouseInventoryCountItem_productId_idx" ON "WarehouseInventoryCountItem"("productId");
DO $$ BEGIN
  CREATE UNIQUE INDEX "WarehouseInventoryCountItem_inventoryId_productId_key" ON "WarehouseInventoryCountItem"("inventoryId","productId");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "WarehouseInventoryCountItem" ADD CONSTRAINT "WarehouseInventoryCountItem_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "WarehouseInventoryCount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "WarehouseInventoryCountItem" ADD CONSTRAINT "WarehouseInventoryCountItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ShopProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

UPDATE "ShopProduct" p
SET "stock" = GREATEST(0, FLOOR(COALESCE(i."quantity", 0) - COALESCE(i."reserved", 0))::INT)
FROM "ShopInventoryItem" i
WHERE i."productId" = p."id"
  AND i."warehouseId" = (SELECT "id" FROM "Warehouse" WHERE "code" = 'main' LIMIT 1);
