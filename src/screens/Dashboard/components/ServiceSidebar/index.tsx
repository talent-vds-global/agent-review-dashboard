import React from 'react';
import type { ServiceItem } from '../../../../data/mock';
import styles from './ServiceSidebar.module.css';

interface ServiceSidebarProps {
  services: ServiceItem[];
  selectedServiceId: string;
  selectedFlowId: string;
  onSelectService: (serviceId: string) => void;
  onSelectFlow: (flowId: string) => void;
}

export const ServiceSidebar: React.FC<ServiceSidebarProps> = ({
  services,
  selectedServiceId,
  selectedFlowId,
  onSelectService,
  onSelectFlow,
}) => {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <div className={styles.sidebarTitle}>
          <span>SERVICES RUNTIME</span>
        </div>
        <span className={styles.serviceCountBadge}>{services.length} SERVICES</span>
      </div>

      <div className={styles.serviceList}>
        {services.map((service) => {
          const isServiceActive = service.id === selectedServiceId;

          return (
            <div key={service.id} className={styles.serviceBlock}>
              <button
                type="button"
                className={`${styles.serviceItem} ${isServiceActive ? styles.activeService : ''}`}
                onClick={() => onSelectService(service.id)}
              >
                <div className={styles.serviceInfo}>
                  <span className={styles.serviceName}>{service.name}</span>
                  <span className={styles.serviceDesc}>{service.description}</span>
                </div>

                <span
                  className={`${styles.issueBadge} ${
                    service.issuesCount > 0 ? styles.hasIssues : ''
                  }`}
                >
                  {service.issuesCount > 0 ? `${service.issuesCount} lỗi` : '0'}
                </span>
              </button>

              {/* Expand flows for currently active service */}
              {isServiceActive && (
                <div className={styles.flowsAccordion}>
                  {service.flows.map((flow) => {
                    const isFlowActive = flow.id === selectedFlowId;

                    return (
                      <button
                        key={flow.id}
                        type="button"
                        className={`${styles.flowItem} ${isFlowActive ? styles.activeFlow : ''}`}
                        onClick={() => onSelectFlow(flow.id)}
                      >
                        <div>
                          <div className={styles.flowTitle}>{flow.name}</div>
                          <div
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '10px',
                              opacity: 0.75,
                            }}
                          >
                            SRS: {flow.srsCode}
                          </div>
                        </div>

                        <span
                          className={`${styles.flowBadge} ${
                            flow.stats.issuesCount > 0 ? styles.highlightIssue : ''
                          }`}
                        >
                          {flow.stats.issuesCount > 0 ? `${flow.stats.issuesCount}!` : 'OK'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className={styles.sidebarFooter}>
        <div className={styles.sidebarNote}>
          Dữ liệu đồng bộ từ distributed tracing agent và audit engine định kỳ.
        </div>
      </div>
    </aside>
  );
};

export default ServiceSidebar;
