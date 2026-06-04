import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services';

interface User {
  id: string;
  email: string;
  companyId: string;
  companyName: string;
  isAdmin: boolean;
  profile: { id: string; name: string };
  permissions: string[];
  person?: any;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  isSuperAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      authService.getMe()
        .then((data: any) => {
          setUser({
            ...data,
            companyName: data.company?.name,
            isAdmin: data.company?.isAdmin,
            permissions: data.permissions || [],
          });
        })
        .catch(() => {
          localStorage.clear();
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const data: any = await authService.login({ email, password });
    localStorage.setItem('access_token', data.accessToken);
    localStorage.setItem('refresh_token', data.refreshToken);
    setUser(data.user);
  };

  const logout = async () => {
    try { await authService.logout(); } catch {}
    localStorage.clear();
    setUser(null);
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.profile?.name === 'SUPER_ADMIN' || user.isAdmin) return true;
    return user.permissions.includes(permission);
  };

  const isSuperAdmin = (): boolean => {
    return user?.profile?.name === 'SUPER_ADMIN' || user?.isAdmin || false;
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, hasPermission, isSuperAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
