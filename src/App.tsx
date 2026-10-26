import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { MOCK_QC_DATA } from './data/mock';
import { useApp } from './hooks/useApp';
import { useAuth } from './contexts/AuthContext';
import { Login } from './screens/Login';
import { RoleLogin } from './screens/RoleLogin';
import { Dashboard } from './screens/Dashboard';
import { LiveAnalysis } from './screens/LiveAnalysis';

export function App() {
  const navigate = useNavigate();
  const { currentUser: authUser, logout: authLogout } = useAuth();

  const {
    currentView,
    currentUser,
    currentRole,
    prefilledUsername,
    handleLoginSuccess,
    handleLogout: internalLogout,
    handleOpenRoleGuide,
    handleSelectRoleFromGuide,
    handleGoToLogin,
  } = useApp();

  const [viewMode, setViewMode] = useState<'mock' | 'live'>('live');

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash !== '#live') {
        window.location.hash = '#live';
      }
    };

    if (window.location.hash !== '#live') {
      window.location.hash = '#live';
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleBackToProjects = () => {
    navigate('/projects');
  };

  // Logout: xoá auth context rồi redirect về /login
  const handleLogout = async () => {
    await authLogout();
    await internalLogout();
    navigate('/login', { replace: true });
  };

  // Khi đã auth qua AuthContext (router), skip internal login → render Dashboard trực tiếp
  // useApp sẽ tự detect authService.isAuthenticated() → 'dashboard' nếu có session
  // Nhưng mock auth từ AuthLogin dùng user khác (không khớp DUMMY_ACCOUNTS) nên useApp
  // có thể trả currentView = 'login'. Cần force vào dashboard khi có authUser.
  const isAuthenticatedViaRouter = Boolean(authUser);
  const effectiveView = isAuthenticatedViaRouter ? 'dashboard' : currentView;
  const effectiveRole = currentRole || authUser?.role || 'developer';

  return (
    <div className="app-container">
      {/* Thanh tab hiển thị chế độ phân tích */}
      <div className="portal-top-nav-tabs" role="tablist" aria-label="Portal Navigation">
        <button
          type="button"
          role="tab"
          aria-selected={true}
          className="portal-nav-tab active"
          title="Xem phân tích chất lượng hệ thống trực tiếp từ Backend API"
        >
          <span className="live-nav-dot" />
          <span>Phân tích trực tiếp (Live)</span>
        </button>
      </div>

      {/* Hiển thị màn hình tương ứng */}
      {viewMode === 'live' ? (
        <LiveAnalysis onBackToProjects={handleBackToProjects} />
      ) : (
        <>
          {effectiveView === 'login' && (
            <Login
              onLoginSuccess={handleLoginSuccess}
              onExploreRoles={handleOpenRoleGuide}
              initialUsername={prefilledUsername}
            />
          )}

          {effectiveView === 'role_guide' && (
            <RoleLogin
              onSelectRole={handleSelectRoleFromGuide}
              onGoToLogin={handleGoToLogin}
            />
          )}

          {effectiveView === 'dashboard' && effectiveRole && (
            <Dashboard
              currentRole={effectiveRole}
              currentUser={currentUser || authUser}
              onLogout={handleLogout}
              onResetRole={handleOpenRoleGuide}
              portalData={MOCK_QC_DATA}
            />
          )}
        </>
      )}
    </div>
  );
}

export default App;
