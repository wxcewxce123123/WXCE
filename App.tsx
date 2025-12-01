
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Player, Theme, Skin, GameState, GameMode, Difficulty, AnalysisResult, MatchRecord } from './types';
import { createEmptyBoard, checkWin, getAIMove, analyzeMatch } from './utils/gameLogic';
import { audioController } from './utils/audio';
import Background from './components/Background';
import Board from './components/Board';
import Controls from './components/Controls';
import SkinTransition from './components/SkinTransition';
import AnalysisPanel from './components/AnalysisPanel';
import HistoryPanel from './components/HistoryPanel';
import { Play, Cpu } from 'lucide-react';

const loadStats = () => {
  try {
    const saved = localStorage.getItem('gomoku_stats');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return { wins: 0, losses: 0, games: 0 };
};

const saveStats = (stats: any) => {
  localStorage.setItem('gomoku_stats', JSON.stringify(stats));
};

const loadHistory = (): MatchRecord[] => {
  try {
    const saved = localStorage.getItem('gomoku_history');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return [];
};

const saveHistory = (history: MatchRecord[]) => {
  localStorage.setItem('gomoku_history', JSON.stringify(history));
};

function App() {
  const [theme, setTheme] = useState<Theme>(Theme.Day);
  const [skin, setSkin] = useState<Skin>(Skin.Classic);
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.PvP);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.Hard);
  const [hasStarted, setHasStarted] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isReplaying, setIsReplaying] = useState(false);
  const [lastMove, setLastMove] = useState<{r: number, c: number} | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hintPos, setHintPos] = useState<{r: number, c: number} | null>(null);
  const [stats, setStats] = useState(loadStats());
  const [matchHistory, setMatchHistory] = useState<MatchRecord[]>(loadHistory());
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  
  const [undoTrigger, setUndoTrigger] = useState<{r: number, c: number, ts: number}[] | null>(null);
  
  const [blackTime, setBlackTime] = useState(600);
  const [whiteTime, setWhiteTime] = useState(600);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const replayIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Track processed win to avoid duplicate stats updates in StrictMode
  // We use a unique ID derived from move history length + last move coordinate to be very specific
  const processedWinRef = useRef<string>("");

  const [pendingSkin, setPendingSkin] = useState<Skin | null>(null);

  const [game, setGame] = useState<GameState>({
    board: createEmptyBoard(),
    currentPlayer: Player.Black,
    winner: null,
    winningLine: null,
    history: [],
    moveHistory: []
  });

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      const next = !prev;
      audioController.toggle(next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (hasStarted && !game.winner && !isThinking && !isReplaying) {
      timerRef.current = setInterval(() => {
        if (game.currentPlayer === Player.Black) {
          setBlackTime(t => Math.max(0, t - 1));
        } else {
          setWhiteTime(t => Math.max(0, t - 1));
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [hasStarted, game.winner, game.currentPlayer, isThinking, isReplaying]);

  // Handle Win Side Effects (Stats, Audio, History)
  useEffect(() => {
    if (game.winner) {
      const winId = `${game.moveHistory.length}`;
      
      if (processedWinRef.current !== winId) {
        processedWinRef.current = winId;
        audioController.playWin();

        if (gameMode === GameMode.PvE) {
          setStats(prevStats => {
            const newStats = { ...prevStats, games: prevStats.games + 1 };
            if (game.winner === Player.Black) newStats.wins++;
            else newStats.losses++;
            saveStats(newStats);
            return newStats;
          });
        }

        const record: MatchRecord = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          mode: gameMode,
          difficulty: gameMode === GameMode.PvE ? difficulty : undefined,
          winner: game.winner,
          moves: game.moveHistory.length,
          moveHistory: game.moveHistory,
          skin: skin
        };

        setMatchHistory(prevH => {
          const newH = [record, ...prevH].slice(0, 50);
          saveHistory(newH);
          return newH;
        });
      }
    }
  }, [game.winner, game.moveHistory, gameMode, difficulty, skin]);

  const executeMove = useCallback((row: number, col: number) => {
    setGame(prevGame => {
      if (prevGame.board[row][col] !== Player.None || prevGame.winner) return prevGame;

      const newBoard = prevGame.board.map(r => [...r]);
      newBoard[row][col] = prevGame.currentPlayer;

      const winningLine = checkWin(newBoard, row, col, prevGame.currentPlayer);
      
      const newHistory = [...prevGame.history, prevGame.board];
      const newMoveHistory = [...prevGame.moveHistory, { r: row, c: col, player: prevGame.currentPlayer }];
      
      if (newHistory.length > 50) newHistory.shift(); 

      setLastMove({ r: row, c: col });
      setHintPos(null);
      audioController.playStone(skin);

      return {
        board: newBoard,
        currentPlayer: prevGame.currentPlayer === Player.Black ? Player.White : Player.Black,
        winner: winningLine ? prevGame.currentPlayer : null,
        winningLine: winningLine,
        history: newHistory,
        moveHistory: newMoveHistory
      };
    });
  }, [skin]);

  // AI Turn
  useEffect(() => {
    if (
      gameMode === GameMode.PvE && 
      game.currentPlayer === Player.White && 
      !game.winner &&
      hasStarted &&
      !isReplaying
    ) {
      setIsThinking(true);
      const timer = setTimeout(() => {
        const move = getAIMove(game.board, Player.White, difficulty);
        if (move) {
          executeMove(move.r, move.c);
        }
        setIsThinking(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [game.currentPlayer, game.winner, gameMode, difficulty, game.board, hasStarted, executeMove, isReplaying]);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (isThinking || isReplaying) return;
    if (gameMode === GameMode.PvE && game.currentPlayer === Player.White) return;
    executeMove(row, col);
  }, [isThinking, isReplaying, gameMode, game.currentPlayer, executeMove]);

  const getHint = useCallback(() => {
     if (game.winner || isThinking || isReplaying) return;
     audioController.playUI('click');
     const move = getAIMove(game.board, game.currentPlayer, Difficulty.Hard);
     if (move) setHintPos(move);
  }, [game.winner, isThinking, isReplaying, game.board, game.currentPlayer]);

  const resetGame = useCallback(() => {
    audioController.playUI('click');
    setGame({
      board: createEmptyBoard(),
      currentPlayer: Player.Black,
      winner: null,
      winningLine: null,
      history: [],
      moveHistory: []
    });
    setLastMove(null);
    setHintPos(null);
    setBlackTime(600);
    setWhiteTime(600);
    setIsReplaying(false);
    setAnalysisResult(null);
    processedWinRef.current = ""; // Reset win tracking
    if (replayIntervalRef.current) clearInterval(replayIntervalRef.current);
  }, []);

  const handleAnalyze = useCallback(() => {
    if (!game.winner && !game.history.length) return;
    audioController.playUI('click');
    setIsThinking(true);
    setTimeout(() => {
      const result = analyzeMatch(game.moveHistory);
      setAnalysisResult(result);
      setIsThinking(false);
    }, 500);
  }, [game.winner, game.history.length, game.moveHistory]);

  const handleJumpToMove = useCallback((moveIndex: number) => {
    audioController.playUI('click');
    setAnalysisResult(null);
    
    const movesToReplay = game.moveHistory.slice(0, moveIndex + 1);
    const tempBoard = createEmptyBoard();
    movesToReplay.forEach(m => { tempBoard[m.r][m.c] = m.player; });

    const last = movesToReplay[movesToReplay.length - 1];
    const nextPlayer = last.player === Player.Black ? Player.White : Player.Black;

    setGame(prev => ({
      ...prev,
      board: tempBoard,
      currentPlayer: nextPlayer,
      winner: null,
      winningLine: null 
    }));
    setLastMove({ r: last.r, c: last.c });
  }, [game.moveHistory]);

  const startReplayInternal = useCallback((historyToPlay: typeof game.moveHistory, finalWinner: Player | null) => {
    setGame(prev => ({
      ...prev,
      board: createEmptyBoard(),
      currentPlayer: Player.Black,
      winner: null,
      winningLine: null,
      moveHistory: historyToPlay
    }));
    setLastMove(null);

    let moveIndex = 0;
    if (replayIntervalRef.current) clearInterval(replayIntervalRef.current);

    replayIntervalRef.current = setInterval(() => {
      if (moveIndex >= historyToPlay.length) {
        if (replayIntervalRef.current) clearInterval(replayIntervalRef.current);
        setIsReplaying(false);
        if (historyToPlay.length > 0) {
            const last = historyToPlay[historyToPlay.length - 1];
             setGame(prev => {
                const line = checkWin(prev.board, last.r, last.c, last.player);
                return { ...prev, winner: finalWinner, winningLine: line };
             });
             setLastMove({r: last.r, c: last.c});
        }
        return;
      }

      const move = historyToPlay[moveIndex];
      setGame(prev => {
          const newBoard = prev.board.map(row => [...row]);
          newBoard[move.r][move.c] = move.player;
          return {
              ...prev,
              board: newBoard,
              currentPlayer: move.player === Player.Black ? Player.White : Player.Black
          };
      });
      setLastMove({r: move.r, c: move.c});
      audioController.playStone(skin);
      moveIndex++;
    }, 600);
  }, [skin]);

  const handleLoadMatch = useCallback((record: MatchRecord) => {
    setShowHistory(false);
    audioController.playUI('click');
    setSkin(record.skin);
    setGameMode(record.mode);
    if (record.difficulty) setDifficulty(record.difficulty);

    setGame({
      board: createEmptyBoard(),
      currentPlayer: Player.Black,
      winner: record.winner,
      winningLine: null,
      history: [],
      moveHistory: record.moveHistory
    });

    setIsReplaying(true);
    startReplayInternal(record.moveHistory, record.winner);
  }, [startReplayInternal]);

  const startReplay = useCallback(() => {
    if (isReplaying || game.moveHistory.length === 0) return;
    audioController.playUI('click');
    setIsReplaying(true);
    startReplayInternal(game.moveHistory, game.winner);
  }, [isReplaying, game.moveHistory, game.winner, startReplayInternal]);

  const undoMove = useCallback(() => {
    if (game.history.length === 0 || game.winner || isReplaying) return;
    audioController.playUI('click');
    
    let steps = 1;
    if (gameMode === GameMode.PvE && game.currentPlayer === Player.Black) {
      if (game.history.length >= 2) steps = 2;
    }

    const targetHistoryIndex = game.history.length - steps;
    if (targetHistoryIndex < 0) return;

    const movesToRemove = game.moveHistory.slice(-steps);
    // Add unique ID to trigger effect even for same coordinates if needed, 
    // but timestamp should be enough.
    setUndoTrigger(movesToRemove.map(m => ({ r: m.r, c: m.c, ts: Date.now() })));

    const previousBoard = game.history[targetHistoryIndex];
    const nextPlayer = steps === 2 ? game.currentPlayer : (game.currentPlayer === Player.Black ? Player.White : Player.Black);

    const newMoveHistory = game.moveHistory.slice(0, -steps);
    if (newMoveHistory.length > 0) {
      const prevMove = newMoveHistory[newMoveHistory.length - 1];
      setLastMove({ r: prevMove.r, c: prevMove.c });
    } else {
      setLastMove(null);
    }
    setHintPos(null);

    setGame(prev => ({
      ...prev,
      board: previousBoard,
      currentPlayer: nextPlayer,
      winner: null,
      winningLine: null,
      history: prev.history.slice(0, -steps),
      moveHistory: newMoveHistory
    }));
  }, [game.history, game.winner, isReplaying, gameMode, game.currentPlayer, game.moveHistory]);

  const toggleTheme = useCallback(() => {
    audioController.playUI('click');
    setTheme(prev => prev === Theme.Day ? Theme.Night : Theme.Day);
  }, []);

  const startGame = useCallback(() => {
    audioController.toggle(true);
    audioController.playUI('click');
    setHasStarted(true);
  }, []);

  const handleGameModeChange = useCallback((mode: GameMode) => {
    audioController.playUI('click');
    setGameMode(mode);
    resetGame();
  }, [resetGame]);

  const handleSkinChangeRequest = useCallback((newSkin: Skin) => {
    audioController.playUI('click');
    setSkin(current => {
       if (current === newSkin) return current;
       setPendingSkin(newSkin);
       return current;
    });
  }, []);

  const handleTransitionPeak = useCallback(() => {
    setPendingSkin(currentPending => {
      if (currentPending) {
        setSkin(currentPending);
        const s = currentPending;
        if (s === Skin.Dragon || s === Skin.Nebula || s === Skin.Ocean || s === Skin.Cyber || s === Skin.Alchemy || s === Skin.Aurora) {
          setTheme(Theme.Night);
        } else if (s === Skin.Sakura || s === Skin.Glacier || s === Skin.Ink || s === Skin.Forest || s === Skin.Sunset || s === Skin.Celestia) {
          setTheme(Theme.Day);
        }
      }
      return currentPending;
    });
  }, []);

  const handleTransitionComplete = useCallback(() => {
    setPendingSkin(null);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isDragon = skin === Skin.Dragon;
  let titleClass = "";
  let glowClass = "drop-shadow-[0_0_25px_rgba(245,158,11,0.8)]";
  
  if (isDragon) {
    titleClass = `text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-amber-500 to-red-600 ${glowClass}`;
  } else if (skin === Skin.Forest) {
    titleClass = `text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-700 drop-shadow-sm`;
  } else if (skin === Skin.Ocean) {
    titleClass = `text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-700 drop-shadow-[0_0_10px_rgba(56,189,248,0.5)]`;
  } else if (skin === Skin.Sakura) {
    titleClass = `text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-rose-500 drop-shadow-sm`;
  } else if (skin === Skin.Nebula) {
    titleClass = `text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600 drop-shadow-[0_0_10px_rgba(167,139,250,0.5)]`;
  } else if (skin === Skin.Sunset) {
    titleClass = `text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-600 to-red-800 drop-shadow-sm`;
  } else if (skin === Skin.Glacier) {
    titleClass = `text-transparent bg-clip-text bg-gradient-to-r from-sky-200 to-blue-400 drop-shadow-[0_0_10px_rgba(255,255,255,0.6)]`;
  } else if (skin === Skin.Cyber) {
    titleClass = `text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 drop-shadow-[0_0_10px_cyan]`;
  } else if (skin === Skin.Ink) {
    titleClass = "text-transparent bg-clip-text bg-gradient-to-b from-gray-700 to-black drop-shadow-none";
  } else if (skin === Skin.Alchemy) {
    titleClass = `text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-yellow-800 drop-shadow-sm`;
  } else if (skin === Skin.Aurora) {
    titleClass = `text-transparent bg-clip-text bg-gradient-to-r from-green-300 via-cyan-400 to-blue-500 drop-shadow-[0_0_15px_rgba(34,211,238,0.6)]`;
  } else if (skin === Skin.Celestia) {
    titleClass = `text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]`;
  } else {
    titleClass = theme === Theme.Day 
      ? "text-transparent bg-clip-text bg-gradient-to-r from-stone-600 to-stone-900 drop-shadow-sm" 
      : "text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 to-purple-300 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]";
  }

  const statusClass = isDragon 
    ? "text-amber-500 font-serif tracking-widest font-bold" 
    : (theme === Theme.Day ? "text-stone-600" : "text-slate-300");
  
  const getModeTitle = () => {
    if (skin === Skin.Dragon) return '金龙至尊';
    if (skin === Skin.Forest) return '幽篁模式';
    if (skin === Skin.Ocean) return '沧海模式';
    if (skin === Skin.Sakura) return '落樱模式';
    if (skin === Skin.Nebula) return '星云模式';
    if (skin === Skin.Sunset) return '大漠模式';
    if (skin === Skin.Glacier) return '冰川模式';
    if (skin === Skin.Cyber) return '赛博模式';
    if (skin === Skin.Ink) return '水墨模式';
    if (skin === Skin.Alchemy) return '炼金模式';
    if (skin === Skin.Aurora) return '极光模式';
    if (skin === Skin.Celestia) return '天穹模式';
    return '五子连珠';
  };

  return (
    <div className={`relative min-h-[100dvh] w-full flex flex-col items-center justify-start md:justify-center overflow-x-hidden pt-6 pb-6 md:py-0`}>
      <Background theme={theme} skin={skin} />

      {pendingSkin && (
        <SkinTransition 
          targetSkin={pendingSkin} 
          onPeak={handleTransitionPeak} 
          onComplete={handleTransitionComplete} 
        />
      )}
      
      {analysisResult && (
        <AnalysisPanel 
          analysis={analysisResult} 
          skin={skin}
          onClose={() => setAnalysisResult(null)}
          onJumpToMove={handleJumpToMove}
        />
      )}

      {showHistory && (
        <HistoryPanel
          history={matchHistory}
          skin={skin}
          onClose={() => setShowHistory(false)}
          onLoadMatch={handleLoadMatch}
          onClearHistory={() => {
            setMatchHistory([]);
            saveHistory([]);
          }}
        />
      )}

      <div 
        className={`absolute inset-0 z-50 flex flex-col items-center justify-center transition-all duration-1000 ${
          hasStarted ? 'opacity-0 pointer-events-none scale-110' : 'opacity-100 scale-100'
        }`}
      >
        <div className="text-center space-y-6 md:space-y-8 p-6 md:p-10 rounded-3xl backdrop-blur-sm bg-white/10 border border-white/20 shadow-2xl mx-4">
          <h1 className={`text-5xl md:text-8xl font-bold font-serif tracking-wider ${titleClass} animate-[float_4s_ease-in-out_infinite]`}>
            五子连珠
          </h1>
          <p className={`text-base md:text-xl tracking-[0.5em] font-light ${statusClass}`}>
            ZEN GOMOKU
          </p>
          
          <button 
            onClick={startGame}
            className={`group relative px-8 py-3 md:px-10 md:py-4 text-lg md:text-xl font-bold tracking-widest uppercase transition-all duration-300 rounded-full overflow-hidden ${
              theme === Theme.Day 
                ? 'bg-stone-800 text-white hover:bg-stone-700 shadow-xl hover:shadow-2xl' 
                : 'bg-transparent border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black shadow-[0_0_15px_rgba(34,211,238,0.4)]'
            }`}
          >
            <span className="relative z-10 flex items-center gap-3">
              <Play className="w-5 h-5 fill-current" /> 进入对弈
            </span>
          </button>
        </div>
      </div>

      <div 
        className={`relative z-10 w-full max-w-7xl px-2 sm:px-4 flex flex-col md:flex-row items-center md:items-start justify-center gap-4 md:gap-12 transition-all duration-1000 delay-300 ${
          hasStarted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'
        }`}
      >
        <div className="flex flex-col items-center gap-2 md:gap-6 w-full max-w-[650px] shrink-0">
          
          <div className="text-center space-y-1 md:space-y-2 mt-1 md:mt-0 relative w-full flex flex-col items-center">
            <h2 className={`text-2xl md:text-3xl font-bold font-serif tracking-wide ${titleClass} transition-all duration-700 ${game.winner ? 'opacity-0 scale-95' : 'opacity-80'}`}>
              {getModeTitle()}
            </h2>

            <div className={`text-sm md:text-lg font-medium tracking-widest ${statusClass} h-6 md:h-8 transition-all duration-500 flex items-center justify-center gap-6 ${game.winner ? 'opacity-0' : 'opacity-100'}`}>
              <div className={`flex items-center gap-2 ${game.currentPlayer === Player.Black ? 'scale-110 font-bold opacity-100' : 'opacity-60 scale-90'} transition-all`}>
                <span className={`inline-block w-3 h-3 md:w-4 md:h-4 rounded-full bg-black shadow-sm ${isDragon ? 'border border-amber-500' : ''}`}></span>
                <span className="font-mono">{formatTime(blackTime)}</span>
              </div>

              <div className="flex items-center gap-2">
                {isThinking ? (
                    <span className="flex items-center gap-1 text-xs md:text-sm animate-pulse ml-2 opacity-70">
                       <Cpu size={14} /> 思考中...
                    </span>
                ) : (
                    <span>{game.currentPlayer === Player.Black ? '黑方落子' : '白方落子'}</span>
                )}
              </div>

               <div className={`flex items-center gap-2 ${game.currentPlayer === Player.White ? 'scale-110 font-bold opacity-100' : 'opacity-60 scale-90'} transition-all`}>
                <span className="font-mono">{formatTime(whiteTime)}</span>
                <span className={`inline-block w-3 h-3 md:w-4 md:h-4 rounded-full bg-white shadow-sm border border-gray-300`}></span>
              </div>
            </div>
          </div>

          <div className="w-[95vw] md:w-full flex justify-center">
            <Board 
              board={game.board}
              onCellClick={handleCellClick}
              winningLine={game.winningLine}
              theme={theme}
              skin={skin}
              currentPlayer={game.currentPlayer}
              isGameOver={!!game.winner}
              lastMove={lastMove}
              hintPos={hintPos}
              undoTrigger={undoTrigger}
            />
          </div>
        </div>

        <div className={`flex items-center w-[95vw] md:w-auto md:h-[600px] md:sticky md:top-10 transition-all duration-1000`}>
           <Controls 
             theme={theme}
             skin={skin}
             gameMode={gameMode}
             difficulty={difficulty}
             soundEnabled={soundEnabled}
             stats={stats}
             toggleTheme={toggleTheme}
             toggleSound={toggleSound}
             onHint={getHint}
             onShowHistory={() => { audioController.playUI('click'); setShowHistory(true); }}
             setSkin={handleSkinChangeRequest} 
             setGameMode={handleGameModeChange}
             setDifficulty={setDifficulty}
             onReset={resetGame}
             onUndo={undoMove}
             canUndo={game.history.length > 0 && !game.winner && !isThinking && !isReplaying}
             onReplay={startReplay}
             onAnalyze={handleAnalyze}
             isGameOver={!!game.winner}
             isReplaying={isReplaying}
           />
        </div>
      </div>
    </div>
  );
}

export default App;
