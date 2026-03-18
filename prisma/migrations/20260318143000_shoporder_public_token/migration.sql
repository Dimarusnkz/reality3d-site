ALTER TABLE "ShopOrder" ADD COLUMN IF NOT EXISTS "publicAccessToken" TEXT;

DO $$ BEGIN
  CREATE UNIQUE INDEX "ShopOrder_publicAccessToken_key" ON "ShopOrder"("publicAccessToken");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

