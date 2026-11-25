"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { addDays, bishkekNow, type BookingRow, type Status } from "@/lib/rules";
import BookingsView from "./BookingsView";
import NewBooking from "./NewBooking";
import PlanView from "./PlanView";
import TablesView from "./TablesView";
import { BrandMark, Icon, STATUS_TEXT, Toast, json, useClock, useDay, useToast } from "./ui";

export { Login } from "./Login";

type View = "bookings" | "plan" | "tables";
const NAV: { id: View; label: string; short: string; icon: "list" | "plan" | "tables" }[] = [
  { id: "bookings", label: "Брони", short: "Брони", icon: "list" },
  { id: "plan", label: "План зала", short: "План", icon: "plan" },
  { id: "tables", label: "Столики", short: "Столики", icon: "tables" },
];
const TITLES: Record<View, string> = { bookings: "Брони", plan: "План зала", tables: "Столики" };

const WD = ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"];
const MON = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
const human = (date: string) => {
  const d = new Date(date + "T00:00:00Z");
  return { day: `${d.getUTCDate()} ${MON[d.getUTCMonth()]}`, wd: WD[d.getUTCDay()] };
};

export function Dashboard() {
  const today = useMemo(() => bishkekNow().date, []);
  const [view, setView] = useState<View>("bookings");
  const [date, setDate] = useState(today);
  const [creating, setCreating] = useState(false);
  const day = useDay(date);
  const toast = useToast();
  const clock = useClock();
  const isToday = date === today;
  const nowMin = isToday && clock ? Number(clock.slice(0, 2)) * 60 + Number(clock.slice(3)) : null;
  const { setBookings, reload } = day;
  // счётчик листа ожидания на выбранный день — виден на вкладке «Брони»
  const waiting = day.waitlist.filter((w) => w.status === "waiting" || w.status === "contacted").length;
  const { show } = toast;

  const setStatus = useCallback(
    async (b: BookingRow, status: Status) => {
      // сразу показываем новый статус, затем сохраняем; при ошибке — сообщение и данные с сервера
      setBookings((list) => list.map((x) => (x.id === b.id ? { ...x, status, cancelled_by: status === "cancelled" ? "admin" : null } : x)));
      const r = await fetch(`/api/admin/bookings/${b.id}`, { method: "PATCH", ...json({ status }) });
      if (!r.ok) show((await r.json().catch(() => ({}))).error ?? "Не удалось сохранить", "error");
      else show(`${b.name.split(" ")[0]} · ${b.code}: ${status === "cancelled" ? "бронь отменена" : STATUS_TEXT[status].toLowerCase()}`);
      reload();
    },
    [setBookings, reload, show],
  );

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    location.reload();
  };

  const h = human(date);

  return (
    <div className="min-h-[100svh] lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      {/* боковая панель — десктоп */}
      <aside className="sticky top-0 hidden h-[100svh] flex-col border-r border-line bg-ink-2/40 px-5 py-6 lg:flex">
        <Link href="/" className="px-2" aria-label="На сайт ресторана">
          <BrandMark />
        </Link>
        <p className="label mt-1 pl-[28px] text-paper-faint">Админка</p>
        <nav className="mt-10 flex flex-col gap-1" aria-label="Разделы админки">
          {NAV.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => setView(n.id)}
              aria-current={view === n.id ? "page" : undefined}
              className={`flex h-11 items-center gap-3 rounded-xl px-3 text-left text-[15px] transition-colors ${
                view === n.id ? "bg-paper/[0.07] text-paper" : "text-paper-dim hover:bg-paper/[0.04] hover:text-paper"
              }`}
            >
              <Icon name={n.icon} className={`h-[18px] w-[18px] ${view === n.id ? "text-brass" : ""}`} />
              {n.label}
              {n.id === "bookings" && waiting > 0 && (
                <span className="label ml-auto rounded-full bg-ember/15 px-2 py-0.5 text-ember" title="Лист ожидания на выбранный день">
                  Ожидают · {waiting}
                </span>
              )}
            </button>
          ))}
        </nav>
        <button type="button" onClick={() => setCreating(true)} className="btn btn-primary mt-6 !min-h-11">
          <Icon name="plus" className="h-4 w-4" /> Новая бронь
        </button>
        <div className="mt-auto flex flex-col gap-3 border-t border-line px-2 pt-5">
          <p className="label flex justify-between text-paper-faint">
            <span>Бишкек</span>
            <span className="tabular text-paper-dim">{clock ?? "--:--"}</span>
          </p>
          <button type="button" onClick={logout} className="label flex h-11 items-center gap-2 text-paper-dim hover:text-paper">
            <Icon name="logout" className="h-4 w-4" /> Выйти
          </button>
        </div>
      </aside>

      <div className="min-w-0">
        {/* верхняя панель — телефон */}
        <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-ink/90 px-4 backdrop-blur-md lg:hidden">
          <Link href="/" aria-label="На сайт ресторана">
            <BrandMark small />
          </Link>
          <div className="flex items-center gap-1">
            <span className="label tabular mr-2 text-paper-faint">{clock ?? "--:--"}</span>
            <button type="button" onClick={logout} className="grid h-11 w-11 place-items-center text-paper-dim" aria-label="Выйти">
              <Icon name="logout" className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>

        <main className="mx-auto w-full max-w-[1400px] px-4 pt-6 pb-28 sm:px-6 lg:px-10 lg:pt-10 lg:pb-16">
          <header className="mb-8 flex flex-col gap-5 border-b border-line pb-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="label text-paper-faint">{TITLES[view]}</p>
              <h1 className="display mt-2 text-[clamp(40px,5vw,64px)]">
                {view === "tables" ? (
                  "Залы и столики"
                ) : (
                  <>
                    {h.day} <span className="italic-accent text-[0.6em]">{isToday ? "сегодня" : h.wd}</span>
                  </>
                )}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {view !== "tables" && (
                <>
                  <div className="flex h-11 items-stretch overflow-hidden rounded-full border border-line-strong">
                    <button type="button" className="grid w-11 place-items-center hover:bg-paper/[0.06]" onClick={() => setDate(addDays(date, -1))} aria-label="Предыдущий день">
                      <Icon name="chevron-l" className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className={`label border-x border-line px-4 transition-colors ${isToday ? "bg-paper text-ink" : "hover:bg-paper/[0.06]"}`}
                      onClick={() => setDate(today)}
                      aria-pressed={isToday}
                    >
                      Сегодня
                    </button>
                    <button type="button" className="grid w-11 place-items-center hover:bg-paper/[0.06]" onClick={() => setDate(addDays(date, 1))} aria-label="Следующий день">
                      <Icon name="chevron-r" className="h-4 w-4" />
                    </button>
                  </div>
                  <label>
                    <span className="sr-only">Выбрать дату</span>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => e.target.value && setDate(e.target.value)}
                      className="h-11 rounded-full border border-line-strong bg-transparent px-4 font-mono text-sm text-paper [color-scheme:dark] outline-none focus:border-brass"
                    />
                  </label>
                </>
              )}
              <button type="button" onClick={() => reload()} className="label flex h-11 items-center gap-2 rounded-full px-3 text-paper-faint hover:text-paper" title="Обновить сейчас">
                <Icon name="refresh" className="h-4 w-4" />
                {day.updatedAt ? `обновлено ${day.updatedAt}` : "загрузка…"}
              </button>
            </div>
          </header>

          {view === "bookings" && <BookingsView day={day} nowMin={nowMin} setStatus={setStatus} notify={show} />}
          {view === "plan" && <PlanView key={date} day={day} date={date} nowMin={nowMin} isToday={isToday} setStatus={setStatus} />}
          {view === "tables" && <TablesView day={day} notify={show} />}
        </main>
      </div>

      {/* нижние вкладки — телефон */}
      <nav className="fixed inset-x-0 bottom-0 z-50 grid h-16 grid-cols-4 border-t border-line bg-ink/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden" aria-label="Разделы админки">
        {NAV.map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => setView(n.id)}
            aria-current={view === n.id ? "page" : undefined}
            className={`relative flex flex-col items-center justify-center gap-1 ${view === n.id ? "text-brass" : "text-paper-faint"}`}
          >
            {n.id === "bookings" && waiting > 0 && (
              <span className="tabular absolute top-1.5 left-1/2 ml-2 grid h-4 min-w-4 place-items-center rounded-full bg-ember px-1 text-[10px] text-ink" aria-label={`Лист ожидания: ${waiting}`}>
                {waiting}
              </span>
            )}
            <Icon name={n.icon} />
            <span className="text-[11px]">{n.short}</span>
          </button>
        ))}
        <button type="button" onClick={() => setCreating(true)} className="flex flex-col items-center justify-center gap-1 text-paper-faint">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-brass text-ink">
            <Icon name="plus" className="h-4 w-4" />
          </span>
          <span className="text-[11px]">Бронь</span>
        </button>
      </nav>

      {creating && (
        <NewBooking
          date={date < today ? today : date}
          onClose={() => setCreating(false)}
          onDone={(text) => {
            setCreating(false);
            show(text);
            reload();
          }}
        />
      )}
      <Toast msg={toast.msg} onClose={toast.hide} />
    </div>
  );
}
