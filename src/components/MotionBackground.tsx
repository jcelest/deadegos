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

interface Star {
  x: number;
  y: number;
  size: number;
  rotation: number;
  twinkleSpeed: number;
  phase: number;
  opacity: number;
  driftX: number;
  driftY: number;
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function drawStarPath(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  rotation: number
) {
  const points = 5;
  ctx.beginPath();

  for (let i = 0; i < points * 2; i += 1) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = rotation + (Math.PI / points) * i - Math.PI / 2;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  ctx.closePath();
}

export default function MotionBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const theme = getCurrentTheme();
  const isUsaTheme = theme.id === "blue";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const primary = hexToRgb(theme.primary);
    const glow = hexToRgb(theme.primaryGlow);
    const navy = hexToRgb(theme.navy);

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.matchMedia("(max-width: 768px)").matches;

    let animationId: number;
    let width = 0;
    let height = 0;
    let time = 0;
    let visible = true;
    let resizeTimer: ReturnType<typeof setTimeout> | undefined;

    const waves: Wave[] = [
      { amplitude: 80, frequency: 0.003, speed: 0.018, phase: 0, yOffset: 0.35, opacity: 0.52, lineWidth: 2 },
      { amplitude: 120, frequency: 0.002, speed: 0.012, phase: 2, yOffset: 0.5, opacity: 0.4, lineWidth: 3 },
      { amplitude: 60, frequency: 0.004, speed: 0.025, phase: 4, yOffset: 0.65, opacity: 0.32, lineWidth: 1.5 },
      { amplitude: 100, frequency: 0.0025, speed: -0.015, phase: 1, yOffset: 0.45, opacity: 0.28, lineWidth: 2 },
    ];

    const orbs: Orb[] = [];
    const stars: Star[] = [];

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      const nextWidth = Math.round(rect?.width ?? window.innerWidth);
      const nextHeight = Math.round(rect?.height ?? window.innerHeight);

      if (nextWidth === width && nextHeight === height) return;

      width = nextWidth;
      height = nextHeight;

