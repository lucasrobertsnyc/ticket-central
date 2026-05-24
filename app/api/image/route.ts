import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) return new NextResponse("Missing url", { status: 400 });

  const res = await fetch(url, {
    headers: {
      "User-Agent": "TicketCentral/1.0 (https://ticket-central-six.vercel.app; educational demo app)",
      Accept: "image/*,*/*",
    },
  });

  if (!res.ok) return new NextResponse("Upstream error", { status: 502 });

  const contentType = res.headers.get("content-type") ?? "image/jpeg";
  const buffer = await res.arrayBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
    },
  });
}
