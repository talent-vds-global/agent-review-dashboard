/**
 * Thang verdict của Runtime Verifier: PASS (đạt) < RETRY (có vi phạm cần sửa)
 * < ESCALATE (chuyển người xử lý). Kết quả lưu trước khi đổi thang mang WARN/FAIL —
 * quy về thang mới để hiển thị thống nhất.
 */
export type VerdictLevel = 'PASS' | 'RETRY' | 'ESCALATE' | 'UNKNOWN' | 'NONE';

export function normalizeVerdict(verdict?: string | null): VerdictLevel {
  const v = (verdict || '').toUpperCase();
  if (v === 'PASS') return 'PASS';
  if (v === 'RETRY' || v === 'WARN') return 'RETRY';
  if (v === 'ESCALATE' || v === 'FAIL') return 'ESCALATE';
  if (v === 'NONE' || v === '') return 'NONE';
  return 'UNKNOWN';
}

export const VERDICT_LABEL: Record<VerdictLevel, string> = {
  PASS: 'ĐẠT',
  RETRY: 'CẦN SỬA',
  ESCALATE: 'CHUYỂN NGƯỜI XỬ LÝ',
  UNKNOWN: 'KHÔNG RÕ',
  NONE: 'CHƯA PHÂN TÍCH',
};

export const VERDICT_ICON: Record<VerdictLevel, string> = {
  PASS: '✓',
  RETRY: '↻',
  ESCALATE: '⚠',
  UNKNOWN: '',
  NONE: '',
};

/** Chọn class CSS theo mức: mỗi màn có bộ class riêng cho đạt / cảnh báo / nghiêm trọng / trống. */
export function verdictTone<T>(
  verdict: string | null | undefined,
  tones: { pass: T; retry: T; escalate: T; none: T }
): T {
  const level = normalizeVerdict(verdict);
  if (level === 'PASS') return tones.pass;
  if (level === 'RETRY') return tones.retry;
  if (level === 'ESCALATE') return tones.escalate;
  return tones.none;
}
