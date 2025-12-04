
import React from 'react';
import { MatchRecord, Player, GameMode, Skin, Theme } from '../types';
import { X, Clock, Calendar, Sword, Cpu, Trophy, Trash2, PlayCircle } from 'lucide-react';

interface HistoryPanelProps {
  history: MatchRecord[];
  onClose: () => void;
  onLoadMatch: (record: MatchRecord) => void;
  onClearHistory: () => void;
  skin: Skin;
  theme: Theme;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onClose, onLoadMatch, onClearHistory, skin, theme }) => {
  const isDragon = skin === Skin.Dragon;
  
  // New UI
  const panelBg = isDragon 
    ? "bg-black/90 border-amber-500/30 text-amber-100 backdrop-blur-xl" 
    : (theme === Theme.Day 
        ? "bg-white/90 border-white/60 text-slate-800 backdrop-blur-xl shadow-2xl" 
        : "bg-slate-900/90 border-white/10 text-slate-100 backdrop-blur-xl shadow-2xl shadow-black");

  const itemBg = isDragon
    ? "hover:bg-amber-900/20 hover:border-amber-500/30 bg-black/20"
    : (theme === Theme.Day
        ? "hover:bg-slate-100 bg-white/50 border-transparent hover:border-slate-200"
        : "hover:bg-white/10 bg-black/20 border-transparent hover:border-white/10");

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleString('zh-CN', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[popIn_0.3s_ease-out]">
      <div className={`w-full max-w-lg rounded-3xl shadow-2xl border flex flex-col max-h-[80vh] overflow-hidden ${panelBg}`}>
        
        {/* Header */}
        <div className="p-5 border-b border-black/5 dark:border-white/5 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold font-serif flex items-center gap-2">
              <Clock size={20} className={isDragon ? "text-amber-500" : (theme === Theme.Day ? "text-slate-600" : "text-slate-400")} />
              历史对局
            </h2>
            <p className="text-xs opacity-60 mt-1">Match History</p>
          </div>
          <div className="flex gap-2">
            {history.length > 0 && (
              <button 
                onClick={() => {
                  if(window.confirm('确定要清空所有历史记录吗？')) {
                    onClearHistory();
                  }
                }}
                className="p-2 rounded-full hover:bg-red-500/10 hover:text-red-500 transition-colors"
                title="清空记录"
              >
                <Trash2 size={18} />
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
          {history.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-48 opacity-50 space-y-4">
                <Clock size={48} strokeWidth={1} />
                <div className="text-sm">暂无对局记录</div>
             </div>
          ) : (
            history.map((record) => (
              <div 
                key={record.id}
                onClick={() => onLoadMatch(record)}
                className={`p-3 rounded-2xl cursor-pointer transition-all border flex items-center gap-4 group ${itemBg}`}
              >
                {/* Winner Icon */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                  record.winner === Player.Black 
                    ? 'bg-black text-white' 
                    : 'bg-white text-black border border-gray-200'
                }`}>
                  <Trophy size={16} />
                </div>

                <div className="flex-1 min-w-0">
                   <div className="flex items-center gap-2 mb-1">
                     <span className="font-bold text-sm truncate">
                        {record.winner === Player.Black ? '黑方胜' : '白方胜'}
                     </span>
                     <span className={`text-[10px] px-1.5 py-0.5 rounded ml-auto flex items-center gap-1 ${
                        isDragon ? 'bg-amber-900/50 text-amber-200' : (theme === Theme.Day ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-300')
                     }`}>
                        {record.mode === GameMode.PvP ? <Sword size={10} /> : <Cpu size={10} />}
                        {record.mode === GameMode.PvP ? '双人' : `人机 (${record.difficulty})`}
                     </span>
                   </div>
                   <div className="flex items-center gap-3 text-xs opacity-60">
                      <span className="flex items-center gap-1"><Calendar size={10} /> {formatDate(record.timestamp)}</span>
                      <span>{record.moves} 手</span>
                   </div>
                </div>
                
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                   <PlayCircle size={20} className={isDragon ? "text-amber-500" : (theme === Theme.Day ? "text-slate-400" : "text-white")} />
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="p-4 border-t border-black/5 dark:border-white/5 text-center text-xs opacity-50">
           点击记录可进行回放
        </div>

      </div>
    </div>
  );
};

export default HistoryPanel;
