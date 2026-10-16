import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from './AuthContext';
import { Menu, X } from 'lucide-react';
import './tokens.css';
import './Navbar.css';

function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <Link to="/reception" className="nav-brand" aria-label="Reception Dashboard">Reception</Link>

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