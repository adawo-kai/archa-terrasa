import { DURATION_MIN, RESTAURANT, toInstant } from "./rules";

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** Ссылки «Добавить в календарь»: Google Calendar и файл .ics (Apple/Outlook/телефон). */
export function calendarLinks(o: { code: string; date: string; time: string; guests: number; table: number }) {
  const start = toInstant(o.date, o.time);
  const end = new Date(start.getTime() + DURATION_MIN * 60_000);
  const title = `Ужин в ${RESTAURANT.name}`;
  const details = `Бронь ${o.code}: столик №${o.table}, гостей ${o.guests}. Изменить или отменить: https://archa-terrasa.vercel.app/my?code=${o.code}`;
  const location = `${RESTAURANT.name}, ${RESTAURANT.city}, ${RESTAURANT.address}`;
  const google =
    "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    `&text=${encodeURIComponent(title)}&dates=${stamp(start)}/${stamp(end)}` +
    `&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Archa Terrasa//Booking//RU",
    "BEGIN:VEVENT",
    `UID:${o.code}@archa-terrasa`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${details}`,
    `LOCATION:${location.replace(/,/g, "\\,")}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${title}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return { google, icsHref: "data:text/calendar;charset=utf-8," + encodeURIComponent(ics) };
}
