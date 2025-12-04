

import React, { useState } from 'react';
import { AnalysisResult, Player, Skin, MoveType, Theme } from '../types';
import { X, Sword, Shield, Crown, Sparkles, AlertCircle, PlayCircle, BarChart2, List, MousePointer } from 'lucide-react';

interface AnalysisPanelProps {
  analysis: AnalysisResult | null;
  skin: Skin;
  theme: Theme;
  onClose: () => void;
  onJumpToMove: (index: number) => void;
  onPreviewMove?: (index: number | null) => void;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ analysis, skin, theme, onClose, onJumpToMove, onPreviewMove }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'moves'>('overview');
  const [hoverMove, setHoverMove] = useState<number | null>(null);

  if (!analysis) return null;

  const isDragon = skin === Skin.Dragon;
  const isCelestia = skin === Skin.Celestia;

  // Theme Styles
  const panelBg = isDragon 
    ? "bg-black/95 border-amber-600/40 text-amber-100 shadow-[0_0_50px_rgba(245,158,11,0.2)]" 
    : (isCelestia 
       ? "bg-slate-50/95 border-amber-400/40 text-slate-800 shadow-[0_0_50px_rgba(251,191,36,0.3)]"
       : (theme === Theme.Day 
           ? "bg-white/95 border-white/60 text-slate-800 shadow-2xl shadow-slate-200/50 backdrop-blur-xl" 
           : "bg-slate-900/95 border-white/10 text-slate-100 shadow-2xl shadow-black backdrop-blur-xl"));
  
  const accentColor = isDragon || isCelestia ? "#f59e0b" : "#0ea5e9";
  const sectionBg = isDragon ? "bg-amber-900/20" : (theme === Theme.Day ? "bg-slate-50 border border-slate-100" : "bg-white/5 border border-white/5");

  // 1. Interactive Win Rate Chart
  const WinRateChart = () => {
    const data = analysis.winRateCurve;
    const width = 500;
    const height = 150;
    const padding = 20;
    
    // Normalize points: X based on move index, Y based on 0-100%
    const points = data.map((val, i) => {
      const x = padding + (i / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - (val / 100) * (height - padding * 2);
      return `${x},${y}`;
    }).join(' ');
    
    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left - padding;
        const totalW = width - padding * 2;
        const percent = Math.max(0, Math.min(1, x / totalW));
        const index = Math.round(percent * (data.length - 1));
        
        if (hoverMove !== index) {
            setHoverMove(index);
            if (onPreviewMove) onPreviewMove(index);
        }
    };

    const handleMouseLeave = () => {
        setHoverMove(null);
        if (onPreviewMove) onPreviewMove(null);
    };

    const handleDoubleClick = () => {
        if (hoverMove !== null) {
            onJumpToMove(hoverMove);
        }
    };

    return (
      <div className="w-full h-48 relative mb-4 select-none group">
        <svg 
            viewBox={`0 0 ${width} ${height}`} 
            className="w-full h-full overflow-visible cursor-crosshair"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onDoubleClick={handleDoubleClick}
        >
          {/* Grid Lines */}
          <line x1={padding} y1={height/2} x2={width-padding} y2={height/2} stroke="currentColor" strokeOpacity="0.2" strokeDasharray="4 4" />
          <text x={padding-15} y={height/2+3} fontSize="8" fill="currentColor" opacity="0.5">50%</text>
          <text x={padding-15} y={padding+3} fontSize="8" fill="currentColor" opacity="0.5">100%</text>
          <text x={padding-15} y={height-padding+3} fontSize="8" fill="currentColor" opacity="0.5">0%</text>

          {/* Winning Areas */}
          <path d={`M${padding},${height/2} L${points} L${width-padding},${height/2}`} fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          
          {/* Hover Indicator */}
          {hoverMove !== null && (
              <g>
                  <line 
                    x1={padding + (hoverMove / (data.length - 1)) * (width - padding * 2)} 
                    y1={padding} 
                    x2={padding + (hoverMove / (data.length - 1)) * (width - padding * 2)} 
                    y2={height-padding} 
                    stroke="currentColor" 
                    strokeWidth="1" 
                    strokeDasharray="2 2"
                    opacity="0.5"
                  />
                  <circle 
                    cx={padding + (hoverMove / (data.length - 1)) * (width - padding * 2)}
                    cy={height - padding - (data[hoverMove] / 100) * (height - padding * 2)}
                    r="4"
                    fill={accentColor}
                    stroke="white"
                    strokeWidth="2"
                  />
              </g>
          )}
        </svg>
        
        {/* Tooltip Overlay */}
        {hoverMove !== null && (
            <div className="absolute top-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded backdrop-blur border border-white/10 pointer-events-none z-50">
                <div>第 {hoverMove} 手</div>
                <div className={data[hoverMove] > 50 ? 'text-red-400' : 'text-green-400'}>
                    黑胜率: {Math.round(data[hoverMove])}%
                </div>
                <div className="text-[10px] opacity-60 mt-1">双击跳转复盘</div>
            </div>
        )}
        
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-[10px] opacity-50 flex items-center gap-1">
             <MousePointer size={10} /> 滑动预览局面，双击跳转
        </div>
      </div>
    );
  };

  // 2. Radar Chart
  const RadarChart = ({ stats, color }: { stats: any, color: string }) => {
     const size = 120;
     const center = size / 2;
     const radius = size * 0.4;
     const metrics = ['accuracy', 'aggression', 'defense', 'stability', 'complexity', 'endgame'];
     const labels = ['精准', '进攻', '防守', '稳定', '计算', '残局'];
     
     const getPoint = (val: number, i: number) => {
       const angle = (Math.PI * 2 * i) / metrics.length - Math.PI / 2;
       const r = (val / 100) * radius;
       return [center + Math.cos(angle) * r, center + Math.sin(angle) * r];
     };

     const points = metrics.map((k, i) => getPoint(stats[k], i).join(',')).join(' ');
     const bgPoints = metrics.map((_, i) => getPoint(100, i).join(',')).join(' ');

     return (
       <div className="relative w-[140px] h-[140px] flex items-center justify-center">
         <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full overflow-visible">
            <polygon points={bgPoints} fill="none" stroke="currentColor" strokeOpacity="0.1" />
            {metrics.map((_, i) => {
               const [x, y] = getPoint(100, i);
               return <line key={i} x1={center} y1={center} x2={x} y2={y} stroke="currentColor" strokeOpacity="0.1" />;
            })}
            <polygon points={points} fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1.5" />
            {metrics.map((_, i) => {
               const [x, y] = getPoint(stats[metrics[i]], i);
               return <circle key={i} cx={x} cy={y} r="2" fill={color} />;
            })}
         </svg>
         {labels.map((label, i) => {
            const angle = (Math.PI * 2 * i) / metrics.length - Math.PI / 2;
            const dist = radius + 15;
            const x = center + Math.cos(angle) * dist;
            const y = center + Math.sin(angle) * dist;
            return (
              <div 
                key={i} 
                className="absolute text-[9px] opacity-70 transform -translate-x-1/2 -translate-y-1/2 whitespace-nowrap"
                style={{ left: `${(x/size)*100}%`, top: `${(y/size)*100}%` }}
              >
                {label}
              </div>
            );
         })}
       </div>
     );
  };

  const getMoveIcon = (type: MoveType) => {
    switch (type) {
      case 'victory': return <Crown size={14} className="text-yellow-500" />;
      case 'attack': return <Sword size={14} className="text-red-500" />;
      case 'defense': return <Shield size={14} className="text-blue-500" />;
      case 'brilliant': return <Sparkles size={14} className="text-purple-500" />;
      case 'mistake': return <AlertCircle size={14} className="text-orange-500" />;
      case 'blunder': return <AlertCircle size={14} className="text-red-800" />;
      default: return <div className="w-3 h-3 rounded-full border border-current opacity-30" />;
    }
  };

  // Increased Z-Index to 120 to be higher than GameOverModal (z-100)
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-[popIn_0.3s_cubic-bezier(0.2,0,0,1)]">
      <div className={`w-full max-w-3xl rounded-[2rem] shadow-2xl border flex flex-col max-h-[90vh] overflow-hidden ${panelBg} transition-all duration-500`}>
        
        {/* --- Header --- */}
        <div className="p-5 border-b border-black/5 dark:border-white/5 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-2xl font-bold font-serif flex items-center gap-2 tracking-wide">
              {analysis.winner === Player.Black ? '黑方获胜' : (analysis.winner === Player.White ? '白方获胜' : '平局')}
            </h2>
            <div className="text-xs opacity-60 flex gap-2 mt-1">
               <span>总手数: {analysis.totalMoves}</span>
               <span className="opacity-50">|</span>
               <span>{analysis.summary}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* --- Tabs --- */}
        <div className="flex px-6 border-b border-black/5 dark:border-white/5 shrink-0">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`py-4 mr-8 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'overview' ? `border-[${accentColor}]` : 'border-transparent opacity-50 hover:opacity-100'}`}
            style={{ borderColor: activeTab === 'overview' ? accentColor : 'transparent', color: activeTab === 'overview' ? accentColor : 'inherit' }}
          >
            <BarChart2 size={16} /> 局势分析
          </button>
          <button 
            onClick={() => setActiveTab('moves')}
            className={`py-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'moves' ? `border-[${accentColor}]` : 'border-transparent opacity-50 hover:opacity-100'}`}
            style={{ borderColor: activeTab === 'moves' ? accentColor : 'transparent', color: activeTab === 'moves' ? accentColor : 'inherit' }}
          >
            <List size={16} /> 关键手顺
          </button>
        </div>

        {/* --- Content Area --- */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          
          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="p-6 space-y-8 animate-[popIn_0.4s_ease-out]">
              
              {/* 1. Win Rate Chart */}
              <div className={`p-4 rounded-3xl ${sectionBg}`}>
                <h3 className="text-sm font-bold opacity-70 mb-4 flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-current" /> 胜率波动 (Win Rate)
                </h3>
                <WinRateChart />
              </div>

              {/* 2. Radars */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {/* Black Stats */}
                 <div className={`p-6 rounded-3xl ${sectionBg} flex flex-col items-center`}>
                    <div className="mb-4 font-bold flex items-center gap-2 text-lg">
                       <span className="w-3 h-3 bg-black border border-gray-500 rounded-full" /> 黑方评价
                    </div>
                    <RadarChart stats={analysis.blackStats} color={isDragon ? '#f59e0b' : '#3b82f6'} />
                    <div className="w-full mt-6 flex justify-between px-4 text-center">
                       <div>
                          <div className="text-xs opacity-50 mb-1">综合战力</div>
                          <div className="text-xl font-bold">{Math.round(((Object.values(analysis.blackStats) as number[]).reduce((a,b)=>a+b,0))/6)}</div>
                       </div>
                       <div>
                          <div className="text-xs opacity-50 mb-1">妙手</div>
                          <div className="text-xl font-bold text-purple-500">{analysis.keyMoves.filter(m=>m.player===Player.Black && m.type==='brilliant').length}</div>
                       </div>
                    </div>
                 </div>

                 {/* White Stats */}
                 <div className={`p-6 rounded-3xl ${sectionBg} flex flex-col items-center`}>
                    <div className="mb-4 font-bold flex items-center gap-2 text-lg">
                       <span className="w-3 h-3 bg-white border border-gray-500 rounded-full" /> 白方评价
                    </div>
                    <RadarChart stats={analysis.whiteStats} color={isDragon ? '#ef4444' : '#10b981'} />
                    <div className="w-full mt-6 flex justify-between px-4 text-center">
                       <div>
                          <div className="text-xs opacity-50 mb-1">综合战力</div>
                          <div className="text-xl font-bold">{Math.round(((Object.values(analysis.whiteStats) as number[]).reduce((a,b)=>a+b,0))/6)}</div>
                       </div>
                       <div>
                          <div className="text-xs opacity-50 mb-1">妙手</div>
                          <div className="text-xl font-bold text-purple-500">{analysis.keyMoves.filter(m=>m.player===Player.White && m.type==='brilliant').length}</div>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {/* TAB: MOVES */}
          {activeTab === 'moves' && (
             <div className="p-4 space-y-2 animate-[popIn_0.4s_ease-out]">
                {analysis.keyMoves.length === 0 ? (
                  <div className="text-center py-20 opacity-50">本局平稳进行，无明显关键手。</div>
                ) : (
                  analysis.keyMoves.map((move, i) => (
                    <div 
                      key={i}
                      onClick={() => onJumpToMove(move.moveIndex)}
                      className={`group p-4 rounded-2xl border border-transparent hover:border-current/10 cursor-pointer transition-all flex items-center gap-4 ${
                         isDragon ? 'hover:bg-amber-900/20 bg-black/20' : (theme === Theme.Day ? 'hover:bg-slate-100 bg-white/60' : 'hover:bg-white/5 bg-black/20')
                      }`}
                    >
                      {/* Move Number */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-mono font-bold shadow-sm shrink-0 ${
                        move.player === Player.Black ? 'bg-black text-white' : 'bg-white text-black border border-gray-200'
                      }`}>
                         {move.moveIndex + 1}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                         <div className="flex items-center gap-2 mb-1">
                            {getMoveIcon(move.type)}
                            <span className="font-bold text-sm truncate">{move.description}</span>
                         </div>
                         
                         <div className="flex items-center gap-3 text-xs opacity-60">
                             <span>黑方胜率: {Math.round(move.winRate)}%</span>
                             <div className="h-1.5 w-24 bg-current/10 rounded-full overflow-hidden">
                                <div className={`h-full ${move.winRate > 50 ? 'bg-black' : 'bg-white'}`} style={{ width: `${move.winRate}%` }} />
                             </div>
                         </div>
                      </div>

                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                         <PlayCircle size={20} className="opacity-50" />
                      </div>
                    </div>
                  ))
                )}
             </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AnalysisPanel;