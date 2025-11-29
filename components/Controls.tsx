
import React from 'react';
import { RefreshCw, RotateCcw, Palette, Sun, Moon, Sparkles, User, Cpu, Volume2, VolumeX, Lightbulb, Trophy, Video, BrainCircuit, History, Zap, Eye } from 'lucide-react';
import { Skin, Theme, GameMode, Difficulty, Quality } from '../types';

interface ControlsProps {
  theme: Theme;
  skin: Skin;
  gameMode: GameMode;
  difficulty: Difficulty;
  soundEnabled: boolean;
  bloomEnabled: boolean;
  quality: Quality;
  stats: { wins: number; losses: number; games: number };
  toggleTheme: () => void;
  toggleSound: () => void;
  toggleBloom: () => void;
  toggleQuality: () => void;
  onHint: () => void;
  onShowHistory: () => void;
  setSkin: (skin: Skin) => void;
  setGameMode: (mode: GameMode) => void;
  setDifficulty: (diff: Difficulty) => void;
  onReset: () => void;
  onUndo: () => void;
  canUndo: boolean;
  onReplay: () => void;
  onAnalyze: () => void;
  isGameOver: boolean;
  isReplaying: boolean;
}

const Controls: React.FC<ControlsProps> = ({ 
  theme, 
  skin, 
  gameMode,
  difficulty,
  soundEnabled,
  bloomEnabled,
  quality,
  stats,
  toggleTheme,
  toggleSound,
  toggleBloom,
  toggleQuality,
  onHint,
  onShowHistory,
  setSkin, 
  setGameMode,
  setDifficulty,
  onReset, 
  onUndo,
  canUndo,
  onReplay,
  onAnalyze,
  isGameOver,
  isReplaying
}) => {
  const buttonBase = `flex items-center justify-center p-3 rounded-xl transition-all duration-300 font-bold shadow-lg transform active:scale-95 text-sm md:text-base`;
  
  const isDragon = skin === Skin.Dragon;
  
  const themeStyles = isDragon
    ? "bg-amber-900/40 text-amber-100 hover:bg-amber-800/60 hover:shadow-[0_0_15px_rgba(245,158,11,0.3)] shadow-black/50 backdrop-blur-md border border-amber-500/20"
    : (theme === Theme.Day 
        ? "bg-white/60 text-stone-800 hover:bg-white hover:shadow-xl shadow-stone-300/50 backdrop-blur-md" 
        : "bg-black/40 text-cyan-100 hover:bg-black/60 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] shadow-black/50 backdrop-blur-md border border-white/10"
      );

  const activeBtnStyles = isDragon
    ? "bg-amber-600 text-white shadow-[0_0_10px_#f59e0b] border-amber-400"
    : (theme === Theme.Day ? "bg-stone-800 text-white" : "bg-cyan-600 text-white shadow-[0_0_10px_cyan]");

  const inactiveBtnStyles = isDragon
    ? "bg-transparent text-amber-600 border border-amber-800/50 hover:bg-amber-900/20"
    : (theme === Theme.Day ? "bg-transparent text-stone-500 hover:bg-stone-200" : "bg-transparent text-slate-500 hover:bg-slate-800");

  const skinOptions = [
    { id: Skin.Classic, label: '经典', color: '#e6b36e' },
    { id: Skin.Forest, label: '幽篁', color: '#14532d' },
    { id: Skin.Ocean, label: '沧海', color: '#0c4a6e' },
    { id: Skin.Sakura, label: '落樱', color: '#fbcfe8' },
    { id: Skin.Sunset, label: '大漠', color: '#9a3412' },
    { id: Skin.Glacier, label: '冰川', color: '#bfdbfe' },
    { id: Skin.Ink, label: '水墨', color: '#444' },
    { id: Skin.Cyber, label: '赛博', color: '#06b6d4' },
    { id: Skin.Nebula, label: '星云', color: '#4c1d95' },
    { id: Skin.Alchemy, label: '炼金', color: '#d97706' },
    { id: Skin.Aurora, label: '极光', color: '#22d3ee' },
    { id: Skin.Dragon, label: '金龙', special: true, color: '#f59e0b' },
  ];

  return (
    <div className={`flex flex-col gap-4 w-full max-w-md mx-auto mt-4 md:mt-0 md:w-64 h-full overflow-y-auto md:overflow-visible pb-10 md:pb-0 px-2 md:px-0 scrollbar-hide ${isReplaying ? 'pointer-events-none opacity-80 grayscale' : ''}`}>
      
      {/* Quick Toggles Row */}
      <div className="flex gap-2">
         {/* Theme Toggle */}
        <div 
          onClick={toggleTheme}
          className={`${buttonBase} ${themeStyles} cursor-pointer group relative overflow-hidden flex-1 shrink-0`}
        >
          <div className="flex items-center gap-2">
            {theme === Theme.Day && !isDragon ? <Sun size={18} className="text-orange-400" /> : <Moon size={18} className={`${isDragon ? 'text-amber-400' : 'text-purple-300'}`} />}
            <span className="text-xs">{isDragon ? '龙域' : (theme === Theme.Day ? '日间' : '夜间')}</span>
          </div>
        </div>
        
        {/* Sound Toggle */}
        <button 
          onClick={toggleSound}
          className={`${buttonBase} ${themeStyles} w-10 flex-none px-0`}
          title={soundEnabled ? "关闭音效" : "开启音效"}
        >
          {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} className="opacity-50" />}
        </button>

         {/* Hint Button */}
        <button 
          onClick={onHint}
          disabled={!canUndo} 
          className={`${buttonBase} ${themeStyles} w-10 flex-none px-0`}
          title="AI 提示"
        >
          <Lightbulb size={18} className={canUndo ? "text-yellow-400" : "opacity-30"} />
        </button>

        {/* History Button */}
        <button 
          onClick={onShowHistory}
          className={`${buttonBase} ${themeStyles} w-10 flex-none px-0`}
          title="历史记录"
        >
          <History size={18} className="text-blue-400" />
        </button>
      </div>

      {/* Visual Settings Row */}
      <div className={`p-2 rounded-xl backdrop-blur-md shadow-lg shrink-0 flex gap-2 ${
        isDragon 
          ? 'bg-black/50 border border-amber-600/30' 
          : (theme === Theme.Day ? 'bg-white/40' : 'bg-black/30 border border-white/5')
      }`}>
         <button 
            onClick={toggleBloom}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${
              bloomEnabled ? activeBtnStyles : inactiveBtnStyles
            }`}
            title="泛光特效开关"
         >
            <Sparkles size={14} /> 泛光 {bloomEnabled ? '开' : '关'}
         </button>
         <button 
            onClick={toggleQuality}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${
              quality === Quality.High ? activeBtnStyles : inactiveBtnStyles
            }`}
            title="画质切换"
         >
            <Zap size={14} /> 画质 {quality === Quality.High ? '高' : '低'}
         </button>
      </div>

      {/* Stats Panel */}
      <div className={`p-3 rounded-xl backdrop-blur-md shadow-lg shrink-0 flex justify-between items-center ${
        isDragon 
          ? 'bg-black/50 border border-amber-600/30' 
          : (theme === Theme.Day ? 'bg-white/40' : 'bg-black/30 border border-white/5')
      }`}>
         <div className="flex items-center gap-2">
            <Trophy size={16} className={isDragon ? "text-amber-500" : "text-yellow-500"} />
            <span className={`text-xs font-bold ${isDragon ? "text-amber-100" : (theme===Theme.Day ? "text-stone-700" : "text-slate-200")}`}>战绩</span>
         </div>
         <div className="flex gap-3 text-xs font-mono">
            <span className="text-green-500">胜:{stats.wins}</span>
            <span className="text-red-500">负:{stats.losses}</span>
            <span className={isDragon ? "text-amber-500" : "text-blue-500"}>
              {stats.games > 0 ? Math.round((stats.wins / stats.games) * 100) : 0}%
            </span>
         </div>
      </div>

      {/* Game Mode & Difficulty */}
      <div className={`p-3 rounded-xl backdrop-blur-md shadow-lg shrink-0 ${
        isDragon 
          ? 'bg-black/50 border border-amber-600/30' 
          : (theme === Theme.Day ? 'bg-white/40' : 'bg-black/30 border border-white/5')
      }`}>
        <div className={`flex items-center gap-2 mb-2 text-sm font-semibold ${
          isDragon ? 'text-amber-400' : (theme === Theme.Day ? 'text-stone-600' : 'text-slate-300')
        }`}>
          <User size={16} />
          <span>对局设置</span>
        </div>
        
        {/* Mode Toggle */}
        <div className="flex bg-black/10 rounded-lg p-1 mb-2 gap-1">
          <button 
            onClick={() => setGameMode(GameMode.PvP)}
            className={`flex-1 py-1.5 rounded-md text-xs font-bold flex items-center justify-center gap-1 transition-all ${gameMode === GameMode.PvP ? activeBtnStyles : inactiveBtnStyles}`}
          >
            <User size={12} /> 双人
          </button>
          <button 
            onClick={() => setGameMode(GameMode.PvE)}
            className={`flex-1 py-1.5 rounded-md text-xs font-bold flex items-center justify-center gap-1 transition-all ${gameMode === GameMode.PvE ? activeBtnStyles : inactiveBtnStyles}`}
          >
            <Cpu size={12} /> 人机
          </button>
        </div>

        {/* Difficulty (Only show in PvE) */}
        {gameMode === GameMode.PvE && (
          <div className="flex bg-black/10 rounded-lg p-1 animate-[popIn_0.3s_ease-out] gap-1">
            <button 
              onClick={() => setDifficulty(Difficulty.Easy)}
              className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all ${difficulty === Difficulty.Easy ? activeBtnStyles : inactiveBtnStyles}`}
            >
              简单
            </button>
            <button 
              onClick={() => setDifficulty(Difficulty.Medium)}
              className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all ${difficulty === Difficulty.Medium ? activeBtnStyles : inactiveBtnStyles}`}
            >
              中等
            </button>
            <button 
              onClick={() => setDifficulty(Difficulty.Hard)}
              className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all ${difficulty === Difficulty.Hard ? activeBtnStyles : inactiveBtnStyles}`}
            >
              困难
            </button>
          </div>
        )}
      </div>

      {/* Skin Selector */}
      <div className={`p-3 rounded-xl backdrop-blur-md shadow-lg shrink-0 ${
        isDragon 
          ? 'bg-black/50 border border-amber-600/30' 
          : (theme === Theme.Day ? 'bg-white/40' : 'bg-black/30 border border-white/5')
      }`}>
        <div className={`flex items-center gap-2 mb-2 text-sm font-semibold ${
          isDragon ? 'text-amber-400' : (theme === Theme.Day ? 'text-stone-600' : 'text-slate-300')
        }`}>
          <Palette size={16} />
          <span>棋盘风格</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {skinOptions.map((s) => (
            <button
              key={s.id}
              onClick={() => setSkin(s.id as Skin)}
              className={`relative py-2 px-3 text-[10px] md:text-xs rounded-lg transition-all border overflow-hidden flex items-center gap-2 ${
                skin === s.id 
                  ? (s.special 
                      ? 'bg-gradient-to-r from-amber-700 to-yellow-600 text-white border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.6)]'
                      : (theme === Theme.Day ? 'bg-stone-800 text-white border-transparent' : 'bg-cyan-600 text-white border-cyan-400 shadow-[0_0_10px_cyan]')
                    ) 
                  : (s.special 
                      ? 'bg-transparent border-amber-800/50 text-amber-600 hover:bg-amber-900/20' 
                      : (theme === Theme.Day ? 'bg-transparent border-stone-300 text-stone-600 hover:bg-stone-200' : 'bg-transparent border-slate-600 text-slate-400 hover:bg-slate-800')
                    )
              }`}
            >
               {/* Color Swatch */}
               <span 
                 className={`w-3 h-3 rounded-full shadow-sm border border-black/10 shrink-0 ${s.special ? 'animate-pulse' : ''}`}
                 style={{ backgroundColor: s.color }} 
               />
               
               <span className="flex-1 text-left truncate flex items-center gap-1">
                  {s.label}
                  {s.special && <Sparkles size={8} className="text-yellow-200" />}
               </span>

               {s.special && skin === s.id && (
                 <div className="absolute inset-0 bg-gradient-to-tr from-yellow-400/0 via-yellow-400/20 to-yellow-400/0 animate-pulse pointer-events-none" />
               )}
            </button>
          ))}
        </div>
      </div>

      {/* Game Actions */}
      <div className="flex gap-2 shrink-0">
        <button 
          onClick={onUndo} 
          disabled={!canUndo}
          className={`${buttonBase} ${themeStyles} flex-1 ${!canUndo ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <RotateCcw size={18} className="mr-2" /> 悔棋
        </button>
        <button 
          onClick={onReset} 
          className={`${buttonBase} ${
            isDragon 
              ? 'bg-red-900/40 text-red-300 hover:bg-red-900/60 border border-red-500/30' 
              : (theme === Theme.Day ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-red-900/30 text-red-300 hover:bg-red-900/50 border border-red-500/30')
            } flex-1`}
        >
          <RefreshCw size={18} className="mr-2" /> 重开
        </button>
        {isGameOver && (
          <>
            <button
              onClick={onReplay}
              className={`${buttonBase} ${
                isDragon
                  ? 'bg-amber-900/40 text-amber-300 hover:bg-amber-900/60 border border-amber-500/30'
                  : (theme === Theme.Day ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-blue-900/30 text-blue-300 hover:bg-blue-900/50 border border-blue-500/30')
              } flex-1`}
              title="回放"
            >
              <Video size={18} />
            </button>
             <button
              onClick={onAnalyze}
              className={`${buttonBase} ${
                isDragon
                  ? 'bg-purple-900/40 text-purple-300 hover:bg-purple-900/60 border border-purple-500/30'
                  : (theme === Theme.Day ? 'bg-purple-50 text-purple-600 hover:bg-purple-100' : 'bg-purple-900/30 text-purple-300 hover:bg-purple-900/50 border border-purple-500/30')
              } flex-1`}
              title="分析"
            >
              <BrainCircuit size={18} />
            </button>
          </>
        )}
      </div>

    </div>
  );
};

export default Controls;
