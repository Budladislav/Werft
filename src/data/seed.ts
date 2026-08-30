import type {
  AppSetting,
  BackupPolicy,
  FutureIdea,
  MaintenanceRule,
  ObservedFact,
  Project,
  ProjectRelease,
  QualityAssessment,
  QualityResult,
  SyncEvent,
} from "@/lib/domain";
import type { EntityTable } from "dexie";
import {
  standardControls,
  WERFT_STANDARD_VERSION,
} from "@/data/standard";
import { contentTables, type WerftDatabase, werftDb } from "@/data/db";

export const SEED_OBSERVED_AT = "2026-08-28T04:00:00.000Z";
const SEED_DEVICE_ID = "werft-seed-v1";

export const projectIds = {
  flow: "project:flow",
  monoFocus: "project:monofocus",
  fitness: "project:fitness-tracker",
  safePlay: "project:safe-play",
  chronoAtlas: "project:chronoatlas",
} as const;

function meta(id: string, timestamp = SEED_OBSERVED_AT) {
  return {
    id,
    createdAt: timestamp,
    updatedAt: timestamp,
    revision: 1,
    deviceId: SEED_DEVICE_ID,
  };
}

function fact(
  key: string,
  label: string,
  value: string,
  sourceUrl: string,
  options?: Partial<Pick<ObservedFact, "source" | "inferred" | "pinned">>,
): ObservedFact {
  return {
    key,
    label,
    value,
    source: options?.source ?? "github",
    observedAt: SEED_OBSERVED_AT,
    sourceUrl,
    inferred: options?.inferred,
    pinned: options?.pinned,
  };
}

const github = (repository: string) =>
  `https://github.com/Budladislav/${repository}`;

