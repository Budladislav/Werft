# Контракт синхронизации и резервного копирования

## Полный экспорт Верфи

Расширение файла: `.werft-backup`. Envelope содержит `format`, `schemaVersion`, `appVersion`, `exportedAt`, `deviceId`, checksum и полный payload таблиц. Checksum вычисляется по каноническому payload, а не по форматированию файла.

Импорт выполняется в порядке:

1. Проверить размер, JSON, format/schema и структуру каждой сущности.
2. Пересчитать checksum.
3. Показать пользователю состав и предупреждение о приватности.
4. Создать safety export текущей базы.
5. В одной Dexie transaction заменить таблицы либо откатить всё.
6. Зафиксировать локальный sync/maintenance event.

Экспорт содержит приватные заметки и поэтому private по умолчанию. Он не является публичной showcase-проекцией и не должен автоматически попадать в репозиторий или облачную папку без отдельного решения о шифровании.

## Будущий сетевой протокол

Каждая сущность имеет `id`, `revision`, `deviceId`, `createdAt`, `updatedAt` и optional `deletedAt`. Локальная мутация атомарно обновляет entity и добавляет outbox record `{entityType, entityId, operation, baseRevision, payload}`.

Push отправляет idempotency key и baseRevision. Сервер:

- применяет mutation, если baseRevision совпадает;
- возвращает уже применённый результат при повторе idempotency key;
- создаёт conflict, а не silently overwrites при расхождении;
- хранит tombstone достаточно долго, чтобы offline device не воскресил удалённую запись.

Pull идёт по server cursor и применяет batch транзакционно. GitHub observations считаются rebuildable cache и не смешиваются с private authoring records.

## Backup-адаптер проекта

Adapter не читает чужой origin скрыто. Он объявляет `projectId`, format/schema, sensitivity, capabilities `export/validate/restore`, user gesture requirements и evidence. Результат содержит filename, byteSize, checksum, started/completed timestamps и status.

«Backup всех» запускает только configured policies, показывает план до старта и изолирует ошибки по проектам. Success означает, что файл валиден; `restoreVerifiedAt` появляется только после отдельного восстановления. Flow adapter отсутствует и policy остаётся `excluded` до утверждённого security design.
