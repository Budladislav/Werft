import type {
  AppSetting,
  BackupPolicy,
  BackupRun,
  EntityMeta,
  FutureIdea,
  MaintenanceRule,
  OutboxMutation,
  Project,
  ProjectNote,
} from "@/lib/domain";
import { createEntityId, getDeviceId } from "@/data/device";
import { type WerftDatabase, werftDb } from "@/data/db";

export type StartView = "overview" | "dock";

type MutableProject = Partial<Omit<Project, keyof EntityMeta | "id">>;
type MutableMaintenanceRule = Partial<
  Omit<MaintenanceRule, keyof EntityMeta | "id">
>;
type MutableBackupPolicy = Partial<
  Omit<BackupPolicy, keyof EntityMeta | "id" | "projectId">
>;

export type ProjectNoteInput = Omit<ProjectNote, keyof EntityMeta> & {
  id?: string;
};

export type FutureIdeaInput = Omit<FutureIdea, keyof EntityMeta> & {
  id?: string;
};

export type BackupRunInput = Omit<BackupRun, keyof EntityMeta> & {
  id?: string;
};

function nowIso() {
  return new Date().toISOString();
}

function entityMeta(id: string, existing?: EntityMeta): EntityMeta {
  const timestamp = nowIso();
  return {
    id,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
    revision: (existing?.revision ?? 0) + 1,
    deviceId: getDeviceId(),
  };
}

function outboxMutation(
  entityType: string,
  entity: EntityMeta,
  operation: OutboxMutation["operation"],
  payload: unknown,
): OutboxMutation {
  return {
    ...entityMeta(createEntityId("outbox")),
    entityType,
    entityId: entity.id,
    operation,
    baseRevision: Math.max(0, entity.revision - 1),
    payload,
    status: "pending",
  };
}

export async function updateProject(
  id: string,
  patch: MutableProject,
  database: WerftDatabase = werftDb,
) {
  return database.transaction("rw", database.projects, database.outbox, async () => {
    const existing = await database.projects.get(id);
    if (!existing || existing.deletedAt) {
      throw new Error(`Проект ${id} не найден.`);
    }

    const updated: Project = {
      ...existing,
      ...patch,
      ...entityMeta(id, existing),
    };
    await database.projects.put(updated);
    await database.outbox.add(
      outboxMutation("projects", updated, "upsert", updated),
    );
    return updated;
  });
}

export async function upsertProjectNote(
  input: ProjectNoteInput,
  database: WerftDatabase = werftDb,
) {
  const id = input.id ?? createEntityId("note");
  return database.transaction("rw", database.notes, database.outbox, async () => {
    const existing = await database.notes.get(id);
    const note: ProjectNote = {
      ...input,
      ...entityMeta(id, existing),
      id,
    };
    await database.notes.put(note);
    await database.outbox.add(outboxMutation("notes", note, "upsert", note));
    return note;
  });
}

export async function removeProjectNote(
  id: string,
  database: WerftDatabase = werftDb,
) {
  return database.transaction("rw", database.notes, database.outbox, async () => {
    const existing = await database.notes.get(id);
    if (!existing || existing.deletedAt) return false;
    const deleted: ProjectNote = {
      ...existing,
      ...entityMeta(id, existing),
      deletedAt: nowIso(),
    };
    await database.notes.put(deleted);
    await database.outbox.add(
      outboxMutation("notes", deleted, "delete", deleted),
    );
    return true;
  });
}

export async function upsertFutureIdea(
  input: FutureIdeaInput,
  database: WerftDatabase = werftDb,
) {
  const id = input.id ?? createEntityId("idea");
  return database.transaction("rw", database.ideas, database.outbox, async () => {
    const existing = await database.ideas.get(id);
    const idea: FutureIdea = {
      ...input,
      ...entityMeta(id, existing),
      id,
    };
    await database.ideas.put(idea);
    await database.outbox.add(outboxMutation("ideas", idea, "upsert", idea));
    return idea;
  });
}

export async function removeFutureIdea(
  id: string,
  database: WerftDatabase = werftDb,
) {
  return database.transaction("rw", database.ideas, database.outbox, async () => {
    const existing = await database.ideas.get(id);
    if (!existing || existing.deletedAt) return false;
    const deleted: FutureIdea = {
      ...existing,
      ...entityMeta(id, existing),
      deletedAt: nowIso(),
    };
    await database.ideas.put(deleted);
    await database.outbox.add(
      outboxMutation("ideas", deleted, "delete", deleted),
    );
    return true;
  });
}

