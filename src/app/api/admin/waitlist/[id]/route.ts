import { NextResponse } from "next/server";
import { db, isAdmin } from "@/lib/db";

const ALLOWED = ["waiting", "contacted", "booked", "closed"];

export async function PATCH(req: Request, ctx: RouteContext<"/api/admin/waitlist/[id]">) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Нужен вход" }, { status: 401 });
  const { id } = await ctx.params;
  const { status } = (await req.json().catch(() => ({}))) as { status?: string };
  if (!status || !ALLOWED.includes(status)) return NextResponse.json({ error: "Неверный статус" }, { status: 400 });
  const { data, error } = await db.from("archa_waitlist").update({ status }).eq("id", Number(id)).select("id");
  if (error) return NextResponse.json({ error: "Не удалось сохранить" }, { status: 400 });
  if (!data?.length) return NextResponse.json({ error: "Запись не найдена" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
