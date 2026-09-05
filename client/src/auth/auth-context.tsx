import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type AuthUser = {
  id: number;
  email: string;
  name: string;
  role: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  setSession: (token: string, user: AuthUser, remember: boolean) => void;
  logout: () => void;
};

const TOKEN_KEY = "easyconstruct_token";
const USER_KEY = "easyconstruct_user";

function readSession(): AuthUser | null {
  const stores = [sessionStorage, localStorage];
  for (const store of stores) {
    if (!store.getItem(TOKEN_KEY)) continue;
    const rawUser = store.getItem(USER_KEY);
    if (!rawUser) continue;
    try {
      return JSON.parse(rawUser) as AuthUser;
    } catch {
      store.removeItem(TOKEN_KEY);
      store.removeItem(USER_KEY);
    }
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readSession());

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      setSession: (token, nextUser, remember) => {
        const target = remember ? localStorage : sessionStorage;
        const other = remember ? sessionStorage : localStorage;
        other.removeItem(TOKEN_KEY);
        other.removeItem(USER_KEY);
        target.setItem(TOKEN_KEY, token);
        target.setItem(USER_KEY, JSON.stringify(nextUser));
        setUser(nextUser);
      },
      logout: () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(USER_KEY);
        setUser(null);
      },
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

export function getDashboardRoute(role: string) {
  return role === "project-manager" ? "/dashboard" : "/dashboard";
}
