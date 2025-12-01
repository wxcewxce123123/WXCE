
import React, { useState, useMemo } from 'react';
import { AnalysisResult, Player, Skin, MoveType } from '../types';
import { X, Sword, Shield, Crown, Sparkles, AlertCircle, PlayCircle, BarChart2, List } from 'lucide-react';

interface AnalysisPanelProps {
  analysis: AnalysisResult | null;
  skin: Skin;
  onClose: () => void;
  onJumpToMove: (index: number) => void;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ analysis, skin, onClose, onJumpToMove }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'moves'>('overview');

  if (!analysis) return null;

  const isDragon = skin === Skin.Dragon;
  const isCelestia = skin === Skin.Celestia;

  // Theme Styles
  const panelBg = isDragon 
    ? "bg-black/95 border-amber-600/40 text-amber-100 shadow-[0_0_50px_rgba(245,158,11,0.2)]" 
    : (isCelestia 
       ? "bg-slate-50/95 border-amber-400/40 text-slate-800 shadow-[0_0_50px_rgba(251,191,36,0.3)]"
       : "bg-white/95 border-gray-200 text-gray-800 dark:bg-slate-900/95 dark:text-gray-100 dark:border-slate-700");
  
  const accentColor = isDragon || isCelestia ? "#f59e0b" : "#0ea5e9";
  
  // --- SUB-COMPONENTS ---

  // 1. Advantage Chart (SVG)
  const AdvantageChart = () => {
    const data = analysis.advantageCurve;
    const width = 400;
    const height = 120;
    const maxVal = 100;
    const minVal = -100;
    
    // Generate Path
    const points = data.map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((val - minVal) / (maxVal - minVal)) * height;
      return `${x},${y}`;
    }).join(' ');

    const zeroY = height - ((0 - minVal) / (maxVal - minVal)) * height;

    return (
      <div className="w-full h-32 relative mb-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          {/* Grid Lines */}
          <line x1="0" y1={zeroY} x2={width} y2={zeroY} stroke="currentColor" strokeOpacity="0.2" strokeDasharray="4 4" />
          
          {/* Area Fill - Split for Gradient effect? Simpler to just fill opacity */}
          <path d={`M0,${zeroY} L${points} L${width},${zeroY} Z`} fill="currentColor" fillOpacity="0.05" />
          
          {/* Line */}
          <path d={`M0,${zeroY} L0,${points.split(' ')[0].split(',')[1]} ${points}`} fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="absolute top-0 left-2 text-[10px] opacity-50">黑方优势</div>
        <div className="absolute bottom-0 left-2 text-[10px] opacity-50">白方优势</div>
      </div>
    );
  };

  // 2. Radar Chart (SVG)
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
         <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
            {/* Background Polygon */}
            <polygon points={bgPoints} fill="none" stroke="currentColor" strokeOpacity="0.1" />
            {metrics.map((_, i) => {
               const [x, y] = getPoint(100, i);
               return <line key={i} x1={center} y1={center} x2={x} y2={y} stroke="currentColor" strokeOpacity="0.1" />;
            })}
            
            {/* Data Polygon */}
            <polygon points={points} fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1.5" />
         </svg>
         {/* Labels */}
         {labels.map((label, i) => {
            const angle = (Math.PI * 2 * i) / metrics.length - Math.PI / 2;
            const dist = radius + 15;
            const x = center + Math.cos(angle) * dist;
            const y = center + Math.sin(angle) * dist;
            return (
              <div 
                key={i} 
                className="absolute text-[9px] opacity-70 transform -translate-x-1/2 -translate-y-1/2"
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

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-[popIn_0.3s_cubic-bezier(0.2,0,0,1)]">
      <div className={`w-full max-w-2xl rounded-3xl shadow-2xl border flex flex-col max-h-[90vh] overflow-hidden ${panelBg} transition-all duration-500`}>
        
        {/* --- Header --- */}
        <div className="p-5 border-b border-gray-500/10 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-2xl font-bold font-serif flex items-center gap-2 tracking-wide">
              {analysis.winner === Player.Black ? '黑方获胜' : (analysis.winner === Player.White ? '白方获胜' : '平局')}
            </h2>
            <div className="text-xs opacity-60 flex gap-2 mt-1">
               <span>总手数: {analysis.totalMoves}</span>
               <span>•</span>
               <span>{analysis.summary}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-black/10 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* --- Tabs --- */}
        <div className="flex px-5 border-b border-gray-500/10 shrink-0">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`py-3 mr-6 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'overview' ? `border-[${accentColor}] text-[${accentColor}]` : 'border-transparent opacity-50 hover:opacity-100'}`}
            style={{ borderColor: activeTab === 'overview' ? accentColor : 'transparent', color: activeTab === 'overview' ? accentColor : 'inherit' }}
          >
            <BarChart2 size={16} /> 对局综述
          </button>
          <button 
            onClick={() => setActiveTab('moves')}
            className={`py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'moves' ? `border-[${accentColor}] text-[${accentColor}]` : 'border-transparent opacity-50 hover:opacity-100'}`}
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
              
              {/* 1. Advantage Curve */}
              <div className="p-4 rounded-2xl bg-current/5 border border-white/5">
                <h3 className="text-sm font-bold opacity-70 mb-4 flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-current" /> 局势波动图 (Advantage)
                </h3>
                <AdvantageChart />
              </div>

              {/* 2. Radars */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {/* Black Stats */}
                 <div className="p-4 rounded-2xl bg-current/5 border border-white/5 flex flex-col items-center">
                    <div className="mb-2 font-bold flex items-center gap-2">
                       <span className="w-3 h-3 bg-black border border-gray-500 rounded-full" /> 黑方表现
                    </div>
                    <RadarChart stats={analysis.blackStats} color={isDragon ? '#f59e0b' : '#3b82f6'} />
                    <div className="w-full mt-4 grid grid-cols-3 gap-2 text-center">
                       <div className="bg-black/5 rounded p-1">
                          <div className="text-xs opacity-50">综合评分</div>
                          <div className="text-sm font-bold">{Math.round(((Object.values(analysis.blackStats) as number[]).reduce((a,b)=>a+b,0))/6)}</div>
                       </div>
                       <div className="bg-black/5 rounded p-1">
                          <div className="text-xs opacity-50">妙手</div>
                          <div className="text-sm font-bold text-purple-500">{analysis.keyMoves.filter(m=>m.player===Player.Black && m.type==='brilliant').length}</div>
                       </div>
                       <div className="bg-black/5 rounded p-1">
                          <div className="text-xs opacity-50">失误</div>
                          <div className="text-sm font-bold text-orange-500">{analysis.keyMoves.filter(m=>m.player===Player.Black && (m.type==='mistake' || m.type==='blunder')).length}</div>
                       </div>
                    </div>
                 </div>

                 {/* White Stats */}
                 <div className="p-4 rounded-2xl bg-current/5 border border-white/5 flex flex-col items-center">
                    <div className="mb-2 font-bold flex items-center gap-2">
                       <span className="w-3 h-3 bg-white border border-gray-500 rounded-full" /> 白方表现
                    </div>
                    <RadarChart stats={analysis.whiteStats} color={isDragon ? '#ef4444' : '#10b981'} />
                    <div className="w-full mt-4 grid grid-cols-3 gap-2 text-center">
                       <div className="bg-black/5 rounded p-1">
                          <div className="text-xs opacity-50">综合评分</div>
                          <div className="text-sm font-bold">{Math.round(((Object.values(analysis.whiteStats) as number[]).reduce((a,b)=>a+b,0))/6)}</div>
                       </div>
                       <div className="bg-black/5 rounded p-1">
                          <div className="text-xs opacity-50">妙手</div>
                          <div className="text-sm font-bold text-purple-500">{analysis.keyMoves.filter(m=>m.player===Player.White && m.type==='brilliant').length}</div>
                       </div>
                       <div className="bg-black/5 rounded p-1">
                          <div className="text-xs opacity-50">失误</div>
                          <div className="text-sm font-bold text-orange-500">{analysis.keyMoves.filter(m=>m.player===Player.White && (m.type==='mistake' || m.type==='blunder')).length}</div>
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
                  <div className="text-center py-20 opacity-50">本局无特殊关键手</div>
                ) : (
                  analysis.keyMoves.map((move, i) => (
                    <div 
                      key={i}
                      onClick={() => onJumpToMove(move.moveIndex)}
                      className={`group p-3 rounded-xl border border-transparent hover:border-current/10 cursor-pointer transition-all flex items-center gap-4 ${
                         isDragon ? 'hover:bg-amber-900/20' : 'hover:bg-black/5'
                      }`}
                    >
                      {/* Move Number */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-mono font-bold shadow-sm ${
                        move.player === Player.Black ? 'bg-black text-white' : 'bg-white text-black border'
                      }`}>
                         {move.moveIndex + 1}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                         <div className="flex items-center gap-2">
                            {getMoveIcon(move.type)}
                            <span className={`font-bold text-sm ${
                               move.type === 'victory' ? 'text-yellow-500' : 
                               (move.type === 'mistake' ? 'text-orange-500' : 
                               (move.type === 'blunder' ? 'text-red-700' : ''))
                            }`}>
                               {move.description}
                            </span>
                         </div>
                         
                         {/* Bar representing evaluation score */}
                         <div className="mt-1.5 w-full h-1 bg-gray-500/20 rounded-full overflow-hidden flex">
                            <div className="h-full bg-current opacity-50" style={{ width: `${Math.min(100, move.score / 200)}%` }} />
                         </div>
                      </div>

                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                         <PlayCircle size={24} className="opacity-50" />
                      </div>
                    </div>
                  ))
                )}
                <div className="py-8 text-center text-xs opacity-40">
                   点击列表跳转至棋盘回顾
                </div>
             </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AnalysisPanel;
