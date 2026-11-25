"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, prefersReducedMotion, useIsoLayoutEffect } from "@/lib/gsap";
import { introDone } from "@/lib/intro";
import { photo } from "@/lib/content";
import { RESTAURANT } from "@/lib/rules";
import { scrollToId } from "../SmoothScroll";
import Embers from "./Embers";
import dynamic from "next/dynamic";

// зависит от текущей даты в Бишкеке — рисуем только в браузере
const QuickBook = dynamic(() => import("./QuickBook"), {
  ssr: false,
  loading: () => <div className="h-[150px] w-full rounded-[28px] border border-line-strong sm:h-[70px] sm:w-[560px] sm:rounded-full" />,
});

function Letters({ text }: { text: string }) {
  return (
    <>
      {text.split("").map((c, i) => (
        <span key={i} data-letter className="inline-block will-change-transform">
          {c}
        </span>
      ))}
    </>
  );
}

export default function Hero() {
  const root = useRef<HTMLElement>(null);

  useIsoLayoutEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    let cancelled = false;
    const ctx = gsap.context(() => {
      gsap.set("[data-letter]", { yPercent: 110 });
      gsap.set("[data-fade]", { autoAlpha: 0, y: 16 });
      gsap.set("[data-intro]", { autoAlpha: 0 });
      gsap.set("[data-photo]", { scale: 1.18, autoAlpha: 0 });
      introDone.then(() => {
        if (cancelled) return;
        ctx.add(() => {
          gsap
            .timeline()
            .to("[data-photo]", { scale: 1, autoAlpha: 1, duration: 2.4, ease: "expo.out" }, 0)
            .to("[data-letter]", { yPercent: 0, duration: 1.5, ease: "expo.out", stagger: 0.05 }, 0.15)
            .fromTo("[data-intro]", { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 1.3 }, 0.5)
            .to("[data-fade]", { autoAlpha: 1, y: 0, duration: 1, stagger: 0.06 }, 0.7);
        });
      });
      gsap.to("[data-photo-wrap]", { yPercent: 18, ease: "none", scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: true } });
      gsap.to("[data-name]", { yPercent: 30, autoAlpha: 0.2, ease: "none", scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: true } });
    }, el);
    return () => {
      cancelled = true;
      ctx.revert();
    };
  }, []);

  return (
    <section ref={root} id="top" aria-labelledby="hero-title" className="relative flex min-h-[680px] flex-col overflow-hidden [height:100svh]">
      <div data-photo-wrap className="absolute inset-0">
        <div data-photo className="absolute inset-0">
          <Image src={photo("hero")} alt="Огонь в печи ресторана Арча Терраса" fill priority sizes="100vw" className="object-cover" />
        </div>
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,10,8,0.78)_0%,rgba(12,10,8,0.25)_35%,rgba(12,10,8,0.55)_70%,#0c0a08_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(90%_70%_at_20%_80%,rgba(12,10,8,0.7),transparent_70%)]" />
      <Embers />

      <div className="px-gutter relative grid grid-cols-12 gap-x-4 pt-[14svh]">
        <p data-fade className="label col-span-12 text-paper-dim md:col-span-3">
          Ресторан кухни огня
          <br />
          <span className="text-paper-faint">кыргызская и европейская</span>
        </p>
        <p data-fade className="label col-span-6 hidden text-right text-paper-dim md:col-span-3 md:col-start-10 md:block">
          {RESTAURANT.city}, {RESTAURANT.address}
          <br />
          <span className="text-paper-faint">{RESTAURANT.hours}</span>
        </p>
      </div>

      <div className="px-gutter relative mt-auto">
        <h1 id="hero-title" className="sr-only">Арча Терраса — ресторан в Бишкеке, бронирование столиков</h1>
        <div data-name aria-hidden className="display flex flex-wrap items-end justify-between gap-x-8 text-[clamp(76px,15.5vw,250px)] select-none">
          <span className="split-line block italic">
            <Letters text="Арча" />
          </span>
          <span className="split-line block">
            <Letters text="Терраса" />
          </span>
        </div>
      </div>

      <div className="px-gutter relative grid grid-cols-12 items-end gap-x-4 gap-y-6 pt-6 pb-7">
        <p className="col-span-12 max-w-[32rem] text-[17px] leading-[1.5] text-paper/90 md:col-span-5">
          <span data-intro className="block">
            Готовим на углях горной арчи — бешбармак, ягнёнок, стейки. Три зала и терраса с видом на{" "}
            <span className="italic-accent text-[1.15em]">Ала-Тоо.</span>
          </span>
        </p>
        <div data-fade className="col-span-12 md:col-span-7 md:justify-self-end">
          <QuickBook />
        </div>
        <a
          data-fade
          href="#about"
          onClick={(e) => {
            e.preventDefault();
            scrollToId("about");
          }}
         
          className="label col-span-12 hidden items-center gap-3 text-paper-dim md:flex"
        >
          <span className="relative block h-10 w-px overflow-hidden bg-line">
            <span className="absolute inset-x-0 top-0 h-1/2 animate-[scrollcue_2.2s_cubic-bezier(0.76,0,0.24,1)_infinite] bg-paper" />
          </span>
          Листайте
        </a>
      </div>
    </section>
  );
}
