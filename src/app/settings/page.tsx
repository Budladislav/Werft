"use client";

import { useEffect, useRef, useState } from "react";
import {
  applyGithubSyncEnvelope,
  parseWerftBackup,
  restoreWerftBackup,
  serializeWerftBackup,
  setStartView,
  useProjects,
  useStartView,
  werftBackupFilename,
} from "@/data";
import { Icon, WerftMark } from "@/components/icons";
import { LoadingPanel, PageHeader, Panel, StatusPill, downloadText, formatDate } from "@/components/ui";
import { APP_VERSION } from "@/lib/domain";
import type { GithubSyncEnvelope } from "@/lib/github/types";
import { APP_RELEASE_HISTORY } from "@/lib/release-history.generated";

type GithubStatus = {
  configured: boolean;
  connected: boolean;
  owner?: { id: number; login: string };
  expiresAt?: string;
  repositories: string[];
};

const MAX_BACKUP_FILE_BYTES = 25 * 1024 * 1024;

export default function SettingsPage() {
  const startView = useStartView();
  const projects = useProjects();
  const fileInput = useRef<HTMLInputElement>(null);
  const [github, setGithub] = useState<GithubStatus>();
  const [githubError, setGithubError] = useState<string>();
  const [syncing, setSyncing] = useState(false);
  const [dataBusy, setDataBusy] = useState(false);
  const [dataMessage, setDataMessage] = useState<string>();
  const [versionOpen, setVersionOpen] = useState(false);

  useEffect(() => {
    fetch("/api/github/status", { cache: "no-store" })
      .then(async response => {
        if (!response.ok) throw new Error("Не удалось проверить подключение GitHub");
        return response.json() as Promise<GithubStatus>;
      })
      .then(setGithub)
      .catch(error => setGithubError(error instanceof Error ? error.message : "Ошибка GitHub"));
  }, []);

  if (!startView || !projects) return <LoadingPanel label="Открываем настройки контура…" />;

  async function exportData() {
    setDataBusy(true);
    setDataMessage(undefined);
    try {
      const exportedAt = new Date().toISOString();
      const serialized = await serializeWerftBackup(undefined, exportedAt);
      downloadText(werftBackupFilename(exportedAt), serialized, "application/json");
      setDataMessage("Полная локальная копия Верфи сохранена.");
    } catch (error) {
      setDataMessage(error instanceof Error ? error.message : "Не удалось создать копию.");
    } finally { setDataBusy(false); }
  }

  async function importData(file: File) {
    setDataBusy(true);
    setDataMessage(undefined);
    try {
      if (file.size > MAX_BACKUP_FILE_BYTES) {
        throw new Error("Файл больше 25 МБ и не похож на обычную копию Верфи.");
      }

      const incoming = await parseWerftBackup(await file.text());
      const { payload } = incoming;
      const confirmed = window.confirm(
        [
          `Восстановить копию от ${formatDate(incoming.exportedAt)}?`,
          "",
          `Проектов: ${payload.projects.length}`,
          `Заметок: ${payload.notes.filter(note => !note.deletedAt).length}`,
          `Идей: ${payload.ideas.filter(idea => !idea.deletedAt).length}`,
          "",
          "Перед заменой Верфь скачает страховочную копию текущей базы.",
        ].join("\n"),
      );
      if (!confirmed) {
        setDataMessage("Восстановление отменено — локальная база не изменена.");
        return;
      }

      const safetyExportedAt = new Date().toISOString();
      const safetyCopy = await serializeWerftBackup(undefined, safetyExportedAt);
      downloadText(
        `werft-before-restore-${safetyExportedAt.slice(0, 10)}.werft-backup`,
        safetyCopy,
        "application/json",
      );

      await restoreWerftBackup(incoming);
      setDataMessage("Страховочная копия сохранена, выбранная база восстановлена. Обновляем интерфейс…");
      window.setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      setDataMessage(error instanceof Error ? `Файл отклонён: ${error.message}` : "Файл копии недействителен.");
    } finally {
      setDataBusy(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function syncGithub() {
    setSyncing(true);
    setGithubError(undefined);
    try {
      const response = await fetch("/api/github/sync", { method: "POST", headers: { "content-type": "application/json" } });
      const payload = await response.json() as GithubSyncEnvelope | { error?: string };
      if (!response.ok || !("projects" in payload)) throw new Error("error" in payload ? payload.error : "GitHub sync failed");
      const result = await applyGithubSyncEnvelope(payload);
      setGithubError(`Обновлено проектов: ${result.updatedProjectIds.length}${result.errors.length ? ` · ошибок: ${result.errors.length}` : ""}.`);
      setGithub(status => status ? { ...status, repositories: payload.projects.map(item => item.repository.fullName) } : status);
    } catch (error) {
      setGithubError(error instanceof Error ? error.message : "Синхронизация не удалась");
    } finally { setSyncing(false); }
  }

  async function logoutGithub() {
    await fetch("/api/github/logout", { method: "POST", headers: { "content-type": "application/json" } });
    setGithub(status => status ? { ...status, connected: false, owner: undefined, repositories: [] } : status);
  }

  return (
    <>
      <PageHeader eyebrow="Система" title="Настройки" description="Локальные данные, стартовый режим, GitHub-мост и информация о версии." />

      <div className="settings-layout">
        <div className="grid">
          <Panel title="Запуск на этом устройстве" description="Настройка остаётся локальной и не будет синхронизироваться">
            <div className="start-choice">
              <button className={startView === "overview" ? "is-selected" : ""} onClick={() => void setStartView("overview")}>
                <span className="choice-icon"><Icon name="overview" /></span>
                <span><strong>Обзор Верфи</strong><small>Состояние, сигналы и свежие релизы</small></span>
                <span className="radio-dot" />
              </button>
              <button className={startView === "dock" ? "is-selected" : ""} onClick={() => void setStartView("dock")}>
                <span className="choice-icon"><Icon name="dock" /></span>
                <span><strong>Быстрый док</strong><small>Одно нажатие до любого приложения</small></span>
                <span className="radio-dot" />
              </button>
            </div>
          </Panel>

          <Panel title="Локальные данные Верфи" description="Экспорт — переносимый контракт для будущей синхронизации">
            <div className="settings-data-row">
              <span className="settings-icon"><Icon name="database" /></span>
              <div><strong>IndexedDB этого origin</strong><p>{projects.length} проектов, приватные заметки, идеи, настройки и история обслуживания.</p><span className="source-line"><Icon name="shield" /> Файлы экспорта приватны и пока не шифруются</span></div>
              <div className="settings-actions"><button className="button primary" disabled={dataBusy} onClick={() => void exportData()}><Icon name="download" /> Экспорт .werft-backup</button><button className="button" disabled={dataBusy} onClick={() => fileInput.current?.click()}><Icon name="backup" /> Восстановить</button><input ref={fileInput} hidden type="file" accept=".werft-backup,.json,application/json" onChange={event => { const file = event.target.files?.[0]; if (file) void importData(file); }} /></div>
            </div>
            {dataMessage ? <div className="inline-message"><Icon name="check" />{dataMessage}</div> : null}
          </Panel>

          <Panel title="GitHub · только чтение" description="Приватный серверный мост; токен не попадает в браузер">
            <div className="github-settings">
              <span className="github-mark"><Icon name="github" /></span>
              <div className="github-copy">
                <div className="cluster"><strong>{github === undefined ? "Проверяем конфигурацию…" : github.connected ? `Подключён @${github.owner?.login ?? "owner"}` : github.configured ? "Готов к подключению" : "Не настроен на сервере"}</strong><StatusPill tone={github?.connected ? "good" : github?.configured ? "warn" : "neutral"}>{github === undefined ? "loading" : github.connected ? "read-only" : github.configured ? "offline" : "env required"}</StatusPill></div>
                <p>{github?.connected ? `Доступны: ${github.repositories.length ? github.repositories.join(", ") : "репозитории ещё не синхронизированы"}.` : github === undefined ? "Получаем безопасный статус серверного моста." : "OAuth разрешает Верфи читать allowlist репозиториев и обновлять версии, стек, changelog и delivery-сигналы."}</p>
                {github?.expiresAt ? <span className="source-line"><Icon name="clock" /> Сессия до {formatDate(github.expiresAt)}</span> : null}
              </div>
              <div className="settings-actions">
                {github?.connected ? <><button className="button primary" disabled={syncing} onClick={() => void syncGithub()}><Icon name="sync" /> {syncing ? "Сверяем…" : "Сверить сейчас"}</button><button className="button" onClick={() => void logoutGithub()}>Отключить</button></> : github === undefined ? <button className="button primary" disabled><span className="loading-spinner" /> Проверяем…</button> : <a className={`button primary${!github.configured ? " is-disabled" : ""}`} href={github.configured ? "/api/github/auth/start?returnTo=/settings" : undefined}><Icon name="github" /> Подключить GitHub</a>}
              </div>
            </div>
            {githubError ? <div className="inline-message"><Icon name="sync" />{githubError}</div> : null}
          </Panel>
        </div>

        <aside className="grid">
          <button className="version-card panel" onClick={() => setVersionOpen(true)}>
            <WerftMark />
            <span><small>Версия приложения</small><strong>Верфь {APP_VERSION}</strong><em>Открыть журнал изменений <Icon name="chevron" /></em></span>
          </button>
          <Panel title="Граница приватности">
            <ul className="privacy-list"><li><Icon name="check" /><span><strong>Заметки</strong><small>только IndexedDB</small></span></li><li><Icon name="check" /><span><strong>GitHub OAuth</strong><small>encrypted HttpOnly cookie</small></span></li><li><Icon name="check" /><span><strong>Публичная витрина</strong><small>отдельная очищенная проекция — позже</small></span></li><li><Icon name="alert" /><span><strong>Экспорт Верфи</strong><small>приватный, но без шифрования</small></span></li></ul>
          </Panel>
          <Panel title="Развёртывание">
            <p className="settings-note">Отдельный Vercel-origin изолирует хранилище Верфи от GitHub Pages-приложений. Сервер понадобится только для OAuth, а позже — для синхронизации между вашими устройствами.</p>
          </Panel>
        </aside>
      </div>

      {versionOpen ? <VersionDialog onClose={() => setVersionOpen(false)} /> : null}
    </>
  );
}

function VersionDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="modal-card version-dialog" role="dialog" aria-modal="true" aria-labelledby="version-title" onClick={event => event.stopPropagation()}>
        <header className="modal-head"><div><p className="eyebrow">Журнал Верфи</p><h2 id="version-title">Версия {APP_VERSION}</h2></div><button className="icon-button" onClick={onClose} aria-label="Закрыть"><Icon name="close" /></button></header>
        <div className="modal-body">
          <div className="release-history-list">
            {APP_RELEASE_HISTORY.map((release, index) => (
              <article className="version-release" key={release.version}>
                <div className="row-between"><span className={`status-pill ${index === 0 ? "good" : "neutral"}`}>Версия {release.version}</span><time>{release.releasedAt}</time></div>
                {release.sections.map(section => <section key={section.title}><h3>{section.title}</h3><ul>{section.items.map(item => <li key={item}><Icon name="check" />{item}</li>)}</ul></section>)}
              </article>
            ))}
          </div>
          <p className="source-line"><Icon name="journal" /> Канонический источник: CHANGELOG.md в корне репозитория.</p>
        </div>
        <footer className="modal-actions"><button className="button primary" onClick={onClose}>Готово</button></footer>
      </section>
    </div>
  );
}
