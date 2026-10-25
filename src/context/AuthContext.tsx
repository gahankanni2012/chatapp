import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '../types/chat';
import { api, getStoredToken, setStoredToken } from '../lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (payload: {
    username: string;
    password: string;
    displayName?: string;
    avatarColor?: string;
    avatarIcon?: string;
    avatarUrl?: string;
    bio?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (payload: {
    displayName?: string;
    avatarColor?: string;
    avatarIcon?: string;
    avatarUrl?: string;
    bio?: string;
  }) => Promise<void>;
  refetchUser: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = useCallback(async () => {
    const currentToken = getStoredToken();
    if (!currentToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      setUser(res.user);
    } catch (err) {
      console.warn('Session expired or invalid:', err);
      setStoredToken(null);
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (username: string, password: string) => {
    const res = await api.login({ username, password });
    setStoredToken(res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const register = async (payload: {
    username: string;
    password: string;
    displayName?: string;
    avatarColor?: string;
    avatarIcon?: string;
    avatarUrl?: string;
    bio?: string;
  }) => {
    const res = await api.register(payload);
    setStoredToken(res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setStoredToken(null);
      setToken(null);
      setUser(null);
    }
  };

  const updateProfile = async (payload: {
    displayName?: string;
    avatarColor?: string;
    avatarIcon?: string;
    avatarUrl?: string;
    bio?: string;
  }) => {
    const res = await api.updateProfile(payload);
    setUser(res.user);
  };

  const refetchUser = useCallback(async () => {
    await fetchCurrentUser();
  }, [fetchCurrentUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        refetchUser,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
