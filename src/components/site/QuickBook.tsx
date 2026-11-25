"use client";

import { useState } from "react";
import { MAX_GUESTS, addDays, bishkekNow } from "@/lib/rules";
import { scrollToId } from "../SmoothScroll";

export type Prefill = { date: string; guests: number };
export const PREFILL_EVENT = "archa:prefill";

const WD = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
const MON = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

/** Быстрая бронь на первом экране: дата + гости → переносит в форму брони с заполненными полями. */
export default function QuickBook() {
  const [today] = useState(() => bishkekNow().date);
  const [day, setDay] = useState(0);
  const [guests, setGuests] = useState(2);
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i));

  const label = (d: string, i: number) => {
    const x = new Date(d + "T00:00:00Z");
    const base = `${x.getUTCDate()} ${MON[x.getUTCMonth()]}, ${WD[x.getUTCDay()]}`;
    return i === 0 ? `Сегодня, ${base}` : i === 1 ? `Завтра, ${base}` : base;
  };

  return (
    <div className="flex flex-col gap-px overflow-hidden rounded-[28px] border border-line-strong bg-ink/55 backdrop-blur-xl sm:flex-row sm:items-stretch sm:rounded-full">
      <label className="flex flex-1 flex-col justify-center px-6 py-3 sm:min-w-56">
        <span className="label text-paper-faint">Дата</span>
        <select
          value={day}
          onChange={(e) => setDay(Number(e.target.value))}
          className="-ml-1 bg-transparent text-[15px] outline-none [&>option]:bg-ink-2"
        >
          {days.map((d, i) => (
            <option key={d} value={i}>
              {label(d, i)}
            </option>
          ))}
        </select>
      </label>
      <div className="flex items-center justify-between gap-3 border-t border-line px-6 py-3 sm:border-t-0 sm:border-l">
        <div>
          <span className="label block text-paper-faint">Гости</span>
          <span className="tabular text-[15px]">{guests}</span>
        </div>
        <div className="flex gap-1">
          <button type="button" aria-label="Меньше гостей" onClick={() => setGuests((g) => Math.max(1, g - 1))} className="grid h-9 w-9 place-items-center rounded-full border border-line hover:border-paper-faint">−</button>
          <button type="button" aria-label="Больше гостей" onClick={() => setGuests((g) => Math.min(MAX_GUESTS, g + 1))} className="grid h-9 w-9 place-items-center rounded-full border border-line hover:border-paper-faint">+</button>
        </div>
      </div>
      <div className="p-1.5">
          <button
            type="button"
           
            className="btn btn-primary w-full !min-h-[56px]"
            onClick={() => {
              window.dispatchEvent(new CustomEvent<Prefill>(PREFILL_EVENT, { detail: { date: days[day] ?? today, guests } }));
              scrollToId("book");
            }}
          >
            Найти столик <span aria-hidden>→</span>
          </button>
      </div>
    </div>
  );
}
