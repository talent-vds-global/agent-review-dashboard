import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type {
  DbQualityResponse,
  EvidenceReport,
  FlowAnalysisDetail,
  OverviewFlow,
  RunAnalysisResult,
  TraceMetrics,
} from '../../../../services/api';
import type { FlowTab } from '../../useLiveAnalysis';
import { EvidenceMapping } from '../EvidenceMapping';
import { DbQualityPanel } from '../DbQualityPanel';
import { TraceMetricsPanel } from '../TraceMetricsPanel';
import styles from '../../LiveAnalysis.module.css';
import { VERDICT_ICON, VERDICT_LABEL, normalizeVerdict, verdictTone } from '../../verdict';

interface FlowReportProps {
  flow: OverviewFlow | null;
  analysis: FlowAnalysisDetail | null;
  isLoading: boolean;
  error: string | null;

  evidence: EvidenceReport | null;
  evidenceError: string | null;
  isEvidenceLoading: boolean;
  onReloadEvidence: () => void;

  metrics: TraceMetrics | null;
  metricsError: string | null;
  isMetricsLoading: boolean;
  onReloadMetrics: () => void;

  dbQuality: DbQualityResponse | null;
  dbError: string | null;
  isDbLoading: boolean;
  dbFetchedAt: Date | null;
  onReloadDbQuality: () => void;

  activeTab: FlowTab;
  onChangeTab: (tab: FlowTab) => void;

  /** Chạy lại vòng phân tích cho luồng này (lấy trace mới nhất từ Jaeger). */
  onRunAnalysis: () => void;
  isRunning: boolean;
  runError: string | null;
  runResult: RunAnalysisResult | null;
  onDismissRun: () => void;
}

const TRIGGER_LABEL: Record<string, string> = {
  manual: 'thủ công',
  schedule_daily: 'lịch hằng ngày',
  confluence_poll: 'tài liệu đổi (polling)',
  confluence_webhook: 'tài liệu đổi (webhook)',
};

