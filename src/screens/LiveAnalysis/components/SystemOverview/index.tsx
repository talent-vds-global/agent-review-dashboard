import React from 'react';
import type { OverviewIssue, OverviewService, SystemOverview as Overview } from '../../../../services/api';
import { MetricCard } from '../MetricCard';
import { IssueList } from '../IssueList';
import styles from './SystemOverview.module.css';

interface SystemOverviewProps {
  data: Overview;
  onOpenService: (name: string) => void;
  onOpenIssue: (issue: OverviewIssue) => void;
}

const HEALTH_LABEL: Record<string, string> = {
  healthy: 'HỆ THỐNG ĐẠT CHUẨN',
  warning: 'CÓ VẤN ĐỀ CẦN XEM',
  critical: 'CÓ VẤN ĐỀ NGHIÊM TRỌNG',
  unknown: 'CHƯA ĐỦ DỮ LIỆU',
};

const VERDICT_LABEL: Record<string, string> = {
  PASS: 'ĐẠT',
  WARN: 'CẢNH BÁO',
  FAIL: 'KHÔNG ĐẠT',
  UNKNOWN: 'KHÔNG RÕ',
  NONE: 'CHƯA PHÂN TÍCH',
};

function verdictClass(verdict: string): string {
  if (verdict === 'PASS') return styles.vPass;
  if (verdict === 'WARN') return styles.vWarn;
  if (verdict === 'FAIL') return styles.vFail;
  return styles.vNone;
}

const ServiceRow: React.FC<{ service: OverviewService; onOpen: () => void }> = ({
  service,
  onOpen,
}) => {
  const counts = service.issue_counts;
  const db = service.db;

  return (
    <button type="button" className={styles.serviceRow} onClick={onOpen}>
      <span className={styles.serviceCell}>
        <span className={styles.serviceName}>{service.name}</span>
        {service.role && <span className={styles.serviceRole}>{service.role}</span>}
      </span>

      <span className={`${styles.verdictChip} ${verdictClass(service.verdict)}`}>
        {VERDICT_LABEL[service.verdict] || service.verdict}
      </span>

      <span className={styles.flowCell}>
        <span className={styles.flowCount}>
          {service.flows_analyzed}/{service.flows.length} luồng đã đối chiếu
        </span>
        <span className={styles.flowCodes}>{service.flows.join(' · ')}</span>
      </span>

      <span className={styles.dbCell}>
        {db && db.available && db.score !== null ? (
          <>
            <b>{db.score}</b>
            <span className={styles.dim}>/100</span>
          </>
        ) : (
          <span className={styles.dim}>—</span>
        )}
      </span>

      <span className={styles.issueCell}>
        {counts.total === 0 ? (
          <span className={styles.noIssue}>Không có vấn đề</span>
        ) : (
          <>
            {counts.high > 0 && <span className={styles.badgeHigh}>{counts.high} nghiêm trọng</span>}
            {counts.medium > 0 && <span className={styles.badgeMedium}>{counts.medium} cần xem</span>}
            {counts.low > 0 && <span className={styles.badgeLow}>{counts.low} ghi nhận</span>}
          </>
        )}
      </span>

      <span className={styles.arrow}>→</span>
    </button>
  );
};

/**
 * Màn đầu tiên: sức khoẻ toàn hệ thống theo các tiêu chí đo được, các lỗi đang bắt được,
 * và tình trạng từng service. Không vẽ lại trace — muốn xem bằng chứng thì mở xuống luồng.
 */
export const SystemOverview: React.FC<SystemOverviewProps> = ({
  data,
  onOpenService,
  onOpenIssue,
}) => {
  const { health, totals, metrics, issues, services } = data;

  return (
    <div className={styles.wrapper}>
      {/* Băng trạng thái tổng */}
      <section className={`${styles.healthBanner} ${styles[health.status]}`}>
        <div className={styles.healthLeft}>
          <div className={styles.healthLabel}>TÌNH TRẠNG CHẤT LƯỢNG</div>
          <div className={styles.healthStatus}>{HEALTH_LABEL[health.status]}</div>
          <div className={styles.healthNote}>
            {health.metrics_passed}/{health.metrics_evaluated} tiêu chí đạt
            {health.metrics_evaluated < health.metrics_total &&
              ` · ${health.metrics_total - health.metrics_evaluated} tiêu chí chưa đủ dữ liệu`}
          </div>
        </div>

        <div className={styles.healthStats}>
          <div className={styles.healthStat}>
            <span className={styles.statValue}>
              {totals.flows_analyzed}/{totals.flows_total}
            </span>
            <span className={styles.statLabel}>luồng đã đối chiếu</span>
          </div>
          <div className={styles.healthStat}>
            <span className={styles.statValue}>{services.length}</span>
            <span className={styles.statLabel}>service theo dõi</span>
          </div>
          <div className={styles.healthStat}>
            <span className={`${styles.statValue} ${health.issues_high ? styles.bad : ''}`}>
              {health.issues_high}
            </span>
            <span className={styles.statLabel}>vấn đề nghiêm trọng</span>
          </div>
          <div className={styles.healthStat}>
            <span className={styles.statValue}>{health.issues_total}</span>
            <span className={styles.statLabel}>tổng vấn đề</span>
          </div>
        </div>
      </section>

      {/* Các tiêu chí chất lượng, trả lời bằng số liệu thật */}
      <section className={styles.block}>
        <div className={styles.blockHeader}>
          <h3 className={styles.blockTitle}>Tiêu chí chất lượng</h3>
          <span className={styles.blockNote}>
            Tất cả đo trên kết quả đối chiếu tất định đã lưu cùng verdict
          </span>
        </div>
        <div className={styles.metricGrid}>
          {metrics.map((metric, index) => (
            <MetricCard key={metric.id} metric={metric} index={index} />
          ))}
        </div>
      </section>

      {/* Lỗi đang bắt được */}
      <section className={styles.block}>
        <div className={styles.blockHeader}>
          <h3 className={styles.blockTitle}>Lỗi đang bắt được</h3>
          <span className={`${styles.countPill} ${issues.length ? styles.countPillBad : ''}`}>
            {issues.length} vấn đề
          </span>
        </div>
        <div className={styles.panelBody}>
          <IssueList issues={issues} onOpenIssue={onOpenIssue} limit={12} />
        </div>
      </section>

      {/* Chia theo service */}
      <section className={styles.block}>
        <div className={styles.blockHeader}>
          <h3 className={styles.blockTitle}>Chất lượng theo service</h3>
          <span className={styles.blockNote}>Mở một service để xem các luồng nghiệp vụ của nó</span>
        </div>
        <div className={styles.serviceList}>
          <div className={styles.serviceListHead}>
            <span>Service</span>
            <span>Kết luận</span>
            <span>Luồng nghiệp vụ</span>
            <span className={styles.headRight}>Điểm DB</span>
            <span>Vấn đề</span>
            <span />
          </div>

          {services.map((service) => (
            <ServiceRow
              key={service.name}
              service={service}
              onOpen={() => onOpenService(service.name)}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default SystemOverview;
