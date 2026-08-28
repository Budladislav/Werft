"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  removeProjectNote,
  upsertProjectNote,
  useBackupPolicies,
  useMaintenanceRules,
  useNotes,
  useProjectBySlug,
  useQualityAssessments,
  useReleases,
} from "@/data";
import { standardControls, WERFT_STANDARD_VERSION } from "@/data/standard";
import { Icon } from "@/components/icons";
import {
  AttentionPill,
  AvailabilityPill,
  EmptyState,
  LifecyclePill,
  LoadingPanel,
  Panel,
  ProjectAvatar,
  QualityPill,
  StatusPill,
  backupTone,
  effectiveBackupStatus,
  effectiveMaintenanceStatus,
  formatDate,
  maintenanceTone,
  relativeDate,
} from "@/components/ui";
import type { ProjectNote } from "@/lib/domain";

type Tab = "passport" | "journal" | "quality" | "care" | "notes";

export default function ProjectDetailPage() {
  const params = useParams<{ slug: string }>();
  const project = useProjectBySlug(params.slug);
  const releases = useReleases(project?.id);
  const notes = useNotes(project?.id);
  const maintenance = useMaintenanceRules(project?.id);
  const policies = useBackupPolicies(project?.id);
  const assessments = useQualityAssessments(project?.id);
  const [tab, setTab] = useState<Tab>("passport");
  const [now] = useState(() => new Date());
  const [editing, setEditing] = useState<ProjectNote | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);

  if (project === undefined || releases === undefined || notes === undefined || maintenance === undefined || policies === undefined || assessments === undefined) {
    return <LoadingPanel label="Поднимаем паспорт проекта…" />;
  }

  if (!project) {
    return <Panel><EmptyState icon="projects" title="Проект не найден">Возможно, карточка была переименована или удалена из локальной базы.</EmptyState></Panel>;
  }

  const appLink = project.links.find(link => link.kind === "app");
  const repositoryLink = project.links.find(link => link.kind === "repository");
  const verified = assessments.filter(item => item.result === "verified").length;

  return (
    <>
      <Link className="back-link" href="/projects"><Icon name="arrow" /> Библиотека проектов</Link>
      <header className="project-hero panel" style={{ "--project-accent": project.accent } as React.CSSProperties}>
        <div className="project-hero-main">
          <ProjectAvatar project={project} size="large" />
          <div>
            <p className="eyebrow">{project.repositoryVisibility === "private" ? "Приватный проект" : "Публичный проект"} · {project.repositoryName}</p>
            <h1>{project.name}</h1>
            <p>{project.summary}</p>
            <div className="cluster hero-status"><AvailabilityPill value={project.availability} /><LifecyclePill value={project.lifecycle} /><AttentionPill value={project.attention} /><span className="chip mono">v{project.version}</span></div>
          </div>
        </div>
        <div className="project-hero-actions">
          {repositoryLink ? <a className="button" href={repositoryLink.href} target="_blank" rel="noreferrer"><Icon name="github" /> Репозиторий</a> : null}
          {appLink ? <a className="button primary" href={appLink.href} target="_blank" rel="noreferrer">Открыть приложение <Icon name="external" /></a> : null}
        </div>
        <span className="blueprint-number mono">{String(project.sortOrder).padStart(2, "0")}</span>
      </header>

      <nav className="project-tabs" aria-label="Разделы проекта">
        {([
          ["passport", "Паспорт", "projects"],
          ["journal", `Журнал · ${releases.length}`, "journal"],
          ["quality", `Стандарт · ${verified}/${assessments.length}`, "shield"],
          ["care", `Сервис · ${maintenance.length}`, "maintenance"],
          ["notes", `Заметки · ${notes.length}`, "note"],
        ] as const).map(([value, label, icon]) => (
          <button key={value} className={tab === value ? "is-active" : ""} onClick={() => setTab(value)}><Icon name={icon} />{label}</button>
        ))}
      </nav>

      <div className="project-tab-content">
        {tab === "passport" ? <Passport project={project} /> : null}
        {tab === "journal" ? <ProjectJournal releases={releases} /> : null}
        {tab === "quality" ? <ProjectQuality assessments={assessments} /> : null}
        {tab === "care" ? <ProjectCare projectName={project.name} maintenance={maintenance} policies={policies} now={now} /> : null}
        {tab === "notes" ? (
          <ProjectNotes
            notes={notes}
            onCreate={() => { setEditing(null); setNoteOpen(true); }}
            onEdit={note => { setEditing(note); setNoteOpen(true); }}
          />
        ) : null}
      </div>

      {noteOpen ? <NoteDialog projectId={project.id} note={editing} onClose={() => setNoteOpen(false)} /> : null}
    </>
  );
}

