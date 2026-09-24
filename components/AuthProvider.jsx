'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { get, post } from '../lib/api';

const AuthContext = createContext(undefined);

function getErrorStatus(error) {
  const status = error?.status ?? error?.statusCode ?? error?.response?.status;
  const parsedStatus = Number(status);

  return Number.isFinite(parsedStatus) ? parsedStatus : null;
}

function extractUser(response) {
  if (!response || typeof response !== 'object') {
    return null;
  }

  if (response.user && typeof response.user === 'object') {
    return response.user;
  }

  return null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');

  const mountedRef = useRef(false);
  const requestSequenceRef = useRef(0);
  const logoutInFlightRef = useRef(false);

  const refreshUser = useCallback(async () => {
    const requestSequence = ++requestSequenceRef.current;

    if (mountedRef.current) {
      setLoading(true);
    }

    try {
      const response = await get('/api/auth/me');
      const nextUser = extractUser(response);

      if (
        mountedRef.current &&
        requestSequence === requestSequenceRef.current
      ) {
        setUser(nextUser);
        setUnavailable(false);
      }

      return nextUser;
    } catch (error) {
      const status = getErrorStatus(error);

      if (
        mountedRef.current &&
        requestSequence === requestSequenceRef.current
      ) {
        if (status === 401) {
          setUser(null);
          setUnavailable(false);
        } else {
          setUnavailable(true);
        }
      }

      return null;
    } finally {
      if (
        mountedRef.current &&
        requestSequence === requestSequenceRef.current
      ) {
        setLoading(false);
      }
    }
  }, []);

  const logout = useCallback(async () => {
    if (logoutInFlightRef.current) {
      return false;
    }

    logoutInFlightRef.current = true;
    requestSequenceRef.current += 1;

    if (mountedRef.current) {
      setLoggingOut(true);
      setLogoutError('');
    }

    try {
      await post('/api/auth/logout', {});

      if (mountedRef.current) {
        setUser(null);
        setUnavailable(false);
        setLoading(false);
      }

      return true;
    } catch (error) {
      const status = getErrorStatus(error);

      if (mountedRef.current) {
        if (status === 401) {
          setUser(null);
          setUnavailable(false);
          setLoading(false);
          return true;
        }

        setUnavailable(status === null || status >= 500);
        setLogoutError(
          'We could not sign you out right now. Please check your connection and try again.'
        );
      }

      return false;
    } finally {
      logoutInFlightRef.current = false;

      if (mountedRef.current) {
        setLoggingOut(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    refreshUser();

    return () => {
      mountedRef.current = false;
      requestSequenceRef.current += 1;
    };
  }, [refreshUser]);

  const value = useMemo(
    () => ({
      user,
      loading,
      unavailable,
      refreshUser,
      logout,
      loggingOut,
      logoutError,
    }),
    [
      user,
      loading,
      unavailable,
      refreshUser,
      logout,
      loggingOut,
      logoutError,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }

  return context;
}