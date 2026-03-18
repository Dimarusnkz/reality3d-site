import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const data = (url.searchParams.get("data") || "").trim();
  const sizeRaw = parseInt(url.searchParams.get("size") || "220", 10);
  const size = Number.isFinite(sizeRaw) ? Math.max(80, Math.min(600, sizeRaw)) : 220;

  if (!data) {
    return NextResponse.json({ ok: false }, { status: 400, headers: { "cache-control": "no-store" } });
  }

  const target = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`;
  const res = await fetch(target, { cache: "no-store" });
  if (!res.ok) {
    return NextResponse.json({ ok: false }, { status: 502, headers: { "cache-control": "no-store" } });
  }

  const body = await res.arrayBuffer();
  return new NextResponse(body, {
    status: 200,
    headers: {
      "content-type": res.headers.get("content-type") || "image/png",
      "cache-control": "no-store",
    },
  });
}

