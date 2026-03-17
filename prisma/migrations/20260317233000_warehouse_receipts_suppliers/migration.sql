CREATE TABLE IF NOT EXISTS "WarehouseSupplier" (
  "id" SERIAL NOT NULL,
  "name" TEXT NOT NULL,
  "contact" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "contractNumber" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WarehouseSupplier_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "WarehouseSupplier_name_key" ON "WarehouseSupplier"("name");

CREATE TABLE IF NOT EXISTS "WarehouseReceipt" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "supplierId" INTEGER,
  "documentNo" TEXT NOT NULL,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "attachmentUrl" TEXT,
  "comment" TEXT,
  "currency" TEXT NOT NULL DEFAULT 'RUB',
  "createdByUserId" INTEGER,
  "postedAt" TIMESTAMP(3),
  "postedByUserId" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WarehouseReceipt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "WarehouseReceipt_receivedAt_idx" ON "WarehouseReceipt"("receivedAt");
CREATE INDEX IF NOT EXISTS "WarehouseReceipt_status_receivedAt_idx" ON "WarehouseReceipt"("status","receivedAt");
CREATE INDEX IF NOT EXISTS "WarehouseReceipt_supplierId_receivedAt_idx" ON "WarehouseReceipt"("supplierId","receivedAt");

DO $$ BEGIN
  ALTER TABLE "WarehouseReceipt" ADD CONSTRAINT "WarehouseReceipt_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "WarehouseSupplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "WarehouseReceipt" ADD CONSTRAINT "WarehouseReceipt_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "WarehouseReceipt" ADD CONSTRAINT "WarehouseReceipt_postedByUserId_fkey" FOREIGN KEY ("postedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "WarehouseReceiptItem" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "receiptId" UUID NOT NULL,
  "productId" INTEGER,
  "sku" TEXT,
  "productName" TEXT NOT NULL,
  "quantity" DECIMAL(18,3) NOT NULL,
  "unit" TEXT NOT NULL,
  "unitCostKopeks" INTEGER NOT NULL,
  "totalCostKopeks" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WarehouseReceiptItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "WarehouseReceiptItem_receiptId_idx" ON "WarehouseReceiptItem"("receiptId");
CREATE INDEX IF NOT EXISTS "WarehouseReceiptItem_productId_idx" ON "WarehouseReceiptItem"("productId");

DO $$ BEGIN
  ALTER TABLE "WarehouseReceiptItem" ADD CONSTRAINT "WarehouseReceiptItem_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "WarehouseReceipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "WarehouseReceiptItem" ADD CONSTRAINT "WarehouseReceiptItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ShopProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

