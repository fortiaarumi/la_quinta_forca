import { ref, get, set, update, remove, query, orderByChild, equalTo } from 'firebase/database';
import { db } from './firebase';

// 1. Buscar un usuari pel seu email exacte
export async function getUserByEmail(email: string) {
  // Busquem a la carpeta 'users' algú que tingui aquest email
  const q = query(ref(db, 'users'), orderByChild('email'), equalTo(email.toLowerCase()));
  const snap = await get(q);
  
  if (!snap.exists()) return null;
  
  let foundUser = null;
  snap.forEach((child) => {
    foundUser = { uid: child.key, ...child.val() };
  });
  return foundUser;
}

// 2. Enviar petició d'amistat
export async function sendFriendRequest(myUid: string, targetUid: string) {
  if (myUid === targetUid) throw new Error("No pots ser amic de tu mateix!");
  // Deixem una "carta" a la bústia de l'altre usuari
  await set(ref(db, `users/${targetUid}/friendRequests/${myUid}`), Date.now());
}

// 3. Acceptar petició
export async function acceptFriendRequest(myUid: string, friendUid: string) {
  const updates: Record<string, any> = {};
  
  // Ens afegim mútuament a les llistes d'amics (Posem 'true' per dir que som amics)
  updates[`users/${myUid}/friends/${friendUid}`] = true;
  updates[`users/${friendUid}/friends/${myUid}`] = true;
  
  // Esborrem la petició pendent perquè ja està contestada
  updates[`users/${myUid}/friendRequests/${friendUid}`] = null;
  
  // Executem tots els canvis de cop
  await update(ref(db, '/'), updates);
}

// 4. Rebutjar petició
export async function rejectFriendRequest(myUid: string, friendUid: string) {
  await remove(ref(db, `users/${myUid}/friendRequests/${friendUid}`));
}