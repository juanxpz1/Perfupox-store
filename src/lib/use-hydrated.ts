"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/** Verdadero solo en el navegador, después de hidratar. Evita desajustes con datos de localStorage. */
export function useHydrated() {
  return useSyncExternalStore(noop, () => true, () => false);
}
