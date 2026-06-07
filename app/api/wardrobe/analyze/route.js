import { NextResponse } from "next/server";
import { getSession } from "../../../../lib/auth";
import { analyzeClothingImage, getSafeAIErrorMessage } from "../../../../lib/clothing-ai";

export const runtime = "nodejs";

export async function POST(request) {
  const session = await getSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { imageUrl } = await request.json();

  if (!imageUrl || typeof imageUrl !== "string" || !imageUrl.startsWith("https://")) {
    return NextResponse.json({ error: "Upload an image first" }, { status: 400 });
  }

  try {
    const review = await analyzeClothingImage({ imageUrl });
    return NextResponse.json({ review });
  } catch (error) {
    return NextResponse.json({ error: getSafeAIErrorMessage(error, "AI review failed") }, { status: error.status || 502 });
  }
}
