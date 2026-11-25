"use client";

import { useEffect, useState } from "react";
import { bishkekNow, toHHMM } from "@/lib/rules";

function compute() {
  const { minutes } = bishkekNow();
  const open = minutes >= 11 * 60 && minutes < 23 * 60;
  return { time: toHHMM(minutes), open };
}

/** Живое время Бишкека и статус «открыто / закрыто» — считается в браузере. */
export function useLive() {
  const [v, setV] = useState<ReturnType<typeof compute> | null>(null);
  useEffect(() => {
    const tick = () => setV(compute());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 15_000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);
  return v;
}

export function OpenStatus({ className = "" }: { className?: string }) {
  const v = useLive();
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className={`h-1.5 w-1.5 rounded-full ${v?.open ? "bg-juniper animate-[pulse-dot_2s_ease-in-out_infinite]" : "bg-ember"}`}
      />
      {v ? (v.open ? "Открыто до 23:00" : "Закрыто · с 11:00") : "Ежедневно 11–23"}
    </span>
  );
}

export function LocalTime() {
  const v = useLive();
  return <span className="tabular">{v?.time ?? "--:--"}</span>;
}
