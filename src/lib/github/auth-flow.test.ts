import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GET as startGithubAuthorization } from "@/app/api/github/auth/start/route";
import { GET as finishGithubAuthorization } from "@/app/auth/github/callback/route";
import {
  GITHUB_OAUTH_STATE_COOKIE,
  GITHUB_OWNER_ID,
  GITHUB_SESSION_COOKIE,
} from "./config";
import {
  openGithubOAuthState,
  openGithubSession,
  pkceCodeChallenge,
  sealGithubOAuthState,
  type GithubOAuthStateClaims,
} from "./session";

const APP_ORIGIN = "https://werft.example";
const SESSION_SECRET = Buffer.alloc(32, 9).toString("base64url");

function configureGithubEnvironment(): void {
  vi.stubEnv("WERFT_APP_ORIGIN", APP_ORIGIN);
  vi.stubEnv("GITHUB_APP_CLIENT_ID", "test-client-id");
  vi.stubEnv("GITHUB_APP_CLIENT_SECRET", "test-client-secret");
  vi.stubEnv("WERFT_SESSION_SECRET", SESSION_SECRET);
  vi.stubEnv("GITHUB_REPOSITORIES", "Planer");
}

describe("GitHub App OAuth PKCE routes", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("binds an S256 challenge to the encrypted HttpOnly state cookie", async () => {
    configureGithubEnvironment();
    const response = await startGithubAuthorization(new NextRequest(
      `${APP_ORIGIN}/api/github/auth/start?returnTo=${encodeURIComponent("https://attacker.invalid")}`,
    ));

    expect(response.status).toBe(307);
    const authorizationUrl = new URL(response.headers.get("location") ?? "");
    const sealedState = response.cookies.get(GITHUB_OAUTH_STATE_COOKIE)?.value;
    const state = sealedState
      ? openGithubOAuthState(sealedState, SESSION_SECRET)
      : null;

    expect(authorizationUrl.origin).toBe("https://github.com");
    expect(authorizationUrl.pathname).toBe("/login/oauth/authorize");
    expect(authorizationUrl.searchParams.get("scope")).toBeNull();
    expect(authorizationUrl.searchParams.get("code_challenge_method")).toBe("S256");
    expect(state).not.toBeNull();
    expect(state?.returnTo).toBe("/overview");
    expect(authorizationUrl.searchParams.get("state")).toBe(state?.nonce);
    expect(authorizationUrl.searchParams.get("code_challenge"))
      .toBe(pkceCodeChallenge(state?.codeVerifier ?? ""));

    const setCookie = response.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=lax");
    expect(setCookie).toContain("Path=/auth/github/callback");
    expect(setCookie).not.toContain(state?.codeVerifier ?? "not-present");
  });

  it("uses the matching verifier during code exchange and replaces state with a session", async () => {
    configureGithubEnvironment();
    const now = Math.floor(Date.now() / 1_000);
    const state: GithubOAuthStateClaims = {
      version: 1,
      nonce: "n".repeat(43),
      codeVerifier: "v".repeat(43),
      returnTo: "/settings",
      issuedAt: now,
      expiresAt: now + 600,
    };
    const sealedState = sealGithubOAuthState(state, SESSION_SECRET);
    let tokenRequestBody = "";
    const fetcher = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = new URL(input instanceof Request ? input.url : String(input));
      if (url.pathname === "/login/oauth/access_token") {
        tokenRequestBody = String(init?.body ?? "");
        return Response.json({
          access_token: "ghu_pkce_route_test_token_123456789",
          expires_in: 3_600,
        });
      }
      if (url.pathname === "/user") {
        return Response.json({ id: GITHUB_OWNER_ID, login: "Budladislav" });
      }
      return Response.json({ message: "Unexpected endpoint" }, { status: 500 });
    });
    vi.stubGlobal("fetch", fetcher);

    const callbackUrl = `${APP_ORIGIN}/auth/github/callback?code=one-time-code&state=${state.nonce}`;
    const response = await finishGithubAuthorization(new NextRequest(callbackUrl, {
      headers: { cookie: `${GITHUB_OAUTH_STATE_COOKIE}=${sealedState}` },
    }));

    const parameters = new URLSearchParams(tokenRequestBody);
    expect(parameters.get("code_verifier")).toBe(state.codeVerifier);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(`${APP_ORIGIN}/settings?github=connected`);
    expect(response.cookies.get(GITHUB_OAUTH_STATE_COOKIE)?.value).toBe("");
    const sealedSession = response.cookies.get(GITHUB_SESSION_COOKIE)?.value;
    expect(sealedSession ? openGithubSession(sealedSession, SESSION_SECRET) : null)
      .toMatchObject({ ownerId: GITHUB_OWNER_ID, ownerLogin: "Budladislav" });
  });
});
