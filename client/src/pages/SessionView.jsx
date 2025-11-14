import { Link } from 'react-router-dom';

const SessionView = () => {
  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <Link to="/" className="btn btn-secondary">
            Back to Dashboard
          </Link>
        </div>
        <div className="card">
          <h2>Session View Page</h2>
          <p>This page will display the active session with behavior tracking counters and timers.</p>
          <p style={{ marginTop: 'var(--spacing-md)', color: 'var(--gray-600)' }}>
            Coming soon in the next iteration!
          </p>
        </div>
      </div>
    </div>
  );
};

export default SessionView;
