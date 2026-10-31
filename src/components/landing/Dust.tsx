"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/lib/hooks";

/**
 * A small amount of drifting dust, brightest where the light falls.
 * 2D canvas on purpose: the landing page should never wait on WebGL.
 */
export default function Dust({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const count = w < 700 ? 26 : 56;
    const motes = Array.from({ length: count }, () => ({
      x: Math.random(),
      y: Math.random(),
      z: 0.3 + Math.random() * 0.7,
      s: 0.5 + Math.random() * 1.4,
      p: Math.random() * Math.PI * 2,
    }));

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      pointer.x += (pointer.tx - pointer.x) * 0.04;
      pointer.y += (pointer.ty - pointer.y) * 0.04;
      for (const m of motes) {
        if (!reduced) {
          m.y -= 0.00005 * m.z;
          m.x += Math.sin(t * 0.0002 + m.p) * 0.00006;
          if (m.y < -0.02) m.y = 1.02;
        }
        const px = m.x * w + pointer.x * 28 * m.z;
        const py = m.y * h + pointer.y * 18 * m.z;
        // light falls from upper centre
        const dx = (px / w - 0.5) / 0.55;
        const dy = (py / h - 0.35) / 0.7;
        const lit = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy));
        const a = (0.04 + lit * 0.38) * m.z * (0.7 + 0.3 * Math.sin(t * 0.001 + m.p));
        ctx.beginPath();
        ctx.fillStyle = `rgba(236,235,230,${a.toFixed(3)})`;
        ctx.arc(px, py, m.s * m.z, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!reduced) raf = requestAnimationFrame(draw);
    };

    const onMove = (e: PointerEvent) => {
      pointer.tx = e.clientX / window.innerWidth - 0.5;
      pointer.ty = e.clientY / window.innerHeight - 0.5;
    };
    const onVis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && !reduced) raf = requestAnimationFrame(draw);
    };

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("visibilitychange", onVis);
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [reduced]);

  return <canvas ref={ref} aria-hidden className={`h-full w-full ${className}`} />;
}
