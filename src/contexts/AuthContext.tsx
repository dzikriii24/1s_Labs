import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, User, setAuthSession, clearAuthSession, getStoredUser } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isEmailVerified: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<User>;
  register: (payload: { name: string; email: string; password: string; confirmPassword?: string; phone: string }) => Promise<{ user: User; message: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUser: (user: User) => void;
  resendVerification: (email?: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [token, setToken] = useState<string | null>(localStorage.getItem('oneslabs_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const currentToken = localStorage.getItem('oneslabs_token');
    if (!currentToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.auth.getMe();
      if (res.success && res.user) {
        setUser(res.user);
        localStorage.setItem('oneslabs_user', JSON.stringify(res.user));
      }
    } catch {
      // Sesi kedaluwarsa atau token tidak valid
      clearAuthSession();
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (credentials: { email: string; password: string }): Promise<User> => {
    const res = await api.auth.login(credentials);
    setAuthSession(res.token, res.user);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const register = async (payload: { name: string; email: string; password: string; confirmPassword?: string; phone: string }): Promise<{ user: User; message: string }> => {
    const res = await api.auth.register(payload);
    setAuthSession(res.token, res.user);
    setToken(res.token);
    setUser(res.user);
    return { user: res.user, message: res.message };
  };

  const resendVerification = async (email?: string) => {
    return api.auth.resendVerification(email || user?.email);
  };

  const logout = () => {
    clearAuthSession();
    setUser(null);
    setToken(null);
  };

  const updateUser = (updated: User) => {
    setUser(updated);
    localStorage.setItem('oneslabs_user', JSON.stringify(updated));
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isAdmin: user?.role === 'admin',
    isEmailVerified: !!user?.email_verified,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
    updateUser,
    resendVerification
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
