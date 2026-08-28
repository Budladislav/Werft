import Dexie, { type EntityTable } from "dexie";

import type {
  AppSetting,
  BackupPolicy,
  BackupRun,
  FutureIdea,
  MaintenanceRule,
  OutboxMutation,
  Project,
  ProjectNote,
  ProjectRelease,
  QualityAssessment,
  SyncEvent,
} from "@/lib/domain";

export const WERFT_DATABASE_NAME = "werft-local";

export class WerftDatabase extends Dexie {
  projects!: EntityTable<Project, "id">;
  releases!: EntityTable<ProjectRelease, "id">;
  notes!: EntityTable<ProjectNote, "id">;
  ideas!: EntityTable<FutureIdea, "id">;
  maintenanceRules!: EntityTable<MaintenanceRule, "id">;
  backupPolicies!: EntityTable<BackupPolicy, "id">;
  backupRuns!: EntityTable<BackupRun, "id">;
  qualityAssessments!: EntityTable<QualityAssessment, "id">;
  syncEvents!: EntityTable<SyncEvent, "id">;
  outbox!: EntityTable<OutboxMutation, "id">;
  settings!: EntityTable<AppSetting, "id">;

  constructor(name = WERFT_DATABASE_NAME) {
    super(name);

    this.version(1).stores({
      projects:
        "&id, &slug, repositoryId, repositoryVisibility, lifecycle, attention, syncStatus, sortOrder, updatedAt, deletedAt",
      releases:
        "&id, projectId, [projectId+releasedAt], [projectId+version], releasedAt, updatedAt, deletedAt",
      notes: "&id, projectId, pinned, updatedAt, deletedAt",
      ideas: "&id, projectId, target, stage, updatedAt, deletedAt",
      maintenanceRules:
        "&id, projectId, kind, status, dueAt, updatedAt, deletedAt",
      backupPolicies:
        "&id, &projectId, priority, mode, status, nextDueAt, updatedAt, deletedAt",
      backupRuns:
        "&id, projectId, policyId, status, startedAt, completedAt, updatedAt, deletedAt",
      qualityAssessments:
        "&id, projectId, controlId, [projectId+controlId], standardVersion, result, checkedAt, updatedAt, deletedAt",
      syncEvents:
        "&id, projectId, provider, direction, status, occurredAt, updatedAt, deletedAt",
      outbox:
        "&id, entityType, entityId, [entityType+entityId], status, createdAt, updatedAt",
      settings: "&id, &[scope+key], key, scope, updatedAt, deletedAt",
    });
  }
}

export const werftDb = new WerftDatabase();

export const contentTables = (database: WerftDatabase) => [
  database.projects,
  database.releases,
  database.notes,
  database.ideas,
  database.maintenanceRules,
  database.backupPolicies,
  database.backupRuns,
  database.qualityAssessments,
  database.syncEvents,
  database.outbox,
  database.settings,
] as const;
