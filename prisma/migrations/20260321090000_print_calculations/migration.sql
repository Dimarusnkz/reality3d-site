-- CreateTable
CREATE TABLE "PrintCalculation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mode" TEXT NOT NULL,
    "tech" TEXT NOT NULL,
    "material" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "manualWeightGrams" INTEGER,
    "manualTimeHours" DOUBLE PRECISION,
    "minPriceRub" INTEGER NOT NULL,
    "maxPriceRub" INTEGER NOT NULL,
    "input" TEXT,

    CONSTRAINT "PrintCalculation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PrintCalculation_userId_createdAt_idx" ON "PrintCalculation"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "PrintCalculation" ADD CONSTRAINT "PrintCalculation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

