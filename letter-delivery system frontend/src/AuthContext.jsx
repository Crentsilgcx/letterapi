/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { adminApi } from './api';

export const AuthContext = createContext(null);

const AUTH_CACHE_KEY = 'currentUser';

function getCachedUser() {
  try {
    const cached = sessionStorage.getItem(AUTH_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {
    // ignore parse errors
  }
  return null;
}

function setCachedUser(user) {
  try {
    sessionStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(user));
  } catch {
    // ignore storage errors
  }
}

function clearCachedUser() {
  try {
    sessionStorage.removeItem(AUTH_CACHE_KEY);
  } catch {
    // ignore storage errors
  }
}

function clearReceptionCache() {
  try {
    sessionStorage.removeItem('reception_cache_v1');
  } catch {
    // ignore storage errors
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuth = useCallback(async () => {
    // 1. Try to restore from sessionStorage first (instant)
    const cachedUser = getCachedUser();
    if (cachedUser) {
      setUser(cachedUser);
      setIsAuthenticated(true);
      setIsLoading(false);
    }

    // 2. Background validation/refresh - don't block initial render
    try {
      const data = await adminApi.checkAuth();
      setUser(data);
      setIsAuthenticated(true);
      // Update cache with fresh data
      try {
        sessionStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(data));
      } catch {
        // ignore storage errors
      }
    } catch {
      // Auth failed - clear cache and mark unauthenticated
      clearCachedUser();
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      const cachedUser = getCachedUser();
      if (cachedUser && isMounted) {
        setUser(cachedUser);
        setIsAuthenticated(true);
        setIsLoading(false);
      }

      // Skip background auth validation for public pages (delivery, home)
      // Admin/reception pages will call checkAuth explicitly when needed
      if (isMounted) {
        setIsLoading(false);
      }
    };

    void initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (username, password) => {
    const data = await adminApi.login(username, password);
    setUser(data);
    setIsAuthenticated(true);
    // Cache the fresh login
    setCachedUser(data);
    return data;
  };

  const logout = async () => {
    try {
      await adminApi.logout();
    } finally {
      clearCachedUser();
      clearReceptionCache();
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
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