"use client";

import { useEffect, useState } from "react";

/** Avisos breves y no intrusivos. Uno a la vez, anunciados a lectores de pantalla. */
const listeners = new Set<(m: string) => void>();
export function toast(message: string) {
  for (const l of listeners) l(message);
}

export function Toaster() {
  const [msg, setMsg] = useState<string | null>(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    const l = (m: string) => {
      setMsg(m);
      setN((x) => x + 1);
    };
    listeners.add(l);
    return () => void listeners.delete(l);
  }, []);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 2600);
    return () => clearTimeout(t);
  }, [msg, n]);
  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-none fixed left-1/2 top-[calc(16px+env(safe-area-inset-top,0px))] z-[120] max-w-[calc(100%-32px)] -translate-x-1/2 bg-ink px-5 py-3 text-sm text-ivory shadow-lg transition-all duration-500 ${
        msg ? "translate-y-0 opacity-100" : "-translate-y-[160%] opacity-0"
      }`}
    >
      {msg}
    </div>
  );
}
