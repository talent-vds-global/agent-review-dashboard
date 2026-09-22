/**
 * Backend API Client
 * Kết nối tới Backend Quality Agent (Flask API tại http://localhost:8000)
 */

export const BASE_URL = (import.meta as unknown as { env?: { VITE_API_BASE_URL?: string } }).env?.VITE_API_BASE_URL || 'http://localhost:8000';

export interface AnalysisListItem {
  id: number;
  flow_id: string;
  analysis_type: string;
  verdict: 'PASS' | 'WARN' | 'FAIL' | string;
  created_at: string;
}

export interface FlowAnalysisDetail {
  id?: number;
  flow_id: string;
  trace_id?: string;
  analysis_type?: string;
  verdict: 'PASS' | 'WARN' | 'FAIL' | string;
  detail: string;
  runtime_flow: string;
  created_at: string;
}

const FALLBACK_URL = BASE_URL.includes('localhost')
  ? BASE_URL.replace('localhost', '127.0.0.1')
  : null;

async function requestApi(path: string): Promise<Response> {
  try {
    return await fetch(`${BASE_URL}${path}`, {
      headers: { Accept: 'application/json' },
    });
  } catch (err) {
    if (FALLBACK_URL) {
      return await fetch(`${FALLBACK_URL}${path}`, {
        headers: { Accept: 'application/json' },
      });
    }
    throw err;
  }
}

/**
 * Lấy danh sách tất cả các kết quả phân tích
 * GET /api/analysis
 */
export async function fetchAnalysisList(): Promise<AnalysisListItem[]> {
  const response = await requestApi('/api/analysis');

  if (!response.ok) {
    throw new Error(
      `Không thể tải danh sách phân tích: HTTP ${response.status} (${response.statusText || 'Lỗi mạng'})`
    );
  }

  return response.json();
}

/**
 * Lấy chi tiết kết quả phân tích của một flow cụ thể
 * GET /api/flows/{flow_id}/analysis
 */
export async function fetchFlowAnalysis(flowId: string): Promise<FlowAnalysisDetail> {
  const response = await requestApi(`/api/flows/${encodeURIComponent(flowId)}/analysis`);

  if (!response.ok) {
    if (response.status === 404) {
      let message = `Không có kết quả phân tích cho flow "${flowId}"`;
      try {
        const errorData = await response.json();
        if (errorData.error) {
          message = errorData.error;
        }
      } catch {
        // use default message
      }
      throw new Error(message);
    }

    throw new Error(
      `Không thể tải chi tiết phân tích của flow "${flowId}": HTTP ${response.status} (${response.statusText || 'Lỗi mạng'})`
    );
  }

  return response.json();
}

/* ─── Database Quality ─── */

export interface DbQualityItem {
  statement: string;
  table: string;
  operation: string;
  call_count: number;
  total_ms: number;
  max_ms?: number;
  flags: string[];
  status: 'alert' | 'ok' | string;
}

export interface DbQualityResponse {
  flow_id: string;
  trace_id?: string;
  total_queries: number;
  alert_count: number;
  db_quality: DbQualityItem[];
}

/**
 * Lấy dữ liệu chất lượng database của một flow
 * GET /api/flows/{flow_id}/db-quality?trace_id={trace_id}
 */
export async function fetchDbQuality(
  flowId: string,
  traceId?: string,
): Promise<DbQualityResponse> {
  let path = `/api/flows/${encodeURIComponent(flowId)}/db-quality`;
  if (traceId) {
    path += `?trace_id=${encodeURIComponent(traceId)}`;
  }

  const response = await requestApi(path);

  if (!response.ok) {
    throw new Error(
      `Không thể tải dữ liệu DB Quality cho flow "${flowId}": HTTP ${response.status} (${response.statusText || 'Lỗi mạng'})`,
    );
  }

  return response.json();
}
