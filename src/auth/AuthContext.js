import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  getMe,
  login,
  setAuthToken,
  setUnauthorizedHandler,
  signUp,
} from '../api/client';
import * as secureStore from '../storage/secureStore';

const TOKEN_KEY = 'allison_access_token';

const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  isBootstrapping: true,
  signIn: async () => ({ success: false, error: 'Not initialized.' }),
  signUpUser: async () => ({ success: false, error: 'Not initialized.' }),
  signOut: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const signOut = useCallback(async () => {
    setToken(null);
    setUser(null);
    setAuthToken(null);
    await secureStore.deleteItemAsync(TOKEN_KEY);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      signOut();
    });

    return () => {
      setUnauthorizedHandler(null);
    };
  }, [signOut]);

  useEffect(() => {
    const bootstrap = async () => {
      setIsBootstrapping(true);
      const savedToken = await secureStore.getItemAsync(TOKEN_KEY);
      if (!savedToken) {
        setIsBootstrapping(false);
        return;
      }

      setAuthToken(savedToken);
      setToken(savedToken);
      const meResponse = await getMe();
      if (meResponse.success) {
        setUser(meResponse.data);
      } else {
        await signOut();
      }
      setIsBootstrapping(false);
    };

    bootstrap();
  }, [signOut]);

  const handleAuthSuccess = useCallback(async (payload) => {
    const accessToken = payload?.access_token;
    const currentUser = payload?.user;
    if (!accessToken || !currentUser) {
      return { success: false, error: 'Invalid authentication payload.' };
    }

    setAuthToken(accessToken);
    setToken(accessToken);
    setUser(currentUser);
    await secureStore.setItemAsync(TOKEN_KEY, accessToken);
    return { success: true, data: currentUser, error: null };
  }, []);

  const signIn = useCallback(
    async (email, password) => {
      const response = await login(email, password);
      if (!response.success) return response;
      return handleAuthSuccess(response.data);
    },
    [handleAuthSuccess]
  );

  const signUpUser = useCallback(
    async (fullName, email, password) => {
      const response = await signUp(fullName, email, password);
      if (!response.success) return response;
      return handleAuthSuccess(response.data);
    },
    [handleAuthSuccess]
  );

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: !!token && !!user,
      isBootstrapping,
      signIn,
      signUpUser,
      signOut,
    }),
    [user, token, isBootstrapping, signIn, signUpUser, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
