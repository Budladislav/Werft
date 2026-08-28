import type {
  GithubReleaseCategory,
  GithubVersionCandidate,
  NormalizedGithubProject,
  NormalizedGithubRelease,
} from "./types";

export type GithubRepositorySnapshot = {
  repository: {
    id: number;
    owner: { id: number; login: string };
    name: string;
    full_name: string;
    private: boolean;
    visibility?: string;
    html_url: string;
    default_branch: string;
    description: string | null;
    homepage: string | null;
    topics?: string[];
    language: string | null;
    created_at: string;
    pushed_at: string;
    archived: boolean;
    has_pages: boolean;
  };
  head: {
    sha: string;
    html_url: string;
  } | null;
  files: Partial<Record<KnownGithubFile, string>>;
  fileUrls: Partial<Record<KnownGithubFile, string>>;
  treePaths: string[];
  languages: Record<string, number>;
  releases: Array<{
    tag_name: string;
    draft: boolean;
    prerelease: boolean;
    published_at: string | null;
    html_url: string;
  }>;
  tags: Array<{ name: string; commit: { sha: string } }>;
  workflows: Array<{
    id: number;
    name: string;
    path: string;
    state: string;
    html_url: string;
  }>;
  latestRun: {
    name: string;
    status: string;
    conclusion: string | null;
    head_sha: string;
    run_started_at: string | null;
    updated_at: string;
    html_url: string;
  } | null;
};

export const KNOWN_GITHUB_FILES = [
  "package.json",
  "CHANGELOG.md",
  "CHANGELOG_MONOFOCUS.md",
  "README.md",
  "manifest.json",
  "public/manifest.webmanifest",
] as const;

export type KnownGithubFile = (typeof KNOWN_GITHUB_FILES)[number];

type PackageManifest = {
  version: string | null;
  dependencies: string[];
};

const SEMVER_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const RELEASE_HEADING = /^##\s+\[?v?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?)\]?\s*(?:—|-)\s*(\d{4}-\d{2}-\d{2})\s*$/i;
const UNRELEASED_HEADING = /^##\s+\[?(?:unreleased|невыпущено|в разработке)\]?\s*$/i;

