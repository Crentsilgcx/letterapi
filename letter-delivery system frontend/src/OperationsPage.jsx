import { useAuth } from './AuthContext';
import { Link, useLocation, useNavigate, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import ReceptionDashboard from './ReceptionDashboard';
import AdministrationPage from './AdministrationPage';
import { ReceptionProvider } from './hooks/useReceptionContext';

function OperationsTabs() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const tabs = [
    { path: 'reception', label: 'Reception', count: null },
    ...(isAdmin ? [{ path: 'employees', label: 'Employees', count: null }] : []),
    ...(isAdmin ? [{ path: 'organizations', label: 'Organizations', count: null }] : []),
  ];

  return (
    <div className="operations-tabs">
      {tabs.map((tab) => (
        <Link
          key={tab.path}
          to={tab.path}
          className={`operations-tab ${location.pathname.endsWith('/' + tab.path) || location.pathname === '/operations/' + tab.path ? 'active' : ''}`}
        >
          {tab.label}
          {tab.count !== null && <span className="tab-count">{tab.count}</span>}
        </Link>
      ))}
    </div>
  );
}

function OperationsLayout() {
  const { isAuthenticated, user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="container">
      <div className="form-card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Operations</h2>
            <p className="card-subtitle">Unified operational workspace</p>
          </div>
        </div>

        <OperationsTabs />

        <div className="tab-content">
          <Routes>
            <Route
              path="reception"
              element={
                <ReceptionProvider>
                  <ReceptionDashboard />
                </ReceptionProvider>
              }
            />
            {isAdmin && (
              <>
                <Route path="employees" element={<AdministrationPage initialTab="employees" />} />
                <Route path="organizations" element={<AdministrationPage initialTab="organizations" />} />
              </>
            )}
            <Route index element={<Navigate to="reception" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default function OperationsRoutes() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  if (isLoading) {
    return (
      <div className="container">
        <div className="loading-container">
          <div className="loading-spinner" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  // Reception and admin both require authentication
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  // Allow receptionists and admins to access operations
  const hasAccess = isAdmin || user?.role === 'RECEPTIONIST';
  
  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return <OperationsLayout />;
}