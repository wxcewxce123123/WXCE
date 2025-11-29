
import React, { useEffect, useRef } from 'react';

interface DragonEntranceProps {
  onComplete: () => void;
}

const DragonEntrance: React.FC<DragonEntranceProps> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // --- Engine Configuration ---
    let frame = 0;
    let width = window.innerWidth;
    let height = window.innerHeight;
    
    // Physics constants
    const DRAGON_SEGMENTS = 60;
    const DRAGON_SPEED = 0.03;
    
    // State
    let phase: 'EYES' | 'ROAR' | 'FLY' | 'CLIMAX' | 'END' = 'EYES';
    let shake = 0;
    let flash = 0;

    // --- Classes ---

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      size: number;
      color: string;
      decay: number;

      constructor(x: number, y: number, type: 'spark' | 'smoke' | 'lightning_remnant') {
        this.x = x;
        this.y = y;
        this.life = 1.0;
        
        if (type === 'spark') {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 5 + 2;
          this.vx = Math.cos(angle) * speed;
          this.vy = Math.sin(angle) * speed;
          this.size = Math.random() * 3 + 1;
          this.color = `hsl(${Math.random() * 40 + 20}, 100%, 70%)`; // Gold/Orange
          this.decay = 0.02;
        } else if (type === 'smoke') {
          this.vx = (Math.random() - 0.5) * 2;
          this.vy = (Math.random() - 0.5) * 2 - 2; // Rise up
          this.size = Math.random() * 20 + 10;
          this.color = `rgba(50, 20, 0, 0.5)`;
          this.decay = 0.01;
        } else {
          this.vx = 0;
          this.vy = 0;
          this.size = Math.random() * 2;
          this.color = '#fff';
          this.decay = 0.05;
        }
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.95; // Friction
        this.vy *= 0.95;
        this.life -= this.decay;
        this.size *= 0.98;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }
    }

    class Dragon {
      path: {x: number, y: number, angle: number}[] = [];
      t: number = 0;

      constructor() {
        // Initialize path off-screen or center
        for(let i=0; i<DRAGON_SEGMENTS; i++) {
          this.path.push({ x: width/2, y: height/2, angle: 0 });
        }
      }

      update(intensity: number) {
        this.t += DRAGON_SPEED * intensity;

        // Lissajous curve for complex organic movement
        // Scale based on screen size
        const scaleX = width * 0.4;
        const scaleY = height * 0.35;
        
        const headX = width/2 + Math.sin(this.t * 2.3) * scaleX + Math.cos(this.t * 1.1) * (scaleX * 0.5);
        const headY = height/2 + Math.cos(this.t * 3.1) * scaleY + Math.sin(this.t * 1.7) * (scaleY * 0.5);
        
        // Calculate angle for head
        const prevHead = this.path[0];
        const angle = Math.atan2(headY - prevHead.y, headX - prevHead.x);

        // Unshift new position, pop old (Shift register)
        this.path.unshift({ x: headX, y: headY, angle });
        if (this.path.length > DRAGON_SEGMENTS) this.path.pop();
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        
        // Draw Body (Reverse order to draw tail first)
        for (let i = this.path.length - 1; i >= 0; i--) {
          const p = this.path[i];
          const size = (DRAGON_SEGMENTS - i) * (width < 600 ? 0.8 : 1.5); // Tapering
          
          ctx.translate(p.x, p.y);
          // ctx.rotate(p.angle); // Optional: rotate scales

          // Scale Gradient
          const hue = 30 + (i / DRAGON_SEGMENTS) * 30; // Orange to Yellow
          const light = 40 + (i / DRAGON_SEGMENTS) * 40;
          ctx.fillStyle = `hsl(${hue}, 100%, ${light}%)`;
          
          // Glow effect for body
          ctx.shadowBlur = 15;
          ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;

          ctx.beginPath();
          ctx.arc(0, 0, size, 0, Math.PI * 2);
          ctx.fill();
          
          // Reset transform for next segment
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          // Re-apply shake if needed (global transform was reset)
        }

        // Draw Head Eyes
        const head = this.path[0];
        if (head) {
            ctx.shadowBlur = 30;
            ctx.shadowColor = '#fff';
            ctx.fillStyle = '#fff';
            // Left Eye
            ctx.beginPath();
            ctx.arc(head.x + Math.cos(head.angle - 1) * 15, head.y + Math.sin(head.angle - 1) * 15, 6, 0, Math.PI * 2);
            ctx.fill();
            // Right Eye
            ctx.beginPath();
            ctx.arc(head.x + Math.cos(head.angle + 1) * 15, head.y + Math.sin(head.angle + 1) * 15, 6, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
      }
    }

    // --- Systems ---
    let particles: Particle[] = [];
    const dragon = new Dragon();

    // Helper: Fractal Lightning
    const castLightning = (x1: number, y1: number, x2: number, y2: number, displace: number) => {
      if (displace < 2) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        return;
      }
      let midX = (x1 + x2) / 2;
      let midY = (y1 + y2) / 2;
      midX += (Math.random() - 0.5) * displace;
      midY += (Math.random() - 0.5) * displace;
      castLightning(x1, y1, midX, midY, displace / 2);
      castLightning(midX, midY, x2, y2, displace / 2);
    };

    // --- Main Loop ---
    const loop = () => {
      frame++;
      
      // Resize handling
      if (width !== window.innerWidth || height !== window.innerHeight) {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
      }

      // 1. Clear with Trails (Motion Blur)
      ctx.fillStyle = 'rgba(5, 0, 0, 0.2)'; // Very dark red/black
      ctx.fillRect(0, 0, width, height);

      // 2. Camera Shake & Flash
      ctx.save();
      if (shake > 0) {
        const dx = (Math.random() - 0.5) * shake;
        const dy = (Math.random() - 0.5) * shake;
        ctx.translate(dx, dy);
        shake *= 0.9;
      }
      if (flash > 0) {
        ctx.fillStyle = `rgba(255, 255, 200, ${flash})`;
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillRect(-50, -50, width+100, height+100);
        ctx.globalCompositeOperation = 'source-over';
        flash *= 0.85;
      }

      // 3. Logic Sequence
      // EYES (0-60 frames): Dark screen, just eyes or hint
      if (frame < 80) {
        phase = 'EYES';
        // Pulse background
        const pulse = Math.sin(frame * 0.1) * 0.1;
        ctx.fillStyle = `rgba(50, 0, 0, ${pulse})`;
        ctx.fillRect(0,0,width,height);
      } 
      // ROAR (80-150): Screen shakes, particles gather
      else if (frame < 150) {
        phase = 'ROAR';
        shake = (frame - 80) * 0.2;
        // Spawn particles center
        if (Math.random() > 0.5) {
            particles.push(new Particle(width/2 + (Math.random()-0.5)*100, height/2 + (Math.random()-0.5)*100, 'spark'));
        }
      }
      // FLY (150-500): Dragon appears and flies
      else if (frame < 550) {
        phase = 'FLY';
        dragon.update(1.5); // Fast movement
        dragon.draw(ctx);
        
        // Random Lightning
        if (Math.random() < 0.05) {
          flash = 0.6;
          shake = 20;
          ctx.shadowBlur = 20;
          ctx.shadowColor = '#fff';
          castLightning(Math.random()*width, 0, Math.random()*width, height, 150);
          ctx.shadowBlur = 0;
        }

        // Emit particles from dragon head
        if (dragon.path[0]) {
             const h = dragon.path[0];
             particles.push(new Particle(h.x, h.y, 'smoke'));
             if (Math.random() > 0.5) particles.push(new Particle(h.x, h.y, 'spark'));
        }
      }
      // CLIMAX (550-650): Massive explosion of light
      else if (frame < 650) {
        phase = 'CLIMAX';
        dragon.update(0.5); // Slow mo
        dragon.draw(ctx);
        shake = 10;
        if (frame === 551) flash = 1.0;
        
        // Final central column of light
        ctx.globalCompositeOperation = 'lighter';
        const grad = ctx.createLinearGradient(0,0,width,height);
        grad.addColorStop(0, 'rgba(255, 200, 0, 0)');
        grad.addColorStop(0.5, `rgba(255, 220, 100, ${(650-frame)/100})`);
        grad.addColorStop(1, 'rgba(255, 200, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0,0,width,height);
      }
      else {
        phase = 'END';
        onComplete();
      }

      // 4. Update Particles
      ctx.globalCompositeOperation = 'lighter';
      for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw(ctx);
        if (particles[i].life <= 0) particles.splice(i, 1);
      }

      ctx.restore();
      if (phase !== 'END') requestAnimationFrame(loop);
    };

    const animId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animId);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] bg-black pointer-events-auto">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};

export default DragonEntrance;
