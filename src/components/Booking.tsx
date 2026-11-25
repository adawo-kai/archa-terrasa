"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import {
  DAYS_AHEAD,
  DURATION_MIN,
  HALLS,
  MAX_GUESTS,
  RESTAURANT,
  addDays,
  bishkekNow,
  fromHHMM,
  seatsWord,
  toHHMM,
  type Hall,
  type TableRow,
} from "@/lib/rules";
import { calendarLinks } from "@/lib/calendar";
import { cartLines, cartTotal, preorder, som, useCart } from "@/lib/preorder";
import FloorPlan, { Legend, type TableState } from "./FloorPlan";
import { PREFILL_EVENT, type Prefill } from "./site/QuickBook";

type Slot = { time: string; past: boolean; free: number[] };
type Avail = { tables: TableRow[]; suitable: number[]; slots: Slot[]; date: string; guests: number };
type Done = { code: string; table: number; hall: Hall; date: string; time: string; guests: number; name: string; phone: string; preorder: { id: string; name: string; qty: number; price: number }[]; preorderTotal: number };

const OCCASIONS = [
  { id: "birthday", label: "День рождения" },
  { id: "date", label: "Свидание" },
  { id: "business", label: "Деловая встреча" },
  { id: "family", label: "С семьёй" },
];

const WD = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const MONTHS = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
const HALL_ORDER: Hall[] = ["main", "terrace", "vip"];

