import { NextRequest, NextResponse } from "next/server";
import { getObject } from "@/lib/r2";

export const dynamic = "force-dynamic";

/** Debug: return the raw body of one bucket object. `?key=wiki/...`. */
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (!key) return NextResponse.json({ error: "missing ?key" }, { status: 400 });

  const body = await getObject(key);
  if (body === null)
    return NextResponse.json({ error: `no object at "${key}"` }, { status: 404 });

  return new NextResponse(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
