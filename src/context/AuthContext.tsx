import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

// ============================================================
// Auth Context — Organizer Session
// Uses sessionStorage so auth persists across page refreshes
// but clears when the browser tab is closed.
// ============================================================

interface AuthState {
  isAuthenticated: boolean;
  eventId: string | null;
}

interface AuthContextValue extends AuthState {
  login: (eventId: string) => void;
  logout: () => void;
}

const SESSION_KEY = 'eventra_organizer_session';

function readSession(): AuthState {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.eventId) return { isAuthenticated: true, eventId: parsed.eventId };
    }
  } catch {
    // ignore parse errors
  }
  return { isAuthenticated: false, eventId: null };
}

const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
  eventId: null,
  login: () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>(readSession);

  const login = useCallback((eventId: string) => {
    const state: AuthState = { isAuthenticated: true, eventId };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ eventId }));
    setAuth(state);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setAuth({ isAuthenticated: false, eventId: null });
  }, []);

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
