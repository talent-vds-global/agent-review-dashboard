import React from 'react';
import type { OverviewFlow, OverviewIssue, OverviewService } from '../../../../services/api';
import { IssueList } from '../IssueList';
import styles from './ServiceDetail.module.css';

interface ServiceDetailProps {
  service: OverviewService;
  flows: OverviewFlow[];
  onOpenFlow: (flowId: string) => void;
  onOpenIssue: (issue: OverviewIssue) => void;
}

const VERDICT_LABEL: Record<string, string> = {
  PASS: 'ĐẠT',
  WARN: 'CẢNH BÁO',
  FAIL: 'KHÔNG ĐẠT',
  UNKNOWN: 'KHÔNG RÕ',
  NONE: 'CHƯA PHÂN TÍCH',
};

function verdictClass(verdict: string, s: Record<string, string>): string {
  if (verdict === 'PASS') return s.vPass;
  if (verdict === 'WARN') return s.vWarn;
  if (verdict === 'FAIL') return s.vFail;
  return s.vNone;
}

function formatTime(value?: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  return date.toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const FlowRow: React.FC<{ flow: OverviewFlow; onOpen: () => void }> = ({ flow, onOpen }) => {
  const summary = flow.summary;
  const checked = summary
    ? summary.matched + summary.partial + summary.missing
    : 0;

  return (
    <button type="button" className={styles.flowRow} onClick={onOpen}>
      <span className={styles.flowCode}>{flow.flow_id}</span>

      <span className={styles.flowBody}>
        <span className={styles.flowTitle}>{flow.title || flow.doc?.title || flow.flow_id}</span>
        <span className={styles.flowMeta}>
          {flow.analyzed ? (
            <>
              {summary && (
                <span>
                  {summary.matched}/{checked} bước khớp
                </span>
              )}
              {summary && summary.nfr_fail > 0 && (
                <span className={styles.metaBad}>{summary.nfr_fail} NFR vi phạm</span>
              )}
              {flow.branch?.label && <span className={styles.branch}>{flow.branch.label}</span>}
              <span className={styles.dim}>{formatTime(flow.created_at)}</span>
            </>
          ) : (
            <span className={styles.dim}>
              Chưa có kết quả phân tích — chạy POST /runtime cho luồng này
            </span>
          )}
        </span>
      </span>

      <span className={styles.flowRight}>
        {flow.issue_counts.total > 0 ? (
          <span className={styles.issuePill}>{flow.issue_counts.total} vấn đề</span>
        ) : (
          flow.analyzed && <span className={styles.okPill}>sạch</span>
        )}
        <span className={`${styles.verdictChip} ${verdictClass(flow.verdict, styles)}`}>
          {VERDICT_LABEL[flow.verdict] || flow.verdict}
        </span>
      </span>
    </button>
  );
};

/** Màn giữa: một service và các luồng nghiệp vụ đi qua nó. */
export const ServiceDetail: React.FC<ServiceDetailProps> = ({
  service,
  flows,
  onOpenFlow,
  onOpenIssue,
}) => {
  const db = service.db;
  const dbMetrics = db?.metrics || {};

  return (
    <div className={styles.wrapper}>
      <section className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.kicker}>SERVICE</div>
          <h2 className={styles.name}>{service.name}</h2>
          {service.role && <div className={styles.role}>{service.role}</div>}
        </div>

        <div className={styles.headerStats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>
              {service.flows_analyzed}/{service.flows.length}
            </span>
            <span className={styles.statLabel}>luồng đã đối chiếu</span>
          </div>
          <div className={styles.stat}>
            <span
              className={`${styles.statValue} ${service.issue_counts.high ? styles.bad : ''}`}
            >
              {service.issue_counts.high}
            </span>
            <span className={styles.statLabel}>vấn đề nghiêm trọng</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{service.issue_counts.total}</span>
            <span className={styles.statLabel}>tổng vấn đề</span>
          </div>
          <div className={styles.stat}>
            <span className={`${styles.verdictChip} ${verdictClass(service.verdict, styles)}`}>
              {VERDICT_LABEL[service.verdict] || service.verdict}
            </span>
            <span className={styles.statLabel} title="Tính trên các vấn đề quy về chính service này">
              kết luận cho service
            </span>
          </div>
        </div>
      </section>

      {db && (
        <section className={styles.dbStrip}>
          <span className={styles.dbLabel}>CHẤT LƯỢNG DATABASE</span>
          {db.available ? (
            <>
              {db.score !== null && (
                <span className={styles.dbItem}>
                  Điểm <b>{db.score}</b>/100
                </span>
              )}
              {dbMetrics.total_sql != null && (
                <span className={styles.dbItem}>
                  <b>{dbMetrics.total_sql}</b> câu SQL
                </span>
              )}
              {dbMetrics.p95_ms != null && (
                <span className={styles.dbItem}>
                  p95 <b>{dbMetrics.p95_ms}ms</b>
                </span>
              )}
              {dbMetrics.slow_query_count != null && (
                <span className={styles.dbItem}>
                  <b>{dbMetrics.slow_query_count}</b> query chậm
                </span>
              )}
              {dbMetrics.n_plus_one != null && (
                <span className={dbMetrics.n_plus_one ? styles.dbItemBad : styles.dbItem}>
                  <b>{dbMetrics.n_plus_one}</b> N+1
                </span>
              )}
              <span className={db.findings ? styles.dbItemBad : styles.dbItem}>
                <b>{db.findings}</b> phát hiện
              </span>
            </>
          ) : (
            <span className={styles.dbOffline}>
              Không đọc được dashboard db-quality của service này
            </span>
          )}
        </section>
      )}

      <section className={styles.block}>
        <div className={styles.blockHeader}>
          <h3 className={styles.blockTitle}>Luồng nghiệp vụ đi qua service này</h3>
          <span className={styles.blockNote}>{flows.length} luồng</span>
        </div>
        <div className={styles.flowList}>
          {flows.map((flow) => (
            <FlowRow key={flow.flow_id} flow={flow} onOpen={() => onOpenFlow(flow.flow_id)} />
          ))}
          {!flows.length && (
            <div className={styles.emptyFlows}>
              Chưa có luồng nào khai báo service này trong mapping.
            </div>
          )}
        </div>
      </section>

      <section className={styles.block}>
        <div className={styles.blockHeader}>
          <h3 className={styles.blockTitle}>Vấn đề thuộc service này</h3>
          <span className={styles.blockNote}>Bấm một dòng để mở bằng chứng</span>
        </div>
        <div className={styles.panelBody}>
          <IssueList
            issues={service.issues}
            onOpenIssue={onOpenIssue}
            hideService
            emptyText="Service này không có vấn đề nào trong các luồng đã đối chiếu."
          />
        </div>
      </section>
    </div>
  );
};

export default ServiceDetail;
