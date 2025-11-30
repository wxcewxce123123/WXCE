import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Player, Theme, Skin } from '../types';
import { BOARD_SIZE } from '../utils/gameLogic';

// --- Optimized Cell Component ---
interface BoardCellProps {
  r: number;
  c: number;
  cellState: Player;
  isHovered: boolean;
  isLastMove: boolean;
  isWinner: boolean;
  isLoser: boolean;
  isHint: boolean;
  skin: Skin;
  theme: Theme;
  currentPlayer: Player;
  onClick: (r: number, c: number) => void;
  onMouseEnter: (r: number, c: number) => void;
}

const BoardCell = React.memo(({ 
  r, c, cellState, isHovered, isLastMove, isWinner, isLoser, isHint, 
  skin, theme, currentPlayer, onClick, onMouseEnter 
}: BoardCellProps) => {

  const getStoneStyle = (player: Player, isGhost = false) => {
    const isBlack = player === Player.Black;
    const baseClass = `absolute top-[10%] left-[10%] w-[80%] h-[80%] rounded-full transition-all duration-300 z-10 pointer-events-none ${isGhost ? 'opacity-40 scale-90' : 'opacity-100 stone-enter'}`;
    let style: React.CSSProperties = {};
    
    switch (skin) {
      case Skin.Classic: style.background = isBlack ? 'radial-gradient(circle at 35% 35%, #555 0%, #111 40%, #000 100%)' : 'radial-gradient(circle at 35% 35%, #fff 0%, #e5e5e5 40%, #d4d4d4 100%)'; break;
      case Skin.Forest: style.background = isBlack ? 'radial-gradient(circle at 30% 30%, #6ee7b7 0%, #047857 50%, #022c22 100%)' : 'radial-gradient(circle at 30% 30%, #fff 0%, #ecfccb 60%, #d9f99d 100%)'; break;
      case Skin.Ocean: style.background = isBlack ? 'radial-gradient(circle at 35% 35%, #7dd3fc 0%, #0c4a6e 60%, #000 100%)' : 'radial-gradient(circle at 35% 35%, #fff 0%, #bae6fd 50%, #38bdf8 100%)'; break;
      case Skin.Sakura: style.background = isBlack ? 'radial-gradient(circle at 35% 35%, #fca5a5 0%, #be123c 60%, #4c0519 100%)' : 'radial-gradient(circle at 35% 35%, #fff 0%, #fce7f3 40%, #fbcfe8 100%)'; break;
      case Skin.Nebula: style.background = isBlack ? 'black' : 'radial-gradient(circle at 50% 50%, #fff 20%, #a78bfa 50%, #4c1d95 100%)'; if (isBlack) style.border = '1px solid #7c3aed'; break;
      case Skin.Sunset: style.background = isBlack ? 'linear-gradient(135deg, #444 0%, #111 100%)' : 'radial-gradient(circle at 30% 30%, #fcd34d 0%, #b45309 80%, #78350f 100%)'; break;
      case Skin.Glacier: style.background = isBlack ? 'radial-gradient(circle at 30% 30%, #93c5fd 0%, #1e40af 100%)' : 'linear-gradient(135deg, #fff 0%, #dbeafe 50%, #bfdbfe 100%)'; break;
      case Skin.Cyber: style.background = isBlack ? 'transparent' : '#22d3ee'; if (isBlack) style.border = '2px solid #d946ef'; else if (isBlack) style.border = '2px solid #888'; break;
      case Skin.Ink: style.background = isBlack ? 'radial-gradient(circle at 40% 40%, #444 0%, #000 100%)' : '#f5f5f4'; if (!isBlack) style.border = '1px solid #d6d3d1'; break;
      case Skin.Alchemy: style.background = isBlack ? 'radial-gradient(circle at 40% 40%, #57534e 0%, #292524 100%)' : 'radial-gradient(circle at 40% 40%, #fbbf24 0%, #b45309 100%)'; if(isBlack) style.border = '2px solid #a8a29e'; break;
      case Skin.Aurora: 
        if (isBlack) {
           style.backgroundColor = 'rgba(0,0,0,0.5)';
           style.border = '1px solid #22d3ee';
           style.boxShadow = '0 0 15px rgba(34, 211, 238, 0.6)';
        } else {
           style.backgroundColor = 'rgba(255,255,255,0.8)';
           style.boxShadow = '0 0 15px rgba(255, 255, 255, 0.8)';
        }
        break;
      case Skin.Dragon: style.background = isBlack ? 'radial-gradient(circle at 40% 40%, #444 0%, #111 60%, #000 100%)' : 'radial-gradient(circle at 35% 35%, #fff 0%, #fcd34d 40%, #d97706 100%)'; break;
    }
    return { className: baseClass, style };
  };

  const showGhost = isHovered && cellState === Player.None;
  const stoneProps = cellState !== Player.None ? getStoneStyle(cellState) : null;
  const ghostProps = showGhost ? getStoneStyle(currentPlayer, true) : null;

  let finalClassName = stoneProps ? stoneProps.className : '';
  let finalStyle = stoneProps ? { ...stoneProps.style } : {};

  if (isWinner) {
    finalClassName += ' z-20 transition-transform duration-500 scale-110';
    finalStyle.boxShadow = `0 0 20px ${skin === Skin.Dragon ? '#f59e0b' : '#fff'}`;
  } else if (isLoser) {
    if (skin === Skin.Dragon) finalClassName += ' brightness-[0.2] grayscale contrast-150';
    else if (skin === Skin.Glacier) finalClassName += ' brightness-[1.5] opacity-50 contrast-50 hue-rotate-180';
    else if (skin === Skin.Forest) finalClassName += ' grayscale brightness-[0.4] sepia-[0.5]';
    else if (skin === Skin.Cyber) finalClassName += ' opacity-30 hue-rotate-90 blur-[1px]';
    else if (skin === Skin.Ink) finalClassName += ' opacity-20 blur-sm';
    else if (skin === Skin.Alchemy) finalClassName += ' sepia brightness-[0.6]';
    else finalClassName += ' grayscale opacity-40 blur-[1px]';
    finalClassName += ' transition-all duration-1000';
  }

  return (
    <div 
      className="relative z-10 w-full h-full cursor-pointer" 
      onClick={() => onClick(r, c)} 
      onMouseEnter={() => onMouseEnter(r, c)}
    >
      {cellState !== Player.None && stoneProps && (
        <div className={finalClassName} style={finalStyle}>
          {isLastMove && (
            <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] rounded-full opacity-80 ${cellState === Player.Black ? 'bg-white/50' : 'bg-black/50'} ${cellState === Player.Black ? 'shadow-[0_0_5px_#fff]' : 'shadow-[0_0_5px_#000]'} ${skin === Skin.Cyber ? 'bg-cyan-400 shadow-[0_0_10px_cyan]' : ''}`} />
          )}
        </div>
      )}
      {showGhost && ghostProps && (
        <div className={ghostProps.className} style={ghostProps.style} />
      )}
      {isHint && (
        <div className="absolute z-20 pointer-events-none w-full h-full transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center top-1/2 left-1/2">
          <div className={`w-[150%] h-[150%] rounded-full border-2 border-white/80 animate-[ping_1.5s_ease-in-out_infinite] opacity-70 shadow-[0_0_10px_#fff]`} />
          <div className={`absolute w-2 h-2 bg-white rounded-full shadow-[0_0_10px_#fff]`} />
        </div>
      )}
    </div>
  );
});

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

const Board: React.FC<BoardProps> = React.memo(({ 
  board, 
  onCellClick, 
  winningLine, 
  theme, 
  skin, 
  currentPlayer,
  isGameOver,
  lastMove,
  hintPos,
  undoTrigger,
}) => {
  const [hoverPos, setHoverPos] = useState<{r: number, c: number} | null>(null);
  const [skinChanged, setSkinChanged] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const placementParticlesRef = useRef<any[]>([]);
  const victoryParticlesRef = useRef<any[]>([]);

  // 3D Tilt State
  const targetRotate = useRef({ x: 0, y: 0 });
  const currentRotate = useRef({ x: 0, y: 0 });

  // Stable handlers for Cell
  const handleCellClick = useCallback((r: number, c: number) => {
    if (!isGameOver) onCellClick(r, c);
  }, [isGameOver, onCellClick]);

  const handleMouseEnter = useCallback((r: number, c: number) => {
    setHoverPos({ r, c });
  }, []);

  // Trigger landing animation on skin change
  useEffect(() => {
    setSkinChanged(true);
    const t = setTimeout(() => setSkinChanged(false), 800);
    return () => clearTimeout(t);
  }, [skin]);

  // --- 3D Parallax Tilt Logic with Physics Damping ---
  useEffect(() => {
    let animationFrameId: number;

    const animateTilt = () => {
      if (boardRef.current) {
        const ease = 0.08;
        currentRotate.current.x += (targetRotate.current.x - currentRotate.current.x) * ease;
        currentRotate.current.y += (targetRotate.current.y - currentRotate.current.y) * ease;

        boardRef.current.style.setProperty('--rotate-x', `${currentRotate.current.x}deg`);
        boardRef.current.style.setProperty('--rotate-y', `${currentRotate.current.y}deg`);
      }
      animationFrameId = requestAnimationFrame(animateTilt);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      
      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;

      const maxDeg = 6;
      
      const percentX = deltaX / (window.innerWidth / 2);
      const percentY = deltaY / (window.innerHeight / 2);

      targetRotate.current.x = -percentY * maxDeg;
      targetRotate.current.y = percentX * maxDeg;

      if (boardRef.current) {
        const rect = boardRef.current.getBoundingClientRect();
        const localX = e.clientX - rect.left;
        const localY = e.clientY - rect.top;
        boardRef.current.style.setProperty('--mouse-x', `${(localX / rect.width) * 100}%`);
        boardRef.current.style.setProperty('--mouse-y', `${(localY / rect.height) * 100}%`);
      }
    };

    const handleMouseLeave = () => {
      targetRotate.current = { x: 0, y: 0 };
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    
    animateTilt();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // --- Procedural Texture Definitions (SVG Filters) ---
  const TEXTURES = {
    wood: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='wood'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.05 0.005' numOctaves='2' seed='2'/%3E%3CfeDisplacementMap in='SourceGraphic' scale='10'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23wood)' opacity='0.3' style='mix-blend-mode: multiply'/%3E%3C/svg%3E")`,
    stone: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.15'/%3E%3C/svg%3E")`,
    paper: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paper'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23paper)' opacity='0.1'/%3E%3C/svg%3E")`,
    ice: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='ice'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.03' numOctaves='2'/%3E%3CfeColorMatrix values='1 0 0 0 0.8  0 1 0 0 0.9  0 0 1 0 1  0 0 0 1 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23ice)' opacity='0.25'/%3E%3C/svg%3E")`,
    sand: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='sand'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.5' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23sand)' opacity='0.2'/%3E%3C/svg%3E")`,
    marble: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='marble'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.01' numOctaves='2'/%3E%3CfeDisplacementMap scale='20'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23marble)' opacity='0.15'/%3E%3C/svg%3E")`,
    magma: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='magma'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.01' numOctaves='3' seed='5'/%3E%3CfeColorMatrix type='matrix' values='1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23magma)' opacity='0.3'/%3E%3C/svg%3E")`,
    grid: `linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)`,
    metal: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='metal'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.2' numOctaves='2'/%3E%3CfeSpecularLighting surfaceScale='5' specularConstant='1' specularExponent='20' lighting-color='%23d97706'%3E%3CfePointLight x='-5000' y='-10000' z='20000'/%3E%3C/feSpecularLighting%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23metal)' opacity='0.2'/%3E%3C/svg%3E")`,
    aurora: `linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 100%)`
  };

  // --- Particle Effects (Placement & Undo & Victory) ---
  useEffect(() => {
    if (lastMove && !isGameOver) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const cellSize = rect.width / BOARD_SIZE;
      
      const x = lastMove.c * cellSize + cellSize / 2;
      const y = lastMove.r * cellSize + cellSize / 2;
      
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
        else if (skin === Skin.Alchemy) color = '#f59e0b';
        else if (skin === Skin.Aurora) color = '#22d3ee';

        placementParticlesRef.current.push({
          x: x, 
          y: y, 
          vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8, life: 1.0, color, size: Math.random() * 3 + 1, type: 'burst'
        });
      }
    }
  }, [lastMove, isGameOver, skin]);

  useEffect(() => {
    if (undoTrigger) {
       const canvas = canvasRef.current;
       if (!canvas) return;
       const rect = canvas.getBoundingClientRect();
       const cellSize = rect.width / BOARD_SIZE;

       undoTrigger.forEach(t => {
          const cx = t.c * cellSize + cellSize / 2;
          const cy = t.r * cellSize + cellSize / 2;
          
          for(let i=0; i<10; i++) {
             placementParticlesRef.current.push({ 
               x: cx, y: cy, 
               vx: (Math.random()-0.5)*5, vy: (Math.random()-0.5)*5, 
               life: 1, color: '#fff', size: 3, type: 'smoke' 
             });
          }
       });
    }
  }, [undoTrigger, skin]);

  // Combined Render Loop for Particles (Canvas)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    // Ensure canvas dimensions match the grid container
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
    }
    
    // Reset transform before drawing
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset scale
    ctx.scale(dpr, dpr);

    const cellSize = rect.width / BOARD_SIZE;

    let animationId: number;
    let frame = 0;
    
    // Recalculate Winning Line Points based on correct cellSize
    let points: {x: number, y: number}[] = [];
    if (winningLine) {
        points = winningLine.map(([r, c]) => ({
            x: c * cellSize + cellSize / 2,
            y: r * cellSize + cellSize / 2
        }));
    }

    // --- Inner Particle Class for Rendering ---
    class GameParticle {
      x: number; y: number; vx: number; vy: number; life: number; size: number; color: string; type: string;
      constructor(x: number, y: number, type: string) {
        this.x = x + (Math.random() - 0.5) * 10;
        this.y = y + (Math.random() - 0.5) * 10;
        this.life = 1;
        this.type = type;
        
        switch(type) {
           case 'ember': this.vx = (Math.random() - 0.5) * 2; this.vy = Math.random() * -3 - 1; this.size = Math.random() * 4 + 2; this.color = '#fbbf24'; break;
           case 'leaf': this.vx = (Math.random() - 0.5) * 3; this.vy = Math.random() * 2 + 1; this.size = Math.random() * 6 + 2; this.color = Math.random() > 0.5 ? '#4ade80' : '#166534'; break;
           case 'bubble': this.vx = (Math.random() - 0.5) * 1; this.vy = Math.random() * -2 - 1; this.size = Math.random() * 5 + 2; this.color = 'rgba(125, 211, 252, 0.6)'; break;
           case 'petal': this.vx = (Math.random() - 0.5) * 3; this.vy = Math.random() * 1 + 0.5; this.size = Math.random() * 5 + 3; this.color = '#fda4af'; break;
           case 'star': const angle = Math.random() * Math.PI * 2; const speed = Math.random() * 3 + 1; this.vx = Math.cos(angle) * speed; this.vy = Math.sin(angle) * speed; this.size = Math.random() * 3 + 1; this.color = '#fff'; break;
           case 'sand': this.vx = Math.random() * 4 + 2; this.vy = (Math.random() - 0.5) * 1; this.size = Math.random() * 3 + 1; this.color = '#fcd34d'; break;
           case 'shard': this.vx = (Math.random() - 0.5) * 2; this.vy = Math.random() * 3 + 2; this.size = Math.random() * 4 + 2; this.color = '#fff'; break;
           case 'digit': this.vx = 0; this.vy = Math.random() * 2 + 2; this.size = 12; this.color = '#0ff'; break;
           case 'ink': this.vx = (Math.random() - 0.5) * 1; this.vy = (Math.random() - 0.5) * 1; this.size = Math.random() * 10 + 5; this.color = '#000'; break;
           case 'cog': this.vx = (Math.random() - 0.5) * 2; this.vy = (Math.random() - 0.5) * 2; this.size = Math.random() * 5 + 3; this.color = '#b45309'; break;
           case 'glow': this.vx = 0; this.vy = -Math.random()*2; this.size = Math.random()*5+2; this.color = '#67e8f9'; break;
           case 'gold': this.vx = (Math.random() - 0.5) * 2; this.vy = Math.random() * 2; this.size = Math.random() * 3 + 1; this.color = '#fbbf24'; break;
           default: this.vx = (Math.random() - 0.5) * 5; this.vy = (Math.random() - 0.5) * 5; this.size = Math.random() * 5 + 3; this.color = `hsl(${Math.random()*360}, 100%, 50%)`;
        }
      }

      update() {
         this.x += this.vx; this.y += this.vy; this.life -= 0.02;
         if (this.type === 'digit') { if (Math.random() > 0.9) this.color = '#fff'; else this.color = '#0ff'; }
         if (this.type !== 'ink') this.size *= 0.96;
      }

      draw(ctx: CanvasRenderingContext2D) {
         ctx.save(); ctx.globalAlpha = Math.max(0, this.life); ctx.fillStyle = this.color;
         if (this.type === 'digit') { ctx.font = '10px monospace'; ctx.fillText(Math.random() > 0.5 ? '1' : '0', this.x, this.y); }
         else if (this.type === 'shard') { ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(this.x + this.size, this.y + this.size); ctx.lineTo(this.x - this.size, this.y + this.size); ctx.fill(); }
         else if (this.type === 'leaf') { ctx.beginPath(); ctx.ellipse(this.x, this.y, this.size, this.size/2, frame*0.1, 0, Math.PI*2); ctx.fill(); }
         else if (this.type === 'cog') { ctx.font = '12px serif'; ctx.fillText('⚙', this.x, this.y); }
         else { ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI*2); ctx.fill(); }
         ctx.restore();
      }
    }

    const render = () => {
        frame++;
        ctx.clearRect(0, 0, rect.width, rect.height);
        
        // 1. Render Placement/Undo Particles
        for (let i = placementParticlesRef.current.length - 1; i >= 0; i--) {
            const p = placementParticlesRef.current[i];
            p.x += p.vx; p.y += p.vy; p.life -= 0.05;
            ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
            if (p.life <= 0) placementParticlesRef.current.splice(i, 1);
        }
        
        // 2. Victory Particle Spawner
        if (winningLine && points.length > 0 && frame % 2 === 0) {
           const randPoint = points[Math.floor(Math.random() * points.length)];
           let type = 'confetti';
           if (skin === Skin.Dragon) type = 'ember'; else if (skin === Skin.Forest) type = 'leaf'; else if (skin === Skin.Ocean) type = 'bubble';
           else if (skin === Skin.Sakura) type = 'petal'; else if (skin === Skin.Nebula) type = 'star'; else if (skin === Skin.Sunset) type = 'sand';
           else if (skin === Skin.Glacier) type = 'shard'; else if (skin === Skin.Cyber) type = 'digit'; else if (skin === Skin.Ink) type = 'ink';
           else if (skin === Skin.Alchemy) type = 'cog'; else if (skin === Skin.Aurora) type = 'glow';
           else if (skin === Skin.Classic) type = 'gold';
           victoryParticlesRef.current.push(new GameParticle(randPoint.x, randPoint.y, type));
        }

        // 3. Render Winning Line
        if (winningLine && points.length > 0) {
             ctx.save();
             ctx.lineCap = 'round'; ctx.lineJoin = 'round';
             // Default Line Style
             ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.shadowBlur=20; ctx.shadowColor='#fff';
             
             // Custom Line Styles per Skin
             if (skin === Skin.Alchemy) {
                ctx.shadowColor = '#d97706'; ctx.strokeStyle = '#f59e0b'; ctx.setLineDash([10, 5]);
             } else if (skin === Skin.Dragon) {
                ctx.shadowColor = '#f97316'; ctx.shadowBlur = 30 + Math.sin(frame * 0.2) * 10;
             } else if (skin === Skin.Cyber) {
                ctx.shadowColor = '#0ff'; ctx.strokeStyle = '#0ff'; ctx.setLineDash([Math.random()*20, 5]);
             } else if (skin === Skin.Forest) {
                ctx.strokeStyle = '#4ade80'; ctx.shadowColor = '#166534';
             } else if (skin === Skin.Ink) {
                ctx.strokeStyle = '#000'; ctx.shadowBlur = 0; ctx.lineWidth = 6 + Math.sin(frame*0.2)*2;
             } else if (skin === Skin.Aurora) {
                ctx.shadowColor = '#22d3ee'; ctx.strokeStyle = '#67e8f9'; ctx.shadowBlur = 30;
             } else if (skin === Skin.Classic) {
                // Classic: Refined Metallic Gold Beam
                ctx.shadowColor = 'rgba(0,0,0,0.2)'; ctx.shadowBlur = 5;
                // Outer dark gold stroke
                ctx.strokeStyle = '#b45309'; ctx.lineWidth = 6; ctx.lineCap = 'butt';
                ctx.beginPath(); points.forEach((p, i) => { if(i===0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); }); ctx.stroke();
                // Inner bright gold
                ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 3; ctx.lineCap = 'round';
                ctx.beginPath(); points.forEach((p, i) => { if(i===0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); }); ctx.stroke();
                // Highlight glint
                ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.globalAlpha = 0.6 + Math.sin(frame * 0.1) * 0.4;
             }

             ctx.beginPath(); 
             points.forEach((p, i) => { if(i===0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); }); 
             ctx.stroke();
             ctx.restore();
        }

        // 4. Render Victory Particles
        for (let i = victoryParticlesRef.current.length - 1; i >= 0; i--) {
          const vp = victoryParticlesRef.current[i]; 
          vp.update(); 
          vp.draw(ctx); 
          if (vp.life <= 0) victoryParticlesRef.current.splice(i, 1);
        }

        if (winningLine || placementParticlesRef.current.length > 0 || victoryParticlesRef.current.length > 0) {
            animationId = requestAnimationFrame(render);
        }
    };
    render();
    return () => cancelAnimationFrame(animationId);
  }, [winningLine, skin]); 

  const getBoardStyles = () => {
    let styles: React.CSSProperties = {
      position: 'relative', borderRadius: '24px', 
      transition: 'all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)', 
      backdropFilter: 'blur(20px) saturate(150%)',
      boxShadow: '0 30px 60px -12px rgba(0,0,0,0.5)',
      transform: 'perspective(1200px) rotateX(var(--rotate-x, 0deg)) rotateY(var(--rotate-y, 0deg))',
      transformStyle: 'preserve-3d',
      aspectRatio: '1 / 1', 
      backgroundBlendMode: 'overlay',
      overflow: 'hidden' // Ensure inner elements are clipped to the board border
    };
    switch (skin) {
      case Skin.Classic: styles.backgroundColor = theme === Theme.Day ? '#e6b36e' : '#5c3d22'; styles.backgroundImage = TEXTURES.wood; styles.border = '12px solid #5d4037'; break;
      case Skin.Forest: styles.backgroundColor = '#2f4f4f'; styles.backgroundImage = TEXTURES.stone; styles.border = '12px solid #1a2f2f'; break;
      case Skin.Ocean: styles.backgroundColor = '#001d3d'; styles.backgroundImage = `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.05), transparent 70%), ${TEXTURES.marble}`; styles.border = '8px solid #003566'; break;
      case Skin.Sakura: styles.backgroundColor = '#fce7f3'; styles.backgroundImage = TEXTURES.marble; styles.border = '12px solid #fbcfe8'; break;
      case Skin.Nebula: styles.backgroundColor = '#1e1b4b'; styles.backgroundImage = `radial-gradient(circle at center, transparent 0%, #000 100%), ${TEXTURES.stone}`; styles.border = '4px solid #4c1d95'; break;
      case Skin.Sunset: styles.backgroundColor = '#9a3412'; styles.backgroundImage = TEXTURES.sand; styles.border = '12px solid #7c2d12'; break;
      case Skin.Glacier: styles.backgroundColor = '#dbeafe'; styles.backgroundImage = TEXTURES.ice; styles.border = '8px solid #bfdbfe'; styles.backdropFilter = 'blur(8px)'; break;
      case Skin.Cyber: styles.backgroundColor = '#000'; styles.backgroundImage = TEXTURES.grid; styles.backgroundSize = '40px 40px'; styles.border = '2px solid #06b6d4'; break;
      case Skin.Ink: styles.backgroundColor = theme === Theme.Day ? '#f5f5f4' : '#292524'; styles.backgroundImage = TEXTURES.paper; styles.border = theme === Theme.Day ? '1px solid #a8a29e' : '1px solid #444'; break;
      case Skin.Alchemy: styles.backgroundColor = '#292524'; styles.backgroundImage = TEXTURES.metal; styles.border = '8px solid #78350f'; break;
      case Skin.Aurora: styles.backgroundColor = '#020617'; styles.backgroundImage = TEXTURES.aurora; styles.border = '4px solid #0ea5e9'; break;
      case Skin.Dragon: default: styles.backgroundColor = '#1a0500'; styles.backgroundImage = `radial-gradient(circle at 50% 50%, rgba(255, 100, 0, 0.05) 0%, transparent 60%), repeating-linear-gradient(45deg, rgba(0,0,0,0.4) 0px, rgba(0,0,0,0.4) 2px, transparent 2px, transparent 8px), ${TEXTURES.magma}`; styles.border = '4px solid #451a03'; break;
    }
    return styles;
  };

  const getLineColor = () => {
    switch (skin) {
      case Skin.Dragon: return '#d97706'; case Skin.Forest: return '#a7f3d0'; case Skin.Ocean: return '#38bdf8';
      case Skin.Sakura: return '#f43f5e'; case Skin.Nebula: return '#c084fc'; case Skin.Sunset: return '#fed7aa';
      case Skin.Glacier: return '#fff'; case Skin.Cyber: return '#22d3ee'; case Skin.Ink: return theme === Theme.Day ? '#444' : '#a8a29e';
      case Skin.Alchemy: return '#d97706'; case Skin.Aurora: return '#67e8f9';
      default: return theme === Theme.Night ? '#a16207' : '#5d4037';
    }
  };

  const style = getBoardStyles();

  return (
    <div className={`p-1 sm:p-4 md:p-6 rounded-xl backdrop-blur-sm transition-colors duration-700 w-full flex justify-center perspective-[2000px] ${
      skin === Skin.Dragon ? 'bg-black/80' : (theme === Theme.Day ? 'bg-white/20' : 'bg-black/20')
    }`}>
      <div ref={boardRef} className={`w-full max-w-[600px] aspect-square p-3 sm:p-6 md:p-8 relative ${skinChanged ? 'animate-[land_0.8s_ease-out]' : ''}`} style={style}>
        {/* Ambient Light */}
        <div className="absolute inset-0 z-20 pointer-events-none" style={{ background: `radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.2) 0%, transparent 50%)`, mixBlendMode: 'overlay' }} />
        
        {/* Grid & Cells */}
        <div className="relative w-full h-full grid cursor-crosshair z-10" 
             style={{ display: 'grid', gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`, gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr)` }} 
             onMouseLeave={() => setHoverPos(null)}>
          
          {/* Canvas for Particles & Victory Line (MOVED INSIDE GRID to align coordinates) */}
          <canvas ref={canvasRef} className="absolute inset-0 z-30 pointer-events-none w-full h-full" />

          {/* Grid Lines Overlay */}
          <div className={`absolute inset-0 pointer-events-none z-0 transition-opacity duration-1000 ${winningLine ? 'opacity-30' : 'opacity-80'}`}>
             {Array.from({ length: BOARD_SIZE }).map((_, i) => (
               <React.Fragment key={i}>
                 <div className="absolute h-[1px] w-full transform -translate-y-1/2" style={{ backgroundColor: getLineColor(), top: `${(i * 100) / BOARD_SIZE + (50 / BOARD_SIZE)}%` }} />
                 <div className="absolute w-[1px] h-full transform -translate-x-1/2" style={{ backgroundColor: getLineColor(), left: `${(i * 100) / BOARD_SIZE + (50 / BOARD_SIZE)}%` }} />
               </React.Fragment>
             ))}
             {/* Star Points (Hoshi) */}
             {[3, 7, 11].map(r => [3, 7, 11].map(c => (
                <div key={`star-${r}-${c}`} className="absolute w-1.5 h-1.5 rounded-full transform -translate-x-1/2 -translate-y-1/2 z-0 shadow-sm" style={{ top: `${(r * 100) / BOARD_SIZE + (50 / BOARD_SIZE)}%`, left: `${(c * 100) / BOARD_SIZE + (50 / BOARD_SIZE)}%`, backgroundColor: getLineColor() }} />
             )))}
          </div>

          {/* Memoized Cells */}
          {board.map((row, r) => (
            row.map((cellState, c) => (
              <BoardCell 
                key={`${r}-${c}`}
                r={r} c={c}
                cellState={cellState}
                isHovered={hoverPos?.r === r && hoverPos?.c === c && !isGameOver && cellState === Player.None}
                isLastMove={lastMove?.r === r && lastMove?.c === c}
                isWinner={winningLine?.some(([wr, wc]) => wr === r && wc === c) ?? false}
                isLoser={!!winningLine && !winningLine.some(([wr, wc]) => wr === r && wc === c) && cellState !== Player.None}
                isHint={hintPos?.r === r && hintPos?.c === c}
                skin={skin}
                theme={theme}
                currentPlayer={currentPlayer}
                onClick={handleCellClick}
                onMouseEnter={handleMouseEnter}
              />
            ))
          ))}
        </div>
      </div>
    </div>
  );
});

export default Board;