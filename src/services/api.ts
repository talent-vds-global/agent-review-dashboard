/**
 * Backend API Client
 * Kết nối tới Backend Quality Agent (Flask API tại http://localhost:8000)
 */

const env = (import.meta as unknown as {
  env?: { VITE_API_BASE_URL?: string; VITE_JAEGER_URL?: string };
}).env;

export const BASE_URL = env?.VITE_API_BASE_URL || 'http://localhost:8000';

/** Dùng để mở lại nguyên trace trong Jaeger khi người dùng cần xem đủ 100% span. */
export const JAEGER_URL = env?.VITE_JAEGER_URL || 'http://localhost:16686';

export interface AnalysisListItem {
  id: number;
  flow_id: string;
  analysis_type: string;
  verdict: 'PASS' | 'WARN' | 'FAIL' | string;
  trace_id?: string | null;
  created_at: string;
}

/** Trạng thái đối chiếu của một bước trong tài liệu với trace runtime. */
export type EvidenceStatus =
  | 'MATCHED'
  | 'PARTIAL'
  | 'MISSING'
  | 'NOT_OBSERVABLE'
  | 'NOT_IN_BRANCH';

export interface EvidenceSpan {
  span_id: string;
  service: string;
  label: string;
  type: 'http' | 'grpc' | 'kafka' | 'ws' | 'db' | string;
  kind: string;
  start_ms: number;
  duration_ms: number;
  error: boolean;
  detail: string;
}

export interface ExpectedTrace {
  description: string;
  found: number;
  need: number;
  optional: boolean;
  auto: boolean;
  ok: boolean;
}

export interface EvidenceStep {
  no: string;
  description: string;
  service: string;
  rules: string[];
  status: EvidenceStatus;
  severity: string;
  expected: ExpectedTrace[];
  evidence: EvidenceSpan[];
  note?: string;
  branch_only?: boolean;
}

export interface EvidenceNfr {
  code: string;
  metric: string;
  operator: string;
  threshold: string;
  unit: string;
  measured: number | null;
  status: 'PASS' | 'FAIL' | 'NO_DATA' | string;
  point: string;
  evidence: EvidenceSpan[];
}

export interface EvidenceRule {
  code: string;
  condition: string;
  action: string;
  severity: string;
  status: EvidenceStatus;
  steps: { no: string; status: EvidenceStatus }[];
}

export interface EvidenceReport {
  flow_id: string;
  trace_id: string;
  generated_at: string;
  mapping_source: string;
  doc: {
    page_id: string;
    source: string;
    title: string;
    entry: string;
    version: string;
    status: string;
    error?: string;
  };
  branch: {
    code: string;
    label: string;
    status_code: number | null;
    doc_ref?: string;
    stop_after_step?: number | null;
  };
  summary: {
    total_steps: number;
    matched: number;
    partial: number;
    missing: number;
    not_observable: number;
    not_in_branch: number;
    nfr_pass: number;
    nfr_fail: number;
    extra_calls: number;
    verdict: string;
  };
  steps: EvidenceStep[];
  nfrs: EvidenceNfr[];
  rules: EvidenceRule[];
  extra: EvidenceSpan[];
}

export interface FlowAnalysisDetail {
  id?: number;
  flow_id: string;
  analysis_type?: string;
  verdict: 'PASS' | 'WARN' | 'FAIL' | string;
  detail: string;
  runtime_flow: string;
  trace_id?: string | null;
  evidence?: EvidenceReport | null;
  created_at: string;
}

export interface TraceDbQuery {
  op: string;
  table: string;
  calls: number;
  total_ms: number;
}

/** Một dòng log runtime lấy theo trace_id (nguồn: Loki). */
export interface TraceLogLine {
  time_ns: string;
  service: string;
  level: string;
  span_id: string;
  message: string;
}

export interface TraceLogStats {
  available: boolean;
  error: string;
  source: string;
  total: number;
  truncated: boolean;
  by_level: Record<string, number>;
  error_count: number;
  warn_count: number;
  services: Record<string, number>;
  errors: TraceLogLine[];
  explore_url: string;
}

/** Số liệu tổng hợp của một trace — không kèm danh sách bước (dashboard đã bỏ sơ đồ trace). */
export interface TraceMetrics {
  trace_id: string;
  started_at_ms: number;
  ended_at_ms: number;
  total_duration_ms: number;
  span_count: number;
  step_count: number;
  error_count: number;
  services: { name: string; spans: number; db_calls: number }[];
  db: {
    calls: number;
    total_ms: number;
    tables: number;
    top: { service: string; op: string; table: string; calls: number; total_ms: number }[];
  };
  db_rollup: { service: string; op: string; table: string; calls: number; total_ms: number }[];
  slowest_steps: {
    service: string;
    label: string;
    duration_ms: number;
    error: boolean;
    status_code: number | null;
  }[];
  error_steps: {
    service: string;
    label: string;
    status_code: number | null;
    duration_ms: number;
  }[];
  logs?: TraceLogStats;
}

