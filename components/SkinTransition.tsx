
import React, { useEffect, useRef } from 'react';
import { Skin } from '../types';
import { audioController } from '../utils/audio';

interface SkinTransitionProps {
  targetSkin: Skin;
  onPeak: () => void;
  onComplete: () => void;
}

const SkinTransition: React.FC<SkinTransitionProps> = ({ targetSkin, onPeak, onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const onPeakRef = useRef(onPeak);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onPeakRef.current = onPeak;
    onCompleteRef.current = onComplete;
  }, [onPeak, onComplete]);

  useEffect(() => {
    // Trigger sound
    audioController.playSkinTransition(targetSkin);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    let frame = 0;
    const TOTAL_FRAMES = 90;
    const PEAK_FRAME = 45;
    let hasPeaked = false;
    let animationId: number;
    let globalFade = 1;

    let particles: any[] = [];
    let rays: any[] = [];

    // --- Particle Classes ---
    class Leaf {
        x: number; y: number; size: number; color: string; vx: number; vy: number; rot: number;
        constructor() { this.x = -50; this.y = Math.random() * height; this.size = Math.random() * 20 + 10; this.color = Math.random() > 0.5 ? '#10b981' : '#065f46'; this.vx = Math.random() * 20 + 15; this.vy = (Math.random() - 0.5) * 5; this.rot = Math.random() * Math.PI; }
        update() { this.x += this.vx; this.y += this.vy; this.rot += 0.1; }
        draw(ctx: CanvasRenderingContext2D) { ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.rot); ctx.fillStyle = this.color; ctx.beginPath(); ctx.ellipse(0, 0, this.size, this.size/3, 0, 0, Math.PI*2); ctx.fill(); ctx.restore(); }
    }
    class Bubble { x: number; y: number; r: number; speed: number; constructor() { this.x = Math.random() * width; this.y = height + Math.random() * 100; this.r = Math.random() * 50 + 20; this.speed = Math.random() * 15 + 10; } update() { this.y -= this.speed; } draw(ctx: CanvasRenderingContext2D) { ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI*2); ctx.fillStyle = '#0ea5e9'; ctx.fill(); } }
    class SakuraPetal { x: number; y: number; size: number; color: string; vx: number; vy: number; rot: number; constructor() { this.x = Math.random() * width + width + 50; this.y = Math.random() * height * 1.5 - height * 0.25; this.size = Math.random() * 20 + 10; this.color = Math.random() > 0.5 ? '#fda4af' : '#fecdd3'; this.vx = -(Math.random() * 25 + 15); this.vy = Math.random() * 4 - 2; this.rot = Math.random() * Math.PI; } update() { this.x += this.vx; this.y += this.vy; this.rot += 0.1; } draw(ctx: CanvasRenderingContext2D) { ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.rot); ctx.fillStyle = this.color; ctx.beginPath(); ctx.moveTo(0,0); ctx.quadraticCurveTo(this.size/2, -this.size, this.size, 0); ctx.quadraticCurveTo(this.size/2, this.size, 0,0); ctx.fill(); ctx.restore(); } }
    class SandGrain { x: number; y: number; w: number; speed: number; constructor() { this.x = width + Math.random() * 500; this.y = Math.random() * height; this.w = Math.random() * 60 + 10; this.speed = Math.random() * 40 + 30; } update() { this.x -= this.speed; } draw(ctx: CanvasRenderingContext2D) { ctx.fillStyle = '#fde047'; ctx.globalAlpha = 0.6 * globalFade; ctx.fillRect(this.x, this.y, this.w, 3); ctx.globalAlpha = globalFade; } }
    class WarpStar { x: number; y: number; z: number; constructor() { this.x = (Math.random() - 0.5) * width; this.y = (Math.random() - 0.5) * height; this.z = Math.random() * width; } update() { this.z -= 40; if(this.z <= 1) { this.z = width; this.x=(Math.random()-0.5)*width; this.y=(Math.random()-0.5)*height; } } }
    class MatrixChar { x: number; y: number; speed: number; char: string; constructor() { this.x = Math.floor(Math.random() * (width/15)) * 15; this.y = Math.random() * -height; this.speed = Math.random() * 30 + 20; this.char = Math.random() > 0.5 ? '1' : '0'; } update() { this.y += this.speed; } draw(ctx: CanvasRenderingContext2D) { ctx.fillStyle = '#0f0'; ctx.font = '20px monospace'; ctx.fillText(this.char, this.x, this.y); } }
    class InkBlob { x: number; y: number; r: number; maxR: number; speed: number; constructor() { this.x = Math.random() * width; this.y = Math.random() * height; this.r = 0; this.maxR = Math.max(width, height) * 0.6; this.speed = Math.random() * 15 + 10; } update() { if(this.r < this.maxR) this.r += this.speed; } draw(ctx: CanvasRenderingContext2D) { ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI*2); ctx.fill(); } }
    class FrostSpike { x: number; y: number; h: number; width: number; constructor() { this.x = Math.random() * width; this.y = Math.random() > 0.5 ? 0 : height; this.h = 0; this.width = Math.random() * 30 + 10; } update() { this.h += 25; } draw(ctx: CanvasRenderingContext2D) { ctx.fillStyle = '#e0f2fe'; ctx.beginPath(); if (this.y === 0) { ctx.moveTo(this.x, 0); ctx.lineTo(this.x - this.width/2, this.h); ctx.lineTo(this.x + this.width/2, 0); } else { ctx.moveTo(this.x, height); ctx.lineTo(this.x - this.width/2, height - this.h); ctx.lineTo(this.x + this.width/2, height); } ctx.fill(); } }

    class Gear {
      x: number; y: number; r: number; teeth: number; rot: number; speed: number;
      constructor() { this.x = Math.random()*width; this.y = Math.random()*height; this.r=0; this.teeth=8; this.rot=0; this.speed=0.1; }
      update() { this.r += 10; this.rot += this.speed; }
      draw(ctx: CanvasRenderingContext2D) {
         ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.rot); ctx.fillStyle = '#78350f'; 
         ctx.beginPath(); ctx.arc(0, 0, this.r, 0, Math.PI*2); ctx.fill();
         for(let i=0; i<this.teeth; i++) {
            ctx.rotate(Math.PI*2/this.teeth);
            ctx.fillRect(-5, -this.r-10, 10, 20);
         }
         ctx.restore();
      }
    }

    class GlowOrb {
      x: number; y: number; r: number;
      constructor() { this.x = Math.random()*width; this.y=Math.random()*height; this.r=0; }
      update() { this.r+=15; }
      draw(ctx: CanvasRenderingContext2D) {
        const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r);
        g.addColorStop(0, 'rgba(103, 232, 249, 1)'); g.addColorStop(1, 'rgba(103, 232, 249, 0)');
        ctx.fillStyle=g; ctx.beginPath(); ctx.arc(this.x,this.y,this.r,0,Math.PI*2); ctx.fill();
      }
    }

    // --- CELESTIA EFFECT CLASSES ---
    class DivineRay {
      angle: number;
      width: number;
      speed: number;
      length: number;
      alpha: number;

      constructor() {
        this.angle = Math.random() * Math.PI * 2;
        this.width = Math.random() * 0.2 + 0.05; // Angular width in radians
        this.speed = (Math.random() - 0.5) * 0.02;
        this.length = Math.max(width, height) * 1.5;
        this.alpha = Math.random() * 0.5 + 0.2;
      }

      update() {
        this.angle += this.speed;
      }

      draw(ctx: CanvasRenderingContext2D, centerX: number, centerY: number) {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(this.angle);
        
        const grad = ctx.createLinearGradient(0, 0, this.length, 0);
        grad.addColorStop(0, `rgba(255, 255, 255, ${this.alpha})`);
        grad.addColorStop(1, `rgba(251, 191, 36, 0)`); // Fade to transparent gold

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(this.length, -this.length * Math.tan(this.width / 2));
        ctx.lineTo(this.length, this.length * Math.tan(this.width / 2));
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }

    class BurstParticle {
        x: number; y: number; vx: number; vy: number; size: number; color: string; decay: number;
        constructor(type: 'feather' | 'spark') {
           this.x = width / 2;
           this.y = height / 2;
           const angle = Math.random() * Math.PI * 2;
           // Explosive speed
           const speed = type === 'feather' ? (Math.random() * 20 + 5) : (Math.random() * 30 + 10);
           this.vx = Math.cos(angle) * speed;
           this.vy = Math.sin(angle) * speed;
           this.size = type === 'feather' ? (Math.random() * 15 + 5) : (Math.random() * 4 + 1);
           this.color = type === 'feather' ? '#fff' : '#fbbf24';
           this.decay = Math.random() * 0.95 + 0.90; // Drag
        }

        update() {
           this.x += this.vx;
           this.y += this.vy;
           this.vx *= 0.92; // Heavy Air resistance
           this.vy *= 0.92;
           this.vy += 0.2; // Gravity slowly takes over
           if (this.color === '#fff') { // Feathers flutter
               this.x += Math.sin(frame * 0.2) * 0.5;
           }
        }

        draw(ctx: CanvasRenderingContext2D) {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            if (this.color === '#fff') {
                ctx.ellipse(this.x, this.y, this.size, this.size/3, Math.atan2(this.vy, this.vx), 0, Math.PI*2);
            } else {
                ctx.arc(this.x, this.y, this.size, 0, Math.PI*2);
            }
            ctx.fill();
        }
    }
    
    const initParticles = () => {
        particles = [];
        rays = [];
        if (targetSkin === 'forest') for(let i=0; i<150; i++) particles.push(new Leaf());
        if (targetSkin === 'ocean') for(let i=0; i<100; i++) particles.push(new Bubble());
        if (targetSkin === 'sakura') for(let i=0; i<250; i++) particles.push(new SakuraPetal());
        if (targetSkin === 'sunset') for(let i=0; i<300; i++) particles.push(new SandGrain());
        if (targetSkin === 'nebula') for(let i=0; i<300; i++) particles.push(new WarpStar());
        if (targetSkin === 'cyber') for(let i=0; i<150; i++) particles.push(new MatrixChar());
        if (targetSkin === 'ink') for(let i=0; i<15; i++) particles.push(new InkBlob());
        if (targetSkin === 'glacier') for(let i=0; i<120; i++) particles.push(new FrostSpike());
        if (targetSkin === 'alchemy') for(let i=0; i<30; i++) particles.push(new Gear());
        if (targetSkin === 'aurora') for(let i=0; i<50; i++) particles.push(new GlowOrb());
        
        if (targetSkin === 'celestia') {
           // Create God Rays
           for (let i = 0; i < 12; i++) {
             rays.push(new DivineRay());
           }
           // Explosion particles
           for (let i = 0; i < 150; i++) {
             particles.push(new BurstParticle(i % 5 === 0 ? 'feather' : 'spark'));
           }
        }
    };
    initParticles();

    const animate = () => {
        frame++;
        const progress = frame / TOTAL_FRAMES;
        
        if (frame >= TOTAL_FRAMES * 0.8) {
           globalFade = (TOTAL_FRAMES - frame) / (TOTAL_FRAMES * 0.2);
        }

        if (frame >= PEAK_FRAME && !hasPeaked) {
            if (onPeakRef.current) onPeakRef.current();
            hasPeaked = true;
        }

        // Clear logic
        if (targetSkin !== 'classic' && targetSkin !== 'ink' && targetSkin !== 'celestia') ctx.clearRect(0,0,width,height);
        
        ctx.save();
        ctx.globalAlpha = globalFade;

        // --- Render Background Fills ---
        if (targetSkin === 'dragon') {
            const alpha = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
            ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`; ctx.fillRect(0, 0, width, height);
            if (frame === PEAK_FRAME) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, width, height); }
            if (frame > PEAK_FRAME && frame < PEAK_FRAME + 15) { ctx.fillStyle = `rgba(245, 158, 11, ${(PEAK_FRAME + 15 - frame)/15})`; ctx.fillRect(0, 0, width, height); }
        } 
        else if (targetSkin === 'forest') { const alpha = progress < 0.5 ? progress * 2 : 2; ctx.fillStyle = `rgba(20, 83, 45, ${alpha > 1 ? 1 : alpha})`; ctx.fillRect(0, 0, width, height); particles.forEach(p => { p.update(); p.draw(ctx); }); if (frame < 60 && frame % 2 === 0) particles.push(new Leaf()); }
        else if (targetSkin === 'ocean') { const level = progress < 0.5 ? height * (1 - progress * 2) : 0; ctx.fillStyle = '#0f172a'; if (progress < 0.5) ctx.fillRect(0, level, width, height - level); else { ctx.fillRect(0, 0, width, height); } particles.forEach(p => { p.update(); p.draw(ctx); }); }
        else if (targetSkin === 'sakura') { const alpha = progress < 0.5 ? progress * 2 : 2; ctx.fillStyle = `rgba(255, 241, 242, ${alpha > 1 ? 1 : alpha})`; ctx.fillRect(0,0,width,height); particles.forEach(p => { p.update(); p.draw(ctx); }); }
        else if (targetSkin === 'sunset') { const alpha = progress < 0.5 ? progress * 2 : 2; ctx.fillStyle = `rgba(124, 45, 18, ${alpha > 1 ? 1 : alpha})`; ctx.fillRect(0,0,width,height); particles.forEach(p => { p.update(); p.draw(ctx); }); }
        else if (targetSkin === 'nebula') { const alpha = progress < 0.5 ? progress * 2 : 2; ctx.fillStyle = `rgba(10, 0, 30, ${alpha > 1 ? 1 : alpha})`; ctx.fillRect(0,0,width,height); ctx.translate(width/2, height/2); ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 2; particles.forEach((p: any) => { p.update(); const sx=(p.x/p.z)*width; const sy=(p.y/p.z)*height; const px=(p.x/(p.z+40))*width; const py=(p.y/(p.z+40))*height; ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(px,py); ctx.stroke(); }); ctx.setTransform(1,0,0,1,0,0); }
        else if (targetSkin === 'cyber') { const alpha = progress < 0.5 ? progress * 2 : (1 - progress) * 2; ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`; ctx.fillRect(0,0,width,height); particles.forEach(p => { p.update(); p.draw(ctx); }); if (Math.random()>0.7 && progress < 0.8 && progress > 0.2) { ctx.fillStyle = '#0ff'; ctx.fillRect(Math.random()*width, Math.random()*height, Math.random()*300, Math.random()*10); } }
        else if (targetSkin === 'ink') { const alpha = progress < 0.5 ? progress * 2 : 2; ctx.clearRect(0,0,width,height); ctx.fillStyle = `rgba(245, 245, 244, ${alpha > 1 ? 1 : alpha})`; ctx.fillRect(0,0,width,height); particles.forEach(p => { p.update(); p.draw(ctx); }); }
        else if (targetSkin === 'glacier') { const alpha = progress < 0.5 ? progress * 2 : 2; ctx.fillStyle = `rgba(30, 58, 138, ${alpha > 1 ? 1 : alpha})`; ctx.fillRect(0,0,width,height); particles.forEach(p => { p.update(); p.draw(ctx); }); }
        else if (targetSkin === 'alchemy') { const alpha = progress < 0.5 ? progress * 2 : 2; ctx.fillStyle = `rgba(41, 37, 36, ${alpha > 1 ? 1 : alpha})`; ctx.fillRect(0,0,width,height); particles.forEach(p => { p.update(); p.draw(ctx); }); }
        else if (targetSkin === 'aurora') { const alpha = progress < 0.5 ? progress * 2 : 2; ctx.fillStyle = `rgba(2, 6, 23, ${alpha > 1 ? 1 : alpha})`; ctx.fillRect(0,0,width,height); particles.forEach(p => { p.update(); p.draw(ctx); }); }
        else if (targetSkin === 'celestia') {
            // EFFECT: DIVINE EXPLOSION
            ctx.clearRect(0, 0, width, height);

            // 1. Additive Blending for Glow
            ctx.globalCompositeOperation = 'lighter';

            // 2. Background Radiant Gradient
            const centerX = width / 2;
            const centerY = height / 2;
            const bgGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, width);
            bgGrad.addColorStop(0, 'rgba(255, 255, 220, 0.4)');
            bgGrad.addColorStop(0.5, 'rgba(251, 191, 36, 0.1)'); // Amber
            bgGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, width, height);

            // 3. Draw God Rays
            rays.forEach(ray => {
              ray.update();
              ray.draw(ctx, centerX, centerY);
            });

            // 4. Draw Explosion Particles
            particles.forEach(p => {
              p.update();
              p.draw(ctx);
            });

            // 5. The BLINDING FLASH at Peak
            // Opacity curve: Sharp rise to 1.0 at Peak, then fade
            let flashOpacity = 0;
            if (progress < 0.4) {
               flashOpacity = (progress / 0.4) * 0.8; // Buildup
            } else if (progress >= 0.4 && progress <= 0.6) {
               flashOpacity = 1.0; // BLINDING WHITE
            } else {
               flashOpacity = 1 - ((progress - 0.6) / 0.4); // Decay
            }
            
            ctx.globalCompositeOperation = 'source-over'; // Switch back for full white overlay
            ctx.fillStyle = `rgba(255, 255, 255, ${flashOpacity})`;
            ctx.fillRect(0, 0, width, height);

            // 6. Shockwave Ring
            if (progress > 0.4) {
               ctx.strokeStyle = `rgba(255, 255, 255, ${1 - progress})`;
               ctx.lineWidth = 50 * (1 - progress);
               ctx.beginPath();
               ctx.arc(centerX, centerY, width * (progress - 0.4) * 2, 0, Math.PI * 2);
               ctx.stroke();
            }
        }
        else {
             // Classic
             ctx.clearRect(0,0,width,height);
             let slide = 0;
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
        
        ctx.restore();

        if (frame < TOTAL_FRAMES) { animationId = requestAnimationFrame(animate); } 
        else { if (onCompleteRef.current) onCompleteRef.current(); }
    };
    
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [targetSkin]);

  return <canvas ref={canvasRef} className="fixed inset-0 z-[100] pointer-events-none" />;
};
export default SkinTransition;
