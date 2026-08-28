import {
  APP_VERSION,
  BACKUP_FORMAT,
  BACKUP_SCHEMA_VERSION,
  type WerftBackupEnvelope,
  type WerftBackupPayload,
} from "@/lib/domain";
import { contentTables, type WerftDatabase, werftDb } from "@/data/db";
import { getDeviceId } from "@/data/device";

const payloadKeys = [
  "projects",
  "releases",
  "notes",
  "ideas",
  "maintenanceRules",
  "backupPolicies",
  "backupRuns",
  "qualityAssessments",
  "syncEvents",
  "outbox",
  "settings",
] as const satisfies readonly (keyof WerftBackupPayload)[];

type JsonRecord = Record<string, unknown>;

export class WerftBackupError extends Error {
  constructor(
    message: string,
    readonly code:
      | "invalid-json"
      | "invalid-format"
      | "unsupported-schema"
      | "invalid-payload"
      | "checksum-mismatch"
      | "crypto-unavailable",
  ) {
    super(message);
    this.name = "WerftBackupError";
  }
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function expectRecord(value: unknown, path: string): JsonRecord {
  if (!isRecord(value)) {
    throw new WerftBackupError(`${path}: ожидался объект.`, "invalid-payload");
  }
  return value;
}

function expectString(record: JsonRecord, key: string, path: string) {
  if (typeof record[key] !== "string" || record[key] === "") {
    throw new WerftBackupError(
      `${path}.${key}: ожидалась непустая строка.`,
      "invalid-payload",
    );
  }
}

function expectOptionalString(record: JsonRecord, key: string, path: string) {
  if (record[key] !== undefined && typeof record[key] !== "string") {
    throw new WerftBackupError(
      `${path}.${key}: ожидалась строка.`,
      "invalid-payload",
    );
  }
}

function expectDate(record: JsonRecord, key: string, path: string) {
  expectString(record, key, path);
  if (Number.isNaN(Date.parse(String(record[key])))) {
    throw new WerftBackupError(
      `${path}.${key}: ожидалась корректная дата.`,
      "invalid-payload",
    );
  }
}

function expectOptionalDate(record: JsonRecord, key: string, path: string) {
  if (record[key] === undefined) return;
  expectDate(record, key, path);
}

function expectBoolean(record: JsonRecord, key: string, path: string) {
  if (typeof record[key] !== "boolean") {
    throw new WerftBackupError(
      `${path}.${key}: ожидалось логическое значение.`,
      "invalid-payload",
    );
  }
}

function expectOptionalNumber(record: JsonRecord, key: string, path: string) {
  if (record[key] !== undefined && !Number.isFinite(record[key])) {
    throw new WerftBackupError(
      `${path}.${key}: ожидалось число.`,
      "invalid-payload",
    );
  }
}

function expectOneOf(
  record: JsonRecord,
  key: string,
  values: readonly string[],
  path: string,
) {
  if (typeof record[key] !== "string" || !values.includes(record[key])) {
    throw new WerftBackupError(
      `${path}.${key}: неподдерживаемое значение ${String(record[key])}.`,
      "invalid-payload",
    );
  }
}

function expectStringArray(record: JsonRecord, key: string, path: string) {
  const value = record[key];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new WerftBackupError(
      `${path}.${key}: ожидался массив строк.`,
      "invalid-payload",
    );
  }
}

function expectArray(record: JsonRecord, key: string, path: string) {
  if (!Array.isArray(record[key])) {
    throw new WerftBackupError(
      `${path}.${key}: ожидался массив.`,
      "invalid-payload",
    );
  }
}

function validateMeta(value: unknown, path: string) {
  const record = expectRecord(value, path);
  expectString(record, "id", path);
  expectDate(record, "createdAt", path);
  expectDate(record, "updatedAt", path);
  expectString(record, "deviceId", path);
  if (
    typeof record.revision !== "number" ||
    !Number.isSafeInteger(record.revision) ||
    record.revision < 1
  ) {
    throw new WerftBackupError(
      `${path}.revision: ожидалось целое число >= 1.`,
      "invalid-payload",
    );
  }
  expectOptionalDate(record, "deletedAt", path);
  return record;
}

