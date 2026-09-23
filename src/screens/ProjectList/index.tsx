import React from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { MOCK_PROJECTS } from '../../data/projects';
import styles from './ProjectList.module.css';

export const ProjectList: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleSelectProject = (projectId: string) => {
    navigate(`/projects/${projectId}#live`);
  };

  const initials = currentUser?.fullName
    ? currentUser.fullName.substring(0, 2).toUpperCase()
    : currentUser?.initials || 'U';

  return (
    <div className={styles.projectListPage}>
      {/* Header — consistent với Dashboard */}
      <header className={styles.header}>
        <div className={styles.brandNav}>
          <div className={styles.brandLogo}>
            QC PORTAL <span className={styles.accentDot} />
          </div>
        </div>

        <div className={styles.userInfoGroup}>
          <div className={styles.userInitialSquare}>{initials}</div>
          <div className={styles.userMeta}>
            <span className={styles.userName}>
              {currentUser?.fullName || currentUser?.username || 'User'}
            </span>
            <span className={styles.userRole}>
              {currentUser?.username || ''}
            </span>
          </div>
          <button
            type="button"
            className={styles.logoutBtn}
            onClick={handleLogout}
            title="Đăng xuất khỏi tài khoản"
          >
            Đăng xuất
          </button>
        </div>
      </header>

      {/* Content */}
      <main className={styles.content}>
        <h1 className={styles.pageTitle}>
          Danh sách project <span className={styles.titleDot} />
        </h1>
        <p className={styles.pageSubtitle}>
          Chọn project để xem chi tiết chất lượng các service
        </p>

        <div className={styles.cardGrid}>
          {MOCK_PROJECTS.map((project) => (
            <div
              key={project.id}
              className={styles.projectCard}
              onClick={() => handleSelectProject(project.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleSelectProject(project.id);
                }
              }}
            >
              <div className={styles.cardTop}>
                <span className={styles.cardIcon}>{project.icon}</span>
                <div className={styles.cardInfo}>
                  <div className={styles.cardName}>{project.name}</div>
                  <div className={styles.cardSlug}>{project.slug}</div>
                </div>
              </div>

              <div className={styles.cardDesc}>{project.description}</div>

              <div className={styles.metricsRow}>
                <span className={styles.metric}>
                  Services: <span className={styles.metricValue}>{project.services}</span>
                </span>
                <span className={styles.metric}>
                  Flows: <span className={styles.metricValue}>{project.flows}</span>
                </span>
                <span className={styles.metric}>
                  Warns: <span className={styles.metricValue}>{project.warns}</span>
                </span>
              </div>

              <div className={styles.verdictRow}>
                <span className={`${styles.verdictBadge} ${styles.verdictPass}`}>
                  {project.verdicts.pass} pass
                </span>
                <span className={`${styles.verdictBadge} ${styles.verdictWarn}`}>
                  {project.verdicts.warn} warn
                </span>
                {project.verdicts.fail > 0 && (
                  <span className={`${styles.verdictBadge} ${styles.verdictFail}`}>
                    {project.verdicts.fail} fail
                  </span>
                )}
              </div>

              <div className={styles.lastAnalyzed}>
                <span className={styles.analysisDot} />
                Phân tích gần nhất: {project.lastAnalyzed}
              </div>
            </div>
          ))}

          {/* Add Project Placeholder */}
          <div className={styles.addCard}>
            <div className={styles.addIcon}>+</div>
            <div className={styles.addLabel}>Thêm project</div>
            <div className={styles.addHint}>Sắp ra mắt</div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProjectList;
