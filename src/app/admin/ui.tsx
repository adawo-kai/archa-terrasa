"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { bishkekNow, toHHMM, type BookingRow, type Status, type TableRow } from "@/lib/rules";

// ---------- новые поля брони и лист ожидания ----------
export type Occasion = "birthday" | "date" | "business" | "family";
export type PreItem = { id: string; name: string; qty: number; price: number };
/** Бронь в админке: базовая строка + повод визита и предзаказ блюд */
export type AdminBooking = BookingRow & { occasion?: Occasion | null; preorder?: PreItem[] | null; preorder_total?: number | null };
export type WaitStatus = "waiting" | "contacted" | "booked" | "closed";
export type WaitRow = { id: number; date: string; time: string; guests: number; name: string; phone: string; status: WaitStatus; created_at: string };

export const OCCASION_TEXT: Record<Occasion, string> = {
  birthday: "🎂 День рождения",
  date: "Свидание",
  business: "Деловая встреча",
  family: "С семьёй",
};

export const som = (n: number) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} сом`;

export function OccasionBadge({ o }: { o?: Occasion | null }) {
  if (!o || !OCCASION_TEXT[o]) return null;
  return (
    <span
      className={`label inline-flex h-6 items-center rounded-full border px-2 whitespace-nowrap ${
        o === "birthday" ? "border-ember/50 bg-ember/10 text-ember" : "border-line-strong text-paper-dim"
      }`}
    >
      {OCCASION_TEXT[o]}
    </span>
  );
}

/** Предзаказ: «2× Манты · 1× Чай» в одну строку, длинный — раскрывается по нажатию */
export function Preorder({ b, compact = false }: { b: AdminBooking; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const items = b.preorder ?? [];
  if (!items.length) return null;
  const total = b.preorder_total || items.reduce((s, i) => s + i.qty * i.price, 0);
  const line = items.map((i) => `${i.qty}× ${i.name}`).join(" · ");
  const long = items.length > 2 || line.length > 48;
  return (
    <div className={`text-xs ${compact ? "" : "mt-1.5"}`}>
      <button
        type="button"
        onClick={() => long && setOpen((v) => !v)}
        aria-expanded={long ? open : undefined}
        className={`label inline-flex items-center gap-1.5 text-juniper ${long ? "hover:text-paper" : "cursor-default"}`}
      >
        Предзаказ · {som(total)} {long && <span aria-hidden>{open ? "▴" : "▾"}</span>}
      </button>
      {long && open ? (
        <ul className="mt-1 flex flex-col gap-0.5 text-paper-dim">
          {items.map((i) => (
            <li key={i.id} className="flex justify-between gap-4">
              <span>
                {i.qty}× {i.name}
              </span>
              <span className="tabular font-mono text-paper-faint">{som(i.qty * i.price)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-0.5 truncate text-paper-dim" title={line}>
          {line}
        </p>
      )}
    </div>
  );
}

export const json = (body: unknown) => ({ headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export const STATUS_TEXT: Record<Status, string> = {
  booked: "Ожидаем",
  came: "Пришли",
  no_show: "Не пришли",
  cancelled: "Отменена",
};

/** Цвета статусов — одни и те же в таблице, на шахматке и на плане */
export const STATUS_TONE: Record<Status, string> = {
  booked: "border-brass/50 bg-brass/15 text-brass-2",
  came: "border-juniper/50 bg-juniper/15 text-juniper",
  no_show: "border-danger/50 bg-danger/15 text-danger",
  cancelled: "border-line bg-paper/[0.03] text-paper-faint",
};

export function statusText(b: BookingRow) {
  if (b.status === "cancelled") return b.cancelled_by === "guest" ? "Отменил гость" : "Отменена";
  return STATUS_TEXT[b.status];
}

export function StatusBadge({ b }: { b: BookingRow }) {
  return (
    <span className={`label inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 whitespace-nowrap ${STATUS_TONE[b.status]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {statusText(b)}
    </span>
  );
}

