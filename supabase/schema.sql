-- «Арча Терраса» — бронирование столиков. Скрипт можно запускать повторно.
-- Supabase → SQL Editor → вставить → Run.

create extension if not exists btree_gist;

-- Столики
create table if not exists archa_tables (
  id         serial primary key,
  number     int  not null unique,
  hall       text not null check (hall in ('main', 'terrace', 'vip')),
  seats      int  not null check (seats between 1 and 20),
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

-- Брони. Бронь всегда занимает столик на 2 часа: [starts_at, ends_at)
create table if not exists archa_bookings (
  id           bigserial primary key,
  code         text not null unique,
  table_id     int  not null references archa_tables(id),
  starts_at    timestamptz not null,
  ends_at      timestamptz not null,
  guests       int  not null check (guests between 1 and 10),
  name         text not null check (length(name) between 2 and 60),
  phone        text not null check (length(phone) between 9 and 20),
  comment      text check (comment is null or length(comment) <= 300),
  status       text not null default 'booked'
               check (status in ('booked', 'came', 'no_show', 'cancelled')),
  cancelled_by text check (cancelled_by in ('guest', 'admin')),
  created_at   timestamptz not null default now(),
  check (ends_at = starts_at + interval '2 hours'),
  -- СЛОЖНОЕ МЕСТО: один столик нельзя занять дважды на пересекающееся время.
  -- Проверяет сама база, поэтому даже два одновременных клика не создадут двойную бронь.
  -- Отменённые брони столик не блокируют.
  constraint archa_no_overlap exclude using gist (
    table_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status <> 'cancelled')
);

create index if not exists archa_bookings_starts_idx on archa_bookings (starts_at);

-- Вторая линия защиты: гостей не больше, чем мест, столик включён.
create or replace function archa_check_booking() returns trigger
language plpgsql as $$
declare t archa_tables;
begin
  select * into t from archa_tables where id = new.table_id;
  if not found or not t.active then
    raise exception 'TABLE_INACTIVE' using errcode = 'P0001';
  end if;
  if new.guests > t.seats then
    raise exception 'TOO_MANY_GUESTS' using errcode = 'P0001';
  end if;
  return new;
end $$;

drop trigger if exists archa_check_booking_trg on archa_bookings;
create trigger archa_check_booking_trg
  before insert on archa_bookings
  for each row execute function archa_check_booking();

-- Доступ только с сервера (secret key). Из браузера напрямую таблицы не читаются.
alter table archa_tables   enable row level security;
alter table archa_bookings enable row level security;

-- 12 столиков
insert into archa_tables (number, hall, seats) values
  (1, 'main', 2), (2, 'main', 2), (3, 'main', 4), (4, 'main', 4), (5, 'main', 4), (6, 'main', 6),
  (7, 'terrace', 2), (8, 'terrace', 2), (9, 'terrace', 4), (10, 'terrace', 4),
  (11, 'vip', 8), (12, 'vip', 10)
on conflict (number) do nothing;

-- Демо-брони на сегодня (по Бишкеку), только если броней ещё нет
do $$
declare d date := (now() at time zone 'Asia/Bishkek')::date;
begin
  if not exists (select 1 from archa_bookings) then
    insert into archa_bookings (code, table_id, starts_at, ends_at, guests, name, phone, comment)
    select v.code, t.id,
           (d + v.t) at time zone 'Asia/Bishkek',
           (d + v.t + interval '2 hours') at time zone 'Asia/Bishkek',
           v.g, v.n, v.p, v.c
    from (values
      ('AR-1001', 3,  time '19:00', 4, 'Айгерим Токтогулова', '+996 555 12 34 56', 'День рождения, нужен торт'),
      ('AR-1002', 1,  time '18:30', 2, 'Нурлан Асанов',       '+996 700 98 76 54', null),
      ('AR-1003', 6,  time '20:00', 6, 'Мээрим Садыкова',     '+996 777 45 67 89', 'Детский стульчик'),
      ('AR-1004', 9,  time '19:30', 3, 'Данияр Жумабеков',    '+996 550 11 22 33', null),
      ('AR-1005', 11, time '19:00', 8, 'ОсОО «Тянь-Шань Логистик»', '+996 312 66 77 88', 'Корпоратив'),
      ('AR-1006', 7,  time '13:00', 2, 'Алина Ким',           '+996 705 33 44 55', 'Терраса, у перил')
    ) as v(code, num, t, g, n, p, c)
    join archa_tables t on t.number = v.num;
  end if;
end $$;
