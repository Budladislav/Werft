/* This file is generated from CHANGELOG.md. Do not edit it manually. */
export type AppReleaseHistoryEntry = {
  version: string;
  releasedAt: string;
  sections: Array<{ title: string; items: string[] }>;
};

export const APP_RELEASE_HISTORY: AppReleaseHistoryEntry[] = [
  {
    "version": "0.1.0",
    "releasedAt": "2026-08-28",
    "sections": [
      {
        "title": "Добавлено",
        "items": [
          "Первый local-first MVP центра управления экосистемой проектов.",
          "Быстрый мобильный режим «Док» для запуска приложений.",
          "Библиотека пяти проектов с паспортами, статусами и источниками данных.",
          "Сквозной журнал релизов с фильтрацией и экспортом за период.",
          "Визуальные напоминания, backup-политики и журнал обслуживания.",
          "Werft Standard v1 с доказательными проверками качества.",
          "Полный экспорт и восстановление локальной базы со схемой будущей синхронизации.",
          "Безопасный read-only GitHub-мост для выбранных репозиториев.",
          "Архитектурный задел под отдельную публичную витрину проектов."
        ]
      },
      {
        "title": "Безопасность",
        "items": [
          "GitHub App OAuth web flow усилен PKCE S256 с зашифрованным короткоживущим verifier.",
          "Публичные seed-данные приватного Flow очищены от внутренних идентификаторов, путей и деталей уязвимого restore-процесса.",
          "Локальные Vercel-метаданные, ключи и `.werft-backup` исключены из Git."
        ]
      }
    ]
  }
];
