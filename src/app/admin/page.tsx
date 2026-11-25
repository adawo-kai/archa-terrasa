import { Suspense } from "react";
import { isAdmin } from "@/lib/db";
import { Dashboard, Login } from "./Admin";

export const metadata = { title: "Админка — Арча Терраса", robots: { index: false } };

// Проверка пароля на сервере: без правильной cookie данные админки не отдаются вообще
async function Gate() {
  return (await isAdmin()) ? <Dashboard /> : <Login />;
}

export default function AdminPage() {
  return (
    <Suspense fallback={<main className="wrap grid min-h-[100svh] place-items-center text-paper-faint">Загрузка…</main>}>
      <Gate />
    </Suspense>
  );
}
