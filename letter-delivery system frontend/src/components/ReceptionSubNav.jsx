import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogOut, User } from 'lucide-react';
import '../tokens.css';
import './ReceptionSubNav.css';

const SUB_NAV_ITEMS = [
  { path: 'dashboard', label: 'Dashboard' },
  { path: 'record', label: 'Record' },
];

function ReceptionSubNav() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isReceptionist = user?.role === 'RECEPTIONIST';
  const hasReceptionAccess = isAdmin || isReceptionist;

  if (!hasReceptionAccess) {
    return null;
  }

  const displayName = user?.displayName || user?.username || 'User';
  const role = user?.role || '';

  return (
    <nav className="reception-subnav" role="navigation" aria-label="Reception sub-navigation">
      <div className="reception-subnav-inner">
        <div className="reception-subnav-track" role="tablist">
          {SUB_NAV_ITEMS.map(({ path, label }) => {
            const isActive = location.pathname === `/reception/${path}`;
            return (
              <NavLink
                key={path}
                to={`/reception/${path}`}
                className={`reception-subnav-link${isActive ? ' active' : ''}`}
                role="tab"
                aria-selected={isActive}
                aria-current={isActive ? 'page' : undefined}
              >
                {label}
              </NavLink>
            );
          })}
        </div>
        <div className="reception-subnav-user">
          <div className="user-info">
            <span className="user-label">Signed in as</span>
            <span className="user-name">{displayName}</span>
            <span className="user-role-separator" aria-hidden="true">·</span>
            <span className="user-role">
              <User size={14} aria-hidden="true" />
              {role}
            </span>
          </div>
          <button
            className="reception-subnav-logout"
            onClick={logout}
            aria-label="Logout"
            title="Logout"
          >
            <LogOut size={18} aria-hidden="true" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

export default ReceptionSubNav;