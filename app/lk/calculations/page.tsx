import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import CalculationsClient from "./calculations-client";

export const dynamic = "force-dynamic";

export default async function LkCalculationsPage() {
  const session = await getSession();
  if (!session?.userId) redirect("/login?redirectTo=/lk/calculations");

  const userId = parseInt(session.userId, 10);
  const prisma = getPrisma();
  const rows = await prisma.printCalculation.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <CalculationsClient
      initial={rows.map((c) => ({
        id: c.id,
        createdAt: c.createdAt.toISOString(),
        mode: c.mode,
        tech: c.tech,
        material: c.material,
        count: c.count,
        fileName: c.fileName,
        fileSize: c.fileSize,
        manualWeightGrams: c.manualWeightGrams,
        manualTimeHours: c.manualTimeHours,
        minPriceRub: c.minPriceRub,
        maxPriceRub: c.maxPriceRub,
      }))}
    />
  );
}
