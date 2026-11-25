"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion, useIsoLayoutEffect } from "@/lib/gsap";
import { introDone } from "@/lib/intro";
import { getLenis, scrollToId } from "../SmoothScroll";
import { LocalTime, OpenStatus } from "./Live";

const ITEMS = [
  { id: "about", label: "О нас" },
  { id: "menu", label: "Меню" },
  { id: "halls", label: "Залы" },
  { id: "info", label: "Контакты" },
];

export default function Nav() {
  const root = useRef<HTMLElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);

  useIsoLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set("[data-nav-item]", { autoAlpha: 0, y: -12 });
      introDone.then(() => gsap.to("[data-nav-item]", { autoAlpha: 1, y: 0, duration: 1, stagger: 0.05, delay: 0.5 }));
    }, root);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const el = menu.current;
    if (!el) return;
    const reduced = prefersReducedMotion();
    if (open) {
      getLenis()?.stop();
      gsap.set(el, { visibility: "visible" });
      gsap.fromTo(el, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: reduced ? 0 : 0.9, ease: "expo.inOut" });
      gsap.fromTo(el.querySelectorAll("[data-menu-link]"), { yPercent: 110 }, { yPercent: 0, duration: reduced ? 0 : 1, stagger: 0.05, delay: reduced ? 0 : 0.3 });
      const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }
    getLenis()?.start();
    gsap.to(el, { clipPath: "inset(0 0 100% 0)", duration: reduced ? 0 : 0.7, ease: "expo.inOut", onComplete: () => void gsap.set(el, { visibility: "hidden" }) });
  }, [open]);

  const go = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const wasOpen = open;
    setOpen(false);
    window.setTimeout(() => scrollToId(id), wasOpen ? 350 : 0);
  };

  return (
    <>
      <header
        ref={root}
        className={`px-gutter fixed inset-x-0 top-0 z-[80] flex h-16 items-center justify-between gap-4 transition-[background-color,border-color,backdrop-filter] duration-500 ${
          solid && !open ? "border-b border-line bg-ink/80 backdrop-blur-md" : "border-b border-transparent"
        }`}
      >
        <a href="#top" onClick={go("top")} data-nav-item className="group flex items-center gap-2.5" aria-label="Арча Терраса — наверх">
          <span className="inline-block h-2 w-2 rotate-45 bg-brass transition-transform duration-700 [transition-timing-function:var(--ease-out)] group-hover:rotate-[225deg]" />
          <span className="label">Арча Терраса</span>
        </a>

        <nav aria-label="Разделы" className="hidden lg:block">
          <ul className="label flex gap-7">
            {ITEMS.map((item, i) => (
              <li key={item.id} data-nav-item>
                <a href={`#${item.id}`} onClick={go(item.id)} className="ulink pb-0.5">
                  <span className="text-paper-faint">0{i + 1}</span> {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-5">
          <span data-nav-item className="label hidden text-paper-dim xl:inline-flex xl:gap-4">
            <span>
              Бишкек <LocalTime />
            </span>
            <OpenStatus />
          </span>
          <a data-nav-item href="/my" className="label ulink hidden pb-0.5 text-paper-dim sm:inline">
            Моя бронь
          </a>
          <a data-nav-item href="#book" onClick={go("book")} className="btn btn-primary !min-h-10 !px-5">
            Забронировать
          </a>
          <button data-nav-item type="button" className="label lg:hidden" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen((v) => !v)}>
            {open ? "Закрыть" : "Меню"}
          </button>
        </div>
      </header>

      <div ref={menu} id="mobile-menu" className="px-gutter invisible fixed inset-0 z-[70] flex flex-col justify-end bg-ink-2 pb-10 lg:hidden" aria-hidden={!open}>
        <ul className="flex flex-col gap-1">
          {[...ITEMS, { id: "book", label: "Бронь" }].map((item, i) => (
            <li key={item.id} className="split-line">
              <a data-menu-link href={`#${item.id}`} onClick={go(item.id)} tabIndex={open ? 0 : -1} className="display flex items-baseline gap-3 text-[clamp(48px,13vw,96px)]">
                <span className="label text-paper-faint">0{i + 1}</span>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="label mt-10 flex flex-wrap justify-between gap-3 text-paper-dim">
          <a href="/my" className="ulink">Моя бронь</a>
          <OpenStatus />
        </div>
      </div>
    </>
  );
}
