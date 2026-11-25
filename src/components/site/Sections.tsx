import Image from "next/image";
import { FAQ, HALL_DETAILS, photo } from "@/lib/content";
import { HALLS, RESTAURANT, type Hall } from "@/lib/rules";

export function SectionHead({ index, label, aside }: { index: string; label: string; aside?: string }) {
  return (
    <div className="px-gutter">
      <div className="label flex items-end justify-between pb-3 text-paper-dim">
        <span data-reveal="fade">
          <span className="text-brass">({index})</span> — {label}
        </span>
        {aside ? (
          <span data-reveal="fade" className="hidden text-right md:block">
            {aside}
          </span>
        ) : null}
      </div>
      <div data-reveal="rule" className="h-px w-full bg-line" />
    </div>
  );
}

const DISHES_STRIP = ["dish-shashlik", "dish-beshbarmak", "dish-manty", "dish-steak", "dish-lagman", "dish-boorsok"];
const WORDS = ["угли арчи", "бешбармак", "терраса", "ягнёнок", "манты", "чай с чабрецом"];

export function Marquee() {
  const row = WORDS.map((w, i) => ({ w, p: DISHES_STRIP[i] }));
  return (
    <div className="fade-x overflow-hidden border-y border-line py-6" aria-hidden>
      <div data-marquee className="flex w-max items-center gap-8 whitespace-nowrap">
        {[...row, ...row].map(({ w, p }, i) => (
          <span key={i} className="flex items-center gap-8">
            <span className="display text-[clamp(36px,4.4vw,64px)] italic text-paper/85">{w}</span>
            <span className="photo relative block h-12 w-20 overflow-hidden rounded-full md:h-16 md:w-28">
              <Image src={photo(p)} alt="" fill sizes="112px" className="object-cover" />
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="relative pt-[14vh] pb-[12vh]">
      <SectionHead index="01" label="О нас" aside="Кухня огня — с 2019 года" />
      <div className="px-gutter mt-12 grid grid-cols-12 gap-x-4 gap-y-12 md:mt-20">
        <div className="col-span-12 md:col-span-7">
          <h2 id="about-title" data-reveal="lines" className="display text-[clamp(40px,5.6vw,92px)] leading-[0.98]">
            Огонь из веток горной арчи даёт мясу <span className="italic-accent">лёгкий смолистый дым</span> — так готовили на джайлоо.
          </h2>
          <div className="mt-12 grid max-w-2xl gap-8 text-[16px] leading-[1.6] text-paper-dim sm:grid-cols-2">
            <p data-reveal="fade">
              Шеф Азамат Токтосунов семь лет работал в ресторанах Алматы и Стамбула и вернулся в Бишкек, чтобы готовить кухню своего детства — честно, на живом огне.
            </p>
            <p data-reveal="fade" data-delay="0.1">
              Мясо — от фермеров Кочкора и Ат-Башы, лапшу для бешбармака и лагмана тянем вручную каждое утро. Хлеб и боорсоки — из нашей печи.
            </p>
          </div>
          <dl className="mt-14 grid grid-cols-3 border-t border-line">
            {[
              ["12", "столиков в трёх залах"],
              ["1 400", "сом — средний чек"],
              ["2 ч", "столик за вами"],
            ].map(([n, l]) => (
              <div key={l} data-reveal="fade" className="border-r border-line pt-5 pr-4 last:border-r-0 [&:not(:first-child)]:pl-4">
                <dt className="display tabular text-[clamp(36px,4.4vw,68px)]">{n}</dt>
                <dd className="label mt-2 text-paper-faint">{l}</dd>
              </div>
            ))}
          </dl>
        </div>
        <figure className="col-span-12 md:col-span-4 md:col-start-9">
          <div data-reveal="clip" className="photo relative aspect-[4/5] w-full">
            <div data-parallax="-10" className="absolute -inset-y-[8%] inset-x-0">
              <Image src={photo("chef")} alt="Шеф готовит на открытом огне" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
            </div>
          </div>
          <figcaption className="label mt-3 flex justify-between text-paper-faint">
            <span>Открытая кухня</span>
            <span>Фото: гриль на арче</span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

export function Halls() {
  return (
    <section id="halls" aria-labelledby="halls-title" className="relative pt-[12vh] pb-[14vh]">
      <SectionHead index="03" label="Залы" aside="Выберите столик на плане зала" />
      <div className="px-gutter mt-12 grid grid-cols-12 items-end gap-x-4 gap-y-6 md:mt-16">
        <h2 id="halls-title" data-reveal="lines" className="display col-span-12 text-[clamp(44px,6.4vw,110px)] md:col-span-8">
          Три зала — <span className="italic-accent">три настроения</span>
        </h2>
      </div>
      <ol className="px-gutter mt-14 grid gap-x-4 gap-y-14 md:grid-cols-12">
        {(Object.keys(HALLS) as Hall[]).map((h, i) => {
          const d = HALL_DETAILS[h];
          const span = i === 0 ? "md:col-span-7" : i === 1 ? "md:col-span-5 md:mt-[18vh]" : "md:col-span-6 md:col-start-4";
          return (
            <li key={h} className={`group ${span}`}>
              <a href="#book" className="block">
                <div data-reveal="clip" className={`photo relative w-full ${i === 1 ? "aspect-[4/5]" : "aspect-[16/11]"}`}>
                  <Image
                    src={photo(d.photo)}
                    alt={HALLS[h].title}
                    fill
                    sizes="(max-width: 768px) 100vw, 60vw"
                    className="object-cover transition-transform duration-[1.6s] [transition-timing-function:var(--ease-out)] group-hover:scale-[1.04]"
                  />
                </div>
                <div className="label mt-4 flex justify-between border-t border-line pt-3 text-paper-dim">
                  <span className="transition-colors group-hover:text-brass">0{i + 1}</span>
                  <span>{d.capacity}</span>
                </div>
                <h3 className="display mt-4 text-[clamp(36px,3.6vw,60px)]">{HALLS[h].title}</h3>
                <p className="mt-3 max-w-md text-paper-dim">{d.text}</p>
              </a>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function Info() {
  return (
    <section id="info" aria-labelledby="info-title" className="relative pt-[12vh] pb-[10vh]">
      <SectionHead index="05" label="Гостям" aside="Ответы на частые вопросы" />
      <div className="px-gutter mt-12 grid grid-cols-12 gap-x-4 gap-y-14 md:mt-16">
        <div className="col-span-12 md:col-span-5">
          <h2 id="info-title" data-reveal="lines" className="display text-[clamp(40px,4.8vw,80px)]">
            Как нас <span className="italic-accent">найти</span>
          </h2>
          <dl className="mt-10 border-t border-line">
            {[
              ["Адрес", `${RESTAURANT.city}, ${RESTAURANT.address}`, "https://2gis.kg/bishkek/search/Токтогула%20112"],
              ["Часы", "Ежедневно 11:00 – 23:00, кухня до 22:30", null],
              ["Телефон", RESTAURANT.phone, `tel:${RESTAURANT.phone.replace(/\s/g, "")}`],
              ["WhatsApp", "Написать администратору", `https://wa.me/${RESTAURANT.whatsapp}`],
              ["Парковка", "Во дворе, 14 мест, бесплатно", null],
            ].map(([k, v, href]) => (
              <div key={k} data-reveal="fade" className="grid grid-cols-3 gap-4 border-b border-line py-4">
                <dt className="label pt-1 text-paper-faint">{k}</dt>
                <dd className="col-span-2">
                  {href ? (
                    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="ulink">
                      {v} {href.startsWith("http") ? "↗" : ""}
                    </a>
                  ) : (
                    v
                  )}
                </dd>
              </div>
            ))}
          </dl>
          <div data-reveal="fade" className="mt-8">
            <div className="relative aspect-[4/3] overflow-hidden border border-line bg-ink-3">
              <iframe
                title="Карта: Арча Терраса на Токтогула"
                src="https://www.openstreetmap.org/export/embed.html?bbox=74.5935%2C42.8695%2C74.6135%2C42.8795&layer=mapnik&marker=42.8745%2C74.6035"
                loading="lazy"
                className="absolute inset-0 h-full w-full [filter:grayscale(1)_invert(0.9)_contrast(0.85)_brightness(0.9)]"
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              <a className="btn btn-ghost !min-h-10 !px-4" href="https://2gis.kg/bishkek/search/%D0%A2%D0%BE%D0%BA%D1%82%D0%BE%D0%B3%D1%83%D0%BB%D0%B0%20112" target="_blank" rel="noreferrer">Маршрут в 2ГИС ↗</a>
              <a className="btn btn-ghost !min-h-10 !px-4" href="https://www.google.com/maps/dir/?api=1&destination=42.8745,74.6035" target="_blank" rel="noreferrer">Google Maps ↗</a>
            </div>
          </div>
        </div>
        <div className="col-span-12 md:col-span-6 md:col-start-7">
          <p data-reveal="fade" className="label text-paper-faint">Частые вопросы</p>
          <div className="mt-4 border-t border-line">
            {FAQ.map((f, i) => (
              <details key={f.q} data-reveal="fade" className="group border-b border-line" open={i === 0}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[clamp(18px,1.6vw,22px)] [&::-webkit-details-marker]:hidden">
                  <span className="flex gap-4">
                    <span className="label pt-1.5 text-brass">0{i + 1}</span>
                    {f.q}
                  </span>
                  <span aria-hidden className="text-2xl font-light text-paper-faint transition-transform duration-500 group-open:rotate-45">+</span>
                </summary>
                <p className="max-w-xl pb-6 pl-9 leading-relaxed text-paper-dim">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-line pt-14">
      <div className="px-gutter grid grid-cols-12 gap-x-4 gap-y-8">
        <p className="label col-span-12 text-paper-dim md:col-span-4">
          {RESTAURANT.city}, {RESTAURANT.address}
          <br />
          <span className="text-paper-faint">{RESTAURANT.hours}</span>
        </p>
        <nav className="label col-span-6 flex flex-col gap-2 md:col-span-4" aria-label="Ссылки">
          <a href="#menu" className="ulink w-fit">Меню</a>
          <a href="#book" className="ulink w-fit">Бронь</a>
          <a href="/my" className="ulink w-fit">Моя бронь</a>
        </nav>
        <div className="label col-span-6 flex flex-col items-end gap-2 md:col-span-4">
          <a href={`tel:${RESTAURANT.phone.replace(/\s/g, "")}`} className="ulink">{RESTAURANT.phone}</a>
          <a href={`https://wa.me/${RESTAURANT.whatsapp}`} target="_blank" rel="noreferrer" className="ulink">WhatsApp ↗</a>
          <a href="/admin" className="text-paper-faint hover:text-paper">Вход для персонала</a>
        </div>
      </div>
      <div aria-hidden className="display px-gutter mt-12 translate-y-[18%] text-center text-[25vw] leading-[0.8] text-paper/[0.06] italic select-none">
        Арча
      </div>
    </footer>
  );
}