export function Stepper({
  value,
  min = 1,
  max = 20,
  onChange,
  label,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
  label: string;
}) {
  return (
    <div className="inline-flex h-11 items-stretch overflow-hidden rounded-full border border-line-strong" role="group" aria-label={label}>
      <button
        type="button"
        className="grid w-11 place-items-center text-lg transition-colors hover:bg-paper/[0.06] disabled:opacity-30"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label={`${label}: меньше`}
      >
        −
      </button>
      <span className="tabular grid min-w-9 place-items-center border-x border-line font-mono text-sm" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className="grid w-11 place-items-center text-lg transition-colors hover:bg-paper/[0.06] disabled:opacity-30"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={`${label}: больше`}
      >
        +
      </button>
    </div>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="group inline-flex h-11 items-center gap-2.5"
    >
      <span className={`relative h-6 w-11 rounded-full border transition-colors duration-300 ${checked ? "border-juniper bg-juniper/30" : "border-line-strong bg-paper/[0.04]"}`}>
        <span
          className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full transition-all duration-300 [transition-timing-function:var(--ease-out)] ${
            checked ? "left-[22px] bg-juniper" : "left-[3px] bg-paper-faint"
          }`}
        />
      </span>
      <span className={`label w-16 text-left ${checked ? "text-juniper" : "text-paper-faint"}`}>{checked ? "В работе" : "Выключен"}</span>
    </button>
  );
}

// ---------- уведомления ----------
export type ToastMsg = { text: string; kind: "ok" | "error" };

export function useToast() {
  const [msg, setMsg] = useState<ToastMsg | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((text: string, kind: ToastMsg["kind"] = "ok") => {
    setMsg({ text, kind });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), kind === "error" ? 6000 : 3000);
  }, []);
  return { msg, show, hide: () => setMsg(null) };
}

export function Toast({ msg, onClose }: { msg: ToastMsg | null; onClose: () => void }) {
  if (!msg) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[70] flex justify-center px-4 lg:bottom-6">
      <div
        role={msg.kind === "error" ? "alert" : "status"}
        className={`pointer-events-auto flex max-w-md items-start gap-3 rounded-2xl border px-4 py-3 shadow-2xl shadow-black/50 backdrop-blur-md ${
          msg.kind === "error" ? "border-danger/40 bg-[#2a1411]/95 text-danger" : "border-juniper/40 bg-[#151c14]/95 text-juniper"
        }`}
      >
        <span className="pt-0.5 text-sm">{msg.text}</span>
        <button type="button" onClick={onClose} aria-label="Закрыть уведомление" className="-mr-1 grid h-6 w-6 shrink-0 place-items-center opacity-70 hover:opacity-100">
          ×
        </button>
      </div>
    </div>
  );
}

// ---------- данные дня ----------
type DayState = { date: string; bookings: AdminBooking[]; tables: TableRow[]; waitlist: WaitRow[]; at: string };

/** Брони и столики на дату. Обновляется сам каждые 15 секунд — новые брони с сайта появляются без перезагрузки. */
export function useDay(date: string) {
  const [state, setState] = useState<DayState | null>(null);
  const current = useRef(date);

  const load = useCallback(async () => {
    current.current = date;
    try {
      const r = await fetch(`/api/admin/bookings?date=${date}`, { cache: "no-store" });
      if (r.status === 401) {
        location.reload();
        return;
      }
      const j = await r.json();
      if (current.current !== date) return; // пока грузили, админ переключил дату
      setState({ date, bookings: j.bookings ?? [], tables: j.tables ?? [], waitlist: j.waitlist ?? [], at: toHHMM(bishkekNow().minutes) });
    } catch {
      /* временно нет сети — попробуем при следующем обновлении */
    }
  }, [date]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- состояние меняется после await (загрузка с сервера)
    load();
    const id = setInterval(load, 15_000);
    return () => clearInterval(id);
  }, [load]);

  const fresh = state?.date === date ? state : null;
  return {
    bookings: fresh?.bookings ?? [],
    tables: state?.tables ?? [],
    waitlist: fresh?.waitlist ?? [],
    loading: !fresh,
    updatedAt: fresh?.at ?? null,
    reload: load,
    setTables: (fn: (t: TableRow[]) => TableRow[]) => setState((s) => (s ? { ...s, tables: fn(s.tables) } : s)),
    setBookings: (fn: (b: AdminBooking[]) => AdminBooking[]) => setState((s) => (s ? { ...s, bookings: fn(s.bookings) } : s)),
    setWaitlist: (fn: (w: WaitRow[]) => WaitRow[]) => setState((s) => (s ? { ...s, waitlist: fn(s.waitlist) } : s)),
  };
}
export type Day = ReturnType<typeof useDay>;

export function useClock() {
  const [t, setT] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => setT(toHHMM(bishkekNow().minutes));
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 15_000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);
  return t;
}

export function BrandMark({ small = false }: { small?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className={`inline-block rotate-45 bg-brass ${small ? "h-2 w-2" : "h-2.5 w-2.5"}`} />
      <span className="label">Арча Терраса</span>
    </span>
  );
}

export function Icon({ name, className = "h-5 w-5" }: { name: "list" | "plan" | "tables" | "plus" | "logout" | "search" | "eye" | "eye-off" | "phone" | "chevron-l" | "chevron-r" | "close" | "refresh"; className?: string }) {
  const p: Record<typeof name, React.ReactNode> = {
    list: <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />,
    plan: <path d="M3 5h18v14H3zM9 5v14M3 12h6M15 9h3M15 15h3" />,
    tables: <><circle cx="8" cy="8" r="3" /><rect x="13" y="13" width="7" height="6" rx="1" /><path d="M14 5h6M17 2v6M3 16h6" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    logout: <path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10" />,
    search: <><circle cx="11" cy="11" r="6" /><path d="M20 20l-4.5-4.5" /></>,
    eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
    "eye-off": <path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.6C3.9 8.3 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2" />,
    phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />,
    "chevron-l": <path d="M15 6l-6 6 6 6" />,
    "chevron-r": <path d="M9 6l6 6-6 6" />,
    close: <path d="M6 6l12 12M18 6L6 18" />,
    refresh: <path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" />,
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {p[name]}
    </svg>
  );
}
