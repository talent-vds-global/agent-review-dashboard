import React from 'react';
import { JAEGER_URL, type EvidenceNfr, type TraceMetrics } from '../../../../services/api';
import styles from './TraceMetricsPanel.module.css';

interface TraceMetricsPanelProps {
  data: TraceMetrics | null;
  /** NFR lấy từ bảng đối chiếu — phần "đạt / không đạt" của chính luồng này. */
  nfrs: EvidenceNfr[];
  traceId: string;
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  /**
   * Số lời gọi lỗi mà verdict đã tính (bỏ mã là kết cục nghiệp vụ của nhánh). Không có thì
   * dùng số span lỗi của trace.
   */
  errorCalls?: number;
  /** Chuyển sang tab Đối chiếu tài liệu, nơi có bảng NFR đầy đủ. */
  onOpenEvidence?: () => void;
}

function formatMs(value: number | null | undefined): string {
  if (value == null) return '—';
  if (value >= 1000) return `${(value / 1000).toFixed(2)}s`;
  return `${Math.round(value)}ms`;
}

function formatClock(ms: number): string {
  if (!ms) return '';
  return new Date(ms).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function logTime(timeNs: string): string {
  const ms = Number(timeNs) / 1_000_000;
  if (!isFinite(ms) || ms <= 0) return '';
  return new Date(ms).toLocaleTimeString('vi-VN', { hour12: false });
}

const Tile: React.FC<{
  value: React.ReactNode;
  label: string;
  note?: string;
  bad?: boolean;
}> = ({ value, label, note, bad }) => (
  <div className={`${styles.tile} ${bad ? styles.tileBad : ''}`}>
    <div className={styles.tileValue}>{value}</div>
    <div className={styles.tileLabel}>{label}</div>
    {note && <div className={styles.tileNote}>{note}</div>}
  </div>
);

/**
 * Số liệu của luồng trace — thay cho phần vẽ lại từng lời gọi.
 *
 * Bốn con số chính hiện ngay (thời gian, span, lời gọi lỗi, truy vấn DB); bảng NFR chỉ nằm ở
 * tab Đối chiếu tài liệu, ở đây còn số NFR đạt. Phần chi tiết (bước chậm, lời gọi lỗi, log lỗi,
 * service tham gia) thu gọn, bấm mới mở. Muốn xem đủ 100% span thì mở trace trong Jaeger.
 */
export const TraceMetricsPanel: React.FC<TraceMetricsPanelProps> = ({
  data,
  nfrs,
  traceId,
  isLoading,
  error,
  onRefresh,
  errorCalls,
  onOpenEvidence,
}) => {
  const nfrFail = nfrs.filter((n) => n.status === 'FAIL');
  const nfrPass = nfrs.filter((n) => n.status === 'PASS');
  const logs = data?.logs;

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div className={styles.panelTitle}>Số liệu luồng trace</div>
        <div className={styles.headerRight}>
          {traceId && (
            <a
              className={styles.jaegerLink}
              href={`${JAEGER_URL}/trace/${traceId}`}
              target="_blank"
              rel="noreferrer"
              title="Mở nguyên trace (đủ 100% span) trong Jaeger"
            >
              Mở trace trong Jaeger ↗
            </a>
          )}
          {onRefresh && (
            <button
              type="button"
              className={styles.refreshBtn}
              onClick={onRefresh}
              disabled={isLoading}
            >
              {isLoading ? 'Đang đọc…' : 'Đọc lại'}
            </button>
          )}
        </div>
      </div>

      <div className={styles.panelBody}>
        {isLoading && !data ? (
          <div className={styles.state}>Đang đọc số liệu trace…</div>
        ) : error ? (
          <div className={styles.errorState}>{error}</div>
        ) : !data ? (
          <div className={styles.state}>Chưa có số liệu trace cho luồng này.</div>
        ) : (
          <>
            <div className={styles.tileGrid}>
              <Tile
                value={formatMs(data.total_duration_ms)}
                label="Tổng thời gian"
                note={formatClock(data.started_at_ms)}
                bad={nfrFail.length > 0}
              />
              <Tile
                value={data.span_count}
                label="Span thu được"
                note={`${data.step_count} bước · ${data.services.length} service`}
              />
              <Tile
                value={errorCalls ?? data.error_count}
                label="Lời gọi lỗi"
                note={
                  errorCalls != null && errorCalls !== data.error_count
                    ? `${data.error_count} span lỗi, phần còn lại là kết cục nghiệp vụ`
                    : (errorCalls ?? data.error_count)
                      ? 'Xem chi tiết bên dưới'
                      : 'Không có span lỗi'
                }
                bad={(errorCalls ?? data.error_count) > 0}
              />
              <Tile
                value={data.db.calls}
                label="Truy vấn DB"
                note={`${formatMs(data.db.total_ms)} · ${data.db.tables} bảng`}
              />
            </div>

            {nfrs.length > 0 && (
              <div className={`${styles.nfrLine} ${nfrFail.length ? styles.nfrLineBad : ''}`}>
                NFR đạt <b>{nfrPass.length}/{nfrs.length}</b>
                {nfrFail.length > 0 && ` — vượt ngưỡng: ${nfrFail.map((n) => n.code).join(', ')}`}
                {onOpenEvidence && (
                  <button type="button" className={styles.nfrLink} onClick={onOpenEvidence}>
                    Xem bảng NFR →
                  </button>
                )}
              </div>
            )}

            <details className={styles.details} open={data.error_count > 0}>
              <summary className={styles.detailsSummary}>
                Chi tiết trace: bước chậm nhất, lời gọi lỗi, log lỗi
                {logs?.available ? ` (${logs.total} dòng log, ${logs.error_count} lỗi)` : ''}
              </summary>

              <div className={styles.subBlock}>
                <div className={styles.subTitle}>Service tham gia</div>
                <div className={styles.point}>
                  {data.services.map((sv) => `${sv.name} (${sv.spans} span)`).join(' · ')}
                </div>
              </div>

            {/* Nơi tốn thời gian nhất — để biết nếu vượt ngưỡng thì nghẽn ở đâu */}
            {data.slowest_steps.length > 0 && (
              <div className={styles.subBlock}>
                <div className={styles.subTitle}>Tốn thời gian nhất</div>
                <div className={styles.barList}>
                  {data.slowest_steps.map((step, index) => {
                    const ratio = data.total_duration_ms
                      ? Math.min(100, (step.duration_ms / data.total_duration_ms) * 100)
                      : 0;
                    return (
                      <div key={`${step.label}-${index}`} className={styles.barRow}>
                        <span className={styles.barService}>
                          {step.service.replace('ewallet-', '')}
                        </span>
                        <span className={styles.barLabel}>{step.label}</span>
                        <span className={styles.barTrack}>
                          <span
                            className={`${styles.barFill} ${step.error ? styles.barFillBad : ''}`}
                            style={{ width: `${ratio}%` }}
                          />
                        </span>
                        <span className={styles.barValue}>{formatMs(step.duration_ms)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Lời gọi lỗi */}
            {data.error_steps.length > 0 && (
              <div className={styles.subBlock}>
                <div className={styles.subTitle}>Lời gọi báo lỗi</div>
                <div className={styles.errorList}>
                  {data.error_steps.map((step, index) => (
                    <div key={`${step.label}-${index}`} className={styles.errorRow}>
                      <span className={styles.errorService}>{step.service}</span>
                      <span className={styles.errorLabel}>{step.label}</span>
                      {step.status_code != null && (
                        <span className={styles.errorCode}>HTTP {step.status_code}</span>
                      )}
                      <span className={styles.errorDuration}>{formatMs(step.duration_ms)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Log lỗi cùng trace_id */}
            {logs && (logs.error_count > 0 || !logs.available) && (
              <div className={styles.subBlock}>
                <div className={styles.subTitleRow}>
                  <span className={styles.subTitle}>
                    Log lỗi của giao dịch này
                    {logs.available ? ` (${logs.error_count})` : ''}
                  </span>
                  {logs.available && logs.explore_url && (
                    <a
                      className={styles.logLink}
                      href={logs.explore_url}
                      target="_blank"
                      rel="noreferrer"
                      title="Mở toàn bộ log cùng trace_id trong Grafana"
                    >
                      Mở log trong Grafana ↗
                    </a>
                  )}
                </div>

                {!logs.available ? (
                  <div className={styles.logOffline}>{logs.error}</div>
                ) : (
                  <div className={styles.logList}>
                    {logs.errors.map((line, index) => (
                      <div key={`${line.time_ns}-${index}`} className={styles.logRow}>
                        <span className={styles.logTime}>{logTime(line.time_ns)}</span>
                        <span className={styles.logLevel}>{line.level}</span>
                        <span className={styles.logService}>{line.service}</span>
                        <span className={styles.logMessage}>{line.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            </details>
          </>
        )}
      </div>
    </section>
  );
};

export default TraceMetricsPanel;
