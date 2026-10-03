import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from './AuthContext';
import { Menu, X } from 'lucide-react';
import './tokens.css';
import './Navbar.css';

function Navbar() {
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { path: '/delivery', label: 'Delivery' },
    { path: '/reception', label: 'Reception' },
    ...(isAdmin ? [{ path: '/admin/login', label: 'Administration' }] : []),
  ];

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <Link to="/" className="nav-brand" aria-label="Letter Delivery Home">Letter Delivery</Link>

      <button
        className="nav-toggle"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-expanded={isMenuOpen}
        aria-controls="nav-links"
        aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
      >
        {isMenuOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
      </button>

      <ul className={`nav-links${isMenuOpen ? ' open' : ''}`} id="nav-links" role="menubar">
        {navLinks.map((link) => (
          <li key={link.path} role="none">
            <Link
              to={link.path}
              className={location.pathname === link.path || (link.path === '/reception' && location.pathname.startsWith('/reception')) ? 'active' : ''}
              role="menuitem"
              onClick={() => setIsMenuOpen(false)}
            >
              {link.label}
            </Link>
          </li>
        ))}
        {isAuthenticated && (
          <li role="none">
            <button
              className="btn btn-secondary btn-small navbar-logout"
              onClick={() => { logout(); setIsMenuOpen(false); }}
              role="menuitem"
            >
              Logout
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;