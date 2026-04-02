import { NextRequest, NextResponse } from "next/server";
import { getHistory } from "@/lib/history";

export async function GET(req: NextRequest) {
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "50");
  const offset = parseInt(req.nextUrl.searchParams.get("offset") || "0");

  try {
    const data = await getHistory(limit, offset);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ entries: [], total: 0 });
  }
}
