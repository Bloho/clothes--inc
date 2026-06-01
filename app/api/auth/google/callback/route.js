import { NextResponse } from "next/server";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { SESSION_COOKIE, STATE_COOKIE, createSessionValue, getSessionCookieOptions, getUserId, isGoogleConfigured } from "../../../../../lib/auth";
import { upsertUserProfile } from "../../../../../lib/storage";

export const runtime = "nodejs";

const googleJwks = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export async function GET(request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const storedState = request.cookies.get(STATE_COOKIE)?.value;

  if (!isGoogleConfigured()) {
    return NextResponse.redirect(`${origin}/?auth=missing-google-config`);
  }

  if (!code || !state || !storedState || state !== storedState) {
    return NextResponse.redirect(`${origin}/?auth=invalid-state`);
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: `${origin}/api/auth/google/callback`,
    }),
  });

  if (!tokenResponse.ok) {
    return NextResponse.redirect(`${origin}/?auth=token-error`);
  }

  const tokens = await tokenResponse.json();
  const { payload } = await jwtVerify(tokens.id_token, googleJwks, {
    audience: process.env.GOOGLE_CLIENT_ID,
    issuer: ["https://accounts.google.com", "accounts.google.com"],
  });

  if (!payload.email || payload.email_verified === false) {
    return NextResponse.redirect(`${origin}/?auth=email-not-verified`);
  }

  const user = {
    email: payload.email,
    name: payload.name || payload.email,
    picture: payload.picture || "",
  };

  const sessionValue = createSessionValue(user);
  const response = NextResponse.redirect(origin);
  response.cookies.set(SESSION_COOKIE, sessionValue, getSessionCookieOptions());
  response.cookies.delete(STATE_COOKIE);

  try {
    await upsertUserProfile({
      id: getUserId(user.email),
      ...user,
    });
  } catch {
    return NextResponse.redirect(`${origin}/?auth=storage-not-configured`);
  }

  return response;
}
