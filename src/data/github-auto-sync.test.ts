import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { WerftDatabase } from "./db";
import {
  AUTO_GITHUB_SYNC_TTL_MS,
  autoSyncGithubIfStale,
  latestSuccessfulGithubSyncAt,
  shouldAutoSyncGithub,
} from "./github-auto-sync";
import { ensureSeeded } from "./seed";

describe("automatic GitHub synchronization", () => {
  let database: WerftDatabase;

  beforeEach(async () => {
    database = new WerftDatabase(`werft-auto-sync-${crypto.randomUUID()}`);
    await ensureSeeded(database);
  });

  afterEach(async () => {
    database.close();
    await database.delete();
  });

  it("starts when the latest successful snapshot is older than the TTL", () => {
    const now = Date.parse("2026-08-30T12:00:00.000Z");
    expect(shouldAutoSyncGithub(undefined, now)).toBe(true);
    expect(shouldAutoSyncGithub(
      new Date(now - AUTO_GITHUB_SYNC_TTL_MS + 1).toISOString(),
      now,
    )).toBe(false);
    expect(shouldAutoSyncGithub(
      new Date(now - AUTO_GITHUB_SYNC_TTL_MS).toISOString(),
      now,
    )).toBe(true);
  });

  it("skips GitHub network work while the local snapshot is fresh", async () => {
    const latest = await latestSuccessfulGithubSyncAt(database);
    expect(latest).toBeTruthy();
    const fetcher = vi.fn<typeof fetch>();

    await expect(autoSyncGithubIfStale(
      fetcher,
      database,
      Date.parse(latest!) + AUTO_GITHUB_SYNC_TTL_MS - 1,
    )).resolves.toMatchObject({ status: "fresh", lastSyncedAt: latest });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("checks connection but does not request repository data without OAuth", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ configured: true, connected: false }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(autoSyncGithubIfStale(
      fetcher,
      database,
      Date.parse("2030-01-01T00:00:00.000Z"),
    )).resolves.toMatchObject({ status: "disconnected" });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledWith("/api/github/status", { cache: "no-store" });
  });
});
