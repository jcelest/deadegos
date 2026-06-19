"use client";

import { useEffect, useRef } from "react";
import { getCurrentTheme } from "@/lib/theme";

interface Wave {
  amplitude: number;
  frequency: number;
  speed: number;
  phase: number;
  yOffset: number;
  opacity: number;
  lineWidth: number;
}

interface Orb {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  pulse: number;
  pulseSpeed: number;
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

export default function MotionBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const theme = getCurrentTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const primary = hexToRgb(theme.primary);
    const glow = hexToRgb(theme.primaryGlow);
    const navy = hexToRgb(theme.navy);

    let animationId: number;
    let width = 0;
    let height = 0;
    let time = 0;

    const waves: Wave[] = [
      { amplitude: 80, frequency: 0.003, speed: 0.018, phase: 0, yOffset: 0.35, opacity: 0.52, lineWidth: 2 },
      { amplitude: 120, frequency: 0.002, speed: 0.012, phase: 2, yOffset: 0.5, opacity: 0.4, lineWidth: 3 },
      { amplitude: 60, frequency: 0.004, speed: 0.025, phase: 4, yOffset: 0.65, opacity: 0.32, lineWidth: 1.5 },
      { amplitude: 100, frequency: 0.0025, speed: -0.015, phase: 1, yOffset: 0.45, opacity: 0.28, lineWidth: 2 },
    ];

    const orbs: Orb[] = [];

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      width = rect?.width ?? window.innerWidth;
      height = rect?.height ?? window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    const initOrbs = () => {
      orbs.length = 0;
      for (let i = 0; i < 7; i++) {
        orbs.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 120 + 80,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: Math.random() * 0.02 + 0.01,
        });
      }
    };

    const drawWave = (wave: Wave, t: number) => {
      const baseY = height * wave.yOffset;

      ctx.beginPath();
      for (let x = 0; x <= width; x += 2) {
        const y =
          baseY +
          Math.sin(x * wave.frequency + t * wave.speed + wave.phase) * wave.amplitude +
          Math.sin(x * wave.frequency * 2.3 + t * wave.speed * 0.7) * (wave.amplitude * 0.3);

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      const gradient = ctx.createLinearGradient(0, baseY - wave.amplitude, width, baseY + wave.amplitude);
      gradient.addColorStop(0, `rgba(${primary.r}, ${primary.g}, ${primary.b}, 0)`);
      gradient.addColorStop(0.4, `rgba(${primary.r}, ${primary.g}, ${primary.b}, ${wave.opacity})`);
      gradient.addColorStop(0.6, `rgba(${glow.r}, ${glow.g}, ${glow.b}, ${wave.opacity * 0.8})`);
      gradient.addColorStop(1, `rgba(${primary.r}, ${primary.g}, ${primary.b}, 0)`);

      ctx.strokeStyle = gradient;
      ctx.lineWidth = wave.lineWidth;
      ctx.shadowColor = `rgba(${primary.r}, ${primary.g}, ${primary.b}, 0.8)`;
      ctx.shadowBlur = 20;
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    const drawOrbs = () => {
      orbs.forEach((orb) => {
        orb.x += orb.vx;
        orb.y += orb.vy;
        orb.pulse += orb.pulseSpeed;

        if (orb.x < -orb.radius) orb.x = width + orb.radius;
        if (orb.x > width + orb.radius) orb.x = -orb.radius;
        if (orb.y < -orb.radius) orb.y = height + orb.radius;
        if (orb.y > height + orb.radius) orb.y = -orb.radius;

        const pulseScale = 1 + Math.sin(orb.pulse) * 0.15;
        const r = orb.radius * pulseScale;

        const gradient = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, r);
        gradient.addColorStop(0, `rgba(${primary.r}, ${primary.g}, ${primary.b}, 0.22)`);
        gradient.addColorStop(0.4, `rgba(${primary.r}, ${primary.g}, ${primary.b}, 0.1)`);
        gradient.addColorStop(1, `rgba(${primary.r}, ${primary.g}, ${primary.b}, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, r, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const drawScanlines = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.03)";
      for (let y = 0; y < height; y += 4) {
        ctx.fillRect(0, y, width, 1);
      }
    };

    const drawVerticalStreaks = (t: number) => {
      for (let i = 0; i < 12; i++) {
        const x = (i * 137 + t * 30) % width;
        const streakHeight = 60 + (i % 5) * 20;
        const opacity = 0.06 + Math.sin(t * 0.05 + i) * 0.04;

        const gradient = ctx.createLinearGradient(x, 0, x, streakHeight);
        gradient.addColorStop(0, `rgba(${primary.r}, ${primary.g}, ${primary.b}, ${opacity})`);
        gradient.addColorStop(1, `rgba(${primary.r}, ${primary.g}, ${primary.b}, 0)`);

        ctx.fillStyle = gradient;
        ctx.fillRect(x, 0, 1, streakHeight);
      }
    };

    const animate = () => {
      time += 1;

      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);

      const vignette = ctx.createRadialGradient(
        width / 2,
        height * 0.4,
        0,
        width / 2,
        height * 0.4,
        Math.max(width, height) * 0.8
      );
      vignette.addColorStop(0, `rgba(${navy.r}, ${navy.g}, ${navy.b}, 0.55)`);
      vignette.addColorStop(0.5, `rgba(${navy.r}, ${navy.g}, ${navy.b}, 0.3)`);
      vignette.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      drawOrbs();
      waves.forEach((wave) => drawWave(wave, time));
      drawVerticalStreaks(time);
      drawScanlines();

      const centerGlow = ctx.createRadialGradient(
        width / 2,
        height * 0.38,
        0,
        width / 2,
        height * 0.38,
        300
      );
      centerGlow.addColorStop(0, `rgba(${primary.r}, ${primary.g}, ${primary.b}, 0.16)`);
      centerGlow.addColorStop(1, `rgba(${primary.r}, ${primary.g}, ${primary.b}, 0)`);
      ctx.fillStyle = centerGlow;
      ctx.fillRect(0, 0, width, height);

      animationId = requestAnimationFrame(animate);
    };

    resize();
    initOrbs();
    animate();

    const handleResize = () => {
      resize();
      initOrbs();
    };

    const observer = new ResizeObserver(handleResize);
    if (canvas.parentElement) observer.observe(canvas.parentElement);

    return () => {
      cancelAnimationFrame(animationId);
      observer.disconnect();
    };
  }, [theme.primary, theme.primaryGlow, theme.navy]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  );
}
