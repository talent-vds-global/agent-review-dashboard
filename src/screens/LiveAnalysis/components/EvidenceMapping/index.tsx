import React, { useMemo, useState } from 'react';
import type {
  EvidenceReport,
  EvidenceSpan,
  EvidenceStatus,
} from '../../../../services/api';
import styles from './EvidenceMapping.module.css';

interface EvidenceMappingProps {
  report: EvidenceReport | null;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  error?: string | null;
}

const STATUS_LABEL: Record<EvidenceStatus, string> = {
  MATCHED: 'Khớp',
  PARTIAL: 'Khớp một phần',
  MISSING: 'Thiếu',
  NOT_OBSERVABLE: 'Không quan sát được',
  NOT_IN_BRANCH: 'Ngoài nhánh',
};

const STATUS_CLASS: Record<EvidenceStatus, string> = {
  MATCHED: styles.stMatched,
  PARTIAL: styles.stPartial,
  MISSING: styles.stMissing,
  NOT_OBSERVABLE: styles.stUnknown,
  NOT_IN_BRANCH: styles.stSkipped,
};

type FilterMode = 'all' | 'issue' | 'matched';

const TYPE_LABEL: Record<string, string> = {
  http: 'HTTP',
  grpc: 'gRPC',
  kafka: 'KAFKA',
  ws: 'WS',
  db: 'SQL',
};

const SpanLine: React.FC<{ span: EvidenceSpan }> = ({ span }) => (
  <div className={`${styles.spanLine} ${span.error ? styles.spanLineError : ''}`}>
    <span className={styles.spanType}>{TYPE_LABEL[span.type] || span.type}</span>
    <span className={styles.spanService}>{span.service}</span>
    <span className={styles.spanLabel}>{span.label}</span>
    <span className={styles.spanDuration}>{span.duration_ms}ms</span>
    {span.detail && <span className={styles.spanDetail} title={span.detail}>{span.detail}</span>}
  </div>
);

