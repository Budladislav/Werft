import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

import { GITHUB_OWNER_ID } from "./config";

const SESSION_AAD = Buffer.from("werft:github-session:v1", "utf8");
const OAUTH_STATE_AAD = Buffer.from("werft:github-oauth-state:v1", "utf8");
const IV_BYTES = 12;
const TAG_BYTES = 16;
const SESSION_VERSION = 1;
const PKCE_CODE_VERIFIER_PATTERN = /^[A-Za-z0-9._~-]{43,128}$/;

export type GithubSessionClaims = {
  version: typeof SESSION_VERSION;
  ownerId: typeof GITHUB_OWNER_ID;
  ownerLogin: string;
  accessToken: string;
  issuedAt: number;
  expiresAt: number;
};

export type GithubOAuthStateClaims = {
  version: typeof SESSION_VERSION;
  nonce: string;
  codeVerifier: string;
  returnTo: string;
  issuedAt: number;
  expiresAt: number;
};

function encryptionKey(secret: string): Buffer {
  let decoded: Buffer;
  try {
    decoded = Buffer.from(secret, "base64url");
  } catch {
    throw new Error("WERFT_SESSION_SECRET must be a base64url-encoded 32-byte key");
  }
  if (decoded.byteLength !== 32) {
    throw new Error("WERFT_SESSION_SECRET must be a base64url-encoded 32-byte key");
  }
  return decoded;
}

function sealPayload(payload: object, secret: string, additionalData: Buffer): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(secret), iv, { authTagLength: TAG_BYTES });
  cipher.setAAD(additionalData);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [iv, encrypted, tag].map((part) => part.toString("base64url")).join(".");
}

function openPayload(value: string, secret: string, additionalData: Buffer): unknown | null {
  try {
    const parts = value.split(".");
    if (parts.length !== 3) return null;
    const [ivValue, encryptedValue, tagValue] = parts;
    const iv = Buffer.from(ivValue, "base64url");
    const encrypted = Buffer.from(encryptedValue, "base64url");
    const tag = Buffer.from(tagValue, "base64url");
    if (iv.byteLength !== IV_BYTES || tag.byteLength !== TAG_BYTES || encrypted.byteLength === 0) return null;
    if (iv.toString("base64url") !== ivValue
      || encrypted.toString("base64url") !== encryptedValue
      || tag.toString("base64url") !== tagValue) return null;

    const decipher = createDecipheriv("aes-256-gcm", encryptionKey(secret), iv, { authTagLength: TAG_BYTES });
    decipher.setAAD(additionalData);
    decipher.setAuthTag(tag);
    const cleartext = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
    return JSON.parse(cleartext) as unknown;
  } catch {
    return null;
  }
}

function isFiniteInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value);
}

function isGithubSessionClaims(value: unknown): value is GithubSessionClaims {
  if (!value || typeof value !== "object") return false;
  const claims = value as Record<string, unknown>;
  return claims.version === SESSION_VERSION
    && claims.ownerId === GITHUB_OWNER_ID
    && typeof claims.ownerLogin === "string"
    && claims.ownerLogin.length > 0
    && claims.ownerLogin.length <= 39
    && typeof claims.accessToken === "string"
    && claims.accessToken.length >= 20
    && claims.accessToken.length <= 2_048
    && isFiniteInteger(claims.issuedAt)
    && isFiniteInteger(claims.expiresAt)
    && claims.expiresAt > claims.issuedAt;
}

function isOAuthStateClaims(value: unknown): value is GithubOAuthStateClaims {
  if (!value || typeof value !== "object") return false;
  const claims = value as Record<string, unknown>;
  return claims.version === SESSION_VERSION
    && typeof claims.nonce === "string"
    && /^[A-Za-z0-9_-]{32,200}$/.test(claims.nonce)
    && typeof claims.codeVerifier === "string"
    && PKCE_CODE_VERIFIER_PATTERN.test(claims.codeVerifier)
    && typeof claims.returnTo === "string"
    && claims.returnTo.startsWith("/")
    && !claims.returnTo.startsWith("//")
    && isFiniteInteger(claims.issuedAt)
    && isFiniteInteger(claims.expiresAt)
    && claims.expiresAt > claims.issuedAt;
}

export function sealGithubSession(claims: GithubSessionClaims, secret: string): string {
  if (!isGithubSessionClaims(claims)) throw new Error("Invalid GitHub session claims");
  return sealPayload(claims, secret, SESSION_AAD);
}

export function openGithubSession(
  value: string,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1_000),
): GithubSessionClaims | null {
  const claims = openPayload(value, secret, SESSION_AAD);
  if (!isGithubSessionClaims(claims) || claims.expiresAt <= nowSeconds) return null;
  return claims;
}

export function sealGithubOAuthState(claims: GithubOAuthStateClaims, secret: string): string {
  if (!isOAuthStateClaims(claims)) throw new Error("Invalid GitHub OAuth state claims");
  return sealPayload(claims, secret, OAUTH_STATE_AAD);
}

export function openGithubOAuthState(
  value: string,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1_000),
): GithubOAuthStateClaims | null {
  const claims = openPayload(value, secret, OAUTH_STATE_AAD);
  if (!isOAuthStateClaims(claims) || claims.expiresAt <= nowSeconds) return null;
  return claims;
}

export function randomOAuthNonce(): string {
  return randomBytes(32).toString("base64url");
}

export function randomPkceCodeVerifier(): string {
  return randomBytes(32).toString("base64url");
}

export function pkceCodeChallenge(codeVerifier: string): string {
  if (!PKCE_CODE_VERIFIER_PATTERN.test(codeVerifier)) {
    throw new Error("Invalid PKCE code verifier");
  }
  return createHash("sha256").update(codeVerifier, "ascii").digest("base64url");
}

export function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");
  return leftBuffer.byteLength === rightBuffer.byteLength && timingSafeEqual(leftBuffer, rightBuffer);
}

export function sanitizeReturnTo(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/overview";
  }
  try {
    const parsed = new URL(value, "https://werft.invalid");
    if (parsed.origin !== "https://werft.invalid") return "/overview";
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "/overview";
  }
}
