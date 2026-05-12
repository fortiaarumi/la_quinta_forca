import { ref, set, get, update, query, orderByChild, limitToLast } from 'firebase/database';
import { db } from './firebase';
import { GameMode, DailyQuest, WeeklyQuest, UserProfile } from './types';

export const QUEST_POOL = [
  { id: 'play_3_games', description: 'Jugar 3 partides', target: 3, xpReward: 300 },
  { id: 'get_1_5k', description: 'Aconseguir un 5K', target: 1, xpReward: 500 },
  { id: 'play_catalunya', description: 'Jugar a Catalunya', target: 1, xpReward: 200 },
  { id: 'score_15k', description: 'Superar 15.000 punts', target: 1, xpReward: 500 },
  { id: 'win_1_game', description: 'Guanyar una partida', target: 1, xpReward: 400 },
  { id: 'play_bala', description: 'Jugar en mode Bala', target: 1, xpReward: 300 },
  { id: 'win_3_pixapins', description: 'Guanyar 3 partides a Pixapins', target: 3, xpReward: 600 },
  { id: 'win_1_world', description: 'Guanyar una partida a Món', target: 1, xpReward: 400 },
  { id: 'duel_6_rounds', description: 'Fer un duel de més de 6 rondes', target: 1, xpReward: 500 },
  { id: 'generate_song', description: 'Generar una cançó satírica al final d\'una partida', target: 1, xpReward: 400 },
  { id: 'suggest_video', description: 'Sugerir 1 vídeo del dia', target: 1, xpReward: 300 } // 👈 NOU
];

export const WEEKLY_QUEST_POOL = [
  { id: 'complete_15_daily', description: 'Completar 15 objectius diaris', target: 15, xpReward: 2000 },
  { id: 'win_20_matches', description: 'Guanyar 20 partides totals', target: 20, xpReward: 3000 },
  { id: 'play_5_br', description: 'Jugar 5 Battle Royale', target: 5, xpReward: 1500 },
  { id: 'score_20k_single', description: 'Superar 20.000 punts en una partida', target: 1, xpReward: 2000 },
  { id: 'suggest_3_videos', description: 'Sugerir 3 vídeos del dia', target: 3, xpReward: 1500 },
  { id: 'win_5_1vs1', description: 'Guanyar 5 duels 1vs1', target: 5, xpReward: 1800 },
  { id: 'get_5_5k', description: 'Aconseguir 5 rondes de 5K', target: 5, xpReward: 2200 },
  { id: 'reveal_100_hints', description: 'Revelar 100 pistes', target: 100, xpReward: 1500 },
  { id: 'play_10_games', description: 'Jugar 10 partides totals', target: 10, xpReward: 1200 },
  { id: 'win_10_games', description: 'Guanyar 10 partides totals', target: 10, xpReward: 2500 },
  { id: 'play_world_5', description: 'Jugar 5 partides al Món', target: 5, xpReward: 1000 },
  { id: 'play_cat_5', description: 'Jugar 5 partides a Catalunya', target: 5, xpReward: 1000 },
  { id: 'win_3_estadis', description: 'Guanyar 3 partides a Estadis', target: 3, xpReward: 1500 },
  { id: 'win_3_cultural', description: 'Guanyar 3 partides a Cultura', target: 3, xpReward: 1500 },
  { id: 'win_3_pixapins', description: 'Guanyar 3 partides a Pixapins', target: 3, xpReward: 1500 }
];

export function generateDailyQuests(): DailyQuest[] {
  const shuffled = [...QUEST_POOL].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3).map(q => ({
    id: q.id,
    description: q.description,
    target: q.target,
    xpReward: q.xpReward,
    progress: 0,
    completed: false
  }));
}

export function generateWeeklyQuests(): WeeklyQuest[] {
  const shuffled = [...WEEKLY_QUEST_POOL].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3).map(q => ({
    ...q,
    progress: 0,
    completed: false
  }));
}

