import React from 'react';
import type { UserProfile } from '../../data/dummy';
import { useLogin } from './useLogin';
import { DemoAccounts } from './components/DemoAccounts';
import styles from './Login.module.css';

interface LoginProps {
  onLoginSuccess: (user: UserProfile) => void;
  onExploreRoles?: () => void;
  initialUsername?: string;
}

export const Login: React.FC<LoginProps> = ({
  onLoginSuccess,
  onExploreRoles,
  initialUsername,
}) => {
  const {
    username,
    password,
    errorMessage,
    isLoading,
    selectedAccount,
    handleUsernameChange,
    handlePasswordChange,
    handleSelectDemoAccount,
    handleSubmit,
  } = useLogin({ onLoginSuccess, initialUsername });

  return (
    <div className={styles.loginPage}>
      <header className={styles.topBar}>
        <div className={styles.brandNav}>
          <span className={styles.brandLogo}>
            QC PORTAL <span className={styles.brandDot} />
          </span>
          <span className={styles.badgeTag}>CỔNG THẨM ĐỊNH CHẤT LƯỢNG</span>
        </div>
        <div className={styles.systemStatus}>
          <span className={styles.statusIndicator} />
          <span>RUNTIME MONITORING LIVE</span>
        </div>
      </header>

      <main className={styles.mainContent}>
        <div className={styles.authCard}>
          <div className={styles.cardHeader}>
            <h1 className={styles.cardTitle}>Đăng nhập vào Portal</h1>
            <p className={styles.cardSubtitle}>
              Xác thực danh tính để vào giao diện giám sát chất lượng runtime tương ứng với vai trò của bạn.
            </p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            {errorMessage && (
              <div className={styles.errorBox} role="alert">
                <span>✕</span>
                <span>{errorMessage}</span>
              </div>
            )}

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="login-username">
                <span>Tên đăng nhập hoặc Email</span>
                <span className={styles.fieldHint}>(dev / leader / tester / ops)</span>
              </label>
              <input
                id="login-username"
                type="text"
                className={styles.textInput}
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="Nhập username hoặc email..."
                required
                autoComplete="username"
                disabled={isLoading}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="login-password">
                <span>Mật khẩu</span>
                <span className={styles.fieldHint}>(mặc định: *123)</span>
              </label>
              <input
                id="login-password"
                type="password"
                className={styles.textInput}
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                placeholder="Nhập mật khẩu..."
                required
                autoComplete="current-password"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span>ĐANG XÁC THỰC RUNTIME...</span>
                </>
              ) : (
                <>
                  <span>ĐĂNG NHẬP VÀO PORTAL</span>
                  <span>→</span>
                </>
              )}
            </button>
          </form>

          {/* Subcomponent: 4 Tài khoản mẫu theo vai trò */}
          <DemoAccounts
            onSelectAccount={handleSelectDemoAccount}
            selectedUsername={selectedAccount}
          />

          {onExploreRoles && (
            <div className={styles.secondaryActions}>
              <button
                type="button"
                className={styles.textLink}
                onClick={onExploreRoles}
              >
                ← Xem thông tin chi tiết quyền hạn 4 vai trò
              </button>
            </div>
          )}
        </div>
      </main>

      <footer className={styles.footerInfo}>
        <div>QC PORTAL · HỆ THỐNG GIÁM SÁT CHẤT LƯỢNG PHẦN MỀM THỰC THI (RUNTIME ACCURACY)</div>
        <span className={styles.badgeTag}>PHIÊN BẢN 2.8.4</span>
      </footer>
    </div>
  );
};

export default Login;
