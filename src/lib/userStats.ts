import { ref, set, get, update, query, orderByChild, limitToLast } from 'firebase/database';
import { db } from './firebase';
import { GameMode } from './types';

export interface UserProfile {
  nickname: string;
  email: string;
  bestScoreWorld: number;
  bestScoreCatalunya: number;
  bestScoreEstadis?: number;
  bestScoreCultural?: number;
  total5k: number;
  // 👈 AFEGIT: Les modalitats noves i el control de vídeos
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
  lastVideoUploadDate?: string;
  avatarUrl?: string; // 👈 NOU
  badges?: string[];  // 👈 NOU
  totalGames?: number; // Per a l'insígnia de 10 partides
  totalWins?: number;  // Per a l'insígnia de 50 victòries
}

export interface LeaderboardEntry {
  uid: string;
  nickname: string;
  score: number;
  total5k?: number;
  avatarUrl?: string; // 👈 NOU
  badges?: string[];  // 👈 NOU
}

// Crea el perfil d'usuari nou a la base de dades
export async function createUserProfile(uid: string, nickname: string, email: string): Promise<void> {
  await set(ref(db, `users/${uid}`), {
    nickname,
    email,
    bestScoreWorld: 0,
    bestScoreCatalunya: 0,
    total5k: 0,
  } satisfies UserProfile);
}

// Retorna el perfil complet d'un usuari
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await get(ref(db, `users/${uid}`));
  return snap.exists() ? (snap.val() as UserProfile) : null;
}

// Actualitza el bestScore i el total5k al final d'una partida
// totalGameScore: puntuació total de la partida (suma de 5 rondes)
// roundScores: array de puntuacions de cada ronda (per comptar els 5k)
export async function updateUserStatsAfterGame(
  uid: string,
  gameMode: GameMode | string,
  timeMode: string,
  totalGameScore: number,
  roundScores: number[],
  isWinner: boolean, // 👈 NOU: Necessitem saber si ha guanyat
  gameType: string = 'classic', // 👈 NOU
  roundHints: boolean[] = [] // 👈 NOU
): Promise<string[]> {
  const profile: any = await getUserProfile(uid);
  if (!profile) return [];

  // Construïm el nom de la caixa exacta depenent del mode i el temps
  let bestField = `bestScoreWorld_${timeMode}`;
  if (gameMode === 'catalunya') {
    bestField = `bestScoreCatalunya_${timeMode}`;
  } else if (gameMode === 'estadis') {
    bestField = `bestScoreEstadis_${timeMode}`;
  } else if (gameMode === 'cultural') {
    bestField = `bestScoreCultural_${timeMode}`;
  }

  const currentBest = profile[bestField] ?? 0;
  const updates: Record<string, any> = {};

  // 1. Comptar 5K (Només si no s'ha usat pista!)
  const new5k = roundScores.filter((s, idx) => s >= 5000 && !roundHints[idx]).length;
  updates.total5k = (profile.total5k ?? 0) + new5k;

  // 2. Actualitzar millor puntuació (Només en mode clàssic!)
  if (gameType === 'classic' && totalGameScore > currentBest) {
    updates[bestField] = totalGameScore;

    // També actualitzem el camp global per al rànquing
    let globalField = 'bestScoreWorld';
    if (gameMode === 'catalunya') globalField = 'bestScoreCatalunya';
    else if (gameMode === 'estadis') globalField = 'bestScoreEstadis';
    else if (gameMode === 'cultural') globalField = 'bestScoreCultural';

    const currentGlobalBest = profile[globalField] ?? 0;
    if (totalGameScore > currentGlobalBest) {
      updates[globalField] = totalGameScore;
    }
  }

  // 3. Increment de partides i victòries
  updates.totalGames = (profile.totalGames ?? 0) + 1;
  if (isWinner) {
    updates.totalWins = (profile.totalWins ?? 0) + 1;
  }

  // 4. LÒGICA D'INSÍGNIES (Automàtica)
  const currentBadges = profile.badges || [];
  const newBadges = [...currentBadges];
  const earnedNow: string[] = [];

  const checkAndAdd = (id: string) => {
    if (!newBadges.includes(id)) {
      newBadges.push(id);
      earnedNow.push(id);
    }
  };

  // Brúixola d'Or (10 partides)
  if (updates.totalGames >= 10) checkAndAdd("Brúixola d'Or");

  // Franctirador (Un 5k perfecte i sense pista)
  const has5kThisRound = roundScores.some((s, idx) => s >= 5000 && !roundHints[idx]);
  if (has5kThisRound) checkAndAdd("Franctirador");

  // Pubilla/Hereu de la Forca (Guanyar a Catalunya)
  if (gameMode === 'catalunya' && isWinner) checkAndAdd("Pubilla/Hereu de la Forca");

  // Llegendari (50 victòries)
  if (updates.totalWins >= 50) checkAndAdd("Llegendari");

  // Lofish the goat (Guanya la teva primera partida)
  if (updates.totalWins >= 1) checkAndAdd("Lofish the goat");

  // Uri Badia (Guanya a estadis)
  if (gameMode === 'estadis' && isWinner) checkAndAdd("Uri Badia");

  if (earnedNow.length > 0) {
    updates.badges = newBadges;
  }

  await update(ref(db, `users/${uid}`), updates);
  return earnedNow;
}

// Top 10 per mode
export async function getLeaderboard(mode: GameMode | string, limit = 10): Promise<LeaderboardEntry[]> {
  let field = 'bestScoreWorld';
  if (mode === 'catalunya') field = 'bestScoreCatalunya';
  else if (mode === 'estadis') field = 'bestScoreEstadis';
  else if (mode === 'cultural') field = 'bestScoreCultural';
  const q = query(ref(db, 'users'), orderByChild(field), limitToLast(limit));
  const snap = await get(q);
  if (!snap.exists()) return [];

  const entries: LeaderboardEntry[] = [];
  snap.forEach((child) => {
    const data = child.val() as any;
    const score = data[field] ?? 0;
    if (score > 0) {
      entries.push({
        uid: child.key!,
        nickname: data.nickname,
        score,
        avatarUrl: data.avatarUrl,
        badges: data.badges
      });
    }
  });

  return entries.sort((a, b) => b.score - a.score);
}

// Top 10 per total de rondes perfectes
export async function get5kMasters(limit = 10): Promise<LeaderboardEntry[]> {
  const q = query(ref(db, 'users'), orderByChild('total5k'), limitToLast(limit));
  const snap = await get(q);
  if (!snap.exists()) return [];

  const entries: LeaderboardEntry[] = [];
  snap.forEach((child) => {
    const data = child.val() as UserProfile;
    if ((data.total5k ?? 0) > 0) {
      entries.push({
        uid: child.key!,
        nickname: data.nickname,
        score: 0,
        total5k: data.total5k,
        avatarUrl: data.avatarUrl,
        badges: data.badges
      });
    }
  });

  return entries.sort((a, b) => (b.total5k ?? 0) - (a.total5k ?? 0));
}