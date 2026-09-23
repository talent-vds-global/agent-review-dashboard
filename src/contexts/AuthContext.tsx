import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authService } from '../services/authService';
import type { UserProfile } from '../data/dummy';

interface AuthContextType {
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string, remember?: boolean) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const REMEMBER_KEY = 'qc_portal_remember_login';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() =>
    authService.getCurrentUser()
  );
  const [isLoading, setIsLoading] = useState(false);

  // Kiểm tra session khi mount
  useEffect(() => {
    const remembered = localStorage.getItem(REMEMBER_KEY);
    if (!remembered && !authService.isAuthenticated()) {
      setCurrentUser(null);
    }
  }, []);

  const login = useCallback(async (username: string, _password: string, remember = false) => {
    setIsLoading(true);
    try {
      // Mock auth: bất kỳ username/password nào cũng pass
      // Tạo mock user profile
      const mockUser: UserProfile = {
        id: `usr_${username}_${Date.now()}`,
        username: username.trim(),
        email: `${username.trim()}@vds.vn`,
        fullName: username.trim(),
        role: 'developer',
        roleTitle: 'User',
        department: 'VDS',
        initials: username.trim().substring(0, 2).toUpperCase(),
      };

      // Lưu session
      const mockToken = `jwt-mock-${mockUser.id}-${Date.now()}`;
      localStorage.setItem('qc_portal_auth_token', mockToken);
      localStorage.setItem('qc_portal_user_profile', JSON.stringify(mockUser));

      if (remember) {
        localStorage.setItem(REMEMBER_KEY, 'true');
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }

      setCurrentUser(mockUser);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    localStorage.removeItem(REMEMBER_KEY);
    setCurrentUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: Boolean(currentUser),
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
