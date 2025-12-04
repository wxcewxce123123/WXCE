

import { Player, Difficulty, AnalysisResult, MoveAnalysis, MoveType, PuzzleState } from '../types';

export const BOARD_SIZE = 15;

// --- 基础工具 ---

export const createEmptyBoard = (): Player[][] => {
  return Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(Player.None));
};

export const checkWin = (board: Player[][], row: number, col: number, player: Player): number[][] | null => {
  const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
  for (const [dx, dy] of directions) {
    let count = 1;
    const line: number[][] = [[row, col]];
    let r = row + dx, c = col + dy;
    while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
      count++; line.push([r, c]); r += dx; c += dy;
    }
    r = row - dx; c = col - dy;
    while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
      count++; line.push([r, c]); r -= dx; c -= dy;
    }
    if (count >= 5) return line;
  }
  return null;
};

// --- 快速重建棋盘 (用于预览) ---
export const reconstructBoard = (moves: {r: number, c: number, player: Player}[]): Player[][] => {
    const board = createEmptyBoard();
    moves.forEach(m => {
        board[m.r][m.c] = m.player;
    });
    return board;
};

// --- 开局库检测 ---
export const detectOpening = (moves: {r: number, c: number, player: Player}[]): string | undefined => {
  if (moves.length < 3) return undefined;
  const center = moves[0];
  const m2 = moves[1]; 
  const m3 = moves[2]; 
  const distSq = (a: {r:number, c:number}, b: {r:number, c:number}) => (a.r-b.r)**2 + (a.c-b.c)**2;
  const d12 = distSq(center, m2);
  const d13 = distSq(center, m3);
  const d23 = distSq(m2, m3);

  if (d12 === 1) { // 直指
      if (d13 === 1 && d23 === 2) return "花月 (Hua Yue)"; 
      if (d13 === 1 && d23 === 4) return "云月 (Yun Yue)"; 
      if (d13 === 2 && d23 === 1) return "浦月 (Pu Yue)";
      if (d13 === 4 && d23 === 5) return "岚月 (Lan Yue)";
      if (d13 === 5) return "峡月 (Xia Yue)";
      if (d13 === 8) return "溪月 (Xi Yue)";
      if (d13 === 2 && d23 === 5) return "雨月 (Yu Yue)";
  } else if (d12 === 2) { // 斜指
      if (d13 === 1 && d23 === 1) return "长星 (Chang Xing)";
      if (d13 === 2 && d23 === 2) return "疏星 (Shu Xing)";
      if (d13 === 1 && d23 === 5) return "恒星 (Heng Xing)";
      if (d13 === 4 && d23 === 2) return "水月 (Shui Yue)";
      if (d13 === 5 && d23 === 5) return "流星 (Liu Xing)";
      if (d13 === 8) return "彗星 (Hui Xing)";
  }
  return undefined;
};


// ==========================================
// AI CORE ENGINE 3.0 (Extreme Intelligence)
// ==========================================

// 评分常量 - 绝对优先权
const SCORE = {
  WIN: 100_000_000,    // 连五
  LIVE_4: 10_000_000,  // 活四 (必胜)
  RUSH_4: 500_000,     // 冲四 (必须防守)
  LIVE_3: 400_000,     // 活三 (如果不防，下一手变活四)
  SLEEP_3: 2_000,      // 眠三
  LIVE_2: 1_000,       // 活二
  SLEEP_2: 200,        // 眠二
  POTENTIAL: 10        // 位置分
};

const isValid = (r: number, c: number) => r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;

