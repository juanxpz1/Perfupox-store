"use client";

import { useEffect, useState } from "react";

export function AnnouncementBar({ messages }: { messages: string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (messages.length < 2 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((x) => (x + 1) % messages.length), 4500);
    return () => clearInterval(t);
  }, [messages.length]);
  if (!messages.length) return null;
  return (
    <div className="relative h-9 overflow-hidden bg-night text-[11px] font-medium uppercase tracking-[0.16em] text-night-fg" aria-label="Anuncios">
      {messages.map((m, k) => (
        <p
          key={m}
          aria-hidden={k !== i}
          className={`absolute inset-0 grid place-items-center px-4 text-center transition-all duration-700 ${k === i ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}
        >
          {m}
        </p>
      ))}
    </div>
  );
}
