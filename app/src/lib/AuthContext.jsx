import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => { checkUserAuth(); }, []);

  const checkUserAuth = async () => {
    setIsLoadingAuth(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
      setAuthError(null);
    } catch (error) {
      setIsAuthenticated(false);
      // Only surface auth_required when a stored token was actually rejected —
      // a plain anonymous visit (no token) must not force a redirect off public
      // marketplace pages (Home, ProductDetail, ...); App.jsx hard-redirects on
      // authError.type === 'auth_required'.
      const hadToken = !!localStorage.getItem('base44_access_token');
      if (error.status === 401 && hadToken) setAuthError({ type: 'auth_required', message: 'Authentication required' });
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    base44.auth.logout(shouldRedirect ? '/' : undefined);
  };

  const navigateToLogin = () => base44.auth.redirectToLogin(window.location.pathname + window.location.search);

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated, isLoadingAuth, isLoadingPublicSettings: false,
      authError, authChecked, logout, navigateToLogin, checkUserAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
