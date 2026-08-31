import { webcrypto } from "node:crypto";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import {
  createWerftBackup,
  parseWerftBackup,
  restoreWerftBackup,
  serializeWerftBackup,
  WerftBackupError,
} from "@/data/backup";
import { WerftDatabase } from "@/data/db";
import { upsertProjectNote } from "@/data/repository";
import { ensureSeeded, projectIds } from "@/data/seed";

describe("Werft backup", () => {
  let database: WerftDatabase;
  const originalCrypto = globalThis.crypto;

  beforeAll(() => {
    if (!globalThis.crypto?.subtle) {
      Object.defineProperty(globalThis, "crypto", {
        configurable: true,
        value: webcrypto,
      });
    }
  });

  afterAll(() => {
    Object.defineProperty(globalThis, "crypto", {
      configurable: true,
      value: originalCrypto,
    });
  });

  beforeEach(async () => {
    database = new WerftDatabase(`werft-backup-test-${crypto.randomUUID()}`);
    await ensureSeeded(database);
  });

  afterEach(async () => {
    database.close();
    await database.delete();
  });

  it("creates a versioned, checksummed full export", async () => {
    const envelope = await createWerftBackup(
      database,
      "2026-08-28T12:00:00.000Z",
    );
    expect(envelope).toMatchObject({
      format: "werft-backup",
      schemaVersion: 1,
      appVersion: "0.1.2",
      exportedAt: "2026-08-28T12:00:00.000Z",
    });
    expect(envelope.checksum).toMatch(/^[a-f0-9]{64}$/u);
    expect(envelope.payload.projects).toHaveLength(5);
    expect(
      envelope.payload.backupPolicies.find(
        (policy) => policy.projectId === projectIds.flow,
      ),
    ).toMatchObject({ mode: "excluded", status: "excluded" });

    const parsed = await parseWerftBackup(JSON.stringify(envelope));
    expect(parsed.checksum).toBe(envelope.checksum);
  });

  it("rejects tampering before touching local data", async () => {
    const text = await serializeWerftBackup(
      database,
      "2026-08-28T12:00:00.000Z",
    );
    const tampered = JSON.parse(text) as {
      payload: { projects: Array<{ summary: string }> };
    };
    tampered.payload.projects[0].summary = "Изменено после экспорта";
    const countBefore = await database.projects.count();

    await expect(restoreWerftBackup(tampered, database)).rejects.toMatchObject({
      code: "checksum-mismatch",
    } satisfies Partial<WerftBackupError>);
    expect(await database.projects.count()).toBe(countBefore);
  });

  it("restores every table in one transaction", async () => {
    const note = await upsertProjectNote(
      {
        projectId: projectIds.chronoAtlas,
        title: "Restore drill",
        body: "Проверить восстановление после обновления схемы.",
        pinned: false,
      },
      database,
    );
    const text = await serializeWerftBackup(
      database,
      "2026-08-28T12:00:00.000Z",
    );

    await database.transaction(
      "rw",
      database.projects,
      database.notes,
      async () => {
        await database.projects.clear();
        await database.notes.clear();
      },
    );
    expect(await database.projects.count()).toBe(0);

    await restoreWerftBackup(text, database);
    expect(await database.projects.count()).toBe(5);
    expect(await database.notes.get(note.id)).toMatchObject({
      title: "Restore drill",
      projectId: projectIds.chronoAtlas,
    });
    expect(await database.outbox.count()).toBeGreaterThan(0);
  });
});
