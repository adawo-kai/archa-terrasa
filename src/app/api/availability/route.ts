import { NextResponse } from "next/server";
import { getAvailability } from "@/lib/db";
import { MAX_GUESTS, isValidDate } from "@/lib/rules";


export async function GET(req: Request) {
  const url = new URL(req.url);
  const date = url.searchParams.get("date");
  const guests = Number(url.searchParams.get("guests"));
  if (!isValidDate(date) || !Number.isInteger(guests) || guests < 1 || guests > MAX_GUESTS) {
    return NextResponse.json({ error: "Неверные параметры" }, { status: 400 });
  }
  try {
    return NextResponse.json(await getAvailability(date, guests));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "База данных недоступна" }, { status: 500 });
  }
}
