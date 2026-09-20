import React from 'react';
import type { Criterion } from '../../../../data/mock';
import styles from './CriteriaCard.module.css';

interface CriteriaCardProps {
  criterion: Criterion;
  index: number;
}

export const CriteriaCard: React.FC<CriteriaCardProps> = ({ criterion, index }) => {
  return (
    <div className={`${styles.criteriaCard} ${!criterion.passed ? styles.failed : ''}`}>
      <div>
        <div className={styles.cardHeader}>
          <span className={styles.questionNumber}>TIÊU CHÍ #{index + 1}</span>
          <span
            className={`${styles.statusIndicator} ${
              criterion.passed ? styles.passed : styles.failed
            }`}
          >
            {criterion.passed ? '✓ ĐẠT' : '✕ CHƯA ĐẠT'}
          </span>
        </div>

        <h4 className={styles.questionText}>{criterion.question}</h4>
      </div>

      <p className={styles.descText}>{criterion.description}</p>
    </div>
  );
};

export default CriteriaCard;
