import { ref, set, get, update, query, orderByChild, limitToLast } from 'firebase/database';
import { db } from './firebase';
import { GameMode } from './types';

export interface UserProfile {
  nickname: string;
  email: string;
  bestScoreWorld: number;
  bestScoreCatalunya: number;
  total5k: number;
}

export interface LeaderboardEntry {
  uid: string;
  nickname: string;
  score: number;
  total5k?: number;
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
  gameMode: GameMode,
  totalGameScore: number,
  roundScores: number[]
): Promise<void> {
  const profile = await getUserProfile(uid);
  if (!profile) return;

  const bestField = gameMode === 'catalunya' ? 'bestScoreCatalunya' : 'bestScoreWorld';
  const currentBest = profile[bestField] ?? 0;

  // Rondes perfectes en aquesta partida
  const new5k = roundScores.filter((s) => s >= 5000).length;

  const updates: Partial<UserProfile> = {
    total5k: (profile.total5k ?? 0) + new5k,
  };

  if (totalGameScore > currentBest) {
    updates[bestField] = totalGameScore;
  }

  await update(ref(db, `users/${uid}`), updates);
}

// Top 10 per mode (world o catalunya)
export async function getLeaderboard(mode: GameMode, limit = 10): Promise<LeaderboardEntry[]> {
  const field = mode === 'catalunya' ? 'bestScoreCatalunya' : 'bestScoreWorld';
  const q = query(ref(db, 'users'), orderByChild(field), limitToLast(limit));
  const snap = await get(q);
  if (!snap.exists()) return [];

  const entries: LeaderboardEntry[] = [];
  snap.forEach((child) => {
    const data = child.val() as UserProfile;
    const score = data[field] ?? 0;
    if (score > 0) {
      entries.push({ uid: child.key!, nickname: data.nickname, score });
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
      entries.push({ uid: child.key!, nickname: data.nickname, score: 0, total5k: data.total5k });
    }
  });

  return entries.sort((a, b) => (b.total5k ?? 0) - (a.total5k ?? 0));
}