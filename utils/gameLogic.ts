
import { Player, Difficulty, AnalysisResult, MoveAnalysis, MoveType } from '../types';

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

// --- Analysis Engine ---

export const analyzeMatch = (moveHistory: {r: number, c: number, player: Player}[]): AnalysisResult => {
  const board = createEmptyBoard();
  const keyMoves: MoveAnalysis[] = [];
  
  let blackScoreTotal = 0;
  let whiteScoreTotal = 0;

  moveHistory.forEach((move, index) => {
    const { r, c, player } = move;
    const opponent = player === Player.Black ? Player.White : Player.Black;

    // Calculate scores BEFORE the move is placed to evaluate the decision
    const attackPotential = getPositionalScore(board, r, c, player);
    const defensePotential = getPositionalScore(board, r, c, opponent);

    // Apply move
    board[r][c] = player;
    
    // Check if this move WON the game
    const win = checkWin(board, r, c, player);
    
    let type: MoveType = 'normal';
    let description = '普通的一手';
    let score = attackPotential + defensePotential;

    if (win) {
      type = 'victory';
      description = '致胜绝杀！五子连珠。';
      score = SCORE_FIVE;
    } else if (attackPotential >= SCORE_OPEN_FOUR) {
      type = 'attack';
      description = '绝杀威胁！形成冲四或活四。';
    } else if (defensePotential >= SCORE_OPEN_FOUR) {
      type = 'defense';
      description = '关键防守！阻止了对手的绝杀。';
    } else if (attackPotential >= SCORE_OPEN_THREE) {
      type = 'attack';
      description = '凌厉攻势，形成活三。';
    } else if (defensePotential >= SCORE_OPEN_THREE) {
      type = 'defense';
      description = '稳健防守，破坏了对手的活三。';
    } else if (attackPotential > SCORE_TWO && defensePotential > SCORE_TWO) {
      type = 'brilliant';
      description = '妙手！攻守兼备，掌控局势。';
    } else if (score < 50) {
      // type = 'blunder'; 
      // description = '略显随意的落子。';
    }

    // Accumulate accuracy (simplified placeholder logic)
    if (player === Player.Black) blackScoreTotal += Math.min(score, 1000);
    else whiteScoreTotal += Math.min(score, 1000);

    // Filter interesting moves
    if (type !== 'normal' || index === moveHistory.length - 1) {
      keyMoves.push({
        moveIndex: index,
        player,
        r,
        c,
        type,
        score,
        description
      });
    }
  });

  return {
    totalMoves: moveHistory.length,
    blackAccuracy: Math.min(99, Math.floor(blackScoreTotal / (moveHistory.length/2 + 1) / 10)),
    whiteAccuracy: Math.min(99, Math.floor(whiteScoreTotal / (moveHistory.length/2 + 1) / 10)),
    keyMoves
  };
};
