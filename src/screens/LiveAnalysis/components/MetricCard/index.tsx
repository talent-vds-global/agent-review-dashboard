import React from 'react';
import type { OverviewMetric } from '../../../../services/api';
import styles from './MetricCard.module.css';

interface MetricCardProps {
  metric: OverviewMetric;
  index: number;
}

/**
 * Một tiêu chí chất lượng được trả lời ĐẠT / CHƯA ĐẠT bằng số liệu thật.
 *
 * `passed = null` là trạng thái thứ ba có thật: chưa đủ dữ liệu để kết luận (chưa có trace,
 * chưa đo được NFR). Hiện riêng thay vì coi như đạt — nếu không dashboard sẽ báo xanh trong
 * khi thực chất chưa kiểm được gì.
 */
export const MetricCard: React.FC<MetricCardProps> = ({ metric, index }) => {
  const state = metric.passed === null ? 'unknown' : metric.passed ? 'passed' : 'failed';
  const stateClass =
    state === 'passed' ? styles.passed : state === 'failed' ? styles.failed : styles.unknown;
  const label =
    state === 'passed' ? '✓ ĐẠT' : state === 'failed' ? '✕ CHƯA ĐẠT' : '— CHƯA ĐỦ DỮ LIỆU';

  return (
    <div className={`${styles.card} ${stateClass}`}>
      <div className={styles.cardHeader}>
        <span className={styles.index}>TIÊU CHÍ #{index + 1}</span>
        <span className={`${styles.status} ${stateClass}`}>{label}</span>
      </div>

      <h4 className={styles.question}>{metric.question}</h4>
      <div className={styles.value}>{metric.value}</div>
      <p className={styles.detail}>{metric.detail}</p>
      <div className={styles.source} title="Số liệu này lấy từ đâu">
        {metric.source}
      </div>
    </div>
  );
};

export default MetricCard;
