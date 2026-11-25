"use client";

import { HALLS, OPEN_MIN, fromHHMM, fromInstant, type BookingRow, type Hall, type TableRow } from "@/lib/rules";
import { STATUS_TONE } from "./ui";

const START = OPEN_MIN; // 11:00
const END = 23 * 60; // закрытие
const SPAN = END - START;
const HOURS = Array.from({ length: SPAN / 60 + 1 }, (_, i) => START / 60 + i);
const pct = (min: number) => ((min - START) / SPAN) * 100;

/** Шахматка: строки — столики (по залам), колонки — часы. Бронь — блок на 2 часа. */
export default function Timeline({
  tables,
  bookings,
  nowMin,
  onPick,
}: {
  tables: TableRow[];
  bookings: BookingRow[];
  nowMin: number | null;
  onPick: (b: BookingRow) => void;
}) {
  const active = tables.filter((t) => t.active);
  const grid = { backgroundImage: "linear-gradient(to right, var(--line) 1px, transparent 1px)", backgroundSize: `${100 / (SPAN / 60)}% 100%` };
  const showNow = nowMin !== null && nowMin >= START && nowMin <= END;

  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-ink-2/60" data-lenis-prevent>
      <div className="relative min-w-[920px]">
        {/* шкала часов */}
        <div className="sticky top-0 z-20 flex border-b border-line bg-ink-2">
          <div className="label sticky left-0 z-20 flex w-36 shrink-0 items-end bg-ink-2 px-4 pb-2 text-paper-faint">Столик</div>
          <div className="relative h-9 flex-1">
            {HOURS.map((h) => (
              <span
                key={h}
                className="label absolute bottom-2 -translate-x-1/2 text-paper-faint first:translate-x-0 last:-translate-x-full"
                style={{ left: `${pct(h * 60)}%` }}
              >
                {h}:00
              </span>
            ))}
          </div>
        </div>

        {(Object.keys(HALLS) as Hall[]).map((hall) => {
          const list = active.filter((t) => t.hall === hall).sort((a, b) => a.number - b.number);
          if (!list.length) return null;
          return (
            <div key={hall}>
              <div className="flex border-b border-line bg-ink-3/60">
                <div className="label sticky left-0 z-10 w-36 shrink-0 bg-ink-3 px-4 py-2 text-brass">{HALLS[hall].title}</div>
                <div className="flex-1" />
              </div>
              {list.map((t) => (
                <div key={t.id} className="flex h-12 border-b border-line last:border-b-0">
                  <div className="sticky left-0 z-10 flex w-36 shrink-0 items-center gap-2 border-r border-line bg-ink-2 px-4">
                    <span className="display text-xl">№{t.number}</span>
                    <span className="label text-paper-faint">{t.seats} м.</span>
                  </div>
                  <div className="relative flex-1" style={grid}>
                    {/* после 21:00 новые брони не начинаются */}
                    <div className="absolute inset-y-0 right-0 bg-[repeating-linear-gradient(45deg,rgba(239,231,218,0.03)_0_2px,transparent_2px_8px)]" style={{ left: `${pct(21 * 60 + 120)}%` }} />
                    {bookings
                      .filter((b) => b.table_id === t.id)
                      .map((b) => {
                        const { time } = fromInstant(b.starts_at);
                        const s = fromHHMM(time);
                        return (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => onPick(b)}
                            title={`${time} · ${b.name} · ${b.guests} гост.`}
                            className={`absolute inset-y-1.5 flex items-center gap-1.5 overflow-hidden rounded-md border px-2 text-left text-xs whitespace-nowrap transition-[filter] hover:brightness-125 focus-visible:brightness-125 ${STATUS_TONE[b.status]}`}
                            style={{ left: `calc(${pct(s)}% + 2px)`, width: `calc(${(120 / SPAN) * 100}% - 4px)` }}
                          >
                            <span className="font-mono">{time}</span>
                            <span className="truncate font-medium">
                              {(b as BookingRow & { occasion?: string | null }).occasion === "birthday" ? "🎂 " : ""}
                              {b.name.split(" ")[0]}
                            </span>
                            <span className="opacity-70">· {b.guests}</span>
                          </button>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          );
        })}

        {showNow && (
          <div className="pointer-events-none absolute top-0 bottom-0 z-30" style={{ left: `calc(9rem + (100% - 9rem) * ${pct(nowMin!) / 100})` }} aria-hidden>
            <div className="h-full w-px bg-ember" />
            <span className="label absolute top-1 left-1 rounded bg-ember px-1 text-ink">сейчас</span>
          </div>
        )}
      </div>
    </div>
  );
}
