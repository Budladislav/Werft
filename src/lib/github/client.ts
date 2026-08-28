import {
  GITHUB_OWNER_ID,
  githubRepositoryTargets,
  type GithubRepositoryTarget,
  type GithubRuntimeConfig,
} from "./config";
import {
  KNOWN_GITHUB_FILES,
  normalizeGithubRepository,
  type GithubRepositorySnapshot,
  type KnownGithubFile,
} from "./normalization";
import type { GithubSyncEnvelope } from "./types";

const GITHUB_API_ORIGIN = "https://api.github.com";
const GITHUB_OAUTH_TOKEN_URL = "https://github.com/login/oauth/access_token";
const MAX_FILE_BYTES = 2_000_000;
const MAX_TREE_PATHS = 10_000;

type GithubFetch = typeof fetch;

type GithubApiErrorCode = GithubSyncEnvelope["errors"][number]["code"];

export class GithubApiError extends Error {
  readonly status: number;
  readonly code: GithubApiErrorCode;

  constructor(status: number, message: string, code?: GithubApiErrorCode) {
    super(message);
    this.name = "GithubApiError";
    this.status = status;
    this.code = code ?? (status === 401 || status === 403
      ? "forbidden"
      : status === 404
        ? "not-found"
        : status === 429
          ? "rate-limited"
          : "upstream-error");
  }
}

function githubHeaders(accessToken: string): HeadersInit {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${accessToken}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "Werft-project-control-center",
  };
}

async function githubJson<T>(
  url: string,
  accessToken: string,
  fetcher: GithubFetch,
): Promise<T> {
  const response = await fetcher(url, {
    headers: githubHeaders(accessToken),
    cache: "no-store",
  });
  if (!response.ok) {
    let detail = `GitHub returned ${response.status}`;
    try {
      const body = await response.json() as { message?: string };
      if (body.message) detail = body.message;
    } catch {
      // The status code remains the stable error signal.
    }
    const remaining = response.headers.get("x-ratelimit-remaining");
    if (response.status === 403 && remaining === "0") {
      throw new GithubApiError(429, "GitHub API rate limit exceeded");
    }
    throw new GithubApiError(response.status, detail);
  }
  return response.json() as Promise<T>;
}

async function optionalGithubJson<T>(
  url: string,
  accessToken: string,
  fetcher: GithubFetch,
): Promise<T | null> {
  try {
    return await githubJson<T>(url, accessToken, fetcher);
  } catch (error) {
    if (error instanceof GithubApiError && (error.status === 403 || error.status === 404)) {
      return null;
    }
    throw error;
  }
}

function repositoryApiUrl(target: GithubRepositoryTarget, path = ""): string {
  const owner = encodeURIComponent(target.ownerLogin);
  const repository = encodeURIComponent(target.name);
  return `${GITHUB_API_ORIGIN}/repos/${owner}/${repository}${path}`;
}

function encodedRepositoryPath(path: string): string {
  return path.split("/").map(encodeURIComponent).join("/");
}

function allowedFilesFor(target: GithubRepositoryTarget): KnownGithubFile[] {
  const allowed = new Set<KnownGithubFile>([
    "package.json",
    "README.md",
    "manifest.json",
    "public/manifest.webmanifest",
  ]);
  for (const path of target.changelogPaths) {
    if ((KNOWN_GITHUB_FILES as readonly string[]).includes(path)) {
      allowed.add(path as KnownGithubFile);
    }
  }
  return [...allowed];
}

async function repositoryFile(
  target: GithubRepositoryTarget,
  path: KnownGithubFile,
  branch: string,
  accessToken: string,
  fetcher: GithubFetch,
): Promise<{ path: KnownGithubFile; text: string; url: string } | null> {
  type ContentResponse = {
    type: string;
    encoding?: string;
    content?: string;
    size?: number;
    html_url?: string;
  };
  const query = new URLSearchParams({ ref: branch });
  const value = await optionalGithubJson<ContentResponse>(
    repositoryApiUrl(target, `/contents/${encodedRepositoryPath(path)}?${query}`),
    accessToken,
    fetcher,
  );
  if (!value || value.type !== "file" || value.encoding !== "base64" || !value.content) return null;
  if ((value.size ?? 0) > MAX_FILE_BYTES) return null;
  const decoded = Buffer.from(value.content.replace(/\s/g, ""), "base64");
  if (decoded.byteLength > MAX_FILE_BYTES) return null;
  return {
    path,
    text: decoded.toString("utf8"),
    url: value.html_url
      ?? `https://github.com/${encodeURIComponent(target.ownerLogin)}/${encodeURIComponent(target.name)}/blob/${encodeURIComponent(branch)}/${encodedRepositoryPath(path)}`,
  };
}

