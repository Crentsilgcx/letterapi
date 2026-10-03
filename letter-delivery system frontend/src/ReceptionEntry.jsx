import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

function ReceptionEntry() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // If already authenticated, go to dashboard
        navigate('/reception/dashboard', { replace: true });
      } else {
        // If not authenticated, go to login with return path
        navigate('/reception/login', { 
          replace: true, 
          state: { from: location.pathname } 
        });
      }
    }
  }, [isAuthenticated, isLoading, navigate, location]);

  // Show loading state while checking auth
  return (
    <div className="loading-container">
      <div className="loading-spinner" />
    </div>
  );
}

export default ReceptionEntry;