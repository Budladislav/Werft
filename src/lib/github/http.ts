import { NextRequest, NextResponse } from "next/server";

import {
  GITHUB_OAUTH_STATE_COOKIE,
  GITHUB_SESSION_COOKIE,
  type GithubRuntimeConfig,
} from "./config";
import { openGithubSession, type GithubSessionClaims } from "./session";

export const PRIVATE_RESPONSE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  Pragma: "no-cache",
  Vary: "Cookie",
};

export function privateJson(body: unknown, init?: ResponseInit): NextResponse {
  return NextResponse.json(body, {
    ...init,
    headers: { ...PRIVATE_RESPONSE_HEADERS, ...init?.headers },
  });
}

export function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export function oauthStateCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/auth/github/callback",
    maxAge,
  };
}

export function clearGithubCookies(response: NextResponse): void {
  response.cookies.set(GITHUB_SESSION_COOKIE, "", sessionCookieOptions(0));
  response.cookies.set(GITHUB_OAUTH_STATE_COOKIE, "", oauthStateCookieOptions(0));
}

export function githubSessionFromRequest(
  request: NextRequest,
  config: GithubRuntimeConfig,
): GithubSessionClaims | null {
  const value = request.cookies.get(GITHUB_SESSION_COOKIE)?.value;
  return value ? openGithubSession(value, config.sessionSecret) : null;
}

export function requestIsSameOrigin(request: NextRequest, expectedOrigin: string): boolean {
  const origin = request.headers.get("origin");
  if (origin) return origin === expectedOrigin;
  const referer = request.headers.get("referer");
  if (!referer) return true;
  try {
    return new URL(referer).origin === expectedOrigin;
  } catch {
    return false;
  }
}
