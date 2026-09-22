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
 * Trả lời đúng những câu hỏi người xem cần: chạy hết bao lâu, thu được bao nhiêu span và log,
 * có ngưỡng NFR nào bị vượt, có lời gọi hay dòng log nào lỗi. Muốn xem đủ 100% span thì mở
 * trace trong Jaeger — dashboard không vẽ lại.
 */
export const TraceMetricsPanel: React.FC<TraceMetricsPanelProps> = ({
  data,
  nfrs,
  traceId,
  isLoading,
  error,
  onRefresh,
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
                note={`${data.step_count} bước nghiệp vụ`}
              />
              <Tile
                value={data.services.length}
                label="Service tham gia"
                note={data.services
                  .slice(0, 3)
                  .map((s) => s.name.replace('ewallet-', ''))
                  .join(', ')}
              />
              <Tile
                value={data.db.calls}
                label="Truy vấn DB"
                note={`${formatMs(data.db.total_ms)} · ${data.db.tables} bảng`}
              />
              <Tile
                value={`${nfrPass.length}/${nfrs.length}`}
                label="NFR đạt"
                note={nfrFail.length ? `${nfrFail.length} ngưỡng bị vượt` : 'Trong ngưỡng'}
                bad={nfrFail.length > 0}
              />
              <Tile
                value={data.error_count}
                label="Lời gọi lỗi"
                note={data.error_count ? 'Xem danh sách bên dưới' : 'Không có span lỗi'}
                bad={data.error_count > 0}
              />
              <Tile
                value={logs?.available ? logs.total : '—'}
                label="Dòng log thu được"
                note={
                  logs?.available
                    ? `${logs.error_count} lỗi · ${logs.warn_count} cảnh báo${
                        logs.truncated ? ' (đã cắt bớt)' : ''
                      }`
                    : 'Không đọc được log'
                }
                bad={!!logs?.available && logs.error_count > 0}
              />
            </div>

            {/* NFR: điểm đo và mức đo được */}
            {nfrs.length > 0 && (
              <div className={styles.subBlock}>
                <div className={styles.subTitle}>Yêu cầu phi chức năng</div>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Mã</th>
                      <th>Điểm đo</th>
                      <th className={styles.num}>Đo được</th>
                      <th className={styles.num}>Ngưỡng</th>
                      <th>Kết quả</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nfrs.map((nfr) => (
                      <tr key={nfr.code} className={nfr.status === 'FAIL' ? styles.rowBad : ''}>
                        <td className={styles.mono}>{nfr.code}</td>
                        <td className={styles.point}>{nfr.point}</td>
                        <td className={`${styles.num} ${styles.mono}`}>
                          {nfr.measured == null ? '—' : `${nfr.measured}${nfr.unit}`}
                        </td>
                        <td className={`${styles.num} ${styles.mono}`}>
                          {nfr.operator} {nfr.threshold}
                          {nfr.unit}
                        </td>
                        <td>
                          <span
                            className={
                              nfr.status === 'FAIL'
                                ? styles.tagFail
                                : nfr.status === 'PASS'
                                  ? styles.tagPass
                                  : styles.tagUnknown
                            }
                          >
                            {nfr.status === 'FAIL'
                              ? 'VƯỢT NGƯỠNG'
                              : nfr.status === 'PASS'
                                ? 'ĐẠT'
                                : 'CHƯA ĐO ĐƯỢC'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

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
          </>
        )}
      </div>
    </section>
  );
};

export default TraceMetricsPanel;
