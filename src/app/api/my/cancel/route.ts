import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { findOwn } from "@/lib/own";

export async function POST(req: Request) {
  const own = await findOwn(await req.json().catch(() => null));
  if (!own) return NextResponse.json({ error: "Бронь не найдена" }, { status: 404 });
  if (own.status !== "booked") return NextResponse.json({ error: "Эту бронь уже нельзя отменить" }, { status: 400 });
  if (new Date(own.starts_at).getTime() <= Date.now())
    return NextResponse.json({ error: "Время брони уже наступило — позвоните нам" }, { status: 400 });

  // .eq("status","booked") — если админ параллельно поменял статус, отмена не перезапишет его
  const { data, error } = await db
    .from("archa_bookings")
    .update({ status: "cancelled", cancelled_by: "guest" })
    .eq("id", own.id)
    .eq("status", "booked")
    .select("id");
  if (error || !data?.length) return NextResponse.json({ error: "Не удалось отменить" }, { status: 409 });
  return NextResponse.json({ ok: true });
}
