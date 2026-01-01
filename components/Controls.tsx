
import React, { useMemo } from 'react';
import { RefreshCw, RotateCcw, Palette, Sun, Moon, Sparkles, User, Cpu, Volume2, VolumeX, Lightbulb, History, Maximize2, Minimize2, Timer, Puzzle as PuzzleIcon, Share2, Flame, BrainCircuit, Lock } from 'lucide-react';
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
  themeLocked?: boolean;
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
  setTimeLimit,
  themeLocked = false
}) => {
  const buttonBase = `flex items-center justify-center p-3 rounded-full transition-all duration-300 font-bold shadow-sm transform active:scale-95 text-sm md:text-base border`;
  
  // --- Skin-Specific Theme Engine ---
  const style = useMemo(() => {
    const isDark = theme === Theme.Night;
    
    // Default Fallback (Classic/General)
    let s = {
       container: isDark 
         ? "bg-stone-900/80 border-stone-600/30 text-stone-200 shadow-xl shadow-black/20" 
         : "bg-white/60 border-white/60 text-stone-700 shadow-xl shadow-stone-200/50",
       inner: isDark ? "bg-black/30" : "bg-white/40",
       activeBtn: isDark ? "bg-stone-700 text-white border-stone-500" : "bg-stone-800 text-white border-transparent",
       inactiveBtn: isDark ? "hover:bg-white/10 text-stone-400 border-transparent" : "hover:bg-stone-200/50 text-stone-600 border-transparent",
       label: isDark ? "text-stone-400" : "text-stone-500",
       accent: isDark ? "text-stone-300" : "text-stone-600",
       specialBtn: isDark ? "bg-stone-800/50 border-stone-600/50" : "bg-white/50 border-stone-200"
    };

    switch(skin) {
        case Skin.Forest:
            s = {
                // High opacity dark background to fix contrast issues
                container: isDark
                  ? "bg-[#052e16]/85 border-emerald-500/30 text-emerald-100 shadow-[0_0_30px_rgba(16,185,129,0.1)]"
                  : "bg-[#ecfdf5]/70 border-emerald-200/60 text-emerald-900 shadow-[0_8px_32px_rgba(16,185,129,0.1)]",
                inner: isDark ? "bg-black/30" : "bg-[#d1fae5]/40",
                activeBtn: "bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-900/20",
                inactiveBtn: isDark ? "hover:bg-emerald-900/50 text-emerald-400/70 border-transparent" : "hover:bg-emerald-200/50 text-emerald-700/70 border-transparent",
                label: isDark ? "text-emerald-400" : "text-emerald-600",
                accent: "text-emerald-500",
                specialBtn: isDark ? "bg-emerald-900/30 border-emerald-700/30" : "bg-emerald-100/40 border-emerald-200"
            };
            break;
        case Skin.Ocean:
            s = {
                container: isDark
                  ? "bg-[#0f172a]/90 border-sky-500/30 text-sky-100 shadow-[0_0_30px_rgba(14,165,233,0.1)]"
                  : "bg-[#f0f9ff]/70 border-sky-200/60 text-sky-900 shadow-[0_8px_32px_rgba(14,165,233,0.1)]",
                inner: isDark ? "bg-black/30" : "bg-[#e0f2fe]/40",
                activeBtn: "bg-sky-600 text-white border-sky-500 shadow-lg shadow-sky-900/20",
                inactiveBtn: isDark ? "hover:bg-sky-900/50 text-sky-400/70 border-transparent" : "hover:bg-sky-200/50 text-sky-700/70 border-transparent",
                label: isDark ? "text-sky-400" : "text-sky-600",
                accent: "text-sky-500",
                specialBtn: isDark ? "bg-sky-900/30 border-sky-700/30" : "bg-sky-100/40 border-sky-200"
            };
            break;
        case Skin.Sunset:
            s = {
                container: isDark
                  ? "bg-[#431407]/90 border-orange-700/30 text-orange-100 shadow-[0_8px_32px_rgba(67,20,7,0.3)]"
                  : "bg-[#fff7ed]/70 border-orange-200/60 text-orange-900 shadow-[0_8px_32px_rgba(249,115,22,0.1)]",
                inner: isDark ? "bg-black/30" : "bg-[#ffedd5]/40",
                activeBtn: "bg-orange-600 text-white border-orange-500 shadow-lg shadow-orange-900/20",
                inactiveBtn: isDark ? "hover:bg-orange-900/50 text-orange-400/70 border-transparent" : "hover:bg-orange-200/50 text-orange-700/70 border-transparent",
                label: isDark ? "text-orange-400" : "text-orange-600",
                accent: "text-orange-500",
                specialBtn: isDark ? "bg-orange-900/30 border-orange-700/30" : "bg-orange-100/40 border-orange-200"
            };
            break;
        case Skin.Sakura:
            s = {
                // FIXED: Desaturated "white" look for Sakura instead of pink bomb
                container: "bg-white/90 border-pink-200/50 text-slate-700 shadow-xl shadow-pink-100/50",
                inner: "bg-rose-50/50",
                activeBtn: "bg-rose-400 text-white border-rose-300 shadow-lg shadow-rose-200/50",
                inactiveBtn: "hover:bg-rose-50 text-stone-500 border-transparent",
                label: "text-rose-400/90",
                accent: "text-rose-400",
                specialBtn: "bg-white border-pink-100 text-rose-400"
            };
            break;
        case Skin.Glacier:
            s = {
                container: isDark
                  ? "bg-[#172554]/80 border-blue-500/30 text-blue-100 shadow-[0_8px_32px_rgba(30,58,138,0.3)]"
                  : "bg-[#eff6ff]/70 border-blue-200/60 text-blue-900 shadow-[0_8px_32px_rgba(59,130,246,0.1)]",
                inner: isDark ? "bg-[#1e3a8a]/30" : "bg-[#dbeafe]/40",
                activeBtn: "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-900/20",
                inactiveBtn: isDark ? "hover:bg-blue-900/30 text-blue-300/60 border-transparent" : "hover:bg-blue-200/50 text-blue-700/70 border-transparent",
                label: "text-blue-500/90",
                accent: "text-blue-500",
                specialBtn: isDark ? "bg-blue-900/30 border-blue-700/30" : "bg-blue-100/40 border-blue-200"
            };
            break;
        case Skin.Ink:
            s = {
                container: isDark
                  ? "bg-[#0c0a09]/90 border-stone-600/50 text-stone-200 shadow-2xl"
                  : "bg-[#fafaf9]/80 border-stone-300/60 text-stone-900 shadow-xl",
                inner: isDark ? "bg-white/5" : "bg-black/5",
                activeBtn: isDark ? "bg-stone-200 text-black border-white" : "bg-black text-white border-black",
                inactiveBtn: isDark ? "hover:bg-white/10 text-stone-500 border-transparent" : "hover:bg-black/5 text-stone-500 border-transparent",
                label: "text-stone-500",
                accent: "text-stone-500",
                specialBtn: isDark ? "bg-stone-800/50 border-stone-700" : "bg-white/50 border-stone-300"
            };
            break;
        case Skin.Dragon:
            s = {
                container: "bg-black/90 border-amber-600/40 text-amber-50 shadow-[0_0_40px_rgba(180,83,9,0.2)]",
                inner: "bg-amber-950/30",
                activeBtn: "bg-gradient-to-r from-amber-700 to-red-800 text-white border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]",
                inactiveBtn: "hover:bg-amber-900/20 text-amber-600/70 border-transparent",
                label: "text-amber-500",
                accent: "text-amber-500",
                specialBtn: "bg-amber-950/40 border-amber-800/40"
            };
            break;
        case Skin.Cyber:
             s = {
                container: "bg-[#020617]/90 border-cyan-500/30 text-cyan-50 shadow-[0_0_30px_rgba(6,182,212,0.15)]",
                inner: "bg-cyan-950/30",
                activeBtn: "bg-cyan-600 text-white border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)]",
                inactiveBtn: "hover:bg-cyan-900/30 text-cyan-400/60 border-transparent",
                label: "text-cyan-500",
                accent: "text-cyan-400",
                specialBtn: "bg-cyan-950/40 border-cyan-800/40"
             };
             break;
        case Skin.Nebula:
             s = {
                container: "bg-[#1e1b4b]/90 border-purple-500/30 text-purple-100 shadow-[0_8px_32px_rgba(59,7,100,0.3)]",
                inner: "bg-[#2e1065]/30",
                activeBtn: "bg-purple-600 text-white border-purple-400 shadow-lg",
                inactiveBtn: "hover:bg-purple-900/30 text-purple-300/60 border-transparent",
                label: "text-purple-500",
                accent: "text-purple-400",
                specialBtn: "bg-purple-900/30 border-purple-700/30"
             };
             break;
         case Skin.Alchemy:
             s = {
                container: "bg-[#271c19]/90 border-amber-700/40 text-amber-100 shadow-2xl",
                inner: "bg-[#451a03]/30",
                activeBtn: "bg-amber-700 text-white border-amber-500 shadow-lg",
                inactiveBtn: "hover:bg-amber-900/30 text-amber-500/60 border-transparent",
                label: "text-amber-600",
                accent: "text-amber-500",
                specialBtn: "bg-amber-900/30 border-amber-800/30"
             };
             break;
         case Skin.Aurora:
             s = {
                container: "bg-[#042f2e]/90 border-teal-500/30 text-teal-50 shadow-[0_0_30px_rgba(20,184,166,0.2)]",
                inner: "bg-[#115e59]/30",
                activeBtn: "bg-teal-600 text-white border-teal-400 shadow-lg",
                inactiveBtn: "hover:bg-teal-900/30 text-teal-300/60 border-transparent",
                label: "text-teal-500",
                accent: "text-teal-400",
                specialBtn: "bg-teal-900/30 border-teal-700/30"
             };
             break;
         case Skin.Celestia:
             s = {
                container: "bg-white/90 border-amber-200/50 text-slate-800 shadow-[0_10px_40px_rgba(251,191,36,0.15)]",
                inner: "bg-amber-50/50",
                activeBtn: "bg-gradient-to-r from-amber-400 to-yellow-500 text-white border-amber-300 shadow-lg shadow-amber-200",
                inactiveBtn: "hover:bg-amber-50 text-amber-700/60 border-transparent",
                label: "text-amber-500",
                accent: "text-amber-500",
                specialBtn: "bg-white/60 border-amber-100"
             };
             break;
    }
    return s;
  }, [skin, theme]);

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
          onClick={themeLocked ? undefined : toggleTheme}
          className={`${buttonBase} ${style.container} ${themeLocked ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:!bg-opacity-60'} ${style.inactiveBtn} border-opacity-40 group relative overflow-hidden flex-1 shrink-0 h-10 px-4 !bg-opacity-40 !shadow-none`}
          title={themeLocked ? "当前主题固定" : "切换日/夜模式"}
        >
          <div className="flex items-center gap-2">
            {themeLocked 
                ? <Lock size={14} className={style.accent} />
                : (theme === Theme.Day ? <Sun size={16} className={style.accent} /> : <Moon size={16} className={style.accent} />)
            }
            <span className="text-xs font-semibold">
                {skin === Skin.Dragon ? '龙域' : (theme === Theme.Day ? '日间' : '夜间')}
            </span>
          </div>
        </div>
        
        {/* Utilities */}
        <div className="flex gap-2">
            <button onClick={toggleSound} className={`${buttonBase} ${style.container} ${style.inactiveBtn} border-opacity-40 w-10 h-10 p-0 !bg-opacity-40 hover:!bg-opacity-60 !shadow-none`} title="音效">
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} className="opacity-50" />}
            </button>
            <button onClick={onHint} disabled={!canUndo} className={`${buttonBase} ${style.container} ${style.inactiveBtn} border-opacity-40 w-10 h-10 p-0 !bg-opacity-40 hover:!bg-opacity-60 !shadow-none`} title="提示">
              <Lightbulb size={16} className={canUndo ? "text-yellow-500" : "opacity-30"} />
            </button>
            <button onClick={onShowHistory} className={`${buttonBase} ${style.container} ${style.inactiveBtn} border-opacity-40 w-10 h-10 p-0 !bg-opacity-40 hover:!bg-opacity-60 !shadow-none`} title="历史">
              <History size={16} className="text-blue-500" />
            </button>
            <button onClick={onScreenshot} className={`${buttonBase} ${style.container} ${style.inactiveBtn} border-opacity-40 w-10 h-10 p-0 !bg-opacity-40 hover:!bg-opacity-60 !shadow-none`} title="截图留念">
               <Share2 size={16} />
            </button>
            <button onClick={toggleZenMode} className={`${buttonBase} ${style.container} ${style.inactiveBtn} border-opacity-40 w-10 h-10 p-0 !bg-opacity-40 hover:!bg-opacity-60 !shadow-none`} title="禅模式">
               {zenMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
        </div>
      </div>

      {/* Main Settings Card */}
      <div className={`p-4 rounded-3xl backdrop-blur-xl flex flex-col gap-4 ${style.container} transition-all duration-700`}>
        
        {/* Game Mode Selector */}
        <div>
           <div className={`flex items-center gap-2 mb-2 text-[10px] font-bold tracking-widest uppercase opacity-70 ${style.label}`}>
             <User size={10} /> Game Mode
           </div>
           <div className={`grid grid-cols-3 gap-1 p-1 rounded-2xl ${style.inner}`}>
              <button onClick={() => setGameMode(GameMode.PvP)} className={`py-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all border ${gameMode === GameMode.PvP ? style.activeBtn : style.inactiveBtn}`}>
                 <User size={14} /> 双人
              </button>
              <button onClick={() => setGameMode(GameMode.PvE)} className={`py-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all border ${gameMode === GameMode.PvE ? style.activeBtn : style.inactiveBtn}`}>
                 <Cpu size={14} /> 人机
              </button>
              <button onClick={() => setGameMode(GameMode.Puzzle)} className={`py-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all border ${gameMode === GameMode.Puzzle ? style.activeBtn : style.inactiveBtn}`}>
                 <PuzzleIcon size={14} /> 闯关
              </button>
           </div>
        </div>

        {/* Dynamic Context Settings */}
        {gameMode === GameMode.PvE && (
          <div className="animate-[popIn_0.2s_ease-out]">
            <div className={`flex items-center gap-2 mb-2 text-[10px] font-bold tracking-widest uppercase opacity-70 ${style.label}`}>
                <Cpu size={10} /> Difficulty
            </div>
            <div className={`grid grid-cols-4 gap-1 p-1 rounded-xl ${style.inner}`}>
                {[
                  { l: '简单', v: Difficulty.Easy }, 
                  { l: '中等', v: Difficulty.Medium }, 
                  { l: '困难', v: Difficulty.Hard },
                ].map(opt => (
                    <button key={opt.v} onClick={() => setDifficulty(opt.v)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${difficulty === opt.v ? style.activeBtn : style.inactiveBtn}`}>
                        {opt.l}
                    </button>
                ))}
                 <button onClick={() => setDifficulty(Difficulty.Extreme)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${
                    difficulty === Difficulty.Extreme 
                    ? "bg-gradient-to-r from-red-600 to-purple-800 text-white shadow-[0_0_15px_rgba(220,38,38,0.6)] border-red-500 animate-pulse" 
                    : "text-red-400 hover:bg-red-500/10 border border-transparent"
                 }`}>
                    <Flame size={10} /> 地狱
                </button>
            </div>
          </div>
        )}

        {/* Time Settings */}
        {gameMode !== GameMode.Puzzle && (
            <div>
               <div className={`flex items-center gap-2 mb-2 text-[10px] font-bold tracking-widest uppercase opacity-70 ${style.label}`}>
                  <Timer size={10} /> Time Limit
               </div>
               <div className={`flex gap-1 p-1 rounded-xl ${style.inner}`}>
                  {timeOptions.map((opt) => (
                      <button
                          key={opt.val}
                          onClick={() => setTimeLimit(opt.val)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border ${timeLimit === opt.val ? style.activeBtn : style.inactiveBtn}`}
                      >
                          {opt.label}
                      </button>
                  ))}
               </div>
            </div>
        )}
      </div>

      {/* Skin Selector */}
      <div className={`p-4 rounded-3xl backdrop-blur-xl flex-1 min-h-0 flex flex-col ${style.container} transition-colors duration-700`}>
        <div className={`flex items-center gap-2 mb-3 text-[10px] font-bold tracking-widest uppercase opacity-70 ${style.label}`}>
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
                      : style.activeBtn
                    ) 
                  : (s.special 
                      ? style.specialBtn + " text-amber-600 dark:text-amber-500"
                      : style.inactiveBtn
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
          className={`${buttonBase} ${style.container} ${style.inactiveBtn} flex-1 ${!canUndo ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <RotateCcw size={18} className="mr-2" /> 悔棋
        </button>
        <button 
          onClick={onReset} 
          className={`${buttonBase} ${
            skin === Skin.Dragon 
              ? 'bg-red-900/60 text-red-200 hover:bg-red-900/80 border-red-500/30' 
              : (theme === Theme.Day 
                  ? 'bg-rose-50/80 text-rose-600 hover:bg-rose-100 border-rose-200' 
                  : 'bg-red-900/30 text-red-300 hover:bg-red-900/50 border-red-500/30')
            } border flex-1`}
        >
          <RefreshCw size={18} className="mr-2" /> 重开
        </button>
        {(isGameOver || hasAnalysis) && (
             <button
              onClick={onAnalyze}
              className={`${buttonBase} ${
                skin === Skin.Dragon
                  ? 'bg-purple-900/60 text-purple-200 hover:bg-purple-900/80 border-purple-500/30'
                  : (theme === Theme.Day 
                      ? 'bg-violet-50/80 text-violet-600 hover:bg-violet-100 border-violet-200' 
                      : 'bg-purple-900/30 text-purple-300 hover:bg-purple-900/50 border-purple-500/30')
              } border flex-1`}
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
