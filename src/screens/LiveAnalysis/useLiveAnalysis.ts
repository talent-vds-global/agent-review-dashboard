import { useCallback, useEffect, useState } from 'react';
import {
  fetchOverview,
  fetchFlowAnalysis,
  fetchFlowEvidence,
  fetchTraceMetrics,
  fetchDbQuality,
  runFlowAnalysis,
  type SystemOverview,
  type OverviewFlow,
  type OverviewService,
  type OverviewIssue,
  type FlowAnalysisDetail,
  type EvidenceReport,
  type TraceMetrics,
  type DbQualityResponse,
  type RunAnalysisResult,
} from '../../services/api';

/** Ba mức của portal: tổng quan hệ thống → một service → báo cáo chi tiết một luồng. */
export type PortalView = 'overview' | 'service' | 'flow';

/** Tab của màn báo cáo một luồng (đã bỏ tab sơ đồ trace). */
export type FlowTab = 'overview' | 'evidence' | 'db';

export interface UseLiveAnalysisReturn {
  view: PortalView;
  overview: SystemOverview | null;
  isOverviewLoading: boolean;
  overviewError: string | null;
  isRefreshing: boolean;
  reloadOverview: () => void;

  selectedService: OverviewService | null;
  selectedFlow: OverviewFlow | null;
  serviceFlows: OverviewFlow[];

  flowAnalysis: FlowAnalysisDetail | null;
  isFlowLoading: boolean;
  flowError: string | null;

  evidence: EvidenceReport | null;
  evidenceError: string | null;
  isEvidenceLoading: boolean;
  reloadEvidence: () => void;

  metrics: TraceMetrics | null;
  metricsError: string | null;
  isMetricsLoading: boolean;
  reloadMetrics: () => void;

  dbQuality: DbQualityResponse | null;
  dbError: string | null;
  isDbLoading: boolean;
  dbFetchedAt: Date | null;
  reloadDbQuality: () => void;

  /** Chạy lại vòng phân tích cho luồng đang mở (lấy trace mới nhất từ Jaeger). */
  runAnalysis: (flowId?: string) => void;
  runningFlowId: string | null;
  runError: string | null;
  runResult: RunAnalysisResult | null;
  dismissRunResult: () => void;

  activeTab: FlowTab;
  setActiveTab: (tab: FlowTab) => void;

  openOverview: () => void;
  openService: (name: string) => void;
  openFlow: (flowId: string, tab?: FlowTab) => void;
  openIssue: (issue: OverviewIssue) => void;
}

/**
 * Điều phối dữ liệu của portal dữ liệu thật.
 *
 * Màn tổng quan chỉ gọi đúng một endpoint gộp (`/api/overview`); các dữ liệu nặng (báo cáo AI,
 * bảng đối chiếu, số liệu DB) chỉ nạp khi người dùng mở đến đúng luồng và đúng tab.
 */
