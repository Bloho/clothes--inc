import { handleUpload } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getSession } from "../../../../lib/auth";

export const runtime = "nodejs";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(request) {
  const body = await request.json();

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const session = await getSession();

        if (!session?.user) {
          throw new Error("Unauthorized");
        }

        return {
          addRandomSuffix: true,
          allowedContentTypes: ALLOWED_IMAGE_TYPES,
          tokenPayload: JSON.stringify({
            requestedPathname: pathname,
            userId: session.user.id,
          }),
        };
      },
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