const evaluateLine = (board: Player[][], r: number, c: number, dr: number, dc: number, player: Player): number => {
    let count = 1;
    let blockStart = false;
    let blockEnd = false;

    // 向前搜索
    let i = 1;
    while (true) {
        const nr = r + dr * i;
        const nc = c + dc * i;
        if (!isValid(nr, nc)) { blockEnd = true; break; }
        if (board[nr][nc] === player) { count++; }
        else if (board[nr][nc] === Player.None) { break; } 
        else { blockEnd = true; break; } 
        i++;
    }

    // 向后搜索
    let j = 1;
    while (true) {
        const nr = r - dr * j;
        const nc = c - dc * j;
        if (!isValid(nr, nc)) { blockStart = true; break; }
        if (board[nr][nc] === player) { count++; }
        else if (board[nr][nc] === Player.None) { break; }
        else { blockStart = true; break; }
        j++;
    }

    if (count >= 5) return SCORE.WIN;

    if (count === 4) {
        if (!blockStart && !blockEnd) return SCORE.LIVE_4; 
        if (!blockStart || !blockEnd) return SCORE.RUSH_4; 
        return 0;
    }

    if (count === 3) {
        if (!blockStart && !blockEnd) return SCORE.LIVE_3; 
        if (!blockStart || !blockEnd) return SCORE.SLEEP_3;
        return 0;
    }

    if (count === 2) {
        if (!blockStart && !blockEnd) return SCORE.LIVE_2;
        if (!blockStart || !blockEnd) return SCORE.SLEEP_2;
        return 0;
    }

    return count * 10;
};

const evaluatePointGlobal = (board: Player[][], r: number, c: number, player: Player): number => {
    let totalScore = 0;
    totalScore += evaluateLine(board, r, c, 1, 0, player);
    totalScore += evaluateLine(board, r, c, 0, 1, player);
    totalScore += evaluateLine(board, r, c, 1, 1, player);
    totalScore += evaluateLine(board, r, c, 1, -1, player);
    
    // Position bias
    const centerBias = 7 - Math.max(Math.abs(r - 7), Math.abs(c - 7));
    totalScore += centerBias * SCORE.POTENTIAL;

    return totalScore;
};

const evaluateBoardState = (board: Player[][], myPlayer: Player): number => {
    let myScore = 0;
    let oppScore = 0;
    const oppPlayer = myPlayer === Player.Black ? Player.White : Player.Black;

    // 简单全盘评估：仅遍历有子的区域附近
    const activeRange = 2;
    let minR=BOARD_SIZE, maxR=0, minC=BOARD_SIZE, maxC=0;
    
    for(let r=0; r<BOARD_SIZE; r++) {
        for(let c=0; c<BOARD_SIZE; c++) {
            if (board[r][c] !== Player.None) {
                minR = Math.min(minR, r); maxR = Math.max(maxR, r);
                minC = Math.min(minC, c); maxC = Math.max(maxC, c);
            }
        }
    }
    
    // Expand range
    minR = Math.max(0, minR-activeRange); maxR = Math.min(BOARD_SIZE-1, maxR+activeRange);
    minC = Math.max(0, minC-activeRange); maxC = Math.min(BOARD_SIZE-1, maxC+activeRange);

    for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
             if (board[r][c] === myPlayer) myScore += evaluatePointGlobal(board, r, c, myPlayer);
             else if (board[r][c] === oppPlayer) oppScore += evaluatePointGlobal(board, r, c, oppPlayer);
        }
    }
    
    return myScore - oppScore * 1.2; // Defense is key
};

const getCandidates = (board: Player[][], player: Player, limit: number = 20): {r: number, c: number, score: number}[] => {
    const candidates: {r: number, c: number, score: number}[] = [];
    const visited = new Set<string>();
    const opp = player === Player.Black ? Player.White : Player.Black;
    let hasStones = false;

    for(let r=0; r<BOARD_SIZE; r++) {
        for(let c=0; c<BOARD_SIZE; c++) {
            if (board[r][c] !== Player.None) {
                hasStones = true;
                const range = 2; 
                for(let dr=-range; dr<=range; dr++) {
                    for(let dc=-range; dc<=range; dc++) {
                         const nr = r + dr;
                         const nc = c + dc;
                         if (isValid(nr, nc) && board[nr][nc] === Player.None) {
                             const key = `${nr},${nc}`;
                             if (!visited.has(key)) {
                                 visited.add(key);
                                 const attackScore = evaluatePointGlobal(board, nr, nc, player);
                                 const defenseScore = evaluatePointGlobal(board, nr, nc, opp);
                                 candidates.push({ r: nr, c: nc, score: attackScore + defenseScore });
                             }
                         }
                    }
                }
            }
        }
    }

    if (!hasStones) return [{r: 7, c: 7, score: 0}];
    return candidates.sort((a, b) => b.score - a.score).slice(0, limit);
};

