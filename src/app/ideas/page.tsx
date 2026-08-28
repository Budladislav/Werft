"use client";

import { useMemo, useState } from "react";
import { removeFutureIdea, upsertFutureIdea, useIdeas, useProjects } from "@/data";
import { Icon } from "@/components/icons";
import { EmptyState, LoadingPanel, PageHeader, ProjectIdentity, StatusPill, formatDate } from "@/components/ui";
import type { FutureIdea } from "@/lib/domain";

type View = "all" | "ecosystem" | "project";

const stageLabel: Record<FutureIdea["stage"], string> = {
  draft: "Черновик",
  research: "Исследование",
  planned: "Запланировано",
  building: "В работе",
};

const nextStage: Record<FutureIdea["stage"], FutureIdea["stage"] | null> = {
  draft: "research",
  research: "planned",
  planned: "building",
  building: null,
};

export default function IdeasPage() {
  const ideas = useIdeas();
  const projects = useProjects();
  const [view, setView] = useState<View>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FutureIdea | null>(null);

  const filtered = useMemo(() => ideas?.filter(idea => view === "all" || idea.target === view) ?? [], [ideas, view]);
  if (!ideas || !projects) return <LoadingPanel label="Открываем конструкторское бюро…" />;

  function openCreate() { setEditing(null); setDialogOpen(true); }
  function openEdit(idea: FutureIdea) { setEditing(idea); setDialogOpen(true); }

  return (
    <>
      <PageHeader
        eyebrow="Будущие стапели"
        title="Конструкторское бюро"
        description="Место для проектов, которых ещё нет, и идей, которые пока рано превращать в задачи."
        actions={<button className="button primary" onClick={openCreate}><Icon name="plus" /> Новая ячейка</button>}
      />

      <section className="ideas-intro panel">
        <div><Icon name="spark" /><p className="eyebrow">Принцип бюро</p><h2>Идея живёт здесь, пока не готова выйти на стапель.</h2><p>Сохраняйте смысл, следующий проверяемый шаг и связь с проектом. Без ложных дедлайнов и преждевременной детализации.</p></div>
        <div className="idea-stage-legend">{Object.entries(stageLabel).map(([stage, label], index) => <span key={stage}><i>{String(index + 1).padStart(2, "0")}</i>{label}</span>)}</div>
      </section>

      <div className="ideas-toolbar">
        <div className="segmented">
          {([ ["all", "Все идеи"], ["ecosystem", "Экосистема"], ["project", "Проекты"] ] as const).map(([value, label]) => <button key={value} className={view === value ? "is-active" : ""} onClick={() => setView(value)}>{label}</button>)}
        </div>
        <span className="mono muted">{filtered.length} ячеек</span>
      </div>

      {filtered.length ? (
        <section className="idea-grid">
          {[...filtered].sort((a, b) => a.stage.localeCompare(b.stage) || b.updatedAt.localeCompare(a.updatedAt)).map(idea => {
            const project = projects.find(item => item.id === idea.projectId);
            const next = nextStage[idea.stage];
            return (
              <article className={`idea-card panel stage-${idea.stage}`} key={idea.id}>
                <div className="idea-card-top"><StatusPill tone={idea.stage === "building" ? "good" : idea.stage === "planned" ? "warn" : "neutral"}>{stageLabel[idea.stage]}</StatusPill><span className="mono idea-updated">UPD {formatDate(idea.updatedAt, { day: "2-digit", month: "2-digit" })}</span></div>
                <h2>{idea.title}</h2><p>{idea.summary}</p>
                {project ? <div className="idea-project"><ProjectIdentity project={project} compact /></div> : <span className="ecosystem-label"><Icon name="dock" /> Вся экосистема</span>}
                <div className="idea-next"><span>Следующий шаг</span><p>{idea.nextAction}</p></div>
                <div className="cluster">{idea.tags.map(tag => <span className="chip" key={tag}>#{tag}</span>)}</div>
                <div className="idea-actions"><button className="button compact" onClick={() => openEdit(idea)}>Изменить</button>{next ? <button className="button compact primary" onClick={() => void upsertFutureIdea({ ...idea, stage: next })}>Перевести: {stageLabel[next]}</button> : <span className="status-pill good"><Icon name="check" /> На стапеле</span>}</div>
              </article>
            );
          })}
        </section>
      ) : <div className="panel"><EmptyState icon="ideas" title="Свободный стапель">Добавьте идею или измените фильтр.</EmptyState></div>}

      <button className="new-idea-row" onClick={openCreate}><span><Icon name="plus" /></span><strong>Создать новую ячейку</strong><small>Название, замысел и первый шаг</small></button>

      {dialogOpen ? <IdeaDialog idea={editing} projects={projects} onClose={() => setDialogOpen(false)} /> : null}
    </>
  );
}

function IdeaDialog({ idea, projects, onClose }: { idea: FutureIdea | null; projects: NonNullable<ReturnType<typeof useProjects>>; onClose: () => void }) {
  const [title, setTitle] = useState(idea?.title ?? "");
  const [summary, setSummary] = useState(idea?.summary ?? "");
  const [nextAction, setNextAction] = useState(idea?.nextAction ?? "");
  const [stage, setStage] = useState<FutureIdea["stage"]>(idea?.stage ?? "draft");
  const [projectId, setProjectId] = useState(idea?.projectId ?? "");
  const [tags, setTags] = useState(idea?.tags.join(", ") ?? "");
  const [saving, setSaving] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    await upsertFutureIdea({ id: idea?.id, title: title.trim(), summary: summary.trim(), nextAction: nextAction.trim(), stage, projectId: projectId || undefined, tags: tags.split(",").map(tag => tag.trim().replace(/^#/, "")).filter(Boolean), target: projectId ? "project" : "ecosystem" });
    onClose();
  }

  async function remove() {
    if (!idea) return;
    if (!window.confirm(`Удалить ячейку «${idea.title}»?`)) return;
    await removeFutureIdea(idea.id);
    onClose();
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <form className="modal-card modal-wide" role="dialog" aria-modal="true" aria-labelledby="idea-dialog-title" onClick={event => event.stopPropagation()} onSubmit={save}>
        <header className="modal-head"><div><p className="eyebrow">Конструкторское бюро</p><h2 id="idea-dialog-title">{idea ? "Изменить ячейку" : "Новая ячейка"}</h2></div><button type="button" className="icon-button" onClick={onClose} aria-label="Закрыть"><Icon name="close" /></button></header>
        <div className="modal-body grid two">
          <label className="field span-two"><span>Название</span><input className="input" autoFocus required value={title} onChange={event => setTitle(event.target.value)} /></label>
          <label className="field"><span>Стадия</span><select className="select" value={stage} onChange={event => setStage(event.target.value as FutureIdea["stage"])}>{Object.entries(stageLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="field"><span>Связь с проектом</span><select className="select" value={projectId} onChange={event => setProjectId(event.target.value)}><option value="">Вся экосистема</option>{projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
          <label className="field span-two"><span>Замысел</span><textarea className="textarea" required value={summary} onChange={event => setSummary(event.target.value)} /></label>
          <label className="field span-two"><span>Следующий проверяемый шаг</span><input className="input" required value={nextAction} onChange={event => setNextAction(event.target.value)} /></label>
          <label className="field span-two"><span>Теги через запятую</span><input className="input" value={tags} onChange={event => setTags(event.target.value)} placeholder="automation, pwa, research" /></label>
        </div>
        <footer className="modal-actions">{idea ? <button type="button" className="button danger-button" onClick={() => void remove()}>Удалить</button> : <span />}<div className="cluster"><button type="button" className="button" onClick={onClose}>Отмена</button><button className="button primary" disabled={saving || !title.trim() || !summary.trim() || !nextAction.trim()}>{saving ? "Сохраняем…" : "Сохранить"}</button></div></footer>
      </form>
    </div>
  );
}
