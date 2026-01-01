
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Player, Theme, Skin, GameState, GameMode, Difficulty, AnalysisResult, MatchRecord, GameSettings, PuzzleState } from './types';
import { createEmptyBoard, checkWin, getAIMove, analyzeMatch, detectOpening, generatePuzzle, reconstructBoard } from './utils/gameLogic';
import { audioController } from './utils/audio';
import Background from './components/Background';
import Board, { BoardRef } from './components/Board';
import Controls from './components/Controls';
import SkinTransition from './components/SkinTransition';
import AnalysisPanel from './components/AnalysisPanel';
import HistoryPanel from './components/HistoryPanel';
import GameOverModal from './components/GameOverModal';
import { Play, Cpu, ArrowRight, Minimize2, Maximize2, BookOpen, Fingerprint, Activity, Aperture, Hexagon, Circle, Triangle, Trophy, Flame } from 'lucide-react';

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

// --- Theme Configuration ---
// 'dynamic': Allows user toggle
// 'day': Locked to Day mode
// 'night': Locked to Night mode
const SKIN_THEME_CONFIG: Record<Skin, 'dynamic' | 'day' | 'night'> = {
  [Skin.Classic]: 'dynamic',
  [Skin.Ink]: 'dynamic',
  [Skin.Glacier]: 'dynamic',
  [Skin.Sakura]: 'day',      // Locked to Day for best visuals
  [Skin.Celestia]: 'day',    // Locked to Day
  [Skin.Forest]: 'night',    // Locked to Night for atmosphere
  [Skin.Ocean]: 'night',     // Locked to Night
  [Skin.Sunset]: 'night',    // Locked to Night (Dark orange vibe)
  [Skin.Dragon]: 'night',
  [Skin.Cyber]: 'night',
  [Skin.Nebula]: 'night',
  [Skin.Alchemy]: 'night',
  [Skin.Aurora]: 'night',
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
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false); 
  const [isGameOverModalVisible, setIsGameOverModalVisible] = useState(true); 
  
  const [viewingIndex, setViewingIndex] = useState<number | null>(null);
  const [previewMoveIndex, setPreviewMoveIndex] = useState<number | null>(null); // Hover preview from chart

  const [showHistory, setShowHistory] = useState(false);
  
  const [undoTrigger, setUndoTrigger] = useState<{r: number, c: number, ts: number}[] | null>(null);
  
  const [settings, setSettings] = useState<GameSettings>({ timeLimit: 600, zenMode: false });
  const [blackTime, setBlackTime] = useState(600);
  const [whiteTime, setWhiteTime] = useState(600);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const replayIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const processedWinRef = useRef<string>("");

  const [pendingSkin, setPendingSkin] = useState<Skin | null>(null);
  const [quote] = useState(ZEN_QUOTES[Math.floor(Math.random() * ZEN_QUOTES.length)]);

  // Puzzle State
  const [currentPuzzle, setCurrentPuzzle] = useState<PuzzleState | null>(null);

  const [game, setGame] = useState<GameState>({
    board: createEmptyBoard(),
    currentPlayer: Player.Black,
    winner: null,
    winningLine: null,
    history: [],
    moveHistory: [],
    openingName: undefined
  });

  const boardRef = useRef<BoardRef>(null);

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      const next = !prev;
      audioController.toggle(next);
      return next;
    });
  }, []);

  const setTimeLimit = useCallback((limit: number) => {
      setSettings(prev => ({ ...prev, timeLimit: limit }));
      if (!hasStarted) {
          setBlackTime(limit === 0 ? 9999 : limit);
          setWhiteTime(limit === 0 ? 9999 : limit);
      }
  }, [hasStarted]);

  // Ambient Sound Logic
  useEffect(() => {
    if (soundEnabled && (hasStarted || settings.zenMode)) {
        audioController.startAmbient(skin);
    } else {
        audioController.stopAmbient();
    }
  }, [skin, soundEnabled, hasStarted, settings.zenMode]);

  useEffect(() => {
    if (hasStarted && !game.winner && !isThinking && !isReplaying && settings.timeLimit > 0 && gameMode !== GameMode.Puzzle) {
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
  }, [hasStarted, game.winner, game.currentPlayer, isThinking, isReplaying, settings.timeLimit, gameMode]);

  useEffect(() => {
    if (game.winner) {
      setIsGameOverModalVisible(true);
      const winId = `${game.moveHistory.length}-${Date.now()}`;
      
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

        if (gameMode !== GameMode.Puzzle) {
             const record: MatchRecord = {
              id: Date.now().toString(),
              timestamp: Date.now(),
              mode: gameMode,
              difficulty: gameMode === GameMode.PvE ? difficulty : undefined,
              winner: game.winner,
              moves: game.moveHistory.length,
              moveHistory: game.moveHistory,
              skin: skin,
              timeLimit: settings.timeLimit
            };

            setMatchHistory(prevH => {
              const newH = [record, ...prevH].slice(0, 50);
              saveHistory(newH);
              return newH;
            });
        }
      }
    } else {
      setIsGameOverModalVisible(false);
    }
  }, [game.winner, game.moveHistory, gameMode, difficulty, skin, settings.timeLimit, currentPuzzle]);

  const generateNewPuzzle = useCallback(() => {
      // Use current difficulty or default to Medium for puzzles if not set
      const puzzleDiff = difficulty || Difficulty.Medium;
      const puzzle = generatePuzzle(puzzleDiff);
      setCurrentPuzzle(puzzle);
      
      const lastM = puzzle.moveHistory[puzzle.moveHistory.length-1];

      setGame({
          board: puzzle.board,
          currentPlayer: puzzle.nextPlayer,
          winner: null,
          winningLine: null,
          history: [puzzle.board], // Simplified history for puzzle start
          moveHistory: puzzle.moveHistory,
          openingName: "残局挑战"
      });
      setLastMove(lastM ? {r: lastM.r, c: lastM.c} : null);
      processedWinRef.current = ""; 
      setUndoTrigger(puzzle.moveHistory.slice(-3).map(m => ({r:m.r, c:m.c, ts: Date.now()}))); 
  }, [difficulty]);

  const executeMove = useCallback((row: number, col: number) => {
    if (viewingIndex !== null) {
       setAnalysisResult(null);
       setIsAnalysisOpen(false);
       setViewingIndex(null);
    } else {
       setAnalysisResult(null);
       setIsAnalysisOpen(false);
    }

    setGame(prevGame => {
      if (prevGame.board[row][col] !== Player.None || prevGame.winner) return prevGame;

      let currentHistory = prevGame.history;
      let currentMoveHistory = prevGame.moveHistory;

      if (viewingIndex !== null) {
         currentHistory = prevGame.history.slice(0, viewingIndex + 1);
         currentMoveHistory = prevGame.moveHistory.slice(0, viewingIndex + 1);
      }

      const newBoard = prevGame.board.map(r => [...r]);
      newBoard[row][col] = prevGame.currentPlayer;

      const winningLine = checkWin(newBoard, row, col, prevGame.currentPlayer);
      
      const newHistory = [...currentHistory, prevGame.board];
      const newMoveHistory = [...currentMoveHistory, { r: row, c: col, player: prevGame.currentPlayer }];
      
      if (newHistory.length > 50) newHistory.shift(); 

      setLastMove({ r: row, c: col });
      setHintPos(null);
      audioController.playStone(skin);
      
      let openingName = prevGame.openingName;
      if (!openingName && newMoveHistory.length === 3) {
          openingName = detectOpening(newMoveHistory);
      }

      return {
        board: newBoard,
        currentPlayer: prevGame.currentPlayer === Player.Black ? Player.White : Player.Black,
        winner: winningLine ? prevGame.currentPlayer : null,
        winningLine: winningLine,
        history: newHistory,
        moveHistory: newMoveHistory,
        openingName
      };
    });
  }, [skin, viewingIndex]);

  // AI Turn (PvE & Puzzle)
  useEffect(() => {
    if (
      !game.winner &&
      hasStarted &&
      !isReplaying &&
      viewingIndex === null
    ) {
        let shouldAIPlay = false;
        let aiDiff = difficulty;

        if (gameMode === GameMode.PvE && game.currentPlayer === Player.White) {
            shouldAIPlay = true;
        } else if (gameMode === GameMode.Puzzle && currentPuzzle && game.currentPlayer !== currentPuzzle.nextPlayer) {
             if (game.currentPlayer !== currentPuzzle.nextPlayer) {
                 shouldAIPlay = true;
                 aiDiff = difficulty === Difficulty.Extreme ? Difficulty.Extreme : Difficulty.Hard;
            }
        }

        if (shouldAIPlay) {
            setIsThinking(true);
            const thinkDelay = aiDiff === Difficulty.Extreme ? 100 : 500;
            
            const timer = setTimeout(() => {
                setTimeout(() => {
                    const move = getAIMove(game.board, game.currentPlayer, aiDiff);
                    if (move) {
                        executeMove(move.r, move.c);
                    }
                    setIsThinking(false);
                }, 50);
            }, thinkDelay);
            return () => clearTimeout(timer);
        }
    }
  }, [game.currentPlayer, game.winner, gameMode, difficulty, game.board, hasStarted, executeMove, isReplaying, viewingIndex, currentPuzzle]);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (isThinking || isReplaying) return;
    if (gameMode === GameMode.PvE && game.currentPlayer === Player.White && viewingIndex === null) return;
    if (gameMode === GameMode.Puzzle && currentPuzzle && game.currentPlayer !== currentPuzzle.nextPlayer) return;

    executeMove(row, col);
  }, [isThinking, isReplaying, gameMode, game.currentPlayer, executeMove, viewingIndex, currentPuzzle]);

  const getHint = useCallback(() => {
     if (game.winner || isThinking || isReplaying) return;
     audioController.playUI('click');
     const move = getAIMove(game.board, game.currentPlayer, Difficulty.Hard);
     if (move) setHintPos(move);
  }, [game.winner, isThinking, isReplaying, game.board, game.currentPlayer]);

  // FIX: Added optional overrideMode to handle synchronous state updates during mode switching
  const resetGame = useCallback((overrideMode?: GameMode) => {
    const targetMode = overrideMode !== undefined ? overrideMode : gameMode;

    audioController.playUI('click');
    setLastMove(null);
    setHintPos(null);
    setBlackTime(settings.timeLimit === 0 ? 9999 : settings.timeLimit);
    setWhiteTime(settings.timeLimit === 0 ? 9999 : settings.timeLimit);
    setIsReplaying(false);
    setAnalysisResult(null);
    setIsAnalysisOpen(false);
    setIsGameOverModalVisible(false);
    setViewingIndex(null); 
    setPreviewMoveIndex(null);
    processedWinRef.current = ""; 
    setIsThinking(false);
    
    if (replayIntervalRef.current) clearInterval(replayIntervalRef.current);

    if (targetMode === GameMode.Puzzle) {
        generateNewPuzzle();
    } else {
        // Critical: Ensure puzzle state is completely cleared when switching to non-puzzle modes
        setCurrentPuzzle(null); 
        setGame({
          board: createEmptyBoard(),
          currentPlayer: Player.Black,
          winner: null,
          winningLine: null,
          history: [],
          moveHistory: [],
          openingName: undefined
        });
    }
  }, [settings.timeLimit, gameMode, generateNewPuzzle]);

  const handleAnalyze = useCallback(() => {
    if (analysisResult) {
      setIsAnalysisOpen(true);
      return;
    }
    if (!game.winner && !game.history.length && !currentPuzzle) return;
    audioController.playUI('click');
    setIsThinking(true);
    setTimeout(() => {
      const result = analyzeMatch(game.moveHistory);
      setAnalysisResult(result);
      setIsAnalysisOpen(true);
      setIsThinking(false);
    }, 500);
  }, [game.winner, game.history.length, game.moveHistory, analysisResult, currentPuzzle]);

  const handleScreenshot = useCallback(async () => {
    if (boardRef.current) {
        const dataUrl = await boardRef.current.captureScreenshot();
        if (dataUrl) {
            const link = document.createElement('a');
            link.download = `zen-gomoku-${Date.now()}.png`;
            link.href = dataUrl;
            link.click();
        }
    }
  }, []);

  const handleJumpToMove = useCallback((moveIndex: number) => {
    audioController.playUI('click');
    setIsAnalysisOpen(false);
    setIsGameOverModalVisible(false);
    setViewingIndex(moveIndex);
    setPreviewMoveIndex(null); // Clear preview

    const movesToReplay = game.moveHistory.slice(0, moveIndex + 1);
    const tempBoard = reconstructBoard(movesToReplay);

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

  const handlePreviewMove = useCallback((moveIndex: number | null) => {
    setPreviewMoveIndex(moveIndex);
  }, []);

  // Compute which board to display (Game, Time Travel, or Chart Preview)
  const displayBoard = useMemo(() => {
      if (previewMoveIndex !== null) {
          const moves = game.moveHistory.slice(0, previewMoveIndex + 1);
          return reconstructBoard(moves);
      }
      return game.board;
  }, [previewMoveIndex, game.board, game.moveHistory]);

  const displayLastMove = useMemo(() => {
      if (previewMoveIndex !== null) {
          const m = game.moveHistory[previewMoveIndex];
          return m ? { r: m.r, c: m.c } : null;
      }
      return lastMove;
  }, [previewMoveIndex, game.moveHistory, lastMove]);

  const startReplayInternal = useCallback((historyToPlay: typeof game.moveHistory, finalWinner: Player | null) => {
    setGame(prev => ({
      ...prev,
      board: createEmptyBoard(),
      currentPlayer: Player.Black,
      winner: null,
      winningLine: null,
      moveHistory: historyToPlay,
      openingName: undefined
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
    setAnalysisResult(null); 
    setIsAnalysisOpen(false);
    setViewingIndex(null);
    setIsGameOverModalVisible(false);

    setGame({
      board: createEmptyBoard(),
      currentPlayer: Player.Black,
      winner: record.winner,
      winningLine: null,
      history: [],
      moveHistory: record.moveHistory,
      openingName: undefined
    });

    setIsReplaying(true);
    startReplayInternal(record.moveHistory, record.winner);
  }, [startReplayInternal]);

  const startReplay = useCallback(() => {
    if (isReplaying || game.moveHistory.length === 0) return;
    audioController.playUI('click');
    setIsReplaying(true);
    setIsGameOverModalVisible(false); 
    startReplayInternal(game.moveHistory, game.winner);
  }, [isReplaying, game.moveHistory, game.winner, startReplayInternal]);

  const undoMove = useCallback(() => {
    if (game.history.length === 0 || game.winner || isReplaying || viewingIndex !== null) return;
    audioController.playUI('click');
    setAnalysisResult(null);
    setIsAnalysisOpen(false);
    
    let steps = 1;
    // In PvE or Puzzle mode, undo 2 steps (player + AI)
    if ((gameMode === GameMode.PvE && game.currentPlayer === Player.Black) || (gameMode === GameMode.Puzzle && currentPuzzle)) {
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
  }, [game.history, game.winner, isReplaying, gameMode, game.currentPlayer, game.moveHistory, viewingIndex, currentPuzzle]);

  const toggleTheme = useCallback(() => {
    // Only allow toggling if skin is dynamic
    if (SKIN_THEME_CONFIG[skin] === 'dynamic') {
      audioController.playUI('click');
      setTheme(prev => prev === Theme.Day ? Theme.Night : Theme.Day);
    }
  }, [skin]);

  const startGame = useCallback(() => {
    audioController.toggle(true);
    audioController.playUI('click');
    setHasStarted(true);
    if (gameMode === GameMode.Puzzle && !currentPuzzle) {
        generateNewPuzzle();
    }
  }, [gameMode, currentPuzzle, generateNewPuzzle]);

  // FIX: Explicitly pass mode to resetGame to avoid race conditions with state updates
  const handleGameModeChange = useCallback((mode: GameMode) => {
    // audioController.playUI('click'); // removed double click
    setGameMode(mode);
    setAnalysisResult(null);
    setIsAnalysisOpen(false);
    
    resetGame(mode);
  }, [resetGame]);

  const handleNextPuzzle = useCallback(() => {
      generateNewPuzzle();
  }, [generateNewPuzzle]);

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
        const config = SKIN_THEME_CONFIG[currentPending];
        if (config === 'day') setTheme(Theme.Day);
        else if (config === 'night') setTheme(Theme.Night);
        // If dynamic, keep current theme
      }
      return currentPending;
    });
  }, []);

  const handleTransitionComplete = useCallback(() => {
    setPendingSkin(null);
  }, []);

  const formatTime = (seconds: number) => {
    if (settings.timeLimit === 0 && seconds > 3600) return '∞';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isDragon = skin === Skin.Dragon;
  
  const renderStartVisual = () => {
    switch(skin) {
      case Skin.Dragon:
        return (
          <div className="relative w-64 h-64 md:w-96 md:h-96 flex items-center justify-center">
             <div className="absolute inset-0 bg-gradient-to-t from-orange-500/20 to-transparent rounded-full animate-pulse blur-3xl" />
             <div className="w-full h-full border-[1px] border-amber-500/30 rounded-full animate-[spin_20s_linear_infinite]" />
             <div className="absolute w-[80%] h-[80%] border-2 border-dashed border-amber-400/20 rounded-full animate-[spin_30s_linear_infinite_reverse]" />
             <div className="absolute text-amber-500 opacity-80 animate-bounce">
                <Fingerprint size={64} strokeWidth={1} />
             </div>
          </div>
        );
      case Skin.Cyber:
        return (
          <div className="relative w-64 h-64 md:w-96 md:h-96 flex items-center justify-center">
             <div className="absolute inset-0 bg-cyan-500/10 blur-3xl" />
             <div className="w-full h-full border-2 border-cyan-500/30 clip-path-hexagon animate-[spin_10s_linear_infinite]" 
                  style={{clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'}} />
             <div className="absolute w-[90%] h-[90%] border border-cyan-300/20 rounded-full animate-ping opacity-20" />
             <Activity size={64} className="text-cyan-400 absolute animate-pulse" />
          </div>
        );
      case Skin.Ink:
        return (
          <div className="relative w-64 h-64 md:w-96 md:h-96 flex items-center justify-center">
             <div className="absolute w-full h-full border-4 border-black/80 rounded-full opacity-20 transform scale-y-90 rotate-45 blur-[1px]" 
                  style={{borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%'}} />
             <div className="absolute w-[90%] h-[90%] border-2 border-black/40 rounded-full opacity-30 transform -rotate-12"
                  style={{borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%'}} />
             <div className="text-5xl font-serif opacity-80 select-none">道</div>
          </div>
        );
      case Skin.Celestia:
        return (
          <div className="relative w-64 h-64 md:w-96 md:h-96 flex items-center justify-center">
             <div className="absolute inset-0 bg-yellow-100/20 blur-3xl" />
             <div className="absolute w-full h-full border border-yellow-400/30 rounded-full animate-[spin_60s_linear_infinite]" />
             <Aperture size={80} className="text-yellow-500/60 animate-[spin_20s_linear_infinite]" />
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-yellow-400 rounded-full shadow-[0_0_20px_#facc15]" />
             </div>
          </div>
        );
      default:
        return (
          <div className="relative w-64 h-64 md:w-96 md:h-96 flex items-center justify-center">
             <div className="absolute w-full h-full border border-current opacity-20 rounded-full animate-[spin_40s_linear_infinite]" />
             <div className="absolute w-[70%] h-[70%] border border-dashed border-current opacity-20 rounded-full animate-[spin_20s_linear_infinite_reverse]" />
             <Circle size={48} className="opacity-50" strokeWidth={1} />
          </div>
        );
    }
  };

  const getStartTitleColor = () => {
     switch(skin) {
         case Skin.Dragon: return "text-transparent bg-clip-text bg-gradient-to-br from-amber-300 via-orange-500 to-red-600 drop-shadow-[0_0_15px_rgba(245,158,11,0.6)]";
         case Skin.Cyber: return "text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 drop-shadow-[0_0_15px_rgba(6,182,212,0.6)]";
         case Skin.Celestia: return "text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-amber-300 to-yellow-600 drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]";
         case Skin.Ink: return theme === Theme.Day ? "text-slate-900 drop-shadow-md" : "text-white drop-shadow-md";
         case Skin.Forest: return "text-transparent bg-clip-text bg-gradient-to-br from-emerald-300 to-green-600 drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]";
         case Skin.Ocean: return "text-transparent bg-clip-text bg-gradient-to-br from-sky-300 to-blue-600 drop-shadow-[0_0_10px_rgba(14,165,233,0.4)]";
         case Skin.Sakura: return "text-transparent bg-clip-text bg-gradient-to-br from-pink-300 to-rose-500 drop-shadow-[0_0_10px_rgba(236,72,153,0.4)]";
         case Skin.Sunset: return "text-transparent bg-clip-text bg-gradient-to-br from-orange-300 to-red-600 drop-shadow-[0_0_10px_rgba(249,115,22,0.4)]";
         case Skin.Glacier: return "text-transparent bg-clip-text bg-gradient-to-br from-blue-100 to-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.4)]";
         case Skin.Nebula: return "text-transparent bg-clip-text bg-gradient-to-br from-purple-300 to-indigo-600 drop-shadow-[0_0_10px_rgba(147,51,234,0.4)]";
         case Skin.Alchemy: return "text-transparent bg-clip-text bg-gradient-to-br from-amber-200 to-yellow-700 drop-shadow-[0_0_10px_rgba(217,119,6,0.4)]";
         case Skin.Aurora: return "text-transparent bg-clip-text bg-gradient-to-br from-teal-200 to-cyan-500 drop-shadow-[0_0_10px_rgba(20,184,166,0.4)]";
         default: return theme === Theme.Day ? "text-slate-900" : "text-white";
     }
  };

  const getContainerStyles = () => {
    const isDark = theme === Theme.Night;
    switch(skin) {
        // High opacity dark backgrounds for better contrast in Night mode
        case Skin.Forest: return isDark ? "bg-[#052e16]/90 border-emerald-500/30 text-emerald-100 shadow-[0_0_30px_rgba(16,185,129,0.1)]" : "bg-[#ecfdf5]/60 border-emerald-200/50";
        case Skin.Ocean: return isDark ? "bg-[#0f172a]/90 border-sky-500/30 text-sky-100 shadow-[0_0_30px_rgba(14,165,233,0.1)]" : "bg-[#f0f9ff]/60 border-sky-200/50";
        case Skin.Sunset: return isDark ? "bg-[#431407]/90 border-orange-700/30 text-orange-100" : "bg-[#fff7ed]/60 border-orange-200/50";
        // Sakura: Day mode desaturated
        case Skin.Sakura: return "bg-white/90 border-pink-200/50 text-slate-700 shadow-xl shadow-pink-100/50"; 
        case Skin.Glacier: return isDark ? "bg-[#172554]/90 border-blue-500/30 text-blue-100" : "bg-[#eff6ff]/60 border-blue-200/50";
        case Skin.Ink: return isDark ? "bg-[#0c0a09]/90 border-stone-600/50 text-stone-200" : "bg-[#fafaf9]/80 border-stone-300/50 text-stone-900";
        case Skin.Dragon: return "bg-black/90 border-amber-600/40 text-amber-50";
        case Skin.Cyber: return "bg-[#020617]/90 border-cyan-500/30 text-cyan-50";
        case Skin.Nebula: return "bg-[#1e1b4b]/90 border-purple-500/30 text-purple-100";
        case Skin.Alchemy: return "bg-[#271c19]/90 border-amber-700/40 text-amber-100";
        case Skin.Aurora: return "bg-[#042f2e]/90 border-teal-500/30 text-teal-50";
        case Skin.Celestia: return "bg-white/90 border-amber-200/50 text-slate-800";
        default: return isDark ? "bg-stone-900/80 border-stone-600/30 text-stone-200" : "bg-white/40 border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.05)]";
    }
  };

  const containerStyle = getContainerStyles();

  return (
    <div className={`relative min-h-[100dvh] w-full flex flex-col items-center justify-start md:justify-center overflow-x-hidden pt-6 pb-6 md:py-0`}>
      <Background theme={theme} skin={skin} />

      {pendingSkin && (
        <SkinTransition targetSkin={pendingSkin} onPeak={handleTransitionPeak} onComplete={handleTransitionComplete} />
      )}
      
      {isAnalysisOpen && analysisResult && (
        <AnalysisPanel 
            analysis={analysisResult} 
            skin={skin} 
            theme={theme} 
            onClose={() => { setIsAnalysisOpen(false); setPreviewMoveIndex(null); }} 
            onJumpToMove={handleJumpToMove} 
            onPreviewMove={handlePreviewMove}
        />
      )}

      {showHistory && (
        <HistoryPanel history={matchHistory} skin={skin} theme={theme} onClose={() => setShowHistory(false)} onLoadMatch={handleLoadMatch} onClearHistory={() => { setMatchHistory([]); saveHistory([]); }} />
      )}

      {isGameOverModalVisible && (
        <GameOverModal 
           winner={game.winner} 
           playerColor={Player.Black} 
           skin={skin} 
           theme={theme}
           onRestart={gameMode === GameMode.Puzzle ? handleNextPuzzle : () => resetGame()}
           onAnalyze={handleAnalyze}
           onReplay={startReplay}
           onScreenshot={handleScreenshot}
           moveCount={game.moveHistory.length}
           timeSpent={settings.timeLimit > 0 ? settings.timeLimit - blackTime : 0}
           onViewBoard={() => setIsGameOverModalVisible(false)}
        />
      )}
      
      {!isGameOverModalVisible && game.winner && !isAnalysisOpen && !isReplaying && (
         <button 
           onClick={() => setIsGameOverModalVisible(true)}
           className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[50] px-6 py-2 bg-black/70 text-white rounded-full backdrop-blur-md shadow-2xl animate-bounce text-sm font-bold flex items-center gap-2 hover:bg-black/90 transition-colors border border-white/10"
         >
            <Trophy size={16} className="text-yellow-400" /> 显示结算
         </button>
      )}

      {/* --- START SCREEN --- */}
      <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-all duration-1000 ease-in-out ${
          hasStarted ? 'opacity-0 pointer-events-none scale-150 blur-xl' : 'opacity-100 scale-100'
        }`}
      >
        <div className={`absolute inset-0 transition-colors duration-1000 ${
           skin === Skin.Ink ? (theme === Theme.Day ? 'bg-white/60' : 'bg-black/50') 
           : (theme === Theme.Day ? 'bg-white/30' : 'bg-black/40')
        } backdrop-blur-sm`} />

        <div className="relative z-10 flex flex-col items-center">
            
            <div className="relative flex items-center justify-center">
                <div className={`transition-all duration-700 hover:scale-105 opacity-80 ${theme===Theme.Day ? 'text-slate-800' : 'text-white'}`}>
                    {renderStartVisual()}
                </div>

                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center space-y-4 pointer-events-none w-[150%]">
                   <h1 className={`text-7xl md:text-9xl font-serif font-black tracking-[0.2em] ${getStartTitleColor()} drop-shadow-2xl`} style={{ paddingLeft: '0.2em', textShadow: '0 4px 30px rgba(0,0,0,0.1)' }}>
                      无双
                   </h1>
                   <div className={`text-sm md:text-xl font-medium tracking-[0.8em] uppercase opacity-80 ${theme===Theme.Day ? 'text-slate-800' : 'text-white'} flex items-center justify-center gap-4`} style={{ paddingLeft: '0.8em' }}>
                      <span className="w-8 h-[1px] bg-current opacity-50"></span>
                      Zen Gomoku
                      <span className="w-8 h-[1px] bg-current opacity-50"></span>
                   </div>
                </div>
            </div>

            <div className="mt-36 md:mt-48 group relative">
               <button onClick={startGame} className={`relative px-16 py-4 overflow-hidden transition-all duration-500 group-hover:tracking-[0.5em] tracking-[0.3em] font-medium text-lg border-y ${theme === Theme.Day ? 'border-black/20 text-black' : 'border-white/20 text-white'}`}>
                  <span className="relative z-10">入局</span>
                  <div className={`absolute inset-0 w-0 bg-current opacity-5 transition-all duration-500 group-hover:w-full`} />
               </button>
            </div>
        </div>
        
        <div className={`absolute bottom-8 md:bottom-12 max-w-md text-center px-6 opacity-60 transition-opacity duration-1000 ${hasStarted ? 'opacity-0' : ''} ${theme===Theme.Day ? 'text-slate-600' : 'text-slate-300'}`}>
           <p className="text-xs md:text-sm font-serif italic tracking-wide">"{quote}"</p>
        </div>
      </div>

      <div className={`relative z-10 w-full max-w-7xl px-2 sm:px-4 flex flex-col md:flex-row items-center md:items-start justify-center gap-4 md:gap-12 transition-all duration-1000 delay-300 ${hasStarted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'} ${settings.zenMode ? 'justify-center items-center h-[90vh]' : ''}`}>
        
        {/* Left: Board & Status */}
        <div className={`flex flex-col items-center gap-2 md:gap-6 w-full ${settings.zenMode ? 'max-w-[800px] scale-110' : 'max-w-[650px]'} shrink-0 transition-all duration-700`}>
          
          <div className={`text-center space-y-1 md:space-y-2 mt-1 md:mt-0 relative w-full flex flex-col items-center transition-all duration-700 ${settings.zenMode ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}>
            <h2 className={`text-3xl md:text-4xl font-bold font-serif tracking-wide ${getStartTitleColor()} transition-all duration-700`}>
              {gameMode === GameMode.Puzzle && currentPuzzle ? currentPuzzle.title : (skin === Skin.Dragon ? '金龙至尊' : (skin === Skin.Cyber ? '赛博模式' : '五子连珠'))}
            </h2>
            {gameMode === GameMode.Puzzle && currentPuzzle && (
                <p className="text-xs md:text-sm font-medium opacity-70 bg-black/20 px-3 py-1 rounded-full text-white animate-[popIn_0.5s_ease-out]">{currentPuzzle.description}</p>
            )}

            <div className={`text-sm md:text-lg font-medium tracking-widest h-8 transition-all duration-500 flex items-center justify-center gap-6 ${isDragon ? "text-amber-500" : (theme === Theme.Day ? "text-slate-700" : "text-slate-100")}`}>
              
              <div className={`flex items-center gap-2 ${game.currentPlayer === Player.Black ? 'scale-110 font-bold opacity-100' : 'opacity-60 scale-90'} transition-all`}>
                <span className={`inline-block w-3 h-3 md:w-4 md:h-4 rounded-full bg-black shadow-sm ${isDragon ? 'border border-amber-500' : ''}`}></span>
                {gameMode !== GameMode.Puzzle && <span className="font-mono">{formatTime(blackTime)}</span>}
              </div>

              <div className="flex items-center gap-2 min-w-[120px] justify-center">
                {isThinking ? (
                    <span className={`flex items-center gap-1 text-xs md:text-sm animate-pulse opacity-70 ${difficulty === Difficulty.Extreme ? 'text-red-500 font-bold' : ''}`}>
                       {difficulty === Difficulty.Extreme ? <Flame size={14} className="animate-bounce" /> : <Cpu size={14} />} 
                       {difficulty === Difficulty.Extreme ? '深度推演中...' : '思考中...'}
                    </span>
                ) : (
                    <div className="flex flex-col items-center">
                        <span className="text-sm md:text-base">{game.currentPlayer === Player.Black ? '黑方落子' : '白方落子'}</span>
                        {game.openingName && (
                            <span className="text-[10px] md:text-xs opacity-70 font-sans bg-current/10 px-2 rounded-full mt-1 flex items-center gap-1">
                                <BookOpen size={10} /> {game.openingName}
                            </span>
                        )}
                    </div>
                )}
              </div>

               <div className={`flex items-center gap-2 ${game.currentPlayer === Player.White ? 'scale-110 font-bold opacity-100' : 'opacity-60 scale-90'} transition-all`}>
                {gameMode !== GameMode.Puzzle && <span className="font-mono">{formatTime(whiteTime)}</span>}
                <span className={`inline-block w-3 h-3 md:w-4 md:h-4 rounded-full bg-white shadow-sm border border-gray-300`}></span>
              </div>
            </div>
          </div>

          <div className={`w-[95vw] md:w-full flex justify-center relative p-1 sm:p-4 md:p-6 rounded-3xl backdrop-blur-xl transition-all duration-700 perspective-[2000px] border shadow-2xl ${containerStyle}`}>
            <Board 
              ref={boardRef}
              board={displayBoard}
              onCellClick={handleCellClick}
              winningLine={previewMoveIndex === null ? game.winningLine : null}
              theme={theme}
              skin={skin}
              currentPlayer={game.currentPlayer}
              isGameOver={!!game.winner}
              lastMove={displayLastMove}
              hintPos={hintPos}
              undoTrigger={undoTrigger}
            />
            {isThinking && (
                <div className="absolute top-4 right-4 animate-pulse pointer-events-none">
                     {difficulty === Difficulty.Extreme 
                        ? <Flame size={24} className="text-red-500 drop-shadow-[0_0_10px_rgba(220,38,38,0.8)]" />
                        : <Cpu size={24} className="text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]" />
                     }
                </div>
            )}
            {settings.zenMode && (
                <button 
                  onClick={() => setSettings(p => ({...p, zenMode: false}))}
                  className="absolute -bottom-16 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur transition-all"
                  title="退出禅模式"
                >
                    <Minimize2 size={20} />
                </button>
            )}
          </div>
        </div>

        {/* Right: Controls */}
        <div className={`flex items-center w-[95vw] md:w-auto md:h-[600px] md:sticky md:top-10 transition-all duration-700 ${settings.zenMode ? 'translate-x-20 opacity-0 pointer-events-none hidden' : 'translate-x-0 opacity-100'}`}>
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
             onReset={() => resetGame()}
             onUndo={undoMove}
             canUndo={game.history.length > 0 && !game.winner && !isThinking && !isReplaying && viewingIndex === null}
             onReplay={startReplay}
             onAnalyze={handleAnalyze}
             onScreenshot={handleScreenshot}
             isGameOver={!!game.winner}
             isReplaying={isReplaying}
             hasAnalysis={!!analysisResult}
             zenMode={settings.zenMode}
             toggleZenMode={() => setSettings(p => ({...p, zenMode: !p.zenMode}))}
             timeLimit={settings.timeLimit}
             setTimeLimit={setTimeLimit}
             themeLocked={SKIN_THEME_CONFIG[skin] !== 'dynamic'}
           />
        </div>
      </div>
    </div>
  );
}

export default App;
