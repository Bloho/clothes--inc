import { NextResponse } from "next/server";
import { categories, isValidCategory } from "../../../../lib/categories";
import { getSession } from "../../../../lib/auth";
import { classifyClothingImage } from "../../../../lib/clothing-ai";
import { addWardrobeItem, saveUpload } from "../../../../lib/storage";

export const runtime = "nodejs";

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(request) {
  const session = await getSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("image");

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "Choose an image" }, { status: 400 });
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Use JPG, PNG, WEBP, or GIF" }, { status: 400 });
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Image is too large" }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const wantsAi = formData.get("sortMode") === "ai";
  const aiResult = wantsAi ? await classifyClothingImage({ buffer, mimeType: file.type }) : null;
  const category = aiResult?.category || String(formData.get("category") || "");

  if (!isValidCategory(category)) {
    return NextResponse.json({ error: `Choose one category: ${categories.join(", ")}` }, { status: 400 });
  }

  const image = await saveUpload(session.user, file.name, file.type, buffer);
  const fallbackName = cleanName(file.name);
  const item = await addWardrobeItem(session.user, {
    brand: String(formData.get("brand") || aiResult?.brand || "").trim(),
    category,
    color: String(formData.get("color") || aiResult?.color || "").trim(),
    image,
    name: String(formData.get("name") || aiResult?.name || fallbackName).trim(),
    source: aiResult ? "ai" : "manual",
  });

  return NextResponse.json({ item });
}

function cleanName(fileName) {
  return String(fileName || "Wardrobe Item")
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[-_]+/g, " ")
    .trim() || "Wardrobe Item";
}
