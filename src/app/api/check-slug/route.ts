import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");

  if (!slug || slug.length < 3) {
    return NextResponse.json({ available: false });
  }

  const existing = await db.wedding.findUnique({ where: { slug } });
  return NextResponse.json({ available: !existing });
}
