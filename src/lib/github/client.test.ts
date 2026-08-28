import { describe, expect, it, vi } from "vitest";

import { exchangeGithubOAuthCode, syncGithubProjects } from "./client";
import { GITHUB_OWNER_ID, type GithubRuntimeConfig } from "./config";

const config: GithubRuntimeConfig = {
  appOrigin: "https://werft.example",
  clientId: "client-id",
  clientSecret: "client-secret",
  sessionSecret: Buffer.alloc(32, 2).toString("base64url"),
  ownerLogin: "Budladislav",
  ownerId: GITHUB_OWNER_ID,
  repositories: ["Planer"],
};

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function encodedFile(text: string, path: string) {
  return {
    type: "file",
    encoding: "base64",
    content: Buffer.from(text, "utf8").toString("base64"),
    size: Buffer.byteLength(text),
    html_url: `https://github.com/Budladislav/Planer/blob/main/${path}`,
  };
}

describe("GitHub synchronization client", () => {
  it("uses GitHub App OAuth without requesting a broad classic OAuth scope", async () => {
    let body = "";
    const fetcher = vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
      body = String(init?.body ?? "");
      return json({ access_token: "ghu_read_only_app_token_123456789", expires_in: 28_800 });
    });
    const codeVerifier = "v".repeat(43);
    await expect(exchangeGithubOAuthCode(
      "one-time-code",
      codeVerifier,
      config,
      fetcher as typeof fetch,
    )).resolves.toEqual({
      accessToken: "ghu_read_only_app_token_123456789",
      expiresIn: 28_800,
    });
    const parameters = new URLSearchParams(body);
    expect(parameters.get("redirect_uri")).toBe("https://werft.example/auth/github/callback");
    expect(parameters.get("code_verifier")).toBe(codeVerifier);
    expect(parameters.has("scope")).toBe(false);
  });

  it("reads only the catalog target/files and recognizes MonoFocus changelog", async () => {
    const requested: string[] = [];
    const fetcher = vi.fn(async (input: string | URL | Request) => {
      const url = new URL(input instanceof Request ? input.url : String(input));
      requested.push(`${url.pathname}${url.search}`);
      if (url.pathname === "/user") return json({ id: GITHUB_OWNER_ID, login: "Budladislav" });
      if (url.pathname === "/repos/Budladislav/Planer") {
        return json({
          id: 10,
          owner: { id: GITHUB_OWNER_ID, login: "Budladislav" },
          name: "Planer",
          full_name: "Budladislav/Planer",
          private: false,
          visibility: "public",
          html_url: "https://github.com/Budladislav/Planer",
          default_branch: "main",
          description: "Быстрый локальный планер",
          homepage: "https://budladislav.github.io/Planer/",
          topics: ["pwa"],
          language: "TypeScript",
          created_at: "2025-01-01T00:00:00Z",
          pushed_at: "2026-08-28T00:00:00Z",
          archived: false,
          has_pages: true,
        });
      }
      if (url.pathname === "/repos/Budladislav/Planer/commits/main") {
        return json({ sha: "abc123", html_url: "https://github.com/Budladislav/Planer/commit/abc123" });
      }
      const contentPrefix = "/repos/Budladislav/Planer/contents/";
      if (url.pathname.startsWith(contentPrefix)) {
        const path = decodeURIComponent(url.pathname.slice(contentPrefix.length));
        if (path === "package.json") {
          return json(encodedFile(JSON.stringify({
            version: "3.1.0",
            dependencies: { react: "19" },
            devDependencies: { vite: "8" },
          }), path));
        }
        if (path === "README.md") {
          return json(encodedFile("MonoFocus хранит задачи в localStorage и работает как PWA.", path));
        }
        if (path === "CHANGELOG_MONOFOCUS.md") {
          return json(encodedFile("## [3.1.0] — 2026-08-20\n\n### Добавлено\n- Быстрый фокус.", path));
        }
        return json({ message: "Not Found" }, 404);
      }
      if (url.pathname.endsWith("/git/trees/abc123")) {
        return json({ tree: [{ path: "src/storage.ts", type: "blob" }, { path: "sw.js", type: "blob" }] });
      }
      if (url.pathname.endsWith("/languages")) return json({ TypeScript: 1000 });
      if (url.pathname.endsWith("/releases")) return json([]);
      if (url.pathname.endsWith("/tags")) return json([]);
      if (url.pathname.endsWith("/actions/workflows")) return json({ workflows: [] });
      if (url.pathname.endsWith("/actions/runs")) return json({ workflow_runs: [] });
      return json({ message: "Unexpected endpoint" }, 500);
    });

    const envelope = await syncGithubProjects(
      "ghu_read_only_token_for_tests_123456",
      config,
      fetcher as typeof fetch,
      new Date("2026-08-28T12:00:00.000Z"),
    );

    expect(envelope.errors).toEqual([]);
    expect(envelope.projects).toHaveLength(1);
    expect(envelope.projects[0].changelog).toMatchObject({
      found: true,
      sourcePath: "CHANGELOG_MONOFOCUS.md",
    });
    expect(envelope.projects[0].version).toMatchObject({ value: "3.1.0", consistency: "consistent" });
    expect(requested.join("\n")).not.toMatch(/ren2gar|Snake-game|Archive/);
    const contentRequests = requested.filter((path) => path.includes("/contents/"));
    expect(contentRequests.every((path) => [
      "package.json",
      "README.md",
      "manifest.json",
      "public/manifest.webmanifest",
      "CHANGELOG_MONOFOCUS.md",
      "CHANGELOG.md",
    ].some((allowed) => path.includes(`/contents/${allowed}`)))).toBe(true);
  });

  it("rejects an authenticated account with a different immutable id", async () => {
    const fetcher = vi.fn(async () => json({ id: 123, login: "lookalike" }));
    await expect(syncGithubProjects(
      "ghu_wrong_owner_token_for_tests_123456",
      config,
      fetcher as typeof fetch,
    )).rejects.toMatchObject({ code: "invalid-owner" });
  });
});