export function useLiveAnalysis(initialFlowId?: string): UseLiveAnalysisReturn {
  const [overview, setOverview] = useState<SystemOverview | null>(null);
  const [isOverviewLoading, setIsOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [view, setView] = useState<PortalView>(initialFlowId ? 'flow' : 'overview');
  // Tăng lên để buộc nạp lại báo cáo của luồng đang mở sau khi chạy phân tích mới
  const [flowReloadKey, setFlowReloadKey] = useState(0);
  const [serviceName, setServiceName] = useState<string | null>(null);
  const [flowId, setFlowId] = useState<string | null>(initialFlowId || null);
  const [activeTab, setActiveTab] = useState<FlowTab>('overview');

  const [flowAnalysis, setFlowAnalysis] = useState<FlowAnalysisDetail | null>(null);
  const [isFlowLoading, setIsFlowLoading] = useState(false);
  const [flowError, setFlowError] = useState<string | null>(null);

  const [liveEvidence, setLiveEvidence] = useState<EvidenceReport | null>(null);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);
  const [isEvidenceLoading, setIsEvidenceLoading] = useState(false);

  const [metrics, setMetrics] = useState<TraceMetrics | null>(null);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [isMetricsLoading, setIsMetricsLoading] = useState(false);

  const [runningFlowId, setRunningFlowId] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [runResult, setRunResult] = useState<RunAnalysisResult | null>(null);

  const [dbQuality, setDbQuality] = useState<DbQualityResponse | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  const [isDbLoading, setIsDbLoading] = useState(false);
  const [dbFetchedAt, setDbFetchedAt] = useState<Date | null>(null);

  // --- Tổng quan hệ thống ---
  // Nạp hai nhịp: bản không kèm số liệu DB trả về ngay (~0.3s) để màn hình hiện được luôn,
  // rồi bản đầy đủ chèn thêm tiêu chí database — dashboard db-quality của service không chạy
  // thì mỗi lời gọi phải chờ hết timeout, không nên bắt cả màn hình đợi theo.
  const loadOverview = useCallback(() => {
    return fetchOverview(false)
      .then((data) => {
        setOverview(data);
        setOverviewError(null);
        setIsOverviewLoading(false);   // nhịp 1 đã đủ để vẽ màn hình
        return fetchOverview(true)
          .then(setOverview)
          .catch(() => {
            // Giữ nguyên bản không có số liệu DB
          });
      })
      .catch((err: unknown) => {
        setOverviewError(
          (err as Error)?.message || 'Đã xảy ra lỗi khi tải dữ liệu từ backend API.'
        );
        setOverview(null);
      });
  }, []);

  useEffect(() => {
    loadOverview().finally(() => setIsOverviewLoading(false));
  }, [loadOverview]);

  const reloadOverview = useCallback(() => {
    setIsRefreshing(true);
    loadOverview().finally(() => setIsRefreshing(false));
  }, [loadOverview]);

  const selectedFlow =
    (flowId && overview?.flows.find((f) => f.flow_id === flowId)) || null;
  const selectedService =
    (serviceName && overview?.services.find((s) => s.name === serviceName)) || null;
  const serviceFlows = serviceName
    ? (overview?.flows || []).filter((f) => f.services.includes(serviceName))
    : [];

  const traceId = flowAnalysis?.trace_id || liveEvidence?.trace_id || selectedFlow?.trace_id || '';
  const evidence = liveEvidence || flowAnalysis?.evidence || null;

  // --- Báo cáo của một luồng: chỉ nạp khi thực sự mở luồng đó ---
  useEffect(() => {
    if (view !== 'flow' || !flowId) return;
    let alive = true;

    setIsFlowLoading(true);
    setFlowError(null);
    setFlowAnalysis(null);
    setLiveEvidence(null);
    setEvidenceError(null);
    setMetrics(null);
    setMetricsError(null);
    setDbQuality(null);
    setDbError(null);

    fetchFlowAnalysis(flowId)
      .then((data) => {
        if (alive) setFlowAnalysis(data);
      })
      .catch((err: unknown) => {
        if (alive) {
          setFlowError((err as Error)?.message || 'Không tải được báo cáo của luồng này.');
        }
      })
      .finally(() => {
        if (alive) setIsFlowLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [view, flowId, flowReloadKey]);

  // --- Chạy lại vòng phân tích: lấy trace mới nhất của luồng rồi đối chiếu + gọi agent ---
  // Trước đây việc này phải làm bằng `curl -X POST /runtime`; nút trên UI gọi đúng endpoint đó.
  // Lời gọi chậm (có một lần gọi LLM) nên chỉ cho chạy một luồng tại một thời điểm.
  const runAnalysis = useCallback(
    (target?: string) => {
      const id = target || flowId || '';
      if (!id || runningFlowId) return;

      setRunningFlowId(id);
      setRunError(null);
      setRunResult(null);

      runFlowAnalysis(id)
        .then((result) => {
          setRunResult(result);
          // Bản ghi mới đã nằm trong DB: nạp lại cả báo cáo của luồng lẫn số liệu tổng quan
          setFlowReloadKey((key) => key + 1);
          return loadOverview();
        })
        .catch((err: unknown) =>
          setRunError((err as Error)?.message || 'Không chạy được phân tích cho luồng này.')
        )
        .finally(() => setRunningFlowId(null));
    },
    [flowId, runningFlowId, loadOverview]
  );

  const dismissRunResult = useCallback(() => {
    setRunResult(null);
    setRunError(null);
  }, []);

  // --- Số liệu trace: nạp ngay khi biết trace của luồng (tab Tổng quan cần) ---
  const loadMetrics = useCallback(() => {
    if (!traceId) {
      setMetricsError(
        'Kết quả phân tích này chưa gắn trace_id. Chạy lại POST /runtime để bản ghi mới lưu kèm trace.'
      );
      return;
    }
    setIsMetricsLoading(true);
    setMetricsError(null);
    fetchTraceMetrics(traceId)
      .then(setMetrics)
      .catch((err: unknown) =>
        setMetricsError((err as Error)?.message || 'Không đọc được số liệu của trace.')
      )
      .finally(() => setIsMetricsLoading(false));
  }, [traceId]);

  useEffect(() => {
    if (view === 'flow' && traceId && !metrics && !isMetricsLoading && !metricsError) {
      loadMetrics();
    }
  }, [view, traceId, metrics, isMetricsLoading, metricsError, loadMetrics]);

  // --- Bảng đối chiếu: dựng lại tại chỗ khi người dùng bấm làm mới ---
  const reloadEvidence = useCallback(() => {
    if (!flowId) return;
    setIsEvidenceLoading(true);
    setEvidenceError(null);
    fetchFlowEvidence(flowId, traceId || undefined)
      .then(setLiveEvidence)
      .catch((err: unknown) =>
        setEvidenceError((err as Error)?.message || 'Không dựng được bảng đối chiếu.')
      )
      .finally(() => setIsEvidenceLoading(false));
  }, [flowId, traceId]);

  // --- Chất lượng DB: đọc tại thời điểm mở tab, giới hạn theo service có trong trace ---
  const loadDbQuality = useCallback(() => {
    setIsDbLoading(true);
    setDbError(null);
    const services = metrics
      ? metrics.services.filter((s) => s.db_calls > 0).map((s) => s.name)
      : selectedFlow?.services || [];
    fetchDbQuality(services)
      .then((data) => {
        setDbQuality(data);
        setDbFetchedAt(new Date());
      })
      .catch((err: unknown) =>
        setDbError((err as Error)?.message || 'Không đọc được số liệu database.')
      )
      .finally(() => setIsDbLoading(false));
  }, [metrics, selectedFlow]);

  useEffect(() => {
    if (view === 'flow' && activeTab === 'db' && !dbQuality && !isDbLoading && !dbError) {
      loadDbQuality();
    }
  }, [view, activeTab, dbQuality, isDbLoading, dbError, loadDbQuality]);

  // --- Điều hướng ---
  const openOverview = useCallback(() => {
    setView('overview');
    setFlowId(null);
    setServiceName(null);
  }, []);

  const openService = useCallback((name: string) => {
    setServiceName(name);
    setFlowId(null);
    setView('service');
  }, []);

  const openFlow = useCallback((id: string, tab: FlowTab = 'overview') => {
    setRunResult(null);
    setRunError(null);
    setFlowId(id);
    setActiveTab(tab);
    setView('flow');
  }, []);

  /** Bấm vào một lỗi trên dashboard: mở thẳng luồng và tab chứa bằng chứng của nó. */
  const openIssue = useCallback((issue: OverviewIssue) => {
    if (issue.service) setServiceName(issue.service);
    const tab: FlowTab = issue.tab === 'db' ? 'db' : issue.tab === 'overview' ? 'overview' : 'evidence';
    setFlowId(issue.flow_id);
    setActiveTab(tab);
    setView('flow');
  }, []);

  return {
    view,
    overview,
    isOverviewLoading,
    overviewError,
    isRefreshing,
    reloadOverview,

    selectedService,
    selectedFlow,
    serviceFlows,

    flowAnalysis,
    isFlowLoading,
    flowError,

    evidence,
    evidenceError,
    isEvidenceLoading,
    reloadEvidence,

    metrics,
    metricsError,
    isMetricsLoading,
    reloadMetrics: loadMetrics,

    dbQuality,
    dbError,
    isDbLoading,
    dbFetchedAt,
    reloadDbQuality: loadDbQuality,

    runAnalysis,
    runningFlowId,
    runError,
    runResult,
    dismissRunResult,

    activeTab,
    setActiveTab,

    openOverview,
    openService,
    openFlow,
    openIssue,
  };
}
