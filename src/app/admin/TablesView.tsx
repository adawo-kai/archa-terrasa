"use client";

import { useRef, useState } from "react";
import FloorPlan, { Legend } from "@/components/FloorPlan";
import { HALLS, seatsWord, type Hall, type TableRow } from "@/lib/rules";
import { Icon, Stepper, Switch, json, type Day } from "./ui";

const HALL_KEYS = Object.keys(HALLS) as Hall[];

/** Столики: план каждого зала + аккуратный список с правкой на месте. */
export default function TablesView({ day, notify }: { day: Day; notify: (t: string, k?: "ok" | "error") => void }) {
  const { tables, setTables, reload, loading } = day;
  const [selected, setSelected] = useState<number | null>(null);
  const [adding, setAdding] = useState<Hall | null>(null);
  const saveTimers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  /** Оптимистичное обновление: сразу меняем на экране, потом сохраняем; при ошибке — откат с сервера. */
  async function patch(t: TableRow, body: Partial<Pick<TableRow, "hall" | "seats" | "active">>, msg: string) {
    setTables((list) => list.map((x) => (x.id === t.id ? { ...x, ...body } : x)));
    const r = await fetch(`/api/admin/tables/${t.id}`, { method: "PATCH", ...json(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      notify(j.error ?? "Не удалось сохранить", "error");
      reload();
      return;
    }
    notify(j.warning ?? msg, j.warning ? "error" : "ok");
  }

  // места меняем кнопками часто — сохраняем с небольшой задержкой, одной записью
  function changeSeats(t: TableRow, seats: number) {
    setTables((list) => list.map((x) => (x.id === t.id ? { ...x, seats } : x)));
    const timers = saveTimers.current;
    clearTimeout(timers.get(t.id));
    timers.set(
      t.id,
      setTimeout(() => {
        timers.delete(t.id);
        patch(t, { seats }, `Столик №${t.number}: ${seats} ${seatsWord(seats)}`);
      }, 600),
    );
  }

  const select = (t: TableRow) => {
    setSelected(t.id);
    requestAnimationFrame(() => document.getElementById(`t-${t.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }));
  };

  const total = tables.filter((t) => t.active);
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <p className="max-w-xl text-sm leading-relaxed text-paper-dim">
          Выключенный столик гости не видят при бронировании, старые брони на нём сохраняются. Нажмите на столик на плане, чтобы перейти к нему в списке.
        </p>
        <p className="label text-paper-faint">
          В работе {total.length} столиков · {total.reduce((s, t) => s + t.seats, 0)} мест
        </p>
      </div>

      {loading && !tables.length ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-80 animate-pulse rounded-2xl bg-ink-2" />
          ))}
        </div>
      ) : (
        HALL_KEYS.map((h) => {
          const list = tables.filter((t) => t.hall === h).sort((a, b) => a.number - b.number);
          return (
            <section key={h} aria-labelledby={`hall-${h}`} className="rounded-2xl border border-line bg-ink-2/50">
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
                <div className="flex items-baseline gap-3">
                  <h2 id={`hall-${h}`} className="display text-3xl">
                    {HALLS[h].title}
                  </h2>
                  <span className="label text-paper-faint">
                    {list.length} шт · {list.filter((t) => t.active).reduce((s, t) => s + t.seats, 0)} мест
                  </span>
                </div>
                <button type="button" className="btn btn-ghost !min-h-11 !px-4" onClick={() => setAdding(adding === h ? null : h)} aria-expanded={adding === h}>
                  <Icon name="plus" className="h-4 w-4" /> Столик
                </button>
              </header>

              {adding === h && (
                <AddForm
                  hall={h}
                  tables={tables}
                  onDone={(text) => {
                    notify(text);
                    setAdding(null);
                    reload();
                  }}
                  onCancel={() => setAdding(null)}
                />
              )}

              <div className="grid gap-0 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
                <div className="border-b border-line p-5 lg:border-r lg:border-b-0">
                  <FloorPlan
                    hall={h}
                    tables={tables}
                    stateOf={(t) => (t.id === selected ? "selected" : t.active ? "neutral" : "off")}
                    onPick={select}
                    caption={(t) => `№${t.number}, ${t.seats} ${seatsWord(t.seats)}${t.active ? "" : ", выключен"} — изменить`}
                  />
                  <div className="mt-4">
                    <Legend items={[["neutral", "В работе"], ["off", "Выключен"], ["selected", "Выбран"]]} />
                  </div>
                </div>

                <ul className="divide-y divide-line">
                  {list.length === 0 && <li className="px-5 py-10 text-center text-sm text-paper-faint">В этом зале пока нет столиков</li>}
                  {list.map((t) => (
                    <li
                      key={t.id}
                      id={`t-${t.id}`}
                      onClick={() => setSelected(t.id)}
                      className={`grid grid-cols-[56px_minmax(0,1fr)] items-center gap-x-4 gap-y-3 px-5 py-4 transition-colors duration-500 sm:grid-cols-[56px_minmax(0,1fr)_auto_auto] ${
                        selected === t.id ? "bg-brass/[0.08]" : ""
                      } ${t.active ? "" : "text-paper-faint"}`}
                    >
                      <span className="display tabular text-3xl">№{t.number}</span>
                      <label className="min-w-0">
                        <span className="sr-only">Зал столика №{t.number}</span>
                        <select
                          className="field !min-h-11 !py-2 !text-[15px] [&>option]:bg-ink-2"
                          value={t.hall}
                          onChange={(e) => patch(t, { hall: e.target.value as Hall }, `Столик №${t.number} → ${HALLS[e.target.value as Hall].title}`)}
                        >
                          {HALL_KEYS.map((x) => (
                            <option key={x} value={x}>
                              {HALLS[x].title}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="col-span-2 flex items-center justify-between gap-4 sm:col-span-1 sm:contents">
                        <div className="flex items-center gap-2">
                          <Stepper value={t.seats} onChange={(v) => changeSeats(t, v)} label={`Мест за столиком №${t.number}`} />
                          <span className="label w-10 text-paper-faint">{seatsWord(t.seats)}</span>
                        </div>
                        <Switch checked={t.active} onChange={(v) => patch(t, { active: v }, `Столик №${t.number} ${v ? "включён" : "выключен"}`)} label={`Столик №${t.number} в работе`} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}

function AddForm({ hall: initialHall, tables, onDone, onCancel }: { hall: Hall; tables: TableRow[]; onDone: (text: string) => void; onCancel: () => void }) {
  const next = Math.max(0, ...tables.map((t) => t.number)) + 1;
  const [number, setNumber] = useState(String(next));
  const [hall, setHall] = useState<Hall>(initialHall);
  const [seats, setSeats] = useState(4);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(number);
    if (!Number.isInteger(n) || n < 1) return setErr("Номер — целое число от 1");
    if (tables.some((t) => t.number === n)) return setErr(`Столик №${n} уже есть`);
    setBusy(true);
    setErr(null);
    const r = await fetch("/api/admin/tables", { method: "POST", ...json({ number: n, hall, seats }) });
    setBusy(false);
    if (!r.ok) return setErr((await r.json().catch(() => ({}))).error ?? "Не удалось добавить");
    onDone(`Столик №${n} добавлен в «${HALLS[hall].title}»`);
  }

  return (
    <form onSubmit={submit} className="grid gap-5 border-b border-line bg-ink-3/50 px-5 py-5 sm:grid-cols-[120px_minmax(0,1fr)_auto] sm:items-end">
      <label>
        <span className="label text-paper-faint">Номер</span>
        <input className="field !min-h-11 !py-2" type="number" inputMode="numeric" min={1} value={number} onChange={(e) => (setNumber(e.target.value), setErr(null))} required aria-invalid={!!err} />
      </label>
      <label>
        <span className="label text-paper-faint">Зал</span>
        <select className="field !min-h-11 !py-2 [&>option]:bg-ink-2" value={hall} onChange={(e) => setHall(e.target.value as Hall)}>
          {HALL_KEYS.map((x) => (
            <option key={x} value={x}>
              {HALLS[x].title}
            </option>
          ))}
        </select>
      </label>
      <div>
        <span className="label mb-1 block text-paper-faint">Мест</span>
        <Stepper value={seats} onChange={setSeats} label="Мест за новым столиком" />
      </div>
      {err && (
        <p role="alert" className="text-sm text-danger sm:col-span-3">
          {err}
        </p>
      )}
      <div className="flex gap-2 sm:col-span-3">
        <button className="btn btn-primary !min-h-11" disabled={busy}>
          {busy ? "Добавляем…" : `Добавить №${number || "?"}`}
        </button>
        <button type="button" className="btn btn-ghost !min-h-11" onClick={onCancel}>
          Отмена
        </button>
      </div>
    </form>
  );
}
