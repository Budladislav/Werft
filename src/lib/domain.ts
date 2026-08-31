export const APP_VERSION = "0.1.2";
export const BACKUP_FORMAT = "werft-backup";
export const BACKUP_SCHEMA_VERSION = 1;

export type EntityMeta = {
  id: string;
  createdAt: string;
  updatedAt: string;
  revision: number;
  deviceId: string;
  deletedAt?: string;
};

export type ProjectLifecycle =
  | "idea"
  | "planning"
  | "active"
  | "maintenance"
  | "paused"
  | "archived";

export type AvailabilityStatus = "working" | "degraded" | "unavailable" | "unknown";
export type AttentionStatus = "calm" | "due-soon" | "overdue";
export type SyncStatus = "fresh" | "stale" | "manual" | "error";
export type DataSensitivity = "public" | "private" | "sensitive";
export type QualityResult =
  | "verified"
  | "action-required"
  | "warning"
  | "unknown"
  | "not-applicable"
  | "exception";

export type ProjectLink = {
  label: string;
  href: string;
  kind: "app" | "repository" | "docs" | "other";
};

export type ObservedFact = {
  key: string;
  label: string;
  value: string;
  source: "github" | "manifest" | "repository" | "manual" | "derived";
  observedAt: string;
  sourceUrl?: string;
  inferred?: boolean;
  pinned?: boolean;
};

export type PublicProjectProfile = {
  enabled: boolean;
  slug: string;
  tagline: string;
  shortDescription: string;
  categories: string[];
  platforms: string[];
  highlights: string[];
  appUrl?: string;
  repositoryUrl?: string;
  showVersion: boolean;
  featured: boolean;
  sortOrder: number;
};

export type Project = EntityMeta & {
  slug: string;
  name: string;
  repositoryName: string;
  repositoryId: string;
  repositoryVisibility: "public" | "private";
  summary: string;
  startedAt: string;
  startedAtInferred: boolean;
  version: string;
  latestReleaseAt: string;
  lastActivityAt: string;
  lifecycle: ProjectLifecycle;
  availability: AvailabilityStatus;
  attention: AttentionStatus;
  syncStatus: SyncStatus;
  lastSyncedAt: string;
  pinned: boolean;
  sortOrder: number;
  accent: string;
  mark: string;
  iconUrl?: string;
  stack: string[];
  capabilities: string[];
  links: ProjectLink[];
  facts: ObservedFact[];
  dataProfile: {
    mode: "local-only" | "cloud" | "hybrid";
    stores: string[];
    sensitivity: DataSensitivity;
  };
  publicProfile: PublicProjectProfile;
};

export type ReleaseCategory = "added" | "changed" | "fixed" | "security";

export type ChangeEntry = {
  id: string;
  category: ReleaseCategory;
  text: string;
};

export type ProjectRelease = EntityMeta & {
  projectId: string;
  version: string;
  releasedAt: string;
  title: string;
  source: "changelog" | "github-release" | "manual";
  sourceUrl?: string;
  entries: ChangeEntry[];
};

export type ProjectNote = EntityMeta & {
  projectId: string;
  title: string;
  body: string;
  pinned: boolean;
};

export type FutureIdea = EntityMeta & {
  projectId?: string;
  title: string;
  summary: string;
  stage: "draft" | "research" | "planned" | "building";
  nextAction: string;
  tags: string[];
  target: "project" | "ecosystem";
};

export type MaintenanceRule = EntityMeta & {
  projectId?: string;
  title: string;
  description: string;
  kind: "backup" | "hosting" | "domain" | "quality" | "release" | "other";
  cadenceDays?: number;
  dueAt: string;
  status: "upcoming" | "due" | "overdue" | "completed" | "snoozed" | "excluded";
  completedAt?: string;
  evidence?: string;
};

export type BackupPolicy = EntityMeta & {
  projectId: string;
  priority?: number;
  mode: "excluded" | "manual-file" | "browser-adapter" | "remote-workflow";
  sensitivity: DataSensitivity;
  cadenceDays?: number;
  lastSuccessfulAt?: string;
  nextDueAt?: string;
  status: "excluded" | "fresh" | "due-soon" | "overdue" | "not-configured";
  reason?: string;
  format?: string;
  restoreVerifiedAt?: string;
};

export type BackupRun = EntityMeta & {
  projectId: string;
  policyId: string;
  startedAt: string;
  completedAt?: string;
  status: "running" | "success" | "failed" | "cancelled";
  filename?: string;
  byteSize?: number;
  checksum?: string;
  evidence?: string;
};

export type StandardControl = {
  id: string;
  title: string;
  area: "release" | "quality" | "pwa" | "data" | "backup" | "security";
  severity: "required" | "recommended";
  guidance: string;
};

export type QualityAssessment = EntityMeta & {
  projectId: string;
  standardVersion: string;
  controlId: string;
  result: QualityResult;
  evidence: string;
  source: "github" | "repository" | "manual" | "derived";
  remediation?: string;
  checkedAt: string;
};

export type SyncEvent = EntityMeta & {
  projectId?: string;
  provider: "github" | "local" | "future-server";
  direction: "pull" | "push";
  status: "queued" | "running" | "success" | "error";
  summary: string;
  occurredAt: string;
  details?: string;
};

export type OutboxMutation = EntityMeta & {
  entityType: string;
  entityId: string;
  operation: "upsert" | "delete";
  baseRevision: number;
  payload: unknown;
  status: "pending" | "synced" | "conflict";
};

export type AppSetting = EntityMeta & {
  key: string;
  value: string;
  scope: "device" | "account";
};

export type WerftBackupPayload = {
  projects: Project[];
  releases: ProjectRelease[];
  notes: ProjectNote[];
  ideas: FutureIdea[];
  maintenanceRules: MaintenanceRule[];
  backupPolicies: BackupPolicy[];
  backupRuns: BackupRun[];
  qualityAssessments: QualityAssessment[];
  syncEvents: SyncEvent[];
  outbox: OutboxMutation[];
  settings: AppSetting[];
};

export type WerftBackupEnvelope = {
  format: typeof BACKUP_FORMAT;
  schemaVersion: typeof BACKUP_SCHEMA_VERSION;
  appVersion: string;
  exportedAt: string;
  deviceId: string;
  checksum: string;
  payload: WerftBackupPayload;
};
