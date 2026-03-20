import { NextRequest, NextResponse } from "next/server";
import { assertCsrfTokenValue } from "@/lib/csrf";
import { requirePermission } from "@/lib/access";
import { sendTelegramMessage } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  const access = await requirePermission("roles.manage");
  if (!access.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as any;
  const csrfToken = typeof body?.csrfToken === "string" ? body.csrfToken : null;
  const csrf = await assertCsrfTokenValue(csrfToken);
  if (!csrf.ok) return NextResponse.json({ error: csrf.error }, { status: 400 });

  const ok = await sendTelegramMessage("<b>Test_bot_TG</b>\nСообщение отправлено с сайта.");
  if (!ok) return NextResponse.json({ error: "Failed to send test message" }, { status: 400 });
  return NextResponse.json({ ok: true });
}

