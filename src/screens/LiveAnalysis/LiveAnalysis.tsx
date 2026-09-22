import React, { useCallback, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  fetchFlowAnalysis,
  fetchAnalysisList,
  fetchFlowEvidence,
  fetchTraceTimeline,
  fetchDbQuality,
  type FlowAnalysisDetail,
  type AnalysisListItem,
  type EvidenceReport,
  type TraceTimelineData,
  type DbQualityResponse,
  BASE_URL,
} from '../../services/api';
import { EvidenceMapping } from './components/EvidenceMapping';
import { TraceTimeline } from './components/TraceTimeline';
import { DbQualityPanel } from './components/DbQualityPanel';
import styles from './LiveAnalysis.module.css';

interface LiveAnalysisProps {
  initialFlowId?: string;
  onBackToMock?: () => void;
}

type TabId = 'overview' | 'evidence' | 'trace' | 'db';

export const LiveAnalysis: React.FC<LiveAnalysisProps> = ({
  initialFlowId = 'F1',
  onBackToMock,
}) => {
  const [selectedFlowId, setSelectedFlowId] = useState<string>(initialFlowId);
  const [flowAnalysis, setFlowAnalysis] = useState<FlowAnalysisDetail | null>(null);
  const [availableFlows, setAvailableFlows] = useState<AnalysisListItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<TabId>('overview');

  // Bảng đối chiếu: mặc định lấy bản đã lưu cùng verdict, có thể dựng lại tại chỗ
  const [liveEvidence, setLiveEvidence] = useState<EvidenceReport | null>(null);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);
  const [isEvidenceLoading, setIsEvidenceLoading] = useState(false);

  // Sơ đồ trace + số liệu DB: đọc tại thời điểm người dùng mở tab
  const [timeline, setTimeline] = useState<TraceTimelineData | null>(null);
  const [timelineError, setTimelineError] = useState<string | null>(null);
  const [isTimelineLoading, setIsTimelineLoading] = useState(false);

  const [dbQuality, setDbQuality] = useState<DbQualityResponse | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  const [isDbLoading, setIsDbLoading] = useState(false);
  const [dbFetchedAt, setDbFetchedAt] = useState<Date | null>(null);

  const traceId = flowAnalysis?.trace_id || liveEvidence?.trace_id || '';
  const evidence = liveEvidence || flowAnalysis?.evidence || null;

  const loadAnalysis = useCallback(
    (flowId: string) => {
      return Promise.all([
        fetchFlowAnalysis(flowId)
          .then((data) => {
            setFlowAnalysis(data);
            setError(null);
          })
          .catch((err: unknown) => {
            setError(
              (err as Error)?.message || 'Đã xảy ra lỗi khi tải dữ liệu từ backend API.'
            );
            setFlowAnalysis(null);
          }),
        fetchAnalysisList()
          .then(setAvailableFlows)
          .catch(() => {
            // Bỏ qua nếu danh sách flow phụ gặp lỗi
          }),
      ]);
    },
    []
  );

  // Mount & khi đổi flow: tải lại toàn bộ, xoá dữ liệu tab phụ của flow cũ
  useEffect(() => {
    let isMounted = true;
    setLiveEvidence(null);
    setEvidenceError(null);
    setTimeline(null);
    setTimelineError(null);
    setDbQuality(null);
    setDbError(null);

    loadAnalysis(selectedFlowId).finally(() => {
      if (isMounted) setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [selectedFlowId, loadAnalysis]);

  // Bản ghi mới trỏ sang trace khác -> bỏ sơ đồ và số liệu DB của trace cũ
  useEffect(() => {
    setTimeline(null);
    setTimelineError(null);
    setDbQuality(null);
    setDbError(null);
  }, [traceId]);

  const handleFlowChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setIsLoading(true);
    setError(null);
    setSelectedFlowId(e.target.value);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setError(null);
    loadAnalysis(selectedFlowId).finally(() => setIsRefreshing(false));
  };

  // --- Tab: đối chiếu lại tài liệu ngay tại thời điểm xem ---
  const reloadEvidence = useCallback(() => {
    setIsEvidenceLoading(true);
    setEvidenceError(null);
    fetchFlowEvidence(selectedFlowId, traceId || undefined)
      .then(setLiveEvidence)
      .catch((err: unknown) =>
        setEvidenceError((err as Error)?.message || 'Không dựng được bảng đối chiếu.')
      )
      .finally(() => setIsEvidenceLoading(false));
  }, [selectedFlowId, traceId]);

  // --- Tab: sơ đồ trace ---
  const loadTimeline = useCallback(() => {
    if (!traceId) {
      setTimelineError(
        'Kết quả phân tích này chưa gắn trace_id. Chạy lại POST /runtime để bản ghi mới lưu kèm trace.'
      );
      return;
    }
    setIsTimelineLoading(true);
    setTimelineError(null);
    fetchTraceTimeline(traceId)
      .then(setTimeline)
      .catch((err: unknown) =>
        setTimelineError((err as Error)?.message || 'Không tải được sơ đồ trace.')
      )
      .finally(() => setIsTimelineLoading(false));
  }, [traceId]);

  useEffect(() => {
    if (activeTab === 'trace' && !timeline && !isTimelineLoading && !timelineError) {
      loadTimeline();
    }
  }, [activeTab, timeline, isTimelineLoading, timelineError, loadTimeline]);

  // --- Tab: chất lượng DB (đọc tại thời điểm xem, không lưu) ---
  const loadDbQuality = useCallback(() => {
    setIsDbLoading(true);
    setDbError(null);
    const services = (timeline?.services || [])
      .filter((s) => s.db_calls > 0)
      .map((s) => s.name);
    fetchDbQuality(services)
      .then((data) => {
        setDbQuality(data);
        setDbFetchedAt(new Date());
      })
      .catch((err: unknown) =>
        setDbError((err as Error)?.message || 'Không đọc được số liệu database.')
      )
      .finally(() => setIsDbLoading(false));
  }, [timeline]);

  useEffect(() => {
    if (activeTab === 'db' && !dbQuality && !isDbLoading && !dbError) {
      loadDbQuality();
    }
  }, [activeTab, dbQuality, isDbLoading, dbError, loadDbQuality]);

  // Tách runtime_flow theo từng dòng và phân tích dòng lỗi
  const runtimeFlow = flowAnalysis?.runtime_flow;
  const runtimeLines = React.useMemo(() => {
    if (!runtimeFlow) return [];
    return runtimeFlow
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }, [runtimeFlow]);

  const errorStepsCount = React.useMemo(
    () => runtimeLines.filter((line) => line.includes('[LỖI]')).length,
    [runtimeLines]
  );

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '--:--';
    try {
      const date = new Date(timeStr);
      if (isNaN(date.getTime())) return timeStr;
      return date.toLocaleString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return timeStr;
    }
  };

  const getVerdictBadgeClass = (verdict?: string) => {
    const v = (verdict || '').toUpperCase();
    if (v === 'PASS') return styles.verdictPass;
    if (v === 'WARN') return styles.verdictWarn;
    if (v === 'FAIL') return styles.verdictFail;
    return styles.verdictDefault;
  };

  const summary = evidence?.summary;
  const tabs: { id: TabId; label: string; badge?: string; danger?: boolean }[] = [
    { id: 'overview', label: 'Tổng quan' },
    {
      id: 'evidence',
      label: 'Đối chiếu tài liệu',
      badge: summary ? `${summary.matched}/${summary.total_steps}` : undefined,
      danger: !!summary && (summary.missing > 0 || summary.nfr_fail > 0),
    },
    {
      id: 'trace',
      label: 'Sơ đồ trace',
      badge: timeline ? `${timeline.step_count} bước` : undefined,
    },
    { id: 'db', label: 'Chất lượng DB' },
  ];

  return (
    <div className={styles.liveContainer}>
      {/* Top Header */}
      <header className={styles.mainHeader}>
        <div className={styles.brandNav}>
          <div className={styles.brandLogo}>
            QC PORTAL <span className={styles.accentDot} />
          </div>
          <span className={styles.separator}>/</span>
          <div className={styles.screenTitle}>
            <span>LIVE BACKEND ANALYSIS</span>
            <span className={styles.livePill}>
              <span className={styles.pulseDot} />
              API THẬT: {BASE_URL}
            </span>
          </div>
        </div>

        <div className={styles.headerActions}>
          <div className={styles.flowSelectGroup}>
            <label htmlFor="flow-select" className={styles.flowSelectLabel}>
              Flow:
            </label>
            <select
              id="flow-select"
              value={selectedFlowId}
              onChange={handleFlowChange}
              className={styles.flowSelect}
              title="Chọn Flow cần xem kết quả phân tích"
            >
              <option value="F1">F1 (Default)</option>
              {availableFlows
                .filter((item) => item.flow_id !== 'F1')
                .map((item) => (
                  <option key={item.id || item.flow_id} value={item.flow_id}>
                    {item.flow_id} ({item.verdict})
                  </option>
                ))}
            </select>
          </div>

          <button
            type="button"
            className={styles.refreshBtn}
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
            title="Làm mới dữ liệu từ backend"
          >
            <span>{isRefreshing ? '⏳' : '⟳'}</span>
            <span>{isRefreshing ? 'Đang tải...' : 'Làm mới'}</span>
          </button>

          {onBackToMock && (
            <button
              type="button"
              className={styles.backBtn}
              onClick={onBackToMock}
              title="Trở về màn hình Mock Data Dashboard"
            >
              <span>←</span>
              <span>Mock Dashboard</span>
            </button>
          )}
        </div>
      </header>

      {/* Sub-header / Meta Information Bar */}
      <div className={styles.subHeader}>
        <div className={styles.metaLeft}>
          <span className={styles.flowTag}>FLOW: {flowAnalysis?.flow_id || selectedFlowId}</span>

          {flowAnalysis && (
            <span
              className={`${styles.verdictBadge} ${getVerdictBadgeClass(flowAnalysis.verdict)}`}
            >
              {flowAnalysis.verdict === 'PASS' && '✓ '}
              {flowAnalysis.verdict === 'WARN' && '⚠ '}
              {flowAnalysis.verdict === 'FAIL' && '✕ '}
              VERDICT: {flowAnalysis.verdict}
            </span>
          )}

          {flowAnalysis?.analysis_type && (
            <span className={styles.typeBadge}>Loại: {flowAnalysis.analysis_type}</span>
          )}

          {traceId && (
            <span className={styles.typeBadge} title={traceId}>
              Trace: {traceId.slice(0, 16)}…
            </span>
          )}
        </div>

        <div className={styles.metaRight}>
          <div className={styles.timePill}>
            <span>🕒 Thời gian:</span>
            <span>{formatTime(flowAnalysis?.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Thanh tab của báo cáo chi tiết */}
      {!isLoading && !error && flowAnalysis && (
        <div className={styles.tabBar} role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
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

      {/* Main Content View */}
      {isLoading ? (
        <div className={styles.stateContainer}>
          <div className={styles.loadingSpinner} />
          <div className={styles.loadingText}>Đang tải dữ liệu từ backend API...</div>
          <div className={styles.loadingSubtext}>
            Đang gọi endpoint: {BASE_URL}/api/flows/{selectedFlowId}/analysis
          </div>
        </div>
      ) : error ? (
        <div className={styles.stateContainer}>
          <div className={styles.errorCard}>
            <div className={styles.errorTitle}>
              <span>⚠</span> Lỗi kết nối Backend API
            </div>
            <div className={styles.errorMessage}>{error}</div>
            <div className={styles.errorHelp}>
              Vui lòng đảm bảo dịch vụ backend đang hoạt động tại <code>{BASE_URL}</code> và đã hỗ
              trợ CORS cho cổng dashboard.
            </div>
            <button type="button" className={styles.retryBtn} onClick={handleRefresh}>
              Thử lại ngay
            </button>
          </div>
        </div>
      ) : flowAnalysis ? (
        <>
          {activeTab === 'overview' && (
            <div className={styles.contentGrid}>
              {/* Panel 1: Luồng thực thi runtime */}
              <section className={styles.panel}>
                <div className={styles.panelHeader}>
                  <div className={styles.panelTitle}>Luồng thực thi runtime</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span className={styles.panelBadge}>{runtimeLines.length} bước gọi</span>
                    {errorStepsCount > 0 && (
                      <span className={`${styles.panelBadge} ${styles.panelBadgeError}`}>
                        {errorStepsCount} bước lỗi [LỖI]
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.panelBody}>
                  <div className={styles.flowStreamList}>
                    {runtimeLines.map((line, index) => {
                      const hasError = line.includes('[LỖI]');
                      return (
                        <div
                          key={index}
                          className={`${styles.flowStepRow} ${
                            hasError ? styles.flowStepRowError : ''
                          }`}
                        >
                          <span className={styles.stepIndex}>
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <span className={styles.stepContent}>
                            {line}
                            {hasError && <span className={styles.errorTag}>CẢNH BÁO LỖI</span>}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>

              {/* Panel 2: Kết luận phân tích (Markdown) */}
              <section className={styles.panel}>
                <div className={styles.panelHeader}>
                  <div className={styles.panelTitle}>Kết luận phân tích</div>
                  <span className={styles.panelBadge}>AI Agent Audit</span>
                </div>

                <div className={styles.panelBody}>
                  {summary && (
                    <div className={styles.groundingNote}>
                      Kết luận dưới đây dựa trên bảng đối chiếu tất định: {summary.matched} bước
                      khớp, {summary.missing} bước thiếu, {summary.nfr_fail} NFR vi phạm.{' '}
                      <button
                        type="button"
                        className={styles.inlineLink}
                        onClick={() => setActiveTab('evidence')}
                      >
                        Xem bằng chứng từng bước →
                      </button>
                    </div>
                  )}
                  <div className={styles.markdownContent}>
                    <ReactMarkdown>{flowAnalysis.detail}</ReactMarkdown>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'evidence' && (
            <div className={styles.tabPane}>
              <EvidenceMapping
                report={evidence}
                onRefresh={reloadEvidence}
                isRefreshing={isEvidenceLoading}
                error={evidenceError}
              />
            </div>
          )}

          {activeTab === 'trace' && (
            <div className={styles.tabPane}>
              <TraceTimeline
                data={timeline}
                isLoading={isTimelineLoading}
                error={timelineError}
                onRefresh={loadTimeline}
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
                onRefresh={loadDbQuality}
              />
            </div>
          )}
        </>
      ) : null}
    </div>
  );
};

export default LiveAnalysis;
