import type { GithubSyncEnvelope } from "@/lib/github/types";

import { type WerftDatabase, werftDb } from "./db";
import { applyGithubSyncEnvelope } from "./github-sync";

export const AUTO_GITHUB_SYNC_TTL_MS = 15 * 60 * 1_000;

type GithubStatus = {
  configured: boolean;
  connected: boolean;
};

type Fetcher = typeof fetch;

function errorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object" && "error" in payload) {
    const error = (payload as { error?: unknown }).error;
    if (typeof error === "string" && error.trim()) return error;
  }
  return fallback;
}

function isGithubSyncEnvelope(payload: unknown): payload is GithubSyncEnvelope {
  return Boolean(
    payload &&
    typeof payload === "object" &&
    "projects" in payload &&
    Array.isArray((payload as GithubSyncEnvelope).projects),
  );
}

export function shouldAutoSyncGithub(
  lastSyncedAt: string | undefined,
  now = Date.now(),
  ttlMs = AUTO_GITHUB_SYNC_TTL_MS,
) {
  if (!lastSyncedAt) return true;
  const timestamp = Date.parse(lastSyncedAt);
  return !Number.isFinite(timestamp) || now - timestamp >= ttlMs;
}

export async function latestSuccessfulGithubSyncAt(
  database: WerftDatabase = werftDb,
) {
  const events = await database.syncEvents.where("provider").equals("github").toArray();
  return events
    .filter(event => !event.deletedAt && event.status === "success")
    .reduce<string | undefined>(
      (latest, event) => !latest || event.occurredAt > latest ? event.occurredAt : latest,
      undefined,
    );
}

export async function syncGithubFromApi(
  fetcher: Fetcher = fetch,
  database: WerftDatabase = werftDb,
) {
  const response = await fetcher("/api/github/sync", {
    method: "POST",
    headers: { "content-type": "application/json" },
  });
  const payload: unknown = await response.json();
  if (!response.ok || !isGithubSyncEnvelope(payload)) {
    throw new Error(errorMessage(payload, "GitHub sync failed"));
  }
  return {
    envelope: payload,
    result: await applyGithubSyncEnvelope(payload, database),
  };
}

export async function autoSyncGithubIfStale(
  fetcher: Fetcher = fetch,
  database: WerftDatabase = werftDb,
  now = Date.now(),
) {
  const lastSyncedAt = await latestSuccessfulGithubSyncAt(database);
  if (!shouldAutoSyncGithub(lastSyncedAt, now)) {
    return { status: "fresh" as const, lastSyncedAt };
  }

  const statusResponse = await fetcher("/api/github/status", { cache: "no-store" });
  const status: GithubStatus = await statusResponse.json();
  if (!statusResponse.ok || !status.configured || !status.connected) {
    return { status: "disconnected" as const, lastSyncedAt };
  }

  const synced = await syncGithubFromApi(fetcher, database);
  return { status: "synced" as const, lastSyncedAt, ...synced };
}