// --- VCF (Victory by Continuous Four) Solver ---
// 简化的算杀引擎：只搜索如果我一直冲四能不能赢
// 这对“变态”AI至关重要，能发现很深的杀局
const solveVCF = (board: Player[][], player: Player, depth: number, maxDepth: number): {r:number, c:number} | null => {
    if (depth > maxDepth) return null;
    
    // 1. 找所有的冲四点 (Attack Score >= RUSH_4)
    const candidates = getCandidates(board, player, 15); // 只看最有希望的点
    
    // 优化：只考虑能造成冲四或活四的点
    const forcingMoves = candidates.filter(m => {
        // 模拟落子，看是否构成活四或冲四
        board[m.r][m.c] = player;
        const score = evaluatePointGlobal(board, m.r, m.c, player);
        const win = checkWin(board, m.r, m.c, player);
        board[m.r][m.c] = Player.None;
        return win || score >= SCORE.RUSH_4;
    });

    if (forcingMoves.length === 0) return null;

    const opp = player === Player.Black ? Player.White : Player.Black;

    for (const move of forcingMoves) {
        board[move.r][move.c] = player;
        
        // 如果直接赢了，返回这步
        if (checkWin(board, move.r, move.c, player)) {
            board[move.r][move.c] = Player.None;
            return move;
        }

        // 模拟对手防守
        // 对手必须防守，找到对手所有能防守的点（通常是形成五连的点）
        // 这里简化：对手如果有必杀，或者对手防不住，则算VCF成功
        // 我们假设对手会下在最佳防守点（阻止我连五）
        // 找到我方刚下的连线，对手必须堵两头
        
        // 简单模拟：如果我没赢，对手紧接着下。
        // 如果对手下完，我还能通过冲四赢，继续
        // 对手如果反杀（形成活四），则这步VCF失败
        
        // 为了性能，我们只看一步防守：
        // 找到对手必须要堵的点
        let defensiveMove = getCandidates(board, opp, 1)[0];
        
        if (defensiveMove) {
            board[defensiveMove.r][defensiveMove.c] = opp;
            // 检查对手是否反杀
            if (checkWin(board, defensiveMove.r, defensiveMove.c, opp)) {
                board[defensiveMove.r][defensiveMove.c] = Player.None;
                board[move.r][move.c] = Player.None;
                continue; // 这步不行，被反杀
            }
            
            // 继续递归
            const nextWin = solveVCF(board, player, depth + 1, maxDepth);
            
            board[defensiveMove.r][defensiveMove.c] = Player.None;
            board[move.r][move.c] = Player.None;
            
            if (nextWin) return move; // 找到杀路
        } else {
            // 对手无路可走（不可能发生，除非填满）
            board[move.r][move.c] = Player.None;
        }
    }
    
    return null;
};


const minimax = (
    board: Player[][], 
    depth: number, 
    alpha: number, 
    beta: number, 
    isMaximizing: boolean,
    aiPlayer: Player
): number => {
    if (depth === 0) {
        return evaluateBoardState(board, aiPlayer);
    }

    const currentPlayer = isMaximizing ? aiPlayer : (aiPlayer === Player.Black ? Player.White : Player.Black);
    
    // 动态调整搜索宽度：深度越深，搜索越窄，提高效率
    const width = depth > 4 ? 6 : (depth > 2 ? 8 : 15);
    const candidates = getCandidates(board, currentPlayer, width);

    if (candidates.length === 0) return evaluateBoardState(board, aiPlayer);

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (const move of candidates) {
            board[move.r][move.c] = aiPlayer;
            if (checkWin(board, move.r, move.c, aiPlayer)) {
                 board[move.r][move.c] = Player.None;
                 return SCORE.WIN + depth * 10000;
            }
            const evalScore = minimax(board, depth - 1, alpha, beta, false, aiPlayer);
            board[move.r][move.c] = Player.None;
            maxEval = Math.max(maxEval, evalScore);
            alpha = Math.max(alpha, evalScore);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        const oppPlayer = aiPlayer === Player.Black ? Player.White : Player.Black;
        for (const move of candidates) {
            board[move.r][move.c] = oppPlayer;
            if (checkWin(board, move.r, move.c, oppPlayer)) {
                 board[move.r][move.c] = Player.None;
                 return -SCORE.WIN - depth * 10000;
            }
            const evalScore = minimax(board, depth - 1, alpha, beta, true, aiPlayer);
            board[move.r][move.c] = Player.None;
            minEval = Math.min(minEval, evalScore);
            beta = Math.min(beta, evalScore);
            if (beta <= alpha) break;
        }
        return minEval;
    }
};

