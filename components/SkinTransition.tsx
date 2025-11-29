
import React, { useEffect, useRef } from 'react';
import { Skin } from '../types';

interface SkinTransitionProps {
  targetSkin: Skin;
  onPeak: () => void;
  onComplete: () => void;
}

const SkinTransition: React.FC<SkinTransitionProps> = ({ targetSkin, onPeak, onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Use refs to keep callbacks stable inside the effect loop
  const onPeakRef = useRef(onPeak);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onPeakRef.current = onPeak;
    onCompleteRef.current = onComplete;
  }, [onPeak, onComplete]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    let frame = 0;
    const TOTAL_FRAMES = 90; // ~1.5s
    const PEAK_FRAME = 45;
    let hasPeaked = false;
    let animationId: number;

    let particles: any[] = [];

    // --- Particle Classes ---

    class Leaf {
        x: number; y: number; size: number; color: string; vx: number; vy: number; rot: number;
        constructor() {
          this.x = -50;
          this.y = Math.random() * height;
          this.size = Math.random() * 20 + 10;
          this.color = Math.random() > 0.5 ? '#10b981' : '#065f46';
          this.vx = Math.random() * 20 + 15;
          this.vy = (Math.random() - 0.5) * 5;
          this.rot = Math.random() * Math.PI;
        }
        update() { this.x += this.vx; this.y += this.vy; this.rot += 0.1; }
        draw(ctx: CanvasRenderingContext2D) {
          ctx.save();
          ctx.translate(this.x, this.y);
          ctx.rotate(this.rot);
          ctx.fillStyle = this.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, this.size, this.size/3, 0, 0, Math.PI*2);
          ctx.fill();
          ctx.restore();
        }
    }

    class Bubble {
      x: number; y: number; r: number; speed: number;
      constructor() {
        this.x = Math.random() * width;
        this.y = height + Math.random() * 100;
        this.r = Math.random() * 50 + 20;
        this.speed = Math.random() * 15 + 10;
      }
      update() { this.y -= this.speed; }
      draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI*2);
        ctx.fillStyle = '#0ea5e9'; ctx.fill();
      }
    }

    class SakuraPetal {
        x: number; y: number; size: number; color: string; vx: number; vy: number; rot: number;
        constructor() {
            this.x = Math.random() * width + width + 50; // Start right
            this.y = Math.random() * height * 1.5 - height * 0.25;
            this.size = Math.random() * 20 + 10;
            this.color = Math.random() > 0.5 ? '#fda4af' : '#fecdd3';
            this.vx = -(Math.random() * 25 + 15); // Move fast left
            this.vy = Math.random() * 4 - 2;
            this.rot = Math.random() * Math.PI;
        }
        update() { this.x += this.vx; this.y += this.vy; this.rot += 0.1; }
        draw(ctx: CanvasRenderingContext2D) {
            ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.rot);
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.moveTo(0,0); ctx.quadraticCurveTo(this.size/2, -this.size, this.size, 0); ctx.quadraticCurveTo(this.size/2, this.size, 0,0);
            ctx.fill(); ctx.restore();
        }
    }

    class SandGrain {
        x: number; y: number; w: number; speed: number;
        constructor() {
            this.x = width + Math.random() * 500;
            this.y = Math.random() * height;
            this.w = Math.random() * 60 + 10;
            this.speed = Math.random() * 40 + 30;
        }
        update() { this.x -= this.speed; }
        draw(ctx: CanvasRenderingContext2D) {
            ctx.fillStyle = '#fde047';
            ctx.globalAlpha = 0.6;
            ctx.fillRect(this.x, this.y, this.w, 3);
            ctx.globalAlpha = 1;
        }
    }

    class WarpStar {
        x: number; y: number; z: number;
        constructor() {
            this.x = (Math.random() - 0.5) * width;
            this.y = (Math.random() - 0.5) * height;
            this.z = Math.random() * width;
        }
        update() { 
             this.z -= 40; 
             if(this.z <= 1) { 
                 this.z = width; 
                 this.x=(Math.random()-0.5)*width; 
                 this.y=(Math.random()-0.5)*height; 
             } 
        }
    }

    class MatrixChar {
        x: number; y: number; speed: number; char: string;
        constructor() {
            this.x = Math.floor(Math.random() * (width/15)) * 15;
            this.y = Math.random() * -height;
            this.speed = Math.random() * 30 + 20;
            this.char = Math.random() > 0.5 ? '1' : '0';
        }
        update() { this.y += this.speed; }
        draw(ctx: CanvasRenderingContext2D) {
            ctx.fillStyle = '#0f0'; ctx.font = '20px monospace'; ctx.fillText(this.char, this.x, this.y);
        }
    }

    class InkBlob {
        x: number; y: number; r: number; maxR: number; speed: number;
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.r = 0;
            this.maxR = Math.max(width, height) * 0.6;
            this.speed = Math.random() * 15 + 10;
        }
        update() { if(this.r < this.maxR) this.r += this.speed; }
        draw(ctx: CanvasRenderingContext2D) {
            ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI*2); ctx.fill();
        }
    }

    class FrostSpike {
        x: number; y: number; h: number; width: number;
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() > 0.5 ? 0 : height; // Top or bottom
            this.h = 0;
            this.width = Math.random() * 30 + 10;
        }
        update() { this.h += 25; }
        draw(ctx: CanvasRenderingContext2D) {
            ctx.fillStyle = '#e0f2fe';
            ctx.beginPath();
            if (this.y === 0) { // Top down
                ctx.moveTo(this.x, 0); ctx.lineTo(this.x - this.width/2, this.h); ctx.lineTo(this.x + this.width/2, 0);
            } else { // Bottom up
                ctx.moveTo(this.x, height); ctx.lineTo(this.x - this.width/2, height - this.h); ctx.lineTo(this.x + this.width/2, height);
            }
            ctx.fill();
        }
    }

    // Init Logic
    const initParticles = () => {
        particles = [];
        if (targetSkin === 'forest') for(let i=0; i<150; i++) particles.push(new Leaf());
        if (targetSkin === 'ocean') for(let i=0; i<100; i++) particles.push(new Bubble());
        if (targetSkin === 'sakura') for(let i=0; i<250; i++) particles.push(new SakuraPetal());
        if (targetSkin === 'sunset') for(let i=0; i<300; i++) particles.push(new SandGrain());
        if (targetSkin === 'nebula') for(let i=0; i<300; i++) particles.push(new WarpStar());
        if (targetSkin === 'cyber') for(let i=0; i<150; i++) particles.push(new MatrixChar());
        if (targetSkin === 'ink') for(let i=0; i<15; i++) particles.push(new InkBlob());
        if (targetSkin === 'glacier') for(let i=0; i<120; i++) particles.push(new FrostSpike());
    };
    initParticles();

    // Animate Loop
    const animate = () => {
        frame++;
        const progress = frame / TOTAL_FRAMES;
        
        // Handle Peak
        if (frame >= PEAK_FRAME && !hasPeaked) {
            if (onPeakRef.current) onPeakRef.current();
            hasPeaked = true;
        }

        // --- Render ---
        
        // Clear logic depends on skin
        if (targetSkin !== 'classic' && targetSkin !== 'ink') ctx.clearRect(0,0,width,height);

        if (targetSkin === 'dragon') {
            const alpha = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
            ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
            ctx.fillRect(0, 0, width, height);
            if (frame === PEAK_FRAME) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, width, height); }
            if (frame > PEAK_FRAME && frame < PEAK_FRAME + 15) {
               ctx.fillStyle = `rgba(245, 158, 11, ${(PEAK_FRAME + 15 - frame)/15})`; 
               ctx.fillRect(0, 0, width, height);
            }
        } 
        else if (targetSkin === 'forest') {
            const alpha = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
            ctx.fillStyle = `rgba(20, 83, 45, ${alpha})`;
            ctx.fillRect(0, 0, width, height);
            particles.forEach(p => { p.update(); p.draw(ctx); });
            if (frame < 60 && frame % 2 === 0) particles.push(new Leaf());
        }
        else if (targetSkin === 'ocean') {
            const level = progress < 0.5 ? height * (1 - progress * 2) : 0;
            ctx.fillStyle = '#0f172a';
            if (progress < 0.5) ctx.fillRect(0, level, width, height - level);
            else { ctx.globalAlpha = 1 - (progress - 0.5) * 2; ctx.fillRect(0, 0, width, height); ctx.globalAlpha = 1; }
            particles.forEach(p => { p.update(); p.draw(ctx); });
        }
        else if (targetSkin === 'sakura') {
            const alpha = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
            ctx.fillStyle = `rgba(255, 241, 242, ${alpha})`; 
            ctx.fillRect(0,0,width,height);
            particles.forEach(p => { p.update(); p.draw(ctx); });
        }
        else if (targetSkin === 'sunset') {
            const alpha = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
            ctx.fillStyle = `rgba(124, 45, 18, ${alpha})`; 
            ctx.fillRect(0,0,width,height);
            particles.forEach(p => { p.update(); p.draw(ctx); });
        }
        else if (targetSkin === 'nebula') {
            const alpha = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
            ctx.fillStyle = `rgba(10, 0, 30, ${alpha})`;
            ctx.fillRect(0,0,width,height);
            
            ctx.save();
            ctx.translate(width/2, height/2);
            // Draw lines from center
            ctx.strokeStyle = '#a855f7';
            ctx.lineWidth = 2;
            ctx.globalAlpha = alpha;
            particles.forEach((p: any) => {
                 p.update();
                 const sx = (p.x / p.z) * width;
                 const sy = (p.y / p.z) * height;
                 const px = (p.x / (p.z + 40)) * width;
                 const py = (p.y / (p.z + 40)) * height;
                 ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(px,py); ctx.stroke();
            });
            ctx.restore();
            ctx.globalAlpha = 1;
        }
        else if (targetSkin === 'cyber') {
             const alpha = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
             ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
             ctx.fillRect(0,0,width,height);
             particles.forEach(p => { p.update(); p.draw(ctx); });
             // Random Glitch Rect
             if (Math.random()>0.7 && progress < 0.8 && progress > 0.2) {
                 ctx.fillStyle = '#0ff';
                 ctx.fillRect(Math.random()*width, Math.random()*height, Math.random()*300, Math.random()*10);
             }
        }
        else if (targetSkin === 'ink') {
             const alpha = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
             // We need to clear here specifically because we are drawing additive blobs
             ctx.clearRect(0,0,width,height);
             ctx.fillStyle = `rgba(245, 245, 244, ${alpha})`; 
             ctx.fillRect(0,0,width,height);
             particles.forEach(p => { p.update(); p.draw(ctx); });
        }
        else if (targetSkin === 'glacier') {
             const alpha = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
             ctx.fillStyle = `rgba(30, 58, 138, ${alpha})`; 
             ctx.fillRect(0,0,width,height);
             particles.forEach(p => { p.update(); p.draw(ctx); });
        }
        else {
             // Classic - Sliding Doors
             ctx.clearRect(0,0,width,height);
             let slide = 0;
             // 0 -> 0.5: Doors Close (slide from 0 to width/2)
             // 0.5 -> 1.0: Doors Open (slide from width/2 to 0)
             if (progress < 0.5) slide = (width/2) * (progress * 2); 
             else slide = (width/2) * (1 - (progress - 0.5)*2);
             
             ctx.fillStyle = '#5d4037'; // Wood
             ctx.fillRect(0, 0, slide, height); // Left door
             ctx.fillRect(width - slide, 0, slide, height); // Right door
             
             // Texture details on doors
             ctx.fillStyle = '#3e2723';
             ctx.fillRect(slide - 15, height/2 - 40, 10, 80); // Handle
             ctx.fillRect(width - slide + 5, height/2 - 40, 10, 80); // Handle
        }

        if (frame < TOTAL_FRAMES) {
            animationId = requestAnimationFrame(animate);
        } else {
            if (onCompleteRef.current) onCompleteRef.current();
        }
    };
    
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);

  }, [targetSkin]);

  return <canvas ref={canvasRef} className="fixed inset-0 z-[100] pointer-events-none" />;
};
export default SkinTransition;
    