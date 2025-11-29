
import React from 'react';
import { AnalysisResult, Player, Skin } from '../types';
import { X, Sword, Shield, Crown, Sparkles, Circle } from 'lucide-react';

interface AnalysisPanelProps {
  analysis: AnalysisResult | null;
  skin: Skin;
  onClose: () => void;
  onJumpToMove: (index: number) => void;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ analysis, skin, onClose, onJumpToMove }) => {
  if (!analysis) return null;

  const isDragon = skin === Skin.Dragon;
  const panelBg = isDragon 
    ? "bg-black/90 border-amber-500/30 text-amber-100" 
    : "bg-white/90 border-white/40 text-stone-800 dark:bg-slate-900/90 dark:text-slate-100";

  const getIcon = (type: string) => {
    switch (type) {
      case 'victory': return <Crown size={16} className="text-yellow-500" />;
      case 'attack': return <Sword size={16} className="text-red-500" />;
      case 'defense': return <Shield size={16} className="text-blue-500" />;
      case 'brilliant': return <Sparkles size={16} className="text-purple-500" />;
      default: return <Circle size={16} className="text-gray-400" />;
    }
  };

  const getRowStyle = (type: string) => {
     switch (type) {
      case 'victory': return "bg-yellow-500/10 border-l-4 border-yellow-500";
      case 'attack': return "bg-red-500/5 border-l-4 border-red-500";
      case 'defense': return "bg-blue-500/5 border-l-4 border-blue-500";
      case 'brilliant': return "bg-purple-500/5 border-l-4 border-purple-500";
      default: return "border-l-4 border-transparent hover:bg-black/5";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[popIn_0.3s_ease-out]">
      <div className={`w-full max-w-lg rounded-2xl shadow-2xl border backdrop-blur-md flex flex-col max-h-[80vh] overflow-hidden ${panelBg}`}>
        
        {/* Header */}
        <div className="p-5 border-b border-black/10 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold font-serif flex items-center gap-2">
              <Sparkles size={20} className={isDragon ? "text-amber-500" : "text-cyan-500"} />
              战局智能分析
            </h2>
            <p className="text-xs opacity-60 mt-1">AI Match Report</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-black/10 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Summary Stats */}
        <div className="p-5 grid grid-cols-3 gap-4 border-b border-black/10">
          <div className="text-center p-3 rounded-xl bg-black/5">
            <div className="text-2xl font-bold">{analysis.totalMoves}</div>
            <div className="text-xs opacity-60 uppercase tracking-wider">总手数</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-black/5">
            <div className="text-2xl font-bold">{analysis.blackAccuracy}</div>
            <div className="text-xs opacity-60 uppercase tracking-wider">黑方评分</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-black/5">
            <div className="text-2xl font-bold">{analysis.whiteAccuracy}</div>
            <div className="text-xs opacity-60 uppercase tracking-wider">白方评分</div>
          </div>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
          <h3 className="text-sm font-bold opacity-70 mb-2 px-1">关键时刻 (Key Moments)</h3>
          {analysis.keyMoves.length === 0 ? (
             <div className="text-center py-10 opacity-50 text-sm">平淡的一局，双方都很稳健。</div>
          ) : (
            analysis.keyMoves.map((move, i) => (
              <div 
                key={i}
                onClick={() => { onJumpToMove(move.moveIndex); }}
                className={`p-3 rounded-lg cursor-pointer transition-all flex items-center gap-4 ${getRowStyle(move.type)}`}
              >
                <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center font-mono font-bold text-sm shrink-0">
                  {move.moveIndex + 1}
                </div>
                <div className="flex-1">
                   <div className="flex items-center gap-2 mb-1">
                     {getIcon(move.type)}
                     <span className="font-bold text-sm uppercase">
                        {move.type === 'brilliant' ? '妙手' : (move.type === 'victory' ? '致胜' : (move.type==='attack'?'进攻':'防守'))}
                     </span>
                     <span className={`text-xs px-1.5 py-0.5 rounded ml-auto ${move.player === Player.Black ? 'bg-black text-white' : 'bg-white text-black border'}`}>
                        {move.player === Player.Black ? '黑' : '白'}
                     </span>
                   </div>
                   <div className="text-xs opacity-70">{move.description}</div>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="p-4 border-t border-black/10 text-center text-xs opacity-50">
           点击列表项可跳转至棋盘对应时刻
        </div>

      </div>
    </div>
  );
};

export default AnalysisPanel;