export const seedProjects: Project[] = [
  {
    ...meta(projectIds.flow),
    slug: "flow",
    name: "Flow",
    repositoryName: "Budladislav/Flow",
    repositoryId: "seed:private-flow",
    repositoryVisibility: "private",
    summary:
      "KeepFlow — мобильный и desktop-трекер личных финансов, модулей быта, работы, покупок и транспорта.",
    startedAt: "2026-03-29T15:00:24.000Z",
    startedAtInferred: true,
    version: "11.33.0",
    latestReleaseAt: "2026-08-27T00:00:00.000Z",
    lastActivityAt: "2026-08-27T02:59:12.000Z",
    lifecycle: "active",
    availability: "working",
    attention: "due-soon",
    syncStatus: "fresh",
    lastSyncedAt: SEED_OBSERVED_AT,
    pinned: true,
    sortOrder: 1,
    accent: "#4f7cff",
    mark: "FL",
    iconUrl: "https://www.keepflow.cc/icon.png",
    stack: [
      "TypeScript",
      "Next.js 16",
      "React 19",
      "Supabase",
      "Tailwind CSS 4",
      "Vercel",
    ],
    capabilities: [
      "Финансы и аналитика",
      "Работа и переработки",
      "Покупки и поездки",
      "Транспорт и обслуживание",
      "PWA",
    ],
    links: [
      { label: "KeepFlow", href: "https://www.keepflow.cc", kind: "app" },
      { label: "GitHub", href: github("Flow"), kind: "repository" },
      { label: "Roadmap", href: `${github("Flow")}/blob/main/ROADMAP.md`, kind: "docs" },
    ],
    facts: [
      fact("defaultBranch", "Основная ветка", "main", github("Flow"), {
        pinned: true,
      }),
      fact(
        "repositoryCreatedAt",
        "Репозиторий создан",
        "29.03.2026",
        github("Flow"),
      ),
      fact(
        "versionSource",
        "Источник версии",
        "package.json",
        `${github("Flow")}/blob/main/package.json`,
        { source: "repository", pinned: true },
      ),
      fact(
        "changelogPath",
        "Changelog",
        "CHANGELOG.md",
        `${github("Flow")}/blob/main/CHANGELOG.md`,
        { source: "repository" },
      ),
      fact(
        "deployment",
        "Публикация",
        "Vercel · www.keepflow.cc",
        `${github("Flow")}/blob/main/next.config.ts`,
        { source: "repository" },
      ),
    ],
    dataProfile: {
      mode: "cloud",
      stores: ["Supabase PostgreSQL", "Supabase Auth", "локальный PWA-кеш"],
      sensitivity: "sensitive",
    },
    publicProfile: {
      enabled: false,
      slug: "flow",
      tagline: "Личные финансы как единый поток",
      shortDescription: "Финансы, работа и бытовые модули в одной PWA.",
      categories: ["finance", "productivity"],
      platforms: ["PWA", "Mobile", "Desktop"],
      highlights: ["Supabase", "Мультиязычность", "Финансовые отчёты"],
      appUrl: "https://www.keepflow.cc",
      showVersion: true,
      featured: true,
      sortOrder: 1,
    },
  },
  {
    ...meta(projectIds.monoFocus),
    slug: "monofocus",
    name: "MonoFocus",
    repositoryName: "Budladislav/Planer",
    repositoryId: "1126348935",
    repositoryVisibility: "public",
    summary:
      "Локальный офлайн-планер задач, событий, недель и месяцев с фокус-таймером и рабочими сменами.",
    startedAt: "2026-01-01T18:04:43.000Z",
    startedAtInferred: true,
    version: "3.1.0",
    latestReleaseAt: "2026-08-27T00:00:00.000Z",
    lastActivityAt: "2026-08-27T18:00:13.000Z",
    lifecycle: "active",
    availability: "working",
    attention: "overdue",
    syncStatus: "fresh",
    lastSyncedAt: SEED_OBSERVED_AT,
    pinned: true,
    sortOrder: 2,
    accent: "#7c6cf2",
    mark: "MF",
    iconUrl: "https://budladislav.github.io/Planer/icon-192.png",
    stack: [
      "TypeScript",
      "React 19",
      "Vite 6",
      "Tailwind CSS 3",
      "Vitest",
      "GitHub Pages",
    ],
    capabilities: [
      "Today и Focus",
      "Weekly и Month Plan",
      "Events и Inbox",
      "Рабочие смены",
      "JSON backup",
      "Offline PWA",
    ],
    links: [
      {
        label: "MonoFocus",
        href: "https://budladislav.github.io/Planer/",
        kind: "app",
      },
      { label: "GitHub", href: github("Planer"), kind: "repository" },
      {
        label: "Changelog",
        href: `${github("Planer")}/blob/main/CHANGELOG_MONOFOCUS.md`,
        kind: "docs",
      },
    ],
    facts: [
      fact("defaultBranch", "Основная ветка", "main", github("Planer"), {
        pinned: true,
      }),
      fact(
        "repositoryCreatedAt",
        "Репозиторий создан",
        "01.01.2026",
        github("Planer"),
      ),
      fact(
        "versionSource",
        "Источник версии",
        "package.json",
        `${github("Planer")}/blob/main/package.json`,
        { source: "repository", pinned: true },
      ),
      fact(
        "changelogPath",
        "Changelog",
        "CHANGELOG_MONOFOCUS.md",
        `${github("Planer")}/blob/main/CHANGELOG_MONOFOCUS.md`,
        { source: "repository" },
      ),
      fact(
        "primaryStore",
        "Основное хранилище",
        "localStorage · monofocus_v1",
        `${github("Planer")}/blob/main/README.md`,
        { source: "repository" },
      ),
    ],
    dataProfile: {
      mode: "local-only",
      stores: ["localStorage · monofocus_v1", "JSON backup"],
      sensitivity: "private",
    },
    publicProfile: {
      enabled: false,
      slug: "monofocus",
      tagline: "Один фокус на сегодня",
      shortDescription: "Локальный планер задач, событий, недель и месяцев.",
      categories: ["productivity", "planning"],
      platforms: ["PWA", "Mobile", "Desktop"],
      highlights: ["Local-first", "Offline", "Фокус-таймер"],
      appUrl: "https://budladislav.github.io/Planer/",
      repositoryUrl: github("Planer"),
      showVersion: true,
      featured: false,
      sortOrder: 2,
    },
  },
  {
    ...meta(projectIds.fitness),
    slug: "fitness-tracker",
    name: "Fitness Tracker",
    repositoryName: "Budladislav/fitness-tracker",
    repositoryId: "913005357",
    repositoryVisibility: "public",
    summary:
      "Трекер тренировок, пресетов, упражнений и прогресса с локальным режимом и опциональным Firebase.",
    startedAt: "2025-01-06T20:52:24.000Z",
    startedAtInferred: true,
    version: "3.0.7",
    latestReleaseAt: "2026-04-06T00:00:00.000Z",
    lastActivityAt: "2026-04-05T07:04:35.000Z",
    lifecycle: "maintenance",
    availability: "working",
    attention: "overdue",
    syncStatus: "fresh",
    lastSyncedAt: SEED_OBSERVED_AT,
    pinned: false,
    sortOrder: 3,
    accent: "#24a878",
    mark: "FT",
    iconUrl:
      "https://budladislav.github.io/fitness-tracker/icons/android-chrome-192x192.png",
    stack: ["JavaScript", "Vite 5", "Firebase Auth", "Firestore", "PWA"],
    capabilities: [
      "Тренировки и упражнения",
      "Пресеты",
      "Прогресс и рекорды",
      "Локальное или Firebase-хранилище",
      "Текстовый backup v3",
    ],
    links: [
      {
        label: "Fitness Tracker",
        href: "https://budladislav.github.io/fitness-tracker/",
        kind: "app",
      },
      {
        label: "GitHub",
        href: github("fitness-tracker"),
        kind: "repository",
      },
      {
        label: "Changelog",
        href: `${github("fitness-tracker")}/blob/main/CHANGELOG.md`,
        kind: "docs",
      },
    ],
    facts: [
      fact(
        "defaultBranch",
        "Основная ветка",
        "main",
        github("fitness-tracker"),
        { pinned: true },
      ),
      fact(
        "repositoryCreatedAt",
        "Репозиторий создан",
        "06.01.2025",
        github("fitness-tracker"),
      ),
      fact(
        "versionSource",
        "Версия package.json",
        "3.0.7",
        `${github("fitness-tracker")}/blob/main/package.json`,
        { source: "repository", pinned: true },
      ),
      fact(
        "changelogVersion",
        "Последняя версия changelog",
        "3.0.6",
        `${github("fitness-tracker")}/blob/main/CHANGELOG.md`,
        { source: "repository" },
      ),
      fact(
        "storageModes",
        "Хранилища",
        "Локально или Firebase/Firestore",
        `${github("fitness-tracker")}/blob/main/README.md`,
        { source: "repository" },
      ),
    ],
    dataProfile: {
      mode: "hybrid",
      stores: ["браузерное хранилище", "Firebase Auth", "Firestore"],
      sensitivity: "sensitive",
    },
    publicProfile: {
      enabled: false,
      slug: "fitness-tracker",
      tagline: "Тренировки и прогресс без лишнего шума",
      shortDescription: "История тренировок, пресеты и аналитика прогресса.",
      categories: ["fitness", "health"],
      platforms: ["PWA", "Mobile", "Desktop"],
      highlights: ["Пресеты", "Графики", "Firebase optional"],
      appUrl: "https://budladislav.github.io/fitness-tracker/",
      repositoryUrl: github("fitness-tracker"),
      showVersion: true,
      featured: false,
      sortOrder: 3,
    },
  },
  {
    ...meta(projectIds.safePlay),
    slug: "safe-play",
    name: "Safe Play",
    repositoryName: "Budladislav/safe-play",
    repositoryId: "1306773540",
    repositoryVisibility: "public",
    summary:
      "Локальная офлайн-PWA для осознанного гейминга, контроля сессий, библиотеки игр и личной статистики.",
    startedAt: "2026-07-20T15:54:23.000Z",
    startedAtInferred: true,
    version: "2.4.1",
    latestReleaseAt: "2026-08-09T00:00:00.000Z",
    lastActivityAt: "2026-08-09T06:27:07.000Z",
    lifecycle: "active",
    availability: "working",
    attention: "due-soon",
    syncStatus: "fresh",
    lastSyncedAt: SEED_OBSERVED_AT,
    pinned: false,
    sortOrder: 4,
    accent: "#ee7c55",
    mark: "SP",
    iconUrl: "https://budladislav.github.io/safe-play/assets/icon-192.png",
    stack: ["JavaScript", "HTML", "CSS", "IndexedDB", "GitHub Pages"],
    capabilities: [
      "Контроль игровых сессий",
      "Библиотека игр",
      "История и тепловая карта",
      "Локальные обложки",
      "Полный JSON backup",
      "Offline PWA",
    ],
    links: [
      {
        label: "Safe Play",
        href: "https://budladislav.github.io/safe-play/",
        kind: "app",
      },
      { label: "GitHub", href: github("safe-play"), kind: "repository" },
      {
        label: "Changelog",
        href: `${github("safe-play")}/blob/main/CHANGELOG.md`,
        kind: "docs",
      },
    ],
    facts: [
      fact("defaultBranch", "Основная ветка", "main", github("safe-play"), {
        pinned: true,
      }),
      fact(
        "repositoryCreatedAt",
        "Репозиторий создан",
        "20.07.2026",
        github("safe-play"),
      ),
      fact(
        "versionSource",
        "Источник версии",
        "package.json",
        `${github("safe-play")}/blob/main/package.json`,
        { source: "repository", pinned: true },
      ),
      fact(
        "primaryStore",
        "Основные данные",
        "localStorage · safe-play:v2 · schema 6",
        `${github("safe-play")}/blob/main/README.md`,
        { source: "repository" },
      ),
      fact(
        "coverStore",
        "Обложки",
        "IndexedDB",
        `${github("safe-play")}/blob/main/README.md`,
        { source: "repository" },
      ),
    ],
    dataProfile: {
      mode: "local-only",
      stores: ["localStorage · safe-play:v2", "IndexedDB · обложки", "JSON backup"],
      sensitivity: "private",
    },
    publicProfile: {
      enabled: false,
      slug: "safe-play",
      tagline: "Играть осознанно и вовремя останавливаться",
      shortDescription: "Локальный помощник для управляемых игровых сессий.",
      categories: ["wellbeing", "gaming"],
      platforms: ["PWA", "Mobile", "Desktop"],
      highlights: ["Local-first", "Offline", "Игровая статистика"],
      appUrl: "https://budladislav.github.io/safe-play/",
      repositoryUrl: github("safe-play"),
      showVersion: true,
      featured: false,
      sortOrder: 4,
    },
  },
  {
    ...meta(projectIds.chronoAtlas),
    slug: "chronoatlas",
    name: "ChronoAtlas",
    repositoryName: "Budladislav/ChronoAtlas",
    repositoryId: "1336083790",
    repositoryVisibility: "public",
    summary:
      "Приватный desktop-first атлас периодов и событий жизни на общей временной шкале.",
    startedAt: "2026-08-16T15:35:40.000Z",
    startedAtInferred: true,
    version: "0.2.0",
    latestReleaseAt: "2026-08-17T00:00:00.000Z",
    lastActivityAt: "2026-08-17T07:47:45.000Z",
    lifecycle: "active",
    availability: "working",
    attention: "due-soon",
    syncStatus: "fresh",
    lastSyncedAt: SEED_OBSERVED_AT,
    pinned: false,
    sortOrder: 5,
    accent: "#b77cdb",
    mark: "CA",
    iconUrl: "https://budladislav.github.io/ChronoAtlas/icon-192.svg",
    stack: [
      "TypeScript",
      "React 19",
      "Vite 8",
      "Dexie 4",
      "Zustand",
      "Playwright",
      "GitHub Pages",
    ],
    capabilities: [
      "Карта жизни",
      "Периоды и моменты",
      "Масштабы времени",
      "IndexedDB",
      "Транзакционный JSON backup",
      "Offline PWA",
    ],
    links: [
      {
        label: "ChronoAtlas",
        href: "https://budladislav.github.io/ChronoAtlas/",
        kind: "app",
      },
      { label: "GitHub", href: github("ChronoAtlas"), kind: "repository" },
      {
        label: "Product spec",
        href: `${github("ChronoAtlas")}/blob/main/docs/PRODUCT_SPEC.md`,
        kind: "docs",
      },
    ],
    facts: [
      fact(
        "defaultBranch",
        "Основная ветка",
        "main",
        github("ChronoAtlas"),
        { pinned: true },
      ),
      fact(
        "repositoryCreatedAt",
        "Репозиторий создан",
        "16.08.2026",
        github("ChronoAtlas"),
      ),
      fact(
        "versionSource",
        "Источник версии",
        "package.json",
        `${github("ChronoAtlas")}/blob/main/package.json`,
        { source: "repository", pinned: true },
      ),
      fact(
        "primaryStore",
        "Основное хранилище",
        "IndexedDB · Dexie",
        `${github("ChronoAtlas")}/blob/main/README.md`,
        { source: "repository" },
      ),
      fact(
        "restore",
        "Восстановление",
        "Транзакционный JSON import",
        `${github("ChronoAtlas")}/blob/main/README.md`,
        { source: "repository" },
      ),
    ],
    dataProfile: {
      mode: "local-only",
      stores: ["IndexedDB · Dexie", "JSON backup"],
      sensitivity: "sensitive",
    },
    publicProfile: {
      enabled: false,
      slug: "chronoatlas",
      tagline: "Личный атлас времени",
      shortDescription: "Периоды и события жизни на единой временной шкале.",
      categories: ["life", "timeline"],
      platforms: ["PWA", "Desktop", "Mobile"],
      highlights: ["IndexedDB", "Приватность", "Временная шкала"],
      appUrl: "https://budladislav.github.io/ChronoAtlas/",
      repositoryUrl: github("ChronoAtlas"),
      showVersion: true,
      featured: false,
      sortOrder: 5,
    },
  },
];

