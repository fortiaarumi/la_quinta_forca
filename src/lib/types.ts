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

// Tipus de modes de joc
export type GameMode = 'world' | 'catalunya';

// NOU: Tipus per al ritme de la partida
export type TimeMode = 'bala' | 'normal' | 'infinit';

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
  timeMode?: TimeMode; // <-- NOVA PROPIETAT AFEGIDA AQUÍ
  roundEndsAt?: number;
  songState?: {
    status: 'idle' | 'generating_lyrics' | 'generating_music' | 'ready' | 'playing' | 'error';
    lyrics?: string;
    audioUrl?: string;
    genre?: string;
    error?: string;
  };
}