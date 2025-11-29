
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
}

export enum GameMode {
  PvP = 'pvp',
  PvE = 'pve',
}

export enum Difficulty {
  Easy = 'easy',
  Medium = 'medium',
  Hard = 'hard',
}

export interface CellData {
  row: number;
  col: number;
  player: Player;
}

export interface WinState {
  winner: Player;
  line: number[][]; // Array of [row, col] coordinates
}

export interface GameState {
  board: Player[][];
  currentPlayer: Player;
  winner: Player | null;
  winningLine: number[][] | null;
  history: Player[][][]; // For undo functionality
  moveHistory: {r: number, c: number, player: Player}[]; // For replay functionality
}

// --- Analysis Types ---
export type MoveType = 'victory' | 'attack' | 'defense' | 'brilliant' | 'normal' | 'blunder';

export interface MoveAnalysis {
  moveIndex: number;
  player: Player;
  r: number;
  c: number;
  type: MoveType;
  score: number;
  description: string;
}

export interface AnalysisResult {
  totalMoves: number;
  blackAccuracy: number; // 0-100 placeholder
  whiteAccuracy: number; // 0-100 placeholder
  keyMoves: MoveAnalysis[];
}

// --- History Types ---
export interface MatchRecord {
  id: string;
  timestamp: number;
  mode: GameMode;
  difficulty?: Difficulty;
  winner: Player;
  moves: number;
  moveHistory: {r: number, c: number, player: Player}[];
  skin: Skin;
}
