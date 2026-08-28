import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { WerftDatabase } from "@/data/db";
import { applyGithubProjectSnapshot } from "@/data/github-sync";
import { ensureSeeded, projectIds } from "@/data/seed";
import type { NormalizedGithubProject } from "@/lib/github/types";

describe("normalized GitHub ingestion", () => {
  let database: WerftDatabase;

  beforeEach(async () => {
    database = new WerftDatabase(`werft-github-sync-${crypto.randomUUID()}`);
    await ensureSeeded(database);
  });

  afterEach(async () => {
    database.close();
    await database.delete();
  });

  it("updates observed project fields and changelog without echoing to outbox", async () => {
    const snapshot: NormalizedGithubProject = {
      provider: "github",
      observedAt: "2026-08-29T08:00:00.000Z",
      repository: {
        id: "1126348935",
        ownerId: 46434977,
        ownerLogin: "Budladislav",
        name: "Planer",
        fullName: "Budladislav/Planer",
        visibility: "public",
        url: "https://github.com/Budladislav/Planer",
        defaultBranch: "main",
        description: "MonoFocus",
        homepage: "https://budladislav.github.io/Planer/",
        topics: ["pwa"],
        primaryLanguage: "TypeScript",
        createdAt: "2026-01-01T18:04:43.000Z",
        pushedAt: "2026-08-29T07:00:00.000Z",
        archived: false,
        headSha: "1234567890abcdef",
      },
      purpose: { value: "MonoFocus", source: "github-description" },
      version: {
        value: "3.2.0",
        source: "package.json",
        consistency: "consistent",
        candidates: [
          { source: "package.json", value: "3.2.0" },
          { source: "changelog", value: "3.2.0" },
        ],
      },
      changelog: {
        found: true,
        sourcePath: "CHANGELOG_MONOFOCUS.md",
        sourceUrl:
          "https://github.com/Budladislav/Planer/blob/main/CHANGELOG_MONOFOCUS.md",
        hasUnreleased: false,
        releases: [
          {
            version: "3.2.0",
            releasedAt: "2026-08-29",
            entries: [{ category: "added", text: "Новый быстрый ввод." }],
          },
        ],
      },
      stack: [
        { name: "TypeScript", evidence: "language" },
        { name: "React", evidence: "package.json" },
      ],
      dataProfile: {
        mode: "local-only",
        stores: ["localStorage"],
        backend: [],
        inferred: true,
      },
      backupAdapter: { kind: "browser-export", inferred: true },
      delivery: {
        provider: "github-pages",
        mode: "custom-workflow",
        appUrl: "https://budladislav.github.io/Planer/",
        workflows: [],
        latestRun: null,
      },
      evidence: [],
    };

    const updated = await applyGithubProjectSnapshot(snapshot, database);
    expect(updated).toMatchObject({
      id: projectIds.monoFocus,
      version: "3.2.0",
      lastActivityAt: "2026-08-29T07:00:00.000Z",
      syncStatus: "fresh",
    });
    expect(
      await database.releases.get(`release:${projectIds.monoFocus}:3.2.0`),
    ).toMatchObject({
      version: "3.2.0",
      source: "changelog",
    });
    expect(await database.syncEvents.where("projectId").equals(projectIds.monoFocus).count()).toBe(2);
    expect(await database.outbox.count()).toBe(0);
  });
});
