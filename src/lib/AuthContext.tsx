// SHOP_src_lib_AuthContext.tsx
// Version: 1.0.0 | Created: 2026-01-29 | Author: Open Gateways Team
// Description: Authentication context for Open Gateways Shop
// Provides login/logout functionality and user state management

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';

// ============================================================================
// TYPES
// ============================================================================

export interface ShopUser {
  id: number;
  email: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  preferred_name: string | null;
  phone: string | null;
  country_code: string | null;
  timezone: string | null;
  language: string;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  error?: string;
  user?: ShopUser;
  token?: string;
}

interface AuthContextType {
  user: ShopUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<LoginResponse>;
  logout: () => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// HOOK
// ============================================================================

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// ============================================================================
// PROVIDER
// ============================================================================

interface AuthProviderProps {
  children: ReactNode;
}

const TOKEN_KEY = 'shop_auth_token';
const USER_KEY = 'shop_user_data';
const COOKIE_NAME = 'shop-auth-token';

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<ShopUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as ShopUser;
        setUser(parsedUser);
        setToken(storedToken);
        
        // Ensure cookie is also set
        Cookies.set(COOKIE_NAME, storedToken, {
          expires: 7,
          sameSite: 'lax',
          secure: window.location.protocol === 'https:',
        });
        
        console.log('[Shop Auth] Restored session for:', parsedUser.email);
      } catch (error) {
        console.error('[Shop Auth] Error parsing stored user data:', error);
        // Clear invalid data
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        Cookies.remove(COOKIE_NAME);
      }
    }

    setIsLoading(false);
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<LoginResponse> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data: LoginResponse = await response.json();

      if (data.success && data.user && data.token) {
        // Store in state
        setUser(data.user);
        setToken(data.token);

        // Store in localStorage
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));

        // Store in cookie for API requests
        Cookies.set(COOKIE_NAME, data.token, {
          expires: 7,
          sameSite: 'lax',
          secure: window.location.protocol === 'https:',
        });

        console.log('[Shop Auth] Login successful for:', data.user.email);
      }

      return data;
    } catch (error) {
      console.error('[Shop Auth] Login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  };

  // Logout function
  const logout = () => {
    console.log('[Shop Auth] Logging out user:', user?.email);

    // Clear state
    setUser(null);
    setToken(null);

    // Clear localStorage
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    // Clear cookie
    Cookies.remove(COOKIE_NAME);
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