function release(
  projectId: string,
  version: string,
  releasedAt: string,
  title: string,
  changelogUrl: string,
  entries: ProjectRelease["entries"],
): ProjectRelease {
  return {
    ...meta(`release:${projectId}:${version}`, releasedAt),
    projectId,
    version,
    releasedAt,
    title,
    source: "changelog",
    sourceUrl: changelogUrl,
    entries,
  };
}

export const seedReleases: ProjectRelease[] = [
  release(
    projectIds.flow,
    "11.33.0",
    "2026-08-27T00:00:00.000Z",
    "Обновление надёжности запуска",
    `${github("Flow")}/blob/main/CHANGELOG.md`,
    [
      {
        id: "flow-11.33.0-startup",
        category: "changed",
        text: "Повышены скорость и надёжность клиентского запуска.",
      },
      {
        id: "flow-11.33.0-session",
        category: "changed",
        text: "Снижено дублирование клиентских подключений.",
      },
      {
        id: "flow-11.33.0-diagnostics",
        category: "changed",
        text: "Расширена диагностика производительности запуска.",
      },
    ],
  ),
  release(
    projectIds.flow,
    "11.32.0",
    "2026-08-16T00:00:00.000Z",
    "Оптимизация холодного старта",
    `${github("Flow")}/blob/main/CHANGELOG.md`,
    [
      {
        id: "flow-11.32.0-startup",
        category: "changed",
        text: "Сокращено время до готовности основного экрана.",
      },
    ],
  ),
  release(
    projectIds.monoFocus,
    "3.1.0",
    "2026-08-27T00:00:00.000Z",
    "Today, заметки недель и календарь Events",
    `${github("Planer")}/blob/main/CHANGELOG_MONOFOCUS.md`,
    [
      {
        id: "monofocus-3.1.0-today",
        category: "added",
        text: "Today получил сохраняемый список выполненных задач и действие Done yesterday.",
      },
      {
        id: "monofocus-3.1.0-weeks",
        category: "added",
        text: "Добавлены произвольные пометки ISO-недель и календарь Events.",
      },
      {
        id: "monofocus-3.1.0-schema",
        category: "changed",
        text: "Локальная схема обновлена до версии 4, новые данные включены в backup/import.",
      },
    ],
  ),
  release(
    projectIds.monoFocus,
    "3.0.0",
    "2026-08-16T00:00:00.000Z",
    "Month Plan и единая сущность задачи",
    `${github("Planer")}/blob/main/CHANGELOG_MONOFOCUS.md`,
    [
      {
        id: "monofocus-3.0.0-month",
        category: "added",
        text: "Добавлен Month Plan и drag-and-drop между месяцем, неделями и днями.",
      },
      {
        id: "monofocus-3.0.0-shifts",
        category: "added",
        text: "Добавлены чередующиеся рабочие смены и исключения.",
      },
    ],
  ),
  release(
    projectIds.fitness,
    "3.0.6",
    "2026-04-06T00:00:00.000Z",
    "Защита истории Firebase",
    `${github("fitness-tracker")}/blob/main/CHANGELOG.md`,
    [
      {
        id: "fitness-3.0.6-save",
        category: "fixed",
        text: "История Firebase обновляется до удаления лишних документов и не обнуляется при сбое записи.",
      },
      {
        id: "fitness-3.0.6-empty",
        category: "fixed",
        text: "Пустой массив не может случайно сбросить уже сохранённые тренировки.",
      },
    ],
  ),
  release(
    projectIds.fitness,
    "3.0.5",
    "2026-04-06T00:00:00.000Z",
    "Стабилизация упражнений и статистики",
    `${github("fitness-tracker")}/blob/main/CHANGELOG.md`,
    [
      {
        id: "fitness-3.0.5-statistics",
        category: "fixed",
        text: "Переименованные упражнения больше не дублируются в статистике.",
      },
    ],
  ),
  release(
    projectIds.safePlay,
    "2.4.1",
    "2026-08-09T00:00:00.000Z",
    "Редактор завершённых сессий",
    `${github("safe-play")}/blob/main/CHANGELOG.md`,
    [
      {
        id: "safe-play-2.4.1-order",
        category: "changed",
        text: "Последняя сыгранная активная игра выбирается первой по умолчанию.",
      },
      {
        id: "safe-play-2.4.1-editor",
        category: "fixed",
        text: "Редактор синхронно пересчитывает фактическое время, паузы и распределение по играм.",
      },
    ],
  ),
  release(
    projectIds.safePlay,
    "2.4.0",
    "2026-07-26T00:00:00.000Z",
    "Расширенная библиотека игр и duo-сессии",
    `${github("safe-play")}/blob/main/CHANGELOG.md`,
    [
      {
        id: "safe-play-2.4.0-library",
        category: "added",
        text: "Библиотека получила архив, статусы, устройства, годы выпуска и локальные обложки.",
      },
      {
        id: "safe-play-2.4.0-duo",
        category: "added",
        text: "Добавлен отдельный тип совместной игровой сессии.",
      },
    ],
  ),
  release(
    projectIds.chronoAtlas,
    "0.2.0",
    "2026-08-17T00:00:00.000Z",
    "Навигация по течению времени",
    `${github("ChronoAtlas")}/blob/main/CHANGELOG.md`,
    [
      {
        id: "chronoatlas-0.2.0-focus",
        category: "fixed",
        text: "Фокус при создании записи больше не перескакивает на кнопку закрытия.",
      },
      {
        id: "chronoatlas-0.2.0-scales",
        category: "added",
        text: "Добавлены быстрые масштабы от квартала до десяти лет.",
      },
    ],
  ),
  release(
    projectIds.chronoAtlas,
    "0.1.0",
    "2026-08-16T00:00:00.000Z",
    "Первый рабочий MVP",
    `${github("ChronoAtlas")}/blob/main/CHANGELOG.md`,
    [
      {
        id: "chronoatlas-0.1.0-mvp",
        category: "added",
        text: "Карта жизни, периоды, моменты, фильтры, масштабирование и экран Течение.",
      },
      {
        id: "chronoatlas-0.1.0-local",
        category: "added",
        text: "IndexedDB, JSON backup, безопасное восстановление и offline PWA.",
      },
    ],
  ),
];

