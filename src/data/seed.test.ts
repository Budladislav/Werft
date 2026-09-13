import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { WerftDatabase } from "@/data/db";
import {
  ensureSeeded,
  projectIds,
  seedProjects,
  seedQualityAssessments,
} from "@/data/seed";
import { standardControls } from "@/data/standard";

describe("Werft initial data", () => {
  let database: WerftDatabase;

  beforeEach(() => {
    database = new WerftDatabase(`werft-seed-test-${crypto.randomUUID()}`);
  });

  afterEach(async () => {
    database.close();
    await database.delete();
  });

  it("seeds all approved repositories and remains idempotent", async () => {
    await ensureSeeded(database);
    await ensureSeeded(database);

    const projects = await database.projects.orderBy("sortOrder").toArray();
    expect(projects).toHaveLength(7);
    expect(projects.map((project) => project.repositoryName)).toEqual([
      "Budladislav/Flow",
      "Budladislav/Planer",
      "Budladislav/fitness-tracker",
      "Budladislav/safe-play",
      "Budladislav/ChronoAtlas",
      "Budladislav/Diary",
      "Budladislav/Utilities",
    ]);
    expect(projects.at(-1)).toMatchObject({
      name: "Коммунальные",
      repositoryVisibility: "public",
      version: "0.1.0",
      dataProfile: { mode: "local-only", sensitivity: "private" },
      publicProfile: { enabled: true },
    });
    expect(projects.find((project) => project.id === projectIds.monoFocus)).toMatchObject({ name: "Takt" });
    expect(projects.find((project) => project.id === projectIds.diary)?.iconUrl).toBe("/project-icons/nit.svg");
    expect(projects.find((project) => project.id === projectIds.utilities)?.iconUrl).toBe("/project-icons/utilities.svg");
    expect(projects.some((project) => /ren2gar/iu.test(project.repositoryName))).toBe(
      false,
    );
    expect(await database.releases.count()).toBeGreaterThan(5);
    expect(await database.ideas.count()).toBeGreaterThanOrEqual(4);
  });

  it("upgrades legacy presentation without replacing an existing custom icon", async () => {
    await ensureSeeded(database);
    await database.projects.update(projectIds.monoFocus, { name: "MonoFocus" });
    await database.projects.update(projectIds.diary, { iconUrl: undefined });
    await database.projects.update(projectIds.utilities, { iconUrl: "/custom.svg" });

    await ensureSeeded(database);

    expect(await database.projects.get(projectIds.monoFocus)).toMatchObject({ name: "Takt" });
    expect(await database.projects.get(projectIds.diary)).toMatchObject({ iconUrl: "/project-icons/nit.svg" });
    expect(await database.projects.get(projectIds.utilities)).toMatchObject({ iconUrl: "/custom.svg" });
  });

  it("keeps Flow excluded and follows the approved adapter priority", async () => {
    await ensureSeeded(database);
    const policies = await database.backupPolicies.toArray();
    const flow = policies.find((policy) => policy.projectId === projectIds.flow);
    expect(flow).toMatchObject({
      mode: "excluded",
      status: "excluded",
      sensitivity: "sensitive",
    });

    expect(
      policies
        .filter((policy) => policy.priority !== undefined)
        .sort((a, b) => Number(a.priority) - Number(b.priority))
        .map((policy) => policy.projectId),
    ).toEqual([
      projectIds.monoFocus,
      projectIds.fitness,
      projectIds.safePlay,
      projectIds.chronoAtlas,
      projectIds.utilities,
    ]);
  });

  it("provides a complete Werft Standard matrix with ChronoAtlas as baseline", () => {
    expect(seedQualityAssessments).toHaveLength(
      seedProjects.length * standardControls.length,
    );
    const chrono = seedQualityAssessments.filter(
      (assessment) => assessment.projectId === projectIds.chronoAtlas,
    );
    expect(chrono).toHaveLength(standardControls.length);
    expect(chrono.every((assessment) => assessment.result === "verified")).toBe(
      true,
    );
  });
});
