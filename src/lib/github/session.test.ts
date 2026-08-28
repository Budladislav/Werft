import { describe, expect, it } from "vitest";

import { GITHUB_OWNER_ID } from "./config";
import {
  openGithubOAuthState,
  openGithubSession,
  pkceCodeChallenge,
  randomPkceCodeVerifier,
  safeEqual,
  sanitizeReturnTo,
  sealGithubOAuthState,
  sealGithubSession,
  type GithubOAuthStateClaims,
  type GithubSessionClaims,
} from "./session";

const SECRET = Buffer.alloc(32, 7).toString("base64url");

describe("GitHub session encryption", () => {
  const claims: GithubSessionClaims = {
    version: 1,
    ownerId: GITHUB_OWNER_ID,
    ownerLogin: "Budladislav",
    accessToken: "ghu_test_token_with_sufficient_length_123456",
    issuedAt: 1_000,
    expiresAt: 2_000,
  };

  it("round-trips an authenticated owner session", () => {
    const sealed = sealGithubSession(claims, SECRET);
    expect(sealed).not.toContain(claims.accessToken);
    expect(openGithubSession(sealed, SECRET, 1_500)).toEqual(claims);
  });

  it("rejects tampering and expired sessions", () => {
    const sealed = sealGithubSession(claims, SECRET);
    const tampered = `${sealed.slice(0, -1)}${sealed.endsWith("a") ? "b" : "a"}`;
    expect(openGithubSession(tampered, SECRET, 1_500)).toBeNull();
    expect(openGithubSession(sealed, SECRET, 2_000)).toBeNull();
  });

  it("round-trips short-lived OAuth state independently", () => {
    const state: GithubOAuthStateClaims = {
      version: 1,
      nonce: "x".repeat(43),
      codeVerifier: "v".repeat(43),
      returnTo: "/overview?github=connect",
      issuedAt: 100,
      expiresAt: 700,
    };
    expect(openGithubOAuthState(sealGithubOAuthState(state, SECRET), SECRET, 200)).toEqual(state);
  });

  it("keeps the PKCE verifier confidential and rejects state without it", () => {
    const state: GithubOAuthStateClaims = {
      version: 1,
      nonce: "n".repeat(43),
      codeVerifier: "p".repeat(43),
      returnTo: "/settings",
      issuedAt: 100,
      expiresAt: 700,
    };
    const sealed = sealGithubOAuthState(state, SECRET);
    expect(sealed).not.toContain(state.codeVerifier);
    const legacyState = { ...state } as Partial<GithubOAuthStateClaims>;
    delete legacyState.codeVerifier;
    expect(() => sealGithubOAuthState(legacyState as GithubOAuthStateClaims, SECRET)).toThrow(
      "Invalid GitHub OAuth state claims",
    );
  });
});

describe("OAuth navigation guards", () => {
  it("keeps same-origin paths and rejects open redirects", () => {
    expect(sanitizeReturnTo("/dock?from=github#sync")).toBe("/dock?from=github#sync");
    expect(sanitizeReturnTo("https://attacker.invalid/path")).toBe("/overview");
    expect(sanitizeReturnTo("//attacker.invalid/path")).toBe("/overview");
    expect(sanitizeReturnTo("/\\attacker.invalid")).toBe("/overview");
  });

  it("compares OAuth state without early string comparison", () => {
    expect(safeEqual("same-state", "same-state")).toBe(true);
    expect(safeEqual("same-state", "other-state")).toBe(false);
  });

  it("creates RFC 7636-compatible S256 PKCE values", () => {
    const verifier = randomPkceCodeVerifier();
    expect(verifier).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(pkceCodeChallenge(verifier)).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(pkceCodeChallenge("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"))
      .toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
    expect(() => pkceCodeChallenge("too-short")).toThrow("Invalid PKCE code verifier");
  });
});
