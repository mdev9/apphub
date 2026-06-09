import { NextResponse } from "next/server";
import { listObjects } from "@/lib/r2";

export const dynamic = "force-dynamic";

/** Debug: list every object key in the bucket (fast — list only, no bodies). */
export async function GET() {
  const all = await listObjects("");
  const objects = all
    .map((o) => ({ key: o.key, lastModified: o.lastModified ?? null }))
    .sort((a, b) => a.key.localeCompare(b.key));
  return NextResponse.json({ count: objects.length, objects });
}
