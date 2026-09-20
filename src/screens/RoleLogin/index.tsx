import React from 'react';
import type { RoleType } from '../../data/mock';
import { useRoleLogin } from './useRoleLogin';
import { RoleCard } from './components/RoleCard';
import styles from './RoleLogin.module.css';

interface RoleLoginProps {
  onSelectRole: (role: RoleType) => void;
  onGoToLogin?: () => void;
}

export const RoleLogin: React.FC<RoleLoginProps> = ({ onSelectRole, onGoToLogin }) => {
  const { roleList, handleSelectRole, systemStatus } = useRoleLogin({ onSelectRole });

  return (
    <div className={styles.loginContainer}>
      <header className={styles.topBar}>
        <div className={styles.logoArea}>
          <span className={styles.brandName}>
            QC PORTAL <span className={styles.brandDot} />
          </span>
          <span className={styles.taglineBadge}>HƯỚNG DẪN VAI TRÒ</span>
        </div>
        <div className={styles.topRightActions}>
          {onGoToLogin && (
            <button
              type="button"
              className={styles.loginSwitchBtn}
              onClick={onGoToLogin}
            >
              <span>← Đăng nhập bằng tài khoản</span>
            </button>
          )}
          <div className={styles.systemStatus}>
            <span className={styles.statusIndicator} />
            <span>{systemStatus.text}</span>
          </div>
        </div>
      </header>

      <main className={styles.heroSection}>
        <div className={styles.heroHeader}>
          <h1 className={styles.heroTitle}>Cùng một sự thật runtime, khác nhau ở góc nhìn</h1>
          <p className={styles.heroSubtitle}>
            Mỗi vai trò thấy cùng dữ liệu tracing của một luồng, nhưng ưu tiên đúng thông tin và
            quyền hạn của mình. Bấm một thẻ để vào portal.
          </p>
        </div>

        <div className={styles.cardsGrid}>
          {roleList.map((role) => (
            <RoleCard key={role.id} role={role} onSelectRole={handleSelectRole} />
          ))}
        </div>
      </main>

      <footer className={styles.footerInfo}>
        <div>QC PORTAL · HỆ THỐNG GIÁM SÁT CHẤT LƯỢNG PHẦN MỀM THỰC THI (RUNTIME ACCURACY)</div>
        <div className={styles.taglineBadge}>{systemStatus.version}</div>
      </footer>
    </div>
  );
};

export default RoleLogin;
