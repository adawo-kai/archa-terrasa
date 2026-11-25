"use client";

import { useSyncExternalStore } from "react";
import { dishById } from "./content";

/** Предзаказ к брони: какие блюда и сколько. Общий для меню и формы брони; черновик хранится в браузере. */
export type Cart = Record<string, number>;
const KEY = "archa:preorder";
const EMPTY: Cart = {};
let cart: Cart = EMPTY;
let loaded = false;
const subs = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) cart = JSON.parse(raw) as Cart;
  } catch {}
}

function save(next: Cart) {
  cart = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  subs.forEach((f) => f());
}

export const preorder = {
  set(id: string, qty: number) {
    load();
    const next = { ...cart };
    if (qty <= 0) delete next[id];
    else next[id] = Math.min(qty, 20);
    save(next);
  },
  add(id: string, delta = 1) {
    load();
    preorder.set(id, (cart[id] ?? 0) + delta);
  },
  clear() {
    save({});
  },
};

export function useCart() {
  return useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    () => {
      load();
      return cart;
    },
    () => EMPTY,
  );
}

export function cartLines(c: Cart) {
  return Object.entries(c)
    .map(([id, qty]) => {
      const d = dishById(id);
      return d ? { id, qty, name: d.name, price: d.price, sum: d.price * qty } : null;
    })
    .filter((x): x is NonNullable<typeof x> => !!x);
}

export const cartTotal = (c: Cart) => cartLines(c).reduce((s, l) => s + l.sum, 0);
export const cartCount = (c: Cart) => Object.values(c).reduce((s, q) => s + q, 0);
export const som = (n: number) => n.toLocaleString("ru-RU").replace(/ /g, " ") + " сом";