export interface DbQualityFinding {
  rule: string;
  severity: string;
  table: string;
  column: string;
  message: string;
  recommendation: string;
  called_from: string;
}

export interface DbQualityQuery {
  sql: string;
  called_from: string;
  calls: number | null;
  avg_ms: number | null;
  max_ms: number | null;
  total_ms?: number | null;
}

export interface DbQualityService {
  service: string;
  url: string;
  available: boolean;
  error: string;
  score: number | null;
  generated_at: string;
  metrics: {
    total_sql?: number | null;
    slow_query_count?: number | null;
    p50_ms?: number | null;
    p95_ms?: number | null;
    p99_ms?: number | null;
    error_rate?: number | null;
    n_plus_one?: number | null;
    top_tables?: Record<string, number>;
  };
  findings: DbQualityFinding[];
  slow_queries: DbQualityQuery[];
  top_queries: DbQualityQuery[];
}

export interface DbQualityResponse {
  services: DbQualityService[];
  configured: string[];
}

/* ===================== Tổng quan hệ thống (GET /api/overview) ===================== */

export type IssueSeverity = 'high' | 'medium' | 'low';

/** Một tiêu chí chất lượng mức hệ thống. `passed = null` nghĩa là chưa đủ dữ liệu để kết luận. */
export interface OverviewMetric {
  id: string;
  question: string;
  passed: boolean | null;
  value: string;
  detail: string;
  source: string;
}

/** Một vấn đề đang bắt được, luôn mở ngược được về bằng chứng trong tab tương ứng. */
export interface OverviewIssue {
  id: string;
  flow_id: string;
  kind: string;
  severity: IssueSeverity;
  title: string;
  detail: string;
  service: string;
  tab: string;
  ref: string;
}

export interface IssueCounts {
  high: number;
  medium: number;
  low: number;
  total: number;
}

export interface OverviewFlow {
  flow_id: string;
  title: string;
  slug: string;
  entries: string[];
  analyzed: boolean;
  verdict: string;
  analysis_id: number | null;
  analysis_type: string;
  trace_id: string;
  created_at: string;
  services: string[];
  doc: { title?: string; version?: string; status?: string; error?: string };
  branch: { code?: string; label?: string; status_code?: number | null };
  summary: EvidenceReport['summary'] | null;
  issues: OverviewIssue[];
  issue_counts: IssueCounts;
}

export interface OverviewService {
  name: string;
  role: string;
  flows: string[];
  flows_analyzed: number;
  /** Kết luận cho riêng service, tính trên các vấn đề quy về chính nó. */
  verdict: string;
  /** Verdict xấu nhất trong các luồng đi qua service — có thể do service khác gây ra. */
  flow_verdict: string;
  issues: OverviewIssue[];
  issue_counts: IssueCounts;
  db: {
    available: boolean;
    score: number | null;
    metrics: DbQualityService['metrics'];
    findings: number;
  } | null;
}

export interface SystemOverview {
  generated_at: string;
  system: string;
  health: {
    status: 'healthy' | 'warning' | 'critical' | 'unknown';
    metrics_passed: number;
    metrics_evaluated: number;
    metrics_total: number;
    issues_high: number;
    issues_total: number;
  };
  totals: {
    flows_total: number;
    flows_analyzed: number;
    steps_total: number;
    steps_checked: number;
    matched: number;
    partial: number;
    missing: number;
    not_observable: number;
    not_in_branch: number;
    nfr_pass: number;
    nfr_fail: number;
    extra_calls: number;
    error_spans: number;
  };
  metrics: OverviewMetric[];
  issues: OverviewIssue[];
  services: OverviewService[];
  flows: OverviewFlow[];
  db: DbQualityResponse | null;
}

const FALLBACK_URL = BASE_URL.includes('localhost')
  ? BASE_URL.replace('localhost', '127.0.0.1')
  : null;

async function requestApi(path: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: { Accept: 'application/json', ...(init?.headers || {}) },
    });
  } catch (err) {
    if (FALLBACK_URL) {
      return await fetch(`${FALLBACK_URL}${path}`, {
        ...init,
        headers: { Accept: 'application/json', ...(init?.headers || {}) },
      });
    }
    throw err;
  }
}