export function longDate(date: string) {
  const d = new Date(date + "T00:00:00Z");
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}, ${WD[d.getUTCDay()].toLowerCase()}`;
}
export const guestsWord = (n: number) =>
  n % 10 === 1 && n % 100 !== 11 ? "гость" : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? "гостя" : "гостей";

export default function Booking() {
  const today = useMemo(() => bishkekNow().date, []);
  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => addDays(today, i)), [today]);
  const [date, setDate] = useState(today);
  const [guests, setGuests] = useState(2);
  const [time, setTime] = useState<string | null>(null);
  const [hall, setHall] = useState<Hall>("main");
  const [pickedTable, setTableId] = useState<number | null>(null);
  const [data, setData] = useState<Avail | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+996 ");
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Done | null>(null);
  const [occasion, setOccasion] = useState<string | null>(null);
  const [wl, setWl] = useState<{ name: string; phone: string; sent: boolean; busy: boolean }>({ name: "", phone: "+996 ", sent: false, busy: false });
  const cart = useCart();
  const lines = cartLines(cart);
  const root = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/availability?date=${date}&guests=${guests}`, { cache: "no-store" });
      const j = await r.json();
      if (r.ok) setData({ ...j, date, guests });
      else setError(j.error);
    } catch {
      setError("Нет связи с сервером");
    }
  }, [date, guests]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- состояние меняется после await (загрузка с сервера)
    load();
    const id = setInterval(load, 20_000); // другие гости тоже бронируют — держим данные свежими
    return () => clearInterval(id);
  }, [load]);

  // быстрая бронь с первого экрана
  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent<Prefill>).detail;
      setDate(d.date);
      setGuests(d.guests);
      setTime(null);
      setTableId(null);
    };
    window.addEventListener(PREFILL_EVENT, on);
    return () => window.removeEventListener(PREFILL_EVENT, on);
  }, []);

  const loading = !data || data.date !== date || data.guests !== guests;
  const slot = !loading ? data.slots.find((s) => s.time === time) : undefined;
  const free = useMemo(() => new Set(slot?.free ?? []), [slot]);
  // если выбранный столик заняли, пока гость думал, — выбор снимается сам
  const tableId = pickedTable && free.has(pickedTable) ? pickedTable : null;
  const table = data?.tables.find((t) => t.id === tableId);
  const visibleSlots = useMemo(() => (!loading && data ? data.slots : []).filter((s) => !s.past), [loading, data]);

  const freeByHall = (h: Hall) => (data?.tables ?? []).filter((t) => t.hall === h && free.has(t.id)).length;

  const alternatives = useMemo(() => {
    if (!time || loading || (slot && slot.free.length)) return [];
    const t = fromHHMM(time);
    return visibleSlots
      .filter((s) => s.free.length)
      .sort((a, b) => Math.abs(fromHHMM(a.time) - t) - Math.abs(fromHHMM(b.time) - t))
      .slice(0, 3)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [time, loading, slot, visibleSlots]);

  const stateOf = (t: TableRow): TableState => {
    if (!data?.suitable.includes(t.id)) return "unfit";
    if (!time) return "neutral";
    if (t.id === tableId) return "selected";
    return free.has(t.id) ? "free" : "taken";
  };

  const pickTime = (t: string) => {
    setTime(t);
    setTableId(null);
    setError(null);
    // если в открытом зале всё занято — переключаем на зал, где есть свободные
    const s = data?.slots.find((x) => x.time === t);
    if (s && data && !data.tables.some((tb) => tb.hall === hall && s.free.includes(tb.id))) {
      const firstHall = HALL_ORDER.find((h) => data.tables.some((tb) => tb.hall === h && s.free.includes(tb.id)));
      if (firstHall) setHall(firstHall);
    }
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!time || !tableId) return;
    setSending(true);
    setError(null);
    try {
      const r = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, time, guests, tableId, name, phone, comment, occasion, preorder: lines.map((l) => ({ id: l.id, qty: l.qty })) }),
      });
      const j = await r.json();
      if (!r.ok) {
        setError(j.error);
        if (j.taken) {
          setTableId(null);
          load();
        }
        return;
      }
      setDone(j);
      preorder.clear();
      requestAnimationFrame(() => {
        const els = root.current?.querySelectorAll("[data-done] > *");
        if (els) gsap.fromTo(els, { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1, stagger: 0.06 });
      });
    } catch {
      setError("Нет связи с сервером. Попробуйте ещё раз.");
    } finally {
      setSending(false);
    }
  }

  async function joinWaitlist(e: React.FormEvent) {
    e.preventDefault();
    if (!time) return;
    setWl((w) => ({ ...w, busy: true }));
    setError(null);
    try {
      const r = await fetch("/api/waitlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date, time, guests, name: wl.name, phone: wl.phone }) });
      const j = await r.json();
      if (!r.ok) setError(j.error);
      else setWl((w) => ({ ...w, sent: true }));
    } catch {
      setError("Нет связи с сервером");
    } finally {
      setWl((w) => ({ ...w, busy: false }));
    }
  }

  if (done) {
    const cal = calendarLinks(done);
    const end = toHHMM(fromHHMM(done.time) + DURATION_MIN);
    return (
      <div ref={root} aria-live="polite" className="border border-line-strong bg-ink-2">
        <div data-done className="flex flex-col">
          <div className="flex items-center justify-between border-b border-line px-6 py-4 md:px-10">
            <span className="label flex items-center gap-2 text-juniper">
              <span className="h-1.5 w-1.5 rounded-full bg-juniper" /> Бронь подтверждена
            </span>
            <span className="label text-paper-faint">{RESTAURANT.name}</span>
          </div>
          <div className="px-6 py-10 md:px-10">
            <p className="label text-paper-faint">Код брони</p>
            <p className="display tabular mt-2 text-[clamp(56px,9vw,120px)] text-brass">{done.code}</p>
            <h3 className="display mt-6 text-[clamp(32px,4vw,56px)]">
              Ждём вас, <span className="italic-accent">{done.name.split(" ")[0]}</span>
            </h3>
          </div>
          <dl className="grid grid-cols-2 border-t border-line md:grid-cols-4">
            {[
              ["Дата", longDate(done.date)],
              ["Время", `${done.time} – ${end}`],
              ["Столик", `№${done.table} · ${HALLS[done.hall].title}`],
              ["Гостей", String(done.guests)],
            ].map(([k, v], i) => (
              <div key={k} className={`border-line p-6 md:px-10 ${i % 2 === 0 ? "border-r" : ""} ${i < 2 ? "border-b md:border-b-0" : ""} md:border-r md:last:border-r-0`}>
                <dt className="label text-paper-faint">{k}</dt>
                <dd className="mt-2 text-lg">{v}</dd>
              </div>
            ))}
          </dl>
          {done.preorder?.length > 0 && (
            <div className="border-t border-line px-6 py-6 md:px-10">
              <p className="label text-paper-faint">Предзаказ — кухня начнёт готовить к вашему приходу</p>
              <ul className="mt-3 grid gap-x-12 gap-y-1 sm:grid-cols-2">
                {done.preorder.map((l) => (
                  <li key={l.id} className="flex justify-between gap-4 border-b border-line py-2 text-[15px]">
                    <span>{l.qty}× {l.name}</span>
                    <span className="tabular text-paper-dim">{som(l.qty * l.price)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-right">Итого: <span className="text-brass-2">{som(done.preorderTotal)}</span> <span className="label text-paper-faint">оплата в ресторане</span></p>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3 border-t border-line px-6 py-5 md:px-10">
            <span className="label mr-2 text-paper-faint">В календарь</span>
            <a className="btn btn-ghost !min-h-10 !px-4" href={cal.google} target="_blank" rel="noreferrer">Google ↗</a>
            <a className="btn btn-ghost !min-h-10 !px-4" href={cal.icsHref} download={`archa-${done.code}.ics`}>Apple / Outlook (.ics)</a>
          </div>
          <div className="flex flex-col gap-6 border-t border-line px-6 py-8 md:flex-row md:items-center md:justify-between md:px-10">
            <p className="max-w-md text-sm leading-relaxed text-paper-dim">
              Сохраните код — по нему и телефону бронь можно найти или отменить. Столик держим 15 минут после начала.
            </p>
            <div className="flex flex-wrap gap-3">
              <a className="btn btn-primary" href={`/my?code=${done.code}`}>Моя бронь</a>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setDone(null);
                  setTime(null);
                  setTableId(null);
                  setComment("");
                  load();
                }}
              >
                Новая бронь
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={root} className="grid grid-cols-[minmax(0,1fr)] gap-x-4 gap-y-12 lg:grid-cols-12">
      {/* Левая колонка: параметры */}
      <div className="min-w-0 lg:sticky lg:top-24 lg:col-span-5 lg:self-start">
        <Step n="01" title="Дата" aside={longDate(date)}>
          <div className="no-scrollbar -mx-[var(--gutter)] flex gap-px overflow-x-auto px-[var(--gutter)] lg:mx-0 lg:grid lg:grid-cols-7 lg:px-0" data-lenis-prevent>
            {days.map((d, i) => {
              const x = new Date(d + "T00:00:00Z");
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={d === date}
                  aria-label={longDate(d)}
                  onClick={() => {
                    setDate(d);
                    setTime(null);
                    setTableId(null);
                  }}
                  className="opt flex min-w-[58px] shrink-0 flex-col items-center justify-center !py-2.5 leading-tight"
                >
                  <span className="label opacity-70">{i === 0 ? "Сег" : i === 1 ? "Завт" : WD[x.getUTCDay()]}</span>
                  <span className="display mt-1 text-2xl">{x.getUTCDate()}</span>
                </button>
              );
            })}
          </div>
          <label className="label mt-3 inline-flex cursor-pointer items-center gap-2 text-paper-dim">
            <span className="ulink">Другая дата →</span>
            <input
              type="date"
              min={today}
              max={addDays(today, DAYS_AHEAD)}
              value={date}
              onChange={(e) => {
                if (!e.target.value) return;
                setDate(e.target.value);
                setTime(null);
                setTableId(null);
              }}
              className="w-0 opacity-0"
              aria-label="Выбрать другую дату"
            />
          </label>
        </Step>

        <Step n="02" title="Гости" aside={guests >= MAX_GUESTS ? `Больше ${MAX_GUESTS} — по телефону` : undefined}>
          <div className="flex items-center justify-between border-y border-line py-3">
            <button type="button" className="opt h-12 w-12 text-xl" onClick={() => setGuests((g) => Math.max(1, g - 1))} disabled={guests <= 1} aria-label="Меньше гостей">−</button>
            <p className="text-center" aria-live="polite">
              <span className="display tabular text-6xl">{guests}</span>
              <span className="ml-2 text-paper-dim">{guestsWord(guests)}</span>
            </p>
            <button type="button" className="opt h-12 w-12 text-xl" onClick={() => setGuests((g) => Math.min(MAX_GUESTS, g + 1))} disabled={guests >= MAX_GUESTS} aria-label="Больше гостей">+</button>
          </div>
        </Step>

        <Step n="03" title="Время" aside="Столик ваш на 2 часа">
          {loading ? (
            <div className="grid grid-cols-4 gap-px sm:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => <div key={i} className="h-[46px] animate-pulse bg-ink-3" />)}
            </div>
          ) : visibleSlots.length === 0 ? (
            <p className="border border-dashed border-line p-5 text-paper-dim">Сегодня приём броней закончен — последняя в 21:00. Выберите другой день.</p>
          ) : (
            <div className="grid grid-cols-4 gap-px sm:grid-cols-5">
              {visibleSlots.map((s) => (
                <button
                  key={s.time}
                  type="button"
                  aria-pressed={s.time === time}
                  onClick={() => pickTime(s.time)}
                  className={`opt tabular font-mono ${s.free.length ? "" : "!border-dashed text-paper-faint"}`}
                  title={s.free.length ? `Свободно столиков: ${s.free.length}` : "Все подходящие столики заняты"}
                >
                  {s.time}
                </button>
              ))}
            </div>
          )}
          <p className="label mt-3 text-paper-faint">Пунктир — нет свободных столиков на вашу компанию</p>
        </Step>
      </div>

      {/* Правая колонка: план зала и подтверждение */}
      <div className="min-w-0 lg:col-span-6 lg:col-start-7">
        <div className="border border-line-strong bg-ink-2/70">
          <div className="flex border-b border-line" role="tablist" aria-label="Залы">
            {HALL_ORDER.map((h) => (
              <button
                key={h}
                role="tab"
                aria-selected={hall === h}
                onClick={() => setHall(h)}
                className={`relative min-h-[64px] flex-1 px-3 py-3 text-left transition-colors sm:px-5 ${hall === h ? "text-paper" : "text-paper-faint hover:text-paper-dim"}`}
              >
                <span className="block text-[14px] sm:text-[15px]">{HALLS[h].title}</span>
                <span className="label mt-1 block">{time && !loading ? `свободно: ${freeByHall(h)}` : HALLS[h].note.split(",")[0]}</span>
                <span className={`absolute inset-x-0 bottom-0 h-px origin-left bg-brass transition-transform duration-500 ${hall === h ? "scale-x-100" : "scale-x-0"}`} />
              </button>
            ))}
          </div>

          <div className="p-5 md:p-8">
            {data ? (
              <FloorPlan
                hall={hall}
                tables={data.tables}
                stateOf={stateOf}
                onPick={time ? (t) => { const s = stateOf(t); if (s !== "taken" && s !== "unfit") setTableId(t.id); } : undefined}
                caption={(t) => {
                  const s = stateOf(t);
                  const base = `Столик №${t.number}, ${t.seats} ${seatsWord(t.seats)}`;
                  return s === "unfit" ? `${base} — не подходит для ${guests} ${guestsWord(guests)}` : s === "taken" ? `${base} — занят` : base;
                }}
              />
            ) : (
              <div className="aspect-[16/10] animate-pulse bg-ink-3" />
            )}
            <div className="mt-5">
              <Legend items={time ? [["free", "Свободен"], ["selected", "Ваш выбор"], ["taken", "Занят"], ["unfit", "Не по размеру"]] : [["neutral", "Подходит"], ["unfit", "Не по размеру компании"]]} />
            </div>
          </div>

          <div className="border-t border-line p-5 md:p-8">
            {!time ? (
              <p className="text-paper-dim">Выберите время — на плане появятся свободные столики.</p>
            ) : !loading && slot && slot.free.length === 0 ? (
              <div>
                <p className="text-lg">
                  На {time} свободных столиков на {guests} {guestsWord(guests)} нет.
                </p>
                {alternatives.length ? (
                  <>
                    <p className="label mt-4 text-paper-faint">Ближайшее свободное время</p>
                    <div className="mt-2 flex flex-wrap gap-px">
                      {alternatives.map((a) => (
                        <button key={a.time} type="button" className="opt tabular font-mono !border-brass text-brass" onClick={() => pickTime(a.time)}>
                          {a.time}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="mt-2 text-paper-dim">В этот день всё занято — выберите другую дату.</p>
                )}
                <div className="mt-8 border-t border-line pt-6">
                  <p className="label text-brass">Лист ожидания</p>
                  {wl.sent ? (
                    <p className="mt-3 text-paper-dim">Вы в листе ожидания на {time}. Если столик освободится — администратор позвонит или напишет в WhatsApp.</p>
                  ) : (
                    <form onSubmit={joinWaitlist} className="mt-3">
                      <p className="text-paper-dim">Оставьте телефон — если кто-то отменит бронь на {time}, мы сразу предложим столик вам.</p>
                      <div className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
                        <input className="field" placeholder="Имя" value={wl.name} onChange={(e) => setWl({ ...wl, name: e.target.value })} required minLength={2} maxLength={60} autoComplete="name" />
                        <input className="field tabular font-mono" type="tel" inputMode="tel" value={wl.phone} onChange={(e) => setWl({ ...wl, phone: e.target.value })} required autoComplete="tel" />
                      </div>
                      <button className="btn btn-primary mt-5" disabled={wl.busy}>{wl.busy ? "Записываем…" : "Встать в лист ожидания"}</button>
                    </form>
                  )}
                </div>
                <a
                  className="btn btn-ghost mt-6"
                  target="_blank"
                  rel="noreferrer"
                  href={`https://wa.me/${RESTAURANT.whatsapp}?text=${encodeURIComponent(`Здравствуйте! Хочу столик на ${guests} ${guestsWord(guests)}, ${longDate(date)} в ${time}. Есть ли варианты?`)}`}
                >
                  Спросить в WhatsApp ↗
                </a>
              </div>
            ) : !table ? (
              <p className="text-paper-dim">
                Нажмите на свободный столик на плане{" "}
                <span className="text-paper">
                  ({freeByHall(hall)} в зале «{HALLS[hall].title}»)
                </span>
                .
              </p>
            ) : (
              <form onSubmit={submit}>
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <p className="display text-[clamp(28px,3vw,40px)]">
                    Столик №{table.number} <span className="italic-accent">· {HALLS[table.hall].title}</span>
                  </p>
                  <p className="label text-paper-dim">
                    {longDate(date)} · {time}–{toHHMM(fromHHMM(time) + DURATION_MIN)} · {guests} {guestsWord(guests)}
                  </p>
                </div>
                <fieldset className="mt-6">
                  <legend className="label text-paper-faint">Повод — необязательно</legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {OCCASIONS.map((o) => (
                      <button key={o.id} type="button" aria-pressed={occasion === o.id} onClick={() => setOccasion(occasion === o.id ? null : o.id)} className="opt !min-h-10 !rounded-full !px-4 text-sm">
                        {o.label}
                      </button>
                    ))}
                  </div>
                  {occasion === "birthday" && <p className="mt-2 text-sm text-brass-2">Подготовим свечу и комплимент от шефа.</p>}
                </fieldset>
                <div className="mt-6 grid gap-x-6 sm:grid-cols-2">
                  <label className="block">
                    <span className="label text-paper-faint">Имя</span>
                    <input className="field" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={60} autoComplete="name" placeholder="Как к вам обращаться" />
                  </label>
                  <label className="mt-4 block sm:mt-0">
                    <span className="label text-paper-faint">Телефон</span>
                    <input className="field tabular font-mono" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required autoComplete="tel" />
                  </label>
                  <label className="mt-4 block sm:col-span-2">
                    <span className="label text-paper-faint">Пожелание — необязательно</span>
                    <input className="field" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={300} placeholder="День рождения, детский стульчик, у окна…" />
                  </label>
                </div>
                <div className="mt-8 border-t border-line pt-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="label text-paper-faint">Предзаказ блюд — необязательно</p>
                    <a href="#menu" className="label ulink text-paper-dim">{lines.length ? "Изменить в меню" : "Выбрать в меню →"}</a>
                  </div>
                  {lines.length ? (
                    <ul className="mt-3">
                      {lines.map((l) => (
                        <li key={l.id} className="flex items-center justify-between gap-3 border-b border-line py-2 text-[15px]">
                          <span className="min-w-0 flex-1 truncate">{l.name}</span>
                          <span className="flex items-center gap-1">
                            <button type="button" onClick={() => preorder.add(l.id, -1)} aria-label={`Меньше: ${l.name}`} className="grid h-8 w-8 place-items-center rounded-full border border-line">−</button>
                            <span className="tabular w-6 text-center">{l.qty}</span>
                            <button type="button" onClick={() => preorder.add(l.id)} aria-label={`Больше: ${l.name}`} className="grid h-8 w-8 place-items-center rounded-full border border-line">+</button>
                          </span>
                          <span className="tabular w-24 text-right text-paper-dim">{som(l.sum)}</span>
                        </li>
                      ))}
                      <li className="flex justify-between pt-3">
                        <span className="text-paper-dim">Итого, оплата в ресторане</span>
                        <span className="text-brass-2">{som(cartTotal(cart))}</span>
                      </li>
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-paper-faint">Добавьте блюда из меню — кухня начнёт готовить к вашему приходу.</p>
                  )}
                </div>
                <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="label max-w-xs text-paper-faint">Бесплатно, без депозита. Отменить можно по коду брони.</p>
                  <button className="btn btn-primary" disabled={sending}>
                    {sending ? "Бронируем…" : "Подтвердить бронь →"}
                  </button>
                </div>
              </form>
            )}
            {error && (
              <p role="alert" className="mt-6 border-l-2 border-danger bg-danger/10 px-4 py-3 text-danger">
                {error}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Step({ n, title, aside, children }: { n: string; title: string; aside?: string; children: React.ReactNode }) {
  return (
    <div className="mb-10 last:mb-0">
      <div className="label mb-4 flex items-baseline justify-between gap-3 text-paper-dim">
        <span>
          <span className="text-brass">{n}</span> — {title}
        </span>
        {aside && <span className="text-paper-faint">{aside}</span>}
      </div>
      {children}
    </div>
  );
}
