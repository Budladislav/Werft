"use client";

import { useStartView } from "@/data";
import { WerftMark } from "@/components/icons";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function StartPage() {
  const startView = useStartView();
  const router = useRouter();

  useEffect(() => {
    if (startView) router.replace(startView === "dock" ? "/dock" : "/overview");
  }, [router, startView]);

  return (
    <main className="start-screen">
      <WerftMark className="start-mark" />
      <p className="eyebrow">Личный центр управления</p>
      <h1>Верфь</h1>
      <p>Открываем {startView === "dock" ? "быстрый док" : "сводку экосистемы"}…</p>
      <span className="loading-spinner is-light" />
    </main>
  );
}
