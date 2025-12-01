
import { Player, Difficulty, AnalysisResult, MoveAnalysis, MoveType, PlayerStats } from '../types';

export const BOARD_SIZE = 15;

export const createEmptyBoard = (): Player[][] => {
  return Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(Player.None));
};

export const checkWin = (board: Player[][], row: number, col: number, player: Player): number[][] | null => {
  const directions = [
    [0, 1],   // Horizontal
    [1, 0],   // Vertical
    [1, 1],   // Diagonal \
    [1, -1],  // Diagonal /
  ];

  for (const [dx, dy] of directions) {
    let count = 1;
    const line: number[][] = [[row, col]];

    // Check forward
    let r = row + dx;
    let c = col + dy;
    while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
      count++;
      line.push([r, c]);
      r += dx;
      c += dy;
    }

    // Check backward
    r = row - dx;
    c = col - dy;
    while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
      count++;
      line.push([r, c]);
      r -= dx;
      c -= dy;
    }

    if (count >= 5) {
      return line;
    }
  }

  return null;
};

// --- AI Logic ---

// Score constants
const SCORE_FIVE = 1000000;
const SCORE_OPEN_FOUR = 50000;
const SCORE_FOUR = 10000; // Blocked four
const SCORE_OPEN_THREE = 5000;
const SCORE_THREE = 1000;
const SCORE_OPEN_TWO = 500;
const SCORE_TWO = 100;

const evaluateDirection = (board: Player[][], r: number, c: number, dx: number, dy: number, player: Player): number => {
  let count = 1;
  let blockedStart = false;
  let blockedEnd = false;

  // Check forward
  let i = 1;
  while (true) {
    const nr = r + dx * i;
    const nc = c + dy * i;
    if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) {
      blockedEnd = true;
      break;
    }
    const cell = board[nr][nc];
    if (cell === player) {
      count++;
    } else if (cell === Player.None) {
      break;
    } else {
      blockedEnd = true;
      break;
    }
    i++;
  }

  // Check backward
  i = 1;
  while (true) {
    const nr = r - dx * i;
    const nc = c - dy * i;
    if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) {
      blockedStart = true;
      break;
    }
    const cell = board[nr][nc];
    if (cell === player) {
      count++;
    } else if (cell === Player.None) {
      break;
    } else {
      blockedStart = true;
      break;
    }
    i++;
  }

  if (blockedStart && blockedEnd) {
    if (count >= 5) return SCORE_FIVE; // Still a win even if blocked
    return 0; // Useless if blocked both ends and < 5
  }

  if (count >= 5) return SCORE_FIVE;
  
  if (count === 4) {
    if (!blockedStart && !blockedEnd) return SCORE_OPEN_FOUR;
    return SCORE_FOUR;
  }
  
  if (count === 3) {
    if (!blockedStart && !blockedEnd) return SCORE_OPEN_THREE;
    return SCORE_THREE;
  }
  
  if (count === 2) {
    if (!blockedStart && !blockedEnd) return SCORE_OPEN_TWO;
    return SCORE_TWO;
  }

  return 1;
};

const getPositionalScore = (board: Player[][], r: number, c: number, player: Player): number => {
  let score = 0;
  const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
  
  for (const [dx, dy] of directions) {
    score += evaluateDirection(board, r, c, dx, dy, player);
  }
  
  // Bonus for center proximity
  const centerDist = Math.abs(r - 7) + Math.abs(c - 7);
  score += (15 - centerDist);

  return score;
};

// Helper: Get relevant empty cells (nearby existing stones) to optimize search
const getRelevantCells = (board: Player[][], distance: number = 2): {r: number, c: number}[] => {
  const candidates = new Set<string>();
  let hasStones = false;

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] !== Player.None) {
        hasStones = true;
        for (let dr = -distance; dr <= distance; dr++) {
          for (let dc = -distance; dc <= distance; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === Player.None) {
              candidates.add(`${nr},${nc}`);
            }
          }
        }
      }
    }
  }

  if (!hasStones) return [{r: 7, c: 7}];

  // Convert Set back to array
  return Array.from(candidates).map(str => {
    const [r, c] = str.split(',').map(Number);
    return {r, c};
  });
};


