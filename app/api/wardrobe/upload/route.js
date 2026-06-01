import { NextResponse } from "next/server";
import { categories, isValidCategory } from "../../../../lib/categories";
import { getSession } from "../../../../lib/auth";
import { classifyClothingImage } from "../../../../lib/clothing-ai";
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
  const aiResult = wantsAi ? await classifyClothingImage({ imageUrl }) : null;
  const category = aiResult?.category || String(body.category || "");

  if (!isValidCategory(category)) {
    return NextResponse.json({ error: `Choose one category: ${categories.join(", ")}` }, { status: 400 });
  }

  const item = await addWardrobeItem(session.user, {
    brand: String(body.brand || aiResult?.brand || "").trim(),
    category,
    color: String(body.color || aiResult?.color || "").trim(),
    image: imageUrl,
    name: String(body.name || aiResult?.name || cleanName(pathname)).trim(),
    pathname,
    source: aiResult ? "ai" : "manual",
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