export const getAIMove = (board: Player[][], aiPlayer: Player, difficulty: Difficulty, randomness: number = 0): { r: number, c: number } | null => {
  const opponent = aiPlayer === Player.Black ? Player.White : Player.Black;
  
  // 1. 必杀/必防检查 (所有难度通用)
  const candidates = getCandidates(board, aiPlayer, 40); 
  if (candidates.length === 0) return {r: 7, c: 7};

  // 1.1 我方连五 -> 赢
  for (const m of candidates) {
      board[m.r][m.c] = aiPlayer;
      if (checkWin(board, m.r, m.c, aiPlayer)) { board[m.r][m.c] = Player.None; return m; }
      board[m.r][m.c] = Player.None;
  }
  // 1.2 对方连五 -> 堵
  for (const m of candidates) {
      board[m.r][m.c] = opponent;
      if (checkWin(board, m.r, m.c, opponent)) { board[m.r][m.c] = Player.None; return m; }
      board[m.r][m.c] = Player.None;
  }
  // 1.3 我方活四 -> 赢
  for (const m of candidates) {
      const score = evaluatePointGlobal(board, m.r, m.c, aiPlayer);
      if (score >= SCORE.LIVE_4) return m;
  }
  // 1.4 对方活四 -> 堵
  const urgentDefenses = candidates.filter(m => evaluatePointGlobal(board, m.r, m.c, opponent) >= SCORE.LIVE_4);
  if (urgentDefenses.length > 0) return urgentDefenses[0];

  // --- 难度逻辑 ---
  
  if (difficulty === Difficulty.Easy) {
      const pool = candidates.slice(0, 5);
      return pool[Math.floor(Math.random() * pool.length)];
  }

  if (difficulty === Difficulty.Medium) {
      const rushDefenses = candidates.filter(m => evaluatePointGlobal(board, m.r, m.c, opponent) >= SCORE.RUSH_4);
      if (rushDefenses.length > 0) return rushDefenses[0];

      let bestScore = -Infinity;
      let bestMoves: typeof candidates = [];
      const searchPool = candidates.slice(0, 8);
      for (const move of searchPool) {
          board[move.r][move.c] = aiPlayer;
          const score = minimax(board, 1, -Infinity, Infinity, false, aiPlayer);
          board[move.r][move.c] = Player.None;
          if (score > bestScore) { bestScore = score; bestMoves = [move]; } 
          else if (score === bestScore) { bestMoves.push(move); }
      }
      return bestMoves[Math.floor(Math.random() * bestMoves.length)];
  }

  if (difficulty === Difficulty.Hard) {
      // 必须防冲四
      for (const m of candidates) {
          if (evaluatePointGlobal(board, m.r, m.c, opponent) >= SCORE.RUSH_4) return m;
      }
      // Minimax Depth 4
      const searchDepth = 4;
      let bestScore = -Infinity;
      let bestMove = candidates[0];
      const deepSearchPool = candidates.slice(0, 8);

      for (const move of deepSearchPool) {
          board[move.r][move.c] = aiPlayer;
          const score = minimax(board, searchDepth - 1, -Infinity, Infinity, false, aiPlayer);
          board[move.r][move.c] = Player.None;
          // 增加一点位置随机性
          const tieBreaker = move.score / 10000; 
          if (score + tieBreaker > bestScore) { bestScore = score + tieBreaker; bestMove = move; }
      }
      return bestMove;
  }

  // --- EXTREME MODE (地狱难度) ---
  if (difficulty === Difficulty.Extreme) {
      // 1. VCF 算杀 (Attack First)
      // 尝试算 10 步以内的连续冲四绝杀
      const vcfMove = solveVCF(board, aiPlayer, 0, 10);
      if (vcfMove) {
          console.log("VCF Found!");
          return vcfMove;
      }

      // 2. 强力防守：如果对手有 VCF，必须堵
      // 这里的逻辑比较复杂，简化为：如果对手有冲四，必须堵；如果对手有活三，必须堵
      // 并且使用更深的 Minimax
      
      for (const m of candidates) {
          const oppVal = evaluatePointGlobal(board, m.r, m.c, opponent);
          if (oppVal >= SCORE.RUSH_4) return m; // 必应
          if (oppVal >= SCORE.LIVE_3) {
             // 简单的活三由 Minimax 处理，但如果有双三，必须优先处理
             // 我们信任 Minimax 能够看到活三变活四的威胁
          }
      }

      // 3. Deep Minimax (Depth 6 - 牺牲时间)
      const searchDepth = 6; 
      let bestScore = -Infinity;
      let bestMove = candidates[0];
      
      // 扩大搜索广度
      const deepSearchPool = candidates.slice(0, 12); 

      for (const move of deepSearchPool) {
          board[move.r][move.c] = aiPlayer;
          // 这里的 minimax 内部也会根据深度动态调整宽度
          const score = minimax(board, searchDepth - 1, -Infinity, Infinity, false, aiPlayer);
          board[move.r][move.c] = Player.None;

          // 这里的 tieBreaker 偏向更有进攻性的棋 (score 包含了 heuristic)
          const tieBreaker = move.score / 5000; 

          if (score + tieBreaker > bestScore) {
              bestScore = score + tieBreaker;
              bestMove = move;
          }
      }
      return bestMove;
  }

  return candidates[0];
};

