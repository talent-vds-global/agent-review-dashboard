import React, { useMemo, useState } from 'react';
import { JAEGER_URL, type TraceTimelineData } from '../../../../services/api';
import styles from './TraceTimeline.module.css';

interface TraceTimelineProps {
  data: TraceTimelineData | null;
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

const TYPE_LABEL: Record<string, string> = {
  http: 'HTTP',
  grpc: 'gRPC',
  kafka: 'KAFKA',
  ws: 'WS',
};

const TYPE_CLASS: Record<string, string> = {
  http: styles.tHttp,
  grpc: styles.tGrpc,
  kafka: styles.tKafka,
  ws: styles.tWs,
};

/** Số mốc thời gian vẽ trên trục ngang. */
const TICKS = 5;

export const TraceTimeline: React.FC<TraceTimelineProps> = ({
  data,
  isLoading,
  error,
  onRefresh,
}) => {
  const [openRows, setOpenRows] = useState<Record<string, boolean>>({});
  const [showDb, setShowDb] = useState(true);

  const ticks = useMemo(() => {
    if (!data) return [];
    const total = data.total_duration_ms || 1;
    return Array.from({ length: TICKS + 1 }, (_, i) => ({
      pct: (i / TICKS) * 100,
      ms: Math.round((total * i) / TICKS),
    }));
  }, [data]);

  if (isLoading) {
    return <div className={styles.emptyState}>Đang dựng sơ đồ trace...</div>;
  }

  if (error || !data) {
    return (
      <div className={styles.emptyState}>
        <strong>Chưa có sơ đồ trace</strong>
        <p>
          {error ||
            'Kết quả phân tích này không gắn trace_id. Chạy lại POST /runtime để bản ghi mới ' +
              'lưu kèm trace, hoặc mở trực tiếp trace trong Jaeger.'}
        </p>
        {onRefresh && (
          <button type="button" className={styles.linkBtn} onClick={onRefresh}>
            Thử tải lại
          </button>
        )}
      </div>
    );
  }

  const total = data.total_duration_ms || 1;

  return (
    <div className={styles.wrapper}>
      <div className={styles.headerBar}>
        <div className={styles.headLeft}>
          <span className={styles.bigStat}>{data.total_duration_ms}ms</span>
          <span className={styles.headMeta}>
            {data.span_count} span thô → <strong>{data.step_count} bước gọi</strong> (đã gộp cặp
            client/server, cuộn truy vấn DB vào bước cha)
          </span>
          {data.error_count > 0 && (
            <span className={styles.errorChip}>{data.error_count} bước lỗi</span>
          )}
        </div>
        <div className={styles.headRight}>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={showDb}
              onChange={(e) => setShowDb(e.target.checked)}
            />
            <span>Hiện truy vấn DB</span>
          </label>
          <a
            className={styles.linkBtn}
            href={`${JAEGER_URL}/trace/${data.trace_id}`}
            target="_blank"
            rel="noreferrer"
            title="Mở nguyên trace (đủ 100% span) trong Jaeger"
          >
            Mở trong Jaeger ↗
          </a>
        </div>
      </div>

      <div className={styles.serviceStrip}>
        {data.services.map((svc) => (
          <span key={svc.name} className={styles.serviceChip}>
            {svc.name}
            <span className={styles.serviceCount}>
              {svc.spans} span{svc.db_calls ? ` · ${svc.db_calls} SQL` : ''}
            </span>
          </span>
        ))}
      </div>

      {/* Trục thời gian */}
      <div className={styles.axis}>
        <div className={styles.axisLabelSpacer} />
        <div className={styles.axisTrack}>
          {ticks.map((t) => (
            <span key={t.pct} className={styles.tick} style={{ left: `${t.pct}%` }}>
              {t.ms}ms
            </span>
          ))}
        </div>
      </div>

      {/* Các bước */}
      <div className={styles.rows}>
        {data.steps.map((step) => {
          const left = Math.min(99, (step.start_ms / total) * 100);
          const width = Math.max(0.6, Math.min(100 - left, (step.duration_ms / total) * 100));
          const isOpen = !!openRows[step.span_id];
          const hasDetail = step.db_queries.length > 0;
          const placement: 'right' | 'inside' | 'left' =
            left + width <= 62 ? 'right' : width >= 35 ? 'inside' : 'left';

          return (
            <div key={step.span_id} className={styles.rowGroup}>
              <div
                className={`${styles.row} ${step.error ? styles.rowError : ''} ${
                  hasDetail ? styles.rowClickable : ''
                }`}
                onClick={() =>
                  hasDetail && setOpenRows((p) => ({ ...p, [step.span_id]: !p[step.span_id] }))
                }
              >
                <div className={styles.rowLabel} style={{ paddingLeft: `${Math.min(step.depth, 6) * 16}px` }}>
                  <span className={`${styles.typeTag} ${TYPE_CLASS[step.type] || ''}`}>
                    {TYPE_LABEL[step.type] || step.type}
                  </span>
                  <span className={styles.service}>{step.service}</span>
                  <span className={styles.label}>{step.label}</span>
                  {step.callee && <span className={styles.callee}>→ {step.callee}</span>}
                  {step.status_code !== null && (
                    <span className={step.error ? styles.statusBad : styles.status}>
                      {step.status_code}
                    </span>
                  )}
                  {showDb && step.db_calls > 0 && (
                    <span className={styles.dbChip}>
                      {step.db_calls} SQL · {step.db_ms}ms {hasDetail ? (isOpen ? '▾' : '▸') : ''}
                    </span>
                  )}
                </div>

                <div className={styles.track}>
                  {ticks.map((t) => (
                    <span key={t.pct} className={styles.gridLine} style={{ left: `${t.pct}%` }} />
                  ))}
                  <div
                    className={`${styles.bar} ${TYPE_CLASS[step.type] || ''} ${
                      step.error ? styles.barError : ''
                    }`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                    title={`${step.label} · bắt đầu ${step.start_ms}ms · kéo dài ${step.duration_ms}ms`}
                  />
                  {/* Nhãn thời lượng: bên phải thanh nếu còn chỗ; thanh dài thì ghi trong thanh;
                      thanh ngắn nằm sát mép phải thì đẩy sang trái thanh cho khỏi tràn. */}
                  <span
                    className={`${styles.barValue} ${
                      placement === 'inside' ? styles.barValueInside : ''
                    } ${placement === 'left' ? styles.barValueLeft : ''}`}
                    style={
                      placement === 'right'
                        ? { left: `${left + width + 0.6}%` }
                        : placement === 'inside'
                          ? { right: `${Math.max(0, 100 - left - width) + 0.6}%` }
                          : { right: `${Math.max(0, 100 - left) + 0.6}%` }
                    }
                  >
                    {step.duration_ms}ms
                    {step.server_ms !== null && step.server_ms !== undefined
                      ? ` · xử lý ${step.server_ms}ms`
                      : ''}
                  </span>
                </div>
              </div>

              {isOpen && showDb && (
                <div className={styles.dbDetail}>
                  {step.db_queries.map((q) => (
                    <span key={`${q.op}-${q.table}`} className={styles.dbQuery}>
                      <strong>{q.op}</strong> {q.table}
                      <span className={styles.dbQueryMeta}>
                        {q.calls}× · {q.total_ms}ms
                      </span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tổng hợp truy vấn */}
      {showDb && data.db_rollup.length > 0 && (
        <>
          <div className={styles.sectionTitle}>Truy vấn database trong trace này</div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '240px' }}>Service</th>
                <th style={{ width: '110px' }}>Thao tác</th>
                <th>Bảng</th>
                <th style={{ width: '110px' }}>Số lượt</th>
                <th style={{ width: '120px' }}>Tổng thời gian</th>
              </tr>
            </thead>
            <tbody>
              {data.db_rollup.map((row) => (
                <tr key={`${row.service}-${row.op}-${row.table}`}>
                  <td className={styles.mono}>{row.service}</td>
                  <td className={styles.mono}>{row.op}</td>
                  <td className={styles.mono}>{row.table}</td>
                  <td className={`${styles.mono} ${row.calls >= 5 ? styles.valueWarn : ''}`}>
                    {row.calls}×
                  </td>
                  <td className={styles.mono}>{row.total_ms}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className={styles.footNote}>
            Số lượt gọi cao trên cùng một bảng trong một request là dấu hiệu N+1 — đối chiếu tiếp ở
            tab “Chất lượng DB”, nơi thư viện db-quality chỉ đúng dòng code gọi câu lệnh.
          </div>
        </>
      )}
    </div>
  );
};

export default TraceTimeline;
