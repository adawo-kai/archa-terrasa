import { NextResponse } from "next/server";
import { checkPassword, setAdminCookie } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  await new Promise((r) => setTimeout(r, 400)); // замедляем подбор пароля
  if (!checkPassword(String(body?.password ?? ""))) {
    return NextResponse.json({ error: "Неверный пароль" }, { status: 401 });
  }
  await setAdminCookie();
  return NextResponse.json({ ok: true });
}
