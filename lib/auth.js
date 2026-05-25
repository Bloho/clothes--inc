import { cookies } from "next/headers";
import { createHmac, createHash, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "wardrobe_session";
export const STATE_COOKIE = "wardrobe_oauth_state";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function base64url(input) {
  return Buffer.from(input).toString("base64url");
}

function getAuthSecret() {
  return process.env.AUTH_SECRET || "local-development-secret-change-me";
}

function signPayload(payload) {
  return createHmac("sha256", getAuthSecret()).update(payload).digest("base64url");
}

export function getUserId(email) {
  return createHash("sha256").update(email.toLowerCase()).digest("hex").slice(0, 32);
}

export function createSessionValue(user) {
  const now = Math.floor(Date.now() / 1000);
  const payload = base64url(
    JSON.stringify({
      user: {
        id: getUserId(user.email),
        email: user.email,
        name: user.name || user.email,
        picture: user.picture || "",
      },
      iat: now,
      exp: now + SESSION_MAX_AGE_SECONDS,
    }),
  );

  return `${payload}.${signPayload(payload)}`;
}

export function verifySessionValue(value) {
  if (!value || !value.includes(".")) return null;

  const [payload, signature] = value.split(".");
  const expected = signPayload(payload);
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (providedBuffer.length !== expectedBuffer.length || !timingSafeEqual(providedBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!session?.user?.email || !session?.exp || session.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  return verifySessionValue(cookieStore.get(SESSION_COOKIE)?.value);
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  };
}

export function getShortName(user) {
  if (!user?.name) return "U";
  return user.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function isGoogleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}
