import { useState, useEffect } from 'react';
import { MOCK_QC_DATA } from './data/mock';
import { useApp } from './hooks/useApp';
import { Login } from './screens/Login';
import { RoleLogin } from './screens/RoleLogin';
import { Dashboard } from './screens/Dashboard';
import { LiveAnalysis } from './screens/LiveAnalysis';

export function App() {
  const {
    currentView,
    currentUser,
    currentRole,
    prefilledUsername,
    handleLoginSuccess,
    handleLogout,
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
          {currentView === 'login' && (
            <Login
              onLoginSuccess={handleLoginSuccess}
              onExploreRoles={handleOpenRoleGuide}
              initialUsername={prefilledUsername}
            />
          )}

          {currentView === 'role_guide' && (
            <RoleLogin
              onSelectRole={handleSelectRoleFromGuide}
              onGoToLogin={handleGoToLogin}
            />
          )}

          {currentView === 'dashboard' && currentRole && (
            <Dashboard
              currentRole={currentRole}
              currentUser={currentUser}
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