export async function updateMaintenanceRule(
  id: string,
  patch: MutableMaintenanceRule,
  database: WerftDatabase = werftDb,
) {
  return database.transaction(
    "rw",
    database.maintenanceRules,
    database.outbox,
    async () => {
      const existing = await database.maintenanceRules.get(id);
      if (!existing || existing.deletedAt) {
        throw new Error(`Напоминание ${id} не найдено.`);
      }
      const updated: MaintenanceRule = {
        ...existing,
        ...patch,
        ...entityMeta(id, existing),
      };
      await database.maintenanceRules.put(updated);
      await database.outbox.add(
        outboxMutation("maintenanceRules", updated, "upsert", updated),
      );
      return updated;
    },
  );
}

export async function completeMaintenanceRule(
  id: string,
  evidence?: string,
  database: WerftDatabase = werftDb,
) {
  const existing = await database.maintenanceRules.get(id);
  if (!existing || existing.deletedAt) {
    throw new Error(`Напоминание ${id} не найдено.`);
  }
  const completedAt = nowIso();
  return updateMaintenanceRule(
    id,
    {
      status: existing.cadenceDays ? "upcoming" : "completed",
      completedAt,
      ...(existing.cadenceDays
        ? { dueAt: addDays(completedAt, existing.cadenceDays) }
        : {}),
      ...(evidence === undefined ? {} : { evidence }),
    },
    database,
  );
}

export async function updateBackupPolicy(
  id: string,
  patch: MutableBackupPolicy,
  database: WerftDatabase = werftDb,
) {
  return database.transaction(
    "rw",
    database.backupPolicies,
    database.outbox,
    async () => {
      const existing = await database.backupPolicies.get(id);
      if (!existing || existing.deletedAt) {
        throw new Error(`Политика backup ${id} не найдена.`);
      }
      if (existing.projectId === "project:flow") {
        if (
          (patch.mode !== undefined && patch.mode !== "excluded") ||
          (patch.status !== undefined && patch.status !== "excluded")
        ) {
          throw new Error(
            "Backup Flow исключён из MVP и не может быть включён локальной настройкой.",
          );
        }
      }

      const updated: BackupPolicy = {
        ...existing,
        ...patch,
        ...entityMeta(id, existing),
      };
      await database.backupPolicies.put(updated);
      await database.outbox.add(
        outboxMutation("backupPolicies", updated, "upsert", updated),
      );
      return updated;
    },
  );
}

function addDays(isoDate: string, days: number) {
  const date = new Date(isoDate);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

export async function recordBackupRun(
  input: BackupRunInput,
  database: WerftDatabase = werftDb,
) {
  const id = input.id ?? createEntityId("backup-run");
  return database.transaction(
    "rw",
    database.backupRuns,
    database.backupPolicies,
    database.outbox,
    async () => {
      const policy = await database.backupPolicies.get(input.policyId);
      if (!policy || policy.deletedAt) {
        throw new Error(`Политика backup ${input.policyId} не найдена.`);
      }
      if (policy.projectId !== input.projectId) {
        throw new Error("Backup run относится к другому проекту.");
      }
      if (policy.mode === "excluded") {
        throw new Error("Исключённый backup нельзя запустить из Верфи.");
      }

      const existing = await database.backupRuns.get(id);
      const run: BackupRun = {
        ...input,
        ...entityMeta(id, existing),
        id,
      };
      await database.backupRuns.put(run);
      await database.outbox.add(
        outboxMutation("backupRuns", run, "upsert", run),
      );

      if (run.status === "success") {
        const completedAt = run.completedAt ?? nowIso();
        const updatedPolicy: BackupPolicy = {
          ...policy,
          ...entityMeta(policy.id, policy),
          lastSuccessfulAt: completedAt,
          nextDueAt: policy.cadenceDays
            ? addDays(completedAt, policy.cadenceDays)
            : policy.nextDueAt,
          status: "fresh",
        };
        await database.backupPolicies.put(updatedPolicy);
        await database.outbox.add(
          outboxMutation(
            "backupPolicies",
            updatedPolicy,
            "upsert",
            updatedPolicy,
          ),
        );
      }

      return run;
    },
  );
}

export async function setAppSetting(
  key: string,
  value: string,
  scope: AppSetting["scope"] = "device",
  database: WerftDatabase = werftDb,
) {
  const id = `setting:${scope}:${key}`;
  return database.transaction("rw", database.settings, database.outbox, async () => {
    const existing = await database.settings.get(id);
    const setting: AppSetting = {
      ...entityMeta(id, existing),
      key,
      value,
      scope,
    };
    await database.settings.put(setting);
    if (scope === "account") {
      await database.outbox.add(
        outboxMutation("settings", setting, "upsert", setting),
      );
    }
    return setting;
  });
}

export function normalizeStartView(value?: string): StartView {
  return value === "dock" ? "dock" : "overview";
}

export async function getStartView(database: WerftDatabase = werftDb) {
  const setting = await database.settings.get("setting:device:startPage");
  return normalizeStartView(setting?.value);
}

export function setStartView(
  value: StartView,
  database: WerftDatabase = werftDb,
) {
  return setAppSetting("startPage", value, "device", database);
}
