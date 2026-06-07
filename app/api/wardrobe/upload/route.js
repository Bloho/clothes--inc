import { NextResponse } from "next/server";
import { del, put } from "@vercel/blob";
import { categories, isValidCategory } from "../../../../lib/categories";
import { getSession } from "../../../../lib/auth";
import { analyzeClothingImage, createCleanClothingAsset, getSafeAIErrorMessage } from "../../../../lib/clothing-ai";
import { addWardrobeItem } from "../../../../lib/storage";
import { isDatabaseConfigured } from "../../../../lib/db";

export const runtime = "nodejs";

export async function POST(request) {
  const session = await getSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database is not configured" }, { status: 503 });
  }

  const body = await request.json();
  const imageUrl = String(body.imageUrl || "");
  const pathname = String(body.pathname || "");

  if (!imageUrl || !imageUrl.startsWith("https://")) {
    return NextResponse.json({ error: "Upload an image first" }, { status: 400 });
  }

  const wantsAi = body.sortMode === "ai";
  const aiResult = wantsAi ? body.aiReview || (await analyzeClothingImage({ imageUrl })) : null;
  const category = aiResult?.category || String(body.category || "");

  if (!isValidCategory(category)) {
    return NextResponse.json({ error: `Choose one category: ${categories.join(", ")}` }, { status: 400 });
  }

  let finalImageUrl = imageUrl;
  let finalPathname = pathname;
  let source = "manual";

  if (wantsAi) {
    try {
      const cleanImage = await createCleanClothingAsset({
        category,
        color: String(body.color || aiResult?.color || "").trim(),
        imageUrl,
        name: String(body.name || aiResult?.name || cleanName(pathname)).trim(),
        selection: aiResult?.selection,
      });

      const cleanBlob = await put(`wardrobe/${session.user.id}/clean/${cleanName(pathname)}.png`, cleanImage, {
        access: "public",
        addRandomSuffix: true,
        contentType: "image/png",
      });

      finalImageUrl = cleanBlob.url;
      finalPathname = cleanBlob.pathname;
      source = "ai-clean";

      if (pathname) {
        await del(pathname).catch(() => {});
      }
    } catch (error) {
      return NextResponse.json({ error: getSafeAIErrorMessage(error, "AI cleanup failed") }, { status: error.status || 502 });
    }
  }

  const item = await addWardrobeItem(session.user, {
    brand: String(body.brand || aiResult?.brand || "").trim(),
    category,
    color: String(body.color || aiResult?.color || "").trim(),
    image: finalImageUrl,
    name: String(body.name || aiResult?.name || cleanName(pathname)).trim(),
    pathname: finalPathname,
    source,
  });

  return NextResponse.json({ item });
}

function cleanName(pathname) {
  const fileName = String(pathname || "Wardrobe Item").split("/").pop();

  return fileName
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[-_]+/g, " ")
    .trim() || "Wardrobe Item";
}
