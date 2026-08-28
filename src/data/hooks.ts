"use client";

import { useLiveQuery } from "dexie-react-hooks";

import { standardControls } from "@/data/standard";
import { werftDb } from "@/data/db";
import { normalizeStartView } from "@/data/repository";

const active = <T extends { deletedAt?: string }>(row: T) => !row.deletedAt;

export function useProjects() {
  return useLiveQuery(async () => {
    const rows = await werftDb.projects.toArray();
    return rows
      .filter(active)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  }, []);
}

export function useProject(projectId?: string) {
  return useLiveQuery(async () => {
    if (!projectId) return null;
    const project = await werftDb.projects.get(projectId);
    return project && active(project) ? project : null;
  }, [projectId]);
}

export function useProjectBySlug(slug?: string) {
  return useLiveQuery(async () => {
    if (!slug) return null;
    const project = await werftDb.projects.where("slug").equals(slug).first();
    return project && active(project) ? project : null;
  }, [slug]);
}

export function useReleases(projectId?: string) {
  return useLiveQuery(async () => {
    const rows = projectId
      ? await werftDb.releases.where("projectId").equals(projectId).toArray()
      : await werftDb.releases.toArray();
    return rows
      .filter(active)
      .sort((a, b) => b.releasedAt.localeCompare(a.releasedAt));
  }, [projectId]);
}

export function useNotes(projectId?: string) {
  return useLiveQuery(async () => {
    const rows = projectId
      ? await werftDb.notes.where("projectId").equals(projectId).toArray()
      : await werftDb.notes.toArray();
    return rows
      .filter(active)
      .sort(
        (a, b) =>
          Number(b.pinned) - Number(a.pinned) ||
          b.updatedAt.localeCompare(a.updatedAt),
      );
  }, [projectId]);
}

export function useIdeas(projectId?: string) {
  return useLiveQuery(async () => {
    const rows = projectId
      ? await werftDb.ideas.where("projectId").equals(projectId).toArray()
      : await werftDb.ideas.toArray();
    const stageOrder = { building: 0, planned: 1, research: 2, draft: 3 };
    return rows
      .filter(active)
      .sort(
        (a, b) =>
          stageOrder[a.stage] - stageOrder[b.stage] ||
          b.updatedAt.localeCompare(a.updatedAt),
      );
  }, [projectId]);
}

export function useMaintenanceRules(projectId?: string) {
  return useLiveQuery(async () => {
    const rows = projectId
      ? await werftDb.maintenanceRules
          .where("projectId")
          .equals(projectId)
          .toArray()
      : await werftDb.maintenanceRules.toArray();
    return rows
      .filter(active)
      .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  }, [projectId]);
}

export function useBackupPolicies(projectId?: string) {
  return useLiveQuery(async () => {
    const rows = projectId
      ? await werftDb.backupPolicies
          .where("projectId")
          .equals(projectId)
          .toArray()
      : await werftDb.backupPolicies.toArray();
    return rows
      .filter(active)
      .sort(
        (a, b) =>
          (a.priority ?? Number.MAX_SAFE_INTEGER) -
            (b.priority ?? Number.MAX_SAFE_INTEGER) ||
          a.projectId.localeCompare(b.projectId),
      );
  }, [projectId]);
}

export function useBackupRuns(projectId?: string) {
  return useLiveQuery(async () => {
    const rows = projectId
      ? await werftDb.backupRuns.where("projectId").equals(projectId).toArray()
      : await werftDb.backupRuns.toArray();
    return rows
      .filter(active)
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  }, [projectId]);
}

export function useQualityAssessments(projectId?: string) {
  return useLiveQuery(async () => {
    const rows = projectId
      ? await werftDb.qualityAssessments
          .where("projectId")
          .equals(projectId)
          .toArray()
      : await werftDb.qualityAssessments.toArray();
    const controlOrder = new Map(
      standardControls.map((control, index) => [control.id, index]),
    );
    return rows
      .filter(active)
      .sort(
        (a, b) =>
          a.projectId.localeCompare(b.projectId) ||
          (controlOrder.get(a.controlId) ?? Number.MAX_SAFE_INTEGER) -
            (controlOrder.get(b.controlId) ?? Number.MAX_SAFE_INTEGER),
      );
  }, [projectId]);
}

export function useSyncEvents(projectId?: string) {
  return useLiveQuery(async () => {
    const rows = projectId
      ? await werftDb.syncEvents.where("projectId").equals(projectId).toArray()
      : await werftDb.syncEvents.toArray();
    return rows
      .filter(active)
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  }, [projectId]);
}

export function useAppSetting(
  key: string,
  scope: "device" | "account" = "device",
) {
  return useLiveQuery(
    async () => {
      const setting = await werftDb.settings.get(`setting:${scope}:${key}`);
      return setting && active(setting) ? setting : undefined;
    },
    [key, scope],
  );
}

export function useStartView() {
  return useLiveQuery(async () => {
    const setting = await werftDb.settings.get("setting:device:startPage");
    return normalizeStartView(setting?.value);
  }, []);
}
