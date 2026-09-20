import React from 'react';
import type { Flow, ServiceItem } from '../../../../data/mock';
import { useReportModal } from './useReportModal';
import styles from './ReportModal.module.css';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: ServiceItem;
  flow: Flow;
  projectName: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  service,
  flow,
  projectName,
}) => {
  const { passedCount, totalCount, complianceScore, handlePrint } = useReportModal({ flow });

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalWindow} onClick={(e) => e.stopPropagation()}>
        <header className={styles.modalHeader}>
          <div className={styles.modalTitleGroup}>
            <span className={styles.modalSuperTitle}>BÁO CÁO CHẤT LƯỢNG PHẦN MỀM THỰC THI</span>
            <h3 className={styles.modalTitle}>Runtime Quality Assessment Report</h3>
          </div>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Đóng">
            ✕
          </button>
        </header>

        <div className={styles.modalBody}>
          <div className={styles.reportMetaGrid}>
            <div className={styles.metaItem}>
              <span className={styles.metaKey}>HỆ THỐNG / PROJECT</span>
              <span className={styles.metaVal}>{projectName}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaKey}>SERVICE THỰC THI</span>
              <span className={styles.metaVal}>{service.name}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaKey}>LUỒNG NGHIỆP VỤ (SRS)</span>
              <span className={styles.metaVal}>
                {flow.name} ({flow.srsCode})
              </span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaKey}>ĐIỂM ĐẠT CHUẨN</span>
              <span
                className={styles.metaVal}
                style={{
                  color: complianceScore >= 100 ? '#10B981' : 'var(--accent-red)',
                  fontSize: '16px',
                }}
              >
                {complianceScore}% ({passedCount}/{totalCount} tiêu chí)
              </span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaKey}>TỔNG THỜI GIAN TRACING</span>
              <span className={styles.metaVal}>{flow.stats.totalDurationMs}ms</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaKey}>VẤN ĐỀ / TEST GAPS</span>
              <span className={styles.metaVal}>
                {flow.stats.issuesCount} vấn đề · {flow.stats.runtimeTestGapCount} gap
              </span>
            </div>
          </div>

          <div>
            <h4 className={styles.reportSectionTitle}>
              <span>Kết quả kiểm định 4 câu hỏi chất lượng ban đầu</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Mục tiêu SRS</span>
            </h4>
            <div className={styles.criteriaList}>
              {flow.criteria.map((c) => (
                <div key={c.id} className={styles.criteriaRow}>
                  <div>
                    <strong>{c.question}</strong>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {c.description}
                    </div>
                  </div>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 800,
                      padding: '3px 8px',
                      background: c.passed ? '#111111' : 'var(--accent-red)',
                      color: '#FFFFFF',
                      fontSize: '11px',
                    }}
                  >
                    {c.passed ? 'ĐẠT' : 'CẢNH BÁO'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className={styles.reportSectionTitle}>
              <span>Tóm tắt kết luận chất lượng</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Ví dụ minh hoạ</span>
            </h4>
            <p style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
              Báo cáo được tổng hợp tự động từ dữ liệu tracing phân tán (OpenTelemetry spans),
              telemetry metrics và log đối chiếu SRS. Luồng{' '}
              <strong>"{flow.name}"</strong> hiện tại{' '}
              {flow.stats.issuesCount === 0
                ? 'đạt đầy đủ các chỉ số hiệu năng và quy chuẩn nghiệp vụ.'
                : `có ${flow.stats.issuesCount} phát hiện cần khắc phục trước khi release chính thức.`}
            </p>
          </div>
        </div>

        <footer className={styles.modalFooter}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
            CHỨNG THỰC BỞI QC PORTAL · DỮ LIỆU RUNTIME
          </span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" className={styles.downloadBtn} onClick={onClose}>
              Đóng
            </button>
            <button type="button" className={styles.printBtn} onClick={handlePrint}>
              In / Xuất PDF Báo Cáo
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ReportModal;
