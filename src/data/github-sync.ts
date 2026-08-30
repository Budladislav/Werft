import type {
  ChangeEntry,
  ObservedFact,
  Project,
  ProjectRelease,
  ReleaseCategory,
  SyncEvent,
} from "@/lib/domain";
import type {
  GithubSyncEnvelope,
  NormalizedGithubProject,
} from "@/lib/github/types";
import { createEntityId, getDeviceId } from "@/data/device";
import { type WerftDatabase, werftDb } from "@/data/db";

function category(value: string): ReleaseCategory {
  return value === "added" ||
    value === "changed" ||
    value === "fixed" ||
    value === "security"
    ? value
    : "changed";
}

function releaseDate(value: string) {
  return value.length === 10 ? `${value}T00:00:00.000Z` : value;
}

function githubFacts(
  snapshot: NormalizedGithubProject,
  existing: ObservedFact[],
) {
  const facts = new Map(existing.map((fact) => [fact.key, fact]));
  const set = (fact: ObservedFact) => {
    if (!facts.get(fact.key)?.pinned) facts.set(fact.key, fact);
  };
  const sourceUrl = snapshot.repository.url;
  const observedAt = snapshot.observedAt;

  set({
    key: "defaultBranch",
    label: "Основная ветка",
    value: snapshot.repository.defaultBranch,
    source: "github",
    observedAt,
    sourceUrl,
  });
  set({
    key: "repositoryCreatedAt",
    label: "Репозиторий создан",
    value: snapshot.repository.createdAt.slice(0, 10),
    source: "github",
    observedAt,
    sourceUrl,
  });
  if (snapshot.repository.headSha) {
    set({
      key: "headSha",
      label: "Последний commit",
      value: snapshot.repository.headSha.slice(0, 12),
      source: "github",
      observedAt,
      sourceUrl,
    });
  }
  set({
    key: "versionConsistency",
    label: "Согласованность версии",
    value: snapshot.version.consistency,
    source: "derived",
    observedAt,
    sourceUrl,
    inferred: true,
  });
  if (snapshot.changelog.sourcePath) {
    set({
      key: "changelogPath",
      label: "Changelog",
      value: snapshot.changelog.sourcePath,
      source: "repository",
      observedAt,
      sourceUrl: snapshot.changelog.sourceUrl ?? sourceUrl,
    });
  }
  set({
    key: "delivery",
    label: "Публикация",
    value:
      snapshot.delivery.provider === "github-pages"
        ? "GitHub Pages"
        : "Не определена",
    source: "derived",
    observedAt,
    sourceUrl: snapshot.delivery.latestRun?.url ?? sourceUrl,
    inferred: true,
  });
  return [...facts.values()];
}

export async function applyGithubProjectSnapshot(
  snapshot: NormalizedGithubProject,
  database: WerftDatabase = werftDb,
) {
  return database.transaction(
    "rw",
    database.projects,
    database.releases,
    database.syncEvents,
    async () => {
      const project =
        (await database.projects
          .where("repositoryId")
          .equals(snapshot.repository.id)
          .first()) ??
        (await database.projects
          .filter(
            (candidate) =>
              candidate.repositoryName.toLowerCase() ===
              snapshot.repository.fullName.toLowerCase(),
          )
          .first());

      if (!project || project.deletedAt) return undefined;
      const observedAt = snapshot.observedAt;
      const latestChangelogRelease = snapshot.changelog.releases[0];
      const updated: Project = {
        ...project,
        repositoryName: snapshot.repository.fullName,
        repositoryId: snapshot.repository.id,
        repositoryVisibility: snapshot.repository.visibility,
        version:
          snapshot.version.value === "unknown"
            ? project.version
            : snapshot.version.value,
        latestReleaseAt: latestChangelogRelease
          ? releaseDate(latestChangelogRelease.releasedAt)
          : project.latestReleaseAt,
        lastActivityAt: snapshot.repository.pushedAt,
        syncStatus: "fresh",
        lastSyncedAt: observedAt,
        stack:
          snapshot.stack.length > 0
            ? snapshot.stack.map((item) => item.name)
            : project.stack,
        facts: githubFacts(snapshot, project.facts),
        dataProfile:
          snapshot.dataProfile.mode === "unknown"
            ? project.dataProfile
            : {
              ...project.dataProfile,
              mode: snapshot.dataProfile.mode,
              stores: [
                ...snapshot.dataProfile.stores,
                ...snapshot.dataProfile.backend,
              ],
            },
        links: project.links.map((link) => {
          if (link.kind === "repository") {
            return { ...link, href: snapshot.repository.url };
          }
          if (link.kind === "app" && snapshot.delivery.appUrl) {
            return { ...link, href: snapshot.delivery.appUrl };
          }
          return link;
        }),
        updatedAt: observedAt,
        revision: project.revision + 1,
        deviceId: getDeviceId(),
      };
      await database.projects.put(updated);

      for (const [releaseIndex, item] of snapshot.changelog.releases.entries()) {
        const id = `release:${project.id}:${item.version}`;
        const existing = await database.releases.get(id);
        if (existing?.source === "manual") continue;
        const entries: ChangeEntry[] = item.entries.map((entry, index) => ({
          id: `${project.slug}-${item.version}-${index + 1}`,
          category: category(entry.category),
          text: entry.text,
        }));
        const releasedAt = releaseDate(item.releasedAt);
        const release: ProjectRelease = {
          id,
          projectId: project.id,
          version: item.version,
          releasedAt,
          title:
            item.title ??
            existing?.title ??
            (releaseIndex === 0
              ? `Актуальный релиз ${item.version}`
              : `Релиз ${item.version}`),
          source: "changelog",
          sourceUrl:
            snapshot.changelog.sourceUrl ?? existing?.sourceUrl ?? undefined,
          entries:
            entries.length > 0 ? entries : (existing?.entries ?? []),
          createdAt: existing?.createdAt ?? observedAt,
          updatedAt: observedAt,
          revision: (existing?.revision ?? 0) + 1,
          deviceId: getDeviceId(),
        };
        await database.releases.put(release);
      }

      const event: SyncEvent = {
        id: createEntityId("sync"),
        projectId: project.id,
        provider: "github",
        direction: "pull",
        status: "success",
        summary: `Обновлены данные ${project.name}`,
        occurredAt: observedAt,
        details: `GitHub ${snapshot.repository.headSha?.slice(0, 12) ?? "metadata"}`,
        createdAt: observedAt,
        updatedAt: observedAt,
        revision: 1,
        deviceId: getDeviceId(),
      };
      await database.syncEvents.add(event);
      return updated;
    },
  );
}

export async function applyGithubSyncEnvelope(
  envelope: GithubSyncEnvelope,
  database: WerftDatabase = werftDb,
) {
  const updatedProjectIds: string[] = [];
  const skippedRepositories: string[] = [];
  for (const snapshot of envelope.projects) {
    const project = await applyGithubProjectSnapshot(snapshot, database);
    if (project) updatedProjectIds.push(project.id);
    else skippedRepositories.push(snapshot.repository.fullName);
  }
  return { updatedProjectIds, skippedRepositories, errors: envelope.errors };
}
