import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  fetchFlowAnalysis,
  fetchAnalysisList,
  type FlowAnalysisDetail,
  type AnalysisListItem,
  BASE_URL,
} from '../../services/api';
import styles from './LiveAnalysis.module.css';

interface LiveAnalysisProps {
  initialFlowId?: string;
  onBackToMock?: () => void;
}

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

  // Mount & khi đổi flow: Tự động gọi fetchFlowAnalysis
  useEffect(() => {
    let isMounted = true;

    Promise.all([
      fetchFlowAnalysis(selectedFlowId)
        .then((data) => {
          if (isMounted) {
            setFlowAnalysis(data);
            setError(null);
          }
        })
        .catch((err: any) => {
          if (isMounted) {
            setError(err?.message || 'Đã xảy ra lỗi khi tải dữ liệu từ backend API.');
            setFlowAnalysis(null);
          }
        }),
      fetchAnalysisList()
        .then((list) => {
          if (isMounted) setAvailableFlows(list);
        })
        .catch(() => {
          // Bỏ qua nếu danh sách flow phụ gặp lỗi
        }),
    ]).finally(() => {
      if (isMounted) {
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedFlowId]);

  // Handler đổi flow
  const handleFlowChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFlowId = e.target.value;
    setIsLoading(true);
    setError(null);
    setSelectedFlowId(newFlowId);
  };

  // Handler refresh thủ công
  const handleRefresh = () => {
    setIsRefreshing(true);
    setError(null);

    Promise.all([
      fetchFlowAnalysis(selectedFlowId)
        .then((data) => {
          setFlowAnalysis(data);
        })
        .catch((err: any) => {
          setError(err?.message || 'Đã xảy ra lỗi khi tải dữ liệu từ backend API.');
          setFlowAnalysis(null);
        }),
      fetchAnalysisList()
        .then((list) => {
          setAvailableFlows(list);
        })
        .catch(() => {}),
    ]).finally(() => {
      setIsRefreshing(false);
    });
  };

  // Tách runtime_flow theo từng dòng và phân tích dòng lỗi
  const runtimeFlow = flowAnalysis?.runtime_flow;
  const runtimeLines = React.useMemo(() => {
    if (!runtimeFlow) return [];
    return runtimeFlow
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }, [runtimeFlow]);

  const errorStepsCount = React.useMemo(() => {
    return runtimeLines.filter((line) => line.includes('[LỖI]')).length;
  }, [runtimeLines]);

  // Helper format ngày giờ
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

  // Lấy class tương ứng cho verdict badge
  const getVerdictBadgeClass = (verdict?: string) => {
    const v = (verdict || '').toUpperCase();
    if (v === 'PASS') return styles.verdictPass;
    if (v === 'WARN') return styles.verdictWarn;
    if (v === 'FAIL') return styles.verdictFail;
    return styles.verdictDefault;
  };

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
          {/* Bộ chọn Flow nếu có nhiều flow */}
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
              className={`${styles.verdictBadge} ${getVerdictBadgeClass(
                flowAnalysis.verdict
              )}`}
            >
              {flowAnalysis.verdict === 'PASS' && '✓ '}
              {flowAnalysis.verdict === 'WARN' && '⚠ '}
              {flowAnalysis.verdict === 'FAIL' && '✕ '}
              VERDICT: {flowAnalysis.verdict}
            </span>
          )}

          {flowAnalysis?.analysis_type && (
            <span className={styles.typeBadge}>
              Loại: {flowAnalysis.analysis_type}
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
              Vui lòng đảm bảo dịch vụ backend đang hoạt động tại <code>{BASE_URL}</code> và đã hỗ trợ CORS cho cổng dashboard.
            </div>
            <button
              type="button"
              className={styles.retryBtn}
              onClick={handleRefresh}
            >
              Thử lại ngay
            </button>
          </div>
        </div>
      ) : flowAnalysis ? (
        <div className={styles.contentGrid}>
          {/* Panel 1: Luồng thực thi runtime */}
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div className={styles.panelTitle}>Luồng thực thi runtime</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span className={styles.panelBadge}>
                  {runtimeLines.length} bước gọi
                </span>
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
                        {hasError && (
                          <span className={styles.errorTag}>CẢNH BÁO LỖI</span>
                        )}
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
              <div className={styles.markdownContent}>
                <ReactMarkdown>{flowAnalysis.detail}</ReactMarkdown>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
};

export default LiveAnalysis;
