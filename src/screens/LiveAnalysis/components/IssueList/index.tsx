import React from 'react';
import type { IssueSeverity, OverviewIssue } from '../../../../services/api';
import styles from './IssueList.module.css';

interface IssueListProps {
  issues: OverviewIssue[];
  /** Mở thẳng tới bằng chứng của lỗi (luồng + tab tương ứng). */
  onOpenIssue: (issue: OverviewIssue) => void;
  /** Bỏ cột service khi danh sách đã nằm trong màn của đúng service đó. */
  hideService?: boolean;
  emptyText?: string;
  limit?: number;
}

const SEVERITY_LABEL: Record<IssueSeverity, string> = {
  high: 'NGHIÊM TRỌNG',
  medium: 'CẦN XEM',
  low: 'GHI NHẬN',
};

const SEVERITY_CLASS: Record<IssueSeverity, string> = {
  high: styles.sevHigh,
  medium: styles.sevMedium,
  low: styles.sevLow,
};

/** Nhãn ngắn cho loại vấn đề, để đọc lướt biết ngay lỗi thuộc nhóm nào. */
const KIND_LABEL: Record<string, string> = {
  missing_step: 'Bước thiếu',
  missing_step_should: 'Bước thiếu (should)',
  partial_step: 'Khớp một phần',
  nfr: 'Vi phạm NFR',
  error_span: 'Lời gọi lỗi',
  extra_call: 'Ngoài tài liệu',
  doc: 'Tài liệu',
};

export const IssueList: React.FC<IssueListProps> = ({
  issues,
  onOpenIssue,
  hideService,
  emptyText = 'Không phát hiện vấn đề nào trong các luồng đã đối chiếu.',
  limit,
}) => {
  if (!issues.length) {
    return <div className={styles.empty}>✓ {emptyText}</div>;
  }

  const shown = limit ? issues.slice(0, limit) : issues;

  return (
    <div className={styles.list}>
      {shown.map((issue) => (
        <button
          key={issue.id}
          type="button"
          className={`${styles.row} ${SEVERITY_CLASS[issue.severity]}`}
          onClick={() => onOpenIssue(issue)}
          title="Mở bằng chứng của vấn đề này"
        >
          <span className={`${styles.severityTag} ${SEVERITY_CLASS[issue.severity]}`}>
            {SEVERITY_LABEL[issue.severity]}
          </span>

          <span className={styles.body}>
            <span className={styles.title}>{issue.title}</span>
            <span className={styles.detail}>{issue.detail}</span>
          </span>

          <span className={styles.meta}>
            <span className={styles.kindTag}>{KIND_LABEL[issue.kind] || issue.kind}</span>
            <span className={styles.flowTag}>{issue.flow_id}</span>
            {!hideService && issue.service && (
              <span className={styles.serviceTag}>{issue.service}</span>
            )}
          </span>

          <span className={styles.arrow}>→</span>
        </button>
      ))}

      {limit && issues.length > limit && (
        <div className={styles.moreNote}>… và {issues.length - limit} vấn đề khác</div>
      )}
    </div>
  );
};

export default IssueList;
