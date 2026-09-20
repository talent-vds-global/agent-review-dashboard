import React from 'react';
import type { Flow, RoleType, ServiceItem } from '../../../../data/mock';
import { CriteriaCard } from '../CriteriaCard';
import { EvidencePanel } from '../EvidencePanel';
import styles from './FlowDetail.module.css';

interface FlowDetailProps {
  currentRole: RoleType;
  service: ServiceItem;
  flow: Flow;
}

export const FlowDetail: React.FC<FlowDetailProps> = ({ currentRole, service, flow }) => {
  const passedCount = flow.criteria.filter((c) => c.passed).length;
  const totalCount = flow.criteria.length;
  const allPassed = passedCount === totalCount;

  const roleLabel: Record<RoleType, string> = {
    developer: 'GÓC NHÌN: DEVELOPER',
    leader: 'GÓC NHÌN: DEVELOPER LEADER',
    operator: 'GÓC NHÌN: OPERATOR',
    tester: 'GÓC NHÌN: TESTER',
  };

  return (
    <main className={styles.flowDetailContainer}>
      <div className={styles.flowHeader}>
        <div className={styles.tagRow}>
          <span className={styles.serviceTag}>SERVICE: {service.name}</span>
          <span className={styles.srsTag}>MÃ SRS: {flow.srsCode}</span>
          <span className={styles.roleTag}>{roleLabel[currentRole]}</span>
        </div>

        <div className={styles.flowTitleRow}>
          <h2 className={styles.flowTitle}>{flow.name}</h2>
          <div className={styles.flowQuickStat}>
            <span className={styles.statPill}>Thời gian: {flow.stats.totalDurationMs}ms</span>
            <span className={styles.statPill}>Tổng Spans: {flow.stats.spanCount}</span>
          </div>
        </div>
      </div>

      {/* 4 Criteria questions */}
      <section className={styles.criteriaSection}>
        <div className={styles.criteriaSectionHeader}>
          <h3 className={styles.criteriaSectionTitle}>
            Trạng thái các vấn đề đặt ra ban đầu
          </h3>
          <span
            className={`${styles.criteriaBadge} ${
              allPassed ? styles.allPassed : styles.hasFailed
            }`}
          >
            {passedCount}/{totalCount} TIÊU CHÍ ĐẠT
          </span>
        </div>

        <div className={styles.criteriaGrid}>
          {flow.criteria.map((crit, idx) => (
            <CriteriaCard key={crit.id} criterion={crit} index={idx} />
          ))}
        </div>
      </section>

      {/* Role-specific Evidence Panel */}
      <EvidencePanel currentRole={currentRole} flow={flow} />
    </main>
  );
};

export default FlowDetail;
