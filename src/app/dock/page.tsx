"use client";

import Link from "next/link";
import { useProjects } from "@/data";
import { Icon } from "@/components/icons";
import { LoadingPanel, PageHeader, ProjectAvatar, StatusPill } from "@/components/ui";

export default function DockPage() {
  const projects = useProjects();
  if (!projects) return <LoadingPanel label="Готовим быстрый док…" />;

  return (
    <div className="dock-page">
      <PageHeader
        eyebrow="Быстрый режим"
        title="Док приложений"
        description="Первое нажатие открывает приложение. Карточка проекта остаётся отдельным, вторичным действием."
        actions={<Link className="button" href="/settings"><Icon name="settings" /> Стартовый экран</Link>}
      />

      <div className="dock-statusbar">
        <span><span className="signal is-good" /> {projects.filter(project => project.availability === "working").length} приложений готовы</span>
        <span className="mono">LOCAL DOCK · PWA</span>
      </div>

      <section className="dock-grid" aria-label="Приложения">
        {projects.map(project => {
          const app = project.links.find(link => link.kind === "app");
          return (
            <article className="dock-tile" key={project.id} style={{ "--project-accent": project.accent } as React.CSSProperties}>
              {app ? (
                <a className="dock-launch" href={app.href} target="_blank" rel="noreferrer" aria-label={`Открыть приложение ${project.name}`}>
                  <ProjectAvatar project={project} size="large" />
                  <span className="dock-name">{project.name}</span>
                  <span className="dock-meta"><span className={`signal ${project.availability === "working" ? "is-good" : "is-warning"}`} /> v{project.version}</span>
                </a>
              ) : (
                <div className="dock-launch is-disabled">
                  <ProjectAvatar project={project} size="large" />
                  <span className="dock-name">{project.name}</span>
                  <StatusPill>Нет ссылки</StatusPill>
                </div>
              )}
              <Link className="dock-detail" href={`/projects/${project.slug}`} aria-label={`Карточка проекта ${project.name}`}>
                Карточка <Icon name="chevron" />
              </Link>
            </article>
          );
        })}
        <Link className="dock-tile dock-new" href="/ideas">
          <span className="dock-plus"><Icon name="plus" /></span>
          <span className="dock-name">Новый стапель</span>
          <span className="dock-meta">Собрать идею</span>
        </Link>
      </section>

      <div className="dock-tip">
        <Icon name="mobile" />
        <div><strong>Папка приложений без лишнего шага</strong><p>Сделайте Док стартовым экраном в настройках и запускайте установленную Верфь сразу в этом режиме.</p></div>
        <Link className="button compact" href="/settings">Настроить</Link>
      </div>
    </div>
  );
}
