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

  it("seeds exactly the five approved repositories and remains idempotent", async () => {
    await ensureSeeded(database);
    await ensureSeeded(database);

    const projects = await database.projects.orderBy("sortOrder").toArray();
    expect(projects).toHaveLength(5);
    expect(projects.map((project) => project.repositoryName)).toEqual([
      "Budladislav/Flow",
      "Budladislav/Planer",
      "Budladislav/fitness-tracker",
      "Budladislav/safe-play",
      "Budladislav/ChronoAtlas",
    ]);
    expect(projects.some((project) => /ren2gar/iu.test(project.repositoryName))).toBe(
      false,
    );
    expect(await database.releases.count()).toBeGreaterThan(5);
    expect(await database.ideas.count()).toBeGreaterThanOrEqual(4);
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