export const seedBackupPolicies: BackupPolicy[] = [
  {
    ...meta("backup-policy:flow"),
    projectId: projectIds.flow,
    mode: "excluded",
    sensitivity: "sensitive",
    status: "excluded",
    reason:
      "Flow исключён до отдельного цикла шифрования и атомарного восстановления финансовых данных.",
    format: "flow-json-v1",
  },
  {
    ...meta("backup-policy:monofocus"),
    projectId: projectIds.monoFocus,
    priority: 1,
    mode: "manual-file",
    sensitivity: "private",
    cadenceDays: 7,
    nextDueAt: "2026-08-28T00:00:00.000Z",
    status: "not-configured",
    reason: "JSON export есть в Settings, адаптер Верфи ещё не подключён.",
    format: "monofocus-json-schema-4",
  },
  {
    ...meta("backup-policy:fitness"),
    projectId: projectIds.fitness,
    priority: 2,
    mode: "manual-file",
    sensitivity: "sensitive",
    cadenceDays: 7,
    nextDueAt: "2026-08-28T00:00:00.000Z",
    status: "not-configured",
    reason:
      "Текстовый backup v3 переносит историю и каталог, но адаптер и централизованное шифрование не настроены.",
    format: "fitness-text-v3",
  },
  {
    ...meta("backup-policy:safe-play"),
    projectId: projectIds.safePlay,
    priority: 3,
    mode: "manual-file",
    sensitivity: "private",
    cadenceDays: 14,
    nextDueAt: "2026-08-28T00:00:00.000Z",
    status: "not-configured",
    reason: "Полный JSON export есть, браузерный адаптер Верфи ещё не подключён.",
    format: "safe-play-json-schema-6",
  },
  {
    ...meta("backup-policy:chronoatlas"),
    projectId: projectIds.chronoAtlas,
    priority: 4,
    mode: "manual-file",
    sensitivity: "sensitive",
    cadenceDays: 7,
    nextDueAt: "2026-08-28T00:00:00.000Z",
    status: "not-configured",
    reason:
      "Транзакционный JSON export готов, но файл пока создаётся вручную и хранится без шифрования.",
    format: "chronoatlas-json",
  },
];

