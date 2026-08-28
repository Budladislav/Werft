# Production deployment

Этот документ фиксирует одно-владелецкий production-контур Верфи: публичный GitHub-репозиторий, Vercel-origin и read-only GitHub App.

## 1. GitHub repository

- Repository: `Budladislav/Werft`, visibility `public`, default branch `main`.
- Не добавлять README, `.gitignore` или license при создании: они уже находятся в локальной истории.
- Перед первым push проверить отсутствие `.env*`, ключей, `*.werft-backup` и обычного email автора.
- После push сравнить локальный `HEAD` с `origin/main`.

## 2. Первый Vercel deploy

1. В Vercel выбрать **Add New → Project** и импортировать `Budladislav/Werft`.
2. Project name: `werft`, если имя доступно. Production branch: `main`.
3. Framework preset: Next.js. Root directory: `./`. Install, build и output commands не переопределять.
4. Node.js фиксируется в `package.json` как `22.x`.
5. Выполнить первый deploy и записать стабильный production-origin вида `https://<project>.vercel.app`.

Первый deploy может работать без GitHub OAuth: в настройках интеграция будет отмечена как не настроенная. После получения стабильного origin нужно создать GitHub App и повторить deploy с environment variables.

## 3. GitHub App

Создать GitHub App в **GitHub Settings → Developer settings → GitHub Apps → New GitHub App**.

- GitHub App name: уникальное имя, например `Budladislav Werft`.
- Homepage URL: `<production-origin>`.
- Callback URL: `<production-origin>/auth/github/callback`.
- Setup URL: необязательно `<production-origin>/settings`.
- Request user authorization during installation: off.
- Device Flow: off.
- Webhooks: inactive.
- Repository permissions: `Metadata: Read-only`, `Contents: Read-only`, `Actions: Read-only`; остальные `No access`.
- Organization и account permissions: `No access`.
- Installation scope: **Only on this account**.

Private key не нужен. Верфь использует Client ID, Client Secret и OAuth user access token с PKCE.

Установить App на аккаунт `Budladislav` с режимом **Only select repositories**:

- `Flow`
- `Planer`
- `safe-play`
- `fitness-tracker`
- `ChronoAtlas`

## 4. Vercel environment variables

Добавить для Production:

```text
WERFT_APP_ORIGIN=<production-origin>
GITHUB_APP_CLIENT_ID=<GitHub App Client ID>
GITHUB_APP_CLIENT_SECRET=<GitHub App Client Secret>
WERFT_SESSION_SECRET=<base64url-encoded 32-byte random key>
GITHUB_OWNER_LOGIN=Budladislav
GITHUB_REPOSITORIES=Flow,Planer,safe-play,fitness-tracker,ChronoAtlas
```

`GITHUB_APP_CLIENT_SECRET` и `WERFT_SESSION_SECRET` должны быть отмечены в Vercel как Sensitive. Значения нельзя сохранять в Git, заметки, changelog или deployment logs. После изменения переменных обязателен новый Production deploy.

## 5. Приёмка

1. Production deployment имеет статус Ready и обслуживает стабильный origin.
2. `/manifest.webmanifest`, `/sw.js` и все основные экраны отвечают `200`.
3. `/api/github/status` без сессии отвечает `configured: true`, `connected: false` и `Cache-Control: private, no-store`.
4. В `/settings` выполнить GitHub OAuth; после возврата должно появиться состояние «подключено».
5. Запустить «Сверить сейчас» и проверить все пять проектов, включая private Flow.
6. Проверить мобильный `/dock`, установку PWA, экспорт `.werft-backup` и отсутствие ошибок в browser/runtime logs.
7. Сравнить `HEAD` и `origin/main`; сохранить production URL и deployment id в отчёте релиза.

## Граница доступа

Production URL не является auth-wall. Любой посетитель получает собственную IndexedDB и очищенный seed, но не может увидеть локальные данные, заметки, backup-файлы или GitHub-сессию владельца. GitHub API дополнительно принимает только immutable owner id. Закрытый UI потребует отдельного owner-gateway.

Официальные инструкции: [Vercel Git deployments](https://vercel.com/docs/git), [Vercel environment variables](https://vercel.com/docs/environment-variables), [регистрация GitHub App](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/registering-a-github-app), [установка GitHub App](https://docs.github.com/en/apps/using-github-apps/installing-your-own-github-app).
