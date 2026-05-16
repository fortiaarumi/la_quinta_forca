'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, get, onValue, onDisconnect, set } from 'firebase/database';
import { auth, db } from './firebase';

interface AuthContextType {
  user: User | null;
  nickname: string | null;
  avatarUrl: string | null;
  badges: string[];
  selectedBadges: string[];
  isAdmin: boolean;
  isGuest: boolean;
  loading: boolean;
  logout: () => Promise<void>;
  setGuestMode: (v: boolean) => void;
  loginAsGuest: () => void; // Afegim la definició aquí
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  nickname: null,
  avatarUrl: null,
  badges: [],
  selectedBadges: [],
  isAdmin: false,
  isGuest: false,
  loading: true,
  logout: async () => {},
  setGuestMode: () => {},
  loginAsGuest: () => {}, // I aquí
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [badges, setBadges] = useState<string[]>([]);
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        setIsGuest(false);
        try {
          // 1. Busquem tot el perfil de l'usuari (per tenir nickname i isAdmin)
          const snap = await get(ref(db, `users/${u.uid}`));
          if (snap.exists()) {
            const data = snap.val();
            setNickname(data.nickname);
            setAvatarUrl(data.avatarUrl || null);
            setBadges(data.badges || []);
            setSelectedBadges(data.selectedBadges || []);
            setIsAdmin(data.isAdmin === true || u.email === 'fortiaarumi@gmail.com'); 
          } else if (u.email === 'fortiaarumi@gmail.com') {
            setIsAdmin(true);
          }

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
    setAvatarUrl(null);
    setBadges([]);
    setSelectedBadges([]);
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
      avatarUrl,
      badges,
      selectedBadges,
      isAdmin,
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