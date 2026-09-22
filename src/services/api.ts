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

export interface TraceStep {
  span_id: string;
  parent_step_id: string | null;
  service: string;
  callee: string | null;
  label: string;
  operation: string;
  type: 'http' | 'grpc' | 'kafka' | 'ws' | string;
  kind: string;
  start_ms: number;
  duration_ms: number;
  server_ms: number | null;
  status_code: number | null;
  error: boolean;
  depth: number;
  db_calls: number;
  db_ms: number;
  db_queries: TraceDbQuery[];
}

export interface TraceTimelineData {
  trace_id: string;
  total_duration_ms: number;
  span_count: number;
  step_count: number;
  error_count: number;
  services: { name: string; spans: number; db_calls: number }[];
  steps: TraceStep[];
  db_rollup: { service: string; op: string; table: string; calls: number; total_ms: number }[];
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
 * Sơ đồ trace đã rút gọn (gộp client/server, cuộn truy vấn DB vào bước cha)
 * GET /api/traces/{trace_id}/timeline
 */
export async function fetchTraceTimeline(traceId: string): Promise<TraceTimelineData> {
  return getJson<TraceTimelineData>(
    `/api/traces/${encodeURIComponent(traceId)}/timeline?db=1`,
    `sơ đồ trace ${traceId}`
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
