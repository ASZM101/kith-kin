import { useEffect, useRef } from "react";
import type { Mood } from "../lib/api";

// Placeholder sprites live in public/assets. Swap the files for real art; paths stay the same.
const SPRITES: Record<Mood, string> = {
  happy: "/assets/pet/happy.svg",
  neutral: "/assets/pet/neutral.svg",
  hungry: "/assets/pet/hungry.svg",
  sad: "/assets/pet/sad.svg"
};
const PARTICLES = { feed: "/assets/icons/food.svg", pet: "/assets/icons/heart.svg" };

export type Reaction = { kind: "feed" | "pet"; id: number };

interface Particle { x: number; y: number; vy: number; life: number; img: HTMLImageElement }

const imageCache = new Map<string, HTMLImageElement>();
function image(src: string) {
  let img = imageCache.get(src);
  if (!img) {
    img = new Image();
    img.src = src;
    imageCache.set(src, img);
  }
  return img;
}

export default function PetCanvas({ mood, reaction, size = 260 }: { mood: Mood; reaction: Reaction | null; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const moodRef = useRef(mood);
  const bounceRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);

  moodRef.current = mood;

  useEffect(() => {
    if (!reaction) return;
    bounceRef.current = 1;
    const img = image(PARTICLES[reaction.kind]);
    for (let i = 0; i < 6; i++) {
      particlesRef.current.push({
        x: size * (0.3 + Math.random() * 0.4),
        y: size * 0.55,
        vy: 0.8 + Math.random() * 1.2,
        life: 1,
        img
      });
    }
  }, [reaction, size]);

  useEffect(() => {
    Object.values(SPRITES).forEach(image);
    Object.values(PARTICLES).forEach(image);

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let raf = 0;

    const draw = () => {
      frame++;
      ctx.clearRect(0, 0, size, size);

      const sprite = image(SPRITES[moodRef.current]);
      const speed = moodRef.current === "happy" ? 0.08 : 0.04;
      const bob = reducedMotion ? 0 : Math.sin(frame * speed) * 6;
      const bounce = bounceRef.current;
      bounceRef.current = Math.max(0, bounce - 0.04);
      const squash = 1 + Math.sin(bounce * Math.PI) * 0.08;

      if (sprite.complete && sprite.naturalWidth) {
        const w = size * 0.85 * squash;
        const h = size * 0.85 / squash;
        ctx.drawImage(sprite, (size - w) / 2, size - h - 4 + bob - bounce * 16, w, h);
      }

      particlesRef.current = particlesRef.current.filter(p => p.life > 0);
      for (const p of particlesRef.current) {
        p.y -= p.vy;
        p.life -= 0.012;
        ctx.globalAlpha = Math.max(0, p.life);
        if (p.img.complete) ctx.drawImage(p.img, p.x - 14, p.y - 14, 28, 28);
      }
      ctx.globalAlpha = 1;

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [size]);

  return <canvas ref={canvasRef} style={{ width: size, height: size }} className="pet-canvas" aria-label={`Your pet looks ${mood}`} role="img" />;
}
