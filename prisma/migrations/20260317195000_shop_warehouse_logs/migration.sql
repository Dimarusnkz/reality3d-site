CREATE TABLE IF NOT EXISTS "ShopInventoryItem" (
  "id" SERIAL NOT NULL,
  "productId" INTEGER NOT NULL,
  "unit" TEXT NOT NULL DEFAULT 'pcs',
  "quantity" DECIMAL(18,3) NOT NULL DEFAULT 0,
  "minThreshold" DECIMAL(18,3) NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ShopInventoryItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ShopInventoryItem_productId_key" ON "ShopInventoryItem"("productId");
CREATE INDEX IF NOT EXISTS "ShopInventoryItem_unit_idx" ON "ShopInventoryItem"("unit");
CREATE INDEX IF NOT EXISTS "ShopInventoryItem_quantity_idx" ON "ShopInventoryItem"("quantity");

DO $$ BEGIN
  ALTER TABLE "ShopInventoryItem" ADD CONSTRAINT "ShopInventoryItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ShopProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "ShopWarehouseLog" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "actorUserId" INTEGER,
  "actorRole" TEXT,
  "actionType" TEXT NOT NULL,
  "reason" TEXT,
  "productId" INTEGER,
  "sku" TEXT,
  "productName" TEXT,
  "quantityDelta" DECIMAL(18,3) NOT NULL,
  "unit" TEXT NOT NULL,
  "shopOrderId" UUID,
  "serviceOrderId" INTEGER,
  "supplier" TEXT,
  "documentNo" TEXT,
  "comment" TEXT,
  "ipHash" TEXT,
  "userAgent" TEXT,
  CONSTRAINT "ShopWarehouseLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ShopWarehouseLog_createdAt_idx" ON "ShopWarehouseLog"("createdAt");
CREATE INDEX IF NOT EXISTS "ShopWarehouseLog_actorRole_createdAt_idx" ON "ShopWarehouseLog"("actorRole", "createdAt");
CREATE INDEX IF NOT EXISTS "ShopWarehouseLog_actionType_createdAt_idx" ON "ShopWarehouseLog"("actionType", "createdAt");
CREATE INDEX IF NOT EXISTS "ShopWarehouseLog_productId_createdAt_idx" ON "ShopWarehouseLog"("productId", "createdAt");
CREATE INDEX IF NOT EXISTS "ShopWarehouseLog_shopOrderId_idx" ON "ShopWarehouseLog"("shopOrderId");

DO $$ BEGIN
  ALTER TABLE "ShopWarehouseLog" ADD CONSTRAINT "ShopWarehouseLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ShopWarehouseLog" ADD CONSTRAINT "ShopWarehouseLog_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ShopProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ShopWarehouseLog" ADD CONSTRAINT "ShopWarehouseLog_shopOrderId_fkey" FOREIGN KEY ("shopOrderId") REFERENCES "ShopOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ShopWarehouseLog" ADD CONSTRAINT "ShopWarehouseLog_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "ShopClientLog" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" INTEGER,
  "actionType" TEXT NOT NULL,
  "productId" INTEGER,
  "shopOrderId" UUID,
  "quantity" DECIMAL(18,3),
  "unit" TEXT,
  "orderStatus" TEXT,
  "ipHash" TEXT,
  "userAgent" TEXT,
  "message" TEXT,
  CONSTRAINT "ShopClientLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ShopClientLog_createdAt_idx" ON "ShopClientLog"("createdAt");
CREATE INDEX IF NOT EXISTS "ShopClientLog_actionType_createdAt_idx" ON "ShopClientLog"("actionType", "createdAt");
CREATE INDEX IF NOT EXISTS "ShopClientLog_userId_createdAt_idx" ON "ShopClientLog"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "ShopClientLog_productId_createdAt_idx" ON "ShopClientLog"("productId", "createdAt");
CREATE INDEX IF NOT EXISTS "ShopClientLog_shopOrderId_createdAt_idx" ON "ShopClientLog"("shopOrderId", "createdAt");

DO $$ BEGIN
  ALTER TABLE "ShopClientLog" ADD CONSTRAINT "ShopClientLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ShopClientLog" ADD CONSTRAINT "ShopClientLog_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ShopProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ShopClientLog" ADD CONSTRAINT "ShopClientLog_shopOrderId_fkey" FOREIGN KEY ("shopOrderId") REFERENCES "ShopOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