async function getJson<T>(path: string, what: string): Promise<T> {
  const response = await requestApi(path);
  if (!response.ok) {
    let message = `Không thể tải ${what}: HTTP ${response.status} (${response.statusText || 'Lỗi mạng'})`;
    try {
      const errorData = await response.json();
      if (errorData?.error) message = errorData.error;
    } catch {
      // giữ message mặc định
    }
    throw new Error(message);
  }
  return response.json();
}

async function postJson<T>(path: string, body: unknown, what: string): Promise<T> {
  const response = await requestApi(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  let data: Record<string, unknown> | null = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  if (!response.ok) {
    // `POST /runtime` báo lỗi nghiệp vụ bằng `message` (400/422), các endpoint khác dùng `error`
    const message =
      (data?.message as string) ||
      (data?.error as string) ||
      `Không thể ${what}: HTTP ${response.status} (${response.statusText || 'Lỗi mạng'})`;
    throw new Error(message);
  }
  return data as T;
}

/** Kết quả một lần chạy phân tích (rút gọn — phần nặng đọc lại qua các endpoint GET). */
export interface RunAnalysisResult {
  status: string;
  id?: number;
  flow_id: string;
  trace_id?: string | null;
  verdict: string;
  detection?: {
    kind: string;
    flow_id: string;
    reason: string;
    overlays?: { variant: string; reason: string }[];
  } | null;
}

/**
 * Lấy trace mới nhất của một luồng rồi chạy lại toàn bộ vòng phân tích (đối chiếu + agent)
 * POST /runtime
 *
 * Bỏ trống `flowId` thì backend tự nhận diện flow từ trace mới nhất. Lời gọi này **chậm**
 * (có một lần gọi LLM) nên UI phải khoá nút và báo đang chạy.
 */
export async function runFlowAnalysis(flowId?: string): Promise<RunAnalysisResult> {
  return postJson<RunAnalysisResult>(
    '/runtime',
    flowId ? { flow_id: flowId } : {},
    `chạy phân tích cho luồng "${flowId || 'mới nhất'}"`
  );
}

/**
 * Tổng quan chất lượng toàn hệ thống, gộp theo service — màn dashboard đầu tiên
 * GET /api/overview
 */
export async function fetchOverview(includeDb = false): Promise<SystemOverview> {
  return getJson<SystemOverview>(
    `/api/overview${includeDb ? '?db=1' : ''}`,
    'tổng quan chất lượng hệ thống'
  );
}

/**
 * Lấy danh sách tất cả các kết quả phân tích
 * GET /api/analysis
 */
export async function fetchAnalysisList(): Promise<AnalysisListItem[]> {
  return getJson<AnalysisListItem[]>('/api/analysis', 'danh sách phân tích');
}

/**
 * Lấy chi tiết kết quả phân tích của một flow cụ thể (kèm bảng đối chiếu đã lưu)
 * GET /api/flows/{flow_id}/analysis
 */
export async function fetchFlowAnalysis(flowId: string): Promise<FlowAnalysisDetail> {
  return getJson<FlowAnalysisDetail>(
    `/api/flows/${encodeURIComponent(flowId)}/analysis`,
    `chi tiết phân tích của flow "${flowId}"`
  );
}

/**
 * Dựng lại bảng đối chiếu tài liệu ↔ runtime tại thời điểm gọi
 * GET /api/flows/{flow_id}/evidence
 */
export async function fetchFlowEvidence(
  flowId: string,
  traceId?: string
): Promise<EvidenceReport> {
  const query = traceId ? `?trace_id=${encodeURIComponent(traceId)}` : '';
  return getJson<EvidenceReport>(
    `/api/flows/${encodeURIComponent(flowId)}/evidence${query}`,
    `bảng đối chiếu của flow "${flowId}"`
  );
}

/**
 * Số liệu tổng hợp của một trace: thời gian, span, log, lời gọi chậm/lỗi
 * GET /api/traces/{trace_id}/metrics
 */
export async function fetchTraceMetrics(traceId: string): Promise<TraceMetrics> {
  return getJson<TraceMetrics>(
    `/api/traces/${encodeURIComponent(traceId)}/metrics`,
    `số liệu của trace ${traceId}`
  );
}

/**
 * Số liệu database-quality-library, đọc tại thời điểm người dùng xem (không lưu lịch sử)
 * GET /api/db-quality
 */
export async function fetchDbQuality(services?: string[]): Promise<DbQualityResponse> {
  const query = services && services.length ? `?services=${encodeURIComponent(services.join(','))}` : '';
  return getJson<DbQualityResponse>(`/api/db-quality${query}`, 'số liệu chất lượng database');
}
