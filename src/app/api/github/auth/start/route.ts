import { NextRequest, NextResponse } from "next/server";

import {
  GITHUB_OAUTH_STATE_COOKIE,
  getGithubRuntimeConfig,
} from "@/lib/github/config";
import { oauthStateCookieOptions, PRIVATE_RESPONSE_HEADERS } from "@/lib/github/http";
import {
  pkceCodeChallenge,
  randomOAuthNonce,
  randomPkceCodeVerifier,
  sanitizeReturnTo,
  sealGithubOAuthState,
} from "@/lib/github/session";

const OAUTH_STATE_TTL_SECONDS = 10 * 60;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  let config;
  try {
    config = getGithubRuntimeConfig();
  } catch {
    return NextResponse.json(
      { error: "GitHub integration is not configured" },
      { status: 503, headers: PRIVATE_RESPONSE_HEADERS },
    );
  }

  const now = Math.floor(Date.now() / 1_000);
  const nonce = randomOAuthNonce();
  const codeVerifier = randomPkceCodeVerifier();
  const returnTo = sanitizeReturnTo(request.nextUrl.searchParams.get("returnTo"));
  const stateCookie = sealGithubOAuthState({
    version: 1,
    nonce,
    codeVerifier,
    returnTo,
    issuedAt: now,
    expiresAt: now + OAUTH_STATE_TTL_SECONDS,
  }, config.sessionSecret);

  const authorizationUrl = new URL("https://github.com/login/oauth/authorize");
  authorizationUrl.searchParams.set("client_id", config.clientId);
  authorizationUrl.searchParams.set("redirect_uri", `${config.appOrigin}/auth/github/callback`);
  authorizationUrl.searchParams.set("state", nonce);
  authorizationUrl.searchParams.set("code_challenge", pkceCodeChallenge(codeVerifier));
  authorizationUrl.searchParams.set("code_challenge_method", "S256");

  const response = NextResponse.redirect(authorizationUrl);
  response.headers.set("Cache-Control", PRIVATE_RESPONSE_HEADERS["Cache-Control"]);
  response.cookies.set(
    GITHUB_OAUTH_STATE_COOKIE,
    stateCookie,
    oauthStateCookieOptions(OAUTH_STATE_TTL_SECONDS),
  );
  return response;
}
