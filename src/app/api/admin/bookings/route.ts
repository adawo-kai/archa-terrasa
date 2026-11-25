import { NextResponse } from "next/server";
import { db, getDayBookings, getTables, isAdmin } from "@/lib/db";
import { isValidDate } from "@/lib/rules";

export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Нужен вход" }, { status: 401 });
  const date = new URL(req.url).searchParams.get("date");
  if (!isValidDate(date)) return NextResponse.json({ error: "Неверная дата" }, { status: 400 });
  const [bookings, tables, wl] = await Promise.all([
    getDayBookings(date, true),
    getTables(false),
    // лист ожидания на этот день: гости, которым не хватило столика
    db.from("archa_waitlist").select("*").eq("date", date).order("time").order("created_at"),
  ]);
  return NextResponse.json({ bookings, tables, waitlist: wl.data ?? [] });
}
