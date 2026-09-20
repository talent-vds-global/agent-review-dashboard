import React from 'react';
import type { RoleInfo, RoleType } from '../../../../data/mock';
import styles from './RoleCard.module.css';

interface RoleCardProps {
  role: RoleInfo;
  onSelectRole: (roleId: RoleType) => void;
}

export const RoleCard: React.FC<RoleCardProps> = ({ role, onSelectRole }) => {
  return (
    <button
      className={styles.roleCard}
      onClick={() => onSelectRole(role.id)}
      type="button"
      aria-label={`Đăng nhập với vai trò ${role.roleTitle}`}
    >
      <div>
        <div className={styles.roleCardHeader}>
          <div className={styles.initialSquare}>{role.initials}</div>
          <span className={styles.permBadge}>Quyền {role.permission}</span>
        </div>

        <div className={styles.roleCardBody}>
          <h2 className={styles.roleName}>{role.roleTitle}</h2>
          <div className={styles.personName}>{role.name}</div>
          <p className={styles.roleDesc}>{role.description}</p>
        </div>
      </div>

      <div className={styles.roleCardFooter}>
        <span className={styles.actionLink}>
          Đăng nhập <span className={styles.arrowIcon}>→</span>
        </span>
        <span className={styles.permBadge} style={{ fontSize: '10px' }}>
          ROLE ID: {role.id.toUpperCase()}
        </span>
      </div>
    </button>
  );
};

export default RoleCard;
