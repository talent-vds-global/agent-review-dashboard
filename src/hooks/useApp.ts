import { useState, useCallback, useEffect } from 'react';
import type { RoleType } from '../data/mock';
import type { UserProfile } from '../data/dummy';
import { authService } from '../services/authService';

export type AppView = 'login' | 'role_guide' | 'dashboard';

export interface UseAppReturn {
  currentView: AppView;
  currentUser: UserProfile | null;
  currentRole: RoleType | null;
  prefilledUsername: string;
  handleLoginSuccess: (user: UserProfile) => void;
  handleLogout: () => void;
  handleOpenRoleGuide: () => void;
  handleSelectRoleFromGuide: (role: RoleType) => void;
  handleGoToLogin: () => void;
}

export function useApp(): UseAppReturn {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() =>
    authService.getCurrentUser()
  );
  const [currentView, setCurrentView] = useState<AppView>(() =>
    authService.isAuthenticated() ? 'dashboard' : 'login'
  );
  const [prefilledUsername, setPrefilledUsername] = useState<string>('');

  // Sync state if currentUser changes
  useEffect(() => {
    if (currentUser) {
      setCurrentView('dashboard');
    }
  }, [currentUser]);

  const handleLoginSuccess = useCallback((user: UserProfile) => {
    setCurrentUser(user);
    setCurrentView('dashboard');
  }, []);

  const handleLogout = useCallback(async () => {
    await authService.logout();
    setCurrentUser(null);
    setCurrentView('login');
    setPrefilledUsername('');
  }, []);

  const handleOpenRoleGuide = useCallback(() => {
    setCurrentView('role_guide');
  }, []);

  const handleSelectRoleFromGuide = useCallback((role: RoleType) => {
    // Chuyển sang màn hình login với tài khoản tương ứng được điền sẵn
    setPrefilledUsername(role);
    setCurrentView('login');
  }, []);

  const handleGoToLogin = useCallback(() => {
    setCurrentView('login');
  }, []);

  return {
    currentView,
    currentUser,
    currentRole: currentUser?.role || null,
    prefilledUsername,
    handleLoginSuccess,
    handleLogout,
    handleOpenRoleGuide,
    handleSelectRoleFromGuide,
    handleGoToLogin,
  };
}
