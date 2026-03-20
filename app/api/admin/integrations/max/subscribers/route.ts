import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { assertCsrfTokenValue } from "@/lib/csrf";
import { requirePermission } from "@/lib/access";

export async function GET() {
  const access = await requirePermission("roles.manage");
  if (!access.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const subscribers = await prisma.maxSubscriber.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ subscribers });
}

export async function POST(req: NextRequest) {
  const access = await requirePermission("roles.manage");
  if (!access.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as any;
  const csrfToken = typeof body?.csrfToken === "string" ? body.csrfToken : null;
  const csrf = await assertCsrfTokenValue(csrfToken);
  if (!csrf.ok) return NextResponse.json({ error: csrf.error }, { status: 400 });

  const chatId = typeof body?.chatId === "string" ? body.chatId.trim() : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!chatId) return NextResponse.json({ error: "Chat ID is required" }, { status: 400 });

  const prisma = getPrisma();
  try {
    const subscriber = await prisma.maxSubscriber.create({
      data: { chatId, name: name || null },
    });
    return NextResponse.json({ ok: true, subscriber });
  } catch {
    return NextResponse.json({ error: "Failed to add subscriber (possibly duplicate ID)" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const access = await requirePermission("roles.manage");
  if (!access.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as any;
  const csrfToken = typeof body?.csrfToken === "string" ? body.csrfToken : null;
  const csrf = await assertCsrfTokenValue(csrfToken);
  if (!csrf.ok) return NextResponse.json({ error: csrf.error }, { status: 400 });

  const id = typeof body?.id === "number" ? body.id : Number.parseInt(String(body?.id || ""), 10);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const prisma = getPrisma();
  try {
    await prisma.maxSubscriber.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete subscriber" }, { status: 400 });
  }
}

