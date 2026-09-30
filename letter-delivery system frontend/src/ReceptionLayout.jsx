import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

const RECEPTION_SUB_NAV = [
  { path: 'dashboard', label: 'Dashboard' },
  { path: 'record', label: 'Record' },
];

function ReceptionLayout() {
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isReceptionist = user?.role === 'RECEPTIONIST';
  const hasReceptionAccess = isAdmin || isReceptionist;

  if (!hasReceptionAccess) {
    return null;
  }

  return (
    <div className="reception-layout">
      <nav className="reception-subnav" role="navigation" aria-label="Reception sub-navigation">
        <ul className="reception-subnav-list">
          {RECEPTION_SUB_NAV.map(({ path, label }) => (
            <li key={path}>
              <NavLink
                to={`/reception/${path}`}
                className={({ isActive }) => `reception-subnav-link${isActive ? ' active' : ''}`}
                aria-current={location.pathname === `/reception/${path}` ? 'page' : undefined}
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <Outlet />
    </div>
  );
}

export default ReceptionLayout;