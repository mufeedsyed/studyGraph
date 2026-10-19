import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown, Network, FolderKanban } from 'lucide-react';

interface DottedSurfaceProps {
  onExploreFolders: () => void;
  onOpenWorkspace: () => void;
}

export const DottedSurface: React.FC<DottedSurfaceProps> = ({
  onExploreFolders,
  onOpenWorkspace,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  // Interactive cursor tracking
  const mouseRef = useRef({
    targetX: -2000,
    targetY: -2000,
    currentX: -2000,
    currentY: -2000,
    active: false,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Enhanced Grid parameters for a closer, denser, and more prominent surface
    const cols = 92;
    const rows = 60;
    const spacingX = 34; // Closer horizontal spacing
    const spacingZ = 36; // Closer depth spacing

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const resize = () => {
      if (!canvas) return;
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    // Mouse and Touch listeners
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current.targetX = e.clientX - rect.left;
      mouseRef.current.targetY = e.clientY - rect.top;
      mouseRef.current.active = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
      mouseRef.current.targetX = -2000;
      mouseRef.current.targetY = -2000;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const rect = container.getBoundingClientRect();
        mouseRef.current.targetX = e.touches[0].clientX - rect.left;
        mouseRef.current.targetY = e.touches[0].clientY - rect.top;
        mouseRef.current.active = true;
      }
    };

    const handleTouchEnd = () => {
      mouseRef.current.active = false;
      mouseRef.current.targetX = -2000;
      mouseRef.current.targetY = -2000;
    };

    container.addEventListener('mousemove', handleMouseMove, { passive: true });
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd);

    // Pause rendering when hero is scrolled out of view
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.05 }
    );

    observer.observe(container);

    let time = 0;
    // Closer, more immersive camera perspective
    const fov = 520;
    const cameraY = -220; // Lower vantage brings wave closer to the viewer
    const cameraZ = -80;

    const render = () => {
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      if (!prefersReducedMotion) {
        time += 0.016;
      }

      // Smooth cursor lerp interpolation
      const mouse = mouseRef.current;
      mouse.currentX += (mouse.targetX - mouse.currentX) * 0.12;
      mouse.currentY += (mouse.targetY - mouse.currentY) * 0.12;

      // Draw pure black background
      ctx.fillStyle = '#080808';
      ctx.fillRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height * 0.46; // Horizon level

      // Pre-compute mouse interaction values
      const mX = mouse.currentX;
      const mY = mouse.currentY;
      const mouseRadius = 240;
      const mouseRadiusSq = mouseRadius * mouseRadius;

      // Loop through 3D points
      for (let r = 0; r < rows; r++) {
        const zPos = 140 + r * spacingZ - cameraZ;
        const zFactor = fov / (fov + zPos);

        // Smooth horizon fade with enhanced foreground visibility
        const progressZ = r / rows;
        const baseAlpha = Math.max(0.18, Math.min(1.0, 1.05 - progressZ * 0.62));

        for (let c = 0; c < cols; c++) {
          const xPos = (c - cols / 2) * spacingX;

          // Prominent 3D wave mathematics
          const wave1 = Math.sin(c * 0.14 + time * 1.7) * Math.cos(r * 0.12 + time * 1.2) * 54;
          const wave2 = Math.sin((c + r) * 0.08 - time * 1.4) * 30;
          const wave3 = Math.cos(c * 0.06 + r * 0.05 + time * 0.85) * 18;
          const yPos = cameraY + wave1 + wave2 + wave3;

          // Project (X, Y, Z) into 2D Screen coordinates
          let screenX = centerX + xPos * zFactor;
          let screenY = centerY - yPos * zFactor;

          // Base dot size: prominent in foreground (up to 3.6px), tapering smoothly to horizon
          let radius = Math.max(0.9, Math.min(3.6, 3.4 * zFactor));
          let alpha = baseAlpha;

          // Interactive cursor displacement & ripple calculation
          const dx = screenX - mX;
          const dy = screenY - mY;
          const distSq = dx * dx + dy * dy;

          if (distSq < mouseRadiusSq) {
            const dist = Math.sqrt(distSq);
            const proximity = 1 - dist / mouseRadius; // 1 at center, 0 at edge
            const smoothProximity = proximity * proximity * (3 - 2 * proximity); // Smoothstep curve

            // Organic ripple & displacement away from cursor
            const ripple = Math.sin(dist * 0.07 - time * 5) * smoothProximity * 28;
            const pushAngle = Math.atan2(dy, dx);
            const pushDist = smoothProximity * 22;

            screenX += Math.cos(pushAngle) * pushDist;
            screenY += Math.sin(pushAngle) * pushDist + ripple;

            // Highlight & enlarge dots near cursor
            alpha = Math.min(1.0, alpha + smoothProximity * 0.45);
            radius += smoothProximity * 1.4;
          }

          if (screenX >= -12 && screenX <= width + 12 && screenY >= -12 && screenY <= height + 12) {
            ctx.beginPath();
            ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(245, 245, 250, ${alpha.toFixed(3)})`;
            ctx.fill();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
    };
  }, [isVisible]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden bg-[#080808] flex flex-col justify-between select-none cursor-default"
    >
      {/* 3D Wave Canvas with Pointer Event Sensitivity */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0 pointer-events-none"
      />

      {/* Subtle top/bottom atmospheric vignette */}
      <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-b from-[#080808]/90 via-transparent to-[#080808]" />

      {/* Top minimal brand bar */}
      <header className="relative z-20 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-[#141418] border border-white/10 flex items-center justify-center shadow-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#22c55e]" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-white font-sans">
            StudyGraph
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={onExploreFolders}
            className="text-xs uppercase tracking-widest text-neutral-400 hover:text-white transition-colors duration-200 px-3 py-1.5"
          >
            Library
          </button>
          <button
            onClick={onOpenWorkspace}
            className="text-xs uppercase tracking-widest text-neutral-400 hover:text-white transition-colors duration-200 px-3 py-1.5"
          >
            Concept Graph
          </button>
          <button
            onClick={onOpenWorkspace}
            className="flex items-center space-x-2 bg-white/10 hover:bg-white/15 text-white border border-white/20 px-4 py-2 rounded-full text-xs font-medium tracking-wide transition-all shadow-sm backdrop-blur-sm"
          >
            <Network className="w-3.5 h-3.5 text-emerald-400" />
            <span>Open Workspace</span>
          </button>
        </div>
      </header>

      {/* Center Cinematic Typography Matching Reference */}
      <div className="relative z-20 flex flex-col items-center justify-center text-center px-4 -mt-10 pointer-events-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono tracking-wider text-neutral-300 mb-6 backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>AUTONOMOUS KNOWLEDGE ARCHITECTURE</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-white max-w-4xl leading-[1.08]">
          Your knowledge, <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-200 to-neutral-400">
            connected.
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-neutral-400 max-w-xl font-normal leading-relaxed">
          Your study materials, organized around the way you learn. Manual concept mapping, real PDF integration, and zero AI generation.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={onOpenWorkspace}
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white text-black font-medium text-sm flex items-center justify-center space-x-2.5 hover:bg-neutral-200 transition-all shadow-[0_10px_30px_rgba(255,255,255,0.12)] active:scale-[0.98]"
          >
            <Network className="w-4 h-4 text-emerald-600" />
            <span>Launch Concept Graph</span>
          </button>

          <button
            onClick={onExploreFolders}
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#141418]/80 hover:bg-[#1c1c22] text-white border border-white/15 font-medium text-sm flex items-center justify-center space-x-2.5 backdrop-blur-md transition-all active:scale-[0.98]"
          >
            <FolderKanban className="w-4 h-4 text-neutral-300" />
            <span>Browse Subject Folders</span>
          </button>
        </div>
      </div>

      {/* Bottom Scroll Indicator to Folder Library */}
      <div className="relative z-20 pb-8 flex flex-col items-center justify-center">
        <button
          onClick={onExploreFolders}
          className="group flex flex-col items-center space-y-2 text-neutral-500 hover:text-white transition-colors cursor-pointer"
          aria-label="Scroll to folder library"
        >
          <span className="text-[11px] font-mono tracking-widest uppercase text-neutral-400 group-hover:text-neutral-200 transition-colors">
            Subject Library
          </span>
          <div className="w-7 h-7 rounded-full border border-white/10 flex items-center justify-center group-hover:border-white/30 group-hover:translate-y-0.5 transition-all">
            <ArrowDown className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white transition-colors" />
          </div>
        </button>
      </div>
    </div>
  );
};
