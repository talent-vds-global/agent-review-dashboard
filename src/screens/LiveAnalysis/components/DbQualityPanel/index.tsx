import React from 'react';
import type { DbQualityResponse, DbQualityService } from '../../../../services/api';
import styles from './DbQualityPanel.module.css';

interface DbQualityPanelProps {
  data: DbQualityResponse | null;
  isLoading?: boolean;
  error?: string | null;
  fetchedAt?: Date | null;
  onRefresh?: () => void;
}

const SEVERITY_CLASS: Record<string, string> = {
  CRITICAL: styles.sevCritical,
  ERROR: styles.sevCritical,
  WARNING: styles.sevWarning,
  INFO: styles.sevInfo,
};

function formatTime(date?: Date | null): string {
  if (!date) return '--:--:--';
  return date.toLocaleTimeString('vi-VN', { hour12: false });
}

const ServiceCard: React.FC<{ item: DbQualityService }> = ({ item }) => {
  const m = item.metrics || {};
  const topTables = Object.entries(m.top_tables || {});

  if (!item.available) {
    return (
      <div className={`${styles.card} ${styles.cardOffline}`}>
        <div className={styles.cardHeader}>
          <span className={styles.serviceName}>{item.service}</span>
          <span className={styles.offlineTag}>không đọc được</span>
        </div>
        <div className={styles.offlineMsg}>{item.error}</div>
      </div>
    );
  }

  const score = item.score ?? 0;
  const scoreClass = score >= 90 ? styles.scoreGood : score >= 70 ? styles.scoreMid : styles.scoreBad;

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.serviceName}>{item.service}</span>
        <span className={styles.headerRight}>
          <a className={styles.dashLink} href={item.url} target="_blank" rel="noreferrer">
            dashboard ↗
          </a>
          <span className={`${styles.scoreTag} ${scoreClass}`}>điểm {score}</span>
        </span>
      </div>

      <div className={styles.metricRow}>
        <div className={styles.metric}>
          <span className={styles.metricValue}>{m.total_sql ?? '—'}</span>
          <span className={styles.metricLabel}>câu SQL thu được</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricValue}>{m.p50_ms ?? '—'}ms</span>
          <span className={styles.metricLabel}>p50</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricValue}>{m.p95_ms ?? '—'}ms</span>
          <span className={styles.metricLabel}>p95</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricValue}>{m.p99_ms ?? '—'}ms</span>
          <span className={styles.metricLabel}>p99</span>
        </div>
        <div className={styles.metric}>
          <span className={`${styles.metricValue} ${(m.slow_query_count ?? 0) > 0 ? styles.bad : ''}`}>
            {m.slow_query_count ?? '—'}
          </span>
          <span className={styles.metricLabel}>query chậm</span>
        </div>
        <div className={styles.metric}>
          <span className={`${styles.metricValue} ${(m.n_plus_one ?? 0) > 0 ? styles.bad : ''}`}>
            {m.n_plus_one ?? '—'}
          </span>
          <span className={styles.metricLabel}>nghi vấn N+1</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricValue}>{m.error_rate ?? 0}%</span>
          <span className={styles.metricLabel}>tỉ lệ lỗi</span>
        </div>
      </div>

      {topTables.length > 0 && (
        <div className={styles.tableChips}>
          <span className={styles.chipLabel}>Bảng bị gọi nhiều nhất:</span>
          {topTables.map(([name, count]) => (
            <span key={name} className={styles.chip}>
              {name.toLowerCase()} <strong>{count}×</strong>
            </span>
          ))}
        </div>
      )}

      {item.findings.length > 0 && (
        <>
          <div className={styles.blockTitle}>Phát hiện ({item.findings.length})</div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '150px' }}>Luật</th>
                <th>Mô tả</th>
                <th style={{ width: '280px' }}>Gọi từ</th>
              </tr>
            </thead>
            <tbody>
              {item.findings.map((f, idx) => (
                <tr key={idx}>
                  <td>
                    <span className={`${styles.sevTag} ${SEVERITY_CLASS[f.severity?.toUpperCase()] || ''}`}>
                      {f.severity}
                    </span>
                    <div className={styles.ruleName}>{f.rule}</div>
                    {f.table && <div className={styles.tableName}>{f.table}{f.column ? `.${f.column}` : ''}</div>}
                  </td>
                  <td>
                    <div className={styles.message}>{f.message}</div>
                    {f.recommendation && (
                      <div className={styles.recommendation}>Đề xuất: {f.recommendation}</div>
                    )}
                  </td>
                  <td className={styles.calledFrom}>{f.called_from || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {item.top_queries.length > 0 && (
        <>
          <div className={styles.blockTitle}>Câu lệnh gọi nhiều nhất</div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Câu lệnh</th>
                <th style={{ width: '250px' }}>Gọi từ</th>
                <th style={{ width: '80px' }}>Lượt</th>
                <th style={{ width: '90px' }}>TB</th>
                <th style={{ width: '90px' }}>Cao nhất</th>
              </tr>
            </thead>
            <tbody>
              {item.top_queries.map((q, idx) => (
                <tr key={idx}>
                  <td className={styles.sql} title={q.sql}>{q.sql}</td>
                  <td className={styles.calledFrom}>{q.called_from || '—'}</td>
                  <td className={styles.mono}>{q.calls ?? '—'}×</td>
                  <td className={styles.mono}>{q.avg_ms ?? '—'}ms</td>
                  <td className={styles.mono}>{q.max_ms ?? '—'}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export const DbQualityPanel: React.FC<DbQualityPanelProps> = ({
  data,
  isLoading,
  error,
  fetchedAt,
  onRefresh,
}) => {
  if (isLoading && !data) {
    return <div className={styles.emptyState}>Đang đọc số liệu từ dashboard db-quality...</div>;
  }

  if (error) {
    return (
      <div className={styles.emptyState}>
        <strong>Không lấy được số liệu database</strong>
        <p>{error}</p>
        {onRefresh && (
          <button type="button" className={styles.refreshBtn} onClick={onRefresh}>
            Thử lại
          </button>
        )}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className={styles.wrapper}>
      <div className={styles.topBar}>
        <div>
          <div className={styles.topTitle}>Chất lượng truy vấn database (Topic #80)</div>
          <div className={styles.topMeta}>
            Số liệu đọc trực tiếp từ dashboard của từng service lúc <strong>{formatTime(fetchedAt)}</strong> —
            không lưu lịch sử, mỗi lần mở tab là một lần đo mới.
          </div>
        </div>
        {onRefresh && (
          <button
            type="button"
            className={styles.refreshBtn}
            onClick={onRefresh}
            disabled={isLoading}
          >
            {isLoading ? 'Đang đọc...' : 'Đọc lại số liệu'}
          </button>
        )}
      </div>

      {data.services.map((item) => (
        <ServiceCard key={item.service} item={item} />
      ))}
    </div>
  );
};

export default DbQualityPanel;
