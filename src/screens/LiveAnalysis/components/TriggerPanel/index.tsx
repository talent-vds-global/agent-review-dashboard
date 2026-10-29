import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchTriggerStatus,
  triggerConfluenceCheck,
  triggerManualRun,
  type TriggerRun,
  type TriggerStatus,
} from '../../../../services/api';
import styles from './TriggerPanel.module.css';

interface TriggerPanelProps {
  /** Gọi khi một lượt chạy vừa xong — để màn tổng quan đọc lại số liệu mới. */
  onRunFinished: () => void;
}

const SOURCE_LABEL: Record<string, string> = {
  manual: 'Thủ công',
  schedule_daily: 'Lịch hằng ngày',
  confluence_poll: 'Confluence (polling)',
  confluence_webhook: 'Confluence (webhook)',
};

const STATUS_LABEL: Record<string, string> = {
  queued: 'Đang chờ',
  running: 'Đang chạy',
  done: 'Xong',
  skipped: 'Không có trace',
  failed: 'Lỗi',
};

function formatTime(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  return date.toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isActive(run: TriggerRun): boolean {
  return run.status === 'queued' || run.status === 'running';
}

/**
 * Các trigger của hệ thống trên một panel: lịch hằng ngày, theo dõi tài liệu Confluence và nút
 * chạy tay. Đang có lượt chạy thì hỏi trạng thái mỗi 3 giây, rảnh thì 20 giây — đủ để thấy
 * lượt do Confluence/lịch tự bắn ra mà không cần bấm "Làm mới".
 */
export const TriggerPanel: React.FC<TriggerPanelProps> = ({ onRunFinished }) => {
  const [status, setStatus] = useState<TriggerStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'run' | 'check' | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const activeIds = useRef<Set<number>>(new Set());

  const load = useCallback(async () => {
    try {
      const next = await fetchTriggerStatus();
      setStatus(next);
      setError(null);
      // Lượt nào vừa chuyển từ đang chạy sang xong -> nạp lại tổng quan
      const nowActive = new Set(next.runs.filter(isActive).map((r) => r.id));
      const finished = [...activeIds.current].some((id) => !nowActive.has(id));
      activeIds.current = nowActive;
      if (finished) onRunFinished();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [onRunFinished]);

  const hasActive = !!status?.runs.some(isActive);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, hasActive ? 3000 : 20000);
    return () => window.clearInterval(timer);
  }, [load, hasActive]);

  const runAll = async () => {
    setBusy('run');
    setNotice(null);
    try {
      const res = await triggerManualRun();
      setNotice(`Đã xếp lượt #${res.run_id}: ${res.flow_ids.join(', ')}`);
      await load();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const checkConfluence = async () => {
    setBusy('check');
    setNotice(null);
    try {
      const res = await triggerConfluenceCheck();
      if (res.errors.length) {
        setNotice(`Không đọc được ${res.errors.length} trang: ${res.errors[0].error}`);
      } else if (res.run_id) {
        setNotice(
          `Tài liệu đã đổi (${res.changed
            .map((c) => `${c.flow_id} v${c.old_version ?? '?'}→v${c.version}`)
            .join(', ')}) — đã xếp lượt #${res.run_id}`
        );
      } else {
        setNotice('Tài liệu không đổi so với lần kiểm trước.');
      }
      await load();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  if (error && !status) {
    return (
      <section className={styles.panel}>
        <div className={styles.header}>
          <h3 className={styles.title}>Kích hoạt phân tích</h3>
        </div>
        <div className={styles.errorLine}>Không đọc được trạng thái trigger: {error}</div>
      </section>
    );
  }
  if (!status) return null;

  const { scheduler, queue, spec_versions, runs } = status;
  const poll = scheduler.confluence_poll;

  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <h3 className={styles.title}>Kích hoạt phân tích</h3>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={checkConfluence}
            disabled={busy !== null}
            title="Hỏi Confluence ngay; trang nào đổi phiên bản thì phân tích lại luồng đó"
          >
            {busy === 'check' ? 'Đang kiểm…' : 'Kiểm tra Confluence'}
          </button>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={runAll}
            disabled={busy !== null}
            title="Lấy trace mới nhất của từng luồng và phân tích lại toàn bộ (chạy nền)"
          >
            {busy === 'run' ? 'Đang xếp…' : 'Phân tích lại tất cả'}
          </button>
        </div>
      </div>

      {notice && <div className={styles.notice}>{notice}</div>}

      {/* Trạng thái gọn một dòng; hai bảng chi tiết thu vào "Xem chi tiết" */}
      <div className={styles.statusLine}>
        <span>
          <b>Lịch:</b>{' '}
          {scheduler.daily.at && scheduler.enabled
            ? `${scheduler.daily.at} mỗi ngày${
                scheduler.daily.next_run ? ` (lần tới ${formatTime(scheduler.daily.next_run)})` : ''
              }`
            : 'tắt'}
        </span>
        <span>
          <b>Confluence:</b>{' '}
          {poll.interval_seconds > 0 && scheduler.enabled
            ? `kiểm mỗi ${poll.interval_seconds}s`
            : 'polling tắt'}
          {scheduler.confluence_webhook.token_required ? ' · webhook' : ''}
        </span>
        <span>
          <b>Hàng đợi:</b>{' '}
          {queue.running_run_id
            ? `đang chạy lượt #${queue.running_run_id} · ${queue.running_flow_id ?? ''}`
            : 'rảnh'}
          {queue.queued ? ` · ${queue.queued} lượt chờ` : ''}
        </span>
      </div>

      <details className={styles.details}>
        <summary className={styles.detailsSummary}>
          Xem chi tiết: tài liệu đang theo dõi ({spec_versions.length}) · lượt chạy gần nhất (
          {runs.length})
        </summary>
      <div className={styles.columns}>
        <div>
          <div className={styles.subTitle}>Tài liệu đang theo dõi</div>
          {spec_versions.length === 0 ? (
            <div className={styles.empty}>Chưa ghi nhận phiên bản nào.</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Luồng</th>
                  <th>Phiên bản</th>
                  <th>Đổi lần cuối</th>
                </tr>
              </thead>
              <tbody>
                {spec_versions.map((v) => (
                  <tr key={v.flow_id}>
                    <td title={v.title}>
                      <b>{v.flow_id}</b>
                    </td>
                    <td className={styles.mono}>v{v.version}</td>
                    <td>{formatTime(v.changed_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div>
          <div className={styles.subTitle}>Lượt chạy gần nhất</div>
          {runs.length === 0 ? (
            <div className={styles.empty}>Chưa có lượt nào.</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nguồn</th>
                  <th>Kết quả</th>
                  <th>Lúc</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => (
                  <tr key={run.id} title={run.reason || ''}>
                    <td className={styles.mono}>{run.id}</td>
                    <td>
                      <div>{SOURCE_LABEL[run.triggered_by] || run.triggered_by}</div>
                      {run.reason && <div className={styles.reason}>{run.reason}</div>}
                    </td>
                    <td>
                      <span className={`${styles.status} ${styles[`s_${run.status}`] || ''}`}>
                        {STATUS_LABEL[run.status] || run.status}
                      </span>
                      <div className={styles.flowChips}>
                        {(run.results && run.results.length
                          ? run.results
                          : run.flow_ids.map((f) => ({ flow_id: f, status: 'pending' as const }))
                        ).map((r) => (
                          <span
                            key={r.flow_id}
                            className={`${styles.chip} ${
                              'verdict' in r && r.verdict ? styles[`v_${r.verdict}`] || '' : ''
                            }`}
                            title={'message' in r && r.message ? r.message : ''}
                          >
                            {r.flow_id}
                            {'verdict' in r && r.verdict ? ` ${r.verdict}` : r.status === 'skipped' ? ' —' : ''}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>{formatTime(run.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      </details>
    </section>
  );
};

export default TriggerPanel;
