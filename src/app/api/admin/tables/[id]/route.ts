import { NextResponse } from "next/server";
import { db, isAdmin } from "@/lib/db";
import { HALLS } from "@/lib/rules";

export async function PATCH(req: Request, ctx: RouteContext<"/api/admin/tables/[id]">) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Нужен вход" }, { status: 401 });
  const { id } = await ctx.params;
  const b = (await req.json().catch(() => ({}))) as { hall?: string; seats?: number; active?: boolean };
  const patch: Record<string, unknown> = {};
  if (b.hall !== undefined) {
    if (!(b.hall in HALLS)) return NextResponse.json({ error: "Неверный зал" }, { status: 400 });
    patch.hall = b.hall;
  }
  if (b.seats !== undefined) {
    const s = Number(b.seats);
    if (!Number.isInteger(s) || s < 1 || s > 20) return NextResponse.json({ error: "Мест: 1–20" }, { status: 400 });
    patch.seats = s;
  }
  if (b.active !== undefined) patch.active = Boolean(b.active);
  const { error } = await db.from("archa_tables").update(patch).eq("id", Number(id));
  if (error) return NextResponse.json({ error: "Не удалось сохранить" }, { status: 400 });

  // выключили столик, а на нём есть будущие брони — предупреждаем: их нужно перенести или отменить вручную
  if (patch.active === false) {
    const { count } = await db
      .from("archa_bookings")
      .select("id", { count: "exact", head: true })
      .eq("table_id", Number(id))
      .eq("status", "booked")
      .gt("starts_at", new Date().toISOString());
    if (count) {
      return NextResponse.json({ ok: true, warning: `Столик выключен, но на нём ${count} будущ. брон${count === 1 ? "ь" : "и"} — проверьте их во вкладке «Брони»` });
    }
  }
  return NextResponse.json({ ok: true });
}
