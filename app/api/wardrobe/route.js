import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { getSession } from "../../../lib/auth";
import { readWardrobe, removeWardrobeItem } from "../../../lib/storage";
import { isDatabaseConfigured } from "../../../lib/db";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database is not configured", items: [] }, { status: 503 });
  }

  const items = await readWardrobe(session.user);
  return NextResponse.json({ items });
}

export async function DELETE(request) {
  const session = await getSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database is not configured" }, { status: 503 });
  }

  const { itemId } = await request.json();

  if (!itemId) {
    return NextResponse.json({ error: "Missing item id" }, { status: 400 });
  }

  const { deletedItem, items } = await removeWardrobeItem(session.user, itemId);

  if (deletedItem?.pathname && process.env.BLOB_READ_WRITE_TOKEN) {
    await del(deletedItem.pathname).catch(() => {});
  }

  return NextResponse.json({ items });
}
