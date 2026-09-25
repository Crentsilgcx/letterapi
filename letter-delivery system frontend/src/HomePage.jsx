import { Link } from 'react-router-dom';

function HomePage() {
  return (
    <div className="home-page">
      <h1 className="page-title">Letter Delivery System</h1>
      <p className="page-lead">Select your role to continue</p>
      <div className="role-selection">
        <Link to="/delivery" className="role-card btn btn-primary btn-large">
          <h3>Delivery Person</h3>
          <p>Submit new deliveries with recipient details, organisation, and route information</p>
        </Link>
        <Link to="/reception" className="role-card btn btn-primary btn-large">
          <h3>Receptionist</h3>
          <p>View incoming deliveries, confirm receipts, and manage delivery status</p>
        </Link>
      </div>
      <div className="home-actions">
      </div>
    </div>
  );
}

export default HomePage;