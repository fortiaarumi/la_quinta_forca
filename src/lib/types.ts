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
  sharedHint?: { // 👈 NOU
    type: string;
    value: string;
    imageUrl?: string;
    isFree?: boolean; // 👈 NOU
  };
}

export interface Player {
  name: string;
  joinedAt: number;
  avatarUrl?: string;
  badges?: string[];
  selectedBadges?: string[]; // 👈 NOU
  health?: number;
  isEliminated?: boolean;
  eliminatedAtRound?: number;
}

export interface UserProfile {
  nickname: string;
  email: string;
  bestScoreWorld: number;
  bestScoreCatalunya: number;
  bestScoreEstadis?: number;
  bestScoreCultural?: number;
  total5k: number;
  bestScoreWorld_bala?: number;
  bestScoreWorld_normal?: number;
  bestScoreWorld_infinit?: number;
  bestScoreCatalunya_bala?: number;
  bestScoreCatalunya_normal?: number;
  bestScoreCatalunya_infinit?: number;
  bestScoreEstadis_bala?: number;
  bestScoreEstadis_normal?: number;
  bestScoreEstadis_infinit?: number;
  bestScoreCultural_bala?: number;
  bestScoreCultural_normal?: number;
  bestScoreCultural_infinit?: number;
  bestScorePixapins?: number;
  bestScorePixapins_bala?: number;
  bestScorePixapins_normal?: number;
  bestScorePixapins_infinit?: number;
  lastVideoUploadDate?: string;
  avatarUrl?: string;
  badges?: string[];
  selectedBadges?: string[]; // 👈 NOU: Insígnies fixades pel jugador
  totalGames?: number;
  totalWins?: number;
  totalWins1vs1?: number; // 👈 NOU: Insígnia Duel Joan
  hintsRevealed?: number; // 👈 NOU: Insígnia Muniani
}

export type GameState =
  | 'lobby'
  | 'generating'
  | 'playing'
  | 'roundResults'
  | 'finished';

// Tipus de modes de joc
export type GameMode = 'world' | 'catalunya' | 'estadis' | 'cultural' | 'pixapins';

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
  tieBreak?: {
    players: string[];
    loserId: string;
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