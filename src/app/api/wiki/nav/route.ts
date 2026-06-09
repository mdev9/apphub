import { NextResponse } from "next/server";
import { getNavTree } from "@/lib/nav";
import { tryDrainQueue } from "@/lib/queue";

export async function GET() {
  tryDrainQueue();
  try {
    const tree = await getNavTree();
    return NextResponse.json(tree);
  } catch {
    return NextResponse.json(
      { wiki: [], articles: [] },
      { status: 200 }
    );
  }
}
