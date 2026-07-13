import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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
  originalSession: UserSession | null;
  deviceId: string;
  login: (session: UserSession) => void;
  logout: () => void;
  impersonate: (session: UserSession) => void;
  exitImpersonation: () => void;
  updateUsername: (username: string) => void;
  isAuthenticated: boolean;
  isOwner: boolean;
  isImpersonating: boolean;
  // Gateway
  isGatewayPassed: boolean;
  passGateway: (revision: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_KEY = 'garage_auth';
const ORIGINAL_AUTH_KEY = 'garage_auth_original';
const DEVICE_KEY = 'garage_device_id';
const GATEWAY_KEY = 'garage_gateway_rev';

function getApiBase() {
  return ((import.meta.env.BASE_URL as string | undefined) ?? '').replace(/\/$/, '');
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Initialize synchronously from localStorage so the first render already has the correct values.
  // This prevents the flash-redirect where GatewayRoute/ProtectedRoute redirects before state loads.
  const [session, setSession] = useState<UserSession | null>(() => {
    try { const s = localStorage.getItem(AUTH_KEY); return s ? JSON.parse(s) as UserSession : null; } catch { return null; }
  });
  const [originalSession, setOriginalSession] = useState<UserSession | null>(() => {
    try { const s = localStorage.getItem(ORIGINAL_AUTH_KEY); return s ? JSON.parse(s) as UserSession : null; } catch { return null; }
  });
  const [deviceId, setDeviceId] = useState<string>(() => {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) { id = crypto.randomUUID(); localStorage.setItem(DEVICE_KEY, id); }
    return id;
  });
  const [gatewayRevision, setGatewayRevision] = useState<number | null>(() => {
    const s = localStorage.getItem(GATEWAY_KEY);
    return s ? Number(s) : null;
  });

  // Keep deviceId in sync if it ever changes (edge case: cleared externally)
  useEffect(() => {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) { id = crypto.randomUUID(); localStorage.setItem(DEVICE_KEY, id); }
    if (id !== deviceId) setDeviceId(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setAuthTokenGetter(() => {
      try {
        const s = localStorage.getItem(AUTH_KEY);
        return s ? (JSON.parse(s) as UserSession).token : null;
      } catch { return null; }
    });
  }, []);

  // Check if the stored gateway revision still matches the server's current revision.
  // Called on tab focus / visibility change — if the owner changed the code, users are auto-logged out.
  const checkRevision = useCallback(async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/config/session-revision`);
      if (!res.ok) return;
      const data = (await res.json()) as { revision: number };
      const stored = localStorage.getItem(GATEWAY_KEY);
      if (stored !== null && data.revision !== Number(stored)) {
        // Gateway revision changed — clear gateway and log out
        localStorage.removeItem(GATEWAY_KEY);
        localStorage.removeItem(AUTH_KEY);
        localStorage.removeItem(ORIGINAL_AUTH_KEY);
        setGatewayRevision(null);
        setSession(null);
        setOriginalSession(null);
      }
    } catch { /* network error — keep current state */ }
  }, []);

  useEffect(() => {
    const onVisibility = () => { if (document.visibilityState === 'visible') void checkRevision(); };
    const onFocus = () => void checkRevision();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
    };
  }, [checkRevision]);

  // Poll /api/auth/me every 30s to detect if the user was kicked
  useEffect(() => {
    if (!session) return;
    const check = async () => {
      try {
        const res = await fetch(`${getApiBase()}/api/auth/me`, {
          headers: { Authorization: `Bearer ${session.token}` },
        });
        if (res.status === 401) {
          let isKicked = false;
          try {
            const body = await res.json() as { error?: string };
            if (body.error === 'kicked') isKicked = true;
          } catch { /* ignore parse error */ }
          if (isKicked) localStorage.setItem('garage_kicked', '1');
          localStorage.removeItem(AUTH_KEY);
          localStorage.removeItem(ORIGINAL_AUTH_KEY);
          localStorage.removeItem(GATEWAY_KEY);
          setSession(null);
          setOriginalSession(null);
          setGatewayRevision(null);
        }
      } catch { /* network error — keep current state */ }
    };
    const id = setInterval(() => { void check(); }, 30_000);
    return () => clearInterval(id);
  }, [session]);

  const passGateway = (revision: number) => {
    localStorage.setItem(GATEWAY_KEY, String(revision));
    setGatewayRevision(revision);
  };

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

  const impersonate = (targetSession: UserSession) => {
    const current = session;
    if (current) {
      localStorage.setItem(ORIGINAL_AUTH_KEY, JSON.stringify(current));
      setOriginalSession(current);
    }
    localStorage.setItem(AUTH_KEY, JSON.stringify(targetSession));
    setSession(targetSession);
  };

  const exitImpersonation = () => {
    if (originalSession) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(originalSession));
      setSession(originalSession);
    }
    localStorage.removeItem(ORIGINAL_AUTH_KEY);
    setOriginalSession(null);
  };

  const updateUsername = (username: string) => {
    if (!session) return;
    const updated = { ...session, username };
    localStorage.setItem(AUTH_KEY, JSON.stringify(updated));
    setSession(updated);
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
        updateUsername,
        isAuthenticated: !!session,
        isOwner,
        isImpersonating: !!originalSession,
        isGatewayPassed: gatewayRevision !== null,
        passGateway,
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
