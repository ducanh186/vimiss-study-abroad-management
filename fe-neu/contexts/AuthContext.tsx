

import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../services/apiService';
import { AuthRequest, User, UserRole } from '../types';

// ====================================================================
// Auth Context — Sanctum Session Auth
// No JWT, no localStorage token. Session cookie handles auth.
// ====================================================================

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  // Role helpers
  isAdmin: boolean;
  isDirector: boolean;
  isMentor: boolean;
  isStudent: boolean;
  /** @deprecated Use isMentor instead — kept for backward compat */
  isLawyer: boolean;
  /** @deprecated Not used with Sanctum — kept for backward compat */
  lawyerPersonId: number | null;
  /** @deprecated Not used with Sanctum — kept for backward compat */
  token: string | null;
  // Actions
  login: (credentials: AuthRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  /**
   * On mount: check if a Sanctum session exists by calling GET /api/me.
   * If the session cookie is valid, we get the user back.
   * If not (401), user stays null → not authenticated.
   */
  useEffect(() => {
    let cancelled = false;

    const checkSession = async () => {
      try {
        const currentUser = await api.me();
        if (!cancelled) {
          setUser(currentUser);
        }
      } catch {
        // 401 or network error → not authenticated
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    checkSession();
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (credentials: AuthRequest) => {
    const loggedInUser = await api.login(credentials);
    setUser(loggedInUser);

    // Handle must_change_password
    if (loggedInUser.must_change_password) {
      navigate('/app/change-password');
      return;
    }

    navigate('/app/dashboard');
  }, [navigate]);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // Even if the server call fails, clear local state
    }
    setUser(null);
    navigate('/login');
  }, [navigate]);

  // Role helpers
  const role: UserRole | null = user?.role ?? null;

  const value = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    isLoading,
    // Roles
    isAdmin: role === 'admin',
    isDirector: role === 'director',
    isMentor: role === 'mentor',
    isStudent: role === 'student',
    // Backward compat
    isLawyer: role === 'mentor',
    lawyerPersonId: null,
    token: user ? '__sanctum_session__' : null,
    // Actions
    login,
    logout,
  }), [user, role, isLoading, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};