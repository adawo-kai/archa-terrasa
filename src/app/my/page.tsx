import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { photo } from "@/lib/content";
import { RESTAURANT } from "@/lib/rules";
import MyBooking from "./MyBooking";

export const metadata = { title: "Моя бронь — Арча Терраса" };

async function WithCode({ searchParams }: { searchParams: PageProps<"/my">["searchParams"] }) {
  const { code } = await searchParams;
  return <MyBooking initialCode={typeof code === "string" ? code : ""} />;
}

export default function Page({ searchParams }: PageProps<"/my">) {
  return (
    <main className="grid min-h-[100svh] lg:grid-cols-2">
      <div className="photo relative hidden lg:block">
        <Image src={photo("hall-main")} alt="Основной зал ресторана" fill priority sizes="50vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-ink/50" />
        <div className="px-gutter absolute inset-x-0 bottom-0 pb-10">
          <p className="display text-[clamp(56px,6vw,104px)] italic">Арча</p>
          <p className="label mt-3 text-paper-dim">
            {RESTAURANT.city}, {RESTAURANT.address} · {RESTAURANT.hours}
          </p>
        </div>
      </div>

      <div className="px-gutter flex flex-col py-6">
        <header className="flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-2.5">
            <span className="inline-block h-2 w-2 rotate-45 bg-brass transition-transform duration-700 group-hover:rotate-[225deg]" />
            <span className="label">Арча Терраса</span>
          </Link>
          <Link href="/#book" className="label ulink text-paper-dim">Новая бронь →</Link>
        </header>

        <div className="mx-auto my-auto w-full max-w-lg py-16">
          <p className="label text-paper-dim">
            <span className="text-brass">(—)</span> Моя бронь
          </p>
          <h1 className="display mt-6 text-[clamp(48px,6vw,88px)]">
            Найти или <span className="italic-accent">отменить</span> бронь
          </h1>
          <p className="mt-5 max-w-md leading-relaxed text-paper-dim">
            Введите код из подтверждения и телефон, на который бронировали. Если планы поменялись — отмените, и столик сразу освободится для других гостей.
          </p>
          <Suspense fallback={<MyBooking initialCode="" />}>
            <WithCode searchParams={searchParams} />
          </Suspense>
        </div>

        <p className="label text-paper-faint">
          Вопросы — {RESTAURANT.phone} · <a className="ulink" href={`https://wa.me/${RESTAURANT.whatsapp}`} target="_blank" rel="noreferrer">WhatsApp ↗</a>
        </p>
      </div>
    </main>
  );
}
