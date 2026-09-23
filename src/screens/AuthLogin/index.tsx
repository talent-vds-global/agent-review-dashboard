import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import styles from './AuthLogin.module.css';

export const AuthLogin: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, login, isLoading } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Nếu đã đăng nhập → skip login
  if (isAuthenticated) {
    return <Navigate to="/projects" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError('Vui lòng nhập tên đăng nhập.');
      return;
    }
    if (!password) {
      setError('Vui lòng nhập mật khẩu.');
      return;
    }

    try {
      await login(username, password, remember);
      navigate('/projects', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại.');
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginCard}>
        {/* Brand */}
        <div className={styles.brandBlock}>
          <div className={styles.logoIcon}>QC</div>
          <h1 className={styles.brandTitle}>
            QC Portal <span className={styles.brandDot} />
          </h1>
          <p className={styles.brandSubtitle}>
            AI-powered software quality assurance
          </p>
        </div>

        {/* Form */}
        <form className={styles.form} onSubmit={handleSubmit}>
          {error && (
            <div className={styles.errorBox} role="alert">
              <span>✕</span>
              <span>{error}</span>
            </div>
          )}

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="auth-username">
              Tên đăng nhập
            </label>
            <input
              id="auth-username"
              type="text"
              className={styles.textInput}
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(null); }}
              placeholder="VD: lamtq"
              required
              autoComplete="username"
              disabled={isLoading}
              autoFocus
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="auth-password">
              Mật khẩu
            </label>
            <input
              id="auth-password"
              type="password"
              className={styles.textInput}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
              placeholder="Nhập mật khẩu..."
              required
              autoComplete="current-password"
              disabled={isLoading}
            />
          </div>

          <div className={styles.checkboxRow}>
            <input
              id="auth-remember"
              type="checkbox"
              className={styles.checkbox}
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              disabled={isLoading}
            />
            <label className={styles.checkboxLabel} htmlFor="auth-remember">
              Ghi nhớ đăng nhập
            </label>
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isLoading}
          >
            {isLoading ? (
              <span>ĐANG XÁC THỰC...</span>
            ) : (
              <>
                <span>ĐĂNG NHẬP</span>
                <span>→</span>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.footerSeparator} />
          VDS Internal — Viettel Digital Services
        </div>
      </div>
    </div>
  );
};

export default AuthLogin;
