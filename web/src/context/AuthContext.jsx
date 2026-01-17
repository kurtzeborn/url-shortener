import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { loginRequest } from '../authConfig';
import { API_BASE } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [user, setUser] = useState(null);
  const [isAllowed, setIsAllowed] = useState(null); // null = loading, true/false = checked
  const [loading, setLoading] = useState(true);

  // Get the active account (stable reference)
  const activeAccount = accounts[0];

  const checkUserAllowed = useCallback(async (email) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/check?email=${encodeURIComponent(email)}`);
      if (response.ok) {
        const data = await response.json();
        setIsAllowed(data.allowed);
      } else {
        setIsAllowed(false);
      }
    } catch (error) {
      console.error('Error checking user access:', error);
      setIsAllowed(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && activeAccount) {
      setUser({
        email: activeAccount.username,
        name: activeAccount.name || activeAccount.username,
      });
      // Check if user is allowed
      checkUserAllowed(activeAccount.username);
    } else {
      setUser(null);
      setIsAllowed(null);
      setLoading(false);
    }
  }, [isAuthenticated, activeAccount, checkUserAllowed]);

  const login = useCallback(async () => {
    try {
      await instance.loginPopup(loginRequest);
    } catch (error) {
      console.error('Login failed:', error);
    }
  }, [instance]);

  const logout = useCallback(() => {
    instance.logoutPopup({
      postLogoutRedirectUri: window.location.origin,
    });
  }, [instance]);

  const getAccessToken = useCallback(async () => {
    if (!isAuthenticated || !activeAccount) {
      return null;
    }

    try {
      const response = await instance.acquireTokenSilent({
        ...loginRequest,
        account: activeAccount,
      });
      return response.idToken; // Use ID token for API calls
    } catch (error) {
      console.error('Error acquiring token:', error);
      // If silent acquisition fails, try popup
      try {
        const response = await instance.acquireTokenPopup(loginRequest);
        return response.idToken;
      } catch (popupError) {
        console.error('Popup token acquisition failed:', popupError);
        return null;
      }
    }
  }, [instance, isAuthenticated, activeAccount]);

  const value = useMemo(() => ({
    user,
    isAuthenticated,
    isAllowed,
    loading,
    login,
    logout,
    getAccessToken,
  }), [user, isAuthenticated, isAllowed, loading, login, logout, getAccessToken]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
