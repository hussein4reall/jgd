import React, { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  baseAlpha: number;
  alpha: number;
  twinkleSpeed: number;
  color: string;
  depth: number;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  alpha: number;
  active: boolean;
  color: string;
}

interface NebulaCloud {
  x: number;
  y: number;
  radius: number;
  color: string;
  alpha: number;
  vx: number;
  vy: number;
}

export const CosmicStarfield: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.width = window.innerWidth * dpr;
      height = canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
      initStars();
    };

    const handleMouseMove = (e: MouseEvent) => {
      const normX = (e.clientX / window.innerWidth - 0.5) * 30;
      const normY = (e.clientY / window.innerHeight - 0.5) * 30;
      mouseRef.current.targetX = normX;
      mouseRef.current.targetY = normY;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    const starColors = [
      '#ffffff',
      '#c4b5fd', // purple tint
      '#93c5fd', // blue tint
      '#fef08a', // warm yellow
      '#a78bfa', // violet
      '#e0e7ff', // crisp ice
    ];

    let stars: Star[] = [];
    let shootingStars: ShootingStar[] = [];
    let nebulas: NebulaCloud[] = [];

    const initStars = () => {
      const starCount = Math.floor((window.innerWidth * window.innerHeight) / 2400);
      stars = [];

      for (let i = 0; i < starCount; i++) {
        const depth = Math.random() * 0.8 + 0.2;
        stars.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          size: (Math.random() * 1.6 + 0.4) * depth,
          baseAlpha: Math.random() * 0.7 + 0.3,
          alpha: Math.random(),
          twinkleSpeed: (Math.random() * 0.02 + 0.005) * (Math.random() > 0.5 ? 1 : -1),
          color: starColors[Math.floor(Math.random() * starColors.length)],
          depth,
        });
      }

      // 3 shooting stars pool
      shootingStars = Array.from({ length: 3 }).map(() => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * (window.innerHeight * 0.5),
        length: Math.random() * 80 + 50,
        speed: Math.random() * 12 + 10,
        angle: Math.PI / 4 + (Math.random() - 0.5) * 0.3,
        alpha: 0,
        active: false,
        color: Math.random() > 0.4 ? '#818cf8' : '#e0e7ff',
      }));

      // Soft nebula clouds for deep space cinematic texture
      nebulas = [
        {
          x: window.innerWidth * 0.2,
          y: window.innerHeight * 0.3,
          radius: 350,
          color: 'rgba(76, 29, 149, 0.07)', // deep indigo
          alpha: 0.06,
          vx: 0.05,
          vy: 0.03,
        },
        {
          x: window.innerWidth * 0.8,
          y: window.innerHeight * 0.7,
          radius: 400,
          color: 'rgba(59, 130, 246, 0.05)', // deep blue
          alpha: 0.05,
          vx: -0.04,
          vy: 0.02,
        },
        {
          x: window.innerWidth * 0.5,
          y: window.innerHeight * 0.9,
          radius: 300,
          color: 'rgba(147, 51, 234, 0.05)', // deep violet
          alpha: 0.05,
          vx: 0.02,
          vy: -0.03,
        },
      ];
    };

    handleResize();

    let lastShootingStarSpawn = Date.now();

    const render = () => {
      // Smooth mouse lerp
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      ctx.fillStyle = '#020206';
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

      // Render nebulas
      nebulas.forEach((nebula) => {
        nebula.x += nebula.vx;
        nebula.y += nebula.vy;
        if (nebula.x < -100) nebula.x = window.innerWidth + 100;
        if (nebula.x > window.innerWidth + 100) nebula.x = -100;

        const grad = ctx.createRadialGradient(
          nebula.x,
          nebula.y,
          0,
          nebula.x,
          nebula.y,
          nebula.radius
        );
        grad.addColorStop(0, nebula.color);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(nebula.x, nebula.y, nebula.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Render Stars with subtle parallax
      stars.forEach((star) => {
        star.alpha += star.twinkleSpeed;
        if (star.alpha > 1 || star.alpha < 0.2) {
          star.twinkleSpeed = -star.twinkleSpeed;
        }

        const parallaxX = star.x + mouseRef.current.x * star.depth;
        const parallaxY = star.y + mouseRef.current.y * star.depth;

        ctx.fillStyle = star.color;
        ctx.globalAlpha = star.alpha * star.baseAlpha;
        ctx.beginPath();
        ctx.arc(parallaxX, parallaxY, star.size, 0, Math.PI * 2);
        ctx.fill();

        // Extra twinkle glow for brighter stars
        if (star.size > 1.2 && star.alpha > 0.8) {
          ctx.strokeStyle = star.color;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(parallaxX - star.size * 2, parallaxY);
          ctx.lineTo(parallaxX + star.size * 2, parallaxY);
          ctx.moveTo(parallaxX, parallaxY - star.size * 2);
          ctx.lineTo(parallaxX, parallaxY + star.size * 2);
          ctx.stroke();
        }
      });

      // Spawn shooting stars periodically
      const now = Date.now();
      if (now - lastShootingStarSpawn > 3500) {
        const inactive = shootingStars.find((s) => !s.active);
        if (inactive) {
          inactive.x = Math.random() * window.innerWidth * 0.8;
          inactive.y = Math.random() * (window.innerHeight * 0.4);
          inactive.length = Math.random() * 90 + 60;
          inactive.speed = Math.random() * 15 + 12;
          inactive.alpha = 1;
          inactive.active = true;
          lastShootingStarSpawn = now;
        }
      }

      // Render shooting stars
      shootingStars.forEach((star) => {
        if (!star.active) return;

        const tailX = star.x - Math.cos(star.angle) * star.length;
        const tailY = star.y - Math.sin(star.angle) * star.length;

        const grad = ctx.createLinearGradient(tailX, tailY, star.x, star.y);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        grad.addColorStop(1, star.color);

        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.globalAlpha = star.alpha;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(star.x, star.y);
        ctx.stroke();

        star.x += Math.cos(star.angle) * star.speed;
        star.y += Math.sin(star.angle) * star.speed;
        star.alpha -= 0.015;

        if (star.alpha <= 0 || star.x > window.innerWidth || star.y > window.innerHeight) {
          star.active = false;
        }
      });

      ctx.globalAlpha = 1;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="cosmic-canvas"
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: '#020206' }}
    />
  );
};
