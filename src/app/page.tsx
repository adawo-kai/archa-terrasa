import BookingClient from "@/components/BookingClient";
import Reveals from "@/components/Reveals";
import SmoothScroll from "@/components/SmoothScroll";
import Hero from "@/components/site/Hero";
import Loader from "@/components/site/Loader";
import Menu from "@/components/site/Menu";
import Nav from "@/components/site/Nav";
import StickyBar from "@/components/site/StickyBar";
import { About, Footer, Halls, Info, Marquee, SectionHead } from "@/components/site/Sections";

export default function Home() {
  return (
    <>
      <SmoothScroll />
      <Loader />
      <Nav />
      <main id="main">
        <Hero />
        <Marquee />
        <About />
        <Menu />
        <Halls />

        <section id="book" aria-labelledby="book-title" className="relative scroll-mt-16 border-t border-line bg-ink-2/40 pt-[12vh] pb-[14vh]">
          <SectionHead index="04" label="Бронь столика" aside="Онлайн · бесплатно · за минуту" />
          <div className="px-gutter mt-12 grid grid-cols-12 items-end gap-x-4 gap-y-6 md:mt-16">
            <h2 id="book-title" data-reveal="lines" className="display col-span-12 text-[clamp(44px,6.4vw,110px)] md:col-span-8">
              Выберите <span className="italic-accent">свой столик</span> на плане зала
            </h2>
            <p data-reveal="fade" className="col-span-12 max-w-sm text-paper-dim md:col-span-4 md:justify-self-end md:text-right">
              Видно только то, что свободно на ваше время и подходит по размеру компании. Двойной брони не бывает.
            </p>
          </div>
          <div className="px-gutter mt-14 md:mt-20">
            <BookingClient />
          </div>
        </section>

        <Info />
      </main>
      <Footer />
      <StickyBar />
      <Reveals />
      <div className="grain" aria-hidden="true" />
    </>
  );
}
