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

  const [viewMode, setViewMode] = useState<'mock' | 'live'>(() => {
    return window.location.hash === '#live' ? 'live' : 'mock';
  });

  useEffect(() => {
    const handleHashChange = () => {
      setViewMode(window.location.hash === '#live' ? 'live' : 'mock');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSwitchToMock = () => {
    setViewMode('mock');
    window.location.hash = '';
  };

  const handleSwitchToLive = () => {
    setViewMode('live');
    window.location.hash = '#live';
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
      {/* Thanh chuyển đổi chế độ Mock / Live API */}
      <div className="portal-top-nav-tabs" role="tablist" aria-label="Portal Mode Switcher">
        <button
          type="button"
          role="tab"
          aria-selected={viewMode === 'mock'}
          className={`portal-nav-tab ${viewMode === 'mock' ? 'active' : ''}`}
          onClick={handleSwitchToMock}
          title="Chế độ hiển thị dữ liệu mô phỏng"
        >
          <span>Mô phỏng (Mock)</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={viewMode === 'live'}
          className={`portal-nav-tab ${viewMode === 'live' ? 'active' : ''}`}
          onClick={handleSwitchToLive}
          title="Xem phân tích trực tiếp từ Backend API thật"
        >
          <span className="live-nav-dot" />
          <span>Dữ liệu thật (API)</span>
        </button>
      </div>

      {/* Hiển thị màn hình tương ứng */}
      {viewMode === 'live' ? (
        <LiveAnalysis onBackToMock={handleSwitchToMock} />
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
