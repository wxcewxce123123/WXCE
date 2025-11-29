import React from 'react';
import { MatchRecord, Player, GameMode, Skin } from '../types';
import { X, Clock, Calendar, Sword, Cpu, Trophy } from 'lucide-react';

interface HistoryPanelProps {
  history: MatchRecord[];
  onClose: () => void;
  onLoadMatch: (record: MatchRecord) => void;
  skin: Skin;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onClose, onLoadMatch, skin }) => {
  const isDragon = skin === Skin.Dragon;
  const panelBg = isDragon 
    ? "bg-black/90 border-amber-500/30 text-amber-100" 
    : "bg-white/90 border-white/40 text-stone-800 dark:bg-slate-900/90 dark:text-slate-100";

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
      <div className={`w-full max-w-lg rounded-2xl shadow-2xl border backdrop-blur-md flex flex-col max-h-[80vh] overflow-hidden ${panelBg}`}>
        
        {/* Header */}
        <div className="p-5 border-b border-black/10 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold font-serif flex items-center gap-2">
              <Clock size={20} className={isDragon ? "text-amber-500" : "text-cyan-500"} />
              历史对局
            </h2>
            <p className="text-xs opacity-60 mt-1">Match History</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-black/10 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
          {history.length === 0 ? (
             <div className="text-center py-10 opacity-50 text-sm">暂无对局记录</div>
          ) : (
            history.map((record) => (
              <div 
                key={record.id}
                onClick={() => onLoadMatch(record)}
                className="p-3 rounded-lg cursor-pointer transition-all border border-transparent hover:bg-black/5 hover:border-black/10 flex items-center gap-4 bg-black/5"
              >
                {/* Winner Icon */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  record.winner === Player.Black ? 'bg-black text-white' : 'bg-white text-black border border-gray-200'
                }`}>
                  <Trophy size={16} />
                </div>

                <div className="flex-1 min-w-0">
                   <div className="flex items-center gap-2 mb-1">
                     <span className="font-bold text-sm truncate">
                        {record.winner === Player.Black ? '黑方胜' : '白方胜'}
                     </span>
                     <span className={`text-[10px] px-1.5 py-0.5 rounded ml-auto flex items-center gap-1 ${
                        isDragon ? 'bg-amber-900/50 text-amber-200' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
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
              </div>
            ))
          )}
        </div>
        
        <div className="p-4 border-t border-black/10 text-center text-xs opacity-50">
           点击记录可进行回放
        </div>

      </div>
    </div>
  );
};

export default HistoryPanel;
