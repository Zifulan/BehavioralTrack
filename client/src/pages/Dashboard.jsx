import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 className="page-title">
                Welcome, {user?.firstName}!
              </h1>
              <p className="page-subtitle">Behavior Tracking Dashboard</p>
            </div>
            <button onClick={logout} className="btn btn-secondary">
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3">
          <Link to="/clients" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: 'var(--spacing-sm)' }}>
              Clients
            </h3>
            <p style={{ color: 'var(--gray-600)' }}>
              Manage your clients and their information
            </p>
          </Link>

          <div className="card" style={{ opacity: 0.6 }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: 'var(--spacing-sm)' }}>
              Active Sessions
            </h3>
            <p style={{ color: 'var(--gray-600)' }}>
              View and manage ongoing therapy sessions
            </p>
            <small style={{ color: 'var(--gray-500)', display: 'block', marginTop: 'var(--spacing-sm)' }}>
              Coming soon
            </small>
          </div>

          <Link to="/analytics" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: 'var(--spacing-sm)' }}>
              Analytics & Trends
            </h3>
            <p style={{ color: 'var(--gray-600)' }}>
              View insights and behavior tracking statistics
            </p>
          </Link>
        </div>

        <div className="card" style={{ marginTop: 'var(--spacing-xl)' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--spacing-lg)' }}>
            Quick Start Guide
          </h2>
          <ol style={{ paddingLeft: 'var(--spacing-xl)', lineHeight: 1.8 }}>
            <li>Add your clients using the "Clients" section</li>
            <li>Start a new therapy session for a client</li>
            <li>Track behaviors using tally counters or duration timers</li>
            <li>End the session and export data for reporting</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
