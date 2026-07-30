import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as authService from '../services/authService';
import { getAccessToken, setAccessToken, setUnauthorizedHandler } from '../utils/tokenStore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
  }, []);

  useEffect(() => {
    async function bootstrap() {
      try {
        let token = getAccessToken();
        if (!token) {
          const refreshed = await authService.refresh();
          token = refreshed.accessToken;
          setAccessToken(token);
          setUser(refreshed.user);
        } else {
          const me = await authService.fetchMe();
          setUser(me);
        }
      } catch {
        clearSession();
      } finally {
        setIsLoading(false);
      }
    }
    bootstrap();
  }, [clearSession]);

  // Returns the raw result so callers can branch on `mfaRequired` — only a
  // fully completed login (no MFA, or MFA already verified) sets the
  // session, an MFA challenge response is not a logged-in state.
  const login = useCallback(async (payload) => {
    const result = await authService.login(payload);
    if (result.mfaRequired) return result;
    setAccessToken(result.accessToken);
    setUser(result.user);
    return result;
  }, []);

  const completeMfaLogin = useCallback(async (mfaChallengeToken, code) => {
    const result = await authService.mfaLoginVerify(mfaChallengeToken, code);
    setAccessToken(result.accessToken);
    setUser(result.user);
    return result.user;
  }, []);

  const completePasswordlessLogin = useCallback(async (token) => {
    const result = await authService.passwordlessVerify(token);
    if (result.mfaRequired) return result;
    setAccessToken(result.accessToken);
    setUser(result.user);
    return result;
  }, []);

  const register = useCallback(async (payload) => {
    const { user: newUser, accessToken } = await authService.register(payload);
    setAccessToken(accessToken);
    setUser(newUser);
    return newUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const value = {
    user,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === 'admin',
    isLoading,
    login,
    completeMfaLogin,
    completePasswordlessLogin,
    register,
    logout,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
