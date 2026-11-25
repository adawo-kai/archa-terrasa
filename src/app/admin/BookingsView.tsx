"use client";

import { useMemo, useState } from "react";
import { HALLS, fromInstant, type BookingRow, type Status, type TableRow } from "@/lib/rules";
import Timeline from "./Timeline";
import { Icon, OccasionBadge, Preorder, StatusBadge, som, type AdminBooking, type Day } from "./ui";
import Waitlist from "./Waitlist";

type Filter = "all" | Status;
const FILTERS: [Filter, string][] = [
  ["all", "Все"],
  ["booked", "Ожидаем"],
  ["came", "Пришли"],
  ["no_show", "Не пришли"],
  ["cancelled", "Отменены"],
];

export default function BookingsView({
  day,
  nowMin,
  setStatus,
  notify,
}: {
  day: Day;
  nowMin: number | null;
  setStatus: (b: BookingRow, s: Status) => Promise<void>;
  notify: (t: string, k?: "ok" | "error") => void;
}) {
  const { bookings, tables, loading } = day;
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [flash, setFlash] = useState<number | null>(null);

  const tableById = useMemo(() => new Map(tables.map((t) => [t.id, t])), [tables]);
  const live = bookings.filter((b) => b.status !== "cancelled");

  // загрузка: занятые столико-часы / (включённые столики × 12 часов работы)
  const activeTables = tables.filter((t) => t.active).length;
  const load = activeTables ? Math.round(((live.length * 2) / (activeTables * 12)) * 100) : 0;
  const kpis: [string, string | number, string?][] = [
    ["Броней", live.length],
    ["Гостей", live.reduce((s, b) => s + b.guests, 0)],
    ["Загрузка", `${load}%`, "столико-часов 11–23"],
    ["Пришли", bookings.filter((b) => b.status === "came").length],
    ["Не пришли", bookings.filter((b) => b.status === "no_show").length],
    ["Отменили сами", bookings.filter((b) => b.status === "cancelled" && b.cancelled_by === "guest").length],
  ];
  // предзаказ к активным броням: кухня видит, сколько готовить заранее
  const preTotal = live.reduce((s, b) => s + (b.preorder_total ?? 0), 0);
  const preCount = live.filter((b) => (b.preorder ?? []).length > 0).length;
  const birthdays = live.filter((b) => b.occasion === "birthday").length;

  const counts = (f: Filter) => (f === "all" ? bookings.length : bookings.filter((b) => b.status === f).length);
  const needle = q.trim().toLowerCase();
  const digits = needle.replace(/\D/g, "");
  const shown = bookings.filter(
    (b) =>
      (filter === "all" || b.status === filter) &&
      (!needle ||
        b.name.toLowerCase().includes(needle) ||
        b.code.toLowerCase().includes(needle) ||
        (digits.length >= 3 && b.phone.replace(/\D/g, "").includes(digits))),
  );

  const pick = (b: BookingRow) => {
    setFilter("all");
    setQ("");
    setFlash(b.id);
    requestAnimationFrame(() => document.getElementById(`b-${b.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }));
    setTimeout(() => setFlash((f) => (f === b.id ? null : f)), 2200);
  };

  return (
    <div className="flex flex-col gap-8">
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3 xl:grid-cols-6">
        {kpis.map(([k, v, hint]) => (
          <div key={k} className="bg-ink-2 px-5 py-4">
            <dt className="label text-paper-faint">{k}</dt>
            <dd className={`display tabular mt-2 text-[40px] ${loading ? "opacity-30" : ""}`} title={hint}>
              {loading ? "—" : v}
            </dd>
          </div>
        ))}
      </dl>
      {!loading && (preCount > 0 || birthdays > 0) && (
        <p className="label -mt-5 flex flex-wrap gap-x-6 gap-y-1 text-paper-faint">
          {preCount > 0 && (
            <span>
              Предзаказ к {preCount} брон{preCount === 1 ? "и" : "ям"} · <span className="text-juniper">{som(preTotal)}</span>
            </span>
          )}
          {birthdays > 0 && <span className="text-ember">🎂 Дней рождения: {birthdays}</span>}
        </p>
      )}

      <Waitlist day={day} notify={notify} />

      <section aria-labelledby="tl-title">
        <div className="mb-3 flex items-baseline justify-between gap-4">
          <h2 id="tl-title" className="label text-paper-dim">Шахматка столиков</h2>
          <span className="label hidden text-paper-faint sm:block">Нажмите на бронь — откроется в списке</span>
        </div>
        <Timeline tables={tables} bookings={live} nowMin={nowMin} onPick={pick} />
      </section>

      <section aria-labelledby="list-title">
        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h2 id="list-title" className="label text-paper-dim">Список броней</h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="relative block sm:w-64">
              <span className="sr-only">Поиск по имени, телефону или коду</span>
              <Icon name="search" className="pointer-events-none absolute top-1/2 left-0 h-4 w-4 -translate-y-1/2 text-paper-faint" />
              <input className="field !min-h-11 !py-2 pl-7 !text-[15px]" placeholder="Имя, телефон или код" value={q} onChange={(e) => setQ(e.target.value)} />
            </label>
            <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 sm:pb-0" data-lenis-prevent>
              {FILTERS.map(([f, l]) => (
                <button key={f} type="button" className="opt !min-h-11 shrink-0 rounded-full! !px-3.5 text-[13px]" aria-pressed={filter === f} onClick={() => setFilter(f)}>
                  {l} <span className="tabular ml-1 opacity-60">{counts(f)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-ink-2" />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line px-6 py-12 text-center text-paper-faint">
            {bookings.length === 0 ? "На этот день броней пока нет." : "Ничего не найдено — измените поиск или фильтр."}
          </div>
        ) : (
          <>
            {/* таблица — планшет и десктоп */}
            <div className="hidden overflow-hidden rounded-2xl border border-line md:block">
              <table className="w-full text-left text-sm">
                <thead className="label bg-ink-2 text-paper-faint">
                  <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:font-normal">
                    <th>Время</th>
                    <th>Столик</th>
                    <th>Гость</th>
                    <th className="hidden xl:table-cell">Пожелание</th>
                    <th>Статус</th>
                    <th className="text-right">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((b) => (
                    <Row key={b.id} b={b} t={tableById.get(b.table_id)} flash={flash === b.id} setStatus={setStatus} />
                  ))}
                </tbody>
              </table>
            </div>
            {/* карточки — телефон */}
            <ul className="flex flex-col gap-2 md:hidden">
              {shown.map((b) => (
                <Card key={b.id} b={b} t={tableById.get(b.table_id)} flash={flash === b.id} setStatus={setStatus} />
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}

type RowProps = { b: AdminBooking; t?: TableRow; flash: boolean; setStatus: (b: BookingRow, s: Status) => Promise<void> };

function Row({ b, t, flash, setStatus }: RowProps) {
  const { time } = fromInstant(b.starts_at);
  return (
    <tr
      id={`b-${b.id}`}
      className={`border-t border-line align-middle transition-colors duration-700 [&>td]:px-4 [&>td]:py-3.5 ${flash ? "bg-brass/15" : "hover:bg-paper/[0.02]"} ${b.status === "cancelled" ? "text-paper-faint" : ""}`}
    >
      <td>
        <span className="display tabular text-2xl">{time}</span>
      </td>
      <td className="whitespace-nowrap">
        <span className="font-medium">№{t?.number ?? "?"}</span>
        <span className="block text-xs text-paper-faint">
          {t ? HALLS[t.hall].title : ""} · {b.guests} гост.
        </span>
      </td>
      <td>
        <span className="font-medium">{b.name}</span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-paper-faint">
          <span className="font-mono">{b.code}</span>
          <a href={`tel:${b.phone.replace(/\s/g, "")}`} className="ulink font-mono text-paper-dim">
            {b.phone}
          </a>
        </span>
        {b.occasion && (
          <span className="mt-1.5 block">
            <OccasionBadge o={b.occasion} />
          </span>
        )}
        {b.comment && <span className="mt-1 block text-xs text-brass-2 xl:hidden">«{b.comment}»</span>}
        <span className="block max-w-72">
          <Preorder b={b} />
        </span>
      </td>
      <td className="hidden max-w-56 text-xs text-brass-2 xl:table-cell">{b.comment ? `«${b.comment}»` : <span className="text-paper-faint">—</span>}</td>
      <td>
        <StatusBadge b={b} />
      </td>
      <td className="text-right">
        <Actions b={b} setStatus={setStatus} />
      </td>
    </tr>
  );
}

function Card({ b, t, flash, setStatus }: RowProps) {
  const { time } = fromInstant(b.starts_at);
  return (
    <li id={`b-${b.id}`} className={`rounded-2xl border p-4 transition-colors duration-700 ${flash ? "border-brass bg-brass/10" : "border-line bg-ink-2"} ${b.status === "cancelled" ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <span className="display tabular text-3xl">{time}</span>
          <span className="text-sm text-paper-dim">
            №{t?.number} · {t ? HALLS[t.hall].title : ""}
          </span>
        </div>
        <StatusBadge b={b} />
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">
            {b.name} <span className="text-paper-faint">· {b.guests} гост.</span>
          </p>
          <p className="font-mono text-xs text-paper-faint">{b.code}</p>
        </div>
        <a href={`tel:${b.phone.replace(/\s/g, "")}`} className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line text-paper-dim" aria-label={`Позвонить ${b.phone}`}>
          <Icon name="phone" className="h-4 w-4" />
        </a>
      </div>
      {b.occasion && (
        <div className="mt-2">
          <OccasionBadge o={b.occasion} />
        </div>
      )}
      {b.comment && <p className="mt-2 text-sm text-brass-2">«{b.comment}»</p>}
      <Preorder b={b} />
      <div className="mt-3 border-t border-line pt-3">
        <Actions b={b} setStatus={setStatus} full />
      </div>
    </li>
  );
}

function Actions({ b, setStatus, full = false }: { b: BookingRow; setStatus: (b: BookingRow, s: Status) => Promise<void>; full?: boolean }) {
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const run = async (s: Status) => {
    setBusy(true);
    await setStatus(b, s);
    setBusy(false);
    setConfirm(false);
  };
  const base = `opt !min-h-10 rounded-full! !px-3.5 text-[13px] whitespace-nowrap ${full ? "flex-1" : ""}`;

  if (b.status === "cancelled") return <span className="text-xs text-paper-faint">—</span>;
  if (b.status !== "booked")
    return (
      <div className={`flex gap-1.5 ${full ? "" : "justify-end"}`}>
        <button type="button" className={base} disabled={busy} onClick={() => run("booked")}>
          Вернуть в «Ожидаем»
        </button>
      </div>
    );
  if (confirm)
    return (
      <div className={`flex items-center gap-1.5 ${full ? "" : "justify-end"}`}>
        <span className="mr-1 text-xs text-danger">Отменить бронь?</span>
        <button type="button" className={`${base} !border-danger !text-danger`} disabled={busy} onClick={() => run("cancelled")}>
          Да
        </button>
        <button type="button" className={base} onClick={() => setConfirm(false)}>
          Нет
        </button>
      </div>
    );
  return (
    <div className={`flex gap-1.5 ${full ? "" : "justify-end"}`}>
      <button type="button" className={`${base} hover:!border-juniper hover:!text-juniper`} disabled={busy} onClick={() => run("came")}>
        Пришли
      </button>
      <button type="button" className={base} disabled={busy} onClick={() => run("no_show")}>
        Не пришли
      </button>
      <button type="button" className={`${base} text-danger hover:!border-danger`} disabled={busy} onClick={() => setConfirm(true)} aria-label={`Отменить бронь ${b.code}`}>
        Отменить
      </button>
    </div>
  );
}
