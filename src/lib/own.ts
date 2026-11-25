import "server-only";
import { db } from "./db";
import { normalizePhone } from "./rules";

// Своя функция: гость находит свою бронь по коду + телефону (оба должны совпасть)
export async function findOwn(body: unknown) {
  const b = (body ?? {}) as { code?: string; phone?: string };
  const code = String(b.code ?? "").trim().toUpperCase();
  const phone = normalizePhone(String(b.phone ?? ""));
  if (!code || !phone) return null;
  const { data } = await db
    .from("archa_bookings")
    .select("id, code, starts_at, guests, name, status, cancelled_by, archa_tables(number, hall)")
    .eq("code", code)
    .eq("phone", phone)
    .maybeSingle();
  return data;
}
