import React from 'react';
import { BASE_URL } from '../../services/api';
import { useLiveAnalysis } from './useLiveAnalysis';
import { SystemOverview } from './components/SystemOverview';
import { ServiceDetail } from './components/ServiceDetail';
import { FlowReport } from './components/FlowReport';
import styles from './LiveAnalysis.module.css';

interface LiveAnalysisProps {
  initialFlowId?: string;
  onBackToMock?: () => void;
}

/**
 * Portal dữ liệu thật, ba mức:
 *
 *   Tổng quan hệ thống  →  một service  →  báo cáo chi tiết một luồng nghiệp vụ
 *
 * Mức ngoài cùng trả lời "hệ thống có đạt không và đang bắt được lỗi gì"; càng đi sâu càng
 * nhiều bằng chứng. Phần vẽ lại trace đã bỏ — trace giờ chỉ còn ở dạng số liệu trong báo cáo.
 */
export const LiveAnalysis: React.FC<LiveAnalysisProps> = ({ initialFlowId, onBackToMock }) => {
  const portal = useLiveAnalysis(initialFlowId);
  const {
    view,
    overview,
    isOverviewLoading,
    overviewError,
    isRefreshing,
    reloadOverview,
    selectedService,
    selectedFlow,
    serviceFlows,
    openOverview,
    openService,
    openFlow,
    openIssue,
  } = portal;

  const flowTitle = selectedFlow
    ? `${selectedFlow.flow_id} · ${selectedFlow.title || ''}`.trim()
    : '';

  return (
    <div className={styles.liveContainer}>
      <header className={styles.mainHeader}>
        <div className={styles.brandNav}>
          <div className={styles.brandLogo}>
            QC PORTAL <span className={styles.accentDot} />
          </div>
          <span className={styles.separator}>/</span>

          {/* Breadcrumb ba mức */}
          <nav className={styles.breadcrumb} aria-label="Đường dẫn">
            <button
              type="button"
              className={`${styles.crumb} ${view === 'overview' ? styles.crumbActive : ''}`}
              onClick={openOverview}
            >
              Tổng quan hệ thống
            </button>

            {selectedService && view !== 'overview' && (
              <>
                <span className={styles.crumbSep}>›</span>
                <button
                  type="button"
                  className={`${styles.crumb} ${view === 'service' ? styles.crumbActive : ''}`}
                  onClick={() => openService(selectedService.name)}
                >
                  {selectedService.name}
                </button>
              </>
            )}

            {view === 'flow' && selectedFlow && (
              <>
                <span className={styles.crumbSep}>›</span>
                <span className={`${styles.crumb} ${styles.crumbActive}`}>{flowTitle}</span>
              </>
            )}
          </nav>
        </div>

        <div className={styles.headerActions}>
          <span className={styles.livePill} title="Mọi số liệu trên màn hình lấy từ backend này">
            <span className={styles.pulseDot} />
            API THẬT: {BASE_URL}
          </span>

          <button
            type="button"
            className={styles.refreshBtn}
            onClick={reloadOverview}
            disabled={isOverviewLoading || isRefreshing}
            title="Đọc lại toàn bộ số liệu từ backend"
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

      {isOverviewLoading ? (
        <div className={styles.stateContainer}>
          <div className={styles.loadingSpinner} />
          <div className={styles.loadingText}>Đang tổng hợp chất lượng hệ thống...</div>
          <div className={styles.loadingSubtext}>
            Đang gọi endpoint: {BASE_URL}/api/overview
          </div>
        </div>
      ) : overviewError ? (
        <div className={styles.stateContainer}>
          <div className={styles.errorCard}>
            <div className={styles.errorTitle}>
              <span>⚠</span> Lỗi kết nối Backend API
            </div>
            <div className={styles.errorMessage}>{overviewError}</div>
            <div className={styles.errorHelp}>
              Vui lòng đảm bảo dịch vụ backend đang hoạt động tại <code>{BASE_URL}</code> và đã hỗ
              trợ CORS cho cổng dashboard.
            </div>
            <button type="button" className={styles.retryBtn} onClick={reloadOverview}>
              Thử lại ngay
            </button>
          </div>
        </div>
      ) : !overview ? null : view === 'overview' ? (
        <SystemOverview data={overview} onOpenService={openService} onOpenIssue={openIssue} />
      ) : view === 'service' && selectedService ? (
        <ServiceDetail
          service={selectedService}
          flows={serviceFlows}
          onOpenFlow={(flowId) => openFlow(flowId)}
          onOpenIssue={openIssue}
        />
      ) : (
        <FlowReport
          flow={selectedFlow}
          analysis={portal.flowAnalysis}
          isLoading={portal.isFlowLoading}
          error={portal.flowError}
          evidence={portal.evidence}
          evidenceError={portal.evidenceError}
          isEvidenceLoading={portal.isEvidenceLoading}
          onReloadEvidence={portal.reloadEvidence}
          metrics={portal.metrics}
          metricsError={portal.metricsError}
          isMetricsLoading={portal.isMetricsLoading}
          onReloadMetrics={portal.reloadMetrics}
          dbQuality={portal.dbQuality}
          dbError={portal.dbError}
          isDbLoading={portal.isDbLoading}
          dbFetchedAt={portal.dbFetchedAt}
          onReloadDbQuality={portal.reloadDbQuality}
          activeTab={portal.activeTab}
          onChangeTab={portal.setActiveTab}
          onRunAnalysis={() => portal.runAnalysis()}
          isRunning={portal.runningFlowId !== null}
          runError={portal.runError}
          runResult={portal.runResult}
          onDismissRun={portal.dismissRunResult}
        />
      )}
    </div>
  );
};

export default LiveAnalysis;
