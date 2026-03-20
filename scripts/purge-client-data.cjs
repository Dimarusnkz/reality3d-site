const { PrismaClient } = require("@prisma/client");

function hasFlag(name) {
  return process.argv.includes(name);
}

function parseArgValue(key) {
  const idx = process.argv.findIndex((a) => a === key);
  if (idx === -1) return null;
  return process.argv[idx + 1] || null;
}

async function main() {
  const execute = hasFlag("--execute");
  const scope = parseArgValue("--scope") || "all";
  const clearCash = hasFlag("--cash");

  const prisma = new PrismaClient();

  const whereOrder = scope === "all" ? {} : { userId: Number(scope) };
  const whereShopOrder = scope === "all" ? {} : { userId: Number(scope) };

  const before = {
    orders: await prisma.order.count({ where: whereOrder }),
    orderComments: await prisma.orderComment.count({
      where: scope === "all" ? {} : { order: { userId: Number(scope) } },
    }),
    chatSessions: await prisma.chatSession.count({
      where: scope === "all" ? {} : { userId: Number(scope) },
    }),
    chatMessages: await prisma.chatMessage.count({
      where: scope === "all" ? {} : { session: { userId: Number(scope) } },
    }),
    shopOrders: await prisma.shopOrder.count({ where: whereShopOrder }),
    shopPayments: await prisma.shopPayment.count({
      where: scope === "all" ? {} : { order: { userId: Number(scope) } },
    }),
    shopOrderItems: await prisma.shopOrderItem.count({
      where: scope === "all" ? {} : { order: { userId: Number(scope) } },
    }),
    shopClientLogs: await prisma.shopClientLog.count({
      where: scope === "all" ? {} : { userId: Number(scope) },
    }),
    shopWarehouseLogs: await prisma.shopWarehouseLog.count({
      where:
        scope === "all"
          ? { OR: [{ shopOrderId: { not: null } }, { serviceOrderId: { not: null } }] }
          : { OR: [{ shopOrder: { userId: Number(scope) } }, { serviceOrder: { userId: Number(scope) } }] },
    }),
    cashEntries: clearCash
      ? await prisma.cashEntry.count({
          where:
            scope === "all"
              ? {}
              : {
                  OR: [
                    { shopOrder: { userId: Number(scope) } },
                    { createdByUserId: Number(scope) },
                  ],
                },
        })
      : 0,
    cashReconciliations: clearCash
      ? await prisma.cashReconciliation.count({
          where: scope === "all" ? {} : { createdByUserId: Number(scope) },
        })
      : 0,
  };

  console.log("PURGE PREVIEW");
  console.table({ scope, clearCash, execute, ...before });

  if (!execute) {
    console.log('Dry run. To execute: node scripts/purge-client-data.cjs --execute --scope all --cash');
    await prisma.$disconnect();
    return;
  }

  if (scope !== "all" && !Number.isFinite(Number(scope))) {
    throw new Error("Invalid --scope. Use --scope all or --scope <userId>");
  }

  await prisma.$transaction(async (tx) => {
    if (clearCash) {
      await tx.cashEntry.deleteMany({
        where:
          scope === "all"
            ? {}
            : {
                OR: [
                  { shopOrder: { userId: Number(scope) } },
                  { createdByUserId: Number(scope) },
                ],
              },
      });
      await tx.cashReconciliation.deleteMany({
        where: scope === "all" ? {} : { createdByUserId: Number(scope) },
      });
    }

    await tx.shopClientLog.deleteMany({
      where: scope === "all" ? {} : { userId: Number(scope) },
    });

    await tx.shopWarehouseLog.deleteMany({
      where:
        scope === "all"
          ? { OR: [{ shopOrderId: { not: null } }, { serviceOrderId: { not: null } }] }
          : { OR: [{ shopOrder: { userId: Number(scope) } }, { serviceOrder: { userId: Number(scope) } }] },
    });

    await tx.shopOrder.deleteMany({ where: whereShopOrder });

    await tx.chatMessage.deleteMany({
      where: scope === "all" ? {} : { session: { userId: Number(scope) } },
    });
    await tx.chatSession.deleteMany({
      where: scope === "all" ? {} : { userId: Number(scope) },
    });
    await tx.orderComment.deleteMany({
      where: scope === "all" ? {} : { order: { userId: Number(scope) } },
    });
    await tx.order.deleteMany({ where: whereOrder });
  });

  const after = {
    orders: await prisma.order.count({ where: whereOrder }),
    shopOrders: await prisma.shopOrder.count({ where: whereShopOrder }),
    cashEntries: clearCash
      ? await prisma.cashEntry.count({
          where:
            scope === "all"
              ? {}
              : {
                  OR: [
                    { shopOrder: { userId: Number(scope) } },
                    { createdByUserId: Number(scope) },
                  ],
                },
        })
      : 0,
  };

  console.log("PURGE DONE");
  console.table(after);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

