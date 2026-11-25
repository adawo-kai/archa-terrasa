"use client";

import { useRef, useState } from "react";
import { gsap, prefersReducedMotion, useIsoLayoutEffect } from "@/lib/gsap";
import { finishIntro } from "@/lib/intro";
import { getLenis } from "../SmoothScroll";

const COLS = 5;
const SEEN = "archa:intro";

/** Шторка при первом входе: слово, счётчик, шторки уезжают вверх. Повторно за сессию — быстрый фейд. */
export default function Loader() {
  const root = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);

  useIsoLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    if (!location.hash) window.scrollTo(0, 0);
    document.documentElement.style.overflow = "hidden";
    const raf = requestAnimationFrame(() => getLenis()?.stop());
    let cancelled = false;
    const release = () => {
      document.documentElement.style.overflow = "";
      getLenis()?.start();
    };
    const done = () => {
      release();
      setGone(true);
      try {
        sessionStorage.setItem(SEEN, "1");
      } catch {}
    };
    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN) === "1";
    } catch {}

    const counter = el.querySelector<HTMLElement>("[data-count]");
    const bar = el.querySelector<HTMLElement>("[data-bar]");
    const state = { v: 0 };

    const ctx = gsap.context(() => {
      if (seen || prefersReducedMotion()) {
        gsap.set("[data-content]", { autoAlpha: 0 });
        document.fonts.ready.then(() => {
          if (cancelled) return;
          finishIntro();
          gsap.to(el, { autoAlpha: 0, duration: 0.45, ease: "power2.out", onComplete: done });
        });
        return;
      }
      gsap.from("[data-word] > span", { yPercent: 110, duration: 1.3, stagger: 0.05, delay: 0.1 });
      gsap.from("[data-meta]", { autoAlpha: 0, y: 10, duration: 0.9, stagger: 0.08, delay: 0.35 });
      const count = gsap.to(state, {
        v: 100,
        duration: 1.8,
        ease: "power3.inOut",
        onUpdate: () => {
          if (counter) counter.textContent = String(Math.round(state.v)).padStart(3, "0");
          if (bar) bar.style.transform = `scaleX(${state.v / 100})`;
        },
      });
      Promise.all([count.then(), document.fonts.ready]).then(() => {
        if (cancelled) return;
        gsap
          .timeline({ onComplete: done })
          .to("[data-content]", { yPercent: -10, autoAlpha: 0, duration: 0.7, ease: "power3.in" })
          .add(() => finishIntro(), "-=0.1")
          .to("[data-col]", { yPercent: -100, duration: 1.05, ease: "expo.inOut", stagger: 0.06 }, "-=0.35");
      });
    }, el);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      ctx.revert();
      release();
    };
  }, []);

  if (gone) return null;

  return (
    <div ref={root} className="fixed inset-0 z-[100]" aria-hidden="true">
      <div className="absolute inset-0 flex">
        {Array.from({ length: COLS }).map((_, i) => (
          <div key={i} data-col className="h-full flex-1 bg-ink-2 [margin-right:-1px]" />
        ))}
      </div>
      <div data-content className="px-gutter absolute inset-0 flex flex-col justify-between py-6">
        <div className="label flex justify-between text-paper-dim">
          <span data-meta>Бишкек — с 2019</span>
          <span data-meta>Кухня на огне арчи</span>
        </div>
        <div>
          <p data-word className="display split-line text-[clamp(80px,17vw,260px)] italic">
            {"Арча".split("").map((c, i) => (
              <span key={i} className="inline-block">{c}</span>
            ))}
          </p>
          <p data-meta className="label mt-3 text-paper-dim">
            арча — <span className="text-brass">горный можжевельник, на котором мы готовим</span>
          </p>
        </div>
        <div>
          <div className="flex items-end justify-between">
            <span data-meta className="label text-paper-dim">Разжигаем огонь</span>
            <span data-count className="display tabular text-[clamp(56px,9vw,140px)]">000</span>
          </div>
          <div className="mt-4 h-px w-full bg-line">
            <div data-bar className="h-full w-full origin-left scale-x-0 bg-paper" />
          </div>
        </div>
      </div>
    </div>
  );
}
