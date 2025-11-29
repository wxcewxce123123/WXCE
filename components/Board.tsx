
import React, { useState, useEffect, useRef } from 'react';
import { Player, Theme, Skin } from '../types';
import { BOARD_SIZE } from '../utils/gameLogic';

interface BoardProps {
  board: Player[][];
  onCellClick: (row: number, col: number) => void;
  winningLine: number[][] | null;
  theme: Theme;
  skin: Skin;
  currentPlayer: Player;
  isGameOver: boolean;
  lastMove: {r: number, c: number} | null;
  hintPos: {r: number, c: number} | null;
  undoTrigger: {r: number, c: number, ts: number}[] | null;
}

const Board: React.FC<BoardProps> = ({ 
  board, 
  onCellClick, 
  winningLine, 
  theme, 
  skin, 
  currentPlayer,
  isGameOver,
  lastMove,
  hintPos,
  undoTrigger
}) => {
  const [hoverPos, setHoverPos] = useState<{r: number, c: number} | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const placementParticlesRef = useRef<any[]>([]);
  const victoryParticlesRef = useRef<any[]>([]);

  // --- Procedural Texture Definitions (SVG Filters) ---
  const TEXTURES = {
    wood: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='wood'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.05 0.005' numOctaves='2' seed='2'/%3E%3CfeDisplacementMap in='SourceGraphic' scale='10'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23wood)' opacity='0.3' style='mix-blend-mode: multiply'/%3E%3C/svg%3E")`,
    stone: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.15'/%3E%3C/svg%3E")`,
    paper: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paper'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23paper)' opacity='0.1'/%3E%3C/svg%3E")`,
    ice: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='ice'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.03' numOctaves='2'/%3E%3CfeColorMatrix values='1 0 0 0 0.8  0 1 0 0 0.9  0 0 1 0 1  0 0 0 1 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23ice)' opacity='0.25'/%3E%3C/svg%3E")`,
    sand: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='sand'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.5' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23sand)' opacity='0.2'/%3E%3C/svg%3E")`,
    marble: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='marble'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.01' numOctaves='2'/%3E%3CfeDisplacementMap scale='20'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23marble)' opacity='0.15'/%3E%3C/svg%3E")`,
    magma: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='magma'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.01' numOctaves='3' seed='5'/%3E%3CfeColorMatrix type='matrix' values='1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23magma)' opacity='0.3'/%3E%3C/svg%3E")`,
    grid: `linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)`
  };

  // --- Trigger Placement Particles ---
  useEffect(() => {
    if (lastMove && !isGameOver) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const cellSize = rect.width / BOARD_SIZE;
      
      const x = lastMove.c * cellSize + cellSize / 2;
      const y = lastMove.r * cellSize + cellSize / 2;

      // Spawn burst
      const count = 12;
      for(let i=0; i<count; i++) {
        let color = '#fff';
        if (skin === Skin.Cyber) color = '#0ff';
        else if (skin === Skin.Dragon) color = '#f59e0b';
        else if (skin === Skin.Ink) color = '#000';
        else if (skin === Skin.Forest) color = '#4ade80';
        else if (skin === Skin.Sakura) color = '#fda4af';
        else if (skin === Skin.Sunset) color = '#fcd34d';
        else if (skin === Skin.Ocean) color = '#38bdf8';
        else if (skin === Skin.Nebula) color = '#a78bfa';

        placementParticlesRef.current.push({
          x, y,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8,
          life: 1.0,
          color,
          size: Math.random() * 3 + 1,
          type: 'burst'
        });
      }
    }
  }, [lastMove, isGameOver, skin]);

  // --- Trigger Undo Particles ---
  useEffect(() => {
    if (undoTrigger) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const cellSize = rect.width / BOARD_SIZE;

      undoTrigger.forEach(move => {
        const x = move.c * cellSize + cellSize / 2;
        const y = move.r * cellSize + cellSize / 2;
        const count = 15;
        
        for(let i=0; i<count; i++) {
           let color = '#fff';
           let type = 'smoke';
           let vx = (Math.random() - 0.5) * 4;
           let vy = (Math.random() - 0.5) * 4;
           let size = Math.random() * 4 + 2;
           
           if (skin === Skin.Dragon) {
              color = '#444'; // Ash
              type = 'smoke';
              vy = -Math.random() * 2 - 1; // Rise
           } else if (skin === Skin.Cyber) {
              color = Math.random() > 0.5 ? '#0ff' : '#f0f';
              type = 'pixel'; // Will draw squares
              vx = (Math.random() - 0.5) * 10;
              vy = (Math.random() - 0.5) * 10;
           } else if (skin === Skin.Glacier) {
              color = '#e0f2fe';
              type = 'shard'; // Triangles
           } else if (skin === Skin.Forest) {
              color = '#5D4037'; // Dried leaf
              type = 'leaf';
           } else if (skin === Skin.Ocean) {
              color = '#bae6fd';
              type = 'bubble';
           } else if (skin === Skin.Sakura) {
              color = '#fda4af';
              type = 'petal';
           } else if (skin === Skin.Sunset) {
              color = '#d97706';
              type = 'sand';
           } else if (skin === Skin.Ink) {
              color = '#000';
              type = 'ink';
           } else if (skin === Skin.Nebula) {
              color = '#4c1d95';
              type = 'implode'; 
           }
           
           placementParticlesRef.current.push({
              x, y, vx, vy, life: 1.0, color, size, type
           });
        }
      });
    }
  }, [undoTrigger, skin]);


  // --- Combined Effect Loop (Victory + Placement + Undo) ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas scaling
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    let animationId: number;
    let frame = 0;
    
    // Animation control
    const startTime = Date.now();
    const ACTIVE_DURATION = 3000;

    // Victory Line Points
    let points: {x: number, y: number}[] = [];
    if (winningLine) {
      points = winningLine.map(([r, c]) => ({
        x: (c * rect.width) / BOARD_SIZE + (rect.width / BOARD_SIZE) / 2,
        y: (r * rect.height) / BOARD_SIZE + (rect.height / BOARD_SIZE) / 2
      }));
    }

    // --- Particle Logic ---
    class GameParticle {
      x: number; y: number; vx: number; vy: number; life: number; size: number; color: string; type: string;
      constructor(x: number, y: number, type: string) {
        this.x = x + (Math.random() - 0.5) * 10;
        this.y = y + (Math.random() - 0.5) * 10;
        this.life = 1;
        this.type = type;
        
        switch(type) {
           case 'ember': // Dragon
             this.vx = (Math.random() - 0.5) * 2;
             this.vy = Math.random() * -3 - 1;
             this.size = Math.random() * 4 + 2;
             this.color = '#fbbf24';
             break;
           case 'leaf': // Forest
             this.vx = (Math.random() - 0.5) * 3;
             this.vy = Math.random() * 2 + 1;
             this.size = Math.random() * 6 + 2;
             this.color = Math.random() > 0.5 ? '#4ade80' : '#166534';
             break;
           case 'bubble': // Ocean
             this.vx = (Math.random() - 0.5) * 1;
             this.vy = Math.random() * -2 - 1;
             this.size = Math.random() * 5 + 2;
             this.color = 'rgba(125, 211, 252, 0.6)';
             break;
           case 'petal': // Sakura
             this.vx = (Math.random() - 0.5) * 3;
             this.vy = Math.random() * 1 + 0.5;
             this.size = Math.random() * 5 + 3;
             this.color = '#fda4af';
             break;
           case 'star': // Nebula
             const angle = Math.random() * Math.PI * 2;
             const speed = Math.random() * 3 + 1;
             this.vx = Math.cos(angle) * speed;
             this.vy = Math.sin(angle) * speed;
             this.size = Math.random() * 3 + 1;
             this.color = '#fff';
             break;
           case 'sand': // Sunset
             this.vx = Math.random() * 4 + 2;
             this.vy = (Math.random() - 0.5) * 1;
             this.size = Math.random() * 3 + 1;
             this.color = '#fcd34d';
             break;
           case 'shard': // Glacier
             this.vx = (Math.random() - 0.5) * 2;
             this.vy = Math.random() * 3 + 2;
             this.size = Math.random() * 4 + 2;
             this.color = '#fff';
             break;
           case 'digit': // Cyber
             this.vx = 0;
             this.vy = Math.random() * 2 + 2;
             this.size = 12;
             this.color = '#0ff';
             break;
           case 'ink': // Ink
             this.vx = (Math.random() - 0.5) * 1;
             this.vy = (Math.random() - 0.5) * 1;
             this.size = Math.random() * 10 + 5;
             this.color = '#000';
             break;
           default: // Classic/Confetti
             this.vx = (Math.random() - 0.5) * 5;
             this.vy = (Math.random() - 0.5) * 5;
             this.size = Math.random() * 5 + 3;
             this.color = `hsl(${Math.random()*360}, 100%, 50%)`;
        }
      }

      update() {
         this.x += this.vx;
         this.y += this.vy;
         this.life -= 0.02;
         if (this.type === 'digit') {
            if (Math.random() > 0.9) this.color = '#fff';
            else this.color = '#0ff';
         }
         if (this.type !== 'ink') this.size *= 0.96;
      }

      draw(ctx: CanvasRenderingContext2D) {
         ctx.save();
         ctx.globalAlpha = Math.max(0, this.life);
         ctx.fillStyle = this.color;
         if (this.type === 'digit') {
            ctx.font = '10px monospace';
            ctx.fillText(Math.random() > 0.5 ? '1' : '0', this.x, this.y);
         } else if (this.type === 'shard') {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + this.size, this.y + this.size);
            ctx.lineTo(this.x - this.size, this.y + this.size);
            ctx.fill();
         } else if (this.type === 'leaf') {
             ctx.beginPath();
             ctx.ellipse(this.x, this.y, this.size, this.size/2, frame*0.1, 0, Math.PI*2);
             ctx.fill();
         } else {
            ctx.beginPath(); 
            ctx.arc(this.x, this.y, this.size, 0, Math.PI*2); 
            ctx.fill();
         }
         ctx.restore();
      }
    }

    const render = () => {
      frame++;
      const elapsed = Date.now() - startTime;
      const isActive = elapsed < ACTIVE_DURATION;

      ctx.clearRect(0, 0, rect.width, rect.height);
      
      // 1. Render Placement/Undo Particles (Transient)
      ctx.globalCompositeOperation = (skin === Skin.Ink || skin === Skin.Classic || skin === Skin.Forest) ? 'source-over' : 'lighter';
      for (let i = placementParticlesRef.current.length - 1; i >= 0; i--) {
        const p = placementParticlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.05;
        p.size *= 0.9;
        
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        
        // Draw shape based on type
        if (p.type === 'pixel') {
          ctx.fillRect(p.x, p.y, p.size, p.size);
        } else if (p.type === 'shard') {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y - p.size);
          ctx.lineTo(p.x + p.size, p.y + p.size);
          ctx.lineTo(p.x - p.size, p.y + p.size);
          ctx.fill();
        } else if (p.type === 'bubble') {
           ctx.beginPath();
           ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
           ctx.strokeStyle = p.color;
           ctx.lineWidth = 1;
           ctx.stroke();
        } else if (p.type === 'leaf') {
           ctx.beginPath();
           ctx.ellipse(p.x, p.y, p.size, p.size/2, p.x*0.1, 0, Math.PI*2);
           ctx.fill();
        } else {
           ctx.beginPath();
           ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
           ctx.fill();
        }

        if (p.life <= 0) placementParticlesRef.current.splice(i, 1);
      }

      // 2. Render Victory Effects
      if (winningLine && points.length > 0) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Spawn Particles during active phase
        if (isActive && frame % 2 === 0) {
           const randPoint = points[Math.floor(Math.random() * points.length)];
           let type = 'confetti';
           if (skin === Skin.Dragon) type = 'ember';
           if (skin === Skin.Forest) type = 'leaf';
           if (skin === Skin.Ocean) type = 'bubble';
           if (skin === Skin.Sakura) type = 'petal';
           if (skin === Skin.Nebula) type = 'star';
           if (skin === Skin.Sunset) type = 'sand';
           if (skin === Skin.Glacier) type = 'shard';
           if (skin === Skin.Cyber) type = 'digit';
           if (skin === Skin.Ink) type = 'ink';
           
           victoryParticlesRef.current.push(new GameParticle(randPoint.x, randPoint.y, type));
        }

        // Draw Line based on skin
        ctx.save();
        if (skin === Skin.Dragon) {
            ctx.shadowBlur = isActive ? 30 + Math.sin(frame * 0.2) * 10 : 15;
            ctx.shadowColor = '#f97316';
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 4;
            ctx.beginPath();
            points.forEach((p, i) => {
              const jitX = isActive ? (Math.random() - 0.5) * 5 : 0;
              const jitY = isActive ? (Math.random() - 0.5) * 5 : 0;
              if(i===0) ctx.moveTo(p.x+jitX, p.y+jitY);
              else ctx.lineTo(p.x+jitX, p.y+jitY);
            });
            ctx.stroke();
        } else if (skin === Skin.Cyber) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#0ff';
            ctx.strokeStyle = '#0ff';
            ctx.lineWidth = 3;
            if (isActive) ctx.setLineDash([Math.random()*20 + 10, Math.random()*10]);
            else ctx.setLineDash([]);
            ctx.beginPath();
            points.forEach((p, i) => { if(i===0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
            ctx.stroke();
        } else if (skin === Skin.Forest) {
            ctx.strokeStyle = '#4ade80';
            ctx.lineWidth = 6;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#166534';
            ctx.beginPath();
            // Bezier approximation for vine
            ctx.moveTo(points[0].x, points[0].y);
            for(let i=0; i<points.length-1; i++) {
               const midX = (points[i].x + points[i+1].x) / 2;
               const midY = (points[i].y + points[i+1].y) / 2;
               // Slight curve
               const cpX = midX + Math.sin(frame * 0.1 + i) * 10;
               const cpY = midY + Math.cos(frame * 0.1 + i) * 10;
               ctx.quadraticCurveTo(cpX, cpY, points[i+1].x, points[i+1].y);
            }
            ctx.stroke();
        } else if (skin === Skin.Ink) {
             ctx.strokeStyle = '#000';
             ctx.lineWidth = 8 + Math.sin(frame*0.1)*2;
             ctx.globalAlpha = 0.8;
             ctx.beginPath();
             points.forEach((p, i) => { if(i===0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
             ctx.stroke();
        } else if (skin === Skin.Glacier) {
             ctx.strokeStyle = '#fff';
             ctx.shadowColor = '#bae6fd';
             ctx.shadowBlur = 15;
             ctx.lineWidth = 4;
             ctx.beginPath();
             points.forEach((p, i) => { if(i===0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
             ctx.stroke();
             // Inner ice crack
             ctx.strokeStyle = '#bae6fd';
             ctx.lineWidth = 2;
             ctx.beginPath();
             points.forEach((p, i) => { 
                const jx = (Math.random()-0.5)*4;
                const jy = (Math.random()-0.5)*4;
                if(i===0) ctx.moveTo(p.x+jx, p.y+jy); else ctx.lineTo(p.x+jx, p.y+jy); 
             });
             ctx.stroke();
        } else {
            // General Glow Line (Sunset, Ocean, Sakura, Nebula, Classic)
            let color = '#fff';
            if (skin === Skin.Ocean) color = '#38bdf8';
            if (skin === Skin.Sakura) color = '#fda4af';
            if (skin === Skin.Nebula) color = '#c084fc';
            if (skin === Skin.Sunset) color = '#fcd34d';
            if (skin === Skin.Classic) color = '#fbbf24';

            ctx.shadowBlur = 20;
            ctx.shadowColor = color;
            ctx.strokeStyle = color;
            ctx.lineWidth = 5;
            ctx.beginPath();
            points.forEach((p, i) => { if(i===0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
            ctx.stroke();
        }
        ctx.restore();

        // Update & Draw Victory Particles
        for (let i = victoryParticlesRef.current.length - 1; i >= 0; i--) {
          const vp = victoryParticlesRef.current[i];
          vp.update();
          vp.draw(ctx);
          if (vp.life <= 0) victoryParticlesRef.current.splice(i, 1);
        }
      }

      // Keep loop running if there are active particles or victory line
      if (winningLine || placementParticlesRef.current.length > 0 || victoryParticlesRef.current.length > 0) {
         animationId = requestAnimationFrame(render);
      }
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [winningLine, skin, lastMove, undoTrigger]); 


  // --- Styles ---

  const getBoardStyles = () => {
    let styles: React.CSSProperties = {
      position: 'relative',
      borderRadius: '8px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      backgroundBlendMode: 'overlay'
    };

    switch (skin) {
      case Skin.Classic:
        styles.backgroundColor = theme === Theme.Day ? '#e6b36e' : '#5c3d22';
        styles.backgroundImage = TEXTURES.wood;
        styles.border = '12px solid #5d4037';
        break;
      case Skin.Forest:
        styles.backgroundColor = '#2f4f4f';
        styles.backgroundImage = TEXTURES.stone;
        styles.border = '12px solid #1a2f2f';
        break;
      case Skin.Ocean:
        styles.backgroundColor = '#001d3d';
        styles.backgroundImage = `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.05), transparent 70%), ${TEXTURES.marble}`; 
        styles.border = '8px solid #003566';
        break;
      case Skin.Sakura:
        styles.backgroundColor = '#fce7f3';
        styles.backgroundImage = TEXTURES.marble;
        styles.border = '12px solid #fbcfe8';
        break;
      case Skin.Nebula:
        styles.backgroundColor = '#1e1b4b';
        styles.backgroundImage = `radial-gradient(circle at center, transparent 0%, #000 100%), ${TEXTURES.stone}`;
        styles.border = '4px solid #4c1d95';
        break;
      case Skin.Sunset:
        styles.backgroundColor = '#9a3412';
        styles.backgroundImage = TEXTURES.sand;
        styles.border = '12px solid #7c2d12';
        break;
      case Skin.Glacier:
        styles.backgroundColor = '#dbeafe';
        styles.backgroundImage = TEXTURES.ice;
        styles.border = '8px solid #bfdbfe';
        styles.backdropFilter = 'blur(8px)';
        break;
      case Skin.Cyber:
        styles.backgroundColor = '#000';
        styles.backgroundImage = TEXTURES.grid;
        styles.backgroundSize = '40px 40px'; 
        styles.border = '2px solid #06b6d4';
        break;
      case Skin.Ink:
        styles.backgroundColor = theme === Theme.Day ? '#f5f5f4' : '#292524';
        styles.backgroundImage = TEXTURES.paper;
        styles.border = theme === Theme.Day ? '1px solid #a8a29e' : '1px solid #444';
        break;
      case Skin.Dragon:
      default:
        styles.backgroundColor = '#1a0500';
        styles.backgroundImage = `
          radial-gradient(circle at 50% 50%, rgba(255, 100, 0, 0.05) 0%, transparent 60%),
          repeating-linear-gradient(45deg, rgba(0,0,0,0.4) 0px, rgba(0,0,0,0.4) 2px, transparent 2px, transparent 8px),
          ${TEXTURES.magma}
        `;
        styles.border = '4px solid #451a03'; 
        break;
    }

    return styles;
  };

  const getLineColor = () => {
    switch (skin) {
      case Skin.Dragon: return '#d97706';
      case Skin.Forest: return '#a7f3d0';
      case Skin.Ocean: return '#38bdf8';
      case Skin.Sakura: return '#f43f5e';
      case Skin.Nebula: return '#c084fc';
      case Skin.Sunset: return '#fed7aa';
      case Skin.Glacier: return '#fff';
      case Skin.Cyber: return '#22d3ee';
      case Skin.Ink: return theme === Theme.Day ? '#444' : '#a8a29e';
      default: return theme === Theme.Night ? '#a16207' : '#5d4037';
    }
  };

  const getStoneStyle = (player: Player, isGhost = false) => {
    const isBlack = player === Player.Black;
    const baseClass = `absolute top-[10%] left-[10%] w-[80%] h-[80%] rounded-full transition-all duration-300 z-10 pointer-events-none ${isGhost ? 'opacity-40 scale-90' : 'opacity-100 stone-enter'}`;
    
    let style: React.CSSProperties = {};

    switch (skin) {
      case Skin.Classic:
        style.background = isBlack 
          ? 'radial-gradient(circle at 35% 35%, #555 0%, #111 40%, #000 100%)'
          : 'radial-gradient(circle at 35% 35%, #fff 0%, #e5e5e5 40%, #d4d4d4 100%)';
        break;
      case Skin.Forest:
        style.background = isBlack
          ? 'radial-gradient(circle at 30% 30%, #6ee7b7 0%, #047857 50%, #022c22 100%)'
          : 'radial-gradient(circle at 30% 30%, #fff 0%, #ecfccb 60%, #d9f99d 100%)';
        break;
      case Skin.Ocean:
        style.background = isBlack
          ? 'radial-gradient(circle at 35% 35%, #7dd3fc 0%, #0c4a6e 60%, #000 100%)'
          : 'radial-gradient(circle at 35% 35%, #fff 0%, #bae6fd 50%, #38bdf8 100%)';
        break;
      case Skin.Sakura:
        style.background = isBlack
          ? 'radial-gradient(circle at 35% 35%, #fca5a5 0%, #be123c 60%, #4c0519 100%)'
          : 'radial-gradient(circle at 35% 35%, #fff 0%, #fce7f3 40%, #fbcfe8 100%)';
        break;
      case Skin.Nebula:
        style.background = isBlack
          ? 'black'
          : 'radial-gradient(circle at 50% 50%, #fff 20%, #a78bfa 50%, #4c1d95 100%)';
        if (isBlack) style.border = '1px solid #7c3aed';
        break;
      case Skin.Sunset:
        style.background = isBlack
          ? 'linear-gradient(135deg, #444 0%, #111 100%)'
          : 'radial-gradient(circle at 30% 30%, #fcd34d 0%, #b45309 80%, #78350f 100%)';
        break;
      case Skin.Glacier:
        style.background = isBlack
          ? 'radial-gradient(circle at 30% 30%, #93c5fd 0%, #1e40af 100%)'
          : 'linear-gradient(135deg, #fff 0%, #dbeafe 50%, #bfdbfe 100%)';
        break;
      case Skin.Cyber:
        style.background = isBlack ? 'transparent' : '#22d3ee';
        if (isBlack) style.border = '2px solid #d946ef';
        break;
      case Skin.Ink:
        style.background = isBlack
          ? 'radial-gradient(circle at 40% 40%, #444 0%, #000 100%)'
          : '#f5f5f4';
        if (!isBlack) style.border = '1px solid #d6d3d1';
        break;
      case Skin.Dragon:
        style.background = isBlack
          ? 'radial-gradient(circle at 40% 40%, #444 0%, #111 60%, #000 100%)'
          : 'radial-gradient(circle at 35% 35%, #fff 0%, #fcd34d 40%, #d97706 100%)';
        break;
    }

    return { className: baseClass, style };
  };

  return (
    <div className={`p-1 sm:p-4 md:p-6 rounded-xl backdrop-blur-sm transition-colors duration-700 w-full flex justify-center ${
      skin === Skin.Dragon ? 'bg-black/80' : (theme === Theme.Day ? 'bg-white/20' : 'bg-black/20')
    }`}>
      
      {/* Board Frame */}
      <div 
        className="w-full max-w-[600px] aspect-square p-3 sm:p-6 md:p-8 relative"
        style={getBoardStyles()}
      >
        {/* Decorative Corners for Dragon */}
        {skin === Skin.Dragon && (
          <>
            <div className="absolute -top-1 -left-1 w-12 h-12 border-t-4 border-l-4 border-amber-500 rounded-tl-lg shadow-[0_0_10px_#f59e0b]" />
            <div className="absolute -top-1 -right-1 w-12 h-12 border-t-4 border-r-4 border-amber-500 rounded-tr-lg shadow-[0_0_10px_#f59e0b]" />
            <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-4 border-l-4 border-amber-500 rounded-bl-lg shadow-[0_0_10px_#f59e0b]" />
            <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-4 border-r-4 border-amber-500 rounded-br-lg shadow-[0_0_10px_#f59e0b]" />
          </>
        )}

        {/* Effect Canvas Layer (Top Most) */}
        <canvas 
          ref={canvasRef}
          className="absolute inset-0 z-30 pointer-events-none w-full h-full"
        />

        {/* Playing Grid Area */}
        <div 
          className="relative w-full h-full grid cursor-crosshair"
          style={{ 
            display: 'grid',
            gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`, 
            gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr)` 
          }}
          onMouseLeave={() => setHoverPos(null)}
        >
          
          {/* Guide Lines (Crosshair) on Hover */}
          {hoverPos && !isGameOver && (
             <>
               <div 
                 className="absolute w-full h-[1px] bg-white/30 z-0 pointer-events-none transition-all duration-75 ease-out"
                 style={{ top: `${(hoverPos.r * 100) / BOARD_SIZE + (50 / BOARD_SIZE)}%` }}
               />
               <div 
                 className="absolute h-full w-[1px] bg-white/30 z-0 pointer-events-none transition-all duration-75 ease-out"
                 style={{ left: `${(hoverPos.c * 100) / BOARD_SIZE + (50 / BOARD_SIZE)}%` }}
               />
             </>
          )}

          {/* Grid Lines Layer */}
          <div className={`absolute inset-0 pointer-events-none z-0 transition-opacity duration-1000 ${winningLine ? 'opacity-30' : 'opacity-80'}`}>
             {Array.from({ length: BOARD_SIZE }).map((_, i) => (
               <React.Fragment key={i}>
                 <div 
                   className="absolute h-[1px] w-full transform -translate-y-1/2"
                   style={{ 
                     backgroundColor: getLineColor(),
                     top: `${(i * 100) / BOARD_SIZE + (50 / BOARD_SIZE)}%`
                   }} 
                 />
                 <div 
                   className="absolute w-[1px] h-full transform -translate-x-1/2" 
                   style={{ 
                     backgroundColor: getLineColor(),
                     left: `${(i * 100) / BOARD_SIZE + (50 / BOARD_SIZE)}%`
                   }} 
                 />
               </React.Fragment>
             ))}
             
             {/* Star Points */}
             {[3, 7, 11].map(r => [3, 7, 11].map(c => (
                <div 
                  key={`star-${r}-${c}`}
                  className="absolute w-1.5 h-1.5 rounded-full transform -translate-x-1/2 -translate-y-1/2 z-0"
                  style={{ 
                    top: `${(r * 100) / BOARD_SIZE + (50 / BOARD_SIZE)}%`,
                    left: `${(c * 100) / BOARD_SIZE + (50 / BOARD_SIZE)}%`,
                    backgroundColor: getLineColor()
                  }}
                />
             )))}
          </div>

          {/* AI Hint Visualization */}
          {hintPos && !isGameOver && (
            <div 
              className="absolute z-20 pointer-events-none w-full h-full transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
              style={{
                top: `${(hintPos.r * 100) / BOARD_SIZE + (50 / BOARD_SIZE)}%`,
                left: `${(hintPos.c * 100) / BOARD_SIZE + (50 / BOARD_SIZE)}%`,
                width: `${100/BOARD_SIZE}%`,
                height: `${100/BOARD_SIZE}%`
              }}
            >
              <div className="w-[150%] h-[150%] rounded-full border-2 border-white/80 animate-[ping_1.5s_ease-in-out_infinite] opacity-70" />
              <div className="absolute w-2 h-2 bg-white rounded-full shadow-[0_0_10px_#fff]" />
            </div>
          )}

          {/* Stones */}
          {board.map((row, r) => (
            row.map((cellState, c) => {
              const showGhost = !isGameOver && cellState === Player.None && hoverPos?.r === r && hoverPos?.c === c;
              const stoneProps = cellState !== Player.None ? getStoneStyle(cellState) : null;
              const ghostProps = showGhost ? getStoneStyle(currentPlayer, true) : null;
              
              const isWinner = winningLine?.some(([wr, wc]) => wr === r && wc === c);
              // Loser logic: if game won, and this stone is present but not winner.
              const isLoser = winningLine && !isWinner && cellState !== Player.None;
              const isLastMove = lastMove?.r === r && lastMove?.c === c && !isGameOver && !winningLine;

              let finalClassName = stoneProps ? stoneProps.className : '';
              let finalStyle = stoneProps ? { ...stoneProps.style } : {};

              if (isWinner) {
                finalClassName += ' z-20 transition-transform duration-500 scale-110';
                finalStyle.boxShadow = `0 0 20px ${skin === Skin.Dragon ? '#f59e0b' : '#fff'}`;
              } else if (isLoser) {
                // Unique Defeat Styles per Skin
                if (skin === Skin.Dragon) finalClassName += ' brightness-[0.2] grayscale contrast-150'; // Ash
                else if (skin === Skin.Glacier) finalClassName += ' brightness-[1.5] opacity-50 contrast-50 hue-rotate-180'; // Frozen
                else if (skin === Skin.Forest) finalClassName += ' grayscale brightness-[0.4] sepia-[0.5]'; // Petrification
                else if (skin === Skin.Cyber) finalClassName += ' opacity-30 hue-rotate-90 blur-[1px]'; // Glitch dim
                else if (skin === Skin.Ink) finalClassName += ' opacity-20 blur-sm'; // Dry ink
                else finalClassName += ' grayscale opacity-40 blur-[1px]'; // Generic
                
                finalClassName += ' transition-all duration-1000';
              }

              return (
                <div 
                  key={`${r}-${c}`}
                  className="relative z-10 w-full h-full cursor-pointer"
                  onClick={() => !isGameOver && onCellClick(r, c)}
                  onMouseEnter={() => setHoverPos({r, c})}
                >
                  {cellState !== Player.None && stoneProps && (
                    <div 
                      className={finalClassName} 
                      style={finalStyle}
                    >
                      {/* Last Move Marker */}
                      {isLastMove && (
                        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] rounded-full opacity-80 ${
                          cellState === Player.Black ? 'bg-white/50 shadow-[0_0_5px_#fff]' : 'bg-black/50 shadow-[0_0_5px_#000]'
                        } ${skin === Skin.Cyber ? 'bg-cyan-400 shadow-[0_0_10px_cyan]' : ''}`} />
                      )}
                    </div>
                  )}
                  {showGhost && ghostProps && (
                    <div 
                      className={ghostProps.className}
                      style={ghostProps.style} 
                    />
                  )}
                </div>
              );
            })
          ))}

        </div>
      </div>
    </div>
  );
};

export default Board;
