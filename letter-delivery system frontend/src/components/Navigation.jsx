import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Mail, LogOut, Package, LayoutDashboard } from 'lucide-react';
import '../tokens.css';
import './Navigation.css';

function Navigation() {
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isReceptionist = user?.role === 'RECEPTIONIST';
  const hasReceptionAccess = isAdmin || isReceptionist;

  const navItems = [
    { path: '/delivery', label: 'Delivery', icon: Package },
    { path: '/reception/dashboard', label: 'Reception', icon: LayoutDashboard, show: hasReceptionAccess },
  ].filter(item => item.show !== false);

  const isCurrent = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <>
      <nav className="global-nav" role="navigation" aria-label="Main navigation">
        <Link to="/" className="nav-brand" aria-label="Letter Delivery Home">
          <span className="brand-mark" aria-hidden="true">
            <Mail size={20} />
          </span>
          <span className="brand-text">Letter Delivery</span>
        </Link>

        <ul className="nav-links" role="menubar">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = isCurrent(path);
            return (
              <li key={label} role="none">
                <Link
                  to={path}
                  className={`nav-link${isActive ? ' active' : ''}`}
                  role="menuitem"
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon size={18} aria-hidden="true" />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {isAuthenticated && (
          <button
            className="nav-logout"
            onClick={logout}
            aria-label="Logout"
            title="Logout"
          >
            <LogOut size={20} aria-hidden="true" />
          </button>
        )}
      </nav>

      <nav className="mobile-bottom-nav" role="navigation" aria-label="Mobile navigation">
        <ul className="mobile-nav-list" role="menubar">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = isCurrent(path);
            return (
              <li key={label} role="none">
                <Link
                  to={path}
                  className={`mobile-nav-link${isActive ? ' active' : ''}`}
                  role="menuitem"
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon size={22} aria-hidden="true" />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
          {isAuthenticated && (
            <li role="none">
              <button
                className="mobile-nav-link mobile-nav-logout"
                onClick={logout}
                role="menuitem"
                aria-label="Logout"
              >
                <LogOut size={22} aria-hidden="true" />
                <span>Logout</span>
              </button>
            </li>
          )}
        </ul>
      </nav>
    </>
  );
}

export default Navigation;