import { NextResponse } from "next/server";
import { db, newCode } from "@/lib/db";
import { dishById } from "@/lib/content";
import {
  DURATION_MIN,
  MAX_GUESTS,
  checkWhen,
  fits,
  isValidDate,
  isValidSlot,
  normalizePhone,
  seatsWord,
  toInstant,
} from "@/lib/rules";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const { date, time, tableId, comment } = body ?? {};
  const guests = Number(body?.guests);
  const name = String(body?.name ?? "").trim();
  const phone = normalizePhone(String(body?.phone ?? ""));

  if (!isValidDate(date) || !isValidSlot(time)) return bad("Выберите дату и время");
  if (!Number.isInteger(guests) || guests < 1 || guests > MAX_GUESTS) return bad(`Гостей — от 1 до ${MAX_GUESTS}`);
  if (name.length < 2 || name.length > 60) return bad("Введите имя");
  if (!phone) return bad("Телефон в формате +996 XXX XX XX XX");
  const whenErr = checkWhen(date, time);
  if (whenErr) return bad(whenErr);

  const occasion = ["birthday", "date", "business", "family"].includes(body?.occasion) ? body.occasion : null;
  // Предзаказ: цены и названия берём из меню на сервере — суммам из браузера не доверяем
  const raw: unknown[] = Array.isArray(body?.preorder) ? body.preorder.slice(0, 30) : [];
  const preorder = raw
    .map((x) => {
      const it = x as { id?: string; qty?: number };
      const d = dishById(String(it.id ?? ""));
      const qty = Math.min(20, Math.max(0, Math.floor(Number(it.qty))));
      return d && qty > 0 ? { id: d.id, name: d.name, qty, price: d.price } : null;
    })
    .filter((x) => x !== null);
  const preorderTotal = preorder.reduce((sum, l) => sum + l.qty * l.price, 0);

  const { data: table } = await db.from("archa_tables").select("*").eq("id", Number(tableId)).maybeSingle();
  if (!table || !table.active) return bad("Столик не найден");
  if (!fits(table.seats, guests)) return bad(`Столик №${table.number} на ${table.seats} ${seatsWord(table.seats)} не подходит для ${guests} гостей`);

  const starts = toInstant(date, time);
  const ends = new Date(starts.getTime() + DURATION_MIN * 60_000);

  // Код брони уникален; при редком совпадении пробуем ещё раз
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = newCode();
    const { error } = await db.from("archa_bookings").insert({
      code,
      table_id: table.id,
      starts_at: starts.toISOString(),
      ends_at: ends.toISOString(),
      guests,
      name,
      phone,
      comment: comment ? String(comment).slice(0, 300) : null,
      occasion,
      preorder: preorder.length ? preorder : null,
      preorder_total: preorderTotal,
    });
    if (!error) return NextResponse.json({ code, table: table.number, hall: table.hall, date, time, guests, name, phone, occasion, preorder, preorderTotal });
    // 23P01 — сработало ограничение базы «время столика не пересекается»: кто-то успел раньше
    if (error.code === "23P01") {
      return NextResponse.json(
        { error: "Этот столик только что заняли на это время. Выберите другой — список обновлён.", taken: true },
        { status: 409 },
      );
    }
    if (error.code === "23505" && error.message.includes("code")) continue;
    console.error(error);
    return NextResponse.json({ error: "Не удалось сохранить бронь" }, { status: 500 });
  }
  return NextResponse.json({ error: "Попробуйте ещё раз" }, { status: 500 });
}

const bad = (error: string) => NextResponse.json({ error }, { status: 400 });
