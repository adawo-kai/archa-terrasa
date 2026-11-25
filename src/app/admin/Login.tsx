"use client";

import Link from "next/link";
import { useState } from "react";
import { BrandMark, Icon, json } from "./ui";

export function Login() {
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!pw) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/admin/login", { method: "POST", ...json({ password: pw }) });
      if (r.ok) return location.reload();
      setErr((await r.json()).error ?? "Неверный пароль");
    } catch {
      setErr("Нет связи с сервером");
    }
    setBusy(false);
  }

  return (
    <main className="relative grid min-h-[100svh] place-items-center overflow-hidden px-4">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(201,162,107,0.10),transparent_70%)]" />
      <div className="relative w-full max-w-[400px]">
        <div className="flex justify-center">
          <BrandMark />
        </div>
        <form onSubmit={submit} className="mt-10 rounded-[28px] border border-line bg-ink-2/80 p-8 backdrop-blur sm:p-10">
          <p className="label text-paper-faint">Вход для персонала</p>
          <h1 className="display mt-3 text-[52px]">Админка</h1>
          <p className="mt-3 text-sm text-paper-dim">Брони, план зала и столики ресторана.</p>

          <label className="mt-10 block">
            <span className="label text-paper-faint">Пароль</span>
            <span className="relative mt-1 block">
              <input
                className={`field pr-12 ${err ? "!border-danger" : ""}`}
                type={show ? "text" : "password"}
                value={pw}
                onChange={(e) => {
                  setPw(e.target.value);
                  setErr(null);
                }}
                autoFocus
                required
                autoComplete="current-password"
                aria-invalid={!!err}
                aria-describedby={err ? "login-err" : undefined}
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute top-1/2 right-0 grid h-11 w-11 -translate-y-1/2 place-items-center text-paper-faint hover:text-paper"
                aria-label={show ? "Скрыть пароль" : "Показать пароль"}
                aria-pressed={show}
              >
                <Icon name={show ? "eye-off" : "eye"} />
              </button>
            </span>
          </label>
          <p id="login-err" role="alert" className="mt-2 min-h-5 text-sm text-danger">
            {err}
          </p>

          <button className="btn btn-primary mt-6 w-full" disabled={busy || !pw}>
            {busy ? "Проверяем…" : "Войти"}
          </button>
        </form>
        <p className="mt-6 text-center">
          <Link href="/" className="label ulink text-paper-faint hover:text-paper">
            ← На сайт ресторана
          </Link>
        </p>
      </div>
    </main>
  );
}
