import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import ReceptionSubNav from './components/ReceptionSubNav';

function ReceptionLayout() {
  const location = useLocation();
  const { user, isLoading } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isReceptionist = user?.role === 'RECEPTIONIST';
  const hasReceptionAccess = isAdmin || isReceptionist;

  if (isLoading) {
    return (
      <div className="reception-auth-loading">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!hasReceptionAccess) {
    return (
      <Navigate to="/reception/login" replace state={{ from: location }} />
    );
  }

  return (
    <div className="reception-layout">
      <ReceptionSubNav />
      <Outlet />
    </div>
  );
}

export default ReceptionLayout;