const DEPENDENCY_STACK: Array<[RegExp, string]> = [
  [/^next$/, "Next.js"],
  [/^react$/, "React"],
  [/^typescript$/, "TypeScript"],
  [/^vite$/, "Vite"],
  [/^dexie(?:-react-hooks)?$/, "Dexie"],
  [/^zustand$/, "Zustand"],
  [/^firebase$/, "Firebase"],
  [/^@supabase\//, "Supabase"],
  [/^vitest$/, "Vitest"],
  [/^@playwright\/test$/, "Playwright"],
  [/^vite-plugin-pwa$/, "Vite PWA"],
];

function cleanVersion(value: string | null | undefined): string | null {
  const candidate = value?.trim().replace(/^v/i, "") ?? "";
  return SEMVER_PATTERN.test(candidate) ? candidate : null;
}

export function parsePackageManifest(text: string | undefined): PackageManifest {
  if (!text) return { version: null, dependencies: [] };
  try {
    const value = JSON.parse(text) as Record<string, unknown>;
    const dependencyGroups = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"];
    const dependencies = new Set<string>();
    for (const group of dependencyGroups) {
      const entries = value[group];
      if (!entries || typeof entries !== "object" || Array.isArray(entries)) continue;
      Object.keys(entries).forEach((name) => dependencies.add(name));
    }
    return {
      version: typeof value.version === "string" ? cleanVersion(value.version) : null,
      dependencies: [...dependencies].sort(),
    };
  } catch {
    return { version: null, dependencies: [] };
  }
}

function categoryForHeading(value: string): GithubReleaseCategory {
  const normalized = value.toLowerCase();
  if (/добав|added|new/.test(normalized)) return "added";
  if (/измен|changed|update/.test(normalized)) return "changed";
  if (/исправ|fixed|bug/.test(normalized)) return "fixed";
  if (/безопас|security/.test(normalized)) return "security";
  return "other";
}

export function parseChangelog(markdown: string | undefined): {
  hasUnreleased: boolean;
  releases: NormalizedGithubRelease[];
} {
  if (!markdown) return { hasUnreleased: false, releases: [] };

  const releases: NormalizedGithubRelease[] = [];
  let hasUnreleased = false;
  let current: NormalizedGithubRelease | null = null;
  let category: GithubReleaseCategory = "other";

  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (UNRELEASED_HEADING.test(line)) {
      hasUnreleased = true;
      current = null;
      category = "other";
      continue;
    }

    const releaseMatch = line.match(RELEASE_HEADING);
    if (releaseMatch) {
      current = {
        version: releaseMatch[1],
        releasedAt: releaseMatch[2],
        entries: [],
      };
      releases.push(current);
      category = "other";
      if (releases.length >= 100) break;
      continue;
    }

    if (line.startsWith("## ")) {
      current = null;
      category = "other";
      continue;
    }
    if (!current) continue;

    const categoryMatch = line.match(/^###\s+(.+)$/);
    if (categoryMatch) {
      category = categoryForHeading(categoryMatch[1]);
      continue;
    }

    const bulletMatch = line.match(/^[-*]\s+(.+)$/);
    if (bulletMatch && current.entries.length < 100) {
      current.entries.push({ category, text: bulletMatch[1].trim() });
    }
  }

  return { hasUnreleased, releases };
}

function readmeSummary(markdown: string | undefined): string | null {
  if (!markdown) return null;
  const blocks = markdown.replace(/\r/g, "").split(/\n\s*\n/);
  for (const block of blocks) {
    const candidate = block.trim();
    if (!candidate
      || candidate.startsWith("#")
      || candidate.startsWith("```")
      || candidate.startsWith("![")
      || candidate.startsWith("[")
      || candidate.startsWith("-")
      || candidate.startsWith("<")) continue;

    const cleaned = candidate
      .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
      .replace(/[*_`>#]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (cleaned.length >= 20) return cleaned.slice(0, 320);
  }
  return null;
}

function versionState(
  packageVersion: string | null,
  changelog: NormalizedGithubRelease[],
  releases: GithubRepositorySnapshot["releases"],
  tags: GithubRepositorySnapshot["tags"],
): NormalizedGithubProject["version"] {
  const candidates: GithubVersionCandidate[] = [];
  const add = (source: GithubVersionCandidate["source"], value: string | null) => {
    if (value) candidates.push({ source, value });
  };

  add("package.json", packageVersion);
  add("changelog", changelog[0]?.version ?? null);
  add("github-release", cleanVersion(releases.find((release) => !release.draft)?.tag_name));
  add("git-tag", cleanVersion(tags[0]?.name));

  const selected = candidates[0];
  const distinct = new Set(candidates.map((candidate) => candidate.value));
  return {
    value: selected?.value ?? "unknown",
    source: selected?.source ?? "unknown",
    consistency: candidates.length < 2 ? "unknown" : distinct.size === 1 ? "consistent" : "drift",
    candidates,
  };
}

function stackForSnapshot(
  snapshot: GithubRepositorySnapshot,
  manifest: PackageManifest,
): NormalizedGithubProject["stack"] {
  const stack = new Map<string, NormalizedGithubProject["stack"][number]["evidence"]>();
  const add = (name: string, evidence: NormalizedGithubProject["stack"][number]["evidence"]) => {
    if (!stack.has(name)) stack.set(name, evidence);
  };

  Object.entries(snapshot.languages)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4)
    .forEach(([language]) => add(language, "language"));

  for (const dependency of manifest.dependencies) {
    for (const [pattern, name] of DEPENDENCY_STACK) {
      if (pattern.test(dependency)) add(name, "package.json");
    }
  }

  const lowerPaths = snapshot.treePaths.map((path) => path.toLowerCase());
  if (snapshot.files["manifest.json"] || snapshot.files["public/manifest.webmanifest"]
    || lowerPaths.some((path) => /(^|\/)sw\.(?:js|ts)$/.test(path))) {
    add("PWA", "manifest");
  }
  if ((snapshot.repository.language === "JavaScript" || stack.has("JavaScript"))
    && !["React", "Next.js", "Vue", "Svelte", "Angular"].some((name) => stack.has(name))) {
    add("Vanilla JavaScript", "repository-tree");
  }

  return [...stack].map(([name, evidence]) => ({ name, evidence }));
}

export function inferDataProfile(
  files: GithubRepositorySnapshot["files"],
  treePaths: string[],
  dependencies: string[],
): Pick<NormalizedGithubProject, "dataProfile" | "backupAdapter"> {
  const evidence = [
    files["README.md"] ?? "",
    files["package.json"] ?? "",
    ...treePaths,
    ...dependencies,
  ].join("\n").toLowerCase();
  const stores = new Set<string>();
  const backend = new Set<string>();

  if (/indexeddb|dexie|fake-indexeddb|idb-keyval/.test(evidence)) stores.add("IndexedDB");
  if (/localstorage|local storage|local-storage|local-store|локальн[а-яё]*\s+хранен/.test(evidence)) {
    stores.add("localStorage");
  }
  if (/sessionstorage|session storage|session-storage/.test(evidence)) stores.add("sessionStorage");
  if (/firebase|firestore/.test(evidence)) backend.add("Firebase");
  if (/supabase/.test(evidence)) backend.add("Supabase");

  const hasLocal = stores.size > 0;
  const hasCloud = backend.size > 0;
  const mode = hasLocal && hasCloud ? "hybrid" : hasCloud ? "cloud" : hasLocal ? "local-only" : "unknown";
  const adapter = mode === "hybrid"
    ? "hybrid"
    : mode === "cloud"
      ? "remote-provider"
      : mode === "local-only"
        ? "browser-export"
        : "unknown";

  return {
    dataProfile: {
      mode,
      stores: [...stores],
      backend: [...backend],
      inferred: true,
    },
    backupAdapter: { kind: adapter, inferred: true },
  };
}

export function normalizeGithubRepository(
  snapshot: GithubRepositorySnapshot,
  observedAt = new Date().toISOString(),
): NormalizedGithubProject {
  const manifest = parsePackageManifest(snapshot.files["package.json"]);
  const changelogPath = snapshot.files["CHANGELOG_MONOFOCUS.md"]
    ? "CHANGELOG_MONOFOCUS.md"
    : snapshot.files["CHANGELOG.md"]
      ? "CHANGELOG.md"
      : null;
  const parsedChangelog = parseChangelog(changelogPath ? snapshot.files[changelogPath] : undefined);
  const data = inferDataProfile(snapshot.files, snapshot.treePaths, manifest.dependencies);
  const description = snapshot.repository.description?.trim();
  const readmePurpose = readmeSummary(snapshot.files["README.md"]);
  const purpose = description
    ? { value: description, source: "github-description" as const }
    : readmePurpose
      ? { value: readmePurpose, source: "README" as const }
      : { value: snapshot.repository.name, source: "repository-name" as const };

  const hasCustomWorkflow = snapshot.workflows.some((workflow) => workflow.path.startsWith(".github/workflows/"));
  const appUrl = snapshot.repository.homepage?.startsWith("http")
    ? snapshot.repository.homepage
    : snapshot.repository.has_pages
      ? `https://${snapshot.repository.owner.login.toLowerCase()}.github.io/${snapshot.repository.name}/`
      : null;
  const changelogUrl = changelogPath ? snapshot.fileUrls[changelogPath] ?? null : null;

  const evidence: NormalizedGithubProject["evidence"] = [
    { kind: "repository", label: "GitHub repository", url: snapshot.repository.html_url },
  ];
  for (const path of KNOWN_GITHUB_FILES) {
    const url = snapshot.fileUrls[path];
    if (url) evidence.push({ kind: "file", label: path, url });
  }
  snapshot.workflows.forEach((workflow) => {
    evidence.push({ kind: "workflow", label: workflow.name, url: workflow.html_url });
  });
  if (snapshot.latestRun) {
    evidence.push({ kind: "run", label: snapshot.latestRun.name, url: snapshot.latestRun.html_url });
  }

  return {
    provider: "github",
    observedAt,
    repository: {
      id: String(snapshot.repository.id),
      ownerId: snapshot.repository.owner.id,
      ownerLogin: snapshot.repository.owner.login,
      name: snapshot.repository.name,
      fullName: snapshot.repository.full_name,
      visibility: snapshot.repository.private ? "private" : "public",
      url: snapshot.repository.html_url,
      defaultBranch: snapshot.repository.default_branch,
      description: snapshot.repository.description ?? "",
      homepage: snapshot.repository.homepage,
      topics: snapshot.repository.topics ?? [],
      primaryLanguage: snapshot.repository.language,
      createdAt: snapshot.repository.created_at,
      pushedAt: snapshot.repository.pushed_at,
      archived: snapshot.repository.archived,
      headSha: snapshot.head?.sha ?? null,
    },
    purpose,
    version: versionState(manifest.version, parsedChangelog.releases, snapshot.releases, snapshot.tags),
    changelog: {
      found: Boolean(changelogPath),
      sourcePath: changelogPath,
      sourceUrl: changelogUrl,
      hasUnreleased: parsedChangelog.hasUnreleased,
      releases: parsedChangelog.releases,
    },
    stack: stackForSnapshot(snapshot, manifest),
    ...data,
    delivery: {
      provider: snapshot.repository.has_pages ? "github-pages" : "unknown",
      mode: hasCustomWorkflow
        ? "custom-workflow"
        : snapshot.repository.has_pages
          ? "classic-pages"
          : "unknown",
      appUrl,
      workflows: snapshot.workflows.map((workflow) => ({
        id: String(workflow.id),
        name: workflow.name,
        path: workflow.path,
        state: workflow.state,
        url: workflow.html_url,
      })),
      latestRun: snapshot.latestRun
        ? {
          name: snapshot.latestRun.name,
          status: snapshot.latestRun.status,
          conclusion: snapshot.latestRun.conclusion,
          headSha: snapshot.latestRun.head_sha,
          startedAt: snapshot.latestRun.run_started_at,
          updatedAt: snapshot.latestRun.updated_at,
          url: snapshot.latestRun.html_url,
        }
        : null,
    },
    evidence,
  };
}
