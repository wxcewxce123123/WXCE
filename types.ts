
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
export type MoveType = 'victory' | 'attack' | 'defense' | 'brilliant' | 'normal' | 'mistake' | 'blunder';

export interface MoveAnalysis {
  moveIndex: number;
  player: Player;
  r: number;
  c: number;
  type: MoveType;
  score: number;
  description: string;
  advantage: number; // -100 to 100 (Black to White)
}

export interface PlayerStats {
  accuracy: number; // 0-100
  aggression: number; // 0-100
  defense: number; // 0-100
  stability: number; // 0-100
  complexity: number; // 0-100
  endgame: number; // 0-100
}

export interface AnalysisResult {
  totalMoves: number;
  winner: Player | null;
  blackStats: PlayerStats;
  whiteStats: PlayerStats;
  advantageCurve: number[]; // Array of values from -100 (White Max) to 100 (Black Max)
  keyMoves: MoveAnalysis[];
  summary: string;
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
