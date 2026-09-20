import React from 'react';
import type { Flow, RoleType } from '../../../../data/mock';
import styles from './EvidencePanel.module.css';

interface EvidencePanelProps {
  currentRole: RoleType;
  flow: Flow;
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({ currentRole, flow }) => {
  const { evidence, stats } = flow;

  const roleTitleMap: Record<RoleType, string> = {
    developer: 'DEVELOPER · TRACING & DATABASE RUNTIME',
    leader: 'DEVELOPER LEADER · ĐỐI CHIẾU SRS ↔ CODE & PHẠM VI ẢNH HƯỞNG',
    operator: 'OPERATOR · SỨC KHOẺ DỊCH VỤ, ERROR BUDGET & SỰ CỐ',
    tester: 'TESTER · ĐỘ PHỦ THỰC THI & TEST GAP RUNTIME',
  };

  return (
    <div className={styles.evidenceContainer}>
      <div className={styles.panelHeader}>
        <div className={styles.panelTitleGroup}>
          <h3 className={styles.panelTitle}>BẰNG CHỨNG THỰC THI</h3>
          <span className={styles.rolePerspectiveBadge}>{roleTitleMap[currentRole]}</span>
        </div>
        <span className={styles.mockWatermark}>Nguồn: Tracing Runtime · ví dụ minh hoạ</span>
      </div>

      <div className={styles.panelContent}>
        {/* ===================== DEVELOPER VIEW ===================== */}
        {currentRole === 'developer' && (
          <>
            {/* 1. Tracing spans */}
            <div className={styles.subSection}>
              <div className={styles.sectionHeader}>
                <h4 className={styles.sectionTitle}>Tracing theo luồng</h4>
                <div className={styles.timelineLegend}>
                  <div className={styles.legendItem}>
                    <span className={`${styles.legendBox} ${styles.normal}`} />
                    <span>Bình thường</span>
                  </div>
                  <div className={styles.legendItem}>
                    <span className={`${styles.legendBox} ${styles.bottleneck}`} />
                    <span>Nghẽn (Bottleneck)</span>
                  </div>
                  <div className={styles.legendItem}>
                    <span className={`${styles.legendBox} ${styles.antipattern}`} />
                    <span>Anti-pattern</span>
                  </div>
                </div>
              </div>

              <div className={styles.spansContainer}>
                {evidence.developer.tracingSpans.map((span) => {
                  const maxDuration = Math.max(stats.totalDurationMs, 360);
                  const barWidthPct = Math.max(
                    6,
                    Math.min(100, Math.round((span.durationMs / maxDuration) * 100))
                  );
                  const indentPx = span.indentLevel * 24;

                  return (
                    <div
                      key={span.id}
                      className={`${styles.spanRow} ${styles[span.status]}`}
                      style={{ marginLeft: `${indentPx}px` }}
                    >
                      <div className={styles.spanMeta}>
                        <div className={styles.spanLeft}>
                          <span className={styles.spanServiceBadge}>{span.service}</span>
                          <span className={styles.spanOperation}>{span.operation}</span>
                        </div>
                        <span className={styles.spanDuration}>{span.durationMs}ms</span>
                      </div>

                      <div className={styles.spanBarTrack}>
                        <div
                          className={`${styles.spanBarFill} ${styles[span.status]}`}
                          style={{ width: `${barWidthPct}%` }}
                        />
                      </div>

                      {span.details && <div className={styles.spanDetails}>{span.details}</div>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Database quality */}
            <div className={styles.subSection}>
              <div className={styles.sectionHeader}>
                <h4 className={styles.sectionTitle}>Database Quality</h4>
                <span className={styles.mockWatermark}>
                  {evidence.developer.databaseQuality.length} câu truy vấn ghi nhận
                </span>
              </div>

              <div className={styles.tableWrapper}>
                <table className={styles.modernTable}>
                  <thead>
                    <tr>
                      <th style={{ width: '50%' }}>Query Database</th>
                      <th style={{ width: '10%' }}>Gọi</th>
                      <th style={{ width: '12%' }}>Ms</th>
                      <th style={{ width: '28%' }}>Cờ Kiểm Toán (Flags)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evidence.developer.databaseQuality.map((db) => (
                      <tr key={db.id}>
                        <td>
                          <div className={styles.querySnippet}>{db.query}</div>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                          {db.calls}x
                        </td>
                        <td
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700,
                            color: db.durationMs > 100 ? 'var(--accent-red)' : 'inherit',
                          }}
                        >
                          {db.durationMs}ms
                        </td>
                        <td>
                          <div className={styles.tagGroup}>
                            {db.flags.map((flag, idx) => (
                              <span
                                key={idx}
                                className={`${styles.badgeTag} ${
                                  flag.includes('ANTI_PATTERN') ||
                                  flag.includes('EXHAUSTED') ||
                                  flag.includes('HIGH_LATENCY')
                                    ? styles.alert
                                    : styles.success
                                }`}
                              >
                                {flag}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ===================== DEVELOPER LEADER VIEW ===================== */}
        {currentRole === 'leader' && (
          <>
            {/* 1. SRS mapping */}
            <div className={styles.subSection}>
              <div className={styles.sectionHeader}>
                <h4 className={styles.sectionTitle}>Đối chiếu SRS ↔ Code ↔ Tracing</h4>
                <span className={styles.mockWatermark}>Kiểm toán quy chuẩn kiến trúc</span>
              </div>

              <div className={styles.tableWrapper}>
                <table className={styles.modernTable}>
                  <thead>
                    <tr>
                      <th style={{ width: '15%' }}>Mã Rule SRS</th>
                      <th style={{ width: '40%' }}>Nội dung nghiệp vụ SRS</th>
                      <th style={{ width: '25%' }}>Service & Code Ánh xạ</th>
                      <th style={{ width: '20%' }}>Trạng thái Khớp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evidence.leader.srsMapping.map((rule, idx) => (
                      <tr key={idx}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                          {rule.ruleCode}
                        </td>
                        <td style={{ fontWeight: 600 }}>{rule.ruleDescription}</td>
                        <td>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                            <strong style={{ display: 'block', marginBottom: '2px' }}>
                              {rule.mappedService}
                            </strong>
                            <span style={{ color: 'var(--text-secondary)' }}>{rule.codeRef}</span>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`${styles.badgeTag} ${
                              rule.isMatch ? styles.success : styles.alert
                            }`}
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                          >
                            {rule.isMatch ? '✓ Khớp hoàn toàn' : '✕ ' + rule.matchStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. Change Impact */}
            <div className={styles.subSection}>
              <div className={styles.sectionHeader}>
                <h4 className={styles.sectionTitle}>Ảnh hưởng khi thay đổi</h4>
                <span className={styles.mockWatermark}>Ma trận phụ thuộc downstream</span>
              </div>

              <div className={styles.tableWrapper}>
                <table className={styles.modernTable}>
                  <thead>
                    <tr>
                      <th style={{ width: '25%' }}>Service bị ảnh hưởng</th>
                      <th style={{ width: '15%' }}>Mức rủi ro</th>
                      <th style={{ width: '35%' }}>Mô tả tác động kỹ thuật</th>
                      <th style={{ width: '25%' }}>Endpoints / Queue liên đới</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evidence.leader.changeImpact.map((impact, idx) => (
                      <tr key={idx}>
                        <td>
                          <span className={styles.spanServiceBadge}>{impact.service}</span>
                        </td>
                        <td>
                          <span
                            className={`${styles.badgeTag} ${
                              impact.impactLevel === 'Cao' ? styles.alert : styles.success
                            }`}
                            style={{ fontWeight: 800 }}
                          >
                            Mức {impact.impactLevel}
                          </span>
                        </td>
                        <td style={{ fontSize: '12px', lineHeight: '1.5' }}>{impact.riskNote}</td>
                        <td>
                          <div className={styles.tagGroup}>
                            {impact.affectedEndpoints.map((ep, eIdx) => (
                              <span key={eIdx} className={styles.badgeTag}>
                                {ep}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ===================== OPERATOR VIEW ===================== */}
        {currentRole === 'operator' && (
          <>
            {/* 1. Service Health */}
            <div className={styles.subSection}>
              <div className={styles.sectionHeader}>
                <h4 className={styles.sectionTitle}>Sức khoẻ service trong luồng</h4>
                <span className={styles.mockWatermark}>Real-time telemetry</span>
              </div>

              <div className={styles.tableWrapper}>
                <table className={styles.modernTable}>
                  <thead>
                    <tr>
                      <th>Service</th>
                      <th>Trạng thái</th>
                      <th>Error Rate</th>
                      <th>P95 Latency</th>
                      <th>Throughput</th>
                      <th>RAM Usage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evidence.operator.serviceHealth.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                          {item.serviceName}
                        </td>
                        <td>
                          <span
                            className={`${styles.badgeTag} ${
                              item.status === 'Khoẻ mạnh' ? styles.success : styles.alert
                            }`}
                          >
                            ● {item.status}
                          </span>
                        </td>
                        <td
                          style={{
                            fontFamily: 'var(--font-mono)',
                            color: parseFloat(item.errorRate) > 0.5 ? 'var(--accent-red)' : 'inherit',
                            fontWeight: 700,
                          }}
                        >
                          {item.errorRate}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                          {item.p95}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{item.throughput}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{item.memoryUsage}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. Error budget */}
            <div className={styles.subSection}>
              <div className={styles.sectionHeader}>
                <h4 className={styles.sectionTitle}>Error budget</h4>
                <span className={styles.mockWatermark}>{evidence.operator.errorBudget.window}</span>
              </div>

              <div className={styles.errorBudgetCard}>
                <div className={styles.budgetMetaRow}>
                  <div className={styles.budgetStat}>
                    <span className={styles.budgetLabel}>Cam kết Mục tiêu SLO</span>
                    <span className={styles.budgetValue}>{evidence.operator.errorBudget.slo}</span>
                  </div>
                  <div className={styles.budgetStat}>
                    <span className={styles.budgetLabel}>Ngân sách còn lại</span>
                    <span className={styles.budgetValue} style={{ color: '#059669' }}>
                      {evidence.operator.errorBudget.budgetRemaining}
                    </span>
                  </div>
                  <div className={styles.budgetStat}>
                    <span className={styles.budgetLabel}>Burn Rate Hiện Tại</span>
                    <span className={styles.budgetValue}>
                      {evidence.operator.errorBudget.burnRate}
                    </span>
                  </div>
                  <div className={styles.budgetStat}>
                    <span className={styles.budgetLabel}>Đã sử dụng</span>
                    <span className={styles.budgetValue} style={{ color: 'var(--accent-red)' }}>
                      {evidence.operator.errorBudget.usedPercent}%
                    </span>
                  </div>
                </div>

                <div className={styles.progressContainer}>
                  <div className={styles.progressBarTrack}>
                    <div
                      className={styles.progressBarFill}
                      style={{ width: `${evidence.operator.errorBudget.usedPercent}%` }}
                    />
                  </div>
                  <div className={styles.progressMarkers}>
                    <span>0% (Hoàn hảo)</span>
                    <span>50% (Cảnh báo ngưỡng an toàn)</span>
                    <span>100% (Cạn kiệt ngân sách lỗi)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Incidents */}
            <div className={styles.subSection}>
              <div className={styles.sectionHeader}>
                <h4 className={styles.sectionTitle}>Sự cố trong luồng</h4>
                <span className={styles.mockWatermark}>
                  {evidence.operator.incidents.length} sự cố ghi nhận
                </span>
              </div>

              {evidence.operator.incidents.length === 0 ? (
                <div
                  style={{
                    padding: '24px',
                    background: '#FAFAFA',
                    border: '1px solid var(--border-light)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  ✓ Không có sự cố nào đang mở hoặc phát sinh trong chu kỳ giám sát hiện tại.
                </div>
              ) : (
                <div className={styles.incidentsList}>
                  {evidence.operator.incidents.map((inc) => (
                    <div
                      key={inc.id}
                      className={`${styles.incidentCard} ${styles[inc.severity.toLowerCase()]}`}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <span
                          className={`${styles.sevBadge} ${styles[inc.severity.toLowerCase()]}`}
                        >
                          {inc.severity}
                        </span>
                        <div>
                          <strong style={{ fontSize: '13px', display: 'block' }}>{inc.title}</strong>
                          <span
                            style={{
                              fontSize: '11px',
                              color: 'var(--text-muted)',
                              fontFamily: 'var(--font-mono)',
                            }}
                          >
                            Mã: {inc.id} · Dịch vụ: {inc.service} · Thời gian: {inc.time}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`${styles.badgeTag} ${
                          inc.status === 'Đang mở' ? styles.alert : styles.success
                        }`}
                        style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 700 }}
                      >
                        {inc.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ===================== TESTER VIEW ===================== */}
        {currentRole === 'tester' && (
          <>
            {/* 1. Execution coverage */}
            <div className={styles.subSection}>
              <div className={styles.sectionHeader}>
                <h4 className={styles.sectionTitle}>Độ phủ đường thực thi</h4>
                <span className={styles.mockWatermark}>Runtime path vs Automated test suites</span>
              </div>

              <div className={styles.tableWrapper}>
                <table className={styles.modernTable}>
                  <thead>
                    <tr>
                      <th style={{ width: '45%' }}>Đường thực thi runtime (Execution Path)</th>
                      <th style={{ width: '15%' }}>Runtime Chạy?</th>
                      <th style={{ width: '15%' }}>Test Tự Động?</th>
                      <th style={{ width: '25%' }}>Loại Kiểm Thử (Coverage)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evidence.tester.executionCoverage.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{item.pathName}</td>
                        <td>
                          <span
                            className={styles.badgeTag}
                            style={{
                              background: item.runtimeExecuted ? '#111111' : '#EAEAE6',
                              color: item.runtimeExecuted ? '#FFFFFF' : '#888880',
                            }}
                          >
                            {item.runtimeExecuted ? '✓ Có chạy' : 'Không'}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`${styles.badgeTag} ${
                              item.testStatus === 'Pass'
                                ? styles.success
                                : item.testStatus === 'No Test'
                                ? styles.alert
                                : styles.alert
                            }`}
                            style={{ fontWeight: 700 }}
                          >
                            {item.testStatus === 'Pass'
                              ? '✓ Có (Pass)'
                              : item.testStatus === 'No Test'
                              ? '✕ Chưa có test'
                              : '✕ Fail'}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                          {item.coverageType}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. Test gaps */}
            <div className={styles.subSection}>
              <div className={styles.sectionHeader}>
                <h4 className={styles.sectionTitle}>Test Gap (Runtime không có test)</h4>
                <span className={styles.mockWatermark}>
                  {evidence.tester.testGaps.length} lỗ hổng kiểm thử được phát hiện
                </span>
              </div>

              {evidence.tester.testGaps.length === 0 ? (
                <div
                  style={{
                    padding: '24px',
                    background: '#FAFAFA',
                    border: '1px solid var(--border-light)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  ✓ 0 test gap runtime. Toàn bộ đường thực thi chính đã có bài kiểm thử tự động bao phủ.
                </div>
              ) : (
                <div className={styles.gapsGrid}>
                  {evidence.tester.testGaps.map((gap) => (
                    <div key={gap.gapId} className={styles.gapCard}>
                      <div className={styles.gapHeader}>
                        <span className={styles.gapIdBadge}>MÃ LỖ HỔNG: {gap.gapId}</span>
                        <span
                          className={`${styles.badgeTag} ${styles.alert}`}
                          style={{ padding: '3px 8px', fontWeight: 800 }}
                        >
                          RỦI RO {gap.riskLevel.toUpperCase()}
                        </span>
                      </div>

                      <div className={styles.gapDesc}>{gap.description}</div>

                      <div className={styles.gapActionBox}>
                        <div>
                          <span className={styles.actionHeading}>Kịch bản test đề xuất:</span>
                          <span>{gap.recommendedTestCase}</span>
                        </div>
                        <div style={{ marginTop: '4px' }}>
                          <span className={styles.actionHeading}>Hành động khuyến nghị:</span>
                          <span style={{ color: 'var(--accent-red)', fontWeight: 600 }}>
                            {gap.suggestedAction}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EvidencePanel;
