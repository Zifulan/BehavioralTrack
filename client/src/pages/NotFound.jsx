import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--gray-50)'
    }}>
      <div className="card" style={{ textAlign: 'center', maxWidth: '500px' }}>
        <h1 style={{ fontSize: '4rem', marginBottom: 'var(--spacing-md)', color: 'var(--primary)' }}>
          404
        </h1>
        <h2 style={{ marginBottom: 'var(--spacing-md)' }}>
          Page Not Found
        </h2>
        <p style={{ color: 'var(--gray-600)', marginBottom: 'var(--spacing-lg)' }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="btn btn-primary">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
