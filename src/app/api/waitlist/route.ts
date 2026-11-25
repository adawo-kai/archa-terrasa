import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { MAX_GUESTS, checkWhen, isValidDate, isValidSlot, normalizePhone } from "@/lib/rules";

/** Лист ожидания: свободных столиков нет — гость оставляет телефон, администратор видит заявку в админке. */
export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  const guests = Number(b?.guests);
  const name = String(b?.name ?? "").trim();
  const phone = normalizePhone(String(b?.phone ?? ""));
  if (!isValidDate(b?.date) || !isValidSlot(b?.time)) return bad("Выберите дату и время");
  if (!Number.isInteger(guests) || guests < 1 || guests > MAX_GUESTS) return bad("Неверное число гостей");
  if (name.length < 2 || name.length > 60) return bad("Введите имя");
  if (!phone) return bad("Телефон в формате +996 XXX XX XX XX");
  const whenErr = checkWhen(b.date, b.time);
  if (whenErr) return bad(whenErr);

  const { error } = await db.from("archa_waitlist").insert({ date: b.date, time: b.time, guests, name, phone });
  if (error?.code === "23505") return NextResponse.json({ ok: true, already: true });
  if (error) {
    console.error(error);
    return NextResponse.json({ error: "Не удалось записать в лист ожидания" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

const bad = (error: string) => NextResponse.json({ error }, { status: 400 });
