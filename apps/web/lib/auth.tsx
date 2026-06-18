"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiGet, apiPost, clearToken, getToken, setToken } from "./api";

interface AuthState {
  token: string | null;
  ready: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthCtx = createContext<AuthState | null>(null);
const PUBLIC_ROUTES = ["/login", "/setup"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTok] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setTok(getToken());
    (async () => {
      try {
        const status = await apiGet<{ initialized: boolean }>("/auth/status");
        if (!status.initialized && pathname !== "/setup") {
          router.replace("/setup");
        } else if (status.initialized && !getToken() && !PUBLIC_ROUTES.includes(pathname)) {
          router.replace("/login");
        }
      } finally {
        setReady(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const login = async (username: string, password: string) => {
    const { token } = await apiPost<{ token: string }>("/auth/login", { username, password });
    setToken(token);
    setTok(token);
    router.replace("/");
  };

  const logout = () => {
    clearToken();
    setTok(null);
    router.replace("/login");
  };

  return <AuthCtx.Provider value={{ token, ready, login, logout }}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
