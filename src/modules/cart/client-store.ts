"use client";

import { useSyncExternalStore } from "react";

/**
 * Bolsa y favoritos del visitante, guardados en este navegador.
 * Solo se guardan identificadores y cantidades: los precios siempre se consultan al servidor.
 * La compra se cierra por WhatsApp: la bolsa arma el mensaje del pedido.
 */
export type BagLine = { variantId: string; qty: number };
type State = { bag: BagLine[]; favorites: string[]; lastAdded: { variantId: string; at: number } | null };

const KEY = "pfx.v1";
const MAX_QTY = 10;
const MAX_LINES = 30;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const empty: State = { bag: [], favorites: [], lastAdded: null };
let state: State = empty;
let loaded = false;
const listeners = new Set<() => void>();

function sanitize(raw: unknown): State {
  if (!raw || typeof raw !== "object") return empty;
  const r = raw as Partial<State>;
  const bag = Array.isArray(r.bag)
    ? r.bag
        .filter((l): l is BagLine => !!l && typeof l.variantId === "string" && UUID.test(l.variantId) && Number.isInteger(l.qty))
        .map((l) => ({ variantId: l.variantId, qty: Math.min(Math.max(l.qty, 1), MAX_QTY) }))
        .slice(0, MAX_LINES)
    : [];
  const favorites = Array.isArray(r.favorites)
    ? [...new Set(r.favorites.filter((f): f is string => typeof f === "string" && SLUG.test(f) && f.length <= 90))].slice(0, 60)
    : [];
  return { bag, favorites, lastAdded: null };
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    state = sanitize(JSON.parse(window.localStorage.getItem(KEY) ?? "null"));
  } catch {
    state = empty;
  }
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return;
    try {
      state = sanitize(JSON.parse(e.newValue ?? "null"));
    } catch {
      state = empty;
    }
    emit();
  });
}

function emit() {
  for (const l of listeners) l();
}

function set(next: State) {
  state = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ bag: next.bag, favorites: next.favorites }));
  } catch {
    // Navegación privada o almacenamiento bloqueado: la bolsa funciona solo en esta pestaña.
  }
  emit();
}

function subscribe(cb: () => void) {
  load();
  listeners.add(cb);
  return () => listeners.delete(cb);
}

const getSnapshot = () => {
  load();
  return state;
};
const getServerSnapshot = () => empty;

export function useShop() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export const shop = {
  add(variantId: string, qty = 1) {
    load();
    const bag = [...state.bag];
    const i = bag.findIndex((l) => l.variantId === variantId);
    if (i >= 0) bag[i] = { variantId, qty: Math.min(bag[i].qty + qty, MAX_QTY) };
    else if (bag.length < MAX_LINES) bag.push({ variantId, qty: Math.min(qty, MAX_QTY) });
    set({ ...state, bag, lastAdded: { variantId, at: Date.now() } });
  },
  setQty(variantId: string, qty: number) {
    load();
    const bag = qty <= 0 ? state.bag.filter((l) => l.variantId !== variantId) : state.bag.map((l) => (l.variantId === variantId ? { variantId, qty: Math.min(qty, MAX_QTY) } : l));
    set({ ...state, bag });
  },
  remove(variantId: string) {
    shop.setQty(variantId, 0);
  },
  clearBag() {
    set({ ...state, bag: [] });
  },
  toggleFavorite(slug: string): boolean {
    load();
    const has = state.favorites.includes(slug);
    set({ ...state, favorites: has ? state.favorites.filter((f) => f !== slug) : [slug, ...state.favorites].slice(0, 60) });
    return !has;
  },
  dismissAdded() {
    set({ ...state, lastAdded: null });
  },
};
