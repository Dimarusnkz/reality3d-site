ALTER TABLE "ShopProduct" ADD COLUMN IF NOT EXISTS "purchasePriceKopeks" INTEGER;

ALTER TABLE "ShopInventoryItem" ADD COLUMN IF NOT EXISTS "lastPurchaseUnitCostKopeks" INTEGER;

ALTER TABLE "ShopWarehouseLog" ADD COLUMN IF NOT EXISTS "unitCostKopeks" INTEGER;
ALTER TABLE "ShopWarehouseLog" ADD COLUMN IF NOT EXISTS "totalCostKopeks" INTEGER;

CREATE TABLE IF NOT EXISTS "Permission" (
  "key" TEXT NOT NULL,
  "description" TEXT,
  CONSTRAINT "Permission_pkey" PRIMARY KEY ("key")
);

CREATE TABLE IF NOT EXISTS "RolePermission" (
  "id" SERIAL NOT NULL,
  "roleName" TEXT NOT NULL,
  "permissionKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "RolePermission_roleName_permissionKey_key" ON "RolePermission"("roleName","permissionKey");
CREATE INDEX IF NOT EXISTS "RolePermission_roleName_idx" ON "RolePermission"("roleName");

DO $$ BEGIN
  ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionKey_fkey" FOREIGN KEY ("permissionKey") REFERENCES "Permission"("key") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "AccessGroup" (
  "id" SERIAL NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "createdByUserId" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AccessGroup_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AccessGroup_name_key" ON "AccessGroup"("name");

DO $$ BEGIN
  ALTER TABLE "AccessGroup" ADD CONSTRAINT "AccessGroup_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "AccessGroupPermission" (
  "id" SERIAL NOT NULL,
  "groupId" INTEGER NOT NULL,
  "permissionKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AccessGroupPermission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AccessGroupPermission_groupId_permissionKey_key" ON "AccessGroupPermission"("groupId","permissionKey");
CREATE INDEX IF NOT EXISTS "AccessGroupPermission_permissionKey_idx" ON "AccessGroupPermission"("permissionKey");

DO $$ BEGIN
  ALTER TABLE "AccessGroupPermission" ADD CONSTRAINT "AccessGroupPermission_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "AccessGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "AccessGroupPermission" ADD CONSTRAINT "AccessGroupPermission_permissionKey_fkey" FOREIGN KEY ("permissionKey") REFERENCES "Permission"("key") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "UserAccessGroup" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "groupId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserAccessGroup_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserAccessGroup_userId_groupId_key" ON "UserAccessGroup"("userId","groupId");
CREATE INDEX IF NOT EXISTS "UserAccessGroup_groupId_idx" ON "UserAccessGroup"("groupId");

DO $$ BEGIN
  ALTER TABLE "UserAccessGroup" ADD CONSTRAINT "UserAccessGroup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "UserAccessGroup" ADD CONSTRAINT "UserAccessGroup_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "AccessGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "UserAccessPermission" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "permissionKey" TEXT NOT NULL,
  "allow" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserAccessPermission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserAccessPermission_userId_permissionKey_key" ON "UserAccessPermission"("userId","permissionKey");
CREATE INDEX IF NOT EXISTS "UserAccessPermission_permissionKey_allow_idx" ON "UserAccessPermission"("permissionKey","allow");

DO $$ BEGIN
  ALTER TABLE "UserAccessPermission" ADD CONSTRAINT "UserAccessPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "UserAccessPermission" ADD CONSTRAINT "UserAccessPermission_permissionKey_fkey" FOREIGN KEY ("permissionKey") REFERENCES "Permission"("key") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "CashAccount" (
  "id" SERIAL NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'RUB',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CashAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CashAccount_code_key" ON "CashAccount"("code");

CREATE TABLE IF NOT EXISTS "CashEntry" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "accountId" INTEGER NOT NULL,
  "direction" TEXT NOT NULL,
  "entryType" TEXT NOT NULL,
  "amountKopeks" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'RUB',
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'confirmed',
  "shopOrderId" UUID,
  "shopPaymentId" UUID,
  "warehouseLogId" UUID,
  "createdByUserId" INTEGER,
  "ipHash" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CashEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CashEntry_shopPaymentId_key" ON "CashEntry"("shopPaymentId");
CREATE INDEX IF NOT EXISTS "CashEntry_createdAt_idx" ON "CashEntry"("createdAt");
CREATE INDEX IF NOT EXISTS "CashEntry_accountId_createdAt_idx" ON "CashEntry"("accountId","createdAt");
CREATE INDEX IF NOT EXISTS "CashEntry_direction_createdAt_idx" ON "CashEntry"("direction","createdAt");
CREATE INDEX IF NOT EXISTS "CashEntry_entryType_createdAt_idx" ON "CashEntry"("entryType","createdAt");
CREATE INDEX IF NOT EXISTS "CashEntry_shopOrderId_idx" ON "CashEntry"("shopOrderId");

DO $$ BEGIN
  ALTER TABLE "CashEntry" ADD CONSTRAINT "CashEntry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "CashAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CashEntry" ADD CONSTRAINT "CashEntry_shopOrderId_fkey" FOREIGN KEY ("shopOrderId") REFERENCES "ShopOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CashEntry" ADD CONSTRAINT "CashEntry_shopPaymentId_fkey" FOREIGN KEY ("shopPaymentId") REFERENCES "ShopPayment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CashEntry" ADD CONSTRAINT "CashEntry_warehouseLogId_fkey" FOREIGN KEY ("warehouseLogId") REFERENCES "ShopWarehouseLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CashEntry" ADD CONSTRAINT "CashEntry_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "CashReconciliation" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "accountId" INTEGER NOT NULL,
  "day" TIMESTAMP(3) NOT NULL,
  "openingKopeks" INTEGER NOT NULL DEFAULT 0,
  "expectedKopeks" INTEGER NOT NULL,
  "actualKopeks" INTEGER NOT NULL,
  "diffKopeks" INTEGER NOT NULL,
  "createdByUserId" INTEGER,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CashReconciliation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CashReconciliation_accountId_day_key" ON "CashReconciliation"("accountId","day");
CREATE INDEX IF NOT EXISTS "CashReconciliation_day_idx" ON "CashReconciliation"("day");

DO $$ BEGIN
  ALTER TABLE "CashReconciliation" ADD CONSTRAINT "CashReconciliation_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "CashAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CashReconciliation" ADD CONSTRAINT "CashReconciliation_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

INSERT INTO "CashAccount" ("code","name","type","currency","isActive")
VALUES
  ('online','Онлайн-касса','online','RUB',true),
  ('office_cash','Касса офиса (наличные)','office_cash','RUB',true),
  ('bank','Банковский счёт','bank','RUB',true)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Permission" ("key","description")
VALUES
  ('warehouse.view','Просмотр склада'),
  ('warehouse.receipt','Приход товара'),
  ('warehouse.writeoff','Списание товара'),
  ('warehouse.transfer','Передача в работу'),
  ('warehouse.threshold.edit','Изменение минимального порога'),
  ('logs.view','Просмотр логов'),
  ('logs.export','Экспорт логов'),
  ('finance.view','Просмотр финансов'),
  ('finance.entry.create','Создание финансовых операций'),
  ('finance.reconcile.create','Создание сверок'),
  ('products.purchase_price.view','Просмотр закупочной цены'),
  ('products.purchase_price.edit','Редактирование закупочной цены'),
  ('roles.manage','Управление ролями и правами')
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "RolePermission" ("roleName","permissionKey")
SELECT r.roleName, r.permissionKey
FROM (
  VALUES
    ('admin','warehouse.view'),
    ('admin','warehouse.receipt'),
    ('admin','warehouse.writeoff'),
    ('admin','warehouse.transfer'),
    ('admin','warehouse.threshold.edit'),
    ('admin','logs.view'),
    ('admin','logs.export'),
    ('admin','finance.view'),
    ('admin','finance.entry.create'),
    ('admin','finance.reconcile.create'),
    ('admin','products.purchase_price.view'),
    ('admin','products.purchase_price.edit'),
    ('admin','roles.manage'),

    ('manager','warehouse.view'),
    ('manager','warehouse.receipt'),
    ('manager','warehouse.writeoff'),
    ('manager','warehouse.transfer'),
    ('manager','warehouse.threshold.edit'),
    ('manager','logs.view'),
    ('manager','logs.export'),
    ('manager','finance.view'),
    ('manager','finance.entry.create'),

    ('warehouse','warehouse.view'),
    ('warehouse','warehouse.receipt'),

    ('engineer','warehouse.view'),
    ('engineer','warehouse.transfer')

    ,('accountant','warehouse.view')
    ,('accountant','logs.view')
    ,('accountant','logs.export')
    ,('accountant','finance.view')
    ,('accountant','finance.entry.create')
    ,('accountant','finance.reconcile.create')
    ,('accountant','products.purchase_price.view')
    ,('accountant','products.purchase_price.edit')
) AS r(roleName, permissionKey)
ON CONFLICT ("roleName","permissionKey") DO NOTHING;
