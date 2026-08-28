export type GithubReleaseCategory = "added" | "changed" | "fixed" | "security" | "other";

export type NormalizedGithubRelease = {
  version: string;
  releasedAt: string;
  entries: Array<{
    category: GithubReleaseCategory;
    text: string;
  }>;
};

export type GithubVersionCandidate = {
  source: "package.json" | "changelog" | "github-release" | "git-tag";
  value: string;
};

export type NormalizedGithubProject = {
  provider: "github";
  observedAt: string;
  repository: {
    id: string;
    ownerId: number;
    ownerLogin: string;
    name: string;
    fullName: string;
    visibility: "public" | "private";
    url: string;
    defaultBranch: string;
    description: string;
    homepage: string | null;
    topics: string[];
    primaryLanguage: string | null;
    createdAt: string;
    pushedAt: string;
    archived: boolean;
    headSha: string | null;
  };
  purpose: {
    value: string;
    source: "github-description" | "README" | "repository-name";
  };
  version: {
    value: string;
    source: GithubVersionCandidate["source"] | "unknown";
    consistency: "consistent" | "drift" | "unknown";
    candidates: GithubVersionCandidate[];
  };
  changelog: {
    found: boolean;
    sourcePath: string | null;
    sourceUrl: string | null;
    hasUnreleased: boolean;
    releases: NormalizedGithubRelease[];
  };
  stack: Array<{
    name: string;
    evidence: "language" | "package.json" | "repository-tree" | "manifest";
  }>;
  dataProfile: {
    mode: "local-only" | "cloud" | "hybrid" | "unknown";
    stores: string[];
    backend: string[];
    inferred: true;
  };
  backupAdapter: {
    kind: "browser-export" | "remote-provider" | "hybrid" | "unknown";
    inferred: true;
  };
  delivery: {
    provider: "github-pages" | "unknown";
    mode: "custom-workflow" | "classic-pages" | "unknown";
    appUrl: string | null;
    workflows: Array<{
      id: string;
      name: string;
      path: string;
      state: string;
      url: string;
    }>;
    latestRun: {
      name: string;
      status: string;
      conclusion: string | null;
      headSha: string;
      startedAt: string | null;
      updatedAt: string;
      url: string;
    } | null;
  };
  evidence: Array<{
    kind: "repository" | "file" | "workflow" | "run";
    label: string;
    url: string;
  }>;
};

export type GithubSyncEnvelope = {
  schemaVersion: 1;
  provider: "github";
  owner: {
    id: number;
    login: string;
  };
  syncedAt: string;
  projects: NormalizedGithubProject[];
  errors: Array<{
    repository: string;
    code: "forbidden" | "not-found" | "rate-limited" | "upstream-error" | "invalid-owner";
    message: string;
  }>;
};
