
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
import { Play, Cpu, ArrowRight } from 'lucide-react';

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

const ZEN_QUOTES = [
  "胜负由心，落子无悔。",
  "Quiet the mind, and the soul will speak.",
  "In the midst of movement and chaos, keep stillness inside of you.",
  "The journey of a thousand miles begins with a single step.",
  "Empty your mind, be formless, shapeless — like water.",
  "棋道如人生，一步一修行。"
];

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
  const processedWinRef = useRef<string>("");

  const [pendingSkin, setPendingSkin] = useState<Skin | null>(null);
  const [quote] = useState(ZEN_QUOTES[Math.floor(Math.random() * ZEN_QUOTES.length)]);

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
      // Slight delay to allow UI to render the user's move first, then AI thinks
      const timer = setTimeout(() => {
        // Use a short timeout to let the browser paint the "thinking" state if needed
        setTimeout(() => {
            const move = getAIMove(game.board, Player.White, difficulty);
            if (move) {
                executeMove(move.r, move.c);
            }
            setIsThinking(false);
        }, 50);
      }, 500);
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
  
  // Start Screen Styling Helper with extended skin support
  const getStartScreenColors = () => {
    switch (skin) {
      case Skin.Dragon: return { 
        ring: 'border-amber-600/30', 
        glow: 'shadow-amber-500/20', 
        text: 'text-amber-100',
        title: 'from-yellow-300 via-amber-500 to-red-600'
      };
      case Skin.Celestia: return { 
        ring: 'border-yellow-200/40', 
        glow: 'shadow-yellow-100/30', 
        text: 'text-yellow-50',
        title: 'from-yellow-100 via-amber-200 to-yellow-400'
      };
      case Skin.Cyber: return { 
        ring: 'border-cyan-500/40', 
        glow: 'shadow-cyan-500/30', 
        text: 'text-cyan-100',
        title: 'from-cyan-300 via-blue-500 to-purple-600'
      };
      case Skin.Forest: return { 
        ring: 'border-emerald-500/30', 
        glow: 'shadow-emerald-500/20', 
        text: 'text-emerald-50',
        title: 'from-emerald-300 via-green-500 to-teal-600'
      };
      case Skin.Ocean: return { 
        ring: 'border-sky-500/30', 
        glow: 'shadow-sky-500/20', 
        text: 'text-sky-50',
        title: 'from-sky-300 via-blue-500 to-indigo-600'
      };
      case Skin.Sakura: return { 
        ring: 'border-pink-400/30', 
        glow: 'shadow-pink-400/20', 
        text: 'text-pink-50',
        title: 'from-pink-200 via-rose-400 to-red-500'
      };
      case Skin.Sunset: return { 
        ring: 'border-orange-500/30', 
        glow: 'shadow-orange-500/20', 
        text: 'text-orange-50',
        title: 'from-orange-200 via-red-400 to-stone-600'
      };
      case Skin.Nebula: return { 
        ring: 'border-purple-500/40', 
        glow: 'shadow-purple-500/30', 
        text: 'text-purple-100',
        title: 'from-purple-300 via-violet-500 to-indigo-600'
      };
      case Skin.Glacier: return { 
        ring: 'border-blue-300/30', 
        glow: 'shadow-blue-300/20', 
        text: 'text-blue-50',
        title: 'from-blue-100 via-sky-300 to-blue-600'
      };
      case Skin.Alchemy: return { 
        ring: 'border-amber-700/40', 
        glow: 'shadow-amber-600/30', 
        text: 'text-amber-100',
        title: 'from-amber-200 via-yellow-600 to-amber-800'
      };
      case Skin.Aurora: return { 
        ring: 'border-teal-400/30', 
        glow: 'shadow-teal-400/20', 
        text: 'text-teal-50',
        title: 'from-teal-200 via-cyan-400 to-emerald-500'
      };
      case Skin.Ink: return { 
        ring: 'border-stone-800/20', 
        glow: 'shadow-stone-500/10', 
        text: 'text-stone-800 dark:text-stone-200',
        title: 'from-stone-500 via-gray-700 to-black'
      };
      default: return { 
        ring: 'border-white/10', 
        glow: 'shadow-white/10', 
        text: 'text-white',
        title: 'from-stone-200 via-stone-400 to-stone-600'
      };
    }
  };
  const startStyles = getStartScreenColors();

  // Dynamic Title Class based on Skin
  let titleClass = `text-transparent bg-clip-text bg-gradient-to-r ${startStyles.title} drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]`;

  const statusClass = isDragon 
    ? "text-amber-500 font-serif tracking-widest font-bold" 
    : (theme === Theme.Day ? "text-stone-600" : "text-slate-300");
  
  const getModeTitle = () => {
    if (skin === Skin.Dragon) return '金龙至尊';
    if (skin === Skin.Celestia) return '天穹模式';
    if (skin === Skin.Cyber) return '赛博模式';
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

      {/* --- RE-DESIGNED START SCREEN --- */}
      <div 
        className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-all duration-1000 ease-in-out ${
          hasStarted ? 'opacity-0 pointer-events-none scale-150 blur-xl' : 'opacity-100 scale-100'
        }`}
      >
        {/* Background Overlay specifically for Start Screen readability */}
        <div className={`absolute inset-0 transition-colors duration-1000 ${
           skin === Skin.Ink && theme === Theme.Day ? 'bg-white/40' : 'bg-black/30'
        } backdrop-blur-[2px]`} />

        <div className="relative z-10 flex flex-col items-center">
            {/* Geometric Rotating Rings */}
            <div className={`absolute w-[60vh] h-[60vh] md:w-[600px] md:h-[600px] rounded-full border ${startStyles.ring} animate-[spin_30s_linear_infinite] pointer-events-none`} />
            <div className={`absolute w-[50vh] h-[50vh] md:w-[500px] md:h-[500px] rounded-full border border-dashed ${startStyles.ring} animate-[spin_40s_linear_infinite_reverse] opacity-60 pointer-events-none`} />
            <div className={`absolute w-[70vh] h-[70vh] md:w-[700px] md:h-[700px] rounded-full border ${startStyles.ring} opacity-20 animate-[pulse_5s_ease-in-out_infinite] pointer-events-none`} />

            {/* Main Typographic Lockup */}
            <div className="flex flex-col items-center text-center space-y-6 md:space-y-8 transform hover:scale-105 transition-transform duration-700">
               <h1 className={`text-7xl md:text-9xl font-serif font-bold tracking-widest ${titleClass} drop-shadow-2xl relative`}>
                  无双
                  <span className={`absolute -top-4 -right-4 text-xs md:text-sm font-sans font-normal opacity-50 tracking-normal border px-2 py-0.5 rounded-full ${startStyles.text} border-current`}>
                     Ver 2.0
                  </span>
               </h1>
               
               <div className={`h-px w-32 md:w-48 bg-current opacity-50 ${startStyles.text}`} />
               
               <p className={`text-lg md:text-2xl font-light tracking-[0.8em] uppercase ${startStyles.text} opacity-90`}>
                  Zen Gomoku
               </p>
            </div>

            {/* Start Interaction */}
            <div className="mt-20 md:mt-24 group relative">
               <button 
                  onClick={startGame}
                  className={`relative px-12 py-4 md:px-16 md:py-5 overflow-hidden rounded-full transition-all duration-500 border hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] ${
                    theme === Theme.Day && skin === Skin.Ink 
                      ? 'border-black/20 text-black hover:bg-black/5' 
                      : 'border-white/20 text-white hover:bg-white/10'
                  }`}
               >
                  <span className={`relative z-10 flex items-center gap-4 text-sm md:text-base font-medium tracking-[0.3em] ${startStyles.text}`}>
                     ENTER THE VOID 
                     <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </span>
               </button>
               
               {/* Pulsing Dot Indicator */}
               <div className={`absolute -bottom-12 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${startStyles.text}`}>
                  <div className="w-1 h-8 bg-current opacity-20" />
               </div>
            </div>
        </div>

        {/* Footer Quote */}
        <div className={`absolute bottom-8 md:bottom-12 max-w-md text-center px-6 ${startStyles.text} opacity-60 transition-opacity duration-1000 ${hasStarted ? 'opacity-0' : ''}`}>
           <p className="text-xs md:text-sm font-serif italic tracking-wide">
              "{quote}"
           </p>
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
