import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { STATE_COOKIE, isGoogleConfigured } from "../../../../lib/auth";

export const runtime = "nodejs";

export async function GET(request) {
  const origin = new URL(request.url).origin;

  if (!isGoogleConfigured()) {
    return NextResponse.redirect(`${origin}/?auth=missing-google-config`);
  }

  const state = randomBytes(32).toString("base64url");
  const redirectUri = `${origin}/api/auth/google/callback`;
  const searchParams = new URLSearchParams({
    access_type: "online",
    client_id: process.env.GOOGLE_CLIENT_ID,
    prompt: "select_account",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
  });

  const response = NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${searchParams.toString()}`);

  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    maxAge: 60 * 10,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
