"use client";

import { autoSyncGithubIfStale, ensureSeeded } from "@/data";
import { useEffect, useState } from "react";
import { WerftMark } from "./icons";

let automaticGithubSync: Promise<unknown> | undefined;

function startAutomaticGithubSync() {
  automaticGithubSync ??= autoSyncGithubIfStale().catch(error => {
    console.warn("Автоматическая сверка GitHub отложена", error);
  });
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;
    ensureSeeded()
      .then(() => {
        if (active) setState("ready");
        startAutomaticGithubSync();
      })
      .catch((error: unknown) => {
        console.error("Не удалось подготовить локальную базу Верфи", error);
        if (active) setState("error");
      });
    return () => { active = false; };
  }, []);

  if (state === "loading") {
    return (
      <main className="boot-screen">
        <WerftMark className="boot-mark" />
        <p className="eyebrow">Поднимаем стапели</p>
        <h1>Верфь</h1>
        <div className="boot-line"><span /></div>
      </main>
    );
  }

  if (state === "error") {
    return (
      <main className="boot-screen">
        <WerftMark className="boot-mark is-error" />
        <p className="eyebrow">Локальный контур недоступен</p>
        <h1>Не удалось открыть IndexedDB</h1>
        <p className="boot-copy">Разрешите сайту хранить данные в браузере и перезагрузите страницу.</p>
        <button className="button primary" onClick={() => window.location.reload()}>Повторить</button>
      </main>
    );
  }

  return children;
}
