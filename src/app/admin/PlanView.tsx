"use client";

import { useState } from "react";
import FloorPlan, { Legend } from "@/components/FloorPlan";
import { HALLS, allSlots, fromHHMM, fromInstant, toInstant, type BookingRow, type Hall, type Status, type TableRow } from "@/lib/rules";
import { StatusBadge, type Day } from "./ui";

const SLOTS = allSlots();

/** План зала на выбранное время: какие столики заняты, кто за ними. */
export default function PlanView({ day, date, nowMin, isToday, setStatus }: { day: Day; date: string; nowMin: number | null; isToday: boolean; setStatus: (b: BookingRow, s: Status) => Promise<void> }) {
  const { tables, bookings } = day;
  const defaultSlot = () => {
    if (!isToday || nowMin === null) return "19:00";
    const next = SLOTS.find((s) => fromHHMM(s) + 30 > nowMin);
    return next ?? SLOTS[SLOTS.length - 1];
  };
  const [time, setTime] = useState<string>(defaultSlot);
  const [picked, setPicked] = useState<number | null>(null);

  const at = toInstant(date, time).getTime();
  const live = bookings.filter((b) => b.status !== "cancelled");
  const occupant = (t: TableRow) => live.find((b) => b.table_id === t.id && new Date(b.starts_at).getTime() <= at && at < new Date(b.ends_at).getTime());
  const active = tables.filter((t) => t.active);
  const busyCount = active.filter((t) => occupant(t)).length;
  const sel = live.find((b) => b.id === picked) ?? null;
  const selTable = sel ? tables.find((t) => t.id === sel.table_id) : null;

  // FloorPlan кликабелен только для свободных столиков — занятые ловим делегированием по aria-label «№N …»
  const onPlanClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    const g = (e.target as Element).closest("g[aria-label]");
    const m = g?.getAttribute("aria-label")?.match(/^№(\d+)/);
    if (!m) return;
    const t = active.find((x) => x.number === Number(m[1]));
    const b = t && occupant(t);
    setPicked(b ? b.id : null);
  };

  const idx = SLOTS.indexOf(time);

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_320px]">
      <div className="flex min-w-0 flex-col gap-6">
        <div className="rounded-2xl border border-line bg-ink-2/60 p-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="label text-paper-faint">Время</p>
              <p className="display tabular mt-1 text-5xl">{time}</p>
            </div>
            <p className="label text-paper-dim">
              Занято <span className="text-ember">{busyCount}</span> из {active.length} · свободно <span className="text-juniper">{active.length - busyCount}</span>
            </p>
          </div>
          <input
            type="range"
            min={0}
            max={SLOTS.length - 1}
            value={idx}
            onChange={(e) => {
              setTime(SLOTS[Number(e.target.value)]);
              setPicked(null);
            }}
            className="mt-5 h-11 w-full cursor-pointer accent-[var(--brass)]"
            aria-label="Время на плане"
            aria-valuetext={time}
          />
          <div className="label mt-1 flex justify-between text-paper-faint">
            <span>11:00</span>
            <span>16:00</span>
            <span>21:00</span>
          </div>
          <div className="mt-4">
            <Legend items={[["neutral", "Свободен"], ["taken", "Занят — нажмите"], ["off", "Выключен"]]} />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {(Object.keys(HALLS) as Hall[]).map((h) => {
            const list = tables.filter((t) => t.hall === h);
            if (!list.length) return null;
            return (
              <section
                key={h}
                className={`rounded-2xl border border-line bg-ink-2/60 p-5 [&_g[aria-label]]:cursor-pointer ${h === "vip" ? "lg:col-span-2 lg:max-w-[calc(50%-12px)]" : ""}`}
                onClick={onPlanClick}
                onKeyDown={(e) => e.key === "Enter" && onPlanClick(e)}
              >
                <div className="mb-3 flex items-baseline justify-between">
                  <h3 className="display text-2xl">{HALLS[h].title}</h3>
                  <span className="label text-paper-faint">{list.filter((t) => t.active && !occupant(t)).length} свободно</span>
                </div>
                <FloorPlan
                  hall={h}
                  tables={tables}
                  stateOf={(t) => {
                    if (!t.active) return "off";
                    const b = occupant(t);
                    if (b && b.id === picked) return "selected";
                    return b ? "taken" : "neutral";
                  }}
                  caption={(t) => {
                    const b = t.active ? occupant(t) : null;
                    return `№${t.number}, ${t.seats} мест — ${!t.active ? "выключен" : b ? `занят: ${b.name}, с ${fromInstant(b.starts_at).time}` : "свободен"}`;
                  }}
                />
              </section>
            );
          })}
        </div>
      </div>

      <aside className="xl:sticky xl:top-6 xl:self-start" aria-live="polite">
        <div className="rounded-2xl border border-line bg-ink-2/60 p-5">
          <p className="label text-paper-faint">Бронь за столиком</p>
          {sel && selTable ? (
            <div className="mt-4">
              <div className="flex items-start justify-between gap-3">
                <p className="display text-4xl">№{selTable.number}</p>
                <StatusBadge b={sel} />
              </div>
              <p className="mt-1 text-sm text-paper-dim">
                {HALLS[selTable.hall].title} · {selTable.seats} мест
              </p>
              <dl className="mt-5 border-t border-line text-sm">
                {[
                  ["Гость", sel.name],
                  ["Время", `${fromInstant(sel.starts_at).time} – ${fromInstant(sel.ends_at).time}`],
                  ["Гостей", String(sel.guests)],
                  ["Код", sel.code],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 border-b border-line py-2.5">
                    <dt className="text-paper-faint">{k}</dt>
                    <dd className="text-right">{v}</dd>
                  </div>
                ))}
                <div className="flex justify-between gap-4 border-b border-line py-2.5">
                  <dt className="text-paper-faint">Телефон</dt>
                  <dd>
                    <a href={`tel:${sel.phone.replace(/\s/g, "")}`} className="ulink font-mono">
                      {sel.phone}
                    </a>
                  </dd>
                </div>
              </dl>
              {sel.comment && <p className="mt-3 text-sm text-brass-2">«{sel.comment}»</p>}
              {sel.status === "booked" && (
                <div className="mt-5 flex gap-2">
                  <button type="button" className="opt flex-1 rounded-full! text-[13px]" onClick={() => setStatus(sel, "came")}>
                    Пришли
                  </button>
                  <button type="button" className="opt flex-1 rounded-full! text-[13px]" onClick={() => setStatus(sel, "no_show")}>
                    Не пришли
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="mt-4 text-sm leading-relaxed text-paper-dim">Нажмите на занятый (заштрихованный) столик на плане — здесь появятся гость, время и телефон.</p>
          )}
        </div>
      </aside>
    </div>
  );
}
