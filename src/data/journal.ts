import type {
  Project,
  ProjectRelease,
  ReleaseCategory,
} from "@/lib/domain";

export type JournalPreset = "week" | "month";

export type JournalFilter = {
  from?: string;
  to?: string;
  projectIds?: string[];
  categories?: ReleaseCategory[];
};

export type JournalDocumentOptions = {
  from?: string;
  to?: string;
  generatedAt?: string;
  title?: string;
};

const categoryLabels: Record<ReleaseCategory, string> = {
  added: "Добавлено",
  changed: "Изменено",
  fixed: "Исправлено",
  security: "Безопасность",
};

function datePart(value: string) {
  return value.slice(0, 10);
}
function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function journalRangeForPreset(
  preset: JournalPreset,
  now = new Date(),
) {
  const to = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - (preset === "week" ? 6 : 29));
  return { from: isoDate(from), to: isoDate(to) };
}

export function filterJournalReleases(
  releases: ProjectRelease[],
  filter: JournalFilter = {},
) {
  const projectIds = filter.projectIds?.length
    ? new Set(filter.projectIds)
    : undefined;
  const categories = filter.categories?.length
    ? new Set(filter.categories)
    : undefined;

  return releases
    .filter((release) => {
      if (release.deletedAt) return false;
      const releaseDate = datePart(release.releasedAt);
      if (filter.from && releaseDate < filter.from) return false;
      if (filter.to && releaseDate > filter.to) return false;
      if (projectIds && !projectIds.has(release.projectId)) return false;
      if (
        categories &&
        !release.entries.some((entry) => categories.has(entry.category))
      ) {
        return false;
      }
      return true;
    })
    .map((release) => ({
      ...release,
      entries: categories
        ? release.entries.filter((entry) => categories.has(entry.category))
        : release.entries,
    }))
    .sort((a, b) => b.releasedAt.localeCompare(a.releasedAt));
}

function projectMap(projects: Project[]) {
  return new Map(projects.map((project) => [project.id, project]));
}

function rangeLabel(options: JournalDocumentOptions) {
  if (options.from && options.to) return `${options.from} — ${options.to}`;
  if (options.from) return `с ${options.from}`;
  if (options.to) return `до ${options.to}`;
  return "вся история";
}

export function createJournalMarkdown(
  releases: ProjectRelease[],
  projects: Project[],
  options: JournalDocumentOptions = {},
) {
  const names = projectMap(projects);
  const title = options.title ?? "Сквозной журнал Верфи";
  const lines = [
    `# ${title}`,
    "",
    `Период: ${rangeLabel(options)}`,
    `Сформировано: ${(options.generatedAt ?? new Date().toISOString()).slice(0, 10)}`,
    "",
  ];

  if (releases.length === 0) {
    lines.push("За выбранный период изменений нет.", "");
    return lines.join("\n");
  }

  for (const release of releases) {
    const project = names.get(release.projectId);
    lines.push(
      `## ${project?.name ?? release.projectId} ${release.version} — ${datePart(release.releasedAt)}`,
      "",
    );
    if (release.title) lines.push(`_${release.title}_`, "");

    for (const category of [
      "added",
      "changed",
      "fixed",
      "security",
    ] as const) {
      const entries = release.entries.filter((entry) => entry.category === category);
      if (entries.length === 0) continue;
      lines.push(`### ${categoryLabels[category]}`, "");
      entries.forEach((entry) => lines.push(`- ${entry.text}`));
      lines.push("");
    }
  }

  return lines.join("\n");
}

export function createJournalJson(
  releases: ProjectRelease[],
  projects: Project[],
  options: JournalDocumentOptions = {},
) {
  const names = projectMap(projects);
  return JSON.stringify(
    {
      format: "werft-journal",
      schemaVersion: 1,
      generatedAt: options.generatedAt ?? new Date().toISOString(),
      period: {
        from: options.from ?? null,
        to: options.to ?? null,
      },
      releases: releases.map((release) => ({
        projectId: release.projectId,
        projectName: names.get(release.projectId)?.name ?? release.projectId,
        version: release.version,
        releasedAt: release.releasedAt,
        title: release.title,
        source: release.source,
        sourceUrl: release.sourceUrl ?? null,
        entries: release.entries.map((entry) => ({
          category: entry.category,
          text: entry.text,
        })),
      })),
    },
    null,
    2,
  );
}

export function journalExportFilename(
  extension: "md" | "json",
  options: Pick<JournalDocumentOptions, "from" | "to"> = {},
) {
  const range =
    options.from || options.to
      ? `${options.from ?? "start"}_${options.to ?? "now"}`
      : "all";
  return `werft-journal_${range}.${extension}`;
}
