/**
 * ArchePersona Unified Auth Provider
 * Shared across all ArchePersona apps
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { loginAPI, logoutAPI, getMeAPI, getRefreshToken, clearTokens } from "./api";

type User = { id: string; email: string; name: string } | null;

type AuthContextType = {
  user: User;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function ArchePersonaAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  const bootstrap = useCallback(async () => {
    try {
      const rt = await getRefreshToken();
      if (!rt) {
        setLoading(false);
        return;
      }
      const me = await getMeAPI();
      if (me) {
        setUser(me);
      } else {
        await clearTokens();
      }
    } catch {
      await clearTokens();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const signIn = async (email: string, password: string) => {
    await loginAPI(email, password);
    const me = await getMeAPI();
    setUser(me);
  };

  const signOut = async () => {
    await logoutAPI();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
