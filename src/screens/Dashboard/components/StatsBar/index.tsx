import React from 'react';
import type { FlowStats } from '../../../../data/mock';
import styles from './StatsBar.module.css';

interface StatsBarProps {
  stats: FlowStats;
}

export const StatsBar: React.FC<StatsBarProps> = ({ stats }) => {
  return (
    <footer className={styles.statsBar}>
      <div className={styles.statItem}>
        <div className={styles.statValue}>
          <span>{stats.spanCount}</span>
          <span className={styles.unitLabel}>span</span>
        </div>
        <div className={styles.statLabel}>trong luồng thực thi</div>
      </div>

      <div className={styles.statItem}>
        <div className={styles.statValue}>
          <span>{stats.totalDurationMs}ms</span>
          <span className={styles.unitLabel} style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            (ví dụ)
          </span>
        </div>
        <div className={styles.statLabel}>tổng thời gian (ví dụ)</div>
      </div>

      <div className={styles.statItem}>
        <div className={styles.statValue}>
          {/* Explicit requirement: "Số 0 màu đỏ" */}
          <span className={stats.issuesCount === 0 ? styles.redZero : styles.redZero}>
            {stats.issuesCount}
          </span>
          <span className={styles.unitLabel}>vấn đề</span>
        </div>
        <div className={styles.statLabel}>vấn đề phát hiện</div>
      </div>

      <div className={styles.statItem}>
        <div className={styles.statValue}>
          {/* Explicit requirement: "Số 0 màu đỏ" */}
          <span className={stats.runtimeTestGapCount === 0 ? styles.redZero : styles.redZero}>
            {stats.runtimeTestGapCount}
          </span>
          <span className={styles.unitLabel}>test gap</span>
        </div>
        <div className={styles.statLabel}>test gap runtime</div>
      </div>
    </footer>
  );
};

export default StatsBar;
