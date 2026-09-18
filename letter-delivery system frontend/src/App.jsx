import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DeliveryPersonHomepage from './DeliveryPersonHomepage';
import ReceptionDashboard from './ReceptionDashboard';
import Navbar from './Navbar';
import HomePage from './HomePage';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/delivery" element={<DeliveryPersonHomepage />} />
          <Route path="/reception" element={<ReceptionDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;