      const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const initOrbs = () => {
      orbs.length = 0;
      const count = isMobile ? 4 : 7;
      for (let i = 0; i < count; i++) {
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

    const initStars = () => {
      stars.length = 0;

      const cantonW = width * (isMobile ? 0.52 : 0.46);
      const cantonH = height * (isMobile ? 0.34 : 0.38);
      const gridCols = isMobile ? 5 : 6;
      const gridRows = isMobile ? 4 : 5;
      const cellW = cantonW / gridCols;
      const cellH = cantonH / gridRows;

      for (let row = 0; row < gridRows; row += 1) {
        for (let col = 0; col < gridCols; col += 1) {
          const offsetX = row % 2 === 0 ? 0 : cellW * 0.5;
          stars.push({
            x: col * cellW + cellW * 0.5 + offsetX + (Math.random() - 0.5) * cellW * 0.15,
            y: row * cellH + cellH * 0.5 + (Math.random() - 0.5) * cellH * 0.15,
            size: isMobile ? 4 + Math.random() * 3 : 5.5 + Math.random() * 4,
            rotation: Math.random() * Math.PI * 2,
            twinkleSpeed: 0.018 + Math.random() * 0.025,
            phase: Math.random() * Math.PI * 2,
            opacity: 0.75 + Math.random() * 0.25,
            driftX: (Math.random() - 0.5) * 0.08,
            driftY: (Math.random() - 0.5) * 0.06,
          });
        }
      }

      const scatterCount = isMobile ? 14 : 24;
      for (let i = 0; i < scatterCount; i += 1) {
        stars.push({
          x: cantonW * 0.45 + Math.random() * (width - cantonW * 0.35),
          y: Math.random() * height,
          size: 2.5 + Math.random() * 3.5,
          rotation: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.014 + Math.random() * 0.02,
          phase: Math.random() * Math.PI * 2,
          opacity: 0.35 + Math.random() * 0.4,
          driftX: (Math.random() - 0.5) * 0.1,
          driftY: (Math.random() - 0.5) * 0.08,
        });
      }
    };

    const drawBlueTint = () => {
      const vignette = ctx.createRadialGradient(
        width / 2,
        height * 0.42,
        0,
        width / 2,
        height * 0.42,
        Math.max(width, height) * 0.9
      );
      vignette.addColorStop(0, `rgba(${navy.r}, ${navy.g}, ${navy.b}, 0.28)`);
      vignette.addColorStop(0.55, `rgba(${navy.r}, ${navy.g}, ${navy.b}, 0.16)`);
      vignette.addColorStop(1, "rgba(0, 0, 0, 0.35)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      const centerGlow = ctx.createRadialGradient(
        width / 2,
        height * 0.38,
        0,
        width / 2,
        height * 0.38,
        isMobile ? 260 : 380
      );
      centerGlow.addColorStop(0, `rgba(${primary.r}, ${primary.g}, ${primary.b}, 0.22)`);
      centerGlow.addColorStop(1, `rgba(${primary.r}, ${primary.g}, ${primary.b}, 0)`);
      ctx.fillStyle = centerGlow;
      ctx.fillRect(0, 0, width, height);
    };

    const drawUsaStripes = (t: number) => {
      const stripeCount = isMobile ? 11 : 13;
      const stripeHeight = height / stripeCount;
      const scroll = prefersReducedMotion ? 0 : Math.sin(t * 0.012) * stripeHeight * 0.65;

      for (let i = 0; i < stripeCount + 2; i += 1) {
        const y = i * stripeHeight + scroll;
        const isFilled = i % 2 === 0;
        const wave = Math.sin(t * 0.016 + i * 0.85) * (isMobile ? 5 : 9);
        const pulse = Math.sin(t * 0.01 + i * 0.4) * 0.04;
        const opacity = isFilled ? 0.28 + pulse : 0.08;

        ctx.fillStyle = isFilled
          ? `rgba(${primary.r}, ${primary.g}, ${primary.b}, ${opacity})`
          : `rgba(255, 255, 255, ${opacity})`;
        ctx.fillRect(-30, y + wave, width + 60, stripeHeight + 2);
      }

      ctx.globalAlpha = 0.35;
      for (let i = 0; i < stripeCount + 2; i += 1) {
        const y = i * stripeHeight - scroll * 0.5 + stripeHeight * 0.5;
        const isFilled = i % 2 !== 0;
        if (!isFilled) continue;

        const wave = Math.sin(t * 0.014 + i * 1.1) * (isMobile ? 4 : 7);
        ctx.fillStyle = `rgba(${glow.r}, ${glow.g}, ${glow.b}, 0.18)`;
        ctx.fillRect(-30, y + wave, width + 60, stripeHeight * 0.55);
      }
      ctx.globalAlpha = 1;
    };

    const drawUsaCanton = (t: number) => {
      const cantonW = width * (isMobile ? 0.58 : 0.5);
      const cantonH = height * (isMobile ? 0.4 : 0.44);
      const pulse = prefersReducedMotion ? 0 : Math.sin(t * 0.008) * 0.04;

      const cantonGradient = ctx.createLinearGradient(0, 0, cantonW, cantonH);
      cantonGradient.addColorStop(0, `rgba(${navy.r}, ${navy.g}, ${navy.b}, ${0.94 + pulse})`);
      cantonGradient.addColorStop(0.65, `rgba(${primary.r}, ${primary.g}, ${primary.b}, ${0.55 + pulse})`);
      cantonGradient.addColorStop(1, `rgba(${primary.r}, ${primary.g}, ${primary.b}, ${0.35 + pulse})`);

      ctx.fillStyle = cantonGradient;
      ctx.fillRect(0, 0, cantonW, cantonH);

      ctx.strokeStyle = `rgba(${glow.r}, ${glow.g}, ${glow.b}, ${isMobile ? 0.35 : 0.5})`;
      ctx.lineWidth = isMobile ? 1.5 : 2;
      ctx.strokeRect(1, 1, cantonW - 2, cantonH - 2);

      if (!prefersReducedMotion) {
        const sweepX = (Math.sin(t * 0.006) * 0.5 + 0.5) * cantonW;
        const sweep = ctx.createLinearGradient(sweepX - cantonW * 0.25, 0, sweepX + cantonW * 0.25, cantonH);
        sweep.addColorStop(0, "rgba(255, 255, 255, 0)");
        sweep.addColorStop(0.5, "rgba(255, 255, 255, 0.12)");
        sweep.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = sweep;
        ctx.fillRect(0, 0, cantonW, cantonH);
      }
    };

    const drawUsaStars = (t: number) => {
      stars.forEach((star) => {
        if (!prefersReducedMotion) {
          star.x += star.driftX;
          star.y += star.driftY;
          star.rotation += 0.0015;

          if (star.x < -30) star.x = width + 30;
          if (star.x > width + 30) star.x = -30;
          if (star.y < -30) star.y = height + 30;
          if (star.y > height + 30) star.y = -30;
        }

        const twinkle = 0.65 + Math.sin(t * star.twinkleSpeed + star.phase) * 0.35;
        const alpha = Math.min(1, star.opacity * twinkle);

        if (!isMobile) {
          ctx.shadowColor = `rgba(${glow.r}, ${glow.g}, ${glow.b}, 0.9)`;
          ctx.shadowBlur = star.size * 2.2;
        }

        drawStarPath(ctx, star.x, star.y, star.size * 1.15, star.size * 0.48, star.rotation);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.95})`;
        ctx.fill();

        drawStarPath(ctx, star.x, star.y, star.size, star.size * 0.42, star.rotation);
        ctx.fillStyle = `rgba(${glow.r}, ${glow.g}, ${glow.b}, ${alpha})`;
        ctx.fill();

        ctx.shadowBlur = 0;
      });
    };

    const drawUsaWaveAccents = (t: number) => {
      const step = isMobile ? 5 : 3;
      const waveCount = isMobile ? 2 : 3;

      for (let w = 0; w < waveCount; w += 1) {
        const baseY = height * (0.55 + w * 0.12);
        const amplitude = isMobile ? 28 + w * 10 : 42 + w * 14;

        ctx.beginPath();
        for (let x = 0; x <= width; x += step) {
          const y =
            baseY +
            Math.sin(x * 0.004 + t * (0.02 + w * 0.004) + w) * amplitude +
            Math.sin(x * 0.009 - t * 0.015) * (amplitude * 0.35);

          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.strokeStyle = `rgba(${glow.r}, ${glow.g}, ${glow.b}, ${0.35 - w * 0.06})`;
        ctx.lineWidth = isMobile ? 2 : 2.5;
        ctx.stroke();
      }
    };

    const drawWave = (wave: Wave, t: number) => {
      const baseY = height * wave.yOffset;
      const step = isMobile ? 4 : 2;

      ctx.beginPath();
      for (let x = 0; x <= width; x += step) {
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
      if (!isMobile) {
        ctx.shadowColor = `rgba(${primary.r}, ${primary.g}, ${primary.b}, 0.8)`;
        ctx.shadowBlur = 20;
      }
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
      if (isMobile) return;
      ctx.fillStyle = "rgba(0, 0, 0, 0.03)";
      for (let y = 0; y < height; y += 4) {
        ctx.fillRect(0, y, width, 1);
      }
    };

    const drawVerticalStreaks = (t: number) => {
      const count = isMobile ? 6 : 12;
      for (let i = 0; i < count; i++) {
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

    const drawUsaFrame = (t: number) => {
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);

      drawUsaStripes(t);
      drawUsaWaveAccents(t);
      drawUsaCanton(t);
      drawUsaStars(t);
      drawBlueTint();
    };

    const drawClassicFrame = (t: number) => {
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);

      drawBlueTint();
      drawOrbs();
      waves.forEach((wave) => drawWave(wave, t));
      drawVerticalStreaks(t);
      drawScanlines();
    };

    const animate = () => {
      if (!visible) {
        animationId = requestAnimationFrame(animate);
        return;
      }

      if (!prefersReducedMotion) {
        time += 1;
      }

      if (isUsaTheme) {
        drawUsaFrame(time);
      } else {
        drawClassicFrame(time);
      }

      animationId = requestAnimationFrame(animate);
    };

    const scheduleResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resize();
        if (isUsaTheme) initStars();
        else initOrbs();
      }, 200);
    };

    resize();
    if (isUsaTheme) initStars();
    else initOrbs();
    animate();

    const observer = new ResizeObserver(scheduleResize);
    if (canvas.parentElement) observer.observe(canvas.parentElement);

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    visibilityObserver.observe(canvas);

    return () => {
      cancelAnimationFrame(animationId);
      if (resizeTimer) clearTimeout(resizeTimer);
      observer.disconnect();
      visibilityObserver.disconnect();
    };
  }, [isUsaTheme, theme.primary, theme.primaryGlow, theme.navy]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full [transform:translateZ(0)] [backface-visibility:hidden]"
      aria-hidden="true"
    />
  );
}