export async function checkAndUpdateDailyLogin(uid: string): Promise<UserProfile | null> {
  const profile = await getUserProfile(uid);
  if (!profile) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const lastLogin = profile.lastLoginDate;
  const now = new Date();
  const day = now.getDay(); // 0 diumenge, 1 dilluns...
  const lastWeekly = profile.lastWeeklyReset ? new Date(profile.lastWeeklyReset) : null;
  
  // ── RESET SETMANAL (Cada dilluns o si falten/sobren) ──
  let shouldResetWeekly = false;
  const currentWeeklyCount = profile.weeklyQuests ? profile.weeklyQuests.length : 0;

  if (!lastWeekly || !profile.weeklyQuests || currentWeeklyCount > 3) {
    shouldResetWeekly = true;
  } else {
    // Si avui és dilluns i l'últim reset no va ser avui
    const today = now.toISOString().split('T')[0];
    const lastStr = lastWeekly.toISOString().split('T')[0];
    if (day === 1 && today !== lastStr) {
      shouldResetWeekly = true;
    }
  }

  // Si ja ha entrat avui i ja té objectius setmanals, podem sortir
  if (lastLogin === todayStr && !shouldResetWeekly) {
    return profile;
  }

  const updates: Partial<UserProfile> = {};

  // Actualitzar data de login i ratxa si cal
  if (lastLogin !== todayStr) {
    updates.lastLoginDate = todayStr;
    if (lastLogin) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      if (lastLogin === yesterdayStr) {
        updates.currentStreak = (profile.currentStreak || 0) + 1;
      } else {
        updates.currentStreak = 1;
      }
    } else {
      updates.currentStreak = 1;
    }
    updates.dailyQuests = generateDailyQuests();
  }

  if (shouldResetWeekly) {
    updates.weeklyQuests = generateWeeklyQuests();
    updates.lastWeeklyReset = now.toISOString();
    updates.dailyQuestsCompleted = 0;
    updates.brMatchesPlayed = 0;
    updates.videoSuggestions = 0;
  }

  if (Object.keys(updates).length > 0) {
    await update(ref(db, `users/${uid}`), updates);
  }
  
  return { ...profile, ...updates };
}

// Completa la quest de generar cançó satírica si està activa
export async function completeSongQuest(uid: string): Promise<{ leveledUp: boolean, newLevel: number, description: string } | null> {
  const profile = await getUserProfile(uid);
  if (!profile || !profile.dailyQuests) return null;

  const quests = profile.dailyQuests;
  const questIdx = quests.findIndex(q => q.id === 'generate_song' && !q.completed);
  if (questIdx === -1) return null; // No té aquesta quest avui o ja la va completar

  const updatedQuests = [...quests];
  updatedQuests[questIdx] = { ...updatedQuests[questIdx], progress: 1, completed: true };

  const xpReward = updatedQuests[questIdx].xpReward;
  let currentLevel = profile.level || 1;
  let currentXP = (profile.xp || 0) + xpReward;
  const prevLevel = currentLevel;

  while (currentXP >= currentLevel * 1000) {
    currentXP -= currentLevel * 1000;
    currentLevel++;
  }

  await update(ref(db, `users/${uid}`), {
    dailyQuests: updatedQuests,
    level: currentLevel,
    xp: currentXP
  });

  return { leveledUp: currentLevel > prevLevel, newLevel: currentLevel, description: updatedQuests[questIdx].description };
}

export interface LeaderboardEntry {
  uid: string;
  nickname: string;
  score: number;
  total5k?: number;
  avatarUrl?: string; // 👈 NOU
  badges?: string[];  // 👈 NOU
  selectedBadges?: string[]; // 👈 NOU
}

