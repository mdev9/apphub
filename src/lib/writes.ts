import { NextResponse } from "next/server";

/**
 * AppHub is read-only in production. All mutating / AI-cost endpoints
 * (submission, queue processing, /ask generation, article creation) are
 * disabled unless ENABLE_WRITES="true" is set in the environment.
 *
 * Returns a 403 response when writes are off, or null when they're allowed.
 * Call at the top of every POST handler:  const b = writesBlocked(); if (b) return b;
 */
export function writesBlocked(): NextResponse | null {
  if (process.env.ENABLE_WRITES === "true") return null;
  return NextResponse.json(
    { error: "AppHub is read-only. Write endpoints are disabled." },
    { status: 403 }
  );
}
