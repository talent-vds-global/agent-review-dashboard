import { useState, useMemo, useCallback } from 'react';
import {
  ROLES,
  type Flow,
  type FlowStats,
  type QualityPortalData,
  type RoleInfo,
  type RoleType,
  type ServiceItem,
} from '../../data/mock';

interface UseDashboardProps {
  portalData: QualityPortalData;
  currentRole: RoleType;
}

export interface UseDashboardReturn {
  // State
  selectedServiceId: string;
  selectedFlowId: string;
  isReportOpen: boolean;

  // Selected Entities & Metadata
  roleInfo: RoleInfo;
  selectedService: ServiceItem;
  selectedFlow: Flow;
  stats: FlowStats;
  services: ServiceItem[];
  projectName: string;

  // Criteria Summary
  passedCriteriaCount: number;
  totalCriteriaCount: number;
  isAllCriteriaPassed: boolean;

  // Handlers
  handleSelectService: (serviceId: string) => void;
  handleSelectFlow: (flowId: string) => void;
  handleOpenReport: () => void;
  handleCloseReport: () => void;
}

export function useDashboard({ portalData, currentRole }: UseDashboardProps): UseDashboardReturn {
  const roleInfo = useMemo(() => ROLES[currentRole], [currentRole]);

  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    portalData.services[0]?.id || ''
  );
  const [selectedFlowId, setSelectedFlowId] = useState<string>(
    portalData.services[0]?.flows[0]?.id || ''
  );
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);

  // Active Service
  const selectedService = useMemo(() => {
    return (
      portalData.services.find((s) => s.id === selectedServiceId) ||
      portalData.services[0]
    );
  }, [portalData.services, selectedServiceId]);

  // Active Flow
  const selectedFlow = useMemo(() => {
    return (
      selectedService?.flows.find((f) => f.id === selectedFlowId) ||
      selectedService?.flows[0]
    );
  }, [selectedService, selectedFlowId]);

  // Handle service selection (auto-selects first flow of the service)
  const handleSelectService = useCallback(
    (serviceId: string) => {
      setSelectedServiceId(serviceId);
      const targetService = portalData.services.find((s) => s.id === serviceId);
      if (targetService && targetService.flows.length > 0) {
        setSelectedFlowId(targetService.flows[0].id);
      }
    },
    [portalData.services]
  );

  // Handle flow selection
  const handleSelectFlow = useCallback((flowId: string) => {
    setSelectedFlowId(flowId);
  }, []);

  // Modal handlers
  const handleOpenReport = useCallback(() => {
    setIsReportOpen(true);
  }, []);

  const handleCloseReport = useCallback(() => {
    setIsReportOpen(false);
  }, []);

  // Criteria calculations
  const totalCriteriaCount = selectedFlow?.criteria?.length || 0;
  const passedCriteriaCount =
    selectedFlow?.criteria?.filter((c) => c.passed).length || 0;
  const isAllCriteriaPassed =
    totalCriteriaCount > 0 && passedCriteriaCount === totalCriteriaCount;

  return {
    selectedServiceId,
    selectedFlowId,
    isReportOpen,

    roleInfo,
    selectedService,
    selectedFlow,
    stats: selectedFlow.stats,
    services: portalData.services,
    projectName: portalData.projectName,

    passedCriteriaCount,
    totalCriteriaCount,
    isAllCriteriaPassed,

    handleSelectService,
    handleSelectFlow,
    handleOpenReport,
    handleCloseReport,
  };
}
