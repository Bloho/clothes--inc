import { NextResponse } from "next/server";
import { getSession, isGoogleConfigured } from "../../../../lib/auth";
import { isAiSorterAvailable } from "../../../../lib/clothing-ai";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();

  return NextResponse.json({
    aiAvailable: isAiSorterAvailable(),
    googleConfigured: isGoogleConfigured(),
    user: session?.user || null,
  });
}
