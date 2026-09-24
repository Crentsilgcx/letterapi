import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DeliveryPersonHomepage from './DeliveryPersonHomepage';
import ReceptionDashboard from './ReceptionDashboard';
import AdminLoginPage from './AdminLoginPage';
import ProtectedRoute from './ProtectedRoute';
import { AuthProvider } from './AuthContext';
import Navbar from './Navbar';
import HomePage from './HomePage';
import './index.css';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/delivery" element={<DeliveryPersonHomepage />} />
      <Route path="/reception" element={<ReceptionDashboard />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminLoginPage />
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
          <AppRoutes />
        </main>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;