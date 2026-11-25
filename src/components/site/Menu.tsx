"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { DIET_LABEL, MENU, photo, type Diet } from "@/lib/content";
import { preorder, useCart } from "@/lib/preorder";
import { SectionHead } from "./Sections";

const CATS = ["Все", ...MENU.map((c) => c.title)];
const DIETS = Object.keys(DIET_LABEL) as Diet[];

/** Меню: категории и фильтры (как у Dishoom), фото всегда на карточке, предзаказ блюд к брони. */
export default function Menu() {
  const [cat, setCat] = useState("Все");
  const [diet, setDiet] = useState<Diet | null>(null);
  const cart = useCart();

  const items = useMemo(
    () =>
      MENU.filter((c) => cat === "Все" || c.title === cat)
        .flatMap((c) => c.items.map((d) => ({ ...d, id: d.photo, category: c.title })))
        .filter((d) => !diet || d.diet?.includes(diet)),
    [cat, diet],
  );

  return (
    <section id="menu" aria-labelledby="menu-title" className="relative pt-[12vh] pb-[12vh]">
      <SectionHead index="02" label="Меню" aside="Цены в сомах · обслуживание 10%" />
      <div className="px-gutter mt-12 grid grid-cols-12 items-end gap-x-4 gap-y-6 md:mt-16">
        <h2 id="menu-title" data-reveal="lines" className="display col-span-12 text-[clamp(44px,6.4vw,110px)] md:col-span-8">
          Блюда, <span className="italic-accent">ради которых</span> возвращаются
        </h2>
        <p data-reveal="fade" className="col-span-12 max-w-sm text-paper-dim md:col-span-4 md:justify-self-end md:text-right">
          Добавьте блюда к брони — кухня начнёт готовить к вашему приходу, и не придётся ждать.
        </p>
      </div>

      {/* фильтры */}
      <div className="px-gutter sticky top-16 z-30 mt-10 border-y border-line bg-ink/85 py-3 backdrop-blur-md md:mt-14">
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto" data-lenis-prevent>
          {CATS.map((c) => (
            <button key={c} type="button" aria-pressed={cat === c} onClick={() => setCat(c)} className="opt shrink-0 !rounded-full !px-4 !min-h-10 text-sm">
              {c}
            </button>
          ))}
          <span className="mx-2 h-6 w-px shrink-0 bg-line" aria-hidden />
          {DIETS.map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={diet === d}
              onClick={() => setDiet(diet === d ? null : d)}
              className="opt shrink-0 !rounded-full !px-4 !min-h-10 text-sm"
            >
              {DIET_LABEL[d]}
            </button>
          ))}
        </div>
      </div>

      <ul className="px-gutter mt-8 grid gap-x-4 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((d) => {
          const qty = cart[d.id] ?? 0;
          return (
            <li key={d.id} className="group flex flex-col">
              <div className="photo relative aspect-[4/3] w-full">
                <Image
                  src={photo(d.photo)}
                  alt={d.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-[1.2s] [transition-timing-function:var(--ease-out)] group-hover:scale-[1.03]"
                />
                <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5">
                  {d.tag && <span className="label rounded-full bg-brass px-2.5 py-1 text-ink">{d.tag}</span>}
                  {d.diet?.map((t) => (
                    <span key={t} className="label rounded-full bg-ink/70 px-2.5 py-1 text-paper backdrop-blur">
                      {DIET_LABEL[t]}
                    </span>
                  ))}
                </div>
              </div>
              <div className="label mt-4 flex justify-between border-t border-line pt-3 text-paper-faint">
                <span>{d.category}</span>
                <span>{d.weight}</span>
              </div>
              <div className="mt-3 flex items-start justify-between gap-4">
                <h3 className="display text-[clamp(26px,2.4vw,36px)]">{d.name}</h3>
                <span className="display tabular shrink-0 pt-1 text-[clamp(22px,2vw,30px)] text-brass-2">{d.price}</span>
              </div>
              <p className="mt-2 text-[15px] text-paper-faint">{d.note}</p>
              <div className="mt-auto pt-5">
                {qty === 0 ? (
                  <button type="button" onClick={() => preorder.add(d.id)} className="btn btn-ghost !min-h-11 w-full">
                    + Добавить к брони
                  </button>
                ) : (
                  <div className="flex min-h-11 items-center justify-between rounded-full border border-brass/60 px-1.5">
                    <button type="button" onClick={() => preorder.add(d.id, -1)} aria-label={`Убрать ${d.name}`} className="grid h-9 w-9 place-items-center rounded-full hover:bg-paper/10">−</button>
                    <span className="label text-brass-2" aria-live="polite">В предзаказе · {qty}</span>
                    <button type="button" onClick={() => preorder.add(d.id)} aria-label={`Ещё ${d.name}`} className="grid h-9 w-9 place-items-center rounded-full hover:bg-paper/10">+</button>
                  </div>
                )}
              </div>
            </li>
          );
        })}
        {items.length === 0 && <li className="text-paper-faint">В этой категории нет блюд с таким фильтром.</li>}
      </ul>
    </section>
  );
}
