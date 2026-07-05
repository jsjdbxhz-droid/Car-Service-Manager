import React, { createContext, useContext, useEffect, useState } from 'react';
import { setAuthTokenGetter } from '@workspace/api-client-react';

export type UserRole = 'user' | 'admin' | 'owner';

export interface UserSession {
  userId: string;
  token: string;
  username: string;
  role: UserRole;
  deviceId?: string;
}

interface AuthContextType {
  session: UserSession | null;
  originalSession: UserSession | null; // set when impersonating
  deviceId: string;
  login: (session: UserSession) => void;
  logout: () => void;
  impersonate: (session: UserSession) => void;
  exitImpersonation: () => void;
  isAuthenticated: boolean;
  isOwner: boolean;
  isImpersonating: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_KEY = 'garage_auth';
const ORIGINAL_AUTH_KEY = 'garage_auth_original';
const DEVICE_KEY = 'garage_device_id';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<UserSession | null>(null);
  const [originalSession, setOriginalSession] = useState<UserSession | null>(null);
  const [deviceId, setDeviceId] = useState<string>('');

  useEffect(() => {
    let currentDeviceId = localStorage.getItem(DEVICE_KEY);
    if (!currentDeviceId) {
      currentDeviceId = crypto.randomUUID();
      localStorage.setItem(DEVICE_KEY, currentDeviceId);
    }
    setDeviceId(currentDeviceId);

    const storedAuth = localStorage.getItem(AUTH_KEY);
    if (storedAuth) {
      try { setSession(JSON.parse(storedAuth)); } catch {}
    }
    const storedOriginal = localStorage.getItem(ORIGINAL_AUTH_KEY);
    if (storedOriginal) {
      try { setOriginalSession(JSON.parse(storedOriginal)); } catch {}
    }
  }, []);

  useEffect(() => {
    setAuthTokenGetter(() => {
      try {
        const s = localStorage.getItem(AUTH_KEY);
        return s ? JSON.parse(s).token : null;
      } catch { return null; }
    });
  }, []);

  const login = (newSession: UserSession) => {
    localStorage.setItem(AUTH_KEY, JSON.stringify(newSession));
    setSession(newSession);
  };

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(ORIGINAL_AUTH_KEY);
    setSession(null);
    setOriginalSession(null);
  };

  // Owner enters another user's account
  const impersonate = (targetSession: UserSession) => {
    const current = session;
    if (current) {
      localStorage.setItem(ORIGINAL_AUTH_KEY, JSON.stringify(current));
      setOriginalSession(current);
    }
    localStorage.setItem(AUTH_KEY, JSON.stringify(targetSession));
    setSession(targetSession);
  };

  // Return to owner account
  const exitImpersonation = () => {
    if (originalSession) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(originalSession));
      setSession(originalSession);
    }
    localStorage.removeItem(ORIGINAL_AUTH_KEY);
    setOriginalSession(null);
  };

  const isOwner =
    session?.role === 'owner' ||
    session?.role === 'admin' ||
    session?.username === 'زكرياء';

  return (
    <AuthContext.Provider
      value={{
        session,
        originalSession,
        deviceId,
        login,
        logout,
        impersonate,
        exitImpersonation,
        isAuthenticated: !!session,
        isOwner,
        isImpersonating: !!originalSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
