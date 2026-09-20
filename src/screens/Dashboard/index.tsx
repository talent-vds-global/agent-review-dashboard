import React from 'react';
import type { QualityPortalData, RoleType } from '../../data/mock';
import type { UserProfile } from '../../data/dummy';
import { useDashboard } from './useDashboard';
import { ServiceSidebar } from './components/ServiceSidebar';
import { FlowDetail } from './components/FlowDetail';
import { StatsBar } from './components/StatsBar';
import { ReportModal } from './components/ReportModal';
import styles from './Dashboard.module.css';

interface DashboardProps {
  currentRole: RoleType;
  currentUser?: UserProfile | null;
  onLogout?: () => void;
  onResetRole?: () => void;
  portalData: QualityPortalData;
}

export const Dashboard: React.FC<DashboardProps> = ({
  currentRole,
  currentUser,
  onLogout,
  onResetRole,
  portalData,
}) => {
  const {
    roleInfo,
    selectedService,
    selectedFlow,
    stats,
    isReportOpen,
    projectName,
    services,
    handleSelectService,
    handleSelectFlow,
    handleOpenReport,
    handleCloseReport,
  } = useDashboard({ portalData, currentRole });

  return (
    <div className={styles.dashboardContainer}>
      {/* Top Header */}
      <header className={styles.mainHeader}>
        <div className={styles.brandNav}>
          <div className={styles.brandLogo}>
            QC PORTAL <span className={styles.accentDot} />
          </div>
          <span className={styles.separator}>/</span>
          <span className={styles.projectName}>{projectName}</span>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.generateReportBtn}
            onClick={handleOpenReport}
          >
            <span>★</span>
            <span>Sinh báo cáo chất lượng</span>
          </button>

          <div className={styles.userInfoGroup}>
            <div className={styles.userInitialSquare}>
              {currentUser?.fullName
                ? currentUser.fullName.split(' ').slice(-1)[0][0].toUpperCase()
                : roleInfo.initials}
            </div>
            <div className={styles.userMeta}>
              <span className={styles.userName}>
                {currentUser?.fullName || roleInfo.name}
              </span>
              <span className={styles.userRoleTitle}>
                {currentUser ? `${currentUser.username} · ${roleInfo.roleTitle}` : roleInfo.roleTitle}
              </span>
            </div>
            {onLogout ? (
              <button
                type="button"
                className={styles.switchRoleBtn}
                onClick={onLogout}
                title="Đăng xuất khỏi tài khoản"
              >
                Đăng xuất
              </button>
            ) : onResetRole ? (
              <button
                type="button"
                className={styles.switchRoleBtn}
                onClick={onResetRole}
                title="Quay lại màn hình chọn vai trò"
              >
                Đổi vai trò
              </button>
            ) : null}
          </div>
        </div>
      </header>

      {/* Sub-header */}
      <div className={styles.subHeader}>
        <div className={styles.subHeaderLeft}>
          <span className={styles.roleHighlightBadge}>{roleInfo.roleTitle}</span>
          <span className={styles.missionText}>{roleInfo.mission}</span>
        </div>
        <div className={styles.subHeaderRight}>
          <span className={styles.pulseDot} />
          <span>Nguồn: tracing runtime · ví dụ minh hoạ</span>
        </div>
      </div>

      {/* 3-Part Main Body */}
      <div className={styles.contentArea}>
        {/* 1. Sidebar */}
        <ServiceSidebar
          services={services}
          selectedServiceId={selectedService.id}
          selectedFlowId={selectedFlow.id}
          onSelectService={handleSelectService}
          onSelectFlow={handleSelectFlow}
        />

        {/* 2. Middle Area: Flow Detail with Criteria and Evidence */}
        <FlowDetail
          currentRole={currentRole}
          service={selectedService}
          flow={selectedFlow}
        />
      </div>

      {/* 3. Footer: StatsBar */}
      <StatsBar stats={stats} />

      {/* Quality Report Modal */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={handleCloseReport}
        service={selectedService}
        flow={selectedFlow}
        projectName={projectName}
      />
    </div>
  );
};

export default Dashboard;
