"use client";

import { useEffect, useState } from "react";
import { HALLS, MAX_GUESTS, type TableRow } from "@/lib/rules";
import { Icon, Stepper, json } from "./ui";

type Avail = { tables: TableRow[]; slots: { time: string; past: boolean; free: number[] }[] };

/** Бронь по телефону: администратор вносит её сам. Проверки те же, что для гостя на сайте. */
export default function NewBooking({ date, onClose, onDone }: { date: string; onClose: () => void; onDone: (text: string) => void }) {
  const [d, setD] = useState(date);
  const [guests, setGuests] = useState(2);
  const [time, setTime] = useState("");
  const [tableId, setTableId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+996 ");
  const [comment, setComment] = useState("");
  const [avail, setAvail] = useState<(Avail & { key: string }) | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const key = `${d}|${guests}`;

  useEffect(() => {
    let off = false;
    fetch(`/api/availability?date=${d}&guests=${guests}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => !off && setAvail({ ...j, key: `${d}|${guests}` }))
      .catch(() => !off && setErr("Нет связи с сервером"));
    return () => {
      off = true;
    };
  }, [d, guests]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const ready = avail?.key === key ? avail : null;
  const slots = ready?.slots.filter((s) => !s.past) ?? [];
  const slot = slots.find((s) => s.time === time);
  const free = (ready?.tables ?? []).filter((t) => slot?.free.includes(t.id));
  const chosen = tableId && slot?.free.includes(tableId) ? tableId : null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!time || !chosen) return setErr("Выберите время и столик");
    setBusy(true);
    setErr(null);
    const r = await fetch("/api/bookings", { method: "POST", ...json({ date: d, time, guests, tableId: chosen, name, phone, comment }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) {
      setErr(j.error ?? "Не удалось создать бронь");
      if (j.taken) setTableId(null);
      return;
    }
    onDone(`Бронь ${j.code} создана: ${time}, столик №${j.table}`);
  }

  return (
    <div className="fixed inset-0 z-[60] flex justify-end" role="dialog" aria-modal="true" aria-labelledby="nb-title">
      <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-label="Закрыть" />
      <form onSubmit={submit} className="relative flex h-full w-full max-w-[480px] flex-col border-l border-line bg-ink-2 shadow-2xl" data-lenis-prevent>
        <header className="flex items-center justify-between border-b border-line px-6 py-4">
          <div>
            <p className="label text-paper-faint">Бронь по телефону</p>
            <h2 id="nb-title" className="display mt-1 text-3xl">
              Новая бронь
            </h2>
          </div>
          <button type="button" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-full border border-line hover:border-paper-faint" aria-label="Закрыть">
            <Icon name="close" className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="grid grid-cols-[1fr_auto] items-end gap-5">
            <label>
              <span className="label text-paper-faint">Дата</span>
              <input type="date" className="field !min-h-11 !py-2" value={d} onChange={(e) => e.target.value && (setD(e.target.value), setTime(""))} />
            </label>
            <div>
              <span className="label mb-1 block text-paper-faint">Гостей</span>
              <Stepper value={guests} max={MAX_GUESTS} onChange={(v) => (setGuests(v), setTableId(null))} label="Гостей" />
            </div>
          </div>

          <p className="label mt-8 mb-3 text-paper-faint">Время</p>
          {!ready ? (
            <div className="grid grid-cols-4 gap-1.5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-11 animate-pulse rounded bg-ink-3" />
              ))}
            </div>
          ) : slots.length === 0 ? (
            <p className="text-sm text-paper-dim">На эту дату приём броней закончен.</p>
          ) : (
            <div className="grid grid-cols-4 gap-1.5">
              {slots.map((s) => (
                <button key={s.time} type="button" className="opt font-mono text-[13px]" aria-pressed={s.time === time} disabled={!s.free.length} onClick={() => (setTime(s.time), setTableId(null))}>
                  {s.time}
                </button>
              ))}
            </div>
          )}

          {time && (
            <>
              <p className="label mt-8 mb-3 text-paper-faint">Свободные столики на {time}</p>
              {free.length === 0 ? (
                <p className="text-sm text-paper-dim">Подходящих свободных столиков нет.</p>
              ) : (
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                  {free.map((t) => (
                    <button key={t.id} type="button" className="opt flex !h-auto flex-col items-start !py-2.5 text-left" aria-pressed={t.id === chosen} onClick={() => setTableId(t.id)}>
                      <span className="font-medium">№{t.number}</span>
                      <span className="text-xs opacity-70">
                        {HALLS[t.hall].title} · {t.seats} м.
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          <div className="mt-8 grid gap-5">
            <label>
              <span className="label text-paper-faint">Имя гостя</span>
              <input className="field" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={60} />
            </label>
            <label>
              <span className="label text-paper-faint">Телефон</span>
              <input className="field font-mono" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </label>
            <label>
              <span className="label text-paper-faint">Пожелание</span>
              <input className="field" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={300} placeholder="Необязательно" />
            </label>
          </div>
          {err && (
            <p role="alert" className="mt-5 border-l-2 border-danger bg-danger/10 px-4 py-3 text-sm text-danger">
              {err}
            </p>
          )}
        </div>

        <footer className="border-t border-line px-6 py-4">
          <button className="btn btn-primary w-full" disabled={busy || !chosen}>
            {busy ? "Сохраняем…" : chosen ? `Забронировать №${free.find((t) => t.id === chosen)?.number} на ${time}` : "Выберите время и столик"}
          </button>
        </footer>
      </form>
    </div>
  );
}
