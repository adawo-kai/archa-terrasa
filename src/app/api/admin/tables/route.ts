import { NextResponse } from "next/server";
import { db, isAdmin } from "@/lib/db";
import { HALLS } from "@/lib/rules";

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Нужен вход" }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as { number?: number; hall?: string; seats?: number };
  const number = Number(b.number), seats = Number(b.seats);
  if (!Number.isInteger(number) || number < 1) return NextResponse.json({ error: "Номер столика" }, { status: 400 });
  if (!b.hall || !(b.hall in HALLS)) return NextResponse.json({ error: "Выберите зал" }, { status: 400 });
  if (!Number.isInteger(seats) || seats < 1 || seats > 20) return NextResponse.json({ error: "Мест: 1–20" }, { status: 400 });
  const { error } = await db.from("archa_tables").insert({ number, hall: b.hall, seats });
  if (error) {
    const msg = error.code === "23505" ? `Столик №${number} уже есть` : "Не удалось добавить";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
