import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const ClientList = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await api.get('/clients');
      setClients(response.data.data);
    } catch (err) {
      setError(err.message || 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--spacing-2xl)' }}>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 className="page-title">Clients</h1>
              <p className="page-subtitle">Manage your therapy clients</p>
            </div>
            <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
              <Link to="/" className="btn btn-secondary">
                Back to Dashboard
              </Link>
              <button className="btn btn-primary" onClick={() => navigate('/clients/new')}>
                Add Client
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-error">{error}</div>
        )}

        {clients.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
            <h3 style={{ marginBottom: 'var(--spacing-md)' }}>No clients yet</h3>
            <p style={{ color: 'var(--gray-600)', marginBottom: 'var(--spacing-lg)' }}>
              Get started by adding your first client
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/clients/new')}>
              Add Your First Client
            </button>
          </div>
        ) : (
          <div className="grid">
            {clients.map((client) => (
              <Link
                key={client.id}
                to={`/clients/${client.id}`}
                className="card"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <h3 style={{ fontSize: '1.25rem', marginBottom: 'var(--spacing-sm)' }}>
                  {client.firstName} {client.lastName}
                </h3>
                {client.dateOfBirth && (
                  <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>
                    DOB: {new Date(client.dateOfBirth).toLocaleDateString()}
                  </p>
                )}
                {client.notes && (
                  <p style={{
                    color: 'var(--gray-600)',
                    marginTop: 'var(--spacing-sm)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {client.notes}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientList;
