
import React, { useRef, useEffect } from 'react';
import { Theme, Skin } from '../types';

interface BackgroundProps {
  theme: Theme;
  skin: Skin;
}

const Background: React.FC<BackgroundProps> = ({ theme, skin }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: any[] = [];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // --- Optimization: Pre-render Cache for Runes ---
    const runeCache: Record<string, HTMLCanvasElement> = {};
    const runesList = ['⚙', '⚗', '⚡', '⌬', '⚔', '⏣'];
    
    if (skin === Skin.Alchemy) {
      runesList.forEach(char => {
        const c = document.createElement('canvas');
        const size = 64; 
        c.width = size;
        c.height = size;
        const cCtx = c.getContext('2d');
        if (cCtx) {
          cCtx.font = '40px serif';
          cCtx.textAlign = 'center';
          cCtx.textBaseline = 'middle';
          cCtx.fillStyle = '#b45309';
          cCtx.shadowColor = '#d97706';
          cCtx.shadowBlur = 10; 
          cCtx.fillText(char, size/2, size/2);
        }
        runeCache[char] = c;
      });
    }

    // --- Particle Classes (OPTIMIZED NATURAL MOTION) ---

    class Sakura {
      x: number; y: number; size: number; speedX: number; speedY: number; rotation: number; rotationSpeed: number; opacity: number; color: string;
      constructor(isSpecial: boolean = false) {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * -canvas!.height;
        this.size = Math.random() * 8 + 5;
        this.speedX = (Math.random() * 0.5 - 0.25); // Much slower horizontal drift
        this.speedY = Math.random() * 0.5 + 0.2; // Very slow fall
        this.rotation = Math.random() * 360;
        this.rotationSpeed = (Math.random() * 0.5 - 0.25); // Slow rotation
        this.opacity = Math.random() * 0.5 + 0.3;
        this.color = isSpecial ? '#fda4af' : '#ffb7b2';
      }
      update() {
        this.x += this.speedX + Math.sin(this.y * 0.01) * 0.2; // Add sway
        this.y += this.speedY; 
        this.rotation += this.rotationSpeed;
        if (this.y > canvas!.height) { this.y = -20; this.x = Math.random() * canvas!.width; }
      }
      draw() {
        if (!ctx) return; ctx.save(); ctx.translate(this.x, this.y); ctx.rotate((this.rotation * Math.PI) / 180);
        ctx.globalAlpha = this.opacity; ctx.fillStyle = this.color; 
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(this.size / 2, -this.size, this.size, 0); ctx.quadraticCurveTo(this.size / 2, this.size, 0, 0); ctx.fill(); ctx.restore();
      }
    }

    class Firefly {
      x: number; y: number; size: number; vx: number; vy: number; alpha: number; fading: boolean;
      constructor() {
        this.x = Math.random() * canvas!.width; this.y = Math.random() * canvas!.height; this.size = Math.random() * 2 + 1;
        this.vx = (Math.random() - 0.5) * 0.2; // Tiny movement
        this.vy = (Math.random() - 0.5) * 0.2; 
        this.alpha = Math.random(); this.fading = Math.random() > 0.5;
      }
      update() {
        this.x += this.vx; this.y += this.vy;
        if (this.x < 0 || this.x > canvas!.width) this.vx *= -1; if (this.y < 0 || this.y > canvas!.height) this.vy *= -1;
        if (this.fading) { this.alpha -= 0.003; if (this.alpha <= 0.1) this.fading = false; } else { this.alpha += 0.003; if (this.alpha >= 0.8) this.fading = true; }
      }
      draw() {
        if (!ctx) return; ctx.save(); ctx.globalAlpha = this.alpha; ctx.fillStyle = '#4ade80'; ctx.shadowBlur = 8; ctx.shadowColor = '#4ade80';
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
    }

    class GoldenEmber {
      x: number; y: number; size: number; speedY: number; wobble: number; wobbleSpeed: number; opacity: number; color: string;
      constructor() {
        this.x = Math.random() * canvas!.width; this.y = canvas!.height + Math.random() * 100; this.size = Math.random() * 3 + 1;
        this.speedY = Math.random() * 0.8 + 0.2; // Slow rise
        this.wobble = Math.random() * Math.PI * 2; this.wobbleSpeed = Math.random() * 0.02 + 0.005;
        this.opacity = Math.random() * 0.8 + 0.2; const colors = ['#f59e0b', '#ef4444', '#b45309', '#78350f'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }
      update() {
        this.y -= this.speedY; this.x += Math.sin(this.wobble) * 0.3; this.wobble += this.wobbleSpeed; this.opacity -= 0.001;
        if (this.y < -50 || this.opacity <= 0) { this.y = canvas!.height + 20; this.x = Math.random() * canvas!.width; this.opacity = 1; }
      }
      draw() {
        if (!ctx) return; ctx.save(); ctx.globalAlpha = this.opacity; ctx.fillStyle = this.color; ctx.shadowBlur = 6; ctx.shadowColor = '#b91c1c';
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
    }

    class BambooLeaf {
      x: number; y: number; size: number; speedX: number; speedY: number; rotation: number; rotationSpeed: number; sway: number; swaySpeed: number;
      constructor() {
        this.x = Math.random() * canvas!.width; this.y = Math.random() * -canvas!.height; this.size = Math.random() * 8 + 4;
        this.speedX = Math.random() * 0.2 - 0.1; // Reduced wind
        this.speedY = Math.random() * 0.6 + 0.3; // Gentle fall
        this.rotation = Math.random() * 360;
        this.rotationSpeed = (Math.random() - 0.5) * 0.3; 
        this.sway = Math.random() * Math.PI * 2;
        this.swaySpeed = 0.01 + Math.random() * 0.015;
      }
      update() {
        this.sway += this.swaySpeed; 
        // Reduced sway amplitude from 0.5 to 0.2 for more natural drift
        this.x += Math.sin(this.sway) * 0.2 + this.speedX; 
        this.y += this.speedY; 
        // Oscillating rotation creates a "rocking" falling leaf effect
        this.rotation += this.rotationSpeed + Math.cos(this.sway) * 0.15;
        
        if (this.y > canvas!.height + 20) { this.y = -20; this.x = Math.random() * canvas!.width; }
      }
      draw() {
        if (!ctx) return; ctx.save(); ctx.translate(this.x, this.y); ctx.rotate((this.rotation * Math.PI) / 180);
        ctx.fillStyle = '#86efac'; ctx.globalAlpha = 0.4; ctx.beginPath(); ctx.ellipse(0, 0, this.size / 3, this.size, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
    }

    class Bubble {
      x: number; y: number; size: number; speedY: number; sway: number; swayOffset: number; opacity: number;
      constructor() {
        this.x = Math.random() * canvas!.width; this.y = canvas!.height + Math.random() * 100; this.size = Math.random() * 4 + 1;
        this.speedY = Math.random() * 0.5 + 0.1; // Very slow bubbles
        this.sway = 0; this.swayOffset = Math.random() * Math.PI * 2; this.opacity = Math.random() * 0.3 + 0.1;
      }
      update() {
        this.sway += 0.01; this.y -= this.speedY; this.x += Math.sin(this.sway + this.swayOffset) * 0.2;
        if (this.y < -20) { this.y = canvas!.height + 20; this.x = Math.random() * canvas!.width; }
      }
      draw() {
        if (!ctx) return; ctx.save(); ctx.strokeStyle = '#fff'; ctx.fillStyle = '#a5f3fc'; ctx.lineWidth = 1; ctx.globalAlpha = this.opacity;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.stroke(); ctx.fill();
        ctx.globalAlpha = this.opacity + 0.2; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(this.x - this.size*0.3, this.y - this.size*0.3, this.size*0.2, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
    }

    class Star {
      x: number; y: number; size: number; maxAlpha: number; alpha: number; flickerSpeed: number; flickerDir: number;
      constructor() {
        this.x = Math.random() * canvas!.width; this.y = Math.random() * canvas!.height; this.size = Math.random() * 2;
        this.maxAlpha = Math.random() * 0.8 + 0.2; this.alpha = Math.random() * this.maxAlpha; 
        this.flickerSpeed = Math.random() * 0.01 + 0.002; // Slower flicker
        this.flickerDir = 1;
      }
      update() {
        this.alpha += this.flickerSpeed * this.flickerDir;
        if (this.alpha >= this.maxAlpha) { this.alpha = this.maxAlpha; this.flickerDir = -1; } else if (this.alpha <= 0.1) { this.alpha = 0.1; this.flickerDir = 1; this.x = Math.random() * canvas!.width; this.y = Math.random() * canvas!.height; }
      }
      draw() {
        if (!ctx) return; ctx.save(); ctx.fillStyle = '#e9d5ff'; ctx.globalAlpha = this.alpha; ctx.shadowBlur = this.size * 2; ctx.shadowColor = '#fff';
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
    }

    class SandParticle {
      x: number; y: number; size: number; speedX: number; opacity: number;
      constructor() {
        this.x = Math.random() * canvas!.width; this.y = Math.random() * canvas!.height; this.size = Math.random() * 2 + 0.5;
        this.speedX = Math.random() * 1.5 + 0.5; // Slow drift
        this.opacity = Math.random() * 0.3 + 0.1;
      }
      update() { this.x += this.speedX; if (this.x > canvas!.width) { this.x = -10; this.y = Math.random() * canvas!.height; } }
      draw() {
        if (!ctx) return; ctx.save(); ctx.fillStyle = '#fde68a'; ctx.globalAlpha = this.opacity; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
    }

    class SnowParticle {
      x: number; y: number; size: number; speedY: number; sway: number; swaySpeed: number;
      constructor() {
        this.x = Math.random() * canvas!.width; this.y = Math.random() * -canvas!.height; this.size = Math.random() * 3 + 1;
        this.speedY = Math.random() * 0.5 + 0.2; // Gentle snow
        this.sway = Math.random() * Math.PI * 2; this.swaySpeed = Math.random() * 0.02 + 0.005;
      }
      update() {
        this.y += this.speedY; this.sway += this.swaySpeed; 
        // Reduced sway amplitude for snow as well
        this.x += Math.sin(this.sway) * 0.3;
        if (this.y > canvas!.height) { this.y = -10; this.x = Math.random() * canvas!.width; }
      }
      draw() {
        if (!ctx) return; ctx.save(); ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 0.6; ctx.shadowBlur = 4; ctx.shadowColor = '#fff';
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
    }

    class BinaryParticle {
      x: number; y: number; speedY: number; value: string; fontSize: number; opacity: number;
      constructor() {
        this.x = Math.floor(Math.random() * (canvas!.width / 15)) * 15; this.y = Math.random() * -canvas!.height;
        this.speedY = Math.random() * 1.0 + 0.5; // Slower matrix rain
        this.value = Math.random() > 0.5 ? '1' : '0';
        this.fontSize = Math.random() * 10 + 10; this.opacity = Math.random() * 0.5 + 0.1;
      }
      update() {
        this.y += this.speedY; if (Math.random() > 0.98) { this.value = this.value === '1' ? '0' : '1'; }
        if (this.y > canvas!.height) { this.y = -20; this.x = Math.floor(Math.random() * (canvas!.width / 15)) * 15; this.speedY = Math.random() * 1.0 + 0.5; }
      }
      draw() {
        if (!ctx) return; ctx.save(); ctx.fillStyle = '#22d3ee'; ctx.font = `${this.fontSize}px monospace`; ctx.globalAlpha = this.opacity;
        ctx.fillText(this.value, this.x, this.y); ctx.restore();
      }
    }

    class InkDrop {
      x: number; y: number; radius: number; maxRadius: number; opacity: number; growthRate: number;
      constructor() {
        this.x = Math.random() * canvas!.width; this.y = Math.random() * canvas!.height; this.radius = 0;
        this.maxRadius = Math.random() * 100 + 50; this.opacity = Math.random() * 0.05 + 0.02; 
        this.growthRate = Math.random() * 0.2 + 0.05; // Slow spread
      }
      update() {
        this.radius += this.growthRate; if (this.radius > this.maxRadius) { this.opacity -= 0.0002; }
        if (this.opacity <= 0) { this.x = Math.random() * canvas!.width; this.y = Math.random() * canvas!.height; this.radius = 0; this.opacity = Math.random() * 0.05 + 0.02; }
      }
      draw() {
        if (!ctx) return; ctx.save(); ctx.fillStyle = theme === Theme.Day ? '#000' : '#fff'; ctx.globalAlpha = this.opacity;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
    }

    class RuneParticle {
      x: number; y: number; char: string; size: number; rotation: number; rotSpeed: number; vy: number;
      constructor() {
        this.x = Math.random() * canvas!.width; this.y = canvas!.height + Math.random() * 20;
        const runes = ['⚙', '⚗', '⚡', '⌬', '⚔', '⏣'];
        this.char = runes[Math.floor(Math.random()*runes.length)];
        this.size = Math.random() * 15 + 10;
        this.rotation = Math.random() * Math.PI*2;
        this.rotSpeed = (Math.random()-0.5)*0.02;
        this.vy = Math.random() * -0.5 - 0.2; // Slow rise
      }
      update() {
        this.y += this.vy; this.rotation += this.rotSpeed;
        if(this.y < -30) { this.y = canvas!.height + 20; this.x = Math.random() * canvas!.width; }
      }
      draw() {
        if (!ctx) return; 
        ctx.save();
        ctx.translate(this.x, this.y); 
        ctx.rotate(this.rotation);
        
        if (runeCache[this.char]) {
           const cache = runeCache[this.char];
           ctx.drawImage(cache, -this.size/2, -this.size/2, this.size, this.size);
        } else {
           ctx.fillStyle = '#b45309';
           ctx.shadowColor = '#d97706'; ctx.shadowBlur = 5;
           ctx.font = `${this.size}px serif`;
           ctx.fillText(this.char, -this.size/2, this.size/2);
        }
        ctx.restore();
      }
    }

    class AuroraParticle {
      x: number; y: number; life: number;
      constructor() { this.x = Math.random()*canvas!.width; this.y = Math.random()*canvas!.height; this.life = Math.random(); }
      update() { this.life -= 0.002; if(this.life<=0) { this.life=1; this.x=Math.random()*canvas!.width; this.y=Math.random()*canvas!.height; } }
      draw() {
        if (!ctx) return;
        ctx.fillStyle = `rgba(134, 239, 172, ${this.life * 0.1})`;
        ctx.beginPath(); ctx.arc(this.x, this.y, 50, 0, Math.PI*2); ctx.fill();
      }
    }

    // --- New Feather Particle for Celestia ---
    class Feather {
      x: number; y: number; size: number; speedY: number; sway: number; swaySpeed: number; rotation: number; rotSpeed: number; opacity: number;
      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        this.size = Math.random() * 10 + 5;
        this.speedY = Math.random() * 0.4 + 0.1; // Drifting
        this.sway = Math.random() * Math.PI * 2;
        this.swaySpeed = Math.random() * 0.01 + 0.005;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.01;
        this.opacity = Math.random() * 0.5 + 0.3;
      }
      update() {
        this.y += this.speedY;
        this.sway += this.swaySpeed;
        this.x += Math.sin(this.sway) * 0.3; // Reduced amplitude
        this.rotation += this.rotSpeed;
        if (this.y > canvas!.height + 20) {
          this.y = -20;
          this.x = Math.random() * canvas!.width;
        }
      }
      draw() {
        if (!ctx) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = this.opacity;
        
        // Draw Feather
        ctx.fillStyle = '#fff'; 
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#fbbf24'; // Gold glow
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size, this.size/3, 0, 0, Math.PI*2);
        ctx.fill();
        
        // Quill
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-this.size, 0);
        ctx.lineTo(this.size, 0);
        ctx.stroke();
        
        ctx.restore();
      }
    }

    // --- Init ---
    
    const initParticles = () => {
      particles = [];
      const mobile = window.innerWidth < 768;
      let count = mobile ? 40 : 100;
      
      for (let i = 0; i < count; i++) {
        if (skin === Skin.Dragon) particles.push(new GoldenEmber());
        else if (skin === Skin.Forest) particles.push(new BambooLeaf());
        else if (skin === Skin.Ocean) particles.push(new Bubble());
        else if (skin === Skin.Nebula) particles.push(new Star());
        else if (skin === Skin.Sakura) particles.push(new Sakura(true));
        else if (skin === Skin.Sunset) particles.push(new SandParticle());
        else if (skin === Skin.Glacier) particles.push(new SnowParticle());
        else if (skin === Skin.Cyber) particles.push(new BinaryParticle());
        else if (skin === Skin.Ink) { if (i % 5 === 0) particles.push(new InkDrop()); }
        else if (skin === Skin.Alchemy) particles.push(new RuneParticle());
        else if (skin === Skin.Aurora) particles.push(new AuroraParticle());
        else if (skin === Skin.Celestia) particles.push(new Feather());
        else if (theme === Theme.Day) particles.push(new Sakura(false));
        else particles.push(new Firefly());
      }
    };

    initParticles();

    // --- Animation Loop ---

    let t = 0;
    const animate = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t += 0.002; // Slower time evolution for gradients

      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);

      if (skin === Skin.Dragon) {
        gradient.addColorStop(0, '#0f0202'); gradient.addColorStop(0.5, '#2b0a0a'); gradient.addColorStop(1, '#450a0a'); 
      } else if (skin === Skin.Forest) {
        gradient.addColorStop(0, '#022c22'); gradient.addColorStop(1, '#14532d'); 
      } else if (skin === Skin.Ocean) {
        gradient.addColorStop(0, '#020617'); gradient.addColorStop(1, '#0c4a6e'); 
      } else if (skin === Skin.Sakura) {
        gradient.addColorStop(0, '#fff1f2'); gradient.addColorStop(1, '#fda4af'); 
      } else if (skin === Skin.Nebula) {
        gradient.addColorStop(0, '#020617'); gradient.addColorStop(0.5, '#1e1b4b'); gradient.addColorStop(1, '#4c1d95'); 
      } else if (skin === Skin.Sunset) {
        gradient.addColorStop(0, '#2e1065'); gradient.addColorStop(0.4, '#c2410c'); gradient.addColorStop(1, '#78350f'); 
      } else if (skin === Skin.Glacier) {
        gradient.addColorStop(0, '#1e3a8a'); gradient.addColorStop(0.6, '#3b82f6'); gradient.addColorStop(1, '#dbeafe'); 
      } else if (skin === Skin.Cyber) {
        if (theme === Theme.Day) { gradient.addColorStop(0, '#f1f5f9'); gradient.addColorStop(1, '#cbd5e1'); } 
        else { gradient.addColorStop(0, '#020617'); gradient.addColorStop(1, '#0f172a'); }
      } else if (skin === Skin.Ink) {
        if (theme === Theme.Day) { gradient.addColorStop(0, '#fafaf9'); gradient.addColorStop(1, '#e7e5e4'); } 
        else { gradient.addColorStop(0, '#0c0a09'); gradient.addColorStop(1, '#1c1917'); }
      } else if (skin === Skin.Alchemy) {
        gradient.addColorStop(0, '#271c19'); gradient.addColorStop(0.5, '#43302b'); gradient.addColorStop(1, '#57534e');
      } else if (skin === Skin.Aurora) {
        const shift = Math.sin(t) * 0.2;
        gradient.addColorStop(0, '#020617'); 
        gradient.addColorStop(0.3 + shift, '#064e3b'); 
        gradient.addColorStop(0.5, '#0c4a6e');
        gradient.addColorStop(0.7 - shift, '#4c1d95');
        gradient.addColorStop(1, '#020617');
      } else if (skin === Skin.Celestia) {
        // Heavenly white/gold/blue
        gradient.addColorStop(0, '#f0f9ff');
        gradient.addColorStop(0.5, '#e0f2fe');
        gradient.addColorStop(1, '#fef9c3');
      } else if (theme === Theme.Day) {
        gradient.addColorStop(0, '#fdfbf7'); gradient.addColorStop(1, '#e3e8f0'); 
      } else {
        gradient.addColorStop(0, '#0f172a'); gradient.addColorStop(1, '#1e1b4b'); 
      }
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => { p.update(); p.draw(); });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme, skin]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full -z-10 transition-opacity duration-1000"
    />
  );
};

export default Background;
