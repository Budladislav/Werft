import { describe, expect, it } from "vitest";

import {
  inferDataProfile,
  normalizeGithubRepository,
  parseAshroadChangelog,
  parseChangelog,
  parsePackageManifest,
  type GithubRepositorySnapshot,
} from "./normalization";

describe("GitHub repository normalization", () => {
  it("parses the Werft date/title format and legacy ISO headings", () => {
    const parsed = parseChangelog(`# История изменений

## [Unreleased]

## [2.4.1] — 09.08.2026 19:15 +02:00 — Надёжные резервные копии

### Добавлено
- Полный JSON-экспорт.

### Исправлено
- Исправлено восстановление.

## 2.4.0 - 2026-07-26
- Предыдущая версия.
`);

    expect(parsed.hasUnreleased).toBe(true);
    expect(parsed.releases).toEqual([
      {
        version: "2.4.1",
        releasedAt: "2026-08-09T17:15:00.000Z",
        title: "Надёжные резервные копии",
        entries: [
          { category: "added", text: "Полный JSON-экспорт." },
          { category: "fixed", text: "Исправлено восстановление." },
        ],
      },
      {
        version: "2.4.0",
        releasedAt: "2026-07-26",
        title: null,
        entries: [{ category: "other", text: "Предыдущая версия." }],
      },
    ]);
  });

  it("normalizes the legacy MonoFocus date format", () => {
    const parsed = parseChangelog(`## 3.2.0 — 29.08.2026
- Добавлен Rewards Lab.
`);

    expect(parsed.releases).toEqual([{
      version: "3.2.0",
      releasedAt: "2026-08-29",
      title: null,
      entries: [{ category: "other", text: "Добавлен Rewards Lab." }],
    }]);
  });

  it("orders Ashroad checkpoints by exact changelog commit time", () => {
    const parsed = parseAshroadChangelog(`# Changelog

## R16C — first support roster (local candidate)

- Added three Echo roles.
- Fixed the rapid sit to stand cue.

## R16A-R1 — mobile repair

- Preserved both campaign slots.

## R04A — solo-first correction — 2026-09-26, local checkpoint

- Pivoted the roster.

## R04A — enemy pacing — 2026-09-26, local checkpoint

- Rebalanced recruitment.

## 0.10.0 — 04B Road Warden and Repeat Hunt — 2026-09-26

- Added the Road Warden.
`, [
      {
        sha: "newer",
        message: "R16C add support echoes",
        committedAt: "2026-10-03T02:35:30Z",
        url: "https://github.com/example/commit/newer",
      },
      {
        sha: "older",
        message: "R16A-R1 refine D entry",
        committedAt: "2026-10-02T12:08:03Z",
        url: "https://github.com/example/commit/older",
      },
      {
        sha: "r04a-newer",
        message: "R04A pivot to solo-first progression",
        committedAt: "2026-09-26T18:58:19Z",
        url: "https://github.com/example/commit/r04a-newer",
      },
      {
        sha: "r04a-older",
        message: "R04A rebuild enemy progression",
        committedAt: "2026-09-26T18:28:11Z",
        url: "https://github.com/example/commit/r04a-older",
      },
      {
        sha: "semver",
        message: "04B: add road warden",
        committedAt: "2026-09-26T07:22:32Z",
        url: "https://github.com/example/commit/semver",
      },
    ]);

    expect(parsed.releases).toEqual([
      {
        version: "R16C",
        releasedAt: "2026-10-03T02:35:30Z",
        title: "first support roster (local candidate)",
        entries: [
          { category: "added", text: "Added three Echo roles." },
          { category: "fixed", text: "Fixed the rapid sit to stand cue." },
        ],
      },
      {
        version: "R16A-R1",
        releasedAt: "2026-10-02T12:08:03Z",
        title: "mobile repair",
        entries: [{ category: "changed", text: "Preserved both campaign slots." }],
      },
      {
        version: "R04A",
        releasedAt: "2026-09-26T18:58:19Z",
        title: "solo-first correction",
        entries: [{ category: "changed", text: "Pivoted the roster." }],
      },
      {
        version: "R04A",
        releasedAt: "2026-09-26T18:28:11Z",
        title: "enemy pacing",
        entries: [{ category: "changed", text: "Rebalanced recruitment." }],
      },
      {
        version: "0.10.0",
        releasedAt: "2026-09-26T07:22:32Z",
        title: "04B Road Warden and Repeat Hunt",
        entries: [{ category: "added", text: "Added the Road Warden." }],
      },
    ]);
  });

  it("extracts a canonical package version and dependencies", () => {
    expect(parsePackageManifest(JSON.stringify({
      version: "0.2.0",
      dependencies: { react: "19", dexie: "4" },
      devDependencies: { vite: "8" },
    }))).toEqual({
      version: "0.2.0",
      dependencies: ["dexie", "react", "vite"],
    });
  });

  it("distinguishes local-only and hybrid persistence", () => {
    expect(inferDataProfile(
      { "README.md": "Данные хранятся только в IndexedDB." },
      ["src/db/database.ts"],
      ["dexie"],
    ).dataProfile.mode).toBe("local-only");

    const hybrid = inferDataProfile(
      { "README.md": "Локальное хранение и Firebase." },
      ["js/services/storage/firebase-storage.manager.js"],
      ["firebase"],
    );
    expect(hybrid.dataProfile.mode).toBe("hybrid");
    expect(hybrid.backupAdapter.kind).toBe("hybrid");
  });

  it("flags version drift without inventing a version", () => {
    const snapshot: GithubRepositorySnapshot = {
      repository: {
        id: 1,
        owner: { id: 46_434_977, login: "Budladislav" },
        name: "fitness-tracker",
        full_name: "Budladislav/fitness-tracker",
        private: false,
        html_url: "https://github.com/Budladislav/fitness-tracker",
        default_branch: "main",
        description: null,
        homepage: null,
        topics: [],
        language: "JavaScript",
        created_at: "2025-01-06T20:52:24Z",
        pushed_at: "2026-04-05T07:04:35Z",
        archived: false,
        has_pages: true,
      },
      head: { sha: "abc", html_url: "https://github.com/example/commit/abc" },
      files: {
        "package.json": JSON.stringify({ version: "3.0.7" }),
        "CHANGELOG.md": "## [3.0.6] - 2026-04-06\n- Исправление.",
        "README.md": "Личный дневник тренировок с Firebase и локальным хранением.",
      },
      fileUrls: {
        "package.json": "https://github.com/example/package.json",
        "CHANGELOG.md": "https://github.com/example/CHANGELOG.md",
        "README.md": "https://github.com/example/README.md",
      },
      treePaths: ["sw.js", "js/services/firebase.service.js"],
      languages: { JavaScript: 100, CSS: 20 },
      releases: [{
        tag_name: "v3.0.6",
        draft: false,
        prerelease: false,
        published_at: "2026-04-06T18:42:00Z",
        html_url: "https://github.com/example/releases/tag/v3.0.6",
      }],
      tags: [],
      changelogCommits: [],
      workflows: [{
        id: 1,
        name: "pages build and deployment",
        path: "dynamic/pages/pages-build-deployment",
        state: "active",
        html_url: "https://github.com/example/actions",
      }],
      latestRun: null,
    };

    const normalized = normalizeGithubRepository(snapshot, "2026-08-28T00:00:00.000Z");
    expect(normalized.version).toMatchObject({ value: "3.0.7", source: "package.json", consistency: "drift" });
    expect(normalized.changelog.releases[0].releasedAt).toBe("2026-04-06T18:42:00Z");
    expect(normalized.delivery.mode).toBe("classic-pages");
    expect(normalized.dataProfile.mode).toBe("hybrid");
    expect(normalized.stack.map((item) => item.name)).toContain("PWA");
  });
});