// --- Minimax Implementation (Depth 2 with Alpha-Beta Pruning) ---
const getBestMoveMinimax = (board: Player[][], aiPlayer: Player): { r: number, c: number } | null => {
    const candidates = getRelevantCells(board, 2);
    
    // 1. Initial Sorting / Beam Search
    // Sort candidates by heuristic score to maximize pruning potential
    const rankedCandidates = candidates.map(move => {
        const attack = getPositionalScore(board, move.r, move.c, aiPlayer);
        const defense = getPositionalScore(board, move.r, move.c, aiPlayer === Player.Black ? Player.White : Player.Black);
        // Heavily weight immediate win/loss prevention in pre-sort
        let score = attack + defense;
        if (attack >= SCORE_FIVE) score += 100000000;
        else if (defense >= SCORE_FIVE) score += 50000000;
        else if (attack >= SCORE_OPEN_FOUR) score += 1000000;
        else if (defense >= SCORE_OPEN_FOUR) score += 500000;
        return { ...move, score };
    }).sort((a, b) => b.score - a.score);

    // Only consider top X moves for deep calculation to maintain performance
    const searchWindow = 12; 
    const topMoves = rankedCandidates.slice(0, searchWindow);
    
    // Check for immediate win in top moves
    for (const move of topMoves) {
        if (move.score >= 100000000) return { r: move.r, c: move.c }; // Winning move
    }

    let bestScore = -Infinity;
    let bestMove = topMoves[0];
    const opponent = aiPlayer === Player.Black ? Player.White : Player.Black;

    // 2. Shallow Minimax (Depth 2: AI Move -> Opponent Response)
    for (const move of topMoves) {
        // Apply AI Move
        board[move.r][move.c] = aiPlayer;
        
        let minOpponentScore = Infinity; // We want to find the move that leaves the opponent with the WORST best option
        
        // Find opponent's best response to this move
        // We re-calculate candidates around the new move + existing candidates
        // For speed, we just use the existing high-threat areas or scan all relevant
        // Here we simplify: re-evaluate the board state from opponent's view
        
        // Simple 1-ply lookahead for opponent (Minimizer node)
        // Opponent wants to maximize their score (or block AI)
        
        // Optimization: We don't need full candidate search for opponent, just check if they can win
        // or if they have a huge threat.
        const oppCandidates = getRelevantCells(board, 1); 
        
        let maxResponseScore = -Infinity;
        
        for (const resp of oppCandidates) {
             const oppAttack = getPositionalScore(board, resp.r, resp.c, opponent);
             const oppDefense = getPositionalScore(board, resp.r, resp.c, aiPlayer); // Opponent blocking AI
             
             // Opponent evaluation logic
             let val = oppAttack + oppDefense;
             
             // If opponent can win, they will definitely take it. Score is huge.
             if (oppAttack >= SCORE_FIVE) val = Infinity;
             else if (oppDefense >= SCORE_FIVE) val = 1000000; // Opponent forced to block AI win
             else if (oppAttack >= SCORE_OPEN_FOUR) val = 500000;
             
             if (val > maxResponseScore) {
                 maxResponseScore = val;
             }
             // Pruning: If opponent already has a winning move, we don't need to search further, this branch is bad for AI
             if (maxResponseScore === Infinity) break;
        }

        // Evaluate state: (AI's move value) - (Opponent's best response value * weight)
        // If opponent has Infinity score (can win), this move result is -Infinity
        
        let moveValue = 0;
        if (maxResponseScore === Infinity) {
             moveValue = -Infinity;
        } else {
             // Heuristic: AI Move Score (Attack) + AI Move Score (Defense against prev state) - Opponent Response
             // But simpler: just use the initial pre-sort score as base, and subtract the opponent's best counterplay capability
             moveValue = move.score - (maxResponseScore * 1.5); 
        }

        // Backtrack
        board[move.r][move.c] = Player.None;

        if (moveValue > bestScore) {
            bestScore = moveValue;
            bestMove = move;
        }
    }

    return bestMove;
};


export const getAIMove = (board: Player[][], aiPlayer: Player, difficulty: Difficulty): { r: number, c: number } | null => {
  const opponent = aiPlayer === Player.Black ? Player.White : Player.Black;

  if (difficulty === Difficulty.Hard) {
      return getBestMoveMinimax(board, aiPlayer);
  }

  // --- EASY / MEDIUM (Greedy / Weighted Random) ---
  
  let bestScore = -Infinity;
  let bestMoves: { r: number, c: number }[] = [];
  
  const relevantCells = getRelevantCells(board, 2);

  relevantCells.forEach(({r, c}) => {
    const attackScore = getPositionalScore(board, r, c, aiPlayer);
    const defenseScore = getPositionalScore(board, r, c, opponent);
    let totalScore = 0;

    switch (difficulty) {
      case Difficulty.Easy:
        totalScore = attackScore * 0.5 + Math.random() * 200;
        break;
      case Difficulty.Medium:
        totalScore = attackScore + defenseScore * 0.8;
        // Boost critical moves slightly
        if (attackScore >= SCORE_OPEN_FOUR) totalScore += 10000;
        if (defenseScore >= SCORE_OPEN_FOUR) totalScore += 9000;
        break;
    }

    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestMoves = [{ r, c }];
    } else if (totalScore === bestScore) {
      bestMoves.push({ r, c });
    }
  });

  if (bestMoves.length > 0) {
    const randomIdx = Math.floor(Math.random() * bestMoves.length);
    return bestMoves[randomIdx];
  }
  return null;
};

// --- Advanced Analysis Engine ---

