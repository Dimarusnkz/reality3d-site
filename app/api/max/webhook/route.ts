import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const secret = process.env.MAX_WEBHOOK_SECRET;
  if (secret) {
    const got = req.headers.get("x-max-bot-api-secret");
    if (got !== secret) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  try {
    await req.json().catch(() => null);
  } catch {
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}

