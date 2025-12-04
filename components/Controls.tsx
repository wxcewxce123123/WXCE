
import React from 'react';
import { RefreshCw, RotateCcw, Palette, Sun, Moon, Sparkles, User, Cpu, Volume2, VolumeX, Lightbulb, Trophy, Video, BrainCircuit, History, Maximize2, Minimize2, Timer, Puzzle as PuzzleIcon, Share2, Flame } from 'lucide-react';
import { Skin, Theme, GameMode, Difficulty } from '../types';

interface ControlsProps {
  theme: Theme;
  skin: Skin;
  gameMode: GameMode;
  difficulty: Difficulty;
  soundEnabled: boolean;
  stats: { wins: number; losses: number; games: number };
  toggleTheme: () => void;
  toggleSound: () => void;
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
  onScreenshot: () => void;
  isGameOver: boolean;
  isReplaying: boolean;
  hasAnalysis: boolean;
  zenMode: boolean;
  toggleZenMode: () => void;
  timeLimit: number;
  setTimeLimit: (limit: number) => void;
}

const Controls: React.FC<ControlsProps> = ({ 
  theme, 
  skin, 
  gameMode,
  difficulty,
  soundEnabled,
  stats,
  toggleTheme,
  toggleSound,
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
  onScreenshot,
  isGameOver,
  isReplaying,
  hasAnalysis,
  zenMode,
  toggleZenMode,
  timeLimit,
  setTimeLimit
}) => {
  const buttonBase = `flex items-center justify-center p-3 rounded-full transition-all duration-300 font-bold shadow-sm transform active:scale-95 text-sm md:text-base`;
  
  const isDragon = skin === Skin.Dragon;
  
  // --- UI Style Definitions ---
  // Dragon: Custom Amber/Gold
  // Day: "Ceramic" - High blur, white, soft shadow
  // Night: "Obsidian" - Dark blue-grey, sharp highlight, deep shadow
  
  const themeStyles = isDragon
    ? "bg-amber-950/60 text-amber-100 hover:bg-amber-900/80 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] shadow-black/50 backdrop-blur-xl border border-amber-500/30"
    : (theme === Theme.Day 
        ? "bg-white/80 text-slate-700 hover:bg-white hover:text-slate-900 hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] shadow-[0_4px_10px_rgba(0,0,0,0.03)] backdrop-blur-xl border border-white/60" 
        : "bg-slate-900/70 text-slate-300 hover:bg-slate-800 hover:text-white hover:shadow-[0_0_20px_rgba(0,0,0,0.5)] shadow-[0_4px_10px_rgba(0,0,0,0.3)] backdrop-blur-xl border border-white/10"
      );

  const activeBtnStyles = isDragon
    ? "bg-gradient-to-br from-amber-600 to-amber-800 text-white shadow-[0_0_15px_rgba(245,158,11,0.5)] border-amber-400/50"
    : (theme === Theme.Day 
        ? "bg-slate-800 text-white shadow-lg shadow-slate-300/50 border-transparent" 
        : "bg-cyan-700 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] border-cyan-500/30");

  const inactiveBtnStyles = isDragon
    ? "bg-transparent text-amber-600 border border-amber-800/30 hover:bg-amber-900/20"
    : (theme === Theme.Day 
        ? "bg-transparent text-slate-500 hover:bg-slate-100 border border-transparent hover:border-slate-200" 
        : "bg-transparent text-slate-500 hover:bg-white/5 border border-transparent hover:border-white/10");

  const extremeBtnStyle = difficulty === Difficulty.Extreme
    ? "bg-gradient-to-r from-red-600 to-purple-800 text-white shadow-[0_0_15px_rgba(220,38,38,0.6)] border-red-500 animate-pulse"
    : (theme === Theme.Day
       ? "bg-red-50 text-red-400 border border-red-100 hover:bg-red-100"
       : "bg-red-950/30 text-red-400 border border-red-900/30 hover:bg-red-900/50");

  const containerStyles = isDragon
    ? 'bg-black/60 border border-amber-600/30 shadow-2xl shadow-amber-900/20'
    : (theme === Theme.Day 
        ? 'bg-white/60 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)]' 
        : 'bg-slate-950/60 border border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.3)]');

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
    { id: Skin.Celestia, label: '天穹', color: '#fbbf24', special: true },
    { id: Skin.Dragon, label: '金龙', special: true, color: '#f59e0b' },
  ];

  const timeOptions = [
      { val: 0, label: '无限' },
      { val: 600, label: '10分' },
      { val: 300, label: '5分' },
  ];

  return (
    <div className={`flex flex-col gap-4 w-full max-w-md mx-auto mt-4 md:mt-0 md:w-72 h-full overflow-y-auto md:overflow-visible pb-10 md:pb-0 px-2 md:px-0 scrollbar-hide ${isReplaying ? 'pointer-events-none opacity-80 grayscale' : ''}`}>
      
      {/* Top Bar: Tools */}
      <div className="flex justify-between items-center bg-transparent gap-3">
         {/* Theme Toggle */}
        <div 
          onClick={toggleTheme}
          className={`${buttonBase} ${themeStyles} cursor-pointer group relative overflow-hidden flex-1 shrink-0 h-10 px-4`}
        >
          <div className="flex items-center gap-2">
            {theme === Theme.Day && !isDragon ? <Sun size={16} className="text-amber-500" /> : <Moon size={16} className={`${isDragon ? 'text-amber-400' : 'text-purple-300'}`} />}
            <span className="text-xs font-semibold">{isDragon ? '龙域' : (theme === Theme.Day ? '日间' : '夜间')}</span>
          </div>
        </div>
        
        {/* Utilities */}
        <div className="flex gap-2">
            <button onClick={toggleSound} className={`${buttonBase} ${themeStyles} w-10 h-10 p-0`} title="音效">
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} className="opacity-50" />}
            </button>
            <button onClick={onHint} disabled={!canUndo} className={`${buttonBase} ${themeStyles} w-10 h-10 p-0`} title="提示">
              <Lightbulb size={16} className={canUndo ? "text-yellow-500" : "opacity-30"} />
            </button>
            <button onClick={onShowHistory} className={`${buttonBase} ${themeStyles} w-10 h-10 p-0`} title="历史">
              <History size={16} className="text-blue-500" />
            </button>
            <button onClick={onScreenshot} className={`${buttonBase} ${themeStyles} w-10 h-10 p-0`} title="截图留念">
               <Share2 size={16} />
            </button>
            <button onClick={toggleZenMode} className={`${buttonBase} ${themeStyles} w-10 h-10 p-0`} title="禅模式">
               {zenMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
        </div>
      </div>

      {/* Main Settings Card */}
      <div className={`p-4 rounded-3xl backdrop-blur-2xl flex flex-col gap-4 ${containerStyles}`}>
        
        {/* Game Mode Selector */}
        <div>
           <div className={`flex items-center gap-2 mb-2 text-[10px] font-bold tracking-widest uppercase opacity-70 ${
             isDragon ? 'text-amber-500' : 'text-current'
           }`}>
             <User size={10} /> Game Mode
           </div>
           <div className={`grid grid-cols-3 gap-1 p-1 rounded-2xl ${isDragon ? 'bg-black/40' : (theme === Theme.Day ? 'bg-slate-100/50' : 'bg-black/20')}`}>
              <button onClick={() => setGameMode(GameMode.PvP)} className={`py-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all ${gameMode === GameMode.PvP ? activeBtnStyles : inactiveBtnStyles}`}>
                 <User size={14} /> 双人
              </button>
              <button onClick={() => setGameMode(GameMode.PvE)} className={`py-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all ${gameMode === GameMode.PvE ? activeBtnStyles : inactiveBtnStyles}`}>
                 <Cpu size={14} /> 人机
              </button>
              <button onClick={() => setGameMode(GameMode.Puzzle)} className={`py-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all ${gameMode === GameMode.Puzzle ? activeBtnStyles : inactiveBtnStyles}`}>
                 <PuzzleIcon size={14} /> 闯关
              </button>
           </div>
        </div>

        {/* Dynamic Context Settings */}
        {gameMode === GameMode.PvE && (
          <div className="animate-[popIn_0.2s_ease-out]">
            <div className={`flex items-center gap-2 mb-2 text-[10px] font-bold tracking-widest uppercase opacity-70 ${isDragon ? 'text-amber-500' : 'text-current'}`}>
                <Cpu size={10} /> Difficulty
            </div>
            <div className={`grid grid-cols-4 gap-1 p-1 rounded-xl ${isDragon ? 'bg-black/40' : (theme === Theme.Day ? 'bg-slate-100/50' : 'bg-black/20')}`}>
                {[
                  { l: '简单', v: Difficulty.Easy }, 
                  { l: '中等', v: Difficulty.Medium }, 
                  { l: '困难', v: Difficulty.Hard },
                ].map(opt => (
                    <button key={opt.v} onClick={() => setDifficulty(opt.v)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${difficulty === opt.v ? activeBtnStyles : inactiveBtnStyles}`}>
                        {opt.l}
                    </button>
                ))}
                 <button onClick={() => setDifficulty(Difficulty.Extreme)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${extremeBtnStyle}`}>
                    <Flame size={10} /> 地狱
                </button>
            </div>
          </div>
        )}

        {/* Time Settings */}
        {gameMode !== GameMode.Puzzle && (
            <div>
               <div className={`flex items-center gap-2 mb-2 text-[10px] font-bold tracking-widest uppercase opacity-70 ${isDragon ? 'text-amber-500' : 'text-current'}`}>
                  <Timer size={10} /> Time Limit
               </div>
               <div className={`flex gap-1 p-1 rounded-xl ${isDragon ? 'bg-black/40' : (theme === Theme.Day ? 'bg-slate-100/50' : 'bg-black/20')}`}>
                  {timeOptions.map((opt) => (
                      <button
                          key={opt.val}
                          onClick={() => setTimeLimit(opt.val)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${timeLimit === opt.val ? activeBtnStyles : inactiveBtnStyles}`}
                      >
                          {opt.label}
                      </button>
                  ))}
               </div>
            </div>
        )}
      </div>

      {/* Skin Selector */}
      <div className={`p-4 rounded-3xl backdrop-blur-2xl flex-1 min-h-0 flex flex-col ${containerStyles}`}>
        <div className={`flex items-center gap-2 mb-3 text-[10px] font-bold tracking-widest uppercase opacity-70 ${
          isDragon ? 'text-amber-500' : 'text-current'
        }`}>
          <Palette size={10} /> Visual Style
        </div>
        <div className="grid grid-cols-2 gap-2 overflow-y-auto pr-1 scrollbar-hide">
          {skinOptions.map((s) => (
            <button
              key={s.id}
              onClick={() => setSkin(s.id as Skin)}
              className={`relative py-3 px-3 text-xs rounded-xl transition-all border overflow-hidden flex items-center gap-2 group ${
                skin === s.id 
                  ? (s.special 
                      ? 'bg-gradient-to-r from-amber-700 to-yellow-600 text-white border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.6)]'
                      : (theme === Theme.Day 
                          ? 'bg-slate-800 text-white border-transparent shadow-md' 
                          : 'bg-cyan-700 text-white border-cyan-400/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                        )
                    ) 
                  : (s.special 
                      ? 'bg-transparent border-amber-800/50 text-amber-600 hover:bg-amber-900/20' 
                      : (theme === Theme.Day 
                          ? 'bg-slate-100/50 border-transparent text-slate-600 hover:bg-white hover:shadow-sm' 
                          : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10'
                        )
                    )
              }`}
            >
               <span 
                 className={`w-2.5 h-2.5 rounded-full shadow-sm border border-black/10 shrink-0 ${s.special ? 'animate-pulse' : ''}`}
                 style={{ backgroundColor: s.color }} 
               />
               <span className="flex-1 text-left truncate flex items-center gap-1 font-medium">
                  {s.label}
                  {s.special && <Sparkles size={8} className="text-yellow-200" />}
               </span>
            </button>
          ))}
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex gap-3 shrink-0">
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
              ? 'bg-red-900/60 text-red-200 hover:bg-red-900/80 border border-red-500/30' 
              : (theme === Theme.Day 
                  ? 'bg-rose-50/80 text-rose-600 hover:bg-rose-100 border border-rose-200' 
                  : 'bg-red-900/30 text-red-300 hover:bg-red-900/50 border border-red-500/30')
            } flex-1`}
        >
          <RefreshCw size={18} className="mr-2" /> 重开
        </button>
        {(isGameOver || hasAnalysis) && (
             <button
              onClick={onAnalyze}
              className={`${buttonBase} ${
                isDragon
                  ? 'bg-purple-900/60 text-purple-200 hover:bg-purple-900/80 border border-purple-500/30'
                  : (theme === Theme.Day 
                      ? 'bg-violet-50/80 text-violet-600 hover:bg-violet-100 border border-violet-200' 
                      : 'bg-purple-900/30 text-purple-300 hover:bg-purple-900/50 border border-purple-500/30')
              } flex-1`}
              title="局势分析"
            >
              <BrainCircuit size={18} />
            </button>
        )}
      </div>

    </div>
  );
};

export default Controls;