import { Link } from 'react-router-dom';

const ClientDetail = () => {
  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <Link to="/clients" className="btn btn-secondary">
            Back to Clients
          </Link>
        </div>
        <div className="card">
          <h2>Client Detail Page</h2>
          <p>This page will show detailed client information and sessions.</p>
          <p style={{ marginTop: 'var(--spacing-md)', color: 'var(--gray-600)' }}>
            Coming soon in the next iteration!
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClientDetail;
