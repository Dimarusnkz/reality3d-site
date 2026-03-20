import { NextRequest, NextResponse } from "next/server";
import { assertCsrfTokenValue } from "@/lib/csrf";
import { requirePermission } from "@/lib/access";

export async function POST(req: NextRequest) {
  const access = await requirePermission("roles.manage");
  if (!access.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as any;
  const csrfToken = typeof body?.csrfToken === "string" ? body.csrfToken : null;
  const csrf = await assertCsrfTokenValue(csrfToken);
  if (!csrf.ok) return NextResponse.json({ error: csrf.error }, { status: 400 });

  const token = process.env.MAX_BOT_TOKEN;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!token || !siteUrl) {
    return NextResponse.json({ error: "Bot token or Site URL not configured in environment" }, { status: 400 });
  }

  const webhookUrl = `${siteUrl.replace(/\/$/, "")}/api/max/webhook`;
  const secret = process.env.MAX_WEBHOOK_SECRET || undefined;

  try {
    const res = await fetch("https://platform-api.max.ru/subscriptions", {
      method: "POST",
      headers: { Authorization: token, "Content-Type": "application/json" },
      body: JSON.stringify({
        url: webhookUrl,
        update_types: ["message_callback", "message_created", "bot_started"],
        ...(secret ? { secret } : {}),
      }),
    });

    const data = (await res.json().catch(() => null)) as any;
    if (res.ok) return NextResponse.json({ ok: true, message: data?.description || "OK" });
    return NextResponse.json({ error: data?.description || "Failed to set webhook" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Failed to set webhook" }, { status: 400 });
  }
}

