# GitHub-мост

## Модель доступа

Верфь использует GitHub App OAuth user access token, а не Personal Access Token в браузере. Сервер принимает только аккаунт с immutable GitHub id `46434977`. Репозитории зашиты в allowlist:

- `Budladislav/Flow`
- `Budladislav/Planer`
- `Budladislav/safe-play`
- `Budladislav/fitness-tracker`
- `Budladislav/ChronoAtlas`

Переменная `GITHUB_REPOSITORIES` может временно выбрать подмножество, но не расширить список. Разрешённые файлы: `package.json`, `README.md`, manifests, root `CHANGELOG.md` и `CHANGELOG_MONOFOCUS.md` только для legacy MonoFocus. Универсального file/repository proxy нет.

## Создание GitHub App

1. Создать GitHub App у владельца репозиториев.
2. Homepage URL: production origin Верфи.
3. Callback URL: `<WERFT_APP_ORIGIN>/auth/github/callback`.
4. Webhooks оставить отключёнными до появления server-side хранилища наблюдений.
5. Repository permissions: `Metadata: Read-only`, `Contents: Read-only`, `Actions: Read-only`; остальные — No access.
6. Account permissions не запрашивать.
7. Установить App только на пять перечисленных репозиториев.
8. Скопировать Client ID и создать Client Secret в server environment.

Authorization request намеренно не содержит OAuth `scope`: права user token ограничивает установка и read-only permissions GitHub App. Не заменять это classic OAuth App с широким `repo` scope.

OAuth web flow использует PKCE: на старте сервер генерирует случайный `code_verifier`, сохраняет его вместе со `state` только в 10-minute AES-256-GCM-зашифрованной HttpOnly cookie и отправляет GitHub `code_challenge` с методом `S256`. Callback сначала проверяет зашифрованный payload и constant-time `state`, затем передаёт исходный `code_verifier` при обмене одноразового code. Незашифрованный verifier не попадает ни в URL, ни в браузерный JavaScript.

## Environment

Скопировать `.env.example` в `.env.local`, заполнить client id/secret и сгенерировать отдельный 32-byte base64url `WERFT_SESSION_SECRET`. Секреты никогда не используют префикс `NEXT_PUBLIC_` и не попадают в Git, backup Верфи или diagnostics.

Production должен использовать точный HTTPS origin. Preview deployment с другим hostname потребует отдельной callback registration/App либо не должен включать OAuth.

## HTTP-контракт

| Метод и путь | Назначение |
| --- | --- |
| `GET /api/github/status` | `{configured, connected, owner?, expiresAt?, repositories}` без проверки сети |
| `GET /api/github/auth/start?returnTo=/settings` | Создаёт 10-minute encrypted state + PKCE verifier cookie и перенаправляет в GitHub с S256 challenge |
| `GET /auth/github/callback` | Проверяет state, обменивает code с PKCE verifier, проверяет owner id, создаёт encrypted HttpOnly session |
| `POST /api/github/sync` | Возвращает `GithubSyncEnvelope`; частичная ошибка одного repo не стирает остальные |
| `POST /api/github/logout` | Best-effort revoke token и удаление cookies |

После запуска клиент проверяет возраст последней успешной сверки. Если срез старше 15 минут и OAuth-сессия активна, тот же `POST /api/github/sync` выполняется в фоне; интерфейс сначала открывается из IndexedDB и обновляется реактивно после ответа.

Session cookie: AES-256-GCM, HttpOnly, SameSite=Lax, Secure в production, TTL не больше 8 часов. API responses: `Cache-Control: private, no-store` и `Vary: Cookie`. POST endpoints отклоняют известный чужой Origin/Referer; SameSite cookie закрывает cross-site POST без этих заголовков.

## Что синхронизируется

Для каждого репозитория мост читает metadata, default-branch head, allowlisted files, tree paths, languages, releases, tags, workflows и последний Actions run. Результат нормализуется в purpose/version/changelog/stack/data profile/backup inference/delivery/evidence.

GitHub — источник наблюдаемых технических фактов, не private notes или maintenance state. Data layer должен применять envelope транзакционно по каждому успешному project, сохранять ручные pinned values и записывать errors как sync events.

## Публичность кода и приватность данных

Публичный репозиторий Верфи показывает реализацию, seed-названия проектов и URL. Он не даёт доступ к IndexedDB браузера, private Flow repository, GitHub token или Vercel environment variables. Такая граница сохраняется только если secrets и пользовательские exports не коммитятся, а публичная showcase строится из отдельной явной проекции.

Service worker не перехватывает `/api` и `/auth` и не кеширует responses с `private`/`no-store`. При подозрении на утечку нужно отозвать GitHub App secret/token, сменить `WERFT_SESSION_SECRET` и проверить deployment logs.

## Почему webhook пока не включён

GitHub webhook приходит на сервер Vercel, когда браузер может быть закрыт. В MVP наблюдения хранятся только в IndexedDB конкретного устройства, поэтому webhook некуда безопасно записать и он не способен обновить локальный журнал. Публичный commit-снимок неприемлем для private Flow, а расширять read-only GitHub App правами записи ради обходного пути нельзя. Webhook подключается после появления owner-auth и server-side cache в M2/M3; до этого автосверка при открытии даёт честную и предсказуемую свежесть.
