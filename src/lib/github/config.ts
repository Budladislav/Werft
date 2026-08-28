export const GITHUB_OWNER_ID = 46_434_977;
export const DEFAULT_GITHUB_OWNER_LOGIN = "Budladislav";
export const GITHUB_REPOSITORY_CATALOG = [
  { name: "Flow", changelogPaths: ["CHANGELOG.md"] },
  { name: "Planer", changelogPaths: ["CHANGELOG_MONOFOCUS.md", "CHANGELOG.md"] },
  { name: "safe-play", changelogPaths: ["CHANGELOG.md"] },
  { name: "fitness-tracker", changelogPaths: ["CHANGELOG.md"] },
  { name: "ChronoAtlas", changelogPaths: ["CHANGELOG.md"] },
] as const;
export const DEFAULT_GITHUB_REPOSITORIES = GITHUB_REPOSITORY_CATALOG.map(({ name }) => name);

export const GITHUB_SESSION_COOKIE = "werft_github_session";
export const GITHUB_OAUTH_STATE_COOKIE = "werft_github_oauth_state";

const REPOSITORY_NAME_PATTERN = /^[A-Za-z0-9_.-]{1,100}$/;
const OWNER_LOGIN_PATTERN = /^[A-Za-z0-9-]{1,39}$/;

export type GithubRepositoryTarget = {
  ownerLogin: string;
  ownerId: typeof GITHUB_OWNER_ID;
  name: string;
  changelogPaths: readonly string[];
};

export type GithubRuntimeConfig = {
  appOrigin: string;
  clientId: string;
  clientSecret: string;
  sessionSecret: string;
  ownerLogin: string;
  ownerId: typeof GITHUB_OWNER_ID;
  repositories: string[];
};

function requiredEnvironmentValue(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function applicationOrigin(): string {
  const configured = process.env.WERFT_APP_ORIGIN?.trim();
  if (!configured && process.env.NODE_ENV !== "production") return "http://localhost:3000";
  if (!configured) throw new Error("Missing required environment variable: WERFT_APP_ORIGIN");

  const url = new URL(configured);
  if (url.pathname !== "/" || url.search || url.hash || url.username || url.password) {
    throw new Error("WERFT_APP_ORIGIN must be an origin without a path, query, credentials, or hash");
  }
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new Error("WERFT_APP_ORIGIN must use HTTPS in production");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("WERFT_APP_ORIGIN must use HTTP or HTTPS");
  }
  return url.origin;
}

export function configuredGithubRepositories(value = process.env.GITHUB_REPOSITORIES): string[] {
  const candidates = value
    ? value.split(",").map((item) => item.trim()).filter(Boolean)
    : [...DEFAULT_GITHUB_REPOSITORIES];

  if (!candidates.length) throw new Error("GITHUB_REPOSITORIES must contain at least one repository");

  const unique = new Map<string, string>();
  const allowlist = new Map(
    GITHUB_REPOSITORY_CATALOG.map(({ name }) => [name.toLowerCase(), name]),
  );
  for (const name of candidates) {
    if (!REPOSITORY_NAME_PATTERN.test(name)) {
      throw new Error(`Invalid repository name in GITHUB_REPOSITORIES: ${name}`);
    }
    const allowedName = allowlist.get(name.toLowerCase());
    if (!allowedName) {
      throw new Error(`Repository is not in the Werft allowlist: ${name}`);
    }
    unique.set(allowedName.toLowerCase(), allowedName);
  }
  return [...unique.values()];
}

export function getGithubRuntimeConfig(): GithubRuntimeConfig {
  const ownerLogin = process.env.GITHUB_OWNER_LOGIN?.trim() || DEFAULT_GITHUB_OWNER_LOGIN;
  if (!OWNER_LOGIN_PATTERN.test(ownerLogin)) throw new Error("Invalid GITHUB_OWNER_LOGIN");

  return {
    appOrigin: applicationOrigin(),
    clientId: requiredEnvironmentValue("GITHUB_APP_CLIENT_ID"),
    clientSecret: requiredEnvironmentValue("GITHUB_APP_CLIENT_SECRET"),
    sessionSecret: requiredEnvironmentValue("WERFT_SESSION_SECRET"),
    ownerLogin,
    ownerId: GITHUB_OWNER_ID,
    repositories: configuredGithubRepositories(),
  };
}

export function githubRepositoryTargets(config: GithubRuntimeConfig): GithubRepositoryTarget[] {
  return config.repositories.map((name) => ({
    ownerLogin: config.ownerLogin,
    ownerId: config.ownerId,
    name,
    changelogPaths: GITHUB_REPOSITORY_CATALOG.find(
      (repository) => repository.name.toLowerCase() === name.toLowerCase(),
    )?.changelogPaths ?? ["CHANGELOG.md"],
  }));
}

export function isGithubConfigured(): boolean {
  try {
    getGithubRuntimeConfig();
    return true;
  } catch {
    return false;
  }
}
