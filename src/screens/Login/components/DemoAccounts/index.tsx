import React from 'react';
import { DUMMY_ACCOUNTS, type UserAccount } from '../../../../data/dummy';
import styles from './DemoAccounts.module.css';

interface DemoAccountsProps {
  onSelectAccount: (account: UserAccount) => void;
  selectedUsername?: string;
}

export const DemoAccounts: React.FC<DemoAccountsProps> = ({
  onSelectAccount,
  selectedUsername,
}) => {
  return (
    <div className={styles.demoContainer}>
      <div className={styles.demoTitleGroup}>
        <span className={styles.demoTitle}>
          <span>⚡</span> 4 Tài khoản mẫu theo vai trò (Mock Roles)
        </span>
        <span className={styles.demoHint}>Bấm thẻ để điền nhanh</span>
      </div>

      <div className={styles.accountsGrid}>
        {DUMMY_ACCOUNTS.map((account) => {
          const isSelected = selectedUsername === account.username;

          return (
            <button
              key={account.id}
              type="button"
              className={`${styles.accountCard} ${isSelected ? styles.active : ''}`}
              onClick={() => onSelectAccount(account)}
            >
              <div
                className={styles.badgeSquare}
                style={{ backgroundColor: account.avatarBgColor || '#111111' }}
              >
                {account.initials}
              </div>

              <div className={styles.accountInfo}>
                <span className={styles.roleName}>{account.roleTitle}</span>
                <span className={styles.credentialMeta}>
                  User: <span className={styles.credCode}>{account.username}</span> · Pass: <span className={styles.credCode}>{account.passwordPlainText}</span>
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DemoAccounts;
