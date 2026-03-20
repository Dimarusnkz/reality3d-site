import { NextRequest, NextResponse } from "next/server";
import { assertCsrfTokenValue } from "@/lib/csrf";
import { requirePermission } from "@/lib/access";
import { verifyMaxToken, sendMaxMessage } from "@/lib/max";

export async function POST(req: NextRequest) {
  const access = await requirePermission("roles.manage");
  if (!access.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as any;
  const csrfToken = typeof body?.csrfToken === "string" ? body.csrfToken : null;
  const csrf = await assertCsrfTokenValue(csrfToken);
  if (!csrf.ok) return NextResponse.json({ error: csrf.error }, { status: 400 });

  const verified = await verifyMaxToken();
  if (!verified) return NextResponse.json({ error: "Failed to verify MAX token" }, { status: 400 });

  const sent = await sendMaxMessage("Test_bot_MAX\nСообщение отправлено с сайта.");
  return NextResponse.json({ ok: true, sent });
}

