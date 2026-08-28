"use client";

import Link from "next/link";
import type {
  AttentionStatus,
  AvailabilityStatus,
  BackupPolicy,
  MaintenanceRule,
  Project,
  ProjectLifecycle,
  QualityResult,
} from "@/lib/domain";
import { Icon, type IconName } from "./icons";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="header-actions">{actions}</div> : null}
    </header>
  );
}

export function Panel({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`.trim()}>
      {title || action ? (
        <header className="panel-head">
          <div>
            {title ? <h2>{title}</h2> : null}
            {description ? <p>{description}</p> : null}
          </div>
          {action}
        </header>
      ) : null}
      <div className="panel-body">{children}</div>
    </section>
  );
}

export function StatCard({
  index,
  icon,
  label,
  value,
  note,
  tone,
}: {
  index: string;
  icon: IconName;
  label: string;
  value: React.ReactNode;
  note: React.ReactNode;
  tone?: "good" | "warn" | "bad";
}) {
  return (
    <article className={`panel stat-card${tone ? ` stat-${tone}` : ""}`} data-index={index}>
      <div className="stat-label"><Icon name={icon} />{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-note">{note}</div>
    </article>
  );
}

const availabilityText: Record<AvailabilityStatus, string> = {
  working: "Работает",
  degraded: "Есть сбои",
  unavailable: "Недоступен",
  unknown: "Не проверено",
};

const lifecycleText: Record<ProjectLifecycle, string> = {
  idea: "Идея",
  planning: "Планируется",
  active: "Развивается",
  maintenance: "Поддержка",
  paused: "На паузе",
  archived: "Архив",
};

const qualityText: Record<QualityResult, string> = {
  verified: "Подтверждено",
  "action-required": "Нужно исправить",
  warning: "Стоит улучшить",
  unknown: "Не проверено",
  "not-applicable": "Не применимо",
  exception: "Исключение",
};

export function StatusPill({
  tone = "neutral",
  children,
  dot = false,
}: {
  tone?: "good" | "warn" | "bad" | "neutral";
  children: React.ReactNode;
  dot?: boolean;
}) {
  return <span className={`status-pill ${tone}`}>{dot ? <span className={`signal is-${tone === "bad" ? "bad" : tone === "warn" ? "warning" : "good"}`} /> : null}{children}</span>;
}

export function AvailabilityPill({ value }: { value: AvailabilityStatus }) {
  const tone = value === "working" ? "good" : value === "degraded" ? "warn" : value === "unavailable" ? "bad" : "neutral";
  return <StatusPill tone={tone} dot>{availabilityText[value]}</StatusPill>;
}

export function LifecyclePill({ value }: { value: ProjectLifecycle }) {
  return <span className="chip">{lifecycleText[value]}</span>;
}

export function QualityPill({ value }: { value: QualityResult }) {
  const tone = value === "verified" ? "good" : value === "action-required" ? "bad" : value === "warning" ? "warn" : "neutral";
  return <StatusPill tone={tone}>{qualityText[value]}</StatusPill>;
}

export function AttentionPill({ value }: { value: AttentionStatus }) {
  if (value === "calm") return <StatusPill tone="good">Спокойно</StatusPill>;
  if (value === "overdue") return <StatusPill tone="bad">Просрочено</StatusPill>;
  return <StatusPill tone="warn">Скоро</StatusPill>;
}

export function ProjectAvatar({ project, size = "medium" }: { project: Project; size?: "small" | "medium" | "large" }) {
  return (
    <span className={`project-avatar avatar-${size}`} style={{ "--project-accent": project.accent } as React.CSSProperties}>
      {project.iconUrl ? (
        // Remote project icons can fail offline; the initials remain underneath.
        <>
          <span aria-hidden="true">{project.mark}</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={project.iconUrl} alt="" />
        </>
      ) : <span aria-hidden="true">{project.mark}</span>}
    </span>
  );
}

export function ProjectIdentity({ project, compact = false }: { project: Project; compact?: boolean }) {
  return (
    <div className="project-identity">
      <ProjectAvatar project={project} size={compact ? "small" : "medium"} />
      <span>
        <strong>{project.name}</strong>
        <small>{project.repositoryName} · v{project.version}</small>
      </span>
    </div>
  );
}

export function ProjectCard({ project }: { project: Project }) {
  const appLink = project.links.find(link => link.kind === "app");
  return (
    <article className="panel project-card" style={{ "--project-accent": project.accent } as React.CSSProperties}>
      <div className="project-card-top">
        <ProjectIdentity project={project} />
        <AvailabilityPill value={project.availability} />
      </div>
      <p>{project.summary}</p>
      <div className="cluster project-tags">
        {project.stack.slice(0, 3).map(item => <span className="chip" key={item}>{item}</span>)}
      </div>
      <div className="project-card-foot">
        <AttentionPill value={project.attention} />
        <span className="cluster">
          {appLink ? <a className="icon-button compact-icon" href={appLink.href} target="_blank" rel="noreferrer" aria-label={`Открыть ${project.name}`}><Icon name="external" /></a> : null}
          <Link className="button compact" href={`/projects/${project.slug}`}>Карточка <Icon name="chevron" /></Link>
        </span>
      </div>
    </article>
  );
}

export function LoadingPanel({ label = "Сверяем журнал Верфи…" }: { label?: string }) {
  return <div className="panel loading-panel"><span className="loading-spinner" /><span>{label}</span></div>;
}

export function EmptyState({ icon, title, children }: { icon: IconName; title: string; children: React.ReactNode }) {
  return <div className="empty-state"><div><Icon name={icon} /><h3>{title}</h3><p>{children}</p></div></div>;
}

export function formatDate(value?: string, options?: Intl.DateTimeFormatOptions) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ru-RU", options ?? { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export function relativeDate(value?: string) {
  if (!value) return "нет данных";
  const days = Math.round((new Date(value).getTime() - Date.now()) / 86_400_000);
  if (days === 0) return "сегодня";
  if (days === 1) return "завтра";
  if (days === -1) return "вчера";
  if (days > 0) return `через ${days} дн.`;
  return `${Math.abs(days)} дн. назад`;
}

export function effectiveMaintenanceStatus(rule: MaintenanceRule, now: Date) {
  if (rule.status === "completed" || rule.status === "excluded") return rule.status;
  const due = new Date(rule.dueAt).getTime();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const endOfToday = startOfToday + 86_400_000;
  if (due < startOfToday) return "overdue" as const;
  if (due < endOfToday) return "due" as const;
  return "upcoming" as const;
}

export function maintenanceTone(rule: MaintenanceRule, now = new Date()) {
  const status = effectiveMaintenanceStatus(rule, now);
  return status === "overdue" || status === "due" ? "bad" : status === "upcoming" ? "warn" : status === "completed" ? "good" : "neutral";
}

export function effectiveBackupStatus(policy: BackupPolicy, now: Date) {
  if (policy.status === "excluded" || policy.status === "not-configured" || !policy.nextDueAt) return policy.status;
  const delta = new Date(policy.nextDueAt).getTime() - now.getTime();
  if (delta < 0) return "overdue" as const;
  if (delta <= 2 * 86_400_000) return "due-soon" as const;
  return "fresh" as const;
}

export function backupTone(policy: BackupPolicy, now = new Date()) {
  const status = effectiveBackupStatus(policy, now);
  return status === "fresh" ? "good" : status === "overdue" ? "bad" : status === "due-soon" || status === "not-configured" ? "warn" : "neutral";
}

export function downloadText(filename: string, content: string, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  anchor.hidden = true;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(href), 1_000);
}
