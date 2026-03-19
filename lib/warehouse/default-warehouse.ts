export async function getDefaultWarehouseId(prisma: any) {
  const byCode = await prisma.warehouse.findUnique({ where: { code: "main" }, select: { id: true } }).catch(() => null);
  if (byCode?.id) return byCode.id as number;

  const first = await prisma.warehouse.findFirst({ orderBy: { id: "asc" }, select: { id: true } });
  if (first?.id) return first.id as number;

  const created = await prisma.warehouse.create({
    data: { code: "main", name: "Основной склад", isActive: true },
    select: { id: true },
  });
  return created.id as number;
}

