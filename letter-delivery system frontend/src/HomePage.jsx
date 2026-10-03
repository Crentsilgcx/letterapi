import { Link } from 'react-router-dom';
import { Mail, Package, LayoutDashboard, ArrowRight } from 'lucide-react';
import './tokens.css';
import './HomePage.css';

function HomePage() {
  return (
    <div className="home-page">
      <header className="home-header">
        <div className="home-brand">
          <span className="home-brand-mark" aria-hidden="true">
            <Mail size={28} />
          </span>
          <h1 className="home-title">Letter Delivery</h1>
        </div>
        <p className="home-lead">Select your role to continue</p>
      </header>

      <main className="home-main">
        <Link to="/delivery" className="home-card" aria-label="Delivery Person - Submit new deliveries">
          <div className="home-card-icon">
            <Package size={24} aria-hidden="true" />
          </div>
          <div className="home-card-content">
            <h2 className="home-card-title">Delivery Person</h2>
            <p className="home-card-text">Submit new deliveries with your contact information</p>
          </div>
          <span className="home-card-arrow" aria-hidden="true">
            <ArrowRight size={20} />
          </span>
        </Link>

        <Link to="/reception" className="home-card" aria-label="Receptionist - Manage incoming deliveries">
          <div className="home-card-icon">
            <LayoutDashboard size={24} aria-hidden="true" />
          </div>
          <div className="home-card-content">
            <h2 className="home-card-title">Receptionist</h2>
            <p className="home-card-text">View incoming deliveries, confirm receipts, and manage status</p>
          </div>
          <span className="home-card-arrow" aria-hidden="true">
            <ArrowRight size={20} />
          </span>
        </Link>
      </main>
    </div>
  );
}

export default HomePage;