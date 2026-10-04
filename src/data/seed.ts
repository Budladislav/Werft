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
const DIARY_SEED_AT = "2026-09-12T18:00:00.000Z";
const UTILITIES_SEED_AT = "2026-09-13T10:26:07.000Z";
const ASHROAD_SEED_AT = "2026-10-03T02:35:30.000Z";
const SEED_DEVICE_ID = "werft-seed-v1";

export const projectIds = {
  flow: "project:flow",
  monoFocus: "project:monofocus",
  fitness: "project:fitness-tracker",
  safePlay: "project:safe-play",
  chronoAtlas: "project:chronoatlas",
  diary: "project:nit",
  utilities: "project:utilities",
  ashroad: "project:ashroad",
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
  options?: Partial<Pick<ObservedFact, "source" | "inferred" | "pinned">> & {
    observedAt?: string;
  },
): ObservedFact {
  return {
    key,
    label,
    value,
    source: options?.source ?? "github",
    observedAt: options?.observedAt ?? SEED_OBSERVED_AT,
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
    name: "Takt",
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
        label: "Takt",
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
  {
    ...meta(projectIds.diary, DIARY_SEED_AT),
    slug: "nit",
    name: "Нить",
    repositoryName: "Budladislav/Diary",
    repositoryId: "seed:private-diary",
    repositoryVisibility: "private",
    summary:
      "Приватный PWA-дневник с одной записью на день, быстрым локальным редактированием и подготовкой к защищённой серверной синхронизации.",
    startedAt: "2026-09-09T16:51:49.000Z",
    startedAtInferred: false,
    version: "0.1.0-dev.3",
    latestReleaseAt: "2026-09-12T18:00:00.000Z",
    lastActivityAt: "2026-09-12T18:00:00.000Z",
    lifecycle: "active",
    availability: "working",
    attention: "due-soon",
    syncStatus: "manual",
    lastSyncedAt: DIARY_SEED_AT,
    pinned: false,
    sortOrder: 6,
    accent: "#586b98",
    mark: "Н",
    iconUrl: "/project-icons/nit.svg",
    stack: [
      "TypeScript",
      "Next.js 16",
      "React 19",
      "Dexie",
      "IndexedDB",
      "Vitest",
      "PWA",
    ],
    capabilities: [
      "Лента дневника по дням",
      "Сплошной текст месяца",
      "Локальное редактирование и история",
      "Поиск и выгрузка диапазонов",
      "Предпросмотр импорта Google Keep",
      "Offline PWA",
    ],
    links: [
      { label: "GitHub", href: github("Diary"), kind: "repository" },
      {
        label: "Changelog",
        href: `${github("Diary")}/blob/main/CHANGELOG.md`,
        kind: "docs",
      },
    ],
    facts: [
      fact("defaultBranch", "Основная ветка", "main", github("Diary"), {
        pinned: true,
        observedAt: DIARY_SEED_AT,
      }),
      fact(
        "versionSource",
        "Источник версии",
        "package.json",
        `${github("Diary")}/blob/main/package.json`,
        { source: "repository", pinned: true, observedAt: DIARY_SEED_AT },
      ),
      fact(
        "changelogPath",
        "Changelog",
        "CHANGELOG.md",
        `${github("Diary")}/blob/main/CHANGELOG.md`,
        { source: "repository", observedAt: DIARY_SEED_AT },
      ),
      fact(
        "primaryStore",
        "Хранилище прототипа",
        "IndexedDB · nit-diary-demo-v1",
        `${github("Diary")}/blob/main/README.md`,
        { source: "repository", observedAt: DIARY_SEED_AT },
      ),
    ],
    dataProfile: {
      mode: "local-only",
      stores: ["IndexedDB · nit-diary-demo-v1"],
      sensitivity: "sensitive",
    },
    publicProfile: {
      enabled: false,
      slug: "nit",
      tagline: "Дни складываются в одну нить",
      shortDescription: "Личный дневник по дням с быстрым локальным вводом.",
      categories: ["journal", "life", "productivity"],
      platforms: ["PWA", "Android", "Desktop"],
      highlights: ["Local-first", "IndexedDB", "Приватность"],
      repositoryUrl: github("Diary"),
      showVersion: true,
      featured: false,
      sortOrder: 6,
    },
  },
  {
    ...meta(projectIds.utilities, UTILITIES_SEED_AT),
    slug: "utilities",
    name: "Коммунальные",
    repositoryName: "Budladislav/Utilities",
    repositoryId: "seed:public-utilities",
    repositoryVisibility: "public",
    summary:
      "Лёгкое local-first приложение для домашних счётчиков, показаний, расхода и переносимых резервных копий без сервера и PWA.",
    startedAt: UTILITIES_SEED_AT,
    startedAtInferred: false,
    version: "0.1.0",
    latestReleaseAt: UTILITIES_SEED_AT,
    lastActivityAt: UTILITIES_SEED_AT,
    lifecycle: "active",
    availability: "working",
    attention: "due-soon",
    syncStatus: "manual",
    lastSyncedAt: UTILITIES_SEED_AT,
    pinned: false,
    sortOrder: 7,
    accent: "#176b5c",
    mark: "КУ",
    iconUrl: "/project-icons/utilities.svg",
    stack: [
      "TypeScript",
      "React 19",
      "Vite 8",
      "Dexie 4",
      "Decimal.js",
      "GitHub Pages",
    ],
    capabilities: [
      "Счётчики и история показаний",
      "Расход и помесячная оценка",
      "Локальная IndexedDB",
      "Версионированный JSON backup",
      "Импорт Flow (экспериментально)",
      "Mobile и Desktop",
    ],
    links: [
      {
        label: "Коммунальные",
        href: "https://budladislav.github.io/Utilities/",
        kind: "app",
      },
      { label: "GitHub", href: github("Utilities"), kind: "repository" },
      {
        label: "Changelog",
        href: `${github("Utilities")}/blob/main/CHANGELOG.md`,
        kind: "docs",
      },
    ],
    facts: [
      fact("defaultBranch", "Основная ветка", "main", github("Utilities"), {
        pinned: true,
        observedAt: UTILITIES_SEED_AT,
      }),
      fact(
        "versionSource",
        "Источник версии",
        "package.json",
        `${github("Utilities")}/blob/main/package.json`,
        { source: "repository", pinned: true, observedAt: UTILITIES_SEED_AT },
      ),
      fact(
        "changelogPath",
        "Changelog",
        "CHANGELOG.md",
        `${github("Utilities")}/blob/main/CHANGELOG.md`,
        { source: "repository", observedAt: UTILITIES_SEED_AT },
      ),
      fact(
        "primaryStore",
        "Основное хранилище",
        "IndexedDB · utilities-local-v1",
        `${github("Utilities")}/blob/main/README.md`,
        { source: "repository", observedAt: UTILITIES_SEED_AT },
      ),
    ],
    dataProfile: {
      mode: "local-only",
      stores: ["IndexedDB · utilities-local-v1", "JSON backup · utilities-backup v1"],
      sensitivity: "private",
    },
    publicProfile: {
      enabled: true,
      slug: "utilities",
      tagline: "Показания без облака",
      shortDescription: "Домашние счётчики, расход и резервные копии в одном локальном приложении.",
      categories: ["home", "utilities", "productivity"],
      platforms: ["Web", "Desktop", "Mobile"],
      highlights: ["Local-first", "IndexedDB", "Без сервера"],
      appUrl: "https://budladislav.github.io/Utilities/",
      repositoryUrl: github("Utilities"),
      showVersion: true,
      featured: false,
      sortOrder: 7,
    },
  },
  {
    ...meta(projectIds.ashroad, ASHROAD_SEED_AT),
    slug: "ashroad",
    name: "Ashroad",
    repositoryName: "Budladislav/Ashroad",
    repositoryId: "seed:private-ashroad",
    repositoryVisibility: "private",
    summary:
      "Portrait-first solo-RPG о Пепельном тракте: развитие героя, охота, экипировка, ремесло и Отголоски.",
    startedAt: "2026-09-25T14:48:03.000Z",
    startedAtInferred: false,
    version: "R16C",
    latestReleaseAt: ASHROAD_SEED_AT,
    lastActivityAt: ASHROAD_SEED_AT,
    lifecycle: "active",
    availability: "working",
    attention: "due-soon",
    syncStatus: "manual",
    lastSyncedAt: ASHROAD_SEED_AT,
    pinned: false,
    sortOrder: 8,
    accent: "#d5ac66",
    mark: "AR",
    iconUrl: "/project-icons/ashroad.svg",
    stack: ["TypeScript", "React 19", "Vite 8", "IndexedDB", "Vitest", "Playwright", "PWA"],
    capabilities: [
      "Solo-RPG и детерминированный бой",
      "Охота, экипировка и ремесло",
      "Квесты и Отголоски",
      "Два локальных профиля",
      "Версионированные сохранения",
      "Portrait-first mobile UI",
    ],
    links: [
      { label: "GitHub", href: github("Ashroad"), kind: "repository" },
      {
        label: "Changelog",
        href: `${github("Ashroad")}/blob/main/CHANGELOG.md`,
        kind: "docs",
      },
    ],
    facts: [
      fact("defaultBranch", "Основная ветка", "main", github("Ashroad"), {
        pinned: true,
        observedAt: ASHROAD_SEED_AT,
      }),
      fact(
        "versionSource",
        "Схема версий",
        "R-checkpoint из CHANGELOG.md; package 0.10.0 хранится отдельно",
        `${github("Ashroad")}/blob/main/CHANGELOG.md`,
        { source: "repository", pinned: true, observedAt: ASHROAD_SEED_AT },
      ),
      fact(
        "primaryStore",
        "Основное хранилище",
        "IndexedDB · два локальных профиля · epoch r06-r1",
        `${github("Ashroad")}/blob/main/README.md`,
        { source: "repository", observedAt: ASHROAD_SEED_AT },
      ),
      fact(
        "deployment",
        "Публикация",
        "Публичного production deployment пока нет",
        `${github("Ashroad")}/blob/main/README.md`,
        { source: "repository", observedAt: ASHROAD_SEED_AT },
      ),
    ],
    dataProfile: {
      mode: "local-only",
      stores: ["IndexedDB · два слота кампании", "JSON backup"],
      sensitivity: "private",
    },
    publicProfile: {
      enabled: false,
      slug: "ashroad",
      tagline: "Путь через пепел",
      shortDescription: "Мобильная solo-RPG с детерминированным боем и локальными сохранениями.",
      categories: ["game", "rpg", "mobile"],
      platforms: ["PWA", "Android", "Desktop"],
      highlights: ["Local-first", "Deterministic combat", "Raster art"],
      repositoryUrl: github("Ashroad"),
      showVersion: true,
      featured: false,
      sortOrder: 8,
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
  const identity = projectId === projectIds.ashroad ? `${version}:${releasedAt}` : version;
  return {
    ...meta(`release:${projectId}:${identity}`, releasedAt),
    projectId,
    version,
    releasedAt,
    title,
    source: "changelog",
    sourceUrl: changelogUrl,
    entries,
  };
}

const ashroadHistoricalReleaseSpecs: Array<[string, string, string]> = [
  ["R16Q-C", "2026-10-01T14:53:40.000Z", "Owner product contracts after short R16Q test"],
  ["R16Q", "2026-10-01T13:08:17.000Z", "NG bosses, quest variety and compact item surfaces"],
  ["R16V", "2026-10-01T10:30:16.000Z", "Scoped item prototype and Warden HP"],
  ["R15C-R1", "2026-10-01T07:29:08.000Z", "Manual charge and finale loot"],
  ["R15C", "2026-10-01T00:15:51.000Z", "Upper No Grade hunt and prepared finale"],
  ["R15B-R2", "2026-09-30T21:05:05.000Z", "Manual charge save ordering and base sword repair"],
  ["R15B-R1", "2026-09-30T18:38:02.000Z", "No Grade finale repair and approved product knowledge"],
  ["R15B", "2026-09-30T16:30:38.000Z", "Region finale and combat presentation repair"],
  ["R15A-R1", "2026-09-30T12:41:02.000Z", "Visual polish and combat feedback"],
  ["R15A", "2026-09-30T10:27:45.000Z", "Visual combat and regional interaction polish"],
  ["R14-R1", "2026-09-30T01:51:06.000Z", "Mobile quest, hunt and inventory polish"],
  ["R14", "2026-09-29T20:04:47.000Z", "Regional Quest Foundation and Separate Campaign Slot"],
  ["R13-R1", "2026-09-29T17:53:27.000Z", "No Grade balance recovery"],
  ["R13", "2026-09-29T16:11:30.000Z", "World, City Hub and Travel Foundation"],
  ["R12", "2026-09-29T12:42:08.000Z", "Item Identity and No Grade Completion"],
  ["R11", "2026-09-29T10:46:58.000Z", "Visual and Interaction Consolidation"],
  ["R10-R2", "2026-09-29T08:51:26.000Z", "Восстановление настоящего Pixel-профиля"],
  ["R10-R1", "2026-09-29T07:27:52.000Z", "Recovery, save safety and global actions"],
  ["R10", "2026-09-28T23:45:44.000Z", "Echoes pivot and Наставник vertical"],
  ["R09", "2026-09-28T19:54:17.000Z", "No Grade solo progression spine"],
  ["R08B-R1", "2026-09-28T18:07:57.000Z", "Soulshot semantics and visual cleanup"],
  ["R08B", "2026-09-28T15:24:41.000Z", "Local combat feel"],
  ["R08A-R1", "2026-09-28T12:05:43.000Z", "Local status and recovery loop"],
  ["R08A", "2026-09-28T12:05:43.000Z", "Инвентарь, paper-doll и восстановление"],
  ["R07D", "2026-09-28T09:15:12.000Z", "Local owner polish and defeat delevel"],
  ["R07C", "2026-09-28T07:40:46.000Z", "Published city shell, activity journal and character hub"],
  ["R07B", "2026-09-27T22:51:16.000Z", "Local merchant and No Grade economy cutover"],
  ["R07A-R2", "2026-09-27T21:41:24.000Z", "Local hunt entry and action control repair"],
  ["R07A-R1", "2026-09-27T20:02:46.000Z", "Local serialized saves and combat UI repair"],
  ["R07A", "2026-09-27T18:45:39.000Z", "Local combat-stage geometry checkpoint"],
  ["R06-R2R3", "2026-09-27T16:38:38.000Z", "Local authoritative terminal rescue"],
  ["R06-R2R2", "2026-09-27T14:54:27.000Z", "Local terminal recovery hotfix"],
  ["R06-R2R1", "2026-09-27T13:59:44.000Z", "Local hotfix"],
  ["R06-R2", "2026-09-27T12:09:09.000Z", "Pixel playtest repair gate"],
  ["R06-R1", "2026-09-27T11:04:22.000Z", "Canonical save baseline"],
  ["R06", "2026-09-27T09:40:42.000Z", "Starter Region and No Grade progression"],
  ["R05", "2026-09-27T07:33:37.000Z", "Skills, Trainer and Books"],
  ["R04E", "2026-09-27T06:40:49.000Z", "Compact Combat Stage and Spatial Feel"],
  ["R04D", "2026-09-27T05:45:19.000Z", "Hero Vitality and Seamless Hunting Surface"],
  ["R04C", "2026-09-27T04:42:27.000Z", "World Cutover and First Hunting Zone"],
  ["R04B-R1", "2026-09-26T20:51:23.000Z", "Dynamic hotbars and solo HUD correction"],
  ["R04B", "2026-09-26T20:00:11.000Z", "Solo Combat HUD, Universal Hotbar and Level-Up VFX"],
  ["R04A", "2026-09-26T18:58:19.000Z", "Solo-First Progression correction"],
  ["R04A", "2026-09-26T18:28:11.000Z", "Enemy XP/SP, Level Curve and Recruitment Pacing"],
  ["R03A", "2026-09-26T15:34:25.000Z", "No Grade Equipment Progression"],
  ["R03", "2026-09-26T12:16:08.000Z", "Physical Inventory, Recipe Crafting and Item Grades"],
  ["R02", "2026-09-26T10:59:53.000Z", "Economy, Loot and Raster Bounds Safety"],
  ["R01", "2026-09-26T09:48:19.000Z", "Raster Combat Proof"],
  ["R00", "2026-09-26T08:20:30.000Z", "First Chapter Rework contract and 04B baseline"],
  ["0.10.0", "2026-09-26T07:22:32.000Z", "04B Road Warden and Repeat Hunt"],
  ["0.9.0", "2026-09-26T06:43:18.000Z", "04A First Region and Dark System-Shell Request"],
  ["0.8.0", "2026-09-26T06:15:13.000Z", "03C Training, Books, Enchant and Fixed Battle HUD"],
  ["0.7.1", "2026-09-26T05:37:51.000Z", "03B-R1 Training, Status Bar and Class Gear"],
  ["0.7.0", "2026-09-25T22:41:22.000Z", "03B Free Loot, Supplies and Charges"],
  ["0.6.0", "2026-09-25T19:27:02.000Z", "03A Equipment and Targeted Drops"],
  ["0.5.0", "2026-09-25T18:42:43.000Z", "02B First Resource Expedition"],
  ["0.4.0", "2026-09-25T17:53:10.000Z", "02A Versioned Save and Recruitment"],
  ["0.3.0", "2026-09-25T17:14:52.000Z", "01C Tactics and Support Proof"],
  ["0.2.0", "2026-09-25T16:12:24.000Z", "01B Deterministic Combat Core"],
  ["0.1.1", "2026-09-25T15:34:43.000Z", "01A-R1 Side-view proof"],
  ["0.1.0", "2026-09-25T14:48:03.000Z", "01A Visual Foundation proof"],
];

const ashroadHistoricalReleases = ashroadHistoricalReleaseSpecs.map(([version, releasedAt, title]) =>
  release(
    projectIds.ashroad,
    version,
    releasedAt,
    title,
    `${github("Ashroad")}/blob/main/CHANGELOG.md`,
    [],
  )
);

export const seedReleases: ProjectRelease[] = [
  release(
    projectIds.ashroad,
    "R16C",
    ASHROAD_SEED_AT,
    "Первый полный состав Отголосков, D-заточка и оружие",
    `${github("Ashroad")}/blob/main/CHANGELOG.md`,
    [
      {
        id: "ashroad-r16c-echoes",
        category: "added",
        text: "Добавлены три получаемых через квесты Отголоска с собственными уровнями, навыками и конечными XP/SP.",
      },
      {
        id: "ashroad-r16c-weapons",
        category: "added",
        text: "Добавлены пять цельных оружейных поз, согласованные заряды и постоянные маски заточки.",
      },
      {
        id: "ashroad-r16c-enchant",
        category: "added",
        text: "Добавлены физические D-свитки заточки, разрушение предметов в D-кристаллы и рецепт D-зарядов.",
      },
      {
        id: "ashroad-r16c-balance",
        category: "changed",
        text: "Перебалансирована прогрессия Top NG → Low D → Mid D и длительность боевых эффектов.",
      },
      {
        id: "ashroad-r16c-save",
        category: "changed",
        text: "Оба профиля и квитанции сохранены при миграции schema 18 → 19.",
      },
    ],
  ),
  ...ashroadHistoricalReleases,
  release(
    projectIds.ashroad,
    "R16B",
    "2026-10-02T18:44:08.000Z",
    "D-оружие, квесты и развитие боссов",
    `${github("Ashroad")}/blob/main/CHANGELOG.md`,
    [
      {
        id: "ashroad-r16b-weapons",
        category: "added",
        text: "Добавлены пять D-оружейных путей с активными приёмами, книгами и мастерствами.",
      },
      {
        id: "ashroad-r16b-bosses",
        category: "changed",
        text: "Расширены квестовые доказательства, боссовые подходы и сохранённые версии боевых правил.",
      },
    ],
  ),
  release(
    projectIds.ashroad,
    "R16A-R1",
    "2026-10-02T12:08:03.000Z",
    "Свободный вход в D-грейд, ранги и мобильный ремонт",
    `${github("Ashroad")}/blob/main/CHANGELOG.md`,
    [
      {
        id: "ashroad-r16a-r1-entry",
        category: "changed",
        text: "Межгородской доступ переведён на оплату, а раннее D-снаряжение получило единый видимый штраф.",
      },
      {
        id: "ashroad-r16a-r1-save",
        category: "changed",
        text: "Schema 16 → 17 сохраняет оба профиля, активные бои и исторические квитанции.",
      },
    ],
  ),
  release(
    projectIds.ashroad,
    "R16A",
    "2026-10-01T21:08:26.000Z",
    "Первый D-маршрут, пути брони и сохранённые сборки",
    `${github("Ashroad")}/blob/main/CHANGELOG.md`,
    [
      {
        id: "ashroad-r16a-route",
        category: "added",
        text: "Добавлены Путевая кузня, маршрут 20–25, D-экипировка, материалы и сохранённые сборки.",
      },
      {
        id: "ashroad-r16a-migration",
        category: "changed",
        text: "Schema 15 → 16 добавляет состояние без повторной выдачи наград и сохраняет оба слота.",
      },
    ],
  ),
  release(
    projectIds.utilities,
    "0.1.0",
    UTILITIES_SEED_AT,
    "Локальный учёт показаний",
    `${github("Utilities")}/blob/main/CHANGELOG.md`,
    [
      {
        id: "utilities-0.1.0-meters",
        category: "added",
        text: "Добавлены счётчики, история показаний, расчёты расхода и графики.",
      },
      {
        id: "utilities-0.1.0-backup",
        category: "added",
        text: "Реализованы IndexedDB, версионированный JSON backup с checksum и атомарное восстановление.",
      },
      {
        id: "utilities-0.1.0-flow-import",
        category: "changed",
        text: "Импорт Flow остаётся экспериментальным: реальные копии с полем unit будут поддержаны отдельным патчем.",
      },
      {
        id: "utilities-0.1.0-boundary",
        category: "security",
        text: "Показания остаются в браузере; сервер, аккаунт, аналитика и PWA отсутствуют.",
      },
    ],
  ),
  release(
    projectIds.diary,
    "0.1.0-dev.3",
    "2026-09-12T18:00:00.000Z",
    "Чистый мобильный дневник",
    `${github("Diary")}/blob/main/CHANGELOG.md`,
    [
      {
        id: "nit-dev3-startup",
        category: "fixed",
        text: "Блокирующая заставка убрана, каркас дневника показывается сразу.",
      },
      {
        id: "nit-dev3-navigation",
        category: "changed",
        text: "Главный экран очищен, частые действия перенесены под правый палец.",
      },
      {
        id: "nit-dev3-editor",
        category: "fixed",
        text: "Редактор удерживает конец текста в видимой области после открытия клавиатуры.",
      },
      {
        id: "nit-dev3-keep",
        category: "added",
        text: "Добавлен безопасный предпросмотр старых заметок Google Keep.",
      },
    ],
  ),
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
  {
    ...meta("backup-policy:nit", DIARY_SEED_AT),
    projectId: projectIds.diary,
    mode: "manual-file",
    sensitivity: "sensitive",
    cadenceDays: 7,
    nextDueAt: "2026-09-12T18:00:00.000Z",
    status: "not-configured",
    reason:
      "Прототип хранит только тестовые записи. Полный backup и проверенное восстановление ещё не реализованы.",
  },
  {
    ...meta("backup-policy:utilities", UTILITIES_SEED_AT),
    projectId: projectIds.utilities,
    priority: 5,
    mode: "manual-file",
    sensitivity: "private",
    cadenceDays: 7,
    nextDueAt: "2026-09-20T10:26:07.000Z",
    status: "not-configured",
    reason:
      "Versioned JSON backup, checksum и атомарный импорт покрыты тестами; физический restore drill ещё не подтверждён.",
    format: "utilities-backup-v1",
  },
  {
    ...meta("backup-policy:ashroad", ASHROAD_SEED_AT),
    projectId: projectIds.ashroad,
    priority: 6,
    mode: "manual-file",
    sensitivity: "private",
    cadenceDays: 7,
    nextDueAt: "2026-10-10T02:35:30.000Z",
    status: "not-configured",
    reason:
      "Два IndexedDB-профиля требуют регулярного versioned JSON backup; централизованный адаптер Верфи не подключён.",
    format: "ashroad-save-r06-r1",
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
    title: "Унифицировать release contract Takt",
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
    nextAction: "Зафиксировать capability manifest и начать с Takt adapter.",
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
  [projectIds.diary]: {
    "release.single-version-source": {
      result: "verified",
      evidence: "package.json — каноническая версия; repository check сверяет lockfile, README и service worker.",
    },
    "release.canonical-changelog": {
      result: "verified",
      evidence: "Root CHANGELOG.md содержит датированный prerelease и раздел Unreleased.",
    },
    "quality.check-command": {
      result: "verified",
      evidence: "npm run check включает repository policy, lint, typecheck, Vitest и production build.",
    },
    "quality.ci-before-deploy": {
      result: "warning",
      evidence: "GitHub Actions запускает check; production deployment дневника ещё не создан.",
      source: "github",
      remediation: "Перед первой публикацией связать Vercel deployment с успешным quality gate.",
    },
    "pwa.installable-shell": {
      result: "warning",
      evidence: "Manifest, иконки и offline shell реализованы; установленная PWA ещё проходит проверку на физическом Android.",
      remediation: "Завершить install/offline/update проверку на целевом телефоне.",
    },
    "data.classification": {
      result: "verified",
      evidence: "README и SECURITY классифицируют записи как sensitive; прототип отделён в nit-diary-demo-v1.",
    },
    "backup.versioned-export": {
      result: "action-required",
      evidence: "Есть диапазонная выгрузка и Keep preview, но полного backup всей базы и ревизий пока нет.",
      remediation: "Реализовать versioned envelope с checksum до импорта личного архива.",
    },
    "backup.atomic-restore": {
      result: "action-required",
      evidence: "Полный restore и независимый restore drill ещё не реализованы.",
      remediation: "Добавить атомарное восстановление и проверить его на чистой базе.",
    },
    "security.private-data-boundary": {
      result: "verified",
      evidence: "Private repo и Верфь получают только технические сведения; тексты дневника и backup payload исключены.",
    },
  },
  [projectIds.utilities]: {
    "release.single-version-source": {
      result: "verified",
      evidence: "package.json — каноническая версия; repository check сверяет её с CHANGELOG.md и сборкой.",
    },
    "release.canonical-changelog": {
      result: "verified",
      evidence: "Root CHANGELOG.md содержит датированный релиз 0.1.0 и раздел Unreleased.",
    },
    "quality.check-command": {
      result: "verified",
      evidence: "npm run check включает lint, typecheck, 20 тестов, production build, version check и gzip budget.",
    },
    "quality.ci-before-deploy": {
      result: "warning",
      evidence: "GitHub Pages workflow публикует dist после quality gate; первый удалённый прогон ещё не подтверждён.",
      source: "repository",
      remediation: "Проверить первый Actions run и production URL без кеша после публикации.",
    },
    "pwa.installable-shell": {
      result: "not-applicable",
      evidence: "По границе продукта это обычное статическое приложение без manifest и service worker.",
    },
    "data.classification": {
      result: "verified",
      evidence: "Показания классифицированы private и хранятся только в IndexedDB текущего origin.",
    },
    "backup.versioned-export": {
      result: "verified",
      evidence: "utilities-backup v1 содержит metadata, данные и SHA-256 checksum; roundtrip покрыт тестами.",
    },
    "backup.atomic-restore": {
      result: "warning",
      evidence: "Валидация до транзакции и откат покрыты тестами; физический export/restore drill ещё не завершён.",
      remediation: "Проверить скачанный файл на чистом браузерном профиле.",
    },
    "security.private-data-boundary": {
      result: "verified",
      evidence: "Backend и аналитика отсутствуют; GitHub и Верфь получают только технические метаданные.",
    },
  },
  [projectIds.ashroad]: {
    "release.single-version-source": {
      result: "exception",
      evidence: "Продуктовые checkpoint R16C и package version 0.10.0 служат разным целям; адаптер Верфи читает R-версию из changelog.",
      remediation: "Зафиксировать двухуровневую схему версий в документации Ashroad или позднее свести её к одному каноническому номеру.",
    },
    "release.canonical-changelog": {
      result: "verified",
      evidence: "Root CHANGELOG.md содержит последовательные R-checkpoint; точное время восстанавливается из commit history файла.",
    },
    "quality.check-command": {
      result: "verified",
      evidence: "npm run check объединяет format, typecheck, lint, unit, manifest/icon/visual doctors, Stable/Lab builds и boundary check.",
    },
    "quality.ci-before-deploy": {
      result: "warning",
      evidence: "Публичного production deployment нет; remote хранит проверенные checkpoints без подтверждённого deploy gate.",
      remediation: "Перед production зафиксировать CI gate и отделить опубликованный релиз от development checkpoint.",
    },
    "pwa.installable-shell": {
      result: "warning",
      evidence: "Manifest и mobile shell присутствуют; README описывает только приватное preview, не production install flow.",
      remediation: "Проверить установку, offline/update и системную панель после появления стабильного origin.",
    },
    "data.classification": {
      result: "verified",
      evidence: "Два профиля кампании хранятся локально в IndexedDB; backend и межустройственная синхронизация отсутствуют.",
    },
    "backup.versioned-export": {
      result: "verified",
      evidence: "README и save contract описывают versioned backup с epoch/schema и отдельными слотами.",
    },
    "backup.atomic-restore": {
      result: "warning",
      evidence: "Миграции и recovery покрыты автоматическими проверками; регулярный физический restore drill не зафиксирован в Верфи.",
      remediation: "Скачать свежий backup каждого слота и проверить восстановление на чистом профиле.",
    },
    "security.private-data-boundary": {
      result: "verified",
      evidence: "Private repo; Верфь получает только технические файлы и changelog, игровые сохранения не передаются.",
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

export const seedSyncEvents: SyncEvent[] = seedProjects.map((project) => {
  const isDiary = project.id === projectIds.diary;
  const isUtilities = project.id === projectIds.utilities;
  const isAshroad = project.id === projectIds.ashroad;
  const isQueued = isDiary || isUtilities || isAshroad;
  const occurredAt = isDiary
    ? DIARY_SEED_AT
    : isUtilities
      ? UTILITIES_SEED_AT
      : isAshroad
        ? ASHROAD_SEED_AT
        : SEED_OBSERVED_AT;

  return {
    ...meta(`sync:${project.id}:github-audit`, occurredAt),
    projectId: project.id,
    provider: "github",
    direction: "pull",
    status: isQueued ? "queued" : "success",
    summary: isDiary
      ? "Нить зарегистрирована; ожидается доступ GitHub App"
      : isUtilities
        ? "Коммунальные зарегистрированы; ожидается доступ GitHub App"
        : isAshroad
          ? "Ashroad зарегистрирован; ожидается доступ GitHub App"
          : `GitHub-аудит ${project.repositoryName}`,
    occurredAt,
    details: isDiary
      ? "Карточка не содержит дневниковых записей. После добавления Diary в Only select repositories нужна ручная сверка."
      : isUtilities
        ? "Верфь получает только технические метаданные. Показания и backup остаются в браузере пользователя."
        : isAshroad
          ? "Private repo: после добавления Ashroad в Only select repositories Верфь прочитает R-checkpoint и commit timestamps."
          : "Read-only metadata and repository files snapshot.",
  };
});

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

async function reconcileProjectPresentation(database: WerftDatabase) {
  const presentation = new Map([
    [projectIds.monoFocus, { legacyName: "MonoFocus", name: "Takt" }],
    [projectIds.diary, { iconUrl: "/project-icons/nit.svg" }],
    [projectIds.utilities, { iconUrl: "/project-icons/utilities.svg" }],
  ]);

  for (const [projectId, update] of presentation) {
    const project = await database.projects.get(projectId);
    if (!project) continue;
    const name = "name" in update && project.name === update.legacyName
      ? update.name
      : project.name;
    const iconUrl = "iconUrl" in update && !project.iconUrl
      ? update.iconUrl
      : project.iconUrl;
    if (name === project.name && iconUrl === project.iconUrl) continue;
    await database.projects.put({ ...project, name, iconUrl });
  }
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
    await reconcileProjectPresentation(database);
  });
}
