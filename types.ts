
export enum Player {
  None = 0,
  Black = 1,
  White = 2,
}

export enum Theme {
  Day = 'day',
  Night = 'night',
}

export enum Skin {
  Classic = 'classic',
  Cyber = 'cyber',
  Ink = 'ink',
  Dragon = 'dragon',
  Forest = 'forest',
  Ocean = 'ocean',
  Sakura = 'sakura',
  Nebula = 'nebula',
  Sunset = 'sunset',
  Glacier = 'glacier',
  Alchemy = 'alchemy',
  Aurora = 'aurora',
  Celestia = 'celestia',
}

export enum GameMode {
  PvP = 'pvp',
  PvE = 'pve',
  Puzzle = 'puzzle', 
}

export enum Difficulty {
  Easy = 'easy',
  Medium = 'medium',
  Hard = 'hard',
  Extreme = 'extreme', // 地狱模式
}

export interface CellData {
  row: number;
  col: number;
  player: Player;
}

export interface WinState {
  winner: Player;
  line: number[][]; 
}

export interface GameState {
  board: Player[][];
  currentPlayer: Player;
  winner: Player | null;
  winningLine: number[][] | null;
  history: Player[][][]; 
  moveHistory: {r: number, c: number, player: Player}[]; 
  openingName?: string; 
}

export interface GameSettings {
  timeLimit: number; 
  zenMode: boolean;
}

// --- Dynamic Puzzle State ---
export interface PuzzleState {
  board: Player[][];
  nextPlayer: Player;
  difficulty: Difficulty;
  title: string;
  description: string;
  moveHistory: {r: number, c: number, player: Player}[];
}

// --- Analysis Types ---
export type MoveType = 'victory' | 'attack' | 'defense' | 'brilliant' | 'normal' | 'mistake' | 'blunder';

export interface MoveAnalysis {
  moveIndex: number;
  player: Player;
  r: number;
  c: number;
  type: MoveType;
  score: number;
  description: string;
  winRate: number; 
}

export interface PlayerStats {
  accuracy: number; 
  aggression: number; 
  defense: number; 
  stability: number; 
  complexity: number; 
  endgame: number; 
}

export interface AnalysisResult {
  totalMoves: number;
  winner: Player | null;
  blackStats: PlayerStats;
  whiteStats: PlayerStats;
  advantageCurve: number[]; 
  winRateCurve: number[]; 
  keyMoves: MoveAnalysis[];
  summary: string;
}

export interface MatchRecord {
  id: string;
  timestamp: number;
  mode: GameMode;
  difficulty?: Difficulty;
  winner: Player;
  moves: number;
  moveHistory: {r: number, c: number, player: Player}[];
  skin: Skin;
  timeLimit?: number;
}