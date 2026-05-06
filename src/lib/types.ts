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
  guessCountry?: string;
  actualCountry?: string;
  usedHint?: boolean; // 👈 NOU
}

export interface RoundData {
  guesses: Record<string, PlayerGuess>;
}

export interface Player {
  name: string;
  joinedAt: number;
  avatarUrl?: string; // 👈 NOU
  badges?: string[];  // 👈 NOU
  health?: number;    // 👈 NOU (per a 1vs1)
  isEliminated?: boolean; // 👈 NOU (per a Battle Royale)
}

export type GameState =
  | 'lobby'
  | 'generating'
  | 'playing'
  | 'roundResults'
  | 'finished';

// Tipus de modes de joc
export type GameMode = 'world' | 'catalunya' | 'estadis' | 'cultural';

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
  isPublic?: boolean; // 👈 NOU
  gameMode?: GameMode;
  timeMode?: TimeMode; // <-- NOVA PROPIETAT AFEGIDA AQUÍ
  gameType?: 'classic' | '1vs1' | 'battle_royale'; // 👈 NOU
  hintsEnabled?: boolean; // 👈 NOU
  roundEndsAt?: number;
  lastLaughAt?: number; // 👈 NOU
  lastCongratsAt?: number; // 👈 NOU
  lastEvent?: { // 👈 NOU
    type: 'leave';
    playerName: string;
    timestamp: number;
  };
  songState?: {
    status: 'idle' | 'generating_lyrics' | 'waiting_for_bot' | 'generating_music' | 'ready' | 'playing' | 'error';
    lyrics?: string;
    audioUrl?: string;
    genre?: string;
    prompt?: string;
    error?: string;
  };
}