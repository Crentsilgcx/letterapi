import { Link, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

function Navbar() {
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isReceptionist = user?.role === 'RECEPTIONIST';
  const hasReceptionAccess = isAdmin || isReceptionist;

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <Link to="/" className="nav-brand" aria-label="Letter Delivery Home">Letter Delivery</Link>
      <ul className="nav-links">
        <li>
          <Link to="/delivery" className={location.pathname === '/delivery' ? 'active' : ''}>Delivery Staff</Link>
        </li>
        {hasReceptionAccess && (
          <li>
            <Link to="/reception" className={location.pathname.startsWith('/reception') ? 'active' : ''}>Reception Staff</Link>
          </li>
        )}
        {isAdmin && (
          <li>
            <Link to="/admin/login" className={location.pathname.startsWith('/admin') ? 'active' : ''}>Administration</Link>
          </li>
        )}
      </ul>
      {isAuthenticated && (
        <button className="btn btn-secondary btn-small" onClick={logout} style={{ marginLeft: '16px' }}>
          Logout
        </button>
      )}
    </nav>
  );
}

export default Navbar;