export const seedMaintenanceRules: MaintenanceRule[] = [
  {
    ...meta("maintenance:flow:backup-excluded"),
    projectId: projectIds.flow,
    title: "Flow: отдельный контур резервного копирования",
    description:
      "Не включать финансовые JSON-файлы в общий поток до шифрования и безопасного restore drill.",
    kind: "backup",
    dueAt: "2026-10-01T00:00:00.000Z",
    status: "excluded",
    evidence: "Flow backup policy explicitly excluded in Werft MVP.",
  },
  ...seedBackupPolicies
    .filter((policy) => policy.mode !== "excluded")
    .map<MaintenanceRule>((policy) => {
      const project = seedProjects.find((item) => item.id === policy.projectId);
      return {
        ...meta(`maintenance:${policy.projectId}:backup`),
        projectId: policy.projectId,
        title: `${project?.name ?? "Проект"}: настроить регулярный backup`,
        description:
          "Создать свежую копию данных и подключить проверяемый адаптер Верфи.",
        kind: "backup",
        cadenceDays: policy.cadenceDays,
        dueAt: policy.nextDueAt ?? "2026-08-28T00:00:00.000Z",
        status: "due",
        evidence: policy.reason,
      };
    }),
  {
    ...meta("maintenance:flow:atomic-restore"),
    projectId: projectIds.flow,
    title: "Подтвердить атомарность восстановления Flow",
    description:
      "Провести закрытый restore drill и зафиксировать проверяемые гарантии целостности.",
    kind: "quality",
    dueAt: "2026-09-30T00:00:00.000Z",
    status: "upcoming",
    evidence: "Внутренняя проверка restore-контракта требуется до подключения адаптера.",
  },
  {
    ...meta("maintenance:fitness:version-drift"),
    projectId: projectIds.fitness,
    title: "Синхронизировать версию Fitness Tracker",
    description:
      "package.json содержит 3.0.7, а последняя запись корневого changelog — 3.0.6.",
    kind: "release",
    dueAt: "2026-08-28T00:00:00.000Z",
    status: "due",
    evidence: "package.json и CHANGELOG.md",
  },
  {
    ...meta("maintenance:monofocus:release-contract"),
    projectId: projectIds.monoFocus,
    title: "Унифицировать release contract MonoFocus",
    description:
      "Перенести changelog к общему имени и включить production build в единую команду check.",
    kind: "quality",
    dueAt: "2026-09-15T00:00:00.000Z",
    status: "upcoming",
    evidence: "CHANGELOG_MONOFOCUS.md и package.json",
  },
];

