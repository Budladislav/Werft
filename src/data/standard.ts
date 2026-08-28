import type { StandardControl } from "@/lib/domain";

export const WERFT_STANDARD_VERSION = "1.0.0";

export const standardControls: StandardControl[] = [
  {
    id: "release.single-version-source",
    title: "Один источник версии",
    area: "release",
    severity: "required",
    guidance: "Версия читается из одного канонического файла, остальные поверхности генерируются или проверяются.",
  },
  {
    id: "release.canonical-changelog",
    title: "Канонический changelog",
    area: "release",
    severity: "required",
    guidance: "Корневой CHANGELOG.md содержит версии и ISO-даты; встроенная история формируется из него.",
  },
  {
    id: "quality.check-command",
    title: "Единая проверка проекта",
    area: "quality",
    severity: "required",
    guidance: "Команда check объединяет typecheck, lint, тесты и production build.",
  },
  {
    id: "quality.ci-before-deploy",
    title: "CI перед публикацией",
    area: "quality",
    severity: "required",
    guidance: "Production публикуется только после успешной автоматической проверки.",
  },
  {
    id: "pwa.installable-shell",
    title: "Устанавливаемая PWA",
    area: "pwa",
    severity: "recommended",
    guidance: "Manifest, иконки, offline shell и стратегия обновления проверены на мобильном устройстве.",
  },
  {
    id: "data.classification",
    title: "Классификация данных",
    area: "data",
    severity: "required",
    guidance: "Проект явно описывает источник истины, локальные хранилища и чувствительность данных.",
  },
  {
    id: "backup.versioned-export",
    title: "Версионированный экспорт",
    area: "backup",
    severity: "required",
    guidance: "Экспорт содержит appVersion, schemaVersion, дату и проходит полную валидацию до записи.",
  },
  {
    id: "backup.atomic-restore",
    title: "Безопасное восстановление",
    area: "backup",
    severity: "required",
    guidance: "Восстановление атомарно либо имеет доказанный rollback; периодически выполняется restore drill.",
  },
  {
    id: "security.private-data-boundary",
    title: "Граница приватных данных",
    area: "security",
    severity: "required",
    guidance: "Секреты не попадают в клиент, а приватные данные не публикуются через репозиторий или витрину.",
  },
];
