"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

/**
 * Escena del hero: frascos Perfupox sobre un pedestal con luz dorada que sigue el cursor
 * y una bruma tenue que sube. Respeta «reducir movimiento».
 */
export function HeroStage() {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const bottles = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrap.current!;
    const cv = canvas.current!;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0, raf = 0;
    const light = { x: 0, y: 0, tx: -1, ty: -1 };
    type P = { x: number; y: number; vx: number; vy: number; r: number; a: number; ph: number };
    let parts: P[] = [];
    const size = () => {
      const r = el.getBoundingClientRect();
      const d = Math.min(devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      cv.width = W * d; cv.height = H * d;
      ctx.setTransform(d, 0, 0, d, 0, 0);
      light.x = W / 2; light.y = H * 0.35;
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(el);
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      light.tx = e.clientX - r.left; light.ty = e.clientY - r.top;
      const x = light.tx / r.width - 0.5;
      if (bottles.current) bottles.current.style.transform = `translate3d(${x * -14}px,0,0) rotate(${x * 2}deg)`;
    };
    const leave = () => {
      light.tx = -1;
      if (bottles.current) bottles.current.style.transform = "";
    };
    el.parentElement?.addEventListener("pointermove", move);
    el.parentElement?.addEventListener("pointerleave", leave);

    const frame = () => {
      ctx.clearRect(0, 0, W, H);
      const tx = light.tx < 0 ? W / 2 : light.tx, ty = light.ty < 0 ? H * 0.35 : light.ty;
      light.x += (tx - light.x) * 0.05; light.y += (ty - light.y) * 0.05;
      const g = ctx.createRadialGradient(light.x, light.y, 0, light.x, light.y, Math.max(W, H) * 0.55);
      g.addColorStop(0, "rgba(201,168,106,.26)"); g.addColorStop(0.45, "rgba(201,168,106,.07)"); g.addColorStop(1, "rgba(201,168,106,0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const base = H * 0.86;
      const pg = ctx.createLinearGradient(W * 0.1, 0, W * 0.9, 0);
      pg.addColorStop(0, "rgba(201,168,106,0)"); pg.addColorStop(0.5, "rgba(224,196,141,.55)"); pg.addColorStop(1, "rgba(201,168,106,0)");
      ctx.fillStyle = pg; ctx.fillRect(W * 0.1, base, W * 0.8, 1);
      const eg = ctx.createRadialGradient(W / 2, base, 0, W / 2, base, W * 0.4);
      eg.addColorStop(0, "rgba(201,168,106,.18)"); eg.addColorStop(1, "rgba(201,168,106,0)");
      ctx.fillStyle = eg; ctx.fillRect(0, base - 40, W, 80);
      if (!reduce) {
        if (Math.random() < 0.3) parts.push({ x: W / 2 + (Math.random() - 0.5) * W * 0.4, y: H * 0.3, vx: (Math.random() - 0.5) * 0.3, vy: -0.25 - Math.random() * 0.3, r: 10 + Math.random() * 18, a: 1, ph: Math.random() * 6 });
        for (const p of parts) {
          p.ph += 0.02; p.x += p.vx + Math.sin(p.ph) * 0.3; p.y += p.vy; p.r += 0.2; p.a -= 0.004;
          const s = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
          s.addColorStop(0, `rgba(241,234,220,${0.06 * p.a})`); s.addColorStop(1, "rgba(241,234,220,0)");
          ctx.fillStyle = s; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        }
        parts = parts.filter((p) => p.a > 0).slice(-140);
        raf = requestAnimationFrame(frame);
      }
    };
    frame();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      el.parentElement?.removeEventListener("pointermove", move);
      el.parentElement?.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <div ref={wrap} className="relative h-full min-h-[320px] w-full lg:min-h-[520px]">
      <canvas ref={canvas} className="absolute inset-0 h-full w-full" aria-hidden />
      <div ref={bottles} className="absolute inset-x-0 bottom-[14%] flex items-end justify-center gap-[3%] transition-transform duration-700 ease-out" aria-hidden>
        <Image src="/products/preparada/30-gota.webp" alt="" width={160} height={608} className="w-[12%] animate-[pfx-float_7s_ease-in-out_infinite] drop-shadow-[0_30px_30px_rgba(0,0,0,.6)]" priority />
        <Image src="/products/preparada/100.webp" alt="" width={336} height={768} className="w-[26%] animate-[pfx-float_8s_.6s_ease-in-out_infinite] drop-shadow-[0_40px_40px_rgba(0,0,0,.65)]" priority />
        <Image src="/products/preparada/50.webp" alt="" width={176} height={784} className="w-[13%] animate-[pfx-float_7.5s_1.2s_ease-in-out_infinite] drop-shadow-[0_30px_30px_rgba(0,0,0,.6)]" priority />
      </div>
    </div>
  );
}