export const seedIdeas: FutureIdea[] = [
  {
    ...meta("idea:public-showcase"),
    title: "Публичная витрина проектов",
    summary:
      "Отдельная очищенная проекция только явно разрешённых полей публичных проектов.",
    stage: "research",
    nextAction: "Утвердить whitelist полей и preview перед публикацией.",
    tags: ["public", "portfolio", "privacy"],
    target: "ecosystem",
  },
  {
    ...meta("idea:device-sync"),
    title: "Синхронизация Верфи между устройствами",
    summary:
      "Добавить простой серверный sync поверх local-first outbox, сохранив device-local настройки локальными.",
    stage: "research",
    nextAction: "Спроектировать Supabase schema, cursors, tombstones и conflict policy.",
    tags: ["sync", "supabase", "local-first"],
    target: "ecosystem",
  },
  {
    ...meta("idea:android-widget-twa"),
    title: "Android widget и TWA",
    summary:
      "Исследовать быстрый обзор просрочек и backup-сигналов через Trusted Web Activity и нативный widget.",
    stage: "draft",
    nextAction: "Проверить ограничения WebAPK/TWA и минимальный Android bridge.",
    tags: ["android", "widget", "twa", "mobile"],
    target: "ecosystem",
  },
  {
    ...meta("idea:project-adapters"),
    title: "Стандарт адаптеров Верфи",
    summary:
      "Единый контракт для GitHub facts, changelog, browser backup и remote workflow adapters.",
    stage: "planned",
    nextAction: "Зафиксировать capability manifest и начать с MonoFocus adapter.",
    tags: ["adapters", "automation", "backup", "github"],
    target: "ecosystem",
  },
];

