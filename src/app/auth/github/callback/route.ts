import { NextRequest, NextResponse } from "next/server";

import { exchangeGithubOAuthCode, getAuthenticatedGithubOwner, revokeGithubOAuthToken } from "@/lib/github/client";
import {
  GITHUB_OAUTH_STATE_COOKIE,
  GITHUB_SESSION_COOKIE,
  getGithubRuntimeConfig,
} from "@/lib/github/config";
import {
  oauthStateCookieOptions,
  PRIVATE_RESPONSE_HEADERS,
  sessionCookieOptions,
} from "@/lib/github/http";
import {
  openGithubOAuthState,
  safeEqual,
  sealGithubSession,
} from "@/lib/github/session";

const MAX_SESSION_TTL_SECONDS = 8 * 60 * 60;
const MIN_SESSION_TTL_SECONDS = 5 * 60;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function redirectWithResult(origin: string, returnTo: string, result: string): NextResponse {
  const destination = new URL(returnTo, origin);
  destination.searchParams.set("github", result);
  const response = NextResponse.redirect(destination);
  response.headers.set("Cache-Control", PRIVATE_RESPONSE_HEADERS["Cache-Control"]);
  response.cookies.set(GITHUB_OAUTH_STATE_COOKIE, "", oauthStateCookieOptions(0));
  return response;
}

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

  const stateValue = request.nextUrl.searchParams.get("state");
  const sealedState = request.cookies.get(GITHUB_OAUTH_STATE_COOKIE)?.value;
  const state = sealedState ? openGithubOAuthState(sealedState, config.sessionSecret) : null;
  if (!state || !stateValue || !safeEqual(state.nonce, stateValue)) {
    return redirectWithResult(config.appOrigin, "/settings", "invalid-state");
  }
  if (request.nextUrl.searchParams.has("error")) {
    return redirectWithResult(config.appOrigin, state.returnTo, "denied");
  }
  const code = request.nextUrl.searchParams.get("code");
  if (!code || code.length > 512) {
    return redirectWithResult(config.appOrigin, state.returnTo, "invalid-code");
  }

  let accessToken: string | null = null;
  try {
    const token = await exchangeGithubOAuthCode(code, state.codeVerifier, config);
    accessToken = token.accessToken;
    const owner = await getAuthenticatedGithubOwner(accessToken);
    const now = Math.floor(Date.now() / 1_000);
    const requestedTtl = token.expiresIn ?? MAX_SESSION_TTL_SECONDS;
    const ttl = Math.min(MAX_SESSION_TTL_SECONDS, Math.max(MIN_SESSION_TTL_SECONDS, requestedTtl));
    const expiresAt = now + ttl;
    const sealedSession = sealGithubSession({
      version: 1,
      ownerId: config.ownerId,
      ownerLogin: owner.login,
      accessToken,
      issuedAt: now,
      expiresAt,
    }, config.sessionSecret);
    const response = redirectWithResult(config.appOrigin, state.returnTo, "connected");
    response.cookies.set(GITHUB_SESSION_COOKIE, sealedSession, sessionCookieOptions(ttl));
    return response;
  } catch {
    if (accessToken) {
      await revokeGithubOAuthToken(accessToken, config).catch(() => undefined);
    }
    return redirectWithResult(config.appOrigin, state.returnTo, "unauthorized");
  }
}
