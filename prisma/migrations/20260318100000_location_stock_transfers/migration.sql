CREATE TABLE IF NOT EXISTS "WarehouseLocationStock" (
  "id" SERIAL NOT NULL,
  "warehouseId" INTEGER NOT NULL,
  "locationId" INTEGER NOT NULL,
  "productId" INTEGER NOT NULL,
  "unit" TEXT NOT NULL,
  "quantity" DECIMAL(18,3) NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WarehouseLocationStock_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  CREATE UNIQUE INDEX "WarehouseLocationStock_warehouseId_locationId_productId_key" ON "WarehouseLocationStock"("warehouseId","locationId","productId");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "WarehouseLocationStock_warehouseId_locationId_idx" ON "WarehouseLocationStock"("warehouseId","locationId");
CREATE INDEX IF NOT EXISTS "WarehouseLocationStock_productId_idx" ON "WarehouseLocationStock"("productId");

DO $$ BEGIN
  ALTER TABLE "WarehouseLocationStock" ADD CONSTRAINT "WarehouseLocationStock_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "WarehouseLocationStock" ADD CONSTRAINT "WarehouseLocationStock_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "WarehouseLocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "WarehouseLocationStock" ADD CONSTRAINT "WarehouseLocationStock_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ShopProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "WarehouseTransfer" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "fromWarehouseId" INTEGER NOT NULL,
  "fromLocationId" INTEGER,
  "toWarehouseId" INTEGER NOT NULL,
  "toLocationId" INTEGER,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "comment" TEXT,
  "createdByUserId" INTEGER,
  "postedAt" TIMESTAMP(3),
  "postedByUserId" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WarehouseTransfer_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "WarehouseTransfer_status_createdAt_idx" ON "WarehouseTransfer"("status","createdAt");
CREATE INDEX IF NOT EXISTS "WarehouseTransfer_fromWarehouseId_createdAt_idx" ON "WarehouseTransfer"("fromWarehouseId","createdAt");
CREATE INDEX IF NOT EXISTS "WarehouseTransfer_toWarehouseId_createdAt_idx" ON "WarehouseTransfer"("toWarehouseId","createdAt");

DO $$ BEGIN
  ALTER TABLE "WarehouseTransfer" ADD CONSTRAINT "WarehouseTransfer_fromWarehouseId_fkey" FOREIGN KEY ("fromWarehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "WarehouseTransfer" ADD CONSTRAINT "WarehouseTransfer_toWarehouseId_fkey" FOREIGN KEY ("toWarehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "WarehouseTransfer" ADD CONSTRAINT "WarehouseTransfer_fromLocationId_fkey" FOREIGN KEY ("fromLocationId") REFERENCES "WarehouseLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "WarehouseTransfer" ADD CONSTRAINT "WarehouseTransfer_toLocationId_fkey" FOREIGN KEY ("toLocationId") REFERENCES "WarehouseLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "WarehouseTransfer" ADD CONSTRAINT "WarehouseTransfer_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "WarehouseTransfer" ADD CONSTRAINT "WarehouseTransfer_postedByUserId_fkey" FOREIGN KEY ("postedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "WarehouseTransferItem" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "transferId" UUID NOT NULL,
  "productId" INTEGER NOT NULL,
  "sku" TEXT,
  "productName" TEXT NOT NULL,
  "quantity" DECIMAL(18,3) NOT NULL,
  "unit" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WarehouseTransferItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "WarehouseTransferItem_transferId_idx" ON "WarehouseTransferItem"("transferId");
CREATE INDEX IF NOT EXISTS "WarehouseTransferItem_productId_idx" ON "WarehouseTransferItem"("productId");

DO $$ BEGIN
  ALTER TABLE "WarehouseTransferItem" ADD CONSTRAINT "WarehouseTransferItem_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "WarehouseTransfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "WarehouseTransferItem" ADD CONSTRAINT "WarehouseTransferItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ShopProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

