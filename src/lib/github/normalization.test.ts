import { describe, expect, it } from "vitest";

import {
  inferDataProfile,
  normalizeGithubRepository,
  parseChangelog,
  parsePackageManifest,
  type GithubRepositorySnapshot,
} from "./normalization";

describe("GitHub repository normalization", () => {
  it("parses Russian and Keep a Changelog release headings", () => {
    const parsed = parseChangelog(`# История изменений

## [Unreleased]

## [2.4.1] — 2026-08-09

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
        releasedAt: "2026-08-09",
        entries: [
          { category: "added", text: "Полный JSON-экспорт." },
          { category: "fixed", text: "Исправлено восстановление." },
        ],
      },
      {
        version: "2.4.0",
        releasedAt: "2026-07-26",
        entries: [{ category: "other", text: "Предыдущая версия." }],
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
      releases: [],
      tags: [],
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
    expect(normalized.delivery.mode).toBe("classic-pages");
    expect(normalized.dataProfile.mode).toBe("hybrid");
    expect(normalized.stack.map((item) => item.name)).toContain("PWA");
  });
});
