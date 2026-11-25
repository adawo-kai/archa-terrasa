"use client";

import { RESTAURANT } from "@/lib/rules";
import { Icon, json, type Day, type WaitRow, type WaitStatus } from "./ui";

const STEP: Record<WaitStatus, { text: string; tone: string }> = {
  waiting: { text: "Ожидает", tone: "border-brass/50 bg-brass/15 text-brass-2" },
  contacted: { text: "Связались", tone: "border-paper/30 bg-paper/[0.06] text-paper" },
  booked: { text: "Забронировали", tone: "border-juniper/50 bg-juniper/15 text-juniper" },
  closed: { text: "Закрыто", tone: "border-line bg-paper/[0.03] text-paper-faint" },
};

const MON = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
const dayText = (date: string) => {
  const d = new Date(date + "T00:00:00Z");
  return `${d.getUTCDate()} ${MON[d.getUTCMonth()]}`;
};
const guestsWord = (n: number) =>
  n % 10 === 1 && n % 100 !== 11 ? "гость" : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? "гостя" : "гостей";

/**
 * Лист ожидания: гостям не хватило столика на это время, они оставили телефон.
 * Когда кто-то отменяет бронь — администратор видит, кому позвонить или написать первым.
 */
export default function Waitlist({ day, notify }: { day: Day; notify: (t: string, k?: "ok" | "error") => void }) {
  const { waitlist, loading, setWaitlist, reload } = day;
  const open = waitlist.filter((w) => w.status === "waiting" || w.status === "contacted");

  async function setStatus(w: WaitRow, status: WaitStatus) {
    setWaitlist((list) => list.map((x) => (x.id === w.id ? { ...x, status } : x)));
    const r = await fetch(`/api/admin/waitlist/${w.id}`, { method: "PATCH", ...json({ status }) });
    if (!r.ok) notify((await r.json().catch(() => ({}))).error ?? "Не удалось сохранить", "error");
    else notify(`${w.name.split(" ")[0]}: ${STEP[status].text.toLowerCase()}`);
    reload();
  }

  return (
    <section aria-labelledby="wl-title" className="rounded-2xl border border-line bg-ink-2/60">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line px-5 py-4">
        <h2 id="wl-title" className="label flex items-center gap-2 text-paper-dim">
          Лист ожидания
          {open.length > 0 && <span className="tabular grid h-5 min-w-5 place-items-center rounded-full bg-ember px-1.5 text-[11px] text-ink">{open.length}</span>}
        </h2>
        <span className="label text-paper-faint">Гости, которым не хватило столика · освободилось место — свяжитесь</span>
      </div>

      {loading ? (
        <div className="h-16 animate-pulse" />
      ) : waitlist.length === 0 ? (
        <p className="px-5 py-6 text-sm text-paper-faint">На этот день в листе ожидания никого нет.</p>
      ) : (
        <ul className="divide-y divide-line">
          {waitlist.map((w) => {
            const text = `Здравствуйте, ${w.name.split(" ")[0]}! Освободился столик на ${dayText(w.date)} ${w.time} в ${RESTAURANT.name} — забронировать за вами?`;
            const wa = `https://wa.me/${w.phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
            const done = w.status === "booked" || w.status === "closed";
            return (
              <li key={w.id} className={`flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center ${done ? "opacity-55" : ""}`}>
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <span className="display tabular w-[72px] shrink-0 text-2xl">{w.time}</span>
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {w.name} <span className="text-paper-faint">· {w.guests} {guestsWord(w.guests)}</span>
                    </p>
                    <a href={`tel:${w.phone.replace(/\s/g, "")}`} className="ulink font-mono text-xs text-paper-dim">
                      {w.phone}
                    </a>
                  </div>
                  <span className={`label ml-auto inline-flex h-7 items-center rounded-full border px-2.5 whitespace-nowrap lg:hidden ${STEP[w.status].tone}`}>{STEP[w.status].text}</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 lg:justify-end">
                  <span className={`label mr-1 hidden h-7 items-center rounded-full border px-2.5 whitespace-nowrap lg:inline-flex ${STEP[w.status].tone}`}>{STEP[w.status].text}</span>
                  {!done && (
                    <a href={wa} target="_blank" rel="noreferrer" className="opt inline-flex !min-h-10 items-center gap-1.5 rounded-full! !px-3.5 text-[13px] whitespace-nowrap hover:!border-juniper hover:!text-juniper">
                      <Icon name="phone" className="h-3.5 w-3.5" /> Написать в WhatsApp
                    </a>
                  )}
                  {w.status === "waiting" && (
                    <button type="button" className="opt !min-h-10 rounded-full! !px-3.5 text-[13px]" onClick={() => setStatus(w, "contacted")}>
                      Связались
                    </button>
                  )}
                  {!done && (
                    <>
                      <button type="button" className="opt !min-h-10 rounded-full! !px-3.5 text-[13px] hover:!border-juniper hover:!text-juniper" onClick={() => setStatus(w, "booked")}>
                        Забронировали
                      </button>
                      <button type="button" className="opt !min-h-10 rounded-full! !px-3.5 text-[13px] text-paper-faint" onClick={() => setStatus(w, "closed")}>
                        Закрыть
                      </button>
                    </>
                  )}
                  {done && (
                    <button type="button" className="opt !min-h-10 rounded-full! !px-3.5 text-[13px]" onClick={() => setStatus(w, "waiting")}>
                      Вернуть в ожидание
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
