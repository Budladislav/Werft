import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { WerftDatabase } from "@/data/db";
import {
  completeMaintenanceRule,
  getStartView,
  recordBackupRun,
  removeProjectNote,
  setStartView,
  updateBackupPolicy,
  upsertProjectNote,
} from "@/data/repository";
import { ensureSeeded, projectIds } from "@/data/seed";

describe("local repository", () => {
  let database: WerftDatabase;

  beforeEach(async () => {
    database = new WerftDatabase(`werft-repository-test-${crypto.randomUUID()}`);
    await ensureSeeded(database);
  });

  afterEach(async () => {
    database.close();
    await database.delete();
  });

  it("keeps the start view device-local", async () => {
    expect(await getStartView(database)).toBe("overview");
    await setStartView("dock", database);
    expect(await getStartView(database)).toBe("dock");
    expect(await database.outbox.count()).toBe(0);
  });

  it("writes private notes with revisions, outbox records and tombstones", async () => {
    const note = await upsertProjectNote(
      {
        projectId: projectIds.monoFocus,
        title: "Упростить быстрый ввод",
        body: "Проверить сценарий с клавиатуры.",
        pinned: true,
      },
      database,
    );
    expect(note.revision).toBe(1);
    expect(await database.outbox.count()).toBe(1);

    const updated = await upsertProjectNote(
      { ...note, body: "Добавить мобильный сценарий." },
      database,
    );
    expect(updated.revision).toBe(2);
    expect(await database.outbox.count()).toBe(2);

    expect(await removeProjectNote(note.id, database)).toBe(true);
    expect((await database.notes.get(note.id))?.deletedAt).toBeTruthy();
    expect((await database.outbox.orderBy("createdAt").last())?.operation).toBe(
      "delete",
    );
  });

  it("cannot enable the sensitive Flow backup from the MVP", async () => {
    await expect(
      updateBackupPolicy(
        "backup-policy:flow",
        { mode: "manual-file", status: "not-configured" },
        database,
      ),
    ).rejects.toThrow(/Flow/u);
    expect(await database.backupPolicies.get("backup-policy:flow")).toMatchObject({
      mode: "excluded",
      status: "excluded",
    });
  });

  it("records a successful project backup and schedules the next one", async () => {
    const completedAt = "2026-08-28T12:00:00.000Z";
    await recordBackupRun(
      {
        projectId: projectIds.fitness,
        policyId: "backup-policy:fitness",
        startedAt: "2026-08-28T11:59:00.000Z",
        completedAt,
        status: "success",
        filename: "fitness-backup.txt",
      },
      database,
    );
    expect(await database.backupPolicies.get("backup-policy:fitness")).toMatchObject({
      status: "fresh",
      lastSuccessfulAt: completedAt,
      nextDueAt: "2026-09-04T12:00:00.000Z",
    });
  });

  it("advances recurring maintenance while completing one-shot work", async () => {
    const recurring = await completeMaintenanceRule(
      "maintenance:project:fitness-tracker:backup",
      "Сохранено локально",
      database,
    );
    expect(recurring.status).toBe("upcoming");
    expect(recurring.completedAt).toBeTruthy();
    expect(
      (Date.parse(recurring.dueAt) - Date.parse(recurring.completedAt!)) /
        86_400_000,
    ).toBe(7);

    const oneShot = await completeMaintenanceRule(
      "maintenance:flow:atomic-restore",
      undefined,
      database,
    );
    expect(oneShot.status).toBe("completed");
  });
});
