"use client";

import { useMemo, useState } from "react";
import {
  createJournalJson,
  createJournalMarkdown,
  filterJournalReleases,
  journalExportFilename,
  journalRangeForPreset,
  useProjects,
  useReleases,
  werftJournalProject,
  werftJournalReleases,
} from "@/data";
import { Icon } from "@/components/icons";
import { EmptyState, LoadingPanel, PageHeader, ProjectAvatar, StatusPill, downloadText, formatDate } from "@/components/ui";
import type { ReleaseCategory } from "@/lib/domain";

type Period = "week" | "month" | "all" | "custom";

const categoryLabels: Record<ReleaseCategory, string> = {
  added: "Добавлено",
  changed: "Изменено",
  fixed: "Исправлено",
  security: "Безопасность",
};

export default function JournalPage() {
  const projects = useProjects();
  const releases = useReleases();
  const [now] = useState(() => new Date());
  const [period, setPeriod] = useState<Period>("month");
  const [projectId, setProjectId] = useState("all");
  const today = now.toISOString().slice(0, 10);
  const monthAgo = new Date(now.getTime() - 30 * 86_400_000).toISOString().slice(0, 10);
  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);
  const journalProjects = useMemo(
    () => projects ? [werftJournalProject, ...projects] : [],
    [projects],
  );
  const journalReleases = useMemo(
    () => releases ? [...releases, ...werftJournalReleases] : [],
    [releases],
  );

  const range = useMemo(() => {
    if (period === "all") return {};
    if (period === "custom") return { from, to };
    return journalRangeForPreset(period, now);
  }, [from, now, period, to]);

  const filtered = useMemo(() => {
    return filterJournalReleases(journalReleases, {
      ...range,
      projectIds: projectId === "all" ? undefined : [projectId],
    });
  }, [journalReleases, projectId, range]);

  if (!projects || !releases) return <LoadingPanel label="Собираем сквозной журнал…" />;

  function exportMarkdown() {
    const options = { ...range, generatedAt: now.toISOString() };
    downloadText(journalExportFilename("md", range), createJournalMarkdown(filtered, journalProjects, options), "text/markdown;charset=utf-8");
  }

  function exportJson() {
    const options = { ...range, generatedAt: now.toISOString() };
    downloadText(journalExportFilename("json", range), createJournalJson(filtered, journalProjects, options), "application/json");
  }

  const changes = filtered.reduce((count, release) => count + release.entries.length, 0);

  return (
    <>
      <PageHeader
        eyebrow="Общий ход работ"
        title="Сквозной журнал"
        description="Релизы всех проектов в одной хронологии — с выгрузкой для отчёта или архива."
      />

      <section className="journal-toolbar panel">
        <div>
          <span className="tool-label">Период</span>
          <div className="segmented">
            {([ ["week", "Неделя"], ["month", "Месяц"], ["all", "Всё"], ["custom", "Даты"] ] as const).map(([value, label]) => <button key={value} className={period === value ? "is-active" : ""} onClick={() => setPeriod(value)}>{label}</button>)}
          </div>
        </div>
        <label className="field journal-project-filter"><span>Проект</span><select className="select" value={projectId} onChange={event => setProjectId(event.target.value)}><option value="all">Все проекты</option>{journalProjects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
        {period === "custom" ? <div className="date-range"><label className="field"><span>С даты</span><input className="input" type="date" value={from} max={to} onInput={event => setFrom(event.currentTarget.value)} /></label><span>→</span><label className="field"><span>По дату</span><input className="input" type="date" value={to} min={from} onInput={event => setTo(event.currentTarget.value)} /></label></div> : null}
        <div className="journal-count"><strong>{filtered.length}</strong><span>релизов</span><i /> <strong>{changes}</strong><span>изменений</span></div>
        <div className="journal-export">
          <span className="tool-label">Скачать выбранное</span>
          <div>
            <button className="button" disabled={!filtered.length} onClick={exportJson}><Icon name="download" /> JSON</button>
            <button className="button primary" disabled={!filtered.length} onClick={exportMarkdown}><Icon name="download" /> Markdown</button>
          </div>
        </div>
      </section>

      {filtered.length ? (
        <section className="journal-feed section-gap">
          {filtered.map((release, index) => {
            const project = journalProjects.find(item => item.id === release.projectId);
            if (!project) return null;
            return (
              <article className="journal-entry panel" key={release.id} style={{ "--project-accent": project.accent } as React.CSSProperties}>
                <div className="journal-date"><span>{formatDate(release.releasedAt, { day: "2-digit" })}</span><strong>{formatDate(release.releasedAt, { month: "short" })}</strong><small>{new Date(release.releasedAt).getFullYear()}</small></div>
                <div className="journal-spine"><span /></div>
                <div className="journal-entry-body">
                  <header>
                    <div className="cluster"><ProjectAvatar project={project} size="small" /><strong>{project.name}</strong><StatusPill tone={index === 0 ? "good" : "neutral"}>v{release.version}</StatusPill></div>
                    {release.sourceUrl ? <a className="source-line" href={release.sourceUrl} target="_blank" rel="noreferrer"><Icon name="github" /> changelog <Icon name="external" /></a> : null}
                  </header>
                  <h2>{release.title}</h2>
                  <ul className="journal-changes">{release.entries.map(entry => <li key={entry.id}><span className={`change-tag ${entry.category}`}>{categoryLabels[entry.category]}</span><p>{entry.text}</p></li>)}</ul>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <div className="panel section-gap"><EmptyState icon="journal" title="В этом периоде релизов нет">Расширьте диапазон дат или выберите все проекты.</EmptyState></div>
      )}
    </>
  );
}
