'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, get, onValue, onDisconnect, set } from 'firebase/database';
import { auth, db } from './firebase';

interface AuthContextType {
  user: User | null;
  nickname: string | null;
  isGuest: boolean;
  loading: boolean;
  logout: () => Promise<void>;
  setGuestMode: (v: boolean) => void;
  loginAsGuest: () => void; // Afegim la definició aquí
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  nickname: null,
  isGuest: false,
  loading: true,
  logout: async () => {},
  setGuestMode: () => {},
  loginAsGuest: () => {}, // I aquí
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        setIsGuest(false);
        try {
          // 1. Busquem el Nickname
          const snap = await get(ref(db, `users/${u.uid}/nickname`));
          if (snap.exists()) setNickname(snap.val() as string);

          // 2. SISTEMA DE PRESÈNCIA (Nou radar)
          const userStatusRef = ref(db, `users/${u.uid}/status`);
          const connectedRef = ref(db, '.info/connected');

          onValue(connectedRef, (snap) => {
            // Si el servidor ens diu que hem perdut la connexió, parem aquí
            if (snap.val() === false) return;

            // Configurem l'interruptor d'emergència: "Si caic, posa'm offline"
            onDisconnect(userStatusRef).set('offline').then(() => {
              // Si hem pogut configurar l'interruptor, ens declarem "online"
              set(userStatusRef, 'online');
            });
          });
        } catch {
          // ignora errors de xarxa
        }
      } else {
        setNickname(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const logout = async () => {
    if (user) {
      // Ens posem 'offline' abans de tancar la porta manualment
      await set(ref(db, `users/${user.uid}/status`), 'offline');
    }
    await signOut(auth);
    setIsGuest(false);
    setNickname(null);
  };

  const setGuestMode = (v: boolean) => {
    setIsGuest(v);
  };

  // Aquesta és la funció que necessitava el fitxer page.tsx
  const loginAsGuest = () => {
    setIsGuest(true);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      nickname, 
      isGuest, 
      loading, 
      logout, 
      setGuestMode, 
      loginAsGuest // La passem al Provider
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}