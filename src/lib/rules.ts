// Правила ресторана — одно место, где они заданы (их используют и страница, и сервер).

export const RESTAURANT = {
  name: "Арча Терраса",
  city: "Бишкек",
  address: "ул. Токтогула, 112",
  phone: "+996 555 410 112",
  whatsapp: "996555410112",
  hours: "Ежедневно 11:00 – 23:00",
};

export const OPEN_MIN = 11 * 60; // 11:00
export const LAST_START_MIN = 21 * 60; // последняя бронь 21:00 (закрытие 23:00)
export const STEP_MIN = 30;
export const DURATION_MIN = 120; // бронь занимает столик на 2 часа
export const MAX_GUESTS = 10;
export const DAYS_AHEAD = 30;
export const EXTRA_SEATS = 2; // столик может быть больше компании максимум на 2 места

export type Hall = "main" | "terrace" | "vip";
export const HALLS: Record<Hall, { title: string; note: string }> = {
  main: { title: "Основной зал", note: "Камин, панорамные окна" },
  terrace: { title: "Терраса", note: "Вид на горы, пледы" },
  vip: { title: "VIP-комната", note: "Закрытый зал для компаний" },
};

export type TableRow = { id: number; number: number; hall: Hall; seats: number; active: boolean };
export type Status = "booked" | "came" | "no_show" | "cancelled";
export type BookingRow = {
  id: number;
  code: string;
  table_id: number;
  starts_at: string;
  ends_at: string;
  guests: number;
  name: string;
  phone: string;
  comment: string | null;
  status: Status;
  cancelled_by: "guest" | "admin" | null;
  created_at: string;
};

// ---- Время Бишкека (UTC+6, без перехода на летнее время) ----
const TZ_OFFSET_MIN = 6 * 60;

export function bishkekNow() {
  const d = new Date(Date.now() + TZ_OFFSET_MIN * 60_000);
  return { date: d.toISOString().slice(0, 10), minutes: d.getUTCHours() * 60 + d.getUTCMinutes() };
}

export function addDays(date: string, n: number) {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export const toHHMM = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
export const fromHHMM = (s: string) => {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
};

/** "2026-11-24" + "19:30" → момент времени (UTC) */
export function toInstant(date: string, time: string) {
  return new Date(`${date}T${time}:00+06:00`);
}

/** момент → { date, time } по Бишкеку */
export function fromInstant(iso: string) {
  const d = new Date(new Date(iso).getTime() + TZ_OFFSET_MIN * 60_000);
  return { date: d.toISOString().slice(0, 10), time: d.toISOString().slice(11, 16) };
}

export function allSlots() {
  const out: string[] = [];
  for (let m = OPEN_MIN; m <= LAST_START_MIN; m += STEP_MIN) out.push(toHHMM(m));
  return out;
}

export const isValidDate = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
export const isValidSlot = (s: unknown): s is string => typeof s === "string" && allSlots().includes(s);

/** Подходит ли столик компании: мест хватает и столик не слишком большой */
export const fits = (seats: number, guests: number) => seats >= guests && seats <= guests + EXTRA_SEATS;

/** Пересекаются ли [aStart, aStart+2ч) и [bStart, bEnd) */
export function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && bStart < aEnd;
}

/** Проверка даты/времени: не в прошлом, не дальше 30 дней */
export function checkWhen(date: string, time: string): string | null {
  const now = bishkekNow();
  if (date < now.date) return "Эта дата уже прошла";
  if (date > addDays(now.date, DAYS_AHEAD)) return `Бронь принимается не больше чем на ${DAYS_AHEAD} дней вперёд`;
  if (date === now.date && fromHHMM(time) <= now.minutes) return "Это время сегодня уже прошло";
  return null;
}

export function normalizePhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  let d = digits;
  if (d.startsWith("0") && d.length === 10) d = "996" + d.slice(1);
  if (d.length === 9) d = "996" + d;
  if (!/^996\d{9}$/.test(d)) return null;
  return `+996 ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8, 10)} ${d.slice(10, 12)}`;
}

export const STATUS_LABEL: Record<Status, string> = {
  booked: "Ожидаем",
  came: "Пришли",
  no_show: "Не пришли",
  cancelled: "Отменена",
};

export const seatsWord = (n: number) => (n % 10 === 1 && n % 100 !== 11 ? "место" : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? "места" : "мест");
