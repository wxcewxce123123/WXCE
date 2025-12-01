
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

export const getAIMove = (board: Player[][], aiPlayer: Player, difficulty: Difficulty): { r: number, c: number } | null => {
  const opponent = aiPlayer === Player.Black ? Player.White : Player.Black;
  let bestScore = -Infinity;
  let bestMoves: { r: number, c: number }[] = [];

  const relevantCells = new Set<string>();
  let hasStones = false;

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] !== Player.None) {
        hasStones = true;
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === Player.None) {
              relevantCells.add(`${nr},${nc}`);
            }
          }
        }
      }
    }
  }

  if (!hasStones) return { r: 7, c: 7 };

  if (relevantCells.size === 0) {
     for (let r = 0; r < BOARD_SIZE; r++) {
       for (let c = 0; c < BOARD_SIZE; c++) {
         if (board[r][c] === Player.None) relevantCells.add(`${r},${c}`);
       }
     }
  }

  Array.from(relevantCells).forEach(key => {
    const [r, c] = key.split(',').map(Number);
    const attackScore = getPositionalScore(board, r, c, aiPlayer);
    const defenseScore = getPositionalScore(board, r, c, opponent);
    let totalScore = 0;

    switch (difficulty) {
      case Difficulty.Easy:
        totalScore = attackScore * 0.5 + Math.random() * 200;
        break;
      case Difficulty.Medium:
        totalScore = attackScore + defenseScore * 0.8;
        break;
      case Difficulty.Hard:
        totalScore = attackScore + defenseScore * 0.95;
        if (attackScore >= SCORE_FIVE) totalScore = Infinity; 
        else if (defenseScore >= SCORE_FIVE) totalScore = 10000000; 
        else if (attackScore >= SCORE_OPEN_FOUR) totalScore = 5000000; 
        else if (defenseScore >= SCORE_OPEN_FOUR) totalScore = 4000000; 
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