const calculatePlayerStats = (moves: MoveAnalysis[], player: Player, totalMoves: number): PlayerStats => {
  const playerMoves = moves.filter(m => m.player === player);
  const count = Math.max(1, playerMoves.length);
  
  const attacks = playerMoves.filter(m => m.type === 'attack' || m.type === 'victory').length;
  const defenses = playerMoves.filter(m => m.type === 'defense').length;
  const brilliants = playerMoves.filter(m => m.type === 'brilliant').length;
  const mistakes = playerMoves.filter(m => m.type === 'mistake' || m.type === 'blunder').length;
  
  // Calculate average complexity based on board state (simplified here by using score)
  const complexityAvg = playerMoves.reduce((acc, m) => acc + Math.log(m.score + 10), 0) / count;

  return {
    accuracy: Math.min(99, Math.max(50, 95 - (mistakes * 5))),
    aggression: Math.min(99, (attacks / count) * 300),
    defense: Math.min(99, (defenses / count) * 300),
    stability: Math.min(99, Math.max(40, 95 - (mistakes * 8))),
    complexity: Math.min(99, complexityAvg * 10),
    endgame: playerMoves.length > 20 ? 90 : 60, // Placeholder for endgame skill
  };
};

export const analyzeMatch = (moveHistory: {r: number, c: number, player: Player}[]): AnalysisResult => {
  const board = createEmptyBoard();
  const keyMoves: MoveAnalysis[] = [];
  const advantageCurve: number[] = [0]; // Start at neutral

  let currentAdvantage = 0; // Negative = White, Positive = Black

  moveHistory.forEach((move, index) => {
    const { r, c, player } = move;
    const opponent = player === Player.Black ? Player.White : Player.Black;

    // 1. Evaluate State BEFORE Move
    const preAttack = getPositionalScore(board, r, c, player);
    const preDefense = getPositionalScore(board, r, c, opponent);
    
    // 2. Apply Move
    board[r][c] = player;
    
    // 3. Evaluate Move Impact
    const win = checkWin(board, r, c, player);
    
    let type: MoveType = 'normal';
    let description = '常规推进';
    let score = preAttack + preDefense;
    
    // Determine Type
    if (win) {
      type = 'victory';
      description = '绝杀！五子连珠。';
      score = SCORE_FIVE;
    } else if (preAttack >= SCORE_OPEN_FOUR) {
      type = 'attack';
      description = '制造冲四杀机！';
    } else if (preDefense >= SCORE_OPEN_FOUR) {
      type = 'defense';
      description = '关键防守！化解必杀。';
    } else if (preAttack >= SCORE_OPEN_THREE) {
      type = 'attack';
      description = '活三进攻，掌握主动。';
    } else if (preDefense >= SCORE_OPEN_THREE) {
      type = 'defense';
      description = '稳健防守，破坏活三。';
    } else if (preAttack > SCORE_TWO && preDefense > SCORE_TWO) {
      type = 'brilliant';
      description = '攻守兼备的妙手！';
    } else if (score < 50 && index > 10) {
      if (score < 20) {
        type = 'blunder';
        description = '严重失误，局面被动。';
      } else {
        type = 'mistake';
        description = '效率较低的一手。';
      }
    }

    // Advantage Calculation (Simulated Momentum)
    let moveImpact = 0;
    if (type === 'victory') moveImpact = 100;
    else if (type === 'attack') moveImpact = 15;
    else if (type === 'defense') moveImpact = 10;
    else if (type === 'brilliant') moveImpact = 20;
    else if (type === 'mistake') moveImpact = -10;
    else if (type === 'blunder') moveImpact = -30;
    else moveImpact = 2; // Small gain for placing a stone

    if (player === Player.Black) {
      currentAdvantage += moveImpact;
    } else {
      currentAdvantage -= moveImpact;
    }

    // Clamp advantage
    currentAdvantage = Math.max(-100, Math.min(100, currentAdvantage));
    if (type === 'victory') currentAdvantage = player === Player.Black ? 100 : -100;
    
    advantageCurve.push(currentAdvantage);

    if (type !== 'normal' || index === moveHistory.length - 1) {
      keyMoves.push({
        moveIndex: index,
        player,
        r, c, type, score, description, advantage: currentAdvantage
      });
    }
  });

  const blackStats = calculatePlayerStats(keyMoves, Player.Black, moveHistory.length);
  const whiteStats = calculatePlayerStats(keyMoves, Player.White, moveHistory.length);
  const winner = moveHistory.length > 0 ? (checkWin(board, moveHistory[moveHistory.length-1].r, moveHistory[moveHistory.length-1].c, moveHistory[moveHistory.length-1].player) ? moveHistory[moveHistory.length-1].player : null) : null;

  // Generate Summary
  let summary = "";
  if (winner) {
    const winPlayer = winner === Player.Black ? "黑方" : "白方";
    const losePlayer = winner === Player.Black ? "白方" : "黑方";
    if (moveHistory.length < 20) {
      summary = `${winPlayer}开局攻势凌厉，${losePlayer}防守不及，速战速决。`;
    } else if (Math.abs(currentAdvantage) < 20 && moveHistory.length > 50) {
      summary = `双方势均力敌，鏖战至中盘，${winPlayer}抓住关键机会锁定胜局。`;
    } else {
      summary = `${winPlayer}全场局势占优，步步为营，最终稳健拿下比赛。`;
    }
  } else {
    summary = "局势胶着，未分胜负。";
  }

  return {
    totalMoves: moveHistory.length,
    winner,
    blackStats,
    whiteStats,
    advantageCurve,
    keyMoves,
    summary
  };
};
