"use client";

import { useState } from "react";
import { longDate } from "@/components/Booking";
import { DURATION_MIN, HALLS, STATUS_LABEL, fromHHMM, toHHMM, type Hall, type Status } from "@/lib/rules";

type Found = {
  code: string;
  date: string;
  time: string;
  guests: number;
  name: string;
  status: Status;
  cancelled_by: string | null;
  archa_tables: { number: number; hall: Hall };
};

export default function MyBooking({ initialCode }: { initialCode: string }) {
  const [code, setCode] = useState(initialCode);
  const [phone, setPhone] = useState("+996 ");
  const [found, setFound] = useState<Found | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);

  async function call(path: string) {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, phone }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      return j;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
      return null;
    } finally {
      setBusy(false);
    }
  }

  const find = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const j = await call("/api/my");
    setFound(j);
    setConfirm(false);
  };
  const cancel = async () => {
    if (await call("/api/my/cancel")) await find();
  };

  const statusText = found
    ? found.status === "cancelled" && found.cancelled_by === "guest"
      ? "Вы отменили"
      : found.status === "booked"
        ? "Подтверждена"
        : STATUS_LABEL[found.status]
    : "";

  return (
    <div className="mt-10">
      <form onSubmit={find} className="grid gap-6">
        <label className="block">
          <span className="label text-paper-faint">Код брони</span>
          <input className="field tabular font-mono uppercase" placeholder="AR-4827K" value={code} onChange={(e) => setCode(e.target.value)} required autoCapitalize="characters" />
        </label>
        <label className="block">
          <span className="label text-paper-faint">Телефон</span>
          <input className="field tabular font-mono" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required autoComplete="tel" />
        </label>
        <button className="btn btn-primary mt-2 w-full sm:w-auto sm:justify-self-start" disabled={busy}>
          {busy ? "Ищем…" : "Найти бронь →"}
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-6 border-l-2 border-danger bg-danger/10 px-4 py-3 text-danger">
          {error}
        </p>
      )}

      {found && (
        <div className="mt-10 border border-line-strong bg-ink-2" aria-live="polite">
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <span className="label tabular text-brass">{found.code}</span>
            <span className={`label flex items-center gap-2 ${found.status === "cancelled" ? "text-danger" : "text-juniper"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${found.status === "cancelled" ? "bg-danger" : "bg-juniper"}`} />
              {statusText}
            </span>
          </div>
          <div className="p-5">
            <p className="display text-4xl">{found.name}</p>
            <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4">
              <div>
                <dt className="label text-paper-faint">Когда</dt>
                <dd className="mt-1">{longDate(found.date)}, {found.time}–{toHHMM(fromHHMM(found.time) + DURATION_MIN)}</dd>
              </div>
              <div>
                <dt className="label text-paper-faint">Столик</dt>
                <dd className="mt-1">№{found.archa_tables.number} · {HALLS[found.archa_tables.hall].title} · {found.guests} гост.</dd>
              </div>
            </dl>
            {found.status === "booked" &&
              (confirm ? (
                <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-5">
                  <span className="mr-auto text-sm text-paper-dim">Точно отменить? Столик сразу уйдёт другим гостям.</span>
                  <button className="btn bg-danger text-ink" onClick={cancel} disabled={busy}>Да, отменить</button>
                  <button className="btn btn-ghost" onClick={() => setConfirm(false)}>Нет</button>
                </div>
              ) : (
                <button className="btn btn-ghost mt-6" onClick={() => setConfirm(true)}>Отменить бронь</button>
              ))}
            {found.status === "cancelled" && <p className="mt-5 text-sm text-paper-faint">Столик освобождён для других гостей. Спасибо, что предупредили!</p>}
          </div>
        </div>
      )}
    </div>
  );
}
