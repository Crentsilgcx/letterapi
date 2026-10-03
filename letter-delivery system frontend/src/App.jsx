import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DeliveryPersonHomepage from './DeliveryPersonHomepage';
import ReceptionDashboard from './ReceptionDashboard';
import AdminLoginPage from './AdminLoginPage';
import ReportsPage from './ReportsPage';
import ProtectedRoute from './ProtectedRoute';
import { AuthProvider } from './AuthContext';
import { ReceptionProvider } from './hooks/useReceptionContext';
import Navbar from './Navbar';
import HomePage from './HomePage';
import ReceptionLayout from './ReceptionLayout';
import ReceptionLoginPage from './ReceptionLoginPage';
import AdministrationPage from './AdministrationPage';
import { ErrorBoundary } from './ErrorBoundary';
import './index.css';

function AppRoutes() {
  return (
    <Routes>
      {/* Public entry point: anyone may choose Delivery or Reception. */}
      <Route path="/" element={<HomePage />} />
      <Route path="/delivery" element={<DeliveryPersonHomepage />} />

      {/* Reception login is a standalone login-only interface. ReceptionLayout
          redirects here whenever the visitor has no reception role. */}
      <Route path="/reception/login" element={<ReceptionLoginPage />} />

      <Route
        path="/reception"
        element={
          <ReceptionProvider>
            <ReceptionLayout />
          </ReceptionProvider>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<ReceptionDashboard />} />
        <Route
          path="record"
          element={
            <ProtectedRoute requiredRoles={['ADMIN', 'RECEPTIONIST']}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdministrationPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <main className="main-content">
          <ErrorBoundary>
            <AppRoutes />
          </ErrorBoundary>
        </main>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;