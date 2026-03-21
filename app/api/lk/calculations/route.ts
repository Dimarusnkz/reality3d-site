import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { assertCsrfTokenValue } from "@/lib/csrf";

export async function GET() {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = parseInt(session.userId, 10);
  const prisma = getPrisma();
  const rows = await prisma.printCalculation.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({
    calculations: rows.map((c) => ({
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
    })),
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as any;
  const csrfToken = typeof body?.csrfToken === "string" ? body.csrfToken : null;
  const csrf = await assertCsrfTokenValue(csrfToken);
  if (!csrf.ok) return NextResponse.json({ error: csrf.error }, { status: 400 });

  const mode = typeof body?.mode === "string" ? body.mode : "file";
  const tech = typeof body?.tech === "string" ? body.tech : "fdm";
  const material = typeof body?.material === "string" ? body.material : "pla";
  const count = Number.isFinite(Number(body?.count)) ? Math.max(1, Math.trunc(Number(body.count))) : 1;

  const minPriceRub = Number.isFinite(Number(body?.minPriceRub)) ? Math.max(0, Math.trunc(Number(body.minPriceRub))) : 0;
  const maxPriceRub = Number.isFinite(Number(body?.maxPriceRub)) ? Math.max(0, Math.trunc(Number(body.maxPriceRub))) : 0;

  const fileName = typeof body?.fileName === "string" ? body.fileName : null;
  const fileSize = Number.isFinite(Number(body?.fileSize)) ? Math.max(0, Math.trunc(Number(body.fileSize))) : null;

  const manualWeightGrams = Number.isFinite(Number(body?.manualWeightGrams)) ? Math.max(0, Math.trunc(Number(body.manualWeightGrams))) : null;
  const manualTimeHours = Number.isFinite(Number(body?.manualTimeHours)) ? Math.max(0, Number(body.manualTimeHours)) : null;

  const userId = parseInt(session.userId, 10);
  const prisma = getPrisma();

  const input = body?.input == null ? null : JSON.stringify(body.input);

  const row = await prisma.printCalculation.create({
    data: {
      userId,
      mode,
      tech,
      material,
      count,
      fileName,
      fileSize,
      manualWeightGrams,
      manualTimeHours,
      minPriceRub,
      maxPriceRub,
      input,
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id: row.id });
}

