import { Link  } from 'react-router-dom';
// import {useLocation} from 'react-router-dom';

function Navbar() {
  // const location = useLocation();

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <Link to="/" className="nav-brand" aria-label="Letter Delivery Home">Letter Delivery</Link>
      {/* <ul className="nav-links">
        <li>
          <Link to="/delivery" className={location.pathname === '/delivery' ? 'active' : ''}>Delivery Person</Link>
        </li>
        <li>
          <Link to="/receptionist" className={location.pathname === '/receptionist' ? 'active' : ''}>Receptionist</Link>
        </li>
        <li>
          <Link to="/track" className={location.pathname === '/track' ? 'active' : ''}>Track Delivery</Link>
        </li>
      </ul> */}
    </nav>
  );
}

export default Navbar;