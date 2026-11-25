import "server-only";
import { createClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import {
  DURATION_MIN,
  addDays,
  allSlots,
  bishkekNow,
  fits,
  fromHHMM,
  overlaps,
  toInstant,
  type BookingRow,
  type TableRow,
} from "./rules";

// Данные лежат в Supabase (Postgres). Ключ — только на сервере, в переменных окружения.
export const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export async function getTables(onlyActive = true) {
  let q = db.from("archa_tables").select("id, number, hall, seats, active").order("number");
  if (onlyActive) q = q.eq("active", true);
  const { data, error } = await q;
  if (error) throw error;
  return data as TableRow[];
}

/** Все неотменённые брони, задевающие этот день */
export async function getDayBookings(date: string, includeCancelled = false) {
  const from = toInstant(date, "00:00").toISOString();
  const to = toInstant(addDays(date, 1), "00:00").toISOString();
  let q = db
    .from("archa_bookings")
    .select("*")
    .lt("starts_at", to)
    .gt("ends_at", from)
    .order("starts_at");
  if (!includeCancelled) q = q.neq("status", "cancelled");
  const { data, error } = await q;
  if (error) throw error;
  return data as BookingRow[];
}

/** Для каждого времени дня — какие подходящие столики свободны */
export async function getAvailability(date: string, guests: number) {
  const [tables, bookings] = await Promise.all([getTables(), getDayBookings(date)]);
  const now = bishkekNow();
  const suitable = tables.filter((t) => fits(t.seats, guests));
  const slots = allSlots().map((time) => {
    const start = toInstant(date, time).getTime();
    const end = start + DURATION_MIN * 60_000;
    const past = date < now.date || (date === now.date && fromHHMM(time) <= now.minutes);
    const free = past
      ? []
      : suitable
          .filter(
            (t) =>
              !bookings.some(
                (b) =>
                  b.table_id === t.id &&
                  overlaps(start, end, new Date(b.starts_at).getTime(), new Date(b.ends_at).getTime()),
              ),
          )
          .map((t) => t.id);
    return { time, past, free };
  });
  return { tables, suitable: suitable.map((t) => t.id), slots };
}

export function newCode() {
  return "AR-" + Math.floor(1000 + Math.random() * 9000) + String.fromCharCode(65 + Math.floor(Math.random() * 26));
}

// ---- Админка: пароль задаётся в переменной ADMIN_PASSWORD (на Vercel → Settings → Environment Variables) ----
const COOKIE = "archa_admin";
const token = () => createHmac("sha256", process.env.AUTH_SECRET!).update("admin:" + process.env.ADMIN_PASSWORD).digest("hex");

export function checkPassword(pw: string) {
  const a = Buffer.from(pw);
  const b = Buffer.from(process.env.ADMIN_PASSWORD || "");
  return a.length === b.length && b.length > 0 && timingSafeEqual(a, b);
}

export async function setAdminCookie() {
  (await cookies()).set(COOKIE, token(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearAdminCookie() {
  (await cookies()).delete(COOKIE);
}

export async function isAdmin() {
  const v = (await cookies()).get(COOKIE)?.value;
  if (!v) return false;
  const a = Buffer.from(v);
  const b = Buffer.from(token());
  return a.length === b.length && timingSafeEqual(a, b);
}
