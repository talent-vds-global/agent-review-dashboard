import { useMemo, useCallback } from 'react';
import type { Flow } from '../../../../data/mock';

interface UseReportModalProps {
  flow: Flow;
}

export interface UseReportModalReturn {
  passedCount: number;
  totalCount: number;
  complianceScore: number;
  handlePrint: () => void;
}

export function useReportModal({ flow }: UseReportModalProps): UseReportModalReturn {
  const passedCount = useMemo(
    () => flow.criteria.filter((c) => c.passed).length,
    [flow.criteria]
  );
  const totalCount = flow.criteria.length;
  const complianceScore = useMemo(
    () => (totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 100),
    [passedCount, totalCount]
  );

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return {
    passedCount,
    totalCount,
    complianceScore,
    handlePrint,
  };
}