function validateProject(value: unknown, path: string) {
  const record = validateMeta(value, path);
  for (const key of [
    "slug",
    "name",
    "repositoryName",
    "repositoryId",
    "summary",
    "version",
    "accent",
    "mark",
  ]) {
    expectString(record, key, path);
  }
  for (const key of [
    "startedAt",
    "latestReleaseAt",
    "lastActivityAt",
    "lastSyncedAt",
  ]) {
    expectDate(record, key, path);
  }
  expectBoolean(record, "startedAtInferred", path);
  expectBoolean(record, "pinned", path);
  expectOptionalString(record, "iconUrl", path);
  expectOneOf(record, "repositoryVisibility", ["public", "private"], path);
  expectOneOf(
    record,
    "lifecycle",
    ["idea", "planning", "active", "maintenance", "paused", "archived"],
    path,
  );
  expectOneOf(
    record,
    "availability",
    ["working", "degraded", "unavailable", "unknown"],
    path,
  );
  expectOneOf(record, "attention", ["calm", "due-soon", "overdue"], path);
  expectOneOf(record, "syncStatus", ["fresh", "stale", "manual", "error"], path);
  for (const key of ["stack", "capabilities"]) {
    expectStringArray(record, key, path);
  }
  for (const key of ["links", "facts"]) expectArray(record, key, path);
  (record.links as unknown[]).forEach((link, index) => {
    const item = expectRecord(link, `${path}.links[${index}]`);
    expectString(item, "label", `${path}.links[${index}]`);
    expectString(item, "href", `${path}.links[${index}]`);
    expectOneOf(
      item,
      "kind",
      ["app", "repository", "docs", "other"],
      `${path}.links[${index}]`,
    );
  });
  (record.facts as unknown[]).forEach((fact, index) => {
    const item = expectRecord(fact, `${path}.facts[${index}]`);
    for (const key of ["key", "label", "value"]) {
      expectString(item, key, `${path}.facts[${index}]`);
    }
    expectOneOf(
      item,
      "source",
      ["github", "manifest", "repository", "manual", "derived"],
      `${path}.facts[${index}]`,
    );
    expectDate(item, "observedAt", `${path}.facts[${index}]`);
    expectOptionalString(item, "sourceUrl", `${path}.facts[${index}]`);
    if (item.inferred !== undefined) {
      expectBoolean(item, "inferred", `${path}.facts[${index}]`);
    }
    if (item.pinned !== undefined) {
      expectBoolean(item, "pinned", `${path}.facts[${index}]`);
    }
  });
  const dataProfile = expectRecord(record.dataProfile, `${path}.dataProfile`);
  expectOneOf(
    dataProfile,
    "mode",
    ["local-only", "cloud", "hybrid"],
    `${path}.dataProfile`,
  );
  expectStringArray(dataProfile, "stores", `${path}.dataProfile`);
  expectOneOf(
    dataProfile,
    "sensitivity",
    ["public", "private", "sensitive"],
    `${path}.dataProfile`,
  );
  const publicProfile = expectRecord(
    record.publicProfile,
    `${path}.publicProfile`,
  );
  for (const key of ["slug", "tagline", "shortDescription"]) {
    expectString(publicProfile, key, `${path}.publicProfile`);
  }
  for (const key of ["categories", "platforms", "highlights"]) {
    expectStringArray(publicProfile, key, `${path}.publicProfile`);
  }
  expectBoolean(publicProfile, "enabled", `${path}.publicProfile`);
  expectBoolean(publicProfile, "showVersion", `${path}.publicProfile`);
  expectBoolean(publicProfile, "featured", `${path}.publicProfile`);
  expectOptionalString(publicProfile, "appUrl", `${path}.publicProfile`);
  expectOptionalString(publicProfile, "repositoryUrl", `${path}.publicProfile`);
  if (!Number.isFinite(publicProfile.sortOrder)) {
    throw new WerftBackupError(
      `${path}.publicProfile.sortOrder: ожидалось число.`,
      "invalid-payload",
    );
  }
  if (!Number.isFinite(record.sortOrder)) {
    throw new WerftBackupError(
      `${path}.sortOrder: ожидалось число.`,
      "invalid-payload",
    );
  }
}

function validateRelease(value: unknown, path: string) {
  const record = validateMeta(value, path);
  for (const key of ["projectId", "version", "title"]) {
    expectString(record, key, path);
  }
  expectDate(record, "releasedAt", path);
  expectOneOf(record, "source", ["changelog", "github-release", "manual"], path);
  expectOptionalString(record, "sourceUrl", path);
  expectArray(record, "entries", path);
  (record.entries as unknown[]).forEach((entry, index) => {
    const item = expectRecord(entry, `${path}.entries[${index}]`);
    expectString(item, "id", `${path}.entries[${index}]`);
    expectOneOf(
      item,
      "category",
      ["added", "changed", "fixed", "security"],
      `${path}.entries[${index}]`,
    );
    expectString(item, "text", `${path}.entries[${index}]`);
  });
}