async function repositorySnapshot(
  target: GithubRepositoryTarget,
  accessToken: string,
  fetcher: GithubFetch,
): Promise<GithubRepositorySnapshot> {
  type RepositoryResponse = GithubRepositorySnapshot["repository"];
  const repository = await githubJson<RepositoryResponse>(
    repositoryApiUrl(target),
    accessToken,
    fetcher,
  );
  if (repository.owner.id !== target.ownerId) {
    throw new GithubApiError(
      422,
      "Repository owner does not match the configured immutable owner id",
      "invalid-owner",
    );
  }
  if (repository.name.toLowerCase() !== target.name.toLowerCase()) {
    throw new GithubApiError(404, "Repository response does not match the allowlisted target");
  }

  type CommitResponse = { sha: string; html_url: string };
  const head = await optionalGithubJson<CommitResponse>(
    repositoryApiUrl(target, `/commits/${encodeURIComponent(repository.default_branch)}`),
    accessToken,
    fetcher,
  );

  const fileResults = await Promise.all(
    allowedFilesFor(target).map((path) => repositoryFile(
      target,
      path,
      repository.default_branch,
      accessToken,
      fetcher,
    )),
  );
  const files: GithubRepositorySnapshot["files"] = {};
  const fileUrls: GithubRepositorySnapshot["fileUrls"] = {};
  for (const file of fileResults) {
    if (!file) continue;
    files[file.path] = file.text;
    fileUrls[file.path] = file.url;
  }

  type TreeResponse = { tree?: Array<{ path?: string; type?: string }>; truncated?: boolean };
  type LanguagesResponse = Record<string, number>;
  type ReleasesResponse = GithubRepositorySnapshot["releases"];
  type TagsResponse = GithubRepositorySnapshot["tags"];
  type WorkflowsResponse = { workflows?: GithubRepositorySnapshot["workflows"] };
  type RunsResponse = { workflow_runs?: GithubRepositorySnapshot["latestRun"][] };

  const [tree, languages, releases, tags, workflows, runs] = await Promise.all([
    head
      ? optionalGithubJson<TreeResponse>(
        repositoryApiUrl(target, `/git/trees/${encodeURIComponent(head.sha)}?recursive=1`),
        accessToken,
        fetcher,
      )
      : Promise.resolve(null),
    optionalGithubJson<LanguagesResponse>(repositoryApiUrl(target, "/languages"), accessToken, fetcher),
    optionalGithubJson<ReleasesResponse>(repositoryApiUrl(target, "/releases?per_page=20"), accessToken, fetcher),
    optionalGithubJson<TagsResponse>(repositoryApiUrl(target, "/tags?per_page=20"), accessToken, fetcher),
    optionalGithubJson<WorkflowsResponse>(repositoryApiUrl(target, "/actions/workflows?per_page=100"), accessToken, fetcher),
    optionalGithubJson<RunsResponse>(repositoryApiUrl(target, "/actions/runs?per_page=1&exclude_pull_requests=true"), accessToken, fetcher),
  ]);

  return {
    repository,
    head,
    files,
    fileUrls,
    treePaths: (tree?.tree ?? [])
      .filter((entry) => entry.type === "blob" && typeof entry.path === "string")
      .slice(0, MAX_TREE_PATHS)
      .map((entry) => entry.path as string),
    languages: languages ?? {},
    releases: releases ?? [],
    tags: tags ?? [],
    workflows: workflows?.workflows ?? [],
    latestRun: runs?.workflow_runs?.[0] ?? null,
  };
}

export async function exchangeGithubOAuthCode(
  code: string,
  codeVerifier: string,
  config: GithubRuntimeConfig,
  fetcher: GithubFetch = fetch,
): Promise<{ accessToken: string; expiresIn: number | null }> {
  const response = await fetcher(GITHUB_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "Werft-project-control-center",
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      code_verifier: codeVerifier,
      redirect_uri: `${config.appOrigin}/auth/github/callback`,
    }),
    cache: "no-store",
  });
  const payload = await response.json() as {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };
  if (!response.ok || !payload.access_token) {
    throw new GithubApiError(response.status || 502, payload.error_description ?? payload.error ?? "OAuth token exchange failed");
  }
  return {
    accessToken: payload.access_token,
    expiresIn: Number.isSafeInteger(payload.expires_in) ? payload.expires_in ?? null : null,
  };
}

export async function getAuthenticatedGithubOwner(
  accessToken: string,
  fetcher: GithubFetch = fetch,
): Promise<{ id: number; login: string }> {
  const user = await githubJson<{ id: number; login: string }>(
    `${GITHUB_API_ORIGIN}/user`,
    accessToken,
    fetcher,
  );
  if (user.id !== GITHUB_OWNER_ID) {
    throw new GithubApiError(
      403,
      "This GitHub account is not the configured Werft owner",
      "invalid-owner",
    );
  }
  return user;
}

export async function revokeGithubOAuthToken(
  accessToken: string,
  config: GithubRuntimeConfig,
  fetcher: GithubFetch = fetch,
): Promise<void> {
  const authorization = Buffer.from(`${config.clientId}:${config.clientSecret}`, "utf8").toString("base64");
  await fetcher(`https://api.github.com/applications/${encodeURIComponent(config.clientId)}/token`, {
    method: "DELETE",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Basic ${authorization}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "Werft-project-control-center",
    },
    body: JSON.stringify({ access_token: accessToken }),
    cache: "no-store",
  });
}

export async function syncGithubProjects(
  accessToken: string,
  config: GithubRuntimeConfig,
  fetcher: GithubFetch = fetch,
  now = new Date(),
): Promise<GithubSyncEnvelope> {
  const owner = await getAuthenticatedGithubOwner(accessToken, fetcher);
  const observedAt = now.toISOString();
  const results = await Promise.allSettled(
    githubRepositoryTargets(config).map((target) => repositorySnapshot(target, accessToken, fetcher)),
  );
  const projects: GithubSyncEnvelope["projects"] = [];
  const errors: GithubSyncEnvelope["errors"] = [];

  results.forEach((result, index) => {
    const repository = config.repositories[index];
    if (result.status === "fulfilled") {
      projects.push(normalizeGithubRepository(result.value, observedAt));
      return;
    }
    const reason = result.reason;
    errors.push({
      repository,
      code: reason instanceof GithubApiError ? reason.code : "upstream-error",
      message: reason instanceof Error ? reason.message : "Unknown GitHub synchronization error",
    });
  });

  return {
    schemaVersion: 1,
    provider: "github",
    owner: { id: owner.id, login: owner.login },
    syncedAt: observedAt,
    projects,
    errors,
  };
}
