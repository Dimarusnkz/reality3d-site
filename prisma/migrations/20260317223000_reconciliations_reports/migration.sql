ALTER TABLE "CashReconciliation" ADD COLUMN IF NOT EXISTS "cutoffAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "CashReconciliation" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'pending';

ALTER TABLE "CashReconciliation" ALTER COLUMN "actualKopeks" DROP NOT NULL;
ALTER TABLE "CashReconciliation" ALTER COLUMN "diffKopeks" DROP NOT NULL;

UPDATE "CashReconciliation"
SET
  "cutoffAt" = COALESCE("cutoffAt", "createdAt"),
  "status" = CASE WHEN "actualKopeks" IS NULL THEN 'pending' ELSE 'confirmed' END
WHERE true;
