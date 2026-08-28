"use client";

import { useMemo, useState } from "react";
import { useProjects } from "@/data";
import { Icon } from "@/components/icons";
import { LoadingPanel, PageHeader, ProjectCard } from "@/components/ui";
import type { ProjectLifecycle } from "@/lib/domain";

type Filter = "all" | ProjectLifecycle;

export default function ProjectsPage() {
  const projects = useProjects();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    if (!projects) return [];
    const needle = query.trim().toLocaleLowerCase("ru");
    return projects.filter(project => {
      const matchesFilter = filter === "all" || project.lifecycle === filter;
      const haystack = [project.name, project.repositoryName, project.summary, ...project.stack, ...project.capabilities].join(" ").toLocaleLowerCase("ru");
      return matchesFilter && (!needle || haystack.includes(needle));
    });
  }, [filter, projects, query]);

  if (!projects) return <LoadingPanel label="Открываем библиотеку проектов…" />;

  return (
    <>
      <PageHeader
        eyebrow="Реестр · { 05 }"
        title="Библиотека проектов"
        description="Паспорт каждого продукта: назначение, технологии, журнал, качество, заметки и обслуживание."
      />

      <div className="library-tools panel">
        <label className="search-box">
          <Icon name="search" />
          <span className="sr-only">Найти проект</span>
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Название, технология или функция…" />
          {query ? <button onClick={() => setQuery("")} aria-label="Очистить поиск"><Icon name="close" /></button> : null}
        </label>
        <div className="segmented" aria-label="Фильтр проектов">
          {([
            ["all", "Все"],
            ["active", "Развитие"],
            ["maintenance", "Поддержка"],
            ["planning", "Планы"],
          ] as const).map(([value, label]) => (
            <button key={value} className={filter === value ? "is-active" : ""} onClick={() => setFilter(value)}>{label}</button>
          ))}
        </div>
        <span className="library-count mono">{String(filtered.length).padStart(2, "0")} / {String(projects.length).padStart(2, "0")}</span>
      </div>

      {filtered.length ? (
        <section className="project-grid section-gap">
          {filtered.map(project => <ProjectCard key={project.id} project={project} />)}
        </section>
      ) : (
        <div className="panel empty-state section-gap"><div><Icon name="search" /><h3>Ничего не найдено</h3><p>Попробуйте другой запрос или покажите все стадии.</p></div></div>
      )}

      <aside className="library-footnote">
        <span className="mono">WERFT INDEX / PUBLIC + PRIVATE</span>
        <p>Архивные репозитории и ren2gar намеренно не входят в реестр. Актуальные технические данные приватного Flow обновляются только после авторизации владельца GitHub.</p>
      </aside>
    </>
  );
}