type AssessmentSpec = {
  result: QualityResult;
  evidence: string;
  source?: QualityAssessment["source"];
  remediation?: string;
};

const assessments: Record<string, Record<string, AssessmentSpec>> = {
  [projectIds.flow]: {
    "release.single-version-source": {
      result: "verified",
      evidence: "package.json — canonical; release:check сверяет changelog, UI history и SW cache.",
    },
    "release.canonical-changelog": {
      result: "warning",
      evidence: "Root CHANGELOG.md структурирован, но release-history.ts поддерживается отдельно.",
      remediation: "Генерировать UI history из канонического changelog.",
    },
    "quality.check-command": {
      result: "verified",
      evidence: "npm run check включает release/i18n/UI/perf checks, typecheck, lint, tests и build.",
    },
    "quality.ci-before-deploy": {
      result: "unknown",
      evidence: "GitHub CI успешен; блокировка Vercel deploy до CI не подтверждена.",
      source: "github",
      remediation: "Проверить deployment protection/gating в Vercel.",
    },
    "pwa.installable-shell": {
      result: "verified",
      evidence: "Manifest и custom service worker; персонализированный HTML исключён из cache.",
    },
    "data.classification": {
      result: "verified",
      evidence: "Supabase/Postgres — источник истины; финансовые данные классифицированы sensitive.",
    },
    "backup.versioned-export": {
      result: "verified",
      evidence: "Flow JSON formatVersion 1 содержит appVersion и exportedAt.",
    },
    "backup.atomic-restore": {
      result: "action-required",
      evidence: "Атомарность полного восстановления ещё не подтверждена публичным контрактом.",
      remediation: "Провести внутренний restore drill и зафиксировать транзакционные гарантии.",
    },
    "security.private-data-boundary": {
      result: "verified",
      evidence: "Private repo, Supabase RLS и запрет кеширования персонализированного HTML.",
    },
  },
  [projectIds.monoFocus]: {
    "release.single-version-source": {
      result: "warning",
      evidence: "package.json и changelog показывают 3.1.0; автоматическая проверка зеркал не подтверждена.",
      remediation: "Добавить release check.",
    },
    "release.canonical-changelog": {
      result: "warning",
      evidence: "История находится в CHANGELOG_MONOFOCUS.md и использует DD.MM.YYYY.",
      remediation: "Перейти на корневой CHANGELOG.md; формат даты уже соответствует стандарту.",
    },
    "quality.check-command": {
      result: "action-required",
      evidence: "check включает typecheck/lint/tests, но production build запускается отдельно.",
      remediation: "Добавить npm run build в check.",
    },
    "quality.ci-before-deploy": {
      result: "verified",
      evidence: "README фиксирует check, build и публикацию Pages при push в main.",
      source: "repository",
    },
    "pwa.installable-shell": {
      result: "verified",
      evidence: "README и changelog подтверждают offline PWA без CDN-зависимостей.",
    },
    "data.classification": {
      result: "verified",
      evidence: "Источник истины: localStorage monofocus_v1; сервер отсутствует.",
    },
    "backup.versioned-export": {
      result: "warning",
      evidence: "JSON backup мигрирует schema 4; полный envelope metadata не проверен.",
      remediation: "Проверить appVersion/schemaVersion/exportedAt в файле.",
    },
    "backup.atomic-restore": {
      result: "unknown",
      evidence: "README заявляет безопасную миграцию, атомарность restore не подтверждена аудитом.",
    },
    "security.private-data-boundary": {
      result: "verified",
      evidence: "Пользовательские данные остаются в браузере; public repo не содержит backup-файлов.",
    },
  },
  [projectIds.fitness]: {
    "release.single-version-source": {
      result: "action-required",
      evidence: "package.json = 3.0.7, latest CHANGELOG.md entry = 3.0.6.",
      remediation: "Синхронизировать версию и добавить release check.",
    },
    "release.canonical-changelog": {
      result: "verified",
      evidence: "Root CHANGELOG.md содержит version headings и ISO dates.",
    },
    "quality.check-command": {
      result: "action-required",
      evidence: "package.json содержит только dev/build/preview, единой проверки нет.",
      remediation: "Добавить typecheck/lint/tests/build в check.",
    },
    "quality.ci-before-deploy": {
      result: "unknown",
      evidence: "GitHub Pages включён, но release gate не проверен.",
      source: "github",
    },
    "pwa.installable-shell": {
      result: "verified",
      evidence: "vite-plugin-pwa и GitHub Pages deployment присутствуют.",
    },
    "data.classification": {
      result: "verified",
      evidence: "README описывает local mode и optional Firebase Auth/Firestore.",
    },
    "backup.versioned-export": {
      result: "warning",
      evidence: "Текстовый backup v3 переносит каталог и историю; checksum/envelope не подтверждены.",
    },
    "backup.atomic-restore": {
      result: "unknown",
      evidence: "Защита Firebase save улучшена в 3.0.6, полный restore path не проверен.",
    },
    "security.private-data-boundary": {
      result: "unknown",
      evidence: "Firebase boundary требует отдельной проверки rules и deployed config.",
    },
  },
  [projectIds.safePlay]: {
    "release.single-version-source": {
      result: "verified",
      evidence: "package.json и latest changelog синхронны на 2.4.1.",
    },
    "release.canonical-changelog": {
      result: "verified",
      evidence: "Root CHANGELOG.md содержит версии и ISO dates.",
    },
    "quality.check-command": {
      result: "action-required",
      evidence: "check выполняет syntax checks, а node tests запускаются отдельной командой.",
      remediation: "Включить npm test и production validation в check.",
    },
    "quality.ci-before-deploy": {
      result: "verified",
      evidence: "main публикуется через GitHub Pages после репозиторного release workflow.",
      source: "repository",
    },
    "pwa.installable-shell": {
      result: "verified",
      evidence: "Offline PWA, versioned assets и mobile acceptance подтверждены changelog/README.",
    },
    "data.classification": {
      result: "verified",
      evidence: "localStorage safe-play:v2 + IndexedDB covers; backend отсутствует.",
    },
    "backup.versioned-export": {
      result: "verified",
      evidence: "Полный JSON backup включает schema 6 и оптимизированные обложки.",
    },
    "backup.atomic-restore": {
      result: "unknown",
      evidence: "Полнота restore проверяется тестами, атомарность хранилищ не подтверждена.",
    },
    "security.private-data-boundary": {
      result: "verified",
      evidence: "Данные остаются в браузере и попадают наружу только через явный export.",
    },
  },
  [projectIds.chronoAtlas]: {
    "release.single-version-source": {
      result: "verified",
      evidence: "package.json и встроенная версия согласованы на 0.2.0.",
    },
    "release.canonical-changelog": {
      result: "verified",
      evidence: "Root CHANGELOG.md содержит версии и ISO dates.",
    },
    "quality.check-command": {
      result: "verified",
      evidence: "check объединяет lint, typecheck, Vitest и production build.",
    },
    "quality.ci-before-deploy": {
      result: "verified",
      evidence: "GitHub Actions проверяет main и публикует статический артефакт Pages.",
      source: "repository",
    },
    "pwa.installable-shell": {
      result: "verified",
      evidence: "vite-plugin-pwa, offline shell и responsive режим описаны в acceptance.",
    },
    "data.classification": {
      result: "verified",
      evidence: "IndexedDB текущего origin — единственный источник истины; данные sensitive.",
    },
    "backup.versioned-export": {
      result: "verified",
      evidence: "JSON export/import покрыт тестами и документирован как полный backup.",
    },
    "backup.atomic-restore": {
      result: "verified",
      evidence: "README и acceptance фиксируют транзакционное безопасное восстановление.",
    },
    "security.private-data-boundary": {
      result: "verified",
      evidence: "Нет аккаунта/сервера; README предупреждает о plaintext sensitive backup.",
    },
  },
};

