-- Вторая итерация: предзаказ блюд, повод визита, лист ожидания. Можно запускать повторно.

alter table archa_bookings add column if not exists occasion text
  check (occasion is null or occasion in ('birthday', 'date', 'business', 'family'));
-- предзаказ: [{ "id": "dish-manty", "name": "Манты с тыквой", "qty": 2, "price": 420 }]
alter table archa_bookings add column if not exists preorder jsonb;
alter table archa_bookings add column if not exists preorder_total int not null default 0;

-- Лист ожидания: столиков нет — гость оставляет телефон, администратор перезванивает, если место освободилось
create table if not exists archa_waitlist (
  id         bigserial primary key,
  date       date not null,
  time       text not null check (time ~ '^\d{2}:\d{2}$'),
  guests     int  not null check (guests between 1 and 10),
  name       text not null check (length(name) between 2 and 60),
  phone      text not null check (length(phone) between 9 and 20),
  status     text not null default 'waiting' check (status in ('waiting', 'contacted', 'booked', 'closed')),
  created_at timestamptz not null default now(),
  unique (date, time, phone)
);
create index if not exists archa_waitlist_date_idx on archa_waitlist (date);
alter table archa_waitlist enable row level security;
