import { randomUUID } from "node:crypto";
import { ensureSchema, getSql, isDatabaseConfigured } from "./db";

function assertUser(user) {
  if (!user?.id || !/^[a-f0-9]{32}$/.test(user.id)) {
    throw new Error("Invalid user session");
  }
}

function mapWardrobeItem(row) {
  return {
    id: row.id,
    brand: row.brand || "",
    category: row.category,
    color: row.color || "",
    createdAt: row.created_at,
    image: row.image_url,
    name: row.name,
    pathname: row.blob_pathname || "",
    source: row.source,
  };
}

export async function upsertUserProfile(user) {
  assertUser(user);

  if (!isDatabaseConfigured()) {
    throw new Error("Database is not configured");
  }

  await ensureSchema();
  const sql = getSql();

  await sql`
    INSERT INTO users (id, email, name, picture, updated_at)
    VALUES (${user.id}, ${user.email}, ${user.name}, ${user.picture || ""}, NOW())
    ON CONFLICT (id)
    DO UPDATE SET
      email = EXCLUDED.email,
      name = EXCLUDED.name,
      picture = EXCLUDED.picture,
      updated_at = NOW()
  `;
}

export async function readWardrobe(user) {
  assertUser(user);

  if (!isDatabaseConfigured()) {
    return [];
  }

  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT id, brand, category, color, created_at, image_url, name, blob_pathname, source
    FROM wardrobe_items
    WHERE user_id = ${user.id}
    ORDER BY created_at DESC
  `;

  return rows.map(mapWardrobeItem);
}

export async function addWardrobeItem(user, item) {
  assertUser(user);

  if (!isDatabaseConfigured()) {
    throw new Error("Database is not configured");
  }

  await ensureSchema();
  const sql = getSql();
  const id = randomUUID();

  const rows = await sql`
    INSERT INTO wardrobe_items (
      id,
      user_id,
      name,
      brand,
      color,
      category,
      image_url,
      blob_pathname,
      source
    )
    VALUES (
      ${id},
      ${user.id},
      ${item.name},
      ${item.brand || ""},
      ${item.color || ""},
      ${item.category},
      ${item.image},
      ${item.pathname || ""},
      ${item.source || "manual"}
    )
    RETURNING id, brand, category, color, created_at, image_url, name, blob_pathname, source
  `;

  return mapWardrobeItem(rows[0]);
}

export async function removeWardrobeItem(user, itemId) {
  assertUser(user);

  if (!isDatabaseConfigured()) {
    return { deletedItem: null, items: [] };
  }

  await ensureSchema();
  const sql = getSql();

  const deletedRows = await sql`
    DELETE FROM wardrobe_items
    WHERE user_id = ${user.id} AND id = ${itemId}
    RETURNING id, brand, category, color, created_at, image_url, name, blob_pathname, source
  `;

  const items = await readWardrobe(user);

  return {
    deletedItem: deletedRows[0] ? mapWardrobeItem(deletedRows[0]) : null,
    items,
  };
}
