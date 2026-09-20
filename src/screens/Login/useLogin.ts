import { useState, useCallback } from 'react';
import { authService } from '../../services/authService';
import type { UserAccount, UserProfile } from '../../data/dummy';

interface UseLoginProps {
  onLoginSuccess: (user: UserProfile) => void;
  initialUsername?: string;
}

export interface UseLoginReturn {
  username: string;
  password: string;
  errorMessage: string | null;
  isLoading: boolean;
  selectedAccount: string;
  handleUsernameChange: (val: string) => void;
  handlePasswordChange: (val: string) => void;
  handleSelectDemoAccount: (account: UserAccount) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  clearError: () => void;
}

export function useLogin({
  onLoginSuccess,
  initialUsername = '',
}: UseLoginProps): UseLoginReturn {
  const [username, setUsername] = useState<string>(initialUsername);
  const [password, setPassword] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedAccount, setSelectedAccount] = useState<string>(initialUsername);

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  const handleUsernameChange = useCallback((val: string) => {
    setUsername(val);
    setErrorMessage(null);
  }, []);

  const handlePasswordChange = useCallback((val: string) => {
    setPassword(val);
    setErrorMessage(null);
  }, []);

  const handleSelectDemoAccount = useCallback((account: UserAccount) => {
    setUsername(account.username);
    setPassword(account.passwordPlainText);
    setSelectedAccount(account.username);
    setErrorMessage(null);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      clearError();
      setIsLoading(true);

      try {
        const result = await authService.login({
          username,
          password,
        });
        onLoginSuccess(result.user);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Đăng nhập không thành công.';
        setErrorMessage(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [username, password, clearError, onLoginSuccess]
  );

  return {
    username,
    password,
    errorMessage,
    isLoading,
    selectedAccount,
    handleUsernameChange,
    handlePasswordChange,
    handleSelectDemoAccount,
    handleSubmit,
    clearError,
  };
}
