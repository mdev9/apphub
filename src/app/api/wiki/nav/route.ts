import { NextResponse } from "next/server";
import { getNavTree } from "@/lib/nav";

export async function GET() {
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
