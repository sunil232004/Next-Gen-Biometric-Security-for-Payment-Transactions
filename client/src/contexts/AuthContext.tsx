import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiRequest } from '../lib/queryClient';

// Types
interface User {
  _id: string;
  email: string;
  name: string;
  phone?: string;
  upiId: string;
  balance: number;
  profileImage?: string;
  isVerified: boolean;
  createdAt: string;
}

interface Biometric {
  _id: string;
  type: 'fingerprint' | 'face' | 'voice';
  label?: string;
  isActive: boolean;
  lastUsed?: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  biometrics: Biometric[];
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  signup: (data: SignupData) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; message?: string }>;
  setUpiPin: (pin: string) => Promise<{ success: boolean; message?: string }>;
  verifyUpiPin: (pin: string) => Promise<boolean>;
}

interface SignupData {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

// Create context
const AuthContext = createContext<AuthContextType | null>(null);

// Token storage key
const TOKEN_KEY = 'paytm_auth_token';

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [biometrics, setBiometrics] = useState<Biometric[]>([]);
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_KEY);
  });
  const [isLoading, setIsLoading] = useState(true);

  // Check auth on mount
  useEffect(() => {
    if (token) {
      refreshUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  // Refresh user data
  const refreshUser = async () => {
    try {
      const response = await apiRequest('/api/v2/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.success) {
        setUser(response.user);
        setBiometrics(response.biometrics || []);
      } else {
        // Token invalid, clear auth
        setToken(null);
        setUser(null);
        setBiometrics([]);
        localStorage.removeItem(TOKEN_KEY);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      setToken(null);
      setUser(null);
      setBiometrics([]);
      localStorage.removeItem(TOKEN_KEY);
    }
  };

  // Login
  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await apiRequest('/api/v2/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (response.success) {
        setUser(response.user);
        setToken(response.token);
        localStorage.setItem(TOKEN_KEY, response.token);
        await refreshUser();
        return { success: true };
      } else {
        return { success: false, message: response.message || 'Login failed' };
      }
    } catch (error: any) {
      return { success: false, message: error.message || 'Login failed' };
    }
  };

  // Signup
  const signup = async (data: SignupData): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await apiRequest('/api/v2/auth/signup', {
        method: 'POST',
        body: JSON.stringify(data)
      });

      if (response.success) {
        setUser(response.user);
        setToken(response.token);
        localStorage.setItem(TOKEN_KEY, response.token);
        return { success: true };
      } else {
        return { success: false, message: response.message || 'Signup failed' };
      }
    } catch (error: any) {
      return { success: false, message: error.message || 'Signup failed' };
    }
  };

  // Logout
  const logout = async () => {
    try {
      if (token) {
        await apiRequest('/api/v2/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setToken(null);
      setBiometrics([]);
      localStorage.removeItem(TOKEN_KEY);
    }
  };

  // Update profile
  const updateProfile = async (data: Partial<User>): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await apiRequest('/api/v2/auth/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (response.success) {
        setUser(response.user);
        return { success: true };
      } else {
        return { success: false, message: response.message || 'Update failed' };
      }
    } catch (error: any) {
      return { success: false, message: error.message || 'Update failed' };
    }
  };

  // Set UPI PIN
  const setUpiPin = async (pin: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await apiRequest('/api/v2/auth/upi-pin', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ pin })
      });

      return { success: response.success, message: response.message };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to set PIN' };
    }
  };

  // Verify UPI PIN
  const verifyUpiPin = async (pin: string): Promise<boolean> => {
    try {
      const response = await apiRequest('/api/v2/auth/verify-upi-pin', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ pin })
      });

      return response.success;
    } catch (error) {
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    biometrics,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    signup,
    logout,
    refreshUser,
    updateProfile,
    setUpiPin,
    verifyUpiPin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helper to get auth token for API calls
export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

// Helper to make authenticated API calls
export async function authApiRequest(
  endpoint: string, 
  options: { method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'; body?: any; headers?: Record<string, string> } = {}
) {
  const token = getAuthToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return apiRequest(endpoint, {
    method: options.method,
    body: options.body,
    headers
  });
}
