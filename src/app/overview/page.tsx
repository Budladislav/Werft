"use client";

import Link from "next/link";
import { useState } from "react";
import {
  useMaintenanceRules,
  useProjects,
  useQualityAssessments,
  useReleases,
  useSyncEvents,
} from "@/data";
import { Icon } from "@/components/icons";
import {
  AttentionPill,
  AvailabilityPill,
  LoadingPanel,
  PageHeader,
  Panel,
  ProjectIdentity,
  StatCard,
  effectiveMaintenanceStatus,
  formatDate,
  relativeDate,
} from "@/components/ui";

export default function OverviewPage() {
  const projects = useProjects();
  const releases = useReleases();
  const maintenance = useMaintenanceRules();
  const quality = useQualityAssessments();
  const syncEvents = useSyncEvents();
  const [now] = useState(() => new Date());

  if (!projects || !releases || !maintenance || !quality || !syncEvents) return <LoadingPanel />;

  const active = projects.filter(project => project.lifecycle === "active").length;
  const criticalQuality = quality.filter(item => item.result === "action-required").length;
  const due = maintenance.filter(item => {
    const status = effectiveMaintenanceStatus(item, now);
    return status === "overdue" || status === "due";
  });
  const latest = [...releases].sort((a, b) => b.releasedAt.localeCompare(a.releasedAt))[0];
  const latestProject = projects.find(project => project.id === latest?.projectId);
  const attention = [...projects]
    .filter(project => project.attention !== "calm")
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const latestSync = [...syncEvents].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))[0];

  return (
    <>
      <PageHeader
        eyebrow={`Сводка · ${formatDate(now.toISOString(), { day: "numeric", month: "long" })}`}
        title="Экосистема под контролем"
        description="Состояние проектов, свежие релизы и обслуживание — на одном мостике."
        actions={
          <>
            <Link className="button" href="/journal"><Icon name="journal" /> Сквозной журнал</Link>
            <Link className="button primary" href="/dock"><Icon name="dock" /> Открыть док</Link>
          </>
        }
      />

      <section className="grid four overview-stats" aria-label="Ключевые показатели">
        <StatCard index="01" icon="projects" label="Проектов в строю" value={projects.length} note={`${active} активно развиваются`} tone="good" />
        <StatCard index="02" icon="maintenance" label="Требуют внимания" value={due.length} note="задач обслуживания" tone={due.length ? "bad" : "good"} />
        <StatCard index="03" icon="shield" label="Werft Standard" value={`${quality.filter(item => item.result === "verified").length}/${quality.length}`} note={`${criticalQuality} обязательных исправлений`} tone={criticalQuality ? "warn" : "good"} />
        <StatCard index="04" icon="sync" label="GitHub-срез" value={relativeDate(latestSync?.occurredAt)} note={latestSync?.summary ?? "Синхронизаций пока нет"} />
      </section>

      <section className="overview-layout section-gap">
        <div className="overview-main grid">
          <Panel
            title="Флот проектов"
            description="Рабочее состояние и текущий приоритет"
            action={<Link className="text-link small-link" href="/projects">Вся библиотека <Icon name="arrow" /></Link>}
          >
            <div className="fleet-list">
              {projects.map(project => (
                <Link href={`/projects/${project.slug}`} className="fleet-row" key={project.id}>
                  <ProjectIdentity project={project} compact />
                  <span className="fleet-summary">{project.summary}</span>
                  <span className="cluster fleet-status"><AvailabilityPill value={project.availability} /><AttentionPill value={project.attention} /></span>
                  <Icon name="chevron" />
                </Link>
              ))}
            </div>
          </Panel>

          <Panel
            title="Последние спуски"
            description="Общий журнал изменений всех приложений"
            action={<Link className="button compact" href="/journal">Смотреть журнал</Link>}
          >
            <div className="release-stream">
              {[...releases].sort((a, b) => b.releasedAt.localeCompare(a.releasedAt)).slice(0, 4).map(release => {
                const project = projects.find(item => item.id === release.projectId);
                if (!project) return null;
                return (
                  <article className="release-row" key={release.id}>
                    <span className="release-line" style={{ background: project.accent }} />
                    <div>
                      <div className="cluster"><strong>{project.name}</strong><span className="mono release-version">v{release.version}</span></div>
                      <h3>{release.title}</h3>
                      <p>{release.entries[0]?.text}</p>
                    </div>
                    <time>{formatDate(release.releasedAt, { day: "2-digit", month: "short" })}</time>
                  </article>
                );
              })}
            </div>
          </Panel>
        </div>

        <aside className="overview-side grid">
          <Panel title="Сейчас на стапеле" description="Главный свежий результат">
            {latest && latestProject ? (
              <div className="featured-release">
                <ProjectIdentity project={latestProject} />
                <span className="featured-version mono">v{latest.version}</span>
                <h3>{latest.title}</h3>
                <p>{latest.entries[0]?.text}</p>
                <Link className="button primary" href={`/projects/${latestProject.slug}`}>Открыть проект <Icon name="arrow" /></Link>
              </div>
            ) : null}
          </Panel>

          <Panel title="Сигналы внимания" description="Сначала то, что может подвести">
            <div className="signal-list">
              {attention.slice(0, 4).map(project => {
                const projectDue = due.filter(rule => rule.projectId === project.id).length;
                return (
                  <Link href={`/projects/${project.slug}`} key={project.id} className="signal-row">
                    <span className={`signal ${project.attention === "overdue" ? "is-bad" : "is-warning"}`} />
                    <span><strong>{project.name}</strong><small>{projectDue ? `${projectDue} задач обслуживания` : "проверить состояние"}</small></span>
                    <AttentionPill value={project.attention} />
                  </Link>
                );
              })}
            </div>
            <Link className="button full-button section-gap" href="/maintenance"><Icon name="maintenance" /> К обслуживанию</Link>
          </Panel>

          <div className="privacy-note">
            <Icon name="shield" />
            <div><strong>Приватный локальный контур</strong><p>Заметки и состояние Верфи хранятся только на этом устройстве. GitHub подключается в режиме чтения.</p></div>
          </div>
        </aside>
      </section>
    </>
  );
}
