import { describe, expect, it } from "vitest";

import {
  createJournalJson,
  createJournalMarkdown,
  filterJournalReleases,
  journalExportFilename,
  journalRangeForPreset,
} from "@/data/journal";
import { seedProjects, seedReleases } from "@/data/seed";
import {
  WERFT_JOURNAL_PROJECT_ID,
  werftJournalProject,
  werftJournalReleases,
} from "@/data/werft-journal";

describe("cross-project journal export", () => {
  it("builds rolling seven and thirty day UTC ranges", () => {
    const now = new Date("2026-08-28T23:45:00.000Z");
    expect(journalRangeForPreset("week", now)).toEqual({
      from: "2026-08-22",
      to: "2026-08-28",
    });
    expect(journalRangeForPreset("month", now)).toEqual({
      from: "2026-07-30",
      to: "2026-08-28",
    });
  });

  it("filters inclusively by date, project and category", () => {
    const flowId = seedProjects.find((project) => project.slug === "flow")!.id;
    const rows = filterJournalReleases(seedReleases, {
      from: "2026-08-27",
      to: "2026-08-27",
      projectIds: [flowId],
      categories: ["changed"],
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].version).toBe("11.33.0");
    expect(rows[0].entries.every((entry) => entry.category === "changed")).toBe(
      true,
    );
  });

  it("produces human-readable Markdown and machine-readable JSON", () => {
    const rows = filterJournalReleases(seedReleases, {
      from: "2026-08-27",
      to: "2026-08-27",
    });
    const options = {
      from: "2026-08-27",
      to: "2026-08-27",
      generatedAt: "2026-08-28T12:00:00.000Z",
    };
    const markdown = createJournalMarkdown(rows, seedProjects, options);
    expect(markdown).toContain("# Сквозной журнал Верфи");
    expect(markdown).toContain("Flow 11.33.0");
    expect(markdown).toContain("MonoFocus 3.1.0");

    const json = JSON.parse(
      createJournalJson(rows, seedProjects, options),
    ) as { format: string; releases: Array<{ projectName: string }> };
    expect(json.format).toBe("werft-journal");
    expect(json.releases.map((release) => release.projectName)).toEqual(
      expect.arrayContaining(["Flow", "MonoFocus"]),
    );
    expect(journalExportFilename("md", options)).toBe(
      "werft-journal_2026-08-27_2026-08-27.md",
    );
  });

  it("includes Werft releases in the same filter and export contract", () => {
    const rows = filterJournalReleases(werftJournalReleases, {
      projectIds: [WERFT_JOURNAL_PROJECT_ID],
    });
    expect(rows[0]).toMatchObject({ projectId: WERFT_JOURNAL_PROJECT_ID, version: "0.1.3" });

    const markdown = createJournalMarkdown(rows, [werftJournalProject]);
    expect(markdown).toContain("Верфь 0.1.3");
    expect(markdown).toContain("Контрастная системная шапка Android");
  });
});