// --- 拼图/残局生成器 ---
export const generatePuzzle = (difficulty: Difficulty): PuzzleState => {
    const board = createEmptyBoard();
    const moveHistory: {r: number, c: number, player: Player}[] = [];
    
    let moveCount = 0;
    let puzzleTitle = "";
    
    if (difficulty === Difficulty.Easy) {
        moveCount = Math.floor(Math.random() * 8) + 8;
        puzzleTitle = "初级残局";
    } else if (difficulty === Difficulty.Medium) {
        moveCount = Math.floor(Math.random() * 12) + 16;
        puzzleTitle = "中级珍珑";
    } else {
        moveCount = Math.floor(Math.random() * 15) + 30;
        puzzleTitle = difficulty === Difficulty.Extreme ? "绝世死局" : "高级死活";
    }
    
    let currentPlayer = Player.Black;
    const centerX = 7, centerY = 7;
    board[centerX][centerY] = Player.Black;
    moveHistory.push({r: centerX, c: centerY, player: Player.Black});
    currentPlayer = Player.White;
    
    // 使用中/高 AI 模拟对局
    const simDiff = difficulty === Difficulty.Extreme ? Difficulty.Hard : Difficulty.Medium;

    for (let i = 1; i < moveCount; i++) {
        const move = getAIMove(board, currentPlayer, simDiff, 2); 
        if (!move) break;
        board[move.r][move.c] = currentPlayer;
        
        if (checkWin(board, move.r, move.c, currentPlayer)) {
            board[move.r][move.c] = Player.None; 
            break; 
        }
        moveHistory.push({r: move.r, c: move.c, player: currentPlayer});
        currentPlayer = currentPlayer === Player.Black ? Player.White : Player.Black;
    }
    
    const puzzleId = Math.floor(Math.random() * 9999);
    return {
        board,
        nextPlayer: currentPlayer,
        difficulty,
        title: `${puzzleTitle} #${puzzleId}`,
        description: difficulty === Difficulty.Extreme ? "神之一手，唯有一解。" : "寻找制胜良机。",
        moveHistory
    };
};

