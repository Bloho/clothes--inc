import { NextResponse } from "next/server";
import { getSession } from "../../../lib/auth";
import { readWardrobe, removeWardrobeItem } from "../../../lib/storage";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await readWardrobe(session.user);
  return NextResponse.json({ items });
}

export async function DELETE(request) {
  const session = await getSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { itemId } = await request.json();

  if (!itemId) {
    return NextResponse.json({ error: "Missing item id" }, { status: 400 });
  }

  const items = await removeWardrobeItem(session.user, itemId);
  return NextResponse.json({ items });
}
