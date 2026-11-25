"use client";

import { useEffect, useState } from "react";
import { cartCount, cartTotal, som, useCart } from "@/lib/preorder";
import { RESTAURANT } from "@/lib/rules";
import { scrollToId } from "../SmoothScroll";

const dishWord = (n: number) => (n % 10 === 1 && n % 100 !== 11 ? "блюдо" : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? "блюда" : "блюд");

/**
 * Нижняя панель: на телефоне — «Позвонить / Забронировать» (идея The Fat Duck: бронь и телефон всегда под рукой),
 * при выбранных блюдах — сумма предзаказа на любом экране. Прячется на первом экране и в блоке брони.
 */
export default function StickyBar() {
  const cart = useCart();
  const count = cartCount(cart);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("top");
    const book = document.getElementById("book");
    if (!hero || !book) return;
    const state = { pastHero: false, inBook: false };
    const update = () => setShow(state.pastHero && !state.inBook);
    const io1 = new IntersectionObserver(([e]) => {
      state.pastHero = !e.isIntersecting;
      update();
    });
    const io2 = new IntersectionObserver(
      ([e]) => {
        state.inBook = e.isIntersecting;
        update();
      },
      { rootMargin: "0px 0px -40% 0px" },
    );
    io1.observe(hero);
    io2.observe(book);
    return () => {
      io1.disconnect();
      io2.disconnect();
    };
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(12px,env(safe-area-inset-bottom))] transition-transform duration-500 [transition-timing-function:var(--ease-out)] ${
        show ? "translate-y-0" : "translate-y-[120%]"
      } ${count ? "" : "md:hidden"}`}
      aria-hidden={!show}
    >
      <div className="mx-auto flex max-w-xl items-center gap-2 rounded-full border border-line-strong bg-ink-2/90 p-1.5 shadow-2xl shadow-black/50 backdrop-blur-xl">
        {count ? (
          <>
            <div className="min-w-0 flex-1 px-4">
              <p className="label text-paper-faint">Предзаказ к брони</p>
              <p className="truncate text-[15px]">
                {count} {dishWord(count)} · <span className="text-brass-2">{som(cartTotal(cart))}</span>
              </p>
            </div>
            <button type="button" tabIndex={show ? 0 : -1} onClick={() => scrollToId("book")} className="btn btn-primary !min-h-12 !px-5">
              К брони →
            </button>
          </>
        ) : (
          <>
            <a href={`tel:${RESTAURANT.phone.replace(/\s/g, "")}`} tabIndex={show ? 0 : -1} className="btn btn-ghost !min-h-12 flex-1 !px-4">
              Позвонить
            </a>
            <button type="button" tabIndex={show ? 0 : -1} onClick={() => scrollToId("book")} className="btn btn-primary !min-h-12 flex-[1.4] !px-4">
              Забронировать
            </button>
          </>
        )}
      </div>
    </div>
  );
}
