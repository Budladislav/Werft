import type { Project, ProjectRelease, ReleaseCategory } from "@/lib/domain";
import { APP_RELEASE_HISTORY } from "@/lib/release-history.generated";

export const WERFT_JOURNAL_PROJECT_ID = "system:werft";

function releaseCategory(value: string): ReleaseCategory {
  const normalized = value.toLowerCase();
  if (/добав|added|new/.test(normalized)) return "added";
  if (/исправ|fixed|bug/.test(normalized)) return "fixed";
  if (/безопас|security/.test(normalized)) return "security";
  return "changed";
}

export const werftJournalProject: Project = {
  id: WERFT_JOURNAL_PROJECT_ID,
  slug: "werft",
  name: "Верфь",
  repositoryName: "Budladislav/Werft",
  repositoryId: "system:werft",
  repositoryVisibility: "public",
  summary: "Личный центр управления экосистемой проектов.",
  startedAt: "2026-08-28T00:00:00.000Z",
  startedAtInferred: false,
  version: APP_RELEASE_HISTORY[0]?.version ?? "unknown",
  latestReleaseAt: APP_RELEASE_HISTORY[0]?.releasedAt ?? "2026-08-28",
  lastActivityAt: APP_RELEASE_HISTORY[0]?.releasedAt ?? "2026-08-28",
  lifecycle: "active",
  availability: "working",
  attention: "calm",
  syncStatus: "fresh",
  lastSyncedAt: APP_RELEASE_HISTORY[0]?.releasedAt ?? "2026-08-28",
  pinned: false,
  sortOrder: 0,
  accent: "#167b75",
  mark: "ВФ",
  stack: ["TypeScript", "Next.js", "React", "Dexie", "PWA"],
  capabilities: ["Управление экосистемой проектов"],
  links: [
    { label: "Верфь", href: "https://werft.vercel.app", kind: "app" },
    { label: "GitHub", href: "https://github.com/Budladislav/Werft", kind: "repository" },
  ],
  facts: [],
  dataProfile: { mode: "local-only", stores: ["IndexedDB"], sensitivity: "private" },
  publicProfile: {
    enabled: false,
    slug: "werft",
    tagline: "Проект над проектами",
    shortDescription: "Управление разработкой и обслуживанием личной экосистемы.",
    categories: ["productivity", "developer-tools"],
    platforms: ["PWA"],
    highlights: ["Local-first", "GitHub sync", "Werft Standard"],
    appUrl: "https://werft.vercel.app",
    repositoryUrl: "https://github.com/Budladislav/Werft",
    showVersion: true,
    featured: false,
    sortOrder: 0,
  },
  createdAt: "2026-08-28T00:00:00.000Z",
  updatedAt: APP_RELEASE_HISTORY[0]?.releasedAt ?? "2026-08-28",
  revision: 1,
  deviceId: "werft-build",
};

export const werftJournalReleases: ProjectRelease[] = APP_RELEASE_HISTORY.map(release => ({
  id: `release:${WERFT_JOURNAL_PROJECT_ID}:${release.version}`,
  projectId: WERFT_JOURNAL_PROJECT_ID,
  version: release.version,
  releasedAt: `${release.releasedAt}T00:00:00.000Z`,
  title: release.title ?? `Релиз Верфи ${release.version}`,
  source: "changelog",
  sourceUrl: "https://github.com/Budladislav/Werft/blob/main/CHANGELOG.md",
  entries: release.sections.flatMap((section, sectionIndex) =>
    section.items.map((text, itemIndex) => ({
      id: `werft-${release.version}-${sectionIndex + 1}-${itemIndex + 1}`,
      category: releaseCategory(section.title),
      text,
    }))),
  createdAt: `${release.releasedAt}T00:00:00.000Z`,
  updatedAt: `${release.releasedAt}T00:00:00.000Z`,
  revision: 1,
  deviceId: "werft-build",
}));
