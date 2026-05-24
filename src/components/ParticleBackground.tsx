import { useEffect, useRef } from 'react';

interface ParticleBackgroundProps {
  reducedMotion?: boolean;
  theme?: 'cyberpunk' | 'neon' | 'glass-dark' | 'glass-light';
}

export default function ParticleBackground({ reducedMotion = false, theme = 'glass-dark' }: ParticleBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    // Track state on resize
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        width = canvas.width = entry.contentRect.width || canvas.parentElement?.clientWidth || window.innerWidth;
        height = canvas.height = entry.contentRect.height || canvas.parentElement?.clientHeight || window.innerHeight;
      }
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    // Particle class
    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 2.5 + 0.5;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        
        // Choose glowing neon palette based on theme
        if (theme === 'cyberpunk') {
          this.color = Math.random() > 0.5 ? 'rgba(236, 72, 153, 0.4)' : 'rgba(234, 179, 8, 0.4)'; // pink or yellow
        } else if (theme === 'neon') {
          this.color = Math.random() > 0.5 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(59, 130, 246, 0.4)'; // emerald or blue
        } else if (theme === 'glass-light') {
          this.color = 'rgba(99, 102, 241, 0.15)'; // indigo light
        } else {
          this.color = Math.random() > 0.5 ? 'rgba(147, 51, 234, 0.3)' : 'rgba(6, 182, 212, 0.3)'; // purple or cyan
        }
      }

      update() {
        if (!reducedMotion) {
          this.x += this.vx;
          this.y += this.vy;

          if (this.x < 0 || this.x > width) this.vx *= -1;
          if (this.y < 0 || this.y > height) this.vy *= -1;
        }
      }

      draw(c: CanvasRenderingContext2D) {
        c.beginPath();
        c.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        c.fillStyle = this.color;
        c.shadowBlur = !reducedMotion ? 4 : 0;
        c.shadowColor = this.color;
        c.fill();
        c.shadowBlur = 0; // reset
      }
    }

    const particleCount = reducedMotion ? 12 : Math.min(65, Math.floor((width * height) / 10000));
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Render cosmic ambient floor gradient
      const grad = ctx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, Math.max(width, height));
      if (theme === 'cyberpunk') {
        grad.addColorStop(0, 'rgba(20, 10, 30, 0.95)');
        grad.addColorStop(1, 'rgba(5, 2, 10, 0.98)');
      } else if (theme === 'neon') {
        grad.addColorStop(0, 'rgba(8, 20, 15, 0.95)');
        grad.addColorStop(1, 'rgba(2, 5, 4, 0.98)');
      } else if (theme === 'glass-light') {
        grad.addColorStop(0, 'rgba(245, 247, 250, 0.95)');
        grad.addColorStop(1, 'rgba(224, 230, 240, 0.97)');
      } else {
        grad.addColorStop(0, 'rgba(11, 15, 30, 0.95)');
        grad.addColorStop(1, 'rgba(3, 4, 10, 0.98)');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Connect near particles
      if (!reducedMotion) {
        ctx.strokeStyle = theme === 'glass-light' ? 'rgba(99, 102, 241, 0.05)' : 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 85) {
              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.stroke();
            }
          }
        }
      }

      // Draw standard stars/coordinates
      particles.forEach((p) => {
        p.update();
        p.draw(ctx);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, [reducedMotion, theme]);

  return (
    <canvas
      ref={canvasRef}
      id="nexus_stars_canvas"
      className="absolute inset-0 block pointer-events-none rounded-2xl w-full h-full"
    />
  );
}