// --- 复盘分析 (使用新的评分系统) ---
export const analyzeMatch = (moveHistory: {r: number, c: number, player: Player}[]): AnalysisResult => {
  const board = createEmptyBoard();
  const keyMoves: MoveAnalysis[] = [];
  const advantageCurve: number[] = [0];
  const winRateCurve: number[] = [50];

  let prevWinRate = 50;
  
  moveHistory.forEach((move, index) => {
    const { r, c, player } = move;
    
    // 计算这一步之前的评分（用于对比）
    const scoreBefore = evaluateBoardState(board, Player.Black);
    
    board[r][c] = player;
    
    // 计算这一步之后的评分
    const blackScore = evaluateBoardState(board, Player.Black);
    
    // 胜率转换公式 (Sigmoid 变体)
    let winRate = 100 / (1 + Math.exp(-blackScore / 10000));
    const win = checkWin(board, r, c, player);
    if (win) winRate = player === Player.Black ? 100 : 0;

    let type: MoveType = 'normal';
    let description = '常规推进';
    const wrChange = player === Player.Black ? (winRate - prevWinRate) : (prevWinRate - winRate);
    
    if (win) { type = 'victory'; description = '绝杀！五子连珠。'; }
    else if (wrChange > 20) { type = 'brilliant'; description = '神之一手！'; }
    else if (wrChange > 10) { type = 'attack'; description = '强力进攻'; }
    else if (wrChange < -20) { type = 'blunder'; description = '重大失误'; }
    else if (wrChange < -10) { type = 'mistake'; description = '疑问手'; }
    else {
        // 根据局部棋形细化描述
        const local = evaluateLine(board, r, c, 1, 0, player) + evaluateLine(board, r, c, 0, 1, player) + evaluateLine(board, r, c, 1, 1, player) + evaluateLine(board, r, c, 1, -1, player);
        if (local >= SCORE.LIVE_4) { type='attack'; description='活四杀机！'; }
        else if (local >= SCORE.RUSH_4) { type='attack'; description='冲四逼应'; }
        else if (local >= SCORE.LIVE_3) { type='attack'; description='活三布局'; }
        else if (local >= SCORE.LIVE_2) { type='normal'; description='活二拓展'; }
        else { type='defense'; description='稳健防守'; }
    }

    advantageCurve.push(blackScore);
    winRateCurve.push(winRate);
    
    // 筛选关键手：胜率波动大，或者是特定棋形，或者是每10步记录一次
    if (Math.abs(wrChange) > 5 || (type !== 'normal' && type !== 'defense') || index === moveHistory.length-1) {
        keyMoves.push({ moveIndex: index, player, r, c, type, score: blackScore, description, winRate });
    }
    prevWinRate = winRate;
  });

  const calculateStats = (p: Player) => {
      const moves = keyMoves.filter(m => m.player === p);
      const count = moves.length || 1;
      const mistakes = moves.filter(m => m.type === 'mistake' || m.type === 'blunder').length;
      return {
          accuracy: Math.max(0, 100 - (mistakes / count) * 100),
          aggression: Math.min(100, (moves.filter(m => m.type === 'attack').length / count) * 150),
          defense: Math.min(100, (moves.filter(m => m.type === 'defense').length / count) * 150),
          stability: Math.max(0, 100 - (mistakes * 10)),
          complexity: Math.min(100, moveHistory.length * 1.5),
          endgame: moveHistory.length > 40 ? 90 : 50
      };
  };

  const winner = moveHistory.length > 0 ? (checkWin(board, moveHistory[moveHistory.length-1].r, moveHistory[moveHistory.length-1].c, moveHistory[moveHistory.length-1].player) ? moveHistory[moveHistory.length-1].player : null) : null;
  
  return {
      totalMoves: moveHistory.length,
      winner,
      blackStats: calculateStats(Player.Black),
      whiteStats: calculateStats(Player.White),
      advantageCurve,
      winRateCurve,
      keyMoves,
      summary: winner ? "胜负已分。" : "平局收场。"
  };
};