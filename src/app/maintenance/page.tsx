"use client";

import { useEffect, useMemo, useState } from "react";
import {
  completeMaintenanceRule,
  updateMaintenanceRule,
  useBackupPolicies,
  useMaintenanceRules,
  useProjects,
} from "@/data";
import { Icon } from "@/components/icons";
import {
  EmptyState,
  LoadingPanel,
  PageHeader,
  Panel,
  ProjectIdentity,
  StatusPill,
  backupTone,
  effectiveBackupStatus,
  effectiveMaintenanceStatus,
  formatDate,
  maintenanceTone,
  relativeDate,
} from "@/components/ui";
import type { MaintenanceRule } from "@/lib/domain";

export default function MaintenancePage() {
  const projects = useProjects();
  const rules = useMaintenanceRules();
  const policies = useBackupPolicies();
  const [busy, setBusy] = useState<string>();
  const [actionError, setActionError] = useState<string>();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const displayRules = useMemo(() => rules?.map(rule => ({ ...rule, status: effectiveMaintenanceStatus(rule, now) })) ?? [], [now, rules]);
  const activeRules = displayRules.filter(rule => rule.status !== "completed" && rule.status !== "excluded");
  const urgent = activeRules.filter(rule => rule.status === "due" || rule.status === "overdue").sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const planned = activeRules.filter(rule => rule.status === "upcoming").sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const excluded = displayRules.filter(rule => rule.status === "excluded");

  if (!projects || !rules || !policies) return <LoadingPanel label="Проверяем регламентные работы…" />;

  async function complete(rule: MaintenanceRule) {
    setBusy(rule.id);
    setActionError(undefined);
    try {
      await completeMaintenanceRule(rule.id, "Выполнено вручную из интерфейса Верфи.");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Не удалось отметить работу выполненной.");
    } finally {
      setBusy(undefined);
    }
  }

  async function snooze(rule: MaintenanceRule) {
    const dueAt = new Date(Date.now() + 7 * 86_400_000).toISOString();
    setBusy(rule.id);
    setActionError(undefined);
    try {
      await updateMaintenanceRule(rule.id, { status: "snoozed", dueAt });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Не удалось перенести работу.");
    } finally {
      setBusy(undefined);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Эксплуатация"
        title="Обслуживание"
        description="Бэкапы, качество, хостинг и выпуск — всё, что нельзя бесконечно держать в голове."
      />

      <section className="grid four maintenance-stats">
        <div className="panel mini-stat"><span className="signal is-bad" /><div><strong>{urgent.length}</strong><small>нужно сделать</small></div></div>
        <div className="panel mini-stat"><span className="signal is-warning" /><div><strong>{planned.length}</strong><small>запланировано</small></div></div>
        <div className="panel mini-stat"><Icon name="backup" /><div><strong>{policies.filter(item => item.mode !== "excluded").length}</strong><small>backup-контуров</small></div></div>
        <div className="panel mini-stat"><Icon name="shield" /><div><strong>{excluded.length}</strong><small>осознанных исключений</small></div></div>
      </section>

      {actionError ? <div className="inline-message section-gap"><Icon name="alert" />{actionError}</div> : null}

      <div className="maintenance-layout section-gap">
        <div className="grid">
          <RulePanel title="Требует внимания" description="Просроченные и сегодняшние работы" rules={urgent} projects={projects} busy={busy} onComplete={complete} onSnooze={snooze} />
          <RulePanel title="На горизонте" description="Следующие работы по регламенту" rules={planned} projects={projects} busy={busy} onComplete={complete} onSnooze={snooze} />
          {excluded.length ? <RulePanel title="Исключено осознанно" description="Не ошибка, а зафиксированная граница" rules={excluded} projects={projects} busy={busy} onComplete={complete} onSnooze={snooze} readonly /> : null}
        </div>

        <aside>
          <Panel title="Backup pipeline" description="Очередь подключения адаптеров">
            <div className="backup-pipeline">
              {[...policies].sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99)).map(policy => {
                const project = projects.find(item => item.id === policy.projectId);
                if (!project) return null;
                const app = project.links.find(link => link.kind === "app");
                const backupStatus = effectiveBackupStatus(policy, now);
                const backupStatusLabel = backupStatus === "not-configured"
                  ? "не настроен"
                  : backupStatus === "due-soon"
                    ? "скоро"
                    : backupStatus === "overdue"
                      ? "просрочен"
                      : backupStatus === "fresh"
                        ? "свежий"
                        : "исключён";
                return (
                  <article className={`pipeline-item${policy.mode === "excluded" ? " is-excluded" : ""}`} key={policy.id}>
                    <span className="pipeline-order mono">{policy.priority ? String(policy.priority).padStart(2, "0") : "—"}</span>
                    <ProjectIdentity project={project} compact />
                    <StatusPill tone={backupTone(policy, now)}>{backupStatusLabel}</StatusPill>
                    <p>{policy.reason}</p>
                    {policy.mode !== "excluded" && app ? <a className="button compact" href={app.href} target="_blank" rel="noreferrer"><Icon name="external" /> Открыть для экспорта</a> : <button className="button compact" disabled><Icon name="shield" /> Недоступно</button>}
                  </article>
                );
              })}
            </div>
          </Panel>
          <div className="safety-callout"><Icon name="shield" /><div><strong>Flow не участвует в общих бэкапах</strong><p>Финансовые данные останутся за этой границей, пока не появятся шифрование и проверенное атомарное восстановление.</p></div></div>
        </aside>
      </div>
    </>
  );
}

function RulePanel({ title, description, rules, projects, busy, onComplete, onSnooze, readonly = false }: { title: string; description: string; rules: MaintenanceRule[]; projects: NonNullable<ReturnType<typeof useProjects>>; busy?: string; onComplete: (rule: MaintenanceRule) => Promise<void>; onSnooze: (rule: MaintenanceRule) => Promise<void>; readonly?: boolean }) {
  return (
    <Panel title={title} description={description}>
      {rules.length ? <div className="maintenance-list">{rules.map(rule => {
        const project = projects.find(item => item.id === rule.projectId);
        return <article className="maintenance-row" key={rule.id}>
          <span className={`maintenance-kind ${maintenanceTone(rule)}`}><Icon name={rule.kind === "backup" ? "backup" : rule.kind === "release" ? "journal" : "maintenance"} /></span>
          <div className="maintenance-copy">
            <div className="cluster">{project ? <span className="chip">{project.name}</span> : <span className="chip">Экосистема</span>}<StatusPill tone={maintenanceTone(rule)}>{rule.status === "due" ? "сегодня" : rule.status === "overdue" ? "просрочено" : rule.status === "snoozed" ? "отложено" : rule.status === "excluded" ? "исключено" : "впереди"}</StatusPill></div>
            <h3>{rule.title}</h3><p>{rule.description}</p>
            <span className="source-line"><Icon name="calendar" /> {formatDate(rule.dueAt)} · {relativeDate(rule.dueAt)}</span>
          </div>
          {!readonly ? <div className="maintenance-actions"><button className="button compact primary" disabled={busy === rule.id} onClick={() => void onComplete(rule)}><Icon name="check" /> Готово</button><button className="button compact" disabled={busy === rule.id} onClick={() => void onSnooze(rule)}><Icon name="clock" /> +7 дней</button></div> : null}
        </article>;
      })}</div> : <EmptyState icon="check" title="Здесь спокойно">Работ для этого горизонта сейчас нет.</EmptyState>}
    </Panel>
  );
}
