

import React, { useEffect, useState } from 'react';
import { Player, Skin, Theme } from '../types';
import { RefreshCw, BrainCircuit, Share2, Award, Clock, Fingerprint, Crown, Zap, Leaf, Droplets, Snowflake, Sparkles, Hexagon, Feather, Flame, Eye, Play } from 'lucide-react';

interface GameOverModalProps {
  winner: Player | null;
  playerColor: Player;
  skin: Skin;
  theme: Theme;
  onRestart: () => void;
  onAnalyze: () => void;
  onReplay: () => void;
  onScreenshot: () => void;
  onViewBoard?: () => void;
  moveCount?: number;
  timeSpent?: number; // in seconds (approximate)
}

const GameOverModal: React.FC<GameOverModalProps> = ({ 
  winner, 
  playerColor, 
  skin, 
  theme, 
  onRestart, 
  onAnalyze,
  onReplay,
  onScreenshot,
  onViewBoard,
  moveCount = 0,
  timeSpent = 0
}) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (winner) {
      const t = setTimeout(() => setShow(true), 500); // Slight delay for dramatic effect
      return () => clearTimeout(t);
    } else {
      setShow(false);
    }
  }, [winner]);

  if (!winner || !show) return null;

  const isBlackWin = winner === Player.Black;

  // --- Theme Engine ---
  const getSkinTheme = () => {
    const base = {
      bg: theme === Theme.Day ? 'bg-white/80' : 'bg-slate-900/80',
      border: theme === Theme.Day ? 'border-white/50' : 'border-white/10',
      text: theme === Theme.Day ? 'text-slate-800' : 'text-slate-100',
      accent: theme === Theme.Day ? 'text-slate-900' : 'text-white',
      shadow: 'shadow-2xl',
      icon: <Award size={64} />,
      decoration: null as React.ReactNode,
      titleGradient: theme === Theme.Day ? 'text-slate-900' : 'text-white' // Fallback
    };

    switch (skin) {
      case Skin.Dragon:
        return {
          ...base,
          bg: 'bg-black/90',
          border: 'border-amber-600/50',
          text: 'text-amber-100',
          accent: 'text-amber-500',
          shadow: 'shadow-[0_0_80px_rgba(245,158,11,0.3)]',
          icon: <Flame size={64} className="text-amber-500 animate-pulse" />,
          titleGradient: "text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-red-600",
          decoration: <div className="absolute inset-0 border-2 border-amber-500/20 rounded-[3rem] pointer-events-none animate-pulse" />
        };
      case Skin.Cyber:
        return {
          ...base,
          bg: 'bg-slate-950/90',
          border: 'border-cyan-500/50',
          text: 'text-cyan-100',
          accent: 'text-cyan-400',
          shadow: 'shadow-[0_0_50px_rgba(6,182,212,0.4)]',
          icon: <Hexagon size={64} className="text-cyan-400 animate-spin-slow" />,
          titleGradient: "text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500",
          decoration: <div className="absolute inset-0 bg-[linear-gradient(transparent_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.1)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20 pointer-events-none rounded-[3rem]" />
        };
      case Skin.Forest:
        return {
          ...base,
          icon: <Leaf size={64} className="text-emerald-500" />,
          titleGradient: "text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 to-green-700",
          decoration: <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />
        };
      case Skin.Ocean:
        return {
          ...base,
          icon: <Droplets size={64} className="text-sky-500" />,
          titleGradient: "text-transparent bg-clip-text bg-gradient-to-br from-sky-400 to-blue-700",
          decoration: <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />
        };
      case Skin.Glacier:
        return {
          ...base,
          icon: <Snowflake size={64} className="text-blue-300" />,
          titleGradient: "text-transparent bg-clip-text bg-gradient-to-br from-blue-200 to-cyan-500",
          decoration: <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
        };
      case Skin.Sakura:
        return {
          ...base,
          icon: <Feather size={64} className="text-pink-400" />,
          titleGradient: "text-transparent bg-clip-text bg-gradient-to-br from-pink-300 to-rose-600",
          decoration: <div className="absolute top-10 left-10 w-20 h-20 bg-pink-400/20 rounded-full blur-xl" />
        };
      case Skin.Nebula:
        return {
          ...base,
          bg: 'bg-indigo-950/90',
          text: 'text-indigo-100',
          icon: <Sparkles size={64} className="text-purple-400" />,
          titleGradient: "text-transparent bg-clip-text bg-gradient-to-br from-purple-400 to-indigo-600",
          decoration: <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-500/20 to-transparent" />
        };
      case Skin.Celestia:
        return {
          ...base,
          bg: 'bg-slate-50/90',
          text: 'text-slate-800',
          accent: 'text-amber-500',
          icon: <Crown size={64} className="text-amber-400" />,
          titleGradient: "text-transparent bg-clip-text bg-gradient-to-br from-amber-300 to-yellow-600",
          shadow: 'shadow-[0_0_60px_rgba(251,191,36,0.4)]'
        };
      case Skin.Sunset:
        return {
          ...base,
          titleGradient: "text-transparent bg-clip-text bg-gradient-to-br from-orange-400 to-red-700",
          icon: <Award size={64} className="text-orange-500" />
        };
      case Skin.Alchemy:
        return {
          ...base,
          titleGradient: "text-transparent bg-clip-text bg-gradient-to-br from-amber-200 to-yellow-800",
          icon: <Zap size={64} className="text-yellow-600" />
        };
      case Skin.Aurora:
        return {
          ...base,
          titleGradient: "text-transparent bg-clip-text bg-gradient-to-br from-teal-200 to-cyan-600",
          icon: <Sparkles size={64} className="text-teal-400" />
        };
      case Skin.Ink:
        return {
          ...base,
          titleGradient: theme === Theme.Day ? "text-slate-900" : "text-white",
          icon: <Feather size={64} className="text-current" />
        };
      default:
        return base;
    }
  };

  const st = getSkinTheme();
  
  const buttonStyle = `flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all transform hover:scale-105 active:scale-95 shadow-lg ${
    skin === Skin.Dragon 
    ? 'bg-gradient-to-r from-amber-600 to-red-600 text-white hover:shadow-amber-500/30' 
    : (skin === Skin.Cyber
       ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:shadow-cyan-500/30'
       : (skin === Skin.Celestia
          ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-white hover:shadow-yellow-500/30'
          : 'bg-slate-800 text-white hover:bg-slate-700'
         )
      )
  }`;

  const secondaryBtnStyle = `flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all hover:bg-black/5 dark:hover:bg-white/5 border ${st.border}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[popIn_0.3s_cubic-bezier(0.2,0,0,1)]">
      <div className={`relative w-full max-w-lg p-8 rounded-[3rem] ${st.bg} ${st.text} ${st.shadow} border ${st.border} backdrop-blur-xl overflow-hidden`}>
        {st.decoration}

        {/* --- Content --- */}
        <div className="relative z-10 flex flex-col items-center text-center space-y-6">
          
          {/* Icon Badge */}
          <div className={`p-6 rounded-full bg-gradient-to-br from-white/10 to-transparent border ${st.border} shadow-inner`}>
            {st.icon}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h2 className={`text-4xl md:text-5xl font-serif font-black tracking-wide ${st.titleGradient}`}>
              {winner === Player.Black ? '黑方胜' : '白方胜'}
            </h2>
            <div className={`text-sm uppercase tracking-[0.3em] opacity-60`}>
               Victory
            </div>
          </div>

          {/* Stats Grid */}
          <div className={`grid grid-cols-2 gap-4 w-full py-4 border-t border-b ${st.border}`}>
             <div className="flex flex-col items-center gap-1">
                <div className="text-xs opacity-50 uppercase tracking-widest">Moves</div>
                <div className={`text-2xl font-mono font-bold ${st.accent}`}>{moveCount}</div>
             </div>
             <div className="flex flex-col items-center gap-1">
                <div className="text-xs opacity-50 uppercase tracking-widest">Time</div>
                <div className={`text-2xl font-mono font-bold ${st.accent}`}>
                  {Math.floor(timeSpent/60)}:{(timeSpent%60).toString().padStart(2,'0')}
                </div>
             </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 w-full">
             <button onClick={onRestart} className={`${buttonStyle} col-span-2`}>
                <RefreshCw size={20} /> 再来一局
             </button>
             
             <button onClick={onReplay} className={secondaryBtnStyle}>
                <Play size={18} /> 棋局回放
             </button>

             <button onClick={onAnalyze} className={secondaryBtnStyle}>
                <BrainCircuit size={18} /> 复盘分析
             </button>
             
             {onViewBoard && (
                 <button onClick={onViewBoard} className={`${secondaryBtnStyle} col-span-2 text-sm opacity-80`}>
                    <Eye size={18} /> 暂时隐藏结算，查看棋盘
                 </button>
             )}
          </div>
          
          <div className="flex justify-center mt-2">
              <button onClick={onScreenshot} className="text-xs opacity-50 hover:opacity-100 flex items-center gap-1 transition-opacity py-2">
                  <Share2 size={14} /> 保存截图留念
              </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default GameOverModal;
