# Werft Standard v1.0.0

Werft Standard — версия технического ориентира для всех текущих и будущих проектов. Это не рейтинг «хороших» и «плохих» приложений, а повторяемая проверка готовности к безопасной разработке и обслуживанию.

Каждая оценка хранит результат, дату, источник, доказательство и remediation. Допустимые результаты: verified, action-required, warning, unknown, not-applicable и документированное exception. Изменение стандарта создаёт новую версию; старые оценки не переписываются задним числом.

## Обязательные контроли

### `release.single-version-source` — один источник версии

Версия имеет один канонический источник. Package, UI, service worker и release metadata либо генерируются, либо проверяются автоматически. Расхождение считается action-required.

### `release.canonical-changelog` — канонический changelog

Корневой `CHANGELOG.md` содержит semantic version и ISO release date; встроенная история приложения строится из него. Для унаследованного пути допускается задокументированный adapter (например, MonoFocus), но новые проекты начинают с корневого файла.

### `quality.check-command` — единый quality gate

Одна команда `check` запускает применимые lint, typecheck, tests и production build. Команда обязана завершаться ненулевым кодом при любом нарушении.

### `quality.ci-before-deploy` — CI перед production

Публикация выполняется только из ревизии с успешным quality gate. Ручной deploy без проверяемой связи с commit получает warning/action-required.

### `data.classification` — классификация данных

Документация называет source of truth, local stores, remote backend, чувствительность и последствия потери данных. Inferred-скан репозитория помогает начать оценку, но не заменяет подтверждение владельца.

### `backup.versioned-export` — версионированный экспорт

Backup имеет format, schemaVersion, appVersion, exportedAt и checksum; до записи выполняется полная структурная проверка. Имя файла позволяет определить проект и дату без открытия.

### `backup.atomic-restore` — безопасное восстановление

Импорт полностью валидируется до мутации. Запись выполняется одной транзакцией или имеет проверенный rollback. Успешный экспорт не равен проверенному backup, пока restore drill не доказал восстановление.

### `security.private-data-boundary` — граница приватных данных

Секреты остаются на сервере, приватные данные — в предназначенном хранилище. Репозиторий, telemetry, logs, changelog и публичная витрина проверяются на утечки. Service worker не кеширует private/auth API.

## Рекомендуемый контроль

### `pwa.installable-shell` — устанавливаемая PWA

Manifest, icons, start URL, update strategy, offline fallback и safe-area layout проверены на целевом мобильном размере. Критический пользовательский путь не должен зависеть от случайно прогретого service-worker cache.

## Как внедрять в будущий проект

1. Создать root `CHANGELOG.md`, единую version constant и `check` ещё до первого релиза.
2. Заполнить data classification и backup contract до появления значимых пользовательских данных.
3. Добавить install/deploy/restore инструкции, не полагающиеся на память автора.
4. Подключить CI и зафиксировать доказательства в Верфи.
5. После первого production release провести мобильную проверку и restore drill.

ChronoAtlas служит стартовой референсной реализацией local-first/Dexie/transactional restore, но стандарт формируется из лучших практик всей экосистемы и развивается независимо от одного проекта.
