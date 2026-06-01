import { NextResponse } from "next/server";
import { getSession, isAuthSecretConfigured, isGoogleConfigured } from "../../../../lib/auth";
import { isAiSorterAvailable } from "../../../../lib/clothing-ai";
import { isDatabaseConfigured } from "../../../../lib/db";

export const runtime = "nodejs";

export async function GET() {
  const authSecretConfigured = isAuthSecretConfigured();
  const session = authSecretConfigured ? await getSession() : null;

  return NextResponse.json({
    aiAvailable: isAiSorterAvailable(),
    authSecretConfigured,
    databaseConfigured: isDatabaseConfigured(),
    googleConfigured: isGoogleConfigured(),
    blobConfigured: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    user: session?.user || null,
  });
}
