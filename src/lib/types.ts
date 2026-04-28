export interface Location {
  lat: number;
  lng: number;
  panoId: string;
}

export interface PlayerGuess {
  lat: number;
  lng: number;
  distance: number;
  score: number;
}

export interface RoundData {
  guesses: Record<string, PlayerGuess>;
}

export interface Player {
  name: string;
  joinedAt: number;
}

export type GameState =
  | 'lobby'
  | 'generating'
  | 'playing'
  | 'roundResults'
  | 'finished';

export type GameMode = 'world' | 'catalunya';

export interface Room {
  hostId: string;
  players: Record<string, Player>;
  locations?: Location[];
  currentRound: number;
  gameState: GameState;
  rounds?: Record<string, RoundData>;
  totalScores?: Record<string, number>;
  createdAt: number;
  isSinglePlayer?: boolean;
  gameMode?: GameMode;
  roundEndsAt?: number;
}
