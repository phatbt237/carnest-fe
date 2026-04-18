"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { authApi } from "@/lib/api/auth";
import { tokenStore } from "@/lib/api/client";
import type { LoginRequest, RegisterRequest, User } from "@/types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = tokenStore.getAccess();
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const me = await authApi.me();
      setUser(me);
      localStorage.setItem("carnest_user", JSON.stringify(me));
    } catch {
      tokenStore.clear();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Try cached user first for instant render
    const cached = localStorage.getItem("carnest_user");
    if (cached) {
      try {
        setUser(JSON.parse(cached));
      } catch {
        // ignore
      }
    }
    loadUser();
  }, [loadUser]);

  const login = useCallback(async (data: LoginRequest) => {
    const tokens = await authApi.login(data);
    tokenStore.setTokens(tokens.accessToken, tokens.refreshToken);
    localStorage.setItem("carnest_user", JSON.stringify(tokens.user));
    document.cookie = "carnest_auth=1; path=/; max-age=2592000; SameSite=Lax";
    setUser(tokens.user);
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    const tokens = await authApi.register(data);
    tokenStore.setTokens(tokens.accessToken, tokens.refreshToken);
    localStorage.setItem("carnest_user", JSON.stringify(tokens.user));
    document.cookie = "carnest_auth=1; path=/; max-age=2592000; SameSite=Lax";
    setUser(tokens.user);
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    // Xóa cookie để middleware không redirect /login về trang chủ
    document.cookie = "carnest_auth=; path=/; max-age=0; SameSite=Lax";
  }, []);

  const refreshUser = useCallback(async () => {
    const me = await authApi.me();
    setUser(me);
    localStorage.setItem("carnest_user", JSON.stringify(me));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
