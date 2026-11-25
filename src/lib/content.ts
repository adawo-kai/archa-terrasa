import type { Hall } from "./rules";

export type Diet = "veg" | "spicy" | "kids";
export type Dish = { name: string; note: string; price: number; photo: string; tag?: string; diet?: Diet[]; weight: string };
export const DIET_LABEL: Record<Diet, string> = { veg: "Без мяса", spicy: "Острое", kids: "Детям" };
export const MENU: { title: string; items: Dish[] }[] = [
  {
    title: "С огня",
    items: [
      { name: "Шашлык из каре ягнёнка", note: "угли арчи, маринованный лук, лаваш", price: 780, photo: "dish-shashlik", weight: "320 г", diet: ["spicy"], tag: "Фирменное" },
      { name: "Стейк рибай", note: "300 г, соус из ягод арчи и чёрного перца", price: 1450, photo: "dish-steak", weight: "300 г" },
      { name: "Куурдак из ягнёнка", note: "в чугунной сковороде, с овощами и зеленью", price: 590, photo: "dish-kuurdak", weight: "350 г" },
    ],
  },
  {
    title: "Горячее",
    items: [
      { name: "Бешбармак с кониной", note: "домашняя лапша, бульон-сорпо, лук", price: 690, photo: "dish-beshbarmak", weight: "450 г", tag: "Выбор гостей" },
      { name: "Гуйру-лагман", note: "тянутая лапша, говядина, овощи на воке", price: 450, photo: "dish-lagman", weight: "400 г", diet: ["spicy"] },
      { name: "Манты с тыквой", note: "на пару, сметана, чесночное масло", price: 420, photo: "dish-manty", weight: "5 шт", diet: ["veg", "kids"] },
    ],
  },
  {
    title: "Закуски и чай",
    items: [
      { name: "Буррата с томатами", note: "черри с огорода в Аламедине, базилик, оливковое масло", price: 380, photo: "dish-salad", weight: "220 г", diet: ["veg"] },
      { name: "Боорсоки с каймаком", note: "горячие, с горным мёдом", price: 290, photo: "dish-boorsok", weight: "200 г", diet: ["veg", "kids"] },
      { name: "Чай с чабрецом", note: "чайник 0,8 л, сухофрукты и орехи", price: 220, photo: "dish-tea", weight: "0,8 л", diet: ["veg", "kids"] },
    ],
  },
];

export const HALL_DETAILS: Record<Hall, { photo: string; text: string; capacity: string }> = {
  main: {
    photo: "hall-main",
    text: "Камин, дубовые столы и открытая кухня. Для ужина вдвоём и семейных вечеров.",
    capacity: "6 столиков · 2–6 гостей",
  },
  terrace: {
    photo: "hall-terrace",
    text: "Вид на хребет Ала-Тоо, пледы и инфракрасные обогреватели — открыта круглый год.",
    capacity: "4 столика · 2–4 гостя",
  },
  vip: {
    photo: "hall-vip",
    text: "Закрытая комната с отдельным официантом. Дни рождения, переговоры, корпоративы.",
    capacity: "2 стола · 8 и 10 гостей",
  },
};

export const FAQ = [
  { q: "Нужен ли депозит?", a: "Нет. Бронь бесплатная, для основного зала и террасы депозит не нужен. Для VIP-комнаты на праздник администратор уточнит детали по телефону." },
  { q: "Что если мы опаздываем?", a: "Держим столик 15 минут после начала брони. Если задерживаетесь сильнее — позвоните или напишите в WhatsApp, постараемся сохранить." },
  { q: "Как отменить или перенести бронь?", a: "На странице «Моя бронь» по коду и телефону — отмена за пару секунд, столик сразу освобождается. Для переноса отмените и забронируйте новое время." },
  { q: "Можно с детьми?", a: "Да. Есть детские стульчики и детское меню — отметьте в пожелании при бронировании." },
  { q: "Есть ли парковка?", a: "Бесплатная парковка во дворе на 14 мест, вход с ул. Токтогула." },
];

export const photo = (name: string) => `/photos/${name}.jpg`;

export const ALL_DISHES = MENU.flatMap((c) => c.items.map((d) => ({ ...d, id: d.photo, category: c.title })));
export const dishById = (id: string) => ALL_DISHES.find((d) => d.id === id);