// Crea el perfil d'usuari nou a la base de dades
export async function createUserProfile(uid: string, nickname: string, email: string): Promise<void> {
  await set(ref(db, `users/${uid}`), {
    nickname,
    email,
    bestScoreWorld: 0,
    bestScoreCatalunya: 0,
    bestScorePixapins: 0,
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
export interface GameResult {
  badges: string[];
  leveledUp: boolean;
  newLevel: number;
  completedQuests: string[];
}

export async function updateUserStatsAfterGame(
  uid: string,
  gameMode: GameMode | string,
  timeMode: string,
  totalGameScore: number,
  roundScores: number[],
  isWinner: boolean,
  gameType: string = 'classic',
  roundHints: boolean[] = [],
  totalPlayers: number = 1,
  isLast: boolean = false
): Promise<GameResult> {
  const profile: Record<string, any> | null = await getUserProfile(uid);
  if (!profile) return { badges: [], leveledUp: false, newLevel: 1, completedQuests: [] };

  // Construïm el nom de la caixa exacta depenent del mode i el temps
  let bestField = `bestScoreWorld_${timeMode}`;
  if (gameMode === 'catalunya') {
    bestField = `bestScoreCatalunya_${timeMode}`;
  } else if (gameMode === 'estadis') {
    bestField = `bestScoreEstadis_${timeMode}`;
  } else if (gameMode === 'cultural') {
    bestField = `bestScoreCultural_${timeMode}`;
  } else if (gameMode === 'pixapins') {
    bestField = `bestScorePixapins_${timeMode}`;
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
    else if (gameMode === 'pixapins') globalField = 'bestScorePixapins';

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
  // Actualitzacions Específiques de Perfil
  const newHintsCount = roundHints.filter(h => h).length;
  updates.hintsRevealed = (profile.hintsRevealed ?? 0) + newHintsCount;

  if (isWinner && gameType === '1vs1') {
    updates.totalWins1vs1 = (profile.totalWins1vs1 ?? 0) + 1;
  }

  // 4. LÒGICA D'INSÍGNIES (Automàtica)
  const ALL_BADGE_IDS = [
    "Vinicius Blanc", "Franctirador", "Catalayudd", "Vinicius Butanero", 
    "Lofish the goat", "Uri Badia", "Rocha", "Duel Joan", "Pausu", 
    "Muniani", "David Txuc", "Humiliació"
  ];
  
  // Netejem possibles insígnies antigues que l'usuari tingués guardades
  const currentBadges = (profile.badges || []).filter((b: string) => ALL_BADGE_IDS.includes(b));
  const newBadges = [...currentBadges];
  const earnedNow: string[] = [];

  const checkAndAdd = (id: string) => {
    if (!newBadges.includes(id)) {
      newBadges.push(id);
      earnedNow.push(id);
    }
  };

  if (updates.totalGames >= 10) checkAndAdd("Vinicius Blanc");
  if (roundScores.some((s, idx) => s >= 5000 && !roundHints[idx])) checkAndAdd("Franctirador");
  if (gameMode === 'catalunya' && isWinner) checkAndAdd("Catalayudd");
  if (updates.totalWins >= 50) checkAndAdd("Vinicius Butanero");
  if (updates.totalWins >= 1) checkAndAdd("Lofish the goat");
  if (gameMode === 'estadis' && isWinner) checkAndAdd("Uri Badia");

  // Insígnies Especials
  if (gameType === 'battle_royale' && isWinner && totalPlayers > 8) checkAndAdd("Rocha");
  if ((updates.totalWins1vs1 || profile.totalWins1vs1 || 0) >= 15) checkAndAdd("Duel Joan");
  if (gameMode === 'cultural' && isWinner) checkAndAdd("Pausu");
  if (updates.hintsRevealed >= 500) checkAndAdd("Muniani");

  // Lògica David Txuc: Ha de tenir puntuació en les 15 combinacions (12 d'abans + 3 pixapins)
  const modes = ['World', 'Catalunya', 'Estadis', 'Cultural', 'Pixapins'];
  const times = ['bala', 'normal', 'infinit'];
  const hasPlayedAll = modes.every(m =>
    times.every(t => {
      const field = `bestScore${m}_${t}`;
      return (updates[field] !== undefined || profile[field] > 0);
    })
  );
  if (hasPlayedAll) checkAndAdd("David Txuc");
  if (gameType === 'battle_royale' && isLast && totalPlayers > 8) checkAndAdd("Humiliació");

  if (earnedNow.length > 0) {
    updates.badges = newBadges;
  }

  // 5. LÒGICA D'XP I OBJECTIUS DIARIS
  const xpBase = Math.floor(totalGameScore / 10);
  const streak = profile.currentStreak || 1;
  const xpMultiplier = 1 + (streak * 0.1);
  let xpEarned = Math.floor(xpBase * xpMultiplier);

  let quests = profile.dailyQuests ? [...profile.dailyQuests] : [];
  let questsUpdated = false;

  quests = quests.map(q => {
    if (q.completed) return q;
    let increment = 0;
    
    switch (q.id) {
      case 'play_3_games':
        increment = 1;
        break;
      case 'get_1_5k':
        increment = new5k;
        break;
      case 'play_catalunya':
        if (gameMode === 'catalunya') increment = 1;
        break;
      case 'score_15k':
        if (totalGameScore >= 15000) increment = 1;
        break;
      case 'win_1_game':
        if (isWinner) increment = 1;
        break;
      case 'play_bala':
        if (timeMode === 'bala') increment = 1;
        break;
      case 'win_3_pixapins':
        if (isWinner && gameMode === 'pixapins') increment = 1;
        break;
      case 'win_1_world':
        if (isWinner && gameMode === 'world') increment = 1;
        break;
      case 'duel_6_rounds':
        if (gameType === '1vs1' && roundScores.length > 6) increment = 1;
        break;
    }

    if (increment > 0) {
      questsUpdated = true;
      q.progress += increment;
      if (q.progress >= q.target) {
        q.progress = q.target;
        q.completed = true;
        xpEarned += q.xpReward;
      }
    }
    return q;
  });

  if (questsUpdated) {
    updates.dailyQuests = quests;
    // Comptem quantes s'han completat ara per la setmanal
    const justFinishedCount = quests.filter(q => q.completed && !profile.dailyQuests?.find((orig: any) => orig.id === q.id && orig.completed)).length;
    if (justFinishedCount > 0) {
      updates.dailyQuestsCompleted = (profile.dailyQuestsCompleted || 0) + justFinishedCount;
    }
  }

  // 6. LÒGICA D'OBJECTIUS SETMANALS
  let weeklyQuests = profile.weeklyQuests ? [...profile.weeklyQuests] : [];
  let weeklyUpdated = false;

  weeklyQuests = weeklyQuests.map(wq => {
    if (wq.completed) return wq;
    let progress = wq.progress;

    switch (wq.id) {
      case 'complete_15_daily':
        progress = (updates.dailyQuestsCompleted ?? profile.dailyQuestsCompleted ?? 0);
        break;
      case 'win_20_matches':
        progress = (updates.totalWins ?? profile.totalWins ?? 0);
        break;
      case 'play_5_br':
        if (gameType === 'battle_royale') {
          updates.brMatchesPlayed = (profile.brMatchesPlayed || 0) + 1;
          progress = updates.brMatchesPlayed;
        } else {
          progress = (profile.brMatchesPlayed || 0);
        }
        break;
      case 'score_20k_single':
        if (totalGameScore >= 20000) progress = 1;
        break;
      case 'suggest_3_videos':
        progress = (profile.videoSuggestions || 0);
        break;
      case 'win_5_1vs1':
        progress = (updates.totalWins1vs1 ?? profile.totalWins1vs1 ?? 0);
        break;
      case 'get_5_5k':
        progress = (updates.total5k ?? profile.total5k ?? 0);
        break;
      case 'reveal_100_hints':
        progress = (updates.hintsRevealed ?? profile.hintsRevealed ?? 0);
        break;
      case 'play_10_games':
        progress = (updates.totalGames ?? profile.totalGames ?? 0);
        break;
      case 'win_10_games':
        progress = (updates.totalWins ?? profile.totalWins ?? 0);
        break;
      case 'play_world_5':
        if (gameMode === 'world') {
          updates.worldGamesPlayed = (profile.worldGamesPlayed || 0) + 1;
          progress = updates.worldGamesPlayed;
        } else progress = (profile.worldGamesPlayed || 0);
        break;
      case 'play_cat_5':
        if (gameMode === 'catalunya') {
          updates.catGamesPlayed = (profile.catGamesPlayed || 0) + 1;
          progress = updates.catGamesPlayed;
        } else progress = (profile.catGamesPlayed || 0);
        break;
      case 'win_3_estadis':
        if (isWinner && gameMode === 'estadis') {
          updates.estadisWins = (profile.estadisWins || 0) + 1;
          progress = updates.estadisWins;
        } else progress = (profile.estadisWins || 0);
        break;
      case 'win_3_cultural':
        if (isWinner && gameMode === 'cultural') {
          updates.culturalWins = (profile.culturalWins || 0) + 1;
          progress = updates.culturalWins;
        } else progress = (profile.culturalWins || 0);
        break;
      case 'win_3_pixapins':
        if (isWinner && gameMode === 'pixapins') {
          updates.pixapinsWins = (profile.pixapinsWins || 0) + 1;
          progress = updates.pixapinsWins;
        } else progress = (profile.pixapinsWins || 0);
        break;
    }

    if (progress !== wq.progress) {
      weeklyUpdated = true;
      wq.progress = Math.min(progress, wq.target);
      if (wq.progress >= wq.target) {
        wq.completed = true;
        xpEarned += wq.xpReward;
      }
    }
    return wq;
  });

  if (weeklyUpdated) {
    updates.weeklyQuests = weeklyQuests;
  }

  let currentLevel = profile.level || 1;
  let currentXP = (profile.xp || 0) + xpEarned;
  const prevLevel = currentLevel;
  
  while (currentXP >= currentLevel * 1000) {
    currentXP -= currentLevel * 1000;
    currentLevel++;
  }

  const leveledUp = currentLevel > prevLevel;
  updates.level = currentLevel;
  updates.xp = currentXP;

  // Quests que s'acaben de completar en aquesta partida
  const justCompletedQuests = quests
    .filter(q => q.completed && !profile.dailyQuests?.find((orig: any) => orig.id === q.id && orig.completed))
    .map(q => q.description);

  await update(ref(db, `users/${uid}`), updates);
  return { badges: earnedNow, leveledUp, newLevel: currentLevel, completedQuests: justCompletedQuests };
}

// Top 10 per mode
export async function getLeaderboard(mode: GameMode | string, limit = 10): Promise<LeaderboardEntry[]> {
  let field = 'bestScoreWorld';
  if (mode === 'catalunya') field = 'bestScoreCatalunya';
  else if (mode === 'estadis') field = 'bestScoreEstadis';
  else if (mode === 'cultural') field = 'bestScoreCultural';
  else if (mode === 'pixapins') field = 'bestScorePixapins';
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
        badges: data.badges,
        selectedBadges: data.selectedBadges
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
        badges: data.badges,
        selectedBadges: data.selectedBadges
      });
    }
  });

  return entries.sort((a, b) => (b.total5k ?? 0) - (a.total5k ?? 0));
}