function validateSimpleEntity(
  value: unknown,
  path: string,
  requiredStrings: string[],
) {
  const record = validateMeta(value, path);
  requiredStrings.forEach((key) => expectString(record, key, path));
  return record;
}

function assertUnique(rows: unknown[], path: string, keyFor: (row: JsonRecord) => string) {
  const seen = new Set<string>();
  rows.forEach((row, index) => {
    const key = keyFor(expectRecord(row, `${path}[${index}]`));
    if (seen.has(key)) {
      throw new WerftBackupError(
        `${path}: повторяющийся ключ ${key}.`,
        "invalid-payload",
      );
    }
    seen.add(key);
  });
}

function validatePayload(value: unknown): asserts value is WerftBackupPayload {
  const payload = expectRecord(value, "payload");
  payloadKeys.forEach((key) => expectArray(payload, key, "payload"));

  const projects = payload.projects as unknown[];
  const releases = payload.releases as unknown[];
  const notes = payload.notes as unknown[];
  const ideas = payload.ideas as unknown[];
  const maintenanceRules = payload.maintenanceRules as unknown[];
  const backupPolicies = payload.backupPolicies as unknown[];
  const backupRuns = payload.backupRuns as unknown[];
  const qualityAssessments = payload.qualityAssessments as unknown[];
  const syncEvents = payload.syncEvents as unknown[];
  const outbox = payload.outbox as unknown[];
  const settings = payload.settings as unknown[];

  projects.forEach((row, index) => validateProject(row, `payload.projects[${index}]`));
  releases.forEach((row, index) =>
    validateRelease(row, `payload.releases[${index}]`),
  );
  notes.forEach((row, index) => {
    const item = validateSimpleEntity(row, `payload.notes[${index}]`, [
      "projectId",
      "title",
      "body",
    ]);
    expectBoolean(item, "pinned", `payload.notes[${index}]`);
  });
  ideas.forEach((row, index) => {
    const item = validateSimpleEntity(row, `payload.ideas[${index}]`, [
      "title",
      "summary",
      "nextAction",
    ]);
    expectOptionalString(item, "projectId", `payload.ideas[${index}]`);
    expectOneOf(
      item,
      "stage",
      ["draft", "research", "planned", "building"],
      `payload.ideas[${index}]`,
    );
    expectOneOf(
      item,
      "target",
      ["project", "ecosystem"],
      `payload.ideas[${index}]`,
    );
    expectStringArray(item, "tags", `payload.ideas[${index}]`);
  });
  maintenanceRules.forEach((row, index) => {
    const item = validateSimpleEntity(
      row,
      `payload.maintenanceRules[${index}]`,
      [
      "title",
      "description",
      ],
    );
    expectOptionalString(item, "projectId", `payload.maintenanceRules[${index}]`);
    expectOneOf(
      item,
      "kind",
      ["backup", "hosting", "domain", "quality", "release", "other"],
      `payload.maintenanceRules[${index}]`,
    );
    expectDate(item, "dueAt", `payload.maintenanceRules[${index}]`);
    expectOneOf(
      item,
      "status",
      ["upcoming", "due", "overdue", "completed", "snoozed", "excluded"],
      `payload.maintenanceRules[${index}]`,
    );
    expectOptionalNumber(
      item,
      "cadenceDays",
      `payload.maintenanceRules[${index}]`,
    );
    expectOptionalDate(item, "completedAt", `payload.maintenanceRules[${index}]`);
    expectOptionalString(item, "evidence", `payload.maintenanceRules[${index}]`);
  });
  backupPolicies.forEach((row, index) => {
    const item = validateSimpleEntity(
      row,
      `payload.backupPolicies[${index}]`,
      [
      "projectId",
      ],
    );
    expectOneOf(
      item,
      "mode",
      ["excluded", "manual-file", "browser-adapter", "remote-workflow"],
      `payload.backupPolicies[${index}]`,
    );
    expectOneOf(
      item,
      "sensitivity",
      ["public", "private", "sensitive"],
      `payload.backupPolicies[${index}]`,
    );
    expectOneOf(
      item,
      "status",
      ["excluded", "fresh", "due-soon", "overdue", "not-configured"],
      `payload.backupPolicies[${index}]`,
    );
    expectOptionalNumber(item, "priority", `payload.backupPolicies[${index}]`);
    expectOptionalNumber(
      item,
      "cadenceDays",
      `payload.backupPolicies[${index}]`,
    );
    for (const key of ["lastSuccessfulAt", "nextDueAt", "restoreVerifiedAt"]) {
      expectOptionalDate(item, key, `payload.backupPolicies[${index}]`);
    }
    for (const key of ["reason", "format"]) {
      expectOptionalString(item, key, `payload.backupPolicies[${index}]`);
    }
  });
  backupRuns.forEach((row, index) => {
    const item = validateSimpleEntity(row, `payload.backupRuns[${index}]`, [
      "projectId",
      "policyId",
    ]);
    expectDate(item, "startedAt", `payload.backupRuns[${index}]`);
    expectOptionalDate(item, "completedAt", `payload.backupRuns[${index}]`);
    expectOneOf(
      item,
      "status",
      ["running", "success", "failed", "cancelled"],
      `payload.backupRuns[${index}]`,
    );
    for (const key of ["filename", "checksum", "evidence"]) {
      expectOptionalString(item, key, `payload.backupRuns[${index}]`);
    }
    expectOptionalNumber(item, "byteSize", `payload.backupRuns[${index}]`);
  });
  qualityAssessments.forEach((row, index) => {
    const item = validateSimpleEntity(
      row,
      `payload.qualityAssessments[${index}]`,
      [
      "projectId",
      "standardVersion",
      "controlId",
      "evidence",
      ],
    );
    expectOneOf(
      item,
      "result",
      [
        "verified",
        "action-required",
        "warning",
        "unknown",
        "not-applicable",
        "exception",
      ],
      `payload.qualityAssessments[${index}]`,
    );
    expectOneOf(
      item,
      "source",
      ["github", "repository", "manual", "derived"],
      `payload.qualityAssessments[${index}]`,
    );
    expectOptionalString(
      item,
      "remediation",
      `payload.qualityAssessments[${index}]`,
    );
    expectDate(item, "checkedAt", `payload.qualityAssessments[${index}]`);
  });
  syncEvents.forEach((row, index) => {
    const item = validateSimpleEntity(row, `payload.syncEvents[${index}]`, [
      "summary",
    ]);
    expectOptionalString(item, "projectId", `payload.syncEvents[${index}]`);
    expectOneOf(
      item,
      "provider",
      ["github", "local", "future-server"],
      `payload.syncEvents[${index}]`,
    );
    expectOneOf(
      item,
      "direction",
      ["pull", "push"],
      `payload.syncEvents[${index}]`,
    );
    expectOneOf(
      item,
      "status",
      ["queued", "running", "success", "error"],
      `payload.syncEvents[${index}]`,
    );
    expectDate(item, "occurredAt", `payload.syncEvents[${index}]`);
    expectOptionalString(item, "details", `payload.syncEvents[${index}]`);
  });
  outbox.forEach((row, index) => {
    const item = validateSimpleEntity(row, `payload.outbox[${index}]`, [
      "entityType",
      "entityId",
    ]);
    expectOneOf(
      item,
      "operation",
      ["upsert", "delete"],
      `payload.outbox[${index}]`,
    );
    expectOneOf(
      item,
      "status",
      ["pending", "synced", "conflict"],
      `payload.outbox[${index}]`,
    );
    if (!Number.isSafeInteger(item.baseRevision) || Number(item.baseRevision) < 0) {
      throw new WerftBackupError(
        `payload.outbox[${index}].baseRevision: ожидалось целое число >= 0.`,
        "invalid-payload",
      );
    }
  });
  settings.forEach((row, index) => {
    const item = validateSimpleEntity(row, `payload.settings[${index}]`, [
      "key",
      "value",
    ]);
    expectOneOf(
      item,
      "scope",
      ["device", "account"],
      `payload.settings[${index}]`,
    );
  });

  for (const key of payloadKeys) {
    assertUnique(payload[key] as unknown[], `payload.${key}`, (row) =>
      String(row.id),
    );
  }
  assertUnique(projects, "payload.projects", (row) => String(row.slug));
  assertUnique(releases, "payload.releases", (row) =>
    `${String(row.projectId)}:${String(row.version)}`,
  );
  assertUnique(backupPolicies, "payload.backupPolicies", (row) =>
    String(row.projectId),
  );
  assertUnique(qualityAssessments, "payload.qualityAssessments", (row) =>
    `${String(row.projectId)}:${String(row.controlId)}`,
  );
  assertUnique(settings, "payload.settings", (row) =>
    `${String(row.scope)}:${String(row.key)}`,
  );

  const projectIds = new Set(projects.map((row) => String(expectRecord(row, "project").id)));
  const projectSlugs = new Set(
    projects.map((row) => String(expectRecord(row, "project").slug)),
  );
  for (const slug of [
    "flow",
    "monofocus",
    "fitness-tracker",
    "safe-play",
    "chronoatlas",
  ]) {
    if (!projectSlugs.has(slug)) {
      throw new WerftBackupError(
        `В полном backup отсутствует базовый проект ${slug}.`,
        "invalid-payload",
      );
    }
  }
  const policyIds = new Set(
    backupPolicies.map((row) => String(expectRecord(row, "policy").id)),
  );
  const projectRelations = [
    ...releases,
    ...notes,
    ...backupPolicies,
    ...backupRuns,
    ...qualityAssessments,
  ];
  projectRelations.forEach((row, index) => {
    const projectId = expectRecord(row, `projectRelation[${index}]`).projectId;
    if (typeof projectId !== "string" || !projectIds.has(projectId)) {
      throw new WerftBackupError(
        `Связанный проект ${String(projectId)} отсутствует в backup.`,
        "invalid-payload",
      );
    }
  });
  [...ideas, ...maintenanceRules, ...syncEvents].forEach((row, index) => {
    const projectId = expectRecord(row, `optionalProjectRelation[${index}]`).projectId;
    if (
      projectId !== undefined &&
      (typeof projectId !== "string" || !projectIds.has(projectId))
    ) {
      throw new WerftBackupError(
        `Связанный проект ${String(projectId)} отсутствует в backup.`,
        "invalid-payload",
      );
    }
  });
  backupRuns.forEach((row, index) => {
    const policyId = expectRecord(row, `payload.backupRuns[${index}]`).policyId;
    if (typeof policyId !== "string" || !policyIds.has(policyId)) {
      throw new WerftBackupError(
        `Связанная политика ${String(policyId)} отсутствует в backup.`,
        "invalid-payload",
      );
    }
  });

  const flowProject = projects
    .map((row) => expectRecord(row, "payload.projects[]"))
    .find((project) => project.slug === "flow");
  if (flowProject) {
    const flowPolicy = backupPolicies
      .map((row) => expectRecord(row, "payload.backupPolicies[]"))
      .find((policy) => policy.projectId === flowProject.id);
    const flowDataProfile = expectRecord(
      flowProject.dataProfile,
      "payload.projects[flow].dataProfile",
    );
    if (
      flowProject.repositoryVisibility !== "private" ||
      flowDataProfile.sensitivity !== "sensitive" ||
      !flowPolicy ||
      flowPolicy.mode !== "excluded" ||
      flowPolicy.status !== "excluded" ||
      flowPolicy.sensitivity !== "sensitive"
    ) {
      throw new WerftBackupError(
        "Flow должен оставаться исключённым из backup-контуров MVP.",
        "invalid-payload",
      );
    }
  }
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new WerftBackupError(
        "Backup содержит невалидное число.",
        "invalid-payload",
      );
    }
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  if (isRecord(value)) {
    const fields = Object.keys(value)
      .filter((key) => value[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`);
    return `{${fields.join(",")}}`;
  }
  throw new WerftBackupError(
    "Backup содержит неподдерживаемое значение.",
    "invalid-payload",
  );
}

async function sha256(value: string) {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new WerftBackupError(
      "Web Crypto недоступен: checksum нельзя проверить безопасно.",
      "crypto-unavailable",
    );
  }
  const bytes = new TextEncoder().encode(value);
  const digest = await subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

function checksumMaterial(
  envelope: Omit<WerftBackupEnvelope, "checksum"> | WerftBackupEnvelope,
) {
  return {
    format: envelope.format,
    schemaVersion: envelope.schemaVersion,
    appVersion: envelope.appVersion,
    exportedAt: envelope.exportedAt,
    deviceId: envelope.deviceId,
    payload: envelope.payload,
  };
}

export async function computeWerftBackupChecksum(
  envelope: Omit<WerftBackupEnvelope, "checksum"> | WerftBackupEnvelope,
) {
  return sha256(canonicalJson(checksumMaterial(envelope)));
}

const sortById = <T extends { id: string }>(rows: T[]) =>
  rows.sort((a, b) => a.id.localeCompare(b.id));

export async function createWerftBackup(
  database: WerftDatabase = werftDb,
  exportedAt = new Date().toISOString(),
): Promise<WerftBackupEnvelope> {
  const payload = await database.transaction(
    "r",
    contentTables(database),
    async (): Promise<WerftBackupPayload> => ({
      projects: sortById(await database.projects.toArray()),
      releases: sortById(await database.releases.toArray()),
      notes: sortById(await database.notes.toArray()),
      ideas: sortById(await database.ideas.toArray()),
      maintenanceRules: sortById(await database.maintenanceRules.toArray()),
      backupPolicies: sortById(await database.backupPolicies.toArray()),
      backupRuns: sortById(await database.backupRuns.toArray()),
      qualityAssessments: sortById(
        await database.qualityAssessments.toArray(),
      ),
      syncEvents: sortById(await database.syncEvents.toArray()),
      outbox: sortById(await database.outbox.toArray()),
      settings: sortById(await database.settings.toArray()),
    }),
  );

  const unsigned: Omit<WerftBackupEnvelope, "checksum"> = {
    format: BACKUP_FORMAT,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    appVersion: APP_VERSION,
    exportedAt,
    deviceId: getDeviceId(),
    payload,
  };
  return {
    ...unsigned,
    checksum: await computeWerftBackupChecksum(unsigned),
  };
}

export async function serializeWerftBackup(
  database: WerftDatabase = werftDb,
  exportedAt?: string,
) {
  return JSON.stringify(await createWerftBackup(database, exportedAt), null, 2);
}

export async function parseWerftBackup(
  input: string | unknown,
): Promise<WerftBackupEnvelope> {
  let value: unknown = input;
  if (typeof input === "string") {
    try {
      value = JSON.parse(input) as unknown;
    } catch {
      throw new WerftBackupError(
        "Файл не является корректным JSON.",
        "invalid-json",
      );
    }
  }

  const envelope = expectRecord(value, "backup");
  if (envelope.format !== BACKUP_FORMAT) {
    throw new WerftBackupError(
      "Это не backup Верфи.",
      "invalid-format",
    );
  }
  if (envelope.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    throw new WerftBackupError(
      `Схема ${String(envelope.schemaVersion)} пока не поддерживается.`,
      "unsupported-schema",
    );
  }
  for (const key of ["appVersion", "exportedAt", "deviceId", "checksum"]) {
    expectString(envelope, key, "backup");
  }
  if (!/^[a-f0-9]{64}$/u.test(String(envelope.checksum))) {
    throw new WerftBackupError(
      "Checksum backup имеет неверный формат.",
      "invalid-payload",
    );
  }
  validatePayload(envelope.payload);

  const typed = envelope as unknown as WerftBackupEnvelope;
  const actualChecksum = await computeWerftBackupChecksum(typed);
  if (actualChecksum !== typed.checksum) {
    throw new WerftBackupError(
      "Checksum не совпадает: файл был изменён или повреждён.",
      "checksum-mismatch",
    );
  }
  return typed;
}

async function bulkAddIfPresent<T>(
  table: { bulkAdd(rows: T[]): Promise<unknown> },
  rows: T[],
) {
  if (rows.length > 0) await table.bulkAdd(rows);
}

export async function restoreWerftBackup(
  input: string | unknown,
  database: WerftDatabase = werftDb,
) {
  const envelope = await parseWerftBackup(input);
  const { payload } = envelope;

  await database.transaction("rw", contentTables(database), async () => {
    await Promise.all(contentTables(database).map((table) => table.clear()));
    await bulkAddIfPresent(database.projects, payload.projects);
    await bulkAddIfPresent(database.releases, payload.releases);
    await bulkAddIfPresent(database.notes, payload.notes);
    await bulkAddIfPresent(database.ideas, payload.ideas);
    await bulkAddIfPresent(database.maintenanceRules, payload.maintenanceRules);
    await bulkAddIfPresent(database.backupPolicies, payload.backupPolicies);
    await bulkAddIfPresent(database.backupRuns, payload.backupRuns);
    await bulkAddIfPresent(
      database.qualityAssessments,
      payload.qualityAssessments,
    );
    await bulkAddIfPresent(database.syncEvents, payload.syncEvents);
    await bulkAddIfPresent(database.outbox, payload.outbox);
    await bulkAddIfPresent(database.settings, payload.settings);
  });
  return envelope;
}

export function werftBackupFilename(exportedAt = new Date().toISOString()) {
  return `werft-${exportedAt.slice(0, 10)}.werft-backup`;
}