function formatTime(value?: string): string {
  if (!value) return '--:--';
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  return date.toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function verdictClass(verdict?: string): string {
  return verdictTone(verdict, {
    pass: styles.verdictPass,
    retry: styles.verdictWarn,
    escalate: styles.verdictFail,
    none: styles.verdictDefault,
  });
}

/**
 * Báo cáo chi tiết của một luồng nghiệp vụ — mức sâu nhất của portal.
 *
 * Ba tab: số liệu + kết luận của agent, bảng đối chiếu tài liệu ↔ runtime, và chất lượng DB.
 * Tab sơ đồ trace đã bỏ: phần trace giờ chỉ còn ở dạng số liệu trong tab Tổng quan.
 */
export const FlowReport: React.FC<FlowReportProps> = ({
  flow,
  analysis,
  isLoading,
  error,
  evidence,
  evidenceError,
  isEvidenceLoading,
  onReloadEvidence,
  metrics,
  metricsError,
  isMetricsLoading,
  onReloadMetrics,
  dbQuality,
  dbError,
  isDbLoading,
  dbFetchedAt,
  onReloadDbQuality,
  activeTab,
  onChangeTab,
  onRunAnalysis,
  isRunning,
  runError,
  runResult,
  onDismissRun,
}) => {
  const summary = evidence?.summary;
  // Lý do lấy từ bảng đối chiếu đã lưu cùng verdict (không phải bản dựng lại), để khớp verdict
  const reasons = analysis?.evidence?.summary?.verdict_reasons || summary?.verdict_reasons || [];
  const traceId = analysis?.trace_id || evidence?.trace_id || flow?.trace_id || '';

  const tabs: { id: FlowTab; label: string; badge?: string; danger?: boolean }[] = [
    {
      id: 'overview',
      label: 'Tổng quan',
      badge: metrics ? `${metrics.span_count} span` : undefined,
      danger: !!metrics && metrics.error_count > 0,
    },
    {
      id: 'evidence',
      label: 'Đối chiếu tài liệu',
      badge: summary ? `${summary.matched}/${summary.total_steps}` : undefined,
      // Cùng tiêu chí với RETRY: bước thiếu/thiếu một phần, NFR vi phạm, lời gọi lỗi
      danger:
        !!summary &&
        (summary.missing > 0 ||
          summary.partial > 0 ||
          summary.nfr_fail > 0 ||
          (summary.error_calls ?? 0) > 0),
    },
    { id: 'db', label: 'Chất lượng DB' },
  ];

  return (
    <>
      {/* Thanh thông tin của luồng đang mở */}
      <div className={styles.subHeader}>
        <div className={styles.metaLeft}>
          <span className={styles.flowTag}>
            {flow?.flow_id || analysis?.flow_id} · {flow?.title || evidence?.doc?.title || ''}
          </span>

          {analysis && (
            <span className={`${styles.verdictBadge} ${verdictClass(analysis.verdict)}`}>
              {VERDICT_ICON[normalizeVerdict(analysis.verdict)]}{' '}
              {VERDICT_LABEL[normalizeVerdict(analysis.verdict)]} ({analysis.verdict})
            </span>
          )}

          {evidence?.branch?.label && (
            <span className={styles.typeBadge} title="Nhánh nghiệp vụ mà trace này đi vào">
              Nhánh: {evidence.branch.label}
            </span>
          )}

          {traceId && (
            <span className={styles.typeBadge} title={traceId}>
              Trace: {traceId.slice(0, 16)}…
            </span>
          )}

          {analysis?.triggered_by && (
            <span className={styles.typeBadge} title="Nguồn đã kích hoạt lần phân tích này">
              Kích hoạt: {TRIGGER_LABEL[analysis.triggered_by] || analysis.triggered_by}
            </span>
          )}

          {analysis?.spec_version != null && (
            <span className={styles.typeBadge} title="Phiên bản trang Confluence đã dùng để đối chiếu">
              Tài liệu: v{analysis.spec_version}
            </span>
          )}
        </div>

        <div className={styles.metaRight}>
          <button
            type="button"
            className={styles.runBtn}
            onClick={onRunAnalysis}
            disabled={isRunning}
            title="Lấy trace mới nhất của luồng này từ Jaeger rồi chạy lại đối chiếu + agent (POST /runtime)"
          >
            <span>{isRunning ? '⏳' : '▶'}</span>
            <span>{isRunning ? 'Đang phân tích...' : 'Lấy trace mới & phân tích'}</span>
          </button>

          <div className={styles.timePill}>
            <span>🕒 Phân tích lúc:</span>
            <span>{formatTime(analysis?.created_at || flow?.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Kết quả của lần chạy vừa xong — hiện một dòng, tự mất khi đổi luồng */}
      {(isRunning || runError || runResult) && (
        <div
          className={`${styles.runBanner} ${
            runError ? styles.runBannerError : runResult ? styles.runBannerDone : ''
          }`}
        >
          {isRunning ? (
            <span>
              Đang lấy trace mới nhất của {flow?.flow_id || analysis?.flow_id} rồi đối chiếu tài
              liệu và gọi agent — bước này mất vài chục giây.
            </span>
          ) : runError ? (
            <span>{runError}</span>
          ) : runResult ? (
            <span>
              Đã phân tích xong trên trace{' '}
              <code>{(runResult.trace_id || '').slice(0, 16) || '—'}…</code> — verdict{' '}
              <b>{VERDICT_LABEL[normalizeVerdict(runResult.verdict)]}</b>
              {runResult.detection?.reason ? ` · ${runResult.detection.reason}` : ''}
            </span>
          ) : null}

          {!isRunning && (
            <button type="button" className={styles.runBannerClose} onClick={onDismissRun}>
              ✕
            </button>
          )}
        </div>
      )}

      {!isLoading && !error && analysis && (
        <div className={styles.tabBar} role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => onChangeTab(tab.id)}
            >
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`${styles.tabBadge} ${tab.danger ? styles.tabBadgeDanger : ''}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className={styles.stateContainer}>
          <div className={styles.loadingSpinner} />
          <div className={styles.loadingText}>Đang tải báo cáo của luồng…</div>
        </div>
      ) : error ? (
        <div className={styles.stateContainer}>
          <div className={styles.errorCard}>
            <div className={styles.errorTitle}>
              <span>⚠</span> Chưa có báo cáo cho luồng này
            </div>
            <div className={styles.errorMessage}>{error}</div>
            <div className={styles.errorHelp}>
              Luồng đã khai báo trong <code>mapping/flow-map.yaml</code> nhưng chưa từng được
              phân tích. Bấm nút dưới đây để lấy trace mới nhất của luồng từ Jaeger và sinh kết quả
              đầu tiên — không cần gọi <code>POST /runtime</code> bằng tay.
            </div>
            <button
              type="button"
              className={styles.retryBtn}
              onClick={onRunAnalysis}
              disabled={isRunning}
            >
              {isRunning ? 'Đang phân tích...' : 'Lấy trace mới & phân tích luồng này'}
            </button>
          </div>
        </div>
      ) : analysis ? (
        <>
          {activeTab === 'overview' && (
            <div className={styles.contentGrid}>
              <section className={styles.panel}>
                <div className={styles.panelHeader}>
                  <div className={styles.panelTitle}>Kết luận phân tích</div>
                  <span className={styles.panelBadge}>AI Agent Audit</span>
                </div>

                <div className={styles.panelBody}>
                  {reasons.length > 0 && (
                    <div className={`${styles.reasonBox} ${verdictClass(analysis.verdict)}`}>
                      <div className={styles.reasonTitle}>
                        {normalizeVerdict(analysis.verdict) === 'RETRY'
                          ? 'Vi phạm cần sửa'
                          : 'Lý do chuyển người xử lý'}
                      </div>
                      <ul className={styles.reasonList}>
                        {reasons.map((reason) => (
                          <li key={reason}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {summary && (
                    <div className={styles.groundingNote}>
                      Kết luận dưới đây dựa trên bảng đối chiếu tất định: {summary.matched} bước
                      khớp, {summary.partial} khớp một phần, {summary.missing} bước thiếu,{' '}
                      {summary.nfr_fail} NFR vi phạm.{' '}
                      <button
                        type="button"
                        className={styles.inlineLink}
                        onClick={() => onChangeTab('evidence')}
                      >
                        Xem bằng chứng từng bước →
                      </button>
                    </div>
                  )}
                  <div className={styles.markdownContent}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysis.detail}</ReactMarkdown>
                  </div>
                </div>
              </section>

              <TraceMetricsPanel
                data={metrics}
                nfrs={evidence?.nfrs || []}
                traceId={traceId}
                isLoading={isMetricsLoading}
                error={metricsError}
                onRefresh={onReloadMetrics}
                errorCalls={analysis.evidence?.summary?.error_calls}
                onOpenEvidence={() => onChangeTab('evidence')}
              />
            </div>
          )}

          {activeTab === 'evidence' && (
            <div className={styles.tabPane}>
              <EvidenceMapping
                report={evidence}
                onRefresh={onReloadEvidence}
                isRefreshing={isEvidenceLoading}
                error={evidenceError}
              />
            </div>
          )}

          {activeTab === 'db' && (
            <div className={styles.tabPane}>
              <DbQualityPanel
                data={dbQuality}
                isLoading={isDbLoading}
                error={dbError}
                fetchedAt={dbFetchedAt}
                onRefresh={onReloadDbQuality}
              />
            </div>
          )}
        </>
      ) : null}
    </>
  );
};

export default FlowReport;
