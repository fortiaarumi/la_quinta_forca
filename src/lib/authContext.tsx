'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, get } from 'firebase/database';
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
          const snap = await get(ref(db, `users/${u.uid}/nickname`));
          if (snap.exists()) setNickname(snap.val() as string);
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