function Passport({ project }: { project: NonNullable<ReturnType<typeof useProjectBySlug>> }) {
  return (
    <div className="detail-grid">
      <div className="grid">
        <Panel title="Технический паспорт" description="Наблюдаемые факты отделены от ручных заметок">
          <dl className="fact-grid">
            <div><dt>Старт проекта</dt><dd>{formatDate(project.startedAt)} {project.startedAtInferred ? <span className="inferred">оценка по Git</span> : null}</dd></div>
            <div><dt>Последний релиз</dt><dd>{formatDate(project.latestReleaseAt)}</dd></div>
            <div><dt>Последняя активность</dt><dd>{relativeDate(project.lastActivityAt)}</dd></div>
            <div><dt>Режим данных</dt><dd>{project.dataProfile.mode === "local-only" ? "Только устройство" : project.dataProfile.mode === "cloud" ? "Облако" : "Гибридный"}</dd></div>
          </dl>
          <hr className="divider" />
          <div className="facts-list">
            {project.facts.map(fact => (
              <div className="fact-row" key={fact.key}>
                <span>{fact.label}</span>
                <strong>{fact.value}</strong>
                <span className="source-line"><Icon name={fact.source === "github" ? "github" : "code"} /> {fact.source}{fact.inferred ? " · выведено" : ""}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Что умеет" description="Основные контуры продукта">
          <ul className="capability-list">
            {project.capabilities.map(item => <li key={item}><Icon name="check" />{item}</li>)}
          </ul>
        </Panel>
      </div>

      <aside className="grid">
        <Panel title="Технологии">
          <div className="stack-cloud">{project.stack.map(item => <span className="chip" key={item}>{item}</span>)}</div>
        </Panel>
        <Panel title="Контур данных">
          <StatusPill tone={project.dataProfile.sensitivity === "public" ? "good" : project.dataProfile.sensitivity === "sensitive" ? "bad" : "warn"}>{project.dataProfile.sensitivity === "sensitive" ? "Чувствительные данные" : project.dataProfile.sensitivity === "private" ? "Приватные данные" : "Публичные данные"}</StatusPill>
          <ul className="store-list">{project.dataProfile.stores.map(store => <li key={store}><Icon name="database" />{store}</li>)}</ul>
        </Panel>
        <Panel title="Ссылки">
          <div className="link-list">{project.links.map(link => <a key={link.href} href={link.href} target="_blank" rel="noreferrer"><span>{link.label}<small>{link.kind}</small></span><Icon name="external" /></a>)}</div>
        </Panel>
      </aside>
    </div>
  );
}

function ProjectJournal({ releases }: { releases: NonNullable<ReturnType<typeof useReleases>> }) {
  if (!releases.length) return <Panel><EmptyState icon="journal" title="Журнал пока пуст">GitHub-синхронизация добавит записи из канонического changelog.</EmptyState></Panel>;
  return (
    <Panel title="История релизов" description="Данные из changelog проекта">
      <div className="timeline">
        {[...releases].sort((a, b) => b.releasedAt.localeCompare(a.releasedAt)).map(release => (
          <article className="timeline-item" key={release.id}>
            <div className="timeline-date"><strong>{formatDate(release.releasedAt, { day: "2-digit", month: "short" })}</strong><small>{new Date(release.releasedAt).getFullYear()}</small></div>
            <span className="timeline-pin" />
            <div className="timeline-content">
              <div className="row-between"><div><span className="mono release-version">v{release.version}</span><h3>{release.title}</h3></div>{release.sourceUrl ? <a href={release.sourceUrl} target="_blank" rel="noreferrer" className="icon-button compact-icon" aria-label="Открыть источник"><Icon name="external" /></a> : null}</div>
              <ul>{release.entries.map(entry => <li key={entry.id}><span className={`change-tag ${entry.category}`}>{entry.category}</span>{entry.text}</li>)}</ul>
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function ProjectQuality({ assessments }: { assessments: NonNullable<ReturnType<typeof useQualityAssessments>> }) {
  const byControl = useMemo(() => new Map(assessments.map(item => [item.controlId, item])), [assessments]);
  return (
    <Panel title={`Werft Standard ${WERFT_STANDARD_VERSION}`} description="Единый технический ориентир для настоящих и будущих проектов">
      <div className="quality-list">
        {standardControls.map((control, index) => {
          const item = byControl.get(control.id);
          if (!item) return null;
          return (
            <article className="quality-row" key={control.id}>
              <span className="quality-index mono">{String(index + 1).padStart(2, "0")}</span>
              <div><div className="cluster"><h3>{control.title}</h3><span className="chip">{control.area}</span>{control.severity === "required" ? <span className="required-mark">обязательно</span> : null}</div><p>{item.evidence}</p>{item.remediation ? <div className="remediation"><Icon name="arrow" />{item.remediation}</div> : null}</div>
              <QualityPill value={item.result} />
            </article>
          );
        })}
      </div>
    </Panel>
  );
}

function ProjectCare({ projectName, maintenance, policies, now }: { projectName: string; maintenance: NonNullable<ReturnType<typeof useMaintenanceRules>>; policies: NonNullable<ReturnType<typeof useBackupPolicies>>; now: Date }) {
  return (
    <div className="detail-grid">
      <Panel title="Обслуживание" description={`Контрольные задачи ${projectName}`}>
        <div className="care-list">
          {maintenance.map(rule => { const status = effectiveMaintenanceStatus(rule, now); return <article className="care-row" key={rule.id}><span className={`care-icon ${maintenanceTone(rule, now)}`}><Icon name={rule.kind === "backup" ? "backup" : rule.kind === "release" ? "journal" : "maintenance"} /></span><div><div className="cluster"><h3>{rule.title}</h3><StatusPill tone={maintenanceTone(rule, now)}>{status}</StatusPill></div><p>{rule.description}</p><span className="source-line"><Icon name="calendar" /> {formatDate(rule.dueAt)} · {relativeDate(rule.dueAt)}</span></div></article>; })}
        </div>
      </Panel>
      <Panel title="Резервные копии" description="Политика до подключения адаптеров">
        {policies.map(policy => { const status = effectiveBackupStatus(policy, now); return <div className="backup-card" key={policy.id}><div className="row-between"><Icon name={policy.mode === "excluded" ? "shield" : "backup"} /><StatusPill tone={backupTone(policy, now)}>{status === "excluded" ? "Исключён" : status === "not-configured" ? "Адаптер не готов" : status}</StatusPill></div><h3>{policy.format ?? "Формат не указан"}</h3><p>{policy.reason}</p>{policy.priority ? <span className="mono backup-priority">ПРИОРИТЕТ {String(policy.priority).padStart(2, "0")}</span> : null}</div>; })}
      </Panel>
    </div>
  );
}

function ProjectNotes({ notes, onCreate, onEdit }: { notes: NonNullable<ReturnType<typeof useNotes>>; onCreate: () => void; onEdit: (note: ProjectNote) => void }) {
  function remove(note: ProjectNote) {
    if (window.confirm(`Удалить заметку «${note.title}»?`)) void removeProjectNote(note.id);
  }
  return (
    <Panel title="Приватные заметки" description="Не читаются из GitHub и не входят в публичную витрину" action={<button className="button primary compact" onClick={onCreate}><Icon name="plus" /> Добавить</button>}>
      {notes.length ? <div className="note-grid">{[...notes].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt)).map(note => <article className="note-card" key={note.id}><div className="row-between"><span className="note-icon"><Icon name="note" /></span>{note.pinned ? <StatusPill tone="warn">Закреплено</StatusPill> : null}</div><h3>{note.title}</h3><p>{note.body}</p><div className="row-between"><small>{formatDate(note.updatedAt)}</small><div className="cluster"><button className="button compact" onClick={() => onEdit(note)}>Изменить</button><button className="icon-button compact-icon danger-action" onClick={() => remove(note)} aria-label={`Удалить заметку ${note.title}`}><Icon name="close" /></button></div></div></article>)}</div> : <EmptyState icon="note" title="Заметок пока нет">Сохраните сюда контекст, гипотезу или следующий шаг. Эти записи останутся только в локальной базе Верфи.</EmptyState>}
    </Panel>
  );
}

function NoteDialog({ projectId, note, onClose }: { projectId: string; note: ProjectNote | null; onClose: () => void }) {
  const [title, setTitle] = useState(note?.title ?? "");
  const [body, setBody] = useState(note?.body ?? "");
  const [pinned, setPinned] = useState(note?.pinned ?? false);
  const [saving, setSaving] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    await upsertProjectNote({ id: note?.id, projectId, title: title.trim(), body: body.trim(), pinned });
    onClose();
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <form className="modal-card" role="dialog" aria-modal="true" aria-labelledby="note-dialog-title" onClick={event => event.stopPropagation()} onSubmit={save}>
        <header className="modal-head"><div><p className="eyebrow">Приватная запись</p><h2 id="note-dialog-title">{note ? "Изменить заметку" : "Новая заметка"}</h2></div><button type="button" className="icon-button" onClick={onClose} aria-label="Закрыть"><Icon name="close" /></button></header>
        <div className="modal-body grid">
          <label className="field"><span>Заголовок</span><input className="input" autoFocus required maxLength={120} value={title} onChange={event => setTitle(event.target.value)} /></label>
          <label className="field"><span>Контекст или следующий шаг</span><textarea className="textarea" required value={body} onChange={event => setBody(event.target.value)} /></label>
          <label className="check-field"><input type="checkbox" checked={pinned} onChange={event => setPinned(event.target.checked)} /><span><strong>Закрепить</strong><small>Показывать выше остальных заметок</small></span></label>
        </div>
        <footer className="modal-actions"><button type="button" className="button" onClick={onClose}>Отмена</button><button className="button primary" disabled={saving || !title.trim() || !body.trim()}>{saving ? "Сохраняем…" : "Сохранить"}</button></footer>
      </form>
    </div>
  );
}
