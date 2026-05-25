import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const DATA_ROOT = path.join(process.cwd(), "data", "users");
const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

function assertUser(user) {
  if (!user?.id || !/^[a-f0-9]{32}$/.test(user.id)) {
    throw new Error("Invalid user session");
  }
}

function userDataDir(user) {
  assertUser(user);
  return path.join(DATA_ROOT, user.id);
}

function wardrobePath(user) {
  return path.join(userDataDir(user), "wardrobe.json");
}

function profilePath(user) {
  return path.join(userDataDir(user), "profile.json");
}

export async function saveUserProfile(user) {
  await mkdir(userDataDir(user), { recursive: true });
  await writeFile(profilePath(user), JSON.stringify(user, null, 2));
}

export async function readWardrobe(user) {
  try {
    const contents = await readFile(wardrobePath(user), "utf8");
    const items = JSON.parse(contents);
    return Array.isArray(items) ? items : [];
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

export async function writeWardrobe(user, items) {
  await mkdir(userDataDir(user), { recursive: true });
  await writeFile(wardrobePath(user), JSON.stringify(items, null, 2));
}

export async function addWardrobeItem(user, item) {
  const items = await readWardrobe(user);
  const nextItem = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    ...item,
  };

  items.unshift(nextItem);
  await writeWardrobe(user, items);
  return nextItem;
}

export async function removeWardrobeItem(user, itemId) {
  const items = await readWardrobe(user);
  const nextItems = items.filter((item) => item.id !== itemId);
  await writeWardrobe(user, nextItems);
  return nextItems;
}

export async function saveUpload(user, fileName, mimeType, buffer) {
  assertUser(user);

  const extension = getExtension(fileName, mimeType);
  const uploadDir = path.join(UPLOAD_ROOT, user.id);
  const storedName = `${randomUUID()}${extension}`;

  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, storedName), buffer);

  return `/uploads/${user.id}/${storedName}`;
}

function getExtension(fileName, mimeType) {
  const fromName = path.extname(fileName || "").toLowerCase();
  if ([".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(fromName)) return fromName;

  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/webp") return ".webp";
  if (mimeType === "image/gif") return ".gif";
  return ".jpg";
}
