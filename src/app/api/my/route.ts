import { NextResponse } from "next/server";
import { findOwn } from "@/lib/own";
import { fromInstant } from "@/lib/rules";

export async function POST(req: Request) {
  const data = await findOwn(await req.json().catch(() => null));
  if (!data) return NextResponse.json({ error: "Бронь не найдена. Проверьте код и телефон." }, { status: 404 });
  return NextResponse.json({ ...data, ...fromInstant(data.starts_at) });
}
