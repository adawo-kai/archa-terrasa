import { NextResponse } from "next/server";
import { db, isAdmin } from "@/lib/db";

const ALLOWED = ["booked", "came", "no_show", "cancelled"];

export async function PATCH(req: Request, ctx: RouteContext<"/api/admin/bookings/[id]">) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Нужен вход" }, { status: 401 });
  const { id } = await ctx.params;
  const { status } = (await req.json().catch(() => ({}))) as { status?: string };
  if (!status || !ALLOWED.includes(status)) return NextResponse.json({ error: "Неверный статус" }, { status: 400 });

  const { error } = await db
    .from("archa_bookings")
    .update({ status, cancelled_by: status === "cancelled" ? "admin" : null })
    .eq("id", Number(id));
  if (error) {
    // вернуть отменённую бронь нельзя, если столик уже занял кто-то другой
    const msg = error.code === "23P01" ? "Столик на это время уже занят другой бронью" : "Не удалось сохранить";
    return NextResponse.json({ error: msg }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
