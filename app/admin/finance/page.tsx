import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/access";
import { FinanceClient } from "./finance-client";

export default async function AdminFinancePage() {
  const session = await getSession();
  if (!session?.userId) redirect("/login");
  const allowed = await hasPermission(parseInt(session.userId, 10), session.role, "finance.view");
  if (!allowed) redirect("/admin");

  const prisma = getPrisma();
  const [accounts, entries] = await Promise.all([
    prisma.cashAccount.findMany({ where: { isActive: true }, select: { code: true, name: true }, orderBy: { id: "asc" } }),
    prisma.cashEntry.findMany({
      select: {
        id: true,
        createdAt: true,
        direction: true,
        entryType: true,
        amountKopeks: true,
        description: true,
        account: { select: { code: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Касса</h1>
      <FinanceClient
        accounts={accounts as any}
        entries={entries.map((e) => ({
          id: e.id,
          createdAt: e.createdAt.toISOString(),
          accountCode: e.account.code,
          direction: e.direction,
          entryType: e.entryType,
          amountKopeks: e.amountKopeks,
          description: e.description,
        }))}
      />
    </div>
  );
}