export const seedQualityAssessments: QualityAssessment[] = seedProjects.flatMap(
  (project) =>
    standardControls.map((control) => {
      const assessment = assessments[project.id]?.[control.id] ?? {
        result: "unknown" as const,
        evidence: "Контроль ещё не проверен.",
      };
      return {
        ...meta(`quality:${project.id}:${control.id}`),
        projectId: project.id,
        standardVersion: WERFT_STANDARD_VERSION,
        controlId: control.id,
        result: assessment.result,
        evidence: assessment.evidence,
        source: assessment.source ?? "repository",
        remediation: assessment.remediation,
        checkedAt: SEED_OBSERVED_AT,
      };
    }),
);

export const seedSyncEvents: SyncEvent[] = seedProjects.map((project) => ({
  ...meta(`sync:${project.id}:github-audit`),
  projectId: project.id,
  provider: "github",
  direction: "pull",
  status: "success",
  summary: `GitHub-аудит ${project.repositoryName}`,
  occurredAt: SEED_OBSERVED_AT,
  details: "Read-only metadata and repository files snapshot.",
}));

export const seedSettings: AppSetting[] = [
  {
    ...meta("setting:device:startPage"),
    key: "startPage",
    value: "overview",
    scope: "device",
  },
];

async function addMissingById<T extends { id: string }>(
  table: EntityTable<T, "id">,
  rows: T[],
) {
  if (rows.length === 0) return;
  const existing = new Set<unknown>(await table.toCollection().primaryKeys());
  const missing = rows.filter((row) => !existing.has(row.id));
  if (missing.length > 0) await table.bulkAdd(missing);
}

export async function ensureSeeded(database: WerftDatabase = werftDb) {
  await database.transaction("rw", contentTables(database), async () => {
    await addMissingById(database.projects, seedProjects);
    await addMissingById(database.releases, seedReleases);
    await addMissingById(database.ideas, seedIdeas);
    await addMissingById(database.maintenanceRules, seedMaintenanceRules);
    await addMissingById(database.backupPolicies, seedBackupPolicies);
    await addMissingById(
      database.qualityAssessments,
      seedQualityAssessments,
    );
    await addMissingById(database.syncEvents, seedSyncEvents);
    await addMissingById(database.settings, seedSettings);
  });
}