export const EvidenceMapping: React.FC<EvidenceMappingProps> = ({
  report,
  onRefresh,
  isRefreshing,
  error,
}) => {
  const [filter, setFilter] = useState<FilterMode>('all');
  const [openRows, setOpenRows] = useState<Record<string, boolean>>({});

  const steps = useMemo(() => {
    if (!report) return [];
    if (filter === 'issue') {
      return report.steps.filter((s) => s.status === 'MISSING' || s.status === 'PARTIAL');
    }
    if (filter === 'matched') {
      return report.steps.filter((s) => s.status === 'MATCHED');
    }
    return report.steps;
  }, [report, filter]);

  if (error) {
    return (
      <div className={styles.emptyState}>
        <strong>Chưa dựng được bảng đối chiếu</strong>
        <p>{error}</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className={styles.emptyState}>
        <strong>Kết quả phân tích này chưa có bảng đối chiếu</strong>
        <p>
          Bản ghi được tạo trước khi có tính năng evidence mapping. Chạy lại{' '}
          <code>POST /runtime</code> cho flow này, hoặc bấm “Đối chiếu lại” để dựng bảng từ
          tài liệu và trace hiện tại.
        </p>
        {onRefresh && (
          <button type="button" className={styles.refreshBtn} onClick={onRefresh} disabled={isRefreshing}>
            {isRefreshing ? 'Đang đối chiếu...' : 'Đối chiếu lại ngay'}
          </button>
        )}
      </div>
    );
  }

  const { summary, doc, branch } = report;

  return (
    <div className={styles.wrapper}>
      {/* Thanh tóm tắt */}
      <div className={styles.summaryBar}>
        <div className={styles.summaryLeft}>
          <div className={styles.docBlock}>
            <span className={styles.docTitle}>
              {doc.title || report.flow_id} · {doc.entry}
            </span>
            <span className={styles.docMeta}>
              Tài liệu: {doc.source || '—'}
              {doc.version ? ` · v${doc.version}` : ''}
              {doc.status ? ` · ${doc.status}` : ''} · Ánh xạ: {report.mapping_source}
            </span>
          </div>
          <span className={styles.branchPill}>
            Nhánh {branch.code}
            {branch.status_code ? ` · HTTP ${branch.status_code}` : ''}
            {branch.doc_ref ? ` · ${branch.doc_ref}` : ''}
          </span>
        </div>

        <div className={styles.countGroup}>
          <span className={`${styles.countChip} ${styles.stMatched}`}>Khớp {summary.matched}</span>
          {summary.partial > 0 && (
            <span className={`${styles.countChip} ${styles.stPartial}`}>Một phần {summary.partial}</span>
          )}
          <span className={`${styles.countChip} ${summary.missing > 0 ? styles.stMissing : ''}`}>
            Thiếu {summary.missing}
          </span>
          <span className={`${styles.countChip} ${styles.stUnknown}`}>
            Không quan sát được {summary.not_observable}
          </span>
          {summary.not_in_branch > 0 && (
            <span className={`${styles.countChip} ${styles.stSkipped}`}>
              Ngoài nhánh {summary.not_in_branch}
            </span>
          )}
          <span className={`${styles.countChip} ${summary.nfr_fail > 0 ? styles.stMissing : styles.stMatched}`}>
            NFR vi phạm {summary.nfr_fail}/{summary.nfr_fail + summary.nfr_pass}
          </span>
        </div>
      </div>

      {/* Bộ lọc */}
      <div className={styles.toolbar}>
        <div className={styles.filterGroup}>
          {(['all', 'issue', 'matched'] as FilterMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              className={`${styles.filterBtn} ${filter === mode ? styles.filterActive : ''}`}
              onClick={() => setFilter(mode)}
            >
              {mode === 'all' && `Tất cả ${report.steps.length} bước`}
              {mode === 'issue' && `Chỉ bước có vấn đề (${summary.missing + summary.partial})`}
              {mode === 'matched' && `Chỉ bước đã khớp (${summary.matched})`}
            </button>
          ))}
        </div>
        <div className={styles.toolbarRight}>
          <span className={styles.hint}>Bấm vào một dòng để xem dấu vết runtime</span>
          {onRefresh && (
            <button type="button" className={styles.refreshBtn} onClick={onRefresh} disabled={isRefreshing}>
              {isRefreshing ? 'Đang đối chiếu...' : 'Đối chiếu lại theo tài liệu mới nhất'}
            </button>
          )}
        </div>
      </div>

      {/* Không đọc được tài liệu -> nói rõ lý do thay vì hiện bảng rỗng */}
      {doc.error && (
        <div className={styles.docWarning}>
          Không đọc được tài liệu thiết kế: {doc.error} — bảng dưới đây có thể thiếu bước.
        </div>
      )}

      {/* Bảng bước */}
      <table className={styles.table}>
        <thead>
          <tr>
            <th style={{ width: '64px' }}>Bước</th>
            <th>Mô tả trong tài liệu</th>
            <th style={{ width: '210px' }}>Service</th>
            <th style={{ width: '150px' }}>Rule</th>
            <th style={{ width: '170px' }}>Đối chiếu runtime</th>
          </tr>
        </thead>
        <tbody>
          {steps.length === 0 && (
            <tr>
              <td colSpan={5} className={styles.dash}>
                Không có bước nào ở bộ lọc này.
              </td>
            </tr>
          )}
          {steps.map((step) => {
            const isOpen = !!openRows[step.no];
            return (
              <React.Fragment key={step.no}>
                <tr
                  className={`${styles.stepRow} ${isOpen ? styles.stepRowOpen : ''}`}
                  onClick={() => setOpenRows((prev) => ({ ...prev, [step.no]: !prev[step.no] }))}
                >
                  <td className={styles.stepNo}>
                    <span className={styles.caret}>{isOpen ? '▾' : '▸'}</span>
                    {step.no}
                  </td>
                  <td>
                    <div className={styles.stepDesc}>{step.description}</div>
                    {step.branch_only && (
                      <span className={styles.branchOnlyTag}>Yêu cầu riêng của nhánh {branch.code}</span>
                    )}
                  </td>
                  <td className={styles.serviceCell}>{step.service || '—'}</td>
                  <td>
                    <div className={styles.ruleGroup}>
                      {step.rules.length === 0 && <span className={styles.dash}>—</span>}
                      {step.rules.map((rule) => (
                        <span key={rule} className={styles.ruleTag}>{rule}</span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.statusTag} ${STATUS_CLASS[step.status]}`}>
                      {STATUS_LABEL[step.status] || step.status}
                    </span>
                    <span className={styles.evidenceCount}>
                      {step.evidence.length > 0 ? `${step.evidence.length} dấu vết` : 'không có dấu vết'}
                    </span>
                  </td>
                </tr>

                {isOpen && (
                  <tr className={styles.detailRow}>
                    <td colSpan={5}>
                      <div className={styles.detailGrid}>
                        <div>
                          <div className={styles.detailTitle}>Dấu vết cần có (theo ánh xạ tài liệu)</div>
                          <ul className={styles.expectList}>
                            {step.expected.length === 0 && (
                              <li className={styles.dash}>Nhánh này không đi qua bước trên.</li>
                            )}
                            {step.expected.map((exp, idx) => (
                              <li key={idx} className={exp.ok ? styles.expOk : styles.expFail}>
                                <span className={styles.expMark}>{exp.ok ? '✓' : exp.optional ? '○' : '✕'}</span>
                                <span>{exp.description}</span>
                                <span className={styles.expCount}>
                                  thấy {exp.found}/{exp.need}
                                  {exp.optional ? ' · tuỳ chọn' : ''}
                                  {exp.auto ? ' · suy tự động' : ''}
                                </span>
                              </li>
                            ))}
                          </ul>
                          {step.note && <div className={styles.note}>Ghi chú: {step.note}</div>}
                        </div>

                        <div>
                          <div className={styles.detailTitle}>
                            Bằng chứng thu được trong trace {report.trace_id ? `(${report.trace_id.slice(0, 12)}…)` : ''}
                          </div>
                          {step.evidence.length === 0 ? (
                            <div className={styles.noEvidence}>
                              Không có span nào khớp — đây là căn cứ để kết luận bước này không chạy.
                            </div>
                          ) : (
                            <div className={styles.spanList}>
                              {step.evidence.map((span) => (
                                <SpanLine key={span.span_id} span={span} />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>

      {/* NFR */}
      <div className={styles.sectionTitle}>Chỉ tiêu phi chức năng (NFR) đo trên trace này</div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th style={{ width: '140px' }}>Mã</th>
            <th style={{ width: '150px' }}>Metric</th>
            <th style={{ width: '130px' }}>Ngưỡng</th>
            <th style={{ width: '130px' }}>Đo được</th>
            <th>Điểm đo</th>
            <th style={{ width: '110px' }}>Kết quả</th>
          </tr>
        </thead>
        <tbody>
          {report.nfrs.map((nfr) => (
            <tr key={nfr.code}>
              <td className={styles.mono}>{nfr.code}</td>
              <td className={styles.mono}>{nfr.metric}</td>
              <td className={styles.mono}>
                {nfr.operator} {nfr.threshold} {nfr.unit}
              </td>
              <td className={`${styles.mono} ${nfr.status === 'FAIL' ? styles.valueBad : ''}`}>
                {nfr.measured === null ? '—' : `${nfr.measured} ${nfr.unit}`}
              </td>
              <td className={styles.pointCell}>
                {nfr.point}
                {nfr.evidence.length > 0 && (
                  <div className={styles.spanList}>
                    {nfr.evidence.slice(0, 2).map((span) => (
                      <SpanLine key={span.span_id} span={span} />
                    ))}
                  </div>
                )}
              </td>
              <td>
                <span
                  className={`${styles.statusTag} ${
                    nfr.status === 'PASS'
                      ? styles.stMatched
                      : nfr.status === 'FAIL'
                        ? styles.stMissing
                        : styles.stUnknown
                  }`}
                >
                  {nfr.status === 'PASS' ? 'Đạt' : nfr.status === 'FAIL' ? 'Vi phạm' : 'Không có số đo'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Rule */}
      <div className={styles.sectionTitle}>Business rule — bước nào trong trace bảo chứng cho rule</div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th style={{ width: '150px' }}>Mã rule</th>
            <th>Nội dung trong tài liệu</th>
            <th style={{ width: '180px' }}>Bước áp dụng</th>
            <th style={{ width: '170px' }}>Đối chiếu runtime</th>
          </tr>
        </thead>
        <tbody>
          {report.rules.map((rule) => (
            <tr key={rule.code}>
              <td className={styles.mono}>{rule.code}</td>
              <td>
                {rule.condition || rule.action ? (
                  <span>
                    {rule.condition} {rule.action ? `→ ${rule.action}` : ''}
                    {rule.severity ? ` [${rule.severity}]` : ''}
                  </span>
                ) : (
                  <span className={styles.dash}>
                    Rule dùng chung — nội dung nằm ở trang “[COMMON] Miền nghiệp vụ và quy ước”
                  </span>
                )}
              </td>
              <td>
                <div className={styles.ruleGroup}>
                  {rule.steps.map((s) => (
                    <span key={s.no} className={styles.ruleTag}>bước {s.no}</span>
                  ))}
                </div>
              </td>
              <td>
                <span className={`${styles.statusTag} ${STATUS_CLASS[rule.status]}`}>
                  {STATUS_LABEL[rule.status] || rule.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Lời gọi thừa */}
      {report.extra.length > 0 && (
        <>
          <div className={styles.sectionTitle}>
            Lời gọi runtime không khớp bước nào trong tài liệu ({report.extra.length})
          </div>
          <div className={styles.spanList}>
            {report.extra.map((span) => (
              <SpanLine key={span.span_id} span={span} />
            ))}
          </div>
        </>
      )}

      <div className={styles.footNote}>
        Bảng dựng bằng luật tất định (so khớp span theo ánh xạ {report.mapping_source}), không phải
        do mô hình suy đoán. Kết luận của AI ở tab Tổng quan dùng chính bảng này làm dữ kiện.
      </div>
    </div>
  );
};

export default EvidenceMapping;
