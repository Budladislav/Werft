# Дорожная карта Верфи

Очередность основана на снижении операционного риска, а не только на количестве функций. Каждая следующая фаза сохраняет local-first работу без обязательного сервера.

## M0 — MVP одного устройства

- Библиотека пяти проектов, overview, project passport, journal, maintenance, ideas, settings.
- Mobile Dock, device-local start preference и PWA shortcuts.
- IndexedDB, private notes, versioned full export/import и outbox-ready entity metadata.
- Werft Standard v1 и начальная quality matrix.
- Single-owner read-only GitHub sync и release-history automation.
- Автосверка GitHub при открытии с TTL; ручная кнопка остаётся принудительным обновлением.
- Flow отмечен excluded/sensitive во всех backup-поверхностях.

## M1 — реальные backup-адаптеры

1. MonoFocus: согласованный versioned JSON export и restore drill.
2. Fitness Tracker: инвентаризация TXT/JSON/Firebase данных, устранение version drift, затем адаптер.
3. Safe Play: JSON + IndexedDB covers, проверка полноты и restore.
4. ChronoAtlas: интеграция существующего versioned/transactional контракта как эталон.

Кнопка «backup всех» появляется только когда каждый включённый adapter умеет сообщить однозначные success/evidence/checksum. Браузер не получает скрытый cross-origin доступ; допустимы явный file handoff, File System Access API с разрешением пользователя или узкий серверный workflow.

Flow остаётся вне очереди до отдельного threat model: шифрование at rest/in transit, атомарность, key recovery и тест восстановления.

## M2 — синхронизация между устройствами

- Минимальный single-owner backend, server-side database и encrypted transport.
- Owner authentication и закрытый namespace `/app/*`; пользователь по-прежнему один.
- Pull по cursor, push из outbox, stable IDs/revisions/tombstones.
- Conflict inbox вместо last-write-wins для notes, maintenance и ideas.
- Device registry, export-before-migration, audit log и возможность полностью отключить sync.
- GitHub observations синхронизируются как rebuildable cache; приватный пользовательский контент — отдельно.

## M3 — автоматизация обслуживания

- Scheduled GitHub refresh, deploy health checks и evidence snapshots.
- Напоминания о backup/hosting/domain с quiet hours и локальными notification permissions.
- Release webhook/CI artifact, который обновляет changelog/status без ручного входа в Верфь.
- Версионированные project adapters и dry-run перед любым обслуживающим действием.

## M4 — публичная витрина

- Публичный маршрут `/showcase` и дизайн «спущенных на воду кораблей»; при необходимости он выносится в отдельный deployment без изменения контракта данных.
- Только explicit allowlist полей `publicProfile`: icon, tagline, short description, platforms, highlights и публичные ссылки.
- Build-time sanitized artifact; никаких runtime-запросов к private базе Верфи.
- Preview/diff перед публикацией, per-project enable switch, проверка URL и секретов.

## M5 — мобильная оболочка при доказанной пользе

- Сначала измерить, достаточно ли установленной PWA, `/dock` и manifest shortcuts.
- Затем рассмотреть Android TWA для store/OS-интеграции и widget/quick tiles для 1-tap launch.
- Нативная оболочка не должна создавать второй источник данных или отдельную реализацию экранов.

## Идеи после стабилизации

- Trend качества по версиям Werft Standard и debt burn-down.
- Dependency/stack drift, security advisories и срок актуальности доказательств.
- Шаблон нового проекта с changelog/check/backup contract из коробки.
- Централизованный каталог архитектурных решений и переиспользуемых компонентов.
- Приватный еженедельный digest: релизы, обслуживание, риски и следующие действия.
